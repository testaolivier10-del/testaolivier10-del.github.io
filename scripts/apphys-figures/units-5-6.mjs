/* Figures for AP® Physics 1 Units 5 and 6 (torque, rotational dynamics,
   rotational energy and angular momentum, rolling, orbits), and the inline
   scenes the Unit 5-6 question stimuli use. Self-contained (its own small
   drawing kit), so it never depends on another unit's generator. Run:
     node scripts/apphys-figures/units-5-6.mjs
   Writes physics/figures/<id>.svg: standalone SVG, white background,
   role="img" with <title> and <desc>, Arial/Helvetica, ink #1F2A28, amber
   #734200 for emphasis, force colours of the trainers. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const C = {
  ink: '#1F2A28', amber: '#734200', grey: '#5A6268', light: '#C9CFCC', pale: '#EEF1EF', paleAmber: '#FBEED5',
  gravity: '#0072B2', normal: '#009E73', tension: '#7A4F9E', friction: '#D55E00', spring: '#CC79A7',
  applied: '#5A6268', buoyant: '#3E9BC8', velocity: '#B07A00', accel: '#A33B26',
  wood: '#E9D8B8', metal: '#B9C2C7', metalDark: '#8E989E', skin: '#E8C4A0', shirt: '#9DB7C9', planet: '#6FA3C7',
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
/* A symbol with a subscript: sub('F', 'g') -> F with subscript g. */
export const sub = (a, b) => `<tspan font-style="italic">${a}</tspan><tspan baseline-shift="sub" font-size="75%">${b}</tspan>`;
export function arrow(x1, y1, x2, y2, color = C.ink, o = {}) {
  const w = o.width || 3, head = o.head || 11, hw = o.headWidth || 6;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const bx = x2 - ux * head, by = y2 - uy * head;
  const dash = o.dash ? ` stroke-dasharray="${o.dash}"` : '';
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(bx)}" y2="${r1(by)}" stroke="${color}" stroke-width="${w}"${dash}/>` +
    `<polygon points="${r1(x2)},${r1(y2)} ${r1(bx - uy * hw)},${r1(by + ux * hw)} ${r1(bx + uy * hw)},${r1(by - ux * hw)}" fill="${color}"/>`;
}
/* A circular arc arrow around (cx, cy), radius r, from angle a0 to a1 in
   degrees measured counterclockwise from +x on the page (y up). The head is at a1. */
