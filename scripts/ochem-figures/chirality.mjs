/* Figures for the chirality notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- ch6.1 ---
   The symmetry test, run. The section states the test and then goes to hands
   and screws without ever performing it on a molecule. */
FIGURES.push({
  id: 'symmetry-test-worked',
  section: 'chirality',
  anchor: 'This is the most common source of wrong answers in this section.</div>',
  alt: 'Two wedge-dash structures. 2-chloropropane has a methyl on each side of a vertical mirror line, so the line is a genuine plane of symmetry and the molecule is achiral. 2-chlorobutane has a methyl on one side and an ethyl on the other, so no such plane exists and the molecule is chiral.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const draw = (cx, left, right, ok) => {
      const c = P(cx, 154);
      const lr = left.length > 3 ? 23 : 17, rr = right.length > 3 ? 23 : 17;
      const lLen = left.length > 3 ? 78 : 66, rLen = right.length > 3 ? 78 : 66;
      // the candidate plane first, so the atoms sit on top of it
      let g = `<line class="fg-dash-hi" x1="${cx}" y1="64" x2="${cx}" y2="250"></line>`;
      g += center(c, [
        { deg: 160, len: lLen, rTo: lr },
        { deg: 20, len: rLen, rTo: rr },
        { deg: 270, len: 62, kind: 'wedge', rTo: 16 },
        { deg: 90, len: 62, kind: 'hash', rTo: 12 },
      ]);
      const L = armEnd(c, 160, lLen), R = armEnd(c, 20, rLen);
      const D = armEnd(c, 270, 62), U = armEnd(c, 90, 62);
      g += atom(c.x, c.y, 'C', { kind: 'hi' });
      g += atom(L.x, L.y, left, { r: lr, size: left.length > 3 ? 9 : 10 });
      g += atom(R.x, R.y, right, { r: rr, size: right.length > 3 ? 9 : 10 });
      g += atom(D.x, D.y, 'Cl', { kind: 'warn' });
      g += atom(U.x, U.y, 'H', { r: 12 });
      g += text(D.x + 24, D.y + 4, 'wedge', { cls: 'fg-sm', size: 9, anchor: 'start' });
      g += text(U.x + 20, U.y + 4, 'hash', { cls: 'fg-sm', size: 9, anchor: 'start' });
      g += text(cx, 54, ok ? 'a real plane of symmetry' : 'not a plane of symmetry',
        { cls: ok ? 'fg-tag-good' : 'fg-tag-warn', size: 11 });
      return g;
    };
    s += panel(24, 38, 340, 254, { kind: 'hi' });
    s += draw(194, 'CH₃', 'CH₃', true);
    s += text(194, 278, '2-chloropropane — ACHIRAL', { cls: 'fg-tag-good', size: 11 });
    s += text(194, 310, 'Reflect left into right: methyl onto methyl,', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 324, 'Cl onto Cl, H onto H. The molecule is unchanged.', { cls: 'fg-sm', size: 9.5 });

    s += panel(396, 38, 340, 254, { kind: 'warn' });
    s += draw(566, 'CH₃', 'CH₂CH₃', false);
    s += text(566, 278, '2-chlorobutane — CHIRAL', { cls: 'fg-tag-warn', size: 11 });
    s += text(566, 310, 'The same reflection sends methyl onto ethyl,', { cls: 'fg-sm', size: 9.5 });
    s += text(566, 324, 'which is a different molecule, not this one.', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'The test, run twice on almost the same molecule. Both drawings put Cl on a wedge and H on a hash, so both are mirror-symmetric about the vertical line <b>as far as those two go</b>. Everything turns on what sits left and right of the line: two methyls reflect onto each other and the plane is real, while a methyl and an ethyl do not, and no other plane exists in any conformation.',
  note: 'One carbon’s difference between the two, and it is the difference between a compound that has an enantiomer and one that does not. When you think you have found a plane, name the pair of groups it exchanges and check they are identical all the way out — that is the step that gets skipped.',
});

/* ---------------------------------------------------------------- ch6.2 ---
   Chirality with no stereocenter anywhere. The prose asks the reader to
   picture an allene's two perpendicular ends and a biaryl frozen by its
   ortho groups, which is precisely what prose cannot do. */
