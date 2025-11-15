# 📦 Enhanced JSON Editor - Visual Overview

## 🎯 What You're Building

A **multi-box text processing workbench** that transforms the simple JSON formatter into a powerful developer tool.

### Current State (Before)
```
┌─────────────────────────────────────────┐
│  JSON Formatter                          │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │    Single Textarea                  ││
│  │                                     ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│  [Format] [Minify] [Copy] [Clear]       │
└─────────────────────────────────────────┘
```

### Future State (After)
```
┌────────────────────────────────────────────────────────────────┐
│  JSON Editor Pro                    [+ Add Box] [Import Config] │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────┐│
│  │ Box 1: Raw Input  │  │ Box 2: Formatted  │  │ Box 3: Notes││
│  │ [Textarea    ▼][x]│  │ [CodeMirror  ▼][x]│  │ [Markdown▼]│││
│  │                   │  │                   │  │             ││
│  │ {"name":"Jo...    │  │ {                 │  │ # Usage     ││
│  │                   │  │   "name": "John", │  │ This is...  ││
│  │                   │  │   "age": 30       │  │             ││
│  │                   │  │ }                 │  │             ││
│  │                   │  │                   │  │             ││
│  │ [Operations ▼]    │  │ [Operations ▼]    │  │ [Copy]      ││
│  └───────────────────┘  └───────────────────┘  └─────────────┘│
│                                                                 │
│  ⚡ Quick Operations: Remove Escapes | String Print | Parse JSON│
│  🔧 Custom Scripts: [My Scripts ▼] [+ New Script]              │
└────────────────────────────────────────────────────────────────┘
```

## 🎨 Key Features at a Glance

### 1️⃣ Multi-Box System
- ➕ Add unlimited boxes (practical limit: ~10)
- 🗑️ Delete with confirmation
- 📋 Duplicate with all content
- 🔄 Reorder via drag & drop
- 💾 Auto-save to localStorage

### 2️⃣ Three Editor Modes Per Box

| Mode | Icon | Description |
|------|------|-------------|
| 📝 **Textarea** | `[T]` | Native, fast, for quick edits |
| 🎨 **CodeMirror** | `[</>]` | Syntax highlighting (JSON/JS/MD) |
| 📖 **Markdown** | `[M↓]` | Rendered HTML preview |

### 3️⃣ Quick Operations Menu

```
┌─ Operations ────────────────────┐
│ 🧹 Remove Escape Sequences       │
│ 📤 String Print (Unescape)       │
│ 🔍 Parse JSON Selection          │
│ ✨ Format JSON (2/4/8 spaces)    │
│ 📦 Minify JSON                   │
│ ─────────────────────────────    │
│ 🔧 Custom Scripts ▶              │
└──────────────────────────────────┘
```

### 4️⃣ Custom Script System

**Create once, reuse forever:**

```javascript
// Script: Remove Empty Lines
function transform(input, utils) {
  return input
    .split('\n')
    .filter(line => line.trim())
    .join('\n');
}
```

**Features:**
- 💾 Saved to localStorage
- 🔒 Sandboxed execution (5s timeout)
- 🛠️ Safe utility library included
- 📤 Export/import as JSON

### 5️⃣ Smart Text Processing

#### String Print Example
```
Input (escaped):
"Hello\\nWorld\\t!"

Output (unescaped):
Hello
World  !
```

#### Remove Keywords Example
```
Input:
{"message":"Error\\noccurred"}

Remove: \n, \\n
Output:
{"message":"Erroroccurred"}
```

#### Parse JSON Selection
```
Select: {"name":"John"}rest of text
Parse → 
{
  "name": "John"
}
```

## 📂 File Structure Created

```
openspec/changes/refactor-json-editor-enhanced/
├── 📄 README.md         ← Quick summary (what you're reading now)
├── 📄 OVERVIEW.md       ← Visual guide (this file)
├── 📄 proposal.md       ← Full rationale and impact analysis
├── 📄 design.md         ← Technical architecture decisions
├── 📄 tasks.md          ← 35-task implementation checklist
└── 📁 specs/
    └── json-editor/
        └── 📄 spec.md   ← 11 requirements with 40+ scenarios
```

## 📋 Requirements Breakdown

