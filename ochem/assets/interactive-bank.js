/* Ochem interactive question bank.

   This is the bank the adaptive engine prefers. It is small compared to
   practice-bank.js (~1900 legacy multiple-choice questions), but every
   question here does two things the legacy bank cannot:

   1. It asks in a form other than "pick a sentence". Click the nucleophile
      on an actual molecule. Push the arrow from the lone pair to the carbon.
      Rank four substrates. Predict a product. Choose the mechanism. The
      legacy bank stays in the pool for volume and breadth — this bank is what
      keeps a session from being twenty paragraphs in a row.

   2. Every wrong answer is DIAGNOSED. A `diag` entry maps the specific wrong
      choice (an option index, or an atom key) to the concept that mistake
      actually reveals plus a sentence naming it. Clicking bromine when asked
      for the electrophile is not "wrong" — it's a specific misunderstanding
      of which end of a polar bond is electron-poor, and the mastery engine
      gets told that instead of just docking points from "SN2".

   Question shape:
     id         stable, unique — used as the key for mistake tracking, so
                renaming one loses that student's history for it.
     kind       'click-atom' | 'multi-click' | 'arrow' | 'order'
                | 'mcq' | 'tf' | 'predict' | 'mechanism'
     tier       1 foundational (recognize) / 2 intermediate (apply one idea)
                / 3 advanced (combine several) / 4 challenge (little guidance)
     topic      curriculum topic id, for topic drills and lesson links
     concepts   concept ids this question is evidence about. concepts[0] is
                primary and gets full weight; the rest get partial credit.
     prompt     the question
     sub        optional supporting text shown under the prompt
     molecule   molecule id from molecules.js (for the click/arrow kinds)
     reaction   a reaction string shown in a .formula block (predict/mechanism)
     answer     kind-dependent:
                  click-atom   { role:'x' } or { keys:[...] }  — any match
                  multi-click  { keys:[...] } — all of them, no extras
                  arrow        { from:'key', to:'key' }
                  order        [indices of `items` in correct order]
                  mcq/etc      index into `options`
     why        the explanation shown after answering, right or wrong
     diag       { '<optionIndex or atomKey>': { concept, msg } }
     highlight  atom keys to ring in the molecule when explaining */
