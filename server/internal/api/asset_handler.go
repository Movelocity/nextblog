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
}

/**
 * NewAssetHandler 创建博客资产处理器实例
 */
func NewAssetHandler(storage storage.FileStorage) *AssetHandler {
	return &AssetHandler{
		storage:          storage,
		fileResourceRepo: repository.NewFileResourceRepository(),
		postAssetRepo:    repository.NewPostAssetRepository(),
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

	// 生成文件ID（时间戳-扩展名（无点）-随机数）
	extWithoutDot := ext
	if len(ext) > 0 && ext[0] == '.' {
		extWithoutDot = ext[1:]
	}
	fileID := fmt.Sprintf("%d-%s-%d", time.Now().UnixMilli(), extWithoutDot, time.Now().Nanosecond()%1000000)

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
 */
func (h *AssetHandler) GetAsset(c *gin.Context) {
	fileID := c.Param("fileId")

	// 获取文件资源信息
	resource, err := h.fileResourceRepo.GetFileResource(fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// 获取文件数据（从统一的持久化文件目录）
	fileData, err := h.storage.Get("files", fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found in storage"})
		return
	}

	// 设置响应头
	c.Header("Content-Type", resource.MimeType)
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", resource.OriginalName))
	c.Data(http.StatusOK, resource.MimeType, fileData)
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

	// 如果没有其他关联，删除文件和记录（从统一的持久化文件目录）
	if count == 0 {
		_ = h.storage.Delete("files", fileID)
		_ = h.fileResourceRepo.DeleteFileResource(fileID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Asset deleted successfully"})
}
