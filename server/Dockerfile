FROM golang:1.22-alpine AS builder

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache gcc musl-dev sqlite-dev

# 复制 go mod 文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o /app/server ./cmd/server/main.go
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o /app/migrate ./cmd/migrate/main.go

# 运行阶段
FROM alpine:latest

WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache ca-certificates sqlite-libs

# 从构建阶段复制二进制文件
COPY --from=builder /app/server /app/server
COPY --from=builder /app/migrate /app/migrate

# 创建必要的目录
RUN mkdir -p /app/data /app/storage/images /app/storage/uploads /app/storage/thumbnails

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# 启动服务器
CMD ["/app/server"]

