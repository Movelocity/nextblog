# Next Blog Server Makefile

.PHONY: all build run migrate clean test docker-build docker-run help

# 变量
APP_NAME=nextblog-server
SERVER_BIN=bin/server
MIGRATE_BIN=bin/migrate
DB_PATH=./data/nextblog.db
SOURCE_PATH=../blogs

## help: 显示帮助信息
help:
	@echo "Available targets:"
	@echo "  make build        - 构建服务器和迁移工具"
	@echo "  make run          - 运行服务器"
	@echo "  make migrate      - 运行数据迁移"
	@echo "  make clean        - 清理构建文件"
	@echo "  make test         - 运行测试"
	@echo "  make docker-build - 构建 Docker 镜像"
	@echo "  make docker-run   - 运行 Docker 容器"
	@echo "  make dev          - 开发模式（热重载）"

## build: 构建服务器和迁移工具
build:
	@echo "Building server..."
	@mkdir -p bin
	@go build -o $(SERVER_BIN) ./cmd/server/main.go
	@echo "Building migrate tool..."
	@go build -o $(MIGRATE_BIN) ./cmd/migrate/main.go
	@echo "Build complete!"

## run: 运行服务器
run: build
	@echo "Starting server..."
	@$(SERVER_BIN)

## migrate: 运行数据迁移
migrate: build
	@echo "Running data migration..."
	@$(MIGRATE_BIN) -source $(SOURCE_PATH) -db $(DB_PATH) -storage ./storage

## clean: 清理构建文件和数据库
clean:
	@echo "Cleaning..."
	@rm -rf bin/
	@rm -rf data/*.db
	@rm -rf storage/images/*
	@rm -rf storage/uploads/*
	@rm -rf storage/thumbnails/*
	@echo "Clean complete!"

## test: 运行测试
test:
	@echo "Running tests..."
	@go test -v ./...

## docker-build: 构建 Docker 镜像
docker-build:
	@echo "Building Docker image..."
	@docker build -t $(APP_NAME):latest .

## docker-run: 运行 Docker 容器
docker-run:
	@echo "Running Docker container..."
	@docker run -d \
		-p 8080:8080 \
		-v $(PWD)/data:/app/data \
		-v $(PWD)/storage:/app/storage \
		--env-file .env \
		--name $(APP_NAME) \
		$(APP_NAME):latest

## docker-stop: 停止并删除 Docker 容器
docker-stop:
	@echo "Stopping Docker container..."
	@docker stop $(APP_NAME) || true
	@docker rm $(APP_NAME) || true

## dev: 开发模式（使用 air 实现热重载）
dev:
	@if ! command -v air > /dev/null; then \
		echo "Installing air..."; \
		go install github.com/air-verse/air@latest; \
	fi
	@echo "Starting development server with hot reload..."
	@air

## init: 初始化项目（创建必要的目录和文件）
init:
	@echo "Initializing project..."
	@mkdir -p bin data storage/images storage/uploads storage/thumbnails
	@touch storage/images/.gitkeep
	@touch storage/uploads/.gitkeep
	@touch storage/thumbnails/.gitkeep
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@echo "Initialization complete!"

## deps: 安装依赖
deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy
	@echo "Dependencies installed!"

.DEFAULT_GOAL := help

