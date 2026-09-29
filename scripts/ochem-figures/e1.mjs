/* Figures for the e1 notes page. Built by scripts/build-ochem-figures.mjs;
   see the header there.

   Conventions used throughout this module:
   - Chains are skeletal (this chapter comes after skeletal structures).
     Heteroatoms, the hydrogens that react, and the carbons whose geometry
     matters carry labels.
   - 2-Methylbutane skeletons are drawn with zig(): C1 low, C2 high, C3 low,
     C4 high, and the extra methyl on C2. The 2,2-dimethylbutane skeleton of
     the rearrangement example is the one alcohol-reactions draws for
     3,3-dimethylbutan-2-ol, numbered from the other end, so the two pages
     show the same shift the same way.
   - There is no lesson for this topic (the interactive page is
     ochem/mechanisms/e1.html), so every figure is a notes figure. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble } from '../lib/ochem-skeletal.mjs';
import { armEnd, lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- helpers */

const chain4 = (x0, y0) => zig(x0, y0, 4, 40, 23);
const skChain = (pts) => pts.slice(1).map((p, i) => sk(pts[i], p)).join('');
const plusAt = (x, y) => text(x, y, '+', { cls: 'fg-tag-warn', size: 16 });
const num = (x, y, v) => text(x, y, v, { cls: 'fg-sm' });

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

/* Carbon numbers for a 2-methylbutane chain drawn by chain4. */
function nums4(p) {
  return num(p[0].x - 10, p[0].y + 18, '1') + num(p[1].x + 12, p[1].y + 20, '2') +
         num(p[2].x - 14, p[2].y + 16, '3') + num(p[3].x + 12, p[3].y + 16, '4');
}

/* A water or ethanol oxygen drawn as one label with two lone pairs, the
   first facing `face` (screen degrees). Returns where arrow 1 starts. */
function solventO(x, y, lbl, face, other) {
  let g = atom(x, y, lbl, { r: 18 });
  g += lonePair(x, y, face, { dist: 25 }) + lonePair(x, y, other, { dist: 25 });
  const a = (face * Math.PI) / 180;
  return { g, from: P(x + Math.cos(a) * 31, y + Math.sin(a) * 31) };
}

/* ---------------------------------------------------------------- 1 ---
   The two steps of E1 on 2-bromo-2-methylbutane, every arrow drawn. */
