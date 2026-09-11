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
  var opts = { labels:true, lonePairs:true, spin:false };
  var spinHandle = null;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  root.innerHTML =
    '<div class="tpanel">' +
      '<div class="tpanel__head">Pick a molecule</div>' +
      '<div id="v3Picker"></div>' +
    '</div>' +
    '<div class="tsplit tsplit--wide">' +
      '<div class="tpanel">' +
        '<div class="tpanel__head"><span>Drag to turn it</span><span id="v3Name" class="tmuted"></span></div>' +
        '<div class="v3-stage" id="v3Stage">' +
          '<svg id="v3Svg" viewBox="0 0 320 300" role="img" aria-label="3D molecule"></svg>' +
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
          '<div id="v3Analysis"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var svg      = document.getElementById('v3Svg');
  var stage    = document.getElementById('v3Stage');
  var elPicker = document.getElementById('v3Picker');
  var elName   = document.getElementById('v3Name');
  var elNote   = document.getElementById('v3Note');
  var elAnal   = document.getElementById('v3Analysis');

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
      cx:160, cy:150, scale:fit * zoom, dist:9,
      rx:rx, ry:ry,
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
      document.getElementById('v3Views').querySelectorAll('button').forEach(function(x){
        x.classList.toggle('on', x === b);
      });
      draw();
    });
  });

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

  select(LIB.ALL[0]);
})();
