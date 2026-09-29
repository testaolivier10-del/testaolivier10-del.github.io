/* Figures for the addition-reactions notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 8.3 ---
   Three mechanistic steps in one paragraph, no arrows, for the reaction the
   section itself calls the bridge into the next chapter. */
FIGURES.push({
  id: 'hydration-three-steps',
  section: 'addition-reactions',
  anchor: '<h3>Acid-catalyzed hydration</h3>',
  alt: 'Acid-catalyzed hydration of propene in three panels. First the pi bond attacks a proton of hydronium, giving a secondary carbocation. Then a water molecule attacks the cation with one of its lone pairs, giving a positively charged oxonium ion. Finally a second water molecule removes a proton from that oxygen, giving propan-2-ol and regenerating hydronium.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const box = (x, title, sub) => panel(x, 16, 236, 216) + tag(x + 118, 40, title) + text(x + 118, 214, sub, { cls: 'fg-sm', size: 9.5 });

    // ---- step 1: protonation
    s += box(8, 'Step 1 · protonation', 'Markovnikov: the better cation wins');
    const a0 = P(64, 150), a1 = P(106, 126), a2 = P(148, 150);
    s += skDouble(a0, a1, P(106, 176));
    s += sk(a1, a2);
    const hp = P(96, 70);
    s += atom(hp.x, hp.y, 'H', { r: 13, kind: 'hi' });
    s += text(130, 66, 'from H₃O⁺', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += curve(P(85, 138), P(96, 86), { bow: 22 });
    s += text(44, 168, 'C1', { cls: 'fg-sm', size: 9 });
    s += text(168, 168, 'C3', { cls: 'fg-sm', size: 9 });
    s += text(106, 196, 'the H lands on C1', { cls: 'fg-sm', size: 9 });
    s += arrow(P(228, 130), P(252, 130), { muted: true });

    // ---- step 2: water attacks
    s += box(260, 'Step 2 · capture', 'water is the nucleophile');
    const b0 = P(316, 150), b1 = P(358, 126), b2 = P(400, 150);
    s += sk(b0, b1) + sk(b1, b2);
    s += plus(358, 104);
    s += text(358, 176, 'secondary cation', { cls: 'fg-tag-warn', size: 9.5 });
    const ow = P(440, 78);
    s += atom(ow.x, ow.y, 'O', { r: 14, kind: 'hi' });
    s += text(466, 62, 'H', { cls: 'fg-sm', size: 10 });
    s += text(466, 96, 'H', { cls: 'fg-sm', size: 10 });
    s += lonePair(ow.x, ow.y, 200, { dist: 24 });
    s += curve(P(420, 92), P(368, 116), { bow: 20 });
    s += arrow(P(480, 130), P(504, 130), { muted: true });

    // ---- step 3: deprotonation
    s += box(512, 'Step 3 · give the proton back', 'the catalyst comes back out');
    const c0 = P(568, 150), c1 = P(610, 126), c2 = P(652, 150);
    s += sk(c0, c1) + sk(c1, c2);
    const oo = P(610, 78);
    s += bond(c1, oo, { rFrom: 0, rTo: 14 });
    s += atom(oo.x, oo.y, 'O', { r: 14, kind: 'hi' });
    s += plus(610, 44);
    s += text(584, 60, 'H', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(638, 88, 'H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(688, 62, 'H₂O', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += curve(P(684, 74), P(652, 84), { bow: -16 });
    s += text(610, 176, 'the oxonium ion', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(610, 192, 'lose that H⁺ and it is propan-2-ol', { cls: 'fg-sm', size: 9 });

    s += rule(30, 248, 730, 248);
    s += text(380, 274, 'The acid is a catalyst in the strict sense: consumed in step 1, handed back in step 3.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 294, 'Step 1 makes a free carbocation — so this route rearranges when a better cation is near.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Hydration with the arrows drawn. Every one of the three steps is a move you have already met: a pi bond taking a proton, a lone pair attacking a cation, and a base removing a proton from oxygen. The only thing worth memorizing is the order.',
  note: 'Notice what is NOT here: hydroxide. In acid the nucleophile is neutral water, and the extra proton it brings is removed afterwards. Drawing HO⁻ attacking in acidic solution is the most common way this mechanism is written wrong.',
});

/* ---------------------------------------------------------------- 8.4 ---
   "Every time you draw a carbocation, check for the shift" — with no shift
   drawn anywhere in the section. */
FIGURES.push({
  id: 'hydride-shift-worked',
  section: 'addition-reactions',
  anchor: 'Every time you draw a carbocation, check for the shift.</div>',
  alt: '3-methyl-1-butene plus HBr in four stages: protonation of the terminal carbon gives a secondary carbocation; a hydride on the neighboring carbon migrates with its pair of electrons, moving the positive charge to the tertiary carbon; bromide then captures that tertiary cation to give 2-bromo-2-methylbutane as the major product, with the unrearranged secondary bromide as the minor one.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    /* 3-methyl-1-butene, skeletal: C1=C2-C3(-CH3)-C4 */
    const stage = (x, mode) => {
      const v1 = P(x, 168), v2 = P(x + 40, 144), v3 = P(x + 80, 168), v4 = P(x + 120, 144);
      const me = P(x + 80, 214);
      let g = '';
      if (mode === 'alkene') g += skDouble(v1, v2, P(x + 20, 194));
      else g += sk(v1, v2);
      g += sk(v2, v3) + sk(v3, v4) + sk(v3, me);
      return { g, v1, v2, v3, v4, me };
    };

    // 1: the alkene + HBr
    let t = stage(24, 'alkene'); s += t.g;
    s += text(64, 122, 'H–Br', { cls: 'fg-lbl', size: 11 });
    s += curve(P(38, 152), P(58, 124), { bow: 16 });
    s += text(104, 240, '3-methyl-1-butene', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(168, 168), P(198, 168), { muted: true });

    // 2: secondary cation, hydride poised to shift
    t = stage(212, 'cation'); s += t.g;
    s += plus(252, 122);
    s += text(252, 108, '2°', { cls: 'fg-tag-warn', size: 9.5 });
    s += bond(t.v3, P(330, 192), { rFrom: 0, rTo: 12 });
    s += atom(330, 192, 'H', { r: 12, kind: 'hi' });
    s += curve(P(312, 186), P(262, 152), { bow: 22 });
    s += text(292, 240, 'hydride shifts, with its pair', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(360, 168), P(390, 168), { muted: true });

    // 3: tertiary cation
    t = stage(404, 'cation'); s += t.g;
    s += bond(t.v2, P(444, 106), { rFrom: 0, rTo: 12 });
    s += atom(444, 106, 'H', { r: 12, kind: 'hi' });
    s += plus(496, 152);
    s += text(484, 240, '3° cation — the more stable one', { cls: 'fg-tag-good', size: 9.5 });
    s += arrow(P(552, 168), P(582, 168), { muted: true });

    // 4: product
    t = stage(596, 'cation'); s += t.g;
    const brv = P(676, 108);
    s += bond(t.v3, brv, { rFrom: 0, rTo: 16 });
    s += atom(brv.x, brv.y, 'Br', { kind: 'hi', r: 16 });
    s += text(676, 240, '2-bromo-2-methylbutane', { cls: 'fg-tag-good', size: 9.5 });
    s += text(676, 256, 'the MAJOR product', { cls: 'fg-sm', size: 9 });

    s += rule(30, 270, 730, 270);
    s += text(380, 294, 'The shift is faster than bromide capture, so the rearranged bromide dominates.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The shift, drawn. A hydrogen on the carbon next door leaves with <b>both</b> of its bonding electrons and lands on the cationic carbon — which moves the positive charge the other way, from secondary to tertiary. Nothing else in the molecule changes.',
  note: 'The arrow starts at the C–H BOND, not at the hydrogen. That is the whole content of the word "hydride": H with its pair, not H⁺. If you draw the arrow from the hydrogen itself you have written a proton transfer, which would leave an alkene behind instead of a rearranged cation.',
});

/* ---------------------------------------------------------------- 8.5 ---
   Halohydrin regiochemistry was stated in one clause. It is the clause exams
   test, and it only makes sense if the bridged ion is drawn UNEVEN. */
FIGURES.push({
  id: 'halohydrin-uneven-bridge',
  section: 'addition-reactions',
  anchor: 'finish <b>anti</b> however unsymmetrical the ion was.</p>',
  alt: 'A bromonium ion from 2-methylpropene drawn with its two carbon-bromine bonds unequal: the bond to the more substituted carbon is long and dashed and that carbon carries a partial positive charge, while the bond to the CH2 end is short and full. Water attacks the more substituted carbon from the face opposite the bromine, giving a halohydrin with OH on the more substituted carbon and Br on the other, anti to each other.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += panel(10, 14, 420, 244);
    s += tag(220, 40, 'the bridged ion is not symmetrical');
    const cl = P(160, 176), cr = P(280, 176), brT = P(220, 104);
    s += bond(cl, cr, { rFrom: 15, rTo: 15 });
    s += bond(cl, brT, { rFrom: 15, rTo: 16 });
    s += `<line class="fg-dash-hi" x1="${268}" y1="${163}" x2="${230}" y2="${118}"></line>`;
    s += atom(brT.x, brT.y, 'Br', { kind: 'hi', r: 16 });
    s += plus(244, 92);
    s += atom(cl.x, cl.y, 'C');
    s += atom(cr.x, cr.y, 'C', { kind: 'warn' });
    s += text(302, 158, 'δ+', { cls: 'fg-warn', size: 12, anchor: 'start' });
    s += text(124, 214, 'CH₂ end', { cls: 'fg-sm', size: 9.5 });
    s += text(124, 230, 'short, tight C–Br', { cls: 'fg-sm', size: 9 });
    s += text(316, 214, 'two methyls here', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(316, 230, 'long, weak C–Br', { cls: 'fg-tag-warn', size: 9, anchor: 'start' });
    const w = P(312, 252);
    s += text(w.x + 26, w.y, 'H₂O', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += curve(P(330, 244), P(292, 196), { bow: -18 });
    s += text(220, 60, 'the carbon that can hold charge takes more of it', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(440, 150), P(478, 150));
    s += text(459, 134, 'anti', { cls: 'fg-sm', size: 9.5 });

    s += panel(492, 14, 258, 244);
    s += tag(621, 40, 'the halohydrin');
    const q1 = P(578, 132), q2 = P(660, 132);
    s += bond(q1, q2, { rFrom: 15, rTo: 15 });
    const ohv = P(660, 76), brv = P(578, 190);
    s += wedge(q2, ohv, { rFrom: 15, rTo: 16, width: 10 });
    s += hash(q1, brv, { rFrom: 15, rTo: 16, width: 12, rungs: 4 });
    s += atom(ohv.x, ohv.y, 'OH', { kind: 'hi', r: 16 });
    s += atom(brv.x, brv.y, 'Br', { r: 16 });
    s += atom(q1.x, q1.y, 'C') + atom(q2.x, q2.y, 'C');
    s += text(694, 126, 'CH₃', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(694, 146, 'CH₃', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(621, 226, 'OH on the more substituted carbon', { cls: 'fg-sm', size: 9.5 });
    s += text(621, 244, 'wedge and hash: opposite faces', { cls: 'fg-sm', size: 9 });

    s += rule(30, 270, 730, 270);
    s += text(380, 294, 'Charge says WHICH carbon; the blocked face says WHICH SIDE.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'Why water goes to the crowded carbon. Because that carbon is better able to carry positive charge, the bridge leans toward it: its bond to bromine stretches, it takes on real cationic character, and the barrier to attacking it drops below the barrier for attacking the tidy CH₂ end.',
  note: 'This is the one addition where the nucleophile lands on the MORE substituted carbon while the halogen ends up on the less substituted one. It is not an anti-Markovnikov reaction and it is not an SN2 preference — sterics would have sent water the other way, and charge overrules them.',
});

export default FIGURES;
