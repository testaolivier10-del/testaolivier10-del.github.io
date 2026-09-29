/* Figures for the baeyer-villiger notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 42 ---
   One reaction, one question: which group moves. Drawing the two possible
   products from the same ketone makes "read the product backwards to find
   the migrator" something the reader does rather than is told. */
FIGURES.push({
  id: 'which-migrates',
  section: 'baeyer-villiger',
  anchor: '<h3>Rings become lactones</h3>',
  viewBox: '0 0 760 320',
  alt: 'Acetophenone giving phenyl acetate by phenyl migration rather than methyl benzoate by methyl migration',
  build() {
    let s = '';
    s += panel(250, 42, 260, 62, { kind: 'hi' });
    s += text(380, 68, 'Ph–CO–CH₃', { cls: 'fg-lbl', size: 14 });
    s += text(380, 90, 'two groups, one moves', { cls: 'fg-sm', size: 10 });

    s += arrow(P(320, 110), P(200, 150));
    s += arrow(P(440, 110), P(560, 150));

    const out = (cx, formula, name, verdict, kind) => {
      s += panel(cx - 150, 156, 300, 84, { kind });
      s += text(cx, 184, formula, { cls: 'fg-lbl', size: 13.5 });
      s += text(cx, 208, name, { cls: 'fg-sm', size: 10.5 });
      s += text(cx, 232, verdict, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11 });
    };
    out(190, 'Ph–O–CO–CH₃', 'phenyl acetate — the phenyl moved', 'this is what forms', null);
    out(570, 'CH₃–O–CO–Ph', 'methyl benzoate — the methyl moved', 'this does not', 'warn');

    s += rule(34, 258, 726, 258);
    s += text(380, 282, 'Find the inserted oxygen and look at its far side: whatever is there is what migrated.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 304, 'tertiary  >  secondary, benzyl, aryl  >  primary  >  methyl', { cls: 'fg-tag-good', size: 11.5 });
    return s;
  },
  caption: 'Acetophenone gives phenyl acetate, not methyl benzoate. Reading the names tells you which group moved: in phenyl acetate the oxygen sits between the phenyl and the carbonyl, so the phenyl is what migrated onto it and the methyl stayed where it was.',
  note: 'The order is not a separate fact to memorize. Partway through the shift the migrating carbon is electron-poor, so whatever stabilizes a carbocation stabilizes this transition state — same ranking, arriving from a different direction. The practical shortcut: in a methyl ketone the methyl essentially never migrates, so the product is the acetate ester of whatever the other group was.',
});

/* ---------------------------------------------------------------- B5 ---
   The Criegee intermediate is named four times in the section and drawn
   nowhere, and the whole reaction is in its collapse: three arrows at once,
   and a group that changes which atom it is bonded to without being free. */
