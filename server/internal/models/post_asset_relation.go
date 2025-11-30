package models

import "time"

/**
 * PostAssetRelation 博客-资产关联模型
 * 管理博客文章与文件资源的关联关系
 */
type PostAssetRelation struct {
	ID           int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	PostID       string    `json:"post_id" gorm:"index;not null"`           // 博客ID
	FileID       string    `json:"file_id" gorm:"index;not null"`           // 文件资源ID（外键 -> file_resources.id）
	RelationType string    `json:"relation_type" gorm:"default:'attachment'"` // 关联类型：attachment/inline-image/cover
	DisplayOrder int       `json:"display_order" gorm:"default:0"`          // 显示顺序
	CreatedAt    time.Time `json:"created_at"`
}

