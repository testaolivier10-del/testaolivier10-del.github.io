/* Reaction Predictor, tools v2 (docs/tools-v2-reaction-predictor-brief.md; standard docs/tools-v2-standard.md).

   The idea: the substrate, the reagent and the conditions decide whether a flask goes SN1, SN2, E1 or E2, and the
   picture shows it happen. Explore: pick a substrate and a reagent (and, quietly, the solvent and heat) and the
   reagent at once does to the molecule what it really does there: attacks the back of the carbon as bromide leaves
   (SN2, the three groups flip like an umbrella), takes a beta hydrogen as the double bond forms (E2), waits while
   bromide leaves on its own and the carbon goes flat and positive (SN1 and E1), or bounces off a carbon it cannot
   reach. The products land in a tray under the molecule with their rough shares, and the cause line says which
   factors decided it. Test yourself: "Call the path" (the old Predict first) and Check yourself.

   The reasoning is the old tool's decision procedure (predict, mixture), unchanged in its rules except for three
   accuracy fixes logged in the brief (a strong base on a secondary carbon is about 80% E2, more in an aprotic
   solvent, not less; solvolysis at room temperature is about 80% substitution). Products are drawn from the same
   condensed formulas as before, by mol-builder.js. The 3D sketch of the molecule (positions, the umbrella flip, the
   flat carbocation) is a sketch: not to scale, and "?" says so. */
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
    /* Predict first is the landing (audit 2026-10: Explore showed the answer
       on load). ?mode=explore opens Explore. */
    mode: 'predict',
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
          (solv.id === 'aprotic' ? ' A polar aprotic solvent makes the base stronger still, so even more of it goes to E2.' : '');
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
    /* A strong base on a secondary carbon: about 80% E2 in ethanol (isopropyl bromide with ethoxide, 79 to 80%), and
       more, not less, in a polar aprotic solvent, where the bare alkoxide is a stronger base (with methoxide in DMSO,
       about 97% elimination). Accuracy review 2026-11-19: the old split started at 65 and gave the aprotic solvent
       to SN2. A ring carbon is more crowded still (cyclohexyl bromide gives about 1% SN2). */
    if(s.sub.cls === '2' && out.major === 'E2' && out.minor === 'SN2'){
      lead = 80; why.push('on a secondary carbon a strong base takes the beta proton about four times in five');
      if(s.sub.id === 'cyhexbr'){ lead += 10; why.push('a ring carbon is more crowded still'); }
    }
    if(s.solvent.id === 'aprotic'){
      if(out.major === 'SN2'){ lead += 8; why.push('the aprotic solvent sharpens the nucleophile'); }
      else if(out.major === 'E2' && out.minor === 'SN2'){ lead += 10; why.push('the aprotic solvent leaves the base bare and stronger'); }
    }
    if(s.rgt.bulky && isElim(out.major)){
      lead += 10; why.push('the bulk of the base makes the carbon harder still to reach');
    }
    /* Two paths off one carbocation. At room temperature about four in five give substitution (tert-butyl chloride in
       80% ethanol at 25 °C: 83% alcohol, 17% alkene); heat tips the mixture toward the alkene, shown here as a modest
       lead, because the cation still gives plenty of substitution. */
    if(out.major === 'SN1'){ lead = 80; why.length = 0; why.push('at room temperature about four in five of the carbocations pick up the solvent rather than lose a proton'); }
    if(out.major === 'E1'){ lead = 60; why.length = 0; why.push('heat tips the carbocation toward losing a proton, though plenty still picks up the solvent'); }

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

  var B = window.OchemBuilder, Chem = window.OchemChem;

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

  /* What one path makes from this flask, for the tray: { st, name, kind } or null. The same formulas the old tool
     drew its product from (build, ALKENE), and the same Zaitsev / Hofmann rule as predict(). */
  var PNAME = { OH:'alcohol', OCH2CH3:'ether', 'OC(CH3)3':'ether', SH:'thiol', 'C#N':'nitrile', 'N=N+=N-':'azide', I:'alkyl iodide', NH2:'amine' };
  function productOf(sub, rgt, path){
    if(!B || !Chem || sub.generic) return null;
    if(path === 'SN1' || path === 'SN2'){
      var g = GROUP[rgt.id]; if(!g) return null;
      var st = build(DRAW[sub.id], g);
      return st ? { st: st, name: PNAME[g] } : null;
    }
    if(path === 'E1' || path === 'E2'){
      var alk = ALKENE[sub.id]; if(!alk) return null;
      var hof = path === 'E2' && rgt.bulky && !!alk.h;
      var r = B.parse(hof ? alk.h : alk.z);
      var kind = alk.h ? (hof ? 'Hofmann' : 'Zaitsev') : null;
      return r && r.st ? { st: r.st, name: kind ? kind + ' alkene' : 'alkene', kind: kind } : null;
    }
    return null;
  }

  /* ---- The molecule in 3D (a sketch) ----------------------------------------

     Each substrate is built around the carbon that holds bromine (alpha, at the origin) with the C–Br bond along +x,
     the axis every mechanism here works on: a nucleophile comes in from -x (the back side), the hydrogen an E2 base
     takes sits anti to bromine on a beta carbon (also along -x), and a carbocation is flat across x. So every change
     is one rule on this frame: SN2 reflects the three groups through the carbon (the umbrella flips), ionizing
     flattens them, an elimination flattens both carbons of the new double bond. The hydrogens on alpha are drawn as
     balls, so the flip shows; one beta hydrogen per kind of beta carbon (the one that can leave) is drawn as a ball;
     the rest are written in the labels (CH₃, CH₂). Lengths in C–C bonds. */
  var SQ = Math.sqrt(8) / 3;
  function vadd(a, b){ return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function vsub(a, b){ return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function vmul(a, k){ return [a[0] * k, a[1] * k, a[2] * k]; }
  function vdot(a, b){ return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function vcross(a, b){ return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function vlen(a){ return Math.sqrt(vdot(a, a)); }
  function vnorm(a){ var l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  // the three other tetrahedral directions at an atom whose existing bond points along u (unit); the first leans to ref
  function tetra(u, ref){
    var v = vnorm(vsub(ref, vmul(u, vdot(ref, u)))), w = vcross(u, v);
    return [0, 1, 2].map(function(k){ var f = k * 2 * Math.PI / 3; return vadd(vmul(u, -1 / 3), vadd(vmul(v, SQ * Math.cos(f)), vmul(w, SQ * Math.sin(f)))); });
  }
  var BL = { CC: 1, XH: 0.68, CBr: 1.22 };
  var RAD = { C: 1, O: 0.95, N: 0.95, S: 1.12, H: 0.6, Br: 1.18, I: 1.28 };
  var BALLC = { C: 'c', H: 'h', O: 'o', N: 'n' };

  /* Arms on alpha, in the order up, back-down, front-down. b1: the beta carbon whose H a small base takes (Zaitsev, or
     the only kind); b2: the one a bulky base takes (Hofmann), drawn only when the two give different alkenes. */
  var ARMS = {
    mebr: [{ h: 1 }, { h: 1 }, { h: 1 }],
    prbr: [{ h: 1 }, { h: 1 }, { lab: 'CH', anti: 'b1', kids: [{ lab: 'CH₃' }] }],
    neopentyl: [{ h: 1 }, { h: 1 }, { lab: 'C', kids: [{ lab: 'CH₃' }, { lab: 'CH₃' }, { lab: 'CH₃' }] }],
    bubr2: [{ h: 1 }, { lab: 'CH₂', anti: 'b2' }, { lab: 'CH', anti: 'b1', kids: [{ lab: 'CH₃' }] }],
    tbubr: [{ lab: 'CH₃' }, { lab: 'CH₃' }, { lab: 'CH₂', anti: 'b1' }],
    mebubr: [{ lab: 'CH₂', anti: 'b2' }, { lab: 'CH₃' }, { lab: 'CH', anti: 'b1', kids: [{ lab: 'CH₃' }] }],
    bnbr: [{ h: 1 }, { h: 1 }, { ring: true }]
  };
  /* yaw and pitch of the view (degrees), the turn of the three arms about the C–Br axis (degrees) and how much the
     sketch widens everything across that axis, so no group hides behind another (VIEW_TUNE in the brief). */
  var VIEW0 = [24, 14, 0, 1];
  var VIEW = { mebr: [-50, 30, 280, 1.3, 180], prbr: [40, 0, 120, 1.3], neopentyl: [40, 0, 260, 1.3], bubr2: [40, -20, 100, 1.3],
    tbubr: [40, 30, 100, 1.3, 120], mebubr: [40, 30, 220, 1.3, 180], bnbr: [-40, 0, 240, 1.3], cyhexbr: [-50, -20, 80, 1.4, 210] };

  function newMol(){ return { atoms: [], by: {}, bonds: [] }; }
  function atom(m, o){ o.lp = o.lp || 0; o.q = o.q || 0; m.atoms.push(o); m.by[o.id] = o; return o; }
  function bondTo(m, a, b, order){ m.bonds.push({ a: a, b: b, o: order || 1 }); }
  function hLabel(n){ return n ? 'CH' + (n > 1 ? '₀₁₂₃'[n] : '') : 'C'; }

  function substrate3d(id, phi0){
    var m = newMol();
    atom(m, { id: 'a', el: 'C', lab: 'C', p: [0, 0, 0] });
    atom(m, { id: 'lg', el: 'Br', lab: 'Br', p: [BL.CBr, 0, 0], lp: 3 });
    bondTo(m, 'a', 'lg', 1);
    m.beta = {};
    if(id === 'cyhexbr'){
      // a chair with its axis along x: alpha's axial bond (to Br) points +x, its two ring neighbours' axial H's -x
      var cf = (phi0 == null ? (VIEW[id] || VIEW0)[2] : phi0) * Math.PI / 180;
      var h = 0.25, r = 0.866, P0 = [h, r * Math.cos(cf), r * Math.sin(cf)], ring = [];
      for(var i = 0; i < 6; i++){
        var ang = i * Math.PI / 3 + cf, P = vsub([h * (i % 2 ? -1 : 1), r * Math.cos(ang), r * Math.sin(ang)], P0);
        if(i === 0){ ring.push('a'); continue; }
        var nb = i === 1 || i === 5;
        atom(m, { id: 'c' + i, el: 'C', lab: nb ? 'CH' : 'CH₂', p: P, ring: 1 });
        ring.push('c' + i);
        if(nb){ atom(m, { id: 'h' + i, el: 'H', lab: 'H', p: vadd(P, [-BL.XH, 0, 0]) }); bondTo(m, 'c' + i, 'h' + i); }
      }
      for(var j = 0; j < 6; j++) bondTo(m, ring[j], ring[(j + 1) % 6]);
      var dirs = [[1, 0, 0], vnorm(m.by.c1.p), vnorm(m.by.c5.p)], eq = vnorm(vmul(vadd(vadd(dirs[0], dirs[1]), dirs[2]), -1));
      atom(m, { id: 'ha', el: 'H', lab: 'H', p: vmul(eq, BL.XH) }); bondTo(m, 'a', 'ha');
      m.beta = { b1: { c: 'c1', h: 'h1' } };
      m.fixed = { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1 };
      return m;
    }
    var f0 = (phi0 == null ? (VIEW[id] || VIEW0)[2] : phi0) * Math.PI / 180;
    var arms = ARMS[id], dirs0 = tetra([1, 0, 0], [0, -Math.cos(f0), Math.sin(f0)]), n = 0;
    function place(par, dir, def, key){
      var pp = m.by[par].p;
      if(def.h){ atom(m, { id: key, el: 'H', lab: 'H', p: vadd(pp, vmul(dir, BL.XH)), par: par }); bondTo(m, par, key); return; }
      if(def.ring){
        var ip = vadd(pp, dir), c = vadd(ip, dir), per = vnorm(vcross(dir, [0.3, 0.1, 1]));
        var ks = [];
        for(var i = 0; i < 6; i++){
          var t = i * Math.PI / 3, P = vadd(c, vadd(vmul(dir, -Math.cos(t)), vmul(per, Math.sin(t))));
          var k = i ? key + 'r' + i : key;
          atom(m, { id: k, el: 'C', lab: i ? 'CH' : 'C', p: P, par: i ? key : par, ring: key }); ks.push(k);
        }
        bondTo(m, par, key);
        for(var j = 0; j < 6; j++) bondTo(m, ks[j], ks[(j + 1) % 6], j % 2 ? 1 : 2);
        return;
      }
      var p = vadd(pp, vmul(dir, BL.CC));
      atom(m, { id: key, el: 'C', lab: def.lab, p: p, par: par }); bondTo(m, par, key);
      var u = vnorm(vsub(pp, p)), kd = tetra(u, def.anti ? [-1, 0, 0] : [0, -1, 0]);
      var slots = def.anti ? [kd[1], kd[2]] : kd;
      if(def.anti){
        var hk = key + 'h'; atom(m, { id: hk, el: 'H', lab: 'H', p: vadd(p, vmul(kd[0], BL.XH)), par: key }); bondTo(m, key, hk);
        m.beta[def.anti] = { c: key, h: hk };
        // a chain goes on the side that leads away from alpha and from the viewer's line through it
        slots.sort(function(s1, s2){ return (s2[1] * (p[1] >= 0 ? 1 : -1) - s1[1] * (p[1] >= 0 ? 1 : -1)); });
      }
      (def.kids || []).forEach(function(kdef, i){ place(key, slots[i], kdef, key + 'k' + i); });
    }
    arms.forEach(function(def, i){ place('a', dirs0[i], def, 'x' + (n++)); });
    return m;
  }

  /* The reagent, in its own frame: the attacking atom at the origin, the rest trailing behind it (-x). Na⁺ and K⁺ are
     spectators and not drawn ("?" says so). */
  var RG3 = {
    oh:   { a: { el: 'O', lp: 3, q: -1 }, t: [{ el: 'H', p: [-0.5, -0.46, 0.1] }] },
    oet:  { a: { el: 'O', lp: 3, q: -1 }, t: [{ grp: 'Et', p: [-0.9, -0.42, 0], R: 1.12 }] },
    otbu: { a: { el: 'O', lp: 3, q: -1 }, t: [{ grp: 'tBu', p: [-1.0, -0.45, 0], R: 1.3 }] },
    dbu:  { a: { el: 'N', lp: 1 }, t: [{ grp: 'DBU', p: [-1.15, -0.35, 0], R: 1.45 }] },
    sh:   { a: { el: 'S', lp: 3, q: -1 }, t: [{ el: 'H', p: [-0.56, -0.5, 0.1] }] },
    cn:   { a: { el: 'C', lp: 1, q: -1 }, t: [{ el: 'N', p: [-1, 0, 0], o: 3, lp: 1 }] },
    n3:   { a: { el: 'N', lp: 2, q: -1 }, t: [{ el: 'N', p: [-1, 0, 0], o: 2, q: 1 }, { el: 'N', p: [-2, 0, 0], o: 2, q: -1, lp: 2, par: 1 }] },
    i:    { a: { el: 'I', lp: 4, q: -1 }, t: [] },
    nh3:  { a: { el: 'N', lp: 1 }, t: [{ el: 'H', p: [-0.34, -0.59, 0] }, { el: 'H', p: [-0.68, 0, 0] }, { el: 'H', p: [-0.34, 0.59, 0] }] },
    h2o:  { a: { el: 'O', lp: 2 }, t: [{ el: 'H', p: [-0.34, -0.58, 0] }, { el: 'H', p: [-0.34, 0.58, 0] }] },
    etoh: { a: { el: 'O', lp: 2 }, t: [{ el: 'H', p: [-0.34, 0.58, 0] }, { grp: 'Et', p: [-0.5, -0.86, 0], R: 1.12 }] },
    // the solvent, when a proton has to go somewhere and the reagent cannot take it (E1 with iodide or azide)
    sp:   { a: { el: 'O', lp: 2 }, t: [{ el: 'H', p: [-0.34, 0.58, 0] }, { grp: 'Et', p: [-0.5, -0.86, 0], R: 1.12 }] },
    sa:   { a: { el: 'O', lp: 2 }, t: [{ grp: 'SMe₂', p: [-1.05, -0.3, 0], R: 1.4, o: 2 }] }
  };
  function addReagent(m, key, pre){
    var d = RG3[key], ids = [pre + '0'];
    atom(m, { id: pre + '0', el: d.a.el, lab: d.a.el, p: [0, 0, 0], lp: d.a.lp, q: d.a.q, rg: pre, loc: [0, 0, 0] });
    d.t.forEach(function(t, i){
      var id = pre + (i + 1);
      atom(m, { id: id, el: t.grp ? 'G' : t.el, lab: t.grp || t.el, R: t.R, p: [0, 0, 0], lp: t.lp, q: t.q, rg: pre, loc: t.p });
      bondTo(m, t.par ? pre + t.par : pre + '0', id, t.o || 1);
      ids.push(id);
    });
    return ids;
  }

  /* A state: where every atom is, every bond's order, lone pairs, charges, how visible each atom is. */
  function key2(a, b){ return a < b ? a + '|' + b : b + '|' + a; }
  function initState(m){
    var K = { P: {}, B: {}, LP: {}, Q: {}, O: {} };
    m.atoms.forEach(function(a){ K.P[a.id] = a.p.slice(); K.LP[a.id] = a.lp; K.Q[a.id] = a.q; K.O[a.id] = 1; });
    m.bonds.forEach(function(b){ K.B[key2(b.a, b.b)] = b.o; });
    return K;
  }
  function cloneS(K){
    var o = { P: {}, B: {}, LP: {}, Q: {}, O: {} };
    Object.keys(K.P).forEach(function(k){ o.P[k] = K.P[k].slice(); });
    ['B', 'LP', 'Q', 'O'].forEach(function(n){ Object.keys(K[n]).forEach(function(k){ o[n][k] = K[n][k]; }); });
    return o;
  }
  function nbrs(m, K, id){ var out = []; m.bonds.forEach(function(b){ if(K.B[key2(b.a, b.b)] > 0){ if(b.a === id) out.push(b.b); else if(b.b === id) out.push(b.a); } }); return out; }
  function subtree(m, K, from, root){
    var seen = {}, out = [];
    seen[from] = 1;
    (function walk(k){ if(seen[k]) return; seen[k] = 1; out.push(k); nbrs(m, K, k).forEach(walk); })(root);
    return out;
  }
  // place a reagent: its attacking atom at `at`, its own +x along dir
  var TAIL = 0;   // the turn (radians) of a reagent's trailing atoms about its line of approach, per substrate (VIEW[id][4])
  function putReagent(m, K, pre, at, dir){
    var up = [0, Math.cos(TAIL), Math.sin(TAIL)];
    var x = vnorm(dir), y = vnorm(vsub(up, vmul(x, vdot(up, x)))), z = vcross(x, y);
    m.atoms.forEach(function(a){ if(a.rg !== pre) return; K.P[a.id] = vadd(at, vadd(vmul(x, a.loc[0]), vadd(vmul(y, a.loc[1]), vmul(z, a.loc[2])))); });
  }
  function moveIds(K, ids, d){ ids.forEach(function(k){ K.P[k] = vadd(K.P[k], d); }); }
  /* The groups on a carbon: flat (x component of each bond zeroed: a carbocation, or one end of a new double bond),
     lean (sign: the x component set to sign/3, tetrahedral, leaning away from what came in), or mirrored through the
     carbon (the SN2 umbrella). Each group's whole branch moves with it. skip: neighbours that stay. */
  function reshape(m, K, c, how, skip){
    var cp = K.P[c];
    nbrs(m, K, c).forEach(function(n){
      if((skip && skip[n]) || (m.fixed && m.fixed[n])) return;
      var d = vsub(K.P[n], cp), L0 = vlen(d), ids = subtree(m, K, c, n);
      if(how === 'mirror'){ ids.forEach(function(k){ var p = K.P[k]; K.P[k] = [2 * cp[0] - p[0], p[1], p[2]]; }); return; }
      var yz = vnorm([0, d[1], d[2]]), t;
      if(how === 'flat') t = yz;
      else t = vadd([how / 3, 0, 0], vmul(yz, SQ));
      moveIds(K, ids, vsub(vadd(cp, vmul(t, L0)), K.P[n]));
    });
  }

  /* ---- The sequence for one flask ------------------------------------------

     frames[i] are states; steps take the picture from one to the next: enter (the reagent slides in), hold (a pause
     with the names of what is there), approach, react (curved arrows draw in, the electron pairs fly along them and
     the bonds, charges and groups change with them), drift (the pieces part). */
  var WAIT = [-2.6, -0.15, 0], ENTER = [-3.5, -0.15, 0];
  function sequence(sub, rgt, solvent, path, p, phi0, tail){
    TAIL = (tail == null ? ((VIEW[sub.id] || VIEW0)[4] || 0) : tail) * Math.PI / 180;
    var m = substrate3d(sub.id, phi0), K, frames = [], steps = [], mods = { start: null };
    var rg = addReagent(m, rgt.id, 'r');
    var e1Base = null;
    if(path === 'E1' && rgt.base === 0 && rgt.nu >= 2){ e1Base = addReagent(m, solvent.id === 'aprotic' ? 'sa' : 'sp', 's'); }
    K = initState(m);
    putReagent(m, K, 'r', ENTER, [1, 0, 0]);
    if(e1Base) putReagent(m, K, 's', vadd(ENTER, [0.3, 2.3, 0]), [1, 0, 0]);
    m.atoms.forEach(function(a){ if(a.rg) K.O[a.id] = 0; });
    frames.push(K);
    function next(kind, ms, edit, extra){
      var N = cloneS(frames[frames.length - 1]);
      if(edit) edit(N);
      frames.push(N);
      var s = { kind: kind, ms: ms, from: frames.length - 2, to: frames.length - 1 };
      if(extra) Object.keys(extra).forEach(function(k){ s[k] = extra[k]; });
      steps.push(s);
      return N;
    }
    next('enter', 520, function(N){
      putReagent(m, N, 'r', e1Base ? vadd(WAIT, [-0.4, -1.9, 0]) : WAIT, [1, 0, 0]);
      if(e1Base) putReagent(m, N, 's', vadd(WAIT, [0.3, 2.3, 0]), [1, 0, 0]);
      m.atoms.forEach(function(a){ if(a.rg) N.O[a.id] = 1; });
    });
    next('hold', 900, null, { names: 'start' });
    var A = m.by.a.p, rA = 'r0';
    var betaKey = (path === 'E2' && rgt.bulky && m.beta.b2) ? 'b2' : 'b1', beta = m.beta[betaKey];
    // a bond a step makes is known to the molecule from the start (order 0 until that step)
    function link(a, b){ if(!m.bonds.some(function(x){ return key2(x.a, x.b) === key2(a, b); })) m.bonds.push({ a: a, b: b, o: 0 }); }
    // bromide leaves along the C–Br axis (on the ring, a little toward the viewer, so it passes in front of the ring)
    var lgOff = sub.id === 'cyhexbr' ? [BL.CBr + 0.9, 0.12, 0.7] : [BL.CBr + 0.9, 0.12, 0];
    function lg(N){ N.B[key2('a', 'lg')] = 0; N.LP.lg = 4; N.Q.lg = -1; N.P.lg = vadd(A, lgOff); }
    function attackSub(N, who, at){
      link('a', who); N.B[key2('a', who)] = 1; N.LP[who] = (N.LP[who] || 0) - 1; N.Q[who] = (N.Q[who] || 0) + 1;
    }
    function protonOff(base){
      // a neutral nucleophile that bonded keeps an extra H: it goes to the solvent
      var hId = base === 'r' ? m.atoms.filter(function(a){ return a.rg === 'r' && a.el === 'H'; })[0] : null;
      if(!hId) return;
      next('react', 1000, function(N){
        N.B[key2('r0', hId.id)] = 0; N.LP.r0 += 1; N.Q.r0 -= 1; N.Q[hId.id] = 1;
        N.P[hId.id] = vadd(N.P[hId.id], vmul(vnorm(vsub(N.P[hId.id], N.P.r0)), 0.75));   // straight out along its old bond
      }, { arrows: [{ from: { bond: ['r0', hId.id] }, to: { atom: 'r0' } }], say: 'H⁺ to the solvent' });
      next('drift', 520, function(N){ N.P[hId.id] = vadd(N.P[hId.id], vmul(vnorm(vsub(N.P[hId.id], N.P.r0)), 0.4)); N.O[hId.id] = 0; });
    }
    function neutralNu(){ return !RG3[rgt.id].a.q; }
    if(path === 'SN2'){
      next('approach', 520, function(N){ putReagent(m, N, 'r', vadd(A, [-2.05, 0, 0]), [1, 0, 0]); });
      next('react', 1500, function(N){
        putReagent(m, N, 'r', vadd(A, [-1.0, 0, 0]), [1, 0, 0]);
        attackSub(N, rA); lg(N); reshape(m, N, 'a', 'mirror', { lg: 1, r0: 1 });
      }, { arrows: [{ from: { lp: rA }, to: { atom: 'a' } }, { from: { bond: ['a', 'lg'] }, to: { atom: 'lg' } }] });
      next('drift', 560, function(N){ N.P.lg = vadd(N.P.lg, [0.75, 0.08, 0]); });
      if(neutralNu()) protonOff('r');
    } else if(path === 'SN1' || path === 'E1'){
      next('react', 1500, function(N){ lg(N); N.Q.a = 1; reshape(m, N, 'a', 'flat', { lg: 1 }); },
        { arrows: [{ from: { bond: ['a', 'lg'] }, to: { atom: 'lg' } }] });
      next('drift', 520, function(N){ N.P.lg = vadd(N.P.lg, [0.7, 0.1, 0]); });
      next('hold', 800, null, { names: 'cation' });
      if(path === 'SN1'){
        next('approach', 560, function(N){ putReagent(m, N, 'r', vadd(A, [-2.05, 0, 0]), [1, 0, 0]); });
        next('react', 1300, function(N){
          putReagent(m, N, 'r', vadd(A, [-1.0, 0, 0]), [1, 0, 0]);
          attackSub(N, rA); N.Q.a = 0; reshape(m, N, 'a', 1, { r0: 1 });
        }, { arrows: [{ from: { lp: rA }, to: { atom: 'a' } }] });
        if(neutralNu()) protonOff('r');
      } else {
        var bp = e1Base ? 's' : 'r', b0 = bp + '0';
        next('approach', 620, function(N){ putReagent(m, N, bp, vadd(N.P[beta.h], [-1.08, 0, 0]), [1, 0, 0]); });
        next('react', 1400, function(N){
          var at = vadd(N.P[beta.h], [-0.3, 0, 0]);
          N.B[key2(beta.c, beta.h)] = 0; N.B[key2('a', beta.c)] = 2; N.Q.a = 0;
          link(b0, beta.h); N.B[key2(b0, beta.h)] = 1; N.LP[b0] -= 1; N.Q[b0] = (N.Q[b0] || 0) + 1;
          putReagent(m, N, bp, vadd(at, [-BL.XH, 0, 0]), [1, 0, 0]); N.P[beta.h] = at;
          reshape(m, N, beta.c, 'flat', mapOf(['a', beta.h]));
        }, { arrows: [{ from: { lp: b0 }, to: { atom: beta.h } }, { from: { bond: [beta.c, beta.h] }, to: { bond: ['a', beta.c] } }] });
        next('drift', 560, function(N){ moveIds(N, m.atoms.filter(function(a){ return a.rg === bp; }).map(function(a){ return a.id; }).concat([beta.h]), [-0.75, -0.2, 0]); });
      }
    } else if(path === 'E2'){
      next('approach', 560, function(N){ putReagent(m, N, 'r', vadd(N.P[beta.h], [-1.1, 0, 0]), [1, 0, 0]); });
      next('react', 1600, function(N){
        var at = vadd(N.P[beta.h], [-0.3, 0, 0]);
        N.B[key2(beta.c, beta.h)] = 0; N.B[key2('a', beta.c)] = 2;
        link(rA, beta.h); N.B[key2(rA, beta.h)] = 1; N.LP[rA] -= 1; N.Q[rA] = (N.Q[rA] || 0) + 1;
        putReagent(m, N, 'r', vadd(at, [-BL.XH, 0, 0]), [1, 0, 0]); N.P[beta.h] = at;
        lg(N);
        reshape(m, N, 'a', 'flat', mapOf(['lg'].concat(m.fixed ? Object.keys(m.fixed) : [])));
        reshape(m, N, beta.c, 'flat', mapOf(['a', beta.h].concat(m.fixed ? Object.keys(m.fixed) : [])));
      }, { arrows: [{ from: { lp: rA }, to: { atom: beta.h } }, { from: { bond: [beta.c, beta.h] }, to: { bond: ['a', beta.c] } }, { from: { bond: ['a', 'lg'] }, to: { atom: 'lg' } }] });
      next('drift', 560, function(N){
        N.P.lg = vadd(N.P.lg, [0.7, 0.1, 0]);
        moveIds(N, rg.concat([beta.h]), [-0.75, -0.2, 0]);
      });
    } else {
      // no reaction: the reagent comes in to the back of the carbon and goes back
      next('approach', 620, function(N){ putReagent(m, N, 'r', vadd(A, [-2.0, 0, 0]), [1, 0, 0]); });
      next('bounce', 700, function(N){ putReagent(m, N, 'r', WAIT, [1, 0, 0]); }, { names: 'none' });
    }
    next('hold', 0, null, { names: 'end' });
    return { m: m, frames: frames, steps: steps, path: path, beta: beta, view: VIEW[sub.id] || VIEW0 };
  }
  function mapOf(list){ var o = {}; list.forEach(function(k){ o[k] = 1; }); return o; }

  /* For scripts/test/ochem-tools-upgrade.test.mjs and tool-content.test.mjs: the engine, the drawings and the 3D
     sequences, so the products and every frame can be checked against the verdict they illustrate. */
  window.OchemReactionPredictor = { predict: predict, mixture: mixture, productDrawing: productDrawing, productOf: productOf,
    sequence: sequence, substrate3d: substrate3d, sites: sites, build: build, DRAW: DRAW, SUBSTRATES: SUBSTRATES,
    REAGENTS: REAGENTS, SOLVENTS: SOLVENTS, MECH_LINK: MECH_LINK };

  var quizMounted = false;
  function mountQuiz(){
    if(quizMounted) return; quizMounted = true;
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
        intro: 'Substrate, reagent, solvent, heat: which mechanism wins?',
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
            ? reasons.map(function(x){ return '<b>' + esc(x.factor) + ':</b> ' + esc(String(x.text).replace(/\s—\s/g, ': ').replace(/—/g, ', ')); }).join(' ')
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


  }

  var K = window.LevlKit2, studio = window.OchemStudio || null, Kit = window.OchemStudioKit, PB = window.OchemPushBoard;
  if(!K || !studio || !Kit || !Kit.kit2 || !PB || !Chem || !B){
    mountQuiz();
    if(root.insertAdjacentHTML) root.insertAdjacentHTML('beforeend', '<p class="tnote tnote--info">This tool needs a newer copy of the page. Reload to get it.</p>');
    return;
  }
  var f1 = PB.f1, ease = PB.ease, seg = PB.seg;
  function mk(tag, cls, html){ var d = document.createElement(tag); if(cls) d.className = cls; if(html != null) d.innerHTML = html; return d; }
  function byId(id){ return document.getElementById(id); }
  function upper(s){ s = String(s || ''); if(/^tert-/.test(s)) return 'tert-' + upper(s.slice(5)); return s.charAt(0).toUpperCase() + s.slice(1); }
  var PHONE = false;

  /* ---- words ---------------------------------------------------------------- */
  var CLS = { methyl: 'methyl C', '1': '1° carbon', '1-hindered': 'hindered 1°', '2': '2° carbon', '3': '3° carbon', benzylic: 'benzylic C' };
  var KIND = { oh: 'strong base', oet: 'strong base', otbu: 'bulky base', dbu: 'bulky base', sh: 'good nucleophile',
    cn: 'good nucleophile', n3: 'good nucleophile', i: 'good nucleophile', nh3: 'fair nucleophile', h2o: 'weak: solvent', etoh: 'weak: solvent' };
  var TITLE = { SN2: 'SN2: one step', E2: 'E2: one step', SN1: 'SN1: cation first', E1: 'E1: cation first' };
  var RGROUPS = [
    { label: 'Strong base and nucleophile', ids: ['oh', 'oet'] },
    { label: 'Bulky strong base', ids: ['otbu', 'dbu'] },
    { label: 'Good nucleophile, weak base', ids: ['sh', 'cn', 'n3', 'i'] },
    { label: 'Fair nucleophile', ids: ['nh3'] },
    { label: 'Weak (solvolysis)', ids: ['h2o', 'etoh'] }
  ];
  function isSub(m){ return m === 'SN1' || m === 'SN2'; }
  function whyNone(s){
    var c = s.sub.cls, r = s.rgt;
    if(c === '1-hindered') return 'backside blocked';
    if(c === 'benzylic' && r.nu === 0) return 'no β-H to take';
    if(r.nu === 0) return 'not a nucleophile';
    return 'too weak to attack';
  }
  function clean(t){ return String(t).replace(/\s—\s/g, ': ').replace(/—/g, ', '); }

  /* ---- state ---------------------------------------------------------------- */
  var state = { sub: SUBSTRATES[3], rgt: REAGENTS[1], solvent: SOLVENTS[0], heat: false };
  var MODE = { mode: 'explore', part: null };
  var quiz = { flask: null, guess: null, revealed: false, score: { right: 0, total: 0 }, recent: [] };
  function cur(){ return MODE.mode === 'quiz' && MODE.part === 'call' && quiz.flask ? quiz.flask : state; }

  /* ---- the stage ------------------------------------------------------------ */
  var stage = mk('div', 'rp2 pb2');
  var head = K.head({ purpose: 'Substrate and reagent decide SN1, SN2, E1 or E2.', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
  stage.appendChild(head.el);
  var sceneBox = mk('div', 'rp2-scene');
  /* Two layers: the still backdrop and tray behind, the molecule and its arrows in front on a layer of its own, so a
     frame repaints only what moves (performance at CPU x4). */
  sceneBox.innerHTML = '<svg class="rp2-svg rp2-back" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep" aria-hidden="true"><defs>' + PB.defs() + '</defs>' +
    '<rect class="rp2-wall" x="0" y="0" width="100%" height="100%" fill="url(#rs2g-bg)"/><ellipse class="rp2-spot" fill="url(#rs2g-spot)"/>' +
    '<g class="rp2-trayg"></g></svg><svg class="rp2-svg rp2-front" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep" aria-hidden="true"><g class="rp2-mol"><g class="rp2-gl"></g><g class="rp2-sh"></g><g class="rp2-bo"></g><g class="rp2-at"></g><g class="rp2-lp"></g><g class="rp2-ch"></g></g>' +
    '<g class="rp2-ar"></g><g class="rp2-fly"></g></svg><div class="rs2-labs" aria-hidden="true"></div>';
  stage.appendChild(sceneBox);
  var svg = sceneBox.querySelector('.rp2-front'), svgBack = sceneBox.querySelector('.rp2-back'), G = {};
  ['trayg', 'mol', 'gl', 'sh', 'bo', 'at', 'lp', 'ch', 'ar', 'fly'].forEach(function(n){ G[n] = sceneBox.querySelector('.rp2-' + n); });
  var spot = svgBack.querySelector('.rp2-spot'), labsEl = sceneBox.querySelector('.rs2-labs'), layer = K.layer(sceneBox);
  var bar = mk('div', 'rp2-bar');
  bar.innerHTML = '<div class="rp2-picks"><label class="rs2-pick rp2-pick"><span>Substrate</span><select id="rpSubSel" aria-label="Substrate"></select></label>' +
    '<label class="rs2-pick rp2-pick is-main"><span>Reagent</span><select id="rpRgtSel" aria-label="Reagent"></select></label></div>' +
    '<div class="rp2-cond"><div class="rp2-seg" role="group" aria-label="Solvent"><button type="button" data-solv="protic" title="EtOH, H₂O">Protic</button><button type="button" data-solv="aprotic" title="DMSO, DMF, acetone">Aprotic</button></div>' +
    '<button type="button" class="rp2-heat" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.4 1.2-3.9 2.4-5 .2 1.6 1 2.6 2 3 0-3 .2-5.6.6-8z"/></svg><span>Heat</span></button>' +
    '<button type="button" class="rp2-replay" aria-label="Play it again"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></svg></button></div>';
  layer.el.appendChild(bar);
  var subSel = bar.querySelector('#rpSubSel'), rgtSel = bar.querySelector('#rpRgtSel'), segEl = bar.querySelector('.rp2-seg'),
    heatBtn = bar.querySelector('.rp2-heat'), replayBtn = bar.querySelector('.rp2-replay');
  var cardsEl = mk('div', 'rp2-cards'); layer.el.appendChild(cardsEl);
  var lines = mk('div', 'rp2-lines');
  var cause = K.cause({ label: 'Why' });
  lines.appendChild(cause.el);
  stage.appendChild(lines);
  var live = mk('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
  function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

  function fillPickers(){
    var built = state.sub.generic ? state.sub : null;
    subSel.innerHTML = SUBSTRATES.map(function(s){ return '<option value="' + s.id + '">' + esc(upper(s.name)) + '</option>'; }).join('') +
      (built ? '<optgroup label="Yours"><option value="__built">' + esc(built.name || 'Your substrate') + '</option></optgroup>' : '');
    rgtSel.innerHTML = RGROUPS.map(function(g){ return '<optgroup label="' + esc(g.label) + '">' + g.ids.map(function(id){ var r = find(REAGENTS, id); return '<option value="' + id + '">' + esc(r.name) + '</option>'; }).join('') + '</optgroup>'; }).join('');
  }
  function find(list, id){ for(var i = 0; i < list.length; i++) if(list[i].id === id) return list[i]; return null; }
  function paintControls(){
    subSel.value = state.sub.generic ? '__built' : state.sub.id;
    rgtSel.value = state.rgt.id;
    [].forEach.call(segEl.querySelectorAll('button'), function(b){ var on = b.getAttribute('data-solv') === state.solvent.id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    heatBtn.setAttribute('aria-pressed', state.heat ? 'true' : 'false'); heatBtn.classList.toggle('on', state.heat);
  }

  /* ---- layout ----------------------------------------------------------------- */
  var LAY = null;
  function lay(){
    var W = sceneBox.clientWidth, H = sceneBox.clientHeight;
    PHONE = W < 560;
    var showBar = !bar.hidden, bh = showBar ? bar.offsetTop + bar.offsetHeight + 8 : 14;
    // on a phone the first visit cue sits under the controls: the molecule starts below it (it refits once the cue goes)
    if(showBar && cueBelow && cue && cue.active()) bh += 44;
    var trayH = PHONE ? 132 : 150;
    LAY = { W: W, H: H, top: bh, trayH: trayH, box: { x: 12, y: bh, w: W - 24, h: Math.max(120, H - bh - trayH - 10) }, trayY: H - trayH };
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svgBack.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    return LAY;
  }

  /* ---- the 3D view ------------------------------------------------------------ */
  function viewOf(v){ var y = v[0] * Math.PI / 180, p = v[1] * Math.PI / 180; return { cy: Math.cos(y), sy: Math.sin(y), cp: Math.cos(p), sp: Math.sin(p), w: v[3] || 1, L: 1, ox: 0, oy: 0 }; }
  function proj(p0, V){
    var p = [p0[0], p0[1] * V.w, p0[2] * V.w];
    var x = p[0] * V.cy + p[2] * V.sy, z = -p[0] * V.sy + p[2] * V.cy, y = p[1] * V.cp - z * V.sp, z2 = p[1] * V.sp + z * V.cp;
    var k = 1 / (1 - z2 * 0.07);
    return { x: V.ox + x * V.L * k, y: V.oy + y * V.L * k, z: z2, k: k };
  }
  var RB = 0.25;
  function radOf(a){ return (a.R || RAD[a.el] || 1) * RB; }
  // the view that fits every frame of this sequence into the molecule's box (so the camera never moves while it plays)
  function fitView(S){
    var V = viewOf(S.view), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    S.frames.forEach(function(F){ S.m.atoms.forEach(function(a){ var q = proj(F.P[a.id], V), r = radOf(a) * q.k + (a.el === 'H' ? 0.06 : 0.2);
      x0 = Math.min(x0, q.x - r); x1 = Math.max(x1, q.x + r); y0 = Math.min(y0, q.y - r); y1 = Math.max(y1, q.y + r); }); });
    var b = LAY.box, L = Math.min(b.w / (x1 - x0), b.h / (y1 - y0), PHONE ? 80 : 140);
    V.L = L; V.ox = b.x + b.w / 2 - (x0 + x1) / 2 * L; V.oy = b.y + b.h / 2 - (y0 + y1) / 2 * L;
    return V;
  }

  /* ---- drawing one sequence: one element per drawn thing, moved every frame ---------- */
  var S = null, V = null, EL = null;
  function ballClass(a){ return a.el === 'G' ? 'c' : (BALLC[a.el] || 'x'); }
  function buildEls(){
    var m = S.m, L = V.L, h = { gl: '', sh: '', bo: '', at: '', lp: '', ch: '' };
    var maxLp = {}, qs = {}, maxO = {};
    S.frames.forEach(function(F){ m.atoms.forEach(function(a){ maxLp[a.id] = Math.max(maxLp[a.id] || 0, F.LP[a.id] || 0); if(F.Q[a.id]) (qs[a.id] = qs[a.id] || {})[F.Q[a.id] < 0 ? 'n' : 'p'] = 1; });
      Object.keys(F.B).forEach(function(k){ maxO[k] = Math.max(maxO[k] || 0, F.B[k]); }); });
    var stickW = Math.max(3, 0.06 * L), piW = Math.max(2.4, 0.045 * L), sp = Math.max(3, 0.042 * L), dr = Math.max(2.2, 0.032 * L);
    m.atoms.forEach(function(a){
      var r = radOf(a) * L, lab = a.lab, cls = ballClass(a);
      var fs = Math.min(r * 1.02, r * 2.5 / Math.max(1, lab.replace(/[₀-₉]/g, '').length * 0.78 + (lab.match(/[₀-₉]/g) || []).length * 0.45));
      if(fs < 11){ fs = 11; if(0.6 * 11 * lab.length > 2 * r * 0.98 && a.el !== 'G') lab = ''; }
      h.sh += '<circle class="rs2-shadow" data-k="' + a.id + '" r="' + f1(r * 1.1) + '"/>';
      h.at += '<g class="rp2-a" data-k="' + a.id + '"><circle class="rs2-ball is-' + cls + '" r="' + f1(r) + '" fill="url(#rs2g-' + cls + ')"/>' +
        '<ellipse class="rs2-shine" cx="' + f1(-r * 0.32) + '" cy="' + f1(-r * 0.38) + '" rx="' + f1(r * 0.34) + '" ry="' + f1(r * 0.22) + '"/>' +
        '<text class="rs2-al is-' + cls + '" y="' + f1(fs * 0.36) + '" font-size="' + f1(fs) + '" text-anchor="middle">' + esc(lab) + '</text></g>';
      for(var i = 0; i < (maxLp[a.id] || 0); i++) h.lp += '<g class="rs2-lp" data-k="' + a.id + '" data-i="' + i + '"><circle class="rs2-lpglow" r="' + f1(sp * 2.1) + '"/><circle class="rs2-e" cy="' + f1(-sp) + '" r="' + f1(dr) + '"/><circle class="rs2-e" cy="' + f1(sp) + '" r="' + f1(dr) + '"/></g>';
      if(qs[a.id]) ['n', 'p'].forEach(function(t){ if(!qs[a.id][t]) return; var br = Math.max(8, 0.1 * L);
        h.gl += '<circle class="rs2-glow" data-k="' + a.id + '" data-t="' + t + '" r="' + f1(r * 2.2) + '" fill="url(#rs2g-' + (t === 'n' ? 'neg' : 'pos') + ')"/>';
        h.ch += '<g class="rs2-badge is-' + (t === 'n' ? 'neg' : 'pos') + '" data-k="' + a.id + '" data-t="' + t + '"><circle r="' + f1(br) + '"/><text y="' + f1(br * 0.42) + '" font-size="' + f1(Math.max(11, br * 1.45)) + '" text-anchor="middle">' + (t === 'n' ? '−' : '+') + '</text></g>'; });
    });
    Object.keys(maxO).forEach(function(k){
      if(!maxO[k]) return;
      h.bo += '<line class="rs2-sig" data-b="' + k + '" stroke-width="' + f1(stickW) + '"/>';
      for(var i = 1; i < maxO[k]; i++) h.bo += '<line class="rs2-pi" data-b="' + k + '" data-i="' + i + '" stroke-width="' + f1(piW) + '"/>';
    });
    ['gl', 'sh', 'bo', 'at', 'lp', 'ch'].forEach(function(n){ G[n].innerHTML = h[n]; });
    EL = { atoms: {}, sh: {}, lps: {}, gl: {}, badge: {}, bpos: {}, bonds: [], order: null, br: Math.max(8, 0.1 * L) };
    [].forEach.call(G.at.children, function(g){ EL.atoms[g.getAttribute('data-k')] = g; });
    [].forEach.call(G.sh.children, function(c){ EL.sh[c.getAttribute('data-k')] = c; });
    [].forEach.call(G.lp.children, function(g){ (EL.lps[g.getAttribute('data-k')] = EL.lps[g.getAttribute('data-k')] || []).push(g); });
    [].forEach.call(G.gl.children, function(c){ EL.gl[c.getAttribute('data-k') + c.getAttribute('data-t')] = c; });
    [].forEach.call(G.ch.children, function(c){ EL.badge[c.getAttribute('data-k') + c.getAttribute('data-t')] = c; });
    var sigs = {};
    [].forEach.call(G.bo.children, function(l){ var k = l.getAttribute('data-b'), i = +(l.getAttribute('data-i') || 0); (sigs[k] = sigs[k] || [])[i] = l; });
    Object.keys(sigs).forEach(function(k){ var ab = k.split('|'); EL.bonds.push({ k: k, a: ab[0], b: ab[1], els: sigs[k] }); });
  }

  function slotAngles(occ, n){
    var out = [];
    for(var j = 0; j < n; j++){
      var best = 0, bd = -1;
      for(var i = 0; i < 36; i++){ var c = -Math.PI / 2 + i * Math.PI / 18;
        var d = Math.min.apply(null, occ.concat(out).map(function(o){ return PB.angDist(c, o); }).concat([Math.PI]));
        if(d > bd + 1e-6){ bd = d; best = c; } }
      out.push(best);
    }
    return out;
  }
  function lerp(a, b, t){ return a + (b - a) * t; }
  /* The picture between two states. t: 0..1 of the step; kind: how the parts of the change are timed. The positions
     returned are what is drawn, and every name and word is placed from them. */
  function frameAt(F0, F1, t, kind){
    var m = S.m, react = kind === 'react';
    var mv = react ? ease(seg(t, 0.32, 0.92)) : ease(t);
    var P = {}, scr = {};
    m.atoms.forEach(function(a){ var p0 = F0.P[a.id], p1 = F1.P[a.id]; P[a.id] = [lerp(p0[0], p1[0], mv), lerp(p0[1], p1[1], mv), lerp(p0[2], p1[2], mv)]; scr[a.id] = proj(P[a.id], V); });
    var bo = {};
    EL.bonds.forEach(function(b){ var o0 = F0.B[b.k] || 0, o1 = F1.B[b.k] || 0, w = o1 > o0 ? seg(t, 0.5, 0.9) : seg(t, 0.36, 0.78);
      if(!react) w = mv; bo[b.k] = { s: lerp(Math.min(o0, 1), Math.min(o1, 1), w), p1: lerp(o0 >= 2 ? 1 : 0, o1 >= 2 ? 1 : 0, w), p2: lerp(o0 >= 3 ? 1 : 0, o1 >= 3 ? 1 : 0, w) }; });
    return { P: P, scr: scr, bo: bo, t: t, F0: F0, F1: F1, react: react, mv: mv };
  }
  function paint(fr){
    var m = S.m, scr = fr.scr, L = V.L;
    // atoms, back to front
    var order = m.atoms.map(function(a){ return a.id; }).sort(function(p, q){ return scr[p].z - scr[q].z; }).join(',');
    if(order !== EL.order){ EL.order = order; order.split(',').forEach(function(k){ G.at.appendChild(EL.atoms[k]); }); }
    m.atoms.forEach(function(a){
      var s = scr[a.id], op = lerp(fr.F0.O[a.id], fr.F1.O[a.id], fr.react ? seg(fr.t, 0.5, 1) : fr.mv), r = radOf(a) * L * s.k;
      EL.atoms[a.id].setAttribute('transform', 'translate(' + f1(s.x) + ' ' + f1(s.y) + ') scale(' + s.k.toFixed(3) + ')');
      EL.atoms[a.id].style.opacity = op < 0.999 ? f1(op) : '';
      var sh = EL.sh[a.id]; sh.setAttribute('cx', f1(s.x + r * 0.18)); sh.setAttribute('cy', f1(s.y + r * 0.42)); sh.style.opacity = op < 0.999 ? f1(op) : '';
      s.r = r; s.op = op;
    });
    EL.bonds.forEach(function(b){
      var A = scr[b.a], Z = scr[b.b], w = fr.bo[b.k], dx = Z.x - A.x, dy = Z.y - A.y, L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0;
      var vis = Math.min(A.op, Z.op);
      b.els.forEach(function(l, i){
        var o = i === 0 ? w.s : i === 1 ? w.p1 : w.p2;
        if(i === 0){ l.setAttribute('x1', f1(A.x)); l.setAttribute('y1', f1(A.y)); l.setAttribute('x2', f1(Z.x)); l.setAttribute('y2', f1(Z.y)); }
        else {
          var off = Math.max(5, 0.075 * L) * (i === 1 ? 1 : -1), side = piSideAt(b, scr, nx, ny);
          var ox = nx * off * side, oy = ny * off * side;
          l.setAttribute('x1', f1(A.x + dx * 0.2 + ox)); l.setAttribute('y1', f1(A.y + dy * 0.2 + oy)); l.setAttribute('x2', f1(A.x + dx * 0.8 + ox)); l.setAttribute('y2', f1(A.y + dy * 0.8 + oy));
        }
        var v = o * vis; l.style.opacity = v > 0.999 ? '' : f1(v); l.style.display = v < 0.01 ? 'none' : '';
      });
    });
    // lone pairs and charges: in the widest gaps between the bonds drawn at this moment
    var occ = {};
    EL.bonds.forEach(function(b){ if(fr.bo[b.k].s < 0.5) return; var A = scr[b.a], Z = scr[b.b];
      (occ[b.a] = occ[b.a] || []).push(Math.atan2(Z.y - A.y, Z.x - A.x)); (occ[b.b] = occ[b.b] || []).push(Math.atan2(A.y - Z.y, A.x - Z.x)); });
    var react = fr.react, t = fr.t;
    m.atoms.forEach(function(a){
      var s = scr[a.id], n0 = fr.F0.LP[a.id] || 0, n1 = fr.F1.LP[a.id] || 0, els = EL.lps[a.id] || [], nmax = Math.max(n0, n1);
      var q0 = fr.F0.Q[a.id] || 0, q1 = fr.F1.Q[a.id] || 0, hasQ = !!(EL.badge[a.id + 'n'] || EL.badge[a.id + 'p']);
      if(!els.length && !hasQ) return;
      var sl = slotAngles(occ[a.id] || [], nmax + 1), d = s.r + Math.max(6, 0.075 * V.L) * s.k;
      els.forEach(function(g, i){
        var v0 = i < n0 ? 1 : 0, v1 = i < n1 ? 1 : 0, op = v0 === v1 ? v0 : v0 > v1 ? 1 - seg(t, 0.26, 0.34) : seg(t, 0.84, 1);
        if(!react) op = v0 === v1 ? v0 : lerp(v0, v1, fr.mv);
        op *= s.op;
        var ang = sl[i] == null ? 0 : sl[i];
        g.setAttribute('transform', 'translate(' + f1(s.x + Math.cos(ang) * d) + ' ' + f1(s.y + Math.sin(ang) * d) + ') rotate(' + f1(ang * 180 / Math.PI) + ')');
        g.style.opacity = op > 0.999 ? '' : f1(op); g.style.display = op < 0.01 ? 'none' : '';
      });
      if(!hasQ) return;
      var ba = sl[nmax] == null ? -Math.PI / 4 : sl[nmax], bd = s.r + EL.br * 0.6, bx = s.x + Math.cos(ba) * bd, by = s.y + Math.sin(ba) * bd;
      EL.bpos[a.id] = { x: bx, y: by, r: EL.br, on: 0 };
      ['n', 'p'].forEach(function(tt){
        var g = EL.badge[a.id + tt]; if(!g) return;
        var v0 = (tt === 'n' ? q0 < 0 : q0 > 0) ? 1 : 0, v1 = (tt === 'n' ? q1 < 0 : q1 > 0) ? 1 : 0;
        var op = v0 === v1 ? v0 : react ? (v1 ? seg(t, 0.62, 0.9) : 1 - seg(t, 0.4, 0.66)) : lerp(v0, v1, fr.mv);
        op *= s.op;
        g.setAttribute('transform', 'translate(' + f1(bx) + ' ' + f1(by) + ')');
        if(op > 0.3) EL.bpos[a.id].on = 1;
        g.style.opacity = op > 0.999 ? '' : f1(op); g.style.display = op < 0.01 ? 'none' : '';
        var gl = EL.gl[a.id + tt]; gl.setAttribute('cx', f1(s.x)); gl.setAttribute('cy', f1(s.y)); gl.style.opacity = f1(op); gl.style.display = op < 0.01 ? 'none' : '';
      });
    });
  }
  function piSideAt(b, scr, nx, ny){
    var A = scr[b.a], Z = scr[b.b], mx = (A.x + Z.x) / 2, my = (A.y + Z.y) / 2, sc = 0;
    var ra = S.m.by[b.a].ring, rz = S.m.by[b.b].ring;
    if(ra && ra === rz){
      // inside a ring: the π stick goes toward the ring's middle
      var cx = 0, cy = 0, n = 0; S.m.atoms.forEach(function(a){ if(a.ring === ra){ cx += scr[a.id].x; cy += scr[a.id].y; n++; } });
      if(n){ sc = (cx / n - mx) * nx + (cy / n - my) * ny; return sc >= 0 ? 1 : -1; }
    }
    nbrs(S.m, S.frames[S.frames.length - 1], b.a).concat(nbrs(S.m, S.frames[S.frames.length - 1], b.b)).forEach(function(k){ if(k === b.a || k === b.b) return; var q = scr[k]; sc -= ((q.x - mx) * nx + (q.y - my) * ny) > 0 ? 1 : -1; });
    return sc >= 0 ? 1 : -1;
  }

  /* ---- arrows and the electrons that fly along them ------------------------------- */
  function anchor(end, other, fr){
    var s = fr.scr;
    if(end.lp){
      var a = s[end.lp], o = pt(other, fr), occ = [];
      EL.bonds.forEach(function(b){ if(fr.bo[b.k].s < 0.5) return; if(b.a === end.lp) occ.push(Math.atan2(s[b.b].y - a.y, s[b.b].x - a.x)); if(b.b === end.lp) occ.push(Math.atan2(s[b.a].y - a.y, s[b.a].x - a.x)); });
      var n = fr.F0.LP[end.lp] || 1, sl = slotAngles(occ, n), want = Math.atan2(o.y - a.y, o.x - a.x);
      var best = sl.slice().sort(function(p, q){ return PB.angDist(p, want) - PB.angDist(q, want); })[0], d = a.r + Math.max(6, 0.075 * V.L) * a.k;
      return { x: a.x + Math.cos(best) * d, y: a.y + Math.sin(best) * d };
    }
    if(end.bond){ var p = s[end.bond[0]], q = s[end.bond[1]]; return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; }
    var t = s[end.atom], f = pt(other, fr), dx = f.x - t.x, dy = f.y - t.y, dl = Math.hypot(dx, dy) || 1;
    return { x: t.x + dx / dl * (t.r + 5), y: t.y + dy / dl * (t.r + 5) };
  }
  function pt(end, fr){ var s = fr.scr; if(end.bond){ var p = s[end.bond[0]], q = s[end.bond[1]]; return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; } var k = end.lp || end.atom; return { x: s[k].x, y: s[k].y }; }
  function curve(a, b, fr){
    var dx = b.x - a.x, dy = b.y - a.y, L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0, cx = 0, cy = 0, n = 0;
    S.m.atoms.forEach(function(x){ if(x.rg) return; cx += fr.scr[x.id].x; cy += fr.scr[x.id].y; n++; });
    cx /= n; cy /= n;
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, side = (mx - cx) * nx + (my - cy) * ny >= 0 ? 1 : -1, bow = Math.max(16, Math.min(44, L0 * 0.45));
    return { a: a, b: b, c: { x: mx + nx * bow * side, y: my + ny * bow * side } };
  }
  var AR = null;
  function startArrows(step, fr){
    G.ar.innerHTML = ''; G.fly.innerHTML = ''; AR = null;
    if(!step.arrows) return;
    var cvs = step.arrows.map(function(ar){ return curve(anchor(ar.from, ar.to, fr), anchor(ar.to, ar.from, fr), fr); });
    G.ar.innerHTML = cvs.map(function(cv){ var p = PB.arrowPath(cv); return '<g class="rs2-arrow"><path class="rs2-al-l" d="' + p.line + '"/><path class="rs2-al-h" d="' + p.head + '"/></g>'; }).join('');
    var sp = Math.max(3, 0.042 * V.L), dr = Math.max(2.2, 0.032 * V.L);
    G.fly.innerHTML = cvs.map(function(){ return '<g class="rs2-flyp"><circle class="rs2-lpglow" r="' + f1(sp * 2.1) + '"/><circle class="rs2-e" r="' + f1(dr) + '"/><circle class="rs2-e" r="' + f1(dr) + '"/></g>'; }).join('');
    AR = { cvs: cvs, sp: sp, g: [].slice.call(G.ar.children), fly: [].slice.call(G.fly.children) };
    AR.g.forEach(function(g){ var l = g.firstChild, len = l.getTotalLength ? l.getTotalLength() : 160; g.__len = len; l.style.strokeDasharray = f1(len); l.style.strokeDashoffset = f1(len); g.lastChild.style.opacity = '0'; });
  }
  function paintArrows(t){
    if(!AR) return;
    var a = ease(seg(t, 0, 0.26)), mv = ease(seg(t, 0.3, 0.86)), z = seg(t, 0.86, 1);
    AR.g.forEach(function(g){ g.firstChild.style.strokeDashoffset = f1(g.__len * (1 - a)); g.lastChild.style.opacity = a > 0.95 ? '1' : '0'; g.style.opacity = f1(1 - z); });
    AR.cvs.forEach(function(cv, i){
      var g = AR.fly[i], p = PB.bez(cv, mv), d = PB.bez(cv, Math.min(1, mv + 0.02)), ang = Math.atan2(d.y - p.y, d.x - p.x) + Math.PI / 2, px = -Math.sin(ang) * AR.sp, py = Math.cos(ang) * AR.sp;
      g.children[0].setAttribute('cx', f1(p.x)); g.children[0].setAttribute('cy', f1(p.y));
      g.children[1].setAttribute('cx', f1(p.x + px)); g.children[1].setAttribute('cy', f1(p.y + py));
      g.children[2].setAttribute('cx', f1(p.x - px)); g.children[2].setAttribute('cy', f1(p.y - py));
      g.style.opacity = t < 0.28 ? '0' : f1(1 - seg(t, 0.84, 0.94));
    });
  }

  /* ---- names on the picture ------------------------------------------------------- */
  function names(kind, fr){
    var c = cur(), m = S.m, out = [], s = fr.scr;
    if(S.generic) return;
    if(kind === 'start'){
      out.push({ t: CLS[c.sub.cls], k: 'a', cls: 'is-sub' });
      ['b1', 'b2'].forEach(function(b){ if(m.beta[b]) out.push({ t: 'β-H', k: m.beta[b].h, cls: 'is-tag' }); });
      out.push({ t: KIND[c.rgt.id], k: 'r0', cls: 'is-rgt' });
      if(m.by.s0) out.push({ t: 'solvent', k: 's0', cls: 'is-tag' });
    } else if(kind === 'cation'){
      out.push({ t: 'carbocation', k: 'a', cls: 'is-pos' });
      out.push({ t: 'Br⁻', k: 'lg', cls: 'is-tag' });
    } else if(kind === 'none'){
      out.push({ t: whyNone(c), at: proj(vadd(m.by.a.p, [-1.2, 0, 0]), V), cls: 'is-no' });
    } else if(kind === 'end'){
      var none = S.path === 'No reaction';
      out.push({ t: none ? 'No reaction' : TITLE[S.path] + (S.minor ? ' (minor)' : ''), head: 1, cls: 'is-head ' + (none ? 'is-none' : isSub(S.path) ? 'is-sn' : 'is-el') });
      if(none) out.push({ t: whyNone(c), at: proj(vadd(m.by.a.p, [-1.2, 0, 0]), V), cls: 'is-no' });
      else {
        var pr = productOf(c.sub, c.rgt, S.path);
        if(pr) out.push({ t: pr.name, k: isSub(S.path) ? 'a' : S.beta.c, cls: 'is-prod' });
        out.push({ t: 'Br⁻', k: 'lg', cls: 'is-tag' });
      }
    }
    placeNames(out, s);
  }
  function placeNames(list, s){
    labsEl.innerHTML = list.map(function(n){ return '<span class="rs2-lab ' + n.cls + '">' + esc(n.t) + '</span>'; }).join('');
    var els = [].slice.call(labsEl.children), placed = [], balls = [];
    S.m.atoms.forEach(function(a){ var q = s[a.id]; if(q && q.op > 0.5) balls.push({ x: q.x, y: q.y, r: q.r * 1.03 + 5 }); });
    var bx = LAY.box, avoid = [];
    var sr = sceneBox.getBoundingClientRect();
    // the controls, the first visit cue and every charge badge stay clear of the names
    // (the badges from where paint() put them, not from the page, so a name never trusts a stale box)
    if(EL && EL.bpos) Object.keys(EL.bpos).forEach(function(k){ var p = EL.bpos[k]; if(p.on) avoid.push({ l: p.x - p.r - 4, t: p.y - p.r - 4, r: p.x + p.r + 4, b: p.y + p.r + 4 }); });
    [].forEach.call(sceneBox.querySelectorAll('.rp2-bar select, .rp2-bar button, .tk2-cue'), function(e){
      if(e.closest('[hidden]') || e.style.display === 'none') return;
      var r = e.getBoundingClientRect(); if(r.width) avoid.push({ l: r.left - sr.left - 4, t: r.top - sr.top - 4, r: r.right - sr.left + 4, b: r.bottom - sr.top + 4 }); });
    function clear(rc){
      if(rc.l < 4 || rc.r > LAY.W - 4 || rc.t < bx.y - 2 || rc.b > LAY.trayY - 4) return false;
      if(placed.some(function(p){ return !(rc.r + 5 <= p.l || p.r + 5 <= rc.l || rc.b + 5 <= p.t || p.b + 5 <= rc.t); })) return false;
      if(avoid.some(function(p){ return !(rc.r <= p.l || p.r <= rc.l || rc.b <= p.t || p.b <= rc.t); })) return false;
      // a ball's whole square (and 4 px) stays clear of a name
      return !balls.some(function(c){ return !(rc.r <= c.x - c.r || c.x + c.r <= rc.l || rc.b <= c.y - c.r || c.y + c.r <= rc.t); });
    }
    // every name measured first, then all placed (one layout, not one per name)
    var sizes = els.map(function(e){ var bb = e.getBoundingClientRect(); return [bb.width + 1, bb.height + 1]; }), spots = [];
    list.forEach(function(n, i){
      var e = els[i], w = sizes[i][0], h = sizes[i][1], spot = null;
      if(n.head){
        var hy = bx.y + h / 2 + 2;
        for(var dy = 0; dy < 90 && !spot; dy += 6){ var rc0 = { l: LAY.W / 2 - w / 2, t: hy + dy - h / 2, r: LAY.W / 2 + w / 2, b: hy + dy + h / 2 }; if(clear(rc0)) spot = { x: LAY.W / 2, y: hy + dy }; }
      } else {
        var c = n.at || s[n.k], r0 = (n.at ? 0 : c.r) + 6;
        for(var ring = 0; ring < 5 && !spot; ring++){
          for(var j = 0; j < 16 && !spot; j++){
            var ang = [-Math.PI / 2, Math.PI / 2, 0, Math.PI][j] != null && j < 4 ? [-Math.PI / 2, Math.PI / 2, 0, Math.PI][j] : (j - 4) * Math.PI / 6 + Math.PI / 12;
            var dd = r0 + ring * 9, cx = c.x + Math.cos(ang) * (dd + w / 2 * Math.abs(Math.cos(ang))), cy = c.y + Math.sin(ang) * (dd + h / 2 * Math.abs(Math.sin(ang)));
            var rc = { l: cx - w / 2, t: cy - h / 2, r: cx + w / 2, b: cy + h / 2 };
            if(clear(rc)) spot = { x: cx, y: cy };
          }
        }
      }
      spots.push(spot);
      if(spot) placed.push({ l: spot.x - w / 2, t: spot.y - h / 2, r: spot.x + w / 2, b: spot.y + h / 2 });
    });
    els.forEach(function(e, i){ var sp = spots[i]; if(!sp){ e.style.display = 'none'; return; } e.style.left = f1(sp.x) + 'px'; e.style.top = f1(sp.y) + 'px'; });
  }

  /* ---- the tray: what is in the flask at the end, with its rough share ---------------- */
  var CARDS = [];
  function trayItems(c, p){
    if(c.sub.generic) return [{ path: null, pct: null, mine: true }];
    if(p.major === 'No reaction') return [{ path: null, pct: null }];
    var mix = mixture(c, p) || [{ path: p.major, pct: 100 }];
    return mix.slice(0, 2).filter(function(x){ return x.path; });
  }
  function drawTray(c, p, show){
    var L0 = LAY, items = show ? trayItems(c, p) : [], y = L0.trayY, H = L0.trayH;
    var h = '<rect class="rp2-tray" x="0" y="' + f1(y) + '" width="' + L0.W + '" height="' + H + '" fill="url(#rs2g-tray)"/><line class="rs2-trayedge" x1="0" x2="' + L0.W + '" y1="' + f1(y) + '" y2="' + f1(y) + '"/>';
    CARDS = [];
    if(items.length){
      h += '<text class="rp2-trayh" x="' + f1(L0.W / 2) + '" y="' + f1(y + 17) + '" text-anchor="middle">In the flask</text>';
      var gap = 12, cw = Math.min(PHONE ? 200 : 240, (L0.W - 24 - gap * (items.length - 1)) / items.length), ch = H - 34, x0 = L0.W / 2 - (cw * items.length + gap * (items.length - 1)) / 2;
      items.forEach(function(it, i){
        var x = x0 + i * (cw + gap), cy = y + 25, pr = it.path ? productOf(c.sub, c.rgt, it.path) : it.mine ? { st: c.sub.st, name: 'yours' } : { st: build(DRAW[c.sub.id], 'Br'), name: 'unchanged' };
        var box = { x: x + 8, y: cy + 4, w: cw - 16, h: ch - 34 };
        var major = i === 0 && !!it.path;
        h += '<g class="rp2-card' + (major ? ' is-major' : '') + '"><rect class="rs2-thumb' + (major ? ' is-on' : '') + '" x="' + f1(x) + '" y="' + f1(cy) + '" width="' + f1(cw) + '" height="' + f1(ch) + '" rx="12"/>';
        if(pr && pr.st){ var T = PB.fitFlat(pr.st, pr.st, box, { cap: 1.1 }); h += PB.drawFlat(pr.st, T, box); }
        var tag = it.path ? it.path + '  ≈' + it.pct + '%' : it.mine ? 'Product: work it out' : 'No reaction';
        h += '<text class="rp2-ctag ' + (it.path ? (isSub(it.path) ? 'is-sn' : 'is-el') : 'is-none') + '" x="' + f1(x + cw / 2) + '" y="' + f1(cy + ch - 15) + '" text-anchor="middle">' + esc(tag) + '</text>';
        if(it.path){
          var bw = cw - 24;
          h += '<rect class="rp2-sbar" x="' + f1(x + 12) + '" y="' + f1(cy + ch - 8) + '" width="' + f1(bw) + '" height="4" rx="2"/>' +
            '<rect class="rp2-sfill ' + (isSub(it.path) ? 'is-sn' : 'is-el') + '" data-w="' + f1(bw * it.pct / 100) + '" x="' + f1(x + 12) + '" y="' + f1(cy + ch - 8) + '" width="' + f1(bw * it.pct / 100) + '" height="4" rx="2"/>';
        }
        h += '</g>';
        CARDS.push({ x: x, y: cy, w: cw, h: ch, path: it.path, pct: it.pct, name: pr ? pr.name : '' });
      });
    }
    G.trayg.innerHTML = h;
    cardsEl.innerHTML = CARDS.map(function(cd, i){
      var lab = cd.path ? 'Show how the ' + cd.name + ' forms: ' + cd.path + ', about ' + cd.pct + '% of the product' : cd.name === 'yours' ? 'Your substrate: play the first arrow again' : 'No reaction: play it again';
      return '<button type="button" class="rs2-tb rp2-cb" data-i="' + i + '" aria-label="' + esc(lab) + '" style="left:' + f1(cd.x) + 'px;top:' + f1(cd.y) + 'px;width:' + f1(cd.w) + 'px;height:' + f1(cd.h) + 'px"></button>';
    }).join('');
    // the cards arrive with the products: they rise in, and each share bar grows to its size
    if(show && items.length && !K.reduced() && svg.animate){
      [].forEach.call(G.trayg.querySelectorAll('.rp2-card'), function(g, i){ try{ g.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: i * 120, easing: 'ease-out', fill: 'backwards' }); }catch(e){} });
      [].forEach.call(G.trayg.querySelectorAll('.rp2-sfill'), function(r, i){ try{ r.animate([{ width: '0px' }, { width: r.getAttribute('data-w') + 'px' }], { duration: 520, delay: 160 + i * 120, easing: 'ease-out', fill: 'backwards' }); }catch(e){} });
    }
  }
  cardsEl.addEventListener('click', function(e){
    var b = e.target.closest('.rp2-cb'); if(!b) return;
    var cd = CARDS[+b.getAttribute('data-i')]; if(!cd) return;
    hideCue(true);
    play(cd.path || 'No reaction', { minor: cd.path && cd.path !== predict(cur()).major });
  });

  /* ---- the cause line --------------------------------------------------------------- */
  function causeParts(c, p, done){
    var parts = [{ t: CLS[c.sub.cls], role: 'sub' }, { t: KIND[c.rgt.id], role: 'rgt', join: '+' }, { t: c.solvent.id, role: 'solv', join: '+' }];
    if(c.heat) parts.push({ t: 'heat', role: 'heat', join: '+' });
    if(!done) return parts;
    if(p.major === 'No reaction'){ parts.push({ t: 'no reaction', role: 'none' }); return parts; }
    parts.push({ t: p.major + (p.minor ? ' wins' : ''), role: isSub(p.major) ? 'sn' : 'el' });
    var pr = productOf(c.sub, c.rgt, p.major);
    if(pr) parts.push({ t: pr.name, role: 'prod' });
    return parts;
  }

  /* ---- playing ----------------------------------------------------------------------- */
  var run = null;   // { steps, i, t0, raf }
  function stopRun(settle){
    if(run && run.raf) cancelAnimationFrame(run.raf);
    var r = run; run = null;
    if(r){ G.ar.innerHTML = ''; G.fly.innerHTML = ''; AR = null; }
    labsEl.classList.remove('is-wait'); cause.el.classList.remove('is-wait');
    if(settle && r && S && !S.generic) finish(r.opts);
  }
  function settled(){ return !run; }
  function setSeq(path, opts){
    var c = cur();
    lay();
    if(c.sub.generic){ S = { generic: true, path: path, m: newMol(), frames: [], steps: [] }; return; }
    S = sequence(c.sub, c.rgt, c.solvent, path, predict(c));
    S.minor = !!(opts && opts.minor);
    V = fitView(S);
    buildEls();
    spot.setAttribute('cx', f1(proj([-0.6, 0, 0], V).x)); spot.setAttribute('cy', f1(proj([0, 0, 0], V).y));
    spot.setAttribute('rx', f1(Math.min(LAY.W * 0.42, V.L * 4.2))); spot.setAttribute('ry', f1(Math.min(LAY.box.h * 0.6, V.L * 2.4)));
  }
  function showFrame(i, kindNames){
    var F = S.frames[i], fr = frameAt(F, F, 1, 'hold');
    paint(fr);
    if(kindNames) names(kindNames, fr); else labsEl.innerHTML = '';
    return fr;
  }
  function finish(opts){
    var c = cur(), p = predict(c);
    showFrame(S.frames.length - 1, 'end');
    labsEl.classList.remove('is-wait'); cause.el.classList.remove('is-wait');
    var quizHidden = MODE.mode === 'quiz' && MODE.part === 'call' && !quiz.revealed;
    drawTray(c, p, !quizHidden);
    if(!quizHidden){
      cause.set(causeParts(c, p, true));
      if(!(opts && opts.quiet)) say(cause.text());
    }
    if(opts && opts.done) opts.done();
  }
  /* The flask plays its winning path (or the one asked for). With reduced motion: the end at once, after a short
     cross fade. */
  function play(path, opts){
    opts = opts || {};
    stopRun(false);
    var c = cur(), p = predict(c);
    path = path || p.major;
    setSeq(path, opts);
    if(S.generic){ paintGeneric(c, p); return; }
    drawTray(c, p, false);
    cause.set(causeParts(c, p, false));
    if(K.reduced() || opts.still){
      if(opts.still){ showFrame(1, 'start'); return; }
      finish(opts);
      try{ G.mol.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }); }catch(e){}
      return;
    }
    var steps = S.steps.filter(function(s){ return s.ms > 0; });
    run = { steps: steps, i: -1, t0: 0, raf: 0, opts: opts, phase: null };
    labsEl.classList.add('is-wait'); labsEl.innerHTML = '';
    function startStep(i, ts){
      run.i = i; run.t0 = ts;
      var st = steps[i], F0 = S.frames[st.from], fr0 = frameAt(F0, F0, 0, 'hold');
      paint(fr0);
      if(st.kind === 'react') startArrows(st, fr0); else { G.ar.innerHTML = ''; G.fly.innerHTML = ''; AR = null; }
      if(st.kind === 'hold' && st.names){ names(st.names, fr0); labsEl.classList.remove('is-wait'); }
      else { labsEl.classList.add('is-wait'); }
    }
    function tick(ts){
      if(!run) return;
      if(run.i < 0) startStep(0, ts);
      var st = steps[run.i], t = Math.min(1, (ts - run.t0) / st.ms);
      if(st.kind !== 'hold'){ var fr = frameAt(S.frames[st.from], S.frames[st.to], t, st.kind); paint(fr); if(st.kind === 'react') paintArrows(t); }
      if(t >= 1){
        if(st.kind === 'bounce' || st.names === 'none'){ var Fb = S.frames[st.to]; names('none', frameAt(Fb, Fb, 1, 'hold')); labsEl.classList.remove('is-wait'); }
        if(run.i + 1 >= steps.length){ var o = run.opts; run = null; G.ar.innerHTML = ''; G.fly.innerHTML = ''; AR = null; finish(o); return; }
        startStep(run.i + 1, ts);
      }
      run.raf = requestAnimationFrame(tick);
    }
    run.raf = requestAnimationFrame(tick);
  }

  /* A substrate drawn in Build your own: read off the structure, so the picture is that structure (flat) with the
     first arrow (the bond to the leaving group breaking), and the product is left for the student to work out. */
  function paintGeneric(c, p){
    G.gl.innerHTML = ''; G.sh.innerHTML = ''; G.bo.innerHTML = ''; G.lp.innerHTML = ''; G.ch.innerHTML = ''; G.ar.innerHTML = ''; G.fly.innerHTML = '';
    var st = c.sub.st, at = sites(st), T = PB.fitT(st, LAY.box, { cap: PHONE ? 1.4 : 1.8 }), d = PB.draw(st, T);
    G.at.innerHTML = d.html;
    if(at && p.major !== 'No reaction'){
      var ar = { from: 'bond:' + at.alpha + '-' + at.lg, to: at.lg }, a = PB.anchorOf(ar, d.A, 'from'), b = PB.anchorOf(ar, d.A, 'to');
      var dx = b.x - a.x, dy = b.y - a.y, L0 = Math.hypot(dx, dy) || 1, cv = { a: a, b: b, c: { x: (a.x + b.x) / 2 - dy / L0 * 26, y: (a.y + b.y) / 2 + dx / L0 * 26 } }, pa = PB.arrowPath(cv);
      G.ar.innerHTML = '<g class="rs2-arrow"><path class="rs2-al-l" d="' + pa.line + '"/><path class="rs2-al-h" d="' + pa.head + '"/></g>';
      try{ if(!K.reduced()) G.ar.firstChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' }); }catch(e){}
    }
    labsEl.innerHTML = '';
    var none = p.major === 'No reaction', sAt = { scr: {} };
    void sAt;
    placeNamesFlat([{ t: none ? 'No reaction' : TITLE[p.major], head: 1, cls: 'is-head ' + (none ? 'is-none' : isSub(p.major) ? 'is-sn' : 'is-el') }], d.A);
    drawTray(c, p, true);
    var parts = causeParts(c, p, true); parts.push({ t: 'product: work it out', role: 'prod' });
    cause.set(parts);
    say(cause.text());
  }
  function placeNamesFlat(list, A){
    var s = {}; S.m = { atoms: Object.keys(A.atoms).map(function(k){ s[k] = { x: A.atoms[k].x, y: A.atoms[k].y, r: A.atoms[k].r, op: 1 }; return { id: k }; }) };
    placeNames(list, s);
  }

  /* ---- Explore: the controls --------------------------------------------------------- */
  var changed = false;
  function onChange(what){
    hideCue(true);
    if(tour && tour.active()) tour.did(what);
    paintControls(); sync(); refFill();
    play();
  }
  subSel.addEventListener('change', function(){
    var v = subSel.value;
    if(v === '__built'){ if(builtSub) state.sub = builtSub; } else state.sub = find(SUBSTRATES, v) || state.sub;
    onChange('sub');
  });
  rgtSel.addEventListener('change', function(){ state.rgt = find(REAGENTS, rgtSel.value) || state.rgt; onChange('rgt'); });
  segEl.addEventListener('click', function(e){ var b = e.target.closest('[data-solv]'); if(!b) return; state.solvent = find(SOLVENTS, b.getAttribute('data-solv')) || state.solvent; onChange('solv'); });
  heatBtn.addEventListener('click', function(){ state.heat = !state.heat; onChange('heat'); });
  replayBtn.addEventListener('click', function(){ hideCue(true); play(); });
  void changed;

  function sync(){
    if(!window.OchemToolState || MODE.mode !== 'explore') return;
    window.OchemToolState.write({ sub: state.sub.generic ? null : state.sub.id, rgt: state.rgt.id, solv: state.solvent.id, heat: state.heat ? 1 : null, mode: null });
  }

  /* ---- the one first-visit cue, and Show me how ---------------------------------------- */
  var cue = null, cueBelow = false;
  function placeCue(){
    if(MODE.mode !== 'explore' || PHONE === null) return;
    var r = rgtSel.getBoundingClientRect(), sr = sceneBox.getBoundingClientRect();
    if(!r.width) return;
    // beside the reagent on a wide picture (the bar has room there), under the controls on a phone
    // beside it only when the bar has room to its right (the cue is about 200 px wide)
    var cb = bar.getBoundingClientRect(), cr = bar.querySelector('.rp2-cond').getBoundingClientRect();
    var roomEnd = cr.top < r.bottom - 2 && cr.bottom > r.top + 2 ? cr.left : cb.right;
    var wide = r.right + 230 < roomEnd;
    if(cue && cueBelow === wide){ cue.hide(false); cue = null; }
    cueBelow = !wide;
    var at = wide ? [r.right - sr.left + 8, r.top - sr.top + r.height / 2] : [r.left - sr.left + r.width / 2, cb.bottom - sr.top - 24];
    if(!cue) cue = K.cue(layer, { key: 'ochem-rp-reagent', text: 'Pick a reagent', side: wide ? 'right' : 'below', at: function(){ return at; } });
    else cue.place();
    var was = cue.active();
    cue.show();
    if(!was && cue.active() && cueBelow){ lay(); if(S && !S.generic && !run){ play(null, { quiet: true }); stopRun(true); } }
  }
  function hideCue(used){ if(cue){ var was = cue.active(); cue.hide(used); if(was && cueBelow) lay(); } }
  var tour = K.tour ? K.tour({ key: 'ochem-rp', label: 'Show me how', steps: [
    { id: 'sub', text: 'Pick a substrate: look at the carbon that holds Br.', target: function(){ return subSel; } },
    { id: 'rgt', text: 'Pick a reagent: it reacts with the molecule at once.', target: function(){ return rgtSel; } },
    { id: 'tray', text: 'The products land here, with their rough shares. Tap one to see how it forms.', target: function(){ var r = sceneBox.getBoundingClientRect(); return { left: r.left + 12, top: r.top + LAY.trayY, width: r.width - 24, height: LAY.trayH, right: r.right - 12, bottom: r.top + LAY.trayY + LAY.trayH }; } }
  ] }) : null;
  function startTour(){ if(tour){ hideCue(false); tour.start(true); } }

  /* ---- "?" ------------------------------------------------------------------------------ */
  var ref = mk('div', 'rp2-ref');
  ref.innerHTML = '<p class="rp2-ref-how"><button type="button" class="tk2-how" id="rpRefHow">Show me how</button></p>' +
    '<div id="rpRefFlask"></div>' +
    '<h3 class="rp2-ref-h">How to read the picture</h3>' +
    '<p class="rp2-ref-p">The molecule is a 3D sketch, not to scale: grey balls are carbon, white hydrogen, red oxygen, blue nitrogen, green bromine, iodine, sulfur and the groups written on a ball (Et, tBu, DBU). The hydrogens on the reacting carbon are drawn as balls, and so is one hydrogen on each kind of beta carbon (the one that can leave); the rest are in the labels (CH₃, CH₂). Na⁺ and K⁺ do nothing here and are not drawn. Violet dots are electron pairs, violet arrows move them; a red glow is a negative charge, a blue glow a positive one (the carbocation).</p>' +
    '<p class="rp2-ref-p">SN2 attacks the back of the carbon, so the three groups flip like an umbrella in the wind (inversion). SN1 and E1 wait for bromide to leave on its own: the carbon goes flat, and the nucleophile can then come from either face (the picture shows one), so a stereocenter comes out as a mix of both. E2 takes the beta hydrogen that sits anti to bromine. On a ring the ring stays put in the sketch.</p>' +
    '<p class="rp2-ref-p">The shares in the tray are bands, not yields: they move with concentration, the exact solvent and the time.</p>' +
    '<h3 class="rp2-ref-h">A method</h3><ol class="rp2-steps">' +
    '<li><b>The carbon.</b> Methyl or primary leans SN2; tertiary cannot do SN2 at all.</li>' +
    '<li><b>The reagent.</b> A bulky strong base (KOtBu, DBU) gives E2, even on a primary carbon. A strong base that is also a good nucleophile (NaOH, NaOEt) gives SN2 on primary and E2 on secondary or tertiary. A good nucleophile that is a weak base (CN⁻, I⁻, N₃⁻, HS⁻) gives SN2. A weak nucleophile (water, an alcohol) needs a carbocation, so SN1 or E1, and only on secondary or tertiary.</li>' +
    '<li><b>Solvent and heat.</b> Polar protic helps a carbocation form; polar aprotic speeds SN2; heat favors elimination.</li></ol>' +
    '<details class="tool-more rp2-build" id="rpBuildBox"><summary>Build your own substrate</summary><div id="rpBuilder"></div><div id="rpBuildMsg"></div><div id="rpSend"></div></details>';
  function refFill(){
    var el = ref.querySelector('#rpRefFlask'); if(!el) return;
    var c = state, p = predict(c), mix = mixture(c, p), none = p.major === 'No reaction';
    var sh = { SN1: 0, SN2: 0, E1: 0, E2: 0 }; (mix || []).slice(0, 2).forEach(function(x){ if(x.path in sh) sh[x.path] = x.pct; });
    var why = mix && mix[2] && mix[2].why && mix[2].why.length ? mix[2].why.join(', and ') : null;
    var title = none ? 'Why nothing happens here' : p.minor ? 'Why ' + p.major + ' wins, with some ' + p.minor : 'Why ' + p.major + ' wins here';
    var link = MECH_LINK[p.major];
    var html = '<h3 class="rp2-ref-h">' + esc(title) + '</h3><p class="rp2-ref-p tmuted">' + esc(upper(c.sub.name)) + ' + ' + esc(c.rgt.name) + ', ' + esc(c.solvent.name.toLowerCase()) + ' solvent (' + esc(c.solvent.example) + '), ' + (c.heat ? 'heated' : 'room temperature') + '.</p>' +
      '<ol class="rp2-steps">' + p.reasons.map(function(r){ return '<li><b>' + esc(r.factor) + '</b> argues ' + esc(r.leans) + '. ' + esc(clean(r.text)) + '</li>'; }).join('') + '</ol>' +
      '<p class="rp2-ref-p">' + esc(clean(p.verdict)) + '</p>' +
      (mix && mix.length > 1 ? '<p class="rp2-ref-p tmuted"><b>Roughly what you get.</b> These are competitions, not switches: a real flask gives you both, and the useful question is how lopsided. ' + (why ? 'Here ' + esc(why) + '. ' : '') + 'Treat the split as a band rather than a yield.</p>' : '') +
      (p.product && p.product !== '—' ? '<p class="rp2-ref-p"><b>Major product' + (p.alkene ? ' (' + esc(p.alkene) + ')' : '') + ':</b> <span class="tformula">' + esc(p.product) + '</span> + Br⁻</p>' : '') +
      (p.productNote ? '<p class="rp2-ref-p">' + esc(clean(p.productNote)) + '</p>' : '') +
      '<table class="ttable rp2-tbl"><caption class="sr-only">Each path: its share of the product and what argues for it</caption><thead><tr><th scope="col">Path</th><th scope="col">Share</th><th scope="col">Driven by, or why not</th></tr></thead><tbody>' +
      ['SN1', 'SN2', 'E1', 'E2'].map(function(m){
        var blocked = p.blocked && p.blocked[m], pulls = (p.reasons || []).filter(function(r){ return r.votes && r.votes[m]; }).map(function(r){ return r.factor === 'Temperature' ? (c.heat ? 'heat' : 'room temp') : r.factor.toLowerCase(); });
        return '<tr' + (m === p.major ? ' class="hl"' : '') + '><th scope="row">' + m + '</th><td>' + (blocked ? 'blocked' : sh[m] ? '≈' + sh[m] + '%' : '0') + '</td><td>' + esc(blocked || (pulls.length ? pulls.join(', ') : 'nothing here')) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<p class="rp2-ref-p"><b>' + esc(c.rgt.name) + '</b>: ' + esc(c.rgt.kind) + '. <span class="tmuted">Nucleophile ' + c.rgt.nu + ' of 4, base ' + c.rgt.base + ' of 4.</span></p>' +
      '<p class="rp2-ref-p tmuted">' + esc(clean(c.sub.note)) + '</p><p class="rp2-ref-p tmuted">' + esc(clean(c.solvent.note)) + '</p>' +
      (link ? '<p class="rp2-ref-p"><a href="arrow-pusher.html?start=' + encodeURIComponent(link.id) + '">' + esc(link.label) + ' in Arrow Pusher &rarr;</a></p>' : '');
    el.innerHTML = html;
  }

  /* Build your own substrate (was behind "Solvent and heat"): the builder, the hand-off row and the message, here. */
  var builderApi = null, sendApi = null, lastBuilt = null, builtSub = null;
  function openBuilder(){
    if(builderApi || !window.OchemBuilderUI) return builderApi;
    var box = ref.querySelector('#rpBuilder'), msg = ref.querySelector('#rpBuildMsg');
    if(window.OchemToolHandoff) sendApi = window.OchemToolHandoff.mountSend(ref.querySelector('#rpSend'), function(){ return lastBuilt; });
    builderApi = window.OchemBuilderUI.mount(box, {
      onChange: function(st, rep){
        lastBuilt = (rep.empty || !rep.ok) ? null : st;
        if(sendApi) sendApi.refresh();
        if(rep.empty){ msg.innerHTML = ''; return; }
        if(!rep.ok){ msg.innerHTML = '<div class="tnote tnote--bad" style="margin-top:12px;">Fix what is flagged below first.</div>'; return; }
        var sub = classifySubstrate(st);
        if(sub.error){ msg.innerHTML = '<div class="tnote tnote--warn" style="margin-top:12px;"><span class="tnote__k">Not a substrate yet</span>' + esc(clean(sub.error)) + '</div>'; return; }
        msg.innerHTML = '<div class="tnote tnote--good" style="margin-top:12px;"><span class="tnote__k">Loaded</span>' + esc(sub.note) + ' It is on the picture now, under Substrate: Yours.</div>';
        sub.st = Chem.clone(st);
        builtSub = sub; state.sub = sub;
        fillPickers(); paintControls(); refFill();
        if(MODE.mode === 'explore') play();
      }
    });
    return builderApi;
  }
  ref.querySelector('#rpBuildBox').addEventListener('toggle', function(){ if(this.open) openBuilder(); });

  /* ---- Test yourself: Call the path (the old Predict first) ----------------------------- */
  var callBox = mk('div', 'rp2-dock');
  callBox.innerHTML = '<div class="rp2-calls" role="group" aria-label="Your call">' +
    ['SN1', 'SN2', 'E1', 'E2', 'No reaction'].map(function(m){ return '<button type="button" class="tchip rp2-call" data-path="' + m + '">' + m + '</button>'; }).join('') + '</div>' +
    '<div class="rp2-res" id="rpRes"></div><div class="rp2-why" id="rpWhy"></div>' +
    '<div class="trow rp2-next-row"><button type="button" class="ls-btn ls-pri" id="rpNext" hidden>Next flask</button></div>' +
    '<p class="rp2-score tmuted" id="rpScore"></p>';
  var resEl = callBox.querySelector('#rpRes'), whyEl = callBox.querySelector('#rpWhy'), nextBtn = callBox.querySelector('#rpNext'), scoreEl = callBox.querySelector('#rpScore');
  function newQuizFlask(){
    var pick = null;
    for(var tries = 0; tries < 60 && !pick; tries++){
      var c = { sub: SUBSTRATES[Math.floor(Math.random() * SUBSTRATES.length)], rgt: REAGENTS[Math.floor(Math.random() * REAGENTS.length)],
        solvent: SOLVENTS[Math.floor(Math.random() * SOLVENTS.length)], heat: Math.random() < 0.4 };
      var id = c.sub.id + '/' + c.rgt.id + '/' + c.solvent.id + (c.heat ? '/h' : '');
      if(quiz.recent.indexOf(id) < 0){ pick = c; quiz.recent.push(id); if(quiz.recent.length > 12) quiz.recent.shift(); }
    }
    quiz.flask = pick; quiz.guess = null; quiz.revealed = false;
  }
  function callTask(){
    var c = quiz.flask;
    if(!c) return { kicker: 'Test yourself', title: 'Call the path', todo: '' };
    return { kicker: 'Test yourself', title: esc(upper(c.sub.name)) + ' + <b>' + esc(c.rgt.name) + '</b>, ' + esc(c.solvent.name.toLowerCase()) + ' solvent, ' + (c.heat ? 'heated' : 'room temperature') + '. Which path wins?',
      todo: 'Read the carbon and the reagent on the picture, then make your call.' };
  }
  function paintCall(){
    var c = quiz.flask, p = predict(c), right = quiz.guess === p.major;
    [].forEach.call(callBox.querySelectorAll('.rp2-call'), function(b){
      var m = b.getAttribute('data-path');
      b.disabled = quiz.revealed;
      b.classList.toggle('is-right', quiz.revealed && m === p.major);
      b.classList.toggle('is-wrong', quiz.revealed && m === quiz.guess && !right);
      b.setAttribute('aria-pressed', m === quiz.guess ? 'true' : 'false');
    });
    nextBtn.hidden = !quiz.revealed;
    scoreEl.textContent = quiz.score.total ? quiz.score.right + ' of ' + quiz.score.total + ' right' : '';
    if(!quiz.revealed){ resEl.innerHTML = ''; whyEl.innerHTML = ''; return; }
    resEl.innerHTML = '<div class="tnote ' + (right ? 'tnote--good' : 'tnote--bad') + '"><span class="tnote__k">' + (right ? 'Right: ' + esc(p.major) : 'Not quite: it is ' + esc(p.major) + ', not ' + esc(quiz.guess)) + '</span>' +
      (p.minor ? 'With some ' + esc(p.minor) + ' alongside it.' : p.major === 'No reaction' ? 'Nothing worth writing down happens here.' : 'One clear winner.') + '</div>';
    var link = MECH_LINK[p.major];
    whyEl.innerHTML = '<p>' + esc(clean(p.verdict)) + '</p><ol class="rp2-steps">' + p.reasons.map(function(r){ return '<li><b>' + esc(r.factor) + '</b> argues ' + esc(r.leans) + '. ' + esc(clean(r.text)) + '</li>'; }).join('') + '</ol>' +
      (link ? '<p><a href="arrow-pusher.html?start=' + encodeURIComponent(link.id) + '">' + esc(link.label) + ' in Arrow Pusher &rarr;</a></p>' : '');
  }
  callBox.querySelector('.rp2-calls').addEventListener('click', function(e){
    var b = e.target.closest('.rp2-call'); if(!b || quiz.revealed) return;
    var p = predict(quiz.flask);
    quiz.guess = b.getAttribute('data-path'); quiz.revealed = true; quiz.score.total++;
    if(quiz.guess === p.major) quiz.score.right++;
    paintCall();
    // on a phone the picture sits under the question: bring it into view to watch the run
    if(PHONE && window.LevlMotion && window.LevlMotion.scrollIntoView) window.LevlMotion.scrollIntoView(sceneBox, { block: 'nearest' });
    play();
  });
  nextBtn.addEventListener('click', function(){ newQuizFlask(); studio.task(callTask(), 'quiz'); paintCall(); play(null, { still: true }); });

  /* ---- modes ------------------------------------------------------------------------------ */
  function onShow(mode, part){
    stopRun(false);
    hideCue(false);
    if(tour && tour.active()) tour.stop();
    MODE.mode = mode; MODE.part = part;
    stage.setAttribute('data-part', mode === 'quiz' ? part : 'explore');
    head.el.hidden = mode !== 'explore';
    var call = mode === 'quiz' && part === 'call';
    bar.hidden = call;
    if(call){
      if(!quiz.flask) newQuizFlask();
      studio.task(callTask(), 'quiz');
      paintCall();
      if(quiz.revealed) play(null, { quiet: true, settle: true }); else play(null, { still: true });
      if(run && quiz.revealed){ stopRun(true); }
      return;
    }
    // Explore (and Check yourself, where the Explore picture stays live): settled on the flask as it was
    play(null, { quiet: true });
    stopRun(true);
    if(mode === 'explore') placeCue();
  }

  root.hidden = true;
  mountQuiz();
  fillPickers();
  var q = window.OchemToolState ? window.OchemToolState.read() : {};
  (function(){
    var qs = find(SUBSTRATES, q.sub), qr = find(REAGENTS, q.rgt), qv = find(SOLVENTS, q.solv);
    if(qs) state.sub = qs; if(qr) state.rgt = qr; if(qv) state.solvent = qv;
    state.heat = q.heat === '1';
  })();
  paintControls();
  refFill();
  var kitApi = Kit.kit2({
    stage: stage, ref: ref, onShow: onShow,
    parts: [{ value: 'call', label: 'Call the path', dock: callBox, task: function(){ return callTask(); } }],
    check: { label: 'Check yourself: 6 questions', task: { kicker: 'Test yourself', title: 'Check yourself', todo: 'Six flasks, one call each. The picture stays live, so try a flask there first if you like.' } }
  });
  void kitApi;
  byId('rpRefHow').addEventListener('click', function(){ studio.close(); if(MODE.mode === 'explore') startTour(); });

  /* "?" on a phone covers the whole stage, and a mode change hides it: a run in progress stops there and the picture
     settles on its end (no timer keeps going behind a sheet). */
  (function(){
    var sheet = studio.root.querySelector('.ls-sheet');
    if(!sheet || !window.MutationObserver) return;
    function check(){
      var open = studio.root.classList.contains('is-sheet') && !sheet.hidden;
      if(!open || !run) return;
      var r = sceneBox.getBoundingClientRect(), qq = sheet.getBoundingClientRect();
      if((qq.left <= r.left + 1 && qq.right >= r.right - 1) || PHONE) stopRun(true);
    }
    var mo = new MutationObserver(check);
    mo.observe(studio.root, { attributes: true, attributeFilter: ['class'] });
    mo.observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
  })();
  document.addEventListener('visibilitychange', function(){ if(document.hidden && run) stopRun(true); });

  // a substrate drawn in another tool and sent here
  if(q.build && window.OchemToolHandoff){
    var bbox = ref.querySelector('#rpBuildBox');
    if(bbox){
      bbox.open = true;
      var api = openBuilder(), got = window.OchemToolHandoff.decode ? window.OchemToolHandoff.decode(q.build) : null;
      // the link carries the builder's own text form (another tool's Send); a typed formula also works
      if(api){ if(got && api.load) api.load(got); else api.build(q.build); }
    }
  }
  // a new size draws the picture again, settled
  var lastW = 0, lastH = 0;
  function resized(){
    var w = sceneBox.clientWidth, h = sceneBox.clientHeight;
    if(!w || (w === lastW && h === lastH)) return;
    var first = !lastW; lastW = w; lastH = h;
    if(first) return;
    var call = MODE.mode === 'quiz' && MODE.part === 'call';
    if(run){ stopRun(false); }
    if(call && !quiz.revealed) play(null, { still: true }); else { play(null, { quiet: true }); stopRun(true); }
    if(cue && MODE.mode === 'explore') placeCue();
  }
  if(window.ResizeObserver) new ResizeObserver(resized).observe(sceneBox); else window.addEventListener('resize', resized);
  lastW = sceneBox.clientWidth; lastH = sceneBox.clientHeight;
  if(MODE.mode === 'explore'){ play(); placeCue(); }
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(!run && S){ if(MODE.mode === 'explore' || quiz.revealed){ play(null, { quiet: true }); stopRun(true); } } });

  window.OchemReactionPredictor.view = { state: state, quiz: quiz, mode: function(){ return MODE; }, play: play, settled: settled,
    S: function(){ return S; }, V: function(){ return V; }, LAY: function(){ return LAY; }, frameAt: function(i){ return S && S.frames[i]; } };
})();