export function arcArrow(cx, cy, r, a0, a1, color = C.ink, o = {}) {
  const w = o.width || 2.5, head = o.head || 10, hw = o.headWidth || 5.5;
  const P = a => [cx + r * Math.cos(a * Math.PI / 180), cy - r * Math.sin(a * Math.PI / 180)];
  const ccw = a1 > a0;
  const back = (head / r) * 180 / Math.PI * (ccw ? 1 : -1);
  const [x0, y0] = P(a0), [xe, ye] = P(a1 - back);
  const large = Math.abs(a1 - back - a0) > 180 ? 1 : 0;
  const sweep = ccw ? 0 : 1;
  const [tx, ty] = P(a1);
  // head direction: tangent at a1
  const ux = tx - xe, uy = ty - ye, L = Math.hypot(ux, uy) || 1, nx = ux / L, ny = uy / L;
  return `<path d="M${r1(x0)},${r1(y0)} A${r} ${r} 0 ${large} ${sweep} ${r1(xe)},${r1(ye)}" fill="none" stroke="${color}" stroke-width="${w}"/>` +
    `<polygon points="${r1(tx)},${r1(ty)} ${r1(xe - ny * hw)},${r1(ye + nx * hw)} ${r1(xe + ny * hw)},${r1(ye - nx * hw)}" fill="${color}"/>`;
}
export function dim(x1, y1, x2, y2, label, o = {}) {
  const c = o.color || C.grey;
  const s = arrow((x1 + x2) / 2, (y1 + y2) / 2, x1, y1, c, { width: 1.4, head: 8, headWidth: 4 }) + arrow((x1 + x2) / 2, (y1 + y2) / 2, x2, y2, c, { width: 1.4, head: 8, headWidth: 4 });
  return s + (label ? text(o.lx ?? (x1 + x2) / 2, o.ly ?? (y1 + y2) / 2 - 6, label, { size: o.size || 13, anchor: o.anchor || 'middle', color: o.lcolor || C.ink, italic: o.italic, weight: o.weight }) : '');
}
export function dot(x, y, r = 4, color = C.ink) { return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${color}"/>`; }
export function circle(x, y, r, fill, stroke = C.ink, w = 2) { return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`; }
export function dashed(x1, y1, x2, y2, color = C.grey, w = 1.5) { return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="${w}" stroke-dasharray="6 5"/>`; }
export function line(x1, y1, x2, y2, color = C.ink, w = 2) { return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="${w}"/>`; }
export function rect(x, y, w, h, fill, o = {}) { return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 3}" fill="${fill}" stroke="${o.stroke || C.ink}" stroke-width="${o.width ?? 2}"/>`; }
export function path(d, o = {}) { return `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.ink}" stroke-width="${o.width || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.join ? ` stroke-linejoin="${o.join}"` : ''}/>`; }
export function panel(x, y, w, h) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${C.pale}" stroke="${C.light}"/>`; }
/* Ground from x1 to x2 at y, hatched below. */
export function ground(x1, x2, y) {
  let s = `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="10" fill="${C.pale}"/>` + line(x1, y, x2, y, C.ink, 2.5);
  for (let x = x1 + 4; x < x2; x += 12) s += line(x, y, x - 8, y + 9, C.grey, 1);
  return s;
}
export function ceiling(x1, x2, y) {
  let s = `<rect x="${x1}" y="${y - 10}" width="${x2 - x1}" height="10" fill="${C.pale}"/>` + line(x1, y, x2, y, C.ink, 2.5);
  for (let x = x1 + 4; x < x2; x += 12) s += line(x, y, x + 8, y - 9, C.grey, 1);
  return s;
}
export function wallV(x, y1, y2) {
  let s = `<rect x="${x - 12}" y="${y1}" width="12" height="${y2 - y1}" fill="${C.pale}"/>` + line(x, y1, x, y2, C.ink, 2.5);
  for (let y = y1 + 4; y < y2; y += 10) s += line(x, y, x - 10, y + 8, C.grey, 1);
  return s;
}
/* A pivot triangle with its tip at (x, y). */
export function pivot(x, y, w = 34, h = 32) { return `<polygon points="${x},${y} ${x - w / 2},${y + h} ${x + w / 2},${y + h}" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>`; }
/* A wheel with spokes. */
export function wheel(cx, cy, R, o = {}) {
  let s = circle(cx, cy, R, o.fill || C.metal, C.ink, 2.5) + circle(cx, cy, R * 0.82, o.inner || '#FFFFFF', C.ink, 1.5);
  const n = o.spokes ?? 6;
  for (let i = 0; i < n; i++) { const a = (o.rot || 0) + i * 2 * Math.PI / n; s += line(cx + R * 0.12 * Math.cos(a), cy + R * 0.12 * Math.sin(a), cx + R * 0.82 * Math.cos(a), cy + R * 0.82 * Math.sin(a), C.metalDark, 3); }
  return s + circle(cx, cy, R * 0.12, C.metalDark, C.ink, 1.5) + dot(cx, cy, 3);
}
/* A person, side view, standing (feet at y). arms: 'down' | 'out' | 'in'. */
export function person(x, y, o = {}) {
  const h = o.h || 150, head = h * 0.09, sh = y - h * 0.80;
  let s = '';
  // legs
  s += line(x - 8, y - h * 0.45, x - 10, y, C.ink, 7) + line(x + 8, y - h * 0.45, x + 10, y, C.ink, 7);
  // torso
  s += `<rect x="${r1(x - 17)}" y="${r1(sh)}" width="34" height="${r1(h * 0.38)}" rx="10" fill="${C.shirt}" stroke="${C.ink}" stroke-width="2"/>`;
  s += circle(x, sh - head - 4, head, C.skin, C.ink, 2);
  return s;
}
export function svgDoc(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="Arial, Helvetica, sans-serif">\n<title id="t">${esc(title)}</title>\n<desc id="d">${esc(desc)}</desc>\n<rect width="${w}" height="${h}" fill="#FFFFFF"/>\n${body}\n</svg>\n`;
}
/* Inline SVG for a question stimulus. */
export function svgInline(w, h, label, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" font-family="Arial, Helvetica, sans-serif" style="max-width:100%;height:auto"><rect width="${w}" height="${h}" fill="#FFFFFF"/>${body}</svg>`;
}
export function writeFig(id, svg) {
  const dir = join(ROOT, 'physics', 'figures');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${id}.svg`), svg);
}
const P = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy - r * Math.sin(deg * Math.PI / 180)];

/* ---------------------------------------------------------------- figures */
export const FIGS = {};

/* 5.1: a wheel turned through 1 radian, and the angular quantities. */
FIGS['wheel-angle-radians'] = () => {
  const W = 760, H = 400, cx = 200, cy = 215, R = 130;
  let s = text(W / 2, 28, 'Describing rotation with angles in radians', { anchor: 'middle', size: 17, weight: 'bold' });
  s += wheel(cx, cy, R, { spokes: 0, fill: C.metal, inner: '#FFFFFF' });
  // reference line and the painted spoke at θ = 1 rad
  s += dashed(cx, cy, cx + R + 40, cy, C.grey, 1.5) + text(cx + R + 44, cy + 5, 'reference', { size: 12, color: C.grey });
  const th = 180 / Math.PI;
  const [ex, ey] = P(cx, cy, R * 0.82, th);
  s += line(cx, cy, ex, ey, C.amber, 5);
  // rim distance equal to r, highlighted
  const [ax, ay] = P(cx, cy, R, 0), [bx, by] = P(cx, cy, R, th);
  s += `<path d="M${r1(ax)},${r1(ay)} A${R} ${R} 0 0 0 ${r1(bx)},${r1(by)}" fill="none" stroke="${C.amber}" stroke-width="7" stroke-linecap="round"/>`;
  s += text(cx + R + 12, cy - 78, 'rim distance', { size: 13, weight: 'bold', color: C.amber }) + text(cx + R + 12, cy - 61, '= r', { size: 13, weight: 'bold', color: C.amber });
  // radius label on the reference line
  s += dim(cx, cy + 16, cx + R, cy + 16, '', {}) + text(cx + R / 2, cy + 36, 'r', { anchor: 'middle', size: 15, italic: true });
  // angle arc
  s += arcArrow(cx, cy, 44, 3, th - 2, C.ink, { width: 1.8, head: 8, headWidth: 4 });
  s += text(cx + 48, cy - 22, 'θ = 1 rad', { size: 14, weight: 'bold' });
  // ω arrow outside the rim, counterclockwise
  s += arcArrow(cx, cy, R + 22, 120, 200, C.velocity, { width: 3 });
  s += text(24, 58, 'ω: counterclockwise, called positive', { size: 13, weight: 'bold', color: C.velocity });
  s += dot(cx, cy, 5) + text(cx - 8, cy + 26, 'axis', { size: 12, anchor: 'end', color: C.grey });
  // panel: linear vs angular
  const px = 440, py = 58;
  s += panel(px, py, 300, 316);
  s += text(px + 16, py + 28, 'Line', { size: 14, weight: 'bold' }) + text(px + 170, py + 28, 'Rotation', { size: 14, weight: 'bold', color: C.amber });
  const rows = [['x (m)', 'θ (rad)'], ['v (m/s)', 'ω (rad/s)'], ['a (m/s²)', 'α (rad/s²)'], ['v = v₀ + at', 'ω = ω₀ + αt'], ['x = x₀ + v₀t + ½at²', 'θ = θ₀ + ω₀t + ½αt²'], ['v² = v₀² + 2aΔx', 'ω² = ω₀² + 2αΔθ']];
  rows.forEach(([a, b], i) => { const y = py + 60 + i * 36; s += text(px + 16, y, a, { size: 13 }) + text(px + 170, y, b, { size: 13, color: C.amber, weight: 'bold' }); if (i === 2) s += line(px + 12, y + 14, px + 298, y + 14, C.light, 1); });
  s += text(px + 16, py + 296, '1 revolution = 2π rad = 360°', { size: 13, weight: 'bold' });
  return svgDoc(W, H, 'A wheel turned through one radian', 'A wheel turns about an axis through its center. A painted spoke has turned counterclockwise from a dashed reference line through an angle of 1 radian: the distance along the rim between the reference line and the spoke, highlighted, equals the radius r. A curved arrow outside the rim shows the angular velocity ω, counterclockwise, called positive. A side panel pairs each straight-line quantity with its rotational partner: position x with angle θ in radians, velocity v with angular velocity ω, acceleration a with angular acceleration α, and the three constant-acceleration equations with their rotational forms. One revolution is 2π rad, or 360 degrees.', s);
};

/* 5.2: a merry-go-round seen from above; same ω, speed grows with r. */
FIGS['carousel-speeds'] = () => {
  const W = 760, H = 440, cx = 210, cy = 225, R = 150;
  let s = text(W / 2, 28, 'Every point shares ω; speed grows with distance from the axis', { anchor: 'middle', size: 17, weight: 'bold' });
  s += circle(cx, cy, R, C.wood, C.ink, 2.5);
  for (let i = 0; i < 8; i++) { const [x, y] = P(cx, cy, R, i * 45); s += line(cx, cy, x, y, '#C9B48E', 2); }
  s += circle(cx, cy, 14, C.metal, C.ink, 2) + dot(cx, cy, 3);
  // riders on the radial line at 30 degrees
  const ang = 30;
  const [Ax, Ay] = P(cx, cy, R - 10, ang), [Bx, By] = P(cx, cy, (R - 10) / 2, ang);
  s += line(cx, cy, Ax, Ay, C.grey, 1.5);
  s += circle(Ax, Ay, 13, C.shirt, C.ink, 2) + text(Ax + 10, Ay + 30, 'A', { size: 16, weight: 'bold' });
  s += circle(Bx, By, 13, C.shirt, C.ink, 2) + text(Bx + 10, By + 30, 'B', { size: 16, weight: 'bold' });
  // velocities perpendicular to the radius (counterclockwise rotation): direction angle ang+90
  const vd = [Math.cos((ang + 90) * Math.PI / 180), -Math.sin((ang + 90) * Math.PI / 180)];
  s += arrow(Ax, Ay, Ax + vd[0] * 110, Ay + vd[1] * 110, C.velocity, { width: 3.5 });
  s += text(Ax + vd[0] * 110 - 6, Ay + vd[1] * 110 - 8, `${sub('v', 'A')} = (2r)ω`, { size: 14, weight: 'bold', color: C.velocity, anchor: 'end' });
  s += arrow(Bx, By, Bx + vd[0] * 55, By + vd[1] * 55, C.velocity, { width: 3.5 });
  s += text(Bx + vd[0] * 55 - 8, By + vd[1] * 55 - 4, `${sub('v', 'B')} = rω`, { size: 14, weight: 'bold', color: C.velocity, anchor: 'end' });
  s += arcArrow(cx, cy, R + 20, 195, 250, C.ink, { width: 2.5 });
  s += text(cx + 20, cy + R + 30, 'ω, counterclockwise (same for A and B)', { size: 13, weight: 'bold', anchor: 'middle' });
  // panel
  const px = 450, py = 70;
  s += panel(px, py, 290, 300);
  s += text(px + 16, py + 30, 'A point at distance r', { size: 14, weight: 'bold' }) + text(px + 16, py + 50, 'from the axis', { size: 14, weight: 'bold' });
  const eq = [['s = rθ', 'distance along its circle'], ['v = rω', 'its speed'], [`${sub('a', 'T')} = rα`, 'its tangential acceleration']];
  eq.forEach(([a, b], i) => { s += text(px + 16, py + 92 + i * 52, a, { size: 18, weight: 'bold', color: C.amber }) + text(px + 16, py + 112 + i * 52, b, { size: 13, color: C.grey }); });
  s += text(px + 16, py + 262, 'θ, ω and α must be in radians.', { size: 13 });
  s += text(px + 16, py + 282, 'A is twice as far out: twice the speed.', { size: 13 });
  return svgDoc(W, H, 'A merry-go-round seen from above', 'A merry-go-round seen from above turns counterclockwise about its center. Rider A sits near the rim and rider B halfway out on the same radius. Both turn through the same angle each second, so they share the same angular velocity ω. Their velocity arrows are perpendicular to the radius, and A’s arrow is twice as long as B’s, because A is twice as far from the axis: v = rω. A panel lists s = rθ, v = rω and a_T = rα, with angles in radians.', s);
};

/* 5.3: a wrench on a bolt, line of action and lever arm. */
FIGS['wrench-lever-arm'] = () => {
  const W = 760, H = 470, ox = 140, oy = 250, L = 320, th = 60;
  let s = text(W / 2, 28, 'Torque: force times lever arm', { anchor: 'middle', size: 17, weight: 'bold' });
  // bolt (hexagon) and wrench
  const hex = [...Array(6)].map((_, i) => P(ox, oy, 26, i * 60 + 30)).map(p => p.map(r1).join(',')).join(' ');
  s += `<rect x="${ox}" y="${oy - 12}" width="${L + 14}" height="24" rx="12" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>`;
  s += circle(ox, oy, 38, C.metal, C.ink, 2) + `<polygon points="${hex}" fill="${C.metalDark}" stroke="${C.ink}" stroke-width="2"/>` + dot(ox, oy, 4);
  // r along the handle
  const ex = ox + L, ey = oy;
  s += dim(ox, oy - 46, ex, oy - 46, '', {}) + text((ox + ex) / 2, oy - 56, 'r (axis to where the force acts)', { anchor: 'middle', size: 13 });
  // force at angle th above the handle
  const d = [Math.cos(th * Math.PI / 180), -Math.sin(th * Math.PI / 180)], F = 150;
  s += arrow(ex, ey, ex + d[0] * F, ey + d[1] * F, C.applied, { width: 4, head: 13, headWidth: 7 });
  s += text(ex + d[0] * F + 10, ey + d[1] * F + 4, `${sub('F', 'A')}, hand on wrench`, { size: 14, weight: 'bold', color: C.applied });
  // angle between r and F
  s += arcArrow(ex, ey, 34, 2, th - 2, C.ink, { width: 1.5, head: 7, headWidth: 3.5 }) + text(ex + 36, ey - 12, 'θ', { size: 15, italic: true });
  s += dashed(ex, ey, ex + 70, ey, C.light, 1.2);
  // line of action extended back, and the perpendicular from the axis
  const t = (ox - ex) * d[0] + (oy - ey) * d[1];
  const fx = ex + t * d[0], fy = ey + t * d[1];
  s += dashed(ex, ey, fx - d[0] * 30, fy - d[1] * 30, C.grey, 1.6);
  s += text(fx - d[0] * 30 + 8, fy - d[1] * 30 + 4, 'line of action', { size: 13, color: C.grey });
  s += line(ox, oy, fx, fy, C.amber, 4);
  // right-angle mark at the foot
  const u = [(ox - fx), (oy - fy)], uL = Math.hypot(...u), un = [u[0] / uL, u[1] / uL];
  const k = 12;
  s += `<polyline points="${r1(fx + un[0] * k)},${r1(fy + un[1] * k)} ${r1(fx + un[0] * k - d[0] * k)},${r1(fy + un[1] * k - d[1] * k)} ${r1(fx - d[0] * k)},${r1(fy - d[1] * k)}" fill="none" stroke="${C.amber}" stroke-width="1.6"/>`;
  { const mx = (ox + fx) / 2, my = (oy + fy) / 2, ang = Math.atan2(fy - oy, fx - ox) * 180 / Math.PI, ox2 = mx - 18 * Math.sin(ang * Math.PI / 180), oy2 = my + 18 * Math.cos(ang * Math.PI / 180);
    s += `<text x="${r1(ox2)}" y="${r1(oy2)}" font-size="14" font-weight="bold" fill="${C.amber}" text-anchor="middle" transform="rotate(${r1(ang)} ${r1(ox2)} ${r1(oy2)})">lever arm ${sub('r', '⊥')} = r sin θ</text>`; }
  // panel
  const px = 470, py = 300;
  s += panel(px, py, 270, 150);
  s += text(px + 16, py + 32, `τ = ${sub('r', '⊥')}F = rF sin θ`, { size: 18, weight: 'bold', color: C.amber });
  s += text(px + 16, py + 62, 'Unit: N·m', { size: 13 });
  s += text(px + 16, py + 86, 'This force turns the wrench', { size: 13 });
  s += text(px + 16, py + 104, 'counterclockwise: positive torque.', { size: 13 });
  s += text(px + 16, py + 128, 'A force through the axis: τ = 0.', { size: 13 });
  return svgDoc(W, H, 'A wrench, its line of action and its lever arm', 'A wrench grips a bolt, which is the axis of rotation. A hand pushes on the far end of the handle, a distance r from the axis, with a force F_A at angle θ = 60° to the handle, turning the wrench counterclockwise. A dashed line extends the force’s line of action. The lever arm, r⊥ = r sin θ, is the perpendicular distance from the axis to that line, drawn in amber with a right-angle mark. The panel gives τ = r⊥F = rF sin θ in N·m, notes that a counterclockwise torque is positive, and that a force whose line passes through the axis gives zero torque.', s);
};

/* 5.4: the same masses close to and far from the axis. */
FIGS['dumbbell-inertia'] = () => {
  const W = 760, H = 440;
  let s = text(W / 2, 28, 'Same mass, different distribution, different rotational inertia', { anchor: 'middle', size: 17, weight: 'bold' });
  const rig = (cx, cy, d, lab, I) => {
    let t = dashed(cx, cy - 50, cx, cy + 50, C.amber, 2) + arcArrow(cx, cy - 36, 26, 210, 330, C.amber, { width: 2 });
    t += line(cx - 170, cy, cx + 170, cy, C.ink, 4);
    t += circle(cx - d, cy, 20, C.metalDark, C.ink, 2) + circle(cx + d, cy, 20, C.metalDark, C.ink, 2);
    t += text(cx - d, cy + 5, 'm', { anchor: 'middle', size: 15, weight: 'bold', color: '#FFFFFF', italic: true }) + text(cx + d, cy + 5, 'm', { anchor: 'middle', size: 15, weight: 'bold', color: '#FFFFFF', italic: true });
    t += dim(cx, cy + 34, cx + d, cy + 34, '', {}) + text(cx + d / 2, cy + 54, lab, { anchor: 'middle', size: 14, italic: true });
    t += text(cx, cy + 82, I, { anchor: 'middle', size: 16, weight: 'bold', color: C.amber });
    return t;
  };
  s += rig(200, 140, 60, 'r', 'I = 2mr²') + text(30, 76, 'Masses close to the axis', { size: 14, weight: 'bold' });
  s += rig(200, 330, 120, '2r', 'I = 2m(2r)² = 8mr²');
  s += text(30, 266, 'Masses twice as far out', { size: 14, weight: 'bold' });
  const px = 450, py = 80;
  s += panel(px, py, 290, 300);
  s += text(px + 16, py + 32, 'I = Σ m r²', { size: 20, weight: 'bold', color: C.amber });
  s += text(px + 16, py + 58, 'r is each mass’s distance from', { size: 13 }) + text(px + 16, py + 76, 'the axis, so distance counts twice.', { size: 13 });
  s += text(px + 16, py + 110, 'Doubling r: 4 times the I.', { size: 14, weight: 'bold' });
  s += text(px + 16, py + 136, 'Shapes (given on the exam):', { size: 13, weight: 'bold' });
  const shapes = [['hoop about its center', 'MR²'], ['solid disk or cylinder', '½MR²'], ['solid sphere', '⅖MR²'], ['rod about its center', '¹⁄₁₂ML²'], ['rod about one end', '⅓ML²']];
  shapes.forEach(([a, b], i) => { s += text(px + 16, py + 162 + i * 24, a, { size: 13 }) + text(px + 270, py + 162 + i * 24, b, { size: 13, anchor: 'end', weight: 'bold' }); });
  s += text(px + 16, py + 290, 'Unit: kg·m²', { size: 13 });
  return svgDoc(W, H, 'Two dumbbells with the same mass but different rotational inertia', 'Two light rods each carry two equal masses m and turn about a vertical axis through their centers. In the top rod the masses sit a distance r from the axis, giving I = 2mr². In the bottom rod they sit at 2r, giving I = 8mr², four times as much with the same total mass. A panel gives I = Σmr², notes that doubling the distance quadruples I, and lists rotational inertias the exam gives for shapes: hoop MR², solid disk ½MR², solid sphere two fifths MR², rod about its center one twelfth ML², rod about one end one third ML². Unit kg·m².', s);
};

/* 5.5: a balanced seesaw and its force diagram. */
FIGS['seesaw-torques'] = () => {
  const W = 760, H = 520;
  let s = text(W / 2, 28, 'A balanced seesaw: the torques about the pivot add to zero', { anchor: 'middle', size: 17, weight: 'bold' });
  const cx = 380, py = 170, plank = 300, sc = 300 / 2.0;
  s += ground(60, 700, py + 58);
  s += `<polygon points="${cx},${py + 3} ${cx - 26},${py + 58} ${cx + 26},${py + 58}" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>`;
  s += rect(cx - plank, py - 10, 2 * plank, 12, C.wood, { rx: 2 });
  const kid = (x, lab, big) => { const h = big ? 92 : 78; return `<rect x="${x - 16}" y="${py - 10 - h * 0.62}" width="32" height="${h * 0.62}" rx="10" fill="${C.shirt}" stroke="${C.ink}" stroke-width="2"/>` + circle(x, py - 10 - h * 0.62 - 15, 14, C.skin, C.ink, 2) + text(x, py - 10 - h * 0.62 - 38, lab, { anchor: 'middle', size: 13, weight: 'bold' }); };
  const xA = cx - 1.6 * sc, xB = cx + 1.2 * sc;
  s += kid(xA, 'A: 30 kg', false) + kid(xB, 'B: 40 kg', true) + text(cx + 120, py - 18, 'uniform plank, 20 kg', { size: 12, color: C.grey });
  s += dim(xA, py + 20, cx - 6, py + 20, '', {}) + text((xA + cx) / 2, py + 38, '1.6 m', { anchor: 'middle', size: 13 });
  s += dim(cx + 6, py + 20, xB, py + 20, '', {}) + text((xB + cx) / 2, py + 38, '1.2 m', { anchor: 'middle', size: 13 });
  const fy = 400;
  s += text(60, 266, 'Force diagram of the plank (each force drawn where it acts):', { size: 14, weight: 'bold' });
  s += rect(cx - plank, fy - 6, 2 * plank, 12, C.wood, { rx: 2 });
  const k = 0.1;
  const FA = 30 * 9.8, FB = 40 * 9.8, Fp = 20 * 9.8, Fn = FA + FB + Fp;
  s += arrow(xA, fy + 6, xA, fy + 6 + FA * k, C.normal, { width: 3.5 }) + text(xA + 8, fy + 6 + FA * k + 4, `${sub('F', 'N')}, A on plank`, { size: 13, color: C.normal, weight: 'bold' });
  s += arrow(xB, fy + 6, xB, fy + 6 + FB * k, C.normal, { width: 3.5 }) + text(xB + 8, fy + 6 + FB * k + 4, `${sub('F', 'N')}, B on plank`, { size: 13, color: C.normal, weight: 'bold' });
  s += arrow(cx + 4, fy + 6, cx + 4, fy + 6 + Fp * k, C.gravity, { width: 3.5 }) + text(cx + 12, fy + 6 + Fp * k + 6, `${sub('F', 'g')}, Earth on plank`, { size: 13, color: C.gravity, weight: 'bold' });
  s += arrow(cx - 4, fy - 6, cx - 4, fy - 6 - Fn * k, C.normal, { width: 3.5 }) + text(cx + 6, fy - 6 - Fn * k + 14, `${sub('F', 'N')}, pivot on plank`, { size: 13, color: C.normal, weight: 'bold' });
  s += text(60, 484, 'About the pivot: (294 N)(1.6 m) = 470 N·m counterclockwise and (392 N)(1.2 m) = 470 N·m clockwise.', { size: 13 });
  s += text(60, 504, 'The pivot force and the plank’s weight act at the pivot, so their lever arms and torques are zero.', { size: 13 });
  return svgDoc(W, H, 'A balanced seesaw and the force diagram of its plank', 'A uniform plank rests on a pivot at its center. Child A, 30 kg, sits 1.6 m left of the pivot; child B, 40 kg, sits 1.2 m right of it, and the plank is balanced. Below, the force diagram of the plank shows each force where it acts: the normal force from A pushing down at A’s seat, the larger normal force from B pushing down at B’s seat, the plank’s weight (Earth on plank) down at the center, and the pivot’s normal force up at the center, the longest arrow, equal to the sum of the downward forces. About the pivot, A gives 294 N times 1.6 m counterclockwise and B gives 392 N times 1.2 m clockwise, both 470 N·m, so the net torque is zero; the pivot force and the plank’s weight act at the pivot and give no torque.', s);
};

/* 5.6: a pulley with mass, a hanging block, and their force diagrams. */
FIGS['pulley-block-forces'] = () => {
  const W = 760, H = 460;
  let s = text(W / 2, 28, 'A pulley with mass: rotation and translation together', { anchor: 'middle', size: 17, weight: 'bold' });
  // scene
  const cx = 150, cy = 120, R = 50;
  s += ceiling(60, 260, 54) + line(cx, 54, cx, cy, C.ink, 5);
  s += wheel(cx, cy, R, { spokes: 0, fill: C.metal, inner: C.metal });
  s += circle(cx, cy, R * 0.25, C.metalDark, C.ink, 1.5) + dot(cx, cy, 3);
  s += line(cx + R, cy, cx + R, 300, C.ink, 2) + rect(cx + R - 28, 300, 56, 50, C.metalDark, {}) + text(cx + R, 331, 'm', { anchor: 'middle', size: 16, italic: true, weight: 'bold', color: '#FFFFFF' });
  s += text(cx - R - 8, cy + 4, 'M, R', { anchor: 'end', size: 14, italic: true });
  s += arcArrow(cx, cy, R + 16, 60, -40, C.amber, { width: 2.5 }) + text(cx + R + 30, cy - 46, 'α', { size: 16, color: C.amber, italic: true, weight: 'bold' });
  s += arrow(cx + R + 44, 300, cx + R + 44, 350, C.accel, { width: 2.5 }) + text(cx + R + 52, 330, 'a', { size: 15, italic: true, color: C.accel, weight: 'bold' });
  s += text(40, 400, 'Light string, no slipping:', { size: 13 }) + text(40, 420, 'a = Rα', { size: 15, weight: 'bold', color: C.amber });
  // pulley force diagram
  const qx = 410, qy = 200, Q = 50;
  s += text(qx, 66, 'Pulley (force diagram)', { anchor: 'middle', size: 14, weight: 'bold' });
  s += circle(qx, qy, Q, C.pale, C.ink, 2) + dot(qx, qy, 4);
  s += arrow(qx + Q, qy, qx + Q, qy + 60, C.tension, { width: 3.5 }) + text(qx + Q + 6, qy + 74, `${sub('F', 'T')}, string on pulley`, { size: 13, color: C.tension, weight: 'bold' });
  s += arrow(qx - 4, qy, qx - 4, qy + 50, C.gravity, { width: 3.5 }) + text(qx - 10, qy + 66, `${sub('F', 'g')}, Earth on pulley`, { size: 13, color: C.gravity, weight: 'bold', anchor: 'end' });
  s += arrow(qx + 4, qy, qx + 4, qy - 110, C.normal, { width: 3.5 }) + text(qx + 12, qy - 96, `${sub('F', 'axle')}, axle on pulley`, { size: 13, color: C.normal, weight: 'bold' });
  s += text(qx, 330, 'Only the string’s pull has a lever arm (R):', { anchor: 'middle', size: 13 });
  s += text(qx, 354, `τ = ${sub('F', 'T')}R = Iα`, { anchor: 'middle', size: 17, weight: 'bold', color: C.amber });
  // block FBD
  const bx = 680, by = 210;
  s += text(bx - 40, 66, 'Block (free-body diagram)', { anchor: 'middle', size: 14, weight: 'bold' });
  s += dot(bx, by, 6);
  s += arrow(bx, by, bx, by - 70, C.tension, { width: 3.5 }) + text(bx - 10, by - 56, `${sub('F', 'T')}, string on block`, { size: 13, color: C.tension, weight: 'bold', anchor: 'end' });
  s += arrow(bx, by, bx, by + 110, C.gravity, { width: 3.5 }) + text(bx - 10, by + 100, `${sub('F', 'g')}, Earth on block`, { size: 13, color: C.gravity, weight: 'bold', anchor: 'end' });
  s += text(bx - 40, 354, `mg − ${sub('F', 'T')} = ma`, { anchor: 'middle', size: 17, weight: 'bold', color: C.amber });
  s += text(bx - 40, 380, `${sub('F', 'T')} < mg: the block`, { anchor: 'middle', size: 12.5 }) + text(bx - 40, 398, 'speeds up downward', { anchor: 'middle', size: 12.5 });
  return svgDoc(W, H, 'A pulley with mass, a hanging block and their force diagrams', 'A pulley of mass M and radius R turns on a fixed axle hung from the ceiling. A light string wrapped around its rim holds a block of mass m, which accelerates downward with acceleration a while the pulley gains angular acceleration α, with a = Rα. Middle: the force diagram of the pulley shows the string pulling down at the rim, Earth’s gravitational force down at the center and the axle’s force up at the center; only the string’s pull has a lever arm, so F_T R = Iα. Right: the free-body diagram of the block shows the string’s tension up, shorter than Earth’s gravitational force down, so mg − F_T = ma.', s);
};

/* 6.1: a spinning flywheel with its center at rest. */
FIGS['flywheel-energy'] = () => {
  const W = 760, H = 400, cx = 210, cy = 210, R = 130;
  let s = text(W / 2, 28, 'A spinning wheel has kinetic energy while its center stays put', { anchor: 'middle', size: 17, weight: 'bold' });
  s += ground(40, 380, 372) + `<polygon points="${cx - 18},${cy} ${cx - 60},372 ${cx - 40},372 ${cx},${cy + 30}" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>` + `<polygon points="${cx + 18},${cy} ${cx + 60},372 ${cx + 40},372 ${cx},${cy + 30}" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>`;
  s += wheel(cx, cy, R, { spokes: 6, fill: C.metalDark, inner: C.pale, rot: 0.3 });
  // velocities of rim pieces (counterclockwise)
  for (const a of [90, 270, 0, 180]) {
    const [x, y] = P(cx, cy, R * 0.91, a), d = [Math.cos((a + 90) * Math.PI / 180), -Math.sin((a + 90) * Math.PI / 180)];
    s += dot(x, y, 5, C.velocity) + arrow(x, y, x + d[0] * 62, y + d[1] * 62, C.velocity, { width: 3 });
  }
  s += text(24, 56, 'pieces of the rim move in', { size: 13, color: C.velocity, weight: 'bold' }) + text(24, 72, 'opposite directions', { size: 13, color: C.velocity, weight: 'bold' });
  s += text(cx + 12, cy + 24, `${sub('v', 'cm')} = 0`, { size: 14, weight: 'bold' });
  const px = 450, py = 70;
  s += panel(px, py, 290, 290);
  s += text(px + 16, py + 34, `${sub('K', 'rot')} = ½Iω²`, { size: 22, weight: 'bold', color: C.amber });
  const lines = ['Each piece of mass m at distance r', 'moves at v = rω, so its kinetic', 'energy is ½m(rω)². Adding them up', 'gives ½(Σmr²)ω² = ½Iω².', '', 'A scalar: no direction. Joules.', 'Twice the ω: four times the energy.', 'Same ω, mass moved outward:', 'more energy (larger I).'];
  lines.forEach((t, i) => { s += text(px + 16, py + 70 + i * 22, t, { size: 13, weight: i === 6 ? 'bold' : undefined }); });
  return svgDoc(W, H, 'A spinning flywheel with its center at rest', 'A flywheel spins counterclockwise on a fixed stand. Its center of mass does not move (v_cm = 0), yet every piece of the rim moves: velocity arrows at the top, bottom, left and right of the rim point in different, opposite directions, tangent to the rim. The wheel therefore has kinetic energy of rotation. A panel derives K_rot = ½Iω² from adding ½m(rω)² for every piece, notes it is a scalar measured in joules, that doubling ω quadruples it, and that moving mass outward at the same ω increases it.', s);
};

/* 6.2: a torque-angle graph; the area is the work. */
FIGS['torque-angle-work'] = () => {
  const W = 760, H = 410;
  let s = text(W / 2, 28, 'Work done by a torque is the area under the torque-angle graph', { anchor: 'middle', size: 17, weight: 'bold' });
  // crank wheel
  const cx = 140, cy = 200, R = 80;
  s += wheel(cx, cy, R, { spokes: 5, fill: C.metal, inner: C.pale });
  const [hx, hy] = P(cx, cy, R, 0);
  s += line(cx, cy, hx, hy, C.ink, 5) + circle(hx, hy, 8, C.wood, C.ink, 2);
  s += arrow(hx, hy, hx, hy - 80, C.applied, { width: 3.5 }) + text(hx + 10, hy - 64, `${sub('F', 'A')}, hand`, { size: 13, color: C.applied, weight: 'bold' }) + text(hx + 10, hy - 48, 'on handle', { size: 13, color: C.applied, weight: 'bold' });
  s += arcArrow(cx, cy, R + 18, 30, 150, C.amber, { width: 2.5 }) + text(cx, cy - R - 30, 'Δθ', { anchor: 'middle', size: 15, weight: 'bold', color: C.amber });
  s += text(cx, 330, 'W = τΔθ (constant τ)', { anchor: 'middle', size: 16, weight: 'bold', color: C.amber });
  s += text(cx, 352, 'Δθ in radians; W in joules', { anchor: 'middle', size: 13 });
  // graph
  const gx = 340, gy = 330, gw = 380, gh = 240, tmax = 24, tq = 5;
  const X = t => gx + t / tmax * gw, Y = v => gy - v / tq * gh;
  s += `<polygon points="${X(0)},${Y(0)} ${X(0)},${Y(4)} ${X(10)},${Y(4)} ${X(20)},${Y(0)}" fill="${C.paleAmber}"/>`;
  for (let t = 4; t <= tmax; t += 4) s += line(X(t), gy, X(t), gy - gh, '#E3E7E5', 1) + text(X(t), gy + 18, String(t), { anchor: 'middle', size: 12 });
  for (let v = 1; v <= tq; v++) s += line(gx, Y(v), gx + gw, Y(v), '#E3E7E5', 1) + text(gx - 8, Y(v) + 4, String(v), { anchor: 'end', size: 12 });
  s += text(gx - 8, gy + 4, '0', { anchor: 'end', size: 12 });
  s += line(gx, gy, gx + gw, gy, C.ink, 2) + line(gx, gy, gx, gy - gh - 8, C.ink, 2);
  s += path(`M${X(0)},${Y(4)} L${X(10)},${Y(4)} L${X(20)},${Y(0)} L${X(24)},${Y(0)}`, { stroke: C.amber, width: 3.5 });
  s += text(X(5), Y(2) + 5, '4.0 × 10 = 40 J', { anchor: 'middle', size: 13, weight: 'bold', color: C.amber });
  s += text(X(13.3), Y(1.2) + 5, '½ × 4.0 × 10', { anchor: 'middle', size: 12, weight: 'bold', color: C.amber }) + text(X(13.3), Y(0.6) + 5, '= 20 J', { anchor: 'middle', size: 12, weight: 'bold', color: C.amber });
  s += text(gx + gw / 2, gy + 40, 'Angle turned, θ (rad)', { anchor: 'middle', size: 13, weight: 'bold' });
  s += `<text x="${gx - 36}" y="${gy - gh / 2}" font-size="13" font-weight="bold" fill="${C.ink}" text-anchor="middle" transform="rotate(-90 ${gx - 36} ${gy - gh / 2})">Torque, τ (N·m)</text>`;
  s += text(gx + gw - 4, Y(4.6), 'total work = 60 J', { anchor: 'end', size: 14, weight: 'bold' });
  return svgDoc(W, H, 'A crank and a torque-angle graph', 'Left: a hand pushes up on the handle of a crank wheel, turning it counterclockwise through an angle Δθ; for a constant torque, the work is W = τΔθ, with the angle in radians and work in joules. Right: a graph of torque in N·m against angle in radians. The torque is 4.0 N·m from 0 to 10 rad, then falls in a straight line to zero at 20 rad and stays zero. The shaded area under the line is the work: a rectangle of 4.0 × 10 = 40 J plus a triangle of ½ × 4.0 × 10 = 20 J, 60 J in all.', s);
};

/* 6.3: a puck in straight-line motion has angular momentum about a point. */
FIGS['puck-passing-point'] = () => {
  const W = 760, H = 420;
  let s = text(W / 2, 28, 'Angular momentum of an object moving in a straight line', { anchor: 'middle', size: 17, weight: 'bold' });
  const px = 300, py = 320, d = 160, ly = py - d;
  s += `<rect x="40" y="60" width="520" height="320" rx="8" fill="${C.pale}" stroke="${C.light}"/>`;
  s += text(52, 82, 'top view of a level, frictionless table', { size: 12, color: C.grey });
  s += dashed(60, ly, 540, ly, C.light, 1.5);
  s += dot(px, py, 6) + text(px + 10, py + 22, 'point P', { size: 14, weight: 'bold' });
  const xs = [110, 300, 470];
  xs.forEach((x, i) => {
    s += line(px, py, x, ly, C.grey, i === 1 ? 0 : 1.6);
    s += circle(x, ly, 14, C.metalDark, C.ink, 2);
    s += arrow(x + 16, ly, x + 80, ly, C.velocity, { width: 3.5 });
  });
  s += text(110 + 66, ly + 22, 'v', { size: 15, weight: 'bold', italic: true, color: C.velocity });
  s += text(176, ly + 90, 'r', { size: 15, italic: true, color: C.grey });
  // angle at first puck between r (from P to puck, extended) and v
  const a = Math.atan2(-(ly - py), 110 - px) * 180 / Math.PI;
  { const thr = 180 - Math.atan2(py - ly, px - 110) * 180 / Math.PI; // direction of r beyond the puck
    const [ex2, ey2] = P(110, ly, 70, thr); s += dashed(110, ly, ex2, ey2, C.grey, 1.3);
    const [a0x, a0y] = P(110, ly, 30, 0), [a1x, a1y] = P(110, ly, 30, thr);
    s += `<path d="M${r1(a0x)},${r1(a0y)} A30 30 0 0 0 ${r1(a1x)},${r1(a1y)}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`;
    const [tx, ty] = P(110, ly, 42, thr / 2); s += text(tx, ty + 5, 'θ', { size: 15, italic: true, anchor: 'middle' }); }
  s += line(px, py, px, ly, C.amber, 4) + text(px + 10, (py + ly) / 2 + 5, `${sub('r', '⊥')} = d`, { size: 15, weight: 'bold', color: C.amber });
  s += `<polyline points="${px},${ly + 12} ${px + 12},${ly + 12} ${px + 12},${ly}" fill="none" stroke="${C.amber}" stroke-width="1.6"/>`;
  const qx = 580;
  s += panel(qx, 60, 160, 320);
  const t = ['L = rmv sin θ', '= m v d', '', 'r grows as the', 'puck moves off,', 'but r sin θ = d', 'stays the same.', '', 'So L about P', 'is constant.', '', 'About a point on', 'the dashed line:', 'L = 0.'];
  t.forEach((x, i) => { s += text(qx + 12, 92 + i * 21, x, { size: i < 2 ? 16 : 13, weight: i < 2 || i === 8 || i === 9 ? 'bold' : undefined, color: i < 2 ? C.amber : C.ink }); });
  void a;
  return svgDoc(W, H, 'A puck sliding past a point has constant angular momentum about it', 'Top view of a level, frictionless table. A puck of mass m slides at constant velocity v along a straight dashed line. A point P lies off the line, a perpendicular distance d from it. The puck is shown at three positions; grey lines from P reach the first and third positions, and at the first one the angle θ between r and v is marked. The amber perpendicular from P to the line has length r⊥ = d. A panel gives L = rmv sin θ = mvd: r changes as the puck moves, but r sin θ always equals d, so the angular momentum about P is constant. About any point on the puck’s own line, L is zero.', s);
};

