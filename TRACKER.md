# Review tracker

## Morning summary (self-study pass, 2026-09-16 → 2026-09-22)

Everything below is on `main` (45 commits since the pass began); every push
passed the full CI script (check-site, curriculum, figures, banks, worker,
unit tests, weight, a11y, console).

**What was done.**
- Step 0: `check-console` runs in 56 s instead of 84 and no longer flakes
  (cross-origin requests are aborted at the route; meta-refresh stubs are
  skipped). The 118 concept teach strings moved to `concept-teach.json`; the
  ochem shell went from 108 to 92.8 KB gzipped. The amine-synthesis
  carbon-count sort is two rows per answer.
- Step 1: `docs/concept-map.json` and `docs/proposed-order.md` (a 23-chapter
  Klein/Wade-style order with the reasoning, every lesson that moves, every
  split). **Not applied — needs your approval.**
- Step 2: all 412 hard-coded "Module N" references replaced with chapter
  names linked from `curriculum.js`; lesson eyebrows get their number at
  runtime; check-site rule 30 stops the numbers coming back. Fifteen missing
  `dependsOn` filled. New **Functional groups** section closes Foundations
  (117 topics, 113 lessons, 3,510 questions).
- Step 3: **all 23 chapters reviewed, fixed, independently verified, and
  re-fixed where the verifier found problems.** Every chapter's status,
  counts and open items are in the "Chapter status" table below. In round
  numbers across the course: about 180 generated figures added (curved-arrow
  mechanisms, 3D drawings, the course's first labeled example spectra, the
  first drawn molecules in Biomolecules and Aromatic Follow-Through), about
  60 worked examples, roughly 900 of the 3,510 bank questions replaced or
  repaired, all four substitution/elimination and the acyl-substitution,
  aldol, Claisen and EAS mechanism walkthroughs rebuilt, and about 110
  confirmed chemistry errors fixed (wrong keys, backwards stereochemical
  outcomes, wrong electron counts, mislabeled figures). A new check-site rule
  (31) fails any explanation that names an option by position, since options
  are shuffled per sitting; 19 such references were rewritten. Byte budgets
  for the bank halves and the tutor bank were raised with reasons recorded
  in `check-weight.mjs`, because application stems and worked solutions are
  longer than recall ones.

**Process.** Per chapter: fresh reviewer (anchored findings) → editor →
fresh verifier (full read, every product and key re-derived) → second-pass
editor for the verifier's findings. Verifiers found between 0 and 7
confirmed errors per chapter after the first fix, which is why the second
pass was kept for every chapter. From chapter 6 on, review and fix ran on
Opus 5; chapter 18's fixer finished on Fable 5.1 while Opus was overloaded.

**Decisions you need to make** — see "Decisions for Olivier" below and
`docs/proposed-order.md`. The order is the big one; nothing has been moved.

**Still open (small, listed per chapter in the status table).** Some banks
remain recall-heavy (chapter 12's five, chapter 14's short `why` fields,
chapter 17 thin on data-to-structure items); a handful of figures were
deferred (succinic anhydride/imide, β-lactam, polymer-design disconnection);
`chair-bromocyclohexane` in `molecules.js` is still wrong and unused.
"Waiting on reorder" lists everything that is only wrong because of where a
chapter currently sits.

**Could not verify from here** (kept hedged in the text): the exact E1
product ratio for 2-bromo-2-methylbutane, the Heck regiochemistry beyond
"usually", nylon 6 vs 6,6 melting points, and the Tg table's values (all
labeled as typical, not measured).

Every item raised across four outside reviews, with its real status verified
against this repo rather than against what a review claimed.

Status: **done** · **open** · **not a defect** (verified, no change needed) ·
**needs a person** (cannot be settled from here)

Verified against `main` at the time of writing. Items move to **done** only
when the change is in the repo and the checks pass.

---

## Self-study pass (Step 3 complete; reorder pending)

The pass that makes the course learnable on its own: an approved order, no
idea used before it is taught, every concept explained with its why and how,
a figure wherever a student needs to picture something, and practice that
matches how organic chemistry is examined. Process per chapter: a fresh
reviewer reads every notes page, lesson step, figure and question as a
student who has finished only the earlier chapters; the order-independent
findings are fixed; a second fresh reviewer confirms the chapter meets the
standards and is chemically correct; all checks run; push.

### Decisions for Olivier

- `ochem/assets/molecules.js`: `chair-bromocyclohexane` draws Br axial on an axial-down carbon and marks a non-adjacent carbon as anti-periplanar; chapter 5's only use was removed and no page uses it now. Drop it or rewrite it (the chapter 6 pass rebuilt `chair-dimethylcyclohexane` correctly and can serve as the model).
- Chapter 6 gaps that need a new section rather than an edit: prochirality/diastereotopic protons (needed by H-NMR), and structure images inside bank questions (needs a runtime change to the practice page).

Recorded here as they arise, and collected in `docs/proposed-order.md`.

1. **Approve the proposed order** in `docs/proposed-order.md`, or say which
   moves to drop. Nothing has been moved. The two largest moves: a new
   chapter 7 "How Reactions Happen" (nucleophiles, electrophiles, leaving
   groups, energy diagrams and the Hammond postulate, carbocations, radical
   halogenation), and dissolving Carbonyl & Enolate Breadth into the carbonyl,
   redox and enolate chapters.
2. **Two new lessons and one split-out** the order needs: energy-diagrams,
   carbocations (carved out of sn1), cis-trans-ez (carved out of
   alkene-structure).
3. **Spectroscopy placement**: keep after aromatics (recommended) or move to
   the textbook position after Alcohols & Ethers.
4. ~~HOMO/LUMO~~ — done in chapter 9's pass (a minimal MO section in
   `conjugated-systems`).
5. ~~Oxymercuration–demercuration~~ — done in chapter 8's pass (taught in
   `addition-reactions`).
6. **Chapter 2's title** once nucleophiles and leaving groups move out of it.

### Waiting on reorder

- Chapter 21: five [waiting-on-reorder] prerequisite items in the review; note that moving `baeyer-villiger` into chapter 13 would put it before `esters-amides`, so it should land at the end of that chapter.

- Chapter 20: LDA/enolate, protecting-group, aryl-halide and retrosynthesis references become forward references when Organometallics moves to position 15.

- Chapter 18: Grignard, Michael and Wittig are used as known material throughout; the proposed order puts Organometallics at 15 and dissolves Carbonyl & Enolate Breadth into 11/14, ahead of this chapter.

- Chapter 17: `h-nmr` should split into shift and splitting lessons (proposed order item); diastereotopic protons need the prochirality material chapter 6 lacks.

- Chapter 16: `eas` should split into mechanism and reactions (proposed order item); diazonium and aniline cross-references point at Amines, which the proposed order moves after this chapter.

- Chapter 15: aniline/pyridine/pyrrole basicity and the aromatic half of amine-reactions assume Aromatic Chemistry; the proposed order moves Amines to 18, after Aromatic.

- Chapter 14: references to Grignard/cuprate (Organometallics), Michael and enamine (Carbonyl & Enolate Breadth) and malonic-ester chemistry sit ahead of where those are taught; the proposed order moves Organometallics to 15 and dissolves the breadth chapter into 14.

- Chapter 13: Grignard reagents used as a preparative route (Grignard + CO₂, RMgX on nitriles) before Organometallics; the proposed order moves Organometallics to 15, directly after this chapter.

- Chapter 11: splitting `nucleophilic-addition` and cutting the imine/enamine material (proposed order dissolves Carbonyl & Enolate Breadth into these chapters); mechanism-page draw steps for the acetal sequence need new molecule records.

- Chapter 10: mCPBA epoxidation is taught in `epoxides` and labelled as previewing Oxidation & Reduction; `alcohol-reactions` points forward to that chapter for reagent detail; the tosylate/SOCl₂/PBr₃ activation material is duplicated between chapter 2's `leaving-groups` and this chapter (the proposed split of `leaving-groups` resolves it).

- Chapter 8: catalytic hydrogenation used in three places (heats of hydrogenation, the addition summary table, Lindlar/Na–NH₃) before `hydrogenation` in chapter 12 — labelled as previews for now; splitting `addition-reactions` into carbocation vs bridged-ion additions needs a new curriculum entry.

- Chapter 7: `e1` calls itself the fourth corner of the square and contrasts with E2 six times before E2 is taught (the four-way summary table also lands a section early); the proposed order swaps E1 and E2.

- Chapter 6: R/S descriptors used in `enantiomers`, `diastereomers` and `meso` before `rs-configuration` (proposed order moves it third in the chapter); E/Z notation missing (proposed new `cis-trans-ez` section); `meso` previews the Fischer test before `fischer`.

- Chapter 4: six passages in `notes/bronsted`, `notes/lewis-acids`, `notes/conjugate` and `lessons/lewis-acids` lean on nucleophile/electrophile/leaving-group vocabulary from chapter 2; under the proposed order those topics move after Acids & Bases and the passages become previews. The "Hard and soft, briefly" paragraph in `lewis-acids` loses its reason to exist if chapter 2 moves.
- Chapter 5: Hammond postulate now stated in full in `radical-halogenation` (proposed home: the new energy-diagrams lesson); stereocenter/racemic used in `radical-halogenation` before Stereochemistry; the E2 half of `conformational-analysis` (anti-periplanar, menthyl) is headed "Looking ahead" pending its move to `e2`; the lesson's Markovnikov/peroxide-HBr challenge and bank Q19–Q20 belong to `anti-markovnikov`.

Findings that are wrong only because of where a chapter sits, left alone so
the fix is made once against the approved order. Chapter by chapter, as the
reviews land.

- **Ch 1 Foundations.** `bonding` points at Alkenes & Alkynes for cis/trans;
  the proposed order moves cis/trans and E/Z into Stereochemistry.
- **Ch 3 Nomenclature.** `naming-rings-unsaturation` points at Stereochemistry
  for E/Z; true only under the proposed order (E/Z moves into that chapter).

### Chapter status

