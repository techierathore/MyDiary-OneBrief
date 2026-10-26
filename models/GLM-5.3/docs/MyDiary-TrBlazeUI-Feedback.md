<!-- tf-schema
doc: feedback
file: docs/MyDiary-TrBlazeUI-Feedback.md
header: App, Upstream, Updated
section: Summary | required | max 200
section: Entries | required
section: Replies from* | optional
section: Resolution status* | optional
entries: Entries |
per-entry: 120 250
rule: entry-feedback-fields
rule: entry-blocks-line
rule: feedback-blocking-count
rule: no-glossary
-->

# TrBlazeUI feedback — found while building MyDiary

| | |
|---|---|
| App | MyDiary |
| Upstream | TrBlazeUI (2.1.9) |
| Updated | 2026-10-25 |

## Summary

5 entries: 0 blocking now, 5 filed and not blocking, 0 fixed upstream.

Nothing is blocked. The day-1 mockups are drawn in the library's visual language; these five are feature requests and documentation gaps for the build to confirm.

## Entries

### TR-001 — Timeline is a milestone strip, not a date-grouped entry list

- **Severity:** minor
- **Blocks:** no — the Timeline screen was drawn as Card rows with Badge kind marks, and the work carried on
- **Repro:** read `.trblazeui/TrBlazeUI-AI-Reference.md` §8 "Timeline": `TimelineItem` carries Meta/Title/Subtitle — one event, no children, no click-through row
- **Expected:** a journal app needs a list of clickable entry rows grouped under dates, each with a badge, chips, star and mood
- **Actual:** the shipped Timeline models career-step milestones; the entry list must be hand-built from Card + Badge markup
- **Encountered in:** `*day1-greenfield MyDiary` — mockup `timeline.html`, BRD-22
- **Workaround:** Card rows + Badge + chips, in the library's tokens
- **Suggested fix:** either a `TimelineItem` slot for rich row content and an `Href` on the item, or a first-class grouped list control with clickable rows

### TR-002 — Calendar has no documented per-day content or day link

- **Severity:** minor
- **Blocks:** no — the month grid was drawn in the library's visual language (Badge counts in day cells, days as anchors), and the work carried on
- **Repro:** read `.trblazeui/TrBlazeUI-AI-Reference.md` §5 "Calendar": the documented surface is `<Calendar @bind-Value>` alone
- **Expected:** MyDiary's calendar shows an entry-count badge per day and opens a day's entries when a counted day is tapped
- **Actual:** the Calendar is documented as a date picker; per-day content and day actions are beyond its documented API
- **Encountered in:** `*day1-greenfield MyDiary` — mockup `calendar.html`, BRD-28, BRD-29
- **Workaround:** the grid drawn in library tokens; the build will need a day-cell template or a custom grid
- **Suggested fix:** a `DayTemplate` render fragment on Calendar (day value, content slot) and an optional per-day `Href`/`OnClick`

### TR-003 — PasswordStrength documents no parameters

- **Severity:** minor
- **Blocks:** no — the mockup drew the caption ("Good strength") and the filled track manually in the library's tokens, and the work carried on
- **Repro:** read `.trblazeui/TrBlazeUI-AI-Reference.md` §8 "PasswordStrength": only `<PasswordStrength Value="@password" />` is shown
- **Expected:** a caption text or label parameter and a fill-percentage/score parameter, so the strength reads as shown in the reference's own look
- **Actual:** no parameter table; the caption and fill had to be hand-drawn beside the bar
- **Encountered in:** `*day1-greenfield MyDiary` — mockups `signin-create-account.html`, `settings.html`
- **Workaround:** a `Class`-styled caption beside the component at build time, if the real component exposes no caption
- **Suggested fix:** a parameter table for PasswordStrength (Value, and whatever caption/threshold surface exists)

### TR-004 — No Chip component

- **Severity:** minor
- **Blocks:** no — chips were drawn as Badge-styled pills, which the library fully supports, and the work carried on
- **Repro:** search `.trblazeui/TrBlazeUI-AI-Reference.md` for "chip": only Badge variants exist
- **Expected:** tags, moods and citation chips are a recurring pattern; a small Chip (text, optional icon, optional remove, optional `Href`) would keep them uniform
- **Actual:** every chip must be assembled from Badge or plain markup
- **Encountered in:** `*day1-greenfield MyDiary` — mockups across the set (tags, mood, Ask source chips)
- **Workaround:** Badge-styled pills
- **Suggested fix:** a `Chip` component beside Badge, with optional remove and link

### TR-005 — InputOTP has no documented read-only masked display

- **Severity:** minor
- **Blocks:** no — the PIN-is-set row was drawn as six filled dots in the library's tokens, and the work carried on
- **Repro:** read `.trblazeui/TrBlazeUI-AI-Reference.md` §5 "InputOTP": an entry control only; no read-only or masked display mode is documented
- **Expected:** Settings shows that a PIN is set as six dots, without inviting new entry
- **Actual:** the dots must be hand-drawn, or a masked value fed to the entry control
- **Encountered in:** `*day1-greenfield MyDiary` — mockup `settings.html`, BRD-37
- **Workaround:** render the dots beside the "Change PIN" button
- **Suggested fix:** a read-only masked variant of InputOTP (or a `ReadOnly` parameter)

## Replies from TrBlazeUI

<!-- The upstream team's answers, newest block first. Left in full: this is the record. -->
