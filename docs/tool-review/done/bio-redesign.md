# bio-redesign: AP Biology redesigns (2026-11-10)

Branch `claude/tv-bio-redesign`. Tools: design drills and signal transduction (the two REDESIGN rows in
`docs/tool-review/bio.md`). The eight FIX tools were another builder's. Screenshots:
`/home/claude/shots/build/bio/<tool>_before.png`, `_after.png`, `_after_p.png`.

## Design drills (`bio/assets/tools/design-drills.js`, `bio-tools.css`)

What changed
- The shared row of flasks with bars inside is gone. Each of the 16 scenarios has its own drawn setup (`SCENES`,
  keyed by scenario id): duckweed flasks with nitrate dots; fat samples with their 18-carbon tails drawn with 0 to
  3 cis kinks; paramecium dishes with salt; red cell tubes with the ethanol dropper only on the digoxin tubes (the
  confound shows); pea respirometers in three water baths; Elodea under blue, green and red filters with a heat
  flask; Vibrio flasks with the conditioned share shaded; onions over the compound; Himalayan rabbits with pads
  colored cool to warm; fly vials in incubators; paired uridine and leucine tubes; the four reporter constructs as
  DNA with the missing region as a gap; dry and humid fly cages; jars of 10 and 100 beetles; phosphate tanks in the
  sun; the woodlouse choice chamber (damp, dry, covered). The equipment for what is measured and what is kept the
  same is drawn across the top with a short label.
- The drawn parts are tied to the variables drill: each part is `.dr-part[data-part=i]` for option i; tapping it
  answers the current row like its tag, hovering lights both, and after Check the part glows in its role color.
- The data are a plain bar chart beside the scene: zero line, negative values point down (melting points of
  -12.8 and -23.9 °C now read as below zero), ± error bars, values on the bars, axis titles from the table.
  Columns with the same measure share one grouped panel (antibiotic RNA and protein, woodlouse damp and dry).
- A scenario added later without a scene falls back to plain labeled flasks (no data inside them).

Verified
- All 16 scenes and charts rendered and read at 1280x800 (tiled), the page at 390x844, dark mode.
- Tapping the nitrate part then the balance answered the IV and DV rows ("2 of 2 right"); tags and parts showed
  roles after Check. Item ids, grading and recording unchanged.

Left
- On a phone the scene is taller than the stage window, so its level labels need a short scroll of the stage (the
  old sketch had the same limit).

## Signal transduction (`signal-transduction-amplification.js`, `bio-tools.css`, data json)

What changed
- The scene plus ladder of boxes is replaced by one picture of the cascade in a liver cell: epinephrine in the
  fluid outside (more at higher concentration, gone after washout), receptors in the bilayer, then one row of
  drawn molecules per step (G proteins, adenylyl cyclase, cAMP, PKA, phosphorylase kinase, glycogen
  phosphorylase, glucose) above a glycogen granule. Rows use a powers-of-ten scale (3 drawings per factor of 10,
  stated in a key on the picture); fixed pools show their unused part as faint rings; a shaded funnel joins the
  rows, so it widens at amplifying steps and pinches at G protein to cyclase and cAMP to PKA. Counts and gains
  are labels. Play fills it from the top down; washout drains it.
- Blocking: rows with ⊘ are the buttons (receptors, G proteins, cAMP, PKA), as before. A G protein locked off or a
  PKA inhibitor draws a red stop line and everything below drains ("× 0: blocked here"). The antagonist is drawn
  sitting on the receptors epinephrine cannot reach, with no stop line, because it competes and only lowers the
  signal.
- Opens at 0 s (data `readTime.value` 60 to 0). One column at every width: drawn 520 wide on desktop, 400 on a
  phone; the old two-column phone ladder is removed. Every control, drug, graph, table, question and recorded
  id is unchanged.

Accuracy flag: "1 for every 200" cAMP to active PKA labeled as binding
- Checked: PKA holoenzyme R2C2 binds four cAMP, two per regulatory subunit, releasing two catalytic subunits
  (Berg, Biochemistry 8e, figure 10.16 caption; Wikipedia, Protein kinase A). The tool was wrong to label the
  ratio "binding, one-to-one or less": 200 is the model's count of cAMP per active PKA (Kc = 2,000,000 against
  20,000 PKA), with most cAMP unbound, not a binding stoichiometry.
- Fixed: the note now reads "1 for every 200: no gain (each PKA needs 4 cAMP bound)", and How this model works
  says four cAMP bind each PKA (two on each regulatory subunit), freeing its two catalytic parts, and that the 200
  is a count of molecules, not how many cAMP each PKA binds. Numbers and answer keys unchanged.

Checks
- `node scripts/build-apbio.mjs --check`, `check-apbio-content.mjs` (0 failing), `check-apbio-map.mjs`,
  `node --test scripts/test/apbio*` (71 pass), `node scripts/check-site.mjs` (OK).
