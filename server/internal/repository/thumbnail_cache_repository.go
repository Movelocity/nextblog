package repository

import (
	"fmt"
	"time"

	"server/internal/db"
	"server/internal/models"
)

/**
 * ThumbnailCacheRepository 缩略图缓存仓库
 */
type ThumbnailCacheRepository struct{}

/**
 * NewThumbnailCacheRepository 创建缩略图缓存仓库实例
 */
func NewThumbnailCacheRepository() *ThumbnailCacheRepository {
	return &ThumbnailCacheRepository{}
}

/**
 * GetCachedThumbnail 获取缓存的缩略图
 * @param sourceFileID 源文件ID
 * @param width 宽度
 * @param height 高度
 * @return 缓存记录，如果不存在返回nil
 */
func (r *ThumbnailCacheRepository) GetCachedThumbnail(sourceFileID string, width, height int) (*models.ThumbnailCache, error) {
	var cache models.ThumbnailCache
	err := db.DB.Where("source_file_id = ? AND width = ? AND height = ?", sourceFileID, width, height).First(&cache).Error
	if err != nil {
		return nil, err
	}

	// 更新最后访问时间
	_ = r.UpdateLastAccessed(cache.ID)

	return &cache, nil
}

/**
 * CreateThumbnailCache 创建缩略图缓存记录
 * @param cache 缓存记录
 */
func (r *ThumbnailCacheRepository) CreateThumbnailCache(cache *models.ThumbnailCache) error {
	return db.DB.Create(cache).Error
}

/**
 * UpdateLastAccessed 更新最后访问时间
 * @param id 缓存记录ID
 */
func (r *ThumbnailCacheRepository) UpdateLastAccessed(id int64) error {
	return db.DB.Model(&models.ThumbnailCache{}).Where("id = ?", id).Update("last_accessed_at", time.Now()).Error
}

/**
 * DeleteBySourceFileID 删除指定源文件的所有缓存
 * @param sourceFileID 源文件ID
 */
func (r *ThumbnailCacheRepository) DeleteBySourceFileID(sourceFileID string) error {
	return db.DB.Where("source_file_id = ?", sourceFileID).Delete(&models.ThumbnailCache{}).Error
}

/**
 * GetCachesBySourceFileID 获取指定源文件的所有缓存
 * @param sourceFileID 源文件ID
 */
func (r *ThumbnailCacheRepository) GetCachesBySourceFileID(sourceFileID string) ([]*models.ThumbnailCache, error) {
	var caches []*models.ThumbnailCache
	err := db.DB.Where("source_file_id = ?", sourceFileID).Find(&caches).Error
	return caches, err
}

/**
 * DeleteByThumbnailID 删除指定缩略图缓存
 * @param thumbnailID 缩略图ID
 */
func (r *ThumbnailCacheRepository) DeleteByThumbnailID(thumbnailID string) error {
	return db.DB.Where("thumbnail_id = ?", thumbnailID).Delete(&models.ThumbnailCache{}).Error
}

/**
 * GetOldestCaches 获取最旧的缓存记录（用于LRU清理）
 * @param limit 数量限制
 */
func (r *ThumbnailCacheRepository) GetOldestCaches(limit int) ([]*models.ThumbnailCache, error) {
	var caches []*models.ThumbnailCache
	err := db.DB.Order("last_accessed_at ASC").Limit(limit).Find(&caches).Error
	return caches, err
}

/**
 * CountCaches 统计缓存数量
 */
func (r *ThumbnailCacheRepository) CountCaches() (int64, error) {
	var count int64
	err := db.DB.Model(&models.ThumbnailCache{}).Count(&count).Error
	return count, err
}

/**
 * GetTotalCacheSize 获取缓存总大小
 */
func (r *ThumbnailCacheRepository) GetTotalCacheSize() (int64, error) {
	var result struct {
		TotalSize int64
	}
	err := db.DB.Model(&models.ThumbnailCache{}).Select("COALESCE(SUM(size), 0) as total_size").Scan(&result).Error
	if err != nil {
		return 0, err
	}
	return result.TotalSize, nil
}

/**
 * DeleteCache 删除指定缓存记录
 * @param id 缓存记录ID
 */
func (r *ThumbnailCacheRepository) DeleteCache(id int64) error {
	return db.DB.Delete(&models.ThumbnailCache{}, id).Error
}

/**
 * GetCacheByThumbnailID 根据缩略图ID获取缓存记录
 * @param thumbnailID 缩略图ID
 */
func (r *ThumbnailCacheRepository) GetCacheByThumbnailID(thumbnailID string) (*models.ThumbnailCache, error) {
	var cache models.ThumbnailCache
	err := db.DB.Where("thumbnail_id = ?", thumbnailID).First(&cache).Error
	if err != nil {
		return nil, err
	}
	return &cache, nil
}

/**
 * IsCacheExist 检查缓存是否存在
 * @param sourceFileID 源文件ID
 * @param width 宽度
 * @param height 高度
 */
func (r *ThumbnailCacheRepository) IsCacheExist(sourceFileID string, width, height int) (bool, error) {
	var count int64
	err := db.DB.Model(&models.ThumbnailCache{}).
		Where("source_file_id = ? AND width = ? AND height = ?", sourceFileID, width, height).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

/**
 * GetExpiredCaches 获取过期缓存记录（超过指定天数未访问）
 * @param days 天数（例如 30 天）
 */
func (r *ThumbnailCacheRepository) GetExpiredCaches(days int) ([]*models.ThumbnailCache, error) {
	var caches []*models.ThumbnailCache
	expiryTime := time.Now().AddDate(0, 0, -days)
	err := db.DB.Where("last_accessed_at < ?", expiryTime).Find(&caches).Error
	return caches, err
}

/**
 * DeleteExpiredCaches 删除过期缓存记录
 * @param days 天数（例如 30 天）
 */
func (r *ThumbnailCacheRepository) DeleteExpiredCaches(days int) (int64, error) {
	expiryTime := time.Now().AddDate(0, 0, -days)
	result := db.DB.Where("last_accessed_at < ?", expiryTime).Delete(&models.ThumbnailCache{})
	return result.RowsAffected, result.Error
}

/**
 * GenerateThumbnailID 生成缩略图ID（带扩展名）
 * @param sourceFileID 源文件ID（带扩展名）
 * @param width 宽度
 * @param height 高度
 */
func (r *ThumbnailCacheRepository) GenerateThumbnailID(sourceFileID string, width, height int) string {
	// 提取源文件的扩展名
	ext := ""
	for i := len(sourceFileID) - 1; i >= 0; i-- {
		if sourceFileID[i] == '.' {
			ext = sourceFileID[i:]
			break
		}
	}
	// 格式：sourceFileID_widthxheight（保留扩展名）
	if ext != "" {
		// 去除源文件扩展名，添加尺寸，再加回扩展名
		baseID := sourceFileID[:len(sourceFileID)-len(ext)]
		return fmt.Sprintf("%s_%dx%d%s", baseID, width, height, ext)
	}
	return fmt.Sprintf("%s_%dx%d", sourceFileID, width, height)
}