FIGURES.push({
  id: 'e1-both-arrows',
  section: 'e1',
  alt: 'Two rows. Step 1, slow: in 2-bromo-2-methylbutane one curved arrow moves the C2–Br bond pair onto bromine, giving the tertiary carbocation at C2 and bromide. Step 2, fast: an ethanol oxygen lone pair takes a hydrogen on C3, and a second arrow moves that C3–H bond pair into the C2–C3 bond, giving 2-methylbut-2-ene and protonated ethanol.',
  viewBox: '0 0 760 484',
  build() {
    let s = '';
    // ---- step 1 ----
    s += tag(24, 30, 'STEP 1 · SLOW: BROMIDE LEAVES, AS IN SN1', { anchor: 'start' });
    let p = chain4(90, 160);
    s += skChain(p) + nums4(p);
    s += sk(p[1], armEnd(p[1], 125, 44));
    const br = armEnd(p[1], 55, 56);
    s += bond(p[1], br, { rFrom: 0, rTo: 15, cls: 'fg-bond-hi' }) + atom(br.x, br.y, 'Br', { kind: 'hi' });
    for (const d of [215, 305, 35]) s += lonePair(br.x, br.y, d, { dist: 23 });
    s += bondToAtom(p[1], br, 15, -1, 0.5);
    s += text(150, 214, '2-bromo-2-methylbutane', { cls: 'fg-sm' });
    s += arrow(P(262, 130), P(322, 130), { muted: true });
    p = chain4(360, 160);
    s += skChain(p) + nums4(p);
    s += sk(p[1], armEnd(p[1], 90, 44));
    s += plusAt(p[1].x + 16, p[1].y - 12);
    s += text(420, 214, 'a 3° carbocation at C2', { cls: 'fg-sm' });
    s += text(560, 146, '+', { cls: 'fg-lbl' });
    const bm = P(610, 140);
    s += atom(bm.x, bm.y, 'Br', { kind: 'hi' });
    for (const d of [0, 90, 180, 270]) s += lonePair(bm.x, bm.y, d + 45, { dist: 23 });
    s += text(bm.x + 26, bm.y - 14, '−', { cls: 'fg-tag-warn', size: 15 });
    s += rule(24, 238, 736, 238);

    // ---- step 2 ----
    s += tag(24, 268, 'STEP 2 · FAST: ETHANOL TAKES A β-HYDROGEN', { anchor: 'start' });
    p = chain4(80, 360);
    s += skChain(p);
    s += sk(p[1], armEnd(p[1], 90, 44));
    s += plusAt(p[1].x + 16, p[1].y - 12);
    const h = P(p[2].x, p[2].y + 50);
    s += bond(p[2], h, { rFrom: 0, rTo: 12, cls: 'fg-bond-hi' }) + atom(h.x, h.y, 'H', { r: 12, kind: 'hi' });
    s += text(p[2].x + 13, p[2].y + 30, 'β', { cls: 'fg-tag' });
    const et = solventO(h.x + 104, h.y + 4, 'EtOH', 180, 250);
    s += et.g;
    s += curve(et.from, P(h.x + 15, h.y + 2), { bow: 12 });
    s += bondToBond(p[2], h, p[1], p[2], P(-6, 0), P(-4, 8), 16);
    s += text(24, 450, 'arrow 1: a lone pair on O takes the β-H', { cls: 'fg-sm', anchor: 'start' });
    s += text(24, 468, 'arrow 2: the C–H pair becomes the π bond', { cls: 'fg-sm', anchor: 'start' });
    s += arrow(P(330, 360), P(390, 360), { muted: true });
    const q = chain4(420, 380);
    s += sk(q[0], q[1]) + ringDouble(q[1], q[2], P(q[1].x, q[1].y + 40)) + sk(q[2], q[3]);
    s += sk(q[1], armEnd(q[1], 90, 44));
    s += text(480, 412, '2-methylbut-2-ene', { cls: 'fg-tag-good' });
    s += text(590, 364, '+', { cls: 'fg-lbl' });
    s += atom(650, 360, 'EtOH₂', { r: 24 });
    s += text(682, 344, '+', { cls: 'fg-tag-warn', size: 16 });
    return s;
  },
  caption: 'Follow the arrows: one in step 1, two in step 2. The base never touches the positive carbon.',
});

/* ---------------------------------------------------------------- 2 ---
   Why E1 has no anti-periplanar rule. */
