/* Drawing helpers for AP® Chemistry figures and inline stimulus SVGs.

   chem/figures/*.svg are shown as <img>, so they cannot use the site's fg-
   classes (scripts/lib/ochem-figure.mjs): every color is written inline here.
   The same helpers draw the inline particle and Lewis-diagram SVGs inside
   question stimuli. Nothing here decides chemistry; the figure and question
   definitions do. */

export const C = {
  ink: '#1F2A28', muted: '#5B6670', line: '#9AA4AE', cobalt: '#1D44A6', tint: '#E3EAFA',
  cation: '#9DB8F2', anion: '#F4C766', metal: '#C9CED6', small: '#3A3F45', other: '#E39A6B',
  coral: '#B4432F', bg: '#FFFFFF', panel: '#F6F8FB',
};
const n = v => (Math.round(v * 100) / 100).toString();
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const P = (x, y) => ({ x, y });
/* An atom for a Lewis diagram: a position and its symbol. */
export const At = (x, y, s) => ({ x, y, s });

export function svg({ w, h, label, body, standalone = false, title }) {
  const ns = standalone ? ' xmlns="http://www.w3.org/2000/svg"' : '';
  const t = title ? `<title>${esc(title)}</title>` : '';
  const bg = standalone ? `<rect width="${w}" height="${h}" fill="${C.bg}"/>` : '';
  return `<svg${ns} viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}" style="max-width:100%;height:auto">${t}${bg}<g font-family="Arial,Helvetica,sans-serif" fill="${C.ink}">${body}</g></svg>`;
}

