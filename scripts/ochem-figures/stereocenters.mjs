/* Figures for the stereocenters notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure except nitrogen-inversion is 340 wide, stacked, and labelled
   only with fg-lbl and fg-tag text, so the same drawing can sit in the notes
   and in a lesson step. nitrogen-inversion (760 wide) is notes only.

   House style for a scan: the molecule is skeletal. Each candidate carbon
   (an sp3 carbon that is not CH3 or CH2) carries a teal dot and its locant,
   its hydrogen is drawn out as H, and each of its four groups is named on
   the drawing. Where a carbon has been ruled out on the first pass, its
   reason is written beside it in muted type. */
import { atom, bond, wedge, hash, arrow, text, rule, P } from '../lib/ochem-figure.mjs';
import { sk } from '../lib/ochem-skeletal.mjs';
import { skDouble } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const r2 = (v) => Math.round(v * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;
/* A point `len` from c at a math angle: 0 is east, 90 is up. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
const tg = (x, y, s, cls = 'fg-tag', anchor = 'middle') => text(x, y, s, { cls, size: 11, anchor });
/* Disc radius that fits a short fg-lbl label (13px, about 8px a character). */
const gr = (t) => ({ 1: 11, 2: 14, 3: 16 })[[...t].length] || 16;
/* A label too long for a disc sits in a rounded box. */
const pillW = (t) => Math.round(8 * [...t].length + 12);
function group(p, t, kind = 'plain') {
  const n = [...t].length;
  if (n <= 3) return atom(p.x, p.y, t, { r: gr(t), kind, size: 13 });
  const w = pillW(t);
  const cls = kind === 'hi' ? 'fg-atom-hi' : kind === 'warn' ? 'fg-atom-warn' : 'fg-atom';
  return `<rect class="${cls}" x="${r2(p.x - w / 2)}" y="${r2(p.y - 13)}" width="${w}" height="26" rx="13"></rect>` +
    text(p.x, p.y + 4.6, t, { cls: 'fg-lbl', size: 13 });
}
/* How far a group's label reaches along a bond arriving at `deg`, for
   trimming: a disc's radius, or the distance to the edge of a pill. */
const reach = (t, deg = 90) => {
  if ([...t].length <= 3) return gr(t);
  const c = Math.abs(Math.cos(rad(deg))), s = Math.abs(Math.sin(rad(deg)));
  return Math.min(c > 0.01 ? (pillW(t) / 2) / c : 1e9, s > 0.01 ? 13 / s : 1e9);
};
/* A labelled group hung off an unlabelled skeletal vertex. */
function hang(v, deg, t, o = {}) {
  const len = o.len ?? (reach(t, deg) + 22);
  const p = at(v, deg, len);
  return bond(v, p, { rFrom: 0, rTo: reach(t, deg) }) + group(p, t, o.kind);
}
/* A skeletal methyl: a bare line, as a skeletal drawing shows it. */
const stub = (v, deg, len = 36) => { const e = at(v, deg, len); return { s: sk(v, e), e }; };
/* The teal dot that marks a candidate carbon. */
const dot = (p) => `<circle class="fg-fill-hi" cx="${r2(p.x)}" cy="${r2(p.y)}" r="4.6"></circle>`;
/* A zigzag through the given x positions; `up` says whether the first
   vertex is the raised one. */
const chain = (xs, y, dy, upFirst) => xs.map((x, i) => P(x, y + (((i % 2 === 0) === upFirst) ? -dy : dy)));
const bonds = (pts) => pts.slice(1).map((p, i) => sk(pts[i], p)).join('');

/* ----------------------------------------------------- two-alcohols ---
   Butan-2-ol against propan-2-ol: the first example on the page. */
FIGURES.push({
  id: 'two-alcohols',
  section: 'stereocenters',
  lessons: ['stereocenters'],
  anchor: 'Two of its four groups are the same.</p>',
  alt: 'Two skeletal structures, one above the other. Top: butan-2-ol. Its C2 is marked and carries an OH, an H, a CH3 group on one side and a CH2CH3 group on the other, four different groups, so C2 is a stereocenter. Bottom: propan-2-ol. Its C2 carries an OH, an H and a CH3 group on each side, so two of its groups are the same and C2 is not a stereocenter.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    /* butan-2-ol */
    s += tg(170, 18, 'butan-2-ol');
    const b = chain([100, 135, 170, 205], 92, 10, false); // C1 low, C2 high
    s += bonds(b);
    s += hang(b[1], 60, 'OH') + hang(b[1], 120, 'H');
    s += dot(b[1]) + tg(b[1].x, b[1].y + 22, 'C2', 'fg-tag-mut');
    s += tg(b[0].x - 8, b[0].y + 4, 'CH₃', 'fg-tag', 'end');
    s += tg(b[3].x - 14, b[3].y + 34, 'CH₂CH₃', 'fg-tag', 'middle');
    s += tg(170, 142, 'four different groups: C2 is a stereocenter', 'fg-tag-good');
    s += rule(20, 156, 320, 156);
    /* propan-2-ol */
    s += tg(170, 178, 'propan-2-ol');
    const p = chain([135, 170, 205], 252, 10, false);
    s += bonds(p);
    s += hang(p[1], 60, 'OH') + hang(p[1], 120, 'H');
    s += dot(p[1]) + tg(p[1].x, p[1].y + 22, 'C2', 'fg-tag-mut');
    s += tg(p[0].x - 8, p[0].y + 4, 'CH₃', 'fg-tag-warn', 'end');
    s += tg(p[2].x + 8, p[2].y + 4, 'CH₃', 'fg-tag-warn', 'start');
    s += tg(170, 292, 'two CH₃ groups: C2 is not a stereocenter', 'fg-tag-warn');
    return s;
  },
  caption: 'Find the four groups on each marked carbon, then look for a repeat.',
});

