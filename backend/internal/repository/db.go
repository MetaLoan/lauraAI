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

	// 自动迁移
	err = DB.AutoMigrate(
		&model.User{},
		&model.Character{},
		&model.Message{},
	)
	
	if err != nil {
		return err
	}

	// 强制修复 birth_time 字段类型
	log.Println("正在修复 birth_time 字段类型...")
	DB.Exec("ALTER TABLE users DROP COLUMN IF EXISTS birth_time")
	DB.Exec("ALTER TABLE users ADD COLUMN birth_time time without time zone")
	log.Println("birth_time 字段类型修复完成")

	// 修复 image_url 字段类型（从 varchar(500) 改为 text 以支持 base64 图片）
	log.Println("正在修复 image_url 字段类型...")
	DB.Exec("ALTER TABLE characters ALTER COLUMN image_url TYPE text")
	log.Println("image_url 字段类型修复完成")

	log.Println("数据库连接成功")
	return nil
}
