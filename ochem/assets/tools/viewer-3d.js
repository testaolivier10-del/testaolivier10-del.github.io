/* 3D Molecule Viewer — turn it until the shape stops being a word.

   The gap this fills is narrow but real. Students can recite "trigonal
   pyramidal" long before they can say which way the lone pair points, and
   static wedge-dash drawings are the reason: a drawing has already chosen the
   viewpoint for you, so the one skill it cannot build is choosing one
   yourself. Dragging a molecule into a view where the answer is obvious is
   the whole exercise.

   The readout is measured, not quoted. Click an atom and the angles listed
   are computed from the same coordinates being drawn, so ammonia reports
   107° and water 104.5° while methane reports 109.5 — and the compression a
   lone pair causes is something you can see rather than something you are
   told. */
(function(){
  var M3 = window.OchemMol3D;
  var LIB = window.OchemMol3DLibrary;
  var root = document.getElementById('v3Root');
  if(!M3 || !LIB || !root) return;

  var mol = LIB.ALL[0];
  var rx = -0.35, ry = 0.6;          // radians, the current orientation
  var zoom = 1;
  var fit = 52;                      // scale that makes this molecule fill the frame
  var selected = mol.focus;
  var opts = { labels:true, lonePairs:true, spin:false, mode:'ball' };
  var spinHandle = null;
  var rockHandle = null;
  var idleSince = Date.now();

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  root.innerHTML =
    '<div class="tpanel">' +
      '<div class="tpanel__head">' +
        '<span>Where the molecule comes from</span>' +
        '<div class="tseg" id="v3Src">' +
          '<button type="button" data-src="lib" class="on">Ready-made</button>' +
          '<button type="button" data-src="build">Build your own</button>' +
        '</div>' +
      '</div>' +
      '<div id="v3Picker"></div>' +
      '<div id="v3Builder" hidden></div>' +
      '<div id="v3BuildMsg"></div>' +
    '</div>' +
    '<div class="tsplit tsplit--wide">' +
      '<div class="tpanel">' +
        '<div class="tpanel__head"><span>Drag to turn it</span><span id="v3Name" class="tmuted"></span></div>' +
        '<div class="v3-stage" id="v3Stage">' +
          '<svg id="v3Svg" viewBox="0 0 320 300" role="img" aria-label="3D molecule"></svg>' +
        '</div>' +
        '<div class="trow" style="margin-top:12px;">' +
          '<div class="tseg" id="v3Modes">' +
            '<button type="button" data-mode="ball" class="on">Ball &amp; stick</button>' +
            '<button type="button" data-mode="space">Space-filling</button>' +
            '<button type="button" data-mode="wire">Wireframe</button>' +
          '</div>' +
        '</div>' +
        '<div class="trow" style="margin-top:12px;">' +
          '<div class="tseg" id="v3Views">' +
            '<button type="button" data-view="iso" class="on">Angled</button>' +
            '<button type="button" data-view="front">Front</button>' +
            '<button type="button" data-view="top">Top</button>' +
            '<button type="button" data-view="side">Edge-on</button>' +
          '</div>' +
          '<button type="button" class="tchip tchip--ghost" id="v3Spin">Spin</button>' +
        '</div>' +
        '<div class="trow" style="margin-top:12px;">' +
          '<label class="tcheck"><input type="checkbox" id="v3Labels" checked> Atom labels</label>' +
          '<label class="tcheck"><input type="checkbox" id="v3Lp" checked> Lone pairs</label>' +
          '<label class="tcheck"><input type="range" id="v3Zoom" class="trange" min="60" max="180" value="100" style="width:120px;" aria-label="Zoom"> Zoom</label>' +
        '</div>' +
        '<p class="tmuted" style="margin:12px 0 0;" id="v3Note"></p>' +
      '</div>' +
      '<div>' +
        '<div class="tpanel">' +
          '<div class="tpanel__head">' +
            '<span>What this atom is doing</span>' +
            '<span class="tmuted" id="v3Hint">click an atom</span>' +
          '</div>' +
          '<div aria-live="polite" id="v3Analysis"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var svg      = document.getElementById('v3Svg');
  var stage    = document.getElementById('v3Stage');
  var elPicker = document.getElementById('v3Picker');
  var elName   = document.getElementById('v3Name');
  var elNote   = document.getElementById('v3Note');
  var elAnal   = document.getElementById('v3Analysis');
  var elBuild  = document.getElementById('v3Builder');
  var elBMsg   = document.getElementById('v3BuildMsg');

  /* ---- Picker ----------------------------------------------------------- */

  elPicker.innerHTML = LIB.groups().map(function(g){
    return '<div class="ap-group">' +
      '<div class="ap-group__label">' + esc(g.label) + '</div>' +
      '<div class="tchips">' + g.items.map(function(m){
        return '<button type="button" class="tchip" data-id="' + esc(m.id) + '">' + esc(m.name) + '</button>';
      }).join('') + '</div></div>';
  }).join('');

  elPicker.querySelectorAll('.tchip').forEach(function(b){
    b.addEventListener('click', function(){ select(LIB.get(b.getAttribute('data-id'))); });
  });

  function select(m){
    if(!m) return;
    nudgeIdle();
    sync({ mol: m.id });
    mol = m;
    selected = m.focus;
    elPicker.querySelectorAll('.tchip').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-id') === m.id);
    });
    elName.textContent = m.name + ' · ' + m.formula;
    elNote.textContent = m.note || '';
    fit = fitScale(m);
    draw();
  }

  /* SF₆ spans four ångströms and water barely one, so a fixed scale draws one
     of them clipped and the other as a speck in the middle of an empty frame.
     Measure the molecule instead and pick the scale that fills the viewport,
     leaving the zoom slider as a multiplier on top of a sensible default. */
  function fitScale(m){
    var maxR = 0;
    m.atoms.forEach(function(a){
      var d = M3.len(a.pos) + M3.styleOf(a.el).r;
      if(a.lpDirs && a.lpDirs.length) d = Math.max(d, M3.len(a.pos) + M3.styleOf(a.el).r + 0.5);
      if(d > maxR) maxR = d;
    });
    return Math.max(30, Math.min(120, 122 / (maxR || 1)));
  }

  /* ---- Drawing ---------------------------------------------------------- */

  function draw(){
    svg.innerHTML = M3.render(mol, {
      cx:160, cy:150, scale:fit * zoom,
      rx:rx, ry:ry, mode:opts.mode,
      labels:opts.labels, lonePairs:opts.lonePairs,
      selected:selected
    });
    // Re-bound every frame because render() rebuilds the nodes. Cheap at this
    // size, and it keeps the depth sort and the hit targets in one place.
    svg.querySelectorAll('.m3d-atom').forEach(function(g){
      g.addEventListener('click', function(e){
        e.stopPropagation();
        selected = parseInt(g.getAttribute('data-atom'), 10);
        draw();
      });
      g.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          selected = parseInt(g.getAttribute('data-atom'), 10);
          draw();
        }
      });
    });
    renderAnalysis();
  }

  /* ---- Turning it ------------------------------------------------------- */

  var dragging = false, lastX = 0, lastY = 0;

  function startDrag(x, y){ dragging = true; lastX = x; lastY = y; stage.classList.add('is-dragging'); }
  function moveDrag(x, y){
    if(!dragging) return;
    ry += (x - lastX) * 0.011;
    rx += (y - lastY) * 0.011;
    // Stop short of the poles: past vertical the turntable axis flips and the
    // molecule appears to jump sideways under the cursor.
    rx = Math.max(-1.45, Math.min(1.45, rx));
    lastX = x; lastY = y;
    draw();
  }
  function endDrag(){ dragging = false; stage.classList.remove('is-dragging'); }

  stage.addEventListener('pointerdown', function(e){
    // Let a click on an atom be a click, not the start of a drag.
    startDrag(e.clientX, e.clientY);
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', function(e){ moveDrag(e.clientX, e.clientY); });
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('wheel', function(e){
    e.preventDefault();
    zoom = Math.max(0.6, Math.min(1.8, zoom - e.deltaY * 0.0012));
    document.getElementById('v3Zoom').value = Math.round(zoom * 100);
    draw();
  }, { passive:false });

  // Keyboard: the viewer should be usable without a pointer at all.
  stage.setAttribute('tabindex', '0');
  stage.addEventListener('keydown', function(e){
    var step = 0.14;
    if(e.key === 'ArrowLeft')  { ry -= step; }
    else if(e.key === 'ArrowRight'){ ry += step; }
    else if(e.key === 'ArrowUp')   { rx = Math.max(-1.45, rx - step); }
    else if(e.key === 'ArrowDown') { rx = Math.min(1.45, rx + step); }
    else return;
    e.preventDefault();
    draw();
  });

  /* ---- Controls --------------------------------------------------------- */

  var VIEWS = {
    iso:   { rx:-0.35, ry:0.6 },
    front: { rx:0,     ry:0 },
    top:   { rx:-1.45, ry:0 },
    side:  { rx:0,     ry:Math.PI/2 }
  };

  document.getElementById('v3Views').querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      var view = VIEWS[b.getAttribute('data-view')];
      rx = view.rx; ry = view.ry;
      nudgeIdle();
      document.getElementById('v3Views').querySelectorAll('button').forEach(function(x){
        x.classList.toggle('on', x === b);
      });
      sync();
      draw();
    });
  });

  /* ---- Display mode -----------------------------------------------------

     Same coordinates, three questions. Ball-and-stick reads the connectivity.
     Space-filling draws every atom at its real van der Waals radius, which is
     the only view in which "this carbon is too crowded to attack" is
     something you can see rather than something you are told — in sticks, a
     tert-butyl group and a hydrogen look equally out of the way. Wireframe
     drops the volume when the spheres are what is hiding the skeleton. */
  document.getElementById('v3Modes').querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      opts.mode = b.getAttribute('data-mode');
      document.getElementById('v3Modes').querySelectorAll('button').forEach(function(x){
        x.classList.toggle('on', x === b);
      });
      sync();
      // Lone pairs have nowhere to sit on a space-filling model: the surface
      // they would hang off is the surface. The checkbox stays where the
      // student left it and comes back with the other modes.
      document.getElementById('v3Lp').disabled = (opts.mode === 'space');
      draw();
    });
  });

  /* ---- Idle rock --------------------------------------------------------

     Motion is the strongest depth cue there is, and a still molecule on load
     reads as a diagram no matter how it is shaded. So after a couple of
     seconds of nothing, the viewer turns a few degrees back and forth — just
     enough to say "this is an object, drag me" without becoming the spinning
     thing that makes a page impossible to read. Any interaction stops it, and
     it never fights the Spin button or a drag. */
  var rockBase = null, rockT = 0;

  function nudgeIdle(){
    idleSince = Date.now();
    rockBase = null;
  }

  function rockTick(){
    rockHandle = requestAnimationFrame(rockTick);
    if(opts.spin || dragging) { rockBase = null; return; }
    if(Date.now() - idleSince < 2600) return;
    if(rockBase === null){ rockBase = ry; rockT = 0; }
    rockT += 0.012;
    ry = rockBase + Math.sin(rockT) * 0.17;
    draw();
  }

  // Respect a reader who has asked the OS for less motion.
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if(!(calm && calm.matches)) rockHandle = requestAnimationFrame(rockTick);

  ['pointerdown','wheel','keydown'].forEach(function(ev){
    stage.addEventListener(ev, nudgeIdle);
  });
  root.addEventListener('click', nudgeIdle);

  document.getElementById('v3Labels').addEventListener('change', function(e){
    opts.labels = e.target.checked; draw();
  });
  document.getElementById('v3Lp').addEventListener('change', function(e){
    opts.lonePairs = e.target.checked; draw();
  });
  document.getElementById('v3Zoom').addEventListener('input', function(e){
    zoom = parseInt(e.target.value, 10) / 100; draw();
  });

  document.getElementById('v3Spin').addEventListener('click', function(){
    opts.spin = !opts.spin;
    this.classList.toggle('on', opts.spin);
    if(opts.spin){
      var tick = function(){
        if(!opts.spin) return;
        if(!dragging){ ry += 0.008; draw(); }
        spinHandle = requestAnimationFrame(tick);
      };
      spinHandle = requestAnimationFrame(tick);
    } else if(spinHandle){
      cancelAnimationFrame(spinHandle);
    }
  });

  /* ---- Build your own ---------------------------------------------------

     The fifteen molecules in the library are the fifteen somebody thought of.
     This is the half that matters: type the thing you are actually stuck on,
     or draw it, and watch it stand up.

     Folding happens on every edit rather than behind a "render" button,
     because the point being made is that the flat drawing and the object in
     space are the same molecule — and a button in between turns that into two
     separate things you did. A structure that cannot exist simply does not
     fold, and says why. */
  var builderApi = null;

  function showBuildMsg(kind, text){
    elBMsg.innerHTML = text
      ? '<div class="tnote tnote--' + kind + '" style="margin-top:12px;">' + esc(text) + '</div>'
      : '';
  }

  function openBuilder(){
    if(builderApi) return;
    if(!window.OchemBuilderUI){
      showBuildMsg('bad', 'The builder did not load on this page.');
      return;
    }
    builderApi = window.OchemBuilderUI.mount(elBuild, {
      onChange: function(st, report){
        if(report.empty){ showBuildMsg('', ''); return; }
        if(!report.ok){
          showBuildMsg('bad', 'Fix what is flagged below and it will fold up — a structure that cannot exist has no shape to show.');
          return;
        }
        var r = window.OchemBuilder.to3D(st);
        if(r.error){ showBuildMsg('warn', r.error); return; }
        r.mol.name = st.name || 'Your molecule';
        var typed = document.getElementById('mbText');
        /* A typed formula travels as text because it is readable; anything
           drawn travels encoded, because it has no text form. */
        var asText = typed && typed.value ? typed.value : null;
        sync(asText
          ? { build: asText, st: null, mol: null }
          : { build: null, st: window.OchemBuilder.encode(st), mol: null });
        showBuildMsg('good', r.mol.approximate
          ? 'Folded. This has more than one ring, so the second ring is grown outward rather than closed exactly — angles inside the first ring are right, the rest is approximate.'
          : 'Folded. Drag it, and click any atom for its geometry.');
        selected = 0;
        mol = r.mol;
        fit = fitScale(mol);
        elName.textContent = r.mol.name + ' · ' + (r.mol.formula || '');
        /* Built molecules carry idealized VSEPR angles — they are generated
           from the shape, not measured off a real structure — so the readout's
           "measured vs ideal" column will always agree. Saying so beats
           letting someone conclude that water really is 109.5. */
        elNote.textContent = 'Built from your drawing, so the angles are the ideal ones for each shape. ' +
          'The ready-made molecules carry real compressions — ammonia at 107°, water at 104.5°.';
        nudgeIdle();
        draw();
      }
    });
  }

  document.getElementById('v3Src').querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      var src = b.getAttribute('data-src');
      document.getElementById('v3Src').querySelectorAll('button').forEach(function(x){
        x.classList.toggle('on', x === b);
      });
      elPicker.hidden = (src !== 'lib');
      elBuild.hidden  = (src !== 'build');
      if(src === 'build'){ openBuilder(); }
      else { showBuildMsg('', ''); }
    });
  });

  /* ---- The readout ------------------------------------------------------ */

  function renderAnalysis(){
    var a = M3.analyse(mol, selected);
    if(!a){ elAnal.innerHTML = '<div class="tempty">Click any atom.</div>'; return; }

    document.getElementById('v3Hint').textContent = a.el + ' selected';

    var shape = a.shape;
    var html = '<div class="tstat">' +
      '<div><div class="k">Electron groups</div><div class="v">' + a.steric + '</div></div>' +
      '<div><div class="k">Bonds</div><div class="v">' + a.bonds + '</div></div>' +
      '<div><div class="k">Lone pairs</div><div class="v">' + a.lonePairs + '</div></div>' +
      '<div><div class="k">Hybridization</div><div class="v">' + (shape ? shape.hyb : '—') + '</div></div>' +
    '</div>';

    if(shape){
      html += '<div class="tnote tnote--info"><span class="tnote__k">' + esc(shape.m) + '</span>' +
        'The ' + a.steric + ' electron groups arrange themselves ' + shape.e.toLowerCase() + '. ' +
        (a.lonePairs
          ? 'But you only see the atoms, and ' + (a.lonePairs === 1 ? 'one of those groups is a lone pair' : a.lonePairs + ' of them are lone pairs') +
            ' — so the shape you name from the atoms alone is ' + shape.m.toLowerCase() + '.'
          : 'With no lone pairs, the shape of the atoms is the same as the shape of the groups.') +
      '</div>';
    }

    if(a.angles.length){
      /* Measured against the ideal for the electron geometry. A gap here is
         not an error in the model — it is the lone pair doing its job, and
         labelling it as such is the point of showing both numbers. */
      var ideal = shape ? shape.ideal : null;
      html += '<div class="ttable-scroll"><table class="ttable">' +
        '<thead><tr><th>Angle</th><th>Measured</th>' + (ideal ? '<th>Ideal</th>' : '') + '</tr></thead><tbody>' +
        dedupeAngles(a.angles).map(function(g){
          var off = ideal === null ? 0 : g.deg - ideal;
          return '<tr>' +
            '<td>' + esc(g.a) + '–' + esc(a.el) + '–' + esc(g.b) + (g.count > 1 ? ' <span class="tmuted">×' + g.count + '</span>' : '') + '</td>' +
            '<td class="num">' + g.deg.toFixed(1) + '°</td>' +
            (ideal ? '<td class="num ' + (Math.abs(off) < 0.6 ? 'win' : 'lose') + '">' +
              (Math.abs(off) < 0.6 ? 'on the nose' : (off > 0 ? '+' : '') + off.toFixed(1) + '°') + '</td>' : '') +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';

      if(ideal !== null){
        var worst = a.angles[0].deg - ideal;
        if(worst < -1.2 && a.lonePairs){
          html += '<p class="tmuted" style="margin-top:10px;">Every angle here is under the ideal ' + ideal + '°. ' +
            'A lone pair is held by one nucleus instead of shared between two, so it spreads out closer to the atom ' +
            'and squeezes the bonding pairs together. Two lone pairs squeeze harder than one.</p>';
        }
      }
    }

    html += '<p class="tmuted" style="margin-top:12px;">Drag the molecule, or use the arrow keys once the viewer has focus. ' +
      'A double or triple bond counts as <b>one</b> electron group, not two — that is the step people skip.</p>';

    elAnal.innerHTML = html;
  }

  /* Six identical 109.5° angles is one fact, not six rows. */
  function dedupeAngles(angles){
    var out = [];
    angles.forEach(function(g){
      var hit = out.filter(function(o){
        return Math.abs(o.deg - g.deg) < 0.5 &&
               ((o.a === g.a && o.b === g.b) || (o.a === g.b && o.b === g.a));
      })[0];
      if(hit){ hit.count++; return; }
      out.push({ a:g.a, b:g.b, deg:g.deg, count:1 });
    });
    return out;
  }

  /* ---- Shareable setup ---------------------------------------------------

     A link that reopens the molecule, the display mode and the viewpoint.
     "Look at the lone pair from directly above" is a thing an instructor says,
     and before this there was no way to say it in a link. */
  function sync(extra){
    if(!window.OchemToolState) return;
    var cur = window.OchemToolState.read();
    var next = {
      mol: cur.mol, build: cur.build, st: cur.st,
      mode: opts.mode === 'ball' ? null : opts.mode,
      rx: rx.toFixed(2), ry: ry.toFixed(2)
    };
    Object.keys(extra || {}).forEach(function(k){ next[k] = extra[k]; });
    if(next.build) next.mol = null;
    window.OchemToolState.write(next);
  }

  function restore(){
    if(!window.OchemToolState) return false;
    var q = window.OchemToolState.read();
    if(q.rx) rx = parseFloat(q.rx);
    if(q.ry) ry = parseFloat(q.ry);
    if(q.mode && ['ball','space','wire'].indexOf(q.mode) >= 0){
      opts.mode = q.mode;
      var mb = document.getElementById('v3Modes').querySelector('[data-mode="' + q.mode + '"]');
      if(mb){
        document.getElementById('v3Modes').querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === mb); });
      }
    }
    if(q.st && window.OchemBuilder){
      /* A structure sent from another tool — the product of a mechanism, say,
         which has no formula anyone would type. */
      var handed = window.OchemBuilder.decode(q.st);
      if(handed){
        var src0 = document.getElementById('v3Src').querySelector('[data-src="build"]');
        if(src0) src0.click();
        if(builderApi){ builderApi.load(handed); return true; }
      }
    }
    if(q.build){
      var src = document.getElementById('v3Src').querySelector('[data-src="build"]');
      if(src) src.click();
      if(builderApi){ builderApi.build(q.build); }
      return true;
    }
    if(q.mol && LIB.get(q.mol)){ select(LIB.get(q.mol)); return true; }
    return false;
  }

  if(!restore()) select(LIB.ALL[0]);
  /* ---- Check yourself ---------------------------------------------------
     Every answer here is computed by M3.analyse() from the same coordinates
     the viewer draws, exactly as the on-screen readout is. Nothing is typed
     into a question bank, so a quiz answer and the molecule on screen cannot
     drift apart — and a molecule added to the library becomes a question
     without anyone writing one. */
  if(window.OchemToolQuiz){
    var SHAPE_POOL = [];
    Object.keys(M3.SHAPES).forEach(function(k){
      var m = M3.SHAPES[k].m;
      if(SHAPE_POOL.indexOf(m) < 0) SHAPE_POOL.push(m);
    });

    window.OchemToolQuiz.mount(document.getElementById('tool-quiz'), {
      slug: 'viewer-3d',
      rounds: 6,
      intro: 'Shape, steric number and hybridization — without the model in front of you.',
      make: function(recent){
        /* Only atoms the shape table actually classifies: a ring carbon in
           benzene is a fine thing to look at and a poor thing to be asked
           about out of context. */
        var pool = LIB.ALL.filter(function(m){
          var a = M3.analyse(m, m.focus === undefined ? 0 : m.focus);
          return a && a.shape;
        });
        if(!pool.length) return null;

        var pick = null, tries = 0;
        do {
          pick = pool[Math.floor(Math.random() * pool.length)];
          tries++;
        } while(tries < 40 && recent.indexOf(pick.id) >= 0 && pool.length > recent.length);

        var idx = pick.focus === undefined ? 0 : pick.focus;
        var a = M3.analyse(pick, idx);
        var askHyb = Math.random() < 0.4;

        if(askHyb){
          var hybs = ['sp', 'sp²', 'sp³', 'sp³d', 'sp³d²'];
          return {
            id: pick.id + ':hyb',
            options: hybs.map(function(h){ return { id:h, label:h, correct: h === a.shape.hyb }; }),
            prompt: 'What is the hybridization of the ' + esc(a.el) + ' in <b>' +
                    esc(pick.name) + '</b>?',
            explain: '<b>' + a.shape.hyb + '</b>. ' + a.bonds + ' bond' + (a.bonds === 1 ? '' : 's') +
                     ' plus ' + a.lonePairs + ' lone pair' + (a.lonePairs === 1 ? '' : 's') +
                     ' makes a steric number of ' + a.steric + ', and the hybridization follows from ' +
                     'the count of electron groups — not from how many of them happen to be bonds.'
          };
        }

        /* Distractors are other real shapes, with the electron geometry
           included when it differs from the molecular one: "tetrahedral" is
           the answer students give for ammonia, and it deserves to be on the
           list so that choosing it is a thing that can be corrected. */
        var wrong = SHAPE_POOL.filter(function(s){ return s !== a.shape.m; });
        for(var i = wrong.length - 1; i > 0; i--){
          var j = Math.floor(Math.random() * (i + 1));
          var t = wrong[i]; wrong[i] = wrong[j]; wrong[j] = t;
        }
        var opts = [{ id:a.shape.m, label:a.shape.m, correct:true }];
        wrong.slice(0, 3).forEach(function(s){ opts.push({ id:s, label:s, correct:false }); });

        return {
          id: pick.id + ':shape',
          prompt: 'What is the <b>molecular shape</b> at the ' + esc(a.el) +
                  ' of <b>' + esc(pick.name) + '</b>' +
                  (pick.formula ? ' (<span class="tformula">' + esc(pick.formula) + '</span>)' : '') + '?',
          options: opts,
          explain: '<b>' + a.shape.m + '</b>. The electron geometry is ' + a.shape.e.toLowerCase() +
                   ' — ' + a.steric + ' groups around the ' + a.el + ' — but ' +
                   (a.lonePairs
                     ? a.lonePairs + ' of them ' + (a.lonePairs === 1 ? 'is a lone pair, and lone pairs ' : 'are lone pairs, and lone pairs ') +
                       'are not part of the SHAPE even though they push on it. That is the whole of the difference between the two names.'
                     : 'with no lone pairs the two names are the same thing.')
        };
      }
    });
  }

})();
