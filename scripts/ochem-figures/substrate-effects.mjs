/* Figures for the substrate-effects notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure a lesson shows is 340 wide with its panels stacked, and uses
   only fg-lbl and fg-tag text. The decision chart at the end is notes-only
   and wide. Mechanism arrows start at a lone pair or a bond, as on the
   Nucleophiles page this chapter builds on. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, panel, rule, P } from '../lib/ochem-figure.mjs';
import { polyPts } from '../lib/ochem-skeletal.mjs';
import { armEnd, skDouble } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---- small local helpers ------------------------------------------------ */

const rad = (l) => (l === '' ? 0 : l.length > 2 ? 18 : l.length > 1 ? 16 : 14);
const A = (p, l, kind = 'plain', r) => atom(p.x, p.y, l, { kind, size: 13, r: r ?? rad(l) });
const B = (a, la, b, lb, opts = {}) => bond(a, b, { rFrom: rad(la), rTo: rad(lb), ...opts });
const chg = (x, y, s = '−') => `<text class="fg-lbl fg-warn" x="${x}" y="${y + 5}" text-anchor="middle">${s}</text>`;
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', anchor });
const tg = (x, y, s, kind = '', anchor = 'middle') => text(x, y, s, { cls: kind ? `fg-tag-${kind}` : 'fg-tag', size: 11, anchor });
const box = (y, h, title, kind) => panel(4, y, 332, h, kind ? { kind } : {}) + (title ? tag(170, y + 22, title) : '');
const lp = (p, deg) => lonePair(p.x, p.y, deg, { dist: 21 });
const lpN = (p, deg) => lonePair(p.x, p.y, deg, { dist: 14 });
/* A substituent at an angle (0 east, counterclockwise), labeled. */
function arm(c, lc, deg, len, l, kind = 'plain', akind = 'plain') {
  const e = armEnd(c, deg, len);
  const o = { rFrom: rad(lc), rTo: rad(l) };
  const s = kind === 'wedge' ? wedge(c, e, { ...o, width: 9 })
          : kind === 'hash' ? hash(c, e, { ...o, width: 11, rungs: 4 })
          : bond(c, e, o);
  return { s: s + A(e, l, akind), e };
}
const armS = (...a) => arm(...a).s;
/* A skeletal bond that stops short of a labeled end (r) but not a vertex. */
const skb = (a, b, ra = 0, rb = 0, cls) => bond(a, b, { rFrom: ra, rTo: rb, cls });
/* A small bromine label at a skeletal end, with three lone pairs. */
const brAt = (p, lps = [270, 90, 0]) => A(p, 'Br') + lps.map((d) => lp(p, d)).join('');
const cross = (x, y) => tg(x, y + 4, '✕', 'warn');

/* ------------------------------------------------------------------ 1 ---
   Substrate class: count the carbons on the carbon that carries Br. */
