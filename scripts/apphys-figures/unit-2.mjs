/* Figures for AP® Physics 1 Unit 2 (Force and Translational Dynamics), and the
   inline scene diagrams its question stimuli use. Run:
     node scripts/apphys-figures/unit-2.mjs
   Writes physics/figures/<id>.svg. Every figure is a standalone SVG with a
   white background, role="img", <title> and <desc>, Arial/Helvetica, ink
   #1F2A28, amber #734200 for emphasis and the force colours of the trainers.

   Free-body diagrams follow docs/apphys-authoring-guide.md: the object is a
   dot, every force is one whole arrow starting on the dot, labelled with its
   type and agent ("F_g, Earth on crate"), lengths in proportion, and nothing
   that is not a force (no net force, velocity or "centripetal force" arrow).
   Velocity and acceleration, when shown, sit beside the diagram in their own
   colours, off the dot. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const C = {
  ink: '#1F2A28', amber: '#734200', grey: '#5A6268', light: '#C9CFCC', pale: '#EEF1EF',
  gravity: '#0072B2', normal: '#009E73', tension: '#7A4F9E', friction: '#D55E00', spring: '#CC79A7',
  applied: '#5A6268', buoyant: '#3E9BC8', velocity: '#B07A00', accel: '#A33B26',
  wood: '#E3C99A', woodEdge: '#9C7A44', metal: '#B9C2C7', cart: '#E6E0D2', skin: '#E8C4A0',
  cloth: '#5B7DA8', earth: '#CFE3D3', wrong: '#B3261E',
};
const r1 = v => Math.round(v * 10) / 10;
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Text. s may hold <tspan> markup. o: { size, anchor, color, weight, italic } */
export function text(x, y, s, o = {}) {
  const a = [`x="${r1(x)}"`, `y="${r1(y)}"`, `font-size="${o.size || 14}"`, `fill="${o.color || C.ink}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.weight) a.push(`font-weight="${o.weight}"`);
  if (o.italic) a.push('font-style="italic"');
  return `<text ${a.join(' ')}>${s}</text>`;
}
/* "F_g" style symbol: F with a subscript, as tspans. */
export const sym = (main, sub, size = 14) => sub ? `${main}<tspan baseline-shift="sub" font-size="${Math.round(size * 0.72)}">${sub}</tspan>` : main;
/* A force label: symbol in the force colour, then ", agent on object" in ink. */
export function flabel(x, y, main, sub, rest, color, o = {}) {
  const size = o.size || 14;
  return text(x, y, `<tspan fill="${color}" font-weight="bold">${sym(main, sub, size)}</tspan>${rest ? `<tspan fill="${C.ink}">${rest}</tspan>` : ''}`, { size, anchor: o.anchor });
}
export function arrow(x1, y1, x2, y2, color = C.ink, o = {}) {
  const w = o.width || 3.2, head = o.head || 12, hw = o.headWidth || 6.5;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const bx = x2 - ux * head, by = y2 - uy * head;
  const dash = o.dash ? ` stroke-dasharray="${o.dash}"` : '';
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(bx)}" y2="${r1(by)}" stroke="${color}" stroke-width="${w}"${dash}/>` +
    `<polygon points="${r1(x2)},${r1(y2)} ${r1(bx - uy * hw)},${r1(by + ux * hw)} ${r1(bx + uy * hw)},${r1(by - ux * hw)}" fill="${color}"/>`;
}
/* A hollow (outline) arrow for velocity and acceleration, so they never read as forces. */
export function kinArrow(x1, y1, x2, y2, color, o = {}) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, px = -uy, py = ux;
  const sw = o.shaft || 3.5, head = o.head || 14, hw = o.headWidth || 9;
  const bx = x2 - ux * head, by = y2 - uy * head;
  const pts = [[x1 + px * sw, y1 + py * sw], [bx + px * sw, by + py * sw], [bx + px * hw, by + py * hw], [x2, y2], [bx - px * hw, by - py * hw], [bx - px * sw, by - py * sw], [x1 - px * sw, y1 - py * sw]];
  return `<polygon points="${pts.map(p => `${r1(p[0])},${r1(p[1])}`).join(' ')}" fill="#FFFFFF" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/>`;
}
export function dot(x, y, r = 5, color = C.ink) { return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${color}"/>`; }
export function line(x1, y1, x2, y2, color = C.ink, w = 2, dash) { return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`; }
export function path(d, o = {}) { return `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.ink}" stroke-width="${o.width ?? 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.join ? ` stroke-linejoin="${o.join}"` : ''}/>`; }
export function rect(x, y, w, h, o = {}) { return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 3}" fill="${o.fill || C.metal}" stroke="${o.stroke || C.ink}" stroke-width="${o.width ?? 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`; }
export function panel(x, y, w, h, title) {
  return rect(x, y, w, h, { fill: '#FFFFFF', stroke: C.light, width: 1.5, rx: 10 }) + (title ? text(x + 14, y + 24, title, { size: 15, weight: 'bold', color: C.amber }) : '');
}
/* Hatched floor: top surface at y. */
export function floor(x1, x2, y) {
  let s = `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="10" fill="${C.pale}"/>${line(x1, y, x2, y, C.ink, 2.5)}`;
  for (let x = x1 + 6; x < x2; x += 12) s += line(x, y + 1, x - 8, y + 10, C.grey, 1);
  return s;
}
export function ceiling(x1, x2, y) {
  let s = `<rect x="${x1}" y="${y - 10}" width="${x2 - x1}" height="10" fill="${C.pale}"/>${line(x1, y, x2, y, C.ink, 2.5)}`;
  for (let x = x1 + 4; x < x2; x += 12) s += line(x, y - 1, x + 8, y - 10, C.grey, 1);
  return s;
}
export function wall(x, y1, y2) {
  let s = `<rect x="${x - 12}" y="${y1}" width="12" height="${y2 - y1}" fill="${C.pale}"/>${line(x, y1, x, y2, C.ink, 2.5)}`;
  for (let y = y1 + 4; y < y2; y += 12) s += line(x - 1, y, x - 10, y + 8, C.grey, 1);
  return s;
}
/* A wooden crate with plank lines, bottom-left at (x, y+h). */
export function crate(x, y, w, h, label) {
  let s = rect(x, y, w, h, { fill: C.wood, stroke: C.woodEdge, width: 2.5, rx: 2 });
  s += rect(x + 5, y + 5, w - 10, h - 10, { fill: 'none', stroke: C.woodEdge, width: 1.4, rx: 1 });
  s += line(x + 6, y + h - 6, x + w - 6, y + 6, C.woodEdge, 1.4);
  if (label) s += `<rect x="${r1(x + w / 2 - 22)}" y="${r1(y + h / 2 - 11)}" width="44" height="22" rx="3" fill="#FFFFFF" stroke="${C.woodEdge}" stroke-width="1"/>` + text(x + w / 2, y + h / 2 + 5, label, { anchor: 'middle', size: 13, weight: 'bold' });
  return s;
}
/* A lab cart: body bottom-left at (x, ground - 14 - h); wheels touch y=ground. */
export function cart(x, ground, w = 90, h = 30, label = '') {
  const wr = 7, by = ground - 2 * wr;
  return rect(x, by - h, w, h, { fill: C.cart, rx: 5 }) +
    `<circle cx="${x + 16}" cy="${ground - wr}" r="${wr}" fill="${C.grey}" stroke="${C.ink}" stroke-width="1.5"/><circle cx="${x + w - 16}" cy="${ground - wr}" r="${wr}" fill="${C.grey}" stroke="${C.ink}" stroke-width="1.5"/>` +
    (label ? text(x + w / 2, by - h / 2 + 5, label, { anchor: 'middle', size: 13, weight: 'bold' }) : '');
}
/* A hanging mass (slotted lab weight) with a hook, top of hook at (x, y). */
export function hanger(x, y, w = 44, h = 40, label = '') {
  return line(x, y, x, y + 10, C.ink, 2) + rect(x - w / 2, y + 10, w, h, { fill: C.metal, rx: 4 }) + line(x - w / 2, y + 10 + h / 3, x + w / 2, y + 10 + h / 3, C.grey, 1) + line(x - w / 2, y + 10 + 2 * h / 3, x + w / 2, y + 10 + 2 * h / 3, C.grey, 1) +
    (label ? text(x, y + 10 + h / 2 + 5, label, { anchor: 'middle', size: 12, weight: 'bold' }) : '');
}
export function springV(x, y1, y2, o = {}) {
  const n = o.coils || 9, amp = o.amp || 10, lead = Math.min(10, (y2 - y1) * 0.1);
  const pts = [[x, y1], [x, y1 + lead]];
  const span = y2 - y1 - 2 * lead;
  for (let i = 0; i < n * 2; i++) pts.push([x + (i % 2 ? amp : -amp), y1 + lead + span * (i + 0.5) / (n * 2)]);
  pts.push([x, y2 - lead], [x, y2]);
  return `<polyline points="${pts.map(p => `${r1(p[0])},${r1(p[1])}`).join(' ')}" fill="none" stroke="${o.color || C.ink}" stroke-width="${o.width || 2.2}" stroke-linejoin="round"/>`;
}
export function springH(x1, x2, y, o = {}) {
  const n = o.coils || 9, amp = o.amp || 10, lead = Math.min(10, (x2 - x1) * 0.1);
  const pts = [[x1, y], [x1 + lead, y]];
  const span = x2 - x1 - 2 * lead;
  for (let i = 0; i < n * 2; i++) pts.push([x1 + lead + span * (i + 0.5) / (n * 2), y + (i % 2 ? amp : -amp)]);
  pts.push([x2 - lead, y], [x2, y]);
  return `<polyline points="${pts.map(p => `${r1(p[0])},${r1(p[1])}`).join(' ')}" fill="none" stroke="${o.color || C.ink}" stroke-width="${o.width || 2.2}" stroke-linejoin="round"/>`;
}
/* A pulley clamped at a table corner: wheel centre (cx, cy), radius r. */
export function pulley(cx, cy, r = 16) {
  return line(cx - r - 6, cy + r + 6, cx, cy, C.grey, 4) + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="3" fill="${C.ink}"/>`;
}
/* The centre-of-mass symbol: a circle with alternate quarters filled. */
export function cmMark(x, y, r = 9) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.6"/>` +
    `<path d="M${x},${y} L${x + r},${y} A${r},${r} 0 0,1 ${x},${y + r} Z" fill="${C.ink}"/><path d="M${x},${y} L${x - r},${y} A${r},${r} 0 0,1 ${x},${y - r} Z" fill="${C.ink}"/>`;
}
/* A simple standing person, feet at (x, y), height h. */
export function person(x, y, h = 110, o = {}) {
  const head = h * 0.11, shoulder = y - h * 0.8, hip = y - h * 0.46;
  return `<circle cx="${x}" cy="${r1(y - h + head)}" r="${r1(head)}" fill="${C.skin}" stroke="${C.ink}" stroke-width="1.6"/>` +
    `<rect x="${r1(x - h * 0.13)}" y="${r1(shoulder)}" width="${r1(h * 0.26)}" height="${r1(hip - shoulder)}" rx="${r1(h * 0.06)}" fill="${o.shirt || C.cloth}" stroke="${C.ink}" stroke-width="1.6"/>` +
    line(x - h * 0.13, shoulder + 6, x - h * 0.2, hip + 2, C.ink, 5) + line(x + h * 0.13, shoulder + 6, x + h * 0.2, hip + 2, C.ink, 5) +
    line(x - h * 0.06, hip, x - h * 0.08, y, C.ink, 6) + line(x + h * 0.06, hip, x + h * 0.08, y, C.ink, 6);
}
export function cross(x, y, s = 12, color = C.wrong) { return line(x - s, y - s, x + s, y + s, color, 3) + line(x - s, y + s, x + s, y - s, color, 3); }
export function check(x, y, color = C.normal) { return path(`M${x - 9},${y} L${x - 2},${y + 8} L${x + 11},${y - 9}`, { stroke: color, width: 3.5 }); }

