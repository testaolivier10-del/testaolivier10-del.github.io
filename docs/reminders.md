# Study reminders: who gets asked (2026-11-10)

Status file for the reach fix. How reminders work (push, email fallback, the courier Worker, three unanswered sends
then quiet) is in README "Nothing brought anyone back" and `worker/README.md`. This file is about who is offered them.

## Why
Checked 2026-11-10: 1 push subscription ever (September), 0 email reminders, 34 accounts. The offer only appeared
after an NREMT exam and an ochem session, only NREMT and ochem reported what was due, a first visit was never asked,
and email (the only channel on most iPhones) was offered nowhere but privacy.html.

## Owner decisions (Olivier, 2026-11-10)
- Reminders stay opt in. Push cannot be on by default (the browser's own prompt), and email by default was rejected:
  spam reports would hurt sign-in codes and receipts, and privacy.html promises opt in.
- Offer them in every course at the end of a session, and ask once about email right after an account is made.
- Not decided: an optional "email me a reminder" box for signed-out students. Not built. The site still never asks a
  visitor for an address.

## What changed
- `assets/course/study.js` `wire()` offers reminders 3.4 s after every score card (`remind`), so every course and mode
  does. The save prompt (2.6 s) still wins the tie. NREMT and ochem keep their own calls; the asking gap makes the
  second one a no-op.
- `assets/reminders.js` `scanCourses()` runs on every page: for each course in `REMINDER_COURSES` (generated from
  `assets/courses.js` by `scripts/build-courses.mjs`) except NREMT and ochem, it reads `<storagePrefix>progress_v1`
  and counts the questions due by the next send time. A new course on the shared core is covered with no extra work.
  It reschedules when a number changed or once a day, which is also what tells the Worker the student came back.
- A first visit can be asked after a finished set of 8 or more (`offer(ctx, { earned: true })`). Still never on
  arrival, still only when something will be due, still three asks ever and quiet after two refusals.
- `channel()`: push where the browser allows it; otherwise email for a signed-in student ("An email when something is
  due?"); otherwise nothing.
- One question after a new account (`noteAccount`, `askAfterSignup`): an account made in the last 15 minutes is asked
  once about email, never while a dialog or the checkout is open (it waits, and tries on later pages for two days).
  It does not spend the three asks but does start the one week gap.
- Analytics: `reminder-prompt-shown` now carries `via` (`push` or `email`) and `at` (`score-card`, `signup`, and the
  two older values).

## Check after it is live
- `select count(*) from push_subscriptions; select count(*) from email_reminders;` a week later.
- Umami: `reminder-prompt-shown` by `at` and `via`, against `reminders-enabled`.
- Email sending: see the PR for what was verified.
