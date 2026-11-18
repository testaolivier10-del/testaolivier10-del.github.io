# Tools v2: AP® Biology Simpson's diversity index (brief and build notes)

Status file for the v2 rebuild of `bio/tools/simpson-diversity.html` (rank 11 in `docs/tools-v2-rollout.md`, a
parameter simulator, free). Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`.
Branch `claude/tools-v2-simpson-diversity`, built on `claude/tools-v2-all`. NOT merged: an independent review comes
first. Decisions made for the owner are also in `docs/tools-v2-owner-log.md`.

## The one main idea
**Diversity depends on how many species there are (richness) AND on how evenly the individuals are spread among
them (evenness).** AP Biology uses the formula sheet form D = 1 − Σ(n/N)² (the "infinite population" form, no
n(n − 1)); D is the chance that two individuals picked at random, with replacement, are different species. The most
D can be with S species is 1 − 1/S, reached only when every species has the same count. The tool's model is
`ApBioMath.simpson` (unchanged); the formula variant is already logged in `docs/apbio-needs-author.md`
(simpson-formula-variant), nothing new contested.

## Research (rule 10)
| Source | How it works | What we took |
|---|---|---|
| Biology Simulations, "Diversity and species richness virtual labs" and "How to calculate Simpson's diversity index (AP Biology)" (both pages seen as text) | A "Produce community" button makes a random community; students count and calculate D by hand on a worksheet; no D shown | Confirms AP uses 1 − Σ(n/N)²; their worked numbers (17 animals, D 0.846) match our scale. Their gap: the student never changes the community and sees D answer, which is exactly our Explore |
| Metricgate and Elysia "Simpson diversity index" calculators (search result text only, not opened) | Type counts, get D | Nothing: number boxes, no picture |
| The old LevlPrep tool (origin/main, seen) | A flat quadrat of icons, six −/+ rows, tap to plant, a D meter of stacked (n/N)² blocks, four goals | The goals (now "Build a community"), Even it out, tap to plant; the stacked blocks moved to "?" |
| PhET style rules already in the standard (Natural Selection, Energy Skate Park) | Control on the picture, instant response, one implicit cue | The tray and the plot are the control; D answers on the picture that instant |

What ours does that none of the above do: the student changes a drawn community tree by tree, D answers at once on
the picture, and a mark on the gauge shows the most D can be with that many species, so richness visibly moves the
ceiling and evenness visibly moves the fill toward it.

## The design
- **Picture:** a drawn woodland plot (sky, hills, far woodland, a roped plot of leaf litter seen from a little
  above) with 36 places in rows a half column apart (6 across on a phone or a tall stage, 9 on a wide one), each a tree or bare soil. Five species, each with its
  own outline as well as colour (oak, pine, birch, maple, cherry), so species never rely on colour alone.
- **Main control, on the picture:** the tray at the bottom of the plot (five trees and Cut, a radio group). Tap a
  tree on the plot to replace it with the picked tree, tap bare soil to plant, or pick Cut and tap a tree. Each
  chip shows its count and a bar of its share.
- **Instant, animated result:** the old tree shrinks or falls, the new one grows in; the gauge on the picture (top
  right) shows D as a fill and a mark at 1 − 1/S labelled "max for N species"; an arrow shows up or down.
- **Cause line** under the picture, in the idea's colours: "3 species + mostly oak → pick 2: 50% different species →
  D = 0.50". Every word is read from the trees as drawn, never ahead of them (checked frame by frame).
- **Buttons:** "Even it out" (same trees, same species, shared out evenly; ends on the takeaway "Same trees, same
  species, now even: D rose from 0.50 to 0.67.") and "Start over".
- **Opens** on 16 oak, 4 pine, 4 birch (D = 0.50, max 0.67), with Maple picked, so the first tap adds a species.
- **Cue:** "Tap a tree", once per device, pointing at a tree; its bubble (right, left or above) is placed where it covers no tree, the gauge or the tray.
  "Show me how" (three pointers: tray, a tree, the gauge) from the purpose line and from "?".
- **"?" (Numbers & formula):** the live table for the plot (n, n/N, (n/N)², −/+ per species), D worked out, the
  stacked (n/N)² bar (the old meter, horizontal), what D means, what the gauge shows.

### What is on screen in Explore (counted, opening, 1440 and 390)
1 purpose line and 1 "Show me how" link; 1 picture (the plot, the largest thing at every width, sweep checked) with
36 places (24 trees, 12 bare soil); 1 gauge (4 labels: "Diversity", "D = 0.50", the 0 and 1 ends, "max for 3 species");
1 tray of 6 chips (5 trees with counts, Cut; plus "Plant" at desktop widths); 1 cause line (4 pills); 2 buttons. The
cue on the first visit only. No side panel.

### Explore against Test yourself
- Explore: free play on the plot; nothing graded.
- Test yourself, "Calculate D" (default part, the old Practice, unchanged: seeded problems, the worked problems, the
  quadrat of icons and the D meter, hints). Every problem id, record and deep link kept (`#practice`, `?seed=`).
