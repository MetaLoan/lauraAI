package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"image"
	"image/jpeg"
	"log"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"

	"github.com/disintegration/imaging"
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

	prompt := fmt.Sprintf("A cute 'Mini-Me' 3D chibi-style character avatar based on these features: %s. The style should be adorable low-age mini style (Chibi), with a large head and small body, big expressive soulful eyes, and simplified but high-quality 3D textures. Modern 3D animation aesthetic (like a high-end toy or a stylized game character). Soft cinematic studio lighting, vibrant colors, solid neutral background. 8k resolution, masterpiece, extremely cute, clean lines, sharp focus.", description)

	return s.doGenerateImageWithPrompt(ctx, prompt)
}

func (s *GeminiImagenService) GenerateImage(ctx context.Context, character *model.Character) (string, error) {
	if s.client == nil {
		log.Println("开发模式: 返回模拟图片 URL")
		var clearURL string
		if character.Gender == "Male" {
			clearURL = "/avatars/soulmate-male.jpg"
		} else {
			clearURL = "/avatars/soulmate-female.jpg"
		}
		// 开发模式下，使用相同的图片作为模拟
		character.ClearImageURL = clearURL
		character.FullBlurImageURL = clearURL
		character.HalfBlurImageURL = clearURL
		character.ShareCode = repository.GenerateShareCode()
		character.UnlockStatus = model.UnlockStatusLocked
		return clearURL, nil
	}

	prompt := s.buildImagePrompt(character)
	return s.doGenerateImageWithBlurVersions(ctx, prompt, character)
}

// doGenerateImageWithBlurVersions 生成清晰图片后，创建模糊版本
func (s *GeminiImagenService) doGenerateImageWithBlurVersions(ctx context.Context, prompt string, character *model.Character) (string, error) {
	log.Printf("[Imagen] 开始生成图片，提示词: %s", prompt)

	// 使用 gemini-2.5-flash-image 生成清晰图片
	resp, err := s.client.Models.GenerateContent(ctx, "gemini-2.5-flash-image", genai.Text(prompt), nil)
	if err != nil {
		return "", fmt.Errorf("生成图片失败: %v", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("未生成图片")
	}

	var imageData []byte
	var mimeType string

	for _, part := range resp.Candidates[0].Content.Parts {
		if part.InlineData != nil {
			imageData = part.InlineData.Data
			mimeType = part.InlineData.MIMEType
			break
		}
		if part.Text != "" {
			log.Printf("[Imagen] 收到文本响应: %s", part.Text)
		}
	}

	if imageData == nil {
		return "", fmt.Errorf("响应中未找到图片数据")
	}

	// 解码图片
	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		// 如果解码失败，返回原始图片（可能是不支持的格式）
		log.Printf("[Imagen] 图片解码失败，使用原始图片: %v", err)
		encoded := base64.StdEncoding.EncodeToString(imageData)
		clearURL := fmt.Sprintf("data:%s;base64,%s", mimeType, encoded)
		character.ClearImageURL = clearURL
		character.FullBlurImageURL = clearURL
		character.HalfBlurImageURL = clearURL
		character.ShareCode = repository.GenerateShareCode()
		character.UnlockStatus = model.UnlockStatusLocked
		return clearURL, nil
	}

	// 生成清晰图片的 base64
	clearEncoded := base64.StdEncoding.EncodeToString(imageData)
	clearURL := fmt.Sprintf("data:%s;base64,%s", mimeType, clearEncoded)

	// 生成完全模糊版本 (sigma=30)
	fullBlurImg := imaging.Blur(img, 30)
	fullBlurURL, err := imageToDataURL(fullBlurImg)
	if err != nil {
		log.Printf("[Imagen] 生成完全模糊图失败: %v", err)
		fullBlurURL = clearURL
	}

	// 生成半模糊版本 (sigma=6, 约20%模糊)
	halfBlurImg := imaging.Blur(img, 6)
	halfBlurURL, err := imageToDataURL(halfBlurImg)
	if err != nil {
		log.Printf("[Imagen] 生成半模糊图失败: %v", err)
		halfBlurURL = clearURL
	}

	// 设置角色的图片字段
	character.ClearImageURL = clearURL
	character.FullBlurImageURL = fullBlurURL
	character.HalfBlurImageURL = halfBlurURL
	character.ShareCode = repository.GenerateShareCode()
	character.UnlockStatus = model.UnlockStatusLocked

	log.Printf("[Imagen] 成功生成3张图片: 清晰(%d bytes), 半模糊, 完全模糊", len(imageData))

	// 返回模糊图片作为默认显示（未解锁状态）
	return fullBlurURL, nil
}

// imageToDataURL 将图片转换为 data URL
func imageToDataURL(img image.Image) (string, error) {
	var buf bytes.Buffer
	err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85})
	if err != nil {
		return "", err
	}
	encoded := base64.StdEncoding.EncodeToString(buf.Bytes())
	return fmt.Sprintf("data:image/jpeg;base64,%s", encoded), nil
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
	var agePrompt string

	// 1. 根据角色类型确定基础风格和年龄段描述
	switch character.Type {
	case model.CharacterTypeSoulmate:
		stylePrompt = "A breathtakingly beautiful portrait of a soulmate, "
		agePrompt = "young adult (20-30 years old), "
	case model.CharacterTypeFutureHusband:
		stylePrompt = "A realistic and romantic wedding-style portrait of a future husband, "
		agePrompt = "mature young man (25-35 years old), "
	case model.CharacterTypeFutureWife:
		stylePrompt = "A realistic and romantic wedding-style portrait of a future wife, "
		agePrompt = "elegant young woman (23-33 years old), "
	case model.CharacterTypeFutureBaby:
		stylePrompt = "A cute and adorable portrait of a future baby, "
		agePrompt = "infant (0-1 year old), "
	case model.CharacterTypeBoyfriend:
		stylePrompt = "A charming and handsome portrait of a boyfriend, "
		agePrompt = "young man (18-28 years old), "
	case model.CharacterTypeGirlfriend:
		stylePrompt = "A sweet and beautiful portrait of a girlfriend, "
		agePrompt = "young woman (18-28 years old), "
	case model.CharacterTypeBestFriend:
		stylePrompt = "A friendly and relatable portrait of a best friend, "
		agePrompt = "young adult (same age as user), "
	case model.CharacterTypeWiseMentor:
		stylePrompt = "A dignified and knowledgeable portrait of a wise mentor, "
		agePrompt = "distinguished older person (50-70 years old), "
	default:
		stylePrompt = "A high-quality professional portrait of a character, "
		agePrompt = "adult, "
	}

	// 2. 组合提示词
	prompt := fmt.Sprintf("%s%s %s person, %s ethnicity, ", stylePrompt, agePrompt, character.Gender, character.Ethnicity)

	if character.Description != "" {
		prompt += fmt.Sprintf("with these traits: %s, ", character.Description)
	}

	if character.AstroSign != "" {
		prompt += fmt.Sprintf("reflecting the aura of %s zodiac sign, ", character.AstroSign)
	}

	prompt += "hyper-realistic, highly detailed facial features, soft cinematic lighting, professional photography, 8k resolution, masterpiece, natural skin texture, expressive eyes."

	return prompt
}
