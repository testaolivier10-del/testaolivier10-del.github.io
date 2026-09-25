/* Figures for the leaving-groups notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- ch5.7 ---
   For chapter 2: the worked example that runs R–OH + HBr in prose, drawn. */
FIGURES.push({
  id: 'alcohol-to-bromide-steps',
  section: 'leaving-groups',
  anchor: '<p><b>Step 3 — bromide attacks.</b> The bromide already in solution bonds to the carbon as water departs, giving 1-bromobutane.</p>',
  alt: '1-butanol converted to 1-bromobutane by HBr in three drawn steps: an oxygen lone pair takes the proton from HBr, bromide attacks the carbon from the far side, and water leaves, giving 1-bromobutane',
  viewBox: '0 0 760 480',
  build() {
    let s = '';
    /* 1-butanol and its relatives, drawn skeletally with the heteroatom on
       the left, so the carbon under attack is the first chain vertex. */
    const chain = (hx, hy, hLabel, charge) => {
      const big = hLabel.length > 2;
      const r = big ? 19 : 15;
      const o = P(hx, hy), c1 = P(hx + 40, hy + 22), c2 = P(hx + 80, hy),
            c3 = P(hx + 120, hy + 22), c4 = P(hx + 160, hy);
      let g = bond(o, c1, { rFrom: r, rTo: 0 });
      g += bond(c1, c2, { rFrom: 0, rTo: 0 });
      g += bond(c2, c3, { rFrom: 0, rTo: 0 });
      g += bond(c3, c4, { rFrom: 0, rTo: 0 });
      for (const q of [c1, c2, c3, c4]) g += atom(q.x, q.y, '', { kind: 'point' });
      g += atom(o.x, o.y, hLabel, { r, size: big ? 10 : 12, kind: hLabel === 'Br' ? 'warn' : 'plain' });
      if (charge) g += text(o.x + r + 5, o.y - r + 4, charge, { cls: 'fg-tag-warn', size: 13 });
      return { g, o, c1, r };
    };

    // ---------- STEP 1: protonate ----------
    s += tag(40, 40, 'STEP 1 \u2014 PROTONATE THE OXYGEN', { anchor: 'start' });
    const brA = P(56, 150), hA = P(112, 150);
    s += bond(brA, hA);
    s += atom(brA.x, brA.y, 'Br', { kind: 'warn' });
    s += atom(hA.x, hA.y, 'H');
    for (const ang of [90, 180, 270]) s += lonePair(brA.x, brA.y, ang, { dist: 24 });
    const A = chain(168, 128, 'HO', null);
    s += A.g;
    for (const ang of [135, 225]) s += lonePair(A.o.x, A.o.y, ang, { dist: 24 });
    s += curve(P(146, 140), P(126, 146), { bow: 16 });      // lone pair \u2192 H
    s += curve(P(92, 142), P(70, 134), { bow: 14 });        // H\u2013Br bond \u2192 Br
    s += arrow(P(376, 142), P(438, 142), { muted: true });
    const B = chain(478, 128, 'H\u2082O', '+');
    s += B.g;
    s += text(716, 146, '+  Br\u207b', { cls: 'fg-lbl', size: 12, anchor: 'end' });
    s += text(380, 206, 'One lone pair takes the proton and the H\u2013Br pair goes to bromide \u2014 two arrows, one step.', { cls: 'fg-sm', size: 10 });
    s += text(380, 226, 'What has to leave is now neutral water, not hydroxide.', { cls: 'fg-tag-good', size: 10.5 });
    s += rule(40, 252, 720, 252);

    // ---------- STEPS 2 AND 3: displacement ----------
    s += tag(40, 288, 'STEPS 2 AND 3 \u2014 WATER LEAVES AS BROMIDE ARRIVES', { anchor: 'start' });
    const C = chain(150, 344, 'H\u2082O', '+');
    s += C.g;
    const nu = P(C.c1.x + 26, C.c1.y + 58);
    s += atom(nu.x, nu.y, 'Br', { kind: 'warn' });
    s += text(nu.x + 20, nu.y - 11, '\u2212', { cls: 'fg-tag-warn', size: 14 });
    for (const ang of [90, 150, 30]) s += lonePair(nu.x, nu.y, ang, { dist: 24 });
    s += curve(P(nu.x - 4, nu.y - 18), P(C.c1.x + 4, C.c1.y + 12), { bow: 14 });
    s += curve(P(C.c1.x - 16, C.c1.y - 10), P(C.o.x + 10, C.o.y + 18), { bow: -14 });
    s += arrow(P(376, 358), P(438, 358), { muted: true });
    const D = chain(478, 344, 'Br', null);
    s += D.g;
    s += text(560, 416, '1-bromobutane  +  H\u2082O', { cls: 'fg-tag-good', size: 11 });
    s += text(380, 452, 'Bromide arrives on the far side of the carbon at the same moment the C\u2013O bond breaks:', { cls: 'fg-sm', size: 10 });
    s += text(380, 470, 'one concerted step, because a primary carbon has no cation worth forming.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The same flask twice over. With NaBr there is no step 1, so the only way forward would be to push HO<sup>−</sup> off a carbon, and that step does not happen. HBr supplies a proton first, and once the oxygen is protonated the group that has to leave is <b>neutral water</b> rather than hydroxide — seventeen pK<sub>a</sub> units of difference, from one proton.',
  note: 'Steps 2 and 3 are drawn together on purpose. On a primary carbon like this one there is no carbocation worth forming, so water does not depart and wait — the bromide arrives on the far side of the carbon at the same moment the C–O bond breaks. Draw it as two separate events and you have quietly invented a primary carbocation, which is the commonest way this mechanism is written wrongly.',
});

export default FIGURES;
