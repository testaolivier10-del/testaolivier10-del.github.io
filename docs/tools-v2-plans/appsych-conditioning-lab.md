# AP® Psychology, Conditioning lab: tools v2 plan

**Tool and page:** `psychology/tools/conditioning-lab.html`; scripts `assets/tools/conditioning-lab.js`,
`math/conditioning-lab.js`, `conditioning-lab.css`; data `data/tools/conditioning-lab.json`; test
`scripts/test/appsych-tool-conditioning-lab.test.mjs`. **Premium.** Rollout row 97, group P, wave 14.

**The one idea:** behavior changes with what follows it or what comes before it. Three tabs, one idea each:
1. Classical: pairing a tone with food makes the tone alone a signal; alone again, it fades, and after rest it
   partly returns.
2. Schedules: the rule for when rewards come shapes the pattern of responding.
3. Consequences: adding or removing something, pleasant or unpleasant, makes a behavior more or less likely.

**Research:**
- [Sniffy the Virtual Rat (Alloway and others), CSUS assignment on classical conditioning](https://www.csus.edu/indiv/w/wickelgren/psyc104/sniffy_1classcond.html):
  a drawn rat in a box, a cumulative record, trial by trial training. Take: the cumulative recorder as a real
  object (a pen on a moving paper roll) and the trials one by one.
- [InterNICHE, Sniffy entry](https://interniche.org/en/alternatives/sniffy-virtual-rat): the alternative to live
  animal labs. Take: the full set of schedules on one rat.
- [OpenText BC Introduction to Psychology 7.1, classical conditioning](https://opentextbc.ca/introductiontopsychology/chapter/7-1-learning-by-association-classical-conditioning/):
  the acquisition, extinction and recovery figure. Take: the curve's shape to check the model against.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Views Classical, Schedules, Consequences | Explore: three tabs |
| "Tone + food", "Tone alone", "Rest a day", "Run the classic demo", "Start over", "A new session" | Tab 1: tap the speaker and the dish on the picture (tone + food, or tone alone; main); the window's sun and moon tap is "Rest a day"; Start over small; the classic demo becomes "Show me how" |
| Four schedules (FR, VR, FI, VI), "Play 10 minutes", the ‹ › steppers | Tab 2: the dial on the Skinner box (main, four stops); the time bar and Play |
| Consequences grid (add or remove, pleasant or unpleasant: four named cells) | Tab 3: drag a thing into or out of the scene (main) |
| Drills labels, phases, schedule, operant; contexts `everyday-cc`, `pavlov-record`, `schedules`, `consequences`; partTopics `sched`, `shape`, `resist`, `addrem`, `updown`, `name` | Test yourself, unchanged; ids `conditioning-lab:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Classical: a quiet lab: a dog on a stand, a speaker, a food dish, a drop counter under the dog's cheek, a window.
  Tap tone with food: the speaker shows sound rings, the dish fills, drops fall; tap tone alone: drops fall only as
  strongly as learned. Each trial adds a point to the record strip under the scene. Tap the window to pass a night:
  the moon rises, and the next tone alone shows the partial return. Labels UCS, UCR, CS, CR appear on the things
  as they take those roles. Cause line: "Trial 6: tone paired with food → tone alone now brings 8 drops".
  Takeaway: "After rest the response comes back, weaker: spontaneous recovery."
- Schedules: a rat in a box with a lever and a food cup, and a cumulative recorder whose pen draws on paper as the
  rat presses. Turn the dial: the rat's pressing and the pen line change shape at once for the whole session (the
  run cached), and the time bar plays it. The four records stay as faint lines labeled with their schedule after
  each is tried.
- Consequences: a child's bedroom at homework time; things to drag in (a sticker, extra chores) or out (a phone,
  a nagging alarm). The homework behavior's arrow on the child grows or shrinks, and the cell name appears on the
  thing ("Positive reinforcement: add a pleasant thing").
Outside the picture: tabs, purpose line, Show me how, time bar and Play (tab 2), cause line: about 28 words, 4
controls.

**Science to verify:** the learning rule and the 45% recovery are teaching models (audit 2026-11-10; "?" says so);
acquisition, extinction, spontaneous recovery, generalization (OpenStax Psychology 2e 6.2); schedule shapes from
Ferster and Skinner (1957): FR high rate with post reinforcement pauses, VR highest steady, FI scallops, VI steady
moderate; partial reinforcement extinction effect; the four consequence cells. Traps: negative reinforcement vs
punishment; classical vs operant; extinction vs spontaneous recovery. Animal welfare: the dog and rat calm and
cared for.

**Reuse:** `ApPsychTools.kit2` (Brain map branch); `K.tabs`, `K.tap`, `K.handle` for the dial, `K.progress` and
`K.player`, `K.drag` for the things, `K.cause`, `K.cue`. The record strip drawn with `psy-plot.js` styling.

**Risks reviewers will likely block on:** drops, sound rings and pen lines animating at once (perf at CPU x4); the
record and the drop count must agree on every frame; the faint "tried" lines must not look like dashed ghosts
(solid thin lines with names); the drag targets in tab 3 too small at 360; the phone fold problem the audit found
(controls under the fold): the controls are now on the picture, so check the scene is fully above the fold.
