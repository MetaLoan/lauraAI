package handler

import (
	"fmt"
	"io"
	"log"

	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
	"lauraai-backend/internal/service"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type MiniMeHandler struct {
	characterRepo *repository.CharacterRepository
	mintOrderRepo *repository.MintOrderRepository
	visionService *service.GeminiVisionService
	imagenService *service.GeminiImagenService
}

func NewMiniMeHandler(visionService *service.GeminiVisionService, imagenService *service.GeminiImagenService) *MiniMeHandler {
	return &MiniMeHandler{
		characterRepo: repository.NewCharacterRepository(),
		mintOrderRepo: repository.NewMintOrderRepository(),
		visionService: visionService,
		imagenService: imagenService,
	}
}

// UploadAndGenerateMiniMe 处理自拍上传：分析图片 + 创建角色记录（不再同步生图）
// 生图通过前端调用 POST /api/characters/:id/generate-image 异步完成，与普通角色流程一致
func (h *MiniMeHandler) UploadAndGenerateMiniMe(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	// 与普通角色保持一致：已存在且已生成图片的 Mini Me 不允许重复创建
	existing, _ := h.characterRepo.GetByUserIDAndType(user.ID, model.CharacterTypeMiniMe)
	if existing != nil && existing.ImageURL != "" {
		response.Error(c, 409, "You already have a Mini Me. Each type can only be created once.")
		return
	}

	// 若已有已付款但未完成记录，直接复用（前端将走 already_paid 并继续流程）
	if existing != nil {
		paid, _ := h.mintOrderRepo.HasConfirmedForCharacter(user.ID, existing.ID)
		if paid {
			if existing.Compatibility <= 0 {
				existing.Compatibility = 100
				_ = h.characterRepo.Update(existing)
			}
			if existing.AstroSign == "" {
				existing.AstroSign = getZodiacSignFromBirthDate(user.BirthDate)
				_ = h.characterRepo.Update(existing)
			}
			locale := middleware.GetLocaleFromContext(c)
			response.Success(c, gin.H{
				"character": existing.ToSafeResponse(string(locale)),
			})
			return
		}

		// 无付款的旧未完成记录直接删除，避免列表脏数据
		if err := h.characterRepo.DeleteByUserIDAndType(user.ID, model.CharacterTypeMiniMe); err != nil {
			log.Printf("[MiniMe] 删除旧未完成角色忽略错误: %v", err)
		}
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

	// 2. 调用 Vision API 分析图片，提取面部描述
	ctx := c.Request.Context()
	description, err := h.visionService.AnalyzeImage(ctx, fileBytes, mimeType)
	if err != nil {
		response.Error(c, 500, "Failed to analyze image: "+err.Error())
		return
	}

	log.Printf("[MiniMe] 用户 %d 图片分析完成: %s", user.ID, description)

	// 3. 创建 Character 记录（image_status 为空，等前端 Mint 后再调 generate-image）
	astroSign := getZodiacSignFromBirthDate(user.BirthDate)
	character := &model.Character{
		UserID:        user.ID,
		Type:          model.CharacterTypeMiniMe,
		Title:         "Mini Me",
		DescriptionEn: fmt.Sprintf("Generated from selfie analysis: %s", description),
		Gender:        "Unknown",
		Ethnicity:     "Unknown",
		Compatibility: 100,
		AstroSign:     astroSign,
		ImageStatus:   "", // 空状态，等待前端触发异步生图
	}

	if err := h.characterRepo.Create(character); err != nil {
		response.Error(c, 500, "Failed to save character: "+err.Error())
		return
	}

	log.Printf("[MiniMe] 用户 %d 角色 %d 创建成功（异步模式，等待前端触发生图）", user.ID, character.ID)

	locale := middleware.GetLocaleFromContext(c)
	response.Success(c, gin.H{
		"character": character.ToSafeResponse(string(locale)),
	})
}
