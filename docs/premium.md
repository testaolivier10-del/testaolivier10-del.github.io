# Premium: the plan

Every course on LevlPrep is free today, and nothing in this repo charges
anyone. This file is the plan for when that changes and the research behind
it, so the decision is made from numbers rather than from a mood.

Researched September 2026. Several competitor prices came from search results
rather than the vendors' own pages. Check the ones marked † in a browser
before setting a price against them.

## Where we are: Phase 0, asking

The site is new, and a paywall on a new site mostly costs visitors. So the
first step is a question rather than a gate:

- **`assets/premium.js`** puts a "Premium is coming" card at the end of a
  real session: the NREMT results screen (10+ questions) and the ochem
  practice summary (8+ questions). Its button opens a dialog listing what
  Premium would include and what stays free, and asks for an email.
- **`join_waitlist()`** in `scripts/sql/schema.sql` stores the address, the
  course and which card it came from. `scripts/sql/reports.sql` has the query
  that reads it back.
- **Umami** counts `premium-interest` (opened the dialog) and
  `premium-waitlist-joined` (left an address).
- **`privacy.html#waitlist`** says what is stored and that it is used for one
  launch email only. Deleting an account removes the entry.

Nothing is locked. The free/premium lists in `COURSES` at the top of
`premium.js` are the plan written down; they are shown in the dialog, not
enforced anywhere.

### Before this means anything

**Move sign-in email off Supabase's built-in mailer.** See Part 1 of
`docs/auth-setup.md`. Paying users will rely on sign-in links and password
resets arriving, and the built-in mailer allows a handful of messages an hour
across the whole project.

## When to build the paywall

Decide on signals, not a date. Build when, for a course, **both** hold:

1. **Steady returning users.** Roughly 500+ active a week, with a healthy
   share coming back on a second day (the `returned-second-day` and `visit`
   events already measure this).
2. **The waitlist says yes.** Over 2–4 weeks and at least 300–1,000 sessions:
   - `premium-interest` ÷ `exam-finish` (or `ochem-session-finish`) above
     about 5%;
   - with real addresses arriving in `premium_waitlist`, not just clicks.
     Clicks come from curiosity and misreads; a typed address is intent.

Under about 1–2% means keep growing for free and ask again later.

**Ochem timing:** fall finals are in December and demand peaks right before
exams, so a launch by mid-November catches the biggest spike of the term.
If the numbers are not there by then, aim for the spring semester.

## The model, once it is time

### Freemium, per course, same rule everywhere

**Teach for free, charge for serious practice.** Free content is how people
find the site, and every ochem competitor gives its teaching away (Chad's
Prep, The Organic Chemistry Tutor, Khan Academy, Master Organic Chemistry's
articles). What students pay for is practice volume, exam simulation and
analytics.

- **Always free, every course:** all teaching and reference material; the
  first ~20–25% of the course fully unlocked; progress, XP and streaks.
- **Premium, every course:** unlimited practice, exam simulation,
  readiness/mastery analytics, spaced review of mistakes, unlimited AI tutor.
- **Never locked:** progress someone has already earned.

The per-course detail is `COURSES` in `assets/premium.js`.

**Where to ask:** about half of purchases happen on the first day, right after
a moment of clear value (RevenueCat, 2025). For NREMT that is the results of
the one free timed exam; for ochem, finishing the free chapters or opening a
locked lesson.

**Why per course, not one site-wide plan:** the two audiences barely overlap
(EMT students vs. college chemistry students), and they buy on different
timelines. A bundle can be added later without changing anything.

### One-time passes, not subscriptions

Both courses have a fixed end date: an exam, or a semester. Passes match
that, and they avoid auto-renewal rules. The FTC's click-to-cancel rule was
vacated in July 2025 but the FTC restarted the rulemaking in March 2026, and
California's stricter auto-renewal law took effect in July 2025. Passes also
cut refunds: education already has the highest refund rate of any app
category. And they are simpler to build: access is just "premium for this
course until this date."

### Prices to start with

| Course | Pass | Price | Anchors |
|---|---|---|---|
| NREMT | 90 days | **$29** (launch/waitlist $19) | Pocket Prep $39.99 per 3 months, auto-renewing, 1,030 EMT questions; Limmer EMT PASS $32.99 one-time; video courses $100–150 |
| Ochem | Semester (~5 months) | **$39** | Chad's Prep $9.99/mo; Master Organic Chemistry $12.95/mo, $99/yr† |
| Ochem | Full year | **$59** | Most students take Orgo I and II |
| Ochem | 30-day finals pass (optional) | **$15** | Demand spikes before exams |

- **NREMT pass guarantee:** fail the exam and your access is extended free
  until you pass. It costs almost nothing, and every serious competitor has
  one.
- **Existing users:** everyone with an account before launch gets 30 days of
  Premium free plus the launch price. Announce it two weeks ahead.

### Payments

Start with a **merchant of record**, which sells on your behalf and handles
sales tax and VAT: **Polar** or **Paddle**, about 5% + $0.50 a sale. EU VAT
applies from the first euro for a non-EU seller, and ochem draws
international students.

- **Stripe direct:** 2.9% + $0.30, but you file the taxes yourself. Switch
  once volume justifies it.
- **Lemon Squeezy:** being folded into Stripe; skip it.
- **Gumroad:** about 13% a sale; too expensive.

How it plugs in:

1. The provider's webhook reaches the Cloudflare Worker (`worker/`).
2. The Worker writes `{ user, course, expires_at }` to a Supabase table.
3. `premium.js` switches from asking to checking that table.

Start with a **soft gate**: the page hides locked parts, so a determined
visitor can still get the content. Only move premium content behind the
Worker (a hard gate) once revenue justifies the work, since GitHub Pages
serves every file publicly.

### Other revenue

- **EMT school licenses: probably the biggest opportunity.** Programs already
  pay per student for testing tools (Fisdap about $31.50, EMSTesting about
  $52), and Pocket Prep sells an instructor dashboard. A per-class license
  with a simple instructor view means one sale reaches a whole class and the
  school pays. Start once individual passes work.
- **Ads: no.** They pay little at this size and hurt trust in a study tool.

### Credibility

Limmer sells on "zero AI" questions and a former NREMT executive director.
For a new medical-exam brand, accuracy is the product. Keep `sources.html`,
the report button and the changelog prominent. A pass guarantee also signals
confidence in the questions.

## Sources

- RevenueCat, *State of Subscription Apps 2025*: conversion by paywall type,
  refund rate by category, day-0 conversion share.
- Lenny Rachitsky / OpenView: freemium conversion benchmarks (3–5% good,
  6–8% great).
- Pocket Prep EMS pricing (pocketprep.com, App Store); Limmer EMT PASS
  (lc-ready.com); Chad's Prep pricing†; Master Organic Chemistry plans†;
  Fisdap price list.
- Gibson Dunn and Steptoe on the FTC negative-option rule; Cooley on the
  California auto-renewal law amendments.
- Paddle, Polar, Stripe Managed Payments and Gumroad fee pages, 2026.
