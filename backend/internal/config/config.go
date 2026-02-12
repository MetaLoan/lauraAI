package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                     string
	GeminiAPIKey             string
	DeepSeekAPIKey           string // Text chat uses DeepSeek, fallback to Gemini
	PostgresDSN              string
	DevMode                  bool
	WebAppMode               bool // dApp mode: use default test wallet when no wallet headers provided
	BaseURL                  string
	UploadsDir               string
	AdminSecret              string // Secret for /api/admin/clear-all-data (X-Admin-Key header)
	TGELive                  bool   // true when LRA token is live with liquidity; before that pool/TVL/APY endpoints return empty
	ChainRPCURL              string // EVM RPC endpoint used by backend market/deFi helpers
	AuthTokenSecret          string // HMAC secret for auth bearer token
	AuthTokenTTLMinutes      int    // Bearer token TTL in minutes
	AllowLegacySignatureAuth bool   // temporary rollback switch for legacy X-Wallet-* auth
	MintContractAddress      string // NFT contract address used for mint verification
	MintExpectedChainID      int64  // expected chain id for mint tx verification (0 disables strict check)
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
		Port:                     getEnv("PORT", "8080"),
		GeminiAPIKey:             getEnv("GEMINI_API_KEY", ""),
		DeepSeekAPIKey:           getEnv("DEEPSEEK_API_KEY", ""),
		PostgresDSN:              dbDSN,
		DevMode:                  getEnv("DEV_MODE", "false") == "true",
		WebAppMode:               getEnv("WEB_APP_MODE", "false") == "true", // Default false for production safety
		BaseURL:                  getEnv("BASE_URL", "https://lauraai-backend.fly.dev"),
		UploadsDir:               getEnv("UPLOADS_DIR", "./uploads"),
		AdminSecret:              getEnv("ADMIN_SECRET", ""),
		TGELive:                  getEnv("TGE_LIVE", "false") == "true",
		ChainRPCURL:              getEnv("CHAIN_RPC_URL", "https://eth.llamarpc.com"),
		AuthTokenSecret:          getEnv("AUTH_TOKEN_SECRET", ""),
		AuthTokenTTLMinutes:      getEnvInt("AUTH_TOKEN_TTL_MINUTES", 120),
		AllowLegacySignatureAuth: getEnv("ALLOW_LEGACY_SIGNATURE_AUTH", "false") == "true",
		MintContractAddress:      getEnv("MINT_CONTRACT_ADDRESS", ""),
		MintExpectedChainID:      getEnvInt64("MINT_EXPECTED_CHAIN_ID", 1),
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
	if AppConfig.AllowLegacySignatureAuth {
		log.Println("Legacy X-Wallet-* signature auth fallback is ENABLED")
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

func getEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return parsed
}

func getEnvInt64(key string, defaultValue int64) int64 {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return defaultValue
	}
	return parsed
}
