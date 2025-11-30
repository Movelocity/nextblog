package models

import (
	"time"
)

/**
 * User 用户模型
 */
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Username  string    `json:"username" gorm:"uniqueIndex;not null;size:50"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null;size:100"`
	Password  string    `json:"-" gorm:"not null;size:255"`                  // 使用 json:"-" 防止密码在JSON响应中暴露
	Role      string    `json:"role" gorm:"not null;default:'user';size:20"` // admin, editor, user
	Active    bool      `json:"active" gorm:"default:true"`
	CreatedAt time.Time `json:"createdAt" gorm:"not null"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"not null"`
}

/**
 * UserResponse 用户响应（不包含敏感信息）
 */
type UserResponse struct {
	ID        uint      `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	Active    bool      `json:"active"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

/**
 * ToResponse 转换为响应格式
 */
func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:        u.ID,
		Username:  u.Username,
		Email:     u.Email,
		Role:      u.Role,
		Active:    u.Active,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

/**
 * LoginRequest 登录请求
 */
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

/**
 * RegisterRequest 注册请求
 */
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

/**
 * AuthResponse 认证响应
 */
type AuthResponse struct {
	Token string        `json:"token"`
	User  *UserResponse `json:"user"`
}

/**
 * JWTClaims JWT Claims
 */
type JWTClaims struct {
	UserID   uint   `json:"userId"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}