FIGURES.push({
  id: 'se-classes',
  section: 'substrate-effects',
  lessons: ['substrate-effects'],
  anchor: '<h3>Step 1: substrate class rules mechanisms in or out</h3>',
  alt: 'Four stacked rows, one per substrate class, each with the carbon that carries bromine highlighted. Methyl: bromomethane, CH3–Br, with no carbon on that carbon; SN2 only, and no beta carbon, so no E2. Primary: bromoethane, CH3–CH2–Br, one carbon attached; SN2, or E2 with a bulky base. Secondary: 2-bromopropane, two CH3 groups on the CH that carries Br; all four mechanisms compete and the reagent decides. Tertiary: 2-bromo-2-methylpropane, three CH3 groups on the carbon that carries Br; SN1 and E1, or E2, but no SN2 because the back of the carbon is blocked.',
  viewBox: '0 0 340 424',
  build() {
    let s = '';
    const row = (y, h, title, n, good, warn) => {
      let g = panel(4, y, 332, h);
      g += tg(258, y + h / 2 - 16, title);
      g += tg(258, y + h / 2 + 2, n, 'mut');
      g += tg(258, y + h / 2 + 20, good, warn ? 'warn' : 'good');
      return g;
    };
    // methyl
    let y = 8, c = y + 38;
    s += row(y, 76, 'METHYL', 'no C on it', 'SN2 only');
    s += B(P(72, c), 'CH₃', P(140, c), 'Br') + A(P(72, c), 'CH₃', 'hi') + brAt(P(140, c));
    // primary
    y = 92; c = y + 38;
    s += row(y, 76, 'PRIMARY (1°)', '1 C on it', 'SN2 (E2: bulky base)');
    s += B(P(40, c), 'CH₃', P(100, c), 'CH₂') + B(P(100, c), 'CH₂', P(160, c), 'Br');
    s += A(P(40, c), 'CH₃') + A(P(100, c), 'CH₂', 'hi') + brAt(P(160, c));
    // secondary
    y = 176; c = y + 48;
    s += row(y, 96, 'SECONDARY (2°)', '2 C on it', 'all four compete');
    const a2 = P(110, c);
    s += armS(a2, 'CH', 150, 56, 'CH₃') + armS(a2, 'CH', 210, 56, 'CH₃');
    s += B(a2, 'CH', P(172, c), 'Br') + A(a2, 'CH', 'hi') + brAt(P(172, c));
    // tertiary
    y = 280; c = y + 68;
    s += row(y, 136, 'TERTIARY (3°)', '3 C on it', 'no SN2: back blocked', true);
    const a3 = P(110, c);
    s += armS(a3, 'C', 90, 46, 'CH₃') + armS(a3, 'C', 180, 58, 'CH₃') + armS(a3, 'C', 270, 46, 'CH₃');
    s += B(a3, 'C', P(172, c), 'Br') + A(a3, 'C', 'hi') + brAt(P(172, c));
    return s;
  },
  caption: 'The highlighted atom is the carbon that carries the bromine. Its class is the number of carbons bonded to it.',
});

/* ------------------------------------------------------------------ 2 ---
   The two special classes that override the count. */
FIGURES.push({
  id: 'se-special',
  section: 'substrate-effects',
  anchor: 'rings special classes',
  alt: 'Two stacked panels of skeletal structures. Top panel, fast by both SN1 and SN2: allyl bromide, CH2=CH–CH2–Br, labeled allylic, where the Br carbon sits next to a C=C; and benzyl bromide, a benzene ring carrying CH2–Br, labeled benzylic, where the Br carbon sits next to the ring. Bottom panel, no SN1 and no SN2: bromoethene, CH2=CH–Br, labeled vinyl, where Br sits on a carbon of the C=C; and bromobenzene, labeled aryl, where Br sits on a ring carbon.',
  viewBox: '0 0 340 324',
  build() {
    let s = '';
    s += box(8, 150, 'FAST BY BOTH SN1 AND SN2', 'good');
    // allyl bromide
    const a1 = P(26, 104), a2 = P(56, 86), a3 = P(86, 104), abr = P(126, 86);
    s += skDouble(a1, a2, P(56, 120)) + skb(a2, a3) + skb(a3, abr, 0, 14) + brAt(abr, [270, 0, 70]);
    s += tg(76, 142, 'allylic: next to C=C', 'mut');
    // benzyl bromide
    const ring = polyPts(214, 96, 6, 22, 90);
    const cc = P(ring[0].x, ring[0].y);
    s += ringSvg(ring, P(214, 96));
    const ch2 = P(cc.x + 26, cc.y - 16), bbr = P(ch2.x + 38, ch2.y + 14);
    s += skb(cc, ch2) + skb(ch2, bbr, 0, 14) + brAt(bbr, [270, 0, 90]);
    s += tg(252, 142, 'benzylic: next to ring', 'mut');

    s += box(166, 150, 'NO SN1 AND NO SN2', 'warn');
    // vinyl bromide
    const v1 = P(36, 252), v2 = P(70, 232), vbr = P(110, 252);
    s += skDouble(v1, v2, P(70, 268)) + skb(v2, vbr, 0, 14) + brAt(vbr, [300, 30, 110]);
    s += tg(76, 298, 'vinyl: on the C=C', 'mut');
    // bromobenzene
    const r2 = polyPts(200, 246, 6, 22, 0);
    s += ringSvg(r2, P(200, 246));
    const pbr = P(r2[0].x + 38, r2[0].y);
    s += skb(r2[0], pbr, 0, 14) + brAt(pbr, [270, 0, 90]);
    s += tg(252, 298, 'aryl: on the ring', 'mut');
    return s;
  },
  caption: 'Look at where the bromine sits relative to the C=C or the ring: one carbon away in the top panel, directly on it in the bottom panel.',
});

