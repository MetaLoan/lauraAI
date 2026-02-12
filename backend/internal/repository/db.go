package repository

import (
	"log"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() error {
	var err error

	DB, err = gorm.Open(postgres.Open(config.AppConfig.PostgresDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return err
	}

	// Migration: drop legacy telegram_id column if it exists (replaced by wallet_address)
	log.Println("Running migration: telegram_id -> wallet_address...")
	DB.Exec("ALTER TABLE users DROP COLUMN IF EXISTS telegram_id")
	// Ensure wallet_address exists and existing rows have non-null value before NOT NULL constraint
	DB.Exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address varchar(42)")
	DB.Exec("UPDATE users SET wallet_address = '0x0000000000000000000000000000000000000000' WHERE wallet_address IS NULL OR wallet_address = ''")
	DB.Exec("ALTER TABLE users ALTER COLUMN wallet_address SET NOT NULL")
	log.Println("Migration complete")

	// Auto-migrate models
	err = DB.AutoMigrate(
		&model.User{},
		&model.Character{},
		&model.Message{},
		&model.AuthNonce{},
		&model.MintOrder{},
	)

	if err != nil {
		return err
	}

	// Fix birth_time field type
	log.Println("Fixing birth_time field type...")
	DB.Exec("ALTER TABLE users DROP COLUMN IF EXISTS birth_time")
	DB.Exec("ALTER TABLE users ADD COLUMN birth_time time without time zone")
	log.Println("birth_time field type fixed")

	// 修复 image_url 字段类型（从 varchar(500) 改为 text 以支持 base64 图片）
	log.Println("正在修复 image_url 字段类型...")
	DB.Exec("ALTER TABLE characters ALTER COLUMN image_url TYPE text")
	log.Println("image_url 字段类型修复完成")

	log.Println("数据库连接成功")
	return nil
}
