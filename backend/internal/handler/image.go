package handler

import (
	"log"
	"strconv"

	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/repository"
	"lauraai-backend/internal/service"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type ImageHandler struct {
	characterRepo *repository.CharacterRepository
	userRepo      *repository.UserRepository
	imagenService *service.GeminiImagenService
	reportService *service.GeminiReportService
}

func NewImageHandler(imagenService *service.GeminiImagenService, reportService *service.GeminiReportService) *ImageHandler {
	return &ImageHandler{
		characterRepo: repository.NewCharacterRepository(),
		userRepo:      repository.NewUserRepository(),
		imagenService: imagenService,
		reportService: reportService,
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

	// 获取完整的用户信息用于生成报告
	fullUser, err := h.userRepo.GetByID(user.ID)
	if err != nil {
		log.Printf("[Image] 获取用户信息失败: %v", err)
		fullUser = user // 使用 context 中的用户信息作为后备
	}

	// 生成 AI 多语言报告（一次生成三种语言，确保内容一致）
	// 注意：这里仍然尝试生成，如果失败（如429），则留空，由 UnlockHandler 补生成
	report, err := h.reportService.GenerateMultiLangReport(ctx, fullUser, character)
	if err != nil {
		log.Printf("[Image] 生成报告失败: %v (将在解锁时重试)", err)
		// 报告生成失败不影响图片生成，继续执行
	} else {
		// 存储三种语言的报告
		character.DescriptionEn = report.DescriptionEn
		character.DescriptionZh = report.DescriptionZh
		character.DescriptionRu = report.DescriptionRu
		character.StrengthEn = report.StrengthEn
		character.StrengthZh = report.StrengthZh
		character.StrengthRu = report.StrengthRu
		character.WeaknessEn = report.WeaknessEn
		character.WeaknessZh = report.WeaknessZh
		character.WeaknessRu = report.WeaknessRu
	}

	// 设置 ImageURL 为当前应显示的图片（根据解锁状态）
	character.ImageURL = character.GetDisplayImageURL()

	// 更新角色的所有图片字段
	if err := h.characterRepo.Update(character); err != nil {
		response.Error(c, 500, "Failed to update character: "+err.Error())
		return
	}

	// 使用安全响应，根据用户语言返回对应的报告
	locale := middleware.GetLocaleFromContext(c)
	safeResponse := character.ToSafeResponse(string(locale))
	
	// 只返回安全响应，不单独暴露图片URL字段
	response.Success(c, safeResponse)
}
