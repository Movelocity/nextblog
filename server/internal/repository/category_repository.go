package repository

import (
	"server/internal/db"
	"server/internal/models"
)

type CategoryRepository struct{}

/**
 * GetAll 获取所有分类
 */
func (r *CategoryRepository) GetAll() ([]models.Category, error) {
	var categories []models.Category
	if err := db.DB.Order("count DESC").Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

/**
 * GetByName 根据名称获取分类
 */
func (r *CategoryRepository) GetByName(name string) (*models.Category, error) {
	var category models.Category
	if err := db.DB.First(&category, "name = ?", name).Error; err != nil {
		return nil, err
	}
	return &category, nil
}

/**
 * Create 创建分类
 */
func (r *CategoryRepository) Create(category *models.Category) error {
	return db.DB.Create(category).Error
}

/**
 * Update 更新分类
 */
func (r *CategoryRepository) Update(category *models.Category) error {
	return db.DB.Save(category).Error
}

/**
 * Delete 删除分类
 */
func (r *CategoryRepository) Delete(name string) error {
	return db.DB.Delete(&models.Category{}, "name = ?", name).Error
}

type TagRepository struct{}

/**
 * GetAll 获取所有标签
 */
func (r *TagRepository) GetAll() ([]models.Tag, error) {
	var tags []models.Tag
	if err := db.DB.Order("count DESC").Find(&tags).Error; err != nil {
		return nil, err
	}
	return tags, nil
}

/**
 * GetByName 根据名称获取标签
 */
func (r *TagRepository) GetByName(name string) (*models.Tag, error) {
	var tag models.Tag
	if err := db.DB.First(&tag, "name = ?", name).Error; err != nil {
		return nil, err
	}
	return &tag, nil
}

/**
 * Create 创建标签
 */
func (r *TagRepository) Create(tag *models.Tag) error {
	return db.DB.Create(tag).Error
}

/**
 * Update 更新标签
 */
func (r *TagRepository) Update(tag *models.Tag) error {
	return db.DB.Save(tag).Error
}

/**
 * Delete 删除标签
 */
func (r *TagRepository) Delete(name string) error {
	return db.DB.Delete(&models.Tag{}, "name = ?", name).Error
}