FIGURES.push({
  id: 'criegee-collapse',
  section: 'baeyer-villiger',
  anchor: 'running here on a neutral intermediate.</p>',
  viewBox: '0 0 760 498',
  alt: 'The Baeyer-Villiger mechanism with curved arrows: the peroxyacid adding to the protonated ketone, the Criegee intermediate with its weak oxygen-oxygen bond and the migrating group drawn anti-periplanar to it, and the concerted collapse that inserts the oxygen and releases the carboxylic acid',
  build() {
    let s = '';

    /* 1 — addition. */
    s += tag(132, 36, '1 · the peroxyacid adds');
    s += panel(14, 44, 236, 248);
    {
      const C = P(96, 160), O = P(96, 108), R = P(48, 194), R2 = P(146, 194);
      s += bond(C, O, { order: 2, rFrom: 14, rTo: 18 });
      s += bond(C, R, { rFrom: 14, rTo: 13 });
      s += bond(C, R2, { rFrom: 14, rTo: 16 });
      s += atom(O.x, O.y, 'OH⁺', { kind: 'warn', r: 18, size: 10 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += atom(R2.x, R2.y, 'R′', { r: 16, size: 10.5 });
      s += atom(200, 128, 'O–H', { kind: 'hi', r: 20, size: 10 });
      s += atom(200, 184, 'O', { r: 14 });
      s += bond(P(200, 128), P(200, 184), { rFrom: 20, rTo: 14 });
      s += text(200, 216, '– C(=O)Ar', { cls: 'fg-sm', size: 10.5 });
      s += lonePair(200, 128, 200);
      s += curve(P(174, 138), P(120, 150), { bow: -14 });
      s += curve(P(108, 140), P(106, 122), { bow: -10 });
      s += text(132, 244, 'the terminal O attacks —', { cls: 'fg-sm', size: 10.5 });
      s += text(132, 264, 'the OH end, not the acyl end', { cls: 'fg-sm', size: 10.5 });
      s += text(132, 286, 'the ketone is protonated first', { cls: 'fg-tag', size: 11 });
    }

    /* 2 — the Criegee intermediate. */
    s += tag(380, 36, '2 · the Criegee intermediate');
    s += panel(262, 44, 236, 248);
    {
      /* The O–O is drawn folding back over the top so that R′ and the far
         oxygen end up on opposite sides of the C–O axis: that trans zig-zag
         IS the anti-periplanar arrangement the caption claims, rather than
         two groups sitting side by side with a label asserting otherwise. */
      const C = P(366, 160), OH = P(366, 108), R = P(312, 200), Rp = P(420, 200), O1 = P(432, 128), O2 = P(410, 86);
      s += bond(C, OH, { rFrom: 14, rTo: 16 });
      s += bond(C, R, { rFrom: 14, rTo: 13 });
      s += bond(C, Rp, { rFrom: 14, rTo: 16, cls: 'fg-bond-hi' });
      s += bond(C, O1, { rFrom: 14, rTo: 14 });
      s += bond(O1, O2, { rFrom: 14, rTo: 14, cls: 'fg-bond-hi' });
      s += atom(OH.x, OH.y, 'OH', { r: 16, size: 10.5 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += atom(Rp.x, Rp.y, 'R′', { kind: 'hi', r: 16, size: 10.5 });
      s += atom(O1.x, O1.y, 'O');
      s += atom(O2.x, O2.y, 'O', { kind: 'warn' });
      s += text(472, 116, 'weak', { cls: 'fg-tag-warn', size: 11 });
      s += `<line class="fg-dash-hi" x1="414" y1="184" x2="412" y2="112"></line>`;
      s += text(380, 240, 'R′ sits anti to the O–O bond,', { cls: 'fg-sm', size: 10.5 });
      s += text(380, 260, 'so R′ is the one that can move', { cls: 'fg-sm', size: 10.5 });
      s += text(380, 282, 'ArCO₂ is the leaving group', { cls: 'fg-tag', size: 11 });
    }

    /* 3 — the concerted collapse. */
    s += tag(620, 36, '3 · three arrows at once');
    s += panel(510, 44, 236, 248);
    {
      const C = P(596, 160), OH = P(596, 108), R = P(548, 200), Rp = P(650, 196), O1 = P(660, 132), O2 = P(638, 86);
      s += bond(C, OH, { rFrom: 14, rTo: 16 });
      s += bond(C, R, { rFrom: 14, rTo: 13 });
      s += bond(C, Rp, { rFrom: 14, rTo: 16, cls: 'fg-bond-hi' });
      s += bond(C, O1, { rFrom: 14, rTo: 14 });
      s += bond(O1, O2, { rFrom: 14, rTo: 14, cls: 'fg-bond-hi' });
      s += atom(OH.x, OH.y, 'OH', { r: 16, size: 10.5 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += atom(Rp.x, Rp.y, 'R′', { kind: 'hi', r: 16, size: 10.5 });
      s += atom(O1.x, O1.y, 'O');
      s += atom(O2.x, O2.y, 'O', { kind: 'warn' });
      s += curve(P(582, 122), P(582, 144), { bow: -10 });
      s += curve(P(626, 180), P(646, 148), { bow: 14 });
      s += curve(P(640, 114), P(616, 90), { bow: -14 });
      s += text(614, 240, 'the OH makes the new C=O,', { cls: 'fg-sm', size: 10.5 });
      s += text(614, 260, 'R′ swings onto the near O,', { cls: 'fg-sm', size: 10.5 });
      s += text(614, 280, 'and the O–O breaks as it goes', { cls: 'fg-sm', size: 10.5 });
    }

    /* the products, and retention. */
    s += rule(24, 316, 736, 316);
    s += tag(196, 344, 'the products');
    s += panel(14, 356, 356, 96);
    s += text(192, 390, 'R–C(=O)–O–R′   the ester', { cls: 'fg-lbl', size: 13 });
    s += text(192, 414, 'the inserted oxygen sits between them', { cls: 'fg-sm', size: 10.5 });
    s += text(192, 438, '+  Ar–CO₂H, the acid left over', { cls: 'fg-tag', size: 11 });
    s += tag(568, 344, 'and at the migrating carbon');
    s += panel(390, 356, 356, 96);
    {
      const A = P(470, 402), B = P(640, 402);
      s += atom(A.x, A.y, 'C');
      s += wedge(A, P(446, 374), { rFrom: 14, rTo: 0 });
      s += hash(A, P(494, 374), { rFrom: 14, rTo: 0 });
      s += bond(A, P(470, 436), { rFrom: 14, rTo: 0 });
      s += arrow(P(520, 402), P(570, 402));
      s += atom(B.x, B.y, 'C');
      s += wedge(B, P(616, 374), { rFrom: 14, rTo: 0 });
      s += hash(B, P(664, 374), { rFrom: 14, rTo: 0 });
      s += bond(B, P(640, 436), { rFrom: 14, rTo: 0 });
      s += text(545, 380, 'retention', { cls: 'fg-tag-good', size: 11 });
    }
    s += label(380, 482, 'Nothing at the migrating carbon ever breaks, so nothing about it can change.');
    return s;
  },
  caption: 'One addition and one concerted collapse. Everything interesting is in the third panel, where three pairs of electrons move at once: the OH oxygen pushes down to make the new C=O, the C&ndash;R&prime; bond swings over onto the near oxygen of the O&ndash;O, and the O&ndash;O breaks onto the departing carboxylate.',
  note: 'Compare the third panel with a 1,2-shift in a carbocation rearrangement. There the electron sink is an empty p orbital on the neighboring carbon; here it is the &sigma;* orbital of the O&ndash;O bond. Same motion, same retention at the migrating carbon, a different hole for it to fall into &mdash; and one extra condition, because &sigma; overlap needs the migrating group lined up <i>anti</i> to the O&ndash;O bond, which is what a rigid ring can occasionally prevent.',
});

export default FIGURES;
