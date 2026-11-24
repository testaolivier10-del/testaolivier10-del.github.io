# Plan: Organic Chemistry, Acid/Base Comparator (tools v2)

## Tool and page
- Page `ochem/tools/acid-base.html` (built by `scripts/build-tool-pages.mjs` from `ochem/assets/tools-registry.js`,
  slug `acid-base`). Script `ochem/assets/tools/acid-base.js` (1,317 lines, 87 KB) on the course layer (`tool-shell.js`,
  `tool-state.js`, `tool-quiz.js`, `tool-handoff.js`, `molecules.js`, `chem-core.js`, `mol-builder.js`).
- **Premium** (not in `FREE_TOOLS` of `ochem/assets/ochem-premium.js`).
- Rollout row 30, group M (sorters and matchers), size rework. Unchanged on `claude/tools-v2-all` against `main`.

## The one idea
The more the conjugate base spreads or holds its negative charge, the more easily the acid gives up its proton.
Four tabs, one factor each (the order the course teaches, ARIO):
1. **Atom**: a more electronegative (or larger) atom holds the charge better.
2. **Resonance**: a charge shared over more atoms is a weaker charge on each.
3. **Induction**: nearby pulling atoms thin the charge, less with distance.
4. **Orbital**: more s character holds the pair closer to the nucleus.

## Research
- [OrgChem101 (uOttawa, Flynn lab), acid base module](https://orgchem101.uottawa.ca/modules.php): learners compare
  conjugate bases, not acids, and the feedback names the factor. Take: the conjugate base is the thing drawn.
- [Alchemie Mechanisms](https://www.alchemie.com/) (group B row) and the site's own push board: the proton comes off
  by a real move. Take: the student pulls the H away, the pair stays behind.
- [PhET pH Scale](https://phet.colorado.edu/en/simulations/ph-scale) (group P row): a ruler on the picture that a
  marker slides along. Take: one pKa ruler with water as a fixed landmark.
- Duolingo (group M row) only for Test yourself rounds (Compare two, Rank four). Seen as text only; builder must open them.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Mode Compare two: New pair, Pick your own pair (two selects of 39 acids), guess chips, verdict, factor table, Why? walk (atom, resonance, induction, orbital), "rules disagree" note (ethanol vs water) | Test yourself part "Compare two" unchanged; the factor walk becomes each tab's cause line in Explore; the disagree cases go to "?" and stay in the part |
| Mode Rank four: New set, drag or tap to order, move buttons, pKa line, verdict | Test yourself part "Rank four" unchanged |
| Mode Which proton?: 8 molecules (`MULTI`: glycine, salicylic, hydroxybenzoic, cysteine, malonic, acetoacetate, pentanedione2, aceticmulti), tap a site on the structure or a chip | Test yourself part "Which proton?" unchanged |
| Score pill (right of total) | Test yourself only |
| Check yourself quiz (`OchemToolQuiz`, 6 rounds, random pairs) | last Test yourself part through `OchemStudioKit.kit2` `check` |
| `OchemToolState` keys `mode`, `a`, `b`, `m` | `?mode=rank` and `?mode=site` open those parts; `?a=&b=` opens Compare two on that pair; with no key, Explore tab 1 |
| Factor table, caveats | "?" |
Nothing is dropped; any change is logged in `docs/tools-v2-owner-log.md`.

## Design
- **Picture:** one acid drawn large as a real skeletal structure (atoms in element colours, the acidic H drawn as
  a white sphere on its bond) and a base (hydroxide) beside it. Pulling the H leaves the conjugate base, its charge
  drawn as a red glow on every atom that shares it (two equal glows on a carboxylate, one on an alkoxide, smaller on
  phenoxide ring carbons), brightness from the charge per atom. A vertical pKa ruler at the stage edge has water
  (15.7) fixed as a landmark and the molecule's marker on it.
- **Main control:** a knob on the picture steps along each tab's series (Atom: ethane, ammonia, water, HF, then
  HCl, HBr down the column; Resonance: ethanol, phenol, acetic acid; Induction: acetic, chloro, dichloro,
  trichloroacetic, plus 3 chloropropanoic for distance; Orbital: ethane, ethene, ethyne). Secondary: drag the H off
  (it springs back when let go; how far it must be pulled before it lets go grows with pKa).
- **Animates:** atoms morph in place (a Cl grows in, a C=O forms), the glow spreads or tightens, the ruler marker
  slides; the pulled H leaves with its bond pair staying on the atom.
- **Cause line:** "2 Cl pull electrons → charge on O thinner → base more stable → pKa 1.29".
- **Takeaway** at a series end: "The acid is strong when its conjugate base is happy with the charge."
- **Outside the picture:** tabs (4), purpose line (about 8 words), cause line, "?", Test yourself. About 25 words.

## Science to verify
- Every pKa used in Explore (ethane 50, ethene 44, ethyne 25, ammonia 38, water 15.7, HF 3.2, HCl −7, HBr −9,
  ethanol 16, phenol 10, acetic 4.76, chloroacetic 2.86, dichloroacetic 1.29, trichloroacetic 0.65,
  3 chloropropanoic 4.0): Klein, Organic Chemistry, ch. 3 pKa table; Clayden ch. 8; Evans pKa table for DMSO values.
- Water 15.7 against 14.0 and ammonia 38 against about 41 are already contested (`docs/ochem-needs-author.md`
  lines 407 to 409): keep the course values, say "approximate" in "?".
- Size beats electronegativity down a group (HF weaker than HCl) in water: Klein 3.4; must not be drawn as
  "less electronegative is stronger" in general.
- Glow intensity per atom must match the resonance contributors drawn (phenoxide: O plus ortho and para carbons;
  carboxylate: two O equally). Clayden ch. 7.
- s character values: sp3 25%, sp2 33%, sp 50%.

## Reuse
- `OchemStudioKit.kit2` (`ochem/assets/tool-shell.js`): stage, "?", parts, `check`; `kit2: true` in the registry.
- The molecule drawing in `acid-base.js` (`structSvg`, `cbSvg`, `deprotonated`) and `analyse()` for cause words.
- `ochem/assets/push-board.js` for the pulled H and the pair that stays (Resonance and Arrow Pusher share it).
- Kit: `K.tabs`, `K.drag` (series knob), `K.handle` (the H), `K.cue`, `K.cause`, `K.head`.

## Risks reviewers will likely block on
- Labels: element symbols, charges and the ruler numbers must stay 11 px or larger at 360 and clear by 4 px.
- Ruler beside a big molecule on a phone: stack the ruler under the molecule below 600 px, not shrink it.
- Picture and ruler and cause line disagreeing mid morph (marker moving before the atom changes).
- Glow drawn larger than the molecule's bonds, or a "ghost" H left behind.
- Weight: `acid-base.js` is already 87 KB; Explore goes in its own file and bucket (as A&P predict did).
