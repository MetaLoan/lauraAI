package service

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"soulface-backend/internal/config"
	"soulface-backend/internal/model"

	"google.golang.org/genai"
)

// getBirthTimeString 安全获取出生时间字符串
func getBirthTimeString(birthTime *string) string {
	if birthTime == nil {
		return "unknown time"
	}
	return *birthTime
}

// MultiLangReport AI 生成的多语言报告（6项内容）
type MultiLangReport struct {
	// 缘分概述
	DescriptionEn string
	DescriptionZh string
	DescriptionRu string
	// 事业运势
	CareerEn string
	CareerZh string
	CareerRu string
	// 性格特点
	PersonalityEn string
	PersonalityZh string
	PersonalityRu string
	// 相遇时机
	MeetingTimeEn string
	MeetingTimeZh string
	MeetingTimeRu string
	// 距离预测
	DistanceEn string
	DistanceZh string
	DistanceRu string
	// 缘分优势
	StrengthEn string
	StrengthZh string
	StrengthRu string
	// 成长机遇
	WeaknessEn string
	WeaknessZh string
	WeaknessRu string
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

	// Step 2: Translate to Chinese
	log.Println("[Report] Step 2: Translating to Chinese...")
	zhReport, err := s.translateReport(ctx, englishReport, "Chinese (Simplified). Use very casual, down-to-earth, and plain everyday language. Avoid formal or poetic words.")
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
		CareerEn:      englishReport.Career,
		CareerZh:      zhReport.Career,
		CareerRu:      ruReport.Career,
		PersonalityEn: englishReport.Personality,
		PersonalityZh: zhReport.Personality,
		PersonalityRu: ruReport.Personality,
		MeetingTimeEn: englishReport.MeetingTime,
		MeetingTimeZh: zhReport.MeetingTime,
		MeetingTimeRu: ruReport.MeetingTime,
		DistanceEn:    englishReport.Distance,
		DistanceZh:    zhReport.Distance,
		DistanceRu:    ruReport.Distance,
		StrengthEn:    englishReport.Strength,
		StrengthZh:    zhReport.Strength,
		StrengthRu:    ruReport.Strength,
		WeaknessEn:    englishReport.Weakness,
		WeaknessZh:    zhReport.Weakness,
		WeaknessRu:    ruReport.Weakness,
	}, nil
}

// EnglishReport 英文报告结构（7项内容）
type EnglishReport struct {
	Description string // 缘分概述
	Career      string // 事业运势
	Personality string // 性格特点
	MeetingTime string // 相遇时机
	Distance    string // 距离预测
	Strength    string // 缘分优势
	Weakness    string // 成长机遇
}

