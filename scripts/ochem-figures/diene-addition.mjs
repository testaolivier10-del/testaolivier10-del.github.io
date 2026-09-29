/* Figures for the diene-addition notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions:
   - every chain is drawn as labeled groups (H₂C, CH, CH₂...) in a straight
     row, so the carbon that took the proton and the carbons that carry the
     charge can be named and colored; the diene's own numbers C1 to C4 sit
     under each carbon in every drawing, products included, because 1,2 and
     1,4 count along the diene and never along the product's name;
   - the highlighted group (hi) is the carbon that took the electrophile, and
     the warn-colored group carries the positive charge;
   - a curved arrow starts on electrons (a bond or a lone pair) and ends where
     they go;
   - figures shown in the lesson are 340 wide or less and use only fg-lbl and
     fg-tag text. */
import { atom as atom0, bond, arrow, curve, lonePair, text, rule, bar, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const r2 = (v) => Math.round(v * 100) / 100;
const rOf = (l) => (l.length >= 3 ? 16 : l.length === 2 ? 14 : 12);

/* An atom disc that stays opaque in both themes. */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? rOf(l))}"></circle>` : '';
  return back + atom0(x, y, l, { r: rOf(l), ...o });
}
const A = (p, l, kind) => atom(p.x, p.y, l, { kind });
const B = (a, la, b, lb, o = {}) => bond(a, b, { rFrom: la ? rOf(la) : 0, rTo: lb ? rOf(lb) : 0, order: o.order || 1, cls: o.cls });
const chg = (x, y, s = '+') => text(x, y + 5, s, { cls: 'fg-warn', size: 16 });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const tg = (x, y, s, cls = 'fg-tag', anchor = 'middle') => text(x, y, s, { cls, size: 11, anchor });

/* A halogen or oxygen with lone pairs at the given screen angles
   (0 east, 90 south). */
function withPairs(p, sym, lps, kind = 'warn') {
  let g = '';
  for (const a of lps) g += lonePair(p.x, p.y, a, { dist: 21 });
  return g + atom(p.x, p.y, sym, { kind });
}
/* A curved arrow that starts on the middle of bond a–b, pushed `off` px to
   the left of the direction a→b (negative: right), and ends at e. */
function fromBond(a, b, e, bow, off = 6) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  return curve(P(m.x + (dy / L) * off, m.y - (dx / L) * off), e, { bow, size: 7 });
}

/* A straight chain of labeled groups.
   groups: [{ l, kind, up, down, chg, dplus, num }]
     up / down: a branch label (CH₃, Br, OH) drawn 50 px above or below;
     chg: draw a + beside the group; dplus: draw δ+ above it;
     num: the diene number written under the group (moved to the lower
     left when something hangs below the group).
   orders: bond order between neighbors; 'h' draws a single bond with a
     dashed partial bond above it (the hybrid of two resonance forms). */
function chain(x0, y, groups, orders, o = {}) {
  const dx = o.dx ?? 56;
  const p = groups.map((_, i) => P(x0 + i * dx, y));
  let s = '';
  for (let i = 0; i < groups.length - 1; i++) {
    const ord = orders[i];
    const la = groups[i].l, lb = groups[i + 1].l;
    if (ord === 'h') {
      s += B(p[i], la, p[i + 1], lb);
      s += bond(P(p[i].x, y - 8), P(p[i + 1].x, y - 8), { rFrom: rOf(la) + 2, rTo: rOf(lb) + 2, cls: 'fg-dash' });
    } else {
      s += B(p[i], la, p[i + 1], lb, { order: ord });
    }
  }
  groups.forEach((g, i) => {
    const q = p[i];
    if (g.up) {
      const u = P(q.x, y - 50);
      s += B(q, g.l, u, g.up);
      s += g.up === 'Br' ? withPairs(u, 'Br', [180, -90, 0], g.upKind || 'warn') : A(u, g.up, g.upKind);
    }
    if (g.down) {
      const d = P(q.x, y + 50);
      s += B(q, g.l, d, g.down);
      if (g.down === 'Br') s += withPairs(d, 'Br', [180, 90, 0], g.downKind || 'warn');
      else if (g.down === 'OH') s += atom(d.x, d.y, 'OH', { kind: 'warn' });
      else s += A(d, g.down, g.downKind);
    }
    s += A(q, g.l, g.kind);
    if (g.chg) s += chg(q.x + 17, q.y - 20);
    if (g.dplus) s += lbl(q.x + (g.up ? 22 : 0), q.y - 24, 'δ+');
    if (g.num) {
      if (g.down) s += tg(q.x + 22, q.y + 30, g.num, 'fg-tag', 'start');
      else if (g.numLeft) s += tg(q.x - 25, q.y + 30, g.num);
      else s += tg(q.x, q.y + 32, g.num);
    }
  });
  return { s, p };
}
const nums = (groups, first = 1) => groups.map((g, i) => ({ ...g, num: 'C' + (first + i) }));

