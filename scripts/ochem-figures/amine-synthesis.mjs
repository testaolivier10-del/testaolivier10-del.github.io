/* Figures for the amine-synthesis notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 59 ---
   The section's argument is that every route is an escape from one failure, so
   the failure goes in the middle and the escapes radiate off it. The carbon
   count is on each spoke because that is the question that actually decides
   between them. */
FIGURES.push({
  id: 'escapes-from-overalkylation',
  section: 'amine-synthesis',
  anchor: '<h3>Reductive amination: build the C&ndash;N bond by reduction instead</h3>',
  viewBox: '0 0 760 320',
  alt: 'The over-alkylation problem in the center with six routes around it, each labeled with what it gives and whether the carbon count changes',
  build() {
    let s = '';
    s += panel(250, 132, 260, 74, { kind: 'warn' });
    s += text(380, 158, 'R\u2013X + NH\u2083', { cls: 'fg-lbl', size: 13 });
    s += text(380, 180, 'a mixture: 1\u00b0, 2\u00b0, 3\u00b0, 4\u00b0', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 196, 'the first products outrun the ammonia', { cls: 'fg-sm', size: 10 });

    const rows = [
      { y: 46,  name: 'Gabriel',            gives: '1\u00b0 only',        c: 'same' },
      { y: 90,  name: 'azide, then reduce', gives: '1\u00b0 only',        c: 'same' },
      { y: 240, name: 'CN\u207b, then LiAlH\u2084', gives: '1\u00b0 only',   c: '+1' },
      { y: 284, name: 'amide, then LiAlH\u2084',  gives: '1\u00b0, 2\u00b0 or 3\u00b0', c: 'same' },
    ];
    for (const r of rows) {
      s += text(24, r.y, r.name, { cls: 'fg-lbl', size: 12, anchor: 'start' });
      s += text(24, r.y + 18, r.gives + '  \u00b7  carbons ' + r.c,
                { cls: r.c === 'same' ? 'fg-tag-good' : 'fg-tag', size: 10.5, anchor: 'start' });
    }
    s += text(540, 46, 'reductive amination', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(540, 64, '1\u00b0, 2\u00b0 or 3\u00b0 \u00b7 your choice', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(540, 82, 'no S\u2099\u00b2 limit on the halide', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(540, 262, 'Hofmann rearrangement', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(540, 280, '1\u00b0 only \u00b7 carbons \u22121', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(540, 298, 'that carbon leaves as CO\u2082', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += rule(24, 218, 700, 218);
    return s;
  },
  caption: 'One failure and six escapes from it. The three that run an S\u2099\u00b2 on a nitrogen surrogate \u2014 Gabriel, azide, cyanide \u2014 can only ever hand back a primary amine, and need a primary unhindered halide to do it. Reductive amination and amide reduction have neither limit, which is why they are the workhorses.',
  note: 'Read the right-hand column first. Butanamide is the compound to keep in mind: LiAlH\u2084 gives butylamine and Br\u2082/NaOH gives propylamine, so the same starting material and the same kind of product differ by a carbon depending only on the reagent. That is why the carbon count is the first question to ask of a proposed amine synthesis and not the last \u2014 a route can be flawless step by step and still arrive one carbon short.',
});

/* ---------------------------------------------------------------- 195 ---
   The synthesis section teaches seven routes and draws none of them. Gabriel
   is the one whose trick is invisible without a picture: what makes it work is
   a nitrogen that has nothing left to react with. */
FIGURES.push({
  id: 'gabriel-synthesis',
  section: 'amine-synthesis',
  anchor: 'Where the stereochemistry matters, that difference alone decides the route.</p>',
  viewBox: '0 0 760 486',
  alt: 'Phthalimide deprotonated by hydroxide, its anion doing an SN2 on a primary alkyl bromide, and hydrazine releasing the primary amine from the N-alkyl phthalimide',
  build() {
    let s = '';
    /* A phthalimide: benzene fused to the five-membered imide ring on its
       right-hand vertical edge. */
    const phthalimide = (cx, cy, nLabel, nKind, extra) => {
      let g = '';
      const r = 34;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      const mid = P(cx, cy);
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        if (i === 0 || i === 2 || i === 4) g += ringDouble(pts[i], pts[j], mid, { inset: 8 });
        else g += bond(pts[i], pts[j], { rFrom: 0, rTo: 0 });
      }
      const A = pts[1], B = pts[2];          // the fused edge, top and bottom
      const cTop = P(A.x + 40, A.y - 6), cBot = P(B.x + 40, B.y + 6), nn = P(A.x + 74, cy);
      g += bond(A, cTop, { rFrom: 0, rTo: 15 });
      g += bond(B, cBot, { rFrom: 0, rTo: 15 });
      g += bond(cTop, nn, { rFrom: 15, rTo: 16 });
      g += bond(cBot, nn, { rFrom: 15, rTo: 16 });
      g += bond(cTop, P(cTop.x + 6, cTop.y - 42), { order: 2, rTo: 15 });
      g += bond(cBot, P(cBot.x + 6, cBot.y + 42), { order: 2, rTo: 15 });
      g += atom(cTop.x + 6, cTop.y - 42, 'O');
      g += atom(cBot.x + 6, cBot.y + 42, 'O');
      g += atom(cTop.x, cTop.y, 'C', { kind: 'hi' });
      g += atom(cBot.x, cBot.y, 'C', { kind: 'hi' });
      g += atom(nn.x, nn.y, nLabel, { kind: nKind });
      if (extra) g += extra(nn);
      return g;
    };

    s += phthalimide(80, 124, 'NH', 'hi');
    s += text(40, 220, 'phthalimide', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(40, 238, 'pKₐ 8.3 — two carbonyls', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(40, 254, 'pulling on one N–H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(228, 104, 'KOH', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += arrow(P(226, 124), P(292, 124));

    s += phthalimide(384, 124, 'N⁻', 'warn');
    s += text(500, 106, '⊖', { cls: 'fg-hi', size: 13 });
    s += lonePair(458, 124, 0, { dist: 22 });
    s += text(344, 238, 'the anion — flat, delocalized,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(344, 254, 'and still a good nucleophile', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(600, 92, 'R–CH₂–Br', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += curve(P(506, 124), P(596, 112), { bow: -22 });
    s += text(520, 148, 'backside attack — inversion', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(520, 164, 'if the carbon is a stereocenter', { cls: 'fg-tag', size: 10.5, anchor: 'start' });

    s += rule(24, 278, 736, 278);

    s += phthalimide(110, 372, 'N', 'hi', (nn) => bond(nn, P(nn.x + 46, nn.y), { rFrom: 16, rTo: 18 }) + atom(nn.x + 46, nn.y, 'CH₂R', { r: 18 }));
    s += text(24, 468, 'no N–H left, and the pair is shared with BOTH carbonyls: it cannot alkylate again', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(392, 352, 'H₂NNH₂', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += arrow(P(390, 372), P(466, 372));

    s += atom(536, 372, 'R–CH₂–NH₂', { kind: 'hi', r: 46 });
    s += text(536, 440, 'a clean PRIMARY amine', { cls: 'fg-tag-good', size: 11 });
    s += text(644, 366, '+ phthal-', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(644, 382, 'hydrazide', { cls: 'fg-sm', size: 10, anchor: 'start' });
    return s;
  },
  caption: 'Gabriel in one line: build a nitrogen that can react exactly once, use it, then take it apart. The amine that comes out is clean because at no point in the sequence was there a nucleophilic amine sitting in a flask with an alkyl halide.',
  note: 'Two limits are visible in the drawing itself. The alkylation is an S<sub>N</sub>2 on the halide, so a secondary halide gives elimination instead and a tertiary one gives nothing but alkene &mdash; and whatever the nitrogen picks up, it picks up <b>once</b>, so the product is always a primary amine. If a secondary amine is the target, this route cannot reach it no matter what halide you feed it.',
});

/* ---------------------------------------------------------------- 196 ---
   The Hofmann rearrangement is stated as an outcome. The migration is the
   surprising part and nothing showed it happening. */
FIGURES.push({
  id: 'hofmann-rearrangement-mechanism',
  section: 'amine-synthesis',
  anchor: 'a stereocenter that migrates arrives with retention.</p>',
  viewBox: '0 0 760 470',
  alt: 'Butanamide deprotonated, brominated on nitrogen, deprotonated again, then rearranging as the propyl group migrates to nitrogen while bromide leaves, giving an isocyanate that hydrolyzes to propylamine and carbon dioxide',
  build() {
    let s = '';
    const amide = (cx, cy, nLabel, nKind) => {
      let g = '';
      g += bond(P(cx, cy), P(cx, cy - 46), { order: 2 });
      g += bond(P(cx, cy), P(cx - 50, cy + 32));
      g += bond(P(cx, cy), P(cx + 50, cy + 32));
      g += atom(cx, cy - 46, 'O'); g += lonePair(cx, cy - 46, 200);
      g += atom(cx - 50, cy + 32, 'Pr');
      g += atom(cx + 50, cy + 32, nLabel, { kind: nKind });
      g += atom(cx, cy, 'C', { kind: 'hi' });
      return g;
    };

    s += amide(120, 118, 'NH₂', 'hi');
    s += text(228, 92, 'HO⁻', { cls: 'fg-lbl', size: 12.5 });
    s += curve(P(218, 106), P(188, 138), { bow: 18 });
    s += tag(130, 196, '1 · take an N–H');

    s += amide(400, 118, 'NH', 'warn');
    s += text(478, 136, '⊖', { cls: 'fg-hi', size: 13 });
    s += lonePair(450, 150, 40, { dist: 20 });
    s += atom(508, 74, 'Br'); s += atom(556, 48, 'Br');
    s += bond(P(508, 74), P(556, 48));
    s += curve(P(468, 132), P(500, 90), { bow: 16 });
    s += curve(P(528, 58), P(566, 34), { bow: -14 });
    s += tag(410, 196, '2 · the anion takes a bromine');

    s += amide(660, 118, 'NHBr', 'warn');
    s += text(640, 196, '3 · the N-bromoamide — and HO⁻', { cls: 'fg-tag', size: 10.5 });
    s += text(640, 212, 'takes the last N–H', { cls: 'fg-tag', size: 10.5 });

    s += rule(24, 222, 736, 222);

    /* 4 - the migration */
    s += bond(P(150, 330), P(150, 284), { order: 2 });
    s += bond(P(150, 330), P(100, 362));
    s += bond(P(150, 330), P(200, 362));
    s += bond(P(200, 362), P(246, 392), { rFrom: 15, rTo: 15 });
    s += atom(150, 284, 'O'); s += lonePair(150, 284, 200);
    s += atom(100, 362, 'Pr', { kind: 'hi' });
    s += atom(200, 362, 'N', { kind: 'warn' });
    s += text(178, 392, '⊖', { cls: 'fg-hi', size: 12 });
    s += atom(246, 392, 'Br', { kind: 'warn' });
    s += atom(150, 330, 'C', { kind: 'hi' });
    s += curve(P(118, 344), P(182, 350), { bow: -20 });
    s += curve(P(224, 378), P(258, 412), { bow: -14 });
    s += text(158, 428, '4 · propyl moves to N as bromide', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(158, 444, 'leaves — one step, no free nitrene', { cls: 'fg-tag-warn', size: 10.5 });

    /* 5 - the isocyanate */
    s += bond(P(356, 330), P(408, 330), { order: 2, rFrom: 15, rTo: 16 });
    s += bond(P(408, 330), P(460, 330), { order: 2, rFrom: 16, rTo: 15 });
    s += bond(P(304, 330), P(356, 330), { rFrom: 15, rTo: 15 });
    s += atom(304, 330, 'Pr'); s += atom(356, 330, 'N'); s += atom(460, 330, 'O');
    s += atom(408, 330, 'C', { kind: 'hi' });
    s += text(408, 272, 'H₂O', { cls: 'fg-lbl', size: 12.5 });
    s += curve(P(408, 286), P(408, 310), { bow: 16 });
    s += tag(392, 392, '5 · an ISOCYANATE');

    /* 6 - the carbamic acid */
    s += bond(P(646, 330), P(646, 284), { order: 2 });
    s += bond(P(646, 330), P(596, 362));
    s += bond(P(646, 330), P(696, 362));
    s += atom(646, 284, 'O'); s += atom(596, 362, 'NHPr', { kind: 'hi' }); s += atom(696, 362, 'OH');
    s += atom(646, 330, 'C', { kind: 'hi' });
    s += tag(640, 400, '6 · carbamic acid');
    s += text(640, 428, 'falls apart on its own to CO₂', { cls: 'fg-sm', size: 10.5 });
    s += text(640, 444, 'and PrNH₂ — propylamine', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Four carbons in, three out, and the carbon that leaves is the one the nitrogen was attached to. Everything else in the chain is untouched &mdash; including a stereocenter, which migrates with its configuration intact.',
  note: 'Panel 4 is the step to draw carefully. The alkyl group and its bonding electrons move to nitrogen <i>while</i> bromide is leaving, in one step, which is why no electron-deficient nitrogen (a nitrene) is ever free and why nothing scrambles. The Curtius rearrangement joins this sequence at panel 5: heating an acyl azide expels N₂ and gives the same isocyanate, with the same migration and the same loss of the carbonyl carbon.',
});

export default FIGURES;
