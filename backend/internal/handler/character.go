package handler

import (
	"fmt"
	"log"
	"math/rand"
	"os"
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
	mintOrderRepo *repository.MintOrderRepository
}

func NewCharacterHandler() *CharacterHandler {
	return &CharacterHandler{
		characterRepo: repository.NewCharacterRepository(),
		mintOrderRepo: repository.NewMintOrderRepository(),
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

	// If previous character has confirmed payment but image is missing/failed,
	// keep it and return the existing record so frontend can continue from already_paid flow.
	if existing != nil {
		paid, _ := h.mintOrderRepo.HasConfirmedForCharacter(user.ID, existing.ID)
		if paid {
			if ensureCharacterMetaDefaults(existing, user) {
				_ = h.characterRepo.Update(existing)
			}
			locale := middleware.GetLocaleFromContext(c)
			response.Success(c, existing.ToSafeResponse(string(locale)))
			return
		}

		// Delete unpaid incomplete character of the same type to avoid ghost entries.
		h.characterRepo.DeleteByUserIDAndType(user.ID, model.CharacterType(req.Type))
	}

	if err := h.characterRepo.Create(character); err != nil {
		response.Error(c, 500, "Failed to create: "+err.Error())
		return
	}

	locale := middleware.GetLocaleFromContext(c)
	response.Success(c, character.ToSafeResponse(string(locale)))
}

func ensureCharacterMetaDefaults(char *model.Character, user *model.User) bool {
	changed := false

	if char.Type == model.CharacterTypeMiniMe {
		if char.Compatibility <= 0 {
			char.Compatibility = 100
			changed = true
		}
		if strings.TrimSpace(char.AstroSign) == "" {
			char.AstroSign = getZodiacSignFromBirthDate(user.BirthDate)
			changed = true
		}
		return changed
	}

	if char.Compatibility <= 0 {
		// Keep deterministic fallback for old rows that missed compatibility initialization.
		char.Compatibility = 75 + int(char.ID%25)
		changed = true
	}
	if strings.TrimSpace(char.AstroSign) == "" {
		sign := getZodiacSignFromBirthDate(user.BirthDate)
		if strings.TrimSpace(sign) == "" {
			sign = "Libra"
		}
		char.AstroSign = sign
		changed = true
	}

	return changed
}

func hasAnyImage(char model.Character) bool {
	return strings.TrimSpace(char.ImageURL) != "" ||
		strings.TrimSpace(char.FullBlurImageURL) != "" ||
		strings.TrimSpace(char.HalfBlurImageURL) != "" ||
		strings.TrimSpace(char.ClearImageURL) != ""
}

func hasMintStarted(order *model.MintOrder) bool {
	if order == nil {
		return false
	}
	// Visible recovery states:
	// - confirmed: paid and done
	// - verifying/failed: payment sent and verification/regen needs recovery
	if order.Status == model.MintOrderStatusConfirmed ||
		order.Status == model.MintOrderStatusVerifying ||
		order.Status == model.MintOrderStatusFailed {
		return true
	}
	// Fallback for legacy rows: pending but tx hash already captured.
	return order.TxHash != nil && strings.TrimSpace(*order.TxHash) != ""
}

func computeMintUIState(char model.Character, order *model.MintOrder) string {
	if hasAnyImage(char) && char.ImageStatus == "done" {
		return "done"
	}

	imageStatus := strings.ToLower(strings.TrimSpace(char.ImageStatus))
	orderStatus := ""
	hasTx := false
	if order != nil {
		orderStatus = strings.ToLower(string(order.Status))
		hasTx = order.TxHash != nil && strings.TrimSpace(*order.TxHash) != ""
	}

	if imageStatus == "failed" {
		if orderStatus == string(model.MintOrderStatusConfirmed) {
			return "retry_generation"
		}
		if orderStatus == string(model.MintOrderStatusFailed) {
			return "retry_mint"
		}
		if hasTx || orderStatus == string(model.MintOrderStatusVerifying) || orderStatus == string(model.MintOrderStatusPending) {
			return "minting"
		}
		return "retry_generation"
	}

	if imageStatus == "generating" {
		return "generating"
	}

	switch orderStatus {
	case string(model.MintOrderStatusConfirmed):
		if imageStatus == "" {
			return "generating"
		}
		return "done"
	case string(model.MintOrderStatusFailed):
		return "retry_mint"
	case string(model.MintOrderStatusPending), string(model.MintOrderStatusVerifying):
		return "minting"
	default:
		if hasTx {
			return "minting"
		}
	}

	return "new"
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
	safeCharacters := make([]map[string]interface{}, 0, len(characters))
	for _, char := range characters {
		var latestOrder *model.MintOrder
		// Hide unpaid+unrendered characters:
		// If no image exists and mint did not start, this is an abandoned/unpaid attempt.
		if !hasAnyImage(char) {
			latestOrder, _ = h.mintOrderRepo.GetLatestByCharacter(user.ID, char.ID)
			if !hasMintStarted(latestOrder) {
				continue
			}
		}

		if ensureCharacterMetaDefaults(&char, user) {
			_ = h.characterRepo.Update(&char)
		}

		safeResponse := char.ToSafeResponse(string(locale))
		if latestOrder != nil {
			safeResponse["mint_order_status"] = string(latestOrder.Status)
		}
		safeResponse["mint_ui_state"] = computeMintUIState(char, latestOrder)
		safeResponse["mint_paid"] = latestOrder != nil && latestOrder.Status == model.MintOrderStatusConfirmed
		safeResponse["mint_has_tx"] = latestOrder != nil && latestOrder.TxHash != nil && strings.TrimSpace(*latestOrder.TxHash) != ""
		// 记录返回的图片URL（包括原始值和规范化后的值）
		if len(safeCharacters) < 3 { // 只记录前3个，避免日志过多
			log.Printf("[Character] 返回角色图片URL - ID: %d, type: %s, unlock_status: %d", char.ID, char.Type, char.UnlockStatus)
			log.Printf("[Character] 原始URL - FullBlur: %q, HalfBlur: %q, Clear: %q",
				char.FullBlurImageURL, char.HalfBlurImageURL, char.ClearImageURL)
			log.Printf("[Character] 规范化后URL - image_url: %q, full_blur: %q, half_blur: %q, clear: %q",
				safeResponse["image_url"], safeResponse["full_blur_image_url"],
				safeResponse["half_blur_image_url"], safeResponse["clear_image_url"])
		}
		safeCharacters = append(safeCharacters, safeResponse)
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

	if !hasAnyImage(*character) {
		latestOrder, _ := h.mintOrderRepo.GetLatestByCharacter(user.ID, character.ID)
		if !hasMintStarted(latestOrder) {
			response.Error(c, 404, "Character not found")
			return
		}
		if ensureCharacterMetaDefaults(character, user) {
			_ = h.characterRepo.Update(character)
		}
		locale := middleware.GetLocaleFromContext(c)
		resp := character.ToSafeResponse(string(locale))
		if latestOrder != nil {
			resp["mint_order_status"] = string(latestOrder.Status)
		}
		resp["mint_ui_state"] = computeMintUIState(*character, latestOrder)
		resp["mint_paid"] = latestOrder != nil && latestOrder.Status == model.MintOrderStatusConfirmed
		resp["mint_has_tx"] = latestOrder != nil && latestOrder.TxHash != nil && strings.TrimSpace(*latestOrder.TxHash) != ""
		response.Success(c, resp)
		return
	}

	if ensureCharacterMetaDefaults(character, user) {
		_ = h.characterRepo.Update(character)
	}

	locale := middleware.GetLocaleFromContext(c)
	resp := character.ToSafeResponse(string(locale))
	latestOrder, _ := h.mintOrderRepo.GetLatestByCharacter(user.ID, character.ID)
	if latestOrder != nil {
		resp["mint_order_status"] = string(latestOrder.Status)
	}
	resp["mint_ui_state"] = computeMintUIState(*character, latestOrder)
	resp["mint_paid"] = latestOrder != nil && latestOrder.Status == model.MintOrderStatusConfirmed
	resp["mint_has_tx"] = latestOrder != nil && latestOrder.TxHash != nil && strings.TrimSpace(*latestOrder.TxHash) != ""
	response.Success(c, resp)
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

	// Convert to absolute URL for NFT wallets/marketplaces.
	// Always use the production base URL so that wallets and marketplaces
	// can actually fetch the image (localhost is not accessible externally).
	nftBaseURL := strings.TrimSpace(os.Getenv("NFT_IMAGE_BASE_URL"))
	if nftBaseURL == "" {
		nftBaseURL = "https://lauraai-backend.fly.dev"
	}
	absoluteImageURL := imageURL
	if absoluteImageURL != "" && !strings.HasPrefix(absoluteImageURL, "http") {
		if !strings.HasPrefix(absoluteImageURL, "/") {
			absoluteImageURL = "/" + absoluteImageURL
		}
		absoluteImageURL = strings.TrimRight(nftBaseURL, "/") + absoluteImageURL
	}

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
