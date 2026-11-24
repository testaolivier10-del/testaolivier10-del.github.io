# Plan: AP® Biology, Lac and trp operons (tools v2)

**Tool and page:** `bio/tools/operons.html`; `bio/assets/tools/operons.js` (541 lines), data
`bio/data/tools/operons.json` (lac genes I, O, Z; trp genes R, O; lac media gl, both, none, lac; trp media trp,
notrp; read time −15 to 90 min). Premium. Rollout row 46, group P, wave 11, size rework.

**The one idea:** what is in the medium decides whether the repressor sits on the operator. Two tabs, one idea each:
"Lac operon" (lactose lifts the repressor off; glucose keeps CAP away: inducible) and "Trp operon" (tryptophan puts
the repressor on: repressible).

## Research
- [Prokaryotic Gene Regulation (LabXchange)](https://www.labxchange.org/library/items/lb:LabXchange:078304b3:lx_simulation:1):
  drag molecules into the cell and watch the repressor and polymerase; take "drop the sugar in".
- [lac operon simulator tutorial (bio-sims)](https://bio-sims.github.io/lacop/tutorial.html): mutant strains with
  measured enzyme levels; take the mutants as a Test yourself puzzle.
- PhET Gene Expression Essentials (known): RNA polymerase drawn moving along DNA, mRNA growing; take the motion.
  Builder: open all three.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Lac / trp radio (`#op-mode-lac`) | Two tabs |
| Medium chips under the picture (sugars, tryptophan) and "Before 0 min the cells grew with" | Explore: tap a sugar jar on the picture to pour it in or rinse it out (main control). The "before" medium to "?" and Test yourself setups, log it |
| Gene taps (break a gene: I⁻, Iˢ, Oᶜ, Z⁻; R⁻, trp Oᶜ) | Explore: quiet "break" tap on each gene on the DNA (ungraded); a broken gene gets a jagged mark and its product changes |
| Time course graph, Every medium graph, Read the cells at slider, Steady state level | Explore: the time bar only (the cell at that minute); mRNA and enzyme levels as one small gauge on the picture. Both graphs to "?" |
| Run one trial, Run every medium, Clear runs | "?" (model table), log it |
| Mutant quiz "Which mutant is this?", Check, Next strain; ids `operons:mutant-<id>:a`; `#quiz` | Test yourself "Which mutant?", same ids |
| Questions (5 ids `operons:lac:1..4`, `operons:trp:5`), stimulus `op-s1`, mini FRQ | Test yourself "Questions", unchanged |
| "Going further" text | "?" |

## Design
- **Picture:** inside an E. coli cell (curved envelope with depth, cytoplasm texture), a long DNA double helix
  across the stage with the promoter, operator and genes drawn as coloured stretches on it (lacI apart, lacZ, Y, A).
  The repressor drawn as a protein blob that sits on the operator or floats free; CAP with cAMP near the promoter;
  RNA polymerase as a large blob that runs along the genes; mRNA ribbons that peel off; β-galactosidase enzymes
  accumulating. Outside the cell, lactose and glucose molecules drawn as small hexagon pairs.
- **Main control:** tap the lactose jar or the glucose jar on the scene's edge: molecules stream into the medium (or
  are rinsed out). Lactose (as allolactose) binds the repressor, which lets go of the operator; polymerase starts
  running and mRNA appears. Glucose drops cAMP so CAP leaves and only a trickle of mRNA is made.
- **Trp tab:** tryptophan molecules bind the repressor, which then lands on the operator; polymerase stops.
- **Animates:** binding, release, polymerase travel, mRNA growth and decay, enzyme count rising or falling.
- **Cause line:** "lactose in → repressor lets go → polymerase reads lacZ → β-galactosidase made".
- **Takeaway:** "Lac is switched on by its sugar; trp is switched off by its product."
- **Outside the picture:** 2 tabs, purpose line, Show me how, time bar with Watch it, cause line.

## Science to verify
- Allolactose (not lactose) is the inducer; glucose acts through lower cAMP and CAP (catabolite repression); inducer
  exclusion is a simplification to name in "?" only (NCBI Bookshelf: Alberts, Lodish "Molecular Cell Biology").
- Mutant phenotypes: I⁻ constitutive, Iˢ uninducible, Oᶜ constitutive in cis, Z⁻ no enzyme; trp R⁻ constitutive.
- trp attenuation is beyond the CED: not drawn; one line in "?" at most.
- Trap: mechanisms not purposes ("the cell wants lactose" is banned). No OpenStax.

## Reuse
`ApBioTools.studioKit2` with parts (Which mutant?, Questions). Kit: `K.tabs`, `K.tap` (jars and genes), `K.scrub`,
`K.player`, `K.cue`, `K.cause`. Not the first AP® Biology tool on kit2.

## Risks reviewers will likely block on
- Many small parts: gene names (lacI, lacZ) at 11 px minimum; on phones the DNA may fold into two rows rather than
  shrink.
- The repressor shown on the operator must agree with the mRNA count and cause line in every frame.
- A broken gene state must survive tab switches and be undoable (rule 8).
- Perf: mRNA ribbons and molecules capped; remove faded copies.
