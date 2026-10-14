/* Motion lab model: ApCalcMath.motionLab (docs/apcalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apcalc-tool-checks/motion-lab.mjs) and the test
   (scripts/test/apcalc-tool-motion-lab.test.mjs) run exactly this code.

   Explore: MOTIONS[id], a particle (a car) on a line for 0 ≤ t ≤ T.
     mode 'x'  position given (Unit 4): x(t), v = x′, a = v″ in closed form
     mode 'v'  velocity given with x(0) (Unit 8): x(t) = x(0) + ∫₀ᵗ v(s) ds,
               accumulated numerically (adaptive Simpson, ApCalcMath.integral)
               or exactly for straight pieces (a velocity graph)
   table(m, n) samples t, x, v, a, the distance travelled ∫₀ᵗ |v| and the
   displacement; analyze(m) finds where v changes sign (direction changes),
   where v = 0 without a sign change (a stop), and the intervals where the
   particle speeds up (v and a share a sign) or slows down (they differ).

   Test yourself: generate(rng, ctx) for ctx.kind in
     deriv  velocity and acceleration from a position (expr steps), values at a time
     speed  speeding up or slowing down at a time, with the sign reasoning
     turn   where the particle changes direction (v changes sign, not just v = 0)
     dist   displacement, total distance and position from v(t) (calculator,
            three decimal places)
     graph  the same from a velocity graph made of straight pieces (geometry) */
