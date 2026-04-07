# Email Verification Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `server/.env` switch that controls whether email verification is required, and when disabled let email/password signups log in immediately.

**Architecture:** Keep the existing auth structure and introduce a single backend config flag, `EMAIL_VERIFICATION_REQUIRED`, that branches signup, login, and resend-verification behavior. Frontend signup handling becomes mode-aware by accepting either the existing success-message response or a new success response that includes a JWT token.

**Tech Stack:** Node.js, Express 5, Prisma, JWT, Vue 3, Vite

---

## File Map

- Modify: `server/config.js`
  - Parse and expose the new boolean env flag with a safe default.
- Modify: `server/.env.example`
  - Document the new toggle for deployments.
- Modify: `README.md`
  - Document how to disable email verification in deployment config.
- Modify: `server/routes/auth.js`
  - Branch signup, email-login, and resend-verify behavior on the new config flag.
- Modify: `src/components/AuthModal.vue`
  - Support auto-login when signup returns a JWT.
- Create: `server/scripts/verify-email-toggle.mjs`
  - Add a lightweight executable regression check for the new toggle behavior without introducing a full test framework.
- Modify: `server/package.json`
  - Add a script entry for the regression check.

### Task 1: Add a Backend Regression Check First

**Files:**
- Create: `server/scripts/verify-email-toggle.mjs`
- Modify: `server/package.json`

- [ ] **Step 1: Write the failing regression check**

Create `server/scripts/verify-email-toggle.mjs` with checks that assert the current source does not yet contain the toggle and does not yet support signup JWT handling. Start with logic like:

```js
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const configSource = readFileSync(join(root, 'config.js'), 'utf8');
const authSource = readFileSync(join(root, 'routes', 'auth.js'), 'utf8');
const modalSource = readFileSync(join(root, '..', 'src', 'components', 'AuthModal.vue'), 'utf8');

const failures = [];

if (!configSource.includes('EMAIL_VERIFICATION_REQUIRED')) {
  failures.push('config.js does not expose EMAIL_VERIFICATION_REQUIRED');
}

if (!authSource.includes('config.EMAIL_VERIFICATION_REQUIRED')) {
  failures.push('auth.js does not branch on EMAIL_VERIFICATION_REQUIRED');
}

if (!authSource.includes('res.json({ success: true, token')) {
  failures.push('signup path does not return a token for disabled verification');
}

if (!modalSource.includes('if (data.token)')) {
  failures.push('AuthModal signup flow does not handle token responses');
}

if (failures.length > 0) {
  console.error('Email verification toggle regression check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Email verification toggle regression check passed.');
```

- [ ] **Step 2: Add a script entry for the check**

Update `server/package.json` scripts to include:

```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
  "test:email-toggle": "node scripts/verify-email-toggle.mjs"
}
```

- [ ] **Step 3: Run the regression check to verify it fails**

Run:

```bash
cd server
npm run test:email-toggle
```

Expected:

- Exit code is non-zero
- Output reports missing `EMAIL_VERIFICATION_REQUIRED` handling

- [ ] **Step 4: Commit the failing-check scaffold**

```bash
git add server/package.json server/scripts/verify-email-toggle.mjs
git commit -m "test: add email verification toggle regression check"
```

### Task 2: Add the Config Toggle

**Files:**
- Modify: `server/config.js`
- Modify: `server/.env.example`
- Modify: `README.md`
- Test: `server/scripts/verify-email-toggle.mjs`

- [ ] **Step 1: Update backend config parsing**

In `server/config.js`, add explicit boolean parsing ahead of `module.exports`:

```js
const EMAIL_VERIFICATION_REQUIRED = process.env.EMAIL_VERIFICATION_REQUIRED !== 'false';
```

Then export it:

```js
  EMAIL_VERIFICATION_REQUIRED,
```

Place it near the SMTP and email-related config fields.

- [ ] **Step 2: Document the env toggle**

Add to `server/.env.example`:

```ini
# Email verification requirement (default true; set to false to allow instant email signup)
EMAIL_VERIFICATION_REQUIRED=true
```

Add to the deployment section in `README.md` near SMTP/email config:

```ini
# 是否要求邮箱验证（默认 true；设为 false 则注册后直接登录）
EMAIL_VERIFICATION_REQUIRED=true
```

And mention:

```md
若设置为 `false`，邮箱注册用户会在注册成功后直接登录，不再要求点击验证邮件。
```

- [ ] **Step 3: Run the regression check**

Run:

```bash
cd server
npm run test:email-toggle
```

Expected:

