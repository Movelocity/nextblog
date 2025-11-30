package service

import (
	"fmt"
	"sync"
	"time"

	"nextblog-server/internal/db"
	"nextblog-server/internal/models"
)

/**
 * ImageEditService 图片编辑任务管理服务
 */
type ImageEditService struct {
	mu              sync.RWMutex
	runningTasks    map[string]chan bool // 任务ID -> 取消信号channel
	maxConcurrent   int
}

/**
 * NewImageEditService 创建图片编辑服务实例
 */
func NewImageEditService() *ImageEditService {
	return &ImageEditService{
		runningTasks:  make(map[string]chan bool),
		maxConcurrent: 1, // 限制并发任务数
	}
}

/**
 * CreateTask 创建新任务
 * @param task 任务对象
 */
func (s *ImageEditService) CreateTask(task *models.ImageEditTask) error {
	task.Status = "processing"
	task.CreatedAt = time.Now()
	task.UpdatedAt = time.Now()
	
	return db.DB.Create(task).Error
}

/**
 * GetTask 获取任务详情
 * @param taskID 任务ID
 */
func (s *ImageEditService) GetTask(taskID string) (*models.ImageEditTask, error) {
	var task models.ImageEditTask
	err := db.DB.Where("id = ?", taskID).First(&task).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

/**
 * GetAllTasks 获取所有任务列表
 */
func (s *ImageEditService) GetAllTasks() ([]*models.ImageEditTask, error) {
	var tasks []*models.ImageEditTask
	err := db.DB.Order("created_at DESC").Find(&tasks).Error
	return tasks, err
}

/**
 * UpdateTaskStatus 更新任务状态
 * @param taskID 任务ID
 * @param status 新状态
 * @param message 状态消息
 */
func (s *ImageEditService) UpdateTaskStatus(taskID, status, message string) error {
	updates := map[string]interface{}{
		"status":     status,
		"message":    message,
		"updated_at": time.Now(),
	}
	
	return db.DB.Model(&models.ImageEditTask{}).Where("id = ?", taskID).Updates(updates).Error
}

/**
 * UpdateTaskResult 更新任务结果
 * @param taskID 任务ID
 * @param resultImage 结果图片ID
 */
func (s *ImageEditService) UpdateTaskResult(taskID, resultImage string) error {
	updates := map[string]interface{}{
		"status":       "completed",
		"result_image": resultImage,
		"updated_at":   time.Now(),
	}
	
	return db.DB.Model(&models.ImageEditTask{}).Where("id = ?", taskID).Updates(updates).Error
}

/**
 * DeleteTask 删除任务
 * @param taskID 任务ID
 */
func (s *ImageEditService) DeleteTask(taskID string) error {
	// 停止运行中的任务
	s.StopTask(taskID)
	
	return db.DB.Where("id = ?", taskID).Delete(&models.ImageEditTask{}).Error
}

/**
 * StartTaskProcessing 启动任务处理（异步）
 * @param taskID 任务ID
 */
func (s *ImageEditService) StartTaskProcessing(taskID string) error {
	s.mu.Lock()
	
	// 检查并发限制
	if len(s.runningTasks) >= s.maxConcurrent {
		s.mu.Unlock()
		return fmt.Errorf("concurrent task limit reached")
	}
	
	// 创建取消信号channel
	cancelChan := make(chan bool, 1)
	s.runningTasks[taskID] = cancelChan
	s.mu.Unlock()
	
	// 启动异步任务
	go s.processTask(taskID, cancelChan)
	
	return nil
}

/**
 * StopTask 停止任务
 * @param taskID 任务ID
 */
func (s *ImageEditService) StopTask(taskID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	if cancelChan, exists := s.runningTasks[taskID]; exists {
		close(cancelChan)
		delete(s.runningTasks, taskID)
		
		// 更新任务状态
		go s.UpdateTaskStatus(taskID, "failed", "Task stopped by user")
		
		return nil
	}
	
	return fmt.Errorf("task not running")
}

/**
 * RetryTask 重试任务
 * @param taskID 任务ID
 * @param newPrompt 新的提示词（可选）
 */
func (s *ImageEditService) RetryTask(taskID string, newPrompt *string) error {
	// 停止旧任务
	s.StopTask(taskID)
	
	// 更新任务状态和提示词
	updates := map[string]interface{}{
		"status":       "processing",
		"message":      "",
		"result_image": "",
		"updated_at":   time.Now(),
	}
	
	if newPrompt != nil {
		updates["prompt"] = *newPrompt
	}
	
	if err := db.DB.Model(&models.ImageEditTask{}).Where("id = ?", taskID).Updates(updates).Error; err != nil {
		return err
	}
	
	// 重新启动任务
	return s.StartTaskProcessing(taskID)
}

/**
 * processTask 处理任务（内部方法）
 * @param taskID 任务ID
 * @param cancelChan 取消信号channel
 */
func (s *ImageEditService) processTask(taskID string, cancelChan chan bool) {
	defer func() {
		s.mu.Lock()
		delete(s.runningTasks, taskID)
		s.mu.Unlock()
	}()
	
	// 模拟任务处理（实际实现需要调用图片编辑API）
	// 这里使用 mock 数据
	select {
	case <-time.After(5 * time.Second):
		// 任务完成（mock）
		s.UpdateTaskStatus(taskID, "completed", "Image edit completed (mock)")
		// 在实际实现中，这里应该生成结果图片并保存
		// s.UpdateTaskResult(taskID, resultImageID)
	case <-cancelChan:
		// 任务被取消
		return
	}
}

/**
 * CleanupOldTasks 清理过期任务（24小时后）
 */
func (s *ImageEditService) CleanupOldTasks() error {
	cutoff := time.Now().Add(-24 * time.Hour)
	
	return db.DB.Where("updated_at < ? AND status IN ?", cutoff, []string{"completed", "failed"}).
		Delete(&models.ImageEditTask{}).Error
}

