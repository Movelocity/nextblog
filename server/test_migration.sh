#!/bin/bash

# 迁移测试脚本
# 用于验证Image表到FileResource表的迁移

echo "==================================="
echo "Image -> FileResource 迁移测试"
echo "==================================="

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查函数
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 存在"
        return 0
    else
        echo -e "${RED}✗${NC} $1 不存在"
        return 1
    fi
}

echo ""
echo "1. 检查关键文件是否已更新..."
echo "-----------------------------------"

# 检查模型文件
check_file "internal/models/file_resource.go"
check_file "internal/models/models.go"

# 检查API文件
check_file "internal/api/image_handler.go"

# 检查数据库初始化文件
check_file "internal/db/db.go"

# 检查迁移文件
check_file "cmd/migrate/main.go"

echo ""
echo "2. 检查关键代码变更..."
echo "-----------------------------------"

# 检查FileResource模型是否包含ThumbnailID字段
if grep -q "ThumbnailID.*string.*json:\"thumbnail_id" internal/models/file_resource.go; then
    echo -e "${GREEN}✓${NC} FileResource模型包含ThumbnailID字段"
else
    echo -e "${RED}✗${NC} FileResource模型缺少ThumbnailID字段"
fi

# 检查Image模型是否标记为废弃
if grep -q "已废弃.*FileResource" internal/models/models.go; then
    echo -e "${GREEN}✓${NC} Image模型已标记为废弃"
else
    echo -e "${RED}✗${NC} Image模型未标记为废弃"
fi

# 检查db.go是否不再包含Image的AutoMigrate
if ! grep -q "models.Image{}" internal/db/db.go | grep -v "//"; then
    echo -e "${GREEN}✓${NC} db.go已移除Image的AutoMigrate"
else
    echo -e "${RED}✗${NC} db.go仍包含Image的AutoMigrate"
fi

# 检查迁移命令是否包含migrateImagesToFileResources函数
if grep -q "func migrateImagesToFileResources" cmd/migrate/main.go; then
    echo -e "${GREEN}✓${NC} 迁移命令包含migrateImagesToFileResources函数"
else
    echo -e "${RED}✗${NC} 迁移命令缺少migrateImagesToFileResources函数"
fi

# 检查image_handler是否使用FileResource
if grep -q "models.FileResource" internal/api/image_handler.go; then
    echo -e "${GREEN}✓${NC} image_handler已更新为使用FileResource"
else
    echo -e "${RED}✗${NC} image_handler未使用FileResource"
fi

echo ""
echo "3. 代码统计..."
echo "-----------------------------------"

echo "FileResource使用次数: $(grep -r "models.FileResource" internal/ cmd/ | wc -l)"
echo "Image使用次数 (排除注释): $(grep -r "models.Image" internal/ cmd/ | grep -v "//" | grep -v "已废弃" | wc -l)"

echo ""
echo "==================================="
echo "测试完成"
echo "==================================="

