/* Map reader model: ApHugMath.mapReader (docs/aphug-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/aphug-briefs/t3.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/aphug-tool-checks/map-reader.mjs) and the
   test (scripts/test/aphug-tool-map-reader.test.mjs) run exactly this code.

   Every map is an ApHugMap spec on a committed base map (the world, a world
   region or the invented Country A), checked with ApHugMap.check (labels
   legible and apart at 360 px). Every thematic value is INVENTED for practice
   and labeled so (accuracy-risks.md: invented data on real outlines is fine
   when labeled); a pattern changes with every problem code, so no drill
   teaches a false fact about a real place. Disputed places get no value and
   are never marked or named in a key.

   Bases are loaded by the page (fetch) or the validator (fs) and handed in
   with setBases({ id: base }) before generate() runs.

     KINDS                   the six map types (reference, choropleth, dot,
                             symbol, isoline, cartogram) with what each shows
                             best and what it cannot show
     setBases(o), base(id)
     polys(feature), area(feature), inside(feature, [x, y])   geometry on the M/L/Z paths
     dataset(baseId, seed)   one invented data set for a base: per feature a
                             rate class, a count and a value (Explore)
     exploreSpec(baseId, render, o) -> { spec, key, table, cartogram? }
     cartogram(values)       a block cartogram of Country A: squares with area
                             proportional to each province's value, kept apart
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, figure, given }
       type 'kind' | 'legend' | 'pattern' | 'breaks' | 'limits' | 'isoline' */