/* 6.4: a student on a rotating stool, arms out and arms in. */
FIGS['stool-arms-in-out'] = () => {
  const W = 760, H = 420;
  let s = text(W / 2, 28, 'Zero external torque: pulling the weights in raises ω', { anchor: 'middle', size: 17, weight: 'bold' });
  const scene = (cx, out) => {
    const fy = 330;
    let t = ground(cx - 160, cx + 160, fy + 30);
    t += rect(cx - 40, fy + 22, 80, 8, C.metalDark, {}) + line(cx, fy + 22, cx, fy - 20, C.ink, 6) + rect(cx - 50, fy - 30, 100, 12, C.wood, { rx: 4 });
    // seated student: torso and head
    const top = fy - 30;
    t += `<rect x="${cx - 18}" y="${top - 86}" width="36" height="86" rx="12" fill="${C.shirt}" stroke="${C.ink}" stroke-width="2"/>`;
    t += circle(cx, top - 106, 17, C.skin, C.ink, 2);
    t += line(cx - 8, top - 4, cx - 44, top + 4, C.ink, 7) + line(cx + 8, top - 4, cx + 44, top + 4, C.ink, 7);
    const ay = top - 70, reach = out ? 120 : 34;
    t += line(cx - 14, ay, cx - reach, ay, C.skin, 8) + line(cx + 14, ay, cx + reach, ay, C.skin, 8);
    for (const sgn of [-1, 1]) t += rect(cx + sgn * reach - 9, ay - 14, 18, 28, C.metalDark, { rx: 3 });
    t += dashed(cx, top - 150, cx, fy + 22, C.amber, 2);
    const big = !out;
    t += `<ellipse cx="${cx}" cy="${top - 140}" rx="${out ? 60 : 60}" ry="12" fill="none" stroke="${C.velocity}" stroke-width="${big ? 4 : 2.5}"/>`;
    t += `<polygon points="${cx + 6},${top - 128} ${cx - 8},${top - 122} ${cx - 8},${top - 134}" fill="${C.velocity}" transform="translate(${-6},0)"/>`;
    return t;
  };
  s += scene(200, true) + scene(560, false);
  s += text(200, 70, 'Arms out', { anchor: 'middle', size: 15, weight: 'bold' }) + text(560, 70, 'Arms in', { anchor: 'middle', size: 15, weight: 'bold' });
  s += text(200, 400, 'large I, small ω', { anchor: 'middle', size: 14, weight: 'bold', color: C.amber }) + text(560, 400, 'small I, large ω', { anchor: 'middle', size: 14, weight: 'bold', color: C.amber });
  s += arrow(330, 230, 430, 230, C.ink, { width: 2.5 });
  s += text(380, 214, 'L = Iω', { anchor: 'middle', size: 15, weight: 'bold' }) + text(380, 254, 'stays the same', { anchor: 'middle', size: 12.5 });
  return svgDoc(W, H, 'A student on a rotating stool pulls two weights inward', 'Two side views of the same student seated on a stool that turns freely on a vertical axle with very little friction. Left: arms stretched out holding a weight in each hand; the student has a large rotational inertia and turns slowly, shown by a thin rotation arrow around the axis. Right: arms pulled in close to the body; the rotational inertia is smaller and the student turns faster, shown by a thicker arrow. The net external torque about the axle is close to zero, so the angular momentum L = Iω stays the same while I falls and ω rises.', s);
};

