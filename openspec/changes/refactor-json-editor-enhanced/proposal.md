# Change: Enhanced JSON Editor with Multi-Box Support and Advanced Text Processing

## Why

The current JSON formatter tool (`/tools/json`) is limited to a single text area with basic format/minify operations. Users need a more powerful text manipulation environment that supports:
1. Working with multiple text boxes simultaneously for comparison and transformation workflows
2. Different editor types (plain text, syntax-highlighted code, markdown preview) for versatile content handling
3. Quick access to common text cleaning operations (escape character removal, string printing, keyword filtering)
4. Extensibility through user-defined JavaScript text processing scripts

This enhancement transforms the JSON tool from a simple formatter into a comprehensive text processing workbench, particularly valuable for developers cleaning serialized strings, debugging JSON in logs, and performing ad-hoc text transformations.

## What Changes

- **Multi-box editing system**: Add/remove editor boxes dynamically, each with independent content and settings
- **Editor type switching**: Toggle each box between textarea, CodeMirror (with syntax highlighting for JSON/JS/Markdown), and Markdown rendering modes
- **Dropdown quick operations**:
  - Remove keywords/symbols (e.g., `\n`, `\t`, escape sequences)
  - String printing: Input escaped string, output unescaped version (removes one layer of escape characters)
  - JSON parsing for selected text within editors
- **Custom script support**: Allow users to create and execute JavaScript-based text transformation scripts
- **Enhanced UX**: Improved toolbar, box management controls, and operation feedback

## Impact

- Affected specs: New capability `json-editor` (currently no spec exists for the JSON formatter)
- Affected code:
  - `/app/(views)/tools/json/page.tsx` - Complete rewrite to support multi-box architecture
  - `/app/utils/jsonTools.ts` - Extend with new text processing utilities
  - `/app/common/tools.config.ts` - Update tool description
  - New components under `/app/components/JsonEditor/` for editor boxes and controls

