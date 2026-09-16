# Proposed chapter and lesson order

Status: **proposal, not applied.** Nothing in `curriculum.js` has moved. This
document is the output of Step 1 of the self-study pass; the reorder waits on
Olivier's approval. The evidence behind it is `docs/concept-map.json`: for
every one of the 116 sections, what it teaches, what it relies on and where
that is taught, and every forward reference a fresh reader would hit.

The map was built by four independent readers, one per block of chapters,
each reading the written section and the interactive lesson of every topic in
its block. It found **~130 forward references** (a term, reagent or idea used
before the course teaches it). Roughly half are labeled previews and fine.
The rest fall into a small number of structural causes, and the order below is
built to remove those causes rather than patch each symptom.

## What is wrong with the current order

1. **Reactivity ideas are taught nowhere, then used everywhere.** The Hammond
   postulate is never introduced — `radical-halogenation` says "the Hammond
   postulate again", `markovnikov` treats it as known — and carbocation
   stability, hyperconjugation and rearrangements are first explained inside
   `sn1`, after `newman` and `radical-halogenation` have already leaned on
   them. Energy diagrams, intermediates versus transition states and
   rate-versus-equilibrium have no home at all. Klein gives these a chapter
   (6, *Chemical Reactivity and Mechanisms*) and Wade gives them one (4, *The
   Study of Chemical Reactions*, which uses chlorination as the model). This
   course needs the same.
2. **Radical halogenation sits in Alkanes** (chapter 5) but needs carbocation
   stability, the Hammond postulate, racemization, Br₂ addition to alkenes and
   Markovnikov/peroxide HBr — five ideas from chapters 7 and 8.
3. **Nucleophiles, electrophiles and leaving groups come before Acids &
   Bases**, so all three lessons carry inline pKa primers, and
   `leaving-groups` teaches tosylates, SOCl₂ and PBr₃ eight chapters before
   `alcohol-reactions`.
4. **Synthesis (18) plans with reactions from 20 and 21**: Grignard + CO₂,
   aryl Grignards, Wittig, Michael addition, malonic ester — all used in
   `carbon-carbon-bonds` and `functional-group-interconversion` before they
   are taught. This is the known issue, confirmed and enumerated.
5. **Carbonyl & Enolate Breadth (21) is five lessons that belong in three
   earlier chapters.** `imines-enamines` re-teaches a `nucleophilic-addition`
   section; `enolate-regiochemistry` (14) already tests the Stork enamine
   route; `aldol` (14) uses Michael/Robinson and cuprates; `carbon-carbon-bonds`
   (18) uses the Wittig. A breadth chapter at the end is the wrong shape for
   material every chapter before it wants.
6. **Amines (15) come before Aromatic Chemistry (16)**, but the
   pyridine/pyrrole basicity argument in `amine-structure` is an aromaticity
   argument. Both Klein (22 after 17–18) and Wade (19 after 16–17) put amines
   after aromatics.
7. **Within chapters, several lessons assume a sibling that comes later**:
   `bronsted` quizzes conjugate pairs two lessons before `conjugate`;
   `enantiomers`/`diastereomers`/`meso` use (2R,3S) descriptors before
   `rs-configuration`; `e1` treats E2 as known (the prose was written for the
   order SN2, SN1, E2, E1); `resonance` pushes curved arrows one lesson before
   `curved-arrows`.
8. **E/Z notation lives in `alkene-structure` (8) but is used by `e2` (7) and
   pointed at "the Stereochemistry chapter" by `naming-rings-unsaturation`.**
   Klein teaches cis/trans and E/Z as the opening of Stereoisomerism (5.1).
9. **Redox (12) holds alkene reactions.** `alkene-oxidation` and
   `hydrogenation` are used by `alkene-structure`, `alkynes` (heats of
   hydrogenation) and `epoxides` (mCPBA) long before chapter 12; both
   textbooks keep them in the alkene chapter.
10. **Duplicated teaching**: `alcohol-reactions` (10) teaches the full
    PCC/Jones/Swern ladder that `alcohol-oxidation` (12) teaches again;
    `diazonium-chemistry` (22) substantially repeats `amine-reactions` (15);
    `conformational-analysis` (5) substantially teaches the E2 axial rule
    that `e2` teaches.

## The proposed order

Twenty-three chapters, as now. Moves are marked **→**, splits **⊂**, new
lessons **★**. Everything unmarked stays where it is.

