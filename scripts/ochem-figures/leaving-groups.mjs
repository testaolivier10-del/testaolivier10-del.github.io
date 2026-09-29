/* Figures for the leaving-groups notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure here is 340 wide with its panels stacked, and every label is
   fg-lbl or fg-tag, so the same drawing can sit in the lesson on a phone.
   Each mechanism is drawn on a real molecule, with every curved arrow
   starting at a lone pair or a bond and ending where those electrons go. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, rule, P } from '../lib/ochem-figure.mjs';
import { polyPts, ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ---- small local helpers ------------------------------------------------ */

const rad = (l) => (l === '' ? 0 : l.length > 2 ? 18 : l.length > 1 ? 16 : 14);
/* An atom whose label is drawn at the CSS size (13px). */
const A = (p, l, kind = 'plain', r) => atom(p.x, p.y, l, { kind, size: 13, r: r ?? rad(l) });
/* A bond between two atoms, trimmed to both discs ('' is a skeletal vertex). */
const B = (a, la, b, lb, opts = {}) => bond(a, b, { rFrom: rad(la), rTo: rad(lb), ...opts });
/* A formal charge. */
const chg = (x, y, s) => `<text class="fg-lbl fg-warn" x="${x}" y="${y + 5}" text-anchor="middle">${s}</text>`;
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', anchor });
const tg = (x, y, s, kind = '', anchor = 'middle') => text(x, y, s, { cls: kind ? `fg-tag-${kind}` : 'fg-tag', size: 11, anchor });
const box = (y, h, title) => panel(4, y, 332, h) + tag(170, y + 22, title);
const lps = (p, angles, dist = 22) => angles.map((a) => lonePair(p.x, p.y, a, { dist })).join('');
/* A skeletal chain through the given vertices, starting from a labeled atom. */
function chain(start, lStart, pts) {
  let s = B(start, lStart, pts[0], '');
  for (let i = 1; i < pts.length; i++) s += B(pts[i - 1], '', pts[i], '');
  return s;
}
/* A Kekulé six-ring from its vertex list, double bonds on alternate edges.
   `skip` is a vertex carrying a label (pyridine's N), whose bonds are trimmed. */
function ring6(pts, shift = 0, labeled = -1) {
  const c = P(pts.reduce((t, p) => t + p.x, 0) / 6, pts.reduce((t, p) => t + p.y, 0) / 6);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const a = pts[i], b = pts[j];
    if (i === labeled || j === labeled) {
      const o = { rFrom: i === labeled ? 14 : 0, rTo: j === labeled ? 14 : 0 };
      s += bond(a, b, o);
      if (i % 2 === shift) {
        // inset second line, trimmed clear of the label
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
        let px = -dy / L, py = dx / L;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        if ((c.x - mx) * px + (c.y - my) * py < 0) { px = -px; py = -py; }
        const ux = dx / L, uy = dy / L;
        const t0 = i === labeled ? 16 : 7, t1 = j === labeled ? 16 : 7;
        s += bond(P(a.x + ux * t0 + px * 4.4, a.y + uy * t0 + py * 4.4), P(b.x - ux * t1 + px * 4.4, b.y - uy * t1 + py * 4.4), { rFrom: 0, rTo: 0 });
      }
    } else {
      s += i % 2 === shift ? ringDouble(a, b, c, { inset: 7, gap: 4.4 }) : bond(a, b, { rFrom: 0, rTo: 0 });
    }
  }
  return s;
}
/* Ethanol's two carbons, skeletal, to the left of an oxygen at o. Returns the
   ink and the carbon bonded to O (c1). */
function ethylLeft(o, lo) {
  const c1 = P(o.x - 38, o.y - 20), c2 = P(o.x - 76, o.y);
  return { s: B(o, lo, c1, '') + B(c1, '', c2, ''), c1, c2 };
}

/* ------------------------------------------------------------------ 1 ---
   The opening example: a leaving group is the thing that walks off with the
   bonding pair. Bromide does; hydroxide, in the reverse direction, does not. */
