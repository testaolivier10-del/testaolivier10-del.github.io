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
| P1-Ochem | `tool-shell.js`: tool first on phones, sibling chips compact below; keep handoff and quiz | done: opener is back link + share on one row, name, lede (compact on phones, tool starts ~265px down at 390); sibling chips moved into a generated Keep going strip under the tool (lessons from registry `topic`, glossary from new registry `terms`, Practice `?topic=`, other tools), written by `build-tool-pages.mjs` between `tool-foot` markers; each quiz answer links its own lesson and term (`q.topic`/`q.term`), missed items link their lesson |
| P1-A&P | Open on a default item instead of the long chooser (compact picker); Keep going strip; 3D body link for anatomical items | done: `anatomy-physiology/assets/tools/tool-kit.js` + `.css` (loaded on every tool page by build-anp.mjs): `AnpToolKit.picker` (search disclosure over every item), `AnpToolKit.strip(host, {topic, terms, text, structures})` (Lesson, Notes, glossary terms, "See it on the 3D body" only for exact body map labels plus a few plural/spelling aliases; label list pinned by `scripts/test/anp-tool-kit.test.mjs`). Each tool opens on the next unfinished item (loops, graphs, pathways, scenarios as a session, lab set in the saved mode; calculators keep last-used); full lists at `#all` (graphs, pathways), `#<mode>` (lab), "All loops"/setup (loops, predict). Phone opener drops the crumb and lede. A&P runtime budget 46.5 -> 47.5 KB |
| P1-Bio | Stage slot in `bio-tools.js`; phone layout (stage first, intro collapsed); Keep going strip from each tool's `topic` | done (branch `claude/tools-shared-bio`). **Stage API:** simulators `ApBioTools.mount(slug, fn, { stage(host, state) })`; `fn(app, data, ctx)` with `ctx = { stage: host, redraw(state) }`; `host` is `div.bt-stage-slot`, first child of `#app` (above controls). Called once after `fn` with the last state (initially `{ slug, data }`), whenever the tool calls `ctx.redraw(state)` (convention `{ inputs, result }`), and after any `input`/`change` in `#app` (last state); coalesced to one draw per animation frame; errors logged, not thrown. Skills: `skillTool(app, data, { slug, kind, stage(host, state), chart?, decorate? })`; host sits in the problem card above the problem text, redrawn on each new problem, each typed/picked answer and after Check, with `state = { slug, kind, mode: 'practice'\|'set', code (seed or null), index (set position or null), cid, topic, input, sol (from ApBioProblems.solve: parts, steps, table?, chart?), answers: { partKey: number\|option index\|null }, graded: null\|{ partKey: { correct, answered } }, phase: 'new'\|'input'\|'checked' }`; the old `chart(spec, input)` hook is the default stage (confidence intervals). **Phone:** tool pages get a slim hero at ≤640 px (bio.css, `body[data-app^="tool-"]`); `tidyAbout` moves intro + model box into one closed `details.bt-how.bt-about` after the tool; `figureFirst` moves a simulator card's `.bt-stage` (and a short key) above its first control. **Strip:** `keepGoing` runs from `record()` and `event('apbio-sim-run')`, in the card just used, after the answered question / worked solution / drill result / run note (`data-keep-host` redirects: graph builder to its feedback card): lesson + notes for the item's topic (if built), up to 3 glossary terms of that topic (`glossary.html#t-<id>`, terms named in the card first), Review after a miss. Phase 2 tools pass `stage` and call `ctx.redraw`. |
| P1-Chem | Phone layout (problem first, intro collapsed); Keep going strip; `live-beaker.js` | **done 2026-10-09**: `ApChemTools.frame`/`kindPicker` (picker row, problem, "About this ..." folded below; compact opener under 640 px) in all 6 trainers; `keepGoing` strip after each graded problem (lesson, notes, lessons for missed steps' topics, glossary terms); Justify opens on the next unchecked prompt (`?list=1` for the list, `?p=` kept); equations sheet links each row to its trainers; beaker API below. Notes in `docs/apchem-spec.md` decision 20 |

### Chem live beaker API (built in P1-Chem)
`chem/assets/tools/live-beaker.js`, loaded after `chem-tool-math.js` (and `chem-tools.js` if the page has it,
for its announcer). No page loads it yet: add it to the tool's `extra` list in `toolShell()` (build-apchem.mjs).
CSS is in `chem-tools.css` (`.lb-*`).
```js
var b = ApChemBeaker.mount(el, {
  species: [{ key, label, mol?, name?, tone? }], // mol: an ApChemMath.particles template (A, B, A2, B2, AB,
                                                 // HA, 'A-', 'H3O+', H2O, NH3, CO2 ...); else a disc, tone 1-6
  readout: 'pH' | 'qk' | 'none',                 // default 'pH'
  title: 'Acetic acid buffer',                   // starts the text description
  max: 30,                                       // most particles drawn; larger counts scale down together
  seed: 7                                        // particle layout
});
b.update({ counts: { HA: 6, 'A-': 4 }, pH: 4.57, note: 'Added 2 OH⁻.' });   // readout 'pH'
b.update({ counts: { A2: 5, B2: 5, AB: 4 }, Q: 0.64, K: 4 });               // readout 'qk'
b.destroy();
```
- Counts are particles, not moles: the caller maps concentration to a count (keep ratios honest).
- Between updates particles keep their place and id; a species that grows takes the places another just
  gave up (HA turns into A⁻ where it was), new ones fade in, lost ones fade out, the pH or Q marker slides.
  `prefers-reduced-motion` (or `LevlMotion.reduced()`): end state at once.
- Readouts: pH value + acidic/neutral/basic + a 0-14 scale; Q vs K: both values, `<`/`=`/`>` (equal within
  1%), a log scale centred on K (two decades each way) and "Forward →" / "← Reverse" / "At equilibrium".
- Accessibility: the SVG is `role="img"` labelled by the caption; the caption is a polite live region
  (`ApChemTools.announcer`, debounced) with the counts by name, the readout and the direction in words.
  Atoms carry their symbols, so color is never the only cue. Colors come from tokens (dark mode follows).
- `ApChemBeaker.pure` = `{ slots, scale, assign, phWord, qk, describe }` (no DOM; tested in
  `scripts/test/apchem-beaker.test.mjs`). `ApChemBeaker.demo(el)`: a buffer taking base in three steps.

## Phases 2 and 3: tool upgrades (PR 2)

Branch `claude/tools-upgrades` (base `claude/tools-shared`). Eight workstreams, each in its own worktree and
branch `claude/tools-upgrades-<ws>`. Each writes its notes to `docs/tools-upgrade-notes/<ws>.md` (not this
file, to avoid merge conflicts); this table is updated at merge.

| Workstream | Tools | Status |
|---|---|---|
| U-NREMT-body | Sound trainer on the body (flagship 1), Body map burns / Rule of Nines mode (flagship 10) | done 2026-10-10: built, accuracy reviewed, hands-on tested; notes `docs/tools-upgrade-notes/nremt-body.md` |
| U-NREMT-cases | Scenario sim live monitor + tap-to-assess (flagship 2), Flowcharts build-it, Formulary give/withhold, Skill sheets clock, Reference cards age slider, Mnemonics link into scenarios | done 2026-10-10: built, accuracy reviewed, hands-on tested; notes `docs/tools-upgrade-notes/nremt-cases.md` |
| U-Ochem | Reaction predictor (flagship 8), Acid/base pKa line, Spectroscopy peak-hydrogen link, Reagent roadmap synthesis puzzle, 3D viewer predict-the-shape, Conformations chair flip, Resonance charge overlay, Arrow pusher mechanism challenge, fix `#v3Svg` a11y | done 2026-10-10: built, accuracy reviewed, hands-on tested; notes `docs/tools-upgrade-notes/ochem.md` |
| U-AnP-loops | Feedback loops live loop (flagship 6), Predict gauge simulator (flagship 7) | done 2026-10-10: built, accuracy reviewed, hands-on tested; notes `docs/tools-upgrade-notes/anp-loops.md` |
| U-AnP-rest | Graphs explore + live shifts, Pathways trace on figures, Calculators picture per formula, Lab practical and Word roots 3D link | done 2026-10-10: built, accuracy reviewed, hands-on tested; notes `docs/tools-upgrade-notes/anp-rest.md` |
| U-Bio-sims | Osmosis (flagship 5, absorbs Water potential as quiz), Enzymes (flagship 9), Cell cycle, Meiosis, Operons, Signal transduction, Energy flow, Population growth, HW drift, Tree reading | done 2026-10-10: built, accuracy reviewed, hands-on tested; notes `docs/tools-upgrade-notes/bio-sims.md` |
| U-Bio-skills | Chi-square (flagship 4), Hardy-Weinberg, Descriptive stats, Rates, Simpson, Confidence intervals, Water potential stage, Graph builder grid-first, Design drills tiles | done 2026-10-10: built, accuracy reviewed, hands-on tested; notes `docs/tools-upgrade-notes/bio-skills.md` |
| U-Chem | Titration explorer (flagship 3), Buffers, Q vs K, ICE on the live beaker; Particle diagrams build mode; Units and sig figs cancellation | done 2026-10-10: built, accuracy reviewed, hands-on tested; notes `docs/tools-upgrade-notes/chem.md` |

### Phase 2 status (2026-10-10)

All eight workstreams merged into `claude/tools-upgrades`. Independent accuracy reviews fixed 32 errors and logged
the judgment calls in each course's needs-author doc (NREMT: `docs/TRACKER.md`). Two hands-on student passes fixed
the remaining layout and interaction issues. Full `BROWSER=1 scripts/ci-local.sh`: ALL PASS. `sw.js` CACHE v65.

Owner decisions open: child burn chart (infant chart only vs. adding Lund-Browder), state time limits for the four
random skill stations, Simpson form (course uses 1 − Σ(n/N)²; confirm against the printed formula sheet), dialysis bag
NaCl simplification, flat 1.6 kcal/mol 1,3-diaxial term, hives-only epinephrine card wording.

Known leftovers: the two floating site buttons cover the right edge of some phone readouts (site chrome); long
breadcrumbs truncate on phones; the burns figure's 1% region is a small tap target (drag-paint and keyboard work).

## Verification

Per workstream: before/after screenshots at 390 and 1280 (light and dark) of every touched page, the course's build
`--check` scripts, `node --test scripts/test/*.test.mjs`, and `check-a11y`/`check-console` for touched pages. At merge:
full `BROWSER=1 scripts/ci-local.sh`, a hands-on pass of every tool as a student would use it, then the PR.