/* --------------------------------------------------------- swap-test ---
   Why four different groups matter: swap two and see whether turning the
   start molecule reproduces the result. The slots are schematic. Turning a
   tetrahedral carbon half a turn about the axis that bisects two of its
   bonds swaps those two groups and also swaps the other two, so "start,
   turned" is the start with top<->left and wedge<->hash exchanged. */
function tetra(c, g) {
  // g: { top, left, wedge, hash }
  let s = '';
  const arms = [
    ['top', 90, 'plain'], ['left', 200, 'plain'], ['wedge', 340, 'wedge'], ['hash', 270, 'hash'],
  ];
  for (const [k, deg, kind] of arms) {
    const t = g[k];
    const len = 13 + 20 + reach(t, deg);
    const p = at(c, deg, len);
    const o = { rFrom: 13, rTo: reach(t, deg) };
    s += kind === 'wedge' ? wedge(c, p, { ...o, width: 9 }) : kind === 'hash' ? hash(c, p, { ...o, width: 10, rungs: 4 }) : bond(c, p, o);
    s += group(p, t);
  }
  s += atom(c.x, c.y, 'C', { r: 13, size: 13 });
  return s;
}
FIGURES.push({
  id: 'swap-test',
  section: 'stereocenters',
  anchor: 'because the two methyl groups can stand in for each other.</p>',
  alt: 'Two rows of three three-dimensional drawings. Top row, the C2 of butan-2-ol: the start, with OH at the top, H at the left, CH3 on a wedge and CH2CH3 on a hash; the same carbon after swapping OH and H; and the start turned half a turn, which puts H at the top and OH at the left but moves CH2CH3 onto the wedge and CH3 onto the hash. The last two differ, so the swap made a new stereoisomer. Bottom row, the C2 of propan-2-ol, drawn the same way with two CH3 groups: after the swap and after the half turn the drawings match, so the swap gave back the same molecule.',
  viewBox: '0 0 520 400',
  build() {
    let s = '';
    const cols = [90, 260, 430];
    const block = (Y, name, start, verdict, good) => {
      let g = tg(12, Y + 14, name, 'fg-tag', 'start');
      const heads = ['start', 'swap OH and H', 'start, turned'];
      const swapped = { ...start, top: start.left, left: start.top };
      const turned = { top: start.left, left: start.top, wedge: start.hash, hash: start.wedge };
      [start, swapped, turned].forEach((m, i) => {
        g += tg(cols[i], Y + 38, heads[i], 'fg-tag-mut');
        g += tetra(P(cols[i], Y + 106), m);
      });
      g += tg(260, Y + 186, verdict, good ? 'fg-tag-good' : 'fg-tag-warn');
      return g;
    };
    s += block(0, 'butan-2-ol, C2', { top: 'OH', left: 'H', wedge: 'CH₃', hash: 'CH₂CH₃' },
      'last two differ: a new stereoisomer', true);
    s += rule(20, 200, 500, 200);
    s += block(204, 'propan-2-ol, C2', { top: 'OH', left: 'H', wedge: 'CH₃', hash: 'CH₃' },
      'last two match: the same molecule', false);
    return s;
  },
  caption: 'In each row, compare the second drawing with the third. The third is the start turned half a turn, which brings H to the top and OH to the left.',
});

