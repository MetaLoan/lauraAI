package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port            string
	TelegramBotToken string
	GeminiAPIKey    string
	PostgresDSN     string
	DevMode         bool
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
		Port:            getEnv("PORT", "8080"),
		TelegramBotToken: getEnv("TELEGRAM_BOT_TOKEN", ""),
		GeminiAPIKey:    getEnv("GEMINI_API_KEY", ""),
		PostgresDSN:     dbDSN,
		DevMode:         getEnv("DEV_MODE", "false") == "true",
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
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
