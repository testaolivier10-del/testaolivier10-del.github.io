# NREMT interactive lessons: spec and status

Source of truth for the NREMT lessons. Read it before NREMT lesson work and update it in the same commit as any
change. Open questions for a person: `docs/nremt-needs-author.md`.

## Owner brief (2026-10-26)

Olivier: the other courses have an interactive version of the textbook and NREMT does not. He approved building
NREMT lessons after a Read | Interactive toggle for the textbooks, a few chapters at a time, starting with the most
tested ones, each with an accuracy check. This branch is the plan and a pilot; nothing goes live until he says merge.

## Format

One lesson per textbook section (a `sections[]` entry of a chapter in `nremt/assets/study-notes.json`), the same
unit A&P and ochem use (one lesson per topic). A chapter with three sections gets three lessons.

Data: `nremt/data/lessons/<id>.json`, checked by `scripts/lib/nremt-lessons.mjs`:

| Field | What it holds |
|---|---|
| `id` | the file name; also the page name `nremt/lessons/<id>.html` |
| `title`, `chapter`, `section` | the section it teaches (`section` must be in that chapter) |
| `hook` | HTML: a short call that makes the section matter |
| `steps` | 3 or more `{ find, act }`: what the EMT finds and what they do (the NREMT form of A&P's cause and effect chain) |
| `ideas` | HTML bullets: the key ideas |
| `misconception` | `{ wrong, right }` |
| `check` | 3 or more questions `{ q, options[4], correct, why }` |
| `summary` | HTML: one paragraph |

The page has seven parts, in order: Why this matters, What you find and what you do, Key ideas, A common mistake,
Check yourself, Summary, What comes next. It is stepped like the A&P and ochem lessons: a rail with the parts,
Previous and Continue, the part in the URL hash, the last step remembered per lesson, and Continue held until the
step's questions are answered. Finishing every check question marks the lesson done (`nremt_lessons_v1` in
localStorage) and awards 40 XP the first time (`HubProgress.award('nremt', 40)`), the same as A&P.

Answer options are shuffled at build time with a seed from the question text, so the right answer's position has no
pattern and a rebuild never moves it.

## Engine

The A&P lesson scripts (`anatomy-physiology/assets/anp-lesson.js`, `anp-questions.js`) are tied to `AnpCore` and
the A&P question bank, so NREMT has its own small copy of the same behaviour:

- builder: `scripts/build-nremt-lessons.mjs` (`--check` in CI and `scripts/ci-local.sh`)
- page script: `nremt/assets/nremt-lesson.js`; styles: `nremt/assets/nremt-lesson.css`
- the page shell is the NREMT chapter pages' (`scripts/build-nremt-notes-pages.mjs`)

Links from the textbook: the builder writes `window.NREMT_LESSONS` (section id to lesson) between the
`nremt-lessons` markers in `nremt/study-notes.html`; the reader's `sectionHtml()` shows "Interactive lesson: ..."
under the section heading, and the chapter pages (`nremt/notes/*.html`) get the same link at build time.

Not yet: lesson questions do not go into the NREMT review queue (the queue holds bank question ids). Missed lesson
questions could be mapped to bank questions on the same section later.

## The Read | Interactive toggle

A separate branch adds a Read | Interactive switch to the textbooks of the courses that have lessons. NREMT plugs in
through `window.NREMT_LESSONS`: the switch reads the section's lesson from it, sends Interactive to
`lessons/<id>.html#why` and back to `notes/<chapter>.html#<section>` (or the reader at `#chapter-N`), and shows
Interactive as unavailable for a section with no lesson yet. When the toggle lands, the "Interactive lesson" link
under each section heading can go.

## Free and Premium

The other courses keep their early chapters' lessons free and the rest Premium (A&P: Foundations; ochem: the first
four chapters). The proposed NREMT rule is chapters 1 to 8 free (a fifth of the 40), the rest Premium, with the
notes always free. That needs Olivier's OK (`docs/nremt-needs-author.md`), so the pilot lessons are free and
`assets/premium.js` (`COURSES.nremt.freeChapters`) is unchanged.

## Accuracy rules

- Teach to current national EMS education standards and the NREMT EMT exam (2025 outline, five domains). Nothing
  beyond EMT scope of practice.
- A lesson only teaches what its textbook section already says. A new medical claim goes into the notes first, with
  its source, or into `docs/nremt-needs-author.md`.
- Every claim is checked against a current source before merge: the course's own notes, Stop the Bleed (American
  College of Surgeons), the current AHA guidelines, and the standard EMT texts. Contested points go to
  `docs/nremt-needs-author.md` rather than being guessed.
- Questions: four options of similar length and the same kind, one clearly right answer, an explanation that says
  why the right answer is right and the tempting wrong one is wrong.
