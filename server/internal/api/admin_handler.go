package api

import (
	"net/http"
	"server/internal/middleware"
	"server/internal/models"
	"server/internal/service"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminHandler struct {
	adminService *service.AdminService
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{adminService: service.NewAdminService(db)}
}

// POST /api/admin/users
func (h *AdminHandler) CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	adminID, _ := middleware.GetUserID(c)
	user, err := h.adminService.CreateUser(adminID, &req)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "email already exists" || err.Error() == "username already exists" {
			status = http.StatusConflict
		} else if err.Error()[:7] == "invalid" {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, user.ToResponse())
}

// GET /api/admin/users
func (h *AdminHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	users, total, err := h.adminService.ListUsers(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]*models.UserResponse, len(users))
	for i, u := range users {
		resp[i] = u.ToResponse()
	}
	c.JSON(http.StatusOK, gin.H{"users": resp, "total": total, "page": page, "pageSize": pageSize})
}

// GET /api/admin/users/:id
func (h *AdminHandler) GetUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}
	user, err := h.adminService.GetUser(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user.ToResponse())
}

// PUT /api/admin/users/:id
func (h *AdminHandler) UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}
	var body struct {
		Role   string `json:"role"`
		Active *bool  `json:"active"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user, err := h.adminService.UpdateUser(uint(id), body.Role, body.Active)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "invalid role: must be admin, editor, or user" {
			status = http.StatusBadRequest
		} else if err.Error() == "record not found" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, user.ToResponse())
}

// POST /api/admin/users/:id/tokens
func (h *AdminHandler) CreateAccessToken(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}
	var req models.CreateTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	adminID, _ := middleware.GetUserID(c)
	token, err := h.adminService.CreateAccessToken(adminID, uint(userID), &req)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "user not found" {
			status = http.StatusNotFound
		} else if err.Error()[:7] == "invalid" {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, token)
}

// GET /api/admin/users/:id/tokens
func (h *AdminHandler) ListAccessTokens(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}
	tokens, err := h.adminService.ListAccessTokens(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"tokens": tokens})
}

// DELETE /api/admin/tokens/:token
func (h *AdminHandler) RevokeAccessToken(c *gin.Context) {
	token := c.Param("token")
	if err := h.adminService.RevokeAccessToken(token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "token revoked"})
}

// POST /api/auth/token-exchange  (public endpoint, no auth required)
func (h *AdminHandler) TokenExchange(c *gin.Context) {
	var req models.TokenExchangeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	jwt, user, err := h.adminService.ExchangeAccessToken(req.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, models.AuthResponse{Token: jwt, User: user.ToResponse()})
}
