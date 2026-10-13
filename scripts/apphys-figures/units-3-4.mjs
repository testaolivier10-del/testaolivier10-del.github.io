/* AP® Physics 1, Units 3-4 (energy, momentum): figure generator and the scene
   helpers the Unit 3-4 question stimuli are drawn with.

     node scripts/apphys-figures/units-3-4.mjs     writes physics/figures/<id>.svg

   Every figure is a standalone SVG on a white background with role="img",
   <title> and <desc>, Arial/Helvetica, ink #1F2A28, amber #734200 for emphasis
   and the trainers' force colours. Forces start on the object and carry their
   type and agent (docs/apphys-authoring-guide.md, "Free-body diagrams"). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const INK = '#1F2A28', AMBER = '#734200', MUTED = '#5A6268', LIGHT = '#E9E4DA';
export const C = {
  grav: '#0072B2', normal: '#009E73', tension: '#7A4F9E', friction: '#D55E00', spring: '#CC79A7',
  applied: '#5A6268', buoy: '#3E9BC8', vel: '#B07A00', acc: '#A33B26', disp: '#1F2A28',
};
// Bar colours for energy and momentum bar charts (match the energy trainer).
export const BAR = { K: '#B07A00', Ug: '#0072B2', Us: '#CC79A7', Eth: '#D55E00', p: '#734200', total: '#5A6268' };
const FONT = 'Arial, Helvetica, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Text with simple sub/superscripts: "F_g" -> F with subscript g, "v^2" -> v². */
export function rich(s) {
  return esc(s).replace(/_\{([^}]+)\}|_([A-Za-z0-9]+)/g, (m, a, b) => `<tspan baseline-shift="sub" font-size="75%">${a || b}</tspan>`);
}
export function text(x, y, s, o = {}) {
  const { size = 14, color = INK, anchor = 'start', weight = 'normal', italic = false } = o;
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" fill="${color}" text-anchor="${anchor}"${weight !== 'normal' ? ` font-weight="${weight}"` : ''}${italic ? ' font-style="italic"' : ''}>${rich(s)}</text>`;
}
/* An arrow from (x, y) to (x + dx, y + dy). */
export function arrow(x, y, dx, dy, color = INK, o = {}) {
  const { width = 3, head = 11, dashed = false, label, lx = 0, ly = 0, lsize = 13, lanchor } = o;
  const len = Math.hypot(dx, dy);
  if (len < 1) return `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
  const ux = dx / len, uy = dy / len, hx = x + dx, hy = y + dy;
  const bx = hx - ux * head, by = hy - uy * head;
  const px = -uy * head * 0.45, py = ux * head * 0.45;
  let s = `<line x1="${x}" y1="${y}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${color}" stroke-width="${width}"${dashed ? ' stroke-dasharray="6 4"' : ''}/>`;
  s += `<polygon points="${hx.toFixed(1)},${hy.toFixed(1)} ${(bx + px).toFixed(1)},${(by + py).toFixed(1)} ${(bx - px).toFixed(1)},${(by - py).toFixed(1)}" fill="${color}"/>`;
  if (label) {
    const anchor = lanchor || (Math.abs(ux) > 0.5 ? (ux > 0 ? 'start' : 'end') : 'middle');
    const tx = hx + ux * 8 + lx, ty = hy + uy * 8 + (uy > 0.5 ? 12 : uy < -0.5 ? -4 : 5) + ly;
    s += text(tx.toFixed(1), ty.toFixed(1), label, { size: lsize, color, anchor, weight: 'bold' });
  }
  return s;
}
export const dot = (x, y, r = 4, color = INK) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
export const line = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.color || INK}" stroke-width="${o.width || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
export const rect = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${o.rx ? ` rx="${o.rx}"` : ''} fill="${o.fill || 'none'}" stroke="${o.stroke || INK}" stroke-width="${o.sw ?? 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;

/* The ground: a line with hatching underneath. */
export function ground(x1, x2, y, o = {}) {
  let s = line(x1, y, x2, y, { width: 2.5 });
  if (o.hatch !== false) for (let x = x1 + 6; x < x2; x += 14) s += line(x, y + 1, x - 9, y + 10, { color: '#8A8F8C', width: 1.3 });
  return s;
}
/* A lab cart: body, two wheels, a label inside. (x, y) is the left end of the
   wheels' contact line (the track top). */
export function cart(x, y, w = 90, o = {}) {
  const { label = '', sub = '', fill = '#F6E7C8', h = 42 } = o;
  const r = 9, top = y - 2 * r - h + 4;
  let s = `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${INK}" stroke-width="2"/>`;
  s += `<circle cx="${x + 20}" cy="${y - r}" r="${r}" fill="#3B4442" stroke="${INK}" stroke-width="1.5"/><circle cx="${x + w - 20}" cy="${y - r}" r="${r}" fill="#3B4442" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<circle cx="${x + 20}" cy="${y - r}" r="3" fill="#D7D2C8"/><circle cx="${x + w - 20}" cy="${y - r}" r="3" fill="#D7D2C8"/>`;
  if (label) s += text(x + w / 2, top + (sub ? 15 : h / 2 + 5), label, { size: 14, anchor: 'middle', weight: 'bold' });
  if (sub) s += text(x + w / 2, top + 32, sub, { size: 12, anchor: 'middle' });
  return s;
}
export const cartTop = (y, h = 42) => y - 18 - h + 4;
/* A track (a cart rail) seen from the side. */
export function track(x1, x2, y) {
  return `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="7" fill="#C9C3B6" stroke="${INK}" stroke-width="1.5"/>` +
    `<rect x="${x1 + 10}" y="${y + 7}" width="8" height="14" fill="#8A8F8C"/><rect x="${x2 - 18}" y="${y + 7}" width="8" height="14" fill="#8A8F8C"/>`;
}
/* A wooden crate. */
export function crate(x, y, w, h, label = '') {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#D9B27C" stroke="${INK}" stroke-width="2"/>`;
  s += `<rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" fill="none" stroke="#9C7440" stroke-width="2"/>`;
  s += line(x + 5, y + 5, x + w - 5, y + h - 5, { color: '#9C7440', width: 2 }) + line(x + w - 5, y + 5, x + 5, y + h - 5, { color: '#9C7440', width: 2 });
  if (label) s += `<rect x="${x + w / 2 - 26}" y="${y + h / 2 - 11}" width="52" height="20" fill="#F6E7C8" stroke="${INK}" stroke-width="1"/>` + text(x + w / 2, y + h / 2 + 4, label, { size: 13, anchor: 'middle', weight: 'bold' });
  return s;
}
/* A coil spring from (x1, y) to (x2, y). */
export function spring(x1, x2, y, o = {}) {
  const { coils = 8, amp = 9, color = C.spring } = o;
  const n = coils * 2, dx = (x2 - x1 - 16) / n;
  let d = `M${x1},${y} L${x1 + 8},${y}`;
  for (let i = 0; i < n; i++) d += ` L${(x1 + 8 + dx * (i + 0.5)).toFixed(1)},${(y + (i % 2 ? amp : -amp)).toFixed(1)}`;
  d += ` L${x2 - 8},${y} L${x2},${y}`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>`;
}
export function wall(x, y1, y2, side = 'left') {
  const s = side === 'left' ? -1 : 1;
  let out = `<rect x="${side === 'left' ? x - 12 : x}" y="${y1}" width="12" height="${y2 - y1}" fill="#CFC9BD" stroke="${INK}" stroke-width="2"/>`;
  for (let y = y1 + 8; y < y2; y += 14) out += line(x + s * 12, y, x + s * 2, y + 8, { color: '#8A8F8C', width: 1.2 });
  return out;
}
export function ball(x, y, r, fill = '#E07B39') {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="2"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.25}" fill="#fff" opacity="0.55"/>`;
}
/* A dashed system boundary. */
export const boundary = (x, y, w, h, label, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${o.fill || 'none'}" stroke="${AMBER}" stroke-width="2" stroke-dasharray="8 5"/>` + (label ? text(o.lx ?? x + 10, o.ly ?? y - 7, label, { size: 13, color: AMBER, weight: 'bold' }) : '');
/* A small bar chart: bars [{ name, v, color }] on a zero line; unit is px per unit. */
export function bars(x, y0, list, o = {}) {
  const { unit = 12, bw = 30, gap = 12, title = '', lsize = 13, max } = o;
  let s = '';
  const w = list.length * (bw + gap) - gap;
  const top = max != null ? max * unit : Math.max(...list.map(b => Math.abs(b.v))) * unit;
  s += line(x - 6, y0, x + w + 6, y0, { width: 1.8 });
  list.forEach((b, i) => {
    const bx = x + i * (bw + gap), h = b.v * unit;
    if (Math.abs(b.v) > 0) s += `<rect x="${bx}" y="${h >= 0 ? y0 - h : y0}" width="${bw}" height="${Math.abs(h)}" fill="${b.color}" stroke="${INK}" stroke-width="1"/>`;
    s += text(bx + bw / 2, y0 + 17, b.name, { size: lsize, anchor: 'middle' });
    if (b.show) s += text(bx + bw / 2, (h >= 0 ? y0 - h : y0 - h) + (h >= 0 ? -5 : 14), b.show, { size: 12, anchor: 'middle', color: MUTED });
  });
  if (title) s += text(x + w / 2, y0 - top - 12, title, { size: 13, anchor: 'middle', weight: 'bold' });
  return s;
}

/* A standalone figure file. */
export function figureSvg(w, h, title, desc, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">` +
    `<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>` +
    `<rect width="${w}" height="${h}" fill="#FFFFFF"/>${inner}</svg>\n`;
}
/* An inline stimulus SVG (role="img" with an aria-label; white background so it
   reads the same in dark mode). */
export function sceneSvg(w, h, label, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" style="max-width:100%;height:auto;background:#fff">` +
    `<rect width="${w}" height="${h}" fill="#FFFFFF"/>${inner}</svg>`;
}

/* ------------------------------------------------------------- figures */

export const FIGURES = {};
// Stimulus mode: the same scene for a question, without the parts that give
// the answer away (conclusions, bars, ratios). Set by stimSvg().
let STIM = false;
/* A figure's scene as an inline question stimulus (role="img", aria-label). */
export function stimSvg(id, label, ...args) {
  STIM = true;
  try {
    const svg = FIGURES[id](...args);
    return svg.replace(/^<svg [^>]*viewBox="([^"]+)"[^>]*><title[^>]*>[\s\S]*?<\/desc>/, (m, vb) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${esc(label)}" style="max-width:100%;height:auto;background:#fff">`).trim();
  } finally { STIM = false; }
}

// 3.1: twice the speed, four times the kinetic energy (and the braking distance).
FIGURES['ke-speed-squared'] = () => {
  const W = 760, H = 330;
  let s = text(24, 30, STIM ? 'The same car at two speeds, braking on the same road' : 'Same car, same brakes: twice the speed means four times the kinetic energy', { size: 16, weight: 'bold' });
  const rows = [{ y: 120, v: 10, d: 1, k: 1 }, { y: 250, v: 20, d: 4, k: 4 }];
  for (const r of rows) {
    s += ground(20, 600, r.y);
    // car body
    const x = 40;
    s += `<path d="M${x},${r.y - 14} L${x},${r.y - 38} Q${x + 4},${r.y - 44} ${x + 18},${r.y - 44} L${x + 40},${r.y - 44} L${x + 58},${r.y - 64} L${x + 104},${r.y - 64} L${x + 124},${r.y - 44} L${x + 140},${r.y - 42} Q${x + 150},${r.y - 40} ${x + 150},${r.y - 30} L${x + 150},${r.y - 14} Z" fill="#9CC3E0" stroke="${INK}" stroke-width="2"/>`;
    s += `<path d="M${x + 62},${r.y - 46} L${x + 72},${r.y - 59} L${x + 98},${r.y - 59} L${x + 112},${r.y - 46} Z" fill="#EAF3FA" stroke="${INK}" stroke-width="1.5"/>`;
    s += `<circle cx="${x + 34}" cy="${r.y - 12}" r="12" fill="#3B4442" stroke="${INK}" stroke-width="1.5"/><circle cx="${x + 118}" cy="${r.y - 12}" r="12" fill="#3B4442" stroke="${INK}" stroke-width="1.5"/>`;
    s += `<circle cx="${x + 34}" cy="${r.y - 12}" r="4" fill="#D7D2C8"/><circle cx="${x + 118}" cy="${r.y - 12}" r="4" fill="#D7D2C8"/>`;
    s += arrow(x + 160, r.y - 40, 4.4 * r.v, 0, C.vel, { label: `v = ${r.v} m/s` });
    // braking distance
    const bx = 200, bw = 90 * r.d;
    if (STIM) continue;
    s += line(bx, r.y + 22, bx + bw, r.y + 22, { color: AMBER, width: 2 }) + line(bx, r.y + 16, bx, r.y + 28, { color: AMBER }) + line(bx + bw, r.y + 16, bx + bw, r.y + 28, { color: AMBER });
    s += text(bx + bw / 2, r.y + 42, r.d === 1 ? 'braking distance d' : 'braking distance 4d', { size: 13, anchor: 'middle', color: AMBER, weight: 'bold' });
    // K bar
    s += bars(650, r.y + 10, [{ name: 'K', v: r.k, color: BAR.K, show: r.k === 1 ? 'K' : '4K' }], { unit: 17, bw: 34 });
  }
  if (!STIM) s += text(667, 36, 'Kinetic', { size: 13, anchor: 'middle', weight: 'bold' }) + text(667, 52, 'energy', { size: 13, anchor: 'middle', weight: 'bold' });
  if (!STIM) s += text(24, 318, 'K = ½mv²: the speed is squared, so doubling v multiplies K by 2² = 4.', { size: 14, color: AMBER, weight: 'bold' });
  return figureSvg(W, H, 'Kinetic energy grows with the square of speed',
    'The same car drawn twice on a road. At 10 m/s it brakes to a stop in a distance d and has kinetic energy K. At 20 m/s, twice the speed, it has four times the kinetic energy and, with the same braking force, needs four times the distance, 4d. A bar for each car shows K and 4K.', s);
};

// 3.2: the work done by each force on a crate pulled across a rough floor.
FIGURES['work-pulled-crate'] = () => {
  const W = 760, H = 380;
  let s = text(24, 30, 'Work done by each force on a crate pulled 4.0 m to the right', { size: 16, weight: 'bold' });
  const gy = 250, cx = 200, cw = 110, ch = 80, mx = cx + cw / 2, my = gy - ch / 2;
  s += ground(20, 470, gy);
  s += crate(cx, gy - ch, cw, ch);
  // rope to a hand off to the upper right, 30 degrees
  const a = Math.PI / 6, rl = 200;
  s += line(mx, my, mx + rl * Math.cos(a), my - rl * Math.sin(a), { color: '#8B6B3E', width: 3 });
  // forces from the center of mass. Figure (no values): Fg 92, FN 58, FT 70, f 40,
  // so FN + FT sin 30° balances Fg. Stimulus (196, 174, 45.0, 28.0 N): FN nearly
  // as long as Fg and longer than FT, FT longer than f; FT and f are drawn above
  // scale so they stay readable (reviewer fix, 2026-10-12).
  const L = STIM ? { g: 92, n: 82, t: 40, f: 25 } : { g: 92, n: 58, t: 70, f: 40 };
  s += arrow(mx, my, 0, L.g, C.grav, { label: STIM ? 'F_g, Earth on crate (196 N)' : 'F_g, Earth on crate', lx: 4, lanchor: 'start' });
  s += arrow(mx, my, 0, -L.n, C.normal, { label: STIM ? 'F_N, floor on crate (174 N)' : 'F_N, floor on crate', lanchor: 'end', lx: -6, ly: -2 });
  s += arrow(mx, my, L.t * Math.cos(a), -L.t * Math.sin(a), C.tension, { label: STIM ? 'F_T, rope on crate (45.0 N)' : 'F_T, rope on crate', lx: 40 + (70 - L.t) * Math.cos(a), ly: -6 - (70 - L.t) * Math.sin(a) });
  s += arrow(mx, my, -L.f, 0, C.friction) + text(cx - 8, my + 26, STIM ? 'f_k, floor on crate (28.0 N)' : 'f_k, floor on crate', { size: 13, color: C.friction, anchor: 'end', weight: 'bold' }) + line(cx - 6, my + 18, mx - L.f + 10, my + 4, { color: C.friction, width: 1 });
  s += dot(mx, my, 4.5);
  // angle mark
  s += `<path d="M${mx + 34},${my} A34,34 0 0 0 ${(mx + 34 * Math.cos(a)).toFixed(1)},${(my - 34 * Math.sin(a)).toFixed(1)}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
  s += line(mx, my, mx + 90, my, { color: '#8A8F8C', width: 1.2, dash: '4 3' });
  s += text(mx + 38, my - 4, '30°', { size: 12 });
  // displacement
  s += arrow(cx, gy + 38, 180, 0, C.disp, { label: 'displacement d = 4.0 m', lanchor: 'start' });
  if (STIM) return figureSvg(W, 330, 't', 'd', s.replace('Work done by each force on a crate pulled 4.0 m to the right', 'A 20.0 kg crate pulled 4.00 m to the right across a rough floor').replace('displacement d = 4.0 m', 'displacement d = 4.00 m'));
  // table
  const tx = 478, ty = 70, rows = [
    ['Force', 'angle', 'work on crate', INK],
    ['F_T (rope)', '30°', '+F_T d cos 30°', C.tension],
    ['f_k (floor)', '180°', '−f_k d', C.friction],
    ['F_N (floor)', '90°', '0', C.normal],
    ['F_g (Earth)', '90°', '0', C.grav],
  ];
  s += rect(tx - 10, ty - 22, 276, 26 + 34 * (rows.length - 1) + 12, { fill: '#FBF8F2', sw: 1.2 });
  rows.forEach((r, i) => {
    const y = ty + i * 34, b = i === 0 ? 'bold' : 'normal';
    s += text(tx, y, r[0], { size: 13, color: r[3], weight: i === 0 ? 'bold' : 'bold' }) + text(tx + 100, y, r[1], { size: 13, weight: b }) + text(tx + 152, y, r[2], { size: 13, weight: b });
    if (i === 0) s += line(tx - 4, y + 10, tx + 260, y + 10, { width: 1 });
  });
  s += text(tx, ty + 175, 'Net work = sum of the four = ΔK', { size: 14, color: AMBER, weight: 'bold' });
  s += text(tx, ty + 195, 'W = F d cos θ (θ from the force to d)', { size: 13 });
  s += text(24, 362, 'Forces at right angles to the displacement do no work; a force against the motion does negative work.', { size: 13, color: MUTED });
  return figureSvg(W, H, 'Work done by the forces on a pulled crate',
    'A crate on a rough floor is pulled to the right by a rope at 30 degrees above the horizontal and moves 4.0 m to the right. Four forces act on it, drawn from its center: the rope\'s tension up and to the right, kinetic friction from the floor to the left, the normal force from the floor up, and the gravitational force from Earth down. A table gives the work each does: tension does positive work F_T d cos 30°, friction does negative work minus f_k d, and the normal and gravitational forces, at 90 degrees to the displacement, do zero work. The net work equals the change in kinetic energy.', s);
};

// 3.3: potential energy belongs to a system, with a chosen zero.
FIGURES['pe-belongs-to-system'] = () => {
  const W = 760, H = 410;
  let s = text(24, 30, 'Potential energy belongs to a system of interacting objects', { size: 16, weight: 'bold' });
  // left panel: ball and Earth
  const gy = 300;
  s += `<path d="M30,${gy} L350,${gy} L350,${gy + 50} L30,${gy + 50} Z" fill="#CDE3C3"/>` + ground(30, 350, gy, { hatch: false });
  s += text(190, gy + 32, 'Earth', { size: 14, anchor: 'middle', weight: 'bold' });
  s += line(40, 240, 340, 240, { color: AMBER, width: 1.5, dash: '7 5' }) + text(44, 234, 'chosen zero: U_g = 0 (table top)', { size: 12, color: AMBER });
  s += `<rect x="110" y="240" width="120" height="12" fill="#B08A5A" stroke="${INK}" stroke-width="1.5"/><rect x="118" y="252" width="10" height="48" fill="#B08A5A" stroke="${INK}" stroke-width="1.2"/><rect x="212" y="252" width="10" height="48" fill="#B08A5A" stroke="${INK}" stroke-width="1.2"/>`;
  s += ball(170, 110, 16);
  s += line(270, 110, 270, 240, { width: 1.5 }) + line(262, 110, 278, 110, { width: 1.5 }) + line(262, 240, 278, 240, { width: 1.5 });
  s += text(280, 180, 'Δy', { size: 14, weight: 'bold' });
  s += boundary(36, 76, 320, 290, 'System: ball + Earth');
  s += text(52, 108, 'U_g = mgΔy', { size: 14, color: C.grav, weight: 'bold' });
  // right panel: block and spring
  const ry = 230;
  s += ground(400, 740, ry);
  s += wall(412, 140, ry, 'left');
  s += spring(412, 560, ry - 30, { coils: 9, amp: 11 });
  s += `<rect x="560" y="${ry - 60}" width="70" height="60" fill="#9CC3E0" stroke="${INK}" stroke-width="2"/>` + text(595, ry - 25, 'block', { size: 13, anchor: 'middle' });
  s += line(560, ry + 34, 640, ry + 34, { width: 1.5 }) + line(560, ry + 28, 560, ry + 40, { width: 1.5 }) + line(640, ry + 28, 640, ry + 40, { width: 1.5 });
  s += line(640, ry - 70, 640, ry + 40, { color: '#8A8F8C', width: 1.2, dash: '4 3' }) + text(636, ry - 74, 'end of relaxed spring', { size: 11, color: MUTED, anchor: 'end' });
  s += text(600, ry + 54, 'Δx (compression)', { size: 13, anchor: 'middle', weight: 'bold' });
  s += boundary(392, 108, 352, 186, 'System: block + spring');
  s += text(420, 136, 'U_s = ½k(Δx)²', { size: 14, color: C.spring, weight: 'bold' });
  s += text(24, 396, 'Lift the ball or squeeze the spring and the system stores energy. A single object alone has no potential energy.', { size: 13, color: MUTED });
  return figureSvg(W, H, 'Potential energy belongs to a system',
    'Left: a ball held above a table, with Earth below. A dashed boundary around the ball and Earth marks the system; its gravitational potential energy is U_g = mgΔy measured from a chosen zero, here the table top. Right: a block pressed against a spring fixed to a wall, compressed by Δx from its relaxed length. A dashed boundary around the block and spring marks the system; its elastic potential energy is U_s = ½k(Δx)².', s);
};

// 3.4: a cart on a frictionless curved track with energy bar charts at three points.
FIGURES['energy-track-bars'] = () => {
  const W = 760, H = 440;
  let s = text(24, 30, STIM ? 'A 2.0 kg block on a frictionless track, released from rest at A' : 'Block + track + Earth system, no friction: K + U_g stays the same', { size: 16, weight: 'bold' });
  // track: A (h=6) at x=80, B (h=0) at x=330, C (h=2) at x=600; scale 25 px per m, base y = 250
  const by = 250, sc = 25, X = [60, 330, 640];
  const hy = h => by - h * sc;
  s += `<path d="M30,${hy(6)} L80,${hy(6)} C170,${hy(6)} 210,${hy(0)} 330,${hy(0)} C450,${hy(0)} 520,${hy(2.6)} 600,${hy(2)} L730,${hy(2)} L730,${by + 20} L30,${by + 20} Z" fill="#EFEADF" stroke="none"/>`;
  s += `<path d="M30,${hy(6)} L80,${hy(6)} C170,${hy(6)} 210,${hy(0)} 330,${hy(0)} C450,${hy(0)} 520,${hy(2.6)} 600,${hy(2)} L730,${hy(2)}" fill="none" stroke="${INK}" stroke-width="3"/>`;
  s += line(20, by, 740, by, { color: AMBER, width: 1.4, dash: '7 5' }) + text(60, by + 16, 'U_g = 0 at B', { size: 12, color: AMBER });
  // carts
  const pts = [{ x: 60, h: 6, name: 'A', note: 'released from rest' }, { x: 330, h: 0, name: 'B', note: 'lowest point' }, { x: 650, h: 2, name: 'C', note: '' }];
  for (const p of pts) {
    s += `<rect x="${p.x - 13}" y="${hy(p.h) - 20}" width="26" height="20" fill="#9CC3E0" stroke="${INK}" stroke-width="2"/>`;
    s += text(p.x, hy(p.h) - 30, p.name, { size: 16, anchor: 'middle', weight: 'bold' });
  }
  s += line(700, hy(2), 700, by, { width: 1.3 }) + text(706, (hy(2) + by) / 2 + 4, '2.0 m', { size: 12 });
  s += line(18, hy(6), 18, by, { width: 1.3 }) + text(24, hy(3.6), '6.0 m', { size: 12 });
  s += arrow(360, by - 22, 60, 0, C.vel, { label: 'v' });
  // bar charts
  if (STIM) return figureSvg(W, 300, 't', 'd', s);
  const charts = [{ x: 70, k: 0, u: 6, t: 'At A' }, { x: 320, k: 6, u: 0, t: 'At B' }, { x: 560, k: 4, u: 2, t: 'At C' }];
  for (const c of charts) {
    s += bars(c.x, 405, [{ name: 'K', v: c.k, color: BAR.K }, { name: 'U_g', v: c.u, color: BAR.Ug }, { name: 'Total', v: 6, color: BAR.total }], { unit: 13, bw: 30, gap: 14, title: c.t, max: 6 });
  }
  return figureSvg(W, H, 'Energy bar charts for a cart on a curved track',
    'A small block is released from rest at point A, 6.0 m above the lowest point B, on a frictionless curved track, then rises to point C, 2.0 m above B. The zero of gravitational potential energy is at B. Bar charts under each point show kinetic energy, gravitational potential energy and their total for the block, track and Earth system: at A, 6 units of U_g and no K; at B, 6 units of K and no U_g; at C, 4 units of K and 2 of U_g. The total is 6 units at every point.', s);
};

// 3.5: same work, half the time, twice the power.
FIGURES['power-two-winches'] = () => {
  const W = 760, H = 400;
  let s = text(24, 30, STIM ? 'Two winches lift identical 40.0 kg crates 3.00 m at constant speed' : 'Two winches lift identical crates 3.0 m at constant speed', { size: 16, weight: 'bold' });
  const gy = 350;
  s += ground(20, 740, gy);
  const panels = [{ x: 60, name: 'Winch X', t: STIM ? '6.00 s' : '6.0 s', v: STIM ? '0.500' : 0.5, va: 50 }, { x: 420, name: 'Winch Y', t: STIM ? '12.0 s' : '12 s', v: STIM ? '0.250' : 0.25, va: 25 }];
  for (const p of panels) {
    // frame
    s += `<rect x="${p.x}" y="70" width="12" height="${gy - 70}" fill="#8A8F8C" stroke="${INK}" stroke-width="1.5"/><rect x="${p.x}" y="62" width="150" height="12" fill="#8A8F8C" stroke="${INK}" stroke-width="1.5"/>`;
    s += `<circle cx="${p.x + 130}" cy="76" r="14" fill="#C9C3B6" stroke="${INK}" stroke-width="2"/>` + text(p.x + 40, 56, p.name, { size: 15, weight: 'bold' });
    s += `<rect x="${p.x - 2}" y="${gy - 40}" width="40" height="40" fill="#5A6268" stroke="${INK}" stroke-width="1.5"/>` + text(p.x + 18, gy - 15, 'M', { size: 13, anchor: 'middle', color: '#fff', weight: 'bold' });
    s += line(p.x + 38, gy - 30, p.x + 130, 90, { color: '#8B6B3E', width: 2 });
    s += line(p.x + 144, 76, p.x + 144, 180, { color: '#8B6B3E', width: 2.5 });
    s += crate(p.x + 114, 180, 60, 60);
    const cx = p.x + 144, cy = 210;
    s += arrow(cx, cy, 0, -62, C.tension, { label: 'F_T, cable on crate', lanchor: 'start', lx: 8, ly: 14 });
    s += arrow(cx, cy, 0, 62, C.grav, { label: 'F_g, Earth on crate', lanchor: 'start', lx: 8, ly: -14 });
    s += dot(cx, cy, 4);
    s += arrow(p.x + 210, 240, 0, -p.va * 1.4, C.vel, { label: `v = ${p.v} m/s`, lanchor: 'start', lx: 4, ly: 14 });
    s += text(p.x + 114, 318, `time to lift ${STIM ? '3.00' : '3.0'} m: ${p.t}`, { size: 13, weight: 'bold' });
  }
  if (!STIM) s += text(24, 384, 'Equal forces, equal work (F_T = F_g). X does it in half the time, so X delivers twice the power: P = W/Δt = F_T v.', { size: 13, color: AMBER, weight: 'bold' });
  return figureSvg(W, H, 'Power: the same work in less time',
    'Two winches each lift an identical crate 3.0 m at constant speed. On each crate the upward tension from the cable equals the downward gravitational force from Earth, so the forces are drawn equal. Winch X lifts its crate at 0.5 m/s and takes 6.0 s; winch Y lifts at 0.25 m/s and takes 12 s. Both do the same work, but X does it in half the time, so its power is twice as large: P = W/Δt = F_T v.', s);
};

// 4.1: equal momentum, different velocity and kinetic energy.
FIGURES['momentum-two-carts'] = () => {
  const W = 760, H = 330;
  let s = text(24, 30, 'Same momentum, different velocity and kinetic energy', { size: 16, weight: 'bold' });
  const rows = [{ y: 130, m: '2.0 kg', v: 1.0, K: '1.0 J', w: 120, name: 'Cart 1' }, { y: 260, m: '0.50 kg', v: 4.0, K: '4.0 J', w: 80, name: 'Cart 2' }];
  for (const r of rows) {
    s += track(30, 560, r.y);
    s += cart(60, r.y, r.w, { label: r.name, sub: r.m });
    const ty = cartTop(r.y);
    s += arrow(60 + r.w + 10, ty + 8, 34 * r.v, 0, C.vel, { label: `v = ${r.v.toFixed(1)} m/s` });
    if (STIM) continue;
    s += arrow(60 + r.w + 10, ty + 34, 80, 0, AMBER, { label: 'p = 2.0 kg·m/s', width: 5, head: 14 });
    s += text(600, ty + 20, `K = ½mv² = ${r.K}`, { size: 14 });
  }
  if (STIM) return figureSvg(W, 290, 't', 'd', s.replace('Same momentum, different velocity and kinetic energy', 'Two carts on level tracks'));
  s += text(24, 310, 'p = mv is a vector along the velocity. Equal momenta can carry very different kinetic energies (K = p²/2m).', { size: 13, color: MUTED });
  return figureSvg(W, H, 'Two carts with the same momentum',
    'Two carts move to the right on tracks. Cart 1 has mass 2.0 kg and velocity 1.0 m/s; cart 2 has mass 0.50 kg and velocity 4.0 m/s. Their velocity arrows differ by a factor of four, but their momentum arrows are the same length: both have momentum 2.0 kg·m/s to the right. Cart 1 has kinetic energy 1.0 J and cart 2 has 4.0 J.', s);
};

// 4.2: a ball bouncing off a wall and the force-time graph of the wall's push.
FIGURES['impulse-ball-wall'] = () => {
  const W = 760, H = 380;
  let s = text(24, 30, 'The wall\'s push on the ball: impulse is the area under F(t)', { size: 16, weight: 'bold' });
  const wy1 = 60, wy2 = 320;
  s += wall(60, wy1, wy2, 'left');
  // before
  s += text(80, 84, 'Before', { size: 14, weight: 'bold' });
  s += ball(270, 110, 18) + arrow(250, 110, -70, 0, C.vel, { label: 'v_i = 4.0 m/s' });
  // during
  s += text(80, 170, 'During contact', { size: 14, weight: 'bold' });
  s += `<ellipse cx="${74}" cy="200" rx="14" ry="20" fill="#E07B39" stroke="${INK}" stroke-width="2"/>`;
  s += arrow(74, 200, 90, 0, C.normal, { label: 'F_N, wall on ball' });
  s += dot(74, 200, 3.5);
  // after
  s += text(80, 258, 'After', { size: 14, weight: 'bold' });
  s += ball(110, 290, 18) + arrow(132, 290, 35, 0, C.vel, { label: 'v_f = 2.0 m/s' });
  // graph
  const gx = 390, gy = 300, gw = 320, gh = 210;
  s += line(gx, gy, gx + gw + 10, gy, { width: 2 }) + line(gx, gy, gx, gy - gh - 10, { width: 2 });
  s += text(gx + gw / 2, gy + 40, 'Time (ms)', { size: 13, anchor: 'middle' });
  s += `<text x="${gx - 44}" y="${gy - gh / 2}" font-family="${FONT}" font-size="13" fill="${INK}" text-anchor="middle" transform="rotate(-90 ${gx - 44} ${gy - gh / 2})">Force of wall on ball (N)</text>`;
  const sx = t => gx + t * 70, sy = f => gy - f * 0.32;
  for (let t = 0; t <= 4; t++) s += line(sx(t), gy, sx(t), gy + 5, { width: 1.5 }) + text(sx(t), gy + 20, String(t), { size: 12, anchor: 'middle' });
  for (const f of [0, 300, 600]) s += line(gx - 5, sy(f), gx, sy(f), { width: 1.5 }) + text(gx - 9, sy(f) + 4, String(f), { size: 12, anchor: 'end' });
  s += `<path d="M${sx(0)},${sy(0)} L${sx(2)},${sy(600)} L${sx(4)},${sy(0)} Z" fill="#F3DDB0" stroke="${AMBER}" stroke-width="2.5"/>`;
  if (STIM) return figureSvg(W, 340, 't', 'd', s.replace('The wall\'s push on the ball: impulse is the area under F(t)', 'A 0.20 kg ball bounces off a wall'));
  s += text(sx(2), sy(170), 'area = J', { size: 14, anchor: 'middle', color: AMBER, weight: 'bold' });
  s += text(sx(2), sy(110), '= ½(0.0040 s)(600 N)', { size: 12, anchor: 'middle', color: AMBER });
  s += text(sx(2), sy(55), '= 1.2 N·s', { size: 12, anchor: 'middle', color: AMBER });
  s += text(24, 360, 'For a 0.20 kg ball: J = Δp = (0.20 kg)(+2.0 m/s) − (0.20 kg)(−4.0 m/s) = 1.2 kg·m/s, to the right.', { size: 13, color: MUTED });
  return figureSvg(W, H, 'Impulse from a force-time graph',
    'A 0.20 kg ball moves left at 4.0 m/s toward a wall, is squashed against it while the wall pushes it to the right, and leaves moving right at 2.0 m/s. A graph of the wall\'s force on the ball against time is a triangle rising from 0 to 600 N at 2 ms and back to 0 at 4 ms. The shaded area under it is the impulse, one half times 0.0040 s times 600 N, or 1.2 N·s to the right, equal to the ball\'s change in momentum.', s);
};

// 4.3: the choice of system decides whether momentum changes.
FIGURES['momentum-system-choice'] = () => {
  const W = 760, H = 430;
  let s = text(24, 30, 'Cart A hits cart B on a level, low-friction track', { size: 16, weight: 'bold' });
  const panels = [
    { y: 190, title: 'System: cart A alone', bw: 132, l1: 'B\'s push on A crosses the boundary:', l2: 'it is an external force.', l3: 'A\'s momentum changes.' },
    { y: 380, title: 'System: carts A and B', bw: 260, l1: 'The pushes between A and B are internal;', l2: 'gravity and the normal forces balance.', l3: 'The system\'s momentum stays constant.' },
  ];
  for (const p of panels) {
    s += track(30, 400, p.y);
    s += cart(70, p.y, 110, { label: 'A' }) + cart(180, p.y, 110, { label: 'B' });
    const ty = cartTop(p.y);
    // contact forces from the contact point, labels above the carts
    s += arrow(180, ty + 30, -58, 0, C.applied, { width: 3 }) + arrow(180, ty + 30, 58, 0, C.applied, { width: 3 });
    s += text(188, ty - 8, 'A on B →', { size: 12, color: C.applied, weight: 'bold', anchor: 'start' });
    s += text(172, ty - 8, '← B on A', { size: 12, color: C.applied, weight: 'bold', anchor: 'end' });
    s += boundary(56, ty - 28, p.bw, p.y - ty + 36, p.title, { lx: 60, ly: ty - 36 });
    s += text(430, ty + 2, p.l1, { size: 13 }) + text(430, ty + 22, p.l2, { size: 13 }) + text(430, ty + 46, p.l3, { size: 14, weight: 'bold', color: AMBER });
  }
  return figureSvg(W, H, 'Choosing the system for momentum',
    'Cart A runs into cart B on a level track. Each cart pushes the other with forces of equal size in opposite directions, drawn from the contact point: B on A to the left, A on B to the right. Top: a dashed boundary around cart A alone; B\'s push crosses the boundary, so it is an external force and A\'s momentum changes. Bottom: a dashed boundary around both carts; the pushes are internal, the vertical forces balance, and the momentum of the two-cart system stays constant.', s);
};

// 4.4: elastic, inelastic and perfectly inelastic outcomes of the same collision.
FIGURES['collision-types'] = () => {
  const W = 760, H = 520;
  let s = text(24, 30, 'Cart A (1.0 kg) at 4.0 m/s hits cart B (3.0 kg) at rest: three possible outcomes', { size: 15, weight: 'bold' });
  // before row
  const by = 120;
  s += text(24, 62, 'Before', { size: 15, weight: 'bold' });
  s += track(24, 470, by) + cart(110, by, 80, { label: 'A' }) + cart(300, by, 110, { label: 'B' });
  s += arrow(150, cartTop(by) - 14, 4 * 22, 0, C.vel, { label: '+4.0 m/s' });
  s += text(355, cartTop(by) - 8, 'at rest', { size: 12, anchor: 'middle', color: MUTED });
  s += text(560, 62, 'Total p (kg·m/s)', { size: 13, weight: 'bold', color: MUTED, anchor: 'middle' }) + text(690, 62, 'Total K (J)', { size: 13, weight: 'bold', color: MUTED, anchor: 'middle' });
  s += text(560, by - 6, '4.0', { size: 14, anchor: 'middle', weight: 'bold' }) + text(690, by - 6, '8.0', { size: 14, anchor: 'middle', weight: 'bold' });
  const rows = [
    { y: 230, name: 'Elastic', va: -2.0, vb: 2.0, K: 8.0, stick: false },
    { y: 350, name: 'Inelastic', va: 0.25, vb: 1.25, K: 2.4, stick: false },
    { y: 470, name: 'Perfectly inelastic (stick)', va: 1.0, vb: 1.0, K: 2.0, stick: true },
  ];
  for (const r of rows) {
    s += text(24, r.y - 80, 'After: ' + r.name, { size: 15, weight: 'bold', color: AMBER });
    s += track(24, 470, r.y);
    const ax = r.stick ? 200 : 140, bx = r.stick ? 280 : 300;
    s += cart(ax, r.y, 80, { label: 'A' }) + cart(bx, r.y, 110, { label: 'B' });
    const ty = cartTop(r.y), ay = ty - 14;
    const fmt = v => (Number.isInteger(v * 10) ? v.toFixed(1) : v.toFixed(2)).replace('-', '−');
    if (!r.stick) {
      if (r.va < 0) s += arrow(ax + 40, ay, r.va * 22, 0, C.vel, { label: `${fmt(r.va)} m/s`, lanchor: 'end' });
      else s += arrow(ax + 40, ay, r.va * 22, 0, C.vel) + text(ax + 40, ay - 10, `+${fmt(r.va)} m/s`, { size: 13, color: C.vel, weight: 'bold', anchor: 'middle' });
      s += arrow(bx + 55, ay, r.vb * 22, 0, C.vel, { label: `+${fmt(r.vb)} m/s` });
    } else s += arrow(bx, ay, r.vb * 22, 0, C.vel, { label: '+1.0 m/s together' });
    s += text(560, r.y - 30, '4.0', { size: 14, anchor: 'middle', weight: 'bold' }) + text(560, r.y - 12, 'same', { size: 12, anchor: 'middle', color: MUTED });
    s += text(690, r.y - 30, r.K.toFixed(1), { size: 14, anchor: 'middle', weight: 'bold' }) + text(690, r.y - 12, r.K === 8 ? 'same' : 'less', { size: 12, anchor: 'middle', color: r.K === 8 ? MUTED : C.friction });
  }
  s += line(500, 44, 500, 480, { color: LIGHT, width: 1.5 });
  s += text(24, 508, 'Momentum is the same before and after every time. Kinetic energy stays the same only in the elastic collision.', { size: 13, color: MUTED });
  return figureSvg(W, H, 'Elastic, inelastic and perfectly inelastic collisions',
    'Three outcomes of the same collision: cart A, 1.0 kg at 4.0 m/s, hits cart B, 3.0 kg at rest; before, the total momentum is 4.0 kg·m/s and the kinetic energy 8.0 J. Elastic: A bounces back at 2.0 m/s and B moves off at 2.0 m/s; kinetic energy stays 8.0 J. Inelastic: A moves on at 0.25 m/s and B at 1.25 m/s; kinetic energy falls to about 2.4 J. Perfectly inelastic: the carts stick and move together at 1.0 m/s; kinetic energy falls to 2.0 J. The total momentum is 4.0 kg·m/s after every outcome.', s);
};

/* ------------------------------------------------- question and FRQ scenes */

/* A book on a shelf above a table, for zero-of-potential-energy items. */
export function sceneShelf(label) {
  let s = text(20, 26, 'A 2.0 kg book, a shelf and a table', { size: 15, weight: 'bold' });
  const fy = 300, ppm = 160; // 1.50 m shelf -> 240 px
  const y = h => fy - h * ppm;
  s += ground(20, 560, fy);
  // wall + shelf
  s += `<rect x="60" y="40" width="14" height="${fy - 40}" fill="#CFC9BD" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<rect x="74" y="${y(1.5)}" width="130" height="10" fill="#B08A5A" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<path d="M74,${y(1.5) + 10} L110,${y(1.5) + 10} L74,${y(1.5) + 40} Z" fill="#B08A5A" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<rect x="120" y="${y(1.5) - 22}" width="60" height="22" fill="#2F6F9F" stroke="${INK}" stroke-width="1.5"/><rect x="124" y="${y(1.5) - 18}" width="52" height="4" fill="#fff" opacity="0.6"/>`;
  // table
  s += `<rect x="300" y="${y(0.8)}" width="170" height="12" fill="#B08A5A" stroke="${INK}" stroke-width="1.5"/><rect x="312" y="${y(0.8) + 12}" width="12" height="${0.8 * ppm - 12}" fill="#B08A5A" stroke="${INK}" stroke-width="1.2"/><rect x="446" y="${y(0.8) + 12}" width="12" height="${0.8 * ppm - 12}" fill="#B08A5A" stroke="${INK}" stroke-width="1.2"/>`;
  // dimension lines
  const dim = (x, h1, h2, t) => line(x, y(h1), x, y(h2), { width: 1.4 }) + line(x - 6, y(h1), x + 6, y(h1), { width: 1.4 }) + line(x - 6, y(h2), x + 6, y(h2), { width: 1.4 }) + text(x + 8, (y(h1) + y(h2)) / 2 + 5, t, { size: 13, weight: 'bold' });
  s += line(180, y(1.5), 520, y(1.5), { color: '#8A8F8C', width: 1, dash: '4 3' });
  s += dim(230, 0, 1.5, '1.50 m') + dim(500, 0, 0.8, '0.80 m');
  s += text(330, y(0.8) - 10, 'table top', { size: 12, color: MUTED }) + text(90, fy + 26, 'floor', { size: 12, color: MUTED });
  return sceneSvg(580, 330, label, s);
}

/* Two carts before and after a collision on a level track. o = { mA, mB, before: [vA, vB], after: [vA, vB] | null, latched, unknownB, ppv, over } */
export function sceneCarts(label, o) {
  const H = o.after ? 300 : 170;
  let s = '';
  const row = (y, vs, title, unknownB, latched) => {
    let r = text(20, y - 92, title, { size: 15, weight: 'bold', color: AMBER });
    r += track(20, 620, y);
    const ax = latched ? 230 : 120, bx = latched ? 330 : 360;
    r += cart(ax, y, 100, { label: 'A', sub: o.mA }) + cart(bx, y, 120, { label: 'B', sub: o.mB });
    const ty = cartTop(y), ay = ty - 14;
    // o.ppv: arrow pixels per m/s (default 60). o.over: labels centred above the
    // arrows, for carts moving toward each other (their labels would collide).
    const ppv = o.ppv || 60;
    const v = (x, val, lbl) => {
      if (val === 0) return text(x, ay, 'at rest', { size: 13, anchor: 'middle', color: MUTED });
      const len = Math.sign(val) * Math.max(30, Math.abs(val) * ppv);
      return o.over ? arrow(x, ay, len, 0, C.vel) + text(x + len / 2, ay - 10, lbl, { size: 13, anchor: 'middle', color: C.vel, weight: 'bold' }) : arrow(x, ay, len, 0, C.vel, { label: lbl });
    };
    if (latched) r += unknownB ? text(bx, ay, 'stuck together: v_f = ?', { size: 14, anchor: 'middle', weight: 'bold', color: C.vel }) : v(bx, vs[0], `${vs[0] > 0 ? '+' : '−'}${Math.abs(vs[0]).toFixed(2)} m/s together`);
    else {
      r += v(ax + 50, vs[0], `${vs[0] > 0 ? '+' : '−'}${Math.abs(vs[0]).toFixed(2)} m/s`);
      r += unknownB ? text(bx + 60, ay, 'v_B = ?', { size: 14, anchor: 'middle', weight: 'bold', color: C.vel }) : v(bx + 60, vs[1], `${vs[1] > 0 ? '+' : '−'}${Math.abs(vs[1]).toFixed(2)} m/s`);
    }
    return r;
  };
  s += row(140, o.before, 'Before', false, false);
  if (o.after) s += row(280, o.after, 'After', o.unknownB, o.latched);
  s += text(620, 24, 'positive to the right →', { size: 12, anchor: 'end', color: MUTED });
  return sceneSvg(640, H, label, s);
}

/* A dart flying into a block on a smooth table that then slides onto a rough patch. */
export function sceneDart(label) {
  let s = text(20, 26, 'A dart hits a block and stays in it', { size: 15, weight: 'bold' });
  const gy = 190;
  s += `<rect x="20" y="${gy}" width="380" height="8" fill="#DCE8F1" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<rect x="400" y="${gy}" width="220" height="8" fill="#C9A27A" stroke="${INK}" stroke-width="1.2"/>`;
  for (let x = 406; x < 620; x += 10) s += line(x, gy + 2, x + 5, gy + 6, { color: '#8B6B3E', width: 1 });
  s += text(200, gy + 28, 'smooth (no friction)', { size: 12, anchor: 'middle', color: MUTED }) + text(510, gy + 28, 'rough patch, μ_k = 0.40', { size: 12, anchor: 'middle', color: MUTED });
  s += `<rect x="260" y="${gy - 60}" width="90" height="60" fill="#D9B27C" stroke="${INK}" stroke-width="2"/>` + text(305, gy - 34, 'block', { size: 13, anchor: 'middle', weight: 'bold' }) + text(305, gy - 16, '0.450 kg', { size: 12, anchor: 'middle' });
  // dart
  const dy = gy - 30;
  s += `<path d="M90,${dy - 3} L150,${dy - 3} L162,${dy} L150,${dy + 3} L90,${dy + 3} Z" fill="#5A6268" stroke="${INK}" stroke-width="1.2"/><path d="M90,${dy} L76,${dy - 9} L84,${dy} L76,${dy + 9} Z" fill="#D55E00"/>`;
  s += text(118, dy - 12, 'dart, 0.050 kg', { size: 12, anchor: 'middle' });
  s += arrow(170, dy, 60, 0, C.vel) + text(200, dy - 12, '40 m/s', { size: 13, color: C.vel, weight: 'bold', anchor: 'middle' });
  return sceneSvg(640, 240, label, s);
}

/* Spring, rough patch, frictionless curved ramp (TBR FRQ). */
export function sceneSpringPatchRamp(label) {
  let s = '';
  const gy = 220;
  s += wall(40, 140, gy, 'left');
  s += line(40, gy, 230, gy, { width: 2.5 });
  s += `<rect x="230" y="${gy}" width="170" height="8" fill="#C9A27A" stroke="${INK}" stroke-width="1.2"/>`;
  for (let x = 236; x < 400; x += 10) s += line(x, gy + 2, x + 5, gy + 6, { color: '#8B6B3E', width: 1 });
  s += `<path d="M400,${gy} L470,${gy} C560,${gy} 600,${gy - 40} 640,${gy - 150}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
  s += spring(40, 130, gy - 22, { coils: 7, amp: 10 });
  s += `<rect x="130" y="${gy - 44}" width="46" height="44" fill="#9CC3E0" stroke="${INK}" stroke-width="2"/>` + text(153, gy - 17, 'm', { size: 15, anchor: 'middle', weight: 'bold', italic: true });
  s += text(130, gy + 34, 'spring compressed by x', { size: 12, anchor: 'middle', color: MUTED });
  s += line(230, gy + 40, 400, gy + 40, { width: 1.3 }) + line(230, gy + 34, 230, gy + 46, { width: 1.3 }) + line(400, gy + 34, 400, gy + 46, { width: 1.3 });
  s += text(315, gy + 58, 'rough patch, length D, coefficient μ', { size: 12, anchor: 'middle' });
  s += text(560, gy + 30, 'frictionless ramp', { size: 12, anchor: 'middle', color: MUTED });
  s += text(153, gy - 52, 'P (released)', { size: 13, weight: 'bold', anchor: 'middle' }) + text(400, gy - 14, 'Q', { size: 14, weight: 'bold', anchor: 'middle' }) + line(400, gy - 10, 400, gy, { width: 1.2 });
  s += line(392, gy - 6, 400, gy, { width: 1 });
  s += text(616, gy - 160, 'R (highest point)', { size: 12, anchor: 'end' });
  s += text(20, 24, 'Everything level except the ramp; the floor left of the patch is frictionless.', { size: 13 });
  return sceneSvg(660, 290, label, s);
}

/* A vertical spring launcher (LAB FRQ). */
export function sceneLauncher(label) {
  let s = text(20, 26, 'A vertical spring launcher', { size: 15, weight: 'bold' });
  const bx = 150, gy = 330;
  s += ground(40, 460, gy);
  s += `<rect x="${bx - 22}" y="${gy - 160}" width="44" height="160" fill="#F2F0EA" stroke="${INK}" stroke-width="2"/>`;
  // spring drawn vertically
  let d = `M${bx},${gy} L${bx},${gy - 8}`;
  for (let i = 0; i < 12; i++) d += ` L${bx + (i % 2 ? 12 : -12)},${gy - 12 - i * 7}`;
  d += ` L${bx},${gy - 100}`;
  s += `<path d="${d}" fill="none" stroke="${C.spring}" stroke-width="2.5"/>`;
  s += `<rect x="${bx - 18}" y="${gy - 106}" width="36" height="6" fill="#5A6268"/>`;
  s += ball(bx, gy - 118, 12);
  s += text(bx - 30, gy - 60, 'spring', { size: 12, anchor: 'end', color: MUTED }) + text(bx - 30, gy - 44, 'compressed', { size: 12, anchor: 'end', color: MUTED }) + text(bx - 30, gy - 28, 'by x', { size: 12, anchor: 'end', color: MUTED });
  // meter stick
  s += `<rect x="300" y="60" width="18" height="${gy - 60}" fill="#F3DDB0" stroke="${INK}" stroke-width="1.2"/>`;
  for (let i = 0; i <= 13; i++) s += line(300, gy - i * 20, 308, gy - i * 20, { width: 1 });
  s += text(326, 70, 'meterstick', { size: 12 });
  s += line(bx + 14, gy - 118, 300, gy - 118, { color: '#8A8F8C', width: 1, dash: '4 3' }) + text(bx + 24, gy - 124, 'launch point', { size: 12, color: MUTED }) + line(bx + 14, 70, 300, 70, { color: '#8A8F8C', width: 1, dash: '4 3' });
  s += ball(bx, 70, 12) + text(bx - 22, 74, 'top of flight', { size: 12, anchor: 'end', color: MUTED });
  s += line(250, 70, 250, gy - 118, { width: 1.4 }) + text(256, 180, 'h', { size: 15, weight: 'bold', italic: true });
  return sceneSvg(480, 360, label, s);
}

/* Two pucks on ice, one at rest (QQT FRQ, momentum). */
export function scenePucks(label) {
  let s = text(20, 26, 'Puck A slides toward puck B, which is at rest, on level ice', { size: 15, weight: 'bold' });
  const y = 110;
  s += `<rect x="20" y="${y + 22}" width="600" height="10" fill="#E3F0F7" stroke="${INK}" stroke-width="1"/>`;
  s += `<ellipse cx="140" cy="${y + 14}" rx="38" ry="10" fill="#3B4442" stroke="${INK}" stroke-width="1.5"/><rect x="102" y="${y}" width="76" height="14" fill="#3B4442"/><ellipse cx="140" cy="${y}" rx="38" ry="10" fill="#5A6268" stroke="${INK}" stroke-width="1.5"/>`;
  s += text(140, y - 20, 'A, mass m', { size: 13, anchor: 'middle', weight: 'bold' });
  s += arrow(186, y + 4, 80, 0, C.vel, { label: 'v₀' });
  s += `<ellipse cx="440" cy="${y + 14}" rx="54" ry="12" fill="#734200" stroke="${INK}" stroke-width="1.5"/><rect x="386" y="${y - 2}" width="108" height="16" fill="#734200"/><ellipse cx="440" cy="${y - 2}" rx="54" ry="12" fill="#A86A1F" stroke="${INK}" stroke-width="1.5"/>`;
  s += text(440, y - 24, 'B, mass M, at rest', { size: 13, anchor: 'middle', weight: 'bold' });
  s += text(20, y + 60, 'Velcro on the facing edges: when A hits B they latch and slide on together.', { size: 13, color: MUTED });
  return sceneSvg(640, 190, label, s);
}

/* Two blocks on a frictionless floor with a latch, then a frictionless ramp (MR FRQ). */
export function sceneBlocksRamp(label) {
  let s = '';
  const gy = 200;
  s += `<path d="M20,${gy} L460,${gy} C540,${gy} 580,${gy - 30} 630,${gy - 130}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
  s += `<path d="M20,${gy} L460,${gy} C540,${gy} 580,${gy - 30} 630,${gy - 130} L630,${gy + 20} L20,${gy + 20} Z" fill="#EFEADF"/>`;
  s += `<rect x="80" y="${gy - 40}" width="50" height="40" fill="#9CC3E0" stroke="${INK}" stroke-width="2"/>` + text(105, gy - 15, 'A', { size: 15, anchor: 'middle', weight: 'bold' });
  s += text(105, gy - 50, 'mass m', { size: 12, anchor: 'middle' });
  s += arrow(136, gy - 20, 70, 0, C.vel, { label: 'v₀' });
  s += `<rect x="290" y="${gy - 52}" width="80" height="52" fill="#D9B27C" stroke="${INK}" stroke-width="2"/>` + text(330, gy - 21, 'B', { size: 15, anchor: 'middle', weight: 'bold' });
  s += text(330, gy - 62, 'mass 2m, at rest', { size: 12, anchor: 'middle' });
  s += text(20, 24, 'Level floor and curved ramp, both frictionless. Velcro on the facing sides of A and B.', { size: 13 });
  s += line(600, gy - 92, 600, gy, { color: '#8A8F8C', width: 1, dash: '4 3' }) + text(606, gy - 40, 'h ?', { size: 14, weight: 'bold', italic: true });
  return sceneSvg(660, 240, label, s);
}

/* ------------------------------------------------------------- main */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const out = process.env.FIG_OUT || join(ROOT, 'physics', 'figures');
  mkdirSync(out, { recursive: true });
  for (const [id, f] of Object.entries(FIGURES)) writeFileSync(join(out, `${id}.svg`), f());
  console.log(`wrote ${Object.keys(FIGURES).length} figures to ${out}`);
}
