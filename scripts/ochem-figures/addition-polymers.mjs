/* Figures for the addition-polymers notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* Shared drawing helpers, copied from the builder. */
/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${x}" cy="${y}" r="3.4"></circle>`;

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

/* ----------------------------------------------------------------- 49 ---
   Two samples with identical formula and identical repeat unit, and one is
   a bag and the other a pipe. Drawing the chains is the only way to make
   that believable. */
FIGURES.push({
  id: 'packing-architecture',
  section: 'addition-polymers',
  anchor: '<h3>Branching, and the two polyethylenes</h3>',
  viewBox: '0 0 760 320',
  alt: 'Linear chains lying flat against each other beside branched chains held apart, labeled HDPE and LDPE',
  build() {
    let s = '';
    // A run of chain as a shallow zigzag, optionally with a short branch.
    const chain = (x0, y, n, branchAt) => {
      let t = '', px = x0, py = y, up = true;
      for (let i = 0; i < n; i++) {
        const nx = px + 16, ny = up ? y - 6 : y + 6;
        t += `<line class="fg-bond" x1="${px}" y1="${py}" x2="${nx}" y2="${ny}"></line>`;
        if (branchAt && i === branchAt) {
          t += `<line class="fg-bond" x1="${nx}" y1="${ny}" x2="${nx + 8}" y2="${ny - 26}"></line>`;
          t += `<line class="fg-bond" x1="${nx + 8}" y1="${ny - 26}" x2="${nx + 22}" y2="${ny - 20}"></line>`;
        }
        px = nx; py = ny; up = !up;
      }
      return t;
    };
    const col = (ox, title, branched, label2, use, kind) => {
      s += panel(ox, 46, 330, 152, { kind });
      s += tag(ox + 165, 34, title);
      for (let r = 0; r < 4; r++) {
        s += chain(ox + 24, 78 + r * 30, 16, branched ? (r % 2 ? 4 : 9) : 0);
      }
      s += text(ox + 165, 220, label2, { cls: 'fg-lbl', size: 12 });
      s += text(ox + 165, 242, use, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11 });
    };
    col(24,  'linear — chains touch along their length', false,
        'HDPE: crystalline, dense, rigid', 'milk bottles and pipe', null);
    col(406, 'branched — held apart', true,
        'LDPE: less crystalline, less dense, floppy', 'plastic bags', 'warn');

    s += rule(24, 268, 700, 268);
    s += text(360, 294, 'Same monomer. Same repeat unit. Same molecular formula.', { cls: 'fg-lbl', size: 12 });
    s += text(360, 316, 'The difference is architecture, and it is the whole material.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The two polyethylenes. High-pressure radical polymerization lets a growing chain abstract a hydrogen from itself and continue from there, leaving branches; a Ziegler–Natta catalyst holds the chain end and suppresses it. Branches stop the chains touching, and everything else follows.',
  note: 'This is the fatty-acid argument from the biomolecules chapter, applied to a different molecule. Straight chains lie against their neighbors along their full length and the London forces add up; a bend or a branch breaks that contact and the melting point falls with it. Tacticity does the same job by a different route — atactic polypropylene cannot pack either, and it is a goo where the isotactic polymer is rope.',
});

/* ----------------------------------------------------------------- 74 ---
   The chapter's core mechanism was prose only, while the halogenation
   section three chapters back draws the identical anatomy. Same fishhooks,
   with a C=C in place of a C-H, and the two terminations drawn apart. */
FIGURES.push({
  id: 'polymer-chain-drawn',
  section: 'addition-polymers',
  anchor: 'Only the last of the three lowers the radical concentration, which is why adding a transfer agent shortens the chains without slowing the reaction down.</div>',
  viewBox: '0 0 760 752',
  alt: 'Six drawn steps of a radical polymerization with single-barbed fishhook arrows: homolysis of a peroxide, the first radical adding to a monomer, propagation, chain transfer to a thiol, termination by combination, and termination by disproportionation giving one saturated chain and one with a terminal double bond',
  build() {
    let s = '';
    const head2 = (y, a, b) => {
      s += tag(48, y - 48, a, { anchor: 'start' });
      s += text(48, y - 30, b, { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    };

    /* 1. Initiation: the peroxide splits. */
    head2(96, 'INITIATION', 'radicals 0 → 2');
    s += atom(160, 96, 'RO', { r: 18 });
    s += atom(236, 96, 'OR', { r: 18 });
    s += bond(P(160, 96), P(236, 96), { rFrom: 18, rTo: 18 });
    s += fishhook(P(190, 90), P(168, 70), { bow: 12 });
    s += fishhook(P(206, 90), P(228, 70), { bow: -12 });
    s += arrow(P(282, 96), P(350, 96), { muted: true });
    s += text(316, 84, 'Δ', { cls: 'fg-sm', size: 10 });
    s += atom(394, 96, 'RO', { r: 18 });
    s += dot(414, 82);
    s += text(440, 101, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(486, 96, 'RO', { r: 18 });
    s += dot(506, 82);
    s += text(380, 142, 'two fishhooks, one per electron: the weak O–O bond splits down the middle', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 166, 720, 166);

    /* 2. Initiation, second half: that radical adds to a monomer. */
    head2(216, 'FIRST ADDITION', 'radicals 1 → 1');
    s += atom(150, 216, 'RO', { r: 18 });
    s += dot(168, 203);
    s += text(200, 221, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(252, 216, 'CH₂', { r: 18 });
    s += atom(330, 216, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(252, 216), P(330, 216), { order: 2, rFrom: 18, rTo: 20 });
    s += fishhook(P(176, 209), P(230, 206), { bow: -16 });
    s += fishhook(P(294, 202), P(316, 192), { bow: -12 });
    s += arrow(P(378, 216), P(446, 216), { muted: true });
    s += atom(492, 216, 'RO', { r: 18 });
    s += atom(556, 216, 'CH₂', { r: 18 });
    s += atom(620, 216, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(492, 216), P(556, 216), { rFrom: 18, rTo: 18 });
    s += bond(P(556, 216), P(620, 216), { rFrom: 18, rTo: 20 });
    s += dot(634, 202);
    s += text(560, 262, 'the radical lands on the substituted carbon — head-to-tail', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 278, 720, 278);

    /* 3. Propagation. */
    head2(336, 'PROPAGATION', 'radicals 1 → 1');
    s += atom(140, 336, '~CH₂', { r: 23, size: 9 });
    s += atom(204, 336, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(140, 336), P(204, 336), { rFrom: 23, rTo: 20 });
    s += dot(218, 322);
    s += text(250, 341, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(300, 336, 'CH₂', { r: 18 });
    s += atom(366, 336, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(300, 336), P(366, 336), { order: 2, rFrom: 18, rTo: 20 });
    s += fishhook(P(226, 330), P(280, 330), { bow: -18 });
    s += fishhook(P(332, 322), P(352, 312), { bow: -12 });
    s += arrow(P(410, 336), P(470, 336), { muted: true });
    s += atom(518, 336, '~CH₂', { r: 23, size: 9 });
    s += atom(582, 336, 'CHX', { r: 20, size: 9.5 });
    s += atom(644, 336, 'CH₂', { r: 18 });
    s += atom(706, 336, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(518, 336), P(582, 336), { rFrom: 23, rTo: 20 });
    s += bond(P(582, 336), P(644, 336), { rFrom: 20, rTo: 18 });
    s += bond(P(644, 336), P(706, 336), { rFrom: 18, rTo: 20 });
    s += dot(720, 322);
    s += text(360, 384, 'one unit longer, one radical still at the end — repeat this a few thousand times', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 398, 720, 398);

    /* 4. Chain transfer. */
    head2(456, 'CHAIN TRANSFER', 'radicals 1 → 1');
    s += atom(140, 456, '~CH₂', { r: 23, size: 9 });
    s += atom(204, 456, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(140, 456), P(204, 456), { rFrom: 23, rTo: 20 });
    s += dot(218, 442);
    s += text(250, 461, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(302, 456, 'RS', { r: 18 });
    s += atom(368, 456, 'H', { r: 14 });
    s += bond(P(302, 456), P(368, 456), { rFrom: 18, rTo: 14 });
    s += fishhook(P(226, 448), P(352, 444), { bow: -24 });
    s += fishhook(P(346, 462), P(322, 462), { bow: 12 });
    s += arrow(P(410, 456), P(470, 456), { muted: true });
    s += atom(520, 456, '~CH₂', { r: 23, size: 9 });
    s += atom(592, 456, 'CH₂X', { r: 25, size: 9 });
    s += bond(P(520, 456), P(592, 456), { rFrom: 23, rTo: 25 });
    s += text(638, 461, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(684, 456, 'RS', { r: 18 });
    s += dot(702, 443);
    s += text(380, 504, 'that chain is dead, but a new radical carries on — the count never changed', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 518, 720, 518);

    /* 5. Termination by combination. */
    head2(576, 'TERMINATION — COMBINATION', 'radicals 2 → 0');
    s += atom(140, 576, '~CH₂', { r: 23, size: 9 });
    s += atom(204, 576, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(140, 576), P(204, 576), { rFrom: 23, rTo: 20 });
    s += dot(219, 563);
    s += text(250, 581, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(300, 576, 'XHC', { r: 20, size: 9.5 });
    s += atom(366, 576, 'CH₂~', { r: 23, size: 9 });
    s += bond(P(300, 576), P(366, 576), { rFrom: 20, rTo: 23 });
    s += dot(285, 563);
    s += fishhook(P(224, 568), P(248, 592), { bow: -14 });
    s += fishhook(P(280, 568), P(258, 592), { bow: 14 });
    s += arrow(P(414, 576), P(474, 576), { muted: true });
    s += atom(524, 576, '~CH₂', { r: 23, size: 9 });
    s += atom(588, 576, 'CHX', { r: 20, size: 9.5 });
    s += atom(652, 576, 'XHC', { r: 20, size: 9.5 });
    s += atom(716, 576, 'CH₂~', { r: 23, size: 9 });
    s += bond(P(524, 576), P(588, 576), { rFrom: 23, rTo: 20 });
    s += bond(P(588, 576), P(652, 576), { rFrom: 20, rTo: 20 });
    s += bond(P(652, 576), P(716, 576), { rFrom: 20, rTo: 23 });
    s += text(620, 622, 'one chain, of the two lengths added together', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 636, 720, 636);

    /* 6. Termination by disproportionation. */
    head2(696, 'TERMINATION — DISPROPORTIONATION', 'radicals 2 → 0');
    s += atom(124, 696, '~CH₂', { r: 23, size: 9 });
    s += atom(188, 696, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(124, 696), P(188, 696), { rFrom: 23, rTo: 20 });
    s += dot(203, 683);
    s += text(232, 701, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(282, 696, 'XHC', { r: 20, size: 9.5 });
    s += atom(350, 696, 'CH₂', { r: 18 });
    s += atom(412, 696, '~', { r: 12, size: 12 });
    s += bond(P(282, 696), P(350, 696), { rFrom: 20, rTo: 18 });
    s += bond(P(350, 696), P(412, 696), { rFrom: 18, rTo: 12 });
    s += dot(268, 708);
    s += fishhook(P(210, 690), P(336, 682), { bow: -22 });
    s += fishhook(P(350, 720), P(332, 726), { bow: 10 });
    s += fishhook(P(274, 720), P(300, 726), { bow: -10 });
    s += text(352, 744, 'the β-H, and both single electrons, into the new C=C', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(446, 696), P(500, 696), { muted: true });
    s += atom(544, 696, '~CH₂', { r: 23, size: 9 });
    s += atom(614, 696, 'CH₂X', { r: 25, size: 9 });
    s += bond(P(544, 696), P(614, 696), { rFrom: 23, rTo: 25 });
    s += text(656, 701, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(688, 696, 'XHC', { r: 20, size: 9.5 });
    s += atom(740, 696, 'CH~', { r: 19, size: 9.5 });
    s += bond(P(688, 696), P(740, 696), { order: 2, gap: 3.4, rFrom: 20, rTo: 19 });
    s += text(590, 736, 'saturated', { cls: 'fg-tag-good', size: 9.5 });
    s += text(690, 736, 'a C=C at the end', { cls: 'fg-tag-good', size: 9.5 });
    return s;
  },
  caption: 'The same four-part anatomy as radical halogenation, with a C=C in place of a C–H. Every arrow here has <b>one barb</b>, because every arrow moves one electron, and nothing carries a charge at any point — if a step you have drawn produces a cation or an anion, it was not a radical step.',
  note: 'Read the left-hand column and the mechanism sorts itself. Initiation makes radicals, propagation and chain transfer conserve them, and only termination destroys them — which is why a chain adds thousands of units before two ends happen to meet. The two terminations are worth separating: combination fuses the two chains into one, while disproportionation hands back two dead chains, one of them carrying a double bond that was not in any monomer.',
});

/* ----------------------------------------------------------------- 75 ---
   Tacticity is a three-dimensional idea taught in words. Wedges and dashes
   are the only way to show that the three polymers differ in nothing else. */
FIGURES.push({
  id: 'three-polypropylenes',
  section: 'addition-polymers',
  anchor: 'Stereocontrol and the absence of branching both come out of that single fact: the chain end is held, so it can neither flip nor curl back onto itself.</p>',
  viewBox: '0 0 760 430',
  alt: 'Three identical eight-carbon zig-zag backbones with their methyl groups drawn on wedges and dashes: all wedges for isotactic, alternating for syndiotactic, and an irregular mixture for atactic',
  build() {
    let s = '';
    s += tag(380, 26, 'SAME CONNECTIVITY, SAME FORMULA, THREE MATERIALS');
    const chain = (y, pattern, name, note, kind) => {
      const xs = [], n = 8;
      for (let i = 0; i < n; i++) xs.push({ x: 146 + i * 44, y: i % 2 === 0 ? y : y - 28 });
      for (let i = 0; i < n - 1; i++) s += bond(P(xs[i].x, xs[i].y), P(xs[i + 1].x, xs[i + 1].y), { rFrom: 0, rTo: 0 });
      for (const p of xs) s += atom(p.x, p.y, '', { kind: 'point' });
      pattern.forEach((w, k) => {
        const p = xs[k * 2];
        const tip = P(p.x, p.y + 40);
        s += (w ? wedge : hash)(P(p.x, p.y), tip, { rFrom: 0, rTo: 17 });
        s += atom(tip.x, tip.y, 'CH₃', { r: 17, size: 9 });
      });
      s += text(62, y - 20, name, { cls: kind, size: 12, anchor: 'start' });
      s += text(466, y - 8, note[0], { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(466, y + 8, note[1], { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    };
    chain(104, [true, true, true, true], 'isotactic',
      ['every methyl on the same face:', 'chains register — crystalline, Tm ≈ 165 °C'], 'fg-tag-good');
    s += rule(40, 174, 720, 174);
    chain(240, [true, false, true, false], 'syndiotactic',
      ['a regular alternation is a pattern too,', 'so these chains pack as well'], 'fg-tag-good');
    s += rule(40, 310, 720, 310);
    chain(376, [true, true, false, true], 'atactic',
      ['no pattern: no two stretches of chain', 'match, so nothing packs — a goo'], 'fg-tag-warn');
    return s;
  },
  caption: 'Three polypropylenes, drawn with the wedge-and-dash convention from the stereochemistry chapter. Nothing differs but which face each methyl points to, and that is enough to separate a car bumper from a sticky goo.',
  note: 'The practical lesson is a drawing habit: put the backbone down flat as a zig-zag first, and only then decide, carbon by carbon, whether each methyl comes forward or goes back. Drawn any other way the three rows look identical \u2014 and that is exactly the trap, because no formula, no molecular weight and no spectrum of the monomer separates them, while the first is rope, the second a usable plastic and the third a goo.',
});

export default FIGURES;
