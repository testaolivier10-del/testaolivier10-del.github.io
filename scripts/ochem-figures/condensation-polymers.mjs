/* Figures for the condensation-polymers notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* Shared drawing helpers, copied from the builder. */
/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${x}" cy="${y}" r="3.4"></circle>`;

const FIGURES = [];

/* ----------------------------------------------------------------- 50 ---
   1/(1-p) is the whole reason step-growth is run the way it is, and a
   number line makes the cliff at the end visible in a way a table does not. */
FIGURES.push({
  id: 'conversion-cliff',
  section: 'condensation-polymers',
  anchor: '<h3>Why the kinetics feel different</h3>',
  viewBox: '0 0 760 310',
  alt: 'Degree of polymerization plotted against conversion, showing 10 at 90 percent, 100 at 99 percent and 1000 at 99.9 percent',
  build() {
    let s = '';
    const rows = [
      { p: '50%',   dp: '2',     w: 6,   note: 'dimers',        kind: 'warn' },
      { p: '90%',   dp: '10',    w: 30,  note: 'an oil',        kind: 'warn' },
      { p: '99%',   dp: '100',   w: 120, note: 'barely a plastic', kind: 'warn' },
      { p: '99.9%', dp: '1,000', w: 400, note: 'a material',    kind: null },
    ];
    s += tag(92, 48, 'conversion');
    s += tag(210, 48, 'DP = 1/(1−p)');
    s += tag(470, 48, 'what you have');
    s += rule(24, 62, 700, 62);
    rows.forEach((r, i) => {
      const y = 96 + i * 44;
      s += label(92, y + 4, r.p, { size: 12.5 });
      s += text(210, y + 4, r.dp, { cls: 'fg-lbl', size: 12.5 });
      s += bar(268, y - 11, r.w, 22, { kind: r.kind === 'warn' ? 'warn' : 'hi', opacity: 0.34 });
      s += text(688, y + 4, r.note, { cls: r.kind === 'warn' ? 'fg-tag' : 'fg-tag-good', anchor: 'end', size: 11 });
    });
    s += rule(24, 282, 700, 282);
    s += text(360, 306, 'Ninety-nine percent conversion sounds finished and gives a chain of a hundred.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Why a step-growth polymerization is run to a completeness that would be absurd for making a single ester. Any two pieces can join, so the mixture is short fragments until almost every functional group has reacted — and the material only appears in the last fraction of a percent.',
  note: 'Three requirements follow, and none of them is fussiness. <b>Exact stoichiometry</b>, because an excess of one monomer caps every chain end with a group that cannot react with its own kind. <b>High purity</b>, because one monofunctional impurity terminates a chain permanently. And <b>continuous removal of the water</b>, because every join is an equilibrium and the reaction has to be driven the whole way.',
});

/* ----------------------------------------------------------------- 76 ---
   Seven polymers are named in the condensation section and none is drawn.
   Four backbones, one bracket each, with the by-product question kept
   deliberately unanswerable from the drawing. */
FIGURES.push({
  id: 'four-backbones',
  section: 'condensation-polymers',
  anchor: 'Nothing exotic is happening &mdash; it is amide hydrogen bonding, the same interaction that holds a beta sheet together, multiplied by perfect alignment.</p>',
  viewBox: '0 0 760 580',
  alt: 'Four polymer backbones drawn inside repeat-unit brackets: PET with its two esters, nylon 6,6 with dotted hydrogen bonds to a second chain above it, Kevlar drawn dead straight from two para-phenylene rings, and a polyurethane with its carbamate linkage boxed',
  build() {
    let s = '';
    const brack = (x, y, h, dir) => {
      const t = y - h / 2, b = y + h / 2;
      return `<path class="fg-bond" d="M${x + 10 * dir} ${t} L${x} ${t} L${x} ${b} L${x + 10 * dir} ${b}"></path>`;
    };
    /* A run of labelled groups joined left to right and bracketed at both
       ends. `gap` is the VISIBLE length of each bond, so the radii of the two
       groups it joins have to be added on top of it — get that wrong and a
       bond between two wide labels renders as a dot. */
    const GAP = 34;
    const place = (x0, items) => {
      const out = [];
      let x = x0;
      for (const it of items) {
        x = out.length ? x + out[out.length - 1].r + (it.gap ?? GAP) + it.r : x + it.r;
        out.push({ x, ...it });
      }
      return out;
    };
    const draw = (y, x0, items) => {
      const ps = place(x0, items);
      let out = brack(x0 - 30, y, 58, 1);
      out += bond(P(x0 - 30, y), P(ps[0].x, y), { rFrom: 0, rTo: ps[0].r });
      for (let i = 0; i < ps.length - 1; i++) out += bond(P(ps[i].x, y), P(ps[i + 1].x, y), { rFrom: ps[i].r, rTo: ps[i + 1].r });
      const last = ps[ps.length - 1];
      out += bond(P(last.x, y), P(last.x + last.r + 30, y), { rFrom: last.r, rTo: 0 });
      out += brack(last.x + last.r + 30, y, 58, -1);
      out += text(last.x + last.r + 42, y + 22, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
      for (const p of ps) out += atom(p.x, y, p.l, { r: p.r, size: p.size ?? (p.l.length > 3 ? 9 : p.l.length > 2 ? 9.5 : 12), kind: p.kind });
      return { html: out, ps };
    };

    /* (a) PET. */
    s += text(46, 62, 'PET, a polyester', { cls: 'fg-tag-good', size: 11.5, anchor: 'start' });
    s += draw(96, 120, [
      { l: 'O', r: 15 }, { l: 'CH₂CH₂', r: 29 }, { l: 'O', r: 15 },
      { l: 'CO', r: 17, kind: 'hi' }, { l: 'C₆H₄', r: 25 }, { l: 'CO', r: 17, kind: 'hi' },
    ]).html;
    s += text(380, 146, 'two esters in every repeat unit, and water can find both of them', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 166, 720, 166);

    /* (b) Nylon 6,6, with a neighbouring chain and the hydrogen bonds. */
    s += text(46, 200, 'nylon 6,6, a polyamide', { cls: 'fg-tag-good', size: 11.5, anchor: 'start' });
    s += bond(P(110, 224), P(600, 224), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
    s += text(138, 219, 'O=C', { cls: 'fg-sm', size: 9.5 });
    s += text(298, 219, 'O=C', { cls: 'fg-sm', size: 9.5 });
    s += text(525, 219, 'H–N', { cls: 'fg-sm', size: 9.5 });
    s += text(676, 224, 'a neighboring chain', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += draw(286, 120, [
      { l: 'NH', r: 18 }, { l: '(CH₂)₆', r: 28 }, { l: 'NH', r: 18 },
      { l: 'CO', r: 17, kind: 'hi' }, { l: '(CH₂)₄', r: 28 }, { l: 'CO', r: 17, kind: 'hi' },
    ]).html;
    for (const x of [138, 298, 525]) s += `<line class="fg-dash" x1="${x}" y1="232" x2="${x}" y2="264"></line>`;
    s += text(380, 334, 'N–H···O=C from every amide to the chain alongside — one residue of a β sheet, repeated', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 352, 720, 352);

    /* (c) Kevlar. */
    s += text(46, 388, 'Kevlar, also a polyamide', { cls: 'fg-tag-good', size: 11.5, anchor: 'start' });
    s += draw(430, 120, [
      { l: 'NH', r: 18 }, { l: 'C₆H₄', r: 25 }, { l: 'NH', r: 18 },
      { l: 'CO', r: 17, kind: 'hi' }, { l: 'C₆H₄', r: 25 }, { l: 'CO', r: 17, kind: 'hi' },
    ]).html;
    s += text(380, 478, 'both partners aromatic and para, so the chain can neither coil nor bend', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 496, 720, 496);

    /* (d) Polyurethane, with the carbamate boxed. */
    s += text(46, 508, 'a polyurethane', { cls: 'fg-tag-good', size: 11.5, anchor: 'start' });
    s += panel(112, 516, 170, 62, { kind: 'warn' });
    s += draw(547, 120, [
      { l: 'O', r: 15, gap: 26 }, { l: 'CO', r: 17, gap: 26 }, { l: 'NH', r: 18, gap: 26 },
      { l: 'R', r: 15, gap: 26 }, { l: 'NH', r: 18, gap: 26 }, { l: 'CO', r: 17, gap: 26 },
      { l: 'O', r: 15, gap: 26 }, { l: 'R′', r: 17, gap: 26 },
    ]).html;
    s += text(700, 508, 'the boxed carbamate: every atom of both monomers is still in it', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    return s;
  },
  caption: 'Four backbones, each inside the brackets that mark one repeat unit. Three of the four were made by expelling a small molecule and one was not — and you cannot tell which from the drawn chain, because what names the class is the <b>linkage</b>, not the by-product. To answer that you have to go back to the monomers.',
  note: 'Stare at the second and third rows together. They carry the same amide linkage and the same hydrogen bond, and the only difference is what sits between: a floppy run of CH₂ in nylon, a flat para-substituted ring in Kevlar. The ring cannot rotate the chain out of line, so every amide in a Kevlar chain sits where its neighbor’s can reach it, and the hydrogen bonds add up along the whole length instead of only where the chain happens to be straight.',
});

/* --------------------------------------------------------------- 76c ---
   The one step-growth in the chapter that behaves differently is walked
   through in prose, arrow by arrow, and then drawn only as a finished
   carbamate in the backbones figure. */
FIGURES.push({
  id: 'urethane-addition',
  section: 'condensation-polymers',
  anchor: 'which is why the broader name for this class is <i>step-growth</i> rather than condensation.</p>',
  viewBox: '0 0 760 440',
  alt: 'Two steps of the urethane-forming addition: an alcohol oxygen adding to the carbon of an isocyanate while the carbon-nitrogen pi bond moves onto nitrogen, giving a zwitterion, and then the nitrogen taking the proton from the positively charged oxygen to give a neutral carbamate',
  build() {
    let s = '';
    const head2 = (y, a, b) => {
      s += tag(48, y - 48, a, { anchor: 'start' });
      s += text(48, y - 30, b, { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    };
    /* The zwitterion is drawn twice — as the product of step 1 and the
       starting material of step 2 — so it is built once here. Spacing is
       56, which leaves every bond about 25px of visible length. */
    const zwitter = (x0, y) => {
      let o = '';
      const xs = [0, 1, 2, 3, 4].map((i) => x0 + i * 56);
      o += atom(xs[0], y, 'R', { r: 15 });
      o += atom(xs[1], y, 'N', { r: 15, kind: 'warn' });
      o += atom(xs[2], y, 'C', { r: 15 });
      o += atom(xs[3], y, 'O', { r: 15, kind: 'warn' });
      o += atom(xs[4], y, 'R′', { r: 17 });
      for (let i = 0; i < 4; i++) o += bond(P(xs[i], y), P(xs[i + 1], y), { rFrom: 15, rTo: i === 3 ? 17 : 15 });
      o += atom(xs[2], y - 44, 'O', { r: 15 });
      o += bond(P(xs[2], y), P(xs[2], y - 44), { order: 2, rFrom: 15, rTo: 15 });
      o += atom(xs[3], y - 44, 'H', { r: 12, size: 10 });
      o += bond(P(xs[3], y), P(xs[3], y - 44), { rFrom: 15, rTo: 12 });
      o += text(xs[1] - 22, y - 12, '−', { cls: 'fg-tag-warn', size: 15 });
      o += text(xs[3] + 22, y - 12, '+', { cls: 'fg-tag-warn', size: 14 });
      return o;
    };

    /* 1. The addition itself. */
    head2(120, 'STEP 1 — THE ALCOHOL ADDS', 'nothing leaves, because nothing can');
    s += atom(96, 120, 'R', { r: 15 });
    s += atom(156, 120, 'N', { r: 15 });
    s += atom(216, 120, 'C', { r: 15, kind: 'hi' });
    s += atom(276, 120, 'O', { r: 15 });
    s += bond(P(96, 120), P(156, 120), { rFrom: 15, rTo: 15 });
    s += bond(P(156, 120), P(216, 120), { order: 2, rFrom: 15, rTo: 15 });
    s += bond(P(216, 120), P(276, 120), { order: 2, rFrom: 15, rTo: 15 });
    s += text(190, 162, 'an isocyanate: C between two electronegative atoms', { cls: 'fg-sm', size: 9.5 });
    s += text(316, 125, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(366, 120, 'R′O', { r: 22, size: 10 });
    s += atom(424, 120, 'H', { r: 12, size: 10 });
    s += bond(P(366, 120), P(424, 120), { rFrom: 22, rTo: 12 });
    s += lonePair(366, 120, 250, { dist: 30 });
    s += curve(P(352, 94), P(230, 100), { bow: -20 });
    s += curve(P(186, 104), P(160, 92), { bow: -12 });
    s += arrow(P(440, 120), P(478, 120), { muted: true });
    s += zwitter(500, 120);
    s += text(600, 180, 'every atom of both monomers, and both charges', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 200, 720, 200);

    /* 2. The proton transfer that neutralises it. */
    head2(320, 'STEP 2 — THE PROTON MOVES', 'nitrogen takes the proton');
    s += zwitter(170, 320);
    s += lonePair(226, 320, 250, { dist: 28 });
    s += curve(P(218, 298), P(330, 270), { bow: -56 });
    s += curve(P(350, 290), P(356, 310), { bow: 14 });
    s += arrow(P(440, 320), P(478, 320), { muted: true });
    s += atom(496, 320, 'R', { r: 15 });
    s += atom(556, 320, 'NH', { r: 18 });
    s += atom(618, 320, 'C', { r: 15 });
    s += atom(676, 320, 'O', { r: 15 });
    s += atom(730, 320, 'R′', { r: 17 });
    s += bond(P(496, 320), P(556, 320), { rFrom: 15, rTo: 18 });
    s += bond(P(556, 320), P(618, 320), { rFrom: 18, rTo: 15 });
    s += bond(P(618, 320), P(676, 320), { rFrom: 15, rTo: 15 });
    s += bond(P(676, 320), P(730, 320), { rFrom: 15, rTo: 17 });
    s += atom(618, 276, 'O', { r: 15 });
    s += bond(P(618, 320), P(618, 276), { order: 2, rFrom: 15, rTo: 15 });
    s += text(614, 376, 'a carbamate — the linkage O–CO–N', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 396, 720, 396);
    s += text(380, 418, 'Nothing is expelled anywhere in this figure: step-growth, but not a condensation.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The addition that builds a polyurethane, drawn arrow by arrow. The isocyanate carbon already carries both of its electronegative partners, so the alcohol can add to it without anything having to leave &mdash; the C=N &pi; bond simply becomes a lone pair on nitrogen, and the proton walks across afterwards.',
  note: 'This is the reason the class had to be renamed. Every other backbone in this section is built by expelling something &mdash; water, HCl &mdash; and the arithmetic of the repeat unit shows it. Here the repeat unit weighs exactly what the diol and the diisocyanate weighed together, and the only honest name for what happened is a step-growth <i>addition</i>.',
});

/* --------------------------------------------------------------- 76d ---
   Polycarbonate carries three questions in the bank and appears in the
   design section, and the whole of it — linkage, monomers, bent joint —
   was carried in prose. */
FIGURES.push({
  id: 'polycarbonate-drawn',
  section: 'condensation-polymers',
  anchor: 'Rigid but amorphous is exactly the combination safety glazing needs, which is why it makes safety glasses and bulletproof windows.</p>',
  viewBox: '0 0 760 360',
  alt: 'Bisphenol A drawn as two para-phenylene rings joined through a dimethyl carbon and capped with OH groups, beside phosgene, with an arrow losing two HCl to the bracketed polycarbonate repeat unit containing the O-CO-O carbonate linkage',
  build() {
    let s = '';
    s += tag(380, 30, 'ONE CARBONYL, TWO OXYGENS — THAT IS A CARBONATE');

    /* The two monomers. */
    s += atom(70, 110, 'HO', { r: 18, size: 10.5 });
    s += atom(135, 110, 'C₆H₄', { r: 25, size: 9 });
    s += atom(214, 110, 'C(CH₃)₂', { r: 32, size: 9, kind: 'warn' });
    s += atom(293, 110, 'C₆H₄', { r: 25, size: 9 });
    s += atom(358, 110, 'OH', { r: 18, size: 10.5 });
    const chainA = [[70, 18, 135, 25], [135, 25, 214, 32], [214, 32, 293, 25], [293, 25, 358, 18]];
    for (const [x1, r1, x2, r2] of chainA) s += bond(P(x1, 110), P(x2, 110), { rFrom: r1, rTo: r2 });
    s += text(214, 158, 'bisphenol A — a diol, both OH on rings', { cls: 'fg-sm', size: 9.5 });
    s += text(400, 115, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(440, 110, 'Cl', { r: 15, size: 10.5 });
    s += atom(494, 110, 'CO', { r: 17, kind: 'hi' });
    s += atom(548, 110, 'Cl', { r: 15, size: 10.5 });
    s += bond(P(440, 110), P(494, 110), { rFrom: 15, rTo: 17 });
    s += bond(P(494, 110), P(548, 110), { rFrom: 17, rTo: 15 });
    s += text(494, 176, 'phosgene — the diacid chloride of carbonic acid', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 196, 720, 196);

    /* The repeat unit. */
    s += arrow(P(96, 266), P(166, 266), { muted: true });
    s += text(131, 252, '− 2 HCl', { cls: 'fg-sm', size: 10 });
    const brack = (x, y, h, dir) => {
      const t = y - h / 2, b = y + h / 2;
      return `<path class="fg-bond" d="M${x + 10 * dir} ${t} L${x} ${t} L${x} ${b} L${x + 10 * dir} ${b}"></path>`;
    };
    s += brack(200, 266, 58, 1);
    s += atom(236, 266, 'O', { r: 15 });
    s += atom(294, 266, 'CO', { r: 17, kind: 'hi' });
    s += atom(352, 266, 'O', { r: 15 });
    s += atom(418, 266, 'C₆H₄', { r: 25, size: 9 });
    s += atom(501, 266, 'C(CH₃)₂', { r: 32, size: 9, kind: 'warn' });
    s += atom(584, 266, 'C₆H₄', { r: 25, size: 9 });
    s += bond(P(200, 266), P(236, 266), { rFrom: 0, rTo: 15 });
    const chainB = [[236, 15, 294, 17], [294, 17, 352, 15], [352, 15, 418, 25], [418, 25, 501, 32], [501, 32, 584, 25]];
    for (const [x1, r1, x2, r2] of chainB) s += bond(P(x1, 266), P(x2, 266), { rFrom: r1, rTo: r2 });
    s += bond(P(584, 266), P(635, 266), { rFrom: 25, rTo: 0 });
    s += brack(635, 266, 58, -1);
    s += text(647, 288, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(294, 316, 'the carbonate: O–CO–O', { cls: 'fg-tag-good', size: 10.5 });
    s += text(520, 316, 'the bent joint that stops it crystallizing', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(380, 344, 'Rigid rings give the stiffness; the kink at the quaternary carbon gives the transparency.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'Bisphenol A and phosgene, and the repeat unit they give. The linkage to look for is the middle three groups: one carbonyl carbon with an oxygen on <i>each</i> side, which is an ester of carbonic acid twice over and is what the name carbonate means.',
  note: 'The two highlighted features answer two different questions. The carbonate group is what a hydroxide or an amine attacks, so it is why polycarbonate can be depolymerized and why it slowly fails in hot alkali. The bent C(CH₃)₂ joint is why the chains cannot register with each other, so the material is amorphous — and an amorphous polymer well below its T<sub>g</sub> is both stiff and glass-clear, which is exactly what safety glazing needs.',
});

export default FIGURES;
