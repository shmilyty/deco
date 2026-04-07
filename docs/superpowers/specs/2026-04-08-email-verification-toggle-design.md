# Email Verification Toggle Design

Date: 2026-04-08
Project: Deco My Tree
Scope: Add a server-side environment toggle that controls whether email verification is required for email/password signups.

## Context

The current email/password flow always requires a verification email:

- `POST /api/auth/signup` creates a user with `emailVerified: false`, generates a verification token, and sends a verification email.
- `POST /api/auth/email-login` blocks login when `emailVerified` is false.
- `POST /api/auth/resend-verify` always regenerates and re-sends a verification email.

The requested behavior is to add a switch in `server/.env` so deployments can decide whether email verification is required. When the switch is off, a newly registered user should be logged in immediately after signup.

## Goals

- Preserve the current behavior by default.
- Allow deployments to disable email verification without code changes.
- When verification is disabled, allow new users to sign up and enter the app immediately.
- Keep frontend behavior compatible with both modes.
- Avoid database schema changes.

## Non-Goals

- No new admin panel or runtime toggle UI.
- No migration of historical users.
- No change to LinuxDo OAuth behavior.
- No new multi-mode verification policy beyond a single boolean switch.

## Chosen Approach

Add a new boolean env variable:

- `EMAIL_VERIFICATION_REQUIRED=true|false`

Default:

- If not set, treat it as `true` to preserve existing behavior.

Behavior:

- When `true`, keep the current signup, login, and resend-verification flow unchanged.
- When `false`, skip verification-token generation and email delivery for new signups, mark new users as verified immediately, and return a JWT from signup so the frontend can auto-login.
- When `false`, email/password login should not reject existing unverified users.
- When `false`, resend-verification should return a success response without sending email.

## Configuration Changes

Files:

- `server/config.js`
- `server/.env.example`
- optionally `README.md` deployment documentation

Details:

- Parse `EMAIL_VERIFICATION_REQUIRED` explicitly rather than with JavaScript truthiness.
- Accepted values:
  - missing => `true`
  - `true` => `true`
  - `false` => `false`
- Keep the value available as `config.EMAIL_VERIFICATION_REQUIRED`.

## Backend Design

### Signup

File:

- `server/routes/auth.js`

Current flow:

- normalize email
- validate input
- hash password
- create user with `emailVerified: false`
- generate `verifyToken` and `verifyTokenExp`
- send verification email
- return success message

New flow:

- shared validation remains unchanged
- branch on `config.EMAIL_VERIFICATION_REQUIRED`

If verification is required:

- keep the current behavior

If verification is not required:

- create the user with:
  - `emailVerified: true`
  - `verifyToken: null`
  - `verifyTokenExp: null`
- do not send verification email
- sign JWT immediately
- return:
  - `success: true`
  - `token`
  - a message such as `注册成功`

### Email Login

File:

- `server/routes/auth.js`

Current flow:

- reject login with `403` and `needVerify: true` when `user.emailVerified` is false

New flow:

- only enforce that rejection when `config.EMAIL_VERIFICATION_REQUIRED` is `true`
- when the switch is `false`, issue JWT after password verification regardless of `emailVerified`

Reason:

- turning the requirement off should disable the gate consistently for both new and pre-existing email accounts

### Resend Verification

File:

- `server/routes/auth.js`

New flow when verification is disabled:

- return `200` with a stable success payload
- do not generate a new token
- do not send email

Suggested message:

- `当前未启用邮箱验证`

Reason:

- frontend may still call this path if it has stale UI state
- returning success avoids exposing mode differences as an error path

### Verify Email Endpoint

File:

- `server/routes/auth.js`

Behavior:

- keep the existing endpoint
- do not disable or remove it

Reason:

- historical verification links should continue working
- historical unverified accounts can still become verified if someone uses the old link later

## Frontend Design

File:

- `src/components/AuthModal.vue`

Current signup behavior:

- always expects a success message
- switches to login mode after signup
- does not process a token from signup

New behavior:

- after signup response:
  - if `data.token` exists:
    - call `setToken(data.token)`
    - call `fetchMe()`
    - emit success and close the modal
  - otherwise:
    - keep the current success-message flow

Reason:

- one frontend implementation supports both verification-required and verification-disabled deployments

## Error Handling

- Invalid email, duplicate email, weak password, and domain whitelist checks remain unchanged.
- SMTP configuration should become irrelevant when verification is disabled for signup/resend paths.
- Existing verify-email error redirects remain unchanged.

## Security and Tradeoffs

Benefits:

- Deployments can remove mailbox friction when desired.
- No schema change or migration is required.
- Default behavior stays conservative.

Tradeoffs:

- Disabling verification lowers assurance that an email belongs to the registering person.
- Existing unverified users become able to log in once the switch is off.

Accepted because:

- this is the explicit purpose of the deployment-level toggle

## Testing Strategy

Minimum regression coverage:

1. Config parsing
   - missing env => `true`
   - `false` => `false`
2. Signup when verification is required
   - returns success message without token
3. Signup when verification is disabled
   - user is created with `emailVerified: true`
   - response includes JWT token
4. Email login when verification is disabled
   - unverified legacy user can log in successfully
5. Resend verification when verification is disabled
   - returns success without mutating verification token

If the repository does not already have a formal backend test harness, use the lightest project-appropriate executable verification instead of introducing a full new framework only for this change.

## Implementation Notes

- Prefer extracting the verification-required branch into small local helpers only if it makes `auth.js` easier to read.
- Do not touch Prisma schema.
- Keep response shapes backwards-compatible except for the optional new `token` on signup success.

## Rollout

Default deployment:

- no change, because `EMAIL_VERIFICATION_REQUIRED` defaults to `true`

To disable verification in a deployment:

```ini
EMAIL_VERIFICATION_REQUIRED=false
```

Restart the backend after changing the env file.
