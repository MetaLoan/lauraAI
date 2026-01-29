package middleware

import (
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
		// 开发模式：跳过 Telegram 验证，使用默认测试账号
		if config.AppConfig.DevMode {
			userRepo := repository.NewUserRepository()
			user, err := userRepo.GetByTelegramID(DefaultTestTelegramID)
			if err != nil {
				// 测试账号不存在，创建默认测试用户
				user = &model.User{
					TelegramID: DefaultTestTelegramID,
					Name:       "Test User",
				}
				if err := userRepo.Create(user); err != nil {
					response.Error(c, 500, "创建测试用户失败: "+err.Error())
					c.Abort()
					return
				}
			}

			// 将用户信息存储到上下文
			c.Set(UserContextKey, user)
			c.Next()
			return
		}

		// 生产模式：正常进行 Telegram 验证
		// 从 Header 或 Query 获取 initData
		initData := c.GetHeader("X-Telegram-Init-Data")
		if initData == "" {
			initData = c.Query("initData")
		}

		if initData == "" {
			response.Error(c, 401, "缺少 Telegram initData")
			c.Abort()
			return
		}

		// 验证 initData
		telegramUser, err := service.ValidateTelegramInitData(initData)
		if err != nil {
			response.Error(c, 401, "Telegram 认证失败: "+err.Error())
			c.Abort()
			return
		}

		// 获取或创建用户
		userRepo := repository.NewUserRepository()
		user, err := userRepo.GetByTelegramID(telegramUser.ID)
		if err != nil {
			// 用户不存在，创建新用户
			user = &model.User{
				TelegramID: telegramUser.ID,
				Name:       telegramUser.FirstName,
			}
			if err := userRepo.Create(user); err != nil {
				response.Error(c, 500, "创建用户失败: "+err.Error())
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
