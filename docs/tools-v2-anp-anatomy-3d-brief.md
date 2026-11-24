# Tools v2: A&P 3D anatomy (brief and build notes)

Status file for the v2 rebuild of `anatomy-physiology/tools/anatomy-3d.html` (3D anatomy; rank 20 in
`docs/tools-v2-rollout.md`, Premium, group X "anatomy, 3D and map explorers"). Standard: `docs/tools-v2-standard.md`;
process: `docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-anp-anatomy-3d`, from `claude/tools-v2-all`. NOT
merged: an independent review comes first. Decisions made for the owner are also one line each in
`docs/tools-v2-owner-log.md`.

It reuses the two explorer pieces already built, extended rather than forked:
- **The shared 3D body** (`assets/body3d/viewer.js`) with the NREMT body map's hooks (`project`, `flying`, the `frame`
  and `hover` events, `offset`; branch `claude/tools-v2-nremt-body-map`, taken byte for byte so the two branches merge
  cleanly), plus new hooks that are all off unless a page asks: `fade` (every change of look eases), `selectFly`
  and `fadeOthers` (and `set()` to change them later), `poster` (a still that cross fades to the live body),
  `settling()`, `project(name, part)` (one piece, and the whole drawn box), `frame(names, pad, dir)`. The NREMT body
  map passes none of them and is unchanged.
- **`K.spots`** (`assets/course/tool-kit2.js`), the Lab practical's named places, now also for 3D viewers:
  `project(item)` gives where the item is drawn on every frame (no pins; the viewer does the picking), `wait()` holds
  the card while the picture still moves, a ring marks where the leader ends, and an item's `sub` is a small second
  line on the card (the piece tapped). Without `project` it behaves exactly as before.

## What the old tool teaches (from `origin/main`)
86 structures of the BodyParts3D model (`anatomy-physiology/data/tools/anatomy-3d.json`, 11 systems) in four modes:
Explore (tap a structure: a name tag on the model, the camera flies close, and a side panel card with what it is,
where it is, key features, related structures, the lesson that teaches it and a Keep going strip; tapping one piece of
a group names the piece), Study (names hidden, reveal), Quiz (rounds of 10, "name it" and "point to it", typed or four
choices) and Timed (stations against the clock, no going back, a review). Filters by body system or chapter, Show the
skin, Pick a structure by name and About the model in "Filter & options". Scoring
`anatomy-3d:<structure>:name|point`, events `anp-lab-station` and `anp-practical-finish`. Deep links `#explore`,
`#study`, `#quiz`, `#timed`, `#<structure>`, `?system=`, `?chapter=`, `?focus=`. The rollout row: "Where each structure
is in the body; tap a part; control on the picture; the stage is empty while the model loads" (restyle).

