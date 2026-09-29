/* Figures for the mass-spec notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions used throughout:
   - a radical's unpaired electron is one larger dot (`dot`), a lone pair is
     two small ones;
   - every arrow on a radical cation is a fishhook with ONE barb, because it
     moves one electron; a bond that breaks or forms needs two of them;
   - groups are written out (CH₃, CH₂) so the masses can be added up from
     the drawing;
   - figures shown in the lesson are 340 wide or less, stacked, and use only
     fg-lbl / fg-tag text. */
import { atom, bond, arrow, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { polyPts, polyRing, benzene } from '../lib/ochem-skeletal.mjs';
import { n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${n2(x)}" cy="${n2(y)}" r="3.4"></circle>`;

/* A fishhook: one barb, because it carries one electron. */
function fishhook(a, b, opts = {}) {
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
  return `<path class="fg-arrow" d="M${n2(a.x)} ${n2(a.y)} Q${n2(cx)} ${n2(cy)} ${n2(bx)} ${n2(by)}"></path>` +
         `<path class="fg-head" d="M${n2(b.x)} ${n2(b.y)} L${n2(bx + px * h)} ${n2(by + py * h)} L${n2(bx)} ${n2(by)} Z"></path>`;
}

/* An atom or group at (x, y). The radius grows with the label, so bonds
   stop at the edge of a CH₃ as well as at the edge of an O. */
function G(x, y, lbl, kind) {
  const r = lbl.length >= 3 ? 19 : lbl.length === 2 ? 17 : lbl === 'H' ? 13 : 15;
  return { x, y, lbl, r, kind };
}
const draw = (g) => atom(g.x, g.y, g.lbl, { r: g.r, kind: g.kind });
const bd = (a, b, order = 1, cls) => bond(a, b, { rFrom: a.r, rTo: b.r, order, cls, gap: order === 3 ? 3.2 : 4 });
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
/* A point at `d` px from atom g, at screen angle `deg` (0 = east, 90 = south). */
const at = (g, deg, d) => P(g.x + Math.cos((deg * Math.PI) / 180) * d, g.y + Math.sin((deg * Math.PI) / 180) * d);
const charge = (g, deg, d = 26) => { const p = at(g, deg, d); return text(p.x, p.y + 5, '+', { cls: 'fg-lbl', size: 13 }); };
const plusSign = (x, y) => text(x, y + 5, '+', { cls: 'fg-lbl', size: 13 });

/* ------------------------------------------------ the molecular ion ---
   butan-2-one, then the same molecule with one oxygen lone-pair electron
   gone. 340 wide, so the notes and the lesson share it. */
FIGURES.push({
  id: 'ms-molecular-ion',
  section: 'mass-spec',
  lessons: ['mass-spec'],
  anchor: '<h3>Ionization and the molecular ion</h3>',
  alt: 'Top: butan-2-one written out as CH3, C, CH2, CH3 in a row, with an O double-bonded to the second carbon and two lone pairs on the oxygen. A downward arrow is labeled minus one electron. Bottom: the same molecule, but the oxygen now has one lone pair, one single unpaired electron and a plus charge. It is labeled M+•, the molecular ion, m/z 72.',
  viewBox: '0 0 340 318',
  build() {
    let s = '';
    const row = (y, ion) => {
      const c1 = G(50, y, 'CH₃'), c2 = G(126, y, 'C'), c3 = G(202, y, 'CH₂'), c4 = G(282, y, 'CH₃');
      const o = G(126, y - 62, 'O', ion ? 'warn' : undefined);
      let g = bd(c1, c2) + bd(c2, c3) + bd(c3, c4) + bd(c2, o, 2);
      g += [c1, c2, c3, c4].map(draw).join('');
      g += lonePair(o.x, o.y, 180, { dist: 24 });
      if (ion) {
        const d = at(o, -45, 24);
        g += dot(d.x, d.y) + charge(o, 12, 30);
      } else {
        g += lonePair(o.x, o.y, 0, { dist: 24 });
      }
      g += draw(o);
      return g;
    };
    s += tag(170, 18, 'butan-2-one, a neutral molecule');
    s += row(112, false);
    s += arrow(P(170, 142), P(170, 196));
    s += text(184, 166, '− e⁻', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(184, 184, 'from an O lone pair', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += row(274, true);
    s += tag(170, 310, 'M⁺•, the molecular ion: m/z 72');
    return s;
  },
  caption: 'The beam removes one electron, most easily one of oxygen&rsquo;s lone-pair electrons. The oxygen keeps one lone pair and one unpaired electron (the single dot), so it carries a positive charge.',
});

/* ------------------------------------------------ spectrum helpers --- */

/* A stick, for a line spectrum. */
function stick(x, yBase, h, cls = 'fg-bond', w = 4) {
  return `<line class="${cls}" x1="${n2(x)}" y1="${n2(yBase)}" x2="${n2(x)}" y2="${n2(yBase - h)}" stroke-width="${w}"></line>`;
}
/* Axes, ticks and bars for one spectrum. X maps m/z to x; bars are
   [m/z, % of base peak]. */
function spectrum(base, X, bars, ticks, topY) {
  let out = rule(70, base, 716, base) + rule(70, base, 70, base - 140);
  for (const t of [100, 50, 0]) {
    out += rule(64, base - t * 1.3, 70, base - t * 1.3);
    out += text(60, base - t * 1.3 + 4, String(t), { cls: 'fg-sm', size: 9.5, anchor: 'end' });
  }
  for (const b of bars) out += stick(X(b[0]), base, Math.max(b[1] * 1.3, 1.5));
  for (const m of ticks) {
    out += rule(X(m), base, X(m), base + 6);
    out += text(X(m), base + 20, String(m), { cls: 'fg-sm', size: 9.5 });
  }
  out += text(393, base + 40, 'm/z', { cls: 'fg-sm', size: 10 });
  const cy = base - 70;
  out += `<text class="fg-sm" x="30" y="${cy}" text-anchor="middle" transform="rotate(-90 30 ${cy})">relative abundance (%)</text>`;
  return out;
}

/* ------------------------------------------------ butan-2-one spectrum --- */
FIGURES.push({
  id: 'ms-spectrum-butanone',
  section: 'mass-spec',
  anchor: '<h3>Two quick reads from the molecular ion</h3>',
  alt: 'The mass spectrum of butan-2-one drawn as a bar chart of relative abundance against m/z. The tallest bar is at m/z 43, labeled base peak, CH3CO+. The molecular ion at m/z 72 is about a quarter of that height. A tiny bar at 73 is labeled M+1, about 4% of M. Smaller bars sit at 57, 29, 27 and 15.',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    const X = (m) => 70 + ((m - 10) / 70) * 620;
    const base = 214;
    s += text(74, 24, 'butan-2-one, CH₃–CO–CH₂–CH₃ (M = 72)', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += spectrum(base, X, [[15, 6], [27, 16], [29, 24], [43, 100], [57, 8], [72, 25], [73, 1.1]], [20, 30, 40, 50, 60, 70, 80]);
    s += text(X(43) + 12, 76, 'base peak: CH₃CO⁺ at 43', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(X(72), 134, 'M⁺• = 72', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(X(72), 150, 'the molecular ion', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += `<line class="fg-dash-hi" x1="${n2(X(72) - 2)}" y1="158" x2="${n2(X(72) - 2)}" y2="${n2(base - 36)}"></line>`;
    s += text(X(57), 190, '57', { cls: 'fg-sm', size: 10 });
    s += text(X(29), 172, '29', { cls: 'fg-sm', size: 10 });
    s += text(716, 110, 'M+1 at 73: about 4% of M', { cls: 'fg-tag-mut', size: 10, anchor: 'end' });
    s += `<line class="fg-dash" x1="690" y1="116" x2="${n2(X(73) + 3)}" y2="${n2(base - 8)}"></line>`;
    return s;
  },
  caption: 'The molecular ion sits at the right-hand end of the spectrum and gives the molecular weight. The base peak, the tallest, is a fragment. The hairline at 73 is the M+1 peak.',
});

/* ------------------------------------------------ alpha cleavage ---
   The two alpha bonds of the butan-2-one molecular ion, each broken with
   three fishhooks. Drawn by one function for both widths: the notes put the
   two routes side by side, the lesson stacks them. */
function alphaRoute(ox, oy, which, sp) {
  /* which = 'ethyl' breaks C2–CH₂ (the right-hand bond); 'methyl' breaks
     C1–C2 (the left-hand bond). sp is the atom spacing. */
  let s = '';
  const y = oy + 104;
  const c1 = G(ox + 40, y, 'CH₃'), c2 = G(ox + 40 + sp, y, 'C'), c3 = G(ox + 40 + 2 * sp, y, 'CH₂'), c4 = G(ox + 40 + 3 * sp, y, 'CH₃');
  const o = G(c2.x, y - 60, 'O', 'warn');
  const breaking = which === 'ethyl' ? [c2, c3] : [c1, c2];
  s += bd(c1, c2, 1, which === 'methyl' ? 'fg-bond-hi' : undefined);
  s += bd(c2, c3, 1, which === 'ethyl' ? 'fg-bond-hi' : undefined);
  s += bd(c3, c4) + bd(c2, o, 2);
  s += [c1, c2, c3, c4].map(draw).join('');
  const side = which === 'ethyl' ? 1 : -1;          // +1: arrows on the right of C=O
  s += lonePair(o.x, o.y, side === 1 ? 180 : 0, { dist: 24 });
  const dp = at(o, side === 1 ? -40 : -140, 24);
  s += dot(dp.x, dp.y) + charge(o, side === 1 ? -110 : -70, 30);
  s += draw(o);
  /* the three fishhooks */
  const bm = mid(breaking[0], breaking[1]);
  const piTarget = P(c2.x + side * 9, (o.y + c2.y) / 2 + 4);
  s += fishhook(P(dp.x + side * 4, dp.y + 2), P(piTarget.x + side * 3, piTarget.y - 8), { bow: side * -14, size: 8 });
  s += fishhook(P(bm.x, bm.y - 5), P(piTarget.x + side * 2, piTarget.y + 6), { bow: side * 12, size: 8 });
  const leaving = which === 'ethyl' ? c3 : c1;
  s += fishhook(P(bm.x, bm.y + 5), P(leaving.x - side * 10, leaving.y + 16), { bow: side * 12, size: 8 });
  return s;
}
/* The products: an acylium ion drawn linear (its carbon is sp) and the
   neutral radical. */
function alphaProducts(ox, y, which, sp) {
  let s = '';
  if (which === 'ethyl') {
    const a = G(ox + 40, y, 'CH₃'), c = G(ox + 40 + sp, y, 'C'), o = G(ox + 40 + 2 * sp, y, 'O', 'warn');
    s += bd(a, c) + bd(c, o, 3) + draw(a) + draw(c);
    s += lonePair(o.x, o.y, 0, { dist: 24 }) + charge(o, -90, 28) + draw(o);
    const r1 = G(ox + 40 + 3.6 * sp, y, 'CH₂'), r2 = G(ox + 40 + 4.6 * sp, y, 'CH₃');
    s += plusSign(ox + 40 + 2.85 * sp, y);
    s += dot(r1.x - 25, y) + bd(r1, r2) + draw(r1) + draw(r2);
    s += text(c.x, y + 36, 'm/z 43', { cls: 'fg-tag', size: 11 });
    s += text((r1.x + r2.x) / 2, y + 36, '29, neutral', { cls: 'fg-tag-mut', size: 11 });
  } else {
    const m = G(ox + 32, y, 'CH₃');
    s += dot(m.x + 25, y) + draw(m);
    s += plusSign(ox + 32 + 0.95 * sp, y);
    const a = G(ox + 40 + 1.5 * sp, y, 'CH₃'), b = G(ox + 40 + 2.5 * sp, y, 'CH₂'), c = G(ox + 40 + 3.5 * sp, y, 'C'), o = G(ox + 40 + 4.5 * sp, y, 'O', 'warn');
    s += bd(a, b) + bd(b, c) + bd(c, o, 3) + draw(a) + draw(b) + draw(c);
    s += lonePair(o.x, o.y, 0, { dist: 24 }) + charge(o, -90, 28) + draw(o);
    s += text(m.x + 6, y + 36, '15, neutral', { cls: 'fg-tag-mut', size: 11 });
    s += text(b.x + 0.5 * sp, y + 36, 'm/z 57', { cls: 'fg-tag', size: 11 });
  }
  return s;
}

FIGURES.push({
  id: 'ms-alpha-cleavage',
  section: 'mass-spec',
  anchor: '<h3>Alpha cleavage</h3>',
  alt: 'Two panels, each starting from the butan-2-one molecular ion, CH3–C(=O+•)–CH2–CH3. Left panel: the bond from the carbonyl carbon to the CH2 is highlighted. Three single-barbed fishhook arrows show one electron of that bond pairing with oxygen’s unpaired electron to make a new C–O bond, and the other electron leaving with the CH2CH3 group. Products: the acylium ion CH3–C≡O+, m/z 43, the base peak, plus a neutral ethyl radical, mass 29. Right panel: the same three arrows break the bond to the CH3 instead, giving CH3CH2–C≡O+, m/z 57, plus a neutral methyl radical, mass 15.',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    const sp = 62;
    s += panel(8, 8, 364, 324, { kind: 'good' }) + panel(388, 8, 364, 324);
    s += tag(190, 32, 'BREAK THE α BOND TO THE ETHYL', { cls: 'fg-tag-good' });
    s += tag(570, 32, 'BREAK THE α BOND TO THE METHYL');
    s += alphaRoute(8, 36, 'ethyl', sp) + alphaRoute(388, 36, 'methyl', sp);
    s += arrow(P(190, 180), P(190, 222)) + arrow(P(570, 180), P(570, 222));
    s += alphaProducts(8, 258, 'ethyl', 58) + alphaProducts(388, 258, 'methyl', 56);
    s += text(190, 320, 'the larger radical leaves: base peak', { cls: 'fg-tag-good', size: 11 });
    s += text(570, 320, 'the smaller radical leaves: minor peak', { cls: 'fg-tag-mut', size: 11 });
    return s;
  },
  caption: 'Both α bonds join the C=O carbon to a neighboring carbon. Either break gives an acylium ion, drawn in its linear C&equiv;O⁺ form. Each fishhook moves one electron.',
});

FIGURES.push({
  id: 'l-ms-alpha-cleavage',
  lessons: ['mass-spec'],
  alt: 'Two stacked panels, each starting from the butan-2-one molecular ion. Top: fishhook arrows break the bond from the carbonyl carbon to the CH2, giving CH3–C≡O+ at m/z 43 and a neutral ethyl radical, 29. Bottom: the bond to the CH3 breaks instead, giving CH3CH2–C≡O+ at m/z 57 and a neutral methyl radical, 15.',
  viewBox: '0 0 340 648',
  build() {
    let s = '';
    const sp = 62;
    s += panel(4, 4, 332, 314, { kind: 'good' }) + panel(4, 330, 332, 314);
    s += tag(170, 26, 'LOSE THE ETHYL: m/z 43', { cls: 'fg-tag-good' });
    s += tag(170, 352, 'LOSE THE METHYL: m/z 57');
    s += alphaRoute(34, 30, 'ethyl', sp) + alphaRoute(34, 356, 'methyl', sp);
    s += arrow(P(170, 172), P(170, 212)) + arrow(P(170, 498), P(170, 538));
    s += alphaProducts(-10, 248, 'ethyl', 56) + alphaProducts(-4, 574, 'methyl', 54);
    s += text(170, 306, 'larger radical lost: base peak', { cls: 'fg-tag-good', size: 11 });
    s += text(170, 632, 'smaller radical lost: minor peak', { cls: 'fg-tag-mut', size: 11 });
    return s;
  },
  caption: 'Both α bonds join the C=O carbon to a neighbor. Either break leaves an acylium ion.',
});

/* ------------------------------------------------ McLafferty ---
   Hexan-2-one's molecular ion curled into a six-membered ring. Six
   fishhooks: the γ-H moves to O, a new C=C forms between β and γ, the α–β
   bond breaks, and the C=O π electrons shift to give the enol. */
FIGURES.push({
  id: 'ms-mclafferty',
  section: 'mass-spec',
  anchor: '<h3>The McLafferty rearrangement</h3>',
  alt: 'Left: the hexan-2-one molecular ion drawn as a six-membered ring of O, the carbonyl carbon, the alpha CH2, the beta CH2, the gamma CH and a hydrogen, with a dashed line from the hydrogen to the oxygen. The oxygen has one lone pair, one unpaired electron and a plus charge, and none of these move. The carbonyl carbon carries a CH3 and the gamma carbon a CH3. Six single-barbed fishhook arrows, two into each new bond: one electron of the gamma C–H bond and one electron of the C=O pi bond form the new O–H bond; the other C–H electron and one electron of the alpha–beta bond form a C=C between beta and gamma; the other alpha–beta electron and the other C=O pi electron form a C=C between the carbonyl carbon and the alpha carbon. Right: the products, the enol radical cation CH2=C(CH3)–OH with a plus charge and unpaired electron on oxygen, m/z 58, detected, and propene CH2=CH–CH3, mass 42, neutral and not detected.',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    const cx = 210, cy = 196, r = 95;
    const V = (deg) => P(cx + r * Math.cos((deg * Math.PI) / 180), cy - r * Math.sin((deg * Math.PI) / 180));
    const h = G(V(90).x, V(90).y, 'H');
    const cg = G(V(30).x, V(30).y, 'CH');
    const cb = G(V(-30).x, V(-30).y, 'CH₂');
    const ca = G(V(-90).x, V(-90).y, 'CH₂');
    const c2 = G(V(-150).x, V(-150).y, 'C');
    const o = G(V(150).x, V(150).y, 'O', 'warn');
    const me1 = G(c2.x - 58, c2.y + 34, 'CH₃');
    const me6 = G(cg.x + 58, cg.y - 34, 'CH₃');
    s += tag(cx, 24, 'HEXAN-2-ONE M⁺•, m/z 100');
    /* ring bonds; the two that break are highlighted, the one that forms is dashed */
    s += bd(c2, o, 2) + bd(c2, ca) + bd(ca, cb, 1, 'fg-bond-hi') + bd(cb, cg) + bd(cg, h, 1, 'fg-bond-hi');
    const oh1 = at(o, -30, o.r + 3), oh2 = at(h, 150, h.r + 3);
    s += `<line class="fg-dash" x1="${n2(oh1.x)}" y1="${n2(oh1.y)}" x2="${n2(oh2.x)}" y2="${n2(oh2.y)}"></line>`;
    s += bd(c2, me1) + bd(cg, me6);
    s += [h, cg, cb, ca, c2, me1, me6].map(draw).join('');
    s += lonePair(o.x, o.y, 180, { dist: 24 });
    const dp = at(o, -90, 24);
    s += dot(dp.x, dp.y) + charge(o, 135, 28);
    s += draw(o);
    /* Greek labels outside the ring */
    s += text(ca.x, ca.y + 40, 'α', { cls: 'fg-tag', size: 12 });
    s += text(cb.x + 32, cb.y + 14, 'β', { cls: 'fg-tag', size: 12 });
    s += text(cg.x + 30, cg.y + 20, 'γ', { cls: 'fg-tag', size: 12 });
    /* six fishhooks, each moving one electron */
    const ohm = mid(o, h);                                   // the O–H bond that forms
    const chm = mid(cg, h);                                  // the γ C–H bond that breaks
    s += fishhook(P(chm.x - 8, chm.y + 6), P(ohm.x + 8, ohm.y + 8), { bow: -12, size: 8 });
    const gbm = mid(cg, cb);                                 // the β=γ π bond that forms
    s += fishhook(P(chm.x + 2, chm.y + 10), P(gbm.x - 11, gbm.y - 10), { bow: -10, size: 8 });
    const abm = mid(ca, cb);                                 // the α–β bond that breaks
    s += fishhook(P(abm.x - 5, abm.y - 9), P(gbm.x - 11, gbm.y + 10), { bow: 10, size: 8 });
    const a2m = mid(ca, c2);                                 // the C=Cα π bond that forms
    s += fishhook(P(abm.x - 12, abm.y - 4), P(a2m.x + 6, a2m.y - 11), { bow: 14, size: 8 });
    const com = mid(c2, o);                                  // the C=O π bond that breaks
    s += fishhook(P(com.x + 9, com.y - 8), P(ohm.x - 2, ohm.y + 12), { bow: 10, size: 8 });   // one π electron to O–H
    s += fishhook(P(com.x + 9, com.y + 10), P(a2m.x - 2, a2m.y - 12), { bow: -10, size: 8 }); // the other to C=Cα

    s += arrow(P(372, 196), P(436, 196));

    /* products: the enol radical cation */
    const pC = G(560, 150, 'C'), pCH2 = G(496, 186, 'CH₂'), pMe = G(560, 86, 'CH₃'), pO = G(624, 186, 'O', 'warn'), pH = G(688, 186, 'H');
    s += bd(pC, pCH2, 2) + bd(pC, pMe) + bd(pC, pO) + bd(pO, pH);
    s += [pC, pCH2, pMe, pH].map(draw).join('');
    s += lonePair(pO.x, pO.y, 90, { dist: 24 });
    const pd = at(pO, -60, 24);
    s += dot(pd.x, pd.y) + charge(pO, 145, 27);
    s += draw(pO);
    s += tag(592, 240, 'enol radical cation: m/z 58, detected');
    /* products: propene */
    s += plusSign(488, 300);
    const q1 = G(532, 300, 'CH₂'), q2 = G(596, 300, 'CH'), q3 = G(660, 300, 'CH₃');
    s += bd(q1, q2, 2) + bd(q2, q3) + [q1, q2, q3].map(draw).join('');
    s += tag(596, 342, 'propene: 42, neutral, not detected', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Six fishhooks, one electron each. Three bonds break: the highlighted γ C&ndash;H and α&ndash;β C&ndash;C, and the C=O π bond. Each new bond receives two arrows: the dashed O&ndash;H, the β=γ C=C of propene and the C=Cα of the enol. Oxygen&rsquo;s lone pair and unpaired electron do not move.',
});

/* ------------------------------------------------ m/z 91 ---
   Toluene's molecular ion loses a hydrogen atom from the CH₃; the benzyl
   cation that forms rearranges into the seven-membered tropylium ion. */
function tropParts(pos) {
  /* pos: { tol, benzyl, trop } centers; returns the three structures */
  let s = '';
  const R = 30;
  /* toluene */
  const t = benzene(pos.tol.x, pos.tol.y, R, { rot: 90 });
  s += t.svg;
  const top = t.pts[0];
  const me = G(top.x, top.y - 44, 'CH₃');
  s += bond(top, me, { rFrom: 0, rTo: me.r }) + draw(me);
  /* benzyl cation */
  const b = benzene(pos.benzyl.x, pos.benzyl.y, R, { rot: 90 });
  s += b.svg;
  const bt = b.pts[0];
  const ch2 = G(bt.x, bt.y - 44, 'CH₂', 'warn');
  s += bond(bt, ch2, { rFrom: 0, rTo: ch2.r }) + draw(ch2);
  s += text(ch2.x + 26, ch2.y - 8, '+', { cls: 'fg-lbl', size: 13 });
  /* tropylium: seven carbons, the charge shared by all of them */
  const hp = polyPts(pos.trop.x, pos.trop.y, 7, 36, 90);
  s += polyRing(hp);
  s += `<circle class="fg-dash" cx="${n2(pos.trop.x)}" cy="${n2(pos.trop.y)}" r="21" fill="none"></circle>`;
  s += text(pos.trop.x, pos.trop.y + 5, '+', { cls: 'fg-lbl', size: 13 });
  return s;
}

FIGURES.push({
  id: 'ms-tropylium',
  section: 'mass-spec',
  anchor: '<h3>Common losses worth recognizing</h3>',
  alt: 'Three structures in a row. Toluene, a benzene ring with a CH3, mass 92. An arrow labeled: the molecular ion loses H•. The benzyl cation, a benzene ring with a CH2+ group, m/z 91. An arrow labeled: ring expands. The tropylium ion, a seven-membered ring with a dashed circle and a plus sign in the middle, m/z 91, aromatic.',
  viewBox: '0 0 760 230',
  build() {
    let s = '';
    s += tropParts({ tol: P(110, 130), benzyl: P(380, 130), trop: P(640, 124) });
    s += arrow(P(170, 130), P(310, 130));
    s += text(240, 118, 'M⁺• loses H•', { cls: 'fg-tag', size: 11 });
    s += arrow(P(440, 130), P(580, 130));
    s += text(510, 118, 'ring expands', { cls: 'fg-tag', size: 11 });
    s += text(110, 196, 'toluene, M = 92', { cls: 'fg-lbl', size: 13 });
    s += text(380, 196, 'benzyl cation, m/z 91', { cls: 'fg-lbl', size: 13 });
    s += text(640, 196, 'tropylium ion, m/z 91', { cls: 'fg-lbl', size: 13 });
    s += text(640, 216, 'aromatic: 6 π electrons, 7 carbons', { cls: 'fg-tag-mut', size: 11 });
    return s;
  },
  caption: 'One route, simplified: the ring can also expand before the hydrogen is lost. Both cations are C₇H₇⁺, and the dashed circle means the charge is shared by all seven carbons.',
});

FIGURES.push({
  id: 'l-ms-tropylium',
  lessons: ['mass-spec'],
  alt: 'Top: toluene, a benzene ring with a CH3, mass 92. A downward arrow labeled: the molecular ion loses H•. Bottom left: the benzyl cation, a benzene ring with a CH2+ group, m/z 91. An arrow labeled ring expands leads to the bottom right: the tropylium ion, a seven-membered ring with a dashed circle and a plus sign, m/z 91.',
  viewBox: '0 0 340 326',
  build() {
    let s = '';
    s += tropParts({ tol: P(170, 100), benzyl: P(76, 254), trop: P(266, 248) });
    s += text(170, 150, 'toluene, M = 92', { cls: 'fg-lbl', size: 13 });
    s += arrow(P(168, 160), P(120, 192));
    s += text(150, 194, 'M⁺• loses H•', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += arrow(P(122, 252), P(212, 252));
    s += text(167, 242, 'expands', { cls: 'fg-tag', size: 11 });
    s += text(76, 312, 'benzyl, m/z 91', { cls: 'fg-lbl', size: 13 });
    s += text(266, 312, 'tropylium, m/z 91', { cls: 'fg-lbl', size: 13 });
    return s;
  },
  caption: 'One route, simplified. Both cations are C₇H₇⁺ and appear at 91; in tropylium the charge is shared by all seven carbons.',
});

/* ------------------------------------------------ isotope patterns --- */
/* One small bar pattern: peaks = [[label, % of tallest], ...]. */
function pattern(x0, yBase, peaks, opts = {}) {
  const H = opts.h ?? 90, step = opts.step ?? 44, cls = opts.cls ?? 'fg-sm';
  let s = rule(x0 - 16, yBase, x0 + step * (peaks.length - 1) + 16, yBase);
  peaks.forEach(([lbl, pc], i) => {
    const x = x0 + i * step, h = Math.max((pc / 100) * H, 2);
    s += `<rect class="fg-fill-hi" x="${n2(x - 6)}" y="${n2(yBase - h)}" width="12" height="${n2(h)}" rx="3"></rect>`;
    s += text(x, yBase + 16, lbl, { cls, size: cls === 'fg-sm' ? 10 : 13 });
  });
  return s;
}

FIGURES.push({
  id: 'ms-isotope-patterns',
  section: 'mass-spec',
  anchor: '<h3>Isotope patterns: chlorine and bromine leave a fingerprint</h3>',
  alt: 'Six small bar patterns for the molecular ion region. Top row: no chlorine or bromine, a tall M and a small M+1; one chlorine, M and M+2 in a 3 to 1 ratio; one bromine, M and M+2 of almost equal height. Bottom row: two chlorines, M, M+2 and M+4 in a 9 to 6 to 1 ratio; two bromines, 1 to 2 to 1; one chlorine and one bromine, 3 to 4 to 1.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const cols = [130, 380, 630];
    const cell = (i, row, title, ratio, peaks, x0) => {
      const cx = cols[i], top = row === 0 ? 10 : 172;
      let g = panel(cx - 118, top, 236, 150);
      g += text(cx, top + 22, title, { cls: 'fg-tag', size: 11 });
      g += pattern(x0 ?? cx - 22 * (peaks.length - 1), top + 120, peaks);
      g += text(cx + 100, top + 46, ratio, { cls: 'fg-lbl', size: 13, anchor: 'end' });
      return g;
    };
    s += cell(0, 0, 'NO Cl OR Br', 'M+1 small', [['M', 100], ['M+1', 5.5]]);
    s += cell(1, 0, 'ONE Cl', '3 : 1', [['M', 100], ['M+2', 32]]);
    s += cell(2, 0, 'ONE Br', '1 : 1', [['M', 100], ['M+2', 97]]);
    s += cell(0, 1, 'TWO Cl', '9 : 6 : 1', [['M', 100], ['M+2', 66.7], ['M+4', 11.1]]);
    s += cell(1, 1, 'TWO Br', '1 : 2 : 1', [['M', 50], ['M+2', 100], ['M+4', 50]]);
    s += cell(2, 1, 'ONE Cl + ONE Br', '3 : 4 : 1', [['M', 75], ['M+2', 100], ['M+4', 25]]);
    return s;
  },
  caption: 'The molecular-ion region only, for six kinds of compound. The peaks sit two mass units apart, and their heights name the halogens.',
});

FIGURES.push({
  id: 'l-ms-isotopes',
  lessons: ['mass-spec'],
  alt: 'Three stacked bar patterns for the molecular ion region. No chlorine or bromine: a tall M and a small M+1. One chlorine: M and M+2 in a 3 to 1 ratio. One bromine: M and M+2 of almost equal height.',
  viewBox: '0 0 340 390',
  build() {
    let s = '';
    const rows = [
      ['NO Cl OR Br', 'M+1 small', [['M', 100], ['M+1', 5.5]]],
      ['ONE Cl', '3 : 1', [['M', 100], ['M+2', 32]]],
      ['ONE Br', '1 : 1', [['M', 100], ['M+2', 97]]],
    ];
    rows.forEach(([title, ratio, peaks], i) => {
      const top = 4 + i * 128;
      s += panel(4, top, 332, 118);
      s += text(20, top + 26, title, { cls: 'fg-tag', size: 11, anchor: 'start' });
      s += text(20, top + 52, ratio, { cls: 'fg-lbl', size: 13, anchor: 'start' });
      s += pattern(214, top + 90, peaks, { h: 70, step: 64, cls: 'fg-lbl' });
    });
    return s;
  },
  caption: 'M+2 is two mass units above M. Its height beside M names the halogen.',
});

/* ------------------------------------------------ bromoethane spectrum --- */
FIGURES.push({
  id: 'ms-spectrum-bromoethane',
  section: 'mass-spec',
  anchor: '<span class="k">Worked example — an unknown at m/z 108/110</span>',
  alt: 'The mass spectrum of bromoethane drawn as a bar chart. The tallest bar is at m/z 29, labeled base peak, C2H5+. At the high-mass end are two bars of almost equal height at m/z 108 and 110, labeled M and M+2, one bromine.',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    const X = (m) => 70 + ((m - 10) / 110) * 620;
    const base = 214;
    s += text(74, 24, 'bromoethane, CH₃CH₂Br (M = 108)', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += spectrum(base, X, [[26, 10], [27, 52], [29, 100], [93, 5], [95, 5], [108, 45], [110, 44]], [20, 40, 60, 80, 100, 120]);
    s += text(X(29) + 12, 76, 'base peak 29: C₂H₅⁺, after Br• is lost', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(X(109), 128, 'M at 108 and M+2 at 110,', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(X(109), 144, 'almost equal: one bromine', { cls: 'fg-sm', size: 10, anchor: 'end' });
    return s;
  },
  caption: 'The same compound as the worked example. The M and M+2 pair sits at the right-hand end, and the base peak is the ethyl cation.',
});

export default FIGURES;