/* The two-headed arrow between resonance forms. */
/* Drawn rather than typed: the glyph is set at the label size and comes out
   too small to read. */
const resonance = (x, y, h = 16) => arrow(P(x, y), P(x + h, y), { size: 7 }) + arrow(P(x, y), P(x - h, y), { size: 7 });
const resonanceV = (x, y, h = 16) => arrow(P(x, y), P(x, y + h), { size: 7 }) + arrow(P(x, y), P(x, y - h), { size: 7 });

/* Buta-1,3-diene groups, and the cation from protonating C1 in each of its
   two resonance forms. */
const DIENE = nums([{ l: 'H₂C' }, { l: 'CH' }, { l: 'CH' }, { l: 'CH₂' }]);
const FORM_C2 = nums([{ l: 'H₃C', kind: 'hi' }, { l: 'CH', kind: 'warn', chg: true }, { l: 'CH' }, { l: 'CH₂' }]);
const FORM_C4 = nums([{ l: 'H₃C', kind: 'hi' }, { l: 'CH' }, { l: 'CH' }, { l: 'CH₂', kind: 'warn', chg: true }]);

/* A bromide ion with four lone pairs. */
const bromide = (p) => withPairs(p, 'Br⁻', [0, 90, 180, 270], 'plain');

/* ======================================================================
   1. Where the proton goes: an end carbon or an inner one.
   ====================================================================== */
FIGURES.push({
  id: 'diene-protonation-choice',
  section: 'diene-addition',
  anchor: '',
  alt: 'Buta-1,3-diene, numbered C1 to C4, and the two places a proton could add. Top: the proton adds to C1, which becomes CH3, and the positive charge sits on C2, right beside the C3=C4 double bond: an allylic cation. Bottom: the proton adds to C2, which becomes CH2, and the positive charge sits on C1, a primary cation cut off from the C3=C4 double bond by the sp3 carbon C2.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tg(122, 50, 'buta-1,3-diene + H⁺');
    s += chain(38, 150, DIENE, [2, 1, 2]).s;

    s += arrow(P(236, 136), P(316, 92));
    s += tg(262, 100, 'H⁺ to C1', 'fg-tag', 'end');
    s += arrow(P(236, 166), P(316, 214), { muted: true });
    s += tg(262, 212, 'H⁺ to C2', 'fg-tag-mut', 'end');

    s += chain(352, 84, FORM_C2, [1, 1, 2], { dx: 62 }).s;
    s += tg(650, 78, 'allylic cation:', 'fg-tag-good');
    s += tg(650, 96, 'the + is next to C3=C4', 'fg-tag-good');

    s += chain(352, 220, nums([{ l: 'H₂C', kind: 'warn', chg: true }, { l: 'CH₂', kind: 'hi' }, { l: 'CH' }, { l: 'CH₂' }]), [1, 1, 2], { dx: 62 }).s;
    s += tg(650, 214, '1° cation, no resonance:', 'fg-tag-warn');
    s += tg(650, 232, 'sp³ C2 cuts it off', 'fg-tag-warn');
    return s;
  },
  caption: 'The highlighted group took the proton, and the red group carries the positive charge.',
});

FIGURES.push({
  id: 'l-diene-protonation-choice',
  lessons: ['diene-addition'],
  anchor: '',
  alt: 'Buta-1,3-diene numbered C1 to C4. If the proton adds to C1, the positive charge sits on C2, next to the C3=C4 double bond: an allylic cation. If the proton adds to C2, the charge sits on C1, a primary cation with no resonance.',
  viewBox: '0 0 340 440',
  build() {
    let s = '';
    s += tg(170, 30, 'buta-1,3-diene');
    s += chain(65, 80, DIENE, [2, 1, 2], { dx: 70 }).s;
    s += rule(20, 134, 320, 134);
    s += tg(170, 160, 'H⁺ to C1');
    s += chain(65, 212, FORM_C2, [1, 1, 2], { dx: 70 }).s;
    s += tg(170, 272, 'allylic: + next to C3=C4', 'fg-tag-good');
    s += rule(20, 292, 320, 292);
    s += tg(170, 318, 'H⁺ to C2', 'fg-tag-mut');
    s += chain(65, 370, nums([{ l: 'H₂C', kind: 'warn', chg: true }, { l: 'CH₂', kind: 'hi' }, { l: 'CH' }, { l: 'CH₂' }]), [1, 1, 2], { dx: 70 }).s;
    s += tg(170, 430, '1° cation, no resonance', 'fg-tag-warn');
    return s;
  },
  caption: 'The highlighted group took the proton, and the red group carries the charge.',
});

/* ======================================================================
   2. The mechanism: protonation, the two resonance forms, and bromide
      bonding to either charged carbon.
   ====================================================================== */
