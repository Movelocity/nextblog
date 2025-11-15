## ADDED Requirements

### Requirement: 用户脚本后端存储
系统 MUST 提供后端 RESTful API 用于持久化存储用户自定义脚本,脚本 SHALL 保存在文件系统中,支持跨设备访问和管理。

#### Scenario: 获取所有用户脚本(无需认证)
- **WHEN** 客户端发送 `GET /api/json-editor/scripts` 请求
- **THEN** 返回所有已保存的脚本列表(包含 id、名称、描述、代码、创建时间、更新时间)
- **AND** 响应状态码为 200
- **AND** 无需认证即可访问

#### Scenario: 获取单个脚本详情(无需认证)
- **WHEN** 客户端发送 `GET /api/json-editor/scripts/[id]` 请求
- **THEN** 返回指定 id 的脚本完整信息
- **AND** 响应状态码为 200
- **AND** 如果脚本不存在,返回 404 错误
- **AND** 无需认证即可访问

#### Scenario: 创建新脚本(需要认证)
- **WHEN** 已认证用户发送 `POST /api/json-editor/scripts` 请求,包含 `{ name, code, description?, outputMode? }`
- **THEN** 系统创建新脚本,生成唯一 id 和时间戳
- **AND** 返回创建的脚本对象,响应状态码为 201
- **AND** 脚本保存到文件系统 `blogs/json-editor-scripts/{id}.json`
- **AND** 更新索引文件 `blogs/json-editor-scripts/index.json`
- **AND** 未认证用户收到 401 错误

#### Scenario: 更新现有脚本(需要认证)
- **WHEN** 已认证用户发送 `PUT /api/json-editor/scripts/[id]` 请求,包含 `{ name?, code?, description?, outputMode? }`
- **THEN** 系统更新指定脚本的内容
- **AND** 更新 `updatedAt` 时间戳
- **AND** 返回更新后的脚本对象,响应状态码为 200
- **AND** 如果脚本不存在,返回 404 错误
- **AND** 未认证用户收到 401 错误

#### Scenario: 删除脚本(需要认证)
- **WHEN** 已认证用户发送 `DELETE /api/json-editor/scripts/[id]` 请求
- **THEN** 系统删除指定脚本文件
- **AND** 从索引文件中移除该脚本
- **AND** 返回 `{ success: true }`,响应状态码为 200
- **AND** 如果脚本不存在,返回 404 错误
- **AND** 未认证用户收到 401 错误

---

### Requirement: 脚本服务层封装
前端 SHALL 提供统一的服务层 API 封装,简化组件对后端脚本 API 的调用,并处理错误和认证逻辑。

#### Scenario: 获取脚本列表
- **WHEN** 组件调用 `fetchScripts()`
- **THEN** 服务层调用 `GET /api/json-editor/scripts`
- **AND** 返回脚本数组或空数组
- **AND** 如果请求失败,抛出友好的错误信息

#### Scenario: 创建脚本
- **WHEN** 已登录用户调用 `createScript({ name, code, description, outputMode })`
- **THEN** 服务层调用 `POST /api/json-editor/scripts`,附带 JWT token
- **AND** 返回创建的脚本对象
- **AND** 如果未认证或请求失败,抛出相应错误

#### Scenario: 更新脚本
- **WHEN** 已登录用户调用 `updateScript(id, { name, code, description, outputMode })`
- **THEN** 服务层调用 `PUT /api/json-editor/scripts/[id]`,附带 JWT token
- **AND** 返回更新后的脚本对象
- **AND** 如果未认证或脚本不存在,抛出相应错误

#### Scenario: 删除脚本
- **WHEN** 已登录用户调用 `deleteScript(id)`
- **THEN** 服务层调用 `DELETE /api/json-editor/scripts/[id]`,附带 JWT token
- **AND** 返回 `{ success: true }`
- **AND** 如果未认证或脚本不存在,抛出相应错误

---

