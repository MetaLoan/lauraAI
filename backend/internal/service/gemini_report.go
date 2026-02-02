package service

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/model"

	"google.golang.org/genai"
)

// MultiLangReport AI 生成的多语言报告
type MultiLangReport struct {
	DescriptionEn string
	DescriptionZh string
	DescriptionRu string
	StrengthEn    string
	StrengthZh    string
	StrengthRu    string
	WeaknessEn    string
	WeaknessZh    string
	WeaknessRu    string
}

type GeminiReportService struct {
	client *genai.Client
}

func NewGeminiReportService() (*GeminiReportService, error) {
	if config.AppConfig.GeminiAPIKey == "" {
		if config.AppConfig.DevMode {
			log.Println("开发模式: GEMINI_API_KEY 未配置，将使用模拟报告生成")
			return &GeminiReportService{client: nil}, nil
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

	return &GeminiReportService{client: client}, nil
}

// GenerateMultiLangReport 生成多语言报告
// 策略：先生成英文版，再翻译成其他语言，提高稳定性
func (s *GeminiReportService) GenerateMultiLangReport(ctx context.Context, user *model.User, character *model.Character) (*MultiLangReport, error) {
	if s.client == nil {
		log.Println("开发模式: 返回模拟多语言报告")
		return s.getMockMultiLangReport(character), nil
	}

	// 第一步：生成英文报告
	log.Println("[Report] 步骤1: 生成英文报告...")
	englishReport, err := s.generateEnglishReport(ctx, user, character)
	if err != nil {
		log.Printf("[Report] 英文报告生成失败: %v, 使用模拟报告", err)
		return s.getMockMultiLangReport(character), nil
	}
	log.Printf("[Report] 英文报告生成成功")

	// 第二步：翻译成中文
	log.Println("[Report] 步骤2: 翻译成中文...")
	zhReport, err := s.translateReport(ctx, englishReport, "Chinese (Simplified)")
	if err != nil {
		log.Printf("[Report] 中文翻译失败: %v, 使用模拟翻译", err)
		zhReport = s.getMockTranslation(englishReport, "zh")
	} else {
		log.Println("[Report] 中文翻译成功")
	}

	// 第三步：翻译成俄文
	log.Println("[Report] 步骤3: 翻译成俄文...")
	ruReport, err := s.translateReport(ctx, englishReport, "Russian")
	if err != nil {
		log.Printf("[Report] 俄文翻译失败: %v, 使用模拟翻译", err)
		ruReport = s.getMockTranslation(englishReport, "ru")
	} else {
		log.Println("[Report] 俄文翻译成功")
	}

	return &MultiLangReport{
		DescriptionEn: englishReport.Description,
		DescriptionZh: zhReport.Description,
		DescriptionRu: ruReport.Description,
		StrengthEn:    englishReport.Strength,
		StrengthZh:    zhReport.Strength,
		StrengthRu:    ruReport.Strength,
		WeaknessEn:    englishReport.Weakness,
		WeaknessZh:    zhReport.Weakness,
		WeaknessRu:    ruReport.Weakness,
	}, nil
}

// EnglishReport 英文报告结构
type EnglishReport struct {
	Description string
	Strength    string
	Weakness    string
}

// generateEnglishReport 生成英文报告（纯文本，不要求 JSON）
// 包含重试机制处理 429 错误
func (s *GeminiReportService) generateEnglishReport(ctx context.Context, user *model.User, character *model.Character) (*EnglishReport, error) {
	prompt := fmt.Sprintf(`You are an expert astrologer and relationship counselor. Generate a personalized compatibility report.

User: %s, born on %s at %s in %s
Partner: %s %s, %s ethnicity, %s zodiac sign
Compatibility Score: %d%%

Please generate THREE separate paragraphs, each 2-3 sentences:

DESCRIPTION:
[Write a poetic overview of their soul connection and cosmic compatibility]

STRENGTH:
[Write about the relationship's key strengths - loyalty, passion, communication, etc.]

WEAKNESS:
[Write about potential challenges, framed constructively as growth opportunities]

Important: Write ONLY the content for each section, no headers or labels. Separate each section with a blank line.`,
		user.Name, user.BirthDate, user.BirthTime, user.BirthPlace,
		character.Gender, character.Type, character.Ethnicity, character.AstroSign,
		character.Compatibility)

	// 重试机制：最多重试3次，每次等待递增
	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		resp, err := s.client.Models.GenerateContent(ctx, "gemini-2.0-flash", []*genai.Content{
			{Role: "user", Parts: []*genai.Part{{Text: prompt}}},
		}, &genai.GenerateContentConfig{Temperature: genai.Ptr(float32(0.8))})

		if err != nil {
			lastErr = err
			// 检查是否是 429 错误
			if strings.Contains(err.Error(), "429") || strings.Contains(err.Error(), "RESOURCE_EXHAUSTED") {
				waitTime := time.Duration(attempt*5) * time.Second
				log.Printf("[Report] API 限流，等待 %v 后重试 (尝试 %d/3)", waitTime, attempt)
				time.Sleep(waitTime)
				continue
			}
			return nil, fmt.Errorf("AI call failed: %v", err)
		}

		if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
			return nil, fmt.Errorf("empty response")
		}

		text := resp.Candidates[0].Content.Parts[0].Text
		log.Printf("[Report] 英文原文: %s", text)

		// 解析三段文本
		return s.parseEnglishReport(text), nil
	}

	return nil, fmt.Errorf("AI call failed after 3 retries: %v", lastErr)
}

