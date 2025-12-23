package api

import (
	"server/internal/config"
	"server/internal/db"
	"server/internal/middleware"
	"server/internal/storage"

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
	// 在所有API路由上应用Auth中间件，尝试解析token但不强制要求
	api := router.Group("/api", middleware.Auth(db.DB))
	{
		// 健康检查
		configHandler := NewConfigHandler()
		api.GET("/health", configHandler.GetHealth)

		// 认证路由
		authHandler := NewAuthHandler(db.DB)
		auth := api.Group("/auth")
		{
			// 公开路由
			auth.GET("/registration-status", authHandler.GetRegistrationStatus)
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)

			// 需要认证的路由
			auth.GET("/check", middleware.MustLogin(), authHandler.CheckAuth)
			auth.GET("/profile", middleware.MustLogin(), authHandler.GetProfile)
			auth.POST("/refresh", middleware.MustLogin(), authHandler.RefreshToken)
		}

		// 站点配置（读取公开，更新需要认证）
		api.GET("/config", configHandler.GetConfig)
		api.PUT("/config", middleware.MustLogin(), middleware.RequireRole("admin"), configHandler.UpdateConfig)

		// 文章路由（读取公开，写入需要认证）
		postHandler := NewPostHandler()
		posts := api.Group("/posts")
		{
			// 公开路由（已通过Auth中间件解析用户信息）
			posts.GET("", postHandler.GetPosts)
			posts.GET("/search", postHandler.SearchPosts)
			posts.GET("/category/:category", postHandler.GetPostsByCategory)
			posts.GET("/tag/:tag", postHandler.GetPostsByTag)
			posts.GET("/:id", postHandler.GetPost)

			// 需要认证的路由
			postsAuth := posts.Group("", middleware.MustLogin())
			{
				postsAuth.POST("", postHandler.CreatePost)
				postsAuth.PUT("/:id", postHandler.UpdatePost)
				postsAuth.DELETE("/:id", postHandler.DeletePost)
			}

		}

		// 文件资源路由
		assetHandler := NewAssetHandler(fileStorage)
		assets := api.Group("/assets")
		{
			// 公开路由
			assets.GET("/:fileId", assetHandler.GetAsset)

			// 需要认证的路由
			assetsAuth := assets.Group("", middleware.MustLogin())
			{
				assetsAuth.GET("", assetHandler.ListAssets)
				assetsAuth.POST("", assetHandler.UploadAsset)
				assetsAuth.DELETE("/:fileId", assetHandler.DeleteAsset)
			}
		}

		// 笔记路由
		noteHandler := NewNoteHandler()
		notes := api.Group("/notes")
		{
			// 公开路由（已通过Auth中间件解析用户信息，支持根据登录状态返回不同范围数据）
			notes.GET("/public", noteHandler.GetPublicNotes)
			notes.GET("", noteHandler.GetNotes)
			notes.GET("/search", noteHandler.SearchNotes) // 搜索笔记
			notes.GET("/stats", noteHandler.GetStats)     // 获取统计数据（已登录看全部，未登录看公开）

			// 需要认证的路由
			notesAuth := notes.Group("", middleware.MustLogin())
			{
				notesAuth.POST("", noteHandler.CreateNote)
				notesAuth.GET("/date/:date", noteHandler.GetNotesByDate)
				notesAuth.GET("/detail/:id", noteHandler.GetNote)
				notesAuth.PUT("/:id", noteHandler.UpdateNote)
				notesAuth.PUT("/:id/archive", noteHandler.ArchiveNote) // 归档/取消归档笔记
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

			// 需要认证的路由（上传和删除）
			imagesAuth := images.Group("", middleware.MustLogin())
			{
				imagesAuth.POST("/upload", imageHandler.UploadImage)
				imagesAuth.DELETE("/:filename", imageHandler.DeleteImage)
			}
		}

		// 图片编辑路由（需要认证）
		imageEditHandler := NewImageEditHandler()
		imageEdit := api.Group("/image-edit", middleware.MustLogin())
		{
			imageEdit.GET("", imageEditHandler.GetTasks)
			imageEdit.POST("", imageEditHandler.CreateTask)
			imageEdit.PUT("", imageEditHandler.StopTask)
			imageEdit.PATCH("", imageEditHandler.RetryTask)
			imageEdit.DELETE("", imageEditHandler.DeleteTask)
		}

		// 系统状态路由（仅管理员）
		systemHandler := NewSystemHandler(fileStorage)
		system := api.Group("/system", middleware.MustLogin(), middleware.RequireRole("admin"))
		{
			system.GET("/status", systemHandler.GetSystemStatus)
			system.POST("/cleanup-thumbnails", systemHandler.CleanupThumbnailCache)
		}
	}
}
