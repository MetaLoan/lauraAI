package i18n

import (
	"strings"
)

// Locale 表示支持的语言
type Locale string

const (
	LocaleEn Locale = "en"
	LocaleZh Locale = "zh"
	LocaleRu Locale = "ru"
)

// DefaultLocale 默认语言
const DefaultLocale = LocaleEn

// SupportedLocales 支持的语言列表
var SupportedLocales = []Locale{LocaleEn, LocaleZh, LocaleRu}

// IsSupported 检查语言是否支持
func IsSupported(locale string) bool {
	for _, l := range SupportedLocales {
		if string(l) == locale {
			return true
		}
	}
	return false
}

// ParseLocale 解析语言代码，返回支持的语言
func ParseLocale(lang string) Locale {
	if lang == "" {
		return DefaultLocale
	}

	// 转小写
	lang = strings.ToLower(lang)

	// 处理带区域代码的语言（如 zh-CN, en-US）
	if idx := strings.Index(lang, "-"); idx > 0 {
		lang = lang[:idx]
	}
	if idx := strings.Index(lang, "_"); idx > 0 {
		lang = lang[:idx]
	}

	// 中文
	if strings.HasPrefix(lang, "zh") {
		return LocaleZh
	}

	// 俄语
	if strings.HasPrefix(lang, "ru") {
		return LocaleRu
	}

	// 英语或其他默认英语
	return LocaleEn
}

// Messages 翻译消息结构
type Messages struct {
	Errors   ErrorMessages
	Success  SuccessMessages
	Chat     ChatMessages
}

// ErrorMessages 错误消息
type ErrorMessages struct {
	Unauthorized       string
	InvalidRequest     string
	CharacterNotFound  string
	AccessDenied       string
	NotFound           string
	ServerError        string
	NetworkFailed      string
	AlreadyHelped      string
	NotInvited         string
	PaymentFailed      string
	UploadFailed       string
	GenerationFailed   string
	CannotHelpYourself string
	InvalidShareCode   string
	ShareLinkExpired   string
	CharacterAlreadyUnlocked string
}

// SuccessMessages 成功消息
type SuccessMessages struct {
	Success          string
	CharacterCreated string
	UnlockSuccess    string
	HelpUnlockSuccess string
}

// ChatMessages 聊天相关消息
type ChatMessages struct {
	WelcomeMessage string
}

// 语言包映射
var messages = map[Locale]*Messages{
	LocaleEn: messagesEn,
	LocaleZh: messagesZh,
	LocaleRu: messagesRu,
}

// GetMessages 获取指定语言的消息包
func GetMessages(locale Locale) *Messages {
	if msg, ok := messages[locale]; ok {
		return msg
	}
	return messages[DefaultLocale]
}

// T 翻译函数 - 根据 key 获取翻译文本
func T(locale Locale, category, key string) string {
	msg := GetMessages(locale)
	
	switch category {
	case "errors":
		return getErrorMessage(msg, key)
	case "success":
		return getSuccessMessage(msg, key)
	case "chat":
		return getChatMessage(msg, key)
	default:
		return key
	}
}

func getErrorMessage(msg *Messages, key string) string {
	switch key {
	case "unauthorized":
		return msg.Errors.Unauthorized
	case "invalidRequest":
		return msg.Errors.InvalidRequest
	case "characterNotFound":
		return msg.Errors.CharacterNotFound
	case "accessDenied":
		return msg.Errors.AccessDenied
	case "notFound":
		return msg.Errors.NotFound
	case "serverError":
		return msg.Errors.ServerError
	case "networkFailed":
		return msg.Errors.NetworkFailed
	case "alreadyHelped":
		return msg.Errors.AlreadyHelped
	case "notInvited":
		return msg.Errors.NotInvited
	case "paymentFailed":
		return msg.Errors.PaymentFailed
	case "uploadFailed":
		return msg.Errors.UploadFailed
	case "generationFailed":
		return msg.Errors.GenerationFailed
	case "cannotHelpYourself":
		return msg.Errors.CannotHelpYourself
	case "invalidShareCode":
		return msg.Errors.InvalidShareCode
	case "shareLinkExpired":
		return msg.Errors.ShareLinkExpired
	case "characterAlreadyUnlocked":
		return msg.Errors.CharacterAlreadyUnlocked
	default:
		return key
	}
}

func getSuccessMessage(msg *Messages, key string) string {
	switch key {
	case "success":
		return msg.Success.Success
	case "characterCreated":
		return msg.Success.CharacterCreated
	case "unlockSuccess":
		return msg.Success.UnlockSuccess
	case "helpUnlockSuccess":
		return msg.Success.HelpUnlockSuccess
	default:
		return key
	}
}

func getChatMessage(msg *Messages, key string) string {
	switch key {
	case "welcomeMessage":
		return msg.Chat.WelcomeMessage
	default:
		return key
	}
}
