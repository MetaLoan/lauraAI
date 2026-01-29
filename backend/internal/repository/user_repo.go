package repository

import (
	"lauraai-backend/internal/model"
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

func (r *UserRepository) CreateOrUpdate(user *model.User) error {
	var existing model.User
	err := DB.Where("telegram_id = ?", user.TelegramID).First(&existing).Error
	
	if err != nil {
		// 不存在，创建
		return DB.Create(user).Error
	}
	
	// 存在，更新
	user.ID = existing.ID
	return DB.Save(user).Error
}
