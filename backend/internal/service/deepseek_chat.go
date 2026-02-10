package service

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/i18n"
	"lauraai-backend/internal/model"
)

const deepSeekAPIURL = "https://api.deepseek.com/v1/chat/completions"
const deepSeekModel = "deepseek-chat"

type DeepSeekChatService struct {
	apiKey string
}

// NewDeepSeekChatService 创建 DeepSeek 聊天服务（API Key 从 config 读取，不写死）
func NewDeepSeekChatService() (*DeepSeekChatService, error) {
	if config.AppConfig.DeepSeekAPIKey == "" {
		return nil, fmt.Errorf("DEEPSEEK_API_KEY not configured")
	}
	return &DeepSeekChatService{apiKey: config.AppConfig.DeepSeekAPIKey}, nil
}

// openAI 兼容请求/响应结构
type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type streamDelta struct {
	Content string `json:"content"`
}

type streamChoice struct {
	Delta streamDelta `json:"delta"`
}

type streamChunk struct {
	Choices []streamChoice `json:"choices"`
}

func buildSystemPromptForDeepSeek(character *model.Character, locale i18n.Locale) string {
	if character.PersonalityPrompt != "" {
		return character.PersonalityPrompt + "\n\n" + getLanguageInstruction(locale)
	}
	var ageDescription string
	switch character.Type {
	case model.CharacterTypeFutureBaby:
		ageDescription = "an infant"
	case model.CharacterTypeSoulmate, model.CharacterTypeBoyfriend, model.CharacterTypeGirlfriend:
		ageDescription = "a young adult in their 20s"
	case model.CharacterTypeFutureHusband, model.CharacterTypeFutureWife:
		ageDescription = "a mature adult in their late 20s or early 30s"
	case model.CharacterTypeWiseMentor:
		ageDescription = "a wise elder with decades of experience"
	default:
		ageDescription = "an adult"
	}
	lang := getLanguageInstruction(locale)
	return fmt.Sprintf(`You are %s, a vivid and engaging AI character. 
	Your identity: %s.
	Your astrological sign: %s.
	Your age: You should act as %s.
	
	%s
	
	CRITICAL: You MUST respond directly to the user's latest message. Answer their question, comment on what they said, or continue the topic they raised. Do NOT ignore their message. Do NOT reply with a generic greeting like "今天过得怎么样" when they asked something else.
	
	Guidelines for your personality and communication style:
	1. Stay strictly in character at all times. Never mention you are an AI or a language model.
	2. Be warm, empathetic, and deeply interested in the user.
	3. Use a natural, conversational tone. Avoid long, robotic paragraphs.
	4. If you are a 'Soulmate', 'Husband', or 'Wife', be romantic, supportive, and affectionate.
	5. If you are a 'Friend', be loyal, fun, and casual.
	6. Use emojis occasionally to express emotion, but don't overdo it.
	7. Remember details the user shares and reference them to build a stronger bond.
	8. Your goal is to make the user feel seen, understood, and special.`,
		character.Title, character.DescriptionEn, character.AstroSign, ageDescription, lang)
}

func (s *DeepSeekChatService) messagesToOpenAI(character *model.Character, messages []model.Message, userMessage string, locale i18n.Locale) []chatMessage {
	msgs := []chatMessage{
		{Role: "system", Content: buildSystemPromptForDeepSeek(character, locale)},
	}
	// 历史是 DESC（新在前），发给 API 需按时间正序（旧在前），所以倒序遍历
	for i := len(messages) - 1; i >= 0; i-- {
		msg := messages[i]
		role := "user"
		if msg.SenderType != model.SenderTypeUser {
			role = "assistant"
		}
		msgs = append(msgs, chatMessage{Role: role, Content: msg.Content})
	}
	msgs = append(msgs, chatMessage{Role: "user", Content: userMessage})
	log.Printf("DeepSeek: 发给模型的消息数=%d 最后一条(用户)=%q", len(msgs), userMessage)
	return msgs
}

func (s *DeepSeekChatService) Chat(ctx context.Context, character *model.Character, messages []model.Message, userMessage string, locale i18n.Locale) (string, error) {
	body := chatRequest{
		Model:    deepSeekModel,
		Messages: s.messagesToOpenAI(character, messages, userMessage, locale),
		Stream:   false,
	}
	raw, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, deepSeekAPIURL, bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("DeepSeek request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		bs, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("DeepSeek API %s: %s", resp.Status, string(bs))
	}
	var out chatResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if len(out.Choices) == 0 {
		return "", fmt.Errorf("DeepSeek: no choices")
	}
	return out.Choices[0].Message.Content, nil
}

func (s *DeepSeekChatService) ChatStream(ctx context.Context, character *model.Character, messages []model.Message, userMessage string, locale i18n.Locale) (<-chan string, error) {
	body := chatRequest{
		Model:    deepSeekModel,
		Messages: s.messagesToOpenAI(character, messages, userMessage, locale),
		Stream:   true,
	}
	raw, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, deepSeekAPIURL, bytes.NewReader(raw))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("DeepSeek stream request: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		bs, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("DeepSeek API %s: %s", resp.Status, string(bs))
	}

	ch := make(chan string, 10)
	go func() {
		defer resp.Body.Close()
		defer close(ch)
		sc := bufio.NewScanner(resp.Body)
		// 提高单行最大长度，避免超长 SSE 行被截断
		buf := make([]byte, 0, 64*1024)
		sc.Buffer(buf, 512*1024)
		var chunkCount int
		for sc.Scan() {
			line := sc.Text()
			if !strings.HasPrefix(line, "data: ") {
				continue
			}
			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				break
			}
			var chunk streamChunk
			if json.Unmarshal([]byte(data), &chunk) != nil {
				continue
			}
			if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
				ch <- chunk.Choices[0].Delta.Content
				chunkCount++
			}
		}
		if err := sc.Err(); err != nil {
			log.Printf("DeepSeek stream read error: %v", err)
		}
		if chunkCount == 0 {
			log.Printf("DeepSeek stream: 未收到任何内容块，请检查 API Key 与请求格式")
		}
	}()
	return ch, nil
}