FIGURES.push({
  id: 'lg-bromide-leaves',
  section: 'leaving-groups',
  lessons: ['leaving-groups'],
  anchor: '<h3>Why spreading charge out matters</h3>',
  alt: 'Two stacked panels. Top: hydroxide ion uses a lone pair on oxygen to bond to the carbon of bromomethane, and the C–Br bonding pair moves onto bromine; the products are methanol and bromide ion, which now carries four lone pairs. Bottom: the reverse, bromide with methanol, is drawn with grey arrows and crossed out, because hydroxide would have to leave the carbon.',
  viewBox: '0 0 340 446',
  build() {
    let s = '';
    s += box(8, 250, 'HYDROXIDE IN, BROMIDE OUT');
    const h = P(28, 96), o = P(76, 96), c = P(170, 96), br = P(262, 96);
    s += B(h, 'H', o, 'O') + B(c, 'H₃C', br, 'Br');
    s += A(h, 'H') + A(o, 'O', 'hi') + A(c, 'H₃C') + A(br, 'Br', 'warn');
    s += lps(o, [270, 90, 0], 21) + lps(br, [270, 90, 0], 23);
    s += chg(96, 76, '−');
    s += curve(P(100, 92), P(150, 88), { bow: -16 });
    s += curve(P(214, 91), P(256, 76), { bow: -12 });
    s += arrow(P(312, 124), P(312, 164), { muted: true });
    // products
    const c2 = P(46, 190), o2 = P(112, 190), h2 = P(158, 190), br2 = P(262, 190);
    s += B(c2, 'H₃C', o2, 'O') + B(o2, 'O', h2, 'H');
    s += A(c2, 'H₃C') + A(o2, 'O') + A(h2, 'H');
    s += lps(o2, [270, 90], 21);
    s += lbl(204, 195, '+');
    s += A(br2, 'Br', 'warn') + lps(br2, [0, 90, 180, 270], 23);
    s += chg(286, 168, '−');
    s += tg(170, 246, 'the C–Br bonding pair leaves with bromide', 'good');
    // the reverse
    s += box(274, 164, 'THE REVERSE DOES NOT HAPPEN');
    const br3 = P(40, 344), c3 = P(140, 344), o3 = P(212, 344), h3 = P(258, 344);
    s += B(c3, 'H₃C', o3, 'O') + B(o3, 'O', h3, 'H');
    s += A(br3, 'Br') + A(c3, 'H₃C') + A(o3, 'O') + A(h3, 'H');
    s += lps(br3, [0, 90, 180, 270], 23) + lps(o3, [270, 90], 21);
    s += chg(64, 322, '−');
    s += curve(P(64, 338), P(120, 334), { bow: -14, muted: true });
    s += curve(P(176, 339), P(206, 324), { bow: -9, muted: true });
    s += text(306, 350, '✗', { cls: 'fg-warn', size: 22 });
    s += tg(170, 402, 'HO⁻ would have to leave the carbon,', 'warn');
    s += tg(170, 422, 'and a strong base like HO⁻ does not', 'warn');
    return s;
  },
  caption: 'Bromomethane and hydroxide ion. The arrow from the C–Br bond shows the pair of electrons that bromide takes with it.',
});

/* ------------------------------------------------------------------ 2 ---
   Room for the charge: hydroxide against iodide, discs roughly to scale. */
FIGURES.push({
  id: 'lg-charge-room',
  section: 'leaving-groups',
  lessons: ['leaving-groups'],
  anchor: '<h3>Why spreading charge out matters</h3>',
  alt: 'Hydroxide and iodide side by side, drawn roughly to scale. Hydroxide is a small oxygen disc with an H and three lone pairs, labeled pKaH 15.7, charge on one small oxygen. Iodide is a disc almost twice as wide with four lone pairs, labeled pKaH −10, charge spread over a much larger atom.',
  viewBox: '0 0 340 250',
  build() {
    let s = '';
    s += tg(85, 26, 'HYDROXIDE') + tg(255, 26, 'IODIDE');
    const o = P(85, 124), h = P(85, 68);
    s += bond(h, o, { rFrom: 14, rTo: 24 });
    s += A(h, 'H') + atom(o.x, o.y, 'O', { kind: 'warn', r: 24, size: 13 });
    s += lps(o, [0, 90, 180], 32);
    s += chg(116, 100, '−');
    const i = P(255, 124);
    s += atom(i.x, i.y, 'I', { kind: 'hi', r: 40, size: 13 });
    s += lps(i, [0, 90, 180, 270], 48);
    s += chg(298, 78, '−');
    s += lbl(85, 190, 'pKaH 15.7') + lbl(255, 190, 'pKaH −10');
    s += tg(85, 214, 'charge on one', 'warn') + tg(85, 232, 'small oxygen', 'warn');
    s += tg(255, 214, 'charge spread over', 'good') + tg(255, 232, 'a much larger atom', 'good');
    s += rule(170, 14, 170, 240);
    return s;
  },
  caption: 'The two discs are drawn roughly to scale: an iodide ion is about 1.6 times as wide as a hydroxide ion. Both carry the same single negative charge.',
});

/* ------------------------------------------------------------------ 3 ---
   What Ts is, drawn in full, and the three resonance forms that share the
   tosylate ion's charge over three oxygens. */
