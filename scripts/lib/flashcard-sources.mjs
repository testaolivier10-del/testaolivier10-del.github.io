/* Where the ochem flashcard deck comes from.

   The deck is not a second copy of the course typed out as cards. Three
   sources feed it, and two of them are things the course already has:

     1. CONCEPT CARDS — one per concept in ochem/assets/concepts.js, with the
        concept's one-line `hint` and its micro-lesson from concept-teach.json
        on the back. These are NOT built here: flashcards-page.js assembles
        them in the browser from the same two files Practice uses, so a
        corrected teach string corrects the card with no rebuild.

     2. TABLE CARDS — the reference tables already written into the notes
        (ochem/notes/<topic>.html): pKa values, IR and NMR landmarks,
        reagent -> product menus, directing effects, and so on. TABLES below
        says which tables become cards and how each row should be asked. The
        cell text is read out of the notes by scripts/build-flashcards.mjs, so
        a value corrected in the notes is corrected on the card at the next
        build, and `--check` fails CI until that build is run.

     3. AUTHORED CARDS — AUTHORED below. Named reactions and rules that the
        notes explain in prose rather than in a table, so there is no cell to
        read them out of. Each one names the topic whose notes teach it, and
        each was written against that section; if a section's account of a
        reaction changes, the card here has to change with it. Keep this list
        short: anything that could come out of a table should.

   Card ids are what a learner's schedule is keyed by, so they must not move:
     table cards    t:<table id>:<slug of the row's key cell(s)>
     authored       a:<id>
     concepts       c:<concept id>          (built in the browser)
   Renaming a table id, or rewording a row's key cell, gives those cards new
   ids and resets their schedule — acceptable for a genuine rewrite, worth
   avoiding for a cosmetic one.

   TABLES entries:
     id     stable id for the table (part of every card id — never recycle)
     topic  the curriculum topic, which is also the notes file name
     head   the table's header cells, in order, exactly as the notes print them
            (tags stripped). The build locates the table by this and FAILS if
            it no longer matches, so a restructured table gets looked at rather
            than silently turned into nonsense cards.
     key    the column (or columns) that name the row — the card's front.
            Must be unique within the table; the build fails otherwise.
     ask    the question printed above the key on the front.
     sep    for a multi-column key, what joins the cells (default ' · ').
     front  instead of `sep`, a function from the key cells to the front text.
     labels answer labels to print instead of a header cell, by column index,
            for a header that reads well in a table and badly on a card.
     pairs  the table is two (key, value) tables side by side: split each row.
   A table whose first header cell is empty is a COMPARISON (rows are
   attributes, columns are the things compared); every row becomes a card
   asking for that attribute across the columns, and `ask` may be omitted. */

