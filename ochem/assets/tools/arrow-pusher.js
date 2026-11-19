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
  var sendApi = null;
  var lastBuilt = null;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* Landing (owner brief 2026-10-09): the mode switch and one plain first
     step above the tool; the first row of starting molecules, with the rest
     behind More molecules; the bookkeeping table behind a disclosure in the
     result panel. */
  root.innerHTML =
    '<div class="tool-modes">' +
      '<div class="tseg" id="apSrc" role="group" aria-label="Mode">' +
        '<button type="button" data-src="lib" class="on">Ready-made</button>' +
        '<button type="button" data-src="build">Build your own</button>' +
        '<button type="button" data-src="chal">Mechanism challenge</button>' +
      '</div>' +
    '</div>' +
    '<div class="tpanel">' +
      '<div id="apBuilder" hidden></div>' +
      '<div id="apBuildMsg"></div>' +
      '<div id="apSend"></div>' +
    '</div>' +
    '<div class="tsplit tsplit--wide">' +
      '<div>' +
        '<div class="tpanel">' +
          '<div class="tpanel__head"><span>Your arrows</span><span id="apName" class="tmuted"></span></div>' +
          '<div id="apSteps" class="ap-steps"></div>' +
          '<div id="apEditor"></div>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="tpanel">' +
          '<div class="tpanel__head">What that produces</div>' +
          '<div aria-live="polite" id="apResult"></div>' +
          '<details class="tool-more" id="apBooksBox"><summary>Electron bookkeeping</summary>' +
            '<div id="apBooksBody"></div>' +
          '</details>' +
        '</div>' +
      '</div>' +
    '</div>';

  var elName    = document.getElementById('apName');
  var elResult  = document.getElementById('apResult');
  var elBooks   = document.getElementById('apBooksBody');
  var elSteps   = document.getElementById('apSteps');
  var elBuilder = document.getElementById('apBuilder');
  var elBuildMsg= document.getElementById('apBuildMsg');

  document.getElementById('apBooksBox').addEventListener('toggle', function(e){
    showBooks = e.target.open;
    renderBooks();
  });


  /* ---- Tool Studio, the standard frame (docs/tools-frame-2026-11.md, F1) ----
     tool-shell.js mounts the frame; setupStudio() (near the end, once the
     challenges exist) moves these same elements into it:
       Explore    the 21 ready-made molecules in one grouped dropdown on the
                  stage; your arrows and what they make side by side; Undo and
                  Reset at the stage's foot; "What happened" (the readout and
                  the chemistry notes) in the side panel; each molecule's
                  nudge in the hint ladder.
       Build      the builder only (type, the canvas and its tools on the
                  stage, "Start from" in the dropdown); "Push electrons on
                  this" carries the drawing to Explore; sending it to another
                  tool is in the menu.
       Challenge  7 challenges in the dropdown, the target behind "Show target
                  structure", a Step marker and the intermediate for the two
                  step ones, Check first, hints (first instant, Show one arrow
                  after one wrong check), and the finished card.
     The formal charge table, how an arrow works and the keys are behind "?".
     studioAfter() runs after every readout and lifts the product drawing,
     the notes and the actions out of it; nothing else is redrawn. */
  var studio = window.OchemStudio || null, ls = null;
  function firstSentence(t){ var m = /^.*?[.!?](?=\s|$)/.exec(String(t || '')); return m ? m[0] : String(t || ''); }
  function upper1(s){ s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function fragsOf(st){ return C.fragments(st).map(function(f){ return C.formula(st, f); }).join(' + '); }

  function studioAfter(){
    if(!ls) return;
    var m = ls.mode() || 'lib';
    if(m === 'build'){ buildAfter(); return; }
    ls.out.innerHTML = ''; ls.act.innerHTML = ''; ls.notes.innerHTML = '';
    var pic = elResult.querySelector('.tstage'), fr = elResult.querySelector('.tfrags');
    if(pic){
      ls.out.innerHTML = '<p class="ls-pane-k">' + (chal.on ? 'Target' : 'What they make') + '</p>';
      ls.out.appendChild(pic); if(fr) ls.out.appendChild(fr);
    }
    ls.out.hidden = !pic || (chal.on && !ls.showTarget);
    ls.to.hidden = ls.out.hidden || chal.on;
    ls.note.hidden = true; ls.note.className = 'ap-note';
    function note(html, tone){ ls.note.innerHTML = html; ls.note.hidden = false; ls.note.className = 'ap-note ap-note--' + tone; }
    if(chal.on){ chalAfter(note); return; }
    studio.done(false, 'lib');
    var name = esc(elName.textContent || ''), left = [];
    if(!lastArrows.length){
      studio.task({ kicker: 'Explore', title: 'Push electrons on ' + (ls.built ? 'your molecule' : name) + '.',
        todo: 'Tap a lone pair or a bond, then tap where those electrons go.' }, 'lib');
    } else {
      var res = C.apply(start, lastArrows);
      var err = res.issues.filter(function(i){ return i.level === 'error'; })[0];
      var notes = [].slice.call(elResult.querySelectorAll('.tnote'));
      // "What you drew" repeats the head when there is one arrow; with more it lists them all.
      if(res.steps.length < 2) notes = notes.slice(1);
      notes.forEach(function(n){ n.style.marginTop = ''; ls.notes.appendChild(n); });
      if(err){
        left.push({ html: 'That cannot happen', tone: 'bad' });
        note('<b>That cannot happen.</b> ' + esc(firstSentence(upper1(err.text))), 'bad');
        studio.task({ kicker: 'That cannot happen', tone: 'bad', title: esc(firstSentence(upper1(err.text))),
          todo: 'Undo it, or tap the arrow to remove it.' }, 'lib');
      } else {
        if(fr) left.push({ html: esc(fr.textContent.replace(/\s*\+\s*/g, ' + ')) });
        if(elResult.querySelector('.tnote--warn')) left.push({ html: 'Legal, but…', tone: 'warn' });
        else if(elResult.querySelector('.tnote--good')) left.push({ html: 'Looks right', tone: 'good' });
        studio.task({ kicker: 'What happened', title: esc(upper1(res.steps[0] || 'Nothing legal to apply')) + '.' +
          (res.steps.length > 1 ? ' Plus ' + (res.steps.length - 1) + ' more arrow' + (res.steps.length > 2 ? 's' : '') + '.' : '') }, 'lib');
      }
      // The ways onward: use the product as the next step (a mechanism is several), or see it in 3D.
      var row = elResult.querySelector('.trow'), more = elResult.querySelector('.trow + .tmuted');
      if(row){
        var to3d = row.querySelector('a[href^="viewer-3d"]');
        ls.act.appendChild(row);
        if(more){ more.style.margin = ''; ls.act.appendChild(more); }
        if(to3d){ var tags = document.createElement('div'); tags.className = 'ls-tags'; to3d.className = 'ls-tag'; tags.appendChild(to3d); ls.notes.appendChild(tags); }
      }
    }
    studio.pills(left, 'left', 'lib');
    studio.pills([], 'right', 'lib');
    ls.hintsLib.paint();
    keepFocus();
  }
  // A re-render replaced the button that had focus: keep the keyboard in the panel.
  function keepFocus(){
    if((!document.activeElement || document.activeElement === document.body) && ls.act.querySelector('button')) ls.act.querySelector('button').focus({ preventScroll: true });
  }

  function chalAfter(note){
    var def = chal.def, n = def.steps.length, done = chal.i >= n, target = chal.states[chal.states.length - 1];
    studio.pills([{ html: esc(fragsOf(target)), k: 'Target', tone: 'readout' }], 'right', 'chal');
    var left = [];
    ls.stepMark.innerHTML = n > 1 ? def.steps.map(function(_, i){
      var d = i < chal.i, now = i === chal.i && !done;
      return '<span class="ap-sm' + (d ? ' is-done' : now ? ' is-now' : '') + '">' + (d ? LevlStudio.icon('check') : '') + 'Step ' + (i + 1) + (now ? ' of ' + n : '') + '</span>';
    }).join('<span class="ap-sm-line" aria-hidden="true"></span>') : '';
    ls.stepMark.hidden = n < 2 || done;
    if(done){
      left.push({ html: n > 1 ? 'Mechanism complete' : 'Both arrows right', tone: 'good' });
      if(def.steps[0].length === 1 && n === 1) left[0].html = 'Arrow right';
      var tk = def.take || [def.label + ' done.', ''];
      var Kit = window.OchemStudioKit;
      studio.done({
        kicker: 'Solved', title: esc(tk[0]),
        text: esc(tk[1]) + ' ' + (chal.wrong ? 'You got there with ' + chal.wrong + ' wrong check' + (chal.wrong > 1 ? 's' : '') + '.' : 'First time.'),
        next: { label: 'Next challenge', onClick: function(){ var i = CHALLENGES.indexOf(def); startChal(CHALLENGES[(i + 1) % CHALLENGES.length]); } },
        links: [{ label: 'Try it again', onClick: function(){ startChal(def); } }].concat(Kit ? Kit.extras({ topic: def.topic }) : [])
      }, 'chal');
      ls.why.innerHTML = '<h3 class="ls-title-l">' + esc(def.label) + ', arrow by arrow</h3>' +
        '<ol class="ls-steps">' + def.steps.map(function(arr, i){
          return '<li><span>' + (n > 1 ? '<b>Step ' + (i + 1) + '.</b> ' : '') + arrowsOf(arr).map(function(a){ return esc(upper1(C.deltaFor(chal.states[i], a).text)) + '.'; }).join(' ') + '</span></li>';
        }).join('') + '</ol><p>' + esc(tk[1]) + '</p>';
      note('<b>' + (n > 1 ? 'That is the whole mechanism.' : 'Right.') + '</b> The drawing now shows what your arrows made.', 'good');
    } else {
      studio.done(false, 'chal');
      ls.why.innerHTML = '';
      var goal = def.stepGoals ? def.stepGoals[chal.i] : def.goal;
      studio.task({ kicker: 'Challenge', title: esc(goal),
        todo: chal.i ? 'Step ' + chal.i + ' gave you this intermediate. Draw step ' + (chal.i + 1) + ' on it.' : 'Tap a lone pair or a bond, then tap where those electrons go.' }, 'chal');
      if(chal.verdict && chal.verdict.ok){
        left.push({ html: 'Step ' + (chal.verdict.step + 1) + ' right', tone: 'good' });
        note('<b>Step ' + (chal.verdict.step + 1) + ' right.</b> The drawing is now the intermediate.', 'good');
      } else if(chal.verdict){
        left.push({ html: 'Not this step yet', tone: 'bad' });
        // Short on the molecule; the whole reading of your arrows is the panel's Explanation.
        note('<b>Not this step yet.</b> ' + esc(firstSentence(chal.verdict.text)), 'bad');
        ls.why.innerHTML = '<h3 class="ls-title-l">Not this step yet</h3><p>' + esc(chal.verdict.text) + '</p>';
      }
      var ck = elResult.querySelector('#apChalCheck');
      if(ck){ ck.textContent = n > 1 ? 'Check step ' + (chal.i + 1) : 'Check'; ck.className = 'ls-btn ls-pri ap-check'; ls.act.appendChild(ck); }
    }
    studio.pills(left, 'left', 'chal');
    ls.hintsChal.paint();
    keepFocus();
  }

  function buildAfter(){
    studio.task({ kicker: 'Build your own', title: 'Draw any molecule, then push electrons on it.',
      todo: 'Type a formula or a name, or tap the canvas to place atoms and tap two atoms to bond them.' }, 'build');
    if(ls.push) ls.push.disabled = !lastBuilt;
  }

  function select(pick){
    current = pick;
    var mol = Mol.get(pick.id);
    if(ls){ ls.built = false; ls.pickLib.set(libPicks(pick.id)); ls.hintsLib.reset(); }
    begin(C.fromMolecule(mol), mol.name);
    update();
  }

  /* Start a fresh mechanism from a structure, wherever it came from — the
     library, the builder, or the product of a step that has just been
     committed. Everything that used to live inside select() is here, so a
     built molecule is not a second-class citizen with its own code path. */
  function begin(st, name, builtText){
    if(window.OchemToolState){
      var typed = document.getElementById('mbText');
      var built = builtText || (elBuilder && !elBuilder.hidden && typed && typed.value ? typed.value : null);
      window.OchemToolState.write({
        start: built ? null : (current && current.id),
        build: built
      });
    }
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
      // A wrong challenge check draws the arrows it did not want in red, on the molecule.
      marks: ls && ls.marks || null,
      // Once a source is picked, the likely ends pulse (audit 2026-10).
      targets: C.destinations ? function(src){ return C.destinations(start, src); } : null,
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
    /* The handoff row lives with the builder, because a structure you drew is
       the only kind worth carrying somewhere else — the twenty on the list are
       already one click away in every other tool. */
    if(window.OchemToolHandoff){
      sendApi = window.OchemToolHandoff.mountSend(
        document.getElementById('apSend'), function(){ return lastBuilt; });
    }
    builderApi = window.OchemBuilderUI.mount(elBuilder, {
      onChange: function(st, report){
        lastBuilt = report.empty ? null : (report.ok ? st : null);
        if(sendApi) sendApi.refresh();
        /* The standard frame: Build is the builder only. The drawing waits for "Push electrons on this",
           which carries it to Explore (pushBuilt). */
        if(ls){
          ls.builtName = report.ok ? (st.name || report.formula) : '';
          elBuildMsg.innerHTML = report.empty ? '' : report.ok
            ? '<div class="tnote tnote--good"><b>' + esc(st.name ? st.name + ', ' + report.formula : report.formula) + '.</b> Every atom checks out.</div>'
            : '<div class="tnote tnote--bad">Fix what is flagged on the canvas first. Arrows on a structure that could not exist teach nothing.</div>';
          buildAfter();
          if(ls.autoPush && lastBuilt){ ls.autoPush = false; pushBuilt(); }
          return;
        }
        if(report.empty){ elBuildMsg.innerHTML = ''; return; }
        if(!report.ok){
          elBuildMsg.innerHTML = '<div class="tnote tnote--bad" style="margin-top:12px;">' +
            'Fix what is flagged below first. There is no point pushing electrons around a structure that could not exist.</div>';
          return;
        }
        elBuildMsg.innerHTML = '<div class="tnote tnote--good" style="margin-top:12px;">' +
          '<span class="tnote__k">Ready</span>Push electrons on it below. Nothing here is graded — but an arrow that could not have happened will still be told so.</div>';
        // The structure is legal, so it is worth somewhere else too.
        if(sendApi) sendApi.refresh();
        // A fresh copy each time, so editing the drawing does not reach into a
        // mechanism that is already part-way through.
        /* Hydrogens drawn as atoms, like the ready-made molecules, so a built
           molecule offers the same C–H bonds to push (audit 2026-10). */
        var B0 = window.OchemBuilder;
        begin(B0 && B0.withHydrogens ? B0.withHydrogens(st) : C.clone(st), st.name || report.formula);
        update();
      }
    });
    if(ls){
      // Its own Undo and Clear go to the stage's foot, with Undo / Reset like the other modes.
      var u = document.getElementById('mbUndo'), c = document.getElementById('mbClear');
      if(c) c.textContent = 'Reset';
      studio.add('foot', [u, c].filter(Boolean), { mode: 'build' });
    }
  }

  /* "Push electrons on this": the drawing, hydrogens drawn as atoms like the ready-made molecules (so it
     offers the same C–H bonds), becomes Explore's molecule. A fresh copy, so editing the drawing later does
     not reach into a mechanism part way through. */
  function pushBuilt(){
    if(!lastBuilt || !ls) return;
    ls.pushing = true;
    var b = document.getElementById('apSrc').querySelector('[data-src="lib"]');
    if(b) b.click();
  }
  function beginBuilt(){
    var B0 = window.OchemBuilder, st = lastBuilt, typed = document.getElementById('mbText');
    ls.built = true;
    ls.pickLib.set(libPicks('__built'));
    ls.hintsLib.reset();
    begin(B0 && B0.withHydrogens ? B0.withHydrogens(st) : C.clone(st), ls.builtName || 'Your molecule', typed && typed.value ? typed.value : null);
    update();
  }

  document.getElementById('apSrc').querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      var src = b.getAttribute('data-src');
      document.getElementById('apSrc').querySelectorAll('button').forEach(function(x){
        x.classList.toggle('on', x === b);
      });
      elBuilder.hidden = (src !== 'build');
      if(src === 'chal'){ if(!ls) elBuildMsg.innerHTML = ''; startChal(chal.def || CHALLENGES[0]); return; }
      chal.on = false;
      if(src === 'build'){ openBuilder(); if(ls) buildAfter(); }
      else if(ls && ls.pushing){ ls.pushing = false; beginBuilt(); }
      else if(ls && ls.built && lastBuilt){ beginBuilt(); }
      else { if(!ls) elBuildMsg.innerHTML = ''; select(current); }
    });
  });

  /* ---- The readout ------------------------------------------------------ */

  function update(){
    if(chal.on){ renderChal(); renderBooks(); return; }
    if(!lastArrows.length){
      elResult.innerHTML =
        '<div class="tempty">Draw an arrow and the product appears here.<br>' +
        'Click an electron source — a lone pair, or a bond — then click where those electrons go.</div>';
      renderBooks();
      studioAfter();
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

      /* The product exists as a structure and nowhere else — nobody could type
         it into the viewer, which is precisely why the handover has to carry
         the structure rather than a name. The biggest fragment goes, since
         that is the molecule anyone means by "the product". */
      var link = '';
      if(window.OchemBuilder){
        var biggest = frags.slice().sort(function(x, y){ return y.length - x.length; })[0];
        if(biggest && biggest.length > 1){
          var only = C.clone(after);
          Object.keys(only.atoms).forEach(function(k){
            if(biggest.indexOf(k) < 0) delete only.atoms[k];
          });
          only.bonds = only.bonds.filter(function(b){
            return only.atoms[b.a] && only.atoms[b.b] && b.order > 0;
          });
          link = '<a class="tchip tchip--ghost" href="viewer-3d.html?st=' +
                 encodeURIComponent(window.OchemBuilder.encode(only)) + '">See it in 3D &rarr;</a>';
        }
      }

      html += '<div class="trow" style="margin-top:14px;">' +
        '<button type="button" class="btn-press" id="apCommit">Use this as the next step &rarr;</button>' +
        link +
      '</div>' +
      '<p class="tmuted" style="margin:8px 0 0;font-size:12.5px;">Mechanisms are three and four steps long. Commit this one and keep going.</p>';
    }

    elResult.innerHTML = html;
    var commit = elResult.querySelector('#apCommit');
    if(commit) commit.addEventListener('click', commitStep);
    renderBooks();
    studioAfter();
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
          notes.push('That leaves a negative charge on a carbon with nothing next to it to share the load — no carbonyl, no pi system, no electronegative neighbor. Carbon is the worst of the common atoms at holding a negative charge, so this is a very basic, very reactive species.');
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
      elBooks.innerHTML = '';
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

  /* A tool that ends "and that is an E2" should be able to hand you straight
     to the place you draw one. The Reaction Predictor links here with the
     mechanism it just predicted, and this is the other end of that. */
  function fromUrl(){
    try{
      var want = new URLSearchParams(window.location.search).get('start');
      if(!want) return null;
      for(var i=0;i<ALL.length;i++) if(ALL[i].id === want) return ALL[i];
    }catch(e){}
    return null;
  }

  /* ---- Mechanism challenge ------------------------------------------------

     The start and the product are given; the arrows are not. Draw a step's
     arrows and check it: the step is right when the structure your arrows
     make is the structure the mechanism makes at that step (same bonds, same
     lone pairs, atom for atom), which accepts any arrow set with the same
     result. A wrong step says what your arrows did and names one move the
     step needs that you have not made, or one you made that it does not.
     The answer arrows below are the textbook ones and the product shown is
     computed by applying them with chem-core.js, so the target can never
     disagree with the arrows that make it. */
  /* hints: per step, the hint ladder's lines, from the idea down to the move (the answer itself, arrow by
     arrow, is Show one arrow). take: the finished card's takeaway. stepGoals: a two step challenge's task,
     step by step. topic: the lesson the finished card links. */
  var CHALLENGES = [
    { id:'sn2', label:'SN2', mol:'sn2-bromoethane', goal:'Make ethanol and bromide in one concerted step.', topic:'sn2',
      steps:[ [['nucO','c1'], ['bond:c1-br','br']] ],
      hints:[[ 'The nucleophile is the one with a negative charge and lone pairs to give.',
               'It attacks the carbon that holds bromine. In the same step the C–Br bond breaks onto bromine.' ]],
      take:[ 'SN2 happens in one step.', 'Hydroxide attacks the carbon from the back while bromide leaves. One arrow makes a bond, one breaks a bond.' ] },
    { id:'acid-base', label:'Acid–base', mol:'acetic-acid-hydroxide', goal:'Hydroxide takes the acid proton.',
      steps:[ [['nucO','h'], ['bond:o2-h','o2']] ],
      hints:[[ 'A base uses a lone pair to take a proton.',
               'As the new bond to the proton forms, the old O–H bond breaks and its electrons stay on the acid’s oxygen.' ]],
      take:[ 'The base takes the proton.', 'Hydroxide’s lone pair makes the new O–H bond, and the old O–H bond’s electrons stay on oxygen as acetate. Every proton transfer is these two arrows.' ] },
    { id:'sn1', label:'SN1 step 1', mol:'sn1-secondary', goal:'Ionize: make the carbocation and bromide.',
      steps:[ [['bond:c1-br','br']] ],
      hints:[[ 'Nothing attacks in this step.', 'One bond breaks, and both of its electrons leave with the more electronegative atom.' ]],
      take:[ 'Ionization comes first in SN1.', 'The C–Br bond breaks on its own and bromide leaves with both electrons. The carbocation meets its nucleophile in a separate step.' ] },
    { id:'protonate', label:'Protonate a C=O', mol:'fischer-protonation', goal:'Acid catalysis, step 1: put the proton on the carbonyl oxygen.',
      steps:[ [['o1','ha'], ['bond:ac-ha','ac']] ],
      hints:[[ 'The carbonyl oxygen has lone pairs to give.', 'One lone pair takes a proton from hydronium, and that O–H bond breaks onto its oxygen, which leaves as water.' ]],
      take:[ 'Acid makes the carbonyl a better electrophile.', 'A lone pair on oxygen takes the proton. The positive oxygen pulls electrons away from the carbonyl carbon, so even a weak nucleophile can attack it next.' ] },
    { id:'aldol', label:'Aldol addition', mol:'enolate-plus-acetone', goal:'The enolate carbon attacks the second carbonyl; give the alkoxide.',
      steps:[ [['ca','c2'], ['bond:c2-o2','o2']] ],
      hints:[[ 'The enolate’s carbon is the nucleophile.', 'It attacks the carbonyl carbon of the other molecule, and the C=O pi bond moves up onto oxygen.' ]],
      take:[ 'An enolate is a carbon nucleophile.', 'Its carbon makes a new C–C bond to the carbonyl carbon and the pi electrons move onto oxygen, which gives the alkoxide.' ] },
    { id:'acyl', label:'Acyl substitution', mol:'acetyl-chloride-nu', goal:'Two steps: add methoxide to make the tetrahedral intermediate, then collapse it and expel chloride.',
      stepGoals:[ 'Add methoxide to the carbonyl to make the tetrahedral intermediate.', 'Collapse the intermediate and expel chloride.' ],
      steps:[ [['nuO','c'], ['bond:c-o1','o1']], [['o1','bond:c-o1'], ['bond:c-cl','cl']] ],
      hints:[[ 'Methoxide is the nucleophile.', 'It adds to the carbonyl carbon, and the C=O pi bond moves onto oxygen.' ],
             [ 'The negative oxygen pushes a lone pair back down to remake C=O.', 'Carbon can keep only four bonds, so the C–Cl bond breaks and chloride leaves.' ]],
      take:[ 'Add, then eliminate.', 'The nucleophile adds to make a tetrahedral intermediate, then C=O forms again and pushes out chloride, the best leaving group on that carbon.' ] },
    { id:'claisen', label:'Claisen', mol:'enolate-plus-ester', goal:'Two steps: the enolate adds to the ester, then the intermediate collapses and expels ethoxide.',
      stepGoals:[ 'The enolate adds to the ester carbonyl.', 'Collapse the intermediate and expel ethoxide.' ],
      steps:[ [['ca','c2'], ['bond:c2-o2','o2']], [['o2','bond:c2-o2'], ['bond:c2-o3','o3']] ],
      hints:[[ 'The enolate’s carbon is the nucleophile.', 'It adds to the ester’s carbonyl carbon, and the C=O pi bond moves onto oxygen.' ],
             [ 'The negative oxygen pushes a lone pair back down to remake C=O.', 'The C–OEt bond on that same carbon breaks, and ethoxide leaves.' ]],
      take:[ 'Add, then eliminate, again.', 'The enolate adds to the ester carbonyl and the intermediate collapses to push out ethoxide: acyl substitution with a carbon nucleophile.' ] }
  ];
  var chal = { on:false, def:null, i:0, states:[], wrong:0, right:0, total:0, verdict:null, shown:0 };

  function arrowsOf(list){ return list.map(function(a){ return { from:a[0], to:a[1] }; }); }

  /* Same atoms, same bonds at the same orders, same lone pairs. */
  function sameStructure(a, b){
    var ka = Object.keys(a.atoms), kb = Object.keys(b.atoms);
    if(ka.length !== kb.length) return false;
    for(var i = 0; i < ka.length; i++){
      var x = a.atoms[ka[i]], y = b.atoms[ka[i]];
      if(!y || (x.lp || 0) !== (y.lp || 0)) return false;
    }
    function bonds(st){ var o = {}; st.bonds.forEach(function(bd){ if(bd.order > 0) o[[bd.a, bd.b].sort().join('|')] = bd.order; }); return o; }
    var A = bonds(a), Bd = bonds(b);
    var keys = Object.keys(A).concat(Object.keys(Bd));
    return keys.every(function(k){ return A[k] === Bd[k]; });
  }
  function normKey(k){ var m = /^bond:(.+?)-(.+)$/.exec(k); return m ? 'bond:' + [m[1], m[2]].sort().join('-') : k; }
  function sameArrow(a, b){ return normKey(a.from) === normKey(b.from) && normKey(a.to) === normKey(b.to); }

  function startChal(def){
    chal.on = true; chal.def = def; chal.i = 0; chal.wrong = 0; chal.verdict = null; chal.shown = 0;
    var st0 = C.fromMolecule(Mol.get(def.mol));
    chal.states = [st0];
    def.steps.forEach(function(arr, i){ chal.states.push(C.apply(chal.states[i], arrowsOf(arr)).structure); });
    history = [];
    if(ls){ ls.pickChal.value(def.id); ls.hintsChal.reset(); }
    startStep(C.clone(st0), Mol.get(def.mol).name);
    if(window.OchemToolState) window.OchemToolState.write({ chal: def.id });
    update();
  }

  function checkChal(){
    var want = chal.def.steps[chal.i];
    var res = C.apply(start, lastArrows);
    var errs = res.issues.filter(function(x){ return x.level === 'error'; });
    chal.total++;
    if(!errs.length && sameStructure(res.structure, chal.states[chal.i + 1])){
      chal.right++;
      chal.verdict = { ok:true, step: chal.i };
      history.push({ st: start, arrows: lastArrows.slice() });
      chal.i++; chal.shown = 0;
      if(ls) ls.hintsChal.reset();
      startStep(C.clone(chal.states[chal.i]));
      update();
      return;
    }
    chal.wrong++;
    var drawn = lastArrows, need = arrowsOf(want);
    var missing = need.filter(function(n){ return !drawn.some(function(d){ return sameArrow(d, n); }); });
    var extra = drawn.filter(function(d){ return !need.some(function(n){ return sameArrow(d, n); }); });
    var lines = [];
    if(errs.length) lines.push(errs[0].text.charAt(0).toUpperCase() + errs[0].text.slice(1) + (/[.!?]$/.test(errs[0].text) ? '' : '.'));
    else if(res.steps.length) lines.push('Your arrows: ' + res.steps.join('; ') + '.');
    if(extra.length) lines.push('Not part of this step: ' + C.deltaFor(start, extra[0]).text + '.');
    if(missing.length) lines.push(missing.length === need.length && !drawn.length ? 'Start with the electron source.'
      : 'Still needed: something to happen at ' + C.describeKey(start, missing[0].to) + '.');
    chal.verdict = { ok:false, text: lines.join(' '), arrows: JSON.stringify(lastArrows) };
    if(ls){
      // A real try: the full answer (Show one arrow) opens. The arrows the step does not want turn red.
      ls.hintsChal.attempt();
      var wrong = []; drawn.forEach(function(d, i){ if(!need.some(function(n){ return sameArrow(d, n); })) wrong.push(i); });
      ls.marks = { wrong: wrong }; baseRemount(); ls.marks = null;
    }
    update();
  }

  function renderChal(){
    var def = chal.def, done = chal.i >= def.steps.length;
    var target = chal.states[chal.states.length - 1];
    var html = '<div class="ap-chal">' +
      '<p class="ap-chal__goal"><b>' + esc(def.label) + '.</b> ' + esc(def.goal) + '</p>' +
      '<div class="ap-chal__k">Target</div>' +
      '<div class="tstage">' + Mol.svg(C.toMolecule(target), { caption:'', label:'Target: ' + C.fragments(target).map(function(f){ return C.formula(target, f); }).join(' + ') }) + '</div>' +
      '<div class="tfrags" style="margin:8px 0 12px;">' + C.fragments(target).map(function(f, i){
        var f0 = C.formula(target, f); return (i ? '<span class="tplus">+</span>' : '') + '<span class="tfrag' + (/[⁺⁻]/.test(f0) ? ' tfrag--charged' : '') + '">' + esc(f0) + '</span>';
      }).join('') + '</div>' +
      '<div class="ap-chal__steps">' + def.steps.map(function(_, i){
        return '<span class="ap-chal__dot' + (i < chal.i ? ' is-done' : (i === chal.i ? ' is-now' : '')) + '">' + (i < chal.i ? '✓' : i + 1) + '</span>';
      }).join('<span class="ap-chal__line"></span>') + '<span class="tmuted">' + (done ? 'done' : 'step ' + (chal.i + 1) + ' of ' + def.steps.length) + '</span></div>';
    // A wrong verdict describes the arrows it checked; once they change, it goes.
    if(chal.verdict && !chal.verdict.ok && chal.verdict.arrows !== JSON.stringify(lastArrows)) chal.verdict = null;
    if(chal.verdict){
      html += chal.verdict.ok
        ? '<div class="tnote tnote--good"><span class="tnote__k">Step ' + (chal.verdict.step + 1) + ' right</span>' +
            (done ? 'That is the whole mechanism' + (chal.wrong ? ', with ' + chal.wrong + ' wrong check' + (chal.wrong > 1 ? 's' : '') + ' on the way.' : ', first time.') : 'The structure on the left is now the intermediate. Draw the next step on it.') + '</div>'
        : '<div class="tnote tnote--bad" tabindex="-1" id="apChalSay"><span class="tnote__k">Not this step yet</span>' + esc(chal.verdict.text) + '</div>';
    }
    if(done){
      html += '<div class="trow"><button type="button" class="btn-press" id="apChalNext">Next challenge</button>' +
        '<button type="button" class="tchip" id="apChalAgain">Again</button></div>';
    } else {
      html += '<div class="trow">' +
        '<button type="button" class="btn-press" id="apChalCheck"' + (lastArrows.length ? '' : ' disabled') + '>Check step ' + (chal.i + 1) + '</button>' +
        '<button type="button" class="tchip tchip--ghost" id="apChalHint">Show one arrow</button></div>' +
        (chal.shown ? '<p class="tmuted" style="margin:8px 0 0;">Hint: ' + esc(C.deltaFor(start, arrowsOf(def.steps[chal.i])[Math.min(chal.shown, def.steps[chal.i].length) - 1]).text) + '.</p>' : '');
    }
    html += '</div>';
    elResult.innerHTML = html;
    var ck = elResult.querySelector('#apChalCheck');
    if(ck) ck.addEventListener('click', function(){ checkChal(); var say = elResult.querySelector('#apChalSay'); if(say) say.focus({ preventScroll:true }); });
    var hn = elResult.querySelector('#apChalHint');
    if(hn) hn.addEventListener('click', function(){ chal.shown = Math.min(chal.shown + 1, def.steps[chal.i].length); renderChal(); });
    var nx = elResult.querySelector('#apChalNext');
    if(nx) nx.addEventListener('click', function(){ var i = CHALLENGES.indexOf(def); startChal(CHALLENGES[(i + 1) % CHALLENGES.length]); });
    var ag = elResult.querySelector('#apChalAgain');
    if(ag) ag.addEventListener('click', function(){ startChal(def); });
    studioAfter();
  }

  /* A step's arrows changed: the old verdict no longer describes them. */
  var baseRemount = remount;
  remount = function(){
    baseRemount();
    if(chal.on) chal.verdict = chal.verdict && chal.verdict.ok ? chal.verdict : null;
  };

  window.OchemArrowChallenge = { CHALLENGES: CHALLENGES, sameStructure: sameStructure };

  /* The standard frame's arrangement (see the block comment at studioAfter). */
  function libPicks(value){
    var groups = GROUPS.map(function(g){ return { label: g.label, items: g.picks.map(function(p){ return { value: p.id, label: p.label }; }) }; });
    if(ls && ls.built && lastBuilt) groups.push({ label: 'Yours', items: [{ value: '__built', label: ls.builtName || 'Your molecule' }] });
    return { label: 'Molecule', groups: groups, value: value, onChange: function(v){
      if(v === '__built'){ beginBuilt(); return; }
      ALL.forEach(function(p){ if(p.id === v) select(p); });
    } };
  }
  function setupStudio(){
    var Kit = window.OchemStudioKit, I = window.LevlStudio.icon;
    var byId = function(id){ return document.getElementById(id); };
    function mk(tag, cls, html){ var e = document.createElement(tag); e.className = cls; if(html) e.innerHTML = html; return e; }
    studio.root.classList.add('ap-ls');
    ls = { mode: null, built: false };
    // Stage: your arrows | what they make (or the target), the mechanism strip above, the note under them.
    var pics = mk('div', 'ls-pics'), edBox = byId('apEditor');
    edBox.classList.add('ls-ed');
    ls.to = mk('span', 'ap-to', I('chev')); ls.to.setAttribute('aria-hidden', 'true'); ls.to.hidden = true;
    ls.out = mk('div', 'ls-pane'); ls.out.hidden = true;
    pics.appendChild(edBox); pics.appendChild(ls.to); pics.appendChild(ls.out);
    ls.note = mk('p', 'ap-note'); ls.note.setAttribute('role', 'status'); ls.note.hidden = true;
    studio.add('stage', [byId('apSteps'), pics, ls.note], { mode: 'lib chal' });
    studio.add('stage', elBuilder, { mode: 'build' });
    // The modes, short so the three fit one switch on a phone.
    [['lib', 'Explore'], ['build', 'Build'], ['chal', 'Challenge']].forEach(function(x){ var b = byId('apSrc').querySelector('[data-src="' + x[0] + '"]'); if(b) b.textContent = x[1]; });
    ls.mode = Kit.seg(byId('apSrc'), 'data-src');
    // The dropdowns: 21 molecules in their four groups, 7 challenges, and where a drawing starts.
    ls.pickLib = studio.picker(libPicks(current.id), 'lib');
    ls.pickChal = studio.picker({ label: 'Challenge', count: true, items: CHALLENGES.map(function(c){ return { value: c.id, label: c.label }; }),
      onChange: function(v){ CHALLENGES.forEach(function(c){ if(c.id === v) startChal(c); }); } }, 'chal');
    studio.picker({ label: 'Start from', value: '', items: [{ value: '', label: 'Start from', sub: 'Blank' }].concat(
      ['CH3CH2OH', '(CH3)3CBr', 'CH3COCH3', 'CH3COOH', 'benzene', 'cyclohexane'].map(function(q){ return { value: q, label: 'Start from', sub: q }; })),
      onChange: function(v){
        if(!builderApi) return;
        var t = byId('mbText');
        if(!v){ if(t) t.value = ''; builderApi.clear(); return; }
        if(t) t.value = v;
        builderApi.build(v);
      } }, 'build');
    // Undo and Reset at the stage's foot drive the editor's own buttons; the target's structure is one tap.
    function edAct(a){ return function(){ var b = edBox.querySelector('.med-btn[data-act="' + a + '"]'); if(b && !b.disabled) b.click(); }; }
    var undo = mk('button', 'ls-btn ap-undo', I('undo') + '<span>Undo</span>'); undo.type = 'button'; undo.addEventListener('click', edAct('undo'));
    var reset = mk('button', 'ls-btn', 'Reset'); reset.type = 'button'; undo.disabled = reset.disabled = true; reset.addEventListener('click', edAct('clear'));
    var tgt = mk('button', 'ls-btn ap-tgt', 'Show target structure'); tgt.type = 'button';
    tgt.setAttribute('aria-pressed', 'false');
    tgt.addEventListener('click', function(){ ls.showTarget = !ls.showTarget; tgt.setAttribute('aria-pressed', String(ls.showTarget)); tgt.textContent = ls.showTarget ? 'Hide target structure' : 'Show target structure'; update(); });
    studio.add('foot', [undo, reset], { mode: 'lib chal' });
    studio.add('foot', tgt, { mode: 'chal' });
    // Undo and Reset follow the editor's own (off with no arrows to take back).
    if(window.MutationObserver) new MutationObserver(function(){
      var u = edBox.querySelector('.med-btn[data-act="undo"]');
      undo.disabled = reset.disabled = !u || u.disabled;
    }).observe(edBox, { childList: true });
    // Side panel: the step marker, What happened and its notes, the hint ladders, the action.
    ls.stepMark = mk('div', 'ap-stepmark'); ls.stepMark.hidden = true;
    ls.notes = mk('div', 'ap-ls-notes');
    ls.act = mk('div', 'ap-ls-act ls-push');
    ls.hintsLib = studio.hints({ label: 'Nudge for this molecule', hints: function(){ return !ls.built && current && current.hint ? [esc(current.hint)] : []; } });
    ls.hintsChal = studio.hints({
      hints: function(){ var h = chal.def && chal.def.hints && chal.def.hints[chal.i]; return (h || []).map(esc); },
      answer: { label: 'Show one arrow', onShow: function(){
        var want = arrowsOf(chal.def.steps[chal.i]);
        chal.shown = Math.min(chal.shown + 1, want.length);
        return want.slice(0, chal.shown).map(function(a, i){ return '<p>' + (want.length > 1 ? 'Arrow ' + (i + 1) + ': ' : '') + esc(upper1(C.deltaFor(start, a).text)) + '.</p>'; }).join('');
      } }
    });
    var pushRow = mk('div', 'ls-push ap-ls-pushrow');
    ls.push = mk('button', 'ls-btn ls-pri', 'Push electrons on this'); ls.push.type = 'button'; ls.push.disabled = true;
    ls.push.addEventListener('click', pushBuilt);
    pushRow.appendChild(ls.push);
    pushRow.appendChild(mk('p', 'ls-sub ap-ls-sendnote', 'Open it in another tool from the … menu.'));
    studio.add('dock', ls.stepMark, { mode: 'chal' });
    // The step marker heads the panel, above the task.
    studio.dockEl.insertBefore(ls.stepMark, studio.dockEl.querySelector('.ls-task'));
    studio.add('dock', [ls.notes, ls.hintsLib.card], { mode: 'lib' });
    studio.add('dock', ls.hintsChal.card, { mode: 'chal' });
    studio.add('dock', ls.act, { mode: 'lib chal' });
    studio.add('dock', ls.hintsLib.row, { mode: 'lib' });
    studio.add('dock', ls.hintsChal.row, { mode: 'chal' });
    studio.add('dock', [elBuildMsg, pushRow], { mode: 'build' });
    // Why: the finished challenge, arrow by arrow (Full explanation on the finished card).
    ls.why = mk('div', 'ls-sec ap-ls-why');
    studio.add('why', ls.why, { mode: 'chal' });
    // "?": formal charges, how an arrow works, the keys; sending a drawing on (Build) is there and in the menu.
    var how = mk('div', 'ls-sec', '<h3 class="ls-h">How an arrow works</h3>' +
      '<p>Each curved arrow moves two electrons. It starts where they are now, a lone pair or a bond, and ends where they go: an atom, or the space between two atoms to make a new bond.</p>' +
      '<p>In Explore, what your arrows make appears beside your drawing with formal charges worked out again. Nothing there is graded, but an arrow that could not have happened is told so, and a legal one that rarely happens gets a second look.</p>' +
      '<p>A mechanism is several steps: Use this as the next step carries the product on, and the strip above the drawing takes you back to any step.</p>');
    var kbd = mk('div', 'ls-sec', '<h3 class="ls-h">Using the keyboard</h3><p class="ls-sub">Tab moves between atoms and bonds, Enter picks one. An arrow is two picks: where the electrons start, then where they go. Pick a drawn arrow to remove it.</p>');
    var books = byId('apBooksBox'), send = byId('apSend');
    books.querySelector('summary').textContent = 'Formal charges';
    var first = studio.details.firstChild;
    [books, how, kbd, send].forEach(function(el){ studio.details.insertBefore(el, first); });
    studio.add('details', send, { mode: 'build' });
    studio.details.insertBefore(send, first);
    books.open = true; showBooks = true;
    var KitItems = (Kit && Kit.menuItems) || [];
    studio.menu({ items: KitItems.concat([{ label: 'Open in another tool', icon: 'grid', onClick: function(){
      if(ls.mode() !== 'build'){ var b = byId('apSrc').querySelector('[data-src="build"]'); if(b) b.click(); }
      studio.open('details', null);
      setTimeout(function(){ send.scrollIntoView({ block: 'start' }); var a = send.querySelector('a'); if(a) a.focus({ preventScroll: true }); else studio.say('Build a molecule first, then send it on.'); }, 80);
    } }]) });
    root.hidden = true;
  }
  if(studio && studio.task) setupStudio();

  var fromLink = fromUrl();
  // Read before select(), which rewrites the address bar.
  var chalWanted = window.OchemToolState && window.OchemToolState.read().chal;
  var builtWanted = window.OchemToolState && window.OchemToolState.read().build;
  select(fromLink || ALL[0]);
  (function(){
    var want = chalWanted;
    if(!want) return;
    CHALLENGES.forEach(function(c){ if(c.id === want) chal.def = c; });
    if(chal.def){ var b = document.getElementById('apSrc').querySelector('[data-src="chal"]'); if(b) b.click(); }
  })();

  // A link can also carry a molecule somebody typed rather than one on the list.
  if(window.OchemToolState){
    // Read before select() too, which rewrites the address bar.
    var built = builtWanted;
    if(built){
      var srcBtn = document.getElementById('apSrc').querySelector('[data-src="build"]');
      if(srcBtn){
        srcBtn.click();
        // In the type box too, so the address (and Copy link) keeps it.
        var typedIn = document.getElementById('mbText'); if(typedIn) typedIn.value = built;
        // A shared link with a drawing opens on pushing electrons on it.
        if(ls) ls.autoPush = true;
        if(builderApi) builderApi.build(built);
      }
    }
  }
  if(ls && ls.mode() === 'lib'){
    var ed = document.getElementById('apEditor');
    studio.hint({ target: ed.querySelector('.atom[data-key="nucO"]') || ed.querySelector('.atom'), text: 'Tap this lone pair, then where it goes' });
  }

  /* ---- Check yourself ---------------------------------------------------
     The sandbox tells you when an arrow could not have happened. What it
     cannot tell you is whether you could have SEEN that before drawing it,
     which is the skill being built — so the quiz asks about electron
     bookkeeping on a structure, before any arrow is drawn.

     Formal charge and electron count both come from chem-core, the same two
     functions the sandbox uses to decide that an arrow blew an octet. So the
     quiz is not a parallel set of facts: it is the checker, asked in
     advance. */
  if(window.OchemToolQuiz){
    /* Only atoms worth asking about: a hydrogen has one bond and no story,
       and a carbon in the middle of a chain has the same answer every time. */
    function interesting(st){
      return Object.keys(st.atoms).filter(function(k){
        var a = st.atoms[k];
        if(!a.el || a.el === 'H' || a.group) return false;
        return a.lp > 0 || C.formalCharge(st, k) !== 0 || a.el !== 'C';
      });
    }

    var QUIZ_MOLS = [];
    ['water','ammonia','acetate-ion','acetic-acid','acetone','formaldehyde','acetaldehyde',
     'acetamide','methyl-acetate','acetyl-chloride','ethylamine','sn2-bromoethane',
     'sn1-secondary','propylene-oxide','benzene','ammonium'].forEach(function(id){
      var m = Mol.get(id);
      if(!m) return;
      var st = C.fromMolecule(m);
      var keys = interesting(st);
      if(keys.length) QUIZ_MOLS.push({ id:id, name:m.name, formula:m.formula, st:st, keys:keys });
    });

    if(QUIZ_MOLS.length){
      window.OchemToolQuiz.mount(document.getElementById('tool-quiz'), {
        slug: 'arrow-pusher',
        rounds: 6,
        intro: 'Formal charge and octets — the bookkeeping that decides whether an arrow is legal.',
        make: function(recent){
          /* `recent` holds full question ids ("acetone:fc:o"), so testing a
             bare molecule id against it never matched and the filter did
             nothing. Compare against the prefix instead. */
          var pool = QUIZ_MOLS.filter(function(m){
            return !recent.some(function(r){ return r.indexOf(m.id + ':') === 0; });
          });
          if(!pool.length) pool = QUIZ_MOLS;
          var m = pool[Math.floor(Math.random() * pool.length)];
          var key = m.keys[Math.floor(Math.random() * m.keys.length)];
          var atom = m.st.atoms[key];
          var el = atom.el;

          if(Math.random() < 0.5){
            var fc = C.formalCharge(m.st, key);
            var fcOpts = [fc];
            [fc + 1, fc - 1, fc + 2].forEach(function(v){
              if(fcOpts.indexOf(v) < 0 && fcOpts.length < 4) fcOpts.push(v);
            });
            return {
              id: m.id + ':fc:' + key,
              term: 'formal-charge', topic: 'formal-charge',
              prompt: 'In <b>' + esc(m.name) + '</b>' +
                      (m.formula ? ' (<span class="tformula">' + esc(m.formula) + '</span>)' : '') +
                      ', the ' + esc(el) + ' has ' + C.totalBonds(m.st, key) + ' bond' +
                      (C.totalBonds(m.st, key) === 1 ? '' : 's') + ' and ' + atom.lp +
                      ' lone pair' + (atom.lp === 1 ? '' : 's') + '. What is its <b>formal charge</b>?',
              options: fcOpts.map(function(v){
                return { id:String(v), label: v > 0 ? '+' + v : String(v), correct: v === fc };
              }),
              explain: '<b>' + (fc > 0 ? '+' + fc : fc) + '</b>. Formal charge is the group number minus ' +
                       'what the atom is holding: ' + C.info(el).valence + ' valence electrons for ' + el +
                       ', minus ' + (atom.lp * 2) + ' in lone pairs, minus ' + C.totalBonds(m.st, key) +
                       ' for its share of the bonds. Every arrow you draw changes one of those two ' +
                       'numbers, which is why the charges move when the arrows do.'
            };
          }

          var ec = C.electronCount(m.st, key);
          var ecOpts = [ec];
          [ec + 2, ec - 2, ec + 4].forEach(function(v){
            if(v >= 0 && ecOpts.indexOf(v) < 0 && ecOpts.length < 4) ecOpts.push(v);
          });
          return {
            id: m.id + ':ec:' + key,
            term: 'octet-rule', topic: 'lewis-structures',
            prompt: 'How many electrons surround the <b>' + esc(el) + '</b> in <b>' + esc(m.name) +
                    '</b>, counting both electrons of every bond it makes?',
            options: ecOpts.map(function(v){
              return { id:String(v), label:String(v), correct: v === ec };
            }),
            explain: '<b>' + ec + '</b> — ' + (atom.lp * 2) + ' from ' + atom.lp + ' lone pair' +
                     (atom.lp === 1 ? '' : 's') + ' and ' + (C.totalBonds(m.st, key) * 2) +
                     ' from ' + C.totalBonds(m.st, key) + ' bond' + (C.totalBonds(m.st, key) === 1 ? '' : 's') +
                     '. ' + (ec > C.octetOf(m.st, key)
                       ? 'That is past what this atom can hold, which is exactly the state an illegal arrow leaves behind.'
                       : ec === 8
                         ? 'A full octet. An arrow pointing another pair at this atom has nowhere to put it — that is the error the sandbox catches.'
                         : 'Short of an octet, so this atom can still accept a pair. That is what makes it an electrophile.')
          };
        }
      });
    }
  }

})();
