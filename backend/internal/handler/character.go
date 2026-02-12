package handler

import (
	"fmt"
	"log"
	"math/rand"
	"strconv"
	"strings"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/i18n"
	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type CharacterHandler struct {
	characterRepo *repository.CharacterRepository
}

func NewCharacterHandler() *CharacterHandler {
	return &CharacterHandler{
		characterRepo: repository.NewCharacterRepository(),
	}
}

// Create 创建新角色
func (h *CharacterHandler) Create(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	var req struct {
		Type      string `json:"type" binding:"required"`
		Title     string `json:"title"`
		Gender    string `json:"gender" binding:"required"`
		Ethnicity string `json:"ethnicity" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters: "+err.Error())
		return
	}

	// 生成随机兼容性分数 (75-99)
	compatibility := 75 + rand.Intn(25)

	// 生成星座
	signs := []string{"Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"}
	astroSign := signs[rand.Intn(len(signs))]

	// 生成三种语言的初始描述（这只是模板，真正的 AI 报告在图片生成时创建）
	descriptionEn := generateCharacterDescription(astroSign, req.Gender, req.Ethnicity, i18n.LocaleEn)
	descriptionZh := generateCharacterDescription(astroSign, req.Gender, req.Ethnicity, i18n.LocaleZh)
	descriptionRu := generateCharacterDescription(astroSign, req.Gender, req.Ethnicity, i18n.LocaleRu)

	character := &model.Character{
		UserID:        user.ID,
		Type:          model.CharacterType(req.Type),
		Title:         req.Title,
		Gender:        req.Gender,
		Ethnicity:     req.Ethnicity,
		Compatibility: compatibility,
		AstroSign:     astroSign,
		DescriptionEn: descriptionEn,
		DescriptionZh: descriptionZh,
		DescriptionRu: descriptionRu,
		ShareCode:     repository.GenerateShareCode(), // 创建时就生成分享码
	}

	if character.Title == "" {
		// Set human-readable title based on type
		titleMap := map[model.CharacterType]string{
			model.CharacterTypeSoulmate:           "Soulmate",
			model.CharacterTypeMiniMe:             "Mini Me",
			model.CharacterTypeFutureHusband:      "Future Husband",
			model.CharacterTypeFutureWife:         "Future Wife",
			model.CharacterTypeFutureBaby:         "Future Baby",
			model.CharacterTypeBoyfriend:          "AI Boyfriend",
			model.CharacterTypeGirlfriend:         "AI Girlfriend",
			model.CharacterTypeBestFriend:         "Best Friend",
			model.CharacterTypeCompanion:          "Companion",
			model.CharacterTypeMysteriousStranger: "Mysterious Stranger",
			model.CharacterTypeWiseMentor:         "Wise Mentor",
			model.CharacterTypeDreamGuide:         "Dream Guide",
		}
		if title, ok := titleMap[character.Type]; ok {
			character.Title = title
		} else {
			character.Title = string(character.Type)
		}
	}

	// Check if user already has a character of this type (no duplicate creation allowed)
	existing, _ := h.characterRepo.GetByUserIDAndType(user.ID, model.CharacterType(req.Type))
	if existing != nil && existing.ImageURL != "" {
		response.Error(c, 409, "You already have a "+character.Title+". Each type can only be created once.")
		return
	}

	// Delete any incomplete (no image) character of the same type to allow retry
	if existing != nil {
		h.characterRepo.DeleteByUserIDAndType(user.ID, model.CharacterType(req.Type))
	}

	if err := h.characterRepo.Create(character); err != nil {
		response.Error(c, 500, "Failed to create: "+err.Error())
		return
	}

	locale := middleware.GetLocaleFromContext(c)
	response.Success(c, character.ToSafeResponse(string(locale)))
}

// List 获取用户的所有角色
func (h *CharacterHandler) List(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	characters, err := h.characterRepo.GetByUserID(user.ID)
	if err != nil {
		response.Error(c, 500, "Failed to query: "+err.Error())
		return
	}

	// 转换为安全响应，过滤敏感图片URL
	locale := middleware.GetLocaleFromContext(c)
	safeCharacters := make([]map[string]interface{}, len(characters))
	for i, char := range characters {
		// Mini Me 默认值兜底（兼容历史数据）
		if char.Type == model.CharacterTypeMiniMe {
			if char.Compatibility == 0 {
				char.Compatibility = 100
			}
			if char.AstroSign == "" {
				char.AstroSign = getZodiacSignFromBirthDate(user.BirthDate)
			}
		}

		safeResponse := char.ToSafeResponse(string(locale))
		// 记录返回的图片URL（包括原始值和规范化后的值）
		if i < 3 { // 只记录前3个，避免日志过多
			log.Printf("[Character] 返回角色图片URL - ID: %d, type: %s, unlock_status: %d", char.ID, char.Type, char.UnlockStatus)
			log.Printf("[Character] 原始URL - FullBlur: %q, HalfBlur: %q, Clear: %q", 
				char.FullBlurImageURL, char.HalfBlurImageURL, char.ClearImageURL)
			log.Printf("[Character] 规范化后URL - image_url: %q, full_blur: %q, half_blur: %q, clear: %q", 
				safeResponse["image_url"], safeResponse["full_blur_image_url"], 
				safeResponse["half_blur_image_url"], safeResponse["clear_image_url"])
		}
		safeCharacters[i] = safeResponse
	}

	response.Success(c, safeCharacters)
}

// GetByID 获取角色详情
func (h *CharacterHandler) GetByID(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.Error(c, 400, "Invalid character ID")
		return
	}

	character, err := h.characterRepo.GetByID(id)
	if err != nil {
		response.Error(c, 404, "Character not found")
		return
	}

	// 验证角色属于当前用户
	if character.UserID != user.ID {
		response.Error(c, 403, "Access denied")
		return
	}

	// Mini Me 默认值兜底（兼容历史数据）
	if character.Type == model.CharacterTypeMiniMe {
		if character.Compatibility == 0 {
			character.Compatibility = 100
		}
		if character.AstroSign == "" {
			character.AstroSign = getZodiacSignFromBirthDate(user.BirthDate)
		}
	}

	locale := middleware.GetLocaleFromContext(c)
	response.Success(c, character.ToSafeResponse(string(locale)))
}

// CleanupEmpty 清理没有图片的角色
func (h *CharacterHandler) CleanupEmpty(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	count, err := h.characterRepo.DeleteEmptyByUserID(user.ID)
	if err != nil {
		response.Error(c, 500, "Failed to cleanup: "+err.Error())
		return
	}

	response.Success(c, gin.H{"deleted": count, "message": fmt.Sprintf("Cleaned up %d unused characters", count)})
}

// toAbsoluteURL converts relative URLs to absolute URLs using the configured BASE_URL
func toAbsoluteURL(url string) string {
	if url == "" {
		return ""
	}
	// If already absolute (http/https), return as-is
	if strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://") {
		return url
	}
	// If data: URI, return as-is
	if strings.HasPrefix(url, "data:") {
		return url
	}
	// Otherwise prepend BASE_URL
	baseURL := config.AppConfig.BaseURL
	// Ensure BASE_URL doesn't end with slash if URL starts with slash
	if strings.HasSuffix(baseURL, "/") && strings.HasPrefix(url, "/") {
		return baseURL + url[1:]
	}
	if !strings.HasPrefix(url, "/") {
		return baseURL + "/" + url
	}
	return baseURL + url
}

// GetNFTMetadata returns ERC721-compatible metadata JSON for a character (public endpoint for marketplaces/wallets)
func (h *CharacterHandler) GetNFTMetadata(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid character ID"})
		return
	}

	character, err := h.characterRepo.GetByID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Character not found"})
		return
	}

	// Build the image URL (use clear image if available, else fallback)
	imageURL := character.ClearImageURL
	if imageURL == "" {
		imageURL = character.ImageURL
	}
	if imageURL == "" {
		imageURL = character.FullBlurImageURL
	}

	// Convert to absolute URL for NFT wallets/marketplaces
	absoluteImageURL := toAbsoluteURL(imageURL)

	// ERC721 metadata standard
	metadata := gin.H{
		"name":        character.Title,
		"description": fmt.Sprintf("LauraAI %s — %s %s, %s zodiac, %d%% compatibility", character.Title, character.Gender, character.Ethnicity, character.AstroSign, character.Compatibility),
		"image":       absoluteImageURL,
		"attributes": []gin.H{
			{"trait_type": "Type", "value": string(character.Type)},
			{"trait_type": "Gender", "value": character.Gender},
			{"trait_type": "Ethnicity", "value": character.Ethnicity},
			{"trait_type": "Zodiac Sign", "value": character.AstroSign},
			{"trait_type": "Compatibility", "value": character.Compatibility, "display_type": "number"},
		},
	}

	c.JSON(200, metadata)
}

// generateCharacterDescription 根据语言生成角色描述
func generateCharacterDescription(astroSign, gender, ethnicity string, locale i18n.Locale) string {
	switch locale {
	case i18n.LocaleZh:
		genderPronoun := "Ta"
		if gender == "Male" {
			genderPronoun = "他"
		} else if gender == "Female" {
			genderPronoun = "她"
		}
		return fmt.Sprintf(
			"一位拥有%s能量和%s血统的和谐伴侣。%s重视平衡与合作（%s日），带来情感的深度和关怀，并以敏锐的直觉提供共情。%s帮助软化界限，鼓励外交式沟通，并创造一个安全的情感港湾，让你的智慧好奇心和人文理想得以蓬勃发展。",
			astroSign, ethnicity, genderPronoun, astroSign, genderPronoun,
		)
	case i18n.LocaleRu:
		genderPronoun := "Он/Она"
		if gender == "Male" {
			genderPronoun = "Он"
		} else if gender == "Female" {
			genderPronoun = "Она"
		}
		return fmt.Sprintf(
			"Гармоничный партнёр с энергией %s и наследием %s. %s ценит баланс и партнёрство (%s Солнце), приносит эмоциональную глубину и заботу, и предлагает эмпатию с интуитивной чувствительностью. %s помогает смягчать границы, поощряет дипломатическое общение и создаёт безопасную эмоциональную гавань, где ваша интеллектуальная любознательность и гуманитарные идеалы могут процветать.",
			astroSign, ethnicity, genderPronoun, astroSign, genderPronoun,
		)
	default:
		genderPronoun := "They"
		if gender == "Male" {
			genderPronoun = "He"
		} else if gender == "Female" {
			genderPronoun = "She"
		}
		return fmt.Sprintf(
			"A harmonious partner with %s energy and %s heritage. %s values balance and partnership (%s Sun), brings emotional depth and nurturing, and offers empathy with intuitive sensitivity. %s helps soften boundaries, encourages diplomatic communication, and creates a safe emotional haven where your intellectual curiosity and humanitarian ideals can flourish.",
			astroSign, ethnicity, genderPronoun, astroSign, genderPronoun,
		)
	}
}