function dieneWithHBr(x0, y, dx) {
  const d = chain(x0, y, DIENE, [2, 1, 2], { dx });
  let s = d.s;
  const mid = P((d.p[0].x + d.p[1].x) / 2, y);
  const h = P(mid.x, y - 72), br = P(mid.x + 60, y - 72);
  s += bond(h, br, { rFrom: 11, rTo: 14 });
  s += withPairs(br, 'Br', [-90, 0, 90]);
  s += atom(h.x, h.y, 'H', { kind: 'hi' });
  // the C1=C2 pi bond reaches up for the proton
  s += curve(P(mid.x - 4, y - 8), P(h.x - 3, h.y + 14), { bow: -14, size: 7 });
  // the H–Br bond's electrons leave with bromine
  s += fromBond(h, br, P(br.x - 8, br.y - 15), -14, 6);
  return s;
}

FIGURES.push({
  id: 'diene-protonation-arrows',
  section: 'diene-addition',
  anchor: '',
  alt: 'Step 1: buta-1,3-diene with H–Br above it; a curved arrow runs from the C1=C2 pi bond to the hydrogen and a second from the H–Br bond onto bromine. Step 2: the cation drawn as two resonance forms joined by a double-headed arrow, with the positive charge on C2 in the first and on C4 in the second. Below each form a bromide ion sends a curved arrow from a lone pair to the charged carbon: C2 in the first form, C4 in the second.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    s += tg(122, 30, 'step 1: the π bond takes H⁺');
    s += dieneWithHBr(38, 150, 56);
    s += arrow(P(236, 150), P(286, 150));
    s += tg(520, 30, 'step 2: Br⁻ bonds to either end');
    const a = chain(312, 150, FORM_C2, [1, 1, 2], { dx: 56 });
    s += a.s;
    // how the second form comes from the first: the C3=C4 pi electrons move to C2–C3
    s += curve(P((a.p[2].x + a.p[3].x) / 2, 142), P((a.p[1].x + a.p[2].x) / 2 + 4, 142), { bow: 22, size: 7 });
    s += resonance(516, 150);
    const b = chain(552, 150, FORM_C4, [1, 2, 1], { dx: 56 });
    s += b.s;
    const brA = P(a.p[1].x + 34, 262), brB = P(b.p[3].x - 34, 262);
    s += bromide(brA) + bromide(brB);
    s += curve(P(brA.x - 4, brA.y - 26), P(a.p[1].x + 12, a.p[1].y + 12), { bow: -14, size: 7 });
    s += curve(P(brB.x + 4, brB.y - 26), P(b.p[3].x - 12, b.p[3].y + 12), { bow: 14, size: 7 });
    s += tg(a.p[1].x + 34, 318, 'Br⁻ bonds to C2');
    s += tg(b.p[3].x - 34, 318, 'Br⁻ bonds to C4');
    return s;
  },
  caption: 'Each curved arrow starts on electrons (the π bond, the H–Br bond, a lone pair on bromide), never on a positive charge and never on the hydrogen itself. The small arrow in the first form shows how the second form is drawn from it; the two-headed arrow joins two drawings of one cation.',
});

FIGURES.push({
  id: 'l-diene-mechanism',
  lessons: ['diene-addition'],
  anchor: '',
  alt: 'Top: buta-1,3-diene with H–Br above it, a curved arrow from the C1=C2 pi bond to the hydrogen and another from the H–Br bond onto bromine. Middle: the cation with the charge on C2, and a bromide ion sending a curved arrow from a lone pair to C2. A double-headed arrow links it to the bottom drawing: the same cation with the double bond at C2=C3 and the charge on C4, and a bromide sending an arrow to C4.',
  viewBox: '0 0 340 530',
  build() {
    let s = '';
    s += tg(170, 20, 'step 1: the π bond takes H⁺');
    s += dieneWithHBr(65, 130, 70);
    s += arrow(P(170, 168), P(170, 200));
    const a = chain(65, 248, FORM_C2, [1, 1, 2], { dx: 70 });
    s += a.s;
    s += curve(P((a.p[2].x + a.p[3].x) / 2, 240), P((a.p[1].x + a.p[2].x) / 2 + 4, 240), { bow: 22, size: 7 });
    const brA = P(a.p[1].x + 40, 330);
    s += bromide(brA);
    s += curve(P(brA.x - 4, brA.y - 26), P(a.p[1].x + 12, a.p[1].y + 12), { bow: -14, size: 7 });
    s += resonanceV(65, 336, 20);
    const b = chain(65, 418, FORM_C4, [1, 2, 1], { dx: 70 });
    s += b.s;
    const brB = P(b.p[3].x - 40, 494);
    s += bromide(brB);
    s += curve(P(brB.x + 4, brB.y - 26), P(b.p[3].x - 12, b.p[3].y + 12), { bow: 14, size: 7 });
    return s;
  },
  caption: 'Arrows start on electrons, never on a + or on the H. The two-headed arrow joins two drawings of one cation.',
});

/* ======================================================================
   3. The two products, with the diene's numbers kept on every carbon.
   ====================================================================== */
