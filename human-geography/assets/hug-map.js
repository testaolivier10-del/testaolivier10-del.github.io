/* ApHugMap: thematic and reference maps for AP® Human Geography
   (docs/aphug-architecture.md, "Map stimulus"). Pure (no DOM); the generator
   runs it in node at build time and writes each map as an SVG file under
   human-geography/figures/maps/, so no page fetches map data or tiles; a
   trainer may run it in the browser on the same base files.

   A base is one of the files scripts/build-aphug-basemaps.mjs writes under
   human-geography/figures/base/ (world, the world regions, country-a, metro):
   { id, title, width, height, projection, note?, features: [{ id, name, d, c,
   r?, context?, disputed?, code?, line?: 'river' | 'rail' | 'highway',
   station?, limit?, evenodd? }] }. The invented bases (country-a, metro)
   give each area a short code; metro adds lines, rail stations and the
   central city's limit (drawn bold), all listed in the legend.

   The spec (a stimulus's `map`):
     { base: 'world', render: 'reference' | 'choropleth' | 'dot' | 'symbol' | 'isoline' | 'flow',
       label: 'what the map shows, 20+ characters (alt text)',
       source: 'UN WPP 2024 (2024 estimates)' | invented: true,
       legendTitle?: 'Total fertility rate (births per woman)',
       // choropleth: 2-6 classes, low to high; values name a class per feature
       classes: ['Under 1.5', '1.5-2.0', ...], values: { nigeria: 4, ... }, noData?: 'No data',
       // dot: one dot is `each`; points are [lon, lat] (or [x, y] on country-a)
       dots: { each: '1 dot = 1 million people', points: [[lon, lat], ...] },
       // symbol: circles whose AREA is proportional to value
       symbols: { unit: 'million people', items: [{ at: 'japan' | [lon, lat], value }], legend?: [5, 20, 40] },
       // isoline: lines of equal value, each labeled with its value
       isolines: { unit: 'days of frost a year', lines: [{ value, points: [[lon, lat], ...] }] },
       // flow: curved arrows, width from the value (the legend draws three
       // sample widths at the map's own scale); 1 to 12 arrows
       flows: { unit: 'thousand migrants a year', items: [{ from: 'mexico' | [lon, lat], to, value, bend? }], legend?: [values] },
       // labels: each area's name or short code at its center (invented
       // bases have codes; a code key goes in the legend); only? limits them
       labels?: 'codes' | 'names', labelOnly?: ['north', ...],
       focus?: ['nigeria'],          reference maps: the features drawn in the accent
       marks?: [{ at: 'egypt' | [lon, lat], text: 'A' }]   letters or short place names }

   Text never goes inside the SVG (an <img> scales its text with the map, so a
   world map at 360 px would print 5 px letters): marks, isoline values and the
   legend are HTML laid over or under the picture at the page's own size.

     check(spec, base)  -> problems[] (empty when the map can be drawn legibly)
     svg(spec, base)    -> a standalone SVG document (fixed colors: it is an <img>)
     overlay(spec, base) -> [{ x%, y%, text, kind }] the HTML labels over the map
     legendHtml(spec, base) -> the legend (always below the map, legible at 360 px)
     project(base, [lon, lat]) -> [x, y] in the base's pixels
     note(base, spec)   -> the border note (every real-outline map carries it)
     BORDER_NOTE, PALETTE */
