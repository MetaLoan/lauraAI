package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID         uint64    `gorm:"primaryKey" json:"id"`
	TelegramID int64     `gorm:"uniqueIndex;not null" json:"telegram_id"`
	Name       string    `gorm:"type:varchar(255)" json:"name"`
	Gender     string    `gorm:"type:varchar(50)" json:"gender"`
	BirthDate  *time.Time `gorm:"type:date" json:"birth_date,omitempty"`
	BirthTime  *string    `gorm:"type:time without time zone" json:"birth_time,omitempty"`
	BirthPlace string    `gorm:"type:varchar(255)" json:"birth_place"`
	Ethnicity  string    `gorm:"type:varchar(100)" json:"ethnicity"`
	AvatarURL  string    `gorm:"type:varchar(500)" json:"avatar_url"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string {
	return "users"
}
