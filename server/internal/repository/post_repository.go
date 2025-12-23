package repository

import (
	"server/internal/db"
	"server/internal/models"
)

type PostRepository struct{}

/**
 * GetAll 获取所有文章
 * @param page 页码
 * @param pageSize 每页数量
 * @param order 排序方式 (asc/desc)
 * @param published 发布状态过滤（nil=全部，true=已发布，false=草稿）
 * @param categories 分类过滤（空数组=全部）
 * @param tags 标签过滤（空数组=全部）
 */
func (r *PostRepository) GetAll(page, pageSize int, order string, published *bool, categories, tags []string) ([]models.PostSummary, int64, error) {
	var posts []models.PostSummary
	var total int64

	query := db.DB.Model(&models.Post{})

	// 过滤发布状态
	if published != nil {
		query = query.Where("published = ?", *published)
	}

	// 过滤分类（任意匹配）
	if len(categories) > 0 {
		for _, category := range categories {
			query = query.Where("json_extract(categories, '$') LIKE ?", "%\""+category+"\"%")
		}
	}

	// 过滤标签（任意匹配）
	if len(tags) > 0 {
		for _, tag := range tags {
			query = query.Where("json_extract(tags, '$') LIKE ?", "%\""+tag+"\"%")
		}
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 确定排序方式
	orderBy := "created_at DESC"
	if order == "asc" {
		orderBy = "created_at ASC"
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := query.Order(orderBy).Offset(offset).Limit(pageSize).Find(&posts).Error; err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

/**
 * GetByID 根据 ID 获取文章
 */
func (r *PostRepository) GetByID(id string) (*models.Post, error) {
	var post models.Post
	if err := db.DB.First(&post, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &post, nil
}

/**
 * Create 创建文章
 */
func (r *PostRepository) Create(post *models.Post) error {
	return db.DB.Create(post).Error
}

/**
 * Update 更新文章
 */
func (r *PostRepository) Update(post *models.Post) error {
	return db.DB.Save(post).Error
}

/**
 * Delete 删除文章
 */
func (r *PostRepository) Delete(id string) error {
	return db.DB.Delete(&models.Post{}, "id = ?", id).Error
}

/**
 * GetByCategory 根据分类获取文章
 */
func (r *PostRepository) GetByCategory(category string, page, pageSize int) ([]models.PostSummary, int64, error) {
	var posts []models.PostSummary
	var total int64

	// 使用 JSON 查询
	query := db.DB.Model(&models.Post{}).
		Where("json_extract(categories, '$') LIKE ?", "%\""+category+"\"%").
		Where("published = ?", true)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("updated_at DESC").Offset(offset).Limit(pageSize).Find(&posts).Error; err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

/**
 * GetByTag 根据标签获取文章
 */
func (r *PostRepository) GetByTag(tag string, page, pageSize int) ([]models.PostSummary, int64, error) {
	var posts []models.PostSummary
	var total int64

	query := db.DB.Model(&models.Post{}).
		Where("json_extract(tags, '$') LIKE ?", "%\""+tag+"\"%").
		Where("published = ?", true)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("updated_at DESC").Offset(offset).Limit(pageSize).Find(&posts).Error; err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

/**
 * Search 搜索文章
 * @param keyword 搜索关键词
 * @param page 页码
 * @param pageSize 每页数量
 * @param published 发布状态过滤（nil=全部，true=已发布，false=草稿）
 */
func (r *PostRepository) Search(keyword string, page, pageSize int, published *bool) ([]models.PostSummary, int64, error) {
	var posts []models.PostSummary
	var total int64

	query := db.DB.Model(&models.Post{})
	if keyword != "" {
		searchPattern := "%" + keyword + "%"
		query = query.Where("title LIKE ? OR description LIKE ? OR content LIKE ?", searchPattern, searchPattern, searchPattern)
	}

	// 根据 published 参数过滤
	if published != nil {
		query = query.Where("published = ?", *published)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("updated_at DESC").Offset(offset).Limit(pageSize).Find(&posts).Error; err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

/**
 * SearchWithContent 搜索文章并返回完整内容（用于高级搜索提取上下文）
 * @param keyword 搜索关键词
 * @param page 页码
 * @param pageSize 每页数量
 * @param published 发布状态过滤（nil=全部，true=已发布，false=草稿）
 */
func (r *PostRepository) SearchWithContent(keyword string, page, pageSize int, published *bool) ([]models.Post, int64, error) {
	var posts []models.Post
	var total int64

	query := db.DB.Model(&models.Post{})
	if keyword != "" {
		searchPattern := "%" + keyword + "%"
		query = query.Where("title LIKE ? OR description LIKE ? OR content LIKE ?", searchPattern, searchPattern, searchPattern)
	}

	// 根据 published 参数过滤
	if published != nil {
		query = query.Where("published = ?", *published)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("updated_at DESC").Offset(offset).Limit(pageSize).Find(&posts).Error; err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}
