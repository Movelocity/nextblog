package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm/logger"

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
	sourcePath  string
	dbPath      string
	storagePath string
)

func init() {
	flag.StringVar(&sourcePath, "source", "../blogs", "Source blogs directory path")
	flag.StringVar(&dbPath, "db", "./data/nextblog.db", "Database file path")
	flag.StringVar(&storagePath, "storage", "./data", "Storage directory path")
}

func main() {
	flag.Parse()

	log.Println("开始数据迁移...")
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
		log.Printf("迁移站点配置失败: %v", err)
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
		log.Printf("复制图片失败: %v", err)
	}

	log.Println("数据迁移完成!")
}

/**
 * initDatabase 初始化数据库
 */
func initDatabase(path string) error {
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			SlowThreshold:             time.Second,   // Slow SQL threshold
			LogLevel:                  logger.Silent, // Log level
			IgnoreRecordNotFoundError: true,          // Ignore ErrRecordNotFound error for logger
			ParameterizedQueries:      true,          // Don't include params in the SQL log
			Colorful:                  false,         // Disable color
		},
	)
	dbDir := filepath.Dir(path)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("创建数据库目录失败: %w", err)
	}

	dbInstance, err := gorm.Open(sqlite.Open(path), &gorm.Config{Logger: newLogger})
	if err != nil {
		return fmt.Errorf("连接数据库失败: %w", err)
	}

	if err := dbInstance.AutoMigrate(
		&models.Post{},
		&models.Note{},
		&models.Category{},
		&models.Tag{},
		&models.SiteConfig{},
		&models.FileResource{},
		&models.PostAssetRelation{},
	); err != nil {
		return fmt.Errorf("迁移数据库失败: %w", err)
	}

	db.DB = dbInstance
	log.Println("数据库初始化完成")
	return nil
}

/**
 * createStorageDirectories 创建存储目录
 * 统一存储策略：持久化文件存储在 files/ 目录，派生文件（缩略图）存储在 thumbnails/ 目录
 */
func createStorageDirectories(basePath string) error {
	// 统一存储目录：files（持久化文件）和 thumbnails（派生文件）
	dirs := []string{"files", "thumbnails"}
	for _, dir := range dirs {
		path := filepath.Join(basePath, dir)
		if err := os.MkdirAll(path, 0755); err != nil {
			return fmt.Errorf("创建目录失败: %s: %w", path, err)
		}
	}

	// 创建 .gitkeep 文件
	for _, dir := range dirs {
		gitkeep := filepath.Join(basePath, dir, ".gitkeep")
		if _, err := os.Stat(gitkeep); os.IsNotExist(err) {
			if err := os.WriteFile(gitkeep, []byte(""), 0644); err != nil {
				log.Printf("创建 .gitkeep 失败: %s: %v", dir, err)
			}
		}
	}

	log.Println("存储目录创建完成")
	return nil
}

/**
 * migrateSiteConfig 迁移站点配置
 */
func migrateSiteConfig() error {
	configPath := filepath.Join(sourcePath, "site-config.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("读取站点配置失败: %w", err)
	}

	var siteConfig SiteConfigData
	if err := json.Unmarshal(data, &siteConfig); err != nil {
		return fmt.Errorf("解析站点配置失败: %w", err)
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
		return fmt.Errorf("保存站点配置失败: %w", result.Error)
	}

	log.Printf("站点配置迁移完成: %s", config.SiteName)
	return nil
}

/**
 * migratePosts 迁移博客文章
 */
