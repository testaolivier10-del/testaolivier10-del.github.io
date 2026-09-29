/* Figures for the conformational-analysis notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* Chair helpers, copied from scripts/ochem-figures/ring-flips.mjs with the
   measured geometry unchanged. Index 0, the far-right carbon, is the headrest
   (the up end); index 3, the far-left carbon, is the footrest (the down end).
   Axial is vertical: up on the even carbons, down on the odd ones.
   The flipped chair reverses every height, so its outline is the first one
   reflected top to bottom. A plain reflection would also reverse the
   direction the carbons run round the ring, which for a chiral compound
   draws the mirror-image molecule, so the two ends keep their places and the
   four middle carbons trade places in pairs (SIG, as in ring-flips.mjs). The
   result is the same molecule, numbered the same way round. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];
const SIG = (j) => (6 - j) % 6;
const src = (j, flipped) => (flipped ? SIG(j) : j);
const ring = (cx, cy, k, flipped = false, mirror = false) =>
  [0, 1, 2, 3, 4, 5].map((j) => {
    const v = CHAIR_V[src(j, flipped)];
    return P(cx + (mirror ? -v.x : v.x) * k, cy + (flipped ? -v.y : v.y) * k);
  });
const chairRing = (pts, cls) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');
const axUp = (i, flipped) => (i % 2 === 0) !== flipped;
const axEnd = (pts, i, flipped, L) => P(pts[i].x, pts[i].y + (axUp(i, flipped) ? -L : L));
const eqEnd = (pts, i, flipped, L, mirror = false) => {
  const e = CHAIR_EQ[src(i, flipped)];
  return P(pts[i].x + (mirror ? -1 : 1) * e.x * L, pts[i].y + (flipped ? -1 : 1) * e.y * L);
};
/* The bond a group on a given face must use: the axial bond if that carbon's
   axial points to that face, the equatorial bond otherwise. Placing by face
   and reading the label afterwards is the method the page teaches. */
const onFace = (i, flipped, face) => (axUp(i, flipped) === (face === 'up') ? 'ax' : 'eq');

const f2 = (v) => (Math.round(v * 100) / 100).toString();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SIZE = { 'fg-lbl': 13, 'fg-tag': 11, 'fg-tag-warn': 11, 'fg-tag-good': 11, 'fg-tag-mut': 11 };
/* Text with *italic* spans, for cis, trans and tert. */
function rich(x, y, s, cls = 'fg-tag', anchor = 'middle') {
  const body = esc(s).replace(/\*([^*]+)\*/g, '<tspan font-style="italic">$1</tspan>');
  return `<text class="${cls}" x="${f2(x)}" y="${f2(y)}" text-anchor="${anchor}" font-size="${SIZE[cls] || 11}">${body}</text>`;
}

/* A substituent: a bond from the ring carbon and a labelled disc or pill at
   its end. Long labels get a pill so the text stays inside it. */
function group(from, end, lab, kind = 'plain', cls = 'fg-bond') {
  const n = [...lab].length;
  if (n <= 3) {
    const r = n === 1 ? 11 : n === 2 ? 14 : 17;
    return bond(from, end, { rFrom: 0, rTo: r, cls }) + atom(end.x, end.y, lab, { kind, r });
  }
  const hw = n * 4.2 + 7, hh = 12;
  const dx = from.x - end.x, dy = from.y - end.y, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const t = Math.min(ux ? hw / Math.abs(ux) : 1e9, uy ? hh / Math.abs(uy) : 1e9);
  const stop = P(end.x + ux * t, end.y + uy * t);
  const rc = kind === 'plain' ? 'fg-atom' : `fg-atom-${kind}`;
  return bond(from, stop, { rFrom: 0, rTo: 0, cls }) +
    `<rect class="${rc}" x="${f2(end.x - hw)}" y="${f2(end.y - hh)}" width="${f2(2 * hw)}" height="${f2(2 * hh)}" rx="${hh}"></rect>` +
    `<text class="fg-lbl" x="${f2(end.x)}" y="${f2(end.y + 4.5)}" text-anchor="middle" font-size="13">${esc(lab)}</text>`;
}

/* One chair with its groups. g: { i, face, lab, kind, L }. hs: axial
   hydrogens to show, { i }. Returns the ink and the group ends, so a figure
   can draw a contact line between two of them. */
