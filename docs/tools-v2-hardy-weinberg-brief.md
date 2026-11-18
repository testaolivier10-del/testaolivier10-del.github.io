# Tools v2: AP® Biology Hardy-Weinberg (brief and build notes)

Status file for the v2 rebuild of `bio/tools/hardy-weinberg.html` (rank 48 in `docs/tools-v2-rollout.md`, kind P,
free). Standard: `docs/tools-v2-standard.md`; builder rules: `docs/tools-v2-builder-brief.md`. Branch
`claude/tools-v2-hardy-weinberg`, cut from `claude/tools-v2-all`. NOT merged: an independent review comes first.
`bio/tools/hardy-weinberg-drift.html` is a separate tool and was not touched.

## The one main idea
**With nothing acting on a population, the allele frequencies p and q fix the genotype frequencies p², 2pq and
q².** CED topic 7.5 (`docs/apbio-ced-map.json`: "Use the Hardy-Weinberg equations to calculate allele and genotype
frequencies and explain the conditions for equilibrium"; p + q = 1, p² + 2pq + q² = 1).

## Research (rule 10): what exists and what we took
"Seen" means the page's own text could be fetched and read; none of these could be operated from here, so nothing
is claimed about how they feel in the hand. "Summary only" means only a description was served.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| The old LevlPrep tool (seen and used, `origin/main`) | A Punnett square split at p whose cell areas are the genotype frequencies, beside 100 symbols (circle, dotted circle, square); drag the corner or a panel slider | The area model is the real reason for p² and 2pq; the control is on the picture | Two pictures side by side with nothing joining them; abstract symbols; a slider that repeats the corner; a readout panel; the 100 symbols are rounded, so they disagree with the readout at most settings | The area model, kept and made the whole picture: the plants now stand in the square |
| dmccreary, Hardy-Weinberg calculator MicroSim (page text seen) | Type three genotype counts; p, q, expected frequencies, a bar chart of observed against expected, a chi-square verdict; three presets | Instant recalculation; presets that each show something | A bare bar chart; nothing shows why p gives p²; typing, not doing | Nothing for Explore (it is the calculation job, which is our Test yourself) |
| Science Primer, Hardy-Weinberg calculator (page text seen) | Type allele frequencies (up to five alleles); graphs of allele and genotype frequencies | Refuses frequencies that do not sum to 1 | Graphs and number boxes only | One number sets the other: q is never a second control |
| HHMI BioInteractive, Population Genetics Explorer (summary only) | Parameters for selection, drift, mutation, migration, inbreeding; line graphs over generations | (not inspected) | (not inspected) | Confirms the split: what changes p is the drift tool's job, not this one |
| Virtual Biology Lab, PopGen Fish Pond (summary only; the model itself did not load) | Agent based fish, breaking each assumption | (not inspected) | (not inspected) | Nothing claimed |
| Biology Simulations, Hardy-Weinberg; NetLogo classroom model | Could not be fetched | | | Nothing claimed |
| OpenStax Biology for AP® Courses 19.1 (text seen) | The pea example: 500 plants, p = 0.7, q = 0.3, 0.49 / 0.42 / 0.09 | The numbers every student meets first | A static figure | The opening state is p = 0.7 (49, 42, 9); the conditions list |
| PhET (the standard's reference for parameter simulators) | No Hardy-Weinberg screen exists | | | The rules already in the standard |

What ours can do better than all of them: the allele frequency is changed ON a drawn population, the three shares
answer at once as plants you can count, and the picture itself shows why (a plant is its pollen's allele and its
egg's allele, so the plots are p by p, p by q, q by p and q by q).

## The design
- **The picture:** a raised garden bed of 10 by 10 snapdragons on a lawn. Along the back board lie ten pollen
  grains and down the left side ten eggs, each carrying R or W: the gene pool. A plant gets its column's pollen
  allele and its row's egg allele. Snapdragon flower colour shows incomplete dominance, so every genotype can be
  seen: RR red, RW pink, WW white. Twine marks the split both ways, so the bed is four plots: red (p by p), two
  pink (p by q) and white (q by q).
- **Main control:** one knob on the back board at the split. It sets p from 0 to 1 in steps of 0.1 (drag, tap the
  board, arrow keys, Home, End). The same p holds for pollen and eggs; there is no second control.
- **Instant response:** the alleles and the twine follow the knob at once; the change then runs down the changed
  column and along the changed row, plant by plant (under half a second); three signs in front of the bed count
  the plants as drawn ("RR 49%", "RW 42%", "WW 9%").
- **Opens** at p = 0.7 (the OpenStax numbers).
- **Cue:** "Drag the alleles" under the knob, once per device. "Show me how" (three pointers) from its link and "?".
- **Cause line** (`K.cause`): "p = 0.7 + q = 0.3 → p² = 0.49 + 2pq = 0.42 + q² = 0.09". While plants are still
  changing it stops at "p + q"; the three shares are added when the bed shows them.
- **One colour per idea, everywhere:** R, p, p² and RR red; W, q, q² and WW white; RW and 2pq pink (the mix).
- **Extremes:** p = 0 is a bed of white (the R allele is gone), p = 1 a bed of red.
- **Reduced motion:** the new bed at once with a 240 ms cross fade; the line is whole at once.

### What is on screen in Explore (counted; Playwright, opening state)
Outside the picture: the purpose line (8 words), "Show me how", the cause line (5 pills). That is 1 control (the
link) and 8 words plus the pills. No tabs, no side panel, no graph, no readout cards, no buttons.
On the picture: the bed of 100 plants, 20 alleles (each with its letter), 1 control (the knob), 2 labels over the
pollen ("p = 0.7", "q = 0.3"; each only while that allele is drawn), 2 captions ("pollen", "eggs"), 3 signs, the
twine, and the cue on a first visit.

### Explore against Test yourself
- **Explore:** free play as above. Nothing locked, graded or asked.
- **Test yourself:** one dropdown on the stage, "What to practice":
  1. **Set the alleles** (the old Explore's three "Try this" targets, plus two): the bed is planted but not in
     bloom, so nothing gives the answer away (no signs, no flowers). Set p for the target ("16% of the pea plants
     show the recessive trait"), then "Let it bloom and check": the bed blooms back row first, the signs appear, the
     answer is marked and explained (q² = 0.16, so q = 0.4 and p = 0.6). Try again, Show the answer, Next target.
     First tries are recorded as `hardy-weinberg:target-<id>` (new ids; the old targets were never recorded).
     Since review round 1 the two targets about a hidden recessive (q16 and rare, with the old wording) are on a
     bed of **pea plants** (complete dominance: AA and Aa purple, aa white), so carriers are met: after the bloom
     there are two signs (purple, white), the Aa plot is named "Aa: carriers", and the answer says purple is
     p² + 2pq. The other three targets stay on the snapdragons.
  2. **Problems** (the calculations: the old Practice mode, unchanged in content, grading and record ids): new numbers every time
     or the two worked problems, one part at a time, with the worked solution. Its figure keeps the old layout
     (the gene pool square split at the p you type, beside the problem's individuals) in the new colours; each
     individual is now a pair of alleles instead of a circle or a square.
- `#practice` and `?seed=` still open the calculations; `#target` opens the targets.

### What moved
| From the old tool | Where it is now |
|---|---|
| Explore's square with the corner to drag | Explore: the bed IS the square, the knob is on its back board |
| The 100 symbols beside the square | Explore: the 100 plants in the bed |
| The p slider in the side panel | Removed (it repeated the corner). The knob is a real range input: keys and screen readers work |
| The readout (p, q, p², 2pq, q² to three decimals) | The cause line (two decimals, exact at every stop); "?" has the setting and "Any p" to three decimals |
| p in steps of 0.01 | The bed moves in steps of 0.1 (whole plants). "?" has "Any p" in steps of 0.01 |
| "Try this" (16% recessive, most carriers, a rare trait) | Test yourself, "Set the alleles", targets 1 to 3; 1 and 3 on the pea bed with the old wording |
| The live sentences (q² = 0.16 so q = 0.4; the most carriers at 0.5; a rare allele hides in carriers; fixed) | The targets' explanations; "fixed" and "largest at 0.5" also in "?" |
| The key (AA, Aa carrier, aa shows the recessive trait) | Problems (unchanged wording). Explore needs no key: colour is the genotype and the signs name it |
| Carriers in Explore (a recessive trait hiding in Aa) | Not in Explore (every genotype shows there). Test yourself: targets 1 and 3 on the pea bed (purple = p² + 2pq, the Aa plot named "carriers"), and the recessive problems of Problems |
| Practice mode, worked set, problem code, link to a problem | Test yourself, "Problems", unchanged |
| The egg and sperm glyphs on the practice square | Bars in the allele colours, and "one allele from each parent" |

## Decisions made for the owner (also in `docs/tools-v2-owner-log.md`)
1. Explore's population is snapdragons (incomplete dominance), not a dominant and recessive trait, so all three
   genotypes can be seen without a key. The carrier idea moved to Test yourself: since review round 1, targets 1
   and 3 use a second species, pea plants with complete dominance (purple and white), where carriers look purple.
2. The bed is sorted into four plots (a model that can be counted), not scattered as a real population is. Said in
   "?".
3. p moves in steps of 0.1 so every plant is whole; any p to 0.01 is in "?".
4. The panel slider, the readout and the key left Explore.
5. The three "Try this" targets became checked questions on a bed that is not in bloom, with two new ones.
6. No "Watch it happen" replay and no "before" tick: the change is short and seen on every drag.
7. The alleles are written R and W on the picture (C^R and C^W in "?").
8. The practice figure's individuals are pairs of alleles; the gamete glyphs went.
9. The hub blurb and the About intro were reworded; title, description, tag and URL unchanged.
10. The biology adapter gained a "practice" part so a skills tool keeps its generated problems in Test yourself.

## Accuracy
- The equations are the CED's. Every stop of the bed holds whole plants that match p², 2pq and q² exactly (the
  validator `scripts/lib/apbio-tool-checks/hardy-weinberg.mjs` checks all 11 stops and that each target's answers
  are exactly the stops that give its share).
- Snapdragon flower colour as incomplete dominance (red, pink, white) is the standard textbook case and is already
  the tool's first practice context. The gene pool drawn as pollen and eggs with the same p is random mating with
  equal allele frequencies in both sexes, the assumption behind p² + 2pq + q².
- Not said anywhere as fact: that real plants stand sorted (the note in "?" says they do not), that the bed
  changes over time (a different p is a different gene pool, not the same plants changing colour).
- The pea bed (review round 1): flower colour in peas, purple (violet) dominant over white, is Mendel's trait and
  OpenStax's own Hardy-Weinberg example is a population of pea plants (19.1). AA and Aa are both purple, so only
  aa can be counted from the picture: q² from the white share, then purple = p² + 2pq and the carriers are 2pq.
  Real peas mostly self pollinate; the bed assumes random mating, as the textbook example does (open point below).
- Open points for a teacher: `docs/apbio-needs-author.md`, hw-explore-snapdragons. and hw-pea-bed.

## What was built
- `bio/assets/tools/hardy-weinberg.js` (rewritten), `bio/assets/tools/hardy-weinberg.css` (new, this page only),
  `bio/data/tools/hardy-weinberg.json` (`explore` and `targets`; contexts and problems unchanged),
  `bio/data/pages.json` (`"kit2": true`, the blurb).
- **Adapter, small:** `ApBioTools.studioKit2` takes a part with `practice: { area, modes }` (a skills tool's
  generated problems). It reuses `studioPractice`, which now returns `{ els, leave, back }`; nothing changes for
  tools without `kit2`. `?seed=` opens that part. Other skills tools on the kit can use it as is.
- `scripts/tools-v2/hardy-weinberg-sweep.mjs`: the sweep (the first in that folder).

## Checks run (2026-11-18)
- `node --test scripts/test/apbio-*.test.mjs` (72 pass), `check-apbio-content --check` (0 failing; the validator
  checks every stop of the bed and every target), `build-apbio --check`, `check-site`, `check-weight --check`,
  `build-apmacro --check`, `build-apcalc --check`.
- `scripts/check-tool-use.mjs` (with `CHROMIUM_PATH`), run with a local copy of its list: Hardy-Weinberg reports
  frame v2. (The edit to the check's list was dropped in review round 1: the collecting branch owns it.)
- The sweep, `node scripts/tools-v2/hardy-weinberg-sweep.mjs`: 57,338 checks, 0 failed (p = 0 to 1 and the
  target planted and in bloom, at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920; dark at 390, 768, 1440).
- Playwright at 390x844 (touch), 768x1024 and 1440x900, light and dark, 258 assertions passing: opens at p = 0.7
  with the cue; a real touch drag (CDP touch events) on the phone and a mouse drag elsewhere move the bed, frames
  mid drag and mid change, and the plants, signs and cause line agree once settled; the cue leaves; End, Home and
  arrows; Show me how and Esc; Test yourself: the planted bed gives nothing away, a wrong answer is marked, the
  knob locks, Show the answer, Try again, a right answer is marked, Next target, the first try is recorded as
  `hardy-weinberg:target-q16`; the dropdown to Problems and back; back to Explore keeps the setting; reduced motion
  shows the whole result within 320 ms; `#practice`, `#target` and `?seed=` open the right part (the seeded code
  sits in the problem's details as before); no sideways scroll; no console errors.
- Chi-square, Descriptive statistics, Water potential, Simpson diversity, Hardy-Weinberg drift and Osmosis load
  with no errors, and the skills tools still open their problems at `#practice` (the adapter change).
- Preview: `node scripts/tool-preview.mjs bio/tools/hardy-weinberg.html /mnt/user-data/outputs/hardy-weinberg-v2/index.html`
  opens from disk with no errors. Shots, mid animation frames and the contact sheets are in
  `/mnt/user-data/outputs/hardy-weinberg-v2/shots/`; set beside the flagship and Osmosis at 1440.

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students.
- On a wide desktop each plant is narrow inside its cell, so the bed reads as columns of plants with soil between
  them; on a phone the bed is tall and narrow. Both are clean in the sweep, but the plants could be fuller.
- The bed is a sorted model, not a scattered population (said in "?"; open point hw-explore-snapdragons).
- The 100 plants are 100 SVG groups; fine on the devices tested, not measured on a slow phone. (Measured in review
  round 1: see below.)

## Review round 1 (2026-11-18): BLOCK, fixed
The independent review (`/home/claude/review-hardy-weinberg/REVIEW.md`) blocked the tool on five points. The branch
was brought up to `claude/tools-v2-all` (a merge, not a rebase: a force push was refused); the edit to
`scripts/check-tool-use.mjs` and the page's own phone cause line height were dropped (the collecting branch owns both).

### Must fix
1. **Carriers were lost.** Explore stays snapdragons. Targets 1 (q16) and 3 (rare) now use a second bed, **pea
   plants** (`"sp": "pea"`, the `pea` block in the data): A purple dominant over a white, so AA and Aa look the same.
   They keep the old wording ("16% of the pea plants show the recessive trait (white flowers)"; "make the recessive
   trait rare ... then count the carriers"). After the bloom there are two signs ("purple 84%", "white 16%"), the
   Aa plot is named "Aa: carriers" (a pill, once the bed has settled, where the plot is large enough), and the
   answer says purple is p² + 2pq and 2pq are carriers. Purple takes the place of red on the pea bed: the A alleles,
   the p pill and every A_ plant. The q16 answer no longer says "the homozygous class you can count" of a bed
   where every class can be counted: on the pea bed only white can be. The validator checks that pea targets ask
   for the white share and that the pea block is complete dominance.
2. **Plants fused into stalks.** A plant is now at most 0.8 of its row tall (and 1.6 cells wide), and the bushy
   plant is used once a cell is 0.85 as wide as it is tall, so soil shows between rows at every width. The sweep
   now asserts that no two plants touch in a column or a row (drawn boxes, from `data-box` on the plants).
3. **Slow.** Measured with `scripts/tools-v2/hardy-weinberg-perf.mjs` (the reviewer's probe: a mouse drag from
   p = 0 to 1 and back, CPU throttled four times, at 390 and 1440; it also gives main thread CPU per frame from a
   trace, which other processes on a shared machine do not inflate). What changed, each measured:
   - one `<use>` per plant; a flip changes its `href` and class only (no faded copy left behind);
   - each plant is one image: the drawing is made once per genotype and colour scheme as an SVG image, then once
     as a bitmap at the size it is shown (`sprites()`, `toBitmaps()`; remade on a theme or species change);
   - the grow in is three sizes set as the plant's own transform by script (`grow()`), not 100 CSS animations;
   - three layers: the lawn and bed (never repainted during a drag), the plants, and an overlay with the twine,
     the alleles, the pills and the signs, all built once per layout and then changed by attributes and text
     only, so a drag adds and removes no elements (the frame's observers no longer force a layout every step);
   - the cause line's pills keep their elements during a drag (only their text changes).
   Results, CPU ×4, with the machine at load 6 to 9 on 2 cores (other builds running):

   | | Review head (54e3d43b) | Now |
   |---|---|---|
   | 390, drag: frames median / p95 | 50 / 117 ms | 16.7 / 33 to 50 ms |
   | 1440, drag: frames median / p95 | 117 / 367 ms | 16.7 / 50 ms |
   | 390, drag: main thread CPU a frame | 15.2 ms | 4.4 to 5.1 ms |
   | 1440, drag: main thread CPU a frame | 28.9 ms | 5.1 to 5.3 ms |
   | plant `<use>` elements after a drag | 200 | 100 |

   The p95 at 1440 sits at three frames (50.0 or 50.1 ms, frames come in 16.7 ms steps), the edge of the target;
   at 390 it is two frames on most runs.
4. **Sign text overflowed.** Each sign is sized from its measured text (one font size per layout fits the widest
   text a sign can hold, "WW 100%" or "purple 100%"; figures are tabular, so a sign is measured twice per layout,
   never during a drag). The sweep asserts every sign's text and dot lie inside the sign.
5. **The cue asked for a move that did nothing.** The control's hit area now covers the pollen row: a drag (or tap)
   that starts on a pollen grain moves p, so "Drag the alleles" is true. Checked with mouse and real touch.

### Should fix and remove
- The Problems figure on a phone: the key is one line, and the figure is 382 by 112 at 390 (main 382 by 114; the
  review found 81).
- The practice square labels p and q down to a part 22 wide (was 34), so p = 0.12 is labelled.
- "eggs" sits right under the last egg. (At the head of the column the knob covered it when p = 0; the sweep now
  measures the knob with its rings, and caught that.)
- Removed: the hint shown before the first try in "Set the alleles"; it is in the wrong answer feedback.

### Checks run (round 1)
- `node --test scripts/test/apbio-*.test.mjs` (72 pass), `check-apbio-content --check`, `build-apbio --check`,
  `check-site` (it caught "colour" in the pea note; fixed), `check-weight --check`, `build-apmacro --check`,
  `build-apcalc --check`. `check-tool-use` run with a local copy of its list: Hardy-Weinberg reports frame v2.
- Sweep, one process per width: 102,617 checks, 0 failed (new: plants apart in columns and rows, sign text inside
  its sign, the knob with its rings, the pea bloom with two signs and the carriers, the next target back on
  snapdragons).
- `scripts/tools-v2/hardy-weinberg-perf.mjs`: the numbers in the table above.
- Playwright at 390 (touch), 768 and 1440, light and dark, 312 assertions passing: everything in the first round,
  plus a drag that starts on a pollen grain (mouse and real touch), target 1 on the pea bed with the old wording
  and no hint before the first try, the pea signs wrong (75% / 25%) and right (84% / 16%), the answer naming the
  carriers, target 2 back on snapdragons, Explore back on snapdragons. A theme switch redraws the plant images.
  Chi-square, Descriptive statistics, Water potential and Simpson diversity still open their problems at
  `#practice`, and Hardy-Weinberg drift and Osmosis load, all with no errors.
- Preview and shots regenerated in `/mnt/user-data/outputs/hardy-weinberg-v2/` (sweep contact sheets, mid drag and
  mid bloom frames, the pea bed, Problems at 390).

### Still not happy with
- The p95 frame time at 1440 is at the edge (three frames) on a loaded machine; not measured on a real slow phone.
- On a wide desktop the plants are small in wide cells (their width is capped so the flowers are not stretched).
- The pea bed sorts plants into plots like the snapdragons, and peas mostly self pollinate (hw-pea-bed).
