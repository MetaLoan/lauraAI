package repository

import (
	"time"

	"soulface-backend/internal/model"

	"gorm.io/gorm/clause"
)

type MintWebhookReplayRepository struct{}

func NewMintWebhookReplayRepository() *MintWebhookReplayRepository {
	return &MintWebhookReplayRepository{}
}

func (r *MintWebhookReplayRepository) RegisterReplayKey(replayKey string, ttl time.Duration) (bool, error) {
	record := &model.MintWebhookReplay{
		ReplayKey: replayKey,
		ExpiresAt: time.Now().Add(ttl),
	}
	result := DB.Clauses(clause.OnConflict{DoNothing: true}).Create(record)
	if result.Error != nil {
		return false, result.Error
	}
	return result.RowsAffected == 1, nil
}

func (r *MintWebhookReplayRepository) CleanupExpired() error {
	return DB.Where("expires_at <= ?", time.Now()).Delete(&model.MintWebhookReplay{}).Error
}
