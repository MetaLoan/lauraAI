package service

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"image"
	"image/jpeg"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

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
		return nil, fmt.Errorf("GEMINI_API_KEY not configured")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: config.AppConfig.GeminiAPIKey,
	})
	if err != nil {
		return nil, fmt.Errorf("Failed to create Gemini client: %v", err)
	}

	return &GeminiImagenService{client: client}, nil
}

// GenerateMiniMeImage 生成 Mini Me 图片（带模糊版本，用于解锁流程）
func (s *GeminiImagenService) GenerateMiniMeImage(ctx context.Context, description string, character *model.Character) (string, error) {
	if s.client == nil {
		log.Println("开发模式: 返回模拟 Mini Me 图片")
		character.ClearImageURL = "/avatars/placeholders/mini_me.png"
		character.FullBlurImageURL = "/avatars/placeholders/mini_me_blur_full.png"
		character.HalfBlurImageURL = "/avatars/placeholders/mini_me_blur_half.png"
		character.ShareCode = repository.GenerateShareCode()
		character.UnlockStatus = model.UnlockStatusLocked
		return character.FullBlurImageURL, nil
	}

	prompt := fmt.Sprintf("A cute 'Mini-Me' 3D chibi-style character avatar based on these features: %s. The style should be adorable low-age mini style (Chibi), with a large head and small body, big expressive soulful eyes, and simplified but high-quality 3D textures. Modern 3D animation aesthetic (like a high-end toy or a stylized game character). Soft cinematic studio lighting, vibrant colors, solid neutral background. 8k resolution, masterpiece, extremely cute, clean lines, sharp focus.", description)

	// 使用与其他角色相同的流程：生成清晰图+模糊版本
	return s.doGenerateImageWithBlurVersions(ctx, prompt, character)
}

func (s *GeminiImagenService) GenerateImage(ctx context.Context, character *model.Character) (string, error) {
	if s.client == nil {
		log.Println("开发模式: 返回模拟图片 URL")
		var baseURL string
		if character.Gender == "Male" {
			baseURL = "/avatars/soulmate-male"
		} else {
			baseURL = "/avatars/soulmate-female"
		}
		// 开发模式下，使用不同的模糊图片
		character.ClearImageURL = baseURL + ".jpg"
		character.FullBlurImageURL = baseURL + "_blur_full.jpg"
		character.HalfBlurImageURL = baseURL + "_blur_half.jpg"
		character.ShareCode = repository.GenerateShareCode()
		character.UnlockStatus = model.UnlockStatusLocked
		return character.FullBlurImageURL, nil
	}

	prompt := s.buildImagePrompt(character)
	return s.doGenerateImageWithBlurVersions(ctx, prompt, character)
}

