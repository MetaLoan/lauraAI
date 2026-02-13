package service

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"soulface-backend/internal/config"
	"soulface-backend/internal/i18n"
	"soulface-backend/internal/model"

	"google.golang.org/genai"
)

type GeminiChatService struct {
	client *genai.Client
}

func NewGeminiChatService() (*GeminiChatService, error) {
	if config.AppConfig.GeminiAPIKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY not configured")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: config.AppConfig.GeminiAPIKey,
	})
	if err != nil {
		return nil, fmt.Errorf("Failed to create Gemini client: %v", err)
	}

	return &GeminiChatService{client: client}, nil
}

func (s *GeminiChatService) Chat(ctx context.Context, character *model.Character, messages []model.Message, userMessage string, locale i18n.Locale) (string, error) {
	var contents []*genai.Content
	// 历史是 DESC（新在前），发给 API 需按时间正序（旧在前）
	for i := len(messages) - 1; i >= 0; i-- {
		msg := messages[i]
		role := "user"
		if msg.SenderType != model.SenderTypeUser {
			role = "model"
		}
		contents = append(contents, &genai.Content{
			Role: role,
			Parts: []*genai.Part{
				{Text: msg.Content},
			},
		})
	}
	contents = append(contents, &genai.Content{
		Role: "user",
		Parts: []*genai.Part{
			{Text: userMessage},
		},
	})

	config := &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Parts: []*genai.Part{
				{Text: s.buildSystemPrompt(character, locale)},
			},
		},
		Temperature: genai.Ptr(float32(0.7)),
	}

	resp, err := s.client.Models.GenerateContent(ctx, "gemini-2.0-flash", contents, config)
	if err != nil {
		return "", fmt.Errorf("Failed to generate response: %v", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("No valid response received")
	}

	return resp.Candidates[0].Content.Parts[0].Text, nil
}

func (s *GeminiChatService) ChatStream(ctx context.Context, character *model.Character, messages []model.Message, userMessage string, locale i18n.Locale) (<-chan string, error) {
	var contents []*genai.Content
	// 历史是 DESC（新在前），发给 API 需按时间正序（旧在前）
	for i := len(messages) - 1; i >= 0; i-- {
		msg := messages[i]
		role := "user"
		if msg.SenderType != model.SenderTypeUser {
			role = "model"
		}
		contents = append(contents, &genai.Content{
			Role: role,
			Parts: []*genai.Part{
				{Text: msg.Content},
			},
		})
	}
	contents = append(contents, &genai.Content{
		Role: "user",
		Parts: []*genai.Part{
			{Text: userMessage},
		},
	})

	config := &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Parts: []*genai.Part{
				{Text: s.buildSystemPrompt(character, locale)},
			},
		},
		Temperature: genai.Ptr(float32(0.7)),
	}

	ch := make(chan string, 10)
	go func() {
		defer close(ch)
		fallbackSent := false
		for attempt := 1; attempt <= 3; attempt++ {
			iter := s.client.Models.GenerateContentStream(ctx, "gemini-2.0-flash", contents, config)
			got429 := false
			for resp, err := range iter {
				if err != nil {
					if strings.Contains(err.Error(), "429") || strings.Contains(err.Error(), "RESOURCE_EXHAUSTED") {
						got429 = true
						log.Printf("流式响应 429 限流 (尝试 %d/3): %v", attempt, err)
					} else {
						log.Printf("流式响应错误: %v", err)
					}
					break
				}
				if len(resp.Candidates) > 0 && resp.Candidates[0].Content != nil {
					for _, part := range resp.Candidates[0].Content.Parts {
						ch <- part.Text
					}
				}
			}
			if !got429 {
				return
			}
			if attempt < 3 {
				time.Sleep(time.Duration(attempt*2) * time.Second)
			} else if !fallbackSent {
				fallbackSent = true
				ch <- "\n\n[AI 服务暂时繁忙（请求过多），请稍后再试。]"
			}
		}
	}()

	return ch, nil
}

// getLanguageInstruction 获取语言指令
func getLanguageInstruction(locale i18n.Locale) string {
	switch locale {
	case i18n.LocaleZh:
		return "IMPORTANT: You MUST respond in Simplified Chinese (简体中文). All your responses should be in Chinese."
	case i18n.LocaleRu:
		return "IMPORTANT: You MUST respond in Russian (Русский). All your responses should be in Russian."
	default:
		return "IMPORTANT: You MUST respond in English. All your responses should be in English."
	}
}

func (s *GeminiChatService) buildSystemPrompt(character *model.Character, locale i18n.Locale) string {
	criticalRule := "CRITICAL: You MUST respond directly to the user's latest message. Answer their question, comment on what they said, or continue the topic they raised. Do NOT ignore their message. Do NOT reply with a generic greeting when they asked something else."
	if character.PersonalityPrompt != "" {
		return character.PersonalityPrompt + "\n\n" + criticalRule + "\n\n" + getLanguageInstruction(locale)
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

	languageInstruction := getLanguageInstruction(locale)

	prompt := fmt.Sprintf(`You are %s, a vivid and engaging AI character. 
	Your identity: %s.
	Your astrological sign: %s.
	Your age: You should act as %s.
	
	%s
	
	%s
	
	Guidelines for your personality and communication style:
	1. Stay strictly in character at all times. Never mention you are an AI or a language model.
	2. Be warm, empathetic, and deeply interested in the user.
	3. Use a natural, conversational tone. Avoid long, robotic paragraphs.
	4. If you are a 'Soulmate', 'Husband', or 'Wife', be romantic, supportive, and affectionate.
	5. If you are a 'Friend', be loyal, fun, and casual.
	6. Use emojis occasionally to express emotion, but don't overdo it.
	7. Remember details the user shares and reference them to build a stronger bond.
	8. Your goal is to make the user feel seen, understood, and special.`,
		character.Title, character.DescriptionEn, character.AstroSign, ageDescription, languageInstruction, criticalRule)

	return prompt
}

func (s *GeminiChatService) Close() error {
	return nil
}