/* ---------------------------------------------------- trace-outward ---
   3-methylhexane: ethyl against propyl, compared one carbon at a time. */
FIGURES.push({
  id: 'trace-outward',
  section: 'stereocenters',
  lessons: ['stereocenters'],
  anchor: 'while the propyl group has a second CH₂.</p>',
  alt: 'Skeletal structure of 3-methylhexane with C3 marked. C3 carries an H, a CH3 group, an ethyl branch to the left and a propyl branch to the right. The carbons of each branch are numbered outward from C3. The first carbon out is CH2 in both branches, a tie. The second carbon out is CH3 in the ethyl branch and CH2 in the propyl branch, so the branches differ and C3 is a stereocenter.',
  viewBox: '0 0 340 250',
  build() {
    let s = '';
    s += tg(170, 18, '3-methylhexane');
    const c = chain([72, 112, 152, 192, 232, 272], 90, 12, false); // C1 low
    s += bonds(c);
    const me = stub(c[2], 240, 34);
    s += me.s + tg(me.e.x - 4, me.e.y + 16, 'CH₃');
    s += hang(c[2], 300, 'H', { len: 34 });
    s += dot(c[2]) + tg(c[2].x, c[2].y - 16, 'C3', 'fg-tag-mut');
    /* steps outward, numbered */
    s += tg(c[1].x, c[1].y + 24, '1') + tg(c[0].x, c[0].y - 14, '2');
    s += tg(c[3].x, c[3].y + 24, '1') + tg(c[4].x, c[4].y - 14, '2') + tg(c[5].x, c[5].y + 24, '3');
    s += tg(92, 56, 'ethyl', 'fg-tag-good') + tg(232, 56, 'propyl', 'fg-tag-good');
    /* the comparison */
    s += tg(40, 176, 'carbon 1 out:', 'fg-tag-mut', 'start');
    s += tg(140, 176, 'CH₂ and CH₂', 'fg-tag', 'start');
    s += tg(236, 176, 'tie', 'fg-tag-mut', 'start');
    s += tg(40, 200, 'carbon 2 out:', 'fg-tag-mut', 'start');
    s += tg(140, 200, 'CH₃ and CH₂', 'fg-tag', 'start');
    s += tg(236, 200, 'different', 'fg-tag-good', 'start');
    s += tg(170, 234, 'C3 is a stereocenter', 'fg-tag-good');
    return s;
  },
  caption: 'Follow the numbers outward from C3 along each branch and compare them in pairs.',
});

/* ------------------------------------------------------- scan-hexenol ---
   A whole-molecule scan of 5-methylhex-1-en-3-ol: a first pass that rules
   carbons out, then the four groups on each carbon left over. */
