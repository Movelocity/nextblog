package repository

import (
	"fmt"
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
 * @param isArchived: nil=仅未归档, true=仅已归档, false=所有笔记
 */
func (r *NoteRepository) GetWithPagination(page, pageSize int, tag string, isPublic *bool, isArchived *bool) ([]models.Note, int64, error) {
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

	// 归档状态过滤：nil=仅未归档，true=仅已归档，false=所有笔记
	if isArchived == nil {
		// 默认只显示未归档笔记
		query = query.Where("is_archived = ?", false)
	} else if *isArchived {
		// 仅显示已归档笔记
		query = query.Where("is_archived = ?", true)
	}
	// isArchived == false 时不添加过滤条件，显示所有笔记

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

/** 按月获取每天的笔记数量
 * GetStatsByMonth 获取指定月份的统计数据
 * 返回该月每天的笔记数量，格式为 {"2024-01-01": 3, "2024-01-02": 5}
 * 注意：统计数据排除已归档的笔记
 */
func (r *NoteRepository) GetStatsByMonth(year int, month int) (map[string]int, error) {
	stats := make(map[string]int)

	// 构造该月份的起始和结束日期
	startDate := fmt.Sprintf("%04d-%02d-01", year, month)

	// 计算该月的最后一天
	var endDate string
	if month == 12 {
		endDate = fmt.Sprintf("%04d-01-01", year+1)
	} else {
		endDate = fmt.Sprintf("%04d-%02d-01", year, month+1)
	}

	// 查询该月份范围内的所有笔记，按日期分组统计数量（排除已归档笔记）
	var results []struct {
		Date  string
		Count int
	}

	if err := db.DB.Model(&models.Note{}).
		Select("date, COUNT(*) as count").
		Where("date >= ? AND date < ? AND is_archived = ?", startDate, endDate, false).
		Group("date").
		Scan(&results).Error; err != nil {
		return nil, err
	}

	// 将结果转换为 map
	for _, result := range results {
		stats[result.Date] = result.Count
	}

	return stats, nil
}

/**
 * SetArchiveStatus 设置笔记归档状态
 * @param id 笔记ID
 * @param isArchived 归档状态
 */
func (r *NoteRepository) SetArchiveStatus(id string, isArchived bool) error {
	return db.DB.Model(&models.Note{}).Where("id = ?", id).Update("is_archived", isArchived).Error
}
