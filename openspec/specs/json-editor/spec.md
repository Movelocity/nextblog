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
The system SHALL allow users to create and execute custom JavaScript functions to transform text content.

#### Scenario: Create custom script
- **WHEN** user opens the "Custom Scripts" panel
- **AND** clicks "New Script"
- **THEN** a script editor is displayed with template code
- **AND** user can name and save the script
- **AND** the script is persisted to localStorage

#### Scenario: Execute custom script on box content
- **WHEN** user selects a saved custom script from the operations menu
- **THEN** the script is executed with the box content as input
- **AND** the script runs in a sandboxed environment with timeout protection (5 seconds)
- **AND** the returned value replaces the box content
- **AND** errors are caught and displayed without crashing the UI

#### Scenario: Script sandbox environment
- **WHEN** a custom script is executed
- **THEN** it receives the current box content as the `input` parameter
- **AND** it has access to a safe utility library (`utils`) with JSON, string, and regex helpers
- **AND** it does NOT have access to `window`, `document`, `localStorage`, or other global objects
- **AND** execution is terminated if it exceeds the timeout limit

#### Scenario: Manage saved scripts
- **WHEN** user opens the "Custom Scripts" panel
- **THEN** a list of saved scripts is displayed
- **AND** user can edit, delete, or duplicate each script
- **AND** user can export scripts as JSON file
- **AND** user can import scripts from JSON file

#### Scenario: Script examples and documentation
- **WHEN** user creates a new custom script
- **THEN** example templates are available (e.g., "Uppercase All", "Remove Empty Lines")
- **AND** inline documentation explains the script API (input, return value, utils)
- **AND** a "Test" button allows running the script without applying changes

---

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

