#!/bin/bash
# 测试运行时环境变量注入功能

set -e

echo "🧪 测试 Docker 运行时环境变量注入..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi

# 检查 docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ 未找到 docker-compose.yml${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  未找到 .env 文件，使用 .env.example 创建...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ 已从 .env.example 创建 .env 文件${NC}"
    else
        echo -e "${RED}❌ 未找到 .env.example 文件${NC}"
        exit 1
    fi
fi

echo "📋 当前环境变量配置："
grep -E "^(API_BASE_URL|RUNTIME_ENV_VARS)=" .env || echo "  (未找到相关配置)"
echo ""

# 构建镜像（如果需要）
echo "🔨 构建 Docker 镜像..."
docker build -t nextblog-test:latest . || {
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
}
echo -e "${GREEN}✓ 镜像构建成功${NC}"
echo ""

# 停止并删除旧容器
echo "🧹 清理旧容器..."
docker-compose down 2>/dev/null || true
echo ""

# 启动容器
echo "🚀 启动容器..."
docker-compose up -d || {
    echo -e "${RED}❌ 启动失败${NC}"
    docker-compose logs
    exit 1
}
echo -e "${GREEN}✓ 容器启动成功${NC}"
echo ""

# 等待容器就绪
echo "⏳ 等待容器就绪..."
sleep 5

# 检查容器状态
CONTAINER_NAME="nextblog-app"
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ 容器未运行${NC}"
    docker-compose logs
    exit 1
fi
echo -e "${GREEN}✓ 容器正在运行${NC}"
echo ""

# 测试 1: 检查 runtime-env.js 是否生成
echo "📝 测试 1: 检查 runtime-env.js 是否生成"
if docker exec "$CONTAINER_NAME" test -f /app/public/runtime-env.js; then
    echo -e "${GREEN}✓ runtime-env.js 文件存在${NC}"
else
    echo -e "${RED}❌ runtime-env.js 文件不存在${NC}"
    exit 1
fi
echo ""

# 测试 2: 检查文件内容
echo "📝 测试 2: 检查 runtime-env.js 内容"
echo "----------------------------------------"
docker exec "$CONTAINER_NAME" cat /app/public/runtime-env.js
echo "----------------------------------------"
echo ""

# 测试 3: 验证 API_BASE_URL 是否注入
echo "📝 测试 3: 验证环境变量是否正确注入"
RUNTIME_CONFIG=$(docker exec "$CONTAINER_NAME" cat /app/public/runtime-env.js)
if echo "$RUNTIME_CONFIG" | grep -q "API_BASE_URL"; then
    echo -e "${GREEN}✓ API_BASE_URL 已注入${NC}"
    # 提取并显示值
    API_URL=$(echo "$RUNTIME_CONFIG" | grep "API_BASE_URL" | sed 's/.*"\(.*\)".*/\1/')
    echo "  值: $API_URL"
else
    echo -e "${RED}❌ API_BASE_URL 未找到${NC}"
    exit 1
fi
echo ""

# 测试 4: 检查静态资源是否存在
echo "📝 测试 4: 检查静态资源是否恢复"
STATIC_FILES=("favicon.svg" "next.svg" "vercel.svg")
ALL_EXIST=true
for file in "${STATIC_FILES[@]}"; do
    if docker exec "$CONTAINER_NAME" test -f "/app/public/$file"; then
        echo -e "${GREEN}✓ $file 存在${NC}"
    else
        echo -e "${RED}❌ $file 不存在${NC}"
        ALL_EXIST=false
    fi
done
echo ""

# 测试 5: 测试 HTTP 访问
echo "📝 测试 5: 测试 HTTP 访问 runtime-env.js"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/runtime-env.js)
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ HTTP 访问成功 (状态码: $HTTP_STATUS)${NC}"
    echo "  内容预览:"
    curl -s http://localhost:3000/runtime-env.js | head -5
else
    echo -e "${RED}❌ HTTP 访问失败 (状态码: $HTTP_STATUS)${NC}"
    exit 1
fi
echo ""

# 测试 6: 检查容器日志
echo "📝 测试 6: 检查容器启动日志"
echo "----------------------------------------"
docker logs "$CONTAINER_NAME" 2>&1 | grep -A 10 "Generating runtime-env.js" || echo "(未找到相关日志)"
echo "----------------------------------------"
echo ""

# 总结
echo "════════════════════════════════════════"
if [ "$ALL_EXIST" = true ]; then
    echo -e "${GREEN}✅ 所有测试通过！${NC}"
    echo ""
    echo "下一步："
    echo "1. 访问 http://localhost:3000 查看应用"
    echo "2. 在浏览器控制台运行: console.log(window.__RUNTIME_CONFIG__)"
    echo "3. 停止容器: docker-compose down"
else
    echo -e "${YELLOW}⚠️  部分测试失败，请检查上述输出${NC}"
fi
echo "════════════════════════════════════════"