/* A free-body diagram: dot at (cx, cy), forces [{ dx, dy, color, main, sub, rest, lx, ly, anchor }]
   with (lx, ly) the label position relative to the dot. */
export function fbd(cx, cy, forces, o = {}) {
  let s = '';
  for (const f of forces) {
    s += arrow(cx, cy, cx + f.dx, cy + f.dy, f.color, { width: o.width || 3.2 });
    if (f.main) s += flabel(cx + f.lx, cy + f.ly, f.main, f.sub, f.rest, f.color, { anchor: f.anchor, size: o.size || 14 });
  }
  return s + dot(cx, cy, o.r || 5.5);
}

export function svgDoc(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="Arial, Helvetica, sans-serif">\n<title id="t">${esc(title)}</title>\n<desc id="d">${esc(desc)}</desc>\n<rect width="${w}" height="${h}" fill="#FFFFFF"/>\n${body}\n</svg>\n`;
}
/* Inline SVG for a question stimulus (no ids that could collide on a page). */
export function svgInline(w, h, label, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" font-family="Arial, Helvetica, sans-serif" style="max-width:100%;height:auto"><rect width="${w}" height="${h}" fill="#FFFFFF"/>${body}</svg>`;
}

export const FIGS = {};

/* ------------------------------------------------------------------ 2.1 */
FIGS['com-two-objects'] = () => {
  const W = 760, H = 400;
  let s = text(W / 2, 28, 'Where is the center of mass?', { anchor: 'middle', size: 18, weight: 'bold' });
  // Left: dumbbell on a light rod balanced at its center of mass.
  s += panel(20, 46, 400, 330, 'Two balls on a light rod');
  const x0 = 70, x1 = 370, y = 170, m = 300 / 0.8;
  const xc = x0 + 0.2 * m;
  s += line(x0, y, x1, y, C.woodEdge, 5);
  s += `<circle cx="${x0}" cy="${y}" r="26" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>` + text(x0, y + 5, '3.0 kg', { anchor: 'middle', size: 12, weight: 'bold' });
  s += `<circle cx="${x1}" cy="${y}" r="15" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>` + text(x1, y - 24, '1.0 kg', { anchor: 'middle', size: 12, weight: 'bold' });
  s += path(`M${xc},${y + 4} L${xc - 16},${y + 34} L${xc + 16},${y + 34} Z`, { fill: C.light, stroke: C.ink, width: 1.6 });
  s += cmMark(xc, y, 8);
  // ruler
  const ry = 250;
  s += line(x0, ry, x1, ry, C.grey, 1.5);
  for (let i = 0; i <= 8; i++) { const xx = x0 + i * 0.1 * m; s += line(xx, ry, xx, ry + (i % 2 ? 6 : 10), C.grey, 1.2); if (i % 2 === 0) s += text(xx, ry + 24, (i / 10).toFixed(1), { anchor: 'middle', size: 12, color: C.grey }); }
  s += text(x1 + 4, ry + 40, 'x (m)', { anchor: 'end', size: 12, color: C.grey });
  s += line(xc, y + 36, xc, ry, C.amber, 1.5, '5 4');
  s += text(48, 318, `x${'<tspan baseline-shift="sub" font-size="11">cm</tspan>'} = (3.0 kg)(0) + (1.0 kg)(0.80 m)`, { size: 14 });
  s += line(118, 324, 330, 324, C.ink, 1.2);
  s += text(222, 342, '3.0 kg + 1.0 kg', { size: 14, anchor: 'middle' });
  s += text(48, 334, '', {});
  s += text(338, 330, '= 0.20 m', { size: 15, weight: 'bold', color: C.amber });
  s += text(220, 366, 'The rod balances on a support under its center of mass.', { anchor: 'middle', size: 12.5, color: C.grey });
  // Right: choosing a system.
  s += panel(440, 46, 300, 330, 'A system and its surroundings');
  const g = 290;
  s += floor(460, 720, g);
  s += cart(490, g, 90, 30, 'cart 1') + cart(590, g, 90, 30, 'cart 2');
  s += rect(478, 214, 214, 70, { fill: 'none', stroke: C.amber, width: 2.2, dash: '8 6', rx: 12 });
  s += text(585, 206, 'system: cart 1 + cart 2', { anchor: 'middle', size: 13.5, weight: 'bold', color: C.amber });
  s += cmMark(585, 254, 8);
  s += text(585, 326, 'surroundings: track, Earth, air', { anchor: 'middle', size: 13, color: C.grey });
  s += text(590, 352, 'The system moves as if it were one', { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(590, 368, 'object at its center of mass.', { anchor: 'middle', size: 12.5, color: C.grey });
  return svgDoc(W, H, 'Center of mass of two objects, and choosing a system', 'Left: a light rod with a 3.0 kg ball at 0 m and a 1.0 kg ball at 0.80 m. The center of mass, marked with a quartered circle, is at 0.20 m, closer to the heavier ball, and the rod balances on a support placed there. The calculation shows x_cm = (3.0 kg × 0 + 1.0 kg × 0.80 m) / (3.0 kg + 1.0 kg) = 0.20 m. Right: two lab carts on a track inside a dashed boundary labelled system: cart 1 + cart 2, with the center-of-mass symbol between them. The track, Earth and air are the surroundings.', s);
};

/* ------------------------------------------------------------------ 2.2 */
FIGS['fbd-crate-pulled'] = () => {
  const W = 760, H = 380;
  let s = text(W / 2, 28, 'From the scene to the free-body diagram', { anchor: 'middle', size: 18, weight: 'bold' });
  s += panel(20, 46, 380, 314, 'The scene');
  const g = 270;
  s += floor(40, 380, g);
  s += crate(110, 170, 110, 100, '40 kg');
  s += line(220, 220, 360, 220, C.woodEdge, 3);
  // a hand-held rope end
  s += `<rect x="352" y="208" width="22" height="24" rx="8" fill="${C.skin}" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += text(300, 208, 'rope', { anchor: 'middle', size: 13, color: C.grey });
  s += kinArrow(120, 140, 210, 140, C.velocity);
  s += text(222, 145, `${sym('v', '')} constant, to the right`, { size: 13, color: C.velocity, weight: 'bold' });
  s += text(210, 330, 'Rope pulls right; floor rubs; Earth pulls down;', { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(210, 348, 'floor pushes up. Velocity belongs on the scene only.', { anchor: 'middle', size: 12.5, color: C.grey });
  s += panel(420, 46, 320, 314, 'Free-body diagram of the crate');
  const cx = 580, cy = 200, L = 90, T = 78;
  s += fbd(cx, cy, [
    { dx: 0, dy: -L, color: C.normal, main: 'F', sub: 'N', rest: ', floor on crate', lx: 10, ly: -L + 12 },
    { dx: 0, dy: L, color: C.gravity, main: 'F', sub: 'g', rest: ', Earth on crate', lx: 10, ly: L - 4 },
    { dx: T, dy: 0, color: C.tension, main: 'F', sub: 'T', rest: ',', lx: T - 10, ly: -30 },
    { dx: -T, dy: 0, color: C.friction, main: 'F', sub: 'f', rest: ',', lx: -T + 4, ly: -30, anchor: 'start' },
  ]);
  s += text(cx + T - 6, cy - 14, 'rope on crate', { size: 13 }) ;
  s += text(cx - T - 10, cy - 14, 'floor on crate', { size: 13 });
  s += text(580, 338, 'Equal lengths: the forces cancel in each direction.', { anchor: 'middle', size: 12.5, color: C.grey });
  return svgDoc(W, H, 'A crate pulled across a floor and its free-body diagram', 'Left: a 40 kg wooden crate on a floor is pulled to the right by a horizontal rope held in a hand; an outlined velocity arrow above it reads v constant, to the right. Right: the free-body diagram of the crate, a dot with four arrows starting on it: F_N, floor on crate, up; F_g, Earth on crate, down, the same length; F_T, rope on crate, to the right; and F_f, floor on crate, to the left, the same length as the tension. The velocity is not drawn on the free-body diagram.', s);
};

FIGS['fbd-tossed-ball'] = () => {
  const W = 760, H = 360;
  let s = text(W / 2, 28, 'A ball tossed straight up, on its way up', { anchor: 'middle', size: 18, weight: 'bold' });
  // scene
  s += panel(20, 46, 220, 294, 'The scene');
  s += path('M80,300 Q90,180 130,110', { stroke: C.light, width: 2, dash: '5 5' });
  s += `<circle cx="130" cy="110" r="16" fill="#E9A23B" stroke="${C.ink}" stroke-width="2"/>`;
  s += kinArrow(160, 140, 160, 80, C.velocity);
  s += text(172, 114, 'v', { size: 15, color: C.velocity, weight: 'bold', italic: true });
  s += text(130, 290, 'The hand let go', { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(130, 308, 'before this moment.', { anchor: 'middle', size: 12.5, color: C.grey });
  // right FBD
  s += panel(260, 46, 220, 294, 'Right');
  s += check(450, 70);
  s += fbd(370, 160, [{ dx: 0, dy: 90, color: C.gravity, main: 'F', sub: 'g', rest: ', Earth on ball', lx: 10, ly: 80 }]);
  s += text(370, 300, 'One force: gravity.', { anchor: 'middle', size: 13, weight: 'bold' });
  s += text(370, 318, 'Air resistance is negligible.', { anchor: 'middle', size: 12.5, color: C.grey });
  // wrong FBD
  s += panel(500, 46, 240, 294, 'Wrong');
  s += cross(712, 70);
  const cx = 610, cy = 170;
  s += arrow(cx, cy, cx, cy - 80, C.grey, { dash: '7 5' }) + text(cx + 8, cy - 70, '"force of the throw"', { size: 12.5, color: C.wrong });
  s += arrow(cx, cy, cx - 70, cy, C.grey, { dash: '7 5' }) + text(cx - 72, cy - 10, '"v"', { size: 12.5, color: C.wrong });
  s += arrow(cx, cy, cx + 60, cy + 40, C.grey, { dash: '7 5' }) + text(cx + 26, cy + 64, '"F_net"'.replace('F_net', 'F<tspan baseline-shift="sub" font-size="9">net</tspan>'), { size: 12.5, color: C.wrong });
  s += fbd(cx, cy, [{ dx: 0, dy: 80, color: C.gravity }]);
  s += text(620, 292, 'No agent pushes up once the ball', { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(620, 308, 'leaves the hand. Velocity and net', { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(620, 324, 'force are not forces on the object.', { anchor: 'middle', size: 12.5, color: C.grey });
  return svgDoc(W, H, 'Free-body diagram of a ball tossed upward', 'Left: a ball moving upward after leaving a hand, with an outlined velocity arrow pointing up. Middle, marked right: its free-body diagram is a dot with one arrow down, F_g, Earth on ball, because air resistance is negligible. Right, marked wrong: a diagram that adds dashed arrows labelled force of the throw, v and F_net. None of these is a force exerted on the ball by another object, so none belongs on a free-body diagram.', s);
};

/* ------------------------------------------------------------------ 2.3 */
FIGS['third-law-book-table'] = () => {
  const W = 760, H = 440;
  let s = text(W / 2, 28, 'Forces on one object, and third-law pairs', { anchor: 'middle', size: 18, weight: 'bold' });
  // left: FBD of the book
  s += panel(20, 46, 300, 374, 'Forces on the book');
  const bx = 170, by = 220, L = 80;
  s += fbd(bx, by, [
    { dx: 0, dy: -L, color: C.normal, main: 'F', sub: 'N', rest: ', table on book', lx: 10, ly: -L + 14 },
    { dx: 0, dy: L, color: C.gravity, main: 'F', sub: 'g', rest: ', Earth on book', lx: 10, ly: L - 6 },
  ]);
  s += text(170, 352, 'Same object, equal sizes:', { anchor: 'middle', size: 13, weight: 'bold' });
  s += text(170, 370, 'they cancel because the book', { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(170, 386, 'is at rest. They are NOT a', { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(170, 402, 'third-law pair.', { anchor: 'middle', size: 12.5, color: C.grey });
  // right: an exploded view, each object pulled apart so each force sits on the object it acts on
  s += panel(340, 46, 400, 374, 'Pulled apart: each pair');
  const tick = (x, y, n, col) => { let o = ''; for (let i = 0; i < n; i++) o += line(x - 7, y + i * 5, x + 7, y + i * 5, col, 2); return o; };
  // book
  s += rect(432, 130, 96, 26, { fill: '#B5533C', stroke: C.ink, rx: 2 }) + text(446, 148, 'book', { size: 12, weight: 'bold', color: '#FFFFFF' });
  s += arrow(468, 143, 468, 88, C.normal) + tick(468, 110, 1, C.normal) + flabel(458, 98, 'F', 'N', ', table on book', C.normal, { anchor: 'end', size: 13 });
  s += arrow(506, 143, 506, 200, C.gravity) + tick(506, 172, 2, C.gravity) + flabel(516, 196, 'F', 'g', ', Earth on book', C.gravity, { size: 13 });
  // table
  s += rect(392, 236, 220, 14, { fill: C.wood, stroke: C.woodEdge }) + line(412, 250, 412, 340, C.woodEdge, 6) + line(592, 250, 592, 340, C.woodEdge, 6);
  s += text(560, 268, 'table', { anchor: 'middle', size: 12, weight: 'bold', color: C.grey });
  s += arrow(468, 243, 468, 298, C.normal) + tick(468, 268, 1, C.normal) + flabel(478, 300, 'F', 'N', ', book on table', C.normal, { size: 13 });
  // Earth
  s += path('M344,416 Q540,350 736,416 Z', { fill: C.earth, stroke: C.ink, width: 2 }) + text(470, 404, 'Earth', { anchor: 'middle', size: 13, weight: 'bold' });
  s += arrow(660, 382, 660, 326, C.gravity) + tick(660, 350, 2, C.gravity) + flabel(660, 314, 'F', 'g', ', book on Earth', C.gravity, { anchor: 'middle', size: 13 });
  // legend
  s += tick(612, 96, 1, C.ink) + text(626, 101, 'contact pair', { size: 12.5 });
  s += tick(612, 120, 2, C.ink) + text(626, 128, 'gravity pair', { size: 12.5 });
  s += text(540, 222, 'Partners: same size, opposite, on different objects.', { anchor: 'middle', size: 12, color: C.grey });
  return svgDoc(W, H, 'A book on a table: forces on the book and the third-law pairs', 'Left: the free-body diagram of a book at rest, a dot with F_N, table on book, up and F_g, Earth on book, down, of equal length. They act on the same object and cancel, so they are not a third-law pair. Right: the book, the table and Earth drawn pulled apart so each force sits on the object it acts on. One pair, marked with single ticks, is the contact (normal) interaction: table on book upward and book on table downward. The other pair, marked with double ticks, is the gravitational interaction: Earth on book downward and book on Earth upward. Each pair has the same size, opposite directions, acts on different objects and is the same type of force.', s);
};

/* ------------------------------------------------------------------ 2.4 */
FIGS['first-law-zero-net'] = () => {
  const W = 760, H = 420;
  let s = text(W / 2, 28, 'Zero net force means constant velocity (rest counts)', { anchor: 'middle', size: 18, weight: 'bold' });
  // panel 1: hanging lamp
  s += panel(20, 46, 230, 354, 'At rest');
  s += ceiling(60, 210, 96);
  s += line(110, 96, 110, 150, C.ink, 2);
  s += path('M80,150 L140,150 L130,182 L90,182 Z', { fill: C.metal, stroke: C.ink, width: 2 });
  s += fbd(135, 290, [
    { dx: 0, dy: -62, color: C.tension, main: 'F', sub: 'T', rest: ', cord on lamp', lx: 8, ly: -50 },
    { dx: 0, dy: 62, color: C.gravity, main: 'F', sub: 'g', rest: ', Earth on lamp', lx: 8, ly: 56 },
  ], { size: 12.5 });
  s += text(135, 380, 'v = 0, stays 0', { anchor: 'middle', size: 13, weight: 'bold' });
  // panel 2: skydiver at constant speed
  s += panel(265, 46, 230, 354, 'Constant velocity');
  // skydiver: body horizontal
  s += `<ellipse cx="365" cy="110" rx="44" ry="11" fill="${C.cloth}" stroke="${C.ink}" stroke-width="1.6"/><circle cx="414" cy="108" r="10" fill="${C.skin}" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += line(338, 104, 318, 86, C.ink, 5) + line(392, 104, 404, 84, C.ink, 5) + line(326, 114, 300, 120, C.ink, 5) + line(334, 116, 310, 132, C.ink, 5);
  s += kinArrow(460, 96, 460, 150, C.velocity) + text(470, 132, 'v', { size: 15, color: C.velocity, weight: 'bold', italic: true });
  s += fbd(370, 270, [
    { dx: 0, dy: -70, color: C.applied, main: 'F', sub: 'air', rest: ', air on diver', lx: 8, ly: -56 },
    { dx: 0, dy: 70, color: C.gravity, main: 'F', sub: 'g', rest: ', Earth on diver', lx: 8, ly: 64 },
  ], { size: 12.5 });
  s += text(380, 380, 'v steady, downward', { anchor: 'middle', size: 13, weight: 'bold' });
  // panel 3: sled speeding up (not equilibrium)
  s += panel(510, 46, 230, 354, 'Not zero: speeds up');
  s += floor(530, 720, 160);
  s += path('M556,150 L630,150 Q640,150 640,140 L640,130 L556,130 Z', { fill: '#C46B4E', stroke: C.ink, width: 2 }) + line(550, 156, 650, 156, C.ink, 3);
  s += line(640, 138, 712, 138, C.ink, 2);
  s += kinArrow(570, 100, 630, 100, C.velocity) + text(640, 105, 'v', { size: 15, color: C.velocity, weight: 'bold', italic: true });
  s += fbd(620, 270, [
    { dx: 0, dy: -60, color: C.normal, main: 'F', sub: 'N', rest: ', snow', lx: 6, ly: -48 },
    { dx: 0, dy: 60, color: C.gravity, main: 'F', sub: 'g', rest: ', Earth', lx: 6, ly: 56 },
    { dx: 90, dy: 0, color: C.tension, main: 'F', sub: 'T', rest: ', rope', lx: 40, ly: -12 },
    { dx: -45, dy: 0, color: C.friction, main: 'F', sub: 'f', rest: ', snow', lx: -96, ly: -12, anchor: 'start' },
  ], { size: 12.5 });
  s += text(625, 362, 'F_T longer than F_f:'.replace('F_T', sym('F', 'T', 13)).replace('F_f', sym('F', 'f', 13)), { anchor: 'middle', size: 13, weight: 'bold' });
  s += text(625, 380, 'net force right, speeds up', { anchor: 'middle', size: 12.5, color: C.grey });
  return svgDoc(W, H, 'Three objects: two with zero net force and one without', 'Left: a lamp hanging at rest from a cord; its free-body diagram has F_T, cord on lamp, up and F_g, Earth on lamp, down, equal. Its velocity is zero and stays zero. Middle: a skydiver falling at a steady speed, with an outlined velocity arrow pointing down; the diagram has F_air, air on diver, up and F_g, Earth on diver, down, equal, so the velocity stays constant. Right: a sled pulled across snow and speeding up; its diagram has F_N up and F_g down equal, but F_T to the right is longer than F_f to the left, so the net force is to the right and the sled speeds up.', s);
};

/* ------------------------------------------------------------------ 2.5 */
FIGS['second-law-cart-hanging'] = () => {
  const W = 760, H = 420;
  let s = text(W / 2, 28, 'A cart pulled by a hanging block', { anchor: 'middle', size: 18, weight: 'bold' });
  s += panel(20, 46, 340, 354, 'The scene');
  const g = 170;
  s += rect(40, g, 260, 16, { fill: C.pale, stroke: C.ink });
  s += line(60, g + 16, 60, 360, C.grey, 5) + line(280, g + 16, 280, 360, C.grey, 5);
  s += cart(70, g, 100, 32, 'cart, M');
  s += pulley(306, g - 10, 14);
  s += line(170, g - 30, 306, g - 30 + 6, C.ink, 1.8);  // string to top of pulley
  s += line(320, g - 10, 320, 250, C.ink, 1.8);
  s += hanger(320, 250, 40, 38, 'm');
  s += kinArrow(80, 96, 150, 96, C.accel) + text(160, 101, 'a', { size: 15, color: C.accel, weight: 'bold', italic: true });
  s += kinArrow(346, 252, 346, 300, C.accel) + text(338, 318, 'a', { size: 15, color: C.accel, weight: 'bold', italic: true, anchor: 'end' });
  s += text(190, 376, 'Light string, light frictionless pulley,', { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(190, 392, 'no friction on the cart.', { anchor: 'middle', size: 12.5, color: C.grey });
  s += panel(375, 46, 365, 354, 'Free-body diagrams');
  // cart FBD
  s += text(470, 84, 'Cart', { anchor: 'middle', size: 14, weight: 'bold' });
  s += fbd(450, 180, [
    { dx: 0, dy: -72, color: C.normal, main: 'F', sub: 'N', rest: ', track on cart', lx: 8, ly: -60 },
    { dx: 0, dy: 72, color: C.gravity, main: 'F', sub: 'g', rest: ', Earth on cart', lx: 8, ly: 68 },
    { dx: 54, dy: 0, color: C.tension, main: 'F', sub: 'T', rest: ', string', lx: 14, ly: -12 },
  ], { size: 12.5 });
  s += kinArrow(420, 300, 480, 300, C.accel) + text(490, 305, 'a (not a force)', { size: 12.5, color: C.accel });
  // block FBD
  s += text(640, 84, 'Hanging block', { anchor: 'middle', size: 14, weight: 'bold' });
  s += fbd(615, 190, [
    { dx: 0, dy: -50, color: C.tension, main: 'F', sub: 'T', rest: ', string on block', lx: 8, ly: -42 },
    { dx: 0, dy: 80, color: C.gravity, main: 'F', sub: 'g', rest: ', Earth on block', lx: 8, ly: 74 },
  ], { size: 12.5 });
  s += kinArrow(600, 296, 600, 346, C.accel) + text(612, 330, 'a (not a force)', { size: 12.5, color: C.accel });
  s += text(560, 384, `Block: ${sym('F', 'g', 12.5)} longer than ${sym('F', 'T', 12.5)}, so it speeds up downward.`, { anchor: 'middle', size: 12.5, color: C.grey });
  return svgDoc(W, H, 'A cart on a level track pulled by a block hanging over a pulley, with free-body diagrams', 'Left: a cart of mass M on a level table is tied to a light string that runs over a pulley at the table edge to a hanging block of mass m. Outlined acceleration arrows show the cart accelerating to the right and the block accelerating downward. Right: free-body diagrams. The cart has F_N, track on cart, up and F_g, Earth on cart, down, equal, and F_T, string on cart, to the right. The hanging block has F_T, string on block, up and a longer F_g, Earth on block, down. Each acceleration arrow is drawn beside its diagram, not on the dot, because acceleration is not a force.', s);
};

/* ------------------------------------------------------------------ 2.6 */
FIGS['gravitation-two-spheres'] = () => {
  const W = 760, H = 300;
  let s = text(W / 2, 28, 'Gravitational force between two objects', { anchor: 'middle', size: 18, weight: 'bold' });
  const x1 = 150, x2 = 520, y = 130;
  s += `<circle cx="${x1}" cy="${y}" r="52" fill="#9DB8CC" stroke="${C.ink}" stroke-width="2"/>` + text(x1, y - 14, sym('m', '1', 18), { anchor: 'middle', size: 18, weight: 'bold' });
  s += `<circle cx="${x2}" cy="${y}" r="30" fill="#C9B79C" stroke="${C.ink}" stroke-width="2"/>` + text(x2, y - 10, sym('m', '2', 16), { anchor: 'middle', size: 16, weight: 'bold' });
  s += dot(x1, y, 3) + dot(x2, y, 3);
  s += arrow(x1 + 54, y, x1 + 140, y, C.gravity) + flabel(x1 + 60, y - 16, 'F', 'g', ', 2 on 1', C.gravity, { size: 13 });
  s += arrow(x2 - 32, y, x2 - 118, y, C.gravity) + flabel(x2 - 118, y - 16, 'F', 'g', ', 1 on 2', C.gravity, { size: 13 });
  s += line(x1, y + 74, x2, y + 74, C.grey, 1.4);
  s += line(x1, y + 64, x1, y + 84, C.grey, 1.4) + line(x2, y + 64, x2, y + 84, C.grey, 1.4);
  s += text((x1 + x2) / 2, y + 96, 'r, center to center', { anchor: 'middle', size: 13.5, italic: false });
  s += rect(590, 60, 154, 130, { fill: C.pale, stroke: C.light, rx: 8 });
  s += text(667, 88, '|F| = G m₁m₂ / r²'.replace('|F|', `|${sym('F', 'g', 15)}|`), { anchor: 'middle', size: 15, weight: 'bold', color: C.amber });
  s += text(604, 118, 'r × 2  →  F ÷ 4', { size: 13.5 });
  s += text(604, 140, 'r × 3  →  F ÷ 9', { size: 13.5 });
  s += text(604, 162, `${sym('m', '1', 13.5)} × 2  →  F × 2`, { size: 13.5 });
  s += text(604, 182, 'both × 2  →  F × 4', { size: 13.5 });
  s += text(W / 2, 270, 'Equal sizes on both objects, attractive, along the line joining the centers.', { anchor: 'middle', size: 13, color: C.grey });
  return svgDoc(W, H, 'The gravitational force between two spheres', 'A large sphere of mass m1 and a smaller sphere of mass m2, a distance r apart measured center to center. Each pulls the other toward itself with forces of equal size: F_g, 2 on 1 points right toward m2 and F_g, 1 on 2 points left toward m1. A panel gives |F_g| = G m1 m2 / r² and the scaling: doubling r divides the force by 4, tripling r divides it by 9, doubling m1 doubles it, doubling both masses multiplies it by 4.', s);
};

FIGS['elevator-apparent-weight'] = () => {
  const W = 760, H = 440;
  let s = text(W / 2, 28, 'Apparent weight in an elevator (70 kg rider, g = 9.8 m/s²)', { anchor: 'middle', size: 17, weight: 'bold' });
  const cases = [
    { x: 20, t: 'Accelerating up', a: 1.2, read: '770 N' },
    { x: 266, t: 'Constant velocity', a: 0, read: '686 N' },
    { x: 512, t: 'Accelerating down', a: -1.2, read: '602 N' },
  ];
  for (const c of cases) {
    s += panel(c.x, 46, 228, 374, c.t);
    const ex = c.x + 20, ey = 100, ew = 92, eh = 210;
    s += rect(ex, ey, ew, eh, { fill: '#F7F7F4', stroke: C.ink, width: 2.4, rx: 4 });
    s += line(ex + ew / 2, ey - 14, ex + ew / 2, ey, C.ink, 2);
    // scale
    const fy = ey + eh - 4;
    s += rect(ex + 18, fy - 12, 56, 12, { fill: C.metal, rx: 2 });
    s += person(ex + 46, fy - 12, 120);
    s += rect(ex + 6, ey + eh + 10, 80, 26, { fill: '#FFFFFF', stroke: C.ink, rx: 5 }) + text(ex + 46, ey + eh + 28, c.read, { anchor: 'middle', size: 14, weight: 'bold', color: C.amber });
    s += text(ex + 46, ey + eh + 52, 'scale reads', { anchor: 'middle', size: 12, color: C.grey });
    // FBD
    const cx = c.x + 170, cy = 190, Lg = 80, Ln = Lg * (9.8 + c.a) / 9.8;
    s += fbd(cx, cy, [
      { dx: 0, dy: -Ln, color: C.normal, main: 'F', sub: 'N', lx: 8, ly: -Ln + 14 },
      { dx: 0, dy: Lg, color: C.gravity, main: 'F', sub: 'g', lx: 8, ly: Lg - 4 },
    ]);
    s += text(cx - 8, cy - Ln - 10, 'scale on rider', { anchor: 'middle', size: 11.5 });
    s += text(cx - 8, cy + Lg + 18, 'Earth on rider', { anchor: 'middle', size: 11.5 });
    if (c.a) s += kinArrow(cx + 36, c.a > 0 ? cy + 30 : cy - 30, cx + 36, c.a > 0 ? cy - 20 : cy + 20, C.accel) + text(cx + 46, cy + 5, 'a', { size: 14, color: C.accel, weight: 'bold', italic: true });
    else s += text(cx + 30, cy + 5, 'a = 0', { size: 13, color: C.accel, weight: 'bold' });
    s += text(c.x + 114, 404, c.a > 0 ? 'F_N > F_g' : c.a < 0 ? 'F_N < F_g' : 'F_N = F_g', { anchor: 'middle', size: 14, weight: 'bold' }).replace(/F_N/, sym('F', 'N')).replace(/F_g/, sym('F', 'g'));
  }
  return svgDoc(W, H, 'A rider on a scale in an elevator in three states of motion', 'Three panels show a 70 kg person standing on a bathroom scale in an elevator, with g = 9.8 m/s². Accelerating upward at 1.2 m/s²: the free-body diagram has F_N, scale on rider, longer than F_g, Earth on rider, and the scale reads 770 N. Constant velocity: the two forces are equal and the scale reads 686 N. Accelerating downward at 1.2 m/s²: F_N is shorter than F_g and the scale reads 602 N. The scale reads the normal force, the apparent weight; the gravitational force, 686 N, is the same in all three.', s);
};

/* ------------------------------------------------------------------ 2.7 */
FIGS['friction-static-kinetic'] = () => {
  const W = 760, H = 400;
  let s = text(W / 2, 28, 'Push harder and harder on a resting crate', { anchor: 'middle', size: 18, weight: 'bold' });
  s += panel(20, 46, 290, 334, 'The crate');
  const g = 230;
  s += floor(40, 290, 210);
  s += crate(110, 130, 90, 80, '');
  s += arrow(66, 170, 110, 170, C.applied) + flabel(44, 160, 'F', 'A', '', C.applied);
  s += fbd(165, 318, [
    { dx: 40, dy: 0, color: C.applied, main: 'F', sub: 'A', rest: ', hand', lx: 30, ly: -10 },
    { dx: -40, dy: 0, color: C.friction, main: 'F', sub: 'f', rest: ', floor', lx: -100, ly: -10, anchor: 'start' },
    { dx: 0, dy: -50, color: C.normal, main: 'F', sub: 'N', lx: 6, ly: -38 },
    { dx: 0, dy: 50, color: C.gravity, main: 'F', sub: 'g', lx: 6, ly: 48 },
  ], { size: 12.5 });
  s += text(165, 252, 'Before it slips, friction matches the push.', { anchor: 'middle', size: 12.5, color: C.grey });
  // graph
  s += panel(326, 46, 414, 334, 'Friction force against the push');
  const ox = 390, oy = 320, gw = 320, gh = 220, Fmax = 200;
  const sx = v => ox + v / Fmax * gw, sy = v => oy - v / 160 * gh;
  s += arrow(ox, oy, ox + gw + 12, oy, C.ink, { width: 1.6, head: 9, headWidth: 4.5 }) + arrow(ox, oy, ox, oy - gh - 12, C.ink, { width: 1.6, head: 9, headWidth: 4.5 });
  s += text(ox + gw / 2, oy + 36, 'applied force (N)', { anchor: 'middle', size: 13 });
  s += `<text transform="translate(${ox - 40} ${oy - gh / 2}) rotate(-90)" font-size="13" text-anchor="middle" fill="${C.ink}">friction force (N)</text>`;
  for (const v of [0, 50, 100, 150, 200]) s += line(sx(v), oy, sx(v), oy + 5, C.ink, 1.2) + text(sx(v), oy + 18, v, { anchor: 'middle', size: 11.5, color: C.grey });
  for (const v of [0, 40, 80, 120, 160]) s += line(ox - 5, sy(v), ox, sy(v), C.ink, 1.2) + text(ox - 9, sy(v) + 4, v, { anchor: 'end', size: 11.5, color: C.grey });
  // static rise to 120 N at push 120, then kinetic 80 N
  s += line(sx(0), sy(0), sx(120), sy(120), C.friction, 3.2) + line(sx(120), sy(120), sx(120), sy(80), C.friction, 1.6, '4 4') + line(sx(120), sy(80), sx(200), sy(80), C.friction, 3.2);
  s += line(ox, sy(120), sx(120), sy(120), C.grey, 1, '4 4') + line(ox, sy(80), sx(120), sy(80), C.grey, 1, '4 4');
  s += text(sx(52), sy(110), 'static: f = push', { size: 13, weight: 'bold', color: C.friction, anchor: 'middle' });
  s += text(sx(52), sy(97), 'no sliding', { size: 12, color: C.grey, anchor: 'middle' });
  s += text(sx(122), sy(132), `maximum: ${sym('μ', 's', 13)}${sym('F', 'N', 13)} = 120 N`, { size: 13, color: C.ink });
  s += text(sx(160), sy(66), `kinetic: ${sym('μ', 'k', 13)}${sym('F', 'N', 13)} = 80 N`, { size: 13, color: C.friction, weight: 'bold', anchor: 'middle' });
  s += text(sx(160), sy(52), 'sliding', { size: 12, color: C.grey, anchor: 'middle' });
  return svgDoc(W, H, 'Static and kinetic friction on a pushed crate', 'Left: a crate on a floor pushed to the right by a hand, with its free-body diagram: F_A, hand, to the right, F_f, floor, to the left and equal while the crate stays put, and F_N up and F_g down equal. Right: a graph of the friction force against the applied force. From 0 to 120 N the friction force equals the push (static friction, no sliding). At 120 N, the maximum static friction μs F_N, the crate starts to slide, and the friction force drops to a constant 80 N, the kinetic friction μk F_N, however hard the push.', s);
};

/* ------------------------------------------------------------------ 2.8 */
FIGS['spring-hooke'] = () => {
  const W = 760, H = 420;
  let s = text(W / 2, 28, 'An ideal spring: the stretch is proportional to the force', { anchor: 'middle', size: 18, weight: 'bold' });
  s += panel(20, 46, 400, 354, 'Hanging blocks on one spring');
  const top = 100;
  s += ceiling(40, 400, top);
  const L0 = 76, d = 46, cols = [90, 210, 330];
  // ruler
  s += rect(372, top, 26, 260, { fill: '#FFF8E6', stroke: C.woodEdge, rx: 2, width: 1.4 });
  for (let i = 0; i <= 13; i++) s += line(372, top + i * 20, 372 + (i % 5 === 0 ? 14 : 8), top + i * 20, C.woodEdge, 1.2);
  cols.forEach((x, i) => {
    const end = top + L0 + i * d;
    s += springV(x, top, end, { coils: 8, amp: 10 });
    if (i) s += hanger(x, end, 42, 34 + (i - 1) * 6, i === 1 ? 'm' : '2m');
    else s += line(x - 8, end, x + 8, end, C.ink, 2);
  });
  s += line(108, top + L0, 366, top + L0, C.grey, 1, '4 4');
  s += text(46, top + L0 + 22, 'relaxed', { size: 11.5, color: C.grey });
  // Δx brackets
  const br = (x, y1, y2, lab) => line(x, y1, x, y2, C.amber, 2) + line(x - 5, y1, x + 5, y1, C.amber, 2) + line(x - 5, y2, x + 5, y2, C.amber, 2) + text(x + 8, (y1 + y2) / 2 + 5, lab, { size: 13, color: C.amber, weight: 'bold' });
  s += br(238, top + L0, top + L0 + d, 'Δx');
  s += br(354, top + L0, top + L0 + 2 * d, '2Δx');
  s += text(220, 384, 'Double the hanging weight, double the stretch.', { anchor: 'middle', size: 12.5, color: C.grey });
  // graph
  s += panel(436, 46, 304, 354, 'Force against stretch');
  const ox = 492, oy = 330, gw = 220, gh = 220;
  s += arrow(ox, oy, ox + gw + 10, oy, C.ink, { width: 1.6, head: 9, headWidth: 4.5 }) + arrow(ox, oy, ox, oy - gh - 10, C.ink, { width: 1.6, head: 9, headWidth: 4.5 });
  s += text(ox + gw / 2, oy + 34, 'stretch |Δx| (m)', { anchor: 'middle', size: 13 });
  s += `<text transform="translate(${ox - 30} ${oy - gh / 2}) rotate(-90)" font-size="13" text-anchor="middle" fill="${C.ink}">force on spring (N)</text>`;
  s += line(ox, oy, ox + gw - 10, oy - gh + 20, C.spring, 3.2);
  for (const [fx, fy] of [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]]) s += `<circle cx="${ox + fx * (gw - 10)}" cy="${oy - fy * (gh - 20)}" r="5" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.8"/>`;
  s += line(ox + 0.5 * (gw - 10), oy - 0.5 * (gh - 20), ox + 0.75 * (gw - 10), oy - 0.5 * (gh - 20), C.grey, 1.2, '4 3') + line(ox + 0.75 * (gw - 10), oy - 0.5 * (gh - 20), ox + 0.75 * (gw - 10), oy - 0.75 * (gh - 20), C.grey, 1.2, '4 3');
  s += text(ox + 168, oy - 112, 'slope = k', { size: 15, weight: 'bold', color: C.amber });
  s += text(ox + 4, oy - gh + 6, `|${sym('F', 's')}| = k|Δx|`, { size: 15, weight: 'bold', color: C.spring });
  return svgDoc(W, H, 'A spring stretched by hanging blocks, and its force-stretch graph', 'Left: the same vertical spring hanging from a ceiling three times beside a ruler: relaxed with nothing on it; with one block of mass m, stretched by Δx; and with a block of mass 2m, stretched by 2Δx. Right: a graph of the force on the spring against its stretch is a straight line through the origin; its slope is the spring constant k, and |F_s| = k|Δx|.', s);
};

/* ------------------------------------------------------------------ 2.9 */
FIGS['circular-flat-curve'] = () => {
  const W = 760, H = 400;
  let s = text(W / 2, 28, 'A car rounding a flat curve at constant speed', { anchor: 'middle', size: 18, weight: 'bold' });
  s += panel(20, 46, 360, 334, 'Seen from above');
  const cx = 110, cy = 300, R = 190;
  s += path(`M${cx + R},${cy} A${R},${R} 0 0,0 ${cx},${cy - R}`, { stroke: C.light, width: 30 });
  s += path(`M${cx + R},${cy} A${R},${R} 0 0,0 ${cx},${cy - R}`, { stroke: '#FFFFFF', width: 2, dash: '10 8' });
  s += dot(cx, cy, 4) + text(cx + 8, cy + 16, 'center', { size: 12.5, color: C.grey });
  const th = -Math.PI / 4, px = cx + R * Math.cos(th), py = cy + R * Math.sin(th);
  s += `<g transform="translate(${r1(px)} ${r1(py)}) rotate(45)"><rect x="-12" y="-22" width="24" height="44" rx="6" fill="#C0392B" stroke="${C.ink}" stroke-width="1.6"/><rect x="-9" y="-12" width="18" height="10" rx="2" fill="#DDE7EE"/></g>`;
  s += line(px, py, cx, cy, C.grey, 1, '4 4');
  s += kinArrow(px + 18, py + 18, px + 78, py - 42, C.velocity) + text(px + 84, py - 44, 'v', { size: 15, color: C.velocity, weight: 'bold', italic: true });
  s += kinArrow(px - 22, py + 22, px - 72, py + 72, C.accel) + text(px - 78, py + 90, 'a toward center', { size: 13, color: C.accel, weight: 'bold' });
  s += text(200, 360, 'Velocity is tangent; acceleration points in.', { anchor: 'middle', size: 12.5, color: C.grey });
  s += panel(396, 46, 344, 334, 'Free-body diagram (car seen from behind)');
  const fx = 580, fy = 210;
  s += fbd(fx, fy, [
    { dx: 0, dy: -84, color: C.normal, main: 'F', sub: 'N', rest: ', road on car', lx: 8, ly: -72 },
    { dx: 0, dy: 84, color: C.gravity, main: 'F', sub: 'g', rest: ', Earth on car', lx: 8, ly: 80 },
    { dx: -110, dy: 0, color: C.friction, main: 'F', sub: 'f', rest: ', road on tires', lx: -150, ly: -12, anchor: 'start' },
  ]);
  s += text(fx - 70, fy + 30, '(toward the center)', { anchor: 'middle', size: 12, color: C.grey });
  s += text(568, 340, 'Static friction is the only horizontal force,', { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(568, 358, `so it supplies the centripetal net force: ${sym('F', 'f', 12.5)} = mv²/r.`, { anchor: 'middle', size: 12.5, color: C.grey });
  return svgDoc(W, H, 'A car on a flat curve: top view and free-body diagram', 'Left: a car on a curved road seen from above, a quarter circle around a marked center. An outlined velocity arrow points along the road, tangent to the circle; an outlined acceleration arrow points from the car toward the center. Right: the free-body diagram of the car seen from behind: F_N, road on car, up and F_g, Earth on car, down, equal, and F_f, road on tires, horizontal toward the center of the curve. Static friction is the only horizontal force, so it supplies the centripetal net force, F_f = mv²/r. There is no separate centripetal force arrow.', s);
};

FIGS['vertical-loop-fbd'] = () => {
  const W = 760, H = 420;
  let s = text(W / 2, 28, 'A cart on the inside of a vertical loop', { anchor: 'middle', size: 18, weight: 'bold' });
  s += panel(20, 46, 330, 354, 'The loop');
  const cx = 185, cy = 236, R = 120;
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.grey}" stroke-width="8"/>`;
  s += dot(cx, cy, 4) + text(cx + 8, cy + 4, 'center', { size: 12, color: C.grey });
  // carts at top (inverted) and bottom
  s += rect(cx - 22, cy - R + 6, 44, 20, { fill: C.cart, rx: 4 }) + text(cx, cy - R + 44, 'top', { anchor: 'middle', size: 12.5, weight: 'bold' });
  s += rect(cx - 22, cy + R - 26, 44, 20, { fill: C.cart, rx: 4 }) + text(cx, cy + R - 34, 'bottom', { anchor: 'middle', size: 12.5, weight: 'bold' });
  s += kinArrow(cx - 30, cy - R - 12, cx - 90, cy - R - 12, C.velocity) + text(cx - 100, cy - R - 8, 'v', { size: 14, color: C.velocity, weight: 'bold', italic: true, anchor: 'end' });
  s += kinArrow(cx + 30, cy + R + 12, cx + 90, cy + R + 12, C.velocity) + text(cx + 98, cy + R + 17, 'v', { size: 14, color: C.velocity, weight: 'bold', italic: true });
  s += panel(366, 46, 374, 354, 'Free-body diagrams');
  s += text(470, 104, 'At the top', { anchor: 'middle', size: 14, weight: 'bold' });
  s += arrow(462, 150, 462, 226, C.gravity) + flabel(472, 222, 'F', 'g', ', Earth', C.gravity, { size: 12.5 });
  s += arrow(450, 150, 450, 192, C.normal) + flabel(442, 190, 'F', 'N', ', track', C.normal, { anchor: 'end', size: 12.5 });
  s += dot(456, 150, 7);
  s += text(460, 270, 'Both point down, toward', { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(460, 286, `the center: ${sym('F', 'g', 12.5)} + ${sym('F', 'N', 12.5)} = mv²/r`, { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(650, 104, 'At the bottom', { anchor: 'middle', size: 14, weight: 'bold' });
  s += fbd(650, 236, [
    { dx: 0, dy: -110, color: C.normal, main: 'F', sub: 'N', rest: ', track', lx: 8, ly: -94 },
    { dx: 0, dy: 60, color: C.gravity, main: 'F', sub: 'g', rest: ', Earth', lx: 8, ly: 56 },
  ], { size: 12.5 });
  s += text(650, 332, `${sym('F', 'N', 12.5)} longer than ${sym('F', 'g', 12.5)}:`, { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(650, 348, `${sym('F', 'N', 12.5)} − ${sym('F', 'g', 12.5)} = mv²/r, up`, { anchor: 'middle', size: 12.5, color: C.grey });
  s += text(553, 380, 'No "centripetal force" arrow: the net force is the sum of these.', { anchor: 'middle', size: 12.5, weight: 'bold' });
  return svgDoc(W, H, 'Free-body diagrams of a cart at the top and bottom of a vertical loop', 'Left: a vertical circular loop with a cart on the inside of the track at the top, upside down, and at the bottom, with outlined velocity arrows tangent to the loop. Right: free-body diagrams. At the top, both forces point down toward the center: F_g, Earth, and F_N, track, so F_g + F_N = mv²/r. At the bottom, F_N, track, points up toward the center and is longer than F_g, Earth, pointing down, so F_N − F_g = mv²/r. No separate centripetal force arrow is drawn; the net force is the sum of the real forces.', s);
};

/* ------------------------------------------------------- stimulus scenes */
/* Inline SVGs for question stimuli (scene diagrams). Exported for the
   question files; each returns the <svg> string. */
export const STIM = {
  // 2.1: a wrench sliding and turning on ice, top view, at equal time steps
  wrenchIce: () => {
    let s = rect(10, 10, 600, 200, { fill: '#EEF5F8', stroke: C.light, rx: 8, width: 1.2 });
    const pts = [0, 1, 2, 3, 4].map(i => ({ x: 70 + i * 120, y: 150 - i * 22, th: i * 50 }));
    s += line(pts[0].x, pts[0].y, pts[4].x, pts[4].y, C.amber, 1.6, '6 5');
    pts.forEach((p, i) => {
      const r = p.th * Math.PI / 180, hx = 16 * Math.cos(r), hy = -16 * Math.sin(r), tx = -44 * Math.cos(r), ty = 44 * Math.sin(r);
      s += line(p.x + hx, p.y + hy, p.x + tx, p.y + ty, C.grey, 7) + `<circle cx="${r1(p.x + hx)}" cy="${r1(p.y + hy)}" r="13" fill="${C.metal}" stroke="${C.ink}" stroke-width="1.6"/>`;
      s += `<circle cx="${r1(p.x + tx)}" cy="${r1(p.y + ty)}" r="4" fill="${C.ink}"/>`;
      s += cmMark(p.x, p.y, 6) + text(p.x, 200, `${(i * 0.20).toFixed(2)} s`, { anchor: 'middle', size: 12, color: C.grey });
    });
    s += text(30, 34, 'heavy head', { size: 12.5, color: C.grey }) + text(30, 52, 'light handle end (black dot)', { size: 12.5, color: C.grey });
    s += cmMark(372, 32, 6) + text(384, 37, 'center of mass', { size: 12.5, color: C.grey });
    return svgInline(620, 220, 'Top view of a wrench sliding across ice, shown at five moments 0.20 s apart. The wrench turns as it slides. Its center of mass, near the heavy head, moves along a straight dashed line by equal steps, while the handle end swings around it.', s);
  },
  // 2.2: a child on a sled pulled by a horizontal rope while it slows down
  sledSlowing: () => {
    let s = floor(20, 520, 150);
    s += path('M120,140 L230,140 Q244,140 244,126 L244,114 L120,114 Z', { fill: '#C46B4E', stroke: C.ink, width: 2 }) + line(110, 146, 254, 146, C.ink, 3);
    s += line(244, 122, 420, 122, C.ink, 2);
    s += `<rect x="414" y="112" width="16" height="20" rx="6" fill="${C.skin}" stroke="${C.ink}" stroke-width="1.4"/>`;
    s += kinArrow(150, 80, 220, 80, C.velocity) + text(228, 85, 'v (decreasing)', { size: 13, color: C.velocity, weight: 'bold' });
    s += text(330, 112, 'rope', { size: 12.5, color: C.grey, anchor: 'middle' });
    return svgInline(540, 180, 'A loaded sled on level snow. A horizontal rope pulls the sled to the right while the sled moves right and slows down.', s);
  },
  // 2.2: a bucket raised on a rope
  liftedBucket: () => {
    let s = ceiling(40, 260, 30);
    s += line(150, 30, 150, 110, C.ink, 2);
    s += path('M120,110 L180,110 L172,170 L128,170 Z', { fill: C.metal, stroke: C.ink, width: 2 }) + path('M124,110 Q150,82 176,110', { stroke: C.ink, width: 2 });
    s += kinArrow(210, 160, 210, 100, C.velocity) + text(220, 135, 'v (constant)', { size: 13, color: C.velocity, weight: 'bold' });
    return svgInline(340, 190, 'A bucket hangs from a single rope and is raised straight up at a constant speed.', s);
  },
  // 2.3: two blocks pushed together on a frictionless floor
  twoBlocksPushed: () => {
    let s = floor(20, 520, 150);
    s += crate(170, 70, 90, 80, '6.0 kg') + crate(260, 100, 60, 50, '2.0 kg');
    s += arrow(100, 110, 168, 110, C.applied) + flabel(60, 100, 'F', 'A', ' = 24 N', C.applied, { size: 13 });
    s += text(270, 176, 'frictionless floor', { anchor: 'middle', size: 12.5, color: C.grey });
    return svgInline(540, 190, 'A hand pushes a 6.0 kg block to the right with a 24 N force; the 6.0 kg block pushes a 2.0 kg block in front of it. The floor is frictionless.', s);
  },
  // 2.3: a truck towing a car
  truckCar: () => {
    let s = floor(10, 590, 140);
    // truck
    s += rect(330, 66, 150, 56, { fill: '#5B7DA8', rx: 6 }) + rect(480, 82, 70, 40, { fill: '#5B7DA8', rx: 8 }) + rect(492, 88, 40, 18, { fill: '#DDE7EE', rx: 3 });
    for (const x of [360, 450, 520]) s += `<circle cx="${x}" cy="128" r="12" fill="${C.ink}"/><circle cx="${x}" cy="128" r="5" fill="${C.metal}"/>`;
    // car
    s += path('M60,122 L60,96 Q66,84 90,82 L120,64 L190,64 L214,84 Q236,88 240,100 L240,122 Z', { fill: '#C0392B', stroke: C.ink, width: 2 });
    for (const x of [92, 206]) s += `<circle cx="${x}" cy="128" r="12" fill="${C.ink}"/><circle cx="${x}" cy="128" r="5" fill="${C.metal}"/>`;
    s += line(240, 104, 330, 104, C.ink, 2.5);
    s += kinArrow(250, 40, 330, 40, C.accel) + text(338, 45, 'a (speeding up)', { size: 13, color: C.accel, weight: 'bold' });
    s += text(285, 96, 'tow rope', { size: 12, color: C.grey, anchor: 'middle' });
    return svgInline(600, 160, 'A truck on a level road tows a car with a light tow rope; both speed up to the right together.', s);
  },
  // 2.4: a sign hung from two cords, each at 30 degrees above the horizontal
  signTwoCords: () => {
    let s = ceiling(20, 540, 30);
    const kx = 280, ky = 140, ay = 30, ax = kx - 40 - (ky - ay) / Math.tan(Math.PI / 6), bx = kx + 40 + (ky - ay) / Math.tan(Math.PI / 6);
    s += line(ax, ay, kx - 40, ky, C.ink, 2.2) + line(bx, ay, kx + 40, ky, C.ink, 2.2);
    s += rect(kx - 70, ky, 140, 54, { fill: '#2F6B4F', rx: 4 }) + text(kx, ky + 34, 'OPEN', { anchor: 'middle', size: 20, weight: 'bold', color: '#FFFFFF' });
    s += line(kx - 40, ky, kx - 40 - 70, ky, C.grey, 1.2, '4 4') + path(`M${kx - 40 - 46},${ky} A46,46 0 0,1 ${r1(kx - 40 - 46 * Math.cos(Math.PI / 6))},${r1(ky - 46 * Math.sin(Math.PI / 6))}`, { stroke: C.amber, width: 1.6 });
    s += text(kx - 40 - 66, ky - 8, '30°', { size: 14, color: C.amber, weight: 'bold' });
    s += line(kx + 40, ky, kx + 40 + 70, ky, C.grey, 1.2, '4 4') + path(`M${kx + 40 + 46},${ky} A46,46 0 0,0 ${r1(kx + 40 + 46 * Math.cos(Math.PI / 6))},${r1(ky - 46 * Math.sin(Math.PI / 6))}`, { stroke: C.amber, width: 1.6 });
    s += text(kx + 40 + 50, ky - 8, '30°', { size: 14, color: C.amber, weight: 'bold' });
    s += text(kx, ky + 80, 'sign, 5.0 kg', { anchor: 'middle', size: 13, color: C.grey });
    return svgInline(560, 250, 'A 5.0 kg sign hangs at rest from two identical cords. Each cord makes a 30 degree angle with the horizontal, one going up to the left and one up to the right.', s);
  },
  // FRQ: a block sliding down a rough ramp
  rampSlide: () => {
    const x0 = 30, y0 = 280, x1 = 470, th = 30 * Math.PI / 180, y1 = y0 - (x1 - x0) * Math.tan(th);
    let s = path(`M${x0},${y0} L${x1},${y0} L${x1},${r1(y1)} Z`, { fill: C.pale, stroke: C.ink, width: 2.5 });
    const bx = 300, by = y0 - (bx - x0) * Math.tan(th);
    s += `<g transform="translate(${bx} ${r1(by)}) rotate(-30)">${rect(-35, -44, 70, 44, { fill: C.metal })}${text(0, -17, 'block', { anchor: 'middle', size: 13, weight: 'bold' })}</g>`;
    s += kinArrow(bx - 40, by - 70, bx - 40 - 70 * Math.cos(th), by - 70 + 70 * Math.sin(th), C.velocity) + text(bx - 100, by - 66, 'v', { size: 15, color: C.velocity, weight: 'bold', italic: true });
    s += path(`M${x0 + 70},${y0} A70,70 0 0,0 ${r1(x0 + 70 * Math.cos(th))},${r1(y0 - 70 * Math.sin(th))}`, { stroke: C.amber, width: 1.6 }) + text(x0 + 80, y0 - 12, 'θ', { size: 15, color: C.amber, weight: 'bold' });
    return svgInline(500, 300, 'A block slides down a straight ramp tilted at angle θ above the horizontal; its velocity points down the slope.', s);
  },
  // FRQ: two Atwood machines side by side
  atwoodPair: () => {
    let s = ceiling(20, 520, 24);
    const one = (cx, la, lb, ha, hb, tag) => {
      let o = line(cx, 24, cx, 50, C.grey, 3) + `<circle cx="${cx}" cy="64" r="20" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/><circle cx="${cx}" cy="64" r="3" fill="${C.ink}"/>`;
      o += line(cx - 20, 64, cx - 20, 64 + ha, C.ink, 1.8) + line(cx + 20, 64, cx + 20, 64 + hb, C.ink, 1.8);
      o += hanger(cx - 20, 64 + ha, 40, 32, la) + hanger(cx + 20, 64 + hb, 40, 32, lb);
      o += text(cx, 268, tag, { anchor: 'middle', size: 14, weight: 'bold' });
      return o;
    };
    s += one(150, 'm', '2m', 110, 140, 'Setup A') + one(390, '2m', '3m', 110, 140, 'Setup B');
    return svgInline(540, 285, 'Two Atwood machines. Setup A has blocks of mass m and 2m hanging on either side of a pulley; setup B has blocks of mass 2m and 3m.', s);
  },
  // 2.5: cart and hanging mass (the same scene as the figure, smaller)
  cartHanging: () => {
    let s = rect(20, 120, 300, 14, { fill: C.pale, stroke: C.ink });
    s += line(40, 134, 40, 240, C.grey, 5) + line(300, 134, 300, 240, C.grey, 5);
    s += cart(60, 120, 100, 30, 'cart');
    s += pulley(330, 104, 13);
    s += line(160, 91, 330, 91, C.ink, 1.8) + line(343, 104, 343, 180, C.ink, 1.8);
    s += hanger(343, 180, 38, 36, 'block');
    return svgInline(420, 250, 'A cart on a level table is tied to a light string that runs over a light pulley at the table edge to a hanging block.', s);
  },
  // 2.6: person on a scale in an elevator
  elevatorScale: () => {
    let s = rect(40, 20, 110, 220, { fill: '#F7F7F4', stroke: C.ink, width: 2.4, rx: 4 }) + line(95, 4, 95, 20, C.ink, 2);
    s += rect(65, 224, 60, 12, { fill: C.metal, rx: 2 }) + person(95, 224, 120);
    s += text(170, 120, 'scale under', { size: 12.5, color: C.grey }) + text(170, 136, 'the rider', { size: 12.5, color: C.grey });
    return svgInline(260, 250, 'A rider stands on a bathroom scale on the floor of an elevator.', s);
  },
  // 2.7: crate on a ramp at rest
  crateRamp: () => {
    const x0 = 30, y0 = 200, x1 = 430, y1 = 70;
    let s = path(`M${x0},${y0} L${x1},${y0} L${x1},${y1} Z`, { fill: C.pale, stroke: C.ink, width: 2.5 });
    const ang = Math.atan2(y0 - y1, x1 - x0) * 180 / Math.PI;
    s += `<g transform="translate(250 ${r1(y0 - (250 - x0) * (y0 - y1) / (x1 - x0))}) rotate(${-r1(ang)})">${crate(-40, -60, 80, 60, '')}</g>`;
    s += path(`M${x0 + 60},${y0} A60,60 0 0,0 ${r1(x0 + 60 * Math.cos(ang * Math.PI / 180))},${r1(y0 - 60 * Math.sin(ang * Math.PI / 180))}`, { stroke: C.amber, width: 1.6 });
    s += text(x0 + 70, y0 - 10, 'θ', { size: 15, color: C.amber, weight: 'bold' });
    return svgInline(460, 220, 'A wooden crate rests without sliding on a ramp tilted at angle θ above the horizontal.', s);
  },
  // 2.8: cart between a wall and a spring
  cartSpringWall: () => {
    let s = floor(20, 520, 160) + wall(60, 60, 160);
    s += springH(60, 230, 126, { coils: 9, amp: 10 });
    s += cart(230, 160, 110, 34, 'cart');
    s += line(300, 60, 300, 186, C.grey, 1.4, '4 3') + text(300, 200, 'relaxed position of the spring end', { size: 12, color: C.grey, anchor: 'middle' });
    s += line(230, 70, 300, 70, C.amber, 1.6) + line(230, 64, 230, 76, C.amber, 1.6) + line(300, 64, 300, 76, C.amber, 1.6) + text(265, 60, 'compression', { anchor: 'middle', size: 12.5, color: C.amber, weight: 'bold' });
    return svgInline(540, 210, 'A cart on a level track is attached to a horizontal spring whose other end is fixed to a wall. The cart has been pushed toward the wall, so the spring is compressed: its end sits to the left of the dashed line that marks where the end sits when the spring is relaxed.', s);
  },
  // 2.9: ball on a string whirled in a horizontal circle on a frictionless table (top view)
  puckString: () => {
    const cx = 160, cy = 130, R = 95;
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.light}" stroke-width="2" stroke-dasharray="6 6"/>`;
    s += dot(cx, cy, 6) + text(cx - 10, cy + 22, 'peg', { size: 12.5, color: C.grey });
    const px = cx + R * Math.cos(-0.5), py = cy + R * Math.sin(-0.5);
    s += line(cx, cy, px, py, C.ink, 2) + `<circle cx="${r1(px)}" cy="${r1(py)}" r="13" fill="#2E5E7E" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += kinArrow(px + 8, py + 14, px + 50, py + 88, C.velocity) + text(px + 58, py + 92, 'v', { size: 14, color: C.velocity, weight: 'bold', italic: true });
    s += text(300, 40, 'top view of a', { size: 12.5, color: C.grey }) + text(300, 56, 'frictionless table', { size: 12.5, color: C.grey });
    return svgInline(420, 250, 'Top view: a puck on a frictionless horizontal table moves in a circle at constant speed, held by a string tied to a central peg.', s);
  },
  // 2.9: car over a hill crest
  hillCrest: () => {
    let s = path('M10,190 Q240,40 470,190 L470,220 L10,220 Z', { fill: C.earth, stroke: C.ink, width: 2.5 });
    s += rect(212, 92, 56, 22, { fill: '#C0392B', rx: 6 }) + `<circle cx="225" cy="117" r="7" fill="${C.ink}"/><circle cx="255" cy="117" r="7" fill="${C.ink}"/>`;
    s += kinArrow(280, 100, 350, 100, C.velocity) + text(358, 105, 'v', { size: 14, color: C.velocity, weight: 'bold', italic: true });
    s += text(240, 175, 'crest: part of a vertical circle of radius r', { anchor: 'middle', size: 13, color: C.ink });
    return svgInline(480, 230, 'A car drives over the top of a rounded hill whose crest is part of a vertical circle of radius r.', s);
  },
};

/* Renders every stimulus scene to scratch for a look: node unit-2.mjs --stim <dir> */
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const dir = join(ROOT, 'physics', 'figures');
  mkdirSync(dir, { recursive: true });
  const si = process.argv.indexOf('--stim');
  if (si > -1) { const out = process.argv[si + 1]; mkdirSync(out, { recursive: true }); for (const [k, f] of Object.entries(STIM)) writeFileSync(join(out, `stim-${k}.svg`), f()); }
  const only = process.argv.slice(2).filter((a, i, all) => a !== '--stim' && all[i - 1] !== '--stim');
  for (const [id, f] of Object.entries(FIGS)) if (!only.length || only.includes(id)) writeFileSync(join(dir, `${id}.svg`), f());
  console.log(`unit-2 figures: ${Object.keys(FIGS).length} written`);
}
