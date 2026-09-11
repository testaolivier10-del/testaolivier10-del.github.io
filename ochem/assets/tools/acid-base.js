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
      why:'The same trick with two ketones rather than two esters, and more acidic than phenol as a result. A carbon acid you can deprotonate with hydroxide.' }
  ];

  /* Atom ranking for the conjugate base's charge carrier. Across a row
     electronegativity decides; down a column size does, and size wins when
     the two conflict — which is why H₂S beats H₂O. The number is a rank, not
     a measurement: bigger means better at holding the charge. */
  var ATOM_RANK = { C:0, N:1, O:2, F:3, S:4, Cl:5, Br:6, I:7 };
  var ATOM_WHY = {
    C:'carbon', N:'nitrogen', O:'oxygen', F:'fluorine', S:'sulfur', Cl:'chlorine', Br:'bromine', I:'iodine'
  };
  var SAME_ROW = { C:2, N:2, O:2, F:2, S:3, Cl:3, Br:4, I:5 };

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
    var moved = (a.carrier && a.carrier !== a.atom) || (b.carrier && b.carrier !== b.atom);
    return {
      factor:'Atom',
      winner: winner,
      moved: moved,
      text: (moved ? 'Careful where you look: in one of these the proton comes off a carbon, but the charge does not stay there — resonance moves it onto oxygen, and it is the atom that ends up holding the charge that counts, not the one the hydrogen left. ' : '') +
        (sameRow
        ? 'The charge ends up on ' + ATOM_WHY[ca] + ' in one and ' + ATOM_WHY[cb] + ' in the other, and they are in the same row of the periodic table. ' +
          'Across a row, electronegativity decides: the more electronegative atom is happier holding the negative charge, so ' + winner.name + ' is the stronger acid.'
        : 'The charge lands on ' + ATOM_WHY[ca] + ' in one and ' + ATOM_WHY[cb] + ' in the other, and these are in different rows. ' +
          'Going DOWN a column, size beats electronegativity — the bigger atom spreads the same charge over a much larger volume. ' +
          'That is why ' + winner.name + ' wins even though it may be the less electronegative one.')
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
        'An s orbital is spherical and centred on the nucleus, so the more s character a hybrid has, the closer it holds its ' +
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
        '<div id="abVerdict" style="margin-top:14px;"></div>' +
      '</div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head">Atom, resonance, induction, orbital</div>' +
        '<div id="abFactors"></div>' +
      '</div>' +
    '</div>' +

    '<div id="abRank" hidden>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head"><span>Click them from most acidic to least</span>' +
          '<button type="button" class="tchip" id="abNewRank">New set</button></div>' +
        '<div class="tchips" id="abRankPool"></div>' +
        '<div class="ab-order" id="abRankOrder"></div>' +
        '<div id="abRankVerdict"></div>' +
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
      if(m === 'rank' && !rankPool.length) newRank();
    });
  });

  function resetPair(){
    guess = null; revealed = false;
    renderPair();
  }

  function renderPair(){
    document.getElementById('abScore').textContent = score.total ? score.right + ' of ' + score.total + ' right' : '';

    document.getElementById('abCards').innerHTML = [left, right].map(function(a){
      return '<div class="ab-card' + (revealed && a === analyse(left, right).truth ? ' ab-card--win' : '') + '">' +
        '<div class="ab-card__name">' + esc(a.name) + '</div>' +
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

  /* ---- Ranking mode ----------------------------------------------------- */

  function newRank(){
    var pool = ACIDS.slice();
    rankPool = [];
    for(var i=0;i<4;i++) rankPool.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    rankOrder = [];
    rankChecked = false;
    renderRank();
  }

  function renderRank(){
    document.getElementById('abRankPool').innerHTML = rankPool.map(function(a){
      var placed = rankOrder.indexOf(a) !== -1;
      return '<button type="button" class="tchip" data-id="' + esc(a.id) + '"' + (placed || rankChecked ? ' disabled' : '') + '>' +
        esc(a.name) + ' <span class="tmuted">' + esc(a.formula) + '</span></button>';
    }).join('');
    document.getElementById('abRankPool').querySelectorAll('.tchip').forEach(function(b){
      b.addEventListener('click', function(){
        rankPool.forEach(function(a){ if(a.id === b.getAttribute('data-id') && rankOrder.indexOf(a) === -1) rankOrder.push(a); });
        if(rankOrder.length === 4) rankChecked = true;
        renderRank();
      });
    });

    var truth = rankPool.slice().sort(function(x, y){ return x.pKa - y.pKa; });

    document.getElementById('abRankOrder').innerHTML = rankOrder.map(function(a, i){
      var ok = rankChecked && truth[i] === a;
      return '<div class="ab-slot' + (rankChecked ? (ok ? ' ab-slot--ok' : ' ab-slot--no') : '') + '">' +
        '<span class="ab-slot__n">' + (i + 1) + '</span>' +
        '<span>' + esc(a.name) + '</span>' +
        (rankChecked ? '<span class="ab-slot__pka">pKa ' + a.pKa + '</span>' : '') +
      '</div>';
    }).join('') || '<div class="tempty">Click the most acidic one first.</div>';

    if(!rankChecked){ document.getElementById('abRankVerdict').innerHTML = ''; return; }

    var got = rankOrder.every(function(a, i){ return truth[i] === a; });
    document.getElementById('abRankVerdict').innerHTML =
      '<div class="tnote ' + (got ? 'tnote--good' : 'tnote--bad') + '" style="margin-top:14px;">' +
        '<span class="tnote__k">' + (got ? 'All four in order' : 'Not the right order') + '</span>' +
        'Most acidic to least: ' + truth.map(function(a){
          return esc(a.name) + ' (' + a.pKa + ')';
        }).join(' → ') + '.' +
      '</div>' +
      '<div class="ttable-scroll"><table class="ttable">' +
        '<thead><tr><th>Acid</th><th>pK<sub>a</sub></th><th>Why</th></tr></thead><tbody>' +
        truth.map(function(a){
          return '<tr><td style="white-space:nowrap;"><b>' + esc(a.name) + '</b><br><span class="tmuted">' + esc(a.formula) + '</span></td>' +
            '<td class="num">' + a.pKa + '</td><td>' + esc(a.why) + '</td></tr>';
        }).join('') +
      '</tbody></table></div>';
  }

  document.getElementById('abNewRank').addEventListener('click', newRank);

  renderPair();
})();