/* A benzene ring from polyPts, with three inset double bonds. */
function ringSvg(pts, c) {
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    s += i % 2 ? skDouble(a, b, c) : skb(a, b);
  }
  return s;
}

/* ------------------------------------------------------------------ 3 ---
   DBU, and why its conjugate acid is stable. Six-membered ring on the left,
   seven-membered on the right, sharing the amidine C and the ring N. */
function dbu(cx, cy, r, form) {
  // form: 'neutral' | 'top' (+ on the imine N, now N–H) | 'bottom' (+ on the ring N)
  const hex = polyPts(cx, cy, 6, r, 90);            // 0 top, 1 upper-left, 2 lower-left, 3 bottom, 4 lower-right, 5 upper-right
  const cS = hex[5], nS = hex[4], nTop = hex[0];      // shared C, shared N, imine N
  const s7 = Math.hypot(cS.x - nS.x, cS.y - nS.y);
  const a7 = s7 / (2 * Math.tan(Math.PI / 7));
  const hc = P((cS.x + nS.x) / 2 + a7, cy);
  const R7 = s7 / (2 * Math.sin(Math.PI / 7));
  const hep = polyPts(hc.x, hc.y, 7, R7, 180 - 360 / 14);   // 0 = shared C (upper-left), 1 = shared N (lower-left)
  const rn = 9;
  let s = '';
  // six-membered ring: nTop, hex1, hex2, hex3, nS, cS
  s += skb(nTop, hex[1], rn) + skb(hex[1], hex[2]) + skb(hex[2], hex[3]) + skb(hex[3], nS, 0, rn);
  // C–N bonds of the amidine
  if (form === 'bottom') {
    s += skb(cS, nTop, 0, rn);
    s += bond(cS, nS, { rFrom: 0, rTo: rn, order: 2, gap: 3 });
  } else {
    s += skb(cS, nS, 0, rn);
    s += bond(cS, nTop, { rFrom: 0, rTo: rn, order: 2, gap: 3 });
  }
  // seven-membered ring
  for (let i = 1; i < 7; i++) {
    const a = hep[i], b = hep[(i + 1) % 7];
    s += skb(a, b, i === 1 ? rn : 0, 0);
  }
  s += atom(nTop.x, nTop.y, 'N', { kind: form === 'neutral' ? 'hi' : 'plain', size: 13, r: rn + 1 });
  s += atom(nS.x, nS.y, 'N', { size: 13, r: rn + 1 });
  if (form !== 'neutral') {
    const h = P(nTop.x, nTop.y - 30);
    s += bond(nTop, h, { rFrom: rn, rTo: 9 }) + atom(h.x, h.y, 'H', { size: 13, r: 9 });
  } else {
    s += lpN(nTop, 270);
  }
  if (form === 'top') { s += chg(nTop.x + 14, nTop.y - 16, '+'); s += lpN(nS, 90); }
  if (form === 'bottom') { s += chg(nS.x + 14, nS.y + 16, '+'); s += lpN(nTop, 180); }
  return { s, nTop, nS, cS, hc };
}
FIGURES.push({
  id: 'se-dbu',
  section: 'substrate-effects',
  anchor: 'DBU is a strong base',
  alt: 'Top panel: DBU drawn as a skeletal structure, a six-membered ring fused to a seven-membered ring. The two rings share one carbon and one nitrogen. The shared carbon is double-bonded to a second nitrogen at the top of the six-membered ring, which carries a lone pair and is labeled the basic nitrogen; it sits in the crook between the rings. Bottom panel: the conjugate acid after that nitrogen takes a proton, drawn as two resonance forms joined by a double-headed arrow. In the first the positive charge is on the top nitrogen, which now carries H; in the second the C=N double bond has moved to the shared ring nitrogen, which carries the positive charge.',
  viewBox: '0 0 340 324',
  build() {
    let s = '';
    s += box(8, 130, 'DBU');
    const D = dbu(96, 86, 28, 'neutral');
    s += D.s;
    s += tg(224, 62, 'basic N', 'good', 'start');
    s += tg(224, 80, 'sits in the crook', 'mut', 'start');
    s += tg(224, 96, 'between two rings', 'mut', 'start');
    s += box(146, 170, 'ITS CONJUGATE ACID: CHARGE SHARED');
    const L = dbu(44, 244, 24, 'top');
    const R = dbu(206, 244, 24, 'bottom');
    s += L.s + R.s;
    s += arrow(P(160, 244), P(180, 244)) + arrow(P(160, 244), P(140, 244));
    s += tg(170, 304, 'the + is spread over both N', 'mut');
    return s;
  },
  caption: 'The top nitrogen takes the proton. In the bottom panel, follow the C=N double bond from one ring nitrogen to the other.',
});

