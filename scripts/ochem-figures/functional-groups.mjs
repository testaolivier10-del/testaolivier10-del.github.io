/* Figures for the functional-groups notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 61 ---
   The carbonyl family, drawn as seven copies of the same C=O with one atom
   swapped. The notes say "read the other two things attached to the C=O";
   this makes that literal: the carbon and the oxygen are identical in every
   panel, the polar bond is marked identically in every panel, and the only
   thing that moves is the highlighted atom on the right. Condensed and Lewis
   drawing only, since this sits in Foundations before skeletal notation. */
FIGURES.push({
  id: 'carbonyl-family-gallery',
  section: 'functional-groups',
  anchor: '<h3>The carbonyl family: what is attached to the C=O</h3>',
  viewBox: '0 0 760 500',
  alt: 'Seven small panels, each showing a carbon double-bonded to an oxygen with the carbon marked delta plus and the oxygen delta minus. The carbon carries an R group on the left and, highlighted on the right, the atom that names the group: H for aldehyde, a second R for ketone, OH for carboxylic acid, OR for ester, NH2 for amide, Cl for acid chloride, and an oxygen bridging to a second C=O for anhydride.',
  build() {
    let s = '';
    // One carbonyl: C highlighted, O above with its two lone pairs, R to the
    // lower left, and the naming atom to the lower right.
    const carbonyl = (cx, cy, X, opts = {}) => {
      const C = P(cx, cy), O = P(cx, cy - 54), R = P(cx - 48, cy + 34), Xp = P(cx + 48, cy + 34);
      let g = '';
      g += bond(C, O, { order: 2, rFrom: 16, rTo: 15 });
      g += bond(C, R, { rFrom: 16, rTo: 15 });
      g += bond(C, Xp, { rFrom: 16, rTo: 16 });
      g += atom(O.x, O.y, 'O');
      g += lonePair(O.x, O.y, 210); g += lonePair(O.x, O.y, 330);
      g += atom(R.x, R.y, opts.rLabel || 'R');
      g += atom(Xp.x, Xp.y, X, { kind: 'warn' });
      g += atom(C.x, C.y, 'C', { kind: 'hi' });
      g += text(cx + 23, cy - 8, 'δ+', { cls: 'fg-warn', size: 11 });
      g += text(cx + 24, cy - 60, 'δ−', { cls: 'fg-hi', size: 11 });
      return g;
    };
    const top = [
      { name: 'Aldehyde',        X: 'H',    what: 'attached: H' },
      { name: 'Ketone',          X: 'R′', what: 'attached: a second carbon' },
      { name: 'Carboxylic acid', X: 'OH',   what: 'attached: OH' },
      { name: 'Ester',           X: 'OR′', what: 'attached: O–carbon' },
    ];
    top.forEach((t, i) => {
      const x = 20 + i * 182, cx = x + 85;
      s += panel(x, 16, 170, 196);
      s += text(cx, 40, t.name, { cls: 'fg-lbl', size: 12.5 });
      s += carbonyl(cx, 116, t.X);
      s += text(cx, 194, t.what, { cls: 'fg-tag-good', size: 10.5 });
    });
    const bottom = [
      { name: 'Amide',         X: 'NH₂', what: 'attached: N  (NH₂, NHR′ or NR′₂)' },
      { name: 'Acid chloride', X: 'Cl',   what: 'attached: Cl' },
    ];
    bottom.forEach((t, i) => {
      const x = 20 + i * 245, cx = x + 115;
      s += panel(x, 228, 230, 196);
      s += text(cx, 252, t.name, { cls: 'fg-lbl', size: 12.5 });
      s += carbonyl(cx, 328, t.X);
      s += text(cx, 406, t.what, { cls: 'fg-tag-good', size: 10.5 });
    });
    // Anhydride: two carbonyls sharing one oxygen, so the naming atom is an
    // oxygen that continues to a second C=O.
    {
      const x = 510, cx = x + 115;
      s += panel(x, 228, 230, 196);
      s += text(cx, 252, 'Anhydride', { cls: 'fg-lbl', size: 12.5 });
      const C1 = P(x + 70, 328), O1 = P(x + 70, 274), R1 = P(x + 30, 362), Ob = P(x + 118, 362);
      const C2 = P(x + 166, 328), O2 = P(x + 166, 274), R2 = P(x + 206, 362);
      s += bond(C1, O1, { order: 2, rFrom: 16, rTo: 15 });
      s += bond(C1, R1, { rFrom: 16, rTo: 15 });
      s += bond(C1, Ob, { rFrom: 16, rTo: 16 });
      s += bond(Ob, C2, { rFrom: 16, rTo: 15 });
      s += bond(C2, O2, { order: 2, rFrom: 15, rTo: 15 });
      s += bond(C2, R2, { rFrom: 15, rTo: 15 });
      s += atom(O1.x, O1.y, 'O'); s += lonePair(O1.x, O1.y, 210); s += lonePair(O1.x, O1.y, 330);
      s += atom(O2.x, O2.y, 'O'); s += lonePair(O2.x, O2.y, 210); s += lonePair(O2.x, O2.y, 330);
      s += atom(R1.x, R1.y, 'R'); s += atom(R2.x, R2.y, 'R');
      s += atom(Ob.x, Ob.y, 'O', { kind: 'warn' });
      s += atom(C2.x, C2.y, 'C');
      s += atom(C1.x, C1.y, 'C', { kind: 'hi' });
      s += text(C1.x + 23, C1.y - 8, 'δ+', { cls: 'fg-warn', size: 11 });
      s += text(C1.x + 24, C1.y - 60, 'δ−', { cls: 'fg-hi', size: 11 });
      s += text(cx, 406, 'attached: O that leads to a second C=O', { cls: 'fg-tag-good', size: 10.5 });
    }
    s += rule(24, 440, 736, 440);
    s += text(380, 446, 'The C=O is the same in all seven: carbon δ+, oxygen δ− with two lone pairs.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 464, 'Only the atom on the right changes, and it is the whole name.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'Seven groups, one carbonyl. Find the C=O, then read the atom on its right: H, a carbon, OH, OR′, N, Cl, or an oxygen that continues to another C=O. That one atom is the entire difference between an aldehyde and an ester, and it is what every "identify the functional group" question is really asking.',
  note: 'The polar bond is marked identically in every panel because it is identical in every one: the carbonyl carbon is the most electron-poor carbon in the whole table, for the electronegativity reason of the previous section, doubled by the second bond to oxygen. What the right-hand atom changes is not whether that carbon is attacked but what happens afterward, which is the story of three later chapters.',
});

/* ---------------------------------------------------------------- F4 ---
   The section's three worked examples are drugs given as condensed formulas
   and the reader is asked to "circle each group". Nothing is drawn, so
   there is nothing to circle. This draws them. */
FIGURES.push({
  id: 'three-drugs-groups-named',
  section: 'functional-groups',
  anchor: '<h3>What carries forward</h3>',
  viewBox: '0 0 760 356',
  alt: 'Aspirin, acetaminophen and ibuprofen drawn as condensed formulas around a benzene ring, with every functional group boxed and named: carboxylic acid and ester on aspirin, phenol and amide on acetaminophen, carboxylic acid and two alkyl branches on ibuprofen.',
  build() {
    let s = '';
    /* A benzene ring drawn as a hexagon with the inner circle, which is what
       C6H4 and C6H5 stand for in the condensed formulas the section uses. */
    const ring = (cx, cy, R = 30) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 - 90) * Math.PI / 180;
        pts.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
      }
      let g = '';
      for (let i = 0; i < 6; i++) g += bond(pts[i], pts[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      g += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="${R * 0.56}" fill="none"></circle>`;
      return { g, pts };
    };
    /* A group written as a tinted chip rather than a circle: the labels here
       are whole condensed fragments, and a disc big enough to hold one is big
       enough to collide with everything around it. */
    const chip = (cx, cy, lab, kind) => {
      const w = lab.length * 7.4 + 16;
      return { g: panel(cx - w / 2, cy - 13, w, 26, { kind, r: 9 }) +
                  text(cx, cy + 4, lab, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag', size: 11 }),
               half: w / 2 };
    };
    const link = (a, b, stop) => bond(a, b, { rFrom: 0, rTo: stop });

    const panels = [
      {
        x: 14, name: 'aspirin', cx: 82, cy: 150,
        groups: [
          { at: 0, to: P(82, 80),  lab: 'COOH', kind: 'warn', stop: 16 },
          { at: 1, to: P(186, 146), lab: 'OCOCH₃', kind: 'warn', stop: 36 },
        ],
        lines: ['COOH = carboxylic acid', 'O–CO–CH₃ = ester', 'plus the ring — an aromatic'],
      },
      {
        x: 268, name: 'acetaminophen', cx: 336, cy: 150,
        groups: [
          { at: 0, to: P(336, 80), lab: 'OH', kind: 'warn', stop: 16 },
          { at: 3, to: P(400, 212), lab: 'NHCOCH₃', kind: 'warn', stop: 40 },
        ],
        lines: ['OH on the ring = phenol', 'NH–CO–CH₃ = amide', 'no carboxylic acid anywhere'],
      },
      {
        x: 522, name: 'ibuprofen', cx: 610, cy: 150,
        groups: [
          { at: 0, to: P(610, 80), lab: 'CH(CH₃)COOH', kind: 'warn', stop: 16 },
          { at: 3, to: P(610, 216), lab: 'CH₂CH(CH₃)₂', kind: null, stop: 16 },
        ],
        lines: ['COOH = carboxylic acid', 'the rest is spectator carbon', 'acid + ring, six spectator carbons'],
      },
    ];
    for (const p of panels) {
      s += panel(p.x, 16, 226, 236);
      s += text(p.x + 113, 40, p.name, { cls: 'fg-lbl', size: 12.5 });
      const r = ring(p.cx, p.cy); s += r.g;
      for (const g of p.groups) {
        const c = chip(g.to.x, g.to.y, g.lab, g.kind);
        s += link(r.pts[g.at], g.to, g.stop);
        s += c.g;
      }
      p.lines.forEach((t, i) =>
        s += text(p.x + 113, 276 + i * 17, t, { cls: i === 2 ? 'fg-sm' : 'fg-tag-good', size: i === 2 ? 10 : 10.5 }));
    }
    s += rule(14, 256, 746, 256);
    s += text(380, 344, 'Three drugs, five groups between them, and every other atom is skeleton.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The three molecules the worked examples run through, with the groups marked. Aspirin carries a carboxylic acid and an ester on the same ring; acetaminophen carries a phenol and an amide, and no acid at all despite the name most people expect; ibuprofen carries one carboxylic acid; of its other twelve carbons, six are the aromatic ring and six are genuinely spectator.',
  note: 'Compare the two O–CO patterns. In aspirin the ring oxygen leads to a carbonyl, which makes it an <b>ester</b>; in acetaminophen a ring nitrogen leads to a carbonyl, which makes it an <b>amide</b>. One atom apart, and the difference decides how each one is broken down in the body — which is why aspirin is hydrolyzed within minutes in the body and acetaminophen is not.',
});

/* ---------------------------------------------------------------- F5 ---
   The degree trap, drawn. The same tert-butyl skeleton twice: counting on
   the carbon for the alcohol, on the nitrogen for the amine. */
FIGURES.push({
  id: 'degree-counted-twice',
  section: 'functional-groups',
  anchor: '<h3>Why polarity tells you where a group will react</h3>',
  viewBox: '0 0 760 250',
  alt: 'Two structures built on the same tert-butyl group. On the left the OH version, whose central carbon carries three methyl groups, is labeled a tertiary alcohol. On the right the NH2 version, whose nitrogen carries one carbon, is labeled a primary amine.',
  build() {
    let s = '';
    const skeleton = (cx, cy, tail, kind) => {
      const C = P(cx, cy), X = P(cx + 72, cy);
      let g = '';
      [[-52, -34], [-52, 34], [0, 52]].forEach(([dx, dy]) => {
        const m = P(cx + dx, cy + dy);
        g += bond(C, m, { rTo: 17 });
        g += atom(m.x, m.y, 'CH₃', { r: 17 });
      });
      g += bond(C, X, { rTo: 17 });
      g += atom(C.x, C.y, 'C', { kind: 'hi' });
      g += atom(X.x, X.y, tail, { kind: kind, r: 17 });
      return { g, X };
    };
    {
      const x = 150, y = 116;
      s += text(x + 20, 40, '(CH₃)₃C–OH', { cls: 'fg-lbl', size: 13 });
      const a = skeleton(x, y, 'OH', 'warn'); s += a.g;
      s += lonePair(a.X.x, a.X.y, 320, { dist: 24 }); s += lonePair(a.X.x, a.X.y, 40, { dist: 24 });
      s += text(x + 20, 190, 'count the carbons on the CARBON: 3', { cls: 'fg-tag-good', size: 11 });
      s += text(x + 20, 212, 'tertiary alcohol', { cls: 'fg-lbl', size: 12.5 });
      s += text(x + 20, 234, 'the OH sits on a carbon with no H of its own', { cls: 'fg-sm', size: 10 });
    }
    s += rule(392, 40, 392, 236);
    {
      const x = 528, y = 116;
      s += text(x + 20, 40, '(CH₃)₃C–NH₂', { cls: 'fg-lbl', size: 13 });
      const b = skeleton(x, y, 'NH₂', 'warn'); s += b.g;
      s += lonePair(b.X.x, b.X.y, 320, { dist: 26 });
      s += text(x + 20, 190, 'count the carbons on the NITROGEN: 1', { cls: 'fg-tag-good', size: 11 });
      s += text(x + 20, 212, 'primary amine', { cls: 'fg-lbl', size: 12.5 });
      s += text(x + 20, 234, 'the same skeleton, the opposite answer', { cls: 'fg-sm', size: 10 });
    }
    return s;
  },
  caption: 'The same tert-butyl group with two different groups on it, and two opposite answers. For an alcohol or an alkyl halide you count the carbons attached to the carbon bearing the group, and this one has three: tertiary. For an amine you count the carbons attached to the nitrogen, and this one has one: primary.',
  note: 'The rule is not arbitrary. Degree exists to say how crowded the reacting atom is, and the reacting atom is different in the two cases: an alcohol reacts at its carbon, so the carbon’s neighbors are what matter, while an amine reacts through the lone pair on its nitrogen, so the nitrogen’s neighbors are. Both structures reduce to that one question.',
});

export default FIGURES;
