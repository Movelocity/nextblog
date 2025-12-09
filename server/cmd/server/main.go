package main

import (
	"fmt"
	"log"

	"server/internal/api"
	"server/internal/config"
	"server/internal/db"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.LoadConfig()
	log.Printf("Starting server with config: Port=%s, DBPath=%s", cfg.Port, cfg.DBPath)

	// 设置 Gin 模式
	gin.SetMode(cfg.GinMode)

	// 初始化数据库
	if err := db.InitDB(cfg.DBPath); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.CloseDB()

	// 创建路由
	router := gin.Default()

	// 设置路由
	api.SetupRoutes(router, cfg.CORSAllowedOrigins)

	// 启动服务器
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server starting on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
