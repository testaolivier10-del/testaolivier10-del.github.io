# AP® Psychology, Sensation and perception: tools v2 plan

**Tool and page:** `psychology/tools/sensation.html`; scripts `assets/tools/sensation.js`, `math/sensation.js`,
`sensation.css`; data `data/tools/sensation.json`; test `scripts/test/appsych-tool-sensation.test.mjs`.
**Premium.** Rollout row 122, group P, wave 14.

**The one idea:** your senses take in energy and your brain decides what is out there. Four tabs, one idea each
(CED unit 1 sensation and perception topics):
1. Detect: where you set your criterion trades hits against false alarms (signal detection).
2. Weber: you notice a change only when it is a big enough fraction of what is already there.
3. Color: stare at a color and the opposite color appears afterward (opponent process).
4. Perceive: the brain uses depth cues and Gestalt rules to build a scene from a flat image.

**Research:**
- [Hanover ISLE, Signal detection decision](https://isle.hanover.edu/Ch02Methods/Ch02SDTDecision.html) and
  [ROC](https://isle.hanover.edu/Ch02Methods/Ch02SDT_ROC.html): two curves, a draggable criterion, the four outcome
  counts. Take: drag the criterion and the four counts change at once.
- [WISE, Signal detection tutorial](https://wise.cgu.edu/wise-tutorials/tutorial-signal-detection-theory/signal-detection-overview-2/):
  a real decision (a radiologist, a lifeguard) behind the curves. Take: the task drawn, the curves small.
- [Michael Bach, Optical illusions and visual phenomena](https://michaelbach.de/ot/): afterimages and Gestalt
  figures that work on the viewer. Take: the afterimage demo as a real effect on the student's own eyes.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Scenes Detect, Weber, Color, Perceive | Explore: four tabs |
| Criterion slider, Signal strength slider, "Run 20 trials" | Tab 1: drag the lifeguard's "whistle if" line on the curves (main); signal strength a quiet knob (the fog over the water); Run 20 trials as Play |
| "Change in brightness" and "Starting brightness" sliders | Tab 2: drag the extra light on the right lamp (main); starting brightness a quiet knob on the left lamp |
| Flag (yellow, black, green), color squares, "Stare time" 10, 20, 30 s | Tab 3: tap a picture to stare at (main); stare time a quiet tap on the timer |
| Eleven depth and Gestalt figure chips (`FIGS`) | Tab 4: tap parts of one drawn street scene (`K.spots`) for depth cues; the Gestalt figures as a second small set in the same tab's picture |
| Drills sdt, weber, threshold, afterimage, adapt, depth, gestalt; contexts `radiology`, `hearing-test`, `lifeguard`, `weights`, `kitchen`, `vision-lab`, `everyday-senses`, `depth-art`, `gestalt-figures`; partTopics `cue`, `mono`, `law`, `other` | Test yourself, unchanged; ids `sensation:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Detect: a beach seen from a lifeguard's tower, with waves; sometimes a swimmer in trouble, sometimes just a wave.
  The two curves sit small on the tower's clipboard; drag the "whistle if" line along them. Play runs 20 moments:
  each is drawn (a wave or a swimmer) and the lifeguard whistles or not; the four outcomes stack as icons (hit,
  miss, false alarm, correct rejection) in one color each. Cause line: "Stricter line → fewer false alarms → more
  swimmers missed".
- Weber: two lamps in a dark room on a table; drag extra light onto the right lamp until it looks brighter: the "I
  see a difference" mark appears at the model's threshold, and the fraction is named ("8% more"). A brighter left
  lamp needs more extra light.
- Color: the flag drawn in yellow, black and green with a dot in the middle; tap to stare; after the timer the flag
  is replaced by a white wall and the student sees the afterimage themselves; a small label then names the opposite
  colors that should appear (blue, white, red).
- Perceive: one street scene with a road narrowing to the horizon, people of the same size far and near, a tree in
  front of a house, tiles getting finer; tap a part: its cue is named on a card (linear perspective, relative size,
  interposition, texture gradient). Retinal disparity and convergence (binocular) are named in "?".
Outside the picture: tabs, purpose line, Show me how, Play (tab 1), cause line: about 28 words, 4 controls.

**Science to verify:** signal detection with equal variance normal curves, d′ and criterion (Green and Swets 1966;
Macmillan and Creelman); absolute threshold as 50% detection; Weber fractions (brightness about 8%, as the course
uses; check against Teghtsoonian 1971); opponent process (Hering) vs trichromatic (Young and Helmholtz) and which
explains afterimages; afterimage colors for yellow, black and green; depth cues monocular vs binocular; Gestalt
principles. Traps: rods vs cones; trichromatic vs opponent process. No flashing content (photosensitivity).

**Reuse:** `ApPsychTools.kit2` (Brain map branch); `K.handle` on the curves (as in Tangent tracer), `K.drag`,
`K.tap`, `K.player`, `K.spots` with `under()` for the street scene (Brain map added it), `K.cause`.

**Risks reviewers will likely block on:** the afterimage relies on a full bleed white wall for a few seconds (must
not trigger on reduced motion without a calm equivalent, and must not flash); the curves becoming a bare chart (the
beach must dominate); eleven cue chips moved onto the picture crowding a phone (at most 6 spots on the street, the
rest in "?" and the drills); the outcome icons in color only (add a letter or shape each); text on the clipboard
under 11 px.