/* ------------------------------------------------------------------ 4 ---
   A bulky base takes a beta hydrogen; it cannot reach the carbon. */
function bulkyBody(y0) {
  let s = '';
  s += box(y0, 290, 'TERT-BUTOXIDE AND 2-BROMOPROPANE');
  const ca = P(232, y0 + 118), cb = P(164, y0 + 118);
  const br = P(232, y0 + 62), hb = P(164, y0 + 172), me = P(298, y0 + 118);
  s += B(cb, 'CH₂', ca, 'C') + B(ca, 'C', br, 'Br') + B(ca, 'C', me, 'CH₃') + B(cb, 'CH₂', hb, 'H');
  const ha = arm(ca, 'C', 300, 40, 'H', 'hash');
  s += ha.s;
  s += A(cb, 'CH₂') + A(ca, 'C', 'warn') + A(me, 'CH₃') + A(hb, 'H', 'hi');
  s += A(br, 'Br') + lp(br, 270) + lp(br, 180) + lp(br, 0);
  // tert-butoxide, bottom left
  const q = P(64, y0 + 230), o = P(116, y0 + 230);
  s += armS(q, 'C', 120, 46, 'CH₃') + armS(q, 'C', 180, 46, 'CH₃') + armS(q, 'C', 240, 42, 'CH₃');
  s += B(q, 'C', o, 'O') + A(q, 'C') + A(o, 'O', 'hi');
  s += lp(o, 270) + lp(o, 90) + lp(o, 0) + chg(o.x + 21, o.y + 22);
  // arrows: O lone pair takes H; C–H bond becomes the pi bond; C–Br bond leaves
  s += curve(P(o.x, o.y - 26), P(hb.x - 12, hb.y + 9), { bow: -14 });
  s += curve(P(cb.x - 2, (cb.y + hb.y) / 2), P((cb.x + ca.x) / 2, cb.y + 6), { bow: 16 });
  s += curve(P(ca.x + 3, (ca.y + br.y) / 2), P(br.x + 16, br.y + 10), { bow: 12 });
  // the blocked approach to carbon
  s += arrow(P(o.x + 30, o.y - 12), P(204, y0 + 160), { muted: true });
  s += cross(212, y0 + 158);
  s += tg(100, y0 + 150, 'exposed β-H', 'good');
  s += tg(292, y0 + 190, 'crowded C', 'warn');
  s += tg(292, y0 + 206, 'out of reach', 'warn');
  return s;
}
FIGURES.push({
  id: 'se-bulky',
  section: 'substrate-effects',
  lessons: ['substrate-effects'],
  anchor: 'can still reach a hydrogen',
  alt: 'Two stacked panels. Top: 2-bromopropane drawn with the carbon that carries Br in the middle, Br above it, a CH3 to the right, an H on a hashed bond, and a CH2 on the left carrying an H that points down, anti to the Br. tert-Butoxide sits at the bottom left. A curved arrow runs from an oxygen lone pair to that exposed beta hydrogen, a second from the C–H bond to the bond between the two carbons, and a third from the C–Br bond onto bromine. A gray straight arrow from the oxygen toward the crowded carbon stops short at a cross. Bottom: the products, propene, CH2=CH–CH3, plus tert-butanol and bromide ion.',
  viewBox: '0 0 340 394',
  build() {
    let s = bulkyBody(8);
    s += box(306, 80, 'PRODUCTS');
    const p1 = P(40, 354), p2 = P(96, 354), p3 = P(152, 354);
    s += B(p1, 'H₂C', p2, 'CH', { order: 2 }) + B(p2, 'CH', p3, 'CH₃');
    s += A(p1, 'H₂C') + A(p2, 'CH') + A(p3, 'CH₃');
    s += lbl(250, 350, '+ (CH₃)₃C–OH');
    s += lbl(250, 370, '+ Br⁻');
    return s;
  },
  caption: 'Follow the arrow from the oxygen first: it reaches a hydrogen on the outside of the molecule. The gray arrow is the path to the carbon, which is too crowded for this base.',
});

