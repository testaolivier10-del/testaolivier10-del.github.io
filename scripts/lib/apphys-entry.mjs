/* AP® Physics 1 search-entry pages and exam data (docs/apphys-architecture.md,
   "Exams and entry pages"), written by scripts/build-apphys.mjs:

     equations-sheet.html        what each equation and constant on the
                                 official sheet is for, and what the sheet
                                 leaves out; free, indexable
     score-calculator.html       composite estimate from Section I correct
                                 and Section II points (pages/score.js)
     unit-tests/<unit>.html      a free sample of 12 questions per unit,
                                 readable without JavaScript, with a link
                                 into practice and the timed unit test
     assets/exams/forms.json     the two fixed practice exams, filtered to
                                 forms whose units are all published
     assets/exams/items.json     exam-only questions, served with the forms
     assets/justify.json         the justification trainer's prompts

   No path carries the token "ap" (spec decision 2). The helpers come from
   the generator (ctx) so the pages share its head, crumbs, footer and tail. */
import { loadExams, loadJustify, formUnits, FREE_JUSTIFY, JUSTIFY_SKILLS } from './apphys-exams.mjs';

export const SAMPLE_SIZE = 12;

/* The unit test sample: the same choice every build, so the page is
   stable for search. Whole stimulus sets of single-answer items first (at
   most two, from different topics), then standalone items spread over the
   unit's topics, skipping lesson check items (they are already on the free
   lessons) where enough others exist. */
export function unitSample(ch, ctx) {
  const { map, C } = ctx;
  const checks = new Set(Object.values(C.lessons).flatMap(L => L.check || []));
  const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
  const sets = [], singles = [];
  for (const t of topics) {
    const items = C.questions[t.id].items;
    const by = new Map();
    for (const q of items) {
      if (q.stimulus) { if (!by.has(q.stimulus)) by.set(q.stimulus, []); by.get(q.stimulus).push(q); }
      else if (q.type === 'single' || q.type === 'numeric') singles.push(q);
    }
    for (const [sid, qs] of by) {
      const ok = qs.filter(q => q.type === 'single' && !/previous (question|set|calculation)/.test(q.q));
      if (ok.length >= 3 && ok.length === qs.filter(q => q.type === 'single').length) sets.push({ sid, topic: t.id, items: ok.slice(0, 4), checks: ok.filter(q => checks.has(q.id)).length });
    }
  }
  sets.sort((a, b) => a.checks - b.checks || a.sid.localeCompare(b.sid));
  const out = [], usedT = new Set();
  for (const s of sets) { if (out.length >= 8 || usedT.has(s.topic)) continue; if (out.length + s.items.length > 8) continue; out.push(...s.items); usedT.add(s.topic); }
  const pool = singles.filter(q => !checks.has(q.id) && q.level !== 'recall' && !/previous/.test(q.q));
  const byTopic = new Map(); for (const q of pool) { if (!byTopic.has(q.topic)) byTopic.set(q.topic, []); byTopic.get(q.topic).push(q); }
  for (let round = 0; out.length < SAMPLE_SIZE && round < 6; round++) {
    for (const t of topics) {
      if (out.length >= SAMPLE_SIZE) break;
      if (round === 0 && usedT.has(t.id)) continue;
      const q = (byTopic.get(t.id) || [])[round - (usedT.has(t.id) ? 1 : 0)];
      if (q && !out.includes(q)) out.push(q);
    }
  }
  return out;
}

/* The equations-sheet walkthrough. Our own words; the equations are the
   standard ones; the grouping and order are ours, not the sheet's. Each row
   is [equation, what it is, when you use it, 'Unit N', topic id, trainers?];
   the trainers (tools/<slug>.html) that practice it are linked only when
   live. Every equation and constant on the official sheet appears once
   (docs/apphys-research/framework.md, section 5; a test holds the list). */
