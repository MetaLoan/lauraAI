package main

import (
	"log"
	"os"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/handler"
	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/repository"
	"lauraai-backend/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	config.LoadConfig()

	// 初始化数据库
	if err := repository.InitDB(); err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}

	// 确保上传目录存在
	if err := os.MkdirAll("./uploads", 0755); err != nil {
		log.Fatalf("创建上传目录失败: %v", err)
	}

	// 初始化 Gemini 服务
	chatService, err := service.NewGeminiChatService()
	if err != nil {
		log.Printf("警告: Gemini Chat 服务初始化失败: %v", err)
		chatService = nil
	}

	imagenService, err := service.NewGeminiImagenService()
	if err != nil {
		log.Printf("警告: Gemini Imagen 服务初始化失败: %v", err)
		imagenService = nil
	}

	visionService, err := service.NewGeminiVisionService()
	if err != nil {
		log.Printf("警告: Gemini Vision 服务初始化失败: %v", err)
		visionService = nil
	}

	// 初始化 Gin
	r := gin.Default()

	// 静态文件服务
	r.Static("/uploads", "./uploads")

	// CORS 中间件
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Telegram-Init-Data")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 公开路由
	api := r.Group("/api")
	{
		authHandler := handler.NewAuthHandler()
		api.POST("/auth/telegram", authHandler.TelegramAuth)

		// 分享链接公开接口（无需认证）
		unlockHandler := handler.NewUnlockHandler()
		api.GET("/share/:code", unlockHandler.GetShareInfo)
	}

	// Telegram Bot Webhook（公开，由 Telegram 服务器调用）
	telegramWebhookHandler := handler.NewTelegramWebhookHandler()
	r.POST("/webhook/telegram", telegramWebhookHandler.HandleWebhook)

	// 需要认证的路由
	apiAuth := r.Group("/api")
	apiAuth.Use(middleware.TelegramAuthMiddleware())
	{
		// 用户相关
		userHandler := handler.NewUserHandler()
		apiAuth.GET("/users/me", userHandler.GetMe)
		apiAuth.PUT("/users/me", userHandler.UpdateMe)
		apiAuth.DELETE("/users/me", userHandler.DeleteMe)

		// 角色相关
		characterHandler := handler.NewCharacterHandler()
		apiAuth.POST("/characters", characterHandler.Create)
		apiAuth.GET("/characters", characterHandler.List)
		apiAuth.GET("/characters/:id", characterHandler.GetByID)
		apiAuth.DELETE("/characters/cleanup", characterHandler.CleanupEmpty)

		// 邀请相关
		inviteHandler := handler.NewInviteHandler()
		apiAuth.GET("/invite/code", inviteHandler.GetInviteCode)
		apiAuth.GET("/invite/referrals", inviteHandler.GetReferrals)
		apiAuth.POST("/invite/bind", inviteHandler.BindInviter)

		// 解锁相关
		unlockHandler := handler.NewUnlockHandler()
		apiAuth.POST("/characters/:id/help-unlock", unlockHandler.HelpUnlock)
		apiAuth.POST("/characters/:id/unlock", unlockHandler.Unlock)
		apiAuth.GET("/characters/:id/unlock-price", unlockHandler.GetUnlockPrice)

		// 聊天相关
		if chatService != nil {
			chatHandler := handler.NewChatHandler(chatService)
			apiAuth.POST("/characters/:id/chat", chatHandler.SendMessage)
			apiAuth.GET("/characters/:id/messages", chatHandler.GetMessages)
		}

		// 图片生成相关
		if imagenService != nil {
			imageHandler := handler.NewImageHandler(imagenService)
			apiAuth.POST("/characters/:id/generate-image", imageHandler.GenerateImage)
		}

		// Mini Me 相关
		if visionService != nil && imagenService != nil {
			miniMeHandler := handler.NewMiniMeHandler(visionService, imagenService)
			apiAuth.POST("/minime/generate", miniMeHandler.UploadAndGenerateMiniMe)
		}
	}

	// 启动服务器
	port := config.AppConfig.Port
	log.Printf("服务器启动在端口 %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
