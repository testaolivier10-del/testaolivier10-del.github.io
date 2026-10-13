/* AP® Physics 1 tool math, the shared part: window.ApPhysMath. Pure
   functions, no DOM, so the validators (scripts/lib/apphys-tool-checks/
   _shared.mjs) and the node tests recompute every number with the code
   students run (docs/apphys-architecture.md, "Tools").

   This file holds ONLY what every trainer shares. Each trainer's model lives
   in its own file, physics/assets/tools/math/<slug>.js, which registers
   ApPhysMath.<camelSlug> (motion-graphs -> ApPhysMath.motionGraphs), so four
   tool authors never edit the same file. The generator loads this file,
   then the tool's model file, on the tool's page.

     ApPhysMath.C                  constants from the equations sheet: g (9.8),
                                   G_ALT (10), G (6.67e-11), ATM (1.0e5)
     ApPhysMath.g(item)            the g an item or context asks for: its `g`
                                   field (9.8 or 10), else 9.8
     ApPhysMath.round(x, d)        to d decimals (a number); fixed(x, d) as a string
     ApPhysMath.sig(x, n)          to n significant figures (a number)
     ApPhysMath.fmt(x, n)          to n significant figures as text, a × 10ⁿ
                                   when very large or small, with a real minus
     ApPhysMath.rng(seed)          seeded random source: r() in [0, 1),
                                   r.int(a, b), r.pick(list), r.between(a, b, n)
     ApPhysMath.near(x, a, rel, abs)
     ApPhysMath.cell(answer, rel, mistakes, abs)
                                   a numeric step: { answer, rel, abs?, mistakes }
                                   (a mistake that would be graded right is dropped)
     ApPhysMath.diagnose(cell, x)  { ok, why? }: the authored slip x matches,
                                   else the common physics slips: sign, factor
                                   of 2, a missing square or square root,
                                   g = 9.8 vs 10, cm vs m (100), kilo/milli
                                   (1000), degrees vs radians
     ApPhysMath.vec                small 2D vector algebra: add, sub, scale, len,
                                   angle (degrees from +x), fromPolar(len, deg),
                                   components(len, deg) -> { x, y }
     ApPhysMath.deg / rad          degrees <-> radians
     ApPhysMath.register(name, model)
                                   how a tool's model file adds itself; throws
                                   if the name is taken, so two files cannot
                                   silently overwrite each other */
