package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	"nextblog-server/internal/db"
	"nextblog-server/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// PostConfig YAML 配置结构
type PostConfig struct {
	Title       string   `yaml:"title"`
	Description string   `yaml:"description"`
	CreatedAt   string   `yaml:"createdAt"`
	UpdatedAt   string   `yaml:"updatedAt"`
	Published   bool     `yaml:"published"`
	Tags        []string `yaml:"tags"`
	Categories  []string `yaml:"categories"`
}

// MetaData meta.json 结构
type MetaData struct {
	LastUpdated string                   `json:"lastUpdated"`
	Blogs       map[string]MetaBlogEntry `json:"blogs"`
	Categories  []string                 `json:"categories"`
	Tags        []string                 `json:"tags"`
}

// MetaBlogEntry meta.json 中的博客条目
type MetaBlogEntry struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	CreatedAt   string   `json:"createdAt"`
	UpdatedAt   string   `json:"updatedAt"`
	Published   bool     `json:"published"`
	Tags        []string `json:"tags"`
	Categories  []string `json:"categories"`
}

// NoteIndex notes/index.json 结构
type NoteIndex struct {
	Files  map[string][]NoteEntry `json:"files"`
	Tagged map[string]int         `json:"tagged"`
}

// NoteEntry 笔记索引条目
type NoteEntry struct {
	ID       string   `json:"id"`
	IsPublic bool     `json:"isPublic"`
	Tags     []string `json:"tags"`
}

// NoteData 笔记数据
type NoteData struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Data      string    `json:"data"`
	IsPublic  bool      `json:"isPublic"`
	Tags      []string  `json:"tags"`
}

// SiteConfigData site-config.json 结构
type SiteConfigData struct {
	ICPInfo         string `json:"icpInfo"`
	SiteName        string `json:"siteName"`
	SiteDescription string `json:"siteDescription"`
}

var (
	sourcePath string
	dbPath     string
	storagePath string
)

func init() {
	flag.StringVar(&sourcePath, "source", "../blogs", "Source blogs directory path")
	flag.StringVar(&dbPath, "db", "./data/nextblog.db", "Database file path")
	flag.StringVar(&storagePath, "storage", "./storage", "Storage directory path")
}

func main() {
	flag.Parse()

	log.Println("Starting data migration...")
	log.Printf("Source: %s", sourcePath)
	log.Printf("Database: %s", dbPath)
	log.Printf("Storage: %s", storagePath)

	// 初始化数据库
	if err := initDatabase(dbPath); err != nil {
		log.Fatal(err)
	}

	// 创建存储目录
	if err := createStorageDirectories(storagePath); err != nil {
		log.Fatal(err)
	}

	// 迁移站点配置
	if err := migrateSiteConfig(); err != nil {
		log.Printf("Warning: Failed to migrate site config: %v", err)
	}

	// 迁移博客文章
	if err := migratePosts(); err != nil {
		log.Fatal(err)
	}

	// 迁移笔记
	if err := migrateNotes(); err != nil {
		log.Fatal(err)
	}

	// 迁移分类和标签统计
	if err := migrateCategoriesAndTags(); err != nil {
		log.Fatal(err)
	}

	// 复制图片文件
	if err := copyImages(); err != nil {
		log.Printf("Warning: Failed to copy images: %v", err)
	}

	log.Println("Data migration completed successfully!")
}

/**
 * initDatabase 初始化数据库
 */
func initDatabase(path string) error {
	dbDir := filepath.Dir(path)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("failed to create database directory: %w", err)
	}

	dbInstance, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect database: %w", err)
	}

	if err := dbInstance.AutoMigrate(
		&models.Post{},
		&models.Note{},
		&models.Category{},
		&models.Tag{},
		&models.SiteConfig{},
		&models.Image{},
	); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	db.DB = dbInstance
	log.Println("Database initialized")
	return nil
}

/**
 * createStorageDirectories 创建存储目录
 */
