package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// StringArray 自定义类型，用于存储字符串数组
type StringArray []string

func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = []string{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, a)
}

func (a StringArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "[]", nil
	}
	return json.Marshal(a)
}

// Post 博客文章模型
type Post struct {
	ID          string      `json:"id" gorm:"primaryKey"`
	Title       string      `json:"title" gorm:"not null"`
	Description string      `json:"description" gorm:"type:text"`
	Content     string      `json:"content" gorm:"type:text"`
	Published   bool        `json:"published" gorm:"default:false"`
	CreatedAt   time.Time   `json:"createdAt" gorm:"not null"`
	UpdatedAt   time.Time   `json:"updatedAt" gorm:"not null"`
	Tags        StringArray `json:"tags" gorm:"type:text"`
	Categories  StringArray `json:"categories" gorm:"type:text"`
}

// Note 笔记模型
type Note struct {
	ID        string      `json:"id" gorm:"primaryKey"`
	Date      string      `json:"date" gorm:"not null;index"` // YYYY-MM-DD format
	Data      string      `json:"data" gorm:"type:text"`
	IsPublic  bool        `json:"isPublic" gorm:"default:false"`
	Tags      StringArray `json:"tags" gorm:"type:text"`
	CreatedAt time.Time   `json:"createdAt" gorm:"not null"`
	UpdatedAt time.Time   `json:"updatedAt" gorm:"not null"`
}

// Category 分类模型
type Category struct {
	Name  string `json:"name" gorm:"primaryKey"`
	Count int    `json:"count" gorm:"default:0"`
}

// Tag 标签模型
type Tag struct {
	Name  string `json:"name" gorm:"primaryKey"`
	Count int    `json:"count" gorm:"default:0"`
}

// SiteConfig 站点配置模型
type SiteConfig struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	SiteName        string    `json:"siteName" gorm:"not null"`
	SiteDescription string    `json:"siteDescription"`
	ICPInfo         string    `json:"icpInfo"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// Image 图片模型
type Image struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Filename    string    `json:"filename" gorm:"uniqueIndex;not null"`
	Path        string    `json:"path" gorm:"not null"`
	Size        int64     `json:"size"`
	MimeType    string    `json:"mimeType"`
	ThumbnailID string    `json:"thumbnailId,omitempty"` // 缩略图文件资源ID（外键 -> file_resources.id）
	CreatedAt   time.Time `json:"createdAt" gorm:"not null"`
}

// PostListResponse 文章列表响应
type PostListResponse struct {
	Posts      []Post `json:"posts"`
	Total      int64  `json:"total"`
	Page       int    `json:"page"`
	PageSize   int    `json:"pageSize"`
	TotalPages int    `json:"totalPages"`
}

// NoteListResponse 笔记列表响应
type NoteListResponse struct {
	Notes []Note `json:"notes"`
	Total int64  `json:"total"`
}
