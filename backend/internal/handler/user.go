package handler

import (
	"time"

	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/repository"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		userRepo: repository.NewUserRepository(),
	}
}

// GetMe 获取当前用户信息
func (h *UserHandler) GetMe(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	response.Success(c, user)
}

// UpdateMe 更新当前用户信息
func (h *UserHandler) UpdateMe(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	var req struct {
		Name       string `json:"name"`
		Gender     string `json:"gender"`
		BirthDate  string `json:"birth_date"` // YYYY-MM-DD
		BirthTime  string `json:"birth_time"` // HH:MM
		BirthPlace string `json:"birth_place"`
		Ethnicity  string `json:"ethnicity"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters: "+err.Error())
		return
	}

	// 更新字段
	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Gender != "" {
		user.Gender = req.Gender
	}
	if req.BirthPlace != "" {
		user.BirthPlace = req.BirthPlace
	}
	if req.Ethnicity != "" {
		user.Ethnicity = req.Ethnicity
	}

	// 解析日期
	if req.BirthDate != "" {
		birthDate, err := time.Parse("2006-01-02", req.BirthDate)
		if err == nil {
			user.BirthDate = &birthDate
		}
	}

	// 解析时间（确保格式为 HH:MM:SS）
	if req.BirthTime != "" {
		// 如果只有 HH:MM，添加 :00 秒
		timeStr := req.BirthTime
		if len(timeStr) == 5 && timeStr[2] == ':' {
			timeStr = timeStr + ":00"
		}
		user.BirthTime = &timeStr
	}

	// 如果包含 birth_time，使用 Raw SQL 单独更新（避免类型转换问题）
	hasBirthTime := req.BirthTime != ""
	if hasBirthTime {
		timeStr := req.BirthTime
		if len(timeStr) == 5 && timeStr[2] == ':' {
			timeStr = timeStr + ":00"
		}
		// 使用 Raw SQL 直接更新 birth_time
		if err := repository.DB.Exec("UPDATE users SET birth_time = $1::time WHERE id = $2", timeStr, user.ID).Error; err != nil {
			response.Error(c, 500, "Failed to update: "+err.Error())
			return
		}
		// 清除 user.BirthTime，避免在后续 GORM 更新中覆盖
		user.BirthTime = nil
	}

	// 更新其他字段（排除 birth_time）
	if err := repository.DB.Model(user).Omit("birth_time").Updates(user).Error; err != nil {
		response.Error(c, 500, "Failed to update: "+err.Error())
		return
	}

	// 重新获取用户数据以包含最新的 birth_time
	updatedUser, err := h.userRepo.GetByID(user.ID)
	if err != nil {
		response.Success(c, user)
		return
	}

	response.Success(c, updatedUser)
}

// DeleteMe 删除当前用户及其所有数据
func (h *UserHandler) DeleteMe(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	if err := h.userRepo.Delete(user.ID); err != nil {
		response.Error(c, 500, "Failed to delete account: "+err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Account deleted"})
}

// SyncPoints 同步用户积分
func (h *UserHandler) SyncPoints(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	var req struct {
		Amount int64 `json:"amount"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters")
		return
	}

	// 增量同步积分
	if err := repository.DB.Model(user).UpdateColumn("points", repository.DB.Raw("points + ?", req.Amount)).Error; err != nil {
		response.Error(c, 500, "Failed to sync points")
		return
	}

	// 更新上下文中的用户信息
	user.Points += req.Amount

	response.Success(c, gin.H{
		"points":      user.Points,
		"lra_balance": user.LRABalance,
	})
}

// HarvestPoints 结算积分为 LRA
func (h *UserHandler) HarvestPoints(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	if user.Points <= 0 {
		response.Error(c, 400, "No points to harvest")
		return
	}

	points := user.Points
	// 使用事务确保原子性
	err := repository.DB.Transaction(func(tx *gorm.DB) error {
		// 1. 清空积分为0
		if err := tx.Model(user).Update("points", 0).Error; err != nil {
			return err
		}
		// 2. 增加 LRA 余额 (1:1 比例)
		if err := tx.Model(user).Update("lra_balance", user.LRABalance+float64(points)).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		response.Error(c, 500, "Failed to harvest points: "+err.Error())
		return
	}

	// 更新内存对象
	user.LRABalance += float64(user.Points)
	user.Points = 0

	response.Success(c, gin.H{
		"harvested":   points,
		"points":      user.Points,
		"lra_balance": user.LRABalance,
	})
}
