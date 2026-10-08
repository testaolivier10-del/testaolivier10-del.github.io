# Trust and conversion plan (2026-10-08)

Status file for making LevlPrep trusted and turning visitors into buyers. Read this, not the chat history.

## Where we are (Supabase, 2026-09-24 to 2026-10-08)

| Step | Count |
|---|---|
| Page views, all courses | ~6,700 (includes owner testing and bots) |
| Accounts, ever | 4 (1 since Oct 1) |
| Premium gate shown | 644 |
| Clicked "interest" | 10 |
| Checkout started | 4 |
| Paid | 0 (no AP® Biology or AP® Chemistry pass ever bought, not even a test) |

Leaks, biggest first: checkout (4 → 0), signup (6,700 → 4), gate (644 → 10).

## Owner facts (given 2026-10-08; use these, invent nothing)

- Name: **Olivier Testa**, shown in full. No photo yet.
- EMT; passed the NREMT, and the exam shut off at 70 questions, studying with LevlPrep.
- UC San Diego pre-med.
- Why: tired of textbooks that just throw information at you; wanted interactive lessons that actually build
  on each other.
- Link the LevlPrep TikTok and YouTube. **Handles/URLs still needed from the owner.**
- Not anonymous any more: reverses PR #45 (`claude/anonymize-operator`).

Wording rule (FTC): the NREMT story is the founder's own result. Say it as that ("I passed…"), never as
typical ("students pass…").

## Plan

### A. Trust (build)
1. Revert PR #45: name back in `privacy.html` (data controller), `terms.html`, `LICENSE`, `index.html` schema
   (add a `Person` founder), `sw.js` CACHE bump.
2. `about.html`: who (EMT, NREMT at 70, UCSD pre-med), why (the textbook line), how content is checked
   (accuracy reviews, Beta label, `docs/*-needs-author.md` review promise), contact, TikTok/YouTube links.
   Linked from the footer, `premium.html` and the Premium dialog.
3. Founder line in the Premium dialog and on `premium.html`: first name, one sentence, "7-day full refund,
   one click" next to the buy button.
4. NREMT course: "Built by an EMT who passed at 70 questions" near the start (founder's result, not a claim
   about others).

### B. Conversion (build)
5. **Ask a parent to pay**: on AP® courses, a button that makes a shareable link to a parent page (what the
   pass is, price, 7-day refund, who runs the site, checkout). Biggest lever for under-18 buyers.
6. Later gate: let a student finish one full practice exam or unit free, then show the gate with their score
   and the goal ("5 more exams like this").
7. Account prompt at the right moment: after the first finished quiz, "Save your progress and streak across
   devices."
8. Email capture without an account (free cram sheet per course). Needs `POSTAL_ADDRESS` first (CAN-SPAM).
9. Video links: `?ref=<platform>-<topic>` deep links to the matching lesson; record `ref` in Umami so each
   video's signups show.
10. Price anchor on `premium.html`: $25 for the year vs typical tutoring/prep-book cost (sourced, no made-up
    competitor prices).

### C. Owner only
- Test-buy `bio-2027` and `chem-2027` with a 100% code, then refund (rules out a broken checkout). Check Polar
  for abandoned/failed checkouts on the 4 starts.
- Send the TikTok and YouTube URLs.
- Where you live now decides the business filings: Minnesota assumed name if you're a Minnesota resident;
  if you live in California, a fictitious business name (San Diego County) and California tax instead. The
  privacy page says Minnesota, so fix it if that's wrong.
- Later: real student quotes with permission; a teacher/clinical reviewer to name on the About page.

## Progress log

- 2026-10-08: plan written; nothing built yet.