const PROD12 = nums([{ l: 'H₃C', kind: 'hi' }, { l: 'CH', down: 'Br' }, { l: 'CH' }, { l: 'CH₂' }]);
const PROD14 = nums([{ l: 'H₃C', kind: 'hi' }, { l: 'CH' }, { l: 'CH' }, { l: 'CH₂', down: 'Br' }]);

FIGURES.push({
  id: 'diene-two-products',
  section: 'diene-addition',
  lessons: ['diene-addition'],
  anchor: '',
  alt: 'The two products, each numbered C1 to C4 along the original diene. 1,2-addition: H on C1 and Br on C2, with the double bond still between C3 and C4; this is 3-bromobut-1-ene. 1,4-addition: H on C1 and Br on C4, with the double bond now between C2 and C3; this is 1-bromobut-2-ene.',
  viewBox: '0 0 340 430',
  build() {
    let s = '';
    s += tg(170, 22, '1,2-addition: Br⁻ at C2');
    s += chain(65, 66, PROD12, [1, 1, 2], { dx: 70 }).s;
    s += lbl(170, 166, '3-bromobut-1-ene');
    s += rule(20, 198, 320, 198);
    s += tg(170, 224, '1,4-addition: Br⁻ at C4');
    s += chain(65, 268, PROD14, [1, 2, 1], { dx: 70 }).s;
    s += lbl(170, 368, '1-bromobut-2-ene');
    s += rule(20, 398, 320, 398);
    s += tg(170, 420, 'C1–C4 are the diene’s numbers', 'fg-tag-mut');
    return s;
  },
  caption: 'The highlighted CH₃ is the carbon that took the proton. Follow the Br and the double bond.',
});

/* ======================================================================
   4. Other electrophiles: Br₂ through a bromonium ion.
   ====================================================================== */
FIGURES.push({
  id: 'bromonium-diene',
  section: 'diene-addition',
  anchor: '',
  alt: 'Top row: buta-1,3-diene below a Br–Br molecule; a curved arrow runs from the C1=C2 pi bond to the nearer bromine and another from the Br–Br bond onto the far bromine, which leaves as bromide. The result is a bromonium ion, a three-membered ring of C1, C2 and a positive bromine, with the C3=C4 double bond untouched; a curved arrow breaks the C2–Br bond onto bromine. Middle: the allylic cation left behind, with bromine on C1, dashed partial double bonds from C2 to C4 and a partial positive charge on C2 and on C4. Right: bromide bonds to C2, giving 3,4-dibromobut-1-ene, or to C4, giving 1,4-dibromobut-2-ene.',
  viewBox: '0 0 760 540',
  build() {
    let s = '';
    // ---- the pi bond attacks Br2 ----
    s += tg(122, 22, 'the π bond attacks Br₂');
    const d = chain(38, 150, DIENE, [2, 1, 2], { dx: 56 });
    s += d.s;
    const mid = P((d.p[0].x + d.p[1].x) / 2, 150);
    const ba = P(mid.x, 78), bb = P(mid.x + 64, 78);
    s += bond(ba, bb, { rFrom: 14, rTo: 14 });
    s += withPairs(ba, 'Br', [180, -90], 'hi') + lonePair(ba.x, ba.y, 135, { dist: 21 });
    s += withPairs(bb, 'Br', [-90, 0, 90]);
    s += curve(P(mid.x - 4, 142), P(ba.x - 3, ba.y + 14), { bow: -14, size: 7 });
    s += fromBond(ba, bb, P(bb.x - 8, bb.y - 15), -14, 6);

    s += arrow(P(236, 150), P(286, 150));

    // ---- the bromonium ion, which opens at C2 ----
    s += tg(420, 22, 'a bromonium ion across C1–C2');
    const q = [P(330, 160), P(390, 160), P(450, 160), P(510, 160)];
    const lab = ['H₂C', 'CH', 'CH', 'CH₂'];
    s += B(q[0], lab[0], q[1], lab[1]) + B(q[1], lab[1], q[2], lab[2]) + B(q[2], lab[2], q[3], lab[3], { order: 2 });
    const bp = P(360, 96);
    s += B(q[0], lab[0], bp, 'Br') + B(q[1], lab[1], bp, 'Br');
    s += withPairs(bp, 'Br', [-150, -30], 'hi');
    s += chg(bp.x - 30, bp.y + 12);
    q.forEach((p, i) => { s += A(p, lab[i]); s += tg(p.x, p.y + 32, 'C' + (i + 1)); });
    // the C2–Br bond breaks, its electrons going to bromine
    s += fromBond(q[1], bp, P(bp.x + 12, bp.y + 8), 16, -6);
    s += text(640, 118, '+ Br⁻', { cls: 'fg-lbl', size: 13 });
    s += tg(640, 156, 'C2–Br breaks:', 'fg-tag-good');
    s += tg(640, 174, 'the + lands next to C3=C4', 'fg-tag-good');

    s += rule(30, 218, 730, 218);

    // ---- the allylic cation, Br already on C1 ----
    s += tg(140, 262, 'one allylic cation');
    const cat = chain(40, 360, nums([{ l: 'H₂C', up: 'Br', upKind: 'hi' }, { l: 'CH', dplus: true }, { l: 'CH' }, { l: 'CH₂', dplus: true }]), [1, 'h', 'h'], { dx: 62 });
    s += cat.s;
    s += tg(133, 420, 'δ+ on C2 and on C4');

    s += arrow(P(262, 340), P(340, 300));
    s += tg(318, 290, 'Br⁻ at C2', 'fg-tag', 'end');
    s += arrow(P(262, 380), P(340, 440));
    s += tg(318, 450, 'Br⁻ at C4', 'fg-tag', 'end');

    s += chain(400, 300, nums([{ l: 'H₂C', up: 'Br', upKind: 'hi' }, { l: 'CH', up: 'Br' }, { l: 'CH' }, { l: 'CH₂' }]), [1, 1, 2], { dx: 62 }).s;
    s += lbl(493, 356, '3,4-dibromobut-1-ene');
    s += tg(680, 300, '1,2-product', 'fg-tag');
    s += rule(370, 380, 730, 380);
    s += chain(400, 470, nums([{ l: 'H₂C', up: 'Br', upKind: 'hi' }, { l: 'CH' }, { l: 'CH' }, { l: 'CH₂', up: 'Br' }]), [1, 2, 1], { dx: 62 }).s;
    s += lbl(493, 526, '1,4-dibromobut-2-ene');
    s += tg(680, 470, '1,4-product', 'fg-tag');
    return s;
  },
  caption: 'The highlighted Br is the one the π bond picked up. From the allylic cation on, the story is the HBr one.',
});

