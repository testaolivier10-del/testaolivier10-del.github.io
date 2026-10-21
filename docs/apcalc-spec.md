# AP® Calculus AB course: spec and status

The source of truth for LevlPrep's seventh course. A fresh session reads this file, `CLAUDE.md`,
`docs/apcalc-research/framework.md` and `docs/apcalc-research/market.md`, not the chat history. When the
plan changes, update this file in the same commit. Open points for a person go in
`docs/apcalc-needs-author.md`. Formats: `docs/apcalc-architecture.md`; writing rules:
`docs/apcalc-authoring-guide.md`; map: `docs/apcalc-phase0.md`.

Course key `apcalc` (storage, analytics, registry, SQL). URL path `/calculus/`. Every new browser global
starts with `ApCalc`. Question ids start `calc-`, CSS classes `calc-`. Template: the AP® Physics 1 course
(`docs/apphys-spec.md`, `docs/apphys-architecture.md`, `docs/apphys-authoring-guide.md`), the newest fork
and the one whose tool layout lets builders work in parallel.

## 1. Owner brief (2026-10-13), condensed

- Seventh course, chosen by the owner from a short list (Calculus AB, Statistics, Psychology): a large
  audience and, like physics, content whose every answer can be checked by code, which keeps risk low while
  no course has had an expert review.
- Build it the same way as AP® Physics 1: research, build everything, independent accuracy reviews, one PR
  the owner reviews.
- Tools at the bar of the NREMT body map and the AP® Physics 1 free-body diagram trainer or better:
  interactive, visual, simple on landing with depth revealed progressively, never a dead end, professional
  illustration quality.
- Continuity with the other six courses; own identity.
- Pricing as the other AP® passes: $25 one-time through 30 June 2027 ($17.50 founding price).

## 2. What the research says (details and URLs in `docs/apcalc-research/`)

**Framework.** CED (2019 framework, 2020 update; content unchanged since). 8 units; AB has 81 topics:
1.1-1.16, 2.1-2.10, 3.1-3.6, 4.1-4.7 (L'Hospital's rule is AB), 5.1-5.12, 6.1-6.10 and 6.14, 7.1-7.4 and
7.6-7.8, 8.1-8.12. BC-only and excluded: 6.11-6.13 (parts, partial fractions, improper integrals), the BC
techniques in 6.14, 7.5 Euler's method, 7.9 logistic, 8.13 arc length, Units 9-10. Weights (current course
page): U1 10-15%, U2 10-15%, U3 5-10%, U4 10-15%, U5 15-20%, U6 15-20%, U7 5-10%, U8 10-15%. Practices:
1 Implementing Mathematical Processes, 2 Connecting Representations, 3 Justification, 4 Communication and
Notation (FRQ only). Units 3-8 learning objectives were not text-verified against the PDF (needs-author).

**Exam (Mon 10 May 2027, morning).** New 2027 timing: Section I Part A 29 MCQ without calculator, 62 min;
Part B 13 MCQ with graphing calculator, 38 min (42 MCQ, 50%). Section II Part A 2 FRQs with calculator,
30 min; Part B 4 FRQs without, 60 min (6 FRQs × 9 points = 54, 50%). MCQ on screen in Bluebook, FRQs
handwritten. Calculator answers to three decimal places with the setup shown; the four required calculator
capabilities: graph, zeros, numerical derivative, numerical definite integral. Recurring FRQ types: rate in
context from a table, modeling with a given function, particle motion, area and volume, differential
equation with slope field, graph of f′ / graphical FTC, implicit differentiation and related rates, table of
f, g, f′, g′.

**Scores.** About 286,000 takers in 2025; 3+ rate 64% (2025), 65% (2026), about 20% fives. No published
cut scores.

**Where students lose points.** Justifications that do not name the theorem and check its hypotheses (IVT,
MVT, EVT), "f′ = 0 so max" without a sign change, global vs local extrema (candidates test), missing units,
Riemann sums with unequal widths, chain rule slips, equals-sign linkage errors, accumulation functions without
the initial condition, volumes missing π, separation of variables without the constant or with the wrong
domain. Full list in the framework file.