/* ------------------------------------------------------------------ 5 ---
   Worked example 2: 2-bromobutane and ethoxide give three products. */
FIGURES.push({
  id: 'se-ex2',
  section: 'substrate-effects',
  anchor: 'naming only the major product is a partial answer.</p>',
  alt: 'Top: 2-bromobutane as a skeletal zigzag with Br on carbon 2; carbon 2 is labeled alpha and carbons 1 and 3 are each labeled beta. Below, three products in rows. Major: (E)-but-2-ene, the trans alkene with the double bond between carbons 2 and 3, from E2 with a hydrogen from carbon 3. Minor: but-1-ene, the double bond at the end of the chain, from E2 with a hydrogen from carbon 1. Minor: 2-ethoxybutane, sec-butyl ethyl ether, from SN2, with OCH2CH3 where the Br was.',
  viewBox: '0 0 340 444',
  build() {
    let s = '';
    s += box(8, 148, '2-BROMOBUTANE');
    const c1 = P(110, 120), c2 = P(144, 100), c3 = P(178, 120), c4 = P(212, 100), br = P(144, 64);
    s += skb(c1, c2) + skb(c2, c3) + skb(c3, c4) + skb(c2, br, 0, 14) + A(br, 'Br') + lp(br, 180) + lp(br, 0) + lp(br, 270);
    s += tg(98, 140, 'β (C1)') + tg(190, 142, 'β (C3)') + tg(170, 86, 'α (C2)', '', 'start');
    // products
    const row = (y, title, kind, how) => panel(4, y, 332, 76) + tg(234, y + 34, title, kind) + tg(234, y + 52, how, 'mut');
    s += row(164, 'MAJOR', 'good', 'E2, H from C3');
    const e1 = P(40, 214), e2 = P(74, 194), e3 = P(108, 214), e4 = P(142, 194);
    s += skb(e1, e2) + skDouble(e2, e3, P(91, 184)) + skb(e3, e4);
    s += tg(92, 232, '(E)-but-2-ene', 'mut');
    s += row(248, 'MINOR', '', 'E2, H from C1');
    const f1 = P(40, 298), f2 = P(74, 278), f3 = P(108, 298), f4 = P(142, 278);
    s += skDouble(f1, f2, P(74, 314)) + skb(f2, f3) + skb(f3, f4);
    s += tg(92, 316, 'but-1-ene', 'mut');
    s += panel(4, 332, 332, 104) + tg(234, 376, 'MINOR') + tg(234, 394, 'SN2 by ethoxide', 'mut');
    const g1 = P(40, 402), g2 = P(70, 384), g3 = P(100, 402), g4 = P(130, 384), go = P(70, 354);
    s += skb(g1, g2) + skb(g2, g3) + skb(g3, g4) + skb(g2, go, 0, 10);
    s += atom(go.x, go.y, 'O', { size: 13, r: 10 });
    s += skb(go, P(98, 342), 10, 0) + skb(P(98, 342), P(126, 356));
    s += tg(92, 424, '2-ethoxybutane', 'mut');
    return s;
  },
  caption: 'Carbon 2 carries the bromine, so carbons 1 and 3 are the two β carbons. Each one gives its own alkene.',
});

