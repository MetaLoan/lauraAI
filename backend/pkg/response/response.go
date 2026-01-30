package response

import (
	"net/http"

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

func Error(c *gin.Context, code int, message string) {
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
