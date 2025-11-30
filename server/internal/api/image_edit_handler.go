package api

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"nextblog-server/internal/models"
	"nextblog-server/internal/service"
)

/**
 * ImageEditHandler 图片编辑处理器
 */
type ImageEditHandler struct {
	editService *service.ImageEditService
}

/**
 * NewImageEditHandler 创建图片编辑处理器实例
 */
func NewImageEditHandler() *ImageEditHandler {
	return &ImageEditHandler{
		editService: service.NewImageEditService(),
	}
}

/**
 * GetTasks 获取任务列表或单个任务
 * GET /api/image-edit?task_id=xxx
 */
func (h *ImageEditHandler) GetTasks(c *gin.Context) {
	taskID := c.Query("task_id")
	
	if taskID != "" {
		// 获取单个任务
		task, err := h.editService.GetTask(taskID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		c.JSON(http.StatusOK, task)
	} else {
		// 获取所有任务
		tasks, err := h.editService.GetAllTasks()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, tasks)
	}
}

/**
 * CreateTask 创建新任务
 * POST /api/image-edit
 */
func (h *ImageEditHandler) CreateTask(c *gin.Context) {
	var req struct {
		OriginalImage string `json:"original_image" binding:"required"`
		Prompt        string `json:"prompt" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// 生成任务ID
	taskID := fmt.Sprintf("%d-%d", time.Now().UnixMilli(), time.Now().Nanosecond()%1000000)
	
	task := &models.ImageEditTask{
		ID:            taskID,
		OriginalImage: req.OriginalImage,
		Prompt:        req.Prompt,
	}
	
	if err := h.editService.CreateTask(task); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}
	
	// 启动任务处理
	if err := h.editService.StartTaskProcessing(taskID); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, task)
}

/**
 * StopTask 停止任务
 * PUT /api/image-edit?task_id=xxx
 */
func (h *ImageEditHandler) StopTask(c *gin.Context) {
	taskID := c.Query("task_id")
	
	if taskID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "task_id is required"})
		return
	}
	
	if err := h.editService.StopTask(taskID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Task stopped successfully"})
}

/**
 * RetryTask 重试任务
 * PATCH /api/image-edit?task_id=xxx
 */
func (h *ImageEditHandler) RetryTask(c *gin.Context) {
	taskID := c.Query("task_id")
	
	if taskID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "task_id is required"})
		return
	}
	
	var req struct {
		Prompt *string `json:"prompt"`
	}
	
	_ = c.ShouldBindJSON(&req)
	
	if err := h.editService.RetryTask(taskID, req.Prompt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Task retried successfully"})
}

/**
 * DeleteTask 删除任务
 * DELETE /api/image-edit?task_id=xxx
 */
func (h *ImageEditHandler) DeleteTask(c *gin.Context) {
	taskID := c.Query("task_id")
	
	if taskID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "task_id is required"})
		return
	}
	
	if err := h.editService.DeleteTask(taskID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

