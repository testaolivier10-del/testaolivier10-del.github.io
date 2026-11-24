# AP® Psychology, Development across the lifespan: tools v2 plan

**Tool and page:** `psychology/tools/development.html`; scripts `psychology/assets/tools/development.js`,
`math/development.js`, `development.css`; data `psychology/data/tools/development.json` (served
`assets/tool-data/development.json`); test `scripts/test/appsych-tool-development.test.mjs`. **Premium.** Rollout
row 80, group P, wave 14. The 2026-11-10 audit scored it 3.5 and named it a rebuild candidate
(`docs/tool-audit-2026-11.md`).

**The one idea:** people change in predictable ways across life, and each kind of change has its own story. Four
tabs, one idea each (CED unit 3 development topics):
1. Thinking: how a person reasons changes with age (Piaget's stages, then crystallized and fluid intelligence).
2. Life stages: each age brings its own social question (Erikson's psychosocial stages).
3. Attachment: how a toddler greets a returning parent shows the attachment pattern.
4. Parenting: warmth and rules together make four parenting styles.

**Research:**
- [Macmillan Siegler video activity, Piaget's conservation of liquid task](https://digfir-published.macmillanusa.com/siegler_sva/piagets_conservation_of_liquid_task.html)
  and [conservation of number](https://digfir-published.macmillanusa.com/siegler_sva/piagets_conservation_of_number_task.html):
  the real tasks on film, a child before and after the stage. Take: show a stage by the task the child fails or
  passes, never by a label alone.
- [JoVE, Piaget's conservation task and the influence of task demands](https://www.jove.com/t/10131): the same task
  with changed wording changes the answer. Take: "?" says stage ages are textbook ages and later work found earlier
  abilities.
- [OpenStax Lifespan Development 1.3, Major theories](https://openstax.org/books/lifespan-development/pages/1-3-major-theories-and-theorists):
  text; the stage tables and ages to check against.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Lenses Lifespan, Attachment, Parenting, Aging mind | Explore: tabs Thinking (Piaget plus Aging mind), Life stages (Erikson), Attachment, Parenting |
| Age slider (42 ages, 0 to 90) and "Play a life" | Tabs 1 and 2: drag the person along an age path (main); Play as "Watch a life" |
| Four lanes at once (thinking, Erikson, relationships, body and roles) | One lane per tab; relationships join Life stages; puberty, body and roles from 12 to 25 go to "?" and the adolescence drills (logged) |
| Strange situation, three panels | Tab 3: one room, tap "Parent leaves" and "Parent returns" on the picture; the child's pattern a quiet tap on the child |
| Warmth and "Demands and rules" sliders, the quadrant dot | Tab 4: drag one dot on a drawn kitchen table scene's grid (two values from one knob; no knob moves another) |
| Aging mind graph | Tab 1 past age 20 |
| Drills piaget, erikson, attachment, parenting, adolescence, adultcog, methods; contexts `piaget`, `aging`, `erikson`, `attach`, `parents`, `teens`, `methods` | Test yourself, unchanged; ids `development:<context>:<step>`; "Studying age" (cross sectional vs longitudinal) stays a drill and gets a "?" note |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Thinking: one person drawn at the age on the path (baby, toddler, child, teen, adult, older adult) with the task
  of that stage in front of them: a toy hidden under a cloth (object permanence), two glasses poured into a tall one
  (conservation), a balance problem worked as a hypothesis. Drag the age: the person grows, the task changes and
  the child's answer is drawn (reaches for the cloth or not; says "more" or "same"). Past 20, two bars on a
  bookshelf and a stopwatch: crystallized knowledge (books) rises into late life, fluid speed (stopwatch) falls.
  Cause line: "Age 5 → preoperational → says the tall glass has more".
- Life stages: the same person in a scene that fits Erikson's question at that age (feeding with a caregiver,
  first school, friends, a job, family, retirement), the question on a soft pill ("Trust or mistrust?").
- Attachment: a playroom; parent and toddler; a stranger at the door. Tap the parent to leave, then to return: the
  toddler's reaction is drawn for the chosen pattern (secure, avoidant, anxious, disorganized). Takeaway: "The
  reunion, not the crying, tells the pattern."
- Parenting: a teen and a parent at the kitchen table at curfew time; drag the dot on a small two axis grid drawn
  on a notepad (warmth across, rules up): the parent's face and words change, the style is named.
Outside the picture: tabs, purpose line, Show me how, Play (tabs 1 and 2), cause line: about 28 words, 4 controls.

**Science to verify:** Piaget's four stages and their usual ages, with the "?" caveat (Baillargeon's infant studies);
Erikson's eight stages and ages (OpenStax Psychology 2e 9.2); Ainsworth's strange situation (Ainsworth et al. 1978)
and disorganized attachment (Main and Solomon 1990); Baumrind's three styles plus neglectful (Maccoby and Martin
1983); crystallized vs fluid intelligence across age (Horn and Cattell 1967; Salthouse). Authoring guide traps:
crystallized vs fluid; cross sectional vs longitudinal; parenting style findings are correlations, not causes, and
vary by culture (say so in "?"). Every person here is invented.

**Reuse:** the AP Psych adapter `ApPsychTools.kit2(app, { slug, explore, quiz })` in `psy-tools.js` and the kit
loading in `scripts/build-appsych.mjs`, both added by the Brain map (branch `claude/tools-v2-brain-map`, not yet
integrated: build this after it lands on `claude/tools-v2-all`); `"kit2": true` on its entry in
`psychology/data/pages.json`. Kit: `K.tabs`, `K.handle` (age path, parenting dot), `K.tap`, `K.player`, `K.cause`.
Not the first Psych tool on kit2.

**Risks reviewers will likely block on:** drawing one person at many ages is a lot of art (weight: the file is 70 KB
raw; consider its own weight bucket); the child's answer must be drawn before the cause line names it; the
strange situation must not show distress in a way that reads as harm; skin tones varied and respectful; four tabs
of text pills at 360 px; two values from one parenting knob must read clearly as one control.
