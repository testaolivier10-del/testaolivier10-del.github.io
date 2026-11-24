/* Design randomizer, tools v2 (docs/tools-v2-stat-design-randomizer-brief.md; the standard: docs/tools-v2-standard.md),
   on the shared kit (assets/course/tool-kit2.js) through the course adapter ApStatTools.studioKit2. OWNED BY THIS
   TOOL ONLY. The model is ApStatMath.designRandomizer (statistics/assets/tools/math/design-randomizer.js). Styles:
   design-randomizer.css.

   EXPLORE (free play, nothing graded, no side panel), one screen:
     The experiment is drawn: 16 tomato seedlings in pots on two greenhouse benches (the back one sunny, by the window),
     or 24 volunteers at tables in a memory study (younger in front, older behind). Pick a design on its card (the
     cards are the row heads of the plot of estimates), then Randomize and run: a hand deals an A or B sticker onto
     every unit in the order chance picks (inside each block for a block design, pair by pair for matched pairs; the
     chooser's order when someone picks), then four weeks pass and the plants grow to their heights (the volunteers'
     recall scores fill), and the estimate, mean of A minus mean of B, drops as a dot into its design's row, against
     the true effect built into the model. Run 100 runs a hundred more (no dealing, the dots stream in). Blocks are
     drawn as frames round each bench or age group, pairs as a shared tray or mat. On the memory study a quiet switch
     turns blinding off (the not blind runs are hollow dots). Tap a unit to read it in the cause line.
     Every count, the estimate and the cause line are read from the picture AS DRAWN in that frame: a sticker counts
     once it is down, a plant's height is its drawn stem, a row's centre is the mean of the dots that have landed.
   TEST YOURSELF (unchanged): the drill over the model's generate(), five kinds, records
   design-randomizer:<context>:<step>; ?seed= and #quiz open it. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath, P = window.ApStatPlot;
  if(!T || !M || !M.designRandomizer) return;
  var D = M.designRandomizer, esc = T.esc, SLUG = 'design-randomizer', NS = 'http://www.w3.org/2000/svg';
  var DES = ['cr', 'block', 'pairs', 'none'];

  /* ----------------------------------------------------------- helpers */
  function fx(x, d){ return T.F(x, d == null ? 2 : d); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function n1(v){ return Math.round(v * 10) / 10; }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function mk(tag, cls, attrs, parent){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); if(attrs) for(var k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; }
  function at(e, attrs){ for(var k in attrs){ var v = typeof attrs[k] === 'number' ? String(n1(attrs[k])) : attrs[k]; if(e.getAttribute(k) !== v) e.setAttribute(k, v); } }
  function txt(e, s){ if(e.textContent !== s) e.textContent = s; }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function easeIO(k){ return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function easeOut(k){ return 1 - Math.pow(1 - k, 3); }
  function cap(s){ s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  var mctx = null, mCache = {}, FONT = 'Nunito, "Segoe UI", system-ui, sans-serif';
  function tw(s, px, wt){
    var k = (wt || 800) + '|' + px + '|' + s;
    if(mCache[k] != null) return mCache[k];
    if(!mctx){ var c = document.createElement('canvas'); mctx = c.getContext('2d'); }
    mctx.font = (wt || 800) + ' ' + px + 'px ' + FONT;
    return (mCache[k] = mctx.measureText(s).width);
  }
  function hash(i, k){ var h = Math.imul(i + 1, 2654435761) ^ Math.imul(k + 7, 40503); h ^= h >>> 13; return Math.abs(h) % 997; }

  /* ========================================================= EXPLORE */
  function explore(host, data){
    var K = window.LevlKit2, E = data.explore || {}, SCN = E.scenes || [];
    var seed = 1000 + Math.floor(Math.random() * 9000), rng = M.rng(seed);
    var S = { sc: null, U: null, design: 'cr', blind: true, mode: 'explore', sel: -1, took: {}, lastTake: null };
    var run = null;          // the experiment on the bench: { tr, res, order, design, ub, t0, per, fast, dropped, done }
    var rows = { cr: [], block: [], pairs: [], none: [] };   // dots: { v, ub, t0, dur, el, land, lvl, bin, last }
    var drawn = { tag: [], h: [], g: 0, placed: 0, hand: null };
    var raf = 0, GROW = 1150, FALL = 420;
    function calm(){ return K.reduced() || !window.requestAnimationFrame; }
    function sc(){ return S.sc; }
    function people(){ return S.sc.kind === 'people'; }
    function trueEff(){ return S.sc.effect; }
    function unitOf(){ return S.sc.unitOf; }
    function dname(d, wide){
      if(d === 'none') return [sc().noneCard];
      return wide ? { cr: ['Completely', 'randomized'], block: ['Randomized', 'block'], pairs: ['Matched pairs'] }[d] : [{ cr: 'Randomized', block: 'Blocked', pairs: 'Matched pairs' }[d]];
    }
    function dshort(d){ return d === 'none' ? sc().noneCard : { cr: 'Randomized', block: 'Blocked', pairs: 'Matched pairs' }[d]; }
    function lurkWord(b){ return sc().lurkShort[b]; }

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'dr3');
    var head = K.head({ purpose: E.purpose || 'See where each design’s estimates land', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    var pickWrap = el('label', 'dr3-pick'), pick = el('select', 'dr3-sel');
    pickWrap.innerHTML = '<span class="dr3-pick-k">Experiment</span>';
    pick.setAttribute('aria-label', 'Experiment');
    pick.innerHTML = SCN.map(function(x, i){ return '<option value="' + i + '">' + esc(x.name) + '</option>'; }).join('');
    pickWrap.appendChild(pick);
    head.el.insertBefore(pickWrap, head.how);
    stage.appendChild(head.el);
    var sceneBox = el('div', 'dr3-scene');
    sceneBox.innerHTML = '<svg class="dr3-svg" role="img" xmlns="' + NS + '" data-ls-text="keep"><defs></defs><g class="dr3-back"></g><g class="dr3-struct"></g><g class="dr3-units"></g><g class="dr3-selg"></g><g class="dr3-hand"></g><g class="dr3-plot"></g><g class="dr3-dots"></g><g class="dr3-labs"></g></svg>';
    stage.appendChild(sceneBox);
    var svg = sceneBox.querySelector('svg'), gBack = svg.querySelector('.dr3-back'), gStruct = svg.querySelector('.dr3-struct'), gUnits = svg.querySelector('.dr3-units'),
      gSel = svg.querySelector('.dr3-selg'), gHand = svg.querySelector('.dr3-hand'), gPlot = svg.querySelector('.dr3-plot'), gDots = svg.querySelector('.dr3-dots'), gLabs = svg.querySelector('.dr3-labs');
    var layer = K.layer(sceneBox);
    // the units can be tapped: a box over the bench (the nearest drawn unit answers), a real focusable group for the keys
    var pickBox = el('div', 'dr3-unitpick');
    pickBox.tabIndex = 0; pickBox.setAttribute('role', 'group');
    pickBox.setAttribute('aria-label', 'The experimental units. Left and right arrows pick one to read it; Escape clears.');
    layer.el.appendChild(pickBox);
    var goWrap = el('div', 'dr3-go'), bGo = el('button', 'tk2-btn tk2-btn-pri dr3-run', 'Randomize and run');
    bGo.type = 'button'; goWrap.appendChild(bGo); layer.el.appendChild(goWrap);
    var bBlind = el('button', 'dr3-blind'); bBlind.type = 'button';
    layer.el.appendChild(bBlind);
    var lines = el('div', 'dr3-lines'), cause = K.cause({ label: 'Why' });
    var acts = el('div', 'dr3-acts');
    acts.innerHTML = '<button type="button" class="tk2-btn dr3-100">Run 100</button><button type="button" class="tk2-link dr3-reset" hidden>Start over</button>';
    var b100 = acts.querySelector('.dr3-100'), bReset = acts.querySelector('.dr3-reset');
    lines.appendChild(cause.el); lines.appendChild(acts);
    stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    var lastSaid = '';
    function say(t){ if(!t || t === lastSaid) return; lastSaid = t; live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }
    var ref = el('div', 'dr3-ref');

    /* ---------------------------------------------------- geometry (picture units = CSS px of the scene) */
    var G = null;
    function layout(){
      var W = sceneBox.clientWidth, H = sceneBox.clientHeight;
      if(!W || !H) return null;
      var g = { W: W, H: H, wide: W >= 900, phone: W < 600 }, pad = g.phone ? 8 : 14, gap = g.phone ? 8 : 14;
      if(g.wide){ var sw = Math.round((W - 2 * pad - gap) * 0.6); g.R = { x: pad, y: pad, w: sw, h: H - 2 * pad }; g.P = { x: pad + sw + gap, y: pad, w: W - pad - (pad + sw + gap), h: H - 2 * pad }; }
      else { var sh = Math.round((H - 2 * pad - gap) * (g.phone ? 0.6 : 0.58)); g.R = { x: pad, y: pad, w: W - 2 * pad, h: sh }; g.P = { x: pad, y: pad + sh + gap, w: W - 2 * pad, h: H - 2 * pad - gap - sh }; }
      // the scene: a band at the top (the A and B key, Randomize and run), then the room
      var R = g.R; R.band = 54; R.ry = R.y + R.band; R.rh = R.h - R.band;
      R.floor = people() ? 44 : 0;
      // the plot: a title row, four rows (each a card and its dots), the axis
      var Pq = g.P; Pq.th = 28; Pq.axH = 50; Pq.top = Pq.y + Pq.th; Pq.bot = Pq.y + Pq.h - Pq.axH; Pq.rh = (Pq.bot - Pq.top) / 4;
      Pq.cardW = g.phone ? 104 : g.wide ? 152 : 142;
      Pq.longNames = Pq.rh >= 76 && !g.phone;
      Pq.l = Pq.x + Pq.cardW + 18; Pq.r = Pq.x + Pq.w - 12;
      Pq.rr = g.phone ? 2.7 : 3.6;
      return g;
    }
    var dom = [0, 1];
    function xv(v){ var q = G.P; return q.l + (v - dom[0]) / (dom[1] - dom[0]) * (q.r - q.l); }
    function vx(x){ var q = G.P; return dom[0] + (x - q.l) / (q.r - q.l) * (dom[1] - dom[0]); }

    /* where each unit sits: plants on two benches, people at four tables */
    var UG = [];   // per unit: { cx, base (soil or table top), w, top, kcm, ... }
    var BG = {};   // benches or tables: { rows: [{ y0, y1, plank }], blocks: [rect], lab }
    var cmMax = 40;
    function unitGeo(){
      var R = G.R, U = S.U, s = sc(); UG = []; BG = { rows: [] };
      if(!people()){
        var rul = G.phone ? 22 : 28, x0 = R.x + 8 + rul + 8, cw = (R.x + R.w - 8 - x0) / s.cols, hi = R.rh / s.rows, pk = G.phone ? 16 : 18;
        var pw = Math.min(cw * 0.7, 58), ph = clamp(pw * 0.78, 17, 42);
        for(var r = 0; r < s.rows; r++){ var y0 = R.ry + r * hi, plank = y0 + hi - pk - 6; BG.rows.push({ y0: y0, y1: y0 + hi, plank: plank, pk: pk }); }
        var room = hi - pk - 6 - ph - 14;
        BG.kcm = room / cmMax; BG.cw = cw; BG.x0 = x0; BG.rul = rul; BG.pw = pw; BG.ph = ph;
        U.forEach(function(u){
          var b = BG.rows[u.row], cx = x0 + (u.col + 0.5) * cw;
          UG.push({ cx: cx, potTop: b.plank - ph, soil: b.plank - ph + 3, plank: b.plank, w: pw, ph: ph, cell: [x0 + u.col * cw, b.y0, cw, b.plank + b.pk - b.y0] });
        });
      } else {
        var aisle = 14, top = R.ry + 4, avail = R.rh - R.floor - aisle - 4, rh = avail / s.rows, gut = 20, x0p = R.x + 6 + gut, cwp = (R.w - 12 - gut) / s.cols, tk = clamp(rh * 0.24, 14, 18);
        for(var q = 0; q < s.rows; q++){ var yy = top + q * rh + (q >= s.lurk.rows[0] ? aisle : 0); BG.rows.push({ y0: yy, y1: yy + rh, plank: yy + rh - tk, pk: tk }); }
        BG.cw = cwp; BG.x0 = x0p; BG.gut = gut; BG.tk = tk; BG.rhp = rh;
        var hr = clamp(Math.min(cwp * 0.15, rh * 0.19), 6, 21);
        U.forEach(function(u){
          var b = BG.rows[u.row], cx = x0p + (u.col + 0.5) * cwp - cwp * 0.08;
          var gh = clamp(rh * 0.62, 18, 64), gw = clamp(cwp * 0.11, 5, 9);
          UG.push({ cx: cx, plank: b.plank, hr: hr, hy: b.plank - hr * 2.4, gx: cx + cwp * 0.3, gw: gw, gh: gh, cell: [x0p + u.col * cwp, b.y0, cwp, b.y1 - b.y0] });
        });
      }
    }

    /* ---------------------------------------------------- the static picture: room, benches or tables, the ruler */
    var UE = [];   // per unit: its elements
    function drawBack(){
      gBack.textContent = ''; gStruct.textContent = ''; gUnits.textContent = ''; UE = [];
      var R = G.R, s = sc();
      mk('rect', 'dr3-panel', { x: R.x, y: R.y, width: R.w, height: R.h, rx: 14 }, gBack);
      var clip = 'dr3clip' + Math.floor(Math.random() * 1e6), defs = svg.querySelector('defs');
      defs.textContent = '';
      var cp = mk('clipPath', null, { id: clip }, defs); mk('rect', null, { x: R.x, y: R.y, width: R.w, height: R.h, rx: 14 }, cp);
      var gb = mk('g', null, { 'clip-path': 'url(#' + clip + ')' }, gBack);
      mk('rect', 'dr3-band', { x: R.x, y: R.y, width: R.w, height: R.band }, gb);
      if(!people()){
        var b0 = BG.rows[0], b1 = BG.rows[1];
        mk('rect', 'dr3-wall', { x: R.x, y: R.ry, width: R.w, height: R.rh }, gb);
        // the window behind the back (sunny) bench: glass panes, the sky, the sun's path
        var wy = R.ry + 6, wh = (b0.plank - R.ry) * 0.62, wx = R.x + 10, ww = R.w - 20;
        mk('rect', 'dr3-sky', { x: wx, y: wy, width: ww, height: wh, rx: 6 }, gb);
        BG.win = { x: wx, y: wy, w: ww, h: wh };
        S.sunEl = mk('circle', 'dr3-sun', { cx: wx + ww * 0.82, cy: wy + wh * 0.38, r: clamp(wh * 0.16, 7, 18) }, gb);
        var panes = Math.max(3, Math.round(ww / 120));
        for(var p = 1; p < panes; p++) mk('rect', 'dr3-mull', { x: wx + ww * p / panes - 1.5, y: wy, width: 3, height: wh }, gb);
        mk('rect', 'dr3-mull', { x: wx, y: wy + wh / 2 - 1.5, width: ww, height: 3 }, gb);
        mk('rect', 'dr3-sill', { x: wx - 4, y: wy + wh - 2, width: ww + 8, height: 6, rx: 2 }, gb);
        // sunlight falls on the back bench only
        mk('path', 'dr3-beam', { d: 'M' + (wx + 6) + ' ' + (wy + wh) + ' L' + (wx + ww - 6) + ' ' + (wy + wh) + ' L' + (R.x + R.w) + ' ' + (b0.plank + b0.pk) + ' L' + R.x + ' ' + (b0.plank + b0.pk) + 'Z' }, gb);
        mk('rect', 'dr3-shade', { x: R.x, y: b1.y0, width: R.w, height: R.y + R.h - b1.y0 }, gb);
        BG.rows.forEach(function(b, r){
          mk('rect', 'dr3-leg', { x: R.x + 22, y: b.plank + b.pk, width: 8, height: 6 }, gb);
          mk('rect', 'dr3-leg', { x: R.x + R.w - 30, y: b.plank + b.pk, width: 8, height: 6 }, gb);
          mk('rect', 'dr3-plank', { x: R.x + 6, y: b.plank, width: R.w - 12, height: b.pk, rx: 3 }, gb);
          mk('rect', 'dr3-plank-top', { x: R.x + 6, y: b.plank, width: R.w - 12, height: 3, rx: 1.5 }, gb);
          // the ruler post at the bench's left end (cm from the soil line)
          var rx = R.x + 10, base = b.plank - BG.ph + 3;
          mk('rect', 'dr3-ruler', { x: rx, y: base - cmMax * BG.kcm - 4, width: BG.rul, height: cmMax * BG.kcm + 4 + (b.plank - base), rx: 2 }, gb);
          for(var c = 0; c <= cmMax; c += 5){
            var yy = base - c * BG.kcm, big = c % 10 === 0;
            mk('line', 'dr3-rtick', { x1: rx + BG.rul - (big ? 9 : 5), x2: rx + BG.rul, y1: yy, y2: yy }, gb);
            if(big && c > 0 && (BG.kcm * 10 >= 22 || c % 20 === 0) && (c < cmMax || BG.kcm * 10 > 24)) mk('text', 'dr3-rnum', { x: rx + 3, y: yy + 4 }, gb).textContent = String(c);
          }
        });
      } else {
        mk('rect', 'dr3-room', { x: R.x, y: R.ry, width: R.w, height: R.rh }, gb);
        mk('rect', 'dr3-floorband', { x: R.x, y: R.y + R.h - R.floor, width: R.w, height: R.floor }, gb);
        // the aisle between the younger tables (front) and the older ones (behind)
        var ay = BG.rows[s.lurk.rows[0]].y0 - 14;
        mk('rect', 'dr3-aisle', { x: R.x, y: ay, width: R.w, height: 14 }, gb);
        BG.rows.forEach(function(b){
          mk('rect', 'dr3-table', { x: R.x + 6, y: b.plank, width: R.w - 12, height: b.pk, rx: 3 }, gb);
          mk('rect', 'dr3-table-top', { x: R.x + 6, y: b.plank, width: R.w - 12, height: 3, rx: 1.5 }, gb);
        });
      }
      // the labels printed on the benches or tables: which group sits there (the lurking variable)
      BG.labs = [];
      if(!people()) [0, 1].forEach(function(r){
        var b = BG.rows[r], u = S.U.filter(function(x){ return x.row === r; })[0];
        var t = mk('text', 'dr3-plab', { x: R.x + 10 + BG.rul + 10, y: b.plank + b.pk / 2 + 4 }, gb);
        BG.labs.push({ el: t, block: u.block });
      });
      else [0, 1].forEach(function(bk){
        var rs = BG.rows.filter(function(b, r){ return S.U.some(function(u){ return u.row === r && u.block === bk; }); });
        var y0 = rs[0].y0 + 2, y1 = rs[rs.length - 1].plank + rs[rs.length - 1].pk, cx = R.x + 6 + BG.gut / 2;
        mk('rect', 'dr3-gutter' + (bk ? ' is-old' : ''), { x: R.x + 6, y: y0, width: BG.gut - 4, height: y1 - y0, rx: 6 }, gb);
        var t = mk('text', 'dr3-glab', { x: cx - 2, y: (y0 + y1) / 2, 'text-anchor': 'middle', transform: 'rotate(-90 ' + n1(cx - 2) + ' ' + n1((y0 + y1) / 2) + ')', dy: '4' }, gb);
        BG.labs.push({ el: t, block: bk });
      });
      // the structure of each design: block frames, pair trays or mats (shown for that design only)
      BG.frames = [0, 1].map(function(bk){
        var rs = BG.rows.filter(function(b, r){ return S.U.some(function(u){ return u.row === r && u.block === bk; }); });
        var y0 = Math.min.apply(null, rs.map(function(b){ return b.y0; })) + 2, y1 = Math.max.apply(null, rs.map(function(b){ return b.plank + b.pk; })) + 3;
        var x0 = BG.x0 - (people() ? 4 : 6);
        return mk('rect', 'dr3-frame', { x: x0, y: y0, width: R.x + R.w - 3 - x0, height: y1 - y0, rx: 10 }, gStruct);
      });
      var pairs = {};
      S.U.forEach(function(u){ (pairs[u.pair] = pairs[u.pair] || []).push(u.i); });
      BG.trays = Object.keys(pairs).map(function(k){
        var p = pairs[k], a = UG[p[0]], b = UG[p[1]];
        if(!people()) return mk('rect', 'dr3-tray', { x: a.cx - BG.pw / 2 - 4, y: a.plank - 4, width: b.cx - a.cx + BG.pw + 8, height: 6, rx: 3 }, gStruct);
        return mk('rect', 'dr3-tray', { x: a.cell[0] + 7, y: a.plank - 2, width: (b.cell[0] + b.cell[2]) - a.cell[0] - 14, height: 5, rx: 2.5 }, gStruct);
      });
      // the units
      S.U.forEach(function(u, i){
        var a = UG[i], g = mk('g', 'dr3-u', null, gUnits), e = { g: g };
        if(!people()){
          e.stem = mk('path', 'dr3-stem', null, g);
          e.leaves = []; for(var k = 0; k < 7; k++) e.leaves.push(mk('path', 'dr3-leaf', null, g));
          e.tip = mk('path', 'dr3-leaf dr3-tip', null, g);
          var pw = a.w, ph = a.ph;
          mk('path', 'dr3-pot', { d: 'M' + (a.cx - pw / 2) + ' ' + a.potTop + ' h ' + pw + ' l ' + (-pw * 0.12) + ' ' + ph + ' h ' + (-pw * 0.76) + ' Z' }, g);
          mk('rect', 'dr3-rim', { x: a.cx - pw / 2 - 2, y: a.potTop - 1, width: pw + 4, height: clamp(ph * 0.2, 4, 7), rx: 2 }, g);
          mk('ellipse', 'dr3-soil', { cx: a.cx, cy: a.potTop + 1, rx: pw / 2 - 1, ry: 2.2 }, g);
          var st = clamp(pw * 0.42, 15, 20);
          e.tag = mk('g', 'dr3-tag', null, g); e.tagR = mk('rect', null, { x: a.cx - st / 2, y: a.potTop + ph * 0.45 - st / 2 + 1, width: st, height: st, rx: 3.5 }, e.tag);
          e.tagT = mk('text', null, { x: a.cx, y: a.potTop + ph * 0.45 + 1 + st * 0.27, 'text-anchor': 'middle' }, e.tag);
          e.tc = [a.cx, a.potTop + ph * 0.45 + 1]; e.st = st;
        } else {
          var hr = a.hr, cx = a.cx, hy = a.hy, old = u.block === 1, sk = hash(i, 5) % 4, hair = old ? 'o' + hash(i, 6) % 2 : String(hash(i, 6) % 4);
          g.setAttribute('class', 'dr3-u dr3-p sk' + sk + ' hr' + hair);
          mk('path', 'dr3-shirt dr3-sh' + hash(i, 7) % 4, { d: 'M' + (cx - hr * 1.7) + ' ' + a.plank + ' Q ' + (cx - hr * 1.7) + ' ' + (hy + hr * 1.25) + ' ' + cx + ' ' + (hy + hr * 1.2) + ' Q ' + (cx + hr * 1.7) + ' ' + (hy + hr * 1.25) + ' ' + (cx + hr * 1.7) + ' ' + a.plank + ' Z' }, g);
          mk('circle', 'dr3-head', { cx: cx, cy: hy, r: hr }, g);
          mk('path', 'dr3-hair', { d: 'M' + (cx - hr * 1.04) + ' ' + (hy + 1) + ' A ' + hr * 1.04 + ' ' + hr * 1.04 + ' 0 0 1 ' + (cx + hr * 1.04) + ' ' + (hy + 1) + ' Q ' + (cx + hr * 0.3) + ' ' + (hy - hr * (old ? 0.25 : 0.6)) + ' ' + (cx - hr * 1.04) + ' ' + (hy + 1) + ' Z' }, g);
          if(old && hash(i, 8) % 2) mk('path', 'dr3-glasses', { d: 'M' + (cx - hr * 0.72) + ' ' + (hy + hr * 0.15) + ' h ' + hr * 0.5 + ' M ' + (cx + hr * 0.22) + ' ' + (hy + hr * 0.15) + ' h ' + hr * 0.5 + ' M ' + (cx - hr * 0.22) + ' ' + (hy + hr * 0.15) + ' h ' + hr * 0.44 }, g);
          // the recall score: a gauge beside the person, filled to words out of 30
          e.gO = mk('rect', 'dr3-gauge', { x: a.gx - a.gw / 2, y: (a.plank - a.gh).toFixed(2), width: a.gw, height: a.gh.toFixed(2), rx: 2 }, g);
          e.gF = mk('rect', 'dr3-gfill', { x: a.gx - a.gw / 2, y: a.plank, width: a.gw, height: 0, rx: 2 }, g);
          var st2 = clamp(BG.cw * 0.26, 15, 19);
          e.tag = mk('g', 'dr3-tag', null, g); e.tagR = mk('rect', null, { x: cx - hr * 1.7 - st2 * 0.35, y: a.plank - st2 * 0.55, width: st2, height: st2, rx: 3.5 }, e.tag);
          e.tagT = mk('text', null, { x: cx - hr * 1.7 - st2 * 0.35 + st2 / 2, y: a.plank - st2 * 0.55 + st2 * 0.5 + st2 * 0.27, 'text-anchor': 'middle' }, e.tag);
          e.tc = [cx - hr * 1.7 - st2 * 0.35 + st2 / 2, a.plank - st2 * 0.05]; e.st = st2;
          // the pill on the table in front of the person: alike when blind; the caffeine pill looks different when not
          e.pill = mk('rect', 'dr3-pill', { x: cx - 6, y: a.plank + BG.tk / 2 - 3, width: 12, height: 6, rx: 3 }, g);
        }
        UE.push(e);
      });
      drawHand();
    }
    /* the dealing hand: a sleeve, a hand pinching the sticker it is about to place */
    var HE = null;
    function drawHand(){
      gHand.textContent = '';
      var s = G.phone ? 0.85 : G.wide ? 1.3 : 1.1, g = mk('g', 'dr3-handg', { 'aria-hidden': 'true' }, gHand);
      var inner = mk('g', null, { transform: 'scale(' + s + ')' }, g);
      mk('path', 'dr3-sleeve', { d: 'M 6 -58 L 26 -58 L 22 -30 L 4 -30 Z' }, inner);
      mk('path', 'dr3-palm', { d: 'M 2 -32 Q 0 -18 6 -10 L 12 -6 Q 18 -8 22 -16 L 24 -32 Z' }, inner);
      mk('path', 'dr3-finger', { d: 'M 6 -12 Q 2 -4 4 2 Q 7 4 9 0 L 11 -8 Z' }, inner);
      var t = mk('g', 'dr3-tag dr3-htag', null, inner);
      mk('rect', null, { x: -3, y: -2, width: 17, height: 17, rx: 3.5 }, t);
      var tt = mk('text', null, { x: 5.5, y: 10.6, 'text-anchor': 'middle' }, t);
      HE = { g: g, tag: t, t: tt, s: s };
      g.style.display = 'none';
    }

    /* ---------------------------------------------------- the plot of estimates: cards, rows, the truth, the axis */
    var PE = null, taps = [];
    function drawPlot(){
      gPlot.textContent = ''; gLabs.textContent = '';
      var q = G.P, s = sc();
      PE = { rows: [], cards: [] };
      mk('rect', 'dr3-pbg', { x: q.x, y: q.y, width: q.w, height: q.h, rx: 14 }, gPlot);
      PE.title = mk('text', 'dr3-ptitle', { x: q.x + 12, y: q.y + 19 }, gLabs); var t0 = 'Mean A − mean B (' + unitOf() + ')', t1 = t0 + ', one dot per run';
      PE.title.textContent = tw(t1, 13.5, 900) + tw('not blind', 11.5, 800) + 48 <= q.w ? t1 : t0;
      PE.ubKey = mk('g', 'dr3-ubkey', null, gLabs);
      var kc = mk('circle', 'dr3-dot is-ub', { cx: 0, cy: -4, r: 4 }, PE.ubKey), kt = mk('text', 'dr3-ubk', { x: 8, y: 0 }, PE.ubKey); kt.textContent = 'not blind';
      PE.ubKey.setAttribute('transform', 'translate(' + (q.x + q.w - 12 - tw('not blind', 11.5, 800) - 8) + ' ' + (q.y + 19) + ')');
      DES.forEach(function(d, k){
        var y0 = q.top + k * q.rh, base = y0 + q.rh - 9;
        if(k) mk('line', 'dr3-rsep', { x1: q.x + 8, x2: q.x + q.w - 8, y1: y0, y2: y0 }, gPlot);
        var card = mk('rect', 'dr3-card', { x: q.x + 6, y: y0 + 3, width: q.cardW, height: q.rh - 6, rx: 10 }, gPlot);
        var names = dname(d, q.longNames), fs = G.phone ? 12.5 : 13.5;
        while(fs > 11.5 && Math.max.apply(null, names.map(function(nm){ return tw(nm, fs, 900); })) > q.cardW - 18) fs -= 0.5;
        var lh = Math.ceil(fs * 1.36) + 3;
        var nl = names.length + (G.phone ? 0 : 1), cy = y0 + q.rh / 2 - (nl - 1) * lh / 2 + 4;
        var tn = names.map(function(nm, j){ var t = mk('text', 'dr3-cname', { x: q.x + 16, y: cy + j * lh }, gLabs); t.textContent = nm; t.style.fontSize = fs + 'px'; return t; });
        var cnt = mk('text', 'dr3-ccount', { x: q.x + 16, y: cy + names.length * lh }, gLabs);
        if(G.phone) cnt.style.display = 'none';   // a phone's card has room for the name only; the count is in the cause line and "?"
        var mark = mk('path', 'dr3-centre', null, gPlot);
        PE.rows.push({ d: d, y0: y0, base: base, card: card, names: tn, cnt: cnt, mark: mark });
      });
      // the axis, its numbers and the truth
      var ax = q.bot;
      mk('line', 'dr3-axis', { x1: q.l - 4, x2: q.r + 4, y1: ax, y2: ax }, gPlot);
      var tx = xv(trueEff());
      PE.truth = mk('rect', 'dr3-truth', { x: tx - 1.25, y: q.top - 2, width: 2.5, height: ax - q.top + 27 }, gPlot);
      var tl = 'true ' + fx(trueEff(), 1) + ' ' + unitOf(), tlw = tw(tl, 12.5, 900) + 16;
      var pg = mk('g', 'dr3-tpill', null, gLabs), tx0 = clamp(tx - tlw / 2, q.l - 6, q.r + 6 - tlw);
      mk('rect', null, { x: tx0, y: ax + 25, width: tlw, height: 20, rx: 10 }, pg);
      mk('text', null, { x: tx0 + tlw / 2, y: ax + 39, 'text-anchor': 'middle' }, pg).textContent = tl;
      var ticks = P && P.ticks ? P.ticks(dom[0], dom[1], G.phone ? 5 : 7) : [dom[0], dom[1]];
      ticks.forEach(function(v){
        var x = xv(v); if(x < q.l - 1 || x > q.r + 1) return;
        mk('line', 'dr3-tick', { x1: x, x2: x, y1: ax, y2: ax + 4 }, gPlot);
        var s2 = String(+v.toFixed(2)).replace(/^-/, '−'), w2 = tw(s2, 11.5, 700);
        if(Math.abs(x - tx) < w2 / 2 + 4) return;   // the truth's own pill says that value
        mk('text', 'dr3-tk', { x: x, y: ax + 17, 'text-anchor': 'middle' }, gLabs).textContent = s2;
      });
      // the cards are the design control: a tap button over each
      taps.forEach(function(t){ t.el.remove(); });
      taps = DES.map(function(d, k){
        var rw = PE.rows[k];
        var t = K.tap(layer, { key: k ? null : 'apstat-design-randomizer-card', label: 'Design: ' + (d === 'none' ? sc().noneCard + ' (no random assignment)' : { cr: 'completely randomized', block: 'randomized block', pairs: 'matched pairs' }[d]), box: [q.x + 6, rw.y0 + 3, q.cardW, q.rh - 6], pressed: d === S.design, chip: false, onClick: function(){ setDesign(d); } });
        t.el.classList.add('dr3-ctap');
        return t;
      });
      // the dots already run keep their values; their elements are made again
      gDots.textContent = '';
      DES.forEach(function(d){ rows[d].forEach(function(o){ o.el = null; o._k = null; }); });
    }

    /* ---------------------------------------------------- the dots */
    function dotEl(o){ var e = mk('circle', 'dr3-dot' + (o.ub ? ' is-ub' : ''), { r: G.P.rr }, gDots); o.el = e; return e; }
    function rowStack(d){
      // place every landed dot of a row: bins of one dot width, stacked up from the row's base
      var q = G.P, rw = PE.rows[DES.indexOf(d)], list = rows[d], rr = q.rr, bw = rr * 2 + 0.8, cnt = {}, maxC = 1;
      list.forEach(function(o){ o.bin = Math.floor((xv(o.v) - q.l) / bw); });
      list.forEach(function(o){ if(o.land){ cnt[o.bin] = (cnt[o.bin] || 0) + 1; maxC = Math.max(maxC, cnt[o.bin]); } });
      var room = rw.base - (rw.y0 + 6) - rr * 2, stp = Math.min(rr * 2 + 0.6, room / Math.max(1, maxC - 1 + 0.001));
      var seen = {};
      list.forEach(function(o){ var lv = o.land ? (seen[o.bin] = (seen[o.bin] || 0) + 1) - 1 : (cnt[o.bin] || 0) + ((seen['f' + o.bin] = (seen['f' + o.bin] || 0) + 1) - 1); o.lvl = lv; o.ty = rw.base - rr - Math.min(lv, maxC + 2) * stp; });
      return stp;
    }

    /* ---------------------------------------------------- the experiment */
    function newRun(fast){
      var tr = D.assign(rng, S.U, S.design, sc()), ub = !!sc().placebo && !S.blind;
      var res = D.run(rng, S.U, tr, sc(), { unblind: ub });
      var order = D.dealOrder(rng, S.U, tr, S.design);
      return { tr: tr, res: res, order: order, design: S.design, ub: ub, fast: !!fast, dropped: false, done: false };
    }
    function addDot(v, ub, t0, dur, last){
      var o = { v: v, ub: ub, t0: t0, dur: dur, land: dur <= 0, el: null, last: !!last };
      rows[S.design].push(o);
      return o;
    }
    function go(){
      if(S.mode !== 'explore') return;
      hideCue(true); tourDid('run');
      finishRun(); S.sel = -1;
      run = newRun(false);
      var t = now(), N = S.U.length;
      run.t0 = t; run.per = (people() ? 1500 : 1500) / N;
      drawn.placed = 0; S.U.forEach(function(u, i){ drawn.tag[i] = null; });
      fresh(false);
      if(calm()){ run.dropped = true; run.done = true; run.dot = addDot(run.res.diff, run.ub, t, 0, true); fade(); markLast(run.dot); paint(now()); settled(); return; }
      scrollIn();
      kick();
    }
    function hundred(){
      if(S.mode !== 'explore') return;
      hideCue(true); tourDid('100');
      finishRun(); S.sel = -1;
      var t = now(), last = null, k;
      for(k = 0; k < 100; k++){ last = newRun(true); var o = addDot(last.res.diff, last.ub, t + k * 13, calm() ? 0 : FALL, k === 99); if(k === 99) last.dot = o; }
      run = last; run.dropped = true; run.done = true; run.t0 = t;
      fade();
      markLast(run.dot);
      scrollIn();
      if(calm()){ paint(now()); settled(); } else kick();
    }
    function markLast(o){ DES.forEach(function(d){ rows[d].forEach(function(x){ if(x !== o) x.last = false; }); }); if(o) o.last = true; }
    /* a run in the middle of dealing or growing is dropped (a new bench comes in); a dot already falling lands */
    function finishRun(){
      if(run && !run.fast && !run.dropped){ run = null; }
      DES.forEach(function(d){ rows[d].forEach(function(o){ o.land = true; }); });
      if(run){ run.done = true; }
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
    }
    function fresh(withFade){ if(withFade) fade(); }
    function fade(){ sceneBox.classList.remove('is-fade'); void sceneBox.offsetWidth; sceneBox.classList.add('is-fade'); }
    function scrollIn(){
      var r = sceneBox.getBoundingClientRect();
      if(r.top < 0 || r.top > (window.innerHeight || 800) * 0.5) try{ sceneBox.scrollIntoView({ block: 'start', behavior: calm() ? 'auto' : 'smooth' }); }catch(e){}
    }

    /* ---------------------------------------------------- one clock for every animation */
    function busy(){ if(run && !run.done) return true; return DES.some(function(d){ return rows[d].some(function(o){ return !o.land; }); }); }
    function kick(){ if(!raf && !calm()) raf = requestAnimationFrame(frame); }
    function frame(){ raf = 0; var t = now(); step(t); paint(t); if(busy()) kick(); else settled(); }
    function step(t){
      if(run && !run.fast && !run.done){
        var N = S.U.length, td = t - run.t0, tg0 = N * run.per + 220;
        if(td >= tg0 + GROW + 120 && !run.dropped){ run.dropped = true; run.dot = addDot(run.res.diff, run.ub, t, FALL, true); markLast(run.dot); }
        if(run.dropped && run.dot && run.dot.land) run.done = true;
      }
      DES.forEach(function(d){ rows[d].forEach(function(o){ if(!o.land && t >= o.t0 + o.dur) o.land = true; }); });
    }

    /* ---------------------------------------------------- paint: the picture from the state at time t */
    function heightAt(i, g){ var s = sc(), y = run ? run.res.y[i] : null; var h0 = s.decimals === 0 ? 0 : 5; if(y == null) return h0; return h0 + (y - h0) * g; }
    function paint(t){
      if(!G) return;
      var N = S.U.length, s = sc(), td = run && !run.fast && !run.done ? t - run.t0 : Infinity;
      // the deal: stickers placed one by one, the hand travelling between them
      var placed = !run ? 0 : run.fast || run.done ? N : Math.min(N, Math.floor(td / run.per));
      var tg0 = run ? N * run.per + 220 : 0, g = !run ? 0 : run.fast || run.done ? 1 : clamp((td - tg0) / GROW, 0, 1);
      g = easeIO(g);
      drawn.placed = 0;
      S.U.forEach(function(u, i){
        var e = UE[i], k = run ? run.order.indexOf(i) : -1, on = run && k > -1 && k < placed, letter = on ? run.tr[i] : null;
        var age = on && !(run.fast || run.done) ? clamp((td - (k + 1) * run.per) / 140, 0, 1) : 1;
        if(on && age >= 1) drawn.placed++;
        drawn.tag[i] = on && age >= 1 ? letter : null;
        var cls = 'dr3-tag' + (letter ? ' is-' + letter : '');
        if(e.tag.getAttribute('class') !== cls) e.tag.setAttribute('class', cls);
        e.tag.style.display = on ? '' : 'none';
        if(on){ txt(e.tagT, letter); var sc2 = 0.4 + 0.6 * easeOut(age); at(e.tag, { transform: sc2 >= 1 ? '' : 'translate(' + n1(e.tc[0] * (1 - sc2)) + ' ' + n1(e.tc[1] * (1 - sc2)) + ') scale(' + (Math.round(sc2 * 100) / 100) + ')' }); }
        if(!people()) paintPlant(i, heightAt(i, g));
        else paintPerson(i, run && g > 0 ? run.res.y[i] * g : null, on && run && run.ub && letter === 'A', on);
        e.g.classList.toggle('is-sel', S.sel === i);
      });
      drawn.g = g;
      // the hand
      if(run && !run.fast && !run.done && placed < N){
        var kk = placed, to = UE[run.order[kk]].tc, from = kk ? UE[run.order[kk - 1]].tc : [G.R.x + G.R.w - 30, G.R.y + 8];
        var fr = clamp((td - kk * run.per) / (run.per * 0.8), 0, 1), e2 = easeIO(fr);
        var hx = from[0] + (to[0] - from[0]) * e2, hy = from[1] + (to[1] - from[1]) * e2 - 6 * Math.sin(Math.PI * e2);
        HE.g.style.display = '';
        at(HE.g, { transform: 'translate(' + n1(hx - 5.5 * HE.s) + ' ' + n1(hy - 8 * HE.s) + ')' });
        var nl = run.tr[run.order[kk]]; txt(HE.t, nl); var hc = 'dr3-tag dr3-htag is-' + nl; if(HE.tag.getAttribute('class') !== hc) HE.tag.setAttribute('class', hc);
      } else HE.g.style.display = 'none';
      // the sun crosses the window while the plants grow
      if(S.sunEl && BG.win){ var w = BG.win, sx = run && !run.fast && !run.done && g > 0 ? w.x + w.w * (0.12 + 0.76 * g) : w.x + w.w * 0.82; at(S.sunEl, { cx: sx }); }
      // the structure for the design in use
      var d = S.design;
      BG.frames.forEach(function(f){ f.classList.toggle('is-on', d === 'block'); });
      BG.trays.forEach(function(f){ f.classList.toggle('is-on', d === 'pairs'); });
      BG.labs.forEach(function(l, j){ txt(l.el, (d === 'block' ? 'Block ' + (j + 1) + ': ' : '') + (people() ? (l.block ? 'Older' : 'Younger') : (l.block ? 'Sunny row' : 'Shady row'))); });
      paintSel();
      paintDots(t);
      words();
    }
    function paintPlant(i, hcm){
      var e = UE[i], a = UG[i], hp = hcm * BG.kcm, base = a.soil, top = base - hp;
      var dd = 'M' + n1(a.cx) + ' ' + base.toFixed(2) + ' V ' + top.toFixed(2); if(e.stem.getAttribute('d') !== dd) e.stem.setAttribute('d', dd);
      e.hpx = hp;
      var nL = clamp(Math.round(hp / 15), 1, 7), L = clamp(a.w * 0.34 + hp * 0.07, 6, 30);
      e.leaves.forEach(function(lf, k){
        if(k >= nL){ if(lf.style.display !== 'none') lf.style.display = 'none'; return; }
        if(lf.style.display) lf.style.display = '';
        var ly = base - (k + 0.7) * hp / (nL + 0.5), side = k % 2 ? 1 : -1, len = L * (1 - k * 0.06);
        at(lf, { d: 'M' + n1(a.cx) + ' ' + n1(ly) + ' q ' + n1(side * len * 0.55) + ' ' + n1(-len * 0.55) + ' ' + n1(side * len) + ' ' + n1(-len * 0.12) + ' q ' + n1(-side * len * 0.45) + ' ' + n1(len * 0.42) + ' ' + n1(-side * len) + ' ' + n1(len * 0.12) + ' Z' });
      });
      var tl = clamp(L * 0.5, 4, 8);
      at(e.tip, { d: 'M' + n1(a.cx) + ' ' + n1(top + 1) + ' q ' + n1(-tl) + ' ' + n1(-tl) + ' 0 ' + n1(-tl * 1.8) + ' q ' + n1(tl) + ' ' + n1(tl * 0.8) + ' 0 ' + n1(tl * 1.8) + ' Z' });
      drawn.h[i] = hp / BG.kcm;
    }
    function paintPerson(i, words, knows, on){
      var e = UE[i], a = UG[i];
      e.gO.style.display = words == null ? 'none' : '';
      var fh = words == null ? 0 : words / 30 * a.gh;
      var fy = (a.plank - fh).toFixed(2), fhs = fh.toFixed(2); if(e.gF.getAttribute('height') !== fhs){ e.gF.setAttribute('y', fy); e.gF.setAttribute('height', fhs); }
      e.gF.style.display = words == null ? 'none' : '';
      drawn.h[i] = words == null ? null : fh / a.gh * 30;
      var pc = 'dr3-pill' + (knows ? ' is-caf' : '');
      if(e.pill.getAttribute('class') !== pc) e.pill.setAttribute('class', pc);
      e.pill.style.display = on ? '' : 'none';
    }
    function paintSel(){
      gSel.textContent = '';
      if(S.sel < 0 || !UG[S.sel]) return;
      var c = UG[S.sel].cell;
      mk('rect', 'dr3-selb', { x: c[0] + 2, y: c[1] + 2, width: c[2] - 4, height: c[3] - 2, rx: 8 }, gSel);
    }
    function paintDots(t){
      DES.forEach(function(d, k){
        var rw = PE.rows[k], list = rows[d];
        rowStack(d);
        var top = rw.y0 + 4, nLand = 0, sum = 0;
        list.forEach(function(o){
          var e = o.el || dotEl(o), x = xv(o.v), y;
          if(o.land){ y = o.ty; nLand++; sum += o.v; }
          else { var f = clamp((t - o.t0) / o.dur, 0, 1); y = f <= 0 ? -100 : top + (o.ty - top) * easeIO(f); }
          var k2 = n1(x) + '|' + n1(y) + '|' + o.last + '|' + (f <= 0 && !o.land);
          if(o._k !== k2){ o._k = k2; at(e, { cx: x, cy: y }); e.style.display = !o.land && y < 0 ? 'none' : ''; e.classList.toggle('is-last', o.last && o.land); }
        });
        txt(rw.cnt, nLand === 1 ? '1 run' : nLand + ' runs');
        rw.cntN = nLand;
        rw.mean = nLand ? sum / nLand : null;
        if(nLand >= 5){ var mx = xv(rw.mean); at(rw.mark, { d: 'M' + n1(mx) + ' ' + n1(rw.base + 1) + ' l -5 7 h 10 Z' }); rw.mark.style.display = ''; }
        else rw.mark.style.display = 'none';
        var on = d === S.design;
        rw.card.classList.toggle('is-on', on);
        rw.names.forEach(function(n){ n.classList.toggle('is-on', on); });
        if(taps[k]) taps[k].pressed(on);
      });
      var anyUb = DES.some(function(d){ return rows[d].some(function(o){ return o.ub && o.land; }); });
      PE.ubKey.style.display = anyUb ? '' : 'none';
    }
    /* a row's landed values (from the drawn dots) */
    function landed(d){ return rows[d].filter(function(o){ return o.land; }); }
    function rowStats(d, ubOnly){
      var v = landed(d).filter(function(o){ return ubOnly == null || o.ub === ubOnly; }).map(function(o){ return o.v; });
      if(!v.length) return null;
      var m = D.mean(v); return { n: v.length, mean: m, sd: v.length > 1 ? D.sd(v) : 0 };
    }

    /* ---------------------------------------------------- the cause line, read from the picture */
    function balance(){
      // from the drawn stickers: how the second block (sunny pots, older volunteers) split between A and B
      var a = 0, b = 0;
      S.U.forEach(function(u, i){ if(u.block !== 1) return; if(drawn.tag[i] === 'A') a++; else if(drawn.tag[i] === 'B') b++; });
      return { a: a, b: b };
    }
    function drawnEst(){
      // mean A minus mean B of the heights or scores as drawn, once every sticker is down and the growth is done
      if(!run || drawn.placed < S.U.length || drawn.g < 1) return null;
      var A = [], B = [];
      S.U.forEach(function(u, i){ var h = drawn.h[i]; if(h == null) return; (drawn.tag[i] === 'A' ? A : B).push(h); });
      if(!A.length || !B.length) return null;
      return D.mean(A) - D.mean(B);
    }
    function words(){
      var s = sc(), N = S.U.length, parts = [], u;
      if(S.sel > -1){
        u = S.U[S.sel];
        parts.push({ t: cap(s.unit) + ' ' + u.label, role: 'ink' });
        parts.push({ t: (people() ? (u.block ? 'older' : 'younger') + ', age ' + u.age : (u.block ? 'sunny row' : 'shady row')), role: 'lurk' });
        if(drawn.tag[S.sel]) parts.push({ t: drawn.tag[S.sel] + ': ' + (drawn.tag[S.sel] === 'A' ? s.tAs : s.tBs).toLowerCase(), role: drawn.tag[S.sel] === 'A' ? 'a' : 'b' });
        if(drawnEst() != null && drawn.h[S.sel] != null) parts.push({ t: fx(drawn.h[S.sel], s.decimals) + ' ' + unitOf(), role: 'est' });
        cause.set(parts); return;
      }
      var dn = dshort(S.design), bal = balance(), lw = lurkWord(1);
      if(!run){
        parts = S.design === 'none' ? [{ t: dn, role: 'des' }, { t: 'estimate: mean A − mean B', role: 'est' }] : [{ t: dn, role: 'des' }, { t: 'chance deals A and B', role: 'ink' }, { t: 'mean A − mean B', role: 'est' }];
        if(take()) return;
        cause.set(parts); return;
      }
      if(!run.fast && drawn.placed < N){ cause.set([{ t: dn, role: 'des' }, { t: (S.design === 'none' ? 'picked ' : 'dealt by chance ') + drawn.placed + ' of ' + N, role: 'ink' }]); return; }
      var est = drawnEst(), rowN = (PE.rows[DES.indexOf(run.design)] || {}).cntN || 0;
      parts.push({ t: dn, role: 'des' });
      parts.push({ t: lw + ': ' + bal.a + ' A, ' + bal.b + ' B', role: 'lurk' });
      if(est == null){ parts.push({ t: people() ? 'taking the test' : 'week ' + Math.max(1, Math.ceil(drawn.g * 4)), role: 'ink' }); cause.set(parts); return; }
      if(busy()){ parts.push({ t: 'estimate ' + fx(est, 1) + ' ' + unitOf(), role: 'est' }); cause.set(parts); return; }
      var st = rowStats(run.design);
      if(run.fast || rowN >= 20){
        var sub = st && run.ub !== undefined ? rowStats(run.design, run.ub) : st, bias = sub ? biased(sub) : 0;
        if(take()) return;
        cause.set([{ t: dn, role: 'des' }, { t: sub.n + ' runs' + (sc().placebo ? (run.ub ? ', not blind' : ', blind') : ''), role: 'ink' }, { t: 'centred ' + fx(sub.mean, 1) + ' ' + unitOf(), role: bias ? 'bias' : 'est' }, { t: 'true ' + fx(trueEff(), 1) + (bias ? ': biased' : ''), role: 'tru' }]);
        return;
      }
      parts.push({ t: 'estimate ' + fx(est, 1) + ' ' + unitOf(), role: 'est' });
      parts.push({ t: 'true ' + fx(trueEff(), 1), role: 'tru' });
      if(take()) return;
      cause.set(parts);
    }
    /* centred off the truth: more than three standard errors and a third of a unit */
    function biased(st){ if(!st || st.n < 10) return 0; var off = st.mean - trueEff(); return Math.abs(off) > 3 * st.sd / Math.sqrt(st.n) && Math.abs(off) > 0.3 ? (off > 0 ? 1 : -1) : 0; }
    /* the takeaway, once each, when the picture at rest shows it */
    var shownTake = null;
    function take(){
      if(shownTake){ cause.take(shownTake); return true; }
      return false;
    }
    function settled(){
      if(!run || busy()) { words(); return; }
      var s = sc(), d = run.design, st = rowStats(d, s.placebo ? run.ub : null), cr = rowStats('cr', s.placebo ? false : null), t = null, k = null;
      if(st && st.n >= 20){
        if(run.ub && st.n >= 20 && biased(st) > 0){ k = 'ub'; t = s.unblindTake; }
        else if(d === 'none' && biased(st)){ k = 'none'; t = s.noneTake; }
        else if(d === 'cr' && !biased(st)){ k = 'cr'; t = 'Random assignment centres the estimates on the true effect.'; }
        else if((d === 'block' || d === 'pairs') && !biased(st) && cr && cr.n >= 20 && st.sd < cr.sd * 0.85){ k = d; t = d === 'block' ? 'Blocking by ' + s.lurk.what + ' makes the estimates vary less around the truth.' : 'Pairing similar ' + s.units + ' makes the estimates vary less around the truth.'; }
      }
      shownTake = null;
      if(t && !S.took[s.id + ':' + k]){ S.took[s.id + ':' + k] = true; shownTake = t; }
      words();
      if(shownTake){ cause.take(shownTake); }
      var est = drawnEst();
      if(est != null) say(cause.text ? (shownTake || cause.text()) : '');
      bReset.hidden = !DES.some(function(x){ return rows[x].length; });
      refHtml();
    }

    /* ---------------------------------------------------- the controls */
    function setDesign(d){
      if(S.mode !== 'explore') return;
      hideCue(true); tourDid('card');
      if(d === S.design && !run) return;
      finishRun(); run = null; shownTake = null; S.sel = -1;
      S.design = d; fade(); paint(now()); settled();
      say('Design: ' + dshort(d) + '.');
    }
    function setBlind(on){
      finishRun(); run = null; shownTake = null; S.blind = on; fade(); syncBlind(); paint(now()); settled();
      say(on ? 'Blind: the pills look alike.' : 'Not blind: the volunteers know which pill they took.');
    }
    function syncBlind(){
      bBlind.hidden = !sc().placebo;
      bBlind.setAttribute('aria-pressed', String(S.blind));
      bBlind.innerHTML = '<span class="dr3-sw" aria-hidden="true"></span><span>' + (S.blind ? 'Blind' : 'Not blind') + '</span>';
      bBlind.setAttribute('aria-label', 'Blind: the pills look alike and the volunteers do not know which one they took');
    }
    function domain(){
      var r0 = M.rng(31), all = [trueEff()], s = sc();
      DES.forEach(function(d){ [false, true].forEach(function(ub){ if(ub && !s.placebo) return; all = all.concat(D.many(r0, S.U, d, s, 120, { unblind: ub }).diffs); }); });
      var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all), tk = P && P.ticks ? P.ticks(lo, hi, 6) : [lo, hi], stp = tk.length > 1 ? tk[1] - tk[0] : 1;
      dom = [Math.floor(lo / stp) * stp, Math.ceil(hi / stp) * stp];
    }
    function setScene(i){
      finishRun(); run = null; shownTake = null; S.sel = -1;
      S.sc = SCN[i] || SCN[0]; S.U = D.units(S.sc); S.blind = true;
      DES.forEach(function(d){ rows[d] = []; });
      var b0 = S.U.map(function(u){ return u.base; });
      cmMax = people() ? 30 : Math.ceil((Math.max.apply(null, b0) + S.sc.effect + 4) / 5) * 5;
      domain(); syncBlind();
      drawn.tag = []; drawn.h = [];
      if(G){ relayout(true); fade(); }
      settled();
    }
    function startOver(){ finishRun(); run = null; shownTake = null; S.sel = -1; DES.forEach(function(d){ rows[d] = []; }); gDots.textContent = ''; fade(); paint(now()); settled(); say('Start over: no runs yet.'); }
    function select(i, how){
      S.sel = i == null ? -1 : i;
      paint(now());
      if(S.sel > -1) say(cause.text());
    }

    /* ---------------------------------------------------- the first visit cue (at Randomize and run) and "Show me how" */
    var cueO = { key: 'apstat-design-randomizer', text: 'Start here', side: 'below',
      at: function(){ var a = sceneBox.getBoundingClientRect(), b = bGo.getBoundingClientRect(), k = layer.scale() || 1; return [(b.left - a.left + b.width / 2) / k, (b.bottom - a.top + 4) / k]; } };
    var cue = K.cue(layer, cueO);
    function hideCue(used){ if(cue.active()) cue.hide(used); }
    function cueShow(){ if(S.mode !== 'explore' || run || DES.some(function(d){ return rows[d].length; })) return; cue.show(); }
    var tour = K.tour({ key: 'apstat-design-randomizer', label: 'Show me how', steps: [
      { id: 'card', text: 'Pick a design on its card. Each card is a row for that design’s estimates.', target: function(){ return taps[0] ? taps[0].el : sceneBox; } },
      { id: 'run', text: 'Randomize and run: chance deals A and B, the experiment runs, and its estimate drops into the row.', target: function(){ return bGo; } },
      { id: '100', text: 'Run 100 to see where a design’s estimates centre and how much they spread.', target: function(){ return b100; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(x){ if(tour.active()) tour.did(x); }
    function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tour.start(true); }

    bGo.addEventListener('click', function(){ go(); });
    b100.addEventListener('click', function(){ hundred(); });
    bReset.addEventListener('click', function(){ startOver(); });
    bBlind.addEventListener('click', function(){ hideCue(true); setBlind(!S.blind); });
    pick.addEventListener('change', function(){ setScene(+pick.value); });
    stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End)/.test(e.key)) hideCue(true); }, true);
    // tap a unit: the nearest drawn unit under the finger answers
    function nearestUnit(cx, cy){
      var r = sceneBox.getBoundingClientRect(), k = layer.scale() || 1, x = (cx - r.left) / k, y = (cy - r.top) / k, best = -1, bd = Infinity;
      UG.forEach(function(a, i){ var c = a.cell; if(x < c[0] || x > c[0] + c[2] || y < c[1] || y > c[1] + c[3] + 4) return; var dx = x - (c[0] + c[2] / 2), dy = y - (c[1] + c[3] / 2), dd = dx * dx + dy * dy; if(dd < bd){ bd = dd; best = i; } });
      return best;
    }
    pickBox.addEventListener('click', function(e){ hideCue(true); var i = nearestUnit(e.clientX, e.clientY); select(i === S.sel ? -1 : i, 'tap'); });
    pickBox.addEventListener('keydown', function(e){
      var n = S.U.length;
      if(e.key === 'ArrowRight' || e.key === 'ArrowDown'){ e.preventDefault(); select(S.sel < 0 ? 0 : (S.sel + 1) % n, 'key'); }
      else if(e.key === 'ArrowLeft' || e.key === 'ArrowUp'){ e.preventDefault(); select(S.sel < 0 ? n - 1 : (S.sel - 1 + n) % n, 'key'); }
      else if(e.key === 'Escape'){ select(-1, 'key'); }
    });

    /* ---------------------------------------------------- layout and full redraws */
    function placeControls(){
      var R = G.R, k = 1, bw = Math.min(tw('Randomize and run', G.phone ? 15 : 16, 900) + 40, R.w - 20);
      goWrap.style.left = (R.x + R.w - 8 - bw) + 'px'; goWrap.style.top = (R.y + (R.band - 44) / 2) + 'px'; goWrap.style.width = bw + 'px';
      if(sc().placebo){ bBlind.style.left = (R.x + 10) + 'px'; bBlind.style.top = (R.y + R.h - R.floor + (R.floor - 34) / 2) + 'px'; }
      var r0 = BG.rows[0], rl = BG.rows[BG.rows.length - 1];
      pickBox.style.left = (BG.x0 - 4) + 'px'; pickBox.style.top = r0.y0 + 'px'; pickBox.style.width = (R.x + R.w - BG.x0) + 'px'; pickBox.style.height = (rl.plank + rl.pk - r0.y0) + 'px';
      if(cue.active()) cue.place();
    }
    var KEY = null;
    function drawKey(){
      // the A and B key in the band: a sticker and the treatment's name
      var R = G.R, s = sc(), x = R.x + 10, y = R.y + R.band / 2, long = !G.phone, fsK = G.phone ? 12.5 : 13.5;
      KEY = [];
      // side by side when they fit beside the button, else one above the other
      var bw = Math.min(tw('Randomize and run', G.phone ? 15 : 16, 900) + 40, R.w - 20), room = R.w - 8 - bw - 10 - 10;
      var nA = long ? s.tA : s.tAs, nB = long ? s.tB : s.tBs, wide2 = 24 + tw(nA, fsK, 800) + (G.phone ? 12 : 18) + 24 + tw(nB, fsK, 800);
      var stack = wide2 > room;
      ['A', 'B'].forEach(function(L, j){
        if(stack){ x = R.x + 10; y = R.y + R.band / 2 + (j ? 11 : -11); }
        var name = long ? (L === 'A' ? s.tA : s.tB) : (L === 'A' ? s.tAs : s.tBs), g = mk('g', 'dr3-key', null, gLabs);
        var tg = mk('g', 'dr3-tag is-' + L, null, g);
        mk('rect', null, { x: x, y: y - 9, width: 18, height: 18, rx: 3.5 }, tg);
        mk('text', null, { x: x + 9, y: y + 4.5, 'text-anchor': 'middle' }, tg).textContent = L;
        var t = mk('text', 'dr3-keyt', { x: x + 24, y: y + 4.5 }, g); t.textContent = name;
        KEY.push(g);
        x += 24 + tw(name, fsK, 800) + (G.phone ? 12 : 18);
      });
    }
    function relayout(force){
      var g = layout(); if(!g) return;
      var key = g.W + 'x' + g.H + ':' + sc().id;
      if(!force && G && key === G.key) return;
      g.key = key; G = g;
      svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H); svg.setAttribute('width', g.W); svg.setAttribute('height', g.H);
      svg.setAttribute('aria-label', sc().name + ': ' + S.U.length + ' ' + sc().units + ' and a plot of the estimated effect for each design.');
      unitGeo(); drawPlot(); drawBack(); drawKey();
      placeControls();
      paint(now());
      if(busy()) kick();
    }
    function fitHeight(){
      var vw = window.innerWidth || 1024, vh = window.innerHeight || 800;
      if(vw >= 1000){ sceneBox.style.height = ''; return; }
      var top = sceneBox.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
      var below = lines.offsetHeight || 120;
      var hh = Math.round(vh - Math.min(top, vh * 0.32) - below - 18);
      sceneBox.style.height = clamp(hh, vw < 600 ? (vh < 700 ? 360 : 440) : 560, vw < 600 ? 760 : 900) + 'px';
    }
    var roT = 0;
    function onResize(){ clearTimeout(roT); roT = setTimeout(function(){ fitHeight(); relayout(); }, 40); }
    try{ if(window.ResizeObserver){ new ResizeObserver(function(){ relayout(); }).observe(sceneBox); } }catch(e){}
    window.addEventListener('resize', onResize);

    /* ---------------------------------------------------- the reference behind "?" */
    function refHtml(){
      var s = sc(), d = S.design, N = S.U.length, A = s.tA.toLowerCase(), B = s.tB.toLowerCase();
      var HOW = {
        cr: 'Chance alone splits the ' + N + ' ' + s.units + ' in half: label them 1 to ' + N + ', pick ' + N / 2 + ' different random labels for ' + A + ', the rest get ' + B + '. ' + cap(s.lurk.what) + ' ends up roughly balanced, but not exactly: that is why the estimates spread.',
        block: 'Split by ' + s.lurk.what + ' first (' + s.lurk.names.join(' and ').toLowerCase() + '), then randomly assign half of each block to each treatment. ' + s.blockWhy + ' The balance on ' + s.lurk.what + ' is exact every time, so the estimates vary less.',
        pairs: 'Pair neighbours in the same block; in each pair a coin flip decides which one gets ' + A + '. ' + s.pairWhy + ' Another form of matched pairs gives each unit both treatments, in random order.',
        none: s.none.note + ' ' + s.noneWhy + ' Without random assignment there is no cause and effect conclusion.'
      };
      var h = '<p class="dr3-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>';
      h += '<h3>What you are looking at</h3><p><b>The experiment.</b> ' + esc(cap(s.count)) + ' are the experimental units. The explanatory variable is the treatment: <b>A</b>, ' + esc(A) + ', or <b>B</b>, ' + esc(B) + '. The response variable is ' + esc(s.response) + '. ' + (people() ? 'Age matters too: older volunteers recall fewer words whatever pill they take, so age can be confounded with the pill.' : 'Sunlight matters too: the pots on the back bench, by the window, grow taller whatever they are fed, so sunlight can be confounded with fertilizer.') + '</p>';
      h += '<p><b>One dot, one experiment.</b> Each run assigns the treatments, measures every ' + esc(s.unit) + ', and computes the estimate: mean of A minus mean of B. Its dot drops into the row of the design used. The line marks the true effect built into this simulation (' + fx(trueEff(), 1) + ' ' + esc(unitOf()) + '); in a real study nobody knows it. The small triangle under a row marks the mean of its dots.</p>';
      h += '<h3>This design: ' + esc(d === 'none' ? s.noneCard + ' (no random assignment)' : { cr: 'completely randomized', block: 'randomized block', pairs: 'matched pairs' }[d]) + '</h3><p>' + esc(HOW[d]) + '</p>';
      h += '<p><b>Reading the rows.</b> Random assignment centres the dots on the true effect (no bias). Blocking and pairing make them hug it (less variability), because each comparison is made between similar units. Someone choosing pushes them off it: the effect of ' + esc(s.lurk.what) + ' is mixed in (confounding).</p>';
      if(s.placebo) h += '<h3>Blinding</h3><p>' + esc(s.blindWhy) + ' The switch under the tables turns blinding off; runs that are not blind show as hollow dots in the same row.</p>';
      h += '<h3>What a study like this allows</h3><p>Random assignment allows a cause and effect conclusion: the treatment caused the difference, for units like these. Generalizing to a larger population needs random sampling, which these ' + esc(s.units) + ' did not have: they were not chosen at random from all ' + (people() ? 'adults' : 'tomato plants') + '.</p>';
      if(run && drawnEst() != null){
        h += '<h3>This experiment</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Each unit, its treatment and response"><table class="ls-tbl"><thead><tr><th scope="col">' + esc(cap(s.unit)) + '</th><th scope="col">' + esc(cap(s.lurk.what)) + '</th><th scope="col">Treatment</th><th scope="col">' + esc(cap(unitOf())) + '</th></tr></thead><tbody>' +
          S.U.map(function(u){ return '<tr><th scope="row">' + u.label + '</th><td>' + esc(s.lurk.names[u.block]) + (u.age != null ? ' (' + u.age + ')' : '') + '</td><td>' + (run.tr[u.i] === 'A' ? 'A: ' + esc(s.tA) : 'B: ' + esc(s.tB)) + '</td><td class="r">' + fx(run.res.y[u.i], s.decimals) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<p class="dr3-small">Mean of A ' + fx(run.res.meanA) + ', mean of B ' + fx(run.res.meanB) + ': estimate ' + fx(run.res.diff) + ' ' + esc(unitOf()) + '. True effect ' + fx(trueEff()) + '.</p>';
      }
      var any = DES.filter(function(x){ return landed(x).length; });
      if(any.length){
        var rowsH = [];
        any.forEach(function(x){ [false, true].forEach(function(ub){ var st = rowStats(x, s.placebo ? ub : (ub ? undefined : null)); if(!s.placebo && ub) return; if(!st) return; rowsH.push('<tr' + (x === d ? ' class="hl"' : '') + '><th scope="row">' + esc(dshort(x)) + (s.placebo ? (ub ? ', not blind' : ', blind') : '') + '</th><td class="r">' + st.n + '</td><td class="r">' + fx(st.mean) + '</td><td class="r">' + (st.n > 1 ? fx(st.sd) : '') + '</td></tr>'); }); });
        h += '<h3>Every design so far</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Estimates by design"><table class="ls-tbl"><thead><tr><th scope="col">Design</th><th scope="col">Runs</th><th scope="col">Mean estimate</th><th scope="col">SD</th></tr></thead><tbody>' + rowsH.join('') + '</tbody></table></div>';
      }
      h += '<h3>Keys</h3><p>Each design card is a button. Tab to the ' + esc(s.units) + ', then the arrow keys pick one to read it in the line under the picture; Escape clears.</p>';
      h += '<p class="dr3-small">Seed ' + seed + '. Run 100 skips the dealing and the growing and drops a hundred estimates at once. Changing the design, the blinding or the experiment starts a new bench; the dots stay until Start over or a new experiment.</p>';
      h += '<div class="dr3-about">' + (data.intro || '') + (data.howItWorks ? '<h3>' + esc(data.howItWorksTitle || 'How it works') + '</h3>' + data.howItWorks : '') + '</div>';
      if(ref._h !== h){ ref._h = h; ref.innerHTML = h; var hw = ref.querySelector('[data-how]'); if(hw) hw.addEventListener('click', function(){ startTour(); }); }
    }

    function boot(){
      fitHeight();
      relayout(true);
      settled();
      setTimeout(function(){ fitHeight(); relayout(); cueShow(); }, 60);
    }
    function finishAll(){
      // leaving mid animation: the run on the bench finishes (its dot lands), every falling dot lands
      if(run && !run.fast && !run.done){ if(!run.dropped){ run.dropped = true; run.dot = addDot(run.res.diff, run.ub, now(), 0, true); markLast(run.dot); } run.done = true; }
      DES.forEach(function(d){ rows[d].forEach(function(o){ o.land = true; }); });
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      paint(now()); settled();
    }
    function shown(m){
      S.mode = m;
      if(m !== 'explore'){ finishAll(); tour.stop(); hideCue(false); return; }
      setTimeout(function(){ fitHeight(); relayout(true); cueShow(); }, 40);
    }
    S.sc = SCN[0]; S.U = D.units(S.sc);
    setScene(0);
    return {
      kit2: function(pane, s){ boot(); return { stage: stage, ref: ref }; },
      plain: function(){ host.appendChild(stage); host.appendChild(ref); boot(); },
      shown: shown, stop: function(){ finishAll(); },
      // for the sweep test only: window.ApStatDesignRandomizer when the test sets window.LevlToolTest before the page loads
      _t: { S: S, run: function(){ return run; }, rows: rows, G: function(){ return G; }, drawn: drawn, UE: function(){ return UE; }, UG: function(){ return UG; }, BG: function(){ return BG; },
        dom: function(){ return dom; }, xv: xv, vx: vx, busy: busy, go: go, hundred: hundred, setDesign: setDesign, setBlind: setBlind, setScene: function(i){ pick.value = String(i); setScene(i); },
        select: select, startOver: startOver, cause: cause, drawnEst: drawnEst, kmode: function(m){ var b = document.querySelector('.bt-mode[data-m="' + m + '"]'); if(b) b.click(); }, finish: finishAll, relayout: relayout }
    };
  }

  /* ========================================================= TEST YOURSELF (unchanged) */
  function quiz(host, data){
    var ctxs = {}; (data.contexts || []).forEach(function(c){ ctxs[c.id] = c; });
    function redraw(api){ var p = api.problem, ctx = ctxs[p.ctx], st = api.qs; if(!ctx) return; qfig(api.fig, p, ctx, st); }
    T.drill(host, data, { slug: 'design-randomizer', noun: 'drill', generate: D.generate,
      types: [{ value: 'design', label: 'Name the design' }, { value: 'variables', label: 'Variables and units' }, { value: 'scope', label: 'Cause and effect, or generalize?' }, { value: 'procedure', label: 'Random assignment, step by step' }, { value: 'confound', label: 'Confounding and blinding' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { design: 'Name the design', variables: 'Variables and units', scope: 'What can we conclude?', procedure: 'Random assignment', confound: 'Confounding and blinding' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.qs = { done: {}, focus: null, yours: null }; redraw(api); },
      onStepStart: function(st, api){ api.qs.focus = st.key; api.qs.yours = null; redraw(api); },
      onTry: function(st, t, api){ if(t.right || st.kind !== 'choice') return; api.qs.yours = { key: st.key, text: String(st.options[t.value]).replace(/<[^>]+>/g, ''), k: t.value }; redraw(api); },
      onStep: function(st, right, api){ api.qs.done[st.key] = true; api.qs.yours = null; redraw(api); },
      method: function(st, p){
        var H = { design: 'Ask two questions: were treatments imposed by the researchers (experiment) or did the units sort themselves (observational)? And was the randomizing done inside blocks or pairs?',
          blockwhy: 'A block groups units that are alike in a variable that affects the response.', pairwhy: 'Pairs compare like with like.', conclude: 'Only random assignment supports cause and effect.',
          purpose: 'Random assignment balances the other variables between the groups, on average.',
          explanatory: 'The explanatory variable is what the researchers set: the treatments on the left of the picture.', response: 'The response is what is measured at the end, on the right of the picture.',
          units: 'The experimental units are what the treatments are applied to: the icons at the top.', treatments: 'The treatments are the conditions the units get, including the comparison one.',
          cause: 'Cause and effect needs random ASSIGNMENT (the columns of the table).', generalize: 'Generalizing needs random SAMPLING (the rows of the table).',
          label: 'Every unit gets its own number.', generate: 'Say how many different numbers, from what range, and what to do with repeats.', assign: 'Say who gets each treatment, including everyone not chosen.',
          why: 'Random assignment is about making the groups alike, so the treatment can be called the cause.',
          confound: 'A confounding variable is linked to both the group a unit is in and the response.', blind: 'Who does not know the treatments: the subjects, the people measuring, or both?', blindwhy: 'Knowing the treatment can change behavior or judgment.' };
        return H[st.key] || null;
      } });
  }

  /* The design diagram an FRQ asks for, drawn once the design is named (or
     after the last step): units, how they are split, random assignment,
     the treatment groups and what is compared. */
  function wrap(t, n){ var w = String(t).split(' '), out = [], cur = ''; w.forEach(function(x){ if((cur + ' ' + x).trim().length > n && cur){ out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if(cur) out.push(cur); return out; }
  function box(x, y, w, h, lines, cls){
    var lh = 17, y0 = y + h / 2 - (lines.length - 1) * lh / 2 + 5;
    return '<g class="dd-box ' + (cls || '') + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12"/>' + lines.map(function(l, i){ return '<text x="' + (x + w / 2) + '" y="' + (y0 + i * lh) + '" text-anchor="middle">' + esc(l) + '</text>'; }).join('') + '</g>';
  }
  function arrow(x1, y1, x2, y2, dashed){ return '<path class="dd-arrow' + (dashed ? ' is-dash' : '') + '" d="M' + x1 + ' ' + y1 + ' C ' + ((x1 + x2) / 2) + ' ' + y1 + ', ' + ((x1 + x2) / 2) + ' ' + y2 + ', ' + (x2 - 8) + ' ' + y2 + '" marker-end="url(#ddArr)"/>'; }
  function arrowV(x1, y1, x2, y2){ return '<path class="dd-arrow" d="M' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + ((y1 + y2) / 2) + ', ' + x2 + ' ' + ((y1 + y2) / 2) + ', ' + x2 + ' ' + (y2 - 8) + '" marker-end="url(#ddArr)"/>'; }
  /* The same diagram, top to bottom, for a phone (its text stays near its
     true size in a narrow stage). */
  function diagramV(d, c, h, compare){
    var g = [], W = 400, H;
    if(d === 'cr' || d === 'obs'){
      g.push(box(100, 8, 200, 54, wrap(c.N + ' ' + c.units, 22)));
      g.push(box(110, 96, 180, 64, d === 'obs' ? ['They choose', '(no random assignment)'] : ['Random assignment'], d === 'obs' ? 'is-warn' : 'is-key'));
      g.push(box(8, 196, 186, 84, ['Group 1: ' + (d === 'obs' ? 'some' : h)].concat(wrap(c.tA, 20)), 'is-a'));
      g.push(box(206, 196, 186, 84, ['Group 2: ' + (d === 'obs' ? 'the rest' : h)].concat(wrap(c.tB, 20)), 'is-b'));
      g.push(box(90, 318, 220, 60, wrap(compare, 24)));
      g.push(arrowV(200, 62, 200, 96), arrowV(200, 160, 101, 196), arrowV(200, 160, 299, 196), arrowV(101, 280, 200, 318), arrowV(299, 280, 200, 318));
      H = 390;
      if(d === 'obs'){ g.push(box(20, 398, 360, 60, wrap('Possible confounding variable: ' + c.lurk, 40), 'is-warn is-note')); H = 470; }
    } else if(d === 'block'){
      g.push(box(100, 6, 200, 50, wrap(c.N + ' ' + c.units, 22)));
      [0, 1].forEach(function(k){
        var x0 = k ? 205 : 8, w = 187, cx = x0 + w / 2;
        g.push(box(x0, 88, w, 76, ['Block ' + (k + 1)].concat(wrap(c.blocks[k], 20)), 'is-key'));
        g.push(box(x0 + 16, 192, w - 32, 50, ['Random', 'assignment'], 'is-key'));
        g.push(box(x0, 270, w / 2 - 4, 72, wrap(c.tA, 10), 'is-a'));
        g.push(box(x0 + w / 2 + 4, 270, w / 2 - 4, 72, wrap(c.tB, 10), 'is-b'));
        g.push(box(x0 + 16, 372, w - 32, 50, ['Compare', 'in block ' + (k + 1)]));
        g.push(arrowV(200, 56, cx, 88), arrowV(cx, 164, cx, 192), arrowV(cx, 242, x0 + w / 4, 270), arrowV(cx, 242, x0 + 3 * w / 4, 270), arrowV(x0 + w / 4, 342, cx, 372), arrowV(x0 + 3 * w / 4, 342, cx, 372));
      });
      H = 430;
    } else {
      g.push(box(60, 8, 280, 70, c.selfPairs ? wrap(c.N + ' ' + c.units + ', each one a pair (' + c.pairsHow + ')', 30) : wrap(h + ' pairs of ' + c.pairsHow, 30)));
      g.push(box(100, 108, 200, 60, ['In each pair, a coin', 'flip decides'], 'is-key'));
      g.push(box(8, 200, 186, 76, wrap((c.selfPairs ? 'One side gets ' : 'One gets ') + c.tA, 20), 'is-a'));
      g.push(box(206, 200, 186, 76, wrap((c.selfPairs ? 'The other side gets ' : 'The other gets ') + c.tB, 20), 'is-b'));
      g.push(box(80, 310, 240, 60, wrap('Compare the differences within pairs', 26)));
      g.push(arrowV(200, 78, 200, 108), arrowV(200, 168, 101, 200), arrowV(200, 168, 299, 200), arrowV(101, 276, 200, 310), arrowV(299, 276, 200, 310));
      H = 384;
    }
    return { W: W, H: H, g: g };
  }
  function diagram(p, c){
    var d = p.type === 'design' ? p.figure.design : p.type === 'confound' && p.steps[0].key === 'confound' ? 'obs' : c.selfPairs ? 'pairs' : 'cr';
    var h = c.N / 2, g = [], W = 700, H = 300;
    var compare = 'Compare ' + c.response;
    if((window.innerWidth || 1280) <= 640){ var v = diagramV(d, c, h, compare); W = v.W; H = v.H; g = v.g; }
    else if(d === 'cr' || d === 'obs'){
      g.push(box(10, 120, 140, 60, wrap(c.N + ' ' + c.units, 16)));
      g.push(box(190, 115, 150, 70, d === 'obs' ? ['They choose', '(no random', 'assignment)'] : ['Random', 'assignment'], d === 'obs' ? 'is-warn' : 'is-key'));
      g.push(box(390, 40, 160, 76, ['Group 1: ' + (d === 'obs' ? 'some' : h)].concat(wrap(c.tA, 18)), 'is-a'));
      g.push(box(390, 184, 160, 76, ['Group 2: ' + (d === 'obs' ? 'the rest' : h)].concat(wrap(c.tB, 18)), 'is-b'));
      g.push(box(590, 115, 104, 70, wrap(compare, 12)));
      g.push(arrow(150, 150, 190, 150), arrow(340, 150, 390, 78), arrow(340, 150, 390, 222), arrow(550, 78, 590, 150), arrow(550, 222, 590, 150));
      if(d === 'obs'){ H = 340; g.push(box(190, 268, 360, 60, wrap('Possible confounding variable: ' + c.lurk, 44), 'is-warn is-note')); }
    } else if(d === 'block'){
      H = 360;
      g.push(box(6, 150, 120, 60, wrap(c.N + ' ' + c.units, 13)));
      g.push(box(156, 40, 150, 76, ['Block 1'].concat(wrap(c.blocks[0], 18)), 'is-key'));
      g.push(box(156, 244, 150, 76, ['Block 2'].concat(wrap(c.blocks[1], 18)), 'is-key'));
      [[40, 0], [244, 1]].forEach(function(b){
        var y = b[0], cy = y + 38;
        g.push(box(336, y + 10, 92, 56, ['Random', 'assignment'], 'is-key'));
        g.push(box(458, y - 26, 122, 56, wrap(c.tA, 15), 'is-a'));
        g.push(box(458, y + 46, 122, 56, wrap(c.tB, 15), 'is-b'));
        g.push(arrow(306, cy, 336, cy), arrow(428, cy, 458, y + 2), arrow(428, cy, 458, y + 74), arrow(580, y + 2, 612, cy), arrow(580, y + 74, 612, cy));
        g.push(box(612, cy - 26, 84, 52, ['Compare', 'in block ' + (b[1] + 1)]));
      });
      g.push(arrow(126, 180, 156, 78), arrow(126, 180, 156, 282));
    } else {
      g.push(box(10, 110, 160, 80, c.selfPairs ? wrap(c.N + ' ' + c.units + ', each one a pair (' + c.pairsHow + ')', 18) : wrap(h + ' pairs of ' + c.pairsHow, 18)));
      g.push(box(210, 115, 150, 70, ['In each pair,', 'a coin flip', 'decides'], 'is-key'));
      g.push(box(400, 40, 150, 70, wrap((c.selfPairs ? 'One side gets ' : 'One gets ') + c.tA, 18), 'is-a'));
      g.push(box(400, 190, 150, 70, wrap((c.selfPairs ? 'The other side gets ' : 'The other gets ') + c.tB, 18), 'is-b'));
      g.push(box(590, 110, 106, 80, wrap('Compare the differences within pairs', 13)));
      g.push(arrow(170, 150, 210, 150), arrow(360, 150, 400, 75), arrow(360, 150, 400, 225), arrow(550, 75, 590, 150), arrow(550, 225, 590, 150));
    }
    return '<figure class="dd-fig"><svg class="dd-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(D.D_NAME[d] + ' diagram for this study: ' + c.N + ' ' + c.units + ', ' + c.tA + ' and ' + c.tB + ', ' + compare + '.') + '"><defs><marker id="ddArr" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" class="dd-head"/></marker></defs>' + g.join('') + '</svg><figcaption class="bt-small">' + esc(D.D_NAME[d]) + ' for this study.</figcaption></figure>';
  }

  /* A drill's picture, from the problem's own study:
     scope      the 2 x 2 table of what a study allows (this study marked once
                the first step is answered; a wrong pick outlined in red)
     design     the units and the two treatments; a wrong design is drawn as
                its own diagram, labeled as the student's answer; the right
                diagram once the design is named
     variables  the study as a flow: units, the two treatments, the response;
                the part a step asks about is highlighted, a wrong pick red
     procedure  the units numbered 1 to N; Generate marks a random half for
                the first treatment, Assign gives the rest the second
     confound   the self-sorted groups, then the diagram */
  function qfig(el, p, ctx, st){
    if(!el) return;
    st = st || { done: {} };
    var done = st.done || {}, Y = st.yours;
    if(p.type === 'scope'){
      var f = p.figure, show = !!done.cause, cell = function(sa, as, t){
        var here = show && sa === f.sampled && as === f.assigned;
        return '<td' + (here ? ' class="is-here"' : '') + '>' + t + (here ? ' <b>This study</b>' : '') + '</td>'; };
      var yRow = Y && Y.key === 'cause' ? null : null;
      el.innerHTML = '<figure class="dr-scope"><table class="dr-scope-t' + (Y ? ' has-yours' : '') + '"><caption>What a study allows</caption><thead><tr><th scope="col"><span class="sr-only">How units were chosen</span></th><th scope="col"' + (Y && Y.key === 'cause' ? ' class="is-ask"' : '') + '>Random assignment</th><th scope="col"' + (Y && Y.key === 'cause' ? ' class="is-ask"' : '') + '>No random assignment</th></tr></thead><tbody>' +
        '<tr><th scope="row"' + (Y && Y.key === 'generalize' ? ' class="is-ask"' : '') + '>Random sample</th>' + cell(true, true, 'Cause and effect, and generalize') + cell(true, false, 'Generalize, but no cause and effect') + '</tr>' +
        '<tr><th scope="row"' + (Y && Y.key === 'generalize' ? ' class="is-ask"' : '') + '>No random sample</th>' + cell(false, true, 'Cause and effect, for units like these') + cell(false, false, 'Neither') + '</tr></tbody></table>' +
        (Y ? '<figcaption class="dr-ycap">Yours: “' + esc(Y.text) + '”. ' + (Y.key === 'cause' ? 'Cause and effect is read across the columns: was there random assignment?' : 'Generalizing is read down the rows: was there a random sample?') + '</figcaption>' : '') + '</figure>';
      return;
    }
    if(p.type === 'design'){
      if(done.design){ el.innerHTML = diagram(p, ctx); return; }
      if(Y && Y.key === 'design'){
        var dk = { 'Completely randomized design': 'cr', 'Randomized block design': 'block', 'Matched pairs design': 'pairs', 'Observational study, not an experiment': 'obs' }[Y.text];
        if(dk){ el.innerHTML = '<div class="dr-yours">' + diagram({ type: 'design', figure: { design: dk }, steps: [] }, ctx).replace('<figcaption class="bt-small">', '<figcaption class="dr-ycap">Your answer, drawn: ').replace(' for this study.</figcaption>', '. Compare it with how the study was run.</figcaption>') + '</div>'; return; }
      }
      el.innerHTML = studySvg(ctx, {});
      return;
    }
    if(p.type === 'variables'){
      var part = { explanatory: 'tr', response: 'resp', units: 'units', treatments: 'tr' }[st.focus], ypart = null;
      if(Y){ var t = Y.text.toLowerCase(); ypart = t === String(ctx.response).toLowerCase() || t.indexOf('measurements of') === 0 ? 'resp' : t === String(ctx.explanatory).toLowerCase() || t.indexOf(String(ctx.tA).toLowerCase()) === 0 ? 'tr' : t.indexOf('the ' + ctx.n) === 0 || t.indexOf(String(ctx.N)) > -1 ? 'units' : 'other'; }
      el.innerHTML = studySvg(ctx, { focus: part, yours: ypart, yoursText: Y ? Y.text : '' });
      return;
    }
    if(p.type === 'procedure'){
      el.innerHTML = procSvg(ctx, p, done, Y);
      return;
    }
    if(p.type === 'confound'){
      if(done[p.steps[p.steps.length - 1].key]) el.innerHTML = diagram(p, ctx);
      else el.innerHTML = studySvg(ctx, { selfSort: p.steps[0].key === 'confound', yours: Y ? 'other' : null, yoursText: Y ? Y.text : '' });
      return;
    }
    el.innerHTML = '';
  }
  /* A small unit icon: a potted seedling, or a person. */
  function iconSvg(ctx, x, y, s, cls){
    if(!ctx.human) return '<g class="dq-u ' + (cls || '') + '"><path class="dq-pot" d="M' + (x - s * 0.32) + ' ' + (y + s * 0.05) + ' h ' + (s * 0.64) + ' l -' + (s * 0.08) + ' ' + (s * 0.42) + ' h -' + (s * 0.48) + ' Z"/><path class="dq-stem" d="M' + x + ' ' + (y + s * 0.05) + ' V ' + (y - s * 0.4) + '"/><path class="dq-leaf" d="M' + x + ' ' + (y - s * 0.18) + ' q ' + (s * 0.22) + ' -' + (s * 0.18) + ' ' + (s * 0.3) + ' -' + (s * 0.02) + ' q -' + (s * 0.16) + ' ' + (s * 0.12) + ' -' + (s * 0.3) + ' ' + (s * 0.02) + ' Z M' + x + ' ' + (y - s * 0.3) + ' q -' + (s * 0.22) + ' -' + (s * 0.18) + ' -' + (s * 0.3) + ' -' + (s * 0.02) + ' q ' + (s * 0.16) + ' ' + (s * 0.12) + ' ' + (s * 0.3) + ' ' + (s * 0.02) + ' Z"/></g>';
    return '<g class="dq-u ' + (cls || '') + '"><circle class="dq-head" cx="' + x + '" cy="' + (y - s * 0.22) + '" r="' + (s * 0.18) + '"/><path class="dq-body" d="M' + (x - s * 0.3) + ' ' + (y + s * 0.4) + ' q 0 -' + (s * 0.42) + ' ' + (s * 0.3) + ' -' + (s * 0.42) + ' q ' + (s * 0.3) + ' 0 ' + (s * 0.3) + ' ' + (s * 0.42) + ' Z"/></g>';
  }
  /* The study as a flow, top to bottom: the units, the two treatments, the response. */
  function studySvg(ctx, o){
    var W = 400, H = 440, g = [], n = Math.min(ctx.N, 20), cols = 10, s = 30, dy = 20;
    var hl = function(k){ return (o.focus === k ? ' is-ask' : '') + (o.yours === k ? ' is-yours' : ''); };
    g.push('<g class="dq-grp' + hl('units') + '"><rect class="dq-frame" x="8" y="8" width="384" height="124" rx="14"/>');
    for(var i = 0; i < n; i++){ var cx = 34 + (i % cols) * 37, cy = 46 + Math.floor(i / cols) * 44; g.push(iconSvg(ctx, cx, cy, s, o.selfSort ? (i % 3 ? 'is-b' : 'is-a') : '')); }
    g.push('<text class="dq-t" x="200" y="124" text-anchor="middle">' + esc(ctx.N + ' ' + ctx.units + (ctx.N > n ? ' (20 shown)' : '')) + '</text></g>');
    g.push('<path class="dq-arrow" d="M200 136 V 166"/>');
    g.push('<text class="dq-k" x="200" y="' + (164 + dy) + '" text-anchor="middle">' + esc(o.selfSort ? 'They choose their own group' : 'Split into two groups') + '</text>');
    g.push('<g class="dq-grp' + hl('tr') + '"><rect class="dq-frame" x="8" y="196" width="384" height="104" rx="14"/>' +
      '<rect class="dq-tr is-a" x="20" y="208" width="172" height="80" rx="12"/><rect class="dq-tr is-b" x="208" y="208" width="172" height="80" rx="12"/>' +
      wrapText(106, 242, ctx.tA, 18, 'dq-trt') + wrapText(294, 242, ctx.tB, 18, 'dq-trt') + '</g>');
    g.push('<path class="dq-arrow" d="M106 304 V 338 M294 304 V 338"/>');
    g.push('<g class="dq-grp' + hl('resp') + '"><rect class="dq-frame" x="8" y="342" width="384" height="70" rx="14"/>' + wrapText(200, 372, 'Measure: ' + ctx.response, 34, 'dq-t') + '</g>');
    if(o.yours === 'other') g.push('<text class="stat-yours-t" x="200" y="432" text-anchor="middle">' + esc('Yours: ' + o.yoursText).slice(0, 60) + '</text>');
    return '<figure class="dq-fig"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('The study: ' + ctx.N + ' ' + ctx.units + ', ' + ctx.tA + ' or ' + ctx.tB + ', then ' + ctx.response + ' is measured.' + (o.yoursText ? ' Your answer: ' + o.yoursText + '.' : '')) + '">' + g.join('') + '</svg>' +
      (o.yours && o.yours !== 'other' ? '<figcaption class="dr-ycap">Yours, outlined in red: “' + esc(o.yoursText) + '”.' + (o.focus ? ' The part this step asks about is highlighted.' : '') + '</figcaption>' : '') + '</figure>';
  }
  function wrapText(x, y, t, n, cls){ var ls = wrap(t, n).slice(0, 3), lh = 19, y0 = y - (ls.length - 1) * lh / 2 + 6; return '<text class="' + cls + '" text-anchor="middle">' + ls.map(function(l, i){ return '<tspan x="' + x + '" y="' + (y0 + i * lh) + '">' + esc(l) + '</tspan>'; }).join('') + '</text>'; }
  /* Random assignment, step by step, on the numbered units. */
  function procSvg(ctx, p, done, Y){
    var N = ctx.N, h = N / 2, cols = 10, cs = 38, rows = Math.ceil(N / cols), W = cols * cs + 16, H = rows * cs + 16, g = [], A = {};
    if(done.generate){ var r = M.rng(N * 31 + 7), ids = []; for(var i = 1; i <= N; i++) ids.push(i); M.shuffle(r, ids).slice(0, h).forEach(function(v){ A[v] = true; }); }
    for(var k = 1; k <= N; k++){
      var x = 8 + ((k - 1) % cols) * cs, y = 8 + Math.floor((k - 1) / cols) * cs, cls = !done.label ? 'is-plain' : A[k] ? 'is-a' : done.assign ? 'is-b' : '';
      g.push('<g class="dq-n ' + cls + '"><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="' + (cs - 4) + '" height="' + (cs - 4) + '" rx="7"/>' + (done.label ? '<text x="' + (x + cs / 2) + '" y="' + (y + cs / 2 + 5) + '" text-anchor="middle">' + k + '</text>' : '') + '</g>');
    }
    var cap = !done.label ? 'The ' + N + ' ' + ctx.units + ', not yet labeled.' : !done.generate ? 'Labeled 1 to ' + N + '.' : !done.assign ? h + ' different random labels (orange) get ' + ctx.tA + '.' : 'Orange: ' + ctx.tA + '. Blue: ' + ctx.tB + '. ' + h + ' each.';
    return '<figure class="dq-fig dq-proc"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(cap) + '">' + g.join('') + '</svg><figcaption class="bt-small">' + esc(cap) + '</figcaption>' + (Y ? '<p class="dr-ycap">Yours: “' + esc(Y.text) + '”</p>' : '') + '</figure>';
  }

  function boot(){
    T.mount(SLUG, function(app, data){
      var ex = null, kit = !!(window.LevlKit2 && window.LevlStudio && app.getAttribute('data-studio'));
      T.modes(app, { slug: SLUG, labels: ['Explore', 'Test yourself'],
        explore: function(host){ ex = explore(host, data); if(window.LevlToolTest) window.ApStatDesignRandomizer = ex._t; },
        quiz: function(host){ quiz(host, data); },
        onShow: function(m){ if(ex) ex.shown(m); },
        studio: kit ? { kit2: function(pane, s){ return ex.kit2(pane, s); } } : {} });
      // Without the frame (no Tool Studio, or no kit) the stage still works on its own, above Test yourself.
      if(!kit || !T.studioOf(app)) ex.plain();
    });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApStatBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; sc.onerror = boot; document.head.appendChild(sc);
  }
})();