/* ------------------------------------------------------------------ 6 ---
   Worked example 4: the same reaction in acetone and in water. */
function azide(x, y) {
  // ⁻N=N⁺=N⁻, drawn horizontally; returns the left N's position
  const n1 = P(x, y), n2 = P(x + 30, y), n3 = P(x + 60, y);
  let s = bond(n1, n2, { order: 2, rFrom: 9, rTo: 9, gap: 3 }) + bond(n2, n3, { order: 2, rFrom: 9, rTo: 9, gap: 3 });
  s += atom(n1.x, n1.y, 'N', { size: 13, r: 9 }) + atom(n2.x, n2.y, 'N', { size: 13, r: 9 }) + atom(n3.x, n3.y, 'N', { kind: 'hi', size: 13, r: 9 });
  s += lpN(n1, 225) + lpN(n1, 135) + lpN(n3, 315) + lpN(n3, 45);
  s += chg(n1.x - 12, n1.y - 22) + chg(n2.x, n2.y - 20, '+') + chg(n3.x + 12, n3.y - 22);
  return { s, n1, n3 };
}
function water(o, hdeg1, hdeg2) {
  const h1 = armEnd(o, hdeg1, 26), h2 = armEnd(o, hdeg2, 26);
  return { s: bond(o, h1, { rFrom: 9, rTo: 7 }) + bond(o, h2, { rFrom: 9, rTo: 7 }) +
    atom(o.x, o.y, 'O', { size: 13, r: 9 }) + atom(h1.x, h1.y, 'H', { size: 13, r: 7 }) + atom(h2.x, h2.y, 'H', { size: 13, r: 7 }), h1, h2 };
}
const hb = (a, b) => `<line class="fg-dash" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line>`;
FIGURES.push({
  id: 'se-solvent',
  section: 'substrate-effects',
  lessons: ['substrate-effects'],
  anchor: 'Worked example 4 — the borderline case',
  alt: 'Two stacked panels. Top, in acetone: a bare azide ion, drawn as N=N=N with a minus charge on each end nitrogen and a plus on the middle one, attacks (R)-2-bromobutane from the side opposite the bromine; curved arrows run from an end-nitrogen lone pair to the carbon and from the C–Br bond onto bromine. The product, (S)-2-azidobutane, has its other three groups flipped to the other side: inversion. Bottom, in water: the same azide ion with water molecules hydrogen-bonded to both end nitrogens by dashed lines, so it attacks more slowly. The products listed are inverted 2-azidobutane from SN2, racemic 2-azidobutane and butan-2-ol from SN1, and a little but-2-ene from E1.',
  viewBox: '0 0 340 510',
  build() {
    let s = '';
    s += box(8, 290, 'IN ACETONE: AZIDE IS BARE', 'good');
    const Z = azide(22, 96);
    s += Z.s;
    const c = P(196, 96), br = P(262, 96);
    s += armS(c, 'C', 90, 44, 'C₂H₅') + armS(c, 'C', 235, 44, 'H', 'wedge') + armS(c, 'C', 305, 44, 'CH₃', 'hash');
    s += B(c, 'C', br, 'Br') + A(c, 'C', 'warn') + A(br, 'Br') + lp(br, 270) + lp(br, 90) + lp(br, 0);
    s += curve(P(Z.n3.x + 16, Z.n3.y + 6), P(c.x - 16, c.y + 4), { bow: 16 });
    s += curve(P((c.x + br.x) / 2, c.y - 3), P(br.x - 14, br.y - 11), { bow: -8 });
    s += tg(270, 164, '(R)-2-bromobutane', 'mut');
    // product, inverted
    const pc = P(150, 236), pn = P(92, 236);
    s += bond(pn, pc, { rFrom: 16, rTo: 14 }) + A(pn, 'N₃', 'hi');
    s += armS(pc, 'C', 90, 42, 'C₂H₅') + armS(pc, 'C', 305, 40, 'H', 'wedge') + armS(pc, 'C', 235, 40, 'CH₃', 'hash');
    s += A(pc, 'C');
    s += tg(262, 236, '(S)-2-azidobutane', 'good');
    s += tg(262, 254, 'inverted', 'mut');

    s += box(306, 196, 'IN WATER: AZIDE IS HELD BACK', 'warn');
    const Z2 = azide(130, 386);
    s += Z2.s;
    const w1 = water(P(80, 364), 150, 20), w2 = water(P(80, 412), 210, 340);
    const w3 = water(P(250, 364), 30, 160), w4 = water(P(250, 412), 330, 200);
    s += w1.s + w2.s + w3.s + w4.s;
    s += hb(w1.h2, P(Z2.n1.x - 11, Z2.n1.y - 7)) + hb(w2.h2, P(Z2.n1.x - 11, Z2.n1.y + 7));
    s += hb(w3.h2, P(Z2.n3.x + 11, Z2.n3.y - 7)) + hb(w4.h2, P(Z2.n3.x + 11, Z2.n3.y + 7));
    s += tg(170, 450, 'SN2: some inverted azide', 'mut');
    s += tg(170, 468, 'SN1: racemic azide + butan-2-ol', 'mut');
    s += tg(170, 486, 'E1: a little but-2-ene', 'mut');
    return s;
  },
  caption: 'Compare the azide in the two panels: nothing surrounds it in acetone, while in water the dashed hydrogen bonds hold on to both ends.',
});