export const TABLES = [
  /* ---- Foundations ---------------------------------------------------- */
  { id: 'bonds', topic: 'bonding', head: ['Bond', 'Length', 'Strength', 'Made of'], key: 0,
    ask: 'Length, strength, and what it is made of?' },
  { id: 'en-values', topic: 'electronegativity', head: ['Element', 'EN', 'Element', 'EN'], key: 0, pairs: true,
    ask: 'Pauling electronegativity?' },
  { id: 'en-bond-type', topic: 'electronegativity', head: ['ΔEN', 'Bond type', 'Example'], key: 0,
    ask: 'Electronegativity difference — what kind of bond? An example?' },
  { id: 'valence', topic: 'lewis-structures', head: ['Atom', 'Valence e⁻', 'Bonds', 'Lone pairs', 'Why'], key: 0,
    ask: 'In a neutral molecule: valence electrons, bonds, lone pairs?' },
  { id: 'vsepr', topic: 'molecular-geometry', head: ['Groups', 'Lone pairs', 'Shape', 'Angle', 'Example'], key: [0, 1],
    front: ([groups, lp]) => `${groups} electron groups, ${lp} lone pair${lp === '1' ? '' : 's'}`,
    ask: 'Molecular shape, bond angle, and an example?' },
  { id: 'fg', topic: 'functional-groups', head: ['Group', 'Structure', 'Name preview', 'An example you have met'], key: 0,
    ask: 'What does it look like, and how is it named?' },
  { id: 'carbonyl-family', topic: 'functional-groups', head: ['Attached to the C=O carbon', 'Group', 'Condensed'], key: 0,
    ask: 'This is attached to the C=O carbon. Which group is it?' },

  /* ---- Nomenclature --------------------------------------------------- */
  { id: 'suffix-prefix', topic: 'naming-functional-groups', head: ['Group', 'As suffix', 'As prefix'], key: 0,
    ask: 'Suffix as the principal group — and the prefix when it is demoted?' },
  { id: 'common-names', topic: 'naming-functional-groups', head: ['Common name', 'Systematic name', 'Preferred IUPAC name (2013)'], key: 0,
    ask: 'Systematic name, and the preferred IUPAC name?' },

  /* ---- Acids & bases -------------------------------------------------- */
  { id: 'pka', topic: 'pka', head: ['Acid', 'pKa', 'Conjugate base'], key: 0,
    ask: 'Approximate pKa, and its conjugate base?' },
  { id: 'induction-pka', topic: 'acidity-factors', head: ['Acid', 'pKa', 'Effect'], key: 0,
    ask: 'pKa — and which inductive effect does it show?' },

  /* ---- Conformations -------------------------------------------------- */
  { id: 'butane', topic: 'newman', head: ['Conformation', 'Dihedral', 'Type', 'Energy'], key: 0,
    ask: 'Butane conformation: dihedral angle, type, relative energy (kcal/mol)?' },
  { id: 'torsional-costs', topic: 'newman', head: ['Interaction', 'Kind', 'Cost (kcal/mol)'], key: 0,
    ask: 'What kind of strain, and what does it cost?' },
  { id: 'ring-strain', topic: 'cyclohexanes', head: ['Ring', 'Total strain', 'Dominant problem'], key: 0,
    ask: 'Total ring strain (kcal/mol), and the main source of it?' },
  { id: 'ring-interactions', topic: 'conformational-analysis', head: ['Direct interaction', 'Where it appears', 'Cost (kcal/mol)'], key: 0,
    ask: 'Where does it appear on a ring, and what does it cost?' },

  /* ---- How reactions happen ------------------------------------------ */
  { id: 'induction-vs-resonance', topic: 'electron-rich-poor', head: ['', 'Induction', 'Resonance'] },
  { id: 'leaving-groups', topic: 'leaving-groups', head: ['Leaving group', 'Conjugate acid', 'pKaH', 'Verdict'], key: 0,
    ask: 'Conjugate acid, its pKa, and how good a leaving group is it?' },
  { id: 'ts-vs-intermediate', topic: 'energy-diagrams', head: ['', 'Transition state', 'Intermediate'] },
  { id: 'benzylic', topic: 'benzylic-reactivity', head: ['Intermediate', 'Benzylic version is', 'Roughly as stable as'], key: 0,
    ask: 'The benzylic version: why stabilized, and roughly as stable as what?' },
  { id: 'radical-selectivity', topic: 'radical-halogenation', head: ['Relative rate per hydrogen', '3°', '2°', '1°'], key: 0,
    ask: 'Relative rate per hydrogen at 3°, 2° and 1° carbons?' },
  { id: 'radical-abstraction', topic: 'radical-halogenation', head: ['Abstraction', 'Bond broken', 'Bond made', 'ΔH'], key: 0,
    ask: 'Bond broken, bond made (kcal/mol), and ΔH of the step?' },

  /* ---- Substitution & elimination ------------------------------------ */
  { id: 'sn2-sterics', topic: 'sn2', head: ['Substrate', 'Relative rate'], key: 0,
    ask: 'Relative SN2 rate?' },
  { id: 'sn2-vs-e2', topic: 'e2', head: ['', 'SN2', 'E2'] },
  { id: 'mechanism-square', topic: 'e1', head: ['', 'Substitution', 'Elimination'] },
  { id: 'reagent-types', topic: 'substrate-effects', head: ['Reagent type', 'Examples', 'Drives'], key: 0,
    ask: 'Examples, and which mechanism does it drive?' },
  { id: 'substrate-grid', topic: 'substrate-effects',
    head: ['Substrate', 'Strong Nu, weak base', 'Strong base', 'Bulky base', 'Weak Nu/base'], key: 0,
    ask: 'This substrate with each kind of reagent — which mechanism wins?' },

  /* ---- Alkenes & alkynes --------------------------------------------- */
  { id: 'alkene-stability', topic: 'alkene-structure', head: ['Alkene', 'Substitution', 'ΔH°hyd (kcal/mol)'], key: 0,
    ask: 'Substitution, and heat of hydrogenation?' },
  { id: 'additions', topic: 'addition-reactions', head: ['Reagent', 'Adds', 'Regio', 'Stereo'], key: 0,
    ask: 'Added to an alkene: what adds, where, and with what stereochemistry?' },
  { id: 'hbr-routes', topic: 'markovnikov', head: ['Conditions', 'Intermediate', 'Regiochemistry', 'Stereochemistry'], key: 0,
    ask: 'Added to an alkene: intermediate, regiochemistry, stereochemistry?' },
  { id: 'radical-hbr-steps', topic: 'markovnikov', head: ['Stage', 'Step', 'What it does'], key: 1,
    ask: 'Radical (peroxide) HBr addition — which stage is this step, and what does it do?' },
  { id: 'alkene-oxidation', topic: 'alkene-oxidation', head: ['Reagent', 'What happens to the C=C', 'Product'], key: 0,
    ask: 'Added to an alkene: what happens to the C=C, and what is the product?' },
  { id: 'diol-stereo', topic: 'alkene-oxidation', head: ['Alkene', 'OsO₄ (syn)', 'mCPBA then H₃O⁺ (anti)'], key: 0,
    ask: 'Which butane-2,3-diol from each dihydroxylation?' },

  /* ---- Conjugation ---------------------------------------------------- */
  { id: 'uv-lambda', topic: 'uv-vis', head: ['Compound', 'Conjugated C=C', 'λmax (approx.)'], key: 0,
    ask: 'Number of conjugated C=C, and approximate λmax?' },
  { id: 'woodward-fieser', topic: 'uv-vis', head: ['Contribution', 'Increment'], key: 0,
    ask: 'Diene λmax rules: how much does this contribute?' },

  /* ---- Alcohols & ethers --------------------------------------------- */
  { id: 'epoxide-opening', topic: 'epoxides', head: ['', 'Basic / neutral', 'Acidic'] },

  /* ---- Carbonyl chemistry -------------------------------------------- */
  { id: 'hydration-keq', topic: 'aldehydes-ketones', head: ['Compound', 'Alkyl groups', 'Keq (hydration)'], key: 0,
    ask: 'Alkyl groups on the carbonyl, and hydration Keq?' },
  { id: 'hydrate-percent', topic: 'hydrates-cyanohydrins', head: ['Carbonyl', 'Percent hydrate at equilibrium'], key: 0,
    ask: 'Percent hydrate at equilibrium in water?' },
  { id: 'amine-plus-carbonyl', topic: 'imines-enamines', head: ['Amine', 'H on N after addition', 'Product'], key: 0,
    ask: 'Condensed with a ketone or aldehyde: H left on N, and the product?' },
  { id: 'enolate-vs-enamine', topic: 'imines-enamines', head: ['', 'Enolate', 'Enamine'] },
  { id: 'wittig-vs-elimination', topic: 'wittig-reaction', head: ['', 'Elimination', 'Wittig'] },
  { id: 'fehling-benedict', topic: 'aldehyde-oxidation', head: ['Reagent', 'Cu(II) complexed by', 'Notes'], key: 0,
    ask: 'What holds the Cu(II) in solution, and what is it good for?' },

  /* ---- Oxidation & reduction ----------------------------------------- */
  { id: 'ox-ladder', topic: 'oxidation-states', head: ['Compound', 'Carbon oxidation state', 'Class'], key: 0,
    ask: 'Oxidation state of the carbon?' },
  { id: 'alcohol-oxidation', topic: 'alcohol-oxidation',
    head: ['Substrate', 'Anhydrous oxidant PCC, Swern, DMP', 'Aqueous Cr(VI) Jones, CrO₃/H₂SO₄'], key: 0,
    labels: { 1: 'Anhydrous (PCC, Swern, DMP)', 2: 'Aqueous Cr(VI) (Jones)' },
    ask: 'Oxidized with an anhydrous oxidant, and with aqueous Cr(VI)?' },
  { id: 'hydride-reagents', topic: 'carbonyl-reduction', head: ['Substrate', 'NaBH₄', 'LiAlH₄'], key: 0,
    ask: 'Treated with NaBH₄, and with LiAlH₄?' },

  /* ---- Carboxylic acids & derivatives -------------------------------- */
  { id: 'acid-routes', topic: 'carboxylic-acids', head: ['To make RCOOH from', 'Reagent', 'Watch for'], key: 0,
    ask: 'Reagent to turn this into RCOOH — and what to watch for?' },
  { id: 'reactivity-ladder', topic: 'esters-amides',
    head: ['Derivative', 'X', 'Resonance donation', 'X as leaving group', 'Reactivity'], key: 0,
    ask: 'Resonance donation, leaving group, and place on the reactivity ladder?' },
  { id: 'acid-chloride-plus', topic: 'acyl-chlorides-anhydrides', head: ['Nucleophile', 'Product', 'Note'], key: 0,
    ask: 'An acid chloride meets this. Product?' },
  { id: 'nitrile-plus', topic: 'nitriles', head: ['Reagent', 'Product', 'Through'], key: 0,
    ask: 'A nitrile RC≡N meets this. Product, and through what?' },

  /* ---- Organometallics ----------------------------------------------- */
  { id: 'organometallics', topic: 'organometallic-bonding', head: ['Reagent', 'Metal', 'Character'], key: 0,
    ask: 'Which metal, and what is it like as a reagent?' },
  { id: 'grignard-targets', topic: 'grignard-reagents', head: ['Electrophile', 'Product after H3O+', 'Carbons gained'], key: 0,
    ask: 'A Grignard reagent adds, then H₃O⁺. Product, and carbons gained?' },
  { id: 'organolithium-uses', topic: 'organolithium-reagents', head: ['Reagent', 'Used for'], key: 0,
    ask: 'What is it used for?' },
  { id: 'enone-addition', topic: 'gilman-reagents', head: ['Nucleophile', 'Adds', 'Product'], key: 0,
    ask: 'Added to an α,β-unsaturated ketone: where does it add, and what results?' },
  { id: 'pd-cycle', topic: 'cross-coupling', head: ['Step', 'What happens', 'Palladium goes'], key: 0,
    ask: 'In the Pd cross-coupling cycle: what happens, and what happens to Pd?' },
  { id: 'cross-couplings', topic: 'cross-coupling', head: ['Reaction', 'Nucleophilic partner', 'Forms'], key: 0,
    ask: 'Pd-catalyzed coupling — the nucleophilic partner, and what it makes?' },

  /* ---- Enolates -------------------------------------------------------- */
  { id: 'alpha-pka', topic: 'alpha-hydrogens', head: ['Compound', 'Alpha pKa'], key: 0,
    ask: 'pKa of the α hydrogen?' },
  { id: 'enolate-bases', topic: 'ester-syntheses', head: ['Compound', 'α pKa', 'Deprotonated by'], key: 0,
    ask: 'α pKa, and what base deprotonates it?' },
  { id: 'kinetic-vs-thermo-enolate', topic: 'enolate-regiochemistry', head: ['', 'Kinetic', 'Thermodynamic'] },

  /* ---- Aromatic chemistry --------------------------------------------- */
  { id: 'eas', topic: 'eas', head: ['Reaction', 'Reagents', 'Electrophile', 'Installs'], key: 0,
    ask: 'Reagents, the real electrophile, and what it installs?' },
  { id: 'directing', topic: 'directing-effects', head: ['Substituent', 'Effect on rate', 'Directs'], key: 0,
    ask: 'On a benzene ring: effect on EAS rate, and where it directs?' },
  { id: 'snar-vs-benzyne', topic: 'nucleophilic-aromatic', head: ['', 'SNAr', 'Benzyne'] },
  { id: 'phenol-pka', topic: 'phenols', head: ['Compound', 'pKa'], key: 0,
    ask: 'pKa?' },
  { id: 'phenol-substituents', topic: 'phenols', head: ['Phenol', 'pKa', 'Why'], key: 0,
    ask: 'pKa, and why?' },
  { id: 'birch-regio', topic: 'birch-reduction', head: ['Ring bears', 'The substituted carbon ends up', 'Product'], key: 0,
    ask: 'Birch reduction: where does the substituted carbon end up?' },
  { id: 'diazonium', topic: 'diazonium-chemistry', head: ['Reagent', 'Replaces N2+ with', 'Name'], key: 0,
    ask: 'An arenediazonium salt ArN₂⁺ meets this. What replaces N₂⁺, and is it a named reaction?' },

  /* ---- Amines ----------------------------------------------------------- */
  { id: 'amine-basicity', topic: 'amine-structure', head: ['Compound', 'pKaH', 'Lone pair'], key: 0,
    ask: 'pKaH, and where is the nitrogen lone pair?' },
  { id: 'amine-routes', topic: 'amine-synthesis', head: ['Route', 'Gives', 'Carbon count'], key: 0,
    ask: 'Which amines does it give, and what happens to the carbon count?' },
  { id: 'hofmann-vs-e2', topic: 'hofmann-elimination', head: ['', 'Ordinary E2, small base', 'Hofmann elimination'] },

  /* ---- Spectroscopy ----------------------------------------------------- */
  { id: 'ir', topic: 'ir', head: ['Bond', 'cm⁻¹', 'Appearance'], key: 0,
    ask: 'IR: where does it absorb (cm⁻¹), and what does the band look like?' },
  { id: 'ir-carbonyl', topic: 'ir', head: ['Carbonyl', 'cm⁻¹'], key: 0,
    ask: 'IR: typical C=O stretch (cm⁻¹)?' },
  { id: 'h-nmr', topic: 'h-nmr', head: ['Environment', 'ppm'], key: 0,
    ask: '¹H NMR: typical chemical shift (ppm)?' },
  { id: 'c-nmr', topic: 'c-nmr', head: ['Carbon type', 'ppm'], key: 0,
    ask: '¹³C NMR: typical chemical shift (ppm)?' },
  { id: 'ms-losses', topic: 'mass-spec', head: ['Loss', 'Mass', 'Suggests'], key: 0,
    ask: 'Mass spec: lost from the molecular ion — how many mass units, and what does it suggest?' },

  /* ---- Synthesis --------------------------------------------------------- */
  { id: 'cc-bonds', topic: 'carbon-carbon-bonds', head: ['Reaction', 'Joins', 'Gives'], key: 0,
    ask: 'Which two pieces does it join, and what does it make?' },
  { id: 'fgi-1', topic: 'functional-group-interconversion', head: ['From', 'To', 'Reagent'], key: [0, 1], sep: ' → ',
    ask: 'Reagent?' },
  { id: 'synthons', topic: 'retrosynthesis', head: ['Synthon', 'Synthetic equivalent'], key: 0,
    ask: 'Synthetic equivalent — what do you actually put in the flask?' },
  { id: 'protecting-groups', topic: 'protecting-groups', head: ['Group', 'Protect with', 'Becomes', 'Remove with'], key: 0,
    ask: 'Protect it with what, as what, and how does it come off?' },

  /* ---- Biomolecules ------------------------------------------------------ */
  { id: 'base-pairs', topic: 'nucleic-acids', head: ['Pair', 'Hydrogen bonds', 'Note'], key: 0,
    ask: 'How many hydrogen bonds hold this base pair?' },

  /* ---- Polymers ---------------------------------------------------------- */
  { id: 'addition-vs-condensation', topic: 'polymer-basics', head: ['', 'Addition (chain-growth)', 'Condensation (step-growth)'] },
  { id: 'addition-polymers', topic: 'addition-polymers', head: ['Monomer', 'Polymer', 'Where you meet it'], key: 0,
    ask: 'Which polymer does it make, and where do you meet it?' },
  { id: 'condensation-polymers', topic: 'condensation-polymers', head: ['Polymer', 'Monomers', 'New linkage', 'Lost'], key: 0,
    ask: 'Monomers, the new linkage, and what is lost?' },
  { id: 'chain-packing', topic: 'polymer-properties', head: ['Feature', 'Effect on packing', 'Result'], key: 0,
    ask: 'Effect on how chains pack, and the result?' },
  { id: 'tg-tm', topic: 'polymer-properties', head: ['Polymer', 'Tg', 'Tm', 'At room temperature'], key: 0,
    ask: 'Tg, Tm, and what it is like at room temperature?' },
  { id: 'thermoplastic-vs-thermoset', topic: 'polymer-properties', head: ['', 'Thermoplastic', 'Thermoset'] },
  { id: 'polymer-design', topic: 'polymer-design', head: ['You need', 'Build in', 'Because'], key: 0,
    ask: 'What do you build into the polymer, and why does it work?' },
];

