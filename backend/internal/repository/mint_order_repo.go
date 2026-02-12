package repository

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"

	"lauraai-backend/internal/model"

	"gorm.io/gorm"
)

type MintOrderRepository struct{}

func NewMintOrderRepository() *MintOrderRepository {
	return &MintOrderRepository{}
}

func (r *MintOrderRepository) Create(order *model.MintOrder) error {
	if order.OrderNo == "" {
		order.OrderNo = generateMintOrderNo()
	}
	return DB.Create(order).Error
}

func (r *MintOrderRepository) GetByIDAndUser(orderID uint64, userID uint64) (*model.MintOrder, error) {
	var order model.MintOrder
	if err := DB.Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *MintOrderRepository) GetConfirmedByCharacter(userID uint64, characterID uint64) (*model.MintOrder, error) {
	var order model.MintOrder
	err := DB.Where("user_id = ? AND character_id = ? AND status = ?", userID, characterID, model.MintOrderStatusConfirmed).
		Order("id desc").
		First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *MintOrderRepository) GetLatestPendingByCharacter(userID uint64, characterID uint64) (*model.MintOrder, error) {
	var order model.MintOrder
	err := DB.Where("user_id = ? AND character_id = ? AND status = ?", userID, characterID, model.MintOrderStatusPending).
		Order("id desc").
		First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *MintOrderRepository) Update(order *model.MintOrder) error {
	return DB.Save(order).Error
}

func (r *MintOrderRepository) HasConfirmedForCharacter(userID uint64, characterID uint64) (bool, error) {
	var count int64
	if err := DB.Model(&model.MintOrder{}).
		Where("user_id = ? AND character_id = ? AND status = ?", userID, characterID, model.MintOrderStatusConfirmed).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *MintOrderRepository) FailPendingByTxHash(txHash string, reason string) error {
	return DB.Model(&model.MintOrder{}).
		Where("tx_hash = ? AND status = ?", strings.ToLower(txHash), model.MintOrderStatusPending).
		Updates(map[string]interface{}{
			"status":      model.MintOrderStatusFailed,
			"fail_reason": reason,
		}).Error
}

func generateMintOrderNo() string {
	buf := make([]byte, 8)
	_, err := rand.Read(buf)
	if err != nil {
		return "MO-UNKNOWN"
	}
	return "MO-" + strings.ToUpper(hex.EncodeToString(buf))
}

func IsNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}