// generateEnglishReport 生成英文报告（纯文本，不要求 JSON）
// 包含重试机制处理 429 错误
func (s *GeminiReportService) generateEnglishReport(ctx context.Context, user *model.User, character *model.Character) (*EnglishReport, error) {
	prompt := fmt.Sprintf(`You are an expert astrologer, relationship counselor, and fortune teller. Generate a personalized compatibility report for a mystical app that predicts soulmates.

User: %s, born on %s at %s in %s
Partner: %s %s, %s ethnicity, %s zodiac sign
Compatibility Score: %d%%

Please generate SEVEN separate sections. Each section MUST be at least 4-5 sentences long to provide a detailed and comprehensive report. Use a very casual, down-to-earth, and conversational tone (like a friend talking to another friend). Avoid overly poetic, flowery, or formal language. Be specific with concrete details like timeframes, distances, and career types.

1. DESCRIPTION:
[Write a detailed overview of their soul connection. Use plain, everyday language to explain why they are a good match. Keep it friendly and relatable.]

2. CAREER:
[Describe the partner's job or what they are good at in detail. Mention specific industries or roles. Explain in simple terms how their work life fits with the user's.]

3. PERSONALITY:
[Give a thorough breakdown of the partner's personality. Use common slang or casual terms to describe their vibes. Are they the life of the party or a cozy homebody? What are their quirks?]

4. MEETING_TIME:
[Predict exactly when they might meet. Give a clear timeframe and a specific scenario (e.g., "at a friend's BBQ next summer", "while waiting for a rainy bus in October").]

5. DISTANCE:
[Describe where they are right now using relatable comparisons. E.g., "just a short drive away", "in the next town over", "currently living in a different city but planning to move soon".]

6. STRENGTH:
[Talk about what will make this relationship last. Use simple examples of how they support each other in daily life.]

7. WEAKNESS:
[Mention a common real-world problem they might face (like being messy or stubborn) and how they can fix it simply.]

IMPORTANT: 
- Write ONLY the content for each section, no headers or labels
- Separate each section with a blank line
- Be VERY casual and use plain, everyday English
- Each section MUST be 4-5 sentences long
- Make predictions feel personal and exciting
- Write EVERYTHING in English only`,
		user.Name, user.BirthDate, getBirthTimeString(user.BirthTime), user.BirthPlace,
		character.Gender, character.Type, character.Ethnicity, character.AstroSign,
		character.Compatibility)

	// 重试机制：最多重试3次，每次等待递增
	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		resp, err := s.client.Models.GenerateContent(ctx, "gemini-2.0-flash", []*genai.Content{
			{Role: "user", Parts: []*genai.Part{{Text: prompt}}},
		}, &genai.GenerateContentConfig{Temperature: genai.Ptr(float32(0.85))})

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
		log.Printf("[Report] 英文原文长度: %d 字符", len(text))

		// 解析7段文本
		return s.parseEnglishReport(text), nil
	}

	return nil, fmt.Errorf("AI call failed after 3 retries: %v", lastErr)
}

// parseEnglishReport 解析英文报告（按段落分割，支持7项）
func (s *GeminiReportService) parseEnglishReport(text string) *EnglishReport {
	// 按空行分割
	parts := strings.Split(text, "\n\n")

	report := &EnglishReport{}

	// 可能的标签列表
	labels := []string{
		"DESCRIPTION:", "Description:", "1.", "1:",
		"CAREER:", "Career:", "2.", "2:",
		"PERSONALITY:", "Personality:", "3.", "3:",
		"MEETING_TIME:", "Meeting_Time:", "MeetingTime:", "Meeting Time:", "4.", "4:",
		"DISTANCE:", "Distance:", "5.", "5:",
		"STRENGTH:", "Strength:", "6.", "6:",
		"WEAKNESS:", "Weakness:", "Challenge:", "7.", "7:",
	}

	cleanPart := func(part string) string {
		part = strings.TrimSpace(part)
		for _, label := range labels {
			part = strings.TrimPrefix(part, label)
		}
		return strings.TrimSpace(part)
	}

	fieldIndex := 0
	for _, part := range parts {
		cleaned := cleanPart(part)
		if cleaned == "" {
			continue
		}

		switch fieldIndex {
		case 0:
			report.Description = cleaned
		case 1:
			report.Career = cleaned
		case 2:
			report.Personality = cleaned
		case 3:
			report.MeetingTime = cleaned
		case 4:
			report.Distance = cleaned
		case 5:
			report.Strength = cleaned
		case 6:
			report.Weakness = cleaned
		}

		fieldIndex++
		if fieldIndex >= 7 {
			break
		}
	}

	// 如果解析不完整，使用默认值
	if report.Description == "" {
		report.Description = "A deep soul connection exists between you, with cosmic energies aligning in harmony. The stars whisper of a bond that transcends time and space."
	}
	if report.Career == "" {
		report.Career = "Your soulmate is likely drawn to creative or helping professions, where their natural empathy shines. They may work in fields related to art, healthcare, or technology."
	}
	if report.Personality == "" {
		report.Personality = "They possess a warm and intuitive nature, balancing thoughtfulness with spontaneity. Their presence brings calm yet excitement, and they value deep, meaningful connections."
	}
	if report.MeetingTime == "" {
		report.MeetingTime = "The celestial alignment suggests you may cross paths within the next 3-6 months. Keep your heart open during social gatherings and unexpected encounters."
	}
	if report.Distance == "" {
		report.Distance = "They are closer than you might expect - perhaps within 50-100 kilometers of your current location. Your energy fields are already beginning to resonate."
	}
	if report.Strength == "" {
		report.Strength = "Together you radiate loyalty, passion, and determination. Your bond thrives on mutual respect and the ability to support each other's dreams."
	}
	if report.Weakness == "" {
		report.Weakness = "Growth opportunities may arise through developing patience and understanding. Learning to navigate different communication styles will strengthen your connection."
	}

	return report
}

