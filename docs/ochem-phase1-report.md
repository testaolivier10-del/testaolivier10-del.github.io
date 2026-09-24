# Ochem readability pass: Phase 1 report

Date: 2026-09-24. Status: **done, waiting on the owner's review.** Branch
`claude/eloquent-thompson-c28a29`. Not merged to main, so not live.

Phase 1 rewrote functional groups (chapter 1) and all four IUPAC nomenclature topics (chapter 3),
notes page and lesson for each, against the standard in `docs/ochem-readability-audit.md`. Every
finding the Phase 0 audit listed for these ten pages is addressed.

## What changed

| Topic | Notes figures | Lesson figures | Notes words | Lesson steps |
|---|---|---|---|---|
| functional-groups | 3 → 13 | 0 → 8 | 2,945 → 3,765 | 8 → 11 |
| naming-parent-chain | 2 → 9 | 1 → 11 | 1,769 → 2,249 | 8 → 11 |
| naming-substituents | 3 → 9 | 0 → 13 | 1,814 → 2,388 | 8 → 13 |
| naming-functional-groups | 3 → 10 | 0 → 12 | 2,104 → 2,546 | 8 → 13 |
| naming-rings-unsaturation | 5 → 15 | 1 → 18 | 2,167 → 2,939 | 8 → 19 |

- **Example before rule.** Every section now opens on a drawn molecule, then states the rule.
- **Every spatial idea is drawn.**
  - Chain choice, numbering in both directions, locant sets compared at the first point of
    difference, alphabetical tie-breaks, complex substituents, ring numbering, cycloalkenes, the
    ene/yne order and o/m/p each have a numbered skeletal figure. The parent chain is highlighted
    in every one.
  - The functional-group table is drawn family by family. It comes before skeletal structures in
    the course, so every atom is labelled.
  - Benzene, C₆H₅– and –C₆H₄– are drawn atom by atom.
  - Each degree of substitution and each of the three drug examples is drawn.
- **Lessons teach before they test.** Overloaded steps were split into single ideas. Every
  structure question shows its structure, and question figures carry no numbers or names that
  give the answer away.
- **The pages grew rather than shrank.** No correct fact was dropped; both audit stages compared
  against the pre-rewrite commit b585696 and checked for this.

## Chemistry fixed (all confirmed by both audit stages)

**The impossible example**
- The old tie example described two seven-carbon chains, one carrying an ethyl and one carrying
  two methyls. No alkane has that shape. It is replaced by 3-ethyl-2-methylheptane against
  3-isopropylheptane.

**Nomenclature rules**
- **Ring numbering:** "the first-cited group is usually C1" was wrong. Lowest locants come first,
  and alphabetical order decides only a tie.
- **Multiple-bond numbering:** the full order is now stated: lowest locants to all multiple bonds
  together, then the double bond on a tie, then substituents (4-methylhex-1-en-5-yne).
- **-ene spelling:** the final e of -ene is also dropped before -yne (pent-1-en-4-yne).
- **"Nothing outranks halogens":** true only in an alkane. A principal group or a C=C or C≡C comes
  first.

**Priority and reactivity**
- The priority order does not follow reactivity. An acyl chloride ranks below an ester but is
  more reactive. The order is now the IUPAC 2013 list, with alkenes and alkynes correctly left
  off it.
- **Alcohol/amine block:** it was defined as "the O or N carries an H", which fails for
  tertiary amines.
- **oxo- against formyl-:** now defined and drawn. "An aldehyde carbon is always C1" holds only
  when the aldehyde is the principal group.

**Substituent names**
- **Complex substituents:** "the attached carbon is always C1" was stated as universal. The
  classic convention (1-methylpropyl) and the 2013 one (butan-2-yl) are now both taught and
  labelled.
- **"propan-2-yl, not propan-1-yl":** the sentence was garbled. Those are two different groups.
- The status of *tert*-butyl, isopropyl, *sec*-butyl, isobutyl and neopentyl under IUPAC 2013 is
  now stated correctly.

**Functional-groups page**
- **Nitro group:** a neutral four-bonded N is now correctly called the missing-charge error.
- **Carbonyl gallery:** the atom attached to the C=O changes *how readily* the carbon is
  attacked, not only what happens next.
- **Removed claims:** ethanol and cholesterol "react at the same rate", "every chapter is titled
  after one of these rows", and ibuprofen's stereocenter "because it is tertiary".
- **Route counts:** two wrong carbon counts in the parent-chain notes are corrected.

## The two-stage audit

The five topics went through the site's usual process:

1. A writer rewrote the topic.
2. A fresh stage 1 checker listed findings.
3. The writer fixed them or rejected them with a reason.
4. A second, skeptical stage 2 verifier re-derived every name, locant, drawing and answer key.
   Anything it failed went back for fixes, and was then re-verified.

| Topic | Stage 1 | Stage 2 | Re-check |
|---|---|---|---|
| functional-groups | does not meet (6 chemistry, 5 figure) | FAIL: 1 lesson sentence | fixed; lesson now matches notes |
| naming-parent-chain | does not meet (3 chemistry) | FAIL: phone overflow, stale head | PASS |
| naming-substituents | does not meet (5 chemistry/M) | FAIL: 1 stale distractor | PASS |
| naming-functional-groups | does not meet (4 chemistry) | FAIL: 2 overstated sentences, 1 missing figure | FAIL: 1 unverifiable sentence, since removed |
| naming-rings-unsaturation | does not meet (2 chemistry) | FAIL: -yne elision, "one carbon apart" | PASS |

The reports are session-local (`scratchpad/phase1/<topic>-{writer,stage1,fixes,stage2,stage2b}.md`).
The commits carry the changes.

Two of the final fixes were one-line edits, applied after the last verifier had reported, and the
page checks were re-run after both:
- the functional-groups lesson sentence;
- removing the unverifiable naming-functional-groups sentence.

Each is exactly the fix the verifier named.

## Site changes made along the way

- **Figure builder:** `scripts/build-ochem-figures.mjs` now loads per-topic figure modules from
  `scripts/ochem-figures/`. It can write the same figure into a lesson step, and it can build one
  module with `--only`. The skeletal helpers moved to `scripts/lib/ochem-skeletal.mjs`.
- **Phone fit:** in `assets/theme.css`, a figure inside a lesson card may now shrink to fit. Below
  420px, lesson figures used to scroll sideways and lose their right edge. They now stay at 0.89
  scale or more at 375px.
- **Bounds test:** it now also reads lessons and figure ids that contain digits, which it had been
  skipping. That exposed two clipped labels in `alcohol-reactions`, both fixed.
- **Flashcards:** the common-names card rule follows the table's new third column.
- **Duplicate ids:** the builder now refuses two figures with the same id on the same page.

## Checks

All pass: `check-site`, every CI `--check` builder, the 243 unit tests, the page-weight
budgets, and the browser checks (`check-a11y`, `check-console`). Every lesson figure fits the
lesson card at 320–390px.

## For the author

The points that need a person are in `docs/ochem-needs-author.md`:
- Nobody could read the IUPAC 2013 text itself from this environment, so the preferred-name claims
  rest on reviewer knowledge and secondary sources.
- Classic course conventions against IUPAC 2013. The pages teach the classic ones and show the
  2013 alternative.
- A zigzag but-2-ene drawn before E/Z is taught.
- The ethyl acetate "pear-drop" example.

**Originality:** there is no automated originality check for ochem. Every sentence was written fresh,
and both audit stages read for textbook-like wording. Only one phrase was flagged, and it was
rewritten.
