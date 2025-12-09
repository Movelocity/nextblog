package models

import "time"

/**
 * FileResource 文件资源模型
 * 统一管理所有文件（图片、缩略图、博客资产、图片编辑结果等）
 */
type FileResource struct {
	ID           string    `json:"id" gorm:"primaryKey"`          // 文件ID（与物理文件名一致，带扩展名）
	OriginalName string    `json:"original_name" gorm:"not null"` // 原始文件名
	Extension    string    `json:"extension" gorm:"not null"`     // 文件扩展名（含点，如 ".jpg"）
	MimeType     string    `json:"mime_type" gorm:"not null"`     // MIME类型
	Size         int64     `json:"size" gorm:"not null"`          // 文件大小（字节）
	Category     string    `json:"category" gorm:"index"`         // 文件分类：image/thumbnail/blog-asset/edit-result
	StoragePath  string    `json:"storage_path" gorm:"not null"`  // 存储路径（含扩展名）
	CreatedAt    time.Time `json:"created_at" gorm:"index"`
	UpdatedAt    time.Time `json:"updated_at"`
}
