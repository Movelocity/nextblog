package models

import "time"

/**
 * ThumbnailCache 缩略图缓存模型
 * 缓存已生成的不同尺寸的缩略图，避免重复生成
 */
type ThumbnailCache struct {
	ID             int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	SourceFileID   string    `json:"source_file_id" gorm:"index;not null"`     // 源文件ID（外键 -> file_resources.id）
	Width          int       `json:"width" gorm:"not null"`                    // 缩略图宽度
	Height         int       `json:"height" gorm:"not null"`                   // 缩略图高度
	ThumbnailID    string    `json:"thumbnail_id" gorm:"uniqueIndex;not null"` // 缩略图文件ID
	StoragePath    string    `json:"storage_path" gorm:"not null"`             // 存储路径
	Size           int64     `json:"size" gorm:"not null"`                     // 文件大小（字节）
	CreatedAt      time.Time `json:"created_at" gorm:"index"`
	LastAccessedAt time.Time `json:"last_accessed_at" gorm:"index"` // 最后访问时间，用于LRU清理
}
