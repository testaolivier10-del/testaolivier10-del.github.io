/* Figures for the alcohol-reactions notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions used throughout this module:
   - Chains are skeletal (this chapter comes long after skeletal structures).
     Heteroatoms, the H on a drawn stereocenter, and the groups on a drawn
     stereocenter carry labels.
   - A stereocenter is drawn with two in-plane bonds, one wedge and one hash.
     The starting orientation (X at 0 deg, Et at 120, CH3 wedge at 215, H
     hash at 268) is (S) when X outranks ethyl; the inverted one (X at 180,
     Et at 60, CH3 wedge at 325, H hash at 272) is then (R).
   - Lesson copies (id prefix l-) are at most 340 wide and use only fg-lbl
     and fg-tag text. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, P } from '../lib/ochem-figure.mjs';
import { zig, sk, benzene, locant, ringDouble } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- helpers */

/* A labeled stereocenter. arms: [{ deg, len, kind: 'bond'|'wedge'|'hash',
   label, r, key, atomKind }]. The center is a labeled C. */
function sc(c, arms, opts = {}) {
  let g = '';
  const ends = {};
  for (const a of arms) {
    const e = armEnd(c, a.deg, a.len ?? 46);
    const r = a.r ?? (a.label.length > 2 ? 18 : a.label.length > 1 ? 15 : 12);
    const bo = { rFrom: 15, rTo: r, cls: a.cls };
    g += a.kind === 'wedge' ? wedge(c, e, { ...bo, width: 9 })
       : a.kind === 'hash' ? hash(c, e, { ...bo, width: 10, rungs: 5 })
       : bond(c, e, bo);
    g += atom(e.x, e.y, a.label, { r, kind: a.atomKind || 'plain' });
    ends[a.key || a.label] = e;
  }
  g += atom(c.x, c.y, 'C', { kind: opts.ckind || 'warn' });
  return { g, ends };
}

const START = (x, xr, xkind, xdeg = 0) => [
  { deg: xdeg, len: 60, label: x, r: xr, key: 'x', atomKind: xkind || 'hi' },
  { deg: 120, len: 44, label: 'Et', r: 15 },
  { deg: 215, len: 46, kind: 'wedge', label: 'CH₃', r: 18 },
  { deg: 268, len: 42, kind: 'hash', label: 'H', r: 12 },
];
const INVERTED = (x, xr, xkind) => [
  { deg: 180, len: 60, label: x, r: xr, key: 'x', atomKind: xkind || 'hi' },
  { deg: 60, len: 44, label: 'Et', r: 15 },
  { deg: 325, len: 46, kind: 'wedge', label: 'CH₃', r: 18 },
  { deg: 272, len: 42, kind: 'hash', label: 'H', r: 12 },
];

/* A free halide ion with four lone pairs and a minus sign. `face` is the
   direction (deg, counterclockwise from east) of the pair the arrow starts
   from. Returns that arrow's start point. */
function halide(x, y, lbl, face = 0) {
  let g = atom(x, y, lbl, { kind: 'hi' });
  for (const d of [face, face + 90, face + 180, face + 270]) g += lonePair(x, y, -d, { dist: 23 });
  const sgn = armEnd(P(x, y), face + 135, 31);
  g += text(sgn.x, sgn.y + 5, '−', { cls: 'fg-tag-warn', size: 15 });
  return { g, from: armEnd(P(x, y), face, 29) };
}

/* A curved arrow from the middle of bond a–b to atom b (radius rB): the
   bond's pair moving onto b. side (+1/−1) picks which side it bows to. */
function bondToAtom(a, b, rB, side = 1, t = 0.45) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, px = -uy * side, py = ux * side;
  const start = P(a.x + dx * t + px * 6, a.y + dy * t + py * 6);
  const end = P(b.x - ux * (rB + 3) * 0.5 + px * (rB + 3) * 0.87, b.y - uy * (rB + 3) * 0.5 + py * (rB + 3) * 0.87);
  return curve(start, end, { bow: 12 * side });
}

/* A curved arrow from the middle of bond a1–a2 to the middle of bond b1–b2. */
function bondToBond(a1, a2, b1, b2, off1, off2, bow) {
  const s = P((a1.x + a2.x) / 2 + off1.x, (a1.y + a2.y) / 2 + off1.y);
  const e = P((b1.x + b2.x) / 2 + off2.x, (b1.y + b2.y) / 2 + off2.y);
  return curve(s, e, { bow });
}

const chain4 = (x0, y0) => zig(x0, y0, 4, 38, 22);
const skChain = (pts) => pts.slice(1).map((p, i) => sk(pts[i], p)).join('');
const plusAt = (x, y) => text(x, y, '+', { cls: 'fg-tag-warn', size: 16 });
const num = (x, y, v, lesson) => text(x, y, v, { cls: lesson ? 'fg-tag' : 'fg-sm' });

/* 3,3-Dimethylbutane skeleton, C1 low, C2 high, C3 low, C4 high.
   opts.moved: one methyl has moved from C3 to C2 (drawn at meDeg on C2).
   opts.hiMe: highlight the C3 methyl that is about to move. */
function dmb(x0, y0, opts = {}) {
  const p = chain4(x0, y0);
  let g = skChain(p);
  if (!opts.moved) g += sk(p[2], P(p[2].x, p[2].y - 44), opts.hiMe);
  else g += sk(p[1], armEnd(p[1], opts.meDeg ?? 90, 44), true);
  g += sk(p[2], P(p[2].x, p[2].y + 44));
  if (opts.nums) {
    const L = opts.lesson;
    g += num(p[0].x - 8, p[0].y + 20, '1', L);
    g += num(p[1].x, p[1].y + 24, '2', L);
    if (opts.moved) g += num(p[2].x - 16, p[2].y + 26, '3', L);
    else g += num(p[2].x + 14, p[2].y + 22, '3', L);
    g += num(p[3].x + 14, p[3].y + 4, '4', L);
  }
  return { g, p };
}

/* ============================================================ NOTES ===== */

