package middleware

import (
	"strings"

	"soulface-backend/internal/i18n"

	"github.com/gin-gonic/gin"
)

// LocaleContextKey 用于存储语言的上下文键
const LocaleContextKey = "locale"

// LocaleMiddleware 语言检测中间件
// 从请求头 Accept-Language 解析用户语言偏好
func LocaleMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		locale := detectLocale(c)
		c.Set(LocaleContextKey, locale)
		c.Next()
	}
}

// detectLocale 检测请求的语言
func detectLocale(c *gin.Context) i18n.Locale {
	// 1. 优先从 Accept-Language 头获取
	acceptLang := c.GetHeader("Accept-Language")
	if acceptLang != "" {
		// 解析 Accept-Language 头
		// 格式可能是 "en-US,en;q=0.9,zh-CN;q=0.8"
		langs := strings.Split(acceptLang, ",")
		if len(langs) > 0 {
			// 取第一个语言（优先级最高）
			firstLang := strings.TrimSpace(langs[0])
			// 移除质量因子（如 ;q=0.9）
			if idx := strings.Index(firstLang, ";"); idx > 0 {
				firstLang = firstLang[:idx]
			}
			locale := i18n.ParseLocale(firstLang)
			return locale
		}
	}

	// 2. Default locale
	return i18n.DefaultLocale
}

// GetLocaleFromContext 从上下文获取语言
func GetLocaleFromContext(c *gin.Context) i18n.Locale {
	if locale, exists := c.Get(LocaleContextKey); exists {
		if l, ok := locale.(i18n.Locale); ok {
			return l
		}
	}
	return i18n.DefaultLocale
}

// GetLocaleString 从上下文获取语言字符串
func GetLocaleString(c *gin.Context) string {
	return string(GetLocaleFromContext(c))
}
