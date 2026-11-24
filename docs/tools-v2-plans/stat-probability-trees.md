# Plan: AP® Statistics, Probability trees

## Tool and page
`statistics/tools/probability-trees.html`; scripts `statistics/assets/tools/probability-trees.js`,
`statistics/assets/tools/math/probability-trees.js` (`ApStatMath.probabilityTrees`), `probability-trees.css`; data
`statistics/assets/tool-data/probability-trees.json`. **Free.** Rollout row 50, group B, wave 5, marked **rebuild**
(four pictures at once; 33 controls; 142 words on the stage; three sliders in the panel).

## The one idea (two tabs)
1. **Follow the branches:** a tree splits 1,000 people by A, then by B; P(A and B) is the share that ends on one leaf,
   multiplying along the branches.
2. **Flip the question:** P(A | B) counts only the people in B, then asks what share of them are in A (the table makes
   the flip easy; the Venn shows the same counts).

## Research
- Gerd Gigerenzer's natural frequency trees for screening tests (Harding Center fact boxes,
  https://www.hardingcenter.de/en/transfer-and-impact/fact-boxes): 1,000 people split by condition, then by test.
  Take: people counts instead of decimals on every branch.
- Seeing Theory "Compound probability" and "Conditional probability" (https://seeing-theory.brown.edu/compound-probability/index.html):
  balls falling through, sorted into regions. Take: things that move into place.
- Setosa "Conditional probability" (https://setosa.io/conditional/): a ball rain filtered by a region. Take: the
  "only these count" filter for P(A | B).

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Four pictures at once: tree (branch widths), two-way table out of 1,000, Venn (areas), simulation | tab 1 the tree; tab 2 the table with the Venn as its small companion; the simulation in tab 1 (below) |
| Pick a question: P(A and B), P(A | B) and the rest (cue "Pick a probability") | tab 1: tap a leaf (and, or); tab 2: tap a cell then its column or row (given) |
| Tap any branch, leaf, cell or region to ask about it | kept (`K.tap` on what is drawn, `elementFromPoint`) |
| Simulate 100 or 1,000 trials; the running share closes in on the exact value | "Send 1,000 people" (secondary, tab 1): people walk the branches; the running share on the leaf |
| Change the probabilities: P(A), P(B | A), P(B | not A) (three panel sliders) | main control, tab 1: the fork knobs on the tree (`K.handle` on each fork; P(A) loud first) |
| "Make them independent" (sets the two B branches equal) | quiet button on the tree; animates the two forks to equal |
| Scenes: a screening test, sports and part time jobs, a spam filter, one roll of a fair die | scene picker beside "Show me how" |
| Event A first series colour, B second | kept |
| Test yourself: drill, 3 kinds (tree, table, rules), a table problem puts its table on the stage, a tree problem its tree; record ids `probability-trees:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Tab 1 picture:** a clinic hallway seen from above: 1,000 small people enter at the left; a fork in the floor
  sends them to "has it" and "does not" in proportion to the fork's knob, then each hall forks again at the test into
  "positive" and "negative". Hall widths are the shares; each leaf room shows its head count. For the spam filter and
  the die, the same halls with letters or rolls.
- **Tab 2 picture:** the same 1,000 people standing in a two way table of rooms; tap "positive" and the other rooms
  dim; the count in "has it and positive" over the count of "positive" is P(has it | positive). A small Venn below
  with the same counts lit.
- **Main control:** tab 1 the fork knobs; tab 2 the tap on a row or column.
- **Animates:** halls widen or narrow; people walk (Send 1,000); dimming in tab 2 is a fade, and the people of the
  chosen row step forward.
- **Cause line:** tab 1 "10 of 1,000 have it → 9 test positive → P(has it and positive) = 0.009"; tab 2 "108 test
  positive → 9 have it → P(has it | positive) = 0.083".
- **Takeaway:** "Most positives come from the many people who do not have it."
- **Outside:** 2 tabs, purpose line, scene picker, Show me how, cause line, Send 1,000: 4 controls, about 22 words.

## Science to verify
Multiplication rule along branches, P(A and B) = P(A)·P(B | A); total probability; P(A | B) = P(A and B)/P(B);
independence iff P(B | A) = P(B | not A); mutually exclusive vs independent; complements (CED Unit 2 probability
topics of the revised 2026-27 course, `docs/apstat-spec.md`; OpenStax Introductory Statistics 2e §3.1 to 3.5). Notation
P(A ∩ B), P(A | B), P(Aᶜ) (`docs/apstat-authoring-guide.md`). Counts out of 1,000 must round consistently so the
leaves add to 1,000 (say which way in "?").

## Reuse
**First Statistics tool on kit2** (planned): add `ApStatTools.studioKit2` to `statistics/assets/tools/stat-tools.js`
(the calculus adapter's pattern) and the `t.kit2` links in `scripts/build-apstat.mjs`; `"kit2": true` for this tool in
`statistics/data/pages.json`; `build-apstat --check` shows only this page changed. `K.handle`, `K.tap`, `K.tabs`,
`K.cause`. Rollout's `K.draw` (group B) is not needed: the forks are handles.

## Risks reviewers will likely block on
- 1,000 walking people at CPU x4: one canvas or one SVG path per hall, never 1,000 DOM nodes.
- Head counts and hall widths from the drawn shares at every frame of a fork drag.
- Leaf labels in narrow halls (a 1% branch) at 360 px: the label moves outside the hall with a leader line.
- Tap targets on thin halls: act on what is drawn under the pointer.
