# AP® Environmental Science, Dose and response: tools v2 plan

**Tool and page:** `environmental-science/tools/dose-response.html`; scripts `assets/tools/dose-response.js`,
`math/dose-response.js`, `dose-response.css`; data `data/tools/dose-response.json`; test
`scripts/test/apenv-tool-dose-response.test.mjs`. **Premium.** Rollout row 66, group P, wave 10.

**The one idea:** how much of a chemical reaches a body decides its harm. Three tabs, one idea each (CED 8.8,
8.12, 8.13; the authoring guide's trap: bioaccumulation and biomagnification are different):
1. Dose: LD50 is the dose that kills half the test group; a lower LD50 means more toxic.
2. Food chain: each step up a food chain concentrates a persistent chemical (biomagnification).
3. One fish: one animal builds the chemical up over its life (bioaccumulation).

**Research:**
- [dmccreary, Dose response explorer](https://dmccreary.github.io/ecology/sims/dose-response-explorer/): a sigmoid
  with a dose slider and LD50 marked. Take: the LD50 line where the curve crosses 50%; improve: the animals drawn.
- [University of Idaho toxicology lecture, dose response](https://www.webpages.uidaho.edu/etox/lectures/lecture05/Slides_DOSE.pdf):
  threshold, NOAEL, LD50 and slope compared across chemicals. Take: comparing two curves by where they cross 50%.
- Classic DDT food chain figure (Woodwell, Wurster and Isaacson 1967, Long Island marsh): ppm at each level. Take:
  the numbers per level as the shape of the picture (to be checked against the paper).

**Old tool inventory:**
| Old | v2 |
|---|---|
| Views Dose, Food chain, One fish | Explore: three tabs |
| Dose slider (mg/kg), 100 test animals | Tab 1: drag the dose along the curve (main, `K.handle`); the animals on the picture respond |
| Chemical buttons (three invented chemicals, compare on one graph) | Tab 1: a quiet chemical tap on the bottle labels; the other curves stay faint for comparison |
| "Concentration factor per step up" slider | Tab 2: a quiet knob; main control is dragging up the chain |
| "Age of the fish" slider (0 to 12 years) | Tab 3: drag the fish's age (main) |
| Drills read, dose, magnify, compare; contexts `mice-insecticide`, `rats-solvent`, `dog-bait`, `bird-seed`, `ddt-lake`, `mercury-bay`, `two-pesticides`; partTopics `ld50`, `setup`, `answer`, `perkg`, `means`, `which`, `times`; the try card that draws on the curve (`o.onTry`) | Test yourself, unchanged; ids `dose-response:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Dose: a lab bench with a cage of 100 mice (10 by 10), three labeled bottles, and the dose response curve on a
  clipboard beside them. Main control: drag the dose knob along the curve. Instant: mice at that dose that would
  die lie still and turn grey (calm, no gore), the rest move; the share is named ("52 of 100"), and when the knob
  passes 50% "LD50 = 120 mg/kg" appears at the crossing. Cause line: "150 mg/kg → 68 of 100 die → above the LD50
  (120)". Takeaway: "Lower LD50, more toxic."
- Food chain: a lake in cross section: water with a few dots, plankton, small fish, a trout, an osprey. Drag up the
  chain: at each step the dots in the next organism multiply by the factor (drawn as dots inside the body, a count
  pill beside it). Cause line: "× 10 per step, 4 steps → 10,000 times the water".
- One fish: a single trout in the lake, eating; drag its age: mercury dots pile up in its body year by year while
  the water stays the same. The words "one fish, over time" sit on the picture to keep it apart from tab 2.
Outside the picture: tabs, purpose line, Show me how, cause line: about 25 words, 3 controls.

**Science to verify:** the three chemicals are invented for practice (keep saying so); LD50, threshold and the
curve read by straight segments between measured points (the model); mg per kg body mass arithmetic; DDT levels
by trophic level (Woodwell et al. 1967, Science 156: about 0.00005 ppm water to about 25 ppm in birds; check the
exact figures); mercury bioaccumulation in fish with age (EPA, "Mercury in fish"); which chemicals are persistent
and fat soluble. Traps: bioaccumulation vs biomagnification; LD50 is not "the lethal dose for everyone".

**Reuse:** APES kit2; `K.handle` on the curve (as in Tangent tracer), `K.tap` for bottles, `K.drag` for the chain
and the age, `K.cause`; the existing curve code and the Test yourself try card (`o.onTry`) stay. Not the first
APES tool on kit2.

**Risks reviewers will likely block on:** a grid of 100 mice is many elements (perf at CPU x4: one element per mouse,
change only class or opacity); the count words must come from the mice drawn, not the curve's target during a fast
drag; animal welfare tone (no gore, no sudden "death" effects); the dot counts in tab 2 cannot be drawn literally
past a few hundred (draw a capped number and say "1 dot = 100" on the picture, measured honestly); keep the three
curves' labels clear of the knob at every width.