/* ======================================================================
   5. The same cation from the substitution side: allylic rearrangement.
   ====================================================================== */
FIGURES.push({
  id: 'allylic-rearrangement',
  section: 'diene-addition',
  anchor: '',
  alt: 'Left: 3-bromobut-1-ene, with bromine on C2 and a C3=C4 double bond. An arrow labeled Br⁻ leaves points to the allylic cation, with dashed partial double bonds from C2 to C4 and a partial positive charge on C2 and C4. Water then bonds to C2, giving but-3-en-2-ol, or to C4, giving but-2-en-1-ol, in which the OH and the double bond have both moved.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    s += tg(118, 70, '3-bromobut-1-ene');
    s += chain(34, 150, nums([{ l: 'H₃C' }, { l: 'CH', down: 'Br' }, { l: 'CH' }, { l: 'CH₂' }]), [1, 1, 2], { dx: 56 }).s;

    s += arrow(P(222, 150), P(274, 150));
    s += tg(248, 124, 'Br⁻ leaves');

    s += chain(300, 150, nums([{ l: 'H₃C' }, { l: 'CH', dplus: true }, { l: 'CH' }, { l: 'CH₂', dplus: true }]), [1, 'h', 'h'], { dx: 56 }).s;
    s += tg(384, 214, 'the same allylic cation');
    s += tg(384, 232, 'H₂O bonds to C2 or C4,');
    s += tg(384, 250, 'then loses H⁺');

    s += arrow(P(490, 132), P(540, 96));
    s += arrow(P(490, 168), P(540, 206));

    s += chain(566, 90, [{ l: 'H₃C' }, { l: 'CH', down: 'OH' }, { l: 'CH' }, { l: 'CH₂' }], [1, 1, 2], { dx: 52 }).s;
    s += lbl(644, 40, 'but-3-en-2-ol');
    s += chain(566, 234, [{ l: 'H₃C' }, { l: 'CH' }, { l: 'CH' }, { l: 'CH₂', down: 'OH' }], [1, 2, 1], { dx: 52 }).s;
    s += lbl(644, 196, 'but-2-en-1-ol');
    return s;
  },
  caption: 'Water can bond to the carbon the bromine left or to the far end of the allylic cation.',
});

/* ======================================================================
   6. The ratio at two temperatures, and the warming experiment.
   ====================================================================== */
