/* Figures for the fischer notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure here draws a Fischer projection next to what it means in
   3D: the same center with its horizontal bonds on wedges and its vertical
   bonds on hashes, or a side view with the viewer's eye. The running
   example is D-glyceraldehyde (CHO top, CH2OH bottom, H left, OH right),
   which is (R). */
import { atom, bond, wedge, hash, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

const r2 = (v) => (Math.round(v * 100) / 100).toString();
const nch = (s) => [...s].length;
/* fg-lbl is 13px monospace, about 7.8px per character. */
const pillW = (lab) => Math.max(24, nch(lab) * 8 + 10);
const PILL_H = 24;

/* A group label in a rounded box, sized to its text. */
function grp(p, lab, kind) {
  const w = pillW(lab);
  const cls = kind ? `fg-atom-${kind}` : 'fg-atom';
  return `<rect class="${cls}" x="${r2(p.x - w / 2)}" y="${r2(p.y - PILL_H / 2)}" width="${r2(w)}" height="${PILL_H}" rx="12"></rect>` +
    text(p.x, p.y + 4.6, lab, { cls: 'fg-lbl', size: 13 });
}

/* Distance from a label's centre to the edge of its box along (ux, uy),
   plus a small gap, so a bond stops at the box instead of under the text. */
function edge(lab, ux, uy) {
  const hw = pillW(lab) / 2, hh = PILL_H / 2;
  const tx = Math.abs(ux) > 1e-6 ? hw / Math.abs(ux) : Infinity;
  const ty = Math.abs(uy) > 1e-6 ? hh / Math.abs(uy) : Infinity;
  return Math.min(tx, ty) + 2;
}

const DIRS = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
const KEYS = ['top', 'bottom', 'left', 'right'];
function spots(c, h, v) {
  return { top: P(c.x, c.y - v), bottom: P(c.x, c.y + v), left: P(c.x - h, c.y), right: P(c.x + h, c.y) };
}

/* A one-center Fischer projection: a plain cross, carbon left implicit.
   g = { top, bottom, left, right } labels; o.kinds marks boxes hi/warn. */
const leftForm = (lab) => (lab === 'OH' ? 'HO' : lab === 'NH₂' ? 'H₂N' : lab);
function flipLeft(g) { return { ...g, left: leftForm(g.left) }; }

function cross(c, g0, o = {}) {
  const g = flipLeft(g0);
  const pos = spots(c, o.h ?? 42, o.v ?? 42);
  let s = '';
  for (const k of KEYS) {
    s += bond(c, pos[k], { rFrom: 0, rTo: edge(g[k], ...DIRS[k]), cls: o.bonds?.[k] });
  }
  for (const k of KEYS) s += grp(pos[k], g[k], o.kinds?.[k]);
  return s;
}

/* The same center drawn in 3D: horizontal bonds on wedges (toward you),
   vertical bonds on hashes (away from you), carbon drawn. */
function bowtie(c, g0, o = {}) {
  const g = flipLeft(g0);
  const pos = spots(c, o.h ?? 46, o.v ?? 44);
  let s = '';
  for (const k of KEYS) {
    const rTo = edge(g[k], ...DIRS[k]);
    s += (k === 'left' || k === 'right')
      ? wedge(c, pos[k], { rFrom: 13, rTo, width: 10 })
      : hash(c, pos[k], { rFrom: 13, rTo, width: 11, rungs: 5 });
  }
  for (const k of KEYS) s += grp(pos[k], g[k], o.kinds?.[k]);
  s += atom(c.x, c.y, 'C', { r: 13, size: 13 });
  return s;
}

/* A chain Fischer projection: one vertical line, one cross per row.
   rows = [{ l, r, kinds: { l, r }, hi }] from top to bottom. */
function chain(cx, y0, gap, top, rows, bottom, o = {}) {
  const h = o.h ?? 40;
  const yB = y0 + (rows.length + 1) * gap;
  let s = bond(P(cx, y0), P(cx, yB), { rFrom: edge(top, 0, 1), rTo: edge(bottom, 0, -1) });
  rows.forEach((row0, i) => {
    const row = { ...row0, l: leftForm(row0.l) };
    const y = y0 + (i + 1) * gap;
    const L = P(cx - h, y), R = P(cx + h, y);
    s += bond(L, R, { rFrom: edge(row.l, 1, 0), rTo: edge(row.r, -1, 0), cls: row.hi ? 'fg-bond-hi' : undefined });
    s += grp(L, row.l, row.kinds?.l) + grp(R, row.r, row.kinds?.r);
    if (o.nums) s += text(cx - h - 38, y + 4, 'C' + (i + 2), { cls: o.numCls || 'fg-sm' });
  });
  s += grp(P(cx, y0), top) + grp(P(cx, yB), bottom);
  return s;
}

/* An arrowhead at (x, y) pointing along (ux, uy). */
function head(x, y, ux, uy, size = 8) {
  const px = -uy, py = ux, bx = x - ux * size, by = y - uy * size, w = size * 0.52;
  return `<path class="fg-head" d="M${r2(x)} ${r2(y)} L${r2(bx + px * w)} ${r2(by + py * w)} L${r2(bx - px * w)} ${r2(by - py * w)} Z"></path>`;
}

/* A plain arrow from a to b (tip at b). */
function arr(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return `<line class="fg-arrow" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x - ux * 7)}" y2="${r2(b.y - uy * 7)}"></line>` + head(b.x, b.y, ux, uy);
}

/* A circular arrow round c, from angle a0 to a1 (degrees, 0 = right,
   90 = up), turning counterclockwise when ccw is true. */
function arcArrow(c, r, a0, a1, ccw) {
  const pt = (a) => P(c.x + r * Math.cos(a * Math.PI / 180), c.y - r * Math.sin(a * Math.PI / 180));
  const span = ccw ? ((a1 - a0) + 360) % 360 : ((a0 - a1) + 360) % 360;
  const back = 14; // degrees kept free for the head
  const aEndLine = ccw ? a1 - back : a1 + back;
  const p0 = pt(a0), p1 = pt(aEndLine), tip = pt(a1);
  const large = span - back > 180 ? 1 : 0;
  const sweep = ccw ? 0 : 1;
  let s = `<path class="fg-arrow" d="M${r2(p0.x)} ${r2(p0.y)} A${r} ${r} 0 ${large} ${sweep} ${r2(p1.x)} ${r2(p1.y)}"></path>`;
  const dx = tip.x - p1.x, dy = tip.y - p1.y, L = Math.hypot(dx, dy);
  s += head(tip.x, tip.y, dx / L, dy / L, 9);
  return s;
}

/* An eye looking to the right (facing +x). */
function eye(x, y) {
  const w = 15, hgt = 9;
  return `<path class="fg-bond" d="M${x - w} ${y} Q${x} ${y - hgt * 2} ${x + w} ${y} Q${x} ${y + hgt * 2} ${x - w} ${y} Z"></path>` +
    `<circle class="fg-lp" cx="${x + 5}" cy="${y}" r="5"></circle>`;
}

/* The side view of a single Fischer center, seen from the right-hand edge of
   the page: the page is a dashed line, the viewer is off to the left. */
function sideOne(c, o = {}) {
  let s = '';
  const eyeX = c.x - (o.eyeGap ?? 118);
  s += `<line class="fg-dash" x1="${c.x}" y1="${c.y - 78}" x2="${c.x}" y2="${c.y + 78}"></line>`;
  s += text(c.x + 4, c.y + 92, 'page', { cls: 'fg-tag-mut', anchor: 'middle' });
  const up = P(c.x + 40, c.y - 50), dn = P(c.x + 40, c.y + 50), fw = P(c.x - 58, c.y);
  const u = (a, b) => { const d = Math.hypot(b.x - a.x, b.y - a.y); return [(a.x - b.x) / d, (a.y - b.y) / d]; };
  s += bond(c, up, { rFrom: 12, rTo: edge('CHO', ...u(c, up)) });
  s += bond(c, dn, { rFrom: 12, rTo: edge('CH₂OH', ...u(c, dn)) });
  s += bond(c, fw, { rFrom: 12, rTo: edge('OH', 1, 0), cls: 'fg-bond-hi' });
  s += grp(up, 'CHO') + grp(dn, 'CH₂OH') + grp(fw, 'OH', 'hi');
  s += atom(c.x, c.y, 'C', { r: 12, size: 13 });
  s += text(fw.x, fw.y - 22, 'H is behind OH', { cls: 'fg-tag-mut' });
  s += eye(eyeX, c.y);
  s += text(eyeX, c.y + 30, 'you', { cls: 'fg-tag' });
  return s;
}

/* ------------------------------------------------ 1. the convention --- */

const GLY = { top: 'CHO', bottom: 'CH₂OH', left: 'H', right: 'OH' };

FIGURES.push({
  id: 'fischer-convention',
  section: 'fischer',
  anchor: '<h3>The drawing convention</h3>',
  alt: 'D-glyceraldehyde drawn three ways. Left: the Fischer projection, a plain cross with CHO at the top, CH2OH at the bottom, H on the left and OH on the right. Middle: the same molecule with a carbon drawn at the center, wedges to H and OH and hashes to CHO and CH2OH. Right: a side view with the page as a dashed line and an eye on the left; the OH bond points out toward the eye, and CHO and CH2OH bend back behind the page.',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    s += tag(120, 26, 'Fischer projection');
    s += cross(P(120, 136), GLY, { kinds: { left: 'hi', right: 'hi' } });
    s += text(120, 222, 'a plain cross', { cls: 'fg-sm' });
    s += text(120, 238, 'carbon at the crossing', { cls: 'fg-sm' });
    s += arr(P(200, 136), P(250, 136));
    s += text(225, 124, 'means', { cls: 'fg-sm' });
    s += tag(340, 26, 'Seen from the front');
    s += bowtie(P(340, 136), GLY, { kinds: { left: 'hi', right: 'hi' } });
    s += text(340, 222, 'H and OH on wedges: toward you', { cls: 'fg-tag-good' });
    s += text(340, 240, 'CHO and CH₂OH on hashes: away', { cls: 'fg-tag-mut' });
    s += rule(452, 44, 452, 250);
    s += tag(610, 26, 'Seen from the side');
    s += sideOne(P(652, 136));
    return s;
  },
  caption: 'Three drawings of one molecule, (R)-glyceraldehyde. The side view looks along the page from its right-hand edge, so H sits directly behind OH.',
});