(function(){
  var Q = [

  /* =================================================================
     SN2 — nucleophile, electrophile, leaving group, sterics, geometry
     ================================================================= */
  { id:'sn2-click-nuc', kind:'click-atom', tier:1, topic:'sn2', concepts:['nucleophile-recognition','electron-rich-poor'],
    prompt:'Click the nucleophile.', molecule:'sn2-bromoethane',
    sub:'One species here has electrons to give away.',
    answer:{ role:'nucleophile' },
    why:'Hydroxide carries a negative charge and three lone pairs — it is the electron source, so it is the nucleophile.',
    diag:{
      c1:{ concept:'electrophile-recognition', msg:'That carbon is the electrophile, not the nucleophile — it is electron-POOR because bromine pulls density away from it.' },
      br:{ concept:'leaving-group-ability', msg:'Bromine does have lone pairs, but here it is bonded to carbon and about to leave with the bonding electrons. It is the leaving group, not the attacking species.' },
      c2:{ concept:'electron-rich-poor', msg:'That is an ordinary alkyl carbon — no charge, no lone pair, no pi bond. Nothing there to donate.' }
    } },

  { id:'sn2-click-electrophile', kind:'click-atom', tier:1, topic:'sn2', concepts:['electrophile-recognition','electron-rich-poor'],
    prompt:'Click the electrophilic carbon.', molecule:'sn2-bromoethane',
    sub:'Which carbon is short of electrons?',
    answer:{ role:'electrophile' },
    why:'Bromine is far more electronegative than carbon, so it drags the C–Br electrons toward itself and leaves that carbon δ+. That is the atom hydroxide attacks.',
    diag:{
      br:{ concept:'electronegativity-trend', msg:'Bromine is the electronegative end of that bond — it is δ−, the electron-rich side. The δ+ atom is the carbon it is attached to.' },
      c2:{ concept:'electrophile-recognition', msg:'That carbon has only hydrogens and carbon on it. Nothing is pulling electron density off it, so it is not electrophilic.' },
      nucO:{ concept:'nucleophile-recognition', msg:'That is the nucleophile — negatively charged and electron-rich, the opposite of an electrophile.' }
    } },

  { id:'sn2-click-lg', kind:'click-atom', tier:1, topic:'sn2', concepts:['leaving-group-ability'],
    prompt:'Click the leaving group.', molecule:'sn2-bromoethane',
    answer:{ role:'leaving-group' },
    why:'Bromide leaves with both bonding electrons. It can do that because it is a very weak base — HBr has a pKa of about −9, so Br⁻ is perfectly stable on its own.',
    diag:{
      nucO:{ concept:'leaving-group-ability', msg:'Hydroxide is coming IN, not going out. And HO⁻ is a strong base, which is exactly what makes it a poor leaving group.' },
      c1:{ concept:'leaving-group-ability', msg:'The leaving group is the whole atom or group that departs, not the carbon it leaves from.' }
    } },

  { id:'sn2-arrow-attack', kind:'arrow', tier:2, topic:'sn2', concepts:['curved-arrow-direction','nucleophile-recognition'],
    prompt:'Push the electrons: click where the arrow starts, then where it ends.',
    sub:'Show hydroxide attacking.', molecule:'sn2-bromoethane',
    answer:{ from:'nucO', to:'c1' },
    why:'Arrow tails sit on electrons. The tail goes on hydroxide\'s lone pair and the head lands on the electrophilic carbon, showing the new C–O bond forming.',
    diag:{
      'c1>nucO':{ concept:'curved-arrow-direction', msg:'That arrow is backwards. Electrons flow from the electron-rich species to the electron-poor one, never the other way — the tail belongs on hydroxide.' },
      'br>c1':{ concept:'curved-arrow-direction', msg:'That is the bond-breaking arrow, and it also points the wrong way — the C–Br electrons leave WITH bromine, so that arrow goes from the bond toward Br.' }
    } },

  { id:'sn2-arrow-break', kind:'arrow', tier:2, topic:'sn2', concepts:['curved-arrow-direction','leaving-group-ability'],
    prompt:'Now show the C–Br bond breaking.',
    sub:'Click the carbon (the start of that bond), then the atom the electrons go to.', molecule:'sn2-bromoethane',
    answer:{ from:'c1', to:'br' },
    why:'The C–Br bonding electrons leave with bromine — a heterolytic break where the leaving group keeps the pair. In SN2 this arrow fires at the same instant as the attacking arrow: one concerted step.',
    diag:{
      'br>c1':{ concept:'curved-arrow-direction', msg:'Reversed. The electrons end up ON bromide, so the arrowhead points at Br.' },
      'nucO>br':{ concept:'curved-arrow-direction', msg:'Hydroxide never touches bromine. This arrow is about the bond that breaks, which is C–Br.' }
    } },

  { id:'sn2-tertiary-block', kind:'click-atom', tier:2, topic:'sn2', concepts:['steric-hindrance','backside-attack'],
    prompt:'Hydroxide cannot reach this carbon. Click what is in the way.',
    molecule:'sn2-tertiary',
    answer:{ role:'sterics' },
    why:'Three methyl groups surround the C–Br carbon. The nucleophile has to come in exactly opposite the bromine, and those methyls occupy that approach — SN2 at a tertiary carbon is essentially zero.',
    diag:{
      br:{ concept:'backside-attack', msg:'Bromine is on the far side from the attack, so it is not what blocks it — the nucleophile approaches 180° away from bromine. The obstruction is the alkyl groups.' },
      c1:{ concept:'steric-hindrance', msg:'That is the carbon being attacked. What blocks the approach is the bulk attached to it.' }
    } },

  { id:'sn2-why-no-tertiary', kind:'mcq', tier:2, topic:'sn2', concepts:['steric-hindrance','substrate-class'],
    prompt:'Why does (CH₃)₃CBr essentially never react by SN2?',
    options:['Bromide is too basic to leave','The three methyl groups block backside attack','The C–Br bond is not polar enough','Tertiary carbons cannot form bonds to oxygen'],
    answer:1,
    why:'SN2 requires the nucleophile to approach 180° from the leaving group. On a tertiary carbon, three alkyl groups sit across that trajectory, so the transition state is impossibly crowded.',
    diag:{
      0:{ concept:'leaving-group-ability', msg:'Bromide is an excellent leaving group — a very weak base. The leaving group is not the problem here; access to the carbon is.' },
      2:{ concept:'electronegativity-trend', msg:'C–Br is just as polar here as in a primary halide. Polarity is unchanged; what changed is how crowded the carbon is.' },
      3:{ concept:'steric-hindrance', msg:'Tertiary carbons bond to oxygen fine — via SN1. What fails is specifically the one-step backside approach.' }
    } },

  { id:'sn2-stereo-outcome', kind:'mcq', tier:2, topic:'sn2', concepts:['stereochemical-outcome','backside-attack'],
    prompt:'An SN2 reaction at a stereocenter gives which stereochemical result?',
    options:['Retention of configuration','Inversion of configuration','A racemic mixture','No stereochemical change is possible'],
    answer:1,
    why:'The nucleophile attacks from the side opposite the leaving group, so the other three groups flip through the carbon like an umbrella in the wind — R becomes S (or vice versa), cleanly.',
    diag:{
      0:{ concept:'backside-attack', msg:'Retention would require front-side attack, which is exactly what SN2 cannot do — the leaving group is in the way.' },
      2:{ concept:'stereochemical-outcome', msg:'Racemization is the SN1 answer: it needs a planar carbocation that either face can attack. SN2 has no intermediate at all, so it gives one specific product.' },
      3:{ concept:'stereocenter-identification', msg:'Substitution at a stereocenter absolutely changes stereochemistry — the whole point is that SN2 inverts it predictably.' }
    } },

  { id:'sn2-rate-order', kind:'order', tier:3, topic:'sn2', concepts:['steric-hindrance','substrate-class'],
    prompt:'Rank these by SN2 reactivity, fastest first.',
    items:['CH₃Br','CH₃CH₂Br','(CH₃)₂CHBr','(CH₃)₃CBr'],
    answer:[0,1,2,3],
    why:'SN2 rate falls off steeply with substitution: methyl > primary > secondary >> tertiary. Every extra alkyl group adds bulk across the backside approach.',
    diag:{ any:{ concept:'steric-hindrance', msg:'The ordering here is purely about crowding at the reacting carbon — count the carbons attached to it. More substituted is always slower for SN2.' } } },

  { id:'sn2-rate-law', kind:'mcq', tier:3, topic:'sn2', concepts:['rate-law-kinetics'],
    prompt:'You double the hydroxide concentration in an SN2 reaction. What happens to the rate?',
    options:['It is unchanged','It doubles','It quadruples','It halves'],
    answer:1,
    why:'SN2 is bimolecular: rate = k[substrate][Nu]. Both species are in the single rate-determining step, so doubling either one doubles the rate.',
    diag:{
      0:{ concept:'rate-law-kinetics', msg:'That is the SN1 answer. In SN1 the nucleophile joins after the slow step, so its concentration does not appear in the rate law. SN2 has no such step — everything happens at once.' },
      2:{ concept:'rate-law-kinetics', msg:'Quadrupling would need the nucleophile to appear squared. It appears to the first power: rate = k[substrate][Nu].' }
    } },

  { id:'sn2-solvent', kind:'mcq', tier:3, topic:'substrate-effects', concepts:['solvent-effects','nucleophile-recognition'],
    prompt:'Which solvent would you choose to make an SN2 reaction go fastest?',
    options:['Water','Ethanol','Acetone (a polar aprotic solvent)','Hexane'],
    answer:2,
    why:'Polar aprotic solvents dissolve the salt but cannot hydrogen-bond to the anion, leaving the nucleophile bare and highly reactive. Protic solvents cage it in a shell of hydrogen bonds and slow it right down.',
    diag:{
      0:{ concept:'solvent-effects', msg:'Water is polar PROTIC. Its O–H hydrogens hydrogen-bond to the nucleophile and cage it — that stabilization is exactly what makes SN2 slower.' },
      1:{ concept:'solvent-effects', msg:'Ethanol is protic too (that O–H). Same caging problem as water.' },
      3:{ concept:'solvent-effects', msg:'Hexane is nonpolar — it will not dissolve an ionic nucleophile at all, so there is no reaction to speed up.' }
    } },

  { id:'sn2-predict-1', kind:'predict', tier:3, topic:'sn2', concepts:['backside-attack','nucleophile-recognition'],
    prompt:'What is the major product?', reaction:'CH₃CH₂CH₂Br  +  NaCN  (DMSO)',
    options:['CH₃CH₂CH₂CN','CH₃CH=CH₂','CH₃CH₂CH₂OH','CH₃CH₂CH₂N≡C⁺'],
    answer:0,
    why:'A primary halide plus a strong, non-bulky nucleophile in a polar aprotic solvent is textbook SN2: cyanide displaces bromide and you get the nitrile.',
    diag:{
      1:{ concept:'basicity-vs-nucleophilicity', msg:'Cyanide is a good nucleophile but a weak base (HCN pKa ≈ 9), so it attacks carbon rather than removing a proton. Elimination needs a strong base.' },
      2:{ concept:'nucleophile-recognition', msg:'There is no hydroxide in this reaction. The nucleophile present is cyanide — it is the species that attacks.' },
      3:{ concept:'formal-charge-calc', msg:'Check the charge: cyanide attacks with its carbon and ends up neutral in the product. A positive nitrogen there would not balance.' }
    } },

  { id:'sn2-challenge-1', kind:'mcq', tier:4, topic:'substrate-effects', concepts:['mechanism-selection','basicity-vs-nucleophilicity','steric-hindrance'],
    prompt:'2-bromobutane is treated with sodium ethoxide in ethanol, warmed. What dominates?',
    options:['SN2, giving 2-ethoxybutane','E2, giving mostly 2-butene','SN1, giving racemic 2-butanol','No reaction'],
    answer:1,
    why:'Ethoxide is both a decent nucleophile and a strong base. On a secondary substrate with heat, the strong base wins and E2 dominates, giving the more substituted Zaitsev alkene.',
    diag:{
      0:{ concept:'basicity-vs-nucleophilicity', msg:'Some SN2 does happen, but you weighed nucleophilicity and ignored basicity. Alkoxides are strong bases (pKa of EtOH ≈ 16) and a secondary substrate plus heat tips the balance to elimination.' },
      2:{ concept:'mechanism-selection', msg:'SN1 needs a weak, neutral nucleophile so the substrate can ionize on its own time. A strong anionic base like ethoxide does not sit around waiting — and it would not give an alcohol anyway.' },
      3:{ concept:'mechanism-selection', msg:'A secondary halide with a strong base is a very reactive combination. Something definitely happens.' }
    } },

  /* =================================================================
     E2 — anti-periplanar geometry, Zaitsev
     ================================================================= */
  { id:'e2-click-axial-h', kind:'click-atom', tier:2, topic:'e2', concepts:['anti-periplanar-geometry','chair-axial-equatorial'],
    prompt:'Click the hydrogen E2 can actually remove.', molecule:'chair-bromocyclohexane',
    sub:'The bromine is axial, pointing up.',
    answer:{ role:'axial-h' },
    why:'E2 needs the C–H and C–Br bonds 180° apart in one plane. On a chair, that means both must be axial and on adjacent carbons pointing opposite ways — only the axial hydrogen down on the neighbouring carbon qualifies.',
    highlight:['br'],
    diag:{
      hax5:{ concept:'anti-periplanar-geometry', msg:'Right idea — that one IS axial. But it points up, the same direction as the bromine: that is syn-periplanar (0°), not anti (180°). The two bonds have to point opposite ways.' },
      heq3:{ concept:'chair-axial-equatorial', msg:'That hydrogen is equatorial — it splays out sideways at roughly 60° from the C–Br bond. Equatorial hydrogens can never be anti-periplanar to an axial leaving group.' },
      br:{ concept:'anti-periplanar-geometry', msg:'That is the leaving group. E2 removes a hydrogen from the carbon NEXT to it, not from the carbon bearing it.' }
    } },

  { id:'e2-why-antiperiplanar', kind:'mcq', tier:2, topic:'e2', concepts:['anti-periplanar-geometry','curved-arrow-direction'],
    prompt:'Why must the hydrogen and the leaving group be anti-periplanar in E2?',
    options:['To keep the molecule from rotating during the reaction','Because both bonds break at the same time, so their orbitals must line up to form the new pi bond','Because the base is too large to approach any other way','To avoid forming a carbocation'],
    answer:1,
    why:'E2 is concerted. The C–H electrons slide directly into the forming pi bond as the leaving group departs, and that only works if the two breaking bonds are coplanar and opposed so their orbitals overlap.',
    diag:{
      0:{ concept:'anti-periplanar-geometry', msg:'It is not about preventing rotation — single bonds rotate freely, which is why you can often reach the right conformer. The requirement is orbital alignment at the moment of reaction.' },
      2:{ concept:'steric-hindrance', msg:'Base size affects WHICH hydrogen is taken (Zaitsev vs Hofmann), but even the smallest base still needs the anti-periplanar geometry. This is an orbital requirement, not a steric one.' },
      3:{ concept:'anti-periplanar-geometry', msg:'True that E2 has no carbocation — but that is a consequence of it being concerted, not the reason for the geometry. The geometry is what makes the concerted step possible.' }
    } },

  { id:'e2-zaitsev-click', kind:'click-atom', tier:2, topic:'e2', concepts:['zaitsev-hofmann','anti-periplanar-geometry'],
    prompt:'With sodium ethoxide, click the hydrogen removed to give the major product.',
    molecule:'e2-butane', sub:'A small, strong base gives the most stable alkene.',
    answer:{ keys:['hb'] },
    why:'Taking the hydrogen from the interior carbon gives 2-butene — disubstituted, and therefore the more stable Zaitsev product. A small base like ethoxide can reach it easily.',
    diag:{
      hc:{ concept:'zaitsev-hofmann', msg:'That gives 1-butene, the less substituted alkene. That is the Hofmann product, which you would get with a BULKY base like t-BuOK. Ethoxide is small, so it takes the interior hydrogen and gives the more substituted alkene.' },
      ha:{ concept:'anti-periplanar-geometry', msg:'That hydrogen is on the same carbon as the bromine. Removing an alpha hydrogen forms nothing — E2 always takes a BETA hydrogen, from the neighbouring carbon.' },
      br:{ concept:'anti-periplanar-geometry', msg:'That is the leaving group itself. You are looking for the hydrogen being removed from an adjacent carbon.' }
    } },

  { id:'e2-hofmann', kind:'mcq', tier:3, topic:'e2', concepts:['zaitsev-hofmann','steric-hindrance'],
    prompt:'2-bromo-2-methylbutane + potassium tert-butoxide gives mostly which alkene?',
    options:['The more substituted (Zaitsev) alkene','The less substituted (Hofmann) alkene','An equal mixture','The substitution product instead'],
    answer:1,
    why:'tert-Butoxide is very bulky. It cannot reach the crowded interior hydrogens that would give the Zaitsev product, so it takes an accessible terminal hydrogen and gives the less substituted alkene.',
    diag:{
      0:{ concept:'steric-hindrance', msg:'That is the default with a SMALL base. You applied Zaitsev without checking the base — tert-butoxide is bulky, and bulk overrides the thermodynamic preference.' },
      3:{ concept:'basicity-vs-nucleophilicity', msg:'tert-Butoxide is a strong base but a terrible nucleophile precisely because of its bulk, and the substrate is tertiary. Substitution is not competitive here.' }
    } },

  { id:'e2-locked-ring', kind:'mcq', tier:4, topic:'e2', concepts:['anti-periplanar-geometry','ring-flip-mechanics','chair-axial-equatorial'],
    prompt:'A cyclohexyl bromide is locked by a bulky tert-butyl group so that the bromine must stay equatorial. Treated with a strong base, what happens?',
    options:['Fast E2, giving the Zaitsev alkene','E2 is blocked — no anti-periplanar hydrogen is available','It rearranges to a more stable carbocation first','E2 proceeds but gives the Hofmann product'],
    answer:1,
    why:'An equatorial C–Br bond is never 180° from any neighbouring C–H. Normally a ring flip would fix that, but the tert-butyl group holds the ring in one conformer, so the geometry E2 requires simply never occurs.',
    diag:{
      0:{ concept:'anti-periplanar-geometry', msg:'You checked the base and the substrate but not the geometry. A strong base is necessary for E2, not sufficient — with the leaving group locked equatorial, the orbitals can never align.' },
      2:{ concept:'mechanism-selection', msg:'Rearrangement needs a carbocation, and E2 with a strong base never forms one. The block here is purely geometric.' },
      3:{ concept:'anti-periplanar-geometry', msg:'Hofmann vs Zaitsev is about which hydrogen gets taken. Here no hydrogen is anti-periplanar at all, so neither product forms by E2.' }
    } },

  /* =================================================================
     SN1 / E1 — carbocations
     ================================================================= */
  { id:'sn1-cation-order', kind:'order', tier:2, topic:'sn1', concepts:['carbocation-stability'],
    prompt:'Rank these carbocations, most stable first.',
    items:['(CH₃)₃C⁺ (tertiary)','CH₂=CH–CH₂⁺ (allylic)','(CH₃)₂CH⁺ (secondary)','CH₃CH₂⁺ (primary)'],
    answer:[1,0,2,3],
    why:'Resonance beats substitution: the allylic cation spreads its charge over two carbons, which stabilizes it more than the hyperconjugation a tertiary cation gets. After that it is the familiar 3° > 2° > 1°.',
    diag:{ any:{ concept:'carbocation-stability', msg:'Two effects are in play, in this priority: resonance delocalization first, then degree of substitution. An allylic or benzylic cation outranks even a tertiary one because the charge is genuinely shared between atoms.' } } },

  { id:'sn1-rate-law', kind:'mcq', tier:2, topic:'sn1', concepts:['rate-law-kinetics','carbocation-stability'],
    prompt:'You triple the nucleophile concentration in an SN1 reaction. What happens to the rate?',
    options:['It triples','It is unchanged','It falls by a third','It increases ninefold'],
    answer:1,
    why:'SN1 is unimolecular: the slow step is the substrate ionizing on its own. The nucleophile only shows up after that, so its concentration does not appear in the rate law at all.',
    diag:{
      0:{ concept:'rate-law-kinetics', msg:'That is the SN2 answer. In SN1 the nucleophile is not present in the rate-determining step, so its concentration is invisible to the rate.' },
      3:{ concept:'rate-law-kinetics', msg:'Nothing is squared here. In fact the nucleophile does not appear in the SN1 rate law at all: rate = k[substrate].' }
    } },

  { id:'sn1-stereo', kind:'mcq', tier:3, topic:'sn1', concepts:['stereochemical-outcome','carbocation-stability'],
    prompt:'SN1 at a stereocenter gives:',
    options:['Clean inversion','Clean retention','A roughly racemic mixture','A single diastereomer'],
    answer:2,
    why:'The carbocation intermediate is planar and sp2. The nucleophile can attack either face with nearly equal probability, so you get both enantiomers — often with a slight inversion bias because the departing leaving group briefly shields one face.',
    diag:{
      0:{ concept:'stereochemical-outcome', msg:'Inversion is the SN2 signature, and it happens because there is no intermediate. SN1 goes through a flat cation that has lost all memory of which side the leaving group was on.' },
      1:{ concept:'stereochemical-outcome', msg:'Retention would require the nucleophile to be delivered to exactly the same face every time. A free planar cation does not do that.' }
    } },

  { id:'e1-rearrange', kind:'mcq', tier:3, topic:'sn1', concepts:['carbocation-rearrangement','carbocation-stability'],
    prompt:'3-bromo-2,2-dimethylbutane ionizes to a secondary carbocation next to a quaternary carbon. What happens next?',
    options:['It reacts as-is with the nucleophile','A methyl group shifts over to give a tertiary cation','It loses a proton to become an alkene immediately','It reverts to starting material'],
    answer:1,
    why:'A 1,2-methyl shift converts the secondary cation to a tertiary one — a substantial gain in stability, and fast enough to happen before the nucleophile arrives. Any mechanism with a free carbocation has to be checked for this.',
    diag:{
      0:{ concept:'carbocation-rearrangement', msg:'You stopped one step too early. Whenever a hydride or alkyl shift on the adjacent carbon would give a more stable cation, it happens first — and the product comes from the REARRANGED cation.' },
      2:{ concept:'carbocation-rearrangement', msg:'E1 is possible, but the rearrangement is faster and happens first, so any alkene forms from the tertiary cation, not the secondary one.' }
    } },

  { id:'sn1-click-lg', kind:'click-atom', tier:1, topic:'sn1', concepts:['leaving-group-ability','carbocation-stability'],
    prompt:'Click the atom that leaves in the first, rate-determining step.', molecule:'sn1-secondary',
    answer:{ role:'leaving-group' },
    why:'SN1 begins with the C–Br bond breaking on its own, bromide departing with both electrons and leaving a carbocation behind. That slow ionization is the rate-determining step.',
    diag:{
      c1:{ concept:'carbocation-stability', msg:'That carbon stays put — it is what becomes the carbocation. The thing that LEAVES is the group attached to it.' },
      h:{ concept:'leaving-group-ability', msg:'A hydrogen leaving as hydride would be wildly unfavourable — H⁻ is an extremely strong base. The leaving group here is bromide.' }
    } },

  /* =================================================================
     Mechanism selection
     ================================================================= */
  { id:'mech-select-1', kind:'mechanism', tier:3, topic:'substrate-effects', concepts:['mechanism-selection','substrate-class'],
    prompt:'Which mechanism dominates?', reaction:'CH₃CH₂CH₂Br  +  NaI  in  acetone',
    options:['SN1','SN2','E1','E2'],
    answer:1,
    why:'Primary substrate (so no SN1/E1 — a primary cation is far too unstable), iodide is an excellent nucleophile but a very weak base (so not E2), and acetone is polar aprotic, which is ideal for SN2.',
    diag:{
      0:{ concept:'substrate-class', msg:'A primary carbocation is prohibitively unstable, so SN1 is off the table here. Check the substrate class before anything else.' },
      2:{ concept:'substrate-class', msg:'E1 needs the same carbocation SN1 does, and a primary cation will not form.' },
      3:{ concept:'basicity-vs-nucleophilicity', msg:'E2 needs a strong BASE. Iodide is a superb nucleophile but a terrible base (HI pKa ≈ −10) — it attacks carbon, it does not remove protons.' }
    } },

  { id:'mech-select-2', kind:'mechanism', tier:3, topic:'substrate-effects', concepts:['mechanism-selection','solvent-effects'],
    prompt:'Which mechanism dominates?', reaction:'(CH₃)₃C–Cl  +  CH₃CH₂OH  (warm)',
    options:['SN1','SN2','E2','No reaction'],
    answer:0,
    why:'Tertiary substrate plus a weak, neutral nucleophile that is also the solvent — a classic solvolysis. The substrate ionizes to a stable tertiary cation, then ethanol attacks it.',
    diag:{
      1:{ concept:'steric-hindrance', msg:'Tertiary carbons cannot do SN2 — three alkyl groups block the backside approach entirely.' },
      2:{ concept:'basicity-vs-nucleophilicity', msg:'E2 needs a strong base. Neutral ethanol is a weak base; if it were ethoxide (deprotonated) your answer would be right. Charge matters.' },
      3:{ concept:'mechanism-selection', msg:'A tertiary halide in a warm polar protic solvent readily ionizes. Solvolysis is exactly what happens.' }
    } },

  { id:'mech-select-3', kind:'mechanism', tier:4, topic:'substrate-effects', concepts:['mechanism-selection','basicity-vs-nucleophilicity','steric-hindrance'],
    prompt:'Which mechanism dominates?', reaction:'CH₃CH₂CH₂CH₂Br  +  (CH₃)₃CO⁻K⁺',
    options:['SN2','E2','SN1','E1'],
    answer:1,
    why:'The substrate is primary, which would normally favour SN2 — but tert-butoxide is enormous. It cannot reach the carbon, so it does what a strong bulky base does: removes a beta proton and eliminates.',
    diag:{
      0:{ concept:'steric-hindrance', msg:'You read the substrate correctly (primary favours SN2) but not the reagent. tert-Butoxide is too bulky to attack carbon; bulk on the BASE matters as much as bulk on the substrate.' },
      2:{ concept:'substrate-class', msg:'A primary carbocation will not form, so SN1 is impossible regardless of reagent.' },
      3:{ concept:'substrate-class', msg:'E1 needs a carbocation too — same problem as SN1 on a primary substrate.' }
    } },

  /* =================================================================
     Nucleophiles, leaving groups, basicity
     ================================================================= */
  { id:'lg-order', kind:'order', tier:2, topic:'leaving-groups', concepts:['leaving-group-ability','pka-scale'],
    prompt:'Rank these as leaving groups, best first.',
    items:['I⁻','Br⁻','Cl⁻','F⁻'],
    answer:[0,1,2,3],
    why:'Leaving group ability tracks conjugate acid strength: HI (pKa ≈ −10) is the strongest acid, so I⁻ is the most stable anion and the best leaving group. HF (pKa 3.2) is comparatively weak, making F⁻ a poor one.',
    diag:{ any:{ concept:'leaving-group-ability', msg:'Do not rank by electronegativity — that gives the wrong order here. Rank by how STABLE the anion is once it leaves, which is the same as how weak a base it is. Bigger halide, more spread-out charge, better leaving group.' } } },

  { id:'lg-bad', kind:'mcq', tier:2, topic:'leaving-groups', concepts:['leaving-group-ability','alcohol-activation'],
    prompt:'Why will CH₃CH₂OH not undergo SN2 with NaCN directly?',
    options:['Ethanol is not electrophilic at all','HO⁻ is far too strong a base to be a leaving group','Cyanide is too weak a nucleophile','The carbon is too hindered'],
    answer:1,
    why:'Hydroxide is a strong base (water\'s pKa is 15.7), so it is very unhappy carrying a negative charge alone — it will not leave. Protonate the alcohol first, or convert it to a tosylate, and the substitution works fine.',
    diag:{
      0:{ concept:'electrophile-recognition', msg:'The carbon IS δ+ — oxygen is electronegative and pulls density off it. The electrophile is fine; the problem is on the leaving-group side.' },
      2:{ concept:'nucleophile-recognition', msg:'Cyanide is an excellent nucleophile. It is not the limiting factor.' },
      3:{ concept:'steric-hindrance', msg:'That is a primary carbon — about as unhindered as it gets. Sterics are not the issue.' }
    } },

  { id:'nuc-charge', kind:'mcq', tier:1, topic:'nucleophiles', concepts:['nucleophile-recognition'],
    prompt:'Which is the stronger nucleophile?',
    options:['H₂O','HO⁻','They are identical','Neither is nucleophilic'],
    answer:1,
    why:'Same atom, but hydroxide carries a full negative charge and is far more willing to donate a pair. Charge is the first thing to check: the anion always beats its neutral counterpart.',
    diag:{
      0:{ concept:'nucleophile-recognition', msg:'Water is nucleophilic, but only weakly. Comparing the same atom, the negatively charged species is always the stronger nucleophile.' },
      2:{ concept:'formal-charge-calc', msg:'They differ by a proton and a unit of charge — they are a conjugate acid/base pair, not the same species.' }
    } },

  { id:'nuc-vs-base', kind:'mcq', tier:3, topic:'nucleophiles', concepts:['basicity-vs-nucleophilicity','steric-hindrance'],
    prompt:'tert-Butoxide is a stronger base than ethoxide but a much worse nucleophile. Why?',
    options:['It carries less negative charge','It is bulky, so it cannot reach a carbon but can still reach an exposed proton','Its oxygen is less electronegative','It is not actually a base'],
    answer:1,
    why:'Basicity and nucleophilicity come apart when sterics get involved. A proton on the outside of a molecule is easy to grab; a carbon surrounded by substituents is not. Bulk kills nucleophilicity while leaving basicity intact.',
    diag:{
      0:{ concept:'formal-charge-calc', msg:'Both are alkoxides with exactly one negative charge on oxygen. The difference is geometric, not electronic charge.' },
      2:{ concept:'electronegativity-trend', msg:'Both are oxygen anions — same element, same electronegativity. What differs is what surrounds it.' }
    } },

  /* =================================================================
     Resonance, curved arrows, acidity
     ================================================================= */
  { id:'res-illegal', kind:'mcq', tier:2, topic:'resonance', concepts:['resonance-validity','formal-charge-calc'],
    prompt:'Which of these disqualifies a proposed resonance structure?',
    options:['Moving a lone pair into an adjacent pi bond','Moving pi electrons onto an adjacent atom','Breaking a C–C single bond to relocate a group','Creating a formal charge that was not there before'],
    answer:2,
    why:'Resonance moves only electrons. Atoms stay exactly where they are, so breaking a sigma bond gives you a different molecule (an isomer), not a resonance structure.',
    diag:{
      0:{ concept:'resonance-delocalization', msg:'That is a perfectly legal resonance move — a lone pair on an atom adjacent to a pi bond delocalizing in is the most common one there is.' },
      1:{ concept:'resonance-delocalization', msg:'Also legal, and extremely common — that is how pi electrons shift along a conjugated system.' },
      3:{ concept:'formal-charge-calc', msg:'Charges appearing and moving is normal in resonance — what must stay constant is the TOTAL charge, not the location of individual formal charges.' }
    } },

  { id:'res-acidity', kind:'mcq', tier:2, topic:'acidity-factors', concepts:['resonance-delocalization','acidity-factors'],
    prompt:'Acetic acid (pKa 4.8) is about 10¹¹ times more acidic than ethanol (pKa 16). Why?',
    options:['The O–H bond is weaker in acetic acid','Acetate is resonance-stabilized over two equivalent oxygens','Acetic acid has more hydrogens','Ethanol is not an acid at all'],
    answer:1,
    why:'Judge the conjugate base. The acetate anion spreads its negative charge equally over two oxygens through resonance; ethoxide has to carry the whole charge on one oxygen alone.',
    diag:{
      0:{ concept:'acidity-factors', msg:'Acid strength is about the stability of the ANION left behind, not the strength of the bond you break. Always compare the conjugate bases.' },
      2:{ concept:'acidity-factors', msg:'Total hydrogen count is irrelevant — only the acidity of the specific proton matters, which is set by what its conjugate base looks like.' },
      3:{ concept:'pka-scale', msg:'Ethanol is a weak acid (pKa 16), which is exactly why the comparison is meaningful. Both are acids; one is much stronger.' }
    } },

  { id:'acid-click-h', kind:'click-atom', tier:1, topic:'carboxylic-acids', concepts:['acidity-factors','resonance-delocalization'],
    prompt:'Click the most acidic hydrogen.', molecule:'acetic-acid',
    answer:{ role:'acidic-h' },
    why:'The O–H proton (pKa ≈ 4.8). Removing it gives a carboxylate whose charge is shared over two equivalent oxygens — far more stable than any alternative here.',
    diag:{
      ha:{ concept:'acidity-factors', msg:'That is an alpha C–H. It is more acidic than an ordinary alkane C–H, but nowhere near the O–H: the anion would sit on carbon, which holds a negative charge much less happily than oxygen.' }
    } },

  { id:'acid-order', kind:'order', tier:3, topic:'acidity-factors', concepts:['acidity-factors','pka-scale'],
    prompt:'Rank these by acidity, strongest acid first.',
    items:['CH₃CO₂H','CH₃CH₂OH','HC≡CH','CH₃CH₃'],
    answer:[0,1,2,3],
    why:'Carboxylic acid (pKa 4.8, resonance) > alcohol (16, electronegative oxygen) > terminal alkyne (25, sp carbon holds the pair close) > alkane (~50, sp3 carbanion with nothing to stabilize it).',
    diag:{ any:{ concept:'acidity-factors', msg:'Work down the conjugate bases in order: which ATOM holds the charge (O beats C), then RESONANCE, then ORBITAL hybridization (sp holds electrons tighter than sp3). That order settles all four.' } } },

  { id:'alkyne-acidity-q', kind:'mcq', tier:3, topic:'alkynes', concepts:['alkyne-acidity','hybridization-assignment'],
    prompt:'A terminal alkyne C–H (pKa 25) is far more acidic than an alkane C–H (pKa ~50). Why?',
    options:['The triple bond is electron-poor','The acetylide anion sits in an sp orbital with 50% s character, holding the electrons close to the nucleus','Alkynes are aromatic','The C–H bond is longer in an alkyne'],
    answer:1,
    why:'s orbitals sit closer to the nucleus than p orbitals. An sp orbital is half s character, so the lone pair is held much more tightly than in an sp3 orbital (25% s) — that stabilization is worth 25 pKa units.',
    diag:{
      0:{ concept:'alkene-pi-nucleophile', msg:'A triple bond is electron-RICH — it is a nucleophile. Its acidity comes from hybridization, not from electron deficiency.' },
      2:{ concept:'huckel-aromaticity', msg:'Aromaticity needs a cyclic, planar, conjugated ring with 4n+2 electrons. A linear alkyne is none of those.' },
      3:{ concept:'alkyne-acidity', msg:'The sp C–H bond is actually shorter and stronger. Bond strength is not what decides acidity — anion stability is.' }
    } },

  /* =================================================================
     Carbonyl chemistry
     ================================================================= */
  { id:'carbonyl-click-attack', kind:'click-atom', tier:1, topic:'aldehydes-ketones', concepts:['carbonyl-electrophilicity','electrophile-recognition'],
    prompt:'Click the atom a nucleophile attacks.', molecule:'acetone',
    answer:{ role:'electrophile' },
    why:'Oxygen pulls the C=O pi electrons toward itself, leaving the carbonyl carbon δ+. That is the electrophilic site, and it is where every nucleophilic addition begins.',
    diag:{
      o:{ concept:'carbonyl-electrophilicity', msg:'The oxygen is the electron-RICH end (δ−) with two lone pairs of its own. Nucleophiles are electron-rich too — they repel. Attack happens at the δ+ carbon.' },
      ca:{ concept:'carbonyl-electrophilicity', msg:'That is the alpha carbon. It matters for enolate chemistry, but it is not electrophilic — nothing is pulling electron density off it.' }
    } },

  { id:'carbonyl-click-alpha', kind:'click-atom', tier:2, topic:'alpha-hydrogens', concepts:['alpha-acidity','resonance-delocalization'],
    prompt:'Click an acidic hydrogen.', molecule:'acetone',
    sub:'Acetone has a proton with a pKa around 20 — which one?',
    answer:{ role:'alpha-h' },
    why:'The alpha hydrogens, on the carbons adjacent to the carbonyl. Removing one gives an enolate whose negative charge is delocalized onto the carbonyl oxygen — that resonance stabilization is what makes them acidic at all.',
    highlight:['o'],
    diag:{
      o:{ concept:'alpha-acidity', msg:'Oxygen has no hydrogen on it in a ketone — acetone has no O–H. The acidic hydrogens are on the carbons next to the carbonyl.' },
      c:{ concept:'alpha-acidity', msg:'The carbonyl carbon has no hydrogen in a ketone (that would make it an aldehyde). Look one carbon further out.' }
    } },

  { id:'carbonyl-ald-vs-ket', kind:'mcq', tier:2, topic:'aldehydes-ketones', concepts:['carbonyl-electrophilicity','steric-hindrance'],
    prompt:'Which reacts faster with a nucleophile, acetaldehyde or acetone?',
    options:['Acetaldehyde','Acetone','Identical rates','Neither reacts with nucleophiles'],
    answer:0,
    why:'Two reasons pull the same way: the aldehyde has one less alkyl group crowding the carbon, and one less alkyl group donating electron density into it. Less hindered and more electrophilic both mean faster.',
    diag:{
      1:{ concept:'steric-hindrance', msg:'Backwards. The extra methyl on a ketone both blocks the approach and pushes electron density onto the carbonyl carbon, making it less electrophilic.' },
      2:{ concept:'carbonyl-electrophilicity', msg:'Aldehyde vs ketone reactivity is a standard, substantial difference — it is why aldehydes are selectively reduced in the presence of ketones.' }
    } },

  { id:'carbonyl-tetrahedral', kind:'click-atom', tier:2, topic:'nucleophilic-addition', concepts:['tetrahedral-intermediate','curved-arrow-direction'],
    prompt:'A nucleophile attacks the carbonyl carbon. Click where the pi electrons go.',
    molecule:'acetone',
    answer:{ role:'carbonyl-o' },
    why:'Carbon can only have four bonds. As the nucleophile\'s bond forms, the C=O pi electrons must go somewhere — they shift entirely onto oxygen, giving a tetrahedral alkoxide that later picks up a proton.',
    diag:{
      c:{ concept:'tetrahedral-intermediate', msg:'They cannot stay on the carbon — it would end up with five bonds. The pi pair moves up onto the oxygen, which happily carries the negative charge.' },
      ca:{ concept:'curved-arrow-direction', msg:'Electrons do not jump to an unrelated carbon. They move from the bond that breaks (the C=O pi bond) onto the atom at its end.' }
    } },

  { id:'acyl-reactivity-order-q', kind:'order', tier:3, topic:'acyl-substitution', concepts:['acyl-reactivity-order','leaving-group-ability'],
    prompt:'Rank these acyl derivatives, most reactive first.',
    items:['Acid chloride (RCOCl)','Anhydride','Ester (RCO₂R\')','Amide (RCONH₂)'],
    answer:[0,1,2,3],
    why:'Reactivity tracks leaving-group ability: Cl⁻ is a very weak base and leaves easily; ⁻NH₂ is an extremely strong base and essentially never does. That is also why an amide is the most stable — and why proteins survive in water.',
    diag:{ any:{ concept:'acyl-reactivity-order', msg:'Rank by how happy the leaving group is to leave — Cl⁻ then carboxylate then RO⁻ then H₂N⁻. The more basic the leaving group, the more the carbonyl hangs on to it and the less reactive the derivative.' } } },

  { id:'ester-click-lg', kind:'click-atom', tier:2, topic:'esters-amides', concepts:['acyl-reactivity-order','leaving-group-ability'],
    prompt:'Click the atom that leaves during acyl substitution.', molecule:'methyl-acetate',
    answer:{ role:'leaving-group' },
    why:'The tetrahedral intermediate collapses, the C=O reforms, and the OCH₃ group departs as methoxide. Because methoxide is fairly basic, esters are much less reactive than acid chlorides.',
    diag:{
      o1:{ concept:'tetrahedral-intermediate', msg:'The carbonyl oxygen stays put — it takes the pi electrons temporarily and then hands them back as the C=O reforms. The group that actually departs is the other oxygen and its methyl.' },
      c:{ concept:'acyl-reactivity-order', msg:'The acyl carbon is attacked, not expelled. Look for the group attached to it that can leave as a reasonably stable anion.' }
    } },

  { id:'amide-basicity', kind:'click-atom', tier:3, topic:'amine-structure', concepts:['amine-basicity','resonance-delocalization'],
    prompt:'Click the atom whose lone pair is NOT available to accept a proton.', molecule:'acetamide',
    answer:{ role:'conjugated-lone-pair' },
    why:'The amide nitrogen\'s lone pair is delocalized into the carbonyl — that is why the C–N bond has partial double-bond character and why amides are essentially non-basic, unlike ordinary amines.',
    diag:{
      o:{ concept:'amine-basicity', msg:'The carbonyl oxygen\'s lone pairs are actually where an amide protonates, since that keeps the resonance intact. The committed lone pair is on the nitrogen.' }
    } },

  /* =================================================================
     Alkenes & addition
     ================================================================= */
  { id:'mark-click-h', kind:'click-atom', tier:2, topic:'markovnikov', concepts:['markovnikov-regiochem','carbocation-stability'],
    prompt:'HBr adds to propene. Click the carbon the proton adds to.', molecule:'propene-hbr',
    answer:{ role:'pi-nucleophile' },
    why:'The proton adds to the CH₂ end, because that leaves the positive charge on the middle carbon — a secondary cation rather than a primary one. Markovnikov is just carbocation stability in disguise.',
    highlight:['c2'],
    diag:{
      c2:{ concept:'markovnikov-regiochem', msg:'That carbon is where the positive charge (and eventually the bromine) ends up — it is the more substituted one. The PROTON goes to the other carbon, the one with more hydrogens already.' },
      hbrH:{ concept:'alkene-pi-nucleophile', msg:'That is the proton itself. The question is which alkene carbon it bonds to.' }
    } },

  { id:'mark-why', kind:'mcq', tier:2, topic:'markovnikov', concepts:['markovnikov-regiochem','carbocation-stability'],
    prompt:'Markovnikov\'s rule works because:',
    options:['Hydrogen prefers less-substituted carbons for steric reasons','The proton adds so the resulting carbocation is the more stable one','Halogens are always attracted to methyl groups','The alkene rotates to expose one face'],
    answer:1,
    why:'It is not a rule to memorize but a consequence: the mechanism goes through whichever carbocation is more stable, so the proton lands wherever leaves that cation behind.',
    diag:{
      0:{ concept:'markovnikov-regiochem', msg:'Right prediction, wrong reason — and the wrong reason will fail you the moment you meet a case where sterics and cation stability disagree. It is about the stability of the intermediate.' },
      3:{ concept:'alkene-pi-nucleophile', msg:'Regiochemistry here is about which carbon bears the charge, not about which face is exposed. Face selectivity is a stereochemistry question, not a regiochemistry one.' }
    } },

  { id:'mark-peroxide', kind:'mcq', tier:3, topic:'markovnikov', concepts:['markovnikov-regiochem'],
    prompt:'Propene + HBr with peroxides present gives:',
    options:['The same Markovnikov product','1-bromopropane (anti-Markovnikov)','No reaction','An alcohol'],
    answer:1,
    why:'Peroxides switch the mechanism from ionic to radical. The bromine RADICAL adds first, and it adds so as to give the more stable carbon radical — which flips the regiochemistry. This works for HBr only, not HCl or HI.',
    diag:{
      0:{ concept:'markovnikov-regiochem', msg:'Peroxides change the mechanism entirely. Once a radical chain is running, the selectivity is set by radical stability with Br adding first, which reverses the outcome.' },
      3:{ concept:'markovnikov-regiochem', msg:'There is no oxygen source delivering an OH here — the peroxide is a radical initiator, present in trace amounts, not a reagent that ends up in the product.' }
    } },

  { id:'add-stereochem', kind:'mcq', tier:3, topic:'addition-reactions', concepts:['addition-stereochem'],
    prompt:'Br₂ adds to cyclohexene to give which product?',
    options:['cis-1,2-dibromocyclohexane','trans-1,2-dibromocyclohexane','A 1,1-dibromide','An equal mixture of cis and trans'],
    answer:1,
    why:'Bromine forms a bridged bromonium ion across one face, so bromide has to attack from the opposite face. Anti addition gives the trans product exclusively.',
    diag:{
      0:{ concept:'addition-stereochem', msg:'Cis would require both bromines delivered to the same face — that is SYN addition, which is what hydrogenation and dihydroxylation do. Br₂ goes through a bridged intermediate, forcing anti.' },
      3:{ concept:'addition-stereochem', msg:'The bromonium bridge makes this genuinely stereospecific, not random. One face is physically blocked by the bridge.' }
    } },

  /* =================================================================
     Epoxides
     ================================================================= */
  { id:'epox-basic', kind:'click-atom', tier:3, topic:'epoxides', concepts:['epoxide-opening-regiochem','backside-attack'],
    prompt:'With NaOCH₃ (basic conditions), click the carbon the methoxide attacks.',
    molecule:'propylene-oxide',
    answer:{ role:'less-hindered' },
    why:'Under basic conditions this is a plain SN2: no carbocation character, so sterics decide and the nucleophile takes the less substituted CH₂ carbon.',
    diag:{
      c2:{ concept:'epoxide-opening-regiochem', msg:'That is the ACID-conditions answer. Under acid the protonated epoxide develops partial positive charge on the more substituted carbon, which pulls attack there. Under base there is no such charge, so sterics win and attack goes to the less hindered carbon.' },
      o:{ concept:'backside-attack', msg:'The nucleophile attacks a CARBON — the oxygen becomes the alkoxide left behind as the ring opens.' }
    } },

  { id:'epox-acid', kind:'click-atom', tier:3, topic:'epoxides', concepts:['epoxide-opening-regiochem','carbocation-stability'],
    prompt:'With CH₃OH and a trace of H₂SO₄ (acidic conditions), click the carbon attacked.',
    molecule:'propylene-oxide',
    answer:{ role:'more-substituted' },
    why:'Protonating the epoxide oxygen makes the C–O bonds much weaker, and the more substituted carbon stabilizes partial positive charge better. That carbon takes on cation character, so the weak nucleophile attacks there.',
    diag:{
      c1:{ concept:'epoxide-opening-regiochem', msg:'That is the BASIC-conditions answer, where sterics decide. Under acid the protonated epoxide has partial carbocation character on the more substituted carbon, and that electronic effect overrides sterics.' }
    } },

  /* =================================================================
     Aromatics
     ================================================================= */
  { id:'eas-donor-position', kind:'multi-click', tier:3, topic:'directing-effects', concepts:['directing-effects','eas-mechanism'],
    prompt:'Click every ring position where bromination happens.', molecule:'anisole',
    sub:'The methoxy group donates a lone pair into the ring. Click all positions that apply.',
    answer:{ keys:['c2','c6','c4'] },
    why:'A lone-pair donor stabilizes the arenium ion specifically when the electrophile lands ortho or para — those are the positions whose resonance structures put positive charge next to the donating oxygen.',
    diag:{
      c3:{ concept:'directing-effects', msg:'Meta is where a WITHDRAWING group sends the electrophile, and only by elimination. A donor actively stabilizes ortho and para instead.' },
      c5:{ concept:'directing-effects', msg:'Meta again. Draw the arenium resonance structures: the positive charge never lands adjacent to the substituent from meta attack, so the donor cannot help there.' }
    } },

  { id:'eas-withdrawer-position', kind:'multi-click', tier:3, topic:'directing-effects', concepts:['directing-effects','eas-mechanism'],
    prompt:'Click every ring position where nitration of nitrobenzene occurs.', molecule:'nitrobenzene',
    answer:{ keys:['c3','c5'] },
    why:'A strong withdrawer destabilizes the arenium cation worst at ortho and para (those structures put + charge right next to an electron-poor group), so what is left is meta.',
    diag:{
      c2:{ concept:'directing-effects', msg:'Ortho is the worst position with a withdrawing group — one resonance structure puts the positive charge directly next to the electron-poor nitro group. Withdrawers direct meta.' },
      c4:{ concept:'directing-effects', msg:'Para is also destabilized by a withdrawing group, for the same reason as ortho. Meta is the only position that avoids the clash.' }
    } },

  { id:'eas-regenerate', kind:'mcq', tier:2, topic:'eas', concepts:['eas-mechanism','huckel-aromaticity'],
    prompt:'Why does EAS end with substitution rather than addition?',
    options:['The electrophile is too small to add twice','Losing a proton restores aromaticity, which is worth a great deal of stabilization','Addition products are always unstable','The ring cannot form new bonds'],
    answer:1,
    why:'After the ring attacks, the arenium ion could in principle add a nucleophile — but removing the proton instead rebuilds the aromatic sextet, which is worth roughly 36 kcal/mol. The ring always takes that deal.',
    diag:{
      0:{ concept:'eas-mechanism', msg:'Size is not the issue. The driving force is thermodynamic: restoring aromaticity is a large stabilization that addition would forfeit.' },
      2:{ concept:'huckel-aromaticity', msg:'Addition products are perfectly stable for ordinary alkenes — that is what alkenes do. Benzene is different precisely because it would lose aromaticity.' }
    } },

  { id:'aromatic-huckel', kind:'mcq', tier:2, topic:'aromaticity', concepts:['huckel-aromaticity'],
    prompt:'Cyclooctatetraene (8 pi electrons in an 8-membered ring) is:',
    options:['Aromatic','Antiaromatic and highly unstable','Non-aromatic — it puckers into a tub shape','Aromatic only when protonated'],
    answer:2,
    why:'8 pi electrons is 4n, which would be antiaromatic — so the molecule escapes by puckering out of planarity. Losing planarity breaks the conjugation and it simply behaves like a normal set of alkenes.',
    diag:{
      0:{ concept:'huckel-aromaticity', msg:'Count the pi electrons: 8 is 4n (n=2), not 4n+2. Being cyclic and conjugated is not enough — the electron count has to be right.' },
      1:{ concept:'huckel-aromaticity', msg:'Close, and it is the reason for the real answer — but antiaromaticity requires PLANARITY. Molecules that can pucker do, and this one does, so it ends up non-aromatic rather than antiaromatic.' }
    } },

  /* =================================================================
     Stereochemistry
     ================================================================= */
  { id:'stereo-count', kind:'mcq', tier:2, topic:'stereocenters', concepts:['stereocenter-identification'],
    prompt:'How many stereocenters does 2-bromo-3-chlorobutane (CH₃–CHBr–CHCl–CH₃) have?',
    options:['0','1','2','4'],
    answer:2,
    why:'C2 carries H, Br, CH₃ and CHClCH₃ — four different groups. C3 carries H, Cl, CH₃ and CHBrCH₃ — also four different. The two terminal CH₃ carbons have three identical hydrogens, so they do not count.',
    diag:{
      1:{ concept:'stereocenter-identification', msg:'You found one but stopped. Check every sp3 carbon: both of the interior carbons here have four different groups, because the two "halves" of the chain differ (one has Br, the other Cl).' },
      3:{ concept:'stereocenter-identification', msg:'The terminal methyl carbons each have three identical hydrogens, so they can never be stereocenters. Only carbons with four DIFFERENT groups count.' }
    } },

  { id:'stereo-meso', kind:'mcq', tier:3, topic:'meso', concepts:['meso-detection','chirality-recognition'],
    prompt:'(2R,3S)-2,3-dibromobutane is:',
    options:['Chiral and optically active','Meso — achiral despite having two stereocenters','The enantiomer of (2R,3R)','Not a stereoisomer at all'],
    answer:1,
    why:'The two halves are mirror images of each other, so there is an internal mirror plane and the molecule\'s two stereocenters cancel. It has no optical rotation at all.',
    diag:{
      0:{ concept:'meso-detection', msg:'Having stereocenters is not the same as being chiral. Always check for an internal mirror plane first — here the R half and the S half reflect each other, and the rotations cancel exactly.' },
      2:{ concept:'enantiomer-vs-diastereomer', msg:'Enantiomers require EVERY stereocenter inverted. (2R,3S) vs (2R,3R) has one inverted and one not, so they are diastereomers.' }
    } },

  { id:'stereo-relation', kind:'mcq', tier:3, topic:'diastereomers', concepts:['enantiomer-vs-diastereomer','rs-assignment'],
    prompt:'(2R,3R)-tartaric acid and (2R,3S)-tartaric acid are:',
    options:['Enantiomers','Diastereomers','The same compound','Constitutional isomers'],
    answer:1,
    why:'C2 is R in both; only C3 differs. Some but not all stereocenters inverted means diastereomers — genuinely different compounds with different melting points, and separable by ordinary crystallization.',
    diag:{
      0:{ concept:'enantiomer-vs-diastereomer', msg:'Enantiomers need every stereocenter inverted. Here C2 is R in both, so they cannot be mirror images.' },
      3:{ concept:'enantiomer-vs-diastereomer', msg:'Constitutional isomers have different CONNECTIVITY. These have identical connectivity and differ only in 3D arrangement, which makes them stereoisomers.' }
    } },

  { id:'cip-priority-q', kind:'order', tier:3, topic:'rs-configuration', concepts:['cip-priority'],
    prompt:'Rank these substituents by CIP priority, highest first.',
    items:['–Br','–OH','–CH₃','–H'],
    answer:[0,1,2,3],
    why:'Compare the first atom by atomic number: Br (35) > O (8) > C (6) > H (1). Only when those tie do you move outward to the next point of difference.',
    diag:{ any:{ concept:'cip-priority', msg:'Start with the atomic number of the FIRST atom attached — not the size or mass of the whole group, and not how many atoms it contains. Only on a tie do you explore outward.' } } },

  /* =================================================================
     Enolates
     ================================================================= */
  { id:'enolate-why-acidic', kind:'mcq', tier:2, topic:'alpha-hydrogens', concepts:['alpha-acidity','resonance-delocalization'],
    prompt:'Why is an alpha hydrogen (pKa ≈ 20) so much more acidic than an ordinary alkane C–H (pKa ≈ 50)?',
    options:['The carbonyl makes the C–H bond physically weaker','The resulting carbanion is resonance-stabilized onto the carbonyl oxygen','Alpha carbons are more electronegative','Alpha hydrogens are attached to oxygen'],
    answer:1,
    why:'Deprotonating alpha gives an enolate whose negative charge delocalizes onto the electronegative carbonyl oxygen. Thirty pKa units of difference is resonance plus an electronegative atom doing the work.',
    diag:{
      0:{ concept:'acidity-factors', msg:'Acidity is about the stability of the anion produced, not the strength of the bond broken. Look at where the negative charge ends up.' },
      3:{ concept:'alpha-acidity', msg:'Alpha hydrogens are on CARBON — the carbon adjacent to the carbonyl. There is no O–H in a ketone at all.' }
    } },

  { id:'aldol-connect', kind:'mcq', tier:4, topic:'aldol', concepts:['aldol-connectivity','tetrahedral-intermediate','enolate-formation'],
    prompt:'In a base-catalyzed aldol of acetaldehyde with itself, which new bond forms?',
    options:['Between the two carbonyl carbons','Between the alpha carbon of one molecule and the carbonyl carbon of the other','Between the two oxygens','Between an alpha carbon and an alpha carbon'],
    answer:1,
    why:'Base makes an enolate, whose nucleophilic alpha carbon attacks the electrophilic carbonyl carbon of a second molecule. The result is a beta-hydroxy aldehyde — and reading that bond backwards is how you solve retro-aldol problems.',
    diag:{
      0:{ concept:'aldol-connectivity', msg:'Both carbonyl carbons are electrophilic — two electrophiles cannot bond to each other. One molecule has to become a nucleophile first, which is what enolate formation does to the ALPHA carbon.' },
      3:{ concept:'carbonyl-electrophilicity', msg:'That would be two nucleophilic carbons meeting. You need one nucleophile (the enolate alpha carbon) and one electrophile (a carbonyl carbon).' }
    } },

  { id:'claisen-vs-aldol', kind:'mcq', tier:4, topic:'claisen', concepts:['claisen-connectivity','tetrahedral-intermediate','acyl-reactivity-order'],
    prompt:'A Claisen condensation gives a beta-keto ester, while an aldol gives a beta-hydroxy carbonyl. What causes the difference?',
    options:['Claisen uses a much stronger base','The ester\'s tetrahedral intermediate can expel an alkoxide, so the C=O reforms instead of just being protonated','Claisen reactions are run at higher temperature','Aldol reactions are irreversible'],
    answer:1,
    why:'Same attack, different collapse. An aldehyde or ketone has no leaving group, so the alkoxide just picks up a proton (addition). An ester has OR attached, so the intermediate collapses and expels it (substitution) — leaving a ketone behind.',
    diag:{
      0:{ concept:'enolate-formation', msg:'Base strength affects how much enolate forms, but not what the intermediate does once formed. The difference is structural: whether the carbonyl carries a leaving group.' },
      2:{ concept:'tetrahedral-intermediate', msg:'Temperature is not the distinguishing feature. Ask what the tetrahedral intermediate can DO — expel a leaving group, or not.' }
    } },

  /* =================================================================
     Conformations
     ================================================================= */
  { id:'chair-substituent', kind:'mcq', tier:2, topic:'axial-equatorial', concepts:['chair-axial-equatorial','steric-hindrance'],
    prompt:'In the favoured chair of methylcyclohexane, the methyl group sits:',
    options:['Axial','Equatorial','It makes no difference','Perpendicular to the ring plane'],
    answer:1,
    why:'An axial methyl suffers 1,3-diaxial interactions with the two axial hydrogens three carbons away. Equatorial points outward into open space, so roughly 95% of molecules sit in that conformer at room temperature.',
    diag:{
      0:{ concept:'chair-axial-equatorial', msg:'Axial is the crowded position — a group there bumps into the two axial hydrogens on the same face three carbons around. Bulky groups go equatorial.' },
      2:{ concept:'chair-axial-equatorial', msg:'It matters a great deal: the equatorial preference is about 1.7 kcal/mol for a methyl, which is a 95:5 ratio at equilibrium.' }
    } },

  { id:'ring-flip-q', kind:'mcq', tier:3, topic:'ring-flips', concepts:['ring-flip-mechanics','chair-axial-equatorial'],
    prompt:'A ring flip converts an axial substituent to equatorial. What does it NOT change?',
    options:['Which bonds are axial and which are equatorial','Whether the substituent is on the top or bottom face','The relative energies of the two chairs','The positions of the ring carbons in space'],
    answer:1,
    why:'A flip swaps axial and equatorial everywhere, but every substituent keeps its up-or-down face. That is exactly why cis stays cis and trans stays trans through a flip — the relationship is fixed by the face, not the orientation.',
    diag:{
      0:{ concept:'ring-flip-mechanics', msg:'That is precisely what a flip DOES change — every axial bond becomes equatorial and vice versa.' },
      2:{ concept:'ring-flip-mechanics', msg:'The two chairs genuinely have different energies whenever a substituent is present; that energy difference is what makes one conformer dominate.' }
    } },

  { id:'newman-lowest', kind:'mcq', tier:2, topic:'newman', concepts:['newman-reading','torsional-strain'],
    prompt:'Which conformer of butane, sighting down C2–C3, is lowest in energy?',
    options:['Anti (methyls 180° apart)','Gauche (methyls 60° apart)','Eclipsed with methyls aligned','Eclipsed with methyl and hydrogen aligned'],
    answer:0,
    why:'Anti is staggered (no torsional strain) and puts the two methyl groups as far apart as possible (no steric strain). Gauche is staggered but crowded; the eclipsed forms are worse on both counts.',
    diag:{
      1:{ concept:'torsional-strain', msg:'Gauche is staggered, so no torsional strain — but the two methyls are only 60° apart and bump into each other. Anti avoids that entirely.' },
      2:{ concept:'torsional-strain', msg:'That is the HIGHEST energy conformer: eclipsed bonds plus the two bulkiest groups directly aligned.' }
    } },

  /* =================================================================
     Spectroscopy
     ================================================================= */
  { id:'ir-carbonyl', kind:'mcq', tier:1, topic:'ir', concepts:['ir-functional-groups'],
    prompt:'A strong, sharp IR absorption near 1715 cm⁻¹ indicates:',
    options:['An O–H group','A C=O group','A C≡N group','An aromatic ring'],
    answer:1,
    why:'The carbonyl stretch is the single most recognizable IR signal: strong, sharp, and right around 1700–1750 cm⁻¹. If it is there, you have a carbonyl.',
    diag:{
      0:{ concept:'ir-functional-groups', msg:'O–H shows up much higher and much broader — a wide hump from 3200 to 3600 cm⁻¹. The sharp peak at 1715 is a carbonyl.' },
      2:{ concept:'ir-functional-groups', msg:'A nitrile is a sharp spike near 2250 cm⁻¹. Triple bonds absorb higher than double bonds because they are stiffer.' }
    } },

  { id:'nmr-ethyl', kind:'mcq', tier:2, topic:'h-nmr', concepts:['nmr-splitting-integration'],
    prompt:'A ¹H NMR shows a 3H triplet and a 2H quartet. What fragment is present?',
    options:['An isopropyl group','An ethyl group','A methyl group on an aromatic ring','A tert-butyl group'],
    answer:1,
    why:'The classic ethyl pattern. The CH₃ (3H) has two neighbours, giving 2+1 = 3 lines; the CH₂ (2H) has three neighbours, giving 3+1 = 4 lines. The 3:2 integration confirms it.',
    diag:{
      0:{ concept:'nmr-splitting-integration', msg:'An isopropyl group gives a 6H DOUBLET and a 1H septet — the two equivalent methyls integrate to 6, not 3.' },
      3:{ concept:'nmr-splitting-integration', msg:'A tert-butyl group gives a 9H SINGLET: nine equivalent hydrogens with no neighbouring hydrogens to split them.' }
    } },

  { id:'nmr-shift-q', kind:'mcq', tier:2, topic:'h-nmr', concepts:['nmr-shift-shielding','electronegativity-trend'],
    prompt:'Which hydrogen appears furthest downfield (highest ppm)?',
    options:['CH₃ of an alkane','CH₂ next to an oxygen','An aromatic ring hydrogen','An aldehyde hydrogen'],
    answer:3,
    why:'An aldehyde proton comes in around 9.5–10 ppm — it sits on a carbon that is both attached to an electronegative oxygen and part of a pi system whose ring current deshields it further.',
    diag:{
      1:{ concept:'nmr-shift-shielding', msg:'That is around 3.5 ppm — genuinely downfield of an alkane, but an aldehyde proton is far further out at roughly 9.7.' },
      2:{ concept:'nmr-shift-shielding', msg:'Aromatic hydrogens land near 7 ppm, which is strongly deshielded — but an aldehyde proton still beats them.' }
    } },

  { id:'ms-halogen', kind:'mcq', tier:3, topic:'mass-spec', concepts:['ms-fragmentation'],
    prompt:'A mass spectrum shows M and M+2 peaks of roughly equal height. This indicates:',
    options:['Chlorine','Bromine','Nitrogen','Two oxygens'],
    answer:1,
    why:'Bromine\'s two isotopes (⁷⁹Br and ⁸¹Br) are about equally abundant, so M and M+2 come out roughly 1:1. Chlorine\'s isotopes are about 3:1 instead, giving a much shorter M+2.',
    diag:{
      0:{ concept:'ms-fragmentation', msg:'Chlorine gives an M+2 about one third the height of M (³⁵Cl:³⁷Cl ≈ 3:1). Roughly equal heights is the bromine signature.' },
      2:{ concept:'ms-fragmentation', msg:'Nitrogen shows up in the nitrogen rule — an odd molecular ion mass means an odd number of nitrogens — not in an M+2 peak.' }
    } },

  /* =================================================================
     Foundations
     ================================================================= */
  { id:'formal-charge-o', kind:'mcq', tier:1, topic:'formal-charge', concepts:['formal-charge-calc','valence-electrons'],
    prompt:'An oxygen atom with three bonds and one lone pair has what formal charge?',
    options:['−1','0','+1','+2'],
    answer:2,
    why:'Formal charge = 6 (oxygen\'s valence electrons) − 2 (lone-pair electrons) − 3 (bonds) = +1. That is the oxygen in a protonated alcohol or an oxocarbenium ion.',
    diag:{
      0:{ concept:'formal-charge-calc', msg:'Check the direction: −1 oxygen has ONE bond and three lone pairs (like hydroxide). Extra bonds push formal charge positive, not negative.' },
      1:{ concept:'formal-charge-calc', msg:'Neutral oxygen has two bonds and two lone pairs. Count carefully: 6 − 2 − 3 does not come to zero.' }
    } },

  { id:'hybrid-carbonyl', kind:'mcq', tier:2, topic:'hybridization', concepts:['hybridization-assignment'],
    prompt:'What is the hybridization of the carbonyl carbon in acetone?',
    options:['sp','sp²','sp³','sp³d'],
    answer:1,
    why:'Count groups, not bonds: two methyls plus one oxygen is three groups, so sp² and trigonal planar. The second bond of the C=O is a pi bond from an unhybridized p orbital and does not add a group.',
    diag:{
      2:{ concept:'hybridization-assignment', msg:'You counted the double bond as two groups. Count ATTACHED ATOMS plus lone pairs — the carbonyl carbon is bonded to three atoms, so it is sp².' },
      0:{ concept:'hybridization-assignment', msg:'sp means two groups, which is what you get in an alkyne or a nitrile carbon. This carbon has three.' }
    } },

  { id:'polarity-ccl4', kind:'mcq', tier:2, topic:'bond-polarity', concepts:['bond-polarity-dipoles','molecular-geometry-vsepr'],
    prompt:'CCl₄ contains four very polar C–Cl bonds. Is the molecule polar?',
    options:['Yes — polar bonds always make a polar molecule','No — the tetrahedral geometry makes the four bond dipoles cancel','Yes, but only weakly','It depends on the solvent'],
    answer:1,
    why:'Bond dipoles are vectors. Four identical dipoles pointing at the corners of a regular tetrahedron sum to exactly zero, so CCl₄ is nonpolar despite every individual bond being polar.',
    diag:{
      0:{ concept:'bond-polarity-dipoles', msg:'Polar bonds are necessary but not sufficient. Always check the geometry: symmetric arrangements cancel. CHCl₃ IS polar, because the symmetry is broken.' },
      2:{ concept:'bond-polarity-dipoles', msg:'The cancellation is exact, not partial — the geometry is perfectly symmetric, so the net dipole is genuinely zero.' }
    } },

  { id:'en-trend', kind:'mcq', tier:1, topic:'electronegativity', concepts:['electronegativity-trend'],
    prompt:'Which atom is most electronegative?',
    options:['Carbon','Nitrogen','Oxygen','Fluorine'],
    answer:3,
    why:'Electronegativity increases up and to the right on the periodic table, which puts fluorine at the top: F > O > N > C.',
    diag:{
      2:{ concept:'electronegativity-trend', msg:'Oxygen is a close second, but fluorine is further right in the same period and beats it.' },
      0:{ concept:'electronegativity-trend', msg:'Carbon is the least electronegative of these four — which is why C–O and C–F bonds are polarized away from carbon, leaving it δ+ and electrophilic.' }
    } },

  { id:'lp-nucleophile-click', kind:'click-atom', tier:1, topic:'nucleophiles', concepts:['nucleophile-recognition','lewis-acid-base'],
    prompt:'Click the atom that makes this molecule nucleophilic.', molecule:'ethylamine',
    answer:{ role:'nucleophile' },
    why:'The nitrogen lone pair. It is not tied up in any pi system, so it is fully available to attack an electrophile or grab a proton — which is why alkylamines are both good nucleophiles and decent bases.',
    diag:{
      c1:{ concept:'nucleophile-recognition', msg:'Ordinary alkyl carbons have no lone pair and no charge — nothing to donate. Look for the atom carrying the lone pair.' },
      h1:{ concept:'nucleophile-recognition', msg:'An N–H hydrogen is slightly δ+, the opposite of nucleophilic. The electrons are on the nitrogen.' }
    } },

  { id:'lewis-acid-q', kind:'mcq', tier:2, topic:'lewis-acids', concepts:['lewis-acid-base','electrophile-recognition'],
    prompt:'AlCl₃ has no acidic hydrogen. Why is it a strong Lewis acid?',
    options:['It releases Cl⁻ which is acidic','Aluminium has an empty orbital and only six valence electrons, so it accepts an electron pair','It has three polar bonds','It reacts with water'],
    answer:1,
    why:'The Lewis definition is about electron pairs, not protons. Aluminium here is two electrons short of an octet with an empty p orbital, so it eagerly accepts a lone pair — which is exactly what it does in Friedel-Crafts catalysis.',
    diag:{
      0:{ concept:'lewis-acid-base', msg:'Chloride is a weak BASE, not an acid — and AlCl₃ acts as an acid by accepting electrons at aluminium, not by releasing anything.' },
      2:{ concept:'lewis-acid-base', msg:'Polar bonds contribute, but the decisive feature is the empty orbital on aluminium. BF₃ works the same way for the same reason.' }
    } },

  { id:'tf-pi-nucleophile', kind:'tf', tier:1, topic:'alkene-structure', concepts:['alkene-pi-nucleophile','nucleophile-recognition'],
    prompt:'An alkene\'s pi bond acts as a nucleophile in electrophilic addition.',
    options:['True','False'], answer:0,
    why:'Pi electrons are loosely held and sit exposed above and below the molecular plane, so an alkene is electron-rich. It attacks the electrophile, not the other way around.',
    diag:{
      1:{ concept:'alkene-pi-nucleophile', msg:'The name "electrophilic addition" describes what gets ADDED, not what attacks. The alkene is the nucleophile and it attacks the electrophile — that is the first arrow in every one of these mechanisms.' }
    } },

  { id:'tf-resonance-atoms', kind:'tf', tier:1, topic:'resonance', concepts:['resonance-validity'],
    prompt:'In a valid set of resonance structures, atoms may move as long as the total charge stays the same.',
    options:['True','False'], answer:1,
    why:'Only electrons move. Structures that differ by the position of an atom are isomers (or tautomers), not resonance forms — they are genuinely different molecules that interconvert by breaking bonds.',
    diag:{
      0:{ concept:'resonance-validity', msg:'This is the single most common resonance error. Nuclei stay frozen in place; only lone pairs and pi electrons move. If you had to move an atom, you drew a different compound.' }
    } },

  { id:'challenge-multi-1', kind:'mcq', tier:4, topic:'substrate-effects', concepts:['mechanism-selection','carbocation-rearrangement','stereochemical-outcome'],
    prompt:'(S)-3-bromo-2,2-dimethylbutane is warmed in methanol. What best describes the product?',
    options:['A single inverted ether from clean SN2','An ether derived from a rearranged tertiary carbocation, essentially racemic at the new centre','The starting material, unchanged','An alkene only, with no substitution product'],
    answer:1,
    why:'Three things chain together: methanol is a weak neutral nucleophile, so this is solvolysis (SN1). The secondary cation formed sits next to a quaternary carbon, so a methyl shift gives the tertiary cation. Attack on that planar cation happens from either face, so the product is racemic — and the stereochemistry you started with is gone.',
    diag:{
      0:{ concept:'mechanism-selection', msg:'Neutral methanol is a weak nucleophile — it cannot drive SN2 on a secondary, hindered carbon. Weak neutral nucleophile plus heat means solvolysis, which means a carbocation, which means both rearrangement and loss of stereochemistry.' },
      2:{ concept:'mechanism-selection', msg:'Warm methanol with a secondary bromide readily solvolyzes. Something definitely happens.' },
      3:{ concept:'mechanism-selection', msg:'E1 does compete here and some alkene forms, but solvolysis in methanol gives substitution as the major pathway. And either way, the rearrangement happens first.' }
    } },

  { id:'challenge-multi-2', kind:'mcq', tier:4, topic:'e2', concepts:['anti-periplanar-geometry','zaitsev-hofmann','stereochemical-outcome'],
    prompt:'E2 is stereospecific: a single diastereomer of a substrate gives a single alkene geometry. Why?',
    options:['Because the base always attacks from the same side','Because the anti-periplanar requirement fixes which groups end up cis and which end up trans','Because alkenes are always trans','Because carbocations are planar'],
    answer:1,
    why:'Once you lock the conformation so the H and the leaving group are anti-periplanar, the positions of every other substituent are locked too — and those positions carry straight through into the alkene. Change the starting diastereomer and you get the other alkene geometry.',
    diag:{
      0:{ concept:'anti-periplanar-geometry', msg:'The base has to approach the anti-periplanar hydrogen wherever it happens to be — the geometric constraint is in the substrate, not in how the base comes in.' },
      2:{ concept:'zaitsev-hofmann', msg:'Trans is usually more stable, but E2 is stereoSPECIFIC — the product geometry is dictated by the starting diastereomer, and the cis alkene really does form when that is what the geometry demands.' },
      3:{ concept:'anti-periplanar-geometry', msg:'E2 has no carbocation at all — it is concerted. Planar carbocations are what DESTROY stereochemical information, in E1 and SN1.' }
    } },


    /* ---- draw-the-mechanism ------------------------------------------
       The only kind where the student produces the answer instead of picking
       it. `answer.arrows` is a set: order does not matter, direction does,
       and an extra arrow is a wrong mechanism rather than a near miss.
       Endpoints are atom keys, or "bond:a-b" for the very common case where
       the electrons come out of a bond. `diag` is keyed by "from>to" of the
       first arrow that is not in the expected set, plus "missing" when the
       arrows drawn were all right but too few. */

    { id:'sn2-draw-both', kind:'draw', tier:3, topic:'sn2',
      concepts:['curved-arrow-direction','backside-attack','leaving-group-ability'],
      prompt:'Draw the complete SN2 mechanism for hydroxide attacking bromoethane.',
      molecule:'sn2-bromoethane',
      drawHint:'Two arrows, both happening at once. One brings electrons in; one takes them out.',
      answer:{ arrows:[ {from:'nucO', to:'c1'}, {from:'bond:c1-br', to:'br'} ] },
      why:'Hydroxide’s lone pair attacks the carbon from the side opposite bromine, and at the same instant the C–Br bonding electrons leave with bromide. One concerted step — no intermediate, which is why the carbon inverts.',
      diag:{
        'c1>nucO':{ concept:'curved-arrow-direction', msg:'That arrow runs backwards. Arrows follow the electrons, and the electrons live on hydroxide — it is the electron-rich species. They move toward the carbon, never away from it.' },
        'c1>br':{ concept:'curved-arrow-direction', msg:'Close, but the tail is on the wrong thing. The electrons that leave with bromide are the C–Br BONDING electrons, so the tail belongs on the bond itself, not on the carbon.' },
        'br>c1':{ concept:'leaving-group-ability', msg:'Bromine is not donating electrons to the carbon here — it is leaving, and it takes the bonding pair with it. The arrow points from the bond out to bromine.' },
        'nucO>br':{ concept:'nucleophile-recognition', msg:'Hydroxide attacks the electron-poor carbon, not bromine. Bromine is already electron-rich — two electron-rich species repel.' },
        'missing':{ concept:'curved-arrow-direction', msg:'SN2 is concerted: the bond forming and the bond breaking are drawn together. An attack arrow with no departure arrow leaves carbon with five bonds.' }
      } },

    { id:'sn1-draw-ionize', kind:'draw', tier:2, topic:'sn1',
      concepts:['curved-arrow-direction','leaving-group-ability','carbocation-stability'],
      prompt:'Draw the first step of the SN1: ionize 2-bromopropane.',
      molecule:'sn1-secondary',
      drawHint:'One arrow. Nothing attacks yet — that is what makes this SN1 and not SN2.',
      answer:{ arrows:[ {from:'bond:c1-br', to:'br'} ] },
      why:'The C–Br bond breaks heterolytically on its own: bromide leaves with both electrons, and what stays behind is a planar secondary carbocation. This slow step is rate-determining, which is why the nucleophile’s concentration does not appear in the rate law.',
      diag:{
        'c1>br':{ concept:'curved-arrow-direction', msg:'The tail has to sit on the electrons that actually move, and those are the C–Br bonding electrons — so start on the bond, not on the carbon. A carbon with four bonds has no lone pair to give.' },
        'br>c1':{ concept:'leaving-group-ability', msg:'Backwards. Bromide leaves carrying the electron pair away from carbon; it does not push electrons into it.' },
        'h>c1':{ concept:'carbocation-stability', msg:'No hydride is shifting here. The first step of an SN1 is simply the leaving group departing — rearrangement is a separate step and only happens when it produces a more stable cation.' }
      } },

    { id:'e2-draw-concerted', kind:'draw', tier:4, topic:'e2',
      concepts:['curved-arrow-direction','anti-periplanar-geometry','leaving-group-ability'],
      prompt:'A strong base has just removed the beta hydrogen shown. Draw the two remaining arrows that complete the E2.',
      molecule:'e2-butane',
      drawHint:'Where do the C–H electrons go, and what happens to the C–Br bond?',
      answer:{ arrows:[ {from:'bond:c2-hb', to:'bond:c2-c3'}, {from:'bond:c3-br', to:'br'} ] },
      why:'The C–H electrons drop down to become the new pi bond between the alpha and beta carbons, and that same motion pushes bromide off the alpha carbon. All of it is one concerted step, which is why the H and the Br must be anti-periplanar — the orbitals have to line up.',
      diag:{
        'bond:c2-hb>c2':{ concept:'curved-arrow-direction', msg:'The C–H electrons do not just collapse onto the beta carbon — that would make a carbanion. They become the pi BOND between the two carbons, so the arrowhead points at the C–C bond.' },
        'bond:c2-hb>c3':{ concept:'curved-arrow-direction', msg:'Nearly. The new pi bond forms between the beta and alpha carbons, so point the arrow at the bond between them rather than at the alpha carbon itself.' },
        'c3>br':{ concept:'curved-arrow-direction', msg:'The tail belongs on the C–Br bond — those are the electrons leaving with bromide. Carbon has no lone pair to donate.' },
        'bond:c2-hc>bond:c2-c3':{ concept:'anti-periplanar-geometry', msg:'That hydrogen is on the wrong carbon for this elimination. E2 needs the H and the leaving group on ADJACENT carbons and anti-periplanar — 180° apart, not merely nearby.' },
        'missing':{ concept:'curved-arrow-direction', msg:'E2 is concerted. If the leaving group does not go in the same step, you have drawn a carbanion intermediate — that is E1cb, a different mechanism.' }
      } },

    { id:'carbonyl-draw-addition', kind:'draw', tier:2, topic:'nucleophilic-addition',
      concepts:['curved-arrow-direction','carbonyl-electrophilicity','tetrahedral-intermediate'],
      prompt:'A hydride is about to attack acetone’s carbonyl carbon. Draw what the C=O pi bond must do.',
      molecule:'acetone',
      drawHint:'One arrow. Carbon can only have four bonds — something has to give.',
      answer:{ arrows:[ {from:'bond:c-o', to:'o'} ] },
      why:'Carbon cannot accept a fifth bond, so as the nucleophile comes in the C=O pi electrons go up onto oxygen. Oxygen can carry that negative charge comfortably; carbon could not. What is left is the tetrahedral alkoxide intermediate.',
      diag:{
        'bond:c-o>c':{ concept:'electron-rich-poor', msg:'Backwards. Pushing the pi electrons onto the carbonyl carbon would put a negative charge on carbon while a nucleophile is also arriving there. Oxygen is the electronegative atom — it takes the charge.' },
        'o>c':{ concept:'carbonyl-electrophilicity', msg:'Oxygen is not the nucleophile in this step. It is the carbon that is electron-poor and under attack; oxygen is where the displaced electrons go.' },
        'bond:c-ca>c':{ concept:'curved-arrow-direction', msg:'The C–C bond is not involved. It is the pi bond of the C=O that breaks, because that is the only bond at this carbon holding electrons that have somewhere better to be.' }
      } },

    { id:'markovnikov-draw', kind:'draw', tier:3, topic:'markovnikov',
      concepts:['curved-arrow-direction','alkene-pi-nucleophile','markovnikov-regiochem'],
      prompt:'Propene reacts with HBr. Draw the two arrows for the first step.',
      molecule:'propene-hbr',
      drawHint:'The alkene is the electron-rich species here. What does it attack, and what must break?',
      answer:{ arrows:[ {from:'bond:c1-c2', to:'hbrH'}, {from:'bond:hbrH-hbrBr', to:'hbrBr'} ] },
      why:'The pi bond is the nucleophile — it reaches out and grabs the proton of H–Br, and the H–Br bond breaks so bromide leaves with the electrons. Which carbon keeps the hydrogen decides everything: the proton adds so the positive charge lands on the more substituted carbon, where it is more stable.',
      diag:{
        'bond:c1-c2>hbrBr':{ concept:'electrophile-recognition', msg:'The alkene attacks the hydrogen, not the bromine. In H–Br the hydrogen is the δ+ end — bromine is the electronegative one, already electron-rich.' },
        'hbrH>bond:c1-c2':{ concept:'curved-arrow-direction', msg:'That arrow runs the wrong way. The electrons are in the pi bond, so the pi bond is the tail; a hydrogen with one bond has no pair to donate.' },
        'hbrBr>bond:c1-c2':{ concept:'alkene-pi-nucleophile', msg:'Bromide is not attacking the alkene — two electron-rich species repel. The alkene is the nucleophile and goes after the proton first; bromide only arrives after the carbocation forms.' },
        'missing':{ concept:'curved-arrow-direction', msg:'Grabbing the proton without breaking H–Br would leave hydrogen with two bonds. Every bond you make at an atom that is already full needs a matching bond broken.' }
      } },

    { id:'acyl-draw-collapse', kind:'draw', tier:4, topic:'acyl-substitution',
      concepts:['tetrahedral-intermediate','leaving-group-ability','curved-arrow-direction'],
      prompt:'A tetrahedral intermediate has formed from methyl acetate. Draw the two arrows that collapse it and expel the leaving group.',
      molecule:'methyl-acetate',
      drawHint:'This is the step that makes it substitution instead of addition.',
      answer:{ arrows:[ {from:'o1', to:'bond:c-o1'}, {from:'bond:c-o2', to:'o2'} ] },
      why:'The alkoxide oxygen pushes its lone pair back down to reform the C=O, and that forces something off the carbon — the OR group leaves as an alkoxide. This is exactly what a ketone cannot do: a ketone’s substituents are carbons, which will not leave as carbanions, so its tetrahedral intermediate just gets protonated instead.',
      diag:{
        'o1>c':{ concept:'curved-arrow-direction', msg:'The lone pair reforms the C=O pi BOND, so the arrowhead points at the C–O bond, not at the carbon. Pointing it at carbon would mean forming a second sigma bond to an atom that already has four.' },
        'bond:c-ca>ca':{ concept:'leaving-group-ability', msg:'The methyl group does not leave. It would have to go as a carbanion, and carbanions are terrible leaving groups — that is the whole reason ketones add rather than substitute.' },
        'c>o2':{ concept:'curved-arrow-direction', msg:'The tail belongs on the C–O bond that is breaking, not on the carbon. Carbon has no lone pair here to donate.' },
        'missing':{ concept:'tetrahedral-intermediate', msg:'Reforming the C=O without expelling a leaving group would give carbon five bonds. The collapse and the departure are one step — that pairing is what turns addition into substitution.' }
      } },

    { id:'epoxide-draw-open', kind:'draw', tier:3, topic:'epoxides',
      concepts:['curved-arrow-direction','epoxide-opening-regiochem','backside-attack'],
      prompt:'Under basic conditions a strong nucleophile attacks the less hindered carbon of propylene oxide. Draw the arrow showing the ring open.',
      molecule:'propylene-oxide',
      drawHint:'One arrow. The ring oxygen is a leaving group that cannot actually leave.',
      answer:{ arrows:[ {from:'bond:o-c1', to:'o'} ] },
      why:'An epoxide oxygen is a poor leaving group on paper — an alkoxide — but ring strain makes up the difference. As the nucleophile attacks C1 from the back, the C1–O bond breaks and the electrons go to oxygen, which stays tethered to the molecule as an alkoxide.',
      diag:{
        'bond:o-c2>o':{ concept:'epoxide-opening-regiochem', msg:'Wrong carbon. Under BASIC conditions this is a plain SN2, so sterics decide and the nucleophile hits the less substituted carbon. Attack at the more substituted carbon is the acidic-conditions answer.' },
        'o>c1':{ concept:'curved-arrow-direction', msg:'Backwards. Oxygen is receiving the electrons from the breaking C–O bond, not donating a lone pair into the carbon — it is already bonded to it.' },
        'bond:c1-c2>c1':{ concept:'curved-arrow-direction', msg:'The C–C bond of the ring does not break. Breaking a C–O bond relieves the strain and puts the charge on oxygen, which can hold it; breaking C–C would leave a carbanion.' }
      } },

    { id:'acid-draw-deprotonate', kind:'draw', tier:1, topic:'carboxylic-acids',
      concepts:['curved-arrow-direction','bronsted-identification','acidity-factors'],
      prompt:'A base removes the acidic proton from acetic acid. Draw the arrow for the O–H bond breaking.',
      molecule:'acetic-acid',
      drawHint:'One arrow. When a proton is taken, where do its bonding electrons end up?',
      answer:{ arrows:[ {from:'bond:o2-h', to:'o2'} ] },
      why:'A proton leaves as H⁺ — bare, with no electrons — so the O–H bonding pair stays behind on oxygen. That is what makes a carboxylate, and the charge then spreads over both oxygens, which is why this proton is so much more acidic than an alcohol’s.',
      diag:{
        'o2>bond:o2-h':{ concept:'curved-arrow-direction', msg:'Backwards. The bond is breaking, not forming: the electrons move OUT of the O–H bond and onto oxygen.' },
        'bond:o2-h>h':{ concept:'bronsted-identification', msg:'The electrons do not go with the hydrogen. A Brønsted acid donates a proton — just the nucleus — and the bonding pair is left behind on the atom it was attached to.' },
        'bond:ca-ha>ca':{ concept:'acidity-factors', msg:'That is an alpha C–H, around pKa 20 here and far less acidic. The O–H is the acidic one because its conjugate base is stabilized by resonance across two oxygens.' },
        'bond:c-o1>o1':{ concept:'acidity-factors', msg:'The C=O pi bond is not what breaks when an acid is deprotonated. Look for the proton that leaves — the O–H — and break the bond holding it.' }
      } },

  ];

  // ---- index helpers ----
  var BY_ID = {};
  Q.forEach(function(q){ BY_ID[q.id] = q; });

  function byTopic(topicId){ return Q.filter(function(q){ return q.topic === topicId; }); }
  function byConcept(conceptId){
    return Q.filter(function(q){ return (q.concepts || []).indexOf(conceptId) !== -1; });
  }

  window.OchemInteractiveBank = {
    ALL: Q,
    get: function(id){ return BY_ID[id] || null; },
    byTopic: byTopic,
    byConcept: byConcept
  };
})();
