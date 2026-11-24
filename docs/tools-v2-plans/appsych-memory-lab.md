# AP® Psychology, Memory lab: tools v2 plan

**Tool and page:** `psychology/tools/memory-lab.html`; scripts `assets/tools/memory-lab.js`, `math/memory-lab.js`,
`memory-lab.css`; data `data/tools/memory-lab.json`; test `scripts/test/appsych-tool-memory-lab.test.mjs`.
**Premium.** Rollout row 99, group P, wave 14.

**The one idea:** what you remember depends on when and how you learned it. Three tabs, one idea each:
1. List: where a word sits in a list changes your chance of recalling it (serial position).
2. Forgetting: memories fade fast, then slowly; spaced reviews keep more than crammed ones.
3. Interference: an old memory and a new one get in each other's way (proactive vs retroactive).

**Research:**
- [Hanover College Cognition Laboratory, Serial position](https://psych.hanover.edu/JavaTest/Cognition/Cognition/serialposition_instructions.html)
  and [Macmillan CogLab style serial position](https://digfir-published.macmillanusa.com/cogtk/serial_position.html):
  the student studies a list and recalls, then sees their own curve. Take: the student's own recall as the data.
- [Nicky Case, How to remember anything forever-ish](https://ncase.me/remember/): forgetting curves you can drag,
  reviews that reset and flatten them. Take: dragging a review onto the timeline and watching the curve bend.
- [Stanford Psych 45 course demos](https://web.stanford.edu/class/psych45/demos/index.html): short memory
  demos. Take: the 30 second counting distraction as the switch that removes recency.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Views List, Forgetting, Interference | Explore: three tabs |
| "Start: study 10 words", type recalled words, "Recall at once" / "After 30 s of counting", "A new list of words" | Tab 1: Start on the picture (main), the typing box on the picture's notepad, the delay as a quiet tap on a timer; New list small |
| Class curve of simulated learners beside the student's | Tab 1: the class curve under the student's words, both named |
| "Review on day" slider (1 to 29), "Add this review", "Clear reviews"; massed vs spaced | Tab 2: drag a review card onto the calendar (main); Clear small |
| "Recall the older one", "Recall the newer one" | Tab 3: tap one of the two memories on the picture (main) |
| Drills serial, spacing, interference, forgetting; contexts `word-list`, `vocab-study`, `anatomy-study`, `two-memories`, `nonsense-syllables`, `class-facts`; partTopics `primacy`, `lastmean`, `delay`, `iv`, `spaced`, `massed`, `concl`, `which`, `kind`, `drop1`, `drop2`, `shape` | Test yourself, unchanged; ids `memory-lab:<context>:<step>` |
| Forgiving recall scoring (capitals, plurals, one wrong letter) | unchanged (rule 10) |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- List: a desk with a stack of ten word cards that flip one at a time, then a notepad to write what you recall. The
  recalled words light their cards in place, so the student sees which positions survived; under the cards the
  class curve (a soft line) and the student's hits (dots on it). The timer on the desk, tapped, adds 30 seconds of
  counting backwards before recall: the class curve's end drops. Cause line: "30 s of counting → the last words fade
  → recency gone, primacy stays". Takeaway: "The first words reach long term memory; the last ones are still in short
  term memory."
- Forgetting: a fact card on a fridge calendar of 30 days; the card's ink fades day by day along the forgetting
  curve drawn across the calendar. Drag a review card onto a day: the ink darkens and the next fade is slower. A
  quiet "Cram" tap puts three reviews on one day for comparison. Day 30's ink is the one number.
- Interference: two locker doors, last year's code and this year's; a student between them. Tap the old one to
  recall it: the new code's digits intrude (retroactive); tap the new one: the old digits intrude (proactive). The
  arrow of interference is drawn in the direction it acts, named on the arrow.
Outside the picture: tabs, purpose line, Show me how, cause line: about 25 words, 3 controls (plus the typing box on
the picture).

**Science to verify:** serial position curve (Murdock 1962); a 30 s distractor removes the recency effect (Glanzer
and Cunitz 1966; Postman and Phillips 1965); forgetting curve shape (Ebbinghaus 1885; Murre and Dros 2015
replication); spacing effect (Cepeda et al. 2006 meta analysis); proactive vs retroactive interference definitions
(OpenStax Psychology 2e 8.3). The class and forgetting curves are teaching models (say so in "?"). Myth rule:
learning styles never appear as fact.

**Reuse:** `ApPsychTools.kit2` (Brain map branch); kit `K.tabs`, `K.tap`, `K.drag`, `K.cause`, `K.cue`; the
existing forgiving recall matcher in `math/memory-lab.js`.

**Risks reviewers will likely block on:** the typing box on phones (the audit found it half hidden; with the
keyboard up the cards must stay visible, scroll the notepad into view); the card flip timing must stop when a tab
or mode changes mid list; the ink fade must match the curve's value on the drawn day; interference arrows reading
as decoration; counting backwards in Explore must not feel like a test (no score shown beyond the student's own
lit cards).
