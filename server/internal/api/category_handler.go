package api

import (
	"net/http"

	"server/internal/repository"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	repo *repository.CategoryRepository
}

func NewCategoryHandler() *CategoryHandler {
	return &CategoryHandler{
		repo: &repository.CategoryRepository{},
	}
}

/**
 * GetCategories 获取所有分类
 * GET /api/categories
 */
func (h *CategoryHandler) GetCategories(c *gin.Context) {
	categories, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, categories)
}

/**
 * GetCategory 获取分类详情
 * GET /api/categories/:name
 */
func (h *CategoryHandler) GetCategory(c *gin.Context) {
	name := c.Param("name")

	category, err := h.repo.GetByName(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	c.JSON(http.StatusOK, category)
}

type TagHandler struct {
	repo *repository.TagRepository
}

func NewTagHandler() *TagHandler {
	return &TagHandler{
		repo: &repository.TagRepository{},
	}
}

/**
 * GetTags 获取所有标签
 * GET /api/tags
 */
func (h *TagHandler) GetTags(c *gin.Context) {
	tags, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tags)
}

/**
 * GetTag 获取标签详情
 * GET /api/tags/:name
 */
func (h *TagHandler) GetTag(c *gin.Context) {
	name := c.Param("name")

	tag, err := h.repo.GetByName(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tag not found"})
		return
	}

	c.JSON(http.StatusOK, tag)
}
