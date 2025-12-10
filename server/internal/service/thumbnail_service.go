package service

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"time"

	"server/internal/models"
	"server/internal/repository"
	"server/internal/storage"

	"github.com/disintegration/imaging"
)

/**
 * ThumbnailService 缩略图服务
 */
type ThumbnailService struct {
	storage          storage.FileStorage
	fileResourceRepo *repository.FileResourceRepository
	cacheRepo        *repository.ThumbnailCacheRepository
	thumbnailWidth   int
	thumbnailHeight  int
	jpegQuality      int
}

/**
 * NewThumbnailService 创建缩略图服务实例
 * @param storage 文件存储
 * @param fileResourceRepo 文件资源仓库
 */
func NewThumbnailService(storage storage.FileStorage, fileResourceRepo *repository.FileResourceRepository) *ThumbnailService {
	return &ThumbnailService{
		storage:          storage,
		fileResourceRepo: fileResourceRepo,
		cacheRepo:        repository.NewThumbnailCacheRepository(),
		thumbnailWidth:   180,
		thumbnailHeight:  180,
		jpegQuality:      80,
	}
}

/**
 * GenerateThumbnail 生成缩略图
 * @param originalData 原始图片数据
 * @param originalExt 原始图片扩展名（如 ".jpg"）
 * @return 缩略图数据和错误
 */
func (s *ThumbnailService) GenerateThumbnail(originalData []byte, originalExt string) ([]byte, error) {
	return s.GenerateThumbnailWithSize(originalData, originalExt, s.thumbnailWidth, s.thumbnailHeight)
}

/**
 * GenerateThumbnailWithSize 生成指定尺寸的缩略图
 * @param originalData 原始图片数据
 * @param originalExt 原始图片扩展名（如 ".jpg"）
 * @param width 缩略图宽度
 * @param height 缩略图高度
 * @return 缩略图数据和错误
 */
func (s *ThumbnailService) GenerateThumbnailWithSize(originalData []byte, originalExt string, width, height int) ([]byte, error) {
	// 解码图片
	img, _, err := image.Decode(bytes.NewReader(originalData))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	// 生成缩略图（保持宽高比，填充）
	thumbnail := imaging.Fill(img, width, height, imaging.Center, imaging.Lanczos)

	// 编码缩略图
	var buf bytes.Buffer
	switch originalExt {
	case ".png":
		err = png.Encode(&buf, thumbnail)
	default:
		// 默认使用 JPEG
		err = jpeg.Encode(&buf, thumbnail, &jpeg.Options{Quality: s.jpegQuality})
	}

	if err != nil {
		return nil, fmt.Errorf("failed to encode thumbnail: %w", err)
	}

	return buf.Bytes(), nil
}

/**
 * GetCachedThumbnailPath 获取缓存的缩略图路径（用于零拷贝传输）
 * @param sourceFileID 源文件ID
 * @param sourceExt 源文件扩展名
 * @param width 缩略图宽度
 * @param height 缩略图高度
 * @return 缩略图路径和是否命中缓存
 */
func (s *ThumbnailService) GetCachedThumbnailPath(sourceFileID, sourceExt string, width, height int) (string, bool) {
	// 检查缓存
	cache, err := s.cacheRepo.GetCachedThumbnail(sourceFileID, width, height)
	if err != nil || cache == nil {
		return "", false
	}

	// 验证物理文件是否存在
	exists, _ := s.storage.Exists("thumbnails", cache.ThumbnailID)
	if !exists {
		// 缓存记录存在但文件丢失，删除缓存记录
		_ = s.cacheRepo.DeleteCache(cache.ID)
		return "", false
	}

	// 返回文件路径用于零拷贝传输
	return cache.StoragePath, true
}

/**
 * GetOrGenerateThumbnail 获取或生成缩略图（带缓存）
 * @param sourceFileID 源文件ID
 * @param sourceExt 源文件扩展名
 * @param width 缩略图宽度
 * @param height 缩略图高度
 * @return 缩略图数据和错误
 */
