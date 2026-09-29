/* Figures for the cis-trans-ez notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* The chair, taken from the one already drawn in axial-equatorial (the
   twelve-position figure), so a new drawing cannot disagree with the book's
   own reference. Offsets are relative to the ring center; axial is vertical
   and alternates, and each equatorial unit vector is the one that figure
   uses, which is parallel to the ring bond two carbons round and tilted
   OPPOSITE to that carbon's axial. Getting that tilt backwards is the
   classic bad chair, so it is measured here rather than re-derived. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];
function chair(cx, cy, k = 1) {
  return CHAIR_V.map((v) => P(cx + v.x * k, cy + v.y * k));
}
const chairRing = (pts, cls) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');
/* Axial: straight up on the even carbons, straight down on the odd ones. */
const axialEnd = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? -L : L));
/* Equatorial: outward, and tilted the other way from that carbon's axial. */
const equatorialEnd = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y + CHAIR_EQ[i].y * L);


/* ---------------------------------------------------------------- 8.2 ---
   E/Z was defined and never performed. This is the assignment done on the
   compound the pitfall is about, with the two rankings kept visibly
   separate, because comparing across the double bond is the actual error. */
FIGURES.push({
  id: 'ez-worked',
  section: 'cis-trans-ez',
  anchor: 'outranks its methyl.</p>\n</div>',
  alt: '2-bromo-2-butene drawn skeletally with its two methyl groups on opposite sides of the double bond, which looks trans. The bromine on C2 outranks the methyl on C2, and the methyl on C3 outranks the hydrogen on C3. The two winners, bromine and the C4 methyl, are both above the double bond, so the compound is Z.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    s += tag(196, 38, 'drawn the way anyone would call "trans"');
    const p0 = P(112, 214), p1 = P(176, 172), p2 = P(240, 214), p3 = P(304, 172);
    s += sk(p0, p1);
    s += skDouble(p1, p2, P(208, 240));
    s += sk(p2, p3);
    const br = P(176, 104), h = P(240, 278);
    s += bond(p1, br, { rFrom: 0, rTo: 16 });
    s += bond(p2, h, { rFrom: 0, rTo: 13 });
    s += atom(br.x, br.y, 'Br', { kind: 'hi', r: 16 });
    s += atom(h.x, h.y, 'H', { r: 13 });
    s += text(96, 236, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(176, 156, 'C2', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(248, 232, 'C3', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(320, 156, 'C4', { cls: 'fg-sm', size: 9.5 });
    s += text(196, 306, 'the two methyls, C1 and C4, are on opposite sides', { cls: 'fg-sm', size: 9.5 });

    s += rule(370, 60, 370, 290);

    s += tag(566, 38, 'but rank each carbon separately');
    const row = (y, head, win, lose, verdict) => {
      let g = text(408, y, head, { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
      g += text(408, y + 20, win, { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
      g += text(408, y + 38, lose, { cls: 'fg-sm', size: 10, anchor: 'start' });
      g += text(736, y + 20, verdict, { cls: 'fg-sm', size: 10, anchor: 'end' });
      return g;
    };
    s += row(96, 'On C2:  Br  against  CH₃', 'Br wins — atomic number 35 beats 6', 'nothing else is compared', 'points UP');
    s += row(176, 'On C3:  CH₃  against  H', 'CH₃ wins — carbon beats hydrogen', 'nothing else is compared', 'points UP');
    s += text(408, 234, 'Both winners on the same side:', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(566, 262, '(Z)-2-bromo-2-butene', { cls: 'fg-tag-good', size: 12.5 });

    s += rule(30, 290, 730, 290);
    s += text(380, 326, 'Same molecule, two labels: "trans" was reporting the methyls, E/Z reports the priorities.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'One assignment, done in full. Each alkene carbon is ranked on its own two groups and nothing else — the bromine on C2 is never weighed against the methyl on C3. Here both winners finish above the double bond, so the alkene is Z even though the carbon skeleton is drawn trans.',
  note: 'The error this drawing is built to prevent: comparing a group on one alkene carbon with a group on the other. That question has no meaning. E/Z asks two independent questions and then compares only the two answers.',
});

/* ------------------------------------------------------------- 30.1 ---
   Cis and trans on a ring, read straight off wedges and hashes. */
FIGURES.push({
  id: 'ring-cis-trans-faces',
  section: 'cis-trans-ez',
  anchor: 'and the locants say the rest.</p>',
  alt: 'Two flat hexagon drawings of 1,2-dimethylcyclohexane. On the left both methyl groups sit on bold wedges, so both are above the ring, which is the cis isomer. On the right one methyl is on a wedge and the other on a hashed bond, so one is above the ring and one below, which is the trans isomer.',
  viewBox: '0 0 760 330',
  build() {
    const verts = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = ((-90 + i * 60) * Math.PI) / 180;
        v.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return v;
    };
    const draw = (cx, cis) => {
      const v = verts(cx, 140, 58);
      let out = '';
      for (let i = 0; i < 6; i++) out += sk(v[i], v[(i + 1) % 6]);
      const c1 = v[2], c2 = v[3];
      const m1 = P(c1.x + 52, c1.y + 30), m2 = P(c2.x, c2.y + 58);
      out += wedge(c1, m1, { rFrom: 0, rTo: 18 });
      out += (cis ? wedge : hash)(c2, m2, { rFrom: 0, rTo: 18 });
      out += atom(m1.x, m1.y, 'CH₃', { r: 18 });
      out += atom(m2.x, m2.y, 'CH₃', { r: 18 });
      out += text(c1.x + 16, c1.y - 8, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      out += text(c2.x - 18, c2.y + 2, 'C2', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      return out;
    };
    let s = '';
    s += panel(20, 36, 340, 242, { kind: 'hi' });
    s += tag(190, 26, 'both on a wedge — same face');
    s += draw(190, true);
    s += text(190, 300, 'cis-1,2-dimethylcyclohexane', { cls: 'fg-tag-good', size: 12 });
    s += panel(400, 36, 340, 242, { kind: 'warn' });
    s += tag(570, 26, 'one wedge, one hash — opposite faces');
    s += draw(570, false);
    s += text(570, 300, 'trans-1,2-dimethylcyclohexane', { cls: 'fg-tag-warn', size: 12 });
    s += text(380, 324, 'Wedge is above the ring, hash is below. Same face is cis, opposite faces trans.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Cis and trans on a ring, with nothing to compute. A wedge puts the group above the plane of the ring and a hash puts it below, so the question is only whether the two substituents are drawn on the same kind of bond. That reading is identical for a 1,2-, a 1,3- or a 1,4-disubstituted ring — the locants say how far apart the groups are, and the wedges say which face each one is on.',
  note: 'A chair flip does not touch this. Flipping exchanges axial for equatorial at every carbon, which changes the energy of the conformer; the group that was above the ring is still above the ring when the flip is finished. Configuration survives a ring flip, position does not.',
});

/* ------------------------------------------------------------- 30.2 ---
   Where the two words stop working, in one row of three. */
FIGURES.push({
  id: 'cis-trans-runs-out',
  section: 'cis-trans-ez',
  anchor: 'it has run out of definition, and the compound still has two distinct geometric isomers that need naming.</p>',
  alt: 'Three alkenes side by side. Cis-but-2-ene has its two methyl groups on the same side of the double bond and one hydrogen on each alkene carbon. Trans-but-2-ene has them on opposite sides. 3-methylpent-2-ene has a methyl and an ethyl group on the right-hand alkene carbon and no hydrogen there, so neither cis nor trans can be assigned to it.',
  viewBox: '0 0 760 316',
  build() {
    let s = '';
    const me = (x, y) => atom(x, y, 'CH₃', { r: 17 });

    s += panel(14, 36, 236, 200, { kind: 'hi' });
    s += bond(P(72, 182), P(114, 150), { rFrom: 17, rTo: 0 });
    s += skDouble(P(114, 150), P(158, 150), P(136, 192));
    s += bond(P(158, 150), P(200, 182), { rFrom: 0, rTo: 17 });
    s += bond(P(114, 150), P(114, 104), { rFrom: 0, rTo: 12 });
    s += bond(P(158, 150), P(158, 104), { rFrom: 0, rTo: 12 });
    s += me(72, 182); s += me(200, 182);
    s += atom(114, 104, 'H', { r: 12 }); s += atom(158, 104, 'H', { r: 12 });

    s += panel(262, 36, 236, 200, { kind: 'hi' });
    s += bond(P(320, 182), P(362, 150), { rFrom: 17, rTo: 0 });
    s += skDouble(P(362, 150), P(406, 150), P(384, 192));
    s += bond(P(406, 150), P(448, 118), { rFrom: 0, rTo: 17 });
    s += bond(P(362, 150), P(362, 104), { rFrom: 0, rTo: 12 });
    s += bond(P(406, 150), P(406, 196), { rFrom: 0, rTo: 12 });
    s += me(320, 182); s += me(448, 118);
    s += atom(362, 104, 'H', { r: 12 }); s += atom(406, 196, 'H', { r: 12 });

    s += panel(494, 36, 236, 200, { kind: 'warn' });
    s += bond(P(538, 182), P(580, 150), { rFrom: 17, rTo: 0 });
    s += skDouble(P(580, 150), P(620, 150), P(600, 192));
    s += bond(P(580, 150), P(580, 104), { rFrom: 0, rTo: 12 });
    s += bond(P(620, 150), P(662, 104), { rFrom: 0, rTo: 17 });
    s += bond(P(620, 150), P(678, 186), { rFrom: 0, rTo: 27 });
    s += me(538, 182); s += me(662, 104);
    s += atom(580, 104, 'H', { r: 12 });
    s += atom(678, 186, 'CH₂CH₃', { r: 27 });

    s += text(132, 256, 'cis-but-2-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(380, 256, 'trans-but-2-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(612, 256, '3-methylpent-2-ene', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(132, 278, 'one H, one CH₃ per carbon', { cls: 'fg-sm', size: 10 });
    s += text(380, 278, 'same test, other answer', { cls: 'fg-sm', size: 10 });
    s += text(612, 278, 'no H on the right carbon', { cls: 'fg-sm', size: 10 });
    s += rule(24, 292, 720, 292);
    s += text(380, 312, 'Cis/trans needs one hydrogen and one other group on EACH carbon of the C=C.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The condition on cis and trans, and the case that violates it. In the first two panels each alkene carbon carries one hydrogen and one methyl, so “the substituent” means something and the two words divide the cases cleanly. In the third the right-hand carbon carries a methyl <i>and</i> an ethyl: one of them is cis to the left-hand methyl and the other is trans, so the question has no answer.',
  note: 'The third compound is not an edge case without isomers — it has two, and they are different substances. What it lacks is a name for them in this vocabulary, which is exactly the gap E/Z was invented to fill.',
});

/* ------------------------------------------------------------- 30.3 ---
   A tie broken one sphere out, and the size instinct that gets it wrong. */
FIGURES.push({
  id: 'ez-tie-one-sphere',
  section: 'cis-trans-ez',
  anchor: 'never a head count and never a size estimate.</p>\n</div>',
  alt: 'An alkene whose right-hand carbon carries a chloromethyl group and an isopropyl group. Both branches begin with carbon, so the comparison moves one sphere out: the chloromethyl carbon holds chlorine, hydrogen and hydrogen, while the isopropyl carbon holds carbon, carbon and hydrogen. Chlorine beats carbon at the first term, so the smaller chloromethyl group is the higher priority.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(190, 30, 'both branches start with carbon');
    s += bond(P(104, 116), P(150, 150), { rFrom: 17, rTo: 0 });
    s += skDouble(P(150, 150), P(200, 150), P(175, 190));
    s += bond(P(150, 150), P(150, 204), { rFrom: 0, rTo: 12 });
    s += bond(P(200, 150), P(250, 110), { rFrom: 0, rTo: 22 });
    s += bond(P(200, 150), P(252, 202), { rFrom: 0, rTo: 35 });
    s += atom(104, 116, 'CH₃', { r: 17 });
    s += atom(150, 204, 'H', { r: 12 });
    s += atom(250, 110, 'CH₂Cl', { kind: 'hi', r: 22 });
    s += atom(252, 202, 'CH(CH₃)₂', { r: 35 });
    s += text(138, 132, 'C2', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(212, 132, 'C3', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(190, 266, '3-(chloromethyl)-4-methylpent-2-ene', { cls: 'fg-sm', size: 10.5 });

    s += rule(350, 40, 350, 262);

    s += tag(556, 34, 'so move one sphere out and compare');
    s += text(390, 92, '–CH₂Cl  →  (Cl, H, H)', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(390, 120, '–CH(CH₃)₂  →  (C, C, H)', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(390, 154, 'Highest against highest: Cl (17) beats C (6).', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(390, 176, 'First point of difference — stop there.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(556, 208, '–CH₂Cl is the higher priority', { cls: 'fg-tag-good', size: 12 });
    s += text(556, 228, 'although isopropyl is the bigger group', { cls: 'fg-sm', size: 10.5 });
    s += text(556, 252, 'drawn as here, both winners are up: (Z)', { cls: 'fg-tag-good', size: 11.5 });
    s += text(380, 290, 'Size does not decide a CIP comparison. The first point of difference does.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'A tie at the first atom, broken one sphere out. Both groups on C3 attach through carbon, so the first sphere says nothing and you list what each of those carbons holds. Chlorine appears at the head of one set and carbon at the head of the other, so the comparison is over at the first term &mdash; and the branch with three carbons in it loses to the branch with one. As drawn, the C2 methyl and the C3 chloromethyl are both up, so this particular isomer is <b>(Z)-3-(chloromethyl)-4-methylpent-2-ene</b>.',
  note: 'This is the comparison students most often decide by eye. Bulk, mass and the number of atoms in a branch are all irrelevant to CIP; the sets are ordered high to low and read position by position, and the moment they differ the ranking is fixed.',
});

/* ------------------------------------------------------------- 30.4 ---
   Duplicated atoms: the device that makes a double bond comparable with a
   branch, and the sphere where it actually settles something. */
FIGURES.push({
  id: 'ez-duplicate-vinyl',
  section: 'cis-trans-ez',
  anchor: 'Their whole job is to be counted once in the sphere where they appear.</p>\n</div>',
  alt: 'A vinyl group beside an isopropyl group. The vinyl group’s double bond is redrawn with a phantom duplicate carbon on each end, so its attachment carbon counts as carbon, carbon, hydrogen — exactly what the isopropyl attachment carbon holds. One sphere further out the tie breaks: the vinyl terminal carbon counts as carbon, hydrogen, hydrogen while each isopropyl methyl is only hydrogen, hydrogen, hydrogen.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += panel(24, 40, 340, 200, { kind: 'hi' });
    s += tag(194, 30, 'vinyl  –CH=CH₂');
    s += bond(P(150, 110), P(214, 110), { order: 2, rFrom: 15, rTo: 18 });
    s += bond(P(150, 110), P(150, 64), { rFrom: 15, rTo: 17 });
    s += bond(P(214, 110), P(214, 64), { rFrom: 18, rTo: 17 });
    s += bond(P(150, 110), P(104, 140), { rFrom: 15, rTo: 12 });
    s += atom(104, 140, 'H', { r: 12 });
    s += atom(150, 110, 'C');
    s += atom(214, 110, 'CH₂', { r: 18 });
    s += atom(150, 64, '(C)', { kind: 'warn', r: 17 });
    s += atom(214, 64, '(C)', { kind: 'warn', r: 17 });
    s += text(194, 168, 'first sphere:  (C, C, H)', { cls: 'fg-lbl', size: 12 });
    s += text(194, 192, 'that CH₂ then holds (C, H, H)', { cls: 'fg-sm', size: 10.5 });
    s += text(194, 218, 'so vinyl wins one sphere later', { cls: 'fg-tag-good', size: 11 });

    s += panel(396, 40, 340, 200);
    s += tag(566, 30, 'isopropyl  –CH(CH₃)₂');
    s += bond(P(540, 110), P(600, 74), { rFrom: 15, rTo: 17 });
    s += bond(P(540, 110), P(600, 146), { rFrom: 15, rTo: 17 });
    s += bond(P(540, 110), P(494, 110), { rFrom: 15, rTo: 12 });
    s += atom(540, 110, 'C');
    s += atom(600, 74, 'CH₃', { r: 17 });
    s += atom(600, 146, 'CH₃', { r: 17 });
    s += atom(494, 110, 'H', { r: 12 });
    s += text(566, 192, 'first sphere:  (C, C, H)', { cls: 'fg-lbl', size: 12 });
    s += text(566, 218, 'each CH₃ holds only (H, H, H)', { cls: 'fg-sm', size: 10.5 });

    s += rule(24, 254, 736, 254);
    s += text(380, 278, 'Duplication creates the tie; the next sphere out breaks it. Vinyl beats isopropyl.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'What a duplicated atom is for. The vinyl carbon really carries one carbon and one hydrogen, but its partner is doubly bonded, so CIP writes that partner in twice — once real, once as the parenthesized phantom — and the set becomes (C, C, H). That is the same set the isopropyl carbon genuinely holds, so the first sphere is an exact tie and the comparison has to go out one more.',
  note: 'A phantom has no substituents of its own, so when the search reaches one it is a dead end and loses. Duplication is a bookkeeping device that makes a multiple bond comparable with a branch; it is not a way of scoring extra points.',
});

/* ------------------------------------------------------------- 30.5 ---
   Two double bonds, two descriptors, and where the locants go. */
FIGURES.push({
  id: 'ez-diene-locants',
  section: 'cis-trans-ez',
  anchor: 'one label per stereogenic unit, each carrying its locant.</p>\n</div>',
  alt: 'Hexa-2,4-diene drawn as a skeleton with its six carbons numbered. The C2 to C3 double bond has the C1 methyl below it and the C4 chain above it, on opposite sides, which makes it E. The C4 to C5 double bond has the C3 chain and the C6 methyl both below it, on the same side, which makes it Z. As numbered here the name is 2E,4Z-hexa-2,4-diene; because the chain reads the same from either end, IUPAC numbers it from the other end so that Z gets the lower locant, and the preferred name is 2Z,4E-hexa-2,4-diene.',
  viewBox: '0 0 760 300',
  build() {
    const c1 = P(96, 208), c2 = P(142, 182), c3 = P(188, 182),
          c4 = P(234, 156), c5 = P(280, 156), c6 = P(326, 182);
    let s = '';
    s += sk(c1, c2);
    s += skDouble(c2, c3, P(165, 220));
    s += sk(c3, c4);
    s += skDouble(c4, c5, P(257, 118));
    s += sk(c5, c6);
    s += text(96, 230, '1', { cls: 'fg-sm', size: 10 });
    s += text(134, 172, '2', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(196, 172, '3', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(226, 142, '4', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(288, 142, '5', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(326, 204, '6', { cls: 'fg-sm', size: 10 });
    s += text(211, 262, 'CH₃–CH=CH–CH=CH–CH₃', { cls: 'fg-sm', size: 10.5 });

    s += rule(360, 40, 360, 268);

    s += tag(548, 34, 'one descriptor per double bond');
    s += text(396, 92, 'C2=C3:  CH₃ and the C4 chain', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(396, 114, 'sit on opposite sides', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(688, 104, 'E', { cls: 'fg-tag-good', size: 16 });
    s += text(396, 160, 'C4=C5:  the C3 chain and CH₃', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(396, 182, 'sit on the same side', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(688, 172, 'Z', { cls: 'fg-tag-good', size: 16 });
    s += text(548, 226, '(2E,4Z) as numbered here', { cls: 'fg-tag-good', size: 13 });
    s += text(548, 250, 'preferred: (2Z,4E), since Z takes the lower locant', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 292, 'Two stereogenic double bonds, two letters, and both of them go in the name.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'A diene needs a descriptor for every stereogenic double bond it has, and each one carries the locant of the lower-numbered carbon it spans. Both bonds here have one hydrogen and one carbon chain on each of their carbons, so the chain is the higher priority every time and E/Z agrees with trans/cis — which is the ordinary case, not a rule.',
  note: 'The descriptors go inside one set of parentheses at the front of the name, in locant order, exactly as (2R,3S) does for two stereocenters. A name that omits one of them is incomplete, not merely informal.',
});

/* ------------------------------------------------------------- 30.6 ---
   The reading is the same for 1,3 and 1,4 as it is for 1,2 — which is easy
   to assert and easy to doubt, so it gets drawn — and the translation into
   axial/equatorial, which flips over on an odd spacing. */
FIGURES.push({
  id: 'ring-cis-trans-locants',
  section: 'cis-trans-ez',
  anchor: 'For naming, the only question asked here is same face or opposite face.</p>',
  alt: 'Two more flat ring drawings. On the left, 1,3-dimethylcyclohexane with both methyl groups on bold wedges, which is the cis isomer. On the right, 1,4-dimethylcyclohexane with one methyl on a wedge and one on a hashed bond, which is the trans isomer. Below them a three-row table giving, for 1,2-, 1,3- and 1,4-disubstituted rings, which of cis and trans puts the two groups one axial and one equatorial and which allows both axial or both equatorial.',
  viewBox: '0 0 760 470',
  build() {
    const verts = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = ((-90 + i * 60) * Math.PI) / 180;
        v.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return v;
    };
    let s = '';

    /* ---- left: cis-1,3, two wedges on carbons one apart ---- */
    s += panel(20, 36, 340, 250, { kind: 'hi' });
    s += tag(190, 26, 'both on a wedge — same face');
    {
      const v = verts(190, 158, 52);
      for (let i = 0; i < 6; i++) s += sk(v[i], v[(i + 1) % 6]);
      const c1 = v[0], c3 = v[2];
      const m1 = P(c1.x, c1.y - 46), m3 = P(c3.x + 40, c3.y + 24);
      s += wedge(c1, m1, { rFrom: 0, rTo: 18 });
      s += wedge(c3, m3, { rFrom: 0, rTo: 18 });
      s += atom(m1.x, m1.y, 'CH₃', { r: 18 });
      s += atom(m3.x, m3.y, 'CH₃', { r: 18 });
      s += text(c1.x - 26, c1.y - 2, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      s += text(c3.x + 8, c3.y + 34, 'C3', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    }
    s += text(190, 306, 'cis-1,3-dimethylcyclohexane', { cls: 'fg-tag-good', size: 12 });

    /* ---- right: trans-1,4, a wedge and a hash across the ring ---- */
    s += panel(400, 36, 340, 250, { kind: 'warn' });
    s += tag(570, 26, 'one wedge, one hash — opposite faces');
    {
      const v = verts(570, 158, 52);
      for (let i = 0; i < 6; i++) s += sk(v[i], v[(i + 1) % 6]);
      const c1 = v[0], c4 = v[3];
      const m1 = P(c1.x, c1.y - 46), m4 = P(c4.x, c4.y + 46);
      s += wedge(c1, m1, { rFrom: 0, rTo: 18 });
      s += hash(c4, m4, { rFrom: 0, rTo: 18 });
      s += atom(m1.x, m1.y, 'CH₃', { r: 18 });
      s += atom(m4.x, m4.y, 'CH₃', { r: 18 });
      s += text(c1.x - 26, c1.y - 2, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      s += text(c4.x - 26, c4.y + 6, 'C4', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    }
    s += text(570, 306, 'trans-1,4-dimethylcyclohexane', { cls: 'fg-tag-warn', size: 12 });

    /* ---- the chair translation, which is the part that flips over ---- */
    s += rule(40, 330, 720, 330);
    s += text(40, 354, 'in a chair', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(250, 354, 'cis', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(500, 354, 'trans', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    const ROWS = [
      ['1,2-', 'one axial, one equatorial', 'both equatorial (or both axial)'],
      ['1,3-', 'both equatorial (or both axial)', 'one axial, one equatorial'],
      ['1,4-', 'one axial, one equatorial', 'both equatorial (or both axial)'],
    ];
    ROWS.forEach(([lab, a, b], i) => {
      const y = 382 + i * 26;
      s += text(40, y, lab, { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
      s += text(250, y, a, { cls: 'fg-sm', size: 11, anchor: 'start' });
      s += text(500, y, b, { cls: 'fg-sm', size: 11, anchor: 'start' });
    });
    s += text(380, 462, 'The 1,3- row is the one that trades places. Naming never uses this table — conformational analysis does.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The same wedge-and-hash reading on the two spacings the 1,2- figure did not draw. Two wedges are two groups on the same face, so the 1,3 compound on the left is <b>cis</b> however far apart its methyls are; a wedge and a hash are opposite faces, so the 1,4 compound on the right is <b>trans</b>. The locants change nothing about the test.',
  note: 'The table underneath is a different question, and the row that catches people is the middle one. Axial directions alternate around the ring, so on carbons an <i>even</i> number apart (1,3-) the two axial positions point the same way and cis can be diequatorial, while on carbons an <i>odd</i> number apart (1,2- and 1,4-) they point opposite ways and cis is forced into axial/equatorial. None of that changes cis or trans &mdash; it only decides which conformer is cheap.',
});

export default FIGURES;
