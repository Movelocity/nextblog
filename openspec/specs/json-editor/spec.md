# json-editor Specification

## Purpose

The JSON Editor is a comprehensive multi-box text processing workbench that transforms simple JSON formatting into a powerful developer tool. It provides multiple independent editor boxes with syntax highlighting, Markdown preview, quick text operations, and custom JavaScript transformations. Users can work with JSON, JavaScript, Markdown, and plain text across multiple boxes simultaneously, with features like box resizing, state persistence, and extensible custom scripts. The editor is designed for developers who need to clean serialized strings, debug JSON in logs, compare data transformations, and perform ad-hoc text processing workflows.
## Requirements
### Requirement: Multi-Box Editor Management
The system SHALL provide a multi-box editing interface where users can create, delete, and manage multiple independent text editor boxes.

#### Scenario: Add new editor box
- **WHEN** user clicks the "Add Box" button
- **THEN** a new empty editor box is created and added to the workspace
- **AND** the new box is assigned a unique ID and default settings (textarea mode)

#### Scenario: Remove editor box
- **WHEN** user clicks the close button on a box header
- **THEN** the box is removed from the workspace
- **AND** its content is discarded (with confirmation if content exists)

#### Scenario: Duplicate existing box
- **WHEN** user selects "Duplicate" from a box's menu
- **THEN** a new box is created with identical content and settings
- **AND** the duplicate is positioned adjacent to the original

#### Scenario: Persist box state
- **WHEN** user makes changes to any box (content or settings)
- **THEN** the state is automatically saved to localStorage after 1 second debounce
- **AND** state is restored when user returns to the page

---

### Requirement: Editor Type Switching
Each editor box SHALL support three display modes: textarea, CodeMirror with syntax highlighting, and Markdown preview.

#### Scenario: Switch to textarea mode
- **WHEN** user selects "Textarea" from the type dropdown
- **THEN** the box displays a native textarea element
- **AND** content is preserved without formatting
- **AND** the switch is instant with no loading delay

#### Scenario: Switch to CodeMirror mode
- **WHEN** user selects "CodeMirror" from the type dropdown
- **THEN** the CodeMirror library is lazy-loaded if not already loaded
- **AND** a loading spinner is shown during initial load
- **AND** the box displays syntax-highlighted content
- **AND** user can select language mode: JSON, JavaScript, or Markdown

#### Scenario: Switch to Markdown preview mode
- **WHEN** user selects "Markdown Preview" from the type dropdown
- **THEN** the box displays rendered HTML from Markdown source
- **AND** the view is read-only
- **AND** an "Edit Source" button is provided to return to editable mode

#### Scenario: Maintain content across type changes
- **WHEN** user switches between editor types
- **THEN** the text content is preserved exactly
- **AND** cursor position is maintained where possible
- **AND** undo history is preserved

---

### Requirement: Syntax Highlighting Modes
When using CodeMirror mode, the system SHALL support syntax highlighting for JSON, JavaScript, and Markdown languages.

#### Scenario: Apply JSON syntax highlighting
- **WHEN** user selects "JSON" language in CodeMirror mode
- **THEN** valid JSON is highlighted with appropriate colors
- **AND** syntax errors are visually indicated
- **AND** bracket matching is enabled

#### Scenario: Apply JavaScript syntax highlighting
- **WHEN** user selects "JavaScript" language in CodeMirror mode
- **THEN** JavaScript syntax is highlighted (keywords, strings, functions)
- **AND** bracket matching and auto-indentation are enabled

#### Scenario: Apply Markdown syntax highlighting
- **WHEN** user selects "Markdown" language in CodeMirror mode
- **THEN** Markdown syntax is highlighted (headers, bold, links, code blocks)
- **AND** headers are visually distinguished by weight/size

---

### Requirement: Quick Text Operations
The system SHALL provide a dropdown menu of quick text processing operations applicable to each box.

#### Scenario: Remove escape sequences
- **WHEN** user selects "Remove Escape Sequences" operation
- **THEN** common escape characters (`\n`, `\t`, `\"`, `\\`) are removed from content
- **AND** the cleaned text replaces the box content
- **AND** the original state is preserved in browser undo history

#### Scenario: String printing (unescape)
- **WHEN** user selects "String Print" operation
- **THEN** the content is unescaped by one level (e.g., `\\n` → `\n`, `\"` → `"`)
- **AND** the result simulates printing the escaped string as a literal
- **AND** success feedback is shown to the user

#### Scenario: Parse JSON from selection
- **WHEN** user selects text and chooses "Parse JSON Selection" operation
- **THEN** the system attempts to parse the selected text as JSON
- **AND** if valid, the parsed and formatted JSON replaces the selection
- **AND** if invalid, an error message is displayed without modifying content

#### Scenario: Format JSON
- **WHEN** user selects "Format JSON" operation
- **THEN** the content is parsed as JSON and formatted with proper indentation
- **AND** the indent size is configurable (2, 4, or 8 spaces)
- **AND** invalid JSON shows an error without changing content

#### Scenario: Minify JSON
- **WHEN** user selects "Minify JSON" operation
- **THEN** the content is parsed as JSON and compressed to a single line
- **AND** whitespace is removed except within string values
- **AND** invalid JSON shows an error without changing content

---

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

### Requirement: Box Content Operations
The system SHALL provide standard content operations for each editor box.