(function(G){
  'use strict';
  var M = G.ApHugMath;
  if(!M) return;
  function MAP(){ return G.ApHugMap; }
  function calc(fn, args){ return M.Calc().evaluate({ fn: fn, args: args }); }
  function pick(r, a){ return a[Math.floor(r() * a.length)]; }
  function nf(x, d){
    var s = M.fixed(x, d == null ? 0 : d);
    if(s.indexOf('.') > -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
    var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return p.join('.');
  }
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  /* ------------------------------------------------------------ bases */
  var BASES = {};
  function setBases(o){ for(var k in o) if(o[k] && o[k].features) BASES[k] = o[k]; prep(); }
  function base(id){ var b = BASES[id]; if(!b) throw new Error('map-reader: base "' + id + '" is not loaded'); return b; }
  var GEOM = {};
  function prep(){
    Object.keys(BASES).forEach(function(id){
      if(GEOM[id]) return;
      var b = BASES[id], g = {};
      b.features.forEach(function(f){ var P = parse(f.d); g[f.id] = { polys: P, area: P.reduce(function(s, p){ return s + Math.abs(ringArea(p)); }, 0), box: bbox(P) }; });
      GEOM[id] = g;
    });
  }
  function parse(d){
    return String(d).split('M').filter(function(s){ return s.trim(); }).map(function(ring){
      return ring.replace(/Z/g, '').split('L').map(function(s){ var t = s.trim().split(/[\s,]+/).map(Number); return [t[0], t[1]]; }).filter(function(p){ return isFinite(p[0]) && isFinite(p[1]); });
    }).filter(function(p){ return p.length > 2; });
  }
  function ringArea(p){ var a = 0; for(var i = 0; i < p.length; i++){ var q = p[i], s = p[(i + 1) % p.length]; a += q[0] * s[1] - s[0] * q[1]; } return a / 2; }
  function bbox(P){ var b = [Infinity, Infinity, -Infinity, -Infinity]; P.forEach(function(p){ p.forEach(function(q){ b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }); }); return b; }
  function inRing(p, x, y){ var c = false; for(var i = 0, j = p.length - 1; i < p.length; j = i++){ var a = p[i], b = p[j]; if((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  function geom(bid, fid){ prep(); return GEOM[bid][fid]; }
  function inside(bid, fid, pt){ var g = geom(bid, fid); if(pt[0] < g.box[0] || pt[0] > g.box[2] || pt[1] < g.box[1] || pt[1] > g.box[3]) return false; var n = 0; g.polys.forEach(function(p){ if(inRing(p, pt[0], pt[1])) n++; }); return n % 2 === 1; }
  /* Features that can carry a value: on the base itself (not grey context),
     not disputed. Markable: also big enough to hold a letter. */
  function valued(bid){ return base(bid).features.filter(function(f){ return !f.context && !f.disputed; }); }
  function minArea(bid){ var b = base(bid); return b.invented ? 1000 : b.width >= 900 ? 180 : 900; }
  function markable(bid){ var m = minArea(bid); return valued(bid).filter(function(f){ return geom(bid, f.id).area >= m && f.c; }); }
  function nameOf(bid, fid){ var f = MAP().feature(base(bid), fid); return f ? f.name : fid; }
  function placeName(bid){ var b = base(bid); return b.invented ? 'Country A' : b.id === 'world' ? 'the world' : b.title; }

  /* ------------------------------------------------------- map types */
  var KINDS = {
    reference: { name: 'Reference map', short: 'Reference', best: 'where places are: borders, cities, rivers and roads', cannot: 'how much of anything there is in each place (a reference map carries no data values)',
      look: 'Places drawn and highlighted with no data scale' },
    choropleth: { name: 'Choropleth map', short: 'Choropleth', best: 'a rate or share (per person, per km², a percent) for whole areas, shaded from light to dark', cannot: 'differences inside each area: one shade covers the whole unit',
      look: 'Whole areas shaded light to dark by class' },
    dot: { name: 'Dot density map', short: 'Dot density', best: 'where many of something are found and how they cluster, as counts', cannot: 'a rate per person: dots count things, they do not divide by population',
      look: 'Many small dots, each one a set number' },
    symbol: { name: 'Graduated symbol map', short: 'Graduated symbol', best: 'how much there is at each place (a total), with the symbol sized by the amount', cannot: 'how the amount is spread out inside each place; big symbols can also hide small ones nearby',
      look: 'Circles sized by amount' },
    isoline: { name: 'Isoline map', short: 'Isoline', best: 'a value that changes smoothly across space (temperature, elevation, travel time), with lines joining places of equal value', cannot: 'the exact value between two lines, only the range it falls in',
      look: 'Lines joining places of equal value' },
    cartogram: { name: 'Cartogram', short: 'Cartogram', best: 'which places have the most of something, by redrawing each place with its size set by the data', cannot: 'true shape, area or distance: places are resized and moved',
      look: 'Places resized by the data, shapes distorted' }
  };
  var KIND_ORDER = ['reference', 'choropleth', 'dot', 'symbol', 'isoline', 'cartogram'];

  /* --------------------------------------------- invented variables */
  var RATE_VARS = [
    { title: 'Homes with rooftop solar panels (% of homes)', classes: ['Under 10%', '10% to 19%', '20% to 29%', '30% or more'] },
    { title: 'Bike-share trips per 1,000 people a year', classes: ['Under 50', '50 to 99', '100 to 199', '200 or more'] },
    { title: 'Public libraries per 100,000 people', classes: ['Under 2', '2 to 3.9', '4 to 5.9', '6 or more'] },
    { title: 'Adults who speak two or more languages (%)', classes: ['Under 25%', '25% to 49%', '50% to 74%', '75% or more'] },
    { title: 'Average trip to work (minutes)', classes: ['Under 20', '20 to 29', '30 to 39', '40 or more'] }
  ];
  var COUNT_VARS = [
    { title: 'Where people who work in fishing live', each: '1 dot = 20,000 workers', unit: 'thousand workers' },
    { title: 'Visitors to national parks', each: '1 dot = 50,000 visitors a year', unit: 'thousand visitors a year' },
    { title: 'Small farms', each: '1 dot = 10,000 farms', unit: 'thousand farms' }
  ];
  var ISO_VARS = [
    { title: 'Days of frost a year', unit: 'days of frost a year' },
    { title: 'Travel time to the capital by road', unit: 'hours of travel' },
    { title: 'Average July temperature', unit: '°C' }
  ];
  var NO_DATA = 'No value in this practice set';

  /* ---------------------------------------------- directions on a map */
  var DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  var OPP = { north: 'south', south: 'north', east: 'west', west: 'east' };
  function along(f, dir){ var v = DIRS[dir]; return f.c[0] * v[0] + f.c[1] * v[1]; }
  /* Class indices 0..n-1 by rank of a score (equal counts): low to high. */
  function quantile(list, score, n){
    var s = list.slice().sort(function(a, b){ return score(a) - score(b); }), out = {};
    s.forEach(function(f, i){ out[f.id] = Math.min(n - 1, Math.floor(i * n / s.length)); });
    return out;
  }
  /* A trend toward one direction plus noise, so the top class sits on one side. */
  function medianAlong(bid, dir){ var s = valued(bid).map(function(f){ return along(f, dir); }).sort(function(a, b){ return a - b; }); return s[Math.floor(s.length / 2)]; }
  function trendClasses(r, bid, dir, n, noise){
    var L = valued(bid), lo = Infinity, hi = -Infinity;
    L.forEach(function(f){ var a = along(f, dir); lo = Math.min(lo, a); hi = Math.max(hi, a); });
    var sc = {}; L.forEach(function(f){ sc[f.id] = (along(f, dir) - lo) / (hi - lo || 1) + (r() - 0.5) * (noise == null ? 0.35 : noise); });
    return quantile(L, function(f){ return sc[f.id]; }, n);
  }

  /* ---------------------------------------------- marks, kept apart */
  function legibleMarks(bid, list, max){
    var B = base(bid), marks = [];
    for(var i = 0; i < list.length && marks.length < max; i++){
      var m = marks.concat([{ at: list[i], text: LETTERS[marks.length] }]);
      if(!MAP().check({ base: bid, render: 'reference', label: 'Checking the marks for overlap', marks: m }, B).length) marks = m;
    }
    return marks;
  }
  function keyOf(bid, marks){ return marks.map(function(m){ return { mark: m.text, at: m.at, name: typeof m.at === 'string' ? nameOf(bid, m.at) : '' }; }); }

  /* ---------------------------------------------- invented counts and dots */
  function countValues(r, bid, dir){
    var L = valued(bid), out = {};
    L.forEach(function(f){ var g = geom(bid, f.id), k = dir ? 0.4 + 1.4 * Math.max(0, Math.min(1, 0.5 + 0.5 * (along(f, dir) - mid(bid, dir)) / span(bid, dir))) : 1; out[f.id] = Math.max(1, Math.round(Math.sqrt(g.area) * k * (0.5 + r()))); });
    return out;
  }
  function mid(bid, dir){ var L = valued(bid).map(function(f){ return along(f, dir); }); return (Math.max.apply(null, L) + Math.min.apply(null, L)) / 2; }
  function span(bid, dir){ var L = valued(bid).map(function(f){ return along(f, dir); }); return (Math.max.apply(null, L) - Math.min.apply(null, L)) / 2 || 1; }
  /* Points inside a feature: [lon, lat] on a projected base, [x, y] on Country A. */
  function samplePoints(r, bid, fid, n){
    var B = base(bid), g = geom(bid, fid), out = [], tries = 0, proj = B.projection && B.projection.name === 'equal-earth';
    var bx = B.box || [-180, -60, 180, 85];
    while(out.length < n && tries++ < n * 400){
      var pt, xy;
      if(proj){ var lon = bx[0] + r() * (bx[2] - bx[0]), lat = bx[1] + r() * (bx[3] - bx[1]); pt = [M.round(lon, 2), M.round(lat, 2)]; xy = MAP().project(B, pt); }
      else { xy = [M.round(g.box[0] + r() * (g.box[2] - g.box[0]), 1), M.round(g.box[1] + r() * (g.box[3] - g.box[1]), 1)]; pt = xy; }
      if(xy[0] < g.box[0] || xy[0] > g.box[2] || xy[1] < g.box[1] || xy[1] > g.box[3]) continue;
      if(inside(bid, fid, xy)) out.push(pt);
    }
    return out;
  }
  function dotsFor(r, bid, counts, per){
    var pts = [];
    Object.keys(counts).forEach(function(id){ var n = Math.round(counts[id] / per); if(n > 0) pts = pts.concat(samplePoints(r, bid, id, n)); });
    return pts;
  }

  /* ------------------------------------------------ Country A isolines */
  /* Lines of equal value run north to south across Country A, bunched toward
     one side: x positions from the west, each line gently waved. */
  /* Each line keeps only its longest run of points inside Country A, so no
     line runs off the land. */
  function inCountryA(pt){ return base('country-a').features.some(function(f){ return inside('country-a', f.id, pt); }); }
  function isoLines(r, values, xs){
    var ph = r() * 6, amp = 10 + r() * 10;
    return values.map(function(v, i){
      var run = [], best = [];
      for(var y = 30; y <= 370; y += 10){
        var x = xs[i] + amp * Math.sin(y / 70 + ph + i * 0.4), pt = [M.round(x, 1), y];
        if(inCountryA([pt[0], pt[1] - 2]) && inCountryA([pt[0], pt[1] + 2])) run.push(pt); else { if(run.length > best.length) best = run; run = []; }
      }
      if(run.length > best.length) best = run;
      return { value: v, points: best };
    });
  }
  /* The value range at x on a line set (lines west to east): between which two lines. */
  function lineIndexAt(xs, x){ for(var i = 0; i < xs.length; i++) if(x < xs[i]) return i; return xs.length; }

  /* ------------------------------------------------------- cartogram */
  /* A block cartogram of Country A: one square per province, area
     proportional to its value, centered near the province's own center and
     pushed apart until no two touch. Coordinates in the base's 600 x 400 box. */
  function cartogram(values){
    var B = base('country-a'), ids = B.features.map(function(f){ return f.id; }), mx = 0;
    ids.forEach(function(id){ mx = Math.max(mx, values[id]); });
    var sq = ids.map(function(id){ var f = MAP().feature(B, id); return { id: id, name: f.name, x: f.c[0], y: f.c[1], s: 170 * Math.sqrt(values[id] / mx), value: values[id] }; });
    for(var it = 0; it < 400; it++){
      var moved = false;
      for(var i = 0; i < sq.length; i++) for(var j = i + 1; j < sq.length; j++){
        var a = sq[i], b = sq[j], need = (a.s + b.s) / 2 + 6, dx = b.x - a.x, dy = b.y - a.y;
        var ox = need - Math.abs(dx), oy = need - Math.abs(dy);
        if(ox > 0 && oy > 0){
          moved = true;
          if(ox < oy){ var sx = (dx >= 0 ? 1 : -1) * ox / 2; a.x -= sx; b.x += sx; }
          else { var sy = (dy >= 0 ? 1 : -1) * oy / 2; a.y -= sy; b.y += sy; }
        }
      }
      if(!moved) break;
    }
    // Fit back into the box.
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    sq.forEach(function(q){ x0 = Math.min(x0, q.x - q.s / 2); y0 = Math.min(y0, q.y - q.s / 2); x1 = Math.max(x1, q.x + q.s / 2); y1 = Math.max(y1, q.y + q.s / 2); });
    var k = Math.min(1, 560 / (x1 - x0), 370 / (y1 - y0));
    sq.forEach(function(q){ q.x = M.round(20 + (q.x - x0) * k + (560 - (x1 - x0) * k) / 2, 1); q.y = M.round(15 + (q.y - y0) * k + (370 - (y1 - y0) * k) / 2, 1); q.s = M.round(q.s * k, 1); });
    return { kind: 'cartogram', width: 600, height: 400, squares: sq };
  }

  /* -------------------------------------------------- Explore data */
  /* One invented data set per base (fixed seed): people and land area, so
     the same numbers can be drawn as a choropleth (density, a rate), dots
     and graduated symbols (counts) and, on Country A, a cartogram. */
  function dataset(bid, seed){
    var r = M.rng(seed || 2027), B = base(bid), L = valued(bid), dir = pick(r, ['north', 'south', 'east', 'west']), out = { dir: dir, people: {}, land: {}, density: {} };
    L.forEach(function(f){
      var g = geom(bid, f.id), lean = 0.5 + 0.5 * (along(f, dir) - mid(bid, dir)) / span(bid, dir);
      var land = B.invented ? Math.round(g.area * 0.6 / 100) * 100 : Math.max(1, Math.round(g.area));
      var dens = M.round((B.invented ? 20 : 8) * (0.4 + 2.2 * lean) * (0.7 + 0.6 * r()), 1);
      out.land[f.id] = land; out.density[f.id] = dens; out.people[f.id] = Math.round(land * dens / (B.invented ? 1 : 1));
    });
    return out;
  }
  var DENS_CLASSES = { a: ['Under 15', '15 to 29', '30 to 44', '45 or more'], real: ['Under 6', '6 to 11', '12 to 17', '18 or more'] };
  function densityClass(v, inv){ var b = inv ? [15, 30, 45] : [6, 12, 18]; return v < b[0] ? 0 : v < b[1] ? 1 : v < b[2] ? 2 : 3; }
  /* exploreSpec(baseId, render, o): o.breaks 'even' | 'lumped' | 'totals' (choropleth), o.marks (feature ids to letter). */
  function exploreSpec(bid, render, o){
    o = o || {};
    var B = base(bid), D = dataset(bid, o.seed), inv = !!B.invented, L = valued(bid), r = M.rng(4049), unitW = inv ? 'people per km²' : 'people per unit of land';
    var spec = { base: bid, render: render, invented: true, label: '' }, table = [], extra = {};
    L.forEach(function(f){ table.push({ id: f.id, name: f.name, people: D.people[f.id], land: D.land[f.id], density: D.density[f.id] }); });
    if(render === 'choropleth'){
      var br = o.breaks || 'even', vals = {};
      if(br === 'totals'){
        var tq = quantile(L, function(f){ return D.people[f.id]; }, 4);
        spec.classes = inv ? ['Under 250,000', '250,000 to 399,999', '400,000 to 549,999', '550,000 or more'] : ['Fewest', 'Fewer', 'More', 'Most'];
        if(inv){ L.forEach(function(f){ var v = D.people[f.id]; vals[f.id] = v < 250000 ? 0 : v < 400000 ? 1 : v < 550000 ? 2 : 3; }); } else vals = tq;
        spec.legendTitle = 'Total people (invented)';
      } else if(br === 'lumped'){
        var bb = inv ? [8, 60] : [3, 25];
        spec.classes = inv ? ['Under 8', '8 to 59', '60 or more'] : ['Under 3', '3 to 24', '25 or more'];
        L.forEach(function(f){ var v = D.density[f.id]; vals[f.id] = v < bb[0] ? 0 : v < bb[1] ? 1 : 2; });
        spec.legendTitle = 'People per km² (invented), uneven classes';
      } else {
        spec.classes = DENS_CLASSES[inv ? 'a' : 'real'];
        L.forEach(function(f){ vals[f.id] = densityClass(D.density[f.id], inv); });
        spec.legendTitle = inv ? 'People per km² (invented)' : 'People per 1,000 km² (invented)';
      }
      spec.values = vals; spec.noData = NO_DATA;
      spec.label = 'Choropleth map of ' + placeName(bid) + ': ' + spec.legendTitle.toLowerCase() + ', highest toward the ' + D.dir;
    } else if(render === 'dot'){
      var per = inv ? 20000 : Math.max(1, Math.round(Object.keys(D.people).reduce(function(s, k){ return s + D.people[k]; }, 0) / 320));
      spec.dots = { each: inv ? '1 dot = 20,000 people' : '1 dot = ' + nf(per) + ' people (invented units)', points: dotsFor(r, bid, D.people, per) };
      spec.legendTitle = 'Where people live (invented)';
      spec.label = 'Dot density map of ' + placeName(bid) + ': where people live, with dots clustered toward the ' + D.dir;
    } else if(render === 'symbol'){
      var big = markable(bid).sort(function(a, b){ return D.people[b.id] - D.people[a.id]; }).slice(0, inv ? 8 : 9);
      spec.symbols = { unit: inv ? 'thousand people' : 'invented units of people', items: big.map(function(f){ return { at: f.id, value: inv ? Math.round(D.people[f.id] / 1000) : D.people[f.id] }; }) };
      spec.legendTitle = 'Total people (invented)';
      spec.label = 'Graduated symbol map of ' + placeName(bid) + ': circles sized by the number of people in each place';
    } else if(render === 'isoline'){
      var xs = [110, 230, 320, 385, 430];
      spec.isolines = { unit: 'hours of travel to the capital', lines: isoLines(M.rng(77), [1, 2, 3, 4, 5].reverse(), xs).map(function(l, i){ l.labelAt = [0.2, 0.75, 0.3, 0.85, 0.5][i]; return l; }) };
      spec.legendTitle = 'Travel time by road (invented)';
      spec.label = 'Isoline map of Country A: lines of equal travel time, bunched together in the east';
      extra.xs = xs;
    } else if(render === 'reference'){
      spec.focus = (o.focus || []).slice(); spec.legendTitle = 'Highlighted places'; delete spec.invented;
      spec.label = 'Reference map of ' + placeName(bid) + ' with its borders' + (spec.focus.length ? ' and ' + spec.focus.length + ' places highlighted' : '');
    }
    if(o.marks) spec.marks = o.marks.map(function(id, i){ return { at: id, text: LETTERS[i] }; });
    var res = { spec: spec, table: table, data: D };
    if(render === 'cartogram') res.cartogram = cartogram(D.people);
    for(var k in extra) res[k] = extra[k];
    return res;
  }

  /* ------------------------------------------------------------ drills */
  var SK = { kind: '4.A', best: '1.A', klass: '3.A', top: '3.A', area: '3.E', pattern: '3.B', slip: '3.F', which: '3.A', why: '3.F', fix: '3.F', cannot: '3.F', fill: '3.F', range: '3.A', fast: '3.C', dense: '3.A' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '3.B' }; for(var k in o) s[k] = o[k]; return s; }
  function choice(key, label, opts, extra){ var s = step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 }); for(var k in extra || {}) s[k] = extra[k]; return s; }
  var TYPES = [
    { value: 'kind', label: 'Name the map type' },
    { value: 'legend', label: 'Read the legend' },
    { value: 'pattern', label: 'Name the pattern and the place' },
    { value: 'breaks', label: 'Spot a misleading map' },
    { value: 'limits', label: 'What the map cannot show' },
    { value: 'isoline', label: 'Read an isoline map' }
  ];
  function mapFig(spec, key, o){ var f = { kind: 'map', spec: spec, key: key || [] }; for(var k in o || {}) f[k] = o[k]; return f; }
  function keyLine(key){ return key.length ? '<p class="hug-mr-keyline">' + key.map(function(k){ return '<b>' + k.mark + '</b> ' + k.name; }).join(' · ') + '</p>' : ''; }

  /* A random thematic or reference map of the given render (for 'kind' and 'limits'). */
  function anyMap(r, bid, render){
    var dir = pick(r, ['north', 'south', 'east', 'west']), L = valued(bid);
    if(render === 'cartogram'){ var D = dataset('country-a', 1 + Math.floor(r() * 9999)); return { fig: { kind: 'cartogram', data: cartogram(D.people), title: 'People in each province of Country A (invented)' }, dir: dir }; }
    var spec = { base: bid, render: render, invented: true };
    if(render === 'choropleth'){
      var V = pick(r, RATE_VARS); spec.classes = V.classes; spec.values = trendClasses(r, bid, dir, 4); spec.legendTitle = V.title + ' (invented)'; spec.noData = NO_DATA;
      spec.label = 'Choropleth map of ' + placeName(bid) + ': ' + V.title.toLowerCase() + ', invented values highest toward the ' + dir;
    } else if(render === 'dot'){
      var CV = pick(r, COUNT_VARS), cnt = countValues(r, bid, dir), tot = Object.keys(cnt).reduce(function(s, k){ return s + cnt[k]; }, 0);
      spec.dots = { each: CV.each, points: dotsFor(r, bid, cnt, tot / 220) }; spec.legendTitle = CV.title + ' (invented)';
      spec.label = 'Dot density map of ' + placeName(bid) + ': ' + CV.title.toLowerCase() + ', dots clustered toward the ' + dir;
    } else if(render === 'symbol'){
      var SV = pick(r, COUNT_VARS), cs = countValues(r, bid, dir), big = markable(bid).sort(function(a, b){ return cs[b.id] - cs[a.id]; });
      var chosen = legibleMarks(bid, big.map(function(f){ return f.id; }), 6).map(function(m){ return m.at; });
      spec.symbols = { unit: SV.unit + ' (invented)', items: chosen.map(function(id){ return { at: id, value: cs[id] * 10 }; }) }; spec.legendTitle = SV.title + ' (invented)';
      spec.label = 'Graduated symbol map of ' + placeName(bid) + ': ' + SV.title.toLowerCase() + ', circles sized by amount';
    } else if(render === 'isoline'){
      var IV = pick(r, ISO_VARS), xs = isoXs(r), vals = isoVals(r, IV);
      spec.base = 'country-a'; spec.isolines = { unit: IV.unit, lines: isoLines(r, vals, xs) }; spec.legendTitle = IV.title + ' (invented)';
      spec.label = 'Isoline map of Country A: ' + IV.title.toLowerCase() + ', lines of equal value';
      placeIso(spec);
    } else {
      delete spec.invented;
      spec.focus = markable(bid).slice().sort(function(){ return r() - 0.5; }).slice(0, 3).map(function(f){ return f.id; }); spec.legendTitle = 'Highlighted places';
      spec.label = 'Reference map of ' + placeName(bid) + ' with borders and three places highlighted';
    }
    return { fig: mapFig(spec), dir: dir, L: L };
  }
  function again(msg){ var e = new Error('map-reader: ' + msg); e.retry = true; return e; }
  var LABEL_SETS = [[0.12, 0.88, 0.12, 0.88, 0.12], [0.88, 0.12, 0.88, 0.12, 0.88], [0.1, 0.9, 0.5, 0.1, 0.9], [0.9, 0.1, 0.5, 0.9, 0.1], [0.5, 0.1, 0.9, 0.5, 0.1], [0.3, 0.7, 0.3, 0.7, 0.3], [0.7, 0.3, 0.7, 0.3, 0.7]];
  /* Isoline labels placed where no two labels (or marks) touch at 360 px. */
  function placeIso(spec){
    var L = spec.isolines.lines, B = base('country-a');
    for(var t = 0; t < LABEL_SETS.length; t++){ L.forEach(function(l, i){ l.labelAt = LABEL_SETS[t][i % 5]; }); if(!MAP().check(spec, B).length) return spec; }
    throw again('isoline labels would touch');
  }
  function isoXs(r){ var a = 90 + r() * 30, gaps = [130, 95, 65, 42].map(function(g){ return g * (0.9 + r() * 0.2); }), xs = [a]; gaps.forEach(function(g){ xs.push(xs[xs.length - 1] + g); }); return xs.map(function(x){ return M.round(x, 1); }); }
  function isoVals(r, IV){ var step0 = IV.unit === '°C' ? 2 : IV.unit === 'hours of travel' ? 1 : 10, v0 = IV.unit === '°C' ? 14 + 2 * Math.floor(r() * 4) : IV.unit === 'hours of travel' ? 1 : 10 * (1 + Math.floor(r() * 3)); var up = r() < 0.5; var out = [0, 1, 2, 3, 4].map(function(i){ return v0 + i * step0; }); return up ? out : out.reverse(); }

  var GEN = {};
  /* Which map type, then what it shows best. */
  GEN.kind = function(r, c){
    var render = pick(r, c.renders || KIND_ORDER), bid = render === 'isoline' || render === 'cartogram' ? 'country-a' : pick(r, c.bases), m = anyMap(r, bid, render), K = KINDS[render];
    var text = '<p>Look at the map' + (render === 'cartogram' ? ' (a drawn figure of Country A, invented data for practice)' : '') + '. Read its legend before you answer.</p>';
    var slipWhy = {
      reference: 'A reference map shows where places are and has no data scale. This map has a legend with values.',
      choropleth: 'A choropleth shades whole areas from light to dark by class. Look for that before you choose it.',
      dot: 'A dot density map is made of many small dots, each standing for a set number.',
      symbol: 'A graduated symbol map has circles or other symbols sized by amount.',
      isoline: 'An isoline map has lines that join places with the same value, each line labeled.',
      cartogram: 'A cartogram redraws places so their size shows the data; shapes and areas are distorted.'
    };
    var steps = [
      choice('kind', 'What type of map is this?', KIND_ORDER.map(function(k){ return [KINDS[k].short, k === render ? 'Right. ' + KINDS[k].look + ': a ' + KINDS[k].name.toLowerCase() + '.' : 'Not this one. ' + slipWhy[k] + ' This map: ' + K.look.toLowerCase() + '.']; }), { fixed: true, correct: KIND_ORDER.indexOf(render) }),
      choice('best', 'What does a ' + K.name.toLowerCase() + ' show best?', [[cap(K.best) + '.', 'Right. That is what a ' + K.name.toLowerCase() + ' is for.']].concat(KIND_ORDER.filter(function(k){ return k !== render; }).sort(function(){ return r() - 0.5; }).slice(0, 3).map(function(k){ return [cap(KINDS[k].best) + '.', 'That is what a ' + KINDS[k].name.toLowerCase() + ' shows best.']; })))
    ];
    var sol = ['It is a ' + K.name.toLowerCase() + ': ' + K.look.toLowerCase() + '.', 'It shows best ' + K.best + '.', 'It cannot show ' + K.cannot + '.'];
    return { text: text, steps: steps, solution: sol, figure: m.fig, given: { render: render, base: bid } };
  };
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  /* Read a choropleth's legend at marked places, or a graduated symbol map's circles. */
  GEN.legend = function(r, c){
    var bid = pick(r, c.bases), symbol = (c.renders || ['choropleth'])[Math.floor(r() * (c.renders || ['choropleth']).length)] === 'symbol';
    if(symbol){
      var m = anyMap(r, bid, 'symbol'), sp = m.fig.spec, items = sp.symbols.items.slice(0, 4), marks = legibleMarks(bid, items.map(function(i){ return i.at; }), 4);
      if(marks.length < 3) throw again('not enough legible symbols');
      sp.marks = marks; var key = keyOf(bid, marks);
      var byId = {}; sp.symbols.items.forEach(function(i){ byId[i.at] = i.value; });
      var ranked = marks.slice().sort(function(a, b){ return byId[b.at] - byId[a.at]; }), top = ranked[0];
      if(byId[ranked[0].at] === byId[ranked[1].at]) byId[ranked[0].at] += 10;
      var opts = marks.map(function(mk){ return [mk.text + ' (' + nameOf(bid, mk.at) + ')', mk === top ? 'Right. Its circle is the largest, so its value is the largest.' : 'Its circle is smaller than ' + top.text + '’s. Compare the circles, not the size of the country.']; });
      var steps = [
        choice('top', 'Which marked place has the largest value?', opts, { fixed: true, correct: marks.indexOf(top) }),
        choice('area', 'On this map a circle’s AREA shows the value. One place has 4 times the value of another. How do their circles compare?', [
          ['Its circle has 4 times the area, so it is about twice as wide.', 'Right. Area grows with the square of the width: twice as wide is 4 times the area.'],
          ['Its circle is 4 times as wide.', 'A circle 4 times as wide has 16 times the area: that would mean 16 times the value.'],
          ['Its circle is the same size, because only the color changes.', 'On a graduated symbol map the size, not the color, shows the amount.'],
          ['Its circle is half as wide.', 'A larger value means a larger circle.']
        ])
      ];
      sp.symbols.items = sp.symbols.items.map(function(i){ return { at: i.at, value: byId[i.at] }; });
      return { text: '<p>The graduated symbol map shows invented data for practice. The letters mark four of the places.</p>' + keyLine(key), steps: steps,
        solution: [top.text + ' (' + nameOf(bid, top.at) + ') has the largest circle, so the largest value.', 'Circle area is proportional to the value: 4 times the value is 4 times the area and about 2 times the width.', 'Read the legend’s circles to estimate each value, then compare places by area, not by width.'],
        figure: mapFig(sp, key), given: { mode: 'symbol', base: bid, values: byId, marks: marks.map(function(x){ return x.at; }) } };
    }
    var V = pick(r, RATE_VARS), dir = pick(r, ['north', 'south', 'east', 'west']), cls = trendClasses(r, bid, dir, 4);
    // Four marked places: one in each class where possible, so the top is unique.
    var M4 = markable(bid).slice().sort(function(){ return r() - 0.5; }), cand = [];
    [3, 0, 2, 1].forEach(function(k){ M4.filter(function(f){ return cls[f.id] === k; }).forEach(function(f){ cand.push(f.id); }); });
    var byClass = {}; cand.forEach(function(id){ (byClass[cls[id]] = byClass[cls[id]] || []).push(id); });
    var order = []; for(var i = 0; i < 12; i++) [3, 0, 2, 1].forEach(function(k){ if(byClass[k] && byClass[k][i]) order.push(byClass[k][i]); });
    var marks = [], used = {};
    for(var j = 0; j < order.length && marks.length < 4; j++){ if(used[cls[order[j]]]) continue; var mm = legibleMarks(bid, marks.map(function(x){ return x.at; }).concat([order[j]]), 5); if(mm.length === marks.length + 1){ marks = mm; used[cls[order[j]]] = 1; } }
    if(marks.length < 3) throw again('legend drill could not place three marks on ' + bid);
    marks = marks.sort(function(){ return r() - 0.5; }).map(function(x, i){ return { at: x.at, text: LETTERS[i] }; });
    var spec = { base: bid, render: 'choropleth', invented: true, classes: V.classes, values: cls, legendTitle: V.title + ' (invented)', noData: NO_DATA, marks: marks,
      label: 'Choropleth map of ' + placeName(bid) + ': ' + V.title.toLowerCase() + ' (invented), with places ' + marks.map(function(x){ return x.text; }).join(', ') + ' marked' };
    var key = keyOf(bid, marks), ask = marks[Math.floor(r() * marks.length)], k = cls[ask.at], top = marks.slice().sort(function(a, b){ return cls[b.at] - cls[a.at]; })[0];
    var steps = [
      choice('klass', 'Which class is place ' + ask.text + ' (' + nameOf(bid, ask.at) + ') in?', V.classes.map(function(lab, i){ return [lab, i === k ? 'Right. Its shade matches that legend box.' : i === V.classes.length - 1 - k ? 'That is the class at the other end of the legend. Darker shades mean higher values here.' : 'Match the shade of ' + ask.text + ' with the legend boxes again.']; }), { fixed: true, correct: k }),
      choice('top', 'Which marked place has the highest value class?', marks.map(function(mk){ return [mk.text + ' (' + nameOf(bid, mk.at) + ')', mk === top ? 'Right. It has the darkest shade of the marked places: ' + V.classes[cls[mk.at]] + '.' : 'Its class is ' + V.classes[cls[mk.at]] + '. Find the darkest marked place.']; }), { fixed: true, correct: marks.indexOf(top) })
    ];
    var sol = ['Match each marked place’s shade with a legend box: ' + marks.map(function(mk){ return mk.text + ' is ' + V.classes[cls[mk.at]]; }).join('; ') + '.', top.text + ' (' + nameOf(bid, top.at) + ') is in the highest class of the marked places.', 'A class is a range: two places in one class may still have different values.'];
    return { text: '<p>The choropleth shows invented data for practice. The letters mark four places.</p>' + keyLine(key), steps: steps, solution: sol, figure: mapFig(spec, key), given: { mode: 'choropleth', base: bid, classes: cls, ask: ask.at, marks: marks.map(function(x){ return x.at; }) } };
  };

  /* Name the pattern WITH its place: the key names a direction and two
     marked places in the top class; distractors are the slips readers dock. */
  GEN.pattern = function(r, c){
    var bid = pick(r, c.bases), dir = pick(r, c.dirs || ['north', 'south', 'east', 'west']), V = pick(r, RATE_VARS), cls = trendClasses(r, bid, dir, 4, base(bid).invented ? 0.05 : 0.35), P = placeName(bid);
    var med = medianAlong(bid, dir);
    var mk = markable(bid), top = mk.filter(function(f){ return cls[f.id] === 3 && along(f, dir) > med; }).sort(function(a, b){ return along(b, dir) - along(a, dir); }), low = mk.filter(function(f){ return cls[f.id] === 0; }).sort(function(a, b){ return along(a, dir) - along(b, dir); });
    var pool = [];
    for(var i = 0; i < Math.max(top.length, low.length); i++){ if(top[i]) pool.push(top[i].id); if(low[i]) pool.push(low[i].id); }
    var marks = legibleMarks(bid, pool, 4), T = marks.filter(function(x){ return cls[x.at] === 3; }), Lo = marks.filter(function(x){ return cls[x.at] === 0; });
    if(T.length < 2 || Lo.length < 2) throw again('pattern drill needs two marked places at each end on ' + bid);
    marks = marks.sort(function(){ return r() - 0.5; }).map(function(x, i){ return { at: x.at, text: LETTERS[i] }; });
    T = marks.filter(function(x){ return cls[x.at] === 3; }).slice(0, 2); Lo = marks.filter(function(x){ return cls[x.at] === 0; }).slice(0, 2);
    var nm = function(x){ return nameOf(bid, x.at) + ' (' + x.text + ')'; };
    var big = mk.filter(function(f){ return cls[f.id] < 2; }).sort(function(a, b){ return geom(bid, b.id).area - geom(bid, a.id).area; })[0];
    var topMean = 0, nTop = 0; valued(bid).forEach(function(f){ if(cls[f.id] === 3){ topMean += along(f, dir); nTop++; } });
    if(!big || !(topMean / nTop > med)) throw again('the top class does not lean toward the ' + dir);
    var spec = { base: bid, render: 'choropleth', invented: true, classes: V.classes, values: cls, legendTitle: V.title + ' (invented)', noData: NO_DATA, marks: marks,
      label: 'Choropleth map of ' + P + ': ' + V.title.toLowerCase() + ' (invented), highest toward the ' + dir };
    var key = keyOf(bid, marks), v = V.title.split(' (')[0].toLowerCase();
    var steps = [
      choice('pattern', 'Which statement best describes the pattern on this map?', [
        ['Values are highest in the ' + dir + ' of ' + P + ', for example in ' + nm(T[0]) + ' and ' + nm(T[1]) + ', and lowest in the ' + OPP[dir] + '.', 'Right. It says where (a direction and named places) and what (high and low), the way a full-credit answer does.'],
        ['The values are clustered.', 'This names no place and no direction. Readers give no credit for “clustered” alone: say where.'],
        ['Values are highest in the ' + OPP[dir] + ', for example in ' + nm(Lo[0]) + ' and ' + nm(Lo[1]) + '.', 'That reverses the legend: the lightest shades are the lowest values on this map.'],
        ['Values are highest in the largest places, such as ' + big.name + '.', big.name + ' is in a lower class. A large area is not a high value: read the shade, not the size.']
      ]),
      choice('slip', 'Why would “the map shows a pattern of ' + v + '” earn no credit on the exam?', [
        ['It names no place and does not say where values are high or low.', 'Right. A pattern answer names the place and says how the values change across it.'],
        ['It is too long.', 'Length is not the problem; the missing place is.'],
        ['It should give the exact value for every place.', 'A pattern answer needs where and what, not every value.'],
        ['Maps cannot show patterns.', 'Thematic maps exist to show patterns; the answer must still name where.']
      ])
    ];
    var sol = ['Read the legend: darker means higher (' + V.classes[3] + ').', 'Find where the darkest shades sit: in the ' + dir + ' of ' + P + ', for example ' + nm(T[0]) + ' and ' + nm(T[1]) + '.', 'Say both ends: highest in the ' + dir + ', lowest in the ' + OPP[dir] + '. The data are invented: the pattern changes with every problem.'];
    return { text: '<p>The choropleth shows invented data for practice. The letters mark four places.</p>' + keyLine(key), steps: steps, solution: sol, figure: mapFig(spec, key), given: { base: bid, dir: dir, classes: cls, top: T.map(function(x){ return x.at; }), low: Lo.map(function(x){ return x.at; }), big: big.id } };
  };

  /* Spot a misleading choropleth on Country A, with the numbers in a table. */
  GEN.breaks = function(r, c){
    var mode = pick(r, c.modes || ['lumped', 'totals', 'gap']), B = base('country-a'), F = B.features, ids = F.map(function(f){ return f.id; });
    var name = function(id){ return nameOf('country-a', id); };
    if(mode === 'totals'){
      // Big provinces hold the most people but are the least crowded.
      var land = {}, people = {}, dens = {};
      F.forEach(function(f){ land[f.id] = Math.max(1000, Math.round(geom('country-a', f.id).area * 0.6 / 100) * 100); });
      var small = ids.slice().sort(function(a, b){ return land[a] - land[b]; });
      small.forEach(function(id, i){ dens[id] = [140, 95, 70, 55, 42, 34, 28, 22][i] + Math.floor(r() * 4); people[id] = Math.round(land[id] * dens[id] / 1000) * 1000; });
      // Make the biggest-total province one of the large ones.
      var maxT = ids.slice().sort(function(a, b){ return people[b] - people[a]; })[0], maxD = ids.slice().sort(function(a, b){ return calc('arithmeticDensity', [people[b], land[b]]) - calc('arithmeticDensity', [people[a], land[a]]); })[0];
      if(maxT === maxD){ var bigL = ids.slice().sort(function(a, b){ return land[b] - land[a]; })[0]; people[bigL] = people[maxD] + 60000; maxT = bigL; }
      var tq = quantile(F, function(f){ return people[f.id]; }, 4);
      var spec = { base: 'country-a', render: 'choropleth', invented: true, classes: ['Fewest people', 'Fewer', 'More', 'Most people'], values: tq, legendTitle: 'Total people in each province (invented)',
        label: 'Choropleth map of Country A shaded by the total number of people, so large provinces look darkest' };
      var others = ids.filter(function(id){ return id !== maxD && id !== maxT; }).sort(function(){ return r() - 0.5; }).slice(0, 2);
      var opts = [maxD, maxT].concat(others);
      var steps = [
        choice('dense', 'Which province is the most crowded (people per km²)? Use the table.', opts.map(function(id){ var d = calc('arithmeticDensity', [people[id], land[id]]); return [name(id), id === maxD ? 'Right. ' + nf(people[id]) + ' ÷ ' + nf(land[id]) + ' km² ≈ ' + nf(d, 0) + ' people per km², the highest.' : id === maxT ? 'It has the most people (the darkest shade), but it is large: ' + nf(d, 0) + ' people per km². Divide by the land area.' : nf(d, 0) + ' people per km²: not the highest.']; }), { correct: 0 }),
        choice('why', 'Why does this choropleth mislead about where people are crowded?', [
          ['It shades totals, so large provinces look darkest; a choropleth should show a rate, such as people per km².', 'Right. Totals belong on a dot or graduated symbol map. A choropleth of totals makes big areas look high.'],
          ['It uses too few colors.', 'Four classes are fine. The problem is that it maps totals, not a rate.'],
          ['The provinces are drawn at the wrong scale.', 'The outlines are fine. The problem is the measure being shaded.'],
          ['It should use one color for every province.', 'Then it would show nothing. Shade a rate instead of a total.']
        ])
      ];
      var tbl = { cols: ['Province', 'People', 'Land (km²)'], rows: ids.map(function(id){ return [name(id), nf(people[id]), nf(land[id])]; }) };
      return { text: '<p>A student shaded Country A by the total number of people in each province (invented data for practice). The table gives the numbers.</p>', steps: steps,
        solution: ['Density = people ÷ land: ' + name(maxD) + ' ≈ ' + nf(calc('arithmeticDensity', [people[maxD], land[maxD]]), 0) + ' people per km², the highest; ' + name(maxT) + ' has the most people but is large.', 'A choropleth of totals makes large areas look high. Shade a rate (people per km²) instead, or show totals with dots or graduated symbols.'],
        figure: mapFig(spec, [], { table: tbl }), given: { mode: mode, people: people, land: land, maxD: maxD, maxT: maxT } };
    }
    // lumped or gap: percent values in a table.
    var vals = {}, sorted = ids.slice().sort(function(){ return r() - 0.5; });
    var V0 = [3, 7, 14 + Math.floor(r() * 4), 31 + Math.floor(r() * 8), 52 + Math.floor(r() * 6), 71 + Math.floor(r() * 6), 84 + Math.floor(r() * 4), 95];
    if(mode === 'gap') V0 = [4, 11, 16, 20 + Math.floor(r() * 5), 38, 47, 63, 81];
    sorted.forEach(function(id, i){ vals[id] = V0[i]; });
    var title = 'Homes with internet access (%, invented)', cls = {}, classes, spec2;
    if(mode === 'lumped'){
      classes = ['0% to 9%', '10% to 89%', '90% to 100%'];
      ids.forEach(function(id){ var v = vals[id]; cls[id] = v < 10 ? 0 : v < 90 ? 1 : 2; });
      var mids = ids.filter(function(id){ return cls[id] === 1; }).sort(function(a, b){ return vals[a] - vals[b]; }), lo = mids[0], hi = mids[mids.length - 1];
      var near = ids.filter(function(id){ return cls[id] !== cls[lo]; })[0], mid2 = mids[1];
      spec2 = { base: 'country-a', render: 'choropleth', invented: true, classes: classes, values: cls, legendTitle: title, label: 'Choropleth map of Country A with uneven classes: one class spans 10% to 89%' };
      var steps2 = [
        choice('which', 'Which two provinces share one shade even though their values are far apart?', [
          [name(lo) + ' (' + vals[lo] + '%) and ' + name(hi) + ' (' + vals[hi] + '%)', 'Right. Both fall in the 10% to 89% class, so a gap of ' + (vals[hi] - vals[lo]) + ' points looks like no difference.'],
          [name(lo) + ' (' + vals[lo] + '%) and ' + name(mid2) + ' (' + vals[mid2] + '%)', 'They share a shade, but their values are closer than another pair in the same class.'],
          [name(lo) + ' (' + vals[lo] + '%) and ' + name(near) + ' (' + vals[near] + '%)', 'They are in different classes, so they have different shades.'],
          ['No two provinces share a shade.', 'Several provinces share the middle shade: look at the legend.']
        ]),
        choice('fix', 'Which change makes the map more honest?', [
          ['Use classes of about the same width, such as 0% to 24%, 25% to 49%, 50% to 74%, 75% to 100%.', 'Right. Even classes (or classes with about the same number of places) let real differences show.'],
          ['Use only two classes.', 'Fewer classes hide even more of the differences.'],
          ['Make the middle class wider.', 'It is already too wide: it hides most of the range.'],
          ['Leave the classes and add a north arrow.', 'A north arrow does not fix uneven classes.']
        ])
      ];
      return { text: '<p>A mapmaker shaded Country A by the share of homes with internet access (invented data for practice). The table gives each value.</p>', steps: steps2,
        solution: ['The middle class runs from 10% to 89%: ' + mids.length + ' of the 8 provinces get one shade, from ' + vals[lo] + '% to ' + vals[hi] + '%.', 'Choosing class breaks is choosing what the map shows. Uneven breaks can hide (or invent) a pattern. Even-width or equal-count classes are fairer.'],
        figure: mapFig(spec2, [], { table: { cols: ['Province', 'Homes with internet (%)'], rows: ids.map(function(id){ return [name(id), vals[id] + '%']; }) } }), given: { mode: mode, vals: vals, cls: cls, lo: lo, hi: hi, near: near } };
    }
    // gap: classes 0-19, 25-49, 50-100; one province falls in the gap.
    classes = ['0% to 19%', '25% to 49%', '50% to 100%'];
    var gapId = ids.filter(function(id){ return vals[id] >= 20 && vals[id] < 25; })[0];
    ids.forEach(function(id){ var v = vals[id]; if(id !== gapId) cls[id] = v < 20 ? 0 : v < 50 ? 1 : 2; });
    spec2 = { base: 'country-a', render: 'choropleth', invented: true, classes: classes, values: cls, legendTitle: title, noData: 'Fits no class', label: 'Choropleth map of Country A whose legend skips the values from 20% to 24%' };
    var steps3 = [
      choice('which', name(gapId) + ' has ' + vals[gapId] + '%. Which class does it belong to on this legend?', [
        ['None: the legend skips 20% to 24%, so it fits no class.', 'Right. The classes must meet: there is no class for 20% to 24%.'],
        ['0% to 19%', vals[gapId] + '% is more than 19%.'],
        ['25% to 49%', vals[gapId] + '% is less than 25%.'],
        ['50% to 100%', 'That class starts at 50%.']
      ], { fixed: true }),
      choice('fix', 'Which change fixes the legend?', [
        ['Make the classes meet with no gap, such as 0% to 19%, 20% to 49%, 50% to 100%.', 'Right. Every value then fits exactly one class.'],
        ['Shade ' + name(gapId) + ' like its neighbor.', 'That hides the problem; the legend still skips values.'],
        ['Delete ' + name(gapId) + ' from the map.', 'Leaving a place out to fit the legend misleads the reader.'],
        ['Add more provinces.', 'The gap is in the legend, not in the number of places.']
      ])
    ];
    steps3[0].correct = 0;
    return { text: '<p>A mapmaker shaded Country A by the share of homes with internet access (invented data for practice). The table gives each value.</p>', steps: steps3,
      solution: ['The legend has 0% to 19% and then 25% to 49%: nothing covers 20% to 24%, so ' + name(gapId) + ' (' + vals[gapId] + '%) fits no class.', 'Class breaks must cover every value exactly once. Check a legend for gaps and overlaps before you trust a map.'],
      figure: mapFig(spec2, [], { table: { cols: ['Province', 'Homes with internet (%)'], rows: ids.map(function(id){ return [name(id), vals[id] + '%']; }) } }), given: { mode: mode, vals: vals, cls: cls, gap: gapId } };
  };

  /* What a map cannot show, and what data would fill the gap. */
  var LIMITS = {
    choropleth: { cannot: function(x){ return 'Where inside ' + x + ' the values are highest'; }, fill: 'The same measure for smaller units inside it, such as provinces or districts', why: 'One shade covers the whole country, so differences inside it are hidden.' },
    dot: { cannot: function(){ return 'The rate per 1,000 people in each country'; }, fill: 'The population of each country, to divide the counts by', why: 'Dots count things. A rate needs the count divided by the population.' },
    symbol: { cannot: function(x){ return 'How the amount is spread out inside ' + x; }, fill: 'A dot density map or values for smaller units inside it', why: 'One circle sits on each place, so it shows a total, not where inside the place it is.' },
    reference: { cannot: function(){ return 'How many people live in each country'; }, fill: 'A thematic map of population, such as a dot density or graduated symbol map', why: 'A reference map shows where places are, with no data values.' },
    isoline: { cannot: function(){ return 'The exact value at a point between two lines'; }, fill: 'Measurements at more points, or lines at smaller steps', why: 'Between two lines you only know the value is in their range.' }
  };
  var TIME = { cannot: 'How the values have changed over the last 20 years', fill: 'The same map for an earlier year', why: 'A single map shows one moment.' };
  GEN.limits = function(r, c){
    var render = pick(r, c.renders || ['choropleth', 'dot', 'symbol', 'reference', 'isoline']), bid = render === 'isoline' ? 'country-a' : pick(r, c.bases), m = anyMap(r, bid, render), sp = m.fig.spec;
    var mk = markable(bid), x = render === 'isoline' ? 'Country A' : null;
    if(!x){ var pickF = (render === 'symbol' ? sp.symbols.items.map(function(i){ return MAP().feature(base(bid), i.at); }) : mk.slice().sort(function(a, b){ return geom(bid, b.id).area - geom(bid, a.id).area; }).slice(0, 5))[Math.floor(r() * 3)]; x = pickF.name; }
    var useTime = render !== 'reference' && render !== 'isoline' && r() < 0.3, Lm = LIMITS[render];
    var cant = useTime ? TIME.cannot : Lm.cannot(x), fill = useTime ? TIME.fill : Lm.fill, why = useTime ? TIME.why : Lm.why;
    var can = {
      choropleth: ['Which class ' + x + ' is in', 'Whether values are higher in the ' + m.dir + ' or the ' + OPP[m.dir] + ' of ' + placeName(bid), 'Which places are in the lowest class'],
      dot: ['Where the dots cluster most', 'Whether ' + x + ' has more dots than its neighbors', 'What one dot stands for'],
      symbol: ['Which place has the largest amount', 'About how large the amount is at ' + x, 'Which places have smaller amounts than ' + x],
      reference: ['Where ' + x + ' is', 'Which places are highlighted', 'Which countries share a border with ' + x],
      isoline: ['Between which two values a place lies', 'Where the value changes fastest', 'Which side of Country A has the higher values']
    }[render];
    var steps = [
      choice('cannot', 'Which question can this map NOT answer?', [[cant + '.', 'Right. ' + why]].concat(can.map(function(q){ return [q + '.', 'The map can answer this: ' + (render === 'reference' ? 'it shows where places are.' : 'read it from the ' + (render === 'isoline' ? 'lines and their labels.' : 'legend.'))]; }))),
      choice('fill', 'Which extra data would answer that question?', [
        [fill + '.', 'Right. ' + why],
        [render === 'reference' ? 'A larger version of the same reference map' : 'The same map with darker colors', 'Changing how this map looks adds no new data.'],
        ['A map of the same data at a smaller map scale, showing a wider area', 'A wider view shows less detail, not more.'],
        ['A compass rose and a title', 'Those help a reader, but they add no data.']
      ])
    ];
    var K = KINDS[render];
    return { text: '<p>Look at the ' + K.name.toLowerCase() + '. Every map leaves something out.</p>', steps: steps,
      solution: ['It is a ' + K.name.toLowerCase() + '. It shows best ' + K.best + '.', 'It cannot answer: ' + cant.toLowerCase() + '. ' + why, 'To answer it: ' + fill.toLowerCase() + '.'],
      figure: m.fig, given: { render: render, time: useTime, place: x } };
  };

  /* An isoline map of Country A: the range at a point, and where values change fastest. */
  GEN.isoline = function(r, c){
    var IV = pick(r, ISO_VARS), xs = isoXs(r), vals = isoVals(r, IV), lines = isoLines(r, vals, xs);
    // A sits between the two closest lines (the east), B between the two farthest (the west).
    var ya = 120 + Math.floor(r() * 140), yb = 120 + Math.floor(r() * 140);
    var xAt = function(l, y){ var p = l.points, best = p[0]; p.forEach(function(q){ if(Math.abs(q[1] - y) < Math.abs(best[1] - y)) best = q; }); return best[0]; };
    var ia = 3, ib = 0, pa = [M.round((xAt(lines[ia], ya) + xAt(lines[ia + 1], ya)) / 2, 1), ya], pb = [M.round((xAt(lines[ib], yb) + xAt(lines[ib + 1], yb)) / 2, 1), yb];
    var swap = r() < 0.5, A = swap ? pb : pa, Bp = swap ? pa : pb, iA = swap ? ib : ia, iB = swap ? ia : ib;
    var spec = { base: 'country-a', render: 'isoline', invented: true, isolines: { unit: IV.unit, lines: lines }, legendTitle: IV.title + ' (invented)', marks: [{ at: A, text: 'A' }, { at: Bp, text: 'B' }],
      label: 'Isoline map of Country A: ' + IV.title.toLowerCase() + ' (invented), with points A and B marked' };
    placeIso(spec);
    var rng = function(i){ var a = vals[i], b = vals[i + 1]; return [Math.min(a, b), Math.max(a, b)]; };
    var u = IV.unit === '°C' ? ' °C' : '', ra = rng(iA), opts = [0, 1, 2, 3].map(function(i){ var q = rng(i); return ['Between ' + q[0] + u + ' and ' + q[1] + u, i === iA ? 'Right. A lies between the lines labeled ' + q[0] + ' and ' + q[1] + '.' : 'Find the two lines on either side of A and read their labels.']; });
    var fastA = iA === 3;
    var steps = [
      choice('range', 'What is the value at point A?', opts, { fixed: true, correct: iA }),
      choice('fast', 'Where does the value change fastest?', [
        ['Near ' + (fastA ? 'A' : 'B') + ', where the lines are closest together.', 'Right. Lines close together mean a big change over a short distance.'],
        ['Near ' + (fastA ? 'B' : 'A') + ', where the lines are farthest apart.', 'Lines far apart mean the value changes slowly there.'],
        ['It changes at the same rate everywhere.', 'The lines are not evenly spaced, so the rate of change is not the same.'],
        ['Where the line labels are largest.', 'The labels give the values; the spacing of the lines gives the rate of change.']
      ])
    ];
    return { text: '<p>The isoline map shows ' + IV.title.toLowerCase() + ' across Country A (invented data for practice). Each line joins places with the same value.</p>', steps: steps,
      solution: ['A is between the lines labeled ' + ra[0] + ' and ' + ra[1] + ', so its value is in that range. The map cannot give the exact value between two lines.', 'The lines bunch together in the east: the value changes fastest there. Lines far apart mean slow change.'],
      figure: mapFig(spec, []), given: { xs: xs, vals: vals, A: A, B: Bp, iA: iA, iB: iB } };
  };

  function generate(r, ctx, type){
    var t = type && ctx.types && ctx.types.indexOf(type) > -1 ? type : (ctx.types || [])[0];
    var g = GEN[t];
    if(!g) throw new Error('map-reader: no generator for type "' + t + '"');
    // A draw that cannot be made legible (marks too close, too few places at
    // one end) is drawn again from the same seeded stream.
    var p = null, last = null;
    for(var k = 0; k < 40 && !p; k++){ try{ p = g(r, ctx); }catch(e){ if(!e.retry) throw e; last = e; } }
    if(!p) throw last;
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = t;
    return p;
  }
  /* The bases a set of contexts needs (the page fetches them before a drill). */
  function basesFor(contexts){ var s = { 'country-a': 1 }; (contexts || []).forEach(function(c){ (c.bases || []).forEach(function(b){ s[b] = 1; }); }); return Object.keys(s); }

  M.register('mapReader', {
    TYPES: TYPES, KINDS: KINDS, KIND_ORDER: KIND_ORDER, RATE_VARS: RATE_VARS, LETTERS: LETTERS, NO_DATA: NO_DATA,
    setBases: setBases, base: base, inside: inside, geom: geom, valued: valued, markable: markable, legibleMarks: legibleMarks,
    dataset: dataset, exploreSpec: exploreSpec, cartogram: cartogram, densityClass: densityClass, basesFor: basesFor, lineIndexAt: lineIndexAt, nf: nf,
    generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
