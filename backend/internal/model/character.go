package model

import (
	"strings"
	"time"

	"gorm.io/gorm"
)

type CharacterType string

const (
	CharacterTypeSoulmate          CharacterType = "soulmate"
	CharacterTypeMiniMe            CharacterType = "mini_me"
	CharacterTypeFutureHusband     CharacterType = "future_husband"
	CharacterTypeFutureWife        CharacterType = "future_wife"
	CharacterTypeFutureBaby        CharacterType = "future_baby"
	CharacterTypeBoyfriend         CharacterType = "boyfriend"
	CharacterTypeGirlfriend        CharacterType = "girlfriend"
	CharacterTypeBestFriend        CharacterType = "best_friend"
	CharacterTypeCompanion         CharacterType = "companion"
	CharacterTypeMysteriousStranger CharacterType = "mysterious_stranger"
	CharacterTypeWiseMentor        CharacterType = "wise_mentor"
	CharacterTypeDreamGuide        CharacterType = "dream_guide"
)

// UnlockStatus 解锁状态枚举
type UnlockStatus int

const (
	UnlockStatusLocked      UnlockStatus = 0 // 未解锁，显示完全模糊图
	UnlockStatusHalfUnlocked UnlockStatus = 1 // 半解锁，显示半模糊图
	UnlockStatusFullUnlocked UnlockStatus = 2 // 完全解锁，显示清晰图
)

type Character struct {
	ID              uint64        `gorm:"primaryKey" json:"id"`
	UserID          uint64        `gorm:"index;not null" json:"user_id"`
	Type            CharacterType `gorm:"type:varchar(50);not null" json:"type"`
	Title           string        `gorm:"type:varchar(255)" json:"title"`
	Gender          string        `gorm:"type:varchar(50)" json:"gender"`
	Ethnicity       string        `gorm:"type:varchar(100)" json:"ethnicity"`
	ImageURL        string        `gorm:"type:text" json:"image_url"` // 保持兼容，存储当前应显示的图片
	Description     string        `gorm:"type:text" json:"description"`
	Compatibility   int           `gorm:"type:int;default:0" json:"compatibility"`
	AstroSign       string        `gorm:"type:varchar(100)" json:"astro_sign"`
	PersonalityPrompt string      `gorm:"type:text" json:"personality_prompt"`
	
	// 3张图片：完全模糊 -> 半模糊 -> 清晰
	FullBlurImageURL string       `gorm:"type:text" json:"full_blur_image_url"` // 100% 模糊
	HalfBlurImageURL string       `gorm:"type:text" json:"half_blur_image_url"` // 50% 模糊
	ClearImageURL    string       `gorm:"type:text" json:"clear_image_url"`     // 清晰原图
	
	// 解锁状态
	UnlockStatus     UnlockStatus `gorm:"type:int;default:0" json:"unlock_status"` // 0=未解锁, 1=半解锁, 2=完全解锁
	UnlockHelperID   *uint64      `gorm:"index" json:"unlock_helper_id,omitempty"`
	ShareCode        string       `gorm:"type:varchar(20);uniqueIndex" json:"share_code"`
	
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	User         User      `gorm:"foreignKey:UserID" json:"-"`
	UnlockHelper *User     `gorm:"foreignKey:UnlockHelperID" json:"-"`
	Messages     []Message `gorm:"foreignKey:CharacterID" json:"-"`
}

// GetDisplayImageURL 根据解锁状态返回应显示的图片URL
func (c *Character) GetDisplayImageURL() string {
	switch c.UnlockStatus {
	case UnlockStatusFullUnlocked:
		if c.ClearImageURL != "" {
			return c.ClearImageURL
		}
		return c.ImageURL // 兼容旧数据
	case UnlockStatusHalfUnlocked:
		if c.HalfBlurImageURL != "" {
			return c.HalfBlurImageURL
		}
		return c.ImageURL
	default: // UnlockStatusLocked
		if c.FullBlurImageURL != "" {
			return c.FullBlurImageURL
		}
		return c.ImageURL
	}
}

