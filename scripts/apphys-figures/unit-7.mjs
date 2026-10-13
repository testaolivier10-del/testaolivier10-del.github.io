/* Figures for AP® Physics 1 Unit 7 (Oscillations), and the small drawing kit
   that Unit 8 (scripts/apphys-figures/unit-8.mjs) and the Unit 7-8 question
   stimuli reuse. Run:  node scripts/apphys-figures/unit-7.mjs
   Writes physics/figures/<id>.svg. Every figure is a standalone SVG with a
   white background, role="img", <title> and <desc>, Arial/Helvetica, ink
   #1F2A28, amber #734200 for emphasis and the force colours of the trainers. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const C = {
  ink: '#1F2A28', amber: '#734200', grey: '#5A6268', light: '#C9CFCC', pale: '#EEF1EF',
  gravity: '#0072B2', normal: '#009E73', tension: '#7A4F9E', friction: '#D55E00', spring: '#CC79A7',
  applied: '#5A6268', buoyant: '#3E9BC8', velocity: '#B07A00', accel: '#A33B26',
  water: '#D7EBF4', waterEdge: '#7FB6CF', wood: '#E9D8B8', metal: '#B9C2C7', cart: '#E6E0D2',
};
const r1 = v => Math.round(v * 10) / 10;
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Text. o: { size, anchor, color, weight, italic } */
export function text(x, y, s, o = {}) {
  const a = [`x="${r1(x)}"`, `y="${r1(y)}"`, `font-size="${o.size || 14}"`, `fill="${o.color || C.ink}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.weight) a.push(`font-weight="${o.weight}"`);
  if (o.italic) a.push('font-style="italic"');
  return `<text ${a.join(' ')}>${s}</text>`;
}
/* A straight arrow from (x1,y1) to (x2,y2) with a filled head. */
export function arrow(x1, y1, x2, y2, color = C.ink, o = {}) {
  const w = o.width || 3, head = o.head || 11, hw = o.headWidth || 6;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const bx = x2 - ux * head, by = y2 - uy * head;
  const dash = o.dash ? ` stroke-dasharray="${o.dash}"` : '';
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(bx)}" y2="${r1(by)}" stroke="${color}" stroke-width="${w}"${dash} stroke-linecap="butt"/>` +
    `<polygon points="${r1(x2)},${r1(y2)} ${r1(bx - uy * hw)},${r1(by + ux * hw)} ${r1(bx + uy * hw)},${r1(by - ux * hw)}" fill="${color}"/>`;
}
/* A two-headed dimension line with a label beside it. */
export function dim(x1, y1, x2, y2, label, o = {}) {
  const c = o.color || C.grey;
  const s = arrow((x1 + x2) / 2, (y1 + y2) / 2, x1, y1, c, { width: 1.4, head: 8, headWidth: 4 }) + arrow((x1 + x2) / 2, (y1 + y2) / 2, x2, y2, c, { width: 1.4, head: 8, headWidth: 4 });
  return s + (label ? text(o.lx ?? (x1 + x2) / 2, o.ly ?? (y1 + y2) / 2 - 6, label, { size: o.size || 13, anchor: o.anchor || 'middle', color: o.lcolor || C.ink, italic: o.italic }) : '');
}
/* A coil spring between two x positions at height y (horizontal) . */
export function springH(x1, x2, y, o = {}) {
  const n = o.coils || 10, amp = o.amp || 9, lead = Math.min(10, (x2 - x1) * 0.08);
  const pts = [[x1, y], [x1 + lead, y]];
  const span = x2 - x1 - 2 * lead;
  for (let i = 0; i < n * 2; i++) pts.push([x1 + lead + span * (i + 0.5) / (n * 2), y + (i % 2 ? amp : -amp)]);
  pts.push([x2 - lead, y], [x2, y]);
  return `<polyline points="${pts.map(p => `${r1(p[0])},${r1(p[1])}`).join(' ')}" fill="none" stroke="${o.color || C.ink}" stroke-width="${o.width || 2}" stroke-linejoin="round"/>`;
}
export function springV(x, y1, y2, o = {}) {
  const n = o.coils || 10, amp = o.amp || 9, lead = Math.min(10, (y2 - y1) * 0.08);
  const pts = [[x, y1], [x, y1 + lead]];
  const span = y2 - y1 - 2 * lead;
  for (let i = 0; i < n * 2; i++) pts.push([x + (i % 2 ? amp : -amp), y1 + lead + span * (i + 0.5) / (n * 2)]);
  pts.push([x, y2 - lead], [x, y2]);
  return `<polyline points="${pts.map(p => `${r1(p[0])},${r1(p[1])}`).join(' ')}" fill="none" stroke="${o.color || C.ink}" stroke-width="${o.width || 2}" stroke-linejoin="round"/>`;
}
/* A wall (hatched) at x, from y1 to y2, hatching on the left. */
export function wall(x, y1, y2) {
  let s = `<rect x="${x - 12}" y="${y1}" width="12" height="${y2 - y1}" fill="${C.pale}"/><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${C.ink}" stroke-width="2.5"/>`;
  for (let y = y1 + 4; y < y2; y += 10) s += `<line x1="${x}" y1="${y}" x2="${x - 10}" y2="${y + 8}" stroke="${C.grey}" stroke-width="1"/>`;
  return s;
}
/* A level track (floor) from x1 to x2 at y (top surface), hatched below. */
export function floor(x1, x2, y) {
  let s = `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="10" fill="${C.pale}"/><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${C.ink}" stroke-width="2.5"/>`;
  for (let x = x1 + 4; x < x2; x += 12) s += `<line x1="${x}" y1="${y}" x2="${x - 8}" y2="${y + 9}" stroke="${C.grey}" stroke-width="1"/>`;
  return s;
}
/* A ceiling from x1 to x2 with its bottom surface at y. */
export function ceiling(x1, x2, y) {
  let s = `<rect x="${x1}" y="${y - 10}" width="${x2 - x1}" height="10" fill="${C.pale}"/><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${C.ink}" stroke-width="2.5"/>`;
  for (let x = x1 + 4; x < x2; x += 12) s += `<line x1="${x}" y1="${y}" x2="${x + 8}" y2="${y - 9}" stroke="${C.grey}" stroke-width="1"/>`;
  return s;
}
/* A cart: body with its bottom-left corner at (x, y - wheel), wheels touching y. */
export function cart(x, y, w = 70, h = 34, label = '') {
  const wr = 7, by = y - 2 * wr;
  return `<rect x="${x}" y="${by - h}" width="${w}" height="${h}" rx="5" fill="${C.cart}" stroke="${C.ink}" stroke-width="2"/>` +
    `<circle cx="${x + 15}" cy="${y - wr}" r="${wr}" fill="${C.grey}" stroke="${C.ink}" stroke-width="1.5"/><circle cx="${x + w - 15}" cy="${y - wr}" r="${wr}" fill="${C.grey}" stroke="${C.ink}" stroke-width="1.5"/>` +
    (label ? text(x + w / 2, by - h / 2 + 5, label, { anchor: 'middle', size: 14, weight: 'bold' }) : '');
}
export const cartTop = (y, h = 34) => y - 14 - h;
export function block(x, y, w, h, o = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 3}" fill="${o.fill || C.metal}" stroke="${C.ink}" stroke-width="2"/>` +
    (o.label ? text(x + w / 2, y + h / 2 + 5, o.label, { anchor: 'middle', size: o.size || 14, weight: 'bold' }) : '');
}
export function dot(x, y, r = 4, color = C.ink) { return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${color}"/>`; }
export function dashed(x1, y1, x2, y2, color = C.grey, w = 1.5) { return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="${w}" stroke-dasharray="6 5"/>`; }
export function line(x1, y1, x2, y2, color = C.ink, w = 2) { return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="${w}"/>`; }
export function path(d, o = {}) { return `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.ink}" stroke-width="${o.width || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`; }
/* Full standalone SVG document. */
export function svgDoc(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="Arial, Helvetica, sans-serif">\n<title id="t">${esc(title)}</title>\n<desc id="d">${esc(desc)}</desc>\n<rect width="${w}" height="${h}" fill="#FFFFFF"/>\n${body}\n</svg>\n`;
}
/* Inline SVG for a question stimulus (no title/desc ids that could collide). */
export function svgInline(w, h, label, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" font-family="Arial, Helvetica, sans-serif" style="max-width:100%;height:auto"><rect width="${w}" height="${h}" fill="#FFFFFF"/>${body}</svg>`;
}
/* A plotted curve inside a box: f maps t to value; returns a path. */
export function curve(f, t0, t1, sx, sy, n = 160) {
  let d = '';
  for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; d += `${i ? 'L' : 'M'}${r1(sx(t))},${r1(sy(f(t)))}`; }
  return d;
}
export function writeFig(id, svg) {
  const dir = join(ROOT, 'physics', 'figures');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${id}.svg`), svg);
}

/* ---------------------------------------------------------------- figures */
export const FIGS = {};

/* 7.1: a cart on a spring at three moments, with the spring force on it. */
FIGS['shm-restoring-force'] = () => {
  const W = 760, H = 450, wx = 70, eq = 330, A = 120, rows = [110, 240, 370];
  let s = '';
  s += text(W / 2, 26, 'The spring force always points back toward equilibrium', { anchor: 'middle', size: 17, weight: 'bold' });
  // equilibrium line through all rows
  s += dashed(eq + 35, 44, eq + 35, 418, C.amber, 1.8);
  s += text(eq + 35, 436, 'equilibrium position (x = 0)', { anchor: 'middle', size: 13, color: C.amber, weight: 'bold' });
  const Fs = '<tspan font-style="italic">F</tspan><tspan baseline-shift="sub" font-size="10">s</tspan>';
  const cases = [
    { x: -A, lab: 'x = −A (spring compressed)', F: 1, note: `${Fs}, spring on cart: largest, to the right` },
    { x: 0, lab: 'x = 0 (spring at natural length)', F: 0, note: `${Fs} = 0: net force zero, cart still moving` },
    { x: A, lab: 'x = +A (spring stretched)', F: -1, note: `${Fs}, spring on cart: largest, to the left` },
  ];
  cases.forEach((c, i) => {
    const y = rows[i];
    s += wall(wx, y - 70, y + 6) + floor(wx, 720, y + 6);
    const cx = eq + c.x;
    s += springH(wx, cx, y - 18, { coils: 9, amp: 9, color: C.spring, width: 2.4 });
    s += cart(cx, y + 6, 70, 34, 'm');
    s += text(28, y - 42, ['1', '2', '3'][i], { size: 15, weight: 'bold', color: C.amber });
    s += text(wx + 10, y - 56, c.lab, { size: 13 });
    s += text(720, y - 56, c.note, { size: 13, anchor: 'end' });
    if (c.F) s += dot(cx + 35, y - 36, 3.5) + arrow(cx + 35, y - 36, cx + 35 + 110 * c.F, y - 36, C.spring, { width: 3.5 });
  });
  // displacement marker on row 3
  s += dim(eq + 35, rows[2] + 22, eq + 35 + A, rows[2] + 22, 'A', { ly: rows[2] + 40, italic: true });
  s += dim(eq + 35 - A, rows[0] + 22, eq + 35, rows[0] + 22, 'A', { ly: rows[0] + 40, italic: true });
  return svgDoc(W, H, 'A cart on a spring at three positions', 'A cart attached to a horizontal spring on a level track, shown at x = −A with the spring compressed (spring force on the cart points right, toward equilibrium), at x = 0 (no spring force; the net force is zero while the cart moves through), and at x = +A with the spring stretched (spring force points left, toward equilibrium). The force is proportional to the displacement and opposite to it.', s);
};

/* 7.2: what the period depends on, for a spring and for a pendulum. */
FIGS['shm-period-factors'] = () => {
  const W = 760, H = 440;
  let s = '';
  // left panel: vertical spring
  s += text(190, 28, 'Block on a spring', { anchor: 'middle', size: 17, weight: 'bold' });
  s += ceiling(110, 270, 60);
  s += springV(190, 60, 200, { coils: 10, amp: 11, color: C.spring, width: 2.4 });
  s += block(160, 200, 60, 50, { label: 'm' });
  s += text(212, 130, 'k', { size: 18, italic: true, color: C.ink, weight: 'bold' });
  s += `<rect x="70" y="285" width="240" height="62" rx="8" fill="${C.pale}" stroke="${C.light}"/>`;
  s += text(190, 324, 'T<tspan baseline-shift="sub" font-size="12">s</tspan> = 2π √(m / k)', { anchor: 'middle', size: 20, weight: 'bold', color: C.amber });
  s += text(190, 378, 'Depends on: mass m, spring constant k', { anchor: 'middle', size: 14 });
  s += text(190, 400, 'Not on: amplitude, g (hang it or lay it flat)', { anchor: 'middle', size: 14, color: C.grey });
  // right panel: pendulum
  const px = 560, py = 60, L = 190, th = 14 * Math.PI / 180;
  s += text(px, 28, 'Simple pendulum (small angles)', { anchor: 'middle', size: 17, weight: 'bold' });
  s += ceiling(px - 90, px + 90, py);
  s += dashed(px, py, px, py + L + 20, C.grey, 1.4);
  const bx = px + L * Math.sin(th), by = py + L * Math.cos(th);
  s += line(px, py, bx, by, C.ink, 1.8);
  s += `<circle cx="${r1(bx)}" cy="${r1(by)}" r="17" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>` + text(bx, by + 5, 'm', { anchor: 'middle', size: 14, weight: 'bold' });
  s += path(`M${px},${py + 60} A60,60 0 0,0 ${r1(px + 60 * Math.sin(th))},${r1(py + 60 * Math.cos(th))}`, { stroke: C.grey, width: 1.4 });
  s += text(px + 9, py + 82, 'θ', { size: 15, italic: true });
  s += text(px + L * Math.sin(th) / 2 + 12, py + L / 2, 'ℓ', { size: 20, italic: true, weight: 'bold' });
  s += `<rect x="440" y="285" width="240" height="62" rx="8" fill="${C.pale}" stroke="${C.light}"/>`;
  s += text(px, 324, 'T<tspan baseline-shift="sub" font-size="12">p</tspan> = 2π √(ℓ / g)', { anchor: 'middle', size: 20, weight: 'bold', color: C.amber });
  s += text(px, 378, 'Depends on: length ℓ, field strength g', { anchor: 'middle', size: 14 });
  s += text(px, 400, 'Not on: mass of the bob, amplitude', { anchor: 'middle', size: 14, color: C.grey });
  s += line(380, 50, 380, 410, C.light, 1.5);
  return svgDoc(W, H, 'What sets the period of a spring and of a pendulum', 'Left: a block of mass m hangs from a spring of constant k; its period is T = 2π√(m/k), set by m and k, not by the amplitude or by g. Right: a simple pendulum of length ℓ swinging through a small angle θ; its period is T = 2π√(ℓ/g), set by ℓ and g, not by the mass of the bob or the amplitude.', s);
};

/* 7.3: x, v and a against time, lined up. */
FIGS['shm-xva-graphs'] = () => {
  const W = 760, H = 580, L = 110, R = 720, T = 1;
  const sx = t => L + (R - L) * t / 1.0; // one period across
  const panels = [
    { name: 'Position x', f: t => Math.cos(2 * Math.PI * t), color: C.ink, y0: 125, lab: ['+A', '−A'] },
    { name: 'Velocity v', f: t => -Math.sin(2 * Math.PI * t), color: C.velocity, y0: 295, lab: ['+v_max', '−v_max'] },
    { name: 'Acceleration a', f: t => -Math.cos(2 * Math.PI * t), color: C.accel, y0: 465, lab: ['+a_max', '−a_max'] },
  ];
  let s = text(W / 2, 26, 'One cycle of SHM, starting at x = +A', { anchor: 'middle', size: 17, weight: 'bold' });
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  // vertical guides
  for (const t of ticks) s += dashed(sx(t), 65, sx(t), 532, C.light, 1.2);
  for (const p of panels) {
    const amp = 52, sy = v => p.y0 - v * amp;
    s += line(L, p.y0, R + 10, p.y0, C.grey, 1.4);
    s += line(L, p.y0 - amp - 12, L, p.y0 + amp + 12, C.grey, 1.4);
    s += text(L - 12, p.y0 - amp + 5, p.lab[0].replace('_max', '<tspan baseline-shift="sub" font-size="10">max</tspan>'), { anchor: 'end', size: 13 });
    s += text(L - 12, p.y0 + amp + 5, p.lab[1].replace('_max', '<tspan baseline-shift="sub" font-size="10">max</tspan>'), { anchor: 'end', size: 13 });
    s += text(L - 12, p.y0 + 5, '0', { anchor: 'end', size: 13 });
    s += text(20, p.y0 - amp - 18, p.name, { size: 15, weight: 'bold', color: p.color });
    s += path(curve(p.f, 0, 1, sx, sy), { stroke: p.color, width: 3 });
  }
  const tl = ['0', 'T/4', 'T/2', '3T/4', 'T'];
  ticks.forEach((t, i) => { s += text(sx(t), 552, tl[i], { anchor: 'middle', size: 14 }); });
  s += text((L + R) / 2, 572, 'time', { anchor: 'middle', size: 14, color: C.grey });
  // annotations
  s += text(sx(0.25) + 8, 125 - 28, 'x = 0: speed greatest, a = 0', { size: 12.5, color: C.amber, weight: 'bold' });
  s += text(sx(0.5) + 8, 465 + 32, 'x = −A: v = 0, a largest (+)', { size: 12.5, color: C.amber, weight: 'bold' });
  return svgDoc(W, H, 'Position, velocity and acceleration in SHM', 'Three graphs against time over one period T, lined up. Position starts at +A, crosses zero at T/4, reaches −A at T/2 and returns to +A at T. Velocity is zero at 0, T/2 and T (the turning points) and has its greatest size at T/4 and 3T/4, where x = 0. Acceleration is always opposite to the position: largest and negative at x = +A, zero at x = 0, largest and positive at x = −A.', s);
};

/* 7.4: energy against position, with bar charts at three positions. */
FIGS['shm-energy-position'] = () => {
  const W = 760, H = 470, L = 90, R = 520, top = 70, base = 330;
  const sx = x => (L + R) / 2 + x * (R - L) / 2, sy = e => base - e * (base - top);
  let s = text(W / 2, 26, 'Energy of a block on a spring (no friction)', { anchor: 'middle', size: 17, weight: 'bold' });
  s += line(L - 10, base, R + 10, base, C.grey, 1.4) + line(sx(0), top - 20, sx(0), base + 8, C.light, 1.2);
  s += line(L - 10, top - 20, L - 10, base, C.grey, 1.4);
  s += text(L - 18, top + 5, 'E', { anchor: 'end', size: 14, italic: true }) + text(L - 18, base + 5, '0', { anchor: 'end', size: 13 });
  s += text(22, 60, 'Energy', { size: 14, color: C.grey });
  s += path(`M${sx(-1)},${sy(1)} L${sx(1)},${sy(1)}`, { stroke: C.amber, width: 3 });
  s += path(curve(x => x * x, -1, 1, sx, sy), { stroke: C.spring, width: 3 });
  s += path(curve(x => 1 - x * x, -1, 1, sx, sy), { stroke: C.velocity, width: 3, dash: '9 5' });
  for (const [x, l] of [[-1, '−A'], [-0.5, '−A/2'], [0, '0'], [0.5, '+A/2'], [1, '+A']]) s += text(sx(x), base + 22, l, { anchor: 'middle', size: 13 });
  s += text((L + R) / 2, base + 44, 'position x', { anchor: 'middle', size: 14, color: C.grey });
  s += text(sx(1) + 6, sy(1) - 8, 'total E = ½kA²', { size: 13, color: C.amber, weight: 'bold', anchor: 'end' });
  s += text(sx(0.14), sy(0.16), 'U_s = ½kx²'.replace('U_s', 'U<tspan baseline-shift="sub" font-size="10">s</tspan>'), { size: 13, color: C.spring, weight: 'bold', anchor: 'start' });
  s += text(sx(-0.2), sy(0.84), 'K', { size: 15, color: C.velocity, weight: 'bold', anchor: 'end' });
  // bar charts at -A? use +A/2, 0, +A
  const bars = [[1, 'x = +A'], [0.5, 'x = +A/2'], [0, 'x = 0']];
  const bx0 = 560, bh = 92;
  bars.forEach(([x, lab], i) => {
    const y0 = 80 + i * 128, U = x * x, K = 1 - U;
    s += text(bx0, y0 - 6, lab, { size: 13, weight: 'bold' });
    s += line(bx0, y0 + bh, bx0 + 170, y0 + bh, C.grey, 1.2);
    const col = (j, v, c, l) => `<rect x="${bx0 + 12 + j * 54}" y="${r1(y0 + bh - v * bh * 0.9)}" width="36" height="${r1(Math.max(v * bh * 0.9, 0.01))}" fill="${c}" opacity="0.85"/>` + text(bx0 + 30 + j * 54, y0 + bh + 15, l, { anchor: 'middle', size: 12 });
    s += col(0, K, C.velocity, 'K') + col(1, U, C.spring, 'U<tspan baseline-shift="sub" font-size="9">s</tspan>') + col(2, 1, C.amber, 'E');
  });
  return svgDoc(W, H, 'Energy against position for a block on a spring', 'Left: a graph of energy against position from −A to +A. Spring potential energy U_s = ½kx² is a parabola that is zero at x = 0 and equals the total at ±A. Kinetic energy K is the upside-down parabola, largest at x = 0 and zero at ±A. The total energy ½kA² is a flat line. Right: energy bar charts at x = +A (all spring energy, K = 0), at x = +A/2 (U_s is a quarter of the total and K three quarters), and at x = 0 (all kinetic).', s);
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) for (const [id, f] of Object.entries(FIGS)) { writeFig(id, f()); console.log(`physics/figures/${id}.svg`); }
