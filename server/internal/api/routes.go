package api

import (
	"nextblog-server/internal/config"
	"nextblog-server/internal/db"
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

		// 认证路由（无需认证）
		authHandler := NewAuthHandler(db.DB)
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/check", middleware.AuthMiddleware(db.DB), authHandler.CheckAuth)
			auth.GET("/profile", middleware.AuthMiddleware(db.DB), authHandler.GetProfile)
			auth.POST("/refresh", middleware.AuthMiddleware(db.DB), authHandler.RefreshToken)
		}

		// 站点配置（读取公开，更新需要认证）
		api.GET("/config", configHandler.GetConfig)
		api.PUT("/config", middleware.AuthMiddleware(db.DB), middleware.RequireRole("admin"), configHandler.UpdateConfig)

		// 文章路由（读取公开，写入需要认证）
		postHandler := NewPostHandler()
		posts := api.Group("/posts")
		{
			// 公开路由
			posts.GET("", postHandler.GetPosts)
			posts.GET("/search", postHandler.SearchPosts)
			posts.GET("/category/:category", postHandler.GetPostsByCategory)
			posts.GET("/tag/:tag", postHandler.GetPostsByTag)
			posts.GET("/:id", postHandler.GetPost)

			// 需要认证的路由
			postsAuth := posts.Group("", middleware.AuthMiddleware(db.DB))
			{
				postsAuth.POST("", postHandler.CreatePost)
				postsAuth.PUT("/:id", postHandler.UpdatePost)
				postsAuth.DELETE("/:id", postHandler.DeletePost)
			}

			// 博客资产路由（需要认证）
			assetHandler := NewAssetHandler(fileStorage)
			assetsAuth := posts.Group("", middleware.AuthMiddleware(db.DB))
			{
				assetsAuth.GET("/:id/assets", assetHandler.ListAssets)
				assetsAuth.POST("/:id/assets", assetHandler.UploadAsset)
				assetsAuth.GET("/:id/assets/:fileId", assetHandler.GetAsset)
				assetsAuth.DELETE("/:id/assets/:fileId", assetHandler.DeleteAsset)
			}
		}

		// 笔记路由（需要认证）
		noteHandler := NewNoteHandler()
		notes := api.Group("/notes")
		{
			// 公开路由
			notes.GET("/public", noteHandler.GetPublicNotes)

			// 需要认证的路由
			notesAuth := notes.Group("", middleware.AuthMiddleware(db.DB))
			{
				notesAuth.GET("", noteHandler.GetNotes)
				notesAuth.POST("", noteHandler.CreateNote)
				notesAuth.GET("/date/:date", noteHandler.GetNotesByDate)
				notesAuth.GET("/detail/:id", noteHandler.GetNote)
				notesAuth.PUT("/:id", noteHandler.UpdateNote)
				notesAuth.DELETE("/:id", noteHandler.DeleteNote)
			}
		}

		// 分类路由（公开）
		categoryHandler := NewCategoryHandler()
		categories := api.Group("/categories")
		{
			categories.GET("", categoryHandler.GetCategories)
			categories.GET("/:name", categoryHandler.GetCategory)
		}

		// 标签路由（公开）
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
			// 公开路由（查看图片）
			images.GET("", imageHandler.ListImages)
			images.GET("/:filename", imageHandler.GetImage)
			images.GET("/:filename/thumbnail", imageHandler.GetThumbnail)

			// 需要认证的路由（上传和删除）
			imagesAuth := images.Group("", middleware.AuthMiddleware(db.DB))
			{
				imagesAuth.POST("/upload", imageHandler.UploadImage)
				imagesAuth.DELETE("/:filename", imageHandler.DeleteImage)
			}
		}

		// 图片编辑路由（需要认证）
		imageEditHandler := NewImageEditHandler()
		imageEdit := api.Group("/image-edit", middleware.AuthMiddleware(db.DB))
		{
			imageEdit.GET("", imageEditHandler.GetTasks)
			imageEdit.POST("", imageEditHandler.CreateTask)
			imageEdit.PUT("", imageEditHandler.StopTask)
			imageEdit.PATCH("", imageEditHandler.RetryTask)
			imageEdit.DELETE("", imageEditHandler.DeleteTask)
		}

		// 系统状态路由（仅管理员）
		systemHandler := NewSystemHandler()
		system := api.Group("/system", middleware.AuthMiddleware(db.DB), middleware.RequireRole("admin"))
		{
			system.GET("/status", systemHandler.GetSystemStatus)
		}
	}
}
