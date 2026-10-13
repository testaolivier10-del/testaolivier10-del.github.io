/* Figures for AP® Physics 1 Unit 8 (Fluids). Run:
     node scripts/apphys-figures/unit-8.mjs
   Writes physics/figures/<id>.svg with the kit in unit-7.mjs. */
import { fileURLToPath } from 'node:url';
import { C, text, arrow, dim, block, dot, dashed, line, path, svgDoc, writeFig } from './unit-7.mjs';

const r1 = v => Math.round(v * 10) / 10;
export const FIGS = {};

/* A tank of water: open top, walls, water to level wy. */
export function tank(x, y, w, h, wy, o = {}) {
  let s = `<rect x="${x}" y="${wy}" width="${w}" height="${y + h - wy}" fill="${o.fill || C.water}"/>`;
  s += `<path d="M${x},${y} L${x},${y + h} L${x + w},${y + h} L${x + w},${y}" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<line x1="${x}" y1="${wy}" x2="${x + w}" y2="${wy}" stroke="${C.waterEdge}" stroke-width="2"/>`;
  return s;
}

/* 8.1: particles in a solid, a liquid and a gas, plus density. */
FIGS['fluid-states-density'] = () => {
  const W = 760, H = 380;
  let s = text(W / 2, 26, 'Solids keep their shape; fluids flow', { anchor: 'middle', size: 17, weight: 'bold' });
  const box = (x, lab, sub) => `<rect x="${x}" y="50" width="200" height="200" rx="6" fill="#FFFFFF" stroke="${C.ink}" stroke-width="2.5"/>` + text(x + 100, 278, lab, { anchor: 'middle', size: 16, weight: 'bold' }) + text(x + 100, 300, sub, { anchor: 'middle', size: 13, color: C.grey });
  s += box(40, 'Solid', 'particles locked in place');
  s += box(280, 'Liquid', 'close together, slide past');
  s += box(520, 'Gas', 'far apart, move freely');
  const P = (x, y) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="9" fill="${C.buoyant}" stroke="${C.ink}" stroke-width="1.2"/>`;
  for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) s += P(64 + i * 25.5, 74 + j * 25.5);
  // liquid: fills the bottom of its container, loosely packed
  const liq = [[300,232],[322,236],[344,231],[366,236],[388,232],[410,235],[432,231],[456,234],[310,212],[333,214],[356,210],[379,215],[401,211],[424,214],[447,210],[300,191],[322,195],[346,190],[369,194],[392,190],[415,194],[438,191],[458,196],[311,171],[335,173],[358,169],[381,174],[404,170],[428,173],[450,170]];
  for (const [x, y] of liq) s += P(x, y);
  s += line(282, 160, 478, 160, C.waterEdge, 1.5);
  const gas = [[560,80],[640,95],[700,70],[590,150],[670,165],[560,220],[625,225],[700,205],[690,120]];
  for (const [x, y] of gas) s += P(x, y);
  s += arrow(560, 80, 585, 68, C.velocity, { width: 2, head: 7, headWidth: 4 }) + arrow(640, 95, 620, 118, C.velocity, { width: 2, head: 7, headWidth: 4 }) + arrow(670, 165, 700, 175, C.velocity, { width: 2, head: 7, headWidth: 4 });
  s += `<rect x="150" y="320" width="460" height="46" rx="8" fill="${C.pale}" stroke="${C.light}"/>`;
  s += text(380, 349, 'density ρ = m / V  (in kg/m³)&#160;&#160;&#160;&#160;water: ρ ≈ 1000 kg/m³', { anchor: 'middle', size: 16, weight: 'bold', color: C.amber });
  return svgDoc(W, H, 'Particles in a solid, a liquid and a gas', 'Three boxes of particles. In the solid the particles sit in a fixed grid. In the liquid they are close together but disordered and fill the bottom of the container, with a flat surface. In the gas they are far apart and move in all directions, filling the box. Liquids and gases are fluids: they flow and take the shape of their container. Below, the definition of density: ρ = m/V in kg/m³; water is about 1000 kg/m³.', s);
};

/* 8.2: pressure grows with depth; absolute vs gauge. */
FIGS['fluid-pressure-depth'] = () => {
  const W = 760, H = 430;
  const x = 60, y = 60, w = 300, h = 300, wy = 90;
  let s = text(W / 2, 26, 'Pressure in a liquid depends on depth', { anchor: 'middle', size: 17, weight: 'bold' });
  s += tank(x, y, w, h, wy);
  s += text(x + w + 10, wy - 4, 'P₀ (air pushes on the surface)', { size: 13, color: C.grey });
  for (const xx of [100, 170, 240, 310]) s += arrow(xx, wy - 34, xx, wy - 4, C.grey, { width: 2, head: 8, headWidth: 4 });
  const pts = [[130, 160, 'A'], [270, 160, 'B'], [200, 300, 'C']];
  for (const [px, py, l] of pts) {
    const k = (py - wy) / 210;
    const len = 16 + 26 * k;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) s += arrow(px - dx * (len + 6), py - dy * (len + 6), px - dx * 6, py - dy * 6, C.amber, { width: 2.4, head: 8, headWidth: 4.5 });
    s += dot(px, py, 4) + text(px + 10, py - 10, l, { size: 15, weight: 'bold' });
  }
  s += dim(x - 22, wy, x - 22, 160, 'h₁', { lx: x - 30, ly: 130, anchor: 'end', italic: true });
  s += dim(x + w + 22, wy, x + w + 22, 300, 'h₂', { lx: x + w + 30, ly: 200, anchor: 'start', italic: true });
  s += dashed(x, 160, x + w, 160, C.light, 1.2) + dashed(x, 300, x + w, 300, C.light, 1.2);
  // side panel
  const bx = 430;
  s += `<rect x="${bx}" y="${wy + 10}" width="300" height="250" rx="8" fill="${C.pale}" stroke="${C.light}"/>`;
  s += text(bx + 18, wy + 44, 'Absolute pressure', { size: 15, weight: 'bold' });
  s += text(bx + 18, wy + 72, 'P = P₀ + ρgh', { size: 19, weight: 'bold', color: C.amber });
  s += text(bx + 18, wy + 112, 'Gauge pressure (what a tire', { size: 15, weight: 'bold' });
  s += text(bx + 18, wy + 132, 'gauge reads)', { size: 15, weight: 'bold' });
  s += text(bx + 18, wy + 160, 'P_gauge = P − P₀ = ρgh'.replace('_gauge', '<tspan baseline-shift="sub" font-size="12">gauge</tspan>'), { size: 19, weight: 'bold', color: C.amber });
  s += text(bx + 18, wy + 196, 'A and B: same depth, same pressure.', { size: 13.5 });
  s += text(bx + 18, wy + 218, 'C is deeper, so its pressure is larger.', { size: 13.5 });
  s += text(bx + 18, wy + 240, 'At a point, the push is the same', { size: 13.5 });
  s += text(bx + 18, wy + 258, 'in every direction.', { size: 13.5 });
  return svgDoc(W, H, 'Pressure at three points in a tank of water', 'An open tank of water with air pressing down on the surface at P₀. Points A and B are at the same depth h₁; point C is deeper, at h₂. Arrows of equal length push in from all four sides of each point, longer at C than at A and B, showing that pressure acts equally in every direction at a point and grows with depth. A panel gives absolute pressure P = P₀ + ρgh and gauge pressure P_gauge = ρgh.', s);
};

/* 8.3: why there is a buoyant force, and the FBD of a submerged block. */
FIGS['buoyancy-forces'] = () => {
  const W = 760, H = 420;
  const x = 40, y = 50, w = 320, h = 320, wy = 80;
  let s = text(W / 2, 26, 'The buoyant force: the water pushes up harder than down', { anchor: 'middle', size: 17, weight: 'bold' });
  s += tank(x, y, w, h, wy);
  const bx = 150, by = 170, bw = 100, bh = 90;
  s += block(bx, by, bw, bh, { fill: C.wood, label: '' });
  // pressure arrows: top short, bottom long, sides equal by depth
  for (const xx of [172, 198, 224]) {
    s += arrow(xx, by - 28, xx, by - 2, C.amber, { width: 2.2, head: 7, headWidth: 4 });
    s += arrow(xx, by + bh + 46, xx, by + bh + 2, C.amber, { width: 2.2, head: 7, headWidth: 4 });
  }
  for (const yy of [190, 215, 240]) {
    const len = 18 + (yy - 190) * 0.25;
    s += arrow(bx - len - 2, yy, bx - 2, yy, C.amber, { width: 1.8, head: 6, headWidth: 3.5 });
    s += arrow(bx + bw + len + 2, yy, bx + bw + 2, yy, C.amber, { width: 1.8, head: 6, headWidth: 3.5 });
  }
  s += text(bx + bw / 2, by - 36, 'smaller push on top', { anchor: 'middle', size: 13 });
  s += text(bx - 8, by + bh + 18, 'larger push', { anchor: 'end', size: 13 }) + text(bx - 8, by + bh + 34, 'on the bottom', { anchor: 'end', size: 13 }) + text(bx - 8, by + bh + 50, '(deeper)', { anchor: 'end', size: 13 });
  s += text(x + w - 8, by + 4, 'side pushes', { anchor: 'end', size: 12, color: C.grey });
  s += text(x + w - 8, by + 20, 'cancel', { anchor: 'end', size: 12, color: C.grey });
  // FBD panel
  const fx = 560, fy = 210;
  s += line(400, 60, 400, 400, C.light, 1.5);
  s += text(fx, 60, 'Free-body diagram of the block', { anchor: 'middle', size: 15, weight: 'bold' });
  s += `<rect x="${fx - 24}" y="${fy - 22}" width="48" height="44" fill="${C.wood}" stroke="${C.ink}" stroke-width="1.6"/>` + dot(fx, fy, 4.5);
  s += arrow(fx, fy, fx, fy - 115, C.buoyant, { width: 3.5 });
  // gravity and tension are both down: drawn side by side from the dot so both show
  s += arrow(fx + 12, fy, fx + 12, fy + 80, C.gravity, { width: 3.5 });
  s += arrow(fx - 12, fy, fx - 12, fy + 35, C.tension, { width: 3.5 });
  s += line(fx - 12, fy, fx + 12, fy, C.ink, 2);
  s += text(fx + 14, fy - 92, 'F<tspan baseline-shift="sub" font-size="10">b</tspan>, water on block', { size: 13.5, color: C.buoyant, weight: 'bold' });
  s += text(fx + 24, fy + 78, 'F<tspan baseline-shift="sub" font-size="10">g</tspan>, Earth on block', { size: 13.5, color: C.gravity, weight: 'bold' });
  s += text(fx - 22, fy + 46, 'F<tspan baseline-shift="sub" font-size="10">T</tspan>, string on block', { size: 13.5, color: C.tension, weight: 'bold', anchor: 'end' });
  s += `<rect x="440" y="320" width="300" height="62" rx="8" fill="${C.pale}" stroke="${C.light}"/>`;
  s += text(590, 345, 'F<tspan baseline-shift="sub" font-size="12">b</tspan> = ρ<tspan baseline-shift="sub" font-size="12">fluid</tspan> V<tspan baseline-shift="sub" font-size="12">disp</tspan> g', { anchor: 'middle', size: 19, weight: 'bold', color: C.amber });
  s += text(590, 370, 'the weight of the displaced fluid', { anchor: 'middle', size: 13.5 });
  // string to floor
  s += line(bx + bw - 8, by + bh, bx + bw - 8, y + h, C.tension, 1.8) + text(bx + bw, y + h - 12, 'string', { size: 12, color: C.tension });
  return svgDoc(W, H, 'Why a submerged block feels a buoyant force', 'Left: a wooden block held under water by a string tied to the bottom of the tank. Short pressure arrows push down on its top face and longer ones push up on its bottom face, because the bottom is deeper; the side pushes cancel. Right: the block’s free-body diagram, drawn from a dot: the buoyant force (water on block) points up and is the longest; the gravitational force (Earth on block) and the tension (string on block) both point down and together balance it. The buoyant force equals ρ_fluid·V_displaced·g, the weight of the displaced water.', s);
};

/* 8.4: a pipe that narrows and rises: continuity and Bernoulli. */
FIGS['fluid-flow-pipe'] = () => {
  const W = 760, H = 400;
  let s = text(W / 2, 26, 'Flow through a pipe that narrows and rises', { anchor: 'middle', size: 17, weight: 'bold' });
  // pipe outline: wide section left (y 200-300), transition, narrow section right raised (y 120-160)
  const top = 'M40,200 L280,200 C340,200 360,120 420,120 L720,120';
  const bot = 'M40,300 L280,300 C360,300 380,160 440,160 L720,160';
  s += `<path d="${top} L720,160 L440,160 C380,160 360,300 280,300 L40,300 Z" fill="${C.water}" stroke="none"/>`;
  s += path(top, { width: 3 }) + path(bot, { width: 3 });
  // velocity arrows
  for (const yy of [225, 250, 275]) s += arrow(100, yy, 150, yy, C.velocity, { width: 2.8, head: 9, headWidth: 5 });
  for (const yy of [133, 147]) s += arrow(520, yy, 640, yy, C.velocity, { width: 2.8, head: 9, headWidth: 5 });
  s += text(125, 330, 'section 1: area A₁, speed v₁', { anchor: 'middle', size: 14 });
  s += text(125, 350, 'pressure P₁, height y₁', { anchor: 'middle', size: 14 });
  s += text(580, 190, 'section 2: area A₂ (smaller)', { anchor: 'middle', size: 14 });
  s += text(580, 210, 'speed v₂ (larger), height y₂', { anchor: 'middle', size: 14 });
  s += dim(30, 200, 30, 300, '', {}) ;
  s += text(24, 254, 'A₁', { anchor: 'end', size: 13, italic: true });
  s += dim(735, 120, 735, 160, '', {});
  s += text(741, 145, 'A₂', { size: 13, italic: true });
  // heights relative to a reference line
  s += dashed(40, 380, 720, 380, C.grey, 1.2) + text(46, 374, 'y = 0', { anchor: 'start', size: 12, color: C.grey });
  s += dim(220, 380, 220, 250, 'y₁', { lx: 228, ly: 320, anchor: 'start', italic: true });
  s += dim(690, 380, 690, 140, 'y₂', { lx: 682, ly: 300, anchor: 'end', italic: true });
  s += `<rect x="30" y="40" width="300" height="92" rx="8" fill="#FFFFFF" stroke="${C.light}"/>`;
  s += text(46, 64, 'Continuity (mass): A₁v₁ = A₂v₂', { size: 15, weight: 'bold', color: C.amber });
  s += text(46, 90, 'Bernoulli (energy):', { size: 15, weight: 'bold', color: C.amber });
  s += text(46, 116, 'P₁ + ρgy₁ + ½ρv₁² = P₂ + ρgy₂ + ½ρv₂²', { size: 15, weight: 'bold', color: C.amber });
  return svgDoc(W, H, 'Continuity and Bernoulli in a pipe', 'A water-filled pipe whose wide lower section (area A₁, speed v₁, pressure P₁, height y₁) narrows and rises into a smaller upper section (area A₂, height y₂). Velocity arrows are longer in the narrow section. Continuity, A₁v₁ = A₂v₂, sets the speeds; Bernoulli’s equation, P₁ + ρgy₁ + ½ρv₁² = P₂ + ρgy₂ + ½ρv₂², then gives the pressure: in the narrow, higher section the pressure is lower.', s);
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) for (const [id, f] of Object.entries(FIGS)) { writeFig(id, f()); console.log(`physics/figures/${id}.svg`); }
