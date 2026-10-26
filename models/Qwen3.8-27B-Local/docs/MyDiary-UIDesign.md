# MyDiary UI design

| Field | Value |
|---|---|
| App | MyDiary |
| Kind | app |
| Size | Medium |
| UI library | TrBlazeUI 2.1.9 |
| Theme | light |

## Design system

TrBlazeUI light theme on a white canvas. Text is near-black `#1f1f1f`; the primary action colour is `#1f1f1f` on white, with the library accent reserved for focus rings, links and the active tab. Cards carry a 1px border `#e4e4e7` and a 10px corner radius, with 16px inner padding. Type is the library default sans stack: 28px screen titles, 16px body, 13px captions and badges.

Every screen follows the same frame: a top bar (screen title, right-aligned actions), the main content column at 12px gutter, and, on screens that need it, a bottom action bar. The five primary destinations — Home, Entries, Ask, Account and the Lock gate — appear as a persistent navigation strip on every routed screen except Sign in and Lock.

Lists render as `Item` rows (title line plus one caption line); dense data (devices, sets) renders as `DataTable`. Filters and toggles use `Badge`, `Switch` and `Checkbox`. Destructive actions always confirm in an `AlertDialog`; toasts (`ToastService`) confirm saves and other non-blocking successes. Mood is shown with the `Rating` star glyph at its level.

Motion is the library default: panels slide, dialogs fade, nothing else animates. Disabled controls are 50% opacity. Error text sits below the field in the destructive colour; success uses a `Toast`. Touch targets are at least 44px.

## Screens

One entry per routed page, in navigation order. The mockup shows the layout; the entry fixes the controls, fields, dialogs and states the mockup cannot say.

### Screen: Sign in (`/signin`)

*Mockup:* [mockup](mockups/signin.html) · *Roles:* Free, Paid · *BRD:* BRD-1..6

The screen is a centered card: brand title, then the sign-in form. New users switch to a create-account form in the same card.

| Region | Control |
|---|---|
| Top bar | Typography (title), Button (create account) |
| Form | Label, Input (email), Input (password), Button (sign in) |
| Reset | Button (reset password), Alert (error), Toast (success) |

| Field | Type | Required | Validation |
|---|---|---|---|
| email | Input | yes | valid email |
| password | Input | yes | 8+ characters |

**Dialogs opened here:** none.

**States:** empty — form as shown, no message; loading — sign-in button spins while AppManager answers; error — `Alert` below the form for bad credentials, over-cap device (BRD-3, BRD-4) or offline (BRD-5 read-only notice).

### Screen: Home (`/`)

*Mockup:* [mockup](mockups/home.html) · *Roles:* Free, Paid · *BRD:* BRD-7..11

The daily landing. Today's entries first, then the streak, the On this day card and any due questioning set.

| Region | Control |
|---|---|
| Top bar | Typography (date), Button (write) |
| Today | Item list (entries), Button (write prompt) |
| Streak | StatTile (days) |
| On this day | Card (story teaser), Button (open) |
| Due set | Card (set name), Button (answer) |

| Field | Type | Required | Validation |
|---|---|---|---|
| — (no inputs) | — | — | — |

**Dialogs opened here:** none.

**States:** empty — no entries today, the write prompt is the hero and the streak shows 0; loading — skeleton rows for the entry list; error — AppManager unreachable shows the offline grace notice (BRD-5) above the local list.

### Screen: Write (`/write`)

*Mockup:* [mockup](mockups/write.html) · *Roles:* Free, Paid · *BRD:* BRD-12..17

One journal, no picker (BRD-16). Three modes on a tab strip; the composer fills the column.

| Region | Control |
|---|---|
| Modes | Tabs (10-Thought Dump, Free-Flow, Question set) |
| Composer | Textarea (Rows 3, MaxLines 12), FileUpload (photos), Rating (mood), MultiSelect (tags) |
| Actions | Button (save), Button (discard) |

