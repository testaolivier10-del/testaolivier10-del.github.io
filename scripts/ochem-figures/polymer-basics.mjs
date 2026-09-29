/* Figures for the polymer-basics notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk, polyPts } from '../lib/ochem-skeletal.mjs';

/* Shared drawing helpers. */

/* A polymer bracket: an upright with two short arms turned toward the
   repeat unit. dir = 1 opens to the right, -1 to the left. */
const brack = (x, y, h, dir) => {
  const t = y - h / 2, b = y + h / 2;
  return `<path class="fg-bond" d="M${x + 9 * dir} ${t} L${x} ${t} L${x} ${b} L${x + 9 * dir} ${b}"></path>`;
};

/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${x}" cy="${y}" r="3.4"></circle>`;

/* A fishhook: one barb, because it carries one electron. */
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

/* A carbonyl carbon drawn as C with its =O above it. */
const carbonyl = (x, y, opts = {}) => {
  const up = opts.up ?? 36;
  return atom(x, y, 'C', { r: 13 }) + atom(x, y - up, 'O', { r: 13 }) +
    bond(P(x, y), P(x, y - up), { order: 2, rFrom: 13, rTo: 13 });
};

/* A small unlabeled circle standing for one monomer unit. */
const unit = (x, y, r = 5) => atom(x, y, '', { r });
const link = (a, b, r = 5) => bond(a, b, { rFrom: r, rTo: r });

const FIGURES = [];

/* ------------------------------------------------------------------------
   The vocabulary figure: monomers, the chain they make, one repeat unit
   picked out of it, and the bracket notation with n. */
FIGURES.push({
  id: 'polyethylene-chain',
  section: 'polymer-basics',
  lessons: ['polymer-basics'],
  anchor: '<h3>Counting reactive sites</h3>',
  viewBox: '0 0 340 322',
  alt: 'Three ethylene molecules, CH2=CH2, whose pi bonds open so that they join into a chain of six CH2 groups; one CH2–CH2 pair in the chain is shaded as the repeat unit, and below it the chain is written as the repeat unit in square brackets with a subscript n',
  build() {
    let s = '';
    s += tag(170, 18, 'three ethylene monomers');
    for (let i = 0; i < 3; i++) {
      const x0 = 40 + i * 104;
      s += atom(x0, 48, 'CH₂', { r: 16 });
      s += atom(x0 + 46, 48, 'CH₂', { r: 16 });
      s += bond(P(x0, 48), P(x0 + 46, 48), { order: 2, rFrom: 16, rTo: 16 });
    }
    s += arrow(P(60, 76), P(60, 116), { muted: true });
    s += tag(76, 100, 'each π bond opens', { anchor: 'start' });

    const y = 150;
    s += panel(122, 128, 96, 44, { kind: 'hi' });
    s += bond(P(6, y), P(40, y), { rFrom: 0, rTo: 16 });
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 52;
      s += atom(x, y, 'CH₂', { r: 16 });
      if (i < 5) s += bond(P(x, y), P(x + 52, y), { rFrom: 16, rTo: 16 });
    }
    s += bond(P(300, y), P(334, y), { rFrom: 16, rTo: 0 });
    s += tag(170, 192, 'one repeat unit: CH₂–CH₂');
    s += rule(20, 208, 320, 208);

    const yb = 250;
    s += bond(P(90, yb), P(140, yb), { rFrom: 0, rTo: 16 });
    s += brack(108, yb, 50, 1);
    s += atom(140, yb, 'CH₂', { r: 16 });
    s += atom(196, yb, 'CH₂', { r: 16 });
    s += bond(P(140, yb), P(196, yb), { rFrom: 16, rTo: 16 });
    s += bond(P(196, yb), P(246, yb), { rFrom: 16, rTo: 0 });
    s += brack(228, yb, 50, -1);
    s += text(236, yb + 30, 'n', { cls: 'fg-lbl', anchor: 'start' });
    s += tag(170, 298, 'n = the degree of polymerization,');
    s += tag(170, 316, 'the number of monomer units in one chain');
    return s;
  },
  caption: 'Top: three monomers. Middle: the chain they become, with one repeat unit shaded. Bottom: the same chain in bracket notation, where the bond through each bracket means the chain carries on at both ends.',
});

/* ------------------------------------------------------------------------
   The count that decides the material: one site, two sites, three sites,
   each drawn as a monomer with its sites and then as what those monomers
   build. Stacked, so the same drawing serves the notes and the lesson. */
