/* Figures for the retrosynthesis notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions used in every figure here:
   - A disconnection is marked with a squiggle drawn ACROSS the bond it cuts,
     never along it, so it cannot be read as a bond.
   - The retrosynthesis arrow is two lines and an open head. It reads
     "could be made from".
   - In the retron drawings, the small green numbers count along the chain
     from the carbon that carries the group: the C=O carbon, or the carbinol
     carbon (the carbon bonded to the OH). In a ring they run round from one
     alkene carbon. They are NOT IUPAC locants.
   Figures shown in the lesson (ids starting l-) are 340 wide or less and use
   only fg-lbl and fg-tag text. */
import { atom, bond, arrow, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { ringDouble, polyPts, benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const r2 = (v) => Math.round(v * 100) / 100;
const polar = (c, deg, r) => P(c.x + r * Math.cos((deg * Math.PI) / 180), c.y - r * Math.sin((deg * Math.PI) / 180));

/* An atom with a label, its disc sized to the label (fg-lbl renders at 13px,
   about 8px a letter, less for a subscript or a charge). */
const A = (x, y, lbl, kind = 'plain', r) => {
  const small = (lbl.match(/[₀-₉⁺⁻]/g) || []).length;
  return { x, y, lbl, kind, r: r ?? Math.max(11, Math.ceil((lbl.length - small) * 4.2 + small * 2.6 + 5)) };
};
const draw = (...as) => as.map((a) => atom(a.x, a.y, a.lbl, { kind: a.kind, r: a.r, size: 13 })).join('');
/* A bond between atoms or skeletal vertices; a bare point has nothing to trim. */
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r || 0, rTo: b.r || 0, ...o });
/* A labelled substituent on vertex p, along screen angle deg, with a bond of
   about `len` showing between the vertex and the disc. */
const sub = (p, deg, lbl, len = 18, kind) => {
  const probe = A(0, 0, lbl, kind);
  const q = polar(p, deg, len + probe.r);
  const a = A(q.x, q.y, lbl, kind);
  return bd(p, a) + draw(a);
};
/* C=O on vertex p along screen angle deg. */
const carbonyl = (p, deg, len = 18) => {
  const q = polar(p, deg, len + 11);
  const O = A(q.x, q.y, 'O');
  return bd(p, O, { order: 2, gap: 3.2 }) + draw(O);
};
/* A carbon-number tag set d away from vertex p along screen angle deg. */
const num = (p, deg, s, d = 15) => { const q = polar(p, deg, d); return text(q.x, q.y + 4, s, { cls: 'fg-tag-good', size: 11 }); };
/* A skeletal chain of n carbons, bond length L: even vertices on y0 and odd
   ones raised when oddUp is true (lowered otherwise). */
const L = 26, DX = L * Math.cos(Math.PI / 6), DY = L / 2;
const chain = (x0, y0, n, oddUp = true) =>
  Array.from({ length: n }, (_, i) => P(x0 + i * DX, y0 + (i % 2 ? (oddUp ? -DY : DY) : 0)));
const sk = (a, b, cls) => bond(a, b, { rFrom: 0, rTo: 0, cls: cls || 'fg-bond' });
const path = (pts) => pts.slice(1).map((p, i) => sk(pts[i], p)).join('');

/* The disconnection squiggle: a short wave across the bond a-b, centred on
   its midpoint. */
function squiggle(a, b, half = 11) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len, px = -uy, py = ux;
  const n = 3, step = (2 * half) / n;
  let d = `M${r2(mx - px * half)} ${r2(my - py * half)}`;
  for (let i = 0; i < n; i++) {
    const t0 = -half + i * step, tc = t0 + step / 2, t1 = t0 + step;
    const amp = (i % 2 ? -1 : 1) * 9;
    d += ` Q${r2(mx + px * tc + ux * amp)} ${r2(my + py * tc + uy * amp)} ${r2(mx + px * t1)} ${r2(my + py * t1)}`;
  }
  return `<path class="fg-arrow" fill="none" d="${d}"></path>`;
}

