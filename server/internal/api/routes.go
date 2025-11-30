package api

import (
	"nextblog-server/internal/config"
	"nextblog-server/internal/middleware"
	"nextblog-server/internal/storage"

	"github.com/gin-gonic/gin"
)

/**
 * SetupRoutes 设置路由
 */
func SetupRoutes(router *gin.Engine, allowedOrigins []string) {
	// 中间件
	router.Use(middleware.CORS(allowedOrigins))
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())
	
	// 初始化存储
	fileStorage := storage.NewLocalFileStorage(config.AppConfig.StoragePath)

	// API 路由组
	api := router.Group("/api")
	{
		// 健康检查
		configHandler := NewConfigHandler()
		api.GET("/health", configHandler.GetHealth)

		// 站点配置
		api.GET("/config", configHandler.GetConfig)
		api.PUT("/config", configHandler.UpdateConfig)

		// 文章路由
		postHandler := NewPostHandler()
		posts := api.Group("/posts")
		{
			posts.GET("", postHandler.GetPosts)
			posts.POST("", postHandler.CreatePost)
			posts.GET("/search", postHandler.SearchPosts)
			posts.GET("/category/:category", postHandler.GetPostsByCategory)
			posts.GET("/tag/:tag", postHandler.GetPostsByTag)
			posts.GET("/:id", postHandler.GetPost)
			posts.PUT("/:id", postHandler.UpdatePost)
			posts.DELETE("/:id", postHandler.DeletePost)
			
			// 博客资产路由
			assetHandler := NewAssetHandler(fileStorage)
			posts.GET("/:postId/assets", assetHandler.ListAssets)
			posts.POST("/:postId/assets", assetHandler.UploadAsset)
			posts.GET("/:postId/assets/:fileId", assetHandler.GetAsset)
			posts.DELETE("/:postId/assets/:fileId", assetHandler.DeleteAsset)
		}

		// 笔记路由
		noteHandler := NewNoteHandler()
		notes := api.Group("/notes")
		{
			notes.GET("", noteHandler.GetNotes)
			notes.POST("", noteHandler.CreateNote)
			notes.GET("/public", noteHandler.GetPublicNotes)
			notes.GET("/date/:date", noteHandler.GetNotesByDate)
			notes.GET("/detail/:id", noteHandler.GetNote)
			notes.PUT("/:id", noteHandler.UpdateNote)
			notes.DELETE("/:id", noteHandler.DeleteNote)
		}

		// 分类路由
		categoryHandler := NewCategoryHandler()
		categories := api.Group("/categories")
		{
			categories.GET("", categoryHandler.GetCategories)
			categories.GET("/:name", categoryHandler.GetCategory)
		}

		// 标签路由
		tagHandler := NewTagHandler()
		tags := api.Group("/tags")
		{
			tags.GET("", tagHandler.GetTags)
			tags.GET("/:name", tagHandler.GetTag)
		}

		// 图片路由
		imageHandler := NewImageHandler(fileStorage)
		images := api.Group("/images")
		{
			images.GET("", imageHandler.ListImages)
			images.POST("/upload", imageHandler.UploadImage)
			images.GET("/:filename", imageHandler.GetImage)
			images.GET("/:filename/thumbnail", imageHandler.GetThumbnail)
			images.DELETE("/:filename", imageHandler.DeleteImage)
		}
		
		// 图片编辑路由
		imageEditHandler := NewImageEditHandler()
		imageEdit := api.Group("/image-edit")
		{
			imageEdit.GET("", imageEditHandler.GetTasks)
			imageEdit.POST("", imageEditHandler.CreateTask)
			imageEdit.PUT("", imageEditHandler.StopTask)
			imageEdit.PATCH("", imageEditHandler.RetryTask)
			imageEdit.DELETE("", imageEditHandler.DeleteTask)
		}
		
		// 系统状态路由
		systemHandler := NewSystemHandler()
		system := api.Group("/system")
		{
			system.GET("/status", systemHandler.GetSystemStatus)
		}
	}
}