// translateReport 翻译报告到目标语言（支持7项）
// 包含重试机制处理 429 错误
func (s *GeminiReportService) translateReport(ctx context.Context, english *EnglishReport, targetLang string) (*EnglishReport, error) {
	prompt := fmt.Sprintf(`Translate the following seven paragraphs to %s. Keep the same mystical tone and meaning. Output ONLY the translations, separated by blank lines. Do not include any labels or numbers.

Paragraph 1 (Soul Connection Overview):
%s

Paragraph 2 (Career Outlook):
%s

Paragraph 3 (Personality Traits):
%s

Paragraph 4 (Meeting Time Prediction):
%s

Paragraph 5 (Distance Prediction):
%s

Paragraph 6 (Relationship Strengths):
%s

Paragraph 7 (Growth Opportunities):
%s`, targetLang,
		english.Description, english.Career, english.Personality,
		english.MeetingTime, english.Distance, english.Strength, english.Weakness)

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

// getMockTranslation 获取模拟翻译（7项）
func (s *GeminiReportService) getMockTranslation(english *EnglishReport, lang string) *EnglishReport {
	switch lang {
	case "zh":
		return &EnglishReport{
			Description: "根据你的星盘分析，你们之间存在着深厚的灵魂共鸣。你们的能量在宇宙层面产生了美妙的和谐，仿佛命中注定的相遇。",
			Career:      "你的灵魂伴侣可能从事创意或服务型职业，他们天生的同理心在工作中闪耀。他们可能在艺术、医疗或科技领域工作。",
			Personality: "他们拥有温暖而直觉敏锐的性格，在深思熟虑与自然随性之间保持平衡。他们的存在既带来平静又带来兴奋，重视深刻而有意义的连接。",
			MeetingTime: "星象显示，你们可能在接下来的3-6个月内相遇。在社交聚会和意想不到的场合保持开放的心态。",
			Distance:    "他们比你想象的更近——可能就在你当前位置50-100公里范围内。你们的能量场已经开始产生共鸣。",
			Strength:    "你们共同散发着忠诚、热情和坚定的光芒。你们的羁绊建立在相互尊重和支持彼此梦想的能力之上。",
			Weakness:    "成长机会可能来自培养耐心和理解。学会应对不同的沟通方式将加强你们的连接。",
		}
	case "ru":
		return &EnglishReport{
			Description: "Согласно анализу вашей натальной карты, между вами существует глубокий душевный резонанс. Ваши энергии создают прекрасную гармонию на космическом уровне.",
			Career:      "Ваша родственная душа, вероятно, работает в творческой или помогающей профессии, где сияет их природная эмпатия. Они могут работать в сфере искусства, здравоохранения или технологий.",
			Personality: "Они обладают теплой и интуитивной натурой, балансируя между вдумчивостью и спонтанностью. Их присутствие приносит спокойствие и волнение, и они ценят глубокие, значимые связи.",
			MeetingTime: "Небесное выравнивание предполагает, что вы можете пересечься в течение следующих 3-6 месяцев. Держите сердце открытым во время социальных встреч.",
			Distance:    "Они ближе, чем вы думаете — возможно, в пределах 50-100 километров от вашего текущего местоположения. Ваши энергетические поля уже начинают резонировать.",
			Strength:    "Вместе вы излучаете верность, страсть и решимость. Ваша связь процветает благодаря взаимному уважению и способности поддерживать мечты друг друга.",
			Weakness:    "Возможности для роста могут возникнуть через развитие терпения и понимания. Научиться ориентироваться в разных стилях общения укрепит вашу связь.",
		}
	default:
		return english
	}
}

func (s *GeminiReportService) getMockMultiLangReport(character *model.Character) *MultiLangReport {
	return &MultiLangReport{
		DescriptionEn: fmt.Sprintf("Based on your birth chart analysis, there is a deep soul resonance between you and this %s. Your energies create a beautiful harmony on a cosmic level, as if destined to meet.", character.AstroSign),
		DescriptionZh: fmt.Sprintf("根据你的星盘分析，你与这位%s之间存在着深厚的灵魂共鸣。你们的能量在宇宙层面产生了美妙的和谐，仿佛命中注定的相遇。", character.AstroSign),
		DescriptionRu: fmt.Sprintf("Согласно анализу вашей натальной карты, между вами и этим %s существует глубокий душевный резонанс. Ваши энергии создают прекрасную гармонию.", character.AstroSign),

		CareerEn: "Your soulmate is likely drawn to creative or helping professions, where their natural empathy shines. They may work in fields related to art, healthcare, education, or technology, bringing innovation and heart to everything they do.",
		CareerZh: "你的灵魂伴侣可能从事创意或服务型职业，他们天生的同理心在工作中闪耀。他们可能在艺术、医疗、教育或科技领域工作，为所做的一切带来创新和热情。",
		CareerRu: "Ваша родственная душа, вероятно, работает в творческой или помогающей профессии. Они могут работать в сфере искусства, здравоохранения, образования или технологий.",

		PersonalityEn: "They possess a warm and intuitive nature, balancing thoughtfulness with spontaneity. Their presence brings both calm and excitement, and they value deep, meaningful connections over superficial interactions.",
		PersonalityZh: "他们拥有温暖而直觉敏锐的性格，在深思熟虑与自然随性之间保持平衡。他们的存在既带来平静又带来兴奋，重视深刻而有意义的连接，而非肤浅的交往。",
		PersonalityRu: "Они обладают теплой и интуитивной натурой, балансируя между вдумчивостью и спонтанностью. Их присутствие приносит спокойствие и волнение.",

		MeetingTimeEn: "The celestial alignment suggests you may cross paths within the next 3-6 months. Keep your heart open during social gatherings, through mutual friends, or in unexpected places like a coffee shop or bookstore.",
		MeetingTimeZh: "星象显示，你们可能在接下来的3-6个月内相遇。在社交聚会中保持开放的心态，可能通过共同的朋友，或在咖啡馆、书店等意想不到的地方。",
		MeetingTimeRu: "Небесное выравнивание предполагает, что вы можете встретиться в течение следующих 3-6 месяцев. Держите сердце открытым на социальных мероприятиях.",

		DistanceEn: "They are closer than you might expect - perhaps within 50-100 kilometers of your current location. Your energy fields are already beginning to resonate, pulling you toward each other like cosmic magnets.",
		DistanceZh: "他们比你想象的更近——可能就在你当前位置50-100公里范围内。你们的能量场已经开始产生共鸣，像宇宙磁铁一样将你们彼此吸引。",
		DistanceRu: "Они ближе, чем вы думаете — возможно, в пределах 50-100 километров. Ваши энергетические поля уже резонируют, притягивая вас друг к другу.",

		StrengthEn: "Together you radiate loyalty, passion, and determination. Your bond thrives on honesty, shared goals, and the ability to support each other's dreams without jealousy or competition.",
		StrengthZh: "你们共同散发着忠诚、热情和坚定的光芒。你们的羁绊建立在真诚、共同目标，以及相互支持彼此梦想的能力之上，没有嫉妒或竞争。",
		StrengthRu: "Вместе вы излучаете верность, страсть и решимость. Ваша связь процветает благодаря честности и взаимной поддержке мечтаний друг друга.",

		WeaknessEn: "Growth opportunities may arise through developing patience and understanding. Learning to navigate different communication styles and giving each other space when needed will strengthen your bond over time.",
		WeaknessZh: "成长机会可能来自培养耐心和理解。学会应对不同的沟通方式，在需要时给予彼此空间，将随着时间推移加强你们的纽带。",
		WeaknessRu: "Возможности для роста возникнут через развитие терпения. Умение ориентироваться в разных стилях общения укрепит вашу связь со временем.",
	}
}
