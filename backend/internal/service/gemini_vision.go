package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"lauraai-backend/internal/config"
)

const (
	visionTimeout = 30 * time.Second
	visionModel   = "gemini-1.5-flash"
)

type GeminiVisionService struct {
	apiKey string
}

func NewGeminiVisionService() (*GeminiVisionService, error) {
	apiKey := config.AppConfig.GeminiAPIKey
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY 未配置")
	}

	return &GeminiVisionService{
		apiKey: apiKey,
	}, nil
}

type VisionRequest struct {
	Contents []struct {
		Parts []Part `json:"parts"`
	} `json:"contents"`
}

type Part struct {
	Text       string      `json:"text,omitempty"`
	InlineData *InlineData `json:"inline_data,omitempty"`
}

type InlineData struct {
	MimeType string `json:"mime_type"`
	Data     string `json:"data"`
}

type VisionResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

// AnalyzeImage 分析图片并返回详细的外貌描述
func (s *GeminiVisionService) AnalyzeImage(ctx context.Context, imageData []byte, mimeType string) (string, error) {
	if s.apiKey == "" {
		return "A generic person description", nil
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, visionTimeout)
	defer cancel()

	// 构建请求
	base64Data := base64.StdEncoding.EncodeToString(imageData)
	
	reqBody := VisionRequest{
		Contents: []struct {
			Parts []Part `json:"parts"`
		}{
			{
				Parts: []Part{
					{Text: `Analyze this person's appearance for creating a high-quality 3D character avatar. 
					Please provide a detailed description including:
					1. Gender and approximate age.
					2. Hair: style, length, color, and texture.
					3. Eyes: color, shape, and expression.
					4. Facial Features: face shape, skin tone, any distinctive marks, glasses, or facial hair.
					5. Clothing: style, color, and any visible accessories.
					6. Overall Vibe: personality traits reflected in their expression (e.g., warm, mysterious, confident).
					Keep the description vivid but concise, optimized for a text-to-image AI prompt.`},
					{
						InlineData: &InlineData{
							MimeType: mimeType,
							Data:     base64Data,
						},
					},
				},
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("序列化请求失败: %v", err)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", visionModel, s.apiKey)

	req, err := http.NewRequestWithContext(timeoutCtx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: visionTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("请求失败: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应失败: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API 返回错误: %d, %s", resp.StatusCode, string(body))
	}

	var visionResp VisionResponse
	if err := json.Unmarshal(body, &visionResp); err != nil {
		return "", fmt.Errorf("解析响应失败: %v", err)
	}

	if len(visionResp.Candidates) == 0 || len(visionResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("未生成描述")
	}

	return visionResp.Candidates[0].Content.Parts[0].Text, nil
}
