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
		response.Error(c, 401, "未认证")
		return
	}

	// 确保用户有邀请码
	if err := h.userRepo.EnsureInviteCode(user); err != nil {
		response.Error(c, 500, "生成邀请码失败: "+err.Error())
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
		response.Error(c, 401, "未认证")
		return
	}

	referrals, err := h.userRepo.GetReferrals(user.ID)
	if err != nil {
		response.Error(c, 500, "查询下级好友失败: "+err.Error())
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
		response.Error(c, 401, "未认证")
		return
	}

	var req struct {
		InviteCode string `json:"invite_code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "无效的请求参数")
		return
	}

	// 不能邀请自己
	if user.InviteCode == req.InviteCode {
		response.Error(c, 400, "不能使用自己的邀请码")
		return
	}

	// 已有邀请人的用户不能再绑定
	if user.InviterID != nil {
		response.Error(c, 400, "已绑定邀请人")
		return
	}

	// 查找邀请人
	inviter, err := h.userRepo.GetByInviteCode(req.InviteCode)
	if err != nil {
		response.Error(c, 404, "邀请码无效")
		return
	}

	// 绑定邀请关系
	if err := h.userRepo.SetInviter(user.ID, inviter.ID); err != nil {
		response.Error(c, 500, "绑定邀请人失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"message":      "绑定成功",
		"inviter_name": inviter.Name,
	})
}
