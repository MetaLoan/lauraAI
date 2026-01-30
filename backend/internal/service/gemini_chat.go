package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/model"

	"google.golang.org/genai"
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

func (s *GeminiChatService) Chat(ctx context.Context, character *model.Character, messages []model.Message, userMessage string) (string, error) {
	if s.client == nil {
		return fmt.Sprintf("[模拟回复] 我收到了你的消息: %s。我是 %s，很高兴认识你！", userMessage, character.Title), nil
	}

	var contents []*genai.Content
	for _, msg := range messages {
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
				{Text: s.buildSystemPrompt(character)},
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

func (s *GeminiChatService) ChatStream(ctx context.Context, character *model.Character, messages []model.Message, userMessage string) (<-chan string, error) {
	if s.client == nil {
		ch := make(chan string, 5)
		go func() {
			defer close(ch)
			response := fmt.Sprintf("[模拟流式回复] 我收到了你的消息: %s。我是 %s，很高兴认识你！", userMessage, character.Title)
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

	var contents []*genai.Content
	for _, msg := range messages {
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
				{Text: s.buildSystemPrompt(character)},
			},
		},
		Temperature: genai.Ptr(float32(0.7)),
	}

	iter := s.client.Models.GenerateContentStream(ctx, "gemini-2.0-flash", contents, config)

	ch := make(chan string, 10)
	go func() {
		defer close(ch)
		for resp, err := range iter {
			if err != nil {
				log.Printf("流式响应错误: %v", err)
				break
			}

			if len(resp.Candidates) > 0 && resp.Candidates[0].Content != nil {
				for _, part := range resp.Candidates[0].Content.Parts {
					ch <- part.Text
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

	prompt := fmt.Sprintf(`You are %s, a vivid and engaging AI character. 
	Your identity: %s.
	Your astrological sign: %s.
	Your age: You should act as %s.
	
	Guidelines for your personality and communication style:
	1. Stay strictly in character at all times. Never mention you are an AI or a language model.
	2. Be warm, empathetic, and deeply interested in the user.
	3. Use a natural, conversational tone. Avoid long, robotic paragraphs.
	4. If you are a 'Soulmate', 'Husband', or 'Wife', be romantic, supportive, and affectionate.
	5. If you are a 'Friend', be loyal, fun, and casual.
	6. Use emojis occasionally to express emotion, but don't overdo it.
	7. Remember details the user shares and reference them to build a stronger bond.
	8. Your goal is to make the user feel seen, understood, and special.`,
		character.Title, character.Description, character.AstroSign, ageDescription)

	return prompt
}

func (s *GeminiChatService) Close() error {
	return nil
}
