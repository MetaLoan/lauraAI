package handler

import (
	"fmt"
	"math/rand"
	"strconv"

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
		response.Error(c, 401, "未认证")
		return
	}

	var req struct {
		Type      string `json:"type" binding:"required"`
		Title     string `json:"title"`
		Gender    string `json:"gender" binding:"required"`
		Ethnicity string `json:"ethnicity" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "无效的请求参数: "+err.Error())
		return
	}

	// 生成随机兼容性分数 (75-99)
	compatibility := 75 + rand.Intn(25)

	// 生成星座
	signs := []string{"Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"}
	astroSign := signs[rand.Intn(len(signs))]

	// 根据性别和民族生成描述
	genderPronoun := "They"
	if req.Gender == "Male" {
		genderPronoun = "He"
	} else if req.Gender == "Female" {
		genderPronoun = "She"
	}

	description := fmt.Sprintf(
		"A harmonious partner with %s energy and %s heritage. %s values balance and partnership (%s Sun), brings emotional depth and nurturing, and offers empathy with intuitive sensitivity. %s helps soften boundaries, encourages diplomatic communication, and creates a safe emotional haven where your intellectual curiosity and humanitarian ideals can flourish.",
		astroSign, req.Ethnicity, genderPronoun, astroSign, genderPronoun,
	)

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
			character.Title = "Your Soulmate"
		case model.CharacterTypeMiniMe:
			character.Title = "Mini Me"
		default:
			character.Title = string(character.Type)
		}
	}

	if err := h.characterRepo.Create(character); err != nil {
		response.Error(c, 500, "创建失败: "+err.Error())
		return
	}

	response.Success(c, character)
}

// List 获取用户的所有角色
func (h *CharacterHandler) List(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "未认证")
		return
	}

	characters, err := h.characterRepo.GetByUserID(user.ID)
	if err != nil {
		response.Error(c, 500, "查询失败: "+err.Error())
		return
	}

	response.Success(c, characters)
}

// GetByID 获取角色详情
func (h *CharacterHandler) GetByID(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "未认证")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.Error(c, 400, "无效的角色 ID")
		return
	}

	character, err := h.characterRepo.GetByID(id)
	if err != nil {
		response.Error(c, 404, "角色不存在")
		return
	}

	// 验证角色属于当前用户
	if character.UserID != user.ID {
		response.Error(c, 403, "无权访问")
		return
	}

	response.Success(c, character)
}

// CleanupEmpty 清理没有图片的角色
func (h *CharacterHandler) CleanupEmpty(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "未认证")
		return
	}

	count, err := h.characterRepo.DeleteEmptyByUserID(user.ID)
	if err != nil {
		response.Error(c, 500, "清理失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{"deleted": count, "message": fmt.Sprintf("已清理 %d 个无用角色", count)})
}
