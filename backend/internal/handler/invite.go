package handler

import (
	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/repository"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type InviteHandler struct {
	userRepo *repository.UserRepository
}

func NewInviteHandler() *InviteHandler {
	return &InviteHandler{
		userRepo: repository.NewUserRepository(),
	}
}

// GetInviteCode 获取用户的邀请码
func (h *InviteHandler) GetInviteCode(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	// 确保用户有邀请码
	if err := h.userRepo.EnsureInviteCode(user); err != nil {
		response.Error(c, 500, "Failed to generate invite code: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"invite_code": user.InviteCode,
	})
}

// GetReferrals 获取用户的下级好友列表
func (h *InviteHandler) GetReferrals(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	referrals, err := h.userRepo.GetReferrals(user.ID)
	if err != nil {
		response.Error(c, 500, "Failed to query referrals: "+err.Error())
		return
	}

	// 构建返回数据，只包含必要信息
	var referralList []gin.H
	for _, ref := range referrals {
		referralList = append(referralList, gin.H{
			"id":         ref.ID,
			"name":       ref.Name,
			"avatar_url": ref.AvatarURL,
			"created_at": ref.CreatedAt,
		})
	}

	if referralList == nil {
		referralList = []gin.H{}
	}

	response.Success(c, gin.H{
		"referrals": referralList,
		"count":     len(referralList),
	})
}

// BindInviter 绑定邀请人（新用户注册时调用）
func (h *InviteHandler) BindInviter(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	var req struct {
		InviteCode string `json:"invite_code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters")
		return
	}

	// 不能邀请自己
	if user.InviteCode == req.InviteCode {
		response.Error(c, 400, "Cannot use your own invite code")
		return
	}

	// 已有邀请人的用户不能再绑定
	if user.InviterID != nil {
		response.Error(c, 400, "Inviter already bound")
		return
	}

	// 查找邀请人
	inviter, err := h.userRepo.GetByInviteCode(req.InviteCode)
	if err != nil {
		response.Error(c, 404, "Invalid invite code")
		return
	}

	// 绑定邀请关系
	if err := h.userRepo.SetInviter(user.ID, inviter.ID); err != nil {
		response.Error(c, 500, "Failed to bind inviter: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"message":      "Binding successful",
		"inviter_name": inviter.Name,
	})
}
