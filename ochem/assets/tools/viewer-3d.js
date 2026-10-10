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
  var v3SendApi = null;
  var v3LastBuilt = null;
  var rockHandle = null;
  var idleSince = Date.now();

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* Picker and stage side by side on a wide screen (site audit 2026-10): stacked,
     the picker filled the whole first screen at 1440 px and the molecule sat
     below the fold. Narrow screens still stack them (viewer-3d.html). */
  /* Landing (owner brief 2026-10-09): the Explore | Predict shape switch and
     one plain first step above the tool; the model gets the wide column. The
     molecule list shows its first group with the rest behind More molecules,
     and the display settings (style, view, spin, labels, zoom) sit behind
     one View options disclosure under the model. */
  root.innerHTML =
    '<div class="tool-modes">' +
      '<div class="tseg" id="v3Task" role="group" aria-label="Mode">' +
        '<button type="button" data-task="explore" class="on" aria-pressed="true">Explore</button>' +
        '<button type="button" data-task="predict" aria-pressed="false">Predict shape</button>' +
      '</div>' +
      '<p class="tool-step" id="v3Step"></p>' +
    '</div>' +
    '<div class="v3-layout">' +
    '<div class="tpanel v3-pick">' +
      '<div class="tpanel__head">' +
        '<span>Pick a molecule</span>' +
        '<div class="tseg" id="v3Src">' +
          '<button type="button" data-src="lib" class="on">Ready-made</button>' +
          '<button type="button" data-src="build">Build your own</button>' +
        '</div>' +
      '</div>' +
      '<div id="v3Picker"></div>' +
      '<div id="v3Builder" hidden></div>' +
      '<div id="v3BuildMsg"></div>' +
      '<div id="v3Send"></div>' +
    '</div>' +
      '<div class="tpanel v3-main">' +
        '<div class="tpanel__head"><span>The model</span><span id="v3Name" class="tmuted"></span></div>' +
        '<div class="v3-stage" id="v3Stage">' +
          '<svg id="v3Svg" viewBox="0 0 320 300" role="group" aria-label="3D molecule: tab to an atom to read it, or use the arrow keys to turn the model"></svg>' +
        '</div>' +
        '<div id="v3Quiz" class="v3-quiz" hidden></div>' +
        '<details class="tool-more" id="v3Opts"><summary>View options <span class="tool-more__now" id="v3OptsNow"></span></summary>' +
        '<div class="trow" style="margin-top:6px;">' +
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
        '</details>' +
        '<p class="tmuted" style="margin:12px 0 0;" id="v3Note"></p>' +
      '</div>' +
    '</div>' +
    '<div class="tpanel">' +
      '<div class="tpanel__head">' +
        '<span>What this atom is doing</span>' +
        '<span class="tmuted" id="v3Hint">click an atom</span>' +
      '</div>' +
      '<div aria-live="polite" id="v3Analysis"></div>' +
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

  function groupHtml(g){
    return '<div class="ap-group">' +
      '<div class="ap-group__label">' + esc(g.label) + '</div>' +
      '<div class="tchips">' + g.items.map(function(m){
        return '<button type="button" class="tchip" data-id="' + esc(m.id) + '">' + esc(m.name) + '</button>';
      }).join('') + '</div></div>';
  }
  var GROUPS3 = LIB.groups();
  elPicker.innerHTML = groupHtml(GROUPS3[0]) +
    '<details class="tool-more" id="v3More"><summary>More molecules <span class="tool-more__now">· ' +
      esc(GROUPS3.slice(1).map(function(g){ return g.label.toLowerCase(); }).join(', ')) + '</span></summary>' +
      GROUPS3.slice(1).map(groupHtml).join('') + '</details>';

  function setStep(){
    var predicting = typeof task !== 'undefined' && task && task.on;
    document.getElementById('v3Step').innerHTML = predicting
      ? '<b>Turn the model, then name the shape of the ringed atom.</b>'
      : '<b>Drag the molecule to turn it, and tap an atom</b> to see its shape and angles.';
  }

  elPicker.querySelectorAll('.tchip').forEach(function(b){
    b.addEventListener('click', function(){
      select(LIB.get(b.getAttribute('data-id')));
      // On a phone the list sits below the model: bring the model back into view so the pick is seen.
      if(window.OchemShowWork) window.OchemShowWork(document.getElementById('v3Stage'));
    });
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
    if(elPicker.querySelector('#v3More [data-id="' + m.id + '"]')) document.getElementById('v3More').open = true;
    elName.textContent = m.name + ' · ' + m.formula;
    svg.setAttribute('aria-label', m.name + ', 3D model: tab to an atom to read it, or use the arrow keys to turn it');
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

  var MODE_NAME = { ball:'ball & stick', space:'space-filling', wire:'wireframe' };
  function draw(){
    var now = document.getElementById('v3OptsNow');
    if(now) now.textContent = '· ' + (MODE_NAME[opts.mode] || opts.mode);
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
    if(window.OchemToolHandoff){
      v3SendApi = window.OchemToolHandoff.mountSend(
        document.getElementById('v3Send'), function(){ return v3LastBuilt; });
    }
    builderApi = window.OchemBuilderUI.mount(elBuild, {
      onChange: function(st, report){
        v3LastBuilt = (report.empty || !report.ok) ? null : st;
        if(v3SendApi) v3SendApi.refresh();
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
    if(typeof task !== "undefined" && task && task.on && !task.done){
      elAnal.innerHTML = '<div class="tempty">Hidden while you predict. Turn the model, look along the bonds, then answer above.</div>';
      document.getElementById('v3Hint').textContent = '';
      return;
    }
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
      html += '<details class="tool-more tool-more--why"><summary>Every angle, measured</summary>' +
        '<div class="ttable-scroll"><table class="ttable">' +
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
        '</tbody></table></div></details>';

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

  /* ---- Predict the shape -------------------------------------------------

     The readout names the shape the moment you click, which makes the
     viewer a lookup. This mode hides it: a molecule loads with its central
     atom ringed, labels and lone pairs off, and you turn it until you can
     see what it is. Then name the shape and the bond angle; the readout
     comes back with the measured angles, so the answer is checked against
     the same coordinates you were looking at. Angles are only asked where
     the library's geometry is the textbook value (the GEOMETRY_CLAIMS list
     in tool-content.test.mjs, plus PCl₅ and SF₆ at their exact 90°); for
     the rest the question is the shape alone. */
  var TASK_POOL = ['methane', 'ammonia', 'water', 'boron-trifluoride', 'phosphorus-pentachloride', 'sulfur-hexafluoride',
                   'ethene', 'ethyne', 'carbon-dioxide-3d', 'formaldehyde-3d', 'methyl-cation', 'methyl-anion',
                   'hydronium', 'acetonitrile', 'dimethyl-ether'];
  /* Formamide is left out: the model draws its nitrogen with the lone pair
     delocalized (no lone pair on N), which is right for the shape and would
     read as a wrong count in "N bonds and 0 lone pairs" feedback. */
  var ANGLE_OK = { methane:109.5, ammonia:107, water:104.5, 'boron-trifluoride':120, 'phosphorus-pentachloride':90,
                   'sulfur-hexafluoride':90, ethene:120, ethyne:180, 'carbon-dioxide-3d':180, 'formaldehyde-3d':120,
                   'methyl-cation':120, acetonitrile:180, formamide:120 };
  var ANGLES = [90, 104.5, 107, 109.5, 120, 180];
  var task = { on:false, done:false, id:null, shape:null, angle:null, score:{ right:0, total:0 }, last:null, saved:null };

  function taskSay(){
    var el = document.getElementById('v3Quiz');
    if(!task.on){ el.hidden = true; return; }
    el.hidden = false;
    var a = M3.analyse(mol, mol.focus === undefined ? 0 : mol.focus);
    var shapes = [];
    Object.keys(M3.SHAPES).forEach(function(k){ var n = M3.SHAPES[k].m; if(shapes.indexOf(n) < 0) shapes.push(n); });
    var askAngle = ANGLE_OK[task.id] !== undefined;
    var chip = function(kind, val, label, chosen, right){
      var cls = 'tchip' + (chosen ? ' on' : '') + (task.done && right ? ' is-right' : '') + (task.done && chosen && !right ? ' is-wrong' : '');
      return '<button type="button" class="' + cls + '" data-' + kind + '="' + esc(String(val)) + '" aria-pressed="' + (chosen ? 'true' : 'false') + '"' + (task.done ? ' disabled' : '') + '>' + label + '</button>';
    };
    var html = '<p class="v3-quiz__q">What shape is the ringed <b>' + esc(a.el) + '</b>' + (askAngle ? ', and its bond angle' : '') + '? Turn the model to see.' +
      (task.score.total ? ' <span class="tmuted">' + task.score.right + ' of ' + task.score.total + '</span>' : '') + '</p>' +
      '<p class="v3-quiz__k">Molecular shape</p><div class="tchips">' +
        shapes.map(function(n){ return chip('shape', n, esc(n), task.shape === n, n === a.shape.m); }).join('') + '</div>' +
      (askAngle ? '<p class="v3-quiz__k">' + (task.id === 'phosphorus-pentachloride' || task.id === 'sulfur-hexafluoride' ? 'Smallest bond angle' : 'Bond angle, about') + '</p><div class="tchips">' +
        ANGLES.map(function(g){ return chip('angle', g, g + '°', task.angle === g, g === ANGLE_OK[task.id]); }).join('') + '</div>' : '') +
      '<div class="trow" style="margin-top:12px;">' +
        (task.done ? '<button type="button" class="btn-press" id="v3Next">Next molecule</button>'
                   : '<button type="button" class="btn-press" id="v3Check"' + (task.shape && (!askAngle || task.angle !== null) ? '' : ' disabled') + '>Check</button>' +
                     '<button type="button" class="tchip tchip--ghost" id="v3LpHint">' + (opts.lonePairs ? 'Hide' : 'Show') + ' lone pairs</button>') +
      '</div>';
    if(task.done){
      var okS = task.shape === a.shape.m, okA = !askAngle || task.angle === ANGLE_OK[task.id];
      var measured = a.angles.length ? a.angles[0].deg : null;
      html += '<div class="tnote ' + (okS && okA ? 'tnote--good' : 'tnote--bad') + '" tabindex="-1" id="v3Verdict"><span class="tnote__k">' +
        esc(mol.name) + ': ' + esc(a.shape.m) + (askAngle ? ', ' + ANGLE_OK[task.id] + '°' : '') + '</span>' +
        a.bonds + ' bond' + (a.bonds === 1 ? '' : 's') + ' and ' + a.lonePairs + ' lone pair' + (a.lonePairs === 1 ? '' : 's') +
        ' on the ' + esc(a.el) + ' make ' + a.steric + ' electron group' + (a.steric === 1 ? '' : 's') + ', arranged ' + esc(a.shape.e.toLowerCase()) + '. ' +
        (a.lonePairs ? 'Name the shape from the atoms only: ' + esc(a.shape.m.toLowerCase()) + '. ' : '') +
        (!okS && task.shape ? (task.shape === a.shape.e && a.lonePairs ? 'You named the electron geometry; the lone pair' + (a.lonePairs > 1 ? 's are' : ' is') + ' there but not part of the shape. '
          : 'Count the electron groups again: every lone pair counts, and a double or triple bond counts as one. ') : '') +
        (askAngle && measured !== null ? 'Measured on this model: ' + measured.toFixed(1) + '°' +
          (a.lonePairs && ANGLE_OK[task.id] < 109.5 ? ', under 109.5° because lone pairs push the bonds together.' : '.') : '') +
        '</div>';
    }
    el.innerHTML = html;
    el.querySelectorAll('[data-shape]').forEach(function(b){ b.addEventListener('click', function(){ task.shape = b.getAttribute('data-shape'); taskSay(); var x = el.querySelector('[data-shape="' + task.shape + '"]'); if(x) x.focus(); }); });
    el.querySelectorAll('[data-angle]').forEach(function(b){ b.addEventListener('click', function(){ task.angle = parseFloat(b.getAttribute('data-angle')); taskSay(); var x = el.querySelector('[data-angle="' + task.angle + '"]'); if(x) x.focus(); }); });
    var chk = document.getElementById('v3Check');
    if(chk) chk.addEventListener('click', function(){
      task.done = true; task.score.total++;
      if(task.shape === a.shape.m && (!askAngle || task.angle === ANGLE_OK[task.id])) task.score.right++;
      opts.labels = true; opts.lonePairs = true;
      document.getElementById('v3Labels').checked = true; document.getElementById('v3Lp').checked = true;
      selected = mol.focus === undefined ? 0 : mol.focus;
      draw(); taskSay();
      var v = document.getElementById('v3Verdict'); if(v) v.focus({ preventScroll:true });
    });
    var nx = document.getElementById('v3Next'); if(nx) nx.addEventListener('click', function(){ nextTask(); var f = document.querySelector('#v3Quiz [data-shape]'); if(f) f.focus(); });
    var lh = document.getElementById('v3LpHint'); if(lh) lh.addEventListener('click', function(){
      opts.lonePairs = !opts.lonePairs; document.getElementById('v3Lp').checked = opts.lonePairs; draw(); taskSay();
      var b2 = document.getElementById('v3LpHint'); if(b2) b2.focus(); });
  }

  function nextTask(){
    var pool = TASK_POOL.filter(function(id){ return LIB.get(id) && id !== task.id; });
    task.id = pool[Math.floor(Math.random() * pool.length)];
    task.shape = null; task.angle = null; task.done = false;
    opts.labels = false; opts.lonePairs = false;
    document.getElementById('v3Labels').checked = false; document.getElementById('v3Lp').checked = false;
    select(LIB.get(task.id));
    /* A random start, so "edge-on" is something you find rather than get. */
    rx = -0.2 - Math.random() * 0.7; ry = Math.random() * 6.28;
    draw();
    taskSay();
  }

  function setTask(on){
    task.on = on;
    document.getElementById('v3Task').querySelectorAll('button').forEach(function(b){
      var m = (b.getAttribute('data-task') === 'predict') === on;
      b.classList.toggle('on', m); b.setAttribute('aria-pressed', m ? 'true' : 'false');
    });
    root.classList.toggle('is-predicting', on);
    if(on){ task.saved = { labels: opts.labels, lp: opts.lonePairs }; nextTask(); }
    else {
      if(task.saved){ opts.labels = task.saved.labels; opts.lonePairs = task.saved.lp;
        document.getElementById('v3Labels').checked = opts.labels; document.getElementById('v3Lp').checked = opts.lonePairs; }
      taskSay(); draw();
    }
  }
  document.getElementById('v3Task').addEventListener('click', function(e){
    var b = e.target.closest('[data-task]'); if(!b) return;
    var on = b.getAttribute('data-task') === 'predict';
    if(on !== task.on) setTask(on);
  });

  setStep();
  document.getElementById('v3Task').addEventListener('click', setStep);
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

        /* `recent` holds full question ids ("water:shape"), so a bare
           molecule id never matched and every draw was unfiltered. */
        function seenLately(m){
          return recent.some(function(r){ return r.indexOf(m.id + ':') === 0; });
        }
        var pick = null, tries = 0;
        do {
          pick = pool[Math.floor(Math.random() * pool.length)];
          tries++;
        } while(tries < 40 && seenLately(pick) && pool.length > recent.length);

        var idx = pick.focus === undefined ? 0 : pick.focus;
        var a = M3.analyse(pick, idx);
        var askHyb = Math.random() < 0.4;

        if(askHyb){
          var hybs = ['sp', 'sp²', 'sp³', 'sp³d', 'sp³d²'];
          return {
            id: pick.id + ':hyb',
            term: 'hybridization', topic: 'hybridization',
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
          term: 'vsepr-theory', topic: 'molecular-geometry',
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
