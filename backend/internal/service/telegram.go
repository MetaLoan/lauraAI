package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/url"
	"sort"
	"strings"

	"lauraai-backend/internal/config"
)

type TelegramUser struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name,omitempty"`
	Username  string `json:"username,omitempty"`
	PhotoURL  string `json:"photo_url,omitempty"`
}

// ValidateTelegramInitData 验证 Telegram initData 签名
func ValidateTelegramInitData(initData string) (*TelegramUser, error) {
	if strings.TrimSpace(config.AppConfig.TelegramBotToken) == "" {
		return nil, fmt.Errorf("TELEGRAM_BOT_TOKEN not configured")
	}

	// 使用 url.ParseQuery 解析参数（会自动处理 URL 编码，得到解码后的值）
	// 经过测试验证，必须使用解码后的值来构建 dataCheckString
	params, err := url.ParseQuery(initData)
	if err != nil {
		return nil, fmt.Errorf("Failed to parse initData: %v", err)
	}

	// 提取并移除 hash
	hash := params.Get("hash")
	if hash == "" {
		return nil, fmt.Errorf("Missing hash parameter")
	}
	params.Del("hash")
	// 注意：不要移除 signature，经过测试它必须参与签名计算

	// 按字母顺序排序参数键
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// 构建 data-check-string
	var pairs []string
	for _, k := range keys {
		pairs = append(pairs, k+"="+params.Get(k))
	}
	dataCheckString := strings.Join(pairs, "\n")

	// 计算 secret_key = HMAC_SHA256(bot_token, key="WebAppData")
	botToken := strings.TrimSpace(config.AppConfig.TelegramBotToken)
	botToken = strings.Trim(botToken, `"'`)
	secretKey := hmacSHA256([]byte(botToken), []byte("WebAppData"))

	// 计算 hash = HMAC_SHA256(data_check_string, secret_key)
	calculatedHash := hex.EncodeToString(
		hmacSHA256([]byte(dataCheckString), secretKey),
	)

	if calculatedHash != hash {
		return nil, fmt.Errorf("Signature verification failed")
	}

	// 解析用户信息
	userStr := params.Get("user")
	if userStr == "" {
		return nil, fmt.Errorf("Missing user parameter")
	}

	var user TelegramUser
	if err := json.Unmarshal([]byte(userStr), &user); err != nil {
		return nil, fmt.Errorf("Failed to parse user JSON: %v", err)
	}

	if user.ID == 0 {
		return nil, fmt.Errorf("Invalid user ID")
	}

	return &user, nil
}

func hmacSHA256(data, key []byte) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write(data)
	return mac.Sum(nil)
}