function drawChair(cx, cy, k, flipped, groups, opts = {}) {
  const pts = ring(cx, cy, k, flipped, opts.mirror);
  let s = '';
  if (opts.stubs) {
    for (let i = 0; i < 6; i++) s += bond(pts[i], axEnd(pts, i, flipped, 16), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
  }
  s += chairRing(pts);
  for (const p of pts) s += atom(p.x, p.y, '', { kind: 'point' });
  const ends = [];
  for (const h of opts.hs || []) {
    const e = axEnd(pts, h.i, flipped, h.L || 26);
    s += group(pts[h.i], e, 'H', h.kind || 'warn');
  }
  for (const g of groups) {
    const pos = onFace(g.i, flipped, g.face);
    const e = pos === 'ax' ? axEnd(pts, g.i, flipped, g.L || 36) : eqEnd(pts, g.i, flipped, g.L || 36, opts.mirror);
    ends.push({ e, pos, g });
    s += group(pts[g.i], e, g.lab, g.kind || (pos === 'ax' ? 'warn' : 'hi'), 'fg-bond-hi');
  }
  /* Ring-carbon numbers go in the emptiest direction at that carbon: away
     from the sum of every bond drawn there. */
  const used = (i) => {
    const v = [pts[(i + 1) % 6], pts[(i + 5) % 6]];
    for (const h of opts.hs || []) if (h.i === i) v.push(axEnd(pts, i, flipped, 20));
    for (const { e, g } of ends) if (g.i === i) v.push(e);
    if (opts.stubs) v.push(axEnd(pts, i, flipped, 16));
    return v;
  };
  for (const [i, t, dx, dy] of opts.locants || []) {
    if (dy !== undefined) { s += text(pts[i].x + dx, pts[i].y + dy, t, { cls: 'fg-tag', size: 11 }); continue; }
    const R = 20;
    let sx = 0, sy = 0;
    for (const q of used(i)) {
      const dx = q.x - pts[i].x, dy = q.y - pts[i].y, l = Math.hypot(dx, dy) || 1;
      sx += dx / l; sy += dy / l;
    }
    const l = Math.hypot(sx, sy) || 1;
    s += text(pts[i].x - (sx / l) * R, pts[i].y - (sy / l) * R + 4, t, { cls: 'fg-tag', size: 11 });
  }
  return { s, pts, ends };
}

/* A dashed contact line between two group discs, with its label. */
function contact(a, b, lab, lx, ly, cls = 'fg-tag-warn', trimA = 18, trimB = 18) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const p1 = P(a.x + ux * trimA, a.y + uy * trimA), p2 = P(b.x - ux * trimB, b.y - uy * trimB);
  return `<line class="fg-dash-hi" x1="${f2(p1.x)}" y1="${f2(p1.y)}" x2="${f2(p2.x)}" y2="${f2(p2.y)}"></line>` +
    rich(lx, ly, lab, cls);
}

/* Two chairs of one compound with the flip between them: side by side for
   the notes (760 wide), stacked for a lesson card (340 wide). Each side is
   { flipped, groups, hs, locants, extra(ends, pts), lines: [[text, cls]] }. */
