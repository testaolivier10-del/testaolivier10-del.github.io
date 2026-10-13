/* Related rates model: ApCalcMath.relatedRates (docs/apcalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apcalc-tool-checks/related-rates.mjs) and the test
   (scripts/test/apcalc-tool-related-rates.test.mjs) run exactly this code.

   Loaded after calc-expr.js, calc-math.js and calc-tool-math.js.

   Explore: five scenes, each driven by one quantity u that changes at a
   rate the student sets (SCENES[id]):
     ladder   a 13 ft ladder; u = x, the bottom's distance from the wall;
              given dx/dt; y = √(169 − x²), θ = arccos(x/13)
     cone     a cone tank, tip down, top radius 4 ft, depth 10 ft; u = h,
              the water's depth; given dV/dt; r = 0.4h, V = (4π/75)h³
     shadow   a 15 ft streetlight, a 6 ft person; u = x, the person's
              distance from the post; given dx/dt; s = (2/3)x
     ripple   a ripple on a pond; u = r; given dr/dt; A = πr², C = 2πr
     balloon  a balloon rising 500 ft from an observer; u = h; given dh/dt;
              tan θ = h/500, s = √(500² + h²)
   scene.at(u, rate) -> { q: { key: value }, d: { key: rate } }, every rate
   from the chain rule in closed form; scene.advance(u, rate, dt) -> u after
   dt (exact: the cone integrates its volume, not its depth); scene.chain(u,
   rate) -> [{ say, tex }]: the equations of "Why?" with this moment's numbers.

   Test yourself: generate(rng, ctx) -> { ctx, topic, type, text, steps,
   solution, values } for ctx.kind in ladder | cone | shadow | ripple |
   balloon: the relation (choice), d/dt of it (expr step with rates typed as
   dx/dt, or a choice for the angle), this moment's missing value, the rate
   with its sign, its meaning and unit. Substituting a moment's value before
   differentiating is a named miss at every step it could happen. */
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
  function r6(x){ return Math.round(x * 1e6) / 1e6; }
  /* A number for TeX or text: integers as they are, else up to d decimals. */
  function n(x, d){
    if(Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    var s = M.fixed(x, d == null ? 3 : d).replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }
  /* Exact as a fraction p/q when it is one (q up to 400), else null. */
  function rat(x){
    for(var q = 1; q <= 400; q++){ var p = Math.round(x * q); if(Math.abs(p / q - x) < 1e-9 * Math.max(1, Math.abs(x))){ var g = gcd(Math.abs(p), q); return [p / g, q / g]; } }
    return null;
  }
  function gcd(a, b){ return b ? gcd(b, a % b) : a || 1; }
  /* TeX for a value: a fraction when it is a simple one, else a decimal. */
  function ftex(x){
    var r = rat(x);
    if(!r) return n(x);
    if(r[1] === 1) return String(r[0]);
    return (r[0] < 0 ? '-' : '') + '\\frac{' + Math.abs(r[0]) + '}{' + r[1] + '}';
  }
  /* Student syntax for a value: "2/3", "5". */
  function fstr(x){ var r = rat(x); return !r ? String(r6(x)) : r[1] === 1 ? String(r[0]) : '(' + r[0] + '/' + r[1] + ')'; }
  /* A shown value in words: 3 significant figures, a real minus. */
  function sh(x){ return M.fmt(x, 3); }
  function neg(x){ return String(x).replace(/^-/, '−'); }

  /* =============================================================== scenes */
  var SCENES = {
    ladder: {
      id: 'ladder', name: 'Sliding ladder', short: 'Ladder', L: 13,
      driver: { key: 'x', min: 0.6, max: 12.4, start: 5 },
      rate: { key: 'x', label: 'Bottom moves out at', sym: '\\frac{dx}{dt}', min: -3, max: 3, step: 0.25, value: 2, unit: 'ft/s' },
      watch: 'y', time: 's', speed: 1,
      qs: [
        { key: 'x', sym: 'x', name: 'Bottom to wall', unit: 'ft', rate: 'ft/s' },
        { key: 'y', sym: 'y', name: 'Height of the top', unit: 'ft', rate: 'ft/s' },
        { key: 't', sym: '\\theta', name: 'Angle with the ground', unit: 'rad', rate: 'rad/s' }
      ],
      at: function(x, dx){
        var L = this.L, y = Math.sqrt(L * L - x * x);
        return { q: { x: x, y: y, t: Math.acos(x / L) }, d: { x: dx, y: -x * dx / y, t: -dx / y } };
      },
      advance: function(x, dx, dt){ return x + dx * dt; },
      ends: function(u, rate){ return rate > 0 && u >= this.driver.max - 1e-9 ? 'The ladder is almost flat on the ground.' : rate < 0 && u <= this.driver.min + 1e-9 ? 'The ladder is almost upright against the wall.' : ''; },
      chain: function(x, dx){
        var s = this.at(x, dx), L = this.L, y = s.q.y;
        return [
          { say: 'The ladder, the wall and the ground make a right triangle at every moment, and the ladder is always 13 ft:', tex: 'x^2 + y^2 = 169' },
          { say: 'Differentiate both sides with respect to $t$. Each square needs the chain rule; 169 is a constant:', tex: '2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0' },
          { say: 'Only now use this moment\'s values:', tex: 'x = ' + n(x, 2) + ',\\quad y = \\sqrt{169 - (' + n(x, 2) + ')^2} \\approx ' + n(y, 3) + ',\\quad \\frac{dx}{dt} = ' + n(dx, 2) },
          { say: 'Substitute:', tex: '2(' + n(x, 2) + ')(' + n(dx, 2) + ') + 2(' + n(y, 3) + ')\\frac{dy}{dt} = 0' },
          { say: 'Solve for the unknown rate:', tex: '\\frac{dy}{dt} = -\\frac{(' + n(x, 2) + ')(' + n(dx, 2) + ')}{' + n(y, 3) + '} \\approx ' + n(s.d.y, 3) + '\\text{ ft/s}' }
        ];
      },
      meaning: function(x, dx){
        var d = this.at(x, dx).d.y;
        if(Math.abs(dx) < 1e-9) return 'The bottom is still, so the top is still too.';
        return 'The top slides ' + (d < 0 ? 'down' : 'up') + ' the wall at ' + sh(Math.abs(d)) + ' ft/s while the bottom moves ' + (dx > 0 ? 'out' : 'in') + ' at ' + sh(Math.abs(dx)) + ' ft/s.';
      },
      plot: { label: 'How fast the top moves, against the bottom\'s distance', x: [0, 13], xKey: 'x', yKey: 'y', xLabel: 'x (ft)', yLabel: 'dy/dt' }
    },
    cone: {
      id: 'cone', name: 'Filling cone', short: 'Cone', R: 4, H: 10,
      driver: { key: 'h', min: 0.5, max: 10, start: 3 },
      rate: { key: 'V', label: 'Water flows in at', sym: '\\frac{dV}{dt}', min: -6, max: 6, step: 0.5, value: 3, unit: 'ft³/min' },
      watch: 'h', time: 'min', speed: 2,
      qs: [
        { key: 'V', sym: 'V', name: 'Volume of water', unit: 'ft³', rate: 'ft³/min' },
        { key: 'h', sym: 'h', name: 'Depth of water', unit: 'ft', rate: 'ft/min' },
        { key: 'r', sym: 'r', name: 'Radius of the surface', unit: 'ft', rate: 'ft/min' }
      ],
      k: function(){ return this.R / this.H; },
      vol: function(h){ var k = this.k(); return Math.PI * k * k * h * h * h / 3; },
      depth: function(V){ var k = this.k(); return Math.cbrt(3 * Math.max(0, V) / (Math.PI * k * k)); },
      at: function(h, dV){
        var k = this.k(), dh = dV / (Math.PI * k * k * h * h);
        return { q: { V: this.vol(h), h: h, r: k * h }, d: { V: dV, h: dh, r: k * dh } };
      },
      advance: function(h, dV, dt){ return this.depth(this.vol(h) + dV * dt); },
      ends: function(u, rate){ return rate > 0 && u >= this.driver.max - 1e-9 ? 'The tank is full.' : rate < 0 && u <= this.driver.min + 1e-9 ? 'The tank is almost empty.' : ''; },
      chain: function(h, dV){
        var s = this.at(h, dV), k = this.k(), c = k * k / 3; // V = (π k²/3) h³
        return [
          { say: 'The water is a cone:', tex: 'V = \\frac{1}{3}\\pi r^2 h' },
          { say: 'Similar triangles hold at every moment, so you may use them before differentiating:', tex: '\\frac{r}{h} = \\frac{' + this.R + '}{' + this.H + '},\\quad r = ' + ftex(k) + 'h' },
          { say: 'Write V in h alone:', tex: 'V = \\frac{1}{3}\\pi\\left(' + ftex(k) + 'h\\right)^2 h = ' + ftex(c) + '\\pi h^3' },
          { say: 'Differentiate with respect to $t$ (chain rule on $h^3$):', tex: '\\frac{dV}{dt} = ' + ftex(3 * c) + '\\pi h^2\\frac{dh}{dt}' },
          { say: 'Now use this moment\'s values, $h = ' + n(h, 2) + '$ and $\\frac{dV}{dt} = ' + n(dV, 2) + '$:', tex: n(dV, 2) + ' = ' + ftex(3 * c) + '\\pi(' + n(h, 2) + ')^2\\frac{dh}{dt}' },
          { say: 'Solve:', tex: '\\frac{dh}{dt} \\approx ' + n(s.d.h, 3) + '\\text{ ft/min},\\quad \\frac{dr}{dt} = ' + ftex(k) + '\\frac{dh}{dt} \\approx ' + n(s.d.r, 3) + '\\text{ ft/min}' }
        ];
      },
      meaning: function(h, dV){
        var d = this.at(h, dV).d.h;
        if(Math.abs(dV) < 1e-9) return 'No water flows, so the level holds still.';
        return 'The water level ' + (d > 0 ? 'rises' : 'falls') + ' at ' + sh(Math.abs(d)) + ' ft/min at this depth. The wider the surface, the slower it moves for the same flow.';
      },
      plot: { label: 'How fast the water level moves, against the depth', x: [0, 10], from: 2, xKey: 'h', yKey: 'h', xLabel: 'h (ft)', yLabel: 'dh/dt' }
    },
    shadow: {
      id: 'shadow', name: 'Streetlight shadow', short: 'Shadow', Hl: 15, hp: 6,
      driver: { key: 'x', min: 0, max: 36, start: 10 },
      rate: { key: 'x', label: 'Walks away at', sym: '\\frac{dx}{dt}', min: -6, max: 6, step: 0.5, value: 4, unit: 'ft/s' },
      watch: 's', time: 's', speed: 1,
      qs: [
        { key: 'x', sym: 'x', name: 'Person to the post', unit: 'ft', rate: 'ft/s' },
        { key: 's', sym: 's', name: 'Length of the shadow', unit: 'ft', rate: 'ft/s' },
        { key: 'z', sym: 'x + s', name: 'Tip of the shadow to the post', unit: 'ft', rate: 'ft/s' }
      ],
      k: function(){ return this.hp / (this.Hl - this.hp); },
      at: function(x, dx){ var k = this.k(); return { q: { x: x, s: k * x, z: x + k * x }, d: { x: dx, s: k * dx, z: dx + k * dx } }; },
      advance: function(x, dx, dt){ return x + dx * dt; },
      ends: function(u, rate){ return rate > 0 && u >= this.driver.max - 1e-9 ? 'The person has walked out of the picture.' : rate < 0 && u <= this.driver.min + 1e-9 ? 'The person is at the post.' : ''; },
      chain: function(x, dx){
        var s = this.at(x, dx), k = this.k(), Hl = this.Hl, hp = this.hp;
        return [
          { say: 'The light, the person and the tip of the shadow make two similar right triangles:', tex: '\\frac{' + Hl + '}{x + s} = \\frac{' + hp + '}{s}' },
          { say: 'Cross-multiply and solve for $s$ (true at every moment):', tex: Hl + 's = ' + hp + 'x + ' + hp + 's,\\quad s = ' + ftex(k) + 'x' },
          { say: 'Differentiate with respect to $t$:', tex: '\\frac{ds}{dt} = ' + ftex(k) + '\\frac{dx}{dt}' },
          { say: 'Use this moment\'s rate (the distance $x = ' + n(x, 2) + '$ is not needed):', tex: '\\frac{ds}{dt} = ' + ftex(k) + '(' + n(dx, 2) + ') = ' + n(s.d.s, 3) + '\\text{ ft/s}' },
          { say: 'The tip is at $x + s$ from the post, so it moves at', tex: '\\frac{dx}{dt} + \\frac{ds}{dt} = ' + n(dx, 2) + ' + ' + n(s.d.s, 3) + ' = ' + n(s.d.z, 3) + '\\text{ ft/s}' }
        ];
      },
      meaning: function(x, dx){
        var s = this.at(x, dx).d;
        if(Math.abs(dx) < 1e-9) return 'Standing still: the shadow does not change.';
        return 'The shadow ' + (s.s > 0 ? 'grows' : 'shrinks') + ' at ' + sh(Math.abs(s.s)) + ' ft/s wherever the person is, and its tip moves at ' + sh(Math.abs(s.z)) + ' ft/s.';
      },
      plot: { label: 'How fast the shadow grows, against the distance from the post', x: [0, 36], xKey: 'x', yKey: 's', xLabel: 'x (ft)', yLabel: 'ds/dt' }
    },
    ripple: {
      id: 'ripple', name: 'Spreading ripple', short: 'Ripple',
      driver: { key: 'r', min: 0.2, max: 14, start: 6 },
      rate: { key: 'r', label: 'Radius grows at', sym: '\\frac{dr}{dt}', min: -2, max: 3, step: 0.25, value: 1.5, unit: 'ft/s' },
      watch: 'A', time: 's', speed: 1,
      qs: [
        { key: 'r', sym: 'r', name: 'Radius', unit: 'ft', rate: 'ft/s' },
        { key: 'A', sym: 'A', name: 'Area inside the ripple', unit: 'ft²', rate: 'ft²/s' },
        { key: 'C', sym: 'C', name: 'Circumference', unit: 'ft', rate: 'ft/s' }
      ],
      at: function(r, dr){ return { q: { r: r, A: Math.PI * r * r, C: 2 * Math.PI * r }, d: { r: dr, A: 2 * Math.PI * r * dr, C: 2 * Math.PI * dr } }; },
      advance: function(r, dr, dt){ return r + dr * dt; },
      ends: function(u, rate){ return rate > 0 && u >= this.driver.max - 1e-9 ? 'The ripple has reached the edge of the picture.' : rate < 0 && u <= this.driver.min + 1e-9 ? 'The ripple has shrunk to a point.' : ''; },
      chain: function(r, dr){
        var s = this.at(r, dr);
        return [
          { say: 'The area inside a circle of radius $r$:', tex: 'A = \\pi r^2' },
          { say: 'Differentiate with respect to $t$ ($r$ changes, so the chain rule brings in $\\frac{dr}{dt}$):', tex: '\\frac{dA}{dt} = 2\\pi r\\frac{dr}{dt}' },
          { say: 'This moment: $r = ' + n(r, 2) + '$ ft and $\\frac{dr}{dt} = ' + n(dr, 2) + '$ ft/s:', tex: '\\frac{dA}{dt} = 2\\pi(' + n(r, 2) + ')(' + n(dr, 2) + ') \\approx ' + n(s.d.A, 3) + '\\text{ ft}^2\\text{/s}' },
          { say: 'The circumference grows at a steady rate:', tex: 'C = 2\\pi r,\\quad \\frac{dC}{dt} = 2\\pi\\frac{dr}{dt} \\approx ' + n(s.d.C, 3) + '\\text{ ft/s}' }
        ];
      },
      meaning: function(r, dr){
        var d = this.at(r, dr).d.A;
        if(Math.abs(dr) < 1e-9) return 'The ripple holds still.';
        return 'The area ' + (d > 0 ? 'grows' : 'shrinks') + ' at ' + sh(Math.abs(d)) + ' ft²/s now: the same ' + sh(Math.abs(dr)) + ' ft/s on a bigger circle sweeps more area.';
      },
      plot: { label: 'How fast the area grows, against the radius of the ripple', x: [0, 14], xKey: 'r', yKey: 'A', xLabel: 'r (ft)', yLabel: 'dA/dt' }
    },
    balloon: {
      id: 'balloon', name: 'Rising balloon', short: 'Balloon', d: 500,
      driver: { key: 'h', min: 0, max: 1600, start: 300 },
      rate: { key: 'h', label: 'Balloon rises at', sym: '\\frac{dh}{dt}', min: -200, max: 300, step: 10, value: 150, unit: 'ft/min' },
      watch: 't', time: 'min', speed: 0.5,
      qs: [
        { key: 'h', sym: 'h', name: 'Height of the balloon', unit: 'ft', rate: 'ft/min' },
        { key: 't', sym: '\\theta', name: 'Angle of elevation', unit: 'rad', rate: 'rad/min' },
        { key: 's', sym: 's', name: 'Distance from the observer', unit: 'ft', rate: 'ft/min' }
      ],
      at: function(h, dh){
        var d = this.d, s = Math.sqrt(d * d + h * h);
        return { q: { h: h, t: Math.atan(h / d), s: s }, d: { h: dh, t: d * dh / (d * d + h * h), s: h * dh / s } };
      },
      advance: function(h, dh, dt){ return h + dh * dt; },
      ends: function(u, rate){ return rate > 0 && u >= this.driver.max - 1e-9 ? 'The balloon has risen out of the picture.' : rate < 0 && u <= this.driver.min + 1e-9 ? 'The balloon is on the ground.' : ''; },
      chain: function(h, dh){
        var s = this.at(h, dh), d = this.d, sec2 = 1 + (h / d) * (h / d);
        return [
          { say: 'The observer is 500 ft from the launch point, so at every moment', tex: '\\tan\\theta = \\frac{h}{500}' },
          { say: 'Differentiate both sides with respect to $t$ (chain rule on $\\tan\\theta$):', tex: '\\sec^2\\theta\\,\\frac{d\\theta}{dt} = \\frac{1}{500}\\frac{dh}{dt}' },
          { say: 'This moment: $h = ' + n(h, 1) + '$, so', tex: '\\sec^2\\theta = 1 + \\tan^2\\theta = 1 + \\left(\\frac{' + n(h, 1) + '}{500}\\right)^2 \\approx ' + n(sec2, 4) },
          { say: 'Substitute $\\frac{dh}{dt} = ' + n(dh, 1) + '$ and solve:', tex: '\\frac{d\\theta}{dt} = \\frac{' + n(dh, 1) + '}{500(' + n(sec2, 4) + ')} \\approx ' + n(s.d.t, 4) + '\\text{ rad/min}' }
        ];
      },
      meaning: function(h, dh){
        var d = this.at(h, dh).d.t;
        if(Math.abs(dh) < 1e-9) return 'The balloon hangs still, so the angle holds.';
        return 'The angle ' + (d > 0 ? 'opens' : 'closes') + ' at ' + M.fmt(Math.abs(d), 3) + ' rad/min (' + M.fmt(Math.abs(d) * 180 / Math.PI, 3) + '° per minute); the higher the balloon, the slower the angle changes.';
      },
      plot: { label: 'How fast the angle of elevation changes, against the height', x: [0, 1600], xKey: 'h', yKey: 't', xLabel: 'h (ft)', yLabel: 'dθ/dt' }
    }
  };
  var ORDER = ['ladder', 'cone', 'shadow', 'ripple', 'balloon'];
  /* Clamp the driver into its range and step it; stop at an end. */
  function step(scene, u, rate, dt){
    var D = scene.driver, v = scene.advance(u, rate, dt);
    return Math.max(D.min, Math.min(D.max, v));
  }
  /* The watched rate along the whole range of the driver (the small graph). */
  function curve(scene, rate, n){
    n = n || 120;
    var D = scene.driver, out = [];
    for(var i = 0; i <= n; i++){ var u = D.min + (D.max - D.min) * i / n; out.push([u, scene.at(u, rate).d[scene.watch]]); }
    return out;
  }

  /* ============================================================ the drill */
  var EXPR_DOM = function(keys){ var d = {}; keys.forEach(function(k){ d[k] = /^d/.test(k) ? (k === 'dt' ? [0.5, 2] : [-3, 3]) : [1, 5]; }); return d; };
  function opt(list, correctIndex){ return { options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }), correct: correctIndex || 0 }; }
  function choice(key, label, list, practice){ var o = opt(list); return { key: key, kind: 'choice', label: H(label), options: o.options, why: o.why, correct: 0, practice: practice || '2.C' }; }
  function numStep(key, label, answer, mistakes, unit, practice){
    // Exact answers: an exact form or a decimal right to about three places.
    var whole = Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: unit || '', practice: practice || '1.E', d: whole ? 0 : 3,
      hint: whole ? '' : 'Exact (like 5/6 or 12pi) or to three decimal places.',
      cell: M.cell(answer, 6e-4, (mistakes || []).map(function(m){ return { value: m[0], why: H(m[1]) }; }), 6e-4) };
  }
  function exprStep(key, label, lhs, answer, vars, mistakes, practice){
    return { key: key, kind: 'expr', label: H(label), lhs: lhs, practice: practice || '1.E',
      cell: M.exprCell(answer, { vars: vars, domain: EXPR_DOM(vars), mistakes: (mistakes || []).map(function(m){ return { expr: m[0], why: m[1] }; }) }) };
  }
  var BEFORE = 'You substituted this moment\'s value before differentiating, so that quantity looked constant and its rate vanished. Differentiate the relation first, then substitute.';

  var GEN = {};
  GEN.ladder = function(r){
    var trip = r.pick([[13, 5, 12], [13, 12, 5], [10, 6, 8], [10, 8, 6], [15, 9, 12], [15, 12, 9], [17, 8, 15], [17, 15, 8], [25, 7, 24], [25, 24, 7], [25, 15, 20], [25, 20, 15]]);
    var L = trip[0], x = trip[1], y = trip[2], k = r.pick([1, 1.5, 2, 3, 4]), top = r() < 0.4;
    var L2 = L * L, dx, dy;
    if(!top){ dx = k; dy = -x * dx / y; } else { dy = -k; dx = -y * dy / x; }
    var known = top ? 'the top slides down the wall at ' + n(k) + ' feet per second' : 'the bottom slides away from the wall at ' + n(k) + ' feet per second';
    var when = top ? 'the top is ' + y + ' feet above the ground' : 'the bottom is ' + x + ' feet from the wall';
    var ask = top ? 'How fast is the bottom moving away from the wall' : 'How fast is the top sliding down the wall';
    var text = H('<p>A ' + L + '-foot ladder leans against a vertical wall, and ' + known + '. ' + ask + ' when ' + when + '?</p><p class="bt-small">Let <i>x</i> be the distance from the wall to the bottom and <i>y</i> the height of the top, in feet, at time <i>t</i> seconds.</p>');
    var steps = [
      choice('rel', 'Which equation relates $x$ and $y$ at every moment?', [
        ['$x^2 + y^2 = ' + L2 + '$', 'Right: the ladder is the hypotenuse of a right triangle, and its length never changes.'],
        ['$x + y = ' + L + '$', 'The legs of a right triangle do not add up to the hypotenuse. Use the Pythagorean theorem.'],
        ['$x^2 + y^2 = ' + L + '$', 'The hypotenuse is squared too: $' + L + '^2 = ' + L2 + '$.'],
        [top ? '$x^2 + ' + y + '^2 = ' + L2 + '$' : '$' + x + '^2 + y^2 = ' + L2 + '$', 'That puts in a value that is true at one instant only. A relation you will differentiate must hold at every moment: keep both letters and substitute after differentiating.']
      ]),
      exprStep('diff', 'Differentiate $x^2 + y^2 = ' + L2 + '$ with respect to $t$. Type the derivative of the left side; the right side becomes 0. Write rates as dx/dt and dy/dt.', '\\frac{d}{dt}\\left(x^2 + y^2\\right) =',
        '2x*dx/dt + 2y*dy/dt', ['x', 'y', 'dx', 'dy', 'dt'], [
          ['2x + 2y', 'x and y both change with time, so each square needs the chain rule: the derivative of x² with respect to t is 2x·dx/dt.'],
          [top ? '2x*dx/dt' : '2y*dy/dt', 'You treated ' + (top ? 'y' : 'x') + ' as a constant, which is what happens when you substitute its value before differentiating. Keep it a variable: its term is ' + (top ? '2y·dy/dt' : '2x·dx/dt') + '.'],
          ['2x*dx + 2y*dy', 'Those are differentials. The question is about rates: write dx/dt and dy/dt.'],
          ['x*dx/dt + y*dy/dt', 'The power rule gives 2x, not x: the derivative of x² is 2x·dx/dt.']
        ])
    ];
    if(!top) steps.push(numStep('other', 'At that moment, how high is the top of the ladder? ($y$ when $x = ' + x + '$)', y, [[L - x, 'Use the Pythagorean theorem, not a subtraction: $y = \\sqrt{' + L2 + ' - ' + x + '^2}$.'], [Math.sqrt(L2 + x * x), 'Subtract the square: $y^2 = ' + L2 + ' - ' + x + '^2$.']], 'ft'));
    else steps.push(numStep('other', 'At that moment, how far is the bottom from the wall? ($x$ when $y = ' + y + '$)', x, [[L - y, 'Use the Pythagorean theorem, not a subtraction: $x = \\sqrt{' + L2 + ' - ' + y + '^2}$.'], [Math.sqrt(L2 + y * y), 'Subtract the square: $x^2 = ' + L2 + ' - ' + y + '^2$.']], 'ft'));
    var want = top ? dx : dy, wsym = top ? 'dx/dt' : 'dy/dt';
    steps.push(numStep('rate', 'Find $' + (top ? '\\frac{dx}{dt}' : '\\frac{dy}{dt}') + '$ at that moment, with its sign.', want, [
      [-want, top ? 'The top moves down, so $\\frac{dy}{dt} = -' + n(k) + '$ is negative; with it, $\\frac{dx}{dt}$ comes out positive (the bottom moves out).' : 'The sign matters: the top moves down, so $\\frac{dy}{dt}$ is negative. From $2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0$, the two rates have opposite signs.'],
      [0, BEFORE],
      [top ? -x * dy / y : -y * dx / x, 'You swapped $x$ and $y$. From $2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0$: $' + (top ? '\\frac{dx}{dt} = -\\frac{y}{x}\\frac{dy}{dt}' : '\\frac{dy}{dt} = -\\frac{x}{y}\\frac{dx}{dt}') + '$.'],
      [top ? k : -k, 'The two ends do not move at the same speed. Solve the differentiated equation for the unknown rate.']
    ], 'ft/s'));
    var sp = sh(Math.abs(want));
    steps.push(choice('mean', 'What does your answer mean?', top ? [
      ['The bottom moves away from the wall at ' + sp + ' ft/s at that moment.', 'Right: $\\frac{dx}{dt} > 0$, so $x$ is growing, in feet per second.'],
      ['The bottom moves toward the wall at ' + sp + ' ft/s at that moment.', 'A positive $\\frac{dx}{dt}$ means $x$ grows: the bottom moves away from the wall.'],
      ['The bottom moves away from the wall at a steady ' + sp + ' ft/s.', 'The rate is for this moment only: as the top falls at a steady rate, the bottom\'s speed changes.'],
      ['The bottom moves away from the wall at ' + sp + ' ft²/s.', 'A rate of a length is in feet per second, not square feet.']
    ] : [
      ['The top slides down the wall at ' + sp + ' ft/s at that moment.', 'Right: $\\frac{dy}{dt} < 0$, so the height is shrinking, in feet per second.'],
      ['The top slides up the wall at ' + sp + ' ft/s at that moment.', 'A negative $\\frac{dy}{dt}$ means the height decreases: the top slides down.'],
      ['The top slides down the wall at a steady ' + sp + ' ft/s.', 'The rate is for this moment only: with the bottom moving at a steady rate, the top speeds up as it falls.'],
      ['The top slides down the wall at ' + sp + ' ft²/s.', 'A rate of a length is in feet per second, not square feet.']
    ], '3.F'));
    var solution = [
      'The ladder is the hypotenuse at every moment: $x^2 + y^2 = ' + L2 + '$.',
      'Differentiate first: $2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0$.',
      top ? 'When $y = ' + y + '$: $x = \\sqrt{' + L2 + ' - ' + y + '^2} = ' + x + '$, and $\\frac{dy}{dt} = -' + n(k) + '$ (the top moves down).' : 'When $x = ' + x + '$: $y = \\sqrt{' + L2 + ' - ' + x + '^2} = ' + y + '$, and $\\frac{dx}{dt} = ' + n(k) + '$.',
      top ? 'Substitute: $2(' + x + ')\\frac{dx}{dt} + 2(' + y + ')(-' + n(k) + ') = 0$, so $\\frac{dx}{dt} = ' + ftex(dx) + '$ ft/s.' : 'Substitute: $2(' + x + ')(' + n(k) + ') + 2(' + y + ')\\frac{dy}{dt} = 0$, so $\\frac{dy}{dt} = ' + ftex(dy) + '$ ft/s.',
      top ? 'The bottom moves away from the wall at $' + ftex(dx) + ' \\approx ' + n(dx) + '$ ft/s at that moment.' : 'The top slides down at $' + ftex(-dy) + ' \\approx ' + n(-dy) + '$ ft/s at that moment.'
    ];
    return { text: text, steps: steps, solution: solution, values: { L: L, x: x, y: y, k: k, top: top, want: want, wsym: wsym } };
  };

  GEN.cone = function(r){
    var dims = r.pick([[4, 10], [3, 9], [5, 10], [6, 12], [2, 6], [3, 12], [4, 12]]);
    var R = dims[0], Ht = dims[1], k = R / Ht, h = r.pick([2, 3, 4, 5, 6].filter(function(v){ return v < Ht; })), q = r.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
    var drain = r() < 0.3, dV = drain ? -q : q;
    var k2 = k * k, c = k2 / 3, dh = dV / (Math.PI * k2 * h * h), dr = k * dh;
    var text = H('<p>A tank is a cone with its tip at the bottom, a top radius of ' + R + ' feet and a depth of ' + Ht + ' feet. Water ' + (drain ? 'drains out' : 'is pumped in') + ' at ' + q + ' cubic feet per minute. How fast is the water level ' + (drain ? 'falling' : 'rising') + ' when the water is ' + h + ' feet deep?</p><p class="bt-small">Let <i>h</i> be the depth and <i>r</i> the radius of the water\'s surface, in feet, at time <i>t</i> minutes; <i>V</i> = ⅓π<i>r</i>²<i>h</i>.</p>');
    var kt = ftex(k), ct = ftex(c), c3 = ftex(3 * c);
    var steps = [
      choice('rel', 'Which formula gives the volume of water in terms of $h$ alone, at every moment?', [
        ['$V = \\frac{1}{3}\\pi\\left(' + kt + 'h\\right)^2 h$', 'Right: similar triangles give $\\frac{r}{h} = \\frac{' + R + '}{' + Ht + '}$ at every depth, so $r = ' + kt + 'h$.'],
        ['$V = \\frac{1}{3}\\pi(' + R + ')^2 h$', 'The surface radius is ' + R + ' ft only when the tank is full. As the depth changes, $r$ changes: use similar triangles, $r = ' + kt + 'h$.'],
        ['$V = \\pi\\left(' + kt + 'h\\right)^2 h$', 'That is a cylinder. A cone holds one third of it: $V = \\frac{1}{3}\\pi r^2 h$.'],
        ['$V = \\frac{1}{3}\\pi\\left(' + kt + '\\cdot ' + h + '\\right)^2 \\cdot ' + h + '$', 'That puts in $h = ' + h + '$, true at one instant only, so $V$ is a number and its derivative is 0. Keep $h$ a variable and substitute after differentiating.']
      ]),
      exprStep('diff', 'Simplify to $V = ' + ct + '\\pi h^3$ and differentiate with respect to $t$. Type $\\frac{dV}{dt}$ in terms of $h$ and dh/dt (write pi for $\\pi$).', '\\frac{dV}{dt} =',
        fstr(3 * c) + '*pi*h^2*dh/dt', ['h', 'dh', 'dt'], [
          [fstr(3 * c) + '*pi*h^2', 'h changes with time, so the chain rule brings in dh/dt: the derivative of h³ with respect to t is 3h²·dh/dt.'],
          [fstr(c) + '*pi*h^2*dh/dt', 'The power rule brings down the 3: the derivative of h³ is 3h²·dh/dt.'],
          [fstr(3 * c) + '*pi*h*dh/dt', 'The derivative of h³ is 3h², not 3h.']
        ]),
      numStep('rate', 'Find $\\frac{dh}{dt}$ when $h = ' + h + '$, with its sign.', dh, [
        [-dh, drain ? 'Water drains out, so $\\frac{dV}{dt} = -' + q + '$ and the level falls: $\\frac{dh}{dt}$ is negative.' : 'Water is pumped in, so the level rises: $\\frac{dh}{dt}$ is positive.'],
        [0, BEFORE],
        [3 * dV / (Math.PI * R * R), 'That treats the surface radius as ' + R + ' ft at every depth. Use $r = ' + kt + 'h$ before differentiating.'],
        [dV / (Math.PI * k2 * h), 'Square the depth: $\\frac{dV}{dt} = ' + c3 + '\\pi h^2\\frac{dh}{dt}$.'],
        [dh / 3, 'Keep the 3 from the power rule: $\\frac{d}{dt}\\left(h^3\\right) = 3h^2\\frac{dh}{dt}$.']
      ], 'ft/min'),
      numStep('rdot', 'How fast is the radius of the water\'s surface changing at that moment? ($\\frac{dr}{dt}$, with its sign)', dr, [
        [-dr, 'The radius grows when the level rises and shrinks when it falls: $\\frac{dr}{dt}$ has the sign of $\\frac{dh}{dt}$.'],
        [dh, 'Use $r = ' + kt + 'h$: $\\frac{dr}{dt} = ' + kt + '\\frac{dh}{dt}$.'],
        [0, BEFORE]
      ], 'ft/min')
    ];
    var sp = sh(Math.abs(dh));
    steps.push(choice('mean', 'What does $\\frac{dh}{dt}$ tell you?', [
      ['The level ' + (drain ? 'falls' : 'rises') + ' at ' + sp + ' ft/min at that moment, and ' + (drain ? 'faster as the tank empties' : 'more slowly as the tank fills') + '.', 'Right: for the same flow, a wider surface moves more slowly, and the surface widens as the depth grows.'],
      ['The level ' + (drain ? 'falls' : 'rises') + ' at a steady ' + sp + ' ft/min.', '$\\frac{dh}{dt} = \\frac{dV/dt}{' + c3 + '\\pi h^2}$ depends on $h$: the rate is for this moment only.'],
      ['The level ' + (drain ? 'falls' : 'rises') + ' at ' + sp + ' ft³/min at that moment.', 'Depth is a length, so its rate is in feet per minute. Cubic feet per minute is the flow, $\\frac{dV}{dt}$.'],
      ['The level ' + (drain ? 'rises' : 'falls') + ' at ' + sp + ' ft/min at that moment.', 'Water ' + (drain ? 'leaving the tank lowers' : 'coming in raises') + ' the level.']
    ], '3.F'));
    var solution = [
      'Similar triangles at every depth: $\\frac{r}{h} = \\frac{' + R + '}{' + Ht + '}$, so $r = ' + kt + 'h$ and $V = \\frac{1}{3}\\pi\\left(' + kt + 'h\\right)^2 h = ' + ct + '\\pi h^3$.',
      'Differentiate: $\\frac{dV}{dt} = ' + c3 + '\\pi h^2\\frac{dh}{dt}$.',
      'Substitute $h = ' + h + '$ and $\\frac{dV}{dt} = ' + dV + '$: $' + dV + ' = ' + c3 + '\\pi(' + h + ')^2\\frac{dh}{dt}$, so $\\frac{dh}{dt} = ' + ftex(dV / (3 * c * h * h)) + '\\cdot\\frac{1}{\\pi} \\approx ' + n(dh) + '$ ft/min.',
      '$\\frac{dr}{dt} = ' + kt + '\\frac{dh}{dt} \\approx ' + n(dr) + '$ ft/min.'
    ];
    return { text: text, steps: steps, solution: solution, values: { R: R, H: Ht, h: h, dV: dV, dh: dh, dr: dr } };
  };

  GEN.shadow = function(r){
    var pair = r.pick([[15, 6], [12, 6], [18, 6], [16, 6], [20, 5], [15, 5], [14, 6]]);
    var Hl = pair[0], hp = pair[1], w = r.pick([3, 4, 5, 6]), x = r.pick([10, 12, 15, 20, 24, 30]), k = hp / (Hl - hp);
    var ds = k * w, dz = w + ds;
    var text = H('<p>A person ' + hp + ' feet tall walks away from a ' + Hl + '-foot streetlight at ' + w + ' feet per second. When the person is ' + x + ' feet from the post, how fast is the shadow getting longer, and how fast is the tip of the shadow moving?</p><p class="bt-small">Let <i>x</i> be the person\'s distance from the post and <i>s</i> the length of the shadow, in feet, at time <i>t</i> seconds.</p>');
    var kt = ftex(k);
    var steps = [
      choice('rel', 'Which equation relates $x$ and $s$ at every moment?', [
        ['$\\frac{' + Hl + '}{x + s} = \\frac{' + hp + '}{s}$', 'Right: the light\'s triangle (height ' + Hl + ', base $x + s$) and the person\'s triangle (height ' + hp + ', base $s$) are similar.'],
        ['$\\frac{' + Hl + '}{x} = \\frac{' + hp + '}{s}$', 'The big triangle runs from the post to the tip of the shadow: its base is $x + s$, not $x$.'],
        ['$\\frac{' + Hl + '}{s} = \\frac{' + hp + '}{x + s}$', 'Match the sides: the tall post goes with the long base $x + s$, the person with the shadow $s$.'],
        ['$\\frac{' + Hl + '}{' + x + ' + s} = \\frac{' + hp + '}{s}$', 'That puts in $x = ' + x + '$, true at one instant only. Keep $x$ a variable and substitute after differentiating.']
      ]),
      exprStep('solve', 'Solve your equation for $s$ in terms of $x$.', 's =', fstr(k) + 'x', ['x'], [
        [fstr(hp / Hl) + 'x', 'That comes from $\\frac{' + Hl + '}{x} = \\frac{' + hp + '}{s}$. The big triangle\'s base is $x + s$: $' + Hl + 's = ' + hp + '(x + s)$.'],
        [fstr(Hl / (Hl - hp)) + 'x', 'That is the tip\'s distance from the post, $x + s$. The shadow alone is $s = ' + kt + 'x$.']
      ]),
      numStep('ds', 'Find $\\frac{ds}{dt}$, the rate the shadow gets longer.', ds, [
        [w, 'The shadow does not grow as fast as you walk: $\\frac{ds}{dt} = ' + kt + '\\frac{dx}{dt}$.'],
        [0, 'You substituted $x = ' + x + '$ first, which makes $s$ a fixed number. Differentiate $s = ' + kt + 'x$ first.'],
        [dz, 'That is the speed of the tip, $\\frac{d}{dt}(x + s)$. The length of the shadow changes at $\\frac{ds}{dt}$.']
      ], 'ft/s'),
      numStep('tip', 'How fast is the tip of the shadow moving away from the post?', dz, [
        [ds, 'That is how fast the shadow grows. The tip is at $x + s$ from the post: add $\\frac{dx}{dt}$.'],
        [w, 'The tip moves faster than the person: it is at $x + s$, so its speed is $\\frac{dx}{dt} + \\frac{ds}{dt}$.']
      ], 'ft/s'),
      choice('mean', 'Does $\\frac{ds}{dt}$ depend on how far the person is from the post?', [
        ['No: $s = ' + kt + 'x$, so $\\frac{ds}{dt} = ' + kt + '\\frac{dx}{dt}$ at every distance.', 'Right: here the distance ' + x + ' ft is a distractor.'],
        ['Yes: the farther away, the faster the shadow grows.', 'The shadow is longer far away, but it grows at the same rate: $\\frac{ds}{dt} = ' + kt + '\\frac{dx}{dt}$ has no $x$ in it.'],
        ['Yes: the farther away, the more slowly the shadow grows.', '$\\frac{ds}{dt} = ' + kt + '\\frac{dx}{dt}$ has no $x$ in it, so the rate is the same everywhere.'],
        ['Only at $x = ' + x + '$ ft is it ' + sh(ds) + ' ft/s.', 'Nothing in $\\frac{ds}{dt} = ' + kt + '\\frac{dx}{dt}$ depends on $x$.']
      ], '3.F')
    ];
    var solution = [
      'Similar triangles: $\\frac{' + Hl + '}{x + s} = \\frac{' + hp + '}{s}$, so $' + Hl + 's = ' + hp + 'x + ' + hp + 's$ and $s = ' + kt + 'x$.',
      'Differentiate: $\\frac{ds}{dt} = ' + kt + '\\frac{dx}{dt} = ' + kt + '(' + w + ') = ' + ftex(ds) + '$ ft/s, at every distance.',
      'The tip is at $x + s$: it moves at $' + w + ' + ' + ftex(ds) + ' = ' + ftex(dz) + '$ ft/s.'
    ];
    return { text: text, steps: steps, solution: solution, values: { Hl: Hl, hp: hp, w: w, x: x, ds: ds, dz: dz } };
  };

  GEN.ripple = function(r){
    var r0 = r.pick([3, 4, 5, 6, 8, 10]), k = r.pick([0.5, 1, 1.5, 2, 3]), byArea = r() < 0.5;
    var dA = 2 * Math.PI * r0 * k, A = Math.PI * r0 * r0;
    var when = byArea ? 'the area inside the ripple is ' + (r0 * r0) + 'π square feet' : 'the radius is ' + r0 + ' feet';
    var text = H('<p>A stone drops into a pond, and a circular ripple spreads so that its radius grows at ' + n(k) + ' feet per second. How fast is the area inside the ripple growing when ' + when + '?</p><p class="bt-small">Let <i>r</i> be the radius in feet and <i>A</i> the area in square feet, at time <i>t</i> seconds.</p>');
    var steps = [
      choice('rel', 'Which equation relates $A$ and $r$ at every moment?', [
        ['$A = \\pi r^2$', 'Right: the area of a circle of radius $r$.'],
        ['$A = 2\\pi r$', 'That is the circumference, the distance around. The area inside is $\\pi r^2$.'],
        ['$A = \\pi(' + r0 + ')^2$', 'That puts in $r = ' + r0 + '$, true at one instant only, so its derivative is 0. Keep $r$ a variable and substitute after differentiating.'],
        ['$A = \\frac{1}{2}\\pi r^2$', 'That is half a circle. The ripple encloses a whole circle: $A = \\pi r^2$.']
      ]),
      exprStep('diff', 'Differentiate $A = \\pi r^2$ with respect to $t$. Type $\\frac{dA}{dt}$ (write pi for $\\pi$ and the rate as dr/dt).', '\\frac{dA}{dt} =', '2pi*r*dr/dt', ['r', 'dr', 'dt'], [
        ['2pi*r', 'r changes with time, so the chain rule brings in dr/dt: dA/dt = 2πr·dr/dt.'],
        ['2pi*dr/dt', 'That is the rate of the circumference, from C = 2πr. Differentiate A = πr²: the power rule gives 2πr·dr/dt.'],
        ['pi*r^2*dr/dt', 'Differentiate r² too: its derivative is 2r·dr/dt.']
      ])
    ];
    if(byArea) steps.push(numStep('r', 'What is the radius at that moment?', r0, [[r0 * r0, 'Undo the square: $\\pi r^2 = ' + (r0 * r0) + '\\pi$ gives $r^2 = ' + (r0 * r0) + '$.'], [r0 * r0 / 2, 'Solve $\\pi r^2 = ' + (r0 * r0) + '\\pi$: $r = \\sqrt{' + (r0 * r0) + '}$.']], 'ft'));
    steps.push(numStep('dA', 'Find $\\frac{dA}{dt}$ at that moment (exact, like 12pi, or a decimal).', dA, [
      [2 * Math.PI * r0, 'Multiply by the rate: $\\frac{dA}{dt} = 2\\pi r\\frac{dr}{dt}$, with $\\frac{dr}{dt} = ' + n(k) + '$.'],
      [2 * Math.PI * k, 'That is $\\frac{dC}{dt}$, the rate of the circumference. For the area: $2\\pi r\\frac{dr}{dt}$.'],
      [Math.PI * r0 * r0 * k, 'Differentiate $r^2$: it gives $2r\\frac{dr}{dt}$, so $\\frac{dA}{dt} = 2\\pi r\\frac{dr}{dt}$.'],
      [0, BEFORE]
    ], 'ft²/s'));
    var ex = ftex(2 * r0 * k) + '\\pi';
    steps.push(choice('mean', 'Which sentence states your answer correctly?', [
      ['At that moment the area grows at $' + ex + '$ square feet per second.', 'Right: area in square feet, per second, at that moment.'],
      ['At that moment the area grows at $' + ex + '$ feet per second.', 'An area is in square feet, so its rate is in square feet per second.'],
      ['The area grows at a steady $' + ex + '$ square feet per second.', '$\\frac{dA}{dt} = 2\\pi r\\frac{dr}{dt}$ grows with $r$: the rate is for this moment only.'],
      ['At that moment the area is $' + ex + '$ square feet.', 'That is how fast the area grows, not the area itself (the area is $' + (r0 * r0) + '\\pi$ square feet).']
    ], '3.F'));
    var solution = [
      '$A = \\pi r^2$ at every moment.',
      'Differentiate: $\\frac{dA}{dt} = 2\\pi r\\frac{dr}{dt}$.',
      (byArea ? 'When $A = ' + (r0 * r0) + '\\pi$, $r = ' + r0 + '$. ' : '') + 'Substitute $r = ' + r0 + '$ and $\\frac{dr}{dt} = ' + n(k) + '$: $\\frac{dA}{dt} = 2\\pi(' + r0 + ')(' + n(k) + ') = ' + ex + ' \\approx ' + n(dA) + '$ square feet per second.'
    ];
    return { text: text, steps: steps, solution: solution, values: { r0: r0, k: k, A: A, dA: dA, byArea: byArea } };
  };

  GEN.balloon = function(r){
    var d = r.pick([300, 400, 500, 600, 800]), ratio = r.pick([[3, 4], [4, 3], [1, 1], [1, 2], [2, 1]]), h = d * ratio[0] / ratio[1];
    var v = r.pick([100, 120, 150, 200, 240, 300]);
    var tan = h / d, sec2 = 1 + tan * tan, dth = v / (d * sec2);
    var text = H('<p>A hot-air balloon rises straight up from a field at ' + v + ' feet per minute. An observer stands on the ground ' + d + ' feet from the launch point. How fast is the angle of elevation of the observer\'s line of sight increasing when the balloon is ' + n(h) + ' feet high?</p><p class="bt-small">Let <i>h</i> be the height in feet and <i>θ</i> the angle of elevation in radians, at time <i>t</i> minutes.</p>');
    var steps = [
      choice('rel', 'Which equation relates $\\theta$ and $h$ at every moment?', [
        ['$\\tan\\theta = \\frac{h}{' + d + '}$', 'Right: opposite (the height) over adjacent (the ' + d + ' ft on the ground).'],
        ['$\\sin\\theta = \\frac{h}{' + d + '}$', 'The ' + d + ' ft is the adjacent side, not the hypotenuse. Opposite over adjacent is $\\tan\\theta$.'],
        ['$\\tan\\theta = \\frac{' + d + '}{h}$', 'Upside down: $\\tan\\theta$ is the opposite side (the height) over the adjacent side.'],
        ['$\\tan\\theta = \\frac{' + n(h) + '}{' + d + '}$', 'That puts in the height at one instant, so $\\theta$ looks constant. Keep $h$ a variable and substitute after differentiating.']
      ]),
      choice('diff', 'Differentiate $\\tan\\theta = \\frac{h}{' + d + '}$ with respect to $t$.', [
        ['$\\sec^2\\theta\\,\\frac{d\\theta}{dt} = \\frac{1}{' + d + '}\\frac{dh}{dt}$', 'Right: the chain rule on $\\tan\\theta$ brings in $\\frac{d\\theta}{dt}$; $\\frac{h}{' + d + '}$ differentiates to $\\frac{1}{' + d + '}\\frac{dh}{dt}$.'],
        ['$\\sec^2\\theta = \\frac{1}{' + d + '}\\frac{dh}{dt}$', '$\\theta$ changes with time, so the chain rule brings in $\\frac{d\\theta}{dt}$ on the left.'],
        ['$\\sec\\theta\\tan\\theta\\,\\frac{d\\theta}{dt} = \\frac{1}{' + d + '}\\frac{dh}{dt}$', 'That is the derivative of $\\sec\\theta$. The derivative of $\\tan\\theta$ is $\\sec^2\\theta$.'],
        ['$\\sec^2\\theta\\,\\frac{d\\theta}{dt} = \\frac{h}{' + d + '}\\frac{dh}{dt}$', 'Differentiate $\\frac{h}{' + d + '}$: it gives $\\frac{1}{' + d + '}\\frac{dh}{dt}$, with no $h$ left.']
      ], '1.E'),
      numStep('sec', 'At that moment, what is $\\sec^2\\theta$? (Use $\\sec^2\\theta = 1 + \\tan^2\\theta$.)', sec2, [
        [tan * tan, 'Add the 1: $\\sec^2\\theta = 1 + \\tan^2\\theta$.'],
        [1 + tan, 'Square the tangent: $\\sec^2\\theta = 1 + \\left(\\frac{h}{' + d + '}\\right)^2$.'],
        [1 / sec2, 'That is $\\cos^2\\theta$. You want its reciprocal, $\\sec^2\\theta$.']
      ]),
      numStep('rate', 'Find $\\frac{d\\theta}{dt}$ in radians per minute.', dth, [
        [v / d, 'Divide by $\\sec^2\\theta$ too: $\\frac{d\\theta}{dt} = \\frac{1}{' + d + '\\sec^2\\theta}\\frac{dh}{dt}$.'],
        [v * sec2 / d, 'Divide by $\\sec^2\\theta$; do not multiply.'],
        [0, BEFORE],
        [-dth, 'The balloon rises, so $\\theta$ grows: $\\frac{d\\theta}{dt} > 0$.']
      ], 'rad/min'),
      choice('mean', 'Which statement is right?', [
        ['The angle increases at ' + sh(dth) + ' radians per minute at that moment.', 'Right: radians per minute, and only at that moment.'],
        ['The angle increases at ' + sh(dth) + ' degrees per minute at that moment.', 'Calculus with trig functions is in radians: $\\frac{d\\theta}{dt}$ is in radians per minute.'],
        ['The angle increases at a steady ' + sh(dth) + ' radians per minute.', 'As the balloon climbs, the angle changes more and more slowly: the rate is for this moment only.'],
        ['The angle increases at ' + sh(dth) + ' feet per minute at that moment.', 'An angle is measured in radians, so its rate is in radians per minute.']
      ], '3.F')
    ];
    var solution = [
      '$\\tan\\theta = \\frac{h}{' + d + '}$ at every moment.',
      'Differentiate: $\\sec^2\\theta\\,\\frac{d\\theta}{dt} = \\frac{1}{' + d + '}\\frac{dh}{dt}$.',
      'When $h = ' + n(h) + '$: $\\tan\\theta = ' + ftex(tan) + '$, so $\\sec^2\\theta = 1 + \\left(' + ftex(tan) + '\\right)^2 = ' + ftex(sec2) + '$.',
      'Then $\\frac{d\\theta}{dt} = \\frac{' + v + '}{' + d + '\\cdot ' + ftex(sec2) + '} = ' + ftex(dth) + ' \\approx ' + n(dth, 4) + '$ radians per minute.'
    ];
    return { text: text, steps: steps, solution: solution, values: { d: d, h: h, v: v, sec2: sec2, dth: dth } };
  };

  var TITLE = { ladder: 'Sliding ladder', cone: 'Filling cone', shadow: 'Streetlight shadow', ripple: 'Spreading ripple', balloon: 'Rising balloon' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('related-rates: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }

  M.register('relatedRates', {
    SCENES: SCENES, ORDER: ORDER, KINDS: Object.keys(GEN), TITLE: TITLE,
    step: step, curve: curve, generate: generate,
    n: n, rat: rat, ftex: ftex, fmtRate: function(x){ return neg(M.fmt(x, 3)); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