(function(G){
  'use strict';
  var M = G.ApCalcMath;
  if(!M) return;
  function H(s){ return G.ApCalcTex ? G.ApCalcTex.html(s, { strict: true }) : s; }
  /* An option that holds math: a plain-text name for screen readers and the
     accessibility checks (MathML alone gives a radio no accessible name),
     the rendered math for the eye. One wrapping span keeps the spaces. */
  function escT(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function optHtml(t){
    if(String(t).indexOf('$') < 0 || !G.ApCalcTex) return '<span class="cd-opt-t">' + H(t) + '</span>';
    return '<span class="cd-opt-t"><span class="sr-only">' + escT(G.ApCalcTex.plain(t)) + '</span><span aria-hidden="true">' + H(t) + '</span></span>';
  }
  function n(x, d){
    if(Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    var s = M.fixed(x, d == null ? 3 : d).replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }
  function sgnWord(x){ return x > 0 ? 'positive' : x < 0 ? 'negative' : 'zero'; }
  function rel(x){ return x > 0 ? '> 0' : x < 0 ? '< 0' : '= 0'; }

  /* ------------------------------------------------ piecewise-linear v */
  /* pts: [[t, v]...] with increasing t. v, a and the exact integrals. */
  function pw(pts){
    function seg(t){ for(var i = 0; i < pts.length - 1; i++) if(t <= pts[i + 1][0] + 1e-12) return i; return pts.length - 2; }
    return {
      v: function(t){ var i = seg(t), a = pts[i], b = pts[i + 1]; return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]); },
      a: function(t){ var i = seg(t), a = pts[i], b = pts[i + 1]; return (b[1] - a[1]) / (b[0] - a[0]); },
      // ∫ from 0 to t of v (abs: of |v|), exact on each straight piece
      area: function(t, abs){
        var s = 0;
        for(var i = 0; i < pts.length - 1; i++){
          var a = pts[i], b = pts[i + 1], lo = a[0], hi = Math.min(b[0], t);
          if(hi <= lo) break;
          var va = a[1], vb = a[1] + (b[1] - a[1]) * (hi - lo) / (b[0] - a[0]);
          if(!abs || va * vb >= 0) s += (abs ? Math.abs(va + vb) : va + vb) / 2 * (hi - lo);
          else { var z = lo + (hi - lo) * va / (va - vb); s += (Math.abs(va) * (z - lo) + Math.abs(vb) * (hi - z)) / 2; }
        }
        return s;
      }
    };
  }

  /* ------------------------------------------------------- explore */
  var MOTIONS = {
    cubic: { id: 'cubic', mode: 'x', name: 'Cubic', T: 4.2,
      tex: { x: 't^3 - 6t^2 + 9t + 1', v: '3t^2 - 12t + 9', a: '6t - 12' },
      x: function(t){ return t * t * t - 6 * t * t + 9 * t + 1; }, v: function(t){ return 3 * t * t - 12 * t + 9; }, a: function(t){ return 6 * t - 12; } },
    quad: { id: 'quad', mode: 'x', name: 'Parabola', T: 5,
      tex: { x: 't^2 - 5t + 4', v: '2t - 5', a: '2' },
      x: function(t){ return t * t - 5 * t + 4; }, v: function(t){ return 2 * t - 5; }, a: function(){ return 2; } },
    wave: { id: 'wave', mode: 'x', name: 'Back and forth', T: 2 * Math.PI,
      tex: { x: '2 + 3\\sin t', v: '3\\cos t', a: '-3\\sin t' },
      x: function(t){ return 2 + 3 * Math.sin(t); }, v: function(t){ return 3 * Math.cos(t); }, a: function(t){ return -3 * Math.sin(t); } },
    surge: { id: 'surge', mode: 'x', name: 'Out and back', T: 8,
      tex: { x: '6te^{-t/2}', v: '(6 - 3t)e^{-t/2}', a: '(1.5t - 6)e^{-t/2}' },
      x: function(t){ return 6 * t * Math.exp(-t / 2); }, v: function(t){ return (6 - 3 * t) * Math.exp(-t / 2); }, a: function(t){ return (1.5 * t - 6) * Math.exp(-t / 2); } },
    vpoly: { id: 'vpoly', mode: 'v', name: 'Velocity: a parabola', T: 5, x0: 1,
      tex: { v: 't^2 - 4t + 3', a: '2t - 4' },
      v: function(t){ return t * t - 4 * t + 3; }, a: function(t){ return 2 * t - 4; },
      exact: function(t){ return 1 + t * t * t / 3 - 2 * t * t + 3 * t; } },
    vtrig: { id: 'vtrig', mode: 'v', name: 'Velocity: no antiderivative', T: 4.5, x0: -2, calc: true,
      tex: { v: '2\\sin\\left(\\frac{t^2}{4}\\right)', a: 't\\cos\\left(\\frac{t^2}{4}\\right)' },
      v: function(t){ return 2 * Math.sin(t * t / 4); }, a: function(t){ return t * Math.cos(t * t / 4); } },
    vgraph: { id: 'vgraph', mode: 'v', name: 'Velocity graph', T: 7, x0: -4, pts: [[0, 3], [2, 3], [4, -1], [6, -1], [7, 0]] }
  };
  Object.keys(MOTIONS).forEach(function(k){
    var m = MOTIONS[k];
    if(m.pts){ var P = pw(m.pts); m.v = P.v; m.a = P.a; m.area = P.area; }
  });
  var ORDER = ['cubic', 'quad', 'wave', 'surge', 'vpoly', 'vtrig', 'vgraph'];

  /* Position at t: the formula, or x(0) plus the accumulated area. */
  function xAt(m, t){
    if(m.mode === 'x') return m.x(t);
    if(m.area) return m.x0 + m.area(t);
    return m.x0 + M.integral(m.v, 0, t, 1e-10);
  }
  /* The distance travelled from 0 to t: ∫|v|, split where v changes sign. */
  function distTo(m, t){
    if(m.area) return m.area(t, true);
    var z = zeros(m, 0, t), cuts = [0].concat(z, [t]), s = 0;
    for(var i = 0; i < cuts.length - 1; i++) s += Math.abs(M.integral(m.v, cuts[i], cuts[i + 1], 1e-11));
    return s;
  }
  function zeros(m, a, b){
    if(m.pts){
      var out = [];
      for(var i = 0; i < m.pts.length - 1; i++){
        var p = m.pts[i], q = m.pts[i + 1];
        if(p[1] * q[1] < 0) out.push(p[0] + (q[0] - p[0]) * p[1] / (p[1] - q[1]));
        else if(q[1] === 0 && i < m.pts.length - 2) out.push(q[0]);
      }
      return out.filter(function(z){ return z > a + 1e-9 && z < b - 1e-9; });
    }
    return M.roots(m.v, a, b, 800).filter(function(z){ return z > a + 1e-9 && z < b - 1e-9; });
  }
  /* Direction changes, stops, and speeding-up / slowing-down intervals. */
  function analyze(m){
    var T = m.T, vz = zeros(m, 0, T), turns = [], stops = [];
    vz.forEach(function(z){
      var h = 1e-4 * Math.max(1, T), l = m.v(z - h), r = m.v(z + h);
      if(l * r < 0) turns.push(z); else stops.push(z);
    });
    // a's zeros (and breaks), then the sign of v·a on every piece between cuts
    var az = m.pts ? m.pts.slice(1, -1).map(function(p){ return p[0]; }) : M.roots(m.a, 0, T, 800);
    var cuts = [0].concat(vz, az, [T]).filter(function(x){ return x >= 0 && x <= T; }).sort(function(a, b){ return a - b; });
    var ivs = [];
    for(var i = 0; i < cuts.length - 1; i++){
      var a = cuts[i], b = cuts[i + 1];
      if(b - a < 1e-9) continue;
      var mid = (a + b) / 2, v = m.v(mid), ac = m.a(mid), kind = Math.abs(ac) < 1e-12 ? 'steady' : Math.abs(v) < 1e-12 ? 'rest' : v * ac > 0 ? 'up' : 'down';
      var last = ivs[ivs.length - 1];
      if(last && last.kind === kind) last.b = b; else ivs.push({ a: a, b: b, kind: kind });
    }
    return { turns: turns, stops: stops, intervals: ivs };
  }
  function table(m, N){
    N = N || 400;
    var out = { t: [], x: [], v: [], a: [], d: [] }, T = m.T, xprev = xAt(m, 0), dist = 0;
    for(var i = 0; i <= N; i++){
      var t = T * i / N, x;
      if(m.mode === 'x') x = m.x(t);
      else if(m.area) x = m.x0 + m.area(t);
      else x = i ? xprev + M.integral(m.v, T * (i - 1) / N, t, 1e-12) : m.x0;
      if(i){ var t0 = T * (i - 1) / N; dist += m.area ? 0 : Math.abs(M.integral(function(s){ return Math.abs(m.v(s)); }, t0, t, 1e-12)); }
      out.t.push(t); out.x.push(x); out.v.push(m.v(t)); out.a.push(m.a(t)); out.d.push(m.area ? m.area(t, true) : dist);
      xprev = x;
    }
    return out;
  }
  /* What the car is doing at time t, in words the exam rewards. */
  function describe(m, t){
    var v = m.v(t), a = m.a(t), eps = 1e-9, A = analyze(m), at = function(list){ return list.filter(function(z){ return Math.abs(z - t) < 0.02 * m.T / 4; })[0]; };
    var turn = at(A.turns), stop = at(A.stops);
    if(turn != null) return { state: 'turn', v: v, a: a, head: 'The car stops for an instant and turns around: v changes from ' + sgnWord(m.v(turn - 0.01)) + ' to ' + sgnWord(m.v(turn + 0.01)) + ' at t ≈ ' + n(turn, 2) + '.' };
    if(stop != null) return { state: 'stop', v: v, a: a, head: 'v = 0 for an instant, but v does not change sign, so the car keeps its direction.' };
    if(Math.abs(v) <= eps) return { state: 'rest', v: v, a: a, head: 'The car is at rest for an instant: v = 0.' };
    var dir = v > eps ? 'moves right (v > 0)' : 'moves left (v < 0)';
    if(Math.abs(a) < 1e-6) return { state: 'steady', v: v, a: a, head: 'The car ' + dir + ' at a steady speed (a = 0).' };
    var up = v * a > 0;
    return { state: up ? 'up' : 'down', v: v, a: a, head: 'The car ' + dir + ' and is ' + (up ? 'speeding up' : 'slowing down') + ': v and a are ' + (up ? 'both ' + sgnWord(v) : 'opposite in sign') + '.' };
  }

  /* ------------------------------------------------------- the drill */
  function choice(key, label, list, practice){
    return { key: key, kind: 'choice', label: H(label), options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }), correct: 0, practice: practice || '3.E' };
  }
  function numStep(key, label, answer, mistakes, o){
    o = o || {};
    var calc = !!o.calc, whole = !calc && Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '1.E', d: whole ? 0 : 3,
      hint: calc ? 'Calculator: correct to three decimal places.' : whole ? '' : 'Exact (like 7/2) or to three decimal places.',
      cell: M.cell(answer, calc ? 0 : 6e-4, (mistakes || []).map(function(m){ return { value: m[0], why: H(m[1]) }; }), calc ? 0.001 : 6e-4) };
  }
  function exprStep(key, label, lhs, answer, mistakes){
    return { key: key, kind: 'expr', label: H(label), lhs: lhs, practice: '1.E',
      cell: M.exprCell(answer, { vars: ['t'], domain: [0.2, 4], mistakes: (mistakes || []).map(function(m){ return { expr: m[0], why: m[1] }; }) }) };
  }
  function polyTex(c){ // c: coefficients high to low, in t
    var deg = c.length - 1, out = '';
    c.forEach(function(k, i){
      var p = deg - i;
      if(!k) return;
      var s = k < 0 ? ' - ' : (out ? ' + ' : ''), a = Math.abs(k);
      out += (out || k > 0 ? s : '-') + (a === 1 && p ? '' : n(a)) + (p ? 't' + (p > 1 ? '^' + p : '') : '');
    });
    return out.replace(/^ \+ /, '') || '0';
  }
  function polyStr(c){ return polyTex(c).replace(/t\^(\d)/g, 't^$1'); }
  function peval(c, t){ return c.reduce(function(s, k){ return s * t + k; }, 0); }
  function pder(c){ var d = c.length - 1; return c.slice(0, -1).map(function(k, i){ return k * (d - i); }); }

  var GEN = {};
  GEN.deriv = function(r){
    var fam = r.pick(['poly', 'poly', 'trig', 'exp']), x, v, a, xt, vk, ak, vm, am, t0;
    if(fam === 'poly'){
      var c = [1, r.int(-6, 6), r.int(-9, 9), r.int(-5, 5)];
      if(r() < 0.3) c[0] = r.pick([2, -1]);
      var dv = pder(c), da = pder(dv);
      xt = polyTex(c); vk = polyStr(dv); ak = polyStr(da);
      x = function(t){ return peval(c, t); }; v = function(t){ return peval(dv, t); }; a = function(t){ return peval(da, t); };
      vm = c[3] ? [[polyStr(dv) + ' + (' + c[3] + ')', 'The derivative of the constant ' + c[3] + ' is 0, so it drops out of v(t).']] : [];
      vm.push([polyStr(c.slice(0, 3)), 'Lower each power by one and multiply by the old power: the derivative of t³ is 3t², not t².']);
      am = da[1] ? [[polyStr([da[0], 0]), 'Keep the constant from differentiating ' + n(2 * c[1]) + 't: a(t) has a constant term ' + n(da[1]) + '.']] : [];
      t0 = r.int(1, 4);
    } else if(fam === 'trig'){
      var A = r.pick([2, 3, 4, 5]), k = r.pick([2, 3]), b = r.pick([1, 2, -1, -2]);
      xt = A + '\\sin(' + k + 't) ' + (b < 0 ? '- ' : '+ ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 't';
      x = function(t){ return A * Math.sin(k * t) + b * t; }; v = function(t){ return A * k * Math.cos(k * t) + b; }; a = function(t){ return -A * k * k * Math.sin(k * t); };
      vk = (A * k) + 'cos(' + k + 't) + (' + b + ')'; ak = '-' + (A * k * k) + 'sin(' + k + 't)';
      vm = [[A + 'cos(' + k + 't) + (' + b + ')', 'Chain rule: the derivative of sin(' + k + 't) is ' + k + 'cos(' + k + 't), so the ' + k + ' comes out in front.'],
        ['-' + (A * k) + 'cos(' + k + 't) + (' + b + ')', 'The derivative of sine is cosine, with no minus sign.']];
      am = [[(A * k * k) + 'sin(' + k + 't)', 'The derivative of cosine is minus sine: a(t) is negative where sin(' + k + 't) is positive.'],
        ['-' + (A * k) + 'sin(' + k + 't)', 'Chain rule again: differentiating cos(' + k + 't) brings out another factor of ' + k + '.']];
      t0 = r.pick([0, 0.5, 1]);
    } else {
      var B = r.pick([2, 4, 6]);
      xt = B + 'te^{-t}';
      x = function(t){ return B * t * Math.exp(-t); }; v = function(t){ return B * (1 - t) * Math.exp(-t); }; a = function(t){ return B * (t - 2) * Math.exp(-t); };
      vk = B + '(1 - t)e^(-t)'; ak = B + '(t - 2)e^(-t)';
      vm = [['-' + B + 't*e^(-t)', 'Use the product rule: (' + B + 't)′e^(−t) + ' + B + 't(e^(−t))′, two terms.'], [B + 'e^(-t)', 'The product rule gives two terms; the second, from e^(−t), is −' + B + 'te^(−t).']];
      am = [[B + '(t - 1)e^(-t)', 'Differentiate (1 − t)e^(−t) with the product rule again: −e^(−t) − (1 − t)e^(−t) = (t − 2)e^(−t).']];
      t0 = r.pick([0, 1, 2, 3]);
    }
    var vt0 = v(t0), at0 = a(t0);
    var text = H('<p>A particle moves along the <i>x</i>-axis. Its position at time <i>t</i> seconds is $x(t) = ' + xt + '$ meters, for $t \\ge 0$.</p>');
    var steps = [
      exprStep('v', 'Find the velocity $v(t)$.', 'v(t) =', vk, vm),
      exprStep('a', 'Find the acceleration $a(t)$.', 'a(t) =', ak, am),
      numStep('vt', 'What is the velocity at $t = ' + n(t0) + '$?', vt0, [[x(t0), 'That is the position $x(' + n(t0) + ')$. The velocity is $v(' + n(t0) + ') = x\'(' + n(t0) + ')$.'], [at0, 'That is the acceleration. Evaluate $v(t)$, not $a(t)$.']], { unit: 'm/s' }),
      numStep('at', 'What is the acceleration at $t = ' + n(t0) + '$?', at0, [[vt0, 'That is the velocity. The acceleration is $a(' + n(t0) + ') = v\'(' + n(t0) + ')$.']], { unit: 'm/s²' })
    ];
    var sol = ['$v(t) = x\'(t)$: differentiate the position.', '$a(t) = v\'(t) = x\'\'(t)$.', 'At $t = ' + n(t0) + '$: $v(' + n(t0) + ') = ' + n(vt0) + '$ m/s and $a(' + n(t0) + ') = ' + n(at0) + '$ m/s².'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'x', f: x, T: Math.max(4, t0 + 1), mark: t0, label: 'Position of the particle against time' }, values: { fam: fam, t0: t0, v: vt0, a: at0, x: x(t0), vk: vk, ak: ak } };
  };

  GEN.speed = function(r){
    // v(t) = k(t − p)(t − q) or a trig velocity; a = v′; a time where v·a ≠ 0
    var fam = r.pick(['poly', 'poly', 'trig']), v, a, vt, at, T, t0, vtex, atex;
    for(var guard = 0; guard < 50; guard++){
      if(fam === 'poly'){
        var p = r.int(1, 3), q = p + r.int(1, 3), k = r.pick([1, 2, -1]);
        var c = [k, -k * (p + q), k * p * q];
        v = function(t){ return peval(c, t); }; a = function(t){ return peval(pder(c), t); };
        vtex = polyTex(c); atex = polyTex(pder(c)); T = q + 2;
        t0 = r.pick([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].filter(function(z){ return z <= T; }));
      } else {
        var A = r.pick([2, 3, 4]), w = r.pick([0.5, 1, 2]);
        v = function(t){ return A * Math.cos(w * t); }; a = function(t){ return -A * w * Math.sin(w * t); };
        vtex = A + '\\cos(' + n(w) + 't)'; atex = '-' + n(A * w) + '\\sin(' + n(w) + 't)'; T = 7;
        t0 = r.pick([1, 2, 3, 4, 5, 6]);
      }
      vt = v(t0); at = a(t0);
      if(Math.abs(vt) > 0.05 && Math.abs(at) > 0.05) break;
    }
    var up = vt * at > 0, C = up ? 'speeding up' : 'slowing down', O = up ? 'slowing down' : 'speeding up';
    var both = up ? 'both ' + sgnWord(vt) : 'opposite in sign';
    var text = H('<p>A particle moves along a line with velocity $v(t) = ' + vtex + '$ meters per second' + (fam === 'trig' ? ' (radians)' : '') + '. Is it speeding up or slowing down at $t = ' + n(t0) + '$?</p>');
    var aAlone = at < 0 ? 'slowing down' : 'speeding up', T0 = n(t0);
    var steps = [
      numStep('vt', 'Find $v(' + T0 + ')$.', vt, [[-vt, 'Check the signs when you substitute.']], { unit: 'm/s', practice: '1.E' }),
      numStep('at', 'Find $a(' + T0 + ')$, where $a(t) = v\'(t)$.', at, [[-at, 'Check the sign of the derivative.'], [vt, 'That is $v(' + T0 + ')$. Differentiate first: $a(t) = ' + atex + '$.']], { unit: 'm/s²', practice: '1.E' }),
      choice('state', 'At $t = ' + T0 + '$, the particle is', [
        [C + ', because $v(' + T0 + ')$ and $a(' + T0 + ')$ are ' + both + '.', 'Right: speed grows when velocity and acceleration have the same sign, and shrinks when their signs differ. Say both signs.'],
        [C + ', because $a(' + T0 + ') ' + rel(at) + '$.', 'The conclusion is right but the reason is not: the sign of $a$ alone never decides. The exam wants both signs: $v$ and $a$ ' + (up ? 'agree' : 'differ') + '.'],
        [O + ', because $v(' + T0 + ') ' + rel(vt) + '$.', 'The sign of $v$ alone gives the direction, not whether the speed grows. Compare it with the sign of $a$.'],
        aAlone !== C ? [aAlone + ', because $a(' + T0 + ') ' + rel(at) + '$.', 'The sign of $a$ alone does not decide it: negative acceleration speeds up a particle that moves left. Compare the signs of $v$ and $a$.']
          : [O + ', because $v(' + T0 + ')$ and $a(' + T0 + ')$ are ' + (up ? 'opposite in sign' : 'both ' + sgnWord(vt)) + '.', 'Check the signs: $v(' + T0 + ') = ' + n(vt) + '$ and $a(' + T0 + ') = ' + n(at) + '$ ' + (up ? 'agree' : 'differ') + '.']
      ], '3.E')
    ];
    var sol = ['$v(' + n(t0) + ') = ' + n(vt) + '$ m/s (' + sgnWord(vt) + ').', '$a(t) = ' + atex + '$, so $a(' + n(t0) + ') = ' + n(at) + '$ m/s² (' + sgnWord(at) + ').', 'The particle is ' + C + ' because $v(' + n(t0) + ')$ and $a(' + n(t0) + ')$ are ' + both + '.'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'v', f: v, T: T, mark: t0, label: 'Velocity of the particle against time' }, values: { t0: t0, v: vt, a: at, up: up, fam: fam } };
  };

  GEN.turn = function(r){
    // v(t) = k(t − p)^m (t − q): a simple zero changes sign, a double zero does not.
    var p = r.int(1, 3), q = p + r.int(1, 3), k = r.pick([1, -1, 2]), dbl = r() < 0.5;
    var c = dbl ? [k, -k * (2 * p + q), k * (p * p + 2 * p * q), -k * p * p * q] : [k, -k * (p + q), k * p * q];
    var v = function(t){ return peval(c, t); }, T = q + 2, vtex = dbl ? (k === 1 ? '' : k === -1 ? '-' : k) + '(t - ' + p + ')^2(t - ' + q + ')' : (k === 1 ? '' : k === -1 ? '-' : k) + '(t - ' + p + ')(t - ' + q + ')';
    var text = H('<p>A particle moves along a line for $0 \\le t \\le ' + T + '$ with velocity $v(t) = ' + vtex + '$.</p>');
    var at = function(t){ return v(t) > 0 ? 'positive' : 'negative'; };
    var steps = [
      numStep('z', 'What is the first time $t > 0$ when $v(t) = 0$?', p, [[q, 'That is a later zero. The first is $t = ' + p + '$.']], { practice: '1.E' }),
      choice('sign', 'Does the particle change direction at $t = ' + p + '$?', dbl ? [
        ['No: $v$ is ' + at(p - 0.5) + ' on both sides of $t = ' + p + '$, so it does not change sign.', 'Right: $(t - ' + p + ')^2$ never changes sign, so $v$ touches zero and keeps its sign.'],
        ['Yes, because $v(' + p + ') = 0$.', '$v = 0$ is not enough. The particle changes direction only where $v$ changes sign, and here it does not.'],
        ['Yes: $v$ changes sign at $t = ' + p + '$.', 'Check a time on each side: $v$ is ' + at(p - 0.5) + ' just before and just after $t = ' + p + '$.'],
        ['Yes, because the acceleration is zero there.', 'Direction depends on the sign of $v$, not on $a$.']
      ] : [
        ['Yes: $v$ changes from ' + at(p - 0.5) + ' to ' + at(p + 0.5) + ' at $t = ' + p + '$.', 'Right: a change of sign in $v$ is a change of direction. Name what changes sign, and from what to what.'],
        ['No: the particle only stops for an instant.', 'It stops and turns: $v$ is ' + at(p - 0.5) + ' before and ' + at(p + 0.5) + ' after.'],
        ['Yes, because $v(' + p + ') = 0$.', 'Right conclusion, weak reason: $v = 0$ alone does not prove a change of direction. Say that $v$ changes sign.'],
        ['No, because the acceleration is not zero there.', 'Direction depends on the sign of $v$, not on $a$.']
      ], '3.E')
    ];
    var turns = dbl ? [q] : [p, q], list = turns.map(function(z){ return '$t = ' + z + '$'; }).join(' and ');
    steps.push(choice('all', 'At which times in $0 < t < ' + T + '$ does the particle change direction?', [
      [dbl ? 'Only at $t = ' + q + '$' : 'At $t = ' + p + '$ and $t = ' + q + '$', 'Right: only the zeros where $v$ changes sign.'],
      [dbl ? 'At $t = ' + p + '$ and $t = ' + q + '$' : 'Only at $t = ' + q + '$', dbl ? 'At $t = ' + p + '$, $v = 0$ but keeps its sign: no change of direction.' : '$v$ changes sign at both zeros.'],
      ['Only at $t = ' + p + '$', dbl ? '$v$ does not change sign at $t = ' + p + '$, but it does at $t = ' + q + '$.' : '$v$ changes sign at $t = ' + q + '$ too.'],
      ['At $t = ' + n((p + q) / 2) + '$', 'That is where the speed peaks between the zeros (if anywhere), not where $v$ changes sign.']
    ], '3.E'));
    var sol = ['The zeros of $v$ are $t = ' + p + '$ and $t = ' + q + '$.', dbl ? '$(t - ' + p + ')^2 \\ge 0$, so $v$ has the sign of ' + (k > 0 ? '' : '$-$') + '$(t - ' + q + ')$ around $t = ' + p + '$: no change of sign there.' : '$v$ changes sign at each zero (each factor appears once).', 'The particle changes direction at ' + list + ', where $v$ changes sign.'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'v', f: v, T: T, label: 'Velocity of the particle against time' }, values: { p: p, q: q, k: k, dbl: dbl, turns: turns, c: c } };
  };

  GEN.dist = function(r){
    var A, B, k, T, v, z;
    for(var guard = 0; guard < 80; guard++){
      A = r.pick([2, 3, 4]); B = r.pick([-1, -0.5, 0.5, 1]); k = r.pick([2, 3, 4]); T = r.pick([3, 3.5, 4, 4.5, 5]);
      v = (function(A, B, k){ return function(t){ return A * Math.sin(t * t / k) + B; }; })(A, B, k);
      z = M.roots(v, 0, T, 1600).filter(function(x){ return x > 1e-9 && x < T - 1e-9; });
      if(!z.some(function(x){ return x > 0.1 && x < T - 0.1; })) continue;
      // the trip back must be worth counting: distance and |displacement| differ by 0.05 m or more
      var cz = [0].concat(z, [T]), ab = 0, sg = 0;
      for(var j = 0; j < cz.length - 1; j++){ var piece = M.integral(v, cz[j], cz[j + 1], 1e-10); ab += Math.abs(piece); sg += piece; }
      if(ab - Math.abs(sg) > 0.05) break;
    }
    var x0 = r.nonzero(-3, 3);
    var disp = M.integral(v, 0, T, 1e-12), cuts = [0].concat(z, [T]), dist = 0;
    for(var i = 0; i < cuts.length - 1; i++) dist += Math.abs(M.integral(v, cuts[i], cuts[i + 1], 1e-12));
    var xT = x0 + disp, vtex = A + '\\sin\\left(\\frac{t^2}{' + k + '}\\right) ' + (B < 0 ? '- ' : '+ ') + n(Math.abs(B));
    var text = H('<p>A particle moves along the <i>x</i>-axis with velocity $v(t) = ' + vtex + '$ meters per second for $0 \\le t \\le ' + n(T) + '$ (radians). At $t = 0$ it is at $x = ' + x0 + '$. Use a calculator.</p>');
    var steps = [
      numStep('disp', 'Find the displacement from $t = 0$ to $t = ' + n(T) + '$.', disp, [[dist, 'That is the total distance. Displacement is $\\int_0^{' + n(T) + '} v(t)\\,dt$: area below the axis counts as negative.'], [xT, 'That adds the starting position. Displacement is the change in position, $\\int_0^{' + n(T) + '} v(t)\\,dt$.']], { calc: true, unit: 'm', practice: '1.E' }),
      numStep('dist', 'Find the total distance traveled.', dist, [[Math.abs(disp), 'That is the size of the displacement. Total distance is $\\int_0^{' + n(T) + '} |v(t)|\\,dt$: the trip back counts too.'], [disp, 'That is the displacement. Total distance is $\\int_0^{' + n(T) + '} |v(t)|\\,dt$.']], { calc: true, unit: 'm', practice: '1.E' }),
      numStep('xT', 'Find the position at $t = ' + n(T) + '$.', xT, [[disp, 'Add the starting position: $x(' + n(T) + ') = ' + x0 + ' + \\int_0^{' + n(T) + '} v(t)\\,dt$.'], [x0 + dist, 'Use the displacement, not the distance: $x(' + n(T) + ') = x(0) + \\int_0^{' + n(T) + '} v(t)\\,dt$.']], { calc: true, unit: 'm', practice: '1.E' })
    ];
    var sol = ['Displacement: $\\int_0^{' + n(T) + '} v(t)\\,dt \\approx ' + M.fixed(disp, 3) + '$ m.', '$v$ changes sign at $t \\approx ' + z.map(function(q){ return M.fixed(q, 3); }).join(', ') + '$. Total distance: $\\int_0^{' + n(T) + '} |v(t)|\\,dt \\approx ' + M.fixed(dist, 3) + '$ m.', 'Position: $x(' + n(T) + ') = ' + x0 + ' + \\int_0^{' + n(T) + '} v(t)\\,dt \\approx ' + M.fixed(xT, 3) + '$ m.', 'Store values in the calculator and round only at the end, to three decimal places.'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'v', f: v, T: T, label: 'Velocity of the particle against time' }, values: { A: A, B: B, k: k, T: T, x0: x0, disp: disp, dist: dist, xT: xT, zeros: z } };
  };

  GEN.graph = function(r){
    // A velocity graph of straight pieces through integer points; v changes sign at least once.
    var pts, T, P;
    for(var guard = 0; guard < 80; guard++){
      var ts = [0], t = 0, steps = r.int(4, 5);
      for(var i = 0; i < steps; i++){ t += r.pick([1, 2, 2, 3]); ts.push(t); }
      pts = ts.map(function(x){ return [x, r.int(-3, 4)]; });
      T = t;
      var neg = pts.some(function(p){ return p[1] < 0; }), pos = pts.some(function(p){ return p[1] > 0; });
      if(neg && pos && T <= 10) break;
    }
    P = pw(pts);
    var x0 = r.nonzero(-4, 4), disp = P.area(T), dist = P.area(T, true), mid = pts[r.int(1, pts.length - 2)][0];
    var xm = x0 + P.area(mid), xT = x0 + disp;
    var text = H('<p>A particle moves along a line. Its velocity, in meters per second, is the graph of straight pieces shown for $0 \\le t \\le ' + T + '$. At $t = 0$ the particle is at $x = ' + x0 + '$.</p>');
    var steps = [
      numStep('disp', 'Find the displacement from $t = 0$ to $t = ' + T + '$, from areas.', disp, [[dist, 'That is the total distance. Area below the axis counts as negative for displacement.'], [xT, 'That adds the starting position. Displacement is the change in position.']], { unit: 'm', practice: '2.B' }),
      numStep('dist', 'Find the total distance traveled from $t = 0$ to $t = ' + T + '$.', dist, [[Math.abs(disp), 'That is the size of the displacement. For distance, every area counts as positive.'], [disp, 'That is the displacement. For distance, count the area below the axis as positive.']], { unit: 'm', practice: '2.B' }),
      numStep('xm', 'Find the position at $t = ' + mid + '$.', xm, [[P.area(mid), 'Add the starting position $x(0) = ' + x0 + '$.'], [x0 + P.area(mid, true), 'Use signed area for position: area below the axis moves the particle back.']], { unit: 'm', practice: '2.B' })
    ];
    var sol = ['Areas between the graph and the axis, above positive and below negative, are triangles and trapezoids.', 'Displacement $= \\int_0^{' + T + '} v(t)\\,dt = ' + n(disp) + '$ m; total distance $= \\int_0^{' + T + '} |v(t)|\\,dt = ' + n(dist) + '$ m.', '$x(' + mid + ') = ' + x0 + ' + \\int_0^{' + mid + '} v(t)\\,dt = ' + n(xm) + '$ m.'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'v', pts: pts, f: P.v, T: T, label: 'Velocity graph made of straight pieces' }, values: { pts: pts, T: T, x0: x0, disp: disp, dist: dist, mid: mid, xm: xm } };
  };

  var TITLE = { deriv: 'Velocity and acceleration', speed: 'Speeding up or slowing down', turn: 'Changes of direction', dist: 'Displacement and distance', graph: 'Distance from a velocity graph' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('motion-lab: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }

  M.register('motionLab', {
    MOTIONS: MOTIONS, ORDER: ORDER, KINDS: Object.keys(GEN), TITLE: TITLE,
    xAt: xAt, distTo: distTo, zeros: zeros, analyze: analyze, table: table, describe: describe, pw: pw,
    generate: generate, n: n, peval: peval, pder: pder
  });
})(typeof window !== 'undefined' ? window : globalThis);