/* 6.5: the rolling race and how each shape splits its kinetic energy. */
FIGS['rolling-race'] = () => {
  const W = 760, H = 420;
  let s = text(W / 2, 28, 'The rolling race: less rotational inertia, faster at the bottom', { anchor: 'middle', size: 17, weight: 'bold' });
  // ramp
  const x0 = 40, y0 = 360, x1 = 330, top = 120;
  s += `<polygon points="${x0},${top} ${x0},${y0} ${x1},${y0}" fill="${C.pale}" stroke="${C.ink}" stroke-width="2.5"/>`;
  s += ground(20, 360, y0);
  const ang = Math.atan2(y0 - top, x1 - x0);
  const n = [Math.sin(ang), -Math.cos(ang)]; // outward normal (up-right)
  const along = [Math.cos(ang), Math.sin(ang)];
  const objs = [{ r: 20, k: 'sphere', fill: '#C0D6E4' }, { r: 20, k: 'disk', fill: C.wood }, { r: 20, k: 'hoop', fill: 'none' }];
  objs.forEach((o, i) => {
    const t = 30 + i * 52, bx = x0 + along[0] * t + n[0] * o.r, by = top + along[1] * t + n[1] * o.r;
    if (o.k === 'hoop') s += `<circle cx="${r1(bx)}" cy="${r1(by)}" r="${o.r}" fill="none" stroke="${C.ink}" stroke-width="5"/>`;
    else s += circle(bx, by, o.r, o.fill, C.ink, 2);
    if (o.k === 'sphere') s += `<ellipse cx="${r1(bx - 6)}" cy="${r1(by - 6)}" rx="6" ry="4" fill="#FFFFFF" opacity="0.7"/>`;
    if (o.k === 'disk') s += dot(bx, by, 3);
  });
  s += dim(x0 - 16 + 6, top, x0 - 16 + 6, y0, '', {}) + text(x0 + 10, (top + y0) / 2 + 30, 'h', { size: 15, italic: true });
  s += text(170, 108, 'Released from rest;', { size: 13 }) + text(170, 125, 'roll without slipping', { size: 13 });
  // table
  const tx = 380, ty = 70;
  s += panel(tx, ty, 360, 330);
  s += text(tx + 14, ty + 26, 'Shape', { size: 13, weight: 'bold' }) + text(tx + 110, ty + 26, 'I (given)', { size: 13, weight: 'bold' }) + text(tx + 190, ty + 26, 'Split of K at the bottom', { size: 13, weight: 'bold' });
  const rows = [['solid sphere', '⅖MR²', 0.4, '1st'], ['solid disk', '½MR²', 0.5, '2nd'], ['hoop', 'MR²', 1, '3rd']];
  rows.forEach(([nm, I, b, place], i) => {
    const y = ty + 66 + i * 74;
    s += text(tx + 14, y, nm, { size: 13, weight: 'bold' }) + text(tx + 14, y + 18, `finishes ${place}`, { size: 12, color: C.amber, weight: 'bold' }) + text(tx + 110, y, I, { size: 14 });
    const bw = 150, ft = 1 / (1 + b);
    s += `<rect x="${tx + 190}" y="${y - 14}" width="${r1(bw * ft)}" height="22" fill="${C.velocity}"/><rect x="${r1(tx + 190 + bw * ft)}" y="${y - 14}" width="${r1(bw * (1 - ft))}" height="22" fill="${C.paleAmber}" stroke="${C.amber}" stroke-width="1"/>`;
    s += text(tx + 190, y + 24, `${Math.round(ft * 100)}% moving`, { size: 11.5 }) + text(tx + 190 + bw, y + 24, `${Math.round((1 - ft) * 100)}% spinning`, { size: 11.5, anchor: 'end' });
  });
  s += text(tx + 14, ty + 278, `Mgh = ½Mv² + ½Iω², with v = Rω:`, { size: 13 });
  s += text(tx + 14, ty + 304, 'v = √(2gh / (1 + I/MR²))', { size: 15, weight: 'bold', color: C.amber });
  s += text(tx + 14, ty + 324, 'Mass and radius cancel; only the shape counts.', { size: 12 });
  return svgDoc(W, H, 'A solid sphere, a solid disk and a hoop race down a ramp', 'A ramp of height h with a solid sphere, a solid disk and a hoop at the top, released from rest to roll without slipping. A table gives each shape’s rotational inertia (sphere two fifths MR², disk ½MR², hoop MR²), its finishing place (sphere first, disk second, hoop third) and a bar showing how its kinetic energy at the bottom splits between moving along (translation) and spinning (rotation): sphere 71% and 29%, disk 67% and 33%, hoop 50% and 50%. Energy conservation Mgh = ½Mv² + ½Iω² with v = Rω gives v = √(2gh/(1 + I/MR²)); mass and radius cancel, so only the shape decides the order.', s);
};

