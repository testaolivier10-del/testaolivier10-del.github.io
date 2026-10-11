# Calm tools: plan and status

Owner request (2026-10-10): tools feel like opening Adobe Premiere Pro: too much at once, a learning curve. There
should be no learning curve. Keep all the information, but make every tool calm, clean and obvious. Mockups the owner
approved ("do that for all"): the "Calmer tools redesign" canvas (reaction predictor, chi-square, titration).

## The layout every tool uses (Tool Studio)
1. One screen, one job: a full-width STAGE (the visual) plus one compact DOCK with 1 to 3 primary controls. The core
   loop fits one phone screen without scrolling.
2. Chrome diet on tool pages: one slim top bar (back, tool name, "?" and a "⋯" menu holding Copy link, About,
   Premium/Beta info, Report a problem, Ask the tutor). No breadcrumb, no hero card, no bottom tab bar, no floating
   buttons over the stage.
3. Three layers of information, nothing deleted: (1) visible: stage, primary controls, one live caption;
   (2) "Why?" opens a sheet (bottom sheet on phone, side drawer on desktop that pushes the dock aside, never covers
   it); (3) "Details" tab in the same sheet: numbers, equations, tables, references, extra settings.
4. Explore | Practice (or the tool's existing mode names) as one segmented control at the top of the dock. Practice
   shows one step at a time ("Step 2 of 5", one input or choice), never a wall of inputs.
5. Point, don't explain: a soft pulsing hint on the first thing to touch, shown until the first interaction (once
   per tool per device), respecting reduced motion.
6. Feedback lands on the stage: a result pill or highlight on the visual, not a text block below.
7. One calm visual system: about three text sizes, sentence case labels (no caps kickers), no cards inside cards,
   generous whitespace, the shared controls (segmented, chips, slider, stepper), course color as the only accent.
8. The same layout in every course.

## Shared layer
`assets/course/tool-studio.css` + `assets/course/tool-studio.js` (`window.LevlStudio`). Full API in the header of
tool-studio.js; the short version:

- `var s = LevlStudio.mount({ title, course, back, backLabel, home, slug, host, modes, caption, hint, menu, stage, dock, why, details, about, slim })`
  builds the frame (top bar, stage, dock, Why/Details sheet, menu) and sets `body.ls-on` (hides header, course tabs,
  crumb, hero, bottom tab bar, tutor and periodic-table buttons; the menu reaches them). The page footer moves to the
  end of About, so the page is exactly one screen; a moved `<footer>` becomes `div.ls-foot-c[role=group]`
  "Site links" (same classes, text and links), since About is inside main (check-a11y).
- `backLabel` names the back arrow (default "Back to all tools"; `back` is its target). `menu.allTools`: `false`
  drops the menu's last item, `{ label, href }` renames or retargets it (default "All tools" to `back`).
- `slim: true` is the reference-page mount: the top bar only (back, title, tutor, menu without About, no "?"), over
  the page's own scrolling content; no stage, dock or sheet, and the footer stays where it is (chem `calm-ref.js`).
- `s.add(region, els, { mode })` MOVES elements (never copies) into `stage | dock | why | details | about`; with a mode
  they show only in that mode. Tool code keeps its element references, so lookups must not go through the old
  container (`app.querySelector`) once a part has moved (see titration `$()`).
- `s.modes({ items, value, onChange })` draws the segmented switch, or `s.modes({ el, value })` adopts the tool's own;
  calling it again replaces the set (one click listener, the latest `onChange`); `s.mode(v)` switches. `s.caption(html, mode?)` and `s.pills([{ html, tone, k }], 'left'|'right', mode?)` are kept per
  mode (tones: accent, good, bad, warn, ghost, readout). `s.open('why'|'details'|'about')`, `s.close()`.
- `s.hint({ target, text })`: pulse ring + tooltip, once per tool per device (localStorage, try/catch), static ring
  with reduced motion, gone on the first pointer/key/input in the studio.
- `LevlStudio.stepper(container, { items, submit, total, done })`: one step at a time over existing graded inputs
  ("Step 2 of 5", dots, Back/Next; Next only to steps that exist, so a drill's own Check moves on; `done()` shows all
  steps for review; optional). `s.suspend(on)` hides the studio for a Premium gate.
- Student-test fixes (shared2): the hint tip sits above or below its target inside the stage or dock and never
  over the top bar or the caption line with Why (the arrow hides when it cannot touch the target); its
  `aria-describedby` goes with it, and it follows a target the tool redraws. Pills stay on one line and end in an
  ellipsis (`.ls-pill-t`). The selected segment has a course-colour ring and text (a tinted fill in dark mode).
  "?" and "⋯" are 44px on desktop. `.ls-dock` is `position:relative` (the per-course patches are gone). The primary
  row stays in view at the foot of a scrolling dock: the stepper's Back/Next, `.bt-actions`, any `.ls-act`, and a
  plain row whose direct child is `.btn-press`/`.ls-pri` (sticky). The stepper's Next is secondary (`.is-sec`) when
  the step has its own primary action, and `go(i)` moves focus only when focus is already in the stepper
  (`go(i, true)` forces it).
