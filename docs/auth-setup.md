# Auth setup runbook

Everything that has to be configured outside this repo for sign-in to work
properly. None of it is code; all of it is dashboards.

**Facts this assumes** — Supabase project `bsfcqrczehbcctwhxmrj`, domain
`levlprep.com`, DNS hosted at **Cloudflare**, mail via **Resend**.

Do it in this order. Part 1 is the one that matters: until mail is reliable,
a forgotten password is still an orphaned account.

---

## Part 1 — Email (required)

Supabase's built-in mailer is a development convenience: a handful of messages
an hour **counted across the whole project, not per user**, from a shared
sender your students have never seen. Two people asking for a link in the same
hour can starve the third, and unauthenticated mail from an unfamiliar domain
lands in spam. The one email that must arrive — the password reset — is the one
whose failure is silent and permanent.

### 1.1 Resend account and domain

1. Sign in at **resend.com**.
2. **Revoke any API key that has ever been shown in a screenshot, chat or
   screen share.** A Resend key can send mail as your domain; a leaked one
   means someone else phishing from `levlprep.com`, and a burnt sending
   reputation is not something you can undo.
3. **Domains → Add Domain → `levlprep.com`.**
4. Resend shows about three DNS records — typically a DKIM record, an SPF
   `TXT`, and an `MX`. Leave this page open.

### 1.2 Cloudflare DNS

Do this on a laptop. Adding DNS records on a phone is miserable.

1. **dash.cloudflare.com → `levlprep.com` → DNS → Records → Add record.**
2. Add each record exactly as Resend lists it.

Three traps, in the order people hit them:

- **Grey cloud, not orange.** Any `CNAME` must be set to **DNS only**, not
  Proxied. Proxying a DKIM record is the single most common reason Resend
  never verifies on Cloudflare.
- **Don't type the domain twice.** Cloudflare appends it for you. Enter
  `resend._domainkey`, not `resend._domainkey.levlprep.com`.
- **Check Email Routing.** If it has ever been switched on it adds its own
  `MX` records, which collide with Resend's. (As of writing `levlprep.com`
  has no `MX` at all, so this is probably already fine.)

3. Back in Resend, wait for the domain to read **Verified**. Minutes usually,
   up to an hour occasionally.

### 1.3 Supabase SMTP

1. **Supabase → Project Settings → Authentication → SMTP Settings → enable
   custom SMTP.**

   | Field | Value |
   |---|---|
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | your **new** Resend API key |
   | Sender email | `noreply@levlprep.com` |
   | Sender name | `LevlPrep` |

2. **Authentication → Rate Limits → emails per hour.** Raise it deliberately.
   **Turning on custom SMTP does not lift the cap by itself** — it only lets
   you set one. This step is the one people miss and then wonder why mail
   still stops.

> The sender **cannot** be a Gmail address. You can only authenticate mail for
> a domain you control, and Gmail's DMARC policy will cause outright
> rejections. Gmail stays fine as the contact address on `privacy.html`.

### 1.4 Email templates

**Authentication → Emails.** Paste in the four from `scripts/email/`:

| File | Template | Subject |
|---|---|---|
| `confirm-signup.html` | Confirm signup | Confirm your LevlPrep account |
| `reset-password.html` | Reset password | Reset your LevlPrep password |
| `magic-link.html` | Magic Link | Your LevlPrep sign-in link |
| `change-email.html` | Change Email Address | Confirm your new LevlPrep email |

### 1.5 Redirect URLs

**Authentication → URL Configuration.** Site URL `https://levlprep.com`, and
under *Redirect URLs* add `https://levlprep.com/**`.

The reset link returns to `/`; everything else returns to whatever page the
student started on. Without the wildcard those redirects are rejected and the
links appear broken.

---

## Part 2 — Account linking (check before Part 3)

**Authentication → Providers / Settings**, wherever your project exposes
identity linking.

If someone signs up with `sam@gmail.com` and a password, then later presses
*Continue with Google* with that same address, whether those become **one**
account or **two** depends on this setting. Two accounts means their streak is
in one and their session is in the other — and progress is the entire reason
accounts exist here. Decide this deliberately before any provider goes live.

---

## Part 3 — Google sign-in (optional)

Nothing in this repo needs changing. `assets/account.js` asks the project what
is enabled and renders whatever it finds, so **enabling the provider is
enough** — no commit, no deploy. It appears within 12 hours at the outside and
usually on the next page load.

1. **Google Cloud Console → APIs & Services → Credentials → Create OAuth
   client ID → Web application.**
2. Authorised redirect URI — exactly this:
   `https://bsfcqrczehbcctwhxmrj.supabase.co/auth/v1/callback`
3. Configure the **OAuth consent screen**. While it is in *Testing*, only
   accounts you list by hand can sign in, so **publish it** before launch.
4. **Supabase → Authentication → Providers → Google →** enable, paste the
   client ID and secret.

Apple and GitHub work identically. Apple needs a paid developer account;
GitHub is free and takes about two minutes, which makes it the cheapest way to
prove the whole OAuth path works end to end.

---

## Part 4 — Test before trusting it

In a private window, on a phone if you can:

- [ ] **Sign up** with a real address. The confirmation arrives, looks like
      LevlPrep, and the link works.
- [ ] **Reset a password.** This is the one to test hardest — its failure mode
      is silent. Check the spam folder even if it arrives.
- [ ] **Request a sign-in link** and open it.
- [ ] **Sign in on a second device** and confirm your level and streak follow.
- [ ] **Sign out**, then reopen the login — the email field should be empty
      (it is cleared deliberately, for shared computers).
- [ ] If a provider is live: sign in with it, then try signing in with a
      password on the same address and confirm you get the explanation rather
      than a dead end.

---

## What is already done in code

For the avoidance of doubt, none of the below needs configuring — it ships in
`assets/account.js` and `assets/theme.css`:

password reset and recovery screen; magic links; resend-confirmation;
runtime provider discovery; humanised error copy; password strength and reveal;
Caps Lock warning; email typo correction; focus trap, Escape and scroll lock;
push-before-sign-out; last-method memory and the passwordless-account
explanation; and the `auth-*` analytics funnel.
