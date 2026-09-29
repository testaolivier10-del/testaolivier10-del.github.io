/* Figures for the alkene-structure notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure here is 340 wide with fg-lbl / fg-tag labels, so the same
   drawing serves the notes page and the lesson. The exceptions are the ring
   figures (cyclooctene, Bredt), which only the notes page shows. */
import { atom, bond, wedge, hash, arrow, curve, text, tag, rule, P } from '../lib/ochem-figure.mjs';
import { zig, sk, polyPts, polyRing, ringDouble } from '../lib/ochem-skeletal.mjs';
import { skDouble } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
/* Screen direction for a math angle: 0 is east, 90 is up. */
const dir = (deg) => ({ x: Math.cos(rad(deg)), y: -Math.sin(rad(deg)) });
const at = (c, deg, len) => { const d = dir(deg); return P(c.x + d.x * len, c.y + d.y * len); };
const r2 = (v) => Math.round(v * 100) / 100;

function ell(cx, cy, rx, ry, deg, cls) {
  return `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" transform="rotate(${r2(-deg)} ${r2(cx)} ${r2(cy)})"></ellipse>`;
}
/* A p orbital: two lobes on opposite sides of the nucleus, one in each
   phase colour. `deg` is the screen direction of the first lobe. */
function pOrb(c, deg, len = 58, w = 13) {
  const d = dir(deg);
  const a = P(c.x + d.x * len * 0.52, c.y + d.y * len * 0.52);
  const b = P(c.x - d.x * len * 0.52, c.y - d.y * len * 0.52);
  return ell(a.x, a.y, len * 0.5, w, deg, 'fg-orb') + ell(b.x, b.y, len * 0.5, w, deg, 'fg-orb-alt');
}
/* The outline of one pi cloud: a dashed rounded box around two lobes. */
const cloud = (x1, y1, x2, y2) =>
  `<rect class="fg-dash-hi" x="${r2(x1)}" y="${r2(y1)}" width="${r2(x2 - x1)}" height="${r2(y2 - y1)}" rx="${r2(Math.min(24, (y2 - y1) / 2))}" fill="none"></rect>`;
/* A group label too long for an atom disc, drawn in a rounded box. */
const pill = (x, y, lbl, w, cls = 'fg-atom') =>
  `<rect class="${cls}" x="${r2(x - w / 2)}" y="${r2(y - 14)}" width="${w}" height="28" rx="14"></rect>` + atom(x, y, lbl, { kind: 'point', size: 12 });
const pillW = (lbl) => Math.max(30, lbl.length * 8.4 + 10);
const Hr = 11, Cr = 14;
const H = (p, kind) => atom(p.x, p.y, 'H', { r: Hr, ...(kind ? { kind } : {}) });
const C = (p, lbl = 'C', kind) => atom(p.x, p.y, lbl, { r: Cr, ...(kind ? { kind } : {}) });
const sb = (a, b, ra = Cr, rb = Hr, o = {}) => bond(a, b, { rFrom: ra, rTo: rb, ...o });
/* A label with an italic prefix, e.g. <i>cis</i>-but-2-ene. */
const italicTag = (x, y, it, rest, cls = 'fg-tag') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle"><tspan font-style="italic">${it}</tspan>${rest}</text>`;
/* A small filled dot marking an unlabeled vertex (a bridgehead, say). */
const dot = (p, cls = 'fg-fill-hi', r = 4.5) => `<circle class="${cls}" cx="${r2(p.x)}" cy="${r2(p.y)}" r="${r}"></circle>`;

/* Ethene in perspective. u runs along the C–C axis, v across the plane of
   the six atoms (positive v is away from the reader), w straight up. */
const pv = (u, v, y0, w = 0) => P(170 + u + 0.15 * v, y0 - 0.4 * v - w);
const planePath = (y0, u1, u2, vv = 85) => {
  const q = (u, v) => { const p = pv(u, v, y0); return `${r2(p.x)} ${r2(p.y)}`; };
  return `<path class="fg-dash" d="M${q(u1, -vv)} L${q(u2, -vv)} L${q(u2, vv)} L${q(u1, vv)} Z"></path>`;
};

/* --------------------------------------------------- alkene-pi-overlap ---
   Ethene in perspective: the plane of the six atoms, the sigma bond on the
   axis, one p orbital standing up through each carbon, and the two clouds
   of the one pi bond. Redrawn: the old figure drew the hydrogens in the page
   AND the p orbitals in the page, which cannot both be true. */
FIGURES.push({
  id: 'alkene-pi-overlap',
  section: 'alkene-structure',
  anchor: 'one sigma bond plus one pi bond.</p>',
  lessons: ['alkene-structure'],
  alt: 'Ethene drawn in perspective, every atom labeled. A dashed parallelogram marks one flat plane that holds both carbons and all four hydrogens. The two carbons are joined by a solid line on the axis, the sigma bond. On each carbon a p orbital stands straight up through the plane, one lobe above and one below. The two upper lobes sit side by side inside one dashed outline, labeled upper pi cloud, and the two lower lobes inside another, labeled lower pi cloud.',
  viewBox: '0 0 340 262',
  build() {
    const y0 = 118;
    const C1 = pv(-40, 0, y0), C2 = pv(40, 0, y0);
    const hs = [[C1, pv(-84, 60, y0)], [C1, pv(-84, -60, y0)], [C2, pv(84, 60, y0)], [C2, pv(84, -60, y0)]];
    let s = planePath(y0, -130, 130);
    hs.forEach(([c, h]) => { s += sb(c, h); });
    s += sb(C1, C2, Cr, Cr);
    s += pOrb(C1, 90) + pOrb(C2, 90);
    s += cloud(112, y0 - 64, 228, y0 - 8) + cloud(112, y0 + 8, 228, y0 + 64);
    hs.forEach(([, h]) => { s += H(h); });
    s += C(C1) + C(C2);
    s += tag(52, 66, 'p orbital');
    s += `<line class="fg-bond-soft" x1="84" y1="68" x2="116" y2="82"></line>`;
    s += tag(290, 66, 'upper π cloud');
    s += tag(290, 180, 'lower π cloud');
    s += text(54, 180, 'the plane', { cls: 'fg-tag-mut' });
    s += rule(10, 200, 330, 200);
    s += tag(170, 222, 'solid line between the carbons: the σ bond');
    s += tag(170, 244, 'both dashed clouds together: one π bond');
    return s;
  },
  caption: 'The dashed parallelogram is the plane of the six atoms. Each p orbital stands at right angles to it, and the two shades are the two halves (phases) of each orbital.',
});