function sulfonate(yc, charged) {
  // S with three O (left, up, down) and Ar on the right; `charged` picks the
  // oxygen that carries the single bond and the minus sign.
  const S = P(150, yc), Ar = P(208, yc);
  const Os = { left: P(94, yc), up: P(150, yc - 46), down: P(150, yc + 46) };
  const bonded = { left: 0, up: 90, down: 270 };
  const lpN = { left: [135, 225], up: [225, 315], down: [45, 135] };
  const lpC = { left: [90, 180, 270], up: [180, 270, 0], down: [0, 90, 180] };
  const chP = { left: P(76, yc - 26), up: P(174, yc - 62), down: P(174, yc + 62) };
  let s = B(S, 'S', Ar, 'Ar');
  for (const k of ['left', 'up', 'down']) {
    s += B(S, 'S', Os[k], 'O', { order: k === charged ? 1 : 2 });
    s += A(Os[k], 'O', k === charged ? 'hi' : 'plain');
    s += lps(Os[k], k === charged ? lpC[k] : lpN[k], 21);
  }
  void bonded;
  s += A(S, 'S') + A(Ar, 'Ar');
  s += chg(chP[charged].x, chP[charged].y, '−');
  return s;
}
FIGURES.push({
  id: 'lg-tosylate',
  section: 'leaving-groups',
  lessons: ['leaving-groups'],
  anchor: '<h3>Why spreading charge out matters</h3>',
  alt: 'Top: methyl tosylate drawn in full, CH3–O–S(=O)2– attached to a benzene ring that carries a CH3 on the opposite carbon; a bracket under the sulfur, ring and far CH3 is labeled Ts, the p-toluenesulfonyl group. Bottom: the tosylate ion drawn three times, with the ring abbreviated Ar. In each form a different one of the three sulfur oxygens has the single bond, three lone pairs and the negative charge, and double-headed resonance arrows join the three forms.',
  viewBox: '0 0 340 800',
  build() {
    let s = '';
    s += box(8, 256, 'THE TOSYL GROUP, Ts');
    const y = 116;
    const me = P(34, y), o = P(88, y), S = P(144, y);
    const oU = P(144, y - 50), oD = P(144, y + 50);
    const ring = polyPts(214, y, 6, 26, 180); // vertex 0 on the left (ipso)
    const para = ring[3], me2 = P(290, y);
    s += B(me, 'H₃C', o, 'O') + B(o, 'O', S, 'S');
    s += B(S, 'S', oU, 'O', { order: 2 }) + B(S, 'S', oD, 'O', { order: 2 });
    s += bond(S, ring[0], { rFrom: 14, rTo: 0 });
    s += ring6(ring, 0);
    s += bond(para, me2, { rFrom: 0, rTo: 18 });
    s += A(me, 'H₃C') + A(o, 'O') + A(S, 'S', 'hi') + A(oU, 'O') + A(oD, 'O') + A(me2, 'CH₃');
    s += lps(o, [270, 90], 21) + lps(oU, [225, 315], 21) + lps(oD, [45, 135], 21);
    s += rule(128, 200, 308, 200) + rule(128, 194, 128, 200) + rule(308, 194, 308, 200);
    s += `<text class="fg-tag" x="218" y="222" text-anchor="middle" font-size="11">Ts, the <tspan font-style="italic">p</tspan>-toluenesulfonyl group</text>`;
    s += tg(170, 250, 'methyl tosylate, CH₃–OTs', 'mut');
    // resonance forms
    s += box(276, 516, 'THE TOSYLATE ION: THREE RESONANCE FORMS');
    const ys = [362, 518, 674];
    ['left', 'up', 'down'].forEach((k, i) => { s += sulfonate(ys[i], k); });
    for (const ym of [440, 596]) {
      s += arrow(P(270, ym), P(270, ym - 22)) + arrow(P(270, ym), P(270, ym + 22));
    }
    s += tg(170, 752, 'each oxygen carries the charge in one form', 'good');
    s += tg(170, 772, 'Ar is the CH₃–C₆H₄– ring drawn above', 'mut');
    return s;
  },
  caption: 'Top: the tosyl group drawn out in full. Bottom: the tosylate ion that leaves. The single negative charge moves from oxygen to oxygen across the three resonance forms.',
});

/* ------------------------------------------------------------------ 4 ---
   The halide trend drawn: bond length, ion size, pKaH and bond energy. */
FIGURES.push({
  id: 'lg-halides',
  section: 'leaving-groups',
  anchor: '<h3>Ranking the halides</h3>',
  alt: 'Four rows, one for each halomethane: CH3–F, CH3–Cl, CH3–Br and CH3–I. The C–X bond is drawn longer down the column (138, 178, 193 and 214 picometers) and the halogen disc larger. Beside each row are the pKaH of HX (3.2, −7, −9, −10) and the energy needed to break the C–X bond (about 110, 84, 70 and 57 kcal/mol).',
  viewBox: '0 0 340 380',
  build() {
    let s = '';
    s += tg(100, 26, 'C–X bond in CH₃X') + tg(232, 26, 'pKaH') + tg(232, 42, 'of HX', 'mut');
    s += tg(302, 26, 'bond') + tg(302, 42, 'kcal/mol', 'mut');
    s += rule(8, 54, 332, 54);
    const rows = [
      { x: 'F', pm: 138, r: 14, pka: '3.2', bde: '110', kind: 'warn' },
      { x: 'Cl', pm: 178, r: 19, pka: '−7', bde: '84', kind: 'plain' },
      { x: 'Br', pm: 193, r: 21, pka: '−9', bde: '70', kind: 'plain' },
      { x: 'I', pm: 214, r: 23, pka: '−10', bde: '57', kind: 'hi' },
    ];
    rows.forEach((w, i) => {
      const y = 94 + i * 68;
      const c = P(34, y);
      const L = 0.68 * w.pm - 36;
      const xx = P(52 + L + w.r, y);
      s += bond(c, xx, { rFrom: 18, rTo: w.r, cls: i === 0 ? 'fg-bond' : 'fg-bond' });
      s += A(c, 'H₃C') + atom(xx.x, xx.y, w.x, { kind: w.kind, r: w.r, size: 13 });
      s += tg((52 + 52 + L) / 2, y + 22, `${w.pm} pm`, 'mut');
      s += lbl(232, y + 5, w.pka) + lbl(302, y + 5, w.bde);
    });
    s += rule(8, 334, 332, 334);
    s += tg(170, 354, 'down the column: weaker base, weaker C–X bond,', 'good');
    s += tg(170, 372, 'better leaving group', 'good');
    return s;
  },
  caption: 'Bond lengths are drawn to scale, and the halogen discs grow with the size of the halide ion. Both columns of numbers fall together from fluorine to iodine.',
});