**Market.** Fiveable $79/yr; UWorld about $149; Albert $79/subject; books about $28-30; Krista King
$39/mo; free Khan, Professor Leonard, Organic Chemistry Tutor, Paul's Online Notes, Desmos. Gap: practice
with feedback on justifications and multi-representation (graph/table/formula) reasoning, and interactive
visual tools tied to exam-style items.

## 3. Positioning and what makes it better

Free forever: notes and textbook pages, glossary, flashcards, unit sheets, formula page, score calculator,
unit practice tests. Premium ($25 one-time, through 30 June 2027): unlimited practice, exams, every lesson,
analytics, every trainer.

1. **Tangent tracer (flagship).** Drag a point along a curve; the secant becomes the tangent as h → 0, the
   derivative graph draws itself live beneath, and the student predicts and sketches f′ from f (graded).
2. **Every representation linked.** Graph, table, formula and words for the same function, as the exam asks.
3. **Justification trainer** built on the scoring guidelines: name the theorem, check its hypotheses, state
   the conclusion; an answer that earns the point and one that loses it.
4. **Expression answers graded properly.** Students type an expression (a derivative, an antiderivative, a
   tangent line); it is graded by evaluating against the key at many points (`expr` items), not by string
   matching.
5. **Calculator and no-calculator practice** exactly as the exam splits them, with the three-decimal rule.
6. **Exam-faithful practice**: 4-option MCQ in stimulus sets (graphs, tables), the 6 FRQs with 9-point
   rubrics and full-credit samples, full-length timed exams in the 2027 split.
7. **From zero, in CED order, nothing used before it is taught**, with a "Math you need" chapter
   (functions and graphs, exponentials and logs, trigonometry and the unit circle, inverse functions,
   algebra skills for limits).

## 4. Continuity with the other courses

Built exactly like AP® Physics 1 (decision 1), so every shared page type matches: home, units, lessons,
notes, unit sheets, glossary, flashcards, practice, review, exams, FRQ, justify, dashboard, search, tools,
cram, teachers, formula sheet page, score calculator, unit tests. Same shared layer, Tool Studio, item
formats (plus `expr`), Beta badge, "not yet reviewed by an AP® teacher" note and trademark rules. Identity:
own accent colour, icon, headline and rank names.

## 5. Build plan

One branch, `claude/apcalc`, one PR at the end.