func migratePosts() error {
	metaPath := filepath.Join(sourcePath, "meta.json")
	data, err := os.ReadFile(metaPath)
	if err != nil {
		return fmt.Errorf("读取 meta.json 失败: %w", err)
	}

	var meta MetaData
	if err := json.Unmarshal(data, &meta); err != nil {
		return fmt.Errorf("解析 meta.json 失败: %w", err)
	}

	count := 0
	for id, entry := range meta.Blogs {
		// 读取文章内容
		contentPath := filepath.Join(sourcePath, id, "index.md")
		content, err := os.ReadFile(contentPath)
		if err != nil {
			log.Printf("解析博客内容失败: %s: %v", id, err)
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
			log.Printf("保存博客失败: %s: %v", id, result.Error)
		} else {
			count++

			// 迁移博客的资产文件
			if err := migratePostAssets(id); err != nil {
				log.Printf("迁移博客资产失败: %s: %v", id, err)
			}
		}
	}

	log.Printf("迁移 %d 篇博客", count)
	return nil
}

/**
 * migratePostAssets 迁移单个博客的资产文件
 * 从 blogs/{postID}/assets/ 迁移文件到统一的持久化文件目录 storage/files/
 * 并创建 file_resources 记录和 post_asset_relations 关联
 */
func migratePostAssets(postID string) error {
	assetsDir := filepath.Join(sourcePath, postID, "assets")

	// 检查 assets 目录是否存在
	if _, err := os.Stat(assetsDir); os.IsNotExist(err) {
		return nil // 没有资产文件，跳过
	}

	entries, err := os.ReadDir(assetsDir)
	if err != nil {
		return fmt.Errorf("读取资产目录失败: %w", err)
	}

	count := 0
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		originalName := entry.Name()
		sourcePath := filepath.Join(assetsDir, originalName)

		// 获取文件信息和扩展名
		info, err := entry.Info()
		if err != nil {
			log.Printf("获取文件信息失败: %s: %v", originalName, err)
			continue
		}

		ext := filepath.Ext(originalName)

		// 生成符合规范的文件ID: {timestamp}-{suffix}-{randomid}
		// suffix 为文件扩展名（不含点）
		extWithoutDot := strings.TrimPrefix(ext, ".")

		// 生成文件ID {tlid-timestamp}-{random}.{ext}
		fileID := fmt.Sprintf("%d-%d.%s", time.Now().UnixMilli(), time.Now().Nanosecond()%1000000, extWithoutDot)

		// 目标路径（统一的持久化文件目录）
		destDir := filepath.Join(storagePath, "files")
		if err := os.MkdirAll(destDir, 0755); err != nil {
			return fmt.Errorf("创建文件目录失败: %w", err)
		}

		destPath := filepath.Join(destDir, fileID)

		// 复制文件
		if err := copyFile(sourcePath, destPath); err != nil {
			log.Printf("复制资产失败: %s: %v", originalName, err)
			continue
		}

		// 检查是否已存在相同的文件资源（通过原始文件名和博客ID）
		var existing models.FileResource
		result := db.DB.Where("original_name = ? AND category = ?", originalName, "blog-asset").Take(&existing)

		if result.Error == nil {
			// 文件资源已存在，只需创建关联关系
			var existingRelation models.PostAssetRelation
			relResult := db.DB.Where("post_id = ? AND file_id = ?", postID, existing.ID).First(&existingRelation)
			if relResult.Error != nil {
				// 创建关联关系
				relation := models.PostAssetRelation{
					PostID:       postID,
					FileID:       existing.ID,
					RelationType: "attachment",
					CreatedAt:    time.Now(),
				}
				if err := db.DB.Create(&relation).Error; err != nil {
					log.Printf("创建资产关系失败: %s: %v", originalName, err)
				}
			}
			count++
			continue
		}

		// 创建文件资源记录
		fileResource := models.FileResource{
			ID:           fileID,
			OriginalName: originalName,
			Extension:    ext,
			MimeType:     getMimeType(originalName),
			Size:         info.Size(),
			Category:     "blog-asset",
			StoragePath:  destPath,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		if err := db.DB.Create(&fileResource).Error; err != nil {
			log.Printf("保存文件资源失败: %s: %v", originalName, err)
			continue
		}

		// 创建博客-资产关联关系
		relation := models.PostAssetRelation{
			PostID:       postID,
			FileID:       fileID,
			RelationType: "attachment",
			DisplayOrder: count,
			CreatedAt:    time.Now(),
		}

		if err := db.DB.Create(&relation).Error; err != nil {
			log.Printf("创建资产关系失败: %s: %v", originalName, err)
			// 清理已创建的文件资源
			db.DB.Delete(&fileResource)
			os.Remove(destPath)
			continue
		}

		count++
	}

	if count > 0 {
		log.Printf(" 博客 %s 迁移 %d 个资产", postID, count)
	}

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
		return fmt.Errorf("读取笔记索引失败: %w", err)
	}

	var noteIndex NoteIndex
	if err := json.Unmarshal(indexData, &noteIndex); err != nil {
		return fmt.Errorf("解析笔记索引失败: %w", err)
	}

	count := 0
	// 遍历每个日期的笔记文件
	for filename := range noteIndex.Files {
		notePath := filepath.Join(notesDir, filename)
		noteData, err := os.ReadFile(notePath)
		if err != nil {
			log.Printf("读取笔记文件失败: %s: %v", filename, err)
			continue
		}

		var notes []NoteData
		if err := json.Unmarshal(noteData, &notes); err != nil {
			log.Printf("解析笔记文件失败: %s: %v", filename, err)
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
				log.Printf("保存笔记失败: %s: %v", noteData.ID, result.Error)
			} else {
				count++
			}
		}
	}

	log.Printf("迁移 %d 篇笔记", count)
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

	log.Printf("迁移 %d 个分类", len(categoryStats))

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

	log.Printf("迁移 %d 个标签", len(tagStats))
	return nil
}

