# Organic Chemistry tool fixes: build report (2026-11-10)

Branch `claude/tv-ochem`. Screenshots: `/home/claude/shots/build/ochem/` (`<tool>_before.png`, `_after.png`, `_after_p.png`).
Tools marked LEAVE were not touched.

## Acid/base comparator (FIX), `acid-base.js`
- After the call each card shows its conjugate base, drawn with the site renderer: the proton gone (an H⁺ drifts
  off; reduced motion shows it in place), a red glow on every atom that shares the charge (fainter where it is
  spread thinner), the hybrid for carboxylates, sulfonate and enolates (dashed partial bonds, δ− on each sharing
  atom, no single "−" badge), blue induction arrows for Cl, F, CN, NO₂, CF₃, the second COOH and the peroxide O,
  and one line under the picture. Ammonium ions lose H⁺ to a neutral amine (the glow is the lone pair).
  Data: the `CB` table, one entry per acid (all 37), checked against each acid's own `why` text.
- Rank four: each structure fills its card (hydrides no longer tiny).
- Not done: the Which proton mode is unchanged (not in the review).

## Resonance explorer (FIX), `resonance.js`
- When every form is found, the board gives way to the resonance hybrid (Back to the board / See the hybrid):
  dashed second line on every bond that is double in some forms; δ on every atom charged in some forms, large
  where a major form charges it, small where only a minor form does; an atom charged the same in every form keeps
  its charge (ozone's O⁺). Lone pairs are left off.
- Compare two: each structure is cropped to fill its card; after the call each side becomes its hybrid.
- The existing "Where the charge sits" averaged map is unchanged.

## Spectroscopy lab (FIX), `spectroscopy.js`
- IR now draws the molecule above the spectrum; tapping a band lights its bond (C=O, C–O, C≡N, C≡C, C=C, N–O,
  ring) or the atom carrying the H for an X–H stretch, and tapping an atom picks its band. Read from the band
  label and the structure, so it also works for a drawn molecule.
- IR and NMR share one stacked layout and are drawn at their box's pixel size (redrawn on resize), so the NMR
  fills its panel with 14 px labels. NMR labels pinned under the key row step sideways instead of stacking.
- Accuracy flag, ethanol O–H: confirmed against OpenStax Organic Chemistry 17.11 (hydrogen-bonded alcohols give a
  broad absorption, about centered at 3300 to 3400, 3200 to 3550 overall; free O–H is sharp near 3600). Every
  hydrogen-bonded alcohol O–H is now drawn as overlapping bands: broad, rounded, flat floor, at least 68% deep.
  The acid O–H (2500 to 3300) was already broader and is unchanged.

## Reagent roadmap (REDESIGN in part), `reagent-roadmap.js`, `reagent-roadmap.html`
- Route: each step's reagents ride its arrow on the map (pill beside the step number). Under the map the route is
  played on one molecule (first Synthesis Trainer family with a molecule for every group, walked with its pattern
  rules: propan-2-ol, propene, propan-1-ol), reagents on the arrows between. A route with a C–C step shows R
  fragments instead. The page now loads `molecules.js`, `chem-core.js`, `mol-builder.js`, `synthesis-data.js`.
- Groups: the tangle map is replaced by a fan of the picked group's own arrows (makes it, from above; becomes,
  below), each card naming the group and its reagents; the group drawn as an R fragment; a group picker in the
  dock. Cards are buttons with the same `data-node`, so tapping moves there; Why still lists every reaction.
- Phone: the zoomed map keeps all four columns (it slid off the right edge before). Desktop: the view is clipped
  to its box so no node is cut in half. Whole map no longer draws the faint web of every reaction.
- Not done: map nodes themselves stay text boxes (name and short formula); the fragments appear in Groups and the
  molecules in the route strip, where there is room to read them. Puzzle mode unchanged apart from the map fixes.

## Accuracy flags
- Ethanol O–H: tool was wrong; fixed (above).
- Reaction predictor (LEAVE tool, unchanged): 2-bromobutane in hot water "mostly E1" and neopentyl bromide "No
  reaction" are both arguable; recorded with sources and suggested wording in `docs/ochem-needs-author.md`
  (`tools-review-2026-11-sn1-e1-split`, `tools-review-2026-11-neopentyl`). Also logged there: the hybrids and
  conjugate-base glows are qualitative (`tools-review-2026-11-hybrid-weights`).

## Checks
- `node --test scripts/test/ochem-*.test.mjs tool-content synthesis-trainer`: 100 pass, 0 fail.
- `node scripts/check-weight.mjs`: all budgets within range.
- `node scripts/check-site.mjs`: no failure in any ochem file (one British spelling I added was fixed). It still
  reports about 2,425 failures from the "hard-coded chapter number" rule in other courses' pages, none touched here.
