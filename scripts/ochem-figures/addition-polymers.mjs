/* Figures for the addition-polymers notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions:
   - a radical is one dot (fg-lp), and every arrow in a radical step is a
     fishhook: one barb, because it moves one electron;
   - chains are drawn as labeled groups (H₂C, CHX, ~CH₂) in a row, and "~"
     marks where the rest of the chain continues;
   - the monomer is written CH₂=CHX, so X is the substituent throughout;
   - figures shown in the lesson are 340 wide or less and use only fg-lbl and
     fg-tag text. */
import { atom as atom0, bond, wedge, hash, arrow, text, rule, panel, P } from '../lib/ochem-figure.mjs';
import { zig, sk, polyPts, polyRing } from '../lib/ochem-skeletal.mjs';
import { skDouble } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const f2 = (v) => Math.round(v * 100) / 100;
const rOf = (l) => { const n = [...String(l)].length; return n >= 4 ? 21 : n === 3 ? 17 : n === 2 ? 14 : 12; };

/* An atom disc that stays opaque in both themes. */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const r = o.r ?? rOf(l);
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}"></circle>` : '';
  return back + atom0(x, y, l, { r, ...o });
}
const G = (p, l, kind) => atom(p.x, p.y, l, { kind });
const B = (a, la, b, lb, o = {}) => bond(a, b, {
  rFrom: la ? rOf(la) : 0, rTo: lb ? rOf(lb) : 0, order: o.order || 1, cls: o.cls, gap: o.gap,
});
const tg = (x, y, s, cls = 'fg-tag', anchor = 'middle') => text(x, y, s, { cls, size: 11, anchor });
const sm = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-sm', size: 10.5, anchor });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });

/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${f2(x)}" cy="${f2(y)}" r="3.4"></circle>`;

/* A fishhook: one barb, because it carries one electron. `curve` in the kit
   draws a full two-barbed head, which in a radical mechanism says the wrong
   thing about how many electrons moved. */
function fishhook(a, b, opts = {}) {
  const bow = opts.bow ?? 30;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
  let ux = b.x - cx, uy = b.y - cy;
  const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const size = opts.size ?? 8;
  const px = -uy, py = ux;
  const side = opts.side ?? 1;
  const bx = b.x - ux * size, by = b.y - uy * size;
  const h = size * 0.6 * side;
  return `<path class="fg-arrow" d="M${f2(a.x)} ${f2(a.y)} Q${f2(cx)} ${f2(cy)} ${f2(bx)} ${f2(by)}"></path>` +
         `<path class="fg-head" d="M${f2(b.x)} ${f2(b.y)} L${f2(bx + px * h)} ${f2(by + py * h)} L${f2(bx)} ${f2(by)} Z"></path>`;
}

/* A square bracket around a repeat unit, drawn across a bond. side 'L' opens
   to the right, 'R' opens to the left; `n` adds the subscript. */
function bracket(x, y, h, side, n) {
  const s = side === 'L' ? 1 : -1;
  let g = `<path class="fg-bond" d="M${f2(x + 6 * s)} ${f2(y - h / 2)} L${f2(x)} ${f2(y - h / 2)} L${f2(x)} ${f2(y + h / 2)} L${f2(x + 6 * s)} ${f2(y + h / 2)}"></path>`;
  if (n) g += lbl(x + 9, y + h / 2 + 4, 'n', 'start');
  return g;
}

/* A dashed circle: an empty place on a metal. */
const site = (x, y, r = 13) => `<circle class="fg-dash" cx="${f2(x)}" cy="${f2(y)}" r="${r}"></circle>`;

/* A row of labeled groups joined by bonds. orders[i] is the bond order
   between groups i and i+1. */
function row(pts, labels, orders = [], kinds = []) {
  let s = '';
  for (let i = 0; i < pts.length - 1; i++) {
    s += B(pts[i], labels[i], pts[i + 1], labels[i + 1], { order: orders[i] || 1 });
  }
  pts.forEach((p, i) => { s += G(p, labels[i], kinds[i]); });
  return s;
}

/* A radical (the last of `lead`) adding to CH₂=CHX: the three fishhooks, the
   reaction arrow, and the product with its radical on the CHX carbon.
   Returns the drawing. Used for the first addition, propagation and the
   restart after chain transfer. */
function addRow(y, lead, x0, gap = 70) {
  let s = '';
  const xs = lead.map((_, i) => x0 + i * gap);
  const pts = xs.map((x) => P(x, y));
  s += row(pts, lead);
  const last = pts[pts.length - 1], rl = rOf(lead[lead.length - 1]);
  s += dot(last.x + rl * 0.72, y - rl * 0.72 - 2);
  const A = P(last.x + 92, y), Bx = P(last.x + 164, y);
  s += row([A, Bx], ['H₂C', 'CHX'], [2]);
  const mid = (last.x + rl + A.x - 17) / 2;
  s += fishhook(P(last.x + rl * 0.72 + 4, y - rl * 0.72 - 4), P(mid - 3, y - 8), { bow: -9 });
  const pm = (A.x + Bx.x) / 2;
  s += fishhook(P(pm - 5, y - 8), P(mid + 4, y - 9), { bow: 15 });
  s += fishhook(P(pm + 5, y - 8), P(Bx.x - 11, y - 16), { bow: -8 });
  const a0 = Bx.x + 36;
  s += arrow(P(a0, y), P(a0 + 52, y), { muted: true });
  const labs = [...lead, 'CH₂', 'CHX'];
  const px0 = a0 + 52 + 38;
  const ppts = labs.map((_, i) => P(px0 + i * 64, y));
  s += row(ppts, labs);
  const pl = ppts[ppts.length - 1];
  s += dot(pl.x + 13, y - 16);
  return s;
}

/* Row heading at the left: the stage, then how the radical count changes. */
const head2 = (y, a, b) => tg(40, y - 44, a, 'fg-tag', 'start') + sm(40, y - 28, b, 'start');

/* ======================================================================
   1. The chain reaction, drawn stage by stage (notes).
   ====================================================================== */