| # | Chapter | Lessons, in order |
|---|---|---|
| 1 | Foundations | atomic-structure, orbitals, hybridization, bonding, electronegativity, formal-charge, lewis-structures, molecular-geometry, bond-polarity, **functional-groups ★** (added in Step 2) |
| 2 | Drawing Organic Molecules *(renamed from Organic Structure & Electron Movement)* | skeletal-structures, **curved-arrows →** (up one), resonance |
| 3 | IUPAC Nomenclature | naming-parent-chain, naming-substituents, naming-functional-groups, naming-rings-unsaturation |
| 4 | Acids & Bases | bronsted, **conjugate →** (up one), pka, acidity-factors, **lewis-acids →** (to last) |
| 5 | Alkanes & Conformations | newman, cyclohexanes, axial-equatorial, ring-flips, conformational-analysis **⊂** (its E2 half goes to e2) |
| 6 | Stereochemistry | chirality, stereocenters, **rs-configuration →** (up three), enantiomers, diastereomers, meso, fischer, **cis-trans-ez ★** (split out of alkene-structure) |
| 7 | How Reactions Happen **★ new chapter** | **nucleophiles →**, **electrophiles →**, **electron-rich-poor →**, **leaving-groups →** (all from 2; leaving-groups **⊂** loses its alcohol-activation half to 11), **energy-diagrams ★** (reaction coordinates, intermediates vs transition states, rate vs equilibrium, the Hammond postulate), **carbocations ★** (stability order, hyperconjugation, resonance, rearrangement — carved out of sn1), **radical-halogenation →** (from 5) |
| 8 | Substitution & Elimination | sn2, sn1, **e2 →** (before e1), e1, substrate-effects |
| 9 | Alkenes & Alkynes | alkene-structure **⊂** (keeps stability and degrees of unsaturation), **electrophilic-addition ⊂** (HX, hydration, Markovnikov, rearrangements — from addition-reactions + half of markovnikov), **bridged-additions ⊂** (Br₂, halohydrin, anti stereochemistry — from addition-reactions), **anti-markovnikov ⊂** (hydroboration–oxidation, peroxide HBr, the syn/anti summary — from markovnikov), **alkene-oxidation →** (from 12), **hydrogenation →** (from 12), alkynes |
| 10 | Conjugation & Pericyclic Reactions | conjugated-systems, diene-addition, kinetic-thermodynamic, diels-alder, uv-vis |
| 11 | Alcohols, Ethers & Epoxides | alcohol-reactions **⊂** (activation, substitution, dehydration; oxidation ladder goes to 13; receives the tosylate/SOCl₂/PBr₃ material from leaving-groups), ether-chemistry, epoxides |
| 12 | Carbonyl Chemistry | aldehydes-ketones, nucleophilic-addition **⊂** (mechanism and hydride), **organometallic-addition ⊂** (Grignard/RLi to C=O, the 1°/2°/3° alcohol rule — the other half of nucleophilic-addition), hydrates-cyanohydrins, acetals, **imines-enamines →** (from 21), **wittig-reaction →** (from 21), aldehyde-oxidation |
| 13 | Oxidation & Reduction | oxidation-states, alcohol-oxidation (absorbs the ladder from alcohol-reactions), carbonyl-reduction, **baeyer-villiger →** (from 21) |
| 14 | Carboxylic Acids & Derivatives | carboxylic-acids, esters-amides, acyl-substitution, acyl-chlorides-anhydrides, nitriles |
| 15 | Organometallics **→** (from 20) | organometallic-bonding, grignard-reagents, organolithium-reagents, gilman-reagents, cross-coupling |
| 16 | Enolate Chemistry | alpha-hydrogens, aldol, claisen, alpha-halogenation, enolate-regiochemistry, **ester-syntheses →** (from 21), **michael-robinson →** (from 21) |
| 17 | Aromatic Chemistry | aromaticity, **eas-mechanism ⊂** (the arenium ion, why substitution not addition), **eas-reactions ⊂** (the five reactions, Friedel–Crafts limits), directing-effects |
| 18 | Amines **→** (after aromatics) | amine-structure, amine-reactions, amine-synthesis, hofmann-elimination |
| 19 | Aromatic Follow-Through | nucleophilic-aromatic, benzylic-reactivity, phenols, birch-reduction, diazonium-chemistry (trimmed of what amine-reactions already teaches) |
| 20 | Spectroscopy | ir, **nmr-shift ⊂** (shielding, ppm, integration, equivalence), **nmr-splitting ⊂** (n+1, J, exchangeable protons, working a spectrum), c-nmr, mass-spec |
| 21 | Synthesis & Retrosynthesis | retrosynthesis, carbon-carbon-bonds, functional-group-interconversion, protecting-groups, multistep-synthesis |
| 22 | Biomolecules | carbohydrates, amino-acids, peptides-proteins, lipids, nucleic-acids |
| 23 | Polymers | polymer-basics, addition-polymers, condensation-polymers, polymer-properties, polymer-design |

