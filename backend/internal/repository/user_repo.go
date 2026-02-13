package repository

import (
	"crypto/rand"
	"encoding/hex"

	"soulface-backend/internal/model"

	"gorm.io/gorm"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

// GenerateInviteCode 生成唯一的邀请码
func GenerateInviteCode() string {
	bytes := make([]byte, 6)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)[:8]
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

func (r *UserRepository) GetByWalletAddress(address string) (*model.User, error) {
	var user model.User
	err := DB.Where("wallet_address = ?", address).First(&user).Error
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
		// 先清除所有指向该用户的 inviter_id（避免外键约束冲突）
		if err := tx.Model(&model.User{}).Where("inviter_id = ?", id).Update("inviter_id", nil).Error; err != nil {
			return err
		}
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
	// Use Unscoped to include soft-deleted records
	err := DB.Unscoped().Where("wallet_address = ?", user.WalletAddress).First(&existing).Error

	if err != nil {
		// Does not exist, generate invite code on creation
		if user.InviteCode == "" {
			user.InviteCode = GenerateInviteCode()
		}
		return DB.Create(user).Error
	}

	// Exists (possibly soft-deleted), restore and update
	user.ID = existing.ID
	return DB.Unscoped().Model(user).Updates(map[string]interface{}{
		"name":       user.Name,
		"deleted_at": nil,
	}).Error
}

// GetByInviteCode 通过邀请码查找用户
func (r *UserRepository) GetByInviteCode(code string) (*model.User, error) {
	var user model.User
	err := DB.Where("invite_code = ?", code).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetReferrals 获取用户的下级好友列表
func (r *UserRepository) GetReferrals(userID uint64) ([]model.User, error) {
	var users []model.User
	err := DB.Where("inviter_id = ?", userID).Find(&users).Error
	return users, err
}

// SetInviter 设置用户的邀请人
func (r *UserRepository) SetInviter(userID, inviterID uint64) error {
	return DB.Model(&model.User{}).Where("id = ?", userID).Update("inviter_id", inviterID).Error
}

// EnsureInviteCode 确保用户有邀请码，如果没有则生成
func (r *UserRepository) EnsureInviteCode(user *model.User) error {
	if user.InviteCode != "" {
		return nil
	}
	user.InviteCode = GenerateInviteCode()
	return DB.Model(user).Update("invite_code", user.InviteCode).Error
}