/* 6.6: an elliptical orbit with energy bars at the near and far points. */
FIGS['elliptical-orbit-energy'] = () => {
  const W = 760, H = 430;
  let s = text(W / 2, 28, 'An elliptical orbit: E and L constant, K and U trade', { anchor: 'middle', size: 17, weight: 'bold' });
  const cx = 250, cy = 232, a = 190, b = 165, c = Math.sqrt(a * a - b * b);
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" fill="none" stroke="${C.grey}" stroke-width="1.8" stroke-dasharray="7 5"/>`;
  const fx = cx - c;
  s += circle(fx, cy, 30, C.planet, C.ink, 2) + text(fx, cy + 5, 'M', { anchor: 'middle', size: 15, weight: 'bold', italic: true, color: '#FFFFFF' });
  const Ax = cx - a, Bx = cx + a, rA = a - c, rB = a + c;
  s += circle(Ax, cy, 9, C.metalDark, C.ink, 2) + text(Ax - 14, cy + 5, 'A', { anchor: 'end', size: 16, weight: 'bold' });
  s += circle(Bx, cy, 9, C.metalDark, C.ink, 2) + text(Bx + 14, cy + 5, 'B', { size: 16, weight: 'bold' });
  // counterclockwise on the page: down at the left vertex, up at the right. vA rA = vB rB.
  const vA = 110, vB = vA * rA / rB;
  s += arrow(Ax, cy + 10, Ax, cy + 10 + vA, C.velocity, { width: 3.5 }) + text(Ax + 8, cy + 10 + vA - 6, 'v', { size: 15, italic: true, weight: 'bold', color: C.velocity });
  s += arrow(Bx, cy - 10, Bx, cy - 10 - vB, C.velocity, { width: 3.5 }) + text(Bx + 8, cy - 10 - vB + 12, 'v', { size: 15, italic: true, weight: 'bold', color: C.velocity });
  // gravitational force toward the planet, larger at A (1/r^2)
  const gA = 38, gB = gA * (rA / rB) ** 2 + 10;
  s += arrow(Ax + 10, cy, Ax + 10 + gA, cy, C.gravity, { width: 3 }) + arrow(Bx - 10, cy, Bx - 10 - gB, cy, C.gravity, { width: 3 });
  s += text(Ax + 14, cy - 12, sub('F', 'g'), { size: 13, color: C.gravity, weight: 'bold' }) + text(Bx - 34, cy - 12, sub('F', 'g'), { size: 13, color: C.gravity, weight: 'bold' });
  s += text(Ax + 40, cy + 96, 'near point: fast', { size: 13 }) + text(Bx - 10, cy - 60, 'far point: slow', { size: 13, anchor: 'end' });
  // energy bars, GMm = 1: U = -1/r, E = -1/(2a); scale in units of 1/(2a)
  const bx = 520, by = 70;
  s += panel(bx, by, 220, 340);
  const zero = by + 130, k = 30;
  const E = -1, UA = -2 * a / rA, UB = -2 * a / rB;
  const bars = (x0, lab, K, U) => {
    let t = text(x0 + 41, by + 26, lab, { anchor: 'middle', size: 14, weight: 'bold' });
    const cols = [['K', K, C.velocity], ['U', U, C.gravity], ['E', K + U, C.amber]];
    cols.forEach(([n, v, col], i) => {
      const x = x0 + i * 30, h = v * k;
      t += `<rect x="${x}" y="${r1(h > 0 ? zero - h : zero)}" width="22" height="${r1(Math.abs(h))}" fill="${col}"/>`;
      t += text(x + 11, by + 326, n, { anchor: 'middle', size: 13, weight: 'bold', italic: true });
    });
    return t;
  };
  s += bars(bx + 20, 'at A', E - UA, UA) + bars(bx + 120, 'at B', E - UB, UB);
  s += line(bx + 10, zero, bx + 210, zero, C.ink, 1.8) + text(bx + 206, zero - 5, '0', { size: 12, anchor: 'end' });
  s += text(bx + 110, by + 288, 'E is negative and the same', { anchor: 'middle', size: 12 }) + text(bx + 110, by + 303, 'at A and B', { anchor: 'middle', size: 12 });
  return svgDoc(W, H, 'A satellite on an elliptical orbit and its energy bars', 'A satellite moves counterclockwise on a dashed elliptical orbit around a planet of mass M, which sits off-center. At the near point A the satellite is closest to the planet and its velocity arrow is long; at the far point B it is farthest and its velocity arrow is short. At both points the gravitational force from the planet points toward the planet’s center, perpendicular to the velocity, and is larger at A. A bar chart compares A and B: kinetic energy K is positive and larger at A; gravitational potential energy U is negative, more negative at A; the total energy E = K + U is negative and the same at both points.', s);
};

