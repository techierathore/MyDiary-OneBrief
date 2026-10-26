# AppManager feedback — found while building MyDiary

| | |
|---|---|
| App | MyDiary |
| Upstream | AppManager |
| Updated | 2026-10-25 |

## Summary

1 entry: 1 blocking now, 0 filed and not blocking, 0 fixed upstream.

AM-001 blocks one requirement — BRD-78, "ask for a copy of your account data" from inside the app. Nothing else is blocked: day-1 documents and every other feature carry on.

## Entries

### AM-001 — `POST /UserSvc/data-export` refuses an installed-app public key

- **Severity:** major
- **Blocks:** yes — BRD-78 (Profile & Support: "Ask for a copy") cannot run from the app; the feature is held until AppManager allows it. The day-1 run itself continued.
- **Repro:** call `POST /UserSvc/data-export` with `X-Api-Key: pk_live_…`, `X-Device-Id: …` and the signed-in user's bearer token → `403 PUBLIC_KEY_NOT_ALLOWED`. The installed-app allow-list in the API usage guide §2.1.1 names every `AuthSvc` endpoint, profile get/put, change-password, delete-request, `LicenseSvc/validate`, `GET /LicenseSvc`, `IssueSvc` and `GroupSvc` — data-export is not on it.
- **Expected:** an installed app can submit the signed-in user's own GDPR data-export request, exactly as it can submit the delete request (allowed since 1.7) — same shape: the account comes from the token, nothing else is read from the caller.
- **Actual:** the copy half of the brief's "ask for a copy or deletion of their account data, all from inside the app" (MyDiary-Brief #3) is impossible with the only key type an installed app may carry; the deletion half works.
- **Encountered in:** `*day1-greenfield MyDiary` stage 1, Architecture §5/§8 and BRD-78.
- **Workaround:** none — standing rule Q11.3 forbids one (routing the request through `IssueSvc` would change its meaning and its handling). The feature is held; the button stays visible, badged "held", and explains itself when tapped.
- **Suggested fix:** add `POST /UserSvc/data-export` (own account only, bearer token required, `X-Device-Id` enforced) to the §2.1.1 public-key allow-list, mirroring the 1.7 delete-request change.

## Replies from AppManager

<!-- The upstream team's answers, newest block first. Left in full: this is the record. -->
