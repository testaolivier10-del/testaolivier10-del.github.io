/* Reaction Predictor — SN1, SN2, E1 or E2, and which factor decided it.

   This is the question Organic I actually turns on, and the reason it is hard
   is not that the four mechanisms are hard: it is that four variables argue
   with each other and students learn them as four separate lists. Substrate
   says one thing, the reagent says another, the solvent leans, heat leans
   harder. What nobody practises is the arbitration.

   So the tool is built around the arbitration. You set the four variables and
   commit to a prediction BEFORE seeing the answer — a tool that reveals as
   you click is a lookup table, and a lookup table is the thing students
   already have. Then the verdict comes back as four rows, each saying what
   that factor argued for and how strongly, so the lesson is which one
   overruled which rather than what the answer was.

   The reasoning is a decision procedure over substrate class, nucleophilicity,
   basicity, bulk, solvent and temperature — the same procedure a marker
   applies — not a table of stored answers for the combinations someone thought
   of. Products are given as condensed structural formulas rather than IUPAC
   names, deliberately: a generated name is a chance to be confidently wrong
   about something the student would then memorize. */
(function(){
  var root = document.getElementById('rpRoot');
  if(!root) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* ---- The three things you choose ------------------------------------- */

  /* `sub` is the substitution product with {X} standing in for whatever the
     reagent delivers. `zaitsev` is the more substituted alkene, `hofmann` the
     less substituted one a bulky base is forced to make. */
  var SUBSTRATES = [
    {
      id:'mebr', name:'Bromomethane', cls:'methyl', formula:'CH₃Br',
      sub:'CH₃–{X}', zaitsev:null, hofmann:null,
      note:'No beta hydrogen anywhere, so elimination is not on the table at all. Whatever happens here is substitution or nothing.'
    },
    {
      id:'prbr', name:'1-bromopropane', cls:'1', formula:'CH₃CH₂CH₂Br',
      sub:'CH₃CH₂CH₂–{X}', zaitsev:'CH₃CH=CH₂', hofmann:'CH₃CH=CH₂',
      note:'An unhindered primary carbon. Wide open from the back, and a primary carbocation is far too unstable to form, so the ionizing pathways are effectively shut.'
    },
    {
      id:'neopentyl', name:'Neopentyl bromide', cls:'1-hindered', formula:'(CH₃)₃CCH₂Br',
      sub:'(CH₃)₃CCH₂–{X}', zaitsev:null, hofmann:null,
      note:'Primary by the carbon count and almost unreactive in practice. The quaternary carbon next door blocks backside attack, and there is no beta hydrogen on it to eliminate either — the textbook case of a substrate whose classification misleads you.'
    },
    {
      id:'bubr2', name:'2-bromobutane', cls:'2', formula:'CH₃CHBrCH₂CH₃',
      sub:'CH₃CH({X})CH₂CH₃', zaitsev:'CH₃CH=CHCH₃', hofmann:'CH₂=CHCH₂CH₃',
      note:'Secondary, which is the genuinely ambiguous case: every mechanism is available to it and the reagent and solvent decide. Two different alkenes are possible, so the base you pick also decides which one.'
    },
    {
      id:'cyhexbr', name:'Bromocyclohexane', cls:'2', formula:'C₆H₁₁Br',
      sub:'C₆H₁₁–{X}', zaitsev:'cyclohexene', hofmann:'cyclohexene',
      note:'Secondary, and every beta position is equivalent, so there is only one alkene to make. That removes the Zaitsev/Hofmann question and leaves the substitution-versus-elimination one on its own.'
    },
    {
      id:'tbubr', name:'tert-butyl bromide', cls:'3', formula:'(CH₃)₃CBr',
      sub:'(CH₃)₃C–{X}', zaitsev:'(CH₃)₂C=CH₂', hofmann:'(CH₃)₂C=CH₂',
      note:'Tertiary. Backside attack is physically blocked, and the carbocation it makes on ionizing is about as stable as a simple one gets. All nine beta hydrogens are equivalent, so again only one alkene.'
    },
    {
      id:'mebubr', name:'2-bromo-2-methylbutane', cls:'3', formula:'CH₃CBr(CH₃)CH₂CH₃',
      sub:'(CH₃)₂C({X})CH₂CH₃', zaitsev:'(CH₃)₂C=CHCH₃', hofmann:'CH₂=C(CH₃)CH₂CH₃',
      note:'Tertiary with two different beta positions, which makes it the substrate that separates a small base from a bulky one — they give different alkenes.'
    },
    {
      id:'bnbr', name:'Benzyl bromide', cls:'benzylic', formula:'C₆H₅CH₂Br',
      sub:'C₆H₅CH₂–{X}', zaitsev:null, hofmann:null,
      note:'Primary by the carbon count but it ionizes readily, because the cation is delocalized into the ring. Unusually, both substitution mechanisms are genuinely open to it — and with no beta hydrogen on the ring side, elimination is not.'
    }
  ];

  /* nu and base are 0–4 scales: how good this species is at attacking carbon,
     and how good it is at taking a proton. They are not the same number, and
     the cases where they diverge — cyanide, azide, iodide, tert-butoxide —
     are exactly the ones that decide these problems. */
  var REAGENTS = [
    { id:'oh',   name:'NaOH',        x:'OH',  nu:3, base:3, bulky:false, kind:'Strong base, strong nucleophile' },
    { id:'oet',  name:'NaOEt',       x:'OEt', nu:3, base:3, bulky:false, kind:'Strong base, strong nucleophile' },
    { id:'otbu', name:'KOtBu',       x:'OtBu',nu:1, base:3, bulky:true,  kind:'Strong base, bulky, poor nucleophile' },
    { id:'dbu',  name:'DBU',         x:null,  nu:0, base:3, bulky:true,  kind:'Strong base, not a nucleophile at all' },
    { id:'sh',   name:'NaSH',        x:'SH',  nu:4, base:1, bulky:false, kind:'Excellent nucleophile, weak base' },
    { id:'cn',   name:'NaCN',        x:'CN',  nu:3, base:1, bulky:false, kind:'Strong nucleophile, weak base' },
    { id:'n3',   name:'NaN₃',        x:'N₃',  nu:3, base:0, bulky:false, kind:'Strong nucleophile, essentially non-basic' },
    { id:'i',    name:'NaI',         x:'I',   nu:3, base:0, bulky:false, kind:'Strong nucleophile, non-basic' },
    { id:'nh3',  name:'NH₃',         x:'NH₂', nu:2, base:1, bulky:false, kind:'Moderate nucleophile, weak base' },
    { id:'h2o',  name:'H₂O',         x:'OH',  nu:1, base:0, bulky:false, kind:'Weak nucleophile, weak base (solvolysis)' },
    { id:'etoh', name:'EtOH',        x:'OEt', nu:1, base:0, bulky:false, kind:'Weak nucleophile, weak base (solvolysis)' }
  ];

  var SOLVENTS = [
    { id:'protic',  name:'Polar protic', example:'EtOH, H₂O',
      note:'Hydrogen-bond donors. They cage an anionic nucleophile in a shell of solvent and slow it down, and they stabilize the ions a carbocation pathway has to make.' },
    { id:'aprotic', name:'Polar aprotic', example:'DMSO, DMF, acetone',
      note:'Polar enough to dissolve the salt, but with no O–H or N–H to donate. The cation gets solvated and the anion is left bare and furious, which is why SN2 rates jump by orders of magnitude here.' }
  ];

  var state = {
    sub: SUBSTRATES[3],
    rgt: REAGENTS[1],
    solvent: SOLVENTS[0],
    heat: false,
    guess: null,
    revealed: false,
    score: { right:0, total:0 }
  };

  /* ---- The decision ----------------------------------------------------- */

  /* Returns { major, minor, product, reasons[] }. Every branch is a rule a
     course actually teaches, and each one records what it argued so the
     verdict can be shown as an argument rather than an answer. */
  function predict(s){
    var sub = s.sub, r = s.rgt, solv = s.solvent, heat = s.heat;
    var reasons = [];
    var out = { major:null, minor:null, product:null, alkene:null };

    function say(factor, leans, text){ reasons.push({ factor:factor, leans:leans, text:text }); }

    var strongBase = r.base >= 3;
    var goodNu = r.nu >= 3;
    var weakBoth = r.nu <= 1 && r.base <= 1;
    var canEliminate = !!sub.zaitsev;

    /* --- substrate --- */
    if(sub.cls === 'methyl'){
      say('Substrate', 'SN2',
        'A methyl carbon: nothing is in the way of a backside attack, and there is no beta hydrogen, so elimination cannot happen no matter what you add.');
    } else if(sub.cls === '1'){
      say('Substrate', 'SN2',
        'Primary and unhindered. Backside attack is easy; a primary carbocation is so unstable that SN1 and E1 are effectively ruled out here.');
    } else if(sub.cls === '1-hindered'){
      say('Substrate', 'nothing',
        'Primary on paper, but the quaternary carbon next door blocks the backside trajectory, and it cannot ionize either. Almost nothing happens to this substrate at a reasonable rate.');
    } else if(sub.cls === '2'){
      say('Substrate', 'either',
        'Secondary — the genuinely ambiguous case. It can be attacked from behind and it can ionize, so the substrate alone does not settle anything and the reagent has to.');
    } else if(sub.cls === '3'){
      say('Substrate', 'SN1/E1/E2',
        'Tertiary: three alkyl groups block backside attack completely, so SN2 is off the table. It ionizes readily, and it has plenty of beta hydrogens for a base to take.');
    } else if(sub.cls === 'benzylic'){
      say('Substrate', 'either',
        'Benzylic. Primary and open to backside attack, but it also ionizes easily because the ring delocalizes the cation. Both substitution mechanisms are live; with no beta hydrogen, neither elimination is.');
    }

    /* --- reagent --- */
    if(r.bulky && strongBase){
      say('Reagent', 'E2',
        r.name + ' is a strong base that is too bulky to reach the carbon. It cannot do SN2 even where SN2 would be easy, so it goes for a beta proton on the outside of the molecule instead.');
    } else if(strongBase && goodNu){
      say('Reagent', 'SN2/E2',
        r.name + ' is strong at both jobs, so it argues for a bimolecular pathway — which one depends on the substrate. It rules out SN1 and E1 by being reactive enough that nothing has to wait for an ionization.');
    } else if(goodNu && r.base <= 1){
      say('Reagent', 'SN2',
        r.name + ' is an excellent nucleophile and a poor base. That combination is the cleanest argument for substitution there is: it wants the carbon, not the proton.');
    } else if(weakBoth){
      say('Reagent', 'SN1/E1',
        r.name + ' is weak at both jobs, which means it cannot force anything. Nothing happens until the substrate ionizes on its own, so whatever occurs will be unimolecular — and the solvent is the nucleophile.');
    } else {
      say('Reagent', 'SN2',
        r.name + ' is a moderate nucleophile and a weak base — it leans toward substitution, without the force to compel it.');
    }

    /* --- solvent --- */
    if(solv.id === 'aprotic'){
      say('Solvent', 'SN2',
        'Polar aprotic. There is no O–H to hydrogen-bond to the nucleophile, so the anion is left unsolvated and far more reactive. This is worth orders of magnitude to an SN2 rate.');
    } else {
      say('Solvent', weakBoth ? 'SN1/E1' : 'SN1/E1 (mildly)',
        'Polar protic. It hydrogen-bonds to an anionic nucleophile and blunts it, while stabilizing both ions of an ionization. It pushes toward the unimolecular pathways — decisively when the reagent is weak, only mildly when the reagent is strong enough to act anyway.');
    }

    /* --- temperature --- */
    say('Temperature', heat ? 'elimination' : 'substitution (slightly)',
      heat
        ? 'Heat. Elimination makes more particles from fewer, so it has the larger positive entropy change — and the TΔS term grows with temperature. Heating a mixture that could go either way pushes it toward the alkene.'
        : 'Room temperature. Nothing is being pushed toward elimination by entropy, which slightly favours substitution in any case that is otherwise balanced.');

    /* --- the arbitration --- */
    if(sub.cls === 'methyl'){
      /* Tert-butoxide is a poor nucleophile because it is bulky, not because
         it is unreactive — and a methyl carbon has nothing to be bulky
         against. So on this substrate a bulky strong base attacks perfectly
         well, which is why KOtBu and methyl iodide give the ether rather than
         nothing. DBU stays out: it is non-nucleophilic on its own account. */
      var methylNu = (r.bulky && r.nu >= 1) ? 3 : r.nu;
      out.major = methylNu >= 2 ? 'SN2' : 'No reaction';
      out.minor = null;
      out.verdict = methylNu >= 2
        ? 'SN2, and only SN2. There is no beta hydrogen to eliminate and a methyl cation is out of the question, so the reagent’s basicity is irrelevant here — the only question is whether it will attack.' +
          (r.bulky ? ' Note what does NOT matter: the base is bulky, and on any bigger substrate that would force elimination. Against a methyl carbon there is nothing for the bulk to collide with, so it attacks like any other strong base.' : '')
        : 'Nothing worth writing down. The reagent is too weak a nucleophile to attack, and with no beta hydrogen and no possible carbocation there is no other pathway.';
    } else if(sub.cls === '1-hindered'){
      out.major = 'No reaction';
      out.verdict = 'Effectively nothing. This is the trap: counting carbons says primary and therefore SN2, but the neighbouring quaternary carbon blocks the approach, and with no beta hydrogen on it and no possibility of ionizing, there is no second-choice pathway either.';
    } else if(sub.cls === '1'){
      if(r.bulky && strongBase){
        /* A bulky base still gives a little substitution if it is a
           nucleophile at all — tert-butoxide does. DBU is not: it is an
           amidine chosen precisely because it will not attack a carbon, and
           crediting it with minor SN2 taught the opposite of the reason
           anyone reaches for it. */
        out.major = 'E2'; out.minor = r.nu >= 1 ? 'SN2' : null;
        out.verdict = 'E2. A primary carbon would normally be a straightforward SN2, and this is the one thing that overrules it: the base is strong but too bulky to reach the carbon, so it takes the accessible beta proton instead.' +
          (r.nu >= 1 ? '' : ' ' + r.name + ' is not a nucleophile at all, so there is no substitution competing here — elimination is the only thing on offer.');
      } else if(r.nu >= 2){
        out.major = 'SN2'; out.minor = strongBase ? 'E2' : null;
        out.verdict = 'SN2. Primary substrates are the SN2 home ground — open to attack and unable to ionize.' +
          (strongBase ? ' The reagent is basic enough to give some E2 alongside it, and heating would raise that share, but substitution stays the major path.' : '');
      } else {
        out.major = 'No reaction';
        out.verdict = 'Nothing much. A weak nucleophile cannot force an SN2, and a primary carbocation will not form to let anything else happen.';
      }
    } else if(sub.cls === 'benzylic'){
      out.major = r.nu >= 2 ? 'SN2' : 'SN1';
      out.verdict = r.nu >= 2
        ? 'SN2. Benzylic carbons are open to attack and a strong nucleophile takes that route directly rather than waiting for an ionization.'
        : 'SN1. With nothing strong enough to attack, the substrate ionizes on its own — which it is unusually willing to do, because the ring delocalizes the resulting cation.';
    } else if(sub.cls === '2'){
      if(strongBase && r.bulky){
        out.major = 'E2';
        out.verdict = 'E2, decisively. A bulky strong base on a secondary carbon has no realistic route to the carbon itself.';
      } else if(strongBase){
        out.major = 'E2'; out.minor = 'SN2';
        out.verdict = 'E2 major, SN2 minor. This is the case that trips people up: the reagent is a good nucleophile as well, so SN2 really does compete — but on a secondary carbon a strong base takes the beta proton more often than it attacks the crowded carbon.' +
          (heat ? ' Heating widens that gap further.' : '') +
          (solv.id === 'aprotic' ? ' The aprotic solvent pushes the SN2 share up, without changing which one is major.' : '');
      } else if(goodNu){
        out.major = 'SN2'; out.minor = null;
        out.verdict = 'SN2. A strong nucleophile that is a weak base is the cleanest way to get substitution on a secondary carbon — there is nothing basic enough to pull a beta proton, so the competition never starts.' +
          (solv.id === 'aprotic' ? ' The aprotic solvent makes it faster still.' : ' A polar aprotic solvent would speed this up considerably.');
      } else {
        out.major = heat ? 'E1' : 'SN1'; out.minor = heat ? 'SN1' : 'E1';
        out.verdict = 'Solvolysis: a mixture of SN1 and E1, because both start from the same carbocation and then diverge. ' +
          (heat ? 'Heating tips the product mixture toward the alkene.' : 'At room temperature the substitution product usually dominates the mixture.') +
          ' Expect a genuinely messy result — this is why nobody runs secondary solvolysis on purpose.';
      }
    } else if(sub.cls === '3'){
      if(strongBase){
        out.major = 'E2';
        out.verdict = 'E2. SN2 is impossible on a tertiary carbon, and a strong base does not wait around for an ionization — it removes a beta proton in one bimolecular step.';
      } else {
        out.major = heat ? 'E1' : 'SN1'; out.minor = heat ? 'SN1' : 'E1';
        out.verdict = 'SN1 and E1 together, from the same carbocation. ' +
          (heat ? 'With heat the elimination product takes over.' : 'At room temperature substitution is usually the larger share.') +
          (solv.id === 'protic' ? ' The protic solvent is helping: it stabilizes both ions as the bond breaks.'
                                : ' Note that a polar aprotic solvent is a poor choice for this — ionization wants a solvent that can stabilize the ions it creates.');
      }
    }

    /* --- what you actually get --- */
    var isSub = out.major === 'SN1' || out.major === 'SN2';
    var isElim = out.major === 'E1' || out.major === 'E2';

    if(sub.generic){
      /* A substrate the student drew. The class is read off the structure and
         every factor argument above holds, but the tool will not write a
         product formula for it: generating one means naming a rearrangement
         that may or may not happen and a regiochemistry it has not checked,
         and a confidently wrong product is the one thing worse than no
         product. The reasoning is the part that was worth having anyway. */
      out.product = null;
      out.productNote = 'The mechanism above is what this substrate does. The product is not written out because this ' +
        'one was drawn rather than chosen: getting from a structure to a named product means committing to where a ' +
        'carbocation ends up and which beta hydrogen leaves, and a confidently wrong product would be worse than none. ' +
        'Work it out from the mechanism — that is the exercise.';
    } else if(isSub){
      out.product = r.x ? sub.sub.replace('{X}', r.x) : null;
      if(!out.product){
        out.product = '—';
        out.productNote = r.name + ' is not a nucleophile, so there is no substitution product to write.';
      }
    } else if(isElim && canEliminate){
      /* Zaitsev unless the base is too bulky to reach the more substituted
         side — which is the entire reason anyone teaches Hofmann. */
      var useHofmann = out.major === 'E2' && r.bulky && sub.hofmann !== sub.zaitsev;
      out.product = useHofmann ? sub.hofmann : sub.zaitsev;
      out.alkene = useHofmann ? 'Hofmann' : 'Zaitsev';
      out.productNote = useHofmann
        ? 'The Hofmann product — the LESS substituted alkene. A bulky base cannot get at the crowded, more substituted beta position, so it takes a proton from the accessible end instead. This is the only situation where Zaitsev loses.'
        : 'The Zaitsev product — the more substituted alkene, which is the more stable one, and the one you get whenever the base is small enough to choose.';
    }

    out.reasons = reasons;
    return out;
  }

  /* ---- What comes out of the flask ---------------------------------------

     "SN2, with some E2" is the answer a course gives and it is half an answer:
     the thing worth knowing is whether "some" means a tenth or nearly half,
     because that is the difference between a clean reaction and a separation
     problem. The tool already knows which factors are pushing and how hard —
     it prints them as four rows — so it can say how lopsided the result is.

     What it must not do is imply it has measured anything. These are bands,
     rounded to the nearest five and labelled as an indication of how one-sided
     the competition is. A real yield depends on concentration, the precise
     solvent, how long it was left and who ran it. */
  function mixture(s, out){
    var isSub  = function(m){ return m === 'SN1' || m === 'SN2'; };
    var isElim = function(m){ return m === 'E1'  || m === 'E2';  };

    if(!out.minor || !out.major || out.major === 'No reaction'){
      return out.major && out.major !== 'No reaction'
        ? [{ path: out.major, pct: 100 }]
        : null;
    }

    var lead = 65;                       // two live pathways, no thumb on either
    var why = [];

    if(s.heat){
      if(isElim(out.major)){ lead += 12; why.push('heat widens the elimination’s lead'); }
      else if(isElim(out.minor)){ lead -= 12; why.push('heat pulls the elimination share up'); }
    }
    if(s.solvent.id === 'aprotic'){
      if(out.major === 'SN2'){ lead += 8; why.push('the aprotic solvent sharpens the nucleophile'); }
      else if(out.minor === 'SN2'){ lead -= 8; why.push('the aprotic solvent pushes the SN2 share up'); }
    }
    if(s.rgt.bulky && isElim(out.major)){
      lead += 10; why.push('the bulk of the base makes the carbon harder still to reach');
    }
    // Two paths off one carbocation are never as lopsided as a bimolecular choice.
    if(out.major === 'SN1' || out.major === 'E1'){ lead -= 8; why.push('both paths run through the same carbocation, so neither gets far ahead'); }

    lead = Math.max(55, Math.min(90, lead));
    lead = Math.round(lead / 5) * 5;

    return [
      { path: out.major, pct: lead },
      { path: out.minor, pct: 100 - lead },
      { why: why }
    ];
  }

  /* Which page in the Arrow Pusher teaches the mechanism just predicted. A
     verdict that ends "and that is E2" and then leaves you on the same screen
     has stopped one step short of the thing worth doing next. */
  var MECH_LINK = {
    SN2: { id:'sn2-bromoethane', label:'Draw the SN2' },
    SN1: { id:'sn1-secondary',   label:'Draw the ionization' },
    E2:  { id:'e2-butane',       label:'Draw the E2' },
    E1:  { id:'sn1-secondary',   label:'Draw the first step of the E1' }
  };

  /* ---- Reading a substrate off a drawing ---------------------------------

     The four factors are a decision procedure over a substrate CLASS, not over
     a stored molecule, so the only thing keeping it to nine substrates was
     that nothing else offered one. Classifying a drawn structure is three
     questions: where is the leaving group, how many carbons are on the carbon
     holding it, and is there a hydrogen on any neighbour. */
  var HALIDES = { F:1, Cl:1, Br:1, I:1 };

  function classifySubstrate(st){
    var C = window.OchemChem;
    if(!C) return { error:'The chemistry engine is not loaded on this page.' };

    var site = null, lg = null;
    Object.keys(st.atoms).forEach(function(k){
      var a = st.atoms[k];
      if(!a.el || !HALIDES[a.el]) return;
      C.neighbors(st, k).forEach(function(n){
        if(st.atoms[n] && st.atoms[n].el === 'C' && !site){ site = n; lg = k; }
      });
    });
    if(!site){
      return { error:'No leaving group. Put a halogen — F, Cl, Br or I — on a carbon, and the substitution/elimination question has something to be about.' };
    }

    var carbons = C.neighbors(st, site).filter(function(n){
      return st.atoms[n] && st.atoms[n].el === 'C';
    });

    function hCount(k){
      var a = st.atoms[k];
      return a.hFixed !== undefined ? a.hFixed : (a.hImplicit || 0);
    }
    function isAromaticCarbon(k){
      if(!st.atoms[k] || st.atoms[k].el !== 'C') return false;
      return C.bondsAt(st, k).some(function(b){ return b.order === 2; }) &&
             !!window.OchemBuilder && !!window.OchemBuilder.findRing(st, [k]);
    }

    var betaH = carbons.some(function(n){ return hCount(n) > 0; });
    var benzylic = carbons.some(isAromaticCarbon);

    var cls;
    if(carbons.length === 0) cls = 'methyl';
    else if(carbons.length === 1) {
      // Neopentyl: primary by the count, unreachable in practice.
      var nb = carbons[0];
      var crowded = C.neighbors(st, nb).filter(function(n){
        return st.atoms[n] && st.atoms[n].el === 'C' && n !== site;
      }).length >= 3;
      cls = benzylic ? 'benzylic' : (crowded ? '1-hindered' : '1');
    }
    else if(carbons.length === 2) cls = '2';
    else cls = '3';

    if(cls === '1-hindered' && betaH) cls = '1';

    return {
      id:'custom', name: st.name || 'Your substrate', cls: cls,
      formula: C.formula(st), generic: true,
      sub: null,
      zaitsev: betaH ? 'alkene' : null,
      hofmann: betaH ? 'alkene' : null,
      note: 'Read off the structure you drew: the carbon holding the ' + st.atoms[lg].el +
            ' has ' + carbons.length + ' carbon' + (carbons.length === 1 ? '' : 's') + ' on it, which makes it ' +
            ({ methyl:'a methyl carbon', '1':'primary', '1-hindered':'primary but hindered',
               '2':'secondary', '3':'tertiary', benzylic:'benzylic' })[cls] + '. ' +
            (betaH ? 'There are beta hydrogens, so elimination is on the table.'
                   : 'There is no hydrogen on any neighbouring carbon, so elimination cannot happen here at all.')
    };
  }

  /* ---- Rendering -------------------------------------------------------- */

  root.innerHTML =
    '<div class="tpanel">' +
      '<div class="tpanel__head"><span>Set up the reaction</span><span class="tmuted" id="rpScore"></span></div>' +
      '<div class="rp-setup">' +
        '<div class="tfield"><label for="rpSub">Substrate</label><select class="tselect" id="rpSub"></select></div>' +
        '<div class="tfield"><label for="rpRgt">Reagent</label><select class="tselect" id="rpRgt"></select></div>' +
        '<div class="tfield"><label for="rpSolv">Solvent</label><select class="tselect" id="rpSolv"></select></div>' +
        '<div class="tfield"><label for="rpHeat">Temperature</label>' +
          '<div class="tseg" id="rpHeat">' +
            '<button type="button" data-heat="0" class="on">Room temp</button>' +
            '<button type="button" data-heat="1">Heat</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="rp-equation" id="rpEq"></div>' +
      '<div class="trow" style="margin-top:12px;">' +
        '<button type="button" class="tchip tchip--ghost" id="rpBuildToggle">Draw your own substrate &rarr;</button>' +
      '</div>' +
      '<div id="rpBuilder" hidden></div>' +
      '<div id="rpBuildMsg"></div>' +
    '</div>' +
    '<div class="tsplit tsplit--wide">' +
      '<div class="tpanel">' +
        '<div class="tpanel__head">Commit to a prediction</div>' +
        '<p class="tmuted" style="margin-top:0;">Decide before you look. Getting it wrong with a reason in mind teaches more than getting it right by reading the answer.</p>' +
        '<div class="tchips" id="rpGuess">' +
          ['SN2','SN1','E2','E1','No reaction'].map(function(g){
            return '<button type="button" class="tchip" data-guess="' + g + '">' + g + '</button>';
          }).join('') +
        '</div>' +
        '<div aria-live="polite" id="rpVerdict" style="margin-top:14px;"></div>' +
      '</div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head">How the four factors voted</div>' +
        '<div id="rpFactors"></div>' +
      '</div>' +
    '</div>';

  /* ---- Draw your own substrate ------------------------------------------- */
  var rpBuilderApi = null;

  document.getElementById('rpBuildToggle').addEventListener('click', function(){
    var box = document.getElementById('rpBuilder');
    var msg = document.getElementById('rpBuildMsg');
    var open = box.hidden;
    box.hidden = !open;
    this.classList.toggle('on', open);
    this.textContent = open ? 'Hide the builder' : 'Draw your own substrate →';
    if(open && !rpBuilderApi && window.OchemBuilderUI){
      rpBuilderApi = window.OchemBuilderUI.mount(box, {
        onChange: function(st, rep){
          if(rep.empty){ msg.innerHTML = ''; return; }
          if(!rep.ok){
            msg.innerHTML = '<div class="tnote tnote--bad" style="margin-top:12px;">Fix what is flagged below first.</div>';
            return;
          }
          var sub = classifySubstrate(st);
          if(sub.error){
            msg.innerHTML = '<div class="tnote tnote--warn" style="margin-top:12px;">' +
              '<span class="tnote__k">Not a substrate yet</span>' + esc(sub.error) + '</div>';
            return;
          }
          msg.innerHTML = '<div class="tnote tnote--good" style="margin-top:12px;">' +
            '<span class="tnote__k">Loaded</span>' + esc(sub.note) + '</div>';
          state.sub = sub;
          state.guess = null;
          state.revealed = false;
          render();
        }
      });
    }
  });

  var elSub = document.getElementById('rpSub');
  var elRgt = document.getElementById('rpRgt');
  var elSolv = document.getElementById('rpSolv');

  elSub.innerHTML = SUBSTRATES.map(function(s, i){
    return '<option value="' + s.id + '"' + (i === 3 ? ' selected' : '') + '>' + esc(s.name) + ' — ' + esc(s.formula) + '</option>';
  }).join('');
  elRgt.innerHTML = REAGENTS.map(function(r, i){
    return '<option value="' + r.id + '"' + (i === 1 ? ' selected' : '') + '>' + esc(r.name) + ' — ' + esc(r.kind) + '</option>';
  }).join('');
  elSolv.innerHTML = SOLVENTS.map(function(s){
    return '<option value="' + s.id + '">' + esc(s.name) + ' (' + esc(s.example) + ')</option>';
  }).join('');

  function find(list, id){
    for(var i=0;i<list.length;i++) if(list[i].id === id) return list[i];
    return list[0];
  }

  elSub.addEventListener('change', function(){ state.sub = find(SUBSTRATES, elSub.value); reset(); });
  elRgt.addEventListener('change', function(){ state.rgt = find(REAGENTS, elRgt.value); reset(); });
  elSolv.addEventListener('change', function(){ state.solvent = find(SOLVENTS, elSolv.value); reset(); });
  document.getElementById('rpHeat').querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      state.heat = b.getAttribute('data-heat') === '1';
      document.getElementById('rpHeat').querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); });
      reset();
    });
  });
  document.getElementById('rpGuess').querySelectorAll('.tchip').forEach(function(b){
    b.addEventListener('click', function(){
      if(state.revealed) return;
      state.guess = b.getAttribute('data-guess');
      document.getElementById('rpGuess').querySelectorAll('.tchip').forEach(function(x){ x.classList.toggle('on', x === b); });
      reveal();
    });
  });

  /* Changing any input puts the answer away again. Leaving the previous
     verdict on screen while the conditions change would let you read off the
     new answer without ever making a second prediction. */
  function reset(){
    state.guess = null;
    state.revealed = false;
    document.getElementById('rpGuess').querySelectorAll('.tchip').forEach(function(x){ x.classList.remove('on'); });
    render();
  }

  function reveal(){
    var p = predict(state);
    state.revealed = true;
    state.score.total++;
    if(state.guess === p.major) state.score.right++;
    render();
  }

  /* A setup in the address bar. "Try this one" is a sentence an instructor
     should be able to finish with a link rather than four instructions. */
  function sync(){
    if(!window.OchemToolState) return;
    window.OchemToolState.write({
      sub: state.sub.generic ? null : state.sub.id,
      rgt: state.rgt.id,
      solv: state.solvent.id,
      heat: state.heat ? 1 : null
    });
  }

  function render(){
    var p = predict(state);
    sync();

    document.getElementById('rpScore').textContent =
      state.score.total ? state.score.right + ' of ' + state.score.total + ' right' : '';

    document.getElementById('rpEq').innerHTML =
      '<span class="rp-term">' + esc(state.sub.formula) + '</span>' +
      '<span class="rp-op">+</span>' +
      '<span class="rp-term">' + esc(state.rgt.name) + '</span>' +
      '<span class="rp-arrow">' +
        '<span class="rp-over">' + esc(state.solvent.example) + '</span>' +
        '<span class="rp-line">&rarr;</span>' +
        '<span class="rp-under">' + (state.heat ? 'heat' : '25 °C') + '</span>' +
      '</span>' +
      '<span class="rp-term rp-term--product">' + (state.revealed ? esc(p.product || '—') : '?') + '</span>';

    // Factors stay hidden until the prediction is in.
    var elF = document.getElementById('rpFactors');
    if(!state.revealed){
      elF.innerHTML = '<div class="tempty">The four arguments appear once you have committed.<br>' +
        'Work through them yourself first: what does the substrate allow, what does the reagent want, ' +
        'which way does the solvent lean, and is anything being heated?</div>';
    } else {
      elF.innerHTML = '<div class="ttable-scroll"><table class="ttable">' +
        '<thead><tr><th>Factor</th><th>Argues for</th></tr></thead><tbody>' +
        p.reasons.map(function(r){
          return '<tr><td style="white-space:nowrap;"><b>' + esc(r.factor) + '</b><br>' +
            '<span class="tmuted" style="font-size:11.5px;">' + esc(r.leans) + '</span></td>' +
            '<td>' + esc(r.text) + '</td></tr>';
        }).join('') +
        '</tbody></table></div>' +
        '<p class="tmuted" style="margin-top:12px;">' + esc(state.sub.note) + '</p>' +
        '<p class="tmuted">' + esc(state.solvent.note) + '</p>';
    }

    var elV = document.getElementById('rpVerdict');
    if(!state.revealed){
      elV.innerHTML = '';
      return;
    }

    var right = state.guess === p.major;
    var html = '<div class="tnote ' + (right ? 'tnote--good' : 'tnote--bad') + '">' +
      '<span class="tnote__k">' + (right ? 'Correct — ' + esc(p.major) : 'Not quite — it is ' + esc(p.major) + ', not ' + esc(state.guess)) + '</span>' +
      esc(p.verdict) + '</div>';

    var mix = mixture(state, p);
    if(mix && mix.length > 1){
      var why = mix[2] && mix[2].why && mix[2].why.length ? mix[2].why.join(', and ') : null;
      html += '<div class="tnote tnote--warn"><span class="tnote__k">Roughly what you get</span>' +
        '<div class="rp-mix">' +
          mix.slice(0, 2).map(function(m, i){
            return '<div class="rp-mix__bar' + (i === 0 ? ' is-major' : '') + '" style="flex:' + m.pct + ';">' +
              '<span>' + esc(m.path) + '</span><b>' + m.pct + '%</b></div>';
          }).join('') +
        '</div>' +
        'These are competitions, not switches: a real flask gives you both, and the useful question is how lopsided. ' +
        (why ? 'Here ' + esc(why) + '. ' : '') +
        'Treat the split as a band rather than a yield — the actual numbers move with concentration, the exact solvent and how long it was left.' +
      '</div>';
    }

    if(p.product && p.product !== '—'){
      html += '<div class="tnote tnote--info"><span class="tnote__k">Major product' +
        (p.alkene ? ' · ' + esc(p.alkene) : '') + '</span>' +
        '<span class="tformula">' + esc(p.product) + '</span>' +
        (p.productNote ? '<div style="margin-top:6px;">' + esc(p.productNote) + '</div>' : '') +
      '</div>';
    } else if(p.productNote){
      html += '<div class="tnote"><span class="tnote__k">Product</span>' + esc(p.productNote) + '</div>';
    }

    var link = MECH_LINK[p.major];
    html += '<div class="trow" style="margin-top:4px;">' +
      '<button type="button" class="tchip" id="rpNext">Try another combination</button>' +
      (link
        ? '<a class="tchip tchip--ghost" href="arrow-pusher.html?start=' + encodeURIComponent(link.id) + '">' +
          esc(link.label) + ' &rarr;</a>'
        : '') +
    '</div>';
    elV.innerHTML = html;
    document.getElementById('rpNext').addEventListener('click', shuffle);
  }

  /* A random setup, so the tool can be used as a drill rather than only as a
     lookup. Deliberately picks from every substrate class. */
  function shuffle(){
    state.sub = SUBSTRATES[Math.floor(Math.random() * SUBSTRATES.length)];
    state.rgt = REAGENTS[Math.floor(Math.random() * REAGENTS.length)];
    state.solvent = SOLVENTS[Math.floor(Math.random() * SOLVENTS.length)];
    state.heat = Math.random() < 0.4;
    elSub.value = state.sub.id;
    elRgt.value = state.rgt.id;
    elSolv.value = state.solvent.id;
    document.getElementById('rpHeat').querySelectorAll('button').forEach(function(x){
      x.classList.toggle('on', (x.getAttribute('data-heat') === '1') === state.heat);
    });
    reset();
  }

  render();
  if(window.OchemToolState){
    var q = window.OchemToolState.read();
    var qs = find(SUBSTRATES, q.sub), qr = find(REAGENTS, q.rgt), qv = find(SOLVENTS, q.solv);
    if(qs) state.sub = qs;
    if(qr) state.rgt = qr;
    if(qv) state.solvent = qv;
    state.heat = q.heat === '1';
    if(qs || qr || qv || state.heat){
      elSub.value = state.sub.id; elRgt.value = state.rgt.id; elSolv.value = state.solvent.id;
      document.getElementById('rpHeat').querySelectorAll('button').forEach(function(x){
        x.classList.toggle('on', (x.getAttribute('data-heat') === '1') === state.heat);
      });
      render();
    }
  }

  /* ---- Check yourself ---------------------------------------------------
     The tool already makes you commit before it reveals, which is most of the
     way to a quiz. What it cannot do is choose the hard combinations for you:
     left alone, people set the substrate once and then click through reagents,
     which drills one row of the table.

     So the quiz picks the combination, and it picks from the whole space —
     the same predict() that answers the main panel answers this, so there is
     no second decision procedure to keep in step. Combinations where the
     engine hedges are thrown back: a question whose honest answer is "it
     depends, you'd get a mixture" is a fine thing for the sandbox to show and
     a bad thing to score an answer against. */
  if(window.OchemToolQuiz){
    window.OchemToolQuiz.mount(document.getElementById('tool-quiz'), {
      slug: 'reaction-predictor',
      rounds: 6,
      intro: 'Substrate, reagent, solvent, heat — which mechanism wins?',
      make: function(recent){
        var pick = null, res = null, tries = 0;
        while(tries++ < 80){
          var cand = {
            sub: SUBSTRATES[Math.floor(Math.random() * SUBSTRATES.length)],
            rgt: REAGENTS[Math.floor(Math.random() * REAGENTS.length)],
            solvent: SOLVENTS[Math.floor(Math.random() * SOLVENTS.length)],
            heat: Math.random() < 0.4,
            guess: null
          };
          var id = cand.sub.id + '/' + cand.rgt.id + '/' + cand.solvent.id + (cand.heat ? '/h' : '');
          if(recent.indexOf(id) >= 0) continue;
          var r = predict(cand);
          /* "No reaction" is a real and useful verdict — bromomethane has no
             beta hydrogen, water is not going to touch a neopentyl halide —
             but it is not one of the four options, so those combinations stay
             in the sandbox where the tool can explain them properly. */
          if(!r || !r.major || ['SN1','SN2','E1','E2'].indexOf(r.major) < 0) continue;
          pick = cand; pick._id = id; res = r; break;
        }
        if(!pick) return null;

        /* The deciding factor, in the engine's own words, is the thing worth
           carrying away — "SN2, because the substrate is primary and there is
           nowhere for a cation to form" teaches something that "SN2" does
           not. */
        var reasons = (res.reasons || []).filter(function(x){ return x.leans; });
        var why = reasons.length
          ? reasons.map(function(x){ return '<b>' + esc(x.factor) + ':</b> ' + x.text; }).join(' ')
          : '';

        return {
          id: pick._id,
          prompt: '<span class="tformula">' + esc(pick.sub.formula) + '</span> + <b>' +
                  esc(pick.rgt.name) + '</b>, in ' + esc(pick.solvent.name.toLowerCase()) +
                  ' solvent' + (pick.heat ? ', heated' : ', at room temperature') +
                  '. Which mechanism dominates?',
          options: ['SN1', 'SN2', 'E1', 'E2'].map(function(m){
            return { id:m, label:m, correct: m === res.major };
          }),
          explain: '<b>' + esc(res.major) + '</b>' +
                   (res.minor ? ', with some ' + esc(res.minor) + ' alongside it' : '') + '. ' + why
        };
      }
    });
  }

})();