FIGURES.push({
  id: 'l-fischer-convention',
  lessons: ['fischer'],
  alt: 'Top: D-glyceraldehyde as a Fischer projection (CHO top, CH2OH bottom, H left, OH right) beside the same center drawn with wedges to H and OH and hashes to CHO and CH2OH. Bottom: a side view with the page as a dashed line and an eye on the left; OH points toward the eye, CHO and CH2OH bend back behind the page.',
  viewBox: '0 0 340 470',
  build() {
    let s = '';
    s += tag(85, 22, 'Fischer projection');
    s += cross(P(85, 110), GLY, { kinds: { left: 'hi', right: 'hi' } });
    s += tag(255, 22, 'Seen from the front');
    s += bowtie(P(255, 110), GLY, { kinds: { left: 'hi', right: 'hi' } });
    s += text(170, 194, 'H and OH on wedges: toward you', { cls: 'fg-tag-good' });
    s += text(170, 212, 'CHO and CH₂OH on hashes: away', { cls: 'fg-tag-mut' });
    s += rule(10, 230, 330, 230);
    s += tag(170, 256, 'Seen from the side');
    s += sideOne(P(216, 352), { eyeGap: 150 });
    return s;
  },
  caption: 'One molecule, (R)-glyceraldehyde, drawn three ways. In the side view, H sits directly behind OH.',
});

