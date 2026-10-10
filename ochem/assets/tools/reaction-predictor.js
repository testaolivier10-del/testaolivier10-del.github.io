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
      note:'Primary by the carbon count and very slow in practice. The quaternary carbon next door blocks backside attack, and there is no beta hydrogen on it to eliminate either. Forced to ionize, it rearranges. The textbook case of a substrate whose classification misleads you.'
    },
    {
      id:'bubr2', name:'2-bromobutane', cls:'2', formula:'CH₃CHBrCH₂CH₃',
      sub:'CH₃CH({X})CH₂CH₃', zaitsev:'(E)-CH₃CH=CHCH₃', hofmann:'CH₂=CHCH₂CH₃',
      zaitsevEZ:'(E)-But-2-ene is the major alkene, with less of the (Z) isomer: the conformer that puts the two methyls on opposite sides is lower in energy, so more of the elimination goes through it.',
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
    mode: 'explore',
    score: { right:0, total:0 }
  };

  /* ---- The decision ----------------------------------------------------- */

  /* Returns { major, minor, product, reasons[] }. Every branch is a rule a
     course actually teaches, and each one records what it argued so the
     verdict can be shown as an argument rather than an answer. */
  function predict(s){
    var sub = s.sub, r = s.rgt, solv = s.solvent, heat = s.heat;
    var reasons = [];
    var out = { major:null, minor:null, product:null, alkene:null, blocked:{} };

    /* `votes` is the same argument as `leans`, as weights on the four
       pathways (1 = argues for it, 0.5 = "mildly" or split, 0.25 =
       "slightly"), so the meter can draw what each factor says without a
       second rule set. `out.blocked` records a pathway the substrate rules
       out entirely, with the reason. */
    function say(factor, leans, text, votes){ reasons.push({ factor:factor, leans:leans, text:text, votes:votes || {} }); }
    function block(path, why){ if(!out.blocked[path]) out.blocked[path] = why; }

    var strongBase = r.base >= 3;
    var goodNu = r.nu >= 3;
    var weakBoth = r.nu <= 1 && r.base <= 1;
    var canEliminate = !!sub.zaitsev;

    /* --- substrate --- */
    if(sub.cls === 'methyl'){
      say('Substrate', 'SN2',
        'A methyl carbon: nothing is in the way of a backside attack, and there is no beta hydrogen, so elimination cannot happen no matter what you add.', { SN2:1 });
      block('SN1', 'A methyl cation is far too unstable to form.');
      block('E1', 'No carbocation, and no beta hydrogen.');
      block('E2', 'No beta hydrogen to remove.');
    } else if(sub.cls === '1'){
      say('Substrate', 'SN2',
        'Primary and unhindered. Backside attack is easy; a primary carbocation is so unstable that SN1 and E1 are effectively ruled out here.', { SN2:1 });
      block('SN1', 'A primary carbocation will not form.');
      block('E1', 'A primary carbocation will not form.');
    } else if(sub.cls === '1-hindered'){
      say('Substrate', 'nothing',
        'Primary on paper, but the quaternary carbon next door blocks the backside trajectory, and the primary cation it would make is too unstable to form on its own. Everything is very slow here.', {});
      block('SN2', 'The quaternary carbon next door blocks the backside.');
      block('SN1', 'A primary cation will not form on its own.');
      block('E1', 'A primary cation will not form on its own.');
      block('E2', 'No hydrogen on the neighboring carbon.');
    } else if(sub.cls === '2'){
      say('Substrate', 'either',
        'Secondary — the genuinely ambiguous case. It can be attacked from behind and it can ionize, so the substrate alone does not settle anything and the reagent has to.', { SN1:0.5, SN2:0.5, E1:0.5, E2:0.5 });
    } else if(sub.cls === '3'){
      say('Substrate', 'SN1/E1/E2',
        'Tertiary: three alkyl groups block backside attack completely, so SN2 is off the table. It ionizes readily, and it has plenty of beta hydrogens for a base to take.', { SN1:1, E1:1, E2:1 });
      block('SN2', 'Three alkyl groups wall off the backside.');
    } else if(sub.cls === 'benzylic'){
      say('Substrate', 'either',
        'Benzylic. Primary and open to backside attack, but it also ionizes easily because the ring delocalizes the cation. Both substitution mechanisms are live; with no beta hydrogen, neither elimination is.', { SN1:1, SN2:1 });
      block('E1', 'No beta hydrogen on the ring side.');
      block('E2', 'No beta hydrogen on the ring side.');
    }

    /* --- reagent --- */
    if(r.bulky && strongBase){
      say('Reagent', 'E2',
        r.name + ' is a strong base that is too bulky to reach the carbon. It cannot do SN2 even where SN2 would be easy, so it goes for a beta proton on the outside of the molecule instead.', { E2:1 });
    } else if(strongBase && goodNu){
      say('Reagent', 'SN2/E2',
        r.name + ' is strong at both jobs, so it argues for a bimolecular pathway — which one depends on the substrate. It rules out SN1 and E1 by being reactive enough that nothing has to wait for an ionization.', { SN2:1, E2:1 });
    } else if(goodNu && r.base <= 1){
      say('Reagent', 'SN2',
        r.name + ' is an excellent nucleophile and a poor base. That combination is the cleanest argument for substitution there is: it wants the carbon, not the proton.', { SN2:1 });
    } else if(weakBoth){
      say('Reagent', 'SN1/E1',
        r.name + ' is weak at both jobs, which means it cannot force anything. Nothing happens until the substrate ionizes on its own, so whatever occurs will be unimolecular — and the solvent is the nucleophile.', { SN1:1, E1:1 });
    } else {
      say('Reagent', 'SN2',
        r.name + ' is a moderate nucleophile and a weak base — it leans toward substitution, without the force to compel it.', { SN2:1 });
    }

    /* --- solvent --- */
    if(solv.id === 'aprotic'){
      say('Solvent', 'SN2',
        'Polar aprotic. There is no O–H to hydrogen-bond to the nucleophile, so the anion is left unsolvated and far more reactive. This is worth orders of magnitude to an SN2 rate.', { SN2:1 });
    } else {
      say('Solvent', weakBoth ? 'SN1/E1' : 'SN1/E1 (mildly)',
        'Polar protic. It hydrogen-bonds to an anionic nucleophile and blunts it, while stabilizing both ions of an ionization. It pushes toward the unimolecular pathways — decisively when the reagent is weak, only mildly when the reagent is strong enough to act anyway.',
        weakBoth ? { SN1:1, E1:1 } : { SN1:0.5, E1:0.5 });
    }

    /* --- temperature --- */
    say('Temperature', heat ? 'elimination' : 'substitution (slightly)',
      heat
        ? 'Heat. Elimination makes more particles from fewer, so it has the larger positive entropy change — and the TΔS term grows with temperature. Heating a mixture that could go either way pushes it toward the alkene.'
        : 'Room temperature. Nothing is being pushed toward elimination by entropy, which slightly favors substitution in any case that is otherwise balanced.',
      heat ? { E1:1, E2:1 } : { SN1:0.25, SN2:0.25 });

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
      out.verdict = 'Very slow, so effectively nothing under these conditions. This is the trap: counting carbons says primary and therefore SN2, but the neighboring quaternary carbon blocks the approach (SN2 here is tens of thousands of times slower than on 1-bromopropane), and there is no beta hydrogen on it to eliminate. ' +
        'Forced under SN1 conditions (long heating in a protic solvent, or a silver salt to pull the bromide off), it does react, but not as neopentyl: a methyl shifts as the bromide leaves, giving a tertiary cation, so the products are rearranged (2-methylbut-2-ene and a tert-pentyl ether or alcohol).';
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
      var bnNu = (r.bulky && r.nu >= 1) ? 3 : r.nu;
      if(r.nu === 0 && strongBase){
        /* DBU and benzyl bromide: a base with nothing to take (no beta
           hydrogen) and a reagent chosen for NOT attacking carbon. Calling
           that SN1 handed back a mechanism with no product. */
        out.major = 'No reaction';
        out.verdict = 'No elimination, and no useful substitution: at most a slow N-alkylation of ' + r.name + ' itself. ' + r.name +
          ' is used to pull a beta proton, and benzyl bromide has none on the ring side. It is chosen for being a poor nucleophile, but a reactive benzylic halide can still slowly alkylate its nitrogen, which consumes the base rather than giving a product anyone wants. Pick a nucleophile to see what this substrate does.';
        out.reasons = reasons;
        return out;
      }
      out.major = bnNu >= 2 ? 'SN2' : 'SN1';
      out.verdict = bnNu >= 2
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
      } else if(r.nu >= 2){
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
      var oneAlkene = sub.hofmann === sub.zaitsev;
      var useHofmann = out.major === 'E2' && r.bulky && !oneAlkene;
      out.product = useHofmann ? sub.hofmann : sub.zaitsev;
      /* Only one alkene can form when every beta hydrogen gives the same
         double bond (1-bromopropane, bromocyclohexane, tert-butyl bromide).
         Calling it "Zaitsev" with a bulky base, and saying the base was
         "small enough to choose", was wrong on both counts. */
      out.alkene = oneAlkene ? null : (useHofmann ? 'Hofmann' : 'Zaitsev');
      out.productNote = oneAlkene
        ? 'The only alkene this substrate can make: every beta hydrogen gives the same double bond, so the Zaitsev/Hofmann question does not arise' + (r.bulky ? ', and the bulky base changes nothing here.' : '.')
        : useHofmann
        ? 'The Hofmann product — the LESS substituted alkene. A bulky base cannot get at the crowded, more substituted beta position, so it takes a proton from the accessible end instead. With an alkyl halide, this is the usual situation where Zaitsev loses.'
        : 'The Zaitsev product — the more substituted alkene, which is the more stable one, and the one you get whenever the base is small enough to choose.' +
          (sub.zaitsevEZ ? ' ' + sub.zaitsevEZ : '');
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

    /* A primary carbon is not an even contest: 1-bromopropane with ethoxide
       gives about 90% ether and 10% alkene. Starting it at 65 showed a third
       of the flask as alkene, which is the wrong lesson about primary
       substrates. */
    if(s.sub.cls === '1' && out.major === 'SN2'){
      lead = 90; why.push('a primary carbon is the SN2 home ground, so even a strong base takes only about a tenth of it as E2');
    }

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
     holding it, and is there a hydrogen on any neighbor. */
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
                   : 'There is no hydrogen on any neighboring carbon, so elimination cannot happen here at all.')
    };
  }

  /* ---- Drawing the flask ------------------------------------------------

     The substrate is drawn, not named, because "secondary" is something you
     read off a structure: the carbon holding the leaving group, the carbons
     on it, the hydrogens next door. The same drawing carries the arrows once
     the mechanism is known, and the product is drawn the same way. Every
     structure is parsed from a condensed formula by mol-builder.js, so the
     drawings are the same objects the rest of the tools use. */
  var B = window.OchemBuilder, Mol = window.OchemMolecules, Chem = window.OchemChem;

  /* {X} is the group on the reacting carbon: Br in the substrate, the
     nucleophile's atom in a substitution product. Rings are built from a
     ring spec because the condensed-formula reader has no ring syntax. */
  var DRAW = {
    mebr:'CH3{X}', prbr:'CH3CH2CH2{X}', neopentyl:'(CH3)3CCH2{X}',
    bubr2:'CH3CH({X})CH2CH3', cyhexbr:{ n:6 }, tbubr:'(CH3)3C({X})',
    mebubr:'CH3C({X})(CH3)CH2CH3', bnbr:{ n:6, aromatic:true, pre:'CH2' }
  };
  var ALKENE = {
    prbr:{ z:'CH3CH=CH2' }, bubr2:{ z:'CH3CH=CHCH3', h:'CH2=CHCH2CH3' },
    cyhexbr:{ z:'cyclohexene' }, tbubr:{ z:'(CH3)2C=CH2' },
    mebubr:{ z:'(CH3)2C=CHCH3', h:'CH2=C(CH3)CH2CH3' }
  };
  /* The atom the reagent attacks with, as it goes into a product formula,
     and as it is drawn beside the substrate. */
  var GROUP = { oh:'OH', oet:'OCH2CH3', otbu:'OC(CH3)3', sh:'SH', cn:'C#N', n3:'N=N+=N-',
                i:'I', nh3:'NH2', h2o:'OH', etoh:'OCH2CH3' };
  var REAGENT_ATOM = {
    oh:{ label:'HO', q:-1, lp:3 }, oet:{ label:'EtO', q:-1, lp:3 }, otbu:{ label:'tBuO', q:-1, lp:3 },
    dbu:{ label:'DBU', q:0, lp:1 }, sh:{ label:'HS', q:-1, lp:3 }, cn:{ label:'CN', q:-1, lp:1 },
    n3:{ label:'N₃', q:-1, lp:1 }, i:{ label:'I', q:-1, lp:4 }, nh3:{ label:'H₃N', q:0, lp:1 },
    h2o:{ label:'H₂O', q:0, lp:2 }, etoh:{ label:'EtOH', q:0, lp:2 }
  };

  function build(draw, x){
    if(!B || !draw) return null;
    var r = typeof draw === 'string'
      ? B.parse(draw.replace('{X}', x))
      : B.parseRing({ n:draw.n, aromatic:draw.aromatic, subs:{ 0:(draw.pre || '') + x } });
    return r && r.st ? r.st : null;
  }

  /* Where things are on a structure: the leaving group, the carbon holding
     it, and the beta carbons with the hydrogens each one has. */
  function sites(st){
    if(!Chem || !st) return null;
    var site = null, lg = null;
    Object.keys(st.atoms).forEach(function(k){
      if(site || !HALIDES[st.atoms[k].el]) return;
      Chem.neighbors(st, k).forEach(function(n){
        if(!site && st.atoms[n] && st.atoms[n].el === 'C'){ site = n; lg = k; }
      });
    });
    if(!site) return null;
    var betas = Chem.neighbors(st, site).filter(function(n){ return st.atoms[n].el === 'C'; })
      .map(function(n){ var a = st.atoms[n]; return { k:n, h: a.hFixed !== undefined ? a.hFixed : (a.hImplicit || 0) }; });
    return { alpha:site, lg:lg, betas:betas,
             betaH: betas.reduce(function(t, b){ return t + b.h; }, 0) };
  }

  /* B.centre() only ever shrinks a drawing; a four-carbon substrate then sits
     small in the middle of the stage with its arrows crammed together. This
     also grows it, up to half again, to fill the 320 by 170 box. */
  function fit(st){
    var ks = Object.keys(st.atoms), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    ks.forEach(function(k){ var a = st.atoms[k], pad = a.r + 12;
      x0 = Math.min(x0, a.x - pad); x1 = Math.max(x1, a.x + pad); y0 = Math.min(y0, a.y - pad); y1 = Math.max(y1, a.y + pad); });
    var sc = Math.min(1.5, 320 / (x1 - x0), 170 / (y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    ks.forEach(function(k){ var a = st.atoms[k];
      a.x = Math.round(160 + (a.x - cx) * sc); a.y = Math.round(85 + (a.y - cy) * sc);
      if(sc < 1) a.r = Math.max(11, Math.round(a.r * sc)); });
  }

  function dist(a, b){ var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx*dx + dy*dy); }

  /* The free direction around an atom: the angle that keeps a new atom at
     distance d furthest from everything already drawn, nudged toward a
     preferred angle (backside of the leaving group, say). */
  function freeSpot(st, k, d, prefer){
    var a = st.atoms[k], best = null, bestScore = -Infinity;
    for(var i = 0; i < 36; i++){
      var ang = i * Math.PI / 18;
      var p = { x: a.x + d * Math.cos(ang), y: a.y + d * Math.sin(ang) };
      var min = Infinity;
      Object.keys(st.atoms).forEach(function(o){ if(o !== k) min = Math.min(min, dist(p, st.atoms[o])); });
      var score = Math.min(min, 90) + (prefer === undefined ? 0 : 26 * Math.cos(ang - prefer));
      if(score > bestScore){ bestScore = score; best = p; }
    }
    return best;
  }

  /* Labels with their hydrogens (CH₃, OH), because a drawing that leaves
     them off cannot show you a beta hydrogen. */
  function toDrawing(st, extraH){
    var mol = Chem.toMolecule(st);
    Object.keys(st.atoms).forEach(function(k){
      var a = st.atoms[k], m = mol.atoms[k];
      if(!a.el || a.group || m.isReagent) return;
      var h = (a.hFixed !== undefined ? a.hFixed : (a.hImplicit || 0)) - ((extraH && extraH[k]) || 0);
      m.label = a.el + (h > 0 ? 'H' + (h > 1 ? Chem.sub(h) : '') : '');
      m.r = Math.max(m.r || 14, m.label.length > 2 ? 17 : 15);
    });
    return mol;
  }

  /* The scene: substrate, reagent beside it, and — once the mechanism is
     known — the curved arrows for its first step. The reagent sits off to
     the side until then, so its position never gives the answer away. */
  function scene(sub, rgt, mech){
    if(!B || !Chem) return null;
    var st = sub.generic ? Chem.clone(sub.st) : build(DRAW[sub.id], 'Br');
    if(!st) return null;
    st = Chem.clone(st);
    var at = sites(st);
    if(!at) return null;
    var ra = REAGENT_ATOM[rgt.id] || { label: rgt.name, q:0, lp:1 };
    var extraH = {}, arrows = [], hKey = null, beta = null;

    if(mech === 'E2' && at.betas.some(function(b){ return b.h > 0; })){
      /* Zaitsev takes the H from the most substituted beta carbon, a bulky
         base from the least, which is the same choice predict() makes. */
      var withH = at.betas.filter(function(b){ return b.h > 0; });
      withH.sort(function(p, q){ return rgt.bulky ? q.h - p.h : p.h - q.h; });
      beta = withH[0].k;
      var hp = freeSpot(st, beta, 34);
      hKey = 'hBeta';
      st.atoms[hKey] = { el:'H', label:'H', x:hp.x, y:hp.y, r:11, lp:0, charge:0, hImplicit:0 };
      st.bonds.push({ a:beta, b:hKey, order:1 });
      extraH[beta] = 1;
    }

    var A = st.atoms[at.alpha], L = st.atoms[at.lg];
    var pos;
    if(mech === 'SN2'){
      pos = freeSpot(st, at.alpha, 70, Math.atan2(A.y - L.y, A.x - L.x));
    } else if(hKey){
      var H = st.atoms[hKey], Bt = st.atoms[beta];
      var ux = (H.x - Bt.x) / (dist(H, Bt) || 1), uy = (H.y - Bt.y) / (dist(H, Bt) || 1);
      pos = { x: H.x + ux * 56, y: H.y + uy * 56 };
    } else {
      var minX = Infinity, sumY = 0, n = 0;
      Object.keys(st.atoms).forEach(function(k){ minX = Math.min(minX, st.atoms[k].x); sumY += st.atoms[k].y; n++; });
      pos = { x: minX - 74, y: sumY / n };
    }
    st.atoms.rgt = { el: null, group: true, label: ra.label, x: pos.x, y: pos.y,
                     r: ra.label.length > 3 ? 23 : (ra.label.length > 2 ? 20 : 17), lp: ra.lp, charge: ra.q, hImplicit: 0 };

    if(mech === 'SN2'){
      arrows = [{ from:'rgt', to:at.alpha }, { from:'bond:' + at.alpha + '-' + at.lg, to:at.lg }];
    } else if(mech === 'E2' && hKey){
      arrows = [{ from:'rgt', to:hKey }, { from:'bond:' + beta + '-' + hKey, to:'bond:' + at.alpha + '-' + beta },
                { from:'bond:' + at.alpha + '-' + at.lg, to:at.lg }];
    } else if(mech === 'SN1' || mech === 'E1'){
      arrows = [{ from:'bond:' + at.alpha + '-' + at.lg, to:at.lg }];
    }

    fit(st);
    var mol = toDrawing(st, extraH);
    mol.atoms.rgt.label = ra.label;
    mol.atoms.rgt.charge = ra.q ? Chem.chargeGlyph(ra.q) : '';
    mol.viewBox = '0 0 320 170';
    return { mol: mol, arrows: arrows, at: at, lgEl: st.atoms[at.lg].el };
  }

  function productDrawing(sub, rgt, p){
    if(!B || !Chem) return null;
    if(sub.generic || !p.product || p.product === '—') return null;
    var st = null;
    if(p.major === 'SN1' || p.major === 'SN2'){
      if(!GROUP[rgt.id]) return null;
      st = build(DRAW[sub.id], GROUP[rgt.id]);
    } else if(ALKENE[sub.id]){
      var alk = ALKENE[sub.id], src = p.alkene === 'Hofmann' && alk.h ? alk.h : alk.z;
      var r = B.parse(src);
      st = r && r.st;
    }
    if(!st) return null;
    fit(st);
    var mol = toDrawing(st);
    mol.viewBox = '0 0 320 170';
    return mol;
  }

  /* ---- The page ---------------------------------------------------------- */

  var PATHS = ['SN1', 'SN2', 'E1', 'E2'];
  var CORNER = { SN1:[25, 30], SN2:[75, 30], E1:[25, 70], E2:[75, 70] };
  var SHORT = { mebr:'CH₃Br', prbr:'1° propyl', neopentyl:'Neopentyl', bubr2:'2° butyl', cyhexbr:'Cyclohexyl',
                tbubr:'3° butyl', mebubr:'3° pentyl', bnbr:'Benzyl' };

  /* Landing order (owner brief 2026-10-09): one mode switch and one plain
     first step, then the flask and the two choices that matter most
     (substrate, reagent). Solvent, heat, Shuffle and Draw your own sit behind
     one disclosure whose summary always says the current solvent and
     temperature, so nothing that decides the answer is hidden from view. The
     meter and the product are the payoff, side by side on a wide screen; the
     verdict in full and the four arguments are behind "Why?". Nothing here
     is sticky: the two rows are aligned grid rows, so no panel can slide
     over another while scrolling. */
  root.innerHTML =
    '<div class="tool-modes">' +
      '<div class="tseg" id="rpMode" role="group" aria-label="Mode">' +
        '<button type="button" data-mode="explore" class="on" aria-pressed="true">Explore</button>' +
        '<button type="button" data-mode="predict" aria-pressed="false">Predict first</button>' +
      '</div>' +
      '<p class="tool-step" id="rpStep"></p>' +
    '</div>' +
    '<div class="rp-grid">' +
      '<div class="tpanel rp-flask">' +
        '<div class="tpanel__head"><span>The flask</span></div>' +
        '<div class="rp-stage tstage" id="rpStage"></div>' +
        '<p class="rp-read" id="rpRead"></p>' +
      '</div>' +
      '<div class="tpanel rp-ctl">' +
        '<div class="tpanel__head"><span>Change the flask</span></div>' +
          '<p class="rp-k" id="rpSubK"><span class="rp-n">1</span>Substrate</p>' +
          '<div class="tchips rp-chips" id="rpSub" role="group" aria-labelledby="rpSubK"></div>' +
          '<p class="rp-k" id="rpRgtK"><span class="rp-n">2</span>Reagent</p>' +
          '<div class="tchips rp-chips" id="rpRgt" role="group" aria-labelledby="rpRgtK"></div>' +
          '<p class="rp-rgtnote" id="rpRgtNote"></p>' +
          '<details class="tool-more" id="rpOpts"><summary><span class="rp-n">3</span>Solvent and heat <span class="tool-more__now" id="rpOptsNow"></span></summary>' +
            '<div class="rp-pair">' +
              '<div><p class="rp-k" id="rpSolvK">Solvent</p>' +
                '<div class="tseg" id="rpSolv" role="group" aria-labelledby="rpSolvK"></div></div>' +
              '<div><p class="rp-k" id="rpHeatK">Temperature</p>' +
                '<div class="tseg" id="rpHeat" role="group" aria-labelledby="rpHeatK">' +
                  '<button type="button" data-heat="0" class="on" aria-pressed="true">Room temp</button>' +
                  '<button type="button" data-heat="1" aria-pressed="false">Heat</button>' +
                '</div></div>' +
            '</div>' +
            '<div class="trow rp-more">' +
              '<button type="button" class="tchip" id="rpShuffle">Shuffle the flask</button>' +
              '<button type="button" class="tchip tchip--ghost" id="rpBuildToggle">Draw your own substrate &rarr;</button>' +
            '</div>' +
            '<div id="rpBuilder" hidden></div>' +
            '<div id="rpBuildMsg"></div>' +
            '<div id="rpSend"></div>' +
          '</details>' +
      '</div>' +
      '<div class="tpanel rp-side">' +
        '<div class="tpanel__head"><span id="rpMeterH">Where the flask goes</span><span class="tmuted" id="rpScore"></span></div>' +
        '<div class="rp-cols" aria-hidden="true"><span>Cation first<br><i>unimolecular</i></span><span>One concerted step<br><i>bimolecular</i></span></div>' +
        '<div class="rp-meter" id="rpMeter">' +
          '<span class="rp-axis rp-axis--top">Substitution</span>' +
          '<span class="rp-axis rp-axis--bot">Elimination</span>' +

          PATHS.map(function(m){
            return '<button type="button" class="rp-corner" data-path="' + m + '" id="rpC' + m + '">' +
              '<span class="rp-corner__name">' + m + '</span><span class="rp-corner__pct"></span>' +
              '<span class="rp-corner__why"></span></button>';
          }).join('') +
          '<span class="rp-puck" id="rpPuck" aria-hidden="true"></span>' +
          '<button type="button" class="rp-none" id="rpNone" data-path="No reaction">No reaction</button>' +
          '<div class="rp-cover" id="rpCover">Tap the corner you think wins.<br><span>Then the pull appears.</span></div>' +
        '</div>' +
        '<p class="rp-delta" id="rpDelta"></p>' +
        '<div class="sr-only" aria-live="polite" id="rpLive"></div>' +
      '</div>' +
      '<div class="tpanel rp-out" id="rpVerdict"></div>' +
    '</div>';

  /* ---- Draw your own substrate ------------------------------------------- */
  var rpBuilderApi = null;
  var rpSendApi = null;
  var rpLastBuilt = null;

  document.getElementById('rpBuildToggle').addEventListener('click', function(){
    var box = document.getElementById('rpBuilder');
    var msg = document.getElementById('rpBuildMsg');
    var open = box.hidden;
    box.hidden = !open;
    this.classList.toggle('on', open);
    this.textContent = open ? 'Hide the builder' : 'Draw your own substrate →';
    if(open && !rpBuilderApi && window.OchemBuilderUI){
      if(window.OchemToolHandoff){
        rpSendApi = window.OchemToolHandoff.mountSend(
          document.getElementById('rpSend'), function(){ return rpLastBuilt; });
      }
      rpBuilderApi = window.OchemBuilderUI.mount(box, {
        onChange: function(st, rep){
          rpLastBuilt = (rep.empty || !rep.ok) ? null : st;
          if(rpSendApi) rpSendApi.refresh();
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
          sub.st = Chem.clone(st);
          state.sub = sub;
          paintChips();
          reset('Your drawing');
        }
      });
    }
  });

  var elSub = document.getElementById('rpSub');
  var elRgt = document.getElementById('rpRgt');
  var elSolv = document.getElementById('rpSolv');
  var elHeat = document.getElementById('rpHeat');

  elSub.innerHTML = SUBSTRATES.map(function(s){
    return '<button type="button" class="tchip" data-sub="' + s.id + '" aria-label="' + esc(s.name) + '">' + esc(SHORT[s.id] || s.name) + '</button>';
  }).join('');
  elRgt.innerHTML = REAGENTS.map(function(r){
    return '<button type="button" class="tchip" data-rgt="' + r.id + '" aria-label="' + esc(r.name + ': ' + r.kind) + '">' + esc(r.name) + '</button>';
  }).join('');
  elSolv.innerHTML = SOLVENTS.map(function(s, i){
    return '<button type="button" data-solv="' + s.id + '"' + (i === 0 ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') +
      ' title="' + esc(s.example) + '">' + esc(s.name) + '</button>';
  }).join('');

  function find(list, id){
    for(var i=0;i<list.length;i++) if(list[i].id === id) return list[i];
    return null;
  }

  function press(box, attr, val){
    box.querySelectorAll('[' + attr + ']').forEach(function(b){
      var on = b.getAttribute(attr) === val;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function paintChips(){
    press(elSub, 'data-sub', state.sub.generic ? '' : state.sub.id);
    press(elRgt, 'data-rgt', state.rgt.id);
    press(elSolv, 'data-solv', state.solvent.id);
    press(elHeat, 'data-heat', state.heat ? '1' : '0');
    press(document.getElementById('rpMode'), 'data-mode', state.mode);
  }

  elSub.addEventListener('click', function(e){
    var b = e.target.closest('[data-sub]'); if(!b) return;
    state.sub = find(SUBSTRATES, b.getAttribute('data-sub')) || state.sub; paintChips(); reset('Substrate');
  });
  elRgt.addEventListener('click', function(e){
    var b = e.target.closest('[data-rgt]'); if(!b) return;
    state.rgt = find(REAGENTS, b.getAttribute('data-rgt')) || state.rgt; paintChips(); reset('Reagent');
  });
  elSolv.addEventListener('click', function(e){
    var b = e.target.closest('[data-solv]'); if(!b) return;
    state.solvent = find(SOLVENTS, b.getAttribute('data-solv')) || state.solvent; paintChips(); reset('Solvent');
  });
  elHeat.addEventListener('click', function(e){
    var b = e.target.closest('[data-heat]'); if(!b) return;
    state.heat = b.getAttribute('data-heat') === '1'; paintChips(); reset('Temperature');
  });
  document.getElementById('rpMode').addEventListener('click', function(e){
    var b = e.target.closest('[data-mode]'); if(!b) return;
    state.mode = b.getAttribute('data-mode'); paintChips(); prev = null; reset();
  });
  document.getElementById('rpShuffle').addEventListener('click', shuffle);

  /* ---- Tool Studio (docs/tools-calm.md) -----------------------------------
     With the studio on (registry `studio: true`; tool-shell.js mounts it), the
     same elements are moved into the calm frame: the flask and the meter on
     the stage, the mode switch, substrate, reagent and "Solvent and heat" in
     the dock, the reasons in Why and the numbers in Details. The engine,
     the listeners and the URL state are the ones above. */
  var studio = window.OchemStudio || null, ls = null;
  if(studio){
    var byId = function(id){ return document.getElementById(id); };
    var box = function(cls, kids){ var d = document.createElement('div'); d.className = cls; kids.forEach(function(k){ if(k) d.appendChild(k); }); return d; };
    byId('rpSub').classList.add('ls-scroll'); byId('rpRgt').classList.add('ls-scroll');
    ['rpSubK', 'rpRgtK'].forEach(function(id){ byId(id).classList.add('ls-lbl'); });
    var next = document.createElement('button');
    next.type = 'button'; next.className = 'ls-btn ls-pri rp-ls-next'; next.textContent = 'Next flask'; next.hidden = true;
    next.addEventListener('click', shuffle);
    var det = document.createElement('div'); det.id = 'rpDetails'; det.className = 'ls-sec';
    studio.root.classList.add('rp-ls');
    studio.add('stage', [byId('rpStage'), box('rp-ls-meter', [root.querySelector('.rp-cols'), byId('rpMeter')])]);
    studio.add('dock', [next, box('rp-ls-pick', [byId('rpSubK'), byId('rpSub')]), box('rp-ls-pick', [byId('rpRgtK'), byId('rpRgt'), byId('rpRgtNote')]), byId('rpOpts')]);
    studio.add('why', [byId('rpVerdict'), byId('rpRead'), byId('rpDelta'), byId('rpLive')]);
    studio.details.insertBefore(det, studio.details.firstChild);
    // The tool's own mode switch goes to the top of the dock.
    studio.root.querySelector('.ls-modes').appendChild(byId('rpMode'));
    byId('rpMode').classList.add('ls-seg');
    root.hidden = true;
    ls = { next: next, det: det };
  }
  var CLS_SHORT = { methyl:'methyl', '1':'1°', '1-hindered':'hindered 1°', '2':'2°', '3':'3°', benzylic:'benzylic' };
  function upper(s){ s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

  /* The studio's view of one render: caption, stage pills, the Why sheet
     (the four arguments as numbered reasons, the product, the links) and
     Details (the split, a path table, the reagent). */
  function studioRender(p, sh, show){
    var mix = mixture(state, p), pred = state.mode === 'predict', none = p.major === 'No reaction';
    var share = function(m){ return sh && sh[m] ? '≈' + sh[m] + '%' : '—'; };
    var result = none ? 'no reaction' : (p.minor ? 'mostly ' + p.major + ', some ' + p.minor : p.major);
    var head = '<b>' + esc(state.sub.name) + ' + ' + esc(state.rgt.name) + '.</b> ';
    var cls = CLS_SHORT[state.sub.cls] || '';
    var kind = upper(esc(state.rgt.kind.toLowerCase()));
    if(pred && !state.revealed){
      studio.caption(head + 'Which path wins? Tap the tile you think wins.');
      studio.pills([{ html: 'Your call', tone: 'ghost' }]);
    } else if(pred){
      var right = state.guess === p.major;
      studio.caption('<b>' + (right ? 'Correct: ' + esc(p.major) + '.' : 'Not quite: it is ' + esc(p.major) + ', not ' + esc(state.guess) + '.') + '</b> ' +
        kind + (cls ? ' on a ' + cls + ' carbon.' : '.'));
      studio.pills([{ html: (right ? 'Correct: ' : 'It is ') + esc(p.major), tone: right ? 'good' : 'bad' },
        state.score.total ? { html: state.score.right + ' of ' + state.score.total + ' right', tone: 'ghost' } : null]);
    } else {
      studio.caption(head + kind + (cls ? ' on a ' + cls + ' carbon' : '') + ': ' + esc(result) + '.');
      studio.pills(none ? [{ html: 'No reaction', tone: 'ghost' }]
        : [{ html: (p.minor ? 'Mostly ' : '') + esc(p.major) }, p.minor ? { html: 'some ' + esc(p.minor), tone: 'ghost' } : null]);
    }
    studio.pills([{ html: esc(state.solvent.example.split(',')[0]) + ' · ' + (state.heat ? 'heat' : '25 °C'), tone: 'ghost' }], 'right');
    studio.mode(state.mode);
    ls.next.hidden = !(pred && state.revealed);

    var elV = document.getElementById('rpVerdict');
    if(!show){
      elV.innerHTML = '<h3 class="ls-title-l">Make your call first</h3><p>Read the flask, then tap the tile on the stage you think wins. The reasons appear here after you choose.</p>';
      ls.det.innerHTML = '<h3 class="ls-title-l">The numbers</h3><p class="ls-sub">The split between the four paths appears after your call.</p>';
      return;
    }
    var title = none ? 'Why nothing happens here' : p.minor ? 'Why ' + p.major + ' wins, with some ' + p.minor : 'Why ' + p.major + ' wins here';
    var why = mix && mix[2] && mix[2].why && mix[2].why.length ? mix[2].why.join(', and ') : null;
    var pm = productDrawing(state.sub, state.rgt, p), link = MECH_LINK[p.major];
    var html = '<h3 class="ls-title-l">' + esc(title) + '</h3>' +
      '<ol class="ls-steps">' + p.reasons.map(function(r){
        return '<li><span><span class="ls-k">' + esc(r.factor) + '</span> argues ' + esc(r.leans) + '. ' + esc(r.text) + '</span></li>';
      }).join('') + '</ol>' +
      '<p>' + esc(p.verdict) + '</p>' +
      (mix && mix.length > 1 ? '<p class="tmuted"><b>Roughly what you get.</b> These are competitions, not switches: a real flask gives you both, and the useful question is how lopsided. ' +
        (why ? 'Here ' + esc(why) + '. ' : '') + 'Treat the split as a band rather than a yield: the actual numbers move with concentration, the exact solvent and how long it was left.</p>' : '');
    if(p.product && p.product !== '—'){
      html += '<div class="rp-ls-product">' + (pm && Mol ? Mol.svg(pm, { caption:'', label:'Major product: ' + p.product }) : '') +
        '<p><span class="ls-sub">Major product' + (p.alkene ? ' · ' + esc(p.alkene) : '') + '</span><br><b class="tformula">' + esc(p.product) + '</b> + Br⁻</p></div>';
    }
    if(p.productNote) html += '<p><b>' + (p.product && p.product !== '—' ? 'The product.' : 'Product.') + '</b> ' + esc(p.productNote) + '</p>';
    html += '<p class="tmuted">' + esc(state.sub.note) + '</p><p class="tmuted">' + esc(state.solvent.note) + '</p>' +
      '<div class="ls-tags">' + (link ? '<a class="ls-tag" href="arrow-pusher.html?start=' + encodeURIComponent(link.id) + '">' + esc(link.label) + ' in Arrow Pusher &rarr;</a>' : '') +
      '<button type="button" class="ls-tag" data-ls-act="tutor">Ask the tutor</button></div>' +
      '<h3 class="ls-h">What the drawing shows</h3>';
    elV.innerHTML = html;

    var d = '<h3 class="ls-title-l">' + esc(p.major) + (p.minor ? ', some ' + esc(p.minor) : '') + '</h3>';
    if(mix && mix.length > 1){
      d += '<div class="rp-mix" role="img" aria-label="Roughly ' + esc(mix[0].path) + ' ' + mix[0].pct + '%, ' + esc(mix[1].path) + ' ' + mix[1].pct + '%">' +
        mix.slice(0, 2).map(function(m, i){ return '<div class="rp-mix__bar' + (i === 0 ? ' is-major' : '') + '" style="flex:' + m.pct + ';"><span>' + esc(m.path) + '</span><b>' + m.pct + '%</b></div>'; }).join('') + '</div>';
    }
    d += '<table class="ls-tbl"><caption class="sr-only">Each path: its share of the product and what argues for it</caption><thead><tr><th scope="col">Path</th><th scope="col">Share</th><th scope="col">Driven by</th></tr></thead><tbody>' +
      PATHS.map(function(m){
        var blocked = p.blocked && p.blocked[m];
        var pulls = (p.reasons || []).filter(function(r){ return r.votes && r.votes[m]; }).map(factorShort);
        return '<tr' + (m === p.major ? ' class="hl"' : '') + '><th scope="row">' + m + '</th><td>' + (blocked ? 'blocked' : share(m)) + '</td><td>' +
          esc(blocked || (pulls.length ? pulls.join(', ').toLowerCase() : 'nothing here')) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<p><b>' + esc(state.rgt.name) + '</b>: ' + esc(state.rgt.kind) + '. <span class="tmuted">Nucleophile ' + state.rgt.nu + ' of 4, base ' + state.rgt.base + ' of 4.</span></p>' +
      '<p class="tmuted">' + esc(state.sub.name) + ' in ' + esc(state.solvent.name.toLowerCase()) + ' solvent (' + esc(state.solvent.example) + '), ' + (state.heat ? 'heated' : 'room temperature') + '.</p>';
    ls.det.innerHTML = d;
  }

  /* The meter's corners are the prediction buttons in Predict first, and in
     Explore they say why that pathway is or is not happening. */
  var focusPath = null;
  document.getElementById('rpMeter').addEventListener('click', function(e){
    var b = e.target.closest('[data-path]'); if(!b) return;
    var path = b.getAttribute('data-path');
    if(state.mode === 'predict' && !state.revealed){
      state.guess = path;
      reveal();
      return;
    }
    focusPath = focusPath === path ? null : path;
    render();
  });

  /* Changing any input puts the answer away again in Predict first: leaving
     the previous verdict on screen would let you read off the new answer
     without making a second prediction. In Explore the meter moves at once,
     and the line under it says what that one change did. */
  var prev = null, changed = null;
  function reset(what){
    changed = what || null;
    state.guess = null;
    state.revealed = false;
    focusPath = null;
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
      heat: state.heat ? 1 : null,
      mode: state.mode === 'predict' ? 'predict' : null
    });
  }

  function shares(p){
    var out = { SN1:0, SN2:0, E1:0, E2:0 };
    var mix = mixture(state, p);
    if(!mix) return null;
    mix.slice(0, 2).forEach(function(m){ if(m.path in out) out[m.path] = m.pct; });
    return out;
  }

  function sayShares(sh, p){
    if(!sh) return 'no reaction worth writing down';
    return PATHS.filter(function(m){ return sh[m]; }).sort(function(a, b){ return sh[b] - sh[a]; })
      .map(function(m){ return m + ' about ' + sh[m] + '%'; }).join(', ');
  }

  function factorShort(r){ return r.factor === 'Temperature' ? (state.heat ? 'Heat' : 'Room temp') : r.factor; }

  function render(){
    var p = predict(state);
    var show = state.mode === 'explore' || state.revealed;
    var sh = shares(p);
    sync();

    document.getElementById('rpStep').innerHTML = state.mode === 'predict'
      ? (state.revealed ? 'Change anything, or tap <b>Next flask</b>, to try another.'
                        : '<b>Read the flask, then tap the corner of the meter you think wins.</b>')
      : '<b>Pick a substrate and a reagent.</b> The meter shows which mechanism wins.';
    document.getElementById('rpOptsNow').textContent = '· ' + state.solvent.name + ', ' + (state.heat ? 'heat' : 'room temp');

    document.getElementById('rpScore').textContent =
      state.mode === 'predict' && state.score.total ? state.score.right + ' of ' + state.score.total + ' right' : '';

    /* The stage. */
    var sc = scene(state.sub, state.rgt, show ? p.major : null);
    var stage = document.getElementById('rpStage');
    if(sc && Mol){
      stage.innerHTML = Mol.svg(sc.mol, {
        highlight: [sc.at.alpha, sc.at.lg], arrows: show ? sc.arrows : [], caption: '',
        label: state.sub.name + ' with ' + state.rgt.name + (show && sc.arrows.length ? ', with the curved arrows for ' + p.major : '')
      }) +
      '<div class="rp-cond" aria-hidden="true"><span>' + esc(state.solvent.example) + '</span><span class="rp-cond__arrow"></span><span>' + (state.heat ? 'heat' : '25 °C') + '</span></div>';
    } else {
      stage.innerHTML = '<p class="tformula" style="text-align:center;">' + esc(state.sub.formula) + ' + ' + esc(state.rgt.name) + '</p>';
    }
    var at = sc && sc.at;
    var lgIon = sc ? ({ Br:'bromide', Cl:'chloride', I:'iodide', F:'fluoride' })[sc.lgEl] || 'the leaving group' : 'bromide';
    var cls = ({ methyl:'methyl', '1':'primary (1°)', '1-hindered':'primary, but hindered', '2':'secondary (2°)',
                 '3':'tertiary (3°)', benzylic:'benzylic' })[state.sub.cls];
    document.getElementById('rpRead').innerHTML = at
      ? '<b>' + esc(state.sub.name) + '.</b> The carbon holding ' + esc(sc.lgEl) + ' is <b>' + esc(cls) + '</b>' +
        ' and has <b>' + at.betaH + ' β-hydrogen' + (at.betaH === 1 ? '' : 's') + '</b> next door' +
        (at.betaH ? '.' : ', so nothing can eliminate.') +
        (show && sc.arrows.length ? ' <span class="rp-read__arrows">Arrows: ' + (p.major === 'SN2' ? 'the nucleophile hits the back of the carbon as ' + lgIon + ' leaves, in one step.'
            : p.major === 'E2' ? 'the base takes a β-hydrogen, that C–H pair becomes the π bond, and ' + lgIon + ' leaves, all at once.'
            : 'step 1 only: the C–' + sc.lgEl + ' bond breaks on its own and leaves a carbocation; ' + (p.major === 'SN1'
                ? (state.rgt.nu <= 1 ? 'the solvent attacks it next.' : 'the nucleophile from ' + state.rgt.name + ' attacks it next.')
                : 'a β-hydrogen is lost from it next.')) + '</span>' : '')
      : '';

    var rgtNote = document.getElementById('rpRgtNote');
    rgtNote.innerHTML = '<span class="rp-meters" aria-hidden="true">' +
        '<span>Nucleophile</span><span class="rp-bar"><i style="width:' + (state.rgt.nu * 25) + '%"></i></span>' +
        '<span>Base</span><span class="rp-bar"><i style="width:' + (state.rgt.base * 25) + '%"></i></span></span>' +
      '<b>' + esc(state.rgt.name) + '</b>: ' + esc(state.rgt.kind) + '.';

    /* The meter. */
    var meter = document.getElementById('rpMeter');
    meter.classList.toggle('is-covered', !show);
    meter.classList.toggle('is-predict', state.mode === 'predict' && !state.revealed);
    document.getElementById('rpMeterH').textContent = show ? 'Where the flask goes' : 'Your call';
    PATHS.forEach(function(m){
      var c = document.getElementById('rpC' + m);
      var blocked = p.blocked && p.blocked[m];
      var pct = sh ? sh[m] : 0;
      var pulls = (p.reasons || []).filter(function(r){ return r.votes && r.votes[m]; });
      c.classList.toggle('is-blocked', show && !!blocked);
      c.classList.toggle('is-win', show && p.major === m);
      c.classList.toggle('is-minor', show && p.minor === m);
      c.classList.toggle('is-focus', focusPath === m);
      c.classList.toggle('is-guess', state.guess === m);
      if(c.style.setProperty) c.style.setProperty('--pct', show ? pct : 0);
      c.querySelector('.rp-corner__pct').textContent = show ? (blocked ? 'blocked' : (pct ? '≈' + pct + '%' : '—')) : '';
      c.querySelector('.rp-corner__why').innerHTML = !show ? '' : blocked
        ? '<span class="rp-x">' + esc(blocked) + '</span>'
        : pulls.map(function(r){
            return '<span class="rp-pull' + (r.votes[m] < 1 ? ' is-soft' : '') + '">' + esc(factorShort(r)) + '</span>';
          }).join('');
      c.setAttribute('aria-label', state.mode === 'predict' && !state.revealed
        ? 'Predict ' + m
        : m + ': ' + (blocked ? 'blocked. ' + blocked : (pct ? 'about ' + pct + '% of the product' : 'not the main pathway') +
          (pulls.length ? '. Argued for by ' + pulls.map(factorShort).join(', ') : '')) + '. Tap for why.');
    });
    var none = document.getElementById('rpNone');
    none.hidden = !(state.mode === 'predict' && !state.revealed) && p.major !== 'No reaction';
    none.classList.toggle('is-win', show && p.major === 'No reaction');
    none.classList.toggle('is-guess', state.guess === 'No reaction');
    var puck = document.getElementById('rpPuck');
    var px = 50, py = 50;
    if(show && sh){
      px = 0; py = 0;
      PATHS.forEach(function(m){ px += CORNER[m][0] * sh[m] / 100; py += CORNER[m][1] * sh[m] / 100; });
    }
    puck.style.left = px + '%';
    puck.style.top = py + '%';
    puck.classList.toggle('is-none', show && !sh);
    puck.hidden = !show;

    /* What the last change did. */
    var delta = document.getElementById('rpDelta');
    var now = { major: p.major, sh: sh };
    var line = '';
    if(show && prev && changed){
      if(prev.major !== now.major){
        line = '<b>' + esc(changed) + '</b> changed the winner: ' + esc(prev.major) + ' → <b>' + esc(now.major) + '</b>.';
      } else if(prev.sh && now.sh){
        var moved = PATHS.filter(function(m){ return prev.sh[m] !== now.sh[m] && now.sh[m]; })[0];
        line = moved
          ? '<b>' + esc(changed) + '</b> moved ' + moved + ' from ' + prev.sh[moved] + '% to ' + now.sh[moved] + '%; ' + esc(now.major) + ' still wins.'
          : '<b>' + esc(changed) + '</b> made no difference here: ' + esc(now.major) + ' either way.';
      } else {
        line = '<b>' + esc(changed) + '</b> made no difference here.';
      }
    }
    delta.innerHTML = line;
    if(show) prev = now;
    changed = null;

    document.getElementById('rpLive').textContent =
      state.sub.name + ' with ' + state.rgt.name + ', ' + state.solvent.name.toLowerCase() + ' solvent, ' +
      (state.heat ? 'heated' : 'room temperature') + '. ' +
      (show ? (p.major === 'No reaction' ? 'No reaction.' : 'Result: ' + sayShares(sh, p) + '.') : 'Make your prediction.');

    if(ls){ studioRender(p, sh, show); return; }

    /* The verdict. */
    var elV = document.getElementById('rpVerdict');
    if(!show){ elV.innerHTML = ''; return; }

    /* The payoff, short: the call (or your result), the split as a bar, the
       product. Everything that explains it, the verdict in full, why the
       split is not even, the product note and the four arguments, opens
       under "Why?". */
    var html = '<div class="tpanel__head"><span>What you get</span></div>';
    var mix = mixture(state, p);
    if(state.mode === 'predict'){
      var right = state.guess === p.major;
      html += '<div class="tnote ' + (right ? 'tnote--good' : 'tnote--bad') + '" tabindex="-1" id="rpCall">' +
        '<span class="tnote__k">' + (right ? 'Correct: ' + esc(p.major) : 'Not quite: it is ' + esc(p.major) + ', not ' + esc(state.guess)) + '</span>' +
        (p.minor ? 'With some ' + esc(p.minor) + ' alongside it.' : (p.major === 'No reaction' ? 'Nothing worth writing down happens here.' : 'One clear winner.')) + '</div>';
    } else if(focusPath){
      var fb = p.blocked && p.blocked[focusPath];
      var fr = (p.reasons || []).filter(function(r){ return r.votes && r.votes[focusPath]; });
      html += '<div class="tnote tnote--info"><span class="tnote__k">Why ' + (fb ? 'not ' : '') + esc(focusPath) + (fb ? '' : ' (' + (sh && sh[focusPath] ? '≈' + sh[focusPath] + '%' : 'not the main pathway') + ')') + '</span>' +
        (fb ? esc(fb) + ' ' : '') +
        (fr.length && !fb ? fr.map(function(r){ return '<b>' + esc(factorShort(r)) + ':</b> ' + esc(r.text); }).join(' ') : '') +
        (!fb && !fr.length ? 'Nothing in this flask argues for it.' : '') + '</div>';
    }
    html += '<p class="rp-call"><b>' + esc(p.major) + '</b>' + (p.minor ? ', some ' + esc(p.minor) : '') + '</p>';

    if(mix && mix.length > 1){
      html += '<div class="rp-mix" role="img" aria-label="Roughly ' + esc(mix[0].path) + ' ' + mix[0].pct + '%, ' + esc(mix[1].path) + ' ' + mix[1].pct + '%">' +
          mix.slice(0, 2).map(function(m, i){
            return '<div class="rp-mix__bar' + (i === 0 ? ' is-major' : '') + '" style="flex:' + m.pct + ';">' +
              '<span>' + esc(m.path) + '</span><b>' + m.pct + '%</b></div>';
          }).join('') +
        '</div>';
    }

    var pm = productDrawing(state.sub, state.rgt, p);
    if(p.product && p.product !== '—'){
      html += '<div class="rp-product"><span class="tnote__k">Major product' +
        (p.alkene ? ' · ' + esc(p.alkene) : '') + '</span>' +
        (pm && Mol ? Mol.svg(pm, { caption:'', label:'Major product: ' + p.product }) : '') +
        '<span class="tformula">' + esc(p.product) + '</span> <span class="tmuted">+ Br⁻</span>' +
      '</div>';
    }

    var why = mix && mix[2] && mix[2].why && mix[2].why.length ? mix[2].why.join(', and ') : null;
    html += '<details class="tool-more tool-more--why"' + (state.mode === 'predict' && state.guess !== p.major ? ' open' : '') + '><summary>Why?</summary>' +
      '<p>' + esc(p.verdict) + '</p>' +
      (mix && mix.length > 1
        ? '<p class="tmuted"><b>Roughly what you get.</b> These are competitions, not switches: a real flask gives you both, and the useful question is how lopsided. ' +
          (why ? 'Here ' + esc(why) + '. ' : '') +
          'Treat the split as a band rather than a yield: the actual numbers move with concentration, the exact solvent and how long it was left.</p>'
        : '') +
      (p.productNote ? '<p><b>' + (p.product && p.product !== '—' ? 'The product.' : 'Product.') + '</b> ' + esc(p.productNote) + '</p>' : '') +
      '<p class="rp-k">The four arguments</p>' +
      p.reasons.map(function(r){
        return '<p><b>' + esc(r.factor) + '</b> <span class="tmuted">argues ' + esc(r.leans) + '.</span> ' + esc(r.text) + '</p>';
      }).join('') +
      '<p class="tmuted">' + esc(state.sub.note) + '</p><p class="tmuted">' + esc(state.solvent.note) + '</p></details>';

    var link = MECH_LINK[p.major];
    html += '<div class="trow" style="margin-top:10px;">' +
      (state.mode === 'predict' ? '<button type="button" class="tchip" id="rpNext">Next flask</button>' : '') +
      (link ? '<a class="tchip tchip--ghost" href="arrow-pusher.html?start=' + encodeURIComponent(link.id) + '">' +
          esc(link.label) + ' in the Arrow Pusher &rarr;</a>' : '') +
    '</div>';
    elV.innerHTML = html;
    var nx = document.getElementById('rpNext');
    if(nx) nx.addEventListener('click', shuffle);
    var call = document.getElementById('rpCall');
    if(call && state.guess && window.matchMedia && window.matchMedia('(max-width: 820px)').matches){
      call.focus({ preventScroll: true });
      if(window.LevlMotion) window.LevlMotion.scrollIntoView(call, { block:'nearest' });
    }
  }

  /* A random setup, so the tool can be used as a drill rather than only as a
     lookup. Deliberately picks from every substrate class. */
  function shuffle(){
    state.sub = SUBSTRATES[Math.floor(Math.random() * SUBSTRATES.length)];
    state.rgt = REAGENTS[Math.floor(Math.random() * REAGENTS.length)];
    state.solvent = SOLVENTS[Math.floor(Math.random() * SOLVENTS.length)];
    state.heat = Math.random() < 0.4;
    paintChips();
    prev = null;
    reset();
  }

  if(window.OchemToolState){
    var q = window.OchemToolState.read();
    var qs = find(SUBSTRATES, q.sub), qr = find(REAGENTS, q.rgt), qv = find(SOLVENTS, q.solv);
    if(qs) state.sub = qs;
    if(qr) state.rgt = qr;
    if(qv) state.solvent = qv;
    state.heat = q.heat === '1';
    if(q.mode === 'predict') state.mode = 'predict';
  }
  paintChips();
  render();
  if(studio){
    studio.hint(state.mode === 'predict'
      ? { target: document.getElementById('rpCE2'), text: 'Tap the path you think wins', round: 14 }
      : { target: document.getElementById('rpRgt').querySelector('.tchip:not(.on)'), text: 'Try another reagent' });
  }

  // A substrate drawn in another tool and sent here.
  if(window.OchemToolState){
    var q2 = window.OchemToolState.read();
    if(q2.build && window.OchemToolHandoff){
      var rpToggle = document.getElementById('rpBuildToggle');
      if(rpToggle){
        document.getElementById('rpOpts').open = true;
        rpToggle.click();
        if(rpBuilderApi) rpBuilderApi.build(q2.build);
      }
    }
  }

  /* For scripts/test/ochem-tools-upgrade.test.mjs: the engine and the
     drawings, so the meter and the product structures can be checked against
     the verdict they illustrate. */
  window.OchemReactionPredictor = { predict: predict, mixture: mixture, scene: scene, productDrawing: productDrawing,
    sites: sites, build: build, DRAW: DRAW, SUBSTRATES: SUBSTRATES, REAGENTS: REAGENTS, SOLVENTS: SOLVENTS };

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
          term: res.major.toLowerCase() + '-reaction', topic: res.major.toLowerCase(),
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