FIGURES.push({
  id: 'sites-decide',
  section: 'polymer-basics',
  lessons: ['polymer-basics'],
  anchor: 'Count the sites on each monomer: one site ends the growth, two build a chain, three or more build a network.</p>',
  viewBox: '0 0 340 372',
  alt: 'Three rows. A monomer with one reactive site pairs with one other monomer and stops. A monomer with two sites links into a zigzag chain. A monomer with three sites links into a honeycomb network that continues in every direction',
  build() {
    let s = '';
    const row = (k, n, title, out, good) => {
      const y0 = 8 + k * 122, gy = y0 + 58;
      s += tag(18, y0 + 14, title, { anchor: 'start' });
      /* the monomer, with its reactive sites as shaded dots */
      const dirs = n === 1 ? [0] : n === 2 ? [0, 180] : [90, 210, 330];
      for (const d of dirs) {
        const a = (d * Math.PI) / 180;
        const ex = 52 + Math.cos(a) * 30, ey = gy - Math.sin(a) * 30;
        s += bond(P(52, gy), P(ex, ey), { rFrom: 13, rTo: 5 });
        s += `<circle class="fg-fill-hi" cx="${ex.toFixed(2)}" cy="${ey.toFixed(2)}" r="5.5"></circle>`;
      }
      s += atom(52, gy, 'M', { r: 13 });
      s += arrow(P(98, gy), P(132, gy), { muted: true });
      s += text(18, y0 + 112, out, { cls: good ? 'fg-tag-good' : 'fg-tag', anchor: 'start' });
      if (k < 2) s += rule(14, y0 + 122, 326, y0 + 122);
      return gy;
    };

    /* one site: two monomers pair up, and nothing is left to react */
    let gy = row(0, 1, 'one reactive site', 'a small molecule: growth stops', false);
    s += unit(200, gy, 7) + unit(236, gy, 7) + link(P(200, gy), P(236, gy), 7);

    /* two sites: a chain */
    gy = row(1, 2, 'two reactive sites', 'a chain: a thermoplastic', true);
    const chain = Array.from({ length: 7 }, (_, i) => P(156 + i * 26, gy + (i % 2 ? -12 : 12)));
    s += bond(P(142, gy + 2), chain[0], { rFrom: 0, rTo: 7 });
    chain.forEach((p, i) => { if (i < 6) s += link(p, chain[i + 1], 7); });
    s += bond(chain[6], P(chain[6].x + 16, chain[6].y + 10), { rFrom: 7, rTo: 0 });
    chain.forEach((p) => { s += unit(p.x, p.y, 7); });

    /* three or more: a honeycomb network, loose ends continuing outward */
    gy = row(2, 3, 'three or more sites', 'a network: a thermoset', true);
    const cy = gy - 22, R = 22, w = 19;
    const hexes = [P(222, cy), P(260, cy), P(241, cy + 33)];
    const key = (p) => `${Math.round(p.x)},${Math.round(p.y)}`;
    const nodes = new Map(), edges = new Map();
    for (const h of hexes) {
      const v = [P(h.x, h.y - R), P(h.x + w, h.y - R / 2), P(h.x + w, h.y + R / 2),
                 P(h.x, h.y + R), P(h.x - w, h.y + R / 2), P(h.x - w, h.y - R / 2)];
      v.forEach((p, i) => {
        nodes.set(key(p), { p, deg: 0, hex: h });
        const q = v[(i + 1) % 6];
        const e = [key(p), key(q)].sort().join('|');
        if (!edges.has(e)) edges.set(e, [p, q]);
      });
    }
    for (const [, [p, q]] of edges) {
      nodes.get(key(p)).deg++; nodes.get(key(q)).deg++;
      s += link(p, q, 6);
    }
    const mid = P(241, cy + 11);
    for (const [, nd] of nodes) {
      if (nd.deg < 3) {
        const dx = nd.p.x - mid.x, dy = nd.p.y - mid.y, L = Math.hypot(dx, dy) || 1;
        s += bond(nd.p, P(nd.p.x + (dx / L) * 14, nd.p.y + (dy / L) * 14), { rFrom: 6, rTo: 0 });
      }
    }
    for (const [, nd] of nodes) s += unit(nd.p.x, nd.p.y, 6);
    return s;
  },
  caption: 'M is one monomer and each shaded dot is one reactive site. On the right, each circle is a monomer that has reacted, and each line is a bond made at a site. The loose lines at the ends show where the chain or network carries on.',
});

/* ------------------------------------------------------------------------
   Addition against condensation, by atom count: propylene opens its pi bond
   and loses nothing; adipic acid and ethylene glycol lose two waters per
   repeat unit, and the atoms that leave are shaded. */
