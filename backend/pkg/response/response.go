package response

import (
	"net/http"

	"lauraai-backend/internal/i18n"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Code      int         `json:"code"`
	Message   string      `json:"message"`
	ErrorCode string      `json:"error_code,omitempty"`
	Data      interface{} `json:"data,omitempty"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

func SuccessWithMessage(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: message,
		Data:    data,
	})
}

// SuccessI18n 返回多语言成功消息
func SuccessI18n(c *gin.Context, locale i18n.Locale, messageKey string, data interface{}) {
	message := i18n.T(locale, "success", messageKey)
	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: message,
		Data:    data,
	})
}

func Error(c *gin.Context, code int, message string) {
	c.JSON(http.StatusOK, Response{
		Code:    code,
		Message: message,
	})
}

// ErrorI18n 返回多语言错误消息
func ErrorI18n(c *gin.Context, locale i18n.Locale, code int, messageKey string) {
	message := i18n.T(locale, "errors", messageKey)
	c.JSON(http.StatusOK, Response{
		Code:    code,
		Message: message,
	})
}

func ErrorWithStatus(c *gin.Context, statusCode int, code int, message string) {
	c.JSON(statusCode, Response{
		Code:    code,
		Message: message,
	})
}

// ErrorWithCode 返回带错误码的错误响应，前端可以根据 error_code 做不同处理
func ErrorWithCode(c *gin.Context, code int, errorCode string, message string) {
	c.JSON(http.StatusOK, Response{
		Code:      code,
		Message:   message,
		ErrorCode: errorCode,
	})
}

// ErrorWithCodeI18n 返回带错误码的多语言错误响应
func ErrorWithCodeI18n(c *gin.Context, locale i18n.Locale, code int, errorCode string, messageKey string) {
	message := i18n.T(locale, "errors", messageKey)
	c.JSON(http.StatusOK, Response{
		Code:      code,
		Message:   message,
		ErrorCode: errorCode,
	})
}