FIGURES.push({
  id: 'diene-ratio',
  section: 'diene-addition',
  lessons: ['diene-addition'],
  anchor: '',
  alt: 'Three bars. HBr plus buta-1,3-diene at minus 80 degrees C: 80 percent 1,2-product, 20 percent 1,4-product. The same reaction at 40 degrees C: 15 percent 1,2-product, 85 percent 1,4-product. Pure 1,2-product warmed to 40 degrees C with a trace of HBr: the same 15 to 85 mixture.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    const W = 300, x = 20;
    const row = (y, title, pct12) => {
      const w1 = (W * pct12) / 100;
      let t = tg(x, y - 16, title, 'fg-tag', 'start');
      t += bar(x, y - 11, w1, 22, { kind: 'hi', opacity: 0.4 });
      t += bar(x + w1, y - 11, W - w1, 22, { kind: 'warn', opacity: 0.4 });
      t += tg(x, y + 30, `1,2: ${pct12}%`, 'fg-tag', 'start');
      t += tg(x + W, y + 30, `1,4: ${100 - pct12}%`, 'fg-tag', 'end');
      return t;
    };
    s += row(40, 'HBr + diene at −80 °C', 80);
    s += row(126, 'HBr + diene at 40 °C', 15);
    s += rule(20, 180, 320, 180);
    s += row(226, 'pure 1,2-product, 40 °C, trace HBr', 15);
    s += tg(170, 290, 'same mixture: the products interconvert', 'fg-tag-good');
    return s;
  },
  caption: 'The left part of each bar is the 1,2-product and the right part the 1,4-product.',
});

/* ======================================================================
   7. Why the 1,2-product forms faster: the major resonance form.
   ====================================================================== */
FIGURES.push({
  id: 'diene-rate',
  section: 'diene-addition',
  lessons: ['diene-addition'],
  anchor: '',
  alt: 'The two resonance forms of the cation. With the charge on C2, the charged carbon is bonded to two carbons, C1 and C3: a secondary cation and the major form. With the charge on C4, it is bonded to one carbon, C3: a primary cation and the minor form. More of the positive charge therefore sits on C2, and bromide bonds there faster.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    s += chain(65, 50, FORM_C2.map((g, i) => (i === 0 ? { ...g, kind: undefined } : g)), [1, 1, 2], { dx: 70 }).s;
    s += tg(170, 110, 'charge on C2: 2°, the major form', 'fg-tag-good');
    s += resonanceV(170, 138);
    s += chain(65, 190, FORM_C4.map((g, i) => (i === 0 ? { ...g, kind: undefined } : g)), [1, 2, 1], { dx: 70 }).s;
    s += tg(170, 250, 'charge on C4: 1°, the minor form', 'fg-tag-mut');
    s += rule(20, 266, 320, 266);
    s += tg(170, 288, 'more + on C2, so Br⁻ bonds there faster');
    return s;
  },
  caption: 'Count the carbons bonded to the charged carbon in each form.',
});

/* ======================================================================
   8. Why the 1,4-product is more stable: count the carbons on the C=C.
   ====================================================================== */
FIGURES.push({
  id: 'diene-stability',
  section: 'diene-addition',
  lessons: ['diene-addition'],
  anchor: '',
  alt: 'The two products with their alkene carbons highlighted. In 3-bromobut-1-ene the C=C is at the end of the chain and one carbon, C2, is bonded to it: a monosubstituted alkene. In 1-bromobut-2-ene the C=C is in the middle and two carbons, C1 and C4, are bonded to it: a disubstituted alkene, the more stable of the two.',
  viewBox: '0 0 340 390',
  build() {
    let s = '';
    s += lbl(170, 20, '3-bromobut-1-ene');
    s += chain(65, 64, nums([{ l: 'H₃C' }, { l: 'CH', down: 'Br', downKind: 'plain', kind: 'warn' }, { l: 'CH', kind: 'hi' }, { l: 'CH₂', kind: 'hi' }]), [1, 1, 2], { dx: 70 }).s;
    s += tg(170, 160, 'one carbon on the C=C:', 'fg-tag-mut');
    s += tg(170, 178, 'monosubstituted', 'fg-tag-mut');
    s += rule(20, 196, 320, 196);
    s += lbl(170, 220, '1-bromobut-2-ene');
    s += chain(65, 264, nums([{ l: 'H₃C', kind: 'warn' }, { l: 'CH', kind: 'hi' }, { l: 'CH', kind: 'hi' }, { l: 'CH₂', down: 'Br', downKind: 'plain', kind: 'warn' }]), [1, 2, 1], { dx: 70 }).s;
    s += tg(170, 356, 'two carbons on the C=C:', 'fg-tag-good');
    s += tg(170, 374, 'disubstituted, more stable', 'fg-tag-good');
    return s;
  },
  caption: 'The highlighted groups are the alkene carbons. The red groups are the carbons bonded to them.',
});

/* ======================================================================
   9–10. Worked examples on unsymmetrical dienes: try both ends, keep the
         better cation, then capture it at each end.
   ====================================================================== */
/* cfg: { title, diene, orders, c1: [formA, ordersA, formB, ordersB, 'deg ↔ deg'],
   c4: [...], p12: [groups, orders, name], p14: [...], best } */