/* The retrosynthesis arrow, pointing right (retroH) or down (retroV). */
const retroH = (x, y, w = 40) =>
  `<line class="fg-arrow" x1="${x}" y1="${y - 3.5}" x2="${x + w - 6}" y2="${y - 3.5}"></line>` +
  `<line class="fg-arrow" x1="${x}" y1="${y + 3.5}" x2="${x + w - 6}" y2="${y + 3.5}"></line>` +
  `<path class="fg-arrow" d="M${x + w - 10} ${y - 9} L${x + w} ${y} L${x + w - 10} ${y + 9}"></path>`;
const retroV = (x, y, h = 40) =>
  `<line class="fg-arrow" x1="${x - 3.5}" y1="${y}" x2="${x - 3.5}" y2="${y + h - 6}"></line>` +
  `<line class="fg-arrow" x1="${x + 3.5}" y1="${y}" x2="${x + 3.5}" y2="${y + h - 6}"></line>` +
  `<path class="fg-arrow" d="M${x - 9} ${y + h - 10} L${x} ${y + h} L${x + 9} ${y + h - 10}"></path>`;

/* A carbanion on vertex p: a lone pair along screen angle lpDeg (y down, as
   lonePair takes it) and a minus sign at screen angle chargeDeg. */
const anion = (p, lpDeg, chargeDeg) => {
  const q = polar(p, chargeDeg, 17);
  return lonePair(p.x, p.y, lpDeg, { dist: 10, spread: 4 }) + text(q.x, q.y + 5, '−', { cls: 'fg-lbl', size: 13 });
};
const deltaPlus = (p, deg, d = 18) => { const q = polar(p, deg, d); return text(q.x, q.y + 4, 'δ+', { cls: 'fg-lbl', size: 13 }); };

/* ============================================ butan-2-ol, cut once ===== */
/* Butan-2-ol, skeletal, with the carbinol carbon C2 at vertex 1. Returns the
   drawing and the vertices. */
function butanol(x0, y0, cut) {
  const v = chain(x0, y0, 4, true);
  let s = path(v) + sub(v[1], 90, 'OH');
  s += tag(v[1].x, y0 + 26, 'carbinol carbon');
  if (cut) {
    s += squiggle(v[1], v[2]);
    s += tag(v[3].x + 4, v[3].y - 18, 'cut');
  }
  return s;
}
/* The two pieces: the ethyl anion (charged carbon on the left, where the cut
   was) and ethanal with its carbonyl carbon marked delta-plus. */
function ethylAnion(x0, y0) {
  const a = P(x0, y0), b = P(x0 + DX, y0 - DY);
  return sk(a, b) + anion(a, 200, 115);
}
function ethanal(x0, y0) {
  const a = P(x0, y0), b = P(x0 + DX, y0 - DY);
  return sk(a, b) + carbonyl(b, 90) + deltaPlus(b, -20, 20);
}

