package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/model"
)

const (
	// 图片生成超时时间
	imagenTimeout = 120 * time.Second
	// 最大重试次数
	maxRetries = 3
	// 重试间隔
	retryDelay = 2 * time.Second
)

type GeminiImagenService struct {
	apiKey string
}

func NewGeminiImagenService() (*GeminiImagenService, error) {
	apiKey := config.AppConfig.GeminiAPIKey
	if apiKey == "" {
		if config.AppConfig.DevMode {
			log.Println("开发模式: GEMINI_API_KEY 未配置，将使用模拟图片生成")
			return &GeminiImagenService{apiKey: ""}, nil
		}
		return nil, fmt.Errorf("GEMINI_API_KEY 未配置")
	}

	return &GeminiImagenService{
		apiKey: apiKey,
	}, nil
}

type ImagenRequest struct {
	Instances []struct {
		Prompt string `json:"prompt"`
	} `json:"instances"`
	Parameters struct {
		SampleCount int `json:"sampleCount"`
	} `json:"parameters"`
}

type ImagenResponse struct {
	Predictions []struct {
		BytesBase64Encoded string `json:"bytesBase64Encoded"`
		MimeType           string `json:"mimeType"`
	} `json:"predictions"`
}

// GenerateMiniMeImage 根据外貌描述生成 Mini Me 图片
func (s *GeminiImagenService) GenerateMiniMeImage(ctx context.Context, description string) (string, error) {
	if s.apiKey == "" {
		log.Println("开发模式: 返回模拟 Mini Me 图片")
		return "/avatars/placeholders/mini_me.png", nil
	}

	// 构建 Mini Me 风格提示词
	// 使用更写实、更具艺术感的 3D 风格，避免过于低幼的卡通感
	prompt := fmt.Sprintf("A stunning 3D digital art portrait of a person with these features: %s. The style should be modern 3D animation (like modern Disney or Riot Games cinematic style), with extremely detailed skin texture, realistic hair rendering, and expressive, soulful eyes. Soft cinematic studio lighting, shallow depth of field, vibrant but natural colors, solid neutral background. 8k resolution, masterpiece, trending on ArtStation, highly detailed, sharp focus.", description)

	return s.doGenerateImageWithPrompt(ctx, prompt)
}

// GenerateImage 使用 Gemini Imagen 4.0 生成角色图片（带重试机制）
func (s *GeminiImagenService) GenerateImage(ctx context.Context, character *model.Character) (string, error) {
	if s.apiKey == "" {
		// 模拟生成图片
		log.Println("开发模式: 返回模拟图片 URL")
		if character.Gender == "Male" {
			return "/avatars/soulmate-male.jpg", nil
		}
		return "/avatars/soulmate-female.jpg", nil
	}

	prompt := s.buildImagePrompt(character)
	return s.doGenerateImageWithPrompt(ctx, prompt)
}

// doGenerateImageWithPrompt 执行单次图片生成请求
func (s *GeminiImagenService) doGenerateImageWithPrompt(ctx context.Context, prompt string) (string, error) {
	log.Printf("[Imagen] 开始生成图片，提示词: %s", prompt)
	
	// 创建带超时的 context
	timeoutCtx, cancel := context.WithTimeout(ctx, imagenTimeout)
	defer cancel()

	// 调用 Imagen 3.0 API (更新为稳定版模型名称)
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=%s", s.apiKey)
	log.Printf("[Imagen] 请求 URL: %s", url)

	reqBody := ImagenRequest{
		Instances: []struct {
			Prompt string `json:"prompt"`
		}{
			{Prompt: prompt},
		},
		Parameters: struct {
			SampleCount int `json:"sampleCount"`
		}{
			SampleCount: 1,
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("序列化请求失败: %v", err)
	}

	req, err := http.NewRequestWithContext(timeoutCtx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: imagenTimeout,
	}
	
	start := time.Now()
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[Imagen] 请求发生错误 (耗时 %v): %v", time.Since(start), err)
		return "", fmt.Errorf("请求失败: %v", err)
	}
	defer resp.Body.Close()

	// 读取完整响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应失败: %v", err)
	}

	log.Printf("[Imagen] API 响应状态码: %d (耗时 %v)", resp.StatusCode, time.Since(start))

	if resp.StatusCode != http.StatusOK {
		log.Printf("[Imagen] API 返回错误体: %s", string(body))
		return "", fmt.Errorf("API 返回错误: %d, %s", resp.StatusCode, string(body))
	}

	var imagenResp ImagenResponse
	if err := json.Unmarshal(body, &imagenResp); err != nil {
		return "", fmt.Errorf("解析响应失败: %v", err)
	}

	if len(imagenResp.Predictions) == 0 {
		return "", fmt.Errorf("未生成图片")
	}

	log.Printf("[Imagen] 图片生成成功！")

	// 返回 Base64 编码的图片（前缀 data:image/png;base64,）
	base64Data := imagenResp.Predictions[0].BytesBase64Encoded
	mimeType := imagenResp.Predictions[0].MimeType
	if mimeType == "" {
		mimeType = "image/png"
	}
	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64Data), nil
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
