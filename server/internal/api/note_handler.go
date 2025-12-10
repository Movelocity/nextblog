package api

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"server/internal/middleware"
	"server/internal/models"
	"server/internal/repository"

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
 * Query params: page, pageSize, tag, isPublic
 */
func (h *NoteHandler) GetNotes(c *gin.Context) {
	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	tag := c.Query("tag")

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

	// 参数验证
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// 分页查询
	notes, total, err := h.repo.GetWithPagination(page, pageSize, tag, isPublic)
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
 * UpdateNote 更新笔记
 * PUT /api/notes/:id
 */
func (h *NoteHandler) UpdateNote(c *gin.Context) {
	id := c.Param("id")

	// 检查笔记是否存在
	existingNote, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	var note models.Note
	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	note.ID = id
	note.CreatedAt = existingNote.CreatedAt
	note.UpdatedAt = time.Now()

	if err := h.repo.Update(&note); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, note)
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
