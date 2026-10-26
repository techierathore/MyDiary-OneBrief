# TrBlazeUI feedback — found while building MyDiary

| | |
|---|---|
| App | MyDiary |
| Upstream | TrBlazeUI |
| Updated | 2026-10-18 |

## Summary

1 entry: 0 blocking now, 1 filed and not blocking, 0 fixed upstream.

Nothing is blocked. TR-001 will hold the calendar marks on MyDiary's Browse screen (BRD-42) when that screen is built.

## Entries

### TR-001 — The Calendar cannot mark the days that have content

- **Severity:** major
- **Blocks:** no — found while drawing MyDiary's mockups; the Browse calendar is designed with marked days and waits for this fix when it is built.
- **Repro:** TrBlazeUI 2.1.9 `Calendar` takes `Mode` (Single, Multiple, Range), `DisabledDates` and `FirstDayOfWeek`. It has no parameter or template for what a day cell shows.
- **Expected:** A journal marks each day that has an entry (a dot under the number), so the user can see at a glance which days they wrote on and pick one.
- **Actual:** Every day cell looks the same apart from selected, today and disabled.
- **Encountered in:** `*day1-greenfield MyDiary`, mockups for Browse (BRD-42, BRD-43).
- **Workaround:** none.
- **Suggested fix:** Add a `DayTemplate` (a render fragment given the date) or a `MarkedDates` set with a `MarkClass`, so an app can draw a dot or a count on chosen days.
