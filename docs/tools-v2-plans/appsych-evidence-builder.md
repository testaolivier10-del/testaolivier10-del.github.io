# AP® Psychology, Evidence builder: tools v2 plan

**Tool and page:** `psychology/tools/evidence-builder.html`; scripts `assets/tools/evidence-builder.js`,
`math/evidence-builder.js`, `evidence-builder.css`; data `data/tools/evidence-builder.json`; test
`scripts/test/appsych-tool-evidence-builder.test.mjs`. **Premium.** Rollout row 98, group R, wave 9; a rebuild.

**The one idea:** a piece of evidence earns its point only when it names its source and a psychology concept links
it to the claim. One screen, no tabs (the EBQ, the exam's question 2). Owner rule for group R: Explore must be real
free play that shows the idea; the scored building stays in Test yourself.

**Research:**
- [College Board 2026 FRQ](https://apcentral.collegeboard.org/media/pdf/ap26-frq-psychology.pdf) and the scoring
  rules in `docs/appsych-research/framework.md` section 5: three sources, a claim, evidence from two different sources, reasoning
  with a concept. Take: the exact structure and the restricted terms rule.
- [Fiveable AP Psych FRQ practice](https://fiveable.me/ap-psych-revised/frq-practice): source summaries with
  graphs and model answers. Take: graphs on each source as the thing to point at.
- CommonLit style annotation (highlight in the text, then use it): take tapping a finding on the source itself.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Pick a claim; pick each piece of evidence and whether it is cited; pick the concept; the score updates as you build; every lost point named | Explore: drag a finding onto the claim, then a concept onto the link (main); no score. Scored building: Test yourself |
| "Next part", "Start the answer over", "New numbers", "Next question", "Keep working on this answer" | Test yourself; "Start over" and "New numbers" small in Explore |
| "Your answer, as a reader sees it" | Test yourself (the answer card) and "?" |
| Three questions (`support-stress`, `sleep-thinking`, `rewards-motivation`), drill types full, evidence, reasoning (`E.TYPES`); partTopics `read`, `evB`, `evC` | Test yourself, unchanged; ids `evidence-builder:<context>:<step>`; Explore uses one question per visit with a quiet question tap |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:** a desk seen from above: three source papers (each with a title, a small graph and two sentences), a
claim card pinned to a corkboard, and a cup of concept cards (sleep, stress, reinforcement and the others the
question allows). Main control: drag a highlighted finding from a source (a bar on its graph, a sentence) onto
the claim. A string runs from the source to the claim, labeled "Source 2"; the link stays loose until a concept card
is dropped on it, then it pulls tight and the sentence a reader would see writes itself under the claim ("According
to Source 2, ... This shows reinforcement, because ..."). A second finding from the same source makes the string
show "same source" (the rubric needs a different one), shown as a fact, not a mark. Cause line: "Source 2's finding
→ explained by stress → supports the claim". Takeaway after two complete links from two sources: "Two sources, two
concepts: that is the shape of a full answer." Outside the picture: purpose line, Show me how, Start over, cause
line: about 22 words, 3 controls.

**Science to verify:** the EBQ rubric (2025 and 2026 scoring guidelines, summarized in
`docs/appsych-research/framework.md` section 5): evidence from a
different source in C(i), a different concept in C(ii), restricted terms (method and statistics words, the prompt's
own topic) never earn the concept point; the invented sources' numbers from `ApPsychStats`; every concept card's
meaning against OpenStax Psychology 2e. Mental health language rules if a source is about stress or sleep problems
(person first, no self diagnosis).

**Reuse:** `ApPsychTools.kit2` (Brain map branch); kit `K.drag` and `K.tap` (cards), `K.cause`, `K.cue`. If Article
studio builds a passage highlight piece first, reuse it here (group R's `K.passage`).

**Risks reviewers will likely block on:** Explore turning into a graded drill (no score, no red); text on the papers
too small at 360 (show each source as its title and graph; the full text in a card that opens on tap); drag and drop
of cards on a phone (tap a card, then tap the link, as forgiving input); strings crossing labels; the written
sentence must match what was linked at every moment.
