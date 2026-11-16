# AP Human Geography tools in the standard frame (F5b, 2026-11-16)

Kit change (`human-geography/assets/tools/hug-tools.js`) is the same as AP Macro's: see the kit table in
`docs/tools-frame-notes/apmacro.md`. Nothing removed; `build-aphug.mjs --check` passes.

## Per tool
- **Borders lab**: the scene select (Boundary types, State shapes, Forces, Sea zones, Real cases) -> stage picker; the task line follows the scene (the cue only fit Boundary types). Boundary type, year and Play unchanged.
- **City lab**: scene chips -> stage picker; task line follows the scene.
- **Diffusion lab**: Diffusion / Migration chips -> stage picker; task line follows the scene.
- **FRQ coach**: the question select (behind More options) -> stage picker; More options held only it, so it steps aside (setup row and menu item dropped with it). Parts, verbs, writing, rubric reveal, which answer earns the point unchanged.
- **Map reader**: Map type select -> stage picker. Read chips, class breaks, base map ("?") unchanged.
- **Model studio**: Model select -> stage picker. See it / Build it switch kept. New: a correct Build ends in a finished card (Test yourself on this model, Full explanation, Build it again, See it built).
- **Population lab**: stages 1 to 5 stay as the stepping chips (they are the sequence the tool teaches); sliders unchanged.
- **Scale lab**: Scale of analysis / Map scale switch kept.

## New copy (for an accuracy check)
`LEDE` and `TASK` in hug-tools.js. Scene lines: borders ("Pick a shape and read the challenge it usually brings.", "Tap scenes to add forces that pull the country together or apart.", "Move the ship out from the coast and read what the state may do there.", "Pick a real boundary and read how it is often classed."), city ("Pick a model, then pick a second one to compare side by side.", "Pick a good and see which places can offer it.", "Compare a country that follows the rule with one that has a primate city."), diffusion ("Pick a migration idea, then press Play and watch who moves."). Model studio card: "Every piece is in its place".

## Questions
- FRQ coach: the rubric line and sample can be revealed before writing. The standard opens answers after one try; locking it would take away something it does today, so it is unchanged. Gate it?
- Map reader shows a "Map" pill that repeats the picker's choice. Drop the pill?
- Some finished-card takeaways are short out of context (for example "Chile is the usual example." on an elongated shape). They are the authored last solution line; better takeaways per problem type would need writing.

## Accuracy check (F6b, 2026-11-16)
Checked `LEDE`, `TASK`, the scene lines, the model studio card and every drill type's takeaway (generated per context
and type) against the tools and `docs/aphug-authoring-guide.md` (named real places, neutral and dated, plain words).
- Correct as written: seven of eight `LEDE` lines, all `TASK` lines, every scene line ("often classed" stays neutral),
  "Every piece is in its place".
- Changed: scale-lab lede "See how the same data change with the scale of the map." to "See what changes with the scale
  of analysis, and what map scale means." (the tool teaches that the scale of analysis is the data's scale, not the
  map's size; the old line merged the two).
- Takeaways: new own lines (`TAKE` in hug-tools.js), answering the owner's question above:
  - borders shape, one line per shape, each with its challenge and the course's example (for elongated: "An elongated
    state has far ends that are hard to reach and govern from the capital. Chile is the usual example.").
  - borders boundary (began "It still divides..."): "A boundary that still divides two states controls who and what
    crosses." or "A relict boundary no longer divides states, but its traces stay in the cultural landscape."
  - borders forces: the verdict in front ("Centripetal: it unifies the state. Stronger cultural cohesion: ...").
  - city models (began "A limit: It..."): the model's name in front ("Sector model (Hoyt). A limit: ...").
  - diffusion diffusion: the type in front ("Stimulus diffusion. A real case: In India, ...").
  - diffusion migration ("Factor 3 is a political cause." alone): the definition only ("Political causes are about
    laws, governments, rights, conflict and borders.").
  - frq coach part: the verb's demand ("Explain: Say how or why, with every link of the chain ..."); verbs: "Each task
    verb asks for something different: do what the verb asks, about the place or data in the question."; earns: "A
    point is earned by doing what the task verb asks, with the place or data the question names."
  - model studio (every model; began "A limit. It..."): "Demographic transition model. One limit: It leaves out
    migration."
  - Kept: sea, city rings, bidrent, central, ranksize, diffusion mixed, kinds, ravenstein, population, scale.

## F8 (2026-11-16): final wrap up
- FRQ coach step 3 ("Which answer earns the point?") now waits for the same try as the sample (four letters in step 1):
  before that it shows its heading and "Two answers to compare open once you write yours in step 1." It opens in
  place as the student types (with a spoken line); a part already tried opens at once. Seen at 390 and 1440, light
  and dark: locked, open, wrong answer, next part (locks again), back to part A (open, answer and feedback kept).
- Accuracy check (F8) against `docs/aphug-authoring-guide.md`:
  - population-lab cohort takeaway: correct; made precise to "usually comes from an event, such as a baby boom, a drop
    in births, a war, or people moving in or out" (deaths in a war also leave a gap).
  - FRQ coach lines "Show the rubric line", "Show the rubric line and a sample", "A full-credit answer opens once you
    write yours in step 1." and the new "Two answers to compare open once you write yours in step 1.": correct (the
    gate is four letters in step 1); plain words.
  - Shared search panel lines "Type to search" and "Nothing matches. Try fewer letters.": correct.