/* ------------------------------------------------------------------ 5 ---
   Leaving as a neutral molecule: which bond breaks, and what walks away. */
FIGURES.push({
  id: 'lg-neutral',
  section: 'leaving-groups',
  anchor: '<h3>Leaving as a neutral molecule</h3>',
  alt: 'Two stacked panels. Top: a nucleophile, Nu minus, bonds to the carbon of CH3–OH2 plus while the C–O bond pair moves onto the positively charged oxygen, so neutral water leaves. Bottom: the same attack on CH3–N plus (CH3)3, a quaternary ammonium ion; the C–N bond pair moves onto nitrogen, so neutral trimethylamine leaves.',
  viewBox: '0 0 340 360',
  build() {
    let s = '';
    const row = (y0, title, X, lX, subs, prod) => {
      let g = box(y0, 168, title);
      const y = y0 + 78;
      const nu = P(34, y), c = P(124, y), x = P(200, y);
      g += B(c, 'H₃C', x, lX);
      for (const [p, l] of subs(x, y)) g += B(x, lX, p, l) + A(p, l);
      g += A(nu, 'Nu') + A(c, 'H₃C') + A(x, lX, 'hi');
      g += lps(nu, [0], 23) + chg(56, y - 22, '−');
      g += X(x);
      g += curve(P(58, y - 5), P(104, y - 8), { bow: -14 });
      g += curve(P(160, y - 4), P(194, y - 20), { bow: -9 });
      g += tg(170, y0 + 154, prod, 'good');
      return g;
    };
    s += row(8, 'PROTONATED ALCOHOL: WATER LEAVES', (x) => lps(x, [0], 21) + chg(x.x - 18, x.y - 26, '+'),
      'O', (x) => [[P(x.x + 34, x.y - 38), 'H'], [P(x.x + 34, x.y + 38), 'H']],
      'products: Nu–CH₃ + H₂O, a neutral molecule');
    s += row(184, 'QUATERNARY AMMONIUM: AN AMINE LEAVES', (x) => chg(x.x - 20, x.y - 26, '+'),
      'N', (x) => [[P(x.x + 30, x.y - 46), 'CH₃'], [P(x.x + 66, x.y), 'CH₃'], [P(x.x + 30, x.y + 46), 'CH₃']],
      'products: Nu–CH₃ + N(CH₃)₃, a neutral amine');
    return s;
  },
  caption: 'Nu<sup>−</sup> stands for any nucleophile. In both panels the bond that breaks is the one from carbon to the positively charged atom, and the group that leaves carries no charge.',
});

/* ------------------------------------------------------------------ 6 ---
   1-Butanol + HBr: protonation, then one concerted displacement. */
FIGURES.push({
  id: 'alcohol-to-bromide-steps',
  section: 'leaving-groups',
  lessons: ['leaving-groups'],
  anchor: '<h3>An alcohol has to be activated before it can leave</h3>',
  alt: 'Three stacked panels. Step 1: the oxygen of 1-butanol uses a lone pair to take the proton from H–Br, and the H–Br bonding pair moves onto bromine. Step 2: the protonated alcohol, with two H on a positive oxygen; bromide attacks the first carbon from the side opposite the oxygen while the C–O bond pair moves onto the oxygen, in one step. Products: 1-bromobutane and water.',
  viewBox: '0 0 340 594',
  build() {
    let s = '';
    s += box(8, 214, 'STEP 1 · THE OXYGEN TAKES A PROTON');
    const y = 116;
    const br = P(32, y), h = P(84, y), o = P(152, y), ho = P(152, y - 50);
    const ch = [P(188, y + 20), P(224, y), P(260, y + 20), P(296, y)];
    s += B(br, 'Br', h, 'H') + B(o, 'O', ho, 'H') + chain(o, 'O', ch);
    s += A(br, 'Br', 'warn') + A(h, 'H') + A(o, 'O', 'hi') + A(ho, 'H');
    s += lps(br, [270, 90, 180], 23) + lps(o, [180, 110], 21);
    s += curve(P(130, 110), P(98, 106), { bow: 14 });
    s += curve(P(60, 110), P(40, 96), { bow: 8 });
    s += tg(170, 180, 'the O–H bond forms as the H–Br bond breaks,');
    s += tg(170, 200, 'giving the protonated alcohol and Br⁻');
    // step 2
    s += box(230, 240, 'STEP 2 · BROMIDE IN, WATER OUT, AT ONCE');
    const y2 = 330;
    const o2 = P(152, y2), h2a = P(152, y2 - 50), h2b = P(106, y2 - 22);
    const ch2 = [P(190, y2 + 22), P(226, y2 + 2), P(262, y2 + 22), P(298, y2 + 2)];
    s += B(o2, 'O', h2a, 'H') + B(o2, 'O', h2b, 'H') + chain(o2, 'O', ch2);
    s += A(o2, 'O', 'hi') + A(h2a, 'H') + A(h2b, 'H');
    s += lps(o2, [215], 21) + chg(176, y2 - 22, '+');
    const nu = P(246, y2 + 76);
    s += A(nu, 'Br', 'warn') + lps(nu, [225, 315, 45, 135], 23) + chg(276, y2 + 80, '−');
    s += curve(P(228, y2 + 58), P(196, y2 + 34), { bow: -10 });
    s += curve(P(174, y2 + 16), P(150, y2 + 18), { bow: 10 });
    s += tg(126, y2 + 96, 'Br⁻ arrives opposite', 'mut', 'middle');
    s += tg(126, y2 + 114, 'the oxygen', 'mut', 'middle');
    // products
    s += box(478, 108, 'PRODUCTS');
    const y3 = 540;
    const br3 = P(40, y3);
    const ch3 = [P(76, y3 + 18), P(112, y3), P(148, y3 + 18), P(184, y3)];
    s += chain(br3, 'Br', ch3) + A(br3, 'Br', 'warn');
    s += lbl(214, y3 + 12, '+');
    s += A(P(262, y3 + 8), 'H₂O');
    s += tg(100, y3 + 44, '1-bromobutane', 'good') + tg(262, y3 + 44, 'water', 'good');
    return s;
  },
  caption: '1-Butanol and HBr. In step 1 the oxygen takes a proton. In step 2 bromide bonds to the carbon on the side away from the oxygen while the C–O bond breaks, both in the same step.',
});

