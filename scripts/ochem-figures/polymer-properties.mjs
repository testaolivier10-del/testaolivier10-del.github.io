/* Figures for the polymer-properties notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure is placed by its markers, which sit in the prose (or in a
   lesson step's HTML string) exactly where the figure belongs. A figure that
   is wider than 340 in the notes has a stacked copy for the lesson, with the
   id prefix l-. */
import { atom, bond, wedge, hash, arrow, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { zig, benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* T with a subscript. SVG has no <sub>, so the letter is a tspan dropped
   below the baseline; the prose writes T<sub>g</sub> and the figure has to
   show the same symbol. The fg- classes fix the font size in CSS, so the
   subscript is sized relative to that. */
const Tsub = (x, y, sub, cls = 'fg-tag', anchor = 'middle', after = '') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">T<tspan dy="3" font-size="80%">${sub}</tspan><tspan dy="-3">${after}</tspan></text>`;

/* ------------------------------------------------------------------------
   Crystalline and amorphous regions: the fringed-micelle picture. Five
   chains run side by side through two ordered bundles (the crystalline
   regions) and loop and cross each other in between (the amorphous region).
   One chain is highlighted to show that a single chain passes through both
   kinds of region. Drawn once for the notes and once, narrower, for the
   lesson; the geometry is the same function. */
function fringed(W, H, g) {
  let s = '';
  const { A, B, top, gap, x0, x1, labels } = g;
  const rows = [0, 1, 2, 3, 4];
  // Pale boxes behind the ordered bundles.
  s += panel(A[0] - 8, top - 10, A[1] - A[0] + 16, gap * 4 + 20, { kind: 'hi', r: 6 });
  s += panel(B[0] - 8, top + g.drop - 10, B[1] - B[0] + 16, gap * 4 + 20, { kind: 'hi', r: 6 });
  const yA = (k) => top + k * gap;
  const yB = (k) => top + g.drop + k * gap;
  // Start and end heights, and how far each loose stretch swings, chosen by
  // hand so the loose stretches cross each other and look tangled.
  const ys = g.ys, ye = g.ye, sw = g.sw;
  for (const k of rows) {
    const d1 = (A[0] - x0) * 0.55, d2 = (B[0] - A[1]) * 0.7, d3 = (x1 - B[1]) * 0.55;
    const [s1, s2, s3, s4] = sw[k];
    const path =
      `M${x0} ${ys[k]} ` +
      `C${x0 + d1} ${ys[k] + s1} ${A[0] - d1} ${yA(k) - s1} ${A[0]} ${yA(k)} ` +
      `L${A[1]} ${yA(k)} ` +
      `C${A[1] + d2} ${yA(k) + s2} ${B[0] - d2} ${yB(k) + s3} ${B[0]} ${yB(k)} ` +
      `L${B[1]} ${yB(k)} ` +
      `C${B[1] + d3} ${yB(k) - s4} ${x1 - d3} ${ye[k] + s4} ${x1} ${ye[k]}`;
    s += `<path class="${k === g.hi ? 'fg-bond-hi' : 'fg-bond'}" fill="none" d="${path}"></path>`;
  }
  s += labels;
  return s;
}

const FRINGED_ALT = 'Five polymer chains. In two places they run straight and parallel, packed side by side, in shaded boxes labeled crystalline region. Between those boxes the same chains loop and cross each other, labeled amorphous region. One highlighted chain passes through both crystalline regions and the tangle between them.';

FIGURES.push({
  id: 'fringed-micelle',
  section: 'polymer-properties',
  anchor: '<h3>Crystalline and amorphous regions</h3>',
  viewBox: '0 0 760 330',
  alt: FRINGED_ALT,
  build() {
    let labels = '';
    labels += tag(220, 34, 'CRYSTALLINE REGION');
    labels += text(220, 52, 'chains lie side by side', { cls: 'fg-sm' });
    labels += tag(540, 34, 'CRYSTALLINE REGION');
    labels += text(540, 52, 'the same chains, ordered again', { cls: 'fg-sm' });
    labels += tag(380, 298, 'AMORPHOUS REGION: CHAINS LOOP AND TANGLE');
    labels += text(700, 298, 'one chain, highlighted, runs through both', { cls: 'fg-sm', anchor: 'end' });
    return fringed(760, 330, {
      A: [160, 280], B: [470, 610], top: 88, gap: 14, drop: 56, x0: 30, x1: 730, hi: 2,
      ys: [150, 96, 250, 200, 120], ye: [110, 250, 170, 90, 230],
      sw: [[60, 110, -40, 40], [-50, 150, -120, 60], [70, 170, -150, -50], [-60, 120, -60, 60], [40, 90, -140, -40]],
      labels,
    });
  },
  caption: 'One sample, two kinds of region. In the shaded boxes the chains are straight and parallel; everywhere else the same chains are loose and tangled.',
});

FIGURES.push({
  id: 'l-fringed-micelle',
  lessons: ['polymer-properties'],
  viewBox: '0 0 340 300',
  alt: FRINGED_ALT,
  build() {
    let labels = '';
    labels += tag(95, 30, 'CRYSTALLINE');
    labels += tag(245, 30, 'CRYSTALLINE');
    labels += tag(170, 256, 'AMORPHOUS: TANGLED');
    labels += tag(170, 280, 'highlighted: one chain', { cls: 'fg-tag-mut' });
    return fringed(340, 300, {
      A: [62, 128], B: [212, 278], top: 60, gap: 13, drop: 64, x0: 12, x1: 328, hi: 2,
      ys: [120, 70, 200, 170, 96], ye: [90, 214, 150, 70, 200],
      sw: [[40, 80, -30, 30], [-40, 110, -90, 40], [50, 120, -110, -40], [-40, 90, -40, 40], [30, 70, -100, -30]],
      labels,
    });
  },
  caption: 'Shaded: crystalline. Between the boxes the same chains tangle.',
});

/* ------------------------------------------------------------------------
   What the two transitions do to stiffness. Schematic: both curves share one
   Tg line so their shapes can be compared. */
const TG_ALT = 'Stiffness plotted on a log scale against temperature for two polymers. The amorphous one, polystyrene, loses about a thousandfold in stiffness at the glass transition and then flows. The semicrystalline one, HDPE, steps down only a little at the glass transition, stays stiff along a long plateau, and collapses at the melting temperature.';

FIGURES.push({
  id: 'tg-and-tm',
  section: 'polymer-properties',
  anchor: '<h3>Two transition temperatures, not one</h3>',
  viewBox: '0 0 760 370',
  alt: TG_ALT,
  build() {
    let s = '';
    s += tag(380, 26, 'WHAT THE TWO TRANSITIONS DO TO STIFFNESS');
    const X0 = 96, X1 = 700, Y0 = 62, Y1 = 296;
    s += rule(X0, Y1, X1, Y1);
    s += rule(X0, Y1, X0, Y0);
    s += text(X0 + 6, Y0 - 10, 'stiffness, log scale', { cls: 'fg-sm', anchor: 'start' });
    s += text(694, Y1 - 8, 'temperature →', { cls: 'fg-tag', anchor: 'end' });

    const TG = 286, TM = 580;
    s += `<line class="fg-dash" x1="${TG}" y1="${Y0 + 6}" x2="${TG}" y2="${Y1}"></line>`;
    s += `<line class="fg-dash" x1="${TM}" y1="${Y0 + 6}" x2="${TM}" y2="${Y1}"></line>`;
    s += Tsub(TG, Y0, 'g', 'fg-tag-good');
    s += Tsub(TM, Y0, 'm', 'fg-tag-good');

    /* Amorphous: one cliff, at Tg, and then it flows. */
    s += `<path class="fg-bond-hi" fill="none" d="M110 96 L256 100 C276 102 272 212 300 216 L392 232 C424 238 432 290 460 294"></path>`;
    s += text(118, 84, 'amorphous — polystyrene', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(196, 236, 'about a thousandfold, all at once', { cls: 'fg-sm' });

    /* Semicrystalline: a step at Tg, a long plateau, a cliff at Tm. */
    s += `<path class="fg-bond" fill="none" d="M110 130 L258 134 C278 136 276 168 300 172 L556 184 C580 188 584 290 606 294"></path>`;
    s += text(336, 164, 'semicrystalline — HDPE', { cls: 'fg-sm', anchor: 'start' });
    s += text(462, 212, 'the crystalline regions still hold it together', { cls: 'fg-sm' });

    s += text(180, Y1 + 24, 'glassy', { cls: 'fg-tag' });
    s += text(430, Y1 + 20, 'rubbery if amorphous,', { cls: 'fg-tag' });
    s += text(430, Y1 + 36, 'tough if semicrystalline', { cls: 'fg-tag' });
    s += text(648, Y1 + 24, 'flows or melts', { cls: 'fg-tag' });

    s += rule(24, 340, 736, 340);
    s += text(380, 362, 'How much each transition matters depends on how crystalline the sample is.', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'The amorphous polymer softens all at once at T<sub>g</sub>. The semicrystalline one barely notices T<sub>g</sub> and gives way at T<sub>m</sub>. The axis is schematic: the two curves share one T<sub>g</sub> line so their shapes can be compared, but the real glass transitions of polystyrene and HDPE are about 220&nbsp;&deg;C apart.',
});

/* The lesson copy: the same two curves in two stacked plots, one per
   polymer, with every label in fg-tag or fg-lbl. */
FIGURES.push({
  id: 'l-tg-and-tm',
  lessons: ['polymer-properties'],
  viewBox: '0 0 340 400',
  alt: TG_ALT,
  build() {
    let s = '';
    const plot = (oy, title, cls, curve, zones) => {
      const X0 = 36, X1 = 326, Y0 = oy + 34, Y1 = oy + 150;
      let g = text(20, oy + 14, title, { cls, anchor: 'start' });
      g += rule(X0, Y1, X1, Y1);
      g += rule(X0, Y1, X0, Y0);
      g += text(28, Y0 + 6, 'stiff', { cls: 'fg-tag-mut', anchor: 'end' });
      g += text(28, Y1, 'soft', { cls: 'fg-tag-mut', anchor: 'end' });
      g += `<line class="fg-dash" x1="120" y1="${Y0 - 4}" x2="120" y2="${Y1}"></line>`;
      g += `<line class="fg-dash" x1="250" y1="${Y0 - 4}" x2="250" y2="${Y1}"></line>`;
      g += Tsub(120, Y0 - 10, 'g', 'fg-tag-good');
      g += Tsub(250, Y0 - 10, 'm', 'fg-tag-good');
      g += `<path class="fg-bond-hi" fill="none" d="${curve(Y0, Y1)}"></path>`;
      for (const [x, t] of zones) g += text(x, Y1 + 18, t, { cls: 'fg-tag' });
      return g;
    };
    s += plot(0, 'AMORPHOUS — polystyrene', 'fg-tag-warn',
      (Y0, Y1) => `M44 ${Y0 + 10} L108 ${Y0 + 12} C122 ${Y0 + 14} 118 ${Y1 - 42} 134 ${Y1 - 40} L170 ${Y1 - 34} C186 ${Y1 - 30} 190 ${Y1 - 4} 204 ${Y1 - 2}`,
      [[76, 'glassy'], [168, 'rubbery'], [236, 'flows']]);
    s += plot(196, 'SEMICRYSTALLINE — HDPE', 'fg-tag',
      (Y0, Y1) => `M44 ${Y0 + 10} L108 ${Y0 + 12} C122 ${Y0 + 14} 118 ${Y0 + 28} 134 ${Y0 + 30} L236 ${Y0 + 36} C252 ${Y0 + 40} 254 ${Y1 - 4} 270 ${Y1 - 2}`,
      [[76, 'glassy'], [185, 'tough'], [292, 'melts']]);
    s += text(314, 392, 'temperature →', { cls: 'fg-tag', anchor: 'end' });
    return s;
  },
  caption: 'Schematic. Real T<sub>g</sub> values for the two differ by about 220&nbsp;&deg;C.',
});

/* ------------------------------------------------------------------------
   Polystyrene: the same phenyl group on two different chains. Syndiotactic
   (phenyls alternate wedge, dash) packs and crystallizes; atactic (random)
   cannot, and is the ordinary clear, glassy polystyrene. */
/* One polystyrene backbone: eight carbons in a zig-zag, a phenyl ring on
   every other carbon, each ring bond a wedge (w) or a dash (h). */
function psChain(x0, y, pattern) {
  let s = '';
  const pts = zig(x0, y, 8, 38, 24);
  for (let i = 0; i < 7; i++) s += bond(pts[i], pts[i + 1], { rFrom: 0, rTo: 0 });
  // The chain continues past both ends.
  s += `<line class="fg-dash" x1="${pts[0].x - 22}" y1="${pts[0].y - 13}" x2="${pts[0].x}" y2="${pts[0].y}"></line>`;
  s += `<line class="fg-dash" x1="${pts[7].x}" y1="${pts[7].y}" x2="${pts[7].x + 22}" y2="${pts[7].y + 13}"></line>`;
  [1, 3, 5, 7].forEach((vi, j) => {
    const c = pts[vi];
    const end = P(c.x, c.y - 34);
    s += pattern[j] === 'w' ? wedge(c, end, { rFrom: 0, rTo: 0, width: 8 }) : hash(c, end, { rFrom: 0, rTo: 0, width: 9, rungs: 5 });
    s += benzene(c.x, end.y - 16, 16, { rot: 270 }).svg;
  });
  return s;
}
const SYNDIO = ['w', 'h', 'w', 'h'], ATACTIC = ['w', 'w', 'h', 'w'];
const PS_ALT = 'Two eight-carbon zig-zag polystyrene backbones, each carrying four phenyl rings on every other carbon. Syndiotactic: the ring bonds alternate wedge, dash, wedge, dash; labeled the chains pack, crystalline, melts near 270 degrees C. Atactic: wedge, wedge, dash, wedge in no pattern; labeled no packing, amorphous and glass-clear, T g 100 degrees C.';

FIGURES.push({
  id: 'polystyrene-tacticity',
  section: 'polymer-properties',
  anchor: '<h3>Two transition temperatures, not one</h3>',
  viewBox: '0 0 760 330',
  alt: PS_ALT,
  build() {
    let s = '';
    s += panel(24, 40, 344, 214, { kind: 'good' });
    s += tag(196, 30, 'SYNDIOTACTIC POLYSTYRENE');
    s += psChain(64, 200, SYNDIO);
    s += text(196, 236, 'phenyls alternate: the chains pack', { cls: 'fg-lbl' });
    s += text(196, 280, 'crystalline, melts near 270 °C', { cls: 'fg-tag-good' });
    s += panel(392, 40, 344, 214, { kind: 'warn' });
    s += tag(564, 30, 'ATACTIC (ORDINARY) POLYSTYRENE');
    s += psChain(432, 200, ATACTIC);
    s += text(564, 236, 'phenyls at random: no packing', { cls: 'fg-lbl' });
    s += Tsub(564, 280, 'g', 'fg-tag-warn', 'middle', ' = 100 °C: an amorphous, clear glass');
    s += text(380, 316, 'wedge: toward you   ·   dash: away from you', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'The same bulky phenyl group on both chains. Only the pattern of wedges and dashes differs, and that alone decides whether the chains can pack.',
});

FIGURES.push({
  id: 'l-polystyrene-tacticity',
  lessons: ['polymer-properties'],
  viewBox: '0 0 340 470',
  alt: PS_ALT,
  build() {
    let s = '';
    s += tag(20, 20, 'SYNDIOTACTIC', { anchor: 'start' });
    s += panel(10, 30, 320, 168, { kind: 'good' });
    s += psChain(36, 160, SYNDIO);
    s += text(170, 190, 'rings alternate: chains pack', { cls: 'fg-lbl' });
    s += text(170, 216, 'crystalline, melts near 270 °C', { cls: 'fg-tag-good' });
    s += tag(20, 252, 'ATACTIC (ORDINARY)', { anchor: 'start' });
    s += panel(10, 262, 320, 168, { kind: 'warn' });
    s += psChain(36, 392, ATACTIC);
    s += text(170, 422, 'rings at random: no packing', { cls: 'fg-lbl' });
    s += Tsub(170, 448, 'g', 'fg-tag-warn', 'middle', ' = 100 °C: a clear, rigid glass');
    s += text(170, 466, 'wedge: toward you · dash: away', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Same phenyl rings; only their pattern differs.',
});

/* ------------------------------------------------------------------------
   Vulcanization: one sulfur bridge between two cis-polyisoprene chains,
   attached at allylic carbons, with the C=C of each repeat unit kept. Narrow
   enough for the lesson, so the notes and the lesson share it. */
FIGURES.push({
  id: 'vulcanization-bridge',
  section: 'polymer-properties',
  anchor: '<h3>Cross-linking as a dial</h3>',
  lessons: ['polymer-properties'],
  viewBox: '0 0 340 360',
  alt: 'Two natural rubber chains, one above the other, each drawn as one cis-polyisoprene repeat unit in skeletal form with its C=C and methyl group. A bridge of two sulfur atoms runs straight down from an allylic carbon of the top chain, the carbon next to the C=C, to an allylic carbon of the bottom chain. Both C=C bonds are still there.',
  build() {
    let s = '';
    s += tag(170, 20, 'ONE SULFUR BRIDGE, TWO CHAINS');
    const L = 34, h = L * Math.sin(Math.PI / 3), w = L / 2;
    const unit = (y, dir) => {
      // dir = 1: C=C on top, CH2 carbons below it; dir = -1: mirrored.
      const C2 = P(150, y), C3 = P(150 + L, y);
      const C1 = P(C2.x - w, y + dir * h), C4 = P(C3.x + w, y + dir * h);
      const Me = P(C2.x - w, y - dir * h);
      let g = bond(C2, C3, { rFrom: 0, rTo: 0, order: 2 });
      g += bond(C1, C2, { rFrom: 0, rTo: 0 }) + bond(C3, C4, { rFrom: 0, rTo: 0 });
      g += bond(C2, Me, { rFrom: 0, rTo: 0 });
      const l1 = P(C1.x - L, C1.y), l2 = P(C4.x + L, C4.y);
      g += bond(C1, l1, { rFrom: 0, rTo: 0 }) + bond(C4, l2, { rFrom: 0, rTo: 0 });
      g += `<line class="fg-dash" x1="${l1.x}" y1="${l1.y}" x2="24" y2="${l1.y}"></line>`;
      g += `<line class="fg-dash" x1="${l2.x}" y1="${l2.y}" x2="316" y2="${l2.y}"></line>`;
      return { g, C1, C2, C3, C4, Me };
    };
    const top = unit(92, 1);
    const bot = unit(270, -1);
    s += top.g + bot.g;
    // The bridge: C4 (top) – S – S – C4 (bottom), straight down.
    const S1 = P(top.C4.x, top.C4.y + 38), S2 = P(top.C4.x, bot.C4.y - 38);
    s += bond(top.C4, S1, { rFrom: 0, rTo: 13, cls: 'fg-bond-hi' });
    s += bond(S1, S2, { rFrom: 13, rTo: 13, cls: 'fg-bond-hi' });
    s += bond(S2, bot.C4, { rFrom: 13, rTo: 0, cls: 'fg-bond-hi' });
    s += atom(S1.x, S1.y, 'S', { kind: 'hi', r: 13 });
    s += atom(S2.x, S2.y, 'S', { kind: 'hi', r: 13 });
    s += text(224, (S1.y + S2.y) / 2 + 4, 'S–S bridge', { cls: 'fg-tag', anchor: 'start' });

    // The kept double bonds.
    s += text(214, 60, 'C=C kept from', { cls: 'fg-tag-good', anchor: 'start' });
    s += text(214, 74, '1,4-addition', { cls: 'fg-tag-good', anchor: 'start' });
    s += `<line class="fg-dash" x1="210" y1="68" x2="${top.C3.x - 4}" y2="${top.C3.y - 8}"></line>`;
    // The allylic carbons that carry the bridge.
    s += text(176, 172, 'allylic carbon:', { cls: 'fg-tag', anchor: 'end' });
    s += text(176, 188, 'next to a C=C', { cls: 'fg-tag', anchor: 'end' });
    s += `<line class="fg-dash" x1="170" y1="160" x2="${top.C4.x - 6}" y2="${top.C4.y + 6}"></line>`;
    s += `<line class="fg-dash" x1="170" y1="194" x2="${bot.C4.x - 6}" y2="${bot.C4.y - 6}"></line>`;
    s += text(20, 60, 'rubber chain', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(20, 322, 'second rubber chain', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(170, 350, 'each chain: cis-polyisoprene', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'Where a bridge attaches. The sulfur bonds at an allylic carbon, and the C=C beside it is still there after vulcanization.',
});

/* ------------------------------------------------------------------------
   Cross-linking as a dial: the same four chains three times, with only the
   number of sulfur bridges changing. */
const wavy = (x0, y, len, amp, segs = 8) => {
  let d = `M${x0} ${y}`;
  for (let i = 1; i <= segs; i++) {
    const x = x0 + (len * i) / segs;
    d += ` Q${x0 + (len * (i - 0.5)) / segs} ${y + (i % 2 ? amp : -amp)} ${x} ${y}`;
  }
  return `<path class="fg-bond" fill="none" d="${d}"></path>`;
};
const DIAL_ALT = 'The same four wavy polymer chains drawn three times: loose and staggered with no bridges, tied by three short sulfur bridges, and tied by a dense mesh of them. The first flows, the second is elastic, the third is hard and brittle.';

FIGURES.push({
  id: 'crosslink-dial',
  section: 'polymer-properties',
  anchor: '<h3>Cross-linking as a dial</h3>',
  viewBox: '0 0 760 340',
  alt: DIAL_ALT,
  build() {
    let s = '';
    const YS = [76, 112, 148, 184];
    const panelAt = (ox, kind, title, stagger, bridges, out1, out2) => {
      let g = panel(ox, 56, 220, 152, { kind });
      g += tag(ox + 110, 44, title);
      YS.forEach((y, i) => { g += wavy(ox + 14 + (stagger ? i * 5 : 0), y, 178, 7); });
      for (const [bx, a, b] of bridges) {
        g += `<line class="fg-bond-hi" x1="${ox + bx}" y1="${YS[a] + 8}" x2="${ox + bx}" y2="${YS[b] - 8}"></line>`;
      }
      g += text(ox + 110, 232, out1, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good' });
      g += text(ox + 110, 250, out2, { cls: 'fg-sm' });
      return g;
    };
    s += panelAt(24, 'warn', 'no cross-links', true, [],
      'it flows', 'chains slide past each other for good');
    s += panelAt(270, null, 'a few percent sulfur', false,
      [[56, 0, 1], [132, 1, 2], [92, 2, 3]],
      'elastic', 'it stretches, then springs back');
    s += panelAt(516, null, 'heavily cross-linked', false,
      [[40, 0, 1], [86, 0, 1], [132, 0, 1], [178, 0, 1],
       [52, 1, 2], [98, 1, 2], [144, 1, 2],
       [40, 2, 3], [86, 2, 3], [132, 2, 3], [178, 2, 3]],
      'hard and brittle', 'nothing can move: ebonite');
    s += text(380, 284, 'Each highlighted bridge is a short run of sulfur atoms, –S–S–, tying one chain to the next.', { cls: 'fg-lbl' });
    s += rule(24, 302, 736, 302);
    s += text(380, 326, 'One variable, how much sulfur, and three materials come out of it.', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'The chains and the chemistry are the same in all three panels. Only the number of bridges changes.',
});

FIGURES.push({
  id: 'l-crosslink-dial',
  lessons: ['polymer-properties'],
  viewBox: '0 0 340 450',
  alt: DIAL_ALT,
  build() {
    let s = '';
    const panelAt = (oy, kind, title, stagger, bridges, out) => {
      const YS = [oy + 34, oy + 56, oy + 78, oy + 100];
      let g = panel(10, oy + 20, 320, 96, { kind });
      g += tag(20, oy + 12, title, { anchor: 'start' });
      g += text(320, oy + 12, out, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', anchor: 'end' });
      YS.forEach((y, i) => { g += wavy(24 + (stagger ? i * 6 : 0), y, 272, 5, 12); });
      for (const [bx, a, b] of bridges) {
        g += `<line class="fg-bond-hi" x1="${bx}" y1="${YS[a] + 6}" x2="${bx}" y2="${YS[b] - 6}"></line>`;
      }
      return g;
    };
    s += panelAt(0, 'warn', 'NO CROSS-LINKS', true, [], 'flows');
    s += panelAt(140, null, 'A FEW PERCENT SULFUR', false,
      [[92, 0, 1], [206, 1, 2], [150, 2, 3]], 'elastic');
    s += text(214, 140 + 70, 'S–S', { cls: 'fg-tag', anchor: 'start' });
    const many = [];
    for (const [a, xs] of [[0, [50, 104, 158, 212, 266]], [1, [76, 130, 184, 238]], [2, [50, 104, 158, 212, 266]]]) {
      for (const x of xs) many.push([x, a, a + 1]);
    }
    s += panelAt(280, null, 'HEAVILY CROSS-LINKED', false, many, 'hard, brittle');
    s += text(170, 436, 'Each bridge: a short run of S atoms', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'Same chains in every panel; only the number of bridges changes.',
});

/* ------------------------------------------------------------------------
   Rubber elasticity is entropy. Three chains tied by two cross-links, drawn
   coiled (relaxed) and pulled nearly straight (stretched). */
function coil(x0, x1, yc, R, turns, phase) {
  // x advances steadily while a circle of radius R is traced: loops, like a
  // coiled chain seen from the side.
  const N = 90;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = phase + t * turns * 2 * Math.PI;
    const x = x0 + t * (x1 - x0) + R * 0.8 * Math.cos(a) - R * 0.8 * Math.cos(phase);
    const y = yc + R * Math.sin(a) * (0.7 + 0.3 * Math.sin(3 * t + phase));
    d += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d;
}
function straightish(x0, x1, yc, amp) {
  const N = 24;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const x = x0 + ((x1 - x0) * i) / N;
    d += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + (yc + (i % 2 ? -amp : amp)).toFixed(1);
  }
  return d;
}
function entropyPanel(ox, oy, w, h, stretched, knots) {
  let g = '';
  const ys = [oy + h * 0.25, oy + h * 0.5, oy + h * 0.75];
  const xa = ox + 22, xb = ox + w - 22;
  ys.forEach((y, i) => {
    const d = stretched ? straightish(xa, xb, y, 3) : coil(xa + 16, xb - 16, y, h * 0.1, 3.2 + i * 0.4, i * 1.7);
    g += `<path class="fg-bond" fill="none" d="${d}"></path>`;
  });
  // Cross-links: short highlighted bridges at fixed fractions along the chains.
  for (const [f, a] of knots) {
    const x = xa + (xb - xa) * f;
    g += `<line class="fg-bond-hi" x1="${x}" y1="${ys[a] + 6}" x2="${x}" y2="${ys[a + 1] - 6}"></line>`;
  }
  return g;
}
const ENTROPY_ALT = 'Left or top: three coiled chains tied together by two short cross-links, labeled relaxed, a huge number of possible shapes, high entropy. Right or bottom: the same chains pulled nearly straight by arrows at both ends, labeled stretched, very few possible shapes, low entropy. An arrow back to the coiled state is labeled let go: entropy pulls them back.';

FIGURES.push({
  id: 'rubber-entropy',
  section: 'polymer-properties',
  anchor: '<h3>Cross-linking as a dial</h3>',
  viewBox: '0 0 760 300',
  alt: ENTROPY_ALT,
  build() {
    let s = '';
    s += panel(24, 44, 300, 170, { kind: 'good' });
    s += tag(174, 32, 'RELAXED: COILED');
    s += entropyPanel(24, 44, 300, 170, false, [[0.3, 0], [0.7, 1]]);
    s += panel(436, 44, 300, 170);
    s += tag(586, 32, 'STRETCHED: NEARLY STRAIGHT');
    s += entropyPanel(436, 44, 300, 170, true, [[0.3, 0], [0.7, 1]]);
    s += arrow(P(446, 129), P(410, 129));
    s += arrow(P(726, 129), P(752, 129));
    s += arrow(P(338, 96), P(422, 96));
    s += text(380, 86, 'pull', { cls: 'fg-tag' });
    s += arrow(P(422, 164), P(338, 164), { muted: true });
    s += text(380, 184, 'let go', { cls: 'fg-tag' });
    s += text(174, 238, 'a huge number of possible shapes', { cls: 'fg-lbl' });
    s += text(174, 258, 'high entropy', { cls: 'fg-tag-good' });
    s += text(586, 238, 'very few possible shapes', { cls: 'fg-lbl' });
    s += text(586, 258, 'low entropy', { cls: 'fg-tag-warn' });
    s += text(380, 290, 'The highlighted cross-links stop the chains sliding apart, so letting go returns them to the coil.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Stretching trades a coil that can take countless shapes for a nearly straight chain that can take very few. The pull back toward the coil is the rubber&rsquo;s elasticity.',
});

FIGURES.push({
  id: 'l-rubber-entropy',
  lessons: ['polymer-properties'],
  viewBox: '0 0 340 440',
  alt: ENTROPY_ALT,
  build() {
    let s = '';
    s += tag(20, 22, 'RELAXED: COILED', { anchor: 'start' });
    s += text(320, 22, 'high entropy', { cls: 'fg-tag-good', anchor: 'end' });
    s += panel(10, 32, 320, 140, { kind: 'good' });
    s += entropyPanel(10, 32, 320, 140, false, [[0.3, 0], [0.7, 1]]);
    s += arrow(P(120, 186), P(120, 230));
    s += text(110, 212, 'pull', { cls: 'fg-tag', anchor: 'end' });
    s += arrow(P(220, 230), P(220, 186), { muted: true });
    s += text(230, 212, 'let go', { cls: 'fg-tag', anchor: 'start' });
    s += tag(20, 256, 'STRETCHED: NEARLY STRAIGHT', { anchor: 'start' });
    s += text(320, 256, 'low entropy', { cls: 'fg-tag-warn', anchor: 'end' });
    s += panel(10, 266, 320, 120);
    s += entropyPanel(10, 266, 320, 120, true, [[0.3, 0], [0.7, 1]]);
    s += text(170, 408, 'Coiled: countless shapes.', { cls: 'fg-lbl' });
    s += text(170, 428, 'Straight: very few.', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'The highlighted bridges are cross-links. They keep the chains from sliding apart, so letting go returns them to the coil.',
});

/* ------------------------------------------------------------------------
   Plasticizer: small molecules between PVC chains hold them apart. */
FIGURES.push({
  id: 'plasticizer-spacing',
  section: 'polymer-properties',
  anchor: '<h3>Plasticizers',
  viewBox: '0 0 760 300',
  alt: 'Left: four PVC chains drawn close together, labeled rigid PVC, T g about 80 degrees C, glassy, drainpipe. Right: the same four chains spread further apart with small oval plasticizer molecules sitting between them, labeled plasticized PVC, T g below room temperature, flexible, cable insulation.',
  build() {
    let s = '';
    const col = (ox, gapY, withPl, kind) => {
      s += panel(ox, 44, 330, 170, { kind });
      const n = 4;
      const y0 = 44 + (170 - gapY * (n - 1)) / 2;
      for (let r = 0; r < n; r++) s += wavy(ox + 24, y0 + r * gapY, 282, 5, 14);
      if (withPl) {
        const spots = [[70, 0], [160, 0], [250, 0], [110, 1], [205, 1], [290, 1], [60, 2], [150, 2], [245, 2]];
        for (const [dx, r] of spots) {
          s += `<ellipse class="fg-orb-alt" cx="${ox + dx}" cy="${y0 + r * gapY + gapY / 2}" rx="11" ry="6"></ellipse>`;
        }
      }
    };
    col(24, 22, false, null);
    s += tag(189, 32, 'RIGID PVC');
    s += Tsub(189, 238, 'g', 'fg-lbl', 'middle', ' ≈ 80 °C: glassy at room temperature');
    s += text(189, 258, 'drainpipe, window frame', { cls: 'fg-tag-mut' });
    col(406, 44, true, 'good');
    s += tag(571, 32, 'PLASTICIZED PVC');
    s += Tsub(571, 238, 'g', 'fg-lbl', 'middle', ' below room temperature: flexible');
    s += text(571, 258, 'cable insulation, flooring', { cls: 'fg-tag-mut' });
    s += text(380, 288, 'Ovals: plasticizer molecules (such as a phthalate diester) sitting between the chains.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'The same PVC chains with and without a plasticizer. Nothing is bonded to the chains; the small molecules only hold them further apart.',
});

export default FIGURES;
