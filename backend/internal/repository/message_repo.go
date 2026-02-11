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

// CountUserCharacterMessagesToday counts user-sent messages today (UTC) for a specific character
func (r *MessageRepository) CountUserCharacterMessagesToday(userID, characterID uint64) (int64, error) {
	var count int64
	today := time.Now().UTC().Truncate(24 * time.Hour)
	err := DB.Model(&model.Message{}).
		Where("user_id = ? AND character_id = ? AND sender_type = ? AND created_at >= ?",
			userID, characterID, model.SenderTypeUser, today).
		Count(&count).Error
	return count, err
}

// CharacterDailyUsage holds per-character daily message usage
type CharacterDailyUsage struct {
	CharacterID uint64 `json:"character_id"`
	Used        int64  `json:"used"`
}

// CountAllCharacterMessagesToday returns today's user-sent message counts grouped by character
func (r *MessageRepository) CountAllCharacterMessagesToday(userID uint64) ([]CharacterDailyUsage, error) {
	var results []CharacterDailyUsage
	today := time.Now().UTC().Truncate(24 * time.Hour)
	err := DB.Model(&model.Message{}).
		Select("character_id, COUNT(*) as used").
		Where("user_id = ? AND sender_type = ? AND created_at >= ?", userID, model.SenderTypeUser, today).
		Group("character_id").
		Scan(&results).Error
	return results, err
}

// CharacterTotalUsage holds per-character total (all-time) user message count
type CharacterTotalUsage struct {
	CharacterID uint64 `json:"character_id"`
	TotalSent   int64  `json:"total_sent"`
}

// CountAllCharacterMessagesTotal returns all-time user-sent message counts grouped by character
func (r *MessageRepository) CountAllCharacterMessagesTotal(userID uint64) ([]CharacterTotalUsage, error) {
	var results []CharacterTotalUsage
	err := DB.Model(&model.Message{}).
		Select("character_id, COUNT(*) as total_sent").
		Where("user_id = ? AND sender_type = ?", userID, model.SenderTypeUser).
		Group("character_id").
		Scan(&results).Error
	return results, err
}
