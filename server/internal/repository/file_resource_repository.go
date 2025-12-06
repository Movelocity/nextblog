package repository

import (
	"nextblog-server/internal/db"
	"nextblog-server/internal/models"
)

/**
 * FileResourceRepository 文件资源数据访问层
 */
type FileResourceRepository struct{}

/**
 * NewFileResourceRepository 创建文件资源仓库实例
 */
func NewFileResourceRepository() *FileResourceRepository {
	return &FileResourceRepository{}
}

/**
 * CreateFileResource 创建文件资源记录
 * @param resource 文件资源对象
 */
func (r *FileResourceRepository) CreateFileResource(resource *models.FileResource) error {
	return db.DB.Create(resource).Error
}

/**
 * GetFileResource 根据ID获取文件资源
 * @param fileID 文件ID
 */
func (r *FileResourceRepository) GetFileResource(fileID string) (*models.FileResource, error) {
	var resource models.FileResource
	err := db.DB.Where("id = ?", fileID).First(&resource).Error
	if err != nil {
		return nil, err
	}
	return &resource, nil
}

/**
 * DeleteFileResource 删除文件资源记录
 * @param fileID 文件ID
 */
func (r *FileResourceRepository) DeleteFileResource(fileID string) error {
	return db.DB.Where("id = ?", fileID).Delete(&models.FileResource{}).Error
}

/**
 * ListFileResources 列出文件资源
 * @param category 文件分类
 * @param filters 过滤条件
 */
func (r *FileResourceRepository) ListFileResources(category string, filters map[string]interface{}) ([]*models.FileResource, error) {
	var resources []*models.FileResource
	query := db.DB

	if category != "" {
		query = query.Where("category = ?", category)
	}

	for key, value := range filters {
		query = query.Where(key+" = ?", value)
	}

	err := query.Order("created_at DESC").Find(&resources).Error
	return resources, err
}

/**
 * GetFileResourcesByIDs 根据ID列表批量获取文件资源
 * @param fileIDs 文件ID列表
 */
func (r *FileResourceRepository) GetFileResourcesByIDs(fileIDs []string) ([]*models.FileResource, error) {
	var resources []*models.FileResource
	err := db.DB.Where("id IN ?", fileIDs).Find(&resources).Error
	return resources, err
}

/**
 * GetFileResourcesByIDsWithPagination 根据ID列表批量获取文件资源（支持分页）
 * @param fileIDs 文件ID列表
 * @param offset 偏移量
 * @param limit 限制数量
 */
func (r *FileResourceRepository) GetFileResourcesByIDsWithPagination(fileIDs []string, offset, limit int) ([]*models.FileResource, error) {
	var resources []*models.FileResource
	err := db.DB.Where("id IN ?", fileIDs).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&resources).Error
	return resources, err
}

/**
 * CountFileResourcesByIDs 统计指定ID列表的文件资源数量
 * @param fileIDs 文件ID列表
 */
func (r *FileResourceRepository) CountFileResourcesByIDs(fileIDs []string) (int64, error) {
	var count int64
	err := db.DB.Model(&models.FileResource{}).Where("id IN ?", fileIDs).Count(&count).Error
	return count, err
}

/**
 * GetAllFileResourcesWithPagination 获取所有文件资源（支持分页）
 * @param offset 偏移量
 * @param limit 限制数量
 */
func (r *FileResourceRepository) GetAllFileResourcesWithPagination(offset, limit int) ([]*models.FileResource, error) {
	var resources []*models.FileResource
	err := db.DB.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&resources).Error
	return resources, err
}

/**
 * CountAllFileResources 统计所有文件资源数量
 */
func (r *FileResourceRepository) CountAllFileResources() (int64, error) {
	var count int64
	err := db.DB.Model(&models.FileResource{}).Count(&count).Error
	return count, err
}
