/* Free-body diagrams model: ApPhysMath.freeBodyDiagrams (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apphys-tool-checks/free-body-diagrams.mjs) and the test
   (scripts/test/apphys-tool-free-body-diagrams.test.mjs) run exactly this code.

   Loaded on physics/tools/free-body-diagrams.html after phys-tool-math.js and
   before physics/assets/tools/free-body-diagrams.js. SI units; angles in
   degrees counterclockwise from +x with y up (down is 270).

     TYPES, PALETTE        the force kinds a student can draw (the last three,
                           centripetal, net and "motion", are not forces: they
                           are there so the grader can name that miss)
     SCENES                scene id -> { obj, name, agents }
     solve(scene, p, g)    -> { scene, obj, m, forces: [{ type, sym, agent, mag,
                           ang, dirWhy, missWhy }], a: { x, y }, state, axis }
                           every force ON the object, magnitudes in N
     laws(res, p)          Newton's second law along the scene's two axes, in
                           symbols and numbers (the Explore "Why?")
     grade(arrows, step)   the student's diagram against the key, force by
                           force: { ok, arrows: [{ st, why }], missing: [...],
                           notes: [...] }; arrows are { type, agent, rev, ang,
                           len, onObj }
     generate(rng, ctx, scene?) a "Test yourself" problem: draw the FBD (step
                           kind "fbd"), pick Newton's second law along an axis
                           (choice), solve for a or a force (num) */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;
  var RHO_W = 1000, DIR_TOL = 12;
  function rad(d){ return d * Math.PI / 180; }
  function norm(a){ a = a % 360; return a < 0 ? a + 360 : a; }
  function adiff(a, b){ var d = Math.abs(norm(a) - norm(b)); return d > 180 ? 360 - d : d; }
  function f2(x){ return M.fmt(x, 2); }
  function f3(x){ return M.fmt(x, 3); }
  function S(t){ return String(t).replace(/([A-Za-zμ])_([A-Za-z0-9]+)/g, '$1<sub>$2</sub>'); }

  var TYPES = {
    grav: { fam: 'grav', sym: 'F_g', name: 'Gravitational force', short: 'Gravitational', cls: 'f-grav' },
    normal: { fam: 'normal', sym: 'F_N', name: 'Normal force', short: 'Normal', cls: 'f-normal' },
    tension: { fam: 'tension', sym: 'F_T', name: 'Tension', short: 'Tension', cls: 'f-tension' },
    fs: { fam: 'friction', sym: 'f_s', name: 'Static friction', short: 'Static friction', cls: 'f-friction' },
    fk: { fam: 'friction', sym: 'f_k', name: 'Kinetic friction', short: 'Kinetic friction', cls: 'f-friction' },
    spring: { fam: 'spring', sym: 'F_s', name: 'Spring force', short: 'Spring', cls: 'f-spring' },
    applied: { fam: 'applied', sym: 'F_A', name: 'Applied force (a push)', short: 'Applied', cls: 'f-applied' },
    buoy: { fam: 'buoy', sym: 'F_b', name: 'Buoyant force', short: 'Buoyant', cls: 'f-buoy' },
    centripetal: { fam: 'fake', sym: 'F_c', name: 'Centripetal force', short: 'Centripetal', cls: 'net' },
    net: { fam: 'fake', sym: 'F_net', name: 'Net force', short: 'Net force', cls: 'net' },
    motion: { fam: 'fake', sym: 'F_motion', name: 'Force of motion', short: 'Force of motion', cls: 'net' }
  };
  var PALETTE = ['grav', 'normal', 'tension', 'fs', 'fk', 'spring', 'applied', 'buoy', 'centripetal', 'net', 'motion'];

  /* agents: everything in the picture that could be named as the source of a
     force. A label is "<agent> on <obj>" or, reversed, "<obj> on <agent>"
     (the third-law partner, which belongs on the other object's diagram). */
  var SCENES = {
    table: { obj: 'book', name: 'Book on a table', agents: ['Earth', 'table', 'hand', 'floor'] },
    hang1: { obj: 'bucket', name: 'Bucket on one rope', agents: ['Earth', 'rope', 'ceiling'] },
    hang2: { obj: 'sign', name: 'Sign on two ropes', agents: ['Earth', 'left rope', 'right rope', 'ceiling'] },
    incline: { obj: 'block', name: 'Block on a frictionless ramp', agents: ['Earth', 'ramp', 'ground'] },
    rough: { obj: 'block', name: 'Block on a rough ramp', agents: ['Earth', 'ramp', 'ground'] },
    crate: { obj: 'crate', name: 'Crate dragged across a floor', agents: ['Earth', 'floor', 'rope', 'person'] },
    elevator: { obj: 'person', name: 'Person in an elevator', agents: ['Earth', 'floor', 'cable'] },
    atwood: { obj: 'block', name: 'Two blocks over a pulley', agents: ['Earth', 'rope', 'pulley', 'other block'] },
    car: { obj: 'car', name: 'Car on a flat curve', agents: ['Earth', 'road', 'air'] },
    spring: { obj: 'block', name: 'Block on a spring', agents: ['Earth', 'track', 'spring', 'wall'] },
    water: { obj: 'block', name: 'Block in water', agents: ['Earth', 'water', 'string', 'tank'] }
  };
  var ORDER = ['table', 'hang1', 'hang2', 'incline', 'elevator', 'atwood', 'rough', 'crate', 'spring', 'car', 'water'];

  function force(type, agent, mag, ang, o){
    o = o || {};
    return { type: type, sym: o.sym || TYPES[type].sym, agent: agent, mag: mag, ang: norm(ang), dirWhy: o.dirWhy || '', missWhy: o.missWhy || '' };
  }
  function grav(m, g, obj){ return force('grav', 'Earth', m * g, 270, { dirWhy: 'Gravity points straight down, toward the center of Earth.', missWhy: 'Earth pulls on the ' + obj + ' (it has mass), so F<sub>g</sub> belongs on every diagram here.' }); }
  function normalF(agent, mag, ang, obj, tilted){
    return force('normal', agent, mag, ang, { dirWhy: 'The normal force is perpendicular to the surface, pushing away from it' + (tilted ? ': on a ramp that is tilted, not straight up.' : '.'),
      missWhy: 'The ' + agent + ' touches the ' + obj + ' and pushes on it: that is the normal force.' });
  }
  function tensionF(agent, mag, ang, obj, sym){
    return force('tension', agent, mag, ang, { sym: sym, dirWhy: 'A rope can only pull, along its own length, away from the ' + obj + '.', missWhy: 'The ' + agent + ' is attached to the ' + obj + ' and pulls on it: that is a tension force.' });
  }
  function vecOf(f){ return { x: f.mag * Math.cos(rad(f.ang)), y: f.mag * Math.sin(rad(f.ang)) }; }
  function netOf(forces){ return forces.reduce(function(s, f){ var v = vecOf(f); return { x: s.x + v.x, y: s.y + v.y }; }, { x: 0, y: 0 }); }
  function clean(fs){ return fs.filter(function(f){ return f.mag > 1e-9; }); }
  function aVec(mag, ang){ return mag > 1e-12 ? { x: mag * Math.cos(rad(ang)), y: mag * Math.sin(rad(ang)) } : { x: 0, y: 0 }; }
  function out(scene, m, forces, a, state, axis, extra){
    var r = { scene: scene, obj: SCENES[scene].obj, m: m, forces: clean(forces), a: a, amag: Math.sqrt(a.x * a.x + a.y * a.y), state: state, axis: axis };
    Object.keys(extra || {}).forEach(function(k){ r[k] = extra[k]; });
    r.net = netOf(r.forces);
    return r;
  }

  /* ---------------------------------------------------------- the physics */
  var SOLVE = {
    // p: m, push (a hand pressing straight down, N)
    table: function(p, g){
      var push = p.push || 0;
      return out('table', p.m, [grav(p.m, g, 'book'), normalF('table', p.m * g + push, 90, 'book'),
        force('applied', 'hand', push, 270, { dirWhy: 'The hand presses straight down on the book.', missWhy: 'The hand presses on the book: that push is a force on it.' })],
        { x: 0, y: 0 }, 'rest', { ang: 90, name: 'Vertical', pos: 'up' });
    },
    // p: m, a (up positive)
    hang1: function(p, g){
      var a = p.a || 0;
      return out('hang1', p.m, [grav(p.m, g, 'bucket'), tensionF('rope', p.m * (g + a), 90, 'bucket')],
        { x: 0, y: a }, Math.abs(a) < 1e-9 ? 'rest' : 'accel', { ang: 90, name: 'Vertical', pos: 'up' });
    },
    // p: m, al (left rope above horizontal), be (right rope)
    hang2: function(p, g){
      var s = Math.sin(rad(p.al + p.be)), W = p.m * g;
      var T1 = W * Math.cos(rad(p.be)) / s, T2 = W * Math.cos(rad(p.al)) / s;
      return out('hang2', p.m, [grav(p.m, g, 'sign'), tensionF('left rope', T1, 180 - p.al, 'sign', 'F_T1'), tensionF('right rope', T2, p.be, 'sign', 'F_T2')],
        { x: 0, y: 0 }, 'rest', { ang: 90, name: 'Vertical', pos: 'up' }, { T1: T1, T2: T2 });
    },
    // p: m, th. The ramp rises to the left: down the slope is the angle -th.
    incline: function(p, g){
      var th = p.th, W = p.m * g;
      return out('incline', p.m, [grav(p.m, g, 'block'), normalF('ramp', W * Math.cos(rad(th)), 90 - th, 'block', true)],
        aVec(g * Math.sin(rad(th)), -th), 'accel', { ang: -th, name: 'Along the ramp', pos: 'down the ramp', tilt: th });
    },
    // p: m, th, mus, muk, start: 'rest' (released from rest) | 'down' (sliding down) | 'up' (sliding up)
    rough: function(p, g){
      var th = p.th, W = p.m * g, N = W * Math.cos(rad(th)), along = W * Math.sin(rad(th)), fs = [grav(p.m, g, 'block'), normalF('ramp', N, 90 - th, 'block', true)];
      var start = p.start || 'rest', state, a;
      if(start === 'up'){
        fs.push(force('fk', 'ramp', p.muk * N, -th, { dirWhy: 'The block slides up the ramp, so kinetic friction points down the ramp, against the sliding.', missWhy: 'The block slides over the rough ramp, so the ramp exerts kinetic friction on it.' }));
        a = aVec(g * (Math.sin(rad(th)) + p.muk * Math.cos(rad(th))), -th); state = 'slowing';
      } else if(start === 'rest' && along <= p.mus * N + 1e-9){
        fs.push(force('fs', 'ramp', along, 180 - th, { dirWhy: 'Without friction the block would slide down, so static friction points up the ramp.', missWhy: 'The block would slide down a smooth ramp; static friction from the ramp holds it.' }));
        a = { x: 0, y: 0 }; state = 'rest';
      } else {
        var net = along - p.muk * N;
        fs.push(force('fk', 'ramp', p.muk * N, 180 - th, { dirWhy: 'The block slides down the ramp, so kinetic friction points up the ramp, against the sliding.', missWhy: 'The block slides over the rough ramp, so the ramp exerts kinetic friction on it.' }));
        a = net > 0 ? aVec(net / p.m, -th) : aVec(-net / p.m, 180 - th); state = net > 1e-9 ? 'speeding' : net < -1e-9 ? 'slowing' : 'steady';
      }
      return out('rough', p.m, fs, a, state, { ang: -th, name: 'Along the ramp', pos: 'down the ramp', tilt: th });
    },
    // p: m, F, phi, mode 'pull' (rope phi above horizontal) | 'push' (person, phi below), mus, muk. Motion to the right.
    crate: function(p, g){
      var W = p.m * g, phi = p.phi || 0, F = p.F || 0, pull = p.mode !== 'push';
      var N = pull ? W - F * Math.sin(rad(phi)) : W + F * Math.sin(rad(phi));
      var Fx = F * Math.cos(rad(phi));
      var fs = [grav(p.m, g, 'crate')];
      if(N < 0) N = 0;
      fs.push(normalF('floor', N, 90, 'crate'));
      if(pull) fs.push(tensionF('rope', F, phi, 'crate'));
      else fs.push(force('applied', 'person', F, -phi, { dirWhy: 'The push acts the way the person pushes: forward and down at the angle shown.', missWhy: 'The person pushes on the crate: that push is a force on it.' }));
      var a, state;
      if(Fx <= p.mus * N + 1e-9){
        fs.push(force('fs', 'floor', Fx, 180, { dirWhy: 'The ' + (pull ? 'rope pulls' : 'person pushes') + ' the crate forward, so static friction points backward, against that tendency to slide.', missWhy: 'The crate is being ' + (pull ? 'pulled' : 'pushed') + ' but does not slide: static friction from the floor holds it.' }));
        a = { x: 0, y: 0 }; state = 'rest';
      } else {
        fs.push(force('fk', 'floor', p.muk * N, 180, { dirWhy: 'The crate slides forward, so kinetic friction points backward, against the sliding.', missWhy: 'The crate slides over the floor, so the floor exerts kinetic friction on it.' }));
        a = { x: (Fx - p.muk * N) / p.m, y: 0 }; state = 'speeding';
      }
      return out('crate', p.m, fs, a, state, { ang: 0, name: 'Horizontal', pos: 'forward' }, { N: N, lift: N <= 0 });
    },
    // p: m, a (up positive), v: 'up' | 'down' | 'rest'
    elevator: function(p, g){
      var a = p.a || 0;
      return out('elevator', p.m, [grav(p.m, g, 'person'), normalF('floor', Math.max(0, p.m * (g + a)), 90, 'person')],
        { x: 0, y: a }, Math.abs(a) < 1e-9 ? (p.v && p.v !== 'rest' ? 'steady' : 'rest') : 'accel', { ang: 90, name: 'Vertical', pos: 'up' });
    },
    // p: m1 (left), m2 (right), which: 1 | 2 (the block drawn)
    atwood: function(p, g){
      var m1 = p.m1, m2 = p.m2, T = 2 * m1 * m2 * g / (m1 + m2), am = Math.abs(m2 - m1) * g / (m1 + m2);
      var mine = p.which === 2 ? m2 : m1, other = p.which === 2 ? m1 : m2, up = mine < other;
      return out('atwood', mine, [grav(mine, g, 'block'), tensionF('rope', T, 90, 'block')],
        am < 1e-12 ? { x: 0, y: 0 } : { x: 0, y: up ? am : -am }, am < 1e-12 ? 'rest' : 'accel', { ang: 90, name: 'Vertical', pos: 'up' }, { T: T, am: am });
    },
    // p: m, v, r, mus. Seen from behind; the center of the curve is to the left (180).
    car: function(p, g){
      var W = p.m * g, need = p.m * p.v * p.v / p.r, max = p.mus * W, skid = need > max + 1e-9;
      var fs = [grav(p.m, g, 'car'), normalF('road', W, 90, 'car'),
        force('fs', 'road', skid ? max : need, 180, { dirWhy: 'Static friction points toward the center of the curve. Without it the car would keep going straight, sliding to the outside.', missWhy: 'Something must pull the car toward the center to turn it: static friction from the road does.' })];
      return out('car', p.m, fs, { x: -(skid ? max : need) / p.m, y: 0 }, skid ? 'skid' : 'turn', { ang: 180, name: 'Toward the center', pos: 'toward the center' }, { need: need, max: max, skid: skid });
    },
    // p: m, k, x (displacement from relaxed length, + to the right)
    spring: function(p, g){
      var x = p.x || 0;
      return out('spring', p.m, [grav(p.m, g, 'block'), normalF('track', p.m * g, 90, 'block'),
        force('spring', 'spring', p.k * Math.abs(x), x > 0 ? 180 : 0, { dirWhy: 'The spring force points back toward the relaxed length: a stretched spring pulls the block back, a compressed one pushes it away.', missWhy: 'The spring is ' + (x > 0 ? 'stretched' : 'compressed') + ', so it ' + (x > 0 ? 'pulls' : 'pushes') + ' on the block.' })],
        { x: -p.k * x / p.m, y: 0 }, Math.abs(x) < 1e-9 ? 'rest' : 'accel', { ang: 0, name: 'Horizontal', pos: 'right' });
    },
    // p: rho (object density), V (m³), held (a string holds a dense object still, fully under water)
    water: function(p, g){
      var m = p.rho * p.V, W = m * g, floats = p.rho < RHO_W;
      var Fb = floats ? W : RHO_W * p.V * g;
      var fs = [grav(m, g, 'block'), force('buoy', 'water', Fb, 90, { dirWhy: 'The buoyant force always points up: the water pushes harder on the bottom of the block than on its top.', missWhy: 'The block is in water, and the water pushes up on it: the buoyant force (a sinking block has one too).' })];
      var a = { x: 0, y: 0 }, state = 'float';
      if(!floats){
        if(p.held){ fs.push(tensionF('string', W - Fb, 90, 'block')); state = 'held'; }
        else { a = { x: 0, y: -(W - Fb) / m }; state = W - Fb > 1e-9 ? 'sink' : 'rest'; }
      }
      return out('water', m, fs, a, state, { ang: 90, name: 'Vertical', pos: 'up' }, { floats: floats, sub: floats ? p.rho / RHO_W : 1, Fb: Fb });
    }
  };
  function solve(scene, p, g){ return SOLVE[scene](p, g || M.C.g); }

  /* Newton's second law along the scene's axis and the axis 90° from it, with
     numbers: each force's component, then ΣF = ma. */
  function comp(f, ang){ return f.mag * Math.cos(rad(f.ang - ang)); }
  function laws(res){
    var a0 = res.axis.ang, a1 = a0 + 90;
    // The second axis points up-ish (or right when the first is vertical).
    if(Math.sin(rad(a1)) < -1e-9 || Math.abs(Math.sin(rad(a1))) < 1e-9 && Math.cos(rad(a1)) < 0) a1 = a0 - 90;
    var tl = res.axis.tilt;
    return [a0, a1].map(function(ax, k){
      var terms = [], sum = 0;
      res.forces.forEach(function(f){
        var c = comp(f, ax), d = adiff(f.ang, ax), phi = Math.min(d, 180 - d);
        if(Math.abs(c) < 1e-9 * (1 + f.mag)) return;
        sum += c;
        // On a ramp gravity's part is mg sin θ along it and mg cos θ across;
        // elsewhere a slanted force is written with its angle from the
        // horizontal h: cos h horizontally, sin h vertically.
        var trig = '';
        if(phi > 0.01){
          if(tl && f.type === 'grav') trig = k === 0 ? ' sin θ' : ' cos θ';
          else { var h = M.round(Math.min(adiff(f.ang, 0), adiff(f.ang, 180)), 1), vert = Math.abs(Math.sin(rad(ax))) > 0.5; trig = (vert ? ' sin ' : ' cos ') + h + '°'; }
        }
        terms.push({ sym: S(f.sym) + trig, num: c });
      });
      var aax = res.a.x * Math.cos(rad(ax)) + res.a.y * Math.sin(rad(ax));
      var sym = terms.length ? terms.map(function(t, i){ return (t.num < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + t.sym; }).join('') : '0';
      var num = terms.length ? terms.map(function(t, i){ return (t.num < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + M.fixed(Math.abs(t.num), 1); }).join('') : '0';
      return { k: k, empty: !terms.length, axis: k === 0 ? res.axis.name : 'Perpendicular to that', pos: k === 0 ? res.axis.pos : dirWord(ax, tl), ang: norm(ax),
        sym: sym + ' = ma', num: num + ' N = ' + M.minus(M.fixed(sum, 1)) + ' N', sum: sum, a: aax };
    });
  }
  function dirWord(ax, tl){
    ax = norm(ax);
    if(tl) return 'away from the ramp';
    return adiff(ax, 90) < 1 ? 'up' : adiff(ax, 0) < 1 ? 'right' : adiff(ax, 180) < 1 ? 'left' : 'down';
  }

  /* -------------------------------------------------------------- grading */
  function fakeWhy(type, step){
    if(type === 'net') return 'Net force is not a force of its own: it is the sum of the forces already on the diagram. Leave it off the FBD.';
    if(type === 'centripetal') return step.scene === 'car' ? 'There is no separate centripetal force. "Centripetal" names a job, not a force: here static friction from the road points to the center and does that job.'
      : 'There is no separate centripetal force on an FBD, and nothing here moves in a circle.';
    return 'There is no "force of motion". A moving object keeps moving without a force pushing it along (Newton\'s first law); every force needs an agent.';
  }
  function noAgentWhy(type, step){
    var o = step.obj, sc = step.scene, fam = TYPES[type].fam;
    if(fam === 'normal') return sc === 'water' ? 'The water\'s upward push is the buoyant force, not a normal force: no solid surface touches the block.' : 'No surface pushes on the ' + o + ': nothing solid touches it, so there is no normal force.';
    if(fam === 'tension') return sc === 'elevator' ? 'The cable pulls on the elevator car, not on the person, so it is not on the person\'s diagram.' : 'No rope or string is attached to the ' + o + ', so there is no tension on it.';
    if(fam === 'friction') return sc === 'incline' ? 'The ramp is frictionless, so it exerts no friction.' : sc === 'spring' ? 'The track is frictionless, so there is no friction.'
      : sc === 'table' ? 'Nothing pushes the book sideways, so it has no tendency to slide: no friction.' : sc === 'water' ? 'Ignore drag here: in this problem the water exerts only the buoyant force.' : 'The ' + o + ' does not slide (or tend to slide) along a surface here, so there is no friction.';
    if(fam === 'spring') return 'No spring touches the ' + o + '.';
    if(fam === 'applied') return 'Nothing pushes on the ' + o + ' here. Every force needs an agent you can name: a hand, a rope, a surface, Earth.';
    if(fam === 'buoy') return 'Only an object in a fluid gets a buoyant force worth drawing; the air\'s is far too small to matter here.';
    return 'Earth pulls on the ' + o + ' only once.';
  }
  function lenWhy(step, a, b){
    var s = step.scene, pair = function(x, y){ return a.type === x && b.type === y || a.type === y && b.type === x; };
    if((s === 'incline' || s === 'rough') && pair('grav', 'normal')) return 'On a ramp only part of gravity presses into the surface: F<sub>N</sub> = mg cos θ, less than F<sub>g</sub> = mg.';
    if(s === 'crate' && pair('grav', 'normal')) return 'The ' + (step.forces.some(function(f){ return f.type === 'tension'; }) ? 'rope pulls partly up, so the floor holds up less than mg' : 'push points partly down, so the floor pushes back with more than mg') + '.';
    if(step.amag < 1e-9) return 'The ' + step.obj + ' ' + (step.state === 'steady' ? 'moves at constant velocity' : step.state === 'float' ? 'floats at rest' : 'is at rest') + ', so these opposite forces must balance.';
    return 'The ' + step.obj + ' accelerates ' + (step.aWords || '') + ', so these forces must not balance: the one pointing the way of the acceleration is larger.';
  }
  function the(a){ return a === 'Earth' ? 'Earth' : 'the ' + a; }
  function keyName(f, step){ return TYPES[f.type].name.toLowerCase() + ' from ' + the(f.agent); }
  /* arrows: [{ type, agent ('' = not labeled yet), rev (label reads "<obj>
     on <agent>"), ang, len (px), onObj (its tail is on the object) }] */
  function grade(arrows, step){
    var key = step.forces, res = arrows.map(function(){ return null; }), match = arrows.map(function(){ return -1; }), used = key.map(function(){ return -1; });
    var obj = step.obj;
    arrows.forEach(function(a, i){
      var T = TYPES[a.type];
      if(T.fam === 'fake') res[i] = { st: 'extra', code: 'fake-' + a.type, why: fakeWhy(a.type, step) };
      else if(a.rev) res[i] = { st: 'partner', code: 'partner', why: 'That label reads "' + obj + ' on ' + (a.agent || '…') + '": it is the force the ' + obj + ' exerts, the third-law partner. It acts on the ' + (a.agent || 'other object') + ', so it belongs on that object\'s diagram, not this one.' };
    });
    // Match each remaining arrow to a key force of the same family: same
    // agent first, then the closest direction.
    var pairs = [];
    arrows.forEach(function(a, i){
      if(res[i]) return;
      key.forEach(function(f, k){
        if(TYPES[a.type].fam !== TYPES[f.type].fam) return;
        pairs.push({ i: i, k: k, c: (a.agent && a.agent !== f.agent ? 1000 : 0) + adiff(a.ang, f.ang) });
      });
    });
    pairs.sort(function(x, y){ return x.c - y.c || x.i - y.i; });
    pairs.forEach(function(p){ if(match[p.i] < 0 && used[p.k] < 0){ match[p.i] = p.k; used[p.k] = p.i; } });
    // A real force with nothing to match: a duplicate, the wrong kind of force
    // for a force that is there, or a force with no agent.
    arrows.forEach(function(a, i){
      if(res[i] || match[i] > -1) return;
      var fam = TYPES[a.type].fam;
      if(key.some(function(f){ return TYPES[f.type].fam === fam; })){ res[i] = { st: 'extra', code: 'duplicate', why: 'There is only one ' + TYPES[a.type].name.toLowerCase() + ' from each agent here: this one is drawn twice.' }; return; }
      var k = -1;
      key.forEach(function(f, j){ if(k < 0 && used[j] < 0 && adiff(a.ang, f.ang) <= DIR_TOL && (!a.agent || a.agent === f.agent)) k = j; });
      if(k > -1){ res[i] = { st: 'extra', code: 'type', key: k, why: 'Right direction, wrong kind of force: ' + (key[k].agent === 'Earth' ? 'Earth' : 'the ' + key[k].agent) + '\'s force on the ' + obj + ' is ' + TYPES[key[k].type].name.toLowerCase() + ' (' + S(key[k].sym) + '), not ' + TYPES[a.type].name.toLowerCase() + '.' }; used[k] = i; return; }
      res[i] = { st: 'extra', code: 'no-agent', why: noAgentWhy(a.type, step) };
    });
    // Matched arrows: label, kind, direction, start point.
    arrows.forEach(function(a, i){
      var k = match[i];
      if(k < 0) return;
      var f = key[k], why = [];
      if(!a.agent) why.push({ c: 'unlabeled', t: 'Label ' + S(f.sym) + ': choose which object exerts it.' });
      else if(a.agent !== f.agent) why.push({ c: 'agent', t: 'This ' + TYPES[f.type].name.toLowerCase() + ' on the ' + obj + ' comes from ' + the(f.agent) + ', not ' + the(a.agent) + '.' });
      if(a.type !== f.type) why.push({ c: 'kind', t: f.type === 'fs' ? 'The ' + obj + ' does not slide over the ' + f.agent + ', so this friction is static (f<sub>s</sub>), not kinetic.' : 'The ' + obj + ' slides over the ' + f.agent + ', so this friction is kinetic (f<sub>k</sub>), not static.' });
      if(adiff(a.ang, f.ang) > DIR_TOL) why.push({ c: 'dir', t: f.dirWhy || 'Check the direction.' });
      if(!a.onObj) why.push({ c: 'tail', t: 'Start ' + S(f.sym) + ' on the ' + obj + ' (at its dot): a free-body diagram shows forces acting on the object, drawn from the object.' });
      res[i] = why.length ? { st: 'fix', code: why[0].c, codes: why.map(function(w){ return w.c; }), key: k, why: why.map(function(w){ return w.t; }).join(' ') } : { st: 'ok', key: k };
    });
    // Relative lengths, among matched arrows that point the right way.
    var notes = [], good = [];
    arrows.forEach(function(a, i){ if(match[i] > -1 && adiff(a.ang, key[match[i]].ang) <= DIR_TOL) good.push(i); });
    for(var x = 0; x < good.length; x++) for(var y = x + 1; y < good.length; y++){
      var i = good[x], j = good[y];
      if(key[match[i]].mag < key[match[j]].mag){ i = good[y]; j = good[x]; }
      var A = key[match[i]], B = key[match[j]], la = arrows[i].len, lb = arrows[j].len;
      // Lengths are judged where they carry the physics: forces that oppose
      // each other (balanced or not), and gravity against the normal force.
      var gn = A.type === 'grav' && B.type === 'normal' || A.type === 'normal' && B.type === 'grav';
      if(adiff(A.ang, B.ang) < 170 && !gn) continue;
      var ratio = A.mag / B.mag, msg = '';
      if(ratio >= 1.12 && la <= lb * 1.03) msg = S(A.sym) + ' should be longer than ' + S(B.sym) + ' (' + f2(A.mag) + ' N against ' + f2(B.mag) + ' N). ' + lenWhy(step, A, B);
      else if(ratio <= 1.06 && (la > lb * 1.22 || lb > la * 1.22)) msg = S(A.sym) + ' and ' + S(B.sym) + ' should be about the same length (' + f2(A.mag) + ' N and ' + f2(B.mag) + ' N). ' + (ratio > 1.0001 && gn ? 'On a ramp this shallow, cos θ is close to 1, so F<sub>N</sub> is nearly mg.' : lenWhy(step, A, B));
      if(msg) notes.push({ code: 'length', arrows: [i, j], why: msg });
    }
    notes.forEach(function(n){ n.arrows.forEach(function(i){ if(res[i].st === 'ok') res[i] = { st: 'fix', code: 'length', key: match[i], why: 'Its length does not fit the others (see below).' }; }); });
    var missing = [];
    key.forEach(function(f, k){ if(used[k] < 0) missing.push({ key: k, code: 'missing-' + TYPES[f.type].fam, why: 'Missing: the ' + keyName(f, step) + '. ' + f.missWhy }); });
    var ok = !missing.length && !notes.length && res.every(function(r){ return r.st === 'ok'; });
    return { ok: ok, arrows: res, missing: missing, notes: notes };
  }

  /* ---------------------------------------------------- "Test yourself" */
  var GW = function(g){ return 'Use g = ' + (g === 10 ? '10' : '9.8') + ' m/s².'; };
  function pickNot(r, list, bad){ var l = list.filter(function(x){ return bad.indexOf(x) < 0; }); return r.pick(l.length ? l : list); }
  function L(sym, why){ return { t: S(sym), why: why }; }
  /* Each generator returns { p, text, law: { label, opts: [correct, ...3 wrong] },
     num: { label, answer, unit, mistakes, abs }, sol: [...] }. */
  var GEN = {
    table: function(r, ctx, g){
      var m = r.pick([0.80, 1.2, 1.5, 2.0, 2.5, 3.0]), push = r() < 0.6 ? r.pick([4.0, 5.0, 6.0, 8.0, 10, 12]) : 0, W = m * g;
      var p = { m: m, push: push };
      var law = push ? [L('F_N − mg − F_A = 0', 'Right: F<sub>N</sub> up, mg and the hand\'s push down, and the book is at rest.'),
        L('F_N − mg = 0', 'The hand pushes on the book too, so its force belongs in the sum.'),
        L('F_N + F_A − mg = 0', 'The hand pushes down, the same way as gravity, so F<sub>A</sub> takes the same sign as mg.'),
        L('F_N − mg − F_A = ma, with a = g', 'The book is at rest, so a = 0. Only a falling object has a = g.')]
        : [L('F_N − mg = 0', 'Right: F<sub>N</sub> up, mg down, and the book is at rest.'),
        L('F_N + mg = 0', 'Gravity points down and F<sub>N</sub> up, so with up positive they take opposite signs.'),
        L('F_N = 0, since the book is not moving', 'At rest means the forces balance, not that there are none: the table must push up.'),
        L('F_N − mg = ma, with a = g', 'The book is at rest, so a = 0. Only a falling object has a = g.')];
      return { p: p, text: 'A ' + f2(m) + ' kg book rests on a level table.' + (push ? ' A hand presses straight down on it with a ' + f2(push) + ' N force.' : '') + ' ' + GW(g),
        law: { label: 'Take up as positive. Which equation is Newton\'s second law for the book, vertically?', opts: law },
        num: { label: 'Find the normal force the table exerts on the book.', answer: W + push, unit: 'N', mistakes: [
          { value: W, why: push ? 'That is mg alone. The hand pushes down too, so the table pushes back harder: F<sub>N</sub> = mg + F<sub>A</sub>.' : '' },
          { value: W - push, why: 'The hand pushes down, adding to the load: F<sub>N</sub> = mg + F<sub>A</sub>, not mg − F<sub>A</sub>.' },
          { value: m, why: 'That is the mass in kg. A force needs mg, in newtons.' }] },
        sol: ['Forces on the book: F<sub>g</sub> = mg = ' + f3(W) + ' N down' + (push ? ', the hand\'s ' + f2(push) + ' N down' : '') + ', and F<sub>N</sub> up from the table.',
          'At rest, so ΣF = 0 vertically: F<sub>N</sub> − mg' + (push ? ' − F<sub>A</sub>' : '') + ' = 0.',
          'F<sub>N</sub> = ' + (push ? f3(W) + ' N + ' + f2(push) + ' N = ' : '') + f3(W + push) + ' N.'] };
    },
    hang1: function(r, ctx, g){
      var m = r.pick([1.5, 2.0, 2.5, 3.0, 4.0, 5.0]), W = m * g, moving = ctx.id !== 'basic';
      if(!moving){
        return { p: { m: m, a: 0 }, text: 'A ' + f2(m) + ' kg bucket hangs at rest from a rope. ' + GW(g),
          law: { label: 'Take up as positive. Which equation is Newton\'s second law for the bucket?', opts: [
            L('F_T − mg = 0', 'Right: the rope pulls up, gravity pulls down, and the bucket is at rest.'),
            L('F_T + mg = 0', 'Tension points up and gravity down, so with up positive they take opposite signs.'),
            L('F_T = 0, since the bucket is not moving', 'At rest means the forces balance, not that there are none: the rope must pull up.'),
            L('F_T − mg = ma, with a = g', 'The bucket is at rest, so a = 0. Only a falling object has a = g.')] },
          num: { label: 'Find the tension in the rope.', answer: W, unit: 'N', mistakes: [{ value: m, why: 'That is the mass in kg. A force needs mg, in newtons.' }] },
          sol: ['Forces on the bucket: F<sub>g</sub> = mg down and F<sub>T</sub> up from the rope.', 'At rest: F<sub>T</sub> − mg = 0.', 'F<sub>T</sub> = mg = (' + f2(m) + ' kg)(' + g + ' m/s²) = ' + f3(W) + ' N.'] };
      }
      var am = r.pick([1.5, 2.0, 2.5, 3.0]), c = r.pick(['up-fast', 'up-slow', 'down-fast', 'down-slow']);
      var aUp = c === 'up-fast' || c === 'down-slow' ? am : -am, T = m * (g + aUp);
      var how = { 'up-fast': 'moves up and speeds up', 'up-slow': 'moves up and slows down', 'down-fast': 'moves down and speeds up', 'down-slow': 'moves down and slows down' }[c];
      return { p: { m: m, a: aUp }, text: 'A rope lowers or raises a ' + f2(m) + ' kg bucket. Right now the bucket ' + how + ' at ' + f2(am) + ' m/s². ' + GW(g),
        law: { label: 'Take up as positive. Which equation is Newton\'s second law for the bucket?', opts: [
          L('F_T − mg = ma', 'Right: tension up (+), gravity down (−), and the sum equals ma.'),
          L('mg − F_T = ma', 'With up positive, tension is + and gravity is −.'),
          L('F_T = ma', 'Gravity still pulls on the bucket: −mg belongs in the sum.'),
          L('F_T − mg = 0', 'The bucket\'s velocity is changing, so the forces do not balance: ΣF = ma, not 0.')] },
        num: { label: 'Find the tension in the rope.', answer: T, unit: 'N', mistakes: [
          { value: m * (g - aUp), why: 'Check the sign of a. The bucket ' + how + ', so its acceleration points ' + (aUp > 0 ? 'up: a = +' : 'down: a = −') + f2(am) + ' m/s².' },
          { value: W, why: 'That is mg. Tension equals the weight only when the acceleration is zero.' },
          { value: m * am, why: 'That is ma alone. Gravity acts too: F<sub>T</sub> = mg + ma.' }] },
        sol: ['Forces on the bucket: F<sub>g</sub> = mg = ' + f3(W) + ' N down, F<sub>T</sub> up.', 'The bucket ' + how + ', so a points ' + (aUp > 0 ? 'up' : 'down') + ': with up positive, a = ' + (aUp > 0 ? '+' : '−') + f2(am) + ' m/s².',
          'F<sub>T</sub> − mg = ma, so F<sub>T</sub> = m(g + a) = (' + f2(m) + ' kg)(' + g + ' ' + (aUp > 0 ? '+' : '−') + ' ' + f2(am) + ') m/s² = ' + f3(T) + ' N, ' + (aUp > 0 ? 'more' : 'less') + ' than mg.'] };
    },
    hang2: function(r, ctx, g){
      var m = r.pick([2.0, 3.0, 4.0, 5.0, 6.0]), angs = [25, 30, 35, 40, 45, 50, 55, 60, 65], sym = r() < 0.5;
      var al = r.pick(angs), be = sym ? al : pickNot(r, angs, [al - 10, al - 5, al, al + 5, al + 10]);
      var W = m * g, s = Math.sin(rad(al + be)), T1 = W * Math.cos(rad(be)) / s, T2 = W * Math.cos(rad(al)) / s;
      var num = sym ? { label: 'Find the tension in each rope.', answer: T1, unit: 'N', mistakes: [
        { value: W / 2, why: 'Each rope holds up half the weight only with its vertical part: F<sub>T</sub> sin θ = mg/2, so F<sub>T</sub> = mg/(2 sin θ), more than mg/2.' },
        { value: W / (2 * Math.cos(rad(al))), why: 'The vertical part of a rope\'s pull is F<sub>T</sub> sin θ (θ above the horizontal), not cos θ.' },
        { value: W / Math.sin(rad(al)), why: 'Two ropes share the load: 2F<sub>T</sub> sin θ = mg.' }] }
        : { label: 'Find the tension in the left rope.', answer: T1, unit: 'N', mistakes: [
        { value: T2, why: 'That is the right rope\'s tension. The rope at the steeper angle takes more of the load.' },
        { value: W / (2 * Math.sin(rad(al))), why: 'The ropes do not share the load equally when their angles differ: solve the horizontal and vertical equations together.' },
        { value: W * Math.sin(rad(be)) / s, why: 'Check the trig: horizontally F<sub>T1</sub> cos α = F<sub>T2</sub> cos β, so F<sub>T1</sub> = mg cos β / sin(α + β).' }] };
      return { p: { m: m, al: al, be: be }, text: 'A ' + f2(m) + ' kg sign hangs at rest from two ropes tied to the ceiling. The left rope makes α = ' + al + '° with the horizontal, the right rope β = ' + be + '°. ' + GW(g),
        law: { label: 'Take up as positive. Which equation is Newton\'s second law for the sign, vertically?', opts: [
          L('F_T1 sin α + F_T2 sin β − mg = 0', 'Right: the vertical parts of the two pulls hold up the weight.'),
          L('F_T1 cos α + F_T2 cos β − mg = 0', 'The vertical part of a pull at α above the horizontal is F sin α; cos α gives the horizontal part.'),
          L('F_T1 + F_T2 − mg = 0', 'The ropes pull at an angle, so only their vertical parts hold the sign up.'),
          L('F_T1 sin α + F_T2 sin β = 0', 'Gravity acts on the sign too: −mg belongs in the sum.')] },
        num: num,
        sol: ['Forces on the sign: F<sub>g</sub> = mg = ' + f3(W) + ' N down, F<sub>T1</sub> along the left rope, F<sub>T2</sub> along the right rope.',
          'Horizontal: F<sub>T2</sub> cos β − F<sub>T1</sub> cos α = 0. Vertical: F<sub>T1</sub> sin α + F<sub>T2</sub> sin β − mg = 0.',
          sym ? 'Same angles, so F<sub>T1</sub> = F<sub>T2</sub> = mg/(2 sin α) = ' + f3(W) + ' N / (2 sin ' + al + '°) = ' + f3(T1) + ' N.'
            : 'Solving both: F<sub>T1</sub> = mg cos β / sin(α + β) = ' + f3(W) + ' N × cos ' + be + '° / sin ' + (al + be) + '° = ' + f3(T1) + ' N (and F<sub>T2</sub> = ' + f3(T2) + ' N).'] };
    },
    incline: function(r, ctx, g){
      var m = r.pick([1.5, 2.0, 2.5, 3.0, 4.0]), th = r.pick([15, 20, 25, 30, 35, 40, 45, 50]), W = m * g, ask = r() < 0.55 ? 'a' : 'N';
      if(ctx.id === 'basic') ask = 'N';
      var p = { m: m, th: th }, text = 'A ' + f2(m) + ' kg block slides down a frictionless ramp tilted θ = ' + th + '° above the horizontal. ' + GW(g);
      if(ask === 'a') return { p: p, text: text, ask: 'a',
        law: { label: 'Take down the ramp as positive. Which equation is Newton\'s second law along the ramp?', opts: [
          L('mg sin θ = ma', 'Right: along the ramp only gravity\'s part mg sin θ acts.'),
          L('mg cos θ = ma', 'Along the ramp gravity\'s part is mg sin θ. Check with θ = 0: a level floor gives no push along it, and sin 0 = 0.'),
          L('mg sin θ − F_N = ma', 'F<sub>N</sub> is perpendicular to the ramp, so it has no part along the ramp.'),
          L('mg = ma', 'Only the part of gravity along the ramp speeds the block up; a = g is free fall.')] },
        num: { label: 'Find the acceleration of the block.', answer: g * Math.sin(rad(th)), unit: 'm/s²', abs: 0.03, mistakes: [
          { value: g * Math.cos(rad(th)), why: 'That uses cos θ. Along the ramp gravity\'s part is mg sin θ.' },
          { value: g, why: 'That is free fall. On a ramp only mg sin θ acts along the slope.' },
          { value: W * Math.sin(rad(th)), why: 'That is the force mg sin θ in newtons. Divide by m for the acceleration.' }] },
        sol: ['Forces: F<sub>g</sub> = mg down, F<sub>N</sub> perpendicular to the ramp. No friction.', 'Along the ramp: mg sin θ = ma, so a = g sin θ.', 'a = (' + g + ' m/s²)(sin ' + th + '°) = ' + f3(g * Math.sin(rad(th))) + ' m/s² down the ramp, whatever the mass.'] };
      return { p: p, text: text, ask: 'N',
        law: { label: 'Take the direction away from the ramp\'s surface as positive. Which equation is Newton\'s second law perpendicular to the ramp?', opts: [
          L('F_N − mg cos θ = 0', 'Right: the block does not move into or off the ramp, so the forces balance in that direction.'),
          L('F_N − mg = 0', 'On a ramp only part of gravity presses into the surface: mg cos θ, not mg.'),
          L('F_N − mg sin θ = 0', 'Perpendicular to the ramp gravity\'s part is mg cos θ; mg sin θ is along it.'),
          L('F_N + mg cos θ = 0', 'Gravity\'s part points into the ramp, opposite to F<sub>N</sub>: opposite signs.')] },
        num: { label: 'Find the normal force on the block.', answer: W * Math.cos(rad(th)), unit: 'N', mistakes: [
          { value: W, why: 'That is mg. On a ramp F<sub>N</sub> = mg cos θ, less than mg.' },
          { value: W * Math.sin(rad(th)), why: 'That uses sin θ. Perpendicular to the ramp gravity\'s part is mg cos θ.' }] },
        sol: ['Forces: F<sub>g</sub> = mg = ' + f3(W) + ' N down, F<sub>N</sub> perpendicular to the ramp.', 'Perpendicular to the ramp nothing accelerates: F<sub>N</sub> − mg cos θ = 0.', 'F<sub>N</sub> = ' + f3(W) + ' N × cos ' + th + '° = ' + f3(W * Math.cos(rad(th))) + ' N.'] };
    },
    rough: function(r, ctx, g){
      var m = r.pick([2.0, 3.0, 4.0, 5.0]), W = m * g, c = r.pick(['rest', 'down', 'up']), th, mus, muk;
      if(c === 'rest'){ th = r.pick([15, 20, 25, 30]); mus = M.round(Math.tan(rad(th)) + r.pick([0.10, 0.15, 0.20, 0.25]), 2); muk = M.round(mus * 0.7, 2); }
      else if(c === 'down'){ th = r.pick([30, 35, 40, 45]); muk = r.pick([0.15, 0.20, 0.25, 0.30].filter(function(u){ return u < Math.tan(rad(th)) - 0.15; })); mus = M.round(muk + 0.1, 2); }
      else { th = r.pick([15, 20, 25, 30, 35]); muk = r.pick([0.15, 0.20, 0.25, 0.30, 0.35]); mus = M.round(muk + 0.1, 2); }
      var sn = Math.sin(rad(th)), cs = Math.cos(rad(th)), p = { m: m, th: th, mus: mus, muk: muk, start: c };
      if(c === 'rest') return { p: p, ask: 'fs', text: 'A ' + f2(m) + ' kg block sits at rest on a rough ramp tilted θ = ' + th + '°. The coefficients of friction are μ<sub>s</sub> = ' + mus.toFixed(2) + ' and μ<sub>k</sub> = ' + muk.toFixed(2) + '. ' + GW(g),
        law: { label: 'Take down the ramp as positive. Which equation is Newton\'s second law along the ramp?', opts: [
          L('mg sin θ − f_s = 0', 'Right: static friction up the ramp matches gravity\'s pull down it, and the block stays put.'),
          L('mg sin θ − μ_s F_N = 0', 'μ<sub>s</sub>F<sub>N</sub> is the most static friction can give. Here it only needs to match mg sin θ.'),
          L('mg cos θ − f_s = 0', 'Along the ramp gravity\'s part is mg sin θ, not mg cos θ.'),
          L('mg sin θ + f_s = 0', 'Friction points up the ramp, against the tendency to slide down: it takes the opposite sign.')] },
        num: { label: 'Find the size of the static friction force on the block.', answer: W * sn, unit: 'N', mistakes: [
          { value: mus * W * cs, why: 'That is μ<sub>s</sub>F<sub>N</sub>, the most static friction can give. At rest it only matches mg sin θ.' },
          { value: W * cs, why: 'That uses cos θ. Along the ramp gravity\'s part is mg sin θ.' },
          { value: mus * W, why: 'That is μ<sub>s</sub>mg. Static friction here just balances mg sin θ.' }] },
        sol: ['Forces: F<sub>g</sub> down, F<sub>N</sub> perpendicular to the ramp, f<sub>s</sub> up the ramp (without it the block would slide down).', 'At rest: mg sin θ − f<sub>s</sub> = 0.', 'f<sub>s</sub> = mg sin θ = ' + f3(W) + ' N × sin ' + th + '° = ' + f3(W * sn) + ' N. That is less than μ<sub>s</sub>F<sub>N</sub> = ' + f3(mus * W * cs) + ' N, so the block can stay put.'] };
      if(c === 'down') return { p: p, ask: 'a', text: 'A ' + f2(m) + ' kg block slides down a rough ramp tilted θ = ' + th + '°. The coefficient of kinetic friction is μ<sub>k</sub> = ' + muk.toFixed(2) + '. ' + GW(g),
        law: { label: 'Take down the ramp as positive. Which equation is Newton\'s second law along the ramp?', opts: [
          L('mg sin θ − μ_k mg cos θ = ma', 'Right: gravity\'s part down the ramp, minus kinetic friction μ<sub>k</sub>F<sub>N</sub> up the ramp.'),
          L('mg sin θ + μ_k mg cos θ = ma', 'Friction opposes the sliding, which is down the ramp: friction points up the ramp and subtracts.'),
          L('mg sin θ − μ_k mg = ma', 'On a ramp F<sub>N</sub> = mg cos θ, not mg.'),
          L('mg cos θ − μ_k mg sin θ = ma', 'The sine and cosine are swapped: along the ramp gravity\'s part is mg sin θ, and F<sub>N</sub> = mg cos θ.')] },
        num: { label: 'Find the acceleration of the block.', answer: g * (sn - muk * cs), unit: 'm/s²', abs: 0.03, mistakes: [
          { value: g * (sn + muk * cs), why: 'Friction points up the ramp while the block slides down, so it subtracts: a = g(sin θ − μ<sub>k</sub> cos θ).' },
          { value: g * (sn - muk), why: 'Kinetic friction is μ<sub>k</sub>F<sub>N</sub> with F<sub>N</sub> = mg cos θ, not mg.' },
          { value: g * sn, why: 'That leaves out friction. The ramp is rough: subtract μ<sub>k</sub>g cos θ.' }] },
        sol: ['Forces: F<sub>g</sub> down, F<sub>N</sub> = mg cos θ perpendicular to the ramp, f<sub>k</sub> = μ<sub>k</sub>F<sub>N</sub> up the ramp (against the sliding).', 'Along the ramp: mg sin θ − μ<sub>k</sub>mg cos θ = ma, so a = g(sin θ − μ<sub>k</sub> cos θ).', 'a = (' + g + ' m/s²)(sin ' + th + '° − ' + muk.toFixed(2) + ' × cos ' + th + '°) = ' + f3(g * (sn - muk * cs)) + ' m/s² down the ramp.'] };
      return { p: p, ask: 'a', text: 'A ' + f2(m) + ' kg block was given a shove and is sliding up a rough ramp tilted θ = ' + th + '°. The coefficient of kinetic friction is μ<sub>k</sub> = ' + muk.toFixed(2) + '. ' + GW(g),
        law: { label: 'Take down the ramp as positive. Which equation is Newton\'s second law along the ramp while the block slides up?', opts: [
          L('mg sin θ + μ_k mg cos θ = ma', 'Right: sliding up, friction points down the ramp, the same way as gravity\'s part.'),
          L('mg sin θ − μ_k mg cos θ = ma', 'While the block slides up, friction opposes that motion: it points down the ramp and adds to mg sin θ.'),
          L('μ_k mg cos θ = ma', 'Gravity\'s part along the ramp slows the block too: add mg sin θ.'),
          L('mg sin θ + μ_k mg = ma', 'On a ramp F<sub>N</sub> = mg cos θ, not mg.')] },
        num: { label: 'Find the size of the block\'s acceleration while it slides up.', answer: g * (sn + muk * cs), unit: 'm/s²', abs: 0.03, mistakes: [
          { value: Math.abs(g * (sn - muk * cs)), why: 'Sliding up, friction points down the ramp, the same way as gravity\'s part: they add.' },
          { value: g * sn, why: 'That leaves out friction, which also slows the block.' },
          { value: g * (sn + muk), why: 'Kinetic friction is μ<sub>k</sub>mg cos θ on a ramp, not μ<sub>k</sub>mg.' }] },
        sol: ['Forces: F<sub>g</sub> down, F<sub>N</sub> perpendicular to the ramp, f<sub>k</sub> down the ramp (against the sliding, which is up).', 'Down the ramp positive: mg sin θ + μ<sub>k</sub>mg cos θ = ma.', 'a = (' + g + ' m/s²)(sin ' + th + '° + ' + muk.toFixed(2) + ' × cos ' + th + '°) = ' + f3(g * (sn + muk * cs)) + ' m/s², pointing down the ramp: the block slows down.'] };
    },
    crate: function(r, ctx, g){
      var m = r.pick([10, 15, 20, 25, 30, 40]), phi = r.pick([15, 20, 25, 30, 35, 40]), muk = r.pick([0.20, 0.25, 0.30, 0.35, 0.40]), mus = M.round(muk + 0.1, 2);
      var pull = r() < 0.55, W = m * g, sn = Math.sin(rad(phi)), cs = Math.cos(rad(phi));
      var thr = mus * W / (pull ? cs + mus * sn : cs - mus * sn), moving = r() < 0.7;
      var F = M.sig(thr * (moving ? r.between(1.3, 1.9, 3) : r.between(0.45, 0.8, 3)), 2);
      var N = pull ? W - F * sn : W + F * sn, Fx = F * cs, ask = moving ? (r() < 0.6 ? 'a' : 'N') : 'fs', who = pull ? 'A rope pulls' : 'A worker pushes';
      var p = { m: m, F: F, phi: phi, mode: pull ? 'pull' : 'push', mus: mus, muk: muk };
      var text = who + ' a ' + f2(m) + ' kg crate across a level floor with a ' + f2(F) + ' N force directed φ = ' + phi + '° ' + (pull ? 'above' : 'below') + ' the horizontal. ' +
        'μ<sub>s</sub> = ' + mus.toFixed(2) + ', μ<sub>k</sub> = ' + muk.toFixed(2) + '. ' + (moving ? 'The crate slides forward.' : 'The crate does not move.') + ' ' + GW(g);
      var sg = pull ? '−' : '+', Nsym = '(mg ' + sg + ' F sin φ)', base = ['Forces on the crate: F<sub>g</sub> = ' + f3(W) + ' N down, F<sub>N</sub> up, ' + (pull ? 'F<sub>T</sub> along the rope' : 'F<sub>A</sub> along the push') + ', friction backward.',
        'Vertical: F<sub>N</sub> ' + (pull ? '+' : '−') + ' F sin φ − mg = 0, so F<sub>N</sub> = mg ' + sg + ' F sin φ = ' + f3(N) + ' N.'];
      if(ask === 'fs') return { p: p, text: text, ask: 'fs',
        law: { label: 'Take forward as positive. Which equation is Newton\'s second law for the crate, horizontally?', opts: [
          L('F cos φ − f_s = 0', 'Right: the crate stays put, so static friction exactly matches the forward part of the ' + (pull ? 'pull' : 'push') + '.'),
          L('F cos φ − μ_s F_N = 0', 'μ<sub>s</sub>F<sub>N</sub> is the limit. At rest static friction only matches the forward part of the force.'),
          L('F − f_s = 0', 'Only the horizontal part F cos φ pushes the crate along the floor.'),
          L('F cos φ + f_s = 0', 'Static friction points backward, against the tendency to slide: opposite sign.')] },
        num: { label: 'Find the size of the static friction force on the crate.', answer: Fx, unit: 'N', mistakes: [
          { value: mus * N, why: 'That is μ<sub>s</sub>F<sub>N</sub>, the most static friction can give. Here it only matches F cos φ.' },
          { value: F, why: 'Only the horizontal part, F cos φ, tends to slide the crate.' },
          { value: mus * W, why: 'That is μ<sub>s</sub>mg, a limit, and with the wrong normal force. At rest f<sub>s</sub> = F cos φ.' }] },
        sol: base.concat(['The crate does not move, so horizontally F cos φ − f<sub>s</sub> = 0: f<sub>s</sub> = ' + f2(F) + ' N × cos ' + phi + '° = ' + f3(Fx) + ' N (less than μ<sub>s</sub>F<sub>N</sub> = ' + f3(mus * N) + ' N).']) };
      if(ask === 'N') return { p: p, text: text, ask: 'N',
        law: { label: 'Take up as positive. Which equation is Newton\'s second law for the crate, vertically?', opts: [
          L(pull ? 'F_N + F sin φ − mg = 0' : 'F_N − F sin φ − mg = 0', 'Right: the crate does not rise or sink, and the ' + (pull ? 'rope\'s pull has an upward part' : 'push has a downward part') + '.'),
          L('F_N − mg = 0', 'The ' + (pull ? 'rope pulls partly up, lifting some of the weight' : 'push points partly down, pressing the crate into the floor') + ', so F<sub>N</sub> is not mg.'),
          L(pull ? 'F_N − F sin φ − mg = 0' : 'F_N + F sin φ − mg = 0', 'The ' + (pull ? 'rope pulls up' : 'push points down') + ', so check the sign of F sin φ.'),
          L(pull ? 'F_N + F cos φ − mg = 0' : 'F_N − F cos φ − mg = 0', 'The vertical part of a force at φ from the horizontal is F sin φ.')] },
        num: { label: 'Find the normal force on the crate.', answer: N, unit: 'N', mistakes: [
          { value: W, why: 'That is mg. The ' + (pull ? 'rope lifts part of the crate' : 'push presses it down') + ', so F<sub>N</sub> = mg ' + sg + ' F sin φ.' },
          { value: pull ? W + F * sn : W - F * sn, why: 'The ' + (pull ? 'rope pulls up' : 'push points down') + ': F<sub>N</sub> = mg ' + sg + ' F sin φ.' },
          { value: pull ? W - F * cs : W + F * cs, why: 'The vertical part of the force is F sin φ, not F cos φ.' }] },
        sol: base };
      var a = (Fx - muk * N) / m;
      return { p: p, text: text, ask: 'a',
        law: { label: 'Take forward as positive. Which equation is Newton\'s second law for the crate, horizontally?', opts: [
          L('F cos φ − μ_k' + Nsym + ' = ma', 'Right: the forward part of the force minus kinetic friction μ<sub>k</sub>F<sub>N</sub>, with F<sub>N</sub> = mg ' + sg + ' F sin φ.'),
          L('F cos φ − μ_k mg = ma', 'The ' + (pull ? 'rope\'s upward part lifts some of the weight' : 'push presses the crate down') + ': F<sub>N</sub> = mg ' + sg + ' F sin φ, not mg.'),
          L('F − μ_k' + Nsym + ' = ma', 'Only the horizontal part F cos φ moves the crate along the floor.'),
          L('F cos φ + μ_k' + Nsym + ' = ma', 'Kinetic friction opposes the sliding, so it points backward and subtracts.')] },
        num: { label: 'Find the acceleration of the crate.', answer: a, unit: 'm/s²', abs: 0.03, mistakes: [
          { value: (Fx - muk * W) / m, why: 'That uses F<sub>N</sub> = mg. With the force at an angle, F<sub>N</sub> = mg ' + sg + ' F sin φ.' },
          { value: (F - muk * N) / m, why: 'Only F cos φ pulls the crate forward.' },
          { value: Fx / m, why: 'That leaves out kinetic friction, μ<sub>k</sub>F<sub>N</sub> backward.' }] },
        sol: base.concat(['Friction: f<sub>k</sub> = μ<sub>k</sub>F<sub>N</sub> = ' + muk.toFixed(2) + ' × ' + f3(N) + ' N = ' + f3(muk * N) + ' N, backward.', 'Horizontal: F cos φ − f<sub>k</sub> = ma, so a = (' + f3(Fx) + ' N − ' + f3(muk * N) + ' N) / ' + f2(m) + ' kg = ' + f3(a) + ' m/s².']) };
    },
    elevator: function(r, ctx, g){
      var m = r.pick([45, 50, 55, 60, 65, 70, 80]), W = m * g, c = r.pick(['up-fast', 'up-slow', 'down-fast', 'down-slow', 'steady']);
      var am = c === 'steady' ? 0 : r.pick([1.5, 2.0, 2.5, 3.0]), aUp = c === 'up-fast' || c === 'down-slow' ? am : -am;
      var how = { 'up-fast': 'moving up and speeding up at ' + f2(am) + ' m/s²', 'up-slow': 'moving up and slowing down at ' + f2(am) + ' m/s²', 'down-fast': 'moving down and speeding up at ' + f2(am) + ' m/s²', 'down-slow': 'moving down and slowing down at ' + f2(am) + ' m/s²', steady: 'moving ' + r.pick(['up', 'down']) + ' at a constant 2.0 m/s' }[c];
      var N = m * (g + aUp), p = { m: m, a: aUp, v: c === 'steady' ? 'up' : c.split('-')[0] };
      return { p: p, text: 'A ' + f2(m) + ' kg student stands on the floor of an elevator that is ' + how + '. ' + GW(g),
        law: { label: 'Take up as positive. Which equation is Newton\'s second law for the student?', opts: c === 'steady' ? [
          L('F_N − mg = 0', 'Right: constant velocity means zero acceleration, so the forces balance even while moving.'),
          L('F_N + mg = 0', 'With up positive, F<sub>N</sub> is + and gravity is −.'),
          L('F_N − mg − F_cable = 0', 'The cable pulls on the elevator, not on the student. Only forces on the student go in the sum.'),
          L('F_N − mg = F_motion', 'No force is needed to keep moving at constant velocity, and there is no "force of motion".')] : [
          L('F_N − mg = ma', 'Right: F<sub>N</sub> up (+), gravity down (−), and the sum equals ma.'),
          L('mg − F_N = ma', 'With up positive, F<sub>N</sub> is + and gravity is −.'),
          L('F_N = ma', 'Gravity still pulls on the student: −mg belongs in the sum.'),
          L('F_N − mg = 0', 'The elevator accelerates, so the forces on the student do not balance.')] },
        num: { label: 'Find the normal force the floor exerts on the student (the scale reading).', answer: N, unit: 'N', mistakes: c === 'steady' ? [{ value: m, why: 'That is the mass in kg. A force needs mg, in newtons.' }, { value: m * (g + 2), why: 'Speed does not change the reading: at constant velocity a = 0, so F<sub>N</sub> = mg.' }] : [
          { value: m * (g - aUp), why: 'Check the sign of a. The elevator is ' + how.replace(/ at .*/, '') + ', so a points ' + (aUp > 0 ? 'up' : 'down') + '.' },
          { value: W, why: 'That is mg. The scale reads mg only when the acceleration is zero.' },
          { value: m * am, why: 'That is ma alone. F<sub>N</sub> = m(g + a).' }] },
        sol: ['Forces on the student: F<sub>g</sub> = mg = ' + f3(W) + ' N down and F<sub>N</sub> up from the floor. (The cable pulls on the elevator, not on the student.)',
          c === 'steady' ? 'Constant velocity: a = 0, so F<sub>N</sub> − mg = 0.' : 'The elevator is ' + how.replace(/ at .*/, '') + ', so a points ' + (aUp > 0 ? 'up: a = +' : 'down: a = −') + f2(am) + ' m/s².',
          'F<sub>N</sub> = m(g + a) = ' + f3(N) + ' N, ' + (aUp > 0 ? 'more than mg: the student feels heavier.' : aUp < 0 ? 'less than mg: the student feels lighter.' : 'equal to mg.')] };
    },
    atwood: function(r, ctx, g){
      var a1 = r.pick([1.0, 1.5, 2.0, 2.5, 3.0, 4.0]), a2 = M.round(a1 * r.pick([1.5, 2, 2.5, 3]), 2), sw = r() < 0.5;
      var m1 = sw ? a2 : a1, m2 = sw ? a1 : a2, which = r() < 0.5 ? 1 : 2, mine = which === 1 ? m1 : m2, other = which === 1 ? m2 : m1;
      var heavy = mine > other, am = Math.abs(m2 - m1) * g / (m1 + m2), T = 2 * m1 * m2 * g / (m1 + m2), ask = r() < 0.5 ? 'a' : 'T';
      var mn = 'm_' + which, on = 'm_' + (3 - which);
      return { p: { m1: m1, m2: m2, which: which }, ask: ask,
        text: 'Two blocks hang from a light rope over an ideal pulley: m<sub>1</sub> = ' + f2(m1) + ' kg on the left and m<sub>2</sub> = ' + f2(m2) + ' kg on the right. They are released from rest. Draw the forces on block ' + which + ' (the ' + (which === 1 ? 'left' : 'right') + ' block). ' + GW(g),
        law: { label: 'Take the direction block ' + which + ' accelerates (' + (heavy ? 'down' : 'up') + ') as positive. Which equation is Newton\'s second law for block ' + which + '?', opts: heavy ? [
          L(mn + 'g − F_T = ' + mn + 'a', 'Right: its weight wins over the rope\'s pull, and the difference gives it its acceleration.'),
          L('F_T − ' + mn + 'g = ' + mn + 'a', 'Down is positive here, so gravity is + and the rope\'s upward pull is −.'),
          L(mn + 'g − ' + on + 'g = ' + mn + 'a', 'The other block\'s weight acts on the other block. On this block, the rope pulls with F<sub>T</sub>.'),
          L(mn + 'g = ' + mn + 'a', 'The rope pulls up on this block too: −F<sub>T</sub> belongs in the sum.')] : [
          L('F_T − ' + mn + 'g = ' + mn + 'a', 'Right: the rope\'s pull wins over its weight, and the difference gives it its acceleration.'),
          L(mn + 'g − F_T = ' + mn + 'a', 'Up is positive here, so the rope\'s pull is + and gravity is −.'),
          L(on + 'g − ' + mn + 'g = ' + mn + 'a', 'The other block\'s weight acts on the other block. On this block, the rope pulls with F<sub>T</sub>.'),
          L('F_T = ' + mn + 'a', 'Gravity pulls on this block too: −' + S(mn) + 'g belongs in the sum.')] },
        num: ask === 'a' ? { label: 'Find the size of the blocks\' acceleration.', answer: am, unit: 'm/s²', abs: 0.03, mistakes: [
          { value: Math.abs(m2 - m1) * g / Math.max(m1, m2), why: 'The difference in weight accelerates both blocks, so divide by the total mass m<sub>1</sub> + m<sub>2</sub>.' },
          { value: Math.abs(m2 - m1) * g / Math.min(m1, m2), why: 'Both blocks speed up together: divide by m<sub>1</sub> + m<sub>2</sub>.' },
          { value: g, why: 'Neither block falls freely: the rope holds each back.' }] }
          : { label: 'Find the tension in the rope.', answer: T, unit: 'N', mistakes: [
          { value: mine * g, why: 'That is this block\'s weight. The block accelerates, so F<sub>T</sub> is ' + (heavy ? 'less' : 'more') + ' than its weight.' },
          { value: other * g, why: 'That is the other block\'s weight. The rope pulls with less than the heavier weight and more than the lighter one.' },
          { value: (m1 + m2) * g / 2, why: 'Not the average weight: solve for a first, then F<sub>T</sub> = m(g ± a) for one block.' }] },
        sol: ['Forces on block ' + which + ': F<sub>g</sub> = ' + S(mn) + 'g = ' + f3(mine * g) + ' N down and F<sub>T</sub> up from the rope (an ideal rope pulls both blocks with the same F<sub>T</sub>).',
          'The heavier block goes down. For the two blocks together: a = (m<sub>heavy</sub> − m<sub>light</sub>)g / (m<sub>1</sub> + m<sub>2</sub>) = ' + f3(am) + ' m/s².',
          'Block ' + which + ': ' + (heavy ? S(mn) + 'g − F<sub>T</sub> = ' + S(mn) + 'a, so F<sub>T</sub> = ' + S(mn) + '(g − a)' : 'F<sub>T</sub> − ' + S(mn) + 'g = ' + S(mn) + 'a, so F<sub>T</sub> = ' + S(mn) + '(g + a)') + ' = ' + f3(T) + ' N.'] };
    },
    car: function(r, ctx, g){
      var m = r.pick([900, 1000, 1200, 1400, 1500, 1800]), rr = r.pick([30, 40, 50, 60, 80, 100, 120]), mus = r.pick([0.50, 0.60, 0.70, 0.80, 0.90]);
      var vmax = Math.sqrt(mus * g * rr), ask = r() < 0.6 ? 'fs' : 'v', v = ask === 'fs' ? M.sig(vmax * r.between(0.45, 0.85, 3), 2) : vmax;
      var W = m * g, p = { m: m, v: ask === 'fs' ? v : vmax, r: rr, mus: mus };
      var text = 'A ' + f2(m) + ' kg car drives around a flat (unbanked) curve of radius ' + f2(rr) + ' m' + (ask === 'fs' ? ' at a steady ' + f2(v) + ' m/s' : '') + '. The coefficient of static friction between tires and road is μ<sub>s</sub> = ' + mus.toFixed(2) + '.' + (ask === 'v' ? ' The car goes as fast as it can without skidding.' : '') + ' ' + GW(g);
      if(ask === 'fs') return { p: p, ask: 'fs', text: text,
        law: { label: 'Take toward the center of the curve as positive. Which equation is Newton\'s second law for the car in that direction?', opts: [
          L('f_s = mv²/r', 'Right: friction is the only force toward the center, and it gives the centripetal acceleration v²/r.'),
          L('f_s − F_c = mv²/r', 'There is no separate centripetal force: friction is the force that points to the center.'),
          L('F_N − mg = mv²/r', 'Those forces are vertical. They balance; the center of the curve is sideways.'),
          L('f_s = μ_s mg, whatever the speed', 'Static friction is only as large as needed (here mv²/r), up to its limit μ<sub>s</sub>mg.')] },
        num: { label: 'Find the static friction force on the car.', answer: m * v * v / rr, unit: 'N', mistakes: [
          { value: mus * W, why: 'That is μ<sub>s</sub>mg, the most friction the road can give. The car only needs mv²/r.' },
          { value: v * v / rr, why: 'That is v²/r, an acceleration. Multiply by m for the force.' },
          { value: m * v / rr, why: 'The centripetal acceleration is v²/r: square the speed.' }] },
        sol: ['Forces on the car: F<sub>g</sub> down, F<sub>N</sub> up (they balance), and static friction from the road toward the center.', 'Toward the center: f<sub>s</sub> = mv²/r.', 'f<sub>s</sub> = (' + f2(m) + ' kg)(' + f2(v) + ' m/s)² / ' + f2(rr) + ' m = ' + f3(m * v * v / rr) + ' N, below the limit μ<sub>s</sub>mg = ' + f3(mus * W) + ' N.'] };
      return { p: p, ask: 'v', text: text,
        law: { label: 'Take toward the center as positive. At the fastest speed, which equation is Newton\'s second law for the car in that direction?', opts: [
          L('μ_s mg = mv²/r', 'Right: at the limit, static friction is at its maximum μ<sub>s</sub>F<sub>N</sub> = μ<sub>s</sub>mg, and it supplies mv²/r.'),
          L('μ_s mg + F_c = mv²/r', 'There is no separate centripetal force: friction is the force toward the center.'),
          L('mg = mv²/r', 'Gravity is vertical: on a flat curve it has no part toward the center.'),
          L('μ_k mg = mv²/r', 'The tires roll without slipping, so the friction is static, not kinetic.')] },
        num: { label: 'Find the fastest speed for this curve.', answer: vmax, unit: 'm/s', mistakes: [
          { value: Math.sqrt(g * rr), why: 'That leaves out μ<sub>s</sub>: v = √(μ<sub>s</sub>gr).' },
          { value: mus * g * rr / 2, why: 'Solve μ<sub>s</sub>mg = mv²/r for v: v = √(μ<sub>s</sub>gr).' }] },
        sol: ['Forces on the car: F<sub>g</sub> down, F<sub>N</sub> = mg up, static friction toward the center.', 'At the fastest speed friction is at its limit: μ<sub>s</sub>mg = mv²/r. The mass cancels.', 'v = √(μ<sub>s</sub>gr) = √(' + mus.toFixed(2) + ' × ' + g + ' × ' + f2(rr) + ') = ' + f3(vmax) + ' m/s.'] };
    },
    spring: function(r, ctx, g){
      var m = r.pick([0.50, 0.80, 1.0, 1.2, 1.5, 2.0]), k = r.pick([40, 60, 80, 100, 120, 150, 200]), d = r.pick([0.05, 0.08, 0.10, 0.12, 0.15, 0.20]), st = r() < 0.6, x = st ? d : -d;
      var ask = r() < 0.6 ? 'a' : 'F', p = { m: m, k: k, x: x };
      var text = 'A ' + f2(m) + ' kg block on a frictionless track is attached to a spring (k = ' + k + ' N/m) fixed to a wall on its left. The block is ' + (st ? 'pulled ' + f2(d) + ' m to the right, stretching' : 'pushed ' + f2(d) + ' m to the left, compressing') + ' the spring, and released. ' + GW(g);
      return { p: p, ask: ask, text: text,
        law: { label: 'Take right as positive, with x the block\'s displacement from the spring\'s relaxed length (x = ' + (st ? '+' : '−') + f2(d) + ' m). Which equation is Newton\'s second law along the track, just after release?', opts: [
          L('−kx = ma', 'Right: the spring force is −kx, back toward the relaxed length, and it is the only horizontal force.'),
          L('kx = ma', 'The spring force points opposite the displacement, back toward the relaxed length: F<sub>s</sub> = −kx.'),
          L('−kx + F_N = ma', 'F<sub>N</sub> is vertical, so it has no part along the track.'),
          L('−kx − mg = ma', 'Gravity is vertical; it is balanced by F<sub>N</sub> and has no part along the track.')] },
        num: ask === 'a' ? { label: 'Find the size of the block\'s acceleration just after release.', answer: k * d / m, unit: 'm/s²', abs: 0.03, mistakes: [
          { value: k * d, why: 'That is the spring force kx in newtons. Divide by m.' },
          { value: k * d * m, why: 'Divide by the mass: a = kx/m.' }] }
          : { label: 'Find the size of the spring force on the block just after release.', answer: k * d, unit: 'N', mistakes: [
          { value: 0.5 * k * d * d, why: 'That is ½kx², the spring\'s energy in joules. The force is kx.' },
          { value: k * d / m, why: 'That is kx/m, an acceleration. The force is kx.' }] },
        sol: ['Forces on the block: F<sub>g</sub> down, F<sub>N</sub> up from the track (they balance), and the spring force ' + (st ? 'to the left (the stretched spring pulls back)' : 'to the right (the compressed spring pushes back)') + '. No friction.',
          'Along the track: −kx = ma. Size of the spring force: kx = ' + k + ' N/m × ' + f2(d) + ' m = ' + f3(k * d) + ' N.',
          'a = kx/m = ' + f3(k * d) + ' N / ' + f2(m) + ' kg = ' + f3(k * d / m) + ' m/s², pointing ' + (st ? 'left' : 'right') + ', toward the relaxed length.'] };
    },
    water: function(r, ctx, g){
      var VL = r.pick([0.50, 0.80, 1.0, 1.2, 1.5, 2.0]), V = VL / 1000, c = r.pick(['float', 'sink', 'held']);
      var rho = c === 'float' ? r.pick([300, 400, 500, 600, 700, 800]) : r.pick([1500, 2000, 2500, 2700, 3000]);
      var m = rho * V, W = m * g, Fw = RHO_W * V * g, p = { rho: rho, V: V, held: c === 'held' };
      var what = c === 'float' ? 'wooden block' : 'stone block';
      var text = 'A ' + f2(VL) + ' L ' + what + ' (density ' + rho + ' kg/m³, so its mass is ' + f3(m) + ' kg) ' + (c === 'float' ? 'floats at rest in water' : c === 'held' ? 'hangs at rest from a string, completely under water' : 'is let go under water and sinks; ignore drag') + '. Water\'s density is 1000 kg/m³, and 1 L = 0.001 m³. ' + GW(g);
      if(c === 'float') return { p: p, ask: 'Fb', text: text,
        law: { label: 'Take up as positive. Which equation is Newton\'s second law for the block?', opts: [
          L('F_b − mg = 0', 'Right: the block floats at rest, so the water\'s push balances its weight.'),
          L('F_b + mg = 0', 'The buoyant force points up and gravity down, so they take opposite signs.'),
          L('F_b = 0, since the block floats', 'Floating means the forces balance, not that there are none: the water pushes up.'),
          L('F_b − mg = ma, with a = g', 'The block is at rest, so a = 0. Only a falling object has a = g.')] },
        num: { label: 'Find the buoyant force on the block.', answer: W, unit: 'N', mistakes: [
          { value: Fw, why: 'That is ρ<sub>water</sub>Vg for the whole block. A floating block is only partly under water: F<sub>b</sub> = mg.' },
          { value: m, why: 'That is the mass in kg. A force needs mg, in newtons.' }] },
        sol: ['Forces on the block: F<sub>g</sub> = mg down and F<sub>b</sub> up from the water.', 'At rest: F<sub>b</sub> − mg = 0, so F<sub>b</sub> = mg = ' + f3(m) + ' kg × ' + g + ' m/s² = ' + f3(W) + ' N.', 'That is the weight of the water the submerged part displaces: ' + Math.round(rho / 10) + '% of the block is under water.'] };
      if(c === 'held') return { p: p, ask: 'T', text: text,
        law: { label: 'Take up as positive. Which equation is Newton\'s second law for the block?', opts: [
          L('F_T + F_b − mg = 0', 'Right: the string pulls up and the water pushes up; together they balance the weight.'),
          L('F_T − mg = 0', 'The water pushes up on the block too: add F<sub>b</sub>.'),
          L('F_T − F_b − mg = 0', 'The buoyant force points up, the same way as the string\'s pull.'),
          L('F_T + F_b + mg = 0', 'Gravity points down, opposite to F<sub>T</sub> and F<sub>b</sub>.')] },
        num: { label: 'Find the tension in the string.', answer: W - Fw, unit: 'N', mistakes: [
          { value: W, why: 'That is the block\'s weight. The water holds up part of it: F<sub>T</sub> = mg − F<sub>b</sub>.' },
          { value: Fw, why: 'That is the buoyant force, ρ<sub>water</sub>Vg. F<sub>T</sub> = mg − F<sub>b</sub>.' },
          { value: W + Fw, why: 'The buoyant force points up, helping the string: subtract it.' }] },
        sol: ['Forces on the block: F<sub>g</sub> = mg = ' + f3(W) + ' N down, F<sub>b</sub> up, F<sub>T</sub> up.', 'Fully under water: F<sub>b</sub> = ρ<sub>water</sub>Vg = 1000 × ' + M.fmt(V, 2) + ' × ' + g + ' = ' + f3(Fw) + ' N.', 'F<sub>T</sub> + F<sub>b</sub> − mg = 0, so F<sub>T</sub> = ' + f3(W) + ' N − ' + f3(Fw) + ' N = ' + f3(W - Fw) + ' N.'] };
      return { p: p, ask: 'a', text: text,
        law: { label: 'Take down as positive. Which equation is Newton\'s second law for the block?', opts: [
          L('mg − F_b = ma', 'Right: gravity down (+), the buoyant force up (−).'),
          L('mg = ma', 'The water pushes up on the block the whole time it is under water: subtract F<sub>b</sub>.'),
          L('mg + F_b = ma', 'The buoyant force points up, against gravity: with down positive it is −F<sub>b</sub>.'),
          L('F_b − mg = 0', 'The block sinks faster and faster: the forces do not balance.')] },
        num: { label: 'Find the block\'s acceleration just after it is let go.', answer: (W - Fw) / m, unit: 'm/s²', abs: 0.03, mistakes: [
          { value: g, why: 'That is free fall. The buoyant force makes the block speed up less.' },
          { value: Fw / m, why: 'That is F<sub>b</sub>/m. The net force is mg − F<sub>b</sub>.' },
          { value: (W + Fw) / m, why: 'The buoyant force points up: subtract it.' }] },
        sol: ['Forces on the block: F<sub>g</sub> = mg = ' + f3(W) + ' N down and F<sub>b</sub> up. (Drag ignored.)', 'Fully under water: F<sub>b</sub> = ρ<sub>water</sub>Vg = ' + f3(Fw) + ' N.', 'mg − F<sub>b</sub> = ma, so a = (' + f3(W) + ' − ' + f3(Fw) + ') N / ' + f3(m) + ' kg = ' + f3((W - Fw) / m) + ' m/s² down.'] };
    }
  };

  function aWords(res){
    if(res.amag < 1e-9) return '';
    var a = Math.atan2(res.a.y, res.a.x) * 180 / Math.PI;
    if(res.scene === 'incline' || res.scene === 'rough') return adiff(a, -res.axis.tilt) < 5 ? 'down the ramp' : 'up the ramp';
    if(res.scene === 'car') return 'toward the center';
    if(adiff(a, 90) < 5) return 'upward'; if(adiff(a, 270) < 5) return 'downward';
    return adiff(a, 0) < 5 ? 'to the right' : 'to the left';
  }
  /* Label choices for the drawing step: every agent "on" the object, then
     the reversed (third-law partner) labels. */
  function labelsOf(scene){
    var s = SCENES[scene];
    return s.agents.map(function(a){ return { agent: a, rev: false, text: a + ' on ' + s.obj }; })
      .concat(s.agents.map(function(a){ return { agent: a, rev: true, text: s.obj + ' on ' + a }; }));
  }

  function generate(r, ctx, type){
    var list = (ctx.scenes || []).filter(function(s){ return GEN[s]; });
    var sc = type && list.indexOf(type) > -1 ? type : r.pick(list);
    var g = M.g(ctx), G = GEN[sc](r, ctx, g), res = solve(sc, G.p, g);
    var o = SCENES[sc].obj, opts = G.law.opts;
    var nm = G.num, cell = M.cell(nm.answer, 0.015, nm.mistakes.filter(function(x){ return x.why; }), nm.abs);
    var steps = [
      { key: 'fbd', kind: 'fbd', practice: '1.A', label: 'Draw the free-body diagram of the ' + (sc === 'atwood' ? 'block ' + G.p.which : o) + ': add each force from the palette, aim it and size it, and label who exerts it.',
        scene: sc, obj: o, forces: res.forces, labels: labelsOf(sc), amag: res.amag, aWords: aWords(res), state: res.state },
      { key: 'law', kind: 'choice', practice: '2.A', label: G.law.label, options: opts.map(function(x){ return x.t; }), correct: 0, why: opts.map(function(x){ return x.why; }) },
      { key: 'solve', kind: 'num', practice: '2.B', label: nm.label, cell: cell, unit: nm.unit }
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: sc, scene: sc, params: G.p, ask: G.ask || 'x', g: g, text: G.text, steps: steps, solution: G.sol, res: res };
  }

  M.register('freeBodyDiagrams', {
    TYPES: TYPES, PALETTE: PALETTE, SCENES: SCENES, ORDER: ORDER, RHO_W: RHO_W, DIR_TOL: DIR_TOL,
    solve: solve, laws: laws, grade: grade, generate: generate, labelsOf: labelsOf, aWords: aWords,
    norm: norm, adiff: adiff, sub: S
  });
})();
