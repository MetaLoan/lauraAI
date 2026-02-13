package service

import (
	"context"
	"fmt"
	"log"

	"soulface-backend/internal/config"

	"google.golang.org/genai"
)

type GeminiVisionService struct {
	client *genai.Client
}

func NewGeminiVisionService() (*GeminiVisionService, error) {
	apiKey := config.AppConfig.GeminiAPIKey
	if apiKey == "" {
		if config.AppConfig.DevMode {
			log.Println("开发模式: GEMINI_API_KEY 未配置，将使用模拟视觉分析")
			return &GeminiVisionService{client: nil}, nil
		}
		return nil, fmt.Errorf("GEMINI_API_KEY not configured")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		return nil, fmt.Errorf("Failed to create Gemini client: %v", err)
	}

	return &GeminiVisionService{client: client}, nil
}

func (s *GeminiVisionService) AnalyzeImage(ctx context.Context, imageData []byte, mimeType string) (string, error) {
	if s.client == nil {
		return "A generic person description", nil
	}

	prompt := `Analyze this person's appearance for creating a high-quality 3D character avatar. 
	Please provide a detailed description including:
	1. Gender and approximate age.
	2. Ethnicity/Race: Identify the person's ethnic background (e.g., East Asian, Caucasian, African, Hispanic, South Asian, etc.).
	3. Hair: style, length, color, and texture.
	4. Eyes: color, shape, and expression.
	5. Facial Features: face shape, skin tone, any distinctive marks, glasses, or facial hair.
	6. Clothing: style, color, and any visible accessories.
	7. Overall Vibe: personality traits reflected in their expression (e.g., warm, mysterious, confident).
	Keep the description vivid but concise, optimized for a text-to-image AI prompt.`

	parts := []*genai.Part{
		{Text: prompt},
		{
			InlineData: &genai.Blob{
				MIMEType: mimeType,
				Data:     imageData,
			},
		},
	}

	resp, err := s.client.Models.GenerateContent(ctx, "gemini-2.0-flash", []*genai.Content{{Parts: parts}}, nil)
	if err != nil {
		return "", fmt.Errorf("Failed to generate description: %v", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("Description not generated")
	}

	return resp.Candidates[0].Content.Parts[0].Text, nil
}
