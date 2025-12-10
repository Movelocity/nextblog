package api

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"server/internal/models"
	"server/internal/repository"

	"server/internal/middleware"

	"github.com/gin-gonic/gin"
)

type PostHandler struct {
	repo *repository.PostRepository
}

func NewPostHandler() *PostHandler {
	return &PostHandler{
		repo: &repository.PostRepository{},
	}
}

/**
 * GetPosts 获取文章列表
 * GET /api/posts?page=1&pageSize=10&published=true
 */
func (h *PostHandler) GetPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	var published *bool
	if publishedStr := c.Query("published"); publishedStr != "" {
		val := publishedStr == "true"
		published = &val
	}

	// 检查用户是否已登录
	_, isAuthenticated := middleware.GetUserID(c)

	// 如果用户未登录，强制只返回已发布的文章
	if !isAuthenticated {
		trueValue := true
		published = &trueValue
	}
	// 如果用户已登录且没有指定published参数，返回所有文章（published为nil）

	posts, total, err := h.repo.GetAll(page, pageSize, published)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	c.JSON(http.StatusOK, models.PostListResponse{
		Posts:      posts,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

/**
 * GetPost 获取文章详情
 * GET /api/posts/:id
 */
func (h *PostHandler) GetPost(c *gin.Context) {
	id := c.Param("id")

	post, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	c.JSON(http.StatusOK, post)
}

/**
 * CreatePost 创建文章
 * POST /api/posts
 */
func (h *PostHandler) CreatePost(c *gin.Context) {
	var post models.Post
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 生成 ID（使用时间戳）
	post.ID = fmt.Sprintf("%d", time.Now().UnixMilli())
	post.CreatedAt = time.Now()
	post.UpdatedAt = time.Now()

	if err := h.repo.Create(&post); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, post)
}

/**
 * UpdatePost 更新文章
 * PUT /api/posts/:id
 */
func (h *PostHandler) UpdatePost(c *gin.Context) {
	id := c.Param("id")

	// 检查文章是否存在
	existingPost, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	var post models.Post
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post.ID = id
	post.CreatedAt = existingPost.CreatedAt
	post.UpdatedAt = time.Now()

	if err := h.repo.Update(&post); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, post)
}

/**
 * DeletePost 删除文章
 * DELETE /api/posts/:id
 */
func (h *PostHandler) DeletePost(c *gin.Context) {
	id := c.Param("id")

	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

/**
 * GetPostsByCategory 根据分类获取文章
 * GET /api/posts/category/:category?page=1&pageSize=10
 */
func (h *PostHandler) GetPostsByCategory(c *gin.Context) {
	category := c.Param("category")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	posts, total, err := h.repo.GetByCategory(category, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	c.JSON(http.StatusOK, models.PostListResponse{
		Posts:      posts,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

/**
 * GetPostsByTag 根据标签获取文章
 * GET /api/posts/tag/:tag?page=1&pageSize=10
 */
func (h *PostHandler) GetPostsByTag(c *gin.Context) {
	tag := c.Param("tag")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	posts, total, err := h.repo.GetByTag(tag, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	c.JSON(http.StatusOK, models.PostListResponse{
		Posts:      posts,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

/**
 * SearchPosts 搜索文章
 * GET /api/posts/search?keyword=xxx&page=1&pageSize=10
 */
func (h *PostHandler) SearchPosts(c *gin.Context) {
	keyword := c.Query("keyword")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "keyword is required"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	posts, total, err := h.repo.Search(keyword, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	c.JSON(http.StatusOK, models.PostListResponse{
		Posts:      posts,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}
