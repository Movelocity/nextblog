package repository

import (
	"nextblog-server/internal/db"
	"nextblog-server/internal/models"
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
