/* Unit circle model: ApPrecalcMath.unitCircle (docs/apprecalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/apprecalc-briefs/t3.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apprecalc-tool-checks/unit-circle.mjs) and the test
   (scripts/test/apprecalc-tool-unit-circle.test.mjs) run exactly this code.

   Angles are counted in twelfths of pi: m = 4 is 4pi/12 = pi/3. The special
   angles of the course are the multiples of pi/6 and pi/4, that is the m with
   m % 2 == 0 or m % 3 == 0 (16 of them in [0, 2pi)).

     angle(m)        { m, theta, tex, text, ascii, deg, quadrant (0 on an axis),
                       axis, refM, ref, cos, sin, tan, special } where cos, sin,
                       tan are exact values { tex, text, ascii, v } (tan
                       { undef: true } where cos = 0) and ref is angle(refM)
     at(theta)       { theta, cos, sin, tan (NaN where undefined), quadrant,
                       ref, special (an angle(m) when theta is one, else null) }
     SPECIAL         the 16 special m in [0, 24)
     nextSpecial(theta, dir)   the next special angle up (dir 1) or down (-1)
     snap(theta, tol)          the special angle within tol, else theta
     angleTex(theta) / angleText(theta)   a special angle as a pi fraction, else 3 decimals
     generate(rng, ctx, type) -> { ctx, topic, type, title, text, steps, solution, given, fig }
       kinds (KINDS): radian, coords, ray, values, graphs (contexts in
       precalculus/data/tools/unit-circle.json, one per kind, each with its topic) */
