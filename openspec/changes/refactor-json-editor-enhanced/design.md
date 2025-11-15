# Design Document: Enhanced JSON Editor

## Context

The current JSON formatter is a single-textarea tool with basic format/minify operations. The enhancement transforms it into a multi-box text processing workbench supporting different editor types, quick text operations, and custom JavaScript transformations.

**Key stakeholders**: Developers working with serialized JSON, escaped strings from logs/APIs, and ad-hoc text transformations.

**Constraints**:
- Must maintain fast initial load time (lazy-load CodeMirror)
- Browser-only execution (no backend processing for custom scripts)
- Security: Sandboxed script execution to prevent XSS/malicious code

## Goals / Non-Goals

### Goals
- Support multiple independent editor boxes with flexible management
- Provide three editor modes: textarea, syntax-highlighted code, markdown preview
- Offer quick operations for common text cleaning tasks (escape removal, JSON parsing)
- Enable user-defined JavaScript text transformations with safe execution
- Persist editor state across sessions
- Maintain responsive performance with large text content

### Non-Goals
- Real-time collaborative editing
- Version history/undo tree (rely on browser undo)
- Backend storage of scripts or content
- Advanced code intelligence (autocomplete, linting) - keep it lightweight

## Decisions

### 1. Multi-Box State Management
**Decision**: Use React useState with array of box objects, each containing `{ id, type, content, config }`.

**Rationale**:
- Simple and performant for expected use case (1-5 boxes typically)
- Easy to serialize to localStorage
- No need for complex state management library (Zustand/Redux) given localized scope

**Alternatives considered**:
- Zustand store: Overkill for single-page tool, adds dependency
- Context API: Unnecessary indirection without prop drilling issues

### 2. Editor Type Implementation
**Decision**: Three modes with lazy loading:
- **Textarea**: Native `<textarea>` (default, instant load)
- **CodeMirror**: Lazy-loaded on first switch, modes: JSON, JavaScript, Markdown
- **Markdown Preview**: Use `react-markdown` or similar, read-only rendered view

**Rationale**:
- Textarea ensures fast initial render for simple use cases
- CodeMirror provides professional syntax highlighting without full IDE overhead
- Lazy loading keeps bundle size small (CodeMirror ~200KB)
- Markdown preview useful for formatted documentation viewing

**Alternatives considered**:
- Monaco Editor: Too heavy (~5MB), designed for full IDE experience
- Custom syntax highlighter: Reinventing wheel, CodeMirror battle-tested

### 3. Custom Script Execution
**Decision**: Use `Function` constructor with isolated scope and timeout protection.

```javascript
function executeUserScript(script: string, input: string): string {
  const timeoutMs = 5000;
  const runner = new Function('input', 'utils', `
    return (function() {
      ${script}
    })();
  `);
  
  // Execute with timeout protection
  const timeout = setTimeout(() => { throw new Error('Script timeout'); }, timeoutMs);
  try {
    const result = runner(input, safeUtils);
    clearTimeout(timeout);
    return result;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
```

**Rationale**:
- `Function` constructor is safer than `eval` (no access to local scope)
- Timeout prevents infinite loops
- Provide safe utility library (`safeUtils`) with JSON parsing, regex, etc.
- All execution happens client-side, no server risk

**Alternatives considered**:
- Web Workers: More complex setup, overkill for simple text transforms
- Third-party sandboxes (quickjs-emscripten): Heavy dependencies, latency
- Disallow custom scripts: Limits power user workflows

**Security measures**:
- No access to `window`, `document`, `localStorage` in script context
- Read-only utility library (no DOM manipulation)
- Timeout to prevent DoS
- Clear warnings in UI about script risks

### 4. Text Processing Operations
**Decision**: Implement as pure functions in `/app/utils/jsonTools.ts`.

**Core operations**:
```typescript
// Remove escape sequences
function unescapeString(text: string, levels: number = 1): string

// Remove specific keywords/symbols
function removeKeywords(text: string, patterns: string[]): string

// Parse JSON from selection
function parseJsonSelection(text: string): { valid: boolean, parsed?: any }
```

**Rationale**:
- Pure functions easy to test and compose
- Dropdown menu applies selected operation to active box content
- Results replace box content (with undo via browser history)

### 5. Box Management UI
**Decision**: Flex grid layout with box controls in header.

```
┌─────────────────────────────────────┐
│ Global Toolbar: [+ Add Box] [Import]│
└─────────────────────────────────────┘

┌──────────────────┐ ┌──────────────────┐
│ Box 1 [Type ▼][x]│ │ Box 2 [Type ▼][x]│
│                  │ │                  │
│  [Editor Area]   │ │  [Editor Area]   │
│                  │ │                  │
│ [Operations ▼]   │ │ [Operations ▼]   │
└──────────────────┘ └──────────────────┘
```

