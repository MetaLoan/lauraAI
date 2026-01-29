package handler

import (
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
	chatService   *service.GeminiChatService
}

func NewChatHandler(chatService *service.GeminiChatService) *ChatHandler {
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
		response.Error(c, 401, "未认证")
		return
	}
	log.Printf("SendMessage: 用户ID=%d", user.ID)

	idStr := c.Param("id")
	characterID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.Error(c, 400, "无效的角色 ID")
		return
	}

	// 获取角色
	character, err := h.characterRepo.GetByID(characterID)
	if err != nil {
		response.Error(c, 404, "角色不存在")
		return
	}

	// 验证角色属于当前用户
	if character.UserID != user.ID {
		response.Error(c, 403, "无权访问")
		return
	}

	var req struct {
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "无效的请求参数: "+err.Error())
		return
	}

	// 保存用户消息
	userMessage := &model.Message{
		UserID:      user.ID,
		CharacterID: characterID,
		SenderType:  model.SenderTypeUser,
		Content:     req.Message,
	}
	if err := h.messageRepo.Create(userMessage); err != nil {
		response.Error(c, 500, "保存消息失败: "+err.Error())
		return
	}

	// 获取历史消息（最近 20 条）
	historyMessages, _ := h.messageRepo.GetRecentByCharacterID(characterID, 20)

	// 设置 SSE 响应头
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no") // 禁用 Nginx 缓存
	c.Header("Access-Control-Allow-Origin", "*")

	// 使用流式响应
	ctx := c.Request.Context()
	stream, err := h.chatService.ChatStream(ctx, character, historyMessages, req.Message)
	if err != nil {
		response.Error(c, 500, "生成响应失败: "+err.Error())
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

// GetMessages 获取聊天历史
func (h *ChatHandler) GetMessages(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "未认证")
		return
	}

	idStr := c.Param("id")
	characterID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.Error(c, 400, "无效的角色 ID")
		return
	}

	// 获取角色
	character, err := h.characterRepo.GetByID(characterID)
	if err != nil {
		response.Error(c, 404, "角色不存在")
		return
	}

	// 验证角色属于当前用户
	if character.UserID != user.ID {
		response.Error(c, 403, "无权访问")
		return
	}

	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	messages, err := h.messageRepo.GetRecentByCharacterID(characterID, limit)
	if err != nil {
		response.Error(c, 500, "查询失败: "+err.Error())
		return
	}

	response.Success(c, messages)
}