(function(G){
  'use strict';
  var M = G.ApPrecalcMath;
  if(!M) return;
  var PI = Math.PI, TAU = 2 * PI;
  function Tx(){ return G.ApPrecalcTex; }
  function H(s){ return Tx() ? Tx().html(s, { strict: true }) : s; }
  function escT(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  /* An option that holds math: a plain-text name for screen readers, the math for the eye. */
  function optHtml(t){
    if(String(t).indexOf('$') < 0 || !Tx()) return '<span class="cd-opt-t">' + H(t) + '</span>';
    return '<span class="cd-opt-t"><span class="sr-only">' + escT(Tx().plain(t)) + '</span><span aria-hidden="true">' + H(t) + '</span></span>';
  }
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = a % b; a = b; b = t; } return a || 1; }

  /* ------------------------------------------------------------ exact values */
  function V(tex, text, ascii, v){ return { tex: tex, text: text, ascii: ascii, v: v }; }
  var ZERO = V('0', '0', '0', 0), ONE = V('1', '1', '1', 1), HALF = V('\\frac{1}{2}', '1/2', '1/2', 0.5);
  var R2 = V('\\frac{\\sqrt{2}}{2}', '√2/2', 'sqrt(2)/2', Math.SQRT2 / 2), R3 = V('\\frac{\\sqrt{3}}{2}', '√3/2', 'sqrt(3)/2', Math.sqrt(3) / 2);
  var T3 = V('\\frac{\\sqrt{3}}{3}', '√3/3', 'sqrt(3)/3', Math.sqrt(3) / 3), S3 = V('\\sqrt{3}', '√3', 'sqrt(3)', Math.sqrt(3));
  var UNDEF = { undef: true, tex: '\\text{undefined}', text: 'undefined', ascii: '', v: NaN };
  // the first-quadrant values, by the reference angle in twelfths of pi
  var REF = { 0: [ONE, ZERO, ZERO], 2: [R3, HALF, T3], 3: [R2, R2, ONE], 4: [HALF, R3, S3], 6: [ZERO, ONE, UNDEF] };
  function neg(e){ return e.undef || e.v === 0 ? e : V('-' + e.tex, '−' + e.text, '-' + e.ascii, -e.v); }
  function signed(e, s){ return s < 0 ? neg(e) : e; }

  /* ------------------------------------------------------------ angles */
  var SPECIAL = [];
  for(var k = 0; k < 24; k++) if(k % 2 === 0 || k % 3 === 0) SPECIAL.push(k);
  function isSpecial(m){ var r = ((m % 24) + 24) % 24; return r % 2 === 0 || r % 3 === 0; }
  /* m/12 of pi as TeX, plain text and the student syntax. */
  function piForms(m){
    if(m === 0) return { tex: '0', text: '0', ascii: '0' };
    var g = gcd(m, 12), p = m / g, q = 12 / g, a = Math.abs(p), sg = p < 0 ? '-' : '';
    var coef = a === 1 ? '' : String(a);
    if(q === 1) return { tex: sg + coef + '\\pi', text: (sg ? '−' : '') + coef + 'π', ascii: sg + coef + 'pi' };
    return { tex: sg + '\\frac{' + coef + '\\pi}{' + q + '}', text: (sg ? '−' : '') + coef + 'π/' + q, ascii: sg + coef + 'pi/' + q };
  }
  var AXIS = { 0: 'the positive x-axis', 6: 'the positive y-axis', 12: 'the negative x-axis', 18: 'the negative y-axis' };
  var QNAME = ['on an axis', 'Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'];
  function angle(m){
    var mm = ((m % 24) + 24) % 24, f = piForms(m);
    var quad = mm % 6 === 0 ? 0 : Math.floor(mm / 6) + 1;
    var refM = mm <= 6 ? mm : mm <= 12 ? 12 - mm : mm <= 18 ? mm - 12 : 24 - mm;
    var cs = mm === 6 || mm === 18 ? 0 : (mm < 6 || mm > 18) ? 1 : -1;
    var ss = mm === 0 || mm === 12 ? 0 : mm < 12 ? 1 : -1;
    var out = { m: m, theta: m * PI / 12, tex: f.tex, text: f.text, ascii: f.ascii, deg: m * 15, quadrant: quad, axis: quad ? '' : AXIS[mm],
      where: quad ? QNAME[quad] : 'on ' + AXIS[mm], refM: refM, special: isSpecial(m) };
    if(out.special){
      var base = REF[refM];
      out.cos = signed(base[0], cs); out.sin = signed(base[1], ss);
      out.tan = cs === 0 ? UNDEF : signed(base[2], cs * ss);
    }
    return out;
  }
  function refOf(a){ return a.m === a.refM ? a : angle(a.refM); }
  function wrap(t){ t = t % TAU; return t < 0 ? t + TAU : t; }
  function at(theta){
    var c = Math.cos(theta), s = Math.sin(theta), eps = 1e-12;
    if(Math.abs(c) < eps) c = 0; if(Math.abs(s) < eps) s = 0;
    var t = c === 0 ? NaN : s / c, w = wrap(theta);
    var quad = c === 0 || s === 0 ? 0 : c > 0 ? (s > 0 ? 1 : 4) : (s > 0 ? 2 : 3);
    var ref = Math.min(w % PI, PI - (w % PI));
    var k = Math.round(theta / (PI / 12)), sp = Math.abs(theta - k * PI / 12) < 1e-9 && isSpecial(k) ? angle(k) : null;
    return { theta: theta, cos: c, sin: s, tan: t, quadrant: quad, ref: ref, special: sp };
  }
  function nextSpecial(theta, dir){
    var k = theta / (PI / 12), eps = 1e-6, m = dir > 0 ? Math.floor(k + eps) + 1 : Math.ceil(k - eps) - 1;
    while(!isSpecial(m)) m += dir > 0 ? 1 : -1;
    return m * PI / 12;
  }
  function snap(theta, tol){
    var k = Math.round(theta / (PI / 12));
    for(var d = 0; d <= 1; d++) for(var sgn = -1; sgn <= 1; sgn += 2){
      var m = k + d * sgn;
      if(isSpecial(m) && Math.abs(theta - m * PI / 12) <= tol) return m * PI / 12;
    }
    return theta;
  }
  function n3(x){ var s = M.fixed(x, 3); return s.replace(/^-/, '−'); }
  function angleText(theta){ var a = at(theta); return a.special ? a.special.text : n3(theta); }
  function angleTex(theta){ var a = at(theta); return a.special ? a.special.tex : M.fixed(theta, 3); }

  /* ============================================================ the drill */
  function distinct(list, pool){
    var seen = [], spare = (pool || []).slice();
    return list.map(function(o){
      while(seen.indexOf(o[0]) > -1 && spare.length) o = spare.shift();
      seen.push(o[0]); return o;
    }).filter(function(o, i, a){ return a.findIndex(function(p){ return p[0] === o[0]; }) === i; });
  }
  /* list: [[text, why, src?]...], the first right; src is the raw TeX of a
     value option (the validator evaluates it on its own). */
  function choice(key, label, list, practice){
    return { key: key, kind: 'choice', label: H(label), options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }),
      src: list.map(function(o){ return o[2] == null ? null : o[2]; }), correct: 0, practice: practice || '2.A' };
  }
  /* A number typed exactly ("sqrt(3)/2", "5pi/6", "-4/5") or to three decimals. */
  function numStep(key, label, answer, mistakes, o){
    o = o || {};
    var whole = Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '1.A', d: whole ? 0 : 3,
      hint: o.hint || (whole ? '' : 'Exact (like ' + (o.like || 'sqrt(3)/2 or 5pi/6') + ') or to three decimal places.'),
      cell: M.cell(answer, 0, (mistakes || []).map(function(m){ return { value: m[0], why: H(m[1]) }; }), 0.001) };
  }
  function $(t){ return '$' + t + '$'; }
  var QUADS = [1, 2, 3, 4];
  var NON_AXIS = SPECIAL.filter(function(m){ return m % 6 !== 0; });
  var signWord = function(v){ return v > 0 ? 'positive' : v < 0 ? 'negative' : 'zero'; };
  function quadWhy(q){
    return ['', 'right of the y-axis and above the x-axis', 'left of the y-axis and above the x-axis', 'left of the y-axis and below the x-axis', 'right of the y-axis and below the x-axis'][q];
  }
  /* Reference-angle slips: theta itself, and the angle to the nearer part of the y-axis. */
  function refSlips(a){
    var w = a.theta, toY = Math.min(Math.abs(w - PI / 2), Math.abs(w - 3 * PI / 2));
    return [[w, 'That is θ itself, measured from the positive x-axis. The reference angle is the acute angle between the terminal ray and the nearer part of the x-axis.'],
      [toY, 'That is the angle to the y-axis. The reference angle is always measured to the x-axis.'],
      [TAU - w, 'That is how far θ is from a full turn, 2π − θ; it is the reference angle only in Quadrant IV.']];
  }
  function refHow(a){
    return a.quadrant === 1 ? 'In Quadrant I the reference angle is θ itself.' : a.quadrant === 2 ? 'In Quadrant II the reference angle is π − θ.' : a.quadrant === 3 ? 'In Quadrant III the reference angle is θ − π.' : 'In Quadrant IV the reference angle is 2π − θ.';
  }

  var GEN = {};
  /* Radians as arc length: theta = s / r on a circle of radius r. */
  GEN.radian = function(r){
    var m = r.pick(NON_AXIS), a = angle(m), R = r.pick([2, 3, 4, 5, 6, 10]);
    var g = gcd(R * m, 12), p = R * m / g, q = 12 / g, sTex = q === 1 ? (p === 1 ? '' : p) + '\\pi' : '\\frac{' + (p === 1 ? '' : p) + '\\pi}{' + q + '}';
    var s = R * a.theta, ref = refOf(a);
    var text = '<p>' + H('A circle of radius $r = ' + R + '$ cm is centered at the origin. An angle $\\theta$ in standard position cuts off an arc of length $s = ' + sTex + '$ cm, measured counterclockwise from the positive $x$-axis.') + '</p>';
    var steps = [
      numStep('theta', 'Find $\\theta$ in radians.', a.theta, [
        [s, 'That is the arc length. An angle in radians counts the arc in radii: divide the arc by the radius, $\\theta = s / r$.'],
        [s * R, 'Divide the arc by the radius, do not multiply: $\\theta = s / r$.'],
        [R / s, 'Upside down: $\\theta = s / r$, the arc over the radius.']], { practice: '2.B' }),
      choice('quad', 'Where is the terminal ray of $\\theta$?', QUADS.map(function(qq){
        return [QNAME[qq], qq === a.quadrant ? 'Right: $\\theta = ' + a.tex + '$ is between ' + ['', '$0$ and $\\frac{\\pi}{2}$', '$\\frac{\\pi}{2}$ and $\\pi$', '$\\pi$ and $\\frac{3\\pi}{2}$', '$\\frac{3\\pi}{2}$ and $2\\pi$'][qq] + '.'
          : 'Compare $\\theta = ' + a.tex + '$ with the quarter turns $\\frac{\\pi}{2}$, $\\pi$ and $\\frac{3\\pi}{2}$: ' + QNAME[qq] + ' holds the angles between ' + ['', '$0$ and $\\frac{\\pi}{2}$', '$\\frac{\\pi}{2}$ and $\\pi$', '$\\pi$ and $\\frac{3\\pi}{2}$', '$\\frac{3\\pi}{2}$ and $2\\pi$'][qq] + '.'];
      }).sort(function(x, y){ return (y[0] === QNAME[a.quadrant]) - (x[0] === QNAME[a.quadrant]); }), '2.A'),
      numStep('ref', 'Find the reference angle of $\\theta$.', ref.theta, refSlips(a), { like: 'pi/6' })
    ];
    var sol = ['$\\theta = \\dfrac{s}{r} = \\dfrac{' + sTex + '}{' + R + '} = ' + a.tex + '$ radians, about $' + M.fixed(a.theta, 3) + '$.',
      '$' + a.tex + '$ is in ' + QNAME[a.quadrant] + ', ' + quadWhy(a.quadrant) + '.',
      refHow(a) + ' Here it is $' + ref.tex + '$.'];
    return { text: text, steps: steps, solution: sol, given: { m: m, r: R, s: s }, fig: { kind: 'circle', m: m, r: R, hide: true } };
  };

  /* Sine and cosine as coordinates, tangent as the slope of the radius. */
  GEN.coords = function(r){
    var m = r.pick(SPECIAL.filter(function(x){ return x !== 0; })), a = angle(m);
    var text = '<p>' + H('The terminal ray of $\\theta = ' + a.tex + '$ meets the unit circle at the point $P$.') + '</p>';
    var cosW = a.quadrant ? 'In ' + QNAME[a.quadrant] + ' the point is ' + (a.cos.v > 0 ? 'right' : 'left') + ' of the $y$-axis, so $\\cos\\theta$ is ' + signWord(a.cos.v) + '.' : 'Check the sign from where $P$ is.';
    var sinW = a.quadrant ? 'In ' + QNAME[a.quadrant] + ' the point is ' + (a.sin.v > 0 ? 'above' : 'below') + ' the $x$-axis, so $\\sin\\theta$ is ' + signWord(a.sin.v) + '.' : 'Check the sign from where $P$ is.';
    var steps = [
      numStep('cos', 'Find $\\cos\\theta$, the $x$-coordinate of $P$.', a.cos.v, [
        [a.sin.v, 'That is $\\sin\\theta$, the $y$-coordinate. Cosine is the $x$-coordinate: how far right or left $P$ is.'],
        [-a.cos.v, 'Right size, wrong sign. ' + cosW]]),
      numStep('sin', 'Find $\\sin\\theta$, the $y$-coordinate of $P$.', a.sin.v, [
        [a.cos.v, 'That is $\\cos\\theta$, the $x$-coordinate. Sine is the $y$-coordinate: how high or low $P$ is.'],
        [-a.sin.v, 'Right size, wrong sign. ' + sinW]])
    ];
    var tanList, cot = a.sin.v === 0 ? null : a.cos.v / a.sin.v;
    var why0 = a.tan.undef ? 'Right: $OP$ is vertical, so its slope, $\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$, divides by $\\cos\\theta = 0$.' : 'Right: the slope of $OP$ is rise over run, $\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta} = ' + a.tan.tex + '$.';
    var cotTex = cot == null ? null : (Math.abs(cot) < 1e-12 ? '0' : valueTex(cot));
    tanList = [[$(a.tan.tex), why0, a.tan.undef ? 'none' : a.tan.tex]];
    if(cotTex != null && !(Math.abs(cot - a.tan.v) < 1e-9)) tanList.push([$(cotTex), 'That is $\\frac{\\cos\\theta}{\\sin\\theta}$, run over rise. The slope of $OP$ is rise over run: $\\frac{\\sin\\theta}{\\cos\\theta}$.', cotTex]);
    if(!a.tan.undef && a.tan.v !== 0) tanList.push([$(neg(a.tan).tex), 'The sign is off. ' + (a.tan.v > 0 ? 'Here sine and cosine have the same sign, so their quotient is positive.' : 'Here sine and cosine have opposite signs, so their quotient is negative.'), neg(a.tan).tex]);
    var pool = [[$('\\text{undefined}'), 'The slope is undefined only when $OP$ is vertical, where $\\cos\\theta = 0$. Here $\\cos\\theta = ' + a.cos.tex + '$.', 'none'],
      [$('0'), 'The slope is $0$ only when $OP$ lies along the $x$-axis, where $\\sin\\theta = 0$.', '0'],
      [$('1'), 'A slope of $1$ means $\\sin\\theta = \\cos\\theta$, which happens only at $\\frac{\\pi}{4}$ and $\\frac{5\\pi}{4}$.', '1'],
      [$('-1'), 'A slope of $-1$ means $\\sin\\theta = -\\cos\\theta$, which happens only at $\\frac{3\\pi}{4}$ and $\\frac{7\\pi}{4}$.', '-1'],
      [$(a.sin.tex), 'That is $\\sin\\theta$ alone. The slope divides it by $\\cos\\theta$.', a.sin.tex]];
    pool = pool.filter(function(o){ return tanList.every(function(t){ return t[0] !== o[0]; }) && !(o[2] !== 'none' && !a.tan.undef && Math.abs(texNum(o[2]) - a.tan.v) < 1e-9) && !(o[2] === 'none' && a.tan.undef); });
    while(tanList.length < 4 && pool.length) tanList.push(pool.shift());
    steps.push(choice('tan', 'Find $\\tan\\theta$, the slope of the radius $OP$.', tanList, '2.A'));
    var sol = ['$P = (\\cos\\theta, \\sin\\theta) = \\left(' + a.cos.tex + ', ' + a.sin.tex + '\\right)$' + (a.quadrant ? ', in ' + QNAME[a.quadrant] + ' (reference angle $' + refOf(a).tex + '$).' : ', on ' + a.axis + '.'),
      '$\\cos\\theta = ' + a.cos.tex + '$ and $\\sin\\theta = ' + a.sin.tex + '$.',
      a.tan.undef ? '$OP$ is vertical, so $\\tan\\theta$ is undefined (no slope).' : '$\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta} = ' + a.tan.tex + '$, the slope of $OP$.'];
    return { text: text, steps: steps, solution: sol, given: { m: m }, fig: { kind: 'circle', m: m } };
  };
  /* An exact value as TeX, when it is one of the unit-circle values (or 0, 1, sqrt3); else 3 decimals. */
  function valueTex(v){
    var all = [ZERO, ONE, HALF, R2, R3, T3, S3, V('2', '2', '2', 2), V('\\frac{2\\sqrt{3}}{3}', '2√3/3', '2sqrt(3)/3', 2 / Math.sqrt(3)), V('\\sqrt{2}', '√2', 'sqrt(2)', Math.SQRT2)];
    for(var i = 0; i < all.length; i++){ if(Math.abs(all[i].v - v) < 1e-9) return all[i].tex; if(Math.abs(all[i].v + v) < 1e-9) return neg(all[i]).tex; }
    return M.fixed(v, 3);
  }
  function texNum(t){
    if(t === 'none') return NaN;
    var s = String(t).replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\\pi/g, 'pi');
    return G.ApPrecalcExpr ? G.ApPrecalcExpr.number(s) : NaN;
  }

  /* A ray through a point (x, y): r, then sin, cos and tan as ratios. */
  var TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  function frac(nu, de){
    if(de < 0){ nu = -nu; de = -de; }
    var g = gcd(nu, de); nu /= g; de /= g;
    return { tex: de === 1 ? String(nu) : (nu < 0 ? '-' : '') + '\\frac{' + Math.abs(nu) + '}{' + de + '}', v: nu / de };
  }
  GEN.ray = function(r){
    var t = r.pick(TRIPLES), sw = r() < 0.5, A = sw ? t[1] : t[0], B = sw ? t[0] : t[1], R = t[2];
    var q = r.pick(QUADS), x = (q === 1 || q === 4 ? 1 : -1) * A, y = (q <= 2 ? 1 : -1) * B;
    var sn = frac(y, R), cs = frac(x, R), tn = frac(y, x);
    var text = '<p>' + H('The terminal ray of an angle $\\theta$ in standard position passes through the point $(' + x + ', ' + y + ')$.') + '</p>';
    var steps = [
      numStep('r', 'Find $r$, the distance from the origin to $(' + x + ', ' + y + ')$.', R, [
        [Math.abs(x) + Math.abs(y), 'Distances do not add along the legs. Use the Pythagorean theorem: $r = \\sqrt{x^2 + y^2}$.'],
        [x * x + y * y, 'That is $r^2$. Take its square root.']], { practice: '1.A' }),
      numStep('sin', 'Find $\\sin\\theta$.', sn.v, [
        [y / x, 'That is $\\frac{y}{x}$, which is $\\tan\\theta$. Sine is $\\frac{y}{r}$.'],
        [x / R, 'That is $\\frac{x}{r}$, which is $\\cos\\theta$. Sine uses the $y$-coordinate: $\\frac{y}{r}$.'],
        [R / y, 'Upside down: $\\sin\\theta = \\frac{y}{r}$.'],
        [-sn.v, 'Right size, wrong sign: the point is ' + (y > 0 ? 'above' : 'below') + ' the $x$-axis, so $y$ and $\\sin\\theta$ are ' + signWord(y) + '.']], { like: '-4/5', practice: '2.A' }),
      numStep('cos', 'Find $\\cos\\theta$.', cs.v, [
        [y / R, 'That is $\\frac{y}{r}$, which is $\\sin\\theta$. Cosine uses the $x$-coordinate: $\\frac{x}{r}$.'],
        [R / x, 'Upside down: $\\cos\\theta = \\frac{x}{r}$.'],
        [-cs.v, 'Right size, wrong sign: the point is ' + (x > 0 ? 'right' : 'left') + ' of the $y$-axis, so $x$ and $\\cos\\theta$ are ' + signWord(x) + '.']], { like: '-4/5', practice: '2.A' }),
      numStep('tan', 'Find $\\tan\\theta$, the slope of the ray.', tn.v, [
        [x / y, 'Upside down: the slope is rise over run, $\\tan\\theta = \\frac{y}{x}$.'],
        [y / R, 'That is $\\sin\\theta = \\frac{y}{r}$. The slope is $\\frac{y}{x}$.'],
        [-tn.v, 'Right size, wrong sign: $x$ and $y$ have ' + (x * y > 0 ? 'the same sign, so the slope is positive.' : 'opposite signs, so the slope is negative.')]], { like: '-4/3', practice: '2.A' })
    ];
    var sol = ['$r = \\sqrt{(' + x + ')^2 + (' + y + ')^2} = \\sqrt{' + (x * x + y * y) + '} = ' + R + '$.',
      '$\\sin\\theta = \\dfrac{y}{r} = ' + sn.tex + '$ and $\\cos\\theta = \\dfrac{x}{r} = ' + cs.tex + '$.',
      '$\\tan\\theta = \\dfrac{y}{x} = ' + tn.tex + '$, the slope of the ray. The point is in ' + QNAME[q] + ', so the signs match.'];
    return { text: text, steps: steps, solution: sol, given: { x: x, y: y }, fig: { kind: 'ray', x: x, y: y, r: R } };
  };

  /* Exact values from the reference angle and the quadrant; a circle of radius r. */
  GEN.values = function(r){
    var m = r.pick(NON_AXIS.filter(function(x){ return x > 6; }).concat(r() < 0.15 ? [2, 3, 4] : [])), a = angle(m), ref = refOf(a);
    var fn = r.pick(['sin', 'cos']), other = fn === 'sin' ? 'cos' : 'sin', R = r.pick([2, 3, 4, 5, 6, 8, 10]);
    var val = a[fn], oth = a[other], coord = fn === 'sin' ? 'y' : 'x';
    var text = '<p>' + H('Use the unit circle and the angle $\\theta = ' + a.tex + '$.') + '</p>';
    var SIGNS = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    var sgnTxt = function(c, s){ return '$\\cos\\theta ' + (c > 0 ? '>' : '<') + ' 0$ and $\\sin\\theta ' + (s > 0 ? '>' : '<') + ' 0$'; };
    var steps = [
      numStep('ref', 'Find the reference angle of $\\theta$.', ref.theta, refSlips(a), { like: 'pi/6' }),
      choice('signs', 'Which signs do $\\cos\\theta$ and $\\sin\\theta$ have?', SIGNS.map(function(sg, i){
        var qq = i + 1;
        return [sgnTxt(sg[0], sg[1]), qq === a.quadrant ? 'Right: $\\theta$ is in ' + QNAME[qq] + ', ' + quadWhy(qq) + '.' : 'Those are the signs in ' + QNAME[qq] + '. $\\theta = ' + a.tex + '$ is in ' + QNAME[a.quadrant] + ', ' + quadWhy(a.quadrant) + '.'];
      }).sort(function(x, y){ return (y[1].indexOf('Right') === 0) - (x[1].indexOf('Right') === 0); }), '3.A'),
      numStep(fn, 'Find $\\' + fn + '\\theta$ exactly.', val.v, [
        [oth.v, 'That is $\\' + other + '\\theta$. ' + (fn === 'sin' ? 'Sine is the $y$-coordinate.' : 'Cosine is the $x$-coordinate.')],
        [-val.v, 'Right size, wrong sign: in ' + QNAME[a.quadrant] + ' $\\' + fn + '\\theta$ is ' + signWord(val.v) + '.']]),
      numStep('rc', 'A circle of radius $' + R + '$ is centered at the origin. Find the $' + coord + '$-coordinate of the point where the terminal ray of $\\theta$ meets it.', R * val.v, [
        [val.v, 'That is the coordinate on the unit circle. On a circle of radius $r$ the point is $(r\\cos\\theta, r\\sin\\theta)$: multiply by $' + R + '$.'],
        [R * oth.v, 'That is the ' + (coord === 'x' ? '$y$' : '$x$') + '-coordinate. ' + (coord === 'x' ? 'The $x$-coordinate is $r\\cos\\theta$.' : 'The $y$-coordinate is $r\\sin\\theta$.')],
        [-R * val.v, 'Right size, wrong sign: keep the sign of $\\' + fn + '\\theta$.']], { like: '3sqrt(2) or -5/2', practice: '3.B' })
    ];
    var sol = [refHow(a) + ' Here it is $' + ref.tex + '$.',
      '$\\theta$ is in ' + QNAME[a.quadrant] + ', ' + quadWhy(a.quadrant) + ', so $\\cos\\theta$ is ' + signWord(a.cos.v) + ' and $\\sin\\theta$ is ' + signWord(a.sin.v) + '.',
      '$\\' + fn + '\\left(' + ref.tex + '\\right) = ' + ref[fn].tex + '$, so $\\' + fn + '\\theta = ' + val.tex + '$.',
      'The point is $(' + R + '\\cos\\theta, ' + R + '\\sin\\theta)$; its $' + coord + '$-coordinate is $' + R + ' \\cdot ' + (val.v < 0 ? '\\left(' + val.tex + '\\right)' : val.tex) + '$, about $' + M.fixed(R * val.v, 3) + '$.'];
    return { text: text, steps: steps, solution: sol, given: { m: m, fn: fn, r: R }, fig: { kind: 'circle', m: m, r: R } };
  };

  /* The graphs unrolled from the circle: values, increasing, zeros, rates. */
  var QUARTERS = [[0, 6], [6, 12], [12, 18], [18, 24]];
  function ivTex(q){ return '\\left(' + piForms(q[0]).tex + ', ' + piForms(q[1]).tex + '\\right)'; }
  GEN.graphs = function(r){
    var fn = r.pick(['sin', 'cos']), m = r.pick(NON_AXIS), a = angle(m), val = a[fn], oth = a[fn === 'sin' ? 'cos' : 'sin'];
    var name = '\\' + fn + '\\theta';
    var incQ = fn === 'sin' ? [0, 3] : [2, 3], decQ = fn === 'sin' ? [1, 2] : [0, 1];
    var text = '<p>' + H('The graph of $y = ' + name + '$ for $0 \\le \\theta \\le 2\\pi$ is traced by the ' + (fn === 'sin' ? 'height' : '$x$-coordinate') + ' of a point turning once around the unit circle.') + '</p>';
    var inc = QUARTERS[r.pick(incQ)];
    var incList = [[$(ivTex(inc)), 'Right: on this quarter turn the point\'s ' + (fn === 'sin' ? 'height' : '$x$-coordinate') + ' grows, so the graph rises.']]
      .concat(decQ.map(function(i){ return [$(ivTex(QUARTERS[i])), 'On this quarter turn the ' + (fn === 'sin' ? 'height' : '$x$-coordinate') + ' shrinks, so the graph falls there.']; }))
      .concat([[$('\\left(0, \\pi\\right)'), fn === 'sin' ? 'On $(0, \\pi)$ the graph rises and then falls: it is increasing only on $\\left(0, \\frac{\\pi}{2}\\right)$.' : 'On $(0, \\pi)$ the graph of cosine falls the whole way: it is decreasing there.']]);
    var zeros = fn === 'sin' ? '$\\theta = 0$, $\\pi$ and $2\\pi$' : '$\\theta = \\frac{\\pi}{2}$ and $\\frac{3\\pi}{2}$';
    var zList = [[zeros, 'Right: ' + (fn === 'sin' ? 'the height is 0 where the point is on the $x$-axis.' : 'the $x$-coordinate is 0 where the point is on the $y$-axis.')],
      [fn === 'sin' ? '$\\theta = \\frac{\\pi}{2}$ and $\\frac{3\\pi}{2}$' : '$\\theta = 0$, $\\pi$ and $2\\pi$', 'Those are the zeros of ' + (fn === 'sin' ? 'cosine' : 'sine') + '. ' + (fn === 'sin' ? 'Sine is 0 where the point is on the $x$-axis.' : 'Cosine is 0 where the point is on the $y$-axis.')],
      [fn === 'sin' ? '$\\theta = \\pi$ only' : '$\\theta = \\frac{\\pi}{2}$ only', 'There are more: on $[0, 2\\pi]$ the point crosses the ' + (fn === 'sin' ? '$x$-axis three times (at the start, halfway, and at the end).' : '$y$-axis twice.')],
      [fn === 'sin' ? '$\\theta = \\frac{\\pi}{2}$ only' : '$\\theta = 0$ and $2\\pi$', fn === 'sin' ? 'At $\\frac{\\pi}{2}$ sine is 1, its maximum, not 0.' : 'At $0$ and $2\\pi$ cosine is 1, its maximum, not 0.']];
    var qi = r.int(0, 3), Q = QUARTERS[qi], incr = incQ.indexOf(qi) > -1;
    // concave down where the function is positive (sine on (0, pi), cosine on its first and last quarters)
    var down = fn === 'sin' ? qi <= 1 : qi === 0 || qi === 3;
    var combo = function(i, rr){ return '$y$ is ' + (i ? 'increasing' : 'decreasing') + ' and the rate of change of $y$ is ' + (rr ? 'increasing' : 'decreasing'); };
    var right = combo(incr, !down), bendW = down ? 'The graph is concave down there (it bends downward), so the rate of change of $y$ is decreasing.' : 'The graph is concave up there (it bends upward), so the rate of change of $y$ is increasing.';
    var rateList = [[right, 'Right. ' + (incr ? 'The graph rises on this interval.' : 'The graph falls on this interval.') + ' ' + bendW]];
    [[incr, down], [!incr, !down], [!incr, down]].forEach(function(c){
      rateList.push([combo(c[0], c[1]), c[0] !== incr ? 'Read the direction first: the graph ' + (incr ? 'rises' : 'falls') + ' on this interval, so $y$ is ' + (incr ? 'increasing' : 'decreasing') + '.' : 'The direction is right; the rate is not. ' + bendW]);
    });
    var steps = [
      numStep('val', 'Find the ' + (fn === 'sin' ? 'height' : 'value') + ' of the graph at $\\theta = ' + a.tex + '$.', val.v, [
        [oth.v, 'That is the ' + (fn === 'sin' ? 'cosine' : 'sine') + ' value. On this graph $y = ' + name + '$.'],
        [-val.v, 'Right size, wrong sign: at $\\theta = ' + a.tex + '$ the point is in ' + QNAME[a.quadrant] + ', where $' + name + '$ is ' + signWord(val.v) + '.']], { practice: '2.A' }),
      choice('inc', 'On which interval is $y = ' + name + '$ increasing?', incList, '3.A'),
      choice('zero', 'Where is $y = ' + name + '$ equal to 0 on $[0, 2\\pi]$?', zList, '2.A'),
      choice('rate', 'Which is true on $' + ivTex(Q) + '$?', rateList, '3.A')
    ];
    var sol = ['At $\\theta = ' + a.tex + '$ the point is $\\left(' + a.cos.tex + ', ' + a.sin.tex + '\\right)$, so $y = ' + val.tex + '$.',
      '$y = ' + name + '$ is ' + (fn === 'sin' ? 'increasing on $\\left(0, \\frac{\\pi}{2}\\right)$ and $\\left(\\frac{3\\pi}{2}, 2\\pi\\right)$ and decreasing on $\\left(\\frac{\\pi}{2}, \\frac{3\\pi}{2}\\right)$.' : 'decreasing on $(0, \\pi)$ and increasing on $(\\pi, 2\\pi)$.'),
      'It is 0 at ' + zeros + '.',
      'On $' + ivTex(Q) + '$: ' + right + '. ' + bendW];
    return { text: text, steps: steps, solution: sol, given: { fn: fn, m: m, q: qi }, fig: { kind: 'graph', fn: fn, m: m, q: qi } };
  };

  var TITLE = { radian: 'Radians as arc length', coords: 'Sine and cosine on the circle', ray: 'A ray through a point', values: 'Exact values from the reference angle', graphs: 'The graphs from the circle' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('unit-circle: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }

  M.register('unitCircle', {
    SPECIAL: SPECIAL, KINDS: Object.keys(GEN), TITLE: TITLE, QNAME: QNAME,
    angle: angle, at: at, refOf: refOf, isSpecial: isSpecial, nextSpecial: nextSpecial, snap: snap, piForms: piForms,
    angleText: angleText, angleTex: angleTex, wrap: wrap, valueTex: valueTex, texNum: texNum, n3: n3,
    generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