/* ------------------------------------------------------------------ 7 ---
   Tosylation: the O–H and S–Cl bonds break; the C–O bond is never touched. */
FIGURES.push({
  id: 'lg-tosylation',
  section: 'leaving-groups',
  lessons: ['leaving-groups'],
  anchor: '<h3>An alcohol has to be activated before it can leave</h3>',
  alt: 'Three stacked panels. Step 1: the oxygen of ethanol uses a lone pair to bond to the sulfur of TsCl (a sulfur with two double-bonded oxygens, a chlorine and the tolyl ring), and the S–Cl bonding pair leaves as chloride. Step 2: the oxygen, now positive and bonded to C, H and Ts, loses its H to the nitrogen lone pair of pyridine. Product: ethyl tosylate; the C–O bond has not changed.',
  viewBox: '0 0 340 630',
  build() {
    let s = '';
    s += box(8, 266, 'STEP 1 · O BONDS TO S, CHLORIDE LEAVES');
    const y = 104;
    const o = P(112, y), ho = P(112, y + 48);
    const et = ethylLeft(o, 'O');
    s += et.s + B(o, 'O', ho, 'H') + A(o, 'O', 'hi') + A(ho, 'H');
    s += lps(o, [310, 20], 21);
    const S = P(206, y), oA = P(180, y - 42), oB = P(232, y - 42), cl = P(268, y);
    const ring = polyPts(206, y + 64, 6, 26, 90); // ipso at the top
    s += B(S, 'S', oA, 'O', { order: 2 }) + B(S, 'S', oB, 'O', { order: 2 }) + B(S, 'S', cl, 'Cl');
    s += bond(S, ring[0], { rFrom: 14, rTo: 0 }) + ring6(ring, 0);
    const me = P(206, ring[3].y + 34);
    s += bond(ring[3], me, { rFrom: 0, rTo: 18 }) + A(me, 'CH₃');
    s += A(S, 'S') + A(oA, 'O') + A(oB, 'O') + A(cl, 'Cl', 'warn');
    s += lps(oA, [180, 270], 21) + lps(oB, [270, 0], 21) + lps(cl, [270, 0, 90], 23);
    s += curve(P(134, y - 6), P(190, y - 6), { bow: -16 });
    s += curve(P(236, y - 5), P(262, y - 20), { bow: -9 });
    s += tg(290, 236, 'TsCl', 'mut');
    // step 2
    s += box(282, 206, 'STEP 2 · PYRIDINE TAKES THE H');
    const y2 = 348;
    const o2 = P(112, y2), h2 = P(112, y2 + 48), ts = P(176, y2);
    const et2 = ethylLeft(o2, 'O');
    s += et2.s + B(o2, 'O', h2, 'H') + B(o2, 'O', ts, 'Ts');
    s += A(o2, 'O', 'hi') + A(h2, 'H') + A(ts, 'Ts');
    s += lps(o2, [295], 21) + chg(90, y2 + 22, '+');
    const py = polyPts(226, y2 + 96, 6, 26, 150); // vertex 0 points up-left, toward the H
    const n = py[0];
    s += ring6(py, 1, 0) + A(n, 'N');
    s += lps(n, [205], 21);
    s += curve(P(180, n.y - 12), P(128, h2.y + 6), { bow: 12 });
    s += curve(P(118, y2 + 22), P(132, y2 + 12), { bow: -8 });
    s += tg(290, y2 + 140, 'pyridine', 'mut');
    // product
    s += box(504, 118, 'PRODUCT · ETHYL TOSYLATE');
    const y3 = 566;
    const o3 = P(112, y3), ts3 = P(176, y3);
    s += ethylLeft(o3, 'O').s + B(o3, 'O', ts3, 'Ts') + A(o3, 'O') + A(ts3, 'Ts');
    s += lps(o3, [270, 90], 21);
    s += tg(264, y3 - 4, '+ pyridinium', 'mut') + tg(264, y3 + 14, 'chloride', 'mut');
    s += tg(170, y3 + 44, 'the C–O bond never breaks', 'good');
    return s;
  },
  caption: 'Ethanol and TsCl, with pyridine as the base. Only the O–H and S–Cl bonds break. The carbon keeps the same oxygen throughout.',
});

