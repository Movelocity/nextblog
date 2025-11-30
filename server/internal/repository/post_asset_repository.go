package repository

import (
	"nextblog-server/internal/db"
	"nextblog-server/internal/models"
)

/**
 * PostAssetRepository 博客-资产关联数据访问层
 */
type PostAssetRepository struct{}

/**
 * NewPostAssetRepository 创建博客-资产关联仓库实例
 */
func NewPostAssetRepository() *PostAssetRepository {
	return &PostAssetRepository{}
}

/**
 * CreateRelation 创建博客-资产关联关系
 * @param relation 关联关系对象
 */
func (r *PostAssetRepository) CreateRelation(relation *models.PostAssetRelation) error {
	return db.DB.Create(relation).Error
}

/**
 * GetRelationsByPostID 根据博客ID获取所有资产关联
 * @param postID 博客ID
 */
func (r *PostAssetRepository) GetRelationsByPostID(postID string) ([]*models.PostAssetRelation, error) {
	var relations []*models.PostAssetRelation
	err := db.DB.Where("post_id = ?", postID).Order("display_order, created_at").Find(&relations).Error
	return relations, err
}

/**
 * DeleteRelation 删除博客-资产关联关系
 * @param postID 博客ID
 * @param fileID 文件ID
 */
func (r *PostAssetRepository) DeleteRelation(postID, fileID string) error {
	return db.DB.Where("post_id = ? AND file_id = ?", postID, fileID).Delete(&models.PostAssetRelation{}).Error
}

/**
 * DeleteRelationsByPostID 删除博客的所有资产关联
 * @param postID 博客ID
 */
func (r *PostAssetRepository) DeleteRelationsByPostID(postID string) error {
	return db.DB.Where("post_id = ?", postID).Delete(&models.PostAssetRelation{}).Error
}

/**
 * GetRelationsByFileID 根据文件ID获取所有关联
 * @param fileID 文件ID
 */
func (r *PostAssetRepository) GetRelationsByFileID(fileID string) ([]*models.PostAssetRelation, error) {
	var relations []*models.PostAssetRelation
	err := db.DB.Where("file_id = ?", fileID).Find(&relations).Error
	return relations, err
}

/**
 * CountRelationsByFileID 统计文件的关联数量
 * @param fileID 文件ID
 */
func (r *PostAssetRepository) CountRelationsByFileID(fileID string) (int64, error) {
	var count int64
	err := db.DB.Model(&models.PostAssetRelation{}).Where("file_id = ?", fileID).Count(&count).Error
	return count, err
}

