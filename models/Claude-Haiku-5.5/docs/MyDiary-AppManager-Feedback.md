# AppManager feedback — found while building MyDiary

| | |
|---|---|
| App | MyDiary |
| Upstream | AppManager |
| Updated | 2026-10-24 |

## Summary

1 entry: 1 blocking now, 0 filed and not blocking, 0 fixed upstream.

One feature is blocked right now: the request for a copy of account data (BRD-47).

## Entries

### AM-001 — The installed-app key cannot request an account-data export

- **Severity:** major
- **Blocks:** yes — BRD-47 (Account: Request a copy of account data) cannot be built. The rest of the Account screen and every other screen carry on.
- **Repro:** `POST /UserSvc/data-export` with an installed-app key (`pk_live_…`) and an `X-Device-Id` header.
- **Expected:** An export request is accepted for the signed-in user, and the user can get the file.
- **Actual:** `403 PUBLIC_KEY_NOT_ALLOWED`. The AppManager guide (v1.7, section 1 list of allowed public-key calls) lists `data-export` as server-only. The export is sent by email when ready; no download link is documented.
- **Encountered in:** BRD-47, requirement drafting for MyDiary (2026-10-24).
- **Workaround:** none. The feature is held, not replaced.
- **Suggested fix:** Allow the installed-app key to call `UserSvc/data-export` for the signed-in user, as it already allows `UserSvc/delete-request`, and return a download link or a delivery method the app can show.

#### Detail

The guide also documents that sign-in over the device cap is not refused (`deviceCap.isOverCap` is set, tokens are still issued). MyDiary enforces the device limit itself, so this is not filed as a defect. It is recorded in the Architecture's cross-cutting section.
