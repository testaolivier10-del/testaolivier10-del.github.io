/* Acid/Base Comparator — two structures, and which proton comes off first.

   Students are handed two things that do not fit together: a mnemonic for
   ranking acidity by structure, and a table of measured pKa values. The
   mnemonic is the reasoning and the table is the truth, and nobody ever shows
   them disagreeing — so the mnemonic gets learned as an oracle rather than as
   an argument with an order of precedence.

   Here they are shown together on purpose. The ANSWER always comes from the
   measured pKa, because that is what is true. The EXPLANATION comes from
   walking atom, resonance, induction and orbital in order and finding the
   first factor that differs. When the two agree, which is nearly always, you
   see the reasoning confirmed. When they disagree — ethanol against water is
   the classic — the tool says so plainly and names what the structural rules
   left out, rather than quietly reporting whichever answer makes the rules
   look good. */
(function(){
  var root = document.getElementById('abRoot');
  if(!root) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* `atom` is the element the negative charge lands on in the conjugate base.
     `res` counts how many atoms share that charge (1 means none). `ind` is a
     rough count of inductive electron withdrawal, weighted for distance.
     `hyb` is the hybridization of the charge-bearing atom. */
  var ACIDS = [
    { id:'ethane',    name:'Ethane',            formula:'CH₃CH₃',        site:'C–H', pKa:50,   atom:'C', res:1, resO:0, ind:0, hyb:'sp³', cbase:'CH₃CH₂⁻',
      why:'A carbanion on a plain sp³ carbon, with nothing to help it. About as bad as a conjugate base gets.' },
    { id:'ethene',    name:'Ethene',            formula:'CH₂=CH₂',       site:'C–H', pKa:44,   atom:'C', res:1, resO:0, ind:0, hyb:'sp²', cbase:'CH₂=CH⁻',
      why:'Still a carbanion, but in an sp² orbital — 33% s character holds the pair a little closer to the nucleus.' },
    { id:'ethyne',    name:'Ethyne',            formula:'HC≡CH',         site:'C–H', pKa:25,   atom:'C', res:1, resO:0, ind:0, hyb:'sp',  cbase:'HC≡C⁻',
      why:'An sp orbital is 50% s, so the lone pair sits closest of all to the nucleus. Nineteen pKa units below ethene on hybridization alone.' },
    { id:'ammonia',   name:'Ammonia',           formula:'NH₃',           site:'N–H', pKa:38,   atom:'N', res:1, resO:1, ind:0, hyb:'sp³', cbase:'NH₂⁻',
      why:'Nitrogen is more electronegative than carbon, and that difference alone is worth about twelve orders of magnitude.' },
    { id:'methylamine', name:'Methylamine',     formula:'CH₃NH₂',        site:'N–H', pKa:40,   atom:'N', res:1, resO:1, ind:0, hyb:'sp³', cbase:'CH₃NH⁻',
      why:'An alkyl group pushes electron density toward the nitrogen, which makes the amide anion slightly worse off than ammonia’s.' },
    { id:'water',     name:'Water',             formula:'H₂O',           site:'O–H', pKa:15.7, atom:'O', res:1, resO:1, ind:0, hyb:'sp³', cbase:'HO⁻',
      why:'Oxygen holds a negative charge comfortably, and hydroxide is small enough for water to solvate tightly.' },
    { id:'ethanol',   name:'Ethanol',           formula:'CH₃CH₂OH',      site:'O–H', pKa:16,   atom:'O', res:1, resO:1, ind:0, hyb:'sp³', cbase:'CH₃CH₂O⁻',
      why:'Essentially water with an ethyl group. The structural factors are identical; what separates them is how well the solvent can get at the anion.' },
    { id:'tbuoh',     name:'tert-Butanol',      formula:'(CH₃)₃COH',     site:'O–H', pKa:18,   atom:'O', res:1, resO:1, ind:0, hyb:'sp³', cbase:'(CH₃)₃CO⁻',
      why:'Three methyl groups wrapped around the oxygen. They donate a little electron density, and more importantly they keep solvent molecules away from the anion.' },
    { id:'phenol',    name:'Phenol',            formula:'C₆H₅OH',        site:'O–H', pKa:10,   atom:'O', res:4, resO:1, ind:0, hyb:'sp³', cbase:'C₆H₅O⁻',
      why:'The charge is delocalized from the oxygen onto three ring carbons. Six orders of magnitude more acidic than an ordinary alcohol, on resonance alone.' },
    { id:'pnitrophenol', name:'4-nitrophenol',  formula:'O₂N–C₆H₄–OH',   site:'O–H', pKa:7.15, atom:'O', res:5, resO:3, ind:2, hyb:'sp³', cbase:'O₂N–C₆H₄–O⁻',
      why:'Phenol plus a nitro group positioned so the charge can delocalize all the way onto its oxygens — resonance and induction pulling together.' },
    { id:'acetic',    name:'Acetic acid',       formula:'CH₃COOH',       site:'O–H', pKa:4.76, atom:'O', res:2, resO:2, ind:1, hyb:'sp³', cbase:'CH₃COO⁻',
      why:'The charge is split evenly between two oxygens, and the carbonyl carbon pulls inductively as well.' },
    { id:'formic',    name:'Formic acid',       formula:'HCOOH',         site:'O–H', pKa:3.77, atom:'O', res:2, resO:2, ind:1.2, hyb:'sp³', cbase:'HCOO⁻',
      why:'The same carboxylate as acetic acid without the electron-donating methyl group, so it is a full pKa unit stronger.' },
    { id:'benzoic',   name:'Benzoic acid',      formula:'C₆H₅COOH',      site:'O–H', pKa:4.20, atom:'O', res:2, resO:2, ind:1.15, hyb:'sp³', cbase:'C₆H₅COO⁻',
      why:'A carboxylic acid on an sp² ring carbon, which withdraws slightly more than an alkyl group would.' },
    { id:'chloroacetic', name:'Chloroacetic acid', formula:'ClCH₂COOH',  site:'O–H', pKa:2.86, atom:'O', res:2, resO:2, ind:2, hyb:'sp³', cbase:'ClCH₂COO⁻',
      why:'One chlorine, one carbon away, pulling electron density off the carboxylate through the sigma bonds. Worth nearly two pKa units.' },
    { id:'dichloroacetic', name:'Dichloroacetic acid', formula:'Cl₂CHCOOH', site:'O–H', pKa:1.29, atom:'O', res:2, resO:2, ind:3, hyb:'sp³', cbase:'Cl₂CHCOO⁻',
      why:'Two chlorines pulling instead of one. Induction is additive.' },
    { id:'trichloroacetic', name:'Trichloroacetic acid', formula:'Cl₃CCOOH', site:'O–H', pKa:0.65, atom:'O', res:2, resO:2, ind:4, hyb:'sp³', cbase:'Cl₃CCOO⁻',
      why:'Three chlorines. Stronger than phosphoric acid, from a structure that is otherwise just acetic acid.' },
    { id:'tfa',       name:'Trifluoroacetic acid', formula:'F₃CCOOH',    site:'O–H', pKa:0.23, atom:'O', res:2, resO:2, ind:5, hyb:'sp³', cbase:'F₃CCOO⁻',
      why:'Fluorine is the most electronegative element there is, and there are three of them one bond away.' },
    { id:'chloropropanoic', name:'3-chloropropanoic acid', formula:'ClCH₂CH₂COOH', site:'O–H', pKa:4.0, atom:'O', res:2, resO:2, ind:1.4, hyb:'sp³', cbase:'ClCH₂CH₂COO⁻',
      why:'The same chlorine as chloroacetic acid, one carbon further away — and most of the effect is already gone. Induction falls off fast with distance.' },
    { id:'hf',        name:'Hydrofluoric acid', formula:'HF',            site:'H–F', pKa:3.2,  atom:'F', res:1, resO:1, ind:0, hyb:'sp³', cbase:'F⁻',
      why:'The most electronegative atom in the table holding the charge — but a small, hard anion that grips its electrons tightly.' },
    { id:'hcl',       name:'Hydrochloric acid', formula:'HCl',           site:'H–Cl',pKa:-7,   atom:'Cl',res:1, resO:1, ind:0, hyb:'sp³', cbase:'Cl⁻',
      why:'Less electronegative than fluorine, and far more acidic. Size wins going down a column: the charge is spread over a much bigger ion.' },
    { id:'hbr',       name:'Hydrobromic acid',  formula:'HBr',           site:'H–Br',pKa:-9,   atom:'Br',res:1, resO:1, ind:0, hyb:'sp³', cbase:'Br⁻',
      why:'Bigger than chloride, and more acidic again.' },
    { id:'h2s',       name:'Hydrogen sulfide',  formula:'H₂S',           site:'S–H', pKa:7.0,  atom:'S', res:1, resO:1, ind:0, hyb:'sp³', cbase:'HS⁻',
      why:'Sulfur is LESS electronegative than oxygen and this is eight orders of magnitude more acidic than water. Size beats electronegativity down a column, every time.' },
    { id:'ethanethiol', name:'Ethanethiol',     formula:'CH₃CH₂SH',      site:'S–H', pKa:10.6, atom:'S', res:1, resO:1, ind:0, hyb:'sp³', cbase:'CH₃CH₂S⁻',
      why:'The sulfur version of ethanol, and five pKa units stronger for the same reason.' },
    { id:'hcn',       name:'Hydrogen cyanide',  formula:'HCN',           site:'C–H', pKa:9.2,  atom:'C', res:1, resO:0, carrier:'C', ind:2, hyb:'sp',  cbase:'⁻C≡N',
      why:'A carbon acid with a pKa of 9. sp hybridization plus a nitrogen pulling hard through the triple bond.' },
    { id:'acetone',   name:'Acetone',           formula:'CH₃COCH₃',      site:'α C–H', pKa:19.3, atom:'C', res:2, resO:1, carrier:'O', ind:1, hyb:'sp³', cbase:'CH₃COCH₂⁻',
      why:'An alpha C–H next to a carbonyl. The carbanion is delocalized onto the oxygen, which is the only reason this is thirty pKa units below ethane.' },
    { id:'malonate',  name:'Diethyl malonate',  formula:'CH₂(CO₂Et)₂',   site:'α C–H', pKa:13.3, atom:'C', res:3, resO:2, carrier:'O', ind:2, hyb:'sp³', cbase:'⁻CH(CO₂Et)₂',
      why:'One carbon between two esters, so the charge is delocalized onto two carbonyls at once.' },
    { id:'pentanedione', name:'2,4-pentanedione', formula:'CH₃COCH₂COCH₃', site:'α C–H', pKa:8.9, atom:'C', res:3, resO:2, carrier:'O', ind:2, hyb:'sp³', cbase:'CH₃COCHCOCH₃⁻',
      why:'The same trick with two ketones rather than two esters, and more acidic than phenol as a result. A carbon acid you can deprotonate with hydroxide.' },
    { id:'phenylacetic', name:'Phenylacetic acid', formula:'C₆H₅CH₂COOH', site:'O–H', pKa:4.31, atom:'O', res:2, resO:2, ind:1.1, hyb:'sp³', cbase:'C₆H₅CH₂COO⁻',
      why:'A carboxylic acid with a benzyl group. The ring is one carbon too far away to conjugate with the carboxylate, so it acts as a mild inductive withdrawer and very little else.' },
    { id:'cyanoacetic', name:'Cyanoacetic acid', formula:'N≡CCH₂COOH', site:'O–H', pKa:2.47, atom:'O', res:2, resO:2, ind:2.4, hyb:'sp³', cbase:'N≡CCH₂COO⁻',
      why:'A nitrile is one of the strongest inductive withdrawers there is — worth more than a chlorine at the same distance, without any lone pair being shared.' },
    { id:'fluoroacetic', name:'Fluoroacetic acid', formula:'FCH₂COOH', site:'O–H', pKa:2.59, atom:'O', res:2, resO:2, ind:2.3, hyb:'sp³', cbase:'FCH₂COO⁻',
      why:'One fluorine against chloroacetic acid’s one chlorine. Fluorine is more electronegative and pulls slightly harder, and the gap is small because induction is about the dipole rather than the atom’s name.' },
    { id:'oxalic', name:'Oxalic acid', formula:'HOOC–COOH', site:'O–H', pKa:1.25, atom:'O', res:2, resO:2, ind:3.2, hyb:'sp³', cbase:'HOOC–COO⁻',
      why:'Two carboxyls bonded directly to each other, so each withdraws from the other. Its first proton comes off harder than trichloroacetic acid’s.' },
    { id:'benzenesulfonic', name:'Benzenesulfonic acid', formula:'C₆H₅SO₃H', site:'O–H', pKa:-2.8, atom:'O', res:3, resO:3, ind:4, hyb:'sp³', cbase:'C₆H₅SO₃⁻',
      why:'Three oxygens sharing the charge instead of two, around a sulfur that is happy to be positive. Stronger than any carboxylic acid, and the reason sulfonates make such good leaving groups.' },
    { id:'phenylammonium', name:'Anilinium ion', formula:'C₆H₅NH₃⁺', site:'N–H', pKa:4.6, atom:'N', res:4, resO:1, ind:1.5, hyb:'sp³', cbase:'C₆H₅NH₂',
      why:'Its conjugate base is aniline, whose lone pair is delocalized into the ring — so aniline is a poor base, and its conjugate acid is correspondingly strong. Six orders of magnitude more acidic than an ordinary ammonium.' },
    { id:'ethylammonium', name:'Ethylammonium ion', formula:'CH₃CH₂NH₃⁺', site:'N–H', pKa:10.7, atom:'N', res:1, resO:1, ind:0, hyb:'sp³', cbase:'CH₃CH₂NH₂',
      why:'An ordinary protonated amine. Put it next to the anilinium ion: same atom, same charge, and six pKa units apart on delocalization alone.' },
    { id:'cyclopentadiene', name:'Cyclopentadiene', formula:'C₅H₆', site:'C–H', pKa:16, atom:'C', res:5, resO:0, ind:0, hyb:'sp³', cbase:'C₅H₅⁻',
      why:'A carbanion as acidic as an alcohol, which should look impossible. Losing this proton gives a ring with six pi electrons all the way round — the conjugate base is aromatic, and that is worth about thirty pKa units over an ordinary sp³ C–H.' },
    { id:'nitromethane-ab', name:'Nitromethane', formula:'CH₃NO₂', site:'α C–H', pKa:10.2, atom:'C', res:3, resO:2, ind:2.5, hyb:'sp³', cbase:'⁻CH₂NO₂',
      why:'The charge moves off carbon and onto the nitro group’s two oxygens. A C–H as acidic as a thiol, from resonance alone.' },
    { id:'phenylacetylene', name:'Phenylacetylene', formula:'C₆H₅C≡CH', site:'≡C–H', pKa:23, atom:'C', res:1, resO:0, ind:0, hyb:'sp', cbase:'C₆H₅C≡C⁻',
      why:'Ethyne with a ring attached. The sp orbital does nearly all the work, and the ring is worth a couple of units on top.' },
    { id:'tfe', name:'Trifluoroethanol', formula:'CF₃CH₂OH', site:'O–H', pKa:12.4, atom:'O', res:1, resO:1, ind:3.5, hyb:'sp³', cbase:'CF₃CH₂O⁻',
      why:'Ethanol with three fluorines one carbon away. Nearly four pKa units of pure induction, with no resonance involved at all — the cleanest demonstration of the effect on the list.' },
    { id:'hydrogen-peroxide', name:'Hydrogen peroxide', formula:'H₂O₂', site:'O–H', pKa:11.6, atom:'O', res:1, resO:1, ind:1.8, hyb:'sp³', cbase:'HOO⁻',
      why:'Water with a second oxygen attached, and that oxygen pulls. Four orders of magnitude more acidic than water, which is why peroxide anion forms so readily.' }
  ];

  /* Atom ranking for the conjugate base's charge carrier. Across a row
     electronegativity decides; down a column size does, and size wins when
     the two conflict — which is why H₂S beats H₂O. The number is a rank, not
     a measurement: bigger means better at holding the charge. */
  /* ---- Molecules with more than one acidic hydrogen -----------------------

     Every comparison above is between two molecules. The question a problem
     set actually asks is about one: "circle the most acidic proton". That is a
     different skill — you are not ranking compounds, you are ranking sites
     inside a single structure, and the factors have to be applied to each site
     in turn rather than to the molecule as a whole.

     Values marked `approx` are the ones a table gives as a range rather than a
     number; they are shown with a tilde, because an alpha C–H quoted to two
     decimals would be a precision nobody has. */
  var MULTI = [
    {
      id:'glycine', name:'Glycine (protonated)', formula:'⁺H₃N–CH₂–COOH',
      note:'The classic amino acid question, and the one people get backwards by reasoning about the nitrogen first. Both sites are charged; the question is which one gives up a proton more readily.',
      sites:[
        { label:'COOH', pKa:2.35, why:'A carboxylic acid. Losing this proton gives a carboxylate with the charge split evenly over two oxygens — and it also neutralizes nothing, because the nitrogen stays positive.' },
        { label:'⁺NH₃', pKa:9.78, why:'An ammonium. Losing this proton gives a neutral amine, with no resonance help at all — nitrogen simply holds the lone pair. Nearly eight pKa units harder than the acid group.' }
      ]
    },
    {
      id:'salicylic', name:'Salicylic acid', formula:'2-HO–C₆H₄–COOH',
      note:'Both an acid and a phenol on the same ring. One of them is ten orders of magnitude more acidic than the other, and it is not close.',
      sites:[
        { label:'COOH', pKa:2.97, why:'The carboxylic acid, made stronger than benzoic acid’s by the neighboring OH, which hydrogen-bonds to the carboxylate and holds the charge in place.' },
        { label:'phenol OH', pKa:13.6, why:'The phenol, made much WEAKER than ordinary phenol by the same hydrogen bond — that OH is busy donating to the carboxylate, and taking its proton means breaking that.' }
      ]
    },
    {
      id:'hydroxybenzoic', name:'4-hydroxybenzoic acid', formula:'HO–C₆H₄–COOH',
      note:'The same two groups as salicylic acid, moved to opposite ends of the ring so they cannot reach each other. Watch what happens to both numbers.',
      sites:[
        { label:'COOH', pKa:4.58, why:'An ordinary benzoic acid, very slightly weakened by the electron-donating OH across the ring.' },
        { label:'phenol OH', pKa:9.46, why:'An ordinary phenol, strengthened a little by the carboxylic acid pulling from the far side. With no hydrogen bond between them, both groups behave almost normally.' }
      ]
    },
    {
      id:'cysteine', name:'Cysteine (protonated)', formula:'⁺H₃N–CH(CH₂SH)–COOH',
      note:'Three sites, and the middle one is the interesting one — a thiol sitting between a carboxylic acid and an ammonium.',
      sites:[
        { label:'COOH', pKa:1.92, why:'The carboxylic acid, and the first to go as always.' },
        { label:'SH', pKa:8.37, why:'The thiol. Sulfur is less electronegative than oxygen and still far more acidic than any alcohol, because the anion is large and the charge is spread thinly over it.' },
        { label:'⁺NH₃', pKa:10.70, why:'The ammonium, last. Nothing stabilizes the neutral amine that results.' }
      ]
    },
    {
      id:'malonic', name:'Malonic acid', formula:'HOOC–CH₂–COOH',
      note:'Two identical carboxylic acids and the α C–H between them. Identical groups, very different numbers — because taking the first proton changes the molecule the second one has to leave.',
      sites:[
        { label:'first COOH', pKa:2.83, why:'Stronger than acetic acid: the second carboxyl group pulls inductively on the carboxylate being formed.' },
        { label:'second COOH', pKa:5.69, why:'Weaker than acetic acid. The molecule already carries a negative charge, and pulling a second proton off means putting two like charges close together.' },
        { label:'α C–H', pKa:13, approx:true, why:'The carbon between them. Delocalized onto two carbonyls at once, which is what makes a malonate carbon acid usable — but still ten orders of magnitude behind the acids themselves.' }
      ]
    },
    {
      id:'acetoacetate', name:'Ethyl acetoacetate', formula:'CH₃CO–CH₂–CO₂Et',
      note:'No O–H anywhere. Both candidates are carbon acids, which is the point: the question is not "which atom" but "which carbon".',
      sites:[
        { label:'central CH₂', pKa:10.7, why:'Between a ketone and an ester. The carbanion is delocalized onto two carbonyl oxygens, which is worth roughly ten pKa units over a simple ketone — and puts it in reach of ordinary bases.' },
        { label:'terminal CH₃', pKa:20, approx:true, why:'On the far side of the ketone. It has one carbonyl to delocalize onto instead of two, which is a simple ketone alpha proton and nothing more.' }
      ]
    },
    {
      id:'pentanedione2', name:'2,4-pentanedione', formula:'CH₃CO–CH₂–COCH₃',
      note:'Two ketones rather than a ketone and an ester, and it shows.',
      sites:[
        { label:'central CH₂', pKa:8.9, why:'Between two ketones. More acidic than phenol — a carbon acid you can deprotonate with hydroxide, which is a sentence most students do not believe the first time.' },
        { label:'terminal CH₃', pKa:20, approx:true, why:'An ordinary ketone alpha position with one carbonyl to work with.' }
      ]
    },
    {
      id:'aceticmulti', name:'Acetic acid', formula:'CH₃–COOH',
      note:'The one nobody thinks of as having two sites. It does, and the gap between them is about twenty orders of magnitude.',
      sites:[
        { label:'O–H', pKa:4.76, why:'The carboxylic acid proton. Charge split between two equivalent oxygens.' },
        { label:'α C–H', pKa:24, approx:true, why:'The methyl. It is next to a carbonyl, so it is not hopeless — but that carbonyl is already busy being half of a carboxylate, and a carbon acid next to an acid group is nothing like one next to a ketone.' }
      ]
    }
  ];

  /* Ordered by the acidity of the parent hydrides — CH₄ < NH₃ < H₂O < H₂S <
     HF < HCl < HBr < HI — so the rank is the measurement, and the text below
     only claims a rule where one applies: across a row, or down a column. */
  var ATOM_RANK = { C:0, N:1, O:2, S:3, F:4, Cl:5, Br:6, I:7 };
  var ATOM_WHY = {
    C:'carbon', N:'nitrogen', O:'oxygen', F:'fluorine', S:'sulfur', Cl:'chlorine', Br:'bromine', I:'iodine'
  };
  var SAME_ROW = { C:2, N:2, O:2, F:2, S:3, Cl:3, Br:4, I:5 };
  var GROUP = { C:14, N:15, O:16, F:17, S:16, Cl:17, Br:17, I:17 };
  var PAULING = { C:2.55, N:3.04, O:3.44, F:3.98, S:2.58, Cl:3.16, Br:2.96, I:2.66 };

  /* The atom that matters is the one the charge ENDS UP on, which is not
     always the one the proton left. Acetone's proton comes off a carbon and
     the resulting charge spends most of its time on the oxygen, and comparing
     the drawn site instead would rank 2,4-pentanedione below phenol — the
     wrong way round, and by exactly the reasoning students are told to use. */
  function carrierOf(a){ return a.carrier || a.atom; }

  function atomArgument(a, b){
    var ca = carrierOf(a), cb = carrierOf(b);
    if(ca === cb) return null;
    var ra = ATOM_RANK[ca], rb = ATOM_RANK[cb];
    var winner = ra > rb ? a : b;
    var sameRow = SAME_ROW[ca] === SAME_ROW[cb];
    var sameGroup = GROUP[ca] === GROUP[cb];
    var loserAtom = winner === a ? cb : ca, winAtom = winner === a ? ca : cb;
    var bigger = SAME_ROW[winAtom] > SAME_ROW[loserAtom];
    var moreEN = PAULING[winAtom] > PAULING[loserAtom];
    var Win = ATOM_WHY[winAtom].charAt(0).toUpperCase() + ATOM_WHY[winAtom].slice(1);
    var moved = (a.carrier && a.carrier !== a.atom) || (b.carrier && b.carrier !== b.atom);
    return {
      factor:'Atom',
      winner: winner,
      moved: moved,
      text: (moved ? 'Careful where you look: in one of these the proton comes off a carbon, but the charge does not stay there — resonance moves it onto oxygen, and it is the atom that ends up holding the charge that counts, not the one the hydrogen left. ' : '') +
        (sameRow
        ? 'The charge ends up on ' + ATOM_WHY[ca] + ' in one and ' + ATOM_WHY[cb] + ' in the other, and they are in the same row of the periodic table. ' +
          'Across a row, electronegativity decides: the more electronegative atom is happier holding the negative charge, so ' + winner.name + ' is the stronger acid.'
        : sameGroup
        ? 'The charge lands on ' + ATOM_WHY[ca] + ' in one and ' + ATOM_WHY[cb] + ' in the other, and these are in the same column. ' +
          'Going DOWN a column, size beats electronegativity — the bigger atom spreads the same charge over a much larger volume. ' +
          'That is why ' + winner.name + ' wins even though it is the less electronegative one.'
        : 'The charge lands on ' + ATOM_WHY[ca] + ' in one and ' + ATOM_WHY[cb] + ' in the other, and these are in different rows AND different columns, ' +
          'so neither the across-a-row rule nor the down-a-column rule settles it on its own. ' +
          (bigger && moreEN
            ? Win + ' is both the bigger atom and the more electronegative one, so the two effects point the same way. '
            : bigger
            ? Win + ' is the bigger atom but the less electronegative one, and here size wins. '
            : Win + ' is the smaller atom but far more electronegative, and here electronegativity wins. ') +
          'For diagonal pairs like this, the parent hydrides are the reliable guide: CH₄ < NH₃ < H₂O < H₂S < HF < HCl < HBr < HI, weakest acid to strongest, ' +
          'which puts ' + winner.name + ' ahead.')
    };
  }

  /* Delocalization is compared by quality before quantity: how many
     ELECTRONEGATIVE atoms share the charge, and only then how many atoms
     share it at all. Counting raw contributors ranks phenoxide above acetate
     — four atoms against two — when acetate is five orders of magnitude more
     acidic, because acetate's two are both oxygens and three of phenoxide's
     four are carbons that would rather not hold a negative charge. */
  function resonanceArgument(a, b){
    if(a.resO === b.resO && a.res === b.res) return null;
    var winner, loser, byQuality = a.resO !== b.resO;
    if(byQuality) winner = a.resO > b.resO ? a : b;
    else winner = a.res > b.res ? a : b;
    loser = winner === a ? b : a;
    return {
      factor:'Resonance',
      winner: winner,
      text: byQuality
        ? 'Both conjugate bases delocalize, so the question is not how far but onto what. ' + winner.name +
          ' spreads its charge onto ' + winner.resO + ' electronegative atom' + (winner.resO === 1 ? '' : 's') +
          ', against ' + loser.resO + ' for ' + loser.name + ' — the rest of ' + loser.name + '’s delocalization ' +
          'is onto carbon, which would much rather not hold a negative charge. Counting contributors alone would ' +
          'get this backwards.'
        : 'Same atom holding the charge, so the next question is whether it holds it alone. ' +
          winner.name + '’s conjugate base spreads the charge over ' + winner.res + ' atom' + (winner.res === 1 ? '' : 's') +
          (loser.res === 1 ? ', while ' + loser.name + '’s keeps it on one.' : ', against ' + loser.res + ' for ' + loser.name + '.') +
          ' Delocalization is the single biggest structural lever there is — spreading a charge is always stabilizing.'
    };
  }

  function inductionArgument(a, b){
    if(Math.abs(a.ind - b.ind) < 0.05) return null;
    var winner = a.ind > b.ind ? a : b;
    return {
      factor:'Induction',
      winner: winner,
      text: 'Octets, atoms and delocalization all match, so what is left is the pull through the sigma bonds. ' +
        winner.name + ' has more electron-withdrawing power near the acidic site, which drains density away from the ' +
        'conjugate base and stabilizes it. Induction is additive and falls off sharply with every bond of distance — ' +
        'which is why moving one chlorine a single carbon further away gives back most of the effect.'
    };
  }

  var S_CHARACTER = { 'sp':50, 'sp²':33, 'sp³':25 };

  function orbitalArgument(a, b){
    if(a.hyb === b.hyb) return null;
    var winner = S_CHARACTER[a.hyb] > S_CHARACTER[b.hyb] ? a : b;
    var loser = winner === a ? b : a;
    return {
      factor:'Orbital',
      winner: winner,
      text: 'The charge sits in a ' + winner.hyb + ' orbital in ' + winner.name + ' and a ' + loser.hyb + ' one in ' + loser.name + '. ' +
        'An s orbital is spherical and centered on the nucleus, so the more s character a hybrid has, the closer it holds its ' +
        'electron pair and the more stable a lone pair in it is: ' + S_CHARACTER[winner.hyb] + '% against ' +
        S_CHARACTER[loser.hyb] + '%.'
    };
  }

  /* Walk the factors in the order they are meant to be applied, and return the
     first one that distinguishes the pair. */
  function analyse(a, b){
    var checks = [atomArgument, resonanceArgument, inductionArgument, orbitalArgument];
    var deciding = null, considered = [];
    checks.forEach(function(fn){
      var r = fn(a, b);
      if(r){ considered.push(r); if(!deciding) deciding = r; }
      else considered.push({ factor: fn === atomArgument ? 'Atom' :
                             fn === resonanceArgument ? 'Resonance' :
                             fn === inductionArgument ? 'Induction' : 'Orbital',
                             winner:null, text:'No difference — this factor does not separate them.' });
    });

    var truth = a.pKa < b.pKa ? a : b;
    return {
      truth: truth,
      deciding: deciding,
      considered: considered,
      agrees: deciding ? deciding.winner === truth : null
    };
  }

  /* ---- Drawn structures ---------------------------------------------------

     Ranking acids is reading structures: which atom holds the charge, what
     it can spread onto, what pulls on it. So every acid is drawn, parsed
     from a condensed formula by mol-builder.js (a ring as a ring spec), and
     the proton in question sits on the atom shown in bold. A formula the
     reader cannot handle simply falls back to the text formula. */
  var DRAWN = {
    ethane:'CH3CH3', ethene:'CH2=CH2', ethyne:'HC#CH', ammonia:'NH3', methylamine:'CH3NH2', water:'H2O',
    ethanol:'CH3CH2OH', tbuoh:'(CH3)3COH', phenol:{ n:6, aromatic:true, subs:{ 0:'OH' } },
    pnitrophenol:{ n:6, aromatic:true, subs:{ 0:'OH', 3:'NO2' } }, acetic:'CH3C(=O)OH', formic:'HC(=O)OH',
    benzoic:{ n:6, aromatic:true, subs:{ 0:'COOH' } }, chloroacetic:'ClCH2COOH', dichloroacetic:'ClCH(Cl)COOH',
    trichloroacetic:'ClC(Cl)(Cl)COOH', tfa:'FC(F)(F)COOH', chloropropanoic:'ClCH2CH2COOH', hf:'HF', hcl:'HCl',
    hbr:'HBr', h2s:'H2S', ethanethiol:'CH3CH2SH', hcn:'HC#N', acetone:'CH3C(=O)CH3',
    malonate:'CH3CH2OC(=O)CH2C(=O)OCH2CH3', pentanedione:'CH3C(=O)CH2C(=O)CH3',
    phenylacetic:{ n:6, aromatic:true, subs:{ 0:'CH2COOH' } }, cyanoacetic:'N#CCH2COOH', fluoroacetic:'FCH2COOH',
    oxalic:'HOC(=O)C(=O)OH', benzenesulfonic:{ n:6, aromatic:true, subs:{ 0:'SO3H' } },
    phenylammonium:{ n:6, aromatic:true, subs:{ 0:'NH3+' } }, ethylammonium:'CH3CH2NH3+',
    cyclopentadiene:{ n:5, unsat:[[0,1],[2,3]] }, 'nitromethane-ab':'CH3NO2',
    phenylacetylene:{ n:6, aromatic:true, subs:{ 0:'C#CH' } }, tfe:'FC(F)(F)CH2OH', 'hydrogen-peroxide':'HOOH'
  };
  /* Which proton site in a multi-site molecule sits on which drawn atom (keys
     as the parser numbers them). A site with no atom is still in the ranking
     but is not a tap target — malonic acid's second COOH only exists after
     the first has gone. */
  var MULTI_DRAWN = {
    glycine:{ f:'NH3+CH2COOH', at:{ 'COOH':['a5'], '⁺NH₃':['a1'] } },
    salicylic:{ f:{ n:6, aromatic:true, subs:{ 0:'COOH', 1:'OH' } }, at:{ 'COOH':['a9'], 'phenol OH':['a10'] } },
    hydroxybenzoic:{ f:{ n:6, aromatic:true, subs:{ 0:'COOH', 3:'OH' } }, at:{ 'COOH':['a9'], 'phenol OH':['a10'] } },
    cysteine:{ f:'NH3+CH(CH2SH)COOH', at:{ 'COOH':['a7'], 'SH':['a4'], '⁺NH₃':['a1'] } },
    malonic:{ f:'HOC(=O)CH2C(=O)OH', at:{ 'first COOH':['a1','a7'], 'α C–H':['a4'] } },
    acetoacetate:{ f:'CH3C(=O)CH2C(=O)OCH2CH3', at:{ 'central CH₂':['a4'], 'terminal CH₃':['a1'] } },
    pentanedione2:{ f:'CH3C(=O)CH2C(=O)CH3', at:{ 'central CH₂':['a4'], 'terminal CH₃':['a1','a7'] } },
    aceticmulti:{ f:'CH3C(=O)OH', at:{ 'O–H':['a4'], 'α C–H':['a1'] } }
  };

  var Bld = window.OchemBuilder, MolR = window.OchemMolecules, ChemC = window.OchemChem;
  var SUBD = '₀₁₂₃₄₅₆₇₈₉';
  function parseDrawn(f){
    if(!Bld || !ChemC || !f) return null;
    try{
      var r = typeof f === 'string' ? Bld.parse(f) : Bld.parseRing(f);
      if(!r || !r.st) return null;
      Bld.centre(r.st);
      return r.st;
    }catch(e){ return null; }
  }
  /* Labels carry their hydrogens (OH, CH₂, NH₃⁺): the hydrogen is the thing
     being asked about, and a skeletal C with no H on it hides it. */
  function drawing(st){
    var mol = ChemC.toMolecule(st);
    Object.keys(st.atoms).forEach(function(k){
      var a = st.atoms[k], m = mol.atoms[k];
      if(!a.el || a.group) return;
      var h = a.hFixed !== undefined ? a.hFixed : (a.hImplicit || 0);
      var hs = h > 0 ? 'H' + (h > 1 ? SUBD[h] : '') : '';
      // HF, HCl, H₂S read hydrogen-first; everything else element-first (OH, CH₂).
      /* Hydrides read hydrogen-first (HF, H₂O, H₂S); in a bigger molecule
         an atom reads element-first (OH, CH₂, NH₃). */
      var heavy = Object.keys(st.atoms).filter(function(o){ return st.atoms[o].el !== 'H'; }).length;
      m.label = /^(F|Cl|Br|I)$/.test(a.el) || (heavy === 1 && a.el !== 'N') ? hs + a.el : a.el + hs;
      m.r = Math.max(m.r || 14, m.label.length > 2 ? 17 : 15);
    });
    /* Cropped to the atoms, so HCl and phenylacetic acid both fill their
       card instead of sitting at one scale in a 320 by 170 field; never
       narrower than 190 units, so a hydride is not blown up to a disc. */
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    Object.keys(mol.atoms).forEach(function(k){ var t = mol.atoms[k], pd = t.r + (t.lp ? 11 : 4);
      x0 = Math.min(x0, t.x - pd); x1 = Math.max(x1, t.x + pd); y0 = Math.min(y0, t.y - pd); y1 = Math.max(y1, t.y + pd); });
    var w = Math.max(190, x1 - x0), hgt = Math.max(96, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    mol.viewBox = Math.round(cx - w / 2) + ' ' + Math.round(cy - hgt / 2) + ' ' + Math.round(w) + ' ' + Math.round(hgt);
    return mol;
  }
  function structSvg(f, label, opts){
    var st = parseDrawn(f);
    if(!st || !MolR) return '';
    opts = opts || {};
    opts.caption = '';
    opts.label = label;
    return MolR.svg(drawing(st), opts);
  }

  /* ---- State ------------------------------------------------------------ */

  var left = ACIDS[10];   // acetic acid
  var right = ACIDS[8];   // phenol
  var guess = null, revealed = false;
  var score = { right:0, total:0 };

  var rankPool = [], rankOrder = [], rankChecked = false;

  root.innerHTML =
    '<div class="tpanel">' +
      '<div class="tpanel__head">' +
        '<div class="tseg" id="abMode">' +
          '<button type="button" data-mode="pair" class="on">Compare two</button>' +
          '<button type="button" data-mode="rank">Rank four</button>' +
          '<button type="button" data-mode="site">Which proton?</button>' +
        '</div>' +
        '<span class="tmuted" id="abScore"></span>' +
      '</div>' +
    '</div>' +

    '<div id="abPair">' +
      '<div class="tpanel">' +
        '<div class="ab-vs">' +
          '<div class="tfield"><label for="abLeft">Acid A</label><select class="tselect" id="abLeft"></select></div>' +
          '<div class="ab-vs__mid">vs</div>' +
          '<div class="tfield"><label for="abRight">Acid B</label><select class="tselect" id="abRight"></select></div>' +
        '</div>' +
        '<div class="ab-cards" id="abCards"></div>' +
      '</div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head">Which loses its proton more easily?</div>' +
        '<div class="tchips" id="abGuess"></div>' +
        '<div aria-live="polite" id="abVerdict" style="margin-top:14px;"></div>' +
      '</div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head">Atom, resonance, induction, orbital</div>' +
        '<div id="abFactors"></div>' +
      '</div>' +
    '</div>' +

    '<div id="abRank" hidden>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head"><span>Line them up, most acidic first</span>' +
          '<button type="button" class="tchip" id="abNewRank">New set</button></div>' +
        '<div id="abRankPool"></div>' +
        '<div class="ab-rorder" id="abRankOrder"></div>' +
        '<div class="trow ab-ract" id="abRankAct"></div>' +
        '<div class="sr-only" aria-live="polite" id="abRankLive"></div>' +
        '<div aria-live="polite" id="abRankVerdict"></div>' +
      '</div>' +
    '</div>' +

    '<div id="abSite" hidden>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head"><span>One molecule, several acidic hydrogens</span>' +
          '<select class="tselect" id="abSiteSel"></select></div>' +
        '<div class="ab-site__formula" id="abSiteFormula"></div>' +
        '<p class="tmuted" id="abSiteNote"></p>' +
        '<div class="tpanel__head" style="margin-top:8px;">Which one comes off first? Tap it on the structure, or pick below</div>' +
        '<div class="tchips" id="abSiteGuess"></div>' +
        '<div aria-live="polite" id="abSiteVerdict" style="margin-top:14px;"></div>' +
      '</div>' +
    '</div>';

  var elLeft = document.getElementById('abLeft');
  var elRight = document.getElementById('abRight');

  function options(sel){
    return ACIDS.map(function(a){
      return '<option value="' + a.id + '"' + (a.id === sel.id ? ' selected' : '') + '>' +
        esc(a.name) + ' — ' + esc(a.formula) + '</option>';
    }).join('');
  }
  function byId(id){
    for(var i=0;i<ACIDS.length;i++) if(ACIDS[i].id === id) return ACIDS[i];
    return ACIDS[0];
  }

  elLeft.innerHTML = options(left);
  elRight.innerHTML = options(right);
  elLeft.addEventListener('change', function(){ left = byId(elLeft.value); resetPair(); });
  elRight.addEventListener('change', function(){ right = byId(elRight.value); resetPair(); });

  document.getElementById('abMode').querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      var m = b.getAttribute('data-mode');
      document.getElementById('abMode').querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); });
      document.getElementById('abPair').hidden = m !== 'pair';
      document.getElementById('abRank').hidden = m !== 'rank';
      document.getElementById('abSite').hidden = m !== 'site';
      if(m === 'rank' && !rankPool.length) newRank();
      if(m === 'site') renderSite();
    });
  });

  function resetPair(){
    guess = null; revealed = false;
    renderPair();
  }

  function sync(){
    if(!window.OchemToolState) return;
    var m = document.getElementById('abMode').querySelector('.on');
    var mode = m ? m.getAttribute('data-mode') : 'pair';
    window.OchemToolState.write({
      mode: mode === 'pair' ? null : mode,
      a: mode === 'pair' ? left.id : null,
      b: mode === 'pair' ? right.id : null,
      m: mode === 'site' ? siteMol.id : null
    });
  }

  function renderPair(){
    sync();
    document.getElementById('abScore').textContent = score.total ? score.right + ' of ' + score.total + ' right' : '';

    document.getElementById('abCards').innerHTML = [left, right].map(function(a){
      return '<div class="ab-card' + (revealed && a === analyse(left, right).truth ? ' ab-card--win' : '') + '">' +
        '<div class="ab-card__name">' + esc(a.name) + '</div>' +
        (structSvg(DRAWN[a.id], a.name) || '') +
        '<div class="ab-card__formula">' + esc(a.formula) + '</div>' +
        '<div class="ab-card__row"><span>Acidic proton</span><b>' + esc(a.site) + '</b></div>' +
        '<div class="ab-card__row"><span>Conjugate base</span><b>' + esc(a.cbase) + '</b></div>' +
        '<div class="ab-card__row"><span>pK<sub>a</sub></span><b>' + (revealed ? a.pKa : '?') + '</b></div>' +
      '</div>';
    }).join('<div class="ab-cards__vs">vs</div>');

    document.getElementById('abGuess').innerHTML =
      [left, right].map(function(a){
        return '<button type="button" class="tchip' + (guess === a.id ? ' on' : '') + '" data-id="' + esc(a.id) + '">' +
          esc(a.name) + '</button>';
      }).join('');
    document.getElementById('abGuess').querySelectorAll('.tchip').forEach(function(b){
      b.addEventListener('click', function(){
        if(revealed) return;
        guess = b.getAttribute('data-id');
        revealed = true;
        score.total++;
        if(guess === analyse(left, right).truth.id) score.right++;
        renderPair();
      });
    });

    var elV = document.getElementById('abVerdict');
    var elF = document.getElementById('abFactors');

    if(left.id === right.id){
      elV.innerHTML = '<div class="tnote tnote--warn"><span class="tnote__k">Same compound</span>Pick two different acids.</div>';
      elF.innerHTML = '';
      return;
    }

    if(!revealed){
      elV.innerHTML = '';
      elF.innerHTML = '<div class="tempty">Work it out first.<br>Which atom carries the charge in each conjugate base? ' +
        'Can either one spread it? Is anything pulling on it through the bonds? What orbital is it sitting in?</div>';
      return;
    }

    var res = analyse(left, right);
    var other = res.truth === left ? right : left;
    var dpKa = Math.abs(left.pKa - right.pKa);
    var ratio = Math.pow(10, dpKa);

    var correct = guess === res.truth.id;
    var html = '<div class="tnote ' + (correct ? 'tnote--good' : 'tnote--bad') + '">' +
      '<span class="tnote__k">' + (correct ? 'Right' : 'Not this time') + '</span>' +
      esc(res.truth.name) + ' is the stronger acid — pK<sub>a</sub> ' + res.truth.pKa + ' against ' + other.pKa + '. ' +
      'That gap of ' + dpKa.toFixed(2).replace(/\.?0+$/, '') + ' pK<sub>a</sub> units means it is about ' +
      formatRatio(ratio) + ' times more dissociated at equilibrium — pK<sub>a</sub> is a log scale, so small-looking ' +
      'differences are not small.</div>';

    html += '<div class="tnote tnote--info"><span class="tnote__k">Why its conjugate base is more stable</span>' +
      esc(res.truth.why) + '</div>';

    if(!res.deciding){
      /* Nothing in the structural toolkit distinguishes them — which is the
         actual answer for ethanol against water, and worth saying rather than
         leaving the factor table silently blank. */
      html += '<div class="tnote tnote--warn"><span class="tnote__k">The structural rules cannot separate these</span>' +
        'Atom, resonance, induction and orbital all come out identical — by every factor you are taught to apply, ' +
        'these two should be equally acidic, and the measured pK<sub>a</sub> values are indeed only ' +
        dpKa.toFixed(2).replace(/\.?0+$/, '') + ' apart. What decides it is solvation: the smaller, less hindered ' +
        'anion is surrounded more closely by solvent molecules and stabilized more. That is a real effect and it is ' +
        'genuinely not in the mnemonic, which is why differences this small are worth memorizing rather than deriving.</div>';
    } else if(!res.agrees){
      /* The interesting case. Saying "the rules say X, the measurement says Y"
         is more useful than picking whichever one makes the lesson tidy. */
      html += '<div class="tnote tnote--warn"><span class="tnote__k">The rules and the measurement disagree here</span>' +
        'Walking the factors in order, ' + esc(res.deciding.factor.toLowerCase()) + ' points at ' + esc(res.deciding.winner.name) +
        ' — but the measured pK<sub>a</sub> says ' + esc(res.truth.name) + '. These two are close enough that something the ' +
        'structural rules do not cover decides it: usually how well the solvent can surround and stabilize the anion. ' +
        'Usually it is one of two things the mnemonic does not capture. Delocalization has a quality as well as an extent ' +
        '— charge spread onto more atoms is not better if the extra atoms are carbons — and solvation stabilizes a small, ' +
        'unhindered anion far more than a bulky one. Neither appears anywhere in atom, resonance, induction or orbital. ' +
        'Worth knowing the mnemonic has edges, rather than trusting it blindly.</div>';
    }

    elV.innerHTML = html;

    elF.innerHTML = '<div class="ttable-scroll"><table class="ttable">' +
      '<thead><tr><th>Factor</th><th>Points to</th><th>Reasoning</th></tr></thead><tbody>' +
      res.considered.map(function(c){
        var decided = res.deciding && c.factor === res.deciding.factor;
        return '<tr>' +
          '<td style="white-space:nowrap;"><b>' + esc(c.factor) + '</b>' +
            (decided ? '<br><span class="tmuted" style="font-size:11px;">decides it</span>' : '') + '</td>' +
          '<td class="' + (c.winner ? 'win' : 'lose') + '" style="white-space:nowrap;">' +
            (c.winner ? esc(c.winner.name) : '—') + '</td>' +
          '<td>' + esc(c.text) + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<p class="tmuted" style="margin-top:12px;">The order matters as much as the list. Atom first, because which element ' +
      'holds the charge outweighs everything else; then resonance; then induction; then hybridization. A factor only gets ' +
      'consulted when the ones above it tie.</p>';
  }

  function formatRatio(r){
    if(r >= 1e6) return r.toExponential(0).replace('e+', ' × 10^');
    if(r >= 1000) return Math.round(r / 1000) + ' thousand';
    return Math.round(r).toLocaleString();
  }

  /* ---- Ranking mode: the pKa line ----------------------------------------

     Four drawn acids in a row. Drag them (or tap one, then tap where it
     goes, or use its arrow buttons) into order from most to least acidic,
     then put them on the line: each card's marker slides to its measured pKa
     and the gap to its neighbour is explained by analyse(), the same
     atom-resonance-induction-orbital walk the Compare mode shows. */

  var rankPick = -1;

  function newRank(){
    var pool = ACIDS.slice();
    rankPool = [];
    /* Four acids at least a pKa unit apart, so the order is a fair thing to
       ask for rather than something inside the measurements' own scatter. */
    var tries = 0;
    while(rankPool.length < 4 && tries++ < 400){
      var c = pool[Math.floor(Math.random() * pool.length)];
      if(rankPool.indexOf(c) >= 0) continue;
      if(rankPool.some(function(x){ return Math.abs(x.pKa - c.pKa) < 1; })) continue;
      rankPool.push(c);
    }
    rankOrder = rankPool.slice();
    rankChecked = false;
    rankPick = -1;
    renderRank();
  }

  function moveRank(from, to){
    if(rankChecked || from === to || to < 0 || to > 3) return;
    var item = rankOrder.splice(from, 1)[0];
    rankOrder.splice(to, 0, item);
    rankPick = -1;
    renderRank();
    var live = document.getElementById('abRankLive');
    if(live) live.textContent = item.name + ' moved to position ' + (to + 1) + '. Order: ' +
      rankOrder.map(function(a){ return a.name; }).join(', ') + '.';
    var btn = document.querySelector('#abRankOrder [data-i="' + to + '"] .ab-rcard__body');
    if(btn) btn.focus();
  }

  /* Where on the line: linear over the four values with padding, because a
     fixed -10 to 50 axis would put three carboxylic acids on one pixel. */
  function lineX(v, lo, hi){ return 24 + (v - lo) / ((hi - lo) || 1) * 352; }

  function renderRank(){
    var truth = rankPool.slice().sort(function(x, y){ return x.pKa - y.pKa; });
    var lo = truth[0].pKa, hi = truth[3].pKa, pad = Math.max(1, (hi - lo) * 0.08);
    lo -= pad; hi += pad;

    var line = '<svg class="ab-line" viewBox="0 0 400 112" role="img" aria-label="' +
      (rankChecked ? 'pKa line: ' + truth.map(function(a){ return a.name + ' ' + a.pKa; }).join(', ') : 'pKa line, hidden until you place them') + '">' +
      '<line x1="14" y1="74" x2="386" y2="74" class="ab-line__axis"/>' +
      '<text x="14" y="108" class="ab-line__end">← more acidic</text>' +
      '<text x="386" y="108" text-anchor="end" class="ab-line__end">less acidic →</text>';
    var step = (hi - lo) > 30 ? 10 : (hi - lo) > 12 ? 5 : (hi - lo) > 5 ? 2 : 1;
    for(var t = Math.ceil(lo / step) * step; t <= hi; t += step){
      var x = lineX(t, lo, hi);
      line += '<line x1="' + x + '" y1="69" x2="' + x + '" y2="79" class="ab-line__tick"/>' +
        (rankChecked ? '<text x="' + x + '" y="93" text-anchor="middle" class="ab-line__num">' + t + '</text>' : '');
    }
    rankOrder.forEach(function(a, i){
      var ok = rankChecked && truth[i] === a;
      var x = rankChecked ? lineX(a.pKa, lo, hi) : 40 + i * 106;
      var anchor = x < 70 ? 'start' : x > 330 ? 'end' : 'middle';
      line += '<g class="ab-line__pin' + (rankChecked ? (ok ? ' is-ok' : ' is-no') : ' is-wait') + '" style="transform:translate(' + x.toFixed(1) + 'px,0)">' +
        '<line x1="0" y1="' + (i % 2 ? 40 : 18) + '" x2="0" y2="64" class="ab-line__stem"/>' +
        '<circle cx="0" cy="74" r="10"/>' +
        '<text x="' + (anchor === 'start' ? -8 : anchor === 'end' ? 8 : 0) + '" y="' + (i % 2 ? 36 : 14) + '" text-anchor="' + anchor + '" class="ab-line__lab">' +
          esc(a.name.length > 18 ? a.name.slice(0, 17) + '…' : a.name) + (rankChecked ? ' ' + a.pKa : '') + '</text>' +
        '<text x="0" y="78" text-anchor="middle" class="ab-line__n">' + (i + 1) + '</text></g>';
    });
    line += '</svg>';
    document.getElementById('abRankPool').innerHTML = line;

    document.getElementById('abRankOrder').innerHTML = rankOrder.map(function(a, i){
      var ok = rankChecked && truth[i] === a;
      return '<div class="ab-rcard' + (rankPick === i ? ' is-pick' : '') + (rankChecked ? (ok ? ' is-ok' : ' is-no') : '') + '" data-i="' + i + '">' +
        '<button type="button" class="ab-rcard__body" aria-label="' + esc((i + 1) + ': ' + a.name + (rankChecked ? ', pKa ' + a.pKa : '') +
          (rankChecked ? '' : '. Tap, then tap another card to swap; or use the arrow buttons')) + '"' + (rankChecked ? ' disabled' : '') + '>' +
          '<span class="ab-rcard__n">' + (i + 1) + '</span>' +
          (structSvg(DRAWN[a.id], a.name) || '<span class="tformula">' + esc(a.formula) + '</span>') +
          '<span class="ab-rcard__name">' + esc(a.name) + '</span>' +
          (rankChecked ? '<span class="ab-rcard__pka">pK<sub>a</sub> ' + a.pKa + '</span>' : '') +
        '</button>' +
        (rankChecked ? '' :
          '<span class="ab-rcard__move">' +
            '<button type="button" class="tchip tchip--mini" data-mv="-1" aria-label="Move ' + esc(a.name) + ' earlier"' + (i === 0 ? ' disabled' : '') + '>&larr;</button>' +
            '<button type="button" class="tchip tchip--mini" data-mv="1" aria-label="Move ' + esc(a.name) + ' later"' + (i === 3 ? ' disabled' : '') + '>&rarr;</button>' +
          '</span>') +
      '</div>';
    }).join('');

    var act = document.getElementById('abRankAct');
    act.innerHTML = rankChecked ? '' :
      '<button type="button" class="btn-press" id="abRankCheck">Put them on the pK<sub>a</sub> line</button>' +
      '<span class="tmuted">Most acidic first. Drag the cards, or tap one and then another to swap them.</span>';
    var chk = document.getElementById('abRankCheck');
    if(chk) chk.addEventListener('click', function(){
      rankChecked = true;
      score.total++;
      if(rankOrder.every(function(a, i){ return truth[i] === a; })) score.right++;
      document.getElementById('abScore').textContent = score.right + ' of ' + score.total + ' right';
      renderRank();
    });

    if(!rankChecked){ document.getElementById('abRankVerdict').innerHTML = ''; return; }

    var got = rankOrder.every(function(a, i){ return truth[i] === a; });
    var placed = rankOrder.filter(function(a, i){ return truth[i] === a; }).length;
    document.getElementById('abRankVerdict').innerHTML =
      '<div class="tnote ' + (got ? 'tnote--good' : 'tnote--bad') + '" style="margin-top:14px;">' +
        '<span class="tnote__k">' + (got ? 'All four in order' : placed + ' of 4 in the right place') + '</span>' +
        'Most acidic to least: ' + truth.map(function(a){ return esc(a.name) + ' (' + a.pKa + ')'; }).join(' → ') + '.' +
      '</div>' +
      '<div class="ab-gaps">' +
      truth.slice(0, 3).map(function(a, i){
        var b = truth[i + 1], res = analyse(a, b), d = res.deciding;
        var swapped = rankOrder.indexOf(a) > rankOrder.indexOf(b);
        return '<div class="ab-gap' + (swapped ? ' is-no' : '') + '">' +
          '<div class="ab-gap__h"><b>' + esc(a.name) + '</b> beats <b>' + esc(b.name) + '</b>' +
          ' <span class="tmuted">by ' + (b.pKa - a.pKa).toFixed(1).replace(/\.0$/, '') + ' units, ' + factorWords(b.pKa - a.pKa) + '</span>' +
          (swapped ? ' <span class="ab-gap__x">you had these the other way</span>' : '') + '</div>' +
          (d && res.agrees ? '<span class="ab-ario">' + esc(d.factor) + '</span> ' + esc(d.text)
            : d ? '<span class="ab-ario ab-ario--warn">Rules disagree</span> ' + esc(d.factor) + ' points at ' + esc(d.winner.name) +
                  ', but the measurement says ' + esc(a.name) + '. ' + esc(a.why)
            : '<span class="ab-ario ab-ario--warn">Solvation</span> Atom, resonance, induction and orbital all tie; ' + esc(a.why)) +
        '</div>';
      }).join('') + '</div>' +
      '<button type="button" class="tchip" id="abRankAgain" style="margin-top:12px;">New set of four</button>';
    document.getElementById('abRankAgain').addEventListener('click', newRank);
  }

  /* Drag, tap-to-swap and arrow buttons, all on the container so a re-render
     never leaves a card without its handlers. */
  (function(){
    var box = document.getElementById('abRankOrder');
    var drag = null;
    box.addEventListener('click', function(e){
      var mv = e.target.closest('[data-mv]');
      var card = e.target.closest('.ab-rcard');
      if(!card || rankChecked) return;
      var i = parseInt(card.getAttribute('data-i'), 10);
      if(mv){ moveRank(i, i + parseInt(mv.getAttribute('data-mv'), 10)); return; }
      if(drag && drag.moved) return;
      if(rankPick < 0){ rankPick = i; renderRank(); var b = box.querySelector('[data-i="' + i + '"] .ab-rcard__body'); if(b) b.focus(); return; }
      if(rankPick === i){ rankPick = -1; renderRank(); return; }
      var a = rankOrder[rankPick]; rankOrder[rankPick] = rankOrder[i]; rankOrder[i] = a;
      rankPick = -1; renderRank();
    });
    box.addEventListener('pointerdown', function(e){
      var card = e.target.closest('.ab-rcard');
      if(!card || rankChecked || e.target.closest('[data-mv]') || e.button > 0) return;
      drag = { el: card, i: parseInt(card.getAttribute('data-i'), 10), x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
    });
    box.addEventListener('pointermove', function(e){
      if(!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if(!drag.moved && Math.abs(dx) + Math.abs(dy) < 8) return;
      if(!drag.moved){ drag.moved = true; drag.el.classList.add('is-drag'); try{ box.setPointerCapture(e.pointerId); }catch(err){} }
      e.preventDefault();
      drag.el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      var best = drag.i, bestD = Infinity;
      box.querySelectorAll('.ab-rcard').forEach(function(c){
        var r = c.getBoundingClientRect();
        var d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if(c !== drag.el && d < bestD){ bestD = d; best = parseInt(c.getAttribute('data-i'), 10); }
        c.classList.remove('is-target');
      });
      drag.to = bestD < 140 ? best : drag.i;
      var tgt = box.querySelector('[data-i="' + drag.to + '"]');
      if(tgt && drag.to !== drag.i) tgt.classList.add('is-target');
    });
    function end(){
      if(!drag) return;
      var d = drag;
      setTimeout(function(){ drag = null; }, 0);
      if(d.moved){ d.el.style.transform = ''; d.el.classList.remove('is-drag');
        if(d.to !== undefined && d.to !== d.i) moveRank(d.i, d.to); else renderRank(); }
    }
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
  })();

  document.getElementById('abNewRank').addEventListener('click', newRank);

  renderPair();
  /* ---- Which proton comes off first --------------------------------------

     Not a comparison between molecules: a comparison between positions inside
     one. Everything above still applies — atom, resonance, induction — but it
     is applied to each site in turn, which is a harder thing to do and the
     thing the question on the page actually asks for.

     The gaps are the teaching. Glycine's two sites are seven pKa units apart
     and students routinely pick the nitrogen; salicylic acid's are ten apart
     and the reason is a hydrogen bond that makes one group stronger and the
     other much weaker at the same time. */
  var siteMol = MULTI[0], siteGuess = null;

  function siteText(st){
    return (st.approx ? '~' : '') + st.pKa;
  }

  /* A pKa gap is a power of ten, and "3 × 10^7" printed with a caret is the
     kind of typography that makes a number look like debug output. The rest of
     the site already uses real superscripts. */
  var SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
  function factorWords(d){
    var n = Math.round(d);
    if(n <= 3) return 'about ' + Math.round(Math.pow(10, d)).toLocaleString() + ' times';
    return 'about 10' + String(n).split('').map(function(c){ return SUP[c] || c; }).join('') + ' times';
  }

  function renderSite(){
    var sel = document.getElementById('abSiteSel');
    sel.innerHTML = MULTI.map(function(m){
      return '<option value="' + esc(m.id) + '"' + (m.id === siteMol.id ? ' selected' : '') + '>' + esc(m.name) + '</option>';
    }).join('');
    sel.onchange = function(){
      MULTI.forEach(function(m){ if(m.id === sel.value) siteMol = m; });
      siteGuess = null;
      renderSite();
    };

    sync();
    /* The molecule, drawn, with every candidate proton's atom tappable. The
       chips below stay as the list (and the keyboard path for sites that
       only exist on paper). */
    var md = MULTI_DRAWN[siteMol.id];
    var atomOf = {}, tap = [];
    if(md) Object.keys(md.at).forEach(function(lbl){ md.at[lbl].forEach(function(k){ atomOf[k] = lbl; tap.push(k); }); });
    var order0 = siteMol.sites.slice().sort(function(x, y){ return x.pKa - y.pKa; });
    var guessLbl = siteGuess === null ? null : siteMol.sites[siteGuess].label;
    var keysOf = function(lbl){ return md && md.at[lbl] ? md.at[lbl] : []; };
    var svg = md ? structSvg(md.f, siteMol.name + (siteGuess === null ? ', tap the hydrogen that comes off first' : ''), siteGuess === null
      ? { clickable: tap }
      : { correct: keysOf(order0[0].label), wrong: guessLbl !== order0[0].label ? keysOf(guessLbl) : [] }) : '';
    document.getElementById('abSiteFormula').innerHTML = svg
      ? '<div class="ab-site__mol">' + svg + '</div><div class="ab-site__f">' + esc(siteMol.formula) + '</div>'
      : esc(siteMol.formula);
    document.getElementById('abSiteFormula').querySelectorAll('.atom[data-key]').forEach(function(g){
      var k = g.getAttribute('data-key');
      if(!atomOf[k]) return;
      g.setAttribute('aria-label', atomOf[k] + ' proton');
      function pick(){
        if(siteGuess !== null) return;
        siteMol.sites.forEach(function(st, i){ if(st.label === atomOf[k]) siteGuess = i; });
        renderSite();
        var v = document.getElementById('abSiteVerdict'); if(v && window.LevlMotion) window.LevlMotion.scrollIntoView(v, { block:'nearest' });
      }
      g.addEventListener('click', pick);
      g.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pick(); } });
    });
    document.getElementById('abSiteNote').textContent = siteMol.note;

    document.getElementById('abSiteGuess').innerHTML = siteMol.sites.map(function(st, i){
      return '<button type="button" class="tchip' + (siteGuess === i ? ' on' : '') + '" data-i="' + i + '"' +
        (siteGuess !== null ? ' disabled' : '') + '>' + esc(st.label) + '</button>';
    }).join('');
    document.getElementById('abSiteGuess').querySelectorAll('.tchip').forEach(function(b){
      b.addEventListener('click', function(){
        if(siteGuess !== null) return;
        siteGuess = parseInt(b.getAttribute('data-i'), 10);
        renderSite();
      });
    });

    var v = document.getElementById('abSiteVerdict');
    if(siteGuess === null){
      v.innerHTML = '<p class="tmuted" style="margin:0;">The measured numbers stay hidden until you have picked.</p>';
      return;
    }

    var order = siteMol.sites.map(function(st, i){ return { st:st, i:i }; })
      .sort(function(a, b){ return a.st.pKa - b.st.pKa; });
    var right = order[0].i === siteGuess;

    v.innerHTML =
      '<div class="tnote ' + (right ? 'tnote--good' : 'tnote--bad') + '">' +
        '<span class="tnote__k">' + (right ? 'Right' : 'Not that one') + '</span>' +
        esc(order[0].st.label) + ' goes first, at pK' + 'a ' + esc(siteText(order[0].st)) + '. ' +
        (right ? '' : 'You picked ' + esc(siteMol.sites[siteGuess].label) + ', which comes off at ' +
          esc(siteText(siteMol.sites[siteGuess])) + ' — ' +
          Math.abs(siteMol.sites[siteGuess].pKa - order[0].st.pKa).toFixed(1) +
          ' pKa units later — ' +
          factorWords(Math.abs(siteMol.sites[siteGuess].pKa - order[0].st.pKa)) +
          ' harder to remove.') +
      '</div>' +
      '<div class="ab-order">' +
        order.map(function(o, rank){
          return '<div class="ab-slot' + (rank === 0 ? ' ab-slot--ok' : '') + '">' +
            '<span class="ab-slot__n">' + (rank + 1) + '</span>' +
            '<span>' + esc(o.st.label) + '</span>' +
            '<span class="ab-slot__pka">pKa ' + esc(siteText(o.st)) + '</span>' +
          '</div>' +
          '<p class="tmuted" style="margin:2px 0 8px 36px;font-size:12.5px;">' + esc(o.st.why) + '</p>';
        }).join('') +
      '</div>' +
      (siteMol.sites.some(function(st){ return st.approx; })
        ? '<p class="tmuted" style="margin-top:6px;font-size:11.5px;">A tilde means the table gives a range rather than a number — ' +
          'alpha C–H values in particular are quoted differently by different sources, and two decimal places there would be a precision nobody has.</p>'
        : '') +
      '<button type="button" class="tchip" id="abSiteAgain" style="margin-top:12px;">Try another</button>';

    var again = document.getElementById('abSiteAgain');
    if(again) again.addEventListener('click', function(){
      siteMol = MULTI[Math.floor(Math.random() * MULTI.length)];
      siteGuess = null;
      renderSite();
    });
  }

  if(window.OchemToolState){
    var q = window.OchemToolState.read();
    if(q.a) left = byId(q.a);
    if(q.b) right = byId(q.b);
    if(q.m) MULTI.forEach(function(x){ if(x.id === q.m) siteMol = x; });
    if(q.a || q.b){ elLeft.value = left.id; elRight.value = right.id; renderPair(); }
    if(q.mode === 'rank' || q.mode === 'site'){
      var mb = document.getElementById('abMode').querySelector('[data-mode="' + q.mode + '"]');
      if(mb) mb.click();
    }
  }

  window.OchemAcidBase = { ACIDS: ACIDS, MULTI: MULTI, DRAWN: DRAWN, MULTI_DRAWN: MULTI_DRAWN, parseDrawn: parseDrawn, analyse: analyse };

  /* ---- Check yourself ---------------------------------------------------
     The sandbox above hands you the answer the moment you pick two acids,
     which is right for exploring and useless for finding out whether you
     could have predicted it. So the quiz asks first.

     Pairs are drawn with a pKa gap of at least 1.5 units, because "which is
     more acidic" is only a fair question when the answer is not inside the
     measurement's own uncertainty — and the explanation is analyse()'s, the
     same reasoning the tool shows in its main panel, so the quiz can never
     teach a different chemistry from the tool it is attached to. */
  if(window.OchemToolQuiz){
    window.OchemToolQuiz.mount(document.getElementById('tool-quiz'), {
      slug: 'acid-base',
      rounds: 6,
      intro: 'Two structures at a time: which proton comes off first?',
      make: function(recent){
        var a, b, tries = 0;
        do {
          a = ACIDS[Math.floor(Math.random() * ACIDS.length)];
          b = ACIDS[Math.floor(Math.random() * ACIDS.length)];
          tries++;
        } while(tries < 60 && (a === b ||
                Math.abs(a.pKa - b.pKa) < 1.5 ||
                recent.indexOf(a.id + '/' + b.id) >= 0));

        var res = analyse(a, b);
        var truth = res.truth;
        var other = truth === a ? b : a;

        /* When the structural rules and the measured pKa disagree the tool
           says so plainly rather than hiding it, and so does this — that
           disagreement is the most interesting thing either can show you. */
        var why = res.deciding
          ? (res.agrees
              ? '<b>' + esc(res.deciding.factor) + '</b> decides it. ' + res.deciding.text
              : 'The structural rules point the other way here — ' +
                esc(res.deciding.factor.toLowerCase()) + ' would pick ' + esc(res.deciding.winner.name) +
                '. The measured values are what they are, and what the rules leave out is solvation.')
          : 'None of the four structural factors separates these two; the measured values settle it.';

        return {
          id: a.id + '/' + b.id,
          term: 'pka', topic: 'acidity-factors',
          prompt: 'Which is the <b>stronger acid</b>: <span class="tformula">' + esc(a.formula) +
                  '</span> or <span class="tformula">' + esc(b.formula) + '</span>?',
          options: [
            { id:a.id, label:esc(a.name) + ' <span class="tmuted">(' + esc(a.formula) + ')</span>', correct: truth === a },
            { id:b.id, label:esc(b.name) + ' <span class="tmuted">(' + esc(b.formula) + ')</span>', correct: truth === b }
          ],
          explain: '<b>' + esc(truth.name) + '</b>, pKa ' + truth.pKa + ' against ' + other.pKa +
                   '. ' + why
        };
      }
    });
  }

})();
