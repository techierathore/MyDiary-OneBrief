# TechieRag feedback — found while building MyDiary

| | |
|---|---|
| App | MyDiary |
| Upstream | TechieRag |
| Updated | 2026-10-25 |

## Summary

3 entries: 2 blocking now, 1 filed and not blocking, 0 fixed upstream.

Exact counts and no-match refusal, and free on-device AI on Intel Macs, are blocked; the app target is set to .NET 10.

## Entries

### TR-RAG-001 — RAG does not document exact counts or guaranteed abstention

- **Severity:** blocker
- **Blocks:** yes — implementation of MyDiary Brief item 17's counted, sourced answer and no-match refusal without MyDiary-owned AI logic
- **Repro:** `AskAsync` returns generated `Answer` and retrieved `Sources`; the reference promises neither exact counts nor abstention.
- **Expected:** TechieRag guarantees an exact count, lists its source entries, and abstains when none match.
- **Actual:** retrieved sources do not prove a complete count; the public local model also refuses tool calls.
- **Encountered in:** `docs/MyDiary-Brief.md`, item 17 (Stage 1)
- **Workaround:** none; MyDiary cannot add its own AI code.
- **Suggested fix:** provide a TechieRag-supported count, source-evidence and abstention feature that also works with `TechieRag.Local`.

### TR-RAG-002 — Local inference packages target only .NET 10

- **Severity:** major
- **Blocks:** no — MyDiary's Architecture selects .NET 10, so its local-model packages are compatible.
- **Repro:** `TechieRag.Local` and `TechieRag.Embedded` 1.1.5 target only `net10.0`; core also targets `net8.0`.
- **Expected:** local inference packages compatible with the app's selected target framework.
- **Actual:** a generic template says .NET 9, which is incompatible with these local packages.
- **Encountered in:** MyDiary Brief item 19 and the Stage 1 stack decision
- **Workaround:** MyDiary targets .NET 10, so its local model can use these packages.
- **Suggested fix:** add a `net9.0` target to both packages if .NET 9 consumers are intended.

### TR-RAG-003 — Local inference does not run on Intel Macs

- **Severity:** blocker
- **Blocks:** yes — BRD-37's free on-device AI cannot run on Intel Macs; the shared screens and other targets continue.
- **Repro:** the public reference says `LocalLlmProvider` throws `PlatformNotSupportedException` on an Intel Mac; local inference is listed for Apple-silicon macOS.
- **Expected:** the built-in on-device model runs on every Mac covered by the brief.
- **Actual:** the documented local runtime excludes Intel Macs.
- **Encountered in:** `docs/MyDiary-Brief.md`, items 19 and 24
- **Workaround:** none; BRD-37 remains blocked on Intel Macs, and no alternate AI runtime is added to MyDiary.
- **Suggested fix:** support Intel Mac in the local model package or provide an upstream-supported on-device inference path for Intel Macs.
