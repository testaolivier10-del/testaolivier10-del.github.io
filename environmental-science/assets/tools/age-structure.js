/* Age structure trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T1). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.ageStructure (environmental-science/assets/tools/math/age-structure.js),
   the content environmental-science/data/tools/age-structure.json (served
   filtered as assets/tool-data/age-structure.json).

   Explore (tools v2, docs/tools-v2-apenv-age-structure-brief.md; kit assets/course/tool-kit2.js): one screen, no
     tabs. A population pyramid built of rows of people over a town square; drag the mother along the children per
     woman track (her children stand beside her) and the base widens or narrows, the rows above following; a quiet
     life expectancy knob fills out or thins the top. One number on the picture (grows or shrinks, % a year), the
     replacement mark on the track, and the cause line. The stage table, the dependency ratio and the row values
     are in "?"; the stage drills in Test yourself.
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
  function r1(v){ return Math.round(v * 10) / 10; }
  function tx(x, y, s, cls, anchor){ return '<text x="' + r1(x) + '" y="' + r1(y) + '"' + (cls ? ' class="' + cls + '"' : '') + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>'; }
  function reduced(){ return P && P.reduced ? P.reduced() : T.reduced(); }
  var SHAPE_NAME = { expansive: 'Expansive', stable: 'Stable', constrictive: 'Constrictive' };

  T.mount('age-structure', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'age-structure',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(ex) ex.shown(m); },
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
      // Pass 3: each bracket carries its own share (the two chips above the
      // picture are gone), so the number sits on the group it counts.
      var sh1 = o.shares ? [o.shares.young, o.shares.old] : null;
      out.push('<path class="ap-br is-young" d="M' + (bx + 6) + ' ' + r1(yb(0) - 1) + 'H' + bx + 'V' + r1(yb(3) + 1) + 'H' + (bx + 6) + '"/>' + tx(bx + 10, (yb(0) + yb(3)) / 2 + (sh1 ? -3 : 4), ph ? '<15' : 'under 15', 'ap-brl is-young', 'start') + (sh1 ? tx(bx + 10, (yb(0) + yb(3)) / 2 + 13, Math.round(sh1[0]) + '%', 'ap-brl ap-brn is-young', 'start') : ''));
      out.push('<path class="ap-br is-old" d="M' + (bx + 6) + ' ' + r1(yb(13) - 1) + 'H' + bx + 'V' + r1(yb(17) + 1) + 'H' + (bx + 6) + '"/>' + tx(bx + 10, (yb(13) + yb(17)) / 2 + (sh1 ? -3 : 4), '65+', 'ap-brl is-old', 'start') + (sh1 ? tx(bx + 10, (yb(13) + yb(17)) / 2 + 13, Math.round(sh1[1]) + '%', 'ap-brl ap-brn is-old', 'start') : ''));
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

  /* ====================================================================== Explore v2
     (docs/tools-v2-apenv-age-structure-brief.md; kit assets/course/tool-kit2.js). One idea, one screen: fertility sets
     the base of the pyramid, and the base becomes the future population.
       The picture: a town square at the foot of a population pyramid built of rows of small people (men left, women
       right, 5 year bands, every width the model's share at one fixed scale). On the square a mother stands on the
       children per woman track with her children beside her (as many as the rate; a part of a child for a fraction):
       she is the main control (drag her, or her knob; keys). Quiet: the life expectancy knob in the top corner.
       The model: A.stable(tfr, e0), the population that rate and life expectancy settle into (no migration), so the
       growth, the shape word and the replacement mark come from one honest life table (replacement rises when many
       children die). A change eases in from the base up: each row follows its own copy of the rate a little later
       than the row below (the new children first, the older rows as they would over decades), and every row is
       drawn at the model's value for the rate it holds at that frame. The number on the picture, the shape word and
       the cause line read the rows as drawn. Reduced motion: the new pyramid at once with a short cross fade. */
  var K = window.LevlKit2;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var PURPOSE = 'How fertility today shapes a population’s future';
  var SCALE = 15;   // % of all people at the end of each half: the widest band anywhere in the ranges is 14.7%
  var TMIN = 1, TMAX = 7, EMIN = 30, EMAX = 85;
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function n1(v){ return (Math.round(v * 10) / 10).toFixed(1); }
  var MC = null;
  function tw(t, fs, wt){
    if(!MC){ try{ MC = document.createElement('canvas').getContext('2d'); }catch(e){ MC = null; } }
    if(!MC) return String(t).length * fs * 0.56;
    MC.font = (wt || 800) + ' ' + fs + 'px Nunito, system-ui, sans-serif';
    return MC.measureText(String(t)).width;
  }
  /* growth words from a rate r (a fraction per year): the number on the picture and the cause line */
  function growthWords(r){
    var p = r * 100, a = Math.abs(p);
    if(a < 0.05) return { dir: 0, pill: 'About steady', part: 'about steady', two: '' };
    var pc = (Math.round(a * 10) / 10).toFixed(1), yrs = Math.round(70 / (Math.round(a * 10) / 10));
    return p > 0 ? { dir: 1, pill: 'Grows ' + pc + '% a year', part: 'grows ' + pc + '% a year', two: 'doubles in ' + yrs + ' years' }
      : { dir: -1, pill: 'Shrinks ' + pc + '% a year', part: 'shrinks ' + pc + '% a year', two: 'halves in ' + yrs + ' years' };
  }
  var TAKE = 'Above replacement the population grows; below it, it shrinks.';
  var SHAPE_WORD = { expansive: 'expansive', stable: 'stable', constrictive: 'constrictive' };

  /* a person in a box w × h (feet at the bottom middle): head, body, two legs */
  function personPath(x, y, w, h){
    var hr = Math.min(w * 0.24, h * 0.13), cx = x + w / 2, hy = y + hr + h * 0.04, bt = hy + hr + h * 0.04, bw = w * 0.36, bb = y + h * 0.66, lw = w * 0.13;
    return 'M' + n1(cx + hr) + ' ' + n1(hy) + 'a' + n1(hr) + ' ' + n1(hr) + ' 0 1 1 ' + n1(-2 * hr) + ' 0a' + n1(hr) + ' ' + n1(hr) + ' 0 1 1 ' + n1(2 * hr) + ' 0Z' +
      'M' + n1(cx - bw) + ' ' + n1(bb) + 'L' + n1(cx - bw * 0.82) + ' ' + n1(bt + 2) + 'Q' + n1(cx - bw * 0.8) + ' ' + n1(bt) + ' ' + n1(cx - bw * 0.5) + ' ' + n1(bt) + 'H' + n1(cx + bw * 0.5) + 'Q' + n1(cx + bw * 0.8) + ' ' + n1(bt) + ' ' + n1(cx + bw * 0.82) + ' ' + n1(bt + 2) + 'L' + n1(cx + bw) + ' ' + n1(bb) + 'Z' +
      'M' + n1(cx - bw * 0.62) + ' ' + n1(bb - 1) + 'h' + n1(lw * 2) + 'V' + n1(y + h) + 'h' + n1(-lw * 2) + 'Z' +
      'M' + n1(cx + bw * 0.62 - lw * 2) + ' ' + n1(bb - 1) + 'h' + n1(lw * 2) + 'V' + n1(y + h) + 'h' + n1(-lw * 2) + 'Z';
  }
  /* the mother and a child on the square: drawn figures with a face, hair and clothes (box w × h, feet at y + h) */
  function figure2(x, y, w, h, o){
    var s = h / 100, cx = x + w / 2;
    var g = '<g transform="translate(' + n1(cx - 50 * s) + ' ' + n1(y) + ') scale(' + s.toFixed(4) + ')">';
    if(o.kind === 'mom'){
      g += '<path d="M40 64 L36 98 H45 L48 68Z M60 64 L64 98 H55 L52 68Z" fill="#3B3F4A"/>' +
        '<path d="M30 70 C30 44 38 34 50 34 C62 34 70 44 70 70 L74 74 H26Z" class="agv-dress"/>' +
        '<path d="M32 48 C24 56 22 64 26 70" stroke="' + o.skin + '" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M68 48 C76 56 78 64 74 70" stroke="' + o.skin + '" stroke-width="7" stroke-linecap="round" fill="none"/>' +
        '<path d="M35 21 C35 5 65 5 65 21 L67 44 C63 46 60 44 59 40 L59 24 H41 L41 40 C40 44 37 46 33 44Z" fill="#3A2A20"/>' +
        '<circle cx="50" cy="22" r="13" fill="' + o.skin + '"/><path d="M37 19 C40 9 60 8 63 19 C56 14 44 14 37 19Z" fill="#3A2A20"/>' +
        '<circle cx="45.5" cy="23" r="1.6" fill="#1b1b1b"/><circle cx="54.5" cy="23" r="1.6" fill="#1b1b1b"/><path d="M46 28 Q50 31 54 28" stroke="#7a3b2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    } else {
      g += '<rect x="38" y="66" width="10" height="32" rx="5" fill="#3B3F4A"/><rect x="52" y="66" width="10" height="32" rx="5" fill="#33363F"/>' +
        '<path d="M28 76 C28 46 37 38 50 38 C63 38 72 46 72 76Z" class="' + o.cls + '"/>' +
        '<circle cx="50" cy="24" r="15" fill="' + o.skin + '"/><path d="M35 22 C37 8 63 7 65 21 C58 15 43 15 35 22Z" fill="' + o.hair + '"/>' +
        '<circle cx="45" cy="25" r="1.8" fill="#1b1b1b"/><circle cx="55" cy="25" r="1.8" fill="#1b1b1b"/>';
    }
    return g + '</g>';
  }
  var SKIN = ['#E8B994', '#C68B62', '#8D5B3E', '#F0C8A8', '#B67A50', '#DDA57E', '#7A4A30'];
  var HAIR = ['#3A2A20', '#1F1A17', '#6B4423', '#2B211B', '#8A5A2B', '#3A2A20', '#151210'];

  function explore(host, data){
    var S = { t: 5, e: 60, T: [], E: 60, mode: 'explore', side: 0, take: false };
    for(var i0 = 0; i0 < 17; i0++) S.T.push(S.t);
    var LS = null, nid = T.nid('agv'), G = null, raf = 0, lastT = 0, tour = null;
    var stage = document.createElement('div'); stage.className = 'agv';
    var head = K.head({ purpose: PURPOSE, how: { label: 'Show me how', onClick: function(){ startTour(true); } } });
    stage.appendChild(head.el);
    var sceneBox = document.createElement('div'); sceneBox.className = 'agv-scene'; sceneBox.id = nid + '-sc';
    sceneBox.innerHTML = '<svg class="agv-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><defs></defs><g class="agv-static"></g><g class="agv-rows"></g><g class="agv-dyn"></g></svg><div class="agv-fade" aria-hidden="true"></div>';
    stage.appendChild(sceneBox);
    var svg = sceneBox.querySelector('svg'), defs = svg.querySelector('defs'), gStatic = svg.querySelector('.agv-static'), gRows = svg.querySelector('.agv-rows'), gDyn = svg.querySelector('.agv-dyn'), fade = sceneBox.querySelector('.agv-fade');
    var layer = K.layer(sceneBox);
    var lines = document.createElement('div'); lines.className = 'agv-lines';
    var cause = K.cause({ label: 'Why' });
    lines.appendChild(cause.el); stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    host.appendChild(stage);
    var ref = document.createElement('div'); ref.className = 'agv-ref';

    /* ---- the model at a rate and a life expectancy (memo: a drag revisits the same tenths) */
    var memo = {}, memoN = 0;
    function model(t, e){
      var k = t.toFixed(3) + '/' + e.toFixed(1);
      if(memo[k]) return memo[k];
      if(++memoN > 3000){ memo = {}; memoN = 0; }
      return (memo[k] = A.stable(t, e));
    }
    /* what is drawn this frame: each row at the model's value for its own rate; the growth and the rates from the base row's */
    function drawn(){
      var male = [], female = [];
      for(var i = 0; i < 17; i++){ var m = model(S.T[i], S.E); male.push(m.male[i]); female.push(m.female[i]); }
      var b = model(S.T[0], S.E);
      return { groups: A.GROUPS, male: male, female: female, t: S.T[0], e: S.E, r: b.r, cbr: b.cbr, cdr: b.cdr, repl: b.repl };
    }

    /* ---- controls on the picture */
    var cT = K.handle(layer, { key: 'apenv-age-tfr', label: 'Children per woman (total fertility rate)', value: S.t, min: TMIN, max: TMAX, step: 0.1, chip: false,
      at: function(v){ return G ? [G.x(v), G.yT] : [0, 0]; },
      pick: function(x){ return G ? Math.round(clamp(G.v(x), TMIN, TMAX) * 10) / 10 : null; },
      dir: function(){ return 0; },
      valuetext: function(v){ return n1(v) + ' children per woman'; },
      tag: function(v){ return n1(v); },
      tagSide: function(v){ if(!G) return 'right'; var w = tw(n1(v), 13, 900) + 18; return G.x(v) + 26 + w <= G.W - 6 ? 'right' : 'left'; },
      onStart: function(v){ S.side = Math.sign(v - model(S.t, S.e).repl); },
      onInput: function(v){ used(); S.t = v; kick(); tourDid('tfr'); },
      onEnd: function(v){ var sd = Math.sign(v - model(S.t, S.e).repl); if(S.side && sd && sd !== S.side){ S.take = true; if(!moving() && shown) words(shown); } } });
    var cE = K.handle(layer, { label: 'Life expectancy at birth, in years', value: S.e, min: EMIN, max: EMAX, step: 1, quiet: true,
      at: function(v){ return G ? [G.ex(v), G.eY] : [0, 0]; },
      pick: function(x){ return G ? Math.round(clamp(G.ev(x), EMIN, EMAX)) : null; },
      valuetext: function(v){ return v + ' years'; },
      onInput: function(v){ used(); S.e = v; kick(); tourDid('life'); } });
    var cue = K.cue(layer, { key: 'apenv-age-tfr', text: 'Drag the mother', side: 'left', at: function(){ return G ? [G.x(S.t) - 4, G.yT] : [0, 0]; } });
    function used(){ if(cue.active()) cue.hide(true); }
    sceneBox.addEventListener('pointerdown', function(e){
      used();
      if(!G || S.mode !== 'explore') return;
      var r = svg.getBoundingClientRect(), k = r.width / G.W, x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k;
      // the mother, her children and the track: drag the rate from there; the life track: drag the life expectancy
      if(e.target.closest('.tk2-knob, .tk2-cue')) return;
      if(y >= G.yG - G.momH - 4 && y <= G.yN + 6 && x >= G.x(0) - 20 && x <= G.x(TMAX) + G.momH * 0.5) cT.grab(e);
      else if(Math.abs(y - G.eY) <= 16 && x >= G.ex(EMIN) - 12 && x <= G.ex(EMAX) + 12) cE.grab(e);
    });

    /* ---- geometry, from the width and the height there is (the mother, the pyramid and the cause line in view) */
    function availH(phone){
      var sc = sceneBox.getBoundingClientRect(), lh = phone ? 96 : 60;
      if(phone) return clamp(window.innerHeight - lh - 24, 440, 620);
      return clamp(window.innerHeight - (sc.top + window.scrollY) - lh - 36, 430, 860);
    }
    function geo(W){
      var g = { W: W, phone: W <= 640 }, H = availH(g.phone), ph = g.phone;
      g.H = H;
      g.f = { age: ph ? 11.5 : 12.5, sex: ph ? 13 : 14, tick: 11.5, pill: ph ? 14 : 16, life: ph ? 12.5 : 13.5, num: ph ? 12.5 : 13.5, cap: ph ? 12 : 13 };
      g.headH = ph ? 76 : 72;
      g.momH = ph ? 46 : Math.round(clamp(H * 0.105, 50, 64)); g.kidH = Math.round(g.momH * 0.62);
      var cp = ph || H < 600, capGap = cp ? 22 : 25, numGap = ph ? 32 : 38, plazaTop0 = H - (g.momH + 6 + 20 + numGap + capGap + 8);
      g.yG = plazaTop0 + g.momH + 6; g.yT = g.yG + 20; g.yN = g.yT + numGap; g.yC = g.yN + capGap;
      g.plazaTop = g.yG - g.momH - 10;
      g.axisH = 18;
      g.rowTop = g.headH; g.rowBot = g.plazaTop - g.axisH;
      g.pitch = (g.rowBot - g.rowTop) / 17;
      g.spine = Math.ceil(Math.max(tw('75–79', g.f.age, 800), tw('80+', g.f.age, 800))) + 14;
      g.cx = W / 2;
      g.hw = Math.min(W / 2 - g.spine / 2 - (ph ? 20 : 30), (g.rowBot - g.rowTop) * 1.9);
      g.sx = function(v){ return g.hw * v / SCALE; };
      // the children per woman track: one slot per child, centred under the pyramid
      // (on a phone the track sits a little left of centre, so the mother at 7 keeps a margin at the right edge)
      var u = clamp((W - (ph ? 28 + g.momH * 0.3 : 80)) / 7.6, 38, 74);
      g.u = u; g.x0 = W / 2 - 3.5 * u - (ph ? g.momH * 0.2 : 0);
      g.x = function(v){ return g.x0 + v * u; };
      g.v = function(x){ return (x - g.x0) / u; };
      // the life expectancy track, top right
      var tl = ph ? 120 : 170;
      g.eX1 = W - (ph ? 22 : 30); g.eX0 = g.eX1 - tl; g.eY = ph ? 44 : 44; g.eLY = ph ? 18 : 18;
      g.ex = function(v){ return g.eX0 + (v - EMIN) / (EMAX - EMIN) * (g.eX1 - g.eX0); };
      g.ev = function(x){ return EMIN + (x - g.eX0) / (g.eX1 - g.eX0) * (EMAX - EMIN); };
      g.sexY = g.headH - 8;
      // the mother stands just right of her rate, so the children (cut at the rate) are never behind her
      g.momX = function(v){ return g.x(v) + g.momH * 0.22; };
      return g;
    }

    /* ---- the still scene: sky, the square, the grid, the age spine, the tracks */
    function drawStatic(){
      var g = G, W = g.W, H = g.H, o = [];
      defs.innerHTML = '<linearGradient id="' + nid + '-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="agv-sky0"/><stop offset="1" class="agv-sky1"/></linearGradient>' +
        '<linearGradient id="' + nid + '-pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="agv-pl0"/><stop offset="1" class="agv-pl1"/></linearGradient>' +
        patternDef('m', 'agv-pm') + patternDef('f', 'agv-pf');
      o.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#' + nid + '-sky)"/>');
      // the square: paving, a curb at its back edge; on wide screens a lamp and a planter at each end, clear of the
      // track (decoration kept quiet, nothing that could read as data); two pale clouds in the sky
      var hz = g.plazaTop;
      [[0.16, 0.3], [0.8, 0.22]].forEach(function(c, k){ var cx0 = W * c[0], cy0 = g.headH + (g.rowBot - g.headH) * c[1], sc = g.phone ? 0.6 : 1; o.push('<path class="agv-cloud" transform="translate(' + n1(cx0) + ' ' + n1(cy0) + ') scale(' + sc + ')" d="M-46 10 C-50 -4 -32 -10 -24 -4 C-20 -20 6 -22 12 -8 C22 -16 40 -10 38 4 C50 4 52 16 40 18 H-38 C-52 18 -54 10 -46 10Z"/>'); });
      o.push('<rect x="0" y="' + n1(hz) + '" width="' + W + '" height="' + n1(H - hz) + '" fill="url(#' + nid + '-pl)"/>');
      o.push('<path class="agv-curb" d="M0 ' + n1(hz) + 'H' + W + '"/>');
      for(var ty = hz + 18; ty < H; ty += 18) o.push('<path class="agv-tile" d="M0 ' + n1(ty) + 'H' + W + '"/>');
      for(var tx2 = 22; tx2 < W; tx2 += 46) o.push('<path class="agv-tile" d="M' + tx2 + ' ' + n1(hz) + 'V' + H + '"/>');
      if(W >= 900){
        [Math.min(g.x(0) - 70, W * 0.1), Math.max(g.x(TMAX) + 120, W * 0.9)].forEach(function(lx, k){
          if(lx < 30 || lx > W - 30) return;
          var top = hz - 6 - g.momH * 1.5, base = g.yN + 4;
          o.push('<g class="agv-lamp"><rect x="' + n1(lx - 2.5) + '" y="' + n1(top) + '" width="5" height="' + n1(base - top) + '" rx="2"/><rect x="' + n1(lx - 9) + '" y="' + n1(base - 6) + '" width="18" height="7" rx="2"/><path d="M' + n1(lx - 10) + ' ' + n1(top + 2) + 'h20l-4 -14h-12Z"/></g><circle class="agv-glow" cx="' + n1(lx) + '" cy="' + n1(top - 5) + '" r="5"/>');
          var px = lx + (k ? -44 : 44);
          o.push('<g class="agv-planter"><circle cx="' + n1(px - 9) + '" cy="' + n1(base - 30) + '" r="12"/><circle cx="' + n1(px + 8) + '" cy="' + n1(base - 33) + '" r="14"/><circle cx="' + n1(px) + '" cy="' + n1(base - 42) + '" r="12"/></g><rect class="agv-pot" x="' + n1(px - 20) + '" y="' + n1(base - 22) + '" width="40" height="22" rx="4"/>');
        });
      }
      // the pyramid's grid: 5%, 10%, 15% each side, with ticks under the rows
      [5, 10, 15].forEach(function(v){ [-1, 1].forEach(function(sg){ var xx = g.cx + sg * (g.spine / 2 + g.sx(v)); o.push('<path class="agv-grid" d="M' + n1(xx) + ' ' + n1(g.rowTop - 2) + 'V' + n1(g.rowBot + 3) + '"/>'); o.push('<text class="agv-tk" x="' + n1(xx) + '" y="' + n1(g.rowBot + 14) + '" text-anchor="middle" style="font-size:' + g.f.tick + 'px">' + v + '%</text>'); }); });
      // the spine: the age bands
      o.push('<rect class="agv-spine" x="' + n1(g.cx - g.spine / 2 + 2) + '" y="' + n1(g.rowTop - 1) + '" width="' + n1(g.spine - 4) + '" height="' + n1(g.rowBot - g.rowTop + 2) + '" rx="6"/>');
      // every band named when the rows are tall enough for the label and 4 px; else every other band (0–4, 10–14, ...)
      g.ageStep = g.pitch >= g.f.age * 1.36 + 4.5 ? 1 : 2;
      for(var i = 0; i < 17; i += g.ageStep){ var yy = g.rowBot - (i + 0.5) * g.pitch; o.push('<text class="agv-age" x="' + n1(g.cx) + '" y="' + n1(yy + g.f.age * 0.36) + '" text-anchor="middle" style="font-size:' + g.f.age + 'px">' + A.GROUPS[i] + '</text>'); }
      o.push('<text class="agv-sex is-m" x="' + n1(g.cx - g.spine / 2 - 4) + '" y="' + n1(g.sexY) + '" text-anchor="end" style="font-size:' + g.f.sex + 'px">Males</text>');
      o.push('<text class="agv-sex is-f" x="' + n1(g.cx + g.spine / 2 + 4) + '" y="' + n1(g.sexY) + '" text-anchor="start" style="font-size:' + g.f.sex + 'px">Females</text>');
      // the children per woman track and its numbers
      o.push('<path class="agv-track" d="M' + n1(g.x(TMIN)) + ' ' + n1(g.yT) + 'H' + n1(g.x(TMAX)) + '"/>');
      for(var n = TMIN; n <= TMAX; n++) o.push('<path class="agv-tick" d="M' + n1(g.x(n)) + ' ' + n1(g.yT - 5) + 'V' + n1(g.yT + 5) + '"/>');
      o.push('<text class="agv-cap" x="' + n1(g.cx) + '" y="' + n1(g.yC) + '" text-anchor="middle" style="font-size:' + g.f.cap + 'px">children per woman</text>');
      // the life expectancy track
      o.push('<path class="agv-etrack" d="M' + n1(g.eX0) + ' ' + n1(g.eY) + 'H' + n1(g.eX1) + '"/>');
      gStatic.innerHTML = o.join('');
      // the rows: one rect per side per band (filled with rows of people), made once
      var r = [];
      for(var j = 0; j < 17; j++){ var y0 = g.rowBot - (j + 1) * g.pitch + 1; r.push('<rect class="agv-row is-m" y="' + n1(y0) + '" height="' + n1(g.pitch - 2) + '" fill="url(#' + nid + '-m)"/><rect class="agv-row is-f" y="' + n1(y0) + '" height="' + n1(g.pitch - 2) + '" fill="url(#' + nid + '-f)"/>'); }
      gRows.innerHTML = r.join('');
      rowEls = [].slice.call(gRows.querySelectorAll('.agv-row'));
      // the dynamic layer: kids, the mother, the replacement mark, the numbers, the growth pill, the life label
      gDyn.innerHTML = '<g class="agv-kids"></g><g class="agv-mom"></g><g class="agv-nums"></g><g class="agv-repl"></g><g class="agv-pill"></g><text class="agv-life" text-anchor="end"></text>';
    }
    /* one person per tile, side by side from the spine outward: a row is literally people (a part of a person at the
       end, so the width is exact) */
    function patternDef(sx, cls){
      var g = G, h = g.pitch, w = Math.max(7, Math.min(h * 0.5, 13)), x0 = sx === 'm' ? g.cx - g.spine / 2 : g.cx + g.spine / 2, y0 = g.rowBot - 17 * h;
      return '<pattern id="' + nid + '-' + sx + '" patternUnits="userSpaceOnUse" x="' + n1(x0) + '" y="' + n1(y0) + '" width="' + n1(w) + '" height="' + n1(h) + '">' +
        '<rect x="0" y="0" width="' + n1(w) + '" height="' + n1(h) + '" class="' + cls + '-bg"/>' +
        '<path class="' + cls + '" d="' + personPath(w * 0.06, 2.5, w * 0.88, h - 4.5) + '"/></pattern>';
    }
    var rowEls = [];

    /* ---- painting one frame from what S holds */
    var shown = null;
    function paint(){
      if(!G) return;
      var g = G, d = drawn(); shown = d;
      for(var i = 0; i < 17; i++){
        var wm = g.sx(d.male[i]), wf = g.sx(d.female[i]), em = rowEls[2 * i], ef = rowEls[2 * i + 1];
        em.setAttribute('x', n1(g.cx - g.spine / 2 - wm)); em.setAttribute('width', n1(Math.max(0, wm)));
        ef.setAttribute('x', n1(g.cx + g.spine / 2)); ef.setAttribute('width', n1(Math.max(0, wf)));
      }
      paintSquare(d); paintHead(d); words(d);
    }
    var kidsKey = '', momKey = '';
    function paintSquare(d){
      var g = G, t = S.t, kids = gDyn.querySelector('.agv-kids'), n = Math.ceil(t - 1e-9), xs = g.x(t);
      // the children: slot k from x(k - 1) to x(k); the last only up to the mother (a part of a child for a fraction)
      var kk = n + '/' + g.W + '/' + g.H;
      if(kk !== kidsKey){
        kidsKey = kk;
        var h = '';
        for(var k = 1; k <= n; k++){ var cw = g.u * 0.78; h += figure2(g.x(k - 0.5) - cw / 2, g.yG - g.kidH, cw, g.kidH, { kind: 'kid', cls: k % 2 ? 'agv-kid-f' : 'agv-kid-m', skin: SKIN[(k * 3) % 7], hair: HAIR[(k * 5) % 7] }); }
        kids.innerHTML = '<clipPath id="' + nid + '-kc"><rect class="agv-kclip" x="0" y="0" height="' + n1(g.H) + '"/></clipPath><g clip-path="url(#' + nid + '-kc)">' + h + '</g>';
      }
      var cr = kids.querySelector('.agv-kclip'); cr.setAttribute('x', n1(g.x(0) - 4)); cr.setAttribute('width', n1(Math.max(0, xs - g.x(0) + 4)));
      var mom = gDyn.querySelector('.agv-mom');
      var mk = g.W + '/' + g.H;
      if(mk !== momKey){ momKey = mk; mom.innerHTML = '<ellipse class="agv-shadow" cx="0" cy="' + n1(g.yG) + '" rx="' + n1(g.momH * 0.26) + '" ry="3"/>' + figure2(-g.momH * 0.45, g.yG - g.momH, g.momH * 0.9, g.momH, { kind: 'mom', skin: SKIN[1] }); }
      mom.setAttribute('transform', 'translate(' + n1(g.momX(t)) + ' 0)');
      // the numbers under the track, and replacement where this life expectancy puts it
      var rp = d.repl, rx = g.x(rp), rt = 'replacement ' + n1(rp), rw = tw(rt, g.f.num, 800), nums = '';
      for(var m = TMIN; m <= TMAX; m++){ var nx = g.x(m), nwid = tw(String(m), g.f.num, 800); if(Math.abs(nx - rx) < rw / 2 + nwid / 2 + 6) continue; nums += '<text class="agv-num" x="' + n1(nx) + '" y="' + n1(g.yN) + '" text-anchor="middle" style="font-size:' + g.f.num + 'px">' + m + '</text>'; }
      gDyn.querySelector('.agv-nums').innerHTML = nums;
      var ra = clamp(rx, g.x(TMIN) - 30 + rw / 2, g.W - 6 - rw / 2);
      gDyn.querySelector('.agv-repl').innerHTML = '<path class="agv-rmark" d="M' + n1(rx) + ' ' + n1(g.yT - 9) + 'V' + n1(g.yT + 9) + '"/><text class="agv-rtext" x="' + n1(ra) + '" y="' + n1(g.yN) + '" text-anchor="middle" style="font-size:' + g.f.num + 'px">' + rt + '</text>';
    }
    function paintHead(d){
      var g = G, gw = growthWords(d.r), pill = gDyn.querySelector('.agv-pill'), fs = g.f.pill, w = tw(gw.pill, fs, 900) + 22 + fs, h = fs + 12, x = g.phone ? 8 : 16, y = g.phone ? 10 : 14;
      var ar = gw.dir > 0 ? 'M0 5 L5 -1 L10 5 M5 -1 V10' : gw.dir < 0 ? 'M0 4 L5 10 L10 4 M5 10 V-1' : 'M0 4.5 H10';
      pill.setAttribute('class', 'agv-pill ' + (gw.dir > 0 ? 'is-up' : gw.dir < 0 ? 'is-down' : 'is-flat'));
      pill.innerHTML = '<rect x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(h / 2) + '"/>' +
        '<path class="agv-par" transform="translate(' + n1(x + 11) + ' ' + n1(y + h / 2 - 4.5) + ') scale(' + (fs / 14).toFixed(3) + ')" d="' + ar + '"/>' +
        '<text x="' + n1(x + 16 + fs * 0.9) + '" y="' + n1(y + h / 2 + fs * 0.36) + '" style="font-size:' + fs + 'px">' + gw.pill + '</text>';
      var lf = gDyn.querySelector('.agv-life');
      lf.setAttribute('x', n1(g.eX1 + 8)); lf.setAttribute('y', n1(g.eLY + g.f.life * 0.36)); lf.style.fontSize = g.f.life + 'px';
      lf.textContent = 'Life expectancy ' + Math.round(S.E) + ' years';
    }
    var lastSay = '';
    function words(d){
      var gw = growthWords(d.r), sh = A.shape(d), settled = !moving();
      var parts = [{ t: n1(d.t) + ' children per woman', role: 'tfr', say: n1(d.t) + ' children per woman' }, { t: SHAPE_WORD[sh], role: 'shape', say: 'an ' + SHAPE_WORD[sh] + ' pyramid' }, { t: gw.part, role: gw.dir > 0 ? 'up' : gw.dir < 0 ? 'down' : 'flat' }];
      if(gw.two) parts.push({ t: gw.two, role: gw.dir > 0 ? 'up' : 'down' });
      if(settled && S.take) cause.take(TAKE); else cause.set(parts);
      var say = cause.text();
      if(settled && say !== lastSay){ lastSay = say; live.textContent = say; }
      svg.setAttribute('aria-label', 'Population pyramid built of people, males left and females right, in 5 year age bands: ' + SHAPE_WORD[sh] + ', ' + Math.round(A.broad(d).young) + '% under 15 and ' + Math.round(A.broad(d).old) + '% 65 and over. ' + n1(d.t) + ' children per woman, life expectancy ' + Math.round(S.E) + ' years: ' + gw.part + '. Replacement here is ' + n1(d.repl) + ' children per woman.');
    }

    /* ---- the loop: each row eases to the rate, the base first, the rows above a little later */
    function moving(){ if(Math.abs(S.E - S.e) > 1e-6) return true; for(var i = 0; i < 17; i++) if(Math.abs(S.T[i] - S.t) > 1e-6) return true; return false; }
    function kick(){
      var wasTake = S.take; S.take = false;
      if(K.reduced()){ settle(); flash(); paint(); return; }
      if(!raf){ lastT = 0; stage.setAttribute('data-busy', '1'); raf = requestAnimationFrame(tick); }
      if(wasTake) words(shown || drawn());
      paintSquare(shown || drawn());
    }
    function settle(){ for(var i = 0; i < 17; i++) S.T[i] = S.t; S.E = S.e; }
    function flash(){ fade.classList.remove('is-on'); void fade.offsetWidth; fade.classList.add('is-on'); }
    function tick(ts){
      raf = 0;
      var dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0.016; lastT = ts;
      for(var i = 0; i < 17; i++){
        var tau = 0.05 + 0.022 * i, a = 1 - Math.exp(-dt / tau), v = S.T[i] + (S.t - S.T[i]) * a;
        // a thousandth: the memo's key, so the row drawn is exactly the model at S.T[i] (and always a step on)
        var q = Math.abs(S.t - v) < 0.015 ? S.t : Math.round(v * 1000) / 1000;
        if(q === S.T[i] && q !== S.t) q = Math.round((q + (S.t > q ? 0.001 : -0.001)) * 1000) / 1000;
        S.T[i] = q;
      }
      var e = S.E + (S.e - S.E) * (1 - Math.exp(-dt / 0.12));
      // life expectancy eases in steps of 0.1 year (each a cached life table)
      e = Math.abs(S.e - e) < 0.06 ? S.e : Math.round(e * 10) / 10;
      if(e === S.E && S.E !== S.e) e = S.E + (S.e > S.E ? 0.1 : -0.1);
      S.E = +e.toFixed(1);
      var mv = moving();
      paint();
      stage.setAttribute('data-busy', mv ? '1' : '');
      if(mv) raf = requestAnimationFrame(tick);
      else words(shown);
    }
    function stopLoop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } settle(); stage.setAttribute('data-busy', ''); paint(); }

    /* ---- layout */
    var lastW = 0, lastH = 0;
    function layoutNow(force){
      var W = Math.round(sceneBox.getBoundingClientRect().width);
      if(!W) return;
      var H0 = availH(W <= 640);
      if(!force && W === lastW && H0 === lastH && G){ if(cue.active()) cue.place(); return; }
      lastW = W; lastH = H0;
      G = geo(W);
      sceneBox.style.height = G.H + 'px';
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + G.H);
      kidsKey = ''; momKey = '';
      drawStatic(); paint();
      cT.place(); cE.place();
      if(cue.active()) cue.place();
      if(tour && tour.active()) tour.place();
    }

    /* ---- Show me how */
    function knobOf(c){ return c.knob || c.el; }
    function startTour(force){
      if(S.mode !== 'explore') return;
      stopTour(); if(force) cue.hide(false);
      tour = K.tour({ key: 'apenv-age', label: 'Show me how', steps: [
        { id: 'tfr', text: 'Drag the mother: more or fewer children per woman.', target: function(){ return knobOf(cT); } },
        { id: 'base', text: 'The base changes first; the rows above follow as those children grow up.', target: function(){ return sceneBox; } },
        { id: 'life', text: 'Longer lives fill out the top of the pyramid.', target: function(){ return knobOf(cE); } }] });
      if(force) tour.start(true);
    }
    function stopTour(){ if(tour){ tour.stop(); tour = null; } }
    function tourDid(id){ if(tour && tour.active()) tour.did(id); }

    /* ---- "?" */
    function pc(v){ return (Math.round(v * 10) / 10).toFixed(1) + '%'; }
    function refHtml(){
      var d = shown || drawn(), b = A.broad(d), gw = growthWords(d.r), dep = (b.young + b.old) / b.work * 100;
      var h = '<p class="agv-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use this screen.</p>' +
        '<p><b>What the pyramid is.</b> Each row is one 5 year age group; its length is that group’s share of all the people (men left, women right; one scale for every setting, so the shapes compare). It shows where a fertility rate and a life expectancy lead once they have held for a long time, with no migration: the base is the newest children, and those children become the rows above. Real countries rarely sit at that shape: a country whose births fell recently still has the wide rows of its earlier, larger generations.</p>' +
        '<p><b>Now.</b> ' + n1(d.t) + ' children per woman, life expectancy ' + Math.round(d.e) + ' years: crude birth rate ' + n1(d.cbr) + ' and crude death rate ' + n1(d.cdr) + ' per 1,000 people a year.</p>' +
        '<p><b>Growth rate</b> = (CBR − CDR) / 10 = (' + n1(d.cbr) + ' − ' + n1(d.cdr) + ') / 10 = ' + (d.r < 0 ? '−' : '') + pc(Math.abs(d.r * 100)) + ' a year' + (gw.two ? '. <b>Rule of 70:</b> ' + (gw.dir > 0 ? 'doubling' : 'halving') + ' time = 70 / ' + (Math.round(Math.abs(d.r * 1000)) / 10).toFixed(1) + ' = ' + gw.two.replace(/^\w+ in /, '') : ' (no change to speak of)') + '.</p>' +
        '<p><b>Replacement level.</b> The children per woman that just replace the parents: about 2.1 where few children die (2 for the parents, a little more because some girls die before they have children and slightly more boys than girls are born). Where many children die it is higher: here, with a life expectancy of ' + Math.round(d.e) + ' years, it is ' + n1(d.repl) + '. Above it each generation of mothers is larger than the last (the base widens); below it, smaller.</p>' +
        '<p><b>Reading the shape.</b> Expansive: a wide base that narrows fast (many children; fast growth ahead). Stable, also called stationary: about the same width up to middle age (births near replacement). Constrictive: a base narrower than the middle (births below replacement; the population ages and, without immigration, shrinks).</p>' +
        '<p><b>Population momentum.</b> A wide base keeps a population growing for decades after births per woman fall to replacement: the many children already born grow up and have children of their own. The United Nations expects momentum to account for 79% of the world’s population increase through 2054 (World Population Prospects 2024).</p>' +
        '<p><b>Dependency.</b> Under 15: ' + pc(b.young) + '; 15 to 64: ' + pc(b.work) + '; 65 and over: ' + pc(b.old) + '. Dependency ratio = (under 15 + 65 and over) / (15 to 64) × 100 = ' + Math.round(dep) + ' dependents per 100 people of working age.</p>' +
        '<h3 class="ls-title-l">The four stages of the demographic transition</h3>' + T.dataTable(['Stage', 'Birth rate', 'Death rate', 'Children per woman', 'Life expectancy', 'What happens'], [1, 2, 3, 4].map(function(s){ var x = A.STAGES[s]; return [esc(x.name), x.cbr + ' per 1,000', x.cdr + ' per 1,000', String(x.tfr), x.e0 + ' years', esc(x.what + ' ' + x.why)]; }), 'Typical values for each stage') +
        '<p class="bt-small">Some books add a stage 5: births fall below deaths and the population declines. The stage drills are in Test yourself.</p>' +
        '<h3 class="ls-title-l">The rows now (% of all people)</h3>' + T.dataTable(['Age', 'Males', 'Females'], d.groups.map(function(gp, i){ return [gp, pc(d.male[i]), pc(d.female[i])]; }).reverse(), 'Percent of the population in each age band') +
        '<p class="bt-small">How it is drawn: a stable population model. Survival to each age comes from a model life table with exactly the life expectancy set (women live 5 years longer than men, as the world average is about 5 years apart; 105 boys are born per 100 girls); births by the mother’s age peak in her twenties. The growth rate is the one at which those births and that survival keep the shape (Lotka’s equation), so birth rate minus death rate equals it exactly. A teaching model, not any one country. Each small figure in a row is a piece of the bar, not a set number of people.</p>';
      ref.innerHTML = h;
    }
    ref.addEventListener('click', function(e){ if(e.target.closest('[data-how]')){ if(LS && LS.close) LS.close(); setTimeout(function(){ startTour(true); }, 280); } });

    function studio(pane, s){
      LS = s;
      K.on(s);
      s.add('stage', stage, { mode: 'explore' });
      s.add('details', ref, { mode: 'explore' });
      stage.setAttribute('data-ls-only', 'explore'); ref.setAttribute('data-ls-only', 'explore');
      var ab = pane.querySelector('details.tool-about, .tool-about'); if(ab) s.add('about', ab, { mode: 'explore' });
      s.mode(s.mode());
      layoutNow(true); refHtml();
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(function(){ layoutNow(); }, 50); }).observe(sceneBox); }
      window.addEventListener('resize', function(){ setTimeout(function(){ layoutNow(); }, 60); });
      if(s.mode() === 'explore') cue.show();
      startTour(false);
      // warm the whole year life tables (women e0 + 2.5, men e0 - 2.5) a few at a time, so a life expectancy drag
      // never solves one mid frame
      var we = 27;
      (function warm(){ for(var k = 0; k < 3 && we <= 88; k++, we++) A.lifeTable(we); if(we <= 88) setTimeout(warm, 40); })();
    }
    // "?" follows the picture once it settles
    var refT = null;
    var paint0 = paint; paint = function(){ paint0(); if(!moving()){ clearTimeout(refT); refT = setTimeout(refHtml, 120); } };

    // test hooks (read only, plus set for the sweeps)
    window.__age = { gw: growthWords, G: function(){ return G; }, busy: function(){ return !!raf; }, drawn: function(){ return shown; }, S: function(){ return S; },
      target: function(){ return model(S.t, S.e); }, rows: function(){ return rowEls.map(function(e){ return +e.getAttribute('width'); }); },
      set: function(t, e){ if(t != null){ cT.value(t, true); } if(e != null){ cE.value(e, true); } } };
    return {
      studio: studio,
      shown: function(m){
        S.mode = m;
        if(m === 'explore'){ setTimeout(function(){ layoutNow(true); cue.show(); }, 30); }
        else { stopLoop(); stopTour(); cue.hide(false); }
      }
    };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'age-structure', noun: 'problem',
      generate: function(r, ctx, type){ return A.generate(r, ctx, type); },
      types: A.TYPES, typeLabel: 'Kind of problem',
      title: function(p){ var t = A.TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); doneLine(host, s, right, api); },
      refit: function(api){ figure(api.fig, api.problem, api.st); }
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
    var g = p.figure, ph = (window.innerWidth || 1280) <= 640, W = ph ? 360 : 640, H = ph ? 340 : T.figSize(640, 360, { max: 0.78 })[1], inner = '', aria = '';
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
