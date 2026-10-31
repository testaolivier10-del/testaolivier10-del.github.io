/* Sinusoid builder model: ApPrecalcMath.sinusoidBuilder (docs/apprecalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/apprecalc-briefs/t3.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apprecalc-tool-checks/sinusoid-builder.mjs) and the test
   (scripts/test/apprecalc-tool-sinusoid-builder.test.mjs) run exactly this code.

   A periodic situation is { max, min, T, start, t0 }: the highest and lowest
   values, the period, and what happens at time t0 ('max', 'min', 'up' for a
   midline crossing going up, 'down' going down).
     truth(s)            { A, D, b, f(t), sinC, cosC, keys }: amplitude, midline,
                         b = 2pi/T, the function, the shift c of the form
                         a sin(b(t + c)) + d (a > 0) and of a cos(b(t + c)) + d,
                         and the five labeled points from t0
     model(p)            the student's function from { a, d, T, c, form }
     fit(p, pts, tol)    which data points the student's curve passes through
     keyPoints(p, from)  the five labeled points of a model from a time
     piTex(x) / piText(x)   b and friends as a multiple of pi ("\frac{\pi}{5}")
     SCENES              the four Explore scenes (Ferris wheel, tide, spring,
                         temperature table), each with its situation and slider ranges
     generate(rng, ctx, type) -> the "Test yourself" problem; kinds (KINDS):
       transform (3.6), context, points, rate, table (3.7). No calculator:
       exact values ("pi/5"), or three decimals. */
