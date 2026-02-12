package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"lauraai-backend/internal/config"
)

type AuthTokenClaims struct {
	UserID        uint64 `json:"uid"`
	WalletAddress string `json:"wa"`
	Exp           int64  `json:"exp"`
	Iat           int64  `json:"iat"`
}

func GenerateAuthToken(userID uint64, walletAddress string) (string, int64, error) {
	secret := config.AppConfig.AuthTokenSecret
	if secret == "" {
		if !config.AppConfig.DevMode {
			return "", 0, errors.New("AUTH_TOKEN_SECRET is required in non-dev mode")
		}
		secret = "dev-only-insecure-secret"
	}

	now := time.Now().Unix()
	exp := time.Now().Add(time.Duration(config.AppConfig.AuthTokenTTLMinutes) * time.Minute).Unix()
	claims := AuthTokenClaims{
		UserID:        userID,
		WalletAddress: walletAddress,
		Exp:           exp,
		Iat:           now,
	}

	payloadBytes, err := json.Marshal(claims)
	if err != nil {
		return "", 0, err
	}
	payload := base64.RawURLEncoding.EncodeToString(payloadBytes)
	signature := signPayload(payload, secret)
	token := payload + "." + signature
	return token, exp, nil
}

func ParseAndVerifyAuthToken(token string) (*AuthTokenClaims, error) {
	secret := config.AppConfig.AuthTokenSecret
	if secret == "" {
		if !config.AppConfig.DevMode {
			return nil, errors.New("server auth secret is not configured")
		}
		secret = "dev-only-insecure-secret"
	}

	dotIndex := -1
	for i := 0; i < len(token); i++ {
		if token[i] == '.' {
			dotIndex = i
			break
		}
	}
	if dotIndex <= 0 || dotIndex >= len(token)-1 {
		return nil, errors.New("invalid token format")
	}

	payload := token[:dotIndex]
	signature := token[dotIndex+1:]
	expected := signPayload(payload, secret)
	if subtle.ConstantTimeCompare([]byte(signature), []byte(expected)) != 1 {
		return nil, errors.New("invalid token signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		return nil, fmt.Errorf("invalid token payload: %w", err)
	}

	var claims AuthTokenClaims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, fmt.Errorf("invalid token claims: %w", err)
	}

	if claims.UserID == 0 || claims.WalletAddress == "" {
		return nil, errors.New("invalid token subject")
	}
	if claims.Exp <= time.Now().Unix() {
		return nil, errors.New("token expired")
	}
	return &claims, nil
}

func signPayload(payload string, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
