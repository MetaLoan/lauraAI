package repository

import (
	"lauraai-backend/internal/model"

	"gorm.io/gorm"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

func (r *UserRepository) Create(user *model.User) error {
	return DB.Create(user).Error
}

func (r *UserRepository) GetByID(id uint64) (*model.User, error) {
	var user model.User
	err := DB.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByTelegramID(telegramID int64) (*model.User, error) {
	var user model.User
	err := DB.Where("telegram_id = ?", telegramID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Update(user *model.User) error {
	return DB.Save(user).Error
}

func (r *UserRepository) Delete(id uint64) error {
	// 使用事务确保原子性，硬删除避免唯一键冲突
	return DB.Transaction(func(tx *gorm.DB) error {
		// 硬删除用户消息
		if err := tx.Unscoped().Where("user_id = ?", id).Delete(&model.Message{}).Error; err != nil {
			return err
		}
		// 硬删除用户角色
		if err := tx.Unscoped().Where("user_id = ?", id).Delete(&model.Character{}).Error; err != nil {
			return err
		}
		// 硬删除用户本身
		if err := tx.Unscoped().Delete(&model.User{}, id).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *UserRepository) CreateOrUpdate(user *model.User) error {
	var existing model.User
	// 使用 Unscoped 查询包括软删除的记录
	err := DB.Unscoped().Where("telegram_id = ?", user.TelegramID).First(&existing).Error
	
	if err != nil {
		// 不存在，创建
		return DB.Create(user).Error
	}
	
	// 存在（可能是被软删除的），恢复并更新
	user.ID = existing.ID
	// 清除 DeletedAt 以恢复记录
	return DB.Unscoped().Model(user).Updates(map[string]interface{}{
		"name":       user.Name,
		"deleted_at": nil,
	}).Error
}
