# MyDiary-Claude — Misses

| | |
|---|---|
| App | MyDiary-Claude |
| Count | 1 logged: 0 open, 1 fixed, 0 will not fix |
| Source | `docs/metrics/misses.jsonl`, one row per miss record. Rewritten by `tf-misses-md.sh` on every new record. Never edit it: a wrong row is corrected by a new record. |
| Updated | 2026-10-18 |

**Whose gap** answers the four questions of the miss protocol: **the app's spec** did not say it, so the checklist line is fixed; **the framework never said it**, so one requirement line and a check are added; **the check was too weak** (a review, or a script that did not fire), so the check is fixed; **said and ignored**, so the rule becomes a hook or is deleted. **not sorted** means the record predates the sort or nobody has answered yet; `bash .tfcore/utils/tf-emit.sh --amend <miss> sort <spec|unsaid|weak-check|ignored>` completes it.

## Fixed (1)

| Miss | Found | Closed | Whose gap | What went wrong |
|---|---|---|---|---|
| MISS-MyDiary-Claude-20261018-01 | 2026-10-18 by owner | 2026-10-18 by log-miss | the framework never said it | Mockups were not interactive: choosing a theme did not change it, switches did not flip, and choices (toggle groups, radio cards, the drop-down, tabs, calendar days, tag chips) did not change; a mockup must behave, not just look right. |
