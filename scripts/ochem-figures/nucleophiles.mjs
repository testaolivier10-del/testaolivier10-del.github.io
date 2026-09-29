/* Figures for the nucleophiles notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure is 340 wide with its panels stacked, and every label is
   fg-lbl or fg-tag, so the same drawing can sit in the lesson on a phone.
   Each trend is drawn on real species, and every curved arrow starts at a
   lone pair or a bond, as on the Carbonyl pages. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { polyPts } from '../lib/ochem-skeletal.mjs';
import { armEnd, lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---- small local helpers ------------------------------------------------ */

const rad = (l) => (l.length > 2 ? 18 : l.length > 1 ? 16 : 14);
/* An atom whose label is drawn at the CSS size (13px). */
const A = (p, l, kind = 'plain', r) => atom(p.x, p.y, l, { kind, size: 13, r: r ?? rad(l) });
/* A bond between two labeled atoms, trimmed to both discs. */
const B = (a, la, b, lb, opts = {}) => bond(a, b, { rFrom: la === '' ? 0 : rad(la), rTo: lb === '' ? 0 : rad(lb), ...opts });
/* A formal charge: the label class sets the size, the warn class the color. */
const chg = (x, y, s = '−') => `<text class="fg-lbl fg-warn" x="${x}" y="${y + 5}" text-anchor="middle">${s}</text>`;
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', anchor });
const tg = (x, y, s, kind = '', anchor = 'middle') => text(x, y, s, { cls: kind ? `fg-tag-${kind}` : 'fg-tag', size: 11, anchor });
const box = (y, h, title, kind) => panel(4, y, 332, h, kind ? { kind } : {}) + tag(170, y + 22, title);
const lp = (p, deg) => lonePair(p.x, p.y, deg, { dist: 21 });
/* A double-headed resonance arrow centered on (x, y). */
const reso = (x, y) => arrow(P(x, y), P(x + 16, y)) + arrow(P(x, y), P(x - 16, y));
/* A plain substituent at an angle (math convention: 0 east, counterclockwise). */
function arm(c, lc, deg, len, l, kind = 'plain') {
  const e = armEnd(c, deg, len);
  const o = { rFrom: rad(lc), rTo: rad(l) };
  const s = kind === 'wedge' ? wedge(c, e, { ...o, width: 9 })
          : kind === 'hash' ? hash(c, e, { ...o, width: 11, rungs: 4 })
          : bond(c, e, o);
  return s + A(e, l);
}
/* Bromomethane with its carbon at c: three H and a Br with three lone pairs. */
function mebr(c, opts = {}) {
  let s = '';
  const br = P(c.x + 64, c.y);
  s += B(c, 'C', br, 'Br');
  s += arm(c, 'C', 90, 44, 'H') + arm(c, 'C', 235, 44, 'H', 'wedge') + arm(c, 'C', 305, 44, 'H', 'hash');
  s += A(c, 'C', opts.kind || 'warn') + A(br, 'Br');
  s += lp(br, 270) + lp(br, 90) + lp(br, 0);
  return { s, br };
}
/* The two arrows of a displacement at carbon c: a lone pair at `from`
   attacks c, and the C–Br bond's electrons move onto Br. */
function displace(from, c, br) {
  return curve(from, P(c.x - 16, c.y - 6), { bow: -16 }) +
         curve(P((c.x + br.x) / 2, c.y - 3), P(br.x - 14, br.y - 11), { bow: -8 });
}
/* A tert-butoxide ion: quaternary C at q, three CH3, and O⁻ to the right. */
function tBuO(q) {
  let s = '';
  const o = P(q.x + 52, q.y);
  s += arm(q, 'C', 120, 46, 'CH₃') + arm(q, 'C', 180, 46, 'CH₃') + arm(q, 'C', 240, 46, 'CH₃');
  s += B(q, 'C', o, 'O') + A(q, 'C') + A(o, 'O', 'hi');
  s += lp(o, 270) + lp(o, 90) + lp(o, 0) + chg(o.x + 20, o.y - 22);
  return { s, o };
}
/* 2-Bromopropane with its central carbon at c: two CH3 flanking the side
   a nucleophile has to come in from, an H on a hash, and Br. */
