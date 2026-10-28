# Author B self-report: Unit 1, topics 1.3-1.6 (2026-10-27)

## Done

| Topic | Items | Apply/analyze | In sets | Sets (kind) |
|---|---|---|---|---|
| `neural-firing` (1.3) | 22 | 21 | 9 | visual (lettered neuron and synapse), study (invented opioid-agonist drug trial) |
| `brain` (1.4) | 18 | 18 | 11 | visual (lettered side view), study (invented patients with lower left frontal damage), study (real: Gazzaniga, Bogen & Sperry (1965), split brain) |
| `sleep` (1.5) | 18 | 18 | 8 | data (invented hypnogram, plot spec), study (invented phones and sleep, correlational) |
| `sensation` (1.6) | 24 | 24 | 11 | visual (the eye), data (invented signal detection table), study (real: Bartoshuk, Duffy & Miller (1994), supertasters) |

82 items in all (7 numeric, 2 specific, 1 order, the rest four-option single). Lessons, notes (each 900+ words, with
worked examples, comparison tables, myth boxes for the 10% brain, left/right-brain people and subliminal advertising),
and glossaries for every concept the map assigns to the four topics.

FRQs: `frq-heredity-environment-aaq` (invented twin and adoption study of persistence, bar graph of r by pair type,
ethics: review board, consent, debriefing after deception, confidentiality) and `frq-sleep-ebq` (three invented
sources: sleep after learning, sleep and grades (correlational), five short nights and a lesson quiz).

Figures (LevlPrep original SVG, `scripts/appsych-figures/author-b.mjs`, registered in `psychology/data/figures/<topic>.json`,
label boxes for "Hide labels" in `psychology/data/labels/`): `neural-firing-neuron`, `neural-firing-neuron-letters`,
`neural-firing-action-potential`, `brain-lobes`, `brain-lobes-letters`, `brain-inner`, `sleep-hypnogram`,
`sensation-eye`, `sensation-ear`. All rendered to PNG with Playwright and inspected; overlaps fixed.

## Checks

- `check-appsych-content.mjs --topic` clean for all four; full run: FRQ 0, bank 0 failing.
- `check-appsych-map.mjs --check`: nothing used before it is taught. No map edits.
- `build-appsych.mjs --check` and a scratch build with Unit 1 published: pages and both FRQ pages build; no page errors.
- `node --test scripts/test/appsych-*.test.mjs`: 130 pass.
- Numeric recheck (independent script, keys worked by hand from each stem, `psy-stats.js` and `psy-grade.js` in a vm):
  7 of 7 keys right, every authored mistake graded wrong; the hypnogram plot's REM lengths match the stimulus text.

## Open questions for needs-author

- `aaq-ordering`: the heredity-environment AAQ (topic 1.1) needs research ethics for part D, which the course teaches
  after 1.3. The content check does not scan FRQs for ordering; the FRQ page should be offered after Ethics in Research
  (or the lead should decide FRQs are practiced after the unit).
- `replication` additions: oxytocin "trust spray" (early finding, larger studies did not reliably replicate; taught
  that way in 1.3); Phineas Gage (how much and how long his personality changed is debated; notes say so); the 1957
  subliminal "eat popcorn" claim (admitted fabricated; named only in a myth box).
- Sleep stage naming: notes use N1-N3 and REM (current AASM scoring); the hypnogram plot labels stages W, R, N1-N3
  because the plot's left margin is fixed and clips longer tick labels (a possible `psy-plot.js` improvement for T2/lead).
- Brain figures are schematic (lobe borders, deep structures shown dashed on a midline view); a teacher should confirm
  they read correctly before launch.
