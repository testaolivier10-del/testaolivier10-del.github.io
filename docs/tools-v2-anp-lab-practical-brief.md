# Tools v2: A&P Lab practical (brief and build notes)

Status file for the v2 rebuild of `anatomy-physiology/tools/lab-practical.html` (Virtual lab practical; rank 7 in
`docs/tools-v2-rollout.md`, Premium, group X "anatomy, 3D and map explorers"; the first explorer tool). Standard:
`docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-anp-lab-practical`,
from `claude/tools-v2-all`. NOT merged: an independent review comes first. Decisions made for the owner are also one
line each in `docs/tools-v2-owner-log.md`.

This is the first explorer, so it adds one shared piece:
- **`K.spots`** in `assets/course/tool-kit2.js` (and `.css`; documented in the kit's header): named places on a
  picture. A pin per structure (more points draw as small dots of the same item), a tap acts on the pin nearest the
  finger (never on a box round a neighbour), a **label card on the picture** with a leader line that grows from the
  pin, keyboard (Tab, arrows, Escape), **find by name** (forgiving: case, spaces, brackets, a final s, accepted names,
  one slip in a long word, a start of three letters or more), and a **"find it" question mode** (`ask(id, cb)`: the
  next tap answers, the tapped pin is marked right or wrong and the asked one's card opens). `--tk2-spot` colours the
  pins for a picture. Later explorers (body map, brain map, 3D anatomy, map readers) reuse it; this tool uses the
  tap, card, keyboard and find parts (the ask mode is for a later Test yourself, see "Not done").

## What the old tool teaches (from `origin/main`)
83 image sets (2,748 asked labels on 201 OpenStax figures, `anatomy-physiology/data/tools/lab-practical.json`) behind a
grouped picker, in four modes: Explore (printed labels shown; tap one for its name, what it does, Keep going links and
"See it in 3D"), Study (labels masked, tap to reveal), Quiz (name it, point to it, multiple choice, hints, retry
round) and the timed practical (stations, a clock per station, follow up questions, review at the end). Every scored
answer is recorded as `lab-practical:<set>:<figure>:<label>` (and `:follow`), fires `anp-lab-station` and
`anp-practical-finish`. The rollout row: "Naming structures on a real figure; tap a label; control on the picture"
(restyle). On landing a student met 4 modes, a dropdown of 83 sets, figure tabs, zoom, and a figure whose printed
labels already said every answer.

## The one main idea
**Every structure on a lab specimen has a name and a job: point at it, and the name opens on the picture with what it
does.** A lab practical is pointing at a part and naming it, so Explore is the specimen with nothing printed on it:
tap a part (a pin on it), its name opens beside it, the line below says what it does.

Six specimens, one per tab (each one lab figure, a station of an existing set; chosen to cover the most tested lab
practical systems with a clean, single view figure):

| Tab | Figure (set, station) | Parts | System |
|---|---|---|---|
| 1 Heart | os-19-9 (heart-internal, 1) | 15: great vessels, four chambers, four valves, septum, papillary muscle, chordae | Cardiovascular |
| 2 Brain | os-13-7 (brain-lateral, 1) | 7: four lobes, three grooves | CNS |
| 3 Skull | os-7-5 (skull, 2) | 16: eight bones, three sutures, five landmarks | Skeleton |
| 4 Neuron | os-12-8 (neuron-structure, 1) | 8 | Nervous tissue |
| 5 Skin | os-5-2 (hair-follicle-glands, 2) | 12: three layers, hair, glands, fat, vessels | Integumentary |
| 6 Kidney | os-25-8 (kidney-section, 1) | 12 | Urinary |

70 parts in Explore. The other labels of these figures (the skull's 11 smaller landmarks, the heart's 9 others, the
skin's sensory receptors) and all other 77 sets stay in Test yourself, every one.

## Research (rule 10)
Seen means the page was opened and read here; "text only" means only a description could be read.

| Source | How it works | What we took |
|---|---|---|
| Complete Anatomy (WSU Elson S. Floyd College of Medicine's guide, seen) | Tap or click a structure, or search for it; it is shaded in its system's colour and an information panel opens at the side (isolate, hide, fade) | Tap a part to select it and search by name; but the name opens ON the picture (rollout X: no side panel), and the part is marked on the picture |
| Visible Body Atlas (Cengage help for iPad, seen) | Select a structure to open its Info Box (name, definition, pronunciation); a separate Tag tool labels; quizzes ask to select a structure | The name and a short "what it is" appear together; the "select the structure" quiz is the shape of K.spots `ask()` |
| BioDigital Human (support article on Label Anatomy questions, seen) | Labels are hidden in quiz mode by default; the learner names the structure picked in the model | Explore shows names on demand only (nothing printed), Test yourself is where naming is graded |
| Complete Anatomy, Visible Body, BioDigital apps themselves | Not run here (3D apps behind accounts) | Text only |

What ours does better for this job: the specimen is a real lab figure (what a practical shows), the pin sits where
the figure's own label pointed (so it is exactly the textbook's structure), the name card opens beside the part, not
in a panel, and the line under it says what the part does in two short pills.

## The design
- **Main control:** the picture. Tap a pin (or near it: the nearest pin within about 26 px, never a box), or Tab to
  the pins and use the arrows. One cue on the first visit, "Tap a dot", at the pin farthest from the open card; it
  leaves on the first tap.
- **The label card** opens beside the pin, on the side the figure printed that label (so it reads like the figure),
  moved to the other side, above or below when that keeps its own pin, more pins and the find button clear; it never
  leaves the picture. A leader line runs from the card to each point of the part (K.spots takes two or more points for
  one part when a figure points twice; every part here has one point: the skin's vascular plexus was given two at
  first and one since, on its artery and vein pair).
- **Cause line** (`K.cause`): two pills, the part's name (course colour) and what it does (ink), for example
  "Left ventricle → pumps blood to the whole body". Each "does" is a short phrase checked against the label's own
  reviewed explanation (`fn`), at most 56 characters so it fits two rows at 360 px.
- **Find a part:** a quiet magnifier at the top left of the plate; it opens into a field. A match opens its card
  (type "mitral", "svc", "papilary muscle"); no match turns the field's border red.
- **Every change is animated:** the card grows from the pin (0.26 s) while the leader draws, the pin fills and
  swells, a halo rings once from it; a tab cross fades the new specimen and its card opens once the picture has
  drawn (labels wait for the picture). Reduced motion: a short fade, the result at once.
- **The picture** is the figure drawn clean: every printed label and its leader line painted out by
  `scripts/build-lab-specimens.py` (lines followed into the drawing and inpainted; a few branches the follower
  missed are named in the data as `erase`), cropped to the drawing, AVIF with a WebP fallback (8 to 57 KB each). It is
  on a white plate in both themes (the figures are drawn on white), fitted to the stage: on a desktop as big as the
  stage's height allows, on a phone the full width.
- **Colours:** one accent (the course colour) for "this is the part you named": the pins, the card's border, the
  leader and the name pill. On the white plate the pins keep the light theme's course colour in dark mode too.

### What is on screen in Explore (counted in the browser, Heart at landing, 1440 x 900)
Outside the picture: 6 tabs, the purpose line ("Name each part of the heart and what it does", 9 words), "Show me
how", the cause line (2 pills, 8 words): 26 words with the tab names; 8 controls (6 tabs, "Show me how", the find
button). No side panel, no dropdown. On the picture: 15 pins, one card (1 to 3 words), the credit "OpenStax, CC BY
4.0". First visit only: the cue "Tap a dot".

### Explore against Test yourself
- **Explore:** the six specimens above. Nothing graded, nothing asked.
- **Test yourself:** the whole old tool, unchanged inside: the set dropdown (83 sets), and its own switch Labels |
  Study | Quiz | Timed (Labels is the old Explore view, printed labels shown and tap for the name and Keep going;
  the timed practical's setup is one tap away from any set). Every item, record id, scoring, event, the follow up
  questions, the retry round and the finished cards are as before. Switching to Test yourself opens the set of the
  specimen you were on, in Quiz.
- **Deep links:** `#specimen/<tab>` (new) opens that Explore tab; `#explore/<set>[/<n>]` opens the Explore tab when
  that figure is a specimen, else Test yourself's Labels view as before; `#study/…`, `#quiz/…`, `#practical`,
  `#review`, `#explore` open Test yourself as before; `?chapter=` and `?topic=` open the matching specimen when there
  is one, else Test yourself on that chapter's set as before.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Explore (printed labels shown, tap for the name and what it does) | Explore, on six clean specimens (names on demand); for every set, Test yourself "Labels" |
| Study, Quiz, Timed practical, Review my missed structures | Test yourself, unchanged |
| The set dropdown and its search | Test yourself only |
| What a structure does (the full `fn` text), Keep going links, See it in 3D | Test yourself "Labels" (tap a label), as before; Explore shows a short phrase of it |
| Figure tabs, zoom, upper or lower view | Test yourself, unchanged (Explore's specimens are single view and fitted) |
| About this tool, figure credit | "?" (Explore: the specimen's full credit with "Adapted: labels hidden"); About, as before |

## Decisions made for the owner
(also in `docs/tools-v2-owner-log.md`)
1. Explore is six curated specimens (Heart, Brain, Skull, Neuron, Skin, Kidney), one lab figure each; the other 77
   sets and every label stay in Test yourself (rollout open question 5, answered as for Graphs).
2. The specimens are the course's own OpenStax figures drawn clean (labels and leader lines painted out), not new
   drawings: a lab practical names parts on real figures, and the figures are already reviewed and licensed.
3. A pin marks each part where the figure's own leader line ended; the part is not shaded (the figures are flat
   images; outlining each structure by hand for 70 parts was not attempted).
4. The old Explore (labels printed, tap for details) is Test yourself's "Labels" for every set; Study, Quiz and Timed
   sit beside it there.
5. Find by name is a quiet magnifier on the plate (a connected secondary control, rule 11), not a panel.
6. The cause line is a short phrase written for Explore from each label's reviewed explanation; the full explanation
   stays in Labels.
7. The plate is white in both themes (the figures are drawn on white).
8. Leaving Test yourself during a timed practical stops its clock; it starts again from its setup.
9. The weight budgets (review round 1 changed this): the v2 kit (`tool-kit2.js` and `.css`) is its own bucket,
   `assets/course/kit2`, budget 34 KB (measured 33.0), as `assets/body3d` and `assets/video` are; the shared course layer
   stays at 57.4 KB (56.9 measured); the A&P shell 61 to 69 KB (Explore, measured 68.7); the specimens' data file gets a
   data budget of 6 KB (5.0 measured).

## Accuracy
Every pin was placed where the figure's own leader line ends (traced from the label box by
`scripts/build-lab-specimens.py`'s line follower, then checked by eye on enlarged crops of the original figure); where
the follower stopped at a bend (the right ventricle's elbowed line) or between two cords (chordae tendineae), the
point was moved to the line's true end on the same structure and checked again. Points set by eye where no single
line ends on the structure: the zygomatic arch (the trace ran along the jaw), the external acoustic meatus (the
opening, a few pixels from the line end), the epidermis, dermis and hypodermis (layer labels point at the edge of a
layer; the pin sits inside it), the medulla, cortex and parietal lobe (inside the region), the node of Ranvier (the
gap between two myelin segments). Every "does" phrase was checked against that label's reviewed `fn` text and the
ordering rule (the validator scans it against the station's topic: "neck muscles" was caught and reworded).
Validator: `scripts/lib/anp-tool-checks/lab-specimens.mjs` (asked labels only, so a label covered for a later topic
is never shown; points inside the crop; pins at least 30 figure pixels apart; short phrases with no later term).
Open points for a person: `docs/anp-needs-author.md`, "Lab practical tool, tools v2 specimens".

## What was built
- `assets/course/tool-kit2.js` and `.css`: `K.spots` (header documents it).
- `anatomy-physiology/assets/tools/lab-explore.js` and `.css` (new): the six specimen screens.
- `anatomy-physiology/data/tools/lab-specimens.json` (new, validated) and `figures/specimens/` (clean pictures and
  `index.json` with each crop), from `scripts/build-lab-specimens.py` (`--check` reports a missing picture).
- `scripts/build-anp.mjs`: publishes `assets/tool-data/lab-specimens.json` with each spot's name, accepted names and
  card side, the picture paths and the figure's credit (only specimens whose topic is published).
- `anatomy-physiology/assets/tools/lab-practical.js`: with the kit on (`V2`), every part it puts in the studio is
  Test yourself only, its own mode switch (Labels | Study | Quiz | Timed) sits above the question, the first-run ring
  is off in Explore, links route through `routeV2`. Without the kit it behaves as before.
- The A&P adapter (`AnpToolKit.kit2`) is unchanged; `tool-kit.js` only hides the set dropdown while Explore shows on a
  kit2 tool (the dropdown is Test yourself's; two lines, additive).
- `anatomy-physiology/assets/tools/lab-practical.css`: in Test yourself on a phone or tablet the figure sizes by the
  width (the question comes first, the stage keeps its natural height).
- Build opt in: `"kit2": true`, `extraScripts`, `extraCss` on the tool in `anatomy-physiology/data/pages.json`.
- `scripts/check-weight.mjs`: the two budgets above.
- Sweep test: `scripts/tools-v2/anp-lab-practical-sweep.mjs`.
- `docs/anp-spec.md` decision 102.

## Checks run (2026-11-18)
`node --test scripts/test/anp-*.test.mjs` 55 pass; `check-anp-content` 0 failing (tools too, with the new
`lab-specimens` validator); `build-anp --check` clean; `check-site` OK; `check-weight --check` all 620 within budget (two
raised, above); `build-apcalc --check` and `build-apmacro --check` clean (the shared kit changed);
`python3 scripts/build-lab-specimens.py --check` clean; `check-tool-use` with a local copy of its list (this tool in
place of the old-frame sample): tool-open, tool-touch(explore), tool-mode(quiz), tool-use as frame v2, nothing under
automation (the file itself is the collecting branch's, unchanged).
Sweep (`scripts/tools-v2/anp-lab-practical-sweep.mjs`, one width per process, all ten widths, light and dark): every
specimen at landing and with each of its 70 parts named; 158 to 229 checks per width, 0 failing (card inside the
picture and clear of its own pins, of every other pin and of the find button; pins inside the picture and apart;
picture fills the plate or half the screen and is the largest thing; cause line two rows at most on phones, one
height up to 1,100 px, pills inside it; the first visit cue on every tab clear of pins, card and button and inside the
picture; a real tap (mouse, or touch on phones) beside a pin names it, a tap on bare picture closes the card; find
forgives case, a slip, an accepted name and a start; no sideways scroll; no console errors). Contact sheets:
`/mnt/user-data/outputs/anp-lab-practical-v2/sweep/`.
Playwright at 390, 768 and 1440, light and dark (166 checks, 0 failing): opens on Explore with the cue and no dropdown;
a touch tap (phone, tablet) or click names the part, card and cause line agree mid animation (frame at 90 ms), the
screen reader line names the current part, the cue leaves; arrow keys move to the next pin, Escape closes; find by
name; all six tabs (frames mid cross fade and after); Test yourself opens on the Explore specimen's set; typed answers
right and wrong marked and recorded as `lab-practical:<set>:<figure>:<label>`; the timed practical starts, and
switching to Explore mid run stops it (nothing left on screen); reduced motion fades the card in with no grow; the
real locked state shows the Premium card as before; ten deep links land as listed above; no console errors.
Performance (CPU x4, taps every 60 ms): median frame 16.7 ms at 390 and 1440; p95 33 ms at 1440 and 83 ms at 390 (a
tap is one event, not a drag; the long frames are the card placement on the phone's denser picture).
Shots: `/mnt/user-data/outputs/anp-lab-practical-v2/shots/` (landing, mid grow, tap, find, each tab mid swap and after,
quiz right and wrong, timed setup and run, reduced motion, locked); preview `index.html` (made with the new
`--json` option of `scripts/tool-preview.mjs`, which inlines the specimens and their pictures). Compared side by side
with the flagship's shots: same frame, tabs, purpose line, cue and cause line.

## Not done, and what I am not happy with
- The specimens are flat figures with pins, not shaded regions: a tap names the nearest pin, so a tap on the far edge
  of a big part (the left ventricle's wall) names whatever pin is closest, or closes the card when none is within
  about 26 px. Complete Anatomy shades the whole structure; doing that needs a hand drawn outline per part.
- A few painted out leader lines leave a faint smudge where they crossed a coloured fill (the skull's temporal
  region, the heart's left wall); the drawing reads clean at the shown size, but enlarged it shows.
- K.spots' `ask()` ("find it") is built and documented for the next explorers but not used here: Test yourself
  keeps the old Quiz with its "point to" mode, which records the same ids.
- On a desktop a portrait specimen (heart, skin, kidney) leaves white plate on both sides of the picture: the picture
  is fitted to the height, so the stage is not filled edge to edge as the flagship's lake is.
- Tap performance on a phone at CPU x4: p95 83 ms when tapping every 60 ms (the card placement scores many places).
- Test yourself is the old layout inside the new frame (its own figure, zoom, dropdown and switch); it was not
  redesigned.
- No real phone, no screen reader pass, no real students; the independent review is next.

## Review round 1 (2026-11-18)
The independent review (`/home/claude/review-anp-lab-practical/REVIEW.md`) blocked on four must fix items; all 70 pins and
phrases were confirmed right and nothing dropped. Merged `origin/claude/tools-v2-all` first (its
`check-tool-use.mjs`, both sides of the docs tables); the A&P spec decision for this tool is now 102 (Pathways took 101).

Must fix:
1. **Specimens cleaned again** (`scripts/build-lab-specimens.py`, rewritten). Each leader is found as straight segments
   chained to its label box (plus the line followed through its bends from the box, and a few `erase` lines in the
   data, snapped onto the line), merged so one line is one segment, with its own width measured (line, soft edge and
   halo). Under a band each pixel takes the colours of the band's two sides (on white both sides: background); edges
   between two colours and band crossings are filled from the drawing round them only (never from the white
   background); an outline a line cut through is joined across it in its own colour and width; and the drawing's
   outer outline is put back from the original under every band (dark pixels within 4 px of the background, never a
   stub with background on two sides). Crumbs, ticks and grey ghosts left on the background are removed. Checked by
   eye on all six at 1x in the tool and enlarged 2 to 4x against the original (shots
   `/mnt/user-data/outputs/anp-lab-practical-v2/shots/r1-specimens/`, 1440 light and dark, 390 at 2x).

Checks (round 1): A&P unit tests and `kit2-spots.test.mjs` 56 pass; `check-anp-content` 0 failing; `build-anp --check`
clean; `check-weight --check` all 622 within budget; sweep one width per process at all ten widths, light and dark,
160 to 231 checks each, 0 failing (now also: a miss over the drawing keeps the card and rings two pins; the cue on
every tab's first screen); Playwright at 390, 768 and 1440, light and dark, 162 checks pass (taps, keys, find, mid
animation frames, every tab mid swap and after, Test yourself right and wrong with their record ids, the timed
practical stopping, reduced motion, the locked state, ten deep links, no console errors). Preview regenerated.
2. **A miss keeps the card** (K.spots): a tap over the drawing that is near no pin keeps the card and the line and
   rings the two nearest pins twice (`onMiss`; reduced motion: a still ring); only Escape or a tap where the tool's
   `blank(x, y)` says the picture is empty (Lab practical: white all round the tap in the specimen's own pixels, or the
   plate round the picture) closes it. Tested in the sweep (a real mouse or touch tap on the heart far from every pin)
   and in `scripts/test/kit2-spots.test.mjs`.
3. **The plate hugs the picture**: it is as wide as the picture plus padding and centred, so the stage keeps its theme
   colour round it; the find button and the credit sit in the plate's own top and bottom padding.
4. **Weight**: the kit has its own bucket (decision 9 above, rewritten); `assets/course` is back at 57.4 KB.

Should fix:
- On a tab change the picture fades in first; the pins fade in with it and the card and the cause line open once it
  is drawn (about 0.24 s; reduced motion 0.06 s). A part tapped during the fade stays named (the sweep caught the
  opening card replacing it once at 820).
- Tap cost: each card is measured once per part and picture width, the far fallback places are scored only when no
  near place is clear, the halo restarts on the next frame instead of forcing a layout, and the picture and the line
  under it are layout and paint containers (a tap re-lays out only them). CPU x4, a tap every 0.4 s: p95 frame 33 ms
  at 390 and at 1440 (median 16.7).
- The card is as wide as its longest line (a two line name such as "Cell body (soma)" has no empty space at its right).
- `find()` finds nothing while an `ask()` question waits (`asking()` reports it), and a miss while asking answers
  nothing; `scripts/test/kit2-spots.test.mjs` tests tap, miss, blank, Escape, find and ask in a real browser (skipped
  where Playwright is not installed).
- Sharper pictures on 2x phones: not done. OpenStax's larger originals cannot be reached from this environment (the
  host is refused), and upscaling the 1,100 px figures adds no detail; the specimens stay at the figures' native size.
- The brief's point count for the vascular plexus is corrected (one point).

What is still not perfect: where several leaders cross busy detail (the heart's valves and chordae, the skull's
maxilla edge, the neuron's dendrites at the top left) the fill is a soft patch rather than the original detail, and
the outline can show a 1 to 2 px jog where a line crossed it. They no longer read as lines, dashes or ticks at the
drawn size.

## Recheck 1 (2026-11-18)
The independent recheck (`/home/claude/review-anp-lab-practical/REVIEW.md`, "Recheck 1") passed everything but one must
fix: the outline repair left black marks the original figure does not have (the heart's pulmonary artery cut ends, a
checkered blob at the left one, marks at the right wall; four on the skull's occipital outline and beside the upper
teeth; grey blocks in the neuron's faded dendrites).

- **Fix** (`scripts/build-lab-specimens.py`, new step 6 in `clean()`). The measure is the original with its lines taken
  out (`mark_ref`): soft, each whole band inpainted from the original round it; strict, only the band's dark pixels
  inpainted. `new_dark` marks a pixel darker by more than 40 than every pixel of the soft reference within 2 px
  (lightness under 200), or near black (under 110) and darker than the strict one (an outline put back at an open vessel
  end or beside a line that ran along it). A join drawn across a band (an outline carried through) stays. Each mark and
  its soft edge take the reference's colour: white on the background (strict white joined to the edge), else the soft
  reference, the strict one where the soft one would still be black. The guard clears with 20 of headroom so the
  compressed pictures pass. The brain's crop lost one row (index.json and the tool data rebuilt).
- **Check.** `build-lab-specimens.py --check` now cleans each figure again in memory for its bands and runs `new_dark`
  on every written `.avif` and `.webp`; it lists each mark (size, place) and fails on any. On the round 1 pictures it
  lists every mark the review named among its places (heart 60, skull 41, neuron 7, skin 24, kidney 18; the brain's
  crop moved, so not compared); on the new ones none.
- **By eye**, all six at 1x and 2x (marks 3 to 6x) against the original and the round 1 pictures: no black bars, blob,
  ticks or grey blocks; the kidney's vein crossings and the skin's vessel ends are no worse. Still soft patches: the
  heart's left pulmonary artery top corner has no outline for about 10 px (the leader ran along it), the skull's
  occipital outline has small breaks where three leaders met it at a shallow angle, and a faint dendrite stripe stays
  in the neuron where the line crossed it.
- **Checks.** `--check` clean; A&P unit tests and `kit2-spots.test.mjs` 56 pass (one flaky failure on the first run,
  clean on the rerun); `check-anp-content` 0 failing; `build-anp --check` clean; `check-weight --check` all 622 within
  budget; sweep at 390 (231 checks) and 1440 (160), one width per process, 0 failing. Preview regenerated
  (`node scripts/tool-preview.mjs anatomy-physiology/tools/lab-practical.html <out>/index.html --json
  anatomy-physiology/assets/tool-data/lab-specimens.json`).