function iprBr(c) {
  let s = '';
  const br = P(c.x + 56, c.y);
  s += arm(c, 'C', 135, 48, 'CH₃') + arm(c, 'C', 225, 48, 'CH₃') + arm(c, 'C', 300, 40, 'H', 'hash');
  s += B(c, 'C', br, 'Br') + A(c, 'C', 'warn') + A(br, 'Br');
  s += lp(br, 270) + lp(br, 90) + lp(br, 0);
  return { s, br };
}

/* ------------------------------------------------------------------ 1 ---
   The page's first example: hydroxide and bromomethane, with the lone pair
   that forms the new bond and the bond that breaks. */
FIGURES.push({
  id: 'nuc-first-attack',
  section: 'nucleophiles',
  lessons: ['nucleophiles'],
  anchor: '<h3>What it is</h3>',
  alt: 'Two stacked panels. Top: hydroxide ion, H–O with three lone pairs and a negative charge, sits to the left of bromomethane. A curved arrow runs from an oxygen lone pair to the carbon, which is marked delta plus, and a second curved arrow moves the C–Br bond electrons onto bromine. Hydroxide is labeled nucleophile and bromine leaving group. Bottom: the products, methanol, H–O–CH3 with two lone pairs on oxygen, and bromide ion with four lone pairs and a negative charge.',
  viewBox: '0 0 340 332',
  build() {
    let s = '';
    s += box(8, 196, 'HYDROXIDE MEETS BROMOMETHANE');
    const h = P(30, 112), o = P(80, 112), c = P(190, 112);
    s += B(h, 'H', o, 'O') + A(h, 'H') + A(o, 'O', 'hi');
    s += lp(o, 270) + lp(o, 90) + lp(o, 0) + chg(60, 92);
    const M = mebr(c);
    s += M.s;
    s += displace(P(104, 106), c, M.br);
    s += tg(210, 98, 'δ+', 'warn');
    s += tg(56, 190, 'nucleophile', 'good') + tg(176, 190, 'electrophile') + tg(284, 190, 'leaving group');

    s += box(216, 110, 'PRODUCTS');
    const h2 = P(30, 272), o2 = P(80, 272), m2 = P(138, 272);
    s += B(h2, 'H', o2, 'O') + B(o2, 'O', m2, 'CH₃');
    s += A(h2, 'H') + A(o2, 'O', 'hi') + A(m2, 'CH₃');
    s += lp(o2, 270) + lp(o2, 90);
    s += lbl(190, 277, '+');
    const br = P(250, 272);
    s += A(br, 'Br') + lp(br, 0) + lp(br, 90) + lp(br, 180) + lp(br, 270) + chg(274, 250);
    s += tg(84, 316, 'methanol') + tg(250, 316, 'bromide ion');
    return s;
  },
  caption: 'Follow the two arrows: one oxygen lone pair becomes the new C–O bond, and the C–Br pair leaves with bromine.',
});

/* ------------------------------------------------------------------ 2 ---
   The three families, each with the pair it donates picked out. */