/* ------------------------------------------------- question stimuli */
/* Inline scenes for the Unit 5-6 question sets (svgInline: role="img" and an
   aria-label). Each returns { html, label }. Forces follow the FBD rules. */
export const STIMS = {};
const key = items => `<p>Key: ${items.join('; ')}.</p>`;

STIMS['potter-wheel'] = () => {
  const W = 560, H = 250, cx = 150, cy = 120, R = 95;
  let s = '';
  s += circle(cx, cy, R, C.wood, C.ink, 2.5) + circle(cx, cy, 10, C.metal, C.ink, 2) + dot(cx, cy, 3);
  const [mx, my] = P(cx, cy, R * 0.8, 60);
  s += circle(mx, my, 7, C.amber, C.ink, 1.5) + line(mx + 6, my - 6, mx + 40, my - 30, C.grey, 1) + text(mx + 42, my - 32, 'chalk mark', { size: 12 });
  s += arcArrow(cx, cy, R + 16, 200, 300, C.velocity, { width: 2.5 });
  s += text(cx, H - 6, 'Top view: turns counterclockwise', { anchor: 'middle', size: 12, color: C.grey });
  s += panel(300, 30, 240, 190);
  ['Starts from rest.', 'Constant angular acceleration', '2.0 rad/s² for 3.0 s.', '', 'Counterclockwise is positive.'].forEach((t, i) => { s += text(314, 60 + i * 24, t, { size: 13 }); });
  return { label: 'Top view of a potter’s wheel with a chalk mark near its rim, turning counterclockwise from rest with constant angular acceleration of 2.0 rad/s² for 3.0 s', html: '' , s, W, H };
};

STIMS['bike-stand'] = () => {
  const W = 560, H = 270, cx = 170, cy = 130, R = 105;
  let s = ground(20, 330, 255);
  s += `<polygon points="${cx - 6},${cy} ${cx - 60},255 ${cx - 44},255 ${cx + 6},${cy + 20}" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>`;
  s += wheel(cx, cy, R, { spokes: 12, fill: '#3A4442', inner: '#FFFFFF' });
  const rv = R * 0.86, rr = R * 0.52;
  const [vx, vy] = P(cx, cy, rv, 40), [rx, ry] = P(cx, cy, rr, 40);
  s += rect(vx - 5, vy - 5, 10, 10, C.metalDark, { rx: 2 }) + text(vx + 10, vy - 8, 'valve', { size: 12, weight: 'bold' });
  s += rect(rx - 9, ry - 4, 18, 8, '#D55E00', { rx: 2, width: 1.2 }) + text(rx - 12, ry - 10, 'reflector', { size: 12, weight: 'bold', anchor: 'end' });
  s += arcArrow(cx, cy, R + 14, 120, 200, C.velocity, { width: 2.5 });
  s += panel(330, 30, 215, 210);
  ['Wheel on a fixed axle (bike', 'upside down on a stand).', 'Axle to valve: 0.33 m', 'Axle to reflector: 0.20 m', 'Turning at 12 rad/s, then', 'slows steadily to rest', 'in 6.0 s.'].forEach((t, i) => { s += text(342, 56 + i * 25, t, { size: 13 }); });
  return { label: 'A bicycle wheel turning on a fixed axle on a stand, with the valve 0.33 m from the axle and a reflector 0.20 m from the axle on the same spoke line, turning at 12 rad/s and then slowing steadily to rest in 6.0 s', s, W, H };
};

STIMS['door-pushes'] = () => {
  const W = 560, H = 260, hx = 50, hy = 130, L = 380, sc = L / 0.80;
  let s = wallV(hx - 6, 40, 220);
  s += rect(hx, hy - 9, L, 18, C.wood, { rx: 2 }) + circle(hx, hy, 9, C.metal, C.ink, 2) + dot(hx, hy, 3);
  s += text(hx + 4, hy + 40, 'hinge (axis)', { size: 12, color: C.grey });
  const ex = hx + L, mx = hx + 0.40 * sc;
  s += arrow(mx, hy - 9 - 70, mx, hy - 9, C.applied, { width: 3 }) + text(mx + 6, hy - 70, '2', { size: 15, weight: 'bold' });
  s += arrow(ex - 6, hy - 9 - 70, ex - 6, hy - 9, C.applied, { width: 3 }) + text(ex - 30, hy - 70, '1', { size: 15, weight: 'bold' });
  const d = [Math.cos(150 * Math.PI / 180), -Math.sin(150 * Math.PI / 180)]; // pointing up-left onto the door? use from above at 30° to the door
  const tip = [ex - 2, hy + 9], tail = [tip[0] + 80 * Math.cos(Math.PI / 6), tip[1] + 80 * Math.sin(Math.PI / 6)];
  s += arrow(tail[0], tail[1], tip[0], tip[1], C.applied, { width: 3 }) + text(tail[0] + 4, tail[1] + 14, '3', { size: 15, weight: 'bold' });
  s += dashed(ex - 2, hy + 9, ex + 60, hy + 9, C.light, 1.2) + text(ex + 26, hy + 26, '30°', { size: 12 });
  s += arrow(ex + 85, hy - 2, ex + 4, hy - 2, C.applied, { width: 3 }) + text(ex + 70, hy - 12, '4', { size: 15, weight: 'bold' });
  s += dim(hx, hy + 56, mx, hy + 56, '', {}) + text((hx + mx) / 2, hy + 74, '0.40 m', { anchor: 'middle', size: 12 });
  s += dim(hx, hy + 92, ex, hy + 92, '', {}) + text((hx + ex) / 2, hy + 110, '0.80 m', { anchor: 'middle', size: 12 });
  void d;
  return { label: 'Top view of a door 0.80 m wide hinged at the left. Four 30 N pushes act on it: push 1 perpendicular to the door at the far edge, push 2 perpendicular at 0.40 m from the hinge, push 3 at the far edge at 30 degrees to the door, and push 4 at the far edge straight along the door toward the hinge', s, W, H };
};