/* ------------------------------------------------ 2. where it comes from --- */

/* D-erythrose side view: the chain arches toward the viewer, so at C2 and
   C3 both chain bonds run back into the page and the H and OH point out. */
function sideChain(c0, o = {}) {
  let s = '';
  const R = 74;
  const at = (deg, rr = R) => P(c0.x - rr * Math.cos(deg * Math.PI / 180), c0.y + rr * Math.sin(deg * Math.PI / 180));
  const c1 = at(-80), c2 = at(-26), c3 = at(26), c4 = at(80);
  const pageX = c2.x;
  s += `<line class="fg-dash" x1="${r2(pageX)}" y1="${r2(c0.y - 118)}" x2="${r2(pageX)}" y2="${r2(c0.y + 118)}"></line>`;
  s += text(pageX + 4, c0.y + 134, 'page', { cls: 'fg-tag-mut' });
  const u = (a, b) => { const d = Math.hypot(b.x - a.x, b.y - a.y); return [(a.x - b.x) / d, (a.y - b.y) / d]; };
  s += bond(c2, c1, { rFrom: 11, rTo: edge('CHO', ...u(c2, c1)) });
  s += bond(c2, c3, { rFrom: 11, rTo: 11 });
  s += bond(c3, c4, { rFrom: 11, rTo: edge('CH₂OH', ...u(c3, c4)) });
  for (const [c, deg] of [[c2, -26], [c3, 26]]) {
    const f = at(deg, R + 62);
    s += bond(c, f, { rFrom: 11, rTo: edge('OH', ...u(c, f)), cls: 'fg-bond-hi' });
    s += grp(f, 'OH', 'hi');
  }
  s += grp(c1, 'CHO') + grp(c4, 'CH₂OH');
  s += atom(c2.x, c2.y, 'C', { r: 11, size: 13 }) + atom(c3.x, c3.y, 'C', { r: 11, size: 13 });
  const ex = pageX - (o.eyeGap ?? 132);
  s += eye(ex, c0.y);
  s += text(ex, c0.y + 30, 'you', { cls: 'fg-tag' });
  return s;
}

const ERY = { top: 'CHO', bottom: 'CH₂OH', rows: [{ l: 'H', r: 'OH' }, { l: 'H', r: 'OH' }] };

/* The two stereocenters of D-erythrose as stacked wedge-and-hash centers. */
function erythroseFront(cx, y0, gap) {
  const c2 = P(cx, y0 + gap), c3 = P(cx, y0 + 2 * gap), top = P(cx, y0), bot = P(cx, y0 + 3 * gap);
  let s = '';
  s += hash(c2, top, { rFrom: 13, rTo: edge('CHO', 0, 1), width: 11, rungs: 4 });
  s += bond(c2, c3, { rFrom: 13, rTo: 13 });
  s += hash(c3, bot, { rFrom: 13, rTo: edge('CH₂OH', 0, -1), width: 11, rungs: 4 });
  for (const c of [c2, c3]) {
    s += wedge(c, P(cx - 46, c.y), { rFrom: 13, rTo: edge('H', 1, 0), width: 10 });
    s += wedge(c, P(cx + 46, c.y), { rFrom: 13, rTo: edge('OH', -1, 0), width: 10 });
    s += grp(P(cx - 46, c.y), 'H') + grp(P(cx + 46, c.y), 'OH', 'hi');
    s += atom(c.x, c.y, 'C', { r: 13, size: 13 });
  }
  s += grp(top, 'CHO') + grp(bot, 'CH₂OH');
  return s;
}

