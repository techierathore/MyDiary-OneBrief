# MyDiary — TrBlazeUI Feedback

| | |
|---|---|
| App | MyDiary |
| Upstream | TrBlazeUI |
| Updated | 2026-10-18 |

## Summary

Four open entries; nothing is blocked yet, but the component catalogue must be checked before build. The mockups use plausible TrBlazeUI control names and the discrepancies are recorded below.

## Entries

### 2026-10-18 — Missing component reference

- **Severity:** Medium
- **Blocks:** No — mockups were produced using plausible TrBlazeUI control names and the discrepancy was recorded here; work carried on.
- **Repro:** Open this workspace and look for `.trblazeui/TrBlazeUI-AI-Reference.md`; the file is absent.
- **Expected:** A component reference exists so the mockups task can map each screen region to a real TrBlazeUI control.
- **Actual:** The reference is missing, so `docs/MyDiary-UIDesign.md` uses assumed control names.
- **Encountered in:** `docs/MyDiary-UIDesign.md` and every mockup under `docs/mockups/`.
- **Workaround:** None; the names must be validated against the real catalogue before build.
- **Suggested fix:** Generate or provide `.trblazeui/TrBlazeUI-AI-Reference.md` with the current control list and props.

### 2026-10-18 — Rich text editor for Free-Flow entries

- **Severity:** High
- **Blocks:** No — the screen is mocked with a `TbToolbar` plus `TbTextArea`; if no rich editor exists, the build must fall back to plain text with formatting markers.
- **Repro:** Open `docs/mockups/entry.html`; the Free-Flow screen shows bold, italic and heading toolbar buttons.
- **Expected:** A `TbRichTextEditor` or `TbMarkdownEditor` control that supports bold, italic and headings and binds a formatted string.
- **Actual:** Not confirmed whether TrBlazeUI ships a rich text editor.
- **Encountered in:** Free-Flow entry screen (`/entry`).
- **Workaround:** Use a `TbTextArea` with a toolbar that inserts markdown syntax, and render it as HTML on read-only screens.
- **Suggested fix:** Confirm if `TbRichTextEditor` exists; if not, add it or document the markdown-fallback pattern.

### 2026-10-18 — Calendar control

- **Severity:** Medium
- **Blocks:** No — the Calendar screen is mocked with a CSS grid.
- **Repro:** Open `docs/mockups/calendar.html`; the month grid, day selection and entry dots are drawn by hand.
- **Expected:** A `TbCalendar` control that accepts a list of marked dates and fires a `DateSelected` event.
- **Actual:** Not confirmed whether TrBlazeUI ships a calendar.
- **Encountered in:** Calendar screen (`/calendar`).
- **Workaround:** Build the calendar from `TbButton` cells in a grid.
- **Suggested fix:** Confirm if `TbCalendar` exists; if not, add it to the catalogue.

### 2026-10-18 — Mood / emoji picker

- **Severity:** Low
- **Blocks:** No — the mood picker is mocked as a row of emoji buttons.
- **Repro:** Open `docs/mockups/entry.html` and tap the mood button; a sheet with four emoji options appears.
- **Expected:** A `TbEmojiPicker` or `TbIconPicker` limited to a preset list for mood selection.
- **Actual:** Not confirmed whether TrBlazeUI ships an emoji picker.
- **Encountered in:** Free-Flow entry screen (`/entry`) and Settings.
- **Workaround:** Use a custom row of `TbButton` or `TbChip` controls with emoji content.
- **Suggested fix:** Confirm if `TbEmojiPicker` exists; if not, document the recommended custom approach.
