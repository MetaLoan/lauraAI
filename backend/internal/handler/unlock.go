package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
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
}

func NewUnlockHandler() *UnlockHandler {
	return &UnlockHandler{
		characterRepo: repository.NewCharacterRepository(),
		userRepo:      repository.NewUserRepository(),
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

	// 返回公开信息（不返回清晰图片）
	response.Success(c, gin.H{
		"character": gin.H{
			"id":                  character.ID,
			"title":               character.Title,
			"type":                character.Type,
			"full_blur_image_url": character.FullBlurImageURL,
			"half_blur_image_url": character.HalfBlurImageURL,
			"unlock_status":       character.UnlockStatus,
			"share_code":          character.ShareCode,
		},
		"owner": gin.H{
			"id":   owner.ID,
			"name": owner.Name,
		},
	})
}

// HelpUnlock 好友帮助解锁（将解锁状态从0改为1）
// 条件：帮助者必须是角色所有者邀请的用户，且只能帮助邀请者解锁一次
func (h *UnlockHandler) HelpUnlock(c *gin.Context) {
	// #region agent log
	debugLog := func(hypo, msg string, data map[string]interface{}) {
		logData := map[string]interface{}{"hypothesisId": hypo, "location": "unlock.go:HelpUnlock", "message": msg, "data": data, "timestamp": time.Now().UnixMilli()}
		jsonBytes, _ := json.Marshal(logData)
		log.Printf("[DEBUG] %s", string(jsonBytes))
	}
	// #endregion

	helper, exists := middleware.GetUserFromContext(c)
	// #region agent log
	debugLog("A", "检查用户上下文", map[string]interface{}{"exists": exists, "helperID": fmt.Sprintf("%v", helper)})
	// #endregion
	if !exists {
		// #region agent log
		debugLog("A", "用户未认证-返回401", map[string]interface{}{})
		// #endregion
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
	// #region agent log
	debugLog("C,D", "获取角色信息", map[string]interface{}{"characterID": characterID, "found": err == nil, "unlockStatus": func() int { if character != nil { return int(character.UnlockStatus) }; return -1 }()})
	// #endregion
	if err != nil {
		// #region agent log
		debugLog("D", "角色不存在", map[string]interface{}{"characterID": characterID, "error": err.Error()})
		// #endregion
		response.Error(c, 404, "Character not found")
		return
	}

	// 不能帮自己解锁
	// #region agent log
	debugLog("E", "检查是否自己帮自己", map[string]interface{}{"helperID": helper.ID, "characterUserID": character.UserID, "isSelf": character.UserID == helper.ID})
	// #endregion
	if character.UserID == helper.ID {
		// #region agent log
		debugLog("E", "不能帮自己解锁", map[string]interface{}{})
		// #endregion
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

	// #region agent log
	debugLog("F", "检查邀请关系", map[string]interface{}{"helperInviterID": helper.InviterID, "characterUserID": character.UserID, "isInvitedByOwner": isInvitedByOwner})
	// #endregion
	if !isInvitedByOwner {
		response.ErrorWithCode(c, 403, "NOT_INVITED", "You are not invited by this user")
		return
	}

	// 检查帮助者是否曾经帮助过这个用户的任何角色
	hasHelped, err := h.characterRepo.HasUserHelpedOwner(helper.ID, character.UserID)
	// #region agent log
	debugLog("G", "检查是否已帮助过", map[string]interface{}{"helperID": helper.ID, "ownerID": character.UserID, "hasHelped": hasHelped})
	// #endregion
	if err != nil {
		response.Error(c, 500, "Failed to check help record: "+err.Error())
		return
	}
	if hasHelped {
		response.ErrorWithCode(c, 400, "ALREADY_HELPED", "You have already helped this user")
		return
	}

	// 只有未解锁状态才能帮忙解锁
	// #region agent log
	debugLog("C", "检查解锁状态", map[string]interface{}{"unlockStatus": character.UnlockStatus, "isLocked": character.UnlockStatus == model.UnlockStatusLocked})
	// #endregion
	if character.UnlockStatus != model.UnlockStatusLocked {
		// #region agent log
		debugLog("C", "角色已被解锁或已有人帮助", map[string]interface{}{"unlockStatus": character.UnlockStatus})
		// #endregion
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

	// TODO: 实际验证支付（这里简化处理，假设支付成功）
	// 在生产环境中，应该调用 Telegram Stars API 或 TON 区块链验证支付

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

	response.Success(c, gin.H{
		"message":       "解锁成功",
		"unlock_status": model.UnlockStatusFullUnlocked,
		"image_url":     character.ClearImageURL,
		"description":   character.Description,
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
