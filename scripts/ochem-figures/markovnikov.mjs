/* Figures for the markovnikov notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* A fishhook: one barb, because it carries one electron. `curve` in the kit
   draws a full two-barbed head, which in a radical mechanism says the wrong
   thing about how many electrons moved. */
function fishhook(a, b, opts = {}) {
  const f = (v) => (Math.round(v * 100) / 100);
  const bow = opts.bow ?? 30;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
  let ux = b.x - cx, uy = b.y - cy;
  const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const size = opts.size ?? 9;
  const px = -uy, py = ux;
  const side = opts.side ?? 1;
  const bx = b.x - ux * size, by = b.y - uy * size;
  const h = size * 0.6 * side;
  return `<path class="fg-arrow" d="M${f(a.x)} ${f(a.y)} Q${f(cx)} ${f(cy)} ${f(bx)} ${f(by)}"></path>` +
         `<path class="fg-head" d="M${f(b.x)} ${f(b.y)} L${f(bx + px * h)} ${f(by + py * h)} L${f(bx)} ${f(by)} Z"></path>`;
}

const FIGURES = [];

/* ---------------------------------------------------------------- 8.6 ---
   The peroxide route is a chain, and chains are examined in the initiation /
   propagation / termination form the radical chapter already taught. The
   section had it as two sentences. */
