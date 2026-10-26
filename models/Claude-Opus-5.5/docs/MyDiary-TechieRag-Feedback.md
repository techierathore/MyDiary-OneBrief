# TechieRag feedback — found while building MyDiary

| | |
|---|---|
| App | MyDiary |
| Upstream | TechieRag |
| Updated | 2026-10-18 |

## Summary

4 entries: 0 blocking now, 4 filed and not blocking, 0 fixed upstream.

Nothing is blocked. When the screens are built, TR-RAG-001 and TR-RAG-004 will hold Ask, and TR-RAG-002 will hold the On This Day story.

An earlier MyDiary attempt filed TR-RAG-001 "No on-device LLM completion provider" in TechieRag's own copy of this file. `TechieRag.Local` has since been published, so that request is met. This file starts again for the new project.

## Entries

### TR-RAG-001 — No way to count across every matching entry

- **Severity:** major
- **Blocks:** no — found at day-1; the Ask screen is planned and waits for this.
- **Repro:** `AskAsync("How many coffee bottles did I open last year?")` over a year of entries. Retrieval returns the top 5 passages (agentic search at most 20), so the answer is drawn from a sample.
- **Expected:** A counted answer over every matching entry, with each entry it counted listed as a source.
- **Actual:** No counting or totalling call exists. The reference points only to structured output per passage or to tools the host writes.
- **Encountered in:** `*day1-greenfield MyDiary`, brief Must do 17.
- **Workaround:** none. MyDiary writes no AI code of its own.
- **Suggested fix:** A counting call that reads every passage matching a question and a filter, extracts the quantity from each, and returns the total with the per-entry sources.

### TR-RAG-002 — Search cannot be limited to a date or date range

- **Severity:** major
- **Blocks:** no — found at day-1; the On This Day story and date-bound questions wait for this.
- **Repro:** `SearchOptions` has `TopK`, `DocumentFilter(s)` and `Rerank` only. Metadata such as `entryDate` comes back on results but cannot filter them.
- **Expected:** Ingest each entry with a date, then ask "entries on 18 October in past years" or "last year" and get only those.
- **Actual:** No metadata or date filter, so "last year" or "on this date" questions search the whole journal.
- **Encountered in:** `*day1-greenfield MyDiary`, brief Must do 15 and 17.
- **Workaround:** none.
- **Suggested fix:** A metadata filter on `SearchOptions` and on the ask calls (equals, range), with dates as a first-class type.

### TR-RAG-003 — The on-device model cannot be shipped inside the app

- **Severity:** major
- **Blocks:** no — the app downloads the model on first launch until this changes; recorded as an open question.
- **Repro:** Reference §2: model weights "are downloaded once into the model root … never packed". Only `UseLocalLlm(DirectoryInfo, …)` reads a folder the app places, with no MAUI recipe.
- **Expected:** Free users get "the smallest built-in AI model, installed with the app", working offline from the first launch on Android, iPhone, iPad, Windows and Mac.
- **Actual:** About 420 MB is downloaded at first use (333 MB language model, 91 MB search model). The two documents disagree on whether the search model is already built in.
- **Encountered in:** `*day1-greenfield MyDiary`, brief Must do 19.
- **Workaround:** none.
- **Suggested fix:** A documented way to ship the smallest model pair inside a MAUI app package and load it with tool calling on.

### TR-RAG-004 — No promised "nothing found" answer

- **Severity:** major
- **Blocks:** no — found at day-1; the Ask screen waits for this with TR-RAG-001.
- **Repro:** Ask about something never written. The reference documents score thresholds (`WeakScoreThreshold` 0.55, `NoneScoreThreshold` 0.35) but no answer that is guaranteed to say "no entries match".
- **Expected:** When no passage passes the threshold, the answer says nothing matched and gives no number.
- **Actual:** It depends on the prompt and on the model; a 0.5B model may invent an answer.
- **Encountered in:** `*day1-greenfield MyDiary`, brief Must do 17 ("never makes one up").
- **Workaround:** none.
- **Suggested fix:** An option on the ask calls that returns a fixed "no match" result, with no model call, when nothing passes `NoneScoreThreshold`.
