package handler

import (
	"lauraai-backend/internal/service"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

// TelegramAuth 处理 Telegram 认证
func (h *AuthHandler) TelegramAuth(c *gin.Context) {
	initData := c.PostForm("initData")
	if initData == "" {
		initData = c.GetHeader("X-Telegram-Init-Data")
	}

	if initData == "" {
		response.Error(c, 400, "缺少 initData 参数")
		return
	}

	telegramUser, err := service.ValidateTelegramInitData(initData)
	if err != nil {
		response.Error(c, 401, "认证失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"telegram_user": telegramUser,
	})
}
