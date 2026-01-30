package handler

import (
	"strconv"

	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/repository"
	"lauraai-backend/internal/service"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type ImageHandler struct {
	characterRepo *repository.CharacterRepository
	imagenService *service.GeminiImagenService
}

func NewImageHandler(imagenService *service.GeminiImagenService) *ImageHandler {
	return &ImageHandler{
		characterRepo: repository.NewCharacterRepository(),
		imagenService: imagenService,
	}
}

// GenerateImage 生成角色图片
func (h *ImageHandler) GenerateImage(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	idStr := c.Param("id")
	characterID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.Error(c, 400, "Invalid character ID")
		return
	}

	// 获取角色
	character, err := h.characterRepo.GetByID(characterID)
	if err != nil {
		response.Error(c, 404, "Character not found")
		return
	}

	// 验证角色属于当前用户
	if character.UserID != user.ID {
		response.Error(c, 403, "Access denied")
		return
	}

	// 检查角色是否已经生成过图片
	// 只要有任何一张图片 URL 存在，就认为已经生成过，不允许重复生成
	if character.ClearImageURL != "" || character.FullBlurImageURL != "" || character.HalfBlurImageURL != "" {
		response.Error(c, 400, "Character image already generated, please do not request again")
		return
	}

	// 生成图片（会同时生成3张：清晰、半模糊、完全模糊）
	ctx := c.Request.Context()
	_, err = h.imagenService.GenerateImage(ctx, character)
	if err != nil {
		response.Error(c, 500, "Failed to generate image: "+err.Error())
		return
	}

	// 设置 ImageURL 为当前应显示的图片（根据解锁状态）
	character.ImageURL = character.GetDisplayImageURL()

	// 更新角色的所有图片字段
	if err := h.characterRepo.Update(character); err != nil {
		response.Error(c, 500, "Failed to update character: "+err.Error())
		return
	}

	// 使用安全响应，不暴露未解锁的图片URL
	safeResponse := character.ToSafeResponse()
	
	// 只返回安全响应，不单独暴露图片URL字段
	response.Success(c, safeResponse)
}