- The phone sheet's focus trap skips controls inside a closed `<details>` (its summary stays) and `tabindex=-1`
  controls (the unselected tab).
- Not adopted: A&P's `AnpToolKit.studio` helpers (`put`/`reset` for its render-into-staging cycle, `mirror`,
  `modeBar`) stay in `tool-kit.js`; they serve A&P's re-render model, and no other course needs them.
- Helper classes: `.ls-scroll` (one scrolling chip row on a phone), `.ls-btn`/`.ls-pri`, `.ls-linkrow`, `.ls-lbl`,
  `.ls-row`, `.ls-tbl`, `.ls-steps` (numbered reasons), `.ls-tags`, `.ls-sec`, `.ls-title-l`, `.ls-k`. The courses' own
  controls (`.tchip`, `.tseg`, `.bt-btn`, `.bt-step`, `.bt-select`, `.bt-part`, `.btn-press`, `.tool-more`, `.bt-more`)
  are restyled inside `.ls-root`.

### Switching a tool on (per course frame; P1)
- **Ochem:** `studio: true` in `ochem/assets/tools-registry.js`, then `node scripts/build-tool-pages.mjs` (adds the
  css/js block). `tool-shell.js` mounts the frame (`window.OchemStudio`, root also gets `.tool-root`), moves
  `#tool-quiz` and `#tool-foot` to Details; the tool's script moves its own parts (`reaction-predictor.js`, "Tool
  Studio" block + `studioRender`).
- **AP Bio:** `"studio": true` on the tool in `bio/data/pages.json`, then `node scripts/build-apbio.mjs` (#app gets
  `data-studio`). `bio-tools.js` `studioFrame`/`studioArrange` map an S.card explore view and `skillTool` practice
  automatically (header comment there); the tool sets its explore caption/pills (`chi-square.js` render()).
  Simulators without an S.card need their own arrangement (T.mount `opts.studio`, extend studioArrange).
- **AP Chem:** `"studio": true` in `chem/data/pages.json`, then `node scripts/build-apchem.mjs`. `chem-tools.js`:
  `modes()` hands its switch to the frame, `drill()` arranges every problem (figure to stage, stepper, solution to
  Why); the trainer's explore view arranges itself via `modes({ studio: { explore(pane, s) } })`
  (`titration-curve-reader.js` `studio()`/`studioDraw()`). A drill's figure moves to the stage, so its code must keep
  its own reference to it (titration quiz `fig`); anything holding `[data-row]` table inputs stays in the dock.
- Checks used in P0: a playwright sweep per tool at 390 (2x), 768, 1440 and 1680, light and dark, in five states
  (first load with hint, mid-use, Why open, Details open, Practice step) asserting no horizontal scroll, no element
  past the viewport, stage/dock/drawer not overlapping, document height = one screen, no console errors; plus a
  functional pass (deep links and problem codes, Check and recording, Keep going, menu items, Esc/focus return,
  focus trap, hint once). Then `scripts/ci-local.sh` with `BROWSER=1`.

## Status
| Step | Scope | Status |
|---|---|---|
| P0 | Build Tool Studio shared layer + adopt it on the 3 mockup tools (ochem reaction predictor, bio chi-square, chem titration) as the reference | done (branch `claude/tools-calm-p0`, API below) |
| P1 | Adopt on every other tool: NREMT, Ochem, A&P, AP Bio, AP Chem (parallel, one branch per course) | pending |
| P2 | Fresh 5-second test on every tool, fixes, full CI, PR, live | pending |

## P2 QA notes (AP Bio + AP Chem, branch `claude/tools-calm-qa-b`)
- Bio practice: the problem's data table now sits on the stage under the figure (was hidden in Details); graph builder's
  data is on the stage (phone: open for the first steps, then folds so the grid has the stage).
- Chem drills: a one-step picture choice puts its pictures and Check on the stage (no "Step 1 of 1"); the active ICE row
  scrolls into view.
- Shared-layer issues found (not fixed in tool-studio.*): `.ls-dock` needs `position:relative` (sr-only labels in a
  scrolled dock made the whole page scroll; patched per course CSS); the first-run hint tooltip covers the caption and
  Why on phones; `stepper.go()` moves focus (focus ring on load); stepper Next is styled primary even beside a Check.
