# Implementation Tasks

## 1. Core Architecture
- [ ] 1.1 Design multi-box state management structure (box array with unique IDs)
- [ ] 1.2 Create EditorBox component with type switching logic
- [ ] 1.3 Implement box management actions (add, remove, duplicate, reorder)
- [ ] 1.4 Set up CodeMirror integration with language modes (JSON, JavaScript, Markdown)

## 2. Editor Type Support
- [ ] 2.1 Implement textarea mode (default, fast loading)
- [ ] 2.2 Integrate CodeMirror for syntax highlighting
- [ ] 2.3 Configure language modes: JSON, JavaScript, Markdown
- [ ] 2.4 Add Markdown rendering mode using markdown parser
- [ ] 2.5 Create editor type switcher UI in toolbar

## 3. Text Processing Operations
- [ ] 3.1 Implement keyword/symbol removal function (configurable patterns)
- [ ] 3.2 Create string printing utility (unescape strings by one level)
- [ ] 3.3 Add JSON parsing for selected text
- [ ] 3.4 Build operation dropdown menu component
- [ ] 3.5 Add operation result feedback (success/error notifications)

## 4. Custom Script Support
- [ ] 4.1 Design script input/storage mechanism (localStorage persistence)
- [ ] 4.2 Create script execution sandbox with safe eval
- [ ] 4.3 Implement script management UI (save, load, delete scripts)
- [ ] 4.4 Add script templates/examples for common operations
- [ ] 4.5 Provide API documentation for script context (input, output, utilities)

## 5. UI/UX Enhancements
- [ ] 5.1 Design responsive box layout (grid/flex with adjustable sizing)
- [ ] 5.2 Add box header with controls (type selector, close button, label)
- [ ] 5.3 Implement drag-and-drop reordering for boxes
- [ ] 5.4 Create global toolbar with bulk operations
- [ ] 5.5 Add keyboard shortcuts for common actions
- [ ] 5.6 Implement copy-to-clipboard for each box
- [ ] 5.7 Apply theme colors using CSS variables (bg-card, border-card, text-foreground, etc.)
- [ ] 5.8 Configure CodeMirror theme to match project dark/light modes

## 6. Utilities and Helpers
- [ ] 6.1 Extend `/app/utils/jsonTools.ts` with new functions:
  - `unescapeString(text: string, levels?: number): string`
  - `removeKeywords(text: string, keywords: string[]): string`
  - `parseJsonSelection(text: string, start: number, end: number): object`
- [ ] 6.2 Create `/app/utils/scriptRunner.ts` for safe script execution
- [ ] 6.3 Add error handling and validation utilities

## 7. Configuration and Persistence
- [ ] 7.1 Save editor state to localStorage (boxes, content, types)
- [ ] 7.2 Implement import/export configuration
- [ ] 7.3 Add reset to defaults functionality

## 8. Testing and Documentation
- [ ] 8.1 Write unit tests for text processing utilities
- [ ] 8.2 Add integration tests for editor operations
- [ ] 8.3 Create user documentation for custom scripts
- [ ] 8.4 Update tools config description and metadata