FIGURES.push({
  id: 'chirality-without-a-stereocenter',
  section: 'chirality',
  anchor: '<h3>Chirality without a stereocenter</h3>',
  alt: 'Penta-2,3-diene drawn twice as mirror images: the left end carries methyl and hydrogen in the plane of the page and the right end carries them on a wedge and a hash, perpendicular to the first pair. Beside them a biaryl whose second ring is drawn edge-on, with a carboxylic acid and a nitro group on each ring crowding the bond that joins them and blocking it from turning.',
  viewBox: '0 0 760 350',
  build() {
    let s = '';
    const allene = (cx, flip) => {
      const c1 = P(cx - 44, 150), c2 = P(cx, 150), c3 = P(cx + 44, 150);
      let g = bond(c1, c2, { order: 2, rFrom: 0, rTo: 0, gap: 4 });
      g += bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, gap: 4 });
      const lu = P(c1.x - 32, c1.y - 30), ld = P(c1.x - 32, c1.y + 30);
      g += bond(c1, lu, { rFrom: 0, rTo: 17 });
      g += bond(c1, ld, { rFrom: 0, rTo: 12 });
      const ru = P(c3.x + 32, c3.y - 30), rd = P(c3.x + 32, c3.y + 30);
      g += (flip ? hash : wedge)(c3, ru, { rFrom: 0, rTo: 17, width: 9, rungs: 4 });
      g += (flip ? wedge : hash)(c3, rd, { rFrom: 0, rTo: 12, width: 9, rungs: 4 });
      g += atom(lu.x, lu.y, 'CH₃', { r: 17, size: 10 });
      g += atom(ld.x, ld.y, 'H', { r: 12 });
      g += atom(ru.x, ru.y, 'CH₃', { r: 17, size: 10 });
      g += atom(rd.x, rd.y, 'H', { r: 12 });
      for (const q of [c1, c2, c3]) g += atom(q.x, q.y, '', { kind: 'point' });
      return g;
    };
    s += tag(238, 34, 'AN ALLENE: NO sp³ CARBON, NO STEREOCENTER');
    s += panel(20, 54, 196, 196, { kind: 'hi' });
    s += allene(118, false);
    s += text(118, 272, 'one enantiomer', { cls: 'fg-tag-good', size: 10.5 });
    s += text(238, 146, '↔', { cls: 'fg-hi', size: 22 });
    s += text(238, 172, 'mirror', { cls: 'fg-sm', size: 9 });
    s += panel(260, 54, 196, 196, { kind: 'hi' });
    s += allene(358, true);
    s += text(358, 272, 'the other', { cls: 'fg-tag-good', size: 10.5 });
    s += text(238, 302, 'The cumulated double bonds hold the two ends at 90° to', { cls: 'fg-sm', size: 9.5 });
    s += text(238, 320, 'each other, so the four groups sit at the corners of a', { cls: 'fg-sm', size: 9.5 });
    s += text(238, 338, 'twisted shape that no rotation superimposes on its mirror.', { cls: 'fg-sm', size: 9.5 });

    s += rule(478, 54, 478, 300);

    s += tag(618, 34, 'AN ATROPISOMER');
    const hex = (cx, cy, rx, ry) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (90 - i * 60) * Math.PI / 180;
        v.push(P(cx + rx * Math.cos(a), cy - ry * Math.sin(a)));
      }
      return v;
    };
    const A = hex(580, 150, 40, 40), B = hex(678, 150, 13, 40);
    for (const v of [A, B]) {
      for (let i = 0; i < 6; i++) s += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      for (let i = 0; i < 6; i += 2) s += bond(v[i], v[(i + 1) % 6], { rFrom: 7, rTo: 7, cls: 'fg-bond-soft' });
      for (const p of v) s += atom(p.x, p.y, '', { kind: 'point' });
    }
    s += bond(A[1], B[5], { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    for (const anchorPt of [A[2], B[4]]) {
      const co = P(anchorPt.x, anchorPt.y + 32);
      s += bond(anchorPt, co, { rFrom: 0, rTo: 17 });
      s += atom(co.x, co.y, 'CO₂H', { r: 17, size: 9.5, kind: 'hi' });
    }
    for (const anchorPt of [A[0], B[0]]) {
      const no = P(anchorPt.x, anchorPt.y - 32);
      s += bond(anchorPt, no, { rFrom: 0, rTo: 17 });
      s += atom(no.x, no.y, 'NO₂', { r: 17, size: 9.5, kind: 'hi' });
    }
    s += text(618, 228, 'the right ring is edge-on to the left one,', { cls: 'fg-sm', size: 9.5 });
    s += text(618, 246, 'and the four groups crowding the joint', { cls: 'fg-sm', size: 9.5 });
    s += text(618, 264, 'cannot slide past one another', { cls: 'fg-sm', size: 9.5 });
    s += text(618, 292, '6,6′-dinitro-2,2′-diphenic acid', { cls: 'fg-tag-good', size: 10 });
    s += text(618, 308, 'resolved into enantiomers in 1922', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Two molecules with no stereocenter anywhere and a left- and a right-handed form each. In the allene the two <b>cumulated</b> double bonds force the groups on one end into a plane at right angles to the groups on the other, and that twist is what has the handedness. In the biaryl the twist is the same idea held in place by bulk: four groups crowd the bond joining the rings, and for the rings to turn they would have to slide past one another, so the twist stays put and the molecule is not superimposable on its mirror image.',
  note: 'This is why “stereocenter” and “chiral” must not be treated as the same word. The stereocenter is the usual <i>cause</i> of chirality; chirality itself is a statement about the shape of the whole molecule, and a twist does the job just as well as a tetrahedral carbon. The modern workhorses of this type are BINOL and BINAP, two of the most used ligands in asymmetric catalysis. They are built on naphthalenes rather than benzenes, and the extra ring helps: each naphthalene has a hydrogen in the <i>peri</i> position tucked in beside the joint. Those hydrogens alone are not quite enough &mdash; plain binaphthyl slowly racemizes at room temperature &mdash; but with the OH or PPh<sub>2</sub> groups beside the joint as well, the twist is locked, and the same groups are what the metal binds.',
});

export default FIGURES;
