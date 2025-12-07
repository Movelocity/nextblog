# 快速迁移指南

## 背景

将独立的 `images` 表合并到 `file_resources` 表，统一管理所有文件资源。

## 主要变更

### 1. 数据库结构
- ✅ `FileResource` 模型添加了 `ThumbnailID` 字段
- ✅ `Image` 模型标记为废弃（仅用于迁移兼容）
- ✅ 数据库初始化移除 `Image` 表

### 2. API 更新
- ✅ `image_handler.go` 所有方法改用 `FileResource`
- ✅ 保持API响应格式兼容

### 3. 迁移逻辑
- ✅ 新增 `migrateImagesToFileResources()` 函数
- ✅ 自动检测并迁移旧数据
- ✅ 迁移完成后自动删除旧表

## 执行迁移

```bash
cd server

# 方式1: 使用 Makefile (推荐)
make migrate

# 方式2: 直接运行
go run ./cmd/migrate/main.go -source=../blogs -db=./data/nextblog.db -storage=./storage
```

## 迁移流程

```
1. 初始化数据库（创建 file_resources 表）
2. 迁移站点配置
3. 迁移博客文章
4. 迁移笔记
5. 迁移分类和标签
6. 【新增】迁移 images 表数据 → file_resources 表
7. 复制图片文件并记录到 file_resources 表
8. 删除旧 images 表
```

## 数据转换示例

### 旧 images 表
```
| id | filename      | path         | size | mime_type   | thumbnail_id | created_at |
|----|--------------|--------------|------|-------------|--------------|------------|
| 1  | photo.jpg    | /path/...    | 1024 | image/jpeg  | thumb-001    | 2024-01-01 |
```

### 新 file_resources 表
```
| id  | original_name | extension | mime_type  | size | category | storage_path | thumbnail_id | created_at | updated_at |
|-----|--------------|-----------|------------|------|----------|--------------|--------------|------------|------------|
| 1   | photo.jpg    | .jpg      | image/jpeg | 1024 | image    | /path/...    | thumb-001    | 2024-01-01 | 2024-01-01 |
```

## 安全措施

1. **自动跳过重复**: 已存在的记录会自动跳过
2. **支持重试**: 迁移失败可以重新运行
3. **保留旧表**: 迁移失败时保留旧表
4. **删除时机**: 仅在迁移成功后删除旧表

## 验证迁移

```bash
# 运行测试脚本
cd server
./test_migration.sh
```

预期输出：
```
✓ FileResource模型包含ThumbnailID字段
✓ Image模型已标记为废弃
✓ db.go已移除Image的AutoMigrate
✓ 迁移命令包含migrateImagesToFileResources函数
✓ image_handler已更新为使用FileResource
```

## API 兼容性

所有现有 API 端点保持不变：

- `POST /api/images/upload` - 上传图片
- `GET /api/images/:filename` - 获取图片
- `GET /api/images/:filename/thumbnail` - 获取缩略图
- `DELETE /api/images/:filename` - 删除图片
- `GET /api/images` - 获取图片列表

响应格式略有变化（增加了 `id` 和 `originalName` 字段）但保持向下兼容。

## 回滚

如需回滚：

1. 备份当前数据库
2. 恢复到迁移前的数据库备份
3. 切换到旧版本代码

## 故障排除

### 问题：迁移命令找不到 images 表
**解决**: 这是正常的，说明你的数据库是新创建的或已经迁移过了。

### 问题：部分图片迁移失败
**解决**: 查看日志中的警告信息，手动处理失败的记录，然后重新运行迁移。

### 问题：旧 images 表没有被删除
**解决**: 如果有任何迁移错误，旧表会被保留。修复错误后重新运行迁移即可。

### 问题：post_asset_relations 验证失败
**解决**: 
1. 查看日志中缺失的文件资源ID
2. 检查原始 images 表是否有对应记录
3. 手动创建缺失的 file_resources 记录
4. 重新运行迁移验证

## 相关文档

- 详细迁移文档: `IMAGE_TO_FILE_RESOURCE_MIGRATION.md`
- 测试脚本: `test_migration.sh`

## 注意事项

⚠️ **重要**: 运行迁移前请备份数据库文件 `data/nextblog.db`

✅ **安全**: 支持重复运行，不会造成数据重复或丢失

🔄 **兼容**: 前端无需修改，API 保持兼容

