# Study list: email signup for signed-out visitors (2026-11-12)

Status file. Owner asked (2026-11-12) for an email capture as part of the marketing plan; this reverses the
"not built" line in docs/reminders.md for signed-out visitors only.

## What it is
- A box at the end of every course home page and notes page (A&P `chapters/` too), signed-out visitors only,
  never a popup, gone for good once joined or closed (`levlprep_list` in localStorage).
  `assets/study-list.js`, mounted by `mountStudyList()` in `assets/site-chrome.js`.
- `POST /list/join` on the Worker (`worker/src/list.js`): Origin check and the shared throttle, a honeypot
  field, then one confirmation email with a signed link (CLASS_SECRET, kind `list-join`, 7 days). Nothing stored.
- `GET /list/confirm` shows one button (mail scanners open links); `POST /list/confirm` adds the contact to the
  Resend segment `RESEND_LIST_SEGMENT` ("Study list (site signups)", id in wrangler.toml).
- Storage is Resend contacts, no Supabase table. Broadcasts to the segment carry Resend's unsubscribe link.
- Analytics events: `list-shown`, `list-joined`, `list-closed` {course}. Course and source are signed into the
  token but not stored on the contact yet (needs Resend contact properties; open).
- privacy.html section `#study-list`.

## Owner steps
- Merge; the Worker deploys through `.github/workflows/deploy-worker.yml`.
- Check one real signup end to end (join, confirm email arrives, contact appears in the segment).
- Resend free plan: 100 emails a day shared with sign-in codes. Watch it in finals week.

## Sending to the list
- Resend broadcasts to the segment. Planned (docs: the LevlPrep Growth Plan doc): founding price notices 2 weeks,
  3 days and 1 day before 31 January 2027.