function hexenol(Y) {
  const c = chain([56, 96, 136, 176, 216, 256], Y, 12, false); // C1 low, C2 high
  let s = skDouble(c[0], c[1], P(c[1].x, c[1].y + 30)) + bonds(c.slice(1));
  const me = stub(c[4], 300, 34);
  s += me.s;
  s += hang(c[2], 240, 'OH', { len: 38 }) + hang(c[2], 300, 'H', { len: 34 });
  s += hang(c[4], 240, 'H', { len: 34 });
  return { s, c, me: me.e };
}
FIGURES.push({
  id: 'scan-hexenol',
  section: 'stereocenters',
  lessons: ['stereocenters'],
  anchor: 'and two methyl groups, so it fails.</p>',
  alt: 'Three copies of the skeletal structure of 5-methylhex-1-en-3-ol, one above the other. First pass: C1 and C2 are marked sp2, C4 is marked CH2, and C6 and the methyl on C5 are marked CH3, so only C3 and C5 are left. Second copy: C3 carries OH, H, a CH=CH2 group and a CH2CH(CH3)2 group, four different groups, so C3 is a stereocenter. Third copy: C5 carries H, a CH3 group, a second CH3 group and a CH2CH(OH)CH=CH2 group, so two groups are the same and C5 is not a stereocenter.',
  viewBox: '0 0 340 452',
  build() {
    let s = '';
    /* first pass */
    s += tg(12, 18, 'first pass: rule carbons out', 'fg-tag', 'start');
    let m = hexenol(64);
    s += m.s;
    s += tg(m.c[0].x - 4, m.c[0].y + 22, 'sp²', 'fg-tag-mut');
    s += tg(m.c[1].x, m.c[1].y - 14, 'sp²', 'fg-tag-mut');
    s += tg(m.c[3].x, m.c[3].y - 14, 'CH₂', 'fg-tag-mut');
    s += tg(m.c[5].x, m.c[5].y - 14, 'CH₃', 'fg-tag-mut');
    s += tg(m.me.x + 6, m.me.y + 16, 'CH₃', 'fg-tag-mut');
    for (const i of [2, 4]) s += dot(m.c[i]) + tg(m.c[i].x, m.c[i].y - 16, 'C' + (i + 1), 'fg-tag');
    s += rule(20, 140, 320, 140);

    /* C3 */
    s += tg(12, 162, 'C3: its four groups', 'fg-tag', 'start');
    m = hexenol(210);
    s += m.s + dot(m.c[2]) + tg(m.c[2].x, m.c[2].y - 16, 'C3', 'fg-tag-mut');
    s += tg(m.c[0].x + 10, m.c[1].y - 16, 'CH=CH₂', 'fg-tag');
    s += tg(m.c[4].x, m.c[3].y - 16, 'CH₂CH(CH₃)₂', 'fg-tag');
    s += tg(170, 282, 'four different groups: a stereocenter', 'fg-tag-good');
    s += rule(20, 294, 320, 294);

    /* C5 */
    s += tg(12, 316, 'C5: its four groups', 'fg-tag', 'start');
    m = hexenol(364);
    s += m.s + dot(m.c[4]) + tg(m.c[4].x, m.c[4].y - 16, 'C5', 'fg-tag-mut');
    s += tg(m.c[1].x + 10, m.c[1].y - 16, 'CH₂CH(OH)CH=CH₂', 'fg-tag');
    s += tg(m.c[5].x + 10, m.c[5].y - 16, 'CH₃', 'fg-tag-warn');
    s += tg(m.me.x + 6, m.me.y + 16, 'CH₃', 'fg-tag-warn');
    s += tg(170, 444, 'two CH₃ groups: not a stereocenter', 'fg-tag-warn');
    return s;
  },
  caption: 'Top: every carbon with a reason beside it is out. Below: the two marked carbons, each with its four groups named.',
});

/* ---------------------------------------------------- walk-both-ways ---
   A ring carbon's two ring bonds are two groups; walk each way round. */
