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
		&model.MintWebhookReplay{},
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

	// Mint orders compatibility migration for new non-null fields
	defaultTreasury := config.AppConfig.MintTreasuryWallet
	if defaultTreasury == "" {
		defaultTreasury = "0x636cf7bed3da64f93e5b79465fc04ed79bccfcac"
	}
	log.Println("Running mint_orders compatibility migration...")
	DB.Exec("ALTER TABLE mint_orders ADD COLUMN IF NOT EXISTS token_amount_wei varchar(120)")
	DB.Exec("UPDATE mint_orders SET token_amount_wei = '0' WHERE token_amount_wei IS NULL OR token_amount_wei = ''")
	DB.Exec("ALTER TABLE mint_orders ALTER COLUMN token_amount_wei SET DEFAULT '0'")
	DB.Exec("ALTER TABLE mint_orders ALTER COLUMN token_amount_wei SET NOT NULL")
	DB.Exec("ALTER TABLE mint_orders ADD COLUMN IF NOT EXISTS treasury_wallet varchar(42)")
	DB.Exec("UPDATE mint_orders SET treasury_wallet = ? WHERE treasury_wallet IS NULL OR treasury_wallet = ''", defaultTreasury)
	DB.Exec("ALTER TABLE mint_orders ALTER COLUMN treasury_wallet SET DEFAULT '" + defaultTreasury + "'")
	DB.Exec("ALTER TABLE mint_orders ALTER COLUMN treasury_wallet SET NOT NULL")
	log.Println("mint_orders compatibility migration complete")

	log.Println("数据库连接成功")
	return nil
}
