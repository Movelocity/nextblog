package middleware

import (
	"net/http"
	"server/internal/models"
	"server/internal/service"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

/**
 * CORS 跨域中间件
 */
func CORS(allowedOrigins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// 检查是否允许该来源
		allowed := false
		for _, allowedOrigin := range allowedOrigins {
			if allowedOrigin == "*" || allowedOrigin == origin {
				allowed = true
				break
			}
		}

		if allowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

/**
 * Logger 日志中间件
 */
func Logger() gin.HandlerFunc {
	return gin.Logger()
}

/**
 * Recovery 恢复中间件
 */
func Recovery() gin.HandlerFunc {
	return gin.Recovery()
}

/**
 * Auth 可选认证中间件（尝试解析token，但不强制要求）
 * 无论是否登录都会通过，如果有有效token则会将用户信息存储到context中
 */
func Auth(db *gorm.DB) gin.HandlerFunc {
	authService := service.NewAuthService(db)

	return func(c *gin.Context) {
		// 获取Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// 没有token，继续执行，但不设置用户信息
			c.Next()
			return
		}

		// 提取Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			// token格式不正确，继续执行，但不设置用户信息
			c.Next()
			return
		}

		token := parts[1]

		// 验证token
		claims, err := authService.ValidateToken(token)
		if err != nil {
			// token无效，继续执行，但不设置用户信息
			c.Next()
			return
		}

		// 将用户信息存储到context中
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)

		c.Next()
	}
}

/**
 * MustLogin 强制认证中间件
 * 检查context中是否已有用户信息，如果没有则返回401
 * 必须在Auth之后使用
 */
func MustLogin() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查context中是否有用户信息
		_, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "authentication required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

/**
 * RequireRole 角色权限中间件
 */
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "authentication required",
			})
			c.Abort()
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "invalid role type",
			})
			c.Abort()
			return
		}

		// 检查用户角色是否在允许的角色列表中
		for _, role := range roles {
			if roleStr == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error": "insufficient permissions",
		})
		c.Abort()
	}
}

/**
 * GetUserID 从context中获取用户ID
 */
func GetUserID(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("userID")
	if !exists {
		return 0, false
	}

	id, ok := userID.(uint)
	return id, ok
}

/**
 * GetUserRole 从context中获取用户角色
 */
func GetUserRole(c *gin.Context) (string, bool) {
	role, exists := c.Get("role")
	if !exists {
		return "", false
	}

	roleStr, ok := role.(string)
	return roleStr, ok
}

/**
 * GetUserClaims 从context中获取完整的用户claims
 */
func GetUserClaims(c *gin.Context) (*models.JWTClaims, bool) {
	userID, exists := c.Get("userID")
	if !exists {
		return nil, false
	}

	username, _ := c.Get("username")
	email, _ := c.Get("email")
	role, _ := c.Get("role")

	claims := &models.JWTClaims{
		UserID:   userID.(uint),
		Username: username.(string),
		Email:    email.(string),
		Role:     role.(string),
	}

	return claims, true
}