(function(G){
  'use strict';
  var M = G.ApPrecalcMath;
  if(!M) return;
  var PI = Math.PI, TAU = 2 * PI;
  function Tx(){ return G.ApPrecalcTex; }
  function H(s){ return Tx() ? Tx().html(s, { strict: true }) : s; }
  function escT(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function optHtml(t){
    if(String(t).indexOf('$') < 0 || !Tx()) return '<span class="cd-opt-t">' + H(t) + '</span>';
    return '<span class="cd-opt-t"><span class="sr-only">' + escT(Tx().plain(t)) + '</span><span aria-hidden="true">' + H(t) + '</span></span>';
  }
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = a % b; a = b; b = t; } return a || 1; }
  /* A number as short text: whole, or up to 3 decimals without trailing zeros. */
  function n(x){
    if(Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    return M.fixed(x, 3).replace(/0+$/, '').replace(/\.$/, '');
  }
  function nt(x){ return n(x).replace(/^-/, '−'); }
  /* A rational number p/q (q small) as a fraction, when it is one. */
  function ratio(x){
    for(var q = 1; q <= 24; q++){ var p = Math.round(x * q); if(Math.abs(p / q - x) < 1e-9){ var g = gcd(p, q); return [p / g, q / g]; } }
    return null;
  }
  /* x as a multiple of pi: "\frac{\pi}{5}", "2\pi", "\frac{3\pi}{4}"; else the number. */
  function piForm(x){
    var r = ratio(x / PI);
    if(!r || r[0] === 0) return null;
    var a = Math.abs(r[0]), s = r[0] < 0 ? '-' : '', co = a === 1 ? '' : String(a);
    return { tex: r[1] === 1 ? s + co + '\\pi' : s + '\\frac{' + co + '\\pi}{' + r[1] + '}', text: (s ? '−' : '') + co + 'π' + (r[1] === 1 ? '' : '/' + r[1]), ascii: s + '(' + co + (co ? '*' : '') + 'pi' + (r[1] === 1 ? '' : '/' + r[1]) + ')', p: r[0], q: r[1] };
  }
  function piTex(x){ var f = piForm(x); return f ? f.tex : fracTex(x); }
  function piText(x){ var f = piForm(x); return f ? f.text : nt(x); }
  function fracTex(x){ var r = ratio(x); if(!r || r[1] === 1 || r[1] > 12) return n(x); return (r[0] < 0 ? '-' : '') + '\\frac{' + Math.abs(r[0]) + '}{' + r[1] + '}'; }
  function fracAscii(x){ var r = ratio(x); if(!r || r[1] === 1 || r[1] > 12) return n(x); return (r[0] < 0 ? '-' : '') + Math.abs(r[0]) + '/' + r[1]; }

  /* ------------------------------------------------------------ the truth */
  var START_UP = { max: -0.25, up: 0, down: 0.5, min: 0.25 };   // the rising midline crossing, in periods after t0
  var START_PEAK = { max: 0, up: 0.25, down: -0.25, min: 0.5 };
  var PATTERN = { max: ['max', 'mid', 'min', 'mid', 'max'], min: ['min', 'mid', 'max', 'mid', 'min'], up: ['mid', 'max', 'mid', 'min', 'mid'], down: ['mid', 'min', 'mid', 'max', 'mid'] };
  /* c in (-T/2, T/2] with t = -c a time the shape starts (form a sin(b(t + c)) + d). */
  function norm(c, T){ c = ((c % T) + T) % T; if(c > T / 2 + 1e-9) c -= T; return Math.abs(c) < 1e-12 ? 0 : c; }
  function truth(s){
    var A = (s.max - s.min) / 2, D = (s.max + s.min) / 2, b = TAU / s.T;
    var tUp = s.t0 + START_UP[s.start] * s.T, tPk = s.t0 + START_PEAK[s.start] * s.T;
    var f = function(t){ return D + A * Math.sin(b * (t - tUp)); };
    var lv = { max: s.max, min: s.min, mid: D };
    var keys = PATTERN[s.start].map(function(k, i){ return { t: s.t0 + i * s.T / 4, y: lv[k], kind: k }; });
    return { A: A, D: D, b: b, f: f, sinC: norm(-tUp, s.T), cosC: norm(-tPk, s.T), tUp: tUp, tPk: tPk, keys: keys };
  }
  /* The student's model: a trig(b(t + c)) + d with b = 2pi / T. */
  function model(p){
    var b = TAU / p.T, tr = p.form === 'cos' ? Math.cos : Math.sin;
    return function(t){ return p.a * tr(b * (t + p.c)) + p.d; };
  }
  function fit(p, pts, tol){
    var f = model(p);
    return pts.map(function(q){ return Math.abs(f(q.t) - q.y) <= tol; });
  }
  /* Five labeled points of a model, one quarter period apart, from the first
     rising midline crossing (sin) or peak (cos) at or after `from`. */
  function keyPoints(p, from){
    var start = -p.c, k = Math.ceil((from - start) / p.T - 1e-9), t0 = start + k * p.T, f = model(p);
    var out = [];
    for(var i = 0; i <= 4; i++){ var t = t0 + i * p.T / 4; out.push({ t: t, y: f(t) }); }
    return out;
  }
  /* The data points of a situation inside [0, until]: every quarter-period point. */
  function dataPoints(s, until){
    var tr = truth(s), q = s.T / 4, k0 = Math.ceil((0 - s.t0) / q - 1e-9), out = [], lv = { max: s.max, min: s.min, mid: tr.D };
    for(var k = k0; s.t0 + k * q <= until + 1e-9; k++){
      var i = ((k % 4) + 4) % 4;
      out.push({ t: s.t0 + k * q, y: lv[PATTERN[s.start][i]], kind: PATTERN[s.start][i] });
    }
    return out;
  }

  /* ------------------------------------------------------------ Explore scenes */
  var SCENES = {
    ferris: { id: 'ferris', name: 'Ferris wheel', tName: 't', tUnit: 'min', yName: 'h', yUnit: 'm', yWord: 'height of the seat', y: [0, 52],
      s: { max: 45, min: 5, T: 10, start: 'min', t0: 0 },
      story: 'A Ferris wheel 40 m across has its lowest seat 5 m above the ground and turns once every 10 minutes. A rider boards at the bottom at t = 0.',
      sl: { a: [0, 30, 1, 10], d: [0, 50, 1, 20], T: [2, 20, 1, 6], c: [-10, 10, 0.5, 0] } },
    tide: { id: 'tide', name: 'Tide', tName: 't', tUnit: 'hr', yName: 'D', yUnit: 'ft', yWord: 'depth of the water', y: [0, 11],
      s: { max: 9, min: 1, T: 12, start: 'max', t0: 2 },
      story: 'At a dock, high tide (9 ft deep) comes at 2 a.m. (t = 2 hours after midnight) and low tide (1 ft) six hours later.',
      sl: { a: [0, 6, 0.5, 2], d: [0, 10, 0.5, 4], T: [2, 24, 1, 8], c: [-12, 12, 0.5, 0] } },
    spring: { id: 'spring', name: 'Spring', tName: 't', tUnit: 's', yName: 'y', yUnit: 'cm', yWord: 'height of the weight above the floor', y: [0, 45],
      s: { max: 38, min: 22, T: 2, start: 'min', t0: 0 },
      story: 'A weight on a spring rests 30 cm above the floor. It is pulled down 8 cm and let go at t = 0; it is back at its lowest point every 2 seconds.',
      sl: { a: [0, 15, 0.5, 4], d: [0, 45, 1, 20], T: [0.5, 6, 0.25, 3], c: [-3, 3, 0.25, 0] } },
    temp: { id: 'temp', name: 'Temperature table', tName: 't', tUnit: 'hr', yName: 'F', yUnit: '°C', yWord: 'temperature', y: [6, 30],
      s: { max: 24, min: 12, T: 24, start: 'up', t0: 9 },
      story: 'A thermometer logs the temperature every 3 hours after midnight. The table is the data; the model is yours.',
      table: [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48],
      sl: { a: [0, 12, 0.5, 3], d: [0, 30, 0.5, 15], T: [4, 36, 1, 16], c: [-12, 12, 1, 0] } }
  };
  var SORDER = ['ferris', 'tide', 'spring', 'temp'];
  /* The scene's data: the quarter-period points, or the table rows (one decimal). */
  function sceneData(sc){
    var s = sc.s, tr = truth(s);
    if(sc.table) return sc.table.map(function(t){ var y = tr.f(t); return { t: t, y: Math.round(y * 10) / 10 }; });
    return dataPoints(s, 2 * s.T);
  }

  /* ============================================================ the drill */
  function choice(key, label, list, practice){
    return { key: key, kind: 'choice', label: H(label), options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }), correct: 0, practice: practice || '3.A' };
  }
  function numStep(key, label, answer, mistakes, o){
    o = o || {};
    var whole = Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '2.A', d: whole ? 0 : 3,
      hint: o.hint || (whole ? '' : 'Exact (like ' + (o.like || 'pi/5 or 3/2') + ') or to three decimal places.'),
      cell: M.cell(answer, 0, (mistakes || []).filter(function(m){ return isFinite(m[0]); }).map(function(m){ return { value: m[0], why: H(m[1]) }; }), 0.001) };
  }
  function exprStep(key, label, lhs, answer, mistakes, dom, v){
    return { key: key, kind: 'expr', label: H(label), lhs: lhs, practice: '1.C',
      cell: M.exprCell(answer, { vars: [v || 't'], domain: dom, mistakes: (mistakes || []).map(function(m){ return { expr: m[0], why: m[1] }; }) }) };
  }
  function distinct(list){ var seen = {}; return list.filter(function(o){ if(seen[o[0]]) return false; seen[o[0]] = 1; return true; }); }

  /* The model in the student syntax: D ± A cos(b(t − t0)), or D ± A sin(...). */
  function bAscii(T){ var f = piForm(TAU / T); return f ? f.ascii : '(' + n(TAU / T) + ')'; }
  function argAscii(T, t0){ var b = bAscii(T); return Math.abs(t0) < 1e-12 ? b + 't' : b + '(t ' + (t0 > 0 ? '- ' + n(t0) : '+ ' + n(-t0)) + ')'; }
  function argTex(T, t0){ var b = piTex(TAU / T); return Math.abs(t0) < 1e-12 ? b + ' t' : b + '\\left(t ' + (t0 > 0 ? '- ' + n(t0) : '+ ' + n(-t0)) + '\\right)'; }
  function modelOf(s, A, D){
    // the form a student writes from where the story starts
    var trig = s.start === 'max' || s.start === 'min' ? 'cos' : 'sin', sg = s.start === 'min' || s.start === 'down' ? '-' : '+';
    var ascii = n(D) + ' ' + sg + ' ' + n(A) + trig + '(' + argAscii(s.T, s.t0) + ')';
    var tex = n(D) + ' ' + sg + ' ' + n(A) + '\\' + trig + '\\left(' + argTex(s.T, s.t0) + '\\right)';
    return { ascii: ascii, tex: tex, trig: trig, sg: sg };
  }

  /* Stories. Each returns a situation and its words; numbers stay whole or halves. */
  var STORY = {};
  STORY.ferris = function(r, o){
    var Dm = r.pick([20, 30, 40, 50, 60, 80]), pl = r.pick([1, 2, 3, 4, 5]), T = r.pick([4, 5, 6, 8, 10, 12, 15, 20]);
    var v = o && o.freq ? 'freq' : r.pick(['min', 'min', 'up', 'max']), t1 = Math.min(T / 2, r.pick([1, 2, 3]));
    var s = { max: pl + Dm, min: pl, T: T, start: v === 'freq' ? 'min' : v, t0: v === 'max' ? t1 : 0 };
    var turn = v === 'freq' ? 'It turns counterclockwise at a constant ' + fracTxt(1 / T) + ' of a rotation per minute.' : 'It turns counterclockwise at a constant speed, once every $' + T + '$ minutes.';
    var at = v === 'up' ? 'At time $t = 0$ minutes, a rider\'s seat is level with the center of the wheel and moving up.'
      : v === 'max' ? 'A rider\'s seat reaches the top of the wheel at time $t = ' + t1 + '$ minutes.' : 'A rider boards at the lowest point at time $t = 0$ minutes.';
    return { s: s, scene: 'ferris', y: 'h', yWord: 'the height of the seat above the ground', yUnit: 'meters', tUnit: 'minutes', freq: v === 'freq',
      text: 'A Ferris wheel has a diameter of $' + Dm + '$ meters, and its lowest seat is $' + pl + '$ meters above the ground. ' + turn + ' ' + at,
      dims: { diameter: Dm, platform: pl } };
  };
  function fracTxt(x){ var r = ratio(x); return r && r[1] !== 1 ? '$\\frac{' + r[0] + '}{' + r[1] + '}$' : '$' + n(x) + '$'; }
  STORY.tide = function(r){
    var lo = r.pick([1, 2, 3, 4, 5, 6]), hi = lo + r.pick([4, 6, 8, 10]), t0 = r.pick([1, 2, 3, 4, 5]);
    var s = { max: hi, min: lo, T: 12, start: 'max', t0: t0 };
    return { s: s, scene: 'tide', y: 'D', yWord: 'the depth of the water at the dock', yUnit: 'feet', tUnit: 'hours', halfGiven: true,
      text: 'The depth of the water at a dock changes sinusoidally. High tide, $' + hi + '$ feet deep, comes $' + t0 + '$ hours after midnight ($t = ' + t0 + '$), and the next low tide, $' + lo + '$ feet deep, comes $6$ hours after that.' };
  };
  STORY.spring = function(r){
    var rest = r.pick([20, 25, 30, 35, 40]), A = r.pick([4, 5, 6, 8, 10]), T = r.pick([1, 2, 3, 4]);
    var s = { max: rest + A, min: rest - A, T: T, start: 'min', t0: 0 };
    return { s: s, scene: 'spring', y: 'y', yWord: 'the height of the weight above the floor', yUnit: 'centimeters', tUnit: 'seconds',
      text: 'A weight hangs from a spring. At rest it is $' + rest + '$ centimeters above the floor. It is pulled down $' + A + '$ centimeters and let go at time $t = 0$ seconds; it then bobs up and down, back at its lowest point every $' + T + '$ ' + (T === 1 ? 'second' : 'seconds') + '.' };
  };

  var SUB = '₀₁₂₃₄';
  var LEVEL = { max: 'the maximum', min: 'the minimum', mid: 'the midline' };
  function levelWhy(k, want){ return 'That is ' + LEVEL[k] + ' value. This point is at ' + LEVEL[want] + ': ' + (want === 'mid' ? 'halfway between the highest and lowest values.' : want === 'max' ? 'the highest value.' : 'the lowest value.'); }

  var GEN = {};
  /* 3.6: read amplitude, period, midline and phase shift from a formula. */
  var BS = [[2, [6, 4, 8]], [3, [4, 12]], [4, [8, 12]], [0.5, [2, 1]]];   // b and the denominators of c/pi that keep the shift unambiguous
  GEN.transform = function(r){
    var trig = r.pick(['sin', 'cos']), a = r.pick([1, 2, 3, 4, 5]) * r.pick([1, 1, -1]), d = r.int(-3, 4);
    var piB = r() < 0.3, b, c, cTex, cText;
    if(piB){ var q = r.pick([2, 3, 4]); b = PI / q; c = r.pick([1, 2]) * r.pick([1, -1]); if(Math.abs(c) % q === 0) c = c > 0 ? 1 : -1; cTex = n(Math.abs(c)); cText = n(Math.abs(c)); }
    else { var pick = r.pick(BS); b = pick[0]; var den = r.pick(pick[1]); c = PI / den * r.pick([1, -1]); cTex = piTex(Math.abs(c)); cText = piText(Math.abs(c)); }
    var bTex = piB ? piTex(b) : fracTex(b), per = TAU / b, perTex = piTex(per);
    var inner = '\\theta ' + (c > 0 ? '+ ' : '- ') + cTex;
    var ftex = (a === 1 ? '' : a === -1 ? '-' : a) + '\\' + trig + '\\left(' + bTex + '\\left(' + inner + '\\right)\\right)' + (d ? (d > 0 ? ' + ' : ' - ') + Math.abs(d) : '');
    var text = '<p>' + H('$f(\\theta) = ' + ftex + '$') + '</p>';
    var A = Math.abs(a), dir = c > 0 ? 'left' : 'right', other = c > 0 ? 'right' : 'left', bc = Math.abs(b * c);
    var bcTex = piB ? piTex(bc) : piTex(bc);
    var parent = (a < 0 ? '-' : '') + (A === 1 ? '' : A) + '\\' + trig + '\\left(' + bTex + '\\theta\\right)' + (d ? (d > 0 ? ' + ' : ' - ') + Math.abs(d) : '');
    var shiftList = distinct([
      ['$' + cTex + '$ to the ' + dir, 'Right: $\\theta ' + (c > 0 ? '+ ' : '- ') + cTex + '$ inside the parentheses moves the graph $' + cTex + '$ to the ' + dir + '.'],
      ['$' + cTex + '$ to the ' + other, 'The sign flips: $\\theta + c$ shifts the graph left by $c$, and $\\theta - c$ shifts it right.'],
      ['$' + bcTex + '$ to the ' + dir, 'That is $b \\cdot c$, the shift you would read from $' + bTex + '\\theta ' + (c > 0 ? '+' : '-') + ' ' + bcTex + '$. Factor out $b$ first: the shift is $c$.'],
      ['$' + bcTex + '$ to the ' + other, 'Two slips: factor out $b$ first (the shift is $c$, not $bc$), and $\\theta + c$ moves the graph left.']
    ]);
    var steps = [
      numStep('amp', 'Find the amplitude of $f$.', A, [[a, 'Amplitude is a distance, so it is never negative: it is $|a|$.'], [2 * A, 'That is the distance from the maximum to the minimum. The amplitude is half of it.'], [d, 'That is the midline. The amplitude is $|a|$.']], { practice: '2.A' }),
      numStep('per', 'Find the period of $f$.', per, [[b, 'That is $b$. The period is $\\frac{2\\pi}{|b|}$: the larger $b$ is, the shorter the period.'], [PI / b, 'The period is $\\frac{2\\pi}{|b|}$, not $\\frac{\\pi}{|b|}$.'], [TAU * b, 'Divide by $b$: the period is $\\frac{2\\pi}{|b|}$.'], [b / TAU, 'Upside down: that is the frequency. The period is $\\frac{2\\pi}{|b|}$.']], { like: piB ? '4' : 'pi/2', practice: '2.A' }),
      numStep('mid', 'The midline of $f$ is $y = k$. Find $k$.', d, [[-d, 'Check the sign: $' + (d > 0 ? '+ ' + d : '- ' + Math.abs(d)) + '$ outside moves the graph ' + (d > 0 ? 'up' : 'down') + '.'], [a, 'That is $a$, which stretches the graph. The midline is the constant added outside, $d$.']], { practice: '2.A' }),
      choice('shift', 'The graph of $f$ is the graph of $y = ' + parent + '$ shifted horizontally by', shiftList, '2.B'),
      numStep('max', 'Find the maximum value of $f$.', d + A, [[d - A, 'That is the minimum, $d - |a|$. The maximum is $d + |a|$.'], [A, 'That is the amplitude alone. Add the midline: $d + |a|$.']], { practice: '3.A' })
    ];
    var sol = ['Amplitude $|a| = ' + A + '$' + (a < 0 ? ' ($a < 0$ only flips the graph)' : '') + '.',
      'Period $\\dfrac{2\\pi}{|b|} = \\dfrac{2\\pi}{' + bTex + '} = ' + perTex + '$.',
      'Midline $y = ' + d + '$.',
      'Phase shift: $' + cTex + '$ to the ' + dir + ' (factor out $b$; $\\theta ' + (c > 0 ? '+' : '-') + ' ' + cTex + '$ moves the graph ' + dir + ').',
      'Maximum $d + |a| = ' + (d + A) + '$; minimum $d - |a| = ' + (d - A) + '$.'];
    return { text: text, steps: steps, solution: sol, given: { trig: trig, a: a, b: b, c: c, d: d }, fig: { kind: 'transform', trig: trig, a: a, b: b, c: c, d: d } };
  };

  /* 3.7: a context gives the extremes and the timing; write the model. */
  GEN.context = function(r){
    var sc = r.pick(['ferris', 'ferris', 'tide', 'spring']), st = STORY[sc](r, { freq: sc === 'ferris' && r() < 0.35 }), s = st.s, tr = truth(s);
    var A = tr.A, D = tr.D, T = s.T, b = tr.b, mod = modelOf(s, A, D), dom = [0, 2 * T];
    var text = '<p>' + H(st.text) + '</p><p>' + H('Let $' + st.y + '(t)$ be ' + st.yWord + ', in ' + st.yUnit + ', at time $t$ ' + st.tUnit + '.') + '</p>';
    var steps = [
      numStep('a', 'Find the amplitude of $' + st.y + '$.', A, [[s.max - s.min, 'That is the whole distance from lowest to highest. The amplitude is half of it: $\\frac{\\max - \\min}{2}$.'], [s.max, 'That is the highest value. The amplitude is how far the value swings from the midline.'], [D, 'That is the midline. The amplitude is $\\frac{\\max - \\min}{2}$.']], { practice: '2.A' }),
      numStep('d', 'The midline is $' + st.y + ' = k$. Find $k$.', D, [[A, 'That is the amplitude. The midline is halfway between the highest and lowest values: $\\frac{\\max + \\min}{2}$.'], [s.max, 'That is the maximum. The midline is halfway: $\\frac{\\max + \\min}{2}$.'], [s.min, 'That is the minimum. The midline is halfway: $\\frac{\\max + \\min}{2}$.']], { practice: '2.A' })
    ];
    if(st.freq) steps.push(numStep('T', 'Find the period, in minutes.', T, [[1 / T, 'That is the frequency, rotations per minute. The period is its reciprocal: minutes per rotation.']], { practice: '2.A' }));
    if(st.halfGiven) steps.push(numStep('T', 'Find the period, in hours.', T, [[T / 2, 'High tide to low tide is half a cycle. The period runs from one high tide to the next.'], [T / 4, 'That is a quarter of a cycle. The period runs from one high tide to the next.']], { practice: '2.A' }));
    steps.push(numStep('b', 'In the model, $b = \\frac{2\\pi}{\\text{period}}$. Find $b$.', b, [[T, 'That is the period itself. $b = \\frac{2\\pi}{\\text{period}}$.'], [1 / T, 'That is the frequency. $b = \\frac{2\\pi}{\\text{period}}$.'], [T / TAU, 'Upside down: $b = \\frac{2\\pi}{\\text{period}}$.'], [PI / T, '$b = \\frac{2\\pi}{\\text{period}}$, not $\\frac{\\pi}{\\text{period}}$.']], { like: 'pi/5', practice: '1.C' }));
    var mist = [[n(D) + ' ' + mod.sg + ' ' + n(A) + mod.trig + '(' + n(T) + (Math.abs(s.t0) < 1e-12 ? 't' : '(t - ' + n(s.t0) + ')') + ')', 'You used the period as $b$. Use $b = \\frac{2\\pi}{\\text{period}}$.'],
      [n(D) + ' ' + mod.sg + ' ' + n(2 * A) + mod.trig + '(' + argAscii(T, s.t0) + ')', 'The coefficient is the amplitude, half the distance from lowest to highest.']];
    if(s.start === 'min') mist.push([n(D) + ' + ' + n(A) + 'cos(' + argAscii(T, s.t0) + ')', 'This model starts at the highest value. At $t = 0$ the value is the lowest: use $-a\\cos$.']);
    if(s.start === 'max' && s.t0 && Math.abs(((2 * s.t0) % T)) > 1e-9) mist.push([n(D) + ' + ' + n(A) + 'cos(' + bAscii(T) + '(t + ' + n(s.t0) + '))', 'The shift has the wrong sign: $t + ' + n(s.t0) + '$ puts the high point at $t = -' + n(s.t0) + '$. Use $t - ' + n(s.t0) + '$.']);
    if(s.start === 'up') mist.push([n(D) + ' + ' + n(A) + 'cos(' + argAscii(T, 0) + ')', 'Cosine starts at its maximum. Here the value starts on the midline going up, which is how sine starts.']);
    steps.push(exprStep('model', 'Write a formula for $' + st.y + '(t)$.', st.y + '(t) =', mod.ascii, mist, dom));
    var sol = ['Amplitude $\\dfrac{' + s.max + ' - ' + s.min + '}{2} = ' + n(A) + '$; midline $' + st.y + ' = \\dfrac{' + s.max + ' + ' + s.min + '}{2} = ' + n(D) + '$.',
      (st.freq ? 'Period: the reciprocal of the frequency, $' + T + '$ minutes. ' : st.halfGiven ? 'Period: high tide to the next high tide is twice the $6$ hours from high to low, $12$ hours. ' : 'Period $' + n(T) + '$. ') + '$b = \\dfrac{2\\pi}{' + n(T) + '} = ' + piTex(b) + '$.',
      (s.start === 'min' ? 'At $t = ' + n(s.t0) + '$ the value is the lowest, so start from $-' + n(A) + '\\cos$.' : s.start === 'max' ? 'The highest value is at $t = ' + n(s.t0) + '$, so use $\\cos$ shifted right by $' + n(s.t0) + '$.' : 'At $t = 0$ the value is on the midline going up, so use $\\sin$.'),
      '$' + st.y + '(t) = ' + mod.tex + '$. Any equivalent form is right, for example one written with $\\sin$ and a shift.'];
    return { text: text, steps: steps, solution: sol, given: { s: s, scene: sc, y: st.y, freq: !!st.freq, half: !!st.halfGiven }, fig: { kind: 'context', s: s, scene: sc, y: st.y, dims: st.dims, tUnit: st.tUnit } };
  };

  /* 3.7 (Q3 A): the five labeled points of one cycle, on an unscaled graph. */
  GEN.points = function(r){
    var sc = r.pick(['ferris', 'tide', 'spring']), st = STORY[sc](r), s = st.s, tr = truth(s);
    var picks = [1, 2, 3, 4], i = r.pick(picks); picks.splice(picks.indexOf(i), 1); var j = r.pick(picks);
    if(j < i){ var t = i; i = j; j = t; }
    var text = '<p>' + H(st.text) + '</p><p>' + H('Let $' + st.y + '(t)$ be ' + st.yWord + ', in ' + st.yUnit + ', at time $t$ ' + st.tUnit + '. The graph shows one cycle of $' + st.y + '$, from $t = ' + n(s.t0) + '$, with five labeled points P₀ to P₄, one quarter of a cycle apart.') + '</p>';
    var steps = [];
    [i, j].forEach(function(k){
      var kp = tr.keys[k], tSl = [[s.t0 + k * s.T / 2, 'The labeled points are a quarter of a cycle apart, so $P_' + k + '$ is $' + k + '$ quarter' + (k > 1 ? 's' : '') + ' of the period after $P_0$.'], [s.t0 + k * s.T, 'Each step from one labeled point to the next is a quarter of the period, not a whole period.']];
      if(s.t0) tSl.push([k * s.T / 4, 'Start from $P_0$ at $t = ' + n(s.t0) + '$, then add the quarter periods.']);
      steps.push(numStep('p' + k + 't', 'Find the $t$-coordinate of $P_' + k + '$.', kp.t, tSl, { practice: '2.A', like: '7.5' }));
      steps.push(numStep('p' + k + 'y', 'Find the $' + st.y + '$-coordinate of $P_' + k + '$.', kp.y, ['max', 'min', 'mid'].filter(function(x){ return x !== kp.kind; }).map(function(x){ return [{ max: s.max, min: s.min, mid: tr.D }[x], levelWhy(x, kp.kind)]; }), { practice: '3.B' }));
    });
    var sol = ['The period is $' + n(s.T) + '$ ' + st.tUnit + ', so the labeled points are $\\frac{' + n(s.T) + '}{4} = ' + n(s.T / 4) + '$ apart, starting at $P_0$, $t = ' + n(s.t0) + '$.',
      'The values: maximum $' + s.max + '$, minimum $' + s.min + '$, midline $' + n(tr.D) + '$.',
      tr.keys.map(function(k, q){ return '$P_' + q + ' = (' + n(k.t) + ', ' + n(k.y) + ')$'; }).join(', ') + '.'];
    return { text: text, steps: steps, solution: sol, given: { s: s, scene: sc, y: st.y, i: i, j: j }, fig: { kind: 'cycle', s: s, y: st.y, tUnit: st.tUnit } };
  };

  /* 3.7 (Q3 C): on an interval between two labeled points, how the value and its rate change. */
  GEN.rate = function(r){
    var sc = r.pick(['ferris', 'tide', 'spring']), st = STORY[sc](r), s = st.s, tr = truth(s), k = r.int(0, 3);
    var p = tr.keys[k], q = tr.keys[k + 1], inc = q.y > p.y;
    // concave up below the midline (from a minimum, the graph bends up), down above it
    var up = p.kind === 'min' || q.kind === 'min';
    var y = st.y, iv = '\\left(' + n(p.t) + ', ' + n(q.t) + '\\right)';
    var text = '<p>' + H(st.text) + '</p><p>' + H('Let $' + y + '(t)$ be ' + st.yWord + ', in ' + st.yUnit + ', at time $t$ ' + st.tUnit + '. The labeled points P₀ to P₄ on one cycle of the graph are a quarter of a cycle apart, from $t = ' + n(s.t0) + '$. Consider the interval from P' + SUB[k] + ' to P' + SUB[k + 1] + ', $t$ in $' + iv + '$.') + '</p>';
    var bend = up ? 'The graph is concave up there, so the rate of change of $' + y + '$ is increasing.' : 'The graph is concave down there, so the rate of change of $' + y + '$ is decreasing.';
    var steps = [
      choice('dir', 'On $' + iv + '$, which is true?', [
        ['$' + y + '$ is ' + (inc ? 'increasing' : 'decreasing'), 'Right: from $P_' + k + '$ (' + LEVEL[p.kind] + ') to $P_' + (k + 1) + '$ (' + LEVEL[q.kind] + ') the value ' + (inc ? 'rises' : 'falls') + ' the whole way.'],
        ['$' + y + '$ is ' + (inc ? 'decreasing' : 'increasing'), 'Compare the ends: $P_' + k + '$ is at ' + LEVEL[p.kind] + ' and $P_' + (k + 1) + '$ at ' + LEVEL[q.kind] + ', so the value ' + (inc ? 'rises' : 'falls') + '.'],
        ['$' + y + '$ ' + (inc ? 'increases and then decreases' : 'decreases and then increases'), 'Between two neighboring labeled points there is no turning point: the extremes are at the labeled points themselves.']
      ], '3.A'),
      choice('rate', 'On $' + iv + '$, is the rate of change of $' + y + '$ increasing or decreasing?', [
        [up ? 'increasing' : 'decreasing', 'Right. ' + bend],
        [up ? 'decreasing' : 'increasing', up ? 'The graph bends upward here (concave up): equal steps in $t$ give larger and larger changes, so the rate of change is increasing.' : 'The graph bends downward here (concave down): equal steps in $t$ give smaller and smaller changes, so the rate of change is decreasing.'],
        ['neither: it is constant', 'A constant rate of change is a straight line. This graph bends, so its rate of change changes.']
      ], '3.A'),
      choice('why', 'Which reason supports your answer about the rate of change?', [
        ['The graph of $' + y + '$ is concave ' + (up ? 'up' : 'down') + ' on the interval.', 'Right: concave ' + (up ? 'up' : 'down') + ' means the rate of change is ' + (up ? 'increasing' : 'decreasing') + '.'],
        ['The graph of $' + y + '$ is concave ' + (up ? 'down' : 'up') + ' on the interval.', 'Look at the bend: ' + (up ? 'below the midline, near a minimum, the graph bends up.' : 'above the midline, near a maximum, the graph bends down.')],
        ['$' + y + '$ is ' + (inc ? 'increasing' : 'decreasing') + ' on the interval.', 'That is how the value changes, not how its rate changes. The bend (concavity) decides the rate.'],
        ['The values of $' + y + '$ are positive on the interval.', 'The sign of the values says nothing about how the rate of change changes. Use the concavity.']
      ], '3.C')
    ];
    var sol = ['$P_' + k + ' = (' + n(p.t) + ', ' + n(p.y) + ')$ is at ' + LEVEL[p.kind] + ' and $P_' + (k + 1) + ' = (' + n(q.t) + ', ' + n(q.y) + ')$ at ' + LEVEL[q.kind] + ', so $' + y + '$ is ' + (inc ? 'increasing' : 'decreasing') + ' on $' + iv + '$.',
      'On this quarter cycle the graph is ' + (up ? 'below' : 'above') + ' its midline and concave ' + (up ? 'up' : 'down') + '.',
      'So the rate of change of $' + y + '$ is ' + (up ? 'increasing' : 'decreasing') + ': on two equal halves of the interval the secant slopes ' + (up ? 'increase' : 'decrease') + '.'];
    return { text: text, steps: steps, solution: sol, given: { s: s, scene: sc, y: y, k: k }, fig: { kind: 'cycle', s: s, y: y, tUnit: st.tUnit, iv: k } };
  };

  /* 3.7: values in a table at quarter periods; build the model. */
  GEN.table = function(r){
    var A = r.pick([2, 3, 4, 5, 6, 8, 10]), D = r.int(1, 12), T = r.pick([4, 8, 12, 16, 20, 24]), start = r.pick(['max', 'min', 'up', 'down']);
    var t0 = T / 4 * r.pick([0, 1, 2]);
    var s = { max: D + A, min: D - A, T: T, start: start, t0: t0 }, tr = truth(s), q = T / 4;
    var rows = [];
    for(var i = 0; i <= 5; i++){ var t = i * q; rows.push([t, tr.f(t)]); }
    rows = rows.map(function(x){ return [x[0], Math.round(x[1] * 1e9) / 1e9]; });
    var tbl = '<table class="pcalc-data"><caption>Values of $g$</caption><thead><tr><th scope="col">$t$</th>' + rows.map(function(x){ return '<th scope="col">$' + n(x[0]) + '$</th>'; }).join('') + '</tr></thead><tbody><tr><th scope="row">$g(t)$</th>' + rows.map(function(x){ return '<td>$' + n(x[1]) + '$</td>'; }).join('') + '</tr></tbody></table>';
    var text = '<p>' + H('The table gives values of a sinusoidal function $g$ at equally spaced times. The largest and smallest values in the table are the maximum and minimum of $g$.') + '</p>' + H(tbl);
    // the first extreme in the table gives the model a student writes
    var firstExt = rows.filter(function(x){ return Math.abs(x[1] - s.max) < 1e-9 || Math.abs(x[1] - s.min) < 1e-9; })[0];
    var isMax = Math.abs(firstExt[1] - s.max) < 1e-9, ms = { max: s.max, min: s.min, T: T, start: isMax ? 'max' : 'min', t0: firstExt[0] };
    var mod = modelOf(ms, A, D);
    var steps = [
      numStep('a', 'Find the amplitude of $g$.', A, [[2 * A, 'That is the distance from the maximum to the minimum. Halve it.'], [s.max, 'That is the maximum value. The amplitude is $\\frac{\\max - \\min}{2}$.'], [D, 'That is the midline value.']], { practice: '2.A' }),
      numStep('d', 'The midline of $g$ is $y = k$. Find $k$.', D, [[A, 'That is the amplitude. The midline is $\\frac{\\max + \\min}{2}$.'], [s.max, 'That is the maximum. The midline is halfway between the maximum and the minimum.'], [s.min, 'That is the minimum. The midline is halfway between the maximum and the minimum.']], { practice: '2.A' }),
      numStep('T', 'Find the period of $g$.', T, [[T / 2, 'That is the time from a maximum to the next minimum, half a cycle. Go from one maximum to the next.'], [q, 'That is the spacing of the table. A full cycle covers four of these steps.']], { practice: '2.A' }),
      numStep('b', 'Find $b = \\frac{2\\pi}{\\text{period}}$.', TAU / T, [[T, 'That is the period itself.'], [1 / T, 'That is the frequency.'], [T / TAU, 'Upside down: $b = \\frac{2\\pi}{\\text{period}}$.']], { like: 'pi/6', practice: '1.C' }),
      exprStep('model', 'Write a formula for $g(t)$.', 'g(t) =', mod.ascii, [
        [n(D) + ' ' + mod.sg + ' ' + n(A) + mod.trig + '(' + n(T) + (firstExt[0] ? '(t - ' + n(firstExt[0]) + ')' : 't') + ')', 'You used the period as $b$. Use $b = \\frac{2\\pi}{\\text{period}}$.'],
        [n(D) + ' ' + (mod.sg === '-' ? '+' : '-') + ' ' + n(A) + mod.trig + '(' + argAscii(T, firstExt[0]) + ')', 'This model is flipped: check the value at $t = ' + n(firstExt[0]) + '$ against the table (the ' + (isMax ? 'maximum' : 'minimum') + ').']
      ], [0, 2 * T])
    ];
    var sol = ['Maximum $' + n(s.max) + '$, minimum $' + n(s.min) + '$: amplitude $' + n(A) + '$, midline $y = ' + n(D) + '$.',
      'From one maximum to the next takes four table steps of $' + n(q) + '$: the period is $' + n(T) + '$, so $b = \\dfrac{2\\pi}{' + n(T) + '} = ' + piTex(TAU / T) + '$.',
      'The ' + (isMax ? 'maximum' : 'minimum') + ' is at $t = ' + n(firstExt[0]) + '$, so $g(t) = ' + mod.tex + '$ (any equivalent form is right).'];
    return { text: text, steps: steps, solution: sol, given: { s: s, rows: rows }, fig: { kind: 'table', s: s, rows: rows } };
  };

  var TITLE = { transform: 'Amplitude, period, midline and shift', context: 'A model from a context', points: 'The five labeled points', rate: 'How the value and its rate change', table: 'A model from a table' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('sinusoid-builder: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }

  M.register('sinusoidBuilder', {
    SCENES: SCENES, SORDER: SORDER, KINDS: Object.keys(GEN), TITLE: TITLE, PATTERN: PATTERN,
    truth: truth, model: model, fit: fit, keyPoints: keyPoints, dataPoints: dataPoints, sceneData: sceneData, norm: norm,
    piForm: piForm, piTex: piTex, piText: piText, n: n, nt: nt, fracTex: fracTex, fracAscii: fracAscii,
    generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