| Field | Type | Required | Validation |
|---|---|---|---|
| text | Textarea | yes | 1+ non-empty line (dump drops empty lines, BRD-13) |
| photos | FileUpload | no | images, on-device store (BRD-15) |
| mood | Rating | no | 1–5 |
| tags | MultiSelect | no | 0–10, unique |

**Dialogs opened here:** none.

**States:** empty — composer blank, save disabled; loading — save button spins while the entry embeds (BRD-17); error — save failed keeps the text and says the entry is not yet saved.

### Screen: Questioning (`/questioning`)

*Mockup:* [mockup](mockups/questioning.html) · *Roles:* Free, Paid · *BRD:* BRD-18..22

Set list, then the questions of the chosen set with its past answers beside them.

| Region | Control |
|---|---|
| Sets | DataTable (name, due, last answered), Badge (due) |
| Answers | Textarea per question, Timeline (past answers side by side) |
| Custom | Button (build your own) opening a Dialog |
| Actions | Button (save answers) |

| Field | Type | Required | Validation |
|---|---|---|---|
| set name (dialog) | Input | yes | 2–50 chars, unique |
| questions (dialog) | Textarea | yes | 1–20 lines, each 1+ word |
| answer | Textarea | yes | 1+ character per question |

**Dialogs opened here:** Build your own (BRD-20) — collects the set name and its questions before saving.

**States:** empty — no custom sets yet, only the seven built-ins list; loading — save button spins while answers store; error — duplicate set name says the name is taken in the dialog.

### Screen: Entries (`/entries`)

*Mockup:* [mockup](mockups/entries.html) · *Roles:* Free, Paid · *BRD:* BRD-23..24

Browse the whole journal: a newest-first timeline beside a calendar.

| Region | Control |
|---|---|
| Timeline | Timeline (date, mood glyph, tags, preview), Badge (starred) |
| Calendar | Calendar (marked days), Button (day) |
| Filters | MultiSelect (tag, mood), Checkbox (starred) |

| Field | Type | Required | Validation |
|---|---|---|---|
| tag | MultiSelect | no | 0–5 at once |
| mood | MultiSelect | no | 0–5 levels |
| starred | Checkbox | no | toggle |

**Dialogs opened here:** none.

**States:** empty — no entries match the filters, an `Empty` panel with a clear-filters button; loading — skeleton timeline rows; error — calendar tap on a day with no readable entries says so, no crash.

### Screen: Entry detail (`/entries/:id`)

*Mockup:* [mockup](mockups/entry-detail.html) · *Roles:* Free, Paid · *BRD:* BRD-25..31

One entry: its text and photos, and every change — star, mood, tags, private, edit, delete.

| Region | Control |
|---|---|
| Header | Typography (date), Toggle (star), Switch (private) |
| Body | Prose (text), Carousel (photos) |
| Metadata | Rating (mood), MultiSelect (tags) |
| Actions | Button (edit), Button (delete), AlertDialog (confirm delete) |

| Field | Type | Required | Validation |
|---|---|---|---|
| text (edit) | Textarea | yes | 1+ character |
| mood | Rating | no | 1–5 |
| tags | MultiSelect | no | 0–10, unique |

**Dialogs opened here:** delete confirmation — `AlertDialog` names the entry and warns photos and set answers go with it (BRD-31).

**States:** empty — none (a detail always has an entry; a deleted one routes back to Entries); loading — edit save spins and the re-embed runs (BRD-26); error — failed save keeps the original text and says the edit was not made.

### Screen: On this day (`/on-this-day`)

*Mockup:* [mockup](mockups/on-this-day.html) · *Roles:* Free, Paid · *BRD:* BRD-32..34

A warm story per year around the chosen date, each line tappable to its source.

| Region | Control |
|---|---|
| Date | Typography (date), Button (previous/next day) |
| Story | Timeline (one node per year), Prose (story lines), Button (tap to source) |

