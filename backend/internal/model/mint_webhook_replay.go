package model

import (
	"time"

	"gorm.io/gorm"
)

type MintWebhookReplay struct {
	ID        uint64         `gorm:"primaryKey" json:"id"`
	ReplayKey string         `gorm:"type:varchar(160);uniqueIndex;not null" json:"replay_key"`
	ExpiresAt time.Time      `gorm:"index;not null" json:"expires_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (MintWebhookReplay) TableName() string {
	return "mint_webhook_replays"
}
