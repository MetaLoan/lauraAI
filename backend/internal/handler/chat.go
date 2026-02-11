package handler

import (
	"fmt"
	"log"
	"strconv"
	"strings"

	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
	"lauraai-backend/internal/service"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

const DailyMessageLimit = 10

// escapeJSON 转义 JSON 字符串中的特殊字符
func escapeJSON(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "\"", "\\\"")
	s = strings.ReplaceAll(s, "\n", "\\n")
	s = strings.ReplaceAll(s, "\r", "\\r")
	s = strings.ReplaceAll(s, "\t", "\\t")
	return s
}

type ChatHandler struct {
	characterRepo *repository.CharacterRepository
	messageRepo   *repository.MessageRepository
	chatService   service.ChatService
}

func NewChatHandler(chatService service.ChatService) *ChatHandler {
	return &ChatHandler{
		characterRepo: repository.NewCharacterRepository(),
		messageRepo:   repository.NewMessageRepository(),
		chatService:   chatService,
	}
}

// SendMessage 发送消息（流式响应）
func (h *ChatHandler) SendMessage(c *gin.Context) {
	log.Printf("SendMessage: 开始处理请求")

	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		log.Printf("SendMessage: 用户未认证")
		response.Error(c, 401, "Unauthorized")
		return
	}
	log.Printf("SendMessage: 用户ID=%d", user.ID)

	idStr := c.Param("id")
	characterID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.Error(c, 400, "Invalid character ID")
		return
	}

	// 获取角色
	character, err := h.characterRepo.GetByID(characterID)
	if err != nil {
		response.Error(c, 404, "Character not found")
		return
	}

	// 验证角色属于当前用户
	if character.UserID != user.ID {
		response.Error(c, 403, "Access denied")
		return
	}

	// Check daily message limit per character (10 messages per character per day, resets at UTC 00:00)
	todayCount, err := h.messageRepo.CountUserCharacterMessagesToday(user.ID, characterID)
	if err != nil {
		log.Printf("SendMessage: failed to count today's messages: %v", err)
	} else if todayCount >= DailyMessageLimit {
		response.Error(c, 429, fmt.Sprintf("Daily chat limit reached for this character (%d/%d). Come back tomorrow!", todayCount, DailyMessageLimit))
		return
	}

	var req struct {
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters: "+err.Error())
		return
	}
	log.Printf("SendMessage: characterID=%s 本条内容=%q 历史条数将取20", idStr, req.Message)

	// 先取历史（不含本条），再保存用户消息，避免重复发给模型
	historyMessages, _ := h.messageRepo.GetRecentByCharacterID(characterID, 20)

	userMessage := &model.Message{
		UserID:      user.ID,
		CharacterID: characterID,
		SenderType:  model.SenderTypeUser,
		Content:     req.Message,
	}
	if err := h.messageRepo.Create(userMessage); err != nil {
		response.Error(c, 500, "Failed to save message: "+err.Error())
		return
	}

	// 设置 SSE 响应头
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no") // 禁用 Nginx 缓存
	c.Header("Access-Control-Allow-Origin", "*")

	// 使用流式响应
	ctx := c.Request.Context()
	locale := middleware.GetLocaleFromContext(c)
	stream, err := h.chatService.ChatStream(ctx, character, historyMessages, req.Message, locale)
	if err != nil {
		log.Printf("SendMessage ChatStream error: %v", err)
		response.Error(c, 500, "Failed to generate response: "+err.Error())
		return
	}

	// 流式发送响应
	var fullResponse string
	for chunk := range stream {
		fullResponse += chunk
		// 直接写入 SSE 格式，与前端期望匹配
		c.Writer.WriteString("data: {\"chunk\":\"" + escapeJSON(chunk) + "\"}\n\n")
		c.Writer.Flush()
	}

	// 保存角色回复
	if fullResponse != "" {
		characterMessage := &model.Message{
			UserID:      user.ID,
			CharacterID: characterID,
			SenderType:  model.SenderTypeCharacter,
			Content:     fullResponse,
		}
		h.messageRepo.Create(characterMessage)
	}

	c.Writer.WriteString("data: [DONE]\n\n")
	c.Writer.Flush()
}