- Test yourself, "Build a community": the old Explore goals as four challenges on the same drawn plot (raise D with
  the same trees and species; add a species; leave one species; D above 0.75). Starts from the opening plot every
  time and never changes the Explore plot (Explore keeps its own). Deep link `#build`.

### What moved (nothing dropped silently)
- The six −/+ rows: moved to "?" (one −/+ per species in the live table).
- The stacked (n/N)² meter: moved to "?" (horizontal bar); still in Calculate D.
- The readout of Species, N, Σ(n/N)², D: Σ and N in "?"; D on the gauge; species count in the cause line.
- The four goals: Test yourself, "Build a community".

### What the new Explore cannot do that the old one could (owner questions)
- **Six species, up to 200 organisms → five species, 36 places.** Five drawn trees fit the tray at 360 px with 44 px
  targets, and 36 trees stay drawn as trees (not dots). Reverse: `explore.species` and `explore.spots` in
  `bio/data/tools/simpson-diversity.json` (the content check limits 2 to 5 species, spots a multiple of 18).
- **The last goal is D above 0.75, not 0.80.** With five species the most D can be is exactly 0.80, so "above 0.80"
  is impossible. Above 0.75 needs all five species (with four the most is exactly 0.75), in near even numbers
  (for example 6, 6, 6, 4, 2 of the 24 opening trees gives 0.78).
- **The plot can be emptied** (the old one kept at least one organism). Empty reads "No trees → nothing to
  measure", which is honest.

## Decisions made for the owner (also in the owner log)
1. Woodland plot of drawn trees replaces the icon quadrat in Explore (Calculate D keeps the icon quadrat).
2. Five species and 36 places (see above).
3. Build goal "D above 0.75" instead of 0.80.
4. The −/+ rows and the stacked meter moved to "?".
5. Explore and Build a community keep separate plots; Build starts from the opening plot.
6. The gauge marks the most D can be with S species (1 − 1/S): the one extra on the picture, because it is how the
   student sees richness and evenness as two different moves.
7. Second tab renamed "Numbers & formula" (it shows the live numbers, not a problem).
8. Hub blurb reworded to describe the new Explore; title, description and URL unchanged.

## What was built
- `bio/assets/tools/simpson-diversity.js` and `.css`: the scene, tray, gauge, cause line, Even it out, Start over,
  "?", Build a community; the practice stage unchanged.
- `bio/assets/tools/bio-tools.js`: the kit adapter takes a practice part (`practice: true`), "On the plot" label.
- `bio/data/tools/simpson-diversity.json`: the `explore` block; `bio/data/pages.json` `"kit2": true`.
- `scripts/lib/apbio-tool-checks/simpson-diversity.mjs`: checks the explore block (species, start uneven with one
  species still to add, goalHigh reachable and below 1 − 1/S).
- `scripts/tools-v2/simpson-diversity-sweep.mjs`: the kept sweep (the first in that folder).
- `scripts/check-tool-use.mjs`: Simpson diversity listed as a v2 tool; Osmosis moved from "old" to "v2" (it
  already reported v2 on this base) and Water potential is the old frame example.

## Checks run (2026-11-18)
`node --test scripts/test/apbio-*.test.mjs` (72 pass), `check-apbio-content --check`, `build-apbio --check`,
`check-site`, `check-weight --check`, `build-apcalc --check`, `build-apmacro --check`, `check-tool-use` (Simpson
reports frame v2).
Sweep (`node scripts/tools-v2/simpson-diversity-sweep.mjs`): 8 landmark states + the takeaway + Build, at 360, 390,
430, 600, 768, 820, 1024, 1280, 1440, 1920, light and dark; frame by frame at 390 and 1440 (476 frames, 106 with a
tree mid change; words always match the trees drawn); reduced motion. **4716 passed, 0 failed.**
Playwright at 390 (real touch taps), 768 and 1440 (real mouse), light and dark: **152 passed, 0 failed**: opening
counts and cue, replace, plant, cut, keyboard (tray Home and arrows, place arrows and Enter), Start over, Even it
out with the picture in view and the takeaway, "?" calculation, Calculate D wrong then right answer, Build a
community starts fresh and meets challenge 1, the Explore plot kept after Test yourself, deep links `#build`,
`#practice`, `?seed=5`, reduced motion, no console errors.
Preview: `/mnt/user-data/outputs/simpson-diversity-v2/index.html`; shots (`sweep-*`, `v-*`, including mid replace,
mid cut and mid Even it out frames) in `/mnt/user-data/outputs/simpson-diversity-v2/shots/`.

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students.
- The cause pill "pick 2: 50% different species" is the longest label; it fits two rows at 360 px but is more than 3
  words.
- At 768 to 1024 the trees are small against the plot's width; still at least 44 px tall.
- The sweep and verification run on one Chromium only.
