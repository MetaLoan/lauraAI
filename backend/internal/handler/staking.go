package handler

import (
	"fmt"
	"time"

	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/repository"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type StakingHandler struct{}

func NewStakingHandler() *StakingHandler {
	return &StakingHandler{}
}

// Stake 质押 LRA 代币
func (h *StakingHandler) Stake(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	var req struct {
		Amount float64 `json:"amount" binding:"required,gt=0"`
		TxHash string  `json:"tx_hash"` // Optional: blockchain transaction hash for verification
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters: amount must be greater than 0")
		return
	}

	// Update staking balance
	newBalance := user.StakingBalance + req.Amount

	// Calculate new multiplier: base 1.0 + (staked / 5000)
	// E.g., 5000 staked = 1.0 + 1.0 = 2.0x
	newMultiplier := 1.0 + (newBalance / 5000.0)

	// Cap multiplier at 5.0x for safety
	if newMultiplier > 5.0 {
		newMultiplier = 5.0
	}

	now := time.Now()

	// Update user record
	updates := map[string]interface{}{
		"staking_balance":    newBalance,
		"staking_multiplier": newMultiplier,
		"staked_at":          now,
	}

	if err := repository.DB.Model(user).Updates(updates).Error; err != nil {
		response.Error(c, 500, "Failed to update staking balance: "+err.Error())
		return
	}

	// Calculate lock expiry (7 days from now)
	lockExpiry := now.Add(7 * 24 * time.Hour)

	response.Success(c, gin.H{
		"staking_balance":    newBalance,
		"staking_multiplier": newMultiplier,
		"staked_at":          now.Unix(),
		"lock_expiry":        lockExpiry.Unix(),
		"lock_expiry_date":   lockExpiry.Format(time.RFC3339),
		"message":            "Successfully staked LRA tokens",
	})
}

// Unstake 解除质押 LRA 代币
func (h *StakingHandler) Unstake(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	var req struct {
		Amount float64 `json:"amount" binding:"required,gt=0"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters: amount must be greater than 0")
		return
	}

	// Check if user has enough staked balance
	if user.StakingBalance < req.Amount {
		response.Error(c, 400, "Insufficient staked balance")
		return
	}

	// Check lock period (7 days)
	if user.StakedAt != nil {
		lockExpiry := user.StakedAt.Add(7 * 24 * time.Hour)
		if time.Now().Before(lockExpiry) {
			remainingSeconds := int64(lockExpiry.Sub(time.Now()).Seconds())
			response.Error(c, 400, "Tokens are still locked. Remaining seconds: "+fmt.Sprint(remainingSeconds))
			return
		}
	}

	// Calculate new balance and multiplier
	newBalance := user.StakingBalance - req.Amount
	newMultiplier := 1.0 + (newBalance / 5000.0)

	if newMultiplier > 5.0 {
		newMultiplier = 5.0
	}

	// Update user record
	updates := map[string]interface{}{
		"staking_balance":    newBalance,
		"staking_multiplier": newMultiplier,
	}

	// Clear staked_at if fully unstaked
	if newBalance == 0 {
		updates["staked_at"] = nil
	}

	if err := repository.DB.Model(user).Updates(updates).Error; err != nil {
		response.Error(c, 500, "Failed to update staking balance: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"staking_balance":    newBalance,
		"staking_multiplier": newMultiplier,
		"unstaked_amount":    req.Amount,
		"message":            "Successfully unstaked LRA tokens",
	})
}

// GetInfo 获取质押信息
func (h *StakingHandler) GetInfo(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	// Calculate lock status
	isLocked := false
	var lockExpiry int64
	var remainingSeconds int64

	if user.StakedAt != nil && user.StakingBalance > 0 {
		lockExpiryTime := user.StakedAt.Add(7 * 24 * time.Hour)
		lockExpiry = lockExpiryTime.Unix()

		if time.Now().Before(lockExpiryTime) {
			isLocked = true
			remainingSeconds = int64(lockExpiryTime.Sub(time.Now()).Seconds())
		}
	}

	// Calculate APY based on current multiplier
	// Base APY 12.5%, increased by multiplier
	baseAPY := 12.5
	effectiveAPY := baseAPY * user.StakingMultiplier

	response.Success(c, gin.H{
		"staking_balance":    user.StakingBalance,
		"staking_multiplier": user.StakingMultiplier,
		"is_locked":          isLocked,
		"lock_expiry":        lockExpiry,
		"remaining_seconds":  remainingSeconds,
		"base_apy":           baseAPY,
		"effective_apy":      effectiveAPY,
		"points":             user.Points,
		"lra_balance":        user.LRABalance,
	})
}
