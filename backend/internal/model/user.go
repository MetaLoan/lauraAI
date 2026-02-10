package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID         uint64     `gorm:"primaryKey" json:"id"`
	TelegramID int64      `gorm:"uniqueIndex;not null" json:"telegram_id"`
	Name       string     `gorm:"type:varchar(255)" json:"name"`
	Gender     string     `gorm:"type:varchar(50)" json:"gender"`
	BirthDate  *time.Time `gorm:"type:date" json:"birth_date,omitempty"`
	BirthTime  *string    `gorm:"type:time without time zone" json:"birth_time,omitempty"`
	BirthPlace string     `gorm:"type:varchar(255)" json:"birth_place"`
	Ethnicity  string     `gorm:"type:varchar(100)" json:"ethnicity"`
	AvatarURL  string     `gorm:"type:varchar(500)" json:"avatar_url"`

	// 邀请关系
	InviterID  *uint64 `gorm:"index" json:"inviter_id,omitempty"`
	InviteCode string  `gorm:"type:varchar(20);uniqueIndex" json:"invite_code"`

	// 资产/积分
	Points     int64   `gorm:"default:0" json:"points"`
	LRABalance float64 `gorm:"default:0" json:"lra_balance"`

	// Staking 相关
	StakingBalance    float64    `gorm:"default:0" json:"staking_balance"`
	StakingMultiplier float64    `gorm:"default:1.0" json:"staking_multiplier"`
	StakedAt          *time.Time `json:"staked_at,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Inviter   *User  `gorm:"foreignKey:InviterID" json:"-"`
	Referrals []User `gorm:"foreignKey:InviterID" json:"-"`
}

func (User) TableName() string {
	return "users"
}