FIGURES.push({
  id: 'fischer-origin',
  section: 'fischer',
  anchor: '<h3>Where the convention comes from</h3>',
  alt: 'D-erythrose, a four-carbon sugar, drawn three ways. Left: a side view with an eye on the left and the page as a dashed line; the carbon chain arches toward the eye, so from C2 and C3 the bonds to CHO and CH2OH run back behind the page while each OH points out toward the eye. Middle: the front view with wedges from C2 and C3 to H and OH and hashes up to CHO and down to CH2OH. Right: the Fischer projection, one vertical line with two crosses, OH on the right at both.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += tag(140, 24, 'Seen from the side');
    s += sideChain(P(236, 160));
    s += rule(300, 40, 300, 296);
    s += tag(420, 24, 'Seen from the front');
    s += erythroseFront(420, 70, 60);
    s += arr(P(494, 160), P(546, 160));
    s += text(520, 148, 'flatten', { cls: 'fg-sm' });
    s += tag(630, 24, 'Fischer projection');
    s += chain(630, 70, 60, ERY.top, ERY.rows, ERY.bottom);
    return s;
  },
  caption: 'Erythrose, a four-carbon sugar. In the side view, each H is hidden directly behind its OH.',
});

FIGURES.push({
  id: 'l-fischer-origin',
  lessons: ['fischer'],
  alt: 'Top: a side view of D-erythrose with an eye on the left; the chain arches toward the eye, so the bonds to CHO and CH2OH run back behind the page and each OH points toward the eye. Bottom: the same molecule seen from the front with wedges and hashes, and beside it the Fischer projection.',
  viewBox: '0 0 340 590',
  build() {
    let s = '';
    s += tag(170, 20, 'Seen from the side');
    s += sideChain(P(252, 150), { eyeGap: 140 });
    s += rule(10, 304, 330, 304);
    s += tag(85, 330, 'From the front');
    s += erythroseFront(85, 372, 60);
    s += tag(255, 330, 'Fischer projection');
    s += chain(255, 372, 60, ERY.top, ERY.rows, ERY.bottom);
    return s;
  },
  caption: 'Erythrose. In the side view, each H is hidden directly behind its OH.',
});

/* --------------------------------------------- 3. R or S from the cross --- */

function prio(p, n) { return text(p.x, p.y, n, { cls: 'fg-tag-good' }); }

FIGURES.push({
  id: 'fischer-rs',
  section: 'fischer',
  lessons: ['fischer'],
  anchor: '<h3>Reading R or S from a Fischer projection</h3>',
  alt: 'Left: D-glyceraldehyde as a Fischer projection with priorities marked, OH 1, CHO 2, CH2OH 3, H 4, and a curved arrow turning counterclockwise from OH through CHO to CH2OH. Right: the same center with wedges and hashes, the H highlighted on its wedge, pointing at the viewer. Below: counterclockwise reads S, but H points toward you, so the answer flips to R.',
  viewBox: '0 0 340 262',
  build() {
    let s = '';
    const c = P(88, 118);
    s += tag(88, 22, 'Trace 1 → 2 → 3');
    s += cross(c, GLY, { h: 48, v: 48, kinds: { left: 'warn' } });
    s += arcArrow(c, 22, 10, 262, true);
    s += prio(P(c.x + 48, c.y - 20), '1');
    s += prio(P(c.x + 30, c.y - 56), '2');
    s += prio(P(c.x + 38, c.y + 60), '3');
    s += prio(P(c.x - 48, c.y - 20), '4');
    s += tag(256, 22, 'Where H points');
    s += bowtie(P(256, 118), GLY, { h: 48, v: 48, kinds: { left: 'warn' } });
    s += text(256, 190, 'H on a wedge,', { cls: 'fg-tag-warn' });
    s += text(256, 206, 'toward you', { cls: 'fg-tag-warn' });
    s += text(170, 234, 'Counterclockwise reads S.', { cls: 'fg-tag' });
    s += text(170, 252, 'H points at you, so flip: (R).', { cls: 'fg-tag-good' });
    return s;
  },
  caption: '(R)-glyceraldehyde, with CIP priorities in green. The arrow runs from 1 to 3 the short way round, past 2.',
});

/* ------------------------------------------------ 4. moves on the cross --- */

const MOVES = {
  turn180: { before: GLY, after: { top: 'CH₂OH', bottom: 'CHO', left: 'OH', right: 'H' },
    t1: 'Turn 180°', t2: 'in the page', good: true, v1: 'same molecule', v2: 'still (R)' },
  cycle: { before: GLY, after: { top: 'CH₂OH', bottom: 'OH', left: 'H', right: 'CHO' },
    t1: 'Hold H,', t2: 'cycle the rest', good: true, v1: 'same molecule', v2: 'still (R)',
    fixed: 'left' },
  turn90: { before: GLY, after: { top: 'H', bottom: 'OH', left: 'CH₂OH', right: 'CHO' },
    t1: 'Turn 90°', t2: 'in the page', good: false, v1: 'the enantiomer', v2: 'now (S)',
    warn3d: ['left', 'right', 'top', 'bottom'] },
  swap: { before: GLY, after: { top: 'CHO', bottom: 'CH₂OH', left: 'OH', right: 'H' },
    t1: 'Swap H', t2: 'and OH once', good: false, v1: 'the enantiomer', v2: 'now (S)',
    warn3d: ['left', 'right'] },
};

