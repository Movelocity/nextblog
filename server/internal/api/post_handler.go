package api

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
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
 * GET /api/posts?page=1&pageSize=10&published=true&categories=cat1+cat2&tags=tag1+tag2&order=asc
 *
 * 参数说明：
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 10）
 * - published: 发布状态过滤（true/false，未指定则根据登录状态决定）
 * - categories: 分类过滤，多个分类用 + 分隔（需同时匹配所有分类）
 * - tags: 标签过滤，多个标签用 + 分隔（需同时匹配所有标签）
 * - order: 排序方式（asc=升序，默认降序）
 */
func (h *PostHandler) GetPosts(c *gin.Context) {
	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	// 解析分类和标签过滤参数
	_categories := c.Query("categories")
	_tags := c.Query("tags")
	var categories []string
	var tags []string
	if _categories != "" {
		categories = strings.Split(_categories, "+")
	}
	if _tags != "" {
		tags = strings.Split(_tags, "+")
	}

	// 解析排序参数
	order := c.Query("order")

	// 解析发布状态过滤参数
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

	// 查询文章列表
	posts, total, err := h.repo.GetAll(page, pageSize, order, published, categories, tags)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 计算总页数
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
	if post.Description == "" {
		post.Description = post.Content[:100]
	}

	if err := h.repo.Create(&post); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, post)
}

/**
 * UpdatePost 更新文章（支持局部字段更新）
 * PUT /api/posts/:id
 * 只更新请求中提供的非零值字段，未提供的字段保持原值
 */
func (h *PostHandler) UpdatePost(c *gin.Context) {
	id := c.Param("id")

	// 检查文章是否存在
	existingPost, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	var input models.Post
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 合并字段：只更新请求中提供的非零值字段
	if input.Title != "" {
		existingPost.Title = input.Title
	}
	if input.Description != "" {
		existingPost.Description = input.Description
	}
	if input.Content != "" {
		existingPost.Content = input.Content
	}
	// Published 是 bool 类型，需要特殊处理（始终更新）
	existingPost.Published = input.Published
	// Tags 和 Categories 是数组，nil 表示未提供，空数组表示清空
	if input.Tags != nil {
		existingPost.Tags = input.Tags
	}
	if input.Categories != nil {
		existingPost.Categories = input.Categories
	}

	existingPost.UpdatedAt = time.Now()

	// 如果内容更新了但描述为空，自动生成描述
	if existingPost.Description == "" && existingPost.Content != "" {
		contentRunes := []rune(existingPost.Content)
		if len(contentRunes) > 100 {
			existingPost.Description = string(contentRunes[:100])
		} else {
			existingPost.Description = existingPost.Content
		}
	}

	if err := h.repo.Update(existingPost); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, existingPost)
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