FIGURES.push({
  id: 'nuc-three-families',
  section: 'nucleophiles',
  lessons: ['nucleophiles'],
  anchor: '<h3>What it is</h3>',
  alt: 'Three stacked panels. An anion: methoxide, CH3–O with three lone pairs and a full negative charge; the family includes hydroxide, alkoxides, cyanide, thiolates, halides and carbanions, and is the strongest. A neutral molecule with a lone pair: ammonia, N with three H and one lone pair; the family includes water, alcohols, amines and phosphines, with no charge and middling strength. A pi bond: ethene, with the second line of its C=C highlighted as the pi bond; the family includes alkenes, alkynes and aromatic rings, with no charge and no lone pair, and is the weakest.',
  viewBox: '0 0 340 420',
  build() {
    let s = '';
    // ---- anion ----
    s += box(8, 128, 'AN ANION');
    const m = P(46, 84), o = P(104, 84);
    s += B(m, 'CH₃', o, 'O') + A(m, 'CH₃') + A(o, 'O', 'hi');
    s += lp(o, 270) + lp(o, 90) + lp(o, 0) + chg(124, 62);
    s += tg(76, 124, 'methoxide', 'mut');
    s += tg(250, 58, 'full negative charge', 'good');
    s += tg(250, 80, 'hydroxide, alkoxides,');
    s += tg(250, 96, 'cyanide, thiolates,');
    s += tg(250, 112, 'halides, carbanions');

    // ---- neutral lone pair ----
    s += box(144, 128, 'A NEUTRAL MOLECULE WITH A LONE PAIR');
    const n = P(76, 204);
    s += arm(n, 'N', 200, 44, 'H') + arm(n, 'N', 340, 44, 'H') + arm(n, 'N', 270, 36, 'H');
    s += A(n, 'N', 'hi') + lp(n, 270);
    s += tg(76, 268, 'ammonia', 'mut');
    s += tg(250, 194, 'no charge', 'good');
    s += tg(250, 216, 'water, alcohols,');
    s += tg(250, 232, 'ammonia, amines,');
    s += tg(250, 248, 'phosphines');

    // ---- pi bond ----
    s += box(280, 132, 'A PI BOND');
    const c1 = P(70, 350), c2 = P(130, 350);
    s += bond(c1, c2, { rFrom: 14, rTo: 14 });
    s += bond(P(c1.x, c1.y - 7), P(c2.x, c2.y - 7), { rFrom: 14, rTo: 14, cls: 'fg-bond-hi' });
    s += arm(c1, 'C', 150, 40, 'H') + arm(c1, 'C', 210, 40, 'H') + arm(c2, 'C', 30, 40, 'H') + arm(c2, 'C', 330, 40, 'H');
    s += A(c1, 'C') + A(c2, 'C');
    s += tg(100, 322, 'π bond', 'hi');
    s += tg(100, 400, 'ethene', 'mut');
    s += tg(262, 330, 'no charge, no lone pair', 'good');
    s += tg(262, 352, 'alkenes, alkynes,');
    s += tg(262, 368, 'aromatic rings');
    return s;
  },
  caption: 'The highlighted atom or bond in each panel holds the pair that family donates.',
});

/* ------------------------------------------------------------------ 3 ---
   Charge: methoxide against methanol, attacking the same carbon. */
FIGURES.push({
  id: 'nuc-charge',
  section: 'nucleophiles',
  lessons: ['nucleophiles'],
  anchor: '<h3>What makes one stronger</h3>',
  alt: 'Two stacked panels, each with bromomethane on the right and the same two curved arrows: an oxygen lone pair attacks the carbon and the C–Br bond electrons move onto bromine. Top: methoxide, CH3–O with three lone pairs and a negative charge, labeled full negative charge, fast. Bottom: methanol, CH3–O–H with two lone pairs and no charge, labeled neutral, much slower.',
  viewBox: '0 0 340 372',
  build() {
    let s = '';
    const row = (y, title, anion, kind, verdict) => {
      let g = box(y, 176, title, kind);
      const m = P(30, y + 96), o = P(86, y + 96), c = P(196, y + 96);
      g += B(m, 'CH₃', o, 'O') + A(m, 'CH₃') + A(o, 'O', 'hi');
      if (anion) {
        g += lp(o, 270) + lp(o, 90) + lp(o, 0) + chg(106, y + 74);
      } else {
        g += arm(o, 'O', 90, 44, 'H') + lp(o, 90) + lp(o, 0);
      }
      const M = mebr(c);
      g += M.s + displace(P(110, y + 90), c, M.br);
      g += tg(170, y + 162, verdict, anion ? 'good' : 'warn');
      return g;
    };
    s += row(8, 'METHOXIDE · CHARGE −1', true, null, 'full negative charge: fast');
    s += row(192, 'METHANOL · NO CHARGE', false, null, 'neutral: much slower');
    return s;
  },
  caption: 'The same oxygen attacks the same carbon in both panels. Only the charge differs.',
});

/* ------------------------------------------------------------------ 4 ---
   Across a row: the same charge on C, N, O and F. */