FIGURES.push({
  id: 'polymer-chain-drawn',
  section: 'addition-polymers',
  anchor: '',
  viewBox: '0 0 760 720',
  alt: 'Five drawn steps of a radical polymerization with single-barbed fishhook arrows. Initiation: a peroxide RO–OR splits into two RO radicals. First addition: an RO radical adds to the CH2 end of CH2=CHX, leaving the radical on the CHX carbon. Propagation: a chain radical adds to the next monomer in the same way. Termination by combination: two chain radicals join into one chain. Termination by disproportionation: one chain radical takes the hydrogen from the carbon next to the other radical carbon, giving one saturated chain end and one chain end with a C=C.',
  build() {
    let s = '';

    /* Initiation: the peroxide splits. */
    let y = 76;
    s += head2(y, 'INITIATION', 'radicals: 0 → 2');
    s += row([P(190, y), P(260, y)], ['RO', 'OR']);
    s += fishhook(P(220, y - 5), P(196, y - 17), { bow: 9 });
    s += fishhook(P(230, y - 5), P(254, y - 17), { bow: -9 });
    s += arrow(P(310, y), P(380, y), { muted: true });
    s += sm(345, y - 10, 'heat');
    s += G(P(420, y), 'RO') + dot(436, y - 13);
    s += lbl(466, y + 5, '+');
    s += G(P(510, y), 'RO') + dot(526, y - 13);
    s += sm(390, y + 42, 'one electron to each oxygen: the weak O–O bond splits evenly');
    s += rule(40, y + 60, 720, y + 60);

    /* First addition. */
    y = 200;
    s += head2(y, 'FIRST ADDITION', 'radicals: 1 → 1');
    s += addRow(y, ['RO'], 170);
    s += sm(390, y + 42, 'the radical ends up on the carbon that carries X');
    s += rule(40, y + 60, 720, y + 60);

    /* Propagation. */
    y = 324;
    s += head2(y, 'PROPAGATION', 'radicals: 1 → 1');
    s += addRow(y, ['~CH₂', 'CHX'], 110, 68);
    s += sm(390, y + 42, 'one unit longer, still one radical at the end: this repeats thousands of times');
    s += rule(40, y + 60, 720, y + 60);

    /* Termination by combination. */
    y = 448;
    s += head2(y, 'COMBINATION', 'radicals: 2 → 0');
    s += row([P(120, y), P(190, y)], ['~CH₂', 'CHX']);
    s += dot(203, y - 14);
    s += row([P(300, y), P(370, y)], ['XHC', 'CH₂~']);
    s += dot(287, y - 14);
    s += fishhook(P(208, y - 16), P(240, y - 6), { bow: -9 });
    s += fishhook(P(282, y - 16), P(250, y - 6), { bow: 9 });
    s += arrow(P(420, y), P(470, y), { muted: true });
    s += row([P(505, y), P(572, y), P(639, y), P(706, y)], ['~CH₂', 'CHX', 'XHC', 'CH₂~']);
    s += sm(390, y + 42, 'the two radical carbons bond: one chain, as long as the two added together');
    s += rule(40, y + 60, 720, y + 60);

    /* Termination by disproportionation. Chain B's radical carbon (XHC) is
       drawn above its neighbor, whose hydrogen is drawn out. */
    y = 630;
    s += head2(y - 40, 'DISPROPORTIONATION', 'radicals: 2 → 0');
    const a1 = P(110, y), a2 = P(180, y);
    s += row([a1, a2], ['~CH₂', 'CHX']);
    s += dot(193, y - 14);
    const H = P(262, y), cb = P(326, y), cr = P(326, y - 62), rest = P(386, y);
    s += B(H, 'H', cb, 'CH') + B(cb, 'CH', cr, 'XHC') + B(cb, 'CH', rest, '~');
    s += G(H, 'H', 'hi') + G(cb, 'CH') + G(cr, 'XHC') + G(rest, '~');
    s += dot(cr.x + 21, cr.y - 6);
    s += fishhook(P(198, y - 16), P(218, y - 7), { bow: -9 });
    s += fishhook(P(292, y - 6), P(226, y - 9), { bow: 18 });
    s += fishhook(P(300, y - 5), P(318, y - 30), { bow: -8 });
    s += fishhook(P(cr.x + 24, cr.y + 2), P(334, y - 30), { bow: -10 });
    s += arrow(P(420, y - 20), P(466, y - 20), { muted: true });
    s += row([P(500, y - 20), P(570, y - 20)], ['~CH₂', 'CH₂X']);
    s += lbl(610, y - 15, '+');
    s += row([P(650, y - 20), P(720, y - 20)], ['XHC', 'CH~'], [2]);
    s += tg(535, y + 18, 'saturated end', 'fg-tag-good');
    s += tg(685, y + 18, 'a C=C at the end', 'fg-tag-good');
    s += sm(390, y + 52, 'the β-hydrogen moves to the first chain; the two leftover electrons form the new π bond');
    return s;
  },
  caption: 'Each stage drawn with fishhooks. Read the left-hand column: initiation makes radicals, the two addition steps keep one, and both kinds of termination remove two.',
});

/* ======================================================================
   2. Chain transfer to a thiol, and the restart (notes).
   ====================================================================== */
FIGURES.push({
  id: 'chain-transfer-drawn',
  section: 'addition-polymers',
  anchor: '',
  viewBox: '0 0 760 280',
  alt: 'Top: a growing chain radical ending in CHX takes the hydrogen from a thiol, RS–H. The chain end becomes CH2X and is finished, and a thiyl radical RS is left. Bottom: the RS radical adds to the CH2 end of a new monomer and starts a new chain. The radical count stays at one throughout.',
  build() {
    let s = '';
    let y = 76;
    s += head2(y, 'TRANSFER', 'radicals: 1 → 1');
    s += row([P(110, y), P(180, y)], ['~CH₂', 'CHX']);
    s += dot(193, y - 14);
    const H = P(250, y), S = P(316, y);
    s += B(H, 'H', S, 'SR') + G(H, 'H', 'hi') + G(S, 'SR');
    s += fishhook(P(198, y - 16), P(222, y - 6), { bow: -9 });
    s += fishhook(P(282, y - 6), P(228, y - 7), { bow: 13 });
    s += fishhook(P(290, y - 6), P(306, y - 16), { bow: -7 });
    s += arrow(P(372, y), P(430, y), { muted: true });
    s += row([P(470, y), P(542, y)], ['~CH₂', 'CH₂X']);
    s += tg(506, y + 36, 'this chain is finished', 'fg-tag-mut');
    s += lbl(590, y + 5, '+');
    s += G(P(630, y), 'RS') + dot(646, y - 13);
    s += tg(630, y + 36, 'a new radical');
    s += rule(40, y + 60, 720, y + 60);

    y = 206;
    s += head2(y, 'RESTART', 'radicals: 1 → 1');
    s += addRow(y, ['RS'], 170);
    s += sm(390, y + 44, 'the thiyl radical adds to a monomer, and a new chain starts');
    return s;
  },
  caption: 'Chain transfer to a thiol. The hydrogen moves, not the chain: one chain stops and RS• starts the next.',
});

