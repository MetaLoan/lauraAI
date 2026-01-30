package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/repository"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

// TelegramWebhookHandler 处理 Telegram Bot Webhook 请求
type TelegramWebhookHandler struct {
	characterRepo *repository.CharacterRepository
	userRepo      *repository.UserRepository
}

func NewTelegramWebhookHandler() *TelegramWebhookHandler {
	return &TelegramWebhookHandler{
		characterRepo: repository.NewCharacterRepository(),
		userRepo:      repository.NewUserRepository(),
	}
}

// TelegramUpdate represents a Telegram webhook update
type TelegramUpdate struct {
	UpdateID    int64            `json:"update_id"`
	InlineQuery *TelegramInlineQuery `json:"inline_query,omitempty"`
}

// TelegramInlineQuery represents an inline query
type TelegramInlineQuery struct {
	ID    string `json:"id"`
	From  TelegramFrom `json:"from"`
	Query string `json:"query"`
}

// TelegramFrom represents the user who sent the query
type TelegramFrom struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	Username  string `json:"username,omitempty"`
}

// InlineQueryResultPhoto represents a photo result for inline query
type InlineQueryResultPhoto struct {
	Type                string `json:"type"`
	ID                  string `json:"id"`
	PhotoURL            string `json:"photo_url"`
	ThumbnailURL        string `json:"thumbnail_url"`
	PhotoWidth          int    `json:"photo_width,omitempty"`
	PhotoHeight         int    `json:"photo_height,omitempty"`
	Title               string `json:"title,omitempty"`
	Description         string `json:"description,omitempty"`
	Caption             string `json:"caption,omitempty"`
	ReplyMarkup         *InlineKeyboardMarkup `json:"reply_markup,omitempty"`
}

// InlineKeyboardMarkup represents an inline keyboard
type InlineKeyboardMarkup struct {
	InlineKeyboard [][]InlineKeyboardButton `json:"inline_keyboard"`
}

// InlineKeyboardButton represents a button in an inline keyboard
type InlineKeyboardButton struct {
	Text string `json:"text"`
	URL  string `json:"url,omitempty"`
}

// HandleWebhook 处理 Telegram Webhook
func (h *TelegramWebhookHandler) HandleWebhook(c *gin.Context) {
	var update TelegramUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		log.Printf("Telegram Webhook: 解析请求失败: %v", err)
		response.Error(c, 400, "Invalid request")
		return
	}

	// 处理 Inline Query
	if update.InlineQuery != nil {
		h.handleInlineQuery(update.InlineQuery)
	}

	// 返回成功（Telegram 要求快速响应）
	c.JSON(200, gin.H{"ok": true})
}

// handleInlineQuery 处理 inline query
func (h *TelegramWebhookHandler) handleInlineQuery(query *TelegramInlineQuery) {
	log.Printf("Telegram InlineQuery: id=%s, from=%d, query=%s", query.ID, query.From.ID, query.Query)

	// 解析查询：share_{characterId}
	if !strings.HasPrefix(query.Query, "share_") {
		// 不是分享查询，返回空结果
		h.answerInlineQuery(query.ID, []interface{}{})
		return
	}

	characterIDStr := strings.TrimPrefix(query.Query, "share_")
	characterID, err := strconv.ParseUint(characterIDStr, 10, 64)
	if err != nil {
		log.Printf("Telegram InlineQuery: 无效的角色 ID: %s", characterIDStr)
		h.answerInlineQuery(query.ID, []interface{}{})
		return
	}

	// 获取角色信息
	character, err := h.characterRepo.GetByID(characterID)
	if err != nil {
		log.Printf("Telegram InlineQuery: 角色不存在: %d", characterID)
		h.answerInlineQuery(query.ID, []interface{}{})
		return
	}

	// 获取角色所有者
	owner, err := h.userRepo.GetByID(character.UserID)
	if err != nil {
		log.Printf("Telegram InlineQuery: 用户不存在: %d", character.UserID)
		h.answerInlineQuery(query.ID, []interface{}{})
		return
	}

	// 构建分享链接
	shareLink := fmt.Sprintf("https://t.me/laura_tst_bot/app?startapp=char_%d_%s", character.ID, character.ShareCode)

	// 构建结果
	result := InlineQueryResultPhoto{
		Type:         "photo",
		ID:           fmt.Sprintf("share_%d", character.ID),
		PhotoURL:     character.FullBlurImageURL,
		ThumbnailURL: character.FullBlurImageURL,
		PhotoWidth:   512,
		PhotoHeight:  682,
		Title:        fmt.Sprintf("Help %s unlock their %s!", owner.Name, character.Title),
		Description:  "Tap to help your friend!",
		Caption:      fmt.Sprintf("🔮 Help me see what my %s looks like! I need your help 🥺\n\n👆 Tap the button below to help me!", character.Title),
		ReplyMarkup: &InlineKeyboardMarkup{
			InlineKeyboard: [][]InlineKeyboardButton{
				{
					{
						Text: "👀 Help Unlock",
						URL:  shareLink,
					},
				},
			},
		},
	}

	h.answerInlineQuery(query.ID, []interface{}{result})
}

// answerInlineQuery 发送 inline query 响应
func (h *TelegramWebhookHandler) answerInlineQuery(queryID string, results []interface{}) {
	botToken := strings.TrimSpace(config.AppConfig.TelegramBotToken)
	botToken = strings.Trim(botToken, `"'`)

	url := fmt.Sprintf("https://api.telegram.org/bot%s/answerInlineQuery", botToken)

	payload := map[string]interface{}{
		"inline_query_id": queryID,
		"results":         results,
		"cache_time":      60, // 缓存 60 秒
		"is_personal":     true,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Telegram answerInlineQuery: 序列化失败: %v", err)
		return
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		log.Printf("Telegram answerInlineQuery: 请求失败: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Printf("Telegram answerInlineQuery: 响应状态: %d", resp.StatusCode)
	} else {
		log.Printf("Telegram answerInlineQuery: 成功响应 queryID=%s", queryID)
	}
}