// doGenerateImageWithBlurVersions 生成清晰图片后，创建模糊版本
func (s *GeminiImagenService) doGenerateImageWithBlurVersions(ctx context.Context, prompt string, character *model.Character) (string, error) {
	log.Printf("[Imagen] 开始生成图片，提示词: %s", prompt)

	// 使用 gemini-2.5-flash-image 生成清晰图片（带重试逻辑）
	var resp *genai.GenerateContentResponse
	var err error
	maxRetries := 3
	for attempt := 1; attempt <= maxRetries; attempt++ {
		resp, err = s.client.Models.GenerateContent(ctx, "gemini-2.5-flash-image", genai.Text(prompt), nil)
		if err == nil {
			break
		}
		
		// 检查是否是可重试的错误（网络错误、EOF、超时等）
		errStr := err.Error()
		isRetryable := strings.Contains(errStr, "EOF") ||
			strings.Contains(errStr, "connection") ||
			strings.Contains(errStr, "timeout") ||
			strings.Contains(errStr, "RESOURCE_EXHAUSTED") ||
			strings.Contains(errStr, "429")
		
		if !isRetryable || attempt == maxRetries {
			return "", fmt.Errorf("Failed to generate image: %v", err)
		}
		
		// 指数退避等待
		waitTime := time.Duration(attempt*attempt) * 2 * time.Second
		log.Printf("[Imagen] 图片生成失败 (尝试 %d/%d): %v, 等待 %v 后重试...", attempt, maxRetries, err, waitTime)
		time.Sleep(waitTime)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("Image not generated")
	}

	var imageData []byte
	// var mimeType string

	for _, part := range resp.Candidates[0].Content.Parts {
		if part.InlineData != nil {
			imageData = part.InlineData.Data
			// mimeType = part.InlineData.MIMEType
			break
		}
		if part.Text != "" {
			log.Printf("[Imagen] 收到文本响应: %s", part.Text)
		}
	}

	if imageData == nil {
		return "", fmt.Errorf("Image data not found in response")
	}

	// 解码图片
	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		// 如果解码失败，尝试使用 imaging 库解码（支持更多格式）
		log.Printf("[Imagen] 标准解码失败，尝试 imaging 库: %v", err)
		img, err = imaging.Decode(bytes.NewReader(imageData))
		if err != nil {
			// 如果仍然失败，返回原始图片（不带模糊版本）
			log.Printf("[Imagen] imaging 解码也失败，使用原始图片: %v", err)
			clearURL, saveErr := s.saveImageBytes(imageData, "jpg")
			if saveErr != nil {
				return "", fmt.Errorf("Failed to save image: %v", saveErr)
			}
			character.ClearImageURL = clearURL
			character.FullBlurImageURL = clearURL
			character.HalfBlurImageURL = clearURL
			character.ShareCode = repository.GenerateShareCode()
			character.UnlockStatus = model.UnlockStatusLocked
			return clearURL, nil
		}
	}

	// 保存清晰图片
	clearURL, err := s.saveImage(img)
	if err != nil {
		return "", fmt.Errorf("Failed to save clear image: %v", err)
	}

	// 生成完全模糊版本 (sigma=30)
	fullBlurImg := imaging.Blur(img, 30)
	fullBlurURL, err := s.saveImage(fullBlurImg)
	if err != nil {
		log.Printf("[Imagen] 保存完全模糊图失败: %v", err)
		fullBlurURL = clearURL
	}

	// 生成半模糊版本 (sigma=6, 约20%模糊)
	halfBlurImg := imaging.Blur(img, 6)
	halfBlurURL, err := s.saveImage(halfBlurImg)
	if err != nil {
		log.Printf("[Imagen] 保存半模糊图失败: %v", err)
		halfBlurURL = clearURL
	}

	// 设置角色的图片字段
	character.ClearImageURL = clearURL
	character.FullBlurImageURL = fullBlurURL
	character.HalfBlurImageURL = halfBlurURL
	character.ShareCode = repository.GenerateShareCode()
	character.UnlockStatus = model.UnlockStatusLocked

	log.Printf("[Imagen] 成功生成3张图片: 清晰, 半模糊, 完全模糊")

	// 返回模糊图片作为默认显示（未解锁状态）
	return fullBlurURL, nil
}

// generateSecureFilename 生成加密安全的随机文件名
func generateSecureFilename(ext string) string {
	// 使用 32 字节（256 位）的加密随机数，生成 64 字符的十六进制字符串
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		// 如果加密随机失败，使用时间戳作为后备
		return fmt.Sprintf("fallback_%d.%s", time.Now().UnixNano(), ext)
	}
	return fmt.Sprintf("%s.%s", hex.EncodeToString(bytes), ext)
}

