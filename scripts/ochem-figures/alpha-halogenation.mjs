/* Figures for the alpha-halogenation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 57 ---
   The whole section is one substituent effect read in two directions, which is
   a thing a diagram can show and a paragraph has to assert. Two columns, the
   same halogen in both, opposite arrows out of it. */
FIGURES.push({
  id: 'one-effect-two-directions',
  section: 'alpha-halogenation',
  anchor: '<h3>The haloform reaction</h3>',
  viewBox: '0 0 760 300',
  alt: 'Two columns comparing the acid route through the enol, which stops, with the base route through the enolate, which does not',
  build() {
    let s = '';
    const col = (x, kind, title, sub) => {
      s += panel(x, 46, 330, 150, { kind });
      s += text(x + 165, 74, title, { cls: 'fg-lbl', size: 13 });
      s += text(x + 165, 94, sub, { cls: 'fg-sm', size: 10.5 });
    };
    col(24,  null,   'ACID \u2014 through the enol', 'slow step: making the enol');
    col(406, 'warn', 'BASE \u2014 through the enolate', 'slow step: removing the proton');

    const line = (x, y, t, cls) => s += text(x, y, t, { cls, size: 11, anchor: 'start' });
    line(44,  124, 'needs the carbonyl to be BASIC', 'fg-tag');
    line(44,  146, 'the new halogen withdraws \u2192', 'fg-sm');
    line(44,  166, 'harder to protonate \u2192 slower', 'fg-tag-good');
    line(44,  186, 'STOPS at one halogen', 'fg-tag-good');

    line(426, 124, 'needs the α protons ACIDIC', 'fg-tag');
    line(426, 146, 'the new halogen withdraws \u2192', 'fg-sm');
    line(426, 166, 'more acidic \u2192 faster', 'fg-tag');
    line(426, 186, 'KEEPS GOING while α-H remain', 'fg-tag');

    s += rule(24, 224, 700, 224);
    s += text(24, 250, 'The halogen does the same thing in both columns. Only the requirement differs.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 274, 'On a METHYL ketone the runaway is the point: CX\u2083 is a leaving group hydroxide can expel.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 296, 'Out come the carboxylate and CHX\u2083 \u2014 one carbon shorter than you started.', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Two mechanisms, one substituent effect, opposite results. It is worth reading the two middle lines together: they are the same sentence, and everything after them diverges only because one route needs the substrate to be a base and the other needs it to be an acid.',
  note: 'The iodoform test rests on the right-hand column and on a distinction the name hides. It reports a CH\u2083CO or CH\u2083CH(OH) fragment, not a methyl group anywhere in the molecule \u2014 so 2-methylcyclohexanone, which has a methyl and is a ketone, is negative, because neither of its α carbons is that methyl. It brominates happily and simply never forms a CX\u2083 to expel.',
});

/* ----------------------------------------------------------------- 92 ---
   Alpha halogenation, drawn. The section argued the acid/base contrast well
   and drew no structure at all, so "through the enol" and "through the
   enolate" were words rather than pictures. */
FIGURES.push({
  id: 'halogenation-acid-vs-base',
  section: 'alpha-halogenation',
  anchor: 'so <b>monohalogenation is controllable</b>.</p>',
  viewBox: '0 0 720 392',
  alt: 'Acetophenone brominating through its enol under acid on the left and through its enolate under base on the right',
  build() {
    let s = '';
    s += text(180, 36, 'ACID — protonate first', { cls: 'fg-lbl', size: 12.5 });
    s += text(540, 36, 'BASE — deprotonate first', { cls: 'fg-lbl', size: 12.5 });
    s += rule(360, 52, 360, 360);

    const ketone = (x, hiMe) => {
      let g = '';
      const ph = P(x - 60, 116), c = P(x, 96), o = P(x, 56), me = P(x + 60, 116);
      g += bond(ph, c); g += bond(c, o, { order: 2 }); g += bond(c, me, { rTo: 16 });
      g += atom(ph.x, ph.y, 'Ph'); g += atom(c.x, c.y, 'C'); g += atom(o.x, o.y, 'O');
      g += atom(me.x, me.y, 'CH₃', { kind: hiMe ? 'hi' : 'plain' });
      return g;
    };
    s += ketone(170, false);
    s += ketone(550, true);

    // Acid: protonate the carbonyl oxygen
    s += text(250, 58, 'H–A', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += curve(P(246, 54), P(188, 48), { bow: 16 });
    s += arrow(P(170, 142), P(170, 172));
    s += text(186, 164, 'then solvent takes the α H', { cls: 'fg-sm', size: 10, anchor: 'start' });

    // Base: remove the alpha hydrogen
    s += text(626, 96, 'HO⁻', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += curve(P(624, 104), P(596, 116), { bow: 14 });
    s += arrow(P(550, 142), P(550, 172));
    s += text(544, 164, 'straight to the anion', { cls: 'fg-sm', size: 10, anchor: 'end' });

    // The two nucleophiles
    const enol = P(170, 206), enolO = P(170, 246);
    s += bond(P(110, 226), enol); s += bond(enol, enolO); s += bond(enol, P(230, 226), { order: 2 });
    s += atom(110, 226, 'Ph'); s += atom(enol.x, enol.y, 'C'); s += atom(enolO.x, enolO.y, 'OH', { r: 16 });
    s += atom(230, 226, 'CH₂', { kind: 'hi' });
    s += text(170, 278, 'the ENOL — neutral', { cls: 'fg-tag', size: 11 });

    const eno = P(550, 206), enoO = P(550, 246);
    s += bond(P(490, 226), eno); s += bond(eno, enoO); s += bond(eno, P(610, 226), { order: 2 });
    s += atom(490, 226, 'Ph'); s += atom(eno.x, eno.y, 'C'); s += atom(enoO.x, enoO.y, 'O⁻', { kind: 'warn' });
    s += atom(610, 226, 'CH₂', { kind: 'hi' });
    s += text(550, 278, 'the ENOLATE — anionic', { cls: 'fg-tag-warn', size: 11 });

    s += text(282, 206, 'Br–Br', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += curve(P(244, 216), P(288, 214), { bow: -18 });
    s += text(648, 206, 'Br–Br', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += curve(P(626, 216), P(644, 212), { bow: -14 });

    s += arrow(P(170, 292), P(170, 316), { muted: true });
    s += arrow(P(550, 292), P(550, 316), { muted: true });
    s += text(170, 338, 'PhCOCH₂Br — and it stops', { cls: 'fg-tag-good', size: 11 });
    s += text(550, 338, 'PhCOCH₂Br — then again, faster', { cls: 'fg-tag-warn', size: 11 });
    s += text(360, 382, 'Same product from one equivalent. Opposite behavior from two.', { cls: 'fg-lbl', size: 12.5 });
    return s;
  },
  caption: 'Same substrate, same halogen, opposite order of operations. Under acid you protonate first and never make an anion; under base you deprotonate first and never make a cation. Both routes put the bromine on the same carbon — the difference only shows up when you ask what happens next.',
  note: 'The nucleophile is the one thing to keep straight. On the left it is a neutral enol, whose C=C attacks Br₂ and whose OH proton is lost afterwards; on the right it is an anion that attacks directly. The enol is the slower of the two to form, which is why under acid the halogen concentration does not appear in the rate law at all.',
});

/* ----------------------------------------------------------------- 93 ---
   The haloform cleavage. The section says "CX3 is a workable leaving group"
   and the only way to believe that is to see the tetrahedral intermediate it
   leaves from. */
FIGURES.push({
  id: 'haloform-cleavage',
  section: 'alpha-halogenation',
  anchor: 'Products: the <b>carboxylate</b> (the acid after acidic workup) and <b>CHX<sub>3</sub></b>, the haloform.</p>',
  viewBox: '0 0 720 318',
  alt: 'A methyl ketone brominated three times, then cleaved by hydroxide through a tetrahedral intermediate that expels the tribromomethyl carbanion',
  build() {
    let s = '';
    const ket = (x, meLabel, hi) => {
      let g = '';
      g += bond(P(x - 58, 112), P(x, 92)); g += bond(P(x, 92), P(x, 54), { order: 2 });
      g += bond(P(x, 92), P(x + 58, 112), { rTo: 16 });
      g += atom(x - 58, 112, 'Ph'); g += atom(x, 92, 'C'); g += atom(x, 54, 'O');
      g += atom(x + 58, 112, meLabel, { kind: hi ? 'hi' : 'plain', r: 16 });
      return g;
    };
    s += ket(120, 'CH₃', false);
    s += arrow(P(216, 92), P(292, 92), { muted: true });
    s += text(254, 76, 'Br₂ × 3, ⁻OH', { cls: 'fg-tag', size: 11 });
    s += text(254, 132, 'each one faster', { cls: 'fg-sm', size: 10 });
    s += ket(390, 'CBr₃', true);

    s += text(524, 92, 'HO⁻', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += curve(P(520, 96), P(404, 84), { bow: 26 });
    s += text(586, 92, 'adds to the', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(586, 106, 'carbonyl', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += rule(20, 156, 700, 156);

    // The tetrahedral intermediate, drawn in full
    const c = P(150, 234);
    s += bond(c, P(150, 186)); s += bond(c, P(100, 206), { rTo: 15 });
    s += bond(c, P(100, 266), { rTo: 16 }); s += bond(c, P(206, 266), { rTo: 16 });
    s += atom(150, 186, 'O⁻', { kind: 'warn' });
    s += lonePair(150, 186, 180, { dist: 20 }); s += lonePair(150, 186, 240, { dist: 20 });
    s += lonePair(150, 186, 300, { dist: 20 });
    s += atom(100, 206, 'Ph'); s += atom(100, 266, 'OH', { r: 16 });
    s += atom(206, 266, 'CBr₃', { kind: 'hi', r: 16 });
    s += atom(c.x, c.y, 'C');
    s += curve(P(166, 196), P(162, 216), { bow: 12 });
    s += curve(P(166, 248), P(188, 260), { bow: -12 });
    s += text(150, 300, 'the C=O comes back, and CBr₃ leaves', { cls: 'fg-tag', size: 11 });

    s += arrow(P(266, 234), P(322, 234), { muted: true });

    const q = P(430, 228);
    s += bond(P(372, 248), q); s += bond(q, P(430, 190), { order: 2 }); s += bond(q, P(488, 248), { rTo: 16 });
    s += atom(372, 248, 'Ph'); s += atom(q.x, q.y, 'C'); s += atom(430, 190, 'O');
    s += atom(488, 248, 'O⁻', { kind: 'warn', r: 16 });
    s += text(556, 228, '+ CHBr₃', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(430, 294, 'benzoate — acidify to get the acid', { cls: 'fg-tag-good', size: 11 });
    s += text(556, 252, 'the haloform', { cls: 'fg-sm', size: 10, anchor: 'start' });
    return s;
  },
  caption: 'Ordinary nucleophilic acyl substitution with an unusual leaving group. Hydroxide adds, the tetrahedral intermediate collapses, and what walks away is a carbanion — which is only possible because three bromines are holding its charge.',
  note: 'The last step is a proton transfer and it is not optional: <sup>−</sup>CBr₃ is still a strong enough base to take the acid’s proton, so what you isolate before workup is the <b>carboxylate</b> and CHBr₃. Count the carbons on the way through — the methyl carbon leaves the molecule, so the product is one carbon shorter than the ketone you started with.',
});

/* ----------------------------------------------------------------- 94 ---
   HVZ as a cycle, because the phosphorus being catalytic is the part students
   cannot reconstruct from a linear scheme. */
FIGURES.push({
  id: 'hvz-cycle',
  section: 'alpha-halogenation',
  anchor: 'releasing the <b>&alpha;-bromo acid</b> and regenerating an acyl bromide to carry the cycle on.</p>',
  viewBox: '0 0 720 300',
  alt: 'The Hell-Volhard-Zelinsky cycle: acid to acyl bromide, bromination at the alpha carbon, then exchange back with more acid',
  build() {
    let s = '';
    s += text(150, 84, 'RCH₂CO₂H', { cls: 'fg-lbl', size: 12.5 });
    s += text(150, 104, 'no usable enol', { cls: 'fg-sm', size: 10 });
    s += text(560, 84, 'RCH₂COBr', { cls: 'fg-lbl', size: 12.5 });
    s += text(560, 104, 'this one enolizes', { cls: 'fg-tag-good', size: 11 });
    s += text(560, 228, 'RCHBrCOBr', { cls: 'fg-lbl', size: 12.5 });
    s += text(150, 228, 'RCHBrCO₂H', { cls: 'fg-lbl', size: 12.5 });
    s += text(150, 250, 'the product', { cls: 'fg-tag-good', size: 11 });

    s += arrow(P(230, 80), P(480, 80));
    s += text(355, 62, 'PBr₃ — catalytic', { cls: 'fg-tag', size: 11 });
    s += arrow(P(600, 124), P(600, 200));
    s += text(624, 156, 'Br₂, through', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(624, 172, 'the enol', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += arrow(P(480, 224), P(232, 224));
    s += text(356, 252, 'swap with a fresh RCH₂CO₂H', { cls: 'fg-tag', size: 11 });
    s += curve(P(470, 208), P(540, 124), { bow: 40 });
    s += text(420, 160, 'and hands back', { cls: 'fg-sm', size: 10 });
    s += text(420, 176, 'RCH₂COBr', { cls: 'fg-sm', size: 10 });

    s += rule(20, 276, 700, 276);
    s += text(360, 296, 'An acid has no enol worth having. Make the acyl bromide, and it does.', { cls: 'fg-lbl', size: 12.5 });
    return s;
  },
  caption: 'Hell–Volhard–Zelinsky drawn as the cycle it is. The phosphorus appears once, at the top, and never has to appear again: the last step exchanges bromide for the starting acid and hands a fresh acyl bromide back into the loop.',
  note: 'The reason the detour is necessary is the first line of the drawing. A carboxylic acid’s own hydroxyl already donates into the carbonyl, so there is essentially no enol to brominate. An acyl bromide has a far poorer donor attached and enolizes readily — and its alpha carbon is the one that ends up carrying the bromine.',
});

export default FIGURES;