/* The functional-group-interconversion section prints its "moves worth
   knowing cold" as three tables with the same header. They are one list, so
   they share a spec apart from their ids — `nth` picks which of the
   identically headed tables in the file each one reads. */
TABLES.push(
  { id: 'fgi-2', topic: 'functional-group-interconversion', head: ['From', 'To', 'Reagent'], nth: 1, key: [0, 1], sep: ' → ',
    ask: 'Reagent?' },
  { id: 'fgi-3', topic: 'functional-group-interconversion', head: ['From', 'To', 'Reagent'], nth: 2, key: [0, 1], sep: ' → ',
    ask: 'Reagent?' },
);

/* Named reactions and rules the notes teach in prose. Every card was written
   against the section named in `topic`; `q` is the front (short), `ask` the
   question above it, `a` the answer as [label, html] rows. Plain HTML: <sub>,
   <sup>, <b>, <i> only. */
export const AUTHORED = [
  { id: 'markovnikov-rule', topic: 'addition-reactions', q: 'Markovnikov’s rule', ask: 'State it — and the reason behind it.',
    a: [['Rule', 'In HX addition to an alkene, H goes to the carbon that already has more H, and X to the more substituted carbon.'],
        ['Why', 'Protonation goes through the more stable (more substituted) carbocation; X ends up where the positive charge was.']] },
  { id: 'zaitsev-rule', topic: 'e2', q: 'Zaitsev’s rule', ask: 'Which alkene does an ordinary elimination favor?',
    a: [['Rule', 'The more substituted, more stable alkene is the major product.'],
        ['Exception', 'A bulky base (e.g. <i>t</i>-BuO⁻) or a bulky leaving group (Hofmann elimination) gives the less substituted alkene.']] },
  { id: 'huckel', topic: 'aromaticity', q: 'Hückel’s rule', ask: 'What makes a ring aromatic?',
    a: [['Criteria', 'Cyclic, planar, a p orbital on every ring atom (fully conjugated), and 4<i>n</i> + 2 π electrons: 2, 6, 10, 14…'],
        ['Fail one', 'Not aromatic. Cyclic, planar and conjugated with 4<i>n</i> π electrons is antiaromatic.']] },
  { id: 'williamson', topic: 'ether-chemistry', q: 'Williamson ether synthesis', ask: 'Reagents, mechanism, and the constraint?',
    a: [['Reaction', 'An alkoxide (RO⁻, often from ROH + NaH) displaces a halide: RO⁻ + R′X → R–O–R′.'],
        ['Mechanism', 'SN2.'],
        ['Constraint', 'The halide must be methyl or primary; on a secondary or tertiary halide the alkoxide acts as a base and E2 wins.']] },
  { id: 'fischer-esterification', topic: 'acyl-substitution', q: 'Fischer esterification', ask: 'Reagents, and how is the yield pushed up?',
    a: [['Reaction', 'Carboxylic acid + alcohol, with an acid catalyst (H⁺) → ester + water.'],
        ['Yield', 'It is an equilibrium: use the alcohol in excess or remove the water as it forms.']] },
  { id: 'gabriel', topic: 'amine-synthesis', q: 'Gabriel synthesis', ask: 'What does it make, and why does it stop cleanly?',
    a: [['Makes', 'Primary amines only.'],
        ['How', 'Phthalimide (N–H pK<sub>a</sub> about 8.3) is deprotonated by KOH, alkylated once by RX in an SN2, then the amine is released (hydrazine or hydrolysis).'],
        ['Why clean', 'The alkylated nitrogen has no N–H left, so it cannot be alkylated a second time.']] },
  { id: 'hofmann-rearrangement', topic: 'amine-synthesis', q: 'Hofmann rearrangement', ask: 'Substrate, reagents, product?',
    a: [['Reaction', 'Primary amide + Br<sub>2</sub>, NaOH → primary amine with <b>one fewer carbon</b>.'],
        ['How', 'The alkyl group migrates from the carbonyl carbon to N, giving an isocyanate that hydrolyzes and loses that carbon as CO<sub>2</sub>.'],
        ['Example', 'Butanamide (4 C) → propylamine (3 C).']] },
  { id: 'curtius', topic: 'amine-synthesis', q: 'Curtius rearrangement', ask: 'How is it related to the Hofmann rearrangement?',
    a: [['Reaction', 'An acyl azide (acid chloride + NaN<sub>3</sub>) is heated → isocyanate → primary amine.'],
        ['Same as Hofmann', 'Same isocyanate, same lost carbon: the amine has one carbon fewer than the acid.']] },
  { id: 'reductive-amination', topic: 'amine-synthesis', q: 'Reductive amination', ask: 'Reagents, and what makes it controllable?',
    a: [['Reaction', 'Ketone or aldehyde + an amine (or NH<sub>3</sub>), then NaBH<sub>3</sub>CN → amine.'],
        ['How', 'The imine (or iminium) forms first and is reduced in the same pot.'],
        ['Why useful', 'You choose 1°, 2° or 3° by the amine you start with, and it does not over-alkylate the way direct alkylation does.']] },
  { id: 'hofmann-elimination', topic: 'hofmann-elimination', q: 'Hofmann elimination', ask: 'Steps, and which alkene?',
    a: [['Steps', 'Exhaustive methylation with excess CH<sub>3</sub>I → quaternary ammonium salt; Ag<sub>2</sub>O/H<sub>2</sub>O swaps in hydroxide; heat → E2.'],
        ['Alkene', 'The <b>less substituted</b> (Hofmann) alkene: the bulky NR<sub>3</sub> leaving group makes the base take the least hindered β-H.']] },
  { id: 'wittig', topic: 'wittig-reaction', q: 'Wittig reaction', ask: 'Reagents, and what makes it better than an elimination?',
    a: [['Reagents', 'Ph<sub>3</sub>P + a methyl or primary alkyl halide (SN2) → phosphonium salt; strong base (<i>n</i>-BuLi or NaH) → ylide; ylide + aldehyde or ketone → alkene + Ph<sub>3</sub>P=O.'],
        ['Advantage', 'The C=C forms exactly where the C=O was — no Zaitsev mixture, no rearrangement.']] },
  { id: 'diels-alder', topic: 'diels-alder', q: 'Diels–Alder reaction', ask: 'What reacts with what, and what is required of the diene?',
    a: [['Reaction', 'A conjugated diene (4 π e⁻) + a dienophile (2 π e⁻) → a cyclohexene, in one concerted [4+2] cycloaddition; two new C–C σ bonds form at once.'],
        ['Diene', 'Must be able to reach the s-cis conformation.'],
        ['Stereo', 'Stereospecific: groups cis on the dienophile stay cis in the ring.']] },
  { id: 'aldol-condensation', topic: 'aldol', q: 'Aldol condensation', ask: 'The two stages, and what decides where it stops?',
    a: [['Addition', 'An enolate adds to a second carbonyl → β-hydroxy aldehyde or ketone.'],
        ['Condensation', 'Dehydration of that product → α,β-unsaturated carbonyl (enone) + water.'],
        ['Conditions', 'Mild and short stops at the addition product; heat drives the condensation.']] },
  { id: 'claisen', topic: 'claisen', q: 'Claisen condensation', ask: 'Partners, product, and why a full equivalent of base?',
    a: [['Reaction', 'Ester enolate + a second ester (acyl substitution) → β-keto ester + alkoxide.'],
        ['Base', 'Needs a full equivalent (the alkoxide matching the ester): the β-keto ester is deprotonated (α-H pK<sub>a</sub> about 11), and that step pulls the equilibrium over. Acid workup restores it.']] },
  { id: 'dieckmann', topic: 'claisen', q: 'Dieckmann condensation', ask: 'What is it?',
    a: [['Reaction', 'An intramolecular Claisen: a diester closes to a cyclic β-keto ester.'],
        ['Rings', 'Five- and six-membered rings form well; a 1,6-diester (e.g. diethyl adipate) gives a five-membered ring.']] },
  { id: 'michael', topic: 'michael-robinson', q: 'Michael addition', ask: 'Donor, acceptor, product?',
    a: [['Donor', 'A stabilized enolate or enamine (1,3-dicarbonyl, malonate, β-keto ester, nitroalkane).'],
        ['Acceptor', 'An α,β-unsaturated carbonyl (or nitrile, nitro).'],
        ['Product', 'Conjugate (1,4) addition at the β carbon → a 1,5-dicarbonyl.']] },
  { id: 'robinson', topic: 'michael-robinson', q: 'Robinson annulation', ask: 'Which two reactions, and what does it build?',
    a: [['Sequence', 'Michael addition (usually to methyl vinyl ketone), then an intramolecular aldol condensation.'],
        ['Builds', 'A new six-membered ring containing an α,β-unsaturated ketone (a cyclohexenone).']] },
  { id: 'malonic-ester', topic: 'ester-syntheses', q: 'Malonic ester synthesis', ask: 'Steps and product?',
    a: [['Steps', 'Diethyl malonate + NaOEt → enolate; alkylate with RX (SN2); hydrolyze (H<sub>3</sub>O<sup>+</sup>) and heat to decarboxylate.'],
        ['Product', 'A substituted acetic acid, RCH<sub>2</sub>COOH.']] },
  { id: 'acetoacetic-ester', topic: 'ester-syntheses', q: 'Acetoacetic ester synthesis', ask: 'Steps and product?',
    a: [['Steps', 'Ethyl acetoacetate + NaOEt → enolate; alkylate with RX (SN2); hydrolyze and heat to decarboxylate.'],
        ['Product', 'A methyl ketone, CH<sub>3</sub>COCH<sub>2</sub>R.']] },
  { id: 'hvz', topic: 'alpha-halogenation', q: 'Hell–Volhard–Zelinsky reaction', ask: 'Reagents, product, and why the phosphorus?',
    a: [['Reaction', 'Carboxylic acid + Br<sub>2</sub> with catalytic PBr<sub>3</sub> (or red P) → α-bromo carboxylic acid.'],
        ['Why PBr₃', 'An acid barely enolizes; PBr<sub>3</sub> converts it to the acyl bromide, which does, and that enol is what brominates.']] },
  { id: 'haloform', topic: 'alpha-halogenation', q: 'Haloform reaction', ask: 'Substrate, reagents, products?',
    a: [['Substrate', 'A methyl ketone, RCOCH<sub>3</sub>.'],
        ['Reagents', 'Excess X<sub>2</sub> and excess NaOH.'],
        ['Products', 'The carboxylate RCOO⁻ (one carbon shorter) + CHX<sub>3</sub> (e.g. iodoform, CHI<sub>3</sub>).'],
        ['Why it runs on', 'In base each halogen makes the next α-H more acidic, so the CH<sub>3</sub> is halogenated three times.']] },
  { id: 'stork-enamine', topic: 'imines-enamines', q: 'Stork enamine synthesis', ask: 'Steps, and why does it stop after one alkylation?',
    a: [['Steps', 'Ketone + a secondary amine (mild acid) → enamine; alkylate or acylate the α carbon; hydrolyze → α-substituted ketone.'],
        ['Stops at one', 'Alkylation turns the enamine into an iminium salt, which has no nucleophilic carbon left.']] },
  { id: 'baeyer-villiger', topic: 'baeyer-villiger', q: 'Baeyer–Villiger oxidation', ask: 'Reagent, product, and which group migrates?',
    a: [['Reaction', 'Ketone + a peroxyacid (e.g. mCPBA) → ester; a cyclic ketone → lactone.'],
        ['Migrates', 'H &gt; 3° &gt; 2° ≈ cyclohexyl ≈ benzyl ≈ aryl &gt; 1° &gt; methyl. The O is inserted on that group’s side.'],
        ['Stereo', 'The migrating group keeps its configuration.']] },
  { id: 'birch', topic: 'birch-reduction', q: 'Birch reduction', ask: 'Reagents and product?',
    a: [['Reagents', 'Na or Li in liquid NH<sub>3</sub>, with an alcohol as the proton source.'],
        ['Product', 'A non-conjugated cyclohexa-1,4-diene — the ring is only partly reduced.']] },
  { id: 'clemmensen-wolff', topic: 'carbonyl-reduction', q: 'Clemmensen vs Wolff–Kishner', ask: 'What do both do, and how do you choose?',
    a: [['Both', 'Reduce the C=O of a ketone or aldehyde all the way to CH<sub>2</sub>. Not esters or amides.'],
        ['Clemmensen', 'Zn(Hg), concentrated HCl — strongly acidic.'],
        ['Wolff–Kishner', 'Hydrazine, then KOH and heat — strongly basic. Use it when the molecule cannot survive acid.']] },
  { id: 'tollens', topic: 'aldehyde-oxidation', q: 'Tollens’ test', ask: 'Reagent, positive result, and what it tells you?',
    a: [['Reagent', 'Ag(NH<sub>3</sub>)<sub>2</sub><sup>+</sup> in aqueous ammonia.'],
        ['Positive', 'A silver mirror: the aldehyde is oxidized (to the carboxylate) and Ag<sup>+</sup> is reduced to Ag metal.'],
        ['Tells you', 'Aldehyde present; ordinary ketones do not react.']] },
  { id: 'nbs', topic: 'benzylic-reactivity', q: 'NBS with light', ask: 'Where does it brominate, and why NBS rather than Br₂?',
    a: [['Where', 'The benzylic (or allylic) C–H, by a radical chain.'],
        ['Why NBS', 'It keeps the Br<sub>2</sub> concentration very low, so ionic addition of Br<sub>2</sub> to any C=C cannot compete.']] },
  { id: 'kolbe-schmitt', topic: 'phenols', q: 'Kolbe–Schmitt carboxylation', ask: 'Reagents and product?',
    a: [['Reaction', 'Phenoxide + CO<sub>2</sub> (about 125 °C, pressure), then acid workup → salicylic acid (2-hydroxybenzoic acid).'],
        ['Why ring C', 'The phenoxide’s negative charge is delocalized onto the ortho and para carbons, so a ring carbon attacks the CO<sub>2</sub>.']] },
  { id: 'mclafferty', topic: 'mass-spec', q: 'McLafferty rearrangement', ask: 'What does a carbonyl compound need, and what is lost?',
    a: [['Needs', 'A hydrogen on the γ carbon.'],
        ['What happens', 'Through a six-membered ring the γ-H moves to the carbonyl O and the α–β bond breaks.'],
        ['Lost', 'A neutral alkene; the ion detected is an enol radical cation.']] },
  { id: 'strecker', topic: 'amino-acids', q: 'Strecker synthesis', ask: 'Reagents and product?',
    a: [['Reaction', 'Aldehyde + NH<sub>3</sub> + HCN → α-amino nitrile (imine, then cyanide adds); hydrolyze the nitrile → α-amino acid.'],
        ['Stereo', 'Racemic: the new stereocenter forms at a planar imine.']] },
  { id: 'edman', topic: 'peptides-proteins', q: 'Edman degradation', ask: 'Reagent, and what does it tell you?',
    a: [['Reagent', 'Phenyl isothiocyanate, PhN=C=S, then mild acid.'],
        ['Result', 'Removes the N-terminal residue as a phenylthiohydantoin, which is identified — then repeats on the shortened peptide. It sequences from the N-terminus, one residue at a time.']] },
  { id: 'ziegler-natta', topic: 'addition-polymers', q: 'Ziegler–Natta catalyst', ask: 'What is it, and what does it give you?',
    a: [['Catalyst', 'TiCl<sub>4</sub> with a trialkylaluminum such as Al(C<sub>2</sub>H<sub>5</sub>)<sub>3</sub>.'],
        ['Gives', 'Stereoregular polymers — isotactic polypropylene — because every monomer adds the same way at the metal.']] },
];
