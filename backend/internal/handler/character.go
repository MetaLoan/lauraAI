package handler

import (
	"fmt"
	"log"
	"math/rand"
	"strconv"

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

	// 获取语言
	locale := middleware.GetLocaleFromContext(c)

	// 根据性别和民族生成描述
	description := generateCharacterDescription(astroSign, req.Gender, req.Ethnicity, locale)

	character := &model.Character{
		UserID:        user.ID,
		Type:          model.CharacterType(req.Type),
		Title:         req.Title,
		Gender:        req.Gender,
		Ethnicity:     req.Ethnicity,
		Compatibility: compatibility,
		AstroSign:     astroSign,
		Description:   description,
		ShareCode:     repository.GenerateShareCode(), // 创建时就生成分享码
	}

	if character.Title == "" {
		// 根据类型设置默认标题
		switch character.Type {
		case model.CharacterTypeSoulmate:
			character.Title = "Soulmate"
		case model.CharacterTypeMiniMe:
			character.Title = "Mini Me"
		default:
			character.Title = string(character.Type)
		}
	}

	// 每个角色类型只允许有一个最新的，删除同类型的旧角色
	if err := h.characterRepo.DeleteByUserIDAndType(user.ID, model.CharacterType(req.Type)); err != nil {
		// 忽略删除错误，继续创建
	}

	if err := h.characterRepo.Create(character); err != nil {
		response.Error(c, 500, "Failed to create: "+err.Error())
		return
	}

	response.Success(c, character.ToSafeResponse())
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
	safeCharacters := make([]map[string]interface{}, len(characters))
	for i, char := range characters {
		safeResponse := char.ToSafeResponse()
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

	response.Success(c, character.ToSafeResponse())
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