#### Scenario: Copy box content to clipboard
- **WHEN** user clicks the "Copy" button on a box
- **THEN** the box content is copied to the system clipboard
- **AND** a success indicator is shown briefly

#### Scenario: Clear box content
- **WHEN** user clicks the "Clear" button on a box
- **THEN** all content is removed from the box
- **AND** confirmation is shown if content is non-empty
- **AND** the action can be undone via browser undo

#### Scenario: Label boxes
- **WHEN** user clicks on the box header to edit the label
- **THEN** an input field appears for entering a custom name
- **AND** the label is displayed in the box header
- **AND** labels are persisted with box state

---

### Requirement: Keyboard Shortcuts
The system SHALL provide keyboard shortcuts for common operations.

#### Scenario: Add new box with shortcut
- **WHEN** user presses `Ctrl+N` (or `Cmd+N` on Mac)
- **THEN** a new editor box is added to the workspace

#### Scenario: Format JSON with shortcut
- **WHEN** user presses `Ctrl+Shift+F` (or `Cmd+Shift+F`) in a focused box
- **THEN** the "Format JSON" operation is applied to that box

#### Scenario: Quick operation menu with shortcut
- **WHEN** user presses `Ctrl+K` (or `Cmd+K`) in a focused box
- **THEN** the quick operations dropdown is opened
- **AND** user can navigate with arrow keys and select with Enter

---

### Requirement: Responsive Layout
The system SHALL adapt the editor box layout to different screen sizes.

#### Scenario: Desktop layout
- **WHEN** the viewport width is greater than 1024px
- **THEN** boxes are arranged in a 3-column grid
- **AND** boxes expand to fill available horizontal space

#### Scenario: Tablet layout
- **WHEN** the viewport width is between 640px and 1024px
- **THEN** boxes are arranged in a 2-column grid
- **AND** vertical scrolling is enabled for overflow

#### Scenario: Mobile layout
- **WHEN** the viewport width is less than 640px
- **THEN** boxes are stacked vertically in a single column
- **AND** advanced features (custom scripts) are hidden or collapsed
- **AND** touch-friendly controls are provided

---

### Requirement: Import and Export Configuration
The system SHALL allow users to export and import their editor configuration including boxes and custom scripts.

#### Scenario: Export configuration
- **WHEN** user clicks "Export Configuration" from the global menu
- **THEN** a JSON file is downloaded containing all boxes (content, types, settings) and custom scripts
- **AND** the filename includes a timestamp (e.g., `json-editor-config-2023-10-15.json`)

#### Scenario: Import configuration
- **WHEN** user clicks "Import Configuration" and selects a valid JSON file
- **THEN** the editor state is replaced with the imported configuration
- **AND** current boxes and scripts are backed up to a temporary localStorage key
- **AND** user is shown a preview before confirming the import

#### Scenario: Import validation
- **WHEN** user attempts to import an invalid configuration file
- **THEN** an error message is displayed explaining the issue
- **AND** the current editor state is not modified
- **AND** user can retry with a different file

---

### Requirement: Performance with Large Content
The system SHALL maintain usable performance when handling large text content.

#### Scenario: Warn on large content
- **WHEN** a box contains more than 1MB of text
- **THEN** a warning banner is displayed suggesting textarea mode for better performance
- **AND** CodeMirror may automatically disable certain features (e.g., syntax highlighting)

#### Scenario: Graceful degradation
- **WHEN** the browser's localStorage quota is exceeded
- **THEN** an error is caught and user is notified
- **AND** user is prompted to export configuration as a file
- **AND** the editor continues functioning without auto-save

---

### Requirement: Theme Integration and Dark Mode Support
The system SHALL use the project's existing CSS variable-based theme system and support both light and dark modes.

#### Scenario: Apply theme colors to components
- **WHEN** the editor interface is rendered
- **THEN** all UI components use CSS variables from the theme (`--background`, `--foreground`, `--border`, `--card`, etc.)
- **AND** no colors are hardcoded in component styles
- **AND** the interface automatically adapts to light/dark mode

#### Scenario: CodeMirror theme matches project theme
- **WHEN** CodeMirror editor is displayed
- **THEN** the editor theme is configured to use `--background` and `--foreground` colors
- **AND** syntax highlighting colors complement the theme
- **AND** the editor respects dark mode when `.dark` class is on root element

#### Scenario: Consistent styling with existing components
- **WHEN** viewing the JSON editor alongside other pages
- **THEN** colors, borders, and shadows match the project's design system
- **AND** buttons and controls follow the same styling patterns
- **AND** hover states use `--muted` background color

---

### Requirement: Error Handling and User Feedback
The system SHALL provide clear feedback for operations and handle errors gracefully.

#### Scenario: Operation success feedback
- **WHEN** any text operation completes successfully
- **THEN** a brief success message is shown (e.g., "JSON formatted", "Content copied")
- **AND** the message auto-dismisses after 2 seconds

#### Scenario: Operation error feedback
- **WHEN** any text operation fails (e.g., invalid JSON, script error)
- **THEN** an error message is displayed with specific details
- **AND** the error persists until user dismisses it or performs another action
- **AND** the box content remains unchanged

#### Scenario: Custom script execution error
- **WHEN** a custom script throws an error or times out
- **THEN** the error message and stack trace are displayed
- **AND** the box content is not modified
- **AND** user can edit the script to fix the issue

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