Carbonyl & Enolate Breadth disappears as a chapter; its five lessons are
redistributed (three to 12, one to 13, two to 16 — wittig and imines to
Carbonyl, Baeyer–Villiger to Redox, the two enolate reactions to Enolate).

### Why this order, chapter by chapter

- **1–6 are the textbooks' opening six** (structure, drawing, naming, acids,
  conformations, stereochemistry), and they are already right except for
  the intra-chapter swaps. Curved arrows go before resonance because arrows
  are the notation and resonance is the first thing drawn with it — Klein
  2.7 then 2.8. Conjugate pairs go before pKa because pKa is defined on a
  conjugate pair. R/S goes before enantiomers/diastereomers/meso because
  every relationship test in those lessons is "compare the descriptors".
  Lewis acids close Acids & Bases because their payoff is the
  nucleophile/electrophile vocabulary that opens chapter 7.
- **7 is the missing chapter.** Its first four lessons already exist and only
  move; the two new ones are short (energy diagrams and the Hammond
  postulate; carbocation stability and hyperconjugation, most of which is
  already written inside `sn1` and would be carved out rather than
  rewritten). Radical halogenation closes the chapter for Wade's reason: it
  is the cleanest place to *use* a reaction-energy argument, and by then
  everything it needs — radical stability by the same hyperconjugation
  argument as carbocations, Hammond for Br₂ against Cl₂, racemization at a
  stereocenter — has been taught. Its final question (peroxide HBr) moves to
  `anti-markovnikov`.
- **8 keeps E2 before E1** because the prose already assumes it, and because
  E2 is the one that needs the conformational-analysis material; E1 then
  reads as "SN1's other branch".
- **9 splits the addition lesson three ways** along the mechanism boundary —
  carbocation additions, bridged-ion additions, and the two anti-Markovnikov
  methods — which is how both textbooks section it and how exams group it
  ("which reagent gives syn/anti/Markovnikov/anti-Markovnikov"). Alkene
  oxidation and hydrogenation return to the alkene chapter so that heats of
  hydrogenation, epoxidation (needed by epoxides in 11) and ozonolysis are
  available when alkenes are.
- **11 receives alcohol activation from leaving-groups** so that tosylates,
  SOCl₂ and PBr₃ are taught once, where alcohols are, and gives up the
  oxidation ladder to 13 so that it is taught once, where oxidants are.
- **12 gains imines/enamines and the Wittig** because both are nucleophilic
  additions to a C=O and both are used by 13, 16, 18 and 21. The Grignard
  half of nucleophilic-addition becomes its own lesson so that the first
  meeting with organometallics is a carbonyl lesson (as in Klein 13 / Wade
  10), and chapter 15 then deepens it.
- **15 Organometallics comes right after the acid derivatives** because the
  chapter's core argument — an acid chloride or ester adds two equivalents —
  needs the derivatives, and because everything after it (Michael with
  cuprates in 16, Synthesis in 21) wants it. Cross-coupling's aryl halides
  become a labeled preview of 17.
- **17 before 18** for the basicity argument; **18 before 19** because
  diazonium chemistry starts from an aniline.
- **20 Spectroscopy stays after aromatics.** Klein (14–15) and Wade (12–13)
  put it before the carbonyl chapters, and that would be the textbook-standard
  alternative; keeping it here means every functional group is known when
  spectra are read, and Synthesis follows immediately, which is where
  "confirm the product" is used. Decision for Olivier below.
- **21 Synthesis is now after everything it plans with.**

## Every lesson that would move