FIGURES.push({
  id: 'nuc-row',
  section: 'nucleophiles',
  lessons: ['nucleophiles'],
  anchor: '<h3>What makes one stronger</h3>',
  alt: 'Four anions from one row of the periodic table, each with one negative charge, drawn with their lone pairs: H3C minus with one lone pair (carbon, electronegativity 2.55), H2N minus with two (nitrogen, 3.04), HO minus with three (oxygen, 3.44) and F minus with four (fluorine, 3.98). Below them, the order of nucleophilicity: H3C minus, then H2N minus, then HO minus, then F minus.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    s += box(8, 314, 'ONE ROW, ONE NEGATIVE CHARGE EACH');
    // methyl anion
    const c = P(92, 84);
    s += arm(c, 'C', 150, 40, 'H') + arm(c, 'C', 210, 40, 'H') + arm(c, 'C', 270, 38, 'H');
    s += A(c, 'C', 'hi') + lp(c, 0) + chg(112, 62);
    s += tg(92, 158, 'C · EN 2.55');
    // amide ion
    const n = P(252, 84);
    s += arm(n, 'N', 150, 40, 'H') + arm(n, 'N', 210, 40, 'H');
    s += A(n, 'N', 'hi') + lp(n, 300) + lp(n, 60) + chg(280, 84);
    s += tg(252, 158, 'N · EN 3.04');
    // hydroxide
    const o = P(92, 212);
    s += arm(o, 'O', 180, 44, 'H');
    s += A(o, 'O', 'hi') + lp(o, 0) + lp(o, 90) + lp(o, 270) + chg(114, 192);
    s += tg(92, 266, 'O · EN 3.44');
    // fluoride
    const f = P(252, 212);
    s += A(f, 'F', 'hi') + lp(f, 0) + lp(f, 90) + lp(f, 180) + lp(f, 270) + chg(274, 192);
    s += tg(252, 266, 'F · EN 3.98');
    s += lbl(170, 298, 'H₃C⁻  >  H₂N⁻  >  HO⁻  >  F⁻');
    s += tg(170, 314, 'strongest nucleophile on the left', 'good');
    return s;
  },
  caption: 'Read C, N, O, F in order, top left to bottom right. Each step adds a lone pair and a more electronegative atom to hold it.',
});

/* ------------------------------------------------------------------ 5 ---
   Polarizability: fluoride's cloud against iodide's, next to a δ+ carbon. */
FIGURES.push({
  id: 'nuc-polarizable',
  section: 'nucleophiles',
  lessons: ['nucleophiles'],
  anchor: '<h3>What makes one stronger</h3>',
  alt: 'Two stacked panels, each with bromomethane on the right and its carbon marked delta plus. Top: fluoride ion, a small round electron cloud that stays round. Bottom: iodide ion, a large cloud; a dashed circle shows its resting shape, and the shaded cloud is stretched toward the delta plus carbon.',
  viewBox: '0 0 340 316',
  build() {
    let s = '';
    const target = (y) => {
      const c = P(206, y), br = P(270, y);
      return B(c, 'CH₃', br, 'Br') + A(c, 'CH₃', 'warn') + A(br, 'Br') + lp(br, 270) + lp(br, 90) + lp(br, 0) +
             tg(206, y - 28, 'δ+', 'warn');
    };
    s += box(8, 144, 'FLUORIDE: SMALL, TIGHT CLOUD');
    s += lobeE(84, 88, 24, 24) + A(P(84, 88), 'F', 'hi') + chg(114, 60);
    s += target(88);
    s += tg(84, 138, 'cloud stays round', 'mut');

    s += box(160, 148, 'IODIDE: LARGE, LOOSE CLOUD');
    s += `<circle class="fg-dash" cx="80" cy="238" r="38"></circle>`;
    s += lobeE(94, 238, 52, 34) + A(P(80, 238), 'I', 'hi') + chg(64, 194);
    s += target(238);
    s += tg(170, 294, 'cloud stretches toward the δ+ carbon', 'good');
    return s;
  },
  caption: 'The dashed circle is iodide’s cloud on its own. The shaded shape is the same cloud with the δ+ carbon nearby.',
});

/* ------------------------------------------------------------------ 6 ---
   Solvent: fluoride caged by methanol, iodide loosely held, fluoride naked
   in DMSO. */
