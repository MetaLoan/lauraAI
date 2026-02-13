package repository

import (
	"fmt"
	"strings"
	"time"

	"soulface-backend/internal/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type MintVerifyJobRepository struct{}

func NewMintVerifyJobRepository() *MintVerifyJobRepository {
	return &MintVerifyJobRepository{}
}

func (r *MintVerifyJobRepository) UpsertPending(orderID uint64, txHash string, payerWallet string, reason string, nextRetryAt time.Time) error {
	job := &model.MintVerifyJob{
		OrderID:      orderID,
		TxHash:       strings.ToLower(strings.TrimSpace(txHash)),
		PayerWallet:  strings.ToLower(strings.TrimSpace(payerWallet)),
		Status:       model.MintVerifyJobStatusPending,
		MaxAttempts:  60,
		NextRetryAt:  nextRetryAt,
		LastError:    reason,
		AttemptCount: 0,
	}

	return DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "order_id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"tx_hash":       job.TxHash,
			"payer_wallet":  job.PayerWallet,
			"status":        model.MintVerifyJobStatusPending,
			"next_retry_at": nextRetryAt,
			"last_error":    reason,
			"updated_at":    time.Now(),
		}),
	}).Create(job).Error
}

func (r *MintVerifyJobRepository) UnlockStaleRunning(staleBefore time.Time) error {
	return DB.Model(&model.MintVerifyJob{}).
		Where("status = ? AND (last_tried_at IS NULL OR last_tried_at < ?)", model.MintVerifyJobStatusRunning, staleBefore).
		Updates(map[string]interface{}{
			"status":        model.MintVerifyJobStatusPending,
			"next_retry_at": time.Now(),
		}).Error
}

func (r *MintVerifyJobRepository) ClaimDue(limit int, now time.Time) ([]model.MintVerifyJob, error) {
	if limit <= 0 {
		limit = 10
	}
	tx := DB.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	var jobs []model.MintVerifyJob
	if err := tx.
		Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
		Where("status = ? AND next_retry_at <= ?", model.MintVerifyJobStatusPending, now).
		Order("next_retry_at asc").
		Limit(limit).
		Find(&jobs).Error; err != nil {
		tx.Rollback()
		return nil, err
	}
	if len(jobs) == 0 {
		tx.Commit()
		return jobs, nil
	}

	ids := make([]uint64, 0, len(jobs))
	for _, j := range jobs {
		ids = append(ids, j.ID)
	}

	if err := tx.Model(&model.MintVerifyJob{}).
		Where("id IN ? AND status = ?", ids, model.MintVerifyJobStatusPending).
		Updates(map[string]interface{}{
			"status":        model.MintVerifyJobStatusRunning,
			"last_tried_at": now,
			"attempt_count": gorm.Expr("attempt_count + 1"),
			"updated_at":    now,
		}).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}
	return jobs, nil
}

func (r *MintVerifyJobRepository) MarkDone(orderID uint64) error {
	return DB.Model(&model.MintVerifyJob{}).
		Where("order_id = ?", orderID).
		Updates(map[string]interface{}{
			"status":        model.MintVerifyJobStatusDone,
			"next_retry_at": time.Now(),
			"last_error":    "",
		}).Error
}

func (r *MintVerifyJobRepository) RescheduleOrDead(orderID uint64, nextRetryAt time.Time, errMsg string) error {
	var job model.MintVerifyJob
	if err := DB.Where("order_id = ?", orderID).First(&job).Error; err != nil {
		return err
	}

	newStatus := model.MintVerifyJobStatusPending
	if job.AttemptCount >= job.MaxAttempts {
		newStatus = model.MintVerifyJobStatusDead
	}

	return DB.Model(&model.MintVerifyJob{}).
		Where("order_id = ?", orderID).
		Updates(map[string]interface{}{
			"status":        newStatus,
			"next_retry_at": nextRetryAt,
			"last_error":    errMsg,
			"updated_at":    time.Now(),
		}).Error
}

func (r *MintVerifyJobRepository) MarkDead(orderID uint64, errMsg string) error {
	return DB.Model(&model.MintVerifyJob{}).
		Where("order_id = ?", orderID).
		Updates(map[string]interface{}{
			"status":        model.MintVerifyJobStatusDead,
			"next_retry_at": time.Now(),
			"last_error":    errMsg,
			"updated_at":    time.Now(),
		}).Error
}

func (r *MintVerifyJobRepository) CleanupFinished(olderThan time.Time) error {
	return DB.Where("status IN ? AND updated_at < ?", []model.MintVerifyJobStatus{model.MintVerifyJobStatusDone, model.MintVerifyJobStatusDead}, olderThan).
		Delete(&model.MintVerifyJob{}).Error
}

func (r *MintVerifyJobRepository) GetStats() (map[string]int64, error) {
	rows := []struct {
		Status string
		Count  int64
	}{}
	if err := DB.Model(&model.MintVerifyJob{}).
		Select("status, count(*) as count").
		Group("status").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	stats := map[string]int64{
		"pending": 0,
		"running": 0,
		"done":    0,
		"dead":    0,
		"total":   0,
	}
	for _, row := range rows {
		stats[row.Status] = row.Count
		stats["total"] += row.Count
	}
	return stats, nil
}

func (r *MintVerifyJobRepository) List(status string, limit int) ([]model.MintVerifyJob, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	q := DB.Model(&model.MintVerifyJob{})
	if status != "" {
		q = q.Where("status = ?", strings.ToLower(strings.TrimSpace(status)))
	}
	var jobs []model.MintVerifyJob
	if err := q.Order("next_retry_at asc").Limit(limit).Find(&jobs).Error; err != nil {
		return nil, err
	}
	return jobs, nil
}

func (r *MintVerifyJobRepository) ForceRetry(orderID uint64) error {
	res := DB.Model(&model.MintVerifyJob{}).
		Where("order_id = ?", orderID).
		Updates(map[string]interface{}{
			"status":        model.MintVerifyJobStatusPending,
			"next_retry_at": time.Now(),
			"updated_at":    time.Now(),
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("job not found")
	}
	return nil
}
