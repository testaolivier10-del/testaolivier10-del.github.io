/* Figures for the cross-coupling notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 37 ---
   A cycle drawn as a cycle. The three step names all describe what happens
   to the palladium, so putting the oxidation state on each arc turns four
   named reactions into one mechanism with a swappable partner. */
FIGURES.push({
  id: 'pd-cycle',
  section: 'cross-coupling',
  anchor: '<h3>The named reactions, by what the partner is</h3>',
  viewBox: '0 0 760 340',
  alt: 'The palladium catalytic cycle with oxidative addition, transmetalation and reductive elimination, and the palladium oxidation state marked on each stage',
  build() {
    let s = '';
    const cx = 300, cy = 164, r = 92;
    const nodes = [
      { ang: -90, lab: 'Pd(0)',        sub: 'the catalyst' },
      { ang:   0, lab: 'Ar–Pd–X', sub: 'Pd(II)' },
      { ang:  90, lab: 'Ar–Pd–R', sub: 'Pd(II)' },
    ];
    const pt = (ang) => P(cx + r * Math.cos(ang * Math.PI / 180), cy + r * Math.sin(ang * Math.PI / 180));
    for (const n of nodes) {
      const p = pt(n.ang);
      s += atom(p.x, p.y, '', { kind: 'point' });
      s += panel(p.x - 52, p.y - 20, 104, 40, { kind: n.ang === -90 ? null : 'hi' });
      s += text(p.x, p.y - 2, n.lab, { cls: 'fg-lbl', size: 12 });
      s += text(p.x, p.y + 14, n.sub, { cls: 'fg-sm', size: 9.5 });
    }
    s += arrow(P(cx + 58, cy - 66), P(cx + 84, cy - 26));
    s += text(cx + 132, cy - 58, 'oxidative addition', { cls: 'fg-tag', size: 10.5 });
    s += text(cx + 132, cy - 42, '0 → II', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(cx + 88, cy + 32), P(cx + 62, cy + 70));
    s += text(cx + 128, cy + 70, 'transmetalation', { cls: 'fg-tag', size: 10.5 });
    s += text(cx + 128, cy + 86, 'II → II', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(cx - 62, cy + 66), P(cx - 62, cy - 26));
    s += text(cx - 128, cy + 22, 'reductive elimination', { cls: 'fg-tag', size: 10.5 });
    s += text(cx - 128, cy + 38, 'II → 0, gives Ar–R', { cls: 'fg-sm', size: 9.5 });

    // The partner column: the only thing the named reactions differ in.
    s += rule(560, 56, 560, 272);
    s += tag(660, 48, 'what the partner is');
    const parts = [
      ['Suzuki', 'boronic acid + base'],
      ['Stille', 'stannane'],
      ['Negishi', 'organozinc'],
      ['Sonogashira', 'alkyne + Cu'],
      ['Heck', 'an alkene — no metal'],
    ];
    parts.forEach((p, i) => {
      const y = 92 + i * 36;
      s += text(600, y, p[0], { cls: 'fg-lbl', anchor: 'start', size: 12 });
      s += text(600, y + 16, p[1], { cls: 'fg-sm', anchor: 'start', size: 9.5 });
    });

    s += rule(34, 292, 726, 292);
    s += text(380, 318, 'Four names, one cycle. The Heck is the exception: no partner metal, so no transmetalation.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The palladium cycle, with the oxidation state on every stage. Pd(0) inserts into the aryl halide and is oxidized to Pd(II); the partner hands over its organic group without changing that; the two groups then join and leave, reducing the metal back to Pd(0).',
  note: 'Ending each turn exactly where it began is what makes palladium a catalyst rather than a reagent, and it is why a few mole percent can turn over thousands of times. It also explains the tolerance: the reactive carbon is bound to a metal for its whole life and never exists as a free carbanion, so ketones, esters and free alcohols elsewhere in the molecule survive.',
});

/* ---------------------------------------------------------------- C6 ---
   The one mechanism in the section that differs from the shared cycle, and
   the only one whose steps are geometric. Migratory insertion and syn
   beta-hydride elimination are both claims about WHICH FACE, which a
   sentence cannot make and a drawing can. */
FIGURES.push({
  id: 'heck-in-four',
  section: 'cross-coupling',
  anchor: 'So the Heck needs a full stoichiometric equivalent of base even though nothing in the substrate is ever deprotonated, and the by-product is the ammonium or carbonate salt. Track the oxidation states and the cycle only closes because of that last step.</p>',
  viewBox: '0 0 700 486',
  alt: 'Four frames of the Heck reaction: the alkene coordinating to an aryl palladium halide, migratory insertion putting the aryl group and the palladium on adjacent carbons, beta-hydride elimination giving the trans alkene and a palladium hydride, and the base removing HX to return palladium zero',
  build() {
    let s = '';

    /* 1 — coordination. */
    s += bond(P(80, 110), P(140, 110), { rFrom: 16, rTo: 16 });
    s += bond(P(140, 110), P(200, 110), { rFrom: 16, rTo: 15 });
    s += atom(80, 110, 'Ar', { kind: 'hi' });
    s += atom(140, 110, 'Pd', { kind: 'warn', r: 16 });
    s += atom(200, 110, 'X');
    s += text(140, 82, 'II', { cls: 'fg-sm', size: 10 });
    s += bond(P(262, 148), P(314, 148), { order: 2, rFrom: 17, rTo: 16 });
    s += bond(P(314, 148), P(352, 124), { rFrom: 16, rTo: 15 });
    s += atom(262, 148, 'CH₂', { r: 17 });
    s += atom(314, 148, 'CH', { r: 16 });
    s += atom(352, 124, 'R');
    s += `<line class="fg-dash-hi" x1="152" y1="124" x2="250" y2="146"></line>`;
    s += tag(196, 190, '1 · the alkene coordinates');

    /* 2 — migratory insertion. */
    s += bond(P(398, 104), P(450, 104), { rFrom: 16, rTo: 17 });
    s += bond(P(450, 104), P(502, 104), { rFrom: 17, rTo: 16 });
    s += bond(P(502, 104), P(554, 104), { rFrom: 16, rTo: 15 });
    s += bond(P(502, 104), P(502, 152), { rFrom: 16, rTo: 16 });
    s += bond(P(502, 152), P(554, 178), { rFrom: 16, rTo: 15 });
    s += atom(398, 104, 'Ar', { kind: 'hi' });
    s += atom(450, 104, 'CH₂', { r: 17 });
    s += atom(502, 104, 'CH', { r: 16 });
    s += atom(554, 104, 'R');
    s += atom(502, 152, 'Pd', { kind: 'warn', r: 16 });
    s += text(528, 144, 'II', { cls: 'fg-sm', size: 10 });
    s += atom(554, 178, 'X');
    s += tag(480, 214, '2 · migratory insertion, same face');

    s += rule(20, 240, 680, 240);

    /* 3 — syn beta-hydride elimination. */
    s += bond(P(70, 300), P(122, 300), { rFrom: 16, rTo: 15 });
    s += bond(P(122, 300), P(122, 254), { rFrom: 15, rTo: 15 });
    s += bond(P(122, 300), P(174, 300), { rFrom: 15, rTo: 15 });
    s += bond(P(174, 300), P(226, 300), { rFrom: 15, rTo: 15 });
    s += bond(P(174, 300), P(174, 348), { rFrom: 15, rTo: 16 });
    s += bond(P(174, 348), P(226, 374), { rFrom: 16, rTo: 15 });
    s += atom(70, 300, 'Ar', { kind: 'hi' });
    s += atom(122, 254, 'H', { kind: 'warn' });
    s += atom(122, 300, 'C');
    s += atom(174, 300, 'C');
    s += atom(226, 300, 'R');
    s += atom(174, 348, 'Pd', { kind: 'warn', r: 16 });
    s += text(150, 366, 'II', { cls: 'fg-sm', size: 10 });
    s += atom(226, 374, 'X');
    s += curve(P(134, 272), P(164, 332), { bow: -32 });
    s += curve(P(196, 336), P(150, 308), { bow: -22 });
    s += tag(150, 412, '3 · β-hydride elimination');

    /* 4 — and the base closes the cycle. */
    s += bond(P(400, 320), P(446, 296), { rFrom: 15, rTo: 0 });
    s += bond(P(446, 296), P(492, 320), { order: 2, rFrom: 0, rTo: 0, gap: 4 });
    s += bond(P(492, 320), P(538, 296), { rFrom: 0, rTo: 15 });
    s += atom(400, 320, 'Ar', { kind: 'hi' });
    s += atom(538, 296, 'R');
    s += tag(470, 264, 'trans, as drawn');
    s += bond(P(432, 374), P(478, 374), { rFrom: 15, rTo: 16 });
    s += bond(P(478, 374), P(524, 374), { rFrom: 16, rTo: 15 });
    s += atom(432, 374, 'H');
    s += atom(478, 374, 'Pd', { kind: 'warn', r: 16 });
    s += text(478, 346, 'II', { cls: 'fg-sm', size: 10 });
    s += atom(524, 374, 'X');
    s += arrow(P(556, 374), P(598, 374));
    s += tag(577, 356, '+ base');
    s += atom(640, 374, 'Pd(0)', { kind: 'hi', r: 22 });
    s += tag(480, 412, '4 · the base takes HX, and Pd(0) is back');

    s += rule(20, 440, 680, 440);
    s += label(350, 462, 'No transmetalation: the Heck inserts, then eliminates.');
    s += label(350, 482, 'The base is what closes the cycle, so it is needed in full.');
    return s;
  },
  caption: 'The Heck, step by step. There is no organometallic partner, so there is nothing to transmetalate: the alkene binds to the metal, <b>migratory insertion</b> puts Ar and Pd on adjacent carbons and on the same face, and <b>&beta;-hydride elimination</b> then hands the product back as an alkene.',
  note: 'Frame 4 is the one most summaries leave out, and without it the cycle does not balance. What comes off the elimination is H&ndash;Pd(II)&ndash;X, not Pd(0), so the catalyst is not yet regenerated &mdash; a stoichiometric base has to strip HX from it first. That is why a Heck needs a full equivalent of triethylamine or carbonate although nothing in the substrate is ever deprotonated.',
});

/* ---------------------------------------------------------------- C7 ---
   The Suzuki is called "the one to know properly" and then never appears as
   a structure. This is the worked example in the prose, drawn. */
FIGURES.push({
  id: 'suzuki-drawn',
  section: 'cross-coupling',
  anchor: 'The base is not optional: it converts the boronic acid to a borate, which is what transfers the R group in the transmetalation step.</p>',
  viewBox: '0 0 700 426',
  alt: 'Four-prime-bromoacetophenone and phenylboronic acid reacting under palladium tetrakis and aqueous sodium carbonate to give 4-acetylbiphenyl, with the ketone shaded to show it is untouched',
  build() {
    let s = '';
    const hex = (cx, cy) => [
      P(cx + 30, cy), P(cx + 15, cy + 26), P(cx - 15, cy + 26),
      P(cx - 30, cy), P(cx - 15, cy - 26), P(cx + 15, cy - 26),
    ];
    const ringAt = (cx, cy) => {
      const v = hex(cx, cy);
      let t = '';
      for (let i = 0; i < 6; i++) t += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0, order: i % 2 ? 2 : 1, gap: 4 });
      return { svg: t, v };
    };

    /* reactants */
    const a = ringAt(170, 110); s += a.svg;
    s += bond(a.v[3], P(110, 110), { rFrom: 0, rTo: 15 });
    s += atom(110, 110, 'Br', { kind: 'warn' });
    s += bar(198, 66, 92, 92, { kind: 'hi', opacity: 0.18 });
    s += bond(a.v[0], P(230, 110), { rFrom: 0, rTo: 16 });
    s += bond(P(230, 110), P(230, 70), { order: 2, rFrom: 16, rTo: 15 });
    s += bond(P(230, 110), P(266, 134), { rFrom: 16, rTo: 17 });
    s += atom(230, 70, 'O');
    s += atom(266, 134, 'CH₃', { r: 17 });
    s += atom(230, 110, 'C');
    s += label(330, 114, '+');
    const b = ringAt(420, 110); s += b.svg;
    s += bond(b.v[0], P(500, 110), { rFrom: 0, rTo: 30 });
    s += atom(500, 110, 'B(OH)₂', { kind: 'hi', r: 30 });
    s += tag(170, 184, '4′-bromoacetophenone');
    s += tag(450, 184, 'phenylboronic acid');

    s += arrow(P(300, 208), P(300, 240));
    s += tag(390, 216, 'Pd(PPh₃)₄, Na₂CO₃ (aq), heat');

    /* product */
    s += bar(96, 244, 96, 80, { kind: 'hi', opacity: 0.18 });
    const c = ringAt(216, 290); s += c.svg;
    const d = ringAt(306, 290); s += d.svg;
    s += bond(c.v[0], d.v[3], { rFrom: 0, rTo: 0 });
    s += bond(c.v[3], P(146, 290), { rFrom: 0, rTo: 16 });
    s += bond(P(146, 290), P(146, 250), { order: 2, rFrom: 16, rTo: 15 });
    s += bond(P(146, 290), P(110, 314), { rFrom: 16, rTo: 17 });
    s += atom(146, 250, 'O');
    s += atom(110, 314, 'CH₃', { r: 17 });
    s += atom(146, 290, 'C');
    s += text(275, 250, 'the bond palladium made', { cls: 'fg-tag-good', size: 11 });
    s += tag(216, 360, '4-acetylbiphenyl — the ketone never reacted');

    s += rule(20, 382, 680, 382);
    s += label(350, 406, 'A ketone sits in the flask throughout, and nothing happens to it.');
    return s;
  },
  caption: 'The Suzuki as a real equation. The aryl <b>bromide</b> is what palladium inserts into; the carbonate makes the four-coordinate borate that hands its phenyl over; the two rings then join and the metal is released as Pd(0).',
  note: 'Look at what is shaded. A phenyl Grignard put into this flask would add to that ketone and give you a tertiary alcohol, and you would have to protect it first. The boronic acid does not, because its aryl group is bound to boron and then to palladium for its whole life and is never a free carbanion — which is the tolerance argument stated as a picture rather than a claim.',
});

export default FIGURES;
