/* Function lab (simulator, free; docs/apprecalc-spec.md section 6). OWNED BY
   THIS TOOL ONLY (builder T1, docs/apprecalc-briefs/t1.md). Model:
   ApPrecalcMath.functionLab (precalculus/assets/tools/math/function-lab.js);
   frame: ApPrecalcTools.modes and drill on the Tool Studio; math text
   ApPrecalcTex.

   Explore: one stage for every parent function the course transforms,
   g(x) = a f(b(x - h)) + k. The parent stays as a ghost; the graph of g is
   the course green. Two handles on the graph: the square one is (h, k) (drag
   to translate), the round one is a key point (drag up and down for a,
   sideways for b). Or pick one parameter and slide it. The formula, a
   sentence in words, the table of key points (each point the same color on
   the graph and in the table) and the features (zeros, asymptotes, domain,
   range, end behavior in limit notation) change together. "Play the steps"
   runs the four changes in the order they act.

   Test yourself: read a, h, k from a graph; where a point goes; describe a
   transformation (b factored out first); asymptotes of a/(x - h) + k in limit
   notation; an exponential's asymptote, ends and zero. */
(function(){
  'use strict';
  var T = window.ApPrecalcTools, M = window.ApPrecalcMath, P = window.ApPrecalcPlot, X = window.ApPrecalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Numbers & details');
  })();
  if(!T || !M || !M.functionLab || M.functionLab.stub || !P) return;
  var FL = M.functionLab, F = T.F, esc = T.esc, NS = 'http://www.w3.org/2000/svg', PI = Math.PI;
  function tex(s){ return X ? X.render(s) : esc(s); }
  function html(s){ return X ? X.html(s) : s; }
  function r1(v){ return Math.round(v * 10) / 10; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function num(v){ return FL.n(v, 2).replace(/^-/, '−'); }
  function studioNow(){ var app = document.getElementById('app'); return window.LevlStudio && app && app.getAttribute('data-studio') ? window.LevlStudio.get() : null; }

  T.mount('function-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'function-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.pause(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ explore */
  var PARAMS = {
    a: { label: 'a, vertical dilation', min: -3, max: 3, step: 0.1, skip0: true, what: 'outside: stretches the outputs; a < 0 reflects over the x-axis' },
    b: { label: 'b, horizontal dilation', min: -3, max: 3, step: 0.1, skip0: true, what: 'inside: the graph is 1/|b| as wide; b < 0 reflects over the y-axis' },
    h: { label: 'h, horizontal translation', min: -6, max: 6, step: 0.1, what: 'inside: moves the graph h right (left when h < 0)' },
    k: { label: 'k, vertical translation', min: -6, max: 6, step: 0.1, what: 'outside: moves the graph k up (down when k < 0)' }
  };
  var ID = { a: 1, b: 1, h: 0, k: 0 };
  function explore(host, data){
    var LS = null;
    var fams = (data.families || []).map(function(f){ return f.id; }).filter(function(id){ return FL.FAMILIES[id]; });
    if(!fams.length) fams = ['quadratic'];
    var st = { fam: fams.indexOf('quadratic') > -1 ? 'quadratic' : fams[0], p: { a: 1, b: 1, h: 2, k: -1 }, key: 'a', focus: 'sh', touched: false, anim: null, play: null };
    var cue = T.cue('Drag the round handle on the graph, or pick a parameter and slide it.');
    host.innerHTML =
      '<section class="bt-problem fl-card" aria-label="Function lab">' +
        '<div class="fl-stage">' +
          '<div class="fl-main">' +
            '<p class="fl-eqline" aria-hidden="true"></p>' +
            '<div class="fl-graph-wrap"><svg class="fl-graph" role="group" aria-roledescription="graph"><g class="fl-plot"></g><g class="fl-handles"></g></svg></div>' +
            '<p class="fl-legend" aria-hidden="true"><span class="fl-lg fl-lg-f">parent f</span><span class="fl-lg fl-lg-g">g</span><span class="fl-lg fl-lg-hk">(h, k)</span><span class="fl-lg fl-lg-sh">drag: a and b</span></p>' +
          '</div>' +
          '<div class="fl-side"></div>' +
        '</div>' +
        '<div class="fl-ctl">' +
          '<div class="fl-chips"></div>' +
          '<div class="fl-prow"><div class="fl-pseg ls-seg" role="group" aria-label="Parameter to move">' + ['a', 'b', 'h', 'k'].map(function(k){ return '<button type="button" class="bt-mode fl-pk" data-k="' + k + '" aria-pressed="false"><i>' + k + '</i></button>'; }).join('') + '</div><div class="fl-slot"></div></div>' +
          '<div class="fl-acts"><button type="button" class="bt-btn fl-play">Play the steps</button><button type="button" class="bt-btn fl-reset">Reset to f</button></div>' +
        '</div>' +
        '<div class="fl-say"></div>' +
        '<div class="fl-det"></div>' +
        '<p class="sr-only fl-live"></p>' +
      '</section>';
    var card = host.querySelector('.fl-card');
    card.insertBefore(cue.el, card.querySelector('.fl-say'));
    var wrap = host.querySelector('.fl-graph-wrap'), svg = host.querySelector('.fl-graph'), plot = svg.querySelector('.fl-plot'), hg = svg.querySelector('.fl-handles');
    var chips = host.querySelector('.fl-chips'), seg = host.querySelector('.fl-pseg'), slot = host.querySelector('.fl-slot');
    var eqline = host.querySelector('.fl-eqline'), side = host.querySelector('.fl-side'), det = host.querySelector('.fl-det');
    var say = T.announcer(host.querySelector('.fl-live'));
    var slider = null, view = null;
    function Fm(){ return FL.FAMILIES[st.fam]; }
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }

    /* ---------------------------------------------- the frame of the graph */
    /* Equal units on both axes, so a slope or a dilation looks like what it is. */
    function layout(){
      var w = Math.max(260, Math.round(wrap.clientWidth || 600)), hh = Math.max(220, Math.round(wrap.clientHeight || 420));
      var pad = { l: 8, r: 8, t: 8, b: 8 }, sine = st.fam === 'sine';
      var xs = sine ? [-2 * PI - 0.4, 2 * PI + 0.4] : [-8, 8];
      var unit = (w - pad.l - pad.r) / (xs[1] - xs[0]), yspan = (hh - pad.t - pad.b) / unit;
      if(yspan < 9){ unit = (hh - pad.t - pad.b) / 9; yspan = 9; var xspan = (w - pad.l - pad.r) / unit; xs = [-xspan / 2, xspan / 2]; }
      var ys = [-yspan / 2, yspan / 2];
      return { w: w, h: hh, x: xs, y: ys, unit: unit, pad: pad,
        sx: function(x){ return pad.l + (x - xs[0]) * unit; }, sy: function(y){ return pad.t + (ys[1] - y) * unit; },
        ix: function(px){ return xs[0] + (px - pad.l) / unit; }, iy: function(py){ return ys[1] - (py - pad.t) / unit; } };
    }
    function path(f, V, lo, hi){
      lo = Math.max(lo == null ? V.x[0] : lo, V.x[0]); hi = Math.min(hi == null ? V.x[1] : hi, V.x[1]);
      if(!(hi > lo)) return '';
      var runs = P.sample(f, lo, hi, { y: [V.y[0] - 2, V.y[1] + 2] }, 700);
      return runs.map(function(r){ return 'M' + r.map(function(q){ return r1(V.sx(q[0])) + ' ' + r1(V.sy(q[1])); }).join('L'); }).join('');
    }
    function piLab(v){ var k = Math.round(v / (PI / 2)); if(!k) return '0'; var neg = k < 0; k = Math.abs(k); return (neg ? '−' : '') + (k % 2 ? (k === 1 ? '' : k) + 'π/2' : (k / 2 === 1 ? '' : k / 2) + 'π'); }

    /* ---------------------------------------------- drawing */
    var PCOL = ['p1', 'p2', 'p3', 'p4', 'p5'];
    function draw(p, mirror){
      p = p || st.p;
      var V = view = layout(), o = [], fam = st.fam, Fa = Fm(), sine = fam === 'sine';
      svg.setAttribute('viewBox', '0 0 ' + V.w + ' ' + V.h);
      // grid: every unit, labels every 2 (or every π/2 on the sine)
      var x0 = Math.ceil(V.x[0]), x1 = Math.floor(V.x[1]), y0 = Math.ceil(V.y[0]), y1 = Math.floor(V.y[1]), lab = V.unit >= 34 ? 1 : 2;
      o.push('<rect class="fl-bg" x="0" y="0" width="' + V.w + '" height="' + V.h + '" rx="12"/>');
      var g = [];
      if(sine){ for(var q = Math.ceil(V.x[0] / (PI / 4)); q * PI / 4 <= V.x[1]; q++) g.push('<line class="fl-grid' + (q % 2 ? ' is-minor' : '') + '" x1="' + r1(V.sx(q * PI / 4)) + '" y1="0" x2="' + r1(V.sx(q * PI / 4)) + '" y2="' + V.h + '"/>'); }
      else for(var gx = x0; gx <= x1; gx++) g.push('<line class="fl-grid' + (gx % lab ? ' is-minor' : '') + '" x1="' + r1(V.sx(gx)) + '" y1="0" x2="' + r1(V.sx(gx)) + '" y2="' + V.h + '"/>');
      for(var gy = y0; gy <= y1; gy++) g.push('<line class="fl-grid' + (gy % lab ? ' is-minor' : '') + '" x1="0" y1="' + r1(V.sy(gy)) + '" x2="' + V.w + '" y2="' + r1(V.sy(gy)) + '"/>');
      o.push(g.join(''));
      var ax = r1(V.sy(0)), ay = r1(V.sx(0));
      o.push('<line class="fl-axis" x1="0" y1="' + ax + '" x2="' + V.w + '" y2="' + ax + '"/><line class="fl-axis" x1="' + ay + '" y1="0" x2="' + ay + '" y2="' + V.h + '"/>');
      var t = [];
      if(sine){ for(var qq = Math.ceil(V.x[0] / (PI / 2)); qq * PI / 2 <= V.x[1] - 0.2; qq++) if(qq) t.push('<text class="fl-tk" x="' + r1(V.sx(qq * PI / 2)) + '" y="' + (+ax + 15) + '" text-anchor="middle">' + piLab(qq * PI / 2) + '</text>'); }
      else for(var tx = x0; tx <= x1; tx++) if(tx && !(tx % 2) && V.sx(tx) > 14 && V.sx(tx) < V.w - 14) t.push('<text class="fl-tk" x="' + r1(V.sx(tx)) + '" y="' + (+ax + 15) + '" text-anchor="middle">' + num(tx) + '</text>');
      for(var ty = y0; ty <= y1; ty++) if(ty && !(ty % 2) && V.sy(ty) > 12 && V.sy(ty) < V.h - 8) t.push('<text class="fl-tk" x="' + (+ay - 6) + '" y="' + r1(V.sy(ty) + 4) + '" text-anchor="end">' + num(ty) + '</text>');
      t.push('<text class="fl-axl" x="' + (V.w - 8) + '" y="' + (+ax - 7) + '" text-anchor="end">x</text><text class="fl-axl" x="' + (+ay + 7) + '" y="18">y</text>');
      o.push(t.join(''));
      // asymptotes of g
      var vas = FL.vas(fam, p), has = FL.has(fam, p);
      if(!mirror || mirror === 1){
        vas.forEach(function(v){ var px = r1(V.sx(v.x)); o.push('<line class="fl-asym" x1="' + px + '" y1="0" x2="' + px + '" y2="' + V.h + '"/><text class="fl-asl" x="' + (+px + 6) + '" y="' + (V.h - 10) + '">x = ' + num(v.x) + '</text>'); });
        has.forEach(function(a){ var py = r1(V.sy(a.y)); o.push('<line class="fl-asym" x1="0" y1="' + py + '" x2="' + V.w + '" y2="' + py + '"/><text class="fl-asl" x="10" y="' + (+py - 6) + '">y = ' + num(a.y) + '</text>'); });
      }
      // the parent, ghosted
      var f0 = function(x){ return FL.g(fam, ID, x); };
      o.push('<path class="fl-parent" d="' + piecePath(f0, V, ID) + '"/>');
      // g (with a reflection over the y-axis drawn as a mirror while it plays)
      var gx2 = function(x){ return FL.g(fam, p, x); };
      var gd;
      if(mirror != null && mirror !== 1){
        var m = mirror, pts = [], d = '';
        var runs = P.sample(gx2, V.x[0] / Math.max(0.05, Math.abs(m)), V.x[1] / Math.max(0.05, Math.abs(m)), { y: [V.y[0] - 2, V.y[1] + 2] }, 700);
        gd = runs.map(function(r){ return 'M' + r.map(function(q2){ return r1(V.sx(q2[0] * m)) + ' ' + r1(V.sy(q2[1])); }).join('L'); }).join('');
      } else gd = piecePath(gx2, V, p);
      o.push('<path class="fl-g" d="' + gd + '"/>');
      // endpoints: the square root's start, the piecewise jump
      if(fam === 'sqrt' && mirror == null) o.push(dot(V, p.h, p.k, 'fl-end', false));
      if(fam === 'piecewise' && mirror == null){ o.push(dot(V, p.h, 2 * p.a + p.k, 'fl-end', true)); o.push(dot(V, p.h, p.a + p.k, 'fl-end', false)); }
      if(fam === 'piecewise' && mirror == null){ o.push(dot(V, 0, 2, 'fl-pend', true)); o.push(dot(V, 0, 1, 'fl-pend', false)); }
      // zeros of g
      if(mirror == null){
        var Z = FL.zeros(fam, p, V.x);
        Z.forEach(function(z){ o.push('<circle class="fl-zero" cx="' + r1(V.sx(z)) + '" cy="' + ax + '" r="5.5"/>'); });
        // one mapping at a time (pass 3): the key point in focus (the one under the round handle, or the
        // (h, k) corner while that is dragged) shows its parent point and the dotted line to its image.
        // Every key point's mapping stays in the table in Numbers & details.
        var fi = st.focus === 'hk' ? hkIndex(Fa) : Fa.shape;
        Fa.keys.forEach(function(kp, i){
          if(i !== fi) return;
          var q3 = FL.image(p, kp), cls = PCOL[i % PCOL.length];
          if(inView(V, kp) && inView(V, q3) && Math.hypot(V.sx(q3[0]) - V.sx(kp[0]), V.sy(q3[1]) - V.sy(kp[1])) > 14) o.push('<line class="fl-link ' + cls + '" x1="' + r1(V.sx(kp[0])) + '" y1="' + r1(V.sy(kp[1])) + '" x2="' + r1(V.sx(q3[0])) + '" y2="' + r1(V.sy(q3[1])) + '"/>');
          if(inView(V, kp)) o.push('<circle class="fl-kp0 ' + cls + '" cx="' + r1(V.sx(kp[0])) + '" cy="' + r1(V.sy(kp[1])) + '" r="4.5"/>');
        });
      }
      plot.innerHTML = o.join('');
      placeHandles(V, p, mirror != null);
    }
    /* g drawn piece by piece, so the piecewise jump and the domain edge stay sharp. */
    function piecePath(f, V, p){
      if(st.fam !== 'piecewise') return path(f, V);
      // the jump is at x = h; each side drawn on its own
      return path(f, V, V.x[0], p.h - 1e-9) + path(f, V, p.h, V.x[1]);
    }
    /* the key point that lands on (h, k), if the parent has one at the origin */
    function hkIndex(Fa){ for(var i = 0; i < Fa.keys.length; i++) if(!Fa.keys[i][0] && !Fa.keys[i][1]) return i; return -1; }
    function inView(V, q){ return q[0] > V.x[0] + 0.05 && q[0] < V.x[1] - 0.05 && q[1] > V.y[0] + 0.05 && q[1] < V.y[1] - 0.05; }
    function dot(V, x, y, cls, open){ if(!inView(V, [x, y])) return ''; return '<circle class="' + cls + (open ? ' is-open' : '') + '" cx="' + r1(V.sx(x)) + '" cy="' + r1(V.sy(y)) + '" r="5"/>'; }

    /* ---------------------------------------------- the two handles */
    var H = { hk: mkHandle('hk', 'Handle (h, k): moves the graph. Arrow keys move it.'), sh: mkHandle('sh', 'Key point handle: up and down changes a, sideways changes b. Arrow keys move it.') };
    function mkHandle(kind, label){
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'fl-h fl-h-' + kind); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'slider'); g.setAttribute('aria-label', label);
      g.innerHTML = kind === 'hk' ? '<circle class="fl-halo" r="20"/><rect class="fl-hdot" x="-7.5" y="-7.5" width="15" height="15" rx="3"/>' : '<circle class="fl-halo" r="20"/><circle class="fl-hdot" r="8.5"/><circle class="fl-hcore" r="3"/>';
      hg.appendChild(g);
      var dragging = false;
      function local(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); var q = m ? pt.matrixTransform(m.inverse()) : pt; return [view.ix(q.x), view.iy(q.y)]; }
      g.addEventListener('pointerdown', function(e){ stopPlay(); st.focus = kind; dragging = true; try{ g.setPointerCapture(e.pointerId); }catch(er){} g.classList.add('is-drag'); e.preventDefault(); touch(); });
      g.addEventListener('pointermove', function(e){ if(!dragging) return; var q = local(e); moveTo(kind, q[0], q[1]); });
      function up(){ if(!dragging) return; dragging = false; g.classList.remove('is-drag'); update(true); }
      g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
      g.addEventListener('keydown', function(e){
        var k = e.key, s = e.shiftKey ? 1 : 0.1, dx = 0, dy = 0;
        if(k === 'ArrowRight') dx = s; else if(k === 'ArrowLeft') dx = -s; else if(k === 'ArrowUp') dy = s; else if(k === 'ArrowDown') dy = -s; else return;
        e.preventDefault(); stopPlay(); touch(); st.focus = kind;
        if(kind === 'hk'){ setP({ h: st.p.h + dx, k: st.p.k + dy }); }
        else {
          // a step of the key point: dy moves its height (a), dx its distance from h (b)
          var q = FL.image(st.p, Fm().keys[Fm().shape]);
          moveTo('sh', q[0] + dx, q[1] + dy);
        }
        update(true);
      });
      return g;
    }
    function snap(v, step){ return Math.round(v / step) * step; }
    function moveTo(kind, x, y){
      if(kind === 'hk'){ setP({ h: clamp(snap(x, 0.1), PARAMS.h.min, PARAMS.h.max), k: clamp(snap(y, 0.1), PARAMS.k.min, PARAMS.k.max) }); }
      else {
        var r = FL.fromShape(st.fam, st.p, x, y), a = clamp(snap(r.a, 0.1), -3, 3), b = isFinite(r.b) ? clamp(snap(r.b, 0.1), -3, 3) : st.p.b;
        // 0 is skipped: crossing it lands on the other side
        if(Math.abs(a) < 0.05) a = r.a < st.p.a ? -0.1 : 0.1;
        if(Math.abs(b) < 0.05) b = st.p.b > 0 ? 0.1 : -0.1;
        setP({ a: a, b: b });
      }
      update(false);
    }
    function placeHandles(V, p, hide){
      var q = FL.image(p, Fm().keys[Fm().shape]);
      [['hk', [p.h, p.k]], ['sh', q]].forEach(function(e){
        var g = H[e[0]], on = !hide && inView(V, e[1]);
        g.style.display = on ? '' : 'none';
        if(!on) return;
        g.setAttribute('transform', 'translate(' + r1(V.sx(e[1][0])) + ' ' + r1(V.sy(e[1][1])) + ')');
      });
      H.hk.setAttribute('aria-valuetext', 'h = ' + num(p.h) + ', k = ' + num(p.k));
      H.sh.setAttribute('aria-valuetext', 'key point at (' + num(q[0]) + ', ' + num(q[1]) + '): a = ' + num(p.a) + ', b = ' + num(p.b));
      H.sh.querySelector('.fl-hdot').setAttribute('class', 'fl-hdot ' + PCOL[Fm().shape % PCOL.length]);
      var lg = host.querySelector('.fl-lg-sh') || (LS && LS.root.querySelector('.fl-lg-sh')); if(lg) lg.setAttribute('data-c', PCOL[Fm().shape % PCOL.length]);
    }

    /* ---------------------------------------------- parameters */
    function setP(ch){
      Object.keys(ch).forEach(function(k){ st.p[k] = Math.round(ch[k] * 1000) / 1000; });
      if(slider && Math.abs(slider.value() - st.p[st.key]) > 1e-9) slider.set(st.p[st.key]);
    }
    function buildSlider(){
      var d = PARAMS[st.key];
      slider = T.slider({ label: d.label, min: d.min, max: d.max, step: d.step, value: st.p[st.key], decimals: 1, onInput: function(v){
        stopPlay(); touch();
        if(d.skip0 && Math.abs(v) < 0.05) v = v < st.p[st.key] ? -0.1 : 0.1;
        setP(obj(st.key, v)); update(true);
      } });
      slot.innerHTML = ''; slot.appendChild(slider.el);
      seg.querySelectorAll('.fl-pk').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === st.key)); });
    }
    function obj(k, v){ var o = {}; o[k] = v; return o; }
    seg.addEventListener('click', function(e){ var b = e.target.closest('.fl-pk'); if(!b) return; touch(); st.key = b.getAttribute('data-k'); buildSlider(); update(false); });
    /* the parent function: one menu (pass 3), not ten chips */
    var famSel = T.choiceSelect({ label: 'Parent function', value: st.fam, options: fams.map(function(id){ return { value: id, label: FL.FAMILIES[id].name }; }),
      onChange: function(v){ touch(); stopPlay(); st.fam = v;
        // keep the parameters: the same transformation on a new parent
        update(true); } });
    famSel.el.classList.add('fl-fam');
    function buildChips(){ chips.innerHTML = ''; chips.appendChild(famSel.el); famSel.set(st.fam); }
    host.querySelector('.fl-reset').addEventListener('click', function(){ touch(); stopPlay(); setP({ a: 1, b: 1, h: 0, k: 0 }); update(true); });
    host.querySelector('.fl-play').addEventListener('click', function(){ touch(); play(); });

    /* ---------------------------------------------- play the steps */
    function phases(p){
      var out = [], ab = Math.abs(p.b), aa = Math.abs(p.a), S = FL.steps(p), i = 0;
      function txt(key){ while(i < S.length && S[i].key !== key) i++; return i < S.length ? S[i++].text : ''; }
      i = 0;
      if(Math.abs(ab - 1) > 1e-9) out.push({ key: 'b', text: txt('b'), at: function(t){ return { a: 1, b: Math.pow(ab, t), h: 0, k: 0 }; } });
      if(p.b < 0) out.push({ key: 'b', text: txt('b'), mirror: true, at: function(t){ return { a: 1, b: ab, h: 0, k: 0, m: Math.cos(PI * t) }; } });
      if(Math.abs(p.h) > 1e-9) out.push({ key: 'h', text: txt('h'), at: function(t){ return { a: 1, b: p.b, h: p.h * t, k: 0 }; } });
      if(Math.abs(aa - 1) > 1e-9) out.push({ key: 'a', text: txt('a'), at: function(t){ return { a: Math.pow(aa, t), b: p.b, h: p.h, k: 0 }; } });
      if(p.a < 0) out.push({ key: 'a', text: txt('a'), at: function(t){ return { a: aa * (1 - 2 * t), b: p.b, h: p.h, k: 0 }; } });
      if(Math.abs(p.k) > 1e-9) out.push({ key: 'k', text: txt('k'), at: function(t){ return { a: p.a, b: p.b, h: p.h, k: p.k * t }; } });
      return out;
    }
    function play(){
      stopPlay();
      var ph = phases(st.p), each = 1.1, gap = 0.35;
      if(!ph.length){ caption('<b>Nothing to play:</b> g is the parent f. Move a parameter first.'); return; }
      var total = ph.length * (each + gap), shown = -1;
      st.play = P.loop(function(dt, t){
        var i = Math.min(ph.length - 1, Math.floor(t / (each + gap))), u = clamp((t - i * (each + gap)) / each, 0, 1);
        u = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;   // ease in and out
        var q = ph[i].at(u);
        draw(q, ph[i].mirror ? q.m : null);
        if(i !== shown){ shown = i; caption('<b>Step ' + (i + 1) + ' of ' + ph.length + ':</b> ' + esc(ph[i].text) + '.'); markKey(ph[i].key); }
        if(t >= total) return false;
      }, { duration: total, still: function(){}, onEnd: function(){ st.play = null; markKey(null); update(true); } });
      st.play.start();
    }
    function stopPlay(){ if(st.play){ var p0 = st.play; st.play = null; p0.stop(); markKey(null); draw(); } }
    function markKey(k){ var e = card.closest('.ls-root') || card; (LS ? LS.root : card).setAttribute('data-fl-play', k || ''); }

    /* ---------------------------------------------- the words */
    var lastCap = '';
    function caption(h){ if(LS){ if(h !== lastCap){ LS.caption(h, 'explore'); lastCap = h; } } }
    function sentenceHtml(p){
      var S = FL.steps(p);
      if(!S.length) return 'g is the parent function f itself: no transformation yet.';
      var t = S.map(function(x){ return '<span class="fl-w' + (x.key === st.key ? ' is-on' : '') + '" data-k="' + x.key + '">' + esc(x.text) + '</span>'; });
      return 'g is f after ' + (t.length === 1 ? t[0] : t.slice(0, -1).join(', ') + ' and ' + t[t.length - 1]) + '.';
    }
    function pv(k, v){ return '<b class="fl-v fl-v' + k + (k === st.key ? ' is-on' : '') + '">' + (v < 0 ? '(' + num(v) + ')' : num(v)) + '</b>'; }
    function templateHtml(p){
      return '<span class="fl-tpl"><i>g</i>(<i>x</i>) = ' + pv('a', p.a) + ' <i>f</i>(' + pv('b', p.b) + '(<i>x</i> − ' + pv('h', p.h) + ')) + ' + pv('k', p.k) + '</span>';
    }
    var cache = {};
    function limHtml(to, L, side){ var key = to + '|' + L + '|' + side; if(!cache[key]) cache[key] = tex(FL.limTex(to, L, side)); return cache[key]; }
    function featsHtml(p, V){
      var fam = st.fam, Z = FL.zeros(fam, p, V.x), E = FL.ends(fam, p), vas = FL.vas(fam, p), rows = [];
      var zt = !Z.length ? 'none in view' : fam === 'sine' ? Z.length + ' in view, ' + (Z.length > 3 ? Z.slice(0, 3).map(num).join(', ') + ', …' : Z.map(num).join(', ')) : 'x = ' + Z.map(num).join(', x = ');
      rows.push(['Zeros', esc(zt)]);
      vas.forEach(function(v){ rows.push(['Vertical asymptote', 'x = ' + num(v.x) + (v.right ? '<br>' + limHtml(v.x, v.right, '+') : '') + (v.left ? '<br>' + limHtml(v.x, v.left, '-') : '')]); });
      FL.has(fam, p).forEach(function(a){ rows.push(['Horizontal asymptote', 'y = ' + num(a.y)]); });
      var endRow = fam === 'sine' ? 'No limit at either end: g keeps oscillating between ' + num(p.k - Math.abs(p.a)) + ' and ' + num(p.k + Math.abs(p.a)) + '.'
        : [['inf', E.pos], ['-inf', E.neg]].filter(function(e){ return e[1] !== null; }).map(function(e){ return limHtml(e[0], e[1]); }).join('<br>');
      rows.push(['End behavior', endRow + (E.pos === null ? '<br><span class="fl-note">g is undefined for large x</span>' : E.neg === null ? '<br><span class="fl-note">g is undefined for very negative x</span>' : '')]);
      rows.push(['Domain', domTex(FL.domain(fam, p))]);
      rows.push(['Range', domTex(FL.range(fam, p))]);
      return '<dl class="fl-feats">' + rows.map(function(r){ return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
    }
    function domTex(t){ if(!cache['d' + t]) cache['d' + t] = tex(t); return cache['d' + t]; }
    function tableHtml(p){
      var Fa = Fm();
      return '<table class="ls-tbl fl-tbl"><caption>Key points: <span class="fl-map">(x, y) → (x/<b class="fl-vb">b</b> + <b class="fl-vh">h</b>, <b class="fl-va">a</b>y + <b class="fl-vk">k</b>)</span></caption><thead><tr><th scope="col"><span class="sr-only">Color</span></th><th scope="col">on f</th><th scope="col">on g</th></tr></thead><tbody>' +
        Fa.keys.map(function(kp, i){ var q = FL.image(p, kp), open = Fa.open && Fa.open.indexOf(i) > -1;
          return '<tr><td><i class="fl-sw ' + PCOL[i % PCOL.length] + (i === Fa.shape ? ' is-h' : '') + '"></i></td><td>(' + pnum(kp[0]) + ', ' + pnum(kp[1]) + ')' + (open ? ' <span class="fl-note">open</span>' : '') + '</td><td>(' + num(q[0]) + ', ' + num(q[1]) + ')</td></tr>'; }).join('') + '</tbody></table>';
    }
    function pnum(v){ return st.fam === 'sine' && Math.abs(v) > 1e-9 && Math.abs(v - Math.round(v)) > 1e-9 ? piLab(v) : num(v); }
    function eqHtml(p){
      var c = FL.tex(st.fam, p, 'g'), pf = 'f(x) = ' + Fm().tex;
      var kc = st.fam + JSON.stringify(p);
      if(!cache[kc]){ cache[kc] = st.fam === 'piecewise' ? '' : tex(c); }
      if(!cache['f' + st.fam]) cache['f' + st.fam] = tex(pf);
      return { tpl: templateHtml(p), concrete: cache[kc], parent: cache['f' + st.fam] };
    }
    function update(full){
      if(st.play) return;
      draw();
      var p = st.p, V = view, E = eqHtml(p);
      eqline.innerHTML = E.tpl;
      side.innerHTML = '<div class="fl-eq"><p class="fl-parentf">' + E.parent + '</p><p class="fl-big">' + E.tpl + '</p>' + (E.concrete ? '<p class="fl-conc">' + E.concrete + '</p>' : '') + '</div>' +
        '<p class="fl-words">' + sentenceHtml(p) + '</p>' + tableHtml(p) + featsHtml(p, V);
      det.innerHTML = '<h3 class="ls-title-l">' + esc(Fm().name) + ' parent</h3><p>' + E.parent + '</p><p class="fl-big">' + E.tpl + '</p>' + (E.concrete ? '<p>' + E.concrete + '</p>' : '') + tableHtml(p) +
        '<h3 class="ls-title-l">Features of g</h3>' + featsHtml(p, V);
      T.explain(host.querySelector('.fl-say') || (LS && LS.root.querySelector('.fl-say')), sentenceHtml(p),
        '<p><b><i>' + st.key + '</i>:</b> ' + esc(PARAMS[st.key].what) + '.</p><p>Inside $f(\\ldots)$ the changes act on the input, so they read "backwards": $x - 3$ moves the graph 3 right, and $2x$ makes it half as wide. Outside, they act on the output as written.</p><p>Order matters: the input is dilated (b), then translated (h); the output is dilated (a), then translated (k). Press Play the steps to watch it.</p>'.replace(/\$[^$]+\$/g, function(m){ return html(m); }));
      if(LS){
        caption(sentenceHtml(p));
        LS.pills([], 'left', 'explore');
      }
      svg.setAttribute('aria-label', 'Graph of g(x) = ' + (st.fam === 'piecewise' ? 'a f(b(x − h)) + k with the piecewise parent' : (X ? X.text(FL.tex(st.fam, p)) : FL.str(st.fam, p))) + ', with the parent ' + Fm().name.toLowerCase() + ' function as a ghost.');
      if(full){ var tmp = document.createElement('div'); tmp.innerHTML = sentenceHtml(p); say(tmp.textContent); }
    }
    function phone(){ return !!(LS && LS.root && LS.root.classList.contains('ls-phone')); }

    if(window.ResizeObserver){
      var lastWH = '';
      new ResizeObserver(function(){ var k = Math.round(wrap.clientWidth) + 'x' + Math.round(wrap.clientHeight); if(k !== lastWH){ lastWH = k; if(!st.play) draw(); } }).observe(wrap);
    }

    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'pcalc-ls-stage fl-ls-stage'; stage.appendChild(host.querySelector('.fl-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'pcalc-ls-dock fl-ls-dock'; dock.appendChild(host.querySelector('.fl-ctl'));
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec pcalc-ls-why fl-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.fl-say'));
      s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var dd = document.createElement('div'); dd.className = 'ls-sec pcalc-ls-det fl-ls-det'; dd.appendChild(det);
      s.add('details', dd, o);
      lastCap = '';
      update(true);
      if(s.mode() === 'explore') s.hint({ target: H.sh, text: 'Drag: up and down for a, sideways for b', key: 'apprecalc-function-lab-drag' });
    }
    buildChips(); buildSlider(); update(true);
    return { pause: stopPlay, studio: studio };
  }

  /* ============================================================ test yourself */
  function figSize(w, h){
    var W = window.innerWidth || 1280, Hh = window.innerHeight || 800;
    if(W <= 640) return [340, Math.round(Math.max(260, Math.min(420, Hh * 0.62 - 90)))];
    if(W <= 999 && Hh <= 540) return [440, Math.round(Math.max(220, Math.min(300, Hh - 110)))];
    return [w, h];
  }
  function gFn(fam, p){ return function(x){ return FL.g(fam, p, x); }; }
  function figSpec(pr){
    var f = pr.fig, sz = figSize(560, 400), spec;
    if(f.grid){
      var xs = [f.from[0], f.to[0], 0], ys = [f.from[1], f.to[1], 0];
      var x0 = Math.min.apply(null, xs) - 2, x1 = Math.max.apply(null, xs) + 2, y0 = Math.min.apply(null, ys) - 2, y1 = Math.max.apply(null, ys) + 2;
      spec = { label: f.label, width: sz[0], height: sz[1], x: [Math.floor(x0), Math.ceil(x1)], y: [Math.floor(y0), Math.ceil(y1)], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
        points: [{ at: f.from, cls: 's1', label: 'on f (' + FL.n(f.from[0]) + ', ' + FL.n(f.from[1]) + ')' }] };
      return spec;
    }
    var p = f.p, c = [p.h, p.k], xr = [c[0] - 5, c[0] + 5], yr = [c[1] - 4, c[1] + 4];
    if(f.pts){ xr = [c[0] - 3, c[0] + 3]; yr = [c[1] - 3, c[1] + 3]; f.pts.forEach(function(q){ xr[0] = Math.min(xr[0], q[0] - 2); xr[1] = Math.max(xr[1], q[0] + 2); yr[0] = Math.min(yr[0], q[1] - 2); yr[1] = Math.max(yr[1], q[1] + 2); }); }
    xr = [Math.min(xr[0], -1), Math.max(xr[1], 1)]; yr = [Math.min(yr[0], -1), Math.max(yr[1], 1)];
    spec = { label: f.label, width: sz[0], height: sz[1], x: xr, y: yr, xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y', curves: [], points: [] };
    if(f.parentOnly){ spec.x = [-6, 6]; spec.y = [-6, 6]; spec.curves.push({ fn: gFn(f.fam, ID), cls: 's5', label: 'f' }); }
    else if(f.show){
      spec.curves.push({ fn: gFn(f.fam, p), cls: 's1', label: 'g', domain: f.fam === 'sqrt' ? [p.h, xr[1]] : null, ends: f.fam === 'sqrt' ? ['closed', null] : null });
      (f.pts || []).forEach(function(q){ spec.points.push({ at: q, cls: 's1', label: '(' + FL.n(q[0]) + ', ' + FL.n(q[1]) + ')' }); });
    }
    return spec;
  }
  var METHOD = {
    h: 'Find the corner (the vertex, or where the graph starts). Its x-coordinate is h: x − h is 0 there.',
    k: 'The corner\'s y-coordinate is k: + k lifts every output by k.',
    a: 'From the corner, go to the other point. Divide the change in height by how much the parent changes over the same run.',
    g: 'Put a, h and k into a·f(x − h) + k. Watch the sign inside: h = −2 gives x + 2.',
    x: 'Solve b(x − h) = (the old x) for x: divide by b, then add h.',
    y: 'The output is multiplied by a, then k is added.',
    in: 'Factor b out of the inside first, so it reads b(x − h). Then the dilation factor is 1/|b| and the shift is h.',
    out: 'Outside f, a multiplies the outputs (a < 0 also reflects over the x-axis), then k is added.',
    va: 'Where is the denominator 0 (and the numerator not)?',
    ha: 'As x grows, what does the fraction (or the power) go to? Add the constant.',
    right: 'Test a number a little bigger than the asymptote: the sign of the denominator and of the numerator give the sign.',
    end: 'Write end behavior in limit notation: lim as x → ∞ of g(x) = the value.',
    neg: 'For very negative x, 2^(x − h) is a tiny positive number.',
    zero: 'Set g(x) = 0, isolate the power of 2, then write both sides as powers of 2.'
  };
  function quiz(host, data){
    var fig = null, prob = null;
    T.drill(host, data, { slug: 'function-lab', noun: 'drill',
      types: FL.KINDS.map(function(k){ return { value: k, label: FL.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: FL.generate, title: function(p){ return p.title; },
      extra: function(el, p){
        prob = p;
        var box = document.createElement('div'); el.appendChild(box);
        fig = T.markedFigure(box, function(){ return figSpec(p); }, 'fl-figwrap');
      },
      method: function(s){ return METHOD[s.key]; },
      onTry: function(s, t){
        var p = prob, v = p.values;
        if(!fig) return false;
        if(p.type === 'pointMap'){ return T.tryOn(function(){ return fig; }, { x: { x: 1 }, pt: { y: v.to[0] } })(s, t); }
        if(p.type === 'identify'){
          if(s.key === 'g') return T.tryOn(function(){ return fig; }, { curve: { g: 1 } })(s, t);
          return T.tryOn(function(){ return fig; }, { x: { h: 1 }, y: { k: 1 } })(s, t);
        }
        if(p.type === 'describe'){
          var opt = t.ok || t.shown ? 0 : t.pick, picks = v.picks[s.key];
          if(opt == null || !picks) return false;
          // the option's parameters, drawn: inside options are whole (a = 1, k = 0);
          // outside ones keep the right inside part
          var mk = function(q, who){
            var full = s.key === 'in' ? q : { a: q.a, b: v.p.b * (q.b === -1 ? -1 : 1), h: v.p.h, k: q.k };
            return { curve: gFn(v.fam, full), who: who, label: who === 'yours' ? 'yours' : 'right' };
          };
          var marks = [];
          if(!t.ok && !t.shown) marks.push(mk(picks[opt], 'yours'));
          else { if(fig.lastD && fig.lastD[s.key]) marks.push(fig.lastD[s.key]); marks.push(mk(picks[0], 'right')); }
          if(!t.ok && !t.shown){ fig.lastD = fig.lastD || {}; fig.lastD[s.key] = marks[0]; }
          fig.marks.set(s.key, marks); fig.redraw();
          return true;
        }
        if(p.type === 'rational' || p.type === 'exponential'){
          var o = { x: { va: 1 }, y: { ha: 1 } };
          if(s.kind === 'num' && (s.key === 'zero')) o = { x: { zero: 1 } };
          var drew = T.tryOn(function(){ return fig; }, o)(s, t);
          if(s.kind === 'choice' && (t.ok || t.shown)){
            fig.marks.set(s.key, [{ curve: gFn(p.type === 'rational' ? 'reciprocal' : 'exponential', v.p), who: 'right', label: 'g' }]);
            fig.redraw(); return 'The graph of g is drawn: check your answer against it.';
          }
          return drew;
        }
        return false;
      } });
  }
})();
