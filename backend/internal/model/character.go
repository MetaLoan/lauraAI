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

type Character struct {
	ID              uint64        `gorm:"primaryKey" json:"id"`
	UserID          uint64        `gorm:"index;not null" json:"user_id"`
	Type            CharacterType `gorm:"type:varchar(50);not null" json:"type"`
	Title           string        `gorm:"type:varchar(255)" json:"title"`
	Gender          string        `gorm:"type:varchar(50)" json:"gender"`
	Ethnicity       string        `gorm:"type:varchar(100)" json:"ethnicity"`
	ImageURL        string        `gorm:"type:text" json:"image_url"`
	Description     string        `gorm:"type:text" json:"description"`
	Compatibility   int           `gorm:"type:int;default:0" json:"compatibility"`
	AstroSign       string        `gorm:"type:varchar(100)" json:"astro_sign"`
	PersonalityPrompt string      `gorm:"type:text" json:"personality_prompt"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	User    User     `gorm:"foreignKey:UserID" json:"-"`
	Messages []Message `gorm:"foreignKey:CharacterID" json:"-"`
}

func (Character) TableName() string {
	return "characters"
}
