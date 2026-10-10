/* A&P graph reader (docs/anp-spec.md section 8.5, docs/anp-tools-contract.md).

   Content: data/tools/graphs.json (read from #app[data-src]). Every graph is
   drawn here as SVG from its numbers: one shared x axis, one or more stacked
   panels each with its own y axis, labels on the lines (never a legend), and
   the course's visual-language classes for color.

   Each question is one scored item, graphs:<graph>:<question>:
     value   read a number off the graph (typed, accepted within a tolerance);
             the reading is then drawn on the graph
     phase   name a phase or region; the region is then shaded on the graph
     shift   predict how the curve changes; the shifted curve is then drawn
   The first answer to each question on a page visit is recorded through
   AnpCore.toolResult (XP, mastery, misses to review) and fires
   anp-graph-answer.

   Two modes per graph (tools upgrade 2026-10, docs/tools-upgrade-notes/anp-rest.md):
     Explore  drag a cursor along x (or use the slider under the chart) and
              read every curve at that point, with the region it is in; tap a
              "What if" condition (from the graph's shift questions) and the
              curve moves to its shifted position, with the explanation and
              the change at the cursor. Not scored.
     Quiz     the questions above. A shift question whose answers are
              directions (left, right, up, down, no change) can also be
              answered by dragging a copy of the curve where it will go.
   Readings come from the graph's own points, through the same monotone
   curve the chart draws (AnpGraphMath below, tested in
   scripts/test/anp-graphs.test.mjs); nothing between two data curves is
   invented: a condition toggles between them, it does not blend them. */

