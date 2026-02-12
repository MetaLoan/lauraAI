package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	GeminiAPIKey   string
	DeepSeekAPIKey string // Text chat uses DeepSeek, fallback to Gemini
	PostgresDSN    string
	DevMode        bool
	WebAppMode     bool   // dApp mode: use default test wallet when no wallet headers provided
	BaseURL        string
	UploadsDir     string
	AdminSecret    string // Secret for /api/admin/clear-all-data (X-Admin-Key header)
	TGELive        bool   // true when LRA token is live with liquidity; before that pool/TVL/APY endpoints return empty
	ChainRPCURL    string // EVM RPC endpoint used by backend market/deFi helpers
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
		Port:           getEnv("PORT", "8080"),
		GeminiAPIKey:   getEnv("GEMINI_API_KEY", ""),
		DeepSeekAPIKey: getEnv("DEEPSEEK_API_KEY", ""),
		PostgresDSN:    dbDSN,
		DevMode:        getEnv("DEV_MODE", "false") == "true",
		WebAppMode:     getEnv("WEB_APP_MODE", "true") == "true", // Default true: dApp mode uses test wallet when no wallet headers
		BaseURL:        getEnv("BASE_URL", "https://lauraai-backend.fly.dev"),
		UploadsDir:     getEnv("UPLOADS_DIR", "./uploads"),
		AdminSecret:    getEnv("ADMIN_SECRET", ""),
		TGELive:        getEnv("TGE_LIVE", "false") == "true",
		ChainRPCURL:    getEnv("CHAIN_RPC_URL", "https://eth.llamarpc.com"),
	}

	if AppConfig.GeminiAPIKey == "" {
		log.Println("Warning: GEMINI_API_KEY not set")
	}
	if AppConfig.DevMode {
		log.Println("Dev mode enabled: wallet auth bypassed, using default test wallet")
	}
	if AppConfig.WebAppMode {
		log.Println("WebApp mode enabled: requests without wallet headers will use default test wallet")
	}
	if AppConfig.DeepSeekAPIKey != "" {
		log.Println("DEEPSEEK_API_KEY configured, text chat will prefer DeepSeek")
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
