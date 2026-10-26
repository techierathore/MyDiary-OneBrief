# Stream 2 results: one brief, nine AIs

Sunday 25 October 2026. Same brief (`phase1-goal.md`), phase 1 only: requirements (BRD), architecture, screen mockups. Numbers computed from each folder's own `docs/metrics` files by `scripts/stream-compare.py`.

## What each one took

| Model | Tool | Runs | Agent minutes | Session hours | Output tokens | Subagent tokens |
|---|---|---|---|---|---|---|
| Claude Opus 5.5 | Claude Code (Max) | 1 | 18 | 3.0 | 431,696 | 114,596 |
| Claude Sonnet 5.5 | Claude Code (Max) | 1 | 8 | 0.2 | 127,185 | 0 |
| Claude Haiku 5.5 | Claude Code (Max) | 1 | 10 | 0.2 | 797,077 | 571,372 |
| Kimi K2.7 Code | OpenCode (Go Plus) | 4 | 52 | 5.6 | 141,515 | 0 |
| DeepSeek V4 Pro | OpenCode (Go Plus) | 1 | 11 | 0.3 | 38,452 | 0 |
| GLM-5.3 | OpenCode (Go Plus) | 1 | 27 | 0.7 | 192,546 | 143,470 |
| GPT 6 Luna | OpenCode (Go Plus) | 1 | 165 | 2.8 | 146,239 | 94,923 |
| Qwen3.8 Max | OpenCode (Go Plus) | 1 | 63 | 1.1 | 131,061 | 0 |
| Qwen 3.8 27B, local (LM Studio, Mac) | OpenCode, local model | 0 | 929* | 15.5 | 79,042 | 0 |

\* Qwen local has no timed run record; its minutes are the sum of its six OpenCode sessions, 18 to 24 October.

## What each one produced

| Model | BRD ids | Screens | BRD words | Architecture words |
|---|---|---|---|---|
| Claude Opus 5.5 | 97 | 20 | 6,973 | 3,092 |
| Claude Sonnet 5.5 | 93 | 20 | 5,608 | 2,318 |
| Claude Haiku 5.5 | 69 | 20 | 4,734 | 2,329 |
| Kimi K2.7 Code | 81 | 15 | 4,690 | 1,443 |
| DeepSeek V4 Pro | 94 | 20 | 4,953 | 1,344 |
| GLM-5.3 | 61 | 22 | 5,105 | 4,397 |
| GPT 6 Luna | 76 | 20 | 4,288 | 1,948 |
| Qwen3.8 Max | 99 | 19 | 7,097 | 4,746 |
| Qwen 3.8 27B, local (LM Studio, Mac) | 77 | 14 | 4,372 | 4,314 |

## How to read it

- **Agent minutes**: time the framework recorded for the run itself. **Session hours**: how long the harness window was open, including reading and restarts.
- **Output tokens**: what the model wrote. **Subagent tokens**: the part written by helper agents (Claude Code and some OpenCode models spawn them).
- **BRD ids**: distinct requirement ids in the BRD. **Screens**: mockup files written.
- Kimi's four runs: the first stopped after ten minutes, the second finished the documents, the third drew the mockups.
- Luna's run visited the Sonnet folder first by mistake (86 seconds, nothing written of its own); that run is excluded from Sonnet's row.
- Every folder's `docs/metrics` can be uploaded to tflens.techierathore.com for the same numbers.
