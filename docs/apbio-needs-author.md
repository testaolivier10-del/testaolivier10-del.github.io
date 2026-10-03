# AP® Biology: needs a person

Open questions, contested science and anything a human reviewer must confirm. Add to this file
instead of guessing. Each item: id, status (open / pending review / resolved), what, why, what the
course does meanwhile.

## Owner and policy

- **ced-verify** (open). apcentral.collegeboard.org is blocked from the build environment, so the
  topic map (`docs/apbio-dependency-map.json`) was built from secondary sources describing the
  fall 2025 CED. Someone with access should compare unit and topic titles and the exam format
  with the official CED. Meanwhile the course follows the cross-checked map.
  Specifically confirm: (1) topic titles and count (61: U1 7, U2 10, U3 6, U4 6, U5 5, U6 8,
  U7 12, U8 7; some pages still list 3.7 Fitness, which change reports say moved into 7.2);
  (2) science-practice weights (MCQ 25-33 / 16-24 / 8-14 / 8-14 / 8-14 / 20-26%, the 2019
  values; FRQ weights not found); (3) the paraphrased exclusions; (4) formula sheet contents;
  (5) stimulus set size (we use 4-5, as the owner asked); (6) long FRQ points (owner says 9,
  secondary sources say 8-10; we use 9); (7) exam date Monday 3 May 2027 (several schedules
  agree). Map summary with sources: `docs/apbio-ced-map.json`.
- **title-mark** (resolved 2026-10-03). Owner: use "AP® Biology", with the ®, in page titles
  (spec decision 3).
- **teacher-access** (open). The repo has no instructor request flow, so `bio/teachers.html` says
  "Teachers can ask for free access to the rest of the course: email hello@levlprep.com from your
  school address." The owner should confirm that offer (and how access is granted: a coupon, a
  Polar discount, a manual pass) or have the sentence changed.
- **class-discount** (open). No student or class discount exists (`assets/premium.js` has only the
  founding-member offer, 30% off for everyone until 2027-01-31, and `docs/premium.md` lists no
  other). The teachers page says "Ask about discounts for classes" at hello@levlprep.com. Decide
  whether there is one.
- **privacy-schools** (open). The teachers page links `privacy.html#schools`; that section does not
  exist yet (spec section 1 plans it). Until it does, the link lands at the top of the privacy page.
- **frq-gating** (open). The spec puts "all FRQs" in Premium. The FRQ pages gate the workspace
  (rubric, self-scoring) the way lessons are gated: free in Units 1 and 2, Premium elsewhere; the
  prompt and the printable sheet stay open everywhere so teachers can assign them. Confirm.
- **readiness-band** (open). The practice exam's readiness band (1-5) weights MCQ 60% and FRQ 40%
  and uses cut-offs 75/60/45/30% of the composite. It is labelled "Not calibrated: a rough guide,
  not a predicted score." Replace with better cut-offs if a teacher can suggest them.
- **teacher-review** (open). No AP® Biology teacher has reviewed the course. Beta badge and note
  stay until one signs off.

## Contested science

(none yet)