/* -------------------------------------------------------- alkene-twist ---
   The same ethene before and after the right-hand carbon turns a quarter
   turn about the C–C axis. After the turn its hydrogens stand straight up
   and down, and its p orbital lies in the old plane, pointing toward and
   away from the reader: at right angles to the left carbon's p orbital. */
FIGURES.push({
  id: 'alkene-twist',
  section: 'alkene-structure',
  anchor: 'The sigma bond, which lies on the axis, is untouched.</p>',
  lessons: ['alkene-structure'],
  alt: 'Ethene in perspective, drawn twice, every atom labeled. Top: flat, with both p orbitals standing straight up through the plane and overlapping as one pi bond. Bottom: the right-hand carbon has turned a quarter turn about the C–C axis. Its two hydrogens now point straight up and straight down, and its p orbital lies flat, one lobe toward the reader and one away. The left carbon is unchanged, with its p orbital still upright. The two p orbitals are at right angles, and a label says there is no overlap and no pi bond.',
  viewBox: '0 0 340 376',
  build() {
    let s = '';
    // ---- before
    let y0 = 96;
    s += text(10, 16, 'flat: p orbitals parallel', { cls: 'fg-tag-mut', anchor: 'start' });
    {
      const C1 = pv(-40, 0, y0), C2 = pv(40, 0, y0);
      const hs = [[C1, pv(-84, 60, y0)], [C1, pv(-84, -60, y0)], [C2, pv(84, 60, y0)], [C2, pv(84, -60, y0)]];
      s += planePath(y0, -130, 130);
      hs.forEach(([c, h]) => { s += sb(c, h); });
      s += sb(C1, C2, Cr, Cr, { order: 2 });
      s += pOrb(C1, 90) + pOrb(C2, 90);
      s += cloud(112, y0 - 64, 228, y0 + 64);
      hs.forEach(([, h]) => { s += H(h); });
      s += C(C1) + C(C2);
      s += tag(290, y0 - 48, 'π bond');
    }
    s += rule(10, 176, 330, 176);
    // ---- after a quarter turn of the right carbon
    y0 = 272;
    s += text(10, 196, 'right carbon turned a quarter turn', { cls: 'fg-tag-mut', anchor: 'start' });
    {
      const C1 = pv(-40, 0, y0), C2 = pv(40, 0, y0);
      const h1 = [pv(-84, 60, y0), pv(-84, -60, y0)];
      const h2 = [P(C2.x + 62, y0 - 40), P(C2.x + 62, y0 + 40)];
      s += planePath(y0, -130, 0);
      // the right half's new plane stands upright, at right angles to the old one
      s += `<rect class="fg-dash" x="${r2(C2.x - 36)}" y="${y0 - 62}" width="124" height="124"></rect>`;
      h1.forEach((h) => { s += sb(C1, h); });
      h2.forEach((h) => { s += sb(C2, h); });
      s += sb(C1, C2, Cr, Cr);
      s += pOrb(C1, 90);
      /* The turned p orbital lies along v: on screen that direction is
         about 69 degrees up from horizontal, lobe away from the reader
         up-right, lobe toward the reader down-left. */
      const vDeg = (Math.atan2(0.4, 0.15) * 180) / Math.PI;
      s += pOrb(C2, vDeg, 60, 11);
      h1.forEach((h) => { s += H(h); });
      h2.forEach((h) => { s += H(h); });
      s += C(C1) + C(C2);
      s += tag(262, y0 - 70, 'behind');
      s += tag(178, y0 + 76, 'in front');
      s += curve(P(318, y0 - 30), P(318, y0 + 30), { bow: -12, size: 7 });
      s += tag(170, 366, 'p orbitals at 90°: no overlap, no π bond', { cls: 'fg-tag-warn' });
    }
    return s;
  },
  caption: 'Top: both p orbitals stand upright and overlap. Bottom: the right carbon’s hydrogens now stand in an upright plane (dashed square), and its p orbital points toward you and away from you.',
});

/* --------------------------------------------------- double-bond-locants ---
   Pent-2-ene numbered from each end, then the two methylcyclohexenes with
   their ring numbers. */