/* ======================================================================
   3. Which end the radical adds to (notes and lesson, 340 wide).
   ====================================================================== */
FIGURES.push({
  id: 'head-to-tail-choice',
  section: 'addition-polymers',
  lessons: ['addition-polymers'],
  anchor: '',
  viewBox: '0 0 340 400',
  alt: 'Top: a growing chain radical R meets vinyl chloride, H2C=CHCl. Middle: if R adds to the CH2 end, the new radical sits on the substituted carbon, right beside the chlorine; this radical is more stable, and this is the path taken. Bottom: if R adds to the CHCl end, the new radical sits on a bare CH2 carbon, which is less stable, and R had to attack the more crowded carbon.',
  build() {
    let s = '';
    s += tg(170, 20, 'a chain radical R• meets vinyl chloride');
    const R = P(70, 62), c1 = P(170, 62), c2 = P(240, 62), cl = P(240, 106);
    s += G(R, 'R') + dot(R.x + 11, R.y - 12);
    s += row([c1, c2], ['H₂C', 'CH'], [2]);
    s += B(c2, 'CH', cl, 'Cl') + G(cl, 'Cl');
    s += tg(170, 100, 'end 1', 'fg-tag-mut') + tg(290, 66, 'end 2', 'fg-tag-mut');
    s += rule(20, 128, 320, 128);

    /* Path 1: add to CH₂. */
    s += tg(170, 152, 'R adds to the CH₂ end', 'fg-tag-good');
    let y = 190;
    const p = [P(40, y), P(105, y), P(172, y)];
    s += row(p, ['R', 'CH₂', 'CH']);
    s += dot(p[2].x + 11, y - 13);
    s += B(p[2], 'CH', P(172, y + 44), 'Cl') + G(P(172, y + 44), 'Cl');
    s += tg(262, y - 4, 'radical beside Cl,', 'fg-tag-good');
    s += tg(262, y + 12, 'on the substituted C:', 'fg-tag-good');
    s += tg(262, y + 28, 'more stable', 'fg-tag-good');
    s += rule(20, 256, 320, 256);

    /* Path 2: add to CHCl. */
    s += tg(170, 280, 'R adds to the CHCl end', 'fg-tag-warn');
    y = 318;
    const q = [P(40, y), P(105, y), P(172, y)];
    s += row(q, ['R', 'CH', 'CH₂']);
    s += dot(q[2].x + 13, y - 15);
    s += B(q[1], 'CH', P(105, y + 44), 'Cl') + G(P(105, y + 44), 'Cl');
    s += tg(262, y - 4, 'radical on a bare', 'fg-tag-warn');
    s += tg(262, y + 12, 'CH₂: less stable,', 'fg-tag-warn');
    s += tg(262, y + 28, 'and R hit the', 'fg-tag-warn');
    s += tg(262, y + 44, 'crowded carbon', 'fg-tag-warn');
    return s;
  },
  caption: 'Both paths start the same way. Compare where each one leaves the radical.',
});

/* ======================================================================
   4. Head-to-tail PVC beside a chain with a head-to-head defect (notes and
      lesson, 340 wide).
   ====================================================================== */
