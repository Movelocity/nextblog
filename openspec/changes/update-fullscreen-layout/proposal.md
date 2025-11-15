# Change: Update JSON Editor to Full-Screen Fixed Layout

## Why
The JSON Editor currently uses a scrollable page layout (`min-h-screen`), which can cause the editing experience to be less focused when working with multiple editor boxes. A full-screen fixed layout provides a more app-like experience, similar to IDEs, where the workspace is always visible without needing to scroll the page.

## What Changes
- Change page container from `min-h-screen py-6` to `h-screen flex flex-col overflow-hidden`
- Fix header and toolbar at the top with `flex-shrink-0`
- Make editor boxes area fill remaining vertical space with `flex-1`
- Remove page-level scrolling; scrolling now only happens within individual editor boxes
- Improve visual focus by keeping all UI elements (header, toolbar, editors) visible at all times

## Impact
- Affected specs: `json-editor`
- Affected code: `app/(views)/tools/json/page.tsx`
- User experience: More focused editing experience, no page scrolling needed
- Breaking: No breaking changes; purely a UX improvement

