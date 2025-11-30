package models

import "time"

/**
 * ImageEditTask 图片编辑任务模型
 * 管理图片编辑任务的状态和结果
 */
type ImageEditTask struct {
	ID            string    `json:"id" gorm:"primaryKey"`
	Status        string    `json:"status" gorm:"index;not null"`          // 状态：processing/completed/failed
	OriginalImage string    `json:"original_image" gorm:"not null"`        // 原始图片ID
	ResultImage   string    `json:"result_image,omitempty"`                // 结果图片ID
	Prompt        string    `json:"prompt" gorm:"type:text"`               // 编辑提示词
	Message       string    `json:"message,omitempty" gorm:"type:text"`    // 状态消息
	CreatedAt     time.Time `json:"created_at" gorm:"index"`
	UpdatedAt     time.Time `json:"updated_at"`
}

