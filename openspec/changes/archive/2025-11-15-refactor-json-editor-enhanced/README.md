# Enhanced JSON Editor - Change Proposal

**Change ID**: `refactor-json-editor-enhanced`  
**Status**: ✅ Validated  
**Type**: New Capability

## Quick Summary

This proposal transforms the current single-textarea JSON formatter (`/tools/json`) into a powerful multi-box text processing workbench with:

- 📦 **Multiple independent editor boxes** - Add/remove/duplicate boxes as needed
- 🎨 **Three editor modes** - Textarea, CodeMirror (syntax highlighting), Markdown preview
- ⚡ **Quick text operations** - Remove escape chars, string printing, JSON parsing
- 🔧 **Custom JS scripts** - User-defined text transformations with safe execution
- 💾 **Auto-save & persistence** - State saved to localStorage
- ⌨️ **Keyboard shortcuts** - Fast workflows for power users

## Problem Being Solved

Developers frequently need to:
- Clean escaped strings from API responses and logs (e.g., `\\n` → `\n`)
- Parse JSON embedded in text garbage
- Compare multiple text transformations side-by-side
- Apply ad-hoc text processing without writing full scripts

Current tool is too limited for these workflows.

## Key Features

### 1. Multi-Box Architecture
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Box 1      │ │   Box 2      │ │   Box 3      │
│  [Textarea]  │ │ [CodeMirror] │ │  [Markdown]  │
│              │ │              │ │              │
│ Raw JSON     │ │ Formatted    │ │ Docs         │
└──────────────┘ └──────────────┘ └──────────────┘
```

Each box operates independently with its own content, type, and settings.

### 2. Editor Type Switching

| Mode | Use Case | Features |
|------|----------|----------|
| **Textarea** | Quick edits, fast loading | Native textarea, instant |
| **CodeMirror** | Syntax work | JSON/JS/MD highlighting, bracket matching |
| **Markdown Preview** | Documentation viewing | Rendered HTML, read-only |

### 3. Quick Operations Dropdown

- **Remove Keywords**: Strip `\n`, `\t`, escape sequences
- **String Print**: Unescape one level (e.g., log output → actual string)
- **Parse JSON Selection**: Extract and format JSON from selected text
- **Format JSON**: Pretty-print with configurable indentation
- **Minify JSON**: Compress to single line

### 4. Custom Scripts

Users can write JavaScript functions to process text:

```javascript
// Example: Remove empty lines
function transform(input) {
  return input.split('\n')
    .filter(line => line.trim())
    .join('\n');
}
```

**Safety features**:
- Sandboxed execution (no DOM/window access)
- 5-second timeout protection
- Safe utility library provided
- Persistent storage in localStorage

### 5. Advanced UX

- **Auto-save**: Debounced localStorage persistence
- **Import/Export**: Save/load configurations as JSON
- **Keyboard shortcuts**: `Ctrl+N` (new box), `Ctrl+Shift+F` (format), `Ctrl+K` (operations)
- **Responsive**: 3-column desktop → 2-column tablet → 1-column mobile
- **Box labels**: Custom names for organization

## Files Structure

```
openspec/changes/refactor-json-editor-enhanced/
├── README.md         # This file
├── OVERVIEW.md       # Visual guide with diagrams
├── proposal.md       # Full rationale and impact
├── design.md         # Technical decisions and architecture
├── tasks.md          # 8-section implementation checklist (37 tasks)
└── specs/
    └── json-editor/
        └── spec.md   # 12 requirements with scenarios
```

## Requirements Summary

1. **Multi-Box Editor Management** - Create, delete, duplicate, persist boxes
2. **Editor Type Switching** - Textarea, CodeMirror, Markdown preview
3. **Syntax Highlighting Modes** - JSON, JavaScript, Markdown
4. **Quick Text Operations** - Remove escapes, string print, JSON parse/format/minify
5. **Custom JavaScript Text Processing** - User scripts with sandbox
6. **Box Content Operations** - Copy, clear, label
7. **Keyboard Shortcuts** - Fast navigation and actions
8. **Responsive Layout** - Desktop/tablet/mobile optimization
9. **Import and Export Configuration** - Backup and restore
10. **Performance with Large Content** - Warnings and graceful degradation
11. **Theme Integration and Dark Mode Support** - CSS variables, light/dark modes
12. **Error Handling and User Feedback** - Clear messaging

Total: **12 requirements, 43+ scenarios**

## Implementation Checklist

See `tasks.md` for full details. High-level phases:

1. **Core Architecture** (4 tasks) - Multi-box state, EditorBox component, CodeMirror setup
2. **Editor Type Support** (5 tasks) - Textarea, CodeMirror, Markdown modes
3. **Text Processing Operations** (5 tasks) - Keyword removal, string print, JSON parsing
4. **Custom Script Support** (5 tasks) - Script management, sandbox execution, UI
5. **UI/UX Enhancements** (6 tasks) - Responsive layout, drag-drop, shortcuts
6. **Utilities and Helpers** (3 tasks) - Extend jsonTools, create scriptRunner
7. **Configuration and Persistence** (3 tasks) - localStorage, import/export
8. **Testing and Documentation** (4 tasks) - Unit tests, integration tests, docs

**Total: 35+ implementation tasks**

## Technical Highlights

### Architecture Decisions
- **State Management**: React useState (simple, no external lib needed)
- **Code Editor**: CodeMirror (lightweight, proven, ~200KB)
- **Markdown**: react-markdown (standard, feature-rich)
- **Script Sandbox**: Function constructor with timeout (safer than eval)
- **Persistence**: localStorage with 1s debounce (auto-save without thrashing)
- **Theming**: CSS variables from `globals.css` (no hardcoded colors, auto dark mode)

### Security
- Custom scripts run in isolated scope (no window/document access)
- Timeout protection prevents infinite loops
- Read-only utility library (no DOM manipulation)
- LocalStorage quota handling with export fallback

### Performance
- Lazy-load CodeMirror (only on first use)
- Warn at >1MB content
- Virtualization for large text (if needed)
- Debounced auto-save

## Next Steps

1. ✅ **Proposal validated** - OpenSpec checks passed
2. 📋 **Review proposal** - Stakeholder approval needed
3. 🛠️ **Implementation** - Follow `tasks.md` checklist sequentially
4. 🧪 **Testing** - Unit + integration tests
5. 📚 **Documentation** - User guide for custom scripts
6. 🚀 **Deployment** - Feature flag rollout
7. 📦 **Archive** - Move to archive after stable

## Validation Status

```bash
$ openspec validate refactor-json-editor-enhanced --strict
✅ Change 'refactor-json-editor-enhanced' is valid
```

**Delta count**: 11 requirements  
**Format**: All scenarios properly structured with `#### Scenario:`  
**Operations**: All using `## ADDED Requirements` (new capability)

## Questions or Modifications?

Before implementation:
1. Review `proposal.md` for full context
2. Check `design.md` for technical decisions and trade-offs
3. Read `specs/json-editor/spec.md` for detailed requirements
4. Examine `tasks.md` for implementation sequence

To modify:
1. Edit relevant files in this directory
2. Run `openspec validate refactor-json-editor-enhanced --strict`
3. Fix any validation errors
4. Request re-approval

## Related Files

- Current implementation: `/app/(views)/tools/json/page.tsx`
- Utilities: `/app/utils/jsonTools.ts`
- Tools config: `/app/common/tools.config.ts`

---

**Created**: 2025-11-15  
**Validator**: OpenSpec v1.0  
**Approval Status**: Pending Review

