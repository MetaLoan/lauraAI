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
		response.Error(c, 401, "未认证")
		return
	}

	idStr := c.Param("id")
	characterID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.Error(c, 400, "无效的角色 ID")
		return
	}

	// 获取角色
	character, err := h.characterRepo.GetByID(characterID)
	if err != nil {
		response.Error(c, 404, "角色不存在")
		return
	}

	// 验证角色属于当前用户
	if character.UserID != user.ID {
		response.Error(c, 403, "无权访问")
		return
	}

	// 生成图片（会同时生成3张：清晰、半模糊、完全模糊）
	ctx := c.Request.Context()
	_, err = h.imagenService.GenerateImage(ctx, character)
	if err != nil {
		response.Error(c, 500, "生成图片失败: "+err.Error())
		return
	}

	// 设置 ImageURL 为当前应显示的图片（根据解锁状态）
	character.ImageURL = character.GetDisplayImageURL()

	// 更新角色的所有图片字段
	if err := h.characterRepo.Update(character); err != nil {
		response.Error(c, 500, "更新角色失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"image_url":           character.GetDisplayImageURL(),
		"full_blur_image_url": character.FullBlurImageURL,
		"half_blur_image_url": character.HalfBlurImageURL,
		"clear_image_url":     character.ClearImageURL,
		"unlock_status":       character.UnlockStatus,
		"share_code":          character.ShareCode,
		"character":           character,
	})
}
