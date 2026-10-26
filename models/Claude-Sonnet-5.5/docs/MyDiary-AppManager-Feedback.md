# AppManager feedback — found while building MyDiary

| | |
|---|---|
| App | MyDiary |
| Upstream | AppManager |
| Updated | 2026-10-24 |

## Summary

1 entry: 0 blocking now, 1 filed and not blocking, 0 fixed upstream.

Nothing is blocked. One requirement (a user asking for a copy of their account data from inside the app) is held until this is fixed.

## Entries

### AM-001 — An installed app cannot send the user's data-copy request

- **Severity:** major
- **Blocks:** no — the rest of MyDiary goes ahead; the "Ask for a copy of my data" request is held until this is fixed.
- **Repro:** read `AppManager-api-usage-guide.md` v1.7, section 2.1.1 and `POST /UserSvc/data-export`: an installed-app key (`pk_live_…`) may call `POST /UserSvc/delete-request` but not `POST /UserSvc/data-export`, which "stays server-only (key and secret) for now".
- **Expected:** an app with no server of its own can offer the user's right to a copy of their data, as version 1.7 already allows for deletion.
- **Actual:** the call answers `403 PUBLIC_KEY_NOT_ALLOWED` for an installed-app key.
- **Encountered in:** `*day1-greenfield MyDiary`, BRD item "Ask for a copy of my data" on the Account screen.
- **Workaround:** none. The button and dialog are in the design; the request waits for the fix. No second route is built.
- **Suggested fix:** let an installed-app key call `POST /UserSvc/data-export` for the signed-in user's own account only, with the same rules 1.7 gave to `delete-request`.

## Replies from AppManager

<!-- The upstream team's answers, newest block first. Left in full: this is the record. -->
