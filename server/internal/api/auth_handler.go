package api

import (
	"net/http"
	"nextblog-server/internal/middleware"
	"nextblog-server/internal/models"
	"nextblog-server/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

/**
 * AuthHandler 认证处理器
 */
type AuthHandler struct {
	authService *service.AuthService
}

/**
 * NewAuthHandler 创建认证处理器
 */
func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{
		authService: service.NewAuthService(db),
	}
}

/**
 * Register 注册新用户
 * POST /api/auth/register
 */
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body: " + err.Error(),
		})
		return
	}

	// 注册用户
	user, err := h.authService.Register(&req)
	if err != nil {
		if err.Error() == "email already exists" || err.Error() == "username already exists" {
			c.JSON(http.StatusConflict, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to register user",
		})
		return
	}

	// 生成token
	token, err := h.authService.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate token",
		})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	})
}

/**
 * Login 用户登录
 * POST /api/auth/login
 */
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body: " + err.Error(),
		})
		return
	}

	// 验证用户
	user, err := h.authService.Login(&req)
	if err != nil {
		if err.Error() == "invalid email or password" || err.Error() == "user account is deactivated" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "login failed",
		})
		return
	}

	// 生成token
	token, err := h.authService.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	})
}

/**
 * CheckAuth 检查认证状态
 * GET /api/auth/check
 * 需要认证
 */
func (h *AuthHandler) CheckAuth(c *gin.Context) {
	claims, exists := middleware.GetUserClaims(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"valid": false,
			"error": "not authenticated",
		})
		return
	}

	// 获取用户完整信息
	user, err := h.authService.GetUserByID(claims.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"valid": false,
			"error": "user not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid": true,
		"user":  user.ToResponse(),
	})
}

/**
 * GetProfile 获取当前用户信息
 * GET /api/auth/profile
 * 需要认证
 */
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "not authenticated",
		})
		return
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "user not found",
		})
		return
	}

	c.JSON(http.StatusOK, user.ToResponse())
}

/**
 * RefreshToken 刷新token
 * POST /api/auth/refresh
 * 需要认证
 */
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "not authenticated",
		})
		return
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "user not found",
		})
		return
	}

	// 生成新token
	token, err := h.authService.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
}
