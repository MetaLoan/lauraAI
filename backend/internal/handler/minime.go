package handler

import (
	"fmt"
	"io"

	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
	"lauraai-backend/internal/service"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type MiniMeHandler struct {
	characterRepo *repository.CharacterRepository
	visionService *service.GeminiVisionService
	imagenService *service.GeminiImagenService
}

func NewMiniMeHandler(visionService *service.GeminiVisionService, imagenService *service.GeminiImagenService) *MiniMeHandler {
	return &MiniMeHandler{
		characterRepo: repository.NewCharacterRepository(),
		visionService: visionService,
		imagenService: imagenService,
	}
}

// UploadAndGenerateMiniMe 处理自拍上传并生成 Mini Me
func (h *MiniMeHandler) UploadAndGenerateMiniMe(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	// 1. 获取上传的文件
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.Error(c, 400, "Please upload image file")
		return
	}
	defer file.Close()

	// 验证文件类型
	mimeType := header.Header.Get("Content-Type")
	// 增加对 image/heic 的支持（虽然前端应该已经转换了，但后端保持鲁棒性）
	if mimeType != "image/jpeg" && mimeType != "image/png" && mimeType != "image/webp" && mimeType != "image/heic" {
		response.Error(c, 400, "Only JPG, PNG, WEBP, HEIC formats are supported")
		return
	}

	// 读取文件内容
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		response.Error(c, 500, "Failed to read file")
		return
	}

	// 2. 调用 Vision API 分析图片
	ctx := c.Request.Context()
	description, err := h.visionService.AnalyzeImage(ctx, fileBytes, mimeType)
	if err != nil {
		response.Error(c, 500, "Failed to analyze image: "+err.Error())
		return
	}

	// 3. 删除之前的 mini_me 角色（每个用户只能有一个）
	if err := h.characterRepo.DeleteByUserIDAndType(user.ID, model.CharacterTypeMiniMe); err != nil {
		// 忽略删除错误，继续创建
	}

	// 4. 创建 Character 记录（先创建，让 GenerateMiniMeImage 填充图片字段）
	// Mini Me 和其他角色一样，需要通过好友助力或付费解锁
	character := &model.Character{
		UserID:      user.ID,
		Type:        model.CharacterTypeMiniMe,
		Title:       "Mini Me",
		Description: fmt.Sprintf("Generated from selfie analysis: %s", description),
		Gender:      "Unknown", // 可以尝试从描述中提取，或者让用户确认
		Ethnicity:   "Unknown",
	}

	// 5. 调用 Imagen API 生成 Mini Me（会设置 ClearImageURL, FullBlurImageURL, HalfBlurImageURL, ShareCode, UnlockStatus）
	_, err = h.imagenService.GenerateMiniMeImage(ctx, description, character)
	if err != nil {
		response.Error(c, 500, "Failed to generate Mini Me: "+err.Error())
		return
	}

	// 设置 ImageURL 为当前应显示的图片（根据解锁状态，初始为模糊图）
	character.ImageURL = character.GetDisplayImageURL()

	if err := h.characterRepo.Create(character); err != nil {
		response.Error(c, 500, "Failed to save character: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"character": character.ToSafeResponse(),
		"image_url": character.GetDisplayImageURL(),
	})
}
