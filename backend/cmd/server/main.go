package main

import (
	"log"

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

	// 初始化 Gin
	r := gin.Default()

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
	}

	// 需要认证的路由
	apiAuth := r.Group("/api")
	apiAuth.Use(middleware.TelegramAuthMiddleware())
	{
		// 用户相关
		userHandler := handler.NewUserHandler()
		apiAuth.GET("/users/me", userHandler.GetMe)
		apiAuth.PUT("/users/me", userHandler.UpdateMe)

		// 角色相关
		characterHandler := handler.NewCharacterHandler()
		apiAuth.POST("/characters", characterHandler.Create)
		apiAuth.GET("/characters", characterHandler.List)
		apiAuth.GET("/characters/:id", characterHandler.GetByID)

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
	}

	// 启动服务器
	port := config.AppConfig.Port
	log.Printf("服务器启动在端口 %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