const twoKindsNotes = () => {
  let s = '';
  /* Addition row */
  s += tag(24, 26, 'ADDITION: PROPYLENE', { anchor: 'start' });
  const y1 = 70;
  s += atom(60, y1, 'CH₂', { r: 16 });
  s += atom(124, y1, 'CH', { r: 15 });
  s += atom(188, y1, 'CH₃', { r: 16 });
  s += bond(P(60, y1), P(124, y1), { order: 2, rFrom: 16, rTo: 15 });
  s += bond(P(124, y1), P(188, y1), { rFrom: 15, rTo: 16 });
  s += arrow(P(230, y1), P(300, y1), { muted: true });
  s += tag(265, y1 + 24, 'π bond opens');
  s += bond(P(328, y1), P(376, y1), { rFrom: 0, rTo: 16 });
  s += brack(346, y1, 50, 1);
  s += atom(376, y1, 'CH₂', { r: 16 });
  s += atom(440, y1, 'CH', { r: 15 });
  s += atom(440, y1 + 48, 'CH₃', { r: 16 });
  s += bond(P(376, y1), P(440, y1), { rFrom: 16, rTo: 15 });
  s += bond(P(440, y1), P(440, y1 + 48), { rFrom: 15, rTo: 16 });
  s += bond(P(440, y1), P(500, y1), { rFrom: 15, rTo: 0 });
  s += brack(482, y1, 50, -1);
  s += text(490, y1 + 30, 'n', { cls: 'fg-lbl', anchor: 'start' });
  s += tag(640, y1 - 6, 'polypropylene', { cls: 'fg-tag-good' });
  s += tag(640, y1 + 14, 'C₃H₆ in, C₃H₆ out');
  s += rule(20, 142, 740, 142);

  /* Condensation: the two monomers, with the atoms that leave shaded */
  s += tag(24, 168, 'CONDENSATION: ADIPIC ACID + ETHYLENE GLYCOL', { anchor: 'start' });
  const y2 = 234;
  s += atom(50, y2, 'HO', { kind: 'warn', r: 16 });
  s += carbonyl(106, y2);
  s += atom(174, y2, '(CH₂)₄', { r: 27 });
  s += carbonyl(242, y2);
  s += atom(298, y2, 'OH', { kind: 'warn', r: 16 });
  s += bond(P(50, y2), P(106, y2), { rFrom: 16, rTo: 13 });
  s += bond(P(106, y2), P(174, y2), { rFrom: 13, rTo: 27 });
  s += bond(P(174, y2), P(242, y2), { rFrom: 27, rTo: 13 });
  s += bond(P(242, y2), P(298, y2), { rFrom: 13, rTo: 16 });
  s += text(344, y2 + 5, '+', { cls: 'fg-lbl' });
  s += atom(384, y2, 'H', { kind: 'warn', r: 13 });
  s += atom(428, y2, 'O', { r: 13 });
  s += atom(496, y2, 'CH₂CH₂', { r: 28 });
  s += atom(564, y2, 'O', { r: 13 });
  s += atom(608, y2, 'H', { kind: 'warn', r: 13 });
  s += bond(P(384, y2), P(428, y2), { rFrom: 13, rTo: 13 });
  s += bond(P(428, y2), P(496, y2), { rFrom: 13, rTo: 28 });
  s += bond(P(496, y2), P(564, y2), { rFrom: 28, rTo: 13 });
  s += bond(P(564, y2), P(608, y2), { rFrom: 13, rTo: 13 });
  s += tag(686, y2 - 6, 'C₆H₁₀O₄ + C₂H₆O₂', { });
  s += tag(686, y2 + 14, '= C₈H₁₆O₆');

  /* Condensation: the repeat unit, with the two new ester bonds shaded */
  const y3 = 340;
  s += arrow(P(30, y3), P(96, y3), { muted: true });
  s += tag(63, y3 - 14, '− 2 H₂O', { cls: 'fg-tag-warn' });
  s += bond(P(118, y3), P(160, y3), { rFrom: 0, rTo: 13 });
  s += brack(136, y3, 50, 1);
  s += atom(160, y3, 'O', { r: 13 });
  s += atom(228, y3, 'CH₂CH₂', { r: 28 });
  s += atom(296, y3, 'O', { r: 13 });
  s += carbonyl(350, y3);
  s += atom(418, y3, '(CH₂)₄', { r: 27 });
  s += carbonyl(486, y3);
  s += bond(P(160, y3), P(228, y3), { rFrom: 13, rTo: 28 });
  s += bond(P(228, y3), P(296, y3), { rFrom: 28, rTo: 13 });
  s += bond(P(296, y3), P(350, y3), { rFrom: 13, rTo: 13, cls: 'fg-bond-hi' });
  s += bond(P(350, y3), P(418, y3), { rFrom: 13, rTo: 27 });
  s += bond(P(418, y3), P(486, y3), { rFrom: 27, rTo: 13 });
  s += bond(P(486, y3), P(538, y3), { rFrom: 13, rTo: 0, cls: 'fg-bond-hi' });
  s += brack(520, y3, 50, -1);
  s += text(528, y3 + 30, 'n', { cls: 'fg-lbl', anchor: 'start' });
  s += tag(650, y3 - 6, 'a polyester', { cls: 'fg-tag-good' });
  s += tag(650, y3 + 14, 'C₈H₁₂O₄');
  s += tag(380, 392, 'the shaded bonds are the two new ester links, one made per water lost');
  return s;
};

FIGURES.push({
  id: 'two-kinds',
  section: 'polymer-basics',
  anchor: '<h3>Two ways to build a chain</h3>',
  viewBox: '0 0 760 404',
  alt: 'Propylene, CH2=CH–CH3, becoming the bracketed repeat unit CH2–CH(CH3) with the same formula, C3H6. Below, adipic acid and ethylene glycol, with the acid OH groups and the alcohol H atoms shaded, becoming the bracketed polyester repeat unit O–CH2CH2–O–C(=O)–(CH2)4–C(=O) after losing two waters',
  build: twoKindsNotes,
  caption: 'Shaded atoms are the ones that leave: an OH from each acid end and an H from each alcohol end. The formulas on the right are the totals for each line.',
});

