package api

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"nextblog-server/internal/config"
	"nextblog-server/internal/db"
	"nextblog-server/internal/models"

	"github.com/gin-gonic/gin"
)

type ImageHandler struct{}

func NewImageHandler() *ImageHandler {
	return &ImageHandler{}
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
	
	// 保存文件
	imagePath := filepath.Join(config.AppConfig.StoragePath, "images", filename)
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

	if err := db.DB.Create(&image).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"filename": filename,
		"url":      fmt.Sprintf("/api/images/%s", filename),
		"size":     file.Size,
	})
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
 * DeleteImage 删除图片
 * DELETE /api/images/:filename
 */
func (h *ImageHandler) DeleteImage(c *gin.Context) {
	filename := c.Param("filename")

	// 从数据库删除记录
	if err := db.DB.Where("filename = ?", filename).Delete(&models.Image{}).Error; err != nil {
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