STIMS['bar-three-forces'] = () => {
  const W = 560, H = 240, cx = 280, cy = 120, sc = 500;
  let s = rect(cx - 0.45 * sc, cy - 7, 0.9 * sc, 14, C.wood, { rx: 2 }) + circle(cx, cy, 8, C.metal, C.ink, 2) + dot(cx, cy, 3);
  s += text(cx, cy + 34, 'axle', { anchor: 'middle', size: 12, color: C.grey });
  const x1 = cx - 0.30 * sc, x2 = cx + 0.40 * sc, x3 = cx + 0.20 * sc;
  s += arrow(x1, cy + 7, x1, cy + 7 + 80, C.applied, { width: 3 }) + text(x1 + 8, cy + 80, '20 N', { size: 13, weight: 'bold' });
  s += arrow(x2, cy + 7, x2, cy + 7 + 60, C.applied, { width: 3 }) + text(x2 + 8, cy + 64, '15 N', { size: 13, weight: 'bold' });
  s += arrow(x3, cy - 7, x3, cy - 7 - 40, C.applied, { width: 3 }) + text(x3 + 8, cy - 34, '10 N', { size: 13, weight: 'bold' });
  s += dim(x1, cy - 34, cx, cy - 34, '', {}) + text((x1 + cx) / 2, cy - 42, '0.30 m', { anchor: 'middle', size: 12 });
  s += dim(cx, cy - 64, x2, cy - 64, '', {}) + text((x2 + cx) / 2, cy - 72, '0.40 m', { anchor: 'middle', size: 12 });
  s += dim(cx, cy + 40, x3, cy + 40, '', {}) + text((x3 + cx) / 2 + 4, cy + 56, '0.20 m', { anchor: 'middle', size: 12 });
  s += text(20, 222, 'Light bar on a fixed axle at its center. Counterclockwise is positive.', { size: 12, color: C.grey });
  return { label: 'A light horizontal bar on an axle at its center. A 20 N force pushes down 0.30 m left of the axle, a 15 N force pushes down 0.40 m right of the axle, and a 10 N force pulls up 0.20 m right of the axle', s, W, H };
};

STIMS['rod-three-balls'] = () => {
  const W = 560, H = 230, x0 = 80, sc = 500, y = 110;
  let s = line(x0, y, x0 + 0.8 * sc, y, C.ink, 4);
  const balls = [[0, 0.20, 16], [0.40, 0.40, 20], [0.80, 0.20, 16]];
  balls.forEach(([x, m, r]) => { s += circle(x0 + x * sc, y, r, C.metalDark, C.ink, 2) + text(x0 + x * sc + 8, y - r - 8, `${m.toFixed(2)} kg`, { size: 13, weight: 'bold' }); });
  s += dashed(x0, y - 70, x0, y + 70, C.amber, 2) + text(x0, y + 88, 'axis B (end)', { anchor: 'middle', size: 12, weight: 'bold', color: C.amber });
  s += dashed(x0 + 0.4 * sc, y - 70, x0 + 0.4 * sc, y + 70, C.amber, 2) + text(x0 + 0.4 * sc, y + 88, 'axis A (center)', { anchor: 'middle', size: 12, weight: 'bold', color: C.amber });
  s += dim(x0, y + 34, x0 + 0.4 * sc, y + 34, '', {}) + text(x0 + 0.2 * sc, y + 52, '0.40 m', { anchor: 'middle', size: 12 });
  s += dim(x0 + 0.4 * sc, y + 34, x0 + 0.8 * sc, y + 34, '', {}) + text(x0 + 0.6 * sc, y + 52, '0.40 m', { anchor: 'middle', size: 12 });
  s += text(20, 220, 'Light rod 0.80 m long; treat each ball as a point object. Each axis is perpendicular to the rod.', { size: 12, color: C.grey });
  return { label: 'A light rod 0.80 m long with a 0.20 kg ball at each end and a 0.40 kg ball at its middle, with axis A through the middle and axis B through one end, both perpendicular to the rod', s, W, H };
};

STIMS['meterstick-pivot'] = () => {
  const W = 560, H = 230, x0 = 30, sc = 500, y = 90;
  let s = rect(x0, y - 8, sc, 16, C.wood, { rx: 2 });
  for (let i = 0; i <= 10; i++) s += line(x0 + i * sc / 10, y - 8, x0 + i * sc / 10, y - 2, C.ink, 1) + text(x0 + i * sc / 10, y - 14, `${i * 10}`, { anchor: 'middle', size: 10, color: C.grey });
  s += `<polygon points="${x0 + 0.4 * sc},${y + 8} ${x0 + 0.4 * sc - 16},${y + 40} ${x0 + 0.4 * sc + 16},${y + 40}" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>`;
  s += ground(x0 + 0.4 * sc - 60, x0 + 0.4 * sc + 60, y + 40);
  const hx = x0 + 0.1 * sc;
  s += line(hx, y + 8, hx, y + 60, C.ink, 1.5) + rect(hx - 16, y + 60, 32, 28, C.metalDark, {}) + text(hx, y + 79, 'm', { anchor: 'middle', size: 14, italic: true, weight: 'bold', color: '#FFFFFF' });
  s += text(x0, 190, 'Uniform meterstick, mass 0.150 kg, balanced horizontally on a pivot at the 40 cm mark.', { size: 12.5 });
  s += text(x0, 210, 'A block of unknown mass m hangs from the 10 cm mark. Marks are in cm.', { size: 12.5 });
  return { label: 'A uniform meterstick of mass 0.150 kg balanced horizontally on a pivot at the 40 cm mark, with a block of unknown mass hanging from the 10 cm mark', s, W, H };
};

STIMS['beam-cable-lamp'] = () => {
  const W = 560, H = 260, wx = 60, y = 190, L = 380;
  let s = wallV(wx, 20, 240);
  s += rect(wx, y - 8, L, 16, C.wood, { rx: 2 }) + circle(wx + 6, y, 7, C.metal, C.ink, 2) + dot(wx + 6, y, 2.5);
  const top = y - L * Math.tan(Math.PI / 6);
  s += line(wx, top, wx + L - 4, y - 8, C.ink, 2) + circle(wx, top, 4, C.ink, C.ink, 1);
  s += text(wx + L - 70, y - 30, '30.0°', { size: 12 });
  s += line(wx + L - 6, y + 8, wx + L - 6, y + 34, C.ink, 1.5) + `<path d="M${wx + L - 22},${y + 34} h32 l-8,18 h-16 z" fill="#F5CF8A" stroke="${C.ink}" stroke-width="1.5"/>`;
  s += text(wx + L + 14, y + 50, 'lamp', { size: 12 });
  s += text(wx + 14, y + 30, 'hinge', { size: 12, color: C.grey });
  s += dim(wx, y + 64, wx + L, y + 64, '', {}) + text(wx + L / 2, y + 60, '2.00 m', { anchor: 'middle', size: 12 });
  s += text(wx + 120, 80, 'cable', { size: 12, color: C.grey });
  return { label: 'A uniform horizontal beam 2.00 m long hinged to a wall at its left end, held by a cable from its right end to the wall at 30.0 degrees above the beam, with a lamp hanging from the right end', s, W, H };
};

STIMS['pulley-block'] = () => {
  const W = 560, H = 260, cx = 150, cy = 80, R = 46;
  let s = ceiling(60, 260, 22) + line(cx, 22, cx, cy, C.ink, 5);
  s += circle(cx, cy, R, C.metal, C.ink, 2.5) + circle(cx, cy, 8, C.metalDark, C.ink, 1.5) + dot(cx, cy, 2.5);
  s += line(cx + R, cy, cx + R, 190, C.ink, 2) + rect(cx + R - 24, 190, 48, 40, C.metalDark, {}) + text(cx + R, 215, 'm', { anchor: 'middle', size: 15, italic: true, weight: 'bold', color: '#FFFFFF' });
  s += panel(300, 30, 245, 200);
  ['Pulley: uniform disk,', 'M = 1.50 kg, R = 0.100 m,', 'I = ½MR² (given)', 'Turns on a frictionless axle.', 'Block: m = 0.500 kg', 'Light string, no slipping.', 'Released from rest. Use g = 9.8 m/s².'].forEach((t, i) => { s += text(312, 56 + i * 24, t, { size: 12.5 }); });
  return { label: 'A block of mass 0.500 kg hangs from a light string wrapped around a uniform disk pulley of mass 1.50 kg and radius 0.100 m that turns on a frictionless axle', s, W, H };
};

STIMS['turntable-clay'] = () => {
  const W = 560, H = 240, cx = 150, cy = 115, R = 95;
  let s = circle(cx, cy, R, C.wood, C.ink, 2.5) + circle(cx, cy, 8, C.metal, C.ink, 2) + dot(cx, cy, 2.5);
  const [lx, ly] = P(cx, cy, R * 0.75, 20);
  s += `<ellipse cx="${r1(lx)}" cy="${r1(ly)}" rx="11" ry="9" fill="#A9765A" stroke="${C.ink}" stroke-width="1.5"/>`;
  s += line(cx, cy, lx, ly, C.grey, 1.3) + text((cx + lx) / 2, (cy + ly) / 2 + 18, '0.15 m', { size: 12, anchor: 'middle' });
  s += arcArrow(cx, cy, R + 14, 120, 210, C.velocity, { width: 2.5 });
  s += panel(300, 30, 245, 170);
  ['Solid disk: M = 3.0 kg,', 'R = 0.20 m, I = ½MR² (given)', 'Clay lump: 0.10 kg,', '0.15 m from the axis', 'Turning at 6.0 rad/s', 'on a fixed vertical axle'].forEach((t, i) => { s += text(312, 56 + i * 24, t, { size: 12.5 }); });
  return { label: 'Top view of a solid disk turntable of mass 3.0 kg and radius 0.20 m with a 0.10 kg lump of clay stuck 0.15 m from the axis, turning at 6.0 rad/s', s, W, H };
};

