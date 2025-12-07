# 安装 JWT 认证系统依赖

## 必需步骤

在运行服务器之前，需要安装 JWT 库依赖：

```bash
cd server
go get github.com/golang-jwt/jwt/v5
go mod tidy
```

## 验证安装

检查 `go.mod` 文件，应该包含：

```go
require (
    github.com/golang-jwt/jwt/v5 v5.x.x
    // ... 其他依赖
)
```

## 如果遇到问题

### 1. 网络问题

如果无法下载依赖，可以配置 Go 代理：

```bash
go env -w GOPROXY=https://goproxy.cn,direct
```

或者使用其他代理：

```bash
go env -w GOPROXY=https://goproxy.io,direct
```

### 2. 版本冲突

如果有版本冲突，运行：

```bash
go mod tidy
go mod verify
```

### 3. 清理缓存

如果持续有问题：

```bash
go clean -modcache
go mod download
```

## 运行服务器

安装依赖后，可以正常启动服务器：

```bash
# 使用 Makefile
make run

# 或直接运行
go run cmd/server/main.go
```

## 检查是否成功

服务器启动后，应该能够访问认证接口：

```bash
curl http://localhost:8080/api/auth/login
# 应该返回 400 错误（因为没有提供凭据），而不是 404
```

如果返回 404 或其他路由错误，说明依赖未正确安装。