function pairFigure(layout, { title, A, B, verdict }) {
  const wide = layout === 'wide';
  const W = wide ? 760 : 340, k = wide ? 0.85 : 0.8;
  let s = '';
  let y = 24;
  for (const t of [].concat(title)) { s += rich(W / 2, y, t, 'fg-tag'); y += 18; }
  const draw = (side, cx, cy) => {
    const c = drawChair(cx, cy, k, side.flipped, side.groups, side);
    let out = c.s;
    if (side.extra) out += side.extra(c.ends, c.pts);
    const low = Math.max(...c.pts.map((q) => q.y), ...c.ends.map(({ e }) => e.y + 17));
    let ly = Math.max(low + 30, cy + 70);
    for (const [t, cls] of side.lines) { out += rich(cx, ly, t, cls || 'fg-lbl'); ly += 19; }
    return { out, bottom: ly - 19 };
  };
  if (wide) {
    const cy = y + 96;
    const a = draw(A, 186, cy), b = draw(B, 574, cy);
    s += a.out + b.out;
    s += arrow(P(345, cy - 8), P(415, cy - 8));
    s += arrow(P(415, cy + 8), P(345, cy + 8));
    s += text(380, cy - 22, 'ring flip', { cls: 'fg-tag', size: 11 });
    let vy = Math.max(a.bottom, b.bottom) + 30;
    for (const [t, cls] of verdict || []) { s += rule(200, vy - 22, 560, vy - 22); s += rich(380, vy, t, cls || 'fg-lbl'); vy += 19; }
    return { s, viewBox: `0 0 ${W} ${Math.round((verdict && verdict.length ? vy - 19 : Math.max(a.bottom, b.bottom)) + 16)}` };
  }
  /* Measure each chair first so the stack sits tight around what it holds. */
  const extent = (side) => {
    const c = drawChair(0, 0, k, side.flipped, side.groups, side);
    const ys = [...c.pts.map((q) => q.y), ...c.ends.map(({ e }) => e.y - 17), ...c.ends.map(({ e }) => e.y + 17)];
    for (const h of side.hs || []) ys.push(axEnd(c.pts, h.i, side.flipped, h.L || 26).y - 11);
    return { top: Math.min(...ys), bottom: Math.max(...ys) };
  };
  const eA = extent(A), eB = extent(B);
  const cyA = y + 8 - eA.top;
  const a = draw(A, 165, cyA);
  const ay = a.bottom + 14;
  s += a.out;
  s += arrow(P(158, ay), P(158, ay + 34));
  s += arrow(P(182, ay + 34), P(182, ay));
  s += text(196, ay + 21, 'ring flip', { cls: 'fg-tag', size: 11, anchor: 'start' });
  const cyB = ay + 34 + 14 - eB.top;
  const b = draw(B, 165, cyB);
  s += b.out;
  let vy = b.bottom + 30;
  for (const [t, cls] of verdict || []) { s += rich(170, vy, t, cls || 'fg-lbl'); vy += 19; }
  if (verdict && verdict.length) s += rule(40, b.bottom + 12, 300, b.bottom + 12);
  return { s, viewBox: `0 0 ${W} ${Math.round((verdict && verdict.length ? vy - 19 : b.bottom) + 16)}` };
}

/* Several figures come in a notes copy and a stacked lesson copy. */
function both(def, spec) {
  const wide = pairFigure('wide', spec), stack = pairFigure('stack', spec);
  return [
    { ...def, viewBox: wide.viewBox, build: () => wide.s },
    { id: 'l-' + def.id, lessons: ['conformational-analysis'], alt: def.alt, viewBox: stack.viewBox,
      build: () => stack.s, caption: def.lessonCaption || def.caption },
  ];
}

/* A Newman projection, copied from scripts/ochem-figures/newman.mjs. Angles
   are degrees clockwise from straight up. */
function newman(cx, cy, r, front, back) {
  const at = (a, R) => P(cx + R * Math.sin(a * Math.PI / 180), cy - R * Math.cos(a * Math.PI / 180));
  let s = '';
  for (const [a, lab, cls] of back) {
    const p1 = at(a, r), p2 = at(a, r + 21), p3 = at(a, r + 36);
    s += `<line class="fg-bond-soft" x1="${f2(p1.x)}" y1="${f2(p1.y)}" x2="${f2(p2.x)}" y2="${f2(p2.y)}"></line>`;
    s += text(p3.x, p3.y + 4.5, lab, { cls: cls || 'fg-lbl', size: 13 });
  }
  s += `<circle class="fg-atom" cx="${cx}" cy="${cy}" r="${r}"></circle>`;
  for (const [a, lab, cls] of front) {
    const p2 = at(a, r), p3 = at(a, r + 15);
    s += `<line class="fg-bond" x1="${cx}" y1="${cy}" x2="${f2(p2.x)}" y2="${f2(p2.y)}"></line>`;
    s += text(p3.x, p3.y + 4.5, lab, { cls: cls || 'fg-lbl', size: 13 });
  }
  s += `<circle class="fg-lp-mut" cx="${cx}" cy="${cy}" r="4.5"></circle>`;
  return s;
}

const FIGURES = [];
const Me = 'CH₃';

