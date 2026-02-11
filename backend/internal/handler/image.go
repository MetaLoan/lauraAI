package handler

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
	"lauraai-backend/internal/service"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

const (
	imageGenMaxRetries = 3                // 图片生成最大重试次数
	imageGenRetryDelay = 5 * time.Second  // 重试间隔
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

	// 检查角色是否已经生成过图片（有清晰图就说明已完成）
	if character.ClearImageURL != "" || character.FullBlurImageURL != "" || character.HalfBlurImageURL != "" {
		response.Error(c, 400, "Character image already generated, please do not request again")
		return
	}

	// 检查是否已经在生成中（防止重复触发）
	if character.ImageStatus == "generating" {
		response.Success(c, gin.H{
			"status":  "generating",
			"message": "Image generation is already in progress",
		})
		return
	}

	// 允许 failed 状态重新触发（用户已付过 Mint 费用，无需再付）
	// 空状态也允许（首次生成）
	if character.ImageStatus != "" && character.ImageStatus != "failed" {
		response.Error(c, 400, "Invalid character state for image generation")
		return
	}

	isRetry := character.ImageStatus == "failed"
	if isRetry {
		log.Printf("[Image] 角色 %d 重试生图（上次失败）", character.ID)
	}

	// 标记为生成中
	character.ImageStatus = "generating"
	if err := h.characterRepo.Update(character); err != nil {
		response.Error(c, 500, "Failed to update character status: "+err.Error())
		return
	}

	// 获取完整的用户信息（在 goroutine 外获取以保持 gin.Context 安全）
	fullUser, err := h.userRepo.GetByID(user.ID)
	if err != nil {
		log.Printf("[Image] 获取用户信息失败: %v", err)
		fullUser = user
	}

	// 后台异步生成图片+报告，客户端断开不影响
	go h.doGenerateImageAndReport(character, fullUser)

	// 立即返回
	msg := "Image generation started, please poll for results"
	if isRetry {
		msg = "Retrying image generation, please poll for results"
	}
	response.Success(c, gin.H{
		"status":  "generating",
		"message": msg,
	})
}

// doGenerateImageAndReport 后台执行图片生成和报告生成（含重试）
func (h *ImageHandler) doGenerateImageAndReport(character *model.Character, user *model.User) {
	ctx := context.Background() // 脱离请求 context，不会被客户端断开取消

	log.Printf("[Image] 开始后台生成角色 %d 的图片...", character.ID)

	// Step 1: 生成图片（最多重试 imageGenMaxRetries 次）
	var lastErr error
	imageGenSuccess := false
	for attempt := 1; attempt <= imageGenMaxRetries; attempt++ {
		log.Printf("[Image] 角色 %d 图片生成第 %d/%d 次尝试...", character.ID, attempt, imageGenMaxRetries)

		_, err := h.imagenService.GenerateImage(ctx, character)
		if err == nil {
			imageGenSuccess = true
			break
		}

		lastErr = err
		log.Printf("[Image] 角色 %d 第 %d 次图片生成失败: %v", character.ID, attempt, err)

		if attempt < imageGenMaxRetries {
			log.Printf("[Image] 角色 %d 等待 %v 后重试...", character.ID, imageGenRetryDelay)
			time.Sleep(imageGenRetryDelay)
		}
	}

	if !imageGenSuccess {
		log.Printf("[Image] 角色 %d 图片生成 %d 次全部失败，最后错误: %v", character.ID, imageGenMaxRetries, lastErr)
		character.ImageStatus = "failed"
		character.ImageFailReason = fmt.Sprintf("Failed after %d attempts: %v", imageGenMaxRetries, lastErr)
		h.characterRepo.Update(character)
		return
	}

	log.Printf("[Image] 角色 %d 图片生成成功，开始生成报告...", character.ID)

	// Step 2: 生成 AI 多语言报告（报告失败不影响整体）
	report, err := h.reportService.GenerateMultiLangReport(ctx, user, character)
	if err != nil {
		log.Printf("[Image] 后台生成报告失败: %v (将在解锁时重试)", err)
	} else {
		character.DescriptionEn = report.DescriptionEn
		character.DescriptionZh = report.DescriptionZh
		character.DescriptionRu = report.DescriptionRu
		character.CareerEn = report.CareerEn
		character.CareerZh = report.CareerZh
		character.CareerRu = report.CareerRu
		character.PersonalityEn = report.PersonalityEn
		character.PersonalityZh = report.PersonalityZh
		character.PersonalityRu = report.PersonalityRu
		character.MeetingTimeEn = report.MeetingTimeEn
		character.MeetingTimeZh = report.MeetingTimeZh
		character.MeetingTimeRu = report.MeetingTimeRu
		character.DistanceEn = report.DistanceEn
		character.DistanceZh = report.DistanceZh
		character.DistanceRu = report.DistanceRu
		character.StrengthEn = report.StrengthEn
		character.StrengthZh = report.StrengthZh
		character.StrengthRu = report.StrengthRu
		character.WeaknessEn = report.WeaknessEn
		character.WeaknessZh = report.WeaknessZh
		character.WeaknessRu = report.WeaknessRu
	}

	// Step 3: 标记完成
	character.ImageURL = character.GetDisplayImageURL()
	character.ImageStatus = "done"
	character.ImageFailReason = "" // 清空失败原因

	if err := h.characterRepo.Update(character); err != nil {
		log.Printf("[Image] 后台更新角色 %d 失败: %v", character.ID, err)
		return
	}

	log.Printf("[Image] 后台生成角色 %d 全部完成！", character.ID)
}
