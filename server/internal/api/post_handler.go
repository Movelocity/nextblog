package api

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"server/internal/middleware"
	"server/internal/models"
	"server/internal/repository"
	"server/internal/service"

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
	order := c.Query("order")

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

	posts, total, err := h.repo.GetAll(page, pageSize, order, published)
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
 * GET /api/posts/search?keyword=xxx&page=1&pageSize=10&highlight=true&contextSize=50
 *
 * 参数说明：
 * - keyword: 搜索关键词（必填）
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 10）
 * - highlight: 是否启用高级搜索返回匹配上下文（默认 false，仅登录用户可用）
 * - contextSize: 上下文窗口大小（默认 50，仅 highlight=true 时有效）
 *
 * 搜索范围：
 * - 未登录：仅搜索已发布文章
 * - 已登录：搜索所有文章（包括草稿）
 */
func (h *PostHandler) SearchPosts(c *gin.Context) {
	keyword := c.Query("keyword")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "keyword is required"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	// 检查用户是否已登录
	_, isAuthenticated := middleware.GetUserID(c)

	// 根据登录状态决定搜索范围
	var published *bool
	if !isAuthenticated {
		// 未登录用户只能搜索已发布文章
		trueValue := true
		published = &trueValue
	}
	// 已登录用户搜索所有文章（published 为 nil）

	// 解析高级搜索参数（仅登录用户可用）
	highlight := c.Query("highlight") == "true" && isAuthenticated
	contextSize, _ := strconv.Atoi(c.DefaultQuery("contextSize", "50"))
	if contextSize <= 0 {
		contextSize = service.DefaultContextSize
	}

	// 根据是否启用高级搜索选择不同的查询方式
	if highlight {
		// 高级搜索：需要完整内容来提取上下文
		posts, total, err := h.repo.SearchWithContent(keyword, page, pageSize, published)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// 构建带匹配信息的结果
		results := make([]models.PostSearchResult, len(posts))
		for i, post := range posts {
			matches, matchCount := service.ExtractAllPostMatches(post.Title, post.Description, post.Content, keyword, contextSize)
			results[i] = models.PostSearchResult{
				PostSummary: models.PostSummary{
					ID:          post.ID,
					Title:       post.Title,
					Description: post.Description,
					Published:   post.Published,
					CreatedAt:   post.CreatedAt,
					UpdatedAt:   post.UpdatedAt,
					Tags:        post.Tags,
					Categories:  post.Categories,
				},
				MatchCount: matchCount,
				Matches:    matches,
			}
		}

		totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
		c.JSON(http.StatusOK, models.PostSearchResponse{
			Posts:      results,
			Total:      total,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: totalPages,
		})
	} else {
		// 普通搜索
		posts, total, err := h.repo.Search(keyword, page, pageSize, published)
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
}