/* ---- methylcyclohexane: the two chairs and the 95:5 split ------------- */
FIGURES.push(...both({
  id: 'ca-methyl-chairs',
  section: 'conformational-analysis',
  anchor: '<h3>One substituent: equatorial wins</h3>',
  alt: 'Methylcyclohexane in its two chairs. Left: the methyl group sits on an equatorial bond pointing out from the ring; about 95 percent of molecules. Right: the methyl group sits on an axial bond pointing straight up, beside the axial hydrogens on C3 and C5, which point up on the same face; about 5 percent.',
  caption: 'The same molecule in its two chairs. The methyl never changes face; only its axial or equatorial label changes.',
  lessonCaption: 'Methylcyclohexane in its two chairs.',
}, {
  title: 'methylcyclohexane',
  A: {
    flipped: true, groups: [{ i: 0, face: 'up', lab: Me }],
    locants: [[0, 'C1']],
    lines: [['CH₃ EQUATORIAL', 'fg-tag-good'], ['about 95% of molecules']],
  },
  B: {
    flipped: false, groups: [{ i: 0, face: 'up', lab: Me }], hs: [{ i: 2 }, { i: 4, L: 22 }],
    locants: [[0, 'C1'], [2, 'C3'], [4, 'C5']],
    lines: [['CH₃ AXIAL', 'fg-tag-warn'], ['about 5% of molecules'], ['next to axial H on C3 and C5', 'fg-tag']],
  },
  verdict: [['A-value of CH₃: 1.7 kcal/mol']],
}));

/* ---- which pairs can both be equatorial --------------------------------- */
function facePattern(layout) {
  const wide = layout === 'wide';
  const k = wide ? 0.62 : 0.72;
  const cases = [
    { name: '1,2 pair', j: 1, jl: 'C2', verdict: 'opposite faces: *trans*', cls: 'fg-tag-warn' },
    { name: '1,3 pair', j: 2, jl: 'C3', verdict: 'same face: *cis*', cls: 'fg-tag-good' },
    { name: '1,4 pair', j: 3, jl: 'C4', verdict: 'opposite faces: *trans*', cls: 'fg-tag-warn' },
  ];
  const face = (i) => (axUp(i, false) ? 'down' : 'up');
  let s = '';
  const H = 214;
  cases.forEach((c, n) => {
    const cx = wide ? 127 + n * 253 : 170, top = wide ? 0 : n * H;
    const cy = top + 104;
    s += rich(cx, top + 24, `${c.name}: both groups equatorial`, 'fg-tag');
    const ch = drawChair(cx, cy, k, false,
      [{ i: 0, face: face(0), lab: Me, L: 34 }, { i: c.j, face: face(c.j), lab: Me, L: c.j === 1 ? 42 : 34 }],
      { stubs: true, locants: [[0, 'C1', 16, -14], c.j === 1 ? [1, 'C2', -16, 20] : c.j === 3 ? [3, 'C4', -16, 18] : [c.j, c.jl]] });
    s += ch.s;
    for (const { e, g } of ch.ends) {
      const above = g.i !== 0;
      s += text(e.x, e.y + (above ? -24 : 32), g.face, { cls: g.face === 'up' ? 'fg-tag-good' : 'fg-tag-warn', size: 11 });
    }
    s += rich(cx, cy + 92, c.verdict, c.cls);
    if (n < 2) s += wide ? rule(cx + 126, 40, cx + 126, 200) : rule(30, top + H - 8, 310, top + H - 8);
  });
  return { s, viewBox: wide ? '0 0 760 212' : `0 0 340 ${3 * H - 14}` };
}
{
  const w = facePattern('wide'), st = facePattern('stack');
  const alt = 'Three chairs, each with two methyl groups on equatorial bonds and faint axial stubs on every carbon that alternate up, down, up around the ring. On a 1,2 pair the two equatorial methyls tilt down and up, opposite faces, so trans. On a 1,3 pair both tilt down, the same face, so cis. On a 1,4 pair they tilt down and up again, so trans.';
  FIGURES.push({
    id: 'ca-face-pattern', section: 'conformational-analysis', anchor: '<h3>Two substituents: first find out which chairs are possible</h3>',
    alt, viewBox: w.viewBox, build: () => w.s,
    caption: 'The faint stubs are the axial directions, alternating round the ring. Each equatorial bond tilts the opposite way from its carbon\'s stub, and the tag says which face it is on.',
  });
  FIGURES.push({
    id: 'l-ca-face-pattern', lessons: ['conformational-analysis'], alt, viewBox: st.viewBox, build: () => st.s,
    caption: 'Faint stubs: the alternating axial directions.',
  });
}