- Still fails
- Failure should now be limited to `auth.js` branching and frontend signup token handling

- [ ] **Step 4: Commit the config/docs change**

```bash
git add server/config.js server/.env.example README.md
git commit -m "feat: add email verification config toggle"
```

### Task 3: Implement Backend Auth Branching

**Files:**
- Modify: `server/routes/auth.js`
- Test: `server/scripts/verify-email-toggle.mjs`

- [ ] **Step 1: Update signup to support both verification modes**

Adjust the signup route so verification-only fields are conditional. Shape the core branch like:

```js
    const requireEmailVerification = config.EMAIL_VERIFICATION_REQUIRED;
    const verifyToken = requireEmailVerification
      ? crypto.randomBytes(32).toString('hex')
      : null;
    const verifyTokenExp = requireEmailVerification
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null;

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        username: cleanName,
        emailVerified: !requireEmailVerification,
        verifyToken,
        verifyTokenExp,
      },
    });

    if (requireEmailVerification) {
      sendVerificationEmail(user.email, verifyToken).catch(err => {
        console.error('Failed to send verification email:', err);
      });
      return res.json({ success: true, message: '注册成功，请查收验证邮件' });
    }

    const token = signJwt(user);
    return res.json({ success: true, token, message: '注册成功' });
```

- [ ] **Step 2: Update email login gate**

Replace:

```js
    if (!user.emailVerified) {
      return res.status(403).json({ error: '请先验证邮箱', needVerify: true });
    }
```

With:

```js
    if (config.EMAIL_VERIFICATION_REQUIRED && !user.emailVerified) {
      return res.status(403).json({ error: '请先验证邮箱', needVerify: true });
    }
```

- [ ] **Step 3: Update resend-verification behavior**

At the start of the resend route, add:

```js
    if (!config.EMAIL_VERIFICATION_REQUIRED) {
      return res.json({ success: true, message: '当前未启用邮箱验证' });
    }
```

Leave the verify-email route unchanged.

- [ ] **Step 4: Run the regression check**

Run:

```bash
cd server
npm run test:email-toggle
```

Expected:

- Still fails only on frontend signup token handling

- [ ] **Step 5: Commit the backend auth change**

```bash
git add server/routes/auth.js
git commit -m "feat: add backend email verification toggle"
```

### Task 4: Implement Frontend Signup Auto-Login

**Files:**
- Modify: `src/components/AuthModal.vue`
- Test: `server/scripts/verify-email-toggle.mjs`

- [ ] **Step 1: Update signup success handling**

In `handleSignup`, replace the current success-only branch:

```js
    if (data.success) {
      successMsg.value = data.message;
      mode.value = 'login';
    } else {
      error.value = data.error;
    }
```

With:

```js
    if (data.success) {
      if (data.token) {
        setToken(data.token);
        await fetchMe();
        emit('success');
        emit('close');
      } else {
        successMsg.value = data.message;
        mode.value = 'login';
      }
    } else {
      error.value = data.error;
    }
```

- [ ] **Step 2: Run the regression check**

Run:

```bash
cd server
npm run test:email-toggle
```

Expected:

- Exit code is zero
- Output says the email verification toggle regression check passed

- [ ] **Step 3: Commit the frontend signup update**

```bash
git add src/components/AuthModal.vue
git commit -m "feat: auto login after signup when verification is disabled"
```

### Task 5: Final Verification

**Files:**
- Verify: `server/config.js`
- Verify: `server/routes/auth.js`
- Verify: `src/components/AuthModal.vue`
- Verify: `server/.env.example`
- Verify: `README.md`
- Verify: `server/scripts/verify-email-toggle.mjs`

- [ ] **Step 1: Run the backend regression check fresh**

Run:

```bash
cd server
npm run test:email-toggle
```

Expected:

- PASS with `Email verification toggle regression check passed.`

- [ ] **Step 2: Build the frontend**

Run:

```bash
npm run build
```

Expected:

- Exit code is zero
- Vite build completes successfully

- [ ] **Step 3: Review the final diff**

Run:

```bash
git diff -- server/config.js server/.env.example server/routes/auth.js server/package.json server/scripts/verify-email-toggle.mjs src/components/AuthModal.vue README.md
```

Expected:

- Only the planned files change
- No unrelated auth or schema changes

- [ ] **Step 4: Final commit**

```bash
git add server/config.js server/.env.example server/routes/auth.js server/package.json server/scripts/verify-email-toggle.mjs src/components/AuthModal.vue README.md
git commit -m "feat: add email verification environment toggle"
```