/* ---------------------------------------------------------------- 1 ---
   The problem and the three ways round it. Replaces the hand-written "two
   ways to activate" SVG and the old three-row figure, which showed nearly
   the same thing a few lines apart. */
FIGURES.push({
  id: 'alcohol-activation',
  section: 'alcohol-reactions',
  alt: 'Four rows. Top: an alcohol with bromide gives no reaction, because hydroxide, pKaH 15.7, would have to leave. Then three fixes: strong acid protonates the OH so that water, pKaH −1.7, leaves; TsCl and pyridine make the tosylate, which leaves as the tosylate ion, pKaH −2.8, without touching the C–O bond; SOCl2 or PBr3 turn the alcohol into the alkyl chloride or bromide in one flask.',
  viewBox: '0 0 760 380',
  build() {
    let s = '';
    const row = (y, left, reagent, sub, right, notes, opts = {}) => {
      let g = label(92, y + 4, left, { size: 14 });
      g += arrow(P(160, y), P(262, y), { muted: !!opts.blocked });
      if (opts.blocked) {
        g += bond(P(202, y - 14), P(220, y + 14), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
        g += bond(P(220, y - 14), P(202, y + 14), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
      }
      if (reagent) g += text(211, y - 14, reagent, { cls: 'fg-sm' });
      if (sub) g += text(211, y + 22, sub, { cls: 'fg-sm' });
      g += label(344, y + 4, right, { size: 14 });
      notes.forEach((n, i) => { g += text(446, y - 12 + i * 18, n.t, { cls: n.cls || 'fg-sm', anchor: 'start' }); });
      return g;
    };
    s += tag(36, 30, 'AS IT STANDS', { anchor: 'start', cls: 'fg-tag-warn' });
    s += row(64, 'R–OH + Br⁻', '', '', 'no reaction', [
      { t: 'HO⁻ would have to leave:' },
      { t: 'pKaH 15.7, a strong base', cls: 'fg-tag-warn' },
    ], { blocked: true });
    s += rule(30, 104, 730, 104);
    s += tag(36, 128, 'THREE FIXES', { anchor: 'start' });
    s += row(164, 'R–OH', 'H₂SO₄ or HBr', 'strong acid', 'R–OH₂⁺', [
      { t: 'what leaves is water:' },
      { t: 'pKaH −1.7', cls: 'fg-tag-good' },
      { t: 'cost: acid everywhere, and a cation can form' },
    ]);
    s += row(248, 'R–OH', 'TsCl, pyridine', 'mild base', 'R–OTs', [
      { t: 'what leaves is the tosylate ion:' },
      { t: 'pKaH −2.8', cls: 'fg-tag-good' },
      { t: 'the C–O bond is not touched' },
    ]);
    s += row(332, 'R–OH', 'SOCl₂ or PBr₃', 'one flask', 'R–Cl or R–Br', [
      { t: 'the OH is activated and replaced' },
      { t: 'no strong acid, no cation', cls: 'fg-tag-good' },
    ]);
    return s;
  },
  caption: 'Every fix changes what has to leave. The R group is the same in every row.',
});

/* ---------------------------------------------------------------- 2 ---
   The three sulfonate esters, drawn out. Shared by the notes and the lesson,
   so it is 340 wide and uses only fg-lbl / fg-tag text. */
FIGURES.push({
  id: 'sulfonate-esters',
  section: 'alcohol-reactions',
  lessons: ['alcohol-reactions'],
  alt: 'Three sulfonate esters stacked. Tosylate: R–O–S with two S=O bonds, the sulfur bonded to a benzene ring that carries a CH3 on the far side. Mesylate: the same R–O–SO2 group with CH3 on sulfur. Triflate: the same with CF3 on sulfur.',
  viewBox: '0 0 340 430',
  build() {
    let s = '';
    const core = (y, tagText) => {
      let g = tag(16, y - 62, tagText, { anchor: 'start' });
      const r = P(34, y), o = P(88, y), sS = P(142, y);
      g += bond(r, o) + bond(o, sS);
      g += bond(sS, P(142, y - 42), { order: 2, rTo: 13 }) + atom(142, y - 42, 'O', { r: 13 });
      g += bond(sS, P(142, y + 42), { order: 2, rTo: 13 }) + atom(142, y + 42, 'O', { r: 13 });
      g += atom(r.x, r.y, 'R') + atom(o.x, o.y, 'O', { kind: 'hi' }) + atom(sS.x, sS.y, 'S', { kind: 'warn' });
      return g;
    };
    let y = 86;
    s += core(y, 'TOSYLATE · R–OTs');
    const ring = benzene(222, y, 26, { rot: 0 });
    s += ring.svg;
    s += bond(P(142, y), ring.pts[3], { rFrom: 15, rTo: 0 });
    const me = P(ring.pts[0].x + 40, y);
    s += bond(ring.pts[0], me, { rFrom: 0, rTo: 18 }) + atom(me.x, me.y, 'CH₃', { r: 18 });
    y = 228;
    s += core(y, 'MESYLATE · R–OMs');
    s += bond(P(142, y), P(206, y), { rTo: 18 }) + atom(206, y, 'CH₃', { r: 18 });
    y = 370;
    s += core(y, 'TRIFLATE · R–OTf');
    s += bond(P(142, y), P(206, y), { rTo: 18 }) + atom(206, y, 'CF₃', { r: 18, kind: 'warn' });
    s += tag(282, y + 4, 'most reactive', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The three sulfonate esters. Only the group on sulfur changes; the R–O–SO₂ part is the same in all three.',
});

/* ---------------------------------------------------------------- 3 ---
   HX: SN1 at a tertiary carbon, SN2 at a primary one. */
FIGURES.push({
  id: 'hx-sn1-sn2',
  section: 'alcohol-reactions',
  alt: 'Two rows. Top, tertiary: in protonated 2-methylpropan-2-ol one curved arrow moves the C–O bond pair onto oxygen and water leaves, giving a tertiary carbocation; a lone pair of chloride then bonds to the cation, giving 2-chloro-2-methylpropane. Bottom, primary: bromide attacks C1 of protonated butan-1-ol from the side opposite the oxygen while the C–O bond pair moves onto oxygen, in one step, giving 1-bromobutane and water.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';
    const tb = (c, arms) => arms.map((d) => sk(c, armEnd(c, d, 42))).join('');
    s += tag(24, 30, 'TERTIARY · SN1: WATER LEAVES FIRST, THEN CHLORIDE ARRIVES', { anchor: 'start' });
    const c1 = P(110, 160);
    s += tb(c1, [210, 330, 270]);
    const o1 = P(c1.x, c1.y - 64);
    s += bond(c1, o1, { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' }) + atom(o1.x, o1.y, 'OH₂', { r: 17, kind: 'hi' });
    s += lonePair(o1.x, o1.y, 180, { dist: 24 });
    s += plusAt(o1.x + 25, o1.y - 12);
    s += bondToAtom(c1, o1, 17, 1);
    s += arrow(P(176, 150), P(236, 150), { muted: true });
    s += text(206, 136, '− H₂O', { cls: 'fg-sm' });
    const c2 = P(318, 150);
    s += tb(c2, [90, 210, 330]);
    s += plusAt(c2.x - 18, c2.y - 8);
    const cl = halide(c2.x + 104, c2.y + 4, 'Cl', 180);
    s += cl.g;
    s += curve(cl.from, P(c2.x + 8, c2.y - 3), { bow: 10 });
    s += text(330, 222, 'a 3° carbocation', { cls: 'fg-sm' });
    s += arrow(P(470, 150), P(530, 150), { muted: true });
    const c3 = P(630, 170);
    s += tb(c3, [210, 330, 270]);
    s += bond(c3, P(c3.x, c3.y - 50), { rFrom: 0, rTo: 15 }) + atom(c3.x, c3.y - 50, 'Cl', { kind: 'hi' });
    s += text(630, 236, '2-chloro-2-methylpropane', { cls: 'fg-tag-good' });

    s += rule(24, 256, 736, 256);
    s += tag(24, 284, 'PRIMARY · SN2: BROMIDE IN AS WATER GOES, ONE STEP', { anchor: 'start' });
    const pts = zig(150, 408, 4, 38, 22);
    s += skChain(pts);
    const cA = pts[3];
    const oA = armEnd(cA, 330, 58);
    s += bond(cA, oA, { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' }) + atom(oA.x, oA.y, 'OH₂', { r: 17, kind: 'hi' });
    s += lonePair(oA.x, oA.y, 70, { dist: 24 });
    s += plusAt(oA.x + 24, oA.y - 14);
    const bp = armEnd(cA, 145, 84);
    const br = halide(bp.x, bp.y, 'Br', 325);
    s += br.g;
    s += curve(br.from, P(cA.x - 5, cA.y - 5), { bow: 6 });
    s += bondToAtom(cA, oA, 17, 1);
    s += arrow(P(420, 400), P(480, 400), { muted: true });
    const q = zig(530, 418, 4, 38, 22);
    s += skChain(q);
    const qb = armEnd(q[3], 330, 50);
    s += bond(q[3], qb, { rFrom: 0, rTo: 15 }) + atom(qb.x, qb.y, 'Br', { kind: 'hi' });
    s += text(620, 458, '1-bromobutane + H₂O', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The same kind of reagent, two timings. Look at when the C–O bond breaks compared with when the halide arrives.',
});

/* ---------------------------------------------------------------- 4 ---
   SOCl2 and PBr3 at a stereocenter: what step 2 does in three dimensions,
   plus the SNi exception, drawn once. Step 1 of each is drawn in full on
   the Leaving groups page. */
FIGURES.push({
  id: 'halide-inversion',
  section: 'alcohol-reactions',
  alt: 'Three rows, each starting from (S)-butan-2-ol after step 1. Row 1, PBr3: the oxygen carries H, PBr2 and a positive charge; bromide attacks carbon from the side opposite the oxygen, giving (R)-2-bromobutane. Row 2, SOCl2 with pyridine: the oxygen carries S(=O)Cl; chloride attacks from the opposite side while the leaving group falls apart into SO2 and chloride, giving (R)-2-chlorobutane. Row 3, SOCl2 with no base: a lone pair on the chlorine bonded to sulfur attacks carbon from the same side as the oxygen, giving (S)-2-chlorobutane with retention.',
  viewBox: '0 0 760 640',
  build() {
    let s = '';
    s += text(380, 22, 'Each row starts from (S)-butan-2-ol after step 1. Et = CH₂CH₃.', { cls: 'fg-sm' });

    // ---- row 1: PBr3
    let Y = 40;
    s += tag(24, Y + 20, 'PBr₃', { anchor: 'start' });
    let c = P(200, Y + 100);
    let A = sc(c, START('O', 15));
    s += A.g;
    let o = A.ends.x;
    s += bond(o, P(o.x, o.y - 42), { rTo: 12 }) + atom(o.x, o.y - 42, 'H', { r: 12 });
    s += bond(o, P(o.x + 58, o.y), { rTo: 21 }) + atom(o.x + 58, o.y, 'PBr₂', { r: 21 });
    s += plusAt(o.x + 22, o.y - 20);
    s += lonePair(o.x, o.y, 90, { dist: 22 });
    let x = halide(c.x - 118, c.y, 'Br', 0);
    s += x.g;
    s += curve(x.from, P(c.x - 18, c.y - 2), { bow: -6 });
    s += bondToAtom(c, o, 15, -1);
    s += arrow(P(410, Y + 100), P(470, Y + 100), { muted: true });
    s += text(440, Y + 86, 'HO–PBr₂', { cls: 'fg-sm' });
    s += text(440, Y + 124, 'leaves', { cls: 'fg-sm' });
    let d = sc(P(610, Y + 100), INVERTED('Br', 15));
    s += d.g;
    s += text(610, Y + 176, '(R)-2-bromobutane · inverted', { cls: 'fg-tag-good' });
    s += rule(24, Y + 192, 736, Y + 192);

    // ---- row 2: SOCl2 with pyridine
    Y = 236;
    s += tag(24, Y + 20, 'SOCl₂, PYRIDINE', { anchor: 'start' });
    c = P(200, Y + 100);
    A = sc(c, START('O', 15));
    s += A.g;
    o = A.ends.x;
    const sA = P(o.x + 60, o.y);
    s += bond(o, sA) + atom(sA.x, sA.y, 'S', { kind: 'warn' });
    s += bond(sA, P(sA.x, sA.y - 44), { order: 2, rTo: 13 }) + atom(sA.x, sA.y - 44, 'O', { r: 13 });
    const clS = armEnd(sA, 330, 56);
    s += bond(sA, clS) + atom(clS.x, clS.y, 'Cl');
    s += lonePair(o.x, o.y, 270, { dist: 22 });
    s += lonePair(o.x, o.y, 90, { dist: 22 });
    x = halide(c.x - 118, c.y, 'Cl', 0);
    s += x.g;
    s += curve(x.from, P(c.x - 18, c.y - 2), { bow: -6 });
    s += curve(P(c.x + 30, c.y + 6), P((o.x + sA.x) / 2, o.y + 6), { bow: 62 });
    s += bondToAtom(sA, clS, 15, -1, 0.5);
    s += arrow(P(430, Y + 100), P(490, Y + 100), { muted: true });
    s += text(460, Y + 86, 'SO₂ + Cl⁻', { cls: 'fg-sm' });
    s += text(460, Y + 124, 'leave', { cls: 'fg-sm' });
    d = sc(P(620, Y + 100), INVERTED('Cl', 15));
    s += d.g;
    s += text(620, Y + 176, '(R)-2-chlorobutane · inverted', { cls: 'fg-tag-good' });
    s += rule(24, Y + 192, 736, Y + 192);

    // ---- row 3: SOCl2, no base (SNi)
    Y = 432;
    s += tag(24, Y + 20, 'SOCl₂, NO BASE (SNi)', { anchor: 'start' });
    c = P(200, Y + 110);
    A = sc(c, START('O', 15, 'hi', 40));
    s += A.g;
    o = A.ends.x;
    const s3 = P(o.x + 64, o.y + 4);
    s += bond(o, s3) + atom(s3.x, s3.y, 'S', { kind: 'warn' });
    const so = armEnd(s3, 50, 42);
    s += bond(s3, so, { order: 2, rTo: 13 }) + atom(so.x, so.y, 'O', { r: 13 });
    const cl3 = P(c.x + 84, c.y + 34);
    s += bond(s3, cl3) + atom(cl3.x, cl3.y, 'Cl', { kind: 'hi' });
    s += lonePair(o.x, o.y, 270, { dist: 22 });
    s += lonePair(o.x, o.y, 90, { dist: 22 });
    // the Cl pair that attacks faces C
    const toC = Math.atan2(-(c.y - cl3.y), c.x - cl3.x) * 180 / Math.PI;
    s += lonePair(cl3.x, cl3.y, -toC, { dist: 22 });
    const lpS = armEnd(cl3, toC, 28);
    s += curve(lpS, armEnd(c, -15, 19), { bow: -8 });
    s += curve(P((c.x + o.x) / 2 - 9, (c.y + o.y) / 2 - 9), P((o.x + s3.x) / 2 + 2, (o.y + s3.y) / 2 - 12), { bow: -40 });
    s += bondToAtom(s3, cl3, 15, -1, 0.5);
    s += arrow(P(430, Y + 110), P(490, Y + 110), { muted: true });
    s += text(460, Y + 96, '− SO₂', { cls: 'fg-sm' });
    d = sc(P(580, Y + 110), START('Cl', 15));
    s += d.g;
    s += text(620, Y + 190, '(S)-2-chlorobutane · retained', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Step 2 of each reagent at a stereocenter. Compare where the halogen ends up with where the oxygen was.',
});

/* ---------------------------------------------------------------- 5 ---
   The rearrangement trap: HBr against PBr3 on 3,3-dimethylbutan-2-ol. The
   full HBr mechanism, protonation included, is on the Carbocations page;
   this figure puts the two products side by side. */
function shiftFrames(x1, x2, y, lesson) {
  let s = '';
  const A = dmb(x1, y, { hiMe: true, nums: true, lesson });
  s += A.g;
  s += plusAt(A.p[1].x, A.p[1].y - 12);
  s += curve(P(A.p[2].x - 5, A.p[2].y - 30), P(A.p[1].x + 9, A.p[1].y - 8), { bow: 12 });
  const B = dmb(x2, y, { moved: true, nums: true, lesson });
  s += B.g;
  s += plusAt(B.p[2].x, B.p[2].y - 12);
  const bp = P(B.p[2].x + 80, B.p[2].y + 44);
  const br = halide(bp.x, bp.y, 'Br', 151);
  s += br.g;
  s += curve(br.from, P(B.p[2].x + 11, B.p[2].y + 6), { bow: -8 });
  return { s, A, B };
}

FIGURES.push({
  id: 'hbr-shift-vs-pbr3',
  section: 'alcohol-reactions',
  alt: 'Two rows, carbons numbered 1 to 4. Top, HBr: the secondary cation at C2, from 3,3-dimethylbutan-2-ol, with a curved arrow moving a methyl from C3 to C2; then the tertiary cation at C3 with bromide arriving; then 2-bromo-2,3-dimethylbutane, with bromine on the carbon that never held the OH. Bottom, PBr3: 3,3-dimethylbutan-2-ol goes straight to 3-bromo-2,2-dimethylbutane, bromine on the carbon that held the OH, skeleton unchanged.',
  viewBox: '0 0 760 482',
  build() {
    let s = '';
    s += tag(24, 28, 'HBr · THE CATION REARRANGES BEFORE BROMIDE ARRIVES', { anchor: 'start' });
    const F = shiftFrames(40, 290, 130, false);
    s += F.s;
    s += text(100, 222, '2° cation at C2', { cls: 'fg-tag-warn' });
    s += text(122, 240, 'a CH₃ moves from C3 with its pair', { cls: 'fg-sm' });
    s += arrow(P(200, 120), P(252, 120), { muted: true });
    s += text(360, 222, '3° cation at C3', { cls: 'fg-tag-good' });
    s += arrow(P(470, 120), P(522, 120), { muted: true });
    const C = dmb(560, 130, { moved: true });
    s += C.g;
    const brP = armEnd(C.p[2], 330, 46);
    s += bond(C.p[2], brP, { rFrom: 0, rTo: 15 }) + atom(brP.x, brP.y, 'Br', { kind: 'hi' });
    s += text(640, 222, '2-bromo-2,3-dimethylbutane', { cls: 'fg-tag-good' });
    s += text(640, 240, 'Br on a carbon that had no OH', { cls: 'fg-sm' });

    s += rule(24, 262, 736, 262);
    s += tag(24, 290, 'PBr₃ · NO CATION, SO NOTHING MOVES', { anchor: 'start' });
    const D = dmb(150, 392, { nums: true });
    s += D.g;
    const oD = P(D.p[1].x, D.p[1].y - 44);
    s += bond(D.p[1], oD, { rFrom: 0, rTo: 15 }) + atom(oD.x, oD.y, 'OH', { r: 15 });
    s += arrow(P(320, 382), P(420, 382), { muted: true });
    s += text(370, 368, 'PBr₃', { cls: 'fg-sm' });
    const E = dmb(500, 392);
    s += E.g;
    const brE = P(E.p[1].x, E.p[1].y - 44);
    s += bond(E.p[1], brE, { rFrom: 0, rTo: 15 }) + atom(brE.x, brE.y, 'Br', { kind: 'hi' });
    s += text(560, 452, '3-bromo-2,2-dimethylbutane', { cls: 'fg-tag-good' });
    s += text(560, 470, 'renumbered for the name: Br on C3', { cls: 'fg-sm' });
    return s;
  },
  caption: 'One alcohol, two reagents, two different bromides. Follow the highlighted methyl in the top row.',
});

/* ---------------------------------------------------------------- 6 ---
   Tosylate, then SN2: retention, then one inversion. */
function tosylInversion(stacked) {
  let s = '';
  if (!stacked) {
    const c1 = P(76, 116), c2 = P(400, 116), c3 = P(660, 116);
    s += sc(c1, START('OH', 15)).g;
    s += text(100, 196, '(S)-butan-2-ol', { cls: 'fg-tag' });
    s += arrow(P(164, 116), P(230, 116));
    s += text(196, 100, 'TsCl, pyridine', { cls: 'fg-sm' });
    s += text(196, 136, 'C–O untouched', { cls: 'fg-sm' });
    const T = sc(c2, START('OTs', 17));
    s += T.g;
    const br = halide(c2.x - 100, c2.y, 'Br', 0);
    s += br.g;
    s += text(c2.x - 100, c2.y + 48, 'from NaBr', { cls: 'fg-sm' });
    s += curve(br.from, P(c2.x - 18, c2.y - 2), { bow: -6 });
    s += bondToAtom(c2, T.ends.x, 17, -1);
    s += text(420, 196, '(S)-butan-2-yl tosylate', { cls: 'fg-tag' });
    s += arrow(P(496, 116), P(566, 116));
    s += text(531, 100, 'NaBr', { cls: 'fg-sm' });
    s += text(531, 136, 'SN2', { cls: 'fg-sm' });
    s += sc(c3, INVERTED('Br', 15)).g;
    s += text(650, 196, '(R)-2-bromobutane', { cls: 'fg-tag-good' });
    return s;
  }
  const c1 = P(150, 64), c2 = P(170, 250), c3 = P(190, 440);
  s += sc(c1, START('OH', 15)).g;
  s += tag(300, 58, '(S)', { anchor: 'middle' });
  s += arrow(P(150, 124), P(150, 172));
  s += tag(162, 154, 'TsCl, pyridine', { anchor: 'start' });
  const T = sc(c2, START('OTs', 17));
  s += T.g;
  const br = halide(c2.x - 108, c2.y, 'Br', 0);
  s += br.g;
  s += curve(br.from, P(c2.x - 18, c2.y - 2), { bow: -6 });
  s += bondToAtom(c2, T.ends.x, 17, -1);
  s += tag(302, 290, '(S)', { anchor: 'middle' });
  s += arrow(P(170, 314), P(170, 362));
  s += tag(182, 344, 'NaBr · SN2', { anchor: 'start' });
  s += sc(c3, INVERTED('Br', 15)).g;
  s += tag(300, 434, '(R)', { anchor: 'middle', cls: 'fg-tag-good' });
  return s;
}
FIGURES.push({
  id: 'tosylate-inversion',
  section: 'alcohol-reactions',
  alt: '(S)-butan-2-ol with the OH on the right, ethyl up-left, CH3 on a wedge and H on a hash. TsCl and pyridine give (S)-butan-2-yl tosylate with every group in the same place. Bromide then attacks carbon from the left, opposite the OTs, and the product is (R)-2-bromobutane with bromine on the left and the other three groups flipped.',
  viewBox: '0 0 760 214',
  build() { return tosylInversion(false); },
  caption: 'Two steps, one inversion. Only the second step touches the stereocenter.',
});

/* ---------------------------------------------------------------- 7 ---
   Acid-catalyzed dehydration of butan-2-ol, every step with its arrows. */
FIGURES.push({
  id: 'alcohol-e1-arrows',
  section: 'alcohol-reactions',
  alt: 'Four panels. 1: an oxygen lone pair of butan-2-ol takes a proton from sulfuric acid. 2: in the protonated alcohol, the C–O bond pair moves onto oxygen and water leaves, giving a secondary carbocation at C2. 3: a water molecule takes a hydrogen from C3, and the C3–H bond pair becomes the new pi bond between C2 and C3. 4: the products, but-2-ene as the major product and but-1-ene as the minor one.',
  viewBox: '0 0 760 560',
  build() {
    let s = '';
    s += rule(380, 24, 380, 536);
    s += rule(24, 280, 736, 280);

    // panel 1: protonation
    s += tag(24, 32, '1 · THE OH TAKES A PROTON', { anchor: 'start' });
    let p = chain4(90, 210);
    s += skChain(p);
    let o = P(p[1].x, p[1].y - 60);
    s += bond(p[1], o, { rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O', { kind: 'hi' });
    const oh = armEnd(o, 150, 38);
    s += bond(o, oh, { rTo: 12 }) + atom(oh.x, oh.y, 'H', { r: 12 });
    s += lonePair(o.x, o.y, -20, { dist: 22 });
    s += lonePair(o.x, o.y, 40, { dist: 22 });
    const h = P(o.x + 72, o.y - 38), a = P(h.x + 70, h.y);
    s += bond(h, a, { rFrom: 12, rTo: 28, cls: 'fg-bond-hi' });
    s += atom(h.x, h.y, 'H', { r: 12, kind: 'hi' }) + atom(a.x, a.y, 'OSO₃H', { r: 28 });
    const lp = armEnd(o, 20, 26);
    s += curve(lp, P(h.x - 11, h.y + 7), { bow: -10 });
    s += curve(P((h.x + a.x) / 2 - 4, h.y - 6), P(a.x - 18, a.y - 24), { bow: -14 });
    s += text(200, 256, 'conc. H₂SO₄, heat', { cls: 'fg-sm' });

    // panel 2: water leaves
    s += tag(400, 32, '2 · WATER LEAVES (SLOW STEP)', { anchor: 'start' });
    p = chain4(420, 210);
    s += skChain(p);
    o = P(p[1].x, p[1].y - 64);
    s += bond(p[1], o, { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' }) + atom(o.x, o.y, 'OH₂', { r: 17, kind: 'hi' });
    s += plusAt(o.x + 25, o.y - 12);
    s += lonePair(o.x, o.y, 180, { dist: 24 });
    s += bondToAtom(p[1], o, 17, 1);
    s += arrow(P(560, 190), P(606, 190), { muted: true });
    const q = chain4(626, 210);
    s += skChain(q);
    s += plusAt(q[1].x, q[1].y - 12);
    s += text(564, 256, 'a 2° carbocation at C2', { cls: 'fg-sm' });

    // panel 3: water takes a beta H
    s += tag(24, 312, '3 · WATER TAKES A β-HYDROGEN', { anchor: 'start' });
    p = chain4(100, 410);
    s += skChain(p);
    s += plusAt(p[1].x, p[1].y - 12);
    const hb = P(p[2].x, p[2].y + 46);
    s += bond(p[2], hb, { rFrom: 0, rTo: 12, cls: 'fg-bond-hi' }) + atom(hb.x, hb.y, 'H', { r: 12, kind: 'hi' });
    s += text(p[2].x + 12, p[2].y + 32, 'β', { cls: 'fg-tag' });
    const w = P(hb.x + 96, hb.y + 4);
    s += atom(w.x, w.y, 'OH₂', { r: 17 });
    s += lonePair(w.x, w.y, 180, { dist: 24 });
    s += lonePair(w.x, w.y, 90, { dist: 24 });
    s += curve(P(w.x - 30, w.y - 1), P(hb.x + 15, hb.y + 2), { bow: 12 });
    s += bondToBond(p[2], hb, p[1], p[2], P(-6, 0), P(-2, 8), -14);
    s += text(190, 516, 'the C3–H pair becomes the π bond', { cls: 'fg-sm' });

    // panel 4: products
    s += tag(400, 312, '4 · THE PRODUCTS', { anchor: 'start' });
    const m = chain4(430, 400);
    s += sk(m[0], m[1]) + ringDouble(m[1], m[2], P(m[1].x, m[1].y + 40)) + sk(m[2], m[3]);
    s += text(490, 440, 'but-2-ene · major', { cls: 'fg-tag-good' });
    const n = chain4(600, 400);
    s += ringDouble(n[0], n[1], P(n[0].x + 10, n[0].y + 40)) + sk(n[1], n[2]) + sk(n[2], n[3]);
    s += text(660, 440, 'but-1-ene · minor', { cls: 'fg-tag-mut' });
    s += text(564, 490, 'H lost from C3: 2 carbons on the C=C', { cls: 'fg-sm' });
    s += text(564, 508, 'H lost from C1: 1 carbon on the C=C', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Acid-catalyzed dehydration of butan-2-ol. Each arrow starts on a lone pair or a bond.',
});

/* ---------------------------------------------------------------- 8 ---
   Dehydration with a shift: 3,3-dimethylbutan-2-ol gives the tetrasubstituted
   alkene. */
FIGURES.push({
  id: 'dehydration-shift',
  section: 'alcohol-reactions',
  alt: 'Three frames, carbons numbered. The secondary cation at C2 of 3,3-dimethylbutan-2-ol, after the acid has protonated the OH and water has left, with a methyl moving from C3 to C2. The tertiary cation at C3, with a water molecule taking the hydrogen on C2 and that C–H pair becoming the C2=C3 bond. The product, 2,3-dimethylbut-2-ene, with four carbons on the double bond.',
  viewBox: '0 0 760 290',
  build() {
    let s = '';
    const A = dmb(40, 170, { hiMe: true, nums: true });
    s += A.g;
    s += plusAt(A.p[1].x, A.p[1].y - 12);
    s += curve(P(A.p[2].x - 5, A.p[2].y - 30), P(A.p[1].x + 9, A.p[1].y - 8), { bow: 12 });
    s += tag(100, 30, '2° CATION: A METHYL SHIFTS');
    s += text(120, 256, 'after the OH is protonated', { cls: 'fg-sm' });
    s += text(120, 274, 'and water leaves', { cls: 'fg-sm' });
    s += arrow(P(206, 160), P(262, 160), { muted: true });

    const B = dmb(300, 170, { moved: true, meDeg: 150, nums: true });
    s += B.g;
    s += plusAt(B.p[2].x + 15, B.p[2].y + 20);
    const hh = P(B.p[1].x, B.p[1].y - 44);
    s += bond(B.p[1], hh, { rFrom: 0, rTo: 12, cls: 'fg-bond-hi' }) + atom(hh.x, hh.y, 'H', { r: 12, kind: 'hi' });
    const w = P(hh.x + 80, hh.y - 30);
    s += atom(w.x, w.y, 'OH₂', { r: 17 });
    s += lonePair(w.x, w.y, 180, { dist: 24 });
    s += lonePair(w.x, w.y, 270, { dist: 24 });
    s += curve(P(w.x - 29, w.y + 2), P(hh.x + 14, hh.y - 4), { bow: 10 });
    s += bondToBond(B.p[1], hh, B.p[1], B.p[2], P(6, 0), P(6, -8), 14);
    s += tag(360, 30, '3° CATION: H LOST FROM C2');
    s += arrow(P(466, 160), P(522, 160), { muted: true });

    const p = chain4(560, 170);
    s += sk(p[0], p[1]) + ringDouble(p[1], p[2], P(p[1].x - 10, p[1].y + 40)) + sk(p[2], p[3]);
    s += sk(p[1], P(p[1].x, p[1].y - 44)) + sk(p[2], P(p[2].x, p[2].y + 44));
    s += tag(640, 30, 'PRODUCT');
    s += text(640, 256, '2,3-dimethylbut-2-ene', { cls: 'fg-tag-good' });
    s += text(640, 274, 'four carbons on the C=C', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Rearrange first, then take the β-hydrogen that gives the most substituted alkene.',
});

/* ---------------------------------------------------------------- 9 ---
   POCl3 and pyridine: E2 with the H and the leaving group anti-periplanar. */
FIGURES.push({
  id: 'pocl3-e2',
  section: 'alcohol-reactions',
  alt: 'The dichlorophosphate ester of 3,3-dimethylbutan-2-ol drawn with C2 and C1 in the plane: the O–POCl2 group points up from C2 and one hydrogen on C1 points down, 180 degrees apart in the same plane. Pyridine\'s nitrogen lone pair takes that hydrogen, the C1–H pair becomes the C1=C2 pi bond, and the C2–O bond pair moves onto the oxygen. The product is 3,3-dimethylbut-1-ene.',
  viewBox: '0 0 700 330',
  build() {
    let s = '';
    s += tag(24, 28, 'ONE STEP · THE H AND THE O–POCl₂ ARE ANTI-PERIPLANAR', { anchor: 'start' });
    const c2 = P(210, 170), c1 = P(284, 170);
    const o = P(c2.x, c2.y - 72);
    s += bond(c2, o, { rFrom: 15, rTo: 15, cls: 'fg-bond-hi' }) + atom(o.x, o.y, 'O', { kind: 'hi' });
    s += bond(o, P(o.x + 62, o.y), { rTo: 25 }) + atom(o.x + 62, o.y, 'POCl₂', { r: 25 });
    s += lonePair(o.x, o.y, 180, { dist: 22 });
    s += lonePair(o.x, o.y, 270, { dist: 22 });
    const hb = armEnd(c2, 150, 42);
    s += hash(c2, hb, { rFrom: 15, rTo: 12, width: 10 }) + atom(hb.x, hb.y, 'H', { r: 12 });
    const cq = armEnd(c2, 225, 52);
    s += wedge(c2, cq, { rFrom: 15, rTo: 0, width: 9 });
    for (const d of [165, 225, 285]) s += sk(cq, armEnd(cq, d, 36));
    s += bond(c2, c1, { rFrom: 15, rTo: 15 });
    s += atom(c2.x, c2.y, 'C', { kind: 'warn' }) + atom(c1.x, c1.y, 'C', { kind: 'warn' });
    s += text(c2.x + 20, c2.y + 30, '2', { cls: 'fg-sm' });
    s += text(c1.x + 22, c1.y + 30, '1', { cls: 'fg-sm' });
    const ha = P(c1.x, c1.y + 62);
    s += bond(c1, ha, { rFrom: 15, rTo: 12, cls: 'fg-bond-hi' }) + atom(ha.x, ha.y, 'H', { r: 12, kind: 'hi' });
    const h1 = armEnd(c1, 10, 42), h2 = armEnd(c1, 60, 42);
    s += wedge(c1, h1, { rFrom: 15, rTo: 12, width: 9 }) + atom(h1.x, h1.y, 'H', { r: 12 });
    s += hash(c1, h2, { rFrom: 15, rTo: 12, width: 10 }) + atom(h2.x, h2.y, 'H', { r: 12 });
    // pyridine
    const ring = benzene(420, 276, 24, { rot: 90 });
    s += ring.svg;
    const nN = ring.pts[1];
    s += atom(nN.x, nN.y, 'N', { r: 12, kind: 'hi' });
    s += lonePair(nN.x, nN.y, 205, { dist: 19 });
    s += text(420, 318, 'pyridine', { cls: 'fg-sm' });
    // arrows
    s += curve(P(nN.x - 22, nN.y - 6), P(ha.x + 14, ha.y + 5), { bow: -14 });
    s += bondToBond(c1, ha, c2, c1, P(-7, 4), P(0, 8), 16);
    s += bondToAtom(c2, o, 15, -1, 0.5);
    s += text(o.x + 62, o.y - 36, 'leaves as ⁻O–POCl₂', { cls: 'fg-sm' });
    // product
    s += arrow(P(470, 170), P(530, 170), { muted: true });
    const q = P(590, 180);
    const e1 = armEnd(q, 30, 44), e2 = armEnd(e1, -30, 44);
    s += sk(q, e1) + ringDouble(e1, e2, P(e1.x + 19, e1.y + 40));
    for (const d of [90, 180, 270]) s += sk(q, armEnd(q, d, 38));
    s += text(610, 258, '3,3-dimethylbut-1-ene', { cls: 'fg-tag-good' });
    s += text(610, 276, 'no cation, so no shift', { cls: 'fg-sm' });
    return s;
  },
  caption: 'POCl₃ turns the OH into a leaving group without acid, and pyridine removes the H that sits 180° from it.',
});

/* ============================================================ LESSON ==== */

FIGURES.push({
  id: 'l-tosylate-inversion',
  lessons: ['alcohol-reactions'],
  alt: '(S)-butan-2-ol, then (S)-butan-2-yl tosylate with every group in the same place after TsCl and pyridine, with bromide attacking from the side opposite the OTs, then (R)-2-bromobutane with the other three groups flipped.',
  viewBox: '0 0 340 500',
  build() { return tosylInversion(true); },
  caption: 'Tosylation keeps the configuration. The SN2 step inverts it once.',
});

FIGURES.push({
  id: 'l-hbr-shift',
  lessons: ['alcohol-reactions'],
  alt: 'Stacked. The secondary cation from 3,3-dimethylbutan-2-ol with a methyl moving from C3 to C2. The tertiary cation at C3 with bromide arriving. Then the product, 2-bromo-2,3-dimethylbutane, with bromine on the carbon that never held the OH.',
  viewBox: '0 0 340 620',
  build() {
    let s = '';
    s += tag(170, 22, 'HBr · 2° CATION AT C2');
    const A = dmb(110, 110, { hiMe: true, nums: true, lesson: true });
    s += A.g;
    s += plusAt(A.p[1].x, A.p[1].y - 12);
    s += curve(P(A.p[2].x - 5, A.p[2].y - 30), P(A.p[1].x + 9, A.p[1].y - 8), { bow: 12 });
    s += arrow(P(170, 186), P(170, 222), { muted: true });
    s += tag(182, 208, 'CH₃ shifts', { anchor: 'start' });
    s += tag(170, 250, '3° CATION AT C3');
    const B = dmb(70, 330, { moved: true, nums: true, lesson: true });
    s += B.g;
    s += plusAt(B.p[2].x, B.p[2].y - 12);
    const bp = P(B.p[2].x + 80, B.p[2].y + 44);
    const br = halide(bp.x, bp.y, 'Br', 151);
    s += br.g;
    s += curve(br.from, P(B.p[2].x + 11, B.p[2].y + 6), { bow: -8 });
    s += arrow(P(170, 404), P(170, 440), { muted: true });
    s += tag(170, 466, 'PRODUCT');
    const C = dmb(110, 540, { moved: true });
    s += C.g;
    const brP = armEnd(C.p[2], 330, 42);
    s += bond(C.p[2], brP, { rFrom: 0, rTo: 15 }) + atom(brP.x, brP.y, 'Br', { kind: 'hi' });
    s += tag(170, 606, '2-bromo-2,3-dimethylbutane', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Bromide bonds to C3, a carbon that never held the OH.',
});

FIGURES.push({
  id: 'l-halide-inversion',
  lessons: ['alcohol-reactions'],
  alt: 'Top: (S)-butan-2-ol after step 1 with PBr3, the oxygen carrying H, PBr2 and a positive charge, and bromide attacking carbon from the opposite side. Bottom: (R)-2-bromobutane, bromine on the left and the other three groups flipped.',
  viewBox: '0 0 340 340',
  build() {
    let s = '';
    s += tag(170, 22, 'PBr₃ · STEP 2');
    const c = P(150, 110);
    const A = sc(c, START('O', 15));
    s += A.g;
    const o = A.ends.x;
    s += bond(o, P(o.x, o.y - 42), { rTo: 12 }) + atom(o.x, o.y - 42, 'H', { r: 12 });
    s += bond(o, P(o.x + 58, o.y), { rTo: 21 }) + atom(o.x + 58, o.y, 'PBr₂', { r: 21 });
    s += plusAt(o.x + 22, o.y - 20);
    s += lonePair(o.x, o.y, 90, { dist: 22 });
    const x = halide(c.x - 110, c.y, 'Br', 0);
    s += x.g;
    s += curve(x.from, P(c.x - 18, c.y - 2), { bow: -6 });
    s += bondToAtom(c, o, 15, -1);
    s += arrow(P(170, 186), P(170, 226), { muted: true });
    s += sc(P(200, 270), INVERTED('Br', 15)).g;
    s += tag(170, 334, '(R)-2-bromobutane · inverted', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Bromide arrives on the side opposite the oxygen, so the three other groups flip.',
});

FIGURES.push({
  id: 'l-dehydration',
  lessons: ['alcohol-reactions'],
  alt: 'Butan-2-ol, then an arrow labeled concentrated sulfuric acid and heat, then two alkenes: but-2-ene, the major product, and but-1-ene, the minor one.',
  viewBox: '0 0 340 306',
  build() {
    let s = '';
    const p = chain4(113, 90);
    s += skChain(p);
    const o = P(p[1].x, p[1].y - 40);
    s += bond(p[1], o, { rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'OH', { r: 15 });
    s += tag(170, 124, 'BUTAN-2-OL');
    s += arrow(P(170, 136), P(170, 180));
    s += tag(182, 164, 'H₂SO₄, heat', { anchor: 'start' });
    const m = chain4(26, 240);
    s += sk(m[0], m[1]) + ringDouble(m[1], m[2], P(m[1].x, m[1].y + 40)) + sk(m[2], m[3]);
    s += tag(84, 288, 'but-2-ene · major', { cls: 'fg-tag-good' });
    const n = chain4(200, 240);
    s += ringDouble(n[0], n[1], P(n[0].x + 10, n[0].y + 40)) + sk(n[1], n[2]) + sk(n[2], n[3]);
    s += tag(258, 288, 'but-1-ene · minor', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'The more substituted alkene is the major product.',
});

FIGURES.push({
  id: 'l-methylbutanol',
  lessons: ['alcohol-reactions'],
  alt: '2-Methylbutan-2-ol drawn skeletally with carbons numbered 1 to 4: C2 carries the OH and a methyl.',
  viewBox: '0 0 340 170',
  build() {
    let s = '';
    const p = chain4(113, 110);
    s += skChain(p);
    const o = P(p[1].x, p[1].y - 44);
    s += bond(p[1], o, { rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'OH', { r: 15 });
    s += sk(p[1], armEnd(p[1], 150, 44));
    s += num(p[0].x - 8, p[0].y + 20, '1', true);
    s += num(p[1].x, p[1].y + 24, '2', true);
    s += num(p[2].x, p[2].y + 20, '3', true);
    s += num(p[3].x + 14, p[3].y + 4, '4', true);
    s += tag(170, 160, '2-METHYLBUTAN-2-OL');
    return s;
  },
  caption: 'C2 carries the OH. Its neighbors are C1, C3 and the methyl.',
});

export default FIGURES;