// GetDailyLimit returns the user's daily message usage (optionally per character)
func (h *ChatHandler) GetDailyLimit(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	// If character_id query param is provided, return per-character limit
	charIDStr := c.Query("character_id")
	if charIDStr != "" {
		charID, err := strconv.ParseUint(charIDStr, 10, 64)
		if err != nil {
			response.Error(c, 400, "Invalid character_id")
			return
		}
		todayCount, err := h.messageRepo.CountUserCharacterMessagesToday(user.ID, charID)
		if err != nil {
			response.Error(c, 500, "Failed to check daily limit")
			return
		}
		response.Success(c, gin.H{
			"character_id": charID,
			"used":         todayCount,
			"limit":        DailyMessageLimit,
			"remaining":    DailyMessageLimit - int(todayCount),
		})
		return
	}

	// Default: return global usage across all characters
	todayCount, err := h.messageRepo.CountUserMessagesToday(user.ID)
	if err != nil {
		response.Error(c, 500, "Failed to check daily limit")
		return
	}

	response.Success(c, gin.H{
		"used":      todayCount,
		"limit":     DailyMessageLimit,
		"remaining": DailyMessageLimit - int(todayCount),
	})
}

// LRA per user message (for cumulative earnings display)
const LRAPerMessage = 5

// GetAllDailyLimits returns per-character daily usage and cumulative earnings for all user characters
func (h *ChatHandler) GetAllDailyLimits(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	chars, err := h.characterRepo.GetByUserID(user.ID)
	if err != nil {
		response.Error(c, 500, "Failed to load characters")
		return
	}

	usages, _ := h.messageRepo.CountAllCharacterMessagesToday(user.ID)
	totals, _ := h.messageRepo.CountAllCharacterMessagesTotal(user.ID)
	todayByChar := make(map[uint64]int64)
	for _, u := range usages {
		todayByChar[u.CharacterID] = u.Used
	}
	totalByChar := make(map[uint64]int64)
	for _, t := range totals {
		totalByChar[t.CharacterID] = t.TotalSent
	}

	// One entry per user character: used, limit, remaining, total_sent, earned_lra
	limits := make([]gin.H, 0, len(chars))
	for _, ch := range chars {
		used := todayByChar[ch.ID]
		remaining := DailyMessageLimit - int(used)
		if remaining < 0 {
			remaining = 0
		}
		totalSent := totalByChar[ch.ID]
		earnedLra := totalSent * LRAPerMessage
		limits = append(limits, gin.H{
			"character_id": ch.ID,
			"used":         used,
			"limit":        DailyMessageLimit,
			"remaining":    remaining,
			"total_sent":   totalSent,
			"earned_lra":   earnedLra,
		})
	}

	response.Success(c, gin.H{
		"per_character_limit": DailyMessageLimit,
		"lra_per_message":     LRAPerMessage,
		"characters":          limits,
	})
}

// GetMessages 获取聊天历史
func (h *ChatHandler) GetMessages(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	idStr := c.Param("id")
	characterID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.Error(c, 400, "Invalid character ID")
		return
	}

	// 获取角色
	character, err := h.characterRepo.GetByID(characterID)
	if err != nil {
		response.Error(c, 404, "Character not found")
		return
	}

	// 验证角色属于当前用户
	if character.UserID != user.ID {
		response.Error(c, 403, "Access denied")
		return
	}

	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	messages, err := h.messageRepo.GetRecentByCharacterID(characterID, limit)
	if err != nil {
		response.Error(c, 500, "Failed to query: "+err.Error())
		return
	}

	response.Success(c, messages)
}
