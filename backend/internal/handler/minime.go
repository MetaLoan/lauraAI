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
		response.Error(c, 401, "未认证")
		return
	}

	// 1. 获取上传的文件
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.Error(c, 400, "请上传图片文件")
		return
	}
	defer file.Close()

	// 验证文件类型
	mimeType := header.Header.Get("Content-Type")
	if mimeType != "image/jpeg" && mimeType != "image/png" && mimeType != "image/webp" {
		response.Error(c, 400, "仅支持 JPG, PNG, WEBP 格式")
		return
	}

	// 读取文件内容
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		response.Error(c, 500, "读取文件失败")
		return
	}

	// 2. 调用 Vision API 分析图片
	ctx := c.Request.Context()
	description, err := h.visionService.AnalyzeImage(ctx, fileBytes, mimeType)
	if err != nil {
		response.Error(c, 500, "图片分析失败: "+err.Error())
		return
	}

	// 3. 调用 Imagen API 生成 Mini Me
	imageURL, err := h.imagenService.GenerateMiniMeImage(ctx, description)
	if err != nil {
		response.Error(c, 500, "生成 Mini Me 失败: "+err.Error())
		return
	}

	// 4. 创建 Character 记录
	character := &model.Character{
		UserID:      user.ID,
		Type:        "mini_me",
		Title:       "Mini Me",
		ImageURL:    imageURL,
		Description: fmt.Sprintf("Generated from selfie analysis: %s", description),
		Gender:      "Unknown", // 可以尝试从描述中提取，或者让用户确认
		Ethnicity:   "Unknown",
	}

	if err := h.characterRepo.Create(character); err != nil {
		response.Error(c, 500, "保存角色失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"character": character,
		"image_url": imageURL,
	})
}
