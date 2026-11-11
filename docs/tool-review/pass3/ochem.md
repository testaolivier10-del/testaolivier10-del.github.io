# Organic Chemistry: cleanup pass 3 (task c1, 2026-11-11)

Judge file: `docs/tool-review/pass2/judge-a.md`. Shots: `/home/claude/shots/pass3/ochem/` (`<tool>_before_d.png`,
`_after_d.png`, `_after_p.png`; extra: `reagent-roadmap_reagent_after_*`). The shared ochem shell
(`ochem/assets/tools.css`, `tool-shell.js`) was not edited: new styles live in each tool page's own `<style>`.

| Tool | Judge said | What I did | Now |
|---|---|---|---|
| reagent-roadmap | FAIL: Route opens on about 20 group tiles with crossing arrows plus a molecule strip (52 labels), tiny on a phone, strip clipped; Reagent tab a wall of text cards and about 20 chips | Route: the route on one molecule is the hero (start, each step, target drawn as structures, reagents on the arrows, every structure at one scale so a small one is not blown up beside a big one). Long routes wrap to a second row on desktop; on the phone the route runs down the screen (structure left, name and group right, a down arrow with the reagents between). The map is behind "Show on the map" (with its Whole map button, the level key and tap-a-group-to-target as before); a search with no route still shows the map. The caption no longer says "under the map"; the "2 steps" and "Same skeleton" pills went (the caption and the dock switch say both). Reagent: one reaction at a time, drawn: the group it starts from, an arrow carrying the reagents, the group it gives; "1 of 7 reactions" with back and next above it; example and notes behind a tap as before | PASS: Route opening about 8 labels (3 names, 3 groups, 2 reagent lines) on one picture, 1 button; phone readable without zoom. Reagent: one card, 2 nav buttons |
| reaction-predictor | TOUCH UP: 8 substrate chips, 12 reagent chips and two strength bars at once | Substrate and reagent are two pickers that open on tap ("Substrate 2-bromobutane", "Reagent NaOEt"), styled like "Solvent and heat" under them; one open at a time. The nucleophile and base bars live inside the reagent picker, so they show once the student opens it to pick | PASS: dock shows the mode switch and 3 pickers |
| conformations | TOUCH UP: 9 molecule chips, 3 jump chips and 2 mode rows at once | The nine molecules are one select ("Molecule") beside "Make your own" (renamed from "Build your own", which the Details button already says); the slider and the three jumps stay. The chips remain hidden underneath and the select presses them, so every path is the same; the select shows "Your own" while the builder is open | PASS |
| acid-base, arrow-pusher, resonance, spectroscopy, synthesis, viewer-3d | PASS (nits: dashed tap rings, water lone pairs) | Not touched | PASS |

## Accuracy check (ochem science)
No reaction, reagent, route or answer data changed (`reagent-roadmap-data.js`, `synthesis-data.js` untouched; the
route search is the same). What is new is drawing: the Reagent tab draws each reaction with the group fragments the
Groups tab already used. Checked by eye: oxymercuration (alkene to 2° alcohol), hydride reduction (aldehyde to 1°
alcohol), epoxidation, acetylide alkylation (1° alkyl halide to alkyne), and the routes 2° to 1° alcohol (propan-2-ol,
dehydration, hydroboration-oxidation, propan-1-ol) and alkane to carboxylic acid (isobutane, radical bromination, E2
with ethoxide, hydroboration, Jones, 2-methylpropanoic acid), all correct. One fix: the acetylide alkylation edge goes
alkyne to alkyne, so both sides drew an internal alkyne; its start is now drawn as a terminal alkyne (R-C≡CH), which is
what the reaction needs. Epoxide and diazonium have no drawn fragment (the ring builder has no heteroatom rings), so
they show their short formula as text, as the Groups tab already did. Reaction predictor: 2-bromobutane with NaOEt
still gives E2 (Zaitsev, (E)-but-2-ene) about 65%, SN2 about 35%, unchanged. Conformations: butane at 60° reads
gauche, 0.9 kcal/mol, unchanged.

## Left for later
- Reagent roadmap's Reagent chips (about 20, by family) stay in the dock: that is the shared "More" overflow's job.
- Epoxide and diazonium as drawn structures needs heteroatom rings in `mol-builder.js` (shared).
