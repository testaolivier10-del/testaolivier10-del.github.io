# Tools v2: AP® Psychology Brain map (brief and build notes)

Status file for the v2 rebuild of `psychology/tools/brain-map.html` (Brain map; rollout row 28, Free, group X
"anatomy, 3D and map explorers"). Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`.
Branch `claude/tools-v2-brain-map`, from `claude/tools-v2-all`. NOT merged: an independent review comes first.
Decisions made for the owner are also one line each in `docs/tools-v2-owner-log.md`.

This is the first AP® Psychology tool on the kit, so it adds the course adapter:
- **`ApPsychTools.kit2(app, { slug, explore(host) -> { stage, ref, shown, ready }, quiz(host) })`** in
  `psychology/assets/tools/psy-tools.js`: the same two modes as `modes()` (its stored choice, `?seed=` and `#quiz`
  still open Test yourself) with the v2 arrangement: Explore is the tool's own stage, full width, no side panel; "?"
  holds its reference; Test yourself keeps the course's step drill (`T.drill`) as before. A page opts in with
  `"kit2": true` on its entry in `psychology/data/pages.json`; `scripts/build-appsych.mjs` then loads
  `assets/course/tool-kit2.css` and `.js`. No other AP® Psychology tool changes.
- **`under(x, y)` on `K.spots`** (`assets/course/tool-kit2.js`, documented in its header): for a picture made of
  areas, a tap names the part drawn under the finger before the nearest pin (a pin pressed itself still names its own
  part; not while a "find it" question waits). Only tools that pass it change; Lab practical, 3D viewer and the body
  map do not.

## What the old tool taught (from `origin/main`)
Explore had two scenes behind a Map / Split brain switch. Map: an illustrated brain in two views (Outside / Inside
switch): tap a structure or its label to read what it does; "If it is damaged" hatched it and said what changes; the
motor and touch strips showed the side of the body they serve; under "More options": labels (key parts, all, none),
"Find a structure" (a dropdown of all 22), and "Light up a task (as fMRI would)" (nine tasks). Split brain: a person
seen from above, a word flashed to one visual field, the corpus callosum cut or intact, the patient names it or not,
the hand run by the hemisphere that has it finds the object; a "Word to flash" dropdown. A side panel held the task,
a two line caption, an "Explanation" (the key ideas, the myth note) and the controls. Test yourself: the step drill
(damage cases, methods and fMRI, split brain, one side of the body, name the structure). On landing a student met
two rows of sub switches, a disabled "Tap a part first" button and a settings row, beside a flat diagram with eight
printed labels.

## The one main idea
**Every part of the brain has a place and a job, and damage there shows the job.** That is CED 1.4 as the exam asks
it: structure to function, and lesion cases as the evidence. Tabs only where the idea changes:

| Tab | Picture | Parts | What a student does |
|---|---|---|---|
| 1 Outside | the left hemisphere seen from the left, front on the left (the head drawn round it, faint, on a wide stage) | 14: four lobes, prefrontal cortex, motor and somatosensory cortex, Broca's, Wernicke's, auditory and visual cortex, cerebellum, pons, medulla | tap a part; press "If damaged" |
| 2 Inside | the brain cut down the middle (right hemisphere's inner surface), front on the left | 15: frontal, parietal, occipital lobe, visual cortex, corpus callosum, thalamus, hypothalamus, pituitary, pons, medulla, reticular activating system, cerebellum, reward center, amygdala, hippocampus | tap a part; press "If damaged" |
| 3 Split brain | a person seen from above looking at a dot on a screen, the brain drawn inside the head, trays of objects under each hand | the two visual fields, both hemispheres, the corpus callosum, speech, both hands | tap a side of the screen; tap the corpus callosum |

The split-brain test is its own tab because it teaches a different idea (lateralization and what the corpus
callosum does), with its own control (where the word flashes).

## Research (rule 10)
"Seen" means the page was opened and read here; "text only" means only a description could be read.

| Source | How it works | What we took |
|---|---|---|
| BrainFacts.org 3D Brain (SfN; Science News review, seen) | A translucent brain; a tap highlights and isolates a structure and a short text box gives its name and function (50 to 100 words); a menu jumps to a structure | Tap the part itself; its name on a card; a find by name that jumps there. Ours keeps the text to two pills (name, job) and puts the rest behind "?" |
| Brain Tutor 3D (BrainVoyager, app page, seen) | Pick an atlas (lobes, gyri, sulci, Brodmann areas) and tap an item in a list; a Description window gives location and connections; sagittal, axial and coronal slices | Two fixed views (outside and the midline cut) are the two the AP exam draws; no list to scroll |
| Complete Anatomy, Visible Body (rollout group X; Lab practical brief) | Tap a structure, a short card, search by name, a "find it" quiz | `K.spots`: the card opens on the picture, search forgives slips and crosses views |
| Nobel Prize educational game "The Split Brain Experiments" (UCSB game database entry, seen; the game itself not run here) | The player runs Sperry's experiment | The experiment as something the student does: tap where the word flashes |
| OpenLearn, "The story of the split brain patients" (seen) | A word flashed for about a tenth of a second to one side while the eyes fix the centre; left side to the right hemisphere: cannot name it, the left hand picks the object; speech "generally" in the left hemisphere; patients act normally in everyday life | The model, the timing note and the caveats in "?" |

What ours does better for this job: the brain is drawn as a brain (folded, lit, lobes in place) instead of flat
colour blocks; a tap anywhere on a part names it (not only on a small label); damage is one switch that works on
every part, with the real case named; the split-brain run shows the signal travel (both eyes, the optic chiasm, the
opposite hemisphere, the corpus callosum) so the student sees why the left hand knows what the mouth cannot say.

## The design
- **Main control: the picture.** Outside and Inside: tap any part (`K.spots` with `under`: the part drawn under the
  finger, by point in polygon on the same polygons that draw it), Tab and arrows between pins, Escape closes the card,
  a tap on bare plate closes it. The name opens on a card beside its pin, the part's colour grows from the pin
  (a circle clip, 0.34 s) and its edge draws. One cue, "Tap any part", at a pin away from the open card, placed where
  it covers no pin, card, find button or front chip. Find by name: the magnifier at the top right (forgiving; a name
  from the other view switches tabs and opens it there).
- **"If damaged"** (one quiet switch beside the cause line, red; it stays on as you tap other parts): a red hatch
  spreads over the part from its pin (0.56 s) and the line becomes "Hippocampus → damaged → no new memories of facts
  and events (H.M.)"; the words wait until the lesion has spread over half the part. The motor and touch strips also
  light the body figure's opposite side ("Right side"; damaged: "Right side: weak" or "numb").
- **Cause line** (`K.cause`): the part's name in its lobe's colour (course colour for the rest) and its job in ink, or
  "damaged" in red and the effect. Each job and effect is a short form of the model's `does` and `damage` (new
  `job` and `hurt` fields, at most 44 characters, tested), so the line fits two rows at 360 px.
- **Split brain**: tap a side of the screen (two `K.tap` halves; the cue says "Tap a side of the screen"). The word
  flashes there (the next word of the model's list each time), light reaches both eyes, a signal runs from both eyes
  through the optic chiasm to the opposite hemisphere, which glows gold; then across the corpus callosum to the other
  side (intact) or into the cut, where a red stop shows (cut); the speech bubble says the word or "I saw nothing";
  the hand run by a hemisphere with the word reaches into its tray and comes back holding the object; the motor path
  from that hemisphere lights (the paths cross low in the brainstem). The cause line grows with the picture: "Left
  field → right hemisphere → can't name it → left hand finds it". Tap the corpus callosum: intact to cut (its two
  ends pull apart, red cut marks); cut to intact brings in a different person (the cut never heals; a cross fade),
  and the line says "Corpus callosum intact → hemispheres share".
- **One colour per idea**: frontal blue, parietal amber, temporal green, occipital purple (picture, card colour role,
  cause pill); damage red; the word's signal gold; the course colour for the picked non cortex part and for "has the
  word" hemisphere names.
