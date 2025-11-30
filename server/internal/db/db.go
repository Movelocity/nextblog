package db

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"nextblog-server/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

/**
 * InitDB 初始化数据库连接
 */
func InitDB(dbPath string) error {
	// 确保数据库目录存在
	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("failed to create database directory: %w", err)
	}

	// 打开数据库连接
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect database: %w", err)
	}

	// 自动迁移数据库结构
	if err := db.AutoMigrate(
		&models.Post{},
		&models.Note{},
		&models.Category{},
		&models.Tag{},
		&models.SiteConfig{},
		&models.Image{},
		&models.FileResource{},
		&models.PostAssetRelation{},
		&models.ImageEditTask{},
	); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	DB = db
	log.Println("Database initialized successfully")
	return nil
}

/**
 * CloseDB 关闭数据库连接
 */
func CloseDB() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}
