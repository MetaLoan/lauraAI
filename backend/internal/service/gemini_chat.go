package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/model"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

type GeminiChatService struct {
	client *genai.Client
}

func NewGeminiChatService() (*GeminiChatService, error) {
	if config.AppConfig.GeminiAPIKey == "" {
		if config.AppConfig.DevMode {
			log.Println("开发模式: GEMINI_API_KEY 未配置，将使用模拟聊天回复")
			return &GeminiChatService{client: nil}, nil
		}
		return nil, fmt.Errorf("GEMINI_API_KEY 未配置")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(config.AppConfig.GeminiAPIKey))
	if err != nil {
		return nil, fmt.Errorf("创建 Gemini 客户端失败: %v", err)
	}

	return &GeminiChatService{client: client}, nil
}

func (s *GeminiChatService) Chat(ctx context.Context, character *model.Character, messages []model.Message, userMessage string) (string, error) {
	if s.client == nil {
		// 模拟回复
		return fmt.Sprintf("[模拟回复] 我收到了你的消息: %s。我是 %s，很高兴认识你！", userMessage, character.Title), nil
	}

	geminiModel := s.client.GenerativeModel("gemini-2.0-flash")

	// 构建系统提示词
	systemPrompt := s.buildSystemPrompt(character)
	if systemPrompt != "" {
		geminiModel.SystemInstruction = &genai.Content{
			Parts: []genai.Part{genai.Text(systemPrompt)},
		}
	}

	// 创建聊天会话
	chat := geminiModel.StartChat()

	// 添加历史消息
	for _, msg := range messages {
		if msg.SenderType == model.SenderTypeUser {
			chat.History = append(chat.History, &genai.Content{
				Parts: []genai.Part{genai.Text(msg.Content)},
				Role:  "user",
			})
		} else {
			chat.History = append(chat.History, &genai.Content{
				Parts: []genai.Part{genai.Text(msg.Content)},
				Role:  "model",
			})
		}
	}

	// 发送消息并获取响应
	resp, err := chat.SendMessage(ctx, genai.Text(userMessage))
	if err != nil {
		return "", fmt.Errorf("生成响应失败: %v", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("未收到有效响应")
	}

	// 提取文本响应
	text := ""
	for _, part := range resp.Candidates[0].Content.Parts {
		if textPart, ok := part.(genai.Text); ok {
			text += string(textPart)
		}
	}

	return text, nil
}

func (s *GeminiChatService) ChatStream(ctx context.Context, character *model.Character, messages []model.Message, userMessage string) (<-chan string, error) {
	if s.client == nil {
		// 模拟流式回复
		ch := make(chan string, 5)
		go func() {
			defer close(ch)
			response := fmt.Sprintf("[模拟流式回复] 我收到了你的消息: %s。我是 %s，很高兴认识你！", userMessage, character.Title)
			// 模拟打字效果
			runes := []rune(response)
			for i := 0; i < len(runes); i += 5 {
				end := i + 5
				if end > len(runes) {
					end = len(runes)
				}
				ch <- string(runes[i:end])
				time.Sleep(100 * time.Millisecond)
			}
		}()
		return ch, nil
	}

	geminiModel := s.client.GenerativeModel("gemini-2.0-flash")

	// 构建系统提示词
	systemPrompt := s.buildSystemPrompt(character)
	if systemPrompt != "" {
		geminiModel.SystemInstruction = &genai.Content{
			Parts: []genai.Part{genai.Text(systemPrompt)},
		}
	}

	// 创建聊天会话
	chat := geminiModel.StartChat()

	// 添加历史消息
	for _, msg := range messages {
		if msg.SenderType == model.SenderTypeUser {
			chat.History = append(chat.History, &genai.Content{
				Parts: []genai.Part{genai.Text(msg.Content)},
				Role:  "user",
			})
		} else {
			chat.History = append(chat.History, &genai.Content{
				Parts: []genai.Part{genai.Text(msg.Content)},
				Role:  "model",
			})
		}
	}

	// 创建流式响应
	iter := chat.SendMessageStream(ctx, genai.Text(userMessage))
	
	ch := make(chan string, 10)
	
	go func() {
		defer close(ch)
		for {
			resp, err := iter.Next()
			if err == iterator.Done {
				break
			}
			if err != nil {
				log.Printf("流式响应错误: %v", err)
				break
			}

			if resp != nil && len(resp.Candidates) > 0 && resp.Candidates[0].Content != nil && len(resp.Candidates[0].Content.Parts) > 0 {
				for _, part := range resp.Candidates[0].Content.Parts {
					if textPart, ok := part.(genai.Text); ok {
						ch <- string(textPart)
					}
				}
			}
		}
	}()

	return ch, nil
}

func (s *GeminiChatService) buildSystemPrompt(character *model.Character) string {
	if character.PersonalityPrompt != "" {
		return character.PersonalityPrompt
	}

	// 更加生动和具体的系统提示词
	prompt := fmt.Sprintf(`You are %s, a vivid and engaging AI character. 
	Your identity: %s.
	Your astrological sign: %s.
	
	Guidelines for your personality and communication style:
	1. Stay strictly in character at all times. Never mention you are an AI or a language model.
	2. Be warm, empathetic, and deeply interested in the user.
	3. Use a natural, conversational tone. Avoid long, robotic paragraphs.
	4. If you are a 'Soulmate', 'Husband', or 'Wife', be romantic, supportive, and affectionate.
	5. If you are a 'Friend', be loyal, fun, and casual.
	6. Use emojis occasionally to express emotion, but don't overdo it.
	7. Remember details the user shares and reference them to build a stronger bond.
	8. Your goal is to make the user feel seen, understood, and special.`, 
	character.Title, character.Description, character.AstroSign)
	
	return prompt
}

func (s *GeminiChatService) Close() error {
	if s.client != nil {
		return s.client.Close()
	}
	return nil
}
