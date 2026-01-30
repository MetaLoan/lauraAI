package middleware

import (
	"encoding/json"
	"log"
	"time"

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
	// #region agent log
	debugLog := func(hypo, msg string, data map[string]interface{}) {
		logData := map[string]interface{}{"hypothesisId": hypo, "location": "telegram_auth.go", "message": msg, "data": data, "timestamp": time.Now().UnixMilli()}
		jsonBytes, _ := json.Marshal(logData)
		log.Printf("[DEBUG] %s", string(jsonBytes))
	}
	// #endregion

	return func(c *gin.Context) {
		// #region agent log
		debugLog("A", "TelegramAuth开始", map[string]interface{}{"path": c.Request.URL.Path, "method": c.Request.Method})
		// #endregion

		// 开发模式：跳过 Telegram 验证，使用默认测试账号
		if config.AppConfig.DevMode {
			userRepo := repository.NewUserRepository()
			user, err := userRepo.GetByTelegramID(DefaultTestTelegramID)
			if err != nil {
				// 测试账号不存在，尝试创建默认测试用户
				user = &model.User{
					TelegramID: DefaultTestTelegramID,
					Name:       "Test User",
				}
				// 使用 CreateOrUpdate 避免并发冲突
				if err := userRepo.CreateOrUpdate(user); err != nil {
					// 即使 CreateOrUpdate 报错（比如唯一键冲突），也尝试最后查一次
					log.Printf("CreateOrUpdate 失败: %v，尝试重新获取", err)
				}

				// 无论上面是否报错，都重新查一次以确保获取到正确的 User 对象（包含 ID）
				user, err = userRepo.GetByTelegramID(DefaultTestTelegramID)
				if err != nil {
					response.Error(c, 500, "获取/创建测试用户失败: "+err.Error())
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
		log.Printf("TelegramAuth: 请求路径=%s, 方法=%s", c.Request.URL.Path, c.Request.Method)
		initData := c.GetHeader("X-Telegram-Init-Data")
		if initData == "" {
			initData = c.Query("initData")
		}

		// #region agent log
		debugLog("A,E", "检查initData", map[string]interface{}{"hasInitData": initData != "", "initDataLen": len(initData)})
		// #endregion

		if initData == "" {
			log.Printf("TelegramAuth: 缺少 initData")
			// #region agent log
			debugLog("E", "缺少initData-返回401", map[string]interface{}{})
			// #endregion
			response.Error(c, 401, "缺少 Telegram initData")
			c.Abort()
			return
		}
		log.Printf("TelegramAuth: 收到 initData 长度=%d", len(initData))

		// 验证 initData
		telegramUser, err := service.ValidateTelegramInitData(initData)
		// #region agent log
		debugLog("A", "验证initData结果", map[string]interface{}{"success": err == nil, "error": func() string { if err != nil { return err.Error() }; return "" }(), "telegramUserID": func() int64 { if telegramUser != nil { return telegramUser.ID }; return 0 }()})
		// #endregion
		if err != nil {
			// #region agent log
			debugLog("A", "initData验证失败-返回401", map[string]interface{}{"error": err.Error()})
			// #endregion
			response.Error(c, 401, "Telegram 认证失败: "+err.Error())
			c.Abort()
			return
		}

		// 获取或创建用户
		userRepo := repository.NewUserRepository()
		user, err := userRepo.GetByTelegramID(telegramUser.ID)
		// #region agent log
		debugLog("B", "查询用户", map[string]interface{}{"telegramID": telegramUser.ID, "found": err == nil, "userID": func() uint64 { if user != nil { return user.ID }; return 0 }()})
		// #endregion
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

			// #region agent log
			debugLog("B", "用户不存在-创建新用户", map[string]interface{}{"telegramID": telegramUser.ID, "name": telegramUser.FirstName, "inviteCode": inviteCode, "inviterID": inviterID})
			// #endregion
			user = &model.User{
				TelegramID: telegramUser.ID,
				Name:       telegramUser.FirstName,
				InviteCode: inviteCode,
				InviterID:  inviterID,
			}
			if err := userRepo.Create(user); err != nil {
				// #region agent log
				debugLog("B", "创建用户失败", map[string]interface{}{"error": err.Error()})
				// #endregion
				response.Error(c, 500, "创建用户失败: "+err.Error())
				c.Abort()
				return
			}
			// #region agent log
			debugLog("B", "创建用户成功", map[string]interface{}{"userID": user.ID})
			// #endregion
		}

		// 将用户信息存储到上下文
		c.Set(UserContextKey, user)
		c.Set("telegram_user", telegramUser)
		// #region agent log
		debugLog("A,B", "认证成功-用户已设置到上下文", map[string]interface{}{"userID": user.ID, "telegramID": user.TelegramID})
		// #endregion
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
