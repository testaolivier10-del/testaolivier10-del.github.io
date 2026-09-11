/* Arrow Pusher — draw a mechanism, see what it makes.

   The old version of this let you draw an arrow and then told you, in words,
   which two things you had clicked. That is not feedback; it is a receipt.
   Nothing was evaluated, the molecule never changed, and the hint printed
   above the canvas gave away the arrows before you drew them — so there was
   nothing to find out, which is the only reason to use a sandbox at all.

   What makes this one worth opening is that the arrows have consequences.
   chem-core.js applies them, so the structure on the right is the structure
   your arrows actually produce: bonds gone, charges recalculated, fragments
   separated. And because the checks are valence rules rather than a stored
   answer, the tool can be honestly ungraded and still tell you something
   true — there is no "right" mechanism here, but there are arrows that could
   not have happened, and it knows the difference.

   The hint is still available. It is just behind a disclosure now, so asking
   for it is a decision rather than the default. */
(function(){
  var Mol = window.OchemMolecules;
  var Editor = window.OchemMoleculeEditor;
  var C = window.OchemChem;
  var root = document.getElementById('apRoot');
  if(!Mol || !Editor || !C || !root) return;

  /* Grouped, because "pick a molecule" is a different question depending on
     what you sat down to practise. The order inside each group runs from the
     mechanism you meet first to the one you meet last. */
  var GROUPS = [
    { label: 'Substitution & elimination', picks: [
      { id:'sn2-bromoethane', label:'SN2',
        hint:'Two arrows, drawn at the same time: hydroxide’s lone pair into the carbon, and the C–Br bond onto bromine. Draw only the first and the tool will tell you what carbon ends up holding.' },
      { id:'sn1-secondary', label:'SN1 ionization',
        hint:'One arrow. The C–Br bond’s electrons leave with bromide, and nothing attacks yet — that separation of steps is the whole of SN1.' },
      { id:'sn2-tertiary', label:'Blocked SN2',
        hint:'You can draw the SN2 here and it will be legal. Look at what is crowding the carbon and ask whether a nucleophile could physically reach it.' },
      { id:'e2-butane', label:'E2',
        hint:'Three arrows in the real mechanism; two if no base is drawn. The C–H bond into the C–C bond, and the C–Br bond onto bromine.' }
    ]},
    { label: 'Carbonyls', picks: [
      { id:'formaldehyde', label:'Formaldehyde',
        hint:'Push the C=O pi bond up onto oxygen. Watch which atom goes positive and which goes negative, and ask yourself whether that is the right way round.' },
      { id:'acetaldehyde', label:'Aldehyde' },
      { id:'acetone', label:'Ketone',
        hint:'Same move as the aldehyde. The interesting comparison is how hindered this carbon is next to formaldehyde’s.' },
      { id:'methyl-acetate', label:'Ester',
        hint:'The first arrow is the same as a ketone’s. The difference comes one step later, when the tetrahedral intermediate has a group it can push back out.' },
      { id:'acetyl-chloride', label:'Acyl chloride' },
      { id:'acetamide', label:'Amide',
        hint:'Try pushing the nitrogen lone pair into the C–N bond. What happens to the carbonyl tells you why amides are so unreactive.' }
    ]},
    { label: 'Additions', picks: [
      { id:'propene-hbr', label:'Markovnikov addition',
        hint:'The pi bond is the nucleophile here, not the electrophile. Push it at the hydrogen of H–Br and let the H–Br bond collapse onto bromine.' },
      { id:'propylene-oxide', label:'Epoxide opening',
        hint:'A leaving group that cannot leave, because it is tied on at both ends. Attack a ring carbon and open the C–O bond onto oxygen.' },
      { id:'benzene', label:'Aromatic ring',
        hint:'The ring can attack, but it pays for it: push a pi bond out and see what the ring is left holding.' }
    ]},
    { label: 'Acids & bases', picks: [
      { id:'acetic-acid', label:'Carboxylic acid',
        hint:'Break the O–H bond and give both electrons to oxygen. Then look at the anion and ask what else could be done with the second oxygen.' },
      { id:'water', label:'Water' },
      { id:'ammonia', label:'Ammonia',
        hint:'One lone pair, two jobs. Push it at a proton and it is a base; push it at a carbon and it is a nucleophile.' },
      { id:'ethylamine', label:'Amine' },
      { id:'acetate-ion', label:'Acetate' }
    ]}
  ];

  var ALL = GROUPS.reduce(function(acc, g){ return acc.concat(g.picks); }, []);

  var current = ALL[0];
  var start = null;      // the chosen molecule as a structure
  var lastArrows = [];
  var showBooks = false;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  root.innerHTML =
    '<div class="tpanel">' +
      '<div class="tpanel__head">Pick something to push electrons on</div>' +
      '<div id="apPicker"></div>' +
    '</div>' +
    '<div class="tsplit tsplit--wide">' +
      '<div>' +
        '<div class="tpanel">' +
          '<div class="tpanel__head"><span>Your arrows</span><span id="apName" class="tmuted"></span></div>' +
          '<div id="apEditor"></div>' +
          '<details id="apHintBox" class="ap-hint"><summary>Need a nudge?</summary><div id="apHint"></div></details>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="tpanel">' +
          '<div class="tpanel__head">What that produces</div>' +
          '<div id="apResult"></div>' +
        '</div>' +
        '<div class="tpanel tpanel--flat">' +
          '<div class="tpanel__head">' +
            '<span>Electron bookkeeping</span>' +
            '<label class="tcheck"><input type="checkbox" id="apBooks"> show</label>' +
          '</div>' +
          '<div id="apBooksBody"><p class="tmuted" style="margin:0;">Every atom’s lone pairs, bonds and formal charge — the arithmetic behind the charges, in case you want to check it by hand.</p></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var elPicker  = document.getElementById('apPicker');
  var elName    = document.getElementById('apName');
  var elResult  = document.getElementById('apResult');
  var elHint    = document.getElementById('apHint');
  var elHintBox = document.getElementById('apHintBox');
  var elBooks   = document.getElementById('apBooksBody');

  document.getElementById('apBooks').addEventListener('change', function(e){
    showBooks = e.target.checked;
    renderBooks();
  });

  elPicker.innerHTML = GROUPS.map(function(g){
    return '<div class="ap-group">' +
      '<div class="ap-group__label">' + esc(g.label) + '</div>' +
      '<div class="tchips">' + g.picks.map(function(p){
        return '<button type="button" class="tchip" data-id="' + esc(p.id) + '">' + esc(p.label) + '</button>';
      }).join('') + '</div>' +
    '</div>';
  }).join('');

  elPicker.querySelectorAll('.tchip').forEach(function(b){
    b.addEventListener('click', function(){
      var pick = null;
      ALL.forEach(function(p){ if(p.id === b.getAttribute('data-id')) pick = p; });
      if(pick) select(pick);
    });
  });

  function select(pick){
    current = pick;
    lastArrows = [];
    elPicker.querySelectorAll('.tchip').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-id') === pick.id);
    });

    var mol = Mol.get(pick.id);
    start = C.fromMolecule(mol);
    elName.textContent = mol.name;

    Editor.mount(document.getElementById('apEditor'), {
      molecule: pick.id,
      maxArrows: 4,
      onChange: function(state){ lastArrows = state.arrows; update(); }
    });

    if(pick.hint){
      elHintBox.style.display = '';
      elHintBox.open = false;
      elHint.innerHTML = '<p class="tmuted" style="margin:0;">' + esc(pick.hint) + '</p>';
    } else {
      elHintBox.style.display = 'none';
    }

    update();
  }

  /* ---- The readout ------------------------------------------------------ */

  function update(){
    if(!lastArrows.length){
      elResult.innerHTML =
        '<div class="tempty">Draw an arrow and the product appears here.<br>' +
        'Click an electron source — a lone pair, or a bond — then click where those electrons go.</div>';
      renderBooks();
      return;
    }

    var res = C.apply(start, lastArrows);
    var errors = res.issues.filter(function(i){ return i.level === 'error'; });
    var warns  = res.issues.filter(function(i){ return i.level === 'warn'; });
    var html = '';

    // What the arrows mean, in words, before anything is judged.
    html += '<div class="tnote"><span class="tnote__k">What you drew</span>' +
      res.steps.map(function(s, i){
        return '<div>' + (res.steps.length > 1 ? (i+1) + '. ' : '') + esc(s.charAt(0).toUpperCase() + s.slice(1)) + '.</div>';
      }).join('') +
      (res.steps.length ? '' : '<div>Nothing legal to apply.</div>') +
    '</div>';

    /* Errors before the product. A structure built from an impossible arrow
       is not a product, and showing it first would give it a credibility it
       has not earned. */
    errors.forEach(function(e){
      html += '<div class="tnote tnote--bad"><span class="tnote__k">That cannot happen</span>' + esc(e.text) + '</div>';
    });
    warns.forEach(function(w){
      html += '<div class="tnote tnote--warn"><span class="tnote__k">Careful</span>' + esc(w.text) + '</div>';
    });

    if(!errors.length){
      var after = res.structure;
      var frags = C.fragments(after);
      html += '<div class="tstage">' +
        Mol.svg(C.toMolecule(after), { caption: '' }) +
      '</div>';
      html += '<div class="tfrags" style="margin-top:10px;">' +
        frags.map(function(f, i){
          var f0 = C.formula(after, f);
          var charged = /[⁺⁻]/.test(f0);
          return (i ? '<span class="tplus">+</span>' : '') +
                 '<span class="tfrag' + (charged ? ' tfrag--charged' : '') + '">' + esc(f0) + '</span>';
        }).join('') +
      '</div>';

      C.commentary(start, after).forEach(function(n){
        var cls = n.level === 'good' ? 'tnote--good' : (n.level === 'warn' ? 'tnote--warn' : 'tnote--info');
        var k = n.level === 'good' ? 'Looks right' : (n.level === 'warn' ? 'Worth a second look' : 'Note');
        html += '<div class="tnote ' + cls + '" style="margin-top:10px;"><span class="tnote__k">' + k + '</span>' + esc(n.text) + '</div>';
      });
    }

    elResult.innerHTML = html;
    renderBooks();
  }

  /* The arithmetic, spelled out. Formal charge is the one piece of bookkeeping
     students are asked to do by hand constantly and are rarely shown being
     done, so the table names each term of valence − lone pairs − bonds rather
     than just printing the answer. Hydrogens are left out unless they are
     charged: twenty rows of "H, 0, 1, 0" buries the three rows that matter. */
  function renderBooks(){
    if(!showBooks){
      elBooks.innerHTML = '<p class="tmuted" style="margin:0;">Every atom’s lone pairs, bonds and formal charge — the arithmetic behind the charges, in case you want to check it by hand.</p>';
      return;
    }
    var st = start;
    if(lastArrows.length){
      var res = C.apply(start, lastArrows);
      if(!res.issues.some(function(i){ return i.level === 'error'; })) st = res.structure;
    }
    var rows = Object.keys(st.atoms).filter(function(k){
      var a = st.atoms[k];
      if(a.group) return false;
      return a.el !== 'H' || C.formalCharge(st, k) !== 0;
    });
    if(!rows.length){ elBooks.innerHTML = '<p class="tmuted" style="margin:0;">Nothing to show.</p>'; return; }

    elBooks.innerHTML = '<div class="ttable-scroll"><table class="ttable">' +
      '<thead><tr><th>Atom</th><th>Valence e⁻</th><th>Lone pairs</th><th>Bonds</th><th>Formal charge</th></tr></thead><tbody>' +
      rows.map(function(k){
        var a = st.atoms[k];
        var fc = C.formalCharge(st, k);
        return '<tr>' +
          '<td class="num">' + esc(a.label) + '</td>' +
          '<td class="num">' + C.info(a.el).valence + '</td>' +
          '<td class="num">' + a.lp + ' <small class="tmuted">(' + (a.lp*2) + ' e⁻)</small></td>' +
          '<td class="num">' + C.totalBonds(st, k) + '</td>' +
          '<td class="num' + (fc ? ' win' : '') + '">' + (fc > 0 ? '+' : '') + fc + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<p class="tmuted" style="margin:10px 0 0;">Formal charge = valence electrons − lone-pair electrons − number of bonds. ' +
      'Hydrogens are hidden unless one of them is charged.</p>';
  }

  select(ALL[0]);
})();
