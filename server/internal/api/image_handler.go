package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"nextblog-server/internal/config"
	"nextblog-server/internal/db"
	"nextblog-server/internal/models"
	"nextblog-server/internal/repository"
	"nextblog-server/internal/service"
	"nextblog-server/internal/storage"

	"github.com/gin-gonic/gin"
)

type ImageHandler struct {
	storage            storage.FileStorage
	thumbnailService   *service.ThumbnailService
	fileResourceRepo   *repository.FileResourceRepository
}

func NewImageHandler(storage storage.FileStorage) *ImageHandler {
	fileResourceRepo := repository.NewFileResourceRepository()
	return &ImageHandler{
		storage:          storage,
		thumbnailService: service.NewThumbnailService(storage, fileResourceRepo),
		fileResourceRepo: fileResourceRepo,
	}
}

/**
 * UploadImage 上传图片
 * POST /api/images/upload
 */
func (h *ImageHandler) UploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// 检查文件大小
	if file.Size > config.AppConfig.UploadMaxSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds limit"})
		return
	}

	// 检查文件类型
	ext := filepath.Ext(file.Filename)
	allowedExts := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
	}
	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type"})
		return
	}

	// 生成文件名（时间戳 + 随机数）
	filename := fmt.Sprintf("%d-%d%s", time.Now().UnixMilli(), time.Now().Nanosecond()%1000000, ext)
	
	// 保存文件（使用旧方式保持兼容性）
	imagePath := filepath.Join(config.AppConfig.StoragePath, "images", filename)
	
	// 确保目录存在
	imageDir := filepath.Dir(imagePath)
	if err := os.MkdirAll(imageDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
		return
	}
	
	if err := c.SaveUploadedFile(file, imagePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// 保存到数据库
	image := models.Image{
		Filename:  filename,
		Path:      imagePath,
		Size:      file.Size,
		MimeType:  getMimeTypeFromExt(ext),
		CreatedAt: time.Now(),
	}

	// 检查是否需要生成缩略图
	generateThumbnail := c.DefaultQuery("generateThumbnail", "false")
	if generateThumbnail == "true" {
		// 生成文件ID用于缩略图
		extWithoutDot := ext
		if len(ext) > 0 && ext[0] == '.' {
			extWithoutDot = ext[1:]
		}
		thumbnailID := fmt.Sprintf("%d-%s-%d-thumb", time.Now().UnixMilli(), extWithoutDot, time.Now().Nanosecond()%1000000)
		
		// 读取图片数据
		fileReader, err := os.Open(imagePath)
		if err == nil {
			fileData, err := io.ReadAll(fileReader)
			fileReader.Close()
			
			if err == nil {
				// 生成并保存缩略图
				thumbnailData, err := h.thumbnailService.GenerateThumbnail(fileData, ext)
				if err == nil {
					if err := h.storage.Save("thumbnails", thumbnailID, thumbnailData); err == nil {
						// 创建缩略图文件资源记录
						thumbnailResource := &models.FileResource{
							ID:           thumbnailID,
							OriginalName: fmt.Sprintf("thumbnail-%s%s", filename, ext),
							Extension:    ext,
							MimeType:     getMimeTypeFromExt(ext),
							Size:         int64(len(thumbnailData)),
							Category:     "thumbnail",
							StoragePath:  h.storage.GetPath("thumbnails", thumbnailID),
							CreatedAt:    time.Now(),
							UpdatedAt:    time.Now(),
						}
						
						if err := h.fileResourceRepo.CreateFileResource(thumbnailResource); err == nil {
							image.ThumbnailID = thumbnailID
						}
					}
				}
			}
		}
	}

	if err := db.DB.Create(&image).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image record"})
		return
	}

	response := gin.H{
		"filename": filename,
		"url":      fmt.Sprintf("/api/images/%s", filename),
		"size":     file.Size,
	}
	
	if image.ThumbnailID != "" {
		response["thumbnail"] = gin.H{
			"id":  image.ThumbnailID,
			"url": fmt.Sprintf("/api/images/%s/thumbnail", filename),
		}
	}

	c.JSON(http.StatusOK, response)
}

/**
 * GetImage 获取图片
 * GET /api/images/:filename
 */
func (h *ImageHandler) GetImage(c *gin.Context) {
	filename := c.Param("filename")
	
	imagePath := filepath.Join(config.AppConfig.StoragePath, "images", filename)
	
	// 检查文件是否存在
	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	c.File(imagePath)
}

/**
 * GetThumbnail 获取缩略图
 * GET /api/images/:filename/thumbnail
 */
func (h *ImageHandler) GetThumbnail(c *gin.Context) {
	filename := c.Param("filename")
	
	// 从数据库获取图片记录
	var image models.Image
	if err := db.DB.Where("filename = ?", filename).First(&image).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}
	
	// 检查是否有缩略图
	if image.ThumbnailID == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thumbnail not found"})
		return
	}
	
	// 获取缩略图资源信息
	resource, err := h.fileResourceRepo.GetFileResource(image.ThumbnailID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thumbnail resource not found"})
		return
	}
	
	// 获取缩略图数据
	thumbnailData, err := h.storage.Get("thumbnails", image.ThumbnailID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thumbnail file not found"})
		return
	}
	
	// 返回缩略图
	c.Header("Content-Type", resource.MimeType)
	c.Data(http.StatusOK, resource.MimeType, thumbnailData)
}

/**
 * DeleteImage 删除图片
 * DELETE /api/images/:filename
 */
func (h *ImageHandler) DeleteImage(c *gin.Context) {
	filename := c.Param("filename")

	// 从数据库获取图片记录
	var image models.Image
	if err := db.DB.Where("filename = ?", filename).First(&image).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}
	
	// 删除缩略图（如果存在）
	if image.ThumbnailID != "" {
		_ = h.storage.Delete("thumbnails", image.ThumbnailID)
		_ = h.fileResourceRepo.DeleteFileResource(image.ThumbnailID)
	}

	// 从数据库删除记录
	if err := db.DB.Delete(&image).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image record"})
		return
	}

	// 删除文件
	imagePath := filepath.Join(config.AppConfig.StoragePath, "images", filename)
	if err := os.Remove(imagePath); err != nil && !os.IsNotExist(err) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}

/**
 * ListImages 获取图片列表
 * GET /api/images
 */
func (h *ImageHandler) ListImages(c *gin.Context) {
	var images []models.Image
	if err := db.DB.Order("created_at DESC").Find(&images).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, images)
}

/**
 * getMimeTypeFromExt 根据文件扩展名获取 MIME 类型
 */
func getMimeTypeFromExt(ext string) string {
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
