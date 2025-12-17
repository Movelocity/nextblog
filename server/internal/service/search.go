package service

import (
	"server/internal/models"
	"strings"
	"unicode/utf8"
)

const DefaultContextSize = 50

/**
 * ExtractMatches 从文本中提取关键词匹配信息
 * @param text 要搜索的文本
 * @param keyword 关键词
 * @param field 字段名称
 * @param contextSize 上下文窗口大小（关键词前后各多少字符）
 * @return 匹配结果列表
 */
func ExtractMatches(text, keyword, field string, contextSize int) []models.SearchMatch {
	if text == "" || keyword == "" {
		return nil
	}

	if contextSize <= 0 {
		contextSize = DefaultContextSize
	}

	var matches []models.SearchMatch
	lowerText := strings.ToLower(text)
	lowerKeyword := strings.ToLower(keyword)

	// 查找所有匹配位置
	startPos := 0
	for {
		idx := strings.Index(lowerText[startPos:], lowerKeyword)
		if idx == -1 {
			break
		}

		// 计算实际偏移位置
		offset := startPos + idx

		// 提取上下文
		context := extractContext(text, offset, len(keyword), contextSize)

		matches = append(matches, models.SearchMatch{
			Field:   field,
			Context: context,
			Offset:  offset,
		})

		// 移动到下一个可能的匹配位置
		startPos = offset + len(keyword)
		if startPos >= len(lowerText) {
			break
		}
	}

	return matches
}

/**
 * extractContext 提取关键词的上下文
 * @param text 原始文本
 * @param offset 关键词偏移位置
 * @param keywordLen 关键词长度
 * @param contextSize 上下文窗口大小
 * @return 上下文文本
 */
func extractContext(text string, offset, keywordLen, contextSize int) string {
	textRunes := []rune(text)
	textLen := len(textRunes)

	// 将字节偏移转换为 rune 偏移
	runeOffset := utf8.RuneCountInString(text[:offset])
	runeKeywordLen := utf8.RuneCountInString(text[offset : offset+keywordLen])

	// 计算上下文起始和结束位置
	start := runeOffset - contextSize
	if start < 0 {
		start = 0
	}

	end := runeOffset + runeKeywordLen + contextSize
	if end > textLen {
		end = textLen
	}

	// 提取上下文
	context := string(textRunes[start:end])

	// 添加省略号表示截断
	prefix := ""
	suffix := ""
	if start > 0 {
		prefix = "..."
	}
	if end < textLen {
		suffix = "..."
	}

	return prefix + context + suffix
}

/**
 * CountMatches 统计关键词在文本中的匹配次数
 * @param text 要搜索的文本
 * @param keyword 关键词
 * @return 匹配次数
 */
func CountMatches(text, keyword string) int {
	if text == "" || keyword == "" {
		return 0
	}

	lowerText := strings.ToLower(text)
	lowerKeyword := strings.ToLower(keyword)

	return strings.Count(lowerText, lowerKeyword)
}

/**
 * ExtractAllPostMatches 提取文章中所有字段的匹配信息
 * @param post 文章数据
 * @param keyword 关键词
 * @param contextSize 上下文窗口大小
 * @return 匹配结果列表和总匹配次数
 */
func ExtractAllPostMatches(title, description, content, keyword string, contextSize int) ([]models.SearchMatch, int) {
	var allMatches []models.SearchMatch
	totalCount := 0

	// 搜索标题
	titleMatches := ExtractMatches(title, keyword, "title", contextSize)
	allMatches = append(allMatches, titleMatches...)
	totalCount += len(titleMatches)

	// 搜索描述
	descMatches := ExtractMatches(description, keyword, "description", contextSize)
	allMatches = append(allMatches, descMatches...)
	totalCount += len(descMatches)

	// 搜索内容
	contentMatches := ExtractMatches(content, keyword, "content", contextSize)
	allMatches = append(allMatches, contentMatches...)
	totalCount += len(contentMatches)

	return allMatches, totalCount
}

/**
 * ExtractAllNoteMatches 提取笔记中所有字段的匹配信息
 * @param data 笔记内容
 * @param tags 标签列表
 * @param keyword 关键词
 * @param contextSize 上下文窗口大小
 * @return 匹配结果列表和总匹配次数
 */
func ExtractAllNoteMatches(data string, tags []string, keyword string, contextSize int) ([]models.SearchMatch, int) {
	var allMatches []models.SearchMatch
	totalCount := 0

	// 搜索内容
	dataMatches := ExtractMatches(data, keyword, "data", contextSize)
	allMatches = append(allMatches, dataMatches...)
	totalCount += len(dataMatches)

	// 搜索标签
	for _, tag := range tags {
		tagMatches := ExtractMatches(tag, keyword, "tags", contextSize)
		allMatches = append(allMatches, tagMatches...)
		totalCount += len(tagMatches)
	}

	return allMatches, totalCount
}