(function(root){
  'use strict';
  var RENDERS = ['reference', 'choropleth', 'dot', 'symbol', 'isoline', 'flow'];
  // Sequential, light to dark (one hue family, each step clearly lighter or
  // darker than the next; distinguishable in greyscale).
  var PALETTE = {
    2: ['#CFE3D6', '#2E7D55'],
    3: ['#DCEBDF', '#7FBF9A', '#1D5E3E'],
    4: ['#E3F0E6', '#A6D3B5', '#4C9E70', '#1D5E3E'],
    5: ['#EAF4EC', '#B9DCC5', '#7FBF9A', '#3E8F63', '#174D33'],
    6: ['#EEF6F0', '#C7E4D0', '#9BCDAE', '#62AE84', '#2F7D54', '#123F29']
  };
  var LAND = '#F3EEE2', CONTEXT = '#E1DED6', SEA = '#DCEAF4', LINE = '#6E6A63', FOCUS = '#1D6B8C', SYMBOL = '#B5481F', DOT = '#7A2E0E', ISO = '#7A2E0E', FLOW = '#9C3A12';
  // Metro lines: how each kind is drawn (the legend shows the same).
  var LINES = { river: { stroke: '#4F8FBF', width: 5, label: 'River' }, rail: { stroke: '#1B1B1B', width: 2.4, dash: '9 5', label: 'Rail line' }, highway: { stroke: '#C98A1B', width: 3.2, label: 'Highway' } };
  var LIMIT = '#1B1B1B';
  // Thousands separators, the same in node and every browser (no locale).
  function num(v){ var t = String(v).split('.'); t[0] = t[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return t.join('.'); }
  function isArea(f){ return !f.line && !f.station; }
  var BORDER_NOTE = 'Borders follow Natural Earth’s de facto lines (public domain data); they show no position on any disputed territory.';
  var INVENTED_NOTE = 'An invented country for practice.';

  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function r1(v){ return Math.round(v * 10) / 10; }
  var A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, MM = Math.sqrt(3) / 2;
  function equalEarth(lon, lat){
    var l = lon * Math.PI / 180, p = lat * Math.PI / 180, t = Math.asin(MM * Math.sin(p)), t2 = t * t, t6 = t2 * t2 * t2;
    return [l * Math.cos(t) / (MM * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))), t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))];
  }
  function project(base, pt){
    var P = base.projection || {};
    if(P.name !== 'equal-earth') return [pt[0], pt[1]];
    var q = equalEarth(pt[0], pt[1]);
    return [(q[0] - P.x0) * P.k, (P.y1 - q[1]) * P.k];
  }
  function feature(base, id){ for(var i = 0; i < base.features.length; i++) if(base.features[i].id === id) return base.features[i]; return null; }
  function at(base, a){ if(typeof a === 'string'){ var f = feature(base, a); return f && f.c ? f.c : null; } return Array.isArray(a) ? project(base, a) : null; }
  function real(base){ return !base.invented; }

  function check(spec, base){
    var out = [], p = function(m){ out.push(m); };
    if(!spec || typeof spec !== 'object') return ['a map spec is an object'];
    if(!base || !base.features) return ['unknown base map "' + (spec && spec.base) + '"'];
    if(RENDERS.indexOf(spec.render) < 0) p('render must be one of ' + RENDERS.join(', '));
    if(String(spec.label || '').trim().length < 20) p('a map needs a label of 20+ characters (its alt text)');
    if(!spec.invented && !spec.source && spec.render !== 'reference') p('a thematic map needs a dated source line (source) or invented: true');
    if(spec.source && !/\b(19|20)\d\d\b/.test(spec.source)) p('the source line "' + spec.source + '" has no year (accuracy-risks.md rule 1)');
    if(spec.render === 'choropleth'){
      var cl = spec.classes || [];
      if(cl.length < 2 || cl.length > 6) p('a choropleth has 2 to 6 classes');
      if(!spec.legendTitle) p('a choropleth needs a legendTitle (what the shades measure, with the unit)');
      var vals = spec.values || {}, used = {};
      Object.keys(vals).forEach(function(id){
        var f = feature(base, id), v = vals[id];
        if(!f) p('choropleth: no feature "' + id + '" on base ' + base.id);
        else if(!isArea(f)) p('choropleth: ' + f.name + ' is a line or a station, not an area');
        else if(f.disputed && !spec.disputedOk) p('choropleth: ' + f.name + ' is disputed; give it no value, or set disputedOk with a reason (accuracy-risks.md section 4)');
        if(!(Number.isInteger(v) && v >= 0 && v < cl.length)) p('choropleth: ' + id + ' has class ' + v + ' (0 to ' + (cl.length - 1) + ')');
        used[v] = 1;
      });
      if(!Object.keys(vals).length) p('choropleth: no values');
    }
    if(spec.render === 'dot'){
      var D = spec.dots || {};
      if(!D.each) p('a dot map says what one dot is (dots.each)');
      if(!(D.points || []).length) p('a dot map needs points');
    }
    if(spec.render === 'symbol'){
      var S = spec.symbols || {};
      if(!S.unit) p('a graduated symbol map names its unit (symbols.unit)');
      (S.items || []).forEach(function(it){ if(!at(base, it.at)) p('symbol at "' + it.at + '" is not on base ' + base.id); if(!(it.value > 0)) p('symbol values are more than 0'); });
      if(!(S.items || []).length) p('a graduated symbol map needs items');
    }
    if(spec.render === 'isoline'){
      var I = spec.isolines || {};
      if(!I.unit) p('an isoline map names its unit (isolines.unit)');
      (I.lines || []).forEach(function(l){ if(!isFinite(l.value) || !(l.points || []).length) p('each isoline has a value and points'); });
      if((I.lines || []).length < 2) p('an isoline map needs at least two lines');
    }
    if(spec.render === 'flow'){
      var FL = spec.flows || {}, its = FL.items || [];
      if(!FL.unit) p('a flow map names its unit (flows.unit)');
      if(its.length < 1 || its.length > 12) p('a flow map has 1 to 12 arrows');
      its.forEach(function(it){
        if(!at(base, it.from)) p('flow from "' + it.from + '" is not on base ' + base.id);
        if(!at(base, it.to)) p('flow to "' + it.to + '" is not on base ' + base.id);
        if(JSON.stringify(it.from) === JSON.stringify(it.to)) p('a flow goes from one place to another');
        if(!(it.value > 0)) p('flow values are more than 0');
      });
    }
    if(spec.labels && ['codes', 'names'].indexOf(spec.labels) < 0) p('labels is "codes" or "names"');
    if(spec.labels === 'codes' && !base.features.some(function(f){ return f.code; })) p('base ' + base.id + ' has no area codes (labels: "names")');
    (spec.labelOnly || []).forEach(function(id){ if(!feature(base, id)) p('labelOnly: no feature "' + id + '"'); });
    (spec.focus || []).forEach(function(id){ if(!feature(base, id)) p('focus: no feature "' + id + '"'); });
    // Legible at 360 px: short marks, far enough apart that two never touch.
    var marks = overlay(spec, base);
    var maxLen = base.width >= 900 ? 3 : 22;
    marks.forEach(function(m, i){
      if(m.x == null) p('mark "' + m.text + '" is not on the map');
      if(String(m.text).length > maxLen) p('mark "' + m.text + '" is longer than ' + maxLen + ' characters (use a letter and name the place in the stem or the legend)');
      marks.slice(i + 1).forEach(function(n){
        // At 360 px wide a label is about 8 px a character plus 12 px of
        // padding, and 24 px tall with a 2 px gap, drawn above its point (below it when the
        // point is near the top edge): two label boxes that meet would touch.
        var px = 360 / base.width, H = base.height * px;
        var box = function(o){ var w = String(o.text).length * 8 + 12, x = o.x / 100 * 360, y = o.y / 100 * H;
          var top = o.kind === 'iso' || o.kind === 'label' ? y - 13 : o.low ? y + 3 : y - 27; return [x - w / 2 - 2, top, x + w / 2 + 2, top + 26]; };
        var A = box(m), B = box(n);
        if(A[0] < B[2] && B[0] < A[2] && A[1] < B[3] && B[1] < A[3]) p('labels "' + m.text + '" and "' + n.text + '" would overlap at 360 px');
      });
    });
    return out;
  }

  function overlay(spec, base){
    var o = [], W = base.width, H = base.height;
    // A mark near the top edge sits below its point (a 28 px label on a map 360 px wide).
    var lowPct = 28 / (360 * H / W) * 100;
    function put(pt, text, kind){
      if(!pt) { o.push({ text: text, kind: kind }); return; }
      var y = +(100 * pt[1] / H).toFixed(2);
      o.push({ x: +(100 * pt[0] / W).toFixed(2), y: y, text: String(text), kind: kind, low: kind === 'mark' && y < lowPct });
    }
    // Area labels first (centered on each area), then the marks.
    if(spec.labels){
      base.features.forEach(function(f){
        if(!isArea(f) || f.context || !f.c) return;
        if(spec.labelOnly && spec.labelOnly.indexOf(f.id) < 0) return;
        var t = spec.labels === 'codes' ? f.code : f.name;
        if(t) put(f.c, t, 'label');
      });
    }
    (spec.marks || []).forEach(function(m){ put(at(base, m.at), m.text, 'mark'); });
    // Each isoline's value sits at a different point along it (the first line
    // a quarter of the way, the next further on), so neighbors' labels stagger.
    if(spec.render === 'isoline'){
      var L = (spec.isolines || {}).lines || [];
      L.forEach(function(l, i){
        var pts = l.points.map(function(q){ return project(base, q); });
        var at = l.labelAt != null ? l.labelAt : (i + 1) / (L.length + 1);
        put(pts[Math.min(pts.length - 1, Math.round(at * (pts.length - 1)))], String(l.value), 'iso');
      });
    }
    return o;
  }

  function symbolR(spec, base, v){
    var S = spec.symbols, mx = Math.max.apply(null, S.items.map(function(i){ return i.value; }));
    var rmax = base.width / (base.width >= 900 ? 28 : 16);
    return rmax * Math.sqrt(v / mx);
  }

  /* One flow arrow: a quadratic curve bent to one side (two flows between
     the same places in opposite directions bend apart), its width from the
     value, ending in a head drawn as a triangle at the destination. */
  function flowWidth(spec, base, v){
    var mx = Math.max.apply(null, spec.flows.items.map(function(i){ return i.value; })), W = base.width;
    var lo = W / 280, hi = W / 80;
    return lo + (hi - lo) * Math.min(1, v / mx);
  }
  function flowArrow(spec, base, it){
    var a = at(base, it.from), b = at(base, it.to), w = flowWidth(spec, base, it.value), W = base.width;
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / len, ny = dx / len;
    // With area labels on, each arrow stops short of the label at either end
    // (about 14 px at 360 px wide), so no head hides under a code.
    if(spec.labels){ var gap = Math.min(W / 24, len / 4); a = [a[0] + dx / len * gap, a[1] + dy / len * gap]; b = [b[0] - dx / len * gap, b[1] - dy / len * gap]; dx = b[0] - a[0]; dy = b[1] - a[1]; len = Math.sqrt(dx * dx + dy * dy) || 1; }
    var bend = (it.bend == null ? 1 : it.bend) * 0.18 * len;
    var cx = (a[0] + b[0]) / 2 + nx * bend, cy = (a[1] + b[1]) / 2 + ny * bend;
    var tx = b[0] - cx, ty = b[1] - cy, tl = Math.sqrt(tx * tx + ty * ty) || 1; tx /= tl; ty /= tl;
    // The head never takes more than a third of a short arrow; it stays wider than the shaft.
    var L = Math.min(Math.max(2.8 * w, W / 70), len / 3), hw = Math.max(Math.min(Math.max(1.7 * w, W / 130), L * 0.8), w * 0.9);
    var ex = b[0] - tx * L, ey = b[1] - ty * L;
    return '<path d="M' + r1(a[0]) + ' ' + r1(a[1]) + 'Q' + r1(cx) + ' ' + r1(cy) + ' ' + r1(ex) + ' ' + r1(ey) + '" fill="none" stroke="' + FLOW + '" stroke-opacity="0.85" stroke-width="' + r1(w) + '" stroke-linecap="round"/>' +
      '<path d="M' + r1(b[0]) + ' ' + r1(b[1]) + 'L' + r1(ex - ty * hw) + ' ' + r1(ey + tx * hw) + 'L' + r1(ex + ty * hw) + ' ' + r1(ey - tx * hw) + 'Z" fill="' + FLOW + '"/>' +
      '<circle cx="' + r1(a[0]) + '" cy="' + r1(a[1]) + '" r="' + r1(Math.max(w * 0.7, W / 300)) + '" fill="' + FLOW + '"/>';
  }

  function svg(spec, base){
    var W = base.width, H = base.height, cls = spec.classes || [], pal = PALETTE[Math.max(2, Math.min(6, cls.length))] || PALETTE[5];
    var vals = spec.values || {}, focus = spec.focus || [], out = [];
    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(spec.label) + '">');
    out.push('<title>' + esc(spec.label) + '</title>');
    out.push('<defs><pattern id="nd" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#FFFFFF"/><line x1="0" y1="0" x2="0" y2="6" stroke="#9A958C" stroke-width="1.4"/></pattern></defs>');
    out.push('<rect width="' + W + '" height="' + H + '" fill="' + (real(base) ? SEA : '#FFFFFF') + '"/>');
    base.features.forEach(function(f){
      if(!isArea(f)) return;
      var fill = f.context ? CONTEXT : LAND;
      if(spec.render === 'choropleth' && !f.context) fill = vals[f.id] == null ? 'url(#nd)' : pal[vals[f.id]];
      if(spec.render === 'reference' && focus.indexOf(f.id) > -1) fill = FOCUS;
      out.push('<path d="' + f.d + '" fill="' + fill + '"' + (f.evenodd ? ' fill-rule="evenodd"' : '') + ' stroke="' + LINE + '" stroke-width="0.7" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>');
    });
    // Metro: the central city's limit in bold, then rivers, highways, rail, stations.
    base.features.forEach(function(f){ if(f.limit) out.push('<path d="' + f.d + '" fill="none" stroke="' + LIMIT + '" stroke-width="3" stroke-linejoin="round"/>'); });
    ['river', 'highway', 'rail'].forEach(function(k){
      base.features.forEach(function(f){
        if(f.line !== k) return;
        var L = LINES[k];
        if(k === 'rail') out.push('<path d="' + f.d + '" fill="none" stroke="#FFFFFF" stroke-width="' + (L.width + 2) + '" stroke-linecap="round" stroke-linejoin="round"/>');
        out.push('<path d="' + f.d + '" fill="none" stroke="' + L.stroke + '" stroke-width="' + L.width + '"' + (L.dash ? ' stroke-dasharray="' + L.dash + '"' : '') + ' stroke-linecap="round" stroke-linejoin="round"/>');
      });
    });
    base.features.forEach(function(f){ if(f.station) out.push('<circle cx="' + f.c[0] + '" cy="' + f.c[1] + '" r="5" fill="#FFFFFF" stroke="#1B1B1B" stroke-width="2.2"/>'); });
    if(spec.render === 'dot'){
      var rd = W / 260;
      spec.dots.points.forEach(function(q){ var x = project(base, q); out.push('<circle cx="' + r1(x[0]) + '" cy="' + r1(x[1]) + '" r="' + r1(rd) + '" fill="' + DOT + '"/>'); });
    }
    if(spec.render === 'symbol'){
      spec.symbols.items.slice().sort(function(a, b){ return b.value - a.value; }).forEach(function(it){
        var x = at(base, it.at), r = symbolR(spec, base, it.value);
        out.push('<circle cx="' + r1(x[0]) + '" cy="' + r1(x[1]) + '" r="' + r1(r) + '" fill="' + SYMBOL + '" fill-opacity="0.55" stroke="#5E2410" stroke-width="1" vector-effect="non-scaling-stroke"/>');
      });
    }
    if(spec.render === 'isoline'){
      spec.isolines.lines.forEach(function(l){
        var pts = l.points.map(function(q){ var x = project(base, q); return r1(x[0]) + ' ' + r1(x[1]); });
        out.push('<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + ISO + '" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>');
      });
    }
    if(spec.render === 'flow'){
      // Widest first, so a thin arrow is never hidden under a wide one.
      spec.flows.items.slice().sort(function(a, b){ return b.value - a.value; }).forEach(function(it){ out.push(flowArrow(spec, base, it)); });
    }
    // A ring under each mark, so a letter's place is exact even before its label.
    overlay(spec, base).filter(function(m){ return m.kind === 'mark' && m.x != null; }).forEach(function(m){
      out.push('<circle cx="' + r1(m.x * W / 100) + '" cy="' + r1(m.y * H / 100) + '" r="' + r1(W / 220) + '" fill="#1B1B1B"/>');
    });
    out.push('</svg>');
    return out.join('\n') + '\n';
  }

  function legendHtml(spec, base){
    var rows = [], cls = spec.classes || [], pal = PALETTE[Math.max(2, Math.min(6, cls.length))] || PALETTE[5];
    var sw = function(fill, extra){ return '<span class="hug-lg-sw' + (extra || '') + '" style="background:' + fill + '" aria-hidden="true"></span>'; };
    if(spec.render === 'choropleth'){
      cls.forEach(function(c, i){ rows.push('<li>' + sw(pal[i]) + esc(c) + '</li>'); });
      var shown = base.features.some(function(f){ return !f.context && isArea(f) && spec.values[f.id] == null; });
      if(shown) rows.push('<li><span class="hug-lg-sw is-nd" aria-hidden="true"></span>' + esc(spec.noData || 'No data') + '</li>');
    }
    if(spec.render === 'reference' && (spec.focus || []).length) rows.push('<li>' + sw(FOCUS) + esc(spec.legendTitle || 'Highlighted') + '</li>');
    if(spec.render === 'dot') rows.push('<li><span class="hug-lg-dot" aria-hidden="true"></span>' + esc(spec.dots.each) + '</li>');
    if(spec.render === 'symbol'){
      var S = spec.symbols, mx = Math.max.apply(null, S.items.map(function(i){ return i.value; }));
      var marks = S.legend || [mx / 4, mx / 2, mx].map(function(v){ var p = Math.pow(10, Math.floor(Math.log10(v))); return Math.round(v / p) * p; });
      // Circles drawn at the map's scale: the legend's own viewBox has the map's width.
      var rr = marks.map(function(v){ return symbolR(spec, base, v); }), h = Math.ceil(2 * Math.max.apply(null, rr) + 4), x = 4;
      var circles = marks.map(function(v, i){ var c = '<circle cx="' + r1(x + rr[i]) + '" cy="' + r1(h - 2 - rr[i]) + '" r="' + r1(rr[i]) + '" fill="' + SYMBOL + '" fill-opacity="0.55" stroke="#5E2410" vector-effect="non-scaling-stroke"/>'; x += 2 * rr[i] + base.width / 12; return c; }).join('');
      var lx = 4, labels = marks.map(function(v, i){ var l = '<span style="left:' + (100 * (lx + rr[i]) / base.width).toFixed(2) + '%">' + esc(num(v)) + '</span>'; lx += 2 * rr[i] + base.width / 12; return l; }).join('');
      rows.push('<li class="hug-lg-sym"><span class="hug-lg-symart"><svg viewBox="0 0 ' + base.width + ' ' + h + '" preserveAspectRatio="xMinYMax meet" aria-hidden="true">' + circles + '</svg><span class="hug-lg-symnum">' + labels + '</span></span>' + esc(S.unit) + ' (circle area shows the value)</li>');
    }
    if(spec.render === 'flow'){
      var FL = spec.flows, fmx = Math.max.apply(null, FL.items.map(function(i){ return i.value; }));
      var fmarks = FL.legend || [fmx / 4, fmx / 2, fmx].map(function(v){ var p = Math.pow(10, Math.floor(Math.log10(v))); return Math.round(v / p) * p; });
      // Three sample arrows drawn in the map's own units (the legend's viewBox
      // is the map's width), so a width in the legend is a width on the map.
      var seg = base.width / 5, gap = base.width / 14, fh = Math.ceil(flowWidth(spec, base, fmx) * 3.6 + 6), fx = 4, flabels = [];
      var arrows = fmarks.map(function(v){
        var w = flowWidth(spec, base, v), y = fh / 2, L = Math.max(2.8 * w, base.width / 70), hw = Math.max(1.7 * w, base.width / 130), x1 = fx + seg;
        var a = '<path d="M' + r1(fx) + ' ' + r1(y) + 'L' + r1(x1 - L) + ' ' + r1(y) + '" stroke="' + FLOW + '" stroke-opacity="0.85" stroke-width="' + r1(w) + '" stroke-linecap="round"/><path d="M' + r1(x1) + ' ' + r1(y) + 'L' + r1(x1 - L) + ' ' + r1(y - hw) + 'L' + r1(x1 - L) + ' ' + r1(y + hw) + 'Z" fill="' + FLOW + '"/>';
        flabels.push('<span style="left:' + (100 * (fx + seg / 2) / base.width).toFixed(2) + '%">' + esc(num(v)) + '</span>');
        fx += seg + gap; return a;
      }).join('');
      rows.push('<li class="hug-lg-sym hug-lg-flow"><span class="hug-lg-symart"><svg viewBox="0 0 ' + base.width + ' ' + fh + '" preserveAspectRatio="xMinYMid meet" aria-hidden="true">' + arrows + '</svg><span class="hug-lg-symnum">' + flabels.join('') + '</span></span>' + esc(FL.unit) + ' (arrow width shows the value)</li>');
    }
    // A metro base: what its lines and symbols are (always, whatever the render).
    var kinds = {};
    base.features.forEach(function(f){ if(f.line) kinds[f.line] = 1; if(f.station) kinds.station = 1; if(f.limit) kinds.limit = 1; });
    if(kinds.limit) rows.push('<li><span class="hug-lg-line" style="border-top:3px solid ' + LIMIT + '" aria-hidden="true"></span>Central city limit</li>');
    ['river', 'highway', 'rail'].forEach(function(k){ if(kinds[k]) rows.push('<li><span class="hug-lg-line" style="border-top:' + (k === 'river' ? 4 : 3) + 'px ' + (LINES[k].dash ? 'dashed' : 'solid') + ' ' + LINES[k].stroke + '" aria-hidden="true"></span>' + LINES[k].label + '</li>'); });
    if(kinds.station) rows.push('<li><span class="hug-lg-stn" aria-hidden="true"></span>Rail station</li>');
    if(spec.render === 'isoline') rows.push('<li><span class="hug-lg-iso" aria-hidden="true"></span>Line of equal value, labeled in ' + esc(spec.isolines.unit) + '</li>');
    // Area codes on the map: the key that names them.
    var codeKey = '';
    if(spec.labels === 'codes'){
      var shownCodes = overlay(spec, base).filter(function(o){ return o.kind === 'label'; }).map(function(o){ return o.text; });
      codeKey = '<p class="hug-lg-codes">' + base.features.filter(function(f){ return f.code && shownCodes.indexOf(f.code) > -1; }).map(function(f){ return '<span><b>' + esc(f.code) + '</b> ' + esc(f.name) + '</span>'; }).join('') + '</p>';
    }
    if(!rows.length && !codeKey) return '';
    return '<div class="hug-legend">' + (spec.legendTitle && spec.render !== 'reference' ? '<p class="hug-lg-title">' + esc(spec.legendTitle) + '</p>' : '') + (rows.length ? '<ul>' + rows.join('') + '</ul>' : '') + codeKey + '</div>';
  }

  function note(base){ return base && base.invented ? (base.note || INVENTED_NOTE) : BORDER_NOTE; }

  root.ApHugMap = { RENDERS: RENDERS, PALETTE: PALETTE, BORDER_NOTE: BORDER_NOTE, INVENTED_NOTE: INVENTED_NOTE,
    check: check, svg: svg, overlay: overlay, legendHtml: legendHtml, project: project, note: note, feature: feature, equalEarth: equalEarth, num: num };
})(typeof window !== 'undefined' ? window : globalThis);