- **Every change is animated**: the colour grows from the pin, the edge draws, the lesion spreads, the body side
  fades in, the tab cross fades, the card grows (kit), the whole split run, the cut. Reduced motion: a short fade and
  the result at once (the flash shows its end state).
- **"?"** (the studio's Details sheet): per tab, how to read the picture, the myth note
  (`psy-myth`), every structure with what it does and what damage does, what lights up during each fMRI task, the
  four methods, the named cases with their sources; Split brain: the five steps of the test and its caveats.
- **Performance**: the folded brain is one static svg; everything that moves while a part grows (the colour, the
  edge, the lesion, the body figure) is a second small svg over it (`.bmx-fxl`), so only that layer repaints.

### What is on screen in Explore (counted in the browser, 1440 x 900, landing)
| Tab | Words outside the picture | Controls outside the picture | On the picture |
|---|---|---|---|
| Outside | 26 (tabs 4, purpose 11, Show me how 3, cause line 7, If damaged 2) | 3: tabs (one stop), Show me how, If damaged | 14 pins, the card, Find, Front |
| Inside | 26 | 3 | 15 pins, the card, Find, Front |
| Split brain | 20 | 2: tabs, Show me how | 3 tap targets (two screen halves, the corpus callosum), 8 labels of 1 to 3 words |

### Explore against Test yourself
Explore is free play: nothing graded, nothing locked. Test yourself is unchanged: the five drill kinds of
`ApPsychMath.brainMap.generate`, every record id (`brain-map:<context>:<type>`), `?seed=` and `#quiz`. Its figures
are now drawn by the same art (the folded brain, the split-brain scene at the moment the steps have reached); nothing
is highlighted or named before its step is answered, as before.

### What moved (nothing dropped silently)
| Old | Now |
|---|---|
| Map / Split brain switch and Outside / Inside switch (two rows) | Three tabs: Outside, Inside, Split brain |
| Tap a printed label | Tap the part itself or its pin; the name opens on a card |
| "If it is damaged" (one part at a time, reset on every pick) | "If damaged" switch that stays on while you tap other parts |
| Labels: key parts, every structure, none (quiz yourself) | No printed labels: every name opens on tap; naming without labels is Test yourself's "Name the structure" |
| "Find a structure" dropdown | Find by name on the picture, forgiving, across both views |
| "Light up a task (as fMRI would)", nine tasks | The list of tasks and what lights up is in "?"; choosing the method and reading where activity is stays in Test yourself ("Methods and fMRI") |
| Mirror view (the right hemisphere for right side tasks) | Only with the fMRI tasks; Test yourself's figures still draw the right hemisphere where a case needs it |
| "Word to flash" dropdown | Each flash uses the next word of the same eight; the list is in "?" |
| Pause during a flash | A tap on the screen starts a new flash; leaving mid run (Test yourself, another tab) stops it and shows the end |
| Side panel: task, caption, Explanation, Settings row | Purpose line, cause line; the Explanation and every structure are in "?" |

## Decisions made for the owner
- Drawn in 2D, not on the shared 3D body (`assets/body3d/body3d.glb`, 3.3 MB): that model has white matter,
  ventricles, fornix and brainstem parts but no lobes, strips or language areas, and this tool is free and light.
- Three tabs (Outside, Inside, Split brain) in place of two rows of switches.
- No printed labels in Explore; names open on tap (Test yourself names them).
- The fMRI "light up a task" picker left Explore (to "?" and Test yourself).
- "Word to flash" picker removed: the words take turns.
- The deep parts not on the midline cut (hippocampus, amygdala, reward center) are drawn see-through where they would
  be, solid with a soft edge, not dashed (builder brief: no dashed ghost shapes). Logged in needs-author.
- A cut corpus callosum is not healed by a second tap: a different person, intact, comes in.
- The head is drawn round the brain only on wide stages (it fills the width and shows which way the face is); phones
  keep the larger brain and the "Front" chip.
- `job` and `hurt` short phrases added to the model (`REGIONS[k].job`, `.hurt`) for the cause line.

## Accuracy
Every name, function and damage effect is the model's (`REGIONS`), already checked by the content check and the
validator; the new short phrases say the same and are tested (`scripts/test/appsych-tool-brain-map.test.mjs`).
Science points and their sources:
- Contralateral control and the split-brain logic are the model's `splitBrain()` (tested for both fields, cut and
  intact). Each visual field reaches the opposite hemisphere through both eyes (half of each optic nerve crosses at
  the optic chiasm), which the picture now draws (OpenStax Psychology 2e, 3.4; OpenLearn, "The story of the split
  brain patients").
- Language is drawn in the left hemisphere "for most people", never for everyone; "?" says areas work in networks,
  borders vary between people and plasticity can move jobs. The myth note (no left or right brained people; not the
  10% myth) sits in a `psy-myth` element, as the authoring guide requires.
- Named cases match the drills: Phineas Gage on the prefrontal cortex (Harlow, 1868), H.M. on the hippocampus
  (Scoville and Milner, 1957; his lesion was bilateral medial temporal, which "?" says), S.M. on the amygdala
  (Feinstein and colleagues, 2011).
- The parietal effect says "ignoring one side of space" (neglect follows right parietal damage most often; "?" keeps
  the full `damage` text: "damage on the right can cause neglect").
- The auditory cortex is drawn on the superior temporal gyrus below the lateral fissure, as lateral views draw it (it
  lies mostly inside the fissure); the visual cortex is drawn at the occipital pole outside and along the calcarine
  sulcus inside.
- Open points in `docs/appsych-needs-author.md` ("brain-map-v2").

## What was built
- `psychology/assets/tools/brain-map.js` (rewritten Explore; Test yourself and its figure on the new art),
  `brain-map.css` (rewritten), `math/brain-map.js` (`job`, `hurt`), `psy-tools.js` (`kit2`), `pages.json` and its
  test fixture (`"kit2": true`), `scripts/build-appsych.mjs` (loads the kit for a kit2 tool), the built page.
- `assets/course/tool-kit2.js`: `K.spots` `under`.
- `window.BrainMapExplore` (tab, pick, damage, flash, cut, `_seek`) for the checks.
- Kept checks: `scripts/tools-v2/brain-map-sweep.mjs` (ten widths, one per process, light and dark),
  `brain-map-frames.mjs` (frame by frame), `brain-map-perf.mjs` (CPU x4 against the flagship).

## Checks run (2026-11-23)
See the bottom of this file for the numbers of the last run.
- `node --test scripts/test/appsych-*.test.mjs`: 153 pass (new: the short cause line phrases). `check-appsych-content
  --check`, `build-appsych --check`, `check-site` (OK; the British "colour" in "?" fixed), `check-weight` (all 623
  budgets; brain-map.js 29.5 KB gzipped against 17.2 KB before; the kit bucket 33.3 of 34 KB).
- `scripts/check-tool-use.mjs` with a local copy listing this page: tool-open, tool-touch, tool-mode, tool-use, frame
  v2; nothing sent under automation. Lab practical sweep at 1440 still 160 of 160 with the `K.spots` change.
- Sweep (`brain-map-sweep.mjs`, one width per process, light and dark, ten widths): 0 failing at every width (211
  checks at phone widths, 149 at 1024 and below, 146 above).
- Frames (`brain-map-frames.mjs`): 663 frames, 26 checks, 0 failing (every 50 ms of all four split cases at 390 and
  1440; damage words in real time; leaving mid run; reduced motion). It caught three real slips first (the
  hemisphere named before it glowed, a stale bubble, a CSS opacity that kept the light rays drawn); all fixed.
- Perf at CPU x4 (`brain-map-perf.mjs`, machine load 11 on 2 cores, same run as the flagship): split flash median
  16.7 ms, p95 33 ms at 390 and 1440; eight taps with damage on: median 16.7 ms, p95 67 to 167 ms; main thread 3 to
  4.3 ms a frame. The flagship's knob drag in the same run: median 50 ms, p95 100 ms. The moving layer was split
  from the static brain after the first run (1440 outside went from median 50 ms to 16.7 ms).
- Preview `/mnt/user-data/outputs/brain-map-v2/index.html`; 120 shots in `shots/` at 1440, 768 and 390, light and
  dark (landing, picks, damage, mid grow and mid lesion, split mid run at four moments and the end of each case,
  Test yourself).

## Not done, and what I am not happy with
- The folds are drawn streamlines: they read as a brain, but as an illustration, not an atlas photograph.
- The tap-a-part p95 is above 50 ms on this loaded machine (the card and cause line rebuild on each tap); time it
  on a quiet machine.
- The split-brain scene's arms are straight tubes and the body figure is flat; the hemisphere labels sit beside the
  head rather than on the hemispheres.
- On phones the Inside view's fifteen pins are tight (they pass the 18 px rule; a tap on the part itself helps).
- Test yourself is unchanged apart from its figures; a "find it" part on the picture (`K.spots.ask`) would be a
  natural addition later.

## Review round 1 (2026-11-23, `/home/claude/review-brain-map/REVIEW.md`: BLOCK, every item fixed in one round)
Merged `origin/claude/tools-v2-all` first (only the status tables conflicted; both sides kept).
- **Must fix 1, a pin naming another part.** `K.spots` with `under`: a tap on a pin, or within 16 px of one, names
  that pin's part (the hit layer sat over the pins, so only the keyboard got this before); the part drawn under the
  finger only elsewhere. The RAS's hit area is now its dotted core (x 562 to 589), so the pons and medulla own what is
  drawn as them; the medulla's pin moved onto the medulla proper. The sweep now taps every pin of both views.
- **Must fix 2, objects.** Each tray holds the flashed object and two others (`trayObjs`); the one the hand takes
  leaves its tray while the hand holds it. Test yourself figures do the same.
- **Must fix 3, the phone text bump.** `data-ls-text="keep"` on the picture, the effect layers and the drill figure;
  the sweep reaches Split brain by a real tab tap under reduced motion and fails on any inline font size.
- **Must fix 4, reduced motion.** The flashed word stays in its field at the end state (a still mark).
- **Must fix 5, light over the labels.** The light starts at the screen's lower edge and the field labels are drawn
  over it; the frames check fails if the light's box crosses a field label.
- **Should fix 6.** A table the person leans over spans the whole frame (screen and trays stand on it); the trays sit
  at a natural reach beside the head, the arms bend at the elbow, the body has a shoulder line. The phone layout is
  1000 x 1000 with the head lower, so the cue sits between the screen and the eyes.
- **Should fix 7.** The motor paths are drawn over the brain (faint; lit when a hand acts).
- **Should fix 8.** Hippocampus, amygdala and reward center are drawn at 50% under the brainstem's outline and lines.
- **Should fix 9.** A faint line marks the prefrontal cortex's border inside the frontal lobe.
- **Should fix 10.** On phones the brain views crop to the brain (910 x 690 picture units): the brain draws about 10%
  larger. The pins, taps and cue are placed in picture units (`TX`, `TY`), so the kit's layer is the picture again.
- **Should fix 11.** The split cue prefers the plate beside the screen and never covers the eyes (nor the head on a
  wide stage).
- **Should fix 12.** Each picked part's colour, edge and lesion are drawn in their own small svg the size of the part's
  box (`.bmx-fxp`), so only that box repaints while they grow; the full-size overlay keeps only the body figure.
- **Should fix 13, the adapter** (`ApPsychTools.kit2`, API unchanged for neuron): (a) when `LevlKit2` is missing (a
  cached old page) it loads `tool-kit2.css` and `.js` itself and sets up once they arrive; the object it returns
  forwards `show()` until then, so neuron's own loader can go when it integrates; (b) the header documents the
  return value, what `modes()` returns: `{ explore, quiz, show(mode, user), bar }`; (c) `shown()` is called once at the
  start (through `onShow`), not twice.
- **Removed.** The "Front" chip on wide stages, where the head is drawn (it stays on phones and tablets).
- Not changed: item 14 (a text conflict with anatomy 3d in the `K.spots` header comment) is for whoever merges second.