export function text(x, y, s, o = {}) {
  const size = o.size ?? 14, anchor = o.anchor ?? 'middle', weight = o.weight ? ` font-weight="${o.weight}"` : '';
  const fill = o.fill ? ` fill="${o.fill}"` : '', style = o.italic ? ' font-style="italic"' : '';
  return `<text x="${n(x)}" y="${n(y)}" font-size="${size}" text-anchor="${anchor}"${weight}${fill}${style}>${o.raw ? s : esc(s)}</text>`;
}
export const line = (x1, y1, x2, y2, o = {}) => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${o.stroke || C.ink}" stroke-width="${o.w ?? 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round"/>`;
export const rect = (x, y, w, h, o = {}) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${o.r ?? 8}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.line}" stroke-width="${o.w ?? 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
export const circle = (x, y, r, o = {}) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.ink}" stroke-width="${o.w ?? 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;

/* An arrowhead-tipped straight arrow. */
export function arrow(x1, y1, x2, y2, o = {}) {
  const col = o.stroke || C.ink, size = o.size ?? 8;
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const bx = x2 - ux * size, by = y2 - uy * size, px = -uy * size * 0.5, py = ux * size * 0.5;
  let out = line(x1, y1, bx, by, { stroke: col, w: o.w ?? 2 }) + `<path d="M${n(x2)} ${n(y2)} L${n(bx + px)} ${n(by + py)} L${n(bx - px)} ${n(by - py)} Z" fill="${col}"/>`;
  if (o.both) { const cx = x1 + ux * size, cy = y1 + uy * size; out += `<path d="M${n(x1)} ${n(y1)} L${n(cx + px)} ${n(cy + py)} L${n(cx - px)} ${n(cy - py)} Z" fill="${col}"/>`; }
  return out;
}

/* A ball for particle diagrams: a filled circle with an optional sign or symbol. */
export function ball(x, y, r, fill, label = '', o = {}) {
  const size = o.size ?? Math.max(9, Math.round(r * 0.95));
  return circle(x, y, r, { fill, stroke: o.stroke || C.ink, w: o.w ?? 1.3 }) + (label ? text(x, y + size * 0.36, label, { size, weight: 700, fill: o.color || C.ink }) : '');
}

/* ---- Lewis diagrams. An atom is { x, y, s, charge? }. */
export function latom(a, o = {}) {
  return text(a.x, a.y + 7.5, a.s, { size: o.size ?? 21, weight: 700, fill: o.fill });
}
/* A bond between two atoms, trimmed so it stops short of each symbol. */
export function lbond(a, b, order = 1, o = {}) {
  const trimA = o.trimA ?? 14, trimB = o.trimB ?? 14, gap = o.gap ?? 4.5;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const x1 = a.x + ux * trimA, y1 = a.y + uy * trimA, x2 = b.x - ux * trimB, y2 = b.y - uy * trimB;
  const offs = order === 1 ? [0] : order === 2 ? [-gap, gap] : [-gap * 1.7, 0, gap * 1.7];
  return offs.map(k => line(x1 + px * k, y1 + py * k, x2 + px * k, y2 + py * k, { w: o.w ?? 2, stroke: o.stroke, dash: o.dash })).join('');
}
/* A partial bond for a resonance hybrid: one solid line and one dashed. */
export function lhybrid(a, b, o = {}) {
  const trim = 14, gap = 4.5;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const x1 = a.x + ux * trim, y1 = a.y + uy * trim, x2 = b.x - ux * trim, y2 = b.y - uy * trim;
  const s = o.side ?? 1;
  return line(x1 - px * gap * s, y1 - py * gap * s, x2 - px * gap * s, y2 - py * gap * s) + line(x1 + px * gap * s, y1 + py * gap * s, x2 + px * gap * s, y2 + py * gap * s, { dash: '4 4' });
}
/* A lone pair at an angle (degrees, 0 = right, 90 = down). */
export function lp(a, deg, o = {}) {
  const d = o.d ?? 19, spread = 4.6, r = o.r ?? 2.4, t = deg * Math.PI / 180;
  const cx = a.x + Math.cos(t) * d, cy = a.y + Math.sin(t) * d, px = -Math.sin(t) * spread, py = Math.cos(t) * spread;
  return circle(cx + px, cy + py, r, { fill: o.fill || C.cobalt, stroke: 'none' }) + circle(cx - px, cy - py, r, { fill: o.fill || C.cobalt, stroke: 'none' });
}
export const lps = (a, degs, o) => degs.map(d => lp(a, d, o)).join('');
/* A single unpaired electron. */
export function dot(a, deg, o = {}) {
  const d = o.d ?? 17, t = deg * Math.PI / 180;
  return circle(a.x + Math.cos(t) * d, a.y + Math.sin(t) * d, 2.4, { fill: o.fill || C.coral, stroke: 'none' });
}
/* A small formal-charge tag beside an atom. */
export function fc(a, s, dx = 14, dy = -16) {
  return text(a.x + dx, a.y + dy, s, { size: 13, weight: 700, fill: C.coral });
}
/* Square brackets around an ion with its charge. */
export function brackets(x1, y1, x2, y2, charge) {
  const t = 7;
  return `<path d="M${n(x1 + t)} ${n(y1)} H${n(x1)} V${n(y2)} H${n(x1 + t)} M${n(x2 - t)} ${n(y1)} H${n(x2)} V${n(y2)} H${n(x2 - t)}" fill="none" stroke="${C.ink}" stroke-width="2"/>` + text(x2 + 5, y1 + 10, charge, { size: 16, weight: 700, anchor: 'start' });
}

/* ---- 3-D-ish bonds for VSEPR shapes. */
export function wedge(a, b, o = {}) {
  const trim = o.trim ?? 13, w = o.width ?? 9;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, px = -uy * w / 2, py = ux * w / 2;
  const x1 = a.x + ux * 9, y1 = a.y + uy * 9, x2 = b.x - ux * trim, y2 = b.y - uy * trim;
  return `<path d="M${n(x1)} ${n(y1)} L${n(x2 + px)} ${n(y2 + py)} L${n(x2 - px)} ${n(y2 - py)} Z" fill="${C.ink}"/>`;
}
export function hash(a, b, o = {}) {
  const trim = o.trim ?? 13, w = o.width ?? 9, rungs = 6;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const x1 = a.x + ux * 9, y1 = a.y + uy * 9, x2 = b.x - ux * trim, y2 = b.y - uy * trim;
  let out = '';
  for (let i = 1; i <= rungs; i++) {
    const f = i / rungs, cx = x1 + (x2 - x1) * f, cy = y1 + (y2 - y1) * f, h = w * f / 2;
    out += line(cx + px * h, cy + py * h, cx - px * h, cy - py * h, { w: 1.6 });
  }
  return out;
}
/* A lone-pair lobe (a tinted ellipse with two dots) pointing at deg. */
export function lobe(a, deg, o = {}) {
  const d = o.d ?? 26, t = deg * Math.PI / 180, cx = a.x + Math.cos(t) * d, cy = a.y + Math.sin(t) * d;
  return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="16" ry="9.5" transform="rotate(${n(deg)} ${n(cx)} ${n(cy)})" fill="${C.tint}" stroke="${C.cobalt}" stroke-width="1.3"/>` + lp(a, deg, { d, r: 2.2 });
}
