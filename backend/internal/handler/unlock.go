package handler

import (
	"context"
	"fmt"
	"log"
	"strconv"

	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
	"lauraai-backend/internal/service"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

// 价格配置
const (
	FullUnlockPriceStars = 300 // 全价解锁（星星）
	FullUnlockPriceTON   = 3   // 全价解锁（TON）
	HalfUnlockPriceStars = 100 // 半价解锁（星星）
	HalfUnlockPriceTON   = 1   // 半价解锁（TON）
)

type UnlockHandler struct {
	characterRepo *repository.CharacterRepository
	userRepo      *repository.UserRepository
	reportService *service.GeminiReportService
}

func NewUnlockHandler(reportService *service.GeminiReportService) *UnlockHandler {
	return &UnlockHandler{
		characterRepo: repository.NewCharacterRepository(),
		userRepo:      repository.NewUserRepository(),
		reportService: reportService,
	}
}

// GetShareInfo 获取分享链接的角色信息（公开接口，无需认证）
func (h *UnlockHandler) GetShareInfo(c *gin.Context) {
	shareCode := c.Param("code")
	if shareCode == "" {
		response.Error(c, 400, "Invalid share code")
		return
	}

	character, err := h.characterRepo.GetByShareCode(shareCode)
	if err != nil {
		response.Error(c, 404, "Share link invalid or expired")
		return
	}

	// 获取角色所有者信息
	owner, err := h.userRepo.GetByID(character.UserID)
	if err != nil {
		response.Error(c, 500, "Failed to get user information")
		return
	}

	// 返回公开信息
	// 半模糊图也是模糊的，可以公开返回（用于助力成功后显示）
	charInfo := gin.H{
		"id":                  character.ID,
		"title":               character.Title,
		"type":                character.Type,
		"full_blur_image_url": character.FullBlurImageURL,
		"half_blur_image_url": character.HalfBlurImageURL,
		"unlock_status":       character.UnlockStatus,
		"share_code":          character.ShareCode,
	}

	response.Success(c, gin.H{
		"character": charInfo,
		"owner": gin.H{
			"id":   owner.ID,
			"name": owner.Name,
		},
	})
}

// HelpUnlock 好友帮助解锁（将解锁状态从0改为1）
// 条件：帮助者必须是角色所有者邀请的用户，且只能帮助邀请者解锁一次
func (h *UnlockHandler) HelpUnlock(c *gin.Context) {
	helper, exists := middleware.GetUserFromContext(c)
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

	character, err := h.characterRepo.GetByID(characterID)
	if err != nil {
		response.Error(c, 404, "Character not found")
		return
	}

	// 不能帮自己解锁
	if character.UserID == helper.ID {
		response.Error(c, 400, "Cannot help yourself unlock")
		return
	}

	// 检查帮助者是否是角色所有者邀请的用户
	// 1. 检查 InviterID 是否匹配
	isInvitedByOwner := helper.InviterID != nil && *helper.InviterID == character.UserID
	
	// 2. 如果不匹配，尝试通过分享链接的逻辑自动绑定（如果用户还没有邀请人）
	if !isInvitedByOwner && helper.InviterID == nil {
		// 如果用户是通过分享链接进来的，且还没有邀请人，自动绑定为该角色的所有者
		_ = h.userRepo.SetInviter(helper.ID, character.UserID)
		isInvitedByOwner = true
		log.Printf("HelpUnlock: 自动为用户 %d 绑定邀请人 %d", helper.ID, character.UserID)
	}

	if !isInvitedByOwner {
		response.ErrorWithCode(c, 403, "NOT_INVITED", "You are not invited by this user")
		return
	}

	// 检查帮助者是否曾经帮助过这个用户的任何角色
	hasHelped, err := h.characterRepo.HasUserHelpedOwner(helper.ID, character.UserID)
	if err != nil {
		response.Error(c, 500, "Failed to check help record: "+err.Error())
		return
	}
	if hasHelped {
		response.ErrorWithCode(c, 400, "ALREADY_HELPED", "You have already helped this user")
		return
	}

	// 只有未解锁状态才能帮忙解锁
	if character.UnlockStatus != model.UnlockStatusLocked {
		response.Error(c, 400, "Character already unlocked or already helped")
		return
	}

	// 更新解锁状态为半解锁
	helperID := helper.ID
	if err := h.characterRepo.UpdateUnlockStatus(characterID, model.UnlockStatusHalfUnlocked, &helperID); err != nil {
		response.Error(c, 500, "Failed to unlock: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"message":       "帮助解锁成功",
		"unlock_status": model.UnlockStatusHalfUnlocked,
		"image_url":     character.HalfBlurImageURL,
	})
}

// Unlock 付费解锁角色
func (h *UnlockHandler) Unlock(c *gin.Context) {
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

	// 已完全解锁
	if character.UnlockStatus == model.UnlockStatusFullUnlocked {
		response.Error(c, 400, "Character already fully unlocked")
		return
	}

	var req struct {
		PaymentMethod string `json:"payment_method" binding:"required"` // "stars" or "ton"
		TransactionID string `json:"transaction_id"`                    // 支付凭证（简化处理）
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters")
		return
	}

	// 计算价格
	var expectedPrice int
	if character.UnlockStatus == model.UnlockStatusHalfUnlocked {
		// 半价
		if req.PaymentMethod == "stars" {
			expectedPrice = HalfUnlockPriceStars
		} else {
			expectedPrice = HalfUnlockPriceTON
		}
	} else {
		// 全价
		if req.PaymentMethod == "stars" {
			expectedPrice = FullUnlockPriceStars
		} else {
			expectedPrice = FullUnlockPriceTON
		}
	}

	// TODO: verify payment on-chain (simplified for now, assumes payment success)

	// 更新解锁状态为完全解锁
	if err := h.characterRepo.UpdateUnlockStatus(characterID, model.UnlockStatusFullUnlocked, nil); err != nil {
		response.Error(c, 500, "Failed to unlock: "+err.Error())
		return
	}

	// 更新 ImageURL 为清晰图片
	character.UnlockStatus = model.UnlockStatusFullUnlocked
	character.ImageURL = character.ClearImageURL
	if err := h.characterRepo.Update(character); err != nil {
		response.Error(c, 500, "Failed to update character: "+err.Error())
		return
	}

	// 如果报告尚未生成（例如创建时失败），在解锁时异步生成
	// 注意：这里不会阻塞响应，前端需要处理报告为空的情况（显示加载动画）
	if character.DescriptionEn == "" {
		go func(charID uint64, userID uint64) {
			// 创建新的上下文，因为请求上下文会随请求结束而取消
			ctx := context.Background()
			
			// 重新获取最新数据
			char, err := h.characterRepo.GetByID(charID)
			if err != nil {
				log.Printf("[Unlock] 异步生成报告失败: 获取角色失败 %v", err)
				return
			}
			
			user, err := h.userRepo.GetByID(userID)
			if err != nil {
				log.Printf("[Unlock] 异步生成报告失败: 获取用户失败 %v", err)
				return
			}

			log.Printf("[Unlock] 开始为角色 %d 补生成报告...", charID)
			report, err := h.reportService.GenerateMultiLangReport(ctx, user, char)
			if err != nil {
				log.Printf("[Unlock] 补生成报告失败: %v", err)
				return
			}

			// 保存 7 项报告内容
			char.DescriptionEn = report.DescriptionEn
			char.DescriptionZh = report.DescriptionZh
			char.DescriptionRu = report.DescriptionRu
			char.CareerEn = report.CareerEn
			char.CareerZh = report.CareerZh
			char.CareerRu = report.CareerRu
			char.PersonalityEn = report.PersonalityEn
			char.PersonalityZh = report.PersonalityZh
			char.PersonalityRu = report.PersonalityRu
			char.MeetingTimeEn = report.MeetingTimeEn
			char.MeetingTimeZh = report.MeetingTimeZh
			char.MeetingTimeRu = report.MeetingTimeRu
			char.DistanceEn = report.DistanceEn
			char.DistanceZh = report.DistanceZh
			char.DistanceRu = report.DistanceRu
			char.StrengthEn = report.StrengthEn
			char.StrengthZh = report.StrengthZh
			char.StrengthRu = report.StrengthRu
			char.WeaknessEn = report.WeaknessEn
			char.WeaknessZh = report.WeaknessZh
			char.WeaknessRu = report.WeaknessRu

			if err := h.characterRepo.Update(char); err != nil {
				log.Printf("[Unlock] 保存补生成的报告失败: %v", err)
			} else {
				log.Printf("[Unlock] 成功补生成报告")
			}
		}(character.ID, user.ID)
	}

	locale := middleware.GetLocaleFromContext(c)
	response.Success(c, gin.H{
		"message":       "解锁成功",
		"unlock_status": model.UnlockStatusFullUnlocked,
		"image_url":     character.ClearImageURL,
		"description":   character.GetDescription(string(locale)),
		"career":        character.GetCareer(string(locale)),
		"personality":   character.GetPersonality(string(locale)),
		"meeting_time":  character.GetMeetingTime(string(locale)),
		"distance":      character.GetDistance(string(locale)),
		"strength":      character.GetStrength(string(locale)),
		"weakness":      character.GetWeakness(string(locale)),
		"price_paid":    expectedPrice,
		"currency":      req.PaymentMethod,
	})
}

// GetUnlockPrice 获取解锁价格
func (h *UnlockHandler) GetUnlockPrice(c *gin.Context) {
	idStr := c.Param("id")
	characterID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.Error(c, 400, "Invalid character ID")
		return
	}

	character, err := h.characterRepo.GetByID(characterID)
	if err != nil {
		response.Error(c, 404, "Character not found")
		return
	}

	var priceStars, priceTON int
	var priceType string

	switch character.UnlockStatus {
	case model.UnlockStatusFullUnlocked:
		priceStars = 0
		priceTON = 0
		priceType = "free"
	case model.UnlockStatusHalfUnlocked:
		priceStars = HalfUnlockPriceStars
		priceTON = HalfUnlockPriceTON
		priceType = "discounted"
	default:
		priceStars = FullUnlockPriceStars
		priceTON = FullUnlockPriceTON
		priceType = "full"
	}

	response.Success(c, gin.H{
		"unlock_status": character.UnlockStatus,
		"price_type":    priceType,
		"price_stars":   priceStars,
		"price_ton":     priceTON,
		"price_display": fmt.Sprintf("%d Stars / %d TON", priceStars, priceTON),
	})
}

