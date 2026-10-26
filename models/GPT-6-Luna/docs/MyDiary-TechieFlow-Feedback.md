# TechieFlow feedback — found while building MyDiary

| | |
|---|---|
| App | MyDiary |
| Upstream | TechieFlow |
| Updated | 2026-10-25 |

## Summary

1 entry: 0 blocking now, 1 filed and not blocking, 0 fixed upstream.

Nothing is blocked.

## Entries

### TF-001 — The run record list omits the day-one stage values

- **Severity:** minor
- **Blocks:** no — the task's `stage1` value is retained and the run continues.
- **Repro:** Compare `.tfcore/tasks/day1-greenfield.md` step 12 with `.tfcore/telemetry/SCHEMA.md` §2.
- **Expected:** The run-record description lists `stage1` and `stage2` for this command, or the task uses the documented values.
- **Actual:** The task asks for `mode: stage1`, while the run-record description lists only `build`, `fix` or `null`.
- **Encountered in:** `day1-greenfield MyDiary` Stage 1
- **Workaround:** Keep the task's `stage1` value; the record writer accepts it.
- **Suggested fix:** Add the day-one stage values to the run-record description.

## Replies from TechieFlow

<!-- The upstream team's answers, newest block first. Left in full: this is the record. -->
