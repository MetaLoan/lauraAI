package repository

import (
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