/* Pure helpers, no DOM (exported for scripts/test/anp-graphs.test.mjs). */
(function(){
  /* y(x) along a series exactly as pathD draws it: monotone cubic
     (Fritsch–Carlson) for curve "smooth", straight segments otherwise. null
     when x is outside the series or the series is a loop (x not rising). */
  function curveFn(pts, smooth){
    var n = pts ? pts.length : 0, i;
    if(n < 2) return null;
    for(i = 1; i < n; i++) if(pts[i][0] <= pts[i - 1][0]) return null;
    var dx = [], m = [], t = [];
    for(i = 0; i < n - 1; i++){ dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
    var cubic = smooth && n >= 3;
    if(cubic){
      t[0] = m[0]; t[n - 1] = m[n - 2];
      for(i = 1; i < n - 1; i++) t[i] = (m[i - 1] * m[i] <= 0) ? 0 : (m[i - 1] + m[i]) / 2;
      for(i = 0; i < n - 1; i++){
        if(m[i] === 0){ t[i] = 0; t[i + 1] = 0; continue; }
        var a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
        if(s > 9){ var k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
      }
    }
    return function(x){
      if(x < pts[0][0] - 1e-9 || x > pts[n - 1][0] + 1e-9) return null;
      var j = 0;
      while(j < n - 2 && x > pts[j + 1][0]) j++;
      var u = Math.min(1, Math.max(0, (x - pts[j][0]) / dx[j])), y0 = pts[j][1], y1 = pts[j + 1][1];
      if(!cubic) return y0 + (y1 - y0) * u;
      // The chart's Bezier has its control points at thirds of the step, so
      // its x is linear in u and y is this cubic.
      var h = dx[j] / 3, c0 = y0 + t[j] * h, c1 = y1 - t[j + 1] * h, v = 1 - u;
      return v * v * v * y0 + 3 * v * v * u * c0 + 3 * v * u * u * c1 + u * u * u * y1;
    };
  }
  function seriesFn(s){ return curveFn(s.pts, s.curve === 'smooth'); }

  /* The base series an overlay series replaces: an explicit "from", else the
     panel's series whose id starts the overlay's id (vm -> vm-hk), else the
     panel's only series, else the closest one in shape. */
  function pairOf(g, os){
    var k = os.panel || 0, base = (g.panels[k] && g.panels[k].series) || [];
    if(!base.length) return null;
    var i;
    if(os.from) for(i = 0; i < base.length; i++) if(base[i].id === os.from) return base[i];
    for(i = 0; i < base.length; i++) if(os.id && os.id.indexOf(base[i].id + '-') === 0) return base[i];
    if(base.length === 1) return base[0];
    var fo = seriesFn(os), best = null, bd = Infinity;
    base.forEach(function(b){
      var fb = seriesFn(b), d = 0, c = 0;
      if(fo && fb) os.pts.forEach(function(p){ var y = fb(p[0]); if(y != null){ d += Math.abs(y - p[1]); c++; } });
      var score = c ? d / c : Infinity;
      if(score < bd){ bd = score; best = b; }
    });
    return best;
  }

  /* The directions an answer option names for the curve: ['right'],
     ['up','left'], ['none'], or [] when it is not a plain direction (a curve
     that flattens, a point moving along a line). */
  function dirsOf(text){
    var t = String(text || '').replace(/<[^>]+>/g, '').toLowerCase().replace(/[:,.;].*$/, '').trim();
    if(/\balong\b/.test(t)) return [];
    if(/^(it\s+)?(does not (shift|change|move)|is unchanged|no change|nothing changes|exactly on)/.test(t)) return ['none'];
    var m = t.match(/^(?:it\s+)?(?:shifts?\s+|moves?\s+|slides?\s+)?(?:to the\s+)?(left|right|up|down)(?:ward)?(?:\s+and\s+(left|right|up|down))?(?:\s+evenly\b.*)?$/);
    if(!m) m = t.match(/^(?:it\s+)?(?:shifts?\s+|moves?\s+|slides?\s+)?(?:to the\s+)?(left|right|up|down)(?:ward)?(?:\s+and\s+(left|right|up|down))?\b/);
    if(!m) return [];
    return m[2] ? [m[1], m[2]] : [m[1]];
  }

  /* Can this shift question be answered by placing the curve? Returns
     { k, base, over, dirs } or null: it needs one overlay series with a base
     to move, a right answer that is a direction, and options whose
     directions never overlap. */
  function placeable(g, q){
    if(!q || q.type !== 'shift' || !q.overlay || !q.overlay.series || q.overlay.series.length !== 1) return null;
    var over = q.overlay.series[0], base = pairOf(g, over);
    if(!base || !seriesFn(base) || !seriesFn(over)) return null;
    var dirs = q.options.map(dirsOf), right = dirs[q.correct];
    if(!right.length || right[0] === 'none') return null;
    var seen = {}, ok = true;
    dirs.forEach(function(ds){ ds.forEach(function(d){ if(seen[d]) ok = false; seen[d] = 1; }); });
    if(!ok) return null;
    return { k: over.panel || 0, base: base, over: over, dirs: dirs };
  }

  /* The option a drag of (dx, dy) screen pixels picks: the dominant axis
     beyond min px, or 'none' inside it. -1 when no option says that. */
  function pickByDrag(dirs, dx, dy, min){
    var d = Math.max(Math.abs(dx), Math.abs(dy)) < (min || 14) ? 'none' :
      Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    for(var i = 0; i < dirs.length; i++) if(dirs[i].indexOf(d) > -1) return { i: i, dir: d };
    return { i: -1, dir: d };
  }

  window.AnpGraphMath = { curveFn: curveFn, seriesFn: seriesFn, pairOf: pairOf, dirsOf: dirsOf, placeable: placeable, pickByDrag: pickByDrag };
})();

(function(){
  var app = document.getElementById('app');
  if(!app) return;
  var GM = window.AnpGraphMath;
  var BASE = window.ANP_BASE || '../';
  var NS = 'http://www.w3.org/2000/svg';
  var W = 420, ML = 60, MR = 16, MT = 16, PANEL = 210, GAP = 18;
  var DATA = null, booted = false, listFilter = null;
  var scored = {};

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function html(s){ return String(s == null ? '' : s); }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function cur(){ return window.AnpCurriculum || { chapters: [], topics: [] }; }
  function topicInfo(id){ var ts = cur().topics; for(var i = 0; i < ts.length; i++) if(ts[i].id === id) return ts[i]; return null; }
  function chapterInfo(id){ var cs = cur().chapters; for(var i = 0; i < cs.length; i++) if(cs[i].id === id) return cs[i]; return null; }
  function chapterOf(g){ var t = topicInfo(g.topic); return t ? t.chapter : ''; }
  function itemId(g, q){ return 'graphs:' + g.id + ':' + q.id; }
  function report(id){ return window.LevlReport ? window.LevlReport.button('anp', id) : ''; }
  function find(id){ for(var i = 0; i < DATA.graphs.length; i++) if(DATA.graphs[i].id === id) return DATA.graphs[i]; return null; }
  function status(id){ try{ var r = window.AnpCore && window.AnpCore.load().q[id]; if(!r || !r.n) return 'new'; return r.right ? 'right' : 'missed'; }catch(e){ return 'new'; } }
  function topicLink(id){ var t = topicInfo(id); if(!t) return esc(id); return t.built ? '<a href="' + esc(BASE + 'lessons/' + t.id + '.html') + '">' + esc(t.title) + '</a>' : esc(t.title); }
  function fmt(v){
    var a = Math.abs(v), s;
    if(a >= 1000) s = String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    else if(a >= 10 || a === 0) s = String(Math.round(v * 10) / 10);
    else if(a >= 1) s = String(Math.round(v * 100) / 100);
    else s = String(Math.round(v * 1000) / 1000);
    return s.replace('-', '−');
  }
  /* Tick labels on one axis share their decimals: 7.0, 7.2, 7.4, not 7, 7.2. */
  function tickFmt(ticks){
    var d = 0;
    (ticks || []).forEach(function(t){ var m = String(t).split('.')[1]; if(m && m.length > d) d = m.length; });
    return function(v){ return d && Math.abs(v) < 1000 ? v.toFixed(d).replace('-', '−') : fmt(v); };
  }
  function unitText(u){ return u ? (/^[%°]/.test(u) ? u : ' ' + u) : ''; }

  /* ---------------------------------------------------------------- routing */
  function params(){
    var out = {};
    (location.search || '').replace(/^\?/, '').split('&').forEach(function(kv){ if(!kv) return; var p = kv.split('='); out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
    return out;
  }
  function route(){
    var h = (location.hash || '').replace(/^#/, '').split('/');
    var g = h[0] ? find(decodeURIComponent(h[0])) : null;
    if(g){
      if(h[1] === 'explore') return showGraph(g, null, 'explore');
      var k = null;
      if(h[1]) g.questions.forEach(function(q, i){ if(q.id === h[1]) k = i; });
      showGraph(g, k);
    } else if(h[0] === 'all') showList();
    else { var d = defaultItem(); if(d) showGraph(d, null); else showList(); }
  }

  /* -------------------------------------------------------------- list view */
  function showList(){
    var q = params();
    if(listFilter === null){
      listFilter = 'all';
      if(q.chapter) listFilter = q.chapter;
      else if(q.topic){ var t = topicInfo(q.topic); if(t) listFilter = t.chapter; }
    }
    var chapters = [];
    DATA.graphs.forEach(function(g){ var c = chapterOf(g); if(c && chapters.indexOf(c) < 0) chapters.push(c); });
    var order = cur().chapters.map(function(c){ return c.id; });
    chapters.sort(function(a, b){ return order.indexOf(a) - order.indexOf(b); });
    if(listFilter !== 'all' && chapters.indexOf(listFilter) < 0) listFilter = 'all';
    var done = 0, total = 0;
    DATA.graphs.forEach(function(g){ g.questions.forEach(function(qq){ total++; if(status(itemId(g, qq)) === 'right') done++; }); });
    var topicOrder = cur().topics.map(function(t){ return t.id; });
    var chips = '<div class="pw-chips" role="group" aria-label="Filter by chapter"><button type="button" class="pw-chip" data-f="all" aria-pressed="' + (listFilter === 'all') + '">All</button>' +
      chapters.map(function(c){ var ch = chapterInfo(c); return '<button type="button" class="pw-chip" data-f="' + esc(c) + '" aria-pressed="' + (listFilter === c) + '">' + esc(ch ? ch.title : c) + '</button>'; }).join('') + '</div>';
    // On a phone the chips are one select (audit 2026-10: up to 25 chips came before any content).
    chips += '<label class="pw-chsel">Chapter <select id="pw-chsel"><option value="all">All chapters</option>' +
      chapters.map(function(c){ var ch = chapterInfo(c); return '<option value="' + esc(c) + '"' + (listFilter === c ? ' selected' : '') + '>' + esc(ch ? ch.title : c) + '</option>'; }).join('') + '</select></label>';
    var groups = chapters.filter(function(c){ return listFilter === 'all' || listFilter === c; }).map(function(c){
      var ch = chapterInfo(c);
      var gs = DATA.graphs.filter(function(g){ return chapterOf(g) === c; });
      gs.sort(function(a, b){ return topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic); });
      return '<section class="pw-group"><h2>' + esc(ch ? ch.title : c) + '</h2><ul class="pw-cards">' + gs.map(function(g){
        var t = topicInfo(g.topic);
        var right = g.questions.filter(function(qq){ return status(itemId(g, qq)) === 'right'; }).length;
        return '<li><a class="pw-card" href="#' + esc(g.id) + '"><span class="pw-card-title">' + esc(g.title) + '</span>' +
          '<span class="pw-card-meta">' + g.questions.length + ' questions' + (t ? ' · ' + esc(t.title) : '') + '</span>' +
          '<span class="pw-dots" aria-label="' + right + ' of ' + g.questions.length + ' answered right">' + g.questions.map(function(qq){
            var s = status(itemId(g, qq));
            return '<span class="pw-dot is-' + s + '" aria-hidden="true">' + (s === 'right' ? '✓' : s === 'missed' ? '✗' : '') + '</span>';
          }).join('') + '</span></a></li>';
      }).join('') + '</ul></section>';
    }).join('');
    app.innerHTML = '<div class="pw gr">' +
      '<p class="pw-lead">Physiology graphs drawn from real-shaped data. For each one: <b>read a value</b> off it, <b>name a phase or region</b>, and <b>predict how the curve shifts</b>, then see the shifted curve drawn in.</p>' +
      '<p class="anp-small pw-progress">' + done + ' of ' + total + ' questions answered right</p>' + chips + groups + '</div>';
    app.querySelectorAll('.pw-chip').forEach(function(b){
      b.addEventListener('click', function(){ listFilter = b.getAttribute('data-f'); showList(); var a = app.querySelector('.pw-chip[data-f="' + listFilter + '"]'); if(a) a.focus(); });
    });
    var sel = app.querySelector('#pw-chsel');
    if(sel) sel.addEventListener('change', function(){ listFilter = sel.value; showList(); var ns = app.querySelector('#pw-chsel'); if(ns) ns.focus(); });
  }

  /* Open on an item, not the list (docs/tools-upgrade.md, P1-A&P): the
     first graphs in list order, within ?chapter= / ?topic=, with something
     not yet answered right; #all is the full list. The picker above the item
     reaches every graphs. */
  function ordered(){
    var q = params(), want = q.chapter || (q.topic && topicInfo(q.topic) ? topicInfo(q.topic).chapter : '');
    var order = cur().chapters.map(function(c){ return c.id; }), topicOrder = cur().topics.map(function(t){ return t.id; });
    var all = DATA.graphs.slice().sort(function(a, b){
      return order.indexOf(chapterOf(a)) - order.indexOf(chapterOf(b)) || topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic);
    });
    var inCh = all.filter(function(x){ return chapterOf(x) === want; });
    return inCh.length ? inCh : all;
  }
  function defaultItem(){
    var list = ordered(), q = params();
    if(q.topic){ var t = list.filter(function(x){ return x.topic === q.topic; }); if(t.length) list = t.concat(list.filter(function(x){ return t.indexOf(x) < 0; })); }
    for(var i = 0; i < list.length; i++) if(list[i].questions.some(function(q){ return status(itemId(list[i], q)) !== 'right'; })) return list[i];
    return list[0] || null;
  }
  function addPicker(g){
    var host = app.querySelector('.pw-pickhost'), K = window.AnpToolKit;
    if(!host || !K) return;
    var chapters = [];
    var all = DATA.graphs.slice(), order = cur().chapters.map(function(c){ return c.id; }), topicOrder = cur().topics.map(function(t){ return t.id; });
    all.sort(function(a, b){ return order.indexOf(chapterOf(a)) - order.indexOf(chapterOf(b)) || topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic); });
    all.forEach(function(x){ var c = chapterOf(x); if(chapters.indexOf(c) < 0) chapters.push(c); });
    K.picker(host, {
      label: 'Graph', noun: 'graphs', current: g.id, allHref: '#all', allLabel: 'All graphs by chapter',
      groups: chapters.map(function(c){ var ch = chapterInfo(c); return { title: ch ? ch.title : c, items: all.filter(function(x){ return chapterOf(x) === c; }).map(function(x){
        var t = topicInfo(x.topic);
        return { id: x.id, title: x.title, meta: t ? t.title : '', href: '#' + x.id, done: x.questions.every(function(q){ return status(itemId(x, q)) === 'right'; }) };
      }) }; })
    });
  }

  function firstOpen(g){ for(var i = 0; i < g.questions.length; i++) if(status(itemId(g, g.questions[i])) !== 'right') return i; return 0; }

  /* ----------------------------------------------------------------- drawing */
  function el(name, attrs, text){
    var e = document.createElementNS(NS, name);
    for(var a in attrs) if(attrs.hasOwnProperty(a) && attrs[a] != null) e.setAttribute(a, attrs[a]);
    if(text != null) e.textContent = text;
    return e;
  }
  /* Monotone cubic interpolation (Fritsch–Carlson): smooth, never overshoots
     the data, so a peak drawn is a peak measured. Falls back to straight
     segments when x is not increasing (a loop). */
  function pathD(pts, smooth){
    if(pts.length < 2) return '';
    var i, d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    var inc = true;
    for(i = 1; i < pts.length; i++) if(pts[i][0] <= pts[i - 1][0]) inc = false;
    if(!smooth || !inc || pts.length < 3){
      for(i = 1; i < pts.length; i++) d += ' L' + pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1);
      return d;
    }
    var n = pts.length, dx = [], m = [], t = [];
    for(i = 0; i < n - 1; i++){ dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for(i = 1; i < n - 1; i++) t[i] = (m[i - 1] * m[i] <= 0) ? 0 : (m[i - 1] + m[i]) / 2;
    for(i = 0; i < n - 1; i++){
      if(m[i] === 0){ t[i] = 0; t[i + 1] = 0; continue; }
      var a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if(s > 9){ var k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    for(i = 0; i < n - 1; i++){
      var h = dx[i] / 3;
      d += ' C' + (pts[i][0] + h).toFixed(1) + ',' + (pts[i][1] + t[i] * h).toFixed(1) + ' ' +
        (pts[i + 1][0] - h).toFixed(1) + ',' + (pts[i + 1][1] - t[i + 1] * h).toFixed(1) + ' ' +
        pts[i + 1][0].toFixed(1) + ',' + pts[i + 1][1].toFixed(1);
    }
    return d;
  }

  /* Build the chart. Returns { svg, layers, sx, sy(panel, y) }. */
  function chart(g){
    var X = g.x, cats = X.cats;
    var xmin = cats ? -0.5 : X.min, xmax = cats ? cats.length - 0.5 : X.max;
    var PW = W - ML - MR;
    var tops = [], hs = [], y = MT;
    g.panels.forEach(function(p, k){ var h = Math.round(PANEL * (p.h || 1)); tops.push(y); hs.push(h); y += h + GAP; });
    var plotBottom = y - GAP;
    var MB = cats ? 78 : 44;
    var H = plotBottom + MB;
    function sx(x){ return ML + (x - xmin) / (xmax - xmin) * PW; }
    // y.reverse draws the axis top-down (min at the top), as on a clinical audiogram.
    function sy(k, v){ var p = g.panels[k].y; return p.reverse ? tops[k] + (v - p.min) / (p.max - p.min) * hs[k] : tops[k] + hs[k] - (v - p.min) / (p.max - p.min) * hs[k]; }
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': g.alt, 'class': 'gr-svg' });
    var L = {};
    ['bg', 'regions', 'hl', 'axes', 'series', 'overlay', 'labels', 'marks', 'cursor'].forEach(function(n){ L[n] = el('g', { 'class': 'gr-' + n }); svg.appendChild(L[n]); });
    var clipId = 'grclip-' + g.id;
    var defs = el('defs');
    g.panels.forEach(function(p, k){
      var c = el('clipPath', { id: clipId + '-' + k });
      c.appendChild(el('rect', { x: ML - 2, y: tops[k] - 2, width: PW + 4, height: hs[k] + 4 }));
      defs.appendChild(c);
    });
    svg.insertBefore(defs, svg.firstChild);

    g.panels.forEach(function(p, k){
      var top = tops[k], h = hs[k], ya = p.y;
      // ECG paper or light gridlines at the ticks
      if(p.grid){
        var gx, gy, mx = p.grid.majorX, my = p.grid.majorY;
        for(gx = X.min; gx <= X.max + 1e-9; gx += p.grid.x){
          var major = Math.abs(gx / mx - Math.round(gx / mx)) < 1e-6;
          L.bg.appendChild(el('line', { x1: sx(gx), x2: sx(gx), y1: top, y2: top + h, 'class': major ? 'gr-grid-major' : 'gr-grid' }));
        }
        for(gy = ya.min; gy <= ya.max + 1e-9; gy += p.grid.y){
          var majorY = Math.abs(gy / my - Math.round(gy / my)) < 1e-6;
          L.bg.appendChild(el('line', { x1: ML, x2: ML + PW, y1: sy(k, gy), y2: sy(k, gy), 'class': majorY ? 'gr-grid-major' : 'gr-grid' }));
        }
      } else {
        (ya.ticks || []).forEach(function(t){ L.bg.appendChild(el('line', { x1: ML, x2: ML + PW, y1: sy(k, t), y2: sy(k, t), 'class': 'gr-grid' })); });
      }
      (p.bands || []).forEach(function(b){
        L.bg.appendChild(el('rect', { x: ML, width: PW, y: Math.min(sy(k, b.y1), sy(k, b.y0)), height: Math.abs(sy(k, b.y0) - sy(k, b.y1)), 'class': 'gr-band' }));
        L.labels.appendChild(el('text', { x: sx(b.at != null ? b.at : X.max), y: sy(k, b.y1) + 13, 'text-anchor': 'end', 'class': 'gr-note' }, b.label));
      });
      // axes
      L.axes.appendChild(el('line', { x1: ML, x2: ML, y1: top, y2: top + h, 'class': 'gr-axis' }));
      L.axes.appendChild(el('line', { x1: ML, x2: ML + PW, y1: top + h, y2: top + h, 'class': 'gr-axis' }));
      var yf = tickFmt(ya.ticks);
      (ya.ticks || []).forEach(function(t){
        L.axes.appendChild(el('line', { x1: ML - 4, x2: ML, y1: sy(k, t), y2: sy(k, t), 'class': 'gr-axis' }));
        L.axes.appendChild(el('text', { x: ML - 7, y: sy(k, t) + 4, 'text-anchor': 'end', 'class': 'gr-tick' }, yf(t)));
      });
      var yt = ya.label + (ya.unit ? ' (' + ya.unit + ')' : '');
      L.axes.appendChild(el('text', { x: 14, y: top + h / 2, 'text-anchor': 'middle', transform: 'rotate(-90 14 ' + (top + h / 2) + ')', 'class': 'gr-axis-title' }, yt));
      (p.hlines || []).forEach(function(l){ hline(L.series, L.labels, k, l); });
      (p.bursts || []).forEach(function(b){
        var n = 14, d = '', mid = (ya.min + ya.max) / 2, amp = (ya.max - ya.min) * 0.36;
        for(var i = 0; i <= n; i++){
          var xx = b.x0 + (b.x1 - b.x0) * i / n, yy = mid + (i === 0 || i === n ? 0 : (i % 2 ? amp : -amp) * (1 - Math.abs(i - n / 2) / (n / 1.6)));
          d += (i ? ' L' : 'M') + sx(xx).toFixed(1) + ',' + sy(k, yy).toFixed(1);
        }
        L.series.appendChild(el('path', { d: d, 'class': 'accent line gr-line gr-burst' }));
        L.labels.appendChild(el('text', { x: sx(b.x1) + 5, y: sy(k, mid) + 4, 'class': 'gr-lbl gr-c-accent' }, b.label));
      });
      (p.series || []).forEach(function(s){ series(L.series, L.labels, k, s); });
      (p.marks || []).forEach(function(m){ mark(L.marks, k, m, 'gr-mark'); });
      (p.notes || []).forEach(function(t){ L.labels.appendChild(el('text', { x: sx(t.x), y: sy(k, t.y), 'text-anchor': t.anchor || 'start', 'class': 'gr-note' }, t.text)); });
    });

    // shared x axis on the bottom panel
    var last = g.panels.length - 1, base = tops[last] + hs[last];
    if(cats){
      cats.forEach(function(c, i){
        var x = sx(i);
        L.axes.appendChild(el('line', { x1: x, x2: x, y1: base, y2: base + 4, 'class': 'gr-axis' }));
        L.axes.appendChild(el('text', { x: x + 3, y: base + 12, 'text-anchor': 'end', transform: 'rotate(-40 ' + (x + 3) + ' ' + (base + 12) + ')', 'class': 'gr-tick' }, c));
      });
    } else {
      var xf = tickFmt(X.ticks);
      (X.ticks || []).forEach(function(t){
        var x = sx(t);
        L.axes.appendChild(el('line', { x1: x, x2: x, y1: base, y2: base + 4, 'class': 'gr-axis' }));
        L.axes.appendChild(el('text', { x: x, y: base + 17, 'text-anchor': 'middle', 'class': 'gr-tick' }, xf(t)));
      });
    }
    L.axes.appendChild(el('text', { x: ML + PW / 2, y: H - 8, 'text-anchor': 'middle', 'class': 'gr-axis-title' }, X.label + (X.unit ? ' (' + X.unit + ')' : '')));

    // regions shown always, and vertical event lines across every panel
    (g.regions || []).forEach(function(r){ if(r.show) region(L.regions, L.labels, r, 'gr-region-show'); });
    (g.vlines || []).forEach(function(v){
      var x = sx(v.x);
      L.bg.appendChild(el('line', { x1: x, x2: x, y1: MT, y2: plotBottom, 'class': 'gr-vline' }));
      L.labels.appendChild(el('text', { x: x - 4, y: MT + 4, 'text-anchor': 'end', transform: 'rotate(-90 ' + (x - 4) + ' ' + (MT + 4) + ')', 'class': 'gr-vlabel' }, v.label));
    });

    function series(into, labels, k, s){
      var pts = s.pts.map(function(p){ return [sx(p[0]), sy(k, p[1])]; });
      var path = el('path', { d: pathD(pts, s.curve === 'smooth'), 'class': s.cls + ' line gr-line' + (s.dash ? ' gr-dash' : ''), 'clip-path': 'url(#' + clipId + '-' + k + ')', 'data-sid': k + ':' + s.id });
      into.appendChild(path);
      var lbl = null;
      if(s.label && s.labelAt) labels.appendChild(lbl = el('text', { x: sx(s.labelAt[0]), y: sy(k, s.labelAt[1]), 'text-anchor': s.anchor || 'start', 'class': 'gr-lbl gr-c-' + s.cls, 'data-sid': k + ':' + s.id }, s.label));
      return { path: path, label: lbl };
    }
    function hline(into, labels, k, l){
      var x0 = l.x0 != null ? l.x0 : (cats ? -0.5 : X.min), x1 = l.x1 != null ? l.x1 : (cats ? cats.length - 0.5 : X.max);
      var c = l.cls || 'shape';
      into.appendChild(el('line', { x1: sx(x0), x2: sx(x1), y1: sy(k, l.y), y2: sy(k, l.y), 'class': c + ' line gr-hline' + (l.dash ? ' gr-dash' : '') + (l.faint ? ' gr-faint' : '') }));
      labels.appendChild(el('text', { x: sx(l.at != null ? l.at : x0), y: sy(k, l.y) + (l.below ? 14 : -5), 'text-anchor': l.anchor || 'start', 'class': (l.faint ? 'gr-note' : 'gr-lbl gr-c-' + c) }, l.label));
    }
    function mark(into, k, m, cls){
      into.appendChild(el('circle', { cx: sx(m.x), cy: sy(k, m.y), r: 5, 'class': cls }));
      if(m.label) into.appendChild(el('text', { x: sx(m.x) + 8, y: sy(k, m.y) - 7, 'class': 'gr-lbl gr-c-accent' }, m.label));
    }
    function region(into, labels, r, cls){
      var x0 = sx(r.x0), x1 = sx(r.x1);
      into.appendChild(el('rect', { x: x0, y: MT, width: Math.max(2, x1 - x0), height: plotBottom - MT, 'class': cls }));
      if(r.label) labels.appendChild(el('text', { x: (x0 + x1) / 2, y: plotBottom - 6, 'text-anchor': 'middle', 'class': 'gr-rlabel' }, r.label));
    }
    return {
      svg: svg, L: L, sx: sx, sy: sy, tops: tops, hs: hs, plotBottom: plotBottom, H: H, xmin: xmin, xmax: xmax,
      ix: function(px){ return xmin + (px - ML) / PW * (xmax - xmin); },
      iy: function(k, py){ var p = g.panels[k].y, f = (py - tops[k]) / hs[k]; return p.reverse ? p.min + f * (p.max - p.min) : p.max - f * (p.max - p.min); },
      series: series, hline: hline, mark: mark, region: region,
      pathD: pathD, clipId: clipId,
      clear: function(){ ['hl', 'overlay', 'marks'].forEach(function(n){ while(L[n].firstChild) L[n].removeChild(L[n].firstChild); }); (g.panels).forEach(function(p, k){ (p.marks || []).forEach(function(m){ mark(L.marks, k, m, 'gr-mark'); }); }); }
    };
  }

  /* ------------------------------------------------------------- graph view
     One chart, two modes beside it (stacked on a phone): Explore and Quiz.
     #<graph> opens Explore on a graph not yet tried and the quiz otherwise;
     #<graph>/explore and #<graph>/<question> open one or the other. */
  function reduced(){ try{ return window.LevlMotion ? window.LevlMotion.reduced() : window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
  /* Every y where a series crosses x: one for a curve, two or more for a loop
     (a loop is drawn with straight segments, so its crossings are exact). */
  function readAt(s, x){
    var f = GM.seriesFn(s);
    if(f){ var y = f(x); return y == null ? [] : [y]; }
    var out = [];
    for(var i = 1; i < s.pts.length; i++){
      var a = s.pts[i - 1], b = s.pts[i];
      if((x - a[0]) * (x - b[0]) > 0 || a[0] === b[0]) continue;
      var y2 = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      if(!out.some(function(v){ return Math.abs(v - y2) < 1e-6; })) out.push(y2);
    }
    return out.sort(function(p, q){ return q - p; });
  }
  function conditions(g){
    return g.questions.filter(function(q){ return q.type === 'shift' && q.overlay && ((q.overlay.series || []).length || (q.overlay.marks || []).length || (q.overlay.hlines || []).length); });
  }
  function condLabel(q){
    var o = q.overlay, names = [];
    (o.series || []).forEach(function(s){ if(s.label && names.indexOf(s.label) < 0) names.push(s.label); });
    if(!names.length) (o.hlines || []).forEach(function(l){ if(l.label && names.indexOf(l.label) < 0) names.push(l.label); });
    if(!names.length) (o.marks || []).forEach(function(m){ if(m.label) names.push(m.label); });
    var s = names.join(' · ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function showGraph(g, qk, wantMode){
    var idx = DATA.graphs.indexOf(g);
    var next = DATA.graphs[(idx + 1) % DATA.graphs.length];
    var hasRegions = (g.regions || []).some(function(r){ return !r.show && r.x1 - r.x0 > 0; });
    var tried = g.questions.some(function(q){ return status(itemId(g, q)) !== 'new'; });
    var mode = wantMode || (qk != null || tried ? 'quiz' : 'explore');
    var nRight = g.questions.filter(function(q){ return status(itemId(g, q)) === 'right'; }).length;
    app.innerHTML = '<div class="pw gr gr-view">' +
      '<div class="pw-pickhost"></div>' +
      '<h2 class="pw-title" tabindex="-1">' + esc(g.title) + '</h2>' +
      '<p class="anp-small pw-meta">Topic: ' + topicLink(g.topic) + ' · ' + g.questions.length + ' questions</p>' +
      '<p class="pw-intro">' + html(g.intro) + '</p>' +
      '<div class="gr-modes" role="tablist" aria-label="Mode">' +
        '<button type="button" role="tab" class="gr-mode" id="gr-tab-explore" aria-controls="gr-panel" data-m="explore">Explore</button>' +
        '<button type="button" role="tab" class="gr-mode" id="gr-tab-quiz" aria-controls="gr-panel" data-m="quiz">Quiz <span class="gr-mode-n">' + nRight + '/' + g.questions.length + '</span></button>' +
      '</div>' +
      '<div class="gr-layout"><div class="gr-figcol"><figure class="anp-fig gr-fig"></figure>' +
      '<div class="gr-scrub"><label class="gr-scrub-l" for="gr-x">' + esc(g.x.label) + '</label><input type="range" id="gr-x" class="gr-range"></div>' +
      (hasRegions ? '<p class="gr-tools"><button type="button" class="btn-outline gr-toggle" aria-pressed="false">Show phases and regions</button></p>' : '') +
      '</div><div class="gr-qcol" id="gr-panel" role="tabpanel"></div></div>' +
      '<p class="pw-next"><a class="btn-outline" href="#' + esc(next.id) + '">Next graph: ' + esc(next.title) + ' →</a></p></div>';
    addPicker(g);
    var c = chart(g);
    var fig = app.querySelector('.gr-fig');
    fig.appendChild(c.svg);
    var showAll = false;
    var toggle = app.querySelector('.gr-toggle');
    var allLayer = el('g', { 'class': 'gr-all' });
    c.svg.insertBefore(allLayer, c.L.hl);
    if(toggle) toggle.addEventListener('click', function(){
      showAll = !showAll;
      toggle.setAttribute('aria-pressed', String(showAll));
      toggle.textContent = showAll ? 'Hide phases and regions' : 'Show phases and regions';
      while(allLayer.firstChild) allLayer.removeChild(allLayer.firstChild);
      if(showAll) g.regions.forEach(function(r, i){ if(!r.show) c.region(allLayer, allLayer, r, 'gr-region-all' + (i % 2 ? ' alt' : '')); });
    });
    var panelEl = app.querySelector('#gr-panel');
    var cats = g.x.cats, unitY = function(k){ return g.panels[k].y.unit || ''; };
    function xText(x){ return cats ? cats[Math.round(x)] : fmt(x) + unitText(g.x.unit); }

    /* ---- the cursor: drag on the chart, or the slider under it */
    var range = app.querySelector('#gr-x'), cursorX = null, cursorOn = false, onCursor = null;
    var span = c.xmax - c.xmin, stepX = cats ? 1 : niceStep(span / 200);
    range.min = cats ? 0 : g.x.min; range.max = cats ? cats.length - 1 : g.x.max; range.step = stepX;
    function niceStep(v){ var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10)), m = v / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
    function snap(x){ var lo = +range.min, hi = +range.max; x = Math.min(hi, Math.max(lo, x)); return cats ? Math.round(x) : Math.round((x - lo) / stepX) * stepX + lo; }
    function drawCursor(){
      var L = c.L.cursor;
      while(L.firstChild) L.removeChild(L.firstChild);
      if(!cursorOn || cursorX == null) return;
      var px = c.sx(cursorX);
      L.appendChild(el('line', { x1: px, x2: px, y1: MT - 4, y2: c.plotBottom, 'class': 'gr-cur-line' }));
      g.panels.forEach(function(p, k){
        visibleSeries(k).forEach(function(s){
          readAt(s, cursorX).forEach(function(y){
            if(y < Math.min(p.y.min, p.y.max) - 1e-9 || y > Math.max(p.y.min, p.y.max) + 1e-9) return;
            L.appendChild(el('circle', { cx: px, cy: c.sy(k, y), r: 4.5, 'class': 'gr-cur-dot gr-dot-' + s.cls }));
          });
        });
      });
      var tx = Math.min(W - MR - 4, Math.max(ML + 4, px));
      var tag = el('text', { x: tx, y: c.plotBottom + (cats ? 0 : 0) - 6, 'text-anchor': px > W - MR - 50 ? 'end' : px < ML + 50 ? 'start' : 'middle', 'class': 'gr-cur-tag' }, xText(cursorX));
      L.appendChild(tag);
      L.appendChild(el('rect', { x: px - 9, y: MT - 12, width: 18, height: 12, rx: 6, 'class': 'gr-cur-grip' }));
    }
    function setCursor(x, from){
      cursorX = snap(x); cursorOn = true;
      if(from !== 'range') range.value = cursorX;
      range.setAttribute('aria-valuetext', xText(cursorX));
      drawCursor();
      if(onCursor) onCursor(cursorX);
    }
    range.addEventListener('input', function(){ setCursor(+range.value, 'range'); });
    var dragging = false;
    function evX(e){ var r = c.svg.getBoundingClientRect(); return c.ix((e.clientX - r.left) * (W / r.width)); }
    c.svg.addEventListener('pointerdown', function(e){
      if(mode !== 'explore' || e.target.closest('.gr-ghost-hit')) return;
      dragging = true; try{ c.svg.setPointerCapture(e.pointerId); }catch(er){}
      setCursor(evX(e));
    });
    c.svg.addEventListener('pointermove', function(e){ if(dragging) setCursor(evX(e)); });
    ['pointerup', 'pointercancel'].forEach(function(n){ c.svg.addEventListener(n, function(){ dragging = false; }); });

    /* ---- which series are drawn now (a condition swaps its base series) */
    var active = null;   // the shift question shown as a condition in Explore
    function visibleSeries(k){
      var list = (g.panels[k].series || []).slice();
      if(active){
        (active.overlay.series || []).forEach(function(os){ if((os.panel || 0) === k) list.push(os); });
      }
      return list;
    }

    /* ---- tabs */
    var tabs = app.querySelectorAll('.gr-mode');
    function setMode(m, focus){
      mode = m;
      tabs.forEach(function(b){ var on = b.getAttribute('data-m') === m; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if(on && focus) b.focus(); });
      panelEl.setAttribute('aria-labelledby', 'gr-tab-' + m);
      fig.classList.toggle('is-explore', m === 'explore');
      c.clear(); clearCond(true);
      if(m === 'explore') explore(); else { cursorOn = false; drawCursor(); quiz(); }
    }
    tabs.forEach(function(b, i){
      b.addEventListener('click', function(){ if(b.getAttribute('data-m') !== mode){ history.replaceState(null, '', '#' + g.id + (b.getAttribute('data-m') === 'explore' ? '/explore' : '')); setMode(b.getAttribute('data-m')); } });
      b.addEventListener('keydown', function(e){
        if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault(); var o = tabs[1 - i]; o.click(); o.focus();
      });
    });

    /* ---- Explore */
    var condLayer = null, animId = 0;
    function clearCond(silent){
      active = null; animId++;
      if(condLayer && condLayer.parentNode) condLayer.parentNode.removeChild(condLayer);
      condLayer = null;
      c.svg.querySelectorAll('.gr-before').forEach(function(x){ x.classList.remove('gr-before'); });
      if(!silent) drawCursor();
    }
    function showCond(q){
      clearCond(true);
      active = q;
      condLayer = el('g', { 'class': 'gr-cond' });
      c.svg.insertBefore(condLayer, c.L.labels);
      var o = q.overlay, my = ++animId;
      (o.hlines || []).forEach(function(l){ c.hline(condLayer, condLayer, l.panel || 0, l); });
      (o.marks || []).forEach(function(m){ c.mark(condLayer, m.panel || 0, m, 'gr-qmark'); });
      (o.series || []).forEach(function(os){
        var k = os.panel || 0, base = GM.pairOf(g, os);
        if(base) c.svg.querySelectorAll('[data-sid="' + k + ':' + base.id + '"]').forEach(function(x){ x.classList.add('gr-before'); });
        morph(condLayer, k, base, os, my);
      });
      drawCursor();
    }
    /* The base curve slides into the shifted one: both are sampled on the x
       range they share and blended over 0.7 s, then the real shifted curve
       is drawn from its own points. Reduced motion: the end state at once. */
    function morph(into, k, base, os, my){
      var fb = base && GM.seriesFn(base), fo = GM.seriesFn(os);
      function finish(tmp){ if(my !== animId) return; if(tmp && tmp.parentNode) tmp.parentNode.removeChild(tmp); var d = c.series(into, into, k, os); if(d.path) d.path.classList.add('gr-shifted'); }
      if(!fb || !fo || reduced()) return finish(null);
      var x0 = Math.max(base.pts[0][0], os.pts[0][0]), x1 = Math.min(base.pts[base.pts.length - 1][0], os.pts[os.pts.length - 1][0]);
      if(!(x1 > x0)) return finish(null);
      var N = 60, xs = [];
      for(var i = 0; i <= N; i++) xs.push(x0 + (x1 - x0) * i / N);
      var tmp = el('path', { 'class': os.cls + ' line gr-line gr-dash gr-moving', 'clip-path': 'url(#' + c.clipId + '-' + k + ')' });
      into.appendChild(tmp);
      var t0 = null;
      function frame(ts){
        if(my !== animId){ if(tmp.parentNode) tmp.parentNode.removeChild(tmp); return; }
        if(t0 == null) t0 = ts;
        var u = Math.min(1, (ts - t0) / 700), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        tmp.setAttribute('d', c.pathD(xs.map(function(x){ return [c.sx(x), c.sy(k, fb(x) + (fo(x) - fb(x)) * e)]; }), false));
        if(u < 1) requestAnimationFrame(frame); else finish(tmp);
      }
      requestAnimationFrame(frame);
    }
    function explore(){
      var conds = conditions(g);
      panelEl.innerHTML = '<div class="gr-ex">' +
        '<p class="gr-kind">Explore · drag along the graph</p>' +
        '<div class="gr-read" aria-live="polite"></div>' +
        (conds.length ? '<h3 class="gr-ex-h">What if…</h3><div class="gr-conds" role="group" aria-label="Conditions that shift the curve">' + conds.map(function(q, i){
          return '<button type="button" class="gr-cond-b" aria-pressed="false" data-i="' + i + '">' + esc(condLabel(q)) + '</button>';
        }).join('') + '</div><div class="gr-cond-why" aria-live="polite"></div>' : '<p class="anp-small gr-ex-none">This graph has no shift conditions; read it along x, then try the quiz.</p>') +
        '<p class="gr-ex-go"><button type="button" class="btn-press sm gr-to-quiz">Quiz me on this graph →</button></p>' +
        '</div>';
      var readEl = panelEl.querySelector('.gr-read'), whyEl = panelEl.querySelector('.gr-cond-why'), timer = 0;
      function readout(x){
        var rows = [];
        g.panels.forEach(function(p, k){
          var u = unitY(k);
          visibleSeries(k).forEach(function(s){
            if(active && (active.overlay.series || []).indexOf(s) > -1) return;
            var ys = readAt(s, x), shifted = null;
            if(active) (active.overlay.series || []).forEach(function(os){ if((os.panel || 0) === k && GM.pairOf(g, os) === s) shifted = os; });
            var v = ys.length ? ys.map(function(y){ return fmt(y); }).join(' and ') + unitText(u) : '<span class="gr-na">not on the graph here</span>';
            var row = '<li><span class="gr-sw gr-sw-' + esc(s.cls) + '" aria-hidden="true"></span><span class="gr-rl">' + esc(s.label || p.y.label) + '</span><b class="gr-rv">' + v + '</b>';
            if(shifted){
              var ns = readAt(shifted, x);
              var nv = ns.length ? ns.map(function(y){ return fmt(y); }).join(' and ') + unitText(u) : '—';
              var dl = ys.length === 1 && ns.length === 1 ? ns[0] - ys[0] : null;
              row += '<span class="gr-rnew"><span class="gr-sw gr-sw-dash gr-sw-' + esc(shifted.cls) + '" aria-hidden="true"></span>' + esc(shifted.label) + ': <b>' + nv + '</b>' +
                (dl != null && Math.abs(dl) > 1e-9 ? ' <span class="gr-delta ' + (dl > 0 ? 'up' : 'down') + '">' + (dl > 0 ? '+' : '') + fmt(dl) + '</span>' : '') + '</span>';
            }
            rows.push(row + '</li>');
          });
          if(active) (active.overlay.series || []).forEach(function(os){
            if((os.panel || 0) !== k || GM.pairOf(g, os)) return;
            var ns = readAt(os, x);
            rows.push('<li><span class="gr-sw gr-sw-dash gr-sw-' + esc(os.cls) + '" aria-hidden="true"></span><span class="gr-rl">' + esc(os.label) + '</span><b class="gr-rv">' + (ns.length ? ns.map(function(y){ return fmt(y); }).join(' and ') + unitText(u) : '—') + '</b></li>');
          });
        });
        var where = (g.regions || []).filter(function(r){ return r.label && x >= r.x0 - 1e-9 && x <= r.x1 + 1e-9; }).map(function(r){ return r.label; });
        readEl.innerHTML = '<p class="gr-at"><span class="anp-small">At ' + esc(g.x.label) + '</span> <b>' + esc(xText(x)) + '</b>' +
          (where.length ? ' <span class="gr-where">' + esc(where.join(' · ')) + '</span>' : '') + '</p><ul class="gr-rows">' + rows.join('') + '</ul>';
        clearTimeout(timer);
      }
      onCursor = readout;
      var start = startX();
      setCursor(start);
      panelEl.querySelectorAll('.gr-cond-b').forEach(function(b){
        b.addEventListener('click', function(){
          var q = conds[+b.getAttribute('data-i')], on = b.getAttribute('aria-pressed') !== 'true';
          panelEl.querySelectorAll('.gr-cond-b').forEach(function(x){ x.setAttribute('aria-pressed', 'false'); });
          if(on){
            b.setAttribute('aria-pressed', 'true');
            showCond(q);
            var at = keyX(q);
            if(at != null) setCursor(at); else readout(cursorX);
            whyEl.innerHTML = '<p class="gr-why-q">' + html(q.q) + '</p><p>' + html(q.why.correct) + '</p>';
          } else { clearCond(); readout(cursorX); whyEl.innerHTML = ''; }
        });
      });
      panelEl.querySelector('.gr-to-quiz').addEventListener('click', function(){ history.replaceState(null, '', '#' + g.id); setMode('quiz', true); });
    }
    /* Where to park the cursor: the first value question's x (a reading the
       graph is about), else the middle of the axis. */
    function startX(){
      for(var i = 0; i < g.questions.length; i++){ var s = g.questions[i].show; if(s && s.x != null) return s.x; }
      var m = (g.panels[0].marks || [])[0]; if(m) return m.x;
      return cats ? Math.floor((cats.length - 1) / 2) : (g.x.min + g.x.max) / 2;
    }
    /* For a condition, the x where the shift shows best: where base and
       shifted curves differ most (sampled), so the readout shows the change. */
    function keyX(q){
      var best = null, bd = 0;
      (q.overlay.series || []).forEach(function(os){
        var b = GM.pairOf(g, os), fb = b && GM.seriesFn(b), fo = GM.seriesFn(os);
        if(!fb || !fo) return;
        var x0 = Math.max(b.pts[0][0], os.pts[0][0]), x1 = Math.min(b.pts[b.pts.length - 1][0], os.pts[os.pts.length - 1][0]);
        var p = g.panels[os.panel || 0].y, scale = Math.abs(p.max - p.min) || 1;
        for(var i = 0; i <= 40; i++){ var x = x0 + (x1 - x0) * i / 40, d = Math.abs(fo(x) - fb(x)) / scale; if(d > bd + 1e-9){ bd = d; best = x; } }
      });
      if(best == null){ var m = (q.overlay.marks || [])[0]; if(m) best = m.x; }
      return best == null ? null : snap(best);
    }

    /* ---- Quiz */
    var nav = null;
    function quiz(){
      panelEl.innerHTML = '<div class="gr-qnav" role="group" aria-label="Questions"></div><div class="gr-q"></div>';
      nav = panelEl.querySelector('.gr-qnav');
      onCursor = null;
      ask(Math.min(qk != null ? qk : firstOpen(g), g.questions.length - 1), false);
    }
    function paintNav(active){
      nav.innerHTML = g.questions.map(function(q, i){
        var s = status(itemId(g, q));
        return '<button type="button" class="gr-qbtn is-' + s + '" aria-current="' + (i === active ? 'step' : 'false') + '" data-i="' + i + '" aria-label="Question ' + (i + 1) + (s === 'right' ? ', answered right' : s === 'missed' ? ', missed' : '') + '">' + (i + 1) + '</button>';
      }).join('');
      nav.querySelectorAll('.gr-qbtn').forEach(function(b){ b.addEventListener('click', function(){ ask(+b.getAttribute('data-i'), true); }); });
      var n = g.questions.filter(function(q){ return status(itemId(g, q)) === 'right'; }).length, t = app.querySelector('.gr-mode-n');
      if(t) t.textContent = n + '/' + g.questions.length;
    }
    function ask(i, focus){
      var q = g.questions[i];
      qk = i;
      history.replaceState(null, '', '#' + g.id + '/' + q.id);
      paintNav(i);
      c.clear(); dropGhost();
      if(q.marker) c.mark(c.L.marks, q.marker.panel || 0, q.marker, 'gr-qmark');
      var box = panelEl.querySelector('.gr-q');
      var place = GM.placeable(g, q);
      var kind = q.type === 'value' ? 'Read a value' : q.type === 'phase' ? 'Name the phase or region' : place ? 'Place the shifted curve' : 'Predict the shift';
      box.innerHTML = '<p class="gr-kind">Question ' + (i + 1) + ' of ' + g.questions.length + ' · ' + kind + '</p>' +
        '<p class="gr-stem" tabindex="-1">' + html(q.q) + '</p><div class="gr-body"></div><div class="gr-feedback" aria-live="polite"></div><div class="pw-actions gr-actions"></div>';
      var body = box.querySelector('.gr-body'), fb = box.querySelector('.gr-feedback'), actions = box.querySelector('.gr-actions');
      function after(correct){
        var first = score(g, q, correct);
        paintNav(i);
        actions.innerHTML = (i < g.questions.length - 1 ? '<button type="button" class="btn-press sm gr-next">Next question →</button>' : '<a class="btn-press sm" href="#' + esc(next.id) + '">Next graph →</a>') + report(itemId(g, q));
        if(window.AnpToolKit) window.AnpToolKit.strip(box, { topic: q.topic || g.topic, text: g.title + ' ' + g.intro + ' ' + q.q });
        var nb = actions.querySelector('.gr-next');
        if(nb) nb.addEventListener('click', function(){ ask(i + 1, true); });
        return first;
      }
      if(q.type === 'value'){
        var inputId = 'gr-in-' + q.id;
        body.innerHTML = '<form class="gr-value" novalidate><label for="' + inputId + '" class="sr-only">Your reading</label>' +
          '<input id="' + inputId + '" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" class="gr-input" placeholder="Your reading">' +
          (q.unit ? '<span class="gr-unit">' + esc(q.unit) + '</span>' : '') +
          '<button type="submit" class="btn-press sm">Check</button></form><p class="gr-hint anp-small" aria-live="polite"></p>';
        var form = body.querySelector('form'), input = body.querySelector('input');
        form.addEventListener('submit', function(e){
          e.preventDefault();
          if(form.getAttribute('data-done')) return;
          var raw = input.value.replace(/[−–]/g, '-').replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
          var v = parseFloat(raw);
          if(!isFinite(v)){ body.querySelector('.gr-hint').textContent = 'Type a number, for example ' + fmt(q.answer > 0 ? Math.round(q.answer * 1.3) : q.answer - 5) + '.'; input.focus(); return; }
          form.setAttribute('data-done', '1');
          input.disabled = true; form.querySelector('button').disabled = true;
          var ok = Math.abs(v - q.answer) <= q.tol + 1e-9;
          input.classList.add(ok ? 'is-right' : 'is-wrong');
          var first = after(ok);
          fb.innerHTML = verdict(ok, first) + '<p>' + (ok ? 'You read ' + fmt(v) + unitText(q.unit) + '; the graph reads about ' : 'You read ' + fmt(v) + unitText(q.unit) + '. The graph reads about ') +
            '<b>' + fmt(q.answer) + unitText(q.unit) + '</b> (anything within ' + fmt(q.tol) + ' counts). ' + html(q.why) + '</p>';
          if(q.show){
            var k = q.show.panel || 0, x = c.sx(q.show.x), y = c.sy(k, q.show.y);
            var base = c.tops[k] + c.hs[k];
            c.L.hl.appendChild(el('path', { d: 'M' + x + ',' + base + ' L' + x + ',' + y + ' L' + ML + ',' + y, 'class': 'gr-guide' }));
            c.L.hl.appendChild(el('circle', { cx: x, cy: y, r: 5.5, 'class': 'gr-qmark' }));
            var lx = x + 9, anchor = 'start';
            if(lx > W - MR - 70){ lx = x - 9; anchor = 'end'; }
            c.L.hl.appendChild(el('text', { x: lx, y: y - 9, 'text-anchor': anchor, 'class': 'gr-lbl gr-c-accent' }, fmt(q.answer) + unitText(q.unit)));
          }
          fb.setAttribute('tabindex', '-1'); fb.focus();
        });
        if(focus) input.focus();
        return;
      }
      var items = shuffle(q.options.map(function(o, j){ return { o: o, j: j }; }));
      body.innerHTML = (place ? placeHtml(place) : '') +
        '<div class="anp-opt-btns" role="group" aria-label="Answer options">' + items.map(function(it){ return '<button type="button" class="anp-opt" data-j="' + it.j + '">' + html(it.o) + '</button>'; }).join('') + '</div>';
      function answer(pick, how){
        if(body.getAttribute('data-done')) return;
        body.setAttribute('data-done', '1');
        var ok = pick === q.correct;
        body.querySelectorAll('.anp-opt').forEach(function(x){
          var j = +x.getAttribute('data-j');
          x.disabled = true;
          if(j === q.correct) x.classList.add('is-right'); else if(j === pick) x.classList.add('is-wrong');
          if(q.why.options[j]) x.insertAdjacentHTML('beforeend', '<span class="anp-opt-why">' + html(q.why.options[j]) + '</span>');
        });
        body.querySelectorAll('.gr-place button').forEach(function(x){ x.disabled = true; });
        var first = after(ok);
        fb.innerHTML = verdict(ok, first) + (how ? '<p class="gr-how">' + how + '</p>' : '') + '<p>' + html(q.why.correct) + '</p>';
        if(q.type === 'phase') highlight(q.highlight);
        else if(place) settleGhost(place, q);
        else overlay(q.overlay);
        fb.setAttribute('tabindex', '-1'); fb.focus();
      }
      body.querySelectorAll('.anp-opt').forEach(function(b){
        b.addEventListener('click', function(){ answer(+b.getAttribute('data-j')); });
      });
      if(place) wirePlace(place, body, function(d){
        var r = GM.pickByDrag(place.dirs, d === 'left' ? -99 : d === 'right' ? 99 : 0, d === 'up' ? -99 : d === 'down' ? 99 : 0);
        var said = d === 'none' ? 'You left the curve where it was.' : 'You moved the curve ' + d + '.';
        if(r.i < 0) said += ' None of the answers moves it that way.';
        answer(r.i, said);
      });
      if(focus){ var s = box.querySelector('.gr-stem'); if(s) s.focus(); }
    }

    /* ---- placing a curve: a dashed copy of the curve to drag (or arrow
       buttons, or the keyboard). On release the drag's main direction is the
       answer; then the copy glides to where the curve really goes. */
    var ghost = null;
    function dropGhost(){ if(ghost && ghost.g.parentNode) ghost.g.parentNode.removeChild(ghost.g); ghost = null; }
    function placeHtml(pl){
      var has = {}; pl.dirs.forEach(function(ds){ ds.forEach(function(d){ has[d] = 1; }); });
      var b = function(d, sym, word){ return has[d] ? '<button type="button" class="gr-pbtn" data-d="' + d + '" aria-label="Move the curve ' + word + '">' + sym + '</button>' : ''; };
      return '<div class="gr-place"><p class="gr-place-t"><b>Drag the dashed copy</b> of the curve where it will go, or use these:</p>' +
        '<div class="gr-pbtns" role="group" aria-label="Move the curve">' + b('left', '←', 'left') + b('up', '↑', 'up') + b('down', '↓', 'down') + b('right', '→', 'right') +
        (has.none ? '<button type="button" class="gr-pbtn gr-pnone" data-d="none">Stays put</button>' : '') + '</div>' +
        '<p class="gr-or anp-small">or choose an answer:</p></div>';
    }
    function wirePlace(pl, body, done){
      dropGhost();
      var k = pl.k, s = pl.base;
      var gg = el('g', { 'class': 'gr-ghost', 'clip-path': 'url(#' + c.clipId + '-' + k + ')' });
      var pts = s.pts.map(function(p){ return [c.sx(p[0]), c.sy(k, p[1])]; });
      var d = c.pathD(pts, s.curve === 'smooth');
      var line = el('path', { d: d, 'class': 'gr-ghost-line' });
      var hit = el('path', { d: d, 'class': 'gr-ghost-hit', tabindex: '0', role: 'button', 'aria-label': 'Copy of the curve. Drag it, or use the arrow keys, to show where the curve goes.' });
      gg.appendChild(line); gg.appendChild(hit);
      c.svg.insertBefore(gg, c.L.cursor);
      ghost = { g: gg, line: line, hit: hit, dx: 0, dy: 0, done: false };
      var start = null, scale = 1;
      function move(dx, dy){ ghost.dx = dx; ghost.dy = dy; line.setAttribute('transform', 'translate(' + dx + ',' + dy + ')'); hit.setAttribute('transform', 'translate(' + dx + ',' + dy + ')'); }
      function commit(){
        if(ghost.done) return;
        var r = GM.pickByDrag(pl.dirs, ghost.dx, ghost.dy, 14);
        if(ghost.dx === 0 && ghost.dy === 0) return;
        ghost.done = true;
        done(r.dir);
      }
      hit.addEventListener('pointerdown', function(e){
        if(ghost.done) return;
        e.preventDefault();
        var r = c.svg.getBoundingClientRect(); scale = W / r.width;
        start = { x: e.clientX, y: e.clientY };
        try{ hit.setPointerCapture(e.pointerId); }catch(er){}
        gg.classList.add('is-drag');
      });
      hit.addEventListener('pointermove', function(e){ if(start) move((e.clientX - start.x) * scale, (e.clientY - start.y) * scale); });
      hit.addEventListener('pointerup', function(){ if(!start) return; start = null; gg.classList.remove('is-drag'); if(Math.max(Math.abs(ghost.dx), Math.abs(ghost.dy)) < 14){ move(0, 0); return; } commit(); });
      hit.addEventListener('pointercancel', function(){ start = null; move(0, 0); gg.classList.remove('is-drag'); });
      hit.addEventListener('keydown', function(e){
        var m = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
        if(!m || ghost.done) return;
        e.preventDefault(); nudge(m);
      });
      function nudge(dir){
        if(dir === 'none'){ ghost.done = true; done('none'); return; }
        move(dir === 'left' ? -28 : dir === 'right' ? 28 : 0, dir === 'up' ? -28 : dir === 'down' ? 28 : 0);
        ghost.done = true; done(dir);
      }
      body.querySelectorAll('.gr-pbtn').forEach(function(b){ b.addEventListener('click', function(){ if(!ghost.done) nudge(b.getAttribute('data-d')); }); });
    }
    /* After the answer: the copy glides to the real shifted curve. */
    function settleGhost(pl, q){
      var os = pl.over, k = pl.k;
      if(ghost){
        ghost.hit.removeAttribute('tabindex');
        var line = ghost.line, from = { dx: ghost.dx, dy: ghost.dy };
        var fb = GM.seriesFn(pl.base), fo = GM.seriesFn(os);
        var x0 = Math.max(pl.base.pts[0][0], os.pts[0][0]), x1 = Math.min(pl.base.pts[pl.base.pts.length - 1][0], os.pts[os.pts.length - 1][0]);
        var N = 60, xs = [];
        for(var i = 0; i <= N; i++) xs.push(x0 + (x1 - x0) * i / N);
        var my = ++animId;
        var end = function(){ if(ghost && ghost.g.parentNode) ghost.g.parentNode.removeChild(ghost.g); ghost = null; overlay(q.overlay); };
        if(reduced() || !(x1 > x0)) return end();
        var t0 = null;
        requestAnimationFrame(function frame(ts){
          if(my !== animId) return;
          if(t0 == null) t0 = ts;
          var u = Math.min(1, (ts - t0) / 750), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          line.setAttribute('transform', 'translate(' + from.dx * (1 - e) + ',' + from.dy * (1 - e) + ')');
          line.setAttribute('d', c.pathD(xs.map(function(x){ return [c.sx(x), c.sy(k, fb(x) + (fo(x) - fb(x)) * e)]; }), false));
          if(u < 1) requestAnimationFrame(frame); else end();
        });
      } else overlay(q.overlay);
    }
    function highlight(h){
      if(!h) return;
      if(h.region){ var r = null; g.regions.forEach(function(x){ if(x.id === h.region) r = x; }); if(r) c.region(c.L.hl, c.L.hl, r, 'gr-region-hl'); }
      else if(h.x0 != null) c.region(c.L.hl, c.L.hl, { x0: h.x0, x1: h.x1, label: h.label }, 'gr-region-hl');
      else if(h.y0 != null){
        var k = h.panel || 0, y1 = c.sy(k, h.y1), y0 = c.sy(k, h.y0);
        c.L.hl.appendChild(el('rect', { x: ML, y: Math.min(y1, y0), width: W - ML - MR, height: Math.abs(y0 - y1), 'class': 'gr-region-hl' }));
        if(h.label) c.L.hl.appendChild(el('text', { x: W - MR - 4, y: y0 - 5, 'text-anchor': 'end', 'class': 'gr-rlabel' }, h.label));
      } else if(h.path){
        var k2 = h.panel || 0;
        var pts = h.path.map(function(p){ return [c.sx(p[0]), c.sy(k2, p[1])]; });
        c.L.hl.appendChild(el('path', { d: pathD(pts, false), 'class': 'gr-path-hl' }));
        if(h.label){ var m = pts[Math.floor(pts.length / 2)]; c.L.hl.appendChild(el('text', { x: m[0] - 10, y: m[1], 'text-anchor': 'end', 'class': 'gr-lbl gr-c-accent' }, h.label)); }
      }
    }
    function overlay(o){
      if(!o) return;
      (o.series || []).forEach(function(s){ c.series(c.L.overlay, c.L.overlay, s.panel || 0, s); });
      (o.hlines || []).forEach(function(l){ c.hline(c.L.overlay, c.L.overlay, l.panel || 0, l); });
      (o.marks || []).forEach(function(m){ c.mark(c.L.overlay, m.panel || 0, m, 'gr-qmark'); });
    }
    setMode(mode, false);
    if(booted){ var h = app.querySelector('.pw-title'); if(h) h.focus(); }
  }

  function verdict(ok, first){
    return '<p class="pw-verdict ' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? 'Correct.' : 'Not quite.') + '</b> ' +
      (first ? (ok ? '' : 'Added to your review queue.') : '<span class="anp-small">Already scored this visit.</span>') + '</p>';
  }
  function score(g, q, correct){
    var id = itemId(g, q);
    if(scored[id]) return false;
    scored[id] = true;
    if(window.AnpCore){
      window.AnpCore.toolResult('graphs', [{ id: id, correct: !!correct, topic: q.topic || g.topic, core: q.core || g.core, level: q.level, diff: q.diff, group: chapterOf(g) }]);
      window.AnpCore.event('anp-graph-answer', { graph: g.id, correct: !!correct });
    }
    if(window.LevlSound && window.LevlSound.answer) try{ window.LevlSound.answer(!!correct); }catch(e){}
    return true;
  }

  /* ------------------------------------------------------------------ boot */
  function fail(msg){ app.innerHTML = '<p class="pw-error">' + esc(msg) + '</p>'; }
  var src = app.getAttribute('data-src');
  if(!src){ fail('No content file for this tool.'); return; }
  fetch(src).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
    DATA = d;
    DATA.graphs = (DATA.graphs || []).filter(function(g){ return g && g.panels && g.questions && g.questions.length; });
    if(window.AnpCore && window.AnpCore.allowed && !window.AnpCore.allowed('graphs')){ fail('This tool is not available right now.'); return; }
    window.addEventListener('hashchange', route);
    route();
    booted = true;
    app.classList.add('is-ready');
  }).catch(function(){ fail('The graphs could not be loaded. Check your connection and reload the page.'); });
})();
