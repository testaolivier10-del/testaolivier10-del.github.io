# Plan: AP® Biology, Signal transduction and amplification (tools v2)

**Tool and page:** `bio/tools/signal-transduction-amplification.html`;
`bio/assets/tools/signal-transduction-amplification.js` (357 lines), data
`bio/data/tools/signal-transduction-amplification.json` (stages R, G, AC, cAMP, PKA, PhK, GP, rate; G protein
normal, on, off; blocks antagonist, pde, pka; epinephrine, washout and read time ranges). Premium. Rollout row 88,
group P, wave 11, size rework.

**The one idea:** one hormone molecule is amplified at every step into a flood of glucose. Two tabs: "Amplify"
(epinephrine dose and the cascade) and "Switch off" (washout, GTP hydrolysis, PDE: the signal ends; blocks and a stuck
G protein).

## Research
- [Biology Simulations, cAMP signaling cascade (McCreary)](https://dmccreary.github.io/biology/sims/camp-signaling-cascade):
  step by step counts down the cascade; take the widening fan of molecules.
- [Lodish, Signal amplification in the cAMP PKA pathway (Macmillan)](https://digfir-published.macmillanusa.com/lodish8e/lodish8e_ch15_38.html):
  the textbook numbers per step; take the order of magnitude labels.
- [Oxford Learning Link, Cooper animation 17.3 Signal Amplification](https://learninglink.oup.com/access/content/cooper8e-student-resources/cooper8e-chapter-17-animation-3):
  membrane to cytoplasm drawing. Builder: open all three.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Epinephrine concentration slider | Amplify tab: main control, drag the dropper on the blood vessel |
| Play 0 to 300 s, Read the counts at slider | Time bar and Watch it |
| Tap a stage to focus it; Step to plot | Amplify tab: tap a step to read its count on its pill (quiet) |
| Washout at slider | Switch off tab: main control (a wash of fresh blood at a time on the bar) |
| G protein normal / always on / off; blocks antagonist, PDE inhibitor, PKA inhibitor (tap a step to block) | Switch off tab: quiet taps on the receptor, G protein, PDE and PKA |
| Graphs over time and against dose | "?" (both graphs and the model table), log it |
| Run one trial, Run a series, Clear runs | "?", log it |
| Questions (5 ids `signal-transduction-amplification:liver:1..5`), stimulus `sig-s1`, mini FRQ | Test yourself, unchanged. The tool has no other drill: add none |

## Design
- **Picture:** a liver cell's edge: a capillary above with red blood cells and epinephrine molecules, the plasma
  membrane as a lipid bilayer with depth, the receptor, G protein (α, β, γ), adenylyl cyclase in the membrane; below,
  the cytoplasm fans out: cAMP, PKA, phosphorylase kinase, glycogen phosphorylase, and glycogen granules shedding
  glucose that leaves the cell into the blood. Each level drawn as molecules, the fan widening downward.
- **Main control:** drag the dropper (dose). Within the frame, receptors light, G proteins swap GDP for GTP, and each
  lower level fills with more molecules; the drawn number per level is capped and a pill gives the real count
  ("× 10⁴ cAMP").
- **Switch off tab:** washout drains epinephrine; GTP is hydrolysed and the α subunit returns; PDE eats cAMP (drawn
  as cAMP fading to AMP); the fan empties from the top down.
- **Animates:** binding, subunit release, molecules multiplying level by level, glucose leaving.
- **Cause line:** "1 epinephrine → 1 receptor → 10 G proteins → ... → 10⁸ glucose" (counts from the model at the time).
- **Takeaway:** "Each enzyme makes many of the next, so one hormone frees millions of glucose."
- **Outside the picture:** 2 tabs, purpose line, Show me how, time bar, cause line.

## Science to verify
- The pathway order and molecule names (epinephrine, β adrenergic receptor, Gs, adenylyl cyclase, cAMP, PKA,
  phosphorylase kinase, glycogen phosphorylase, glucose 1 phosphate) (NCBI Bookshelf: Alberts, Lodish; CED 4.2).
- Amplification per step: order of magnitude only, with the source in "?"; say "teaching model".
- Liver releases glucose (glucose 6 phosphatase); muscle does not (a likely misreading: "?" says liver).
- Trap: "the hormone tells the cell" is purpose language; write mechanism. No OpenStax.

## Reuse
`ApBioTools.studioKit2` (questions part only). Kit: `K.tabs`, `K.drag`, `K.tap`, `K.scrub`, `K.player`, `K.cue`,
`K.cause`. Not the first AP® Biology tool on kit2.

## Risks reviewers will likely block on
- "Dense cascade with small labels" is the old fault: eight levels at 360 px need a tall stage; never shrink below
  11 px; short names (cAMP, PKA) on the picture, full names in "?".
- Drawn molecule counts vs real counts: the scale per level must be stated and consistent (proportions rule).
- Exponent text (10⁸) must not break inside the pill at 360 px.
- Perf: cap drawn molecules per level; no per frame DOM rebuild.
