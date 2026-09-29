/* Figures for the e1 notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

FIGURES.push({
  id: 'e1-both-arrows',
  section: 'e1',
  anchor: '<p>And running alongside both, ethanol can attack the cation directly, giving the SN1 ether. All three products come out of the same flask.</p>',
  alt: 'Two drawn steps of E1 on 2-bromo-2-methylbutane. Step one shows one curved arrow from the carbon-bromine bond onto bromine, giving a tertiary carbocation. Step two shows two curved arrows: one from an ethanol lone pair to a beta hydrogen, and one from that carbon-hydrogen bond into the bond between the beta carbon and the cationic carbon, giving 2-methyl-2-butene.',
  viewBox: '0 0 760 500',
  build() {
    let s = '';
    /* The substrate skeleton: Ca carries two methyls (drawn up-left and
       down-left) and the ethyl chain runs right through Cb to a terminal CH3. */
    const frame = (ox, oy) => {
      const ca = P(ox, oy), cb = P(ox + 46, oy + 26), ct = P(ox + 92, oy);
      let g = bond(ca, cb, { rFrom: 15, rTo: 0 }) + bond(cb, ct, { rFrom: 0, rTo: 17 });
      g += atom(cb.x, cb.y, '', { kind: 'point' });
      g += atom(ct.x, ct.y, 'CH₃', { r: 17, size: 10 });
      for (const deg of [120, 210]) {
        const e = armEnd(ca, deg, 44);
        g += bond(ca, e, { rFrom: 15, rTo: 17 });
        g += atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
      }
      return { g, ca, cb, ct };
    };

    // ---- STEP 1 ----
    s += tag(40, 42, 'STEP 1 — SLOW. IONIZATION, EXACTLY AS IN SN1.', { anchor: 'start' });
    const A = frame(190, 130);
    s += A.g;
    const brEnd = armEnd(A.ca, 40, 48);
    s += bond(A.ca, brEnd, { rFrom: 15, rTo: 15 });
    s += atom(brEnd.x, brEnd.y, 'Br', { kind: 'warn' });
    for (const a of [30, 330]) s += lonePair(brEnd.x, brEnd.y, a, { dist: 23 });
    s += atom(A.ca.x, A.ca.y, 'C');
    s += curve(P(A.ca.x + 16, A.ca.y - 12), P(brEnd.x - 11, brEnd.y + 11), { bow: -24 });
    s += arrow(P(330, 132), P(392, 132), { muted: true });
    const B = frame(500, 130);
    s += B.g;
    s += atom(B.ca.x, B.ca.y, 'C');
    s += text(B.ca.x + 6, B.ca.y - 22, '+', { cls: 'fg-tag-warn', size: 17 });
    s += text(626, 118, '+  Br⁻', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(540, 206, '3° carbocation', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 234, 720, 234);

    // ---- STEP 2 ----
    s += tag(40, 268, 'STEP 2 — FAST. TWO ARROWS, AND NEITHER IS OPTIONAL.', { anchor: 'start' });
    const C = frame(150, 340);
    s += C.g;
    s += atom(C.ca.x, C.ca.y, 'C');
    s += text(C.ca.x + 6, C.ca.y - 22, '+', { cls: 'fg-tag-warn', size: 17 });
    const hb = P(C.cb.x + 4, C.cb.y + 48);
    s += bond(C.cb, hb, { rFrom: 0, rTo: 13, cls: 'fg-bond-hi' });
    s += atom(hb.x, hb.y, 'H', { kind: 'hi', r: 13 });
    s += text(C.cb.x - 18, C.cb.y + 20, 'β', { cls: 'fg-tag', size: 11 });
    const base = P(hb.x + 92, hb.y);
    s += atom(base.x, base.y, 'EtOH', { r: 21, size: 9.5 });
    s += lonePair(base.x, base.y, 180, { dist: 27 });
    s += curve(P(base.x - 32, base.y - 2), P(hb.x + 17, hb.y - 2), { bow: 14 });
    const mid = P((C.ca.x + C.cb.x) / 2, (C.ca.y + C.cb.y) / 2);
    s += curve(P(hb.x - 12, hb.y - 26), P(mid.x + 3, mid.y + 8), { bow: -26 });
    s += text(150, 462, 'arrow 1: the base takes the β-H', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(150, 480, 'arrow 2: that C–H bond becomes the π bond', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += arrow(P(392, 366), P(454, 366), { muted: true });
    const da = P(548, 340), db = P(594, 366), dt = P(640, 340);
    s += bond(da, db, { rFrom: 15, rTo: 0, order: 2, gap: 4.4 });
    s += bond(db, dt, { rFrom: 0, rTo: 17 });
    s += atom(db.x, db.y, '', { kind: 'point' });
    s += atom(dt.x, dt.y, 'CH₃', { r: 17, size: 10 });
    for (const deg of [120, 210]) {
      const e = armEnd(da, deg, 44);
      s += bond(da, e, { rFrom: 15, rTo: 17 });
      s += atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
    }
    s += atom(da.x, da.y, 'C');
    s += text(596, 462, '2-methyl-2-butene — trisubstituted', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'The step that makes it an elimination rather than a substitution, drawn with both of its arrows. The base never touches the positive carbon: it takes a hydrogen from the carbon <i>next door</i>, and the pair of electrons left behind slides into the gap between the two carbons to become the π bond. Nothing here requires any particular geometry, because the leaving group left in step 1 and is no longer part of the argument.',
  note: 'The base is ethanol — the solvent. It does not have to be strong, because the target is a hydrogen next to a full positive charge, which is far more acidic than an ordinary C–H. That is the whole reason E1 needs no added base, and the reason it turns up uninvited whenever you try to run an SN1.',
});

FIGURES.push({
  id: 'e1-shift-then-eliminate',
  section: 'e1',
  anchor: '<p><b>The point.</b> The alkene you get has its double bond in a position you cannot reach by eliminating from the original C–Br carbon at all. When a cation can rearrange, do the rearrangement <i>first</i> and apply Zaitsev to the rearranged cation — applying Zaitsev to the original skeleton gives the wrong answer with complete confidence.</p>',
  alt: 'Three frames. A secondary carbocation next to a quaternary carbon, with a curved arrow taking a methyl group with its bonding pair across to the positive carbon; the resulting tertiary carbocation; and the tetrasubstituted alkene 2,3-dimethylbut-2-ene that follows from removing a beta hydrogen.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    const skel = (ox, oy) => {
      const q = P(ox, oy), c = P(ox + 50, oy + 28);
      let g = bond(q, c, { rFrom: 15, rTo: 15 });
      return { q, c, g };
    };
    const methyls = (c, degs, cls) => degs.map((d) => {
      const e = armEnd(c, d, 44);
      return bond(c, e, { rFrom: 15, rTo: 17, cls }) + atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
    }).join('');

    // frame 1 — the 2° cation and the methyl that migrates
    s += tag(140, 40, '2° CATION, AND NO HYDROGEN NEXT DOOR');
    const A = skel(110, 100);
    s += A.g + methyls(A.q, [90, 180]);
    const mig = armEnd(A.q, 270, 46);
    s += bond(A.q, mig, { rFrom: 15, rTo: 17, cls: 'fg-bond-hi' });
    s += atom(mig.x, mig.y, 'CH₃', { r: 17, size: 10, kind: 'hi' });
    s += methyls(A.c, [0]);
    s += atom(A.q.x, A.q.y, 'C');
    s += atom(A.c.x, A.c.y, 'C');
    s += text(A.c.x - 4, A.c.y + 30, '+', { cls: 'fg-tag-warn', size: 17 });
    s += text(140, 216, 'the neighbor is quaternary: no H to shift,', { cls: 'fg-sm', size: 9.5 });
    s += text(140, 232, 'so a whole METHYL moves instead', { cls: 'fg-tag-warn', size: 10.5 });
    s += curve(P(mig.x + 16, mig.y - 6), P(A.c.x - 12, A.c.y + 12), { bow: -22 });

    s += arrow(P(272, 140), P(324, 140), { muted: true });

    // frame 2 — the 3° cation
    s += tag(430, 40, 'NOW 3°');
    const B = skel(400, 100);
    s += B.g + methyls(B.q, [90, 180]);
    s += methyls(B.c, [30, 300]);
    s += atom(B.q.x, B.q.y, 'C');
    s += atom(B.c.x, B.c.y, 'C');
    s += text(B.q.x - 2, B.q.y - 24, '+', { cls: 'fg-tag-warn', size: 17 });
    const hB = armEnd(B.c, 240, 38);
    s += bond(B.c, hB, { rFrom: 15, rTo: 12, cls: 'fg-bond-hi' });
    s += atom(hB.x, hB.y, 'H', { r: 12, size: 11, kind: 'hi' });
    s += text(430, 216, 'the charge moved the other way;', { cls: 'fg-sm', size: 9.5 });
    s += text(430, 232, 'this β-H gives the best alkene', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(540, 140), P(592, 140), { muted: true });

    // frame 3 — the product alkene
    s += tag(672, 40, 'ELIMINATE');
    const d1 = P(628, 118), d2 = P(678, 146);
    s += bond(d1, d2, { rFrom: 15, rTo: 15, order: 2, gap: 4.4 });
    s += methyls(d1, [90, 180]);
    s += methyls(d2, [10, 300]);
    s += atom(d1.x, d1.y, 'C');
    s += atom(d2.x, d2.y, 'C');
    s += text(672, 216, '2,3-dimethylbut-2-ene', { cls: 'fg-tag-good', size: 10.5 });
    s += text(672, 232, 'tetrasubstituted', { cls: 'fg-sm', size: 9.5 });

    s += rule(60, 258, 700, 258);
    s += text(380, 286, 'Rearrange first, then apply Zaitsev to the cation you actually have.', { cls: 'fg-sm', size: 10 });
    s += text(380, 308, 'The double bond in the product is not even on the carbon that held the bromine.', { cls: 'fg-tag-warn', size: 10.5 });
    return s;
  },
  caption: 'A <b>methyl shift</b>, which is the same move as a hydride shift with a bigger passenger: the group leaves with its bonding pair, so the positive charge ends up where the group came from. It happens for the same reason — the cation it produces is tertiary rather than secondary — and it happens faster than the weak base can reach a hydrogen.',
  note: 'Now count what would have happened without the shift. Eliminating straight from the original secondary cation gives a monosubstituted alkene on the original skeleton; after the shift the best available alkene is tetrasubstituted and sits between two different carbons. Same starting material, different answer — which is why "check for a rearrangement" comes before "apply Zaitsev".',
});

export default FIGURES;
