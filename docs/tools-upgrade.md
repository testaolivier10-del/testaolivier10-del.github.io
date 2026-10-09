# Tools upgrade: plan and status

Status file for upgrading every interactive tool on the site (owner request, 2026-10-09). A fresh session reads
this file, `CLAUDE.md` and `docs/course-shell.md`, not the chat history. Update it in the same commit as the work.

## Owner brief

The NREMT body map (`nremt/body-map.html`) is the best tool. The owner's reasons: it just works, it is super
interactive, you get good information, it is good at its one job, and it is interesting. Most other tools feel
basic: a dropdown, typed answers, a Check button. Bring every tool up to the body map's level.

### The test every tool must pass

1. **One clear job**, sayable in one line. If not, rethink the tool, don't polish it.
2. **It just works.** Nothing confusing, slow or broken. Phone and desktop, light and dark, keyboard and screen reader.
3. **Interactive.** The student acts on the thing itself (drag, tap, slide) and it reacts at once.
4. **Real learning per action.** Every action teaches something specific (what it does, why, what goes wrong).
5. **Interesting.** Something you want to keep playing with. A live visual wherever one helps understanding.
6. **Starts with the good part.** On a phone the interactive piece is on the first screen.
7. **No dead ends.** After an answer: links to the lesson and glossary entry; misses feed Review and progress.

## Decisions (2026-10-09)

1. Two pull requests: **PR 1 = Phase 1** (shared fixes and building blocks, branch `claude/tools-shared`, base
   `main`); **PR 2 = Phases 2 and 3** (tool upgrades, branch `claude/tools-upgrades`, base `claude/tools-shared`).
   The owner reviews both before merging.
2. No new libraries or paid assets. three.js (already vendored for the body map), the existing SVG chart helpers
   (`T.plot` in Bio and Chem), and plain SVG/canvas cover everything.
3. Keep every existing mode, question bank, seed/problem-code link and storage key working. Upgrades add a live
   visual and an explore mode on top; existing graded steps become the quiz. No content is deleted. Mnemonics and
   Water potential stay as pages; they gain links into Scenario sim and Osmosis.
4. Any tool whose science model or numbers change gets an independent accuracy check before the PR.
5. Visuals follow the site style (theme tokens, each course's `--ctint`, dark mode via tokens), respect
   `prefers-reduced-motion` (animation off, end state shown), and every drag has a keyboard and button path.
6. `sw.js` CACHE is bumped once at merge, not per workstream. Weight budgets may be raised in
   `scripts/check-weight.mjs` with a one-line reason each.

### Contracts between workstreams

- **Body map deep link:** `nremt/body-map.html?focus=<name>` selects and frames a structure, where `<name>` is the
  label shown in its Browse-by-name list, case-insensitive (e.g. `?focus=heart`). Unknown names are ignored.
- **Body viewer module:** `nremt/assets/body-viewer.js` exposes `window.LevlBodyViewer.mount(el, opts)` (the 3D
  model, picking and layers, split out of body-map.html). The body map itself uses it.
- **NREMT tool results:** `nremt/assets/tool-results.js` exposes `window.NremtToolResults.record({tool, id, correct,
  label, href})`: misses go to the NREMT review queue, correct answers award progress.
- **Related strip:** each course renders one "Keep going" strip after a graded answer or at the end of a run: lesson
  link, glossary term(s), and for anatomy a "See it on the 3D body" link. Built from data the tool already has.
- **Bio stage slot:** `ApBioTools.mount`/`skillTool` accept `stage(host, state)`; it renders first on phones and
  redraws on input.
- **Chem live beaker:** `chem/assets/tools/live-beaker.js` exposes `ApChemBeaker.mount(el, opts)`: a particle beaker
  with a pH or Q readout that updates as amounts change, built on `ApChemMath`.

## Phase 1: shared fixes and building blocks (PR 1)

| Workstream | Scope | Status |
|---|---|---|
| P1-NREMT | Open on the tool (phone); tool results hook wired into body map hunt, sound trainer, flow drill, formulary drill, scenario debrief; body viewer module; `?focus=` deep link | done: `LevlBodyViewer.mount(el,{list,info,focus,systems,skin,autoload,onSelect,onPick,pickSelects})` returns `select/find/highlight/clear/reset/setSystems/setSkin/info/structures/on/hunt.start({panel,live,first,onAnswer})`; `?focus=` and `?hunt=` (Review link back). `NremtToolResults.record` puts bank questions (formulary, `qid`) in `nremt_mastery`; other misses in synced `nremt_tool_review`, listed on Review as "From the tools" with a Try it again link, cleared by a later right answer; right answers 4 XP (60/day cap) + daily activity. Scenario debrief: a fork's consequence choice where a no-consequence one existed is a miss. |
| P1-Ochem | `tool-shell.js`: tool first on phones, sibling chips compact below; keep handoff and quiz | pending |
| P1-A&P | Open on a default item instead of the long chooser (compact picker); Keep going strip; 3D body link for anatomical items | pending |
| P1-Bio | Stage slot in `bio-tools.js`; phone layout (stage first, intro collapsed); Keep going strip from each tool's `topic` | pending |
| P1-Chem | Phone layout (problem first, intro collapsed); Keep going strip; `live-beaker.js` | pending |

## Phases 2 and 3: tool upgrades (PR 2)

Flagship order: Sound trainer on the body, Scenario sim live monitor, Titration explorer, Chi-square, Osmosis,
Feedback loops, Predict gauges, Reaction predictor, Enzymes, Body map burns. Then every other tool per the plan
doc ("LevlPrep tool upgrade plan"). Status table is filled in when Phase 2 starts.

## Verification

Per workstream: before/after screenshots at 390 and 1280 (light and dark) of every touched page, the course's build
`--check` scripts, `node --test scripts/test/*.test.mjs`, and `check-a11y`/`check-console` for touched pages. At merge:
full `BROWSER=1 scripts/ci-local.sh`, a hands-on pass of every tool as a student would use it, then the PR.