function ringPanel(Y, meAt, walks) {
  let s = '';
  const c = P(170, Y + 104);
  const R = 34;
  // vertex i at angle 90 - 60i: C1 top, then clockwise
  const v = Array.from({ length: 6 }, (_, i) => at(c, 90 - 60 * i, R));
  s += v.map((p, i) => sk(p, v[(i + 1) % 6])).join('');
  /* the walks, as dashed arcs outside the ring */
  for (const w of walks) {
    const a0 = rad(w.from), a1 = rad(w.to), rr = 50;
    const p0 = at(c, w.from, rr), p1 = at(c, w.to, rr);
    const sweep = w.to < w.from ? 1 : 0;
    const large = Math.abs(w.to - w.from) > 180 ? 1 : 0;
    s += `<path class="fg-dash-hi" d="M${r2(p0.x)} ${r2(p0.y)} A${rr} ${rr} 0 ${large} ${sweep} ${r2(p1.x)} ${r2(p1.y)}"></path>`;
    const lp = at(c, w.labelAt, 64);
    s += tg(lp.x, lp.y + 4, w.label, w.cls, w.anchor);
    void a0; void a1;
  }
  s += hang(v[0], 60, 'OH', { len: 34 }) + hang(v[0], 120, 'H', { len: 32 });
  const m = stub(v[meAt], 90 - 60 * meAt, 32);
  s += m.s;
  const mt = at(c, 90 - 60 * meAt, R + 32 + 14);
  s += tg(mt.x, mt.y + 4, 'CH₃');
  for (let i = 0; i < 6; i++) {
    const q = at(c, 90 - 60 * i, R - 14);
    s += tg(q.x, q.y + 4, String(i + 1), 'fg-tag-mut');
  }
  s += dot(v[0]);
  return s;
}
FIGURES.push({
  id: 'walk-both-ways',
  section: 'stereocenters',
  lessons: ['stereocenters'],
  anchor: 'so C1 is not a stereocenter.</p>',
  alt: 'Two skeletal cyclohexane rings, one above the other, with the ring carbons numbered 1 to 6 and C1 at the top carrying OH and H. Top: 3-methylcyclohexan-1-ol. A dashed path runs from C1 clockwise and reaches the methyl-bearing carbon after two carbons; a second dashed path runs the other way and reaches it after four. The paths differ, so C1 is a stereocenter. Bottom: 4-methylcyclohexan-1-ol. Both dashed paths reach the methyl-bearing carbon after three carbons, so the paths match and C1 is not a stereocenter.',
  viewBox: '0 0 340 434',
  build() {
    let s = '';
    s += tg(12, 18, '3-methylcyclohexan-1-ol', 'fg-tag', 'start');
    s += ringPanel(0, 2, [
      { from: 72, to: -15, label: '2 carbons', labelAt: 30, cls: 'fg-tag-good', anchor: 'start' },
      { from: 108, to: 315, label: '4 carbons', labelAt: 190, cls: 'fg-tag-warn', anchor: 'end' },
    ]);
    s += tg(170, 196, 'the walks differ: C1 is a stereocenter', 'fg-tag-good');
    s += rule(20, 210, 320, 210);
    s += tg(12, 232, '4-methylcyclohexan-1-ol', 'fg-tag', 'start');
    s += ringPanel(214, 3, [
      { from: 72, to: -72, label: '3 carbons', labelAt: 10, cls: 'fg-tag-mut', anchor: 'start' },
      { from: 108, to: 252, label: '3 carbons', labelAt: 170, cls: 'fg-tag-mut', anchor: 'end' },
    ]);
    s += tg(170, 424, 'the walks match: C1 is not a stereocenter', 'fg-tag-warn');
    return s;
  },
  caption: 'Start at C1 and follow each dashed path until it reaches the carbon that carries the CH₃ group.',
});

/* ------------------------------------------------------ other-units ---
   Stereoisomers with no stereocenter: a C=C and a 1,4-disubstituted ring. */
function butene(cx, cy, cis) {
  const L = P(cx - 20, cy), Rr = P(cx + 20, cy);
  let s = skDouble(L, Rr, P(cx, cy + 20));
  const lMe = at(L, 120, 34), rMe = at(Rr, cis ? 60 : 300, 34);
  s += sk(L, lMe) + sk(Rr, rMe);
  s += hang(L, 240, 'H', { len: 30 }) + hang(Rr, cis ? 300 : 60, 'H', { len: 30 });
  s += tg(lMe.x - 4, lMe.y - 8, 'CH₃', 'fg-tag') + tg(rMe.x + 4, rMe.y + (cis ? -8 : 18), 'CH₃', 'fg-tag');
  return s;
}
function flatRing(cx, cy, down) {
  const c = P(cx, cy), R = 30;
  const v = Array.from({ length: 6 }, (_, i) => at(c, 90 - 60 * i, R));
  let s = v.map((p, i) => sk(p, v[(i + 1) % 6])).join('');
  const oh = at(v[0], 90, 34);
  s += wedge(v[0], oh, { rFrom: 0, rTo: 14, width: 9 }) + group(oh, 'OH');
  const me = at(v[3], 270, 36);
  s += (down ? hash(v[3], me, { rFrom: 0, rTo: 16, width: 10, rungs: 4 }) : wedge(v[3], me, { rFrom: 0, rTo: 16, width: 9 })) + group(me, 'CH₃');
  return s;
}
FIGURES.push({
  id: 'other-units',
  section: 'stereocenters',
  anchor: 'so the two never interconvert.</p>',
  alt: 'Top: two skeletal structures of but-2-ene. In cis-but-2-ene both CH3 groups are on the upper side of the double bond; in trans-but-2-ene one is above and one below. Bottom: two flat hexagon drawings of 4-methylcyclohexan-1-ol with OH on a wedge at the top carbon. In the cis isomer the CH3 at the bottom carbon is also on a wedge, on the same face as the OH; in the trans isomer it is on a hash, on the opposite face.',
  viewBox: '0 0 340 390',
  build() {
    let s = '';
    s += tg(12, 18, 'but-2-ene', 'fg-tag', 'start');
    s += butene(88, 88, true) + butene(252, 88, false);
    s += `<text class="fg-tag-mut" x="88" y="156" text-anchor="middle" font-size="11"><tspan font-style="italic">cis</tspan>: same side</text>`;
    s += `<text class="fg-tag-mut" x="252" y="156" text-anchor="middle" font-size="11"><tspan font-style="italic">trans</tspan>: opposite sides</text>`;
    s += rule(20, 174, 320, 174);
    s += tg(12, 196, '4-methylcyclohexan-1-ol', 'fg-tag', 'start');
    s += flatRing(88, 280, false) + flatRing(252, 280, true);
    s += `<text class="fg-tag-mut" x="88" y="378" text-anchor="middle" font-size="11"><tspan font-style="italic">cis</tspan>: same face</text>`;
    s += `<text class="fg-tag-mut" x="252" y="378" text-anchor="middle" font-size="11"><tspan font-style="italic">trans</tspan>: opposite faces</text>`;
    return s;
  },
  caption: 'Each pair has the same bonds. Only the side, or the face of the ring, that the groups sit on is different.',
});