function kindsFor(m, which) {
  const k = {};
  if (which === 'after' && m.fixed) k[m.fixed] = 'hi';
  if (which === '3d' && m.warn3d) for (const w of m.warn3d) k[w] = 'warn';
  return k;
}

/* One row of the notes figure: name, before, arrow, after, arrow, 3D, verdict. */
function moveRow(m, y) {
  let s = '';
  s += text(14, y - 6, m.t1, { cls: 'fg-lbl', anchor: 'start' });
  s += text(14, y + 12, m.t2, { cls: 'fg-sm', anchor: 'start' });
  s += cross(P(205, y), m.before, { h: 38, v: 40 });
  s += arr(P(268, y), P(314, y));
  s += cross(P(385, y), m.after, { h: 38, v: 40, kinds: kindsFor(m, 'after') });
  s += arr(P(452, y), P(488, y));
  s += text(470, y - 10, 'in 3D', { cls: 'fg-sm' });
  s += bowtie(P(568, y), m.after, { h: 44, v: 40, kinds: kindsFor(m, '3d') });
  const cls = m.good ? 'fg-tag-good' : 'fg-tag-warn';
  s += text(648, y - 4, m.v1, { cls, anchor: 'start' });
  s += text(648, y + 14, m.v2, { cls, anchor: 'start' });
  return s;
}

function movesNotes(keys, title) {
  let s = '';
  s += text(205, 24, 'before', { cls: 'fg-tag-mut' });
  s += text(385, 24, 'after', { cls: 'fg-tag-mut' });
  s += text(568, 24, 'what "after" means', { cls: 'fg-tag-mut' });
  s += text(14, 24, title, { cls: 'fg-tag', anchor: 'start' });
  keys.forEach((k, i) => {
    const y = 104 + i * 138;
    if (i) s += rule(14, y - 69, 746, y - 69);
    s += moveRow(MOVES[k], y);
  });
  return s;
}