**Rationale**:
- Each box independent and self-contained
- Global toolbar for cross-box operations
- Responsive grid adjusts to screen size (1-3 columns)

### 6. Persistence Strategy
**Decision**: Auto-save to localStorage on content/type changes (debounced 1s).

**Data structure**:
```typescript
interface PersistedState {
  version: number;
  boxes: Array<{
    id: string;
    type: 'textarea' | 'codemirror' | 'markdown';
    lang?: 'json' | 'javascript' | 'markdown';
    content: string;
    label?: string;
  }>;
  customScripts: Array<{
    id: string;
    name: string;
    code: string;
  }>;
}
```

**Rationale**:
- Survive page refreshes and accidental closes
- Debounce prevents localStorage thrashing
- Version field for future migration compatibility

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| CodeMirror bundle size | Slow load on first switch | Lazy load, show spinner during import |
| Custom script XSS | Malicious code execution | Sandboxed Function constructor, timeout, no DOM access |
| Large content performance | UI lag with >1MB text | Virtualization or warning for large content |
| Browser compatibility | CodeMirror may not support old browsers | Graceful fallback to textarea, clear browser requirements |
| localStorage quota | Content loss if quota exceeded | Catch errors, warn user, offer export |

## Migration Plan

### Backward Compatibility
- Existing `/tools/json` route remains functional
- Current single-box state can initialize first box in new system
- Old localStorage key can be migrated if detected

### Deployment Steps
1. Deploy new multi-box editor as feature flag (off by default)
2. Test with beta users for 1 week
3. Enable by default, keep legacy mode accessible via URL parameter
4. Announce change in blog post with tutorial
5. Remove legacy code after 1 month if no issues

### Rollback Plan
- Feature flag allows instant rollback without code deploy
- Legacy code kept in codebase for 1 month

## Theming and Color System

### Decision: Use Existing CSS Variables
**All colors MUST use the project's theme system** defined in `globals.css` and `tailwind.config.ts`.

**Available color variables**:
```css
/* Layout & Background */
--background: #ffffff (light) / #0a0a0a (dark)
--foreground: #171717 (light) / #ededed (dark)

/* Borders & Structure */
--border: #d1d5db (light) / #374151 (dark)
--border-card: #e5e7eb (light) / #374151 (dark)

/* Cards & Containers */
--card: #ffffff (light) / #161b22 (dark)
--bg-card: #ffffff (light) / #1f2937 (dark)
--popover: #ffffff (light) / #161b22 (dark)

/* Muted/Subdued Elements */
--muted: #f9fafb (light) / #18181b (dark)
--muted-foreground: #6b7280 (light) / #9ca3af (dark)

/* Accent/Interactive */
--accent: #007bff (both modes)

/* Shadows */
--shadow-color: #bbb (light) / #111 (dark)
```

**Implementation guidelines**:
```tsx
// ✅ Correct - Use Tailwind classes with theme variables
<div className="bg-background text-foreground border border-border">
<div className="bg-card border-card">
<button className="hover:bg-muted text-muted-foreground">

// ❌ Wrong - Never hardcode colors
<div className="bg-white dark:bg-gray-900">
<div style={{ backgroundColor: '#ffffff' }}>
```

**Component-specific theming**:
- **Editor boxes**: `bg-card border-card` for containers
- **Toolbar**: `bg-muted border-border` for toolbars/headers
- **Buttons**: `hover:bg-muted` for hover states
- **Text**: `text-foreground` for primary, `text-muted-foreground` for secondary
- **Dropdowns**: `bg-popover border-border` for menus
- **CodeMirror**: Configure theme to match `--background`/`--foreground` colors

**Dark mode support**:
- Automatic via CSS variables (no manual dark: classes needed)
- CodeMirror theme must respect `dark` class on root element
- Test both light and dark modes during implementation

## Open Questions

1. **Should we support box linking?** (e.g., output of Box 1 → input of Box 2)
   - **Decision needed**: Could add dropdown "Link to Box N" but may complicate UX. Start without, add if requested.

2. **How many boxes is reasonable?**
   - **Proposal**: Default limit to 10 boxes, show performance warning if exceeded. Monitor usage analytics.

3. **Should custom scripts have access to all boxes or just active one?**
   - **Decision**: Start with active box only (simpler), can add "Process All Boxes" option later.

4. **Markdown preview: readonly or editable source?**
   - **Decision**: Read-only preview in markdown mode, provide "Edit Source" button to switch to CodeMirror (markdown lang).

5. **Mobile experience?**
   - **Decision**: Stack boxes vertically on mobile, hide advanced features (custom scripts), focus on quick operations.