FIGURES.push({
  id: 'nuc-solvent',
  section: 'nucleophiles',
  lessons: ['nucleophiles'],
  anchor: '<h3>Solvent matters too, and it can reverse the order</h3>',
  alt: 'Three stacked panels. Fluoride in methanol: four methanol molecules surround F minus, all pointing their O–H hydrogens at the ion through short, bold dashed hydrogen bonds, forming a tight cage. Iodide in methanol: a larger I minus, also surrounded by four methanols, but on long, faint dashed hydrogen bonds, a loose hold. Fluoride in DMSO: the DMSO oxygens surround a potassium ion, and the fluoride ion sits alone with its four lone pairs and nothing hydrogen-bonded to it.',
  viewBox: '0 0 340 626',
  build() {
    let s = '';
    const dash = (a, b, cls) => `<line class="${cls}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"></line>`;
    // A methanol hydrogen-bonded to an ion at ion, along direction deg:
    // H at distance rh, the OCH3 at distance ro, dashes from the ion's edge.
    const meoh = (ion, rIon, deg, rh, ro, cls = 'fg-dash-hi') => {
      const h = armEnd(ion, deg, rh), o = armEnd(ion, deg, ro);
      return dash(armEnd(ion, deg, rIon + 2), armEnd(ion, deg, rh - 14), cls) +
             B(h, 'H', o, 'OCH₃') + A(h, 'H') + A(o, 'OCH₃');
    };
    // ---- fluoride in methanol ----
    s += box(8, 206, 'FLUORIDE IN METHANOL', 'warn');
    const f = P(110, 120);
    for (const d of [45, 135, 225, 315]) s += meoh(f, 14, d, 48, 100);
    s += A(f, 'F⁻', 'warn');
    s += tg(262, 96, 'small ion,');
    s += tg(262, 112, 'packed charge:');
    s += tg(262, 134, 'short, strong', 'warn');
    s += tg(262, 150, 'H bonds: tight cage', 'warn');

    // ---- iodide in methanol ----
    s += box(222, 236, 'IODIDE IN METHANOL');
    const i = P(114, 354);
    for (const d of [45, 135, 225, 315]) s += meoh(i, 24, d, 70, 120, 'fg-dash');
    s += atom(i.x, i.y, 'I⁻', { kind: 'hi', size: 13, r: 24 });
    s += tg(262, 330, 'big ion,');
    s += tg(262, 346, 'spread-out charge:');
    s += tg(262, 368, 'long, weak', 'good');
    s += tg(262, 384, 'H bonds: loose hold', 'good');

    // ---- fluoride in DMSO ----
    s += box(466, 152, 'FLUORIDE IN DMSO', 'good');
    const k = P(130, 536);
    s += atom(k.x, k.y, 'K⁺', { size: 13, r: 16 });
    s += lbl(108, 541, '(CH₃)₂S=O', 'end') + lbl(152, 541, 'O=S(CH₃)₂', 'start');
    s += tg(130, 582, 'O atoms face K⁺', 'mut') + tg(290, 582, 'fluoride', 'mut');
    const f2 = P(290, 542);
    s += A(f2, 'F', 'hi') + lp(f2, 0) + lp(f2, 90) + lp(f2, 180) + lp(f2, 270) + chg(312, 520);
    s += tg(170, 602, 'no O–H, so no hydrogen bonds to F⁻', 'good');
    return s;
  },
  caption: 'Dashed lines are hydrogen bonds. Short, strong ones grip fluoride; iodide’s are longer and weaker.',
  note: 'Fluoride salts dissolve poorly in DMSO. In practice chemists use potassium fluoride with an additive that wraps up K⁺, or fluoride paired with a large organic cation.',
});

/* ------------------------------------------------------------------ 7 ---
   Delocalization: acetate's two resonance forms against methoxide. */
