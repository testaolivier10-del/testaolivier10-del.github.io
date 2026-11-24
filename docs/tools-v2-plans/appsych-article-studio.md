# AP® Psychology, Article analysis studio: tools v2 plan

**Tool and page:** `psychology/tools/article-studio.html`; scripts `assets/tools/article-studio.js`,
`math/article-studio.js`, `article-studio.css`; data `data/tools/article-studio.json`; test
`scripts/test/appsych-tool-article-studio.test.mjs`. **Free.** Rollout row 84, group R (reading and evidence
studios), wave 9; one of the ten rebuilds.

**The one idea:** a study's method and its result decide what it can claim. Owner rule for this group (rollout
question 4, given 2026-11-18 for Design drills): practice tools stay tools, but Explore must be real free play that
shows an idea. Two tabs:
1. Method: randomly assigned groups make an experiment, which can show cause; letting people choose makes it
   correlational.
2. Result: whether the groups differ, and which way, decides whether the hypothesis is supported.
The full six part AAQ walk through stays in Test yourself.

**Research:**
- AP Bio Design drills v2 (`docs/tools-v2-design-drills-brief.md`, integrated): two groups of plants on a bench, the
  confound drawn as a second difference. Take: the study drawn as people in groups, one change on the picture.
- [Fiveable AP Psych AAQ practice](https://fiveable.me/ap-psych-revised/frqs/aaq): a study summary and the six
  prompts, with sample answers. Take: the summary layout the exam uses, for Test yourself.
- [College Board 2025 FRQ set 1](https://apcentral.collegeboard.org/media/pdf/ap25-frq-psychology-set-1.pdf): the
  real AAQ form. Take: the section names (Introduction, Participants, Method, Results) and the part order.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Pick a part A to F: where its answer is in the summary, what earns the point, a typical miss | Test yourself (as the "part" steps of each drill) and "?" (what earns each part) |
| Result chips Predicted, No difference, Opposite | Tab 2: drag the result on the picture (main) |
| "Run it again (new numbers)" | Tab 2: a quiet tap ("New sample") |
| "Earns the point" / "A typical miss" toggles | Test yourself |
| The study summary (six invented studies: `sleep-words`, `caffeine-sleep`, `quiz-reread`, `reading-points`, `trail-runners`, `walk-stress`) | Explore uses one study per visit (a quiet study tap); all six in Test yourself |
| Drill types full, design, results, ethics (`A.TYPES`); partTopics `method`, `what`, `how`, `diff`, `stat`, `rstat`, `ethics`, `ehow`, `gen` | Test yourself, unchanged; ids `article-studio:<context>:<step>` |
| `?seed=`, `#quiz` | unchanged |

**Design:**
- Method: a hallway with two rooms (for `quiz-reread`: a quiz room and a reread room), a line of 20 participants
  drawn at the door. Main control: a sorting hat style switch at the door between "coin flip" (random assignment)
  and "they choose". Drag it: people walk into rooms by the rule; with "they choose", the eager students drawn with
  backpacks cluster in one room (a visible third variable). The method is named on the door ("Experiment" or
  "Correlational study") and the cause line says what the study can claim. Cause line: "Coin flip → groups alike
  except the IV → can show the quiz caused the higher scores".
- Result: the two groups' scores as stacks of the participants' papers on two desks, the mean as a marker; drag the
  quiz room's stack up or down: the claim pill changes ("supports", "does not support", "contradicts"); a quiet "New
  sample" redraws the people's scores around the same means. Takeaway: "No difference means the hypothesis is not
  supported, not that it was proven wrong."
Outside the picture: tabs, purpose line, Show me how, cause line: about 25 words, 3 controls.

**Science to verify (authoring guide, research methods):** an experiment only with manipulation and random
assignment; random sampling vs random assignment kept apart; correlation is not causation, with the third variable
named; "not statistically significant" means could plausibly be chance, and significance is not size; generalize
from participant characteristics, never sample size. Every study is invented (say so). Numbers from `ApPsychStats`
recipes, never typed.

**Reuse:** `ApPsychTools.kit2` (from the Brain map branch); the AP Bio Design drills' "a part can carry its own
stage" idea if Test yourself parts want the scene; kit `K.tabs`, `K.drag`, `K.tap`, `K.cause`. Group R has no
`K.passage` yet: do not build it here unless Test yourself needs tappable highlights (it does not today).

**Risks reviewers will likely block on:** too much text on the picture (door names, claim pill and cause line only;
the summary text stays out of Explore); people drawn too small at 360; the "they choose" grouping must be a real
visible confound, not a random reshuffle; the claim words derived from the drawn stacks, not from the target, while
dragging; the Explore must not grade (no right or wrong marks).
