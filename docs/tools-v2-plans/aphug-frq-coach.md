# AP® Human Geography, FRQ coach: tools v2 plan

**Tool and page:** `human-geography/tools/frq-coach.html`; scripts `assets/tools/frq-coach.js`,
`math/frq-coach.js`, `frq-coach.css`; task verbs `VERBS` in `scripts/lib/aphug-exams.mjs` (the page shows each
verb's demand); data `data/tools/frq-coach.json`; test `scripts/test/aphug-tool-frq-coach.test.mjs`. **Premium.**
Rollout row 139, group R, wave 9; one of the ten rebuilds.

**The one idea:** the task verb says how much to write: each verb up the ladder adds one thing to the answer. One
screen, no tabs. Owner rule for group R: Explore must be real free play that shows the idea; writing and grading
stay in Test yourself.

**Research:**
- AP Human Geography scoring guidelines and Chief Reader reports (for example
  [2025 set 2 report](https://apcentral.collegeboard.org/media/pdf/ap25-cr-report-human-geography-set-2.pdf), cited
  in the accuracy risks doc): what earned and lost the point per verb. Take: the rubric line for each part.
- Albert.io and AP Classroom FRQ practice (group R reference products): one prompt at a time, the rubric after a
  try. Take: rubric after a try, in Test yourself.
- AP Bio Design drills v2 (`docs/tools-v2-design-drills-brief.md`): an idea shown by changing one thing while the
  rest stays. Take: one answer that grows as the verb changes.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Pick a question (8 contexts: `boundaries`, `city-models`, `country-a-people`, `development`, `diffusion`, `green-revolution`, `polders`, `transition`) and a part | Explore: one question per visit with a quiet question tap; Test yourself has all |
| Write an answer; the checklist watches for the "because"; Check | Test yourself |
| Rubric line and a full credit answer; "Show" toggle | Explore shows the answer for the verb chosen (not graded); the rubric line on it |
| Pick which of two answers earns the point | Test yourself (the "earns" type) |
| Drill types part, verbs, earns (`F.TYPES`); record ids `frq-coach:<context>:<step>` | Test yourself, unchanged |
| "Next part" | Test yourself |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:** an exam booklet open on a desk; the question's stimulus (a small map or photo of the context, such as
Dutch polders) at the top of the left page; on the right page one answer written by hand. Main control: drag the
verb tab along a ladder printed on the booklet's edge: Identify, Describe, Explain, Compare, Explain the degree. As
the verb climbs, the answer rewrites itself one piece at a time with that piece highlighted in its own color: the
name (identify), the features (describe), the "because" link (explain), the second side (compare), the degree
stated first (explain the degree). The rubric line for the verb sits under the answer and names the added piece.
Cause line: "Explain → add how or why, with because → 'because the dikes let farmers drain the sea floor'".
Takeaway: "Each verb asks for one more thing than the one below it." Outside the picture: purpose line, Show me
how, cause line: about 22 words, 2 controls.

**Science to verify:** the verb demands exactly as `VERBS` and the authoring guide table state them (the content
check already refuses an explain sample without a link, a compare about one side, a degree sample that does not
open with the degree); each context's facts: polders (Rijkswaterstaat or a geography text), Green Revolution dates
(about 1961 to 1989, no GMOs: accuracy risks section 6), development terms (World Bank FY27, HDI with data and
report years), transition (models are models); neutral wording on boundaries and people.

**Reuse:** `ApHugTools.kit2` (added by the first HuG kit2 tool, likely Model studio); kit `K.drag` with named
stops for the verb ladder, `K.tap`, `K.cause`, `K.cue`. A passage highlight piece (`K.passage`, group R) is not
needed: the highlighted pieces are part of the drawn answer.

**Risks reviewers will likely block on:** handwriting style text below 11 px at 360 (use a legible font, size from
the stage); the answer's rewrite animation must keep the earlier pieces in place (no jumping text); the highlighted
pieces must match what the rubric line names at every stop; text count on the picture is high by nature, so the
outside count must stay low; Explore must not grade (no score, no right or wrong).