// RetryReport 手动触发重新生成报告
func (h *UnlockHandler) RetryReport(c *gin.Context) {
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

	// 只有完全解锁且报告为空时才允许重试
	if character.UnlockStatus != model.UnlockStatusFullUnlocked {
		response.Error(c, 400, "Character not unlocked yet")
		return
	}

	// 异步生成报告
	go func(charID uint64, userID uint64) {
		ctx := context.Background()
		
		char, err := h.characterRepo.GetByID(charID)
		if err != nil {
			log.Printf("[Retry] 获取角色失败: %v", err)
			return
		}
		
		u, err := h.userRepo.GetByID(userID)
		if err != nil {
			log.Printf("[Retry] 获取用户失败: %v", err)
			return
		}

		log.Printf("[Retry] 开始重试生成报告 %d...", charID)
		report, err := h.reportService.GenerateMultiLangReport(ctx, u, char)
		if err != nil {
			log.Printf("[Retry] 生成报告失败: %v", err)
			return
		}

		// 保存 7 项报告内容
		char.DescriptionEn = report.DescriptionEn
		char.DescriptionZh = report.DescriptionZh
		char.DescriptionRu = report.DescriptionRu
		char.CareerEn = report.CareerEn
		char.CareerZh = report.CareerZh
		char.CareerRu = report.CareerRu
		char.PersonalityEn = report.PersonalityEn
		char.PersonalityZh = report.PersonalityZh
		char.PersonalityRu = report.PersonalityRu
		char.MeetingTimeEn = report.MeetingTimeEn
		char.MeetingTimeZh = report.MeetingTimeZh
		char.MeetingTimeRu = report.MeetingTimeRu
		char.DistanceEn = report.DistanceEn
		char.DistanceZh = report.DistanceZh
		char.DistanceRu = report.DistanceRu
		char.StrengthEn = report.StrengthEn
		char.StrengthZh = report.StrengthZh
		char.StrengthRu = report.StrengthRu
		char.WeaknessEn = report.WeaknessEn
		char.WeaknessZh = report.WeaknessZh
		char.WeaknessRu = report.WeaknessRu

		if err := h.characterRepo.Update(char); err != nil {
			log.Printf("[Retry] 保存报告失败: %v", err)
		} else {
			log.Printf("[Retry] 报告生成成功")
		}
	}(character.ID, user.ID)

	response.Success(c, gin.H{"message": "Report generation started"})
}
