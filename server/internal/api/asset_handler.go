package api

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"time"

	"nextblog-server/internal/config"
	"nextblog-server/internal/models"
	"nextblog-server/internal/repository"
	"nextblog-server/internal/storage"

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
 * GET /api/posts/:id/assets
 */
func (h *AssetHandler) ListAssets(c *gin.Context) {
	postID := c.Param("id")

	// 获取博客-资产关联关系
	relations, err := h.postAssetRepo.GetRelationsByPostID(postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 提取文件ID列表
	var fileIDs []string
	for _, rel := range relations {
		fileIDs = append(fileIDs, rel.FileID)
	}

	if len(fileIDs) == 0 {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}

	// 批量获取文件资源信息
	resources, err := h.fileResourceRepo.GetFileResourcesByIDs(fileIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 构建响应
	var assets []gin.H
	for _, resource := range resources {
		assets = append(assets, gin.H{
			"id":        resource.ID,
			"filename":  resource.OriginalName,
			"size":      resource.Size,
			"mimeType":  resource.MimeType,
			"url":       fmt.Sprintf("/api/posts/%s/assets/%s", postID, resource.ID),
			"createdAt": resource.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, assets)
}

/**
 * UploadAsset 上传博客资产
 * POST /api/posts/:id/assets
 */
func (h *AssetHandler) UploadAsset(c *gin.Context) {
	postID := c.Param("id")

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

	// 保存文件到存储
	if err := h.storage.Save("blog-assets", fileID, fileData); err != nil {
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
		StoragePath:  h.storage.GetPath("blog-assets", fileID),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.fileResourceRepo.CreateFileResource(resource); err != nil {
		// 清理已保存的文件
		_ = h.storage.Delete("blog-assets", fileID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file resource"})
		return
	}

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
		_ = h.storage.Delete("blog-assets", fileID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create asset relation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       fileID,
		"filename": file.Filename,
		"url":      fmt.Sprintf("/api/posts/%s/assets/%s", postID, fileID),
		"size":     file.Size,
	})
}

/**
 * GetAsset 获取单个资产
 * GET /api/posts/:id/assets/:fileId
 */
func (h *AssetHandler) GetAsset(c *gin.Context) {
	postID := c.Param("id")
	fileID := c.Param("fileId")

	// 验证关联关系是否存在
	relations, err := h.postAssetRepo.GetRelationsByPostID(postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	found := false
	for _, rel := range relations {
		if rel.FileID == fileID {
			found = true
			break
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found for this post"})
		return
	}

	// 获取文件资源信息
	resource, err := h.fileResourceRepo.GetFileResource(fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// 获取文件数据
	fileData, err := h.storage.Get("blog-assets", fileID)
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
 * DELETE /api/posts/:id/assets/:fileId
 */
func (h *AssetHandler) DeleteAsset(c *gin.Context) {
	postID := c.Param("id")
	fileID := c.Param("fileId")

	// 删除关联关系
	if err := h.postAssetRepo.DeleteRelation(postID, fileID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete relation"})
		return
	}

	// 检查文件是否还有其他关联
	count, err := h.postAssetRepo.CountRelationsByFileID(fileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 如果没有其他关联，删除文件和记录
	if count == 0 {
		_ = h.storage.Delete("blog-assets", fileID)
		_ = h.fileResourceRepo.DeleteFileResource(fileID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Asset deleted successfully"})
}