| Phase | What | Status |
|---|---|---|
| R | Research: `docs/apcalc-research/framework.md`, `market.md` | **done 2026-10-13** |
| 0 | Fork AP® Physics 1: map (81 topics + math chapter), dependency map, generator, runtime `calculus/assets/`, math expression parser and `expr` items, plots, checks, tests, fixture, registration hidden until published (registry, Premium pass, Worker, SQL migration, hub/pricing, search, sitemap, OG, budgets, theme, sw.js), tool scaffolding, docs | **done 2026-10-13** (`docs/apcalc-phase0.md`, `docs/apcalc-architecture.md`) |
| 1 | Content: every unit's lessons, notes, banks, FRQs, glossary, figures | **done 2026-10-13**: 88 topics, 1392 bank questions, 21 FRQs, 136 glossary terms |
| 2 | Trainers (section 6) | **done 2026-10-13**: all 10, each with Explore, a seeded drill, a validator and tests; phone legibility pass (`docs/tools-phone-pass/calc-*.md`) |
| 3 | Justification trainer, two fixed practice exams, formula page, score calculator, unit tests, cram kit | **done 2026-10-13** (decision 11) |
| 4 | Independent accuracy checks per unit and for tools/exams; fixes | **done 2026-10-13**: `docs/apcalc-reviews/` (u1, u2-3, u4-5, u6, u7-8, tools-a/b/c, exams, and the authors' self-checks); open points in `docs/apcalc-needs-author.md` |
| Launch | Publish, generators, continuity pass, seven-course wording, full CI with browser checks, PR | **done 2026-10-13** (decision 12); Premium not on sale until the section 8 checklist |

Quality bar: AP® Physics 1 authoring rules; every numeric key and expression key checked by code; every
graph drawn from the function it claims to show; independent accuracy review.

## 6. Trainers

| Slug | Unit | What |
|---|---|---|
| `limit-explorer` | 1 | Zoom into a graph near a point; one-sided limits, holes, jumps, asymptotes, continuity types, squeeze; table of values closing in |
| `tangent-tracer` | 2 | Flagship. Secant to tangent as h → 0, live f′ graph, sketch f′ from f and be graded |
| `rule-drills` | math chapter then 2-3 | Step-by-step derivative builder: power, product, quotient, chain, implicit, inverse; expression steps graded by evaluation |
| `related-rates` | 4 | Animated scenes (sliding ladder, filling cone, shadow, expanding circle) with live rates and the chain of equations |
| `motion-lab` | 4, 8 | Particle on a line: position, velocity, acceleration graphs; speeding up/slowing down; displacement vs total distance |
| `curve-analyzer` | 5 | f, f′, f″ linked; sign charts; extrema and inflection with justification; candidates test; optimization scenes |
| `riemann-sums` | 6 | Left, right, midpoint, trapezoid on functions and on tables with unequal widths; over/under estimates |
| `accumulation` | 6, 8 | g(x) = ∫ f from a graph of f; area accumulating; FTC both parts; net change |
| `slope-fields` | 7 | Draw slope fields, trace solution curves through a point, separation of variables, exponential models |
| `area-volume` | 8 | Area between curves; volumes by discs/washers about a line and by cross sections, in 3D |

Free: `tangent-tracer` (flagship), `limit-explorer`, `rule-drills`; the rest Premium. Owner to confirm.
Scaffolded in Phase 0 (four files per slug, `docs/apcalc-architecture.md`, "Tools"); nothing builds until
a tool's data file exists and its topic is published.

## 7. Decisions log

1. (2026-10-13) **Fork the AP® Physics 1 runtime**, as physics forked chemistry.
2. (2026-10-13) **No "ap" in any served path.** Folder `/calculus/`, files `calc-*.js`, ids `calc-`.
   Registry/storage key `apcalc`.
3. (2026-10-13) **Pass and price mirror the other AP® courses:** `calc-2027`, $25 one-time, through
   30 June 2027, registered `onSale: false` until the owner checklist is done.
4. (2026-10-13) **Sources:** College Board CED, scoring guidelines and Chief Reader Reports for scope and
   common errors only, in our own words. No released exam questions reproduced or adapted.
5. (2026-10-13) **Exam format is the May 2027 one** (29/62 + 13/38 MCQ; 2/30 + 4/60 FRQ, 9 points each).
   Default exam date Mon 2027-05-10.
6. (2026-10-13) **Identity and registration.** Crimson accent (`--cink` `#8C1036`, 9.4:1 on white; dark
   `#F7B8CA`), integral icon, headline "AP® Calculus AB, one idea at a time.", ranks Limit Seeker, Slope
   Finder, Chain Linker, Rate Relater, Curve Sketcher, Area Builder, Calculus Legend; manifest and OG
   "Calculus". Registered `hidden` (order 7) with every AP® Physics 1 registration point twinned; the hub
   keeps "Six courses" until launch. SQL migration `2026-10g-apcalc.sql` written, not applied.
7. (2026-10-13) **Math is TeX rendered to MathML at build time** by our own subset renderer
   (`calc-math.js`), no third-party library, so pages work offline; the TeX stays in an annotation and
   the ordering check scans it through each concept's `notation` patterns.
8. (2026-10-13) **Expression answers by evaluation.** `expr` items are graded by our own parser
   (`calc-expr.js`, no eval) at 40 seeded points; antiderivatives compare up to a constant and require
   `+ C`. Numeric answers: three-decimal rule on calculator items, exact forms otherwise, units only when
   `askUnit`.
9. (2026-10-13) **Calculator parts link out, never embed.** Each calculator part links to the free Desmos
   graphing calculator in a new tab.
10. (2026-10-13) **Score cut-offs 64/48/37/27 are placeholders**, labelled "Not calibrated" (needs-author
    `score-cutoffs`).
11. (2026-10-13, Phase 3) **Exams, trainer and entry pages**, as AP® Physics 1 decision 10 in the May 2027 format.
    - Two **fixed practice exams** (`calculus/data/exams/forms.json`): Section I Part A is 29 no-calculator bank
      questions (none a lesson-check item; 7 stimulus sets of 3-4 in form 2, 6 of 3-4 in form 1), Part B is 13
      **exam-only calculator items** per form (`items.json`, `calc-exam-<form>-<nn>`: a storage-tank set in form 1
      and a particle-motion set in form 2, each drawn from its function, plus single questions), because the
      bank's few calculator singles sit one or two to a set. Units, both forms: U1 5, U2 5, U3 4, U4 5, U5 8,
      U6 8, U7 3, U8 4. Section II: form 1 `frq-u6-table-2`, `frq-u8-region-exponential` (calculator), then
      `frq-u5-graph-fprime`, `frq-u7-slope-field-tangent`, `frq-u4-motion-two-particles`, `frq-u3-implicit-oval`;
      form 2 `frq-u6-model-1`, `frq-u8-particle-calculator`, then `frq-u6-graph-2`, `frq-u8-region-two-parabolas`,
      `frq-u7-equilibrium-cosine`, `frq-u5-fg-table`. No question or FRQ in both. Every key is recomputed in
      `EXAM_NUMBERS` (own Simpson, bisection and difference code, with side checks such as the candidates test) and
      every option graded through `ApCalcQuestions.grade` in the test.
    - **Justification trainer**: 33 prompts (`calculus/data/justify/<unit>.json`, 4-5 per unit) on the reader-report
      misses: IVT, MVT and EVT with hypotheses, continuity's three conditions, differentiability from one-sided
      difference quotients, L'Hospital's form shown first, chain and implicit steps, inverse derivative at a point,
      sign changes for extrema and inflection, the candidates test, vertical tangents, speeding up and direction
      changes, left sums with unequal widths, meaning with units, reversed limits, separation with + C, tangent-line
      over/under from d²y/dx², distance vs displacement, washers about a line, average value. `JUSTIFY_SKILLS` adds
      `rules` and `setup`; every number is in `JUSTIFY_NUMBERS`. Model answers are rendered on their own
      (`answer` is a raw key for questions).
    - **Formulas you must know** (`EQ`, `NOT_ON` in `scripts/lib/apcalc-entry.mjs`): 56 rows in seven groups
      (limits, derivative rules, theorems and curve analysis, integrals and the FTC, motion and accumulation,
      differential equations, area and volume), each with what it is, when to use it, the topic that teaches it and
      the live trainers that practise it; six "easy to forget" lines.
    - **Score estimate**: 50 × MCQ/42 + 50 × FRQ/54, **estimated cut-offs 66/49/40/23**, fitted to the 2024-2026
      distributions with the 2024 and 2025 FRQ statistics (needs-author `score-cutoffs`), labelled estimates, equal
      to the readiness band (test). Supersedes decision 10.
    - Unit tests (12 bank questions per unit, no exam-only items) and the cram kit (exam day n opens practice exam n,
      two justification prompts on study and weak-spot days, timed sets at 100/42 min a question) were built in
      Phase 0 and are now tested against the real forms and prompts.

12. (2026-10-13, launch) **Published, Premium not on sale**, as AP® Physics 1 decision 11.
    - All eight units and `skills-math` in `calculus/data/published.json`; registry `status: 'beta'`; every
      generator rerun (course, courses, pricing, OG tags, sitemap, crumbs, Worker). Hub and 404 cards say "All 88
      published topics". `sw.js` cache v79. Changelog entry (with the phone legibility pass for every trainer).
      `onSale: false` stays, so Premium shows "coming soon", locks nothing, and the account page lists the course
      only to an account holding a pass.
    - Seven courses: the hub hero's generated count ("Seven courses", "See all seven courses"), the hero lede and
      meta description (no "AP" in the meta), the manifest, `search.html` (lede, meta, noscript links),
      `sources.html` (new AP® Calculus AB section), the Premium rules and `terms.html#fixed-date` (generated) name
      every course or dated pass.
    - **Bank files split by size**: `bankFile` packs a unit's topics in course order into files of at most 44 KB
      gzipped (`<unit>`, or `<unit>-a`, `-b`, ...), replacing the physics rule (more than 10 topics → halves), since
      MathML and plotted stimuli made five unit files 51-86 KB against the 48 KB budget (now 20 files).
    - Publishing turned on the site checks for `calculus/`: British spellings in data (canceled, labeled, gray,
      practices, colors); eight notes descriptions pointing at earlier pages and one ending on a colon
      (`descriptions.json` notes); three trainer descriptions over 160 characters (`pages.json`); the two FTC notes
      had the same cut title (`descriptions.json` gains `titles`, a shorter name for the `<title>`: "The FTC and
      ..."). The near-duplicate rule (`check-apcalc-content.mjs`) counts each `$...$` span as one word and a set
      item's stimulus title, so stems that differ only in their math or region are not flagged (20 false
      positives). Budgets: home 8.8 → 9.0 KB, calculus shell 67 → 68 KB, first lesson 15 → 22 KB (MathML; see
      needs-author `lesson-weight`).
    - Continuity pass (calculus vs physics, every shared page type, 1280/360, light/dark, Playwright; practice
      answered on an `expr`, a calculator numeric and a set item; practice exam 1 walked through all four parts,
      the calculator notice right in each; Enlarge on phones for three trainers). Shared-layer fixes:
      `glossary-page.js` and `glossary-tip.js` escaped the MathML in definitions (raw markup on the glossary page
      and in tooltips; now kept, and the filter reads plain text); `site-search-all.js` and the course search read
      formulas through `ApCalcTex.text` (no TeX annotation in snippets); `tutor.js` drops annotations;
      `book.css` crumb spacing, `study.css` answer chips and `tool-studio.js` footer move now know `.calc-crumb`,
      `.calc-mark`, `.calc-foot` (the same gaps the physics launch found). Calculus fixes: `calc-math.js` breaks
      a long inline chain before each top-level = or \approx (21 notes pages scrolled sideways at 360 px);
      flashcards showed definitions as escaped MathML; the home trainers band now names the free rule drills; the
      trainer caption split no longer cuts at a decimal point (calculus and physics `studioAsk`).
    - Full CI with browser checks then found: a plot holding a draggable handle must be `role="group"`, not
      `img` (`ApCalcPlot.draggable` sets it for every trainer); formula-page cells overflowed a few pixels
      vertically (hidden now) and long formulas sideways: the chain split also breaks before \Rightarrow and
      \quad (past 34 characters also before a top-level + and after a top-level comma, never inside brackets),
      pieces joined by `<wbr>` with the operator kept infix; below 720 px the formula table sizes to content
      and scrolls as a whole; the EVT row is now "max and min over [a, b] exist". The split is opt-in
      (`ApCalcTex.html(s, { wrap: true })`, used by the build's `mathHtml`), because trainers render one
      formula per string and read its annotation back (the Riemann sums drill's duplicate check broke). The
      site-search test now covers `?course=calculus`.
13. (2026-10-20, `docs/frq-grader.md`) **AI FRQ grader, built and OFF.** "Grade my answer" beside the rubric self-score on each FRQ page (shared `assets/course/frq-grader.js`, Worker `/frq/grade`): Premium only, 10 a day, Claude then the Workers AI backup then the self-score, each point quoting the student's words. Self-scoring stays the default and is never removed; the grader is an estimate the student can overrule. Turned on only after its accuracy eval passes.

## 8. Open items for the owner

- **Launch checklist: done 2026-10-13.** Migration `2026-10g-apcalc.sql` applied in Supabase (live function bodies
  checked identical apart from `apcalc` first); Polar product "AP® Calculus AB Premium (through June 30, 2027)" $25
  one-time, id `898416cb-b686-4f27-8031-041fe1e0daa6`; `"calc-2027"` added to `POLAR_PRODUCTS` in the Cloudflare
  Worker settings; `onSale: false` removed from `COURSES.apcalc`, `sw.js` cache v80; owner access granted (to 2099).
  Merging the PR puts AP® Calculus AB Premium on sale.
- Questions in `docs/apcalc-needs-author.md` (CED exclusions for Units 3-8 and the scope calls that rest on them,
  unit weights, the 2027 scaling and score cut-offs, which trainers are free, the calculator link, form 2's two
  particle-motion questions, notes that print item answers, lesson weight, tool polish).
- Optional: an AP® Calculus AB teacher to review the course (the Beta note stays until then).
