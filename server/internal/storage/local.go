package storage

import (
	"fmt"
	"os"
	"path/filepath"
)

/**
 * LocalFileStorage 本地文件系统存储实现
 */
type LocalFileStorage struct {
	basePath string
}

/**
 * NewLocalFileStorage 创建本地文件存储实例
 * @param basePath 存储基础路径
 */
func NewLocalFileStorage(basePath string) *LocalFileStorage {
	return &LocalFileStorage{
		basePath: basePath,
	}
}

/**
 * Save 保存文件
 * @param category 文件分类（images/thumbnails/blog-assets/image-edit-results）
 * @param filename 文件名（纯ID，无扩展名）
 * @param data 文件数据
 */
func (s *LocalFileStorage) Save(category string, filename string, data []byte) error {
	dirPath := filepath.Join(s.basePath, category)
	
	// 确保目录存在
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}
	
	filePath := filepath.Join(dirPath, filename)
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}
	
	return nil
}

/**
 * Get 根据ID获取文件
 * @param category 文件分类
 * @param fileID 文件ID
 */
func (s *LocalFileStorage) Get(category string, fileID string) ([]byte, error) {
	filePath := filepath.Join(s.basePath, category, fileID)
	
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}
	
	return data, nil
}

/**
 * Delete 根据ID删除文件
 * @param category 文件分类
 * @param fileID 文件ID
 */
func (s *LocalFileStorage) Delete(category string, fileID string) error {
	filePath := filepath.Join(s.basePath, category, fileID)
	
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	
	return nil
}

/**
 * List 列出分类下的所有文件ID
 * @param category 文件分类
 */
func (s *LocalFileStorage) List(category string) ([]string, error) {
	dirPath := filepath.Join(s.basePath, category)
	
	// 检查目录是否存在
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		return []string{}, nil
	}
	
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %w", err)
	}
	
	var fileIDs []string
	for _, entry := range entries {
		if !entry.IsDir() {
			fileIDs = append(fileIDs, entry.Name())
		}
	}
	
	return fileIDs, nil
}

/**
 * Exists 检查文件是否存在
 * @param category 文件分类
 * @param fileID 文件ID
 */
func (s *LocalFileStorage) Exists(category string, fileID string) (bool, error) {
	filePath := filepath.Join(s.basePath, category, fileID)
	
	_, err := os.Stat(filePath)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

/**
 * GetPath 获取文件的完整路径
 * @param category 文件分类
 * @param fileID 文件ID
 */
func (s *LocalFileStorage) GetPath(category string, fileID string) string {
	return filepath.Join(s.basePath, category, fileID)
}

