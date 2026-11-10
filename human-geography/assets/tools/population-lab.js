/* Population lab page (docs/aphug-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T3). Mounts into #app with ApHugTools.mount; the model is
   ApHugMath.populationLab (human-geography/assets/tools/math/population-lab.js),
   the content human-geography/data/tools/population-lab.json (served filtered
   as assets/tool-data/population-lab.json). The Explore view is a port of AP®
   Environmental Science's age-structure trainer, with the five stages of the
   demographic transition model, ApHugCalc rates and what the age structure
   means for schools, jobs and care.

   Explore: one invented country you steer through the transition.
     Stage chips 1 to 5 set its birth and death rates, fertility and life
     expectancy to teaching values for the stage; fertility and life
     expectancy sliders fine-tune them. The pyramid is the model's (every bar
     the % of the population in that group, males left, females right) and
     morphs between states (reduced motion: no tween). Beside it (below it on
     a phone) the transition chart: birth and death rate curves through the
     five stages, the gap between them shaded, a marker at this country. A
     strip over the pyramid gives the young, working-age and older shares.
     Tap a bar (or arrow keys on the pyramid) to read that group. Why: the
     stage, the shape, the rates worked by hand, schools, jobs and care, and
     the model's limits. Details: the numbers and the bars as a table.
   Test yourself: ApHugTools.drill over the model's generate(); pyramids are
   drawn by ApHugPlot (kind pyramid), the transition chart here. */