func createStorageDirectories(basePath string) error {
	dirs := []string{"images", "uploads", "thumbnails"}
	for _, dir := range dirs {
		path := filepath.Join(basePath, dir)
		if err := os.MkdirAll(path, 0755); err != nil {
			return fmt.Errorf("failed to create directory %s: %w", path, err)
		}
	}
	
	// 创建 .gitkeep 文件
	for _, dir := range dirs {
		gitkeep := filepath.Join(basePath, dir, ".gitkeep")
		if _, err := os.Stat(gitkeep); os.IsNotExist(err) {
			if err := os.WriteFile(gitkeep, []byte(""), 0644); err != nil {
				log.Printf("Warning: Failed to create .gitkeep in %s: %v", dir, err)
			}
		}
	}
	
	log.Println("Storage directories created")
	return nil
}

/**
 * migrateSiteConfig 迁移站点配置
 */
func migrateSiteConfig() error {
	configPath := filepath.Join(sourcePath, "site-config.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("failed to read site config: %w", err)
	}

	var siteConfig SiteConfigData
	if err := json.Unmarshal(data, &siteConfig); err != nil {
		return fmt.Errorf("failed to parse site config: %w", err)
	}

	config := models.SiteConfig{
		ID:              1,
		SiteName:        siteConfig.SiteName,
		SiteDescription: siteConfig.SiteDescription,
		ICPInfo:         siteConfig.ICPInfo,
		UpdatedAt:       time.Now(),
	}

	result := db.DB.Save(&config)
	if result.Error != nil {
		return fmt.Errorf("failed to save site config: %w", result.Error)
	}

	log.Printf("Site config migrated: %s", config.SiteName)
	return nil
}

/**
 * migratePosts 迁移博客文章
 */
func migratePosts() error {
	metaPath := filepath.Join(sourcePath, "meta.json")
	data, err := os.ReadFile(metaPath)
	if err != nil {
		return fmt.Errorf("failed to read meta.json: %w", err)
	}

	var meta MetaData
	if err := json.Unmarshal(data, &meta); err != nil {
		return fmt.Errorf("failed to parse meta.json: %w", err)
	}

	count := 0
	for id, entry := range meta.Blogs {
		// 读取文章内容
		contentPath := filepath.Join(sourcePath, id, "index.md")
		content, err := os.ReadFile(contentPath)
		if err != nil {
			log.Printf("Warning: Failed to read content for post %s: %v", id, err)
			content = []byte("")
		}

		// 解析时间
		createdAt, _ := time.Parse(time.RFC3339, entry.CreatedAt)
		updatedAt, _ := time.Parse(time.RFC3339, entry.UpdatedAt)

		post := models.Post{
			ID:          id,
			Title:       entry.Title,
			Description: entry.Description,
			Content:     string(content),
			Published:   entry.Published,
			CreatedAt:   createdAt,
			UpdatedAt:   updatedAt,
			Tags:        entry.Tags,
			Categories:  entry.Categories,
		}

		if result := db.DB.Save(&post); result.Error != nil {
			log.Printf("Warning: Failed to save post %s: %v", id, result.Error)
		} else {
			count++
		}
	}

	log.Printf("Migrated %d posts", count)
	return nil
}

/**
 * migrateNotes 迁移笔记
 */
