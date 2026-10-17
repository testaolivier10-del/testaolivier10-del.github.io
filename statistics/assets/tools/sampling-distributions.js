/* Sampling distributions (simulator, the flagship; docs/apstat-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApStatTools.mount; the model is
   ApStatMath.samplingDistributions (statistics/assets/tools/math/sampling-distributions.js),
   distributions come from ApStatDist (stat-dist.js), math text from ApStatTex,
   the frame is ApStatTools.modes (Explore, then Test yourself) on the Tool Studio.

   Explore: one picture in three linked panels on ONE x scale, each in its own
   colour everywhere (population blue, one sample orange, the sampling
   distribution green):
     Population   the population's histogram with mu and sigma marked, or 100
                  people for a proportion; "Draw your own" lets the student
                  drag the bars (arrow keys too)
     One sample   the last sample's values (dots, or people), its statistic
     Sampling distribution
                  every simulated statistic, stacked as dots while they fit and
                  as a histogram after; the formula's normal model on top; the
                  population's mean line runs through every panel
   Take 1 animates the draw (values fall from the population, then the mean
   falls into the bottom plot); +100 and +1,000 add in a quick burst.
   Reduced motion: the end state at once (ApStatPlot.loop).
   Test yourself: ApStatTools.drill over the model's generate(), with a stage
   figure drawn from the problem's own numbers (the normal model and its
   shaded probability once answered, the estimators' simulated values). */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath, P = window.ApStatPlot, X = window.ApStatTex;
  if(!T || !M || !M.samplingDistributions) return;
  var S = M.samplingDistributions, esc = T.esc;
  function Dd(){ return window.ApStatDist; }
  function tr(t){ return X ? X.render(t) : t; }
  function th(s){ return X ? X.html(s) : s; }
  function F(x, d){ return T.F(x, d == null ? 2 : d); }
  function big(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  var NS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100];
  var NP = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200, 300, 400, 500];
  var LABEL = { commute: 'Skewed', wait: 'Uniform', geyser: 'Bimodal', heights: 'Normal', lefties: 'Proportion' };

  T.mount('sampling-distributions', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'sampling-distributions',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------- the setups */
  function setups(data){
    var ids = (data.explore && data.explore.populations) || Object.keys(S.POPS), out = [];
    ids.forEach(function(id){
      var def = S.POPS[id]; if(!def) return;
      if(!LABEL[id]) return;
      out.push({ id: id, label: LABEL[id], kind: def.kind, A: S.population(def), wA: def, title: def.name, adjP: def.kind === 'prop' });
    });
    // a left-skewed start (the mirror of the commute times), ready to redraw
    var sk = S.shapeWeights({ dist: 'gamma', k: 2.2, theta: 10 }, 0, 5, 20).reverse();
    out.push({ id: 'draw', label: 'Draw your own', kind: 'mean', draw: true, wA: { id: 'draw', kind: 'mean', name: 'Your population (drag the bars)', what: 'value', who: 'values', lo: 0, width: 5, bins: 20, shapeWord: 'non-normal' }, weights: sk.map(function(w){ return Math.max(w, 0.002); }), title: 'Your population' });
    var cA = S.POPS.commute, cB = { id: 'commuteB', kind: 'mean', name: 'City B commutes', what: 'commute time', unit: 'minutes', who: 'workers', lo: 0, width: 5, bins: 18, shape: { dist: 'gamma', k: 4, theta: 4.5 } };
    out.push({ id: 'two-mean', label: 'Two groups', kind: 'mean', diff: true, A: S.population(cA), B: S.population(cB), wA: cA, wB: cB, title: 'City A and city B commutes', names: ['City A', 'City B'] });
    var pA = S.POPS.bond, pB = { id: 'bondB', kind: 'prop', p: 0.40, what: 'support the bond', who: 'voters', name: 'Town B' };
    out.push({ id: 'two-prop', label: 'Two groups', hidden: true, kind: 'prop', diff: true, A: S.population(pA), B: S.population(pB), wA: pA, wB: pB, title: 'Bond support in two towns', names: ['Town A', 'Town B'] });
    return out;
  }

  /* --------------------------------------------------------- explore */
  function explore(host, data){
    var SET = setups(data), cur = SET[0], nIdx = { mean: 7, prop: 4 }, stats = [], last = null, LS = null, anim = null, touched = false;
    var seed = 10000 + Math.floor(Math.random() * 89999), r = M.rng(seed), showCurve = true, sel = 7, drawing = false;
    var nid = T.nid('sd');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem sd-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Sampling distribution machine</h2>' +
      '<div class="sd-fig"><svg class="sd-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="sd-ctl">' +
        '<div class="sd-pops ls-scroll" role="group" aria-label="Population">' + SET.filter(function(x){ return !x.hidden; }).map(function(x){ return '<button type="button" class="tchip sd-pop" data-id="' + x.id + '" aria-pressed="false">' + esc(x.label) + '</button>'; }).join('') + '</div>' +
        '<div class="sd-n bt-ctl"><label for="' + nid + '-n">Sample size</label><div class="bt-slider-row"><button type="button" class="bt-step" data-d="-1" aria-label="Smaller sample">−</button><input type="range" id="' + nid + '-n" min="0" step="1" value="0"><button type="button" class="bt-step" data-d="1" aria-label="Larger sample">+</button><output class="bt-out" for="' + nid + '-n" aria-hidden="true"></output></div></div>' +
        '<div class="sd-take ls-act"><button type="button" class="btn-press sm ls-btn ls-pri sd-one">Take 1 sample</button><button type="button" class="bt-btn sd-k" data-k="100">+100</button><button type="button" class="bt-btn sd-k" data-k="1000">+1,000</button><button type="button" class="bt-btn sd-clear" aria-label="Clear the samples">Clear</button></div>' +
      '</div>' +
      '<div class="sd-say"></div>' +
      T.moreHtml('<div class="sd-p"></div><label class="bt-radio sd-opt"><input type="checkbox" class="sd-curve" checked> Show the normal model on the bottom plot</label><p class="bt-small">The curve is the normal model with the formula’s mean and standard deviation, drawn to the same scale as the simulated statistics. It is drawn even when its condition fails, so you can see it not fit.</p><p class="bt-small sd-seed"></p><div class="bt-buttons"><button type="button" class="bt-btn sd-reseed">New random seed</button></div>', 'normal model, seed') +
      '<div class="sd-nums"></div><p class="sr-only sd-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.sd-live'));
    var cue = T.cue('Take one sample, then take hundreds: watch the bottom plot build.');
    $('.sd-ctl').insertBefore(cue.el, $('.sd-ctl').firstChild);
    var svg = $('.sd-svg'), range = $('.sd-n input'), out = $('.sd-n output');
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function base(){ return cur.kind; }
    function ns(){ return base() === 'prop' ? NP : NS; }
    function n(){ return ns()[nIdx[base()]]; }
    function setRange(){ range.max = String(ns().length - 1); range.value = String(nIdx[base()]); out.textContent = 'n = ' + n(); range.setAttribute('aria-valuetext', 'n = ' + n()); }
    range.addEventListener('input', function(){ nIdx[base()] = +range.value; act(); reset(); });
    $('.sd-n').querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', function(){ var v = Math.max(0, Math.min(ns().length - 1, nIdx[base()] + (+b.getAttribute('data-d')))); if(v === nIdx[base()]) return; nIdx[base()] = v; act(); reset(); }); });
    function byId(id){ return SET.filter(function(s){ return s.id === id; })[0]; }
    function popBtns(){ return (LS ? LS.root : host).querySelectorAll('.sd-pop'); }
    host.addEventListener('click', onClick); // before the studio moves the parts
    function onClick(e){
      var b = e.target.closest('.sd-pop');
      if(b){
        var id = b.getAttribute('data-id');
        if(id === 'two-mean') id = cur.diff ? cur.id : base() === 'prop' ? 'two-prop' : 'two-mean';
        var x = byId(id); if(x && x !== cur){ cur = x; act(); reset(); } return; }
      if(e.target.closest('.sd-one')){ act(); takeOne(); return; }
      var k = e.target.closest('.sd-k'); if(k){ act(); takeMany(+k.getAttribute('data-k')); return; }
      if(e.target.closest('.sd-clear')){ act(); reset(); return; }
      if(e.target.closest('.sd-reseed')){ seed = 10000 + Math.floor(Math.random() * 89999); r = M.rng(seed); reset(); return; }
    }
    var pSl = T.slider({ label: 'Population proportion p', min: 0.02, max: 0.98, step: 0.01, value: 0.10, decimals: 2, onInput: function(v){
      SET.forEach(function(x){ if(x.adjP){ x.A = S.population({ kind: 'prop', p: v }); x.wA = Object.assign({}, x.wA, { p: v }); } }); act(); reset(); } });
    $('.sd-p').appendChild(pSl.el);
    $('.sd-curve').addEventListener('change', function(e){ showCurve = e.target.checked; draw(); });

    /* the current populations (a drawn one is rebuilt from its bars) */
    function popA(){ return cur.draw ? S.population({ kind: 'mean', lo: cur.wA.lo, width: cur.wA.width, weights: cur.weights }) : cur.A; }
    function popB(){ return cur.B; }
    function theory(){
      var ta = S.theory(popA(), n());
      if(!cur.diff) return ta;
      return S.theoryDiff(ta, S.theory(popB(), n()));
    }
    function domain(){
      var A = popA();
      if(base() === 'prop') return cur.diff ? [-0.8, 0.8] : [-0.03, 1.03];
      var lo = A.lo, hi = A.hi;
      if(cur.diff){ var B = popB(); lo = Math.min(lo, B.lo); hi = Math.max(hi, B.hi); }
      return [lo, hi];
    }
    function distDomain(){
      var d = domain();
      if(!cur.diff) return d;
      if(base() === 'prop') return [-0.8, 0.8];
      var span = d[1] - d[0];
      return [-span / 2, span / 2];
    }
    function sampleOnce(){
      var A = popA(), xa = S.draw(r, A, n()), o = { A: xa, a: S.stat(A, xa) };
      if(cur.diff){ var B = popB(), xb = S.draw(r, B, n()); o.B = xb; o.b = S.stat(B, xb); o.stat = o.a - o.b; } else o.stat = o.a;
      return o;
    }
    function stop(){ if(anim){ anim.stop(); anim = null; } }
    function reset(){ stop(); stats = []; last = null; setRange(); syncChips(); draw(); }
    function syncChips(){
      popBtns().forEach(function(b){ var id = b.getAttribute('data-id'); b.setAttribute('aria-pressed', String(id === cur.id || (id === 'two-mean' && !!cur.diff))); });
      var pr = $('.sd-p'); if(pr) pr.hidden = !cur.adjP;
    }

    /* Take 1: the values fall from the population to the sample row, then
       the statistic falls into the bottom plot. */
    function takeOne(){
      stop();
      var o = sampleOnce();
      if(T.reduced() || !P){ last = o; stats.push(o.stat); draw(); speak(); return; }
      var dur = Math.min(1.5, 0.55 + n() * 0.012);
      anim = P.loop(function(dt, t){ draw({ o: o, t: t / dur }); return t < dur; }, { duration: dur, onEnd: function(){ anim = null; last = o; stats.push(o.stat); draw(); speak(); } });
      anim.start();
    }
    function takeMany(k){
      stop();
      var cap = 20000;
      if(stats.length >= cap){ say('That is ' + big(cap) + ' samples, the most this page keeps. Clear to start again.'); return; }
      k = Math.min(k, cap - stats.length);
      var budget = Math.max(1, Math.round(4e5 / Math.max(1, n() * (cur.diff ? 2 : 1))));
      if(T.reduced() || !P){ for(var i = 0; i < k; i++){ last = sampleOnce(); stats.push(last.stat); } draw(); speak(); return; }
      var done = 0, per = Math.max(1, Math.min(budget, Math.ceil(k / 24)));
      anim = P.loop(function(){
        for(var i = 0; i < per && done < k; i++, done++){ last = sampleOnce(); stats.push(last.stat); }
        draw(); return done < k;
      }, { onEnd: function(){ anim = null; draw(); speak(); } });
      anim.start();
    }

    /* ---------------------------------------------------- the picture */
    function size(){
      var rc = $('.sd-fig').getBoundingClientRect();
      var w = Math.round(rc.width) || 640, h = Math.round(rc.height) || 0;
      if(!h || h < 200) h = Math.round(Math.max(320, Math.min(520, w * 0.75)));
      return [Math.max(260, Math.min(1400, w)), Math.min(900, h)];
    }
    function ppl(x, y, s, cls){
      // one person: a head and shoulders, s px tall
      var hr = s * 0.2, cx = x, hy = y - s * 0.62, by = y - s * 0.38;
      return '<g class="' + cls + '"><circle cx="' + cx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="' + hr.toFixed(1) + '"/><path d="M' + (cx - s * 0.3).toFixed(1) + ' ' + y.toFixed(1) + 'v' + (-s * 0.08).toFixed(1) + 'a' + (s * 0.3).toFixed(1) + ' ' + (s * 0.28).toFixed(1) + ' 0 0 1 ' + (s * 0.6).toFixed(1) + ' 0v' + (s * 0.08).toFixed(1) + 'z" transform="translate(0 ' + (by - y + s * 0.36).toFixed(1) + ')"/></g>';
    }
    var PATTERN = null;
    function pattern(k){ if(!PATTERN){ PATTERN = M.shuffle(M.rng(7), Array.apply(null, Array(100)).map(function(_, i){ return i; })); } return PATTERN.slice(0, k); }
    function ticksOf(a, b, w){ return P ? P.ticks(a, b, Math.max(3, Math.min(8, Math.round(w / 90)))) : [a, b]; }
    function fmtT(v){ return String(+v.toPrecision(6)).replace('-', '−'); }

    function draw(fx){
      var wh = size(), W = wh[0], H = wh[1], phone = W < 520;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      var L = phone ? 12 : 20, R = phone ? 12 : 20, pw = W - L - R, top = 4, lab = phone ? 17 : 19, axis = 24;
      var avail = H - top - 3 * lab - axis - 18;
      var popH = Math.round(avail * 0.30), sampH = Math.round(avail * 0.22), distH = avail - popH - sampH;
      var y1 = top + lab, y1b = y1 + popH, y2 = y1b + lab + 6, y2b = y2 + sampH, y3 = y2b + lab + 12, y3b = y3 + distH;
      var dom = domain(), dd = distDomain(), o = fx ? fx.o : last, tt = fx ? fx.t : 1;
      function sx(v){ return L + (v - dom[0]) / (dom[1] - dom[0]) * pw; }
      function dx(v){ return L + (v - dd[0]) / (dd[1] - dd[0]) * pw; }
      var A = popA(), th0 = theory(), g = [], isP = base() === 'prop', sym = isP ? 'p̂' : 'x̄', symS = cur.diff ? sym + 'A − ' + sym + 'B' : sym;
      var unit = isP ? '' : ' ' + (cur.wA.unit || '');
      /* --- panel 1: the population */
      g.push('<text class="sd-h sd-c-pop" x="' + L + '" y="' + (y1 - 6) + '">Population' + (cur.diff ? 's' : '') + '<tspan class="sd-hs"> ' + esc(popLine(A)) + '</tspan></text>');
      var rows = cur.diff ? [[A, cur.names[0]], [popB(), cur.names[1]]] : [[A, '']];
      var rh = popH / rows.length;
      rows.forEach(function(rw, ri){
        var pp = rw[0], ry = y1 + ri * rh, rb = ry + rh - (cur.diff ? 4 : 0);
        if(rw[1]) g.push('<text class="sd-tag" x="' + (W - R) + '" y="' + (ry + 13) + '" text-anchor="end">' + esc(rw[1]) + '</text>');
        if(pp.kind === 'prop'){
          var cols = 20, rws = 5, s = Math.min(pw / cols, (rb - ry - 2) / rws), gx = L + (pw - cols * s) / 2, yes = pattern(Math.round(pp.p * 100));
          for(var k = 0; k < 100; k++){ var c = k % cols, q = Math.floor(k / cols); g.push(ppl(gx + (c + 0.5) * s, ry + (q + 1) * s, s * 0.92, yes.indexOf(k) > -1 ? 'sd-ppl is-yes' : 'sd-ppl')); }
        } else {
          var mx = 0; pp.weights.forEach(function(w){ if(w > mx) mx = w; });
          var bw = pp.width / (dom[1] - dom[0]) * pw;
          pp.weights.forEach(function(w, i){
            var hh = mx ? (rb - ry - 16) * w / mx : 0, x0 = sx(pp.lo + i * pp.width);
            g.push('<rect class="sd-pbar' + (cur.draw && drawing && i === sel ? ' is-sel' : '') + '" x="' + (x0 + 0.5).toFixed(1) + '" y="' + (rb - hh).toFixed(1) + '" width="' + Math.max(1, bw - 1).toFixed(1) + '" height="' + Math.max(0, hh).toFixed(1) + '"/>');
          });
          g.push('<line class="sd-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + rb.toFixed(1) + '" y2="' + rb.toFixed(1) + '"/>');
          var mxp = sx(pp.mu), sgp = pp.sigma / (dom[1] - dom[0]) * pw, ay = ry + 9;
          g.push('<line class="sd-mu" x1="' + mxp.toFixed(1) + '" x2="' + mxp.toFixed(1) + '" y1="' + (ry + 2).toFixed(1) + '" y2="' + rb.toFixed(1) + '"/>');
          g.push('<path class="sd-sig" d="M' + mxp.toFixed(1) + ' ' + ay.toFixed(1) + 'H' + (mxp + sgp).toFixed(1) + 'm-5 -4l5 4l-5 4"/>');
          var muRight = mxp < L + pw * 0.75;
          g.push('<text class="sd-lab sd-c-pop" x="' + (mxp + (muRight ? -5 : 5)).toFixed(1) + '" y="' + (ay + 4).toFixed(1) + '" text-anchor="' + (muRight ? 'end' : 'start') + '">μ = ' + F(pp.mu, 1) + '</text>');
          g.push('<text class="sd-lab sd-c-pop" x="' + (mxp + sgp + 6).toFixed(1) + '" y="' + (ay + 4).toFixed(1) + '">σ = ' + F(pp.sigma, 1) + '</text>');
        }
      });
      if(cur.draw) g.push('<text class="sd-note" x="' + (W - R) + '" y="' + (y1 + 13) + '" text-anchor="end">' + (phone ? 'Drag the bars' : 'Drag the bars to draw the population') + '</text>');
      /* --- panel 2: one sample */
      g.push('<text class="sd-h sd-c-samp" x="' + L + '" y="' + (y2 - 6) + '">One sample, n = ' + n() + (cur.diff ? ' from each' : '') + (o && tt >= 1 ? '<tspan class="sd-hs"> ' + esc(sampLine(o)) + '</tspan>' : '') + '</text>');
      var srows = cur.diff ? [['A', 'a'], ['B', 'b']] : [['A', 'a']], sh = sampH / srows.length;
      if(!o) g.push('<text class="sd-empty" x="' + (L + pw / 2) + '" y="' + (y2 + sampH / 2 + 4) + '" text-anchor="middle">No sample yet</text>');
      else srows.forEach(function(sr, si){
        var vals = o[sr[0]], sy = y2 + si * sh, sb = sy + sh - 2, pp = sr[0] === 'A' ? A : popB();
        if(isP){
          var nn = vals.length, k = 0; vals.forEach(function(v){ k += v; });
          if(nn <= 200){
            var aw = pw * (phone ? 0.58 : 0.62), ah = sb - sy - 2, s = phone ? 20 : 26, cols, rws;
            for(; s > 4; s -= 0.5){ cols = Math.max(1, Math.floor(aw / s)); rws = Math.ceil(nn / cols); if(rws * s <= ah) break; }
            cols = Math.min(cols, nn); rws = Math.ceil(nn / cols);
            var gx = L;
            vals.forEach(function(v, i){
              var c = i % cols, q = Math.floor(i / cols), at = Math.max(0, Math.min(1, (tt - i / nn * 0.6) / 0.4));
              var yy = sy + (q + 1) * s, y0 = y1 + popH * 0.5, yy2 = y0 + (yy - y0) * at;
              if(at > 0) g.push(ppl(gx + (c + 0.5) * s, yy2, s * 0.9, v ? 'sd-ppl sd-s is-yes' : 'sd-ppl sd-s'));
            });
            if(tt >= 1){ var lx = (gx + cols * s + 10).toFixed(1), ly = (sy + sb) / 2; g.push('<text class="sd-lab sd-c-samp" x="' + lx + '" y="' + (ly - 3).toFixed(1) + '">' + (cur.diff ? sr[0] + ': ' : '') + k + ' of ' + nn + (phone ? '' : ' ' + esc(cur.wA.yes || 'yes')) + '<tspan x="' + lx + '" dy="15">' + sym + ' = ' + F(k / nn, 3) + '</tspan></text>'); }
          } else {
            var fr = k / nn, bwid = pw * 0.6, bh = Math.min(22, sb - sy - 4), by = (sy + sb) / 2 - bh / 2, prog = Math.min(1, tt / 0.8);
            g.push('<rect class="sd-sbar-n" x="' + L + '" y="' + by.toFixed(1) + '" width="' + (bwid * prog).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="4"/>');
            g.push('<rect class="sd-sbar-y" x="' + L + '" y="' + by.toFixed(1) + '" width="' + (bwid * fr * prog).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="4"/>');
            if(tt >= 1) g.push('<text class="sd-lab sd-c-samp" x="' + (L + bwid + 10).toFixed(1) + '" y="' + (by + bh / 2 + 5).toFixed(1) + '">' + (cur.diff ? sr[0] + ': ' : '') + k + ' of ' + nn + ', ' + sym + ' = ' + F(fr, 3) + '</text>');
          }
        } else {
          var step = Math.max(pp.width / 2, (dom[1] - dom[0]) / (phone ? 45 : 80)), dot = Math.max(phone ? 6 : 8, Math.min(phone ? 9 : 12, step / (dom[1] - dom[0]) * pw)), cnt = {}, mxs = 0;
          vals.forEach(function(v){ var bq = Math.round(v / step); cnt[bq] = (cnt[bq] || 0) + 1; if(cnt[bq] > mxs) mxs = cnt[bq]; });
          var dy = Math.min(dot, (sb - sy - 4) / Math.max(1, mxs)), seen = {}, y0 = y1 + (cur.diff && sr[0] === 'B' ? popH * 0.75 : popH * 0.45);
          vals.forEach(function(v, i){
            var bq = Math.round(v / step), c = seen[bq] = (seen[bq] || 0) + 1, at = Math.max(0, Math.min(1, (tt - i / vals.length * 0.55) / 0.35));
            var yy = sb - (c - 0.5) * dy, ys = sy0(v);
            if(at > 0) g.push('<circle class="sd-sdot" cx="' + sx(bq * step).toFixed(1) + '" cy="' + (ys + (yy - ys) * at).toFixed(1) + '" r="' + (Math.min(dot, dy + 1.5) / 2 - 0.6).toFixed(1) + '"/>');
          });
          function sy0(){ return y0; }
          g.push('<line class="sd-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + sb.toFixed(1) + '" y2="' + sb.toFixed(1) + '"/>');
          if(tt >= 0.6){
            var m = o[sr[1]], mx2 = sx(m);
            g.push('<path class="sd-xbar" d="M' + mx2.toFixed(1) + ' ' + (sb + 1).toFixed(1) + 'l-5 7h10z"/><line class="sd-xbarl" x1="' + mx2.toFixed(1) + '" x2="' + mx2.toFixed(1) + '" y1="' + (sy + 4).toFixed(1) + '" y2="' + sb.toFixed(1) + '"/>');
            var right = mx2 < L + pw * 0.7;
            g.push('<text class="sd-lab sd-c-samp" x="' + (mx2 + (right ? 6 : -6)).toFixed(1) + '" y="' + (sy + 14).toFixed(1) + '" text-anchor="' + (right ? 'start' : 'end') + '">' + (cur.diff ? sr[0] + ': ' : '') + sym + ' = ' + F(m, 1) + '</text>');
          }
        }
      });
      /* --- panel 3: the sampling distribution */
      var K = stats.length + (fx && tt >= 0.85 ? 0 : 0);
      g.push('<text class="sd-h sd-c-stat" x="' + L + '" y="' + (y3 - 8) + '">Sampling distribution of ' + symS + '<tspan class="sd-hs"> ' + (K ? big(K) + (K === 1 ? ' sample' : ' samples') : 'empty') + '</tspan></text>');
      var bins = null, cnt3 = {}, mxc = 0, dpx = 0, dots = false, span = dd[1] - dd[0];
      function count(w){ cnt3 = {}; mxc = 0; stats.forEach(function(v){ var b = Math.round(v / w); cnt3[b] = (cnt3[b] || 0) + 1; if(cnt3[b] > mxc) mxc = cnt3[b]; }); }
      // Dots while they fit: the biggest dot (12 px down to 3.5 px) whose
      // stacks fit the panel; a proportion's dots sit one per possible value.
      if(stats.length <= 800){
        var lat = base() === 'prop' ? 1 / n() : 0;
        for(var D = phone ? 10 : 12; D >= 3.5; D -= 0.5){
          var w0 = D / pw * span; if(lat && lat > w0) w0 = lat;
          count(w0);
          var dp = Math.min(D, w0 / span * pw);
          if(mxc * dp <= distH - 6){ bins = { w: w0 }; dpx = dp; dots = true; break; }
        }
      }
      if(!dots){ bins = distBins(dd, pw); count(bins.w); dpx = Math.max(3, bins.w / span * pw); }
      var yScale = dots ? dpx : (distH - 22) / niceCount(mxc);
      // the parameter line (population colour) through the bottom panel
      var cpx = dx(th0.center);
      g.push('<line class="sd-mu" x1="' + cpx.toFixed(1) + '" x2="' + cpx.toFixed(1) + '" y1="' + y3.toFixed(1) + '" y2="' + y3b.toFixed(1) + '"/>');
      if(!dots){
        var nc = niceCount(mxc), tks = P ? P.ticks(0, nc, 3) : [0, nc];
        tks.forEach(function(c){ if(!c) return; var yy = y3b - c * yScale; if(yy < y3 + 36) return; g.push('<line class="sd-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/><text class="sd-cnt" x="' + (W - R) + '" y="' + (yy - 3).toFixed(1) + '" text-anchor="end">' + big(c) + '</text>'); });
      }
      Object.keys(cnt3).forEach(function(b){
        var c = cnt3[b], cx = dx(b * bins.w);
        if(dots) for(var j = 0; j < c; j++) g.push('<circle class="sd-dot" cx="' + cx.toFixed(1) + '" cy="' + (y3b - (j + 0.5) * dpx).toFixed(1) + '" r="' + (dpx / 2 - 0.5).toFixed(1) + '"/>');
        else { var bw = bins.w / (dd[1] - dd[0]) * pw, hh = c * yScale; g.push('<rect class="sd-hbar" x="' + (cx - bw / 2 + 0.4).toFixed(1) + '" y="' + (y3b - hh).toFixed(1) + '" width="' + Math.max(1, bw - 0.8).toFixed(1) + '" height="' + hh.toFixed(1) + '"/>'); }
      });
      // the statistic falling in (Take 1)
      if(fx && tt > 0.62){
        var a2 = Math.min(1, (tt - 0.62) / 0.38), bb = Math.round(o.stat / bins.w), c2 = (cnt3[bb] || 0) + 1, fy = dots ? y3b - (c2 - 0.5) * dpx : y3b - c2 * yScale - 4, fy0 = y2b;
        g.push('<circle class="sd-dot is-new" cx="' + dx(o.stat).toFixed(1) + '" cy="' + (fy0 + (fy - fy0) * a2).toFixed(1) + '" r="' + Math.max(3, dpx / 2).toFixed(1) + '"/>');
      }
      // the normal model, to the same scale
      if(showCurve && K >= 20 && th0.sd > 0){
        var pts = [], Dn = Dd(), sc = dots ? dpx : yScale;
        for(var i = 0; i <= 160; i++){ var v = dd[0] + (dd[1] - dd[0]) * i / 160, yv = K * bins.w * Dn.normPdf((v - th0.center) / th0.sd) / th0.sd * sc; pts.push(dx(v).toFixed(1) + ',' + Math.max(y3 - 4, y3b - yv).toFixed(1)); }
        g.push('<polyline class="sd-curve' + (th0.normal ? '' : ' is-off') + '" points="' + pts.join(' ') + '"/>');
      }
      g.push('<line class="sd-axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + y3b.toFixed(1) + '" y2="' + y3b.toFixed(1) + '"/>');
      ticksOf(dd[0], dd[1], pw).forEach(function(v){ var xx = dx(v); if(xx > W - 52 && phone) return; g.push('<line class="sd-tick" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + y3b.toFixed(1) + '" y2="' + (y3b + 5).toFixed(1) + '"/><text class="sd-tk" x="' + xx.toFixed(1) + '" y="' + (y3b + 18).toFixed(1) + '" text-anchor="middle">' + fmtT(v) + '</text>'); });
      if(!isP && !phone) g.push('<text class="sd-tk sd-unit" x="' + (W - R) + '" y="' + (y3b + 18).toFixed(1) + '" text-anchor="end"></text>');
      // the readout, on the picture
      if(K >= 2){
        var mS = Dd().mean(stats), sS = Dd().sd(stats), d0 = isP ? 3 : 2;
        var rx = W - R, ry = y3 + 4;
        g.push('<text class="sd-read sd-c-stat" x="' + rx + '" y="' + (ry + 10) + '" text-anchor="end">mean ' + F(mS, d0) + ' · SD ' + F(sS, d0 + (isP ? 1 : 0)) + '</text>');
        g.push('<text class="sd-read sd-muted" x="' + rx + '" y="' + (ry + 27) + '" text-anchor="end">formula ' + F(th0.center, d0) + ' · ' + F(th0.sd, d0 + (isP ? 1 : 0)) + '</text>');
      }
      svg.innerHTML = g.join('');
      svg.setAttribute('aria-label', describe(th0, K));
      if(!fx) words(th0, K);
    }
    function niceCount(c){ var p = Math.pow(10, Math.floor(Math.log10(Math.max(1, c)))), m = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for(var i = 0; i < m.length; i++) if(c <= m[i] * p) return m[i] * p; return 10 * p; }
    /* bottom-plot bins: one per possible value of p-hat when they are far
       enough apart, else about 7 px wide */
    function distBins(dd, pw){
      var w = (dd[1] - dd[0]) / Math.max(30, Math.min(110, Math.floor(pw / 7)));
      if(base() === 'prop' && 1 / n() >= w) w = 1 / n();
      else if(base() !== 'prop'){ var t0 = theory(); if(t0.sd > 0) w = Math.min(w, Math.max(t0.sd / 4.5, (dd[1] - dd[0]) / 220)); }
      return { w: w };
    }
    function popLine(A){
      if(cur.diff) return base() === 'prop' ? 'pA = ' + F(cur.A.p, 2) + ', pB = ' + F(cur.B.p, 2) : 'μA = ' + F(cur.A.mu, 1) + ', μB = ' + F(cur.B.mu, 1) + ' ' + (cur.wA.unit || '');
      if(A.kind === 'prop') return 'p = ' + F(A.p, 2) + ' ' + (cur.wA.what || '');
      return (cur.wA.name || '') + (cur.wA.unit ? ' (' + cur.wA.unit + ')' : '');
    }
    function sampLine(o){
      var isP = base() === 'prop', sym = isP ? 'p̂' : 'x̄';
      if(cur.diff) return sym + 'A − ' + sym + 'B = ' + F(o.stat, isP ? 3 : 2);
      return '';
    }

    /* ------------------------------------------------ words and numbers */
    function names(){ var isP = base() === 'prop', s = isP ? 'p̂' : 'x̄'; return { sym: cur.diff ? s + 'A − ' + s + 'B' : s, isP: isP, what: isP ? 'proportion' : 'mean' }; }
    function shapeWord(th0){
      var nm = names(), nn = n();
      if(cur.diff) return th0.normal ? 'A normal model fits: each ' + (nm.isP ? 'proportion' : 'mean') + ' is approximately normal, so their difference is too.' : 'A normal model is not justified yet: ' + (nm.isP ? 'an expected count is under 10.' : 'n = ' + nn + ' is under 30 and the populations are skewed.');
      if(nm.isP){ var c = th0.counts; return th0.normal ? 'Large counts holds: np = ' + F(c[0], 1) + ' and n(1 − p) = ' + F(c[1], 1) + ' are both at least 10, so p̂ is approximately normal.' : 'Large counts fails: ' + (c[0] < 10 ? 'np = ' + F(c[0], 1) : 'n(1 − p) = ' + F(c[1], 1)) + ' is under 10, so p̂ is still skewed.'; }
      if(th0.reason === 'normal') return 'The population is normal, so x̄ is normal for any n.';
      if(th0.reason === 'clt') return 'With n = ' + nn + ' ≥ 30 the Central Limit Theorem makes x̄ approximately normal.';
      if(cur.draw) return 'With n = ' + nn + ' under 30, x̄ keeps some of your population’s shape. Try n = 30 or more.';
      return 'With n = ' + nn + ' under 30 from a ' + (cur.wA.shapeWord || 'non-normal') + ' population, x̄ keeps some of that shape.';
    }
    function words(th0, K){
      var nm = names(), d0 = nm.isP ? 3 : 2, head, sub = '';
      if(!K && !last) head = 'Start with one sample: tap Take 1 sample.';
      else if(K < 20) head = 'This ' + (cur.diff ? 'difference' : 'sample ' + nm.what) + ' is ' + F(last ? last.stat : stats[stats.length - 1], d0) + '. Each new sample gives a different value: take more.';
      else {
        var mS = Dd().mean(stats), sS = Dd().sd(stats);
        head = big(K) + ' values of ' + nm.sym + ': centered at ' + F(mS, d0) + ' (formula ' + F(th0.center, d0) + '), SD ' + F(sS, d0 + 1) + ' (formula ' + F(th0.sd, d0 + 1) + ').';
        sub = shapeWord(th0);
      }
      var why = whyHtml(th0, K);
      T.explain($('.sd-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), why);
      drawNums(th0, K);
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore');
        var ok = th0.normal;
        LS.pills([{ k: 'Samples', html: big(K), tone: 'readout' }], 'left', 'explore');
        LS.pills([{ k: 'Normal model', html: ok ? 'fits' : 'not yet', tone: ok ? 'good' : 'warn' }], 'right', 'explore');
        if(LS.root.querySelector('.sd-seed')) LS.root.querySelector('.sd-seed').textContent = 'Seed ' + seed + '.';
      } else { var sd2 = $('.sd-seed'); if(sd2) sd2.textContent = 'Seed ' + seed + '.'; }
    }
    function speak(){ var th0 = theory(), K = stats.length; say(K < 20 ? 'Sample ' + K + ': ' + names().sym + ' = ' + F(stats[K - 1], names().isP ? 3 : 2) + '.' : describe(th0, K)); }
    function describe(th0, K){
      var nm = names();
      var s = 'Three linked plots on one scale. Population: ' + popLine(popA()) + '. Sample size ' + n() + '. ';
      if(!K) return s + 'No samples yet.';
      var mS = Dd().mean(stats), sS = K > 1 ? Dd().sd(stats) : 0;
      return s + big(K) + ' simulated values of ' + nm.sym + ', mean ' + F(mS, 3) + ', standard deviation ' + F(sS, 3) + '; the formula gives ' + F(th0.center, 3) + ' and ' + F(th0.sd, 3) + '. ' + (K >= 20 ? shapeWord(th0) : '');
    }
    function whyHtml(th0, K){
      var nm = names(), nn = n(), A = popA(), p = [];
      p.push('<p><b>Three plots, one scale.</b> Top: the population, every individual. Middle: one random sample of ' + nn + '. Bottom: one dot for each sample’s ' + (cur.diff ? 'difference' : nm.what) + '. The bottom plot is the sampling distribution: how the statistic varies from sample to sample.</p>');
      if(nm.isP && !cur.diff) p.push('<p><b>Center.</b> The values of p̂ center at p = ' + F(A.p, 2) + ': p̂ is an unbiased estimator of p.</p><p><b>Spread.</b> ' + th('$\\sigma_{\\hat{p}} = \\sqrt{\\frac{p(1 - p)}{n}} = \\sqrt{\\frac{' + M.fixed(A.p, 2) + '(' + M.fixed(1 - A.p, 2) + ')}{' + nn + '}} = ' + M.fixed(th0.sd, 4) + '$') + '. Four times the sample size halves it.</p>');
      else if(!cur.diff) p.push('<p><b>Center.</b> The values of x̄ center at μ = ' + F(A.mu, 2) + ': x̄ is an unbiased estimator of μ.</p><p><b>Spread.</b> ' + th('$\\sigma_{\\bar{x}} = \\frac{\\sigma}{\\sqrt{n}} = \\frac{' + M.fixed(A.sigma, 2) + '}{\\sqrt{' + nn + '}} = ' + M.fixed(th0.sd, 3) + '$') + '. A mean of many values varies less than one value; four times the sample size halves the spread.</p>');
      else p.push('<p><b>Center.</b> The differences center at the difference of the parameters, ' + F(th0.center, 3) + '.</p><p><b>Spread.</b> Variances add, even for a difference: ' + th(nm.isP ? '$\\sqrt{\\frac{p_A(1 - p_A)}{n} + \\frac{p_B(1 - p_B)}{n}}$' : '$\\sqrt{\\frac{\\sigma_A^2}{n} + \\frac{\\sigma_B^2}{n}}$') + ' = ' + F(th0.sd, 3) + ', larger than either statistic’s own spread.</p>');
      p.push('<p><b>Shape.</b> ' + esc(shapeWord(th0)) + (nm.isP ? ' The rule: np ≥ 10 and n(1 − p) ≥ 10 (some books use 5).' : ' The rule: a normal population, or n ≥ 30 (the Central Limit Theorem).') + ' The curve on the bottom plot is that normal model; it turns dashed when its condition fails.</p>');
      p.push('<p><b>Independence.</b> These samples come from a very large population, so the 10% condition holds and the standard deviation formula is accurate. With a small population, sampling without replacement needs n ≤ 10% of it.</p>');
      return p.join('');
    }
    function drawNums(th0, K){
      var nm = names(), box = $('.sd-nums'), d0 = nm.isP ? 3 : 2;
      var mS = K ? Dd().mean(stats) : null, sS = K > 1 ? Dd().sd(stats) : null;
      var form = nm.isP && !cur.diff ? ['\\mu_{\\hat{p}} = p', '\\sigma_{\\hat{p}} = \\sqrt{p(1 - p)/n}'] : !cur.diff ? ['\\mu_{\\bar{x}} = \\mu', '\\sigma_{\\bar{x}} = \\sigma / \\sqrt{n}'] : nm.isP ? ['p_A - p_B', '\\sqrt{p_A(1 - p_A)/n + p_B(1 - p_B)/n}'] : ['\\mu_A - \\mu_B', '\\sqrt{\\sigma_A^2/n + \\sigma_B^2/n}'];
      var lastRow = last ? (cur.diff ? '' : '<p class="bt-small">Last sample (' + n() + ' values): ' + esc(last.A.slice(0, 40).map(function(v){ return nm.isP ? (v ? '1' : '0') : M.fixed(v, 1); }).join(', ')) + (last.A.length > 40 ? ', …' : '') + '.</p>') : '';
      box.innerHTML = '<h3 class="ls-title-l">Simulated vs the formula</h3>' +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Simulated and formula values"><table class="ls-tbl"><caption class="sr-only">Center and spread of the simulated statistics and of the formula</caption><thead><tr><th scope="col"></th><th scope="col">Simulated (' + big(K) + ')</th><th scope="col">Formula</th></tr></thead><tbody>' +
        '<tr><th scope="row">Mean of ' + esc(nm.sym) + '</th><td class="r">' + (mS == null ? '·' : F(mS, d0 + 1)) + '</td><td class="r">' + tr(form[0]) + ' = ' + F(th0.center, d0 + 1) + '</td></tr>' +
        '<tr><th scope="row">SD of ' + esc(nm.sym) + '</th><td class="r">' + (sS == null ? '·' : F(sS, d0 + 1)) + '</td><td class="r">' + tr(form[1]) + ' = ' + F(th0.sd, d0 + 1) + '</td></tr></tbody></table></div>' +
        '<p class="bt-small">Sample size n = ' + n() + (cur.diff ? ' in each group' : '') + '. ' + esc(shapeWord(th0)) + '</p>' + lastRow;
    }

    /* ------------------------------------------------- draw your own */
    function setBar(px, py){
      var rc = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, x = (px - rc.left) * vb.width / rc.width, y = (py - rc.top) * vb.height / rc.height;
      var g0 = geom(); if(!g0) return false;
      if(y < g0.y1 - 20 || y > g0.y1b + 10) return false;
      var i = Math.floor((x - g0.L) / g0.pw * cur.weights.length);
      if(i < 0 || i >= cur.weights.length) return false;
      var frac = Math.max(0, Math.min(1, (g0.y1b - y) / (g0.y1b - g0.y1 - 16)));
      var mx = Math.max.apply(null, cur.weights) || 1;
      cur.weights[i] = Math.max(0, frac * mx * 1.0001);
      if(cur.weights.every(function(w){ return !w; })) cur.weights[i] = 1;
      sel = i; stats = []; last = null; return true;
    }
    function geom(){
      var wh = size(), W = wh[0], H = wh[1], phone = W < 520, L = phone ? 12 : 20, R = phone ? 12 : 20, lab = phone ? 17 : 19, axis = 24, top = 4;
      var avail = H - top - 3 * lab - axis - 18, popH = Math.round(avail * 0.30), y1 = top + lab;
      return { L: L, pw: W - L - R, y1: y1, y1b: y1 + popH };
    }
    var dragOn = false;
    svg.addEventListener('pointerdown', function(e){ if(!cur.draw) return; if(setBar(e.clientX, e.clientY)){ dragOn = true; drawing = true; act(); try{ svg.setPointerCapture(e.pointerId); }catch(x){} e.preventDefault(); stop(); draw(); } });
    svg.addEventListener('pointermove', function(e){ if(dragOn && setBar(e.clientX, e.clientY)) draw(); });
    function up(){ if(dragOn){ dragOn = false; draw(); say('Population redrawn: mean ' + F(popA().mu, 1) + ', standard deviation ' + F(popA().sigma, 1) + '.'); } }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('keydown', function(e){
      if(!cur.draw) return;
      var k = e.key, ws = cur.weights, mx = Math.max.apply(null, ws) || 1;
      if(k === 'ArrowLeft') sel = Math.max(0, sel - 1);
      else if(k === 'ArrowRight') sel = Math.min(ws.length - 1, sel + 1);
      else if(k === 'ArrowUp') ws[sel] = ws[sel] + mx / 8;
      else if(k === 'ArrowDown') ws[sel] = Math.max(0, ws[sel] - mx / 8);
      else return;
      if(ws.every(function(w){ return !w; })) ws[sel] = mx / 8;
      e.preventDefault(); drawing = true; act(); stop(); stats = []; last = null; draw();
      say('Bar ' + (sel + 1) + ' of ' + ws.length + ', from ' + (cur.wA.lo + sel * cur.wA.width) + ' to ' + (cur.wA.lo + (sel + 1) * cur.wA.width) + ': ' + Math.round(ws[sel] / ws.reduce(function(a, b){ return a + b; }, 0) * 100) + '% of the population.');
    });
    function drawMode(){
      svg.setAttribute('tabindex', cur.draw ? '0' : '-1');
      svg.setAttribute('role', cur.draw ? 'application' : 'img');
      svg.setAttribute('aria-roledescription', cur.draw ? 'population editor' : 'plots');
      if(cur.draw) svg.setAttribute('aria-describedby', nid + '-dh'); else svg.removeAttribute('aria-describedby');
    }
    $('.sd-fig').insertAdjacentHTML('beforeend', '<p id="' + nid + '-dh" class="sr-only">Left and right arrows pick a bar of the population; up and down arrows make it taller or shorter.</p>');

    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.sd-fig')], dock: [$('.sd-ctl')], why: [$('.sd-say')], details: [$('.sd-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      reset();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.sd-one'), text: 'Start here: take one sample' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ if(!anim) draw(); }, 60); }).observe($('.sd-fig')); }
    }
    var origReset = reset;
    reset = function(){ origReset(); drawMode(); };
    setRange(); syncChips(); drawMode(); draw();
    return { stop: stop, studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    var o = { slug: 'sampling-distributions', noun: 'drill',
      generate: function(r, ctx, type){ return S.generate(r, ctx, type); },
      types: [{ value: 'mean', label: 'Sample means' }, { value: 'prop', label: 'Sample proportions' }, { value: 'diff', label: 'Differences' }, { value: 'shape', label: 'Shape and spread (CLT)' }, { value: 'estimator', label: 'Bias and variability' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { mean: 'The sampling distribution of x̄', prop: 'The sampling distribution of p̂', diff: 'A difference of two statistics', shape: 'Which picture is the sampling distribution?', estimator: 'Bias and variability' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){
        var k = s.key, st = api.st;
        if(k === 'sd') st.sd = true; else if(k === 'shape' || k === 'counts') st.cond = true; else if(k === 'prob') st.prob = true; else return;
        if(api.problem.type === 'mean' || api.problem.type === 'prop' || api.problem.type === 'diff') figure(api.fig, api.problem, st);
      }
    };
    T.drill(host, data, o);
  }
  /* The drill's figure, from the problem's own numbers, in three stages so
     it never gives an answer away: the population first (its given mu and
     sigma, or its people), then the sampling distribution's normal model
     once the spread is answered (dashed until its condition is settled, and
     dashed for good when it fails), then the probability shaded. */
  function figure(el, p, st){
    var g = p.figure;
    if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, W = phone ? 340 : 600, H = phone ? 360 : 320;
    if(g.kind === 'estimators'){ el.innerHTML = '<figure class="sd-qfig">' + estSvg(g, W, H) + '</figure>'; return; }
    if(g.kind === 'pop'){ el.innerHTML = '<figure class="sd-qfig">' + popSvg(g, W, Math.min(H, 240)) + '</figure>'; return; }
    st = st || {};
    el.innerHTML = '<figure class="sd-qfig">' + (st.sd ? modelSvg(g, st, W, H) : givenSvg(g, W, H)) + '</figure>';
  }
  function popSvg(g, W, H){
    var A = S.population(S.POPS[g.pop]), mx = Math.max.apply(null, A.weights), L = 14, pw = W - 28, bh = H - 60, bw = pw / A.weights.length;
    var bars = A.weights.map(function(w, i){ var h = bh * w / mx; return '<rect class="sd-pbar" x="' + (L + i * bw + 0.5).toFixed(1) + '" y="' + (24 + bh - h).toFixed(1) + '" width="' + (bw - 1).toFixed(1) + '" height="' + h.toFixed(1) + '"/>'; }).join('');
    var tk = (P ? P.ticks(A.lo, A.hi, 5) : [A.lo, A.hi]).map(function(v){ var x = L + (v - A.lo) / (A.hi - A.lo) * pw; return '<text class="sd-tk" x="' + x.toFixed(1) + '" y="' + (24 + bh + 18) + '" text-anchor="middle">' + (+v.toFixed(2)) + '</text>'; }).join('');
    return '<svg class="sd-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Histogram of the population: ' + esc(S.POPS[g.pop].shapeWord) + ', mean ' + F(A.mu, 1) + ', standard deviation ' + F(A.sigma, 1) + '"><text class="sd-h sd-c-pop" x="' + L + '" y="14">The population (' + esc(S.POPS[g.pop].unit) + ')</text>' + bars + '<line class="sd-base" x1="' + L + '" x2="' + (L + pw) + '" y1="' + (24 + bh) + '" y2="' + (24 + bh) + '"/>' + tk + '</svg>';
  }
  /* a population density for the givens: normal, or a gamma with the given
     mean and SD (skewed right), mirrored for skewed left */
  function popPdf(q){
    var Dn = Dd();
    if(/normal/.test(q.shape)) return function(x){ return Dn.normPdf((x - q.mu) / q.sigma) / q.sigma; };
    // right: the gamma with exactly this mean and SD (k = (mu/sigma)^2, theta = sigma^2/mu), on x > 0;
    // left: a mirrored gamma (k = 4) with this mean and SD
    var left = /left/.test(q.shape), k = left ? 4 : Math.max(1.5, (q.mu / q.sigma) * (q.mu / q.sigma)), th0 = q.sigma / Math.sqrt(k), shift = q.mu - (left ? -1 : 1) * k * th0;
    return function(x){ var u = left ? shift - x : x - shift; return u > 0 ? Math.exp((k - 1) * Math.log(u) - u / th0 - Dn.lgamma(k) - k * Math.log(th0)) : 0; };
  }
  function curvePts(f, a, b, x, base, hgt, peak){
    var pts = []; for(var i = 0; i <= 140; i++){ var v = a + (b - a) * i / 140; pts.push(x(v).toFixed(1) + ',' + (base - hgt * f(v) / peak).toFixed(1)); }
    return pts;
  }
  function peakOf(f, a, b){ var m = 0; for(var i = 0; i <= 200; i++){ var v = f(a + (b - a) * i / 200); if(v > m) m = v; } return m || 1; }
  function axisSvg(a, b, x, base, L, R){
    var out = '<line class="sd-axis" x1="' + L + '" x2="' + R + '" y1="' + base + '" y2="' + base + '"/>';
    (P ? P.ticks(a, b, 6) : [a, b]).forEach(function(v){ var xx = x(v); out += '<line class="sd-tick" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + base + '" y2="' + (base + 5) + '"/><text class="sd-tk" x="' + xx.toFixed(1) + '" y="' + (base + 18) + '" text-anchor="middle">' + String(+v.toPrecision(6)).replace('-', '−') + '</text>'; });
    return out;
  }
  function peopleSvg(pp, x0, y0, w, h, label){
    var cols = 20, rows = 5, s = Math.min(w / cols, (h - 4) / rows), gx = x0 + (w - cols * s) / 2, yes = M.shuffle(M.rng(11), Array.apply(null, Array(100)).map(function(_, i){ return i; })).slice(0, Math.round(pp.p * 100)), out = '';
    for(var k = 0; k < 100; k++){ var c = k % cols, q = Math.floor(k / cols), hr = s * 0.18, cx = gx + (c + 0.5) * s, yb = y0 + (q + 1) * s;
      out += '<g class="sd-ppl' + (yes.indexOf(k) > -1 ? ' is-yes' : '') + '"><circle cx="' + cx.toFixed(1) + '" cy="' + (yb - s * 0.58).toFixed(1) + '" r="' + hr.toFixed(1) + '"/><path d="M' + (cx - s * 0.27).toFixed(1) + ' ' + (yb - s * 0.06).toFixed(1) + 'a' + (s * 0.27).toFixed(1) + ' ' + (s * 0.26).toFixed(1) + ' 0 0 1 ' + (s * 0.54).toFixed(1) + ' 0z"/></g>'; }
    return out + (label ? '<text class="sd-lab sd-c-pop" x="' + (x0 + w / 2) + '" y="' + (y0 + rows * s + 18).toFixed(1) + '" text-anchor="middle">' + esc(label) + '</text>' : '');
  }
  function givenSvg(g, W, H){
    var L = 16, R = W - 16, out = [], aria;
    if(g.pops[0].p != null){
      // the population(s) as people: 100 each, the proportion coloured
      var two = g.pops.length > 1, stack = two && W < 500, gw = two && !stack ? (R - L - 16) / 2 : R - L, gh = stack ? (H - 60) / 2 - 22 : H - 80;
      g.pops.forEach(function(pp, i){ out.push(peopleSvg(pp, stack ? L : L + i * (gw + 16), stack ? 30 + i * (gh + 30) : 34, gw, gh, (two ? 'Group ' + (i + 1) + ': ' : '') + 'p = ' + T.F(pp.p, 2))); });
      aria = 'The population' + (two ? 's' : '') + ' as 100 people each; ' + g.pops.map(function(pp){ return Math.round(pp.p * 100) + ' in 100'; }).join(' and ') + ' are coloured.';
      out.unshift('<text class="sd-h sd-c-pop" x="' + L + '" y="16">The population' + (two ? 's' : '') + '</text><text class="sd-read sd-muted" x="' + R + '" y="16" text-anchor="end">' + (two ? 'n₁ = ' + g.n[0] + ', n₂ = ' + g.n[1] : 'n = ' + g.n) + '</text>');
    } else {
      var a = Infinity, b = -Infinity;
      g.pops.forEach(function(q){ a = Math.min(a, q.mu - 3.4 * q.sigma); b = Math.max(b, q.mu + 3.4 * q.sigma); });
      if(g.pops.every(function(q){ return /right/.test(q.shape); })) a = Math.max(a, 0);
      var base = H - 30, top = 40, x = function(v){ return L + (v - a) / (b - a) * (R - L); };
      g.pops.forEach(function(q, i){
        var f = popPdf(q), pk = peakOf(f, a, b), pts = curvePts(f, a, b, x, base, (base - top) * (i ? 0.78 : 1), pk);
        out.push('<polygon class="sd-popfill" points="' + x(a).toFixed(1) + ',' + base + ' ' + pts.join(' ') + ' ' + x(b).toFixed(1) + ',' + base + '"/><polyline class="sd-popline' + (i ? ' is-2' : '') + '" points="' + pts.join(' ') + '"/>');
        var mx = x(q.mu);
        out.push('<line class="sd-mu" x1="' + mx.toFixed(1) + '" x2="' + mx.toFixed(1) + '" y1="' + (top - 6) + '" y2="' + base + '"/><text class="sd-lab sd-c-pop" x="' + (mx + 5).toFixed(1) + '" y="' + (top - 8 + i * 16) + '">' + (g.pops.length > 1 ? 'μ' + (i ? '₂' : '₁') : 'μ') + ' = ' + T.F(q.mu, 1) + '</text>');
      });
      out.push(axisSvg(a, b, x, base, L, R));
      out.unshift('<text class="sd-h sd-c-pop" x="' + L + '" y="16">The population' + (g.pops.length > 1 ? 's' : '') + ' (' + esc(g.unit || '') + ')</text><text class="sd-read sd-muted" x="' + R + '" y="16" text-anchor="end">' + (Array.isArray(g.n) ? 'n₁ = ' + g.n[0] + ', n₂ = ' + g.n[1] : 'n = ' + g.n) + '</text>');
      aria = 'The population distribution' + (g.pops.length > 1 ? 's' : '') + ': ' + g.pops.map(function(q){ return q.shape + ', mean ' + T.F(q.mu, 1) + ', standard deviation ' + T.F(q.sigma, 1); }).join('; and ');
    }
    return '<svg class="sd-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(aria) + '">' + out.join('') + '</svg>';
  }
  function modelSvg(g, st, W, H){
    var c = g.center, sd = g.sd, L = 16, R = W - 16, base = H - 30, top = 44, Dn = Dd(), out = [];
    var a = c - 4 * sd, b = c + 4 * sd, popLine = '';
    // a single mean: the population on the same axis, so the narrowing shows
    if(g.type === 'mean'){ var q = g.pops[0]; a = Math.min(a, q.mu - 3.2 * q.sigma); b = Math.max(b, q.mu + 3.2 * q.sigma); if(/right/.test(q.shape)) a = Math.max(a, 0); }
    if(g.type === 'prop'){ a = Math.max(a, -0.02); b = Math.min(b, 1.02); }
    var x = function(v){ return L + (v - a) / (b - a) * (R - L); }, f = function(v){ return Dn.normPdf((v - c) / sd) / sd; };
    if(g.type === 'mean'){
      var pf = popPdf(g.pops[0]), pts0 = curvePts(pf, a, b, x, base, (base - top) * 0.42, peakOf(pf, a, b));
      out.push('<polygon class="sd-popfill" points="' + x(a).toFixed(1) + ',' + base + ' ' + pts0.join(' ') + ' ' + x(b).toFixed(1) + ',' + base + '"/><polyline class="sd-popline" points="' + pts0.join(' ') + '"/>');
      popLine = '<text class="sd-lab sd-c-pop" x="' + R + '" y="' + (top + 2) + '" text-anchor="end">population, scaled down</text>';
    }
    var pts = curvePts(f, a, b, x, base, base - top, f(c)), shade = [];
    if(st.prob && g.x != null){
      var lo = g.dir === 'gt' ? Math.max(a, g.x) : a, hi = g.dir === 'gt' ? b : Math.min(b, g.x);
      if(hi > lo){ shade.push(x(lo).toFixed(1) + ',' + base); for(var j = 0; j <= 80; j++){ var u = lo + (hi - lo) * j / 80; shade.push(x(u).toFixed(1) + ',' + (base - (base - top) * f(u) / f(c)).toFixed(1)); } shade.push(x(hi).toFixed(1) + ',' + base); }
    }
    var settled = !!st.cond, solid = settled && g.ok, dS = g.type === 'mean' ? 2 : 3;
    if(shade.length) out.push('<polygon class="sd-shade" points="' + shade.join(' ') + '"/>');
    out.push('<polyline class="sd-curve sd-curve-g' + (solid ? '' : ' is-off') + '" points="' + pts.join(' ') + '"/>');
    out.push('<line class="sd-mu" x1="' + x(c).toFixed(1) + '" x2="' + x(c).toFixed(1) + '" y1="' + (top - 4) + '" y2="' + base + '"/>');
    if(g.type === 'diff' && a < 0 && b > 0) out.push('<line class="sd-zero" x1="' + x(0).toFixed(1) + '" x2="' + x(0).toFixed(1) + '" y1="' + (top - 4) + '" y2="' + base + '"/>');
    if(st.prob && g.x != null) out.push('<line class="sd-xbarl" x1="' + x(g.x).toFixed(1) + '" x2="' + x(g.x).toFixed(1) + '" y1="' + top + '" y2="' + base + '"/>');
    out.push(axisSvg(a, b, x, base, L, R));
    var note = settled && !g.ok ? 'A normal model is not justified here' : !settled ? 'Shape: still to decide' : st.prob && g.x != null ? 'Shaded area = ' + T.F(g.pr, 4) : 'Mean ' + T.F(c, dS) + ', SD ' + T.F(sd, dS + 1);
    out.unshift('<text class="sd-h sd-c-stat" x="' + L + '" y="16">Sampling distribution of ' + esc(g.sym) + '</text><text class="sd-read sd-muted" x="' + L + '" y="34">' + esc(note) + '</text>' + popLine);
    var aria = 'Normal model for ' + g.sym + ': mean ' + T.F(c, dS) + ', standard deviation ' + T.F(sd, dS + 1) + (g.type === 'mean' ? ', drawn over the population curve' : '') + '. ' + note + '.';
    return '<svg class="sd-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(aria) + '">' + out.join('') + '</svg>';
  }
  function estSvg(g, W, H){
    var all = [], L = 34, pw = W - L - 12;
    g.rows.forEach(function(r){ all = all.concat(r.values); });
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all), pad = (hi - lo) * 0.04; lo -= pad; hi += pad;
    function x(v){ return L + (v - lo) / (hi - lo) * pw; }
    var rh = (H - 40) / 3, out = [], step = (hi - lo) / Math.floor(pw / 4.2);
    g.rows.forEach(function(r, i){
      var y0 = 8 + i * rh, yb = y0 + rh - 6, cnt = {}, mx = 0;
      r.values.forEach(function(v){ var b = Math.round(v / step); cnt[b] = (cnt[b] || 0) + 1; if(cnt[b] > mx) mx = cnt[b]; });
      var d = Math.min(4.2, (yb - y0 - 4) / mx);
      out.push('<text class="sd-h sd-c-stat" x="4" y="' + ((y0 + yb) / 2 + 5).toFixed(1) + '">' + r.name + '</text>');
      Object.keys(cnt).forEach(function(b){ for(var j = 0; j < cnt[b]; j++) out.push('<circle class="sd-dot" cx="' + x(b * step).toFixed(1) + '" cy="' + (yb - (j + 0.5) * d).toFixed(1) + '" r="' + Math.max(1.2, d / 2 - 0.3).toFixed(1) + '"/>'); });
      out.push('<line class="sd-base" x1="' + L + '" x2="' + (L + pw) + '" y1="' + yb.toFixed(1) + '" y2="' + yb.toFixed(1) + '"/>');
    });
    var tx = x(g.theta);
    out.push('<line class="sd-mu" x1="' + tx.toFixed(1) + '" x2="' + tx.toFixed(1) + '" y1="4" y2="' + (H - 30) + '"/><text class="sd-lab sd-c-pop" x="' + (tx + 4).toFixed(1) + '" y="' + (H - 32) + '">' + esc(g.sym) + ' = ' + T.F(g.theta, g.d) + '</text>');
    (P ? P.ticks(lo, hi, 5) : [lo, hi]).forEach(function(v){ var xx = x(v); out.push('<text class="sd-tk" x="' + xx.toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle">' + (+v.toFixed(2)) + '</text>'); });
    return '<svg class="sd-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Dotplots of 200 simulated values of each statistic, P, Q and R, with a line at the true value ' + esc(T.F(g.theta, g.d)) + '">' + out.join('') + '</svg>';
  }
})();
