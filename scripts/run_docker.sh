#!/bin/bash

# 定义环境变量，根据需要修改
JWT_SECRET="my-ultra-secret-jwt-key"
ADMIN_EMAIL="nextblog@example.com"
ADMIN_PASSWORD="nextblog123"
BLOG_ROOT_DIR="./blogs"
PORT=3003
IMAGE_NAME="nextblog:latest"

# 启动 Docker 容器
docker run -d \
  --name nextblog_l \
  -e NODE_ENV="$NODE_ENV" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e ADMIN_EMAIL="$ADMIN_EMAIL" \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  -e BLOG_ROOT_DIR="blogs" \
  -v "$BLOG_ROOT_DIR:/app/blogs" \
  -p "$PORT:3000" \
  "$IMAGE_NAME"