/* Age structure trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T1). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.ageStructure (environmental-science/assets/tools/math/age-structure.js),
   the content environmental-science/data/tools/age-structure.json (served
   filtered as assets/tool-data/age-structure.json).

   Explore: one country you steer through the demographic transition.
     Stage chips 1 to 4 set its birth and death rates, fertility and life
     expectancy to the stage's typical values; the TFR and life expectancy
     sliders fine-tune them. The pyramid is the model's (every bar the % of the
     population in that band, men left, women right), and morphs between
     states (reduced motion: no tween). Beside it, the transition chart: crude
     birth and death rate curves through the four stages, the gap between
     them shaded as growth, and a marker at this country. A strip under the
     pyramid gives the young, working and old shares and the growth rate.
     Tap a bar (or arrow keys on the pyramid) to read that band.
   Test yourself: ApEnvTools.drill over the model's generate(): growth rate
   and doubling year, TFR from age-specific rates, reading a pyramid's shape,
   the stage from crude rates and why countries move on, and the dependency
   ratio. Figures come from the problem's own numbers and never give a key
   away before its step. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath, P = window.ApEnvPlot;
  if(!T || !M || !M.ageStructure) return;
  var A = M.ageStructure, esc = T.esc, nf = A.nf;
  var app0 = document.getElementById('app');
  if(app0 && !app0.getAttribute('data-details-title')) app0.setAttribute('data-details-title', 'Numbers & settings');
  function r1(v){ return Math.round(v * 10) / 10; }
  function tx(x, y, s, cls, anchor){ return '<text x="' + r1(x) + '" y="' + r1(y) + '"' + (cls ? ' class="' + cls + '"' : '') + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>'; }
  function reduced(){ return P && P.reduced ? P.reduced() : T.reduced(); }
  var SHAPE_NAME = { expansive: 'Expansive', stable: 'Stable', constrictive: 'Constrictive' };

  T.mount('age-structure', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'age-structure',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------ the pyramid */
  /* o: { W, H, x0, w, sel (band index), max (% at the axis end), bands (dependency tints) } */
  function pyrSvg(pyr, o){
    var n = pyr.groups.length, x0 = o.x0 || 0, W = o.w || o.W, H = o.H, ph = W < 380, lab = ph ? 38 : 50, top = o.top || 26, bot = 34;
    var cx = x0 + W / 2, half = (W - lab) / 2 - 18, bh = (H - top - bot) / n, mx = o.max || 14;
    var sx = function(v){ return half * Math.min(v, mx) / mx; };
    var out = [];
    // gridlines at 2% steps
    var stp = mx > 16 ? 5 : mx > 6 ? 2 : 1, lbl = mx > 16 ? 5 : mx > 10 ? 4 : mx > 6 ? 2 : 1;
    for(var v = stp; v <= mx + 1e-9; v += stp){
      [-1, 1].forEach(function(sg){ var xx = cx + sg * (lab / 2 + sx(v)); out.push('<line class="ap-grid" x1="' + r1(xx) + '" x2="' + r1(xx) + '" y1="' + top + '" y2="' + r1(H - bot) + '"/>'); });
      if(v % lbl === 0) [-1, 1].forEach(function(sg){ out.push(tx(cx + sg * (lab / 2 + sx(v)), H - bot + 15, v + '%', 'ap-tk', 'middle')); });
    }
    for(var i = 0; i < n; i++){
      var y = H - bot - (i + 1) * bh, m = pyr.male[i], f = pyr.female[i], band = '', on = o.sel === i ? ' is-sel' : '';
      out.push('<rect class="ap-m' + band + on + '" x="' + r1(cx - lab / 2 - sx(m)) + '" y="' + r1(y + 1) + '" width="' + r1(sx(m)) + '" height="' + r1(bh - 2) + '" rx="2"/>');
      out.push('<rect class="ap-f' + band + on + '" x="' + r1(cx + lab / 2) + '" y="' + r1(y + 1) + '" width="' + r1(sx(f)) + '" height="' + r1(bh - 2) + '" rx="2"/>');
      if(!ph || i % 2 === 0) out.push(tx(cx, y + bh / 2 + 4, pyr.groups[i], 'ap-age' + (o.sel === i ? ' is-sel' : ''), 'middle'));
      out.push('<rect class="ap-hit" data-i="' + i + '" x="' + r1(x0) + '" y="' + r1(y) + '" width="' + r1(W) + '" height="' + r1(bh) + '"/>');
    }
    out.push(tx(cx - lab / 2 - 4, top - 10, 'Male', 'ap-sex is-m', 'end'), tx(cx + lab / 2 + 4, top - 10, 'Female', 'ap-sex is-f', 'start'));
    // The dependency groups as brackets at the left edge: under 15 and 65 and over.
    if(o.bands){
      var yb = function(i){ return H - bot - i * bh; }, bx = x0 + 6;
      out.push('<path class="ap-br is-young" d="M' + (bx + 6) + ' ' + r1(yb(0) - 1) + 'H' + bx + 'V' + r1(yb(3) + 1) + 'H' + (bx + 6) + '"/>' + tx(bx + 10, (yb(0) + yb(3)) / 2 + 4, ph ? '<15' : 'under 15', 'ap-brl is-young', 'start'));
      out.push('<path class="ap-br is-old" d="M' + (bx + 6) + ' ' + r1(yb(13) - 1) + 'H' + bx + 'V' + r1(yb(17) + 1) + 'H' + (bx + 6) + '"/>' + tx(bx + 10, (yb(13) + yb(17)) / 2 + 4, '65+', 'ap-brl is-old', 'start'));
    }
    out.push(tx(cx, H - 4, '% of the population', 'ap-axl', 'middle'));
    if(o.sel != null){
      var si = o.sel, yy = H - bot - (si + 1) * bh, tot = pyr.male[si] + pyr.female[si];
      out.push('<g class="ap-tip"><rect x="' + r1(cx + lab / 2 + sx(pyr.female[si]) + 8) + '" y="' + r1(yy + bh / 2 - 12) + '" width="' + (ph ? 64 : 74) + '" height="24" rx="12"/>' + tx(cx + lab / 2 + sx(pyr.female[si]) + 8 + (ph ? 32 : 37), yy + bh / 2 + 5, nf(tot, 1) + '%', '', 'middle') + '</g>');
    }
    return out.join('');
  }

  /* ------------------------------------- the demographic transition */
  /* Crude birth and death rates through the four stages: smooth teaching
     curves through each stage's typical values (A.STAGES), the gap shaded. */
  function rateAt(s){
    // s in [0.5, 4.5]: the stage position. Curves through the stage centres.
    var pts = [[0.5, 41, 39], [1, 40, 38], [2, 38, 14], [3, 20, 8], [4, 10, 10], [4.5, 9.5, 11]];
    for(var i = 1; i < pts.length; i++) if(s <= pts[i][0]){ var a = pts[i - 1], b = pts[i], t = (s - a[0]) / (b[0] - a[0]), e = t * t * (3 - 2 * t); return { cbr: a[1] + (b[1] - a[1]) * e, cdr: a[2] + (b[2] - a[2]) * e }; }
    return { cbr: 9.5, cdr: 11 };
  }
  function transSvg(o){
    var x0 = o.x0 || 0, W = o.w, H = o.H, ph = W < 380, L = x0 + (ph ? 30 : 38), R = x0 + W - (o.enl ? 40 : 8), top = o.top || 26, B = H - 40, mx = 45;
    var x = function(s){ return L + (R - L) * (s - 0.5) / 4; }, y = function(v){ return B - (B - top) * v / mx; };
    var out = [], b = [], d = [];
    for(var k = 0; k <= 80; k++){ var s = 0.5 + 4 * k / 80, rr = rateAt(s); b.push([x(s), y(rr.cbr)]); d.push([x(s), y(rr.cdr)]); }
    [1, 2, 3, 4].forEach(function(st){ var xa = x(st - 0.5), xb = x(st + 0.5); out.push('<rect class="ap-band' + (st % 2 ? '' : ' is-alt') + (o.stage === st ? ' is-on' : '') + '" x="' + r1(xa) + '" y="' + top + '" width="' + r1(xb - xa) + '" height="' + r1(B - top) + '"/>' + tx((xa + xb) / 2, B + 16, String(st), 'ap-stn' + (o.stage === st ? ' is-on' : ''), 'middle')); });
    out.push(tx((L + R) / 2, B + 34, 'stage', 'ap-axl', 'middle'));
    [0, 10, 20, 30, 40].forEach(function(v){ out.push('<line class="ap-grid" x1="' + L + '" x2="' + R + '" y1="' + r1(y(v)) + '" y2="' + r1(y(v)) + '"/>' + tx(L - 5, y(v) + 4, String(v), 'ap-tk', 'end')); });
    // growth gap: births above deaths (green), deaths above births (rose)
    var gap = b.map(function(p){ return r1(p[0]) + ',' + r1(p[1]); }).concat(d.slice().reverse().map(function(p){ return r1(p[0]) + ',' + r1(p[1]); }));
    out.push('<polygon class="ap-gap" points="' + gap.join(' ') + '"/>');
    out.push('<polyline class="ap-cbr" points="' + b.map(function(p){ return r1(p[0]) + ',' + r1(p[1]); }).join(' ') + '"/><polyline class="ap-cdr" points="' + d.map(function(p){ return r1(p[0]) + ',' + r1(p[1]); }).join(' ') + '"/>');
    out.push(tx(x(2.05), y(rateAt(2.05).cbr) - 8, 'birth rate', 'ap-cbrl', 'start'), tx(x(3), y(rateAt(3).cdr) + 18, 'death rate', 'ap-cdrl', 'middle'));
    out.push(tx(L, top - 10, 'per 1,000 per year', 'ap-axl', 'start'));
    if(o.cbr != null && !o.hide){
      var pos = o.pos, xm = x(pos);
      out.push('<line class="ap-now" x1="' + r1(xm) + '" x2="' + r1(xm) + '" y1="' + top + '" y2="' + B + '"/>');
      out.push('<circle class="ap-dot is-b" cx="' + r1(xm) + '" cy="' + r1(y(o.cbr)) + '" r="6"/><circle class="ap-dot is-d" cx="' + r1(xm) + '" cy="' + r1(y(o.cdr)) + '" r="6"/>');
    }
    if(o.hide && o.cbr != null){
      // a drill: only this country's two rates as dots, no stage marked
      out.push('<g class="ap-q">' + tx(R - 6, top + 14, 'This country', 'ap-axl', 'end') + '<circle class="ap-dot is-b" cx="' + r1(R - 24) + '" cy="' + r1(y(o.cbr)) + '" r="6"/><circle class="ap-dot is-d" cx="' + r1(R - 24) + '" cy="' + r1(y(o.cdr)) + '" r="6"/></g>');
    }
    return out.join('');
  }
  /* Where on the stage axis a country sits, from its rates (for the marker). */
  function posOf(cbr, cdr, stage){
    var best = stage, bd = Infinity;
    for(var s = Math.max(0.6, stage - 0.49); s <= Math.min(4.4, stage + 0.49); s += 0.02){ var r = rateAt(s), dd = Math.pow(r.cbr - cbr, 2) + Math.pow(r.cdr - cdr, 2); if(dd < bd){ bd = dd; best = s; } }
    return best;
  }

  /* --------------------------------------------------------- explore */
  function explore(host, data){
    var stage = 2, tfr = A.STAGES[2].tfr, e0 = A.STAGES[2].e0, cbr = A.STAGES[2].cbr, cdr = A.STAGES[2].cdr, sel = null, LS = null, touched = false, anim = null, shown = null, nid = T.nid('ap');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem ap-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Age structure</h2>' +
      '<div class="ap-stage"><div class="ap-strip" aria-hidden="true"></div><div class="ap-fig"><svg class="ap-svg" role="img" tabindex="0" xmlns="http://www.w3.org/2000/svg"></svg></div></div>' +
      '<div class="ap-ctl">' +
        '<div class="ap-stages tseg" role="group" aria-label="Stage of the demographic transition">' + [1, 2, 3, 4].map(function(s){ return '<button type="button" class="ap-st" data-s="' + s + '" aria-pressed="' + (s === stage) + '">Stage ' + s + '</button>'; }).join('') + '</div>' +
        '<div class="ap-sl-t"></div>' +
      '</div>' +
      '<div class="ap-say"></div>' +
      T.moreHtml('<div class="ap-sl-e"></div><p class="bt-small">Life expectancy at birth. Low values mostly mean many children die young.</p>', 'life expectancy') +
      '<div class="ap-nums"></div><p class="sr-only ap-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.ap-live'));
    var cue = T.cue('Step through stages 1 to 4 and watch the pyramid change shape.');
    $('.ap-ctl').insertBefore(cue.el, $('.ap-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var slT = T.slider({ label: 'Total fertility rate (children per woman)', min: 1.0, max: 7.0, step: 0.1, value: tfr, decimals: 1, onInput: function(v){ tfr = v; act(); custom(); } });
    var slE = T.slider({ label: 'Life expectancy (years)', min: 30, max: 85, step: 1, value: e0, decimals: 0, onInput: function(v){ e0 = v; act(); custom(); } });
    $('.ap-sl-t').appendChild(slT.el); $('.ap-sl-e').appendChild(slE.el);
    var svg = $('.ap-svg');
    /* Moving a slider: the crude rates follow from the model population (births
       and deaths per 1,000 people it implies), so the dot on the transition chart moves too. */
    function custom(){
      var pyr = A.pyramid(tfr, e0), b = A.broad(pyr), women = 0;
      for(var i = 3; i <= 9; i++) women += pyr.female[i];
      cbr = Math.round(tfr / 35 * women * 10);
      var surv = A.survival(e0); cdr = Math.round(Math.max(4, Math.min(45, 1000 / e0 * (0.55 + b.old / 40) * (e0 > 70 ? 0.85 : 1))));
      stage = A.stageOf(cbr, cdr);
      draw(true);
    }
    function setStage(s){ stage = s; var S0 = A.STAGES[s]; tfr = S0.tfr; e0 = S0.e0; cbr = S0.cbr; cdr = S0.cdr; slT.set(tfr); slE.set(e0); draw(true); }
    function size(){ var b = svg.getBoundingClientRect(); return [Math.max(300, Math.round(b.width || 640)), Math.max(300, Math.round(b.height || 420))]; }
    function draw(tween){
      var target = A.pyramid(tfr, e0);
      if(tween && shown && !reduced() && P){
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
      var wh = size(), W = wh[0], H = wh[1], side = W >= 700, pw = side ? Math.round(W * 0.56) : W, tw = side ? W - pw - 24 : W;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var pyrH = side ? H : Math.round(H * 0.64);
      var big = Math.max.apply(null, pyr.male.concat(pyr.female)) * 1.12, mx = [5, 8, 12, 16, 20].filter(function(v){ return v >= big; })[0] || 26;
      var out = pyrSvg(pyr, { W: W, w: pw, H: pyrH, sel: sel, max: mx, bands: true });
      out += '<g transform="translate(' + (side ? pw + 24 : 0) + ' ' + (side ? 0 : pyrH + 6) + ')">' + transSvg({ w: tw, enl: !side, H: side ? H : H - pyrH - 6, stage: stage, cbr: cbr, cdr: cdr, pos: posOf(cbr, cdr, stage), top: side ? 26 : 22 }) + '</g>';
      svg.innerHTML = out;
    }
    function words(pyr){
      var sh = A.shape(pyr), b = A.broad(pyr), g = A.growth(cbr, cdr), S0 = A.STAGES[stage];
      var head = !touched ? 'A stage 2 country: deaths have fallen but births are still high, so the base is wide. Try stage 3 and 4.' :
        SHAPE_NAME[sh] + ' pyramid, ' + S0.name.toLowerCase().replace(/^stage (\d)/, 'stage $1') + '. Growth ' + nf(g, 1) + '% a year' + (g > 0.05 ? ' (doubling in about ' + nf(70 / g, 0) + ' years).' : g < -0.05 ? ' (shrinking).' : ' (about zero).');
      $('.ap-strip').innerHTML = '<span class="ap-chip is-young"><b>' + nf(b.young, 0) + '%</b> under 15</span><span class="ap-chip is-work"><b>' + nf(b.work, 0) + '%</b> 15 to 64</span><span class="ap-chip is-old"><b>' + nf(b.old, 0) + '%</b> 65 and over</span>';
      var why = '<p><b>' + esc(S0.name) + '.</b> ' + esc(S0.what) + ' ' + esc(S0.why) + '</p>' +
        '<p><b>Reading the shape.</b> Expansive (a triangle): many children, high births, fast growth ahead. Stable (a column): births near replacement. Constrictive (a vase): fewer children than young adults, so the population ages and will shrink without immigration.</p>' +
        '<p><b>Total fertility rate</b> ' + nf(tfr, 1) + ' against replacement level, about 2.1 children per woman (2 to replace the parents, a little more because some children die young). Above 2.1 the base widens; below, it narrows.</p>' +
        '<p><b>Growth rate</b> = (CBR − CDR) / 10 = (' + cbr + ' − ' + cdr + ') / 10 = ' + nf(g, 1) + '% a year. The shaded gap between the two curves is that growth: widest in stage 2.</p>' +
        '<p class="bt-small">Some books add a stage 5: births fall below deaths and the population declines. Stage 4 here includes that edge.</p>';
      T.explain($('.ap-say'), '<b>' + esc(head) + '</b>', why);
      nums(pyr, g);
      svg.setAttribute('aria-label', 'Population pyramid, ' + SHAPE_NAME[sh].toLowerCase() + ': ' + nf(b.young, 0) + '% under 15, ' + nf(b.old, 0) + '% 65 and over. Demographic transition chart: stage ' + stage + ', birth rate ' + cbr + ' and death rate ' + cdr + ' per 1,000.' + (sel != null ? ' Selected band ' + pyr.groups[sel] + ': ' + nf(pyr.male[sel] + pyr.female[sel], 1) + '%.' : '') + ' Up and down arrows read the age bands.');
      say(head);
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>', 'explore');
        LS.pills([{ k: 'TFR', html: nf(tfr, 1), tone: tfr > 2.25 ? 'warn' : tfr < 1.95 ? 'accent' : 'good' }], 'left', 'explore');
        LS.pills([{ k: 'Growth', html: nf(g, 1) + '%', tone: 'readout' }], 'right', 'explore');
      }
    }
    function nums(pyr, g){
      $('.ap-nums').innerHTML = '<h3 class="ls-title-l">This country</h3><dl class="ap-dl"><div><dt>Crude birth rate</dt><dd>' + cbr + ' per 1,000</dd></div><div><dt>Crude death rate</dt><dd>' + cdr + ' per 1,000</dd></div><div><dt>Growth rate</dt><dd>' + nf(g, 1) + '%</dd></div><div><dt>Doubling time</dt><dd>' + (g > 0.05 ? nf(70 / g, 0) + ' yr' : '·') + '</dd></div></dl>' +
        '<h3 class="ls-title-l">The pyramid’s bars</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Pyramid values"><table class="ls-tbl"><caption class="sr-only">Percent of the population in each age band</caption><thead><tr><th scope="col">Age</th><th scope="col">Male %</th><th scope="col">Female %</th></tr></thead><tbody>' +
        pyr.groups.map(function(gp, i){ return '<tr><th scope="row">' + gp + '</th><td class="r">' + nf(pyr.male[i], 1) + '</td><td class="r">' + nf(pyr.female[i], 1) + '</td></tr>'; }).reverse().join('') + '</tbody></table></div>';
    }
    function pickBand(i){ sel = sel === i ? null : i; act(); render(shown || A.pyramid(tfr, e0)); words(A.pyramid(tfr, e0)); }
    function onClick(e){
      var b = e.target.closest('.ap-st'); if(b){ act(); setStage(+b.getAttribute('data-s')); (LS ? LS.root : host).querySelectorAll('.ap-st').forEach(function(x){ x.setAttribute('aria-pressed', String(+x.getAttribute('data-s') === stage)); }); return; }
      var h = e.target.closest('.ap-hit'); if(h) pickBand(+h.getAttribute('data-i'));
    }
    host.addEventListener('click', onClick);
    svg.addEventListener('keydown', function(e){
      var n = A.GROUPS.length, i = sel == null ? 0 : sel;
      if(e.key === 'ArrowUp') i = sel == null ? 0 : Math.min(n - 1, i + 1); else if(e.key === 'ArrowDown') i = sel == null ? 0 : Math.max(0, i - 1); else if(e.key === 'Escape') { sel = null; draw(); return; } else return;
      e.preventDefault(); sel = i; act(); render(A.pyramid(tfr, e0)); words(A.pyramid(tfr, e0));
    });
    var oldSet = setStage;
    setStage = function(s){ oldSet(s); (LS ? LS.root : host).querySelectorAll('.ap-st').forEach(function(x){ x.setAttribute('aria-pressed', String(+x.getAttribute('data-s') === stage)); }); };
    var oldCustom = custom;
    custom = function(){ oldCustom(); (LS ? LS.root : host).querySelectorAll('.ap-st').forEach(function(x){ x.setAttribute('aria-pressed', String(+x.getAttribute('data-s') === stage)); }); };
    function stop(){ if(anim){ anim.stop(); anim = null; } }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.ap-stage')], dock: [$('.ap-ctl')], why: [$('.ap-say')], details: [$('.ap-nums')] });
      host.removeEventListener('click', onClick); s.root.addEventListener('click', onClick);
      draw();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.ap-st[data-s="3"]'), text: 'Start here: try stage 3' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ render(A.pyramid(tfr, e0)); }, 60); }).observe($('.ap-fig')); }
    }
    draw();
    return { stop: stop, studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'age-structure', noun: 'problem',
      generate: function(r, ctx, type){ return A.generate(r, ctx, type); },
      types: A.TYPES, typeLabel: 'Kind of problem',
      title: function(p){ var t = A.TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); doneLine(host, s, right, api); }
    });
  }
  /* After the last step: say plainly that every answer is now right, and how
     many were right the first time (what is recorded), so a miss on a first
     try never reads as a wrong final answer. Runs after the shared drill's own
     summary (env-tools.js studioDrill done), which it replaces. */
  function doneLine(host, s, right, api){
    api.firsts = (api.firsts || 0) + (right ? 1 : 0);
    var steps = api.problem.steps, n = steps.length;
    if(s !== steps[n - 1]) return;
    var r = api.firsts, st = T.studioOf(host);
    api.firsts = 0;
    setTimeout(function(){
      var msg = r === n ? '<b>All ' + n + ' steps right the first time.</b> The worked solution is under Why.'
        : '<b>Done: every answer is now in.</b> First tries: ' + r + ' of ' + n + ' right (the misses go to your review queue). The worked solution is under Why.';
      if(st){ st.caption(msg, 'quiz'); st.pills([{ html: r + ' of ' + n + ' first try', tone: r === n ? 'good' : 'warn' }], 'left', 'quiz'); }
    }, 0);
  }

  function figure(el, p, st){
    var g = p.figure, ph = (window.innerWidth || 1280) <= 640, W = ph ? 360 : 640, H = ph ? 340 : 360, inner = '', aria = '';
    if(!g){ el.innerHTML = ''; return; }
    if(g.kind === 'pyr'){
      var pyr = A.pyramid(g.tfr, g.e0), b = A.broad(pyr), big = Math.max.apply(null, pyr.male.concat(pyr.female)) * 1.12, max = [5, 8, 12, 16, 20].filter(function(v){ return v >= big; })[0] || 26;
      var showShape = g.hide !== 'shape' || st.predict;
      inner = pyrSvg(pyr, { W: W, w: W, H: H, max: max, bands: !!g.bands, top: 26 });
      if(g.bands) inner += '<g class="ap-legend">' + tx(8, 16, 'under 15: ' + nf(b.young, 1) + '%', 'ap-lg is-young', 'start') + tx(W - 8, 16, '65 and over: ' + nf(b.old, 1) + '%', 'ap-lg is-old', 'end') + '</g>';
      if(g.hide === 'shape' && !st.predict){
        // Before the prediction: the birth rates by age as bars (the table, drawn), not the pyramid that answers it.
        var asfr = p.given.asfr, bands = ['15–19', '20–24', '25–29', '30–34', '35–39', '40–44', '45–49'], L = 46, R = W - 14, B = H - 44, T0 = 34, mxr = Math.max.apply(null, asfr) * 1.15, bw = (R - L) / 7 * 0.66;
        inner = tx(L - 10, 20, 'births per 1,000 women', 'ap-axl', 'start') + '<line class="ap-grid" x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '"/>';
        asfr.forEach(function(v, i){ var x = L + (R - L) * (i + 0.5) / 7, y = B - (B - T0) * v / mxr; inner += '<rect class="ap-f" x="' + r1(x - bw / 2) + '" y="' + r1(y) + '" width="' + r1(bw) + '" height="' + r1(B - y) + '" rx="3"/>' + tx(x, y - 6, String(v), 'ap-age is-sel', 'middle') + tx(x, B + 16, ph ? bands[i].split('–')[0] : bands[i], 'ap-tk', 'middle'); });
        inner += tx((L + R) / 2, H - 6, 'age of mother (the pyramid appears once you predict it)', 'ap-axl', 'middle');
      }
      aria = showShape ? 'Population pyramid: ' + nf(b.young, 1) + '% under 15 and ' + nf(b.old, 1) + '% 65 and over.' : 'An empty pyramid frame.';
    } else if(g.kind === 'rates'){
      inner = transSvg({ w: W, H: H, cbr: g.cbr, cdr: g.cdr, hide: true, stage: null });
      aria = 'Demographic transition chart with this country’s birth rate ' + g.cbr + ' and death rate ' + g.cdr + ' per 1,000 marked.';
    } else if(g.kind === 'transition'){
      inner = transSvg({ w: W, H: H, cbr: g.cbr, cdr: g.cdr, hide: !st.stage, stage: st.stage ? g.stage : null, pos: posOf(g.cbr, g.cdr, g.stage) });
      aria = 'Demographic transition chart' + (st.stage ? ', stage ' + g.stage + ' marked' : '') + '; this country: birth rate ' + g.cbr + ', death rate ' + g.cdr + '.';
    }
    el.innerHTML = '<figure class="cd-fig ap-qfig"><svg class="ap-svg ap-qsvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(aria) + '">' + inner + '</svg></figure>';
  }
})();
