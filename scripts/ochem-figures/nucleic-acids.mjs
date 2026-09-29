/* Figures for the nucleic-acids notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 13 ---
   The three parts and the two links. Built in order, the vocabulary stops
   needing to be memorized: nucleoside is the first two, nucleotide is all
   three, and both links are reactions the reader already has. */
FIGURES.push({
  id: 'nucleotide-parts',
  section: 'nucleic-acids',
  anchor: '<h3>The bases, in two families</h3>',
  viewBox: '0 0 760 300',
  alt: 'A nucleotide assembled from phosphate, sugar and base, showing the phosphate ester and N-glycoside links and where nucleoside and nucleotide begin',
  build() {
    let s = '';
    const box = (x, w, title, sub, kind) => {
      s += panel(x, 74, w, 76, { kind });
      s += text(x + w / 2, 108, title, { cls: 'fg-lbl', size: 12.5 });
      s += text(x + w / 2, 130, sub, { cls: 'fg-sm', size: 10 });
    };
    box(40, 170, 'phosphate', 'at the 5′ OH', 'warn');
    box(280, 200, 'sugar', 'ribose or 2-deoxyribose', null);
    box(560, 160, 'base', 'purine or pyrimidine', null);

    s += rule(210, 112, 280, 112);
    s += text(245, 100, 'ester', { cls: 'fg-tag', size: 10.5 });
    s += rule(480, 112, 560, 112);
    s += text(520, 100, 'N-glycoside', { cls: 'fg-tag', size: 10.5 });
    s += text(520, 138, 'at C1′, the anomeric carbon', { cls: 'fg-sm', size: 9.5 });

    s += rule(280, 176, 720, 176);
    s += text(500, 196, 'nucleoside', { cls: 'fg-tag-good', size: 11 });
    s += rule(40, 216, 720, 216);
    s += text(380, 236, 'nucleotide', { cls: 'fg-tag-good', size: 11 });

    s += rule(34, 256, 726, 256);
    s += text(380, 280, 'One phosphate is the entire difference between the two words.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'A nucleotide, assembled in the order that makes the names obvious. Sugar plus base is a nucleoside; adding the 5′ phosphate makes it a nucleotide, and the polymer is built by esterifying that phosphate to the 3′ OH of the next sugar.',
  note: 'Neither link is new. The base–sugar bond is an acetal formed at the anomeric carbon with nitrogen as the nucleophile, which is why warm aqueous acid cuts it and base does not; the backbone is two ester bonds to one phosphorus, which is all a phosphodiester is.',
});

/* ---------------------------------------------------------------- B8 ---
   The base pairs. The section's central claim — that the pairing rules are
   geometry rather than convention — was made in prose beside a table of
   COUNTS, with no geometry anywhere on the page. Everything here is drawn
   atom by atom: the lactam forms of the bases, a Kekule structure that
   satisfies every valence, and hydrogen bonds that run between real donors
   and real acceptors. */
FIGURES.push({
  id: 'base-pairs-drawn',
  section: 'nucleic-acids',
  anchor: 'And because <b>G–C has three hydrogen bonds to A–T\'s two</b>, a GC-rich stretch of DNA takes more energy to separate, which is why GC content predicts melting temperature.</p>',
  viewBox: '0 0 680 392',
  alt: 'Adenine paired with thymine by two hydrogen bonds and guanine paired with cytosine by three, each pair drawn as a purine and a pyrimidine with their glycosidic bonds pointing outward and the two pairs spanning the same width',
  build() {
    let s = '';
    const hex = (cx, cy, r, k) => P(cx + r * Math.cos(k * Math.PI / 3), cy + r * Math.sin(k * Math.PI / 3));

    /* One pair. `g` true draws guanine-cytosine, false adenine-thymine;
       both use the same skeleton, so the two pairs come out the same width
       by construction, which is the claim the figure is making. */
    const pairAt = (dx, g) => {
      const P2 = (p) => P(p.x + dx, p.y);
      let t = '';
      /* ---- pyrimidine on the left: N1 C2 N3 C4 C5 C6 ---- */
      const py = (k) => P2(hex(110, 196, 34, k));
      const N1 = py(2), C2 = py(1), N3 = py(0), C4 = py(5), C5 = py(4), C6 = py(3);
      const O2 = P2(P(141, 249)), X4 = P2(P(141, 143)), Me = P2(P(79, 143));
      const pyc = P2(P(110, 196));
      t += bond(N1, C2, { rFrom: 15, rTo: 0 });
      t += bond(C2, N3, { rFrom: 0, rTo: g ? 15 : 17 });
      t += bond(C2, O2, { rFrom: 0, rTo: 15, order: 2 });
      t += g ? ringDouble(N3, C4, pyc) : bond(N3, C4, { rFrom: 17, rTo: 0 });
      t += bond(C4, X4, { rFrom: 0, rTo: g ? 18 : 15, order: g ? 1 : 2 });
      t += bond(C4, C5, { rFrom: 0, rTo: 0 });
      t += ringDouble(C5, C6, pyc);
      t += bond(C6, N1, { rFrom: 0, rTo: 15 });
      if (!g) t += bond(C5, Me, { rFrom: 0, rTo: 17 });
      t += atom(N1.x, N1.y, 'N');
      t += atom(N3.x, N3.y, g ? 'N' : 'NH', { r: g ? 15 : 17 });
      t += atom(O2.x, O2.y, 'O');
      t += atom(X4.x, X4.y, g ? 'NH₂' : 'O', { r: g ? 18 : 15 });
      if (!g) t += atom(Me.x, Me.y, 'CH₃', { r: 17 });
      // the bond to the sugar, which is what makes this a nucleoside
      const sug1 = P2(P(73, 260));
      t += bond(N1, sug1, { rFrom: 15, rTo: 0 });
      t += text(sug1.x - 10, sug1.y + 16, 'to sugar', { cls: 'fg-sm' });

      /* ---- purine on the right: six-ring N1 C2 N3 C4 C5 C6 ---- */
      const pu = (k) => P2(hex(250, 196, 34, k));
      const n1 = pu(3), c6 = pu(4), c5 = pu(5), c4 = pu(0), n3 = pu(1), c2 = pu(2);
      const X6 = P2(P(219, 143)), X2 = P2(P(219, 249));
      // the fused five-ring, placed on the C4-C5 edge
      const puc = P2(P(250, 196));
      const mid = P((c4.x + c5.x) / 2, (c4.y + c5.y) / 2);
      const ex = c4.x - c5.x, ey = c4.y - c5.y, el = Math.hypot(ex, ey);
      // outward normal: the perpendicular that points AWAY from the
      // six-ring, which is the half of this the first draft got wrong -
      // the pentagon fused inward and N7 landed on top of C4.
      let nx = -ey / el, ny = ex / el;
      if ((mid.x - puc.x) * nx + (mid.y - puc.y) * ny < 0) { nx = -nx; ny = -ny; }
      const pc = P(mid.x + nx * (el / (2 * Math.tan(Math.PI / 5))),
                   mid.y + ny * (el / (2 * Math.tan(Math.PI / 5))));
      const R5 = el / (2 * Math.sin(Math.PI / 5));
      const a5 = Math.atan2(c5.y - pc.y, c5.x - pc.x);
      const p5 = (j) => P(pc.x + R5 * Math.cos(a5 + j * 2 * Math.PI / 5),
                          pc.y + R5 * Math.sin(a5 + j * 2 * Math.PI / 5));
      const n7 = p5(1), c8 = p5(2), n9 = p5(3);

      t += g ? bond(n1, c6, { rFrom: 17, rTo: 0 }) : ringDouble(n1, c6, puc);
      t += bond(c6, c5, { rFrom: 0, rTo: 0 });
      t += ringDouble(c5, c4, puc);
      t += bond(c4, n3, { rFrom: 0, rTo: 15 });
      t += ringDouble(n3, c2, puc);
      t += bond(c2, n1, { rFrom: 0, rTo: g ? 17 : 15 });
      t += bond(c6, X6, { rFrom: 0, rTo: g ? 15 : 18, order: g ? 2 : 1 });
      if (g) t += bond(c2, X2, { rFrom: 0, rTo: 18 });
      t += bond(c5, n7, { rFrom: 0, rTo: 15 });
      t += ringDouble(n7, c8, pc);
      t += bond(c8, n9, { rFrom: 0, rTo: 15 });
      t += bond(n9, c4, { rFrom: 15, rTo: 0 });
      t += atom(n1.x, n1.y, g ? 'NH' : 'N', { r: g ? 17 : 15 });
      t += atom(n3.x, n3.y, 'N');
      t += atom(n7.x, n7.y, 'N');
      t += atom(n9.x, n9.y, 'N');
      t += atom(X6.x, X6.y, g ? 'O' : 'NH₂', { r: g ? 15 : 18 });
      if (g) t += atom(X2.x, X2.y, 'NH₂', { r: 18 });
      const sug2 = P(n9.x + 18, n9.y + 26);
      t += bond(n9, sug2, { rFrom: 15, rTo: 0 });
      t += text(n9.x - 4, n9.y + 48, 'to sugar', { cls: 'fg-sm' });

      /* ---- and the hydrogen bonds, donor to acceptor ---- */
      const hb = (a, b, ra, rb) => `<line class="fg-dash-hi" x1="${(a.x + ra).toFixed(1)}" y1="${a.y}" x2="${(b.x - rb).toFixed(1)}" y2="${b.y}"></line>`;
      t += hb(X4, X6, g ? 18 : 15, g ? 15 : 18);
      t += hb(N3, n1, g ? 15 : 17, g ? 17 : 15);
      if (g) t += hb(O2, X2, 15, 18);
      return t;
    };

    s += panel(8, 44, 332, 256);
    s += panel(348, 44, 324, 256);
    s += tag(174, 32, 'A–T · two hydrogen bonds');
    s += tag(510, 32, 'G–C · three hydrogen bonds');
    s += pairAt(0, false);
    s += pairAt(318, true);

    // the width both pairs share, measured between the two sugar bonds
    for (const [x1, x2] of [[73, 340], [391, 658]]) {
      s += rule(x1, 316, x2, 316);
      s += rule(x1, 310, x1, 322);
      s += rule(x2, 310, x2, 322);
    }
    s += tag(206, 338, 'same width');
    s += tag(524, 338, 'same width');
    s += rule(20, 354, 660, 354);
    s += label(340, 378, 'Every rung is one purine plus one pyrimidine, so every rung is the same width.');
    return s;
  },
  caption: 'The two pairs drawn out. Each dashed line joins a hydrogen-bond <b>donor</b> on one base to an <b>acceptor</b> on the other: A and T can line up two such partners, G and C three. The glycosidic bonds point outward to the backbones, and the two pairs span the same distance between them.',
  note: 'Try pairing A with G on paper. Two fused ring systems are far too wide to span the gap, and their donors end up facing donors — the rule fails twice over at once, which is why it never has to be memorized. The bases are drawn in their lactam (C=O, N–H) forms, which is the form that makes these donors and acceptors the ones they are.',
});

/* ---------------------------------------------------------------- B9 ---
   One nucleotide, with its sugar actually drawn. The section asserts 3'
   and 5' numbering, an N-glycoside at C1' and a phosphate ester at C5'
   without ever showing the ring those primes are counted round. */
FIGURES.push({
  id: 'nucleotide-drawn',
  section: 'nucleic-acids',
  anchor: 'The sugar is the difference between the two polymers. <b>RNA</b> uses <b>ribose</b>; <b>DNA</b> uses <b>2-deoxyribose</b>, which is ribose missing the OH at C2 — which is exactly what "deoxy" is saying.</p>',
  viewBox: '0 0 700 380',
  alt: 'A deoxyribose furanose ring drawn edge-on with the ring oxygen at the back, an N-glycosidic bond from C1 prime to the base, H at C2 prime with a ghosted OH marked RNA only, a free OH at C3 prime and a 5 prime CH2 joined through an oxygen to a phosphate',
  build() {
    let s = '';
    const O4 = P(300, 150), C1 = P(366, 180), C2 = P(340, 236), C3 = P(262, 236), C4 = P(236, 180);
    // front edge heavy: the furanose is drawn edge-on, same convention as
    // the pyranose in the carbohydrates section.
    s += bond(C3, C2, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C4, C3, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C2, C1, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C4, O4, { rFrom: 0, rTo: 15 });
    s += bond(C1, O4, { rFrom: 0, rTo: 15 });
    s += atom(O4.x, O4.y, 'O');

    // C1' to the base: an N-glycoside at the anomeric carbon
    s += bond(C1, P(424, 150), { rFrom: 0, rTo: 15 });
    s += atom(424, 150, 'N', { kind: 'hi' });
    s += bond(P(424, 150), P(462, 150), { rFrom: 15, rTo: 0 });
    s += panel(462, 124, 116, 52, { kind: 'hi' });
    s += text(520, 155, 'adenine', { cls: 'fg-lbl' });
    s += tag(520, 110, 'N-glycoside at N9');

    // C2': H in DNA, and the OH that RNA keeps
    s += bond(C2, P(340, 290), { rFrom: 0, rTo: 15 });
    s += atom(340, 290, 'H');
    s += bond(C2, P(398, 268), { rFrom: 0, rTo: 15, cls: 'fg-bond-soft' });
    s += text(398, 272, 'OH', { cls: 'fg-sm' });
    s += tag(408, 298, 'RNA only', { cls: 'fg-tag-mut' });

    // C3': the free hydroxyl the next nucleotide is joined to
    s += bond(C3, P(262, 290), { rFrom: 0, rTo: 16 });
    s += atom(262, 290, 'OH', { r: 16, kind: 'warn' });
    s += tag(148, 250, 'next unit joins here');

    // C5': CH2 out to the phosphate ester
    s += bond(C4, P(196, 140), { rFrom: 0, rTo: 17 });
    s += atom(196, 140, 'CH₂', { r: 17 });
    s += bond(P(196, 140), P(150, 116), { rFrom: 17, rTo: 15 });
    s += atom(150, 116, 'O');
    s += bond(P(150, 116), P(90, 92), { rFrom: 15, rTo: 24 });
    s += atom(90, 92, 'PO₃²⁻', { r: 24, kind: 'warn' });
    s += tag(120, 56, 'phosphate ester');

    for (const [x, y, n] of [[390, 196, '1′'], [364, 262, '2′'], [238, 262, '3′'],
      [212, 196, '4′'], [172, 168, '5′']]) s += text(x, y, n, { cls: 'fg-sm' });

    s += rule(220, 320, 580, 320);
    s += label(400, 340, 'nucleoside = sugar + base');
    s += rule(64, 352, 580, 352);
    s += label(322, 372, 'nucleotide = nucleoside + the 5′ phosphate');
    return s;
  },
  caption: 'One nucleotide, drawn out. Two of its three links are reactions already in hand — an <b>N-glycoside</b> at C1′, which is the anomeric carbon of the sugar, and a <b>phosphate ester</b> at C5′ — and the free OH at C3′ is where the next unit is joined, which is what makes the chain run 5′ to 3′.',
  note: 'The primes are the whole reason for the numbering: the base has numbered atoms of its own, so the sugar\'s carbons are primed to keep the two sets apart. C2′ is where the two polymers differ, and it is drawn here as the H of deoxyribose with ribose\'s OH ghosted beside it.',
});

export default FIGURES;
