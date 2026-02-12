package model

import (
	"time"
)

type AuthNonce struct {
	ID            uint64     `gorm:"primaryKey" json:"id"`
	WalletAddress string     `gorm:"type:varchar(42);index;not null" json:"wallet_address"`
	Nonce         string     `gorm:"type:varchar(128);uniqueIndex;not null" json:"nonce"`
	Message       string     `gorm:"type:text;not null" json:"message"`
	ExpiresAt     time.Time  `gorm:"index;not null" json:"expires_at"`
	Used          bool       `gorm:"default:false;index" json:"used"`
	UsedAt        *time.Time `json:"used_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

func (AuthNonce) TableName() string {
	return "auth_nonces"
}
