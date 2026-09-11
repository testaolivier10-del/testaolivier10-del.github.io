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
  var start = null;      // the structure the current step starts from
  var lastArrows = [];
  var showBooks = false;

  /* The mechanism so far. Each entry is one committed step: the structure it
     started from and the arrows that were drawn on it. Real mechanisms are
     three and four steps long, and a tool that applies one set of arrows and
     then forgets can only ever show the first — which is the step students
     already understand. */
  var history = [];
  var origin = null;     // the structure step 1 started from, for Start over
  var builderApi = null;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  root.innerHTML =
    '<div class="tpanel">' +
      '<div class="tpanel__head">' +
        '<span>Pick something to push electrons on</span>' +
        '<div class="tseg" id="apSrc">' +
          '<button type="button" data-src="lib" class="on">Ready-made</button>' +
          '<button type="button" data-src="build">Build your own</button>' +
        '</div>' +
      '</div>' +
      '<div id="apPicker"></div>' +
      '<div id="apBuilder" hidden></div>' +
      '<div id="apBuildMsg"></div>' +
    '</div>' +
    '<div class="tsplit tsplit--wide">' +
      '<div>' +
        '<div class="tpanel">' +
          '<div class="tpanel__head"><span>Your arrows</span><span id="apName" class="tmuted"></span></div>' +
          '<div id="apSteps" class="ap-steps"></div>' +
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
  var elSteps   = document.getElementById('apSteps');
  var elBuilder = document.getElementById('apBuilder');
  var elBuildMsg= document.getElementById('apBuildMsg');

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
    elPicker.querySelectorAll('.tchip').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-id') === pick.id);
    });

    var mol = Mol.get(pick.id);
    begin(C.fromMolecule(mol), mol.name);

    if(pick.hint){
      elHintBox.style.display = '';
      elHintBox.open = false;
      elHint.innerHTML = '<p class="tmuted" style="margin:0;">' + esc(pick.hint) + '</p>';
    } else {
      elHintBox.style.display = 'none';
    }
    update();
  }

  /* Start a fresh mechanism from a structure, wherever it came from — the
     library, the builder, or the product of a step that has just been
     committed. Everything that used to live inside select() is here, so a
     built molecule is not a second-class citizen with its own code path. */
  function begin(st, name){
    history = [];
    origin = C.clone(st);
    startStep(st, name);
  }

  function startStep(st, name){
    start = st;
    lastArrows = [];
    if(name !== undefined) elName.textContent = name;
    remount();
    renderSteps();
  }

  function remount(){
    Editor.mount(document.getElementById('apEditor'), {
      // A structure rather than an id, which is what lets a mechanism carry on
      // from its own product instead of restarting from the library entry.
      molecule: C.toMolecule(start),
      arrows: lastArrows,
      maxArrows: 4,
      caption: '',
      onChange: function(state){ lastArrows = state.arrows; update(); }
    });
  }

  /* ---- The mechanism so far ---------------------------------------------

     A strip of committed steps, each clickable. Going back to one truncates
     what came after it and restores the arrows that were drawn there, so a
     mechanism that went wrong at step 2 is edited at step 2 rather than
     abandoned. */
  /* Per fragment, not over the whole structure. Once an SN2 has happened the
     bromide is still in the same structure object, so a whole-structure
     formula reports C2H6BrO for both the substrate and the products and the
     strip looks like nothing happened — which is exactly the thing the strip
     exists to show. */
  function formulaOf(st){
    return C.fragments(st).map(function(f){ return C.formula(st, f); }).join(' + ');
  }

  function renderSteps(){
    if(!history.length){ elSteps.innerHTML = ''; return; }
    elSteps.innerHTML =
      '<span class="ap-steps__k">Mechanism</span>' +
      history.map(function(h, i){
        return '<button type="button" class="ap-step" data-step="' + i + '" ' +
          'title="Go back and redraw this step">' +
          '<span class="ap-step__n">' + (i + 1) + '</span>' +
          '<span class="ap-step__f">' + esc(formulaOf(h.st)) + '</span>' +
        '</button><span class="ap-step__arrow">&rarr;</span>';
      }).join('') +
      '<span class="ap-step ap-step--now"><span class="ap-step__n">' + (history.length + 1) + '</span>' +
      '<span class="ap-step__f">' + esc(formulaOf(start)) + '</span></span>' +
      '<button type="button" class="tchip tchip--mini ap-steps__reset" id="apReset">Start over</button>';

    elSteps.querySelectorAll('[data-step]').forEach(function(b){
      b.addEventListener('click', function(){
        var i = parseInt(b.getAttribute('data-step'), 10);
        var entry = history[i];
        history = history.slice(0, i);
        start = entry.st;
        lastArrows = entry.arrows.slice();
        remount();
        renderSteps();
        update();
      });
    });
    var reset = document.getElementById('apReset');
    if(reset) reset.addEventListener('click', function(){
      if(!origin) return;
      history = [];
      startStep(C.clone(origin));
      update();
    });
  }

  function commitStep(){
    var res = C.apply(start, lastArrows);
    if(res.issues.some(function(i){ return i.level === 'error'; })) return;
    history.push({ st: start, arrows: lastArrows.slice() });
    startStep(res.structure);
    update();
  }

  /* ---- Build your own ----------------------------------------------------

     The picker is twenty molecules somebody chose. This is the half where a
     student pushes electrons on the thing from their own problem set — which
     is the only situation in which anyone opens an arrow-pushing sandbox at
     all. The checks are valence rules rather than a stored answer key, so
     they hold just as well on a structure nobody anticipated. */
  function openBuilder(){
    if(builderApi) return;
    if(!window.OchemBuilderUI){
      elBuildMsg.innerHTML = '<div class="tnote tnote--bad">The builder did not load on this page.</div>';
      return;
    }
    builderApi = window.OchemBuilderUI.mount(elBuilder, {
      onChange: function(st, report){
        if(report.empty){ elBuildMsg.innerHTML = ''; return; }
        if(!report.ok){
          elBuildMsg.innerHTML = '<div class="tnote tnote--bad" style="margin-top:12px;">' +
            'Fix what is flagged below first. There is no point pushing electrons around a structure that could not exist.</div>';
          return;
        }
        elBuildMsg.innerHTML = '<div class="tnote tnote--good" style="margin-top:12px;">' +
          '<span class="tnote__k">Ready</span>Push electrons on it below. Nothing here is graded — but an arrow that could not have happened will still be told so.</div>';
        elHintBox.style.display = 'none';
        // A fresh copy each time, so editing the drawing does not reach into a
        // mechanism that is already part-way through.
        begin(C.clone(st), st.name || report.formula);
        update();
      }
    });
  }

  document.getElementById('apSrc').querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      var src = b.getAttribute('data-src');
      document.getElementById('apSrc').querySelectorAll('button').forEach(function(x){
        x.classList.toggle('on', x === b);
      });
      elPicker.hidden = (src !== 'lib');
      elBuilder.hidden = (src !== 'build');
      if(src === 'build'){ openBuilder(); }
      else { elBuildMsg.innerHTML = ''; select(current); }
    });
  });

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

      plausibility(start, after).forEach(function(n){
        html += '<div class="tnote tnote--warn" style="margin-top:10px;">' +
          '<span class="tnote__k">Legal, but</span>' + esc(n) + '</div>';
      });

      html += '<div class="trow" style="margin-top:14px;">' +
        '<button type="button" class="btn-press" id="apCommit">Use this as the next step &rarr;</button>' +
        '<span class="tmuted" style="font-size:12.5px;">Mechanisms are three and four steps long. Commit this one and keep going.</span>' +
      '</div>';
    }

    elResult.innerHTML = html;
    var commit = document.getElementById('apCommit');
    if(commit) commit.addEventListener('click', commitStep);
    renderBooks();
  }

  /* ---- Legal, but ---------------------------------------------------------

     The valence checks answer "could these electrons have moved". They cannot
     answer "would they", and the gap between those two is where most of a
     mechanism mark actually lives — a primary carbocation breaks no rule and
     does not happen, and a student who only ever hears "that cannot happen"
     learns that anything not rejected is fine.

     So these are the middle category, stated as a reservation rather than a
     verdict: everything here IS a legal arrow, and the tool says so first. */
  function plausibility(before, after){
    var notes = [];

    function carbonNeighbours(st, k){
      return C.neighbors(st, k).filter(function(n){
        var a = st.atoms[n];
        return a && (a.el === 'C' || (a.group && C.anchorElement(a.label) === 'C'));
      }).length;
    }

    Object.keys(after.atoms).forEach(function(k){
      var b = before.atoms[k], a = after.atoms[k];
      if(!b || !a || a.el !== 'C') return;
      var was = C.formalCharge(before, k), now = C.formalCharge(after, k);

      if(now === 1 && was !== 1){
        var subst = carbonNeighbours(after, k);
        if(subst <= 1){
          notes.push(subst === 0
            ? 'That makes a methyl cation. Nothing stabilizes it at all, and it is high enough in energy that reactions simply take another route — which is why there is no SN1 on a methyl halide.'
            : 'That makes a PRIMARY carbocation. It breaks no rule, but only one alkyl group is donating toward it and the barrier is high enough that primary substrates essentially never ionize. If a mechanism needs this, the mechanism is usually wrong.');
        } else if(subst === 2){
          notes.push('A secondary carbocation — real, but borderline. Whether it forms depends on the solvent and what else is available; a strong nucleophile will usually reach the carbon before it ever ionizes.');
        }
      }

      if(now === -1 && was !== -1){
        // A carbanion next to a pi system or an electronegative atom is an
        // enolate or similar and perfectly ordinary. Naked, it is not.
        var propped = C.neighbors(after, k).some(function(n){
          var nb = after.atoms[n];
          if(!nb) return false;
          if(nb.el && nb.el !== 'C' && nb.el !== 'H') return true;
          var bond = C.findBond(after, k, n);
          return bond && bond.order > 1;
        });
        if(!propped){
          notes.push('That leaves a negative charge on a carbon with nothing next to it to share the load — no carbonyl, no pi system, no electronegative neighbour. Carbon is the worst of the common atoms at holding a negative charge, so this is a very basic, very reactive species.');
        }
      }
    });

    /* A fragment that has just left. A leaving group is only as good as its
       conjugate acid is strong, and hydroxide leaving is the single most
       common wrong arrow in the course. */
    var beforeFrags = C.fragments(before).length;
    var afterFrags = C.fragments(after);
    if(afterFrags.length > beforeFrags){
      afterFrags.forEach(function(f){
        if(f.length > 2) return;
        var el = f.map(function(k){ return after.atoms[k]; })
                  .filter(function(a){ return a && a.el && a.el !== 'H'; })[0];
        if(!el) return;
        var q = f.reduce(function(n, k){ return n + C.formalCharge(after, k); }, 0);
        if(q >= 0) return;
        if(el.el === 'O'){
          notes.push('Something left as an oxygen anion — hydroxide or an alkoxide. Those are strong bases, which makes them poor leaving groups: in practice the OH is protonated to water first, and water leaves instead.');
        } else if(el.el === 'N'){
          notes.push('An amide anion leaving is worse still — nitrogen holds a negative charge less comfortably than oxygen, so an amine leaves only after it has been protonated or otherwise turned into something stable.');
        } else if(el.el === 'C'){
          notes.push('A carbanion leaving group is essentially unheard of outside a few specific reactions. Carbon is the worst of the common atoms at carrying the charge it would have to take with it.');
        }
      });
    }

    return notes;
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
