package repository

import (
	"server/internal/models"

	"gorm.io/gorm"
)

/**
 * UserRepository 用户数据访问层
 */
type UserRepository struct {
	db *gorm.DB
}

/**
 * NewUserRepository 创建用户仓库
 */
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

/**
 * Create 创建用户
 */
func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

/**
 * GetByID 根据ID获取用户
 */
func (r *UserRepository) GetByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

/**
 * GetByEmail 根据邮箱获取用户
 */
func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

/**
 * GetByUsername 根据用户名获取用户
 */
func (r *UserRepository) GetByUsername(username string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

/**
 * Update 更新用户
 */
func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

/**
 * Delete 删除用户
 */
func (r *UserRepository) Delete(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}

/**
 * List 列出所有用户
 */
func (r *UserRepository) List(page, pageSize int) ([]*models.User, int64, error) {
	var users []*models.User
	var total int64

	// 获取总数
	if err := r.db.Model(&models.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := r.db.Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

/**
 * ExistsByEmail 检查邮箱是否已存在
 */
func (r *UserRepository) ExistsByEmail(email string) (bool, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

/**
 * ExistsByUsername 检查用户名是否已存在
 */
func (r *UserRepository) ExistsByUsername(username string) (bool, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Where("username = ?", username).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

/**
 * CountUsers 获取用户总数
 */
func (r *UserRepository) CountUsers() (int64, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