## The one main idea
**Every structure has its place in the body: tap it and it glows where it sits, its name opens on it, and the line
under the picture says where it is.** The old tool flew the camera close to whatever was tapped, so the answer to
"where is it" left the screen: the femur filled the view. Now the camera stays: the part glows in place inside its
region, the rest of the region stays readable round it, and the rest of the body is a faint ghost, so the student sees
where it sits relative to everything else. The cause line puts it into words ("Liver → the upper right abdomen, under
the diaphragm").

Five regions, one per tab (data `explore.tabs`; each tab's body systems in play, every other structure a ghost):

| Tab (phone label) | Systems | Parts | Opens on | Camera |
|---|---|---|---|---|
| 1 Skeleton (Bones) | skeletal | 28 | Femur | the whole skeleton, front |
| 2 Brain and eyes (Brain) | nervous, special senses | 12 | Cerebellum | the head from the left side (the ventricles, fornix and cerebellum read best there) |
| 3 Heart and vessels (Heart) | cardiovascular | 19 | Aortic arch | the heart and great vessels, front |
| 4 Lungs and airway (Lungs) | respiratory | 8 | Right lung, middle lobe | front |
| 5 Abdomen and pelvis (Abdomen) | digestive, lymphatic, urinary, endocrine, reproductive | 19 | Liver | front |

85 parts in Explore. The skin (integumentary, the 86th) has no region: it covers all of them. It stays in Test
yourself (Cards with Show the skin, as before).

## Research (rule 10)
Seen means the page was opened and read here; "text only" means only a description could be read.

| Source | How it works | What we took |
|---|---|---|
| Complete Anatomy, "Infobox Overview" (3D4Medical help, read as text) | Select a structure: an infobox opens with its name; view options Hide, Fade, Hide Others, Fade Others, Isolate | The name opens on selection; "Fade others" is kept but gentle (the region stays readable, `fadeOthers` 0.42), never "isolate" (isolating removes the very context that says where it is) |
| BioDigital Human, "January to June 2024" release notes (support site, read as text) | A system by system Layers tool ("control the visibility of individual anatomical systems"); the selection highlight moved from yellow to teal because it "dramatically increases contrast" | Regions as tabs, each a set of systems in play over a ghost of the rest; the selection glow stays the viewer's teal, and the card, ring, leader and name pill use the same teal so one colour means "the part you named" |
| BioDigital Human viewer, Visible Body Atlas (body map and lab practical briefs, read as text) | Labels pinned to the structure; the information panel beside the viewer (wide) or at its foot (narrow) | The name on a card pinned to the part with a leader (K.spots), no side panel; the depth (what it is, key features, the lesson) behind "?" |
| The old LevlPrep page (`origin/main`, opened at 1440 in Chromium) | Fly close to the tapped part; side panel card; four modes | Everything kept in Test yourself; see "What moved" |
I did not run Complete Anatomy, Visible Body or BioDigital themselves (paid apps or sign in). What ours does better
for this one job: the camera does not leave the region, so "where" is on screen; the line under the picture says where
in plain words from the course's own reviewed "where" text; and the opening still means the stage is never empty.

## The design
- **Main control:** the body. Tap (or click) a part; drag to turn; pinch or scroll to zoom. The viewer picks what is
  drawn under the finger (its raycaster; a ghost is never picked). Tap the same part again, or empty space, to let
  go. Secondary and quiet on the picture: Find a part (magnifier, top left) and Reset view (top right, back to the
  region's framing).
- **What a tap does, in order, every step animated:** the part's glow eases in and the region's other organs and
  vessels ease to 42% (380 ms, the viewer's `fade`); once the picture has settled, the card grows from the part with
  its leader drawing (K.spots), and only then the cause line and the screen reader line say it. A part of a group or a
  pair names the piece too: the card's second line ("Right humerus"), and the leader goes to that piece.
- **The card** (K.spots, projected): the part's name, beside it, kept off the whole drawn structure (both of a pair,
  every rib of a set: the viewer's projected box), off Find a part and Reset view, inside the picture. It follows the
  body while the student turns it (moved, not rebuilt, each frame); it hides while the part is behind or off screen
  and grows again when it comes back.
- **A region change:** the card closes, the old region fades to a ghost while the new one comes in full, the camera
  travels to the new framing (650 ms), then the region's part is named (the last one named there, or its first).
- **Loading:** the stage shows a still of the opening view (`anatomy-physiology/figures/body3d/opening-light.webp` and
  `-dark.webp`, 28 and 26 KB, the model rendered and cut out) with a small progress line; when the model is in, the
  still cross fades to the live body (0.45 s) and the camera then travels into the region. Rollout: "the stage is
  empty while the model loads", fixed.
- **Find a part:** forgiving (K.spots: case, spaces, a final s, accepted names, one slip in a long word, a start of
  three letters or more), across every region: finding the kidneys from the Skeleton tab switches to Abdomen and
  pelvis, then names them.
- **Cause line:** two pills, the name (the selection teal) and where it is (ink): each structure's new `at`, at most
  50 characters (two rows at 360 px), written from its reviewed `where` and held to the ordering rule by the validator.
- **"?"**: how to use it; the named part's full card (what it is, where it is, key features, related parts as
  buttons, the lesson and notes that teach it); every part of the region by name, as buttons (the keyboard route to
  every part); Quiz me on this region (Test yourself); what the model has and lacks; the credit; Show me how.
- **First visit:** one cue ("Tap a bone" on the Skeleton tab, "Tap a part" on the others; "Click" with a mouse) at a
  big part of the region away from the open card, clear of the card and the buttons; it leaves on the first touch of
  the body, a find or a tab. "Show me how" is a three step tour (tap, the line below, find).
- **Reduced motion:** the camera arrives instead of travelling (the viewer's rule), looks ease in 120 ms, the card
  fades in (no grow), the still is replaced at once.

### What is on screen in Explore (counted in the browser, Skeleton at landing, 1440 x 900)
Outside the picture: 5 tabs (10 words), the purpose line ("Find where each bone sits in the body", 8 words), "Show me
how" (3), the cause line (2 pills, 7 words): 28 words; 8 controls (5 tabs, Show me how, Find a part, Reset view). On
the picture: the body, one card (1 to 3 words, a second line for a piece), the ring and leader, the credit
"BodyParts3D, CC BY 4.0". First visit only: the cue. No side panel, no dropdown. Phones show the short tab names
(Bones, Brain, Heart, Lungs, Abdomen).

### Explore against Test yourself
- **Explore:** the five regions above. Nothing graded, nothing asked.
- **Test yourself:** the whole old tool inside, unchanged: its own switch Cards | Study | Quiz | Timed above the
  question (Cards is the old Explore with the full side card, related chips, Keep going and Quiz me), "Filter &
  options" with the system and chapter filters (now also the five regions), Show the skin, Pick a structure by name,
  About the model. The first switch to Test yourself opens a Quiz round on the region Explore showed. Every item, record
  id, score, event, hint, the retry round, the finished card and the timed practical are as before. A round in
  progress survives a visit to Explore (the same question comes back, answered or not); a timed practical stops its
  clock and starts again from its setup (as in the Lab practical).
- **One viewer:** both screens share one WebGL body (one 3.3 MB model, one context): its element moves between
  Explore's stage and Test yourself's; each screen sets what it needs on entry (Explore: its region, skin off, the
  camera stays, fade others 0.42; Test yourself: its filter, the skin preference, the camera flies to a selection and
  fades the rest to 0.1, as before).
- **Deep links:** `#body/<region>` (new) opens that Explore tab; `#explore` and no hash open Explore (the last region
  used); `?focus=<id or name>` opens Explore on that part's region with it named ("See it in 3D" from the Lab practical
  and Word roots), or Test yourself's Cards for the skin; `?system=` and `?chapter=` open the region that holds them
  (the filter is also set for Test yourself), or Test yourself's Cards when no region holds them; `#study`, `#quiz`,
  `#timed`, `#<structure>` (the review queue's link) and `#cards` (new) open Test yourself as before.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Explore: tap a part, the camera flies close, a name tag | Explore: tap a part, it glows in place, the name on a card with a leader (the camera stays, decision 2); Test yourself's Cards keeps the old fly and tag |
| The side card (what it is, where it is, key features, related structures, taught in, Keep going) | Explore's "?" (the named part's card, related parts, the lesson and notes); Test yourself's Cards, unchanged, with Keep going |
| "You tapped: <piece>" | The card's second line, with the leader to that piece |
| Study, Quiz, Timed, Review of every station | Test yourself, unchanged |
| Filters by system and chapter | Explore's tabs are regions; the filters stay in Test yourself's "Filter & options" (plus the regions) |
| Show the skin | Test yourself's "Filter & options", as before; Explore keeps the skin off (it would cover every region) |
| Pick a structure by name | Explore: Find a part on the picture, and every part of the region as buttons in "?"; Test yourself: as before |
| About the model, credit | "?" (and the credit line on the picture); Test yourself as before |
| Quiz me (Explore's dock) | "Quiz me on this region" in "?", and the Test yourself switch |
| The first run coach "Tap any part of the body" | The kit's first visit cue |
| The viewer's Reset view (whole body) | Explore: Reset view brings the region back; Test yourself: the viewer's own, as before |
| Enlarge | The kit hides it in every v2 Explore; the body fills the stage on every screen |

## Decisions made for the owner
(also in `docs/tools-v2-owner-log.md`)
1. Explore is five regions (Skeleton; Brain and eyes; Heart and vessels; Lungs and airway; Abdomen and pelvis), each its
   systems in play over a ghost of the rest; the skin has no region and stays in Test yourself.
2. In Explore a tapped part glows where it is and the camera stays (the old tool flew close): where it sits is the
   idea. Turning and zooming are the student's.
3. The other organs and vessels of the region fade only to 42% when a part is named (the old 10% made the region
   unreadable); Test yourself keeps 10%.
4. The brain region is seen from the left side (the ventricles, the fornix and the cerebellum read there); every other
   region from the front; the heart region frames the heart and great vessels, not every vessel of the trunk.
5. The cause line says where the part is in a few words (a new `at` per structure, written from its reviewed
   `where`); the full card is in "?".
6. A piece of a group or pair is the card's second line, and the leader points at that piece.
7. While the model loads, a still of the opening view (rendered from the model, cut out, 26 to 28 KB per theme) holds
   the stage, then cross fades to the live body.
8. One viewer for both modes (its element moves); Test yourself's first visit opens a Quiz round on Explore's region.
9. The Test yourself filter gains the five regions (an optgroup in "Body system"); a region filter is what "Quiz me on
   this region" sets.
10. A round in progress survives a visit to Explore; a timed practical stops and starts again from its setup.
11. New deep links `#body/<region>` and `#cards`; `?system=` / `?chapter=` open the region that holds them.
12. Weight: `assets/body3d` 17 to 19.2 KB (the opt in hooks; the NREMT body map's 16 to 17 is included, as on its
    branch), the kit 34 to 34.6 KB (K.spots for 3D); the Explore files stay in the A&P shell (68.8 of 69 KB is another
    page's).

## Accuracy
Every `at` phrase restates the structure's own `where` text (reviewed with the tool in October 2026, spec decision 91)
in fewer words; checked again against OpenStax Anatomy and Physiology 2e (25.3 "Gross Anatomy of the Kidney": the
kidneys lie retroperitoneally at about T12 to L3, the right a little lower, and "On the superior aspect of each kidney
is the adrenal gland"), so the kidney phrase says "about T12 to L3". The other positions are textbook constants
(liver upper right under the diaphragm, spleen under ribs 9 to 11, appendix lower right, the tricuspid and mitral
valves between their atrium and ventricle, the pulmonary valve at the right ventricle's exit, radius on the thumb side,
tibia on the big toe side). The validator (`scripts/lib/anp-tool-checks/anatomy-3d.mjs`) now requires `at` (50
characters at most), scans it with the ordering rule like the other fields (no term taught after the structure's
topic) and rejects em dashes; it checks the tabs (systems listed once, the first part and the framed parts on the tab,
a side as three numbers). The left and right of every piece come from the model's own FMA part names (`partNames`),
unchanged. Open points for a person: `docs/anp-needs-author.md`, "3D anatomy, tools v2 regions".

## What was built
- `anatomy-physiology/assets/tools/anatomy-3d-explore.js` and `.css` (new): the five regions.
- `anatomy-physiology/assets/tools/anatomy-3d.js`: with the kit on (`V2`) everything it puts in the studio is Test
  yourself's, its switch (Cards | Study | Quiz | Timed) sits above the question, the viewer is mounted on its own
  element and handed to Explore, the regions join the filter, and the routes above. Without the kit it behaves as
  before. `anatomy-3d.css`: the viewer element on Test yourself's stage.
- `anatomy-physiology/data/tools/anatomy-3d.json`: `explore.tabs` and an `at` per structure; the validator above.
- `anatomy-physiology/figures/body3d/opening-light.webp` and `opening-dark.webp`: the loading stills.
- `assets/body3d/viewer.js` and `assets/course/tool-kit2.js` / `.css`: the hooks above (header comments document them).
- `anatomy-physiology/data/pages.json`: `"kit2": true`, `extraScripts`, `extraCss`.
- `scripts/check-weight.mjs`: the two budgets above.
- Sweep test: `scripts/tools-v2/anp-anatomy-3d-sweep.mjs` (sweep, `--all`, `--frames`, `--perf`).
- `docs/anp-spec.md` decision 105.

## Checks run (2026-11-19)
- `node --test scripts/test/anp-*.test.mjs` 55 pass; `kit2-spots.test.mjs` passes (K.spots with pins unchanged);
  `check-anp-content` 0 failing (the validator now checks `at`, the tabs and the stills); `build-anp --check` clean;
  `check-site` OK; `check-weight --check` all 623 within budget (two raised, decision 12); `build-apcalc --check` and
  `build-apmacro --check` clean (the shared kit changed); no conflict markers.
- Sweep (`scripts/tools-v2/anp-anatomy-3d-sweep.mjs`, one width per process; headless WebGL is software, so the test's
  copy of the viewer skips shadows and anti-aliasing, as premium.js is unlocked only in tests): 360, 390, 430, 600
  202 checks each, 768, 820, 1024, 1280, 1440, 1920 183 each, light and dark, 0 failing. Per width: the loading still
  fills the picture before the model; each region's landing (card inside the picture and 4 px clear of Find a part,
  Reset view, the credit and the cue; off its own ring; card, viewer selection and cause line name the same part and
  the line says its `at`; the body the largest thing; the canvas fills the picture; tab names fit their tabs; cause line
  two rows at most and one height on phones; no text under 11 px; no sideways scroll); the cue's point is checked by a
  real tap there (it names that part, the cue leaves); real taps (touch on phones) on two bones; a tap on empty space
  lets go; find "duodenun" from the Skeleton switches to the abdomen and names the duodenum; no console errors.
- Frames (`--frames`, 390 and 1440, motion on): 32 checks each, 0 failing: every animation frame through a tap, a
  reversal (a second tap 90 ms into the first ease), a region change and a find across regions: the card never shows
  while the picture still moves, the cause line never speaks before the card, both always name the viewer's part, and
  the first part is never named after the second tap. This caught a real bug (the card grew on the frame of the tap,
  before the glow's ease began: `settling()` now covers a change being made). Leaving for Test yourself mid change
  leaves nothing on screen and the body moves to Test yourself's stage; a quiz answer wrong and another recorded as
  `anatomy-3d:<structure>:name|point`; back to Explore the body returns; reduced motion: the card fades in (no grow);
  locked: the Premium card, the tool does not run.
- Every part (`--all` at 1440, each of the 85 found by name and checked as above): 1,246 checks passed before the run
  hit its 40 minute limit (about 73 of the 85 parts; the browser closed under the limit, counted as 1 failure).
- Performance (`--perf`, CPU x4, same hour; headless software WebGL): turning the body, median 2,150 ms and p95 3,733
  ms a frame at 1440 (1,817 and 3,550 at 390); the same viewer on the NREMT body map, untouched by this build,
  2,783 and 4,333 at 1440; the flagship's knob 33 ms median (p95 83 at 1440, 133 at 390). Our own per frame work (the
  card following the body) 1.0 ms median, p95 3.1 ms (1440) and 3.6 ms (390). So the drawing dominates and is no
  worse than before; it cannot be judged headless (see below).
- Shots and the preview: `/mnt/user-data/outputs/anp-anatomy-3d-v2/` (`shots.html` lists them; `index.html` is the one
  file preview, which shows the frame and the loading still: the 3D body needs the site's server).

## Not done, and what I am not happy with
- Performance cannot be judged here: headless software WebGL draws the body at about 2 s a frame at CPU x4 (the NREMT
  body map's, same viewer, is slower still), against the flagship's 33 ms. The frame time rule is not met in this
  measurement and a real phone check is needed; our own per frame code is about 1 ms.
- On a wide desktop the standing skeleton is narrow in a wide stage: the backdrop fills the stage, but the body uses
  about a quarter of its width (a person is tall).
- The card keeps off its own part but can cover a neighbour (the duodenum's card over the liver); the student turns
  the body to see behind it.
- The camera's framings are fixed per region; a part deep inside (the third ventricle, the septal branches) is named
  and glows, but it is small from the region's distance until the student zooms.
- The ghost of the other systems (13%) is visible through the region (the red heart behind the lungs); it gives
  context but reads busy in the chest.
- Test yourself is the old layout inside the new frame (its own stage, switch and side panel); not redesigned.
- The NREMT body map's viewer hooks are taken byte for byte from its unmerged branch: integrate the body map first
  (or together); `scripts/check-weight.mjs` repeats its budget comment so the two merge cleanly.
- No real phone, no screen reader pass, no real students; the independent review is next.

## Review round 1 (2026-11-19, independent review BLOCK; fixed on this branch)
The review (`/home/claude/review-anp-anatomy-3d/REVIEW.md`) passed the shared hooks (off unless asked; the NREMT body map
and lab practical sweeps clean on a merged copy), the accuracy apart from four wordings, the tool's own per frame cost
and the deep links. Merged `origin/claude/tools-v2-all` first (it now holds the NREMT body map): `viewer.js` and the
body3d budget take this branch's side (a superset), the docs tables keep both sides; `check-tool-use.mjs` untouched.

Must fix:
1. **The ring on the named part, and the part always seen.** With `selectOnTop` (new viewer option, Explore only) the
   named part's meshes go to layer 1 and are drawn in a second pass over a cleared depth: the kidneys glow through the
   stomach, a thoracic vertebra through the sternum, and the part still hides its own far side. A tap where it is drawn
   picks it (the picker prefers it), and `project()` points at a spot on its own surface: the middle of the tapped
   piece (or the nearer of a pair) if a ray there and four rays 1.5 px round it meet the part, else the nearest of its
   vertices that passes the same test (`anchorOf`, cached per selection). The sweep's `--all` checks, for every one of
   the 85 parts, that `viewer.hit()` at the ring is that part and that the pixels under the ring change when the part
   is let go (its glow is drawn there).
2. **Back from Test yourself the region is framed again** (every entry reframes), and the cause line is set only once
   the card is actually drawn.
3. **Abdomen framed** on its organs (liver, stomach, pancreas, spleen, small intestine, colon, kidneys, bladder), as
   the heart tab is.
4. Merge done; no conflict markers.

Should fix, done: the two unnamed cartilage meshes (context) join the ghost under a region (`ghostContext`); every
card name is 1 to 3 words (a `label` for the 17 longer names, for example "Septal branches", "Right middle lobe";
the full name stays in "?", the live region and Test yourself, and a label is accepted as a typed answer there; the
validator holds the card name to 3 words); the card keeps off the region's other parts where it can (`others` in
K.spots, a lower weight than the buttons and the part itself); a settled card always has its leader (a leader still
waiting for its draw is started on the next frame); wordings: kidneys "back of the abdomen, T12 to L3, the right
lower" (closes a3x-kidney-level), right superior lobe "the upper right chest, its apex above the clavicle", pulmonary
veins "from each lung to the left atrium", cervical vertebrae "the middle and lower neck"; the big tabs' hover tint
only with a mouse (`@media (hover:hover)` in the kit); `assets/body3d` budget 19.2 to 21 KB (measured 20.4).
Not changed: "Right: Gallbladder." shown in both the caption and the dock in Test yourself on a phone is the same on
`origin/main` (both lines were there before this rebuild).

Checks after round 1 (on the merged branch): A&P tests 55 pass; `kit2-spots.test.mjs` passes (one flaky failure under
load, clean on the rerun); `check-anp-content` 0 failing; `build-anp --check` clean; `check-site` OK; `check-weight
--check` all 623 within; `check-tool-use.mjs` unchanged; no conflict markers. Sweep, one width per process, light and
dark: 360, 390, 430, 600 220 checks each, 768, 820, 1024, 1280, 1440, 1920 201 each, 0 failing (1920 dark crashed once
when the browser was closed under load, clean on the rerun); every check now also asks the viewer what a tap on the
ring picks and requires a leader on a card standing off its ring. `--all` at 1440: 2071 checks, 0 failing (all 85
parts: the ring picks the part and its glow changes the pixels under the ring). Frames at 390 and 1440: 32 each, 0
failing. On this branch: NREMT body map sweep at 390 1227 passed, 0 failed; A&P lab practical sweep at 390 231 checks,
0 failing.


## Recheck 1 (2026-11-23, PASS; its should fix items done in the same round)
Merged `origin/claude/tools-v2-all` again (AP Bio Rates; only the three docs tables conflicted, both sides kept).
Test yourself says its verdict once, in the dock (the caption repeated it, which showed it twice on a phone; that was
already so on `origin/main`). After the camera widens for a part found off the region's picture, the next part named
takes the camera back to the region's own frame once. The cervical vertebrae's "where" says "The middle and lower neck,
between C2 and the first thoracic vertebra". The check-weight comment says 20.6 KB (measured). `kit2-spots.test.mjs`
waits up to 15 s for the pins on a cold first start. Not changed (nit): the right middle lobe's upper face reads near
white where it is lit from above while drawn on top; it reads as part of the lobe.
