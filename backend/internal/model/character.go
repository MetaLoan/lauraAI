package model

import (
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

func (Character) TableName() string {
	return "characters"
}