/* ------------------------------------------------------------------ 7 ---
   Worked example 6: neopentyl bromide has no beta hydrogen. */
function neoBody(y0, verdict) {
  let s = '';
  const ca = P(206, y0 + 124), br = P(270, y0 + 124);
  const cb = armEnd(ca, 125, 62);
  s += B(cb, 'C', ca, 'CH₂') + B(ca, 'CH₂', br, 'Br');
  s += armS(cb, 'C', 70, 46, 'CH₃') + armS(cb, 'C', 165, 50, 'CH₃') + armS(cb, 'C', 240, 50, 'CH₃');
  s += A(cb, 'C', verdict ? 'warn' : 'plain') + A(ca, 'CH₂', 'hi') + A(br, 'Br') + lp(br, 270) + lp(br, 90) + lp(br, 0);
  s += tg(206, y0 + 160, 'α');
  s += tg(cb.x + 28, cb.y + 6, 'β');
  // ethoxide's backside path, blocked by a methyl on the beta carbon
  s += lbl(28, y0 + 128, 'EtO⁻', 'start');
  s += arrow(P(66, y0 + 124), P(104, y0 + 124), { muted: true }) + cross(112, y0 + 124);
  if (verdict) {
    s += tg(104, y0 + 196, 'β carbon: no H,', 'warn');
    s += tg(104, y0 + 212, 'so no E2', 'warn');
    s += tg(262, y0 + 196, 'back of α crowded:', 'mut');
    s += tg(262, y0 + 212, 'SN2 very slow', 'mut');
  }
  return s;
}
FIGURES.push({
  id: 'se-neopentyl',
  section: 'substrate-effects',
  anchor: 'Worked example 6 — the substrate with no beta hydrogen',
  alt: 'Neopentyl bromide, (CH3)3C–CH2–Br, with every group labeled. The CH2 that carries Br is marked alpha; the carbon next to it is marked beta and carries three CH3 groups and no hydrogen. Ethoxide, coming in from the side opposite the bromine, is stopped by a methyl on the beta carbon, shown by a gray arrow ending at a cross. Labels: beta carbon has no H, so no E2; the back of the alpha carbon is crowded, so SN2 is very slow.',
  viewBox: '0 0 340 240',
  build() { return panel(4, 8, 332, 224) + neoBody(8, true); },
  caption: 'The β carbon is the one bonded to the CH₂Br carbon. Count the hydrogens on it.',
});
FIGURES.push({
  id: 'l-se-neopentyl',
  lessons: ['substrate-effects'],
  alt: 'Neopentyl bromide, (CH3)3C–CH2–Br, with every group labeled. The CH2 that carries Br is marked alpha and the carbon next to it is marked beta; that beta carbon carries three CH3 groups. Ethoxide, coming in from the side opposite the bromine, is stopped by a methyl on the beta carbon, shown by a gray arrow ending at a cross.',
  viewBox: '0 0 340 184',
  build() { return panel(4, 4, 332, 176) + neoBody(-4, false); },
  caption: 'Neopentyl bromide, with the α and β carbons marked.',
});

