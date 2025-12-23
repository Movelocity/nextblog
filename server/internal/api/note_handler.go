package api

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"server/internal/middleware"
	"server/internal/models"
	"server/internal/repository"
	"server/internal/service"

	"github.com/gin-gonic/gin"
)

type NoteHandler struct {
	repo *repository.NoteRepository
}

func NewNoteHandler() *NoteHandler {
	return &NoteHandler{
		repo: &repository.NoteRepository{},
	}
}

/**
 * GetNotes 获取所有笔记（支持分页）
 * GET /api/notes
 * Query params: page, pageSize, tag, isPublic, isArchived
 * isArchived: "true"=仅已归档, "false"=仅未归档(默认), "all"=所有笔记
 */
func (h *NoteHandler) GetNotes(c *gin.Context) {
	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	tag := c.Query("tag")
	order := c.Query("order")

	// 解析 isPublic 参数
	var isPublic *bool
	if isPublicStr := c.Query("isPublic"); isPublicStr != "" {
		if val, err := strconv.ParseBool(isPublicStr); err == nil {
			isPublic = &val
		}
	}

	_, isAuthenticated := middleware.GetUserID(c)
	if !isAuthenticated {
		trueValue := true
		isPublic = &trueValue
	}

	// 解析 isArchived 参数
	// nil=仅未归档(默认), true=仅已归档, false=所有笔记
	var isArchived *bool
	if isArchivedStr := c.Query("isArchived"); isArchivedStr != "" {
		if isArchivedStr == "all" {
			// "all" 表示显示所有笔记（包括已归档）
			falseVal := false
			isArchived = &falseVal
		} else if val, err := strconv.ParseBool(isArchivedStr); err == nil {
			isArchived = &val
		}
	}
	// 未认证用户不能查看已归档笔记
	if !isAuthenticated && isArchived != nil && *isArchived {
		isArchived = nil // 重置为默认（仅未归档）
	}

	// 参数验证
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// 分页查询
	notes, total, err := h.repo.GetWithPagination(page, pageSize, tag, order, isPublic, isArchived)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.NoteListResponse{
		Notes: notes,
		Total: total,
	})
}

/**
 * GetNotesByDate 根据日期获取笔记
 * GET /api/notes/:date
 */
func (h *NoteHandler) GetNotesByDate(c *gin.Context) {
	date := c.Param("date")

	notes, err := h.repo.GetByDate(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notes)
}

/**
 * GetNote 获取笔记详情
 * GET /api/notes/detail/:id
 */
func (h *NoteHandler) GetNote(c *gin.Context) {
	id := c.Param("id")

	note, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	c.JSON(http.StatusOK, note)
}

/**
 * CreateNote 创建笔记
 * POST /api/notes
 */
func (h *NoteHandler) CreateNote(c *gin.Context) {
	var note models.Note
	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 生成 ID（使用时间戳）
	note.ID = fmt.Sprintf("%d", time.Now().UnixMilli())
	note.CreatedAt = time.Now()
	note.UpdatedAt = time.Now()

	// 如果没有指定日期，使用当前日期
	if note.Date == "" {
		note.Date = time.Now().Format("2006-01-02")
	}

	if err := h.repo.Create(&note); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, note)
}

/**
 * UpdateNote 更新笔记（支持局部字段更新）
 * PUT /api/notes/:id
 * 只更新请求中提供的非零值字段，未提供的字段保持原值
 */
func (h *NoteHandler) UpdateNote(c *gin.Context) {
	id := c.Param("id")

	// 检查笔记是否存在
	existingNote, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	var input models.Note
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 合并字段：只更新请求中提供的非零值字段
	if input.Date != "" {
		existingNote.Date = input.Date
	}
	if input.Data != "" {
		existingNote.Data = input.Data
	}
	// IsPublic 和 IsArchived 是 bool 类型，始终更新
	existingNote.IsPublic = input.IsPublic
	existingNote.IsArchived = input.IsArchived
	// Tags 是数组，nil 表示未提供，空数组表示清空
	if input.Tags != nil {
		existingNote.Tags = input.Tags
	}

	existingNote.UpdatedAt = time.Now()

	if err := h.repo.Update(existingNote); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, existingNote)
}

/**
 * DeleteNote 删除笔记
 * DELETE /api/notes/:id
 */