### Requirement: 编辑框状态 IndexedDB 存储
系统 SHALL 使用 IndexedDB 存储编辑框(blocks)状态,替代 localStorage,以支持更大容量和更好的性能,并 MUST 提供一键清除功能。

#### Scenario: 保存编辑框状态
- **WHEN** 用户修改编辑框内容或设置
- **THEN** 系统在 1 秒防抖后自动保存到 IndexedDB
- **AND** 存储键为 `json-editor-boxes`
- **AND** 如果 IndexedDB 不可用,就不用存

#### Scenario: 加载编辑框状态
- **WHEN** 用户打开 JSON 编辑器页面
- **THEN** 系统首先尝试从 IndexedDB 加载状态
- **AND** 如果没有数据,创建默认编辑框

#### Scenario: 一键清除编辑框状态
- **WHEN** 用户点击"清除本地编辑框"按钮
- **THEN** 弹出确认对话框
- **AND** 确认后清除 IndexedDB 中的编辑框数据
- **AND** 重置为默认编辑框状态
- **AND** 显示成功提示

#### Scenario: IndexedDB 不可用则放弃
- **WHEN** 浏览器不支持 IndexedDB 或操作失败
- **AND** 在控制台记录警告信息
- **AND** 用户功能不受影响

---

### Requirement: 脚本加载
系统 SHALL 从后端 API 加载所有用户脚本，并在用户界面中根据认证状态显示相应的操作选项。

#### Scenario: 启动时加载脚本
- **WHEN** 用户打开 JSON 编辑器页面
- **THEN** 系统从后端 API 加载所有云端脚本
- **AND** 如果有重复 id,优先使用云端脚本

#### Scenario: 保存脚本时同步到云端
- **WHEN** 已登录用户创建或编辑脚本
- **THEN** 系统调用后端 API 保存脚本
- **AND** 如果未登录,提示保存失败

#### Scenario: UI 显示脚本来源
- **WHEN** 用户查看脚本列表
- **THEN** 登陆后才显示编辑和保存相关的ui
- **AND** 云端脚本支持编辑和删除(需登录)

---

## MODIFIED Requirements

### Requirement: Custom JavaScript Text Processing
系统 SHALL 允许已登陆用户创建和执行自定义 JavaScript 函数来转换文本内容

#### Scenario: Create custom script
- **WHEN** 用户打开"自定义脚本"面板
- **AND** 点击"新建脚本"
- **THEN** 显示脚本编辑器,包含模板代码
- **AND** 用户可以命名、编写代码、设置描述和输出模式
- **AND** 如果用户已登录,点击保存时脚本同步到云端
- **AND** 脚本保存后显示来源标识(云端/本地)

#### Scenario: Execute custom script on box content
- **WHEN** 用户从操作菜单选择已保存的自定义脚本
- **THEN** 脚本以编辑框内容作为输入执行
- **AND** 脚本在沙箱环境中运行,超时保护为 5 秒
- **AND** 返回值替换编辑框内容(或根据 outputMode 创建新编辑框)
- **AND** 错误被捕获并显示,不会崩溃 UI
- **AND** 脚本来源(本地/云端)不影响执行行为

#### Scenario: Script sandbox environment
- **WHEN** 自定义脚本执行时
- **THEN** 脚本接收当前编辑框内容作为 `input` 参数
- **AND** 脚本可访问安全工具库 (`utils`):JSON、字符串、正则表达式辅助函数
- **AND** 执行超过超时限制时自动终止

#### Scenario: Manage saved scripts
- **WHEN** 用户打开"自定义脚本"面板
- **THEN** 显示所有脚本列表(包含云端和本地脚本)
- **AND** 用户可以编辑、删除或复制每个脚本
- **AND** 用户可以导出脚本为 JSON 文件
- **AND** 用户可以从 JSON 文件导入脚本

#### Scenario: Script examples and documentation
- **WHEN** 用户创建新自定义脚本
- **THEN** 提供示例模板(例如"全部大写"、"移除空行")
- **AND** 内联文档说明脚本 API(input、返回值、utils)
- **AND** 提供"测试"按钮,允许运行脚本而不应用更改

