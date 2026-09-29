/* Figures for the alkene-structure notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 8.1 ---
   The opening claim of the chapter — three sp2 orbitals in a plane, one p
   orbital perpendicular, overlap side by side — is carried entirely by
   prose, and the consequence (no rotation) is argued in prose too. Both are
   pictures. */
FIGURES.push({
  id: 'alkene-pi-overlap',
  section: 'alkene-structure',
  anchor: 'forming the <b>pi bond</b>.</p>',
  alt: 'Left: ethylene drawn flat, with the two leftover p orbitals aligned and overlapping as one pi cloud above the molecule and one below. Right: the same molecule with the right-hand carbon turned ninety degrees, so its p orbitals point toward and away from the reader while the left one still points up and down; the two no longer overlap and the pi bond is gone.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    const armsH = (c, up, dn) => bond(c, up, { rFrom: 15, rTo: 13 }) + bond(c, dn, { rFrom: 15, rTo: 13 });

    // ---- left panel: aligned
    s += panel(10, 14, 356, 246);
    s += tag(188, 40, 'aligned — the pi bond exists');
    const A = P(128, 150), B = P(248, 150);
    s += lobeE(188, 104, 88, 26);
    s += lobeE(188, 196, 88, 26);
    s += bond(A, B);
    const a1 = P(74, 118), a2 = P(74, 182), b1 = P(302, 118), b2 = P(302, 182);
    s += armsH(A, a1, a2) + armsH(B, b1, b2);
    s += atom(a1.x, a1.y, 'H', { r: 13 }) + atom(a2.x, a2.y, 'H', { r: 13 });
    s += atom(b1.x, b1.y, 'H', { r: 13 }) + atom(b2.x, b2.y, 'H', { r: 13 });
    s += atom(A.x, A.y, 'C') + atom(B.x, B.y, 'C');
    s += text(188, 234, 'both p orbitals point the same way, so they overlap', { cls: 'fg-sm', size: 9.5 });
    s += text(188, 250, '3 sigma bonds each, 120° apart, one plane', { cls: 'fg-sm', size: 9.5 });

    // ---- right panel: twisted 90 degrees
    s += panel(394, 14, 356, 246);
    s += tag(572, 40, 'turned 90° — the pi bond is gone');
    const C = P(512, 150), D = P(632, 150);
    s += lobeE(512, 108, 26, 22);
    s += lobeE(512, 192, 26, 22);
    s += lobeE(608, 122, 24, 20, 'fg-orb-alt');
    s += lobeE(656, 178, 24, 20, 'fg-orb-alt');
    s += text(596, 96, 'front', { cls: 'fg-sm', size: 9 });
    s += text(672, 208, 'behind', { cls: 'fg-sm', size: 9 });
    s += bond(C, D, { cls: 'fg-bond-soft' });
    const c1 = P(458, 118), c2 = P(458, 182), d1 = P(696, 130), d2 = P(696, 172);
    s += armsH(C, c1, c2) + armsH(D, d1, d2);
    s += atom(c1.x, c1.y, 'H', { r: 13 }) + atom(c2.x, c2.y, 'H', { r: 13 });
    s += atom(d1.x, d1.y, 'H', { r: 13 }) + atom(d2.x, d2.y, 'H', { r: 13 });
    s += atom(C.x, C.y, 'C') + atom(D.x, D.y, 'C');
    s += text(572, 234, 'perpendicular orbitals cannot overlap at all', { cls: 'fg-tag-warn', size: 10 });
    s += text(572, 250, 'the sigma bond survives; the pi bond does not', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(370, 150), P(390, 150), { muted: true });
    s += rule(30, 276, 730, 276);
    s += text(380, 300, 'Turning one carbon like that costs about 65 kcal/mol — the whole pi bond.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 318, 'That is why cis and trans alkenes are different compounds rather than two shapes of one.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'What "side-by-side overlap" looks like, and what rotation would do to it. On the left the two leftover p orbitals are parallel, and the shared cloud above and below the molecular plane is the pi bond. On the right one carbon has been turned a quarter turn: its orbitals now point at the reader and away, the other pair still points up and down, and two perpendicular orbitals have no overlap to share.',
  note: 'The sigma bond does not care. Its overlap is end-on and cylindrically symmetric about the bond axis, so turning one end changes nothing — which is exactly why single bonds rotate freely at room temperature and double bonds do not rotate at all.',
});

export default FIGURES;