(function(){
  'use strict';
  var T = window.ApHugTools, M = window.ApHugMath, P = window.ApHugPlot;
  if(!T || !M || !M.populationLab) return;
  var A = M.populationLab, nf = A.nf;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var app0 = document.getElementById('app');
  if(app0 && !app0.getAttribute('data-details-title')) app0.setAttribute('data-details-title', 'Numbers');
  function r1(v){ return Math.round(v * 10) / 10; }
  function tx(x, y, s, cls, anchor){ return '<text x="' + r1(x) + '" y="' + r1(y) + '"' + (cls ? ' class="' + cls + '"' : '') + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>'; }
  function reduced(){ return P && P.reduced ? P.reduced() : false; }
  function studioOf(el){ var s = window.LevlStudio && window.LevlStudio.get(); var root = document.getElementById('app'); return s && root && root.getAttribute('data-studio') && root.contains(el) ? s : null; }

  T.mount('population-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'population-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------ the pyramid */
  function pyrSvg(pyr, o){
    var n = pyr.groups.length, x0 = o.x0 || 0, W = o.w || o.W, H = o.H, ph = W < 380, lab = ph ? 40 : 50, top = o.top || 26, bot = 34;
    var cx = x0 + W / 2, half = (W - lab) / 2 - 18, bh = (H - top - bot) / n, mx = o.max || 14;
    var sx = function(v){ return half * Math.min(v, mx) / mx; };
    var out = [];
    var stp = mx > 16 ? 5 : mx > 6 ? 2 : 1, lbl = mx > 16 ? 5 : mx > 10 ? 4 : mx > 6 ? 2 : 1;
    for(var v = stp; v <= mx + 1e-9; v += stp){
      [-1, 1].forEach(function(sg){ var xx = cx + sg * (lab / 2 + sx(v)); out.push('<line class="hug-pl-grid" x1="' + r1(xx) + '" x2="' + r1(xx) + '" y1="' + top + '" y2="' + r1(H - bot) + '"/>'); });
      if(v % lbl === 0) [-1, 1].forEach(function(sg){ out.push(tx(cx + sg * (lab / 2 + sx(v)), H - bot + 15, v + '%', 'hug-pl-tk', 'middle')); });
    }
    for(var i = 0; i < n; i++){
      var y = H - bot - (i + 1) * bh, m = pyr.male[i], f = pyr.female[i], on = o.sel === i ? ' is-sel' : '';
      out.push('<rect class="hug-pl-m' + on + '" x="' + r1(cx - lab / 2 - sx(m)) + '" y="' + r1(y + 1) + '" width="' + r1(sx(m)) + '" height="' + r1(Math.max(1, bh - 2)) + '" rx="2"/>');
      out.push('<rect class="hug-pl-f' + on + '" x="' + r1(cx + lab / 2) + '" y="' + r1(y + 1) + '" width="' + r1(sx(f)) + '" height="' + r1(Math.max(1, bh - 2)) + '" rx="2"/>');
      if(!ph || i % 2 === 0 || o.sel === i) out.push(tx(cx, y + bh / 2 + 4, pyr.groups[i], 'hug-pl-age' + on, 'middle'));
      out.push('<rect class="hug-pl-hit" data-i="' + i + '" x="' + r1(x0) + '" y="' + r1(y) + '" width="' + r1(W) + '" height="' + r1(bh) + '"/>');
    }
    out.push(tx(cx - lab / 2 - 4, top - 10, 'Male', 'hug-pl-sex is-m', 'end'), tx(cx + lab / 2 + 4, top - 10, 'Female', 'hug-pl-sex is-f', 'start'));
    if(o.bands){
      var yb = function(k){ return H - bot - k * bh; }, bx = x0 + 6;
      out.push('<path class="hug-pl-br is-young" d="M' + (bx + 6) + ' ' + r1(yb(0) - 1) + 'H' + bx + 'V' + r1(yb(3) + 1) + 'H' + (bx + 6) + '"/>' + tx(bx + 10, (yb(0) + yb(3)) / 2 + 4, ph ? '<15' : 'under 15', 'hug-pl-brl is-young', 'start'));
      out.push('<path class="hug-pl-br is-old" d="M' + (bx + 6) + ' ' + r1(yb(13) - 1) + 'H' + bx + 'V' + r1(yb(17) + 1) + 'H' + (bx + 6) + '"/>' + tx(bx + 10, (yb(13) + yb(17)) / 2 + 4, '65+', 'hug-pl-brl is-old', 'start'));
    }
    out.push(tx(cx, H - 4, '% of the population', 'hug-pl-axl', 'middle'));
    if(o.sel != null){
      var si = o.sel, yy = H - bot - (si + 1) * bh, tot = pyr.male[si] + pyr.female[si], tw = ph ? 64 : 74, tx0 = Math.min(cx + lab / 2 + sx(pyr.female[si]) + 8, x0 + W - tw - 2);
      out.push('<g class="hug-pl-tip"><rect x="' + r1(tx0) + '" y="' + r1(yy + bh / 2 - 12) + '" width="' + tw + '" height="24" rx="12"/>' + tx(tx0 + tw / 2, yy + bh / 2 + 5, nf(tot, 1) + '%', '', 'middle') + '</g>');
    }
    return out.join('');
  }

  /* ------------------------------------- the demographic transition */
  /* Teaching curves through each stage's typical rates: a monotone cubic
     (Fritsch-Carlson), so the curves never wobble between the stages. */
  var CURVE = [[0.5, 41, 39], [1, 40.5, 37], [2, 38, 15], [3, 22, 8], [4, 11, 9], [5, 8, 11], [5.5, 7.6, 11.6]];
  function mono(k){
    var X = CURVE.map(function(p){ return p[0]; }), Y = CURVE.map(function(p){ return p[k]; }), n = X.length, d = [], m = [];
    for(var i = 0; i < n - 1; i++) d.push((Y[i + 1] - Y[i]) / (X[i + 1] - X[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for(var j = 1; j < n - 1; j++) m[j] = d[j - 1] * d[j] <= 0 ? 0 : (d[j - 1] + d[j]) / 2;
    for(var q = 0; q < n - 1; q++){ if(d[q] === 0){ m[q] = m[q + 1] = 0; continue; } var a = m[q] / d[q], b = m[q + 1] / d[q], h = a * a + b * b; if(h > 9){ var t = 3 / Math.sqrt(h); m[q] = t * a * d[q]; m[q + 1] = t * b * d[q]; } }
    return function(x){
      var i = 0; while(i < n - 2 && x > X[i + 1]) i++;
      var hh = X[i + 1] - X[i], t = Math.max(0, Math.min(1, (x - X[i]) / hh)), t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * Y[i] + (t3 - 2 * t2 + t) * hh * m[i] + (-2 * t3 + 3 * t2) * Y[i + 1] + (t3 - t2) * hh * m[i + 1];
    };
  }
  var BIRTH = mono(1), DEATH = mono(2);
  function rateAt(s){ return { cbr: BIRTH(s), cdr: DEATH(s) }; }
  function transSvg(o){
    var x0 = o.x0 || 0, W = o.w, H = o.H, ph = W < 380, L = x0 + (ph ? 28 : 36), R = x0 + W - (o.hide ? 84 : o.corner ? 46 : 8), top = o.top || 26, B = H - 40, mx = 45;
    var x = function(s){ return L + (R - L) * (s - 0.5) / 5; }, y = function(v){ return B - (B - top) * v / mx; };
    var out = [], b = [], d = [];
    for(var k = 0; k <= 100; k++){ var s = 0.5 + 5 * k / 100, rr = rateAt(s); b.push([x(s), y(rr.cbr)]); d.push([x(s), y(rr.cdr)]); }
    [1, 2, 3, 4, 5].forEach(function(st){ var xa = x(st - 0.5), xb = x(st + 0.5); out.push('<rect class="hug-pl-band' + (st % 2 ? '' : ' is-alt') + (o.stage === st ? ' is-on' : '') + '" x="' + r1(xa) + '" y="' + top + '" width="' + r1(xb - xa) + '" height="' + r1(B - top) + '"/>' + tx((xa + xb) / 2, B + 16, String(st), 'hug-pl-stn' + (o.stage === st ? ' is-on' : ''), 'middle')); });
    out.push(tx((L + R) / 2, B + 34, 'stage of the model', 'hug-pl-axl', 'middle'));
    [0, 10, 20, 30, 40].forEach(function(v){ out.push('<line class="hug-pl-grid" x1="' + L + '" x2="' + R + '" y1="' + r1(y(v)) + '" y2="' + r1(y(v)) + '"/>' + tx(L - 5, y(v) + 4, String(v), 'hug-pl-tk', 'end')); });
    var pts = function(a){ return a.map(function(p){ return r1(p[0]) + ',' + r1(p[1]); }); };
    out.push('<polygon class="hug-pl-gap" points="' + pts(b).concat(pts(d.slice().reverse())).join(' ') + '"/>');
    out.push('<polyline class="hug-pl-cbr" points="' + pts(b).join(' ') + '"/><polyline class="hug-pl-cdr" points="' + pts(d).join(' ') + '"/>');
    out.push(tx(x(ph ? 3.25 : 3.1), y(rateAt(ph ? 3.25 : 3.1).cbr) - 10, 'birth rate', 'hug-pl-cbrl', 'start'), tx(x(0.62), y(rateAt(0.62).cdr) + 26, 'death rate', 'hug-pl-cdrl', 'start'));
    out.push(tx(L, top - 10, 'per 1,000 people a year', 'hug-pl-axl', 'start'));
    if(o.cbr != null && !o.hide){
      var xm = x(o.pos);
      out.push('<line class="hug-pl-now" x1="' + r1(xm) + '" x2="' + r1(xm) + '" y1="' + top + '" y2="' + B + '"/>');
      out.push('<circle class="hug-pl-dot is-b" cx="' + r1(xm) + '" cy="' + r1(y(o.cbr)) + '" r="6"/><circle class="hug-pl-dot is-d" cx="' + r1(xm) + '" cy="' + r1(y(o.cdr)) + '" r="6"/>');
    }
    if(o.hide && o.cbr != null){
      // A drill before its stage step: only the two rates, at the right edge, no stage marked.
      // A drill before its stage step: the two rates in their own column at the right, no stage marked.
      var xc = R + 42;
      out.push('<g>' + tx(xc, top - 10, 'Country', 'hug-pl-axl', 'middle') + '<line class="hug-pl-grid" x1="' + r1(xc) + '" x2="' + r1(xc) + '" y1="' + top + '" y2="' + B + '"/><circle class="hug-pl-dot is-b" cx="' + r1(xc) + '" cy="' + r1(y(o.cbr)) + '" r="6"/><circle class="hug-pl-dot is-d" cx="' + r1(xc) + '" cy="' + r1(y(o.cdr)) + '" r="6"/>' + tx(xc + 9, y(o.cbr) + 4, String(o.cbr), 'hug-pl-tk', 'start') + tx(xc + 9, y(o.cdr) + 4, String(o.cdr), 'hug-pl-tk', 'start') + '</g>');
    }
    return out.join('');
  }
  function posOf(cbr, cdr, stage){
    var best = stage, bd = Infinity;
    for(var s = Math.max(0.6, stage - 0.49); s <= Math.min(5.4, stage + 0.49); s += 0.02){ var r = rateAt(s), dd = Math.pow(r.cbr - cbr, 2) + Math.pow(r.cdr - cdr, 2); if(dd < bd){ bd = dd; best = s; } }
    return best;
  }

  /* --------------------------------------------------------- explore */
  function explore(host, data){
    var view = 'pyr', stage = 2, S2 = A.STAGES[2], tfr = S2.tfr, e0 = S2.e0, cbr = S2.cbr, cdr = S2.cdr, sel = null, LS = null, touched = false, anim = null, shown = null, nid = 'hug-pl-' + Math.floor(Math.random() * 1e6);
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem hug-pl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Population lab</h2>' +
      '<div class="hug-pl-stage"><div class="hug-pl-views tseg" role="group" aria-label="Chart"><button type="button" class="hug-pl-vw on" data-v="pyr" aria-pressed="true">Pyramid</button><button type="button" class="hug-pl-vw" data-v="dtm" aria-pressed="false">Birth and death rates</button></div><div class="hug-pl-strip" aria-hidden="true"></div><div class="hug-pl-fig"><svg class="hug-pl-svg" role="img" tabindex="0" xmlns="http://www.w3.org/2000/svg"></svg></div><p class="hug-pl-note">Country P is invented: a teaching model.</p></div>' +
      '<div class="hug-pl-ctl">' +
        '<p class="hug-pl-lab" id="' + nid + '-st">Stage of the demographic transition model</p>' +
        '<div class="hug-pl-stages tseg" role="group" aria-labelledby="' + nid + '-st">' + [1, 2, 3, 4, 5].map(function(s){ return '<button type="button" class="hug-pl-st' + (s === stage ? ' on' : '') + '" data-s="' + s + '" aria-pressed="' + (s === stage) + '" aria-label="Stage ' + s + '">' + s + '</button>'; }).join('') + '</div>' +
        '<div class="hug-pl-sl-t"></div>' +
      '</div>' +
      '<div class="hug-pl-say"></div>' +
      T.moreHtml('<div class="hug-pl-sl-e"></div><p class="bt-small">Life expectancy at birth. Low values mostly mean many children die young.</p>', 'life expectancy') +
      '<div class="hug-pl-nums"></div><p class="sr-only hug-pl-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.hug-pl-live'));
    var cue = T.cue('Step through stages 1 to 5 and watch the pyramid change shape.');
    $('.hug-pl-ctl').insertBefore(cue.el, $('.hug-pl-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var slT = T.slider({ label: 'Total fertility rate (children per woman)', min: 1.0, max: 7.0, step: 0.1, value: tfr, decimals: 1, onInput: function(v){ tfr = v; act(); custom(); } });
    var slE = T.slider({ label: 'Life expectancy at birth (years)', min: 30, max: 86, step: 1, value: e0, decimals: 0, onInput: function(v){ e0 = v; act(); custom(); } });
    $('.hug-pl-sl-t').appendChild(slT.el); $('.hug-pl-sl-e').appendChild(slE.el);
    var svg = $('.hug-pl-svg');
    /* A slider move: the crude rates follow from the model population (the
       births its women have and the deaths its age mix implies). */
    function custom(){
      var pyr = A.pyramid(tfr, e0), b = A.broad(pyr), women = 0;
      for(var i = 3; i <= 9; i++) women += pyr.female[i];
      cbr = Math.max(5, Math.min(50, Math.round(tfr / 35 * women * 10)));
      cdr = Math.round(Math.max(4, Math.min(45, 1000 / e0 * (0.55 + b.old / 40) * (e0 > 70 ? 0.85 : 1))));
      stage = A.stageOf(cbr, cdr);
      draw(true); chips();
    }
    function setStage(s){ stage = s; var S0 = A.STAGES[s]; tfr = S0.tfr; e0 = S0.e0; cbr = S0.cbr; cdr = S0.cdr; slT.set(tfr); slE.set(e0); draw(true); chips(); }
    function chips(){ (LS ? LS.root : host).querySelectorAll('.hug-pl-st').forEach(function(x){ var on = +x.getAttribute('data-s') === stage; x.setAttribute('aria-pressed', String(on)); x.classList.toggle('on', on); }); }
    function size(){ var b = svg.getBoundingClientRect(); return [Math.max(300, Math.round(b.width || 640)), Math.max(320, Math.round(b.height || 440))]; }
    function draw(tween){
      var target = A.pyramid(tfr, e0);
      if(tween && shown && !reduced() && P && P.loop){
        if(anim) anim.stop();
        var from = shown;
        anim = P.loop(function(dt, t){ var k = Math.min(1, t / 0.45), e = k * (2 - k); render({ groups: target.groups, male: from.male.map(function(v, i){ return v + (target.male[i] - v) * e; }), female: from.female.map(function(v, i){ return v + (target.female[i] - v) * e; }) }); return k < 1; },
          { duration: 0.5, onEnd: function(){ render(target); anim = null; } });
        anim.start();
      } else render(target);
      words(target);
    }
    function render(pyr){
      shown = pyr;
      var wh = size(), W = wh[0], H = wh[1], side = W >= 640, pw = side ? Math.round(W * 0.55) : W, tw = side ? W - pw - 24 : W;
      // A phone shows one chart at a time (the Pyramid / Birth and death rates switch).
      var vs = $('.hug-pl-views'); if(vs) vs.hidden = side;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var big = Math.max.apply(null, pyr.male.concat(pyr.female)) * 1.12, mx = [5, 8, 12, 16, 20].filter(function(v){ return v >= big; })[0] || 26;
      var trans = transSvg({ w: tw, H: H, corner: !side, stage: stage, cbr: cbr, cdr: cdr, pos: posOf(cbr, cdr, stage), top: 24 });
      if(side) svg.innerHTML = pyrSvg(pyr, { W: W, w: pw, H: H, sel: sel, max: mx, bands: true }) + '<g transform="translate(' + (pw + 24) + ' 0)">' + trans + '</g>';
      else svg.innerHTML = view === 'dtm' ? trans : pyrSvg(pyr, { W: W, w: W, H: H, sel: sel, max: mx, bands: true });
    }
    function words(pyr){
      var sh = A.shape(pyr), b = A.broad(pyr), g = A.rni(cbr, cdr), dbl = A.doubling(g), S0 = A.STAGES[stage], SH = A.SHAPES[sh], dep = A.dependency(b), nd = A.needs(b);
      var head = !touched ? 'Stage 2: deaths have fallen but births are still high, so the base is wide. Try stages 3, 4 and 5.' :
        SH.name + ' pyramid; rates consistent with stage ' + stage + '. RNI ' + nf(g, 1) + '% a year' + (dbl ? ' (doubling in about ' + nf(dbl) + ' years).' : g < 0 ? ' (natural decrease).' : ' (no growth).');
      $('.hug-pl-strip').innerHTML = '<span class="hug-pl-chip is-young"><b>' + nf(b.young, 0) + '%</b> under 15</span><span class="hug-pl-chip is-work"><b>' + nf(b.work, 0) + '%</b> 15 to 64</span><span class="hug-pl-chip is-old"><b>' + nf(b.old, 0) + '%</b> 65+</span>';
      var why = '<p><b>' + esc(S0.name) + ' (' + esc(S0.tag) + ').</b> ' + esc(S0.what) + ' ' + esc(S0.why) + '</p>' +
        '<p><b>Reading the shape.</b> ' + esc(SH.name) + ': ' + esc(SH.look) + '. It shows ' + esc(SH.means) + '.</p>' +
        '<p><b>Rate of natural increase</b> = (CBR − CDR) ÷ 10 = (' + cbr + ' − ' + cdr + ') ÷ 10 = ' + nf(g, 1) + '% a year' + (dbl ? '. Doubling time ≈ 70 ÷ ' + nf(g, 1) + ' ≈ ' + nf(dbl) + ' years.' : '. With no natural increase there is no doubling time.') + ' Migration is not part of the RNI.</p>' +
        '<p><b>Dependency ratio</b> = (' + nf(b.young, 0) + ' + ' + nf(b.old, 0) + ') ÷ ' + nf(b.work, 0) + ' × 100 ≈ ' + nf(dep.total) + ' dependents per 100 people aged 15 to 64 (youth ' + nf(dep.youth) + ', elderly ' + nf(dep.elderly) + ').</p>' +
        '<ul class="hug-pl-needs"><li><b>Schools.</b> ' + esc(nd.schools) + '</li><li><b>Jobs.</b> ' + esc(nd.jobs) + '</li><li><b>Care.</b> ' + esc(nd.care) + '</li></ul>' +
        '<p class="bt-small"><b>Limits of the model.</b> It was built from the history of Europe, leaves migration out, and countries move through it at different speeds; stage 5 is not in every version. Say rates are “consistent with” a stage, never that a country “is in” it.</p>';
      T.explain($('.hug-pl-say'), '<b>' + esc(head) + '</b>', why);
      nums(pyr, g, dbl, dep);
      svg.setAttribute('aria-label', 'Population pyramid, ' + SH.name.toLowerCase() + ': ' + nf(b.young, 0) + '% under 15, ' + nf(b.old, 0) + '% 65 and over. Demographic transition chart: rates consistent with stage ' + stage + ', birth rate ' + cbr + ' and death rate ' + cdr + ' per 1,000.' + (sel != null ? ' Selected group ' + pyr.groups[sel] + ': ' + nf(pyr.male[sel] + pyr.female[sel], 1) + '%.' : '') + ' Up and down arrows read the age groups.');
      say(head);
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>', 'explore');
        LS.pills([{ k: 'Stage', html: String(stage), tone: 'accent' }], 'left', 'explore');
        LS.pills([{ k: 'RNI', html: nf(g, 1) + '%', tone: 'readout' }], 'right', 'explore');
      }
    }
    function nums(pyr, g, dbl, dep){
      $('.hug-pl-nums').innerHTML = '<h3 class="ls-title-l">Country P (invented)</h3><dl class="hug-pl-dl"><div><dt>Crude birth rate</dt><dd>' + cbr + ' per 1,000</dd></div><div><dt>Crude death rate</dt><dd>' + cdr + ' per 1,000</dd></div><div><dt>RNI</dt><dd>' + nf(g, 1) + '%</dd></div><div><dt>Doubling time</dt><dd>' + (dbl ? nf(dbl) + ' years' : 'none') + '</dd></div><div><dt>Fertility (TFR)</dt><dd>' + nf(tfr, 1) + '</dd></div><div><dt>Dependency ratio</dt><dd>' + nf(dep.total) + ' per 100</dd></div></dl>' +
        '<h3 class="ls-title-l">The pyramid’s bars</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Pyramid values"><table class="ls-tbl"><caption class="sr-only">Percent of the population in each age group</caption><thead><tr><th scope="col">Age</th><th scope="col">Male %</th><th scope="col">Female %</th></tr></thead><tbody>' +
        pyr.groups.map(function(gp, i){ return '<tr><th scope="row">' + gp + '</th><td class="r">' + nf(pyr.male[i], 1) + '</td><td class="r">' + nf(pyr.female[i], 1) + '</td></tr>'; }).reverse().join('') + '</tbody></table></div>';
    }
    function pickBand(i){ sel = sel === i ? null : i; act(); var p = A.pyramid(tfr, e0); render(p); words(p); }
    function onClick(e){
      var b = e.target.closest('.hug-pl-st'); if(b){ act(); setStage(+b.getAttribute('data-s')); return; }
      var v = e.target.closest('.hug-pl-vw'); if(v){ view = v.getAttribute('data-v'); (LS ? LS.root : host).querySelectorAll('.hug-pl-vw').forEach(function(x){ var on = x === v; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); render(A.pyramid(tfr, e0)); return; }
      var h = e.target.closest('.hug-pl-hit'); if(h) pickBand(+h.getAttribute('data-i'));
    }
    host.addEventListener('click', onClick);
    svg.addEventListener('keydown', function(e){
      var n = A.GROUPS.length, i = sel == null ? 0 : sel;
      if(e.key === 'ArrowUp') i = sel == null ? 0 : Math.min(n - 1, i + 1); else if(e.key === 'ArrowDown') i = sel == null ? 0 : Math.max(0, i - 1); else if(e.key === 'Escape'){ sel = null; draw(); return; } else return;
      e.preventDefault(); sel = i; act(); var p = A.pyramid(tfr, e0); render(p); words(p);
    });
    function stop(){ if(anim){ anim.stop(); anim = null; } }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.hug-pl-stage')], dock: [$('.hug-pl-ctl')], why: [$('.hug-pl-say')], details: [$('.hug-pl-nums')] });
      host.removeEventListener('click', onClick); s.root.addEventListener('click', onClick);
      draw();
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ render(A.pyramid(tfr, e0)); }, 60); }).observe($('.hug-pl-fig')); }
    }
    draw();
    return { stop: stop, studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'population-lab', noun: 'problem',
      generate: function(r, ctx, type){ return A.generate(r, ctx, type); },
      types: A.TYPES, typeLabel: 'Kind of problem',
      title: function(p){ var t = A.TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); doneLine(host, s, right, api); }
    });
  }
  /* After the last step: every answer is now in, and how many were right the
     first time (what is recorded), so a miss never reads as a wrong final answer. */
  function doneLine(host, s, right, api){
    api.firsts = (api.firsts || 0) + (right ? 1 : 0);
    var steps = api.problem.steps, n = steps.length;
    if(s !== steps[n - 1]) return;
    var r = api.firsts, st = studioOf(host);
    api.firsts = 0;
    setTimeout(function(){
      var msg = r === n ? '<b>All ' + n + ' steps right the first time.</b> The worked solution is under Why.'
        : '<b>Done: every answer is now in.</b> First tries: ' + r + ' of ' + n + ' right (the misses go to your review queue). The worked solution is under Why.';
      if(st){ st.caption(msg, 'quiz'); st.pills([{ html: r + ' of ' + n + ' first try', tone: r === n ? 'good' : 'warn' }], 'left', 'quiz'); }
    }, 0);
  }
  function figure(el, p, st){
    var g = p.figure;
    if(!g){ el.innerHTML = ''; return; }
    if(g.kind === 'pyramid'){
      el.innerHTML = '<figure class="cd-fig hug-pl-qfig"><div class="hug-plot-wrap">' + P.svg(g.spec) + '</div><figcaption class="hug-small">Invented data for practice.</figcaption></figure>';
      return;
    }
    var ph = (window.innerWidth || 1280) <= 640, W = ph ? 340 : 600, H = ph ? 300 : 320;
    var known = st.stage || p.type !== 'stage', stg = p.given.stage || A.stageOf(g.cbr, g.cdr);
    var inner = transSvg({ w: W, H: H, cbr: g.cbr, cdr: g.cdr, hide: !known, stage: known ? stg : null, pos: posOf(g.cbr, g.cdr, stg) });
    el.innerHTML = '<figure class="cd-fig hug-pl-qfig"><svg class="hug-pl-svg hug-pl-qsvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Demographic transition model with this country’s birth rate ' + g.cbr + ' and death rate ' + g.cdr + ' per 1,000' + (known ? ', consistent with stage ' + stg : '')) + '">' + inner + '</svg></figure>';
  }
})();