- Every page ends with "For exam study only. Follow your local protocols and medical direction."

## Review process

1. The author writes the lesson from the section's notes.
2. An independent reviewer (strongest model, not shown the author's reasoning) checks every claim and every answer
   key against current sources and lists findings.
3. Findings are fixed and logged below. Anything a reviewer cannot settle goes to `docs/nremt-needs-author.md`.
4. Olivier reviews the pilot pages before merge.

## Build plan

| Batch | Lessons | Status |
|---|---|---|
| Pilot | Ch 12 Primary Assessment (1 section); Ch 29 Bleeding Control (3 sections) = 4 lessons | built, waiting for review |
| 1 | The most tested: Ch 9 Airway Management (5), Ch 10 Ventilation and Oxygen (3), Ch 11 Scene Size-Up (1), Ch 15 Secondary Assessment (1), Ch 19 Respiratory Emergencies (2), Ch 20 Cardiac Emergencies (2), Ch 21 Resuscitation (3) = 17 lessons | planned |
| 2 | The rest of assessment and medical: chapters 13, 14, 16 to 18, 22 to 28 = 20 lessons | planned |
| 3 | Trauma, environmental and OB: chapters 30 to 36 = 14 lessons | planned |
| 4 | Everything else in textbook order: chapters 1 to 8 and 37 to 40 = 25 lessons | planned |

Section counts in brackets; 80 lessons in all (one per section), 4 of them in the pilot.

Each batch is one PR with its accuracy review, built in textbook order inside the batch.

## Accuracy log

### Pilot (2026-10-26)

- Every claim in the four pilot lessons is taken from the Chapter 12 and Chapter 29 notes in
  `nremt/assets/study-notes.json`; no new medical claim was added.
- Checked against Stop the Bleed material (Global Medical Response, "Stop the Bleed: wound packing, applying a
  tourniquet"): tourniquet 2 to 3 inches above the wound and never over a joint, tightened until the bleeding
  stops; firm pressure on a packed wound for 3 to 8 minutes. The lesson says "at least 3 minutes", which matches.
- Neck wounds: the notes say they are "not packed in the usual sense"; the lesson keeps that wording instead of a
  flat "never pack the neck".
- Independent reviewer pass (2026-10-26, a separate agent not shown the author's reasoning): no wrong answer keys.
  Fixes applied:
  - Direct pressure: the soaked-dressing question's "add more layers" option was defensible from classic texts, so
    it is now "Add more gauze and ease off the pressure", and the stem says firm pressure has failed on a heavy
    bleed (answer: escalate with a tourniquet). "Never remove a dressing" and "don't pile on gauze" are softened to:
    don't peel the dressing off to look; if bleeding continues, escalate rather than relying on more layers
    (contested, `docs/nremt-needs-author.md` item 4). No more "check after 5 to 10 minutes": firm uninterrupted
    pressure, not lifted to check. Adult blood volume about 5 to 6 liters. Hemostatic agents "where protocol
    allows". Added: elevation and pressure points are no longer recommended.
  - Tourniquets: the "no single bone" rationale (the outdated two-bone rule) is gone: never over the elbow, wrist,
    knee or ankle, because the joint's structure stops the artery from being compressed and the nerves there can be
    injured (2023 joint position statement). Trigger: life-threatening limb bleeding (spurting, pooling, amputation)
    or bleeding pressure does not control. "High and tight" only for an unclear source or several wounds.
    Improvised tourniquets often fail (no windlass, too narrow). Neck wounds: occlusive dressing to prevent air
    embolism, pressure that does not compress the airway or both carotids, packing only with caution and per
    protocol.
  - Internal bleeding: no field fix for chest or abdominal bleeding, but long-bone and pelvic fractures are
    stabilized (splint, pelvic binder per protocol); supine, oxygen if indicated, warm, nothing by mouth even if
    thirsty, rapid transport.
  - Primary assessment: a patient who is not alert cannot be assumed to have an open airway, so it is assessed;
    noisy breathing is partial obstruction; jaw-thrust if spinal injury is suspected; OPA only without a gag reflex;
    no NPA with a suspected basilar skull or severe facial fracture. Pulse: present (radial, else carotid), rate,
    strength, regularity. Severe bleeding kills "within minutes". Altered mental status: hypoxia, shock or another
    cause such as hypoglycemia; oxygen if indicated, titrated to SpO2 at least 94%. One high-priority list, the same
    in the steps and the question, with poor general impression, complicated childbirth and chest pain with a
    systolic pressure under 100.
- The Chapter 12 and 29 notes still carry some of the older wording (for example "never remove a dressing", "check
  after 5 to 10 minutes", "no single bone"). Bringing the notes in line is a separate change for Olivier to approve
  (`docs/nremt-needs-author.md` item 4).