function worked(cfg) {
  let s = '';
  const dx = 50;
  const n = cfg.diene.length;
  const cx = (x0) => x0 + ((n - 1) * dx) / 2;
  // row 1: the diene
  const x1 = 380 - ((n - 1) * dx) / 2;
  s += tg(x1 - 30, 96, cfg.title, 'fg-tag', 'end');
  s += chain(x1, 88, cfg.diene, cfg.orders, { dx }).s;
  s += rule(20, 140, 740, 140);
  // rows 2 and 3: the two protonations
  const route = (y, name, r, good) => {
    let t = tg(62, y + 4, name, good ? 'fg-tag' : 'fg-tag-mut');
    t += chain(122, y, r[0], r[1], { dx }).s;
    t += resonance(cx(122) + ((n - 1) * dx) / 2 + 44, y);
    t += chain(cx(122) + ((n - 1) * dx) / 2 + 88, y, r[2], r[3], { dx }).s;
    t += tg(690, y - 6, r[4], good ? 'fg-tag-good' : 'fg-tag-mut');
    t += tg(690, y + 12, good ? 'this end wins' : 'this end loses', good ? 'fg-tag-good' : 'fg-tag-mut');
    return t;
  };
  s += route(206, 'H⁺ to C1', cfg.c1, true);
  s += rule(20, 262, 740, 262);
  s += route(328, 'H⁺ to C4', cfg.c4, false);
  s += rule(20, 390, 740, 390);
  // row 4: the two products of the winning cation
  const px1 = 190 - ((n - 1) * dx) / 2, px2 = 570 - ((n - 1) * dx) / 2;
  s += chain(px1, 466, cfg.p12[0], cfg.p12[1], { dx }).s;
  s += chain(px2, 466, cfg.p14[0], cfg.p14[1], { dx }).s;
  s += lbl(190, 564, cfg.p12[2]);
  s += tg(190, 584, '1,2-product: forms faster, wins cold');
  s += lbl(570, 564, cfg.p14[2]);
  s += tg(570, 584, `1,4-product: ${cfg.p14[3]} C=C, wins warm`);
  return s;
}

const ISO = {
  title: 'isoprene',
  diene: nums([{ l: 'H₂C' }, { l: 'C', up: 'CH₃' }, { l: 'CH' }, { l: 'CH₂' }]),
  orders: [2, 1, 2],
  c1: [
    nums([{ l: 'H₃C', kind: 'hi' }, { l: 'C', up: 'CH₃', kind: 'warn', chg: true }, { l: 'CH' }, { l: 'CH₂' }]), [1, 1, 2],
    nums([{ l: 'H₃C', kind: 'hi' }, { l: 'C', up: 'CH₃' }, { l: 'CH' }, { l: 'CH₂', kind: 'warn', chg: true }]), [1, 2, 1],
    'forms: 3° and 1°',
  ],
  c4: [
    nums([{ l: 'H₂C' }, { l: 'C', up: 'CH₃' }, { l: 'CH', kind: 'warn', chg: true }, { l: 'CH₃', kind: 'hi' }]), [2, 1, 1],
    nums([{ l: 'H₂C', kind: 'warn', chg: true }, { l: 'C', up: 'CH₃' }, { l: 'CH' }, { l: 'CH₃', kind: 'hi' }]), [1, 2, 1],
    'forms: 2° and 1°',
  ],
  p12: [nums([{ l: 'H₃C', kind: 'hi' }, { l: 'C', up: 'CH₃', down: 'Br' }, { l: 'CH' }, { l: 'CH₂' }]), [1, 1, 2], '3-bromo-3-methylbut-1-ene'],
  p14: [nums([{ l: 'H₃C', kind: 'hi' }, { l: 'C', up: 'CH₃' }, { l: 'CH' }, { l: 'CH₂', down: 'Br' }]), [1, 2, 1], '1-bromo-3-methylbut-2-ene', 'trisubstituted'],
};

const MPD = {
  title: '2-methylpenta-1,3-diene',
  diene: nums([{ l: 'H₂C' }, { l: 'C', up: 'CH₃' }, { l: 'CH' }, { l: 'CH' }, { l: 'CH₃' }]),
  orders: [2, 1, 2, 1],
  c1: [
    nums([{ l: 'H₃C', kind: 'hi' }, { l: 'C', up: 'CH₃', kind: 'warn', chg: true }, { l: 'CH' }, { l: 'CH' }, { l: 'CH₃' }]), [1, 1, 2, 1],
    nums([{ l: 'H₃C', kind: 'hi' }, { l: 'C', up: 'CH₃' }, { l: 'CH' }, { l: 'CH', kind: 'warn', chg: true }, { l: 'CH₃' }]), [1, 2, 1, 1],
    'forms: 3° and 2°',
  ],
  c4: [
    nums([{ l: 'H₂C' }, { l: 'C', up: 'CH₃' }, { l: 'CH', kind: 'warn', chg: true }, { l: 'CH₂', kind: 'hi' }, { l: 'CH₃' }]), [2, 1, 1, 1],
    nums([{ l: 'H₂C', kind: 'warn', chg: true }, { l: 'C', up: 'CH₃' }, { l: 'CH' }, { l: 'CH₂', kind: 'hi' }, { l: 'CH₃' }]), [1, 2, 1, 1],
    'forms: 2° and 1°',
  ],
  p12: [nums([{ l: 'H₃C', kind: 'hi' }, { l: 'C', up: 'CH₃', down: 'Br' }, { l: 'CH' }, { l: 'CH' }, { l: 'CH₃' }]), [1, 1, 2, 1], '4-bromo-4-methylpent-2-ene'],
  p14: [nums([{ l: 'H₃C', kind: 'hi' }, { l: 'C', up: 'CH₃' }, { l: 'CH' }, { l: 'CH', down: 'Br' }, { l: 'CH₃' }]), [1, 2, 1, 1], '4-bromo-2-methylpent-2-ene', 'trisubstituted'],
};

