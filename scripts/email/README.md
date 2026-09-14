# Auth email templates

Four HTML emails for **Supabase → Authentication → Emails**. They live here
because they are not part of the site — nothing builds or deploys them, and
they only take effect once pasted into the dashboard. Same reasoning as
`scripts/sql/`.

| File | Dashboard template | Suggested subject |
|---|---|---|
| `confirm-signup.html` | Confirm signup | Confirm your LevlPrep account |
| `reset-password.html` | Reset password | Reset your LevlPrep password |
| `magic-link.html` | Magic Link | Your LevlPrep sign-in link |
| `change-email.html` | Change Email Address | Confirm your new LevlPrep email |

## Why bother

Supabase's defaults are a bare sentence and a naked URL. That matters more
here than it looks:

- **A missed reset email costs an account.** Unstyled mail with no branding
  and no sending identity scores worse with spam filters, and the one email
  that must arrive is the one whose failure is silent and permanent.
- **An unrecognised sender reads as phishing.** A student who has never seen
  your name in an inbox is being asked to click a link and type a password.
  The email should look like the site they just came from.
- **Every template says what to do if you did not ask for this.** That line
  is the difference between a confused student and a worried one.

## How they are built

Written for email clients, not browsers: tables rather than flexbox, every
style inline, no external CSS and no web font (Nunito is named first and
falls back to the system stack — it will not load in most clients, and
should not be relied on). The first `<div>` is hidden preheader text, which
is the grey line inboxes show next to the subject.

Each carries the button **and** the raw URL as text, because some clients
strip or mangle links.

## Things to check when you paste them

- **Expiry wording is deliberately vague** ("if it has expired, ask for a new
  one"). Supabase's link lifetime is configurable, so a specific number here
  could easily be wrong. If you set one explicitly, say it.
- `change-email.html` uses `{{ .Email }}` and `{{ .NewEmail }}`; the other
  three only need `{{ .ConfirmationURL }}`.
- Send yourself one of each after switching SMTP over, and open it on a
  phone. Test **reset** specifically — it is the flow whose failure is
  invisible.