FIGURES.push({
  id: 'l-two-kinds',
  lessons: ['polymer-basics'],
  anchor: '',
  viewBox: '0 0 340 568',
  alt: 'Propylene becoming the polypropylene repeat unit with nothing lost, then adipic acid and ethylene glycol, with the atoms that leave shaded, becoming the polyester repeat unit after losing two waters',
  build() {
    let s = '';
    s += tag(170, 18, 'ADDITION: nothing is lost');
    const y1 = 50;
    s += atom(90, y1, 'CH₂', { r: 16 });
    s += atom(150, y1, 'CH', { r: 15 });
    s += atom(210, y1, 'CH₃', { r: 16 });
    s += bond(P(90, y1), P(150, y1), { order: 2, rFrom: 16, rTo: 15 });
    s += bond(P(150, y1), P(210, y1), { rFrom: 15, rTo: 16 });
    s += arrow(P(150, 72), P(150, 104), { muted: true });
    s += tag(162, 93, 'π bond opens', { anchor: 'start' });
    const y2 = 130;
    s += bond(P(80, y2), P(130, y2), { rFrom: 0, rTo: 16 });
    s += brack(100, y2, 50, 1);
    s += atom(130, y2, 'CH₂', { r: 16 });
    s += atom(190, y2, 'CH', { r: 15 });
    s += atom(190, y2 + 44, 'CH₃', { r: 16 });
    s += bond(P(130, y2), P(190, y2), { rFrom: 16, rTo: 15 });
    s += bond(P(190, y2), P(190, y2 + 44), { rFrom: 15, rTo: 16 });
    s += bond(P(190, y2), P(242, y2), { rFrom: 15, rTo: 0 });
    s += brack(226, y2, 50, -1);
    s += text(234, y2 + 30, 'n', { cls: 'fg-lbl', anchor: 'start' });
    s += tag(170, 206, 'C₃H₆ in, C₃H₆ out', { cls: 'fg-tag-good' });
    s += rule(14, 220, 326, 220);

    s += tag(170, 240, 'CONDENSATION: water leaves');
    const y3 = 296;
    s += atom(34, y3, 'HO', { kind: 'warn', r: 16 });
    s += carbonyl(86, y3, { up: 34 });
    s += atom(154, y3, '(CH₂)₄', { r: 27 });
    s += carbonyl(222, y3, { up: 34 });
    s += atom(274, y3, 'OH', { kind: 'warn', r: 16 });
    s += bond(P(34, y3), P(86, y3), { rFrom: 16, rTo: 13 });
    s += bond(P(86, y3), P(154, y3), { rFrom: 13, rTo: 27 });
    s += bond(P(154, y3), P(222, y3), { rFrom: 27, rTo: 13 });
    s += bond(P(222, y3), P(274, y3), { rFrom: 13, rTo: 16 });
    s += text(154, 346, '+', { cls: 'fg-lbl' });
    const y4 = 384;
    s += atom(66, y4, 'H', { kind: 'warn', r: 13 });
    s += atom(106, y4, 'O', { r: 13 });
    s += atom(170, y4, 'CH₂CH₂', { r: 28 });
    s += atom(234, y4, 'O', { r: 13 });
    s += atom(274, y4, 'H', { kind: 'warn', r: 13 });
    s += bond(P(66, y4), P(106, y4), { rFrom: 13, rTo: 13 });
    s += bond(P(106, y4), P(170, y4), { rFrom: 13, rTo: 28 });
    s += bond(P(170, y4), P(234, y4), { rFrom: 28, rTo: 13 });
    s += bond(P(234, y4), P(274, y4), { rFrom: 13, rTo: 13 });
    s += arrow(P(150, 422), P(150, 456), { muted: true });
    s += tag(162, 444, '− 2 H₂O', { cls: 'fg-tag-warn', anchor: 'start' });

    const y5 = 508;
    s += bond(P(10, y5), P(40, y5), { rFrom: 0, rTo: 12 });
    s += brack(20, y5, 50, 1);
    s += atom(40, y5, 'O', { r: 12 });
    s += atom(90, y5, 'CH₂CH₂', { r: 27 });
    s += atom(140, y5, 'O', { r: 12 });
    s += carbonyl(174, y5, { up: 34 });
    s += atom(226, y5, '(CH₂)₄', { r: 27 });
    s += carbonyl(278, y5, { up: 34 });
    s += bond(P(40, y5), P(90, y5), { rFrom: 12, rTo: 27 });
    s += bond(P(90, y5), P(140, y5), { rFrom: 27, rTo: 12 });
    s += bond(P(140, y5), P(174, y5), { rFrom: 12, rTo: 13, cls: 'fg-bond-hi' });
    s += bond(P(174, y5), P(226, y5), { rFrom: 13, rTo: 27 });
    s += bond(P(226, y5), P(278, y5), { rFrom: 27, rTo: 13 });
    s += bond(P(278, y5), P(320, y5), { rFrom: 13, rTo: 0, cls: 'fg-bond-hi' });
    s += brack(304, y5, 50, -1);
    s += text(310, y5 + 30, 'n', { cls: 'fg-lbl', anchor: 'start' });
    s += tag(160, 558, 'C₈H₁₂O₄: two H₂O lighter', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The shaded OH and H atoms are the ones that leave as water. The shaded bonds are the new ester links.',
});

/* ------------------------------------------------------------------------
   Caprolactam: a seven-membered cyclic amide whose ring C–N bond opens, so
   the chain it builds has exactly the ring's formula. */
FIGURES.push({
  id: 'caprolactam-opening',
  section: 'polymer-basics',
  lessons: ['polymer-basics'],
  anchor: 'Yet the chain is a polyamide, nylon 6, with the same amide links as a condensation polymer.</p>',
  viewBox: '0 0 340 316',
  alt: 'Caprolactam drawn as a seven-membered ring of six carbons and an NH, with a C=O next to the nitrogen and the ring C–N bond shaded; an arrow leads to the nylon 6 repeat unit NH–(CH2)5–C(=O) in brackets, where the shaded C–N bond now joins one unit to the next',
  build() {
    let s = '';
    const c = P(92, 100);
    const v = polyPts(c.x, c.y, 7, 42, 90);
    /* v[0] is the carbonyl carbon, v[1] the nitrogen */
    s += bond(v[0], v[1], { rFrom: 0, rTo: 14, cls: 'fg-bond-hi' });
    for (let i = 1; i < 7; i++) {
      const a = v[i], b = v[(i + 1) % 7];
      s += bond(a, b, { rFrom: i === 1 ? 14 : 0, rTo: 0 });
    }
    s += bond(v[0], P(v[0].x, v[0].y - 32), { order: 2, rFrom: 0, rTo: 13 });
    s += atom(v[0].x, v[0].y - 32, 'O', { r: 13 });
    s += atom(v[1].x, v[1].y, 'NH', { r: 14 });
    s += tag(156, 74, 'caprolactam, C₆H₁₁NO', { anchor: 'start' });
    s += tag(156, 94, 'the shaded C–N bond', { anchor: 'start', cls: 'fg-tag-good' });
    s += tag(156, 112, 'of the ring opens', { anchor: 'start', cls: 'fg-tag-good' });

    s += arrow(P(170, 160), P(170, 196), { muted: true });

    const y = 250;
    s += bond(P(22, y), P(70, y), { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' });
    s += brack(40, y, 50, 1);
    s += atom(70, y, 'NH', { r: 16 });
    s += atom(146, y, '(CH₂)₅', { r: 27 });
    s += carbonyl(222, y, { up: 34 });
    s += bond(P(70, y), P(146, y), { rFrom: 16, rTo: 27 });
    s += bond(P(146, y), P(222, y), { rFrom: 27, rTo: 13 });
    s += bond(P(222, y), P(272, y), { rFrom: 13, rTo: 0, cls: 'fg-bond-hi' });
    s += brack(254, y, 50, -1);
    s += text(262, y + 30, 'n', { cls: 'fg-lbl', anchor: 'start' });
    s += tag(170, 294, 'nylon 6 repeat unit, C₆H₁₁NO');
    s += tag(170, 312, 'same atoms: nothing is lost', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'In the chain, the shaded bond on each side of the bracket is the amide C–N bond that links one opened ring to the next.',
});

/* ------------------------------------------------------------------------
   The three kinds of chain end, each drawn adding one monomer: a radical
   with fishhooks, then the two ionic ends with full-headed arrows. */
FIGURES.push({
  id: 'chain-ends',
  section: 'polymer-basics',
  anchor: 'giving a block copolymer',
  viewBox: '0 0 760 570',
  alt: 'Three propagation steps. A radical chain end adds to ethylene, drawn with three single-barbed fishhook arrows, giving a chain two carbons longer with the radical at its new end. A tertiary carbocation chain end is attacked by the double bond of isobutylene, giving a new tertiary cation. A carbanion next to a nitrile adds to acrylonitrile, giving a new carbanion next to a nitrile',
  build() {
    let s = '';
    const head2 = (y, a, b) => {
      s += tag(48, y - 48, a, { anchor: 'start' });
      s += tag(48, y - 30, b, { anchor: 'start', cls: 'fg-tag-mut' });
    };

    /* 1. Radical: the chain end carries one unpaired electron. */
    const y0 = 104;
    head2(y0, 'RADICAL: THE END HAS ONE UNPAIRED ELECTRON', 'ethylene');
    s += atom(88, y0, '~CH₂', { r: 23, size: 9 });
    s += atom(160, y0, 'CH₂', { r: 18, kind: 'warn' });
    s += bond(P(88, y0), P(160, y0), { rFrom: 23, rTo: 18 });
    s += dot(170, y0 - 26);
    s += text(206, y0 + 5, '+', { cls: 'fg-lbl' });
    s += atom(250, y0, 'CH₂', { r: 18 });
    s += atom(322, y0, 'CH₂', { r: 18 });
    s += bond(P(250, y0), P(322, y0), { order: 2, rFrom: 18, rTo: 18 });
    s += fishhook(P(176, y0 - 28), P(204, y0 - 10), { bow: -14 });
    s += fishhook(P(280, y0 - 8), P(212, y0 - 12), { bow: 18 });
    s += fishhook(P(292, y0 - 8), P(318, y0 - 24), { bow: -12 });
    s += arrow(P(372, y0), P(432, y0), { muted: true });
    s += atom(482, y0, '~CH₂', { r: 23, size: 9 });
    s += atom(550, y0, 'CH₂', { r: 18 });
    s += atom(616, y0, 'CH₂', { r: 18 });
    s += atom(682, y0, 'CH₂', { r: 18, kind: 'warn' });
    s += bond(P(482, y0), P(550, y0), { rFrom: 23, rTo: 18 });
    s += bond(P(550, y0), P(616, y0), { rFrom: 18, rTo: 18 });
    s += bond(P(616, y0), P(682, y0), { rFrom: 18, rTo: 18 });
    s += dot(692, y0 - 26);
    s += text(380, y0 + 52, 'one π electron pairs with the radical to form the new C–C bond; the other becomes the new radical', { cls: 'fg-tag' });
    s += rule(40, y0 + 76, 720, y0 + 76);

    /* 2. Cationic: the chain end is a tertiary carbocation. */
    const y1 = 284;
    head2(y1, 'CATIONIC: THE END IS A CARBOCATION', 'isobutylene');
    s += atom(88, y1, '~CH₂', { r: 23, size: 9 });
    s += atom(160, y1, 'C(CH₃)₂', { r: 32, size: 9, kind: 'warn' });
    s += bond(P(88, y1), P(160, y1), { rFrom: 23, rTo: 32 });
    s += text(186, y1 - 32, '+', { cls: 'fg-tag-warn' });
    s += text(218, y1 + 5, '+', { cls: 'fg-lbl' });
    s += atom(256, y1, 'CH₂', { r: 18 });
    s += atom(330, y1, 'C(CH₃)₂', { r: 32, size: 9 });
    s += bond(P(256, y1), P(330, y1), { order: 2, rFrom: 18, rTo: 32 });
    s += curve(P(293, y1 - 20), P(192, y1 - 18), { bow: -16 });
    s += arrow(P(388, y1), P(448, y1), { muted: true });
    s += atom(492, y1, '~CH₂', { r: 23, size: 9 });
    s += atom(564, y1, 'C(CH₃)₂', { r: 32, size: 9 });
    s += atom(632, y1, 'CH₂', { r: 18 });
    s += atom(704, y1, 'C(CH₃)₂', { r: 32, size: 9, kind: 'warn' });
    s += bond(P(492, y1), P(564, y1), { rFrom: 23, rTo: 32 });
    s += bond(P(564, y1), P(632, y1), { rFrom: 32, rTo: 18 });
    s += bond(P(632, y1), P(704, y1), { rFrom: 18, rTo: 32 });
    s += text(730, y1 - 32, '+', { cls: 'fg-tag-warn' });
    s += text(380, y1 + 52, 'the π bond attacks the cation, and the new cation is tertiary again, stabilized by two methyls', { cls: 'fg-tag' });
    s += rule(40, y1 + 76, 720, y1 + 76);

    /* 3. Anionic: the chain end is a carbanion the nitrile can hold. */
    const y2 = 464;
    head2(y2, 'ANIONIC: THE END IS A CARBANION', 'acrylonitrile');
    s += atom(88, y2, '~CH₂', { r: 23, size: 9 });
    s += atom(154, y2, 'CHCN', { r: 25, size: 9, kind: 'warn' });
    s += bond(P(88, y2), P(154, y2), { rFrom: 23, rTo: 25 });
    s += text(180, y2 + 34, '−', { cls: 'fg-tag-warn' });
    s += lonePair(154, y2, 300, { dist: 30 });
    s += text(206, y2 + 5, '+', { cls: 'fg-lbl' });
    s += atom(244, y2, 'CH₂', { r: 18 });
    s += atom(312, y2, 'CHCN', { r: 25, size: 9 });
    s += bond(P(244, y2), P(312, y2), { order: 2, rFrom: 18, rTo: 25 });
    s += curve(P(172, y2 - 16), P(238, y2 - 20), { bow: -14 });
    s += curve(P(278, y2 - 18), P(306, y2 - 28), { bow: -10 });
    s += arrow(P(378, y2), P(438, y2), { muted: true });
    s += atom(482, y2, '~CH₂', { r: 23, size: 9 });
    s += atom(548, y2, 'CHCN', { r: 25, size: 9 });
    s += atom(614, y2, 'CH₂', { r: 18 });
    s += atom(680, y2, 'CHCN', { r: 25, size: 9, kind: 'warn' });
    s += bond(P(482, y2), P(548, y2), { rFrom: 23, rTo: 25 });
    s += bond(P(548, y2), P(614, y2), { rFrom: 25, rTo: 18 });
    s += bond(P(614, y2), P(680, y2), { rFrom: 18, rTo: 25 });
    s += text(704, y2 - 30, '−', { cls: 'fg-tag-warn' });
    s += text(380, y2 + 52, 'the carbanion adds to the CH₂ end, so the new charge sits next to the nitrile that spreads it out', { cls: 'fg-tag' });
    s += rule(40, y2 + 70, 720, y2 + 70);
    s += text(380, y2 + 94, 'In every row the new active end is the same kind of species as the old one.', { cls: 'fg-tag' });
    return s;
  },
  caption: 'One propagation step for each kind of chain end. ~CH₂ stands for the rest of the chain, and the shaded atom is the active end. A fishhook arrow (one barb) moves one electron; a full arrowhead moves a pair.',
});

/* ------------------------------------------------------------------------
   Head-to-tail: a growing PVC radical meets vinyl chloride. Adding to the
   CH2 (tail) end leaves a secondary radical on the CHCl carbon; adding the
   other way round would leave a primary radical. */
FIGURES.push({
  id: 'head-to-tail',
  section: 'polymer-basics',
  anchor: 'This is <b>head-to-tail</b> linking.</p>',
  viewBox: '0 0 760 470',
  alt: 'A growing chain ending in a CHCl radical meets vinyl chloride, CH2=CHCl, whose CH2 end is labeled tail and CHCl end head. Adding to the tail puts the new radical on a CHCl carbon, a secondary radical; adding to the head would put it on a CH2, a primary radical. Below, the resulting chain has a chlorine on every other carbon',
  build() {
    let s = '';
    const cl = (x, y) => atom(x, y + 46, 'Cl', { r: 14 }) + bond(P(x, y), P(x, y + 46), { rFrom: 15, rTo: 14 });

    /* the chain end and the monomer */
    const y = 150;
    s += atom(56, y, '~CH₂', { r: 23, size: 9 });
    s += atom(124, y, 'CH', { r: 15, kind: 'warn' });
    s += bond(P(56, y), P(124, y), { rFrom: 23, rTo: 15 });
    s += cl(124, y);
    s += dot(124, y - 26);
    s += text(164, y + 5, '+', { cls: 'fg-lbl' });
    s += atom(204, y, 'CH₂', { r: 16 });
    s += atom(266, y, 'CH', { r: 15 });
    s += bond(P(204, y), P(266, y), { order: 2, rFrom: 16, rTo: 15 });
    s += cl(266, y);
    s += tag(204, y - 30, 'tail');
    s += tag(266, y - 30, 'head');

    s += arrow(P(304, y - 14), P(356, 92), { muted: true });
    s += arrow(P(304, y + 14), P(356, 224), { muted: true });

    /* adds to the tail: the radical lands on the CHCl carbon */
    const ya = 62;
    s += atom(404, ya, '~CH₂', { r: 23, size: 9 });
    s += atom(468, ya, 'CH', { r: 15 });
    s += atom(530, ya, 'CH₂', { r: 16 });
    s += atom(592, ya, 'CH', { r: 15, kind: 'warn' });
    s += bond(P(404, ya), P(468, ya), { rFrom: 23, rTo: 15 });
    s += bond(P(468, ya), P(530, ya), { rFrom: 15, rTo: 16 });
    s += bond(P(530, ya), P(592, ya), { rFrom: 16, rTo: 15 });
    s += cl(468, ya) + cl(592, ya);
    s += dot(592, ya - 26);
    s += text(636, ya + 4, 'secondary radical', { cls: 'fg-tag-good', anchor: 'start' });
    s += text(636, ya + 22, 'formed', { cls: 'fg-tag-good', anchor: 'start' });

    /* adds to the head: the radical would land on a CH2 */
    const yb = 222;
    s += atom(404, yb, '~CH₂', { r: 23, size: 9 });
    s += atom(468, yb, 'CH', { r: 15 });
    s += atom(530, yb, 'CH', { r: 15 });
    s += atom(592, yb, 'CH₂', { r: 16, kind: 'warn' });
    s += bond(P(404, yb), P(468, yb), { rFrom: 23, rTo: 15 });
    s += bond(P(468, yb), P(530, yb), { rFrom: 15, rTo: 15 });
    s += bond(P(530, yb), P(592, yb), { rFrom: 15, rTo: 16 });
    s += cl(468, yb) + cl(530, yb);
    s += dot(592, yb - 26);
    s += text(636, yb + 4, 'primary radical', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(636, yb + 22, 'not formed', { cls: 'fg-tag-warn', anchor: 'start' });
    s += rule(24, 318, 736, 318);

    /* the chain that results */
    const yc = 362;
    s += bond(P(70, yc), P(110, yc), { rFrom: 0, rTo: 16 });
    for (let i = 0; i < 8; i++) {
      const x = 110 + i * 64;
      if (i % 2) { s += atom(x, yc, 'CH', { r: 15 }); s += cl(x, yc); }
      else s += atom(x, yc, 'CH₂', { r: 16 });
      if (i < 7) s += bond(P(x, yc), P(x + 64, yc), { rFrom: i % 2 ? 15 : 16, rTo: i % 2 ? 16 : 15 });
    }
    s += bond(P(558, yc), P(598, yc), { rFrom: 15, rTo: 0 });
    s += text(606, yc + 4, 'poly(vinyl chloride)', { cls: 'fg-tag-good', anchor: 'start' });
    s += tag(380, 458, 'head-to-tail: a chlorine on every other carbon of the chain');
    return s;
  },
  caption: 'Top: the two ways the radical could add; the shaded atom carries the unpaired electron. Bottom: the chain after many tail-first additions.',
});

/* ------------------------------------------------------------------------
   The two flasks halfway through: chain-growth has a few long chains and a
   lot of untouched monomer; step-growth has the same 48 units as 24 short
   pieces. */
FIGURES.push({
  id: 'growth-snapshot',
  section: 'polymer-basics',
  lessons: ['polymer-basics'],
  anchor: 'Halfway through, the flask holds dimers, trimers and other short pieces, and almost no long chains.</p>',
  viewBox: '0 0 340 336',
  alt: 'Two panels of 48 monomer units each, halfway through reaction. The chain-growth panel has two long chains of twelve units and twenty-four separate monomers. The step-growth panel has twenty-four short pieces of one to four units and no long chains',
  build() {
    let s = '';
    /* chain-growth panel */
    s += tag(170, 24, 'chain-growth, halfway through');
    s += panel(10, 34, 320, 112);
    for (const cy of [56, 128]) {
      const pts = Array.from({ length: 12 }, (_, i) => P(34 + i * 25, cy + (i % 2 ? -5 : 5)));
      pts.forEach((p, i) => { if (i < 11) s += link(p, pts[i + 1]); });
      pts.forEach((p) => { s += unit(p.x, p.y); });
    }
    for (const ry of [82, 104]) {
      for (let i = 0; i < 12; i++) s += unit(34 + i * 25 + (ry === 104 ? 8 : 0), ry);
    }
    s += tag(170, 164, 'two long chains, 24 monomers untouched');

    /* step-growth panel */
    s += tag(170, 194, 'step-growth, halfway through');
    s += panel(10, 204, 320, 112);
    const sizes = [2, 1, 3, 2, 4, 1,  1, 2, 2, 3, 1, 2,  3, 1, 2, 4, 1, 3,  2, 1, 3, 2, 1, 1];
    sizes.forEach((n, k) => {
      const col = k % 6, rowi = Math.floor(k / 6);
      const cx = 36 + col * 53, cy = 222 + rowi * 25;
      const x0 = cx - ((n - 1) * 11) / 2;
      const pts = Array.from({ length: n }, (_, i) => P(x0 + i * 11, cy + (i % 2 ? -4 : 4)));
      pts.forEach((p, i) => { if (i < n - 1) s += link(p, pts[i + 1], 4); });
      pts.forEach((p) => { s += unit(p.x, p.y, 4); });
    });
    s += tag(170, 334, 'the same 48 units as 24 short pieces');
    return s;
  },
  caption: 'Each circle is one monomer unit, and both flasks hold 48. In each, half of the reactive groups have been used.',
});

/* ------------------------------------------------------------------------
   Linear chains pack; branched chains are held apart. */
FIGURES.push({
  id: 'two-polyethylenes',
  section: 'polymer-basics',
  lessons: ['polymer-basics'],
  anchor: 'Branches hold the chains apart, so LDPE is less dense and more flexible.</p>',
  viewBox: '0 0 340 330',
  alt: 'Top panel: four straight zigzag chains lying close together, labeled HDPE, dense and rigid. Bottom panel: three zigzag chains with short side branches, spaced further apart, labeled LDPE, less dense and flexible',
  build() {
    let s = '';
    const chain = (x0, y, n, branches = []) => {
      let t = '';
      const pts = Array.from({ length: n + 1 }, (_, i) => P(x0 + i * 15, y + (i % 2 ? -5 : 5)));
      pts.forEach((p, i) => { if (i < n) t += sk(p, pts[i + 1]); });
      for (const bi of branches) {
        const p = pts[bi], up = bi % 2 ? -1 : 1;
        const a = P(p.x + 7, p.y + up * 11), b = P(p.x + 18, p.y + up * 14);
        t += sk(p, a) + sk(a, b);
      }
      return t;
    };
    s += tag(170, 22, 'HDPE: linear chains');
    s += panel(10, 32, 320, 96);
    for (let r = 0; r < 4; r++) s += chain(28, 52 + r * 18, 19);
    s += tag(170, 146, 'chains pack closely: dense and rigid', { cls: 'fg-tag-good' });
    s += tag(170, 164, 'milk bottles, pipe');

    s += tag(170, 196, 'LDPE: branched chains');
    s += panel(10, 206, 320, 96);
    s += chain(28, 224, 19, [6, 14]);
    s += chain(28, 255, 19, [9]);
    s += chain(28, 286, 19, [3, 15]);
    s += tag(170, 320, 'branches hold chains apart: less dense, flexible');
    return s;
  },
  caption: 'Both are –[CH₂–CH₂]–ₙ, drawn here as skeletal zigzags. Only the branching differs.',
});

export default FIGURES;