function pvcChain(y0, clAt, hiBonds = []) {
  const pts = zig(50, y0, 8, 34, 20);
  let s = '';
  s += bond(P(24, y0 - 12), pts[0], { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
  s += bond(pts[7], P(314, pts[7].y + 12), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
  for (let i = 0; i < 7; i++) s += sk(pts[i], pts[i + 1], hiBonds.includes(i));
  pts.forEach((p, i) => {
    const raised = i % 2 === 1;
    const has = clAt.includes(i);
    if (has) {
      const e = P(p.x, raised ? p.y - 36 : p.y + 36);
      s += bond(p, e, { rFrom: 0, rTo: 12 }) + atom(e.x, e.y, 'Cl', { r: 12 });
    }
    /* The carbon's number sits on the side away from its chlorine. */
    const ny = raised ? p.y + 19 : (has ? p.y - 9 : p.y + 20);
    s += tg(p.x, ny, String(i + 1), 'fg-tag-mut');
  });
  return s;
}
FIGURES.push({
  id: 'pvc-head-to-tail',
  section: 'addition-polymers',
  lessons: ['addition-polymers'],
  anchor: '',
  viewBox: '0 0 340 390',
  alt: 'Two skeletal chains of PVC with the carbons numbered 1 to 8. Top, head-to-tail: chlorines on carbons 2, 4, 6 and 8, never on neighboring carbons. Bottom, with one monomer reversed: chlorines on carbons 2 and 3, side by side, which is a head-to-head join, followed by carbons 4 and 5 with no chlorine, the tail-to-tail join.',
  build() {
    let s = '';
    s += tg(170, 20, 'head-to-tail: Cl on every other carbon', 'fg-tag-good');
    s += pvcChain(110, [1, 3, 5, 7]);
    s += tg(170, 150, 'Cl on 2, 4, 6, 8: never on neighbors');
    s += rule(20, 170, 320, 170);
    s += tg(170, 196, 'one monomer reversed', 'fg-tag-warn');
    s += pvcChain(290, [1, 2, 5, 7], [1, 3]);
    s += tg(170, 356, 'head-to-head: Cl on 2 and 3', 'fg-tag-warn');
    s += tg(170, 374, 'tail-to-tail: no Cl on 4 or 5', 'fg-tag-warn');
    return s;
  },
  caption: 'To find a defect, look for two chlorines on neighboring carbons. The highlighted bonds are the two wrong-way joins.',
});

/* ======================================================================
   5. The monomers worth recognizing, drawn, with their repeat units.
   ====================================================================== */
function sub(c, kind) {
  /* A substituent hanging below the carbon at c (or above, for 'up-CH3'). */
  let s = '';
  if (kind === 'CH3') { const e = P(c.x, c.y + 46); s += B(c, 'C', e, 'CH₃') + G(e, 'CH₃'); }
  if (kind === 'up-CH3') { const e = P(c.x, c.y - 46); s += B(c, 'C', e, 'CH₃') + G(e, 'CH₃'); }
  if (kind === 'Cl') { const e = P(c.x, c.y + 44); s += B(c, 'C', e, 'Cl') + G(e, 'Cl'); }
  if (kind === 'Ph') {
    const ctr = P(c.x, c.y + 50), pts = polyPts(ctr.x, ctr.y, 6, 20, 90);
    s += bond(c, pts[0], { rFrom: 15, rTo: 0 });
    for (let i = 0; i < 6; i++) {
      const a = pts[i], b = pts[(i + 1) % 6];
      s += i % 2 === 1 ? skDouble(a, b, ctr) : sk(a, b);
    }
  }
  if (kind === 'CN') {
    const cc = P(c.x, c.y + 44), nn = P(c.x, c.y + 86);
    s += B(c, 'C', cc, 'C') + bond(cc, nn, { order: 3, rFrom: 12, rTo: 12, gap: 3.4 }) + G(cc, 'C') + G(nn, 'N');
  }
  if (kind === 'ester') {
    const cc = P(c.x, c.y + 46), o1 = P(c.x + 44, c.y + 46), o2 = P(c.x, c.y + 90), me = P(c.x + 56, c.y + 90);
    s += B(c, 'C', cc, 'C') + B(cc, 'C', o1, 'O', { order: 2 }) + B(cc, 'C', o2, 'O') + B(o2, 'O', me, 'CH₃');
    s += G(cc, 'C') + G(o1, 'O', 'warn') + G(o2, 'O', 'warn') + G(me, 'CH₃');
  }
  return s;
}
function cell(x0, y0, title, yc, m1, m2, subs, r1, r2) {
  let s = tg(x0 + 14, y0 + 20, title, 'fg-tag', 'start');
  const y = y0 + yc;
  const a = P(x0 + 34, y), b = P(x0 + 96, y);
  s += row([a, b], [m1, m2], [2]);
  for (const k of subs) s += sub(b, k);
  s += arrow(P(x0 + 132, y), P(x0 + 168, y), { muted: true });
  const c = P(x0 + 222, y), d = P(x0 + 284, y);
  s += bond(P(x0 + 180, y), c, { rFrom: 0, rTo: rOf(r1) });
  s += bond(d, P(x0 + 330, y), { rFrom: rOf(r2), rTo: 0 });
  s += row([c, d], [r1, r2]);
  for (const k of subs) s += sub(d, k);
  s += bracket(x0 + 190, y, 40, 'L') + bracket(x0 + 320, y, 40, 'R', true);
  return s;
}
FIGURES.push({
  id: 'monomer-gallery',
  section: 'addition-polymers',
  anchor: '',
  viewBox: '0 0 760 666',
  alt: 'Seven monomers drawn out, each with an arrow to its repeat unit in brackets. Ethylene gives CH2–CH2. Propylene gives CH2–CH with a methyl. Vinyl chloride gives CH2–CH with Cl. Styrene gives CH2–CH with a benzene ring. Tetrafluoroethylene gives CF2–CF2. Acrylonitrile gives CH2–CH with a C triple bond N group. Methyl methacrylate gives CH2–C carrying a methyl above and a methyl ester, C double bond O and O–CH3, below. Isoprene is a diene and is drawn in the next section.',
  build() {
    let s = '';
    s += `<line class="fg-rule" x1="380" y1="10" x2="380" y2="656"></line>`;
    s += cell(0, 0, 'ethylene → polyethylene', 58, 'H₂C', 'CH₂', [], 'CH₂', 'CH₂');
    s += cell(380, 0, 'propylene → polypropylene', 58, 'H₂C', 'CH', ['CH3'], 'CH₂', 'CH');
    s += rule(20, 136, 740, 136);
    s += cell(0, 140, 'vinyl chloride → PVC', 58, 'H₂C', 'CH', ['Cl'], 'CH₂', 'CH');
    s += cell(380, 140, 'styrene → polystyrene', 58, 'H₂C', 'CH', ['Ph'], 'CH₂', 'CH');
    s += rule(20, 290, 740, 290);
    s += cell(0, 294, 'tetrafluoroethylene → PTFE', 58, 'F₂C', 'CF₂', [], 'CF₂', 'CF₂');
    s += cell(380, 294, 'acrylonitrile → PAN', 58, 'H₂C', 'CH', ['CN'], 'CH₂', 'CH');
    s += rule(20, 450, 740, 450);
    s += cell(0, 454, 'methyl methacrylate → PMMA', 86, 'H₂C', 'C', ['up-CH3', 'ester'], 'CH₂', 'C');
    s += tg(394, 474, 'isoprene → polyisoprene', 'fg-tag', 'start');
    s += sm(394, 504, 'isoprene is a diene, so it adds differently:', 'start');
    s += sm(394, 522, 'its drawings are in the next section', 'start');
    return s;
  },
  caption: 'Each monomer, and the repeat unit it gives. The C=C becomes a single bond, the bracket crosses a bond at each side, and the groups on the carbons do not change.',
});

/* ======================================================================
   6. Isoprene adds 1,4 and keeps a double bond (notes).
   ====================================================================== */
/* Isoprene's four carbons in a row, with the diene's numbers under them and
   the methyl on C2 leaning down to the right. */
function isoRow(x0, y, dx, labels, orders, o = {}) {
  const pts = labels.map((_, i) => P(x0 + i * dx, y));
  let s = '';
  const all = o.lead ? [P(x0 - dx, y), ...pts] : pts;
  const allL = o.lead ? [o.lead, ...labels] : labels;
  const allO = o.lead ? [1, ...orders] : orders;
  const c2 = pts[1];
  const me = P(c2.x + 26, y + 44);
  s += B(c2, labels[1], me, 'CH₃') + G(me, 'CH₃');
  s += row(all, allL, allO);
  pts.forEach((p, i) => { s += tg(p.x, y + 32, 'C' + (i + 1), 'fg-tag-mut'); });
  return { s, pts };
}
FIGURES.push({
  id: 'isoprene-1-4',
  section: 'addition-polymers',
  anchor: '',
  viewBox: '0 0 760 470',
  alt: 'Isoprene, numbered C1 to C4 with the methyl on C2. First, a chain radical R adds to C1, leaving the radical on C2. Second, that radical is allylic: it is drawn in two resonance forms, one with the radical on C2 and the C3=C4 double bond, and one with the radical on C4 and a C2=C3 double bond. Third, the next monomer adds at C4, so the repeat unit is CH2–C(CH3)=CH–CH2 with the double bond between C2 and C3.',
  build() {
    let s = '';
    let y = 70;
    s += tg(40, 26, '1. the chain radical adds to C1', 'fg-tag', 'start');
    s += G(P(60, y), 'R') + dot(71, y - 13);
    const r1 = isoRow(140, y, 66, ['H₂C', 'C', 'CH', 'CH₂'], [2, 1, 2]);
    s += r1.s;
    const mid = (72 + 140 - 17) / 2;
    s += fishhook(P(75, y - 16), P(mid - 3, y - 8), { bow: -9 });
    s += fishhook(P(168, y - 8), P(mid + 4, y - 9), { bow: 14 });
    s += fishhook(P(178, y - 8), P(197, y - 14), { bow: -7 });
    s += arrow(P(400, y), P(450, y), { muted: true });
    const r1b = isoRow(546, y, 62, ['CH₂', 'C', 'CH', 'CH₂'], [1, 2], { lead: 'R' });
    s += r1b.s;
    s += dot(r1b.pts[1].x - 4, y - 19);
    s += rule(40, 150, 720, 150);

    y = 222;
    s += tg(40, 178, '2. the radical is allylic: C2 and C4 share it', 'fg-tag', 'start');
    const fa = isoRow(116, y, 60, ['CH₂', 'C', 'CH', 'CH₂'], [1, 2], { lead: 'R' });
    s += fa.s + dot(fa.pts[1].x - 4, y - 19);
    s += arrow(P(376, y), P(400, y), { size: 7 }) + arrow(P(376, y), P(352, y), { size: 7 });
    const fb = isoRow(496, y, 60, ['CH₂', 'C', 'CH', 'CH₂'], [1, 2, 1], { lead: 'R' });
    s += fb.s + dot(fb.pts[3].x + 13, y - 15);
    s += rule(40, 302, 720, 302);

    y = 380;
    s += tg(40, 330, '3. the next monomer adds at C4, so C2=C3 stays in the chain', 'fg-tag', 'start');
    const ru = isoRow(150, y, 66, ['CH₂', 'C', 'CH', 'CH₂'], [1, 2, 1]);
    s += bond(P(92, y), ru.pts[0], { rFrom: 0, rTo: 17 });
    s += bond(ru.pts[3], P(408, y), { rFrom: 17, rTo: 0 });
    s += ru.s;
    s += bracket(104, y, 44, 'L') + bracket(396, y, 44, 'R', true);
    s += tg(440, y - 6, 'the repeat unit of polyisoprene', 'fg-tag', 'start');
    s += tg(440, y + 12, 'one C=C in every unit, from C2 to C3', 'fg-tag-good', 'start');
    return s;
  },
  caption: 'Isoprene numbered C1 to C4. Follow the radical from C2 to C4, and see where the double bond ends up.',
});

/* ======================================================================
   7. Cis and trans polyisoprene (notes).
   ====================================================================== */
function isoUnit(ox, cis) {
  let s = '';
  const cy = 118;
  const c2 = P(ox + 150, cy), c3 = P(ox + 196, cy);
  const at = (p, deg, len) => P(p.x + Math.cos((deg * Math.PI) / 180) * len, p.y - Math.sin((deg * Math.PI) / 180) * len);
  const me = at(c2, 120, 44), c1 = at(c2, 240, 44);
  const c4 = at(c3, cis ? 300 : 60, 44), h = at(c3, cis ? 60 : 300, 34);
  const in1 = at(c1, 180, 44), out4 = at(c4, 0, 44);
  s += skDouble(c2, c3, P(ox + 173, cy + 20));
  s += sk(c2, c1) + sk(c3, c4);
  s += bond(c2, me, { rFrom: 0, rTo: 17 }) + G(me, 'CH₃');
  s += bond(c3, h, { rFrom: 0, rTo: 10 }) + atom(h.x, h.y, 'H', { r: 10 });
  s += bond(c1, in1, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' }) + bond(c4, out4, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
  s += bracket(c1.x - 22, c1.y, 36, 'L') + bracket(c4.x + 22, c4.y, 36, 'R', true);
  s += tg(c1.x + 2, c1.y + 20, 'C1', 'fg-tag-mut') + tg(c2.x + 4, c2.y - 12, 'C2', 'fg-tag-mut');
  s += tg(c3.x - 4, c3.y + (cis ? -12 : 22), 'C3', 'fg-tag-mut') + tg(c4.x - 2, c4.y + (cis ? 20 : -12), 'C4', 'fg-tag-mut');
  s += tg(in1.x - 4, in1.y + (in1.y > cy ? 20 : -10), 'chain', 'fg-tag');
  s += tg(out4.x + 4, out4.y + (out4.y > cy ? 20 : -10), 'chain', 'fg-tag');
  return s;
}
FIGURES.push({
  id: 'cis-trans-polyisoprene',
  section: 'addition-polymers',
  anchor: '',
  viewBox: '0 0 760 250',
  alt: 'One repeat unit of polyisoprene drawn twice around the C2=C3 double bond. Left, cis, natural rubber: the chain bonds at C1 and C4 are both below the double bond, on the same side, and the methyl and the hydrogen are above. Right, trans, gutta-percha: the chain enters below at C1 and leaves above at C4, on opposite sides.',
  build() {
    let s = '';
    s += tg(190, 24, 'cis: natural rubber', 'fg-tag-good');
    s += tg(570, 24, 'trans: gutta-percha', 'fg-tag-warn');
    s += isoUnit(20, true);
    s += `<line class="fg-rule" x1="380" y1="40" x2="380" y2="236"></line>`;
    s += isoUnit(400, false);
    s += tg(190, 226, 'chain bonds on the same side of C2=C3');
    s += tg(570, 226, 'chain bonds on opposite sides');
    return s;
  },
  caption: 'Same repeat unit, same formula. Only the side on which the chain leaves C3 differs; the highlighted bonds are the chain.',
});

/* ======================================================================
   8. Random and block copolymers (notes).
   ====================================================================== */
FIGURES.push({
  id: 'copolymer-patterns',
  section: 'addition-polymers',
  anchor: '',
  viewBox: '0 0 760 330',
  alt: 'Chains of beads, A in one color and B in another. Random copolymer: A and B units mixed in no pattern along one chain. Block copolymer: a long run of A units followed by a long run of B units. Below, several block chains lined up in a solid: all the A blocks gather in one region and all the B blocks in the next, forming separate domains.',
  build() {
    let s = '';
    const bead = (x, y, k) => atom(x, y, k, { r: 10, kind: k === 'A' ? 'hi' : 'warn' });
    const chainOf = (x0, y, seq, dx = 23) => {
      let t = '';
      for (let i = 0; i < seq.length - 1; i++) t += bond(P(x0 + i * dx, y), P(x0 + (i + 1) * dx, y), { rFrom: 10, rTo: 10 });
      [...seq].forEach((k, i) => { t += bead(x0 + i * dx, y, k); });
      return t;
    };
    s += tg(40, 58, 'random', 'fg-tag', 'start');
    s += chainOf(170, 54, 'ABBABAAABABBAABABBBABAAB');
    s += tg(40, 108, 'block', 'fg-tag', 'start');
    s += chainOf(170, 104, 'AAAAAAAAAAAABBBBBBBBBBBB');
    s += rule(40, 136, 720, 136);
    s += tg(40, 164, 'block chains in a solid', 'fg-tag', 'start');
    s += panel(150, 176, 214, 136, { kind: 'hi' }) + panel(364, 176, 214, 136, { kind: 'warn' });
    for (let r = 0; r < 4; r++) {
      const off = (r % 2) * 11;
      s += chainOf(186 + off, 194 + r * 32, 'AAAAAAABBBBBBB', 26);
    }
    s += tg(257, 324, 'A domain', 'fg-tag') + tg(471, 324, 'B domain', 'fg-tag-warn');
    s += sm(596, 230, 'A blocks gather', 'start') + sm(596, 246, 'with A blocks,', 'start');
    s += sm(596, 262, 'B with B', 'start');
    return s;
  },
  caption: 'Two ways to put two monomers in one chain. In the block copolymer, like blocks gather with like, so each domain behaves like its own homopolymer.',
});

/* ======================================================================
   9. Tacticity: three polypropylenes (notes).
   ====================================================================== */
function ppChain(s0, x0, y, dx, pattern) {
  let s = s0;
  const xs = [];
  for (let i = 0; i < 8; i++) xs.push(P(x0 + i * dx, i % 2 === 0 ? y : y - 26));
  for (let i = 0; i < 7; i++) s += bond(xs[i], xs[i + 1], { rFrom: 0, rTo: 0 });
  pattern.forEach((w, k) => {
    const p = xs[k * 2];
    const tip = P(p.x, p.y + 46);
    s += (w ? wedge : hash)(p, tip, { rFrom: 0, rTo: 17 });
    s += G(tip, 'CH₃');
  });
  return s;
}
FIGURES.push({
  id: 'three-polypropylenes',
  section: 'addition-polymers',
  anchor: '',
  viewBox: '0 0 760 430',
  alt: 'Three identical eight-carbon zig-zag backbones with their methyl groups drawn on wedges and dashes: all wedges for isotactic, alternating wedge and dash for syndiotactic, and an irregular mixture for atactic',
  build() {
    let s = '';
    s += tg(380, 26, 'SAME CONNECTIVITY, SAME FORMULA, THREE MATERIALS');
    const one = (y, pattern, name, note, kind) => {
      s = ppChain(s, 146, y, 44, pattern);
      s += tg(62, y - 20, name, kind, 'start');
      s += sm(466, y - 8, note[0], 'start');
      s += sm(466, y + 8, note[1], 'start');
    };
    one(104, [true, true, true, true], 'isotactic',
      ['every methyl on the same side:', 'the chains line up; melts near 165 °C'], 'fg-tag-good');
    s += rule(40, 174, 720, 174);
    one(240, [true, false, true, false], 'syndiotactic',
      ['a regular alternation is a pattern too,', 'so these chains line up as well'], 'fg-tag-good');
    s += rule(40, 310, 720, 310);
    one(376, [true, true, false, true], 'atactic',
      ['no pattern: no two stretches of chain', 'match, so nothing lines up; a sticky goo'], 'fg-tag-warn');
    return s;
  },
  caption: 'Three polypropylenes, drawn with wedges and dashes. Only the side each methyl points to changes.',
  note: 'A drawing habit: lay the backbone down flat as a zig-zag first, then decide carbon by carbon whether each methyl comes forward (wedge) or goes back (dash).',
});

/* The same three chains, stacked for the lesson. */
FIGURES.push({
  id: 'l-three-polypropylenes',
  lessons: ['addition-polymers'],
  anchor: '',
  viewBox: '0 0 340 430',
  alt: 'Three polypropylene chains, each an eight-carbon zig-zag with a methyl on every other carbon. Isotactic: every methyl on a wedge, all on one side. Syndiotactic: wedge and dash alternate. Atactic: wedges and dashes in no pattern.',
  build() {
    let s = '';
    const one = (y, pattern, name, kind) => {
      s += tg(170, y - 44, name, kind);
      s = ppChain(s, 50, y, 34, pattern);
    };
    one(84, [true, true, true, true], 'isotactic: all on one side', 'fg-tag-good');
    s += rule(20, 148, 320, 148);
    one(222, [true, false, true, false], 'syndiotactic: alternating', 'fg-tag-good');
    s += rule(20, 286, 320, 286);
    one(360, [true, true, false, true], 'atactic: no pattern', 'fg-tag-warn');
    return s;
  },
  caption: 'Wedge: the methyl points toward you. Dash: it points away.',
});

/* ======================================================================
   10. Ziegler–Natta: bind, then insert (notes and lesson, 340 wide).
   ====================================================================== */
FIGURES.push({
  id: 'ziegler-natta-insertion',
  section: 'addition-polymers',
  lessons: ['addition-polymers'],
  anchor: '',
  viewBox: '0 0 340 470',
  alt: 'Three panels at a titanium atom. First: titanium bonded to the CH2 at the end of the chain, with an empty site beside it. Second: a propylene molecule sits in the empty site, its CH2 end toward titanium and its CH end toward the chain. Third: the chain has moved onto the alkene. A new C–C bond joins the old chain end to the CH carbon, titanium is now bonded to the alkene CH2, and the empty site is where the chain used to be.',
  build() {
    let s = '';
    /* Panel 1. */
    s += tg(170, 20, '1. a Ti–C bond, and an empty site');
    let ti = P(80, 88);
    let c = P(146, 56);
    s += B(ti, 'Ti', c, 'CH₂') + G(ti, 'Ti', 'hi') + G(c, 'CH₂');
    s += bond(c, P(206, 56), { rFrom: 17, rTo: 0 }) + tg(212, 60, 'chain', 'fg-tag', 'start');
    s += site(146, 120) + tg(168, 124, 'empty site', 'fg-tag-mut', 'start');
    s += rule(20, 152, 320, 152);

    /* Panel 2: propylene bound side-on in the site. */
    s += tg(170, 176, '2. propylene binds in the empty site');
    ti = P(80, 244);
    c = P(146, 212);
    s += B(ti, 'Ti', c, 'CH₂') + G(ti, 'Ti', 'hi') + G(c, 'CH₂');
    s += bond(c, P(206, 212), { rFrom: 17, rTo: 0 }) + tg(212, 216, 'chain', 'fg-tag', 'start');
    const a1 = P(140, 284), a2 = P(204, 266), me = P(262, 290);
    s += bond(ti, P((a1.x + a2.x) / 2, (a1.y + a2.y) / 2 + 2), { rFrom: 16, rTo: 0, cls: 'fg-dash' });
    s += B(a1, 'H₂C', a2, 'CH', { order: 2 }) + B(a2, 'CH', me, 'CH₃');
    s += G(a1, 'H₂C') + G(a2, 'CH') + G(me, 'CH₃');
    s += rule(20, 322, 320, 322);

    /* Panel 3: after insertion. */
    s += tg(170, 346, '3. insertion: the chain moves onto the alkene');
    ti = P(80, 412);
    const n1 = P(138, 444), n2 = P(204, 444), old = P(204, 384), me3 = P(268, 444);
    s += B(ti, 'Ti', n1, 'CH₂') + B(n1, 'CH₂', n2, 'CH') + B(n2, 'CH', me3, 'CH₃');
    s += B(n2, 'CH', old, 'CH₂', { cls: 'fg-bond-hi' });
    s += bond(old, P(262, 384), { rFrom: 17, rTo: 0 }) + tg(268, 388, 'chain', 'fg-tag', 'start');
    s += G(ti, 'Ti', 'hi') + G(n1, 'CH₂') + G(n2, 'CH') + G(old, 'CH₂') + G(me3, 'CH₃');
    s += site(128, 376) + tg(116, 358, 'empty again', 'fg-tag-mut', 'end');
    s += tg(212, 416, 'new C–C', 'fg-tag-good', 'start');
    return s;
  },
  caption: 'Other groups on the titanium are left out. The highlighted bond is the one the insertion makes.',
});

/* ======================================================================
   11. Backbiting leaves a butyl branch (notes and lesson, 340 wide).
   ====================================================================== */
FIGURES.push({
  id: 'backbiting',
  section: 'addition-polymers',
  lessons: ['addition-polymers'],
  anchor: '',
  viewBox: '0 0 340 420',
  alt: 'Top: the end of a growing polyethylene chain curls back into a six-membered ring made of the radical carbon C1, carbons C2, C3 and C4, carbon C5 and one hydrogen on C5. Fishhook arrows move that hydrogen from C5 to C1. Bottom: C1 is now a CH3 at the end of a four-carbon butyl branch, C1 to C4, and the radical sits on C5 of the main chain, where the chain grows on.',
  build() {
    let s = '';
    s += tg(170, 20, '1. the chain end curls back on itself');
    const ctr = P(186, 126), R = 62;
    const at = (deg) => P(ctr.x + Math.cos((deg * Math.PI) / 180) * R, ctr.y - Math.sin((deg * Math.PI) / 180) * R);
    const H = at(90), c1 = at(30), c2 = at(-30), c3 = at(-90), c4 = at(-150), c5 = at(150);
    const bb = P(c5.x - 64, c5.y);
    s += B(c1, 'CH₂', c2, 'CH₂') + B(c2, 'CH₂', c3, 'CH₂') + B(c3, 'CH₂', c4, 'CH₂') + B(c4, 'CH₂', c5, 'CH');
    s += B(c5, 'CH', H, 'H') + B(c5, 'CH', bb, '~CH₂');
    s += bond(H, c1, { rFrom: 12, rTo: 17, cls: 'fg-dash' });
    s += G(c1, 'CH₂') + G(c2, 'CH₂') + G(c3, 'CH₂') + G(c4, 'CH₂') + G(c5, 'CH') + G(H, 'H', 'hi') + G(bb, '~CH₂');
    s += dot(c1.x + 8, c1.y - 19);
    s += fishhook(P(c1.x + 4, c1.y - 22), P(c1.x - 30, H.y + 2), { bow: 10 });
    s += fishhook(P(151, 83), P(c1.x - 36, H.y + 12), { bow: 9 });
    s += fishhook(P(146, 80), P(c5.x + 4, c5.y - 16), { bow: 7 });
    s += tg(c1.x + 26, c1.y + 4, 'C1', 'fg-tag-mut', 'start');
    s += tg(c2.x + 24, c2.y + 4, 'C2', 'fg-tag-mut', 'start');
    s += tg(c3.x, c3.y + 32, 'C3', 'fg-tag-mut');
    s += tg(c4.x - 24, c4.y + 4, 'C4', 'fg-tag-mut', 'end');
    s += tg(c5.x - 2, c5.y - 22, 'C5', 'fg-tag-mut', 'end');
    s += tg(170, 238, 'six atoms: C1 to C5, and the H on C5');
    s += arrow(P(170, 250), P(170, 276), { muted: true });

    s += tg(170, 300, '2. the radical is now on C5');
    const y = 352;
    const q5 = P(96, y), q4 = P(156, y + 34), q3 = P(216, y), q2 = P(276, y + 34), q1 = P(306, y - 20);
    const back = P(32, y);
    s += B(back, '~CH₂', q5, 'CH') + B(q5, 'CH', q4, 'CH₂') + B(q4, 'CH₂', q3, 'CH₂') + B(q3, 'CH₂', q2, 'CH₂') + B(q2, 'CH₂', q1, 'CH₃');
    s += G(back, '~CH₂') + G(q5, 'CH', 'hi') + G(q4, 'CH₂') + G(q3, 'CH₂') + G(q2, 'CH₂') + G(q1, 'CH₃');
    s += dot(q5.x + 2, y - 19);
    s += tg(q5.x, y + 30, 'C5', 'fg-tag-mut');
    s += tg(q4.x, y + 66, 'C4', 'fg-tag-mut') + tg(q3.x, y - 24, 'C3', 'fg-tag-mut');
    s += tg(q2.x, y + 66, 'C2', 'fg-tag-mut') + tg(q1.x - 2, y - 44, 'C1', 'fg-tag-mut');
    s += tg(q5.x - 8, y - 30, 'grows on from here', 'fg-tag', 'start');
    return s;
  },
  caption: 'The hydrogen moves from C5 to C1. C1 to C4 are left behind as a butyl branch, and the chain carries on from C5.',
});

/* ======================================================================
   12. The three stages, stacked for the lesson.
   ====================================================================== */
FIGURES.push({
  id: 'l-radical-stages',
  lessons: ['addition-polymers'],
  anchor: '',
  viewBox: '0 0 340 540',
  alt: 'Three stages of radical polymerization drawn with fishhook arrows. Initiation: RO–OR splits into two RO radicals. Propagation: a chain radical ending in CHX adds to the CH2 end of CH2=CHX, and the radical moves to the new CHX carbon. Termination: two chain radicals join, and both radicals are gone.',
  build() {
    let s = '';
    /* Initiation. */
    s += tg(170, 20, 'initiation: the O–O bond splits');
    let y = 60;
    s += row([P(136, y), P(204, y)], ['RO', 'OR']);
    s += fishhook(P(165, y - 5), P(142, y - 17), { bow: 9 });
    s += fishhook(P(175, y - 5), P(198, y - 17), { bow: -9 });
    s += arrow(P(170, y + 24), P(170, y + 48), { muted: true });
    y = 132;
    s += G(P(120, y), 'RO') + dot(136, y - 13);
    s += lbl(170, y + 5, '+');
    s += G(P(220, y), 'RO') + dot(236, y - 13);
    s += rule(20, 160, 320, 160);

    /* Propagation. */
    s += tg(170, 184, 'propagation: add to the next monomer');
    y = 226;
    const L = P(60, y);
    s += G(L, '~CHX') + dot(L.x + 17, y - 17);
    const A = P(168, y), Bx = P(238, y);
    s += row([A, Bx], ['H₂C', 'CHX'], [2]);
    const mid = (L.x + 21 + A.x - 17) / 2;
    s += fishhook(P(L.x + 21, y - 19), P(mid - 3, y - 8), { bow: -9 });
    s += fishhook(P(198, y - 8), P(mid + 4, y - 9), { bow: 15 });
    s += fishhook(P(208, y - 8), P(Bx.x - 11, y - 16), { bow: -8 });
    s += arrow(P(170, y + 24), P(170, y + 48), { muted: true });
    y = 298;
    s += row([P(70, y), P(140, y), P(210, y)], ['~CHX', 'CH₂', 'CHX']);
    s += dot(223, y - 14);
    s += tg(170, y + 38, 'repeat thousands of times');
    s += rule(20, 356, 320, 356);

    /* Termination by combination. */
    s += tg(170, 380, 'termination: two radical ends meet');
    y = 420;
    s += G(P(90, y), '~CHX') + dot(107, y - 17);
    s += G(P(250, y), 'XHC~') + dot(233, y - 17);
    s += fishhook(P(112, y - 19), P(164, y - 6), { bow: -12 });
    s += fishhook(P(228, y - 19), P(176, y - 6), { bow: 12 });
    s += arrow(P(170, y + 24), P(170, y + 48), { muted: true });
    y = 494;
    s += row([P(130, y), P(210, y)], ['~CHX', 'XHC~']);
    s += tg(170, y + 38, 'two radicals used up');
    return s;
  },
  caption: 'Every arrow has one barb, because it moves one electron. X is the group on the monomer, as in CH₂=CHX.',
});

/* ======================================================================
   13. Linear against branched polyethylene (notes).
   ====================================================================== */
FIGURES.push({
  id: 'packing-architecture',
  section: 'addition-polymers',
  anchor: '',
  viewBox: '0 0 760 320',
  alt: 'Linear chains lying flat against each other beside branched chains held apart, labeled HDPE and LDPE',
  build() {
    let s = '';
    // A run of chain as a shallow zigzag, optionally with a short branch.
    const chain = (x0, y, n, branchAt) => {
      let t = '', px = x0, py = y, up = true;
      for (let i = 0; i < n; i++) {
        const nx = px + 16, ny = up ? y - 6 : y + 6;
        t += `<line class="fg-bond" x1="${px}" y1="${py}" x2="${nx}" y2="${ny}"></line>`;
        if (branchAt && i === branchAt) {
          t += `<line class="fg-bond" x1="${nx}" y1="${ny}" x2="${nx + 8}" y2="${ny - 26}"></line>`;
          t += `<line class="fg-bond" x1="${nx + 8}" y1="${ny - 26}" x2="${nx + 22}" y2="${ny - 20}"></line>`;
        }
        px = nx; py = ny; up = !up;
      }
      return t;
    };
    const col = (ox, title, branched, label2, use, kind) => {
      s += panel(ox, 46, 330, 152, { kind });
      s += tg(ox + 165, 34, title);
      for (let r = 0; r < 4; r++) {
        s += chain(ox + 24, 78 + r * 30, 16, branched ? (r % 2 ? 4 : 9) : 0);
      }
      s += lbl(ox + 165, 220, label2);
      s += tg(ox + 165, 242, use, kind === 'warn' ? 'fg-tag' : 'fg-tag-good');
    };
    col(24, 'linear: chains touch along their length', false,
        'HDPE: dense, rigid', 'milk bottles and pipe', null);
    col(406, 'branched: chains held apart', true,
        'LDPE: less dense, flexible', 'plastic bags', 'warn');

    s += rule(24, 268, 700, 268);
    s += lbl(360, 294, 'Same monomer. Same repeat unit. Same molecular formula.');
    s += lbl(360, 316, 'Only the architecture differs.');
    return s;
  },
  caption: 'The two polyethylenes. Branches keep the chains from lying against each other.',
  note: 'This is the fatty-acid argument from the biomolecules chapter, applied to a different molecule. Straight chains lie against their neighbors along their full length, and the London forces add up. A branch breaks that contact.',
});

export default FIGURES;
