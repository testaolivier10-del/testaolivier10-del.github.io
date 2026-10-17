/* Interval capture (simulator; docs/apstat-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApStatTools.mount; the model is
   ApStatMath.ciCapture (statistics/assets/tools/math/ci-capture.js),
   distributions come from ApStatDist (stat-dist.js), math text from ApStatTex,
   the frame is ApStatTools.modes (Explore, then Test yourself) on the Tool Studio.

   Explore: 100 confidence intervals from 100 random samples of the same
   population, one row each, against a line at the true value (population
   blue); each interval's center dot is its sample statistic (sample orange);
   an interval that captures the parameter is green, one that misses is
   vermillion, thicker and marked with a cross (never colour alone). Change
   the level and the SAME samples rebuild their intervals (the arms stretch
   or shrink, and some flip); change n and new samples are drawn. Every
   interval built since the last change counts toward the long run rate,
   plotted under the intervals against the level. Tap (or arrow to) an
   interval to read its parts: statistic, critical value × standard error.
   Test yourself: ApStatTools.drill over the model's generate(); the stage
   shows the problem's interval on its axis (or the 20 simulated intervals
   of a "count the captures" problem). */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath, P = window.ApStatPlot, X = window.ApStatTex;
  if(!T || !M || !M.ciCapture) return;
  var C = M.ciCapture, esc = T.esc;
  function F(x, d){ return T.F(x, d == null ? 2 : d); }
  function th(s){ return X ? X.html(s) : s; }
  function big(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function pct(x, d){ return String(+(x * 100).toFixed(d == null ? 1 : d)) + '%'; }
  var LEVELS = [0.8, 0.9, 0.95, 0.99];
  var NP = [10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 400, 1000], NM = [3, 4, 5, 6, 8, 10, 15, 20, 30, 50, 100];

  T.mount('ci-capture', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'ci-capture',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function explore(host, data){
    var E = data.explore || {}, POPS = [];
    (E.props || []).forEach(function(x){ POPS.push({ id: x.id, name: x.name, kind: 'prop', p: x.p, what: x.what, who: x.who }); });
    (E.means || []).forEach(function(x){ POPS.push({ id: x.id, name: x.name, kind: 'mean', mu: x.mu, sigma: x.sigma, shape: x.shape, what: x.what, unit: x.unit, who: x.who }); });
    var pop = POPS[0], level = 0.95, nIdx = { prop: 5, mean: 7 }, useZ = false, smps = [], res = null, sel = -1, LS = null, anim = null, touched = false, pTrue = pop ? pop.p : 0.4;
    var seed = 10000 + Math.floor(Math.random() * 89999), r = M.rng(seed), shownFrom = 0, tween = null;
    var nid = T.nid('ci');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem ci-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Confidence interval capture</h2>' +
      '<div class="ci-fig"><svg class="ci-svg" role="group" tabindex="0" xmlns="http://www.w3.org/2000/svg" aria-describedby="' + nid + '-kh"></svg><p id="' + nid + '-kh" class="sr-only">Up and down arrows pick an interval to read its parts.</p></div>' +
      '<div class="ci-ctl">' +
        '<div class="ci-lev ls-seg" role="group" aria-label="Confidence level">' + LEVELS.map(function(L){ return '<button type="button" data-l="' + L + '" aria-pressed="false">' + pct(L, 0) + '</button>'; }).join('') + '</div>' +
        '<div class="ci-n bt-ctl"><label for="' + nid + '-n">Sample size</label><div class="bt-slider-row"><button type="button" class="bt-step" data-d="-1" aria-label="Smaller samples">−</button><input type="range" id="' + nid + '-n" min="0" step="1" value="0"><button type="button" class="bt-step" data-d="1" aria-label="Larger samples">+</button><output class="bt-out" for="' + nid + '-n" aria-hidden="true"></output></div></div>' +
        '<div class="ci-go ls-act"><button type="button" class="btn-press sm ls-btn ls-pri ci-build">Build 100 intervals</button><button type="button" class="bt-btn ci-clear">Start over</button></div>' +
      '</div>' +
      '<div class="ci-say"></div>' +
      T.moreHtml('<fieldset class="ci-pops"><legend>Population and parameter</legend>' + POPS.map(function(x, i){ return '<label class="bt-radio"><input type="radio" name="' + nid + '-pop" value="' + i + '"' + (i ? '' : ' checked') + '> ' + esc(x.name) + (x.kind === 'prop' ? ' (a proportion, z interval)' : ' (a mean, t interval)') + '</label>'; }).join('') + '</fieldset><div class="ci-p"></div>' +
        '<label class="bt-radio ci-zopt"><input type="checkbox" class="ci-z"> Use z* instead of t* for a mean (the wrong critical value)</label><p class="bt-small ci-zwhy">With s in place of σ, intervals for a mean need the wider t*. Turn this on with a small n to see the capture rate fall below the level.</p><p class="bt-small ci-seed"></p>', 'population, critical value') +
      '<div class="ci-nums"></div><p class="sr-only ci-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.ci-live'));
    var cue = T.cue('Build 100 intervals, then change the level and watch them stretch.');
    $('.ci-ctl').insertBefore(cue.el, $('.ci-ctl').firstChild);
    var svg = $('.ci-svg'), range = $('.ci-n input'), out = $('.ci-n output');
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function ns(){ return pop.kind === 'prop' ? NP : NM; }
    function n(){ return ns()[nIdx[pop.kind]]; }
    function setup(){ return pop.kind === 'prop' ? { kind: 'prop', p: pTrue, n: n() } : { kind: 'mean', mu: pop.mu, sigma: pop.sigma, shape: pop.shape, n: n() }; }
    function setRange(){ range.max = String(ns().length - 1); range.value = String(nIdx[pop.kind]); out.textContent = 'n = ' + n(); range.setAttribute('aria-valuetext', 'n = ' + n()); }
    var pSl = T.slider({ label: 'True proportion p', min: 0.02, max: 0.98, step: 0.01, value: pTrue, decimals: 2, onInput: function(v){ pTrue = v; act(); clear(); } });
    $('.ci-p').appendChild(pSl.el);
    range.addEventListener('input', function(){ nIdx[pop.kind] = +range.value; act(); clear(); });
    $('.ci-n').querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', function(){ var v = Math.max(0, Math.min(ns().length - 1, nIdx[pop.kind] + (+b.getAttribute('data-d')))); if(v === nIdx[pop.kind]) return; nIdx[pop.kind] = v; act(); clear(); }); });
    function onClick(e){
      var b = e.target.closest('.ci-lev button');
      if(b){ setLevel(+b.getAttribute('data-l')); return; }
      if(e.target.closest('.ci-build')){ act(); build(); return; }
      if(e.target.closest('.ci-clear')){ act(); clear(); return; }
    }
    host.addEventListener('click', onClick);
    host.querySelectorAll('.ci-pops input').forEach(function(x){ x.addEventListener('change', function(){ pop = POPS[+x.value]; if(pop.kind === 'prop'){ pTrue = pop.p; pSl.set(pTrue); } act(); syncOpts(); clear(); }); });
    $('.ci-z').addEventListener('change', function(e){ useZ = e.target.checked; act(); recompute(true); });
    function syncOpts(){ var pp = $('.ci-p'), z = $('.ci-zopt'), zw = $('.ci-zwhy'); if(pp) pp.hidden = pop.kind !== 'prop'; if(z) z.hidden = pop.kind !== 'mean'; if(zw) zw.hidden = pop.kind !== 'mean'; }
    function syncLev(){ (LS ? LS.root : host).querySelectorAll('.ci-lev button').forEach(function(b){ b.setAttribute('aria-pressed', String(+b.getAttribute('data-l') === level)); }); }

    function stop(){ if(anim){ anim.stop(); anim = null; } if(tween){ tween.stop(); tween = null; } }
    function clear(){ stop(); smps = []; res = null; sel = -1; shownFrom = 0; setRange(); syncLev(); draw(); words(); }
    function recompute(animate){
      var old = res ? res.ivs.slice(Math.max(0, smps.length - 100)) : null;
      res = smps.length ? C.intervals(smps, setup(), level, { z: useZ }) : null;
      if(animate && old && res && P && !T.reduced()){
        var now = res.ivs.slice(Math.max(0, smps.length - 100));
        tween = P.loop(function(dt, t){ var k = Math.min(1, t / 0.45), e = 1 - Math.pow(1 - k, 3); draw({ from: old, to: now, k: e }); return k < 1; }, { onEnd: function(){ tween = null; draw(); } });
        tween.start();
      } else draw();
      words();
    }
    function setLevel(L){ if(L === level) return; act(); stop(); level = L; syncLev(); recompute(true); say('Level ' + pct(L, 0) + '. ' + tallyText()); }
    function build(){
      stop();
      if(smps.length >= 20000){ say('That is 20,000 intervals, the most this page keeps. Start over to begin again.'); return; }
      var s = setup(), fresh = C.batch(r, s, 100);
      smps = smps.concat(fresh); shownFrom = smps.length - 100; sel = -1;
      res = C.intervals(smps, s, level, { z: useZ });
      if(!P || T.reduced()){ draw(); words(); say(tallyText()); return; }
      anim = P.loop(function(dt, t){ var k = Math.min(100, Math.floor(t / 0.009)); draw({ grow: k }); return k < 100; }, { onEnd: function(){ anim = null; draw(); words(); say(tallyText()); } });
      anim.start();
    }
    function shown(){ return res ? res.ivs.slice(Math.max(0, smps.length - 100)) : []; }
    function tally(){ var all = res ? res.ivs.length : 0, hits = res ? res.hits : 0, sh = shown(), sHits = sh.filter(function(v){ return v.hit; }).length; return { all: all, hits: hits, sh: sh.length, sHits: sHits }; }
    function tallyText(){ var t = tally(); if(!t.all) return 'No intervals yet.'; return t.sHits + ' of these ' + t.sh + ' intervals capture ' + parName() + '. All ' + big(t.all) + ' so far: ' + pct(t.hits / t.all) + ' captured, at a ' + pct(level, 0) + ' level.'; }
    function parName(){ return pop.kind === 'prop' ? 'p' : 'μ'; }
    function trueVal(){ return pop.kind === 'prop' ? pTrue : pop.mu; }
    function dmn(){
      if(pop.kind === 'prop'){ var se = Math.sqrt(pTrue * (1 - pTrue) / n()), w = Math.max(0.02, 3.6 * se * 1.4); return [Math.max(-0.05, pTrue - w), Math.min(1.05, pTrue + w)]; }
      var se2 = pop.sigma / Math.sqrt(n()), tc = Math.min(6, M.Dist().invT(0.995, Math.max(1, n() - 1))), w2 = Math.max(3.4 * se2, 1.25 * tc * se2 * 1.35);
      return [pop.mu - w2, pop.mu + w2];
    }

    /* ---------------------------------------------------- the picture */
    function size(){ var rc = $('.ci-fig').getBoundingClientRect(); return [Math.max(260, Math.min(1400, Math.round(rc.width) || 640)), Math.max(300, Math.min(900, Math.round(rc.height) || 460))]; }
    function draw(fx){
      var wh = size(), W = wh[0], H = wh[1], phone = W < 520, L = phone ? 10 : 20, R = phone ? 10 : 20, pw = W - L - R;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      var G0 = geo(W, H), top = G0.top, bot = G0.bot, rowH = G0.rowH, rateH = G0.rateH, d = dmn(), g = [];
      function x(v){ return L + (v - d[0]) / (d[1] - d[0]) * pw; }
      var sh = fx && fx.to ? fx.to : shown(), from = fx && fx.from, k = fx && fx.k != null ? fx.k : 1, grow = fx && fx.grow != null ? fx.grow : 100;
      var tv = trueVal(), tx = x(tv), t0 = tally(), dP = pop.kind === 'prop' ? 3 : 1;
      var selV = sel > -1 && sh[sel] && !fx ? sh[sel] : null;
      if(selV) g.push('<text class="ci-h ci-c-samp" x="' + L + '" y="16">Interval ' + (sel + 1) + ': ' + (pop.kind === 'prop' ? 'p̂' : 'x̄') + ' = ' + F(selV.est, dP + 1) + ' ± ' + F(res.crit, 3) + ' × ' + F(selV.se, dP + 1) + '</text>');
      else g.push('<text class="ci-h" x="' + L + '" y="16">' + (sh.length ? big(sh.length) + ' intervals' : 'No intervals yet') + '<tspan class="ci-hs"> ' + pct(level, 0) + ' confidence, n = ' + n() + '</tspan></text>');
      if(sh.length && !(selV && phone)) g.push('<text class="ci-h ' + (t0.sHits / t0.sh >= level - 0.03 ? 'ci-c-hit' : 'ci-c-miss') + '" x="' + (W - R) + '" y="16" text-anchor="end">' + (fx && fx.grow != null ? '' : t0.sHits + ' of ' + t0.sh + ' capture ' + parName()) + '</text>');
      // the truth
      g.push('<line class="ci-true" x1="' + tx.toFixed(1) + '" x2="' + tx.toFixed(1) + '" y1="' + (top - 6) + '" y2="' + bot.toFixed(1) + '"/>');
      g.push('<text class="ci-lab ci-c-pop" x="' + (tx + 5).toFixed(1) + '" y="' + (bot + 14).toFixed(1) + '">' + parName() + ' = ' + F(tv, pop.kind === 'prop' ? 2 : 1) + ', the true value</text>');
      if(!sh.length) g.push('<text class="ci-empty" x="' + (L + pw / 2) + '" y="' + ((top + bot) / 2) + '" text-anchor="middle">Tap Build 100 intervals</text>');
      var sw = Math.max(1.6, Math.min(4, rowH * 0.62));
      sh.forEach(function(v, i){
        if(i >= grow) return;
        var lo = v.lo, hi = v.hi;
        if(from && from[i]){ lo = from[i].lo + (v.lo - from[i].lo) * k; hi = from[i].hi + (v.hi - from[i].hi) * k; }
        var hit = lo <= tv && tv <= hi, y = top + (i + 0.5) * rowH, x0 = Math.max(L, x(lo)), x1 = Math.min(W - R, x(hi));
        if(i === sel) g.push('<rect class="ci-selband" x="' + L + '" y="' + (y - Math.max(rowH, 8) / 2).toFixed(1) + '" width="' + pw + '" height="' + Math.max(rowH, 8).toFixed(1) + '" rx="3"/>');
        g.push('<line class="ci-iv ' + (hit ? 'is-hit' : 'is-miss') + (i === sel ? ' is-sel' : '') + '" x1="' + x0.toFixed(1) + '" x2="' + Math.max(x0 + 1, x1).toFixed(1) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" style="stroke-width:' + (hit ? sw : sw * 1.35).toFixed(1) + '"/>');
        if(!hit){ var cx = hi < tv ? x1 + 6 : x0 - 6, s = Math.max(2.5, Math.min(4.5, rowH * 0.9)); if(cx > L && cx < W - R) g.push('<path class="ci-x" d="M' + (cx - s).toFixed(1) + ' ' + (y - s).toFixed(1) + 'l' + (2 * s).toFixed(1) + ' ' + (2 * s).toFixed(1) + 'm0 ' + (-2 * s).toFixed(1) + 'l' + (-2 * s).toFixed(1) + ' ' + (2 * s).toFixed(1) + '"/>'); }
        if(rowH >= 2.6 || i === sel) g.push('<circle class="ci-est" cx="' + x(v.est).toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + Math.max(1.6, Math.min(3.4, rowH * 0.55)).toFixed(1) + '"/>');
      });
      // the selected interval's parts
      if(sel > -1 && sh[sel] && !fx){
        var v = sh[sel], y = top + (sel + 0.5) * rowH, ya = y - Math.max(8, rowH) - 2, ex0 = x(v.est), cr = res.crit;
        g.push('<path class="ci-brace" d="M' + x(v.lo).toFixed(1) + ' ' + (ya + 4).toFixed(1) + 'V' + ya.toFixed(1) + 'H' + x(v.hi).toFixed(1) + 'V' + (ya + 4).toFixed(1) + 'M' + ex0.toFixed(1) + ' ' + ya.toFixed(1) + 'v4"/>');

      }
      // axis
      g.push('<line class="ci-axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (bot + 22).toFixed(1) + '" y2="' + (bot + 22).toFixed(1) + '"/>');
      (P ? P.ticks(d[0], d[1], Math.max(3, Math.min(8, Math.round(pw / 90)))) : [d[0], d[1]]).forEach(function(t){ var xx = x(t); if(xx < L - 1 || xx > W - R + 1) return; g.push('<line class="ci-tick" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + (bot + 22).toFixed(1) + '" y2="' + (bot + 27).toFixed(1) + '"/><text class="ci-tk" x="' + xx.toFixed(1) + '" y="' + (bot + 40).toFixed(1) + '" text-anchor="middle">' + String(+t.toPrecision(6)).replace('-', '−') + '</text>'); });
      // the long run capture rate
      var ry0 = G0.ry0, ry1 = H - 6, rL = L + (phone ? 30 : 36), rW = W - R - rL;
      g.push('<text class="ci-h ci-small" x="' + L + '" y="' + (ry0 - 8) + '">Capture rate, all intervals<tspan class="ci-hs">' + (t0.all ? ' ' + pct(t0.hits / t0.all) + ' of ' + big(t0.all) : '') + '</tspan></text>');
      var yr = function(q){ return ry1 - (q - 0.5) / 0.5 * (ry1 - ry0 - 8); };
      [0.5, 0.75, 1].forEach(function(q){ g.push('<line class="ci-grid" x1="' + rL + '" x2="' + (W - R) + '" y1="' + yr(q).toFixed(1) + '" y2="' + yr(q).toFixed(1) + '"/><text class="ci-tk" x="' + (rL - 4) + '" y="' + (yr(q) + 4).toFixed(1) + '" text-anchor="end">' + pct(q, 0) + '</text>'); });
      g.push('<line class="ci-levl" x1="' + rL + '" x2="' + (W - R) + '" y1="' + yr(level).toFixed(1) + '" y2="' + yr(level).toFixed(1) + '"/>');
      if(res && res.ivs.length && !fx){
        var N = res.ivs.length, step = Math.max(1, Math.floor(N / 200)), pts = [], h = 0;
        for(var i = 0; i < N; i++){ if(res.ivs[i].hit) h++; if((i + 1) % step === 0 || i === N - 1) pts.push((rL + (i + 1) / N * rW).toFixed(1) + ',' + yr(Math.max(0.5, h / (i + 1))).toFixed(1)); }
        g.push('<polyline class="ci-rate" points="' + pts.join(' ') + '"/>');
        g.push('<text class="ci-tk" x="' + (W - R) + '" y="' + (yr(level) - 4).toFixed(1) + '" text-anchor="end">level ' + pct(level, 0) + '</text>');
      }
      svg.innerHTML = g.join('');
      if(!fx) svg.setAttribute('aria-label', 'Confidence intervals against the true value. ' + tallyText() + (sel > -1 && sh[sel] ? ' Selected: ' + ivText(sh[sel], sel) : ''));
    }
    /* rows from top to bot; the axis under them; then the capture rate strip */
    function geo(W, H){ var phone = W < 520, rateH = phone ? 66 : 80, top = 32, bot = H - rateH - 70; return { top: top, bot: bot, rowH: (bot - top) / 100, rateH: rateH, ry0: bot + 72 }; }
    function ivText(v, i){ return 'Interval ' + (i + 1) + ': from ' + F(v.lo, 3) + ' to ' + F(v.hi, 3) + (v.hit ? ', captures ' : ', misses ') + parName() + '.'; }

    /* pick an interval: tap near its row, or arrow keys */
    svg.addEventListener('click', function(e){
      var sh = shown(); if(!sh.length) return;
      var rc = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, y = (e.clientY - rc.top) * vb.height / rc.height, W = vb.width, H = vb.height, phone = W < 520;
      var G1 = geo(W, H), i = Math.floor((y - G1.top) / G1.rowH);
      if(i < 0 || i >= sh.length) return;
      act(); sel = i; draw(); words(); say(ivText(sh[i], i));
    });
    svg.addEventListener('keydown', function(e){
      var sh = shown(); if(!sh.length) return;
      if(e.key === 'ArrowDown') sel = Math.min(sh.length - 1, sel + 1); else if(e.key === 'ArrowUp') sel = Math.max(0, sel < 0 ? 0 : sel - 1);
      else if(e.key === 'Home') sel = 0; else if(e.key === 'End') sel = sh.length - 1; else return;
      e.preventDefault(); act(); draw(); words(); say(ivText(sh[sel], sel));
    });

    /* ---------------------------------------------- words and numbers */
    function condNote(){
      var s = setup();
      if(s.kind === 'prop'){ var a = s.n * s.p, b = s.n * (1 - s.p); if(a < 10 || b < 10) return 'With n = ' + s.n + ', the expected ' + (a < 10 ? 'successes' : 'failures') + ' (' + F(Math.min(a, b), 1) + ') are under 10: large counts fails and these intervals capture p less often than the level says.'; return ''; }
      if(useZ && s.n < 30) return 'z* is too small for a mean with s: the intervals are too narrow and capture μ less often than the level says.';
      if(s.shape === 'skewed' && s.n < 30) return 'The population is skewed and n = ' + s.n + ' is under 30, so the t interval’s capture rate can fall short of the level.';
      return '';
    }
    function words(){
      var t0 = tally(), head, sub = '';
      if(!t0.all) head = 'Tap Build 100 intervals: 100 random samples, one interval from each.';
      else {
        head = t0.sHits + ' of these ' + t0.sh + ' intervals capture ' + parName() + ' = ' + F(trueVal(), pop.kind === 'prop' ? 2 : 1) + '.';
        sub = 'All ' + big(t0.all) + ' so far: ' + pct(t0.hits / t0.all) + ' captured' + (t0.all >= 1000 ? ', close to the long run rate' : '') + '. ' + (condNote() || 'Tap an interval to read its parts.');
      }
      if(sel > -1 && shown()[sel]){ var v = shown()[sel]; sub = ivText(v, sel) + ' ' + (pop.kind === 'prop' ? 'p̂' : 'x̄') + ' = ' + F(v.est, 3) + ', margin of error ' + F(res.crit, 3) + ' × ' + F(v.se, 4) + ' = ' + F(v.me, 4) + '.'; }
      T.explain($('.ci-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), whyHtml());
      nums();
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore');
        LS.pills(t0.all ? [{ k: 'These ' + t0.sh, html: t0.sHits + ' capture', tone: 'readout' }] : [], 'left', 'explore');
        LS.pills(t0.all ? [{ k: 'Long run', html: pct(t0.hits / t0.all), tone: Math.abs(t0.hits / t0.all - level) <= 0.015 || t0.all < 500 ? 'good' : 'warn' }] : [], 'right', 'explore');
      }
      var sd = $('.ci-seed'); if(sd) sd.textContent = 'Seed ' + seed + '.';
    }
    function whyHtml(){
      var L = pct(level, 0), isP = pop.kind === 'prop', s = setup();
      return '<p><b>One row, one sample.</b> Each line is a ' + L + ' confidence interval built from its own random sample of ' + s.n + '. The dot is that sample’s ' + (isP ? 'proportion p̂' : 'mean x̄') + '. The blue line is the true ' + (isP ? 'proportion' : 'mean') + ', which in real life we never see.</p>' +
        '<p><b>What ' + L + ' means.</b> The method captures the true value in about ' + L + ' of samples. Any one interval either captures it or misses (the crossed ones); the ' + L + ' is the long run rate, plotted under the intervals.</p>' +
        '<p><b>The margin of error</b> is critical value × standard error: ' + (isP ? th('$z^* \\sqrt{\\hat{p}(1 - \\hat{p})/n}$') : th(useZ ? '$z^* \\, s/\\sqrt{n}$' : '$t^* \\, s/\\sqrt{n}$')) + '. A higher level needs a larger critical value, so every interval gets wider. A sample 4 times as large halves the standard error, so the intervals get about half as wide.</p>' +
        (condNote() ? '<p><b>Conditions.</b> ' + esc(condNote()) + '</p>' : '') +
        '<p><b>Say it right.</b> "We are ' + L + ' confident that the interval from … to … captures the true ' + (isP ? 'proportion' : 'mean') + ' of all …". Not "' + L + ' of the data", and not "a ' + L + ' chance this interval is right".</p>';
    }
    function nums(){
      var box = $('.ci-nums'), s = setup(), isP = s.kind === 'prop', rows = LEVELS.map(function(Lv){ var c = C.crit(s, Lv, { z: useZ }); return '<tr' + (Lv === level ? ' class="hl"' : '') + '><th scope="row">' + pct(Lv, 0) + '</th><td class="r">' + F(c, 3) + '</td></tr>'; }).join('');
      var v = sel > -1 ? shown()[sel] : null;
      box.innerHTML = '<h3 class="ls-title-l">' + (v ? 'Interval ' + (sel + 1) + ', step by step' : 'The critical values') + '</h3>' +
        (v ? '<p>' + th(isP ? '$\\hat{p} = ' + M.fixed(v.est, 4) + '$, $\\text{SE} = \\sqrt{\\frac{' + M.fixed(v.est, 4) + '(' + M.fixed(1 - v.est, 4) + ')}{' + s.n + '}} = ' + M.fixed(v.se, 4) + '$' : '$\\bar{x} = ' + M.fixed(v.est, 3) + '$, $s = ' + M.fixed(v.se * Math.sqrt(s.n), 3) + '$, $\\text{SE} = \\frac{s}{\\sqrt{' + s.n + '}} = ' + M.fixed(v.se, 4) + '$') + '</p><p>' + th('$\\text{ME} = ' + M.fixed(res.crit, 3) + ' \\times ' + M.fixed(v.se, 4) + ' = ' + M.fixed(v.me, 4) + '$') + ', so the interval is from ' + F(v.lo, 4) + ' to ' + F(v.hi, 4) + (v.hit ? ': it captures ' : ': it misses ') + parName() + ' = ' + F(trueVal(), 3) + '.</p>' : '') +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Critical values by level"><table class="ls-tbl"><caption class="sr-only">Critical value for each confidence level</caption><thead><tr><th scope="col">Level</th><th scope="col">' + (isP || useZ ? 'z*' : 't*, df = ' + (s.n - 1)) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.ci-fig')], dock: [$('.ci-ctl')], setup: 'Population', moreLabel: 'Population, critical value', why: [$('.ci-say')], details: [$('.ci-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      syncOpts(); clear();
      sp.setup(pop.name);
      s.root.querySelectorAll('.ci-pops input').forEach(function(x){ x.addEventListener('change', function(){ sp.setup(pop.name); }); });
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.ci-build'), text: 'Start here: build 100 intervals' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ if(!anim && !tween) draw(); }, 60); }).observe($('.ci-fig')); }
    }
    syncOpts(); setRange(); syncLev(); draw(); words();
    return { stop: stop, studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    var o = { slug: 'ci-capture', noun: 'drill',
      generate: function(r, ctx, type){ return C.generate(r, ctx, type); },
      types: [{ value: 'prop', label: 'Interval for a proportion' }, { value: 'mean', label: 'Interval for a mean' }, { value: 'claim', label: 'A claim from an interval' }, { value: 'capture', label: 'What the level means' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { prop: 'A confidence interval for p', mean: 'A confidence interval for μ', claim: 'A claim from an interval', capture: 'Counting captures' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ var st = api.st; st[s.key] = true; if(s.key === 'me' || s.key === 'interp' || s.key === 'claim' || s.key === 'count' || s.key === 'mefrom') figure(api.fig, api.problem, st); }
    };
    T.drill(host, data, o);
  }
  /* The drill figure: the problem's interval on its axis, its parts shown
     once the margin of error is answered (never before); or the 20
     simulated intervals of a counting problem. */
  function figure(el, p, st){
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, W = phone ? 340 : 600, H = g.kind === 'many' ? (phone ? 380 : 340) : (phone ? 260 : 240), L = 18, R = W - 18, out = [];
    if(g.kind === 'many'){
      var lo = Infinity, hi = -Infinity; g.ivs.forEach(function(v){ lo = Math.min(lo, v.lo); hi = Math.max(hi, v.hi); });
      var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
      var x = function(v){ return L + (v - lo) / (hi - lo) * (R - L); }, top = 30, bot = H - 40, rh = (bot - top) / g.ivs.length, tx = x(g.p), reveal = !!st.count;
      out.push('<text class="ci-h" x="' + L + '" y="16">20 intervals, ' + esc(g.L) + ' confidence</text>');
      out.push('<line class="ci-true" x1="' + tx.toFixed(1) + '" x2="' + tx.toFixed(1) + '" y1="' + (top - 6) + '" y2="' + bot + '"/><text class="ci-lab ci-c-pop" x="' + (tx + 5).toFixed(1) + '" y="' + (bot + 14) + '">p = ' + T.F(g.p, 2) + '</text>');
      g.ivs.forEach(function(v, i){
        var y = top + (i + 0.5) * rh, cls = reveal ? (v.hit ? 'is-hit' : 'is-miss') : 'is-plain';
        out.push('<line class="ci-iv ' + cls + '" x1="' + x(v.lo).toFixed(1) + '" x2="' + x(v.hi).toFixed(1) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" style="stroke-width:' + (reveal && !v.hit ? 5 : 3.5) + '"/><circle class="ci-est" cx="' + x(v.est).toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.2"/>');
        if(reveal && !v.hit){ var cx = v.hi < g.p ? x(v.hi) + 8 : x(v.lo) - 8; out.push('<path class="ci-x" d="M' + (cx - 4) + ' ' + (y - 4).toFixed(1) + 'l8 8m0 -8l-8 8"/>'); }
      });
      axis(lo, hi, x, bot + 22);
      el.innerHTML = '<figure class="ci-qfig"><svg class="ci-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Twenty confidence intervals, one per row, with a vertical line at the true proportion ' + esc(T.F(g.p, 2)) + (reveal ? '; ' + g.ivs.filter(function(v){ return v.hit; }).length + ' capture it' : '') + '">' + out.join('') + '</svg></figure>';
      return;
    }
    var shownParts = !!(st.me || st.mefrom || p.type === 'claim'), lo2 = g.lo, hi2 = g.hi, span = hi2 - lo2;
    var a = lo2 - span * 0.6, b = hi2 + span * 0.6;
    if(g.p0 != null){ a = Math.min(a, g.p0 - span * 0.25); b = Math.max(b, g.p0 + span * 0.25); }
    var x2 = function(v){ return L + (v - a) / (b - a) * (R - L); }, y = H * 0.48, unit = g.unit ? ' ' + g.unit : '';
    var sym = g.sym === '\\hat{p}' ? 'p̂' : 'x̄';
    out.push('<text class="ci-h" x="' + L + '" y="18">' + (shownParts ? 'The ' + esc(g.L) + ' interval' : 'The sample') + '</text>');
    if(shownParts){
      out.push('<line class="ci-iv is-plain" x1="' + x2(lo2).toFixed(1) + '" x2="' + x2(hi2).toFixed(1) + '" y1="' + y + '" y2="' + y + '" style="stroke-width:6"/>');
      out.push('<path class="ci-brace" d="M' + x2(g.est).toFixed(1) + ' ' + (y - 16) + 'V' + (y - 22) + 'H' + x2(hi2).toFixed(1) + 'V' + (y - 16) + '"/><text class="ci-lab ci-c-samp" x="' + ((x2(g.est) + x2(hi2)) / 2).toFixed(1) + '" y="' + (y - 28) + '" text-anchor="middle">ME = ' + T.F(g.me, 4) + '</text>');
      [[lo2, 'end'], [hi2, 'start']].forEach(function(e){ out.push('<text class="ci-lab" x="' + (x2(e[0]) + (e[1] === 'end' ? -6 : 6)).toFixed(1) + '" y="' + (y + 5) + '" text-anchor="' + e[1] + '">' + T.F(e[0], g.d) + '</text>'); });
    }
    out.push('<circle class="ci-est" cx="' + x2(g.est).toFixed(1) + '" cy="' + y + '" r="6"/><text class="ci-lab ci-c-samp" x="' + x2(g.est).toFixed(1) + '" y="' + (y + 26) + '" text-anchor="middle">' + sym + ' = ' + T.F(g.est, g.d) + unit + '</text>');
    if(g.p0 != null){ var px = x2(g.p0); out.push('<line class="ci-claim" x1="' + px.toFixed(1) + '" x2="' + px.toFixed(1) + '" y1="' + (y - 40) + '" y2="' + (y + 40) + '"/><text class="ci-lab ci-c-miss" x="' + px.toFixed(1) + '" y="' + (y + 54) + '" text-anchor="middle">claim: ' + T.F(g.p0, 2) + '</text>'); }
    axis(a, b, x2, H - 34);
    el.innerHTML = '<figure class="ci-qfig"><svg class="ci-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(sym + ' = ' + T.F(g.est, g.d) + (shownParts ? '; the interval from ' + T.F(lo2, g.d) + ' to ' + T.F(hi2, g.d) : '') + (g.p0 != null ? '; the claimed value ' + T.F(g.p0, 2) : '')) + '">' + out.join('') + '</svg></figure>';
    function axis(a0, b0, xf, yb){
      out.push('<line class="ci-axis" x1="' + L + '" x2="' + R + '" y1="' + yb + '" y2="' + yb + '"/>');
      (P ? P.ticks(a0, b0, 6) : [a0, b0]).forEach(function(t){ var xx = xf(t); out.push('<line class="ci-tick" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + yb + '" y2="' + (yb + 5) + '"/><text class="ci-tk" x="' + xx.toFixed(1) + '" y="' + (yb + 18) + '" text-anchor="middle">' + String(+t.toPrecision(6)).replace('-', '−') + '</text>'); });
    }
  }
})();
