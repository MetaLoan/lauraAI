package main

import (
	"log"
	"os"
	"path/filepath"

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
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 确保上传目录存在
	if err := os.MkdirAll(config.AppConfig.UploadsDir, 0755); err != nil {
		log.Fatalf("Failed to create upload directory: %v", err)
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

	reportService, err := service.NewGeminiReportService()
	if err != nil {
		log.Printf("警告: Gemini Report 服务初始化失败: %v", err)
		reportService = nil
	}

	// 初始化 Gin
	r := gin.Default()

	// 静态文件服务
	r.Static("/uploads", config.AppConfig.UploadsDir)

	// CORS 中间件
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Telegram-Init-Data, Accept-Language")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 语言检测中间件
	r.Use(middleware.LocaleMiddleware())

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 调试端点：修复空share_code的记录
	r.POST("/debug/fix-share-codes", func(c *gin.Context) {
		if c.GetHeader("X-Debug-Key") != "lauraai-clear-2026" {
			c.JSON(403, gin.H{"error": "Forbidden"})
			return
		}
		// 为所有空share_code的记录生成新的share_code
		result := repository.DB.Exec("UPDATE characters SET share_code = CONCAT('SC', FLOOR(RANDOM() * 900000 + 100000)::TEXT, FLOOR(RANDOM() * 1000)::TEXT) WHERE share_code = '' OR share_code IS NULL")
		if result.Error != nil {
			c.JSON(500, gin.H{"error": result.Error.Error()})
			return
		}
		c.JSON(200, gin.H{"message": "Fixed", "rows_affected": result.RowsAffected})
	})

	// 调试端点：清空所有数据（用于测试）
	r.POST("/debug/clear-all-data", func(c *gin.Context) {
		if c.GetHeader("X-Debug-Key") != "lauraai-clear-2026" {
			c.JSON(403, gin.H{"error": "Forbidden"})
			return
		}

		// 按顺序删除数据（考虑外键约束）
		var errors []string
		var deletedFiles int

		// 1. 删除消息
		if result := repository.DB.Exec("DELETE FROM messages"); result.Error != nil {
			errors = append(errors, "messages: "+result.Error.Error())
		}

		// 2. 删除角色
		if result := repository.DB.Exec("DELETE FROM characters"); result.Error != nil {
			errors = append(errors, "characters: "+result.Error.Error())
		}

		// 3. 删除用户
		if result := repository.DB.Exec("DELETE FROM users"); result.Error != nil {
			errors = append(errors, "users: "+result.Error.Error())
		}

		// 4. 删除所有上传的文件
		uploadsDir := config.AppConfig.UploadsDir
		if uploadsDir != "" {
			err := filepath.Walk(uploadsDir, func(path string, info os.FileInfo, err error) error {
				if err != nil {
					return err
				}
				// 跳过目录本身
				if path == uploadsDir {
					return nil
				}
				// 只删除文件，不删除目录
				if !info.IsDir() {
					if err := os.Remove(path); err != nil {
						errors = append(errors, "file "+path+": "+err.Error())
						return nil // 继续处理其他文件
					}
					deletedFiles++
				}
				return nil
			})
			if err != nil {
				errors = append(errors, "walk uploads dir: "+err.Error())
			}
		}

		// 5. 重置序列（可选）
		repository.DB.Exec("ALTER SEQUENCE messages_id_seq RESTART WITH 1")
		repository.DB.Exec("ALTER SEQUENCE characters_id_seq RESTART WITH 1")
		repository.DB.Exec("ALTER SEQUENCE users_id_seq RESTART WITH 1")

		if len(errors) > 0 {
			c.JSON(500, gin.H{"error": "部分删除失败", "details": errors, "deleted_files": deletedFiles})
			return
		}

		c.JSON(200, gin.H{
			"message":       "所有数据已清空",
			"tables_cleared": []string{"messages", "characters", "users"},
			"deleted_files": deletedFiles,
		})
	})

	// 公开路由
	api := r.Group("/api")
	{
		authHandler := handler.NewAuthHandler()
		api.POST("/auth/telegram", authHandler.TelegramAuth)

		// 分享链接公开接口（无需认证）
		unlockHandler := handler.NewUnlockHandler(reportService)
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
		unlockHandler := handler.NewUnlockHandler(reportService)
		apiAuth.POST("/characters/:id/help-unlock", unlockHandler.HelpUnlock)
		apiAuth.POST("/characters/:id/unlock", unlockHandler.Unlock)
		apiAuth.GET("/characters/:id/unlock-price", unlockHandler.GetUnlockPrice)
		apiAuth.POST("/characters/:id/report/retry", unlockHandler.RetryReport)

		// 聊天相关
		if chatService != nil {
			chatHandler := handler.NewChatHandler(chatService)
			apiAuth.POST("/characters/:id/chat", chatHandler.SendMessage)
			apiAuth.GET("/characters/:id/messages", chatHandler.GetMessages)
		}

		// 图片生成相关
		if imagenService != nil && reportService != nil {
			imageHandler := handler.NewImageHandler(imagenService, reportService)
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
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
