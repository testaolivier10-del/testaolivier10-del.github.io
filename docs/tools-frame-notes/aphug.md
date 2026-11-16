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