### Core Functionality (11 Requirements)

1. **Multi-Box Editor Management**
   - Add, delete, duplicate boxes
   - Auto-save to localStorage
   - Restore on page load

2. **Editor Type Switching**
   - Textarea ↔ CodeMirror ↔ Markdown
   - Preserve content across switches
   - Lazy-load CodeMirror

3. **Syntax Highlighting Modes**
   - JSON, JavaScript, Markdown
   - Bracket matching
   - Auto-indentation

4. **Quick Text Operations**
   - Remove escape sequences
   - String printing (unescape)
   - JSON parse/format/minify

5. **Custom JavaScript Processing**
   - Create, save, edit scripts
   - Sandboxed execution
   - Import/export scripts

6. **Box Content Operations**
   - Copy to clipboard
   - Clear with confirmation
   - Custom labels

7. **Keyboard Shortcuts**
   - `Ctrl+N` - New box
   - `Ctrl+Shift+F` - Format JSON
   - `Ctrl+K` - Operations menu

8. **Responsive Layout**
   - Desktop: 3 columns
   - Tablet: 2 columns
   - Mobile: 1 column

9. **Import/Export Configuration**
   - Save entire state as JSON
   - Restore from backup
   - Timestamped filenames

10. **Performance Management**
    - Warn at >1MB content
    - Graceful localStorage quota handling
    - Suggest textarea for large files

11. **Theme Integration and Dark Mode**
    - Use CSS variables from `globals.css`
    - No hardcoded colors
    - Automatic light/dark mode support
    - CodeMirror theme matches project colors

12. **Error Handling**
    - Clear success/error messages
    - Non-destructive failures
    - Helpful error details

## 🛠️ Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Multi-box state management
- [ ] EditorBox component
- [ ] Box add/remove/duplicate
- [ ] Basic textarea mode

### Phase 2: Editor Modes (Week 1-2)
- [ ] CodeMirror integration
- [ ] Lazy loading setup
- [ ] JSON/JS/MD syntax modes
- [ ] Markdown preview

### Phase 3: Operations (Week 2)
- [ ] Quick operations dropdown
- [ ] Text processing utilities
- [ ] Remove escapes
- [ ] String print
- [ ] JSON parse/format/minify

### Phase 4: Custom Scripts (Week 3)
- [ ] Script management UI
- [ ] Safe execution sandbox
- [ ] localStorage persistence
- [ ] Template scripts

### Phase 5: UX Polish (Week 3-4)
- [ ] Keyboard shortcuts
- [ ] Responsive layout
- [ ] Drag & drop reordering
- [ ] Import/export
- [ ] Error handling

### Phase 6: Testing & Docs (Week 4)
- [ ] Unit tests
- [ ] Integration tests
- [ ] User documentation
- [ ] Script API docs

## 🎯 Success Metrics

After implementation, users should be able to:

✅ **Work with 3-5 boxes simultaneously** for comparison workflows  
✅ **Clean escaped strings in <5 clicks** (paste → select operation → done)  
✅ **Create custom script in <2 minutes** (open panel → paste code → save)  
✅ **Switch editor types instantly** (no page reload, smooth transitions)  
✅ **Restore work after browser crash** (auto-save to localStorage)  

## 🔒 Security Considerations

### Custom Script Sandbox
```javascript
// ✅ Allowed
input.toUpperCase()
utils.parseJSON(input)
input.match(/regex/)

// ❌ Blocked
window.location = "evil.com"
document.cookie
localStorage.clear()
eval(maliciousCode)
```

**Protection mechanisms:**
1. Function constructor (isolated scope)
2. 5-second timeout
3. No access to global objects
4. Read-only utility library
5. Client-side only (no server risk)

## 🚀 Deployment Plan

### Rollout Strategy
1. **Feature flag OFF** - Deploy code, no users affected
2. **Beta testing** - Enable for admins only
3. **Gradual rollout** - 10% → 50% → 100%
4. **Legacy fallback** - Old version accessible via `?legacy=true`
5. **Monitor metrics** - Usage, errors, performance
6. **Remove legacy** - After 1 month if stable

### Backward Compatibility
- Current `/tools/json` route unchanged
- Existing localStorage migrated automatically
- No breaking changes to URLs or API