FIGURES.push({
  id: 'nuc-delocalized',
  section: 'nucleophiles',
  anchor: '<h3>What makes one stronger</h3>',
  alt: 'Two stacked panels. Top: acetate ion drawn as two resonance forms joined by a double-headed arrow. In the left form the lower oxygen carries the negative charge and three lone pairs; one curved arrow takes a lone pair down into the C–O bond, and another moves the C=O pi bond onto the upper oxygen. The right form has the charge on the upper oxygen. Each oxygen carries the charge in one form. Bottom: methoxide ion, CH3–O minus, with the whole charge on its one oxygen.',
  viewBox: '0 0 340 318',
  build() {
    let s = '';
    s += box(8, 196, 'ACETATE: CHARGE SHARED BY TWO O');
    const form = (c, topMinus) => {
      const m = armEnd(c, 180, 48), ot = armEnd(c, 60, 46), ob = armEnd(c, 300, 46);
      let g = B(c, 'C', m, 'CH₃') + A(m, 'CH₃');
      g += B(c, 'C', ot, 'O', topMinus ? {} : { order: 2 }) + B(c, 'C', ob, 'O', topMinus ? { order: 2 } : {});
      g += A(c, 'C') + A(ot, 'O', topMinus ? 'hi' : 'plain') + A(ob, 'O', topMinus ? 'plain' : 'hi');
      if (topMinus) {
        g += lp(ot, 180) + lp(ot, 270) + lp(ot, 0) + chg(ot.x + 20, ot.y + 20);
        g += lp(ob, 120) + lp(ob, 0);
      } else {
        g += lp(ot, 240) + lp(ot, 0);
        g += lp(ob, 0) + lp(ob, 90) + lp(ob, 180) + chg(ob.x + 20, ob.y - 20);
      }
      return { g, ot, ob };
    };
    const L = form(P(78, 110), false);
    s += L.g;
    // lone pair on the lower O into the C–O bond; the C=O pi bond onto the upper O
    s += curve(P(L.ob.x - 24, L.ob.y - 2), P(L.ob.x - 18, L.ob.y - 22), { bow: 12 });
    s += curve(P(L.ot.x - 5, L.ot.y + 26), P(L.ot.x + 10, L.ot.y + 12), { bow: 10 });
    s += reso(166, 110);
    const R = form(P(246, 110), true);
    s += R.g;
    s += tg(170, 188, 'each O carries the charge in one form', 'warn');

    s += box(212, 100, 'METHOXIDE: CHARGE ON ONE O');
    const m = P(90, 268), o = P(148, 268);
    s += B(m, 'CH₃', o, 'O') + A(m, 'CH₃') + A(o, 'O', 'hi');
    s += lp(o, 270) + lp(o, 90) + lp(o, 0) + chg(168, 246);
    s += tg(262, 272, 'whole charge here', 'good');
    return s;
  },
  caption: 'In acetate’s left-hand form, follow the two curved arrows: together they move the charge from the lower oxygen to the upper one.',
});

/* ------------------------------------------------------------------ 8 ---
   Hybridization: three nitrogen lone pairs with rising s character. */
FIGURES.push({
  id: 'nuc-hybrid-n',
  section: 'nucleophiles',
  anchor: '<h3>What makes one stronger</h3>',
  alt: 'Three stacked panels, each a nitrogen with one lone pair. Trimethylamine: an sp3 nitrogen with three CH3 groups, lone pair 25 percent s character, the best nucleophile of the three. Pyridine: a six-membered aromatic ring with one ring nitrogen whose lone pair points out of the ring in the ring plane, sp2, 33 percent s. Acetonitrile: H3C–C≡N, a linear sp nitrogen with its lone pair pointing straight out along the axis, 50 percent s, the weakest.',
  viewBox: '0 0 340 416',
  build() {
    let s = '';
    // ---- trimethylamine ----
    s += box(8, 128, 'TRIMETHYLAMINE');
    const n = P(96, 66);
    s += arm(n, 'N', 210, 56, 'CH₃') + arm(n, 'N', 330, 56, 'CH₃') + arm(n, 'N', 270, 46, 'CH₃', 'wedge');
    s += A(n, 'N', 'hi') + lp(n, 270);
    s += tg(262, 64, 'sp³ nitrogen', 'hi');
    s += tg(262, 82, '25% s character');
    s += tg(262, 104, 'most available pair', 'good');

    // ---- pyridine ----
    s += box(144, 128, 'PYRIDINE');
    const cen = P(88, 216), pts = polyPts(cen.x, cen.y, 6, 30, 0);
    const N = pts[0];
    for (let i = 0; i < 6; i++) {
      const a = pts[i], b = pts[(i + 1) % 6];
      s += bond(a, b, { rFrom: i === 0 ? 14 : 0, rTo: (i + 1) % 6 === 0 ? 14 : 0 });
    }
    // inner lines of the three double bonds: C1=C2, C3=C4, C5=N
    const inner = (a, b, ia, ib) => {
      const ux = (b.x - a.x), uy = (b.y - a.y), L = Math.hypot(ux, uy);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      let px = -uy / L, py = ux / L;
      if ((cen.x - mx) * px + (cen.y - my) * py < 0) { px = -px; py = -py; }
      const A2 = P(a.x + ux / L * ia + px * 4.6, a.y + uy / L * ia + py * 4.6);
      const B2 = P(b.x - ux / L * ib + px * 4.6, b.y - uy / L * ib + py * 4.6);
      return bond(A2, B2, { rFrom: 0, rTo: 0 });
    };
    s += inner(pts[1], pts[2], 7, 7) + inner(pts[3], pts[4], 7, 7) + inner(pts[5], pts[0], 7, 16);
    s += A(N, 'N', 'hi') + lp(N, 0);
    s += tg(262, 200, 'sp² nitrogen', 'hi');
    s += tg(262, 218, '33% s character');
    s += tg(262, 240, 'in between');

    // ---- acetonitrile ----
    s += box(280, 128, 'ACETONITRILE');
    const m = P(40, 356), c = P(100, 356), nn = P(156, 356);
    s += B(m, 'CH₃', c, 'C') + B(c, 'C', nn, 'N', { order: 3 });
    s += A(m, 'CH₃') + A(c, 'C') + A(nn, 'N', 'hi') + lp(nn, 0);
    s += tg(262, 336, 'sp nitrogen', 'hi');
    s += tg(262, 354, '50% s character');
    s += tg(262, 376, 'least available pair', 'warn');
    return s;
  },
  caption: 'Three nitrogen lone pairs, in an sp³, an sp² and an sp orbital.',
});