/* ------------------------------------------------ four-stereoisomers ---
   3-chlorobutan-2-ol: two stereocenters, each wedge or hash, four ways. */
function chlorobutanol(cx, cy, oh, cl) {
  const c = chain([cx - 54, cx - 18, cx + 18, cx + 54], cy, 11, false); // C1 low, C2 high
  let s = bonds(c);
  const o = at(c[1], 90, 36), l = at(c[2], 270, 36);
  s += (oh === 'w' ? wedge(c[1], o, { rFrom: 0, rTo: 14, width: 9 }) : hash(c[1], o, { rFrom: 0, rTo: 14, width: 10, rungs: 4 })) + group(o, 'OH');
  s += (cl === 'w' ? wedge(c[2], l, { rFrom: 0, rTo: 14, width: 9 }) : hash(c[2], l, { rFrom: 0, rTo: 14, width: 10, rungs: 4 })) + group(l, 'Cl');
  s += dot(c[1]) + dot(c[2]);
  return s;
}
FIGURES.push({
  id: 'four-stereoisomers',
  section: 'stereocenters',
  lessons: ['stereocenters'],
  anchor: 'That makes 2 × 2 = 4 stereoisomers.</p>',
  alt: 'Four skeletal structures of 3-chlorobutan-2-ol in a two-by-two grid, with the stereocenters C2 and C3 marked. Top row: OH wedge with Cl wedge, and OH hash with Cl hash; these two are mirror images. Bottom row: OH wedge with Cl hash, and OH hash with Cl wedge; these two are also mirror images. A drawing in the top row and a drawing in the bottom row are not mirror images.',
  viewBox: '0 0 340 374',
  build() {
    let s = '';
    s += tg(170, 18, '3-chlorobutan-2-ol');
    const rows = [[100, 'w', 'w', 'h', 'h'], [258, 'w', 'h', 'h', 'w']];
    for (const [cy, a, b, c, d] of rows) {
      s += chlorobutanol(88, cy, a, b) + chlorobutanol(252, cy, c, d);
      s += tg(170, cy + 5, '⟷', 'fg-tag-mut');
      s += tg(170, cy + 76, 'mirror images', 'fg-tag-good');
    }
    s += rule(20, 190, 320, 190);
    s += tg(170, 362, 'top row and bottom row: not mirror images', 'fg-tag-warn');
    return s;
  },
  caption: 'Read the wedge or hash on each marked carbon. Each row is one pair of mirror images.',
});

/* ------------------------------------------------ nitrogen-inversion ---
   An amine nitrogen turning inside out. In the side view the three groups
   sit below the nitrogen, one in the page (left), one behind (hash), one in
   front (wedge). Inversion reflects each group through the horizontal plane
   of the nitrogen, so front stays front and back stays back. */