func migrateNotes() error {
	notesDir := filepath.Join(sourcePath, "notes")
	
	// 读取 notes/index.json
	indexPath := filepath.Join(notesDir, "index.json")
	indexData, err := os.ReadFile(indexPath)
	if err != nil {
		return fmt.Errorf("failed to read notes index: %w", err)
	}

	var noteIndex NoteIndex
	if err := json.Unmarshal(indexData, &noteIndex); err != nil {
		return fmt.Errorf("failed to parse notes index: %w", err)
	}

	count := 0
	// 遍历每个日期的笔记文件
	for filename := range noteIndex.Files {
		notePath := filepath.Join(notesDir, filename)
		noteData, err := os.ReadFile(notePath)
		if err != nil {
			log.Printf("Warning: Failed to read note file %s: %v", filename, err)
			continue
		}

		var notes []NoteData
		if err := json.Unmarshal(noteData, &notes); err != nil {
			log.Printf("Warning: Failed to parse note file %s: %v", filename, err)
			continue
		}

		// 从文件名提取日期 (YYYY-MM-DD.json)
		date := filename[:len(filename)-5] // 移除 .json

		for _, noteData := range notes {
			note := models.Note{
				ID:        noteData.ID,
				Date:      date,
				Data:      noteData.Data,
				IsPublic:  noteData.IsPublic,
				Tags:      noteData.Tags,
				CreatedAt: noteData.CreatedAt,
				UpdatedAt: noteData.UpdatedAt,
			}

			if result := db.DB.Save(&note); result.Error != nil {
				log.Printf("Warning: Failed to save note %s: %v", noteData.ID, result.Error)
			} else {
				count++
			}
		}
	}

	log.Printf("Migrated %d notes", count)
	return nil
}

/**
 * migrateCategoriesAndTags 迁移分类和标签统计
 */
func migrateCategoriesAndTags() error {
	// 统计分类
	var categoryStats []struct {
		Name  string
		Count int64
	}
	
	// 使用原始 SQL 查询，因为 GORM 在处理 JSON 数组时有限制
	db.DB.Raw(`
		SELECT json_each.value as Name, COUNT(*) as Count
		FROM posts, json_each(posts.categories)
		GROUP BY json_each.value
	`).Scan(&categoryStats)

	for _, stat := range categoryStats {
		category := models.Category{
			Name:  stat.Name,
			Count: int(stat.Count),
		}
		db.DB.Save(&category)
	}

	log.Printf("Migrated %d categories", len(categoryStats))

	// 统计标签
	var tagStats []struct {
		Name  string
		Count int64
	}
	
	db.DB.Raw(`
		SELECT json_each.value as Name, COUNT(*) as Count
		FROM posts, json_each(posts.tags)
		GROUP BY json_each.value
	`).Scan(&tagStats)

	for _, stat := range tagStats {
		tag := models.Tag{
			Name:  stat.Name,
			Count: int(stat.Count),
		}
		db.DB.Save(&tag)
	}

	log.Printf("Migrated %d tags", len(tagStats))
	return nil
}

/**
 * copyImages 复制图片文件
 */
func copyImages() error {
	imagesSourceDir := filepath.Join(sourcePath, "images")
	imagesDestDir := filepath.Join(storagePath, "images")

	if _, err := os.Stat(imagesSourceDir); os.IsNotExist(err) {
		log.Println("No images directory found, skipping image migration")
		return nil
	}

	entries, err := os.ReadDir(imagesSourceDir)
	if err != nil {
		return fmt.Errorf("failed to read images directory: %w", err)
	}

	count := 0
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		sourcePath := filepath.Join(imagesSourceDir, entry.Name())
		destPath := filepath.Join(imagesDestDir, entry.Name())

		if err := copyFile(sourcePath, destPath); err != nil {
			log.Printf("Warning: Failed to copy image %s: %v", entry.Name(), err)
			continue
		}

		// 保存图片记录到数据库
		info, _ := entry.Info()
		image := models.Image{
			Filename:  entry.Name(),
			Path:      destPath,
			Size:      info.Size(),
			MimeType:  getMimeType(entry.Name()),
			CreatedAt: time.Now(),
		}

		if result := db.DB.Save(&image); result.Error != nil {
			log.Printf("Warning: Failed to save image record %s: %v", entry.Name(), result.Error)
		}

		count++
	}

	log.Printf("Copied %d images", count)
	return nil
}

/**
 * copyFile 复制文件
 */
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
}

/**
 * getMimeType 根据文件扩展名获取 MIME 类型
 */
func getMimeType(filename string) string {
	ext := filepath.Ext(filename)
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}

