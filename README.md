# MyDiary: one brief, nine AIs

Nine AI coding models were given the same brief for a diary app, MyDiary, and asked to write only phase 1: the requirements (BRD), the architecture and the screen mockups. Same framework ([TechieFlow](https://github.com/techierathore/TechieFlow)), same command, no corrections from me. Every model's output is in this repository, unedited, with the metrics files the framework wrote during the run.

Shown live on YouTube on 25 October 2026 (Stream 2 of the series). Stream 1, on 18 October, compared the first two.

## The rules

1. Same brief and the same framework version for every model. The brief is in [`brief/phase1-goal.md`](brief/phase1-goal.md); the app concept each model read is `docs/MyDiary-Brief.md` inside its folder.
2. I corrected nothing. A weak document is that model's result.
3. No switching models in the middle of a run.
4. Failures stay in.
5. Each run names its machine: Claude Max, OpenCode Go Plus, or my own Mac.




## My scores

Five questions, 1 to 5 each, scored by me after reading each BRD and the same three screens (Home, Write an entry, Ask).

| Question | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 | Kimi K2.7 | DeepSeek V4 Pro | GLM-5.3 | GPT 6 Luna | Qwen3.8 Max | Qwen 27B local |
|---|---|---|---|---|---|---|---|---|---|
| Covers everything the brief asked for | 5 | 4.5 | 4.5 | 3.5 | 3.5 | 5 | 3.5 | 5 | 4.5 |
| Every requirement has a screen, every screen a requirement | 5 | 4.5 | 4 | 3 | 4 | 4.5 | 4.5 | 4.5 | 4 |
| Architecture I would actually build | 5 | 3.5 | 3.5 | 3.5 | 3.5 | 5 | 3.5 | 5 | 4.5 |
| Invented nothing the brief never asked for (5 = nothing invented) | 4.5 | 4.5 | 4.5 | 4.5 | 4.5 | 4.5 | 4.5 | 4.5 | 4.5 |
| Little to fix before building (5 = least to fix) | 5 | 3 | 3 | 3.5 | 4 | 5 | 4.5 | 5 | 4.5 |
| **Total (of 25)** | **24.5** | **20** | **19.5** | **18** | **19.5** | **24** | **20.5** | **24** | **22** |

Ranked by my total: Claude Opus 5.5 (24.5), then GLM-5.3 and Qwen3.8 Max (24 each), Qwen 3.8 27B local (22), GPT 6 Luna (20.5), Claude Sonnet 5.5 (20), Claude Haiku 5.5 and DeepSeek V4 Pro (19.5 each), Kimi K2.7 Code (18). The scores are one reader's opinion; the poll below is yours.

## The documents, model by model

Every link opens the file in this repository. The `.html` versions are the same documents rendered for reading; GitHub shows their source, so open them after cloning, or read the `.md`. Mockups are one HTML file per screen.

| Model | BRD | Architecture | UI design | Mockups | Status file | Metrics |
|---|---|---|---|---|---|---|
| Claude Opus 5.5 | [md](models/Claude-Opus-5.5/docs/MyDiary-BRD.md) · [html](models/Claude-Opus-5.5/docs/MyDiary-BRD.html) | [md](models/Claude-Opus-5.5/docs/MyDiary-Architecture.md) · [html](models/Claude-Opus-5.5/docs/MyDiary-Architecture.html) | [md](models/Claude-Opus-5.5/docs/MyDiary-UIDesign.md) · [html](models/Claude-Opus-5.5/docs/MyDiary-UIDesign.html) | [20 screens](models/Claude-Opus-5.5/docs/mockups/) | [status](models/Claude-Opus-5.5/PROJECT-STATUS.md) | [metrics](models/Claude-Opus-5.5/docs/metrics/) |
| Claude Sonnet 5.5 | [md](models/Claude-Sonnet-5.5/docs/MyDiary-BRD.md) · [html](models/Claude-Sonnet-5.5/docs/MyDiary-BRD.html) | [md](models/Claude-Sonnet-5.5/docs/MyDiary-Architecture.md) · [html](models/Claude-Sonnet-5.5/docs/MyDiary-Architecture.html) | [md](models/Claude-Sonnet-5.5/docs/MyDiary-UIDesign.md) · [html](models/Claude-Sonnet-5.5/docs/MyDiary-UIDesign.html) | [20 screens](models/Claude-Sonnet-5.5/docs/mockups/) | [status](models/Claude-Sonnet-5.5/PROJECT-STATUS.md) | [metrics](models/Claude-Sonnet-5.5/docs/metrics/) |
| Claude Haiku 5.5 | [md](models/Claude-Haiku-5.5/docs/MyDiary-BRD.md) · [html](models/Claude-Haiku-5.5/docs/MyDiary-BRD.html) | [md](models/Claude-Haiku-5.5/docs/MyDiary-Architecture.md) · [html](models/Claude-Haiku-5.5/docs/MyDiary-Architecture.html) | [md](models/Claude-Haiku-5.5/docs/MyDiary-UIDesign.md) · [html](models/Claude-Haiku-5.5/docs/MyDiary-UIDesign.html) | [20 screens](models/Claude-Haiku-5.5/docs/mockups/) | [status](models/Claude-Haiku-5.5/PROJECT-STATUS.md) | [metrics](models/Claude-Haiku-5.5/docs/metrics/) |
| Kimi K2.7 Code | [md](models/Kimi-K2.7-Code/docs/MyDiary-BRD.md) · [html](models/Kimi-K2.7-Code/docs/MyDiary-BRD.html) | [md](models/Kimi-K2.7-Code/docs/MyDiary-Architecture.md) · [html](models/Kimi-K2.7-Code/docs/MyDiary-Architecture.html) | [md](models/Kimi-K2.7-Code/docs/MyDiary-UIDesign.md) · [html](models/Kimi-K2.7-Code/docs/MyDiary-UIDesign.html) | [15 screens](models/Kimi-K2.7-Code/docs/mockups/) | [status](models/Kimi-K2.7-Code/PROJECT-STATUS.md) | [metrics](models/Kimi-K2.7-Code/docs/metrics/) |
| DeepSeek V4 Pro | [md](models/DeepSeek-V4-Pro/docs/MyDiary-BRD.md) · [html](models/DeepSeek-V4-Pro/docs/MyDiary-BRD.html) | [md](models/DeepSeek-V4-Pro/docs/MyDiary-Architecture.md) · [html](models/DeepSeek-V4-Pro/docs/MyDiary-Architecture.html) | [md](models/DeepSeek-V4-Pro/docs/MyDiary-UIDesign.md) · [html](models/DeepSeek-V4-Pro/docs/MyDiary-UIDesign.html) | [20 screens](models/DeepSeek-V4-Pro/docs/mockups/) | [status](models/DeepSeek-V4-Pro/PROJECT-STATUS.md) | [metrics](models/DeepSeek-V4-Pro/docs/metrics/) |
| GLM-5.3 | [md](models/GLM-5.3/docs/MyDiary-BRD.md) · [html](models/GLM-5.3/docs/MyDiary-BRD.html) | [md](models/GLM-5.3/docs/MyDiary-Architecture.md) · [html](models/GLM-5.3/docs/MyDiary-Architecture.html) | [md](models/GLM-5.3/docs/MyDiary-UIDesign.md) · [html](models/GLM-5.3/docs/MyDiary-UIDesign.html) | [22 screens](models/GLM-5.3/docs/mockups/) | [status](models/GLM-5.3/PROJECT-STATUS.md) | [metrics](models/GLM-5.3/docs/metrics/) |
| GPT 6 Luna | [md](models/GPT-6-Luna/docs/MyDiary-BRD.md) · [html](models/GPT-6-Luna/docs/MyDiary-BRD.html) | [md](models/GPT-6-Luna/docs/MyDiary-Architecture.md) · [html](models/GPT-6-Luna/docs/MyDiary-Architecture.html) | [md](models/GPT-6-Luna/docs/MyDiary-UIDesign.md) · [html](models/GPT-6-Luna/docs/MyDiary-UIDesign.html) | [20 screens](models/GPT-6-Luna/docs/mockups/) | [status](models/GPT-6-Luna/PROJECT-STATUS.md) | [metrics](models/GPT-6-Luna/docs/metrics/) |
| Qwen3.8 Max | [md](models/Qwen3.8-Max/docs/MyDiary-BRD.md) · [html](models/Qwen3.8-Max/docs/MyDiary-BRD.html) | [md](models/Qwen3.8-Max/docs/MyDiary-Architecture.md) · [html](models/Qwen3.8-Max/docs/MyDiary-Architecture.html) | [md](models/Qwen3.8-Max/docs/MyDiary-UIDesign.md) · [html](models/Qwen3.8-Max/docs/MyDiary-UIDesign.html) | [19 screens](models/Qwen3.8-Max/docs/mockups/) | [status](models/Qwen3.8-Max/PROJECT-STATUS.md) | [metrics](models/Qwen3.8-Max/docs/metrics/) |
| Qwen 3.8 27B, local | [md](models/Qwen3.8-27B-Local/docs/MyDiary-BRD.md) · [html](models/Qwen3.8-27B-Local/docs/MyDiary-BRD.html) | [md](models/Qwen3.8-27B-Local/docs/MyDiary-Architecture.md) · [html](models/Qwen3.8-27B-Local/docs/MyDiary-Architecture.html) | [md](models/Qwen3.8-27B-Local/docs/MyDiary-UIDesign.md) · [html](models/Qwen3.8-27B-Local/docs/MyDiary-UIDesign.html) | [14 screens](models/Qwen3.8-27B-Local/docs/mockups/) | [status](models/Qwen3.8-27B-Local/PROJECT-STATUS.md) | [metrics](models/Qwen3.8-27B-Local/docs/metrics/) |

The brief every model read: [`brief/phase1-goal.md`](brief/phase1-goal.md) (the command) and any folder's `docs/MyDiary-Brief.md` (the app concept, identical in all nine).

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

\* The local Qwen run has no timed run record; its minutes are its six OpenCode sessions added up, 18 to 24 October.

**Agent minutes** is the time the framework recorded for the run. **Session hours** is how long the harness window was open, including my own reading and restarts. **Output tokens** is what the model wrote; **subagent tokens** is the part written by helper agents it spawned. Kimi's four runs: the first stopped after ten minutes, the second finished the documents, the third drew the mockups.

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

**BRD ids** is the count of distinct requirement ids in the BRD. **Screens** is the number of mockup files written.

## The poll

Which model's plan should become the build? Vote on the YouTube community post (link to follow) or in the Discussions tab of this repository. Open for two weeks from 26 October 2026. The winner's plan becomes the MyDiary app, built in its own repository, `MyDiary`, and that build gets its own stream.

## What is in each model folder

```
models/<Model>/
  PROJECT-STATUS.md            the framework's status file at the end of the run
  docs/
    MyDiary-Brief.md           the concept every model read (identical in all nine)
    MyDiary-BRD.md / .html     requirements
    MyDiary-Architecture.md    architecture
    MyDiary-UIDesign.md        screen design notes
    mockups/                   one HTML file per screen
    metrics/                   runs, gates, sessions, commits, misses (JSONL) written by the framework
    *-Feedback.md              issues the model filed against my libraries during its run, where it did
```

Some folders also hold `AppManager-api-usage-guide.md`, the public guide for the sign-in service the brief points at; the framework copies it into the project. The runs' chat transcripts are not included.

## Where the numbers come from

Every number above is computed from the `docs/metrics` files in the model folders, nothing is typed in by hand. Upload any folder's `docs/metrics` to [tflens.techierathore.com](https://tflens.techierathore.com) and the same figures appear there, next to the file they came from. [`results/stream2-results.md`](results/stream2-results.md) is the same table set as shown on the stream.
