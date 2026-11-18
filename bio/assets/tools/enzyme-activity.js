/* Enzyme activity, tools v2 (docs/tools-v2-enzyme-activity-brief.md; the standard: docs/tools-v2-standard.md), on the
   shared kit (assets/course/tool-kit2.js) through the course adapter ApBioTools.studioKit2.
   The model is ApBioMath.enzyme (bio-tool-math.js): rate() for the rate, states() for which molecules are drawn in
   which state. The enzymes, ranges, questions and the mini FRQ are data (bio/data/tools/enzyme-activity.json).

   THE ONE IDEA: an enzyme only works when substrate reaches an active site that still has its shape, so anything
   that changes how often they meet, or the shape of the site, changes the rate.

   EXPLORE (free play, nothing graded, no side panel): four big tabs, one idea and one main control each, on one
   drawn scene of enzyme molecules in solution.
     1 Substrate     more substrate fills more active sites, until every site is busy (saturation)
     2 Temperature   warmer molecules collide more often, until the heat unfolds the enzyme (denaturation)
     3 pH            away from the best pH the charges in the active site change and substrate binds poorly
     4 Inhibitor     a competitive inhibitor sits in the active site; a noncompetitive one binds elsewhere and bends
                     it. A quiet second knob (substrate) shows which of the two more substrate can overcome.
   The picture answers at once: substrate drifts in, docks in an active site, the site closes on it and two products
   leave; substrate bounces off a site that is blocked, bent or unfolded. The "Reaction rate" bar is the model's
   rate; the reactions drawn come at that same pace. The line under the picture is the CAUSE LINE (K.cause).
   A denatured enzyme does not refold: when the setting goes back, the unfolded ones fade and new enzyme comes in.
   A tab never moves another tab's control.
   TEST YOURSELF: "Predict, then change" (the old Predict mode: a seeded change, rate up, down or the same, recorded
   as enzyme-activity:predict-<change>:dir as before) on the same picture, and the inhibitor data questions with
   the mini FRQ. "?": the numbers behind this setting, the rate curve for this tab's control and its table.
   One colour per idea: enzyme blue, substrate amber, product green, inhibitor purple, red for denatured only.
   Reduced motion or Pause: a still picture with every state drawn, and a short cross fade on a change. */