FIGURES.push({
  id: 'hbr-radical-chain',
  section: 'markovnikov',
  anchor: 'That one difference is the whole regiochemical story.</p>',
  alt: 'The radical chain for HBr addition to an alkene. Initiation: a peroxide splits into two alkoxy radicals, one of which takes a hydrogen from HBr to make a bromine radical. The two propagation steps are drawn as a cycle: the bromine radical adds to the less substituted carbon of the alkene leaving the more stable radical, and that carbon radical takes a hydrogen from HBr, regenerating the bromine radical.',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    s += panel(10, 14, 246, 250);
    s += tag(133, 40, 'INITIATION — happens once');
    s += text(133, 76, 'RO–OR', { cls: 'fg-lbl', size: 12 });
    s += arrow(P(133, 88), P(133, 118), { muted: true });
    s += text(133, 138, '2 RO·', { cls: 'fg-lbl', size: 12 });
    s += text(133, 160, 'the weak O–O bond breaks', { cls: 'fg-sm', size: 9 });
    s += text(133, 194, 'RO· + H–Br', { cls: 'fg-lbl', size: 12 });
    s += arrow(P(133, 206), P(133, 228), { muted: true });
    s += text(133, 248, 'RO–H + Br·', { cls: 'fg-tag-good', size: 12 });

    s += panel(272, 14, 478, 250);
    s += tag(511, 40, 'PROPAGATION — repeats thousands of times');

    // the cycle: two nodes, two curved arrows between them
    const left = P(378, 150), right = P(644, 150);
    s += text(left.x, left.y - 44, 'Br·', { cls: 'fg-lbl', size: 13 });
    s += text(left.x, left.y - 26, 'the chain carrier', { cls: 'fg-sm', size: 9 });
    s += text(right.x, right.y - 44, '·C–C–Br', { cls: 'fg-lbl', size: 13 });
    s += text(right.x, right.y - 26, 'the more stable radical', { cls: 'fg-sm', size: 9 });

    s += curve(P(left.x + 44, left.y - 8), P(right.x - 52, right.y - 8), { bow: -30 });
    s += text(511, 78, '1 · Br· adds to the LESS substituted carbon', { cls: 'fg-sm', size: 10 });
    s += text(511, 94, 'so the radical is left on the more substituted one', { cls: 'fg-sm', size: 9 });

    s += curve(P(right.x - 52, right.y + 12), P(left.x + 44, left.y + 12), { bow: -30 });
    s += text(511, 216, '2 · it takes H from H–Br and hands back a Br·', { cls: 'fg-sm', size: 10 });
    s += text(511, 232, 'which is why one initiation turns over thousands of molecules', { cls: 'fg-sm', size: 9 });

    s += text(378, 190, '+ alkene', { cls: 'fg-sm', size: 9.5 });
    s += text(644, 190, '+ H–Br', { cls: 'fg-sm', size: 9.5 });

    s += rule(30, 282, 730, 282);
    s += text(380, 306, 'TERMINATION: two carriers meet — Br· + Br·, or two carbon radicals — and that chain stops.', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 330, 'Bromine adds FIRST — every difference from the ionic route follows.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The chain written out in the form an exam asks for. The two propagation steps are a closed loop — bromine radical in, bromine radical out — so the alkene and the HBr are consumed while the carrier is not, and a trace of peroxide converts a whole flask.',
  note: 'Every arrow in a radical mechanism is a fishhook, moving ONE electron, and the reason the regiochemistry flips is at the top of the loop: a bromine ATOM adds before any hydrogen does, so it takes the position a proton would have taken in the ionic route.',
});

/* ---------------------------------------------------------------- 8.7 ---
   The transition state that unifies "sterics" and "B-H polarity", and the
   wedge/dash picture the worked example's answer cannot be checked without. */
FIGURES.push({
  id: 'hydroboration-syn-ring',
  section: 'markovnikov',
  anchor: 'a geometric consequence of the transition state having a closed ring.</p>',
  alt: 'Left: the four-center transition state for hydroboration, with dashed partial bonds from boron to the less substituted carbon and from hydrogen to the more substituted one, a partial positive charge on the more substituted carbon and partial negative on boron. Right: 1-methylcyclohexene reacting to give trans-2-methylcyclohexan-1-ol, with the new hydrogen on C1 and the new OH on C2 both drawn on wedges, which puts the OH on the opposite face from the methyl.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    // ---- left: the four-center TS
    s += panel(10, 14, 336, 248);
    s += tag(178, 40, 'one closed ring, four atoms');
    const cA = P(126, 118), cB = P(230, 118), bB = P(230, 196), hH = P(126, 196);
    s += bond(cA, cB, { order: 2, gap: 4.6 });
    s += `<line class="fg-dash-hi" x1="${230}" y1="${133}" x2="${230}" y2="${181}"></line>`;
    s += `<line class="fg-dash-hi" x1="${141}" y1="${189}" x2="${180}" y2="${170}"></line>`;
    s += bond(bB, hH, { rFrom: 15, rTo: 13 });
    s += atom(cA.x, cA.y, 'C', { kind: 'warn' });
    s += atom(cB.x, cB.y, 'C');
    s += atom(bB.x, bB.y, 'B', { kind: 'hi' });
    s += atom(hH.x, hH.y, 'H', { r: 13 });
    s += text(100, 96, 'δ+', { cls: 'fg-warn', size: 12, anchor: 'end' });
    s += text(258, 196, 'δ−', { cls: 'fg-sm', size: 11, anchor: 'start' });
    s += text(96, 140, 'more', { cls: 'fg-sm', size: 9, anchor: 'end' });
    s += text(96, 154, 'substituted', { cls: 'fg-sm', size: 9, anchor: 'end' });
    s += text(262, 140, 'less', { cls: 'fg-sm', size: 9, anchor: 'start' });
    s += text(262, 154, 'hindered', { cls: 'fg-sm', size: 9, anchor: 'start' });
    s += text(178, 232, 'B takes the roomy carbon; H follows the charge', { cls: 'fg-sm', size: 9.5 });
    s += text(178, 248, 'the closed ring blocks the other face', { cls: 'fg-tag-warn', size: 9.5 });

    // ---- right: the ring result
    s += panel(360, 14, 390, 248);
    s += tag(555, 40, 'so, on a ring: syn ≠ cis product');
    const ring = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => {
      const a = (-90 + i * 60) * Math.PI / 180;
      return P(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    });
    const R1 = ring(462, 150, 50);
    for (let i = 0; i < 6; i++) s += sk(R1[i], R1[(i + 1) % 6]);
    s += skDouble(R1[0], R1[1], P(462, 150));
    s += sk(R1[0], P(462, 62));
    s += text(462, 56, 'CH₃', { cls: 'fg-sm', size: 9.5 });
    s += text(452, 226, '1-methylcyclohexene', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(534, 150), P(570, 150));
    s += text(552, 136, 'BH₃', { cls: 'fg-sm', size: 9 });
    s += text(552, 170, 'H₂O₂', { cls: 'fg-sm', size: 9 });

    const R2 = ring(654, 150, 50);
    for (let i = 0; i < 6; i++) s += sk(R2[i], R2[(i + 1) % 6]);
    // C1 = R2[0] (top), C2 = R2[1] (upper right)
    s += wedge(R2[0], P(R2[0].x - 34, R2[0].y - 20), { rFrom: 0, rTo: 13, width: 9 });
    s += hash(R2[0], P(R2[0].x + 34, R2[0].y - 20), { rFrom: 0, rTo: 16, width: 11, rungs: 4 });
    s += atom(R2[0].x - 34, R2[0].y - 20, 'H', { r: 13, kind: 'hi' });
    s += atom(R2[0].x + 34, R2[0].y - 20, 'CH₃', { r: 16 });
    s += wedge(R2[1], P(R2[1].x + 38, R2[1].y - 10), { rFrom: 0, rTo: 16, width: 9 });
    s += atom(R2[1].x + 38, R2[1].y - 10, 'OH', { r: 16, kind: 'hi' });
    s += text(640, 226, 'trans-2-methylcyclohexan-1-ol', { cls: 'fg-tag-good', size: 9.5 });
    s += text(640, 242, 'new H and new OH both on wedges', { cls: 'fg-sm', size: 9 });

    s += rule(30, 278, 730, 278);
    s += text(380, 302, '"Syn" describes the two groups ADDED — not the methyl already there.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 324, 'H lands on the front of C1, pushing its methyl back — so the OH finishes trans.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The transition state, and what it does to a ring. Boron and hydrogen are joined to the two carbons in one four-membered arrangement, so they cannot arrive from opposite faces — and the partial positive charge sitting on the more substituted carbon is what sends boron to the other one.',
  note: 'Students lose this mark by reading "syn addition" as "cis product". The two new groups are cis to each other; whether the product is called cis or trans depends on what else the ring was already carrying, which here is a methyl group on the same carbon as the new hydrogen.',
});

export default FIGURES;