// IsDescriptionVisible 性格报告是否可见（仅完全解锁时可见）
func (c *Character) IsDescriptionVisible() bool {
	return c.UnlockStatus == UnlockStatusFullUnlocked
}

// normalizeImageURL 将图片URL规范化：
// - 如果是完整URL（http/https开头），提取相对路径部分
// - 如果是base64（data:开头），直接返回
// - 如果已经是相对路径，直接返回
// - 如果是空字符串，返回空字符串
func normalizeImageURL(url string) string {
	if url == "" {
		return ""
	}
	// base64格式直接返回
	if strings.HasPrefix(url, "data:") {
		return url
	}
	// 如果是完整URL，提取相对路径
	if strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://") {
		// 查找 /uploads/ 的位置
		idx := strings.Index(url, "/uploads/")
		if idx >= 0 {
			return url[idx:]
		}
		// 如果找不到 /uploads/，可能是其他格式的URL，尝试提取路径部分
		// 例如：https://example.com/path/to/image.jpg -> /path/to/image.jpg
		if strings.Contains(url, "://") {
			parts := strings.SplitN(url, "://", 2)
			if len(parts) == 2 {
				pathIdx := strings.Index(parts[1], "/")
				if pathIdx >= 0 {
					return parts[1][pathIdx:]
				}
			}
		}
		// 如果无法提取，返回原URL（可能是其他格式）
		return url
	}
	// 已经是相对路径，直接返回
	return url
}

// ToSafeResponse 根据解锁状态返回安全的响应数据，隐藏未解锁的图片URL
func (c *Character) ToSafeResponse() map[string]interface{} {
	result := map[string]interface{}{
		"id":            c.ID,
		"user_id":       c.UserID,
		"type":          c.Type,
		"title":         c.Title,
		"gender":        c.Gender,
		"ethnicity":     c.Ethnicity,
		"compatibility": c.Compatibility,
		"astro_sign":    c.AstroSign,
		"unlock_status": c.UnlockStatus,
		"share_code":    c.ShareCode,
		"created_at":    c.CreatedAt,
		"updated_at":    c.UpdatedAt,
	}

	// 根据解锁状态决定返回哪些图片 URL
	// 规范化URL：将完整URL转换为相对路径，兼容旧数据
	switch c.UnlockStatus {
	case UnlockStatusFullUnlocked:
		// 完全解锁：返回所有图片和描述
		normalizedClear := normalizeImageURL(c.ClearImageURL)
		normalizedFullBlur := normalizeImageURL(c.FullBlurImageURL)
		normalizedHalfBlur := normalizeImageURL(c.HalfBlurImageURL)
		result["image_url"] = normalizedClear
		result["full_blur_image_url"] = normalizedFullBlur
		result["half_blur_image_url"] = normalizedHalfBlur
		result["clear_image_url"] = normalizedClear
		result["description"] = c.Description
	case UnlockStatusHalfUnlocked:
		// 半解锁：只返回模糊图，不返回清晰图和描述
		normalizedHalfBlur := normalizeImageURL(c.HalfBlurImageURL)
		normalizedFullBlur := normalizeImageURL(c.FullBlurImageURL)
		result["image_url"] = normalizedHalfBlur
		result["full_blur_image_url"] = normalizedFullBlur
		result["half_blur_image_url"] = normalizedHalfBlur
		// 不返回 clear_image_url 和 description
	default:
		// 未解锁：只返回完全模糊图
		normalizedFullBlur := normalizeImageURL(c.FullBlurImageURL)
		result["image_url"] = normalizedFullBlur
		result["full_blur_image_url"] = normalizedFullBlur
		// 不返回 half_blur_image_url, clear_image_url 和 description
	}

	return result
}

func (Character) TableName() string {
	return "characters"
}
