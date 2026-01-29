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
	if config.AppConfig.TelegramBotToken == "" {
		return nil, fmt.Errorf("TELEGRAM_BOT_TOKEN 未配置")
	}

	// 解析 initData
	params, err := url.ParseQuery(initData)
	if err != nil {
		return nil, fmt.Errorf("无效的 initData: %v", err)
	}

	// 提取 hash
	hash := params.Get("hash")
	if hash == "" {
		return nil, fmt.Errorf("缺少 hash 参数")
	}

	// 移除不需要参与签名验证的参数
	params.Del("hash")
	params.Del("signature")

	// 按字母顺序排序参数
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// 构建 data-check-string
	var dataCheckString strings.Builder
	for i, k := range keys {
		if i > 0 {
			dataCheckString.WriteString("\n")
		}
		dataCheckString.WriteString(k)
		dataCheckString.WriteString("=")
		dataCheckString.WriteString(params.Get(k))
	}

	// 计算 secret_key
	secretKey := hmacSHA256([]byte("WebAppData"), []byte(config.AppConfig.TelegramBotToken))

	// 计算 HMAC-SHA256
	calculatedHash := hex.EncodeToString(
		hmacSHA256([]byte(dataCheckString.String()), secretKey),
	)

	// 验证 hash
	if calculatedHash != hash {
		fmt.Printf("DEBUG: 签名验证失败\n")
		fmt.Printf("DEBUG: dataCheckString: %s\n", dataCheckString.String())
		fmt.Printf("DEBUG: calculatedHash: %s\n", calculatedHash)
		fmt.Printf("DEBUG: receivedHash: %s\n", hash)
		return nil, fmt.Errorf("签名验证失败")
	}

	// 解析用户信息
	userStr := params.Get("user")
	if userStr == "" {
		return nil, fmt.Errorf("缺少 user 参数")
	}

	// URL 解码
	userStr, err = url.QueryUnescape(userStr)
	if err != nil {
		return nil, fmt.Errorf("解码 user 参数失败: %v", err)
	}

	// 解析 JSON
	var user TelegramUser
	if err := json.Unmarshal([]byte(userStr), &user); err != nil {
		return nil, fmt.Errorf("解析 user JSON 失败: %v", err)
	}

	if user.ID == 0 {
		return nil, fmt.Errorf("无效的用户 ID")
	}

	return &user, nil
}

func hmacSHA256(data, key []byte) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write(data)
	return mac.Sum(nil)
}