function ringNumbers(cx, cy, r, pts, order, skip = {}) {
  // order: list of vertex indices in numbering order (C1 first)
  let s = '';
  order.forEach((idx, k) => {
    const p = pts[idx];
    const ang = Math.atan2(-(p.y - cy), p.x - cx) * 180 / Math.PI + (skip[idx] || 0);
    const q = at(P(cx, cy), ang, r - 17);
    s += text(q.x, q.y + 4, String(k + 1), { cls: 'fg-tag' });
  });
  return s;
}
FIGURES.push({
  id: 'double-bond-locants',
  section: 'alkene-structure',
  anchor: 'it on the first carbon past C2.</p>',
  alt: 'Top: the skeletal structure of CH3CH=CHCH2CH3 drawn twice. Numbered from the left end, the double bond joins C2 and C3, labeled pent-2-ene, correct. Numbered from the right end, the same double bond joins C3 and C4, labeled pent-3-ene, wrong. Bottom: two methylcyclohexene rings with their first three ring carbons numbered. In the first, the double bond joins C1 and C2 and the methyl sits on C1: 1-methylcyclohexene. In the second, the double bond joins C1 and C2 and the methyl sits on C3, one carbon past the double bond: 3-methylcyclohexene.',
  viewBox: '0 0 340 340',
  build() {
    let s = '';
    const chain = (y, fromLeft) => {
      const pts = zig(92, y, 5, 40, 24);
      let t = '';
      t += sk(pts[0], pts[1]) + skDouble(pts[1], pts[2], P(132, y + 30)) + sk(pts[2], pts[3]) + sk(pts[3], pts[4]);
      pts.forEach((p, i) => {
        const n = fromLeft ? i + 1 : 5 - i;
        const up = i % 2 === 1;
        const cls = (n === 2 || n === 3) && fromLeft ? 'fg-tag' : (!fromLeft && (n === 3 || n === 4)) ? 'fg-tag-warn' : 'fg-tag-mut';
        t += text(p.x, up ? p.y - 10 : p.y + 18, String(n), { cls });
      });
      return t;
    };
    s += text(10, 18, 'numbered from the left', { cls: 'fg-tag-mut', anchor: 'start' });
    s += chain(66, true);
    s += tag(300, 58, 'pent-2-ene', { cls: 'fg-tag-good' });
    s += text(10, 110, 'numbered from the right', { cls: 'fg-tag-mut', anchor: 'start' });
    s += chain(158, false);
    s += tag(300, 150, 'pent-3-ene', { cls: 'fg-tag-warn' });
    s += rule(10, 190, 330, 190);

    // ---- rings. Vertex indices from polyPts(rot 90): 0 top, then counter-
    // clockwise: 1 upper left, 2 lower left, 3 bottom, 4 lower right, 5 upper right.
    const ring = (cx, cy, methylAt, name) => {
      const pts = polyPts(cx, cy, 6, 34, 90);
      const c = P(cx, cy);
      let t = '';
      for (let i = 0; i < 6; i++) {
        const a = pts[i], b = pts[(i + 1) % 6];
        t += (i === 4) ? ringDouble(a, b, c, { inset: 7 }) : sk(a, b);
      }
      // C1 = vertex 5, C2 = vertex 4, then 3, 2, 1, 0
      const order = [5, 4, 3, 2, 1, 0];
      const m = pts[order[methylAt - 1]];
      const ang = Math.atan2(-(m.y - cy), m.x - cx) * 180 / Math.PI;
      const end = at(m, ang, 32);
      t += bond(m, end, { rFrom: 0, rTo: 16 });
      t += pill(end.x, end.y, 'CH₃', 40);
      t += ringNumbers(cx, cy, 34, pts, order.slice(0, 3));
      t += tag(cx, 330, name);
      return t;
    };
    s += ring(80, 244, 1, '1-methylcyclohexene');
    s += ring(254, 236, 3, '3-methylcyclohexene');
    return s;
  },
  caption: 'Top: find where the double bond starts in each numbering. Bottom: the numbers sit inside each ring, beside their carbons. In both rings C1 and C2 are the doubly bonded carbons, and only the methyl moves.',
});

/* --------------------------------------------------- alkene-geometry-names ---
   Row 1: cis- and trans-but-2-ene. Row 2: 3-chloropent-2-ene, where each
   alkene carbon carries two different groups that are not both H-and-other,
   so cis/trans has nothing to compare and E/Z does the job. */
