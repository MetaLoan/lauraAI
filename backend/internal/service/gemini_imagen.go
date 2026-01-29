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

	var lastErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		log.Printf("图片生成尝试 %d/%d...", attempt, maxRetries)
		
		result, err := s.doGenerateImage(ctx, character)
		if err == nil {
			log.Printf("图片生成成功 (尝试 %d)", attempt)
			return result, nil
		}
		
		lastErr = err
		log.Printf("图片生成失败 (尝试 %d): %v", attempt, err)
		
		if attempt < maxRetries {
			log.Printf("等待 %v 后重试...", retryDelay)
			time.Sleep(retryDelay)
		}
	}
	
	return "", fmt.Errorf("图片生成失败，已重试 %d 次: %v", maxRetries, lastErr)
}

// doGenerateImage 执行单次图片生成请求
func (s *GeminiImagenService) doGenerateImage(ctx context.Context, character *model.Character) (string, error) {
	// 创建带超时的 context
	timeoutCtx, cancel := context.WithTimeout(ctx, imagenTimeout)
	defer cancel()

	// 构建图片生成提示词
	prompt := s.buildImagePrompt(character)

	// 调用 Imagen 4.0 API
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=%s", s.apiKey)

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
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("请求失败: %v", err)
	}
	defer resp.Body.Close()

	// 读取完整响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应失败: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API 返回错误: %d, %s", resp.StatusCode, string(body))
	}

	var imagenResp ImagenResponse
	if err := json.Unmarshal(body, &imagenResp); err != nil {
		return "", fmt.Errorf("解析响应失败: %v", err)
	}

	if len(imagenResp.Predictions) == 0 {
		return "", fmt.Errorf("未生成图片")
	}

	// 返回 Base64 编码的图片（前缀 data:image/png;base64,）
	base64Data := imagenResp.Predictions[0].BytesBase64Encoded
	mimeType := imagenResp.Predictions[0].MimeType
	if mimeType == "" {
		mimeType = "image/png"
	}
	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64Data), nil
}

func (s *GeminiImagenService) buildImagePrompt(character *model.Character) string {
	prompt := fmt.Sprintf("A portrait photo of a %s person, %s ethnicity, ", character.Gender, character.Ethnicity)
	
	if character.Type == model.CharacterTypeSoulmate {
		prompt += "looking warm and friendly, with a gentle smile, "
	}
	
	if character.AstroSign != "" {
		prompt += fmt.Sprintf("embodying the characteristics of %s zodiac sign, ", character.AstroSign)
	}

	prompt += "high quality, professional photography, natural lighting, realistic, detailed facial features"

	return prompt
}
