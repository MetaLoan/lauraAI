package middleware

import (
	"log"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
	"lauraai-backend/internal/service"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

const UserContextKey = "user"

// 默认测试账号的 Telegram ID
const DefaultTestTelegramID int64 = 999999999

func TelegramAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		initData := c.GetHeader("X-Telegram-Init-Data")
		if initData == "" {
			initData = c.Query("initData")
		}

		// 开发模式 或 网页版模式且未提供 initData：使用默认测试账号，不要求 Telegram
		useDefaultUser := config.AppConfig.DevMode || (config.AppConfig.WebAppMode && initData == "")
		if useDefaultUser {
			userRepo := repository.NewUserRepository()
			user, err := userRepo.GetByTelegramID(DefaultTestTelegramID)
			if err != nil {
				user = &model.User{
					TelegramID: DefaultTestTelegramID,
					Name:       "Test User",
				}
				if err := userRepo.CreateOrUpdate(user); err != nil {
					log.Printf("CreateOrUpdate 失败: %v，尝试重新获取", err)
				}
				user, err = userRepo.GetByTelegramID(DefaultTestTelegramID)
				if err != nil {
					response.Error(c, 500, "Failed to get/create test user: "+err.Error())
					c.Abort()
					return
				}
			}
			c.Set(UserContextKey, user)
			c.Next()
			return
		}

		if initData == "" {
			log.Printf("TelegramAuth: 缺少 initData")
			response.Error(c, 401, "Missing Telegram initData")
			c.Abort()
			return
		}

		// 正常进行 Telegram 验证
		log.Printf("TelegramAuth: 收到 initData 长度=%d", len(initData))

		// 验证 initData
		telegramUser, err := service.ValidateTelegramInitData(initData)
		if err != nil {
			response.Error(c, 401, "Telegram authentication failed: "+err.Error())
			c.Abort()
			return
		}

		// 获取或创建用户
		userRepo := repository.NewUserRepository()
		user, err := userRepo.GetByTelegramID(telegramUser.ID)
		if err != nil {
			// 用户不存在，创建新用户
			inviteCode := repository.GenerateInviteCode()

			// 尝试从 Header 获取邀请码并自动绑定
			inviterCode := c.GetHeader("X-Inviter-Code")
			var inviterID *uint64
			if inviterCode != "" {
				inviter, err := userRepo.GetByInviteCode(inviterCode)
				if err == nil && inviter != nil {
					inviterID = &inviter.ID
					log.Printf("TelegramAuth: 发现邀请码 %s, 绑定邀请人 ID=%d", inviterCode, inviter.ID)
				}
			}

			user = &model.User{
				TelegramID: telegramUser.ID,
				Name:       telegramUser.FirstName,
				InviteCode: inviteCode,
				InviterID:  inviterID,
			}
			if err := userRepo.Create(user); err != nil {
				response.Error(c, 500, "Failed to create user: "+err.Error())
				c.Abort()
				return
			}
		}

		// 将用户信息存储到上下文
		c.Set(UserContextKey, user)
		c.Set("telegram_user", telegramUser)
		c.Next()
	}
}

// GetUserFromContext 从上下文获取用户
func GetUserFromContext(c *gin.Context) (*model.User, bool) {
	user, exists := c.Get(UserContextKey)
	if !exists {
		return nil, false
	}
	u, ok := user.(*model.User)
	return u, ok
}