function ell(cx, cy, rx, ry, cls) {
  return `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}"></ellipse>`;
}
FIGURES.push({
  id: 'nitrogen-inversion',
  section: 'stereocenters',
  anchor: 'This flip is called <b>nitrogen inversion</b>.</p>',
  alt: 'Three drawings of an amine nitrogen with three different groups, R1, R2 and R3. Left: pyramidal, with the three groups below the nitrogen and its lone pair pointing up. Middle: the planar transition state, with all three groups level with the nitrogen and the lone pair in a p orbital whose two lobes point up and down. Right: pyramidal again, turned inside out, with the three groups above the nitrogen and the lone pair pointing down. R2 stays on a hash and R3 on a wedge throughout.',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    const Y = 140;
    const pyramid = (cx, flip) => {
      const n = P(cx, Y);
      const f = (d) => (flip ? -d : d);
      const a = at(n, f(205), 50), b = at(n, f(335), 50), c = at(n, f(262), 54);
      let g = bond(n, a, { rFrom: 16, rTo: 15 });
      g += hash(n, b, { rFrom: 16, rTo: 15, width: 10, rungs: 4 });
      g += wedge(n, c, { rFrom: 16, rTo: 15, width: 9 });
      g += atom(a.x, a.y, 'R¹', { r: 15, size: 13 }) + atom(b.x, b.y, 'R²', { r: 15, size: 13 }) + atom(c.x, c.y, 'R³', { r: 15, size: 13 });
      g += atom(n.x, n.y, 'N', { kind: 'hi', size: 13 });
      const lp = flip ? 270 : 90;
      g += `<circle class="fg-lp" cx="${cx - 4.5}" cy="${r2(Y + (flip ? 26 : -26))}" r="2.6"></circle><circle class="fg-lp" cx="${cx + 4.5}" cy="${r2(Y + (flip ? 26 : -26))}" r="2.6"></circle>`;
      void lp;
      return g;
    };
    s += pyramid(120, false);
    s += tg(120, 240, 'pyramidal', 'fg-tag-good');
    s += tg(120, 258, 'lone pair up', 'fg-tag-mut');

    /* transition state: groups level with N, lone pair in a vertical p orbital */
    const n = P(380, Y);
    s += ell(380, Y - 34, 11, 24, 'fg-orb') + ell(380, Y + 34, 11, 24, 'fg-orb-alt');
    const a = at(n, 180, 54), b = at(n, 22, 52), c = at(n, -30, 54);
    s += bond(n, a, { rFrom: 16, rTo: 15 });
    s += hash(n, b, { rFrom: 16, rTo: 15, width: 10, rungs: 4 });
    s += wedge(n, c, { rFrom: 16, rTo: 15, width: 9 });
    s += atom(a.x, a.y, 'R¹', { r: 15, size: 13 }) + atom(b.x, b.y, 'R²', { r: 15, size: 13 }) + atom(c.x, c.y, 'R³', { r: 15, size: 13 });
    s += atom(n.x, n.y, 'N', { kind: 'warn', size: 13 });
    s += tg(362, Y - 54, 'lone pair in', 'fg-tag-mut', 'end') + tg(362, Y - 38, 'a p orbital', 'fg-tag-mut', 'end');
    s += tg(380, 240, 'flat transition state', 'fg-tag-warn');
    s += tg(380, 258, 'all three groups level with N', 'fg-tag-mut');

    s += pyramid(640, true);
    s += tg(640, 240, 'pyramidal, turned inside out', 'fg-tag-good');
    s += tg(640, 258, 'lone pair down', 'fg-tag-mut');

    for (const [x1, x2] of [[222, 262], [498, 538]]) {
      s += arrow(P(x1, Y - 8), P(x2, Y - 8), { muted: true });
      s += arrow(P(x2, Y + 8), P(x1, Y + 8), { muted: true });
    }
    s += tg(380, 22, 'R¹, R² and R³ are three different carbon groups');
    return s;
  },
  caption: 'Watch R² stay behind the page and R³ stay in front of it while all three groups swing from below the nitrogen to above it.',
});

/* ===================================================== lesson only ===== */

/* 3-methylpentane, for the guided question. */
FIGURES.push({
  id: 'l-methylpentane',
  lessons: ['stereocenters'],
  alt: 'Skeletal structure of 3-methylpentane with C3 marked. C3 carries an H, a CH3 group, a CH2CH3 branch to the left and a CH2CH3 branch to the right.',
  viewBox: '0 0 340 130',
  build() {
    let s = '';
    s += tg(170, 18, '3-methylpentane');
    const c = chain([90, 130, 170, 210, 250], 86, 12, true); // C1 high, C3 high
    s += bonds(c);
    const me = stub(c[2], 60, 34);
    s += me.s + tg(me.e.x + 8, me.e.y - 6, 'CH₃', 'fg-tag', 'start');
    s += hang(c[2], 120, 'H', { len: 32 });
    s += dot(c[2]) + tg(c[2].x, c[2].y + 24, 'C3', 'fg-tag-mut');
    s += tg(110, 116, 'CH₂CH₃', 'fg-tag') + tg(230, 116, 'CH₂CH₃', 'fg-tag');
    return s;
  },
  caption: 'The marked carbon and its four groups.',
});