## 📊 Technical Specs

### Dependencies to Add
```json
{
  "@codemirror/view": "^6.x",
  "@codemirror/lang-json": "^6.x",
  "@codemirror/lang-javascript": "^6.x", 
  "@codemirror/lang-markdown": "^6.x",
  "react-markdown": "^9.x"
}
```

### Bundle Size Impact
- CodeMirror: ~200KB (lazy-loaded)
- react-markdown: ~50KB (lazy-loaded)
- New components: ~20KB
- **Total initial bundle increase: <10KB** (rest lazy-loaded)

### Theming System
**All colors use CSS variables** (defined in `globals.css`):
```tsx
// ✅ Correct - Use theme variables
<div className="bg-card border-card text-foreground">
<button className="hover:bg-muted text-muted-foreground">

// ❌ Wrong - Never hardcode colors
<div className="bg-white dark:bg-gray-900">
<div style={{ backgroundColor: '#ffffff' }}>
```

**Available theme colors**:
- `--background` / `--foreground` - Main page colors
- `--card` / `--bg-card` - Container backgrounds
- `--border` / `--border-card` - Border colors
- `--muted` / `--muted-foreground` - Subdued elements
- `--accent` - Interactive/highlight color
- `--popover` - Dropdown/menu backgrounds

**Dark mode**: Automatic via CSS variables, no manual `dark:` classes needed.

### Browser Compatibility
- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile browsers: Modern versions
- Fallback: Textarea mode for unsupported browsers

## 🔄 State Management

### Box State Structure
```typescript
interface Box {
  id: string;              // UUID
  type: 'textarea' | 'codemirror' | 'markdown';
  lang?: 'json' | 'javascript' | 'markdown';
  content: string;
  label?: string;
  createdAt: number;
}

interface AppState {
  boxes: Box[];
  activeBoxId: string | null;
  customScripts: Script[];
  settings: {
    defaultIndent: 2 | 4 | 8;
    autoSave: boolean;
  };
}
```

### LocalStorage Schema
```json
{
  "version": 1,
  "timestamp": 1699999999999,
  "boxes": [...],
  "customScripts": [...],
  "settings": {...}
}
```

## 🎓 User Workflows

### Workflow 1: Clean Escaped JSON from Logs
1. Copy JSON from log file (with escape chars)
2. Paste into Box 1
3. Click Operations → String Print
4. Click Operations → Format JSON
5. Copy cleaned result

**Time: ~10 seconds** (vs. manual find/replace: 2+ minutes)

### Workflow 2: Compare JSON Transformations
1. Paste original JSON in Box 1
2. Duplicate to Box 2 and Box 3
3. Box 1: Keep original
4. Box 2: Apply transformation A
5. Box 3: Apply transformation B
6. Compare side-by-side

**Benefit: Visual comparison without losing original**

### Workflow 3: Custom Script for Repeated Task
1. Open Custom Scripts panel
2. Paste script (e.g., remove empty lines)
3. Name and save
4. Apply to any box via Operations → My Scripts → [Script Name]

**Time saved: 1 minute per use after initial setup**

## 📝 Next Steps

### Before Implementation
1. **Review this proposal** - Confirm requirements meet needs
2. **Check design.md** - Validate technical decisions
3. **Read tasks.md** - Understand implementation scope
4. **Get approval** - Stakeholder sign-off

### During Implementation
1. Follow `tasks.md` checklist sequentially
2. Validate after each phase
3. Test on real use cases
4. Gather feedback from beta users

### After Implementation
1. Archive change with `openspec archive refactor-json-editor-enhanced`
2. Update `openspec/specs/json-editor/spec.md`
3. Document in project changelog
4. Create user tutorial/blog post

## ✅ Validation Status

```bash
$ openspec validate refactor-json-editor-enhanced --strict
✅ Change 'refactor-json-editor-enhanced' is valid

$ openspec list
Changes:
  refactor-json-editor-enhanced     0/35 tasks
```

---

**Ready to implement?** Start with `tasks.md` section 1.1! 🚀

**Questions?** Review `proposal.md` (why) and `design.md` (how).

**Need changes?** Edit files and re-validate with `openspec validate refactor-json-editor-enhanced --strict`.