FIGURES.push({
  id: 'e1-no-anti-needed',
  section: 'e1',
  alt: 'Two panels. Left, E2: bromine points up from one carbon and the hydrogen to be removed points down from the next carbon, 180 degrees apart in one plane, because both bonds change in the same step. Right, E1: the bromine has already left. The positive carbon has an empty p orbital drawn as two lobes above and below it, and a C–H bond on the next carbon points straight down, parallel to the lower lobe. Rotation about the C–C single bond brings a C–H into that position.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const side = (c, degs) => {
      let g = '';
      const [w, hh] = degs;
      g += wedge(c, armEnd(c, w, 40), { rFrom: 15, rTo: 0, width: 8 });
      g += hash(c, armEnd(c, hh, 40), { rFrom: 15, rTo: 0, width: 9, rungs: 4 });
      return g;
    };
    // ---- E2 ----
    s += panel(16, 16, 356, 268);
    s += tag(194, 42, 'E2 · ONE STEP');
    let a = P(160, 150), b = P(232, 150);
    s += bond(a, b, { rFrom: 15, rTo: 15 });
    s += side(a, [200, 160]) + side(b, [340, 20]);
    let x = P(a.x, a.y - 64);
    s += bond(a, x, { rFrom: 15, rTo: 15, cls: 'fg-bond-hi' }) + atom(x.x, x.y, 'Br', { kind: 'hi' });
    let hh = P(b.x, b.y + 60);
    s += bond(b, hh, { rFrom: 15, rTo: 12, cls: 'fg-bond-hi' }) + atom(hh.x, hh.y, 'H', { r: 12, kind: 'hi' });
    s += atom(a.x, a.y, 'C') + atom(b.x, b.y, 'C');
    s += text(190, 82, 'Br and H 180° apart,', { cls: 'fg-sm', anchor: 'start' });
    s += text(190, 98, 'in one plane', { cls: 'fg-sm', anchor: 'start' });
    s += text(194, 252, 'both bonds break in the same step,', { cls: 'fg-sm' });
    s += text(194, 268, 'so they must be anti-periplanar', { cls: 'fg-tag-warn', size: 11 });

    // ---- E1 ----
    s += panel(388, 16, 356, 268, { kind: 'hi' });
    s += tag(566, 42, 'E1 · Br⁻ ALREADY GONE');
    a = P(532, 150); b = P(604, 150);
    s += lobeE(a.x, a.y - 34, 12, 22, 'fg-orb-node') + lobeE(a.x, a.y + 34, 12, 22, 'fg-orb-node');
    s += bond(a, b, { rFrom: 15, rTo: 15 });
    s += side(a, [200, 160]) + side(b, [340, 20]);
    hh = P(b.x, b.y + 60);
    s += bond(b, hh, { rFrom: 15, rTo: 12, cls: 'fg-bond-hi' }) + atom(hh.x, hh.y, 'H', { r: 12, kind: 'hi' });
    s += atom(a.x, a.y, 'C', { kind: 'warn' }) + atom(b.x, b.y, 'C');
    s += plusAt(a.x + 20, a.y - 14);
    s += text(a.x - 22, 80, 'empty p orbital', { cls: 'fg-sm', anchor: 'end' });
    s += text(626, 206, 'C–H parallel', { cls: 'fg-sm', anchor: 'start' });
    s += text(626, 222, 'to the p orbital', { cls: 'fg-sm', anchor: 'start' });
    s += curve(P(556, 126), P(582, 126), { bow: -9, muted: true, size: 6 });
    s += text(596, 96, 'this bond rotates', { cls: 'fg-sm', anchor: 'start' });
    s += text(566, 268, 'no leaving group left to line up with', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Compare the two highlighted H atoms. On the left, the Br decides where the H must point. On the right, only the empty p orbital does.',
});

/* ---------------------------------------------------------------- 3 ---
   One cation, three products. Replaces the hand-written wide figure that
   sat under the Zaitsev heading. */
