/* Projectile lab model: ApPhysMath.projectileLab (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apphys-tool-checks/projectile-lab.mjs) and the test
   (scripts/test/apphys-tool-projectile-lab.test.mjs) run exactly this code.

   The CED model (topic 1.5): no air resistance, g downward (9.8 m/s² unless
   the context says 10), the horizontal and vertical motions independent.
   x is horizontal from the launch point, y is height above the ground
   (the launch is at y = h), both in meters.

     launch({ v, angle, h, g })  { vx, vy, h, g, T, R, H, tTop, at(t) -> { t, x, y, vx, vy } }
                                 T: time of flight to the ground (y = 0);
                                 R: horizontal distance at landing; H: highest
                                 y reached (h when the launch points down);
                                 tTop: time of the highest point (0 if none)
     strobe(L, n)                a "nice" time step giving about n dots, and
                                 the dot times from 0 to T
     cartLaunch({ u, w, g })     a cart rolling at u launches a ball straight
                                 up at w (relative to the cart): ground-frame
                                 and cart-frame positions at time t, flight time
     generate(rng, ctx, type?)   a seeded "Test yourself" problem: types
                                 components, flight, range, maxh, first,
                                 vxconst, relative */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;
  var REL = 0.02;

  function launch(o){
    var g = o.g || M.C.g, h = Math.max(0, o.h || 0), th = M.rad(o.angle || 0);
    var vx = o.v * Math.cos(th), vy = o.v * Math.sin(th);
    if(Math.abs(vx) < 1e-12) vx = 0; if(Math.abs(vy) < 1e-12) vy = 0;
    // y(t) = h + vy t - g t^2 / 2 = 0, the positive root (stable form).
    var disc = vy * vy + 2 * g * h, T = disc <= 0 ? 0 : (vy + Math.sqrt(disc)) / g;
    var tTop = vy > 0 ? vy / g : 0, H = vy > 0 ? h + vy * vy / (2 * g) : h;
    return {
      v: o.v, angle: o.angle || 0, vx: vx, vy: vy, h: h, g: g, T: T, R: vx * T, H: H, tTop: tTop,
      vyEnd: vy - g * T,
      at: function(t){ return { t: t, x: vx * t, y: h + vy * t - 0.5 * g * t * t, vx: vx, vy: vy - g * t }; }
    };
  }
  var NICE = [0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2];
  function strobe(L, n){
    n = n || 12;
    var dt = NICE[NICE.length - 1];
    for(var i = 0; i < NICE.length; i++) if(L.T / NICE[i] <= n){ dt = NICE[i]; break; }
    var ts = [];
    for(var t = 0; t <= L.T + 1e-9; t = M.round(t + dt, 6)) ts.push(t);
    return { dt: dt, ts: ts };
  }
  function cartLaunch(o){
    var g = o.g || M.C.g, T = 2 * o.w / g;
    return {
      u: o.u, w: o.w, g: g, T: T, D: o.u * T, H: o.w * o.w / (2 * g),
      ground: function(t){ return { x: o.u * t, y: o.w * t - 0.5 * g * t * t, vx: o.u, vy: o.w - g * t, cart: o.u * t }; },
      cart: function(t){ return { x: 0, y: o.w * t - 0.5 * g * t * t, vx: 0, vy: o.w - g * t, cart: 0 }; }
    };
  }

  /* ------------------------------------------------------- text helpers */
  function F(x, d){ return M.minus(M.fixed(x, d)); }
  function dOf(x){ var a = Math.abs(x); if(a < 1e-9) return 2; return Math.max(0, Math.min(3, 2 - Math.floor(Math.log10(a) + 1e-12))); }
  /* A value as the solution prints it: 3 significant figures. */
  function W(x){ return M.fmt(x, 3); }
  function num(key, label, answer, unit, mistakes, practice, hint){
    var s = { key: key, kind: 'num', label: label, cell: M.cell(answer, REL, mistakes || [], 0.006), unit: unit, d: dOf(answer), practice: practice || '2.B' };
    if(hint) s.hint = hint;
    return s;
  }
  function choice(key, label, options, correct, why, practice, fixed){
    return { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice || '3.B', fixed: !!fixed };
  }
  function gText(g){ return 'Use g = ' + g + ' m/s² and ignore air resistance.'; }
  /* What the quiz figure draws (projectile-lab.js figure()): never the answers. */
  function scene(o){ return o; }

  var G = {};

  /* 1. Components of a launch velocity. */
  G.components = function(r, ctx){
    var g = M.g(ctx), v = r.between(8, 30, 2), ang = r.int(3, 15) * 5;
    var L = launch({ v: v, angle: ang, h: 0, g: g });
    return {
      text: '<p>A ball is launched from level ground at ' + W(v) + ' m/s, ' + ang + '° above the horizontal. ' + gText(g) + '</p>',
      fig: scene({ v: v, angle: ang, h: 0, g: g, show: 'components' }),
      steps: [
        num('vx', 'Horizontal component of the launch velocity, v<sub>x</sub>', L.vx, 'm/s', [{ value: L.vy, why: 'That is v sin θ, the vertical component. The horizontal side is next to the angle: v cos θ.' }, { value: v, why: 'That is the whole speed. The horizontal component is v cos θ, which is smaller.' }], '2.B', 'The side next to the angle: v cos θ.'),
        num('vy', 'Vertical component of the launch velocity, v<sub>y</sub>', L.vy, 'm/s', [{ value: L.vx, why: 'That is v cos θ, the horizontal component. The vertical side is opposite the angle: v sin θ.' }], '2.B', 'The side opposite the angle: v sin θ.'),
        choice('top', 'At the highest point of its path, the ball\'s velocity is…', ['Horizontal, ' + W(L.vx) + ' m/s', 'Zero', 'Vertical, ' + W(L.vy) + ' m/s downward', W(v) + ' m/s at ' + ang + '°'], 0, [
          'Right: the vertical component is zero at the top, and the horizontal component never changes, so v = v<sub>x</sub> = ' + W(L.vx) + ' m/s.',
          'Only the vertical component is zero at the top. The ball is still moving sideways at ' + W(L.vx) + ' m/s.',
          'At the top the vertical component is zero: it is changing from up to down.',
          'That is the launch velocity. At the top the vertical part is gone; only v<sub>x</sub> remains.'
        ], '3.B')
      ],
      solution: [
        'Draw the velocity as the hypotenuse of a right triangle, with the angle at the launch point.',
        'v<sub>x</sub> = v cos θ = ' + W(v) + ' × cos ' + ang + '° = ' + W(L.vx) + ' m/s.',
        'v<sub>y</sub> = v sin θ = ' + W(v) + ' × sin ' + ang + '° = ' + W(L.vy) + ' m/s. Check: √(v<sub>x</sub>² + v<sub>y</sub>²) = ' + W(v) + ' m/s.',
        'With no air resistance nothing changes v<sub>x</sub>; v<sub>y</sub> drops by ' + g + ' m/s every second and is zero at the top.'
      ],
      values: { v: v, angle: ang, g: g }
    };
  };

  /* 2. Horizontal launch from a height: time to fall, then distance. */
  G.flight = function(r, ctx){
    var g = M.g(ctx), h = r.between(5, 80, 2), u = r.between(3, 25, 2);
    var L = launch({ v: u, angle: 0, h: h, g: g }), t = L.T;
    var faster = r.pick([2, 3]);
    return {
      text: '<p>A ball rolls off the edge of a cliff ' + W(h) + ' m high, moving horizontally at ' + W(u) + ' m/s. ' + gText(g) + '</p>',
      fig: scene({ v: u, angle: 0, h: h, g: g, show: 'path' }),
      steps: [
        num('t', 'Time to reach the ground', t, 's', [{ value: h / u, why: 'That divides the height by the horizontal speed. The fall is vertical motion only: h = ½gt², starting with v<sub>y</sub> = 0.' }, { value: h / g, why: 'Use h = ½gt², so t = √(2h/g).' }], '2.B', 'Vertically it starts at rest: h = ½gt².'),
        num('x', 'Horizontal distance from the base of the cliff where it lands', L.R, 'm', [{ value: h, why: 'That is the height. Horizontal distance = v<sub>x</sub> × t.' }, { value: 0.5 * u * t, why: 'v<sub>x</sub> does not change, so the distance is v<sub>x</sub> × t, without a ½.' }], '2.B', 'x = v<sub>x</sub> × t, with v<sub>x</sub> constant.'),
        choice('faster', 'If it left the edge ' + faster + ' times as fast, the time to reach the ground would be…', ['The same', faster + ' times as long', (faster === 2 ? 'Half' : 'A third') + ' as long', faster * faster + ' times as long'], 0, [
          'Right: the time to fall depends only on the height and g. A faster horizontal speed only carries it farther (' + faster + ' times as far).',
          'Horizontal speed does not change the vertical motion: it still starts with v<sub>y</sub> = 0 and falls the same height.',
          'A faster ball does not fall faster; the two directions are independent.',
          'Time to fall depends only on h and g, not on the horizontal speed.'
        ], '2.D')
      ],
      solution: [
        'Vertical: v<sub>y</sub> starts at 0, so h = ½gt² and t = √(2h/g) = √(2 × ' + W(h) + ' ÷ ' + g + ') = ' + W(t) + ' s.',
        'Horizontal: v<sub>x</sub> = ' + W(u) + ' m/s the whole time, so x = v<sub>x</sub>t = ' + W(u) + ' × ' + W(t) + ' = ' + W(L.R) + ' m.',
        'The horizontal speed sets how far it goes, never how long it falls.'
      ],
      values: { h: h, u: u, g: g }
    };
  };

  /* 3. Level ground: time of flight and range. */
  G.range = function(r, ctx){
    var g = M.g(ctx), v = r.between(8, 30, 2), ang = r.pick([15, 20, 25, 30, 35, 40, 50, 55, 60, 65, 70, 75]);
    var L = launch({ v: v, angle: ang, h: 0, g: g });
    var other = 90 - ang, near = ang + 10 === other || ang + 10 >= 90 ? ang - 10 : ang + 10;
    return {
      text: '<p>A ball is kicked from level ground at ' + W(v) + ' m/s, ' + ang + '° above the horizontal, and lands on the same level ground. ' + gText(g) + '</p>',
      fig: scene({ v: v, angle: ang, h: 0, g: g, show: 'path' }),
      steps: [
        num('t', 'Time of flight', L.T, 's', [{ value: L.tTop, why: 'That is the time to the top. On level ground the way down takes as long as the way up: double it.' }, { value: 2 * L.vx / g, why: 'That uses the horizontal component. The time in the air comes from the vertical motion: 2v sin θ ÷ g.' }, { value: 2 * v / g, why: 'Use only the vertical component, v sin θ, not the whole speed.' }], '2.B', 'From the vertical motion only: up and back down.'),
        num('R', 'Horizontal distance traveled (the range)', L.R, 'm', [{ value: L.vy * L.T, why: 'That uses the vertical component. Horizontal distance = v<sub>x</sub> × t = v cos θ × t.' }, { value: v * L.T, why: 'Use the horizontal component v cos θ, not the whole speed.' }], '2.B', 'R = v<sub>x</sub> × time of flight.'),
        choice('same', 'Launched at the same speed, which other angle gives the same range?', [other + '°', near + '°', (180 - ang) + '°', 'No other angle'], 0, [
          'Right: ' + ang + '° and ' + other + '° add up to 90°. The steeper launch stays up longer but moves sideways more slowly, by exactly the same factor.',
          'Not this one. The range depends on sin θ cos θ, which is the same for θ and 90° − θ.',
          'That angle points backward.',
          'Every angle except 45° has a partner: θ and 90° − θ give the same range on level ground.'
        ], '3.B')
      ],
      solution: [
        'v<sub>x</sub> = ' + W(v) + ' cos ' + ang + '° = ' + W(L.vx) + ' m/s; v<sub>y</sub> = ' + W(v) + ' sin ' + ang + '° = ' + W(L.vy) + ' m/s.',
        'Vertical: up for v<sub>y</sub> ÷ g = ' + W(L.tTop) + ' s, down for the same time, so t = 2v<sub>y</sub> ÷ g = ' + W(L.T) + ' s.',
        'Horizontal: R = v<sub>x</sub>t = ' + W(L.vx) + ' × ' + W(L.T) + ' = ' + W(L.R) + ' m.'
      ],
      values: { v: v, angle: ang, g: g }
    };
  };

  /* 4. Maximum height, from the ground or from a height. */
  G.maxh = function(r, ctx){
    var g = M.g(ctx), v = r.between(8, 30, 2), ang = r.int(4, 15) * 5, h = r() < 0.5 ? 0 : r.between(2, 30, 2);
    var L = launch({ v: v, angle: ang, h: h, g: g }), rise = L.vy * L.vy / (2 * g);
    var steps = [
      num('vy', 'Vertical component of the launch velocity', L.vy, 'm/s', [{ value: L.vx, why: 'That is v cos θ, the horizontal part. Height depends on v sin θ.' }], '2.B', 'v<sub>y</sub> = v sin θ.'),
      num('ttop', 'Time to reach the highest point', L.tTop, 's', [{ value: v / g, why: 'Use the vertical component: at the top v<sub>y</sub> = 0, so t = v<sub>y</sub> ÷ g.' }, { value: 2 * L.tTop, why: 'That is up and back down. The top is halfway: t = v<sub>y</sub> ÷ g.' }], '2.B', 'At the top v<sub>y</sub> = 0.'),
      num('H', h ? 'Highest point above the ground' : 'Maximum height above the ground', L.H, 'm',
        [{ value: v * v / (2 * g) + h, why: 'That uses the whole speed. Only v<sub>y</sub> lifts the ball: Δy = v<sub>y</sub>² ÷ (2g).' }].concat(h ? [{ value: rise, why: 'That is how far it rises above the launch point. Add the ' + W(h) + ' m it started at.' }] : []), '2.B', 'Δy = v<sub>y</sub>² ÷ (2g)' + (h ? ', then add the launch height.' : '.'))
    ];
    return {
      text: '<p>A ball is launched at ' + W(v) + ' m/s, ' + ang + '° above the horizontal, from ' + (h ? 'the top of a ledge ' + W(h) + ' m above the ground' : 'the ground') + '. ' + gText(g) + '</p>',
      fig: scene({ v: v, angle: ang, h: h, g: g, show: 'top' }),
      steps: steps,
      solution: [
        'v<sub>y</sub> = ' + W(v) + ' sin ' + ang + '° = ' + W(L.vy) + ' m/s.',
        'At the top v<sub>y</sub> = 0: t = v<sub>y</sub> ÷ g = ' + W(L.tTop) + ' s.',
        'Rise: v<sub>y</sub>² = 2gΔy, so Δy = ' + W(L.vy) + '² ÷ (2 × ' + g + ') = ' + W(rise) + ' m' + (h ? '; above the ground that is ' + W(h) + ' + ' + W(rise) + ' = ' + W(L.H) + ' m.' : '.')
      ],
      values: { v: v, angle: ang, h: h, g: g }
    };
  };

  /* 5. Which lands first? Two balls from the same height. */
  G.first = function(r, ctx){
    var g = M.g(ctx), h = r.between(5, 40, 2), kind = r.pick(['drop', 'up', 'down', 'speeds']);
    var A, B, aText, bText;
    if(kind === 'drop'){ var u = r.between(3, 20, 2); A = { v: 0, angle: 0 }; B = { v: u, angle: 0 }; aText = 'Ball A is dropped from rest.'; bText = 'Ball B is thrown horizontally at ' + W(u) + ' m/s.'; }
    else if(kind === 'speeds'){ var u1 = r.between(3, 10, 2), u2 = r.between(12, 25, 2); A = { v: u1, angle: 0 }; B = { v: u2, angle: 0 }; aText = 'Ball A is thrown horizontally at ' + W(u1) + ' m/s.'; bText = 'Ball B is thrown horizontally at ' + W(u2) + ' m/s.'; }
    else { var s = r.between(5, 15, 2), a = r.int(4, 12) * 5; A = { v: s, angle: kind === 'up' ? a : -a }; B = { v: s, angle: 0 }; aText = 'Ball A is thrown at ' + W(s) + ' m/s, ' + a + '° ' + (kind === 'up' ? 'above' : 'below') + ' the horizontal.'; bText = 'Ball B is thrown horizontally at the same speed.'; }
    var LA = launch({ v: A.v, angle: A.angle, h: h, g: g }), LB = launch({ v: B.v, angle: B.angle, h: h, g: g });
    var d = LA.T - LB.T, key = Math.abs(d) < 1e-9 ? 2 : d < 0 ? 0 : 1;
    var why = {
      drop: 'Both start with v<sub>y</sub> = 0 and fall the same height, so they land together. B\'s sideways motion does not slow its fall.',
      speeds: 'Both start with v<sub>y</sub> = 0, so they land together. B lands farther away, not later.',
      up: 'A starts moving upward (v<sub>y</sub> > 0), so it has to rise and come back before falling the height: it lands after B.',
      down: 'A starts with a downward v<sub>y</sub>, so it is already falling: it lands before B.'
    }[kind];
    var ask = key === 2 ? LA : LB;
    return {
      text: '<p>Two balls leave the edge of a roof ' + W(h) + ' m above the ground at the same moment. ' + aText + ' ' + bText + ' ' + gText(g) + '</p>',
      fig: scene({ v: B.v, angle: B.angle, h: h, g: g, show: 'two', other: { v: A.v, angle: A.angle } }),
      steps: [
        choice('which', 'Which ball reaches the ground first?', ['Ball A', 'Ball B', 'They land at the same time'], key, [
          key === 0 ? 'Right. ' + why : 'Not A. ' + why,
          key === 1 ? 'Right. ' + why : 'Not B. ' + why,
          key === 2 ? 'Right. ' + why : 'Not together: their vertical motions start differently. ' + why
        ], '3.B', true),
        num('t', 'Time for ball B to reach the ground', LB.T, 's', [{ value: h / Math.max(B.v, 0.1), why: 'Height ÷ horizontal speed mixes the two directions. Use the vertical motion: h = ½gt².' }], '2.B', 'B starts with v<sub>y</sub> = 0: h = ½gt².')
      ],
      solution: [
        'The time in the air comes from the vertical motion only: the starting v<sub>y</sub>, the height and g.',
        'Ball B: v<sub>y</sub> = 0, so t = √(2h/g) = √(2 × ' + W(h) + ' ÷ ' + g + ') = ' + W(LB.T) + ' s.',
        'Ball A: v<sub>y</sub> = ' + W(LA.vy) + ' m/s, so its time is ' + W(LA.T) + ' s. ' + why
      ],
      values: { h: h, g: g, A: A, B: B, kind: kind }
    };
  };

  /* 6. The horizontal velocity stays the same; the vertical one changes. */
  G.vxconst = function(r, ctx){
    var g = M.g(ctx), v = r.between(8, 25, 2), ang = r.int(3, 12) * 5, h = r.between(5, 40, 2);
    var L = launch({ v: v, angle: ang, h: h, g: g }), tq = M.round(Math.min(L.T * 0.9, Math.max(0.2, L.T * (0.3 + 0.5 * r()))), 1);
    var at = L.at(tq);
    return {
      text: '<p>A ball is thrown from a cliff ' + W(h) + ' m high at ' + W(v) + ' m/s, ' + ang + '° above the horizontal. ' + gText(g) + '</p>',
      fig: scene({ v: v, angle: ang, h: h, g: g, show: 'components' }),
      steps: [
        num('vx', 'Horizontal velocity ' + M.fixed(tq, 1) + ' s after the throw', L.vx, 'm/s', [{ value: v, why: 'That is the launch speed. The horizontal component is v cos θ, and it stays that size the whole flight.' }, { value: L.vy, why: 'That is v sin θ, the vertical component at launch.' }], '2.B', 'What changes v<sub>x</sub> during the flight?'),
        num('vy', 'Vertical velocity ' + M.fixed(tq, 1) + ' s after the throw (up is positive)', at.vy, 'm/s', [{ value: L.vy, why: 'That is v<sub>y</sub> at launch. It changes by −g every second: v<sub>y</sub> = v sin θ − gt.' }, { value: L.vy + g * tq, why: 'g points down: subtract gt.' }], '2.B', 'v<sub>y</sub> = v sin θ − gt.'),
        choice('land', 'Just before it lands, the horizontal velocity is…', ['The same, ' + W(L.vx) + ' m/s', 'Larger, because the ball is moving faster', 'Zero', 'Smaller, because the ball is slowing down'], 0, [
          'Right: with no air resistance nothing acts sideways, so v<sub>x</sub> = ' + W(L.vx) + ' m/s from launch to landing. Only v<sub>y</sub> grows on the way down.',
          'The ball does speed up on the way down, but only because v<sub>y</sub> grows. v<sub>x</sub> stays ' + W(L.vx) + ' m/s.',
          'v<sub>x</sub> never changes during the flight; it is v<sub>y</sub> that is zero at the top.',
          'Without air resistance nothing slows the sideways motion.'
        ], '3.B')
      ],
      solution: [
        'v<sub>x</sub> = v cos θ = ' + W(v) + ' cos ' + ang + '° = ' + W(L.vx) + ' m/s, the same at every moment.',
        'v<sub>y</sub> = v sin θ − gt = ' + W(L.vy) + ' − ' + g + ' × ' + M.fixed(tq, 1) + ' = ' + W(at.vy) + ' m/s' + (at.vy < 0 ? ' (moving down).' : ' (still rising).'),
        'Two independent motions: constant velocity sideways, constant acceleration g downward.'
      ],
      values: { v: v, angle: ang, h: h, g: g, tq: tq }
    };
  };

  /* 7. Reference frames: a cart launches a ball straight up. */
  var CARTS = [
    { who: 'A cart rolls along a level track at', what: 'A spring in the cart launches a ball straight up (as seen from the cart) at', where: 'the cart' },
    { who: 'A flatbed truck drives along a straight, level road at', what: 'A worker on the truck tosses a ball straight up (as seen on the truck) at', where: 'the truck' },
    { who: 'A skateboarder rolls along a level path at', what: 'She tosses a ball straight up (as she sees it) at', where: 'the skateboarder' }
  ];
  G.relative = function(r, ctx){
    var g = M.g(ctx), c = r.pick(CARTS), u = r.between(1, 8, 2), w = r.between(3, 12, 2);
    var K = cartLaunch({ u: u, w: w, g: g });
    return {
      text: '<p>' + c.who + ' a constant ' + W(u) + ' m/s. ' + c.what + ' ' + W(w) + ' m/s. ' + gText(g) + '</p>',
      fig: scene({ cart: true, u: u, w: w, g: g }),
      steps: [
        num('vxg', 'Horizontal velocity of the ball as seen from the ground, just after launch', u, 'm/s', [{ value: 0 , why: 'That is what an observer moving with ' + c.where + ' sees. From the ground, the ball also has ' + c.where + '\'s ' + W(u) + ' m/s.' }, { value: w, why: 'That is the vertical launch speed. Horizontally the ball keeps ' + c.where + '\'s velocity.' }], '2.B', 'Velocity seen from the ground = velocity seen from ' + c.where + ' + velocity of ' + c.where + '.'),
        num('t', 'Time until the ball comes back down to launch height', K.T, 's', [{ value: w / g, why: 'That is the time to the top. Up and back down takes twice as long.' }], '2.B', 'Vertical motion only.'),
        choice('land', 'Where does the ball come down?', ['Back at ' + c.where, 'Behind ' + c.where, 'Ahead of ' + c.where], 0, [
          'Right: the ball keeps moving forward at ' + W(u) + ' m/s, the same as ' + c.where + ', so in the ' + W(K.T) + ' s it is up, both move ' + W(K.D) + ' m.',
          'It does not fall behind: nothing slows its horizontal motion, so it keeps pace with ' + c.where + '.',
          'It does not get ahead: its horizontal velocity equals ' + c.where + '\'s, no more.'
        ], '3.B'),
        num('D', 'How far does the ball move horizontally, as seen from the ground, while it is in the air?', K.D, 'm', [{ value: 0, why: 'That is what ' + c.where + ' sees. From the ground the ball moves forward with it.' }], '2.B', 'x = v<sub>x</sub> × t in the ground frame.')
      ],
      solution: [
        'In the frame of ' + c.where + ': the ball goes straight up at ' + W(w) + ' m/s and straight down.',
        'In the ground frame: add ' + c.where + '\'s velocity, ' + W(u) + ' m/s forward. The vertical motion is the same in both frames, and so is the acceleration (g down).',
        'Time up and down: 2 × (launch speed) ÷ g = 2 × ' + W(w) + ' ÷ ' + g + ' = ' + W(K.T) + ' s. Ground distance: ' + W(u) + ' × ' + W(K.T) + ' = ' + W(K.D) + ' m, the same as ' + c.where + ' moves, so the ball lands back where it started relative to ' + c.where + '.'
      ],
      values: { u: u, w: w, g: g }
    };
  };

  var TOPIC = { components: 'motion-2d', flight: 'motion-2d', range: 'motion-2d', maxh: 'motion-2d', first: 'motion-2d', vxconst: 'motion-2d', relative: 'reference-frames' };
  function generate(r, ctx, type){
    type = (type && G[type]) ? type : ctx.kind;
    if(!G[type]) throw new Error('projectile-lab: unknown problem type ' + type);
    var p = G[type](r, ctx);
    p.ctx = ctx.id; p.topic = ctx.topic || TOPIC[type]; p.type = type;
    return p;
  }

  M.register('projectileLab', { launch: launch, strobe: strobe, cartLaunch: cartLaunch, TOPIC: TOPIC, dOf: dOf, generate: generate });
})();