export const EQ = [
  { h: 'Constants and conventions', id: 'constants', rows: [
    ['g = 9.8 m/s² = 9.8 N/kg', 'The size of the acceleration of a freely falling object near Earth\'s surface, and the strength of Earth\'s gravitational field there (the same number in two units).', 'Weight (F_g = mg), free fall, projectiles, U_g = mgΔy, pendulums, pressure with depth. Use the value the question gives; 10 m/s² is accepted when it does not. Say which you use.', 'Units 1, 2', 'gravitational-force', ['projectile-lab', 'free-body-diagrams']],
    ['G = 6.67 × 10⁻¹¹ N·m²/kg²', 'The universal gravitational constant.', 'Only with the full law of gravitation, F_g = Gm₁m₂/r², and U_G = −Gm₁m₂/r: planets, moons, satellites. Near Earth\'s surface use g instead.', 'Unit 2', 'gravitational-force'],
    ['1 atm = 1.0 × 10⁵ Pa', 'Atmospheric pressure at sea level, in pascals (1 Pa = 1 N/m²).', 'The P₀ in P = P₀ + ρgh, the absolute pressure at the surface of a liquid open to the air.', 'Unit 8', 'fluid-pressure'],
    ['Conventions', 'Unless the question says otherwise: the frame of reference is inertial, air resistance is negligible, springs and strings are ideal, and fluids are ideal with pipes completely full.', 'Read them as permission to simplify. If a question adds friction, a massive pulley or drag, it says so; then the convention no longer holds.', 'Units 1, 2, 8', 'third-law'],
  ] },
  { h: 'Motion', id: 'motion', rows: [
    ['v_x = v_x0 + a_x t', 'Velocity after a time t, for constant acceleration.', 'Constant acceleration along one axis (including free fall) when the displacement is not given or not wanted. For a projectile, use it on each axis separately (a_x = 0, a_y = −g).', 'Unit 1', 'motion-representations', ['motion-graphs', 'projectile-lab']],
    ['x = x₀ + v_x0 t + ½a_x t²', 'Position after a time t, for constant acceleration.', 'Finding where an object is, or how long it takes to get there, without its final velocity: a dropped object, a projectile\'s fall time, a car braking for a given time.', 'Unit 1', 'motion-representations', ['motion-graphs', 'projectile-lab']],
    ['v_x² = v_x0² + 2a_x(x − x₀)', 'Velocity and displacement linked with no time in it.', 'Stopping distances, the height a ball rises, any constant-acceleration problem where the time is neither given nor asked.', 'Unit 1', 'motion-representations', ['motion-graphs']],
    ['x_cm = Σm_i x_i / Σm_i', 'The position of a system\'s center of mass: the mass-weighted average position.', 'Where a system balances or acts as one object; locating the center of mass of up to five objects. The center of mass moves only when there is a net external force.', 'Unit 2', 'systems-center-of-mass'],
  ] },
  { h: 'Forces', id: 'forces', rows: [
    ['a_sys = ΣF / m_sys = F_net / m_sys', 'Newton\'s second law for a system: the net external force sets the acceleration.', 'Every force problem with an acceleration (or with zero acceleration, where ΣF = 0). Draw the free-body diagram first, choose axes, and sum forces along each axis.', 'Unit 2', 'second-law', ['free-body-diagrams', 'scaling-drills']],
    ['|F_g| = G m₁m₂ / r²', 'The gravitational force between two masses, with r measured between their centers.', 'Planets, moons, satellites and how the force scales: twice the distance gives a quarter of the force. Near the surface it becomes mg.', 'Unit 2', 'gravitational-force', ['scaling-drills']],
    ['|F_f| ≤ |μ F_N|', 'Friction: kinetic friction equals μ_k F_N; static friction is as large as needed, up to μ_s F_N.', 'Sliding objects (kinetic friction, the equal sign) and objects about to slip (static friction at its maximum). A box at rest with a small push has static friction equal to the push, not μ_s F_N.', 'Unit 2', 'friction', ['free-body-diagrams']],
    ['F_s = −k Δx', 'Hooke\'s law: an ideal spring pulls or pushes back toward its relaxed length, in proportion to how far it is stretched or compressed.', 'Spring scales, springs holding a mass at rest (kΔx = mg), finding k from a force-stretch graph (the slope). The minus sign says the force points opposite the displacement.', 'Unit 2', 'spring-forces', ['free-body-diagrams', 'oscillator-lab']],
    ['a_c = v² / r', 'The size of the centripetal acceleration of an object moving in a circle, pointing to the center.', 'Cars on curves, loops, orbits, balls on strings. Set the sum of the real forces toward the center equal to mv²/r; never add a separate "centripetal force" to a free-body diagram.', 'Unit 2', 'circular-motion', ['free-body-diagrams']],
  ] },
  { h: 'Energy, work and power', id: 'energy', rows: [
    ['K = ½mv²', 'Translational kinetic energy.', 'Speed from energy, and energy from speed. It depends on v², so twice the speed gives four times the kinetic energy; ΔK is not ½m(Δv)².', 'Unit 3', 'kinetic-energy', ['energy-bar-charts', 'collision-lab']],
    ['W = F_∥ d = F d cos θ', 'The work done by a constant force: the part of the force along the displacement, times the distance.', 'How much energy a force transfers. Positive when the force has a part along the motion, negative against it, zero when it is perpendicular (a normal force on a level floor, the string on a ball in a circle). For a changing force, use the area under the force-position graph.', 'Unit 3', 'work-by-forces', ['energy-bar-charts']],
    ['ΔK = ΣW_i = F_net,∥ d', 'The work-energy theorem: the net work on an object equals its change in kinetic energy.', 'Speeds after a push, stopping distances with friction, and anything with a force-position graph.', 'Unit 3', 'work-by-forces', ['energy-bar-charts']],
    ['U_s = ½k(Δx)²', 'The elastic potential energy stored in an ideal spring.', 'Spring launchers and bumpers, and oscillators. It depends on (Δx)², so twice the compression stores four times the energy.', 'Unit 3', 'potential-energy', ['energy-bar-charts', 'oscillator-lab']],
    ['U_G = −G m₁m₂ / r', 'The gravitational potential energy of two masses, zero when they are infinitely far apart.', 'Satellites and orbits far from a surface, and escape. It is negative and rises toward zero as the masses separate.', 'Unit 3', 'potential-energy', ['rotation-lab']],
    ['ΔU_g = m g Δy', 'The change in gravitational potential energy near Earth\'s surface.', 'Anything that rises or falls a height Δy near the ground: ramps, hills, pendulums. Only changes matter, so choose the zero height that makes the problem simplest.', 'Unit 3', 'potential-energy', ['energy-bar-charts']],
    ['P_avg = W / Δt = ΔE / Δt', 'Average power: how fast energy is transferred.', 'Motors, people climbing stairs, lifting loads. The same work done in half the time takes twice the power.', 'Unit 3', 'power', ['energy-bar-charts']],
    ['P_inst = F_∥ v = F v cos θ', 'Instantaneous power: the part of a force along the velocity, times the speed.', 'The power a force delivers at one moment, such as a car\'s engine at a given speed. At constant power, the driving force falls as the speed rises.', 'Unit 3', 'power'],
  ] },
  { h: 'Momentum', id: 'momentum', rows: [
    ['p = m v', 'Momentum, a vector in the direction of the velocity.', 'Every collision and explosion. Keep the sign: a ball that bounces back changes its momentum by more than one that stops.', 'Unit 4', 'linear-momentum', ['collision-lab']],
    ['F_net = Δp / Δt = m Δv / Δt', 'Newton\'s second law in terms of momentum: the net force is the rate of change of momentum.', 'Average forces in collisions, catches and landings; why a longer stopping time means a smaller force.', 'Unit 4', 'impulse', ['collision-lab']],
    ['J = F_avg Δt = Δp', 'Impulse, and the impulse-momentum theorem.', 'Finding a change in momentum from a force and a time, or from the area under a force-time graph.', 'Unit 4', 'impulse', ['collision-lab']],
    ['v_cm = Σp_i / Σm_i = Σm_i v_i / Σm_i', 'The velocity of a system\'s center of mass.', 'It stays constant whenever the net external force on the system is zero, even through a collision or explosion; the velocity of two objects that stick together.', 'Unit 4', 'linear-momentum', ['collision-lab']],
  ] },
  { h: 'Rotation', id: 'rotation', rows: [
    ['ω = ω₀ + α t', 'Angular velocity after a time t, for constant angular acceleration.', 'Wheels and fans speeding up or slowing down. The rotational partner of v = v₀ + at.', 'Unit 5', 'rotational-kinematics', ['rotation-lab']],
    ['θ = θ₀ + ω₀ t + ½α t²', 'Angular position after a time t, for constant angular acceleration.', 'The angle (in radians) or number of turns a wheel makes while it speeds up. Divide by 2π to get revolutions.', 'Unit 5', 'rotational-kinematics'],
    ['ω² = ω₀² + 2α(θ − θ₀)', 'Angular velocity and angle linked with no time in it.', 'How many turns a wheel makes while it stops, when the time is not given.', 'Unit 5', 'rotational-kinematics'],
    ['v = r ω;  a_T = r α', 'The link between a point\'s linear motion and the object\'s rotation, at a distance r from the axis.', 'Strings unwinding from pulleys, points on a wheel, rolling without slipping (v_cm = Rω). ω and α must be in rad/s and rad/s².', 'Unit 5', 'linear-rotational-link', ['rotation-lab']],
    ['τ = r_⊥ F = r F sin θ', 'Torque: how strongly a force turns an object about an axis, set by the force and its lever arm.', 'Balanced beams and seesaws, wrenches, hinged rods. Choose the axis where an unknown force acts to remove it from the sum.', 'Unit 5', 'torque', ['torque-balance']],
    ['I = Σm_i r_i²', 'The rotational inertia of a set of point masses about an axis.', 'Comparing how hard objects are to spin up: mass farther from the axis counts more (r²). For a disk, rod, hoop or sphere the question gives I.', 'Unit 5', 'rotational-inertia', ['torque-balance', 'rotation-lab']],
    ['I\' = I_cm + M d²', 'The parallel-axis theorem: the rotational inertia about an axis a distance d from a parallel axis through the center of mass.', 'A rod turning about its end instead of its center, a disk pivoted at its rim.', 'Unit 5', 'rotational-inertia'],
    ['α_sys = Στ / I_sys = τ_net / I_sys', 'Newton\'s second law in rotational form.', 'Pulleys with mass, wheels driven by a torque, rods falling about a pivot. Write it alongside ΣF = ma for any object that also moves.', 'Unit 5', 'rotational-second-law', ['torque-balance', 'rotation-lab']],
    ['K = ½ I ω²', 'Rotational kinetic energy.', 'Spinning objects, and rolling objects, whose total kinetic energy is ½Mv² + ½Iω².', 'Unit 6', 'rotational-kinetic-energy', ['rotation-lab']],
    ['W = τ Δθ', 'The work done by a constant torque turning through an angle Δθ (in radians).', 'Motors and brakes on wheels; the rotational work-energy theorem, τΔθ = ΔK.', 'Unit 6', 'torque-work'],
    ['L = I ω', 'The angular momentum of a rotating object.', 'Spinning skaters and divers, turntables that catch a falling lump, merry-go-rounds. It stays constant when the net external torque is zero.', 'Unit 6', 'angular-momentum', ['rotation-lab']],
    ['L = r m v sin θ', 'The angular momentum of a point object about an axis.', 'A child jumping onto a merry-go-round, a ball on a string, a satellite (constant because gravity points at the planet).', 'Unit 6', 'angular-momentum'],
    ['ΔL = τ Δt', 'Angular impulse: a torque acting for a time changes the angular momentum.', 'Spinning a wheel up or down with a known torque for a known time.', 'Unit 6', 'angular-momentum'],
    ['Δx_cm = r Δθ', 'For an object rolling without slipping, the distance its center moves is the radius times the angle it turns.', 'Rolling without slipping; with v = rω it gives v_cm = Rω.', 'Unit 6', 'rolling', ['rotation-lab']],
  ] },
  { h: 'Oscillations', id: 'oscillations', rows: [
    ['T = 1 / f', 'The period (time for one cycle) and the frequency (cycles per second, Hz) are reciprocals.', 'Every oscillation and circular motion. Time ten cycles and divide by ten for an accurate period.', 'Units 2, 7', 'shm-period', ['oscillator-lab']],
    ['T_s = 2π √(m / k)', 'The period of a mass on an ideal spring.', 'Spring oscillators, horizontal or hanging. It does not depend on the amplitude or on g. Graph T² against m for a straight line with slope 4π²/k.', 'Unit 7', 'shm-period', ['oscillator-lab', 'scaling-drills']],
    ['T_p = 2π √(ℓ / g)', 'The period of a simple pendulum swinging through small angles.', 'Pendulums only (not springs). It does not depend on the bob\'s mass or the amplitude. Graph T² against ℓ for a line with slope 4π²/g.', 'Unit 7', 'shm-period', ['oscillator-lab', 'scaling-drills', 'lab-design']],
    ['x = A cos(2π f t)  or  x = A sin(2π f t)', 'Position against time in simple harmonic motion, with amplitude A and frequency f.', 'Cosine when the object starts at x = A (released from rest), sine when it starts at x = 0 moving in the positive direction. Calculator in radian mode.', 'Unit 7', 'shm-representations', ['oscillator-lab']],
  ] },
  { h: 'Fluids', id: 'fluids', rows: [
    ['ρ = m / V', 'Density: mass per unit volume, in kg/m³.', 'Whether something floats, the mass of a displaced fluid, and every fluid equation.', 'Unit 8', 'density-fluids', ['fluids-tank']],
    ['P = F_⊥ / A', 'Pressure: the perpendicular force per unit area, in pascals.', 'Forces on surfaces such as a window in a tank, a piston or a diver\'s mask. Pressure is not a force; multiply by the area to get one.', 'Unit 8', 'fluid-pressure', ['fluids-tank']],
    ['P = P₀ + ρ g h', 'Absolute pressure at a depth h below the surface of a fluid at rest.', 'Pressure at the bottom of a pool or a lake. It depends on depth, not on the container\'s shape. A graph of P against h has intercept P₀ and slope ρg.', 'Unit 8', 'fluid-pressure', ['fluids-tank']],
    ['P_gauge = ρ g h', 'Gauge pressure: the pressure above atmospheric.', 'What a tire or diving gauge reads; zero at the surface of an open liquid.', 'Unit 8', 'fluid-pressure', ['fluids-tank']],
    ['F_b = ρ V g', 'The buoyant force: the weight of the fluid displaced. ρ is the fluid\'s density and V the submerged volume.', 'Floating and sinking. A floating object at rest has F_b equal to its weight. Draw F_b and the gravitational force as two separate forces in opposite directions.', 'Unit 8', 'buoyancy', ['fluids-tank']],
    ['A₁v₁ = A₂v₂', 'The continuity equation: an ideal fluid in a full pipe has the same volume flow rate everywhere.', 'Pipes that narrow or widen, nozzles, a falling stream that thins. Half the area means twice the speed.', 'Unit 8', 'fluid-flow', ['fluids-tank']],
    ['P₁ + ρgy₁ + ½ρv₁² = P₂ + ρgy₂ + ½ρv₂²', 'Bernoulli\'s equation: energy conservation per unit volume along a flow of ideal fluid.', 'Pressure differences in pipes, water leaving a hole in a tank (it gives Torricelli\'s result), why faster flow means lower pressure in a level pipe.', 'Unit 8', 'fluid-flow', ['fluids-tank']],
  ] },
  { h: 'Geometry and trigonometry', id: 'geometry', rows: [
    ['sin θ = a/c;  cos θ = b/c;  tan θ = a/b;  c² = a² + b²', 'Right-triangle trigonometry and the Pythagorean theorem. The sheet also lists sin, cos and tan of 0°, 30°, 37°, 45°, 53°, 60° and 90° (37° and 53° are the 3-4-5 triangle).', 'Components of forces and velocities, heights from ramp lengths (h = d sin θ), torques at an angle. Check the calculator is in degree mode.', 'Math you need', 'math-trig-components', ['projectile-lab', 'scaling-drills']],
    ['s = r θ;  C = 2πr;  A = πr²', 'Arc length (θ in radians), circumference and area of a circle.', 'Distance around a wheel, the period of circular motion (v = 2πr/T), pipe cross-sections for continuity.', 'Units 2, 5', 'linear-rotational-link'],
    ['A = bh;  A = ½bh;  V = ℓwh;  V = πr²ℓ;  V = 4/3 πr³;  S = 4πr²', 'Areas of a rectangle and triangle; volumes of a rectangular solid, cylinder and sphere; surface area of a sphere.', 'Areas under graphs (displacement, work, impulse) and volumes for density and buoyancy.', 'Math you need', 'math-slopes-areas'],
  ] },
];
// What the sheet leaves out (docs/apphys-research/framework.md, section 5).
export const NOT_ON = [
  ['Rotational inertia of a disk, rod, hoop or sphere', 'The question gives it when it is needed. Know that I = Σmr² for point masses, and that mass farther from the axis means a larger I.', 'rotational-inertia'],
  ['Escape speed', 'Derive it: set the total energy ½mv² − GMm/r to zero and solve for v.', 'orbits'],
  ['Torricelli\'s result', 'Derive it from Bernoulli\'s equation: water leaving a hole a depth h below the surface moves at √(2gh).', 'fluid-flow'],
  ['Kepler\'s third law', 'Derive it: set the gravitational force equal to m·v²/r for a circular orbit, with v = 2πr/T.', 'circular-motion'],
  ['The minimum speed at the top of a loop', 'Derive it: at the slowest speed, gravity alone supplies the centripetal force, so mg = mv²/r and v = √(gr).', 'circular-motion'],
  ['The greatest speed of an oscillator', 'Derive it from energy: all of ½kA² becomes ½mv² at equilibrium, so v_max = A√(k/m) = 2πfA.', 'shm-energy'],
];