| Field | Type | Required | Validation |
|---|---|---|---|
| date | (route) | yes | a calendar date |

**Dialogs opened here:** none.

**States:** empty — no entries in the around-date window (BRD-33), an `Empty` panel offers nearby days; loading — a spinner while the story is assembled; error — assembly failure keeps the plain list of source entries as fallback.

### Screen: Search (`/search`)

*Mockup:* [mockup](mockups/search.html) · *Roles:* Free, Paid · *BRD:* BRD-35..41

Keyword first, then the six filters, each combinable.

| Region | Control |
|---|---|
| Keyword | Input (search), Button (go) |
| Filters | DateRangePicker, MultiSelect (tag, set, mood), Checkbox (has photo, starred) |
| Results | Item list (highlighted match line), Badge (match count) |

| Field | Type | Required | Validation |
|---|---|---|---|
| keyword | Input | no | 0+ words |
| date range | DateRangePicker | no | from ≤ to |
| tag / set / mood | MultiSelect | no | 0+ each |
| has photo, starred | Checkbox | no | toggle |

**Dialogs opened here:** none.

**States:** empty — no results, an `Empty` panel lists the active filters to clear; loading — result rows skeleton while the match runs; error — a filter combination that cannot match says so instead of a blank page.

### Screen: Ask (`/ask`)

*Mockup:* [mockup](mockups/ask.html) · *Roles:* Free, Paid · *BRD:* BRD-42..44

Plain-language questions over the journal through TechieRag, always counted, always cited.

| Region | Control |
|---|---|
| Thread | ChatThread, ChatMessage (answer with count and sources) |
| Composer | ChatComposer (question, Enter sends) |
| Sources | Item list (used entries), Button (open entry) |
| Notice | Badge (asks remaining), Alert (no match) |

| Field | Type | Required | Validation |
|---|---|---|---|
| question | ChatComposer | yes | 1+ word, under the period's ask budget |

**Dialogs opened here:** none.

**States:** empty — no question yet, example questions seed the thread; loading — a `Typing` indicator in the answer bubble while the model writes; error — honest no-match (BRD-43) or offline-on-paid with no local model, each in an `Alert`, never a fabricated answer.

### Screen: Account (`/account`)

*Mockup:* [mockup](mockups/account.html) · *Roles:* Free, Paid · *BRD:* BRD-45..57

The settings home: plan, devices, profile, data, lock and reminders, grouped in cards.

| Region | Control |
|---|---|
| Plan | Card (plan, end date, device usage), Button (manage devices) |
| Devices | DataTable (device, last seen), Button (forget), Button (block) |
| Profile | Input (name, email), Button (save) |
| Password | Input (current, new), Button (change) |
| Data | Button (report problem), Button (data copy), Button (delete account) |
| Lock and reminders | Switch (PIN, biometric), TimePicker (reminder time) |
| Sign out | Button (sign out) |

| Field | Type | Required | Validation |
|---|---|---|---|
| name | Input | yes | 1–50 chars |
| email | Input | yes | valid email |
| new password | Input | yes | 8+ characters, different from current |
| reminder time | TimePicker | no | a clock time |

**Dialogs opened here:** delete account — `AlertDialog` requires typing the account email before confirming (BRD-53).

**States:** empty — device list shows only the current device on a fresh account; loading — save and data-copy buttons spin while AppManager answers; error — AppManager unreachable keeps local settings editable and says cloud changes are pending.

### Screen: AI (`/ai`)

*Mockup:* [mockup](mockups/ai.html) · *Roles:* Free, Paid · *BRD:* BRD-58..62

What answers the app: the model, the owner's key, and the asks remaining.

| Region | Control |
|---|---|
| Model | Card (current model), NativeSelect (paid model choice) |
| Key | Input (API key, masked), Button (save key) |
| Budget | Badge (asks remaining this period) |
| Warning | Alert (online model sends text off-device) |

