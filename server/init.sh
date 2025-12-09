#!/bin/bash

# 初始化脚本 - 设置 Go 服务器开发环境

set -e

echo "==================================="
echo "Next Blog Server - 初始化"
echo "==================================="

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "错误: 未找到 Go 环境，请先安装 Go 1.22 或更高版本"
    exit 1
fi

GO_VERSION=$(go version | awk '{print $3}')
echo "✓ Go 版本: $GO_VERSION"

# 创建必要的目录
echo ""
echo "创建目录结构..."
mkdir -p bin
mkdir -p data
mkdir -p data/thumbnails

# 创建 .gitkeep 文件
touch data/thumbnails/.gitkeep

echo "✓ 目录创建完成"

# 复制环境变量文件
if [ ! -f .env ]; then
    echo ""
    echo "创建 .env 文件..."
    cat > .env << 'EOF'
# Server Configuration
PORT=8666
GIN_MODE=debug

# Database Configuration
DB_PATH=./data/nextblog.db

# Storage Configuration
STORAGE_PATH=./data
UPLOAD_MAX_SIZE=10485760

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT Configuration (for future auth)
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# Site Configuration
SITE_NAME=Next Blog
SITE_DESCRIPTION=A modern blog management system
ICP_INFO=本地开发不需备案
EOF
    echo "✓ .env 文件创建完成"
else
    echo "✓ .env 文件已存在"
fi

# 安装 Go 依赖
echo ""
echo "安装 Go 依赖..."
go mod download
go mod tidy
echo "✓ 依赖安装完成"

# 构建项目
echo ""
echo "构建项目..."
go build -o bin/server ./cmd/server/main.go
go build -o bin/migrate ./cmd/migrate/main.go
echo "✓ 构建完成"

# 提示下一步操作
echo ""
echo "==================================="
echo "初始化完成！"
echo "==================================="
echo ""
echo "下一步操作："
echo ""
echo "1. 运行数据迁移（将 Next.js 项目的数据迁移到 SQLite）："
echo "   make migrate"
echo ""
echo "2. 启动服务器："
echo "   make run"
echo ""
echo "服务器将运行在: http://localhost:8666"
echo "API 文档: 查看 README.md"
echo ""