/* ------------------------------------------------------------------ 8 ---
   PBr3: O bonds to P, then bromide displaces the whole O–PBr2 group. */
FIGURES.push({
  id: 'lg-pbr3',
  section: 'leaving-groups',
  lessons: ['leaving-groups'],
  anchor: '<h3>An alcohol has to be activated before it can leave</h3>',
  alt: 'Three stacked panels. Step 1: the oxygen of ethanol uses a lone pair to bond to the phosphorus of PBr3, and one P–Br bonding pair leaves as bromide. Step 2: the oxygen is now positive and bonded to C, H and PBr2; bromide attacks the carbon from the side opposite the oxygen while the C–O bonding pair moves onto the oxygen. Products: bromoethane and HO–PBr2, which leaves as a neutral molecule.',
  viewBox: '0 0 340 574',
  build() {
    let s = '';
    s += box(8, 214, 'STEP 1 · O BONDS TO P, BROMIDE LEAVES');
    const y = 112;
    const o = P(112, y), ho = P(112, y + 48);
    s += ethylLeft(o, 'O').s + B(o, 'O', ho, 'H') + A(o, 'O', 'hi') + A(ho, 'H');
    s += lps(o, [310, 20], 21);
    const p = P(204, y), bU = P(204, y - 54), bD = P(204, y + 54), bR = P(270, y);
    s += B(p, 'P', bU, 'Br') + B(p, 'P', bD, 'Br') + B(p, 'P', bR, 'Br');
    s += A(p, 'P') + A(bU, 'Br') + A(bD, 'Br') + A(bR, 'Br', 'warn');
    s += lps(p, [135], 20);
    s += lps(bU, [180, 270, 0], 23) + lps(bD, [0, 90, 180], 23) + lps(bR, [270, 0, 90], 23);
    s += curve(P(134, y - 6), P(188, y - 6), { bow: -16 });
    s += curve(P(234, y - 5), P(262, y - 20), { bow: -9 });
    // step 2
    s += box(230, 236, 'STEP 2 · BROMIDE IN, C–O BOND OUT');
    const y2 = 368;
    const o2 = P(160, y2), h2 = P(160, y2 + 48), pb = P(230, y2);
    const c1 = P(118, y2 - 22), c2 = P(80, y2);
    s += B(o2, 'O', c1, '') + B(c1, '', c2, '') + B(o2, 'O', h2, 'H') + B(o2, 'O', pb, 'PBr₂');
    s += A(o2, 'O', 'hi') + A(h2, 'H') + A(pb, 'PBr₂');
    s += lps(o2, [300], 21) + chg(138, y2 + 26, '+');
    const nu = P(62, y2 - 64);
    s += A(nu, 'Br', 'warn') + lps(nu, [28, 118, 208, 298], 23) + chg(34, y2 - 44, '−');
    s += curve(P(84, y2 - 52), P(112, y2 - 30), { bow: -8 });
    s += curve(P(134, y2 - 18), P(152, y2 - 18), { bow: -10 });
    s += tg(170, y2 + 82, 'H–O–PBr₂ leaves as a neutral molecule', 'good');
    // products
    s += box(474, 92, 'PRODUCTS');
    const y3 = 530;
    const b3 = P(128, y3), c13 = P(88, y3 - 16), c23 = P(50, y3 + 4);
    s += B(b3, 'Br', c13, '') + B(c13, '', c23, '') + A(b3, 'Br', 'warn');
    s += lbl(178, y3 + 5, '+') + lbl(248, y3 + 5, 'HO–PBr₂');
    s += tg(88, y3 + 30, 'bromoethane', 'good');
    return s;
  },
  caption: 'Ethanol and PBr<sub>3</sub>. The C–O bond survives step 1 and breaks in step 2, as bromide bonds to the carbon.',
});

/* ------------------------------------------------------------------ 9 ---
   SOCl2: the same two-step plan, with a leaving group that falls apart. */