| Field | Type | Required | Validation |
|---|---|---|---|
| model | NativeSelect | no | a model the plan allows (free: local only) |
| api key | Input | no | non-empty when an online model is picked |

**Dialogs opened here:** none.

**States:** empty — free plan shows the local model only, key field hidden (BRD-58); loading — key save spins while it encrypts at rest (BRD-60); error — an online pick without a key says a key is required before it can be used (BRD-61 warning shown).

### Screen: Backup (`/backup`)

*Mockup:* [mockup](mockups/backup.html) · *Roles:* Free, Paid · *BRD:* BRD-63..67

Encrypted journal to the owner's own cloud folder, back out on a new device.

| Region | Control |
|---|---|
| Connection | Button (connect folder), Badge (connected folder) |
| Run | Button (back up now), Progress (upload) |
| Privacy | Switch (include private entries, off by default) |
| Restore | Button (restore), Input (backup PIN) |

| Field | Type | Required | Validation |
|---|---|---|---|
| folder | Button (system picker) | yes | the owner's own Drive or OneDrive folder |
| include private | Switch | no | off by default (BRD-65) |
| backup PIN | Input | yes (restore) | the PIN set on backup |

**Dialogs opened here:** none.

**States:** empty — no folder connected, connect is the hero action; loading — progress bar while the encrypted journal uploads (BRD-64); error — restore with a wrong PIN refuses before any entry is written (BRD-67), folder unreachable says which step failed.

### Screen: Import and export (`/import-export`)

*Mockup:* [mockup](mockups/import-export.html) · *Roles:* Free, Paid · *BRD:* BRD-68..70

The journal to and from plain JSON, including Day One.

| Region | Control |
|---|---|
| Export | Button (export JSON), Progress (building file) |
| Import | Button (import JSON), FileUpload (Day One file) |
| Result | Alert (summary of imported entries) |

| Field | Type | Required | Validation |
|---|---|---|---|
| export scope | (none) | no | full journal, one file (BRD-68) |
| import file | FileUpload | yes | a MyDiary or Day One JSON export |

**Dialogs opened here:** none.

**States:** empty — no journal yet, import is the suggested first step; loading — progress while the file merges (BRD-69 merge, no overwrite) or the export builds; error — an unparseable file lists the reason and leaves the journal untouched.

### Screen: Lock (`/lock`)

*Mockup:* [mockup](mockups/lock.html) · *Roles:* Free, Paid · *BRD:* BRD-71..73

The router gate. While locked, no other route is reachable.

| Region | Control |
|---|---|
| Gate | CenteredPanel (app title), InputOTP (PIN), Button (unlock) |
| Biometric | Button (face / fingerprint, BRD-72) |
| Failure | Alert (wrong PIN, attempts left) |

| Field | Type | Required | Validation |
|---|---|---|---|
| PIN | InputOTP | yes (if set) | 4–8 digits, the account's PIN |
| biometric | Button | no | only when enabled (BRD-57) |

**Dialogs opened here:** none.

**States:** empty — none (the gate is always the whole screen); loading — a short delay on each wrong PIN (BRD-71 blocks every route); error — wrong PIN counts down attempts, then asks for the account password to reset the gate.

## Click-through flow

```mermaid
graph TD
  "Sign in" --> "Home"
  "Home" --> "Write"
  "Home" --> "Questioning"
  "Home" --> "On this day"
  "Questioning" --> "Build your own (dialog)"
  "Entries" --> "Entry detail"
  "On this day" --> "Entry detail"
  "Search" --> "Entry detail"
  "Ask" --> "Entry detail"
  "Account" --> "AI"
  "Account" --> "Backup"
  "Account" --> "Import and export"
  "Lock" --> "Sign in"
```

Every tap on a source entry — from On this day, Ask or Search — lands on Entry detail, the one place an entry is changed.