/**
 * copyImages 复制图片文件到统一的持久化文件目录
 */
func copyImages() error {
	imagesSourceDir := filepath.Join(sourcePath, "images")
	imagesDestDir := filepath.Join(storagePath, "files") // 统一存储到 files/ 目录

	if _, err := os.Stat(imagesSourceDir); os.IsNotExist(err) {
		log.Println("没有找到图片目录, 跳过图片迁移")
		return nil
	}

	entries, err := os.ReadDir(imagesSourceDir)
	if err != nil {
		return fmt.Errorf("读取图片目录失败: %w", err)
	}

	count := 0
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		// 获取文件信息
		info, err := entry.Info()
		if err != nil {
			log.Printf("获取文件信息失败: %s: %v", entry.Name(), err)
			continue
		}

		// 解析扩展名
		ext := filepath.Ext(entry.Name())
		extWithoutDot := strings.TrimPrefix(ext, ".")

		// 生成新文件ID（统一命名格式：{tlid-timestamp}-{random}.{ext}）
		fileID := fmt.Sprintf("%d-%d.%s", time.Now().UnixMilli(), time.Now().Nanosecond()%1000000, extWithoutDot)

		// 检查是否已存在（通过原始文件名）
		var existing models.FileResource
		result := db.DB.Where("original_name = ? AND category = ?", entry.Name(), "image").Take(&existing)
		if result.Error == nil {
			log.Printf("图片资源已存在: %s, 跳过", entry.Name())
			count++
			continue
		}

		// 复制文件到新位置（使用新的文件ID，无扩展名）
		sourceFilePath := filepath.Join(imagesSourceDir, entry.Name())
		destPath := filepath.Join(imagesDestDir, fileID)

		if err := copyFile(sourceFilePath, destPath); err != nil {
			log.Printf("复制图片失败: %s: %v", entry.Name(), err)
			continue
		}

		// 保存图片记录到file_resources表
		fileResource := models.FileResource{
			ID:           fileID,
			OriginalName: entry.Name(),
			Extension:    ext,
			MimeType:     getMimeType(entry.Name()),
			Size:         info.Size(),
			Category:     "image",
			StoragePath:  destPath,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		if result := db.DB.Save(&fileResource); result.Error != nil {
			log.Printf("保存图片记录失败: %s: %v", entry.Name(), result.Error)
			continue
		}

		log.Printf("迁移图片: %s -> %s", entry.Name(), fileID)
		count++
	}

	log.Printf("复制 %d 张图片", count)
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
