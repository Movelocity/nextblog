package api

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"time"

	"server/internal/config"
	"server/internal/models"
	"server/internal/repository"
	"server/internal/service"
	"server/internal/storage"

	"strconv"

	"github.com/gin-gonic/gin"
)

/**
 * AssetHandler 博客资产处理器
 */
type AssetHandler struct {
	storage          storage.FileStorage
	fileResourceRepo *repository.FileResourceRepository
	postAssetRepo    *repository.PostAssetRepository
	thumbnailService *service.ThumbnailService
}

/**
 * NewAssetHandler 创建博客资产处理器实例
 */
func NewAssetHandler(storage storage.FileStorage) *AssetHandler {
	fileResourceRepo := repository.NewFileResourceRepository()
	return &AssetHandler{
		storage:          storage,
		fileResourceRepo: fileResourceRepo,
		postAssetRepo:    repository.NewPostAssetRepository(),
		thumbnailService: service.NewThumbnailService(storage, fileResourceRepo),
	}
}

/**
 * ListAssets 列出博客资产
 * GET /api/assets?postID=xxx&page=xxx&limit=xxx
 * 支持分页和博客参数可选查询
 */
func (h *AssetHandler) ListAssets(c *gin.Context) {
	postID := c.Query("postID")

	page := c.Query("page")
	limit := c.Query("limit")

	if page == "" {
		page = "1"
	}
	if limit == "" {
		limit = "10"
	}

	pageInt, err := strconv.Atoi(page)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page parameter"})
		return
	}
	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	// 计算偏移量
	offset := (pageInt - 1) * limitInt

	var resources []*models.FileResource
	var total int64

	// 提取文件ID列表
	var fileIDs []string

	if postID != "" {
		// 获取博客-资产关联关系
		relations, err := h.postAssetRepo.GetRelationsByPostID(postID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		for _, rel := range relations {
			fileIDs = append(fileIDs, rel.FileID)
		}

		if len(fileIDs) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"data":  []interface{}{},
				"total": 0,
				"page":  pageInt,
				"limit": limitInt,
			})
			return
		}

		// 统计总数
		total, err = h.fileResourceRepo.CountFileResourcesByIDs(fileIDs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// 批量获取文件资源信息（带分页）
		resources, err = h.fileResourceRepo.GetFileResourcesByIDsWithPagination(fileIDs, offset, limitInt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

	} else {
		// 查询所有文件资源
		// 统计总数
		total, err = h.fileResourceRepo.CountAllFileResources()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// 获取所有文件资源（带分页）
		resources, err = h.fileResourceRepo.GetAllFileResourcesWithPagination(offset, limitInt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// 构建响应
	var assets []gin.H
	for _, resource := range resources {
		assets = append(assets, gin.H{
			"id":        resource.ID,
			"filename":  resource.OriginalName,
			"size":      resource.Size,
			"mimeType":  resource.MimeType,
			"url":       fmt.Sprintf("/api/assets/%s", resource.ID),
			"createdAt": resource.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  assets,
		"total": total,
		"page":  pageInt,
		"limit": limitInt,
	})
}

/**
 * UploadAsset 上传博客资产
 * POST /api/assets?postID=xxx
 */
func (h *AssetHandler) UploadAsset(c *gin.Context) {

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

	// 获取文件扩展名
	ext := filepath.Ext(file.Filename)

	// 生成文件ID（时间戳-扩展名（无点）-随机数，带扩展名）
	extWithoutDot := ext
	if len(ext) > 0 && ext[0] == '.' {
		extWithoutDot = ext[1:]
	}
	fileID := fmt.Sprintf("%d-%s-%d%s", time.Now().UnixMilli(), extWithoutDot, time.Now().Nanosecond()%1000000, ext)

	// 读取文件数据
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

	// 创建文件资源记录
	resource := &models.FileResource{
		ID:           fileID,
		OriginalName: file.Filename,
		Extension:    ext,
		MimeType:     file.Header.Get("Content-Type"),
		Size:         file.Size,
		Category:     "blog-asset",
		StoragePath:  h.storage.GetPath("files", fileID),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.fileResourceRepo.CreateFileResource(resource); err != nil {
		// 清理已保存的文件
		_ = h.storage.Delete("files", fileID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file resource"})
		return
	}

	postID := c.Query("postID")
	// 如果 postID 不为空，则创建博客-资产关联关系
	if postID != "" {
		// 创建博客-资产关联关系
		relation := &models.PostAssetRelation{
			PostID:       postID,
			FileID:       fileID,
			RelationType: "attachment",
			CreatedAt:    time.Now(),
		}
		if err := h.postAssetRepo.CreateRelation(relation); err != nil {
			// 清理已创建的资源
			_ = h.fileResourceRepo.DeleteFileResource(fileID)
			_ = h.storage.Delete("files", fileID)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create asset relation"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       fileID,
		"filename": file.Filename,
		"url":      fmt.Sprintf("/api/assets/%s", fileID),
		"size":     file.Size,
	})
}

/**
 * GetAsset 获取单个资产
 * GET /api/assets/:fileId
 * 支持URL参数:
 * - thumbnail=true: 返回缩略图（仅支持图片格式）
 * - size=<width>: 指定缩略图宽度（默认180）
 * - width=<width>&height=<height>: 指定缩略图宽高
 */
func (h *AssetHandler) GetAsset(c *gin.Context) {
	fileID := c.Param("fileId")

	// 获取文件资源信息
	resource, err := h.fileResourceRepo.GetFileResource(fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// 检查是否请求缩略图
	thumbnailParam := c.DefaultQuery("thumbnail", "false")
	if thumbnailParam == "true" && isImageFile(resource.Extension) {
		// 获取缩略图尺寸参数
		width := 180  // 默认宽度
		height := 180 // 默认高度

		// 支持 size 参数（正方形缩略图）
		if sizeParam := c.Query("size"); sizeParam != "" {
			if size, err := strconv.Atoi(sizeParam); err == nil && size > 0 && size <= 2000 {
				width = size
				height = size
			}
		}

		// 支持独立的 width 和 height 参数
		if widthParam := c.Query("width"); widthParam != "" {
			if w, err := strconv.Atoi(widthParam); err == nil && w > 0 && w <= 2000 {
				width = w
			}
		}
		if heightParam := c.Query("height"); heightParam != "" {
			if h, err := strconv.Atoi(heightParam); err == nil && h > 0 && h <= 2000 {
				height = h
			}
		}

		// 优先尝试获取缓存的缩略图路径（零拷贝传输）
		thumbnailPath, isCached := h.thumbnailService.GetCachedThumbnailPath(fileID, resource.Extension, width, height)
		if isCached {
			// 缓存命中 - 使用零拷贝传输
			c.Header("Content-Type", resource.MimeType)
			c.Header("Cache-Control", "public, max-age=86400") // 缓存1天
			c.File(thumbnailPath)
			return
		}

		// 缓存未命中 - 生成缩略图（必须使用内存数据）
		thumbnailData, err := h.thumbnailService.GetOrGenerateThumbnail(fileID, resource.Extension, width, height)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate thumbnail"})
			return
		}

		// 返回生成的缩略图
		c.Header("Content-Type", resource.MimeType)
		c.Header("Cache-Control", "public, max-age=86400") // 缓存1天
		c.Data(http.StatusOK, resource.MimeType, thumbnailData)
		return
	}

	// 设置响应头
	c.Header("Content-Type", resource.MimeType)
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", resource.OriginalName))

	// 零拷贝传输文件（使用 sendfile 系统调用）
	c.File(resource.StoragePath)
}

/**
 * DeleteAsset 删除资产
 * DELETE /api/assets?postID=xxx&fileID=xxx
 */
func (h *AssetHandler) DeleteAsset(c *gin.Context) {

	fileID := c.Query("fileID")

	if fileID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "fileID is required"})
		return
	}

	postID := c.Query("postID")
	if postID != "" {
		// 删除关联关系
		if err := h.postAssetRepo.DeleteRelation(postID, fileID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete relation"})
			return
		}
	}

	// 检查文件是否还有其他关联
	count, err := h.postAssetRepo.CountRelationsByFileID(fileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 如果没有其他关联，先删除物理文件，再删除数据库记录（从统一的持久化文件目录）
	if count == 0 {
		// 删除物理文件
		if err := h.storage.Delete("files", fileID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
			return
		}
		// 删除数据库记录
		if err := h.fileResourceRepo.DeleteFileResource(fileID); err != nil {
			// 数据库删除失败，但文件已删，记录警告日志
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file resource"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Asset deleted successfully"})
}

/**
 * isImageFile 检查文件是否为图片格式
 */
func isImageFile(ext string) bool {
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp":
		return true
	default:
		return false
	}
}