FIGURES.push({
  id: 'e1-three-products',
  section: 'e1',
  alt: 'The tertiary cation from 2-bromo-2-methylbutane, carbons numbered, with a hydrogen drawn on C1 and one on C3, each marked beta. Three arrows lead to three products. Losing the hydrogen on C3 gives 2-methylbut-2-ene, with three carbon groups on the double bond, the major alkene. Losing a hydrogen on C1 gives 2-methylbut-1-ene, with two carbon groups on the double bond, the minor alkene. Ethanol bonding to C2 gives the SN1 product, 2-ethoxy-2-methylbutane.',
  viewBox: '0 0 760 350',
  build() {
    let s = '';
    const p = chain4(56, 200);
    s += skChain(p) + nums4(p);
    s += sk(p[1], armEnd(p[1], 90, 44));
    s += plusAt(p[1].x + 16, p[1].y - 12);
    for (const i of [0, 2]) {
      const h = P(p[i].x, p[i].y + 48);
      s += bond(p[i], h, { rFrom: 0, rTo: 12, cls: 'fg-bond-hi' }) + atom(h.x, h.y, 'H', { r: 12, kind: 'hi' });
      s += text(p[i].x + 13, p[i].y + 30, 'β', { cls: 'fg-tag' });
    }
    s += text(116, 292, 'one cation, two kinds of β-H', { cls: 'fg-sm' });
    // three reaction arrows
    s += arrow(P(222, 170), P(296, 92), { muted: true });
    s += arrow(P(222, 184), P(296, 184), { muted: true });
    s += arrow(P(222, 198), P(296, 276), { muted: true });

    // major alkene: 2-methylbut-2-ene
    let q = chain4(326, 104);
    s += sk(q[0], q[1]) + ringDouble(q[1], q[2], P(q[1].x, q[1].y + 40)) + sk(q[2], q[3]);
    s += sk(q[1], armEnd(q[1], 90, 44));
    s += text(500, 70, '2-methylbut-2-ene · major', { cls: 'fg-tag-good', anchor: 'start' });
    s += text(500, 88, 'EtOH takes the H on C3', { cls: 'fg-sm', anchor: 'start' });
    s += text(500, 104, '3 carbon groups on the C=C', { cls: 'fg-sm', anchor: 'start' });

    // minor alkene: 2-methylbut-1-ene
    q = chain4(326, 200);
    s += ringDouble(q[0], q[1], P(q[0].x + 10, q[0].y + 40)) + sk(q[1], q[2]) + sk(q[2], q[3]);
    s += sk(q[1], armEnd(q[1], 90, 44));
    s += text(500, 166, '2-methylbut-1-ene · minor', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(500, 184, 'EtOH takes an H on C1', { cls: 'fg-sm', anchor: 'start' });
    s += text(500, 200, '2 carbon groups on the C=C', { cls: 'fg-sm', anchor: 'start' });

    // SN1 ether
    q = chain4(326, 312);
    s += skChain(q);
    s += sk(q[1], armEnd(q[1], 125, 40));
    const o = armEnd(q[1], 55, 44);
    s += bond(q[1], o, { rFrom: 0, rTo: 18 }) + atom(o.x, o.y, 'OEt', { r: 18 });
    s += text(500, 262, '2-ethoxy-2-methylbutane · SN1', { cls: 'fg-tag', anchor: 'start' });
    s += text(500, 280, 'ethanol bonds to C2', { cls: 'fg-sm', anchor: 'start' });
    s += text(500, 296, 'no alkene at all', { cls: 'fg-sm', anchor: 'start' });
    return s;
  },
  caption: 'Everything after step 1 is a choice the cation makes. Two choices give alkenes, and the third gives the SN1 product.',
});

/* ---------------------------------------------------------------- 4 ---
   The substitution count, drawn. */
FIGURES.push({
  id: 'e1-substitution-count',
  section: 'e1',
  alt: 'Four skeletal alkenes, each with its C=C drawn across the middle and the bonds from the alkene carbons to carbon groups highlighted. But-1-ene: one ethyl, monosubstituted. But-2-ene: one methyl on each alkene carbon, disubstituted. 2-Methylbut-2-ene: two methyls on one alkene carbon and one on the other, trisubstituted. 2,3-Dimethylbut-2-ene: two methyls on each alkene carbon, tetrasubstituted.',
  viewBox: '0 0 760 240',
  build() {
    let s = '';
    const cols = [
      { cx: 95, name: 'but-1-ene', kind: 'MONOSUBSTITUTED', n: '1 carbon group', a: [], b: [60], ethyl: true },
      { cx: 285, name: 'but-2-ene', kind: 'DISUBSTITUTED', n: '2 carbon groups', a: [240], b: [60] },
      { cx: 475, name: '2-methylbut-2-ene', kind: 'TRISUBSTITUTED', n: '3 carbon groups', a: [120, 240], b: [60] },
      { cx: 665, name: '2,3-dimethylbut-2-ene', kind: 'TETRASUBSTITUTED', n: '4 carbon groups', a: [120, 240], b: [60, 300] },
    ];
    cols.forEach((c, i) => {
      if (i) s += rule(c.cx - 95, 40, c.cx - 95, 210);
      s += tag(c.cx, 32, c.kind);
      const a = P(c.cx - 22, 116), b = P(c.cx + 22, 116);
      s += ringDouble(a, b, P(c.cx, 160), { inset: 6 });
      for (const d of c.a) s += sk(a, armEnd(a, d, 38), true);
      for (const d of c.b) {
        const e = armEnd(b, d, 38);
        s += sk(b, e, true);
        if (c.ethyl) s += sk(e, armEnd(e, 0, 38));
      }
      s += text(c.cx, 190, c.name, { cls: 'fg-tag' });
      s += text(c.cx, 208, c.n, { cls: 'fg-sm' });
    });
    return s;
  },
  caption: 'Count only the highlighted bonds: the ones from the two alkene carbons to carbon groups.',
});

/* ---------------------------------------------------------------- 5 ---
   Shift first, then eliminate: 3-bromo-2,2-dimethylbutane. */
FIGURES.push({
  id: 'e1-shift-then-eliminate',
  section: 'e1',
  alt: 'Three frames, carbons numbered. First, the secondary cation at C3 of 3-bromo-2,2-dimethylbutane after bromide has left, with a curved arrow moving one methyl from C2 to C3 with its bonding pair. Second, the tertiary cation now at C2, with a water molecule taking the hydrogen on C3 and that C–H pair becoming the C2=C3 bond. Third, the product, 2,3-dimethylbut-2-ene, with four carbon groups on the double bond.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const n4 = (p, moved) =>
      num(p[3].x + 14, p[3].y + 4, '1') + (moved ? num(p[2].x - 16, p[2].y + 26, '2') : num(p[2].x + 14, p[2].y + 22, '2')) +
      num(p[1].x, p[1].y + 24, '3') + num(p[0].x - 8, p[0].y + 20, '4');

    // frame 1: the 2° cation and the methyl that moves
    let p = zig(40, 180, 4, 40, 23);
    s += skChain(p) + n4(p, false);
    s += sk(p[2], P(p[2].x, p[2].y - 46), true);
    s += sk(p[2], P(p[2].x, p[2].y + 46));
    s += plusAt(p[1].x, p[1].y - 12);
    s += curve(P(p[2].x - 6, p[2].y - 30), P(p[1].x + 9, p[1].y - 8), { bow: 12 });
    s += tag(100, 34, '2° CATION AT C3');
    s += text(100, 262, 'C2 has no H to move,', { cls: 'fg-sm' });
    s += text(100, 278, 'so a methyl moves', { cls: 'fg-sm' });
    s += arrow(P(200, 170), P(252, 170), { muted: true });

    // frame 2: the 3° cation at C2, and the β-H on C3
    p = zig(282, 180, 4, 40, 23);
    s += skChain(p) + n4(p, true);
    s += sk(p[1], armEnd(p[1], 150, 44), true);
    s += sk(p[2], P(p[2].x, p[2].y + 46));
    s += plusAt(p[2].x + 18, p[2].y + 22);
    const h = P(p[1].x, p[1].y - 46);
    s += bond(p[1], h, { rFrom: 0, rTo: 12, cls: 'fg-bond-hi' }) + atom(h.x, h.y, 'H', { r: 12, kind: 'hi' });
    const w = solventO(h.x + 84, h.y - 26, 'OH₂', 180, 250);
    s += w.g;
    s += curve(w.from, P(h.x + 14, h.y - 4), { bow: 10 });
    s += bondToBond(p[1], h, p[1], p[2], P(6, 0), P(2, -7), 14);
    s += tag(342, 34, '3° CATION AT C2');
    s += text(342, 262, 'water takes the H on C3', { cls: 'fg-sm' });
    s += text(342, 278, 'next to the new charge', { cls: 'fg-sm' });
    s += arrow(P(470, 170), P(522, 170), { muted: true });

    // frame 3: the product
    p = zig(556, 180, 4, 40, 23);
    s += sk(p[0], p[1]) + ringDouble(p[1], p[2], P(p[1].x - 10, p[1].y + 40)) + sk(p[2], p[3]);
    s += sk(p[1], P(p[1].x, p[1].y - 46)) + sk(p[2], P(p[2].x, p[2].y + 46));
    s += tag(640, 34, 'PRODUCT');
    s += text(640, 262, '2,3-dimethylbut-2-ene', { cls: 'fg-tag-good' });
    s += text(640, 278, '4 carbon groups on the C=C', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Follow the highlighted methyl from C2 to C3, and the positive charge from C3 to C2.',
});

/* ---------------------------------------------------------------- 6 ---
   Acid-catalyzed dehydration reaches the same cation as figure 1. */
FIGURES.push({
  id: 'e1-dehydration',
  section: 'e1',
  alt: 'Two panels. Left: an oxygen lone pair of 2-methylbutan-2-ol takes a proton from sulfuric acid, and the H–O bond pair of the acid moves onto its oxygen. Right: in the protonated alcohol the C2–O bond pair moves onto oxygen and water leaves, giving the same tertiary carbocation at C2 that 2-bromo-2-methylbutane gives.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += rule(372, 24, 372, 226);
    // panel 1: protonation
    s += tag(24, 32, '1 · THE OH TAKES A PROTON', { anchor: 'start' });
    let p = chain4(40, 190);
    s += skChain(p) + nums4(p);
    s += sk(p[1], armEnd(p[1], 125, 44));
    let o = armEnd(p[1], 55, 56);
    s += bond(p[1], o, { rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O', { kind: 'hi' });
    const oh = armEnd(o, 150, 38);
    s += bond(o, oh, { rFrom: 15, rTo: 12 }) + atom(oh.x, oh.y, 'H', { r: 12 });
    s += lonePair(o.x, o.y, 20, { dist: 22 }) + lonePair(o.x, o.y, 90, { dist: 22 });
    const hp = P(o.x + 78, o.y - 36), acid = P(hp.x + 72, hp.y);
    s += bond(hp, acid, { rFrom: 12, rTo: 28, cls: 'fg-bond-hi' });
    s += atom(hp.x, hp.y, 'H', { r: 12, kind: 'hi' }) + atom(acid.x, acid.y, 'OSO₃H', { r: 28 });
    s += curve(P(o.x + 25, o.y + 3), P(hp.x - 10, hp.y + 9), { bow: -12 });
    s += curve(P((hp.x + acid.x) / 2 - 4, hp.y - 6), P(acid.x - 18, acid.y - 24), { bow: -14 });
    s += text(200, 240, '2-methylbutan-2-ol, conc. H₂SO₄, heat', { cls: 'fg-sm' });

    // panel 2: water leaves
    s += tag(392, 32, '2 · WATER LEAVES (SLOW STEP)', { anchor: 'start' });
    p = chain4(392, 190);
    s += skChain(p);
    s += sk(p[1], armEnd(p[1], 125, 44));
    o = armEnd(p[1], 55, 60);
    s += bond(p[1], o, { rFrom: 0, rTo: 18, cls: 'fg-bond-hi' }) + atom(o.x, o.y, 'OH₂', { r: 18, kind: 'hi' });
    s += plusAt(o.x + 25, o.y - 12);
    s += lonePair(o.x, o.y, 0, { dist: 25 });
    s += bondToAtom(p[1], o, 18, -1, 0.5);
    s += arrow(P(540, 150), P(588, 150), { muted: true });
    const q = chain4(610, 190);
    s += skChain(q);
    s += sk(q[1], armEnd(q[1], 90, 44));
    s += plusAt(q[1].x + 16, q[1].y - 12);
    s += text(560, 240, 'the same 3° cation 2-bromo-2-methylbutane gave', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Only these two steps are new. The step after them is step 2 of the first figure, with water as the base.',
});

export default FIGURES;
