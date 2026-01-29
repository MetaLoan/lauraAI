package repository

import (
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