FIGURES.push({
  id: 'butanol-disconnection',
  section: 'retrosynthesis',
  anchor: 'which two pieces, joined by a reaction you know, would give this bond.</p>',
  viewBox: '0 0 440 236',
  alt: 'Butan-2-ol drawn skeletally, with its carbinol carbon labelled and a squiggle across the bond from the carbinol carbon to the ethyl group. A double-lined arrow reading "could be made from" leads to two pieces: an ethyl anion with a lone pair and a minus sign, labelled "attacks", and ethanal with a delta-plus on its carbonyl carbon, labelled "is attacked". Below them: bought as ethylmagnesium bromide and ethanal.',
  build() {
    let s = butanol(40, 150, true);
    s += retroH(146, 140, 50);
    s += tag(171, 124, 'could be made from');
    s += ethylAnion(236, 150) + tag(250, 180, 'attacks');
    s += text(306, 146, '+', { cls: 'fg-lbl' });
    s += ethanal(334, 150) + tag(352, 180, 'is attacked');
    s += rule(20, 198, 420, 198);
    s += tag(160, 222, 'bought as:', { cls: 'fg-tag-mut' });
    s += tag(250, 222, 'CH₃CH₂MgBr', { cls: 'fg-tag-good' });
    s += text(306, 222, '+', { cls: 'fg-lbl' });
    s += tag(356, 222, 'ethanal', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The squiggle marks the one bond you cut. The minus sign and the δ+ say which piece attacks and which is attacked.',
});

FIGURES.push({
  id: 'l-butanol-cut',
  lessons: ['retrosynthesis'],
  viewBox: '0 0 340 250',
  alt: 'Butan-2-ol drawn skeletally, with its carbinol carbon labelled and a squiggle across the bond from the carbinol carbon to the ethyl group. A double-lined arrow points down, reading "could be made from", to an ethyl anion labelled "attacks" and ethanal, with delta-plus on its carbonyl carbon, labelled "is attacked".',
  build() {
    let s = butanol(134, 82, true);
    s += retroV(170, 124, 42);
    s += tag(184, 150, 'could be made from', { anchor: 'start' });
    s += ethylAnion(92, 212) + tag(104, 240, 'attacks');
    s += text(170, 208, '+', { cls: 'fg-lbl' });
    s += ethanal(222, 212) + tag(240, 240, 'is attacked');
    return s;
  },
  caption: 'The squiggle marks the bond you cut.',
});

FIGURES.push({
  id: 'l-synthons',
  lessons: ['retrosynthesis'],
  viewBox: '0 0 340 196',
  alt: 'Two columns. Left: the synthon, an ethyl anion, with an arrow down to what you buy, CH3CH2MgBr. Right: the synthon ethanal, with delta-plus on its carbonyl carbon, with an arrow down to what you buy, ethanal itself.',
  build() {
    let s = panel(4, 4, 162, 188) + panel(174, 4, 162, 188);
    s += tag(85, 24, 'synthon') + tag(255, 24, 'synthon');
    s += ethylAnion(70, 88);
    s += ethanal(236, 88);
    s += arrow(P(85, 104), P(85, 140), { size: 7 }) + arrow(P(255, 104), P(255, 140), { size: 7 });
    s += tag(78, 126, 'buy', { anchor: 'end' }) + tag(248, 126, 'buy', { anchor: 'end' });
    s += label(85, 166, 'CH₃CH₂MgBr');
    s += label(255, 166, 'CH₃CHO');
    s += tag(255, 184, 'ethanal itself', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'The synthon is the idea. The synthetic equivalent is the bottle.',
});

/* ================================= an aldol disconnection, written out ==== */
/* 4-hydroxy-4-methylpentan-2-one, the aldol product of two acetones. */
FIGURES.push({
  id: 'disconnection-notation',
  section: 'retrosynthesis',
  anchor: 'A structural pattern that signals a particular disconnection is called a <b>retron</b>.',
  viewBox: '0 0 700 290',
  alt: '4-Hydroxy-4-methylpentan-2-one drawn skeletally, with a squiggle across the bond between the alpha carbon and the carbon that carries the OH. A double-lined arrow labelled aldol leads to two acetone molecules: one drawn as the enolate, with a minus charge on its alpha carbon, and one with delta-plus on its carbonyl carbon. Beneath: synthetic equivalents, acetone plus NaOH and acetone.',
  build() {
    let s = '';
    s += tag(350, 26, 'an aldol disconnection, written out');
    const v1 = P(60, 175), v2 = P(95, 152), v3 = P(130, 175), v4 = P(165, 152);
    s += sk(v1, v2) + sk(v2, v3) + sk(v3, v4);
    s += bond(v2, P(95, 108), { rFrom: 0, rTo: 15, order: 2 });
    s += bond(v4, P(165, 108), { rFrom: 0, rTo: 15 });
    s += sk(v4, P(202, 130)) + sk(v4, P(202, 174));
    s += atom(95, 108, 'O') + atom(165, 108, 'OH');
    s += squiggle(v3, v4, 18);
    s += tag(147, 216, 'cut here');
    s += tag(95, 244, 'C=O carbon', { cls: 'fg-tag-mut' });
    s += tag(186, 244, 'C–OH carbon', { cls: 'fg-tag-mut' });

    s += retroH(236, 152, 58);
    s += tag(265, 130, 'aldol');

    const acetone = (ax, cy) => {
      const a1 = P(ax, cy + 22), a2 = P(ax + 30, cy), a3 = P(ax + 60, cy + 22);
      return sk(a1, a2) + bond(a2, P(ax + 30, cy - 40), { rFrom: 0, rTo: 15, order: 2 }) + sk(a2, a3) + atom(ax + 30, cy - 40, 'O');
    };
    s += panel(318, 76, 180, 150);
    s += tag(408, 98, 'enolate: attacks');
    s += acetone(370, 170);
    s += lonePair(430, 192, 20, { dist: 10, spread: 4 });
    s += text(448, 186, '−', { cls: 'fg-lbl' });
    s += text(408, 214, 'α carbon, nucleophilic', { cls: 'fg-sm' });

    s += panel(508, 76, 180, 150);
    s += tag(598, 98, 'carbonyl: is attacked');
    s += acetone(560, 170);
    s += text(640, 148, 'δ+', { cls: 'fg-lbl' });
    s += rule(630, 152, 604, 166);
    s += text(598, 214, 'C=O carbon, electrophilic', { cls: 'fg-sm' });

    s += text(503, 262, 'bought as:  acetone + NaOH   ·   acetone', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The cut falls between the α carbon and the carbon that carries the OH. Both pieces are acetone, so the forward reaction is simply acetone with base.',
});

/* ===================================== six retrons, one per panel ======= */
const RETRONS = [
  {
    name: 'Grignard', pattern: 'alcohol', cut: 'cut 1–2',
    /* pentan-3-ol: carbinol carbon at vertex 2 */
    draw(c) {
      const v = chain(c.x - 2 * DX, c.y + 8, 5, false);
      let s = path(v) + sub(v[2], 90, 'OH');
      s += num(v[2], 270, '1') + num(v[1], 270, '2') + num(v[3], 270, '2');
      return s + squiggle(v[2], v[3]);
    },
  },
  {
    name: 'aldol', pattern: 'β-hydroxy carbonyl', cut: 'cut 2–3',
    /* 3-hydroxybutanal */
    draw(c) {
      const v = chain(c.x - 1.5 * DX, c.y + 8, 4, false);
      let s = path(v) + carbonyl(v[0], 210) + sub(v[2], 90, 'OH');
      s += num(v[0], 90, '1', 14) + num(v[1], 270, '2') + num(v[2], 270, '3') + num(v[3], 270, '4');
      return s + squiggle(v[1], v[2]);
    },
  },
  {
    name: 'aldol condensation', pattern: 'α,β-unsaturated C=O', cut: 'cut the 2=3 bond',
    /* but-2-enal */
    draw(c) {
      const v = chain(c.x - 1.5 * DX, c.y + 2, 4, false);
      let s = sk(v[0], v[1]) + ringDouble(v[1], v[2], P(c.x, c.y + 40), { inset: 5, gap: 4.4 }) + sk(v[2], v[3]);
      s += carbonyl(v[0], 210);
      s += num(v[0], 90, '1', 14) + num(v[1], 270, '2', 17) + num(v[2], 90, '3', 14) + num(v[3], 270, '4');
      return s + squiggle(v[1], v[2], 13);
    },
  },
  {
    name: 'Claisen', pattern: '1,3-dicarbonyl', cut: 'cut 2–3',
    /* ethyl 3-oxobutanoate, drawn CH3 (4) on the left to the ester (1) */
    draw(c) {
      const v = chain(c.x - 62, c.y + 8, 4, false);
      let s = path(v) + carbonyl(v[2], 90) + carbonyl(v[0], 90);
      s += sub(v[2], 330, 'OEt', 14);
      s += num(v[3], 270, '4') + num(v[2], 270, '1') + num(v[1], 270, '2') + num(v[0], 270, '3');
      return s + squiggle(v[0], v[1]);
    },
  },
  {
    name: 'Michael', pattern: '1,5-dicarbonyl', cut: 'cut 2–3',
    /* heptane-2,6-dione */
    draw(c) {
      const v = chain(c.x - 3 * DX, c.y + 10, 7, true);
      let s = path(v) + carbonyl(v[1], 90) + carbonyl(v[5], 90);
      s += num(v[1], 270, '1') + num(v[2], 270, '2') + num(v[3], 90, '3', 14) + num(v[4], 270, '4') + num(v[5], 270, '5');
      return s + squiggle(v[2], v[3]);
    },
  },
  {
    name: 'Diels–Alder', pattern: 'cyclohexene', cut: 'cut 3–4 and 5–6',
    /* cyclohex-3-ene-1-carbaldehyde; the ring numbers run from the alkene */
    draw(c) {
      const o = P(c.x - 18, c.y);
      const v = polyPts(o.x, o.y, 6, 26, 90);
      // ring numbers: 1 = v1, 2 = v2 (the C=C), 3 = v3, 4 = v4, 5 = v5, 6 = v0
      let s = '';
      for (let i = 0; i < 6; i++) {
        const a = v[i], b = v[(i + 1) % 6];
        s += i === 1 ? ringDouble(a, b, o, { inset: 5, gap: 4.4 }) : sk(a, b);
      }
      s += sub(v[5], 30, 'CHO', 14);
      /* the screen angle pointing from the ring centre out through p */
      const out = (p) => (Math.atan2(-(p.y - o.y), p.x - o.x) * 180) / Math.PI;
      s += num(v[1], out(v[1]), '1', 13) + num(v[2], out(v[2]), '2', 13) + num(v[3], 270, '3', 14);
      s += num(v[4], out(v[4]), '4', 14) + num(v[5], 100, '5', 14) + num(v[0], 90, '6', 13);
      return s + squiggle(v[3], v[4], 10) + squiggle(v[5], v[0], 10);
    },
  },
];

function retronPanel(ox, oy, w, h, i) {
  const R = RETRONS[i];
  let s = panel(ox, oy, w, h);
  s += label(ox + w / 2, oy + 22, R.name);
  s += tag(ox + w / 2, oy + 40, R.pattern);
  s += R.draw(P(ox + w / 2, oy + 98));
  s += tag(ox + w / 2, oy + h - 12, R.cut, { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'retron-gallery',
  section: 'retrosynthesis',
  anchor: 'Learning to see retrons is most of what makes an experienced chemist fast at this.</p>',
  viewBox: '0 0 760 356',
  alt: 'Six panels, each a small molecule with its carbons numbered and a squiggle across the bond to cut. Grignard: pentan-3-ol, carbinol carbon 1, cut 1–2. Aldol: 3-hydroxybutanal, C=O carbon 1, OH on carbon 3, cut 2–3. Aldol condensation: but-2-enal, C=C between 2 and 3, cut the 2=3 bond. Claisen: ethyl 3-oxobutanoate, ester C=O carbon 1 and ketone C=O carbon 3, cut 2–3. Michael: heptane-2,6-dione, the two C=O carbons numbered 1 and 5, cut 2–3. Diels–Alder: cyclohex-3-ene-1-carbaldehyde, ring numbered from the C=C at 1 and 2, cut 3–4 and 5–6.',
  build() {
    let s = '';
    for (let i = 0; i < 6; i++) s += retronPanel(6 + (i % 3) * 252, 4 + Math.floor(i / 3) * 176, 244, 170, i);
    return s;
  },
  caption: 'Green numbers count from the carbon that carries the group (1): the C=O carbon or the carbinol carbon. In the ring they start at the C=C. They are not IUPAC locants.',
});

FIGURES.push({
  id: 'l-retrons',
  lessons: ['retrosynthesis'],
  viewBox: '0 0 340 526',
  alt: 'Six panels in three rows of two, each a small molecule with numbered carbons and a squiggle across the bond to cut. Grignard: pentan-3-ol, cut 1–2 from the carbinol carbon. Aldol: 3-hydroxybutanal, cut 2–3. Aldol condensation: but-2-enal, cut the 2=3 bond. Claisen: ethyl 3-oxobutanoate, cut 2–3. Michael: heptane-2,6-dione, cut 2–3. Diels–Alder: cyclohex-3-ene-1-carbaldehyde, cut 3–4 and 5–6.',
  build() {
    let s = '';
    for (let i = 0; i < 6; i++) s += retronPanel(2 + (i % 2) * 170, 2 + Math.floor(i / 2) * 174, 166, 170, i);
    return s;
  },
  caption: 'Carbon 1 carries the group: the C=O carbon or the carbinol carbon. In the ring, 1 and 2 are the C=C.',
});

/* The four molecules the lesson's sort asks about. No cut is marked. */
const SORT = [
  { k: 'A', draw(c) {
    /* 3-hydroxy-2-methylpentanal */
    const v = chain(c.x - 2 * DX, c.y + 4, 5, false);
    return path(v) + carbonyl(v[0], 210) + sk(v[1], polar(v[1], 270, L)) + sub(v[2], 90, 'OH');
  } },
  { k: 'B', draw(c) {
    /* methyl cyclohex-3-ene-1-carboxylate */
    const o = P(c.x - 34, c.y + 4);
    const v = polyPts(o.x, o.y, 6, 26, 90);
    let s = '';
    for (let i = 0; i < 6; i++) s += i === 1 ? ringDouble(v[1], v[2], o, { inset: 5, gap: 4.4 }) : sk(v[i], v[(i + 1) % 6]);
    return s + sub(v[5], 30, 'CO₂CH₃', 10);
  } },
  { k: 'C', draw(c) {
    /* 3-methylhexan-3-ol: quaternary carbinol carbon at vertex 2 */
    const v = chain(c.x - 2.5 * DX, c.y + 14, 6, false);
    return path(v) + sub(v[2], 60, 'OH', 14) + sk(v[2], polar(v[2], 120, L));
  } },
  { k: 'D', draw(c) {
    /* ethyl 3-oxo-3-phenylpropanoate */
    const k = P(c.x - 22, c.y);
    const ch2 = polar(k, 330, L), e = polar(ch2, 30, L);
    let s = sk(k, ch2) + sk(ch2, e) + carbonyl(k, 90) + carbonyl(e, 90) + sub(e, 330, 'OEt', 12);
    const rc = polar(k, 210, L + 15);
    const ring = benzene(rc.x, rc.y, 15, { rot: 30 });
    return s + ring.svg + sk(k, ring.pts[0]);
  } },
];

FIGURES.push({
  id: 'l-retron-sort',
  lessons: ['retrosynthesis'],
  viewBox: '0 0 340 316',
  alt: 'Four molecules to sort, labelled A to D. A: 3-hydroxy-2-methylpentanal. B: methyl cyclohex-3-ene-1-carboxylate. C: 3-methylhexan-3-ol. D: ethyl 3-oxo-3-phenylpropanoate.',
  build() {
    let s = '';
    SORT.forEach((m, i) => {
      const ox = 2 + (i % 2) * 170, oy = 2 + Math.floor(i / 2) * 158;
      s += panel(ox, oy, 166, 152);
      s += label(ox + 16, oy + 22, m.k);
      s += m.draw(P(ox + 83, oy + 86));
    });
    return s;
  },
  caption: 'Find the pattern in each molecule first, then name the reaction.',
});

/* ========================== 2-phenylbutan-2-ol, three cuts ============= */
/* The target drawn with labelled groups round the carbinol carbon. `cuts`
   lists which bonds get a squiggle: a (to Ph), b (to CH3), c (to CH2CH3). */
function ppb(cx, cy, cuts) {
  const c = A(cx, cy, 'C', 'hi');
  const oh = A(cx, cy - 52, 'OH'), ph = A(cx - 82, cy, 'Ph'), et = A(cx + 92, cy, 'CH₂CH₃'), me = A(cx, cy + 56, 'CH₃');
  let s = bd(c, oh) + bd(c, ph) + bd(c, et) + bd(c, me) + draw(oh, ph, et, me, c);
  s += tag(cx - 50, cy - 30, 'carbinol C', { cls: 'fg-tag-mut' });
  const marks = {
    a: () => squiggle(P(ph.x + ph.r, cy), P(cx - c.r, cy), 13) + tag(cx - 42, cy + 28, 'a'),
    b: () => squiggle(P(cx, cy + c.r), P(cx, me.y - me.r), 13) + tag(cx - 22, cy + 34, 'b'),
    c: () => squiggle(P(cx + c.r, cy), P(et.x - et.r, cy), 13) + tag(cx + 42, cy + 28, 'c'),
  };
  for (const k of cuts) s += marks[k]();
  return s;
}
const CUTS = [
  ['cut a', 'Ph⁻  +  CH₃COCH₂CH₃', 'PhMgBr + butan-2-one'],
  ['cut b', 'CH₃⁻  +  PhCOCH₂CH₃', 'CH₃MgBr + propiophenone'],
  ['cut c', 'CH₃CH₂⁻  +  PhCOCH₃', 'CH₃CH₂MgBr + acetophenone'],
];

FIGURES.push({
  id: 'three-disconnections',
  section: 'retrosynthesis',
  anchor: 'is telling you so.</p>\n</div>',
  alt: '2-Phenylbutan-2-ol with its carbinol carbon highlighted and squiggles across its three carbon–carbon bonds: a to phenyl, b to methyl, c to ethyl. Below, one panel per cut. Cut a: phenyl anion plus butan-2-one, bought as PhMgBr and butan-2-one. Cut b: methyl anion plus propiophenone, bought as CH3MgBr and propiophenone. Cut c: ethyl anion plus acetophenone, bought as CH3CH2MgBr and acetophenone.',
  viewBox: '0 0 760 360',
  build() {
    let s = ppb(380, 92, ['a', 'b', 'c']);
    s += rule(30, 178, 730, 178);
    const col = (x, [cut, synthons, equivs]) => {
      const cx = x + 118;
      s += panel(x, 196, 236, 124);
      s += tag(cx, 220, cut);
      s += text(cx, 242, 'synthons', { cls: 'fg-sm' });
      s += label(cx, 262, synthons);
      s += text(cx, 286, 'synthetic equivalents', { cls: 'fg-sm' });
      s += tag(cx, 308, equivs, { cls: 'fg-tag-good' });
    };
    col(8, CUTS[0]); col(262, CUTS[1]); col(516, CUTS[2]);
    s += label(380, 346, 'Each cut is a Grignard disconnection. Only the starting materials change.');
    return s;
  },
  caption: 'Every carbon–carbon bond to the carbinol carbon can be cut, so this target has three one-step routes.',
});

FIGURES.push({
  id: 'l-ppb-target',
  lessons: ['retrosynthesis'],
  viewBox: '0 0 340 170',
  alt: '2-Phenylbutan-2-ol with its carbinol carbon highlighted: OH up, phenyl to the left, methyl down and ethyl to the right. A squiggle crosses the bond to the ethyl group.',
  build() {
    return ppb(150, 72, ['c']);
  },
  caption: '2-Phenylbutan-2-ol, cut at the bond to the ethyl group.',
});

FIGURES.push({
  id: 'l-three-cuts',
  lessons: ['retrosynthesis'],
  viewBox: '0 0 340 440',
  alt: '2-Phenylbutan-2-ol with squiggles across its three carbon–carbon bonds, a to phenyl, b to methyl and c to ethyl. Below, one row per cut. Cut a: PhMgBr and butan-2-one. Cut b: CH3MgBr and propiophenone. Cut c: CH3CH2MgBr and acetophenone.',
  build() {
    let s = ppb(150, 70, ['a', 'b', 'c']);
    CUTS.forEach(([cut, synthons, equivs], i) => {
      const y = 158 + i * 94;
      s += panel(4, y, 332, 86);
      s += tag(170, y + 20, cut);
      s += label(170, y + 44, synthons);
      s += tag(170, y + 70, equivs, { cls: 'fg-tag-good' });
    });
    return s;
  },
  caption: 'Top of each row: the synthons. Bottom, in green: what you buy.',
});

/* ============================== hexan-3-one from acetylene ============== */
/* Four stages. Carbons keep the target's numbers 1-6 throughout, so the
   reader can see which atoms each piece supplies. `cut` squiggles mark the
   bond the NEXT stage breaks. */
const TRI = { rFrom: 0, rTo: 0, order: 3, gap: 3 };
function hexStage(ox, oy, w, h, stage) {
  const titles = ['1 · the target', '2 · after the FGI', '3 · after one cut', '4 · after two cuts'];
  const names = ['hexan-3-one', 'hex-3-yne', 'but-1-yne', 'acetylene'];
  const next = ['FGI: C=O from C≡C', 'next: cut C4–C5', 'next: cut C2–C3', 'all permitted: stop'];
  let s = panel(ox, oy, w, h, stage === 3 ? { kind: 'good' } : {});
  s += tag(ox + w / 2, oy + 20, titles[stage]);
  const cx = ox + w / 2, cy = oy + 84;
  if (stage === 0) {
    const v = chain(cx - 2.5 * DX, cy + 8, 6, true);
    s += path(v) + carbonyl(v[2], 270);
    ['1', '2', '3', '4', '5', '6'].forEach((t, i) => { s += num(v[i], i === 2 ? 90 : (i % 2 ? 90 : 270), t, 14); });
  } else if (stage === 1) {
    const c2 = P(cx - 1.5 * L + 2, cy), c3 = P(c2.x + L, cy), c4 = P(c3.x + L, cy), c5 = P(c4.x + L, cy);
    const c1 = polar(c2, 210, L), c6 = polar(c5, 30, L);
    s += sk(c1, c2) + sk(c2, c3) + bond(c3, c4, TRI) + sk(c4, c5) + sk(c5, c6);
    s += num(c1, 270, '1', 14) + num(c2, 90, '2', 14) + num(c3, 270, '3', 16) + num(c4, 270, '4', 16) + num(c5, 270, '5', 14) + num(c6, 270, '6', 14);
    s += squiggle(c4, c5, 12);
  } else if (stage === 2) {
    const c2 = P(cx - L - 4, cy - 8), c3 = P(c2.x + L, c2.y), c4 = P(c3.x + L, c2.y);
    const c1 = polar(c2, 210, L), h = A(c4.x + L + 2, c2.y, 'H');
    s += sk(c1, c2) + sk(c2, c3) + bond(c3, c4, TRI) + bd(c4, h) + draw(h);
    s += num(c1, 270, '1', 14) + num(c2, 90, '2', 14) + num(c3, 270, '3', 16) + num(c4, 270, '4', 16);
    s += squiggle(c2, c3, 12);
    s += label(cx, cy + 40, '+ CH₃CH₂Br');
  } else {
    const h1 = A(cx - 52, cy - 8, 'H'), h2 = A(cx + 52, cy - 8, 'H');
    const c3 = P(cx - 13, cy - 8), c4 = P(cx + 13, cy - 8);
    s += bd(h1, c3) + bond(c3, c4, TRI) + bd(c4, h2) + draw(h1, h2);
    s += num(c3, 270, '3', 16) + num(c4, 270, '4', 16);
    s += label(cx, cy + 40, '+ 2 CH₃CH₂Br');
  }
  s += tag(cx, oy + h - 32, names[stage], { cls: 'fg-tag-mut' });
  s += tag(cx, oy + h - 13, next[stage], { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'hexanone-retro',
  section: 'retrosynthesis',
  anchor: 'Every piece is now purchasable, so the analysis stops.</p>',
  viewBox: '0 0 760 184',
  alt: 'Four panels joined by double-lined retrosynthesis arrows, with the carbons numbered 1 to 6 throughout. 1: hexan-3-one, C=O on carbon 3. 2: hex-3-yne, the triple bond between carbons 3 and 4 drawn straight, with a squiggle across the 4–5 bond. 3: but-1-yne, carbons 1 to 4, with a squiggle across the 2–3 bond, plus bromoethane. 4: acetylene, carbons 3 and 4, plus two bromoethanes.',
  build() {
    let s = '';
    const W = 164, G = 34;
    for (let i = 0; i < 4; i++) {
      const x = 4 + i * (W + G);
      s += hexStage(x, 4, W, 176, i);
      if (i < 3) s += retroH(x + W + 4, 88, G - 8);
    }
    return s;
  },
  caption: 'Carbons keep the target’s numbers throughout. The squiggle in each panel marks the bond the next panel breaks.',
});

FIGURES.push({
  id: 'l-hexanone-retro',
  lessons: ['retrosynthesis'],
  viewBox: '0 0 340 364',
  alt: 'Four panels in two rows, read in number order, with the carbons numbered 1 to 6 throughout. 1: hexan-3-one. 2: hex-3-yne, with a squiggle across the 4–5 bond. 3: but-1-yne plus bromoethane, with a squiggle across the 2–3 bond. 4: acetylene plus two bromoethanes.',
  build() {
    return hexStage(2, 2, 166, 176, 0) + hexStage(172, 2, 166, 176, 1) + hexStage(2, 186, 166, 176, 2) + hexStage(172, 186, 166, 176, 3);
  },
  caption: 'Read the panels in number order. Each squiggle marks the bond the next panel breaks.',
});

export default FIGURES;
