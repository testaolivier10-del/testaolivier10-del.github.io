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
   anp-graph-answer. */
(function(){
  var app = document.getElementById('app');
  if(!app) return;
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
      var k = 0;
      if(h[1]) g.questions.forEach(function(q, i){ if(q.id === h[1]) k = i; });
      showGraph(g, k);
    } else showList();
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
  }

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
    function sy(k, v){ var p = g.panels[k].y; return tops[k] + hs[k] - (v - p.min) / (p.max - p.min) * hs[k]; }
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': g.alt, 'class': 'gr-svg' });
    var L = {};
    ['bg', 'regions', 'hl', 'axes', 'series', 'overlay', 'labels', 'marks'].forEach(function(n){ L[n] = el('g', { 'class': 'gr-' + n }); svg.appendChild(L[n]); });
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
        L.bg.appendChild(el('rect', { x: ML, width: PW, y: sy(k, b.y1), height: sy(k, b.y0) - sy(k, b.y1), 'class': 'gr-band' }));
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
      into.appendChild(el('path', { d: pathD(pts, s.curve === 'smooth'), 'class': s.cls + ' line gr-line' + (s.dash ? ' gr-dash' : ''), 'clip-path': 'url(#' + clipId + '-' + k + ')' }));
      if(s.label && s.labelAt) labels.appendChild(el('text', { x: sx(s.labelAt[0]), y: sy(k, s.labelAt[1]), 'text-anchor': s.anchor || 'start', 'class': 'gr-lbl gr-c-' + s.cls }, s.label));
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
      svg: svg, L: L, sx: sx, sy: sy, tops: tops, hs: hs, plotBottom: plotBottom,
      series: series, hline: hline, mark: mark, region: region,
      clear: function(){ ['hl', 'overlay', 'marks'].forEach(function(n){ while(L[n].firstChild) L[n].removeChild(L[n].firstChild); }); (g.panels).forEach(function(p, k){ (p.marks || []).forEach(function(m){ mark(L.marks, k, m, 'gr-mark'); }); }); }
    };
  }

  /* ------------------------------------------------------------- graph view */
  function showGraph(g, qk){
    var t = topicInfo(g.topic);
    var idx = DATA.graphs.indexOf(g);
    var next = DATA.graphs[(idx + 1) % DATA.graphs.length];
    var hasRegions = (g.regions || []).some(function(r){ return !r.show && r.x1 - r.x0 > 0; });
    app.innerHTML = '<div class="pw gr gr-view">' +
      '<p class="pw-back"><a href="#">← All graphs</a></p>' +
      '<h2 class="pw-title" tabindex="-1">' + esc(g.title) + '</h2>' +
      '<p class="anp-small pw-meta">Topic: ' + topicLink(g.topic) + ' · ' + g.questions.length + ' questions</p>' +
      '<p class="pw-intro">' + html(g.intro) + '</p>' +
      '<div class="gr-layout"><div class="gr-figcol"><figure class="anp-fig gr-fig"></figure>' +
      (hasRegions ? '<p class="gr-tools"><button type="button" class="btn-outline gr-toggle" aria-pressed="false">Show phases and regions</button></p>' : '') +
      '</div><div class="gr-qcol"><div class="gr-qnav" role="group" aria-label="Questions"></div><div class="gr-q"></div></div></div>' +
      '<p class="pw-next"><a class="btn-outline" href="#' + esc(next.id) + '">Next graph: ' + esc(next.title) + ' →</a></p></div>';
    var c = chart(g);
    app.querySelector('.gr-fig').appendChild(c.svg);
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
    var nav = app.querySelector('.gr-qnav');
    function paintNav(active){
      nav.innerHTML = g.questions.map(function(q, i){
        var s = status(itemId(g, q));
        return '<button type="button" class="gr-qbtn is-' + s + '" aria-current="' + (i === active ? 'step' : 'false') + '" data-i="' + i + '" aria-label="Question ' + (i + 1) + (s === 'right' ? ', answered right' : s === 'missed' ? ', missed' : '') + '">' + (i + 1) + '</button>';
      }).join('');
      nav.querySelectorAll('.gr-qbtn').forEach(function(b){ b.addEventListener('click', function(){ ask(+b.getAttribute('data-i'), true); }); });
    }
    function ask(i, focus){
      var q = g.questions[i];
      history.replaceState(null, '', '#' + g.id + '/' + q.id);
      paintNav(i);
      c.clear();
      if(q.marker) c.mark(c.L.marks, q.marker.panel || 0, q.marker, 'gr-qmark');
      var box = app.querySelector('.gr-q');
      var kind = q.type === 'value' ? 'Read a value' : q.type === 'phase' ? 'Name the phase or region' : 'Predict the shift';
      box.innerHTML = '<p class="gr-kind">Question ' + (i + 1) + ' of ' + g.questions.length + ' · ' + kind + '</p>' +
        '<p class="gr-stem" tabindex="-1">' + html(q.q) + '</p><div class="gr-body"></div><div class="gr-feedback" aria-live="polite"></div><div class="pw-actions gr-actions"></div>';
      var body = box.querySelector('.gr-body'), fb = box.querySelector('.gr-feedback'), actions = box.querySelector('.gr-actions');
      function after(correct){
        var first = score(g, q, correct);
        paintNav(i);
        actions.innerHTML = (i < g.questions.length - 1 ? '<button type="button" class="btn-press sm gr-next">Next question →</button>' : '<a class="btn-press sm" href="#' + esc(next.id) + '">Next graph →</a>') + report(itemId(g, q));
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
            var pa = g.panels[k];
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
      } else {
        var items = shuffle(q.options.map(function(o, j){ return { o: o, j: j }; }));
        body.innerHTML = '<div class="anp-opt-btns" role="group" aria-label="Answer options">' + items.map(function(it){ return '<button type="button" class="anp-opt" data-j="' + it.j + '">' + html(it.o) + '</button>'; }).join('') + '</div>';
        body.querySelectorAll('.anp-opt').forEach(function(b){
          b.addEventListener('click', function(){
            if(body.getAttribute('data-done')) return;
            body.setAttribute('data-done', '1');
            var pick = +b.getAttribute('data-j'), ok = pick === q.correct;
            body.querySelectorAll('.anp-opt').forEach(function(x){
              var j = +x.getAttribute('data-j');
              x.disabled = true;
              if(j === q.correct) x.classList.add('is-right'); else if(j === pick) x.classList.add('is-wrong');
              if(q.why.options[j]) x.insertAdjacentHTML('beforeend', '<span class="anp-opt-why">' + html(q.why.options[j]) + '</span>');
            });
            var first = after(ok);
            fb.innerHTML = verdict(ok, first) + '<p>' + html(q.why.correct) + '</p>';
            if(q.type === 'phase') highlight(q.highlight);
            else overlay(q.overlay);
            fb.setAttribute('tabindex', '-1'); fb.focus();
          });
        });
        if(focus){ var s = box.querySelector('.gr-stem'); if(s) s.focus(); }
      }
    }
    function highlight(h){
      if(!h) return;
      if(h.region){ var r = null; g.regions.forEach(function(x){ if(x.id === h.region) r = x; }); if(r) c.region(c.L.hl, c.L.hl, r, 'gr-region-hl'); }
      else if(h.x0 != null) c.region(c.L.hl, c.L.hl, { x0: h.x0, x1: h.x1, label: h.label }, 'gr-region-hl');
      else if(h.y0 != null){
        var k = h.panel || 0, y1 = c.sy(k, h.y1), y0 = c.sy(k, h.y0);
        c.L.hl.appendChild(el('rect', { x: ML, y: y1, width: W - ML - MR, height: y0 - y1, 'class': 'gr-region-hl' }));
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
    ask(Math.min(qk || 0, g.questions.length - 1), false);
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