/* ---- cis-1-tert-butyl-4-methyl: the arithmetic alone decides ------------ */
const tBu = 'C(CH₃)₃';
FIGURES.push(...both({
  id: 'ca-cis-14',
  section: 'conformational-analysis',
  anchor: '<h3>Add up the axial penalties</h3>',
  alt: 'cis-1-tert-butyl-4-methylcyclohexane in its two chairs, both groups on the upper face. Left: tert-butyl axial and methyl equatorial, axial penalty 4.9 kcal/mol. Right: tert-butyl equatorial and methyl axial, axial penalty 1.7 kcal/mol. The right chair wins by 3.2 kcal/mol.',
  caption: 'Both groups stay on the upper face through the flip. Each chair pays for whichever group is axial.',
  lessonCaption: 'Each chair pays for its axial group.',
}, {
  title: '*cis*-1-*tert*-butyl-4-methylcyclohexane',
  A: {
    flipped: false, groups: [{ i: 0, face: 'up', lab: tBu }, { i: 3, face: 'up', lab: Me }],
    locants: [[0, 'C1'], [3, 'C4']],
    lines: [['*tert*-BUTYL AXIAL', 'fg-tag-warn'], ['penalty 4.9 kcal/mol']],
  },
  B: {
    flipped: true, groups: [{ i: 0, face: 'up', lab: tBu, L: 44 }, { i: 3, face: 'up', lab: Me }],
    locants: [[0, 'C1'], [3, 'C4']],
    lines: [['METHYL AXIAL', 'fg-tag-good'], ['penalty 1.7 kcal/mol']],
  },
  verdict: [['methyl-axial chair wins by 3.2 kcal/mol']],
}));

/* ---- trans-1,2-dimethyl: ee with one gauche contact, or aa ------------- */
FIGURES.push(...both({
  id: 'ca-trans-12',
  section: 'conformational-analysis',
  anchor: '<h3>When the two groups touch each other</h3>',
  alt: 'trans-1,2-dimethylcyclohexane in its two chairs. Left: both methyls equatorial, the C1 methyl tilting down and the C2 methyl tilting up; a dashed line between them marks their gauche contact, 0.9 kcal/mol. Right: both methyls axial, C1 pointing straight down and C2 straight up, axial penalty 1.7 plus 1.7, 3.4 kcal/mol.',
  caption: 'The dashed line marks the gauche contact between the two equatorial methyls.',
  lessonCaption: 'Dashed line: the gauche contact.',
}, {
  title: '*trans*-1,2-dimethylcyclohexane',
  A: {
    flipped: false, groups: [{ i: 0, face: 'down', lab: Me }, { i: 1, face: 'up', lab: Me }],
    locants: [[0, 'C1', 4, 30], [1, 'C2']],
    extra: (ends) => contact(ends[0].e, ends[1].e, 'gauche', ends[0].e.x + 10, ends[1].e.y - 8, 'fg-tag-warn', 18, 18),
    lines: [['BOTH EQUATORIAL (ee)', 'fg-tag-good'], ['gauche contact: 0.9 kcal/mol']],
  },
  B: {
    flipped: true, groups: [{ i: 0, face: 'down', lab: Me }, { i: 1, face: 'up', lab: Me }],
    locants: [[0, 'C1'], [1, 'C2']],
    lines: [['BOTH AXIAL (aa)', 'fg-tag-warn'], ['1.7 + 1.7 = 3.4 kcal/mol']],
  },
  verdict: [['ee wins by 3.4 − 0.9 = 2.5 kcal/mol']],
}));