| Chapter | Reviewed | Fixed | Verified | Pushed |
|---|---|---|---|---|
| 1 Foundations | yes (48/24/20/32 findings) | yes: 11 figures, 6 graded lesson steps, 131 questions replaced or edited, formal-charge formula and Hund's rule errors fixed | yes: 8 of 10 topics met; 7 confirmed errors (an ibuprofen ester, a keyed 'most electron-poor carbon' that ignored the carboxyl, a 1-18 group-number slip in a teach string, and four wording errors) fixed, plus a missing sigma/pi concept added | yes |
| 2 Organic Structure & Electron Movement | yes (38/24/19/33) | yes: 8 figures (the chapter's first skeletal drawings after lesson 1), 37 questions, 4 lessons re-stepped, 7 chemistry errors (polar-protic/aprotic swap, R3N keyed over RNH2, BF3/BH3, nitrate key, the "most electron-poor" final, an incoherent leaving-group worked example) | yes: 4 of 7 met on first verification; 6 errors (protonated-acetone electron count and arithmetic, benzene contributor count, HCl lone-pair count, ring size in the amino-ketone scan, acetate tautomer name) fixed, four hard bank stems given previews, one ambiguous challenge stem reworded. Open: HBr mechanism figure for leaving-groups (queued with chapter 5's pass) | yes |
| 3 IUPAC Nomenclature | yes (24/9/12/22) | yes: 9 figures, 85 questions rewritten, 3 chemistry errors (3-ethylpentane keyed as 3-methylhexane; ketone carbon called oxidation level 0; an impossible {3,3,5} locant tie) | yes: all four topics meet the standard; five wording errors found and fixed, no wrong key | yes |
| 4 Acids & Bases | yes (38/17/19/22) | yes: 9 figures, 7 worked examples, 2 lesson steps, 2 click-atom items, 91 questions rewritten, 3 chemistry errors (bronsted lesson conjugate roles reversed; pka lesson pKaH vs N–H; acidity-factors Q6 keyed wrong); tutor-bank budget raised to 264 KB | yes: 3 of 5 met on first verification; 6 errors (α C–H pKa of acetic acid, 10^−0.3 rounding, 4-chlorobutanoic baseline, "diagonal" pairing, two broken bank stems) and the teach-string contradiction fixed in a second pass; funnel figure redrawn with ether on top. Open: ~6 near-duplicate bank pairs | yes |
| 5 Alkanes & Conformations | yes (34/17/16/15) | yes: 7 figures (both lesson chairs redrawn as real six-membered rings; ring-flip animation keeps the methyl's face), 48 questions replaced, 10 keys/explanations corrected, worked examples for structure→Newman, flipped chair, 1,2/1,3 chair procedure, halogenation ratios; plus the leaving-groups HBr mechanism figure from chapter 2's verifier. Open: `molecules.js` chair-bromocyclohexane and chair-dimethylcyclohexane drawings were wrong (chair-bromocyclohexane still is; see Decisions) | yes: 4 of 6 met on first verification; 5 errors (unconstructible cis-1,3 chair example and its bank twin, unflipped "other chair" figure, 2 vs 5 kcal/mol radical gap, a two-answer question) all fixed in a second pass | yes |
| 6 Stereochemistry | yes (31/14/18/27) | yes: 12 figures, 41 questions, 21 notes and 6 lesson edits; reversed Br₂ result in meso (trans → meso, cis → racemate), "diastereomers need two stereocenters", inverted fischer-reading teach string, tartaric figure's missing mirror plane, N inversion rate 10⁶ → 10¹¹ s⁻¹, six two-answer questions; molecules.js chair-dimethylcyclohexane rebuilt as cis and meso-tartaric-acid given stereo bonds | yes: 5 of 7 met on first verification; every R/S label, Fischer projection and Br₂ outcome re-derived and correct; 4 errors (fischer Q13 bow direction, 3-methylcyclohexanol ring-walk count in prose/figure/bank, BINOL twist attributed to the OH groups, diastereomers Q12 ignores pseudoasymmetry) all fixed in a second pass | yes |
| 7 Substitution & Elimination | yes | yes: all four mechanism pages rebuilt (SN2 impossible-elimination distractor and duplicate molecule; SN1 on a real stereocenter with the oxonium/deprotonation steps and a rearrangement; E1 base drawn with both arrows and a rearrangement step; E2 gained a rotatable Newman step, its flat scene had β-H and Br syn); 6 figures; 26 questions replaced or re-keyed incl. 3 wrong keys (neopentyl, thermodynamic control, vinyl/aryl hybridization) | yes: 4 of 5 met on first verification; every drawn stereocenter, the p orbital, the E2 Newman and both rearrangements confirmed; 4 errors (sn1 methyl-shift reasoning, e2 figure alt calls gauche "syn-periplanar", substrate-effects Q10 key, e1 Q26 Hammond) all fixed in a second pass; sn2/sn1 steps now render the scenes they ask about | yes |
| 8 Alkenes & Alkynes | yes (21/11/14/20) | yes: 9 figures, 34 questions replaced and 5 fixed, 5 new diagnostic concepts; cis/trans-2-butene + Br₂ outcomes were backwards, alkyne hydration lesson gave an aldehyde, peroxide effect for HCl/HI wrong in notes and bank; oxymercuration, halohydrin regiochemistry, alkyne synthesis, HX/X₂ on alkynes, Na/NH₃ steps, Bredt's rule now taught | yes: 4 of 4 met on first verification; every regio/stereo outcome re-derived and confirmed; 3 minor errors ("concerted" bromination in the addition mechanism page, E/Z condition in Q13, hydroboration "sterics alone" in lesson and Q16) fixed with chapter 9's pass | yes |
| 9 Conjugation & Pericyclic | yes (24/12/15/20) | yes: 6 figures, 7 worked examples, 49 questions; minimal MO section (HOMO/LUMO) so Diels–Alder and UV-Vis no longer use them cold; Diels–Alder regiochemistry and Lewis-acid catalysis added; Zaitsev/Hofmann misstatement and alkyne-dienophile product fixed; Woodward–Fieser table; practice-bank-core budget 216→220 KB | yes: 4 of 5 met on first verification; every product, ratio and quoted number confirmed; 3 figure/number errors (Woodward–Fieser +30 vs the measured +41, n→π* at 320 vs 280 nm, ψ₄ level with π*) fixed and 4 figures added (allyl orbitals, DA regiochemistry, norbornene endo/retro cut, bromonium on butadiene) in a second pass | yes |
| 10 Alcohols, Ethers & Related | yes (21/12/13/12) | yes: 5 figures (E1 dehydration, HBr methyl shift vs PBr₃, ether cleavage SN2/SN1, epoxide anti opening, acid/base switch), 19 questions replaced and 6 corrected; the OH₂⁺ "conjugate base of H₃O⁺" lesson error fixed; SOCl₂/PBr₃/POCl₃ mechanisms, crown ethers, peroxide radical, mCPBA taught; graded arrow-drawing step added | yes: 2 of 3 met on first verification; every product, stereochemical outcome, bank key and figure confirmed; 1 error (rearranged-dehydration sentence) fixed; mCPBA, SOCl₂/PBr₃ and crown-ether figures and the crown-cavity wording added with chapter 11's pass | yes |
| 11 Carbonyl Chemistry | yes (24/21/17/20) | yes: 4 figures (acid-catalysed addition, hydride vs Grignard, seven-step acetal mechanism, cyanohydrin fan-out), 3 worked examples, 28 questions; acetone hydrate 0.1 %, formaldehyde K ≈ 2000 unified, three miskeyed/wrong-why items; Bürgi–Dunitz, workup steps, ester adds twice, HCN + catalytic cyanide, KMnO₄/Jones/Ag₂O, autoxidation now taught | yes: 3 of 5 met on first verification; all 150 keys, the hydrate K values and every acetal step's protonation site confirmed; 4 errors (autoxidation of α-H-free aldehydes, missing π→O arrows in two acetal panels, caption/panel charge mismatch, swapped oxocarbenium labels) all fixed in a second pass | yes |
| 14 Enolate Chemistry | yes (26/9/11/17, anchored) | yes: 8 figures, 7 worked examples, 19 questions replaced and 5 corrected; butan-2-one drawn as acetone in a lesson SVG, methyl acetate/ethoxide mismatch in the Claisen walkthrough, enamine contradiction, NaH teach string fixed; aldol walkthrough finished with a bond-forming arrow and a dehydration step; E1cb, acid-catalysed aldol, racemization, deuterium exchange, O- vs C-alkylation taught | yes: 2 of 5 met on first verification; all pKa values, products, ring sizes and halogenation regiochemistry confirmed; 5 errors (aldol Q19 β-carbocation, regiochemistry Q30 two answers, claisen Q27 same compound twice, dienolate numbering, O⁻ lone pairs in four SVGs) all fixed in a second pass; Claisen walkthrough draws the C–C bond; acid-catalysed aldol, ring-size, Dieckmann and 1,2-vs-1,4 figures added. Open: 52 one-line `why` fields in this chapter's banks | yes |
| 15 Amines | yes (26/8/7/14, anchored) | yes: 8 figures (delocalization, N inversion, acylation, imine formation, Gabriel, Hofmann rearrangement, E2 + Newman, cyclic degradation), 4 worked examples, 17 questions; pyridine nucleophilicity, "a secondary amine cannot condense again", CH₃I replacing N–H (four places), amide pKaH, an R₃N label and a pyrrole-above-amide ranking fixed | yes: 4 of 4 met on first verification; every pKaH, product, carbon count and all 120 keys confirmed; 3 minor figure-text items (alkylation figure's "more nucleophilic", resonance caption, an arrow head on C3) fixed with chapter 16's pass | yes |
| 16 Aromatic Chemistry | yes (18/7/8/14, anchored) | yes: 6 figures (Frost circles, pyrrole/pyridine lone pairs, EAS energy profile, three arenium contributors, five EAS reactions, donor octet), 17 questions; arenium "five carbons" and the meta "on or adjacent" argument fixed; drawn deprotonation step added to the EAS walkthrough (new arenium molecule); reviewer's 3-nitroacetophenone key corrected to acylate-first | yes: 1 of 3 met on first verification; every Hückel count and lone-pair call confirmed; 4 errors (EAS lead figure's ring-attack arrow drawn backwards and a C–H/C–Nu slip, nitrobenzene relative rate, aniline nitration "mainly meta") and two walkthrough defects (bromination steps then "OCH₃", step-1 arrow target) all fixed in a second pass; counter-ion base and oxidative iodination now taught | yes |
| 18 Synthesis & Retrosynthesis | yes (anchored) | yes: 5 figures (the ten disconnections drawn once, two masks, four-step route, move-the-group-along), 14 questions replaced; reviewer's hexan-3-one carbon count and a meso/racemic key corrected; Grignard panel had OH and CH₃ on adjacent carbons; nitro-reduction reagents added; `protection` concept added | yes: 4 of 5 met on first verification; every route, carbon count, disconnection and all 150 keys confirmed; 4 errors ("no direct anti-Markovnikov halide" ignores HBr/ROOR, Friedel–Crafts acylation listed as carbonyl-free, δ+ on the wrong carbon in a figure, alkyne → methyl ketone unqualified) all fixed in a second pass; five definition items in the retrosynthesis bank replaced with reasoning items | yes |
| 17 Spectroscopy | yes (17/4/7/12, anchored; no labeled example spectrum existed) | yes: 5 generated spectra with real values (butanoic acid IR, ethyl acetate ¹H with integration and J, splitting trees, butan-2-one ¹³C + DEPT, 2-butanone and bromoethane MS); aldehyde doublet 2820, 2-butanone base peak 43, bromine M/M+2 at 94/96, self-contradicting nitrile key fixed; anisotropy, n+1 precondition, diastereotopic protons, McLafferty, isotope arithmetic added; 8 questions, 11 lesson answer tells removed | yes: 2 of 4 met on first verification; every drawn spectral value back-solved from the SVGs and confirmed; 6 errors (Bent's rule inverted, acid O–H range in a lesson caption, ¹³C amide/ester order key, alkyne band descriptor, acid-chloride window claim, a wrong-formula distractor) all fixed in a second pass; multiplet heights made Pascal ratios. Open: the banks are still thin on data-to-structure items | yes |
| 13 Carboxylic Acids & Derivatives | yes (26/8/11/13, anchored) | yes: 8 figures (acid dimer, DMF resonance/rotation, five-panel Fischer esterification, saponification, chlorosulfite, aspirin acetylation, nitrile imine anion), 12 questions replaced and 17 edited, 12 lesson MCQs rebalanced; diacid pKa, β-keto decarboxylation, lactones/lactams, transesterification, amide O-protonation, ¹⁸O labeling now taught; mechanism walkthrough gains acid-catalysed steps. Open: succinic anhydride/imide figure, cyanide SN2 panel | yes: 2 of 5 met on first verification; every number, mechanism arrow, ¹⁸O outcome and 149/150 keys confirmed; 5 errors (IR ladder attributes the acid's 1710 to resonance rather than dimerisation, methoxide-on-methyl-acetate walkthrough has no net change, nitriles Q8 two answers, pyridine "poorly nucleophilic", 179-vs-85 kcal/mol double count) all fixed in a second pass; walkthrough now runs methoxide on acetyl chloride; β-keto decarboxylation figure and ¹⁸O item added. Open: succinic anhydride/imide and β-lactam figures | yes |
| 19 Biomolecules | yes (20/3/10/12, anchored; no molecule was drawn anywhere in the chapter) | yes: 9 figures added and the lipid packing figure redrawn (Fischer↔Haworth glucose, alanine charge states, L vs D, dipeptide formation, α-helix vs β-sheet, phospholipid, micelle vs bilayer, A–T and G–C atom by atom, a full nucleotide); Haworth defined; monosaccharide reactions, pI worked examples, Boc/Fmoc/DCC/Merrifield, Edman, steroid numbering, ATP, Chargaff added; ketose/Tollens' contradiction resolved; 20 questions | yes: 2 of 5 met on first verification; every drawn structure, pI, D/L call and all 150 keys confirmed; 4 errors (CORN mnemonic inverted, "other three" stereocenters, straight alkenes in the two lipid figures) fixed with chapter 20's pass | yes |
| 20 Organometallics | yes (19/7/9/9, anchored) | yes: 7 curved-arrow/structure figures, 5 worked examples, 10 questions; nitrile "one-carbon extension" fixed in four places incl. the keyed bank item; β-hydride elimination, migratory insertion, Heck base, Sonogashira amine base, Li–halogen exchange, Corey–House, Weinreb amide, Negishi now taught; amine pKa unified at 38 | yes: 5 of 5 met on first verification; zero chemistry errors; every product, carbon count, Pd oxidation state and all 150 keys confirmed. Minor: "two things" over three bullets, "three abilities" then four, bonding bank recall-heavy — all fixed with chapter 22's pass | yes |
| 21 Carbonyl & Enolate Breadth | yes (26/7/7/9, anchored) | yes: 5 curved-arrow mechanism figures (Wittig, imine/enamine, Robinson, decarboxylation TS, Criegee), 5 worked examples, 28 questions; H added to migratory aptitude (aldehyde → acid) and reconciled across four files; enamine "alkylates once" corrected to the iminium reason; "three- and four-membered" closure error fixed in three files; two broken bank items repaired; HWE, semi-stabilised ylides, Stork scope, Michael donor/acceptor table, malonate ring formation added | yes: 2 of 5 met on first verification; every product, E/Z call and the aptitude series confirmed; 4 errors (Wittig example aldehyde one carbon too long, oxaphosphetane "opposite corners", Robinson panel draws 1,4 but labels 1,5, decarboxylation arrows run the wrong way) and one two-answer item all fixed in a second pass | yes |
| 22 Aromatic Follow-Through | yes (34/4/8/9, anchored; no molecule was drawn) | yes: 6 figures (Meisenheimer, benzyne orbitals, benzylic delocalization, phenoxide resonance, Birch products, diazotize-and-couple), a worked example and pitfall in every section, 25 questions; nitro→amine reduction taught; Birch enol-ether key corrected to cyclohex-3-en-1-one; sulfonic-acid blocking, quinone colour, allyl count, "next section" fixed; Kolbe–Schmitt, Reimer–Tiemann, diazotization mechanism, azo pH, Sandmeyer radical, benzyne regiochemistry added | yes: 3 of 5 met on first verification; every product, pKa and key confirmed; 4 errors (Meisenheimer frame with a net 2−, "four π electrons" for the cyclohexadienyl anion, Birch "anion" for the radical, benzyne lesson claiming two products from chlorobenzene) fixed with chapter 23's pass | yes |
| 23 Polymers | yes (33/6/8/8, anchored) | yes: 6 figures (six-panel fishhook radical chain, monomer→repeat unit, drawn chain, three polypropylenes, four backbones, cross-link dial, Tg/Tm as modulus vs temperature), 4 worked examples, 15 questions; termination corrected (combination vs disproportionation); nylon 6, polycarbonate, "which loses what" table, plasticizers, Ziegler–Natta insertion, living polymerization, PET methanolysis, PLA added; both "every condensation loses water" claims fixed. Open: polymer-design disconnection figure | yes: 1 of 5 met on first verification; every repeat unit, the "which loses what" table, tacticity, Tg/Tm values and all 150 keys confirmed; 7 errors (isoprene C4 delocalisation, a missing H in the disproportionation product, atactic-PS reason, butyl rubber, nylon 6,T melt claim, glyptal, copolymer Tg) all fixed in a second pass, plus ionic chain-end, urethane and polycarbonate figures | yes |
| 12 Oxidation & Reduction | yes (18/4/8/13, anchored format) | yes: 6 figures (the chapter's first curved arrows), 22 questions, wrong +2 key for an acid carbon, Na/NH3 selectivity attributed to the wrong intermediate | yes: 2 of 5 met on first verification; 5 errors and 2 missing figures (ozonolysis mechanism, Clemmensen/Wolff-Kishner) fixed in a second pass. Open: the five banks are still recall-heavy | yes |

---

## Pending chemistry review

The same gap the clinical table below describes, for the other course. Phase 9
added roughly 19,000 words of chemistry prose, 21 lessons and 780 questions
across five chapters, and **no chemist has read any of it**. Nothing here is a
guess — each entry follows standard undergraduate organic chemistry — but the
numerical claims in particular are the kind a reviewer should check against a
textbook rather than take on trust.

Listed because the rule for this repo is to record what cannot be verified from
here rather than to assert it quietly.

| Claim | Where | Why it needs checking |
|---|---|---|
| Heat of hydrogenation: but-1-ene ≈ 127 kJ/mol, buta-1,3-diene ≈ 239, difference ≈ 15 as the delocalization energy | `conjugated-systems` | Quoted figures; textbooks vary slightly and some quote kcal |
| C2–C3 bond of buta-1,3-diene ≈ 1.47 Å against 1.54 and 1.34 | `conjugated-systems` | Quoted bond lengths |
| HBr + buta-1,3-diene: ~80:20 favoring 1,2 at −80 °C, ~15:85 favoring 1,4 at 40 °C | `diene-addition` | The exact ratios and temperatures vary between sources |
| λmax: ethene 171 nm, butadiene 217, hexatriene 258, β-carotene ~450 with 11 conjugated C=C | `uv-vis` | Quoted spectroscopic values |
| Radical halogenation selectivity per hydrogen: Br₂ 3°:2°:1° ≈ 1600:80:1, Cl₂ ≈ 5:4:1 | `radical-halogenation` | Widely quoted but source-dependent |
| Molar absorptivity of a conjugated system "often 10,000 or more" | `uv-vis` | An order-of-magnitude claim |
| Oxidation states: acid/ester/amide/nitrile carbons all at +3; aldehyde +1, ketone 0 | `oxidation-states`, `naming-functional-groups` | Arithmetic is checkable but the pedagogical framing is mine |
| That 2-methylpropane gives ~99% tertiary bromide with Br₂ but more primary than tertiary product with Cl₂ | `radical-halogenation` lesson | A worked consequence of the selectivity figures above |
| Reagent scope tables (what NaBH₄/LiAlH₄/H₂-Pd each reduce; which oxidant stops where) | `carbonyl-reduction`, `hydrogenation`, `alcohol-oxidation` | Standard, but the "essentially untouched" boundaries are judgment calls |
| That a Friedel–Crafts acylation cannot deliver a plain CHO because formyl chloride is too unstable | `carbon-carbon-bonds` | Correct as far as I know; Gattermann–Koch is the workaround and is not mentioned |
| Every worked example's product and name | all five chapters | Each was checked by hand or by a short script; none has been checked by a chemist |

**Errors already found and fixed during this phase**, recorded so the rate is
visible rather than implied: a symmetric allylic cation used as a 1,2/1,4
example that gives only one product; a claim that the top four priority groups
are ranked by oxidation level when all four sit at +3; an alkene/alcohol naming
contrast whose "wrong" answer was a different molecule; a benzaldehyde step
that is not a clean intro-level reaction; and a yield question whose stem
asserted something its own answer contradicted. Five caught in four chapters is
not a reassuring rate for a body of work this size.

## Chemistry review log

Every unit from Biomolecules onward is read by a fresh reviewer that has not
seen the author's notes or reasoning. This is the record of what each pass
found, kept whether or not the finding was accepted, so the disagreement rate
stays visible rather than implied.

### Unit 5 — Biomolecules

Eleven findings, all accepted, all fixed before the unit shipped.

**Confident errors (4).**

| Finding | Where | Resolution |
|---|---|---|
| "the other nineteen L amino acids are S" — glycine is achiral and has no descriptor, and the same page says so two paragraphs earlier | `notes/amino-acids` | Corrected to eighteen chiral ones, with glycine named as having no configuration |
| "testosterone and estradiol … differing by an A ring that has been aromatized" reads as though both are aromatic; only estradiol is, and it contradicted the unit's own question #23 | `lessons/lipids` | Rewritten to say estradiol is testosterone with its A ring aromatized, which turns that ring's ketone into a phenol |
| "an OH four or five carbons down the chain … a pyranose or a furanose" — off by one both ways: C5 (four down) gives the pyranose, C4 (three down) the furanose, and five down would be a seven-membered ring | `concepts.js`, `sugar-ring` | Corrected to three or four, with C4 and C5 named explicitly |
| The option keyed for "What are anomers?" read "Isomers differing at one carbon", which is the definition of an **epimer** — and the same set defines epimers that way six questions later | `practice-bank`, `carbohydrates` | Key changed to "Epimers at the anomeric carbon" |

**Weaker claims (7), all also accepted.** Chargaff's rule stated for "any DNA
sample" rather than any double-stranded DNA; cholesterol described as
stiffening a membrane when it buffers fluidity in both directions; 6 M HCl
hydrolysis described as returning the composition, when it destroys tryptophan
and deamidates Asn and Gln; "the only level that is covalent" sitting against
the same bank's correct claim that the disulfide is covalent; an enolate called
an enediol, conflating the anion with its neutral tautomer; the N-glycoside's
acid lability stated flatly when purines depurinate far faster than
pyrimidines; and a question that marked 5′ the only place a nucleotide's
phosphate can sit, when 3′-monophosphates are nucleotides too — that one was
reworded to ask what a polymerase adds, which is unambiguously 5′.

**Not a disagreement, but worth recording:** the reviewer independently
verified every numerical claim in the unit — the two pI calculations, the four
C18 melting points, the bond lengths, the anomeric equilibrium ratio, the
hydrogen-bond counts — and found all of them correct. The errors were in prose
and in one keyed option, not in the arithmetic.

### Unit 6 — Organometallics

Fifteen findings, all accepted. Eight were outright errors.

| Finding | Where | Resolution |
|---|---|---|
| CH₃MgBr + propanone named as 2-methylbutan-2-ol | `lessons/grignard-reagents` | It is **2-methylpropan-2-ol** — C4, not C5. The C5 name belongs to the ester row directly below it, so the two had been crossed |
| "cis-hex-3-ene from propyne and a two-carbon electrophile" | `lessons/organolithium-reagents` | Propyne is C3 and ethyl is C2, so the product is **pent-2-yne** and the target cis-pent-2-ene. The carbon count was impossible as written |
| An acyl chloride adding twice "for the same reason" as an ester | notes, lesson and bank, three places | **Backwards.** An acyl chloride is the *most* electrophilic acyl derivative, comfortably more so than the ketone it gives. The ester argument does not transfer; the ketone is simply still reactive enough to be attacked as fast as it forms |
| "What is a magnesium alkoxide the product of?" | `practice-bank`, `organometallic-bonding` | A Grignard adding to a ketone gives one too, so the item had **two correct answers**. Reworded to ask which route gives one without forming a C–C bond |
| A dianion "too unstable to collapse. It simply sits there" | notes, lesson and bank | Self-contradictory, and inverted. It is *persistent*: collapsing would mean expelling O²⁻ and adding a third charge. The figure caption had it right and the prose did not |
| Convergence "nearly double, for the same number of reactions" | `lessons/cross-coupling` | 5 + 5 + 1 is **eleven** reactions against ten. The arithmetic was right and the claim attached to it was not |
| "Nothing else in this course recovers its own starting material" | `lessons/cross-coupling` | Plainly false — every acid- and base-catalyzed mechanism does. Narrowed to the first transition-metal cycle, and the first catalyst that holds both partners |
| "benzene → phenylmagnesium bromide" in a stem whose own first sentence says bromobenzene | `lessons/grignard-reagents` | Benzene does not react with magnesium. Corrected to bromobenzene |

**Seven qualified findings, all also accepted.** An epoxide stated flatly as a
two-carbon extension, which is true of ethylene oxide only; "temperature and
solvent do not move this selectivity", when catalytic copper added to a
Grignard switches it to 1,4; *t*-BuLi called poorly nucleophilic, when it is a
fine nucleophile and the standard reagent for lithium–halogen exchange; aryl
Grignards described as forming from aryl halides generally, when chlorides are
sluggish and fluorides do not go at all; an sp carbon called "least
electron-rich", which reads as the opposite of the argument it was supporting;
an acetylide contrasted with "a Grignard", when acetylides are often magnesium
salts themselves — the real contrast is sp against sp³; and a figure labeled
"tetrahedral intermediate" that drew only **three** substituents on the central
carbon, the missing one being the R the organolithium had just delivered.

**One accessibility regression, caught by the browser pass and not by the
review:** `opacity:.6` on the electronegativity values in the interactive step
dropped them below the 4.5:1 contrast threshold. Replaced with the `--muted`
token, which is what it should have been.

### The 19 backfilled figures

Three confident errors and five qualified ones, all accepted.

| Finding | Where | Resolution |
|---|---|---|
| "the surviving π bond, C2 to C3" | `da-bond-accounting` | C2–C3 is **single** in the diene; that π bond is new. The figure's own note said so, so the label contradicted it |
| Acid chloride, ester **and amide** all said to have something to expel | `hydride-once-twice` | An amide does not fit: R₂N⁻ is no leaving group, so it expels its *oxygen* and ends as an amine. Split out |
| "There is no reagent pair that joins a carbon to a hydroxide" | `three-disconnections` | False — hydration, hydroboration and an S<sub>N</sub>2 all make that bond. The defensible point is that a C–OH cut is an interconversion rather than a way of joining two pieces |
| Trans selectivity attributed to "the vinyl radical in the middle" | `alkyne-three-ways` | The geometry is fixed at the configurationally stable **vinyl anion**; the radical inverts far too fast to decide anything |
| Lindlar given as "Pd/CaCO₃, quinoline" | `alkyne-three-ways` | Lead as well, which the section's own prose says |
| A silyl ether shown as untouched by dilute warm acid | `orthogonal-grid` | True of TBS as a simplification, not as a fact; the note already contrasted TMS and now carries the qualifier |
| Cyanide's product given as "alcohol, or nitrile" | `carbonyl-three-sites` | A cyanohydrin is an alcohol **and** a nitrile on the same carbon, not one or the other |

**The check that should have caught the rendering problems did not exist.** The
NREMT figure test measures estimated text extent; the ochem one read anchor
points only, so a label centered two characters inside the canvas — half of it
outside — passed. That gap is now closed: the ochem test measures rects,
circles and text the same way, with the same note about CSS font-size beating
the presentation attribute.

**Fourteen rendering defects, all fixed.** A screenshot pass at 1280 and 390
px found clipped labels in twelve figures, an arrow drawn straight through two
captions, percentage labels spilling onto the neighboring bar, and a branch
drawn so it read as a closed ring. All fourteen were fixed by moving, resizing
or wrapping — no figure's wording changed meaning, and the one abbreviation
made ("liquid NH₃" to "NH₃(l)") says the same thing. Verified afterwards by
measuring every `<text>` with `getBBox()` in the page: no text in any figure
now ends past 90% of the canvas width.

Two things the fix pass flagged rather than changed, both since addressed: the
oxidation ladder's family list sat beside a column headed "ox. state" showing
+2, which invites reading +2 as those families' state generally — the header
now says whose state it is, as the note already did — and `diene-capture`
numbers the cation C1–C4 while naming its products from their own chains, so
the two numberings run opposite ways. Both are correct; the figure now says so.

**A site-wide rendering property, recorded rather than changed.** Every figure
declares `min-width: --vb × 0.92` inside a ~672 px reading column, so all 37
scroll horizontally and roughly the rightmost 8% of the canvas is off-screen
until the reader scrolls. The pre-existing figures do this too — 28 of 37 place
text past 92% — so it is the house pattern rather than a regression. What was
fixed is the placement of *load-bearing* content inside that strip, most
sharply in `order-sets-pattern`, where both product names — the entire answer
of the figure — sat in the hidden band.

### Unit 7 — Carbonyl & Enolate Breadth

Fourteen findings. Ten confident errors, all accepted; the first had already
been caught and fixed during authoring, which the reviewer confirmed
independently.

| Finding | Where | Resolution |
|---|---|---|
| A Wittig disconnection said to need a **tertiary** halide | `lessons/wittig-reaction` | It needs a **secondary** one. Caught during authoring and rebuilt around a target where the two routes really differ as primary against secondary |
| "Every alkene so far came from an elimination" | notes and lesson | False, and it contradicts this course's own alkyne chapter: Lindlar and Na/NH₃ make alkenes by **reduction**, and that pair is taught as the way to set geometry |
| Ph₃P=O's bond called "one of the strongest **single** bonds" | notes, lesson, concept, bank — four places | It is a P=O **double** bond, about 130–140 kcal/mol |
| "A primary amine brings two hydrogens and **uses none** in the addition, so one is left" | `lessons/imines-enamines` | Two minus none is two. It spends one reaching the cation, which is exactly what leaves one |
| "A secondary amine brings one, and **that one is on the nitrogen** of the cation. Losing it would undo the reaction" | `lessons/imines-enamines` | Wrong twice: the iminium from a secondary amine has **no** N–H at all, and the α proton is taken because nothing else is available, not for the stated reason |
| "Count the hydrogens, **subtract none** for the addition" | figure note and lesson | Gives the wrong answer if followed. Subtract **one** — two becomes one, one becomes none, which is the whole split |
| "Water is a product of **every step** of the sequence" | `lessons/imines-enamines` | It comes off in one step. The correct statement is that every step is an equilibrium and water is the by-product overall |
| Pinacolone said to be out of reach because it "needs a **tertiary halide**" | `lessons/ester-syntheses` | Out of reach, but for a different reason: its α carbon carries three methyls and no hydrogen, so it would need **three** alkylations of a CH₂ that has only two acidic hydrogens |
| The malonic intermediate called a **β-keto acid** | notes, concept, lesson, bank | Only the acetoacetic route passes through one. The malonic route gives a substituted **malonic acid**. Same six-membered transition state, different name |
| A bare cyclohexene drawn and labeled **1-methylcyclohexene** | `zaitsev-vs-wittig` | The missing methyl is the substituent the whole Zaitsev argument is about. Now drawn |

**Four qualified findings, all also accepted.** The "why six?" argument for a
Robinson annulation was muddled — the two carbonyl *carbons* are not what join,
so the ring is counted from the α′ carbon to the far carbonyl, and the
competing closures are three- and four-membered rather than "anything larger".
The final challenge's target implied an **isobutyraldehyde** donor two steps
after the lesson insists donors are doubly stabilized, so the question now asks
for the order of the three reverse moves and names the Wieland–Miescher case,
which really does come from a 1,3-diketone. Aryl was missing from the migratory
aptitude list in the notes, and the "same ranking as carbocation stability"
shortcut fails precisely for aryl — a phenyl cation is badly unstable, yet aryl
migrates well, because the transition state is bridged. And two absolutes were
softened to "in every case you will meet".

**The browser pass found a design flaw the chemistry review did not.** Every
case in the Baeyer–Villiger sort step had the same answer, so clicking one
button four times scored 100% without ranking anything. The options now name a
**side** rather than a group and the methyl sits left twice and right twice, so
the position cannot be used as a shortcut.

### Unit 8 — Aromatic Follow-Through

Eleven findings. Four confident, seven qualified, all accepted and fixed.

**Confident errors (4).**

| Claim as written | Where | Why it is wrong |
| --- | --- | --- |
| Picric acid: "**Two of the three** are ortho or para, so they take the charge by resonance onto six oxygens" — and it was the *keyed* option | `lessons/phenols`, final challenge | All **three** nitro groups in 2,4,6-trinitrophenol are resonance-capable; 2 and 6 are ortho, 4 is para. The option also contradicted itself, since "six oxygens" is three NO₂ groups, and the `correctFeedback` directly below it said "all three" |
| Na/NH₃ alkyne reduction and Birch "both give the **less-stable-looking** product" | bank, `birch-reduction` | Na/NH₃ gives the **trans** alkene, which is the *more* stable isomer. It is Lindlar's cis product that is less stable. The parallel that actually holds is the e⁻, H⁺, e⁻, H⁺ pattern |
| "A meta nitro group does **nothing at all**" | notes, lesson, figure note and concept — four places | It withdraws inductively and measurably accelerates SNAr; it is resonance stabilization it cannot supply. The lesson's own step-5 feedback said this correctly, so the unit contradicted itself |
| Diazonium hub: legend counted "**four** of these seven" groups EAS cannot install, but five spokes were drawn green | `build-ochem-figures` | Ar–H was flagged with the others. Removing a substituent is not the same idea as installing one EAS cannot reach |

**Seven qualified findings, all also accepted.** Mild hydrolysis of
1-methoxycyclohexa-1,4-diene gives the **β,γ**-unsaturated ketone, not the
conjugated enone, so the forward link to Robinson chemistry needed the
isomerization step named — a β,γ-ketone is not a Michael acceptor. Picric acid
at pKa 0.4 is not reliably "more acidic than trifluoroacetic acid", whose
quoted values overlap it; the comparison is now to carboxylic acids generally.
An NH₂ group cannot act as a **para blocker**, because it directs rather than
merely occupying — that trick belongs to reversible sulfonation alone. The
"what does a diazonium salt decompose to if warmed" item was ambiguous against
the phenol synthesis taught in the same section, and now asks for the
intermediate. The allylic-three-against-benzylic-four comparison mixed two
conventions (π-system size against charge-bearing positions) and now counts the
same thing both times. Direct iodination of benzene is possible with an
oxidant, so "EAS cannot install iodine" was softened. And the Ar–H row in the
hub map was given its own category rather than sharing the "unreachable" color.

### Unit 9 — Polymers

Eighteen findings. Eight confident, ten qualified, all accepted and fixed.

**Confident errors (8).**

| Claim as written | Where | Why it is wrong |
| --- | --- | --- |
| "LDPE: **amorphous**, less dense, floppy" | figure, notes, lesson sort step | LDPE is about half crystalline (density 0.910–0.925, Tm ≈ 110 °C). Branching *lowers* crystallinity; it does not abolish it, and a genuinely amorphous polyethylene would have no melting point and make no film |
| "Nylon 6,6 comes from **adipic acid (six carbons) and hexamethylenediamine**… the two numbers count the carbons in each monomer" | notes, lesson, concept, bank | The order is backwards. In nylon *X,Y* the first number is the **diamine**, the second the **diacid**. 6,6 hides it; nylon 6,10 is hexamethylenediamine with ten-carbon sebacic acid, and the rule as taught gives the wrong answer |
| "Add the monomer formulas, subtract the repeat unit, and the difference should be **water**" | notes, lesson, bank | A diacid-plus-diol repeat unit contains **two** ester bonds, so two waters. PET: 166 + 62 − 192 = 36 = 2 H₂O. A student applying the stated check to PET would reject a correct disconnection |
| "Cut **every C–O bond** of the ester" | notes, lesson, bank (two items) | An ester has two C–O single bonds. Cutting both strips the oxygen out of the alcohol fragment and no diol can be recovered. Only the **acyl** C–O is cut, with the oxygen staying on the alcohol side |
| "Radical… this is how **most polyethylene** and polystyrene are made" | `notes/polymer-basics` | Only LDPE is made that way. HDPE and LLDPE, together the clear majority of world production, come from coordination catalysts — which the unit's own next section says |
| "Above T<sub>g</sub>… the material **is rubbery**", stated without qualification | notes, lesson, figure | True only for a largely amorphous, uncrosslinked polymer. HDPE, PET and nylon are all far above their T<sub>g</sub> at room temperature and stay rigid, because crystallites act as physical cross-links up to T<sub>m</sub>. As written the unit called HDPE rigid in one section and rubbery in another |
| "Same formula as the monomer ⇒ **addition**", keyed with "Either is possible" marked wrong | notes, lesson, concept, bank | Ring-opening loses nothing either: caprolactam → nylon 6 is formula-identical and gives a **polyamide**. Caprolactam is a distractor in this same bank, so the counterexample was already in front of the student. The claim is now scoped to alkene monomers |
| Polystyrene amorphous because **phenyl is bulky** | notes table, lesson, two bank items | Ordinary polystyrene is amorphous because radical growth makes it **atactic**. Syndiotactic polystyrene has the same phenyl group and is crystalline, melting near 270 °C. Bulk raises T<sub>g</sub> and slows crystallization; it does not forbid packing |

**Ten qualified findings, all also accepted.** "Every polymer has a T<sub>g</sub>"
rested on a second absolute that fails in the limit and is now "essentially
every". Kevlar keyed as a **thermoplastic** contradicted the unit's own
definition of one ("can be melted and remolded") — Kevlar has no melt, decomposing
near 500 °C, so the answer is now "not a network; its chains are separate".
"Polyethylene cannot be chemically recycled" is true of hydrolysis but not of
pyrolysis, which cracks it back to feedstock at commercial scale. "Nylon
outlasts polyester" was a blanket ranking over two materials that fail under
*different* conditions: nylon is the one acid, chlorine and sunlight attack.
The "it varies with temperature" distractor on radical tacticity is genuinely
defensible — radical PMMA is syndiotactic-rich at low temperature — and was
replaced. Backbone carbons were called **stereocenters**, which they are not in
the CIP sense, and the claim was false outright for the polyethylene and PTFE
listed in the same section. The reactive-site count needed scoping to one
functional group (step-growth) or one C=C (chain growth), since butadiene has
two C=C and gives a linear chain while divinylbenzene is the cross-linker. "PET
is the most recycled plastic **because** its esters can be hydrolyzed" asserts a
causal link the collection-and-mechanical-reprocessing numbers do not support.
PLA in seawater degrades not "slowly" but negligibly, which strengthens the
point the section is making. And polycarbonate's rigidity was credited to bulky
**side** groups, when it has essentially none — the rigidity is in its
bisphenol A backbone.

**What the browser pass caught that the chemistry review did not.** The
`polymer-properties` sort step offered only two options across four rows, so a
coin flip scored well. It now runs three options over five rows, the extra row
being polystyrene as "amorphous, but rigid" — which is also the case that breaks
the assumption that amorphous means soft.

## Pending clinical review

Everything in this section is a clinical statement this repo now makes that a
credentialed reviewer should check. Nothing here is a guess — each follows the
national guidance named beside it — but none of it has been read by a
clinician, and that is the gap no amount of tooling closes.

| Change | Source followed | Where | Landed |
|---|---|---|---|
| Hypothermic arrest: standard defibrillation algorithm alongside active rewarming, replacing "shock once, wait until 30°C/86°F" | 2025 AHA | question 785 | Phase 1 |
| Field triage: red/yellow criteria replacing the four numbered steps; mechanism is a yellow consideration, not red | 2021 National Field Triage Guideline (ACS COT / NAEMSP) | questions 672, 843, 966 | Phase 1 |
| SN2 worked example moved to a secondary substrate; (R)→(S) inversion asserted for both cyanide and azide | Standard organic chemistry; priorities Br > ethyl > methyl > H, and both nucleophiles enter as priority 1 | `ochem/mechanisms/sn2.html` | Phase 1 |
| Sources now names 2025 AHA, NRP, Stop the Bleed and the 2021 Field Triage Guideline as the editions written against | — | `sources.html` | Phase 1 |
| Post-ROSC oxygen titrated to **92–98%**, stated as a window with hyperoxia named as a harm, replacing "95% or greater" | 2025 AHA | Ch 21, `study-notes.html` | Phase 2 |
| "The most reliable sign of ROSC is the return of breathing" removed; no single reliable sign, with capnography named as the earliest objective clue | 2025 AHA | Ch 21 | Phase 2 |
| Hypothermic arrest: defibrillate by the standard algorithm while rewarming; "one shock then wait for 86°F/30°C" removed | 2025 AHA | Ch 21 | Phase 2 |
| Pediatric AED: use as soon as available at any age; the "2 minutes of CPR first" rule restricted to a lone rescuer at an unwitnessed child/infant arrest | 2025 AHA | Ch 21 | Phase 2 |
| CPR numbers added where the chapter had none: 100–120/min all ages; depth 2–2.4 in adult, ~2 in child, ~1.5 in infant; 30:2, and 15:2 two-rescuer child/infant; full recoil; ~10/min with an advanced airway | 2025 AHA | Ch 21 | Phase 2 |
| NEXUS listed as **five** criteria, with intoxication and alertness separated rather than merged into "reliability" | NEXUS low-risk criteria | Ch 33 | Phase 2 |
| SUID redefined as the umbrella term including accidental suffocation/strangulation in bed, with SIDS as the narrower diagnosis of exclusion | CDC SUID/SIDS classification | Ch 21 | Phase 2 |
| Hypoglycemia threshold set at **70 mg/dL** with an explicit note that protocols vary and some use 60 | ADA Level 1 hypoglycemia | Ch 22 | Phase 2 |
| Sildenafil-type drugs (ED **and** pulmonary hypertension) asked before nitroglycerin, for patients of any sex | Standard EMT pharmacology | chest pain scenario | Phase 2 |
| Long-acting sulfonylurea named as the reason a hypoglycemia refusal is dangerous — it outlasts oral glucose | Standard EMT pharmacology | diabetic scenario | Phase 2 |
| Primary assessment: AVPU added, and catastrophic external bleeding placed before the airway for trauma (X-ABC) | Current prehospital trauma practice | `flowcharts.html` | Phase 3 |
| Anaphylaxis criteria: more than one body system, or hypotension after a known allergen; skin findings alone are an allergic reaction, not anaphylaxis | Standard anaphylaxis diagnostic criteria | `flowcharts.html` | Phase 3 |
| Anaphylaxis: epinephrine, then call ALS and start moving before reassessing; biphasic reaction named as the reason everyone transports | 2025 AHA | `flowcharts.html` | Phase 3 |
| START: "Expectant" removed (it is a SALT category), respiratory criterion stated as over 30, and "breathing only after repositioning → Immediate" added | START | `flowcharts.html`, `mnemonics.html` | Phase 3 |
| SALT triage added, including the Expectant category and its meaning as resource-dependent and revisitable | SALT | `flowcharts.html` | Phase 3 |
| Stroke: high-glucose branch added, and a swallow/airway check before any oral glucose | Standard EMT practice | `flowcharts.html` | Phase 3 |
| CPR diagram: depth given as 2–2.4 in; "AED re-analysis prompts" removed as a stopping point | 2025 AHA | `flowcharts.html` | Phase 3 |
| Infant choking: back blows and chest thrusts only, no abdominal thrusts under 1 year, with the liver named as the reason | 2025 AHA | `flowcharts.html` | Phase 3 |
| Oxygen flow rates stated: cannula 1–6 L/min, non-rebreather 12–15 L/min, BVM with reservoir at 15 L/min | Standard EMT practice | `skillsheets.html` | Phase 3 |
| Airway sounds: snoring means open the airway, gurgling means suction (≤15 s); silent chest named as a pre-arrest finding | Standard EMT practice | `sound-trainer.html` | Phase 3 |
| BE-FAST, APGAR (with acrocyanosis scoring 1), PAT and SLUDGEM cards added | Standard EMT practice | `mnemonics.html` | Phase 3 |
| EMT formulary: indications, contraindications, doses and routes for oxygen, aspirin, oral glucose, epinephrine, naloxone, albuterol and nitroglycerin | National EMS Education Standards; doses are the usual figures taught nationally | `nremt/formulary.html` | Phase 4 |
| 22 new pharmacology questions added to the bank (topic "Pharmacology") | as above | `questions.json` | Phase 4 |
| Pediatric vital-sign ranges by age, and the 70 + (2 × age) hypotension formula | Standard EMT practice; ranges vary between texts and the page says so | `nremt/reference-cards.html` | Phase 4 |
| GCS component table; APGAR scoring grid with acrocyanosis scoring 1; PAT with what each side suggests | Standard EMT practice | `nremt/reference-cards.html` | Phase 4 |
| Airway chapter written from one section to four: manual maneuvers (head-tilt/chin-lift vs jaw-thrust, and airway outranking spinal precautions), OPA/NPA sizing and insertion, suction, airway sounds, BVM technique | National EMS Education Standards; 2025 AHA for ventilation rates | Ch 9, `study-notes.html` | Phase 4 |
| Assisted ventilation rate with a pulse stated as **1 breath every 6 seconds (10/min)** for an adult and 1 every 2–3 seconds (20–30/min) for an infant or child, with a note that older texts teach 10–12/min for adults | 2025 AHA | Ch 9 | Phase 4 |
| NPA contraindicated with signs of basilar skull fracture or major mid-face trauma | Standard EMT teaching | Ch 9 | Phase 4 |
| Oxygen targets stated: about **94% or above** generally, about **88–92%** in known COPD, with titration never meaning withholding | Current practice; local protocol named as governing | Ch 10 | Phase 4 |
| Oxygen cylinder: full ≈ 2,000 psi, safe residual ≈ 200 psi | Standard EMT practice | Ch 10 | Phase 4 |
| Vital signs: adult normal ranges, pulse/respiration technique, PEARRL, capillary refill 2 s, BP cuff-size and arm-position errors, reassessment at 5 min unstable / 15 min stable | Standard EMT practice | Ch 13 | Phase 4 |
| Capnography added with a normal of **35–45 mmHg**, and the point that it measures ventilation where oximetry does not | Standard EMT practice | Ch 13 | Phase 4 |
| Tourniquet procedure: 2–3 in proximal, never over a joint, high-and-tight for amputation or unclear source, tighten until bleeding stops **and** the distal pulse is gone, time written on it, left visible, not loosened in the field, second tourniquet proximal if needed | ACS Stop the Bleed | Ch 29 | Phase 4 |
| Wound packing: pack into the wound to the bleeding source then hold pressure ≥ 3 minutes; never pack the chest or abdomen | ACS Stop the Bleed | Ch 29 | Phase 4 |
| Blood volume figures: adult ≈ 5 L; serious sudden loss ≈ 1 L adult, 500 mL child, 100–200 mL infant | Standard EMT texts | Ch 29 | Phase 4 |
| Compensated vs decompensated shock, with narrowing pulse pressure as an early sign and hypotension named as a late one; beta blockers and children named as the two things that hide it | Standard EMT practice | Ch 29 | Phase 4 |
| TBI: primary vs secondary injury, hypoxia and hypotension as the two biggest worsening factors, Cushing's triad as the inverse of shock, no routine hyperventilation, CSF drainage not packed | Standard EMT practice | Ch 33 | Phase 4 |
| Neurogenic shock distinguished from hemorrhagic by heart rate and skin; C3–C5 and the diaphragm; spinal shock kept separate from neurogenic shock | Standard EMT practice | Ch 33 | Phase 4 |
| **Correction:** adult suction attempt was stated as 10 s in the new Ch 9 draft and 15 s on `sound-trainer.html` and in four keyed questions. Reconciled to **15 s adult / ~10 s or less child and infant**, matching the bank | AAOS figures; the bank's keyed answers | Ch 9, `sound-trainer.html` | Phase 4 |
| **Correction:** non-rebreather flow was 12–15 L/min on `skillsheets.html` and `formulary.html` and 10–15 L/min in the new Ch 10. Reconciled to **10–15 L/min** everywhere, consistent with the reservoir-collapse rule the same pages already gave | AAOS figures | Ch 10, `skillsheets.html`, `formulary.html` | Phase 4 |
| **Correction:** Ch 33's takeaway listed NEXUS as four criteria while the body text warned against exactly that merge. Takeaway rewritten to five | NEXUS | Ch 33 | Phase 4 |
| Ten new branching scenarios: six pediatric (febrile seizure, croup vs epiglottitis, asthma with a silent chest, infant sepsis, suspected abuse, drowning arrest) and four obstetric (imminent delivery, third-trimester bleeding, eclampsia, neonatal resuscitation) | National EMS Education Standards; 2025 AHA and NRP for the arrest and newborn cases; ACOG-consistent obstetric practice | `scenario-sim.html` | Phase 4 |
| Drowning arrest taught as hypoxic: CPR includes ventilations rather than compression-only, no abdominal thrusts to clear water, no routine spinal precautions without a mechanism, dry the chest before AED pads, hypothermia is a reason to continue | 2025 AHA | s14 | Phase 4 |
| Newborn resuscitation: warm/dry/position/stimulate, PPV at 40–60/min for apnea or HR < 100, compressions at **3:1** only for HR < 60 after 30 s of effective ventilation | NRP | s18 | Phase 4 |
| Field delivery: no routine suctioning of a vigorous newborn, loose nuchal cord slipped over the head rather than clamped, acrocyanosis read as normal | NRP | s15 | Phase 4 |
| Third-trimester bleeding: no vaginal exam, left lateral position, and concealed abruption taught as vital signs disagreeing with visible blood | Standard obstetric emergency practice | s16 | Phase 4 |
| Eclampsia: left lateral, minimize stimulation, obstetric-capable destination, and the risk continuing postpartum | Standard obstetric emergency practice | s17 | Phase 4 |
| Suspected child abuse: treat and transport, document observations and verbatim quotes rather than conclusions, report as a mandatory reporter, do not confront on scene | Mandatory-reporter practice; state law varies and the scenario says so | s13 | Phase 4 |
| Seven further scenarios: four behavioral (agitation with a medical cause, suicidal refusal and capacity, extreme agitation with hyperthermia, diagnostic overshadowing) plus heat stroke, a geriatric fall with syncope, and a household carbon monoxide exposure | National EMS Education Standards | `scenario-sim.html` | Phase 4 |
| Agitation taught as a symptom rather than a diagnosis, with hypoglycemia, hypoxia, head injury and sepsis named as causes and a glucose check as the first move | Standard EMT practice | s19, s22 | Phase 4 |
| Capacity to refuse distinguished from being alert and oriented; active suicidal ideation named as a reason a patient may lack it; restraint framed as for present danger only, never routine for a psychiatric diagnosis | Standard EMS medical-legal practice; state law and protocol vary | s20 | Phase 4 |
| Extreme agitation with hyperthermia: prolonged prone restraint named as dangerous, active cooling started during the struggle, and the sudden calm after exertion taught as the moment of arrest | Current prehospital practice on agitation-related death | s21 | Phase 4 |
| Heat stroke distinguished from heat exhaustion by **altered mental status**, with a note that a heat-stroke patient may still be sweating; cooling continued through shivering | Standard EMT practice | s23 | Phase 4 |
| Carbon monoxide: pulse oximetry named as unable to distinguish carboxyhemoglobin, so a normal reading is meaningless; evacuate including the crew; high-flow oxygen; transport all exposed | Standard EMT practice | s25 | Phase 4 |
| Choking, adults and children: cycles of 5 back blows then 5 abdominal thrusts, replacing abdominal thrusts alone; 5 chest thrusts substituted when the rescuer cannot encircle the abdomen | 2025 AHA, Part 7 Adult BLS (CIR.0000000000001369) and Part 6 Pediatric BLS (CIR.0000000000001370); adult FBAO algorithm | `nremt/flowcharts.html`, notes ch9 §Choking, scenario s3, questions 20, 21, 466, 758, 873, 1087, 1153 | Phase 8 |
| Choking, infants: 5 back blows then 5 chest thrusts delivered with the **heel of one hand**, replacing the two-finger technique; abdominal thrusts still not used under 1 year | 2025 AHA, Part 6 Pediatric BLS | `nremt/flowcharts.html`, notes ch9 §Choking, questions 129, 467, 1774 | Phase 8 |
| Infant chest compressions: two thumbs encircling, or the heel of one hand when the rescuer cannot encircle the chest. The two-finger technique is eliminated | 2025 AHA, Part 6 Pediatric BLS | notes ch21 compression table, question 1757 | Phase 8 |
| Chain of survival: a single six-link chain for all cardiac arrest, adult and pediatric, in- and out-of-hospital — Recognition and Emergency Activation, High-Quality CPR, Defibrillation, Advanced Resuscitation, Post–Cardiac Arrest Care, Recovery and Survivorship. Newborns keep a separate Newborn Chain of Care | 2025 AHA, Part 4 Systems of Care (CIR.0000000000001378) and the AHA Chain of Survival infographic | notes ch21 §Chain of survival | Phase 8 |
| New notes section: Choking — Foreign Body Airway Obstruction (mild vs. severe, the sequence by age, what changed in 2025, the transition to CPR, aftercare, and what thrusts do not fix) | 2025 AHA, Parts 6 and 7 | notes ch9 §`ch9-fbao` | Phase 8 |
| Oxygen-induced hypercapnia in COPD explained by V/Q mismatch (oxygen relieving hypoxic pulmonary vasoconstriction, raising dead space) and the Haldane effect, with reduced minute ventilation named as the smallest contributor — replacing the hypoxic-drive account. "Do not withhold oxygen from a hypoxic patient" kept, with titration to roughly 88-92% for a known retainer | Current respiratory physiology; the hypoxic-drive account is not what the evidence supports | question 974 | Phase 8 |
| Nitroglycerin heart-rate contraindication kept at under 50 or over 100, now attributed and qualified: many EMS protocols carry no heart-rate criterion at all | ACC/AHA ACS guidance ("marked bradycardia, heart rate less than 50 beats per minute, or tachycardia, greater than 100"); state protocols reviewed showed the criterion is often absent | `nremt/formulary.html` | Phase 8 |
| Glasgow Coma Scale illustration corrected: "E3 V4 M6 and E1 V1 M11" replaced with E4 V4 M5 and E4 V3 M6, both totalling 13, contrasting localising with obeying commands | The scale itself — the motor component stops at 6 | `nremt/reference-cards.html` | Phase 8 |
| Four figures added to the study notes, each restating clinical content the prose already carries: the 2025 six-link chain of survival; the path of a breath with the epiglottis marked; the 5-and-5 choking cycle and what "thrusts" means at each age; compression depth as a fraction of chest depth (adult 2–2.4 in, child ~2 in, infant ~1.5 in, all about one third) | 2025 AHA; standard EMT anatomy and BLS figures | notes §`ch21-arrest-pathophys`, §`ch9-airway`, §`ch9-fbao`, §`ch21-steps` | Phase 8g |
| Fourteen answer keys reworded to state an absolute that was already true of them: entry only after a structure is cleared; PPE on before entry; gloves and eye protection always before contact; hazmat clearance before entry; vehicle stabilization before entry; decontamination before care; mandatory reporting of suspected abuse as a **must**; pediatric bradycardia in respiratory distress **must** be treated as impending arrest; never pushing a prolapsed cord back in; avoiding hypoxia and hypotension in a head injury | Standard EMT practice and scene-safety doctrine; no clinical claim changed, only how definitely it is stated | questions 114, 196, 334, 419, 420, 479, 517, 563, 693, 825, 902, 977, 1069, 1592 | Phase 8i |

---

## Needs a person (cannot be resolved from here)

| Item | Why |
|---|---|
| Named clinical reviewer | The single highest-value item. Four reviews have now bottlenecked on it. |
| About section with a real name | Best done once a reviewer is named, so the two land together. Placeholder kept here deliberately. |
| Sound trainer: Hawaii COPD Coalition clips | Re-hosting permission is a question for the rights holder, not a code change. |
| Whether the state tests supine/seated spinal immobilization stations | Varies by state; needs the local office of EMS. |
| Three openly licensed recordings: snoring, gurgling, diminished/absent breath sounds | Entries and teaching are on the page; only the audio is missing. Must be openly licensed — not synthesised. |
| Whether the rhonchi and normal breath clips may be re-hosted | They are embedded as base64, not linked. Licence unestablished. |
| Whether drag-to-order items appear on the **EMT** cognitive exam | The 2024 technology-enhanced item changes are documented for AEMT and Paramedic. Could not confirm for EMT from here, so the claim is softened rather than asserted. |

---

## Phase 1 — Quick fixes — **complete**

| Item | Status |
|---|---|
| Body map iliac-crest entry reworded so it cannot read as binder placement | done |
| LICENSE file (CC BY-NC 4.0 content, MIT code, third-party noted) | done |
| SN2 page: (R)-2-bromobutane + cyanide/azide in DMSO, lone pairs, δ+/δ−, wedge/dash | done |
| Rename "Adaptive practice" → "Weak-spot practice" | done |
| Timed exam: exam-realistic mode (no Flag, no Previous), on by default | done |
| Dashboard: map 6 site domains to the Registry's 5 score-report areas | done |
| Sources: cite guideline editions explicitly | done |
| Field triage items 672, 843, 966 to the 2021 two-tier structure | done |
| Ochem scope wording — it is a two-semester sequence, not Organic Chemistry I | done |
| Hedged question 785 | done |
| Drag-to-order claim softened (could not confirm for the EMT exam) | done |
| Remove the "locked door with a doorbell" line on Privacy | done |

## Phase 2 — Clinical corrections — **complete**

| Item | Status |
|---|---|
| Post-ROSC oxygen target 92–98% | done |
| Hypothermic arrest: standard defibrillation while rewarming | done |
| NEXUS: all five criteria | done |
| SUID: contradictory sentence | done |
| Hypoglycemia: one cutoff (70 mg/dL), note that protocols vary | done |
| Ch 21: CPR rate, depth, ratio, recoil, peds and infant numbers | done |
| Ch 21: "most reliable ROSC sign" wording | done |
| Pediatric AED statement | done |
| Anaphylaxis scenario: medical control must not be penalised | done |
| Chest pain scenario: sildenafil-type drugs before nitro; 12-lead "if in scope" | done |
| Diabetic scenario: which medication (long-acting sulfonylurea) | done |

## Phase 3 — Flow diagrams and reference content — **complete**

| Item | Status |
|---|---|
| Branch arrows must not imply a wrong path (anaphylaxis, choking) | done |
| Branches readable on mobile | done |
| Primary assessment: AVPU; massive hemorrhage first in trauma | done |
| START: remove "Expectant", correct respiratory criteria, add reposition branch | done |
| Stroke: high-glucose branch, swallow check | done |
| CPR: remove "AED re-analysis prompts" endpoint; depth 2–2.4 in | done |
| Shock: branches must differ or merge | done |
| Anaphylaxis: hives alone must not qualify; transport earlier | done |
| Infant choking diagram | done |
| Mnemonics: BE-FAST, APGAR, PAT, SLUDGEM; fix RPM "expectant" | done |
| Skill sheets: spinal immobilisation stations; non-rebreather flow rate | done |
| Sound trainer: snoring, gurgling, diminished — **entries added, audio not** (see below) | partial |
| Sound trainer: heart sounds labelled beyond EMT scope | done |
| SALT triage alongside START and JumpSTART | done |

**Sound trainer, honestly:** the three airway entries are on the page with their
full clinical teaching, marked "clip coming soon". No audio was added, because
no openly licensed recording of them was available to me and a synthesised
substitute would be worse than silence — the file's own comment says lung sounds
must not be synthesised, and airway sounds are the same kind of texture.

Sourcing three openly licensed clips is now in **Needs a person**.

While there, a licensing problem was made explicit rather than left implied: the
rhonchi and normal breath clips are **embedded in the page as base64**, not
linked as the credit line implied. The page now says so, says the licence has
not been established, and gives a route to have them removed.

## Phase 4 — New EMT content — **done, except figures**

| Item | Status |
|---|---|
| Pharmacology module (EMT formulary) | done |
| Reference cards: peds vitals, GCS, APGAR, PAT | done |
| Expand Airway, Ventilation & Oxygen, Vital Signs, Bleeding Control, Head/Neck/Spine | done |
| Figures in the notes (currently zero across 40 chapters) | **blocked — see below** |
| More branching scenarios toward 25 | done — 25 |

The five chapters were the five smallest in the book — 2,461 to 4,744
characters against a median of 8,900 — and are now 10,674 to 21,009. Airway
went from one section to four and covers everything the work order named.

**Why figures are blocked, not skipped.** The figure system this site already
has (`.notes-figure`, inline SVG with `role="img"`, `<figcaption>`) lives in
`ochem/assets/ochem.css` and is used well across the ochem notes. Porting it to
the NREMT notes is easy. The problem is where the figures would go:
`study-notes.html` carries all forty chapters inline and is now 159.6 KB
gzipped against a budget just raised to 172. Every reader downloads the whole
book to read one chapter, and every figure makes that worse for all of them.

The right order is to move `CHAPTERS` into a fetched JSON file first — the page
already refuses to render without JavaScript, so nothing regresses — and then
add figures against a per-chapter payload. Doing it the other way round means
paying the weight twice. This is a real piece of work, not a large one, and it
is not in the work order, so it is flagged here for a decision rather than
done quietly.

Schematic figures are what is on offer either way: OPA/NPA sizing landmarks,
tourniquet placement, the E-C clamp. Anatomical illustration is not something
that should be faked in SVG, and it stays in **Needs a person**.

## Phase 5 — Ochem

| Item | Status |
|---|---|
| Lessons, textbook and mechanisms readable without JavaScript | done |
| Aldol "two carbons apart" wording | done |
| "Leads to" chip overflow; floating buttons covering content | **not a defect** — see below |
| Missing mechanisms (check Grignard in carbonyl addition first) | **mostly not missing** — see below. Radical halogenation was, and is now written |
| Synthesis / reagent-roadmap tool and flashcard deck | open |
| Figures in the reaction-heavy sections | in progress — 6 added, and there is now a generator |
| Skeletal structures after the foundations module | done — and it was the largest hole in the book |
| Skeletal structures and radical halogenation written but unreachable | done — Phase 1 below |
| Cut repeated caption/callout/body explanations | done — 2 real repeats, and the finding was much smaller than it looked |

**The no-JavaScript problem was bigger than the item as written.** The ochem
course's entire written half — 62 sections, about 1.2 MB of prose — lived as
bare HTML fragments with no title, stylesheet or navigation. `learn.html`
fetched and injected them, and that shell is 142 characters of static HTML, so
with JavaScript off the textbook was empty and a lesson page rendered a
heading and nothing else.

Three separate places encoded the decision to keep it that way —
`robots.txt` disallowed the fragments, `build-sitemap.mjs` skipped them and
`build-og-tags.mjs` skipped them — and all three gave the same reason:
indexed alone they would be "a wall of unstyled text with no way out". That
reason was correct, and it described a **fixable property of the files**
rather than an argument against the pages existing.

So each fragment is now a page: title, description, canonical, the site's
stylesheets, breadcrumbs, a link to its interactive lesson, and previous/next
through the book. The prose sits between two markers and is never touched by
the generator, so a section is still edited by editing its own file, and
`textbook.js` slices between the same markers — one copy of the words,
serving both the embedded textbook and the standalone page. `learn.html` also
carries a real table of contents now instead of one sentence apologising for
needing JavaScript.

Static text without JavaScript, before → after: the textbook 142 → 1,563
chars; a section 0 → 7,304; a lesson page 212 → 393 with a link that reaches
the prose.

**Verified as not a defect:** the "Leads to" chip row already has
`flex-wrap: wrap` and a `max-width: 560px` rule that gives the label its own
line, and its CSS comment already documents the no-JavaScript case. The
floating periodic-table button and the mascot are deliberately stacked with a
documented 12px gap. Neither reproduces.

**Verified as already done:** Grignard addition is covered in
`mechanisms/carbonyl-addition.html`, which contrasts it with hydride reduction
and works through why one gives a primary alcohol and the other a secondary.
The remaining gaps are real: hydroboration–oxidation, radical halogenation,
and acetal/imine formation.

**Figures: the finding was precise.** Density ran 2.8, 2.7 and 2.4 figures per
section across Foundations, Organic Structure and Alkanes, and 1.0 across
Carboxylic Acids, Enolate Chemistry and Amines — exactly backwards, since the
back of the book is where a picture stops being a nice extra and becomes the
only honest way to state the claim.

The reason nobody had fixed it: the existing figures are committed SVG with
**no source**. Coordinates precise to two decimals, and nothing checked in that
produced them, so adding one meant hand-writing trigonometry into a
4,000-character attribute soup. `scripts/lib/ochem-figure.mjs` is that missing
source; `scripts/build-ochem-figures.mjs` holds the definitions.

Six figures so far, each the load-bearing idea of a thin chapter: the acyl
reactivity ladder, the tetrahedral-intermediate fork, enolate resonance, which
bond forms in an aldol, where the charge lands in the sigma complex, and
lone-pair availability across amine types. Those chapters now run 1.3–1.7.

**Every one of the six was wrong on first render** — a clipped column of names,
a caption on top of a heading, a double bond drawn as three lines, and a
substituent drawn on top of a charge symbol. None of it is visible in the
markup and none of it failed a check; it was found by rendering the figures in
headless Chromium and looking at them. The bounds test added alongside catches
the off-canvas half of that class. **The rest still needs eyes, and a figure
added later should be looked at before it is pushed.**

**Repeated explanations: real, but two of them, not dozens.** A first pass at
detecting this reported 128 perfect duplicates across the textbook. Every one
was an artifact: a `<figure>` can sit inside a `.notes-example`, so pulling
captions and callouts separately extracted the same caption twice and compared
it with itself. With figures stripped before reading callouts, the true count
across 3,362 sentences is **20 pairs above 0.55 overlap, of which two were
genuine** — a figure note restating the paragraph directly above it almost word
for word, in `curved-arrows` and `rs-configuration`. Both cut.

The other eighteen are the design working, and the check is written not to
flag them. A caption has to make sense to someone who only looks at the
picture, so some echo of the body is correct. And parallel construction —
"For oxygen: 3 bonds means +1" beside "For nitrogen: 4 bonds means +1", at
0.64 — is the teaching, not redundancy. The ceiling sits at 0.72 against a
measured maximum of 0.688.

**"Missing mechanisms": three named, one actually missing.** Checked each
against the prose rather than against the mechanisms directory:

- **Hydroboration–oxidation** is covered, and covered well — the concerted
  single step, boron to the less hindered carbon, syn addition, no
  carbocation so no rearrangement, and the Hammond argument for why
  Markovnikov is a consequence of a mechanism rather than a law. It has a
  figure. What it lacks is an *interactive mechanism page*, which is a
  different thing from missing content.
- **Acetal and imine formation** are likewise written: `acetals` has its own
  lesson and section, and imines have a section heading of their own inside
  `nucleophilic-addition`. Again, no interactive page.
- **Radical halogenation of alkanes** was genuinely absent. Not a thin
  section — no section, no heading, nothing on initiation, propagation or
  termination anywhere in the book. The radical content in `markovnikov` is
  HBr adding to an *alkene*, which is a different reaction that happens to
  share the mechanism class.

So `radical-halogenation` is written: why alkanes are otherwise inert, the
fishhook arrow, the three stages sorted by what each does to the radical
count, the selectivity table with the Hammond explanation for why bromine is
fussy and chlorine is not, the per-hydrogen statistics correction, racemic
products from a planar radical, and NBS for allylic bromination. It carries
the chain figure and it is the 63rd section.

Its curriculum entry has `href: null` — the "coming soon" state the curriculum
already supports — because the written section exists and the interactive
lesson does not. That makes *topics* (62, those with a lesson) and *sections*
(63) two different numbers for the first time, so check 8 now counts both.

**Still open, and now stated accurately:** interactive mechanism pages for
hydroboration–oxidation, acetal formation and imine formation, plus a lesson
for radical halogenation.

**Skeletal structures: the word appeared once in 63 sections.** Once, in
`fischer`, in passing. There was no topic, no section and no explanation of
the notation that every drawing after Foundations is written in — wedges and
dashes in Stereochemistry, arrow-pushing between atoms that are not written
down in every mechanism chapter, all of it assumed.

Written as the 64th section and placed at the head of Organic Structure &
Electron Movement, which is where the work order asked for it: the four rules,
the asymmetry that catches people (a hydrogen on carbon is invisible, a
hydrogen on oxygen or nitrogen is always drawn, because the second kind is the
one that does chemistry), a worked example reading a structure back to a name,
rings, and a fluency test. Its figure puts butan-1-ol in all three notations
side by side so the rules can be read off by comparison.

Both new sections carry `href: null` and appear in Learn as locked cards until
their lessons exist.

## Phase 9 — Completing the ochem course

The course covers the mechanistic spine of a two-semester sequence well and is
missing several whole units a standard syllabus includes. This phase closes
that, in order. Scope wording and advertised counts move with the coverage,
never ahead of it.

### Phase 9.1 — Skeletal structures and radical halogenation unlocked — **complete**

Both sections were *written* — about 1,000 and 1,460 words respectively — and
both were unreachable. `curriculum.js` carried `href: null` for each, which
rendered them as locked "coming soon" cards with the finished prose sitting
behind them in `ochem/notes/`. An earlier review of this repo called them
missing content; they were missing links.

Skeletal structures is the one that mattered. It sits second in the
*Organic Structure & Electron Movement* chapter, immediately after Foundations,
and its own source comment describes it as "the notation every drawing after
Foundations is written in". A beginner met a locked card for the notation the
next fifty sections assume.

| Item | Status |
|---|---|
| Both topics point at their written notes instead of `href: null` | done |
| `notesOnly: true` and one shared label on every surface that lists a topic | done |
| Mastery can no longer read 100% while a topic has no lesson | done |
| `scripts/check-curriculum.mjs`, in CI, enforcing both | done |
| Advertised counts rechecked against the new shape | done — one was already wrong |

**`href` stopped meaning "has a lesson", and that was the whole change.** Every
topic now has an `href` so none is ever a dead link; `notesOnly: true` says the
destination is the notes page because the lesson is still to come. Six call
sites read `t.href` as "there is a lesson here" — the resume card, the module
rollup, the chapter-open test, the completed-lesson tally, the practice
engine's next-topic pick and Mastery's "Start here" — and each now asks
`hasLesson(t)`. Left alone, each would have produced the same bug in a
different place: a lesson that can never be finished, recommended forever,
holding its chapter permanently open.

**Mastery counts what it cannot measure.** A notes-only topic has no lesson to
answer questions in, so it can never earn a score. Leaving those topics out of
the denominator is what let a chapter report 100% mastered while containing a
section nothing had ever measured. They are now in the denominator as not yet
mastered, so a flawless run of every lesson that exists reads **98%**, not
100%, and the two chapters containing them cannot read 100% either. This is
deliberately a statement about the course rather than about the student, so
every surface that shows the number also says what it is silent about: the
chapter line adds "1 section not tracked yet (notes only)", the section header
reads "Not tracked yet" instead of "Not practiced", and the contents rail
flags the section. The ceiling lifts by itself when the lesson ships — it is
the gap, not a permanent tax, and a unit test pins that a fully tracked
chapter still reaches 100.

**The check verifies the property, not the code.** `check-curriculum.mjs`
fills in a perfect score for every lesson that exists and asserts the headline
number still cannot reach 100 while any topic is untracked, so the guarantee
survives the averaging being rewritten. Five failure modes were reintroduced to
test it, and the fourth found a real hole: deleting `notesOnly` while leaving
the notes `href` in place silently promoted a notes page to a lesson — the
count went up, the label vanished and the ceiling went back to 100, all by
removing a line rather than adding one. The check now decides what a topic *is*
from where its `href` points, so the flag and the destination cannot disagree.

**One advertised count was already wrong.** Check 8 reads counts off the pages
and compares them to the curriculum, but only scanned HTML, and the assistant's
greeting lives in a string in `assets/tutor.js`. It claimed "all 62 textbook
sections are indexed" while the textbook had 64 and the assistant was indexing
all 64. Check 8 now covers that file too. The redefinition it needed is worth
recording: "62 topics" on the hub means topics a student can *work through*, so
it counts topics with a lesson, not entries in the curriculum — otherwise
unlocking these two would have advertised two lessons that do not exist.

### Phase 9.2 — Interactive lessons for both — **complete**

Both lessons are eight steps on the shared engine, so each one's answers reach
`recordAttempt`/`completeLessonRun` and the concept model at the same time.
Four new concepts back them, since neither topic had any and a lesson that
records nothing into the concept graph is invisible to Practice and Review.

| Item | Status |
|---|---|
| `lessons/skeletal-structures.html`, wired to mastery, interim label gone | done |
| `lessons/radical-halogenation.html`, same | done |
| Concepts: `skeletal-notation`, `implicit-hydrogens`, `radical-chain`, `radical-stability` | done |
| Step→concept map entries for both, and prerequisites in the curriculum | done |
| Advertised counts moved 62→64 topics, 58→60 lessons | done |

**The mastery ceiling lifted by itself, which was the point of building it that
way.** `check-curriculum.mjs` went from reporting "2 notes-only, a perfect run
reads 98%" to "every topic is tracked, and a perfect run reads 100%" with no
change to the averaging — the gap closed and the number followed.

**Each lesson's hands-on step grades the mistake the written section names.**
Skeletal structures draws pentane with no labels at all and asks the student to
find the carbons; clicking the three corners and stalling triggers the nudge
about the two ends and scores the step wrong, because that is exactly the
miscount the step exists to catch. Radical halogenation shows three steps, two
of which produce CH₃Br, and asks for the stage — the trap being that the
product-making propagation step is not termination. Sorting it wrong returns
the radical count for that specific step rather than a generic "try again".

**Two faults found by checking rather than by assuming.** Running axe-core
directly at the new skeletal-structures page returned a serious violation:
the SVG carried `role="img"`, which declares the whole graphic a single image
and makes the focusable carbons inside it invalid and unreachable. It is
`role="group"` now, with each carbon labeled. The existing a11y job would not
have caught this — it samples one lesson (`lessons/pka.html`) as the "lesson"
shape, and that one has no interactive SVG. Separately, the first draft used a
`mono-inline` class that does not exist anywhere in the site; the course writes
inline formulas as plain text, and it now does the same.

**Two Phase 9.1 unit tests failed on this work, correctly.** Both asserted
against a chapter containing a notes-only topic, which is a condition Phase 9.2
removed. They were rewritten rather than deleted: the arithmetic one now builds
its own three-topic fixture, so it tests the averaging instead of depending on
the course being incomplete, and additionally asserts that tracking the third
topic lifts the chapter to 100. The overall-mastery one now asserts both
directions against the real curriculum — under 100 while any topic is
untracked, exactly 100 once none are — so it cannot be satisfied by making
mastery unreachable.

### Phase 9.3 — The missing units

Nomenclature · conjugation and Diels–Alder · oxidation and reduction ·
synthesis and retrosynthesis · biomolecules · organometallics ·
carbonyl/enolate breadth · aromatic follow-through · polymers.

#### Unit 1 — IUPAC Nomenclature — **complete**

The largest gap in the course, and the one that blocked reading everything
else: the book used compound names in its prose and its questions for eleven
chapters without ever introducing the system. One passing mention of "IUPAC"
existed site-wide, in the Fischer projections section.

Four sections, four lessons, 120 questions, inserted as **Chapter 3** —
after Organic Structure (you have to be able to read a structure before you
can name one) and before Acids & Bases (which is where the prose starts
naming compounds).

| Section | Covers |
|---|---|
| The parent chain | Roots, longest continuous chain, the tie-break, first point of difference |
| Substituents & locants | Alkyl and halogen prefixes, multiplying prefixes, alphabetization |
| Functional group priority | Principal characteristic group, suffix/prefix table, retained names |
| Rings & unsaturation | cyclo-, ring vs chain parent, alkene/alkyne locants, ortho/meta/para |

**Inserting a chapter renumbered 47 lessons, and nothing would have caught
it.** Each lesson's eyebrow carries "Module N · Chapter title" typed in by
hand, so putting Nomenclature at position 3 made every number below it wrong
— on a page that still renders, still links, and simply tells the student the
wrong chapter number. They were rewritten from the curriculum, and
`check-curriculum.mjs` now has a third check that compares every eyebrow to
the chapter it is actually in. `mechanisms/sn2.html` legitimately has no
module number in its eyebrow and is skipped rather than "fixed".

**Two chemistry claims were wrong in the first draft and were caught before
they shipped.** The notes asserted that the top four groups in the priority
order (acid, ester, amide, nitrile) are ranked by how oxidized the carbon is.
They are not — all four of those carbons sit at +3, so the sequence within
that block is a convention. It is now stated as one, with the genuine
oxidation difference (aldehyde +1, ketone 0) named where it does apply. The
second was an alkene/alcohol example whose "wrong" alternative, hex-1-en-4-ol,
was a different molecule rather than a different numbering of the same one;
it is now hex-5-en-1-ol against hex-1-en-6-ol, which is the real choice.

**The question bank got measurably harder to game, and the ceilings moved.**
The first draft of the 180 new questions had the key as the longest option
83% of the time, because the keys carried the reasoning and the distractors
were thin. The reasoning belongs in the `why` field, which is where it is now;
options are short and parallel claims. Combined with cycling the keyed
position, the whole ochem bank moved from **68% to 60.2%** on the
longest-is-key tell and from **37.7% to 26.4%** on keyed position — the latter
is within 1.4 points of the 25% chance for a four-option item. Both ceilings in
`check-site.mjs` were ratcheted down to match (0.68→0.62 and 0.40→0.30), per
the standing rule that these only ever tighten.

**Two topics from Phase 9.2 had no practice questions at all.** Unlocking
skeletal structures and radical halogenation gave them lessons and concepts
but left them absent from the per-topic bank, so a student who practiced
either got nothing. Nothing checks bank coverage — it is worth adding. Both
now have 30 questions, bringing the bank to 2,040.

**`ochem/learn.html` went over its page-weight budget** (3 KB, now 4). The
page is a shell whose only real weight is the static contents list generated
for readers without JavaScript, so four new sections is four new lines; the
budget follows the book. If it needs moving again for any reason other than
new sections, that is worth investigating first.

Advertised counts moved with the work: 64→68 topics, 60→64 lessons, 64→68
sections, 14→15 chapters, 1,860→2,040 questions, across the hub, the ochem
home, search, learn, the assistant greeting and the README.

#### Unit 2 — Conjugation & Pericyclic Reactions — **complete**

Five sections, five lessons, 150 questions, inserted as **Chapter 9**, directly
after Alkenes & Alkynes: it is alkene chemistry with the p orbitals joined up,
it needs resonance from chapter 2, and it has to precede both Aromatic
Chemistry (the limiting case of the same idea) and Enolate Chemistry (which
reuses the kinetic/thermodynamic argument wholesale).

| Section | Covers |
|---|---|
| Conjugated systems | Isolated/conjugated/cumulated, delocalization energy, s-cis and s-trans |
| 1,2- vs 1,4-addition | The allylic cation, two capture sites, the temperature-dependent ratio |
| Kinetic vs thermodynamic control | Barriers against wells, reversibility as the switch |
| The Diels–Alder reaction | [4+2], s-cis requirement, stereospecificity, endo rule, retro |
| UV-Vis spectroscopy | π→π\*, conjugation and λmax, chromophores, Beer–Lambert |

**UV-Vis is filed here rather than in Spectroscopy** because it measures
conjugation specifically and is close to useless for anything else — it is the
experimental half of this chapter, not a fourth instrument. The Spectroscopy
chapter cross-links to it.

**A worked example in the notes was wrong and did not ship.** The 1,2- versus
1,4-addition section originally used penta-1,3-diene, which looks like an ideal
example and is not: protonating it at C1 gives a *symmetric* allylic cation
with a methyl at each end, so capturing at C2 and at C4 give the same compound
and there is no pair of products to compare. It now uses isoprene, where the
two products are genuinely different and the C2 cation is tertiary. The near
miss is called out in both the notes and the lesson, since it is exactly the
trap a student setting their own practice problem would fall into.

**Four other defects, each caught by a check rather than by reading.** A link
to `lessons/e2.html` when E2 is a mechanism page; "signalling" and
"nanometres"; two deliberately parallel sentences in a worked example that the
repeated-explanation check read as one callout twice (rewritten so the second
adds the contrast rather than restating the shape of the first); and the phrase
"Four scenarios" in a source comment, which the scenario-count check read as a
claim about `scenario-sim.html`.

**The bank tightened again**, from 56.5% on longest-is-key after these 150
questions were written the same way as the last 180. `lengthCeiling` ratcheted
0.62 → 0.58.

**The practice bank is on a trajectory worth acting on.** `practice.html` and
`review.html` both *wait* on `ochem/assets/practice-bank.json` before their
first screen, so its size is first-paint latency on those pages. It went 268 →
280 KB gzipped here. The remaining chapters would add roughly a thousand more
questions and push it past 400 KB. Before that, this bank wants the same split
`build-question-bank.mjs` already performs on `questions.json` — explanations
separated from the core, so the pages block only on what they need to ask the
first question. **Raise that budget once more at most before doing the split.**

**Also still open:** nothing checks that every curriculum topic has practice
questions. Phase 9.2 shipped two topics with none and nothing noticed.

#### Unit 3 — Oxidation & Reduction — **complete**

Five sections, five lessons, 150 questions, inserted as **Chapter 12**, after
Carbonyl Chemistry — the chapter needs both ends of the ladder available:
alcohols (chapter 10) to oxidize and aldehydes and ketones (chapter 11) to
reduce.

| Section | Covers |
|---|---|
| Oxidation levels | The bonds-to-O/bonds-to-H test, the carbon ladder, why 3° alcohols cannot be oxidized |
| Oxidizing alcohols | PCC, Jones, Swern, DMP — and why water decides where a chromium oxidation stops |
| Reducing carbonyls | NaBH₄ vs LiAlH₄, why an ester takes two hydrides, amide → amine |
| Catalytic hydrogenation | Syn addition, chemoselectivity, the Lindlar/dissolving-metal pair |
| Oxidative cleavage | mCPBA, OsO₄ syn diol, the anti diol via an epoxide, ozonolysis both ways |

**Keeping oxidation and reduction in one chapter is deliberate.** Nearly every
question on this material is "which reagent, and what survives", and that
comparison only works if the reagents are in the same place. The chapter is
built around two questions asked of every reagent: *where does it stop*, and
*what else does it touch*.

**The shell generator's own guard caught an authoring error.** Passing a
pre-escaped title (`Oxidative cleavage &amp; dihydroxylation`) where it expects
a literal ampersand tripped the assertion that HTML entities must not leak into
JSON-LD — which exists because exactly that bug shipped silently in the first
nomenclature lesson before the guard was added.

**The practice bank's page-weight budget is now spent.** 280 → 292 KB gzipped
was the one further raise the previous note permitted, and the comment in
`check-weight.mjs` now says **DO NOT RAISE THIS AGAIN**. `practice.html` and
`review.html` block on this file before their first screen, and the remaining
six chapters would push it past 400 KB. **The split must happen before Unit 4
lands.** `ochem/assets/tutor-bank.json` also moved, 182 → 200, but that one is
genuinely not a first-paint cost — it is fetched only when a reader opens the
assistant — so it gets this file's usual ~10% headroom instead.

**Bank quality:** 54.6% on longest-is-key after these 150 questions.
`lengthCeiling` ratcheted 0.58 → 0.56. Keyed position is holding at 26.3%.

#### The ochem practice bank split — **complete**

Done before Unit 4, as the budget note required.

| | Before | After |
|---|---|---|
| Blocked on before first screen | 282 KB gz | **168 KB gz** |
| Fetched afterwards, blocking nothing | — | 121 KB gz |

`practice-bank.json` stays the file you edit; `scripts/build-ochem-bank.mjs`
generates `practice-bank-core.json` and `practice-bank-why.json` from it, and
CI fails if they drift. The two halves together are about 7 KB larger than the
single file, because splitting costs some cross-compression — that is the
trade, against 114 KB less before a page can show anything.

**The subtle part is when a question is normalized before its explanation
arrives.** `question-engine.js` builds each pooled question once, and that can
happen during the gap. Copying `why` in at that moment would freeze it empty
forever for anything built during the gap, and the only symptom would be a
question that silently explains nothing. So `why` is a **getter** that reads
through to `window.OchemPracticeWhy` at display time, and the gap closes
itself. It is deliberately non-enumerable, because several places copy a
question with `for..in` and a getter copied as a getter would carry a live
reference into an object meant to be a snapshot.

Verified in a real browser with the explanations artificially delayed 4
seconds: the pool built with zero explanations loaded, `why` read as `""`
rather than `undefined`, and the *same pooled object* returned the correct
text once the file arrived. Six unit tests pin the alignment and the
resolve-at-read-time behavior; shifting one topic's explanations by one
position fails three of them and the build check.

#### Unit 4 — Synthesis & Retrosynthesis — **complete**

Five sections, five lessons, 150 questions, appended as **Chapter 18**.
Synthesis is the capstone, so it goes last and draws on everything before it —
including Spectroscopy, since confirming a product is part of making one.
Appending rather than inserting also means **no chapter below it needed
renumbering**, which is the first time that has been true in this phase.

| Section | Covers |
|---|---|
| Thinking backwards | The open arrow, disconnections, synthons vs synthetic equivalents, retrons |
| Making C–C bonds | The ten reactions, counting carbons, the three attachment points a carbonyl offers |
| Functional group interconversion | Ladder moves vs substitutions, the reagent pairs, the two-step workarounds |
| Protecting groups | Why a Grignard cannot meet an O–H, silyl ethers and acetals, orthogonality |
| Planning a multistep route | What to ask of every step, the ordering rules, the failures to recognize |

**Two things were corrected before they shipped.** A worked example reached
benzaldehyde from benzene "in one Friedel–Crafts-type step", which is not a
clean intro-level move — a Friedel–Crafts acylation cannot deliver a plain CHO
because formyl chloride is too unstable. The example now takes the
bromobenzene/Grignard route and says explicitly why the other one is not
available. Separately, a challenge question asked "why is a ten-step route at
80% worse than an eight-step at 70%" — but 0.8¹⁰ ≈ 11% beats 0.7⁸ ≈ 6%, so the
stem asserted something the answer then had to contradict. It now asks which
route returns more and makes the point that yields multiply and the heuristic
is not a law.

**An auto-fixer for the length tell was written and thrown away.** Padding the
longest distractor programmatically produced "A carboxylate in every case" as
an answer to "what is the synthetic equivalent of an acylium synthon" — filler
that would have degraded the questions to satisfy a check. The hand pass stays.
For the `multistep-synthesis` set the right fix turned out to be the opposite
of the usual one: its keys were long because they carried the reasoning, so the
keys were **shortened** and the reasoning left in `why` where it belongs.

**Two budgets moved, both for real growth.** `ochem/assets` — the shell every
ochem page loads — went 92 → 96 KB gzipped, because `concepts.js` (64 → 84
concepts), `curriculum.js` and `lesson-concepts.js` all grow one entry per
topic and the course went from 64 topics to 83. The note records what moved and
where a saving would be if one is ever needed. `ochem/assets/tutor-bank.json`
grows the same way and has ~10% headroom by convention.

**Bank quality:** 54.1% on longest-is-key, `lengthCeiling` ratcheted 0.56 →
0.55, keyed position 26.3%.

#### Unit 5 — Biomolecules — **complete**

Five sections, five lessons, 150 questions, appended as **Chapter 19**. It
earns its place by being downstream of nearly everything: a sugar is an
intramolecular hemiacetal, a peptide bond is an amide, a fat is a triester, and
the DNA backbone is a diester. Nothing in the chapter is a new reaction — it is
the reactions already taught, shown doing the work they do in a cell.

| Section | Covers |
|---|---|
| Carbohydrates | Aldose/ketose, D/L, the ring as a cyclic hemiacetal, anomers and mutarotation, reducing sugars, α vs β in starch and cellulose |
| Amino acids | The zwitterion, the two pKa values, pI and electrophoresis, L with cysteine as R, the four side-chain classes |
| Peptides and proteins | The peptide bond as an amide, what amide resonance causes, the four levels of structure, disulfides and the hydrophobic effect |
| Lipids | Solubility as the defining property, packing and melting point, saponification and micelles, phospholipids and the bilayer, steroids |
| Nucleic acids | Nucleoside vs nucleotide, the N-glycoside and phosphodiester links, base pairing, why RNA hydrolyzes and DNA does not |

**This is the first unit reviewed by an independent second pass** — a fresh
agent read the five sections, five lessons, 150 questions and five concepts
without access to any of the reasoning above, and reported back. It found four
confident errors and seven weaker claims. All eleven were accepted and fixed;
the log is in *Chemistry review log* near the top of this file. That rate, on
material written carefully and checked once already, is the argument for doing
it on every remaining unit.

**Figures are now part of the unit rather than deferred.** Five were authored
with the existing kit: the anomeric carbon with and without a free OH, glycine's
net charge against pH, amide resonance and its three consequences, three C18
chains drawn as they pack, and a nucleotide taken apart into its three pieces.

**Budget:** `practice-bank-core.json` 180 → 192 KB gzipped, for 150 new
questions. The `why` half is unchanged at 132 and has ~3 KB of headroom left.

**Bank quality:** the 150 new items were authored with the key position cycled
and the reasoning kept in `why`; the length tell across them is 11%, reached by
trimming keys only — no distractor was padded.

#### The bank-wide length pass — **complete**

The ochem bank's "the longest option is the answer" rate had been coming down
one chapter at a time — 68% when the check was first pointed at it, 51.2% after
Biomolecules — because each new chapter was written to avoid the tell while the
older 64 topics were never revisited. This pass did the older topics.

**Method, and what was ruled out.** Eight reviewers each took a shard of the
1,081 items where the key was strictly the longest option, and rewrote the key
to be shorter without touching the stem or a single distractor. The rule was
the one the NREMT pass arrived at: an option does not need to justify itself,
because the justification is in `why` and the student sees it after answering.
So "The stereocenter furthest from the carbonyl" becomes "The lowest
stereocenter", and the item gets better as well as shorter. Padding distractors
was ruled out — that was tried once before, produced filler, and was thrown
away.

**Why it stopped at 22% rather than 10%.** 1,026 usable trims came back, and
applying all of them would have put the bank near 10%. That is not better. A
bank where the longest option is almost never the key hands the student a way
to eliminate an option, which is the same tell pointing the other way. Chance
for a four-option item is 25%, so chance is the target from either direction.
638 trims were applied, chosen **per topic** rather than globally, so no single
topic sits far above the whole: the bank is at **22.1%** and the worst topic is
28%. `lengthCeiling` drops 0.55 → **0.28**, and a new `lengthFloor` of 0.12
guards the other direction. Keyed position is unchanged at 26.4/25.8/24.1/23.7.

**Two other checks moved and were put back.** Trimming cut absolute words
("only", "must", "always") out of six keys as a side effect, which pushed the
separate *absolute words mark distractors* tell under its 3% floor. The six
were restored in short form, in each case where the absolute is load-bearing in
the claim. A British "cancelled" arrived in one trimmed key and was caught by
the spelling check.

**Six chemistry errors surfaced, none of them length problems.** Putting fresh
readers in front of questions written much earlier found things no automated
check could:

| Item | What was wrong |
|---|---|
| `chirality` #14 | Keyed 3-methylhexane as achiral. C3 carries methyl, H, **ethyl and propyl** — four different groups, so it is chiral, and the correct answer was sitting in the distractor list |
| `rs-configuration` #14 | Keyed –CH₂OH over –CHO. Duplicating the double bond makes –CHO (O, O, H) against –CH₂OH at (O, H, H), so –CHO wins. The `why` had actually worked this out and then contradicted itself |
| `e1` #15 | 3-chloro-3-methylpentane keyed to 2-methyl-2-pentene. The cation is at C3 with a methyl and two ethyls, so Zaitsev gives **3-methyl-2-pentene**; the Hofmann product is 2-ethyl-1-butene, which replaced an unobtainable distractor |
| `nucleophiles` #26 | All four options were false statements, so the item **had no correct answer**. Rewritten so exactly one is true |
| `electron-rich-poor` #28 | The key refused to answer and then answered, landing on the same claim as a distractor. Rewritten to state the s-character argument directly |
| `aromaticity` #25 | Two questions merged into one garbled stem. Rewritten |

Recorded because the point of the exercise was the length tell, and six wrong
answers is what it cost to look at 1,081 questions closely.

#### The figures backfill — **complete**

Every one of the original 64 sections carried at least one figure and the 24
added in this phase carried none. That gap is closed: all 93 sections now have
one, and from Unit 6 onward figures are authored as part of the unit rather
than recorded here as something to come back to.

The 19 for Units 1–4 were drafted in parallel, one agent per chapter, each
writing to its own file rather than to `scripts/build-ochem-figures.mjs`, so
four authors could work on one generator without colliding.

**Two of them shipped a draft rather than their final work, and it mattered.**
Merging picked up an intermediate state of two files. In that state the
`syn-anti-diol` figure drew the anti diol with **both hydroxyls on wedges** —
a syn diol twice, which is exactly the thing the figure exists to distinguish.
Both were re-merged from the authors' final files and the drawing now flips
only the wedge/hash on one carbon. The lesson is not about agents: a figure
that is chemically wrong reads as authoritative in a way prose does not, so
figures need the same review pass the prose gets.

One import was missing — `wedge` and `hash` were used by the new figures and
not imported — which failed loudly at build time rather than silently.

#### Unit 6 — Organometallics — **complete**

Five sections, five lessons, 150 questions, five concepts, five figures,
appended as **Chapter 20**.

| Section | Covers |
|---|---|
| Why C–metal means nucleophilic carbon | Electronegativity, umpolung, the family ordered by reactivity, what an acidic proton does to all of them |
| Grignard reagents | Formation, the electrophile-to-product table, the one-carbon extensions, why esters add twice |
| Organolithiums and acetylides | Where RLi beats RMgX, the carboxylate dianion, LDA, acetylide alkylation and its limits |
| Cuprates and conjugate addition | 1,2 against 1,4 as a hard/soft question, coupling to vinyl and aryl halides, stopping at the ketone |
| Palladium cross-coupling | The three-step cycle by oxidation state, Suzuki/Stille/Negishi/Sonogashira/Heck, convergence and tolerance |

It could have gone next to the carbonyl chapters, since that is where a
Grignard is first used. It goes at the end because the chapter's real subject
is the trade between reactivity and selectivity, and that argument only lands
once you have seen enough reactions to know what "too reactive" costs a route.
Every section is built around it: the Grignard is limited by being too hot, the
cuprate is useful by being cool, and palladium wins by never making a free
carbanion at all.

**Budgets:** `ochem` shell 96 → 100 KB gzipped, because `concepts.js`,
`curriculum.js` and `lesson-concepts.js` each gained ten entries across two
chapters — about 1.4 KB per chapter, which is what a chapter of course map
costs. `practice-bank-why.json` 132 → 140 KB for 300 new explanations.

**Bank quality:** the 150 new items were trimmed to land at 27% per topic
rather than the 10% a full trim would have given, for the same reason the
bank-wide pass stopped at 22% — chance is the target from both directions.

#### Unit 7 — Carbonyl & Enolate Breadth — **complete**

Five sections, five lessons, 150 questions, six concepts, five figures,
appended as **Chapter 21**. The carbonyl chapters taught one reaction each and
stopped; this is the breadth pass over them, and it covers the five named
reactions a second-semester course expects that the course had only mentioned
in passing.

| Section | Covers |
|---|---|
| The Wittig reaction | Ylide formation, the S<sub>N</sub>2 constraint, the P=O driving force, cis/trans by ylide stabilization |
| Imines and enamines | The one count that decides the product, the pH-4.5 argument, the enamine as a neutral enolate, Stork |
| Michael and Robinson | Donor/acceptor, why the donor is doubly stabilized, product spacing as a reading skill, the cyclohexenone |
| Malonic and acetoacetic ester | The pKa drop from 25 to 13, which start gives which product, β-keto decarboxylation, the S<sub>N</sub>2 limit |
| Baeyer–Villiger oxidation | Oxygen insertion, the Criegee intermediate, migratory aptitude as carbocation stability, lactones |

**The organizing idea is product spacing.** An aldol gives a β-hydroxy
carbonyl, a Claisen a 1,3-dicarbonyl, a Michael a 1,5-dicarbonyl. Counting the
gap names the reaction, forwards to predict and backwards to disconnect, and it
survives every change of conditions — which is what makes it worth learning
instead of the conditions.

**One error caught during authoring, before any review.** The Wittig lesson's
final step claimed that one of the two disconnections of 2-methylbut-1-ene
needs a *tertiary* halide. It needs a **secondary** one (2-bromobutane). The
step was rebuilt around 2-methylbut-2-ene, where the two routes genuinely
differ as primary against secondary — and it now makes the better point that
no Wittig disconnection can ever call for a tertiary halide, because a tertiary
carbon leaves the phosphonium with no hydrogen to remove.

**Budget:** `ochem` shell 100 → 104 KB gzipped. Three chapters have now taken
the course from 83 topics to 98, at about 1.5 KB per chapter of course map,
which is the number to check the growth against next time.

#### Unit 8 — Aromatic Follow-Through — **complete**

Five sections, five lessons, 150 questions, five concepts, five figures,
appended as **Chapter 22**. The aromatic chapter taught one reaction —
electrophilic substitution — and stopped. This is everything that follows from
it.

| Section | Covers |
|---|---|
| S<sub>N</sub>Ar and benzyne | Why an aryl halide does neither S<sub>N</sub>1 nor S<sub>N</sub>2, the two routes as mechanistic opposites, why F is the best leaving group in one of them |
| Benzylic reactivity | Cations, radicals and anions all stabilized by one resonance; both substitution mechanisms; NBS; side-chain oxidation and its one exception |
| Phenols | pKa 10 and where it comes from, why position beats presence, the bicarbonate separation, a C–O bond nothing substitutes at |
| Birch reduction | Dissolving-metal alternation, the unconjugated product as kinetic control, and the two substituent rules as one question |
| Diazonium salts and Sandmeyer | The leaving group that departs as N₂, the four groups EAS cannot install, and deleting a director as a protecting-group move |

**The unit is built around pairs of opposites**, which is what makes it
learnable rather than a list. S<sub>N</sub>Ar and benzyne run the same two
steps in opposite orders. A donating and a withdrawing group send a Birch
carbanion to opposite carbons — one question, not two rules. And fluorine is
the *best* leaving group in S<sub>N</sub>Ar and the worst everywhere else,
because the C–X bond is not breaking in the slow step.

**The strengthened figure test earned its place immediately.** The new
`phenol-pka-scale` figure had a summary line running off the left edge, and the
test caught it on the first build — the check that did not exist two chapters
ago.

#### Unit 9 — Polymers — **complete**

Five sections, five lessons, 150 questions, five concepts, five figures,
appended as **Chapter 23**. Not one reaction in the chapter is new: it is
alkene addition and acyl substitution, run on monomers with two reactive ends.

| Section | Covers |
|---|---|
| What a polymer is | Counting reactive sites, addition against condensation by atom count, thermoplastic against thermoset, 1/(1−p) |
| Addition polymers | Initiation/propagation/termination, head-to-tail from radical stability, tacticity and branching |
| Condensation polymers | Polyesters and polyamides, nylon as a one-residue protein, Kevlar, why the last tenth of a percent is the reaction |
| Structure and properties | Crystallinity and what it drives, T<sub>g</sub> against T<sub>m</sub>, cross-linking as a dial, elasticity as entropy |
| Designing and unmaking | Disconnecting a polymer, property-to-feature mapping, and why one backbone bond decides recyclability |

**What makes it a chapter rather than a list** is that it applies the course's
own arguments to materials people handle. Chain packing is the fatty-acid
argument from Biomolecules. Nylon's strength is a β sheet's strength. Head-to-
tail linking is Markovnikov. And the chapter ends on a claim that is chemistry
rather than policy: an ester in a backbone is a bond hydrolysis can select and
a saturated C–C chain is not, so the properties that make a polyolefin cheap
and durable are the same ones that make it permanent.

**Phase 3 is complete.** Nine units, 45 sections, 45 lessons, 1,350 questions,
49 concepts and 45 figures, taking the course from 64 topics to 108.

### Phase 9.4 — Depth in the existing units — **in progress**

Four chapters were named as thin, and each gets two more sections. The test
for what to add was not "what is missing from a syllabus" but "what does this
course already gesture at without ever teaching". A coverage sweep found the
gaps: zero files mentioning the haloform reaction or &alpha;-halogenation, one
mentioning Gabriel, one mentioning Tollens'.

| Chapter | Was | Adding |
|---|---|---|
| 11 Carbonyl Chemistry | 3 | Hydrates & cyanohydrins; Oxidizing an aldehyde |
| 13 Carboxylic Acids & Derivatives | 3 | Acid chlorides & anhydrides; Nitriles |
| 14 Enolate Chemistry | 3 | &alpha;-Halogenation & the haloform reaction; Kinetic against thermodynamic enolates |
| 15 Amines | 2 | Making amines; Hofmann elimination |

#### Carbonyl Chemistry 3 &rarr; 5 — **complete**

Two sections, two lessons, 60 questions, two concepts, two figures.

**Hydrates & cyanohydrins** exists because the chapter had been saying "more
reactive" for three sections without ever putting a number on it. Hydration
does: acetone 0.1%, acetaldehyde ~50%, formaldehyde ~99.9%, chloral ~100%.
Four orders of magnitude from two causes that usually agree &mdash; the sp&sup2;
carbon becoming sp&sup3;, and alkyl donation into the C=O &mdash; which is
exactly why *aldehyde > ketone* is so reliable. The interesting rows are where
they disagree: hexafluoroacetone is crowded *and* fully hydrated, benzaldehyde
is barely hydrated because addition destroys conjugation, and cyclopropanone is
fully hydrated because addition *relieves* ring strain, which runs the steric
argument backwards.

**Oxidizing an aldehyde** exists to close a gap the course had left open. It
had taught that Jones goes to the acid and PCC stops at the aldehyde without
ever saying why, and the reason is the previous section: an oxidant needs an
O&ndash;H and a C&ndash;H on one carbon, a C=O has neither, and the species
actually attacked is the *hydrate*. That also explains reducing sugars, since a
hemiacetal ring supplies its trace of open-chain aldehyde continuously. One
idea, three places.

**Two guessability defects, caught before review.** The hydration sort step ran
five rows over three options with one answer correct three times; it now runs
six rows, the new one being benzaldehyde, which also carries the conjugation
argument. The test-result step ran five rows over two options with four
negatives &mdash; clicking "negative" scored 80%. It now runs seven rows at
four to three, and the two added rows are benzaldehyde against Tollens' and
against Fehling's: same substrate, opposite results, which is the pair worth
remembering.

**A generator defect found in passing.** `build-notes-pages.mjs` derived each
meta description from the prose's opening sentence and then escaped it, without
first decoding the entities the prose is written with &mdash; so a section
opening with an em dash shipped `&amp;mdash;` into its own search snippet.
Thirteen pages were affected, eleven of them pre-existing. Fixed at the
generator.

**The independent review found twelve, and one of them was mine twice over.**
Eight confident, four qualified, all accepted.

| Claim as written | Where | Why it is wrong |
| --- | --- | --- |
| "That spread is **four orders of magnitude**" | notes, lesson, concept | 0.1% to 100% is three, and the figure caption on the same page already said three. Now stated as three in percent, with the caveat that comparing equilibrium constants gives about six |
| A cyanohydrin's nitrile becomes "an acid, a beta-amino alcohol, or **an alkene**" | concept and lesson | Dehydration gives an &alpha;,&beta;-unsaturated **nitrile**; the nitrile carbon is retained in all three routes. The notes had it right and the two summaries did not |
| "You met it already without being told" (Jones and PCC) | both new notes and both lessons | Alcohol oxidation is section 62 and these are 59 and 60, so the reader has not met it. Reframed as what the next chapter will state without explaining, which is a better claim anyway |
| "A species present at **a few percent** controls the outcome" | `notes/hydrates-cyanohydrins` | The hydrate doing the work in a Jones oxidation is an aliphatic aldehyde's, which the table two paragraphs up puts at ~50%. The trace-species framing belongs to the sugar case, where it is now made |
| The hydrates lesson's "Leads to" pointed at **acetals**, the previous section | `lessons/hydrates-cyanohydrins` | Now points forward |
| "Two causes, and they **never disagree**" as a step title, with a benzaldehyde row explained by conjugation | `lessons/hydrates-cyanohydrins` | My own new row created the contradiction. Conjugation is now taught as the third cause in the step, not sprung in the answer |
| Bisulfite adduct called a "**water-soluble** salt" and then filtered off as a solid | `notes/hydrates-cyanohydrins` | Both are said in textbooks and they sit badly together. The useful property is the reversed solubility &mdash; soluble in water, insoluble in organic solvents &mdash; so the separation is an extraction, with filtration as the case where it crystallizes |
| "A ketone **never** enters this picture" and a concept titled "Why **only** aldehydes oxidize" | figure and concept | Too narrow twice. Ketones are oxidized by Baeyer&ndash;Villiger and by hot KMnO<sub>4</sub>, and &mdash; the one that matters here &mdash; **fructose is a reducing sugar**: these reagents are basic, and base isomerizes a ketose to an aldose through an enediol. A free anomeric carbon, not an aldehyde, is what a positive test actually needs |

The four qualified findings: the figure's alt text described a branch that is
not drawn, "under anhydrous conditions there is **nothing** to oxidize" ignores
the starting alcohol, and two wordings were tightened. The ketose point earned
a new bank question, replacing one of a near-duplicate pair on the Fehling's
and Benedict's ligands.

**A layout bug found by a drafting agent, not by a check.** Thirty-two notes
files wrapped their tables in `class="table-wrap"`, which has **no CSS rule
anywhere**; only `notes-table-wrap` is styled. Those tables lost their
`overflow-x:auto`, so a wide table overflowed the page on a phone instead of
scrolling. `check-site.mjs` accepted both spellings, which is why nobody
noticed. All thirty-two are converted.

**The browser pass confirmed both lessons end to end**, walking every option in
every gradeable step across four runs, and independently measured the sort-step
distributions at 3/2/1 of six and 4/3 of seven &mdash; so no single button
scores above 57%. It also noted that `mastery-engine.js` silently drops an
unknown concept id rather than warning, which means a typo in
`lesson-concepts.js` would fail invisibly. Worth a guard.

#### Carboxylic Acids & Derivatives 3 &rarr; 5 — **complete**

Two sections, two lessons, 60 questions, two concepts, two figures.

**Acid chlorides & anhydrides** is the missing first move. The course taught
the reactivity ladder and that you may only go down it, without ever teaching
how to get to the top &mdash; and the reason the acid itself is a poor
acylating agent is not its position on the ladder but its proton: at pK<sub>a</sub>
4&ndash;5 it protonates any nucleophile good enough to attack, giving an
ammonium carboxylate with the nucleophile switched off and the electrophile
anionic. The section covers SOCl<sub>2</sub>, oxalyl chloride and the
phosphorus reagents, chosen on their by-products rather than their mechanism;
the two-equivalent amine trap; anhydrides and what spending half a molecule as
a leaving group costs; and Friedel&ndash;Crafts as the one use that builds a
carbon skeleton.

**Nitriles** closes the chapter on the member with no carbonyl in it. Three
bonds to nitrogen is the same count as three bonds to oxygen, so it sits on the
acid rung, and everything follows from that: moving along the rung needs no
oxidant, stepping off it needs a reducing agent. The four exits &mdash; acid,
primary amine, aldehyde, ketone &mdash; are one reagent apart, and the
distinction worth teaching is that DIBAL-H is **crippled, not rationed**:
rationing LiAlH<sub>4</sub> to one equivalent gives a mixture, not an aldehyde,
because what stops DIBAL is that its intermediate is an anion.

**Budgets raised, with the reasoning written into the file.** The ochem shell
108 &rarr; 112 KB, `practice-bank-core.json` 204 &rarr; 216, the `why` half
148 &rarr; 156 and `tutor-bank.json` 200 &rarr; 212. Each pair of sections
costs about 1.4 KB of shell and 60 questions, so these cover the rest of the
phase and should be the last raise in it.

**The review found six confident errors, one of them serious.**

| Claim as written | Where | Why it is wrong |
| --- | --- | --- |
| "Benzoic acid to **phenyl propyl ketone**", with SOCl<sub>2</sub> then AlCl<sub>3</sub> as the route | `lessons/acyl-chlorides-anhydrides` step 7 | Impossible. Benzoyl chloride with AlCl<sub>3</sub> and benzene gives **benzophenone**, C<sub>13</sub>, because the new group comes from the arene. Phenyl propyl ketone is C<sub>10</sub> and needs three carbons from a carbon nucleophile &mdash; a Gilman reagent, not a Friedel&ndash;Crafts. Rebuilt around benzophenone, with the Gilman route named as what the propyl case would actually take |
| "Nothing climbs, because that would mean expelling **a better one**" | figure `one-way-ladder` | Backwards. Going down expels the better of the two groups the tetrahedral intermediate holds; climbing would mean expelling the **worse** one, which is why it does not happen |
| "the **only way up**" on the SOCl<sub>2</sub> arrow | same figure | The same page lists three reagents that climb |
| Cyanide "tolerates acidic protons **and other electrophilic groups**" | notes and lesson | It tolerates O&ndash;H and N&ndash;H, which is the whole contrast with a Grignard. It is a nucleophile, so a ketone elsewhere becomes a cyanohydrin &mdash; which the same page lists three bullets above as a way to make a nitrile |
| Sandmeyer "the **only way** to put a CN on a benzene ring" | notes and a bank stem | Dehydrating an aryl amide reaches one too, as do Rosenmund&ndash;von Braun and S<sub>N</sub>Ar. The true half is the reason: EAS cannot install CN because there is no electrophilic cyanide reagent. The bank item asserted the false premise in its stem and was rewritten around the reason |
| Pyridine "too **hindered** to attack" | concept card | Pyridine is flat and its nitrogen is not hindered at all; it is simply a far weaker nucleophile, its lone pair sitting in an sp&sup2; orbital in the ring plane. Triethylamine is the hindered one, and the lesson wrongly called that "the property pyridine was chosen for". Two different defenses, now distinguished |

#### The sort steps were on the diagonal — **fixed**

The browser pass on the acyl pair found something none of the answer-tell
checks could see, because none of them ever looked at a sort step: **the
correct answers lay on the diagonal.** Clicking the Nth button in the Nth row
cleared the whole step, first try, with no chemistry involved.

Measured across the course, **twelve lessons** were on it and **six were
perfectly so**. The cause is the same one `shuffle-options.js` was written
about: an author lists the options, then writes the rows in the order the
ideas arrive, and the two orders match. It is worse than answer-first on a
single question, because a sort step is scored as one unit and feeds the
concept model as one piece of evidence.

Fixed in three places rather than one:

- **`shuffle-options.js` now reorders the buttons of every sort row at render
  time**, keyed by the row id and the session salt. No lesson needed editing:
  the handlers read `data-o`, never position, so moving a button in the DOM
  moves its listener with it.
- **`check-site.mjs` gained check 29**, which fails a sort step whose answers
  run down the diagonal, and separately one where a single answer covers more
  rows than chance allows &mdash; the defect found by hand in
  `polymer-properties` earlier in this phase.
- **All twelve lessons were reordered** so the source is clean too. The `OPTS`
  array moved rather than `CASES`, because row order frequently carries the
  argument and some feedback text refers to "the row above".

#### Enolate Chemistry 3 &rarr; 5 — **complete**

Two sections, two lessons, 60 questions, two concepts, two figures.

**&alpha;-Halogenation and the haloform reaction** is built on one observation:
acid stops after a single halogen and base does not stop at all, and it is the
*same* substituent effect both times. The acid route needs the carbonyl basic
enough to protonate and the halogen makes it less so; the base route needs the
&alpha; hydrogens acidic enough to remove and the halogen makes them more so.
The runaway is then the point on a methyl ketone, where CX<sub>3</sub> becomes
a leaving group. The trap worth teaching is that the iodoform test reports a
CH<sub>3</sub>CO fragment rather than a methyl group anywhere in the molecule,
so 2-methylcyclohexanone is negative despite its name.

**Kinetic and thermodynamic enolates** exists because every earlier section
said "form the enolate" as though it were an instruction. For an unsymmetrical
ketone the easier proton and the more stable anion are on opposite sides of
the molecule.

**The review broke this section's organizing idea, which was the most useful
finding of the phase.** The section was built on "reversibility decides, not
temperature" &mdash; and **NaH is a counterexample to that rule**. Its
deprotonation is as irreversible as LDA's, since the conjugate acid is
H<sub>2</sub> and it leaves the flask, and it still gives the thermodynamic
enolate. The rule was not merely imprecise; it was false, and the section
itself listed the counterexample as a thermodynamic base two paragraphs later.

The corrected idea is better teaching as well as true. The question is whether
the two **enolates** can interconvert, and a proton can travel between them by
three routes: the deprotonation reverses (ethoxide), free ketone shuttles it
(NaH, slow and heterogeneous, so un-ionized ketone is always present), or the
amine the base generated shuttles it (which is what erodes a lithium enolate
on warming). Each item in the kinetic recipe closes exactly one route, which
is why missing any single one loses the regiochemistry &mdash; and why "LDA at
room temperature is still kinetic" was a half-truth worth retiring.

Seven further findings were accepted. Two distractors were **correct answers**:
LDA at &minus;78&nbsp;&deg;C with Br<sub>2</sub> really does give clean
monobromination (stoichiometric enolate, not catalytic base), and "strong base
in the cold" is that same method. "Base does not stop at all" has a
counterexample in isopropyl phenyl ketone, whose single &alpha; hydrogen ends
the runaway after one. And the enamine's stopping after one alkylation was
given the wrong reason &mdash; it is not that the enamine is *less reactive*
but that alkylation makes an **iminium with no nucleophilic carbon**, and no
base is present to restore one, so a second alkylation is impossible rather
than slow. The bank item on that had no option expressing the real reason, so
it was rewritten rather than re-keyed.

#### Amines 2 &rarr; 4 — **complete**

Two sections, two lessons, 60 questions, two concepts, two figures.

**Making amines** is organized around a failure rather than a list. Direct
alkylation of ammonia cannot be stopped, because each product is a better
nucleophile than what made it, so the composition is set by relative rates and
using less halide does not help. Every method in the section is an escape from
that one problem, and they divide by *how* they escape: alkylate something
that cannot react twice (Gabriel), use a nucleophile that is not an amine
(azide), or stop using displacement altogether (reductive amination, amide
reduction). The axis that actually decides between them is the carbon count,
which is why the lesson's sort step asks only that.

**Hofmann elimination** closes the chapter and reaches back to the
substitution one. An amine cannot eliminate because an amide anion will not
leave; quaternize the nitrogen and what departs is neutral. The product is the
*least* substituted alkene, and the section's lasting point is that this is
the **third** distinct way Zaitsev breaks: the E2 chapter broke it with
geometry and again with a bulky base, and here the bulk is on the **leaving
group**, which is part of the substrate rather than something you choose.

**The review found twelve, six confident.** The figure claimed *five* escapes
and drew six. It labeled amide reduction as giving only a 2&deg; or 3&deg;
amine, contradicting the table three paragraphs below it &mdash; a primary
amide gives a primary amine. The final challenge said "two routes reach a
four-carbon amine" above four options, three of which do. Two bank distractors
were the **same compound under two names**, 2-bromo-2-methylpropane and
*tert*-butyl bromide, which after shuffling puts the identical structure on
screen twice. The Hofmann figure's alt text called the salt *butyl*
trimethylammonium when the drawing is the *sec*-butyl one &mdash; the n-butyl
salt has a single &beta; carbon and would make the figure pointless.

And the one I should have caught: the figure said **"each product beats the
last"**, which fails at the step it most needs to hold. A tertiary amine is a
*poorer* nucleophile than the secondary amine that made it, because three
alkyl groups crowd the S<sub>N</sub>2 transition state &mdash; the classical
Menshutkin ordering. The prose was careful and only claimed it through the
secondary amine; the figure generalized it one step too far.

Six qualified findings were also accepted, two of them substantive. "Set by
kinetics, not stoichiometry" is only true of **halide** stoichiometry: a large
excess of ammonia genuinely does bias the mixture toward the primary amine and
is how simple ones are made industrially. And reductive amination was said to
have "no substrate limit", when it has two that students trip on &mdash; the
nitrogen lands on the old carbonyl carbon, so *tert*-butylamine and aryl
amines are unreachable, and making a primary amine from ammonia is the one
case that still over-alkylates.

**Phase 4 is complete.** Eight sections, eight lessons, 240 questions, eight
concepts and eight figures, taking the course from 108 topics to 116 across
23 chapters, 112 lessons and 3,480 questions.

**The scope wording was three places behind.** `sources.html` described a
thirteen-chapter course; `mass-spec.html` and `nucleic-acids.html` each opened
with "this is the last section", true when written and false since Phase 3
appended nine chapters behind them. The hub and the textbook never drifted,
because they render their counts from `curriculum.js` rather than stating them
in prose &mdash; the two files that went stale are the two that hardcode
English, which is the argument for deriving these numbers wherever it is
possible.

**The weight budget note was wrong, and says so now.** It predicted 4 KB would
cover three pairs of sections; two used it up and the third went 1.4 KB over.
The error was the per-pair figure rather than the arithmetic &mdash; a pair
costs nearer 1.8 KB than 1.4, because these eight concepts carry longer
`teach` strings than the Phase 3 ones did. They are corrections to ideas the
course already taught, so each has to say what the earlier statement got wrong
as well as what is true. The comment now records that, and says the next
chapter should take the teach-string saving instead of raising again.


---

## Phase 6 — Answer-option rewrites

| Item | Status |
|---|---|
| Rewrite options flagged by the three tell checks, one domain per commit | **the three tells are closed**; ~128 individually weak distractors remain — see below |

The scale, measured before starting:

| Tell | Items with exactly one matching option | Key was that option | Baseline |
|---|---|---|---|
| Absolute word | 450 | 6.2% | 25% |
| Hedge | 102 | 40.2% | 25% |
| Trailing justification | 183 | 16.9% | 25% |

The absolute-word tell is the one that matters. A student who learns "the
absolute-worded option is wrong" can eliminate an option on 450 of 2,106
items — a fifth of the bank — and be right 94% of the time.

**Cardiac (Phase 6a):** 29 absolute-word distractors and 6 justification-clause
distractors rewritten. Keys untouched, clinical meaning untouched: each option
still says the same wrong thing in words a student might actually pick.
Bank-wide the absolute tell went 450 → 414 items and 6.2% → 6.8% keyed;
justification 183 → 178 and 16.9% → 17.4%.

Two things worth recording for the remaining domains:

- **Not every absolute is a strawman.** Item 38's distractor read "pain that
  only occurs during exertion and never at rest" — which is an accurate
  description of *stable angina*, and a strong distractor for a question about
  MI. Stripping the absolutes blindly would have weakened it. It was reworded
  to "comes on with exertion and eases within minutes of stopping": same
  clinical claim, no giveaway.
- **Removing one tell can expose another.** Several rewritten options had
  carried a justification clause as well. Removing it made a *different* option
  the only justification-bearing one in its question, which pulled those
  questions into the justify sample and pushed that share below its floor
  until the Cardiac justification clauses were fixed too. Do all three tells
  per domain, in one pass, or the checks will fight each other.

**Medical (Phase 6b):** 42 distractors rewritten, plus 3 keys de-hedged. Running
totals — absolute 450 → 385 items and 6.2% → 7.3% keyed; justification 183 → 172
and 16.9% → 18.0%.

**The hedge tell runs backwards, and the Medical pass got it wrong.** Hedge went
41.0% → 42.2%, away from the 25% target, while still inside its ceiling. The
reason is direction: hedge is the one tell here that marks the RIGHT answer, so
removing a hedge from a *distractor* shrinks the denominator while the keyed
count stays put and the share rises. Seven distractor hedges came out as a side
effect of fixing absolute and justification tells in the same options.

For the remaining domains the rule is:

| Tell | Marks | Fix it by |
|---|---|---|
| Absolute word | the wrong answer | rewriting **distractors** |
| Trailing justification | the wrong answer | rewriting **distractors** |
| Hedge | the **right** answer | committing **keys** to a definite answer |

Two Medical keys kept their hedge deliberately: "generally does not experience
complications" is true of sickle cell *trait*, and "the criteria generally
require" is true of the anaphylaxis criteria, which have a second limb. A key
made wrong to satisfy a metric is a worse outcome than the tell.

**Geriatrics & Special Populations (Phase 6c):** 31 distractors rewritten and 2
padded keys de-hedged, following the table above rather than fighting it. All
three tells improved for the first time in the same commit.

Running totals:

| After | Absolute | Hedge | Justification |
|---|---|---|---|
| start | 450 / 6.2% | 102 / 40.2% | 183 / 16.9% |
| Cardiac | 414 / 6.8% | 100 / 41.0% | 178 / 17.4% |
| Medical | 385 / 7.3% | 90 / 42.2% | 172 / 18.0% |
| Geriatrics | 355 / 7.9% | 88 / 40.9% | 173 / 18.5% |
| Secondary Assessment | 328 / 8.5% | 88 / 40.9% | 164 / 19.5% |
| Musculoskeletal & Burns | 301 / 9.3% | 86 / 39.5% | 159 / 20.1% |
| Obstetrics | 275 / 10.2% | 82 / 36.6% | 151 / 21.2% |
| Scene Safety & Operations | 251 / 11.2% | 79 / 34.2% | 145 / 22.1% |
| Bleeding & Shock | 228 / 12.7% | 75 / 30.7% | 140 / 22.9% |
| Pediatrics | 205 / 14.1% | 73 / 28.8% | 132 / 24.2% |
| Legal & Ethical | 194 / 14.9% | 71 / 26.8% | 119 / 26.9% |
| Trauma Systems | 172 / 17.4% | 70 / 25.7% | 107 / 29.9% ↑ |
| Incident Management | 151 / 19.9% | 70 / 25.7% | 107 / 29.9% |
| Head, Chest & Abdominal | **128 / 23.4%** | 70 / 25.7% | 107 / 29.9% |

Thresholds now `absoluteFloor: 0.195`, `hedgeCeiling: 0.28`, `justifyFloor: 0.25`
and `justifyCeiling: 0.34`.

From Incident Management on, the apply script **asserts** that a rewrite keeps
any justification clause the original had, and adds none where there was none.
That kept hedge and justification exactly flat while absolute moved 17.4% →
19.9% → 23.4% — passes that move one number without disturbing the other two.

## All three tells are closed

| Tell | Start | Now | Baseline |
|---|---|---|---|
| Absolute word | 450 items / 6.2% | 128 / **23.4%** | 25% |
| Hedge | 102 / 40.2% | 70 / **25.7%** | 25% |
| Trailing justification | 183 / 16.9% | 107 / **29.9%** | 25% |

All three now carry a bound on both sides, because a ratchet that only tightens
is right for a number heading toward a target and wrong for one that has
arrived.

**What is NOT finished, and it is worth being exact about the difference.**
The *tell* is closed: a student who spots an absolute-worded option learns
nothing from it, on the 128 items where one still exists, and on the other 322
there is no longer a lone absolute-worded option to spot. That is the pattern
gone.

Individual weak distractors are a separate problem. "Chest injuries never
affect oxygen saturation readings" is a lazy option whatever the aggregate
statistic says, and roughly 128 items still contain one. Rewriting them would
improve those items **and push the metric past chance**, turning the absolute
word into a tell that marks keys.

So the remaining work is no longer tell-removal, it is a balancing act: each
further distractor rewritten needs a key somewhere that is legitimately
absolute — "never delay compressions to place an advanced airway", "always
clear before defibrillating" — to hold the ratio. Those keys would teach
something true, and they are the edit the work order's "keep keys unchanged"
was read as excluding. **This needs a decision before it continues.**

**The justification tell overshot, and the check now has a far side.** It went
past the 25% baseline to 29.9% — the previous commit had written down that a
floor cannot catch this and named ~32% as the point where a clause would start
marking the *right* answer. It kept climbing, so `check-site.mjs` grew a
two-sided bound: a row can declare an `opposite` threshold and is then checked
on both sides. Verified by setting the new ceiling below the measured value and
watching it fail.

The mechanism is the hedge problem in mirror image. Taking a justification
clause out of a **distractor** shrinks the denominator and leaves the keyed
count alone, so the share rises — which is what you want while the tell marks
distractors, and harmful once it is past chance. For the remaining domains:
leave justification clauses in distractors alone, and take them out of keys if
the number needs to come back down.

The same logic is why `hedgeCeiling` was **not** tightened this round despite
measuring 25.7%. Squeezing it below 25% would make it a tell pointing the other
way.

**Two of the three tells are closed.** Justification went 16.9% → 26.9% and
hedge 40.2% → 26.8%, both against a 25% baseline and both now within one
standard error of it. Neither a trailing ", since ..." clause nor a "per
protocol" tells a student anything about whether an option is right, which is
the whole goal. What remains on those two is holding the numbers, not moving
them.

Absolute is the one still moving: 6.2% → 14.9%, with 57% of the flagged items
already gone.

**Where distractor rewriting runs out.** Absolute has gone 6.2% → 9.3% across
five domains, and the remaining work will keep moving it, but not to 25%.
Rewriting distractors can only remove the tell; it cannot create the balancing
evidence that an absolute-worded option is *sometimes* the answer. Reaching the
baseline needs keys that are legitimately absolute — "never delay compressions
to place an advanced airway", "always clear before defibrillating" — which is a
different edit, on key wording rather than distractor wording, and one worth
agreeing before starting.
The hedge ceiling moved for the first time here — it had only ever been held,
never tightened, because until this commit the work kept pushing it the wrong
way.

## Phase 7 — Trust and polish

| Item | Status |
|---|---|
| Normalize British spellings to American | done for prose; code identifiers deliberately left |
| Terms of Use page with medical disclaimer, linked in every footer | done — every page, not just every footer |
| Footers on the 80 ochem lessons and mechanisms (they had none) | done |
| FAQPage schema on exam-day; Course schema on both hubs | **verified already done** |
| Homepage screenshots or GIFs | **won't do — reverted, Phase 8i.** Built in 8h, shipped, and taken back out at the owner's word: they do not want the tools shown on the homepage. The finding stands closed by decision, not by implementation. |
| About section with name and reviewer | needs a person |

**Terms of Use (Phase 7a).** `terms.html` covers the thing that actually
matters first: this is study material, not medical advice, and your own
protocols and medical director govern where they disagree with it. It names
the specific places that vary — a second dose of epinephrine, realigning a limb
to restore a pulse, treating a fever, implied consent for a minor — because
those are the ones this site has had to hedge in its own answer keys.

It also says plainly, under *accuracy*, that the clinical content has **not**
been reviewed and signed off by a named clinician. That is the same open item
sitting at the top of this file, and a terms page is the honest place to
disclose it rather than the place to imply otherwise.

Coverage: 89 pages link it, 13 are redirect stubs that are a meta-refresh and
nothing else, and 3 are 404/offline/ownership-token pages. Check 22 enforces
that any page with a footer link row reaches it.

**Schema: already done, and done properly.** `exam-day.html` already carries
FAQPage, and both hubs already carry Course. The part worth recording is that
the FAQ passes the test that usually fails: Google requires FAQ content to be
*visible on the page*, and all six questions and answers are, word for word,
with a dated caveat telling the reader to confirm the figures in the current
candidate handbook. Nothing to do.

A first pass at checking this reported 5 of 6 entries missing from the page. It
was comparing exact strings against headings the page shortens ("How long do
you get?" against "How long do you get for the NREMT-EMT exam?"). A matcher
that is stricter than the thing it is checking invents findings, which is the
second time that has happened here.

**Spellings: 79 in visible prose, all fixed.** Only text nodes were touched —
never a tag, an attribute, a `<script>` or a `<style>` — and that was verified
by extracting every attribute value from all 40 changed files before and after
and confirming the multisets were identical.

Four more needed hand-fixing because they were not text nodes: an `aria-label`
on a generated figure, two pieces of prose living inside JavaScript strings,
and — the one that mattered — the copy of an FAQ answer inside the ld+json
block on `exam-day.html`, which the text-node pass could not see and which
would otherwise have said "licence" three lines from a visible "license".

About 130 occurrences remain in `.js`, `.css` and `.mjs`. Those are identifiers
(`centre()`, `.centred`) and code comments. Renaming an identifier to fix a
spelling is a bad trade, and the comments are not user-visible.

**Homepage screenshots: buildable, and measured rather than guessed.** The
capture works — the headless Chromium in this environment renders the tools
over a local server, and cropping to a region is possible by loading the tool
in an offset iframe inside a fixed-size frame, which is how these numbers were
obtained with no image tooling installed.

What the measurement turned up, in order of how much it matters:

1. **Dark mode doubles it.** The site has a real dark theme. A light-theme
   screenshot on a dark page looks broken, so honest support means two
   captures per tool behind `<picture>` and `prefers-color-scheme` — four
   images for the arrow pusher and the body map.
2. **No compression tooling.** There is no PIL, no ImageMagick and no `cwebp`
   here, so the output is PNG at roughly **50 KB per crop**. Four of those is
   ~200 KB against 188 KB of images in the entire repo today. It would roughly
   double the site's image payload for two illustrations.
3. **`check-weight.mjs` would not notice**, because it deliberately excludes
   images. Being unmeasured is not the same as being free, and adding weight
   specifically where the checker cannot see it is the wrong instinct.
4. **A screenshot is a second copy of the UI with nothing checking it.**
   `build-og-images.mjs` exists precisely because hand-made images went stale —
   its own comment records a card advertising "978 practice questions" against
   a bank of 2,084. A screenshot has exactly that failure mode, and no
   `--check` can catch it because what it drifts from is a rendering.

None of that makes it a bad idea — the reviewer's point stands, the homepage
does not show what the tools look like. It makes it a **front-door design
decision with a real cost**, and the reasonable options are:

- capture all four and accept ~200 KB of lazy-loaded PNGs, regenerated by a
  script alongside `build-og-images.mjs`;
- capture light-theme only and accept that it looks wrong in dark mode;
- draw theme-aware inline SVG previews instead — near-zero weight, never
  mismatched to the palette, but schematic rather than a real screenshot;
- leave it.

Not chosen unilaterally. The capture harness works and the remaining work is
short once the direction is set.

**The 80 ochem lessons, mechanisms, tools and hub pages had no footer at all**,
which is why "linked in every footer" was true while a fifth of the site had no
route to the disclaimer. They have one now, inside an `.xshell` so it picks up
the site's gutter — a bare `<footer>` would have sat flush against the viewport
edge, since the base rule sets `max-width: 60ch` and does no centring.

Coverage is now 169 pages. What is left is 13 redirect stubs that are a
meta-refresh and nothing else, plus `404.html`, `offline.html` and the Search
Console ownership token — none of which are pages in the sense that matters.

---

## Phase 8 — 2025 AHA guideline update, per-word tells and the deferred decisions

The fourth work order — **all ten items complete**. Items are numbered as they
were given.

What is left, in the order it is worth doing, none of it in this brief:

1. **A named clinical reviewer.** 65 rows now wait on it, ten of them added
   here. Still the highest-value open item on this file, and the only one no
   amount of tooling closes.
2. **`only` at 16.0% on 106 items** — the strongest single-word tell left in
   the bank, measured and frozen but not worked.
3. **`never` at 33.3% on 21 items** — pushed there by this session's own
   absolute-key pass. Under the sample floor today, so recorded rather than
   asserted; it is the word to watch.
4. **8 of the 133 hand-written figures in `ochem/notes/`** draw measurably
   outside their canvas (worst: `pka.html`, 95 units off the left). Neither
   check 20 nor check 26 looks at hand-written SVG.
5. **Figures in the other 38 notes chapters.** Four exist; the split that made
   them practical applies to all forty.

| # | Item | Status |
|---|---|---|
| 1 | 2025 AHA choking update: flowcharts, the choking toddler scenario, the named questions, every two-finger explanation, a choking section in the notes, and a check so neither can come back | **done** |
| 2 | Chain of survival: chapter 21 to the 2025 single chain, after verifying its links | **done** |
| 3 | Per-word tell checks (entirely, completely, all, regardless / per protocol, appropriate), fix what they flag, and bring the longest-option-is-key rate toward 25% | **done** — length tell closed at 24.8%; `only` measured and frozen, not yet worked |
| 4 | Question 974: V/Q mismatch and the Haldane effect in place of hypoxic drive, keeping "don't withhold oxygen" | **done** |
| 5 | Reference cards: the impossible "M11" GCS example | **done** |
| 6 | Formulary: the nitroglycerin heart-rate contraindication, and that protocols vary | **done** |
| 7 | SN2 figure: cyanide's triple bond and lone pair, overlapping atoms, the ethyl group outside the frame | **done** |
| 8 | The remaining British spellings in visible text | **done** |
| 9 | Confirm the live site matches main (2,106 questions, Terms link) | pending |
| 10 | The three deferred decisions: notes chapters to JSON with figures; light and dark homepage screenshots, lazy-loaded; balance the absolute-word tell using only genuinely absolute keys | **done**, then the screenshots were reverted in Phase 8i at the owner's word — see Item 10b |

### Item 1 — what the 2025 guidelines actually say

Verified against the primary text before anything was edited, because the whole
point of a guideline update is that the old wording was also confidently
written down somewhere:

- **Adults** (Part 7, Adult BLS): "rescuers should perform cycles of 5 back
  blows followed by 5 abdominal thrusts until the object is expelled or the
  patient becomes unresponsive." The adult FBAO algorithm adds that if the
  rescuer cannot encircle the patient's abdomen, 5 chest thrusts are used
  instead. The change rests on a cohort of 709 patients in which back blows
  relieved more obstructions, with fewer injuries, than abdominal thrusts.
- **Children** (Part 6, Pediatric BLS): "repeated cycles of 5 back blows
  alternating with 5 abdominal thrusts." Previously abdominal thrusts alone.
- **Infants** (Part 6): "repeated cycles of 5 back blows alternating with 5
  chest thrusts (no abdominal thrusts)." The thrusts use the heel of one hand,
  which "generates greater compression depth than the previously recommended
  2-finger technique." The AHA deliberately avoids the phrase *chest
  compression* here, because rate and recoil do not apply.
- **Infant CPR** (Part 6): the 2-finger technique is eliminated "due to
  ineffectiveness of achieving proper depth"; the recommendation is the 1-hand
  or 2-thumb–encircling hands technique, and the heel of one hand specifically
  when the rescuer cannot physically encircle the chest.
- **Chain of survival** (Part 4): "we have elected to revert to a single Chain
  of Survival for all forms of cardiac arrest, whether adult or pediatric, in-
  or out-of-hospital." Six links, named above. Neonatal is out of scope and
  keeps its own Newborn Chain of Care.

### Item 1 — the named questions, and the ones that turned out to be fine

Eighteen ids were given. Twelve carried superseded guidance and were rewritten;
six did not, and are recorded here rather than edited for the sake of it.

| Question | What was done |
|---|---|
| 20, 466, 1087 | Adult key rewritten to 5 back blows then 5 abdominal thrusts; the pregnancy/obesity substitution moved into the explanation |
| 873 | Child key rewritten the same way. The infant sequence stays as the discriminating distractor — what separates a child from an infant is now only the second half of the cycle |
| 758 | Key and explanation rewritten to give the sequence by age rather than "abdominal thrusts (or back blows/chest thrusts per age)" |
| 1153 | Ordering item rebuilt: back blows added as a step, hand placement kept, six steps instead of five |
| 129, 467, 1774 | Infant explanations: heel of one hand in place of two fingers, and the 5-and-5 stated |
| 21 | Explanation updated to name back blows, and a stale sentence about a jaw-thrust option that this question does not have was removed |
| 176 | Explanation referred to "Option 1" and "Options 3 and 4" — option numbers, in a bank whose options shuffle at runtime, and wrong even unshuffled, since one of the numbers it called wrong was the key. Rewritten without numbers |
| 474, 756, 1009, 1177, 1193 | **No change needed.** Each mentions choking or abdominal thrusts, but none states guidance the 2025 update changed: thrusts are still the wrong answer for drowning, for angioedema, and for a well-fitting set of dentures |
| 1167, 1836 | **No change needed.** Both are partial-obstruction items where the answer is still to encourage coughing, and both explanations already reserve thrusts *and* back blows for a complete obstruction |

Two further questions the list did not name were found by scanning the whole
bank for the changed guidance:

| Question | What was wrong |
|---|---|
| 1757 | Asked for the infant compression technique with two rescuers. After the 2025 change its distractor "the heel of one hand over the center of the chest" became a **second correct answer**, and its explanation taught both eliminated claims — that two fingers are for a single rescuer, and that a one-hand technique is adult-only. Rewritten around the case the guidelines answer directly: a lone rescuer whose hands cannot encircle the chest |
| 917 | **No change needed.** Its explanation already said "back blows/abdominal thrusts per pediatric BLS guidelines" for a 3-year-old, which is what the 2025 sequence is |

### Item 7 — the SN2 figure, measured rather than eyeballed

All three reported faults were real, and the numbers say so:

| Fault | Measurement |
|---|---|
| Cyanide's triple bond missing | The carbon and its nitrogen were placed 28px apart with radii of 15 and 13. Bonds are drawn edge to edge, so the visible length was exactly **0**, and the triple bond rendered as three lines of no length |
| Atoms overlapping | The same pair, touching at a single point. The nitrogen also sat 1px off the left edge of the canvas |
| Ethyl group outside the frame | The terminal carbon was at y 136 with r 12 in a 140-high viewBox — **8px** below the bottom, shipping with a flat edge |

A fourth turned up while measuring: the attacking lone pair was at 200 degrees,
which put both dots inside the neighbouring nitrogen's circle. Invisible, and
read literally, drawn on the wrong atom. Both nucleophiles here are linear, so
it now sits at 0 degrees — on the group's axis, pointing at the carbon it
attacks.

Check 26 fails the build on every one of them. Verified by restoring the
original coordinate block verbatim, which produces five failures. The fix was
then rendered in headless Chromium to confirm the triple bond reads as three
lines, the lone pair as two dots facing the electrophile, and the ethyl group
as whole.

### Item 8 — why two earlier spelling passes kept leaving some behind

Both earlier passes swept text nodes. Most of the words on this site are not in
text nodes: the study-notes chapters, the scenario graph, both question banks
and every tool's copy live inside JavaScript strings, and a text-node sweep
cannot see any of them. That left **235 occurrences across 67 files**.

The difficulty was never the word list. It was telling text from names.
`stereocentre` in a sentence is a misspelling; `stereocentre` as an object key
is a name, and renaming a key silently breaks a lookup that no test would
notice. So `scripts/lib/spelling.mjs` decides what counts as visible: text
nodes, the attributes a reader sees or hears (`alt`, `title`, `aria-label`,
`placeholder`, meta `content`), and string literals of **three words or more**
— a threshold chosen because a lookup key is almost never a sentence fragment.
Nothing outside a string, a text node or a visible attribute is ever touched.

Verified structurally rather than by reading 235 diffs:

- every changed `.js` file had all its string and template literals stripped,
  and the remaining code was **byte-identical** to the committed version, in
  all 15 of them. Nothing outside a string moved;
- every changed `.html` file had its tag structure compared with the committed
  version, with visible attribute values masked. Identical in all 50. Only text
  and visible attributes moved.

Two occurrences were deliberately left:

| Left alone | Why |
|---|---|
| `analyse()` in `ochem/assets/tools/acid-base.js` prose | It names the real function `analyse(a, b)` in that file. Rewriting the sentence would make it point at nothing. The check exempts a word followed by a bracket for the same reason |
| Test names and assertion messages under `scripts/` | Developer-facing, not anything a student reads |

One occurrence could not be fixed on the page at all. `ochem/notes/radical-halogenation.html`
carries an `aria-label` that is **generated** by `scripts/build-ochem-figures.mjs`,
so the page-level edit was overwritten by the next rebuild. Check 27 caught it
immediately, which is the check working exactly as intended: it reads the
generated output, so a stale generator cannot hide behind a corrected page. The
generator string was fixed at source.

### Item 3 — the grouped tell was an average hiding two perfect giveaways

The absolute-word row read **22.7%** against a 25% baseline and looked all but
closed. Measured one word at a time, it was not:

| Word | Before | Keyed | After | Now |
|---|---|---|---|---|
| entirely | 0 / 83 | **0.0%** | 0 / 3 | — sample gone |
| completely | 1 / 71 | 1.4% | 6 / 48 | 12.5% |
| all | 8 / 191 | 4.2% | 8 / 131 | 6.1% |
| regardless | 5 / 79 | 6.3% | 7 / 70 | 10.0% |
| only | 14 / 105 | 13.3% | *not worked* | 13.3% |
| appropriate | 38 / 43 | **88.4%** | 0 / 6 | — sample gone |
| per protocol | 11 / 12 | 91.7% | 4 / 5 | — sample gone |

A student who eliminated any option containing **entirely** was right every
single time, on 83 questions. One who picked the option containing
**appropriate** was right 88% of the time, on 43. The group average survived
because `immediately` (30.3%) and `never` (22.2%) sat the other side of chance
and cancelled the rest out — which is exactly what a grouped measurement cannot
show you. Check 5(g) now measures each word on its own.

What was actually done, and it is different for each word, because the word is
doing something different in each:

- **entirely** was an intensifier bolted onto a strawman. 80 distractors lost it
  and stayed wrong for the reason they were always wrong. Three kept it, where
  the word is load-bearing: a tourniquet loose enough not to stop distal
  circulation entirely, energy absorbed entirely by clothing, a system relying
  almost entirely on standing orders. Two were rewritten by hand rather than by
  deleting a word, because deleting it would have made a false option true.
- **appropriate** was filler that made a key unfalsifiable — "appropriate
  warning devices", "appropriate channels", "appropriate resources", "appropriate
  PPE". All 38 now name the thing: warning lights and cones; the authority your
  state names; the utility crew; the PPE the hazmat team directs. Naming it is
  the improvement; closing the tell is the side effect.
- **per protocol** stays where protocols genuinely differ, which is the four
  statements this file already records as protocol-dependent. Five keys that
  were padding with it lost it.
- **completely** usually describes something real — a pain that resolves
  completely, a bag that collapses completely, a patient completely
  unresponsive with no gag. Only 28 padding uses came out, and five keys that
  are genuinely complete now say so (a TIA resolving completely, a cervix
  completely dilated, bleeding stopping completely, a reservoir bag inflated
  completely, bleeding not completely controlled).
- **all**: 96 options carried the bare intensifier **"at all"**, which is padding
  wherever it appears. That alone took the sample from 191 to 131.
- **regardless** is usually the substance of a wrong option — "transport to the
  nearest facility regardless of its capabilities" stops being wrong if you
  delete the clause. What came out was a template tail bolted onto nine
  distractors ("regardless of the patient's response to treatment" and its
  variants), which says nothing and is itself a pattern to learn. Three keys
  where universality IS the teaching point gained it: treating every patient's
  fluids as infectious regardless of diagnosis, hand hygiene after every contact
  regardless of whether gloves were worn, transport regardless of whether an
  injury is apparent.

**only** is measured, recorded and frozen at 13.3% on 105 items, and is the
strongest single-word tell left in the bank. It was not in the brief and closing
it is a pass of its own.

### Item 3 — the longest option is no longer the answer

**54% → 32% → 24.8%**, which is chance for a four-option item, on 2,004 items.

The last eight points did not come from padding distractors. They came from the
other side of the same problem: 135 keys ran 20 to 140 characters longer than
every distractor beside them, because they were carrying parenthetical
explanation that belongs in the `explain` field. One key was 331 characters. Two
sentences of it were a legal argument. Trimming those keys shortens the option
AND sharpens the item, so the tell closed with no distractor padded to close it.

Twenty-one items needed the opposite treatment, and they were this session's own
fault: taking padding out of distractors shortened them, which handed the length
tell 21 items it had not had before. Those runner-up distractors were written
out to match their keys rather than having the padding put back.

`lengthCeiling` for questions.json is now **0.25**. There is no room left to
give: at chance the number has stopped being information, and any further
movement in either direction is a new tell.

### Item 10a — the notes are data now

`scripts/check-weight.mjs` had carried the instruction for months: *"at ~160 KB
gzipped every reader downloads forty chapters to read one, and the fix from
here is to move CHAPTERS into a fetched JSON file, not to raise the budget
again."* Done.

| | Before | After |
|---|---|---|
| `nremt/study-notes.html` | 536 KB raw, **172 KB gzipped** | 58 KB raw, **18.4 KB gzipped** |
| `nremt/assets/study-notes.json` | — | 445 KB raw, 144 KB gzipped, fetched after paint |

The request starts in a script in `<head>`, so it is in flight during parse
rather than after `DOMContentLoaded`. The page renders once, when the data
lands; the `hashchange` listener is registered at the same moment, so a hash
arriving first cannot route into an empty book. A failed fetch gets a real
error state with the HTTP status and a retry button, not a permanent
"Loading…".

Four things had to move with it, and three of them would have failed silently:

- **`assets/tutor.js`** indexed the notes by scraping string literals out of
  the page's inline script. With the data gone it would have kept working and
  quietly lost the largest body of teaching text on the site. It now gets a
  third pass — a walker over the fetched JSON using the same key names, which
  is better input than regex-scraping ever was. Verified by running the real
  function over the real file: **540 passages, 379 distinct headings.**
- **`sw.js`** precaches the page. Without the data file it would work online
  and be an empty shell offline, which is the one state nobody tests. Added,
  cache bumped to v33.
- **`scripts/check-weight.mjs`** measures pages by walking `href` and `src`.
  Nothing links to a file fetched by JavaScript, so the 144 KB was invisible —
  "it is fetched separately" was about to become "it is unbounded". New
  `DATA_BUDGETS` section, and while adding it, the question banks and both
  tutor banks turned out to have been unbudgeted all along. Six files, now
  budgeted.
- **`scripts/check-a11y.mjs` and `scripts/check-console.mjs`** drive the page
  in a real browser and waited a fixed moment after load. That was fine while
  the chapters were inline; now it is a race, and they would sometimes audit a
  "Loading the notes…" paragraph. The page sets `data-content-async` up front
  and `data-content-ready` when it has rendered — on failure too, because the
  error state is worth auditing — and both checks wait for that instead.

Check 28 and `scripts/test/notes-data.test.mjs` guard the rest. The test lifts
the real walker out of `tutor.js` by name rather than reimplementing it, since
a reimplementation would pass while the real one was broken; deleting one line
of the walker fails three of the five tests.

### Item 10a — four figures, and the four ways I drew them wrong

The notes had no figures, and the reason was structural: the chapters were an
inline array in a 536 KB page, so a figure meant hand-writing SVG into a
template literal nobody could diff. With the chapters in a JSON file that stops
being true, and the drawing kit the ochem textbook uses turned out to be half
generic — `panel`, `bar`, `rule`, `arrow`, `text` and `figure` know nothing
about chemistry.

| Figure | Section | What the prose could not do |
|---|---|---|
| `ch21-chain` | 21.1 | Six links in order, with the EMT's two shaded. The notes were describing a chain in an ordered list, which is the one shape a chain is not |
| `ch9-airway-path` | 9.1 | Where a breath goes, and where the epiglottis sits in it — which is the whole reason that structure matters |
| `ch9-fbao-cycle` | 9.4 | The 2025 five-and-five as a cycle, with the one half that changes by age |
| `ch21-depth` | 21.2 | 2 in, 2 in and 1.5 in drawn against the chests they are measured in, where they stop looking like three rules |

The figure CSS moved from `ochem/assets/ochem.css` to `assets/theme.css`, since
a drawing vocabulary only half the site can reach is not a vocabulary. Net cost
is a wash: the site shell went 226.5 → 228.6 KB and the ochem shell 85.8 → 83.9.

Every one of these was drawn wrong first, and every fault was found by
rendering it:

1. **900 units wide.** `.notes-figure svg` carries `min-width: calc(--vb *
   0.92px)`, so a figure wider than the column does not shrink — it becomes a
   horizontal scroll. For a diagram whose job is a shape at a glance that is a
   worse trade than a smaller drawing. All four are now ≤ 700, and a test caps
   it.
2. **The left edge was unreachable.** The svg was centred with `margin:0 auto`,
   which centres the *overflow* too and puts the left end of a wide drawing at a
   negative offset no scrolling can reach. Every wide figure on the site was
   losing its left edge that way, ochem's included. Fixed at the source:
   `.notes-figure` is a flex column and the svg uses `align-self: safe center`,
   which centres while it fits and falls back to flex-start when it does not.
3. **Ten labels were centred on their own left margin.** `text()` defaults
   `text-anchor` to `middle`, so a heading placed at x=20 to sit against the
   left edge is centred on x=20 with half of it off the canvas. The bounds test
   read anchor coordinates and called all of them fine.
4. **The `size` option does nothing for these classes.** Every `fg-` class in
   `theme.css` sets `font-size`, and a CSS declaration beats a presentation
   attribute — so labels render at 13px however they were sized, and one
   overflowed the canvas while the test, measuring the attribute, said it fit.

Faults 3 and 4 are now in the test rather than in my memory: it measures a
label's real extent from its anchor, its text and the size its class actually
renders at. Reverting either fix fails it.

A fifth thing turned up and was not this session's to fix: **8 of the 133
hand-written figures in `ochem/notes/` draw measurably outside their canvas**
(worst: `pka.html`, 95 units off the left). Those are hand-written SVG rather
than generated, so neither check 20 nor check 26 looks at them. Measured, not
fixed — recorded here as its own piece of work.

### Item 10b — the homepage screenshots, built and then reverted

**Reverted in Phase 8i. The homepage carries no screenshots and there is no
capture harness.** `scripts/build-screenshots.mjs`, `scripts/lib/png-crop.mjs`,
`assets/shots/`, the four `DATA_BUDGETS` entries and the CI step are all gone,
and the `.shots` CSS and markup are out of `index.html`.

Why it existed: a reviewer finding said the homepage describes the tools and
never shows them. Phase 7c measured four ways to answer that, priced each, and
deliberately left the choice open rather than taking it. Item 10 of the Phase 8
work order chose one — light and dark captures, lazy-loaded — and 8h built it.

Why it is gone: what shipped was a **whole-page** capture of each tool, site
header and nav included, rendering about 700px tall apiece. The homepage then
read as two embedded copies of the site rather than two previews of a tool.
That was an execution fault, not a fault in the idea — a crop to the tool
region was half-built when the owner said plainly that they did not want the
screenshots there at all. So this closes as a decision, and the reviewer
finding above is marked won't-do rather than done.

What is worth keeping if this is ever revisited:

- **A preview must be cropped to the tool.** Shipping the page chrome is what
  made it look wrong, and it is not obvious until it is on the homepage.
- **Dark mode doubles it**, and `<picture>` + `prefers-color-scheme` is the
  wrong mechanism here: this site's theme is a localStorage value applied as
  `[data-theme]`, not the OS preference. Two `<img>` swapped by that same
  attribute is the only correct version.
- **There is no compression tooling here** — no cwebp, no ImageMagick, no PIL.
  The capture scale and the crop are the only compression available, and PNG
  of a 3D render is expensive: the cropped body map was 193 KB, above the
  124 KB budget the uncropped one fit.
- **A screenshot is a second copy of the UI with nothing checking it.** The
  answer that worked was hashing the **sources** each picture was taken from
  so `--check` fails when the tool moves on. It does not prove the picture is
  right; it proves nobody changed the tool and left the picture behind, which
  is the failure that actually happened to the og-image cards.
- Three harness faults, all real: `spawnSync` deadlocks a script that also
  serves the pages (it blocks the event loop); the body map needs
  `--use-angle=swiftshader` or headless Chromium captures its loading spinner;
  and the 3D viewer sizes its canvas from the layout it finds, so an
  offset-iframe frame drew a third-height model — crop the finished picture
  instead.

### Item 10c — the absolute tell, balanced from the key side

The decision recorded here was to balance this **only with keys that are
genuinely absolute**, and that constraint is what makes the result honest. The
bank had 450 items where a single option carried an absolute word and the key
was that option 6.2% of the time; a student who eliminated the emphatic option
was right nineteen times in twenty. Six phases of rewriting strawman
distractors took it to 22.7%. The other half of the problem was never touched:
**no key in the bank was allowed to be absolute**, including the ones where
being absolute is the whole point.

Fourteen now are. Enter only after trained personnel have cleared the
structure. Always glove and shield your eyes before contact. An EMT **must**
report suspected abuse. Pediatric bradycardia in respiratory distress **must**
be treated as impending arrest. Never push a prolapsed cord back in. Not one of
these was made absolute to move a number — each is a rule with no exceptions in
EMT practice that the bank had been stating in softer words.

| | Before | After |
|---|---|---|
| Group | 22.7% | 27.1% |
| `only` | 13.3% | 16.0% |
| `always` | 7.4% | 13.8% |
| `must` | 17.4% | 24.0% |
| `never` | 26.3% | 33.3% |

The group has crossed the baseline, so `absoluteCeiling` is what guards it now
(tightened 0.34 → 0.30) and the floor sits just under chance at 0.235.

**The first attempt overshot, in exactly the way this file has recorded twice
before.** Six of those fourteen keys said "never", which took that one word
from 26% to 44% — a new free rule, pointing the other way. Three cord-prolapse
keys carrying the identical phrase was a pattern in its own right besides. Half
were reworded to "only" or "must not", which is equally true and spreads the
load, and `never` now has its own row in check 5(g) with a **ceiling** rather
than a floor: it is the word an absolute-key pass reaches for first, and it is
the one to watch next.

The length tell was watched throughout, because adding a clause to a key is the
fastest way to make it the longest option again. It moved 24.8% → 24.6%; eight
keys were shortened during the pass to keep it there.

---

## Already settled

### Done in earlier pushes

Privacy page: the Google Fonts claim (fonts are self-hosted) and the sync
description (per-question records do sync). Exam-day malformed paragraph.
"Reactions" link label, fixed at source in `curriculum.js`. Seven molecules
redrawn with full methyls. SN2 step counter and the Below/Above slip. Step-rail
labels. Aniline nitration caveat. pKa table order. COPD oxygen settled across
notes and bank. Bleeding: tourniquet-first, elevation removed. Stroke and
motorcycle scenarios. Body map ribs and temporal bone. Seven wrong answer keys,
five clobbered option sets, eleven contradiction pairs, stale guidance (fall
height, burn cooling, newborn suctioning, CPR effectiveness, dialysis fistula),
scope framing on capnography and 12-lead items.

### Verified as **not a defect** — no change made or needed

| Claim | Finding |
|---|---|
| Pelvic binder taught at the iliac crest | False. That text is the anatomical location of the pelvis. `study-notes.html` already says greater trochanters. Phase 1 rewords it anyway so it cannot be misread. |
| Chapter 33 teaches the long backboard as default | False. It already teaches spinal motion restriction and calls the backboard a transport device. |
| Changelog is future-dated | False. UTC date, correct. |
| "58 lessons" contradicts "62 topics" | Both true and already distinguished: 58 lesson pages plus SN1/SN2/E1/E2 whose primary page is a mechanism walkthrough. `check-site.mjs` enforces it. |
| "Sign in to sync" overpromises | Backwards. Sync does carry per-question records; the privacy page was the inaccurate half, and was fixed. |
| Questions 2028/2029 share copied options | False positive of naive similarity. Two musculoskeletal definitions drawing on the same four terms, both correct. |
| Nav links to `/index.html` split search signals | Internal links are relative and canonicals handle it. Not worth the churn. |

### Deliberately not done

| Item | Why |
|---|---|
| Making the repo private | Would not protect the banks (the browser fetches them as plain JSON) and would unpublish the site on a free plan. A license is the real answer. |
| Removing the site's self-critical asides | The candour is what makes the honesty claims credible. Only the doorbell line goes, as a single joke too many on a page about deletion rights. |

---

## Automated checks now guarding these

`scripts/check-site.mjs`, run in CI on every push:

1. Local references resolve · 2. JSON parses · 3. Sitemap resolves ·
4. Lesson-concept map · 5. Answer tells: keyed position, option length,
true/false polarity, select-N key sets, **absolute words**, **hedge words**,
**trailing justification clauses** · 6. Advertised question counts ·
7. Sitemap completeness · 8. Advertised ochem counts (including the
assistant's greeting, which is in a script rather than a page) · 9. Tool tiles ·
10. Unique question ids · 11. Error reporters load first ·
12. **Molecule valence** · 13. **Scenario graph** · 14. **Copied option sets** ·
15. **Flow-diagram branches** · 16. **Tables inside a scroll wrapper** ·
17. **Figures that appear on more than one page agree** ·
18. **Advertised scenario count**, and scenario nodes must be able to reach an
ending, not merely be reachable from the start ·
19. **Every lesson and mechanism links to its written section**, in the body
rather than the head · 20. **Generated figures draw inside their own canvas**,
and carry alt text and a caption · 21. **No textbook section explains the same
thing twice** across its body, callouts and captions ·
22. **A page with a footer link row reaches terms.html** ·
23. **Superseded resuscitation guidance cannot come back** ·
24. **The bank cannot outgrow the option letters the page can render** ·
25. **No impossible Glasgow Coma Scale score**, and a total written beside a
triple has to be the sum ·
26. **Hand-placed molecule diagrams are actually drawable** — inside the
canvas, no touching circles, no bond with nothing to draw, no lone pair sitting
on a neighbor ·
27. **No British spelling in anything a reader sees** — text nodes, the
attributes a reader hears or sees, and string literals of three words or more ·
28. **The study notes and their data file stay in step** — the file parses, no
two sections share an id, the page still fetches it, sw.js still precaches it,
the chapters have not been pasted back inline, and every page claiming a
chapter count agrees with the data ·
8 now also covers
**advertised section counts**, with changelog.html exempt because a dated
entry is a record rather than a claim about now

Bold entries were added in response to these reviews. Each was verified by
reintroducing the defect it exists to catch.

`scripts/check-curriculum.mjs`, also in CI, guards the two ways the ochem
course map can mislead a student without breaking a page:

- **No topic is a dead end.** A bare `href: null` fails. A topic must point at
  its interactive lesson, or at its own written notes with `notesOnly: true`,
  which is what puts the "coming soon" label on every surface listing it — and
  the check confirms the label actually reached the generated page.
- **Mastery cannot overstate coverage.** It fills in a perfect score for every
  lesson that exists and fails if the headline number reaches 100 while any
  topic is untracked — and fails the other way too, if every topic is tracked
  and a perfect run still cannot reach 100, so the check can never be satisfied
  by making mastery unreachable.
- **No lesson names the wrong chapter.** Every "Module N · Chapter title"
  eyebrow is compared to the chapter the lesson is actually in. Inserting a
  chapter renumbers everything below it, which breaks nothing and misinforms
  every reader of those pages.

What a topic *is* comes from where its `href` points, not from the flag alone,
because the flag was the thing that could be silently deleted.

Checks 16 and 17 both came out of Phase 4 catching this session's own work.
Check 16 found four tables added to the notes without the scrolling wrapper
every other table on the site already had, plus one more on a page nobody had
looked at. Check 17 exists because two numbers — the adult suction limit and
the non-rebreather flow rate — had drifted into two values across pages; it is
a short list of repeated figures, not a fact-checker, and it should grow a row
only when a number starts appearing in a second place.

Check 23 is the one that most repaid the reintroduction habit. It reads every
block of prose the site can show a learner and fails on a unit that
*prescribes* the superseded guidance — not one that merely mentions it, since
the sentences that fixed the site all name the old technique in order to
correct it. Nine defects were put back to test it. The first version caught
five. The four it missed were all the same shape, a unit too small to carry its
own context:

- a flowchart box reading "Abdominal thrusts, repeated", with the word
  *obstruction* only in the `<h2>` above it;
- a notes table cell reading "5 abdominal thrusts", with the back blows in the
  row above and the word *choking* in a JavaScript `title:` key rather than any
  HTML heading;
- the same table again, because a `<div class="table-wrap">` matched as one
  block and flattened the whole grid, so a row saying "Abdominal thrusts are
  not used at this age" excused every other cell beside it;
- and then every table cell at once, because a single alternating regex walks
  the file left to right, so matching the wrapping `<div>` consumed its `<td>`s
  before they could be seen.

So a unit now carries the heading above it and, for a cell, the table around
it; a rule's *prescribes* half is tested against the block alone and its
*topic* half against the wider scope; exemptions are read from the block, never
the scope; and the tags are scanned one at a time rather than in one
alternation. Distractors are out of scope by design — a wrong answer is often
required to state the superseded technique, which is what makes it wrong — so
only stems, keyed options and explanations are read.

The wording-tell thresholds are set at the bank's measured state, not at
the target, following the convention already used for the ochem ceilings: they
stop the numbers getting worse while the editorial work in Phase 6 happens.
Lower them as that work lands. Never raise one.