/* 4-methylhexan-2-ol, for the independent question. Two copies, one per
   candidate, so each carbon's four groups can be named without crowding. */
function methylhexanol(Y) {
  const c = chain([56, 96, 136, 176, 216, 256], Y, 12, false); // C1 low, C2 high
  let s = bonds(c);
  s += hang(c[1], 60, 'OH', { len: 36 }) + hang(c[1], 120, 'H', { len: 32 });
  const me = stub(c[3], 60, 34);
  s += me.s;
  s += hang(c[3], 120, 'H', { len: 32 });
  return { s, c, me: me.e };
}
FIGURES.push({
  id: 'l-scan-quiz',
  lessons: ['stereocenters'],
  alt: 'Two copies of the skeletal structure of 4-methylhexan-2-ol. Top copy: C2 is marked; it carries OH, H, a CH3 group and a CH2CH(CH3)CH2CH3 group. Bottom copy: C4 is marked; it carries H, a CH3 group, a CH2CH3 group and a CH2CH(OH)CH3 group.',
  viewBox: '0 0 340 312',
  build() {
    let s = '';
    s += tg(170, 18, '4-methylhexan-2-ol');
    s += tg(12, 40, 'C2: its four groups', 'fg-tag', 'start');
    let m = methylhexanol(112);
    s += m.s + dot(m.c[1]) + tg(m.c[1].x, m.c[1].y + 24, 'C2', 'fg-tag-mut');
    s += tg(m.c[0].x - 8, m.c[0].y + 4, 'CH₃', 'fg-tag', 'end');
    s += tg(206, 152, 'CH₂CH(CH₃)CH₂CH₃');
    s += rule(20, 166, 320, 166);
    s += tg(12, 188, 'C4: its four groups', 'fg-tag', 'start');
    m = methylhexanol(258);
    s += m.s + dot(m.c[3]) + tg(m.c[3].x, m.c[3].y + 24, 'C4', 'fg-tag-mut');
    s += tg(m.me.x + 8, m.me.y - 4, 'CH₃', 'fg-tag', 'start');
    s += tg(88, 298, 'CH₂CH(OH)CH₃') + tg(246, 298, 'CH₂CH₃');
    return s;
  },
  caption: 'Compare the four groups on each marked carbon.',
});

/* 3-methylcyclohexan-1-ol, for the final question: both candidates marked,
   ring numbered, no walks drawn (drawing them is the question). */
FIGURES.push({
  id: 'l-final-ring',
  lessons: ['stereocenters'],
  alt: 'Skeletal structure of 3-methylcyclohexan-1-ol with the ring carbons numbered 1 to 6. C1 at the top carries OH and H. C3 at the lower right carries a CH3 group and an H. Both C1 and C3 are marked.',
  viewBox: '0 0 340 196',
  build() {
    let s = '';
    s += tg(170, 18, '3-methylcyclohexan-1-ol');
    const c = P(170, 124), R = 36;
    const v = Array.from({ length: 6 }, (_, i) => at(c, 90 - 60 * i, R));
    s += v.map((p, i) => sk(p, v[(i + 1) % 6])).join('');
    s += hang(v[0], 60, 'OH', { len: 34 }) + hang(v[0], 120, 'H', { len: 32 });
    const me = stub(v[2], 0, 34);
    s += me.s + tg(me.e.x + 6, me.e.y + 4, 'CH₃', 'fg-tag', 'start');
    s += hang(v[2], 300, 'H', { len: 32 });
    for (let i = 0; i < 6; i++) {
      const q = at(c, 90 - 60 * i, R - 15);
      s += tg(q.x, q.y + 4, String(i + 1), 'fg-tag-mut');
    }
    s += dot(v[0]) + dot(v[2]);
    return s;
  },
  caption: 'Both marked carbons carry an H, one group outside the ring and two ring bonds.',
});

export default FIGURES;