// parseEnglishReport 解析英文报告（按段落分割）
func (s *GeminiReportService) parseEnglishReport(text string) *EnglishReport {
	// 按空行分割
	parts := strings.Split(text, "\n\n")
	
	report := &EnglishReport{}
	
	for i, part := range parts {
		part = strings.TrimSpace(part)
		// 移除可能的标签
		part = strings.TrimPrefix(part, "DESCRIPTION:")
		part = strings.TrimPrefix(part, "STRENGTH:")
		part = strings.TrimPrefix(part, "WEAKNESS:")
		part = strings.TrimPrefix(part, "Description:")
		part = strings.TrimPrefix(part, "Strength:")
		part = strings.TrimPrefix(part, "Weakness:")
		part = strings.TrimSpace(part)
		
		if part == "" {
			continue
		}
		
		switch {
		case report.Description == "":
			report.Description = part
		case report.Strength == "":
			report.Strength = part
		case report.Weakness == "":
			report.Weakness = part
		}
		
		if i >= 2 && report.Description != "" && report.Strength != "" && report.Weakness != "" {
			break
		}
	}
	
	// 如果解析不完整，使用默认值
	if report.Description == "" {
		report.Description = "A deep soul connection exists between you, with cosmic energies aligning in harmony."
	}
	if report.Strength == "" {
		report.Strength = "Together you radiate loyalty, passion, and determination."
	}
	if report.Weakness == "" {
		report.Weakness = "Growth opportunities may arise through developing patience and understanding."
	}
	
	return report
}

// translateReport 翻译报告到目标语言
// 包含重试机制处理 429 错误
func (s *GeminiReportService) translateReport(ctx context.Context, english *EnglishReport, targetLang string) (*EnglishReport, error) {
	prompt := fmt.Sprintf(`Translate the following three paragraphs to %s. Keep the same tone and meaning. Output ONLY the translations, separated by blank lines.

Paragraph 1:
%s

Paragraph 2:
%s

Paragraph 3:
%s`, targetLang, english.Description, english.Strength, english.Weakness)

	// 重试机制
	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		resp, err := s.client.Models.GenerateContent(ctx, "gemini-2.0-flash", []*genai.Content{
			{Role: "user", Parts: []*genai.Part{{Text: prompt}}},
		}, &genai.GenerateContentConfig{Temperature: genai.Ptr(float32(0.3))})

		if err != nil {
			lastErr = err
			if strings.Contains(err.Error(), "429") || strings.Contains(err.Error(), "RESOURCE_EXHAUSTED") {
				waitTime := time.Duration(attempt*3) * time.Second
				log.Printf("[Report] 翻译API限流，等待 %v 后重试", waitTime)
				time.Sleep(waitTime)
				continue
			}
			return nil, fmt.Errorf("translation failed: %v", err)
		}

		if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
			return nil, fmt.Errorf("empty translation response")
		}

		text := resp.Candidates[0].Content.Parts[0].Text
		return s.parseEnglishReport(text), nil
	}

	return nil, fmt.Errorf("translation failed after 3 retries: %v", lastErr)
}

// getMockTranslation 获取模拟翻译
func (s *GeminiReportService) getMockTranslation(english *EnglishReport, lang string) *EnglishReport {
	switch lang {
	case "zh":
		return &EnglishReport{
			Description: "根据你的星盘分析，你们之间存在着深厚的灵魂共鸣。你们的能量在宇宙层面产生了美妙的和谐。",
			Strength:    "你们共同散发着忠诚、热情和坚定的光芒。你们的羁绊建立在真诚和相互支持之上。",
			Weakness:    "有时可能会产生一些摩擦，但意识到这一点有助于将挑战转化为成长的机会。",
		}
	case "ru":
		return &EnglishReport{
			Description: "Согласно анализу вашей натальной карты, между вами существует глубокий душевный резонанс. Ваши энергии создают прекрасную гармонию.",
			Strength:    "Вместе вы излучаете верность, страсть и решимость. Ваша связь процветает благодаря честности и взаимной поддержке.",
			Weakness:    "Иногда могут возникать трения, но осознание помогает превратить их в возможности для роста.",
		}
	default:
		return english
	}
}

func (s *GeminiReportService) getMockMultiLangReport(character *model.Character) *MultiLangReport {
	return &MultiLangReport{
		DescriptionEn: fmt.Sprintf("Based on your birth chart analysis, there is a deep soul resonance between you and this %s. Your energies create a beautiful harmony on a cosmic level.", character.AstroSign),
		DescriptionZh: fmt.Sprintf("根据你的星盘分析，你与这位%s之间存在着深厚的灵魂共鸣。你们的能量在宇宙层面产生了美妙的和谐。", character.AstroSign),
		DescriptionRu: fmt.Sprintf("Согласно анализу вашей натальной карты, между вами и этим %s существует глубокий душевный резонанс. Ваши энергии создают прекрасную гармонию.", character.AstroSign),
		StrengthEn:    "Together you radiate loyalty, passion, and determination. Your bond thrives on honesty, shared goals, and the ability to support each other's dreams.",
		StrengthZh:    "你们共同散发着忠诚、热情和坚定的光芒。你们的羁绊建立在真诚、共同目标，以及相互支持彼此梦想的能力之上。",
		StrengthRu:    "Вместе вы излучаете верность, страсть и решимость. Ваша связь процветает благодаря честности, общим целям и способности поддерживать мечты друг друга.",
		WeaknessEn:    "At times, stubbornness and emotional intensity may create friction. Misunderstandings can arise if space and patience are not given, but awareness helps transform these into growth.",
		WeaknessZh:    "有时，固执和情绪的强烈可能会产生摩擦。如果没有给予足够的空间和耐心，可能会产生误解，但意识到这一点有助于将这些转化为成长。",
		WeaknessRu:    "Иногда упрямство и эмоциональная напряжённость могут создавать трения. Недоразумения могут возникать, если не давать пространство и терпение, но осознание помогает превратить их в рост.",
	}
}
