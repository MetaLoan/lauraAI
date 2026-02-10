package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	TelegramBotToken string
	GeminiAPIKey     string
	DeepSeekAPIKey   string // 文字对话使用 DeepSeek，优先于 Gemini
	PostgresDSN      string
	DevMode          bool
	WebAppMode       bool   // 网页版 dApp：无 Telegram initData 时使用默认用户，不再要求 Telegram
	BaseURL          string
	UploadsDir       string
	AdminSecret      string // 用于 /api/admin/clear-all-data 的密钥（X-Admin-Key 头）
}

var AppConfig *Config

func LoadConfig() {
	// 尝试加载 .env 文件，如果不存在也不报错
	_ = godotenv.Load()

	// 优先使用 DATABASE_URL（fly.io 标准），其次使用 POSTGRES_DSN
	dbDSN := getEnv("DATABASE_URL", "")
	if dbDSN == "" {
		dbDSN = getEnv("POSTGRES_DSN", "host=localhost user=lauraai password=password dbname=lauraai port=5432 sslmode=disable")
	}

	AppConfig = &Config{
		Port:             getEnv("PORT", "8080"),
		TelegramBotToken: getEnv("TELEGRAM_BOT_TOKEN", ""),
		GeminiAPIKey:     getEnv("GEMINI_API_KEY", ""),
		DeepSeekAPIKey:   getEnv("DEEPSEEK_API_KEY", ""),
		PostgresDSN:      dbDSN,
		DevMode:          getEnv("DEV_MODE", "false") == "true",
		WebAppMode:       getEnv("WEB_APP_MODE", "true") == "true", // 默认 true：网页版可不带 Telegram initData
		BaseURL:          getEnv("BASE_URL", "https://lauraai-backend.fly.dev"),
		UploadsDir:       getEnv("UPLOADS_DIR", "./uploads"),
		AdminSecret:      getEnv("ADMIN_SECRET", ""),
	}

	if AppConfig.TelegramBotToken == "" {
		log.Println("警告: TELEGRAM_BOT_TOKEN 未设置")
	}
	if AppConfig.GeminiAPIKey == "" {
		log.Println("警告: GEMINI_API_KEY 未设置")
	}
	if AppConfig.DevMode {
		log.Println("开发模式已启用: 将跳过 Telegram 验证，使用默认测试账号")
	}
	if AppConfig.WebAppMode {
		log.Println("网页版模式已启用: 无 Telegram initData 时使用默认用户")
	}
	if AppConfig.DeepSeekAPIKey != "" {
		log.Println("DEEPSEEK_API_KEY 已配置，文字对话将优先使用 DeepSeek")
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
