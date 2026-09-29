/* Figures for the radical-halogenation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

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

/* tert-Butyl and its relatives: a central carbon with three methyls and,
   optionally, a fourth group at the given angle. */
function tBu(c, fourth, opts = {}) {
  let g = '';
  for (const deg of [120, 180, 240]) {
    const e = armEnd(c, deg, 46);
    g += bond(c, e, { rFrom: 15, rTo: 17 });
    g += atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
  }
  if (fourth) {
    const e = armEnd(c, 0, 46);
    g += bond(c, e, { rFrom: 15, rTo: fourth.r ?? 15, cls: fourth.cls });
    g += atom(e.x, e.y, fourth.label, { r: fourth.r ?? 15, size: fourth.size ?? 12, kind: fourth.kind });
  }
  g += atom(c.x, c.y, 'C', { kind: opts.kind });
  if (opts.charge) g += text(c.x + 2, c.y - 22, opts.charge, { cls: 'fg-tag-warn', size: 16 });
  return g;
}


/* ------------------------------------------------------------------ 7 ---
   The chain, drawn as a chain. The reason propagation is a cycle and
   termination is not is a fact about radical counts, and a loop says it
   better than three paragraphs can. */
FIGURES.push({
  id: 'radical-chain',
  section: 'radical-halogenation',
  anchor: '<h3>Three stages, and only one of them repeats</h3>',
  alt: 'Initiation, the two propagation steps drawn as a cycle, and termination, labeled by what each does to the radical count',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    // Initiation
    s += tag(112, 44, 'INITIATION');
    s += label(112, 92, 'X–X', { size: 14 });
    s += arrow(P(112, 108), P(112, 150));
    s += text(150, 132, 'hv or heat', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += label(112, 176, 'X•  +  X•', { size: 14 });
    s += text(112, 214, 'radicals: 0 → 2', { cls: 'fg-tag-good', size: 10.5 });
    s += text(112, 236, 'happens rarely, and', { cls: 'fg-sm', size: 9.5 });
    s += text(112, 250, 'only has to happen once', { cls: 'fg-sm', size: 9.5 });
    s += rule(224, 40, 224, 300);

    // Propagation, as a cycle
    s += tag(400, 44, 'PROPAGATION');
    const a = P(400, 104), b = P(400, 216);
    s += panel(288, 82, 224, 44, { kind: 'hi' });
    s += panel(288, 194, 224, 44, { kind: 'hi' });
    s += label(400, 109, 'X•  +  R–H  →  R•  +  H–X', { size: 12.5 });
    s += label(400, 221, 'R•  +  X–X  →  R–X  +  X•', { size: 12.5 });
    // The loop: down the right, back up the left.
    s += curve(P(516, 104), P(516, 216), { bow: -40 });
    s += curve(P(284, 216), P(284, 104), { bow: -40 });
    s += text(400, 168, 'each step uses one radical and makes one', { cls: 'fg-sm', size: 10 });
    s += text(400, 268, 'radicals: 2 → 2, so the cycle never stops itself', { cls: 'fg-tag-good', size: 10.5 });
    s += text(400, 292, 'net:  R–H  +  X₂  →  R–X  +  H–X', { cls: 'fg-lbl', size: 12 });
    s += rule(576, 40, 576, 300);

    // Termination
    s += tag(668, 44, 'TERMINATION');
    s += label(668, 96, 'X•  +  X•  →  X–X', { size: 11.5 });
    s += label(668, 130, 'R•  +  X•  →  R–X', { size: 11.5 });
    s += label(668, 164, 'R•  +  R•  →  R–R', { size: 11.5 });
    s += text(668, 214, 'radicals: 2 → 0', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(668, 236, 'rare while it runs —', { cls: 'fg-sm', size: 9.5 });
    s += text(668, 250, 'two radicals have to meet', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Sort the steps by what each does to the <b>number of radicals in the flask</b>, and the three stages name themselves. Up from zero is initiation, unchanged is propagation, down to zero is termination.',
  note: 'The middle panel is the reaction; the other two only start and stop it. Because each propagation step consumes one radical and produces one, the pair runs as a loop, and a single initiation event can turn over thousands of molecules before two radicals happen to collide and end it. That is also why the second propagation step is not termination even though the product appears there — the product is not what distinguishes the stages, the radical count is.',
});

/* ---------------------------------------------------------------- ch5.5 ---
   The mechanism, on a real molecule, with the arrows that carry one
   electron each. The section drew a generic X–X/R–H scheme and nothing else. */
FIGURES.push({
  id: 'radical-mechanism-drawn',
  section: 'radical-halogenation',
  anchor: '<p class="step-body"><b>Termination</b> is any step where two radicals find each other and pair up: X&middot; + X&middot;, R&middot; + X&middot;, or R&middot; + R&middot;. These consume two radicals and make none, which is what ends the chain. They are rare while the reaction runs, because the radical concentration is always tiny — two radicals have to collide, and there are very few of them in the flask at any moment.</p>',
  alt: 'The bromination of 2-methylpropane drawn in full: homolysis of bromine with two fishhook arrows, abstraction of the tertiary hydrogen, attack of the tertiary radical on bromine, and a termination step',
  viewBox: '0 0 760 620',
  build() {
    let s = '';
    /* tert-butyl group: central carbon, three methyl vertices, and either an
       H or an unpaired electron on the fourth position. */
    const tBu = (cx, cy, tip) => {
      const q = P(cx, cy);
      const m = [P(cx, cy - 40), P(cx - 36, cy + 22), P(cx + 36, cy + 22)];
      let g = '';
      for (const p of m) { g += bond(q, p, { rFrom: 0, rTo: 0 }); g += atom(p.x, p.y, '', { kind: 'point' }); }
      g += atom(q.x, q.y, '', { kind: 'point' });
      if (tip) { g += bond(q, tip.at, { rFrom: 0, rTo: tip.r ?? 14 }); }
      return g;
    };
    const HPOS = (cx, cy) => P(cx + 42, cy - 22);

    // ---- INITIATION ----
    s += tag(70, 34, 'INITIATION', { anchor: 'start' });
    s += text(70, 52, 'radicals 0 → 2', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    const b1 = P(150, 92), b2 = P(226, 92);
    s += bond(b1, b2);
    s += atom(b1.x, b1.y, 'Br', { kind: 'warn' });
    s += atom(b2.x, b2.y, 'Br', { kind: 'warn' });
    for (const a of [150, 210, 270]) s += lonePair(b1.x, b1.y, a, { dist: 24 });
    for (const a of [30, -30, -90]) s += lonePair(b2.x, b2.y, a, { dist: 24 });
    s += fishhook(P(184, 86), P(160, 66), { bow: 12 });
    s += fishhook(P(192, 86), P(216, 66), { bow: -12 });
    s += arrow(P(266, 92), P(340, 92), { muted: true });
    s += text(303, 76, 'hv', { cls: 'fg-sm', size: 10 });
    s += atom(376, 92, 'Br', { kind: 'warn' }); s += dot(396, 78);
    s += text(414, 97, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(450, 92, 'Br', { kind: 'warn' }); s += dot(470, 78);
    s += text(650, 86, 'two fishhooks, one per electron:', { cls: 'fg-sm', size: 10 });
    s += text(650, 102, 'the bond splits down the middle', { cls: 'fg-sm', size: 10 });
    s += rule(40, 140, 720, 140);

    // ---- PROPAGATION 1 ----
    s += tag(70, 176, 'PROPAGATION 1', { anchor: 'start' });
    s += text(70, 194, 'radicals 1 → 1', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    const c1 = P(190, 248);
    const h1 = HPOS(c1.x, c1.y);
    s += tBu(c1.x, c1.y, { at: h1, r: 13 });
    s += atom(h1.x, h1.y, 'H', { r: 13, size: 11 });
    s += atom(296, 200, 'Br', { kind: 'warn' }); s += dot(316, 186);
    for (const a of [150, 210, 270]) s += lonePair(296, 200, a, { dist: 24 });
    // C–H homolysis: one electron to the carbon, one to the bromine
    s += fishhook(P(212, 236), P(196, 222), { bow: 10 });
    s += fishhook(P(224, 228), P(276, 206), { bow: -18 });
    s += arrow(P(346, 238), P(416, 238), { muted: true });
    const c2 = P(478, 248);
    s += tBu(c2.x, c2.y, null);
    s += dot(c2.x + 20, c2.y - 12);
    s += text(c2.x + 50, c2.y - 6, '3° radical', { cls: 'fg-tag', size: 10, anchor: 'start' });
    s += text(578, 262, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(622, 258, 'H'); s += atom(664, 258, 'Br', { kind: 'warn' });
    s += bond(P(622, 258), P(664, 258));
    s += text(628, 198, 'the tertiary C–H is taken because it', { cls: 'fg-sm', size: 9.5 });
    s += text(628, 214, 'leaves the most stable radical', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 316, 720, 316);

    // ---- PROPAGATION 2 ----
    s += tag(70, 352, 'PROPAGATION 2', { anchor: 'start' });
    s += text(70, 370, 'radicals 1 → 1', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    const c3 = P(190, 424);
    s += tBu(c3.x, c3.y, null);
    s += dot(c3.x + 20, c3.y - 12);
    const d1 = P(288, 388), d2 = P(354, 388);
    s += bond(d1, d2);
    s += atom(d1.x, d1.y, 'Br', { kind: 'warn' });
    s += atom(d2.x, d2.y, 'Br', { kind: 'warn' });
    for (const a of [-90, 210] ) s += lonePair(d1.x, d1.y, a, { dist: 24 });
    for (const a of [30, -30, -90]) s += lonePair(d2.x, d2.y, a, { dist: 24 });
    s += fishhook(P(216, 414), P(270, 392), { bow: -18 });
    s += fishhook(P(316, 382), P(300, 366), { bow: 12 });
    s += fishhook(P(326, 382), P(344, 366), { bow: -12 });
    s += arrow(P(392, 414), P(456, 414), { muted: true });
    const c4 = P(518, 424);
    const br4 = P(c4.x + 46, c4.y - 26);
    s += tBu(c4.x, c4.y, { at: br4, r: 16 });
    s += atom(br4.x, br4.y, 'Br', { kind: 'warn' });
    s += text(632, 436, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(672, 432, 'Br', { kind: 'warn' }); s += dot(692, 418);
    s += text(744, 350, '2-bromo-2-methylpropane,', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(744, 366, 'and a fresh Br• to run it again', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += rule(40, 494, 720, 494);

    // ---- TERMINATION ----
    s += tag(70, 530, 'TERMINATION', { anchor: 'start' });
    s += text(70, 548, 'radicals 2 → 0', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    const c5 = P(200, 566);
    s += tBu(c5.x, c5.y - 4, null);
    s += dot(c5.x + 20, c5.y - 16);
    s += atom(300, 560, 'Br', { kind: 'warn' }); s += dot(282, 546);
    s += fishhook(P(226, 550), P(258, 542), { bow: -14 });
    s += fishhook(P(282, 556), P(250, 562), { bow: -14 });
    s += arrow(P(342, 556), P(406, 556), { muted: true });
    const c6 = P(468, 566);
    const br6 = P(c6.x + 46, c6.y - 26);
    s += tBu(c6.x, c6.y - 4, { at: br6, r: 16 });
    s += atom(br6.x, br6.y, 'Br', { kind: 'warn' });
    s += text(650, 550, 'same product, but the chain', { cls: 'fg-sm', size: 9.5 });
    s += text(650, 566, 'stops here — count the radicals', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Bromination of 2-methylpropane, drawn out. Every arrow here has <b>one barb</b>, because every arrow moves one electron, and two of them are needed wherever a bond breaks or forms. Nothing carries a charge at any point — if a step you have drawn produces a cation or an anion, it was not a radical step.',
  note: 'The last two rows make the same molecule and are not the same stage. Propagation 2 hands back a bromine radical, so the chain carries on; the termination step below it consumes both radicals and stops. That is why the stage is read off the radical count and never off the product.',
});

/* ---------------------------------------------------------------- ch5.6 ---
   Why the sluggish reagent is the selective one. The argument is about
   where along the coordinate the barrier sits, which is a picture. */
FIGURES.push({
  id: 'early-late-transition-state',
  section: 'radical-halogenation',
  anchor: '<p class="step-body">Put the two together. Chlorine’s abstraction is exothermic, so its transition state is early and reactant-like: the C–H has barely stretched, the radical has barely formed, and a difference in radical stability of a couple of kcal/mol has almost nothing to act on. Bromine’s abstraction is endothermic, so its transition state is late and product-like: the radical is essentially fully formed by the time the barrier is reached, and every bit of its stability is already showing up in the barrier height. The gap between a 3° and a 1° radical is the same 5 kcal/mol either way — 101 for a primary C–H against 96 for a tertiary — and bromine collects nearly all of it while chlorine collects almost none.</p>',
  alt: 'Two reaction-energy diagrams for hydrogen abstraction, one downhill with an early transition state for chlorine and one uphill with a late transition state for bromine',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    const panel1 = (ox, title, y0, y1, peakX, peakY, cls, tsLabel, dh) => {
      let g = '';
      const x0 = ox + 30, x1 = ox + 280;
      g += rule(x0, 250, x1, 250);
      g += rule(x0, 250, x0, 74);
      g += text(ox + 155, 44, title, { cls, size: 11.5 });
      const px = x0 + (x1 - x0) * peakX;
      g += `<path class="fg-bond-hi" d="M${x0} ${y0} C${x0 + (px - x0) * 0.55} ${y0} ${px - 26} ${peakY} ${px} ${peakY} C${px + 26} ${peakY} ${x1 - (x1 - px) * 0.55} ${y1} ${x1} ${y1}"></path>`;
      g += `<line class="fg-dash" x1="${px}" y1="${peakY}" x2="${px}" y2="250"></line>`;
      g += text(px, 268, tsLabel, { cls: 'fg-tag', size: 10 });
      g += text(x0 + 4, y0 - 12, 'R–H + X•', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      g += text(x1 - 4, y1 + (y1 > y0 ? 18 : -12), 'R• + H–X', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      g += text(ox + 155, 296, dh, { cls: 'fg-lbl', size: 11 });
      g += text(ox + 155, 316, 'reaction coordinate →', { cls: 'fg-sm', size: 9 });
      return g;
    };
    s += panel1(40, 'CHLORINE — DOWNHILL, EARLY TS', 170, 212, 0.30, 118, 'fg-tag-warn', 'peak sits early', 'ΔH ≈ −5 · selectivity 3°:1° ≈ 5 : 1');
    s += rule(390, 60, 390, 300);
    s += panel1(420, 'BROMINE — UPHILL, LATE TS', 212, 158, 0.72, 92, 'fg-tag-good', 'peak sits late', 'ΔH ≈ +11 · selectivity 3°:1° ≈ 1600 : 1');
    s += text(380, 336, 'Hammond: a transition state resembles whichever side it is closer to in energy.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The selectivity argument is a claim about <i>where</i> the barrier sits, so it is easier to see than to say. Chlorine\'s abstraction runs downhill, so the peak comes early and the structure at the top still looks like the alkane — the radical has barely begun to form, so how stable it would be barely matters.',
  note: 'Bromine\'s runs uphill, so the peak comes late and the structure at the top already looks like the radical. Every kcal/mol of radical stability is therefore already priced into the barrier, which is why a 5 kcal/mol gap between a tertiary and a primary radical becomes a factor of over a thousand in rate for bromine and a factor of five for chlorine.',
});

export default FIGURES;
