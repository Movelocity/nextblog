package api

import (
	"fmt"
	"net/http"
	"time"

	"nextblog-server/internal/models"
	"nextblog-server/internal/repository"

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
 * GetNotes 获取所有笔记
 * GET /api/notes
 */
func (h *NoteHandler) GetNotes(c *gin.Context) {
	notes, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.NoteListResponse{
		Notes: notes,
		Total: int64(len(notes)),
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