/* The lesson copy: before → after on one line, the 3D reading below it. */
function movesLesson(keys) {
  let s = '';
  keys.forEach((k, i) => {
    const m = MOVES[k], y0 = i * 292;
    if (i) s += rule(10, y0 - 6, 330, y0 - 6);
    s += text(170, y0 + 20, `${m.t1} ${m.t2}`, { cls: 'fg-tag' });
    s += cross(P(80, y0 + 90), m.before, { h: 38, v: 40 });
    s += arr(P(146, y0 + 90), P(194, y0 + 90));
    s += cross(P(260, y0 + 90), m.after, { h: 38, v: 40, kinds: kindsFor(m, 'after') });
    s += text(80, y0 + 156, 'before', { cls: 'fg-tag-mut' });
    s += text(260, y0 + 156, 'after', { cls: 'fg-tag-mut' });
    s += bowtie(P(96, y0 + 228), m.after, { h: 44, v: 40, kinds: kindsFor(m, '3d') });
    const cls = m.good ? 'fg-tag-good' : 'fg-tag-warn';
    s += text(186, y0 + 212, '"after" in 3D:', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(186, y0 + 230, m.v1, { cls, anchor: 'start' });
    s += text(186, y0 + 248, m.v2, { cls, anchor: 'start' });
  });
  return s;
}

FIGURES.push({
  id: 'fischer-moves-safe',
  section: 'fischer',
  anchor: '<h3>Moves that keep the molecule</h3>',
  alt: 'Two rows, each starting from D-glyceraldehyde (CHO top, CH2OH bottom, H left, OH right). Row 1, turn 180 degrees in the page: CH2OH top, CHO bottom, OH left, H right; in 3D, CHO and CH2OH are still on hashes and H and OH still on wedges; same molecule, still R. Row 2, hold H and cycle the other three: CH2OH top, CHO right, OH bottom, H still left; in 3D, H and CHO on wedges, CH2OH and OH on hashes; same molecule, still R.',
  viewBox: '0 0 760 316',
  build() { return movesNotes(['turn180', 'cycle'], 'SAFE'); },
  caption: 'Both moves give back (R)-glyceraldehyde, only drawn in a new orientation.',
});

FIGURES.push({
  id: 'l-fischer-moves-safe',
  lessons: ['fischer'],
  alt: 'Two safe moves on D-glyceraldehyde. Turn 180 degrees in the page: CH2OH top, CHO bottom, OH left, H right, and the 3D reading keeps CHO and CH2OH on hashes; same molecule, still R. Hold H and cycle the other three: CH2OH top, CHO right, OH bottom, H left; same molecule, still R.',
  viewBox: '0 0 340 582',
  build() { return movesLesson(['turn180', 'cycle']); },
  caption: 'Both moves give back (R)-glyceraldehyde.',
});

FIGURES.push({
  id: 'fischer-moves-unsafe',
  section: 'fischer',
  anchor: '<h3>Moves that give the enantiomer</h3>',
  alt: 'Two rows, each starting from D-glyceraldehyde (CHO top, CH2OH bottom, H left, OH right). Row 1, turn 90 degrees: H top, CHO right, OH bottom, CH2OH left; in 3D, CHO and CH2OH now sit on wedges and H and OH on hashes, all four highlighted as changed; the enantiomer, now S. Row 2, swap H and OH once: OH left, H right; in 3D those two are highlighted; the enantiomer, now S.',
  viewBox: '0 0 760 316',
  build() { return movesNotes(['turn90', 'swap'], 'NOT SAFE'); },
  caption: 'Coral marks every group that ends up somewhere new in 3D. Each move gives (S)-glyceraldehyde, the mirror image.',
});

FIGURES.push({
  id: 'l-fischer-moves-unsafe',
  lessons: ['fischer'],
  alt: 'Two moves on D-glyceraldehyde that give the enantiomer. Turn 90 degrees: H top, CHO right, OH bottom, CH2OH left; in 3D CHO and CH2OH now point toward you; now S. Swap H and OH once: OH left, H right; now S.',
  viewBox: '0 0 340 582',
  build() { return movesLesson(['turn90', 'swap']); },
  caption: 'Coral marks every group that ends up somewhere new in 3D. Both results are (S)-glyceraldehyde.',
});

/* ------------------------------------- 5. swaps counted per stereocenter --- */

FIGURES.push({
  id: 'fischer-swap-centers',
  section: 'fischer',
  lessons: ['fischer'],
  anchor: 'Count the swaps at each stereocenter',
  alt: 'Three Fischer projections, each with CHO at the top and CH2OH at the bottom. D-erythrose has OH on the right at both C2 and C3. Swapping H and OH at C2 only gives D-threose, a diastereomer. Swapping at both C2 and C3 gives L-erythrose, the enantiomer.',
  viewBox: '0 0 340 318',
  build() {
    let s = '';
    const cols = [
      { x: 57, rows: [{ l: 'H', r: 'OH' }, { l: 'H', r: 'OH' }], name: 'D-erythrose', a: 'start here', b: '', cls: 'fg-tag' },
      { x: 170, rows: [{ l: 'OH', r: 'H', hi: true, kinds: { l: 'warn' } }, { l: 'H', r: 'OH' }], name: 'D-threose', a: 'swap at C2', b: 'diastereomer', cls: 'fg-tag-warn' },
      { x: 283, rows: [{ l: 'OH', r: 'H', hi: true, kinds: { l: 'warn' } }, { l: 'OH', r: 'H', hi: true, kinds: { l: 'warn' } }], name: 'L-erythrose', a: 'swap at C2, C3', b: 'enantiomer', cls: 'fg-tag-good' },
    ];
    for (const c of cols) {
      s += chain(c.x, 30, 58, 'CHO', c.rows, 'CH₂OH', { h: 34 });
      s += text(c.x, 244, c.name, { cls: 'fg-tag' });
      s += text(c.x, 264, c.a, { cls: 'fg-tag-mut' });
      if (c.b) s += text(c.x, 284, c.b, { cls: c.cls });
    }
    return s;
  },
  caption: 'The upper cross is C2 and the lower one C3. Coral marks a center where H and OH were swapped once.',
});

/* ------------------------------------------ 6. wedge-and-dash to Fischer --- */

/* (S)-butan-2-ol as usually drawn: OH up, ethyl lower left, methyl lower
   right, all in the page, and H on a hash pointing down and back. */
function givenButanol(c) {
  let s = '';
  const arms = [
    { deg: 90, lab: 'OH', len: 48 },
    { deg: 210, lab: 'CH₂CH₃', len: 56 },
    { deg: 330, lab: 'CH₃', len: 52 },
  ];
  for (const a of arms) {
    const rad = a.deg * Math.PI / 180;
    const ux = Math.cos(rad), uy = -Math.sin(rad);
    const p = P(c.x + ux * a.len, c.y + uy * a.len);
    s += bond(c, p, { rFrom: 13, rTo: edge(a.lab, -ux, -uy) });
    s += grp(p, a.lab);
  }
  const h = P(c.x, c.y + 46);
  s += hash(c, h, { rFrom: 13, rTo: edge('H', 0, -1), width: 11, rungs: 4 });
  s += grp(h, 'H', 'warn');
  s += atom(c.x, c.y, 'C', { r: 13, size: 13 });
  return s;
}

const TRY1 = { top: 'CH₃', bottom: 'CH₂CH₃', left: 'OH', right: 'H' };
const TRY2 = { top: 'CH₃', bottom: 'CH₂CH₃', left: 'H', right: 'OH' };

FIGURES.push({
  id: 'fischer-convert',
  section: 'fischer',
  anchor: '<h3>From a wedge-and-dash drawing to a Fischer projection</h3>',
  alt: 'Four panels. 1: (S)-butan-2-ol drawn with OH up, CH2CH3 lower left and CH3 lower right in the page, and H on a hash. 2: a first Fischer projection with CH3 at the top, CH2CH3 at the bottom, OH left and H right; it reads R, which is wrong. 3: OH and H swapped, OH right and H left; it reads S, which matches. 4: the finished projection in 3D, with wedges to H and OH and hashes to CH3 and CH2CH3.',
  viewBox: '0 0 760 262',
  build() {
    let s = '';
    const cy = 124;
    s += tag(95, 24, '1. Given: (S)');
    s += givenButanol(P(98, cy - 4));
    s += text(95, 212, 'H points away;', { cls: 'fg-sm' });
    s += text(95, 228, '1→2→3 counterclockwise', { cls: 'fg-sm' });
    s += rule(190, 40, 190, 240);
    s += tag(285, 24, '2. Chain vertical, try');
    s += cross(P(285, cy), TRY1, { h: 44, v: 46 });
    s += text(285, 212, 'reads (R): wrong', { cls: 'fg-tag-warn' });
    s += text(285, 230, 'so swap OH and H', { cls: 'fg-sm' });
    s += arr(P(368, cy), P(400, cy));
    s += tag(475, 24, '3. After one swap');
    s += cross(P(475, cy), TRY2, { h: 44, v: 46, kinds: { right: 'hi' } });
    s += text(475, 212, 'reads (S): matches', { cls: 'fg-tag-good' });
    s += rule(570, 40, 570, 240);
    s += tag(665, 24, '4. What it means');
    s += bowtie(P(665, cy), TRY2, { h: 48, v: 46, kinds: { right: 'hi' } });
    s += text(665, 212, 'H and OH toward you', { cls: 'fg-sm' });
    s += text(665, 228, 'CH₃ and CH₂CH₃ away', { cls: 'fg-sm' });
    return s;
  },
  caption: '(S)-butan-2-ol. Panel 1 keeps H on a hash, so its turn reads directly. Panels 2 and 3 have H on a horizontal, so each reading is flipped.',
});

FIGURES.push({
  id: 'l-fischer-convert',
  lessons: ['fischer'],
  alt: 'Four panels in a two by two grid. 1: (S)-butan-2-ol with OH up, CH2CH3 lower left, CH3 lower right and H on a hash. 2: a first Fischer projection, CH3 top, CH2CH3 bottom, OH left, H right, which reads R, wrong. 3: after swapping OH and H, it reads S and matches. 4: the finished projection with wedges to H and OH and hashes to CH3 and CH2CH3.',
  viewBox: '0 0 340 470',
  build() {
    let s = '';
    s += tag(85, 20, '1. Given: (S)');
    s += givenButanol(P(88, 106));
    s += text(85, 196, 'H points away', { cls: 'fg-tag-mut' });
    s += tag(255, 20, '2. Try this');
    s += cross(P(255, 108), TRY1, { h: 44, v: 46 });
    s += text(255, 196, 'reads (R): wrong', { cls: 'fg-tag-warn' });
    s += rule(10, 214, 330, 214);
    s += tag(85, 240, '3. Swap OH and H');
    s += cross(P(85, 328), TRY2, { h: 44, v: 46, kinds: { right: 'hi' } });
    s += text(85, 416, 'reads (S): right', { cls: 'fg-tag-good' });
    s += tag(255, 240, '4. In 3D');
    s += bowtie(P(255, 328), TRY2, { h: 48, v: 46, kinds: { right: 'hi' } });
    s += text(255, 416, 'H, OH toward you', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: '(S)-butan-2-ol. In panels 2 and 3 the H is horizontal, so each reading is flipped.',
});

/* ------------------------------------------------------------- 7. D and L --- */

const GLUCOSE_ROWS = [
  { l: 'H', r: 'OH' }, { l: 'HO', r: 'H' }, { l: 'H', r: 'OH' }, { l: 'H', r: 'OH', hi: true, kinds: { r: 'hi' } },
];

function dlPanels(pos) {
  let s = '';
  const [a, b, c, d] = pos;
  s += tag(a.x, a.t, 'D-glyceraldehyde');
  s += cross(P(a.x, a.y), GLY, { h: 40, v: 42, kinds: { right: 'hi' }, bonds: { right: 'fg-bond-hi' } });
  s += text(a.x, a.y + 82, 'OH on the right', { cls: 'fg-tag-good' });
  s += tag(b.x, b.t, 'L-glyceraldehyde');
  s += cross(P(b.x, b.y), { top: 'CHO', bottom: 'CH₂OH', left: 'OH', right: 'H' }, { h: 40, v: 42, kinds: { left: 'warn' }, bonds: { left: 'fg-bond-hi' } });
  s += text(b.x, b.y + 82, 'OH on the left', { cls: 'fg-tag-warn' });
  s += tag(c.x, c.t, 'D-glucose');
  s += chain(c.x, c.y, c.gap, 'CHO', GLUCOSE_ROWS, 'CH₂OH', { h: 38 });
  s += text(c.x, c.y + 5 * c.gap + 34, 'C5 OH on the right', { cls: 'fg-tag-good' });
  s += tag(d.x, d.t, 'L-alanine');
  s += cross(P(d.x, d.y), { top: 'COOH', bottom: 'CH₃', left: 'H₂N', right: 'H' }, { h: 42, v: 44, kinds: { left: 'hi' }, bonds: { left: 'fg-bond-hi' } });
  s += text(d.x, d.y + 84, 'NH₂ on the left', { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'fischer-dl',
  section: 'fischer',
  anchor: '<h3>D and L</h3>',
  alt: 'Four Fischer projections. D-glyceraldehyde: CHO top, CH2OH bottom, OH on the right. L-glyceraldehyde: OH on the left. D-glucose: CHO top, CH2OH bottom, and the lowest stereocenter, C5, has its OH on the right. L-alanine: COOH top, CH3 bottom, H2N on the left.',
  viewBox: '0 0 760 300',
  build() {
    let s = dlPanels([
      { x: 95, y: 134, t: 24 }, { x: 285, y: 134, t: 24 },
      { x: 475, y: 44, gap: 40, t: 24 }, { x: 665, y: 134, t: 24 },
    ]);
    s += rule(380, 40, 380, 286);
    s += rule(570, 40, 570, 286);
    return s;
  },
  caption: 'Each drawing has its carbonyl or carboxyl end at the top. The highlighted bond is the one that decides D or L.',
});

FIGURES.push({
  id: 'l-fischer-dl',
  lessons: ['fischer'],
  alt: 'Four Fischer projections in a two by two grid. D-glyceraldehyde with OH on the right; L-glyceraldehyde with OH on the left; D-glucose with its C5 OH on the right; L-alanine with COOH at the top, CH3 at the bottom and H2N on the left.',
  viewBox: '0 0 340 520',
  build() {
    let s = dlPanels([
      { x: 85, y: 110, t: 20 }, { x: 255, y: 110, t: 20 },
      { x: 85, y: 260, gap: 38, t: 236 }, { x: 255, y: 356, t: 236 },
    ]);
    s += rule(10, 214, 330, 214);
    return s;
  },
  caption: 'Carbonyl or carboxyl end at the top. The highlighted bond decides D or L.',
});

/* ---------------------------------------------- 8. sugars as patterns --- */

/* The claim the Fischer section is built on: four stereocenters stacked up
   become a pattern you can match at a glance. */
FIGURES.push({
  id: 'sugar-patterns',
  section: 'fischer',
  anchor: '<h3>Why Fischer projections are still used</h3>',
  alt: 'Fischer projections of D-glucose, D-mannose and D-galactose side by side. Each has CHO at the top and CH2OH at the bottom with four stereocenters between. D-glucose reads right, left, right, right; D-mannose differs only at C2 and D-galactose only at C4.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const sugar = (cx, rights, diff) => chain(cx, 66, 48, 'CHO', rights.map((r, i) => {
      const hot = diff === i + 2;
      return r ? { l: 'H', r: 'OH', hi: hot, kinds: { r: hot ? 'warn' : 'hi' } }
               : { l: 'OH', r: 'H', hi: hot, kinds: { l: hot ? 'warn' : 'hi' } };
    }), 'CH₂OH', { h: 44, nums: true });
    s += tag(380, 30, 'FOUR STEREOCENTERS, READ AS A PATTERN');
    s += sugar(150, [true, false, true, true], 0);
    s += text(150, 356, 'D-glucose', { cls: 'fg-tag-good' });
    s += text(150, 376, 'right, left, right, right', { cls: 'fg-sm' });
    s += sugar(380, [false, false, true, true], 2);
    s += text(380, 356, 'D-mannose', { cls: 'fg-tag-good' });
    s += text(380, 376, 'differs from glucose at C2 only', { cls: 'fg-sm' });
    s += sugar(610, [true, false, false, true], 4);
    s += text(610, 356, 'D-galactose', { cls: 'fg-tag-good' });
    s += text(610, 376, 'differs from glucose at C4 only', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Three aldohexoses. Coral marks the one OH that differs from glucose.',
});

FIGURES.push({
  id: 'l-sugar-patterns',
  lessons: ['fischer'],
  alt: 'Fischer projections of D-glucose, D-mannose and D-galactose side by side, each with CHO at the top and CH2OH at the bottom. D-mannose differs from glucose only at C2, and D-galactose only at C4; the differing OH is highlighted.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    const col = (cx, rights, diff) => chain(cx, 34, 44, 'CHO', rights.map((r, i) => {
      const hot = diff === i + 2;
      return r ? { l: 'H', r: 'OH', hi: hot, kinds: { r: hot ? 'warn' : 'hi' } }
               : { l: 'OH', r: 'H', hi: hot, kinds: { l: hot ? 'warn' : 'hi' } };
    }), 'CH₂OH', { h: 34 });
    s += col(57, [true, false, true, true], 0);
    s += col(170, [false, false, true, true], 2);
    s += col(283, [true, false, false, true], 4);
    s += text(57, 290, 'D-glucose', { cls: 'fg-tag-good' });
    s += text(170, 290, 'D-mannose', { cls: 'fg-tag-good' });
    s += text(283, 290, 'D-galactose', { cls: 'fg-tag-good' });
    s += text(170, 312, 'rows are C2, C3, C4, C5 from the top', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Coral marks the one OH that differs from glucose: C2 in mannose, C4 in galactose.',
});

export default FIGURES;
