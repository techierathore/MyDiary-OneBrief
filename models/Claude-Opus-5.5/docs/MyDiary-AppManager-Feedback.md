# AppManager feedback — found while building MyDiary

| | |
|---|---|
| App | MyDiary |
| Upstream | AppManager |
| Updated | 2026-10-18 |

## Summary

3 entries: 0 blocking now, 3 filed and not blocking, 0 fixed upstream.

Nothing is blocked. AM-001 will hold MyDiary's "copy of my data" and "delete my data" requests when that screen is built.

## Entries

### AM-001 — An installed app cannot ask for a copy or deletion of the user's account data

- **Severity:** major
- **Blocks:** no — found while writing MyDiary's day-1 documents; the two requests are planned and wait for this fix when the Account screen is built.
- **Repro:** API guide 1.6, line 226, lists what an installed-app key (`pk_live_`) may call. `POST /UserSvc/data-export` and `POST /UserSvc/delete-request` are not on it, so they answer `403 PUBLIC_KEY_NOT_ALLOWED`.
- **Expected:** A signed-in user of an installed app can ask for a copy of their account data and ask for its deletion, with their own token, as MyDiary's brief requires ("ask for a copy or deletion of their account data, all from inside the app").
- **Actual:** Only a server key can reach both calls, and an installed app has no server key.
- **Encountered in:** `*day1-greenfield MyDiary`, brief Must do 3; MyDiary BRD, Account screen.
- **Workaround:** none. The two requests wait.
- **Suggested fix:** Add `POST /UserSvc/data-export` and `POST /UserSvc/delete-request` to the calls an installed-app key may make, both still needing the user's own token. Sevak asked the same question for deletion (Sevak AM-003).

### AM-002 — No device limit for a user without a licence

- **Severity:** minor
- **Blocks:** no — MyDiary counts the user's signed-in devices from `GET /AuthSvc/devices` and refuses a second one itself.
- **Repro:** Sign in with `POST /AuthSvc/device-login` as a user with no licence. `deviceCap` comes back `null` (guide, device-login response), so nothing says the free tier allows one device.
- **Expected:** An application can set a device limit for users without a paid licence (MyDiary's free tier: one device), and the licence check reports it the same way as a paid cap.
- **Actual:** A cap exists only on device-capped licence types, and an over-cap device is reported, never refused (guide L659).
- **Encountered in:** `*day1-greenfield MyDiary`, brief Must do 4.
- **Workaround:** MyDiary enforces the one-device rule from the device list, as the guide directs for caps.
- **Suggested fix:** Add a per-application "free tier maximum devices" setting, returned as `deviceCap` for a user with no licence.

### AM-003 — The MAUI example sends an API secret that an installed app must not have

- **Severity:** minor
- **Blocks:** no — MyDiary follows §2.1.1 and sends only the `pk_live_` key with `X-Device-Id`.
- **Repro:** API guide 1.6, §4.5 (lines 4637 to 4681) builds the client with `ApiKey` and `ApiSecret` inside the MAUI app.
- **Expected:** The MAUI example uses the installed-app key with no secret, sends `X-Device-Id`, and calls `device-register` and `device-login`, as §2.1.1 says.
- **Actual:** The example contradicts §2.1.1; a copied example would ship a secret inside the app, and AppManager refuses a secret with a public key (`401 INVALID_API_KEY`).
- **Encountered in:** `*day1-greenfield MyDiary`, Architecture Stack decisions Q4.
- **Workaround:** none needed; MyDiary follows §2.1.1.
- **Suggested fix:** Rewrite the §4.5 example with the installed-app key, `X-Device-Id` and the device sign-in calls.
