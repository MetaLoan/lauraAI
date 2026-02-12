package model

import (
	"time"

	"gorm.io/gorm"
)

type MintVerifyJobStatus string

const (
	MintVerifyJobStatusPending MintVerifyJobStatus = "pending"
	MintVerifyJobStatusRunning MintVerifyJobStatus = "running"
	MintVerifyJobStatusDone    MintVerifyJobStatus = "done"
	MintVerifyJobStatusDead    MintVerifyJobStatus = "dead"
)

type MintVerifyJob struct {
	ID           uint64              `gorm:"primaryKey" json:"id"`
	OrderID      uint64              `gorm:"uniqueIndex;not null" json:"order_id"`
	TxHash       string              `gorm:"type:varchar(80);not null" json:"tx_hash"`
	PayerWallet  string              `gorm:"type:varchar(42);not null" json:"payer_wallet"`
	Status       MintVerifyJobStatus `gorm:"type:varchar(20);index;not null;default:'pending'" json:"status"`
	AttemptCount int                 `gorm:"not null;default:0" json:"attempt_count"`
	MaxAttempts  int                 `gorm:"not null;default:60" json:"max_attempts"`
	NextRetryAt  time.Time           `gorm:"index;not null" json:"next_retry_at"`
	LastTriedAt  *time.Time          `json:"last_tried_at,omitempty"`
	LastError    string              `gorm:"type:text" json:"last_error,omitempty"`
	CreatedAt    time.Time           `json:"created_at"`
	UpdatedAt    time.Time           `json:"updated_at"`
	DeletedAt    gorm.DeletedAt      `gorm:"index" json:"-"`
}

func (MintVerifyJob) TableName() string {
	return "mint_verify_jobs"
}