export function entryPages(ctx) {
  const { map, C, put, head, tail, footer, crumbNav, crumbs, orgCrumbs, esc, text, SITE, BASE, COURSE_ID, COURSE_NAME, COURSE_HTML, BETA_PILL, LABEL, courseTitle, clampDesc, noindex, bodyOpen, questionHtml, questionForPage, groupSets, stimulusPanel, stimulusBody, isFreeTopic, frqs, liveTools } = ctx;
  const units = map.chapters.filter(c => c.part === 'course');
  const built = ch => map.topics.some(t => t.chapter === ch.id && C.built.has(t.id));
  const topicLink = (id, depth) => C.built.has(id) ? `<a href="${depth}notes/${id}.html">${esc(map.topicById(id).title)}</a>` : esc((map.topicById(id) || {}).title || id);
  const out = {};
  // Live trainers that practice an equation (EQ rows' sixth field), as links.
  const trainers = slugs => {
    const live = (slugs || []).map(sl => (liveTools || []).find(t => t.slug === sl)).filter(Boolean);
    return live.length ? `<span class="phys-eq-tools"><span class="phys-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ----------------------------------------------------- equations sheet */
  {
    const depth = '', path = 'equations-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Equations and Constants Sheet, Explained', [LABEL]);
    const desc = 'Every equation and constant on the physics exam reference sheet, explained: what it is for, when to use it, the common slips, and what the sheet leaves out.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'The equations and constants sheet, explained', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Equations sheet, explained', url }])),
    ] };
    const sections = EQ.map(s => `<section class="xsection phys-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: equations"><table class="phys-eq"><thead><tr><th scope="col">Equation</th><th scope="col">What it is</th><th scope="col">When you use it</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr><th scope="row"><span class="phys-eq-f">${esc(r[0])}</span></th><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}<br>${topicLink(r[4], depth)}${trainers(r[5])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const body = `
${bodyOpen(' data-app="equations-sheet"')}
<main id="main" class="xshell phys-app phys-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Equations sheet, explained' }])}
  <header class="hero phys-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>The equations and constants sheet, explained</h1>
  <p class="lede">What each equation and constant on the exam sheet is for, and when to use it.</p></header>
  <section class="xsection phys-eq-tips" aria-labelledby="eq-tips"><h2 id="eq-tips">Three habits that save points</h2>
    <ul class="phys-links">
      <li><b>Use the g the question gives.</b> The sheet prints g = 9.8 m/s²; 10 m/s² is accepted. Say which one you use, and keep it the same through the whole answer.</li>
      <li><b>SI units before you substitute.</b> Centimeters to meters, grams to kilograms, minutes to seconds. A newton is a kg·m/s² and a joule is a N·m.</li>
      <li><b>Degree mode for angles in degrees.</b> sin 30° = 0.5 only in degree mode; rotation formulas such as s = rθ need the angle in radians.</li>
    </ul>
  </section>
  ${EQ.length ? sections : '<p class="phys-small">The equation-by-equation guide arrives with the first published unit.</p>'}
  <section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">What is not on the sheet</h2>
    <p>The exam gives you these values in the question, or expects you to reason without them. None of them is printed on the sheet.</p>
    <ul class="phys-eq-not">${NOT_ON.map(r => `<li><b>${esc(r[0])}.</b> ${esc(r[1])} <span class="phys-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
    <p>On exam day you get this sheet of equations and constants, on paper and in the testing app. The sheet itself is published by the College Board; this page is our own guide to using it.</p>
    <p>The sheet also lists the conventions every question assumes unless it says otherwise (inertial frames, no air resistance, ideal springs, strings and fluids), unit symbols, the metric prefixes from tera to pico, and sine, cosine and tangent at 0°, 30°, 37°, 45°, 53°, 60° and 90°.</p>
  </section>
  <section class="xsection" aria-labelledby="eq-next"><h2 id="eq-next">Practice with it</h2>
    <p>${[`<a href="score-calculator.html">Estimate your score</a>`, testLink('', 'Free unit practice tests'), `<a href="learn.html">Free notes for every topic</a>`, `<a href="exams.html">Full practice exams</a>`].filter(Boolean).join(' &middot; ')}</p>
  </section>
</main>
${footer(depth, 'page:equations-sheet')}
<link rel="stylesheet" href="assets/pages/pages.css">
<link rel="stylesheet" href="assets/pages/entry.css">
<link rel="stylesheet" href="../assets/course/tool-studio.css">
${tail({ depth, section: 'exams', extra: ['pages/calm-ref.js'], site: ['course/tool-studio.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
  }

  /* ----------------------------------------------------- score calculator */
  {
    const depth = '', path = 'score-calculator.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Physics Score Calculator', [LABEL]);
    const desc = 'Estimate your physics exam score from multiple-choice questions right and free-response points. The method and its limits are explained on the page.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebApplication', '@id': `${url}#calc`, name: 'Physics score calculator', url, description: desc, applicationCategory: 'EducationalApplication', operatingSystem: 'Any', isAccessibleForFree: true, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Score calculator', url }])),
    ] };
    const body = `
${bodyOpen(' data-app="score-calculator"')}
<main id="main" class="xshell phys-app phys-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Score calculator' }])}
  <header class="hero phys-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Score calculator</h1>
  <p class="lede">Enter your multiple-choice and free-response results to get an estimated score from 1 to 5.</p></header>
  <div id="phys-calc" class="phys-app-mount"><noscript><p>The calculator needs JavaScript. The method below lets you work it out by hand.</p></noscript></div>
  <section class="xsection" aria-labelledby="sc-how"><h2 id="sc-how">How the estimate works</h2>
    <p>Use the questions you got right and the points on each free-response question from a practice exam, or from a released one you scored with its rubric.</p>
    <p>The exam has two sections worth half the score each: 42 multiple-choice questions, and 4 free-response questions worth 40 points (Mathematical Routines 10, Translation Between Representations 12, Experimental Design and Analysis 10, Qualitative/Quantitative Translation 8). So the calculator turns each section into a score out of 50 and adds them:</p>
    <p class="phys-sc-formula"><b>composite = 50 &times; (multiple-choice right &divide; 42) + 50 &times; (free-response points &divide; 40)</b></p>
    <p>A composite of 70 or more is shown as a 5, 55 or more as a 4, 41 or more as a 3, 31 or more as a 2, and anything lower as a 1. There is no penalty for a wrong multiple-choice answer, so a blank and a wrong answer count the same.</p>
    <p class="phys-ex-band-warn"><b>These cut-offs are estimates, not official.</b> The College Board sets the real cut-offs after each exam, from how that year's students did, and has published none for the current physics exam. We chose ours so that, with the average free-response scores the College Board published for 2025, they give about the share of 5s (19 to 20%), 4s or better (about 44%) and 3s or better (about 68%) reported for 2025 and 2026. Treat a result within about 5 points of a cut-off as either score. Use the estimate to see which section has the most room to grow.</p>
  </section>
  <section class="xsection" aria-labelledby="sc-next"><h2 id="sc-next">Raise your score</h2>
    <ul class="phys-links">
      <li><a href="exams.html">Full practice exams</a> in the real format, with this estimate at the end.</li>
      <li><a href="justify.html">The justification trainer</a> for the claim-and-reasoning points free response is built on.</li>
      <li><a href="equations-sheet.html">The equations sheet, explained</a>${firstTest ? `, and ${testLink('', 'free unit practice tests')}` : ''}.</li>
    </ul>
  </section>
</main>
${footer(depth, 'page:score-calculator')}
<link rel="stylesheet" href="assets/pages/pages.css">
<link rel="stylesheet" href="assets/pages/entry.css">
<link rel="stylesheet" href="../assets/course/tool-studio.css">
${tail({ depth, section: 'exams', extra: ['pages/score.js', 'pages/calm-ref.js'], site: ['course/tool-studio.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'website', jsonld, noindex }) + body;
  }

  /* ---------------------------------------------------- unit practice tests */
  const stimFor = q => { const s = ((C.questions[q.topic] || {}).stimuli || {})[q.stimulus]; return s; };
  for (const ch of units.filter(built)) {
    const depth = '../', path = `unit-tests/${ch.id}.html`, url = `${SITE}${BASE}${path}`;
    const qs = unitSample(ch, ctx).map(questionForPage);
    const title = courseTitle(`Unit ${ch.n} Practice Test: ${ch.title}`, [LABEL]);
    const desc = clampDesc(`A free ${qs.length}-question practice test for Unit ${ch.n}, ${ch.title.toLowerCase()}, with the answer and an explanation for every option.`);
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Quiz', '@id': `${url}#quiz`, name: `Unit ${ch.n} practice test: ${ch.title}`, url, description: desc, isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', about: ch.title, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: ch.title, url: `${SITE}${BASE}units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test`, url }])),
    ] };
    const stimuli = {};
    for (const q of qs) if (q.stimulus) { const s = stimFor(q); if (s) stimuli[q.stimulus] = { kind: s.kind, title: s.title, html: stimulusBody(C, s, '') }; }
    const html = groupSets(qs).map(g => {
      const items = g.items.map(q => questionHtml(q, qs.indexOf(q) + 1)).join('');
      const s = g.stimulus && stimuli[g.stimulus];
      return s ? `<div class="phys-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell phys-app phys-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero phys-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Four answer choices each, and data sets that share one table, graph or scene diagram, as on the real exam.</p>
  <p class="phys-small phys-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="phys-qs" data-set="check">${html}</div>
  <section class="xsection phys-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="phys-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="phys-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="phys-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['phys-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
  }

  /* ---------------------------------------------------------- exam data */
  const ex = loadExams(C.data);
  const bank = new Map(); for (const t of map.topics) for (const q of ((C.questions[t.id] || {}).items || [])) bank.set(q.id, q);
  const examItems = new Map(ex.items.map(q => [q.id, q]));
  const frqById = Object.fromEntries(frqs.map(f => [f.id, f]));
  const live = ex.forms.filter(f => formUnits(f, { bank, examItems, frqs: frqById }).every(u => C.published.has(u)) && (f.frq || []).every(id => frqById[id]));
  const usedOwn = new Set(live.flatMap(f => f.mcq.flat()).filter(id => examItems.has(id)));
  const ownStim = {};
  for (const id of usedOwn) { const s = examItems.get(id).stimulus; if (s && ex.stimuli[s]) ownStim[s] = { kind: ex.stimuli[s].kind, title: ex.stimuli[s].title, html: stimulusBody(C, ex.stimuli[s], '') }; }
  out['assets/exams/forms.json'] = JSON.stringify(live.map(f => ({ id: f.id, title: f.title, mcq: f.mcq, frq: f.frq })));
  out['assets/exams/items.json'] = JSON.stringify({ stimuli: ownStim, items: [...usedOwn].map(id => questionForPage(examItems.get(id))) });

  /* ---------------------------------------------------- justification data */
  const prompts = loadJustify(C.data, map).filter(p => C.published.has(p.unit));
  out['assets/justify.json'] = JSON.stringify({
    skills: JUSTIFY_SKILLS,
    prompts: prompts.map((p, i) => ({ id: p.id, unit: p.unit, topic: p.topic, practice: p.practice, skill: p.skill, title: p.title, context: p.context || '', prompt: p.prompt, checklist: p.checklist, earns: p.earns, misses: p.misses, ...(i < FREE_JUSTIFY ? { free: true } : {}) })),
  });
  return { pages: out, sampleUnits: units.filter(built).map(u => u.id), forms: live.length, prompts: prompts.length };
}
