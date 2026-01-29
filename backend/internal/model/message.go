package model

import (
	"time"

	"gorm.io/gorm"
)

type SenderType string

const (
	SenderTypeUser      SenderType = "user"
	SenderTypeCharacter SenderType = "character"
)

type Message struct {
	ID          uint64    `gorm:"primaryKey" json:"id"`
	UserID      uint64    `gorm:"index;not null" json:"user_id"`
	CharacterID uint64    `gorm:"index;not null" json:"character_id"`
	SenderType  SenderType `gorm:"type:varchar(20);not null" json:"sender_type"`
	Content     string    `gorm:"type:text;not null" json:"content"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	Character Character `gorm:"foreignKey:CharacterID" json:"-"`
}

func (Message) TableName() string {
	return "messages"
}