function alkene(cx, cy, subs, opts = {}) {
  // subs: { ul, dl, ur, dr } as { lbl, kind? }. C=C horizontal.
  const half = opts.half ?? 26, arm = opts.arm ?? 40;
  const A = P(cx - half, cy), B = P(cx + half, cy);
  let s = sb(A, B, Cr, Cr, { order: 2 });
  const place = (c, deg, sub) => {
    if (!sub) return '';
    const isAtom = sub.lbl.length <= 2;
    const len = isAtom ? arm : arm + (pillW(sub.lbl) - 30) * 0.35;
    const p = at(c, deg, len);
    const d = dir(deg);
    const rTo = isAtom ? (sub.lbl === 'H' ? Hr : 15) : Math.min(pillW(sub.lbl) / 2, 14 / Math.max(0.2, Math.abs(d.y)));
    let t = bond(c, p, { rFrom: Cr, rTo: Math.min(rTo, len - 20) });
    if (isAtom) t += sub.lbl === 'H' ? H(p) : atom(p.x, p.y, sub.lbl, { r: 15, ...(sub.kind ? { kind: sub.kind } : {}) });
    else t += pill(p.x, p.y, sub.lbl, pillW(sub.lbl), sub.kind ? `fg-atom-${sub.kind}` : 'fg-atom');
    return t;
  };
  s += place(A, 120, subs.ul) + place(A, 240, subs.dl) + place(B, 60, subs.ur) + place(B, 300, subs.dr);
  s += C(A) + C(B);
  return s;
}
FIGURES.push({
  id: 'alkene-geometry-names',
  section: 'alkene-structure',
  anchor: 'from <i>entgegen</i>, "opposite".</p>',
  alt: 'Top row: cis-but-2-ene, with both CH3 groups above the C=C and both hydrogens below, and trans-but-2-ene, with one CH3 above on the left carbon and one below on the right carbon. Bottom row: 3-chloropent-2-ene. The left alkene carbon carries CH3 above and H below; the right alkene carbon carries Cl above and CH2CH3 below. On each carbon the higher-priority group is tagged: CH3 on the left, Cl on the right. Both sit above the double bond, so the isomer is Z, even though the carbon chain runs from upper left to lower right across the double bond.',
  viewBox: '0 0 340 320',
  build() {
    let s = '';
    const me = { lbl: 'CH₃', kind: 'hi' }, h = { lbl: 'H' };
    s += alkene(84, 62, { ul: me, dl: h, ur: me, dr: h }, { half: 22, arm: 38 });
    s += italicTag(84, 124, 'cis', '-but-2-ene');
    s += alkene(256, 62, { ul: me, dl: h, ur: h, dr: me }, { half: 22, arm: 38 });
    s += italicTag(256, 124, 'trans', '-but-2-ene');
    s += rule(10, 144, 330, 144);
    const y = 222;
    s += alkene(170, y, { ul: { lbl: 'CH₃', kind: 'hi' }, dl: { lbl: 'H' }, ur: { lbl: 'Cl', kind: 'hi' }, dr: { lbl: 'CH₂CH₃' } }, { half: 26, arm: 40 });
    s += tag(78, y - 34, 'higher', { anchor: 'middle' });
    s += text(94, y + 39, 'lower', { cls: 'fg-tag-mut' });
    s += tag(262, y - 21, 'higher');
    s += text(286, y + 48, 'lower', { cls: 'fg-tag-mut' });
    s += tag(170, 304, '(Z)-3-chloropent-2-ene: higher groups on one side', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Top: compare where the two highlighted methyls sit. Bottom: compare the two highlighted groups, one on each carbon.',
});

/* ------------------------------------------------------ c4h8-one-degree ---
   Butane, then the two kinds of C4H8 it can lose two hydrogens to become. */
FIGURES.push({
  id: 'c4h8-one-degree',
  section: 'alkene-structure',
  anchor: 'cyclobutane gave them up to close a ring.</p>',
  lessons: ['alkene-structure'],
  alt: 'Three skeletal structures side by side. Butane, a zigzag of four carbons, labeled C4H10, saturated. But-1-ene, the same zigzag with a double bond at one end, labeled C4H8, one pi bond. Cyclobutane, a square of four carbons, labeled C4H8, one ring. Each of the last two has two hydrogens fewer than butane.',
  viewBox: '0 0 340 140',
  build() {
    let s = '';
    const bu = zig(18, 62, 4, 26, 18);
    s += sk(bu[0], bu[1]) + sk(bu[1], bu[2]) + sk(bu[2], bu[3]);
    s += label(57, 100, 'C₄H₁₀') + text(57, 122, 'saturated', { cls: 'fg-tag-mut' });
    const be = zig(132, 62, 4, 26, 18);
    s += skDouble(be[0], be[1], P(150, 70)) + sk(be[1], be[2]) + sk(be[2], be[3]);
    s += label(171, 100, 'C₄H₈') + tag(171, 122, 'one π bond');
    const sq = [P(262, 36), P(300, 36), P(300, 74), P(262, 74)];
    s += polyRing(sq);
    s += label(281, 100, 'C₄H₈') + tag(281, 122, 'one ring');
    return s;
  },
  caption: 'Left: butane. Middle and right: two ways to be two hydrogens short of it.',
});
function label(x, y, s) { return `<text class="fg-lbl" x="${x}" y="${y}" text-anchor="middle" style="font-family:var(--font-ui)">${s}</text>`; }

/* ------------------------------------------------- hydrogenation-ladder ---
   The three butenes, each hydrogenated to the same butane. Tops are to scale
   with each other (12 px per kcal/mol); the long drop to butane is not, which
   the break marks on the arrows say. */
function butene(kind, cx, cy) {
  // skeletal, four carbons, bond length 22
  let s = '';
  if (kind === '1') {
    const p = zig(cx - 39, cy + 8, 4, 26, 15);
    s += skDouble(p[0], p[1], P(p[0].x + 14, p[0].y + 8)) + sk(p[1], p[2]) + sk(p[2], p[3]);
  } else if (kind === 'cis') {
    const a = P(cx - 15, cy), b = P(cx + 15, cy);
    const m1 = at(a, 120, 26), m2 = at(b, 60, 26);
    s += skDouble(a, b, P(cx, cy + 8)) + `<line class="fg-bond-hi" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(m1.x)}" y2="${r2(m1.y)}"></line>` +
      `<line class="fg-bond-hi" x1="${r2(b.x)}" y1="${r2(b.y)}" x2="${r2(m2.x)}" y2="${r2(m2.y)}"></line>`;
  } else {
    const a = P(cx - 15, cy), b = P(cx + 15, cy);
    const m1 = at(a, 120, 26), m2 = at(b, 300, 26);
    s += skDouble(a, b, P(cx, cy - 8)) + `<line class="fg-bond-hi" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(m1.x)}" y2="${r2(m1.y)}"></line>` +
      `<line class="fg-bond-hi" x1="${r2(b.x)}" y1="${r2(b.y)}" x2="${r2(m2.x)}" y2="${r2(m2.y)}"></line>`;
  }
  return s;
}
FIGURES.push({
  id: 'hydrogenation-ladder',
  section: 'alkene-structure',
  anchor: 'lower in energy means more stable.</p>',
  lessons: ['alkene-structure'],
  alt: 'An energy diagram. Three short level lines near the top, each with a skeletal structure above it: but-1-ene highest, cis-but-2-ene 1.7 kcal/mol lower, and trans-but-2-ene 1.0 kcal/mol lower still. In cis-but-2-ene the two methyl bonds point up on the same side; in trans-but-2-ene one points up and one down. From each level an arrow runs down to one shared level at the bottom, butane. The arrows are labeled with the heat released: 30.3, 28.6 and 27.6 kcal/mol. Break marks on the arrows show the long drop is not to scale.',
  viewBox: '0 0 340 340',
  build() {
    let s = '';
    s += arrow(P(22, 318), P(22, 34), { muted: true });
    s += text(30, 30, 'energy', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(330, 30, 'arrows: heat released, kcal/mol', { cls: 'fg-tag-mut', anchor: 'end' });
    const cols = [
      { x: 84, name: 'but-1-ene', kind: '1', dh: '30.3', top: 130 },
      { x: 176, name: null, it: 'cis', kind: 'cis', dh: '28.6', top: 130 + 1.7 * 12 },
      { x: 272, name: null, it: 'trans', kind: 'trans', dh: '27.6', top: 130 + 2.7 * 12 },
    ];
    const base = 290;
    cols.forEach((c) => {
      s += `<line class="fg-bond" x1="${c.x - 32}" y1="${r2(c.top)}" x2="${c.x + 32}" y2="${r2(c.top)}"></line>`;
      s += butene(c.kind, c.x, 76);
      s += c.name ? tag(c.x, 116, c.name) : italicTag(c.x, 116, c.it, '-but-2-ene');
      s += arrow(P(c.x, c.top + 4), P(c.x, base - 4));
      // break marks
      const yb = c.top + 44;
      s += `<line class="fg-bond-soft" x1="${c.x - 9}" y1="${r2(yb + 4)}" x2="${c.x + 9}" y2="${r2(yb - 4)}"></line>`;
      s += `<line class="fg-bond-soft" x1="${c.x - 9}" y1="${r2(yb + 10)}" x2="${c.x + 9}" y2="${r2(yb + 2)}"></line>`;
      s += text(c.x + 6, 250, c.dh, { cls: 'fg-lbl', anchor: 'start' });
    });
    s += `<line class="fg-bond" x1="52" y1="${base}" x2="310" y2="${base}"></line>`;
    s += tag(180, base + 22, 'butane (the same product for all three)');
    return s;
  },
  caption: 'The three tops are drawn to scale with each other, but the long drop to butane is not. Compare the arrow lengths, and in the two but-2-enes compare which way the highlighted methyl bonds point.',
});

/* ------------------------------------------------------ substitution-count ---
   Mono- to tetrasubstituted, with the bonds that count highlighted: each one
   joins an alkene carbon to a carbon group. */
FIGURES.push({
  id: 'substitution-count',
  section: 'alkene-structure',
  anchor: 'a little over 1 kcal/mol per group on average.</p>',
  lessons: ['alkene-structure'],
  alt: 'Four skeletal alkenes in a two-by-two grid, with the bonds from the alkene carbons to carbon groups highlighted. But-1-ene: one highlighted bond, monosubstituted. trans-But-2-ene: two highlighted bonds, one on each alkene carbon, disubstituted. 2-Methylbut-2-ene: three highlighted bonds, trisubstituted. 2,3-Dimethylbut-2-ene: four highlighted bonds, tetrasubstituted.',
  viewBox: '0 0 340 284',
  build() {
    let s = '';
    const cell = (cx, cy, kind) => {
      const p = zig(cx - 45, cy + 10, 4, 30, 18);
      let t = '';
      const dbl = kind === 'mono' ? [0, 1] : [1, 2];
      // double bond
      const a = p[dbl[0]], b = p[dbl[1]];
      t += skDouble(a, b, kind === 'mono' ? P(a.x + 20, a.y + 12) : P((a.x + b.x) / 2 - 8, (a.y + b.y) / 2 - 12));
      if (kind === 'mono') {
        t += sk(p[1], p[2], true) + sk(p[2], p[3]);
      } else {
        t += sk(p[0], p[1], true) + sk(p[2], p[3], true);
        if (kind === 'tri' || kind === 'tetra') t += sk(p[1], P(p[1].x, p[1].y - 28), true);
        if (kind === 'tetra') t += sk(p[2], P(p[2].x, p[2].y + 28), true);
      }
      return t;
    };
    const rows = [
      { cx: 85, cy: 60, kind: 'mono', name: 'but-1-ene', n: 'mono: 1 group' },
      { cx: 255, cy: 60, kind: 'di', it: 'trans', name: '-but-2-ene', n: 'di: 2 groups' },
      { cx: 85, cy: 196, kind: 'tri', name: '2-methylbut-2-ene', n: 'tri: 3 groups' },
      { cx: 255, cy: 196, kind: 'tetra', name: '2,3-dimethylbut-2-ene', n: 'tetra: 4 groups' },
    ];
    rows.forEach((r) => {
      s += cell(r.cx, r.cy, r.kind);
      s += r.it ? italicTag(r.cx, r.cy + 54, r.it, r.name, 'fg-tag-mut') : text(r.cx, r.cy + 54, r.name, { cls: 'fg-tag-mut' });
      s += tag(r.cx, r.cy + 72, r.n);
    });
    s += rule(10, 146, 330, 146);
    s += `<line class="fg-rule" x1="170" y1="14" x2="170" y2="276"></line>`;
    return s;
  },
  caption: 'Count the highlighted bonds. Each one joins an alkene carbon to a carbon group; bonds farther out do not count.',
});

/* -------------------------------------------------- alkene-hyperconjugation ---
   Propene in perspective. The methyl carbon lies in the plane; one of its
   C–H bonds points straight up, parallel to the p orbitals of the C=C, and
   that is the bond that shares a little of its electron density with the
   pi system. */
FIGURES.push({
  id: 'alkene-hyperconjugation',
  section: 'alkene-structure',
  anchor: 'so more groups mean more stabilization.</p>',
  lessons: ['alkene-structure'],
  alt: 'Propene drawn in perspective, every atom labeled. The two alkene carbons and the methyl carbon lie in one dashed plane, with p orbitals standing upright on the two alkene carbons and a dashed outline around their upper and lower lobes, the pi bond. One C–H bond of the methyl group points straight up, parallel to the p orbitals, and is highlighted with a shaded cloud. Its two other hydrogens point down below the plane. A label says this C–H bond lines up with the p orbitals and its electron density spreads slightly over the double bond.',
  viewBox: '0 0 340 252',
  build() {
    const y0 = 150;
    const C1 = pv(-52, 0, y0), C2 = pv(22, 0, y0);
    const C3 = pv(22 + 38, 66, y0);          // methyl carbon, in the plane
    const hA = [pv(-94, 60, y0), pv(-94, -60, y0)];
    const h2 = pv(62, -60, y0);
    const hUp = P(C3.x, C3.y - 62);           // the lined-up C–H
    const hD1 = P(C3.x + 30, C3.y + 40), hD2 = P(C3.x + 52, C3.y + 12);
    let s = planePath(y0, -140, 110);
    hA.forEach((h) => { s += sb(C1, h); });
    s += sb(C2, h2);
    s += sb(C2, C3, Cr, Cr);
    s += sb(C1, C2, Cr, Cr);
    s += pOrb(C1, 90) + pOrb(C2, 90);
    s += cloud(C1.x - 18, y0 - 64, C2.x + 18, y0 + 64);
    s += ell(C3.x, C3.y - 32, 30, 11, 90, 'fg-orb');
    s += bond(C3, hUp, { rFrom: Cr, rTo: Hr, cls: 'fg-bond-hi' });
    s += sb(C3, hD1) + sb(C3, hD2);
    hA.forEach((h) => { s += H(h); });
    s += H(h2) + H(hUp, 'hi') + H(hD1) + H(hD2);
    s += C(C1) + C(C2) + C(C3);
    s += tag(155, 80, 'π bond');
    s += tag(170, 36, 'this C–H is lined up with the p orbitals');
    s += tag(170, 240, 'and spreads slightly over the C=C');
    return s;
  },
  caption: 'Propene. The shaded C–H bond on the methyl carbon runs parallel to the two p orbitals, close enough to overlap them slightly.',
});

/* ---------------------------------------------------- cyclooctene-cis-trans ---
   Cis- and trans-cyclooctene drawn the same way: the C=C across the middle
   and the six CH2 groups as one strap. For trans the strap has to cross one
   face of the C=C, drawn passing in front of it. Notes only. */
FIGURES.push({
  id: 'cyclooctene-cis-trans',
  section: 'alkene-structure',
  anchor: 'that can be kept in a bottle.</p>',
  alt: 'Two drawings of cyclooctene, each with the C=C across the middle, both carbons and their hydrogens labeled, and the other six ring carbons drawn as one curved strap labeled six CH2. Top, cis-cyclooctene: both ring bonds leave the C=C on the upper side and the strap arcs over the top, never crossing the double bond; both hydrogens point down. Bottom, trans-cyclooctene: one ring bond leaves the left carbon upward and the other leaves the right carbon downward, so the strap has to pass across the face of the double bond, drawn crossing in front of it; one hydrogen points down on the left and the other up on the right.',
  viewBox: '0 0 340 396',
  build() {
    let s = '';
    const dbl = (A, B, gapAt) => {
      // double bond as two lines; optional gap where the strap passes in front
      let t = '';
      [-4, 4].forEach((o) => {
        const x1 = A.x + Cr, x2 = B.x - Cr, y = A.y + o;
        if (gapAt === undefined) t += `<line class="fg-bond" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"></line>`;
        else t += `<line class="fg-bond" x1="${x1}" y1="${y}" x2="${r2(gapAt - 9)}" y2="${y}"></line><line class="fg-bond" x1="${r2(gapAt + 9)}" y1="${y}" x2="${x2}" y2="${y}"></line>`;
      });
      return t;
    };
    // ---- cis
    let y = 110;
    let A = P(135, y), B = P(205, y);
    let R1 = at(A, 125, 40), R2 = at(B, 55, 40);
    s += `<text class="fg-tag-mut" x="10" y="18" text-anchor="start"><tspan font-style="italic">cis</tspan>-cyclooctene</text>`;
    s += dbl(A, B);
    s += bond(A, R1, { rFrom: Cr, rTo: 0 }) + bond(B, R2, { rFrom: Cr, rTo: 0 });
    s += `<path class="fg-bond" d="M${r2(R1.x)} ${r2(R1.y)} C ${r2(R1.x - 20)} ${r2(R1.y - 70)} ${r2(R2.x + 20)} ${r2(R2.y - 70)} ${r2(R2.x)} ${r2(R2.y)}"></path>`;
    s += tag(170, y - 56, 'six CH₂');
    const hA1 = at(A, 235, 38), hB1 = at(B, 305, 38);
    s += sb(A, hA1) + sb(B, hB1) + H(hA1) + H(hB1);
    s += C(A) + C(B);
    s += tag(170, y + 64, 'strap stays on one side of the C=C', { cls: 'fg-tag-good' });
    s += rule(10, 190, 330, 190);
    // ---- trans
    y = 296;
    A = P(135, y); B = P(205, y);
    R1 = at(A, 125, 40); R2 = at(B, 305, 40);
    s += `<text class="fg-tag-mut" x="10" y="208" text-anchor="start"><tspan font-style="italic">trans</tspan>-cyclooctene</text>`;
    s += dbl(A, B, 170);
    s += bond(A, R1, { rFrom: Cr, rTo: 0 }) + bond(B, R2, { rFrom: Cr, rTo: 0 });
    const hA2 = at(A, 235, 38), hB2 = at(B, 55, 38);
    s += sb(A, hA2) + sb(B, hB2) + H(hA2) + H(hB2);
    s += C(A) + C(B);
    // strap: up and over from R1, down across the middle of the C=C, then round to R2
    s += `<path class="fg-bond" d="M${r2(R1.x)} ${r2(R1.y)} C ${r2(R1.x - 30)} ${y - 90} 196 ${y - 90} 172 ${y - 26} L 170 ${y + 22} C 168 ${y + 70} ${r2(R2.x + 30)} ${y + 76} ${r2(R2.x)} ${r2(R2.y)}"></path>`;
    s += tag(66, y - 50, 'six CH₂');
    s += tag(170, 386, 'strap must cross one face of the C=C', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Follow the strap from one alkene carbon to the other. In the <i>trans</i> ring it has to pass across the double bond; the gap in the double bond marks where the strap passes in front of it.',
});

/* ------------------------------------------------------------- bredt-rule ---
   Row 1: norbornane drawn flat (for counting the bridges) and in its usual
   3D drawing, bridgeheads marked. Row 2: the 3D drawing with a would-be
   C1=C2 double bond: C2's p orbital stands up, but the bridgehead C1 has
   all three bonds pulled to one side (a pyramid), so the orbital it has
   left points out sideways and cannot line up. Row 3: the two bridgehead
   alkenes drawn flat and numbered, every carbon at a visible vertex, with
   the largest ring through the C=C highlighted. Notes only. */
/* Flat bicyclic drawings. Every bridge carbon sits at a bend so it can be
   counted: the one-carbon bridge is a low peak, and a three-carbon bridge
   is a zigzag. */
function bicycleFlat(cx, cy, big) {
  const w = big ? 58 : 50;
  const L = P(cx - w, cy), R = P(cx + w, cy);
  const T = big ? [P(cx - 34, cy - 28), P(cx, cy - 44), P(cx + 34, cy - 28)] : [P(cx - 22, cy - 34), P(cx + 22, cy - 34)];
  const Bm = T.map((p) => P(p.x, 2 * cy - p.y));
  const M = [P(cx, cy - 13)];
  return { L, R, T, Bm, M };
}
function norbornane3D(o, k) {
  const q = (dx, dy) => P(o.x + dx * k, o.y + dy * k);
  return { n1: q(-50, 0), n2: q(-22, 30), n3: q(22, 30), n4: q(50, 0), n5: q(22, -12), n6: q(-22, -12), n7: q(0, -46) };
}
FIGURES.push({
  id: 'bredt-rule',
  section: 'alkene-structure',
  anchor: 'cannot have a double bond at a bridgehead.</p>',
  alt: 'Top left: norbornane, bicyclo[2.2.1]heptane, drawn flat: two marked bridgehead carbons joined by three bridges, of two, two and one carbons, each carbon at a visible bend and each bridge labeled with its count. Top right: the same molecule in its usual 3D drawing, a six-membered ring folded like a boat with a one-carbon bridge arching over it, bridgeheads marked. Middle: the 3D drawing again with a would-be double bond from bridgehead C1 to C2. C2 carries an upright p orbital. C1 has all three of its bonds pulled to one side, like a pyramid, so the orbital it has left points out sideways. The two orbitals are at right angles and cannot overlap. Bottom left: bicyclo[2.2.1]hept-1-ene drawn flat and numbered 1 to 7, with the double bond from C1 to C2; the largest ring containing it, six atoms, is highlighted, and the label says it cannot be isolated. Bottom right: bicyclo[3.3.1]non-1-ene drawn flat and numbered 1 to 9, with the double bond from C1 to C2; the largest ring containing it, eight atoms, is highlighted, and the label says it can be isolated.',
  viewBox: '0 0 340 566',
  build() {
    let s = '';
    const path = (pts, hi) => pts.slice(1).map((p, i) => sk(pts[i], p, hi)).join('');
    // ---- row 1
    s += text(6, 18, 'norbornane = bicyclo[2.2.1]heptane', { cls: 'fg-tag-mut', anchor: 'start' });
    let g = bicycleFlat(85, 88, false);
    s += path([g.L, ...g.T, g.R]) + path([g.L, ...g.Bm, g.R]) + path([g.L, ...g.M, g.R]);
    s += dot(g.L) + dot(g.R);
    s += tag(85, 44, '2') + tag(85, 140, '2') + tag(85, 98, '1');
    s += tag(85, 164, 'bridgeheads: the dots');
    let n = norbornane3D(P(255, 96), 1);
    s += sk(n.n1, n.n2) + sk(n.n2, n.n3) + sk(n.n3, n.n4) + sk(n.n4, n.n5) + sk(n.n5, n.n6) + sk(n.n6, n.n1) + sk(n.n1, n.n7) + sk(n.n7, n.n4);
    s += dot(n.n1) + dot(n.n4);
    s += tag(255, 164, 'the same molecule in 3D');
    s += rule(10, 180, 330, 180);
    // ---- row 2: why the bridgehead cannot join a pi bond
    s += text(6, 200, 'a C=C from bridgehead C1 to C2?', { cls: 'fg-tag-mut', anchor: 'start' });
    n = norbornane3D(P(204, 262), 1.15);
    s += sk(n.n2, n.n3) + sk(n.n3, n.n4) + sk(n.n4, n.n5) + sk(n.n5, n.n6) + sk(n.n6, n.n1) + sk(n.n1, n.n7) + sk(n.n7, n.n4);
    s += sk(n.n1, n.n2);
    // the would-be second bond: a dashed line beside the sigma bond
    s += `<line class="fg-dash-hi" x1="${r2(n.n1.x - 5)}" y1="${r2(n.n1.y + 9)}" x2="${r2(n.n2.x - 7)}" y2="${r2(n.n2.y - 2)}"></line>`;
    s += pOrb(n.n2, 90, 44, 10);
    /* C1's three bonds all point right, into the cage, so the orbital it has
       left over points out to the left: one lobe, drawn outside the cage. */
    s += ell(n.n1.x - 24, n.n1.y + 3, 22, 10, 172, 'fg-orb');
    s += dot(n.n1) + dot(n.n2, 'fg-fill-mut', 3.5);
    s += text(n.n1.x + 2, n.n1.y - 12, 'C1', { cls: 'fg-tag' });
    s += text(n.n2.x - 22, n.n2.y + 12, 'C2', { cls: 'fg-tag' });
    s += tag(60, 296, 'C1: bonds pulled');
    s += tag(60, 312, 'to one side');
    s += tag(170, 350, 'orbitals at right angles: no π bond', { cls: 'fg-tag-warn' });
    s += rule(10, 364, 330, 364);
    // ---- row 3: the two bridgehead alkenes, flat and numbered
    const numbered = (cx, cy, big) => {
      const b = bicycleFlat(cx, cy, big);
      let t = '';
      t += skDouble(b.L, b.T[0], P(cx, cy));
      t += path([b.T[0], ...b.T.slice(1), b.R], true) + path([b.L, ...b.Bm, b.R], true);
      t += path([b.L, ...b.M, b.R]);
      const top = b.T.length;
      const labels = [[b.L, '1', -12, 4]];
      b.T.forEach((p, i) => labels.push([p, String(2 + i), 0, -8]));
      labels.push([b.R, String(2 + top), 12, 4]);
      b.Bm.slice().reverse().forEach((p, i) => labels.push([p, String(3 + top + i), 0, 17]));
      labels.push([b.M[0], String(3 + 2 * top), 0, 16]);
      labels.forEach(([p, v, dx, dy]) => { t += text(p.x + dx, p.y + dy, v, { cls: 'fg-tag-mut' }); });
      return { t, ringSize: 2 + 2 * top };
    };
    s += text(6, 384, 'bicyclo[2.2.1]hept-1-ene', { cls: 'fg-tag-mut', anchor: 'start' });
    let r = numbered(85, 456, false);
    s += r.t;
    s += tag(85, 534, `largest ring: ${r.ringSize} atoms`);
    s += tag(85, 554, 'cannot be isolated', { cls: 'fg-tag-warn' });
    s += `<line class="fg-rule" x1="172" y1="394" x2="172" y2="558"></line>`;
    s += text(180, 384, 'bicyclo[3.3.1]non-1-ene', { cls: 'fg-tag-mut', anchor: 'start' });
    r = numbered(256, 456, true);
    s += r.t;
    s += tag(256, 534, `largest ring: ${r.ringSize} atoms`);
    s += tag(256, 554, 'can be isolated', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Top: the flat drawing is for counting, the 3D drawing shows the shape. Middle: compare the direction of the two orbitals. Bottom: count the atoms of the highlighted ring, the largest ring that contains the double bond.',
});

/* ------------------------------------------------------ l-tap-substituents ---
   Lesson only: 2-methylpent-2-ene with every group on the two alkene carbons
   drawn as a tap target, plus the far CH3 of the ethyl group, which is the
   trap. data-key: 'yes' counts, 'h' is a hydrogen, 'far' is not on an
   alkene carbon. */
FIGURES.push({
  id: 'l-tap-substituents',
  lessons: ['alkene-structure'],
  alt: '2-Methylpent-2-ene with every group labeled. The left alkene carbon carries a CH3 above and a CH3 below. The right alkene carbon carries an H above and a CH2 below, and that CH2 carries a CH3 farther to the right. Each group is a tap target.',
  viewBox: '0 0 340 186',
  build() {
    const y = 96;
    const A = P(128, y), B = P(196, y);
    const g = [
      { p: at(A, 125, 58), lbl: 'CH₃', key: 'yes' },
      { p: at(A, 235, 58), lbl: 'CH₃', key: 'yes' },
      { p: at(B, 55, 50), lbl: 'H', key: 'h' },
      { p: at(B, 305, 58), lbl: 'CH₂', key: 'yes' },
    ];
    const far = P(g[3].p.x + 70, g[3].p.y);
    let s = sb(A, B, Cr, Cr, { order: 2 });
    g.forEach((x) => { s += bond(x.lbl === 'H' ? B : (x.p.x < 150 ? A : B), x.p, { rFrom: Cr, rTo: x.lbl === 'H' ? Hr : 16 }); });
    s += bond(g[3].p, far, { rFrom: 22, rTo: 22 });
    const hit = (p, lbl, key) => {
      const w = lbl === 'H' ? 34 : 44;
      return `<g class="hit" data-key="${key}" role="button" tabindex="0" aria-label="${lbl === 'H' ? 'H' : lbl.replace('₃', '3').replace('₂', '2')} group" style="cursor:pointer">` +
        `<rect class="fg-atom" x="${r2(p.x - w / 2)}" y="${r2(p.y - 17)}" width="${w}" height="34" rx="17"></rect>` +
        atom(p.x, p.y, lbl, { kind: 'point', size: 12 }) + '</g>';
    };
    g.forEach((x) => { s += hit(x.p, x.lbl, x.key); });
    s += hit(far, 'CH₃', 'far');
    s += C(A) + C(B);
    return s;
  },
  caption: 'The two C atoms joined by the double bond are the alkene carbons.',
});

export default FIGURES;