/* ------------------------------------------------------------------ 8 ---
   The decision chart: the three steps in the order that works. */
FIGURES.push({
  id: 'se-chart',
  section: 'substrate-effects',
  anchor: '<h3>Quick reference</h3>',
  alt: 'Decision chart in three stacked steps. Step 1, the substrate: methyl or primary allows SN2, and E2 only with a bulky base; secondary allows all four; tertiary allows SN1 and E1, or E2, and never SN2. Step 2, the reagent: a strong nucleophile that is a weak base, such as iodide, thiolate, azide or cyanide, gives SN2; a strong base that is not bulky, such as hydroxide, alkoxide or amide, gives SN2 on primary and E2 on secondary and tertiary; a strong bulky base, tert-butoxide or DBU, gives E2 and the Hofmann product; a weak reagent, often the solvent, such as water, an alcohol or a carboxylic acid, gives SN1 and E1 together. Step 3, solvent and heat: polar aprotic favors SN2 and E2, polar protic favors SN1 and E1, and heat favors elimination.',
  viewBox: '0 0 700 452',
  build() {
    let s = '';
    s += tg(350, 24, 'STEP 1 · THE SUBSTRATE RULES MECHANISMS OUT');
    const col = (x, t, a, b) => panel(x, 36, 216, 84) + tg(x + 108, 62, t) + tg(x + 108, 84, a, 'good') + tg(x + 108, 104, b, 'mut');
    s += col(8, 'METHYL OR 1°', 'SN2', 'E2 only if base is bulky');
    s += col(242, 'SECONDARY (2°)', 'all four possible', 'the reagent decides');
    s += col(476, 'TERTIARY (3°)', 'SN1 + E1, or E2', 'never SN2');
    s += tg(350, 152, 'STEP 2 · THE REAGENT DECIDES AMONG WHAT IS LEFT');
    const rows = [
      ['strong nucleophile, weak base', 'I⁻, RS⁻, N₃⁻, ⁻CN', 'SN2', 'good'],
      ['strong base, not bulky', 'HO⁻, RO⁻, H₂N⁻', 'SN2 on 1°, E2 on 2°/3°', 'good'],
      ['strong base, bulky', 't-BuO⁻, DBU', 'E2, Hofmann product', 'good'],
      ['weak, often the solvent', 'H₂O, ROH, RCOOH', 'SN1 + E1 together', 'warn'],
    ];
    rows.forEach((r, i) => {
      const y = 186 + i * 38;
      s += lbl(16, y, r[0], 'start') + tg(300, y, r[1], 'mut', 'start');
      s += arrow(P(430, y - 4), P(462, y - 4), { muted: true }) + tg(474, y, r[2], r[3], 'start');
      if (i < 3) s += rule(8, y + 14, 692, y + 14);
    });
    s += tg(350, 356, 'STEP 3 · SOLVENT AND HEAT TIP A CLOSE CALL');
    const cell = (x, t, a) => panel(x, 368, 216, 72) + tg(x + 108, 396, t) + tg(x + 108, 420, a, 'good');
    s += cell(8, 'POLAR APROTIC', 'favors SN2 and E2');
    s += cell(242, 'POLAR PROTIC', 'favors SN1 and E1');
    s += cell(476, 'HEAT', 'favors elimination');
    return s;
  },
  caption: 'Read it top to bottom. Each step only chooses among the options the step above left open.',
});

export default FIGURES;
