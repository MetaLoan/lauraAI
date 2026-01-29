package service

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/model"

	"google.golang.org/genai"
)

type GeminiImagenService struct {
	client *genai.Client
}

func NewGeminiImagenService() (*GeminiImagenService, error) {
	if config.AppConfig.GeminiAPIKey == "" {
		if config.AppConfig.DevMode {
			log.Println("开发模式: GEMINI_API_KEY 未配置，将使用模拟图片生成")
			return &GeminiImagenService{client: nil}, nil
		}
		return nil, fmt.Errorf("GEMINI_API_KEY 未配置")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: config.AppConfig.GeminiAPIKey,
	})
	if err != nil {
		return nil, fmt.Errorf("创建 Gemini 客户端失败: %v", err)
	}

	return &GeminiImagenService{client: client}, nil
}

func (s *GeminiImagenService) GenerateMiniMeImage(ctx context.Context, description string) (string, error) {
	if s.client == nil {
		log.Println("开发模式: 返回模拟 Mini Me 图片")
		return "/avatars/placeholders/mini_me.png", nil
	}

	prompt := fmt.Sprintf("A stunning 3D digital art portrait of a person with these features: %s. The style should be modern 3D animation (like modern Disney or Riot Games cinematic style), with extremely detailed skin texture, realistic hair rendering, and expressive, soulful eyes. Soft cinematic studio lighting, shallow depth of field, vibrant but natural colors, solid neutral background. 8k resolution, masterpiece, trending on ArtStation, highly detailed, sharp focus.", description)

	return s.doGenerateImageWithPrompt(ctx, prompt)
}

func (s *GeminiImagenService) GenerateImage(ctx context.Context, character *model.Character) (string, error) {
	if s.client == nil {
		log.Println("开发模式: 返回模拟图片 URL")
		if character.Gender == "Male" {
			return "/avatars/soulmate-male.jpg", nil
		}
		return "/avatars/soulmate-female.jpg", nil
	}

	prompt := s.buildImagePrompt(character)
	return s.doGenerateImageWithPrompt(ctx, prompt)
}

func (s *GeminiImagenService) doGenerateImageWithPrompt(ctx context.Context, prompt string) (string, error) {
	log.Printf("[Imagen] 开始生成图片，提示词: %s", prompt)

	// 使用 gemini-2.5-flash-image，这是专门的图像生成模型
	resp, err := s.client.Models.GenerateContent(ctx, "gemini-2.5-flash-image", genai.Text(prompt), nil)
	if err != nil {
		return "", fmt.Errorf("生成图片失败: %v", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("未生成图片")
	}

	for _, part := range resp.Candidates[0].Content.Parts {
		if part.InlineData != nil {
			encoded := base64.StdEncoding.EncodeToString(part.InlineData.Data)
			return fmt.Sprintf("data:%s;base64,%s", part.InlineData.MIMEType, encoded), nil
		}
		if part.Text != "" {
			log.Printf("[Imagen] 收到文本响应: %s", part.Text)
		}
	}

	return "", fmt.Errorf("响应中未找到图片数据")
}

func (s *GeminiImagenService) buildImagePrompt(character *model.Character) string {
	var stylePrompt string

	switch character.Type {
	case model.CharacterTypeSoulmate:
		stylePrompt = "A breathtakingly beautiful portrait of a soulmate, "
	case "future_husband", "future_wife":
		stylePrompt = "A realistic and romantic wedding-style portrait of a future spouse, "
	case "future_baby":
		stylePrompt = "A cute and adorable portrait of a future baby, "
	default:
		stylePrompt = "A high-quality professional portrait of a character, "
	}

	prompt := fmt.Sprintf("%s%s person, %s ethnicity, ", stylePrompt, character.Gender, character.Ethnicity)

	if character.Description != "" {
		prompt += fmt.Sprintf("with these traits: %s, ", character.Description)
	}

	if character.AstroSign != "" {
		prompt += fmt.Sprintf("reflecting the aura of %s zodiac sign, ", character.AstroSign)
	}

	prompt += "hyper-realistic, highly detailed facial features, soft cinematic lighting, professional photography, 8k resolution, masterpiece, natural skin texture, expressive eyes."

	return prompt
}