| Lesson | From → to | Reason |
|---|---|---|
| curved-arrows | 2 (3rd) → 2 (2nd) | resonance uses arrows |
| conjugate | 4 (4th) → 4 (2nd) | pka is defined on conjugate pairs; bronsted quizzes them |
| lewis-acids | 4 (2nd) → 4 (5th) | bridge into nucleophiles/electrophiles |
| rs-configuration | 6 (6th) → 6 (3rd) | enantiomers/diastereomers/meso use R/S |
| nucleophiles, electrophiles, electron-rich-poor, leaving-groups | 2 → 7 | need pKa and basicity, which chapter 4 now precedes |
| radical-halogenation | 5 → 7 (last) | needs Hammond, carbocation/radical stability, racemization |
| e2 | 8 (4th) → 8 (3rd) | e1 assumes E2 |
| alkene-oxidation, hydrogenation | 12 → 9 | used by alkenes, alkynes, epoxides |
| imines-enamines, wittig-reaction | 21 → 12 | nucleophilic additions used by 13, 16, 18, 21 |
| baeyer-villiger | 21 → 13 | an oxidation, used by aldehyde-oxidation |
| organometallic-bonding, grignard-reagents, organolithium-reagents, gilman-reagents, cross-coupling | 20 → 15 | needed by 16 and 21 |
| ester-syntheses, michael-robinson | 21 → 16 | enolate reactions used by aldol, enolate-regiochemistry, 21 |
| amine-structure, amine-reactions, amine-synthesis, hofmann-elimination | 15 → 18 | basicity argument needs aromaticity |

## Sections to split

| Section | Split into | Why |
|---|---|---|
| addition-reactions + markovnikov | electrophilic-addition · bridged-additions · anti-markovnikov | one lesson covers five mechanisms; exams test them by reagent class |
| alkene-structure | alkene-structure · cis-trans-ez (→ Stereochemistry) | E/Z is used by e2 and named by nomenclature before chapter 9 |
| leaving-groups | leaving-groups (concept, pKaH ranking, the SN/E names) · alcohol activation (→ alcohol-reactions) | three jobs in one lesson; the second belongs with alcohols |
| conformational-analysis | conformational-analysis (A-values, cis/trans patterns) · E2 axial requirement (→ e2) | the second half is an E2 lesson |
| sn1 | sn1 · carbocations (→ chapter 7) | stability/hyperconjugation/rearrangement are used before sn1 |
| alcohol-reactions | alcohol-reactions (activation, substitution, dehydration) · oxidation ladder (→ alcohol-oxidation) | taught twice today |
| nucleophilic-addition | nucleophilic-addition (mechanism, hydride) · organometallic-addition | 1360 words, two ideas, both heavily tested |
| eas | eas-mechanism · eas-reactions | 1100 words; the lesson skips nitration and sulfonation for lack of room |
| h-nmr | nmr-shift · nmr-splitting | 1386 words; the lesson never reaches J values or D₂O exchange |
| hybridization (optional) | core · consequences (s-character, acidity) | 2075 words, the longest section in the course; the acidity half duplicates acidity-factors |

## What the reorder does not fix, and what does

About sixty forward references are **order-independent** and are being fixed
in Step 3 regardless of the reorder: unlabeled name-drops (LDA in e2, DBU in
substrate-effects, Strecker in alpha-halogenation), ideas used with no home
anywhere (HOMO/LUMO in diels-alder and uv-vis, oxymercuration in
addition-reactions and ether-chemistry, E1cb defined inline in aldol and
relied on by hofmann-elimination, hard/soft in gilman-reagents, Haworth
projections in carbohydrates, nitroarene reduction, σ* orbitals in newman).
Each gets either a short labeled preview, a paragraph where it is first
needed, or — for HOMO/LUMO and oxymercuration — a decision below.

Everything that is only wrong *because of position* (an "earlier"/"later"
that becomes true once the order changes, a duplicated section that becomes
a cross-reference) is logged under **Waiting on reorder** in TRACKER.md and
left alone, so that the fixes are made once, against the approved order.

## Decisions for Olivier

1. **Approve the order above**, or say which moves to drop. The two that are
   most disruptive and most valuable are chapter 7 and dissolving Carbonyl &
   Enolate Breadth.
2. **Two new lessons** (energy-diagrams, carbocations) and one split-out
   (cis-trans-ez). Each is 600–900 words plus an 8-step lesson and 30
   questions; the carbocations material mostly exists inside sn1.
3. **Spectroscopy placement**: keep at 20 (recommended above) or move to
   textbook position after chapter 11.
4. **HOMO/LUMO**: add a short frontier-orbital lesson to Conjugation
   (recommended — Diels–Alder and UV-Vis both lean on it), or rewrite both to
   avoid it.
5. **Oxymercuration–demercuration**: teach it in electrophilic-addition as the
   rearrangement-free Markovnikov hydration (recommended, one paragraph and
   one question), or delete the two mentions.
6. **Chapter 2's title**: "Drawing Organic Molecules" once nucleophiles and
   leaving groups leave it, or keep the current title.
