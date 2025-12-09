package api

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"time"

	"server/internal/config"
	"server/internal/db"
	"server/internal/models"
	"server/internal/repository"
	"server/internal/service"
	"server/internal/storage"

	"github.com/gin-gonic/gin"
)

type ImageHandler struct {
	storage          storage.FileStorage
	thumbnailService *service.ThumbnailService
	fileResourceRepo *repository.FileResourceRepository
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

	// 生成文件ID（统一命名格式：{timestamp}-{ext}-{random}，带扩展名）
	extWithoutDot := ext
	if len(ext) > 0 && ext[0] == '.' {
		extWithoutDot = ext[1:]
	}
	fileID := fmt.Sprintf("%d-%s-%d%s", time.Now().UnixMilli(), extWithoutDot, time.Now().Nanosecond()%1000000, ext)

	// 使用 FileStorage 接口保存文件
	fileReader, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer fileReader.Close()

	fileData, err := io.ReadAll(fileReader)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	// 保存文件到统一的持久化文件目录
	if err := h.storage.Save("files", fileID, fileData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// 保存到数据库（使用FileResource）
	fileResource := models.FileResource{
		ID:           fileID,
		OriginalName: file.Filename,
		Extension:    ext,
		MimeType:     getMimeTypeFromExt(ext),
		Size:         file.Size,
		Category:     "image",
		StoragePath:  h.storage.GetPath("files", fileID),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.fileResourceRepo.CreateFileResource(&fileResource); err != nil {
		// 清理已保存的文件
		_ = h.storage.Delete("files", fileID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file resource record"})
		return
	}

	response := gin.H{
		"id":       fileResource.ID,
		"filename": fileResource.ID, // fileID 已带扩展名
		"url":      fmt.Sprintf("/api/images/%s", fileResource.ID),
		"size":     file.Size,
	}

	c.JSON(http.StatusOK, response)
}

/**
 * GetImage 获取图片
 * GET /api/images/:filename
 * 支持URL参数:
 * - thumbnail=true: 返回缩略图
 * - size=<width>: 指定缩略图宽度（默认180）
 * - width=<width>&height=<height>: 指定缩略图宽高
 */
func (h *ImageHandler) GetImage(c *gin.Context) {
	fileID := c.Param("filename") // 参数名保持为filename以兼容前端

	// 从数据库查询文件资源
	fileResource, err := h.fileResourceRepo.GetFileResource(fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	// 检查是否请求缩略图
	thumbnailParam := c.DefaultQuery("thumbnail", "false")
	if thumbnailParam == "true" {
		// 获取缩略图尺寸参数
		width := 180  // 默认宽度
		height := 180 // 默认高度

		// 支持 size 参数（正方形缩略图）
		if sizeParam := c.Query("size"); sizeParam != "" {
			if size, err := parsePositiveInt(sizeParam); err == nil && size > 0 && size <= 2000 {
				width = size
				height = size
			}
		}

		// 支持独立的 width 和 height 参数
		if widthParam := c.Query("width"); widthParam != "" {
			if w, err := parsePositiveInt(widthParam); err == nil && w > 0 && w <= 2000 {
				width = w
			}
		}
		if heightParam := c.Query("height"); heightParam != "" {
			if h, err := parsePositiveInt(heightParam); err == nil && h > 0 && h <= 2000 {
				height = h
			}
		}

		// 生成或获取缓存的缩略图
		thumbnailData, err := h.thumbnailService.GetOrGenerateThumbnail(fileID, fileResource.Extension, width, height)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate thumbnail"})
			return
		}

		// 返回缩略图
		c.Header("Content-Type", getMimeTypeFromExt(fileResource.Extension))
		c.Header("Cache-Control", "public, max-age=86400") // 缓存1天
		c.Data(http.StatusOK, getMimeTypeFromExt(fileResource.Extension), thumbnailData)
		return
	}

	// 返回原始图片
	c.File(fileResource.StoragePath)
}

/**
 * DeleteImage 删除图片
 * DELETE /api/images/:filename
 */
func (h *ImageHandler) DeleteImage(c *gin.Context) {
	fileID := c.Param("filename") // 参数名保持为filename以兼容前端

	// 从数据库获取图片记录
	fileResource, err := h.fileResourceRepo.GetFileResource(fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	// 先删除物理文件（从统一的持久化文件目录）
	if err := h.storage.Delete("files", fileResource.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image file"})
		return
	}

	// 删除所有缓存的缩略图
	_ = h.thumbnailService.DeleteThumbnailCachesBySourceFile(fileID)

	// 最后删除数据库记录
	if err := h.fileResourceRepo.DeleteFileResource(fileResource.ID); err != nil {
		// 数据库删除失败，但文件已删，记录警告日志
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}

/**
 * ListImages 获取图片列表
 * GET /api/images
 */
func (h *ImageHandler) ListImages(c *gin.Context) {
	var fileResources []models.FileResource
	if err := db.DB.Where("category = ?", "image").Order("created_at DESC").Find(&fileResources).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 转换为兼容的响应格式
	var response []map[string]interface{}
	for _, fr := range fileResources {
		item := map[string]interface{}{
			"id":           fr.ID,
			"filename":     fr.ID, // fileID 已带扩展名
			"originalName": fr.OriginalName,
			"size":         fr.Size,
			"mimeType":     fr.MimeType,
			"createdAt":    fr.CreatedAt,
			"url":          fmt.Sprintf("/api/images/%s", fr.ID),
		}
		response = append(response, item)
	}

	c.JSON(http.StatusOK, response)
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

/**
 * parsePositiveInt 解析正整数字符串
 */
func parsePositiveInt(s string) (int, error) {
	var value int
	_, err := fmt.Sscanf(s, "%d", &value)
	return value, err
}