/* ------------------------------------------------------------------ 9 ---
   Sterics: tert-butoxide takes a proton easily but cannot reach a crowded
   carbon; hydroxide can. */
FIGURES.push({
  id: 'nuc-sterics',
  section: 'nucleophiles',
  lessons: ['nucleophiles'],
  anchor: '<h3>Nucleophilicity is not basicity</h3>',
  alt: 'Three stacked panels. First, tert-butoxide acting as a base: a lone pair on its O minus takes a proton from water, and the O–H bond electrons stay on the water oxygen. Second, tert-butoxide trying to act as a nucleophile on 2-bromopropane: the carbon bearing bromine is flanked by two CH3 groups, and a gray approach arrow from the bulky tert-butoxide stops short with a cross. Third, hydroxide, which is small, attacks the same carbon with a curved arrow while the C–Br bond electrons move onto bromine.',
  viewBox: '0 0 340 540',
  build() {
    let s = '';
    // ---- base ----
    s += box(8, 170, 'AS A BASE: THE PROTON IS EASY TO REACH', 'good');
    const T1 = tBuO(P(76, 104));
    s += T1.s;
    const h = P(206, 104), ow = P(258, 104);
    s += B(h, 'H', ow, 'O') + arm(ow, 'O', 300, 44, 'H');
    s += A(h, 'H') + A(ow, 'O') + lp(ow, 270) + lp(ow, 0);
    s += curve(P(T1.o.x + 24, T1.o.y - 4), P(h.x - 15, h.y - 4), { bow: -16 });
    s += curve(P((h.x + ow.x) / 2, h.y + 3), P(ow.x - 8, ow.y + 16), { bow: 10 });
    s += tg(130, 166, 'tert-butoxide', 'mut') + tg(250, 166, 'water', 'mut');

    // ---- blocked nucleophile ----
    s += box(186, 170, 'AS A NUCLEOPHILE: THE CARBON IS HIDDEN', 'warn');
    const T2 = tBuO(P(76, 282));
    s += T2.s;
    const c2 = P(240, 282), I2 = iprBr(c2);
    s += I2.s;
    s += arrow(P(T2.o.x + 26, T2.o.y), P(184, 282), { muted: true });
    s += tg(196, 286, '✕', 'warn');
    s += tg(196, 344, 'bulky on both sides: too crowded', 'warn');

    // ---- hydroxide gets in ----
    s += box(364, 170, 'HYDROXIDE: SMALL ENOUGH TO GET IN', 'good');
    const hh = P(50, 460), oh = P(100, 460);
    s += B(hh, 'H', oh, 'O') + A(hh, 'H') + A(oh, 'O', 'hi');
    s += lp(oh, 270) + lp(oh, 90) + lp(oh, 0) + chg(120, 438);
    const c3 = P(240, 460), I3 = iprBr(c3);
    s += I3.s;
    s += displace(P(124, 454), c3, I3.br);
    s += tg(170, 522, '2-bromopropane on the right', 'mut');
    return s;
  },
  caption: 'The target on the right is the same in the bottom two panels. What changes is the size of the group behind the attacking oxygen.',
  note: 'Even hydroxide gives some elimination with a crowded bromide like this one; Substitution &amp; Elimination sorts out when each pathway wins.',
});