FIGURES.push({
  id: 'isoprene-worked',
  section: 'diene-addition',
  anchor: '',
  alt: 'Isoprene, CH2=C(CH3)–CH=CH2, numbered C1 to C4 with the methyl on C2. Proton to C1: the cation has a tertiary form with the charge on C2 and a primary form with the charge on C4. Proton to C4: the cation has a secondary form with the charge on C3 and a primary form with the charge on C1. The C1 route wins. Its cation gives 3-bromo-3-methylbut-1-ene when bromide bonds to C2, the faster product, and 1-bromo-3-methylbut-2-ene, with a trisubstituted double bond, when bromide bonds to C4.',
  viewBox: '0 0 760 600',
  build() { return worked(ISO); },
  caption: 'Compare the best form of each cation, then let bromide bond to each end of the winner. The numbers are the diene’s.',
});

FIGURES.push({
  id: 'methylpentadiene-worked',
  section: 'diene-addition',
  anchor: '',
  alt: '2-Methylpenta-1,3-diene, CH2=C(CH3)–CH=CH–CH3, numbered C1 to C5 with the methyl on C2. Proton to C1: the cation has a tertiary form with the charge on C2 and a secondary form with the charge on C4. Proton to C4: the cation has a secondary form with the charge on C3 and a primary form with the charge on C1. The C1 route wins. Bromide at C2 gives 4-bromo-4-methylpent-2-ene, the faster product; bromide at C4 gives 4-bromo-2-methylpent-2-ene, whose double bond is trisubstituted.',
  viewBox: '0 0 760 600',
  build() { return worked(MPD); },
  caption: 'The same moves as for isoprene: try both ends, keep the better cation, then let bromide bond to each of its ends.',
});

/* Lesson copies: isoprene, stacked, with only the best form of each route. */
FIGURES.push({
  id: 'l-isoprene',
  lessons: ['diene-addition'],
  anchor: '',
  alt: 'Isoprene numbered C1 to C4 with the methyl on C2. Proton to C1 leaves the charge on C2, a tertiary carbon. Proton to C4 leaves the charge on C3, a secondary carbon. The C1 cation gives 3-bromo-3-methylbut-1-ene when bromide bonds to C2 and 1-bromo-3-methylbut-2-ene when it bonds to C4.',
  viewBox: '0 0 340 750',
  build() {
    let s = '';
    const dx = 66, x0 = 71;
    s += tg(20, 18, 'isoprene', 'fg-tag', 'start');
    s += chain(x0, 80, ISO.diene, ISO.orders, { dx }).s;
    s += rule(20, 128, 320, 128);
    s += chain(x0, 196, ISO.c1[0], ISO.c1[1], { dx }).s;
    s += tg(170, 250, 'H⁺ to C1: best form is 3°', 'fg-tag-good');
    s += rule(20, 264, 320, 264);
    s += chain(x0, 332, ISO.c4[0], ISO.c4[1], { dx }).s;
    s += tg(170, 386, 'H⁺ to C4: best form is 2°', 'fg-tag-mut');
    s += rule(20, 400, 320, 400);
    s += chain(x0, 468, ISO.p12[0], ISO.p12[1], { dx }).s;
    s += tg(170, 562, '1,2: Br⁻ at C2 (faster)');
    s += rule(20, 576, 320, 576);
    s += chain(x0, 644, ISO.p14[0], ISO.p14[1], { dx }).s;
    s += tg(170, 740, '1,4: Br⁻ at C4 (more stable)');
    return s;
  },
  caption: 'Only the best resonance form of each cation is drawn.',
});

/* The final question's diene, numbered and nothing else. */
FIGURES.push({
  id: 'l-methylpentadiene',
  lessons: ['diene-addition'],
  anchor: '',
  alt: '2-Methylpenta-1,3-diene, CH2=C(CH3)–CH=CH–CH3, numbered C1 to C5 with the methyl on C2 and double bonds C1=C2 and C3=C4.',
  viewBox: '0 0 340 140',
  build() {
    let s = '';
    s += tg(20, 18, '2-methylpenta-1,3-diene', 'fg-tag', 'start');
    s += chain(58, 88, MPD.diene, MPD.orders, { dx: 56 }).s;
    return s;
  },
  caption: 'C1 and C4 are the two ends of the conjugated system.',
});

export default FIGURES;
