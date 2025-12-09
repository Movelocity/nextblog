package repository

import (
	"server/internal/db"
	"server/internal/models"
)

type NoteRepository struct{}

/**
 * GetAll 获取所有笔记
 */
func (r *NoteRepository) GetAll() ([]models.Note, error) {
	var notes []models.Note
	if err := db.DB.Order("date DESC, updated_at DESC").Find(&notes).Error; err != nil {
		return nil, err
	}
	return notes, nil
}

/**
 * GetByDate 根据日期获取笔记
 */
func (r *NoteRepository) GetByDate(date string) ([]models.Note, error) {
	var notes []models.Note
	if err := db.DB.Where("date = ?", date).Order("updated_at DESC").Find(&notes).Error; err != nil {
		return nil, err
	}
	return notes, nil
}

/**
 * GetByID 根据 ID 获取笔记
 */
func (r *NoteRepository) GetByID(id string) (*models.Note, error) {
	var note models.Note
	if err := db.DB.First(&note, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &note, nil
}

/**
 * Create 创建笔记
 */
func (r *NoteRepository) Create(note *models.Note) error {
	return db.DB.Create(note).Error
}

/**
 * Update 更新笔记
 */
func (r *NoteRepository) Update(note *models.Note) error {
	return db.DB.Save(note).Error
}

/**
 * Delete 删除笔记
 */
func (r *NoteRepository) Delete(id string) error {
	return db.DB.Delete(&models.Note{}, "id = ?", id).Error
}

/**
 * GetPublic 获取公开笔记
 */
func (r *NoteRepository) GetPublic() ([]models.Note, error) {
	var notes []models.Note
	if err := db.DB.Where("is_public = ?", true).Order("date DESC, updated_at DESC").Find(&notes).Error; err != nil {
		return nil, err
	}
	return notes, nil
}

/**
 * GetWithPagination 分页获取笔记
 */
func (r *NoteRepository) GetWithPagination(page, pageSize int, tag string, isPublic *bool) ([]models.Note, int64, error) {
	var notes []models.Note
	var total int64

	query := db.DB.Model(&models.Note{})

	// 标签过滤
	if tag != "" {
		query = query.Where("tags LIKE ?", "%\""+tag+"\"%")
	}

	// 公开状态过滤
	if isPublic != nil {
		query = query.Where("is_public = ?", *isPublic)
	}

	// 计算总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := query.Order("date DESC, updated_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&notes).Error; err != nil {
		return nil, 0, err
	}

	return notes, total, nil
}