STIMS['winch-bucket'] = () => {
  const W = 560, H = 270;
  const cx = 150, cy = 70, R = 22;
  let s = `<rect x="60" y="${cy - 6}" width="200" height="12" fill="${C.wood}" stroke="${C.ink}" stroke-width="2"/>`;
  s += line(70, cy, 70, 250, C.wood, 10) + line(250, cy, 250, 250, C.wood, 10);
  s += circle(cx, cy, R, C.metal, C.ink, 2) + dot(cx, cy, 3);
  s += line(cx + R, cy, cx + R, 180, C.ink, 2);
  s += `<path d="M${cx + R - 20},180 h40 l-5,40 h-30 z" fill="${C.metalDark}" stroke="${C.ink}" stroke-width="2"/>` + text(cx + R + 28, 206, 'bucket', { size: 12 });
  s += line(cx, cy, cx - 50, cy - 40, C.ink, 4) + circle(cx - 50, cy - 40, 6, C.wood, C.ink, 1.5) + text(cx - 60, cy - 50, 'crank handle', { size: 12, anchor: 'end' });
  s += panel(300, 30, 245, 190);
  ['Drum radius: 0.0800 m', 'Bucket mass: 6.00 kg', 'The drum turns 25.0 rad,', 'raising the bucket at', 'constant speed.', 'Ignore friction and the', 'mass of the rope. Use g = 9.8 m/s².'].forEach((t, i) => { s += text(312, 56 + i * 24, t, { size: 12.5 }); });
  return { label: 'A well winch: a crank turns a drum of radius 0.0800 m, winding a rope that lifts a 6.00 kg bucket at constant speed while the drum turns 25.0 rad', s, W, H };
};

STIMS['puck-line'] = () => {
  const W = 560, H = 230, px = 280, py = 190, ly = 70;
  let s = `<rect x="20" y="20" width="520" height="200" rx="8" fill="${C.pale}" stroke="${C.light}"/>`;
  s += dashed(40, ly, 520, ly, C.light, 1.4);
  s += circle(140, ly, 13, C.metalDark, C.ink, 2) + arrow(155, ly, 225, ly, C.velocity, { width: 3.5 }) + text(190, ly - 12, 'v = 3.0 m/s', { size: 12.5, weight: 'bold', color: C.velocity });
  s += dot(px, py, 5) + text(px + 10, py + 4, 'P', { size: 14, weight: 'bold' });
  s += dot(470, ly, 5) + text(470, ly - 12, 'Q', { size: 14, weight: 'bold', anchor: 'middle' });
  s += dim(px, py - 6, px, ly + 4, '', {}) + text(px + 8, (py + ly) / 2 + 4, '0.40 m', { size: 12 });
  s += text(34, 210, 'Top view, level frictionless table. Puck mass 0.20 kg. Q lies on the puck’s path.', { size: 12, color: C.grey });
  return { label: 'Top view of a 0.20 kg puck sliding at 3.0 m/s along a straight line on a frictionless table, passing 0.40 m from point P; point Q lies on the puck’s path', s, W, H };
};

STIMS['stool-weights'] = () => {
  const W = 560, H = 250;
  let s = '';
  const one = (cx, out, lab, I, w) => {
    const fy = 200;
    let t = ground(cx - 110, cx + 110, fy + 20) + line(cx, fy + 20, cx, fy - 14, C.ink, 5) + rect(cx - 40, fy - 22, 80, 10, C.wood, { rx: 3 });
    const top = fy - 22;
    t += `<rect x="${cx - 14}" y="${top - 66}" width="28" height="66" rx="10" fill="${C.shirt}" stroke="${C.ink}" stroke-width="2"/>` + circle(cx, top - 82, 13, C.skin, C.ink, 2);
    const ay = top - 54, reach = out ? 90 : 26;
    t += line(cx - 10, ay, cx - reach, ay, C.skin, 7) + line(cx + 10, ay, cx + reach, ay, C.skin, 7);
    for (const sg of [-1, 1]) t += rect(cx + sg * reach - 7, ay - 11, 14, 22, C.metalDark, { rx: 3 });
    t += text(cx, 30, lab, { anchor: 'middle', size: 13, weight: 'bold' }) + text(cx, 48, `I = ${I} kg·m², ω = ${w}`, { anchor: 'middle', size: 12.5 });
    return t;
  };
  s += one(140, true, 'Before: arms out', '3.0', '2.0 rad/s') + one(420, false, 'After: arms in', '1.2', '?');
  return { label: 'A student on a stool that turns on a nearly frictionless vertical axle. Before: arms out holding weights, rotational inertia 3.0 kg·m² and angular velocity 2.0 rad/s. After: arms pulled in, rotational inertia 1.2 kg·m², angular velocity unknown', s, W, H };
};

STIMS['rod-clay'] = () => {
  const W = 560, H = 270, px = 160, py = 30, Lp = 210;
  let s = ceiling(100, 220, 22) + rect(px - 8, py - 8, 16, 16, C.metal, { rx: 3 }) + dot(px, py, 3);
  s += rect(px - 7, py, 14, Lp, C.wood, { rx: 2 });
  s += circle(40, py + Lp - 8, 9, '#A9765A', C.ink, 1.5) + arrow(52, py + Lp - 8, 120, py + Lp - 8, C.velocity, { width: 3 }) + text(60, py + Lp - 18, 'v = 8.0 m/s', { size: 12, color: C.velocity, weight: 'bold' });
  s += dim(px + 22, py, px + 22, py + Lp, '', {}) + text(px + 30, py + Lp / 2, '0.80 m', { size: 12 });
  s += text(px - 14, py + 4, 'pivot', { size: 12, color: C.grey, anchor: 'end' });
  s += panel(300, 30, 245, 190);
  ['Uniform rod: M = 1.2 kg,', 'length 0.80 m, hangs at rest', 'from a frictionless pivot.', 'I about the pivot = ⅓ML² (given)', 'Clay: 0.050 kg at 8.0 m/s,', 'moving horizontally; it sticks', 'to the bottom end of the rod.'].forEach((t, i) => { s += text(312, 56 + i * 24, t, { size: 12.5 }); });
  return { label: 'A uniform rod 0.80 m long hangs at rest from a frictionless pivot at its top end. A 0.050 kg lump of clay moving horizontally at 8.0 m/s is about to hit and stick to the bottom end', s, W, H };
};

STIMS['ramp-three-shapes'] = () => {
  const W = 560, H = 250, x0 = 30, y0 = 220, x1 = 330, top = 60;
  let s = `<polygon points="${x0},${top} ${x0},${y0} ${x1},${y0}" fill="${C.pale}" stroke="${C.ink}" stroke-width="2.5"/>` + ground(10, 360, y0);
  const ang = Math.atan2(y0 - top, x1 - x0), n = [Math.sin(ang), -Math.cos(ang)], al = [Math.cos(ang), Math.sin(ang)];
  [['sphere', '#C0D6E4'], ['disk', C.wood], ['hoop', 'none']].forEach(([k, f], i) => {
    const t = 26 + i * 46, r = 17, bx = x0 + al[0] * t + n[0] * r, by = top + al[1] * t + n[1] * r;
    s += k === 'hoop' ? `<circle cx="${r1(bx)}" cy="${r1(by)}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="4.5"/>` : circle(bx, by, r, f, C.ink, 2);
  });
  s += dim(x0 - 14 + 4, top, x0 - 14 + 4, y0, '', {}) + text(x0 + 6, (top + y0) / 2 + 40, 'h = 0.80 m', { size: 12 });
  s += panel(370, 30, 175, 190);
  ['Each has mass M and', 'radius R. Given:', 'solid sphere I = ⅖MR²', 'solid disk I = ½MR²', 'hoop I = MR²', 'Released together from', 'rest; each rolls without', 'slipping.'].forEach((t, i) => { s += text(380, 54 + i * 21, t, { size: 12 }); });
  return { label: 'A ramp of height 0.80 m with a solid sphere, a solid disk and a hoop at the top, all of mass M and radius R, released from rest to roll without slipping', s, W, H };
};

STIMS['orbit-ellipse'] = () => {
  const W = 560, H = 250, cx = 240, cy = 125, a = 180, b = 100, c = Math.sqrt(a * a - b * b);
  let s = `<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" fill="none" stroke="${C.grey}" stroke-width="1.8" stroke-dasharray="7 5"/>`;
  s += circle(cx - c, cy, 22, C.planet, C.ink, 2) + text(cx - c, cy + 5, 'Earth', { anchor: 'middle', size: 10.5, weight: 'bold', color: '#FFFFFF' });
  s += circle(cx - a, cy, 7, C.metalDark, C.ink, 1.5) + text(cx - a - 10, cy + 5, 'A', { anchor: 'end', size: 14, weight: 'bold' });
  s += circle(cx + a, cy, 7, C.metalDark, C.ink, 1.5) + text(cx + a + 10, cy + 5, 'B', { size: 14, weight: 'bold' });
  s += arrow(cx - a, cy + 9, cx - a, cy + 70, C.velocity, { width: 3 });
  s += text(20, 240, 'A: 7.0 × 10⁶ m from Earth’s center, speed 8.7 × 10³ m/s. B: 1.4 × 10⁷ m from Earth’s center.', { size: 12 });
  return { label: 'A satellite on an elliptical orbit around Earth. Point A, the closest point, is 7.0 × 10⁶ m from Earth’s center, where the satellite moves at 8.7 × 10³ m/s; point B, the farthest point, is 1.4 × 10⁷ m from Earth’s center', s, W, H };
};

export function stim(id) {
  const o = STIMS[id]();
  return svgInline(o.W, o.H, o.label, o.s);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) for (const [id, f] of Object.entries(FIGS)) { writeFig(id, f()); console.log(`physics/figures/${id}.svg`); }
