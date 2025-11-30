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

	// 生成文件ID（统一命名格式：{timestamp}-{ext}-{random}，无扩展名）
	extWithoutDot := ext
	if len(ext) > 0 && ext[0] == '.' {
		extWithoutDot = ext[1:]
	}
	fileID := fmt.Sprintf("%d-%s-%d", time.Now().UnixMilli(), extWithoutDot, time.Now().Nanosecond()%1000000)
	filename := fileID // 物理文件名不含扩展名
	
	// 保存文件到统一的持久化文件目录
	imagePath := filepath.Join(config.AppConfig.StoragePath, "files", filename)
	
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

	// 保存到数据库（使用FileResource）
	fileResource := models.FileResource{
		ID:           fileID,
		OriginalName: file.Filename,
		Extension:    ext,
		MimeType:     getMimeTypeFromExt(ext),
		Size:         file.Size,
		Category:     "image",
		StoragePath:  imagePath,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// 检查是否需要生成缩略图
	generateThumbnail := c.DefaultQuery("generateThumbnail", "false")
	if generateThumbnail == "true" {
		// 生成缩略图ID（统一命名格式：无扩展名）
		thumbnailID := fmt.Sprintf("%d-%s-%d", time.Now().UnixMilli(), extWithoutDot, time.Now().Nanosecond()%1000000)
		
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
							fileResource.ThumbnailID = thumbnailID
						}
					}
				}
			}
		}
	}

	if err := h.fileResourceRepo.CreateFileResource(&fileResource); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file resource record"})
		return
	}

	response := gin.H{
		"id":       fileResource.ID,
		"filename": fileResource.ID + fileResource.Extension, // 完整文件名（带扩展名）
		"url":      fmt.Sprintf("/api/images/%s", fileResource.ID),
		"size":     file.Size,
	}
	
	if fileResource.ThumbnailID != "" {
		response["thumbnail"] = gin.H{
			"id":  fileResource.ThumbnailID,
			"url": fmt.Sprintf("/api/images/%s/thumbnail", fileResource.ID),
		}
	}

	c.JSON(http.StatusOK, response)
}

/**
 * GetImage 获取图片
 * GET /api/images/:filename
 */
func (h *ImageHandler) GetImage(c *gin.Context) {
	fileID := c.Param("filename") // 参数名保持为filename以兼容前端
	
	// 从数据库查询文件资源
	fileResource, err := h.fileResourceRepo.GetFileResource(fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}
	
	// 使用数据库中的storage_path
	c.File(fileResource.StoragePath)
}

/**
 * GetThumbnail 获取缩略图
 * GET /api/images/:filename/thumbnail
 */
func (h *ImageHandler) GetThumbnail(c *gin.Context) {
	fileID := c.Param("filename") // 参数名保持为filename以兼容前端
	
	// 从数据库获取图片记录
	fileResource, err := h.fileResourceRepo.GetFileResource(fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}
	
	// 检查是否有缩略图
	if fileResource.ThumbnailID == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thumbnail not found"})
		return
	}
	
	// 获取缩略图资源信息
	thumbnailResource, err := h.fileResourceRepo.GetFileResource(fileResource.ThumbnailID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thumbnail resource not found"})
		return
	}
	
	// 获取缩略图数据
	thumbnailData, err := h.storage.Get("thumbnails", fileResource.ThumbnailID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thumbnail file not found"})
		return
	}
	
	// 返回缩略图
	c.Header("Content-Type", thumbnailResource.MimeType)
	c.Data(http.StatusOK, thumbnailResource.MimeType, thumbnailData)
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
	
	// 删除缩略图（如果存在）
	if fileResource.ThumbnailID != "" {
		_ = h.storage.Delete("thumbnails", fileResource.ThumbnailID)
		_ = h.fileResourceRepo.DeleteFileResource(fileResource.ThumbnailID)
	}

	// 从数据库删除记录
	if err := h.fileResourceRepo.DeleteFileResource(fileResource.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image record"})
		return
	}

	// 删除文件（从统一的持久化文件目录）
	if err := h.storage.Delete("files", fileResource.ID); err != nil {
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
	var fileResources []models.FileResource
	if err := db.DB.Where("category = ?", "image").Order("created_at DESC").Find(&fileResources).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 转换为兼容的响应格式
	var response []map[string]interface{}
	for _, fr := range fileResources {
		item := map[string]interface{}{
			"id":          fr.ID,
			"filename":    fr.ID + fr.Extension, // 重建完整文件名
			"originalName": fr.OriginalName,
			"size":        fr.Size,
			"mimeType":    fr.MimeType,
			"createdAt":   fr.CreatedAt,
			"url":         fmt.Sprintf("/api/images/%s", fr.ID+fr.Extension),
		}
		if fr.ThumbnailID != "" {
			item["thumbnailId"] = fr.ThumbnailID
			item["thumbnailUrl"] = fmt.Sprintf("/api/images/%s/thumbnail", fr.ID+fr.Extension)
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
