package repository

import (
	"time"

	"lauraai-backend/internal/model"
)

type MessageRepository struct{}

func NewMessageRepository() *MessageRepository {
	return &MessageRepository{}
}

func (r *MessageRepository) Create(message *model.Message) error {
	return DB.Create(message).Error
}

func (r *MessageRepository) GetByCharacterID(characterID uint64, limit int) ([]model.Message, error) {
	var messages []model.Message
	query := DB.Where("character_id = ?", characterID).Order("created_at ASC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&messages).Error
	return messages, err
}

func (r *MessageRepository) GetRecentByCharacterID(characterID uint64, limit int) ([]model.Message, error) {
	var messages []model.Message
	err := DB.Where("character_id = ?", characterID).
		Order("created_at DESC").
		Limit(limit).
		Find(&messages).Error
	return messages, err
}

// CountUserMessagesToday counts user-sent messages today (UTC) across all characters
func (r *MessageRepository) CountUserMessagesToday(userID uint64) (int64, error) {
	var count int64
	today := time.Now().UTC().Truncate(24 * time.Hour)
	err := DB.Model(&model.Message{}).
		Where("user_id = ? AND sender_type = ? AND created_at >= ?", userID, model.SenderTypeUser, today).
		Count(&count).Error
	return count, err
}
