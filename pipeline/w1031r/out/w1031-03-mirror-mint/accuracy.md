# Accuracy log w1031-03-mirror-mint (premium rebuild 2026-11-09)

Script (voiced, eleven_v4 Jeremy, take 2 of 3, 5 percent speed up):
"Mint and rye bread get their smell from mirror image molecules. Take the spearmint in his hand. Its smell is a molecule called carvone. And the rye bread's smell comes from the caraway seeds baked into it, which are full of carvone too. Same atoms. Same bonds. But one is FLIPPED, like his left hand and his right. Lay one on the other, and no matter how he turns it, it never lines up. Chemists call that kyral. [curious] So how does his nose tell them apart? The smell receptors inside it are kyral too, so each version fits them differently. One smells like mint... and its mirror image, like rye bread. Free practice for this on levlprep dot com."

## Claims checked
- Spearmint's smell is (R)-(-)-carvone; caraway's is (S)-(+)-carvone, "a spicy aroma with notes of rye". Sources: LibreTexts "Stereoisomerism and Smell"; Wikipedia "Carvone"; PMC11107518 (enantiomer selective olfactory receptor for carvone). PASS.
- Caraway seeds give seeded rye bread its familiar smell (the loaf shown is a seeded rye with caraway in the crust and crumb). PASS (the line says "this" rye bread's smell comes from the seeds baked into it).
- Same atoms, same bonds, mirror images that cannot be superimposed = chiral (enantiomers). PASS.
- Smell receptors are chiral proteins and respond differently to each enantiomer ("several olfactory receptors are chiral and register certain enantiomers more strongly than others", LibreTexts). "Each version fits them differently" PASS.
- Hand analogy: hands are the textbook chiral pair. PASS.

## Motions and drawings checked
- Molecules: RDKit 3D coordinates of CC1=CC[C@H](CC1=O)C(C)=C, CIP assigned by rdCIPLabeler = R (spearmint). Its mirror image is drawn as the exact reflection (x -> -x) of the R model, so it is (S). Proper rotations only for every view (determinant checked). Heavy atoms plus the stereocentre H.
- Stacking attempt: the R model is slid onto the S model and turned by the best fit proper rotation (Kabsch on ring, methyl and C=O); the core lines up, the isopropenyl group at the stereocentre points elsewhere (3.8 to 5.5 A off) and is marked red. Correct: no proper rotation superimposes enantiomers.
- Mirror shot: dotted reflection lines join each atom to its twin straight across the mirror line (true reflection).
- Hands: point of view, palms toward him: right thumb points right, left thumb points left (correct for your own palms). Laying left on right: thumbs on opposite sides. Turning the left hand over shows its back (nails, knuckles) with the thumb on the right; the palm then faces away, so it still does not match. Correct.
- Receptors: two DIFFERENT receptor proteins (never mirror images of each other, since all are built from the same handed amino acids), on the cilia membrane of smell neurons under the mucus; each carvone form docks into the one it fits and a signal runs down its nerve. Two receptors stand for the real pattern of several receptors (said in nose.py).
- The cook: one skinned body (people kit). Near hand grips the sprig stem (stem drawn behind his fingers); far hand rests flat on the worktop, reaches to the rye slice, grips it, and only then does the slice move, carried by the hand to his nose. Nothing moves by itself.
- Changes from the old build fixed: the old receptor scene used a receptor and its mirror image (misleading); now two different receptors.

## Human read, pronunciation, search phrase
- Self human read (no separate subagent tool was available in this run): story voice kept third person ("his hand", "his nose"), premises before the payoff, no banned tics, one question, one pause, one stressed word, one gentle tag.
- Pronunciation: pronounce.py clean; "chiral" spoken as "kyral" (added to pronounce.json: shown chiral, spoken kyral). Captions show "chiral".
- Search phrase "mirror image molecules": spoken at 2.29 s, on screen from frame 0 (title).