(function(){
  'use strict';
  var C = { g: 9.8, G_ALT: 10, G: 6.67e-11, ATM: 1.0e5 };
  function g(o){ return o && (o.g === 10 || o.g === 9.8 || o.g === 9.81) ? o.g : C.g; }

  function round(x, d){ var k = Math.pow(10, d || 0); return Math.round((x + (x >= 0 ? 1e-12 : -1e-12)) * k) / k; }
  function fixed(x, d){ var r = round(x, d); if(Object.is(r, -0) || r === 0) r = 0; return r.toFixed(d); }
  function sig(x, n){ if(!x) return 0; return Number(Number(x).toPrecision(n)); }
  var SUPD = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function sup(n){ return String(n).replace(/[0-9-]/g, function(c){ return SUPD[c]; }); }
  function minus(s){ return String(s).replace(/^-/, '−'); }
  function fmt(x, n){
    n = n || 3;
    if(!isFinite(x)) return String(x);
    if(x === 0) return '0';
    var v = sig(x, n), e = Math.floor(Math.log10(Math.abs(v)) + 1e-12);
    if(e < -3 || e >= 5){ var c = v / Math.pow(10, e); return minus(c.toFixed(n - 1)) + ' × 10' + sup(e); }
    return minus(v.toFixed(Math.max(0, n - 1 - e)));
  }

  /* mulberry32: the same numbers for the same seed, on every device. */
  function rng(seed){
    var s = (seed >>> 0) || 1;
    function next(){ s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    next.int = function(a, b){ return a + Math.floor(next() * (b - a + 1)); };
    next.pick = function(a){ return a[Math.floor(next() * a.length)]; };
    next.between = function(a, b, n){ return sig(a + next() * (b - a), n || 2); };
    return next;
  }

  function near(x, a, rel, abs){ return Math.abs(x - a) <= (rel || 0) * Math.abs(a) + (abs || 0) + 1e-12 * Math.abs(a) + 1e-300; }
  function cell(answer, rel, mistakes, abs){
    var seen = [];
    var ms = (mistakes || []).filter(function(m){
      if(!isFinite(m.value) || near(m.value, answer, 2.5 * rel, 2.5 * (abs || 0))) return false;
      if(seen.some(function(v){ return near(m.value, v, 2 * rel, 2 * (abs || 0)); })) return false;
      seen.push(m.value); return true;
    });
    var c = { answer: answer, rel: rel, mistakes: ms };
    if(abs) c.abs = abs;
    return c;
  }
  /* The slips the physics readers report (docs/apphys-research/framework.md,
     section 8), tried after the authored ones. A g slip is checked on the
     first, second and half power of 10/9.8 (g, g², √g). */
  var G_K = [10 / 9.8, 9.8 / 10, Math.pow(10 / 9.8, 2), Math.pow(9.8 / 10, 2), Math.sqrt(10 / 9.8), Math.sqrt(9.8 / 10)];
  function diagnose(c, x){
    if(typeof x !== 'number' || !isFinite(x)) return { ok: false, blank: true };
    var A = c.answer, r = c.rel, ab = c.abs;
    if(near(x, A, r, ab)) return { ok: true };
    for(var i = 0; i < c.mistakes.length; i++) if(near(x, c.mistakes[i].value, r, ab)) return { ok: false, why: c.mistakes[i].why };
    if(!A) return { ok: false };
    if(near(-x, A, r, ab)) return { ok: false, why: 'The size is right but the sign is wrong. Check the direction you called positive.' };
    if(G_K.some(function(k){ return near(x, A * k, Math.min(r, 0.004)); })) return { ok: false, why: 'Off by about 2%: that is g = 9.8 m/s² against 10 m/s². Use the value of g this problem gives.' };
    if(near(x / 2, A, r, ab) || near(x * 2, A, r, ab)) return { ok: false, why: 'Off by a factor of 2. Check for a ½ (as in ½mv² or ½kx²) or a quantity that should be doubled.' };
    if(x > 0 && A > 0 && near(x * x, A, 2 * r)) return { ok: false, why: 'Your number squared is the answer. Check for a square you left out.' };
    if(x > 0 && A > 0 && near(Math.sqrt(x), A, r)) return { ok: false, why: 'The square root of your number is the answer. Check for a square root you left out.' };
    if(near(x / 100, A, r, ab) || near(x * 100, A, r, ab)) return { ok: false, why: 'Off by a factor of 100: check centimeters and meters.' };
    if(near(x / 1000, A, r, ab) || near(x * 1000, A, r, ab)) return { ok: false, why: 'Off by a factor of 1000: check a kilo or milli conversion (g and kg, mm and m).' };
    if(near(x * Math.PI / 180, A, r, ab) || near(x * 180 / Math.PI, A, r, ab)) return { ok: false, why: 'Off by the factor between degrees and radians. Check the angle\'s unit and your calculator\'s mode.' };
    return { ok: false };
  }

  function deg(r){ return r * 180 / Math.PI; }
  function rad(d){ return d * Math.PI / 180; }
  var vec = {
    add: function(a, b){ return { x: a.x + b.x, y: a.y + b.y }; },
    sub: function(a, b){ return { x: a.x - b.x, y: a.y - b.y }; },
    scale: function(a, k){ return { x: a.x * k, y: a.y * k }; },
    len: function(a){ return Math.sqrt(a.x * a.x + a.y * a.y); },
    angle: function(a){ return deg(Math.atan2(a.y, a.x)); },
    fromPolar: function(L, d){ return { x: L * Math.cos(rad(d)), y: L * Math.sin(rad(d)) }; },
    components: function(L, d){ return vec.fromPolar(L, d); },
    sum: function(list){ return list.reduce(function(s, v){ return vec.add(s, v); }, { x: 0, y: 0 }); }
  };

  var M = {
    C: C, g: g, round: round, fixed: fixed, sig: sig, fmt: fmt, sup: sup, minus: minus, rng: rng,
    near: near, cell: cell, diagnose: diagnose, deg: deg, rad: rad, vec: vec,
    register: function(name, model){
      if(!/^[a-z][A-Za-z0-9]*$/.test(name)) throw new Error('ApPhysMath.register: "' + name + '" is not a camelCase name');
      if(Object.prototype.hasOwnProperty.call(M, name)) throw new Error('ApPhysMath.register: "' + name + '" is already registered');
      M[name] = model;
      return model;
    },
    /* "motion-graphs" -> "motionGraphs": the name a tool's model file registers. */
    camel: function(slug){ return String(slug).replace(/-([a-z0-9])/g, function(_, c){ return c.toUpperCase(); }); }
  };
  window.ApPhysMath = M;
})();
