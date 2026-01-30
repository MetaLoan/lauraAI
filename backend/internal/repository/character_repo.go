package repository

import (
	"crypto/rand"
	"encoding/hex"

	"lauraai-backend/internal/model"
)

type CharacterRepository struct{}

func NewCharacterRepository() *CharacterRepository {
	return &CharacterRepository{}
}

func (r *CharacterRepository) Create(character *model.Character) error {
	return DB.Create(character).Error
}

func (r *CharacterRepository) GetByID(id uint64) (*model.Character, error) {
	var character model.Character
	err := DB.First(&character, id).Error
	if err != nil {
		return nil, err
	}
	return &character, nil
}

func (r *CharacterRepository) GetByUserID(userID uint64) ([]model.Character, error) {
	var characters []model.Character
	err := DB.Where("user_id = ?", userID).Find(&characters).Error
	return characters, err
}

func (r *CharacterRepository) GetByUserIDAndType(userID uint64, charType model.CharacterType) (*model.Character, error) {
	var character model.Character
	err := DB.Where("user_id = ? AND type = ?", userID, charType).First(&character).Error
	if err != nil {
		return nil, err
	}
	return &character, nil
}

func (r *CharacterRepository) Update(character *model.Character) error {
	return DB.Save(character).Error
}

func (r *CharacterRepository) Delete(id uint64) error {
	return DB.Delete(&model.Character{}, id).Error
}

// DeleteEmptyByUserID 删除用户没有图片的角色，返回删除数量
func (r *CharacterRepository) DeleteEmptyByUserID(userID uint64) (int64, error) {
	result := DB.Unscoped().Where("user_id = ? AND (image_url IS NULL OR image_url = '')", userID).Delete(&model.Character{})
	return result.RowsAffected, result.Error
}

// GetByShareCode 通过分享码查找角色
func (r *CharacterRepository) GetByShareCode(shareCode string) (*model.Character, error) {
	var character model.Character
	err := DB.Where("share_code = ?", shareCode).First(&character).Error
	if err != nil {
		return nil, err
	}
	return &character, nil
}

// UpdateUnlockStatus 更新角色解锁状态
func (r *CharacterRepository) UpdateUnlockStatus(characterID uint64, status model.UnlockStatus, helperID *uint64) error {
	updates := map[string]interface{}{
		"unlock_status": status,
	}
	if helperID != nil {
		updates["unlock_helper_id"] = *helperID
	}
	return DB.Model(&model.Character{}).Where("id = ?", characterID).Updates(updates).Error
}

// GenerateShareCode 生成唯一的分享码
func GenerateShareCode() string {
	bytes := make([]byte, 6)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)[:8]
}

// HasUserHelpedOwner 检查某用户是否曾经帮助过某个用户的任何角色解锁
func (r *CharacterRepository) HasUserHelpedOwner(helperID uint64, ownerID uint64) (bool, error) {
	var count int64
	err := DB.Model(&model.Character{}).
		Where("user_id = ? AND unlock_helper_id = ?", ownerID, helperID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
