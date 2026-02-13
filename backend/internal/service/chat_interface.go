package service

import (
	"context"

	"soulface-backend/internal/i18n"
	"soulface-backend/internal/model"
)

// ChatService 文字对话接口，可由 Gemini 或 DeepSeek 实现
type ChatService interface {
	Chat(ctx context.Context, character *model.Character, messages []model.Message, userMessage string, locale i18n.Locale) (string, error)
	ChatStream(ctx context.Context, character *model.Character, messages []model.Message, userMessage string, locale i18n.Locale) (<-chan string, error)
}
