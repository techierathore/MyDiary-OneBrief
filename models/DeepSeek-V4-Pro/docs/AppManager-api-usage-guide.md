# App Manager API Usage Guide

**Version:** 1.7
**Last Updated:** 2026-10-21
**Base URL:** `https://api.appmanager.com` (or `https://localhost:32769/` for local development)

> **Upgrading from v1.6?** Nothing to change: 1.7 only lets an installed-app key send the signed-in user's own account deletion request — see [What's new in 1.7](#whats-new-in-17).
> **Upgrading from v1.5?** See [`api-migration-notes-v1.6.md`](api-migration-notes-v1.6.md) for installed-app keys, family and team groups, and the behaviour changes on feature access, licence validation and password reset.
> **Upgrading from v1.4?** See [`api-migration-notes-v1.5.md`](api-migration-notes-v1.5.md) for the device endpoints, the new error codes and the two behaviour changes on endpoints you already call. v1.5 is additive — no existing endpoint changes its URL, its request shape or its success response.
> **Upgrading from v1.3?** See [`api-migration-notes-v1.4.md`](api-migration-notes-v1.4.md) for the full request-bound parameter rename map. v1.4 is a breaking change — every query/form/route parameter name now carries the `a` prefix.

This guide provides comprehensive documentation for integrating child applications with App Manager's API. Whether you're building a web app, mobile app, desktop application, or AI agent, this guide covers everything you need to know.

### What's new in 1.7

Additive, from feedback raised while building a desktop child application (2026-10-21). Nothing you already send or read changes shape, and a key and secret work exactly as before.

- **An installed app can send its user's own account deletion request.** `POST /UserSvc/delete-request` now accepts an installed-app key (`pk_live_…` with `X-Device-Id`) as well as a key and secret. An app with no server of its own can offer the user's right to erasure in the app itself. The rule:
  - **Only the signed-in user's own account.** The account is always the one the bearer token names; nothing in the request can name another user. `confirmEmail` must be that user's email, or the call answers `400 EMAIL_MISMATCH` and nothing is queued.
  - **Nothing is deleted by the call.** It creates a `Pending` deletion request in the same admin approval queue as every other deletion request (GDPR Dashboard, `/settings/compliance`). An administrator reviews and processes it; until then the account keeps working.
  - Every other rule of the call is unchanged; see [`POST /UserSvc/delete-request`](#post-usersvc-delete-request) and [Section 2.1.1](#211-installed-apps-public-keys).
- `POST /UserSvc/data-export` stays server-only (key and secret) for now.

### What's new in 1.6

No endpoint changes its URL or its request or response shape, and a key and secret work exactly as before on every endpoint. Some answers change for users with groups or more than one licence — read the 2026-10-04 list below.

- **Public API keys for installed apps (2026-09-19).** An app installed on users' own computers or phones cannot keep a secret, so an Admin can now generate an **installed-app key** (`pk_live_…`) on the API Keys screen. It has no secret: send `X-Api-Key` alone, with an `X-Device-Id` header on every call. It works only on sign-in (every `AuthSvc` endpoint), profile and password change, the licence check and list, issues, and every `GroupSvc` endpoint. See [Section 2.1.1](#211-installed-apps-public-keys).
- **New error codes:** `PUBLIC_KEY_NOT_ALLOWED` (403), `DEVICE_ID_REQUIRED` (400) and `RATE_LIMITED` (429, with `Retry-After`) — see [Section 6.2](#62-common-error-codes).
- **Family and team groups (2026-10-03).** A new `GroupSvc` with ten endpoints ([Section 3.7](#37-group-service-groupsvc)): create a group, add existing users with a relationship and a role, create a child account that signs in on the ordinary `login` with its email and a 4–8 digit PIN, reset a child's PIN, hand the group over, and see when the children signed in. A licence can be held by a group, and its type's member limit caps the group. New error codes `GROUP_NOT_FOUND` (404), `NOT_GROUP_OWNER` (403), `SECONDARY_OWNER_EXISTS` (409), `RELATIONSHIP_NOT_FOUND` (400), `GROUP_MEMBER_LIMIT` (409), `ALREADY_GROUP_MEMBER` (409).
- **Behaviour changes (2026-10-03 / 2026-10-04)** — see [`api-migration-notes-v1.6.md`](api-migration-notes-v1.6.md):
  - **Feature access merges every active licence** the user has in your application, their own and their groups': per feature, Binary is on if any licence turns it on, Level takes the highest, `-1` (unlimited) beats any number. A licence past its expiry date gives nothing even while its status still reads `Active`, and a licence whose type has been deleted gives nothing ([Section 3.4](#34-feature-service-featuresvc)).
  - **`POST /LicenseSvc/validate`** takes the user's own licence first, then a group licence; **`GET /LicenseSvc`** also lists the group licences. A licence whose type has been deleted is no longer valid, listed or reported on login; a type that is only *inactive* (no longer sold) keeps working for existing holders ([Section 3.2](#32-license-service-licensesvc)).
  - **PIN accounts** (children) are held to the PIN rule, not the password rule, on `POST /AuthSvc/reset-password` and `POST /UserSvc/change-password` ([Section 3.3](#33-user-service-usersvc)).
  - **`POST /AuthSvc/reset-password`** with a used or expired token now answers `400 INVALID_RESET_TOKEN` before the new password is checked against any rule ([Section 3.1](#post-authsvc-reset-password)).
  - **Owner deletion (2026-10-04):** the owner's groups are deleted even with a secondary owner; members keep a role they had before joining; a group-given role ends only when no other group or own licence reaches your application; a member left with nothing is soft-deleted ([Section 3.7](#owner-deletion-and-what-members-keep)).
  - **Login's `activeLicense` includes group licences (2026-10-04):** `login` and `device-login` report the same licence `POST /LicenseSvc/validate` chooses — the user's own first, then a group licence — so a member covered only by a group licence no longer gets `null`. The shape is unchanged ([Section 3.1](#post-authsvc-login)).
  - **A child never owns a group (2026-10-04):** a user who is a `Child` in any group of your application, or signs in with a PIN, can no longer create a group, be named `SecondaryOwner`, or receive a hand-over — each answers the new `403 CHILD_CANNOT_OWN_GROUP`; nor can a group's owner or secondary owner be given the `Child` role in another group of your application. Before this, a child could create a group of their own ([Section 3.7](#37-group-service-groupsvc)).
  - **Sessions end at once (2026-10-04):** a child's PIN reset, a password reset or change, an account's deactivation, and a soft-delete (owner deletion, GDPR erasure) now also end every access token already issued — the next call with one answers `401`, as an expired token does — instead of letting it run to its expiry ([Section 3.7](#post-groupsvc-agroupid-children-auserid-reset-pin), [Section 5.4](#54-best-practices-for-ai-agents)).

### What's new in 1.5.1

Additive, from feedback raised while building a child application — nothing you already send or read changes shape.

- **`GET /IssueSvc/{aIssueId}` returns what the issue was raised with:** `reproductionSteps`, `expectedBehavior`, `actualBehavior` and `environment` (the object you sent), beside the stored attachments. The server used to drop all four on create, so issues raised before 1.5.1 read back with them `null`. See [`GET /IssueSvc/{aIssueId}`](#get-issuesvc-aissueid).
- **New `POST /AuthSvc/devices/{aUserDeviceId}/unblock`.** A user can lift a block from any other device they are signed in on; the device can sign in again at once. The `DEVICE_BLOCKED` message now says so. See [the unblock section](#post-authsvc-devices-auserdeviceid-unblock).
- **`POST /LicenseSvc/validate` reports devices used of allowed.** For a device-capped licence it now fills `devicesAllowed`, `devicesUsed` and `deviceRegistered`, and returns the same `deviceCap` block as `device-login` — read-only, so a Forget shows on the next check without a sign-in. It also now finds the user's licence for the calling application, which it failed to do before. See [`POST /LicenseSvc/validate`](#post-licensesvc-validate).

### What's new in 1.5

- **Five new device endpoints, all on `/AuthSvc`:** `POST /AuthSvc/device-login` and `POST /AuthSvc/device-register` (sign in / register from a device you name), plus `GET /AuthSvc/devices`, `DELETE /AuthSvc/devices/{aUserDeviceId}` and `POST /AuthSvc/devices/{aUserDeviceId}/block` for the signed-in user's own device list, forget and block. See [Section 3.1](#31-auth-service-authsvc).
- **`deviceInfo` is required on the two new sign-in endpoints.** It must carry a `deviceId` you generate once per installation and persist. Absent, or present without a `deviceId`, the call is refused with `DEVICE_INFO_REQUIRED` (400). On `POST /AuthSvc/login` it stays optional, exactly as before.
- **A `device` block on the device-endpoint responses.** `device-login`, `device-register` and the device-management routes report the device the call was attributed to: `userDeviceId`, `deviceIdentifier`, `identitySource` (`Declared` when you supplied the id, `Derived` when the server hashed one), `deviceName`, `deviceType`, `platform`, `browser`, `appVersion`, `lastIpAddress`, `country`, `city`, `signInCount`, `firstSeenDate`, `lastSeenDate`, `isBlocked` and `isNewDevice`.
- **A `deviceCap` block for device-capped licences.** On `device-login` and `device-register`, a user holding an active `DeviceLifetime` or `DeviceSubscription` licence gets `deviceCount`, `maxDevices`, `isOverCap`, `warning`, `licenseKey` and `licenseModel`. Going over the cap does **not** refuse the sign-in — it is reported, and the tokens are issued anyway. The field is `null` when no device-capped licence applies.
- **New error codes:** `DEVICE_INFO_REQUIRED` (400), `DEVICE_BLOCKED` (403) and `DEVICE_NOT_FOUND` (404) — see [Section 6.2](#62-common-error-codes).
- **New optional request field `deviceInfo` on `POST /AuthSvc/logout`.** It lets the server work out which device is signing out when you have no `refreshToken` to hand.
- **`logoutAllDevices: false` now logs out only the calling device.** Until v1.5 it revoked user-wide or application-wide sessions, exactly like `true`; sessions now carry their device, so the narrow scope finally works. Send `logoutAllDevices: true` for a sign-out-everywhere button.
- **A blocked device is refused on plain `POST /AuthSvc/login` too**, not only on `device-login`, so a blocked device cannot simply change endpoint. The session issued during authentication is revoked before the 403 is returned.

**What changed in 1.4:** the request-bound parameter rename (breaking) — every `[FromQuery]`, `[FromForm]` and `[FromRoute]` parameter name and route token carries an `a` prefix (`?applicationId=1` became `?aApplicationId=1`, `/IssueSvc/{issueId}` became `/IssueSvc/{aIssueId}`), the `AppManagerClient` reference code in §4 was re-emitted under the same convention, and JSON request/response field names were left untouched. That convention is unchanged in v1.5.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Authentication](#2-authentication) (includes [Password Encryption](#24-password-encryption-required))
3. [API Reference](#3-api-reference)
   - [Auth Service (AuthSvc)](#31-auth-service-authsvc)
   - [License Service (LicenseSvc)](#32-license-service-licensesvc)
   - [User Service (UserSvc)](#33-user-service-usersvc)
   - [Feature Service (FeatureSvc)](#34-feature-service-featuresvc)
   - [Payment Service (PaymentSvc)](#35-payment-service-paymentsvc)
   - [Issue Service (IssueSvc)](#36-issue-service-issuesvc)
   - [Group Service (GroupSvc)](#37-group-service-groupsvc)
4. [Code Examples](#4-code-examples-netc)
5. [AI Agent Integration Guide](#5-ai-agent-integration-guide)
6. [Error Handling](#6-error-handling)

---

## 1. Quick Start

Get up and running with the App Manager API in 5 minutes.

### Step 1: Identify Your Application

Every API call should identify which child application is making the request. There are two ways:

**Option A: API Key Headers (Recommended)**

Include your application's API key and secret in request headers. The system automatically resolves the ApplicationId:

```http
X-Api-Key: ak_live_your_api_key_here
X-Api-Secret: your_api_secret_here
```

**Option B: Explicit ApplicationId Parameter**

Pass it as a query parameter (`aApplicationId`, v1.4 naming) or in the request body (`applicationId` JSON field — DTO names are unchanged). Which one varies by endpoint.

Not every endpoint offers this. Some read the application **only** from the API key: the promo-code
check, and every endpoint that looks a resource up by its own id — a licence, transaction, invoice,
subscription or issue. Those compare the resource's application against the key's and answer 403 if
they differ, so there is nothing to pass.

**Option C: Both (Recommended for extra safety)**

When both are provided, the system validates they match — and answers `400 APP_ID_MISMATCH` when they
do not, rather than quietly preferring one.

> **Send the API key headers on every call.** It is the only way some endpoints can resolve your
> application at all, it is what scopes `GET /UserSvc/profile` to your app's role, and it is what
> stops a token issued for one application from reading another's data.

### Step 2: Get the Server's Public Key (for password encryption)

```bash
curl -X GET "https://api.appmanager.com/AuthSvc/public-key"
```

Cache the returned public key. Use it to RSA-encrypt passwords before sending (see [Section 2.4](#24-password-encryption-required) for details).

### Step 3: Register or Login a User

```bash
curl -X POST "https://api.appmanager.com/AuthSvc/login" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here" \
  -d '{
    "email": "user@example.com",
    "encryptedPassword": "base64_rsa_encrypted_password..."
  }'
```

> **Important:** Plain text passwords are **not accepted**. All password fields must be RSA-encrypted. See [Section 2.4](#24-password-encryption-required) for implementation details.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "applicationRole": "User",
    "appManagerRole": "ApplicationUser",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rt_abc123xyz789...",
    "tokenExpiresAt": "2026-01-26T14:00:00Z",
    "activeLicense": {
      "licenseId": 1,
      "licenseName": "Professional",
      "status": "Active",
      "applicationId": 1,
      "applicationName": "My App"
    }
  },
  "message": "Login successful"
}
```

### Step 4: Use the Access Token

Include the access token (and optionally API key headers) in all subsequent requests:

```bash
curl -X GET "https://api.appmanager.com/UserSvc/profile" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here"
```

### Authentication Flow Overview

```
+------------------------------------------------------------------+
|                    Authentication Flow                            |
+------------------------------------------------------------------+
|                                                                   |
|  1. Your app sends API Key headers to identify itself             |
|           |                                                       |
|  2. Call GET /AuthSvc/public-key to get RSA public key            |
|           |                                                       |
|  3. User enters credentials — encrypt password with RSA key       |
|           |                                                       |
|  4. Call POST /AuthSvc/login with encryptedPassword               |
|           |                                                       |
|  5. Receive accessToken, refreshToken, and app-scoped license     |
|           |                                                       |
|  6. Use accessToken in Authorization header for all requests      |
|           |                                                       |
|  7. When accessToken expires, call POST /AuthSvc/refresh          |
|           |                                                       |
|  8. Receive new tokens, continue making requests                  |
|                                                                   |
+------------------------------------------------------------------+
```

---

## 2. Authentication

The API uses a dual authentication mechanism:
1. **API Key Authentication (Optional):** Identifies the calling application via `X-Api-Key` and `X-Api-Secret` headers
2. **JWT Bearer Token (Required for protected endpoints):** Identifies the user via `Authorization: Bearer {token}` header
3. **Password Encryption (Required):** Every password field must be RSA-encrypted before sending. A plaintext password is rejected, not merely discouraged — see [Section 2.4](#24-password-encryption-required)

### 2.1 API Key Authentication

API keys are created in the AppManager admin UI under each application's settings. When provided, the API key automatically resolves the `applicationId` for the request.

**Headers:**
```http
X-Api-Key: ak_live_your_api_key_here
X-Api-Secret: your_api_secret_here
X-App-Id: 1  (optional, validated against API key if provided)
```

If API key headers are not provided, you must pass the application ID explicitly — as `aApplicationId` (query parameter, v1.4 naming) or as `applicationId` (JSON body field, unchanged).

#### 2.1.1 Installed apps: public keys

A desktop or phone app that users download cannot keep a secret — anyone can read it out of the installed files. Give such an app an **installed-app key** instead: on the application's API Keys screen choose **Generate New Key → Installed app (no secret)**. The key starts `pk_live_`, no secret is generated or stored, and it cannot be regenerated (revoke it and ship a new one instead).

**Headers:**
```http
X-Api-Key: pk_live_your_public_key_here
X-Device-Id: 5f1c2a9e-…   (required: an id you generate once per installation and keep)
```

Do **not** send `X-Api-Secret` with a public key — the call is refused with `401 INVALID_API_KEY`. A server key (`ak_live_…`) sent without its secret still answers `401 INCOMPLETE_AUTH_HEADERS`, as before.

**Endpoints a public key may call:** every `AuthSvc` endpoint (including the device endpoints), `GET` / `PUT /UserSvc/profile`, `POST /UserSvc/change-password`, `POST /UserSvc/delete-request` (the signed-in user's own account only; since 1.7), `POST /LicenseSvc/validate`, `GET /LicenseSvc`, every `IssueSvc` endpoint, and every `GroupSvc` endpoint. Everything else — `PaymentSvc`, `FeatureSvc`, the other `UserSvc` and `LicenseSvc` actions — answers `403 PUBLIC_KEY_NOT_ALLOWED`; call those from your server with a key and secret.

**Limits:** each device (key + `X-Device-Id`) may make 60 requests a minute. A call without `X-Device-Id` answers `400 DEVICE_ID_REQUIRED`; a device over the limit answers `429 RATE_LIMITED` with a `Retry-After` header giving the seconds to wait. Other devices using the same key are not affected.

### 2.2 Obtaining JWT Tokens

Tokens are obtained through:
- **Registration:** `POST /AuthSvc/register` - for new users
- **Login:** `POST /AuthSvc/login` - for existing users

### 2.3 Using Tokens

Include the access token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
X-Api-Key: ak_live_your_api_key_here     (optional but recommended)
X-Api-Secret: your_api_secret_here        (optional but recommended)
```

### 2.3 Token Refresh

Access tokens expire after a configured duration (default: 1 hour). Use the refresh token to obtain new tokens:

**Request:**
```bash
curl -X POST "https://api.appmanager.com/AuthSvc/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "rt_abc123xyz789..."
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_new_token_xyz...",
    "expiresAt": "2026-01-26T15:00:00Z"
  },
  "message": "Token refreshed successfully"
}
```

### 2.4 Password Encryption (Required)

All passwords **must** be RSA-encrypted before sending to the API. Plain text passwords are rejected. This protects against MITM attacks even when TLS is compromised (e.g., intercepting proxies with custom CA certificates like Fiddler or Charles Proxy).

**Step 1: Fetch the server's public key**

```bash
curl -X GET "https://api.appmanager.com/AuthSvc/public-key" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhki...\n-----END PUBLIC KEY-----",
    "algorithm": "RSA-OAEP-256",
    "encoding": "base64"
  },
  "message": "Use this public key to encrypt passwords before sending"
}
```

**Step 2: Encrypt the password client-side**

Use RSA-OAEP with SHA-256 padding to encrypt the password, then base64-encode the result.

**.NET/C# Example:**
```csharp
using System.Security.Cryptography;
using System.Text;

string EncryptPassword(string aPassword, string aPublicKeyPem)
{
    using var vRsa = RSA.Create();
    vRsa.ImportFromPem(aPublicKeyPem);
    var vEncryptedBytes = vRsa.Encrypt(
        Encoding.UTF8.GetBytes(aPassword),
        RSAEncryptionPadding.OaepSHA256);
    return Convert.ToBase64String(vEncryptedBytes);
}
```

**JavaScript/Node.js Example:**
```javascript
const crypto = require('crypto');

function encryptPassword(password, publicKeyPem) {
  const encrypted = crypto.publicEncrypt(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(password, 'utf8')
  );
  return encrypted.toString('base64');
}
```

**Python Example:**
```python
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes, serialization
import base64

def encrypt_password(password: str, public_key_pem: str) -> str:
    public_key = serialization.load_pem_public_key(public_key_pem.encode())
    encrypted = public_key.encrypt(
        password.encode('utf-8'),
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    )
    return base64.b64encode(encrypted).decode('utf-8')
```

**Step 3: Send the encrypted password**

Use the `encryptedPassword` field instead of `password`:

```bash
curl -X POST "https://api.appmanager.com/AuthSvc/login" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here" \
  -d '{
    "email": "user@example.com",
    "encryptedPassword": "base64_encoded_rsa_encrypted_password..."
  }'
```

> **Breaking Change (v1.2):** Plain text `password` fields are no longer accepted. All password-accepting endpoints (`register`, `login`, `reset-password`, `change-password`) require RSA-encrypted passwords. Requests with plain text passwords will receive a `400 VALIDATION_ERROR`.

### 2.5 Authentication Error Responses

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid access token |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `ACCOUNT_LOCKED` | 423 | Account locked due to too many failed attempts |
| `ACCOUNT_DISABLED` | 403 | Account has been deactivated |
| `EXPIRED_REFRESH_TOKEN` | 401 | Refresh token has expired |
| `REVOKED_REFRESH_TOKEN` | 401 | Refresh token has been revoked |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token is malformed or unknown |
| `INVALID_RESET_TOKEN` | 400 | Password-reset token is invalid, used or expired. Since 2026-10-04 this is checked before the new password's rule, so a dead token always answers this |
| `INVALID_PASSWORD` | 400 | New password breaks the account's rule. For an ordinary account: at least 8 characters, with an uppercase letter, a digit and a special character. For a PIN account (a child created by `POST /GroupSvc/{aGroupId}/children`): 4 to 8 digits, message `PIN must be 4 to 8 digits`. One rule per account covers `POST /AuthSvc/reset-password`, `POST /UserSvc/change-password`, the child endpoints of `GroupSvc` and the admin site's own change and reset screens. The `message` is the sentence to show the user |
| `DECRYPTION_FAILED` | 400 | Server could not RSA-decrypt the submitted `encrypted*Password` field (wrong public key, padding, or corrupted base64) |
| `APPLICATION_ID_REQUIRED` | 400 | Endpoint needs an ApplicationId and none was provided (no `X-Api-Key`, no body `applicationId` / query `aApplicationId`) |
| `APP_ID_MISMATCH` | 400 / 401 / 403 | Caller's resolved ApplicationId does not match the resource's / token's ApplicationId. 400 when the body or query value disagrees with the API key (register, reset-password, create issue, feature lookups); 401 on `/AuthSvc/refresh` when the refresh token was issued for a different app; 403 on a per-resource lookup in `IssueSvc` |
| `CROSS_APP_LICENSE` | 403 | The licence named in the path belongs to a different application than the caller's (`POST /LicenseSvc/{aLicenseId}/consume`, `DELETE /LicenseSvc/{aLicenseId}/devices/{aDeviceId}`) |
| `CROSS_APP_RESOURCE` | 403 | The transaction, invoice or subscription named in the path belongs to a different application than the caller's (`PaymentSvc`) |
| `NO_APP_ACCESS` | 403 | JWT-authenticated user has no active `UserApplicationRole` row for the calling application (returned by `GET /UserSvc/profile` when an app context is resolved) |
| `UNKNOWN_ROLE_CODE` | 400 | `POST /AuthSvc/register` was given an `applicationRoleCode` the application does not define. The message lists the valid role codes. No user is created |
| `APPLICATION_NOT_CONFIGURED` | 500 | `POST /AuthSvc/register` could not assign any application role because the application defines none. Add at least one role at `/applications/{id}/roles`. No user is created |

---

## 3. API Reference

### 3.1 Auth Service (AuthSvc)

Base path: `/AuthSvc`

#### GET /AuthSvc/public-key

Returns the server's RSA public key for client-side password encryption. No authentication required.

**Response:**
```json
{
  "success": true,
  "data": {
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhki...\n-----END PUBLIC KEY-----",
    "algorithm": "RSA-OAEP-256",
    "encoding": "base64"
  },
  "message": "Use this public key to encrypt passwords before sending"
}
```

> Cache this key in your application. It only changes if the server's encryption keys are rotated.

#### POST /AuthSvc/register

Registers a new user and associates them with an application. ApplicationId is required (via API key header or request body).

**Request Body:**
```json
{
  "email": "user@example.com",
  "encryptedPassword": "base64_rsa_encrypted_password...",
  "firstName": "John",
  "lastName": "Doe",
  "mobileNumber": "+919876543210",
  "applicationId": 1,
  "applicationRoleCode": "User"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `email` | Yes | User's email address |
| `encryptedPassword` | Yes | RSA-encrypted password (base64). Encrypt with server's public key using RSA-OAEP-SHA256 |
| `firstName` | Yes | User's first name |
| `lastName` | Yes | User's last name |
| `mobileNumber` | No | User's mobile number |
| `applicationId` | Yes* | Application to register under (*can be provided via X-Api-Key header instead) |
| `applicationRoleCode` | No | Application role to assign, matched **case-insensitively against the role's name** in the application's role list. Omit it and the application's default role is used (the role mapped to `ApplicationUser`, else the first defined role). **An unrecognised value is rejected with `400 UNKNOWN_ROLE_CODE` — it is never silently replaced by the default.** |

> **Roles must exist before you can ask for one.** Every application is created with the roles
> `Admin`, `Manager` and `User` (mapped to `Admin` / `Manager` / `ApplicationUser`), and the admin UI
> can add more at `/applications/{id}/roles`. Registration always writes a `UserApplicationRole` row,
> so the `applicationRole` in the response is the role that was actually persisted — the same value
> `POST /AuthSvc/login` and `GET /UserSvc/profile` will report. If an application somehow defines no
> roles at all, registration fails with `500 APPLICATION_NOT_CONFIGURED` rather than creating a user
> with no role.
>
> **`applicationRole` is not `appManagerRole`.** Requesting `Manager` grants the *application* role
> `Manager`; the platform role `appManagerRole` stays `ApplicationUser`. Self-registration never
> grants access to the App Manager console.

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "applicationRole": "User",
    "appManagerRole": "ApplicationUser",
    "isEmailVerified": false,
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_abc123xyz789...",
    "tokenExpiresAt": "2026-01-26T14:00:00Z"
  },
  "message": "Registration successful"
}
```

#### POST /AuthSvc/login

Authenticates a user and returns JWT tokens. When applicationId is provided (via API key or request body), the active license and application role are scoped to that specific application.

**Request Body:**
```json
{
  "email": "user@example.com",
  "encryptedPassword": "base64_rsa_encrypted_password...",
  "applicationId": 1
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `email` | Yes | User's email address |
| `encryptedPassword` | Yes | RSA-encrypted password (base64). Encrypt with server's public key using RSA-OAEP-SHA256 |
| `applicationId` | No* | Scopes license and role to this application (*can be provided via X-Api-Key header) |

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "applicationRole": "User",
    "appManagerRole": "ApplicationUser",
    "isEmailVerified": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_abc123xyz789...",
    "tokenExpiresAt": "2026-01-26T14:00:00Z",
    "activeLicense": {
      "licenseId": 1,
      "licenseName": "Professional",
      "status": "Active",
      "applicationId": 1,
      "applicationName": "My App",
      "expiryDate": "2027-01-26T00:00:00Z",
      "daysRemaining": 365
    }
  },
  "message": "Login successful"
}
```

| Error Code | HTTP | When |
|------------|------|------|
| `VALIDATION_ERROR` | 400 | `email` or `encryptedPassword` missing |
| `DECRYPTION_FAILED` | 400 | `encryptedPassword` could not be RSA-decrypted |
| `INVALID_CREDENTIALS` | 401 | Unknown email, wrong password or PIN, or a soft-deleted account |
| `ACCOUNT_LOCKED` | 423 | The account is locked (see below) |
| `ACCOUNT_DISABLED` | 403 | The account is deactivated |
| `TWO_FACTOR_REQUIRED` / `INVALID_TWO_FACTOR_CODE` | 401 | The account has two-factor authentication on; repeat with `twoFactorCode` |
| `DEVICE_BLOCKED` | 403 | The signing-in device is blocked (v1.5) |

> **Children sign in here with a PIN (v1.6).** A child account created by
> [`POST /GroupSvc/{aGroupId}/children`](#post-groupsvc-agroupid-children) signs in on this same
> endpoint (or `device-login`) with its own email and its 4–8 digit PIN in `encryptedPassword`,
> encrypted exactly like a password. Nothing else in the request or response differs.
>
> **Lockout.** Wrong passwords and wrong PINs count the same way: attempts 1 to 4 answer
> `401 INVALID_CREDENTIALS`; the **fifth** wrong attempt itself answers `423 ACCOUNT_LOCKED`, and every
> attempt for the next 15 minutes — even with the right password or PIN — answers `423`. A successful
> sign-in resets the count. When the locked account is a child in a group, the owner and the secondary
> owner of each such group are emailed that it locked and until when (UTC); the owner can unlock it at
> once with [`POST /GroupSvc/{aGroupId}/children/{aUserId}/reset-pin`](#post-groupsvc-agroupid-children-auserid-reset-pin).
>
> **`activeLicense` is the licence `validate` would choose (2026-10-04).** It is the user's own newest
> `Active`, in-date licence for the calling application; else an `Active`, in-date licence held by one
> of the user's groups there; else their own expired one; else `null` — exactly the choice
> [`POST /LicenseSvc/validate`](#post-licensesvc-validate) makes, so a member covered only by a group
> licence sees it here too. A licence whose type has been deleted is never reported. The summary has
> the same fields whichever licence it is, with nothing marking it as a group's. Without an application
> (an unscoped sign-in) it is the user's own newest `Active` licence in any application. Keep using
> `validate` to decide what the user may do: it also checks expiry and the device cap at the moment of use.

#### POST /AuthSvc/device-login

**New in v1.5.** Authenticates a user from a device the caller names, and returns the same tokens as `POST /AuthSvc/login` plus a summary of that device. Identical to `login` in every other respect — except that `deviceInfo` is **required**. Anonymous.

**Request Body:**
```json
{
  "email": "user@example.com",
  "encryptedPassword": "base64_rsa_encrypted_password...",
  "applicationId": 1,
  "deviceInfo": {
    "deviceId": "a-stable-id-you-generate-and-persist",
    "deviceName": "John's Laptop",
    "deviceType": "Desktop",
    "platform": "Windows",
    "appVersion": "3.2.0"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `email` | Yes | User's email address |
| `encryptedPassword` | Yes | RSA-encrypted password (base64). Encrypt with server's public key using RSA-OAEP-SHA256 |
| `applicationId` | No* | Scopes license and role to this application (*can be provided via X-Api-Key header) |
| `deviceInfo` | Yes | The signing-in device. Absent -> `400 DEVICE_INFO_REQUIRED` |
| `deviceInfo.deviceId` | Yes | Your own identifier for this installation. Absent or blank -> `400 DEVICE_INFO_REQUIRED`. It must be stable for the life of the installation and unique within one user's devices; it does not have to be globally unique. Generate a GUID on first run and persist it (app storage on a native or desktop app, `localStorage` in a browser — clearing site data there produces a new device) |
| `deviceInfo.deviceName` | No | Display name shown on the user's device list, e.g. "John's Laptop" |
| `deviceInfo.deviceType` | No | e.g. "Desktop", "Mobile" |
| `deviceInfo.platform` | No | e.g. "Windows", "macOS", "Android" |
| `deviceInfo.appVersion` | No | Your application's version string |

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "applicationRole": "User",
    "appManagerRole": "ApplicationUser",
    "isEmailVerified": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_abc123xyz789...",
    "tokenExpiresAt": "2026-01-26T14:00:00Z",
    "activeLicense": {
      "licenseId": 1,
      "licenseName": "Professional",
      "status": "Active",
      "applicationId": 1,
      "applicationName": "My App",
      "expiryDate": "2027-01-26T00:00:00Z",
      "daysRemaining": 365
    },
    "device": {
      "userDeviceId": 331,
      "deviceIdentifier": "a-stable-id-you-generate-and-persist",
      "identitySource": "Declared",
      "deviceName": "John's Laptop",
      "deviceType": "Desktop",
      "platform": "Windows",
      "browser": "Chrome",
      "appVersion": "3.2.0",
      "lastIpAddress": "203.0.113.9",
      "country": null,
      "city": null,
      "signInCount": 2,
      "firstSeenDate": "2026-09-01T09:12:44Z",
      "lastSeenDate": "2026-09-18T05:57:44Z",
      "isBlocked": false,
      "isNewDevice": false
    },
    "deviceCap": null
  },
  "message": "Login successful"
}
```

| Response field | Description |
|----------------|-------------|
| `device.userDeviceId` | The device's id in App Manager — this is what `DELETE /AuthSvc/devices/{aUserDeviceId}` and the block route take |
| `device.deviceIdentifier` | The `deviceId` you sent, or the server-derived one |
| `device.identitySource` | `Declared` when you supplied the id, `Derived` when the server hashed one from the user, the application and the user agent |
| `device.browser` | Parsed from the `User-Agent` header, not from `deviceInfo` |
| `device.country` / `device.city` | `null` until a geo-IP provider is configured — expected, not an error |
| `device.signInCount` | Sign-ins seen from this device, including the current one |
| `device.isNewDevice` | `true` when this sign-in is the first ever from the device |
| `deviceCap` | The user's position against a device-capped licence, or `null` when no such licence applies — see `deviceCap` below |

**`deviceCap` (device-capped licences only):** for the `DeviceLifetime` and `DeviceSubscription` models, `MaxDevices` caps how many devices a licence covers, and the sign-in reports where the user stands:

```json
"deviceCap": {
  "deviceCount": 2,
  "maxDevices": 1,
  "isOverCap": true,
  "warning": "This account is using 2 devices against a licence cap of 1. Sign-in was allowed; remove a device to return within the cap.",
  "licenseKey": "AAAAA-BBBBB-CCCCC-DDDDD",
  "licenseModel": "DeviceLifetime"
}
```

> **Being over the cap does not refuse the sign-in.** Tokens are still issued; `isOverCap` is `true` and `warning` carries a message you can surface. `warning` is `null` while the user is within the cap. `deviceCount` counts only the user's `Declared` devices on this application — a derived identity resets when a browser's site data is cleared, so it never consumes a slot — and devices you have blocked or forgotten are left out of the count. If you want a hard refusal, read `data.deviceCap.isOverCap` and act on it in your own app.

**Errors:**

| Status | `error` | When |
|--------|---------|------|
| 400 | `DEVICE_INFO_REQUIRED` | `deviceInfo` is absent, or present without a `deviceId` |
| 403 | `DEVICE_BLOCKED` | This device has been blocked for this user |
| 400 / 401 / 403 / 423 | as `POST /AuthSvc/login` | Unchanged — `VALIDATION_ERROR`, `DECRYPTION_FAILED`, `INVALID_CREDENTIALS`, `ACCOUNT_DISABLED`, `ACCOUNT_LOCKED` |

> A blocked device is checked **after** the password is verified, so an unauthenticated caller can never learn whether a device is blocked. The session issued during authentication is revoked before the 403 is returned — a blocked device never holds a usable token.

#### POST /AuthSvc/device-register

**New in v1.5.** Registers a new user from a device the caller names. Identical to `POST /AuthSvc/register` — same fields, same password rules, same role resolution — plus a **required** `deviceInfo`, and the same `device` and `deviceCap` additions on the response. Anonymous.

**Request Body:**
```json
{
  "email": "user@example.com",
  "encryptedPassword": "base64_rsa_encrypted_password...",
  "firstName": "John",
  "lastName": "Doe",
  "mobileNumber": "+919876543210",
  "applicationId": 1,
  "applicationRoleCode": "User",
  "deviceInfo": {
    "deviceId": "a-stable-id-you-generate-and-persist",
    "deviceName": "John's Laptop",
    "deviceType": "Desktop",
    "platform": "Windows",
    "appVersion": "3.2.0"
  }
}
```

`deviceInfo` follows exactly the rules given for `POST /AuthSvc/device-login`; every other field is the one documented under `POST /AuthSvc/register`.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "applicationRole": "User",
    "appManagerRole": "ApplicationUser",
    "isEmailVerified": false,
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_abc123xyz789...",
    "tokenExpiresAt": "2026-01-26T14:00:00Z",
    "activeLicense": null,
    "device": {
      "userDeviceId": 331,
      "deviceIdentifier": "a-stable-id-you-generate-and-persist",
      "identitySource": "Declared",
      "deviceName": "John's Laptop",
      "deviceType": "Desktop",
      "platform": "Windows",
      "browser": "Chrome",
      "appVersion": "3.2.0",
      "lastIpAddress": "203.0.113.9",
      "country": null,
      "city": null,
      "signInCount": 1,
      "firstSeenDate": "2026-09-18T05:57:43Z",
      "lastSeenDate": "2026-09-18T05:57:43Z",
      "isBlocked": false,
      "isNewDevice": true
    },
    "deviceCap": null
  },
  "message": "Registration successful"
}
```

**Errors:** `400 DEVICE_INFO_REQUIRED` when `deviceInfo` is absent or carries no `deviceId`, and otherwise every error `POST /AuthSvc/register` can return (`VALIDATION_ERROR`, `DECRYPTION_FAILED`, `EMAIL_EXISTS`, `UNKNOWN_ROLE_CODE`, `APPLICATION_NOT_CONFIGURED`).

> A brand-new user has no devices yet, so `device.isNewDevice` is always `true` here, and `deviceCap` is `null` until a device-capped licence is assigned.

#### POST /AuthSvc/refresh

Refreshes an access token using a refresh token. Anonymous (no Authorization header needed).

**Request Body:**
```json
{
  "refreshToken": "rt_abc123xyz789..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_new_token_xyz...",
    "expiresAt": "2026-01-26T15:00:00Z"
  },
  "message": "Token refreshed successfully"
}
```

> **ApplicationId scoping:** the refresh token stores the ApplicationId it was issued for (`RefreshTokens.ApplicationId`). If the caller supplies an ApplicationId (via `X-Api-Key` header) and it does not match the token's ApplicationId, the request is rejected with `401 APP_ID_MISMATCH`. Legacy tokens with a NULL `ApplicationId` (pre-migration-015) are accepted for backwards compatibility. Callers without any resolvable ApplicationId also pass this check (loose mode).

#### POST /AuthSvc/validate

Validates an access token and returns user information. Anonymous.

**Request Body:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "userId": 123,
    "email": "user@example.com",
    "appManagerRole": "ApplicationUser",
    "expiresAt": "2026-01-26T14:00:00Z"
  }
}
```

> **ApplicationId scoping:** if the JWT carries an `applicationId` claim and the caller is resolvable to a different application (via `X-Api-Key`), the response reports `isValid: false` with `invalidReason: "APP_ID_MISMATCH: token issued for a different application"`. The HTTP status stays 200 (the endpoint never throws on validation failures). If either side has no ApplicationId context, the check is skipped.

#### POST /AuthSvc/logout

Logs out the user. Requires JWT (Authorization: Bearer).

**Request Body:**
```json
{
  "refreshToken": "rt_abc123xyz789...",
  "logoutAllDevices": false,
  "deviceInfo": {
    "deviceId": "a-stable-id-you-generate-and-persist"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `refreshToken` | No | The session being signed out. With `logoutAllDevices: false` this is the reliable way to log out one device: the token is stamped with the device that obtained it |
| `logoutAllDevices` | No | When `true`, revokes every refresh token for the user across all apps |
| `deviceInfo` | No | **New in v1.5.** Same shape as on `POST /AuthSvc/device-login`. Read only when `logoutAllDevices` is `false` and no usable `refreshToken` was sent, to work out which device is signing out |

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

> **`logoutAllDevices: false` now logs out only this device (changed in v1.5).** Before v1.5 every branch revoked user-wide or application-wide sessions, so `false` behaved exactly like `true`; a session carried no device, so there was nothing narrower to revoke. Sessions now carry their device, and the scope is resolved in this order:
> - `logoutAllDevices: true` -> revokes every refresh token for the user (user-wide, no app scoping).
> - Otherwise, if the body's `refreshToken` is the user's own and carries a device -> revokes only that device's sessions.
> - Otherwise, if `deviceInfo` identifies a known device -> revokes only that device's sessions.
> - Otherwise, if `X-Api-Key` / explicit ApplicationId resolves -> revokes tokens for that user + that ApplicationId, as before.
> - Otherwise falls back to user-wide revocation.
>
> **What to check before you ship:** if your sign-out button relied on `logoutAllDevices: false` to sign the user out everywhere, it will stop doing that — send `logoutAllDevices: true` instead. Sessions issued before the device registry landed carry no device and fall through to the application-wide branch.

#### GET /AuthSvc/devices

**New in v1.5.** Lists the calling user's registered devices, newest-seen first. Requires JWT (`Authorization: Bearer`). Scoped to the calling application whenever one resolves from `X-Api-Key`, so a child application never sees the devices its user signs in to other applications from.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userDeviceId": 332,
      "deviceIdentifier": "b-stable-id-from-the-phone",
      "identitySource": "Declared",
      "deviceName": "John's Phone",
      "deviceType": "Mobile",
      "platform": "Android",
      "browser": "Chrome",
      "appVersion": "3.2.0",
      "lastIpAddress": "203.0.113.9",
      "country": null,
      "city": null,
      "signInCount": 1,
      "firstSeenDate": "2026-09-18T05:57:44Z",
      "lastSeenDate": "2026-09-18T05:57:44Z",
      "isBlocked": false,
      "isNewDevice": false
    }
  ],
  "message": "Devices retrieved successfully"
}
```

> Each entry is the same `device` object the sign-in endpoints return. `isNewDevice` is part of the shape here too, and is always `false` on this route — it only means something on a sign-in response. Forgotten devices do not appear; a blocked device stays on the list with `isBlocked: true`.

**Errors:** `401 INVALID_TOKEN` when the access token carries no usable user id. A request with no token at all is refused with a bare `401` and an empty body, before the endpoint runs.

#### DELETE /AuthSvc/devices/{aUserDeviceId}

**New in v1.5.** Forgets one of the calling user's devices: it drops off the device list and its live sessions are revoked. Requires JWT (`Authorization: Bearer`).

| Parameter | In | Description |
|-----------|----|-------------|
| `aUserDeviceId` | Route | The `device.userDeviceId` from a sign-in response or from `GET /AuthSvc/devices` |

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Device forgotten and its sessions revoked"
}
```

> The device's sign-in history is deliberately kept — forgetting a device is not erasing a security audit trail. A device id that does not exist, or that belongs to another user, returns `404 DEVICE_NOT_FOUND` rather than 403: a 403 would confirm the id exists.

**Errors:** `404 DEVICE_NOT_FOUND` (unknown id, or someone else's device); `401 INVALID_TOKEN` when the access token carries no usable user id, or a bare `401` when no token is sent.

#### POST /AuthSvc/devices/{aUserDeviceId}/block

**New in v1.5.** Blocks one of the calling user's devices and returns its updated summary. Requires JWT (`Authorization: Bearer`). No request body.

| Parameter | In | Description |
|-----------|----|-------------|
| `aUserDeviceId` | Route | The `device.userDeviceId` from a sign-in response or from `GET /AuthSvc/devices` |

**Response:**
```json
{
  "success": true,
  "data": {
    "userDeviceId": 331,
    "deviceIdentifier": "a-stable-id-you-generate-and-persist",
    "identitySource": "Declared",
    "deviceName": "John's Laptop",
    "deviceType": "Desktop",
    "platform": "Windows",
    "browser": "Chrome",
    "appVersion": "3.2.0",
    "lastIpAddress": "203.0.113.9",
    "country": null,
    "city": null,
    "signInCount": 3,
    "firstSeenDate": "2026-09-01T09:12:44Z",
    "lastSeenDate": "2026-09-18T05:57:46Z",
    "isBlocked": true,
    "isNewDevice": false
  },
  "message": "Device blocked and its sessions revoked"
}
```

> Blocking is immediate on two fronts: the device's live sessions are revoked at once (its refresh token stops working), and its next sign-in is refused with `403 DEVICE_BLOCKED` — on `POST /AuthSvc/device-login` and on the legacy `POST /AuthSvc/login` alike, so a blocked device cannot simply change endpoint. Other devices of the same user are untouched. A caller that sends no `deviceInfo` is matched on its derived identity (a hash of user, application and user agent), so blocking still applies to it, but less precisely: the same browser on the same machine matches, a different browser does not.

> **A block can be undone by the user.** Since v1.5.1 the same user can lift it from any other device they are signed in on, with [`POST /AuthSvc/devices/{aUserDeviceId}/unblock`](#post-authsvc-devices-auserdeviceid-unblock); an administrator can still unblock it as well. Tell your users so, rather than sending them to support.

**Errors:** `404 DEVICE_NOT_FOUND` (unknown id, or someone else's device); `401 INVALID_TOKEN` when the access token carries no usable user id, or a bare `401` when no token is sent.

#### POST /AuthSvc/devices/{aUserDeviceId}/unblock

**New in v1.5.1.** Unblocks one of the calling user's devices and returns its updated summary, so a mistaken block can be undone without the support team. Call it from another device the user is signed in on — the blocked device itself cannot sign in to call it. Requires JWT (`Authorization: Bearer`). No request body.

| Parameter | In | Description |
|-----------|----|-------------|
| `aUserDeviceId` | Route | The `device.userDeviceId` from a sign-in response or from `GET /AuthSvc/devices` |

**Response:**
```json
{
  "success": true,
  "data": {
    "userDeviceId": 331,
    "deviceIdentifier": "a-stable-id-you-generate-and-persist",
    "identitySource": "Declared",
    "deviceName": "John's Laptop",
    "deviceType": "Desktop",
    "platform": "Windows",
    "browser": "Chrome",
    "appVersion": "3.2.0",
    "lastIpAddress": "203.0.113.9",
    "country": null,
    "city": null,
    "signInCount": 3,
    "firstSeenDate": "2026-09-01T09:12:44Z",
    "lastSeenDate": "2026-09-18T05:57:46Z",
    "isBlocked": false,
    "isNewDevice": false
  },
  "message": "Device unblocked"
}
```

> The device can sign in again at once, on `device-login` and `login` alike. Nothing is revoked: a blocked device has no live sessions, and the user's other devices are untouched. Unblocking a device that is not blocked changes nothing and still answers `200` with `isBlocked: false`, so a retry is safe. The sessions the block revoked are not restored — the device signs in afresh.

**Errors:** `404 DEVICE_NOT_FOUND` (unknown id, or someone else's device — never 403, which would confirm the id exists); `401 INVALID_TOKEN` when the access token carries no usable user id, or a bare `401` when no token is sent.

#### POST /AuthSvc/forgot-password

Initiates a password reset request. Anonymous. Always responds success to prevent email enumeration.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

> **ApplicationId scoping:** an ApplicationId is **required** (via `X-Api-Key` header) — `APPLICATION_ID_REQUIRED` (400) is returned if missing. The reset token is stamped with this ApplicationId (`PasswordResetTokens.ApplicationId`) so the corresponding `/AuthSvc/reset-password` call can enforce tenant isolation. The reset-email template is also selected per-app.

#### POST /AuthSvc/reset-password

Resets a user's password using a reset token. Anonymous.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "encryptedNewPassword": "base64_rsa_encrypted_password..."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `token` | Yes | Reset token from the password-reset email |
| `encryptedNewPassword` | Yes | RSA-encrypted new password (base64, RSA-OAEP-SHA256). For a PIN account (a child), the new PIN |

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Password reset successful"
}
```

The checks run in this order, and the first that fails is the answer:

| # | Error Code | HTTP | When |
|---|------------|------|------|
| 1 | `VALIDATION_ERROR` | 400 | `token` or `encryptedNewPassword` missing |
| 2 | `DECRYPTION_FAILED` | 400 | `encryptedNewPassword` could not be RSA-decrypted |
| 3 | `APPLICATION_ID_REQUIRED` | 400 | No `X-Api-Key` |
| 4 | `INVALID_RESET_TOKEN` | 400 | The token is unknown, already used or expired |
| 5 | `APP_ID_MISMATCH` | 400 | The token was issued for another application |
| 6 | `INVALID_PASSWORD` | 400 | The new value breaks the account's rule: the password rule, or for a PIN account `PIN must be 4 to 8 digits`. The token stays unused, so the same link works for a second try |

> **Changed 2026-10-04 — a dead token is reported as a dead token.** Until then the new password was
> checked before the token, so a used or expired link paired with a weak password answered
> `INVALID_PASSWORD`, and the user fixed the password only to be told the link was dead. Now a used or
> expired token always answers `INVALID_RESET_TOKEN` first; send the user back to
> `POST /AuthSvc/forgot-password`.
>
> **PIN accounts (v1.6).** The token's account decides the rule: a child's account takes a new PIN of 4
> to 8 digits here, in the same `encryptedNewPassword` field; every other account keeps the password
> rule, and a PIN-shaped value is refused for them as before.

> **ApplicationId scoping:** an ApplicationId is **required** (via `X-Api-Key` header) — `APPLICATION_ID_REQUIRED` (400) is returned if missing. The server compares the token's stored `ApplicationId` to the caller's resolved ApplicationId. A mismatch is rejected with `400 APP_ID_MISMATCH` (separate from `INVALID_RESET_TOKEN` so the client can distinguish a wrong-tenant mistake from a stale token). Legacy tokens with NULL `ApplicationId` are accepted.

---

### 3.2 License Service (LicenseSvc)

Base path: `/LicenseSvc`

#### GET /LicenseSvc/types

Gets available license types for purchase. No authentication required. ApplicationId is required.

**Query Parameters:**
- `aApplicationId` (required*): The application ID (*can be provided via X-Api-Key header instead)
- `aCurrency` (optional): Filter pricing by currency code (e.g., "USD", "INR")

Only active license types are returned, and only their active price rows. `amount` is the discounted
price when the price row has one, otherwise the list price; `formattedPrice` is that same number with
the currency's symbol and thousands separators (`₹`, `$`, `€`, `£`; any other currency is rendered as
`CODE 1,234.00`).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "licenseTypeId": 1,
      "typeName": "Professional",
      "typeCode": "PRO",
      "licenseModel": "Subscription",
      "description": "Full featured license for professionals",
      "durationDays": 365,
      "quantity": null,
      "maxDevices": 3,
      "pricing": [
        {
          "currencyCode": "USD",
          "amount": 99.99,
          "formattedPrice": "$99.99"
        },
        {
          "currencyCode": "INR",
          "amount": 7999.00,
          "formattedPrice": "₹7,999.00"
        }
      ],
      "features": [],
      "isPopular": false
    }
  ],
  "message": "Retrieved 3 license types"
}
```

> **`aCurrency` filters prices, not types.** It narrows each type's `pricing` array; it does not drop
> types. A type with no price row in the requested currency is still listed, with `"pricing": []`.

> **`features` and `isPopular` are always `[]` and `false`.** Both fields are part of the response
> shape but this endpoint does not populate them. Read a user's real feature access from
> [`GET /FeatureSvc`](#34-feature-service-featuresvc) instead.

#### GET /LicenseSvc

Gets the current user's licenses. Requires authentication. Optionally scoped to an application.

**Query Parameters:**
- `aApplicationId` (optional*): Filter licenses by application (*can be provided via X-Api-Key header)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "licenseId": 1,
      "licenseKey": "LIC-ABC123-XYZ789",
      "licenseName": "Professional",
      "licenseCode": "LIC-ABC123-XYZ789",
      "licenseModel": "Subscription",
      "status": "Active",
      "applicationId": 1,
      "applicationName": "My App",
      "purchaseDate": "2026-01-01T00:00:00Z",
      "activationDate": "2026-01-01T00:00:00Z",
      "expiryDate": "2027-01-01T00:00:00Z",
      "daysRemaining": 365,
      "autoRenew": false,
      "remainingQuantity": null,
      "totalQuantity": null,
      "features": []
    }
  ],
  "message": "Retrieved 1 licenses"
}
```

`daysRemaining` is computed from `expiryDate` and never goes below 0; it is `null` for a licence with
no expiry. `licenseCode` carries the same value as `licenseKey` on this endpoint. `autoRenew`,
`totalQuantity` and `features` are part of the response shape but are not populated here, so they
always read `false`, `null` and `[]`.

> **Group licences are listed too (v1.6).** When the application is known (from `X-Api-Key` or
> `aApplicationId`), the list is the user's own licences for that application followed by every
> `Active`, in-date licence held by a group they belong to there — in the same shape, with nothing
> marking it as a group's. Without an application the list is the user's own licences in every
> application, and no group licences. Own licences are listed whatever their status.
>
> **A licence whose type has been deleted is not listed (2026-10-04).** When an administrator deletes a
> licence type, every licence of it stops being the user's: it disappears from this list, from
> `validate` and from `login`'s `activeLicense`, and gives no features. A type that is only made
> *inactive* (no longer sold) is different — it vanishes from `GET /LicenseSvc/types`, but people who
> already hold it keep it, its features and its renewals.

#### POST /LicenseSvc/validate

Validates the current user's license for a specific application. Requires authentication. ApplicationId is required.

**Query Parameters:**
- `aApplicationId` (required*): The application to validate license for (*can be provided via X-Api-Key header)

**Request Body (optional):** a `deviceInfo` block, of which only `deviceId` is read — it answers
`deviceRegistered` for a device-capped licence (see the device note below). Sending no body at all is fine.

```json
{ "deviceInfo": { "deviceId": "a-stable-id-you-generate-and-persist" } }
```

**Response** (a `DeviceLifetime` licence capped at 3 devices, checked from one of the user's 2 devices):
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "reason": null,
    "message": null,
    "license": {
      "licenseId": 1,
      "licenseKey": "LIC-ABC123-XYZ789",
      "licenseName": "Professional",
      "licenseModel": "DeviceLifetime",
      "status": "Active",
      "applicationId": 1,
      "applicationName": "My App",
      "daysRemaining": null,
      "expiryDate": null,
      "remainingQuantity": null
    },
    "features": {},
    "deviceRegistered": true,
    "devicesUsed": 2,
    "devicesAllowed": 3,
    "deviceCap": {
      "deviceCount": 2,
      "maxDevices": 3,
      "isOverCap": false,
      "warning": null,
      "licenseKey": "LIC-ABC123-XYZ789",
      "licenseModel": "DeviceLifetime"
    },
    "registeredDevices": null,
    "freeTierFeatures": null
  },
  "message": null
}
```

For a licence that is not device-capped (`Subscription`, `Lifetime`, `Quantity`), `deviceCap` is
`null` and `deviceRegistered`, `devicesUsed` and `devicesAllowed` read `false`, `0` and `0`.

A licence that does not validate still answers `200 OK` with `success: true` — the outcome is in
`data.isValid`, and `data.message` says why:

| `isValid` | `message` | When |
|-----------|-----------|------|
| `true` | `null` | The user holds an `Active`, in-date licence for the calling application — their own, or one held by a group they belong to there |
| `false` | `No active license found for this application` | No `Active` licence of their own (of a type that still exists) and no `Active`, in-date group licence |
| `false` | `License has expired` | Their own newest `Active` licence there is past its `expiryDate`, and no group licence fills in |

> **Which licence is checked (v1.6, BRD-31).** The server picks one licence and answers from it:
>
> 1. the user's **own** newest-purchased `Active` licence for the application, if it is in date;
> 2. otherwise the newest `Active`, in-date licence **held by a group** the user is in, in this
>    application;
> 3. otherwise their own expired one, so the answer is `License has expired`;
> 4. otherwise nothing: `No active license found for this application`.
>
> `data.license` describes the licence chosen — for a group licence, its `licenseId`, name and expiry —
> and that licence's device cap fills the device fields as for any licence. Nothing in the response says
> whether it was the user's own or a group's; compare `license.licenseId` with `GET /LicenseSvc` if you
> need to. `POST /LicenseSvc/{aLicenseId}/consume` and the device endpoints stay limited to the
> licence's purchaser.
>
> **Deleted licence types (2026-10-04).** A licence whose type an administrator has deleted is skipped
> as if it did not exist — the answer comes from a group licence if there is one, else
> `No active license found for this application`. (The message `License type is no longer available`
> exists only on the admin site's licence-key check; this endpoint never returns it.) A type that is
> only inactive (no longer sold) still validates for people who hold it. A **new** assignment of an
> inactive type is refused on the admin site with `License type is no longer offered`; renewing an
> existing licence of it still works. No external endpoint assigns licences, so neither message
> reaches your app.

> **Devices used of allowed (since v1.5.1).** For a valid licence whose type sets a device cap
> (`DeviceLifetime`, `DeviceSubscription`), the check reports the user's position against it, read
> fresh on every call:
>
> | Field | Value |
> |-------|-------|
> | `devicesAllowed` | The licence type's `maxDevices` |
> | `devicesUsed` | The user's declared devices for this application that are neither forgotten nor blocked — the same number `device-login` reports as `deviceCap.deviceCount` |
> | `deviceRegistered` | `true` when the `deviceInfo.deviceId` you sent is one of those declared devices (a blocked one still counts as registered); `false` when you sent none or it is not one |
> | `deviceCap` | The same block `device-login` returns: `deviceCount`, `maxDevices`, `isOverCap`, `warning`, `licenseKey`, `licenseModel` |
>
> The check is **read-only**: it records no device, claims no slot and does not count as a sign-in,
> so calling it from a device the user has never signed in on leaves `devicesUsed` unchanged. That
> also means forgetting a device (`DELETE /AuthSvc/devices/{aUserDeviceId}`) shows on the very next
> check, with no sign-in in between — use it to refresh a "2 of 3 devices" line. Until v1.5.1 these
> fields were never filled and always read `false`, `0` and `0`. `registeredDevices` is still not
> populated here; list devices with `GET /AuthSvc/devices`.
>
> Until v1.5.1 this endpoint also compared against a licence's application id that was never read,
> so it answered `No active license found for this application` even to a user who held one.

> **Where a device cap is actually enforced.** For the `DeviceLifetime` and `DeviceSubscription`
> licence models, `LicenseTypes.MaxDevices` is checked when a device signs in, not here. The
> sign-in routes claim a device slot and report the outcome in their own response; a user already at
> the cap is **not** refused a token. See [Section 3.1](#31-auth-service-authsvc) for that response
> block. `DELETE /LicenseSvc/{aLicenseId}/devices/{aDeviceId}` (below) is how a slot is freed.

#### POST /LicenseSvc/{aLicenseId}/consume

Consumes quantity from a quantity-based license. Requires authentication.

**Request Body:**
```json
{
  "quantity": 1,
  "reference": "export_report_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "consumedQuantity": 1,
    "remainingQuantity": 99
  },
  "message": "Quantity consumed successfully"
}
```

| Error Code | HTTP | When |
|------------|------|------|
| `VALIDATION_ERROR` | 400 | `quantity` is 0 or negative |
| `LICENSE_NOT_FOUND` | 404 | License ID does not exist |
| `CROSS_APP_LICENSE` | 403 | Caller's app context (from `X-Api-Key`) does not match the license's `ApplicationId` |
| `LICENSE_INACTIVE` | 400 | License status is not `Active` |
| `INVALID_LICENSE_MODEL` | 400 | License is not a Quantity-model license |
| `INSUFFICIENT_QUANTITY` | 400 | Remaining quantity < requested quantity. The message names both the available and the requested amount |

> **ApplicationId scoping:** when the caller has a resolvable ApplicationId (via `X-Api-Key`), the license must belong to that application or the request is rejected with `403 CROSS_APP_LICENSE`. User-ownership (`license.UserId == caller`) is also enforced and returns plain `403 Forbidden` if it fails.

> **`reference` and `metadata` are not stored.** `ConsumeQuantityRequest` accepts both alongside
> `quantity`, but only `quantity` affects anything — it is subtracted from the licence's
> `remainingQuantity`. Keep your own record of what each consumption was for.

#### DELETE /LicenseSvc/{aLicenseId}/devices/{aDeviceId}

Deactivates a device from a license, freeing its slot against the licence's `maxDevices` cap.
Requires authentication. No request body.

Both path parameters are integers: `aLicenseId` is the user licence id (the `licenseId` from
`GET /LicenseSvc`), and `aDeviceId` is the licence-device id, not the device identifier string a
client sends at sign-in.

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Device deactivated successfully"
}
```

| Error Code | HTTP | When |
|------------|------|------|
| `LICENSE_NOT_FOUND` | 404 | License ID does not exist |
| `CROSS_APP_LICENSE` | 403 | Caller's app context does not match the license's `ApplicationId` |
| `DEVICE_NOT_FOUND` | 404 | Device not registered against this license |

> **ApplicationId scoping:** same as `/consume` — if the caller has a resolvable ApplicationId, the license's `ApplicationId` must match or `403 CROSS_APP_LICENSE` is returned.

---

### 3.3 User Service (UserSvc)

Base path: `/UserSvc`

All endpoints require authentication.

#### GET /UserSvc/profile

Gets the current user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "mobileNumber": "+919876543210",
    "applicationRole": "User",
    "isEmailVerified": true,
    "isMobileVerified": false,
    "createdDate": "2025-01-01T00:00:00Z",
    "address": null
  }
}
```

| Error Code | HTTP | When |
|------------|------|------|
| `USER_NOT_FOUND` | 404 | The token's user id no longer matches an account |
| `NO_APP_ACCESS` | 403 | An app context was resolved and the user has no active role for it |

> **ApplicationId scoping:** when the caller has a resolvable ApplicationId (via `X-Api-Key`), the returned `applicationRole` is scoped to that application only — the user's roles in other applications are never leaked. If the user has no `UserApplicationRole` row for the calling app, the endpoint returns `403 NO_APP_ACCESS`. When no app context is resolved (internal admin/management paths), the profile is returned without `applicationRole` scoping, preserving legacy user-global behaviour.

> **`address` is always `null` here.** The field is part of the response shape but this endpoint
> never populates it — read addresses from `GET /UserSvc/addresses` below. `mobileNumber` is the
> account's first mobile number.

> **There is no profile image in this API.** Until 2026-09-18 the response carried a
> `profileImageUrl` that was always `null` and `PUT /UserSvc/profile` accepted one it never stored,
> so a child app could set a picture, be told it succeeded and never see it again. There is no
> `ProfileImageUrl` column on `Users` and no requirement asking for one, so the field was removed
> from both sides rather than given a column with no product behind it: `GET` no longer returns the
> key at all and `PUT` no longer documents it. Host profile images in the child application.

#### PUT /UserSvc/profile

Updates the current user's profile. Only the three fields below are applied.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "mobileNumber": "+919876543211"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `firstName` | No | Applied when present and not blank. Omitting it, or sending `null` or whitespace, leaves the stored value alone |
| `lastName` | No | Same rule as `firstName` |
| `mobileNumber` | No | Applied when present, including an empty string — that is how the number is cleared. Only `null` (or omitting the field) leaves it alone |

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Profile updated successfully"
}
```

> **`profileImageUrl` is no longer part of this request (2026-09-18).** It used to be accepted and
> discarded; the field is gone from the request DTO, so the contract stops promising a picture
> nothing stores. Unknown JSON members are ignored, so an older client that still sends it is not
> rejected — but nothing is stored and `GET /UserSvc/profile` does not return the key. `GET` and
> `PUT` now agree: this API has no profile image.

| Error Code | HTTP | When |
|------------|------|------|
| `USER_NOT_FOUND` | 404 | The token's user id no longer matches an account |

#### GET /UserSvc/addresses

Gets the current user's addresses.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "addressId": 8,
      "addressType": "Primary",
      "addressLine1": "123 Main St",
      "addressLine2": null,
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "postalCode": "400001"
    }
  ],
  "message": null
}
```

#### POST /UserSvc/addresses

Creates or updates an address. There is one address per `addressType`: the server looks for an
existing address of that type and overwrites it, or inserts a new one when there is none. Send the
whole address every time — a field you omit is stored as empty, not left at its previous value.

**Request Body:**
```json
{
  "addressType": "Primary",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "postalCode": "400001"
}
```

`addressType` defaults to `"Primary"` when omitted. There is no `addressId` in the request — the
type is what identifies the row — and no endpoint for deleting an address.

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Address updated successfully"
}
```

> The saved address is **not** returned. Call `GET /UserSvc/addresses` afterwards if you need its
> `addressId`.

#### POST /UserSvc/change-password

Changes the current user's password. **Both passwords must be RSA-encrypted** with the server's public key (RSA-OAEP-SHA256) — plaintext fields are rejected.

**Request Body:**
```json
{
  "encryptedCurrentPassword": "base64_rsa_encrypted_current_password...",
  "encryptedNewPassword": "base64_rsa_encrypted_new_password..."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `encryptedCurrentPassword` | Yes | RSA-encrypted current password. Use `GET /AuthSvc/public-key` to fetch the key |
| `encryptedNewPassword` | Yes | RSA-encrypted new password. Must satisfy the password rule described below |

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Password changed successfully"
}
```

| Error Code | HTTP | When |
|------------|------|------|
| `VALIDATION_ERROR` | 400 | A required encrypted field is missing or blank. The message names which one |
| `DECRYPTION_FAILED` | 400 | Either encrypted field failed to decrypt (wrong public key / padding / base64). The message names which one |
| `INVALID_PASSWORD` | 400 | Decrypted new password breaks the password rule |
| `INVALID_CURRENT_PASSWORD` | 400 | Decrypted current password does not match the stored hash |

> **The password rule, and the exact response.** A new password must be **at least 8 characters and
> contain an uppercase letter, a digit and a special character**. One rule now covers every
> password-setting path — this endpoint, `POST /AuthSvc/reset-password`, and the admin site's own
> change and reset screens — so a password refused here is refused everywhere. A weak password is
> rejected before the current password is checked, and the body is verbatim:
>
> ```json
> {
>   "success": false,
>   "error": "INVALID_PASSWORD",
>   "message": "Password must be at least 8 characters with uppercase, number, and special character",
>   "statusCode": 400,
>   "details": null,
>   "traceId": "b84dfaba9af64d53"
> }
> ```
>
> Show `message` to the user as-is; it is the same sentence the admin site shows.

> **PIN accounts use the PIN rule (v1.6, BRD-18).** A child created by
> `POST /GroupSvc/{aGroupId}/children` signs in with a PIN, and this endpoint is how the signed-in
> child changes it: `encryptedCurrentPassword` carries the current PIN and `encryptedNewPassword` the new
> one, both RSA-encrypted as above. For such an account the new value must be **4 to 8 digits**, and a
> value that breaks it — including a password-shaped one such as `Passw0rd!` — answers:
>
> ```json
> {
>   "success": false,
>   "error": "INVALID_PASSWORD",
>   "message": "PIN must be 4 to 8 digits",
>   "statusCode": 400,
>   "details": null,
>   "traceId": "5f0c1d2e3a4b5c6d"
> }
> ```
>
> Every other account keeps the password rule, so a PIN-shaped new value (`4821`) is refused for them
> with the password message. The checks run in the order of the table above: missing field, decryption,
> the rule (`INVALID_PASSWORD`), then the current password or PIN (`INVALID_CURRENT_PASSWORD`).

> **Breaking change (v1.3):** the prior `currentPassword` / `newPassword` plaintext fields have been removed. Use the encrypted variants above.

#### POST /UserSvc/data-export

Submits a GDPR data export request. No request body. The export is prepared out of band and the user
is emailed when it is ready; `estimatedCompletionDate` is always 24 hours from the moment of the
request.

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "abc123",
    "message": "Your data export request has been submitted. You will receive an email when ready.",
    "estimatedCompletionDate": "2026-01-27T00:00:00Z"
  },
  "message": null
}
```

The export covers the user's account, licences, transactions and their declared devices with the
sign-in history recorded against them.

#### POST /UserSvc/delete-request

Submits a GDPR account deletion request. Returns the request ID and estimated completion date, which
is always 7 days from the moment of the request.

**Request Body:**
```json
{
  "reason": "No longer using the service",
  "confirmEmail": "user@example.com"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `confirmEmail` | Yes | Must exactly match the authenticated user's email (case-insensitive) or `EMAIL_MISMATCH` (400) is returned |
| `reason` | No | Free-text reason. Accepted, but not stored with the request today |

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "412",
    "message": "Your account deletion request has been submitted.",
    "estimatedCompletionDate": "2026-10-28T09:30:00Z"
  },
  "message": null
}
```

**Who may call it, and what happens (1.7).** A server (key and secret) or an installed app (installed-app key with
`X-Device-Id`, [Section 2.1.1](#211-installed-apps-public-keys)) may call it, always with the signed-in user's
bearer token. The request is for that user's own account only: the account comes from the token, never from the
body, and `confirmEmail` must be that user's email. The call deletes nothing. It adds a `Pending` deletion request
to the admin approval queue (GDPR Dashboard, `/settings/compliance`), where an administrator reviews and processes
it; the account keeps working until then. Ask the user to type their email to confirm, rather than filling it in
for them.

| Error | Status | When |
|-------|--------|------|
| `UNAUTHORIZED` | 401 | No bearer token, or the token is invalid or expired |
| `EMAIL_MISMATCH` | 400 | `confirmEmail` is not the signed-in user's email; nothing is queued |
| `DEVICE_ID_REQUIRED` | 400 | Installed-app key without `X-Device-Id` |

```bash
curl -X POST "https://api.appmanager.com/UserSvc/delete-request" \
  -H "X-Api-Key: pk_live_your_public_key_here" -H "X-Device-Id: 5f1c2a9e-…" \
  -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" \
  -d '{"confirmEmail":"user@example.com","reason":"No longer using the app"}'
```

---

### 3.4 Feature Service (FeatureSvc)

Base path: `/FeatureSvc`

All endpoints require authentication.

#### GET /FeatureSvc

Gets all active features for the application, each with this user's access status. ApplicationId is
required.

**Query Parameters:**
- `aApplicationId` (required*): The application ID (*can be provided via X-Api-Key header instead)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "featureCode": "EXPORT_PDF",
      "featureName": "PDF Export",
      "featureType": "Binary",
      "hasAccess": true,
      "level": null,
      "currentUsage": null,
      "levelDescription": null,
      "source": "license",
      "reason": null,
      "requiredLicense": null,
      "flagInfo": null
    },
    {
      "featureCode": "API_REQUESTS",
      "featureName": "API Requests",
      "featureType": "Level",
      "hasAccess": true,
      "level": 1000,
      "currentUsage": null,
      "levelDescription": "1000 API requests per month",
      "source": "license",
      "reason": null,
      "requiredLicense": null,
      "flagInfo": null
    },
    {
      "featureCode": "PREMIUM_SUPPORT",
      "featureName": "Premium Support",
      "featureType": "Binary",
      "hasAccess": false,
      "level": null,
      "currentUsage": null,
      "levelDescription": null,
      "source": "license",
      "reason": "Feature not included in your license",
      "requiredLicense": null,
      "flagInfo": null
    }
  ],
  "message": "Retrieved 10 features"
}
```

`source` is always `"license"` on this endpoint — access here comes from the licences the user holds
for the application, never from a feature flag. There are exactly two `reason` strings when access is
denied:

| `reason` | Meaning |
|----------|---------|
| `Feature not included in your license` | At least one of the user's active licences names this feature, and every one that names it has it switched off |
| `No active license or feature not included in license` | None of the user's active licences names this feature, or there is no active licence |

> **Which licences count, and how they combine (v1.6, ADR-013, BRD-42).** The answer is built from
> **every** active licence the user has in the calling application — their own and those held by any
> group they belong to there ([Section 3.7](#group-licences)) — and merged per feature:
>
> | Feature type | Merged value |
> |--------------|--------------|
> | `Binary` | `hasAccess: true` if **any** licence turns it on |
> | `Level` | The **highest** `level` among the licences that turn it on; `-1` (unlimited, `levelDescription: "Unlimited"`) beats every number. A licence that turns the feature on always beats one that has it off, whatever the levels |
>
> A licence counts only when its status is `Active`, its `expiryDate` is empty or in the future, and its
> licence type has not been deleted. So a licence past its end date gives **nothing** even while its
> status still reads `Active` (before v1.6 such a licence kept granting features until something moved
> it to `Expired`), and a licence of a deleted type gives nothing. A type that is only inactive (no longer
> sold) still counts. Merging can only add access; no licence is ranked against another, and the
> response does not say which licence supplied the value.
>
> Before v1.6 a user with two licences mapping the same feature got whichever row came first from
> `GET /FeatureSvc/{aFeatureCode}`, and `GET /FeatureSvc` failed with `500 INTERNAL_ERROR`. Both now give
> the merged value.
>
> **Feature flags are separate.** These two licence endpoints never consult a feature flag; ask
> [`GET /FeatureSvc/flags/{aFlagCode}`](#get-featuresvc-flags-aflagcode) for a flag. AppManager's own
> combined check (used by the admin site) lets an enabled flag win over the licence answer, so if your
> app also has a flag for the same capability, check the flag first and fall back to the licence.

`levelDescription` is only set for `Level` features that the user has, and is derived from the
feature's name — for example `"1000 API requests per month"`, `"5 users"`, `"50 GB storage"`, or
`"Level 3"` when the name suggests nothing. A level of `-1` reads `"Unlimited"`.

> **`currentUsage` and `requiredLicense` are always `null`.** Both are part of the response shape but
> are never populated. Do not build an "upgrade to X" prompt on `requiredLicense`; decide the upgrade
> path from `GET /LicenseSvc/types` instead.

| Error Code | HTTP | When |
|------------|------|------|
| `APPLICATION_ID_REQUIRED` | 400 | No `X-Api-Key` header and no `aApplicationId` |
| `APP_ID_MISMATCH` | 400 | `aApplicationId` disagrees with the API key's application |

#### GET /FeatureSvc/{aFeatureCode}

Checks access to a specific feature by code. `aFeatureCode` is matched exactly as stored.

**Response:**
```json
{
  "success": true,
  "data": {
    "featureCode": "EXPORT_PDF",
    "featureName": "PDF Export",
    "featureType": "Binary",
    "hasAccess": true,
    "level": null,
    "currentUsage": null,
    "levelDescription": null,
    "source": "license",
    "reason": null,
    "requiredLicense": null,
    "flagInfo": null
  },
  "message": "Feature access granted"
}
```

`message` is `"Feature access granted"` or `"Feature access denied"` to match `hasAccess`. The
`data` object is exactly one entry from `GET /FeatureSvc`, with the same rules for every field.

| Error Code | HTTP | When |
|------------|------|------|
| `FEATURE_NOT_FOUND` | 404 | No feature with that code for the application, or the feature is inactive. The message quotes the code you asked for |
| `APPLICATION_ID_REQUIRED` | 400 | No `X-Api-Key` header and no `aApplicationId` |

#### GET /FeatureSvc/flags/{aFlagCode}

Checks the status of a feature flag for the calling user. This is a different question from
`GET /FeatureSvc/{aFeatureCode}`: features come from the licence, flags come from a rollout the
administrator controls.

**Query Parameters:**
- `aApplicationId` (optional*): The application ID (*can be provided via X-Api-Key header). Unlike the
  two endpoints above this one is genuinely optional — a flag can be global, and a request with no app
  context resolves against global flags.

**Response:**
```json
{
  "success": true,
  "data": {
    "featureCode": "NEW_DASHBOARD",
    "featureName": "New Dashboard",
    "featureType": "Binary",
    "hasAccess": true,
    "level": null,
    "currentUsage": null,
    "levelDescription": null,
    "source": "featureFlag",
    "reason": null,
    "requiredLicense": null,
    "flagInfo": {
      "flagName": "New Dashboard Beta",
      "rolloutPercentage": 50,
      "variant": null
    }
  },
  "message": "Feature flag is enabled"
}
```

`hasAccess` is this user's answer, not the flag's global state. When it is `false`, `reason` reads
`"Feature flag is not enabled for this user"` and `message` reads `"Feature flag is disabled"`.
`flagInfo.rolloutPercentage` is the flag's configured percentage — useful for logging, but it does
**not** tell you why this particular user was included or excluded.

> **A user named in the flag's target list is always granted it.** When an administrator lists
> addresses under "Specific Users" on the Feature flags screen, the screen resolves each address to
> that account's user id and stores the ids, which is the form the flag check reads. A user in that
> list gets `hasAccess: true` **regardless of the rollout percentage** — including a flag left at 0%,
> which is the normal way to give a named group early access. Everyone else falls through to the
> percentage, which is applied by a stable hash of user id and flag code: the same user gets the same
> answer every time, so you can cache it per user.
>
> Targeting does not override the rest of the flag, though. A flag that is switched off, or outside
> its start/end dates, is `false` for everyone including targeted users. An address that matches no
> account grants nothing — it is dropped when the administrator saves.

| Error Code | HTTP | When |
|------------|------|------|
| `FLAG_NOT_FOUND` | 404 | No flag with that code for the resolved application, and no global flag with it. The message quotes the code you asked for |

---

### 3.5 Payment Service (PaymentSvc)

Base path: `/PaymentSvc`

All endpoints require authentication except `POST /PaymentSvc/promo-codes/validate`, which is
anonymous.

> **Provider webhooks are elsewhere and are not yours to call.** Stripe and Razorpay post settlement
> events to `POST /PaymentWebhooks/stripe` and `POST /PaymentWebhooks/razorpay`. Those endpoints are
> anonymous but authenticated by an HMAC signature over the raw body, and exist for the payment
> providers only — a child application never calls them. They are not part of this integration
> surface.

#### GET /PaymentSvc/transactions

Gets the user's transaction history, optionally scoped to an application.

**Query Parameters:**
- `aApplicationId` (optional*): Filter by application (*can be provided via X-Api-Key header)
- `aPage` (optional): Page number (default: 1)
- `aPageSize` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "transactionId": 1,
        "transactionNumber": "TXN-2026-0001",
        "transactionType": "Purchase",
        "amount": 99.99,
        "currencyCode": "USD",
        "status": "Completed",
        "paymentMethod": "Credit Card",
        "transactionDate": "2026-01-01T10:00:00Z",
        "description": "Professional License Purchase"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "message": null
}
```

Transactions come back newest first. `totalCount` counts this user's transactions within the
application scope, not the whole page set, and `hasNextPage` / `hasPreviousPage` are derived from it —
page through with those rather than comparing `page` to `totalPages` yourself. The list form does not
include `providerTransactionId`; fetch a single transaction for that.

#### GET /PaymentSvc/transactions/{aTransactionId}

Gets a specific transaction by ID. The response is one `items` entry from the list above plus
`providerTransactionId`, which carries the payment provider's own identifier once a payment has
settled.

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": 1,
    "transactionNumber": "TXN-2026-0001",
    "transactionType": "Purchase",
    "amount": 99.99,
    "currencyCode": "USD",
    "status": "Completed",
    "paymentMethod": "Credit Card",
    "transactionDate": "2026-01-01T10:00:00Z",
    "description": "Professional License Purchase",
    "providerTransactionId": "pay_QxMkL2v9ZaBc1D"
  },
  "message": null
}
```

| Error Code | HTTP | When |
|------------|------|------|
| `TRANSACTION_NOT_FOUND` | 404 | No transaction with that ID |
| `403 Forbidden` | 403 | Transaction does not belong to the authenticated user |
| `CROSS_APP_RESOURCE` | 403 | Caller's app context (from `X-Api-Key`) does not match the transaction's `ApplicationId` |

> **ApplicationId scoping:** when the caller has a resolvable ApplicationId, the transaction's `ApplicationId` must match or the request is rejected with `403 CROSS_APP_RESOURCE`.

#### GET /PaymentSvc/invoices

Gets the user's invoices, optionally scoped to an application. Paged exactly like
`GET /PaymentSvc/transactions` — same `data` envelope, same `hasNextPage` / `hasPreviousPage` — and
ordered newest first by `invoiceDate`.

**Query Parameters:**
- `aApplicationId` (optional*): Filter by application (*can be provided via X-Api-Key header)
- `aPage` (optional): Page number (default: 1)
- `aPageSize` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "invoiceId": 1,
        "invoiceNumber": "INV-2026-0001",
        "invoiceDate": "2026-01-01T00:00:00Z",
        "dueDate": "2026-01-15T00:00:00Z",
        "subTotal": 99.99,
        "taxAmount": 18.00,
        "totalAmount": 117.99,
        "currencyCode": "USD",
        "status": "Paid",
        "paidDate": "2026-01-02T09:12:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "message": null
}
```

#### GET /PaymentSvc/invoices/{aInvoiceId}

Gets a specific invoice by ID. The response is one `items` entry from the list above plus
`billingAddress` and `notes`.

| Error Code | HTTP | When |
|------------|------|------|
| `INVOICE_NOT_FOUND` | 404 | No invoice with that ID |
| `403 Forbidden` | 403 | Invoice does not belong to the authenticated user |
| `CROSS_APP_RESOURCE` | 403 | Caller's app context (from `X-Api-Key`) does not match the invoice's `ApplicationId` |

> **ApplicationId scoping:** when the caller has a resolvable ApplicationId, the invoice's `ApplicationId` must match or the request is rejected with `403 CROSS_APP_RESOURCE`.

#### GET /PaymentSvc/invoices/{aInvoiceId}/download

Downloads an invoice as PDF. Returns `application/pdf` bytes on success, or a JSON error on failure (`INVOICE_NOT_FOUND`, `PDF_GENERATION_FAILED`, or `403 Forbidden` if the invoice does not belong to the caller).

#### GET /PaymentSvc/subscriptions

Gets the user's active subscriptions, optionally scoped to an application.

**Query Parameters:**
- `aApplicationId` (optional*): Filter by application (*can be provided via X-Api-Key header)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "subscriptionId": 1,
      "planName": "Professional Monthly",
      "status": "Active",
      "billingCycle": "Monthly",
      "amount": 9.99,
      "currencyCode": "USD",
      "startDate": "2026-01-01T00:00:00Z",
      "currentPeriodEnd": "2026-02-01T00:00:00Z",
      "cancelAtPeriodEnd": false,
      "nextBillingDate": "2026-02-01T00:00:00Z"
    }
  ],
  "message": null
}
```

`billingCycle` is the subscription's billing interval (for example `Monthly` or `Yearly`) and
`amount` is what is charged each interval. `cancelAtPeriodEnd` is `true` for a subscription that has
been cancelled but is still running to the end of its paid period.

#### POST /PaymentSvc/subscriptions/{aSubscriptionId}/cancel

Cancels a subscription. Requires authentication.

**Request Body (all fields optional):**
```json
{
  "cancelImmediately": false,
  "reason": "No longer needed"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `cancelImmediately` | No | `false` (default) = cancel at the end of the current billing period; `true` = cancel right now |
| `reason` | No | Free-text cancellation reason stored on the subscription |

The whole body is optional — `POST` with no body cancels at the end of the current period.

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Subscription will be cancelled at the end of the current billing period"
}
```

`message` is `"Subscription cancelled immediately"` when `cancelImmediately` was `true`.

| Error Code | HTTP | When |
|------------|------|------|
| `SUBSCRIPTION_NOT_FOUND` | 404 | No subscription with that ID |
| `403 Forbidden` | 403 | Subscription does not belong to the authenticated user |
| `CROSS_APP_RESOURCE` | 403 | Caller's app context does not match the subscription's `ApplicationId` |
| `ALREADY_CANCELLED` | 400 | Subscription is already in `Cancelled` status |
| `CANCEL_REFUSED` | 400 | The subscription exists and is not already cancelled, but the cancellation itself did not go through. The message carries the reason |

> **Check the status code, not just `success`.** A refused cancellation used to answer `200 OK` with
> "cancelled" because the outcome was discarded. It now answers `400 CANCEL_REFUSED` with the reason
> in `message`, so a client that only looked at the HTTP status was previously being misled.

> **ApplicationId scoping:** when the caller has a resolvable ApplicationId, the subscription's `ApplicationId` must match or the request is rejected with `403 CROSS_APP_RESOURCE`.

#### POST /PaymentSvc/promo-codes/validate

Validates a promo code. Anonymous (no JWT required) but an ApplicationId is mandatory because promo codes are application-scoped.

The ApplicationId must come from the `X-Api-Key` header — this endpoint reads no `aApplicationId`
query parameter and no `applicationId` body field.

**Request Body:**
```json
{
  "code": "SAVE20"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "SAVE20",
    "discountType": "Percentage",
    "discountValue": 20,
    "description": "20% off your first purchase",
    "expiryDate": "2026-12-31T23:59:59Z"
  },
  "message": "Promo code is valid"
}
```

| Error Code | HTTP | When |
|------------|------|------|
| `VALIDATION_ERROR` | 400 | `code` missing |
| `APPLICATION_ID_REQUIRED` | 400 | Caller did not send `X-Api-Key`, so no ApplicationId could be resolved |
| `PROMO_CODE_NOT_FOUND` | 404 | Code does not exist |
| `PROMO_CODE_NOT_VALID_FOR_APPLICATION` | 400 | Code is app-scoped to a different application than the caller's |
| `PROMO_CODE_INACTIVE` | 400 | Code is disabled |
| `PROMO_CODE_NOT_YET_VALID` | 400 | `ValidFrom` is in the future — the code is saved but its window has not opened |
| `PROMO_CODE_EXPIRED` | 400 | `ValidTo` has passed |
| `PROMO_CODE_EXHAUSTED` | 400 | `CurrentUses >= MaxUses` |

> **Both ends of the validity window are checked.** A code whose `ValidFrom` is still in the future is
> refused with `PROMO_CODE_NOT_YET_VALID`; only the end of the window used to be checked, so a code
> saved to start next month was accepted today. A code saved with no expiry has no `ValidTo` and never
> returns `PROMO_CODE_EXPIRED`.

> **ApplicationId scoping:** the endpoint requires a resolvable ApplicationId. Globally-scoped promo codes (stored `ApplicationId == null`) are valid for every app; app-scoped codes must match the caller's ApplicationId, otherwise `PROMO_CODE_NOT_VALID_FOR_APPLICATION` (400, business-logic error — not 403) is returned.

#### POST /PaymentSvc/payments/route

Resolves which payment provider settles a region, and reports whether that provider can be dispatched
to right now. Requires authentication. Call this before sending a user to checkout, so you know which
provider's client library to load.

**Request Body:**
```json
{
  "regionCode": "IN",
  "currencyCode": "INR",
  "amount": 499,
  "transactionCode": "TXN-2026-0042",
  "description": "Professional License Purchase"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `regionCode` | Yes | The region the payment is raised for, e.g. `IN` or `US` |
| `currencyCode` | No | A currency to insist on. When omitted the region's own currency is used |
| `amount` | No | The amount the payment is for, passed on when the provider is asked to create an order |
| `transactionCode` | No | Your internal transaction code, tied to the provider's order |
| `description` | No | A short description shown on the provider's checkout |

**Response:**
```json
{
  "success": true,
  "data": {
    "regionCode": "IN",
    "currencyCode": "INR",
    "providerCode": "Razorpay",
    "providerName": "Razorpay",
    "providerId": 2,
    "isSandbox": true,
    "isCatchAllRoute": false,
    "isProviderReady": true,
    "providerMessage": null,
    "providerOrderId": "order_QxMkL2v9ZaBc1D"
  },
  "message": "Payments for region IN route to Razorpay"
}
```

| Error Code | HTTP | When |
|------------|------|------|
| `VALIDATION_ERROR` | 400 | No `regionCode` was supplied |
| `PAYMENT_ROUTE_NOT_CONFIGURED` | 409 | No active provider covers the region and there is no catch-all route. The message carries the reason |

> **A 200 means the routing decision was made, not that a payment was taken.** The routing half of the
> response comes from configuration and is always authoritative. Whether the provider can actually be
> used is the separate `isProviderReady` flag: when it is `false`, `providerOrderId` is `null` and
> `providerMessage` says in plain English what is missing — typically that the provider's API
> credentials have not been supplied. Treat that as a deployment gap to report, not as a bad region.

> **`isCatchAllRoute`** is `true` when the region had no route of its own and the catch-all provider
> was used. The decision still stands; it just means nobody configured that region explicitly.

---

### 3.6 Issue Service (IssueSvc)

Base path: `/IssueSvc`

All endpoints require authentication. Every endpoint here is scoped to issues the authenticated user
reported themselves — there is no way to read another user's issue over the external API.

> **Attachments** are supported on `POST /IssueSvc` and on the issue detail. They go through the same
> store the admin site uses, so the same limits apply: at most **10 MB** per file and only
> `.png`, `.jpg`, `.jpeg`, `.pdf`, `.txt` and `.log`. A file the store will not take fails the whole
> request with `400 ATTACHMENT_REJECTED` before the issue is created — a `200 OK` now means the file
> really was stored, and the response says so.

#### GET /IssueSvc

Gets a page of the current user's issues, optionally scoped to an application, newest first. Only
issues the authenticated user reported themselves are returned.

**Query Parameters:**
- `aApplicationId` (optional*): Filter by application (*can be provided via X-Api-Key header)
- `aStatus` (optional): Filter by status name or code — `Open`, `In Progress`, `On Hold`, `Resolved`
  or `Closed`. Matched case-insensitively but **exactly**, so `InProgress` without the space matches
  nothing and returns an empty page rather than an error
- `aPage` (optional): 1-based page number, default `1`
- `aPageSize` (optional): issues per page, default `100`, maximum `200`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "issueId": 1,
        "issueNumber": "myapp-001",
        "title": "Cannot export to PDF",
        "description": "When I try to export...",
        "issueType": "Bug",
        "priority": "High",
        "status": "Open",
        "applicationId": 1,
        "applicationName": "My App",
        "createdDate": "2026-01-25T10:00:00Z",
        "updatedDate": "2026-01-25T10:00:00Z",
        "resolvedDate": null,
        "attachments": null
      }
    ],
    "page": 1,
    "pageSize": 100,
    "totalCount": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "message": "Retrieved 3 of 3 issues"
}
```

`issueNumber` is the application's code name, a dash, and a zero-padded sequence within that
application — `myapp-001`, `myapp-002`, and so on past `999`. It is not a date-based number and is not
unique across applications by prefix alone.

`attachments` is `null` on a list entry — the list does not read files. Call
`GET /IssueSvc/{aIssueId}` for an issue's attachments.

> **This endpoint is paged, and its envelope is a page object.** It used to answer a bare
> `data: [ … ]` of at most 100 issues with no way to reach the rest, and it applied `aStatus` to that
> one page rather than to the whole history. `data` is now the same `items` / `page` / `pageSize` /
> `totalCount` / `totalPages` / `hasNextPage` / `hasPreviousPage` shape the paged PaymentSvc endpoints
> return, and `aStatus` is resolved server-side and applied to the query. Sending no paging parameters
> still gives a page of 100, so the issues a caller saw before are the issues it still sees — but a
> caller that read `data` as an array must now read `data.items`. Walk `hasNextPage` to read a full
> history.

#### GET /IssueSvc/{aIssueId}

Gets a specific issue with its public comments, its stored attachments and the report fields it was
raised with. `aIssueId` is the numeric `issueId`, not the `issueNumber`.

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "commentId": 1,
        "comment": "We are investigating this issue.",
        "isInternal": false,
        "createdByName": "Support Team",
        "createdDate": "2026-01-25T11:00:00Z"
      }
    ],
    "reproductionSteps": "1. Open any report\n2. Click Export > PDF",
    "expectedBehavior": "A PDF file downloads",
    "actualBehavior": "An 'Export failed' toast appears and nothing downloads",
    "environment": {
      "browser": "Chrome 120",
      "os": "Windows 11",
      "appVersion": "2.1.0",
      "deviceType": "Desktop"
    },
    "issueId": 1,
    "issueNumber": "myapp-001",
    "title": "Cannot export to PDF",
    "description": "When I try to export...",
    "issueType": "Bug",
    "priority": "High",
    "status": "Open",
    "applicationId": 1,
    "applicationName": "My App",
    "createdDate": "2026-01-25T10:00:00Z",
    "updatedDate": "2026-01-25T10:00:00Z",
    "resolvedDate": null,
    "attachments": [
      {
        "attachmentId": 11,
        "fileName": "trace.log",
        "fileSize": 4211,
        "mimeType": "text/plain",
        "uploadedDate": "2026-01-25T10:00:01Z",
        "downloadUrl": "/IssueSvc/1/attachments/11"
      }
    ]
  },
  "message": null
}
```

The issue's own fields are those of a list entry, plus `comments` and `attachments` — `[]` when
nobody has commented and nothing is attached — and, **since v1.5.1**, the four report fields sent with
`POST /IssueSvc`:

| Field | Type | Value |
|-------|------|-------|
| `reproductionSteps` | string \| null | As sent; `null` when none was sent |
| `expectedBehavior` | string \| null | As sent; `null` when none was sent |
| `actualBehavior` | string \| null | As sent; `null` when none was sent |
| `environment` | object \| string \| null | The `environment` object as sent, with the members you left out absent. An issue an administrator raised in the portal carries the free text typed there, returned as a JSON **string**. `null` when none was stored |

Before v1.5.1 these four were not returned, and the server dropped them when an issue was created,
so an issue raised before the fix reads back with all four `null`. Read `environment` defensively:
check whether it is an object or a string before reading `os` from it.

Internal-team comments are filtered out server-side, so `isInternal` is always `false` on what you receive.

| Error Code | HTTP | When |
|------------|------|------|
| `ISSUE_NOT_FOUND` | 404 | No issue with that ID |
| `APP_ID_MISMATCH` | 403 | Caller's app context does not match the issue's `ApplicationId` |
| `403 Forbidden` | 403 | Issue was not reported by the authenticated user |

> **ApplicationId scoping:** when the caller has a resolvable ApplicationId, the issue's `ApplicationId` must match or `403 APP_ID_MISMATCH` is returned. User-ownership (`issue.ReportedByUserId == caller`) is also enforced.

#### GET /IssueSvc/{aIssueId}/attachments/{aAttachmentId}

Downloads one of an issue's stored files. This is the path each attachment's `downloadUrl` gives you,
relative to the API's base address. The response is the file's bytes with its stored `Content-Type`
and a `Content-Disposition` naming it — not a JSON envelope.

```bash
curl -L "https://api.example.com/IssueSvc/1/attachments/11" \
  -H "X-Api-Key: $API_KEY" -H "X-Api-Secret: $API_SECRET" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -o trace.log
```

| Error Code | HTTP | When |
|------------|------|------|
| `ISSUE_NOT_FOUND` | 404 | No issue with that ID |
| `ATTACHMENT_NOT_FOUND` | 404 | No such attachment, or it belongs to a different issue |
| `APP_ID_MISMATCH` | 403 | Caller's app context does not match the issue's `ApplicationId` |
| `403 Forbidden` | 403 | Issue was not reported by the authenticated user |

#### POST /IssueSvc

Creates a new support issue. ApplicationId is required. The issue is filed against the authenticated
user as its reporter.

**Request Body:**
```json
{
  "applicationId": 1,
  "title": "Cannot export to PDF",
  "description": "When I try to export my report to PDF, I get an error message saying 'Export failed'.",
  "type": "Bug",
  "priority": "High",
  "reproductionSteps": "1. Open report\n2. Click Export\n3. Select PDF",
  "expectedBehavior": "The PDF downloads",
  "actualBehavior": "An 'Export failed' message appears",
  "environment": {
    "browser": "Chrome 126",
    "os": "Windows 11",
    "appVersion": "3.2.0",
    "deviceType": "Desktop"
  },
  "attachments": [
    { "fileName": "trace.log", "mimeType": "text/plain", "base64Content": "Ym9vbSE=" }
  ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Blank or missing gives `400 VALIDATION_ERROR` |
| `description` | Yes | Blank or missing gives `400 VALIDATION_ERROR` |
| `applicationId` | Yes* | *Can be supplied by the `X-Api-Key` header instead. If both are given they must agree |
| `type` | No | Issue type code or name, matched case-insensitively — `Bug`, `Feature`, `Support` or `Feedback`. Omitting it gives `Bug`; anything else gives `400 INVALID_ISSUE_TYPE` |
| `priority` | No | Priority code or name, matched case-insensitively — `Critical`, `High`, `Medium` or `Low`. Omitting it gives `Medium`; anything else gives `400 INVALID_ISSUE_PRIORITY` |
| `reproductionSteps` | No | Free text |
| `expectedBehavior` | No | Free text |
| `actualBehavior` | No | Free text |
| `environment` | No | An object with any of `browser`, `os`, `appVersion`, `deviceType` — send whichever you know. Stored as that JSON object (other members are ignored) and returned in the same shape by `GET /IssueSvc/{aIssueId}`. At most 2000 characters once serialised |
| `attachments` | No | Files to store with the issue. Each needs a `fileName`, a `mimeType` and the bytes as `base64Content`. At most 10 MB each, and only `.png`, `.jpg`, `.jpeg`, `.pdf`, `.txt`, `.log` |

**Response:**
```json
{
  "success": true,
  "data": {
    "issueId": 5,
    "issueNumber": "myapp-005",
    "title": "Cannot export to PDF",
    "description": "When I try to export my report to PDF, I get an error message saying 'Export failed'.",
    "issueType": "Bug",
    "priority": "High",
    "status": "Open",
    "applicationId": 1,
    "applicationName": "My App",
    "createdDate": "2026-01-26T12:00:00Z",
    "updatedDate": null,
    "resolvedDate": null,
    "attachments": [
      {
        "attachmentId": 11,
        "fileName": "trace.log",
        "fileSize": 5,
        "mimeType": "text/plain",
        "uploadedDate": "2026-01-26T12:00:00Z",
        "downloadUrl": "/IssueSvc/5/attachments/11"
      }
    ]
  },
  "message": "Issue created successfully"
}
```

Keep the returned `issueNumber` — it is what a person will quote back to you, and there is no
endpoint for looking an issue up by number.

`attachments` on the response is what was actually stored, `[]` when you sent none. Each entry
carries the `attachmentId` and the `downloadUrl` to fetch its bytes from.

| Error Code | HTTP | When |
|------------|------|------|
| `VALIDATION_ERROR` | 400 | `title` or `description` is missing or blank, or `environment` is over 2000 characters once serialised. The message names which |
| `APPLICATION_ID_REQUIRED` | 400 | No `X-Api-Key` header and no `applicationId` in the body |
| `APP_ID_MISMATCH` | 400 | The body's `applicationId` disagrees with the API key's application |
| `INVALID_ISSUE_TYPE` | 400 | `type` matches no seeded issue type. The message lists the ones that exist |
| `INVALID_ISSUE_PRIORITY` | 400 | `priority` matches no seeded priority. The message lists the ones that exist |
| `ATTACHMENT_REJECTED` | 400 | An attachment has no `fileName`, is not an allowed type, is empty, is not valid base64, or is over 10 MB. The message names the file and the reason |

> **An unrecognised `type` or `priority` is now refused, not substituted.** Both are matched
> case-insensitively against the seeded codes and names, so `low`, `LOW` and `Low` all reach the same
> row. Anything the server does not know comes back `400` naming the accepted values, in place of the
> old behaviour where a misspelt `priority` was quietly filed as **`Critical`** (the first row by
> display order) and a misspelt `type` as `Bug`. Omitting the field is still fine and still gives
> `Bug` / `Medium`.

> **Attachments fail the request rather than disappearing.** Every file is checked before the issue
> row is written, so a refused file means no issue was created and you get `400 ATTACHMENT_REJECTED`
> saying which file and why. Previously the array was ignored altogether: the issue was created, the
> file was never stored, and the `200 OK` said nothing about it.

#### POST /IssueSvc/{aIssueId}/comments

Adds a comment to an issue. Public (non-internal) comments only; internal-team comments are not exposed through the external API. You can only comment on an issue you reported.

**Request Body:**
```json
{
  "comment": "The error also happens when exporting to CSV."
}
```

The only field is `comment`. There is no attachment field on this endpoint, and no way to mark a
comment internal.

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Comment added successfully"
}
```

The saved comment is not returned. Call `GET /IssueSvc/{aIssueId}` afterwards if you need its
`commentId`.

| Error Code | HTTP | When |
|------------|------|------|
| `VALIDATION_ERROR` | 400 | `comment` missing or blank |
| `ISSUE_NOT_FOUND` | 404 | No issue with that ID |
| `APP_ID_MISMATCH` | 403 | Caller's app context does not match the issue's `ApplicationId` |
| `403 Forbidden` | 403 | Issue was not reported by the authenticated user |

> **ApplicationId scoping:** same as `GET /IssueSvc/{aIssueId}` — the issue's `ApplicationId` must match the caller's resolved ApplicationId.

#### POST /IssueSvc/{aIssueId}/close

Closes an issue. No request body. Answers:

```json
{
  "success": true,
  "data": null,
  "message": "Issue closed successfully"
}
```

| Error Code | HTTP | When |
|------------|------|------|
| `ISSUE_NOT_FOUND` | 404 | No issue with that ID |
| `APP_ID_MISMATCH` | 403 | Caller's app context does not match the issue's `ApplicationId` |
| `403 Forbidden` | 403 | Issue was not reported by the authenticated user |
| `STATUS_NOT_FOUND` | 400 | No `Closed` (or `IsFinal`) status is configured for issues |
| `ALREADY_CLOSED` | 400 | Issue is already in the closed status |

> **ApplicationId scoping:** same as above — the issue's `ApplicationId` must match the caller's resolved ApplicationId.

---

### 3.7 Group Service (GroupSvc)

Base path: `/GroupSvc`

**New in v1.6 (2026-10-03).** Families and teams inside your application: an owner who adds their
spouse and parents, children who sign in with a PIN, and a licence the whole group shares.

**Every endpoint:**

- requires a signed-in user — `Authorization: Bearer {accessToken}`. With no token, or an expired one,
  the answer is a bare `401` with an empty body (no JSON envelope);
- works inside one application, resolved like everywhere else: from `X-Api-Key`, or from the
  `aApplicationId` query parameter when you send no key (`POST /GroupSvc` also takes `applicationId` in
  its body). Neither → `400 APPLICATION_ID_REQUIRED`; a value that disagrees with the key →
  `400 APP_ID_MISMATCH`;
- may be called with an installed-app public key (`pk_live_…` plus `X-Device-Id`,
  [Section 2.1.1](#211-installed-apps-public-keys)) as well as with a server key and secret;
- answers success in the usual envelope (`success`, `data`, `message`) and refusals in the standard
  error envelope ([Section 6.1](#61-standard-error-response-format)) — `success: false`, `error`,
  `message`, `statusCode`, `details` (always `null` here), `traceId`;
- reads route and query parameters with the `a` prefix (`aGroupId`, `aUserId`, `aLimit`,
  `aApplicationId`). JSON body field names are matched case-insensitively.

**Roles.** A group has exactly one `Owner` (whoever created it), at most one `SecondaryOwner`, and any
number of `Adult` and `Child` members. Role names are matched case-insensitively and a space or hyphen
is ignored, so `"secondary owner"` is accepted; responses always use the spellings above. The owner role
moves only by [hand-over](#post-groupsvc-agroupid-handover).

**Who may call what:**

| Endpoint | Owner | Secondary owner | Adult | Child | Not a member |
|----------|-------|-----------------|-------|-------|--------------|
| `GET /GroupSvc`, `GET /GroupSvc/relationships` | ✓ | ✓ | ✓ | ✓ | ✓ (any signed-in user) |
| `POST /GroupSvc` | ✓ | ✓ | ✓ | `403 CHILD_CANNOT_OWN_GROUP` | ✓ (any signed-in user who is not a child) |
| `POST …/members`, `PUT` / `DELETE …/members/{aUserId}`, `POST …/children`, `POST …/children/{aUserId}/reset-pin`, `POST …/handover` | ✓ | `403 NOT_GROUP_OWNER` | `403 NOT_GROUP_OWNER` | `403 NOT_GROUP_OWNER` | `404 GROUP_NOT_FOUND` |
| `GET …/sign-ins` | ✓ | ✓ | ✓ | `403 NOT_GROUP_OWNER` | `404 GROUP_NOT_FOUND` |

A group id that does not exist, belongs to another application, or that the caller is not a member of
always answers `404 GROUP_NOT_FOUND` ("No such group in this application.") — so a group's existence is
never confirmed to an outsider. The secondary owner has no extra rights until a hand-over makes them the
owner. A user can be in several groups of the same application and still use it on their own.

**A child never owns a group (2026-10-04, BRD-93).** For this rule a *child* is a user who is a `Child`
member of **any** group of your application, or any account that signs in with a PIN (`usesPin: true`).
A child cannot create a group (`POST /GroupSvc`), be named `SecondaryOwner` (added with that role, or
changed to it), or receive a hand-over — each answers `403 CHILD_CANNOT_OWN_GROUP` ("A child cannot own
a group."). In the other direction, someone who is the `Owner` or `SecondaryOwner` of a group cannot be
given the `Child` role (added or changed) in another group of the same application — also
`403 CHILD_CANNOT_OWN_GROUP`. Once every owner who has them as a `Child` changes their role to `Adult` and they sign in
with a password (a PIN account cannot become a password account through `GroupSvc`), they can create
their own family.

**Group error codes and their status** (one table for the whole service):

| Error Code | HTTP | When |
|------------|------|------|
| `GROUP_NOT_FOUND` | 404 | No such group in this application, or the caller is not in it |
| `NOT_GROUP_OWNER` | 403 | The caller is in the group but is not its owner (on `sign-ins`: the caller is a child) |
| `SECONDARY_OWNER_EXISTS` | 409 | Making someone `SecondaryOwner` when another member already is |
| `CHILD_CANNOT_OWN_GROUP` | 403 | A child (a `Child` in any group of the application, or a PIN account) would own a group: creating one, being named `SecondaryOwner`, or receiving a hand-over; or a group's owner / secondary owner would be given the `Child` role in another group of the application |
| `RELATIONSHIP_NOT_FOUND` | 400 | The relationship id or name is not on the application's active list |
| `GROUP_MEMBER_LIMIT` | 409 | Adding a member or a child would take the group past its licence's member limit |
| `ALREADY_GROUP_MEMBER` | 409 | The user is already in this group (the owner included) |
| `USER_NOT_FOUND` | 404 | No account has that `userId` / `email` (add), the user is not in the group (change, remove), or is not a child in it (reset-pin) |
| `EMAIL_EXISTS` | 409 | A child's email already belongs to an account |
| `INVALID_PASSWORD` | 400 | A child's PIN breaks the PIN rule; `message` is `PIN must be 4 to 8 digits` |
| `DECRYPTION_FAILED` | 400 | `encryptedPin` / `encryptedNewPin` is missing or could not be RSA-decrypted |
| `VALIDATION_ERROR` | 400 | The request is incomplete or not allowed — the `message` says which (see each endpoint) |
| `APPLICATION_NOT_CONFIGURED` | 500 | The application has no roles, so a child account cannot be given one |
| `APPLICATION_ID_REQUIRED` / `APP_ID_MISMATCH` | 400 | No application resolvable / query or body disagrees with the API key |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

**The PIN.** A child's PIN is **4 to 8 ASCII digits** (`^[0-9]{4,8}$`). It travels exactly like a
password: RSA-OAEP-SHA256 encrypted with the key from `GET /AuthSvc/public-key`, base64-encoded
([Section 2.4](#24-password-encryption-required)). It is stored where a password is stored, so signing
in, lockout, change and reset all treat it as the account's password; only the rule for a new one
differs.

#### GET /GroupSvc/relationships

The relationships your application offers, in display order. An administrator keeps this list per
application in AppManager; read it at start-up and offer it when adding a member. Only active entries
are returned. Any signed-in user may call it.

**Query Parameters:**
- `aApplicationId` (optional*): The application (*can be provided via X-Api-Key header instead)

```bash
curl -X GET "https://api.appmanager.com/GroupSvc/relationships" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "relationshipId": 1, "name": "Spouse", "displayOrder": 1 },
    { "relationshipId": 2, "name": "Child", "displayOrder": 2 },
    { "relationshipId": 3, "name": "Parent", "displayOrder": 3 }
  ],
  "message": null
}
```

An application whose list is empty answers `"data": []`; adding a member then fails with
`RELATIONSHIP_NOT_FOUND` until an administrator adds entries.

#### POST /GroupSvc

Creates a group in the calling application. The caller becomes its `Owner` and its first member. Any
signed-in user who is not a child may create groups, as many as they like; a child is refused with
`403 CHILD_CANNOT_OWN_GROUP` (see the rule above).

**Request Body:**
```json
{
  "groupName": "The Sharma family",
  "groupType": "Family"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `groupName` | Yes | 1 to 100 characters after trimming. Blank or longer → `400 VALIDATION_ERROR` |
| `groupType` | No | `Family` (the default when omitted or blank) or `Team`, case-insensitive. Anything else → `400 VALIDATION_ERROR` ("groupType must be Family or Team.") |
| `applicationId` | No* | The application, when no `X-Api-Key` is sent (*or `?aApplicationId=`; the body wins over the query) |

```bash
curl -X POST "https://api.appmanager.com/GroupSvc" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here" \
  -d '{ "groupName": "The Sharma family", "groupType": "Family" }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "groupId": 12,
    "applicationId": 1,
    "groupName": "The Sharma family",
    "groupType": "Family",
    "ownerUserId": 40,
    "secondaryOwnerUserId": null,
    "memberCount": 1,
    "memberLimit": null,
    "createdDate": "2026-10-03T09:12:44.512Z",
    "members": [
      {
        "userId": 40,
        "email": "ravi@example.com",
        "firstName": "Ravi",
        "lastName": "Sharma",
        "relationshipId": null,
        "relationship": null,
        "groupRole": "Owner",
        "usesPin": false,
        "addedDate": "2026-10-03T09:12:44.512Z"
      }
    ]
  },
  "message": "Group created"
}
```

The checks run in this order:

| # | Error Code | HTTP | When |
|---|------------|------|------|
| 1 | `VALIDATION_ERROR` | 400 | `groupName` blank or over 100 characters; `groupType` not `Family` / `Team` |
| 2 | `CHILD_CANNOT_OWN_GROUP` | 403 | The caller is a child: a `Child` in any group of this application, or a PIN account (2026-10-04) |

#### GET /GroupSvc

Lists the groups the signed-in user belongs to in the calling application — in any role, a child
included — oldest first, each with all its members. A user in no group gets `"data": []`.

**Query Parameters:**
- `aApplicationId` (optional*): The application (*can be provided via X-Api-Key header instead)

```bash
curl -X GET "https://api.appmanager.com/GroupSvc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "groupId": 12,
      "applicationId": 1,
      "groupName": "The Sharma family",
      "groupType": "Family",
      "ownerUserId": 40,
      "secondaryOwnerUserId": 41,
      "memberCount": 3,
      "memberLimit": 5,
      "createdDate": "2026-10-03T09:12:44.512Z",
      "members": [
        { "userId": 40, "email": "ravi@example.com", "firstName": "Ravi", "lastName": "Sharma", "relationshipId": null, "relationship": null, "groupRole": "Owner", "usesPin": false, "addedDate": "2026-10-03T09:12:44.512Z" },
        { "userId": 41, "email": "priya@example.com", "firstName": "Priya", "lastName": "Sharma", "relationshipId": 1, "relationship": "Spouse", "groupRole": "SecondaryOwner", "usesPin": false, "addedDate": "2026-10-03T09:14:02.100Z" },
        { "userId": 52, "email": "anya@example.com", "firstName": "Anya", "lastName": "Sharma", "relationshipId": 2, "relationship": "Child", "groupRole": "Child", "usesPin": true, "addedDate": "2026-10-03T09:20:31.877Z" }
      ]
    }
  ],
  "message": null
}
```

| Field | Description |
|-------|-------------|
| `groupId` | The group's id — the `aGroupId` of every other route |
| `applicationId` | The group's application (always the calling one) |
| `groupType` | `Family` or `Team` |
| `ownerUserId` | The owner's user id |
| `secondaryOwnerUserId` | The secondary owner's user id, or `null` |
| `memberCount` | Members including the owner |
| `memberLimit` | The most members the group's licence allows, or `null` for no limit — when the group holds no active, in-date licence, or when any licence it holds sets no member limit. With several limiting licences the highest applies |
| `createdDate` | UTC |
| `members[]` | Owner first, then the secondary owner, adults and children, each by first and last name |
| `members[].relationshipId` / `relationship` | The relationship from the application's list; `null` for the owner, and for a child created without one |
| `members[].groupRole` | `Owner`, `SecondaryOwner`, `Adult` or `Child` |
| `members[].usesPin` | `true` for an account that signs in with a PIN (a child created here) |
| `members[].addedDate` | UTC |

#### POST /GroupSvc/{aGroupId}/members

**Owner only.** Adds an **existing** user to the group straight away — there is no invitation for them
to accept. The person must already have an AppManager account (for example via
`POST /AuthSvc/register`). Returns **201** with the new membership.

**Request Body:**
```json
{
  "email": "priya@example.com",
  "relationship": "Spouse",
  "groupRole": "Adult"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `userId` | One of `userId` / `email` | The user to add, by id. When both are sent, `userId` wins |
| `email` | One of `userId` / `email` | The user to add, by email address |
| `relationshipId` | One of `relationshipId` / `relationship` | An id from `GET /GroupSvc/relationships`. When both are sent, the id wins |
| `relationship` | One of `relationshipId` / `relationship` | A name from that list, case-insensitive (`"spouse"` matches `Spouse`) |
| `groupRole` | Yes | `SecondaryOwner`, `Adult` or `Child`. `Owner` is refused — the owner role passes only by hand-over |

```bash
curl -X POST "https://api.appmanager.com/GroupSvc/12/members" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here" \
  -d '{ "email": "priya@example.com", "relationship": "Spouse", "groupRole": "Adult" }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "userId": 41,
    "email": "priya@example.com",
    "firstName": "Priya",
    "lastName": "Sharma",
    "relationshipId": 1,
    "relationship": "Spouse",
    "groupRole": "Adult",
    "usesPin": false,
    "addedDate": "2026-10-03T09:14:02.100Z"
  },
  "message": "Member added"
}
```

The checks run in this order, and the first that fails is the answer:

| # | Error Code | HTTP | When |
|---|------------|------|------|
| 1 | `GROUP_NOT_FOUND` / `NOT_GROUP_OWNER` | 404 / 403 | See the table at the top of this section |
| 2 | `USER_NOT_FOUND` | 404 | No account has that `userId` / `email`, or neither was sent |
| 3 | `ALREADY_GROUP_MEMBER` | 409 | The user is already in this group |
| 4 | `VALIDATION_ERROR` | 400 | `groupRole` missing, `Owner`, or not a role |
| 4 | `SECONDARY_OWNER_EXISTS` | 409 | `groupRole` is `SecondaryOwner` and the group already has one |
| 5 | `CHILD_CANNOT_OWN_GROUP` | 403 | `groupRole` is `SecondaryOwner` and the user is a child — a `Child` in any group of this application, or a PIN account; or `groupRole` is `Child` and the user is the `Owner` or `SecondaryOwner` of another group of this application (2026-10-04) |
| 6 | `VALIDATION_ERROR` | 400 | Neither `relationshipId` nor `relationship` was sent |
| 6 | `RELATIONSHIP_NOT_FOUND` | 400 | The relationship is not on the application's active list |
| 7 | `GROUP_MEMBER_LIMIT` | 409 | The group is already at its licence's member limit (the owner counts as one) |

> **Joining gives the member your application.** A member who holds no active role in your
> application is given its default role (the role mapped to `ApplicationUser`, else the first role) —
> the same one self-registration gives — so `GET /UserSvc/profile` and your own role checks recognise
> them. A member who already had a role keeps it and is given nothing; AppManager records which of the
> two it was, because it decides what happens if the owner's account is later deleted (see
> [Owner deletion](#owner-deletion-and-what-members-keep) below).

#### PUT /GroupSvc/{aGroupId}/members/{aUserId}

**Owner only.** Changes a member's relationship and / or role. A field left out (or `null`) keeps its
value; an empty body changes nothing and still answers 200. Returns the membership as it now is.

**Request Body:**
```json
{
  "groupRole": "SecondaryOwner"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `relationshipId` / `relationship` | No | The new relationship, by id or by name, as for an add |
| `groupRole` | No | `SecondaryOwner`, `Adult` or `Child` |

```bash
curl -X PUT "https://api.appmanager.com/GroupSvc/12/members/41" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here" \
  -d '{ "groupRole": "SecondaryOwner" }'
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": 41,
    "email": "priya@example.com",
    "firstName": "Priya",
    "lastName": "Sharma",
    "relationshipId": 1,
    "relationship": "Spouse",
    "groupRole": "SecondaryOwner",
    "usesPin": false,
    "addedDate": "2026-10-03T09:14:02.100Z"
  },
  "message": "Member updated"
}
```

Making a member `SecondaryOwner` sets the group's `secondaryOwnerUserId`; giving the secondary owner
another role (or removing them) clears it, which is how you free the slot for someone else.

The checks run in this order:

| # | Error Code | HTTP | When |
|---|------------|------|------|
| 1 | `GROUP_NOT_FOUND` / `NOT_GROUP_OWNER` | 404 / 403 | See the table at the top of this section |
| 2 | `USER_NOT_FOUND` | 404 | `aUserId` is not a member of this group |
| 3 | `VALIDATION_ERROR` | 400 | `aUserId` is the owner ("The owner's role changes only by handing the group over.") |
| 4 | `VALIDATION_ERROR` | 400 | `groupRole` is `Owner` / not a role |
| 4 | `SECONDARY_OWNER_EXISTS` | 409 | `groupRole` is `SecondaryOwner` and another member already is |
| 5 | `CHILD_CANNOT_OWN_GROUP` | 403 | `groupRole` changes the member to `SecondaryOwner` and they are a child — a `Child` in any group of this application (this one included), or a PIN account (2026-10-04). Change them to `Adult` first; a PIN account stays a child. Also when `groupRole` changes the member to `Child` and they are the `Owner` or `SecondaryOwner` of another group of this application (this group's own secondary owner may be made `Child` — that ends their secondary ownership) |
| 6 | `RELATIONSHIP_NOT_FOUND` | 400 | The new relationship is not on the list |

#### DELETE /GroupSvc/{aGroupId}/members/{aUserId}

**Owner only.** Removes a member from the group. No body. The member's account and their role in your
application are not touched — they simply stop being in this group (and stop getting the group's
licence).

```bash
curl -X DELETE "https://api.appmanager.com/GroupSvc/12/members/57" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here"
```

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Member removed"
}
```

| Error Code | HTTP | When |
|------------|------|------|
| `GROUP_NOT_FOUND` / `NOT_GROUP_OWNER` | 404 / 403 | See the table at the top of this section |
| `VALIDATION_ERROR` | 400 | `aUserId` is the owner ("The owner cannot be removed. Hand the group over first.") |
| `USER_NOT_FOUND` | 404 | `aUserId` is not a member — including a second `DELETE` of the same member |

#### POST /GroupSvc/{aGroupId}/children

**Owner only.** Creates a child's own account and adds it to the group with the `Child` role. The
account is an ordinary active application user with `usesPin: true`; it gets your application's
default role, exactly as a self-registered user would. Returns **201** with the child's membership.

**Request Body:**
```json
{
  "firstName": "Anya",
  "lastName": "Sharma",
  "email": "anya@example.com",
  "encryptedPin": "base64_rsa_encrypted_pin...",
  "relationship": "Child"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `firstName` | Yes | Not blank |
| `lastName` | Yes | Not blank |
| `email` | Yes | The child's own address — every account, a child's included, has a unique email, and the child signs in with it. Must be a valid address with a dotted domain |
| `encryptedPin` | Yes | The PIN (4 to 8 digits), RSA-OAEP-SHA256 encrypted and base64-encoded like a password. A plaintext `pin` field is ignored |
| `relationshipId` / `relationship` | No | Optional here (unlike adding a member); when sent it must be on the list |

```bash
curl -X POST "https://api.appmanager.com/GroupSvc/12/children" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here" \
  -d '{
    "firstName": "Anya",
    "lastName": "Sharma",
    "email": "anya@example.com",
    "encryptedPin": "base64_rsa_encrypted_pin...",
    "relationship": "Child"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "userId": 52,
    "email": "anya@example.com",
    "firstName": "Anya",
    "lastName": "Sharma",
    "relationshipId": 2,
    "relationship": "Child",
    "groupRole": "Child",
    "usesPin": true,
    "addedDate": "2026-10-03T09:20:31.877Z"
  },
  "message": "Child account created"
}
```

The checks run in this order:

| # | Error Code | HTTP | When |
|---|------------|------|------|
| 1 | `DECRYPTION_FAILED` | 400 | `encryptedPin` missing, blank or not decryptable. Checked **before** the group, so even a non-owner gets this first |
| 2 | `GROUP_NOT_FOUND` / `NOT_GROUP_OWNER` | 404 / 403 | See the table at the top of this section |
| 3 | `VALIDATION_ERROR` | 400 | `firstName` or `lastName` blank; `email` missing or not a valid address |
| 4 | `INVALID_PASSWORD` | 400 | The PIN is not 4 to 8 digits — `message`: `PIN must be 4 to 8 digits` |
| 5 | `EMAIL_EXISTS` | 409 | An account already has that email |
| 6 | `RELATIONSHIP_NOT_FOUND` | 400 | A relationship was sent and is not on the list |
| 7 | `GROUP_MEMBER_LIMIT` | 409 | The group is at its licence's member limit |
| 8 | `APPLICATION_NOT_CONFIGURED` | 500 | The application defines no roles |

#### Signing a child in

**The child signs in on the ordinary [`POST /AuthSvc/login`](#post-authsvc-login)** (or
`device-login`) with their email and the PIN in `encryptedPassword` — nothing new to call, from any
computer or phone:

```bash
curl -X POST "https://api.appmanager.com/AuthSvc/login" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here" \
  -d '{ "email": "anya@example.com", "encryptedPassword": "base64_rsa_encrypted_pin..." }'
```

The response is the normal login response (200, `"message": "Login successful"`), with the child's
`applicationRole` (your default role). The lockout is the password lockout: wrong PINs 1 to 4 answer
`401 INVALID_CREDENTIALS`; the **fifth** wrong PIN itself answers `423 ACCOUNT_LOCKED`, and every
sign-in — even with the right PIN — answers `423` for the next 15 minutes. When a child's account locks,
the owner and the secondary owner of every group the child is a `Child` in are emailed (child's name and
email, group name, and when the lock ends, UTC). The owner can lift the lock at once with
[reset-pin](#post-groupsvc-agroupid-children-auserid-reset-pin).

#### POST /GroupSvc/{aGroupId}/children/{aUserId}/reset-pin

**Owner only.** Sets a new PIN for a child in the group, lifts any lock (failed attempts back to 0)
and ends every session the child has, at once (2026-10-04): each refresh token is revoked
(`401 REVOKED_REFRESH_TOKEN` on the next refresh) and every access token already issued is refused
from the next call (`401`, as for an expired token — a bare `401` on `[Authorize]` endpoints such as
`GroupSvc`, the `401 UNAUTHORIZED` envelope elsewhere; `POST /AuthSvc/validate` answers `isValid: false`).
The child signs in again with the new PIN; the token that sign-in returns works normally.

**Request Body:**
```json
{
  "encryptedNewPin": "base64_rsa_encrypted_pin..."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `encryptedNewPin` | Yes | The new PIN (4 to 8 digits), RSA-OAEP-SHA256 encrypted, base64 |

```bash
curl -X POST "https://api.appmanager.com/GroupSvc/12/children/52/reset-pin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here" \
  -d '{ "encryptedNewPin": "base64_rsa_encrypted_pin..." }'
```

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "PIN reset"
}
```

| # | Error Code | HTTP | When |
|---|------------|------|------|
| 1 | `DECRYPTION_FAILED` | 400 | `encryptedNewPin` missing or not decryptable (checked before the group) |
| 2 | `GROUP_NOT_FOUND` / `NOT_GROUP_OWNER` | 404 / 403 | See the table at the top of this section — the secondary owner cannot reset a PIN |
| 3 | `USER_NOT_FOUND` | 404 | `aUserId` is not a member of the group with the `Child` role |
| 4 | `VALIDATION_ERROR` | 400 | The child signs in with a password, not a PIN (an existing account added with the `Child` role) — they change it themselves |
| 5 | `INVALID_PASSWORD` | 400 | The new PIN is not 4 to 8 digits — `PIN must be 4 to 8 digits` |

#### POST /GroupSvc/{aGroupId}/handover

**Owner only.** Hands the group to its secondary owner: they become `Owner`, the former owner stays in
the group as an `Adult`, and `secondaryOwnerUserId` becomes `null`. No body. Returns the group as it is
after the hand-over.

```bash
curl -X POST "https://api.appmanager.com/GroupSvc/12/handover" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here"
```

**Response (200):** the group object of [`GET /GroupSvc`](#get-groupsvc), with
`"ownerUserId": 41`, `"secondaryOwnerUserId": null`, member 41's `groupRole` `Owner` and member 40's
`Adult`; `"message": "Group handed over"`.

The checks run in this order:

| # | Error Code | HTTP | When |
|---|------------|------|------|
| 1 | `GROUP_NOT_FOUND` / `NOT_GROUP_OWNER` | 404 / 403 | See the table at the top of this section — the secondary owner cannot take the group; the owner must hand it over |
| 2 | `VALIDATION_ERROR` | 400 | The group has no secondary owner ("Give a member the SecondaryOwner role first.") |
| 3 | `CHILD_CANNOT_OWN_GROUP` | 403 | The secondary owner is a child — they have since become a `Child` in a group of this application, or sign in with a PIN (2026-10-04). Nothing changes |
| 4 | `VALIDATION_ERROR` | 400 | The group changed during the hand-over (read it again and retry) |

From then on the former owner gets `403 NOT_GROUP_OWNER` on the owner-only endpoints.

#### GET /GroupSvc/{aGroupId}/sign-ins

**Owner, secondary owner and adults.** When and from where each child in the group signed in to your
application, newest first, read from the device registry.

**Query Parameters:**
- `aLimit` (optional): the most sign-ins to return, default `100`; values are clamped to 1–500
- `aApplicationId` (optional*): The application (*can be provided via X-Api-Key header instead)

```bash
curl -X GET "https://api.appmanager.com/GroupSvc/12/sign-ins?aLimit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Api-Key: ak_live_your_api_key_here" \
  -H "X-Api-Secret: your_api_secret_here"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": 52,
      "email": "anya@example.com",
      "firstName": "Anya",
      "lastName": "Sharma",
      "loginDate": "2026-10-03T17:02:11.304Z",
      "ipAddress": "203.0.113.24",
      "country": null,
      "city": null,
      "deviceName": "Anya's tablet",
      "deviceType": "Tablet",
      "platform": "Android",
      "browser": null
    }
  ],
  "message": null
}
```

`loginDate` is UTC. `country` and `city` stay `null` until a location provider is configured;
`deviceName` is what your app sent in `deviceInfo`, or `null`. A group with no children, or children who
have not signed in, gives `"data": []`.

| Error Code | HTTP | When |
|------------|------|------|
| `GROUP_NOT_FOUND` | 404 | No such group in this application, or the caller is not in it |
| `NOT_GROUP_OWNER` | 403 | The caller is a child ("Only the owner, the secondary owner and adults can see when children signed in.") |

#### Group licences

A licence can be held by a group (an administrator attaches it in AppManager; there is no external
endpoint for this). While it is `Active` and in date:

- every member gets its features — `FeatureSvc` merges it with the member's own licences
  ([Section 3.4](#34-feature-service-featuresvc));
- `POST /LicenseSvc/validate` answers with it for a member who has no usable licence of their own, and
  `GET /LicenseSvc` lists it to every member ([Section 3.2](#32-license-service-licensesvc));
- its licence type's member limit (`MaxMembers`) caps the group, owner included: `memberLimit` on the
  group, `409 GROUP_MEMBER_LIMIT` on the add or child that would pass it. Members already in a group
  over a limit set later are not removed.

- `POST /AuthSvc/login`'s `activeLicense` (and `device-login`'s) reports it for a
  member with no usable licence of their own — the same licence `validate` chooses (2026-10-04).

#### Owner deletion and what members keep

When an administrator processes the owner's account deletion (`POST /UserSvc/delete-request`, then
approval in AppManager — updated 2026-10-04):

1. **Every group the owner owns is deleted**, even when it has a secondary owner — the secondary owner
   does not inherit it. To keep a group, the owner hands it over before deleting their account. The
   owner is also removed from groups they were only a member of.
2. **A member keeps an application role they held before joining** (for example, they had signed up for
   your app themselves) — it is never ended by this.
3. **A role the group gave them** ends only when nothing else reaches the application: no other group of
   it they are in, and no licence of their own there. When something else does, they keep it, and the
   "given by a group" mark moves onto their remaining group(s), so the role still ends when the last of
   those goes.
4. **A member left with no way into any AppManager application is soft-deleted** and signed out at
   once — typically a child who was only in the deleted group. Their refresh tokens are revoked, and an
   access token already issued is refused (`401`) instead of running to its expiry (2026-10-04): at
   once on `POST /AuthSvc/validate`, and within 30 seconds on the other endpoints, because the deletion
   is processed in AppManager and each API server re-reads a user's cut-off at most every 30 seconds.
   Their next sign-in answers `401 INVALID_CREDENTIALS`.

`GET /GroupSvc` simply stops listing the deleted group for its former members. `POST /UserSvc/data-export`
output includes a `groups` section.

---

## 4. Code Examples (.NET/C#)

This section provides comprehensive .NET/C# code examples for integrating with the App Manager API.

### 4.1 API Client Implementation

```csharp
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AppManager.Client;

/// <summary>
/// HTTP client for interacting with the App Manager API.
/// Handles authentication, token refresh, and all API operations.
/// </summary>
public class AppManagerClient : IDisposable
{
    private readonly HttpClient objHttpClient;
    private readonly JsonSerializerOptions objJsonOptions;
    private string? objAccessToken;
    private string? objRefreshToken;
    private DateTime? objTokenExpiresAt;
    private string? objRsaPublicKey;

    /// <summary>
    /// Creates a client. Supply the application's API key and secret: several endpoints resolve the
    /// application from these headers alone, and they are what scopes the profile and the
    /// cross-application checks. Without them those calls answer 400 APPLICATION_ID_REQUIRED.
    /// </summary>
    public AppManagerClient(
        string aBaseUrl = "https://api.appmanager.com",
        string? aApiKey = null,
        string? aApiSecret = null)
    {
        objHttpClient = new HttpClient { BaseAddress = new Uri(aBaseUrl) };
        objHttpClient.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));

        if (!string.IsNullOrEmpty(aApiKey))
            objHttpClient.DefaultRequestHeaders.Add("X-Api-Key", aApiKey);
        if (!string.IsNullOrEmpty(aApiSecret))
            objHttpClient.DefaultRequestHeaders.Add("X-Api-Secret", aApiSecret);

        objJsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }

    public bool IsAuthenticated => !string.IsNullOrEmpty(objAccessToken);

    #region Password Encryption

    /// <summary>
    /// Fetches and caches the server's RSA public key for password encryption.
    /// </summary>
    private async Task EnsurePublicKeyAsync()
    {
        if (!string.IsNullOrEmpty(objRsaPublicKey)) return;

        var vResponse = await objHttpClient.GetAsync("/AuthSvc/public-key");
        var vResult = await vResponse.Content.ReadFromJsonAsync<ApiResponse<PublicKeyData>>(objJsonOptions);
        objRsaPublicKey = vResult?.Data?.PublicKey
            ?? throw new AppManagerException("KEY_FETCH_FAILED", "Failed to fetch server public key");
    }

    /// <summary>
    /// Encrypts a password using the server's RSA public key (RSA-OAEP-SHA256).
    /// </summary>
    private string EncryptPassword(string aPassword)
    {
        using var vRsa = System.Security.Cryptography.RSA.Create();
        vRsa.ImportFromPem(objRsaPublicKey);
        var vEncryptedBytes = vRsa.Encrypt(
            System.Text.Encoding.UTF8.GetBytes(aPassword),
            System.Security.Cryptography.RSAEncryptionPadding.OaepSHA256);
        return Convert.ToBase64String(vEncryptedBytes);
    }

    #endregion

    #region Authentication

    /// <summary>
    /// Authenticates a user and stores the access and refresh tokens.
    /// Passwords are RSA-encrypted before transmission.
    /// </summary>
    public async Task<AuthResponseData> LoginAsync(string aEmail, string aPassword)
    {
        await EnsurePublicKeyAsync();
        var vEncryptedPassword = EncryptPassword(aPassword);

        var vResponse = await objHttpClient.PostAsJsonAsync("/AuthSvc/login",
            new { email = aEmail, encryptedPassword = vEncryptedPassword }, objJsonOptions);

        var vResult = await vResponse.Content.ReadFromJsonAsync<ApiResponse<AuthResponseData>>(objJsonOptions);

        if (vResult?.Success == true && vResult.Data != null)
        {
            SetTokens(vResult.Data.AccessToken, vResult.Data.RefreshToken, vResult.Data.TokenExpiresAt);
            return vResult.Data;
        }

        throw new AppManagerException(vResult?.Error ?? "LOGIN_FAILED", vResult?.Message ?? "Login failed");
    }

    /// <summary>
    /// Registers a new user account.
    /// </summary>
    public async Task<AuthResponseData> RegisterAsync(RegisterRequest aRequest)
    {
        var vResponse = await objHttpClient.PostAsJsonAsync("/AuthSvc/register", aRequest, objJsonOptions);
        var vResult = await vResponse.Content.ReadFromJsonAsync<ApiResponse<AuthResponseData>>(objJsonOptions);

        if (vResult?.Success == true && vResult.Data != null)
        {
            SetTokens(vResult.Data.AccessToken, vResult.Data.RefreshToken, vResult.Data.TokenExpiresAt);
            return vResult.Data;
        }

        throw new AppManagerException(vResult?.Error ?? "REGISTER_FAILED", vResult?.Message ?? "Registration failed");
    }

    /// <summary>
    /// Validates the current access token.
    /// </summary>
    public async Task<ValidateTokenResponse> ValidateTokenAsync()
    {
        if (string.IsNullOrEmpty(objAccessToken))
            throw new AppManagerException("NOT_AUTHENTICATED", "Not authenticated");

        var vResponse = await objHttpClient.PostAsJsonAsync("/AuthSvc/validate",
            new { accessToken = objAccessToken }, objJsonOptions);

        var vResult = await vResponse.Content.ReadFromJsonAsync<ApiResponse<ValidateTokenResponse>>(objJsonOptions);
        return vResult?.Data ?? new ValidateTokenResponse { IsValid = false };
    }

    /// <summary>
    /// Logs out the current user.
    /// </summary>
    public async Task LogoutAsync(bool aLogoutAllDevices = false)
    {
        if (!string.IsNullOrEmpty(objRefreshToken))
        {
            await AuthenticatedPostAsync<object>("/AuthSvc/logout",
                new { refreshToken = objRefreshToken, logoutAllDevices = aLogoutAllDevices });
        }

        ClearTokens();
    }

    /// <summary>
    /// Initiates a password reset request.
    /// </summary>
    public async Task ForgotPasswordAsync(string aEmail)
    {
        var vResponse = await objHttpClient.PostAsJsonAsync("/AuthSvc/forgot-password",
            new { email = aEmail }, objJsonOptions);

        var vResult = await vResponse.Content.ReadFromJsonAsync<ApiResponse<object>>(objJsonOptions);

        if (vResult?.Success != true)
            throw new AppManagerException(vResult?.Error ?? "FORGOT_PASSWORD_FAILED", vResult?.Message ?? "Request failed");
    }

    /// <summary>
    /// Resets a user's password using a reset token.
    /// Password is RSA-encrypted before transmission.
    /// </summary>
    public async Task ResetPasswordAsync(string aToken, string aNewPassword)
    {
        await EnsurePublicKeyAsync();
        var vEncryptedNewPassword = EncryptPassword(aNewPassword);

        var vResponse = await objHttpClient.PostAsJsonAsync("/AuthSvc/reset-password",
            new { token = aToken, encryptedNewPassword = vEncryptedNewPassword }, objJsonOptions);

        var vResult = await vResponse.Content.ReadFromJsonAsync<ApiResponse<object>>(objJsonOptions);

        if (vResult?.Success != true)
            throw new AppManagerException(vResult?.Error ?? "RESET_PASSWORD_FAILED", vResult?.Message ?? "Reset failed");
    }

    #endregion

    #region License Operations

    /// <summary>
    /// Gets available license types. No user token is needed, but an application must still be
    /// resolvable: either construct the client with an API key and secret, or pass aApplicationId.
    /// </summary>
    public async Task<List<LicenseTypeDto>> GetLicenseTypesAsync(int? aApplicationId = null, string? aCurrency = null)
    {
        var vQueryParams = new List<string>();
        if (aApplicationId.HasValue)
            vQueryParams.Add($"aApplicationId={aApplicationId.Value}");
        if (!string.IsNullOrEmpty(aCurrency))
            vQueryParams.Add($"aCurrency={Uri.EscapeDataString(aCurrency)}");

        var vUrl = "/LicenseSvc/types";
        if (vQueryParams.Count > 0)
            vUrl += "?" + string.Join("&", vQueryParams);

        var vResponse = await objHttpClient.GetAsync(vUrl);
        var vResult = await vResponse.Content.ReadFromJsonAsync<ApiResponse<List<LicenseTypeDto>>>(objJsonOptions);
        return vResult?.Data ?? new List<LicenseTypeDto>();
    }

    /// <summary>
    /// Gets the current user's licenses.
    /// </summary>
    public async Task<List<LicenseResponse>> GetLicensesAsync()
    {
        return await AuthenticatedGetAsync<List<LicenseResponse>>("/LicenseSvc") ?? new List<LicenseResponse>();
    }

    /// <summary>
    /// Validates the current user's license.
    /// </summary>
    public async Task<LicenseValidationResponse> ValidateLicenseAsync()
    {
        return await AuthenticatedPostAsync<LicenseValidationResponse>("/LicenseSvc/validate")
            ?? new LicenseValidationResponse { IsValid = false };
    }

    /// <summary>
    /// Consumes quantity from a quantity-based license.
    /// </summary>
    public async Task<ConsumeQuantityResponse> ConsumeQuantityAsync(int aLicenseId, int aQuantity, string? aReference = null)
    {
        return await AuthenticatedPostAsync<ConsumeQuantityResponse>(
            $"/LicenseSvc/{aLicenseId}/consume",
            new { quantity = aQuantity, reference = aReference })
            ?? throw new AppManagerException("CONSUME_FAILED", "Failed to consume quantity");
    }

    /// <summary>
    /// Deactivates a device from a license.
    /// </summary>
    public async Task DeactivateDeviceAsync(int aLicenseId, int aDeviceId)
    {
        await AuthenticatedDeleteAsync($"/LicenseSvc/{aLicenseId}/devices/{aDeviceId}");
    }

    #endregion

    #region User Operations

    /// <summary>
    /// Gets the current user's profile. When the HttpClient is configured to send the
    /// X-Api-Key / X-Api-Secret headers (recommended), the server scopes the returned
    /// <see cref="UserProfileResponse.ApplicationRole"/> to the calling app and returns
    /// <c>NO_APP_ACCESS</c> (403) if the user has no role for that app. Without API-key
    /// headers, the server returns the user's global profile (no applicationRole scoping).
    /// </summary>
    public async Task<UserProfileResponse> GetProfileAsync()
    {
        return await AuthenticatedGetAsync<UserProfileResponse>("/UserSvc/profile")
            ?? throw new AppManagerException("PROFILE_NOT_FOUND", "Profile not found");
    }

    /// <summary>
    /// Updates the current user's profile.
    /// </summary>
    public async Task UpdateProfileAsync(UpdateProfileRequest aRequest)
    {
        await AuthenticatedPutAsync("/UserSvc/profile", aRequest);
    }

    /// <summary>
    /// Gets the current user's addresses.
    /// </summary>
    public async Task<List<AddressResponse>> GetAddressesAsync()
    {
        return await AuthenticatedGetAsync<List<AddressResponse>>("/UserSvc/addresses")
            ?? new List<AddressResponse>();
    }

    /// <summary>
    /// Creates or updates the address of the request's AddressType. The endpoint returns no body,
    /// so call GetAddressesAsync afterwards if you need the saved row's AddressId.
    /// </summary>
    public async Task SaveAddressAsync(UpdateAddressRequest aRequest)
    {
        await AuthenticatedPostAsync<object>("/UserSvc/addresses", aRequest);
    }

    /// <summary>
    /// Changes the current user's password. Both passwords are RSA-encrypted
    /// with the server's public key before transmission (v1.3+ requirement).
    /// </summary>
    public async Task ChangePasswordAsync(string aCurrentPassword, string aNewPassword)
    {
        await EnsurePublicKeyAsync();
        var vEncryptedCurrentPassword = EncryptPassword(aCurrentPassword);
        var vEncryptedNewPassword = EncryptPassword(aNewPassword);

        await AuthenticatedPostAsync<object>("/UserSvc/change-password",
            new { encryptedCurrentPassword = vEncryptedCurrentPassword, encryptedNewPassword = vEncryptedNewPassword });
    }

    /// <summary>
    /// Submits a GDPR data export request.
    /// </summary>
    public async Task<DataExportResponse> RequestDataExportAsync()
    {
        return await AuthenticatedPostAsync<DataExportResponse>("/UserSvc/data-export")
            ?? throw new AppManagerException("EXPORT_FAILED", "Failed to request data export");
    }

    /// <summary>
    /// Submits a GDPR account deletion request.
    /// </summary>
    public async Task RequestAccountDeletionAsync(string aConfirmEmail)
    {
        await AuthenticatedPostAsync<object>("/UserSvc/delete-request",
            new { confirmEmail = aConfirmEmail });
    }

    #endregion

    #region Feature Operations

    /// <summary>
    /// Gets all features with access status for the current user.
    /// </summary>
    public async Task<List<FeatureAccessResponse>> GetFeaturesAsync(int? aApplicationId = null)
    {
        var vUrl = "/FeatureSvc";
        if (aApplicationId.HasValue)
            vUrl += $"?aApplicationId={aApplicationId.Value}";

        return await AuthenticatedGetAsync<List<FeatureAccessResponse>>(vUrl)
            ?? new List<FeatureAccessResponse>();
    }

    /// <summary>
    /// Checks access to a specific feature by code.
    /// </summary>
    public async Task<FeatureAccessResponse> CheckFeatureAccessAsync(string aFeatureCode)
    {
        return await AuthenticatedGetAsync<FeatureAccessResponse>($"/FeatureSvc/{aFeatureCode}")
            ?? new FeatureAccessResponse { FeatureCode = aFeatureCode, HasAccess = false };
    }

    /// <summary>
    /// Checks the status of a feature flag.
    /// </summary>
    public async Task<FeatureAccessResponse> CheckFeatureFlagAsync(string aFlagCode)
    {
        return await AuthenticatedGetAsync<FeatureAccessResponse>($"/FeatureSvc/flags/{aFlagCode}")
            ?? new FeatureAccessResponse { FeatureCode = aFlagCode, HasAccess = false };
    }

    #endregion

    #region Payment Operations

    /// <summary>
    /// Gets the user's transaction history.
    /// </summary>
    public async Task<PagedResult<TransactionResponse>> GetTransactionsAsync(int aPage = 1, int aPageSize = 20)
    {
        return await AuthenticatedGetAsync<PagedResult<TransactionResponse>>(
            $"/PaymentSvc/transactions?aPage={aPage}&aPageSize={aPageSize}")
            ?? new PagedResult<TransactionResponse>();
    }

    /// <summary>
    /// Gets a specific transaction by ID.
    /// </summary>
    public async Task<TransactionResponse> GetTransactionAsync(int aTransactionId)
    {
        return await AuthenticatedGetAsync<TransactionResponse>($"/PaymentSvc/transactions/{aTransactionId}")
            ?? throw new AppManagerException("TRANSACTION_NOT_FOUND", "Transaction not found");
    }

    /// <summary>
    /// Gets the user's invoices.
    /// </summary>
    public async Task<PagedResult<InvoiceResponse>> GetInvoicesAsync(int aPage = 1, int aPageSize = 20)
    {
        return await AuthenticatedGetAsync<PagedResult<InvoiceResponse>>(
            $"/PaymentSvc/invoices?aPage={aPage}&aPageSize={aPageSize}")
            ?? new PagedResult<InvoiceResponse>();
    }

    /// <summary>
    /// Gets a specific invoice by ID.
    /// </summary>
    public async Task<InvoiceDetailResponse> GetInvoiceAsync(int aInvoiceId)
    {
        return await AuthenticatedGetAsync<InvoiceDetailResponse>($"/PaymentSvc/invoices/{aInvoiceId}")
            ?? throw new AppManagerException("INVOICE_NOT_FOUND", "Invoice not found");
    }

    /// <summary>
    /// Downloads an invoice as PDF.
    /// </summary>
    public async Task<byte[]> DownloadInvoiceAsync(int aInvoiceId)
    {
        await EnsureAuthenticatedAsync();
        var vResponse = await objHttpClient.GetAsync($"/PaymentSvc/invoices/{aInvoiceId}/download");

        if (!vResponse.IsSuccessStatusCode)
            throw new AppManagerException("DOWNLOAD_FAILED", "Failed to download invoice");

        return await vResponse.Content.ReadAsByteArrayAsync();
    }

    /// <summary>
    /// Gets the user's active subscriptions.
    /// </summary>
    public async Task<List<SubscriptionResponse>> GetSubscriptionsAsync()
    {
        return await AuthenticatedGetAsync<List<SubscriptionResponse>>("/PaymentSvc/subscriptions")
            ?? new List<SubscriptionResponse>();
    }

    /// <summary>
    /// Cancels a subscription. Throws AppManagerException with ErrorCode CANCEL_REFUSED when the
    /// subscription exists but the cancellation itself was refused — the message carries the reason.
    /// </summary>
    public async Task CancelSubscriptionAsync(int aSubscriptionId, bool aCancelImmediately = false, string? aReason = null)
    {
        await AuthenticatedPostAsync<object>($"/PaymentSvc/subscriptions/{aSubscriptionId}/cancel",
            new { cancelImmediately = aCancelImmediately, reason = aReason });
    }

    /// <summary>
    /// Resolves the payment provider that settles a region, and reports whether it can be
    /// dispatched to. A successful call means the routing decision was made, not that a payment was
    /// taken — check IsProviderReady before sending the user to checkout.
    /// </summary>
    public async Task<RoutePaymentResponse> RoutePaymentAsync(RoutePaymentRequest aRequest)
    {
        return await AuthenticatedPostAsync<RoutePaymentResponse>("/PaymentSvc/payments/route", aRequest)
            ?? throw new AppManagerException("ROUTE_FAILED", "Failed to route the payment");
    }

    /// <summary>
    /// Validates a promo code. The endpoint is anonymous — it needs only the API key headers — so
    /// this does not go through EnsureAuthenticatedAsync and works before the user has signed in.
    /// </summary>
    public async Task<PromoCodeResponse> ValidatePromoCodeAsync(string aCode)
    {
        var vResponse = await objHttpClient.PostAsJsonAsync("/PaymentSvc/promo-codes/validate",
            new { code = aCode }, objJsonOptions);

        return await HandleResponseAsync<PromoCodeResponse>(vResponse)
            ?? throw new AppManagerException("PROMO_CODE_INVALID", "Invalid promo code");
    }

    #endregion

    #region Issue Operations

    /// <summary>
    /// Gets all issues for the current user.
    /// </summary>
    public async Task<List<IssueResponse>> GetIssuesAsync(int? aApplicationId = null, string? aStatus = null)
    {
        var vUrl = "/IssueSvc";
        var vQueryParams = new List<string>();

        if (aApplicationId.HasValue)
            vQueryParams.Add($"aApplicationId={aApplicationId.Value}");
        if (!string.IsNullOrEmpty(aStatus))
            vQueryParams.Add($"aStatus={aStatus}");

        if (vQueryParams.Count > 0)
            vUrl += "?" + string.Join("&", vQueryParams);

        return await AuthenticatedGetAsync<List<IssueResponse>>(vUrl)
            ?? new List<IssueResponse>();
    }

    /// <summary>
    /// Gets a specific issue by ID with comments.
    /// </summary>
    public async Task<IssueDetailResponse> GetIssueAsync(int aIssueId)
    {
        return await AuthenticatedGetAsync<IssueDetailResponse>($"/IssueSvc/{aIssueId}")
            ?? throw new AppManagerException("ISSUE_NOT_FOUND", "Issue not found");
    }

    /// <summary>
    /// Creates a new support issue.
    /// </summary>
    public async Task<IssueResponse> CreateIssueAsync(CreateIssueRequest aRequest)
    {
        return await AuthenticatedPostAsync<IssueResponse>("/IssueSvc", aRequest)
            ?? throw new AppManagerException("CREATE_FAILED", "Failed to create issue");
    }

    /// <summary>
    /// Adds a comment to an issue.
    /// </summary>
    public async Task AddCommentAsync(int aIssueId, string aComment)
    {
        await AuthenticatedPostAsync<object>($"/IssueSvc/{aIssueId}/comments",
            new { comment = aComment });
    }

    /// <summary>
    /// Closes an issue.
    /// </summary>
    public async Task CloseIssueAsync(int aIssueId)
    {
        await AuthenticatedPostAsync<object>($"/IssueSvc/{aIssueId}/close");
    }

    #endregion

    #region Group Operations (v1.6)

    /// <summary>
    /// Gets the application's relationship list, to offer when adding a member.
    /// </summary>
    public async Task<List<GroupRelationshipResponse>> GetGroupRelationshipsAsync()
    {
        return await AuthenticatedGetAsync<List<GroupRelationshipResponse>>("/GroupSvc/relationships")
            ?? new List<GroupRelationshipResponse>();
    }

    /// <summary>
    /// Gets the groups the signed-in user belongs to in this application, with their members.
    /// </summary>
    public async Task<List<GroupResponse>> GetGroupsAsync()
    {
        return await AuthenticatedGetAsync<List<GroupResponse>>("/GroupSvc")
            ?? new List<GroupResponse>();
    }

    /// <summary>
    /// Creates a group; the signed-in user becomes its owner. aGroupType is "Family" or "Team".
    /// </summary>
    public async Task<GroupResponse> CreateGroupAsync(string aGroupName, string aGroupType = "Family")
    {
        return await AuthenticatedPostAsync<GroupResponse>("/GroupSvc",
            new CreateGroupRequest { GroupName = aGroupName, GroupType = aGroupType })
            ?? throw new AppManagerException("CREATE_FAILED", "Failed to create group");
    }

    /// <summary>
    /// Adds an existing user to a group (owner only). Name the user by UserId or Email, the
    /// relationship by RelationshipId or Relationship, and give GroupRole SecondaryOwner, Adult or Child.
    /// </summary>
    public async Task<GroupMemberResponse> AddGroupMemberAsync(int aGroupId, AddGroupMemberRequest aRequest)
    {
        return await AuthenticatedPostAsync<GroupMemberResponse>($"/GroupSvc/{aGroupId}/members", aRequest)
            ?? throw new AppManagerException("ADD_MEMBER_FAILED", "Failed to add member");
    }

    /// <summary>
    /// Changes a member's relationship and / or role (owner only); a null field keeps its value.
    /// </summary>
    public async Task<GroupMemberResponse> UpdateGroupMemberAsync(int aGroupId, int aUserId, UpdateGroupMemberRequest aRequest)
    {
        return await AuthenticatedPutAsync<GroupMemberResponse>($"/GroupSvc/{aGroupId}/members/{aUserId}", aRequest)
            ?? throw new AppManagerException("UPDATE_MEMBER_FAILED", "Failed to update member");
    }

    /// <summary>
    /// Removes a member from a group (owner only). The owner cannot be removed.
    /// </summary>
    public async Task RemoveGroupMemberAsync(int aGroupId, int aUserId)
    {
        await AuthenticatedDeleteAsync($"/GroupSvc/{aGroupId}/members/{aUserId}");
    }

    /// <summary>
    /// Creates a child's account in a group (owner only). The PIN (4 to 8 digits) is RSA-encrypted
    /// exactly like a password before it is sent.
    /// </summary>
    public async Task<GroupMemberResponse> CreateGroupChildAsync(int aGroupId, string aFirstName, string aLastName,
        string aEmail, string aPin, string? aRelationship = null)
    {
        await EnsurePublicKeyAsync();
        var vRequest = new CreateGroupChildRequest
        {
            FirstName = aFirstName,
            LastName = aLastName,
            Email = aEmail,
            EncryptedPin = EncryptPassword(aPin),
            Relationship = aRelationship
        };

        return await AuthenticatedPostAsync<GroupMemberResponse>($"/GroupSvc/{aGroupId}/children", vRequest)
            ?? throw new AppManagerException("CREATE_CHILD_FAILED", "Failed to create child account");
    }

    /// <summary>
    /// Sets a child's new PIN (owner only); unlocks the account and revokes the child's refresh tokens.
    /// </summary>
    public async Task ResetGroupChildPinAsync(int aGroupId, int aChildUserId, string aNewPin)
    {
        await EnsurePublicKeyAsync();
        await AuthenticatedPostAsync<object>($"/GroupSvc/{aGroupId}/children/{aChildUserId}/reset-pin",
            new ResetGroupChildPinRequest { EncryptedNewPin = EncryptPassword(aNewPin) });
    }

    /// <summary>
    /// Hands the group to its secondary owner (owner only); the caller stays as an Adult.
    /// </summary>
    public async Task<GroupResponse> HandOverGroupAsync(int aGroupId)
    {
        return await AuthenticatedPostAsync<GroupResponse>($"/GroupSvc/{aGroupId}/handover")
            ?? throw new AppManagerException("HANDOVER_FAILED", "Failed to hand the group over");
    }

    /// <summary>
    /// Gets when and from where each child in the group signed in, newest first
    /// (owner, secondary owner and adults). aLimit is clamped to 1..500 by the server.
    /// </summary>
    public async Task<List<GroupChildSignInResponse>> GetGroupChildSignInsAsync(int aGroupId, int aLimit = 100)
    {
        return await AuthenticatedGetAsync<List<GroupChildSignInResponse>>($"/GroupSvc/{aGroupId}/sign-ins?aLimit={aLimit}")
            ?? new List<GroupChildSignInResponse>();
    }

    #endregion

    #region Private Methods

    private void SetTokens(string? aAccess, string? aRefresh, DateTime? aExpiresAt)
    {
        objAccessToken = aAccess;
        objRefreshToken = aRefresh;
        objTokenExpiresAt = aExpiresAt;
        SetAuthHeader();
    }

    private void ClearTokens()
    {
        objAccessToken = null;
        objRefreshToken = null;
        objTokenExpiresAt = null;
        objHttpClient.DefaultRequestHeaders.Authorization = null;
    }

    private void SetAuthHeader()
    {
        if (!string.IsNullOrEmpty(objAccessToken))
        {
            objHttpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", objAccessToken);
        }
    }

    private async Task EnsureAuthenticatedAsync()
    {
        if (string.IsNullOrEmpty(objAccessToken))
            throw new AppManagerException("NOT_AUTHENTICATED", "Not authenticated");

        // Check if token is about to expire and refresh if needed
        if (objTokenExpiresAt.HasValue && objTokenExpiresAt.Value <= DateTime.UtcNow.AddMinutes(5))
        {
            await RefreshTokensAsync();
        }
    }

    private async Task RefreshTokensAsync()
    {
        if (string.IsNullOrEmpty(objRefreshToken))
            throw new AppManagerException("NO_REFRESH_TOKEN", "No refresh token available");

        var vResponse = await objHttpClient.PostAsJsonAsync("/AuthSvc/refresh",
            new { refreshToken = objRefreshToken }, objJsonOptions);

        var vResult = await vResponse.Content.ReadFromJsonAsync<ApiResponse<TokenRefreshResponse>>(objJsonOptions);

        if (vResult?.Success == true && vResult.Data != null)
        {
            SetTokens(vResult.Data.AccessToken, vResult.Data.RefreshToken, vResult.Data.ExpiresAt);
        }
        else
        {
            ClearTokens();
            throw new AppManagerException("SESSION_EXPIRED", "Session expired. Please login again.");
        }
    }

    private async Task<T?> AuthenticatedGetAsync<T>(string aPath)
    {
        await EnsureAuthenticatedAsync();
        var vResponse = await objHttpClient.GetAsync(aPath);
        return await HandleResponseAsync<T>(vResponse);
    }

    private async Task<T?> AuthenticatedPostAsync<T>(string aPath, object? aBody = null)
    {
        await EnsureAuthenticatedAsync();
        var vResponse = await objHttpClient.PostAsJsonAsync(aPath, aBody ?? new { }, objJsonOptions);
        return await HandleResponseAsync<T>(vResponse);
    }

    private async Task AuthenticatedPutAsync(string aPath, object aBody)
    {
        await EnsureAuthenticatedAsync();
        var vResponse = await objHttpClient.PutAsJsonAsync(aPath, aBody, objJsonOptions);
        await HandleResponseAsync<object>(vResponse);
    }

    private async Task<T?> AuthenticatedPutAsync<T>(string aPath, object aBody)
    {
        await EnsureAuthenticatedAsync();
        var vResponse = await objHttpClient.PutAsJsonAsync(aPath, aBody, objJsonOptions);
        return await HandleResponseAsync<T>(vResponse);
    }

    private async Task AuthenticatedDeleteAsync(string aPath)
    {
        await EnsureAuthenticatedAsync();
        var vResponse = await objHttpClient.DeleteAsync(aPath);
        await HandleResponseAsync<object>(vResponse);
    }

    private async Task<T?> HandleResponseAsync<T>(HttpResponseMessage aResponse)
    {
        if (aResponse.StatusCode == System.Net.HttpStatusCode.Unauthorized && !string.IsNullOrEmpty(objRefreshToken))
        {
            await RefreshTokensAsync();
            // Note: In production, you would want to retry the original request here
        }

        var vResult = await aResponse.Content.ReadFromJsonAsync<ApiResponse<T>>(objJsonOptions);

        if (vResult?.Success != true && !string.IsNullOrEmpty(vResult?.Error))
        {
            throw new AppManagerException(vResult.Error, vResult.Message ?? "Request failed");
        }

        return vResult != null ? vResult.Data : default;
    }

    public void Dispose() => objHttpClient.Dispose();

    #endregion
}
```

### 4.2 Model Classes

```csharp
namespace AppManager.Client;

// API Response wrapper
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public string? Error { get; set; }
    public int? StatusCode { get; set; }
}

// Paginated results
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

// Authentication & Encryption
public class PublicKeyData
{
    public string PublicKey { get; set; } = string.Empty;
    public string Algorithm { get; set; } = string.Empty;
    public string Encoding { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    // RSA-OAEP-SHA256 encrypted, base64. Fetch the key from GET /AuthSvc/public-key.
    public string EncryptedPassword { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MobileNumber { get; set; }
    // Either supply ApplicationId here or send X-Api-Key headers; one is required.
    public int? ApplicationId { get; set; }
    public string? ApplicationRoleCode { get; set; }
}

public class ChangePasswordRequest
{
    // Both fields RSA-OAEP-SHA256 encrypted, base64.
    public string EncryptedCurrentPassword { get; set; } = string.Empty;
    public string EncryptedNewPassword { get; set; } = string.Empty;
}

public class AuthResponseData
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ApplicationRole { get; set; }
    public string? AppManagerRole { get; set; }
    public bool IsEmailVerified { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
    public LicenseInfo? ActiveLicense { get; set; }
}

public class TokenRefreshResponse
{
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class ValidateTokenResponse
{
    public bool IsValid { get; set; }
    public int? UserId { get; set; }
    public string? Email { get; set; }
    public string? AppManagerRole { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

// License
public class LicenseTypeDto
{
    public int LicenseTypeId { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string TypeCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LicenseModel { get; set; }
    public int? MaxDevices { get; set; }
    public int? DurationDays { get; set; }
    public int? Quantity { get; set; }
    public List<PricingDto> Pricing { get; set; } = new();
}

public class PricingDto
{
    public string CurrencyCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? FormattedPrice { get; set; }
}

public class LicenseResponse
{
    public int LicenseId { get; set; }
    public string? LicenseKey { get; set; }
    public string? LicenseName { get; set; }
    // Carries the same value as LicenseKey on GET /LicenseSvc.
    public string? LicenseCode { get; set; }
    public string? LicenseModel { get; set; }
    public string? Status { get; set; }
    public int? ApplicationId { get; set; }
    public string? ApplicationName { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? ActivationDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public int? DaysRemaining { get; set; }
    public int? RemainingQuantity { get; set; }
}

public class LicenseInfo
{
    public int LicenseId { get; set; }
    public string? LicenseKey { get; set; }
    public string? LicenseName { get; set; }
    public string? LicenseModel { get; set; }
    public string? Status { get; set; }
    public int? ApplicationId { get; set; }
    public string? ApplicationName { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public int? DaysRemaining { get; set; }
    public int? RemainingQuantity { get; set; }
}

public class LicenseValidationResponse
{
    public bool IsValid { get; set; }
    // Why the licence did not validate. Null when IsValid is true.
    public string? Message { get; set; }
    public LicenseInfo? License { get; set; }
    // Filled for a device-capped licence since v1.5.1; false / 0 / 0 / null otherwise — see Section 3.2.
    public bool DeviceRegistered { get; set; }
    public int DevicesUsed { get; set; }
    public int DevicesAllowed { get; set; }
    // The same block device-login returns (deviceCount, maxDevices, isOverCap, warning, licenseKey, licenseModel).
    public DeviceCapInfo? DeviceCap { get; set; }
}

public class DeviceCapInfo
{
    public int DeviceCount { get; set; }
    public int MaxDevices { get; set; }
    public bool IsOverCap { get; set; }
    public string? Warning { get; set; }
    public string? LicenseKey { get; set; }
    public string? LicenseModel { get; set; }
}

public class ConsumeQuantityResponse
{
    public int ConsumedQuantity { get; set; }
    public int RemainingQuantity { get; set; }
}

// User
public class UserProfileResponse
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MobileNumber { get; set; }
    // Scoped to the calling application when X-Api-Key is provided.
    // Empty/absent when the server cannot resolve an app context.
    public string? ApplicationRole { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsMobileVerified { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class UpdateProfileRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    // Send an empty string to clear the number; null or omitted leaves it alone.
    public string? MobileNumber { get; set; }
    // No ProfileImageUrl: removed 2026-09-18 from both this request and UserProfileResponse.
    // See Section 3.3.
}

public class AddressResponse
{
    public int AddressId { get; set; }
    public string AddressType { get; set; } = string.Empty;
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
}

public class UpdateAddressRequest
{
    // No AddressId: the address type is what identifies the row the server overwrites.
    public string AddressType { get; set; } = "Primary";
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
}

public class DataExportResponse
{
    public string? RequestId { get; set; }
    public string? Message { get; set; }
    public DateTime? EstimatedCompletionDate { get; set; }
}

// Features
public class FeatureAccessResponse
{
    public string FeatureCode { get; set; } = string.Empty;
    public string? FeatureName { get; set; }
    public string? FeatureType { get; set; }
    public bool HasAccess { get; set; }
    public int? Level { get; set; }
    // Part of the wire shape, never populated — see Section 3.4.
    public int? CurrentUsage { get; set; }
    public string? LevelDescription { get; set; }
    // "license" from the feature endpoints, "featureFlag" from the flag endpoint.
    public string? Source { get; set; }
    public string? Reason { get; set; }
    // Part of the wire shape, never populated — see Section 3.4.
    public string? RequiredLicense { get; set; }
    // Set only by GET /FeatureSvc/flags/{aFlagCode}.
    public FlagInfo? FlagInfo { get; set; }
}

public class FlagInfo
{
    public string? FlagName { get; set; }
    public int? RolloutPercentage { get; set; }
    public string? Variant { get; set; }
}

// Payments
public class TransactionResponse
{
    public int TransactionId { get; set; }
    public string? TransactionNumber { get; set; }
    public string? TransactionType { get; set; }
    public decimal Amount { get; set; }
    public string? CurrencyCode { get; set; }
    public string? Status { get; set; }
    public string? PaymentMethod { get; set; }
    public DateTime TransactionDate { get; set; }
    public string? Description { get; set; }
    public string? ProviderTransactionId { get; set; }
}

public class InvoiceResponse
{
    public int InvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? CurrencyCode { get; set; }
    public string? Status { get; set; }
    public DateTime? PaidDate { get; set; }
}

public class InvoiceDetailResponse : InvoiceResponse
{
    public string? BillingAddress { get; set; }
    public string? Notes { get; set; }
}

public class SubscriptionResponse
{
    public int SubscriptionId { get; set; }
    public string? PlanName { get; set; }
    public string? Status { get; set; }
    public string? BillingCycle { get; set; }
    public decimal Amount { get; set; }
    public string? CurrencyCode { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? CurrentPeriodEnd { get; set; }
    public bool CancelAtPeriodEnd { get; set; }
    public DateTime? NextBillingDate { get; set; }
}

public class PromoCodeResponse
{
    public string Code { get; set; } = string.Empty;
    public string? DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public string? Description { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

public class RoutePaymentRequest
{
    // e.g. "IN" or "US". The only required field.
    public string RegionCode { get; set; } = string.Empty;
    // Omit to settle in the region's own currency.
    public string? CurrencyCode { get; set; }
    public decimal Amount { get; set; }
    public string? TransactionCode { get; set; }
    public string? Description { get; set; }
}

public class RoutePaymentResponse
{
    public string RegionCode { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;
    public string ProviderCode { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public int? ProviderId { get; set; }
    public bool IsSandbox { get; set; }
    // True when the region had no route of its own and the catch-all provider was used.
    public bool IsCatchAllRoute { get; set; }
    // False when the provider has no usable credentials; ProviderMessage says what is missing.
    public bool IsProviderReady { get; set; }
    public string? ProviderMessage { get; set; }
    public string? ProviderOrderId { get; set; }
}

// Issues
public class IssueResponse
{
    public int IssueId { get; set; }
    public string? IssueNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IssueType { get; set; }
    public string? Priority { get; set; }
    public string? Status { get; set; }
    public int? ApplicationId { get; set; }
    public string? ApplicationName { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public DateTime? ResolvedDate { get; set; }
    // Populated on create and on the issue detail; null on a list entry. See Section 3.6.
    public List<IssueAttachmentResponse>? Attachments { get; set; }
}

public class IssueAttachmentResponse
{
    public int AttachmentId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? MimeType { get; set; }
    public DateTime UploadedDate { get; set; }
    public string? DownloadUrl { get; set; }
}

public class IssueDetailResponse : IssueResponse
{
    public List<IssueCommentResponse> Comments { get; set; } = new();
    // Returned since v1.5.1; null on issues raised before it. See Section 3.6.
    public string? ReproductionSteps { get; set; }
    public string? ExpectedBehavior { get; set; }
    public string? ActualBehavior { get; set; }
    // The environment object as sent; a JSON string for an issue raised in the admin portal.
    public System.Text.Json.JsonElement? Environment { get; set; }
}

public class IssueCommentResponse
{
    public int CommentId { get; set; }
    public string? Comment { get; set; }
    public bool IsInternal { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class CreateIssueRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    // Matched case-insensitively against the seeded codes and names; an unrecognised value is
    // refused with INVALID_ISSUE_TYPE / INVALID_ISSUE_PRIORITY. See Section 3.6.
    public string? Type { get; set; } = "Bug";
    public string? Priority { get; set; } = "Medium";
    public int? ApplicationId { get; set; }
    public string? ReproductionSteps { get; set; }
    public string? ExpectedBehavior { get; set; }
    public string? ActualBehavior { get; set; }
    public EnvironmentInfo? Environment { get; set; }
    // Stored with the issue and returned on the response. See Section 3.6.
    public List<AttachmentRequest>? Attachments { get; set; }
}

public class EnvironmentInfo
{
    public string? Browser { get; set; }
    public string? Os { get; set; }
    public string? AppVersion { get; set; }
    public string? DeviceType { get; set; }
}

public class AttachmentRequest
{
    public string FileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string Base64Content { get; set; } = string.Empty;
}

// Group models (v1.6). See Section 3.7.
public class CreateGroupRequest
{
    public string GroupName { get; set; } = string.Empty;
    // "Family" (the default) or "Team".
    public string? GroupType { get; set; }
    // Only when the client sends no X-Api-Key.
    public int? ApplicationId { get; set; }
}

public class AddGroupMemberRequest
{
    // Send UserId or Email; UserId wins when both are set.
    public int? UserId { get; set; }
    public string? Email { get; set; }
    // Send RelationshipId or Relationship (a name from GET /GroupSvc/relationships); one is required.
    public int? RelationshipId { get; set; }
    public string? Relationship { get; set; }
    // "SecondaryOwner", "Adult" or "Child".
    public string GroupRole { get; set; } = "Adult";
}

public class UpdateGroupMemberRequest
{
    // A null field keeps its current value.
    public int? RelationshipId { get; set; }
    public string? Relationship { get; set; }
    public string? GroupRole { get; set; }
}

public class CreateGroupChildRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    // The child's own, unique email; the child signs in with it.
    public string Email { get; set; } = string.Empty;
    // The 4 to 8 digit PIN, RSA-OAEP-SHA256 encrypted and base64-encoded like a password.
    public string EncryptedPin { get; set; } = string.Empty;
    // Optional for a child.
    public int? RelationshipId { get; set; }
    public string? Relationship { get; set; }
}

public class ResetGroupChildPinRequest
{
    public string EncryptedNewPin { get; set; } = string.Empty;
}

public class GroupResponse
{
    public int GroupId { get; set; }
    public int ApplicationId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string GroupType { get; set; } = string.Empty;
    public int OwnerUserId { get; set; }
    public int? SecondaryOwnerUserId { get; set; }
    // Members including the owner.
    public int MemberCount { get; set; }
    // Null when no group licence limits the group.
    public int? MemberLimit { get; set; }
    public DateTime CreatedDate { get; set; }
    public List<GroupMemberResponse> Members { get; set; } = new();
}

public class GroupMemberResponse
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    // Null for the owner, and for a child created without one.
    public int? RelationshipId { get; set; }
    public string? Relationship { get; set; }
    // "Owner", "SecondaryOwner", "Adult" or "Child".
    public string GroupRole { get; set; } = string.Empty;
    // True for an account that signs in with a PIN.
    public bool UsesPin { get; set; }
    public DateTime AddedDate { get; set; }
}

public class GroupRelationshipResponse
{
    public int RelationshipId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class GroupChildSignInResponse
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    // UTC.
    public DateTime LoginDate { get; set; }
    public string? IpAddress { get; set; }
    // Null until a location provider is configured.
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? DeviceName { get; set; }
    public string? DeviceType { get; set; }
    public string? Platform { get; set; }
    public string? Browser { get; set; }
}

// Exception
public class AppManagerException : Exception
{
    public string ErrorCode { get; }

    public AppManagerException(string aErrorCode, string aMessage) : base(aMessage)
    {
        ErrorCode = aErrorCode;
    }
}
```

### 4.3 Usage Examples

```csharp
using AppManager.Client;

// Initialize the client. Pass the application's API key and secret — several endpoints cannot
// resolve your application without them.
using var vClient = new AppManagerClient(
    "https://api.appmanager.com",
    "ak_live_your_api_key_here",
    "your_api_secret_here");

// Example 1: User Authentication
try
{
    var vAuthResult = await vClient.LoginAsync("user@example.com", "Password123!");
    Console.WriteLine($"Welcome {vAuthResult.FirstName} {vAuthResult.LastName}!");

    if (vAuthResult.ActiveLicense != null)
    {
        Console.WriteLine($"Active License: {vAuthResult.ActiveLicense.LicenseName}");
        Console.WriteLine($"Days Remaining: {vAuthResult.ActiveLicense.DaysRemaining}");
    }
}
catch (AppManagerException ex)
{
    Console.WriteLine($"Login failed: {ex.ErrorCode} - {ex.Message}");
}

// Example 2: License Validation
// A licence that does not validate still answers 200 — the outcome is IsValid, and Message says why.
var vLicenseValidation = await vClient.ValidateLicenseAsync();
if (vLicenseValidation.IsValid)
{
    Console.WriteLine($"License is valid. Expires in {vLicenseValidation.License?.DaysRemaining} days");
}
else
{
    Console.WriteLine($"License is not valid: {vLicenseValidation.Message}");
}

// Example 3: Feature Access Check
var vExportFeature = await vClient.CheckFeatureAccessAsync("EXPORT_PDF");
if (vExportFeature.HasAccess)
{
    Console.WriteLine("PDF Export feature is available");
    // Enable PDF export functionality
}
else
{
    // Reason is one of the two sentences listed in Section 3.4. RequiredLicense is never populated,
    // so build an upgrade prompt from GetLicenseTypesAsync instead of from the feature response.
    Console.WriteLine($"PDF Export not available: {vExportFeature.Reason}");
}

// Example 3b: Feature Flag Check
// A different question from a feature: flags come from a rollout, and a user named in the flag's
// target list is granted it whatever the rollout percentage says.
var vNewDashboard = await vClient.CheckFeatureFlagAsync("NEW_DASHBOARD");
Console.WriteLine($"New dashboard for this user: {vNewDashboard.HasAccess} " +
                  $"(rollout {vNewDashboard.FlagInfo?.RolloutPercentage}%)");

// Example 4: Get User Profile
var vProfile = await vClient.GetProfileAsync();
Console.WriteLine($"Profile: {vProfile.FirstName} {vProfile.LastName}");
Console.WriteLine($"Email: {vProfile.Email} (Verified: {vProfile.IsEmailVerified})");

// Example 5: Update Profile
await vClient.UpdateProfileAsync(new UpdateProfileRequest
{
    FirstName = "John",
    LastName = "Smith",
    MobileNumber = "+919876543211"
});

// Example 6: Create Support Issue
var vIssue = await vClient.CreateIssueAsync(new CreateIssueRequest
{
    Title = "Cannot export to PDF",
    Description = "When I try to export my report, I get an error.",
    Type = "Bug",
    Priority = "High",
    ReproductionSteps = "1. Open report\n2. Click Export\n3. Select PDF\n4. Error appears",
    ExpectedBehavior = "PDF should download",
    ActualBehavior = "Error message: 'Export failed'",
    Environment = new EnvironmentInfo { Browser = "Chrome 126", Os = "Windows 11", AppVersion = "3.2.0" }
});
// e.g. "myapp-005" — the application's code name and a sequence. Keep it; there is no lookup by number.
Console.WriteLine($"Issue created: {vIssue.IssueNumber}");

// Example 7: Get Transaction History
var vTransactions = await vClient.GetTransactionsAsync(aPage: 1, aPageSize: 10);
Console.WriteLine($"Found {vTransactions.TotalCount} transactions");
foreach (var vTransaction in vTransactions.Items)
{
    Console.WriteLine($"  {vTransaction.TransactionNumber}: {vTransaction.Amount:C} ({vTransaction.Status})");
}

// Example 8: Download Invoice
var vInvoices = await vClient.GetInvoicesAsync();
if (vInvoices.Items.Any())
{
    var vInvoiceId = vInvoices.Items.First().InvoiceId;
    var vPdfBytes = await vClient.DownloadInvoiceAsync(vInvoiceId);
    await File.WriteAllBytesAsync($"Invoice_{vInvoiceId}.pdf", vPdfBytes);
    Console.WriteLine("Invoice downloaded successfully");
}

// Example 9: Quantity-based License Consumption
try
{
    var vConsumeResult = await vClient.ConsumeQuantityAsync(
        aLicenseId: 1,
        aQuantity: 1,
        aReference: "export_report_123"
    );
    Console.WriteLine($"Consumed: {vConsumeResult.ConsumedQuantity}, Remaining: {vConsumeResult.RemainingQuantity}");
}
catch (AppManagerException ex) when (ex.ErrorCode == "INSUFFICIENT_QUANTITY")
{
    Console.WriteLine("Not enough quantity remaining. Please purchase more.");
}

// Example 10: Route a Payment Before Checkout
var vRoute = await vClient.RoutePaymentAsync(new RoutePaymentRequest
{
    RegionCode = "IN",
    Amount = 499,
    TransactionCode = "TXN-2026-0042",
    Description = "Professional License Purchase"
});

if (vRoute.IsProviderReady)
{
    Console.WriteLine($"Pay with {vRoute.ProviderName}, order {vRoute.ProviderOrderId}");
    // Load that provider's checkout with vRoute.ProviderOrderId
}
else
{
    // The routing decision is still correct; the provider just cannot be used yet.
    Console.WriteLine($"{vRoute.ProviderName} is not ready: {vRoute.ProviderMessage}");
}

// Example 11: Family group — create it, add a spouse, create a child, sign the child in with a PIN
// (v1.6, Section 3.7). vClient is signed in as the owner (Example 1).
try
{
    // Read the relationship list once; the names are what an administrator configured.
    var vRelationships = await vClient.GetGroupRelationshipsAsync();
    Console.WriteLine($"Relationships: {string.Join(", ", vRelationships.Select(r => r.Name))}");

    var vFamily = await vClient.CreateGroupAsync("The Sharma family", "Family");
    Console.WriteLine($"Created group {vFamily.GroupId}; owner {vFamily.OwnerUserId}");

    // The spouse must already have an account. They are added at once — no invitation step.
    var vSpouse = await vClient.AddGroupMemberAsync(vFamily.GroupId, new AddGroupMemberRequest
    {
        Email = "priya@example.com",
        Relationship = "Spouse",
        GroupRole = "SecondaryOwner"
    });
    Console.WriteLine($"Added {vSpouse.FirstName} as {vSpouse.GroupRole}");

    // The child gets an account of their own, with a unique email and a 4-8 digit PIN.
    var vChild = await vClient.CreateGroupChildAsync(vFamily.GroupId,
        "Anya", "Sharma", "anya@example.com", "4821", aRelationship: "Child");
    Console.WriteLine($"Child {vChild.UserId} created (usesPin: {vChild.UsesPin})");

    // The child signs in on the ordinary login with the PIN in place of a password. Use a separate
    // client so the owner's session is kept.
    using var vChildClient = new AppManagerClient(
        "https://api.appmanager.com", "ak_live_your_api_key_here", "your_api_secret_here");
    var vChildSession = await vChildClient.LoginAsync("anya@example.com", "4821");
    Console.WriteLine($"{vChildSession.FirstName} signed in");

    // Read the groups back: every member, the child included, sees the group and its members.
    foreach (var vGroup in await vClient.GetGroupsAsync())
    {
        Console.WriteLine($"{vGroup.GroupName} ({vGroup.MemberCount}/{vGroup.MemberLimit?.ToString() ?? "no limit"})");
        foreach (var vMember in vGroup.Members)
            Console.WriteLine($"  {vMember.FirstName} {vMember.LastName}: {vMember.GroupRole} {vMember.Relationship}");
    }

    // The owner, secondary owner and adults can see when the children signed in.
    foreach (var vSignIn in await vClient.GetGroupChildSignInsAsync(vFamily.GroupId, aLimit: 20))
        Console.WriteLine($"  {vSignIn.FirstName} at {vSignIn.LoginDate:u} from {vSignIn.IpAddress} ({vSignIn.Platform})");
}
catch (AppManagerException ex) when (ex.ErrorCode == "GROUP_MEMBER_LIMIT")
{
    Console.WriteLine("The family's licence allows no more members.");
}
catch (AppManagerException ex) when (ex.ErrorCode == "ACCOUNT_LOCKED")
{
    // Five wrong PINs lock the child for 15 minutes; the owner can reset the PIN to unlock at once.
    Console.WriteLine("The child's account is locked. Ask a parent to reset the PIN.");
}
catch (AppManagerException ex)
{
    Console.WriteLine($"Group operation failed: {ex.ErrorCode} - {ex.Message}");
}

// Example 12: Logout
await vClient.LogoutAsync();
Console.WriteLine("Logged out successfully");
```

### 4.4 Dependency Injection Setup (ASP.NET Core)

```csharp
// Program.cs or Startup.cs
using AppManager.Client;

var vBuilder = WebApplication.CreateBuilder(args);

// Register AppManagerClient as a scoped service
vBuilder.Services.AddScoped<AppManagerClient>(sp =>
{
    var vConfiguration = sp.GetRequiredService<IConfiguration>();
    var vBaseUrl = vConfiguration["AppManager:ApiUrl"] ?? "https://api.appmanager.com";
    return new AppManagerClient(
        vBaseUrl,
        vConfiguration["AppManager:ApiKey"],
        vConfiguration["AppManager:ApiSecret"]);
});

// Or use HttpClientFactory for better resource management
vBuilder.Services.AddHttpClient<AppManagerClient>((sp, aClient) =>
{
    var vConfiguration = sp.GetRequiredService<IConfiguration>();
    aClient.BaseAddress = new Uri(vConfiguration["AppManager:ApiUrl"] ?? "https://api.appmanager.com");
    aClient.DefaultRequestHeaders.Add("X-Api-Key", vConfiguration["AppManager:ApiKey"]);
    aClient.DefaultRequestHeaders.Add("X-Api-Secret", vConfiguration["AppManager:ApiSecret"]);
});

var vApp = vBuilder.Build();
```

```json
// appsettings.json — keep the secret out of source control; use user secrets or the environment.
{
  "AppManager": {
    "ApiUrl": "https://api.appmanager.com",
    "ApiKey": "ak_live_your_api_key_here",
    "ApiSecret": "your_api_secret_here"
  }
}
```

### 4.5 MAUI/Blazor Integration

```csharp
// MauiProgram.cs
using AppManager.Client;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var vBuilder = MauiApp.CreateBuilder();
        vBuilder.UseMauiApp<App>();

        // Register AppManagerClient. ApiKey and ApiSecret identify this application to the API.
        vBuilder.Services.AddSingleton<AppManagerClient>(sp =>
        {
#if DEBUG
            return new AppManagerClient("https://localhost:5101", ApiKey, ApiSecret);
#else
            return new AppManagerClient("https://api.appmanager.com", ApiKey, ApiSecret);
#endif
        });

        return vBuilder.Build();
    }
}

// Example Blazor Component
@inject AppManagerClient AppManager

@code {
    private UserProfileResponse? objProfile;
    private bool HasExportFeature;

    protected override async Task OnInitializedAsync()
    {
        if (AppManager.IsAuthenticated)
        {
            objProfile = await AppManager.GetProfileAsync();
            var vExportAccess = await AppManager.CheckFeatureAccessAsync("EXPORT_PDF");
            HasExportFeature = vExportAccess.HasAccess;
        }
    }
}
```

---

## 5. AI Agent Integration Guide

This section provides guidance for AI agents and automated systems integrating with the App Manager API using .NET.

### 5.1 Authentication for AI Agents

AI agents should:
1. Store credentials securely (use environment variables, Azure Key Vault, or other secret management)
2. Implement automatic token refresh (handled by AppManagerClient)
3. Handle authentication errors gracefully

```csharp
using AppManager.Client;
using Microsoft.Extensions.Configuration;

// Using IConfiguration (recommended for ASP.NET Core / Worker Services)
public class AppManagerAgentService
{
    private readonly AppManagerClient objClient;
    private readonly IConfiguration objConfiguration;
    private readonly ILogger<AppManagerAgentService> objLogger;

    public AppManagerAgentService(IConfiguration aConfiguration, ILogger<AppManagerAgentService> aLogger)
    {
        objConfiguration = aConfiguration;
        objLogger = aLogger;

        var vApiUrl = aConfiguration["AppManager:ApiUrl"] ?? "https://api.appmanager.com";
        objClient = new AppManagerClient(
            vApiUrl,
            aConfiguration["AppManager:ApiKey"],
            aConfiguration["AppManager:ApiSecret"]);
    }

    public async Task InitializeAsync()
    {
        try
        {
            var vEmail = objConfiguration["AppManager:UserEmail"]
                ?? Environment.GetEnvironmentVariable("APPMANAGER_USER_EMAIL")
                ?? throw new InvalidOperationException("AppManager user email not configured");

            var vPassword = objConfiguration["AppManager:UserPassword"]
                ?? Environment.GetEnvironmentVariable("APPMANAGER_USER_PASSWORD")
                ?? throw new InvalidOperationException("AppManager user password not configured");

            await objClient.LoginAsync(vEmail, vPassword);
            objLogger.LogInformation("Successfully authenticated with App Manager API");
        }
        catch (AppManagerException ex)
        {
            objLogger.LogError(ex, "Failed to authenticate: {ErrorCode}", ex.ErrorCode);
            throw;
        }
    }

    public async Task<bool> CheckFeatureAccessAsync(string aFeatureCode)
    {
        var vResult = await objClient.CheckFeatureAccessAsync(aFeatureCode);
        return vResult.HasAccess;
    }

    public async Task<bool> ValidateLicenseAsync()
    {
        var vResult = await objClient.ValidateLicenseAsync();
        return vResult.IsValid;
    }
}

// Using Environment Variables directly
var vApiUrl = Environment.GetEnvironmentVariable("APPMANAGER_API_URL") ?? "https://api.appmanager.com";
var vApiKey = Environment.GetEnvironmentVariable("APPMANAGER_API_KEY");
var vApiSecret = Environment.GetEnvironmentVariable("APPMANAGER_API_SECRET");
var vEmail = Environment.GetEnvironmentVariable("APPMANAGER_USER_EMAIL");
var vPassword = Environment.GetEnvironmentVariable("APPMANAGER_USER_PASSWORD");

using var vClient = new AppManagerClient(vApiUrl, vApiKey, vApiSecret);
await vClient.LoginAsync(vEmail!, vPassword!);
```

> **An agent signs in as a user.** There is no machine-to-machine token: the API key and secret say
> which application is calling, and a JWT obtained by signing in says which user. Everything an agent
> reads — licences, features, issues, payments — is that one user's. Give the agent its own account
> with the role it needs rather than reusing a person's credentials.

### 5.2 Common AI Agent Operations

**Check if user has access to a feature:**
```csharp
var vFeatureAccess = await vClient.CheckFeatureAccessAsync("EXPORT_PDF");
if (vFeatureAccess.HasAccess)
{
    // Feature is available
}
else
{
    Console.WriteLine($"Feature not available: {vFeatureAccess.Reason}");
}
```

**Validate user's license:**
```csharp
var vValidation = await vClient.ValidateLicenseAsync();
if (vValidation.IsValid)
{
    Console.WriteLine($"License valid for {vValidation.License?.DaysRemaining} days");
}
```

**Get user profile:**
```csharp
var vProfile = await vClient.GetProfileAsync();
Console.WriteLine($"User: {vProfile.Email}");
```

**Submit a support ticket:**
```csharp
var vIssue = await vClient.CreateIssueAsync(new CreateIssueRequest
{
    Title = "Automated issue report",
    Description = "Issue detected by monitoring agent",
    Type = "Bug",
    Priority = "Medium"
});
Console.WriteLine($"Issue created: {vIssue.IssueNumber}");
```

**Family and team groups (v1.6, Section 3.7):**
```csharp
// Which groups is this user in, and in what role?
var vGroups = await vClient.GetGroupsAsync();
foreach (var vGroup in vGroups)
{
    var vMe = vGroup.Members.FirstOrDefault(m => m.Email == "user@example.com");
    Console.WriteLine($"{vGroup.GroupName}: {vMe?.GroupRole} ({vGroup.MemberCount} members)");
}

// Owner-only changes. Read the group first and act only when the signed-in user's role is Owner;
// anyone else gets 403 NOT_GROUP_OWNER.
var vFamily = vGroups.First(g => g.GroupType == "Family");
await vClient.AddGroupMemberAsync(vFamily.GroupId, new AddGroupMemberRequest
{
    Email = "grandma@example.com",
    Relationship = "Parent",
    GroupRole = "Adult"
});

// A child locked out by wrong PINs: the owner sets a new PIN, which also unlocks the account.
await vClient.ResetGroupChildPinAsync(vFamily.GroupId, aChildUserId: 52, aNewPin: "7350");

// When did the children sign in? Owner, secondary owner and adults only.
var vSignIns = await vClient.GetGroupChildSignInsAsync(vFamily.GroupId, aLimit: 50);
```

### 5.3 Retries and Throttling

**Server keys are not rate-limited; installed-app (public) keys are.** A call made with a key and
secret has no request quota, no `429 Too Many Requests` and no `Retry-After` header. A call made with
an installed-app key (`pk_live_…`, [Section 2.1.1](#211-installed-apps-public-keys)) is limited to 60
requests a minute per device (key + `X-Device-Id`); over that it answers `429 RATE_LIMITED` with a
`Retry-After` header giving the seconds to wait. Either way, do not treat the absence of a 429 as
permission to hammer the API: an agent in a tight loop will simply take the database with it.

Throttle yourself, and cache what does not change often (see 5.4). Wrap calls in a retry policy —
transient network failures and a restarting API are the real cases you will hit. The policy below
retries on transport errors and on `RATE_LIMITED`.

**Do not retry the group refusals.** Every `409` on `GroupSvc` describes the state of the group, not a
passing condition, so sending the same request again gets the same answer:

| Code | What to do instead of retrying |
|------|--------------------------------|
| `ALREADY_GROUP_MEMBER` (409) | Treat as done — the user is in the group. Read `GET /GroupSvc` if you need their role |
| `SECONDARY_OWNER_EXISTS` (409) | Change the current secondary owner's role first (`PUT …/members/{aUserId}`), then retry once |
| `GROUP_MEMBER_LIMIT` (409) | The group's licence is full; remove a member or move to a licence with a higher member limit |
| `CHILD_CANNOT_OWN_GROUP` (403) | Never retry. Tell the user a child cannot own a group; pick an adult as secondary owner, or ask the owner to change the child's role to `Adult` (a PIN account stays a child) |
| `EMAIL_EXISTS` (409, child creation) | That email has an account; add it with `POST …/members` instead, or use another email |
| `VALIDATION_ERROR` on hand-over, "changed while it was being handed over" | Read the group again and retry once |
| `ACCOUNT_LOCKED` (423, a child's PIN) | Do not retry for 15 minutes — every attempt, right or wrong, answers 423 until then. The owner can unlock at once with `reset-pin` |

`POST /GroupSvc` and `POST …/children` are **not idempotent**: a retried create makes a second group
(or, for a child, answers `409 EMAIL_EXISTS` because the first call already created the account). If a
create times out, read `GET /GroupSvc` before trying again.

```csharp
// Implementing retry logic with Polly
using Polly;
using Polly.Retry;

public class ResilientAppManagerClient
{
    private readonly AppManagerClient objClient;
    private readonly AsyncRetryPolicy objRetryPolicy;

    public ResilientAppManagerClient(string aBaseUrl, string aApiKey, string aApiSecret)
    {
        objClient = new AppManagerClient(aBaseUrl, aApiKey, aApiSecret);

        objRetryPolicy = Policy
            .Handle<HttpRequestException>()
            .Or<AppManagerException>(ex => ex.ErrorCode == "RATE_LIMITED")
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt =>
                    TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)), // Exponential backoff
                onRetry: (exception, timeSpan, retryCount, context) =>
                {
                    Console.WriteLine($"Retry {retryCount} after {timeSpan.TotalSeconds}s due to {exception.Message}");
                });
    }

    public async Task<bool> CheckFeatureAccessWithRetryAsync(string aFeatureCode)
    {
        return await objRetryPolicy.ExecuteAsync(async () =>
        {
            var vResult = await objClient.CheckFeatureAccessAsync(aFeatureCode);
            return vResult.HasAccess;
        });
    }
}
```

### 5.4 Best Practices for AI Agents

1. **Cache feature access results** - Feature access typically doesn't change frequently. Cache the
   answer against the user, not globally: both feature access and flag results are per-user, and a
   flag's percentage rollout is decided by a stable hash of user id and flag code, so the same user
   gets the same answer every time and a short cache is safe. Keep the window short — an
   administrator can switch a flag off, or move a user onto a licence, at any moment.

```csharp
using Microsoft.Extensions.Caching.Memory;

public class CachedFeatureService
{
    private readonly AppManagerClient objClient;
    private readonly IMemoryCache objCache;

    public CachedFeatureService(AppManagerClient aClient, IMemoryCache aCache)
    {
        objClient = aClient;
        objCache = aCache;
    }

    public async Task<bool> HasFeatureAccessAsync(string aFeatureCode)
    {
        var vCacheKey = $"feature_{aFeatureCode}";

        return await objCache.GetOrCreateAsync(vCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            var vResult = await objClient.CheckFeatureAccessAsync(aFeatureCode);
            return vResult.HasAccess;
        });
    }
}
```

2. **Implement exponential backoff** - For retrying failed requests (see Polly example above)

3. **Log all API interactions** - For debugging and audit purposes

```csharp
using Microsoft.Extensions.Logging;

public class LoggingAppManagerClient
{
    private readonly AppManagerClient objClient;
    private readonly ILogger<LoggingAppManagerClient> objLogger;

    public async Task<FeatureAccessResponse> CheckFeatureAccessAsync(string aFeatureCode)
    {
        objLogger.LogInformation("Checking feature access: {FeatureCode}", aFeatureCode);

        try
        {
            var vResult = await objClient.CheckFeatureAccessAsync(aFeatureCode);
            objLogger.LogInformation("Feature {FeatureCode} access: {HasAccess}", aFeatureCode, vResult.HasAccess);
            return vResult;
        }
        catch (AppManagerException ex)
        {
            objLogger.LogError(ex, "Feature check failed: {ErrorCode}", ex.ErrorCode);
            throw;
        }
    }
}
```

4. **Handle all error codes** - See Error Handling section below

5. **Know whose session you hold** - Every group call acts as the signed-in user, and what it may do
   follows that user's role in the group ([Section 3.7](#37-group-service-groupsvc)). An agent acting
   for a family should sign in as the owner to manage it. A child's session (signed in with the PIN)
   can read `GET /GroupSvc`, its profile, licence and features, and change its own PIN with
   `POST /UserSvc/change-password` (PIN rule), but cannot manage the group or see sign-ins. Never store a
   child's PIN in an agent's configuration; prefer the owner's session plus `reset-pin` when a child is
   locked out.

6. **A PIN is a credential** - Encrypt it like a password on every call (`encryptedPin`,
   `encryptedNewPin`, `encryptedPassword`), never log it, and expect the lockout: five wrong PINs in a
   row lock the child for 15 minutes and email the owner and secondary owner. An agent that tries PINs
   in a loop will lock the child out and alarm the parents.

7. **Check entitlement with `validate`, not login** - `activeLicense` on the login response is the
   licence `validate` chose at sign-in (own first, then a group licence), but entitlement can change
   during a session — a licence expires, a type is deleted, a device cap fills — so ask
   `POST /LicenseSvc/validate` at the moment it matters.

8. **A `401` right after a reset means "sign in again"** - A child's PIN reset, a password reset or
   change, deactivation or deletion ends every access token the user already holds, at once
   (2026-10-04). An agent holding such a token gets `401` on its next call — a bare `401` on
   `[Authorize]` endpoints such as `GroupSvc`, the `401 UNAUTHORIZED` envelope elsewhere — and its
   refresh token answers `401 REVOKED_REFRESH_TOKEN`. Do not retry or loop on it: sign in again with the
   new credential (for a child, the owner gives the new PIN), or stop if the account was deleted. After
   your own `POST /UserSvc/change-password` succeeds, sign in again with the new password before the
   next call.

---

## 5.5 CORS Configuration for Client Applications

The API enforces CORS (Cross-Origin Resource Sharing) to control which domains can make API calls from browsers. Each client application's origin must be registered in the API's configuration.

**Server Configuration (`appsettings.json`):**

```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://app1.yourcompany.com",
      "https://app2.yourcompany.com",
      "https://mobile-backend.yourcompany.com",
      "http://localhost:3000"
    ]
  }
}
```

**For Docker deployments**, override via environment variable:

```bash
docker run -d \
  -e "Cors__AllowedOrigins__0=https://app1.yourcompany.com" \
  -e "Cors__AllowedOrigins__1=https://app2.yourcompany.com" \
  -e "Cors__AllowedOrigins__2=http://localhost:3000" \
  ...
```

**Behavior:**
- **Development** (`ASPNETCORE_ENVIRONMENT=Development`): If no origins are configured, all origins are allowed for ease of local testing
- **Production**: Only configured origins are accepted. Requests from unlisted origins will be blocked by the browser

> **Note for server-to-server calls:** CORS only applies to browser-based requests. Backend services, AI agents, and mobile apps calling the API directly are not affected by CORS restrictions.

---

## 6. Error Handling

### 6.1 Standard Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "statusCode": 400,
  "traceId": "abc123def456"
}
```

### 6.2 Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed (e.g., missing `encryptedPassword`) |
| `DECRYPTION_FAILED` | 400 | Failed to decrypt an RSA-encrypted password — wrong public key, wrong padding (must be RSA-OAEP-SHA256), or corrupted base64 |
| `UNAUTHORIZED` | 401 | Authentication required |
| `PUBLIC_KEY_NOT_ALLOWED` | 403 | A public (installed-app) key was used on an endpoint it may not call — see [Section 2.1.1](#211-installed-apps-public-keys). Since 1.7 `POST /UserSvc/delete-request` is allowed |
| `DEVICE_ID_REQUIRED` | 400 | A public-key call did not send an `X-Device-Id` header |
| `RATE_LIMITED` | 429 | This device made more public-key requests this minute than allowed; wait the seconds in the `Retry-After` header |
| **Group codes (v1.6, `GroupSvc`)** | | |
| `GROUP_NOT_FOUND` | 404 | No such group in your application, or the signed-in user is not a member of it |
| `NOT_GROUP_OWNER` | 403 | The user is in the group but only its owner may do this (members, children, reset-pin, hand-over); on `GET …/sign-ins`, the user is a child |
| `SECONDARY_OWNER_EXISTS` | 409 | Making someone `SecondaryOwner` when the group already has one |
| `CHILD_CANNOT_OWN_GROUP` | 403 | A child — a `Child` in any group of your application, or a PIN account — cannot create a group, be named `SecondaryOwner`, or receive a hand-over; and a group's owner or secondary owner cannot be given the `Child` role in another group of your application (2026-10-04) |
| `RELATIONSHIP_NOT_FOUND` | 400 | The relationship id or name is not on your application's active list (`GET /GroupSvc/relationships`) |
| `GROUP_MEMBER_LIMIT` | 409 | Adding a member or creating a child would take the group past its licence type's member limit (owner included) |
| `ALREADY_GROUP_MEMBER` | 409 | The user is already in the group |
| `USER_NOT_FOUND` | 404 | On `GroupSvc`: no account with that `userId` / `email`, the user is not a member, or (reset-pin) not a child of the group |
| `INVALID_PASSWORD` | 400 | A new password or PIN breaks the account's rule — the password rule, or for a PIN account (and on the child endpoints) `PIN must be 4 to 8 digits` |
| `EMAIL_EXISTS` | 409 | Email already registered — also when creating a child with a taken email |
| `DECRYPTION_FAILED` (groups) | 400 | `encryptedPin` / `encryptedNewPin` missing or not RSA-decryptable |
| `APPLICATION_NOT_CONFIGURED` | 500 | Also on `POST /GroupSvc/{aGroupId}/children` when the application defines no roles |
| **Account codes** | | |
| `INVALID_CREDENTIALS` | 401 | Wrong email, password or PIN (also a soft-deleted account) |
| `INVALID_TOKEN` / `INVALID_REFRESH_TOKEN` / `INVALID_RESET_TOKEN` | 401 / 400 | Token is malformed, unknown, expired, or revoked |
| `ACCOUNT_LOCKED` | 423 | Five failed sign-ins in a row (passwords and PINs alike); returned on the fifth and for the next 15 minutes |
| `ACCOUNT_DISABLED` | 403 | Account has been deactivated |
| `NOT_FOUND` (and resource-specific `ISSUE_NOT_FOUND`, `TRANSACTION_NOT_FOUND`, `INVOICE_NOT_FOUND`, `LICENSE_NOT_FOUND`, `SUBSCRIPTION_NOT_FOUND`, `PROMO_CODE_NOT_FOUND`, `FEATURE_NOT_FOUND`, `FLAG_NOT_FOUND`, `USER_NOT_FOUND`, `DEVICE_NOT_FOUND`) | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |
| **Multi-tenant scoping codes (v1.3)** | | |
| `APPLICATION_ID_REQUIRED` | 400 | Endpoint requires an ApplicationId and none was resolvable (no `X-Api-Key`, no body `applicationId` / query `aApplicationId`) |
| `APP_ID_MISMATCH` | 400 / 401 / 403 | Caller's resolved ApplicationId does not match the resource's / token's ApplicationId. 400 on register / reset-password / `GroupSvc` when the body or query and the API key disagree; 401 on `/AuthSvc/refresh` when the refresh token was issued for a different app; 403 on `GET /IssueSvc/{aIssueId}`, `POST /IssueSvc/{aIssueId}/comments`, `POST /IssueSvc/{aIssueId}/close` |
| `CROSS_APP_LICENSE` | 403 | Returned by `POST /LicenseSvc/{aLicenseId}/consume` and `DELETE /LicenseSvc/{aLicenseId}/devices/{aDeviceId}` when the license's ApplicationId does not match the caller's |
| `CROSS_APP_RESOURCE` | 403 | Returned by `GET /PaymentSvc/transactions/{aTransactionId}`, `GET /PaymentSvc/invoices/{aInvoiceId}`, `POST /PaymentSvc/subscriptions/{aSubscriptionId}/cancel` when the resource's ApplicationId does not match the caller's |
| `NO_APP_ACCESS` | 403 | Returned by `GET /UserSvc/profile` when the authenticated user has no `UserApplicationRole` row for the calling app |
| `UNKNOWN_ROLE_CODE` | 400 | Returned by `POST /AuthSvc/register` when `applicationRoleCode` names a role the application does not define. The message lists the valid codes; no user is created |
| `APPLICATION_NOT_CONFIGURED` | 500 | Returned by `POST /AuthSvc/register` when the application defines no roles at all, so no application role can be assigned; no user is created |
| `PROMO_CODE_NOT_VALID_FOR_APPLICATION` | 400 | Business-logic: the promo code is scoped to a different application than the caller's (returned as 400, not 403, to keep the existing promo-validation response shape) |
| **Device codes (v1.5)** | | |
| `DEVICE_INFO_REQUIRED` | 400 | Returned by `POST /AuthSvc/device-login` and `POST /AuthSvc/device-register` when `deviceInfo` is absent, or present without a `deviceInfo.deviceId`. Nothing is recorded for the rejected call. `POST /AuthSvc/login` is unaffected — `deviceInfo` stays optional there |
| `DEVICE_BLOCKED` | 403 | The signing-in device has been blocked for this user (`POST /AuthSvc/devices/{aUserDeviceId}/block`). Enforced on `POST /AuthSvc/device-login` **and** on `POST /AuthSvc/login`, after the password is verified; the session issued during authentication is revoked before the 403 is returned. The user can lift the block from another signed-in device with `POST /AuthSvc/devices/{aUserDeviceId}/unblock` (v1.5.1) |
| `DEVICE_NOT_FOUND` | 404 | Returned by `DELETE /AuthSvc/devices/{aUserDeviceId}`, `POST /AuthSvc/devices/{aUserDeviceId}/block` and `POST /AuthSvc/devices/{aUserDeviceId}/unblock` when the id is unknown **or belongs to another user** — never 403, which would confirm the id exists |
| *(no error code)* — device cap exceeded | 200 | Being over a `DeviceLifetime` / `DeviceSubscription` licence's `MaxDevices` is **reported, not refused**: `device-login` / `device-register` still answer `200` with tokens, and `data.deviceCap` carries `deviceCount`, `maxDevices`, `isOverCap: true` and a `warning` you can surface. Enforce it client-side if you want a hard refusal |

### 6.3 Handling Errors in Code

```csharp
using AppManager.Client;
using Microsoft.Extensions.Logging;

public class SafeApiCaller
{
    private readonly AppManagerClient objClient;
    private readonly ILogger<SafeApiCaller> objLogger;
    private readonly string objUserEmail;
    private readonly string objUserPassword;

    public SafeApiCaller(AppManagerClient aClient, ILogger<SafeApiCaller> aLogger,
        string aUserEmail, string aUserPassword)
    {
        objClient = aClient;
        objLogger = aLogger;
        objUserEmail = aUserEmail;
        objUserPassword = aUserPassword;
    }

    public async Task<T> SafeCallAsync<T>(Func<Task<T>> aApiFunction)
    {
        try
        {
            return await aApiFunction();
        }
        catch (AppManagerException ex)
        {
            switch (ex.ErrorCode)
            {
                case "UNAUTHORIZED":
                case "INVALID_TOKEN":
                case "SESSION_EXPIRED":
                    // Handle authentication error - try to re-authenticate
                    objLogger.LogWarning("Authentication error: {ErrorCode}. Attempting re-login.", ex.ErrorCode);
                    await objClient.LoginAsync(objUserEmail, objUserPassword);
                    return await aApiFunction(); // Retry after re-authentication

                case "RATE_LIMITED":
                    // Handle rate limiting with exponential backoff
                    objLogger.LogWarning("Rate limited. Waiting before retry.");
                    await Task.Delay(TimeSpan.FromSeconds(60));
                    return await aApiFunction(); // Retry after waiting

                case "VALIDATION_ERROR":
                    // Log validation errors for debugging
                    objLogger.LogError("Validation error: {Message}", ex.Message);
                    throw;

                case "NOT_FOUND":
                case "ISSUE_NOT_FOUND":
                case "TRANSACTION_NOT_FOUND":
                case "INVOICE_NOT_FOUND":
                    // Resource not found - don't retry
                    objLogger.LogWarning("Resource not found: {Message}", ex.Message);
                    throw;

                default:
                    // Log and rethrow other errors
                    objLogger.LogError(ex, "API Error: {ErrorCode} - {Message}", ex.ErrorCode, ex.Message);
                    throw;
            }
        }
    }
}

// Usage Example
public class FeatureChecker
{
    private readonly SafeApiCaller objSafeApiCaller;
    private readonly AppManagerClient objClient;

    public async Task<bool> CheckExportFeatureAsync()
    {
        var vResult = await objSafeApiCaller.SafeCallAsync(async () =>
        {
            var vAccess = await objClient.CheckFeatureAccessAsync("EXPORT_PDF");
            return vAccess.HasAccess;
        });

        return vResult;
    }
}

// Comprehensive Error Handling with Custom Responses
public class ApiErrorHandler
{
    public static string GetUserFriendlyMessage(AppManagerException aEx)
    {
        return aEx.ErrorCode switch
        {
            "UNAUTHORIZED" => "Please log in to continue.",
            "INVALID_CREDENTIALS" => "Invalid email or password. Please try again.",
            "ACCOUNT_LOCKED" => "Your account has been locked due to too many failed attempts. Please try again later.",
            "NOT_GROUP_OWNER" => "Only the group's owner can do this.",
            "GROUP_NOT_FOUND" => "That group was not found.",
            "GROUP_MEMBER_LIMIT" => "Your plan allows no more members in this group.",
            "ALREADY_GROUP_MEMBER" => "That person is already in the group.",
            "SECONDARY_OWNER_EXISTS" => "The group already has a secondary owner.",
            "RELATIONSHIP_NOT_FOUND" => "Please choose a relationship from the list.",
            "ACCOUNT_DISABLED" => "Your account has been disabled. Please contact support.",
            "NOT_FOUND" => "The requested resource was not found.",
            "VALIDATION_ERROR" => $"Invalid input: {aEx.Message}",
            "INSUFFICIENT_QUANTITY" => "Not enough quantity remaining. Please purchase more.",
            "LICENSE_EXPIRED" => "Your license has expired. Please renew to continue.",
            "FEATURE_NOT_AVAILABLE" => "This feature is not available with your current license.",
            "RATE_LIMITED" => "Too many requests. Please wait a moment and try again.",
            "INTERNAL_ERROR" => "An unexpected error occurred. Please try again later.",
            _ => aEx.Message
        };
    }
}
```

---

## API Endpoints Summary

| Service | Method | Endpoint | Auth Required |
|---------|--------|----------|---------------|
| **AuthSvc** | GET | /AuthSvc/public-key | No |
| | POST | /AuthSvc/register | No |
| | POST | /AuthSvc/login | No |
| | POST | /AuthSvc/device-login | No |
| | POST | /AuthSvc/device-register | No |
| | POST | /AuthSvc/refresh | No |
| | POST | /AuthSvc/validate | No |
| | POST | /AuthSvc/logout | Yes |
| | GET | /AuthSvc/devices | Yes |
| | DELETE | /AuthSvc/devices/{aUserDeviceId} | Yes |
| | POST | /AuthSvc/devices/{aUserDeviceId}/block | Yes |
| | POST | /AuthSvc/devices/{aUserDeviceId}/unblock | Yes (new in 1.5.1) |
| | POST | /AuthSvc/forgot-password | No |
| | POST | /AuthSvc/reset-password | No |
| **LicenseSvc** | GET | /LicenseSvc/types | No (API key or `aApplicationId` still required) |
| | GET | /LicenseSvc | Yes |
| | POST | /LicenseSvc/validate | Yes (device-cap fields filled since 1.5.1) |
| | POST | /LicenseSvc/{aLicenseId}/consume | Yes |
| | DELETE | /LicenseSvc/{aLicenseId}/devices/{aDeviceId} | Yes |
| **UserSvc** | GET | /UserSvc/profile | Yes |
| | PUT | /UserSvc/profile | Yes |
| | GET | /UserSvc/addresses | Yes |
| | POST | /UserSvc/addresses | Yes |
| | POST | /UserSvc/change-password | Yes |
| | POST | /UserSvc/data-export | Yes |
| | POST | /UserSvc/delete-request | Yes |
| **FeatureSvc** | GET | /FeatureSvc | Yes |
| | GET | /FeatureSvc/{aFeatureCode} | Yes |
| | GET | /FeatureSvc/flags/{aFlagCode} | Yes |
| **PaymentSvc** | GET | /PaymentSvc/transactions | Yes |
| | GET | /PaymentSvc/transactions/{aTransactionId} | Yes |
| | GET | /PaymentSvc/invoices | Yes |
| | GET | /PaymentSvc/invoices/{aInvoiceId} | Yes |
| | GET | /PaymentSvc/invoices/{aInvoiceId}/download | Yes |
| | GET | /PaymentSvc/subscriptions | Yes |
| | POST | /PaymentSvc/subscriptions/{aSubscriptionId}/cancel | Yes |
| | POST | /PaymentSvc/promo-codes/validate | No (API key still required) |
| | POST | /PaymentSvc/payments/route | Yes |
| **IssueSvc** | GET | /IssueSvc | Yes |
| | GET | /IssueSvc/{aIssueId} | Yes (report fields returned since 1.5.1) |
| | GET | /IssueSvc/{aIssueId}/attachments/{aAttachmentId} | Yes |
| | POST | /IssueSvc | Yes |
| | POST | /IssueSvc/{aIssueId}/comments | Yes |
| | POST | /IssueSvc/{aIssueId}/close | Yes |
| **GroupSvc** (v1.6; every route open to public keys) | GET | /GroupSvc | Yes (any user) |
| | POST | /GroupSvc | Yes (any user; 201) |
| | GET | /GroupSvc/relationships | Yes (any user) |
| | POST | /GroupSvc/{aGroupId}/members | Yes (owner; 201) |
| | PUT | /GroupSvc/{aGroupId}/members/{aUserId} | Yes (owner) |
| | DELETE | /GroupSvc/{aGroupId}/members/{aUserId} | Yes (owner) |
| | POST | /GroupSvc/{aGroupId}/children | Yes (owner; 201) |
| | POST | /GroupSvc/{aGroupId}/children/{aUserId}/reset-pin | Yes (owner) |
| | POST | /GroupSvc/{aGroupId}/handover | Yes (owner) |
| | GET | /GroupSvc/{aGroupId}/sign-ins | Yes (owner, secondary owner, adult) |

---

**Need Help?** Contact your App Manager administrator or visit the support portal.
