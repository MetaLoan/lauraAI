package repository

import (
	"time"

	"lauraai-backend/internal/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type AuthNonceRepository struct{}

func NewAuthNonceRepository() *AuthNonceRepository {
	return &AuthNonceRepository{}
}

func (r *AuthNonceRepository) Create(challenge *model.AuthNonce) error {
	return DB.Create(challenge).Error
}

func (r *AuthNonceRepository) ConsumeValid(walletAddress string, nonce string) (*model.AuthNonce, error) {
	var challenge model.AuthNonce

	err := DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("wallet_address = ? AND nonce = ? AND used = false AND expires_at > ?", walletAddress, nonce, time.Now()).
			First(&challenge).Error; err != nil {
			return err
		}

		now := time.Now()
		if err := tx.Model(&challenge).Updates(map[string]interface{}{
			"used":    true,
			"used_at": &now,
		}).Error; err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}
	return &challenge, nil
}

func (r *AuthNonceRepository) DeleteExpired() error {
	return DB.Where("expires_at <= ? OR used = true", time.Now().Add(-24*time.Hour)).Delete(&model.AuthNonce{}).Error
}
