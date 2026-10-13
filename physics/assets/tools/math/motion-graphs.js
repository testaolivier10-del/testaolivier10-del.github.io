/* Motion graphs model: ApPhysMath.motionGraphs (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apphys-tool-checks/motion-graphs.mjs) and the test
   (scripts/test/apphys-tool-motion-graphs.test.mjs) run exactly this code.

   One straight track, x in meters along it (positive to the right, origin at
   the middle, the ends at -5 m and +5 m), time in seconds.

     motion(x0, v0, segs)        piecewise constant acceleration, segs =
                                 [{ dur, a }]; returns { at(t) -> { x, v, a },
                                 knots, end }. The last segment runs on.
     edgeTime(mo, T)             first time in [0, T] the cart reaches a track
                                 end (or T)
     sample(mo, T, dt)           { t, x, v, a } arrays on a time grid
     resample(ts, xs, T, dt)     a recording (any times) onto the grid
     derive(t, x)                { v, a } measured from positions the way a
                                 motion detector does: least-squares slopes
                                 over a short window (v over ±0.15 s, a over
                                 ±0.25 s), so a dragged cart gives honest,
                                 noisy graphs
     slopeAt(t, y, at, half)     least-squares slope of y(t) near `at`
     areaTo(t, y, t0, t1)        signed area under y(t) (trapezoids)
     plArea(pts, t0, t1, abs)    exact area under a piecewise-linear graph
                                 (abs: count area below the axis as positive)
     describe(v, a)              { dir: 1|-1|0, change: 'up'|'down'|'const'|
                                 'rest'|'turn', text }: the motion in words
     score(kind, target, t, y)   { score 0-100, rms, worst: { t0, t1, sign } }
                                 for "Match the graph"
     generate(rng, ctx, type?)   a seeded "Test yourself" problem: types slope,
                                 area, pick, describe, signs, turn, dist
   Every number is SI. */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;
  var TRACK = { min: -5, max: 5 }, WINDOW = 10, DT = 0.05;
  var REL = 0.02, ABS = 0.011;

  /* ------------------------------------------------------------ the model */
  function motion(x0, v0, segs){
    segs = segs || [];
    var knots = [{ t: 0, x: x0, v: v0 }], t = 0, x = x0, v = v0;
    segs.forEach(function(s){ var d = s.dur; x = x + v * d + 0.5 * s.a * d * d; v = v + s.a * d; t += d; knots.push({ t: t, x: x, v: v }); });
    function at(tt){
      if(!segs.length) return { t: tt, x: x0 + v0 * tt, v: v0, a: 0 };
      var i = 0;
      while(i < segs.length - 1 && tt > knots[i + 1].t + 1e-12) i++;
      var k = knots[i], d = tt - k.t, a = segs[i].a;
      return { t: tt, x: k.x + k.v * d + 0.5 * a * d * d, v: k.v + a * d, a: a };
    }
    return { x0: x0, v0: v0, segs: segs, knots: knots, at: at, end: t };
  }
  function edgeTime(mo, T){
    var out = function(t){ var x = mo.at(t).x; return x <= TRACK.min + 1e-9 || x >= TRACK.max - 1e-9; };
    if(out(0)) return 0;
    var step = 0.01, t = 0;
    while(t < T){
      var t2 = Math.min(T, t + step);
      if(out(t2)){ var lo = t, hi = t2; for(var k = 0; k < 40; k++){ var mid = (lo + hi) / 2; if(out(mid)) hi = mid; else lo = mid; } return hi; }
      t = t2;
    }
    return T;
  }
  function sample(mo, T, dt){
    dt = dt || DT;
    var o = { t: [], x: [], v: [], a: [] }, n = Math.round(T / dt);
    for(var i = 0; i <= n; i++){ var t = Math.min(T, i * dt), s = mo.at(t); o.t.push(t); o.x.push(s.x); o.v.push(s.v); o.a.push(s.a); }
    if(o.t[o.t.length - 1] < T - 1e-9){ var e = mo.at(T); o.t.push(T); o.x.push(e.x); o.v.push(e.v); o.a.push(e.a); }
    return o;
  }
  function interp(ts, ys, t){
    if(!ts.length) return NaN;
    if(t <= ts[0]) return ys[0];
    if(t >= ts[ts.length - 1]) return ys[ys.length - 1];
    var lo = 0, hi = ts.length - 1;
    while(hi - lo > 1){ var m = (lo + hi) >> 1; if(ts[m] <= t) lo = m; else hi = m; }
    var f = (t - ts[lo]) / ((ts[hi] - ts[lo]) || 1);
    return ys[lo] + f * (ys[hi] - ys[lo]);
  }
  function resample(ts, xs, T, dt){
    dt = dt || DT;
    var o = { t: [], x: [] }, n = Math.floor(T / dt + 1e-9);
    for(var i = 0; i <= n; i++){ o.t.push(i * dt); o.x.push(interp(ts, xs, i * dt)); }
    return o;
  }
  function slopeAt(t, y, at, half){
    var n = 0, st = 0, sy = 0, stt = 0, sty = 0;
    for(var i = 0; i < t.length; i++){
      if(Math.abs(t[i] - at) > half + 1e-9) continue;
      n++; st += t[i]; sy += y[i]; stt += t[i] * t[i]; sty += t[i] * y[i];
    }
    var den = n * stt - st * st;
    return n < 2 || Math.abs(den) < 1e-12 ? 0 : (n * sty - st * sy) / den;
  }
  function derive(t, x){
    var v = t.map(function(tt){ return slopeAt(t, x, tt, 0.15); });
    var a = t.map(function(tt){ return slopeAt(t, v, tt, 0.25); });
    return { v: v, a: a };
  }
  function areaTo(t, y, t0, t1){
    if(t1 < t0) return -areaTo(t, y, t1, t0);
    var s = 0, prevT = t0, prevY = interp(t, y, t0);
    for(var i = 0; i < t.length; i++){
      if(t[i] <= t0) continue;
      if(t[i] >= t1) break;
      s += (t[i] - prevT) * (y[i] + prevY) / 2; prevT = t[i]; prevY = y[i];
    }
    var yEnd = interp(t, y, t1);
    return s + (t1 - prevT) * (yEnd + prevY) / 2;
  }
  /* pts: [[t, y], ...] joined by straight lines. */
  function plArea(pts, t0, t1, abs){
    var s = 0;
    for(var i = 0; i < pts.length - 1; i++){
      var a = Math.max(t0, pts[i][0]), b = Math.min(t1, pts[i + 1][0]);
      if(b <= a) continue;
      var f = function(t){ return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); };
      var ya = f(a), yb = f(b);
      if(abs && ya * yb < 0){ var tz = a + (b - a) * ya / (ya - yb); s += Math.abs(ya) * (tz - a) / 2 + Math.abs(yb) * (b - tz) / 2; }
      else s += abs ? Math.abs((ya + yb) / 2 * (b - a)) : (ya + yb) / 2 * (b - a);
    }
    return s;
  }
  function plAt(pts, t){
    for(var i = 0; i < pts.length - 1; i++) if(t <= pts[i + 1][0] + 1e-12) return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
    return pts[pts.length - 1][1];
  }

  var DIRW = { '1': 'the + direction', '-1': 'the − direction' };
  function describe(v, a, ev, ea){
    ev = ev == null ? 0.05 : ev; ea = ea == null ? 0.05 : ea;
    var dir = Math.abs(v) < ev ? 0 : v > 0 ? 1 : -1;
    var ad = Math.abs(a) < ea ? 0 : a > 0 ? 1 : -1;
    if(!dir) return ad ? { dir: 0, change: 'turn', text: 'Momentarily at rest, starting to move in ' + DIRW[ad] } : { dir: 0, change: 'rest', text: 'At rest' };
    var change = !ad ? 'const' : ad === dir ? 'up' : 'down';
    return { dir: dir, change: change, text: 'Moving in ' + DIRW[dir] + ', ' + { up: 'speeding up', down: 'slowing down', 'const': 'at a steady speed' }[change] };
  }
  /* Match the graph: RMS difference over the target's time; 0 to 100. */
  var SCALE = { x: 2, v: 1.2 };
  function score(kind, target, t, y){
    if(!t.length) return { score: 0, rms: Infinity, worst: null };
    var se = 0, bins = {};
    for(var i = 0; i < t.length; i++){
      var e = y[i] - target(t[i]); se += e * e;
      var b = Math.floor(t[i]); (bins[b] = bins[b] || []).push(e);
    }
    var rms = Math.sqrt(se / t.length), worst = null;
    Object.keys(bins).forEach(function(b){
      var m = bins[b].reduce(function(s, e){ return s + e; }, 0) / bins[b].length;
      if(!worst || Math.abs(m) > Math.abs(worst.mean)) worst = { t0: +b, t1: +b + 1, mean: m, sign: m > 0 ? 1 : -1 };
    });
    return { score: Math.max(0, Math.min(100, Math.round(100 * (1 - rms / SCALE[kind])))), rms: rms, worst: worst };
  }

  /* ------------------------------------------------------- text helpers */
  function F(x, d){ return M.minus(M.fixed(x, d)); }
  function S(x, d){ var s = F(x, d); return x > 0 && Number(M.fixed(x, d)) !== 0 ? '+' + s : s; }
  function dOf(x){ var a = Math.abs(x); if(a < 1e-9) return 2; return Math.max(0, Math.min(3, 2 - Math.floor(Math.log10(a) + 1e-12))); }
  /* A number as the problem prints it: the fewest decimals that are exact. */
  function N(x){ for(var d = 0; d < 4; d++) if(Math.abs(M.round(x, d) - x) < 1e-9) return F(x, d); return M.fmt(x, 3); }
  /* N with an explicit + on a positive value. */
  function SN(x){ var s = N(x); return x > 0 && s !== '0' ? '+' + s : s; }
  /* A sum of signed terms read naturally: "1 + 0.5 − 6". */
  function sumText(list){ return list.map(function(x, i){ var s = N(Math.abs(x)); return i === 0 ? N(x) : (x < 0 ? '− ' : '+ ') + s; }).join(' '); }
  function num(key, label, answer, unit, mistakes, practice, hint){
    var s = { key: key, kind: 'num', label: label, cell: M.cell(answer, REL, mistakes || [], ABS), unit: unit, d: dOf(answer), practice: practice || '2.B' };
    if(hint) s.hint = hint;
    return s;
  }
  function choice(key, label, options, correct, why, practice, fixed){
    return { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice || '3.B', fixed: !!fixed };
  }
  function pts(list, unit){ return list.map(function(p){ return '(' + N(p[0]) + ' s, ' + N(p[1]) + ' ' + unit + ')'; }).join(', '); }
  var NAME = { x: 'position-time', v: 'velocity-time', a: 'acceleration-time' };
  var UNIT = { x: 'm', v: 'm/s', a: 'm/s²' };
  function fig(kind, line, o){
    o = o || {};
    var f = { kind: kind, pts: line, tmax: o.tmax || line[line.length - 1][0], ymin: o.ymin, ymax: o.ymax, step: o.step || 1, hl: o.hl || null, mark: o.mark == null ? null : o.mark, curve: o.curve || null, shade: o.shade || null };
    f.label = 'A ' + NAME[kind] + ' graph' + (o.curve ? ' (a smooth curve)' : ', straight segments through ' + pts(line, UNIT[kind])) + (o.mark != null ? '. The marked moment is t = ' + N(o.mark) + ' s' : '') + '.';
    return f;
  }

  /* ------------------------------------------------------- generators */
  var G = {};

  /* Velocity from the slope of a position-time graph. */
  G.slope = function(r){
    for(var tries = 0; tries < 500; tries++){
      var ts = [0], xs = [r.int(-4, 4)], t = 0;
      for(var i = 0; i < 3; i++){ t += r.int(1, 4); ts.push(t); xs.push(r.int(-4, 4)); }
      if(t > 10) continue;
      var k = r.int(0, 2), dx = xs[k + 1] - xs[k], dt = ts[k + 1] - ts[k];
      if(dx === 0 && r() < 0.8) continue;
      if(xs.every(function(x){ return x === xs[0]; })) continue;
      var v = dx / dt, line = ts.map(function(tt, j){ return [tt, xs[j]]; });
      var ms = [{ value: dx, why: 'That is Δx alone. Divide by Δt, the ' + dt + ' s the segment lasts.' }];
      if(dx) ms.push({ value: dt / dx, why: 'That is Δt/Δx, upside down. Velocity is the slope: the change in position (rise) over the change in time (run).' });
      if(ts[k + 1]) ms.push({ value: xs[k + 1] / ts[k + 1], why: 'That is the position divided by the clock reading. Use the change in position over the change in time on this segment only.' });
      var dirK = dx > 0 ? 0 : dx < 0 ? 1 : 2;
      var a = ts[k], b = ts[k + 1];
      return {
        type: 'slope', fig: fig('x', line, { ymin: -5, ymax: 5, hl: [k] }),
        text: '<p>A cart moves along a straight track. The position-time graph shows its position x (positive to the right). What is its velocity between t = ' + a + ' s and t = ' + b + ' s?</p>',
        steps: [
          num('v', 'Velocity from t = ' + a + ' s to t = ' + b + ' s', v, 'm/s', ms, '2.B', 'Slope = Δx ÷ Δt on that segment. Keep the sign.'),
          choice('dir', 'Which way is the cart moving then?', ['In the + direction (to the right)', 'In the − direction (to the left)', 'It is at rest'], dirK, [
            'The line rises: x increases, so the slope (velocity) is positive.',
            'The line falls: x decreases, so the slope (velocity) is negative.',
            'The line is flat: x does not change, so the velocity is zero.'
          ], '3.B', true)
        ],
        solution: [
          'Read the ends of the segment: x = ' + N(xs[k]) + ' m at t = ' + a + ' s and x = ' + N(xs[k + 1]) + ' m at t = ' + b + ' s.',
          'v = Δx ÷ Δt = (' + N(xs[k + 1]) + ' m − ' + (xs[k] < 0 ? '(' + N(xs[k]) + ' m)' : N(xs[k]) + ' m') + ') ÷ (' + b + ' s − ' + a + ' s) = ' + SN(dx) + ' m ÷ ' + dt + ' s = ' + SN(v) + ' m/s.',
          dx ? 'The sign says the direction: ' + (dx > 0 ? 'positive, to the right.' : 'negative, to the left.') : 'A flat segment has zero slope: the cart is at rest.'
        ],
        values: { ts: ts, xs: xs, k: k, v: v }
      };
    }
    throw new Error('motion-graphs: no slope problem');
  };

  /* Displacement and distance from the area under a velocity-time graph. */
  G.area = function(r){
    for(var tries = 0; tries < 500; tries++){
      var n = r.int(3, 4), ts = [0], vs = [r.int(-3, 3)], t = 0;
      for(var i = 0; i < n; i++){ t += r.int(1, 3); ts.push(t); vs.push(r.int(-3, 3)); }
      if(t > 9) continue;
      var i0 = r.int(0, n - 2), i1 = r.int(i0 + 2, n), t0 = ts[i0], t1 = ts[i1];
      var line = ts.map(function(tt, j){ return [tt, vs[j]]; });
      var disp = plArea(line, t0, t1), dist = plArea(line, t0, t1, true);
      if(Math.abs(disp) < 0.5) continue;
      var v0 = vs[i0], v1 = vs[i1], cross = Math.abs(dist - Math.abs(disp)) > 1e-9;
      var dm = [
        { value: v1 * (t1 - t0), why: 'That is the final velocity times the time, one rectangle. The area under a sloped line is a triangle or a trapezoid.' },
        { value: (v1 - v0) / (t1 - t0), why: 'That is the slope of the graph, which gives acceleration. Displacement is the area under the graph.' }
      ].filter(function(m){ return m.value !== 0; });
      if(cross) dm.unshift({ value: dist, why: 'That counts the area below the axis as positive, which gives the distance. For displacement, area below the axis is negative.' });
      else if(disp < 0) dm.unshift({ value: -disp, why: 'The whole graph is below the axis, so the cart moves in the − direction the whole time: area below the axis counts as negative, and the displacement is negative.' });
      var steps = [num('dx', 'Displacement from t = ' + t0 + ' s to t = ' + t1 + ' s', disp, 'm', dm, '2.B', 'Area between the graph and the t-axis; area below the axis counts as negative.')];
      var sol = ['Split the region from t = ' + t0 + ' s to t = ' + t1 + ' s into triangles and rectangles along the segments.'];
      // One piece per segment, split where the line crosses v = 0, so each piece is
      // all above or all below the axis (a triangle, rectangle or trapezoid).
      var parts = [];
      for(var s = i0; s < i1; s++){
        var ya = vs[s], yb = vs[s + 1];
        if(ya * yb < 0){ var tz = ts[s] + (ts[s + 1] - ts[s]) * ya / (ya - yb); parts.push(plArea(line, ts[s], tz), plArea(line, tz, ts[s + 1])); }
        else parts.push(plArea(line, ts[s], ts[s + 1]));
      }
      parts = parts.filter(function(x){ return Math.abs(x) > 1e-12; });
      // Keep the pieces readable: every area a multiple of 0.25 m.
      if(parts.some(function(x){ return Math.abs(x * 4 - Math.round(x * 4)) > 1e-9; })) continue;
      sol.push('Signed areas, segment by segment (in m): ' + sumText(parts) + ' = ' + SN(disp) + ' m. That is the displacement.');
      if(cross){
        steps.push(num('dist', 'Distance traveled from t = ' + t0 + ' s to t = ' + t1 + ' s', dist, 'm', [{ value: disp, why: 'That is the displacement. Distance counts the area below the axis as positive too, since the cart covers that ground as well.' }, { value: Math.abs(disp), why: 'That is the size of the displacement. Add every area as positive, including the part where the cart moved backward.' }], '2.B', 'Every area counts as positive.'));
        sol.push('The graph crosses v = 0, so the cart turns around. Distance adds every area as positive: ' + parts.map(function(x){ return N(Math.abs(x)); }).join(' + ') + ' = ' + N(dist) + ' m.');
      } else {
        var vav = disp / (t1 - t0), mi = [];
        if(Math.abs((v0 + v1) / 2 - vav) > 0.05) mi.push({ value: (v0 + v1) / 2, why: 'That averages the two end velocities, which works only when the graph is one straight line. Use displacement ÷ time.' });
        steps.push(num('vav', 'Average velocity from t = ' + t0 + ' s to t = ' + t1 + ' s', vav, 'm/s', mi, '2.B', 'Average velocity = displacement ÷ time interval.'));
        sol.push('The graph does not cross v = 0, so distance equals the size of the displacement. Average velocity = ' + SN(disp) + ' m ÷ ' + (t1 - t0) + ' s = ' + SN(vav) + ' m/s.');
      }
      return {
        type: 'area', fig: fig('v', line, { ymin: -3.5, ymax: 3.5, step: 1, shade: [t0, t1] }),
        text: '<p>A cart moves along a straight track (positive to the right). The velocity-time graph shows its velocity v. Use the area under the graph between t = ' + t0 + ' s and t = ' + t1 + ' s.</p>',
        steps: steps, solution: sol, values: { ts: ts, vs: vs, t0: t0, t1: t1, disp: disp, dist: dist }
      };
    }
    throw new Error('motion-graphs: no area problem');
  };

  /* Pick the acceleration-time graph for a velocity-time graph. */
  G.pick = function(r){
    for(var tries = 0; tries < 500; tries++){
      var ts = [0, 2, 4, 6], vs = [r.int(-3, 3)];
      for(var i = 0; i < 3; i++) vs.push(r.int(-3, 3));
      var a = [0, 1, 2].map(function(k){ return (vs[k + 1] - vs[k]) / 2; });
      if(a.every(function(x){ return x === 0; })) continue;
      var sw = r.int(0, 1), sw2 = sw + 1 + (r() < 0.5 ? 0 : 1); if(sw2 > 2) sw2 = 2;
      var swapped = a.slice(); var tmp = swapped[sw]; swapped[sw] = swapped[sw2]; swapped[sw2] = tmp;
      var neg = a.map(function(x){ return x === 0 ? 0 : -x; });
      var key = function(l){ return l.join(','); };
      if(key(swapped) === key(a) || key(neg) === key(a) || key(swapped) === key(neg)) continue;
      if(key(vs.slice(1)) === key(a)) continue;
      var line = ts.map(function(tt, j){ return [tt, vs[j]]; });
      var stepTxt = function(l){ return 'Steps at ' + l.map(function(x){ return S(x, 1); }).join(', ') + ' m/s²'; };
      var options = [stepTxt(a), stepTxt(neg), 'The same shape as the v-t graph', stepTxt(swapped)];
      var graphs = [{ type: 'steps', a: a }, { type: 'steps', a: neg }, { type: 'line', pts: line }, { type: 'steps', a: swapped }];
      var why = [
        'Right. Each straight segment of v-t has a constant slope, so a-t is flat on that segment at the value of the slope: ' + a.map(function(x, k){ return S(x, 1) + ' m/s² from ' + ts[k] + ' s to ' + ts[k + 1] + ' s'; }).join('; ') + '.',
        'Every sign is flipped. A segment that rises on v-t has a positive slope, so its acceleration is positive.',
        'That copies the v-t graph. Acceleration is the slope of v-t, not its value: a constant slope gives a flat a-t line.',
        'Two segments are swapped. Take the slope of each v-t segment in order: from ' + ts[sw] + ' s to ' + ts[sw + 1] + ' s it is ' + S(a[sw], 1) + ' m/s².'
      ];
      return {
        type: 'pick', fig: fig('v', line, { ymin: -3.5, ymax: 3.5, step: 1, tmax: 6 }),
        text: '<p>The velocity-time graph shows a cart on a straight track. Which acceleration-time graph goes with it?</p>',
        graphs: graphs, range: Math.max(2, Math.ceil(Math.max.apply(null, a.concat(neg, vs).map(Math.abs)) + 0.5)),
        steps: [choice('at', 'Pick the acceleration-time graph that matches', options, 0, why, '1.C')],
        solution: [
          'On each straight segment of v-t the slope is constant, so a is constant there: a = Δv ÷ Δt.',
          a.map(function(x, k){ return 'From ' + ts[k] + ' s to ' + ts[k + 1] + ' s: (' + N(vs[k + 1]) + ' − ' + (vs[k] < 0 ? '(' + N(vs[k]) + ')' : N(vs[k])) + ') m/s ÷ 2 s = ' + S(x, 1) + ' m/s².'; }).join(' '),
          'So a-t is three flat steps at those values. A v-t graph below the axis can still have a positive slope.'
        ],
        values: { vs: vs, a: a }
      };
    }
    throw new Error('motion-graphs: no pick problem');
  };

  /* Describe the motion at a marked moment, from x-t or v-t. */
  var STATES = [
    { dir: 1, change: 'up' }, { dir: 1, change: 'down' }, { dir: -1, change: 'up' }, { dir: -1, change: 'down' }, { dir: 1, change: 'const' }, { dir: -1, change: 'const' }
  ];
  function stateText(s){ return 'Moving in ' + DIRW[s.dir] + ' and ' + { up: 'speeding up', down: 'slowing down', 'const': 'at a steady speed' }[s.change]; }
  G.describe = function(r){
    for(var tries = 0; tries < 500; tries++){
      var kind = r() < 0.5 ? 'x' : 'v', x0, v0, a, ts = 6, tm = r.int(1, 5), line, curve = null;
      if(kind === 'v'){ v0 = r.int(-3, 3); a = r.pick([-1, -0.5, 0, 0.5, 1]); x0 = 0; line = [[0, v0], [ts, v0 + a * ts]]; if(Math.abs(v0 + a * ts) > 3.5) continue; }
      else {
        x0 = r.int(-2, 2); v0 = r.pick([-1.5, -1, -0.5, 0, 0.5, 1, 1.5]); a = r.pick([-0.5, -0.25, 0, 0.25, 0.5]);
        var ok = true; curve = [];
        for(var k = 0; k <= 60; k++){ var tt = k * ts / 60, xx = x0 + v0 * tt + 0.5 * a * tt * tt; if(Math.abs(xx) > 4.8) ok = false; curve.push([tt, xx]); }
        if(!ok) continue;
        line = [[0, x0], [ts, x0 + v0 * ts + 0.5 * a * ts * ts]];
      }
      var v = v0 + a * tm, xm = x0 + v0 * tm + 0.5 * a * tm * tm;
      if(Math.abs(v) < 0.3) continue;
      var st = describe(v, a, 0.01, 0.01);
      var right = STATES.filter(function(s){ return s.dir === st.dir && s.change === st.change; })[0];
      // Distractors from the common confusions first.
      var cand = [];
      var add = function(s){ if(s && s !== right && cand.indexOf(s) < 0) cand.push(s); };
      var find = function(dir, change){ return STATES.filter(function(s){ return s.dir === dir && s.change === change; })[0]; };
      var flip = { up: 'down', down: 'up', 'const': 'up' };
      add(find(st.dir, flip[st.change]));
      if(kind === 'x' && xm !== 0) add(find(xm > 0 ? 1 : -1, st.change));
      if(kind === 'v') add(find(st.dir, a > 0 ? 'up' : a < 0 ? 'down' : 'const'));
      add(find(-st.dir, st.change));
      add(find(-st.dir, flip[st.change]));
      STATES.forEach(add);
      var opts = [right].concat(cand.slice(0, 3));
      var reason = kind === 'x'
        ? { dir: 'the slope of x-t at t = ' + tm + ' s is ' + (v > 0 ? 'positive' : 'negative'), chg: a === 0 ? 'the graph is a straight line, so the slope (velocity) does not change' : 'the graph curves ' + (a > 0 ? 'upward' : 'downward') + ', so the slope is ' + (a > 0 ? 'increasing' : 'decreasing') + ' and a is ' + (a > 0 ? 'positive' : 'negative') }
        : { dir: 'v is ' + (v > 0 ? 'above' : 'below') + ' the axis (' + S(v, 1) + ' m/s)', chg: a === 0 ? 'the line is flat, so v does not change' : 'the slope of v-t is ' + (a > 0 ? 'positive' : 'negative') + ', so a is ' + (a > 0 ? 'positive' : 'negative') };
      var whyOf = function(s){
        if(s === right) return 'Right: ' + reason.dir + ', so it moves in ' + DIRW[st.dir] + '; ' + reason.chg + (st.change === 'const' ? '.' : '. v and a have ' + (st.change === 'up' ? 'the same sign, so it speeds up.' : 'opposite signs, so it slows down.'));
        var bits = [];
        if(s.dir !== st.dir) bits.push('Direction: ' + reason.dir + ', so it moves in ' + DIRW[st.dir] + (kind === 'x' ? ' (the sign of x says where it is, not which way it goes)' : '') + '.');
        if(s.change !== st.change) bits.push(st.change === 'const' ? 'Its speed is not changing: ' + reason.chg + '.' : 'Speeding up means v and a have the same sign; here ' + reason.chg + ' while v is ' + (v > 0 ? 'positive' : 'negative') + ', so it is ' + (st.change === 'up' ? 'speeding up' : 'slowing down') + '.');
        return bits.join(' ');
      };
      var aK = a > 0 ? 0 : a < 0 ? 1 : 2;
      return {
        type: 'describe', fig: fig(kind, line, { ymin: kind === 'x' ? -5 : -3.5, ymax: kind === 'x' ? 5 : 3.5, tmax: ts, mark: tm, curve: curve }),
        text: '<p>The ' + NAME[kind] + ' graph shows a cart on a straight track (positive to the right). Describe its motion at the marked moment, t = ' + tm + ' s.</p>',
        steps: [
          choice('motion', 'At t = ' + tm + ' s the cart is…', opts.map(stateText), 0, opts.map(whyOf), '3.B'),
          choice('asign', 'What is the sign of its acceleration at t = ' + tm + ' s?', ['Positive', 'Negative', 'Zero'], aK, [
            (a > 0 ? 'Right: ' : 'Not positive: ') + reason.chg + '.',
            (a < 0 ? 'Right: ' : 'Not negative: ') + reason.chg + '.' + (a < 0 || kind !== 'v' || v >= 0 ? '' : ' Being below the axis does not make a negative.'),
            (a === 0 ? 'Right: ' + reason.chg + ', so a = 0.' : 'Not zero: ' + reason.chg + '.')
          ], '3.B', true)
        ],
        solution: [
          kind === 'x' ? 'Velocity is the slope of x-t. At t = ' + tm + ' s the slope is ' + S(v, 2) + ' m/s, so the cart moves in ' + DIRW[st.dir] + '.' : 'At t = ' + tm + ' s, v = ' + S(v, 1) + ' m/s, so the cart moves in ' + DIRW[st.dir] + '.',
          kind === 'x' ? (a === 0 ? 'The graph is straight, so v is constant and a = 0.' : 'The graph curves ' + (a > 0 ? 'upward (concave up)' : 'downward (concave down)') + ', so a = ' + S(a, 2) + ' m/s².') : 'a is the slope of v-t: ' + S(a, 1) + ' m/s².',
          st.change === 'const' ? 'With a = 0 the speed does not change.' : 'v and a have ' + (st.change === 'up' ? 'the same sign: speeding up.' : 'opposite signs: slowing down.')
        ],
        values: { kind: kind, x0: x0, v0: v0, a: a, tm: tm, v: v }
      };
    }
    throw new Error('motion-graphs: no describe problem');
  };

  /* Sign conventions: velocity, acceleration, average acceleration (no graph). */
  var AXES = [['east', 'west'], ['right', 'left'], ['north', 'south'], ['up the slope', 'down the slope']];
  var WHO = ['A cart', 'A cyclist', 'A train', 'A skateboarder', 'A runner'];
  G.signs = function(r){
    var ax = r.pick(AXES), pos = r.int(0, 1), posName = ax[pos], who = r.pick(WHO);
    if(r() < 0.35){
      // Turning around: moving one way, later the other way.
      var d1 = r.int(0, 1), v1 = r.int(2, 8), v2 = r.int(1, 6), dt = r.int(2, 8);
      var s1 = d1 === pos ? 1 : -1, vi = s1 * v1, vf = -s1 * v2, dv = vf - vi, a = dv / dt;
      return {
        type: 'signs', variant: 'turn',
        text: '<p>Take ' + posName + ' as the positive direction. ' + who + ' moves ' + ax[d1] + ' at ' + v1 + ' m/s. ' + dt + ' s later it moves ' + ax[1 - d1] + ' at ' + v2 + ' m/s.</p>',
        steps: [
          num('dv', 'Change in velocity, Δv = v<sub>f</sub> − v<sub>i</sub>', dv, 'm/s', [{ value: (vf > 0 ? 1 : -1) * (v2 - v1), why: 'You subtracted the speeds. The velocities have opposite signs here: ' + S(vi, 0) + ' m/s and ' + S(vf, 0) + ' m/s.' }, { value: v2 - v1, why: 'Those are speeds, not velocities. Moving ' + ax[1 - d1] + ' with ' + posName + ' positive makes that velocity ' + (vf > 0 ? 'positive' : 'negative') + '.' }], '2.B', 'Give each velocity its sign first.'),
          num('a', 'Average acceleration', a, 'm/s²', [{ value: dv * dt, why: 'Divide Δv by the time, do not multiply.' }, { value: (v2 - v1) / dt, why: 'You used the speeds. With signs, Δv = ' + S(vf, 0) + ' − (' + S(vi, 0) + ') = ' + S(dv, 0) + ' m/s.' }], '2.B', 'a = Δv ÷ Δt.')
        ],
        solution: [
          'With ' + posName + ' positive: v<sub>i</sub> = ' + S(vi, 0) + ' m/s and v<sub>f</sub> = ' + S(vf, 0) + ' m/s.',
          'Δv = ' + S(vf, 0) + ' − (' + S(vi, 0) + ') = ' + S(dv, 0) + ' m/s.',
          'a = Δv ÷ Δt = ' + S(dv, 0) + ' m/s ÷ ' + dt + ' s = ' + SN(a) + ' m/s². The velocity changed direction, so the speed went down and then up, but a kept one sign.'
        ],
        values: { vi: vi, vf: vf, dt: dt }
      };
    }
    var dir = r.int(0, 1), up = r() < 0.5, va = r.int(1, 9), vb = r.int(1, 9);
    while(va === vb) vb = r.int(1, 9);
    var lo = Math.min(va, vb), hi = Math.max(va, vb), si = up ? lo : hi, sf = up ? hi : lo, dt2 = r.int(2, 8);
    var sg = dir === pos ? 1 : -1, vi2 = sg * si, vf2 = sg * sf, a2 = (vf2 - vi2) / dt2, aSign = a2 > 0 ? 0 : 1;
    var am = [{ value: (vf2 - vi2) * dt2, why: 'Divide Δv by the time, do not multiply.' }];
    if(sg < 0) am.unshift({ value: (sf - si) / dt2, why: 'You used speeds. Moving ' + ax[dir] + ' with ' + posName + ' positive makes both velocities negative: ' + S(vi2, 0) + ' m/s and ' + S(vf2, 0) + ' m/s.' });
    return {
      type: 'signs', variant: 'straight',
      text: '<p>Take ' + posName + ' as the positive direction. ' + who + ' moving ' + ax[dir] + ' ' + (up ? 'speeds up' : 'slows down') + ' from ' + si + ' m/s to ' + sf + ' m/s in ' + dt2 + ' s.</p>',
      steps: [
        choice('vsign', 'What is the sign of its velocity?', ['Positive', 'Negative'], sg > 0 ? 0 : 1, [
          sg > 0 ? 'Right: it moves ' + ax[dir] + ', the positive direction.' : 'It moves ' + ax[dir] + ', opposite to ' + posName + ', so its velocity is negative.',
          sg < 0 ? 'Right: it moves ' + ax[dir] + ', opposite to the positive direction.' : 'It moves ' + ax[dir] + ', which is the positive direction.'
        ], '3.B', true),
        choice('asign', 'What is the sign of its acceleration?', ['Positive', 'Negative', 'Zero'], aSign, [
          aSign === 0 ? 'Right: ' + (up ? 'speeding up, so a points the same way as v, which is positive.' : 'slowing down, so a points opposite to v, which is negative: a is positive.') : (up ? 'Speeding up means a has the same sign as v, which is negative here.' : 'Slowing down means a is opposite to v; v is positive, so a is negative.'),
          aSign === 1 ? 'Right: ' + (up ? 'speeding up, so a has the same sign as v, which is negative.' : 'slowing down, so a is opposite to v, which is positive.') : (up ? 'Speeding up means a has the same sign as v, which is positive here.' : '"Slowing down" does not always mean negative a: v is negative, so a opposite to it is positive.'),
          'The velocity changes, so the acceleration is not zero.'
        ], '3.B', true),
        num('a', 'Average acceleration', a2, 'm/s²', am, '2.B', 'a = (v<sub>f</sub> − v<sub>i</sub>) ÷ Δt, with signs.')
      ],
      solution: [
        'With ' + posName + ' positive, motion ' + ax[dir] + ' is ' + (sg > 0 ? 'positive' : 'negative') + ': v<sub>i</sub> = ' + S(vi2, 0) + ' m/s, v<sub>f</sub> = ' + S(vf2, 0) + ' m/s.',
        'a = (v<sub>f</sub> − v<sub>i</sub>) ÷ Δt = (' + S(vf2, 0) + ' − (' + S(vi2, 0) + ')) m/s ÷ ' + dt2 + ' s = ' + SN(a2) + ' m/s².',
        (up ? 'Speeding up: v and a have the same sign.' : 'Slowing down: v and a have opposite signs.') + ' The sign of a alone does not say speeding up or slowing down.'
      ],
      values: { vi: vi2, vf: vf2, dt: dt2 }
    };
  };

  /* Turning points: where v crosses zero; a ball tossed straight up. */
  G.turn = function(r, ctx){
    var g = M.g(ctx);
    if(r() < 0.5){
      for(var tries = 0; tries < 200; tries++){
        var v0 = r.pick([1, 1.5, 2, 2.5, 3, 3.5, 4]) * (r() < 0.5 ? -1 : 1), am = r.pick([0.5, 1, 1.5, 2]), a = v0 > 0 ? -am : am;
        var tt = -v0 / a;
        if(tt < 1 || tt > 6 || Math.abs(v0 + a * 8) > 4.5) continue;
        var dx = 0.5 * v0 * tt, line = [[0, v0], [8, v0 + a * 8]];
        return {
          type: 'turn', variant: 'line', fig: fig('v', line, { ymin: -4.5, ymax: 4.5, tmax: 8 }),
          text: '<p>The velocity-time graph shows a cart on a straight track (positive to the right). It is a straight line from ' + S(v0, 1) + ' m/s at t = 0 with slope ' + S(a, 1) + ' m/s². When does the cart turn around, and where is it then?</p>',
          steps: [
            num('tt', 'Time when the cart turns around', tt, 's', [{ value: Math.abs(v0 * a), why: 'You multiplied. The cart turns when v = 0: solve 0 = v₀ + at, so t = −v₀ ÷ a.' }, { value: Math.abs(a / v0), why: 'That is a ÷ v₀, upside down. t = −v₀ ÷ a.' }], '2.B', 'It turns around where the graph crosses v = 0.'),
            num('dx', 'Displacement from t = 0 to the turning point', dx, 'm', [{ value: v0 * tt, why: 'That is v₀ × t, a rectangle. The area under the line is a triangle: ½ × base × height.' }], '2.B', 'The area of the triangle between the line and the axis.'),
            choice('aturn', 'What is the acceleration at the moment it turns around?', ['The same as before, ' + S(a, 1) + ' m/s²', 'Zero, because the velocity is zero', 'It changes sign at that moment'], 0, [
              'Right: the graph is one straight line, so its slope (a) is the same at every moment, including where v = 0.',
              'v = 0 for an instant, but v is still changing (the line keeps going): a is the slope, not the value of v.',
              'The slope of a straight line never changes. v changes sign there; a does not.'
            ], '3.B')
          ],
          solution: [
            'Turns around when v = 0: 0 = ' + S(v0, 1) + ' + (' + S(a, 1) + ')t, so t = ' + N(tt) + ' s.',
            'Displacement = area of the triangle = ½ × ' + N(tt) + ' s × ' + S(v0, 1) + ' m/s = ' + SN(dx) + ' m. That is the farthest it gets before coming back.',
            'a = ' + S(a, 1) + ' m/s² the whole time, also at the turning point.'
          ],
          values: { v0: v0, a: a }
        };
      }
    }
    var u = r.between(4, 15, 2), top = u / g, H = u * u / (2 * g);
    return {
      type: 'turn', variant: 'toss',
      text: '<p>A ball is tossed straight up at ' + N(u) + ' m/s. Take up as positive and use g = ' + g + ' m/s². Ignore air resistance.</p>',
      steps: [
        num('ttop', 'Time to reach the top', top, 's', [{ value: u * g, why: 'Multiplied: at the top v = 0, so 0 = v₀ − gt and t = v₀ ÷ g.' }], '2.B', 'At the top the velocity is zero for an instant.'),
        choice('attop', 'At the top, what are the ball\'s velocity and acceleration?', ['v = 0 and a = −' + g + ' m/s²', 'v = 0 and a = 0', 'v = 0 and a = +' + g + ' m/s²', 'v = −' + N(u) + ' m/s and a = −' + g + ' m/s²'], 0, [
          'Right: v is zero for an instant, but it is still changing at ' + g + ' m/s² downward.',
          'If a were zero at the top the ball would stay there. Gravity keeps changing v at the top too.',
          'The acceleration points down the whole flight; with up positive it is negative.',
          'v = −' + N(u) + ' m/s is how fast it moves when it gets back to your hand, not at the top.'
        ], '3.B'),
        num('h', 'Height of the top above the release point', H, 'm', [{ value: u * top, why: 'That is v₀ × t, as if the speed stayed ' + N(u) + ' m/s. Use the average velocity, v₀ ÷ 2, or Δy = v₀²/(2g).' }], '2.B', 'Use v² = v₀² − 2gΔy with v = 0, or the area under v-t.')
      ],
      solution: [
        'At the top v = 0: 0 = ' + N(u) + ' − ' + g + 't, so t = ' + F(top, dOf(top)) + ' s.',
        'Δy = v₀² ÷ (2g) = ' + N(u) + '² ÷ (2 × ' + g + ') = ' + F(H, dOf(H)) + ' m.',
        'a = −' + g + ' m/s² at every moment of the flight, including the top.'
      ],
      values: { u: u, g: g }
    };
  };

  /* Distance and displacement along a line (no graph). */
  G.dist = function(r){
    for(var tries = 0; tries < 200; tries++){
      var n = r.int(2, 3), legs = [], disp = 0, dist = 0;
      for(var i = 0; i < n; i++){ var L = r.int(2, 30) * 5, d = i === 0 ? 1 : r() < 0.6 ? -legs[i - 1].d : legs[i - 1].d; legs.push({ L: L, d: d }); disp += L * d; dist += L; }
      if(disp === 0 || Math.abs(disp) === dist) continue;
      var east = r() < 0.5, pos = east ? 'east' : 'north', neg = east ? 'west' : 'south';
      var trip = legs.map(function(l){ return l.L + ' m ' + (l.d > 0 ? pos : neg); }).join(', then ');
      return {
        type: 'dist',
        text: '<p>A runner on a long, straight path goes ' + trip + '. Take ' + pos + ' as positive.</p>',
        steps: [
          num('dx', 'Displacement', disp, 'm', [{ value: dist, why: 'That adds every leg as positive, which is the distance. Displacement counts the ' + neg + ' legs as negative.' }], '2.B', 'Add the legs with signs.'),
          num('dist', 'Distance traveled', dist, 'm', [{ value: Math.abs(disp), why: 'That is the size of the displacement. Distance adds every leg as positive.' }], '2.B', 'Add the lengths of the legs.'),
          choice('which', 'Which one tells you where the runner ends up compared with the start?', ['The displacement: it is a vector, with size and direction', 'The distance: it adds up every step', 'Both tell you that'], 0, [
            'Right: displacement is the change in position, so it says how far and which way from the start.',
            'Distance counts every step, forward or back, so it does not say where the runner ends up.',
            'Only the displacement does: two trips with the same distance can end in different places.'
          ], '3.B')
        ],
        solution: [
          'Displacement: ' + sumText(legs.map(function(l){ return l.L * l.d; })) + ' = ' + SN(disp) + ' m, so ' + Math.abs(disp) + ' m ' + (disp > 0 ? pos : neg) + ' of the start.',
          'Distance: ' + legs.map(function(l){ return l.L; }).join(' + ') + ' = ' + dist + ' m.'
        ],
        values: { legs: legs }
      };
    }
    throw new Error('motion-graphs: no dist problem');
  };

  var TOPIC = { slope: 'motion-representations', area: 'motion-representations', pick: 'motion-representations', describe: 'motion-representations', turn: 'motion-representations', signs: 'motion-quantities', dist: 'scalars-vectors' };
  function generate(r, ctx, type){
    type = (type && G[type]) ? type : ctx.kind;
    if(!G[type]) throw new Error('motion-graphs: unknown problem type ' + type);
    var p = G[type](r, ctx);
    p.ctx = ctx.id; p.topic = ctx.topic || TOPIC[type]; p.type = type;
    return p;
  }

  M.register('motionGraphs', {
    TRACK: TRACK, WINDOW: WINDOW, DT: DT, SCALE: SCALE, TOPIC: TOPIC,
    motion: motion, edgeTime: edgeTime, sample: sample, resample: resample, interp: interp, derive: derive,
    slopeAt: slopeAt, areaTo: areaTo, plArea: plArea, plAt: plAt, describe: describe, score: score,
    dOf: dOf, generate: generate
  });
})();
