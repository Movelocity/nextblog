package api

import (
	"net/http"
	"time"

	"server/internal/db"
	"server/internal/models"

	"github.com/gin-gonic/gin"
)

type ConfigHandler struct{}

func NewConfigHandler() *ConfigHandler {
	return &ConfigHandler{}
}

/**
 * GetConfig 获取站点配置
 * GET /api/config
 */
func (h *ConfigHandler) GetConfig(c *gin.Context) {
	var config models.SiteConfig

	// 获取 ID 为 1 的配置
	if err := db.DB.First(&config, 1).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Config not found"})
		return
	}

	c.JSON(http.StatusOK, config)
}

/**
 * UpdateConfig 更新站点配置
 * PUT /api/config
 */
func (h *ConfigHandler) UpdateConfig(c *gin.Context) {
	var config models.SiteConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.ID = 1
	config.UpdatedAt = time.Now()

	if err := db.DB.Save(&config).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

/**
 * GetHealth 健康检查
 * GET /api/health
 */
func (h *ConfigHandler) GetHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"time":   time.Now(),
	})
}
