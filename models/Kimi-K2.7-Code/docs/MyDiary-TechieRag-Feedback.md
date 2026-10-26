# MyDiary — TechieRag Feedback

| | |
|---|---|
| App | MyDiary |
| Upstream | TechieRag |
| Updated | 2026-10-18 |

## Summary

Three open entries; nothing is blocked yet. The brief requires every AI feature to go through TechieRag, and the following primitives need to be confirmed or added before build.

## Entries

### 2026-10-18 — On This Day story

- **Severity:** High
- **Blocks:** No — mocked with a static warm story; the real implementation needs a TechieRag primitive.
- **Repro:** Open `docs/mockups/home.html`; the On This Day card shows a narrative built from past entries.
- **Expected:** A TechieRag API that takes a date and corpus and returns a short narrative summary of entries from that date in past years, with no invented facts.
- **Actual:** Not confirmed whether TechieRag exposes an "On This Day" narrative generator.
- **Encountered in:** Home screen (`/home`), BRD-8.
- **Workaround:** Query TechieRag with a prompt asking for a narrative from entries on target dates; guard against invented facts with cited ids.
- **Suggested fix:** Add a `generateOnThisDayNarrative` primitive, or publish the prompt pattern.

### 2026-10-18 — Plain-question answering with counted answers and cited sources

- **Severity:** High
- **Blocks:** No — the AI Ask screen is mocked with a static answer and source list.
- **Repro:** Open `docs/mockups/ask.html`; the user asks "How many coffee bottles did I open last year?" and gets a counted answer with sources listed.
- **Expected:** A TechieRag API that accepts a plain-language question, searches the journal, returns a counted answer, and lists the entry ids used.
- **Actual:** Not confirmed whether TechieRag exposes a question-answering primitive with citations.
- **Encountered in:** AI Ask screen (`/ask`), BRD-38 to BRD-43.
- **Workaround:** Use TechieRag's search + completion APIs and post-process to extract counts and citations.
- **Suggested fix:** Add an `askJournal(question, corpus)` primitive returning `{ answer, count, sourceEntryIds, no_match }`.

### 2026-10-18 — Temporal comparison of one question's answers

- **Severity:** Medium
- **Blocks:** No — the AI Compare screen is mocked with a monthly grid.
- **Repro:** Open `docs/mockups/ask-compare.html`; the user picks a saved question and compares its answers across months or years.
- **Expected:** A TechieRag API that replays a saved question against each period (month/year) and returns a structured answer per period, with a `no_answer` marker when the period has no matching entries.
- **Actual:** Not confirmed whether TechieRag exposes a temporal comparison primitive.
- **Encountered in:** AI Compare screen (`/ask/compare`), BRD-44 to BRD-47.
- **Workaround:** Run the plain-question primitive once per period and aggregate results in the app.
- **Suggested fix:** Add a `compareAnswersOverTime(question, periods)` primitive to TechieRag, or document the aggregation pattern.