func (s *ThumbnailService) GetOrGenerateThumbnail(sourceFileID, sourceExt string, width, height int) ([]byte, error) {
	// 1. 检查缓存
	cache, err := s.cacheRepo.GetCachedThumbnail(sourceFileID, width, height)
	if err == nil && cache != nil {
		// 缓存命中，从存储读取
		data, err := s.storage.Get("thumbnails", cache.ThumbnailID)
		if err == nil {
			return data, nil
		}
		// 缓存文件丢失，删除缓存记录
		_ = s.cacheRepo.DeleteCache(cache.ID)
	}

	// 2. 缓存未命中，读取原始文件
	originalData, err := s.storage.Get("files", sourceFileID)
	if err != nil {
		return nil, fmt.Errorf("failed to get original file: %w", err)
	}

	// 3. 生成缩略图
	thumbnailData, err := s.GenerateThumbnailWithSize(originalData, sourceExt, width, height)
	if err != nil {
		return nil, fmt.Errorf("failed to generate thumbnail: %w", err)
	}

	// 4. 保存缩略图到存储
	thumbnailID := s.cacheRepo.GenerateThumbnailID(sourceFileID, width, height)
	if err := s.storage.Save("thumbnails", thumbnailID, thumbnailData); err != nil {
		// 保存失败，但仍返回生成的缩略图
		return thumbnailData, nil
	}

	// 5. 创建缓存记录
	now := time.Now()
	cacheRecord := &models.ThumbnailCache{
		SourceFileID:   sourceFileID,
		Width:          width,
		Height:         height,
		ThumbnailID:    thumbnailID,
		StoragePath:    s.storage.GetPath("thumbnails", thumbnailID),
		Size:           int64(len(thumbnailData)),
		CreatedAt:      now,
		LastAccessedAt: now,
	}

	if err := s.cacheRepo.CreateThumbnailCache(cacheRecord); err != nil {
		// 缓存记录创建失败，但不影响返回
		// 下次会重新生成
	}

	return thumbnailData, nil
}

/**
 * DeleteThumbnailCachesBySourceFile 删除源文件的所有缓存缩略图
 * @param sourceFileID 源文件ID
 */
func (s *ThumbnailService) DeleteThumbnailCachesBySourceFile(sourceFileID string) error {
	// 1. 查找所有缓存记录
	caches, err := s.cacheRepo.GetCachesBySourceFileID(sourceFileID)
	if err != nil {
		// 如果没有缓存，也不算错误
		return nil
	}

	// 2. 删除缩略图文件
	for _, cache := range caches {
		_ = s.storage.Delete("thumbnails", cache.ThumbnailID)
	}

	// 3. 删除数据库记录
	return s.cacheRepo.DeleteBySourceFileID(sourceFileID)
}

/**
 * CreateThumbnailForImage 为图片创建缩略图
 * @param imageID 图片文件ID
 * @param thumbnailID 缩略图文件ID
 * @param originalExt 原始图片扩展名
 * @return 缩略图文件资源和错误
 */
func (s *ThumbnailService) CreateThumbnailForImage(imageID string, thumbnailID string, originalExt string) (*models.FileResource, error) {
	// 获取原始图片数据（从统一的持久化文件目录）
	imageData, err := s.storage.Get("files", imageID)
	if err != nil {
		return nil, fmt.Errorf("failed to get original image: %w", err)
	}

	// 生成缩略图
	thumbnailData, err := s.GenerateThumbnail(imageData, originalExt)
	if err != nil {
		return nil, fmt.Errorf("failed to generate thumbnail: %w", err)
	}

	// 保存缩略图到存储
	if err := s.storage.Save("thumbnails", thumbnailID, thumbnailData); err != nil {
		return nil, fmt.Errorf("failed to save thumbnail: %w", err)
	}

	// 创建缩略图文件资源记录
	thumbnailResource := &models.FileResource{
		ID:           thumbnailID,
		OriginalName: fmt.Sprintf("thumbnail-%s%s", imageID, originalExt),
		Extension:    originalExt,
		MimeType:     getMimeType(originalExt),
		Size:         int64(len(thumbnailData)),
		Category:     "thumbnail",
		StoragePath:  s.storage.GetPath("thumbnails", thumbnailID),
	}

	if err := s.fileResourceRepo.CreateFileResource(thumbnailResource); err != nil {
		// 清理已保存的缩略图文件
		_ = s.storage.Delete("thumbnails", thumbnailID)
		return nil, fmt.Errorf("failed to create thumbnail resource: %w", err)
	}

	return thumbnailResource, nil
}

/**
 * CleanupExpiredThumbnails 清理过期缩略图缓存
 * @param days 过期天数（例如 30 天）
 * @return 清理数量和错误
 */
func (s *ThumbnailService) CleanupExpiredThumbnails(days int) (int, error) {
	// 1. 获取过期缓存记录
	expiredCaches, err := s.cacheRepo.GetExpiredCaches(days)
	if err != nil {
		return 0, fmt.Errorf("failed to get expired caches: %w", err)
	}

	// 2. 删除物理文件
	cleanedCount := 0
	for _, cache := range expiredCaches {
		if err := s.storage.Delete("thumbnails", cache.ThumbnailID); err == nil {
			cleanedCount++
		}
	}

	// 3. 删除数据库记录
	rowsAffected, err := s.cacheRepo.DeleteExpiredCaches(days)
	if err != nil {
		return cleanedCount, fmt.Errorf("failed to delete expired cache records: %w", err)
	}

	return int(rowsAffected), nil
}

/**
 * getMimeType 根据扩展名获取MIME类型
 */
func getMimeType(ext string) string {
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
