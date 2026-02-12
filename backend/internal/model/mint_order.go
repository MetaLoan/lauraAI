package model

import (
	"time"

	"gorm.io/gorm"
)

type MintOrderStatus string

const (
	MintOrderStatusPending   MintOrderStatus = "pending"
	MintOrderStatusVerifying MintOrderStatus = "verifying"
	MintOrderStatusConfirmed MintOrderStatus = "confirmed"
	MintOrderStatusFailed    MintOrderStatus = "failed"
)

type MintOrder struct {
	ID             uint64          `gorm:"primaryKey" json:"id"`
	OrderNo        string          `gorm:"type:varchar(40);uniqueIndex;not null" json:"order_no"`
	UserID         uint64          `gorm:"index;not null" json:"user_id"`
	CharacterID    uint64          `gorm:"index;not null" json:"character_id"`
	Status         MintOrderStatus `gorm:"type:varchar(20);index;not null;default:'pending'" json:"status"`
	ChainID        int64           `gorm:"not null" json:"chain_id"`
	TokenAddress   string          `gorm:"type:varchar(64);not null" json:"token_address"`
	TokenSymbol    string          `gorm:"type:varchar(20);not null" json:"token_symbol"`
	TokenAmount    string          `gorm:"type:varchar(80);not null" json:"token_amount"`
	TokenAmountWei string          `gorm:"type:varchar(120);not null;default:'0'" json:"token_amount_wei"`
	TreasuryWallet string          `gorm:"type:varchar(42);not null" json:"treasury_wallet"`
	TxHash         *string         `gorm:"type:varchar(80);uniqueIndex" json:"tx_hash,omitempty"`
	PayerWallet    string          `gorm:"type:varchar(42)" json:"payer_wallet"`
	BlockNumber    uint64          `json:"block_number"`
	VerifiedAt     *time.Time      `json:"verified_at,omitempty"`
	FailReason     string          `gorm:"type:text" json:"fail_reason,omitempty"`
	Metadata       string          `gorm:"type:text" json:"metadata,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
	DeletedAt      gorm.DeletedAt  `gorm:"index" json:"-"`
}

func (MintOrder) TableName() string {
	return "mint_orders"
}

func CanMintOrderTransition(from MintOrderStatus, to MintOrderStatus) bool {
	switch from {
	case MintOrderStatusPending:
		return to == MintOrderStatusVerifying || to == MintOrderStatusConfirmed || to == MintOrderStatusFailed
	case MintOrderStatusVerifying:
		return to == MintOrderStatusConfirmed || to == MintOrderStatusFailed
	case MintOrderStatusFailed:
		return to == MintOrderStatusVerifying || to == MintOrderStatusFailed
	case MintOrderStatusConfirmed:
		return to == MintOrderStatusConfirmed
	default:
		return false
	}
}
