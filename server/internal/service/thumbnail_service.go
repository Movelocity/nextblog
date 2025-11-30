package service

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	
	"github.com/disintegration/imaging"
	"nextblog-server/internal/models"
	"nextblog-server/internal/repository"
	"nextblog-server/internal/storage"
)

/**
 * ThumbnailService 缩略图服务
 */
type ThumbnailService struct {
	storage            storage.FileStorage
	fileResourceRepo   *repository.FileResourceRepository
	thumbnailWidth     int
	thumbnailHeight    int
	jpegQuality        int
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
	// 解码图片
	img, _, err := image.Decode(bytes.NewReader(originalData))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}
	
	// 生成缩略图（保持宽高比，填充）
	thumbnail := imaging.Fill(img, s.thumbnailWidth, s.thumbnailHeight, imaging.Center, imaging.Lanczos)
	
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
 * CreateThumbnailForImage 为图片创建缩略图
 * @param imageID 图片文件ID
 * @param thumbnailID 缩略图文件ID
 * @param originalExt 原始图片扩展名
 * @return 缩略图文件资源和错误
 */
func (s *ThumbnailService) CreateThumbnailForImage(imageID string, thumbnailID string, originalExt string) (*models.FileResource, error) {
	// 获取原始图片数据
	imageData, err := s.storage.Get("images", imageID)
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