func (h *NoteHandler) DeleteNote(c *gin.Context) {
	id := c.Param("id")

	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Note deleted successfully"})
}

/**
 * ArchiveNote 归档/取消归档笔记
 * PUT /api/notes/:id/archive
 * Body: { "isArchived": true/false }
 */
func (h *NoteHandler) ArchiveNote(c *gin.Context) {
	id := c.Param("id")

	// 检查笔记是否存在
	note, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	// 解析请求体
	var req struct {
		IsArchived bool `json:"isArchived"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新归档状态
	if err := h.repo.SetArchiveStatus(id, req.IsArchived); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 返回更新后的笔记
	note.IsArchived = req.IsArchived
	c.JSON(http.StatusOK, note)
}

/**
 * GetPublicNotes 获取公开笔记
 * GET /api/notes/public
 */
func (h *NoteHandler) GetPublicNotes(c *gin.Context) {
	notes, err := h.repo.GetPublic()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notes)
}

/**
 * GetStats 获取统计数据
 * GET /api/notes/stats?year=2024&month=12
 * Query params: year (required), month (required)
 * 已登录用户可以看到全部笔记统计，未登录用户只能看到公开笔记统计
 */
func (h *NoteHandler) GetStats(c *gin.Context) {
	// 解析年份参数
	yearStr := c.Query("year")
	if yearStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "year parameter is required"})
		return
	}
	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 1900 || year > 2100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid year parameter"})
		return
	}

	// 解析月份参数
	monthStr := c.Query("month")
	if monthStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "month parameter is required"})
		return
	}
	month, err := strconv.Atoi(monthStr)
	if err != nil || month < 1 || month > 12 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid month parameter, must be between 1 and 12"})
		return
	}

	// 检查用户是否已登录，决定是否只统计公开笔记
	_, isAuthenticated := middleware.GetUserID(c)
	var isPublic *bool
	if !isAuthenticated {
		// 未登录用户只能看到公开笔记统计
		trueValue := true
		isPublic = &trueValue
	}

	// 获取统计数据
	stats, err := h.repo.GetStatsByMonth(year, month, isPublic)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

/**
 * SearchNotes 搜索笔记
 * GET /api/notes/search?keyword=xxx&page=1&pageSize=20&highlight=true&contextSize=50
 *
 * 参数说明：
 * - keyword: 搜索关键词（必填）
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20）
 * - highlight: 是否启用高级搜索返回匹配上下文（默认 false，仅登录用户可用）
 * - contextSize: 上下文窗口大小（默认 50，仅 highlight=true 时有效）
 *
 * 搜索范围：
 * - 未登录：仅搜索公开且未归档的笔记
 * - 已登录：搜索所有笔记（包括私有和归档笔记）
 */
func (h *NoteHandler) SearchNotes(c *gin.Context) {
	keyword := c.Query("keyword")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "keyword is required"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))

	// 参数验证
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// 检查用户是否已登录
	_, isAuthenticated := middleware.GetUserID(c)

	// 根据登录状态决定搜索范围
	var isPublic *bool
	includeArchived := false
	if !isAuthenticated {
		// 未登录用户只能搜索公开且未归档的笔记
		trueValue := true
		isPublic = &trueValue
	} else {
		// 已登录用户搜索所有笔记（包括私有和归档）
		includeArchived = true
	}

	// 解析高级搜索参数（仅登录用户可用）
	highlight := c.Query("highlight") == "true" && isAuthenticated
	contextSize, _ := strconv.Atoi(c.DefaultQuery("contextSize", "50"))
	if contextSize <= 0 {
		contextSize = service.DefaultContextSize
	}

	// 执行搜索
	notes, total, err := h.repo.Search(keyword, page, pageSize, isPublic, includeArchived)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if highlight {
		// 高级搜索：返回带匹配信息的结果
		results := make([]models.NoteSearchResult, len(notes))
		for i, note := range notes {
			matches, matchCount := service.ExtractAllNoteMatches(note.Data, note.Tags, keyword, contextSize)
			results[i] = models.NoteSearchResult{
				Note:       note,
				MatchCount: matchCount,
				Matches:    matches,
			}
		}

		c.JSON(http.StatusOK, models.NoteSearchResponse{
			Notes: results,
			Total: total,
		})
	} else {
		// 普通搜索
		c.JSON(http.StatusOK, models.NoteListResponse{
			Notes: notes,
			Total: total,
		})
	}
}