FIGURES.push({
  id: 'lg-socl2',
  section: 'leaving-groups',
  anchor: '<h3>An alcohol has to be activated before it can leave</h3>',
  alt: 'Three stacked panels. Step 1: the oxygen of ethanol bonds to the sulfur of SOCl2 and one S–Cl bonding pair leaves as chloride; pyridine then removes the H from the oxygen. Step 2: chloride attacks the carbon from the side opposite the oxygen; the C–O bonding pair moves in between O and S to make a new S=O, and the remaining S–Cl bonding pair leaves as chloride. Products: chloroethane, sulfur dioxide and chloride.',
  viewBox: '0 0 340 620',
  build() {
    let s = '';
    s += box(8, 232, 'STEP 1 · O BONDS TO S, CHLORIDE LEAVES');
    const y = 110;
    const o = P(112, y), ho = P(112, y + 48);
    s += ethylLeft(o, 'O').s + B(o, 'O', ho, 'H') + A(o, 'O', 'hi') + A(ho, 'H');
    s += lps(o, [310, 20], 21);
    const S = P(204, y), oU = P(204, y - 52), cD = P(204, y + 54), cR = P(270, y);
    s += B(S, 'S', oU, 'O', { order: 2 }) + B(S, 'S', cD, 'Cl') + B(S, 'S', cR, 'Cl');
    s += A(S, 'S') + A(oU, 'O') + A(cD, 'Cl') + A(cR, 'Cl', 'warn');
    s += lps(S, [135], 20);
    s += lps(oU, [180, 0], 21) + lps(cD, [0, 90, 180], 23) + lps(cR, [270, 0, 90], 23);
    s += curve(P(134, y - 6), P(188, y - 6), { bow: -16 });
    s += curve(P(234, y - 5), P(262, y - 20), { bow: -9 });
    s += tg(170, 206, 'then pyridine removes the H from O,', 'mut');
    s += tg(170, 224, 'as in the tosylate figure', 'mut');
    // step 2
    s += box(248, 246, 'STEP 2 · CHLORIDE IN, SO₂ AND Cl⁻ OUT');
    const y2 = 388;
    const o2 = P(152, y2), S2 = P(216, y2), oU2 = P(216, y2 - 52), cl2 = P(282, y2);
    const c1 = P(112, y2 - 22), c2 = P(74, y2);
    s += B(o2, 'O', c1, '') + B(c1, '', c2, '') + B(o2, 'O', S2, 'S');
    s += B(S2, 'S', oU2, 'O', { order: 2 }) + B(S2, 'S', cl2, 'Cl');
    s += A(o2, 'O', 'hi') + A(S2, 'S') + A(oU2, 'O') + A(cl2, 'Cl', 'warn');
    s += lps(o2, [60, 120], 21) + lps(S2, [90], 20) + lps(oU2, [180, 0], 21) + lps(cl2, [270, 0, 90], 23);
    const nu = P(56, y2 - 64);
    s += A(nu, 'Cl', 'warn') + lps(nu, [28, 118, 208, 298], 23) + chg(28, y2 - 44, '−');
    s += curve(P(78, y2 - 52), P(106, y2 - 30), { bow: -8 });
    s += curve(P(130, y2 - 18), P(184, y2 - 8), { bow: -14 });
    s += curve(P(250, y2 + 5), P(276, y2 + 20), { bow: 9 });
    s += tg(170, y2 + 72, 'the C–O pair becomes a new S=O bond,', 'mut');
    s += tg(170, y2 + 90, 'so the group falls apart into SO₂ and Cl⁻', 'mut');
    // products
    s += box(502, 110, 'PRODUCTS');
    const y3 = 560;
    const cl3 = P(128, y3), c13 = P(88, y3 - 16), c23 = P(50, y3 + 4);
    s += B(cl3, 'Cl', c13, '') + B(c13, '', c23, '') + A(cl3, 'Cl', 'warn');
    s += lbl(170, y3 + 5, '+') + lbl(208, y3 + 5, 'SO₂') + lbl(246, y3 + 5, '+') + lbl(284, y3 + 5, 'Cl⁻');
    s += tg(88, y3 + 32, 'chloroethane', 'good') + tg(208, y3 + 32, 'a gas', 'mut');
    return s;
  },
  caption: 'Ethanol and SOCl<sub>2</sub>. As with PBr<sub>3</sub>, the C–O bond survives step 1 and breaks only in step 2, as the halide bonds to the carbon.',
});

/* ------------------------------------------------------------------ 10 ---
   Substitution against elimination, on bromoethane with hydroxide. */
