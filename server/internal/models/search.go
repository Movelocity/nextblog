package models

/**
 * SearchMatch 表示单个关键词匹配结果
 * 用于高级搜索时返回关键词的上下文信息
 */
type SearchMatch struct {
	Field   string `json:"field"`   // 匹配字段名（title, content, description, data, tags）
	Context string `json:"context"` // 关键词所在的上下文文本
	Offset  int    `json:"offset"`  // 关键词在原文中的字符偏移位置
}

/**
 * PostSearchResult 文章搜索结果（支持高级搜索）
 */
type PostSearchResult struct {
	PostSummary
	MatchCount int           `json:"matchCount,omitempty"` // 匹配次数
	Matches    []SearchMatch `json:"matches,omitempty"`    // 匹配详情（仅高级搜索时返回）
}

/**
 * PostSearchResponse 文章搜索响应
 */
type PostSearchResponse struct {
	Posts      []PostSearchResult `json:"posts"`
	Total      int64              `json:"total"`
	Page       int                `json:"page"`
	PageSize   int                `json:"pageSize"`
	TotalPages int                `json:"totalPages"`
}

/**
 * NoteSearchResult 笔记搜索结果（支持高级搜索）
 */
type NoteSearchResult struct {
	Note
	MatchCount int           `json:"matchCount,omitempty"` // 匹配次数
	Matches    []SearchMatch `json:"matches,omitempty"`    // 匹配详情（仅高级搜索时返回）
}

/**
 * NoteSearchResponse 笔记搜索响应
 */
type NoteSearchResponse struct {
	Notes []NoteSearchResult `json:"notes"`
	Total int64              `json:"total"`
}

