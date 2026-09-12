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


    /* ---- Module 1: structure, bonding, geometry -----------------------
       These topics had no interactive question at all, because until now
       every molecule in the library was a reaction substrate — there was
       nothing to point at for "how many valence electrons" or "what shape is
       this". The small molecules added to molecules.js are what these ask
       about. */

    { id:'atomic-lonepair-click', kind:'click-atom', tier:1, topic:'atomic-structure',
      concepts:['valence-electrons'],
      prompt:'Click the atom that still has a lone pair.',
      molecule:'ammonia',
      answer:{ role:'nucleophile' },
      why:'Nitrogen has five valence electrons. Three go into bonds with hydrogen, and the remaining two stay together as a lone pair — which is the whole reason ammonia acts as a base and a nucleophile.',
      diag:{
        h1:{ concept:'valence-electrons', msg:'Hydrogen has exactly one valence electron and uses it in its single bond. It has nothing left over — hydrogen never carries a lone pair.' },
        h2:{ concept:'valence-electrons', msg:'Hydrogen has one valence electron, spent on its one bond. Look for the atom with more valence electrons than bonds.' },
        h3:{ concept:'valence-electrons', msg:'Hydrogen has one valence electron and one bond. The lone pair is on the atom that had electrons left after bonding.' }
      } },

    { id:'valence-count-order', kind:'order', tier:1, topic:'atomic-structure',
      concepts:['valence-electrons'],
      prompt:'Rank these atoms by number of valence electrons, most first.',
      items:['Fluorine', 'Oxygen', 'Nitrogen', 'Carbon'],
      answer:[0,1,2,3],
      why:'Across a row, the group number gives the count: carbon 4, nitrogen 5, oxygen 6, fluorine 7. That count is what fixes how many bonds each one forms — 4, 3, 2 and 1 respectively.',
      diag:{ any:{ concept:'valence-electrons', msg:'Read them off the periodic table row, left to right: each step right adds one valence electron. Carbon 4, nitrogen 5, oxygen 6, fluorine 7 — so this ranking runs right-to-left across the row.' } } },

    { id:'orbital-fill-order', kind:'order', tier:1, topic:'orbitals',
      concepts:['valence-electrons'],
      prompt:'Put these orbitals in the order they fill.',
      items:['1s', '2s', '2p', '3s'],
      answer:[0,1,2,3],
      why:'Lowest energy first. The 1s is closest to the nucleus and fills before anything else; within a shell, s fills before p because an s orbital penetrates closer to the nucleus.',
      diag:{ any:{ concept:'valence-electrons', msg:'Fill from lowest energy up: work through shell by shell, and inside each shell s comes before p. Nothing in the second shell fills until the first is complete.' } } },

    { id:'bonding-pi-atoms', kind:'multi-click', tier:1, topic:'bonding',
      concepts:['lewis-structures-drawing','valence-electrons'],
      prompt:'Click both atoms joined by the pi bond.',
      molecule:'formaldehyde',
      sub:'A double bond is one sigma plus one pi. Click the two atoms sharing that pi bond.',
      answer:{ keys:['c','o'] },
      why:'The C=O double bond is one sigma bond (end-on overlap, the one you can rotate about on a single bond) plus one pi bond (side-on overlap of the leftover p orbitals). The C–H bonds are single: sigma only.',
      diag:{
        h1:{ concept:'lewis-structures-drawing', msg:'That C–H bond is a single bond — one sigma, no pi. Pi bonds only exist as the second and third bonds of a double or triple bond.' },
        h2:{ concept:'lewis-structures-drawing', msg:'A single bond is a sigma bond on its own. Look for the double bond in the structure.' }
      } },

    { id:'bond-order-strength', kind:'order', tier:2, topic:'bonding',
      concepts:['lewis-structures-drawing'],
      prompt:'Rank these carbon–carbon bonds from shortest to longest.',
      items:['C≡C (triple)', 'C=C (double)', 'C–C (single)'],
      answer:[0,1,2],
      why:'More shared electron pairs pull the nuclei closer together, so bond length falls as bond order rises — and bond strength rises with it. A triple bond is both the shortest and the strongest of the three.',
      diag:{ any:{ concept:'lewis-structures-drawing', msg:'Count the bonds between the carbons. Each extra pair of shared electrons pulls the two nuclei closer, so more bonds means shorter — and stronger.' } } },

    { id:'lewis-no-lonepair', kind:'click-atom', tier:1, topic:'lewis-structures',
      concepts:['lewis-structures-drawing','formal-charge-calc'],
      prompt:'Click the atom that has used up all its valence electrons in bonds.',
      molecule:'ammonium',
      answer:{ role:'conjugate-acid' },
      why:'Nitrogen brought five valence electrons. Making four bonds uses four of them, and it shares the fifth — which is why the formal charge works out to +1 and there is no lone pair left to donate.',
      diag:{
        h1:{ concept:'valence-electrons', msg:'Hydrogen only ever has one valence electron and one bond, in every structure — it is not the interesting atom here. Look at the central atom.' },
        h4:{ concept:'valence-electrons', msg:'Every hydrogen here is the same: one electron, one bond. The atom whose electron count actually changed is the nitrogen.' }
      } },

    { id:'lewis-formal-charge-o', kind:'click-atom', tier:2, topic:'lewis-structures',
      concepts:['formal-charge-calc','lewis-structures-drawing'],
      prompt:'Click the oxygen carrying a formal charge of −1.',
      molecule:'acetate-ion',
      answer:{ keys:['o2'] },
      why:'Formal charge = valence − lone-pair electrons − bonds. The single-bonded oxygen is 6 − 6 − 1 = −1. The double-bonded one is 6 − 4 − 2 = 0. In the real ion the charge is shared between them, but in THIS drawn resonance form it sits on the singly-bonded oxygen.',
      diag:{
        o1:{ concept:'formal-charge-calc', msg:'Run the arithmetic on that one: 6 valence − 4 lone-pair electrons − 2 bonds = 0. It is the oxygen with three lone pairs and only one bond that comes out negative.' },
        c:{ concept:'formal-charge-calc', msg:'That carbon has four bonds and no lone pairs: 4 − 0 − 4 = 0. Neutral. Carbon with four bonds is almost always formal-charge zero.' },
        ca:{ concept:'formal-charge-calc', msg:'A carbon with four bonds and no lone pairs is neutral. Look at the oxygens — they are where the electron count differs between the two.' }
      } },

    { id:'geometry-bent-center', kind:'click-atom', tier:1, topic:'molecular-geometry',
      concepts:['molecular-geometry-vsepr','lewis-structures-drawing'],
      prompt:'Click the atom whose lone pairs are responsible for this molecule being bent.',
      molecule:'water',
      answer:{ role:'nucleophile' },
      why:'Oxygen has four electron groups — two bonds and two lone pairs — so the electron geometry is tetrahedral. You only see the atoms, and with two of the four positions occupied by invisible lone pairs, the shape you observe is bent.',
      diag:{
        h1:{ concept:'molecular-geometry-vsepr', msg:'Hydrogen has one bond and no lone pairs, so it has no shape of its own to contribute. Molecular shape is set by the electron groups on the CENTRAL atom.' },
        h2:{ concept:'molecular-geometry-vsepr', msg:'Shape comes from the central atom’s electron groups. A terminal hydrogen cannot bend anything.' }
      } },

    { id:'geometry-angle-order', kind:'order', tier:2, topic:'molecular-geometry',
      concepts:['molecular-geometry-vsepr'],
      prompt:'Rank these by bond angle, largest first.',
      items:['CH₄ (methane)', 'NH₃ (ammonia)', 'H₂O (water)'],
      answer:[0,1,2],
      why:'All three have four electron groups, so all three start from the tetrahedral 109.5°. Lone pairs spread out more than bonding pairs, so each lone pair squeezes the remaining angles down: methane 109.5°, ammonia about 107°, water about 104.5°.',
      diag:{ any:{ concept:'molecular-geometry-vsepr', msg:'Count lone pairs on the central atom: methane 0, ammonia 1, water 2. A lone pair takes more room than a bond, so every lone pair you add pushes the bond angle down from 109.5°.' } } },

    /* ---- Module 2: electron flow --------------------------------------- */

    { id:'arrow-tail-source', kind:'click-atom', tier:1, topic:'curved-arrows',
      concepts:['curved-arrow-direction'],
      prompt:'Click the atom an arrow tail could legitimately start from.',
      molecule:'acetone',
      answer:{ role:'carbonyl-o' },
      why:'Arrow tails need electrons to move. The carbonyl oxygen has lone pairs, so it can donate; everything else here is either a carbon with four bonds and no lone pairs, or a hydrogen with one.',
      diag:{
        c:{ concept:'curved-arrow-direction', msg:'That carbon already has four bonds and no lone pair, so it has no electrons free to push. It is a place arrows point TO, not from.' },
        ca:{ concept:'curved-arrow-direction', msg:'A carbon with four single bonds has nothing spare to donate. Tails start at lone pairs, pi bonds, or a sigma bond that is breaking.' },
        ha:{ concept:'curved-arrow-direction', msg:'Hydrogen has one bonding pair and no lone pair. A C–H BOND can be an arrow source when it breaks, but the hydrogen atom by itself is not.' }
      } },

    { id:'resonance-draw-acetate', kind:'draw', tier:2, topic:'curved-arrows',
      concepts:['curved-arrow-direction','resonance-delocalization','resonance-validity'],
      prompt:'Draw the two arrows that convert this resonance form of acetate into its equivalent partner.',
      molecule:'acetate-ion',
      drawHint:'Only electrons move in resonance — never atoms. Two arrows: one makes a bond, one breaks one.',
      answer:{ arrows:[ {from:'o2', to:'bond:c-o2'}, {from:'bond:c-o1', to:'o1'} ] },
      why:'The negatively charged oxygen pushes a lone pair up to make a second bond to carbon, and to keep carbon at four bonds the existing C=O pi bond drops onto the other oxygen. The result is the mirror image of what you started with — which is exactly why the two oxygens are equivalent and the charge is really spread over both.',
      diag:{
        'o2>c':{ concept:'curved-arrow-direction', msg:'The lone pair forms a pi BOND to carbon, so point the arrow at the C–O bond, not at the carbon itself. An arrowhead on carbon would mean a fifth sigma bond.' },
        'bond:c-o1>c':{ concept:'curved-arrow-direction', msg:'Backwards. The pi electrons move away from carbon and onto the electronegative oxygen, which can hold the charge.' },
        'o1>bond:c-o1':{ concept:'resonance-validity', msg:'That oxygen is already double-bonded to carbon. Adding another bond there would give carbon five — it is the oxygen with the negative charge that donates.' },
        missing:{ concept:'resonance-validity', msg:'One arrow on its own leaves carbon with five bonds. In resonance the arrows come in balanced pairs: every bond made at a full atom needs a bond broken.' }
      } },

    { id:'electrophile-formaldehyde', kind:'click-atom', tier:1, topic:'electrophiles',
      concepts:['electrophile-recognition','electronegativity-trend'],
      prompt:'Click the electrophilic atom.',
      molecule:'formaldehyde',
      answer:{ role:'electrophile' },
      why:'Oxygen is far more electronegative than carbon and pulls the C=O electrons toward itself, leaving the carbon electron-poor. That δ+ carbon is what every nucleophile in carbonyl chemistry attacks.',
      diag:{
        o:{ concept:'electron-rich-poor', msg:'Oxygen is the atom PULLING electron density, so it is the electron-rich, δ− end. An electrophile is electron-poor — look at the atom oxygen is taking density from.' },
        h1:{ concept:'electrophile-recognition', msg:'A C–H bond is barely polar; hydrogen here is not meaningfully electron-poor. The strongly polarized bond is the one to oxygen.' },
        h2:{ concept:'electrophile-recognition', msg:'Hydrogen on carbon is close enough to nonpolar to ignore. The polarity that matters is across the C=O.' }
      } },

    { id:'electrophile-co2', kind:'click-atom', tier:2, topic:'electrophiles',
      concepts:['electrophile-recognition','bond-polarity-dipoles'],
      prompt:'CO₂ has no net dipole. Click the atom that is nevertheless electrophilic.',
      molecule:'carbon-dioxide',
      answer:{ role:'electrophile' },
      why:'A zero net dipole says the bond dipoles cancel by symmetry — it says nothing about individual atoms. Both oxygens pull density off the same carbon, so that carbon is strongly δ+ and genuinely electrophilic. This is how Grignards add to CO₂ to make carboxylic acids.',
      diag:{
        o1:{ concept:'electron-rich-poor', msg:'That is the end electron density is flowing toward — δ−, electron-rich. Electrophiles are electron-POOR.' },
        o2:{ concept:'electron-rich-poor', msg:'Both oxygens are the δ− ends. The atom they are both pulling from is the electron-poor one.' }
      } },

    { id:'rich-poor-formaldehyde', kind:'click-atom', tier:1, topic:'electron-rich-poor',
      concepts:['electron-rich-poor','electronegativity-trend'],
      prompt:'Click the most electron-RICH atom.',
      molecule:'formaldehyde',
      answer:{ role:'carbonyl-o' },
      why:'Oxygen is the most electronegative atom present, it carries two lone pairs, and it is pulling the C=O electrons toward itself. Every one of those points the same way: this is where the electron density is.',
      diag:{
        c:{ concept:'electron-rich-poor', msg:'That carbon is the opposite — oxygen is pulling density away from it, leaving it δ+. It is the electron-POOR atom here.' },
        h1:{ concept:'electronegativity-trend', msg:'Hydrogen is not electron-rich; it has one electron and no lone pairs. Electron-rich means lone pairs, negative charge, or pi bonds.' },
        h2:{ concept:'electronegativity-trend', msg:'Hydrogen brings a single electron to a single bond. Look for lone pairs.' }
      } },

    { id:'rich-poor-hcn', kind:'click-atom', tier:2, topic:'electron-rich-poor',
      concepts:['electron-rich-poor','nucleophile-recognition'],
      prompt:'Click the atom that makes cyanide a good nucleophile.',
      molecule:'hydrogen-cyanide',
      answer:{ role:'nucleophile' },
      why:'The nitrogen lone pair is the electron source. It sits in an sp orbital held close to the nucleus, which makes cyanide an excellent nucleophile but only a moderate base — a distinction that lets it attack carbon without just deprotonating the substrate.',
      diag:{
        c:{ concept:'nucleophile-recognition', msg:'That carbon has no lone pair of its own in HCN — all four of its electrons are in bonds. The donatable pair is on nitrogen.' },
        h:{ concept:'nucleophile-recognition', msg:'Hydrogen has one electron, spent on its bond. Nucleophilicity comes from an available PAIR.' }
      } },

    /* ---- Module 3: acids and bases ------------------------------------- */

    { id:'bronsted-acidic-h', kind:'click-atom', tier:1, topic:'bronsted',
      concepts:['bronsted-identification','acidity-factors'],
      prompt:'Click the proton a Brønsted base would remove first.',
      molecule:'acetic-acid',
      answer:{ role:'acidic-h' },
      why:'The O–H proton, pKa around 4.76. It leaves easily because what stays behind — a carboxylate — spreads its negative charge over two equivalent oxygens. The alpha C–H is around pKa 20 and does not compete.',
      diag:{
        ha:{ concept:'acidity-factors', msg:'That is an alpha C–H, roughly pKa 20 here — fifteen orders of magnitude less acidic than the O–H. Acidity is about how stable the conjugate base is, and a carbanion is far less stable than a carboxylate.' }
      } },

    { id:'bronsted-conjugate-acid', kind:'click-atom', tier:1, topic:'conjugate',
      concepts:['conjugate-pairs','bronsted-identification'],
      prompt:'This is the conjugate acid of ammonia. Click the hydrogen whose loss gives ammonia back.',
      molecule:'ammonium',
      answer:{ role:'acidic-h' },
      why:'All four N–H hydrogens are equivalent, so losing any one of them regenerates NH₃ — the marked one is simply the one being asked about. A conjugate pair differs by exactly one proton, and that is the entire relationship between NH₄⁺ and NH₃.',
      diag:{
        n:{ concept:'conjugate-pairs', msg:'The nitrogen stays put. Going from a conjugate acid to its conjugate base means losing a PROTON — one hydrogen nucleus — not the central atom.' }
      } },

    { id:'conjugate-strength-order', kind:'order', tier:2, topic:'conjugate',
      concepts:['conjugate-pairs','pka-scale'],
      prompt:'Rank these conjugate bases from strongest to weakest.',
      items:['NH₂⁻ (from NH₃, pKa 38)', 'HO⁻ (from H₂O, pKa 15.7)', 'CH₃CO₂⁻ (from acetic acid, pKa 4.76)', 'Cl⁻ (from HCl, pKa −7)'],
      answer:[0,1,2,3],
      why:'Conjugate base strength runs exactly opposite to acid strength: the weaker the acid, the stronger its conjugate base. NH₃ is the weakest acid of the four (highest pKa), so amide is the strongest base; HCl is the strongest acid, so chloride is a spectator.',
      diag:{ any:{ concept:'conjugate-pairs', msg:'Read the pKa of the CONJUGATE ACID and invert it. Highest pKa acid gives the strongest base. It is a strict inverse — there is no separate base scale to memorize.' } } },

    { id:'pka-strength-order', kind:'order', tier:2, topic:'pka',
      concepts:['pka-scale','acidity-factors'],
      prompt:'Rank these by acid strength, strongest first.',
      items:['HCl (pKa −7)', 'Acetic acid (pKa 4.76)', 'Water (pKa 15.7)', 'Ethane (pKa ~50)'],
      answer:[0,1,2,3],
      why:'pKa is a log scale and it runs backwards: lower pKa means a stronger acid. Each unit is a factor of ten, so acetic acid is not "a bit" stronger than water — it is about eleven orders of magnitude stronger.',
      diag:{ any:{ concept:'pka-scale', msg:'Lower pKa means stronger acid, so this ranking runs from the most negative number upward. The sign catches people out: −7 is a much stronger acid than +4.76.' } } },

    /* ---- Conformations -------------------------------------------------- */

    { id:'newman-back-methyl', kind:'click-atom', tier:1, topic:'conformational-analysis',
      concepts:['newman-reading','torsional-strain'],
      prompt:'Click the group attached to the BACK carbon.',
      molecule:'newman-butane-anti',
      answer:{ role:'back-methyl' },
      why:'In a Newman projection the front carbon is the point where three bonds meet, and the back carbon is the circle. Bonds that start at the circle’s edge belong to the back carbon; bonds that reach the centre belong to the front one.',
      diag:{
        fme:{ concept:'newman-reading', msg:'That methyl’s bond runs all the way to the centre of the circle, which means it is on the FRONT carbon. Back-carbon bonds stop at the circle’s edge.' },
        fh1:{ concept:'newman-reading', msg:'Front carbon — its bond reaches the centre point. The back carbon’s three bonds radiate from the rim.' },
        fc:{ concept:'newman-reading', msg:'That is the front carbon itself, not a group attached to the back one. The back carbon is drawn as the circle.' }
      } },

    { id:'newman-anti-partner', kind:'click-atom', tier:2, topic:'newman',
      concepts:['newman-reading','torsional-strain'],
      prompt:'Click the group that sits 180° from the front methyl.',
      molecule:'newman-butane-anti',
      answer:{ role:'back-methyl' },
      why:'The two methyls are directly opposite — a dihedral angle of 180°, which is what "anti" means. That is butane’s lowest-energy conformation, because the two bulkiest groups are as far from each other as rotation allows.',
      diag:{
        bh1:{ concept:'newman-reading', msg:'That hydrogen is 60° round from the front methyl, not 180°. Read the angle around the circle: directly opposite means straight across.' },
        bh2:{ concept:'newman-reading', msg:'That one is also 60° away. The group 180° from the front methyl points in exactly the opposite direction.' },
        fh1:{ concept:'newman-reading', msg:'That is a front-carbon hydrogen. The dihedral angle is measured between a FRONT group and a BACK group.' }
      } },

    { id:'chair-axial-methyl', kind:'click-atom', tier:1, topic:'cyclohexanes',
      concepts:['chair-axial-equatorial','steric-hindrance'],
      prompt:'Click the methyl group in the axial position.',
      molecule:'chair-dimethylcyclohexane',
      answer:{ role:'axial-substituent' },
      why:'Axial bonds point straight up or straight down, parallel to the ring’s axis. Equatorial bonds splay outward around the ring’s waist. The axial one is the expensive position, because it crowds the two other axial groups on the same face.',
      diag:{
        me5:{ concept:'chair-axial-equatorial', msg:'That methyl points outward, roughly along the ring’s waist — that is equatorial. Axial bonds run vertically, parallel to the axis through the middle of the ring.' },
        hax1:{ concept:'chair-axial-equatorial', msg:'That IS axial, but it is a hydrogen, not a methyl — it is one of the groups the axial methyl is crashing into.' }
      } },

    { id:'chair-diaxial-clash', kind:'click-atom', tier:3, topic:'conformational-analysis',
      concepts:['chair-axial-equatorial','steric-hindrance','ring-flip-mechanics'],
      prompt:'Click the hydrogen that the axial methyl is clashing with.',
      molecule:'chair-dimethylcyclohexane',
      answer:{ role:'syn-axial-h' },
      why:'A 1,3-diaxial interaction: the axial methyl and the axial hydrogens three carbons away on the SAME face point at each other. That crowding is the entire reason bulky groups prefer equatorial, and it is what an A-value measures.',
      diag:{
        hax3:{ concept:'chair-axial-equatorial', msg:'Check which face that one is on. A diaxial clash needs both groups pointing the same way — both up or both down. That hydrogen points down, away from the methyl.' },
        me5:{ concept:'steric-hindrance', msg:'That methyl is equatorial and out of the way. The clash is between the AXIAL methyl and axial hydrogens on the same face.' }
      } },

    /* ---- Stereochemistry ------------------------------------------------ */

    { id:'chirality-find-stereocenter', kind:'click-atom', tier:1, topic:'chirality',
      concepts:['stereocenter-identification','chirality-recognition'],
      prompt:'Click the stereocenter.',
      molecule:'bromochlorofluoromethane',
      answer:{ role:'stereocenter' },
      why:'A stereocenter is a carbon with four DIFFERENT groups. Here they are H, F, Cl and Br — all different, so swapping any two gives a molecule you cannot superimpose on the original.',
      diag:{
        br:{ concept:'stereocenter-identification', msg:'Bromine has only one bond, so there is nothing around it to arrange. A stereocenter needs FOUR different groups on one atom — look at the carbon.' },
        cl:{ concept:'stereocenter-identification', msg:'A terminal atom with a single bond cannot be a stereocenter. The stereocenter is the atom the four different groups are attached TO.' },
        h:{ concept:'stereocenter-identification', msg:'That hydrogen is one of the four groups, not the centre they are arranged around.' }
      } },

    { id:'chirality-why-not', kind:'multi-click', tier:2, topic:'chirality',
      concepts:['stereocenter-identification','chirality-recognition'],
      prompt:'This carbon is NOT a stereocenter. Click the two groups that are the reason.',
      molecule:'propane-2-ol-achiral',
      sub:'It has four groups, an OH, and looks much like butan-2-ol. Something still disqualifies it.',
      answer:{ keys:['c1','c3'] },
      why:'Two of the four groups are identical methyls. Swapping them changes nothing, so the mirror image is superimposable and there is no stereocenter — four groups is not enough, they have to be four DIFFERENT groups.',
      diag:{
        o:{ concept:'stereocenter-identification', msg:'The OH is unique here, so it is not the problem — it is one of the groups that would have counted. Look for two groups that are the same as each other.' },
        h:{ concept:'stereocenter-identification', msg:'The hydrogen is also unique. The disqualifying pair is two groups identical to one another.' },
        c2:{ concept:'stereocenter-identification', msg:'That is the candidate carbon itself, not one of its groups. The question is about what is attached to it.' }
      } },

    { id:'cip-highest-priority', kind:'click-atom', tier:1, topic:'enantiomers',
      concepts:['cip-priority','rs-assignment'],
      prompt:'Click the group with the highest CIP priority.',
      molecule:'bromochlorofluoromethane',
      answer:{ role:'priority-1' },
      why:'CIP priority is decided by atomic number at the first point of difference, and nothing else. Br (35) beats Cl (17) beats F (9) beats H (1). Electronegativity does not come into it — fluorine is the most electronegative here and still ranks third.',
      diag:{
        f:{ concept:'cip-priority', msg:'Fluorine is the most ELECTRONEGATIVE, but CIP ranks by ATOMIC NUMBER. Fluorine is 9; chlorine is 17 and bromine is 35, so both outrank it.' },
        cl:{ concept:'cip-priority', msg:'Chlorine is priority 2. Compare atomic numbers: bromine is 35, chlorine only 17.' },
        h:{ concept:'cip-priority', msg:'Hydrogen is atomic number 1 — the LOWEST priority, and the one you point away from you before reading the rotation.' }
      } },

    { id:'cip-ethyl-vs-methyl', kind:'click-atom', tier:3, topic:'rs-configuration',
      concepts:['cip-priority'],
      prompt:'Both of these are carbon. Click the one with the higher CIP priority.',
      molecule:'butan-2-ol',
      answer:{ role:'more-substituted' },
      why:'They tie at the first atom — both carbon — so you go one step further out and compare what each is attached to. The ethyl carbon has (C, H, H); the methyl has (H, H, H). C beats H at the first point of difference, so ethyl wins.',
      diag:{
        c1:{ concept:'cip-priority', msg:'That is the methyl: its substituent set is (H, H, H). The other carbon carries (C, H, H), and carbon beats hydrogen at the first point of difference.' },
        o:{ concept:'cip-priority', msg:'Oxygen does outrank both of them — but the question is which of the two CARBONS wins. That tie is broken one atom further out.' },
        h:{ concept:'cip-priority', msg:'That hydrogen is the lowest priority of all four. The comparison asked about is between the two carbon substituents.' }
      } },

    { id:'fischer-toward-viewer', kind:'multi-click', tier:1, topic:'fischer',
      concepts:['fischer-reading'],
      prompt:'Click both groups that point TOWARD you.',
      molecule:'fischer-glyceraldehyde',
      sub:'A Fischer projection is a 3D molecule flattened by a strict convention.',
      answer:{ keys:['left','right'] },
      why:'Horizontal bonds come toward the viewer; vertical bonds go away. That convention is the whole reason a single swap of two groups inverts the configuration — you are swapping a front group with a front group across a fixed centre.',
      diag:{
        top:{ concept:'fischer-reading', msg:'Vertical bonds point AWAY from you, behind the page. Only the horizontal ones come forward.' },
        bot:{ concept:'fischer-reading', msg:'That is vertical, so it points away from you. Remember it as a bow tie: the horizontal arms come at you.' },
        c:{ concept:'fischer-reading', msg:'That is the stereocenter at the crossing point, not one of the four groups.' }
      } },

    { id:'fischer-swap-effect', kind:'mcq', tier:2, topic:'fischer',
      concepts:['fischer-reading','enantiomer-vs-diastereomer'],
      prompt:'You swap two groups in a Fischer projection exactly once. What have you produced?',
      options:['The enantiomer', 'The same molecule, redrawn', 'A diastereomer', 'A constitutional isomer'],
      answer:0,
      why:'One swap inverts the stereocenter, giving the mirror image. Two swaps return you to the original. This is why an odd number of swaps means enantiomer and an even number means the same compound — a rule worth more than re-deriving it every time.',
      diag:{
        1:{ concept:'fischer-reading', msg:'That is what an even number of swaps gives you. A single swap genuinely inverts the centre — the safe legal moves are 180° rotation in the plane, or holding one group fixed and rotating the other three.' },
        2:{ concept:'enantiomer-vs-diastereomer', msg:'A diastereomer needs more than one stereocenter, with some inverted and some not. With a single stereocenter inverted, the only possible relationship is enantiomer.' },
        3:{ concept:'fischer-reading', msg:'Nothing about connectivity changed — the same atoms are bonded to the same atoms. Constitutional isomers differ in what is attached to what.' }
      } },

    /* ---- Substitution / elimination, alcohols, ethers -------------------- */

    { id:'e1-zaitsev-h', kind:'click-atom', tier:3, topic:'e1',
      concepts:['zaitsev-hofmann','carbocation-stability'],
      prompt:'The carbocation has formed. Click the hydrogen whose removal gives the Zaitsev product.',
      molecule:'e2-butane',
      answer:{ keys:['hb'] },
      why:'Zaitsev: take the proton that yields the MORE substituted alkene, because more substituted alkenes are more stable. Removing the hydrogen from the carbon that also carries a chain gives a disubstituted alkene; taking one from the terminal methyl gives a monosubstituted one.',
      diag:{
        hc:{ concept:'zaitsev-hofmann', msg:'That gives the less substituted alkene — the Hofmann product. It is the major one only with a bulky base like tert-butoxide, and E1 has no base bulky enough to care.' },
        ha:{ concept:'zaitsev-hofmann', msg:'That hydrogen is on the carbon that HELD the leaving group, not on a neighbouring carbon. Elimination needs a beta hydrogen — one carbon over.' },
        br:{ concept:'carbocation-stability', msg:'Bromide already left; that is what formed the carbocation. This step is about which proton goes next.' }
      } },

    { id:'alcohol-activate-o', kind:'click-atom', tier:1, topic:'alcohol-reactions',
      concepts:['alcohol-activation','leaving-group-ability'],
      prompt:'Click the atom that must be protonated before this alcohol can react.',
      molecule:'isopropanol',
      answer:{ role:'nucleophile' },
      why:'Hydroxide is a terrible leaving group — it is a strong base, conjugate of water at pKa 15.7. Protonate the oxygen first and the group that leaves is neutral water instead, conjugate base of H₃O⁺ at pKa −1.7, which is excellent.',
      diag:{
        c:{ concept:'alcohol-activation', msg:'The carbon is where substitution happens, but it is not what gets protonated. Acid goes to the most basic site — the lone pairs on oxygen.' },
        h:{ concept:'alcohol-activation', msg:'That is a C–H, which acid does nothing with. The basic site is the oxygen with its lone pairs.' }
      } },

    { id:'ether-hi-cleavage', kind:'click-atom', tier:2, topic:'ether-chemistry',
      concepts:['backside-attack','alcohol-activation'],
      prompt:'This ether is refluxed with concentrated HI. Click the carbon iodide attacks.',
      molecule:'methyl-propyl-ether',
      answer:{ role:'less-hindered' },
      why:'The oxygen is protonated first, turning it into a real leaving group, and then iodide runs an SN2. SN2 is decided by crowding at the carbon, and a methyl is the least hindered carbon there is — so the C–O bond to the methyl is the one that breaks.',
      diag:{
        c1:{ concept:'steric-hindrance', msg:'That carbon carries a whole propyl chain. Both are primary, but SN2 is decided by how crowded the backside approach is, and a methyl beats any longer chain.' },
        o:{ concept:'backside-attack', msg:'The oxygen is what gets protonated and then leaves — it is not the atom under nucleophilic attack. Iodide attacks a CARBON.' },
        c2:{ concept:'backside-attack', msg:'That carbon is not attached to the oxygen at all, so breaking a bond there would not cleave the ether.' }
      } },

    { id:'ether-find-oxygen', kind:'click-atom', tier:1, topic:'ether-chemistry',
      concepts:['alcohol-activation','nucleophile-recognition'],
      prompt:'Click the ether oxygen.',
      molecule:'methyl-propyl-ether',
      answer:{ role:'ether-o' },
      why:'An ether is an oxygen with a carbon on each side and no hydrogen of its own. That is what makes ethers so unreactive: no acidic proton, and no leaving group until the oxygen is protonated.',
      diag:{
        cm:{ concept:'nucleophile-recognition', msg:'That is one of the two carbons attached to the oxygen. The ether oxygen is the atom BETWEEN them.' },
        c1:{ concept:'nucleophile-recognition', msg:'That is the other attached carbon. Look for the atom with two carbons on it and lone pairs.' }
      } },

    /* ---- Carbonyl derivatives, amines, spectroscopy ---------------------- */

    { id:'acetal-find-carbon', kind:'click-atom', tier:1, topic:'acetals',
      concepts:['acetal-formation'],
      prompt:'Click the acetal carbon.',
      molecule:'dimethyl-acetal',
      answer:{ role:'acetal-c' },
      why:'The pattern to recognize is one carbon carrying TWO OR groups. That is an acetal — stable to base and to nucleophiles like hydride and Grignards, which is exactly why it works as a protecting group for a ketone.',
      diag:{
        o1:{ concept:'acetal-formation', msg:'That is one of the two oxygens, not the carbon holding them. The acetal carbon is the one both oxygens attach to.' },
        m1:{ concept:'acetal-formation', msg:'That is the methyl on the far side of an oxygen. Look for the single carbon with two oxygens on it.' },
        ca:{ concept:'acetal-formation', msg:'That is one of the original alkyl groups from the ketone. The acetal carbon is the one that used to be the carbonyl carbon — the one now bonded to two oxygens.' }
      } },

    { id:'hemiacetal-oh', kind:'click-atom', tier:2, topic:'acetals',
      concepts:['acetal-formation','tetrahedral-intermediate'],
      prompt:'This is a hemiacetal. Click the oxygen that still has to be replaced to reach a full acetal.',
      molecule:'acetone-hemiacetal',
      answer:{ role:'hydroxyl-o' },
      why:'"Hemi" means half: one OR is installed, the other position is still an OH. A second equivalent of alcohol, under acid, replaces that OH via the oxocarbenium and gives the acetal.',
      diag:{
        o2:{ concept:'acetal-formation', msg:'That one is already an OR — the half that is done. The remaining OH is the half still to be converted.' },
        c:{ concept:'acetal-formation', msg:'That is the hemiacetal carbon itself. The question asks which of its two oxygens is the unfinished one.' }
      } },

    { id:'amine-nucleophilic-n', kind:'click-atom', tier:1, topic:'amine-reactions',
      concepts:['nucleophile-recognition','amine-basicity'],
      prompt:'Click the atom that makes this amine nucleophilic.',
      molecule:'ethylamine',
      answer:{ role:'nucleophile' },
      why:'The nitrogen lone pair. It is freely available here — nothing is pulling it away — which is why simple amines are both good nucleophiles and reasonable bases, and why alkylating them tends to run away to over-alkylation.',
      diag:{
        c1:{ concept:'nucleophile-recognition', msg:'A carbon with four single bonds has no pair to donate. Nucleophilicity comes from an available lone pair or a pi bond.' },
        c2:{ concept:'nucleophile-recognition', msg:'That carbon is fully bonded with nothing spare. Look for the atom drawn with lone-pair dots.' }
      } },

    { id:'amide-unavailable-lonepair', kind:'click-atom', tier:2, topic:'amine-reactions',
      concepts:['amine-basicity','resonance-delocalization'],
      prompt:'Click the lone pair that is NOT available to act as a base.',
      molecule:'acetamide',
      answer:{ role:'conjugated-lone-pair' },
      why:'An amide nitrogen’s lone pair is delocalized into the C=O by resonance, so it is not sitting there waiting to grab a proton. That single fact explains why amides are essentially non-basic, why the C–N bond has partial double-bond character, and why amides are the least reactive acid derivative.',
      diag:{
        o:{ concept:'amine-basicity', msg:'The carbonyl oxygen’s lone pairs are genuinely there — it is weakly basic and does get protonated under strong acid. The lone pair that has been taken out of circulation is on the other heteroatom.' },
        c:{ concept:'amine-basicity', msg:'That carbon has no lone pair at all. The question is about a lone pair that exists but is unavailable.' }
      } },

    { id:'cnmr-methyl-peak', kind:'click-atom', tier:1, topic:'c-nmr',
      concepts:['nmr-shift-shielding'],
      prompt:'Click a carbon responsible for the peak at 21 ppm.',
      molecule:'para-xylene',
      answer:{ role:'methyl' },
      why:'21 ppm is deep in the aliphatic region — an sp³ carbon with nothing electronegative on it. Aromatic ring carbons sit far downfield, around 125–140 ppm, because the ring current and the sp² hybridization both deshield them.',
      diag:{
        c1:{ concept:'nmr-shift-shielding', msg:'That is an aromatic ring carbon. Ring carbons appear around 125–140 ppm, not at 21 — the aliphatic peak has to be one of the methyls.' },
        c2:{ concept:'nmr-shift-shielding', msg:'Aromatic CH carbons show up near 128 ppm. 21 ppm is a shielded sp³ carbon with no electronegative neighbours.' },
        c4:{ concept:'nmr-shift-shielding', msg:'Also a ring carbon, far downfield. Look for the saturated carbons.' }
      } },

    { id:'cnmr-symmetry-count', kind:'mcq', tier:3, topic:'c-nmr',
      concepts:['nmr-shift-shielding','nmr-splitting-integration'],
      prompt:'para-Xylene has eight carbons. How many ¹³C signals does it show?',
      options:['3', '8', '4', '6'],
      answer:0,
      molecule:'para-xylene',
      why:'Symmetry collapses them. The two methyls are equivalent (one signal), the two substituted ring carbons are equivalent (one signal), and all four aromatic CH carbons are equivalent (one signal). Three environments, three peaks.',
      diag:{
        1:{ concept:'nmr-shift-shielding', msg:'That would be true only if every carbon sat in a different environment. Carbons related by the molecule’s symmetry are chemically identical and share a single signal — counting atoms is not counting peaks.' },
        2:{ concept:'nmr-shift-shielding', msg:'Close, but check the four aromatic CH carbons: in the para pattern all four are equivalent, so they give one peak rather than two.' },
        3:{ concept:'nmr-shift-shielding', msg:'You are counting some equivalent carbons separately. Look for the mirror planes — para substitution makes both halves of the ring identical.' }
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

  /* ---- Second pass: depth for the topics that only had one -------------
     28 of the 62 topics carried a single interactive question, and only 9
     of the original 123 were tier 4, so the adaptive engine had almost
     nothing to reach for outside substitution and elimination and fell
     back on the legacy prose bank. These fill the thinnest topics and
     weight toward tiers 3 and 4 — the questions that ask the student to
     combine two ideas rather than recognise one.

     Every wrong answer here is diagnosed, same contract as above: a miss
     names the misconception it reveals, not just the topic it sat in. */

  // ---- Foundations ----------------------------------------------------

  { id:'fc-nitrogen-charge', kind:'mcq', tier:3, topic:'formal-charge', concepts:['formal-charge-calc','valence-electrons'],
    prompt:'A nitrogen atom has four single bonds and no lone pairs. What is its formal charge?',
    options:['+1','0','−1','+2'],
    answer:0,
    why:'Formal charge is valence electrons minus (lone-pair electrons + half the bonding electrons): 5 − (0 + 4) = +1. Four bonds on nitrogen always means +1, which is why ammonium is a cation.',
    diag:{
      1:{ concept:'formal-charge-calc', msg:'Neutral nitrogen wants three bonds and one lone pair. Four bonds and no lone pair means it is one electron short of its five valence electrons, so it carries a charge.' },
      2:{ concept:'formal-charge-calc', msg:'Check the sign. Extra BONDS on nitrogen make it positive; an extra lone pair with only two bonds would make it negative.' },
      3:{ concept:'valence-electrons', msg:'Nitrogen has five valence electrons, not six. Run the arithmetic: 5 − (0 lone-pair electrons + 4 half-bonds) = +1.' }
    } },

  { id:'fc-click-charged-atom', kind:'click-atom', tier:2, topic:'formal-charge', concepts:['formal-charge-calc'],
    prompt:'In the resonance form drawn here, click the atom carrying the formal negative charge.',
    molecule:'acetate-ion',
    sub:'Count bonds and lone pairs on each oxygen. The two oxygens are equivalent overall — but in any single drawn form, only one of them holds the charge.',
    answer:{ keys:['o2'] },
    why:'In this form that oxygen has one single bond and three lone pairs: 6 − (6 + 1) = −1. The doubly bonded oxygen has two bonds and two lone pairs, which comes out neutral. Draw the other resonance form and the two swap roles, which is exactly what "the charge is shared" means.',
    diag:{
      o1:{ concept:'formal-charge-calc', msg:'That oxygen is double bonded: 6 − (4 lone-pair electrons + 2 half-bonds) = 0. Neutral. Look for the singly bonded one.' },
      c:{ concept:'formal-charge-calc', msg:'That carbon has four bonds and no lone pairs: 4 − (0 + 4) = 0. Carbon with four bonds is always neutral.' },
      ca:{ concept:'formal-charge-calc', msg:'An ordinary CH₃ carbon — four bonds, no charge. The charge in a carboxylate is on oxygen.' }
    } },

  { id:'hybrid-order-sbond', kind:'order', tier:3, topic:'hybridization', concepts:['hybridization-assignment','alkyne-acidity'],
    prompt:'Rank these carbons by s character in their hybrid orbitals, highest first.',
    items:['sp carbon in an alkyne','sp² carbon in an alkene','sp³ carbon in an alkane'],
    answer:[0,1,2],
    why:'sp is 50% s, sp² is 33%, sp³ is 25%. More s character holds electrons closer to the nucleus, which is why an alkyne C–H (pKa 25) is so much more acidic than an alkane C–H (pKa 50).',
    diag:{ any:{ concept:'hybridization-assignment', msg:'Count the orbitals being mixed: sp uses one s and one p (so s is half of it), sp² one s and two p, sp³ one s and three p. Fewer p orbitals in the mix means more s character.' } } },

  { id:'hybrid-amide-nitrogen', kind:'mcq', tier:4, topic:'hybridization', concepts:['hybridization-assignment','resonance-delocalization'],
    prompt:'An amide nitrogen has three sigma bonds and a lone pair. Why is it sp² rather than sp³?',
    options:[
      'Because the lone pair is delocalized into the carbonyl, and it has to sit in a p orbital to overlap with the pi system',
      'Because nitrogen can never be sp³',
      'Because it has only three sigma bonds',
      'Because the amide is aromatic'
    ],
    answer:0,
    why:'Counting electron groups alone would predict sp³. But that lone pair is conjugated into the C=O, and conjugation requires a p orbital parallel to the pi system — so the nitrogen flattens to sp² to allow the overlap. This is also why amides are planar and barely basic.',
    diag:{
      1:{ concept:'hybridization-assignment', msg:'Nitrogen is sp³ in ordinary amines — ammonia and ethylamine both are. What is different here is that the lone pair has somewhere better to be.' },
      2:{ concept:'hybridization-assignment', msg:'Three sigma bonds plus a lone pair is four electron groups, which is exactly the count that predicts sp³. The naive count is wrong here, and resonance is why.' },
      3:{ concept:'huckel-aromaticity', msg:'An amide is conjugated, not aromatic — there is no ring and no 4n+2 count. Conjugation alone is enough to demand a p orbital.' }
    } },

  { id:'orbital-node-count', kind:'mcq', tier:3, topic:'orbitals', concepts:['hybridization-assignment'],
    prompt:'How many nodal planes pass through the nucleus in a single 2p orbital?',
    options:['One','Zero','Two','Three'],
    answer:0,
    why:'A p orbital has two lobes with opposite phase, separated by one nodal plane through the nucleus. That node is why the two lobes can overlap constructively with a neighbour to make a pi bond, or destructively to make an antibonding one.',
    diag:{
      1:{ concept:'hybridization-assignment', msg:'Zero nodal planes through the nucleus describes an s orbital, which is spherical and has no phase change. A p orbital has two lobes, so something separates them.' },
      2:{ concept:'hybridization-assignment', msg:'Two nodal planes through the nucleus is a d orbital. A p orbital has a single pair of lobes along one axis.' },
      3:{ concept:'hybridization-assignment', msg:'Count the lobes: two, along one axis. Two lobes of opposite phase need exactly one plane between them.' }
    } },

  { id:'bondpol-click-partial-neg', kind:'click-atom', tier:2, topic:'bond-polarity', concepts:['bond-polarity-dipoles','electronegativity-trend'],
    prompt:'Click the atom at the δ− end of the most polar bond.', molecule:'acetaldehyde',
    sub:'Compare the electronegativity difference across each bond.',
    answer:{ role:'carbonyl-o' },
    why:'C=O is the most polar bond here: oxygen is far more electronegative than carbon, so the pi electrons sit closer to oxygen and it carries the δ−. Every C–H bond in the molecule is much less polar than that.',
    diag:{
      c:{ concept:'bond-polarity-dipoles', msg:'That is the δ+ end, not δ−. Oxygen pulls density away from this carbon, which is exactly what makes it electrophilic.' },
      ca:{ concept:'electronegativity-trend', msg:'An ordinary alkyl carbon with only hydrogens on it. C–H bonds are barely polar — the electronegativity difference is small.' }
    } },

  { id:'electroneg-order-mixed', kind:'order', tier:3, topic:'electronegativity', concepts:['electronegativity-trend'],
    prompt:'Rank by electronegativity, highest first.',
    items:['O','N','C','Li'],
    answer:[0,1,2,3],
    why:'Electronegativity rises left to right across a period: Li < C < N < O. This single ordering is behind bond polarity, acidity trends, and which atom in a bond ends up δ−.',
    diag:{ any:{ concept:'electronegativity-trend', msg:'Read across the period left to right — electronegativity increases in that direction, and all four of these are in the second row. Lithium is at the far left and is the least electronegative by a wide margin.' } } },

  // ---- Acids and bases ------------------------------------------------

  { id:'pka-order-mixed-acids', kind:'order', tier:3, topic:'pka', concepts:['pka-scale','acidity-factors'],
    prompt:'Rank these by acidity, strongest acid first.',
    items:['CH₃COOH (pKa 4.8)','CH₃OH (pKa 16)','HC≡CH (pKa 25)','CH₃CH₃ (pKa 50)'],
    answer:[0,1,2,3],
    why:'Lower pKa is the stronger acid, and these span 45 units — a factor of 10⁴⁵. The order tracks how well each conjugate base holds the charge: resonance-stabilized carboxylate, then alkoxide on electronegative oxygen, then an sp carbanion, then an sp³ carbanion with nothing helping it at all.',
    diag:{ any:{ concept:'pka-scale', msg:'Lower pKa means stronger acid — the negative sign in pKa = −log(Ka) flips the direction. Put the smallest number first.' } } },

  { id:'pka-equilibrium-side', kind:'mcq', tier:4, topic:'pka', concepts:['pka-scale','conjugate-pairs'],
    prompt:'Ethoxide (conjugate acid pKa 16) is mixed with a terminal alkyne (pKa 25). Where does the equilibrium sit?',
    options:[
      'On the left — the alkyne is the weaker acid, so ethoxide cannot deprotonate it to any useful extent',
      'On the right — ethoxide is a strong base, so it deprotonates anything',
      'Exactly balanced, since both are weak acids',
      'On the right, because alkynes are unusually acidic'
    ],
    answer:0,
    why:'Compare the two acids: ethanol at 16 and the alkyne at 25. The equilibrium favours the side with the WEAKER acid — the higher pKa — which is the alkyne side, the reactants. To deprotonate a terminal alkyne you need a base whose conjugate acid is weaker still, which is why NaNH₂ (ammonia, pKa 38) is the reagent people actually use.',
    diag:{
      1:{ concept:'pka-scale', msg:'"Strong base" is not absolute — it is relative to what you are trying to deprotonate. Ethoxide is strong next to water and far too weak next to an alkyne, nine pKa units away.' },
      2:{ concept:'conjugate-pairs', msg:'A nine-unit pKa gap is a factor of 10⁹, which is not close to balanced. Equal amounts would need comparable pKa values.' },
      3:{ concept:'alkyne-acidity', msg:'An alkyne C–H is remarkably acidic for a C–H — 25 versus 50 for an alkane — but that is still far less acidic than an alcohol at 16. Unusual for carbon is not the same as strong.' }
    } },

  { id:'bronsted-click-basic-site', kind:'click-atom', tier:3, topic:'bronsted', concepts:['bronsted-identification','amine-basicity'],
    prompt:'Click the atom that gets protonated first when acid is added.', molecule:'ethylamine',
    sub:'Which atom here is most willing to share a lone pair with H⁺?',
    answer:{ role:'nucleophile' },
    why:'The nitrogen lone pair is available and nitrogen is less electronegative than oxygen, so it holds its lone pair loosely — amines are the most basic neutral group in ordinary organic chemistry.',
    diag:{
      c1:{ concept:'bronsted-identification', msg:'Carbon has no lone pair to offer a proton. A Brønsted base needs an available electron pair.' },
      c2:{ concept:'bronsted-identification', msg:'An ordinary alkyl carbon — nothing available to bond to H⁺. Look for lone pairs.' }
    } },

  { id:'lewis-acid-identify', kind:'mcq', tier:3, topic:'lewis-acids', concepts:['lewis-acid-base','electrophile-recognition'],
    prompt:'Why is BF₃ a Lewis acid but not a Brønsted acid?',
    options:[
      'It accepts an electron pair into an empty p orbital, but it has no proton to donate',
      'It donates an electron pair rather than accepting one',
      'It is a Brønsted acid as well, since fluorine is electronegative',
      'It only acts as an acid in water'
    ],
    answer:0,
    why:'Boron in BF₃ has only six valence electrons and an empty p orbital, so it accepts a pair — the Lewis definition. There is no hydrogen on it at all, so it cannot donate a proton and the Brønsted definition simply does not apply.',
    diag:{
      1:{ concept:'lewis-acid-base', msg:'That describes a Lewis BASE. BF₃ is electron-poor at boron, which is why it accepts.' },
      2:{ concept:'bronsted-identification', msg:'Electronegative fluorines make boron more electron-poor, which strengthens it as a Lewis acid. A Brønsted acid needs a hydrogen to give away, and BF₃ has none.' },
      3:{ concept:'lewis-acid-base', msg:'Water is not required. BF₃ accepts an electron pair from whatever donor is present — an ether, an amine, an alkene — and is most often used in non-aqueous solvent precisely because water would quench it.' }
    } },

  // ---- Conformations --------------------------------------------------

  { id:'axeq-click-axial', kind:'click-atom', tier:2, topic:'axial-equatorial', concepts:['chair-axial-equatorial'],
    prompt:'Click the bromine and confirm whether it is axial.', molecule:'chair-bromocyclohexane',
    sub:'An axial bond runs parallel to the ring axis — straight up or straight down.',
    answer:{ keys:['br'] },
    why:'Bromine here is axial: its bond points straight up, parallel to the ring axis, rather than out around the ring equator. Axial substituents on a ring suffer 1,3-diaxial strain, which is why a large group prefers to flip to equatorial.',
    diag:{ any:{ concept:'chair-axial-equatorial', msg:'Axial bonds alternate up, down, up, down around the ring and run parallel to the axis through its middle. Equatorial bonds splay outward at a shallow angle. Look for the one drawn vertically.' } } },

  { id:'ringflip-what-changes', kind:'mcq', tier:4, topic:'ring-flips', concepts:['ring-flip-mechanics','chair-axial-equatorial'],
    prompt:'A ring flip converts a chair into the other chair. What does it change, and what does it not?',
    options:[
      'Every axial group becomes equatorial and vice versa, but up stays up and down stays down',
      'Every group swaps between up and down, but axial stays axial',
      'Both the axial/equatorial assignment and the up/down assignment invert',
      'Nothing changes except the energy'
    ],
    answer:0,
    why:'A flip inverts axial and equatorial for every position, while leaving each substituent on the same face of the ring — a group pointing up is still pointing up afterwards. That is why a ring flip cannot convert cis into trans: it is a conformational change, not a stereochemical one.',
    diag:{
      1:{ concept:'ring-flip-mechanics', msg:'Backwards. The axial/equatorial assignment is what inverts; which face a group sits on is fixed by the bonds and cannot change without breaking one.' },
      2:{ concept:'ring-flip-mechanics', msg:'If up/down inverted too, a ring flip would turn cis-1,2-dimethylcyclohexane into the trans isomer — a different compound. Conformational changes cannot do that.' },
      3:{ concept:'ring-flip-mechanics', msg:'The energy usually does change, because bulky groups prefer equatorial — but only because the axial/equatorial assignments swapped. Something has to change for the energy to.' }
    } },

  { id:'cyclohexane-strain-source', kind:'mcq', tier:3, topic:'cyclohexanes', concepts:['torsional-strain','chair-axial-equatorial'],
    prompt:'Why is the chair conformation of cyclohexane essentially strain-free?',
    options:[
      'Its bond angles are near 109.5° and every C–H is staggered with its neighbours',
      'Because the ring is planar, so all the angles are equal',
      'Because the ring is small enough that strain does not apply',
      'Because all twelve hydrogens are equatorial'
    ],
    answer:0,
    why:'The chair achieves both things at once: angles close to the tetrahedral ideal, so no angle strain, and fully staggered bonds all the way round, so no torsional strain. A planar hexagon would force 120° angles and eclipse every C–H pair.',
    diag:{
      1:{ concept:'torsional-strain', msg:'The chair is deliberately NOT planar. A flat ring would have 120° angles and every neighbouring C–H eclipsed — that is the high-energy arrangement the pucker avoids.' },
      2:{ concept:'torsional-strain', msg:'Ring size matters a great deal: cyclopropane and cyclobutane are badly strained. Six carbons is special because it can pucker into a shape with no strain at all.' },
      3:{ concept:'chair-axial-equatorial', msg:'Six are axial and six equatorial, alternating around the ring. That is a feature of the chair, but it is not why it is strain-free.' }
    } },

  // ---- Stereochemistry ------------------------------------------------

  { id:'stereocenter-count-tartaric', kind:'mcq', tier:3, topic:'stereocenters', concepts:['stereocenter-identification','meso-detection'],
    prompt:'Tartaric acid has two stereocenters. How many distinct stereoisomers actually exist?',
    options:['Three','Four','Two','Eight'],
    answer:0,
    why:'2ⁿ gives four as a maximum, but two of those four are the same compound: the (R,S) and (S,R) forms are superimposable because of the internal mirror plane. So there are three — (R,R), (S,S), and the single meso form.',
    diag:{
      1:{ concept:'meso-detection', msg:'2ⁿ = 4 is the ceiling, not a guarantee. Check for an internal mirror plane — tartaric acid has one, which collapses two of the four into a single meso compound.' },
      2:{ concept:'stereocenter-identification', msg:'Two is too few. (R,R) and (S,S) are a genuine enantiomeric pair, and the meso form is a third, distinct compound that is not identical to either.' },
      3:{ concept:'stereocenter-identification', msg:'2ⁿ with n = 2 gives 4, not 8. Then check whether symmetry reduces it further.' }
    } },

  { id:'stereocenter-click-tartaric', kind:'multi-click', tier:3, topic:'stereocenters', concepts:['stereocenter-identification'],
    prompt:'Click every stereocenter.', molecule:'meso-tartaric-acid',
    sub:'A stereocenter is a carbon with four different groups on it. Click all that qualify.',
    answer:{ keys:['c1','c2'] },
    why:'Both middle carbons carry an OH, an H, a CO₂H and the rest of the chain — four different groups each. The two CO₂H carbons are not stereocenters: each has a double bond and only three attached groups.',
    diag:{
      a1:{ concept:'stereocenter-identification', msg:'A carboxyl carbon cannot be a stereocenter — it is sp² with only three groups attached, and one of them is doubled. A stereocenter needs four different groups on one sp³ carbon.' },
      a2:{ concept:'stereocenter-identification', msg:'Same on this end: sp², three groups, no possibility of handedness.' },
      o1:{ concept:'stereocenter-identification', msg:'Stereocenters are carbons in this course. Oxygen with two bonds and two lone pairs has no four different groups to arrange.' }
    } },

  { id:'enantiomer-property-diff', kind:'mcq', tier:4, topic:'enantiomers', concepts:['enantiomer-vs-diastereomer','chirality-recognition'],
    prompt:'Two enantiomers are placed in separate flasks. Which measurement distinguishes them?',
    options:[
      'The direction they rotate plane-polarized light',
      'Their melting points',
      'Their ¹H NMR spectra in ordinary solvent',
      'Their boiling points'
    ],
    answer:0,
    why:'Enantiomers are identical in every scalar physical property — same melting point, same boiling point, same NMR in an achiral solvent — because those depend on energies, and mirror images have identical energies. Only a chiral probe tells them apart, and plane-polarized light is the classic one: equal magnitude of rotation, opposite sign.',
    diag:{
      1:{ concept:'enantiomer-vs-diastereomer', msg:'Identical, to as many decimal places as you can measure. Different melting points are how you distinguish DIASTEREOMERS, which are genuinely different compounds.' },
      2:{ concept:'enantiomer-vs-diastereomer', msg:'Identical in an ordinary achiral solvent — every corresponding nucleus is in a mirror-image environment, and NMR cannot see handedness. A chiral shift reagent changes that, which is exactly why one is needed.' },
      3:{ concept:'enantiomer-vs-diastereomer', msg:'Also identical. Every property that does not itself have a handedness comes out the same for a pair of mirror images.' }
    } },

  { id:'diastereomer-vs-enantiomer-call', kind:'mcq', tier:4, topic:'diastereomers', concepts:['enantiomer-vs-diastereomer'],
    prompt:'Two compounds have the same connectivity and two stereocenters each. They differ at exactly one stereocenter. What are they?',
    options:[
      'Diastereomers — inverting only some stereocenters cannot give a mirror image',
      'Enantiomers, since they differ in stereochemistry',
      'The same compound',
      'Constitutional isomers'
    ],
    answer:0,
    why:'Enantiomers must be mirror images, which requires EVERY stereocenter to invert. Change one of two and you get a stereoisomer that is not a mirror image — a diastereomer, with genuinely different physical properties.',
    diag:{
      1:{ concept:'enantiomer-vs-diastereomer', msg:'Differing in stereochemistry is necessary but not sufficient. Enantiomers need all stereocenters inverted; here only one is.' },
      2:{ concept:'enantiomer-vs-diastereomer', msg:'Inverting a stereocenter gives a different compound, not the same one. Two swaps at the same centre would return the original — one does not.' },
      3:{ concept:'enantiomer-vs-diastereomer', msg:'Constitutional isomers differ in which atoms are bonded to which. The premise here fixes the connectivity as identical, so the difference has to be spatial.' }
    } },

  { id:'meso-optical-activity', kind:'mcq', tier:3, topic:'meso', concepts:['meso-detection','chirality-recognition'],
    prompt:'A meso compound has two stereocenters. Is it optically active?',
    options:[
      'No — the internal mirror plane makes the whole molecule achiral',
      'Yes — any molecule with a stereocenter is optically active',
      'Yes, but only half as much as a single enantiomer',
      'Only in a chiral solvent'
    ],
    answer:0,
    why:'Optical activity requires the molecule as a whole to be chiral, and a meso compound is not: one half is the mirror image of the other, so the molecule is superimposable on its own reflection. The two centres rotate light in opposite senses and cancel internally.',
    diag:{
      1:{ concept:'meso-detection', msg:'Having a stereocenter is not enough — the whole molecule has to be chiral. Meso compounds are the standard counterexample, which is the entire reason the term exists.' },
      2:{ concept:'meso-detection', msg:'The cancellation is exact, not partial: the two halves are perfect mirror images, so the rotations are equal and opposite and sum to zero.' },
      3:{ concept:'chirality-recognition', msg:'A chiral solvent can distinguish enantiomers, but a meso compound has no handedness to detect in the first place — it is its own mirror image.' }
    } },

  // ---- Elimination ----------------------------------------------------

  { id:'e1-rate-dependence', kind:'mcq', tier:3, topic:'e1', concepts:['rate-law-kinetics','carbocation-stability'],
    prompt:'Doubling the concentration of base in an E1 reaction has what effect on the rate?',
    options:[
      'Essentially none — the slow step is ionization, which does not involve the base',
      'It doubles the rate',
      'It quadruples the rate',
      'It halves the rate'
    ],
    answer:0,
    why:'E1 is two steps and the first — losing the leaving group to form a carbocation — is rate determining. The base only appears in the fast second step, so it does not show up in the rate law. That first-order behaviour is exactly how E1 is distinguished from E2 experimentally.',
    diag:{
      1:{ concept:'rate-law-kinetics', msg:'That is E2, which is bimolecular: base and substrate come together in one concerted step, so both appear in the rate law. E1 breaks the bond first, on its own.' },
      2:{ concept:'rate-law-kinetics', msg:'Quadrupling would need second order in base alone, which no common mechanism gives.' },
      3:{ concept:'rate-law-kinetics', msg:'Adding more of a reagent does not slow a reaction down. The point here is that the base is absent from the slow step entirely.' }
    } },

  { id:'e1-vs-e2-substrate', kind:'mechanism', tier:4, topic:'e1', concepts:['mechanism-selection','substrate-class','basicity-vs-nucleophilicity'],
    prompt:'Which mechanism dominates?', reaction:'(CH₃)₃C–Br,  heated in  CH₃CH₂OH  (no added base)',
    options:['E1','E2','SN2','No reaction'],
    answer:0,
    why:'Tertiary substrate, so ionization is easy; no strong base present, so the concerted E2 pathway has nothing to remove the proton in the same step; heat favours elimination over substitution. Ethanol is a weak nucleophile and a weak base — a solvent, not a reagent — so this ionizes first and then loses a proton: E1, alongside some SN1.',
    diag:{
      1:{ concept:'basicity-vs-nucleophilicity', msg:'E2 needs a strong base present to pull the proton off in the same step as the C–Br bond breaks. Ethanol is not one — it is the solvent, and a very weak base.' },
      2:{ concept:'substrate-class', msg:'A tertiary carbon has no accessible backside: three methyl groups sit across the trajectory, so SN2 is essentially impossible regardless of nucleophile.' },
      3:{ concept:'carbocation-stability', msg:'Something definitely happens — a tertiary carbocation is stable enough to form on heating in a polar protic solvent. That is the whole basis of SN1 and E1.' }
    } },

  // ---- Alkenes and alkynes --------------------------------------------

  { id:'alkene-cistrans-stability', kind:'mcq', tier:3, topic:'alkene-structure', concepts:['alkene-pi-nucleophile','steric-hindrance'],
    prompt:'Why is trans-2-butene more stable than cis-2-butene?',
    options:[
      'The two methyl groups are on opposite sides, so they do not crowd each other',
      'The trans isomer has a stronger pi bond',
      'The trans isomer is conjugated',
      'The cis isomer is not a real compound'
    ],
    answer:0,
    why:'Both have the same bonds and the same substitution pattern, so the difference is purely steric: cis puts both methyls on the same face, close enough to strain against each other. Trans separates them, and is lower in energy by about 1 kcal/mol.',
    diag:{
      1:{ concept:'alkene-pi-nucleophile', msg:'The pi bond is the same in both — same orbitals, same overlap. What differs is how close the substituents are forced to sit.' },
      2:{ concept:'resonance-delocalization', msg:'Neither is conjugated: there is only one pi bond and no adjacent p orbital to conjugate with.' },
      3:{ concept:'alkene-pi-nucleophile', msg:'Both are perfectly real, isolable compounds. Rotation about a double bond is blocked, which is exactly why they do not interconvert at room temperature.' }
    } },

  { id:'alkyne-terminal-vs-internal', kind:'mcq', tier:3, topic:'alkynes', concepts:['alkyne-acidity','hybridization-assignment'],
    prompt:'Why can a terminal alkyne be deprotonated by NaNH₂ while an internal alkyne cannot?',
    options:[
      'Only a terminal alkyne has a hydrogen on an sp carbon',
      'Internal alkynes have no acidic hydrogens anywhere',
      'Internal alkynes are less conjugated',
      'NaNH₂ is too weak a base for either'
    ],
    answer:0,
    why:'The acidity comes from the orbital holding the resulting anion: an sp orbital, 50% s character, holds the charge close to the nucleus. Only a terminal alkyne has an H attached directly to an sp carbon — an internal alkyne has alkyl groups on both ends, and their sp³ C–H bonds sit around pKa 50.',
    diag:{
      1:{ concept:'alkyne-acidity', msg:'Internal alkynes do have hydrogens — on the alkyl groups at each end. They are just sp³ C–H bonds at about pKa 50, far beyond what amide can take.' },
      2:{ concept:'alkyne-acidity', msg:'Conjugation is not what is doing the work. The acidity is about hybridization: s character in the orbital holding the lone pair.' },
      3:{ concept:'pka-scale', msg:'Amide is plenty strong for a terminal alkyne — ammonia is pKa 38 against the alkyne\'s 25, a thirteen-unit gap in the right direction. It is the internal case that has no suitable proton.' }
    } },

  { id:'addition-electrophile-first', kind:'mcq', tier:3, topic:'addition-reactions', concepts:['alkene-pi-nucleophile','curved-arrow-direction'],
    prompt:'In the addition of HBr to an alkene, which bond forms first?',
    options:[
      'C–H, because the pi electrons attack the proton',
      'C–Br, because bromine is the electrophile',
      'Both at the same time, in one concerted step',
      'Neither — the alkene loses a proton first'
    ],
    answer:0,
    why:'The alkene is the nucleophile: its pi electrons reach out and attack the electrophilic proton of H–Br, forming a C–H bond and leaving a carbocation on the other carbon. Bromide then adds to that cation in a second step, which is why the two groups can end up anti or syn and why rearrangement is possible in between.',
    diag:{
      1:{ concept:'electrophile-recognition', msg:'Bromine ends up as bromide, the leaving group — it is the electron-rich end of H–Br, not the electrophile. The proton is the electrophilic part.' },
      2:{ concept:'carbocation-stability', msg:'If it were concerted there would be no carbocation, and then Markovnikov selectivity and carbocation rearrangements would have no explanation. The stepwise cation is what accounts for both.' },
      3:{ concept:'alkene-pi-nucleophile', msg:'An alkene has no acidic proton to lose and is electron-rich, not electron-poor. It attacks; it does not get deprotonated.' }
    } },

  // ---- Alcohols, ethers, epoxides -------------------------------------

  { id:'alcohol-activation-why', kind:'mcq', tier:3, topic:'alcohol-reactions', concepts:['alcohol-activation','leaving-group-ability'],
    prompt:'Why must an alcohol be activated before it will undergo substitution?',
    options:[
      'Hydroxide is far too strong a base to leave on its own',
      'Because alcohols are not nucleophilic',
      'Because the C–O bond is too short',
      'Because oxygen has lone pairs'
    ],
    answer:0,
    why:'Leaving-group ability tracks weak basicity, and hydroxide (conjugate acid pKa 16) is a strong base — it will not walk away with the electron pair. Protonating the oxygen first turns the leaving group into water (conjugate acid pKa −1.7), which leaves readily. Converting the OH to a tosylate accomplishes the same thing.',
    diag:{
      1:{ concept:'nucleophile-recognition', msg:'Alcohols are perfectly good nucleophiles through their oxygen lone pairs. The problem is the other role — the OH is a terrible leaving group.' },
      2:{ concept:'leaving-group-ability', msg:'Bond length is not the issue. What matters is how stable the departing group is once it holds the electron pair, and hydroxide is not stable enough to want to.' },
      3:{ concept:'leaving-group-ability', msg:'Those lone pairs are what make the oxygen protonatable, which is the fix rather than the problem.' }
    } },

  { id:'epoxide-regio-two-ways', kind:'mcq', tier:4, topic:'epoxides', concepts:['epoxide-opening-regiochem','carbocation-stability','backside-attack'],
    prompt:'An unsymmetrical epoxide opens at the MORE substituted carbon under acid and the LESS substituted carbon under base. Why the switch?',
    options:[
      'Acid protonates the oxygen first, so the ring opens with cation-like character at the carbon best able to hold charge; base has no such help, so sterics decide',
      'Acid and base attack different atoms of the epoxide',
      'The epoxide rearranges before opening under acid',
      'Base opens it at the oxygen instead of a carbon'
    ],
    answer:0,
    why:'Two different rate-limiting situations. Protonation makes the C–O bonds much easier to break, so the transition state develops positive charge on carbon and the more substituted carbon stabilizes it better. Without protonation the nucleophile has to force the strained ring open itself, and then the only thing that matters is which carbon it can reach — the less hindered one.',
    diag:{
      1:{ concept:'epoxide-opening-regiochem', msg:'Both attack a carbon. What changes is which carbon, and why — charge stabilization under acid, steric access under base.' },
      2:{ concept:'carbocation-rearrangement', msg:'No rearrangement is needed. The regiochemistry follows from where positive charge builds up in the transition state, and a full free carbocation never forms.' },
      3:{ concept:'epoxide-opening-regiochem', msg:'Attacking the oxygen would not open the ring — the ring opens by breaking a C–O bond, so the nucleophile has to arrive at a carbon.' }
    } },

  // ---- Carbonyl and derivatives ---------------------------------------

  { id:'esters-amides-why-amide-slow', kind:'mcq', tier:4, topic:'esters-amides', concepts:['acyl-reactivity-order','resonance-delocalization'],
    prompt:'An amide is much less reactive than an ester toward nucleophilic acyl substitution. Give both reasons.',
    options:[
      'Nitrogen donates into the carbonyl more strongly, so the carbon is less electrophilic — and NR₂⁻ is a far worse leaving group than RO⁻',
      'Amides are larger, so nucleophiles cannot reach the carbonyl',
      'Amides have no carbonyl carbon to attack',
      'Nitrogen is more electronegative than oxygen, so it withdraws more strongly'
    ],
    answer:0,
    why:'Both halves of the mechanism point the same way. Nitrogen is the better lone-pair donor, so resonance donation leaves the amide carbonyl less electron-poor and harder to attack; and once the tetrahedral intermediate forms, it has to expel an amide anion, which is a very strong base and will not leave. Being worse at both steps is why amides sit at the bottom of the ladder.',
    diag:{
      1:{ concept:'acyl-reactivity-order', msg:'Size is not the axis — the reactivity order holds across derivatives of wildly different bulk. It is electronic: donation into the carbonyl, and leaving-group ability.' },
      2:{ concept:'carbonyl-electrophilicity', msg:'An amide certainly has a carbonyl carbon; it is simply less electrophilic than an ester\'s because nitrogen feeds electron density into it.' },
      3:{ concept:'electronegativity-trend', msg:'Nitrogen is LESS electronegative than oxygen, which is exactly why it is the better donor. Being a better donor is what deactivates the carbonyl here.' }
    } },

  { id:'aldol-which-carbon-attacks', kind:'mcq', tier:4, topic:'aldol', concepts:['aldol-connectivity','enolate-formation','resonance-delocalization'],
    prompt:'An enolate carries most of its negative charge on oxygen, yet it attacks through carbon. Why?',
    options:[
      'Carbon is the softer, more polarizable site and forms the stronger bond to the carbonyl carbon — the reaction at carbon is the productive, irreversible one',
      'Oxygen has no lone pairs left to attack with',
      'The charge is actually entirely on carbon',
      'Oxygen is too electronegative to have any nucleophilic character'
    ],
    answer:0,
    why:'Both sites are nucleophilic and oxygen usually reacts first — but attack through oxygen gives a weak, readily reversed C–O linkage, while attack through carbon forms a strong new C–C bond and leads on to a stable beta-hydroxy carbonyl. Over time the reaction funnels through the productive carbon pathway, which is why the aldol makes carbon skeletons.',
    diag:{
      1:{ concept:'enolate-formation', msg:'Oxygen has plenty of lone pairs and does attack — reversibly. The carbon pathway wins because its product is the one that survives.' },
      2:{ concept:'resonance-delocalization', msg:'The charge sits mostly on oxygen, which is the more electronegative end and better able to hold it. The point is that where the charge sits is not the same question as where the molecule reacts.' },
      3:{ concept:'nucleophile-recognition', msg:'Electronegative atoms bearing a negative charge are still nucleophilic — alkoxides and hydroxide are good nucleophiles. Oxygen\'s problem here is the bond it makes, not its ability to attack.' }
    } },

  { id:'claisen-vs-aldol-difference', kind:'mcq', tier:4, topic:'claisen', concepts:['claisen-connectivity','aldol-connectivity','acyl-reactivity-order'],
    prompt:'The aldol and the Claisen both start by making an enolate that attacks a second carbonyl. What makes the outcomes different?',
    options:[
      'An ester has a leaving group, so its tetrahedral intermediate collapses and expels alkoxide — giving a beta-keto ester rather than a beta-hydroxy carbonyl',
      'The Claisen does not go through a tetrahedral intermediate',
      'The Claisen forms no new carbon–carbon bond',
      'The aldol requires acid and the Claisen requires base'
    ],
    answer:0,
    why:'The two mechanisms are identical up to the tetrahedral intermediate. An aldehyde or ketone has nothing good to expel, so the alkoxide is just protonated and you keep the new C–OH. An ester has an OR group, so the intermediate collapses back to a carbonyl and kicks out alkoxide — a substitution rather than an addition, and the product is a beta-keto ester.',
    diag:{
      1:{ concept:'tetrahedral-intermediate', msg:'It does — that is the shared step. The difference is what happens to that intermediate: collapse and expel, versus simply pick up a proton.' },
      2:{ concept:'claisen-connectivity', msg:'Both make a new C–C bond; that is the point of enolate chemistry. What differs is what leaves afterwards.' },
      3:{ concept:'enolate-formation', msg:'Both are base-promoted. The Claisen specifically uses an alkoxide matching the ester\'s own OR group, so that any transesterification is invisible.' }
    } },

  { id:'amine-basicity-order', kind:'order', tier:4, topic:'amine-structure', concepts:['amine-basicity','resonance-delocalization'],
    prompt:'Rank these nitrogen compounds by basicity, most basic first.',
    items:['CH₃CH₂NH₂ (an alkylamine)','NH₃ (ammonia)','C₆H₅NH₂ (aniline)','CH₃CONH₂ (an amide)'],
    answer:[0,1,2,3],
    why:'Basicity tracks how available the lone pair is. An alkyl group donates and pushes electron density onto nitrogen, so ethylamine beats ammonia. Aniline\'s lone pair is partly delocalized into the ring, and an amide\'s is fully conjugated into the carbonyl — an amide is essentially not basic at nitrogen at all.',
    diag:{ any:{ concept:'amine-basicity', msg:'Ask one question of each: how available is that lone pair? Alkyl donation makes it more available; conjugation into a ring or a carbonyl takes it away, and a carbonyl takes far more than a ring does.' } } },

  // ---- Aromatics ------------------------------------------------------

  { id:'aromaticity-four-tests', kind:'mcq', tier:4, topic:'aromaticity', concepts:['huckel-aromaticity'],
    prompt:'Cyclooctatetraene has eight carbons, alternating double bonds and a full ring of p orbitals. Why is it not aromatic?',
    options:[
      'Eight pi electrons is 4n, not 4n+2, and the ring puckers into a tub shape rather than staying planar',
      'It has too many carbons to be aromatic',
      'It has no p orbitals',
      'It is aromatic — it satisfies every requirement'
    ],
    answer:0,
    why:'It fails Hückel\'s count: 8 electrons is 4n with n = 2, which would be antiaromatic and destabilizing if the ring stayed flat. So it does not stay flat — it puckers into a tub, breaking the conjugation and behaving like an ordinary set of isolated alkenes instead. Escaping antiaromaticity by giving up planarity is the normal outcome.',
    diag:{
      1:{ concept:'huckel-aromaticity', msg:'Ring size itself is not a limit — [18]annulene with 18 pi electrons is aromatic, because 18 = 4(4)+2. It is the electron COUNT that has to come out right.' },
      2:{ concept:'huckel-aromaticity', msg:'Every sp² carbon in it has a p orbital. Having them is necessary but not sufficient: they also have to be coplanar and number 4n+2.' },
      3:{ concept:'huckel-aromaticity', msg:'Run the count: 4 double bonds is 8 pi electrons, and 8 is 4n rather than 4n+2. Continuous conjugation alone does not make a ring aromatic.' }
    } },

  { id:'eas-why-substitute', kind:'mcq', tier:3, topic:'eas', concepts:['eas-mechanism','huckel-aromaticity'],
    prompt:'An alkene adds Br₂ across its double bond. Benzene instead substitutes one hydrogen. Why?',
    options:[
      'Addition would permanently destroy the aromatic system; substitution restores it in the second step',
      'Benzene has no pi electrons to attack with',
      'Benzene reacts faster than an alkene, so it takes the shorter path',
      'Bromine is not electrophilic enough to add to benzene'
    ],
    answer:0,
    why:'Both start the same way — pi electrons attack the electrophile, giving a cation. For an alkene, a nucleophile then adds and the reaction is over. For benzene, adding a nucleophile would leave a permanently non-aromatic ring, costing the whole aromatic stabilization; losing a proton from the sp³ carbon instead brings the aromatic ring back, so that is the path taken.',
    diag:{
      1:{ concept:'eas-mechanism', msg:'Benzene has six pi electrons and does attack the electrophile — that is step one of EAS. The question is what happens after.' },
      2:{ concept:'eas-mechanism', msg:'Benzene is markedly LESS reactive than an alkene, because attacking costs it aromaticity temporarily. It usually needs a catalyst to generate a stronger electrophile.' },
      3:{ concept:'eas-mechanism', msg:'Br₂ alone is indeed too weak for benzene — that is why FeBr₃ is added. But even with a strong enough electrophile, the outcome is still substitution rather than addition, and aromaticity is the reason.' }
    } },

  { id:'eas-nitro-click', kind:'multi-click', tier:3, topic:'directing-effects', concepts:['directing-effects','resonance-delocalization'],
    prompt:'Click both ring positions where a second electrophile will attack.', molecule:'nitrobenzene',
    sub:'The nitro group withdraws strongly. Where is the arenium ion least destabilized?',
    answer:{ keys:['c3','c5'] },
    why:'A nitro group withdraws by resonance and induction, so every arenium ion is destabilized — but ortho and para attack put the positive charge directly next to the nitro group\'s own positive nitrogen, which is worst of all. Meta attack never does, so meta is the least bad option and the reaction goes there.',
    diag:{
      c2:{ concept:'directing-effects', msg:'Ortho. Draw the arenium resonance structures: one of them puts the positive charge on the carbon bearing the nitro group, adjacent to a positively polarized nitrogen. That is the arrangement a withdrawing group makes worst.' },
      c4:{ concept:'directing-effects', msg:'Para has the same problem as ortho — one resonance structure puts the charge next to the nitro group. Only meta avoids it.' },
      c6:{ concept:'directing-effects', msg:'Ortho on the other side, and the same objection. Meta direction is not the nitro group choosing meta; it is ortho and para being ruled out.' }
    } },

  // ---- Spectroscopy ---------------------------------------------------

  { id:'ir-distinguish-pair', kind:'mcq', tier:4, topic:'ir', concepts:['ir-functional-groups'],
    prompt:'One IR spectrum shows a strong band at 1715 cm⁻¹ and no broad absorption near 3300. The other shows both. Which pair does this distinguish?',
    options:[
      'A ketone from a carboxylic acid',
      'An alkane from an alkene',
      'An ester from an ether',
      'A primary from a secondary amine'
    ],
    answer:0,
    why:'The 1715 band is a C=O, present in both. The broad 2500–3300 absorption is the O–H of a carboxylic acid, hydrogen bonded and therefore very broad. A ketone has the carbonyl and no O–H; an acid has both. That is exactly the comparison IR is best at.',
    diag:{
      1:{ concept:'ir-functional-groups', msg:'Neither an alkane nor an alkene has a carbonyl, so neither would show a strong band at 1715. An alkene C=C appears near 1650 and is much weaker.' },
      2:{ concept:'ir-functional-groups', msg:'An ether has no C=O at all, so it would show nothing at 1715. The pair here both have a carbonyl and differ in whether an O–H is present.' },
      3:{ concept:'ir-functional-groups', msg:'Amine N–H stretches do appear around 3300, but neither amine has a carbonyl at 1715 — and the count of N–H bands, not a carbonyl, is what separates primary from secondary.' }
    } },

  { id:'ms-mplus2-pattern', kind:'mcq', tier:4, topic:'mass-spec', concepts:['ms-fragmentation'],
    prompt:'A mass spectrum shows M and M+2 peaks of nearly equal height. What does that indicate?',
    options:[
      'A bromine atom, whose two isotopes are almost equally abundant',
      'A chlorine atom',
      'A nitrogen atom',
      'Two separate compounds in the sample'
    ],
    answer:0,
    why:'Bromine is about 51% ⁷⁹Br and 49% ⁸¹Br, so any bromine-containing fragment appears as two peaks two mass units apart and roughly equal in height. Chlorine also gives an M+2, but its isotopes are 75:25, so the pattern is 3:1 rather than 1:1 — the ratio is what tells them apart.',
    diag:{
      1:{ concept:'ms-fragmentation', msg:'Chlorine does give an M+2 peak, but at about a third the height of M, because ³⁵Cl is three times as abundant as ³⁷Cl. Equal heights point to bromine.' },
      2:{ concept:'ms-fragmentation', msg:'Nitrogen shows up as an ODD molecular ion mass for an odd number of nitrogens — the nitrogen rule. It does not produce a significant M+2.' },
      3:{ concept:'ms-fragmentation', msg:'A single pure compound produces this pattern routinely whenever it contains bromine. Isotopes, not impurities.' }
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