/* ------------------------------------------------------------------ 10 ---
   Ambident nucleophiles: cyanide's two lone pairs, and the enolate's two
   resonance forms. */
FIGURES.push({
  id: 'nuc-ambident',
  section: 'nucleophiles',
  anchor: '<h3>When a nucleophile has two ends: ambident nucleophiles</h3>',
  alt: 'Two stacked panels. Top: cyanide ion, with a lone pair on carbon, a lone pair on nitrogen and the negative charge on carbon. A curved arrow runs from the carbon lone pair to the carbon of bromomethane, and the C–Br bond electrons move onto bromine; the product is H3C–C≡N, a nitrile with a new C–C bond, plus bromide. Bottom: the enolate of acetone drawn as two resonance forms. In the major form the negative charge is on oxygen, with a C=C double bond; curved arrows move an oxygen lone pair into the C–O bond and the C=C pi bond onto the CH2 carbon. The minor form has C=O and the negative charge and a lone pair on the CH2 carbon, which is the end that usually reacts.',
  viewBox: '0 0 340 430',
  build() {
    let s = '';
    // ---- cyanide ----
    s += box(8, 200, 'CYANIDE: TWO LONE PAIRS');
    const nn = P(42, 96), cc = P(98, 96);
    s += B(nn, 'N', cc, 'C', { order: 3 }) + A(nn, 'N') + A(cc, 'C', 'hi');
    s += lp(nn, 180) + lp(cc, 0) + chg(98, 70);
    const c = P(200, 96), br = P(264, 96);
    s += B(c, 'CH₃', br, 'Br') + A(c, 'CH₃', 'warn') + A(br, 'Br') + lp(br, 270) + lp(br, 90) + lp(br, 0);
    s += curve(P(122, 90), P(182, 88), { bow: -16 });
    s += curve(P(232, 93), P(258, 78), { bow: -10 });
    s += tg(70, 132, 'reacts at C', 'good');
    // product
    const p1 = P(40, 168), p2 = P(98, 168), p3 = P(152, 168);
    s += B(p1, 'CH₃', p2, 'C') + B(p2, 'C', p3, 'N', { order: 3 });
    s += A(p1, 'CH₃') + A(p2, 'C') + A(p3, 'N') + lp(p3, 0);
    s += lbl(210, 173, '+ Br⁻');
    s += tg(282, 172, 'new C–C', 'good');

    // ---- enolate ----
    s += box(216, 206, 'AN ENOLATE: TWO RESONANCE FORMS');
    const form = (c2, onO) => {
      const o = armEnd(c2, 90, 46), c1 = armEnd(c2, 210, 48), m = armEnd(c2, 330, 48);
      let g = B(c2, 'C', o, 'O', onO ? {} : { order: 2 }) + B(c2, 'C', c1, 'CH₂', onO ? { order: 2 } : {});
      g += B(c2, 'C', m, 'CH₃') + A(c2, 'C') + A(m, 'CH₃');
      g += A(o, 'O', onO ? 'hi' : 'plain') + A(c1, 'CH₂', onO ? 'plain' : 'hi');
      if (onO) {
        g += lp(o, 270) + lp(o, 180) + lp(o, 0) + chg(o.x + 22, o.y - 20);
      } else {
        g += lp(o, 225) + lp(o, 315);
        g += lonePair(c1.x, c1.y, 135, { dist: 23 }) + chg(c1.x - 20, c1.y - 24);
      }
      return { g, o, c1 };
    };
    const L = form(P(92, 324), true);
    s += L.g;
    s += curve(P(L.o.x - 22, L.o.y + 6), P(L.o.x - 6, L.o.y + 26), { bow: 12 });
    s += curve(P(L.c1.x + 26, L.c1.y - 4), P(L.c1.x + 12, L.c1.y + 14), { bow: -8 });
    s += reso(170, 296);
    const R = form(P(262, 324), false);
    s += R.g;
    s += tg(92, 392, 'major form: − on O', 'mut');
    s += tg(252, 392, 'minor form: − on C', 'mut');
    s += tg(252, 408, 'C usually reacts', 'good');
    return s;
  },
  caption: 'In cyanide and in each enolate form, the highlighted atom carries the negative charge.',
});

export default FIGURES;
