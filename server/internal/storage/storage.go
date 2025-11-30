package storage

/**
 * FileStorage 文件存储接口
 * 抽象文件操作，支持本地存储和未来的云存储扩展
 */
type FileStorage interface {
	// Save 保存文件，返回文件ID
	Save(category string, filename string, data []byte) error
	
	// Get 根据ID获取文件
	Get(category string, fileID string) ([]byte, error)
	
	// Delete 根据ID删除文件
	Delete(category string, fileID string) error
	
	// List 列出分类下的所有文件ID
	List(category string) ([]string, error)
	
	// Exists 检查文件是否存在
	Exists(category string, fileID string) (bool, error)
	
	// GetPath 获取文件的完整路径
	GetPath(category string, fileID string) string
}