FIGURES.push({
  id: 'lg-sub-elim',
  section: 'leaving-groups',
  lessons: ['leaving-groups'],
  anchor: '<h3>Reading the names SN1, SN2, E1, E2</h3>',
  alt: 'Two stacked panels. Substitution: hydroxide bonds to the CH2 carbon of bromoethane and the C–Br bonding pair leaves with bromide, giving ethanol. Elimination: hydroxide takes an H from the CH3 carbon next door, the C–H bonding pair moves in between the two carbons to make a C=C double bond, and the C–Br bonding pair leaves with bromide, giving ethene, water and bromide.',
  viewBox: '0 0 340 572',
  build() {
    let s = '';
    s += box(8, 252, 'SUBSTITUTION · HO⁻ REPLACES Br');
    const y = 110;
    const cb = P(96, y - 30), ca = P(170, y), br = P(252, y);
    s += B(cb, 'H₃C', ca, 'CH₂') + B(ca, 'CH₂', br, 'Br');
    s += A(cb, 'H₃C') + A(ca, 'CH₂', 'warn') + A(br, 'Br');
    s += lps(br, [270, 0, 90], 23);
    const o = P(86, y + 66), h = P(40, y + 66);
    s += B(h, 'H', o, 'O') + A(h, 'H') + A(o, 'O', 'hi');
    s += lps(o, [315, 90, 225], 21) + chg(110, y + 88, '−');
    s += curve(P(104, y + 50), P(150, y + 18), { bow: -12 });
    s += curve(P(214, y - 5), P(246, y - 22), { bow: -9 });
    s += lbl(170, y + 124, '→  H₃C–CH₂–OH  +  Br⁻');
    s += tg(170, y + 144, 'ethanol: the new group sits where Br was', 'good');
    // elimination
    s += box(276, 288, 'ELIMINATION · HO⁻ TAKES AN H, C=C FORMS');
    const y2 = 372;
    const cb2 = P(110, y2), ca2 = P(196, y2), hb = P(110, y2 + 54), br2 = P(196, y2 - 54);
    s += B(cb2, 'H₂C', ca2, 'CH₂') + B(cb2, 'H₂C', hb, 'H') + B(ca2, 'CH₂', br2, 'Br');
    s += A(cb2, 'H₂C') + A(ca2, 'CH₂', 'warn') + A(hb, 'H') + A(br2, 'Br');
    s += lps(br2, [180, 270, 0], 23);
    const o2 = P(110, y2 + 116), h2 = P(64, y2 + 116);
    s += B(h2, 'H', o2, 'O') + A(h2, 'H') + A(o2, 'O', 'hi');
    s += lps(o2, [270, 90, 0], 21) + chg(132, y2 + 138, '−');
    s += curve(P(116, y2 + 94), P(118, y2 + 70), { bow: -10 });
    s += curve(P(118, y2 + 30), P(150, y2 + 6), { bow: 10 });
    s += curve(P(202, y2 - 20), P(214, y2 - 44), { bow: -8 });
    s += lbl(170, y2 + 170, '→  H₂C=CH₂  +  H₂O  +  Br⁻');
    s += tg(170, y2 + 188, 'ethene: a C=C where the C–H and C–Br were', 'good');
    return s;
  },
  caption: 'Bromoethane and hydroxide, two ways. In both, the C–Br bond breaks and bromide leaves. Substitution puts OH on that carbon; elimination takes an H from the carbon next door and makes a C=C.',
});

/* ------------------------------------------------------------------ 11 ---
   The "1" timing: the leaving group goes first, the nucleophile comes later. */
FIGURES.push({
  id: 'lg-sn1-timing',
  section: 'leaving-groups',
  lessons: ['leaving-groups'],
  anchor: '<h3>Reading the names SN1, SN2, E1, E2</h3>',
  alt: 'Two stacked panels. Step 1: in (CH3)3C–Br the C–Br bonding pair moves onto bromine with nothing attacking, leaving a carbocation, a flat carbon with three CH3 groups and a positive charge, plus bromide. Step 2: a water lone pair bonds to the positive carbon; the product then loses a proton to give (CH3)3C–OH.',
  viewBox: '0 0 340 470',
  build() {
    let s = '';
    s += box(8, 206, 'STEP 1 · BROMIDE LEAVES ON ITS OWN');
    const c = P(116, 112);
    const subs = [P(116, 58), P(58, 112), P(116, 166)];
    const br = P(196, 112);
    for (const p of subs) s += B(c, 'C', p, 'CH₃') + A(p, 'CH₃');
    s += B(c, 'C', br, 'Br') + A(c, 'C', 'warn') + A(br, 'Br', 'warn');
    s += lps(br, [270, 0, 90], 23);
    s += curve(P(152, 107), P(188, 92), { bow: -10 });
    s += tg(270, 184, 'nothing attacks yet', 'mut');
    // step 2
    s += box(222, 240, 'STEP 2 · WATER BONDS TO THE CATION');
    const c2 = P(176, 330);
    const s2 = [P(176, 274), P(128, 358), P(224, 358)];
    for (const p of s2) s += B(c2, 'C', p, 'CH₃') + A(p, 'CH₃');
    s += A(c2, 'C', 'warn') + chg(198, 310, '+');
    const o = P(80, 316), h1 = P(46, 284), h2 = P(46, 348);
    s += B(o, 'O', h1, 'H') + B(o, 'O', h2, 'H') + A(o, 'O', 'hi') + A(h1, 'H') + A(h2, 'H');
    s += lps(o, [330, 30], 21);
    s += curve(P(102, 308), P(158, 322), { bow: -14 });
    s += lbl(290, 334, '+ Br⁻');
    s += tg(170, 412, 'the carbocation: three bonds, flat, positive', 'warn');
    s += tg(170, 432, 'then O loses H⁺ to give (CH₃)₃C–OH', 'mut');
    return s;
  },
  caption: '2-Bromo-2-methylpropane, (CH<sub>3</sub>)<sub>3</sub>C–Br, in water. Bromide leaves first; only then does water bond to the carbon.',
});

export default FIGURES;