/* The same two chairs sighted down C1–C2, so the 60° and 180° can be read. */
FIGURES.push({
  id: 'ca-trans-12-newman',
  section: 'conformational-analysis',
  anchor: '<h3>When the two groups touch each other</h3>',
  alt: 'Two Newman projections looking down the C1 to C2 bond of trans-1,2-dimethylcyclohexane, with the front carbon drawn the same in both. Left, the diequatorial chair: the front methyl and the back methyl are 60 degrees apart, gauche. Right, the diaxial chair: the back carbon has turned, and the two methyls are 180 degrees apart, anti. In both, the ring bonds to C6 and C3 are 60 degrees apart.',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    s += tag(380, 24, 'LOOKING DOWN THE C1–C2 BOND (C1 IN FRONT)');
    s += newman(190, 128, 36,
      [[0, 'H'], [120, Me, 'fg-lbl'], [240, 'C6']],
      [[180, 'H'], [60, Me, 'fg-lbl'], [300, 'C3']]);
    s += text(190, 240, 'ee CHAIR', { cls: 'fg-tag-good', size: 11 });
    s += text(190, 262, 'methyls 60° apart: gauche', { cls: 'fg-lbl', size: 13 });
    s += rule(380, 48, 380, 268);
    s += newman(570, 128, 36,
      [[0, 'H'], [120, Me], [240, 'C6']],
      [[180, 'C3'], [60, 'H'], [300, Me]]);
    s += text(570, 240, 'aa CHAIR', { cls: 'fg-tag-warn', size: 11 });
    s += text(570, 262, 'methyls 180° apart: anti', { cls: 'fg-lbl', size: 13 });
    return s;
  },
  caption: 'The front carbon is unchanged. The flip turns the back carbon, which moves the methyls from 60° apart to 180° apart; the ring carbons C6 and C3 stay 60° apart in both chairs.',
});

/* ---- cis-1,3-dimethyl: aa with a methyl/methyl contact, or ee ---------- */
FIGURES.push(...both({
  id: 'ca-cis-13',
  section: 'conformational-analysis',
  anchor: '<h3>When the two groups touch each other</h3>',
  alt: 'cis-1,3-dimethylcyclohexane in its two chairs. Left: both methyls axial and pointing up on the same face, with the axial hydrogen on C5 pointing up beside them; a dashed line joins the two methyls, marking a 3.7 kcal/mol contact; total about 5.5 kcal/mol. Right: both methyls equatorial, no axial group and no contact.',
  caption: 'The dashed line marks the methyl/methyl contact in the aa chair.',
  lessonCaption: 'Dashed line: the methyl/methyl contact.',
}, {
  title: '*cis*-1,3-dimethylcyclohexane',
  A: {
    flipped: false, groups: [{ i: 0, face: 'up', lab: Me }, { i: 2, face: 'up', lab: Me }], hs: [{ i: 4, L: 22 }],
    locants: [[0, 'C1'], [2, 'C3'], [4, 'C5']],
    extra: (ends) => contact(ends[1].e, ends[0].e, '3.7', (ends[0].e.x + ends[1].e.x) / 2, (ends[0].e.y + ends[1].e.y) / 2 - 12, 'fg-tag-warn', 18, 18),
    lines: [['BOTH AXIAL (aa)', 'fg-tag-warn'], ['3.7 + 0.9 + 0.9 ≈ 5.5 kcal/mol']],
  },
  B: {
    flipped: true, groups: [{ i: 0, face: 'up', lab: Me }, { i: 2, face: 'up', lab: Me }],
    locants: [[0, 'C1'], [2, 'C3']],
    lines: [['BOTH EQUATORIAL (ee)', 'fg-tag-good'], ['no axial group: 0']],
  },
  verdict: [['ee wins by about 5.5 kcal/mol']],
}));

/* ---- cis-1,2-dimethyl: a tie ------------------------------------------- */
FIGURES.push({
  ...both({
    id: 'ca-cis-12',
    section: 'conformational-analysis',
    anchor: '<h3>Comparing a cis isomer with its trans isomer</h3>',
    alt: 'cis-1,2-dimethylcyclohexane in its two chairs, both methyls on the upper face. Left: C1 methyl axial, C2 methyl equatorial. Right: C1 methyl equatorial, C2 methyl axial. Each chair carries 1.7 kcal/mol for the axial methyl plus 0.9 for the gauche contact, 2.6 in all, so the two chairs tie.',
    caption: 'Both methyls stay on the upper face, and one of them is axial in either chair.',
  }, {
    title: '*cis*-1,2-dimethylcyclohexane',
    A: {
      flipped: false, groups: [{ i: 0, face: 'up', lab: Me, L: 50 }, { i: 1, face: 'up', lab: Me, L: 30 }],
      locants: [[0, 'C1'], [1, 'C2']],
      lines: [['C1 AXIAL, C2 EQUATORIAL', 'fg-tag'], ['1.7 + 0.9 gauche = 2.6 kcal/mol']],
    },
    B: {
      flipped: true, groups: [{ i: 0, face: 'up', lab: Me }, { i: 1, face: 'up', lab: Me }],
      locants: [[0, 'C1'], [1, 'C2']],
      lines: [['C1 EQUATORIAL, C2 AXIAL', 'fg-tag'], ['1.7 + 0.9 gauche = 2.6 kcal/mol']],
    },
    verdict: [['a tie: the two chairs are equally populated']],
  })[0],
});