// saveImage 保存图片到本地 uploads 目录并返回完整 URL
func (s *GeminiImagenService) saveImage(img image.Image) (string, error) {
	filename := generateSecureFilename("jpg")
	filepath := filepath.Join(config.AppConfig.UploadsDir, filename)

	file, err := os.Create(filepath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	if err := jpeg.Encode(file, img, &jpeg.Options{Quality: 85}); err != nil {
		return "", err
	}

	// 只返回相对路径，让前端根据当前环境拼接完整URL
	// 这样可以避免BaseURL变化导致旧图片无法加载的问题
	imageURL := fmt.Sprintf("/uploads/%s", filename)
	log.Printf("[Imagen] 保存图片，相对路径: %s, BaseURL: %s, filename: %s", imageURL, config.AppConfig.BaseURL, filename)
	return imageURL, nil
}

// saveImageBytes 保存图片字节到本地 uploads 目录并返回完整 URL
func (s *GeminiImagenService) saveImageBytes(data []byte, ext string) (string, error) {
	filename := generateSecureFilename(ext)
	filepath := filepath.Join(config.AppConfig.UploadsDir, filename)

	if err := os.WriteFile(filepath, data, 0644); err != nil {
		return "", err
	}

	// 只返回相对路径，让前端根据当前环境拼接完整URL
	// 这样可以避免BaseURL变化导致旧图片无法加载的问题
	imageURL := fmt.Sprintf("/uploads/%s", filename)
	log.Printf("[Imagen] 保存图片字节，相对路径: %s, BaseURL: %s, filename: %s", imageURL, config.AppConfig.BaseURL, filename)
	return imageURL, nil
}

func (s *GeminiImagenService) doGenerateImageWithPrompt(ctx context.Context, prompt string) (string, error) {
	log.Printf("[Imagen] 开始生成图片，提示词: %s", prompt)

	// 使用 gemini-2.5-flash-image，带重试逻辑
	var resp *genai.GenerateContentResponse
	var err error
	maxRetries := 3
	for attempt := 1; attempt <= maxRetries; attempt++ {
		resp, err = s.client.Models.GenerateContent(ctx, "gemini-2.5-flash-image", genai.Text(prompt), nil)
		if err == nil {
			break
		}
		
		// 检查是否是可重试的错误
		errStr := err.Error()
		isRetryable := strings.Contains(errStr, "EOF") ||
			strings.Contains(errStr, "connection") ||
			strings.Contains(errStr, "timeout") ||
			strings.Contains(errStr, "RESOURCE_EXHAUSTED") ||
			strings.Contains(errStr, "429")
		
		if !isRetryable || attempt == maxRetries {
			return "", fmt.Errorf("Failed to generate image: %v", err)
		}
		
		waitTime := time.Duration(attempt*attempt) * 2 * time.Second
		log.Printf("[Imagen] 图片生成失败 (尝试 %d/%d): %v, 等待 %v 后重试...", attempt, maxRetries, err, waitTime)
		time.Sleep(waitTime)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("Image not generated")
	}

	for _, part := range resp.Candidates[0].Content.Parts {
		if part.InlineData != nil {
			// 保存图片
			url, err := s.saveImageBytes(part.InlineData.Data, "jpg")
			if err != nil {
				// 如果保存失败，回退到 Base64 (虽然不推荐用于分享，但至少能显示)
				encoded := base64.StdEncoding.EncodeToString(part.InlineData.Data)
				return fmt.Sprintf("data:%s;base64,%s", part.InlineData.MIMEType, encoded), nil
			}
			return url, nil
		}
		if part.Text != "" {
			log.Printf("[Imagen] 收到文本响应: %s", part.Text)
		}
	}

	return "", fmt.Errorf("Image data not found in response")
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

	if character.DescriptionEn != "" {
		prompt += fmt.Sprintf("with these traits: %s, ", character.DescriptionEn)
	}

	if character.AstroSign != "" {
		prompt += fmt.Sprintf("reflecting the aura of %s zodiac sign, ", character.AstroSign)
	}

	prompt += "hyper-realistic, highly detailed facial features, soft cinematic lighting, professional photography, 8k resolution, masterpiece, natural skin texture, expressive eyes."

	return prompt
}