(function(){
  'use strict';
  var SLUG = 'enzyme-activity';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T || !M) return;
  var NS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2;
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function n1(v){ return (+v).toFixed(1); }
  function ss(a, b, x){ x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function sv(tag, cls){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); return e; }
  function smooth(pts, open){
    var n = pts.length, d = 'M' + n1(pts[0][0]) + ' ' + n1(pts[0][1]), at = function(i){ return open ? pts[clamp(i, 0, n - 1)] : pts[(i + n) % n]; };
    for(var i = 0; i < (open ? n - 1 : n); i++){
      var p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      d += 'C' + n1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + n1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + n1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + n1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + n1(p2[0]) + ' ' + n1(p2[1]);
    }
    return d + (open ? '' : 'Z');
  }
  function rng(seed){ var sd = seed | 0; return function(){ sd = (sd + 0x6D2B79F5) | 0; var t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ------------------------------------------------------------ the enzyme's shape (unit radius, pocket at +x)
     A lumpy globular protein with one pocket, the active site, cut to the substrate's round head. hug (0 to 1):
     the site closed on a bound substrate (induced fit). pinch (0 to 1): the site out of shape (wrong pH, or an
     inhibitor bound elsewhere): shallow, skewed and too narrow for the head. */
  function cup(hug, pinch){ var rc = 0.215 - 0.022 * hug - 0.075 * pinch; return { cx: 0.5 + 0.14 * pinch, cy: 0.1 * pinch, rc: rc, hw: rc + 0.04 - 0.02 * hug, sq: 1 - 0.35 * pinch }; }
  function cupPts(c){ var a = [[0.8, -c.hw + c.cy * 0.5]]; for(var j = 0; j <= 10; j++){ var q = -Math.PI / 2 - j * Math.PI / 10; a.push([c.cx + Math.cos(q) * c.rc, c.cy + Math.sin(q) * c.rc * c.sq]); } a.push([0.8, c.hw + c.cy * 0.5]); return a; }
  function bodyPts(seed, hug, pinch){
    var g = 0.4 - 0.07 * hug - 0.13 * pinch, n = 40, pts = [];
    for(var k = 0; k <= n; k++){
      var th = g + (TAU - 2 * g) * k / n, edge = Math.min(1, Math.min(th - g, TAU - g - th) / 0.6);
      var r = 1 + edge * (0.05 * Math.sin(3 * th + seed) + 0.035 * Math.sin(5 * th + seed * 1.7) + 0.02 * Math.sin(7 * th + seed * 2.3));
      pts.push([Math.cos(th) * r, Math.sin(th) * r]);
    }
    return pts.concat(cupPts(cup(hug, pinch)));
  }
  /* The unfolded chain (denatured): the same polypeptide, from a tight coil (u = 0) to a loose strand (u = 1). */
  function chainPts(seed, u, ph){
    var pts = [], n = 46;
    for(var j = 0; j <= n; j++){
      var f = j / n, a = j * 0.62 + seed, rad = 0.18 + 0.62 * Math.sqrt(f);
      var cx = Math.cos(a) * rad, cy = Math.sin(a) * rad;
      var lx = (f - 0.5) * 2.15 + 0.16 * Math.sin(j * 0.55 + seed), ly = 0.4 * Math.sin(j * 0.8 + ph + seed) + 0.22 * Math.sin(j * 0.31 + ph * 0.7);
      pts.push([cx + (lx - cx) * u, cy + (ly - cy) * u]);
    }
    return pts;
  }
  var ANG = [-0.62, 0.5, 2.5, -2.35, 0.15, 3.6, -1.05, 2.0];
  var PERM = [2, 5, 0, 7, 3, 6, 1, 4], PERM2 = [4, 1, 6, 2, 7, 0, 5, 3];   // which molecules change first: spread over the picture

  function boot(){
    var K = window.LevlKit2;
    T.mount(SLUG, function(app, data, ctx){
      var esc = T.esc, F = T.F, EX = data.explore, RU = data.rateUnit, SU = data.substrate.unit, IU = data.inhibitor.unit;
      function profById(id){ return data.profiles.filter(function(p){ return p.id === id; })[0]; }
      var PA = profById(EX.profile), FX = EX.fixed;
      var TABS = EX.tabs;
      var S = { tab: TABS[0].id, sub: EX.substrate.value, temp: EX.temperature.value, ph: EX.pH.value, inh: EX.inhibitor.value, itype: 'competitive', isub: EX.inhSubstrate.value, mode: 'explore', part: null };
      var prev = null, gest = false, paused = false;
      function tabOf(id){ return TABS.filter(function(t){ return t.id === id; })[0]; }
      function condOf(tab){
        if(tab === 'sub') return { S: S.sub, T: FX.T, pH: FX.pH, inhibitor: 'none', I: 0 };
        if(tab === 'temp') return { S: FX.S, T: S.temp, pH: FX.pH, inhibitor: 'none', I: 0 };
        if(tab === 'ph') return { S: FX.S, T: FX.T, pH: S.ph, inhibitor: 'none', I: 0 };
        return { S: S.isub, T: FX.T, pH: FX.pH, inhibitor: S.inh > 0 ? S.itype : 'none', I: S.inh };
      }
      /* The top of this screen's rate bar: the best rate this tab's control can reach. */
      function refOf(tab){
        var c = condOf(tab);
        if(tab === 'temp') return M.enzyme.rate(PA, Object.assign({}, c, { T: M.enzyme.optimumT(PA) }), c.S);
        if(tab === 'ph') return M.enzyme.rate(PA, Object.assign({}, c, { pH: M.enzyme.optimumPH(PA) }), c.S);
        return M.enzyme.params(PA, Object.assign({}, c, { inhibitor: 'none' })).vmax;
      }
      function rateOf(p, c){ return M.enzyme.rate(p, c, c.S); }

      // The page's own blocks (the adapter moves them): About, the questions and the mini FRQ.
      app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
        '<section class="bt-card" aria-labelledby="ez-q"><h2 id="ez-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'ez2';
      var tabs = K.tabs({ label: 'What to change', items: TABS.map(function(t){ return { value: t.id, label: t.tab, short: t.short }; }), value: S.tab, big: true, onChange: function(v){ setTab(v); } });
      stage.appendChild(tabs.el);
      var head = K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'ez2-scene'; sceneBox.id = T.nid('ez2');
      sceneBox.innerHTML = '<svg class="ez2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><defs></defs><g class="ez2-static"></g><g class="ez2-dyn"><g class="ez2-enzs"></g><g class="ez2-parts"></g></g><g class="ez2-over"><g class="ez2-gauge"></g><g class="ez2-labels"></g><g class="ez2-marks"></g></g></svg>';
      stage.appendChild(sceneBox);
      tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
      var svg = sceneBox.querySelector('svg'), gDefs = svg.querySelector('defs'), gStatic = svg.querySelector('.ez2-static'), gDyn = svg.querySelector('.ez2-dyn'), gEnz = svg.querySelector('.ez2-enzs'), gParts = svg.querySelector('.ez2-parts'),
        gGauge = svg.querySelector('.ez2-gauge'), gLabels = svg.querySelector('.ez2-labels'), gMarks = svg.querySelector('.ez2-marks'), layer = K.layer(sceneBox), G = null;
      var lines = document.createElement('div'); lines.className = 'ez2-lines';
      var cause = K.cause({ label: 'Why' });
      var pauseBtn = document.createElement('button'); pauseBtn.type = 'button'; pauseBtn.className = 'tk2-play is-sm ez2-pause';
      function paintPause(){ pauseBtn.innerHTML = '<svg class="tk2-i" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (paused ? '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>' : '<path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none"/>') + '</svg><span>' + (paused ? 'Play' : 'Pause') + '</span>'; pauseBtn.setAttribute('aria-pressed', String(paused)); }
      pauseBtn.addEventListener('click', function(){ paused = !paused; paintPause(); if(paused){ stopLoop(); } else { startLoop(); } });
      paintPause();
      lines.appendChild(cause.el); lines.appendChild(pauseBtn);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }
      function still(){ return K.reduced() || paused || !window.requestAnimationFrame; }

      /* ---- the controls, on the picture: one main knob per tab, and the quiet substrate knob of the inhibitor tab */
      function began(){ if(gest) return; gest = true; prev = { tab: S.tab, v: valOf(S.tab) }; }
      function valOf(tab){ return tab === 'sub' ? S.sub : tab === 'temp' ? S.temp : tab === 'ph' ? S.ph : S.inh; }
      function knob(o){
        return K.drag(layer, { key: 'apbio-enzyme-' + o.id, label: o.label, min: o.r.min || 0, max: o.r.max, step: o.r.step, value: o.get(), track: [0, 0, 1, 0], chip: false, quiet: o.quiet,
          valuetext: function(v){ return o.text(v) + '. ' + rateSay(); }, tag: o.tag,
          onInput: function(v){ if(!o.quiet) began(); o.set(v); changed(); tourDid('drag'); },
          onEnd: function(){ gest = false; say(cause.text()); refHtml(); } });
      }
      var CT = {
        sub: knob({ id: 'sub', label: 'Substrate concentration', r: EX.substrate, get: function(){ return S.sub; }, set: function(v){ S.sub = v; }, text: function(v){ return F(v, 1) + ' millimolar substrate'; }, tag: function(v){ return F(v, 1) + ' ' + SU; } }),
        temp: knob({ id: 'temp', label: 'Temperature', r: EX.temperature, get: function(){ return S.temp; }, set: function(v){ S.temp = v; }, text: function(v){ return F(v, 0) + ' degrees Celsius'; }, tag: function(v){ return F(v, 0) + ' °C'; } }),
        ph: knob({ id: 'ph', label: 'pH of the solution', r: EX.pH, get: function(){ return S.ph; }, set: function(v){ S.ph = v; }, text: function(v){ return 'pH ' + F(v, 1); }, tag: function(v){ return 'pH ' + F(v, 1); } }),
        inh: knob({ id: 'inh', label: 'Inhibitor concentration', r: EX.inhibitor, get: function(){ return S.inh; }, set: function(v){ S.inh = v; }, text: function(v){ return F(v, 2) + ' millimolar ' + S.itype + ' inhibitor'; }, tag: function(v){ return F(v, 2) + ' ' + IU; } })
      };
      var cSub2 = knob({ id: 'isub', quiet: true, label: 'Substrate concentration, with the inhibitor present', r: EX.inhSubstrate, get: function(){ return S.isub; }, set: function(v){ S.isub = v; }, text: function(v){ return F(v, 1) + ' millimolar substrate'; }, tag: function(){ return ''; } });
      var typeBox = document.createElement('div'); typeBox.className = 'ez2-type'; typeBox.setAttribute('role', 'group'); typeBox.setAttribute('aria-label', 'Kind of inhibitor');
      typeBox.innerHTML = data.inhibitors.filter(function(x){ return x.id !== 'none'; }).map(function(x){ return '<button type="button" data-t="' + x.id + '" aria-pressed="' + (x.id === S.itype) + '">' + esc(x.name.replace(/ inhibitor$/, '')) + '</button>'; }).join('');
      layer.el.appendChild(typeBox);
      typeBox.addEventListener('click', function(e){
        var b = e.target.closest('button'); if(!b || b.getAttribute('data-t') === S.itype) return;
        S.itype = b.getAttribute('data-t');
        typeBox.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        swap(); say(cause.text()); refHtml();
      });
      var cue = K.cue(layer, { key: 'apbio-enzyme', text: 'Drag the substrate', side: 'right', at: function(){ return G ? [G.tx0 + (G.tx1 - G.tx0) * (S.sub / EX.substrate.max), G.ty] : [0, 0]; } });
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      stage.addEventListener('pointerdown', function(){ hideCue(true); }, true);
      stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End|Enter| )/.test(e.key)) hideCue(true); }, true);
      var tour = K.tour({ key: 'apbio-enzyme', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag the knob. The enzymes and the rate change at once.', target: function(){ return CT[S.tab].el.querySelector('.tk2-knob'); } },
        { id: 'read', text: 'Read why on the line below the picture.', target: function(){ return cause.el; } },
        { id: 'tab', text: 'Pick another tab to change something else.', target: function(){ return tabs.el.querySelectorAll('.tk2-tab')[1]; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---------------------------------------------------- the scene
         Enzyme molecules in solution, each one drawn large with its active site; free substrate, inhibitor and
         product drift between them. now = { prof, c, ref, show } is what to draw: roles() decides from the model
         which molecules are unfolded, out of shape or carrying an inhibitor; reactions happen at the model's rate. */
      var ENZ = [], PARTS = [], PRODS = [], now = null, raf = 0, lastTs = 0, clock = 0, acc = 0, accB = 0, rot = 0, rotT = 0, gShown = 0, rnd = rng(20261118), uidp = 0;
      function tnow(){ return window.performance ? performance.now() : Date.now(); }
      function speedF(){ return now ? clamp(0.3 + 0.7 * now.c.T / 37, 0.3, 1.9) : 1; }
      function bounds(){ var m = G.R * 0.4; return { x0: 6 + m, y0: G.top + m, x1: G.W - 6 - m, y1: G.y1 - 6 - m }; }
      function local(e, x, y){ var c = Math.cos(e.ang), s = Math.sin(e.ang), R = G.R; return [(x * c - y * s) * R, (x * s + y * c) * R]; }
      function world(e, x, y){ var p = local(e, x, y); return [e.x + p[0], e.y + p[1]]; }
      function buildEnzymes(){
        gEnz.innerHTML = ''; ENZ = [];
        for(var i = 0; i < G.N; i++){
          var col = i % G.cols, row = Math.floor(i / G.cols), r2 = rng(77 + i * 13);
          var e = { i: i, ang: ANG[i % ANG.length], seed: 1.3 + i * 2.1, q: (PERM.filter(function(v){ return v < G.N; }).indexOf(i) + 0.5) / G.N, qi: (PERM2.filter(function(v){ return v < G.N; }).indexOf(i) + 0.5) / G.N,
            x: G.cx0 + G.cw * (col + 0.5) + (r2() - 0.5) * G.cw * 0.1, y: G.cy0 + G.ch * row + G.lh + (G.ch - G.lh) / 2 + (r2() - 0.5) * 4,
            fold: 1, den: false, fade: 1, repl: 0, pinch: 0, hug: 0, sub: null, inh: null, want: 'ok', newUntil: 0, ph: r2() * TAU, key: '', cool: 0 };
          var g = sv('g', 'ez2-e'); g.setAttribute('data-i', i);
          g.innerHTML = '<ellipse class="ez2-sh"/><g class="ez2-fold"><path class="ez2-body"/><path class="ez2-hx"/><path class="ez2-sheen"/><path class="ez2-site"/><path class="ez2-allo"/>' +
            '<g class="ez2-chg is-pos"><circle/><text>+</text></g><g class="ez2-chg is-neg"><circle/><text>−</text></g></g><g class="ez2-tangle"><path class="ez2-chain-e"/><path class="ez2-chain"/></g>';
          gEnz.appendChild(g); e.g = g; e.el = { sh: g.querySelector('.ez2-sh'), fold: g.querySelector('.ez2-fold'), body: g.querySelector('.ez2-body'), hx: g.querySelector('.ez2-hx'), sheen: g.querySelector('.ez2-sheen'), site: g.querySelector('.ez2-site'),
            allo: g.querySelector('.ez2-allo'), pos: g.querySelector('.ez2-chg.is-pos'), neg: g.querySelector('.ez2-chg.is-neg'), tangle: g.querySelector('.ez2-tangle'), ce: g.querySelector('.ez2-chain-e'), cc: g.querySelector('.ez2-chain') };
          // the parts that never change: shadow, helices inside, a sheen, the second (allosteric) site on the back, the two charged groups
          var R = G.R, hx = '';
          [[-0.5, -0.38, 0.5], [-0.42, 0.34, -0.35], [0.02, 0.66, 0.1]].forEach(function(h){
            for(var k = 0; k <= 14; k++){ var u = k / 14, lx = h[0] + (u - 0.5) * 0.62 * Math.cos(h[2]) - Math.sin(u * Math.PI * 5) * 0.06 * Math.sin(h[2]), ly = h[1] + (u - 0.5) * 0.62 * Math.sin(h[2]) + Math.sin(u * Math.PI * 5) * 0.06 * Math.cos(h[2]), p = local(e, lx, ly); hx += (k ? 'L' : 'M') + n1(p[0]) + ' ' + n1(p[1]); }
          });
          e.el.hx.setAttribute('d', hx);
          e.el.sh.setAttribute('cx', n1(R * 0.03)); e.el.sh.setAttribute('cy', n1(R * 0.1)); e.el.sh.setAttribute('rx', n1(R * 1.02)); e.el.sh.setAttribute('ry', n1(R * 0.98));
          e.el.sheen.setAttribute('d', 'M' + n1(-R * 0.72) + ' ' + n1(-R * 0.3) + 'A' + n1(R * 0.8) + ' ' + n1(R * 0.8) + ' 0 0 1 ' + n1(-R * 0.25) + ' ' + n1(-R * 0.74));
          var a0 = local(e, -0.97, -0.17), a1 = local(e, -0.86, 0), a2 = local(e, -0.97, 0.17);
          e.el.allo.setAttribute('d', 'M' + n1(a0[0]) + ' ' + n1(a0[1]) + 'Q' + n1(a1[0]) + ' ' + n1(a1[1]) + ' ' + n1(a2[0]) + ' ' + n1(a2[1]));
          [[e.el.pos, -1], [e.el.neg, 1]].forEach(function(m){ var p = local(e, 0.56, m[1] * 0.47), c = m[0].firstChild, t = m[0].lastChild, r = Math.max(5.5, R * 0.12); c.setAttribute('cx', n1(p[0])); c.setAttribute('cy', n1(p[1])); c.setAttribute('r', n1(r)); t.setAttribute('x', n1(p[0])); t.setAttribute('y', n1(p[1] + r * 0.55)); t.setAttribute('style', 'font-size:' + n1(r * 1.7) + 'px'); });
          ENZ.push(e);
        }
      }
      function defs(){
        var R = G.R, hr = 0.15 * R, tr = 0.19 * R, hx = -0.17 * R, tx = 0.15 * R, hex = '', spike;
        for(var k = 0; k < 6; k++){ var q = k / 6 * TAU; hex += (k ? 'L' : 'M') + n1(Math.cos(q) * 0.2 * R) + ' ' + n1(Math.sin(q) * 0.2 * R); }
        spike = 'M' + n1(tx - tr * 0.9) + ' 0L' + n1(tx + tr * 0.1) + ' ' + n1(-tr * 1.25) + 'L' + n1(tx + tr * 1.25) + ' 0L' + n1(tx + tr * 0.1) + ' ' + n1(tr * 1.25) + 'Z';
        var tail = '<rect x="' + n1(tx - tr) + '" y="' + n1(-tr) + '" width="' + n1(2 * tr) + '" height="' + n1(2 * tr) + '" rx="' + n1(tr * 0.42) + '"/>', headc = '<circle cx="' + n1(hx) + '" r="' + n1(hr) + '"/>';
        gDefs.innerHTML = '<linearGradient id="ez2g-liq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ez2s-liq0"/><stop offset="1" class="ez2s-liq1"/></linearGradient>' +
          '<radialGradient id="ez2g-vig" cx=".5" cy=".45" r=".75"><stop offset=".55" class="ez2s-vig0"/><stop offset="1" class="ez2s-vig1"/></radialGradient>' +
          '<linearGradient id="ez2g-bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ez2s-bn0"/><stop offset="1" class="ez2s-bn1"/></linearGradient>' +
          '<radialGradient id="ez2g-enz" cx=".36" cy=".3" r=".85"><stop offset="0" class="ez2s-en0"/><stop offset=".55" class="ez2s-en1"/><stop offset="1" class="ez2s-en2"/></radialGradient>' +
          '<radialGradient id="ez2g-sub" cx=".35" cy=".3" r=".9"><stop offset="0" class="ez2s-su0"/><stop offset="1" class="ez2s-su1"/></radialGradient>' +
          '<radialGradient id="ez2g-prod" cx=".35" cy=".3" r=".9"><stop offset="0" class="ez2s-pr0"/><stop offset="1" class="ez2s-pr1"/></radialGradient>' +
          '<radialGradient id="ez2g-inh" cx=".35" cy=".3" r=".9"><stop offset="0" class="ez2s-in0"/><stop offset="1" class="ez2s-in1"/></radialGradient>' +
          '<g id="ez2-sub" class="ez2-p-sub"><path class="ez2-bond" d="M' + n1(hx) + ' 0H' + n1(tx) + '"/>' + tail + headc + '</g>' +
          '<g id="ez2-ph" class="ez2-p-prod">' + headc + '</g><g id="ez2-pt" class="ez2-p-prod">' + tail + '</g>' +
          '<g id="ez2-comp" class="ez2-p-inh"><path d="' + spike + '"/>' + headc + '</g>' +
          '<g id="ez2-non" class="ez2-p-inh"><path d="' + hex + 'Z"/><circle class="ez2-p-dot" r="' + n1(0.065 * R) + '"/></g>';
      }
      function addPart(kind, edge){
        var b = bounds(), p = { id: ++uidp, kind: kind, mode: 'free', x: 0, y: 0, vx: 0, vy: 0, rot: rnd() * TAU, vr: (rnd() - 0.5) * 2, op: edge ? 0 : 1, e: null, t: 0 };
        place(p, edge);
        var u = sv('use', 'ez2-part'); u.setAttribute('href', '#ez2-' + (kind === 'sub' ? 'sub' : kind === 'competitive' ? 'comp' : 'non')); gParts.appendChild(u); p.node = u;
        PARTS.push(p); return p;
      }
      function clearOfEnzymes(x, y){ return ENZ.every(function(e){ var dx = x - e.x, dy = y - e.y; return dx * dx + dy * dy > G.R * G.R * 1.7; }); }
      function place(p, edge){
        var b = bounds(), m = 2;
        for(var k = 0; k < 30; k++){
          if(edge){ var side = Math.floor(rnd() * 4), f = rnd(); p.x = side === 0 ? b.x0 + m : side === 1 ? b.x1 - m : b.x0 + m + f * (b.x1 - b.x0 - 2 * m); p.y = side === 2 ? b.y0 + m : side === 3 ? b.y1 - m : b.y0 + m + f * (b.y1 - b.y0 - 2 * m); }
          else { p.x = b.x0 + m + rnd() * (b.x1 - b.x0 - 2 * m); p.y = b.y0 + m + rnd() * (b.y1 - b.y0 - 2 * m); }
          if(clearOfEnzymes(p.x, p.y)) break;
        }
        var a = Math.atan2((b.y0 + b.y1) / 2 - p.y, (b.x0 + b.x1) / 2 - p.x) + (rnd() - 0.5) * 1.6; p.vx = Math.cos(a); p.vy = Math.sin(a);
      }
      function dropPart(p){ if(p.e){ if(p.e.sub === p) p.e.sub = null; if(p.e.inh === p) p.e.inh = null; } if(p.node.parentNode) p.node.parentNode.removeChild(p.node); var i = PARTS.indexOf(p); if(i >= 0) PARTS.splice(i, 1); }
      function ofKind(k){ return PARTS.filter(function(p){ return k === 'inh' ? p.kind !== 'sub' : p.kind === k; }); }
      /* How many of each to draw: substrate by its concentration; inhibitor by its own, and always enough to bind. */
      function counts(){
        var c = now.c, nS = c.S > 0 ? Math.max(1, Math.round(Math.pow(c.S / data.substrate.max, 0.75) * G.nMax)) : 0, nI = c.inhibitor !== 'none' && c.I > 0 ? Math.max(2, Math.round(c.I / data.inhibitor.max * G.nMax * 0.4)) : 0;
        return { sub: nS, inh: nI };
      }
      function setCount(kind, n, instant){
        var have = ofKind(kind === 'sub' ? 'sub' : 'inh').filter(function(p){ return p.mode !== 'out'; });
        if(kind !== 'sub') have.filter(function(p){ return p.kind !== now.c.inhibitor; }).forEach(function(p){ dropPart(p); });
        have = ofKind(kind === 'sub' ? 'sub' : 'inh').filter(function(p){ return p.mode !== 'out'; });
        while(have.length < n) have.push(addPart(kind === 'sub' ? 'sub' : now.c.inhibitor, !instant));
        var extra = have.length - n, free = have.filter(function(p){ return p.mode === 'free'; }).concat(have.filter(function(p){ return p.mode !== 'free'; }));
        for(var i = 0; i < extra; i++){ var p = free[i]; if(instant) dropPart(p); else { if(p.e){ if(p.e.sub === p) p.e.sub = null; if(p.e.inh === p) p.e.inh = null; p.e = null; } p.mode = 'out'; } }
      }
      /* What each molecule should be, from the model: the top share by q unfolds (heat, or a pH far from the best),
         then the share whose site has the wrong charges; of the rest, a share carries an inhibitor (it changes
         hands every few seconds, as binding does). */
      function roles(){
        var z = M.enzyme.states(now.prof, now.c), d = Math.abs(now.c.pH - M.enzyme.optimumPH(now.prof)), denPH = Math.min(1 - z.phOk, clamp((d - 3) / 2, 0, 1));
        var dT = clamp((1 - z.folded - 0.25) / 0.6, 0, 1), D = 1 - (1 - dT) * (1 - denPH), fi = now.c.inhibitor === 'competitive' ? z.inhibitor : z.allosteric;
        now.z = z; now.D = D; now.dT = dT; now.acid = now.c.pH < M.enzyme.optimumPH(now.prof);
        ENZ.forEach(function(e){
          var qi = (e.qi + rot) % 1;
          e.want = e.q > 1 - D + 1e-9 ? 'den' : e.q > z.phOk + 1e-9 ? 'mis' : (now.c.inhibitor !== 'none' && now.c.I > 0 && qi < fi) ? 'inh' : 'ok';
        });
      }
      function release(e, what){
        if((!what || what === 'sub') && e.sub){ var p = e.sub; e.sub = null; p.e = null; if(p.mode !== 'out'){ p.mode = 'free'; var a = e.ang + (rnd() - 0.5); p.vx = Math.cos(a); p.vy = Math.sin(a); } }
        if((!what || what === 'inh') && e.inh){ var q = e.inh; e.inh = null; q.e = null; if(q.mode !== 'out'){ q.mode = 'free'; var b = e.ang + (q.kind === 'competitive' ? 0 : Math.PI) + (rnd() - 0.5); q.vx = Math.cos(b); q.vy = Math.sin(b); } }
      }
      function working(e){ return !e.den && !e.repl && e.fold > 0.95 && e.want === 'ok' && !e.inh && e.pinch < 0.1; }
      function dockPt(e, kind){ return kind === 'non' || kind === 'noncompetitive' ? world(e, -1.02, 0) : world(e, 0.67, 0); }
      function nearest(list, x, y, e){
        var best = null, bd = 1e12;
        list.forEach(function(p){ var dx = p.x - x, dy = p.y - y, d = dx * dx + dy * dy; if(e){ var bx = p.x - e.x, by = p.y - e.y; if(bx * (x - e.x) + by * (y - e.y) < 0) d += 9 * G.R * G.R; } if(d < bd){ bd = d; best = p; } });
        return best;
      }
      function send(p, e, mode){ p.mode = mode; p.e = e; p.t = 0; p.x0 = p.x; p.y0 = p.y; p.r0 = p.rot; var a = mode === 'toInh' && p.kind !== 'competitive' ? world(e, -1.5, 0) : world(e, 1.4, 0); p.ax = a[0]; p.ay = a[1]; p.d1 = clamp(Math.hypot(a[0] - p.x, a[1] - p.y) / (G.R * 3.2 * speedF()), 0.16, 0.9); }
      function spawnProducts(e){
        [['ph', 0.5, -1], ['pt', 0.82, 1]].forEach(function(o){
          var w = world(e, o[1], 0), a = e.ang + o[2] * (0.35 + rnd() * 0.5), u = sv('use', 'ez2-part'); u.setAttribute('href', '#ez2-' + o[0]); gParts.appendChild(u);
          PRODS.push({ x: w[0], y: w[1], vx: Math.cos(a) * G.R * 1.5, vy: Math.sin(a) * G.R * 1.5, rot: e.ang, vr: o[2] * 2.2, life: 1.5, node: u });
        });
      }
      /* One step of the scene. */
      function step(dt){
        var b = bounds(), R = G.R, sp = R * (0.22 + 1.05 * clamp(now.c.T / 70, 0, 1.3)), sf = speedF(), tn = tnow();
        clock += dt;
        // the inhibitor changes hands
        var fi = now.z ? (now.c.inhibitor === 'competitive' ? now.z.inhibitor : now.z.allosteric) : 0;
        if(fi > 0.02 && fi < 0.98){ rotT += dt; if(rotT > 2.8){ rotT = 0; rot = (rot + 1 / G.N) % 1; roles(); } }
        ENZ.forEach(function(e){
          e.ph += dt * (1 + 2.2 * (1 - e.fold)); if(e.cool > 0) e.cool -= dt;
          if(e.want === 'den' && !e.den){ e.den = true; release(e); }
          if(e.den && e.want !== 'den' && !e.repl){ e.repl = 1; release(e); }   // a denatured enzyme does not refold: it goes, and a new one comes in
          if(e.repl === 1){ e.fade = Math.max(0, e.fade - dt / 0.45); if(e.fade <= 0){ e.repl = 2; e.den = false; e.fold = 1; e.pinch = 0; e.hug = 0; e.newUntil = tn + 2600; } }
          else if(e.repl === 2){ e.fade = Math.min(1, e.fade + dt / 0.45); if(e.fade >= 1) e.repl = 0; }
          var ft = e.den ? 0 : 1; if(e.fold !== ft) e.fold = ft > e.fold ? 1 : Math.max(0, e.fold - dt / 0.8);
          if(e.want !== 'inh' && e.inh) release(e, 'inh');
          var inhOn = e.inh && e.inh.mode === 'docked';
          if(e.want === 'inh' && !e.inh && !e.den && !e.repl && !e.sub){ var fr = ofKind('inh').filter(function(p){ return p.mode === 'free' && p.op > 0.6; }), d = dockPt(e, now.c.inhibitor), p = nearest(fr, d[0], d[1]); if(p){ e.inh = p; send(p, e, 'toInh'); } }
          if(e.want !== 'ok' && e.sub && e.sub.mode !== 'cat') release(e, 'sub');
          var pt = e.den || e.repl ? 0 : e.want === 'mis' ? 1 : (inhOn && e.inh.kind === 'noncompetitive') ? 1 : 0;
          if(e.pinch !== pt) e.pinch = pt > e.pinch ? Math.min(pt, e.pinch + dt / 0.35) : Math.max(pt, e.pinch - dt / 0.35);
          var ht = e.sub && (e.sub.mode === 'cat') ? 1 : 0;
          if(e.hug !== ht) e.hug = ht > e.hug ? Math.min(1, e.hug + dt / 0.12) : Math.max(0, e.hug - dt / 0.2);
        });
        // reactions, at the model's rate: every working enzyme busy back to back is the enzyme's own top rate
        var rf = now.rate / now.prof.Vmax, free = ofKind('sub').filter(function(p){ return p.mode === 'free' && p.op > 0.6; });
        acc = Math.min(1.5, acc + rf * G.N / 0.78 * dt);
        while(acc >= 1){
          var ok = ENZ.filter(function(e){ return working(e) && !e.sub && e.cool <= 0; });
          if(!ok.length || !free.length){ acc = Math.min(acc, 1); break; }
          acc -= 1;
          var e1 = ok[Math.floor(rnd() * ok.length)], m = world(e1, 1.4, 0), s1 = nearest(free, m[0], m[1], e1);
          free.splice(free.indexOf(s1), 1); e1.sub = s1; send(s1, e1, 'fly');
        }
        // substrate that meets a site it cannot use bounces off
        var bad = ENZ.filter(function(e){ return !e.repl && !working(e) && !e.sub && (e.den ? e.fold < 0.3 : true) && (e.want !== 'inh' || (e.inh && e.inh.mode === 'docked')); });
        accB = Math.min(1.2, accB + bad.length * 0.55 * sf * Math.min(1, free.length / 4) * dt);
        if(accB >= 1 && bad.length && free.length){ accB -= 1; var e2 = bad[Math.floor(rnd() * bad.length)], m2 = world(e2, 1.4, 0), s2 = nearest(free, m2[0], m2[1], e2); if(s2 && Math.hypot(s2.x - m2[0], s2.y - m2[1]) < R * 5){ send(s2, e2, 'try'); } }
        PARTS.slice().forEach(function(p){
          var e = p.e;
          if(p.mode === 'out'){ p.op -= dt / 0.3; if(p.op <= 0){ dropPart(p); return; } }
          else if(p.op < 1) p.op = Math.min(1, p.op + dt / 0.35);
          if(p.mode === 'free' || p.mode === 'out'){
            p.vx += (rnd() - 0.5) * 5 * dt; p.vy += (rnd() - 0.5) * 5 * dt;
            var mm = Math.hypot(p.vx, p.vy) || 1; p.vx /= mm; p.vy /= mm;
            p.x += p.vx * sp * dt; p.y += p.vy * sp * dt; p.rot += p.vr * dt * (0.4 + sf);
            ENZ.forEach(function(z){ var rr = (z.fold < 0.5 ? 0.55 : 1.16) * R, dx = p.x - z.x, dy = p.y - z.y, d2 = dx * dx + dy * dy; if(d2 < rr * rr && z.fade > 0.5){ var dd = Math.sqrt(d2) || 1; p.x = z.x + dx / dd * rr; p.y = z.y + dy / dd * rr; var dot = p.vx * dx / dd + p.vy * dy / dd; if(dot < 0){ p.vx -= 2 * dot * dx / dd; p.vy -= 2 * dot * dy / dd; } } });
          } else if(p.mode === 'fly' || p.mode === 'toInh' || p.mode === 'try'){
            if(!e || e.repl || (p.mode !== 'try' && e.den)){ if(e) release(e, p.kind === 'sub' ? 'sub' : 'inh'); p.mode = 'free'; p.e = null; return; }
            p.t += dt;
            var ta = p.mode === 'toInh' && p.kind !== 'competitive' ? e.ang + Math.PI : e.ang, k1 = Math.min(1, p.t / p.d1), ez = k1 * k1 * (3 - 2 * k1);
            var dr = ((ta - p.r0) % TAU + TAU + Math.PI) % TAU - Math.PI;
            if(k1 < 1){ p.x = p.x0 + (p.ax - p.x0) * ez; p.y = p.y0 + (p.ay - p.y0) * ez; p.rot = p.r0 + dr * ez; }
            else if(p.mode === 'try'){
              // up to the mouth, then off again: it does not fit
              var k3 = Math.min(1, (p.t - p.d1) / 0.3), tip = world(e, e.fold < 0.5 ? 0.9 : 1.13, 0), g2 = k3 < 0.5 ? k3 * 2 : 2 - k3 * 2;
              p.x = p.ax + (tip[0] - p.ax) * g2; p.y = p.ay + (tip[1] - p.ay) * g2; p.rot = ta + Math.sin(k3 * 20) * 0.12;
              if(k3 >= 1){ p.mode = 'free'; p.e = null; var ba = e.ang + (rnd() - 0.5) * 1.4; p.vx = Math.cos(ba); p.vy = Math.sin(ba); }
            } else {
              var k2 = Math.min(1, (p.t - p.d1) / 0.16), dk = dockPt(e, p.kind);
              p.x = p.ax + (dk[0] - p.ax) * k2; p.y = p.ay + (dk[1] - p.ay) * k2; p.rot = ta;
              if(k2 >= 1){ if(p.mode === 'fly'){ p.mode = 'cat'; p.t = 0; } else p.mode = 'docked'; }
            }
          } else if(p.mode === 'cat'){
            p.t += dt; var dk2 = dockPt(e, 'sub'); p.x = dk2[0] + Math.sin(p.t * 60) * 0.6; p.y = dk2[1]; p.rot = e.ang;
            if(p.t > 0.34 / Math.max(0.6, sf)){ spawnProducts(e); e.sub = null; e.cool = 0.1; p.e = null; p.mode = 'free'; p.op = 0; place(p, true); }
          } else if(p.mode === 'docked'){ var dk3 = dockPt(e, p.kind); p.x = dk3[0]; p.y = dk3[1]; p.rot = p.kind === 'competitive' ? e.ang : e.ang + Math.PI; }
          p.x = clamp(p.x, b.x0, b.x1); p.y = clamp(p.y, b.y0, b.y1);
        });
        PRODS = PRODS.filter(function(q){
          q.life -= dt; q.vx *= Math.pow(0.25, dt); q.vy *= Math.pow(0.25, dt); q.x = clamp(q.x + q.vx * dt, b.x0, b.x1); q.y = clamp(q.y + q.vy * dt, b.y0, b.y1); q.rot += q.vr * dt;
          if(q.life <= 0){ if(q.node.parentNode) q.node.parentNode.removeChild(q.node); return false; } return true;
        });
        var gt = now.rate / now.ref; gShown += (gt - gShown) * (1 - Math.exp(-dt / 0.12)); if(Math.abs(gt - gShown) < 0.002) gShown = gt;
      }
      /* The still picture (reduced motion, Pause, or the first frame): every state as it settles, the working sites
         holding substrate in the share the model gives. */
      function settle(hard){
        var tn = tnow();
        roles();
        PRODS.forEach(function(q){ if(q.node.parentNode) q.node.parentNode.removeChild(q.node); }); PRODS = [];
        ENZ.forEach(function(e){ release(e); e.newUntil = !hard && e.den && e.want !== 'den' ? tn + 2600 : 0; e.den = e.want === 'den'; e.fold = e.den ? 0 : 1; e.fade = 1; e.repl = 0; e.hug = 0; e.pinch = e.want === 'mis' ? 1 : 0; });
        var n = counts(); setCount('sub', n.sub, true); setCount('inh', n.inh, true);
        PARTS.forEach(function(p){ p.op = 1; if(p.mode !== 'free'){ p.mode = 'free'; p.e = null; } });
        var inhs = ofKind('inh'), subs = ofKind('sub'), occ = now.z.substrate;
        ENZ.forEach(function(e){
          if(e.want === 'inh' && inhs.length){ var p = inhs.pop(); e.inh = p; p.e = e; p.mode = 'docked'; var d = dockPt(e, p.kind); p.x = d[0]; p.y = d[1]; p.rot = p.kind === 'competitive' ? e.ang : e.ang + Math.PI; if(p.kind === 'noncompetitive') e.pinch = 1; }
        });
        if(still()){ var okE = ENZ.filter(working), nb = Math.round(occ * okE.length); okE.slice(0, nb).forEach(function(e){ var s = subs.pop(); if(!s) return; e.sub = s; s.e = e; s.mode = 'held'; var d = dockPt(e, 'sub'); s.x = d[0]; s.y = d[1]; s.rot = e.ang; e.hug = 1; }); }
        gShown = now.rate / now.ref; acc = 0; accB = 0;
      }
      function paint(){
        var R = G.R, sf = speedF(), amp = still() ? 0 : 1;
        ENZ.forEach(function(e){
          var u = 1 - e.fold, hugq = Math.round(e.hug * 10) / 10, pq = Math.round(e.pinch * 12) / 12, key = hugq + '|' + pq;
          if(key !== e.key){
            e.key = key;
            var pts = bodyPts(e.seed, hugq, pq).map(function(p){ return local(e, p[0], p[1]); });
            e.el.body.setAttribute('d', smooth(pts));
            e.el.site.setAttribute('d', smooth(cupPts(cup(hugq, pq)).map(function(p){ return local(e, p[0], p[1]); }), true));
          }
          var jx = amp * Math.sin(e.ph * 0.9) * R * 0.02 * (0.5 + sf), jy = amp * Math.cos(e.ph * 0.7 + 1) * R * 0.02 * (0.5 + sf), jr = amp * Math.sin(e.ph * 0.6 + 2) * 1.6 * (0.5 + sf);
          e.g.setAttribute('transform', 'translate(' + n1(e.x + jx) + ' ' + n1(e.y + jy) + ') rotate(' + n1(jr) + ')');
          e.g.setAttribute('opacity', e.fade.toFixed(2));
          var fo = 1 - ss(0.3, 0.85, u);
          e.el.fold.setAttribute('opacity', fo.toFixed(2));
          e.el.fold.setAttribute('transform', u > 0 ? 'rotate(' + n1(e.ang * 57.3) + ') scale(' + (1 + 0.4 * u).toFixed(3) + ' ' + (1 - 0.28 * u).toFixed(3) + ') rotate(' + n1(-e.ang * 57.3) + ')' : '');
          e.el.sh.setAttribute('opacity', fo.toFixed(2));
          var to = ss(0.12, 0.6, u); e.el.tangle.setAttribute('opacity', to.toFixed(2));
          if(u > 0){ var cp = smooth(chainPts(e.seed, ss(0, 1, u), still() ? 0 : e.ph * 0.5).map(function(p){ return local(e, p[0], p[1]); }), true); e.el.ce.setAttribute('d', cp); e.el.cc.setAttribute('d', cp); }
          e.g.setAttribute('data-st', e.fold < 0.45 ? 'den' : e.inh && e.inh.mode === 'docked' ? 'inh' : e.pinch > 0.6 ? 'mis' : 'ok');
          e.el.pos.setAttribute('opacity', now.show.ph ? (now.acid ? 1 : (1 - e.pinch).toFixed(2)) : 0);
          e.el.neg.setAttribute('opacity', now.show.ph ? (now.acid ? (1 - e.pinch).toFixed(2) : 1) : 0);
          e.el.allo.setAttribute('opacity', now.show.allo ? 1 : 0);
        });
        PARTS.forEach(function(p){ p.node.setAttribute('transform', 'translate(' + n1(p.x) + ' ' + n1(p.y) + ') rotate(' + n1(p.rot * 57.3) + ')'); p.node.setAttribute('opacity', clamp(p.op, 0, 1).toFixed(2)); });
        PRODS.forEach(function(q){ q.node.setAttribute('transform', 'translate(' + n1(q.x) + ' ' + n1(q.y) + ') rotate(' + n1(q.rot * 57.3) + ')'); q.node.setAttribute('opacity', clamp(q.life / 0.6, 0, 1).toFixed(2)); });
        var gf = gGauge.querySelector('.ez2-gfill'); if(gf){ var gw = Math.max(0, G.gw * clamp(gShown, 0, 1)); gf.setAttribute('width', n1(gw)); gf.setAttribute('opacity', gw < 1 ? 0 : 1); }
        syncWords();
      }
      /* What the picture shows right now (words wait for it). */
      function shown(){
        var o = { den: 0, mis: 0, inh: 0, n: ENZ.length, fresh: 0, g: gShown }, tn = tnow();
        ENZ.forEach(function(e){ if(e.repl) return; if(e.fold < 0.45) o.den++; else if(e.inh && e.inh.mode === 'docked') o.inh++; else if(e.pinch > 0.6) o.mis++; if(e.newUntil > tn) o.fresh++; });
        return o;
      }
      function tick(ts){
        raf = 0;
        var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016; lastTs = ts;
        if(now && G){ step(dt); paint(); }
        if(!still() && visible && !stage.hidden) raf = requestAnimationFrame(tick);
      }
      var visible = true;
      function startLoop(){ if(!raf && !still() && visible && now && G){ lastTs = 0; raf = requestAnimationFrame(tick); } }
      function stopLoop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } lastTs = 0; if(now && G){ settle(); paint(); } }
      function crossFade(){
        var g = gDyn.cloneNode(true); g.setAttribute('class', 'ez2-fadeout'); svg.insertBefore(g, gDyn.nextSibling);
        var done = function(){ if(g.parentNode) g.parentNode.removeChild(g); };
        if(g.animate){ var an = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'linear' }); an.onfinish = done; setTimeout(done, 400); } else done();
        if(gDyn.animate) gDyn.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'linear' });
      }
      /* The setting to draw. hard: a different screen (a tab, the kind of inhibitor, a new challenge): the picture
         is swapped with a short cross fade and starts settled. Otherwise the picture changes by itself, seen. */
      function target(hard){
        var ex = S.mode === 'explore', c, p, ref;
        if(ex){ p = PA; c = condOf(S.tab); ref = refOf(S.tab); }
        else if(chal){ p = chal.p; c = chal.now; ref = p.Vmax; }
        else return;
        now = { prof: p, c: c, ref: ref, rate: rateOf(p, c), show: { ph: ex ? S.tab === 'ph' : chal.ch.key === 'pH', allo: c.inhibitor === 'noncompetitive' || (ex && S.tab === 'inh' && S.itype === 'noncompetitive') } };
        if(!G) return;
        if(hard || still()){ if(G.ready) crossFade(); settle(hard); G.ready = true; tint(); labels(true); paint(); startLoop(); return; }
        roles(); var n = counts(); setCount('sub', n.sub); setCount('inh', n.inh); tint(); startLoop();
      }
      function changed(){ target(false); wKey = ''; syncWords(); drawMarks(); }
      function swap(){ target(true); wKey = ''; syncWords(); drawMarks(); }
      function setTab(v){
        if(v === S.tab) return;
        S.tab = v; prev = null; gest = false;
        layoutNow(true); refHtml(); tourDid('tab');
      }

      /* ---- words: the purpose line, the cause line, the labels */
      function rateWord(g){ return g < 0.03 ? { t: 'no reaction', role: 'bad' } : { t: g < 0.35 ? 'slow rate' : g < 0.72 ? 'medium rate' : g < 0.93 ? 'fast rate' : 'top rate', role: 'prod' }; }
      function rateSay(){ if(!now) return ''; var g = now.rate / now.ref; return 'Reaction rate ' + F(now.rate, 1) + ' ' + RU + ', ' + Math.round(g * 100) + ' percent of the top of the bar'; }
      /* The cause line says what the picture shows at that moment: a pill that names a change in the enzymes
         (unfolded, out of shape, blocked) is added once at least one enzyme is drawn that way. */
      function chain(){
        var c = now.c, z = now.z || M.enzyme.states(now.prof, c), sh = shown(), g = now.rate / now.ref, rw = rateWord(g), tab = S.tab, a;
        if(tab === 'sub'){
          if(c.S === 0) return [{ t: 'No substrate', role: 'sub' }, { t: 'nothing to bind', role: 'enz' }, { t: 'no reaction', role: 'bad' }];
          if(z.substrate < 0.4) return [{ t: 'Little substrate', role: 'sub' }, { t: 'most sites empty', role: 'enz', say: 'most active sites are empty' }, rw];
          if(z.substrate < 0.8) return [{ t: 'More substrate', role: 'sub' }, { t: 'more sites busy', role: 'enz', say: 'more active sites are busy' }, { t: g < 0.72 ? 'faster rate' : 'fast rate', role: 'prod' }];
          return [{ t: 'Lots of substrate', role: 'sub' }, { t: 'every site busy', role: 'enz', say: 'nearly every active site is busy' }, { t: 'rate levels off', role: 'prod' }];
        }
        if(tab === 'temp'){
          var hot = c.T > M.enzyme.optimumT(now.prof), tf = M.enzyme.tempFactor(now.prof, c.T);
          if(hot && now.dT > 0){
            a = [{ t: 'Too hot', role: 'heat' }];
            if(!sh.den) return a;
            a.push({ t: sh.den >= sh.n ? 'enzymes denature' : 'some enzymes denature', role: 'bad', say: sh.den >= sh.n ? 'the enzymes unfold, they denature' : 'some enzymes unfold, they denature' });
            if(sh.den >= sh.n) a.push({ t: 'substrate cannot fit', role: 'sub' });
            a.push(g < 0.03 ? rw : { t: 'rate falls', role: 'prod' });
            return a;
          }
          if(tf >= 0.9) return [{ t: 'Best temperature', role: 'heat' }, { t: 'fast collisions', role: 'sub' }, { t: 'enzymes still folded', role: 'enz' }, { t: 'top rate', role: 'prod' }];
          if(c.T < 15) return [{ t: 'Cold', role: 'heat' }, { t: 'slow molecules', role: 'sub' }, { t: 'few collisions', role: 'enz' }, rw];
          return [{ t: 'Warmer', role: 'heat' }, { t: 'faster molecules', role: 'sub' }, { t: 'more collisions', role: 'enz' }, rw];
        }
        if(tab === 'ph'){
          var side = now.acid ? 'acidic' : 'basic';
          if(z.phOk >= 0.9) return [{ t: 'Best pH', role: 'ph' }, { t: 'active site fits substrate', role: 'enz', say: 'the charges in the active site fit the substrate' }, { t: 'top rate', role: 'prod' }];
          if(sh.den && sh.den >= sh.n) return [{ t: 'Far too ' + side, role: 'ph' }, { t: 'enzymes denature', role: 'bad', say: 'the enzymes lose their shape, they denature' }, rateWord(g)];
          a = [{ t: 'Too ' + side, role: 'ph' }];
          if(!sh.mis && !sh.den) return a;
          a.push({ t: 'site charges change', role: 'enz', say: 'the charges in the active site change' }); a.push({ t: 'substrate binds poorly', role: 'sub' }); a.push(g < 0.03 ? rw : { t: 'rate falls', role: 'prod' });
          return a;
        }
        if(c.inhibitor === 'none') return [{ t: 'No inhibitor', role: 'inh' }, { t: 'active sites free', role: 'enz' }, rw];
        var k = M.enzyme.params(now.prof, c), free = M.enzyme.rate(now.prof, Object.assign({}, c, { inhibitor: 'none' }), c.S), rel = now.rate / free;
        if(c.inhibitor === 'competitive'){
          if(rel >= 0.8 && c.S >= 8) return [{ t: 'Lots of substrate', role: 'sub' }, { t: 'substrate wins the site', role: 'enz', say: 'substrate reaches the active site before the inhibitor' }, { t: 'rate recovers', role: 'prod' }];
          a = [{ t: 'Inhibitor in active site', role: 'inh', say: 'the inhibitor sits in the active site' }];
          if(!sh.inh) return a;
          return a.concat([{ t: 'substrate blocked', role: 'sub' }, { t: 'slower rate', role: 'prod' }]);
        }
        a = [{ t: 'Inhibitor binds elsewhere', role: 'inh', say: 'the inhibitor binds away from the active site' }];
        if(!sh.mis && !sh.inh) return a;
        if(c.S >= 8) return [{ t: 'More substrate', role: 'sub' }, { t: 'bent sites still fail', role: 'enz', say: 'the bent active sites still cannot bind it' }, { t: 'rate stays low', role: 'prod' }];
        return a.concat([{ t: 'site changes shape', role: 'enz', say: 'the active site changes shape' }, { t: 'slower rate', role: 'prod' }]);
      }
      function term(){
        if(S.mode !== 'explore' || !now) return '';
        var z = now.z || {}, c = now.c;
        if(S.tab === 'sub') return z.substrate >= 0.8 && gShown >= 0.75 ? 'Saturated' : '';
        if(S.tab === 'temp') return M.enzyme.tempFactor(now.prof, c.T) >= 0.9 && !now.dT ? 'Optimum temperature' : '';
        if(S.tab === 'ph') return z.phOk >= 0.9 ? 'Optimum pH' : '';
        return '';
      }
      var wKey = '', lKey = '', inhLab = -1;
      function syncWords(){
        if(!now) return;
        var sh = shown(), k = S.mode + '|' + S.tab + '|' + JSON.stringify(now.c) + '|' + sh.den + '|' + (sh.mis > 0) + '|' + (sh.inh > 0) + '|' + term();
        if(k !== wKey){ wKey = k; if(S.mode === 'explore'){ head.purpose(tabOf(S.tab).purpose); cause.set(chain()); } aria(); }
        labels(false);
      }
      function pill(x, y, text, cls, anchor, fs){
        var w = text.length * fs * 0.56 + 18, h = fs + 10, x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
        return '<g class="ez2-pill ' + cls + '"><rect x="' + n1(x0) + '" y="' + n1(y - h / 2) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(h / 2) + '"/><text x="' + n1(x0 + w / 2) + '" y="' + n1(y + fs * 0.36) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(text) + '</text></g>';
      }
      /* One short label per thing, attached to the molecule it names. */
      function labels(force){
        if(!G || !now) return;
        var tn = tnow(), L = {}, ex = S.mode === 'explore';
        var docked = ENZ.filter(function(e){ return e.inh && e.inh.mode === 'docked' && !e.repl; });
        if(!docked.some(function(e){ return e.i === inhLab; })){ var pick = docked.filter(function(e){ return e.i > 1; })[0] || docked[0]; inhLab = pick ? pick.i : -1; }
        var firstDen = ENZ.filter(function(e){ return e.fold < 0.45 && !e.repl; })[0], firstNew = ENZ.filter(function(e){ return e.newUntil > tn && e.repl !== 1; })[0];
        if(ENZ[0] && ENZ[0].fold > 0.6 && !ENZ[0].repl) L[0] = ['active site', 'is-enz', 'site'];
        if(ENZ[1] && ENZ[1].fold > 0.6 && !ENZ[1].repl) L[1] = ['enzyme', 'is-enz'];
        if(inhLab >= 0) L[inhLab] = ['inhibitor', 'is-inh', now.c.inhibitor === 'competitive' ? 'inhc' : 'inhn'];
        if(firstDen) L[firstDen.i] = ['denatured', 'is-bad'];
        if(firstNew) L[firstNew.i] = ['new enzyme', 'is-ink'];
        var tm = term(), key = Object.keys(L).map(function(i){ return i + L[i][0]; }).join(',') + '|' + tm + '|' + S.mode + S.tab;
        if(key === lKey && !force) return;
        lKey = key;
        var p = [], R = G.R, fs = G.fsS;
        Object.keys(L).forEach(function(i){
          var e = ENZ[i], l = L[i], w = l[0].length * fs * 0.56 + 18, lx = clamp(e.x + (l[2] === 'site' ? R * 0.42 : 0), 8 + w / 2, G.W - 8 - w / 2), ly = e.y - R * 1.12 - fs * 0.5 - 7;
          if(l[2]){ var t = l[2] === 'site' ? world(e, 0.86, 0) : l[2] === 'inhc' ? world(e, 0.9, 0) : world(e, -1.02, 0), sx = clamp(t[0], lx - w / 2 + 8, lx + w / 2 - 8); p.push('<path class="ez2-lead" d="M' + n1(sx) + ' ' + n1(ly + fs * 0.5 + 4) + 'L' + n1(t[0]) + ' ' + n1(t[1]) + '"/>'); }
          p.push('<g class="ez2-lab" data-for="' + i + '">' + pill(lx, ly, l[0], l[1], 'middle', fs) + '</g>');
        });
        if(tm) p.push('<g class="ez2-term">' + pill(12, G.top / 2 + 1, tm, 'is-ink is-big', 'start', G.fs) + '</g>');
        gLabels.innerHTML = p.join('');
      }
      function aria(){
        var c = now.c, sh = shown();
        var al = 'Enzyme molecules in solution at ' + F(c.S, 1) + ' millimolar substrate, ' + F(c.T, 0) + ' degrees Celsius and pH ' + F(c.pH, 1) + (c.inhibitor !== 'none' ? ', with ' + F(c.I, 2) + ' millimolar ' + c.inhibitor + ' inhibitor' : '') + '. ' + rateSay() + '. ' +
          (S.mode === 'explore' ? cause.text() : '');
        svg.setAttribute('aria-label', al);
      }

      /* ---------------------------------------------------- layout and the parts that do not move */
      function geo(Wd, H){
        var ph = Wd < 520, ex = S.mode === 'explore', inh = ex && S.tab === 'inh';
        var ctl = ex ? (inh ? 154 : 104) : 0, y1 = H - ctl, top = ph ? 42 : 46, lh = ph ? 28 : 32;
        var cols = Wd < 520 ? 2 : Wd < 1100 ? 3 : 4, rows = 2, N = cols * rows, cw = (Wd - 20) / cols, ch = (y1 - top - 10) / rows;
        var R = Math.max(22, Math.min(cw * 0.29, (ch - lh) / 2.26));
        var half = Math.min(400, (Wd - (ph ? 64 : 150)) / 2), fsS = ph ? 11.5 : 13, qw = 17 * fsS * 0.56 + 18;
        return { W: Wd, H: H, ph: ph, ex: ex, inh: inh, y1: y1, top: top, lh: lh, cols: cols, N: N, cw: cw, ch: ch, cx0: 10, cy0: top, R: R, nMax: clamp(Math.round(0.4 * (Wd - 20) * (y1 - top) / (R * R)), 10, 40),
          tx0: Wd / 2 - half, tx1: Wd / 2 + half, ty: y1 + 50, qx0: Wd / 2 - half + qw + 22, qy: y1 + 126, fs: ph ? 13 : 15, fsS: fsS, gw: ph ? 112 : 170 };
      }
      function ctlNow(){ return CT[S.tab]; }
      function drawStatic(){
        var g = G, p = [], t = tabOf(S.tab);
        p.push('<rect class="ez2-liq" x="0" y="0" width="' + g.W + '" height="' + n1(g.y1) + '"/><rect class="ez2-tint is-a" x="0" y="0" width="' + g.W + '" height="' + n1(g.y1) + '"/><rect class="ez2-tint is-b" x="0" y="0" width="' + g.W + '" height="' + n1(g.y1) + '"/><rect class="ez2-vig" x="0" y="0" width="' + g.W + '" height="' + n1(g.y1) + '"/>');
        if(g.ex){
          p.push('<rect class="ez2-bench" x="0" y="' + n1(g.y1) + '" width="' + g.W + '" height="' + n1(g.H - g.y1) + '"/><path class="ez2-benchedge" d="M0 ' + n1(g.y1 + 0.5) + 'H' + g.W + '"/>');
          var r = t.id === 'sub' ? EX.substrate : t.id === 'temp' ? EX.temperature : t.id === 'ph' ? EX.pH : EX.inhibitor;
          p.push('<g class="ez2-ctlname">' + pill((g.tx0 + g.tx1) / 2, g.ty + 36, t.control, 'is-' + t.role, 'middle', g.fs) + '</g>');
          p.push('<text class="ez2-end" x="' + n1(g.tx0) + '" y="' + n1(g.ty + 40) + '" text-anchor="middle" style="font-size:' + g.fsS + 'px">' + esc(t.lo) + '</text><text class="ez2-end" x="' + n1(g.tx1) + '" y="' + n1(g.ty + 40) + '" text-anchor="middle" style="font-size:' + g.fsS + 'px">' + esc(t.hi) + '</text>');
          if(g.inh) p.push('<g class="ez2-ctlname is-q"></g>');
        }
        gStatic.innerHTML = p.join('');
        // the rate bar: the model's rate, as a share of the best this screen can reach
        var x1 = g.W - 12, x0 = x1 - g.gw, by = g.top / 2 + 4;
        gGauge.innerHTML = '<rect class="ez2-gbg" x="' + n1(x0 - 9) + '" y="' + n1(by - 22) + '" width="' + n1(g.gw + 18) + '" height="38" rx="10"/>' +
          '<text class="ez2-gname" x="' + n1(x0) + '" y="' + n1(by - 7) + '" style="font-size:' + g.fsS + 'px">Reaction rate</text><text class="ez2-gmax" x="' + n1(x1) + '" y="' + n1(by - 7) + '" text-anchor="end" style="font-size:' + (g.fsS - 1.5) + 'px">max</text>' +
          '<rect class="ez2-gtrack" x="' + n1(x0) + '" y="' + n1(by) + '" width="' + n1(g.gw) + '" height="9" rx="4.5"/><rect class="ez2-gfill" x="' + n1(x0) + '" y="' + n1(by) + '" width="0" height="9" rx="4.5"/>';
      }
      /* The solution takes the colour of the condition: cool blue to warm for temperature, the indicator's red to
         violet for pH. */
      function tint(){
        var a = gStatic.querySelector('.ez2-tint.is-a'), b = gStatic.querySelector('.ez2-tint.is-b'); if(!a || !now) return;
        var ex = S.mode === 'explore', oa = 0, ob = 0, kind = '';
        if(ex && S.tab === 'temp'){ kind = 'temp'; oa = clamp((30 - now.c.T) / 30, 0, 1); ob = clamp((now.c.T - 30) / 40, 0, 1); }
        else if(ex && S.tab === 'ph'){ kind = 'ph'; oa = clamp((7 - now.c.pH) / 6, 0, 1); ob = clamp((now.c.pH - 7) / 6, 0, 1); }
        a.setAttribute('data-k', kind); b.setAttribute('data-k', kind); a.setAttribute('opacity', oa.toFixed(2)); b.setAttribute('opacity', ob.toFixed(2));
      }
      function drawMarks(){
        var p = [], qn = gStatic.querySelector('.ez2-ctlname.is-q');
        if(qn && G) qn.innerHTML = pill(G.tx0 - 6, G.qy, 'Substrate ' + F(S.isub, 1) + ' ' + SU, 'is-sub', 'start', G.fsS);
        if(G && G.ex && prev && prev.tab === S.tab && prev.v !== valOf(S.tab)){
          var r = S.tab === 'sub' ? EX.substrate : S.tab === 'temp' ? EX.temperature : S.tab === 'ph' ? EX.pH : EX.inhibitor, lo = r.min || 0;
          var bx = G.tx0 + (G.tx1 - G.tx0) * ((prev.v - lo) / (r.max - lo)), kx = G.tx0 + (G.tx1 - G.tx0) * ((valOf(S.tab) - lo) / (r.max - lo));
          p.push('<path class="ez2-mark" d="M' + n1(bx) + ' ' + n1(G.ty - 9) + 'V' + n1(G.ty + 9) + '"/>' + (Math.abs(bx - kx) > 62 ? '<text class="ez2-markt" x="' + n1(bx) + '" y="' + n1(G.ty - 13) + '" text-anchor="middle" style="font-size:' + (G.fsS - 1) + 'px">before</text>' : ''));
        }
        gMarks.innerHTML = p.join('');
      }
      function layoutNow(hard){
        if(stage.hidden) return;
        stage.setAttribute('data-tab', S.mode === 'explore' ? S.tab : 'quiz');
        var r = sceneBox.getBoundingClientRect(), Wd = Math.max(280, Math.round(r.width)), H = Math.max(240, Math.round(r.height));
        var was = G, ready = G && G.ready;
        svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); svg.setAttribute('width', Wd); svg.setAttribute('height', H);
        G = geo(Wd, H); G.ready = ready;
        var same = was && was.N === G.N && Math.abs(was.R - G.R) < 0.5 && was.W === G.W && was.y1 === G.y1;
        Object.keys(CT).forEach(function(k){ CT[k].hide(!(G.ex && k === S.tab)); });
        cSub2.hide(!G.inh); typeBox.hidden = !G.inh;
        if(G.ex) ctlNow().place([G.tx0, G.ty, G.tx1, G.ty]);
        if(G.inh) cSub2.place([G.qx0, G.qy, G.tx1, G.qy]);
        if(!same){
          if(ready && hard) crossFade();
          PARTS.slice().forEach(dropPart); PRODS.forEach(function(q){ if(q.node.parentNode) q.node.parentNode.removeChild(q.node); }); PRODS = [];
          defs(); buildEnzymes(); G.ready = false;
        }
        drawStatic(); lKey = '';
        target(hard || !same); wKey = ''; syncWords(); drawMarks();
        if(cue.active()) cue.place();
      }

      /* ---------------------------------------------------- "?": the numbers behind this setting */
      var ref = document.createElement('div'); ref.className = 'ls-sec ez2-ref';
      var AX = { sub: { key: 'S', label: 'Substrate concentration', unit: SU, min: 0, max: EX.substrate.max, step: 5, d: 1 }, temp: { key: 'T', label: 'Temperature', unit: '°C', min: 0, max: EX.temperature.max, step: 10, d: 0 },
        ph: { key: 'pH', label: 'pH', unit: '', min: EX.pH.min, max: EX.pH.max, step: 2, d: 1 }, inh: { key: 'S', label: 'Substrate concentration', unit: SU, min: 0, max: EX.inhSubstrate.max, step: 5, d: 1 } };
      function inhName(id){ return data.inhibitors.filter(function(x){ return x.id === id; })[0].name; }
      function refHtml(){
        var tab = S.tab, c = condOf(tab), V = AX[tab], k = M.enzyme.params(PA, c), r = rateOf(PA, c), inhOn = c.inhibitor !== 'none';
        var cur = [], base = [], rows = [], n = 120;
        for(var i = 0; i <= n; i++){ var x = V.min + (V.max - V.min) * i / n, c1 = Object.assign({}, c); c1[V.key] = x; cur.push([x, rateOf(PA, c1)]); if(inhOn) base.push([x, rateOf(PA, Object.assign({}, c1, { inhibitor: 'none' }))]); }
        for(var j = 0; j <= 8; j++){ var x2 = V.min + (V.max - V.min) * j / 8, c2 = Object.assign({}, c); c2[V.key] = x2; var row = [F(x2, V.d), F(rateOf(PA, c2), 1)]; if(inhOn) row.push(F(rateOf(PA, Object.assign({}, c2, { inhibitor: 'none' })), 1)); rows.push(row); }
        var ym = T.niceMax(PA.Vmax * 1.05), nm = V.label.toLowerCase().replace('ph', 'pH');
        ref.innerHTML = '<p class="ez2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>' +
          '<h3 class="ls-title-l">This setting: ' + esc(PA.name) + '</h3>' +
          '<dl class="bt-readout"><div><dt>Substrate</dt><dd>' + F(c.S, 1) + ' ' + SU + '</dd></div><div><dt>Temperature</dt><dd>' + F(c.T, 0) + ' °C</dd></div><div><dt>pH</dt><dd>' + F(c.pH, 1) + '</dd></div>' +
          '<div><dt>Inhibitor</dt><dd>' + (inhOn ? F(c.I, 2) + ' ' + IU + ' ' + esc(c.inhibitor) : 'none') + '</dd></div>' +
          '<div><dt>Rate now</dt><dd>' + F(r, 1) + ' ' + RU + '</dd></div><div><dt>V<sub>max</sub> (apparent)</dt><dd>' + F(k.vmax, 1) + ' ' + RU + '</dd></div><div><dt>K<sub>m</sub> (apparent)</dt><dd>' + F(k.km, 2) + ' ' + SU + '</dd></div>' +
          '<div><dt>Rate as % of best V<sub>max</sub></dt><dd>' + F(100 * r / PA.Vmax, 0) + '%</dd></div></dl>' +
          '<p class="bt-small">' + esc(PA.blurb) + ' The rate bar on the picture fills to the best rate this tab’s control can reach.</p>' +
          '<h3 class="ls-title-l">The rate curve: rate against ' + esc(nm) + '</h3>' +
          T.plot({ title: 'Graph of reaction rate against ' + nm + ' for ' + PA.name + (inhOn ? ' with ' + inhName(c.inhibitor).toLowerCase() + ' (solid) and without it (dashed)' : '') + '. The table below lists the values.',
            x: { label: V.label, unit: V.unit, min: V.min, max: V.max, step: V.step }, y: { label: 'Reaction rate', unit: RU, min: 0, max: ym, step: T.niceStep(ym, 5) },
            curves: (inhOn ? [{ points: base, cls: 's3', dashed: true }] : []).concat([{ points: cur, cls: 's1' }]), points: [], vline: { x: c[V.key] } }) +
          T.dataTable([esc(V.label) + (V.unit ? ' (' + esc(V.unit) + ')' : ''), 'Rate (' + RU + ')'].concat(inhOn ? ['Without inhibitor (' + RU + ')'] : []), rows, 'The curve, sampled') +
          '<h3 class="ls-title-l">The words</h3><ul class="ez2-words"><li><b>Active site</b>: the pocket on the enzyme that fits the substrate in shape and charge.</li><li><b>Saturated</b>: every active site is busy, so more substrate cannot raise the rate.</li>' +
          '<li><b>Denatured</b>: the enzyme has lost its folded shape, so the active site is gone.</li><li><b>Competitive inhibitor</b>: binds in the active site. More substrate can overcome it.</li><li><b>Noncompetitive inhibitor</b>: binds somewhere else and changes the active site’s shape. More substrate cannot overcome it.</li></ul>' +
          '<p class="bt-small">' + esc(EX.note) + '</p>';
      }
      ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(ctx.studio) ctx.studio.close(); if(S.mode !== 'explore' && ctx.studio && ctx.studio.kit2) ctx.studio.kit2.go('explore'); setTimeout(startTour, 60); });

      /* ---------------------------------------------------- Test yourself: predict, then change */
      var chal = null, chalN = 0, chalSeed = 1 + Math.floor(Math.random() * 99999);
      var dock = document.createElement('div'); dock.className = 'ez2-predict';
      dock.innerHTML = '<div class="os-chal"></div>';
      var chalBox = dock.querySelector('.os-chal');
      /* Changes with a clear answer (rate moves by more than 15% or by less than 3%), computed from the model at
         the challenge's conditions. */
      var CHANGES = [
        { id: 'more-substrate', key: 'S', text: function(a, b){ return 'Raise the substrate from ' + F(a, 1) + ' to ' + F(b, 1) + ' ' + SU + '.'; }, pick: function(g, c){ return Math.min(data.substrate.max, c.S * g.pick([2, 4])); } },
        { id: 'hotter', key: 'T', text: function(a, b){ return 'Heat it from ' + F(a, 0) + ' to ' + F(b, 0) + ' °C.'; }, pick: function(g, c, p){ return Math.min(data.temperature.max, Math.round(p.Tm + g.pick([4, 8, 12]))); } },
        { id: 'cooler', key: 'T', text: function(a, b){ return 'Cool it from ' + F(a, 0) + ' to ' + F(b, 0) + ' °C.'; }, pick: function(g, c){ return Math.max(0, c.T - g.pick([20, 25, 30])); } },
        { id: 'ph', key: 'pH', text: function(a, b){ return 'Change the pH from ' + F(a, 1) + ' to ' + F(b, 1) + '.'; }, pick: function(g, c){ return Math.max(1, Math.min(13, c.pH + g.pick([-4, -3, 3, 4]))); } },
        { id: 'competitive-more-substrate', key: 'S', inh: 'competitive', text: function(a, b){ return 'With a competitive inhibitor present, raise the substrate from ' + F(a, 1) + ' to ' + F(b, 1) + ' ' + SU + '.'; }, pick: function(g, c){ return Math.min(data.substrate.max, c.S * 5); } },
        { id: 'noncompetitive-add', key: 'I', inh: 'noncompetitive', text: function(a, b){ return 'Add noncompetitive inhibitor: from ' + F(a, 2) + ' to ' + F(b, 2) + ' ' + IU + '.'; }, pick: function(g){ return g.pick([2, 3, 4]); } },
        { id: 'saturated-more-substrate', key: 'S', sat: true, text: function(a, b){ return 'The enzyme is already working near its top speed. Raise the substrate from ' + F(a, 1) + ' to ' + F(b, 1) + ' ' + SU + '.'; }, pick: function(g, c){ return Math.min(data.substrate.max, c.S + 2); } }
      ];
      function makeChallenge(){
        for(var tries = 0; tries < 300; tries++){
          var g = M.rng(chalSeed + 7919 * (chalN * 300 + tries)), p = g.pick(data.profiles), ch = CHANGES[(chalN + tries) % CHANGES.length];
          var c = { S: ch.sat ? 18 : g.pick([1, 2, 3, 4]), T: p.defaults.T, pH: p.defaults.pH, inhibitor: ch.inh || 'none', I: ch.id === 'noncompetitive-add' ? 0 : 2 };
          var a = c[ch.key], b = M.round(ch.pick(g, c, p), 2);
          if(a === b) continue;
          var c2 = Object.assign({}, c); c2[ch.key] = b;
          var r1 = M.enzyme.rate(p, c, c.S), r2 = M.enzyme.rate(p, c2, c2.S), rel = (r2 - r1) / Math.max(r1, 1e-9);
          var dir = rel > 0.15 ? 'up' : rel < -0.15 ? 'down' : Math.abs(rel) < 0.03 ? 'same' : null;
          if(!dir || r1 < 3) continue;
          return { p: p, ch: ch, c: c, c2: c2, a: a, b: b, r1: r1, r2: r2, dir: dir, now: c, done: false };
        }
        return null;
      }
      /* The words after a challenge: what the molecules are doing and why (as before the rebuild). */
      function whyText(p, c){
        var z = M.enzyme.states(p, c), k = M.enzyme.params(p, c), w = [], I = c.inhibitor !== 'none' ? c.I : 0;
        if(z.folded < 0.6) w.push('At ' + F(c.T, 0) + ' °C most molecules have unfolded (denatured): the active site has lost its shape, so no substrate fits. (Many real enzymes stay unfolded after cooling.)');
        else if(z.motion < 0.5) w.push('It is cold: molecules move slowly, so substrate meets the active site less often and fewer products form each second.');
        if(z.phOk < 0.5) w.push('At pH ' + F(c.pH, 1) + ' the charged groups in most active sites are in the wrong state, so the site no longer binds substrate well (the sites drawn out of shape).');
        if(c.inhibitor === 'competitive' && I > 0) w.push('The competitive inhibitor looks like the substrate and sits in the active site, so it competes: add more substrate and substrate wins more often (Km rises to ' + F(k.km, 2) + ' ' + SU + ', Vmax unchanged).');
        if(c.inhibitor === 'noncompetitive' && I > 0) w.push('The noncompetitive inhibitor binds elsewhere and bends the active site, taking those molecules out of action whatever the substrate level (Vmax falls to ' + F(k.vmax, 1) + ', Km unchanged).');
        if(!w.length) w.push(z.substrate > 0.85 ? 'Nearly every active site is busy (saturated): adding substrate barely speeds things up. Only more enzyme would.' : 'Many active sites are empty, waiting for substrate: more substrate means more collisions and a faster rate.');
        return w.join(' ');
      }
      function condWords(c){ return F(c.S, 1) + ' ' + SU + ' substrate, ' + F(c.T, 0) + ' °C, pH ' + F(c.pH, 1) + (c.inhibitor !== 'none' && c.I > 0 ? ', ' + F(c.I, 2) + ' ' + IU + ' ' + c.inhibitor + ' inhibitor' : ''); }
      /* On a phone the question fills the screen and the picture is below it: bring the picture into view. */
      function toScene(){
        var b = sceneBox.getBoundingClientRect(), vh = window.innerHeight || 800;
        if(b.top >= 0 && b.bottom <= vh) return false;
        try{ sceneBox.scrollIntoView({ block: 'center', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){ return false; }
        return true;
      }
      function showChallenge(){
        var x = makeChallenge(); chalN++;
        if(!x) return;
        chal = x; swap();
        var id = 'ez-c' + chalN, opts = [['up', 'Rate goes up'], ['down', 'Rate goes down'], ['same', 'Rate stays about the same']];
        chalBox.innerHTML = '<p class="os-chal-q"><b>Challenge ' + chalN + '.</b> ' + esc(x.p.name) + ' is running at ' + F(x.r1, 1) + ' ' + RU + ' (' + esc(condWords(x.c)) + '). ' + esc(x.ch.text(x.a, x.b)) + '</p>' +
          '<fieldset class="os-ask"><legend>What happens to the rate?</legend>' + opts.map(function(o, i){ return '<div class="bt-radio"><input type="radio" name="' + id + '" id="' + id + i + '" value="' + o[0] + '"><label for="' + id + i + '">' + o[1] + '</label></div>'; }).join('') + '</fieldset>' +
          '<div class="bt-actions"><button type="button" class="btn-press sm ez-do">Make the change</button></div><div class="os-chal-fb" role="status" aria-live="polite"></div>';
        chalBox.querySelector('.ez-do').addEventListener('click', function(){
          var pick = chalBox.querySelector('input:checked'), fb = chalBox.querySelector('.os-chal-fb'), btn = this;
          if(!pick){ fb.textContent = 'Pick an answer first.'; return; }
          chalBox.querySelectorAll('input').forEach(function(i){ i.disabled = true; }); btn.disabled = true; x.done = true;
          var away = toScene();
          setTimeout(function(){
            if(chal !== x) return;
            x.now = x.c2; changed();
            var ok = pick.value === x.dir, words = { up: 'went up', down: 'went down', same: 'stayed about the same' };
            setTimeout(function(){
              if(chal !== x) return;
              btn.parentNode.hidden = true;
              fb.innerHTML = '<p><span class="bio-mark ' + (ok ? 'ok">Right' : 'no">Not quite') + '</span> The rate ' + words[x.dir] + ': ' + F(x.r1, 1) + ' → ' + F(x.r2, 1) + ' ' + RU + '.</p><p>' + esc(whyText(x.p, x.c2)) + '</p>' +
                '<div class="bt-actions"><button type="button" class="btn-press sm os-next">Next challenge</button>' + T.report(SLUG + ':predict-' + x.ch.id) + '</div>';
              fb.querySelector('.os-next').addEventListener('click', function(){ showChallenge(); var q = chalBox.querySelector('.os-chal-q'); q.setAttribute('tabindex', '-1'); q.focus(); });
              if(away) try{ fb.scrollIntoView({ block: 'start', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){}
            }, still() ? 0 : away ? 1500 : 900);
            T.record(SLUG, [{ id: SLUG + ':predict-' + x.ch.id + ':dir', correct: ok, topic: 'enzyme-environment', level: 'apply', diff: 2, group: 'predict' }]);
          }, away ? 450 : 0);
        });
      }

      /* ---------------------------------------------------- the two modes (the adapter calls shownMode) */
      function shownMode(mode, part){
        S.mode = mode; S.part = part;
        tour.stop();
        var ex = mode === 'explore';
        stage.setAttribute('data-view', ex ? 'explore' : 'predict');
        tabs.el.hidden = !ex; head.el.hidden = !ex; cause.el.hidden = !ex;
        if(ex){ prev = null; gest = false; refHtml(); }
        else hideCue(false);
        if(mode === 'quiz' && part !== 'predict'){ if(raf){ cancelAnimationFrame(raf); raf = 0; } return; }
        setTimeout(function(){ layoutNow(true); if(!ex && (!chal || chal.done)) showChallenge(); if(ex && !tour.active() && S.tab === 'sub') cue.show(); }, 30);
      }
      ctx.kit2 = { stage: stage, ref: ref, questionsLabel: 'Inhibitor data questions',
        parts: [{ value: 'predict', label: 'Predict, then change', dock: dock, task: { kicker: 'Predict, then change', title: 'What happens to the rate?', todo: 'Pick an answer, then make the change to check.' } }],
        onShow: function(m, p){ shownMode(m, p); } };
      refHtml();
      T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
      if(data.frq) T.frq(app, data.frq, SLUG);
      // Without the frame (no Tool Studio on the page) the stage still works on its own, above the questions.
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); stage.appendChild(dock); dock.hidden = true; shownMode('explore', null); }
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(function(){ layoutNow(false); }, 60); }).observe(sceneBox); }
      else window.addEventListener('resize', function(){ layoutNow(false); });
      if(window.IntersectionObserver) new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible) startLoop(); else if(raf){ cancelAnimationFrame(raf); raf = 0; lastTs = 0; } }).observe(sceneBox);
      document.addEventListener('visibilitychange', function(){ if(document.hidden){ if(raf){ cancelAnimationFrame(raf); raf = 0; lastTs = 0; } } else startLoop(); });
      try{ var mq = matchMedia('(prefers-reduced-motion: reduce)'), onMq = function(){ pauseBtn.hidden = K.reduced(); if(K.reduced()) stopLoop(); else startLoop(); }; if(mq.addEventListener) mq.addEventListener('change', onMq); pauseBtn.hidden = K.reduced(); }catch(e){}
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApBioBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApBioBase || '../') + 'assets/tools/enzyme-activity.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
