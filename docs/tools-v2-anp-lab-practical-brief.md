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
  leaves the picture. A leader line runs from the card to each point of the part (two points for one part when the
  figure points twice, the skin's vascular plexus is one).
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
9. The weight budgets rise: the shared course layer 57.4 to 83 KB (the v2 kit is counted for the first time, because
   this is the first kit page in the budget list), the A&P shell 61 to 68 KB (Explore's 6.7 KB).

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
