package config

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	Port    string
	GinMode string

	// Database
	DBPath string

	// Storage
	StoragePath    string
	UploadMaxSize  int64

	// CORS
	CORSAllowedOrigins []string

	// JWT
	JWTSecret string
	JWTExpiry string

	// Site
	SiteName        string
	SiteDescription string
	ICPInfo         string
}

var AppConfig *Config

/**
 * LoadConfig 加载配置文件
 */
func LoadConfig() *Config {
	// 加载 .env 文件
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	config := &Config{
		Port:    getEnv("PORT", "8080"),
		GinMode: getEnv("GIN_MODE", "debug"),
		DBPath:  getEnv("DB_PATH", "./data/nextblog.db"),
		StoragePath: getEnv("STORAGE_PATH", "./storage"),
		UploadMaxSize: getEnvAsInt64("UPLOAD_MAX_SIZE", 10485760), // 10MB
		CORSAllowedOrigins: getEnvAsSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000"}),
		JWTSecret: getEnv("JWT_SECRET", "your-secret-key-here"),
		JWTExpiry: getEnv("JWT_EXPIRY", "24h"),
		SiteName:        getEnv("SITE_NAME", "Next Blog"),
		SiteDescription: getEnv("SITE_DESCRIPTION", "A modern blog management system"),
		ICPInfo:         getEnv("ICP_INFO", "本地开发不需备案"),
	}

	AppConfig = config
	return config
}

/**
 * getEnv 获取环境变量，如果不存在则返回默认值
 */
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

/**
 * getEnvAsInt64 获取环境变量并转换为 int64
 */
func getEnvAsInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		var result int64
		if _, err := fmt.Sscanf(value, "%d", &result); err == nil {
			return result
		}
	}
	return defaultValue
}

/**
 * getEnvAsSlice 获取环境变量并转换为字符串切片（逗号分隔）
 */
func getEnvAsSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}