/* ---- the lesson's own question: cis-1-isopropyl-3-methyl ---------------- */
{
  const st = pairFigure('stack', {
    title: '*cis*-1-isopropyl-3-methylcyclohexane',
    A: {
      flipped: false, groups: [{ i: 2, face: 'up', lab: 'CH(CH₃)₂', L: 40 }, { i: 0, face: 'up', lab: Me }], hs: [{ i: 4, L: 22 }],
      locants: [[2, 'C1'], [0, 'C3'], [4, 'C5']],
      lines: [['BOTH AXIAL', 'fg-tag-warn']],
    },
    B: {
      flipped: true, groups: [{ i: 2, face: 'up', lab: 'CH(CH₃)₂', L: 56 }, { i: 0, face: 'up', lab: Me }],
      locants: [[2, 'C1'], [0, 'C3']],
      lines: [['BOTH EQUATORIAL', 'fg-tag-good']],
    },
  });
  FIGURES.push({
    id: 'l-ca-ipr-me-13', lessons: ['conformational-analysis'],
    alt: 'cis-1-isopropyl-3-methylcyclohexane in its two chairs. Top: the isopropyl and the methyl both axial, pointing up on the same face, beside the axial hydrogen on C5. Bottom: both groups equatorial.',
    viewBox: st.viewBox, build: () => st.s,
    caption: 'The two chairs of the question.',
  });
}

/* ---- beta-glucose: every large group equatorial ------------------------ */
FIGURES.push({
  id: 'ca-glucose',
  section: 'conformational-analysis',
  lessons: ['conformational-analysis'],
  anchor: '<h3>What carries forward</h3>',
  alt: 'beta-Glucose drawn as a chair: a six-membered ring of five carbons and one oxygen. The four OH groups, on C1 to C4, and the CH2OH group on C5 all sit on equatorial bonds; the five axial positions hold hydrogens.',
  viewBox: '0 0 340 262',
  build() {
    let s = '';
    s += rich(170, 22, 'β-glucose: every large group equatorial', 'fg-tag');
    /* Drawn as the usual picture of this sugar: the ring outline mirrored
       left to right, ring O at the back right, C1 the lowered right-hand
       tip, C4 the raised left-hand tip. */
    const k = 0.95, cx = 168, cy = 132;
    const pts = ring(cx, cy, k, false, true);
    const O = 2;
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      s += bond(pts[i], pts[j], { rFrom: i === O ? 11 : 0, rTo: j === O ? 11 : 0 });
    }
    for (let i = 0; i < 6; i++) if (i !== O) s += atom(pts[i].x, pts[i].y, '', { kind: 'point' });
    s += atom(pts[O].x, pts[O].y, 'O', { r: 11 });
    // ring vertex -> carbon number: O5 = 2, C1 = 3, C2 = 4, C3 = 5, C4 = 0, C5 = 1
    const subs = [[3, 'OH', 'C1'], [4, 'OH', 'C2'], [5, 'OH', 'C3'], [0, 'OH', 'C4'], [1, 'CH₂OH', 'C5']];
    for (const [i, lab] of subs) {
      s += bond(pts[i], axEnd(pts, i, false, i === 1 || i === 4 ? 16 : 20), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
      s += group(pts[i], eqEnd(pts, i, false, lab.length > 3 ? 44 : 34, true), lab, 'hi', 'fg-bond-hi');
    }
    const loc = { 3: [16, 18], 4: [-15, -12], 5: [15, 18], 0: [-15, -12], 1: [16, 14] };
    for (const [i, , c] of subs) s += text(pts[i].x + loc[i][0], pts[i].y + loc[i][1], c, { cls: 'fg-tag', size: 11 });
    s += text(170, 250, 'faint stubs: axial bonds, all to H', { cls: 'fg-tag-mut', size: 11 });
    return s;
  },
  caption: 'The four OH groups and the CH₂OH group all sit on equatorial bonds.',
});

export default FIGURES;
