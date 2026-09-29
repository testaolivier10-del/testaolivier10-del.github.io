/* Figures for the aromaticity notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Lesson copies (id prefix l-) are 340 wide, stacked, and use only fg-lbl and
   fg-tag text. */
import { atom, bond, arrow, lonePair, text, tag, rule, P } from '../lib/ochem-figure.mjs';
import { ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';
import { frame, lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- helpers */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at `len` from c, `deg` measured counterclockwise from east. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const sm = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-sm', size: 10.5, anchor });
const tg = (x, y, s, cls = 'fg-tag', anchor = 'middle') => text(x, y, s, { cls, size: 11, anchor });
const chg = (p, s = '+') => text(p.x, p.y + 5, s, { cls: 'fg-warn', size: 16 });
const skb = (a, b, cls) => bond(a, b, { rFrom: 0, rTo: 0, cls });

/* A skeletal ring. `doubles` lists edge indices i (the bond from v[i] to
   v[i+1]) drawn as ring double bonds; `rot` 90 puts v[0] at the top and the
   vertices run counterclockwise. `atoms` maps a vertex index to a label, and
   bonds stop at that label's circle. */
function ring(cx, cy, n, r, doubles, opts = {}) {
  const v = polyPts(cx, cy, n, r, opts.rot ?? 90);
  const c = P(cx, cy);
  const atoms = opts.atoms || {};
  const rad0 = (i) => (atoms[i] ? (opts.atomR ?? 14) : 0);
  let s = '';
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = v[i], b = v[j];
    const cls = (opts.hiEdges || []).includes(i) ? 'fg-bond-hi' : undefined;
    if (doubles.includes(i)) {
      if (rad0(i) || rad0(j)) s += dbl(a, b, c, rad0(i), rad0(j), cls);
      else s += ringDouble(a, b, c, { inset: opts.inset ?? 7, gap: 4.4, cls });
    } else {
      s += bond(a, b, { rFrom: rad0(i), rTo: rad0(j), cls });
    }
  }
  for (const [i, l] of Object.entries(atoms)) {
    s += atom(v[i].x, v[i].y, l, { kind: 'hi', r: opts.atomR ?? 14, size: 12 });
  }
  return { s, v, c };
}

/* A ring double bond whose ends may stop at a labelled atom: the outer line
   is trimmed to the atom circle, the inner line is inset past it. */
function dbl(a, b, inward, rA, rB, cls) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  let px = -uy, py = ux;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  if ((inward.x - mx) * px + (inward.y - my) * py < 0) { px = -px; py = -py; }
  const gap = 4.6;
  const iA = Math.max(7, rA + 3), iB = Math.max(7, rB + 3);
  const A = P(a.x + ux * iA + px * gap, a.y + uy * iA + py * gap);
  const B = P(b.x - ux * iB + px * gap, b.y - uy * iB + py * gap);
  return bond(a, b, { rFrom: rA, rTo: rB, cls }) + skb(A, B, cls);
}

/* An H drawn on a skeletal vertex, `deg` counterclockwise from east. */
function hOn(v, deg, len = 26, kind) {
  const h = at(v, deg, len);
  return bond(v, h, { rFrom: 0, rTo: 10 }) + atom(h.x, h.y, 'H', { r: 10, size: 11, kind });
}

/* A lone pair on a skeletal carbon, pointing `deg` counterclockwise from east. */
const lpOn = (v, deg, d = 13) => lonePair(v.x, v.y, -deg, { dist: d, spread: 4.2, r: 2.3 });

/* A p orbital standing up and down through (x, y). `empty` draws dashed
   outlines: an orbital that holds no electrons. */
function pUp(x, y, o = {}) {
  const rx = o.rx ?? 10, ry = o.ry ?? 21, g = o.gap ?? 2;
  if (o.empty) {
    return `<ellipse class="fg-orb-node" cx="${r2(x)}" cy="${r2(y - g - ry)}" rx="${rx}" ry="${ry}"></ellipse>` +
           `<ellipse class="fg-orb-node" cx="${r2(x)}" cy="${r2(y + g + ry)}" rx="${rx}" ry="${ry}"></ellipse>`;
  }
  return lobeE(r2(x), r2(y - g - ry), rx, ry, 'fg-orb') + lobeE(r2(x), r2(y + g + ry), rx, ry, 'fg-orb-alt');
}

/* An electron drawn as a half-headed spin arrow on an energy level at y. */
function spin(x, y, up) {
  return up ? arrow(P(x, y + 7), P(x, y - 10), { size: 5 }) : arrow(P(x, y - 10), P(x, y + 7), { size: 5 });
}

/* ================================================================ 1 ======
   Heats of hydrogenation: the 36 kcal/mol read off a ladder. */
FIGURES.push({
  id: 'hydrogenation-energies',
  section: 'aromaticity',
  anchor: '',
  alt: 'An energy ladder. Every level is measured up from cyclohexane, the product of full hydrogenation. Cyclohexene sits 28.6 kcal/mol up; cyclohexa-1,3-diene 55.4, close to the 57.2 predicted for two separate C=C bonds; an imaginary cyclohexatriene with three fixed C=C bonds would sit at 3 × 28.6 = 85.8, drawn dashed. Real benzene sits at 49.8. The gap between 85.8 and 49.8 is marked: 36 kcal/mol of aromatic stabilization.',
  viewBox: '0 0 760 372',
  build() {
    let s = '';
    const base = 330, k = 2.6;
    s += frame(40, base, 30, 740);
    s += tg(52, 34, 'heat released on adding H₂ (kcal/mol)', 'fg-tag', 'start');
    const cols = [
      { cx: 130, e: 28.6, name: 'cyclohexene', d: [0] },
      { cx: 292, e: 55.4, name: 'cyclohexa-1,3-diene', d: [0, 2], sub: '(two separate C=C: 57.2)' },
      { cx: 454, e: 85.8, name: '“cyclohexatriene”', d: [0, 2, 4], dash: true, val: '3 × 28.6 = 85.8, imaginary' },
      { cx: 596, e: 49.8, name: 'benzene', d: [0, 2, 4] },
    ];
    for (const c of cols) {
      const y = base - c.e * k;
      s += `<line class="${c.dash ? 'fg-dash' : 'fg-bond'}" x1="${c.cx - 48}" y1="${r2(y)}" x2="${c.cx + 48}" y2="${r2(y)}"></line>`;
      s += ring(c.cx, y - 34, 6, 19, c.d, { inset: 5 }).s;
      s += tg(c.cx, y - 62, c.name);
      s += sm(c.cx, y + 17, c.val || String(c.e));
      if (c.sub) s += sm(c.cx, y + 32, c.sub);
    }
    /* The gap: prediction minus benzene. */
    const yT = base - 85.8 * k, yB = base - 49.8 * k;
    s += `<line class="fg-dash" x1="${454 + 52}" y1="${r2(yT)}" x2="676" y2="${r2(yT)}"></line>`;
    const mid = (yT + yB) / 2;
    s += arrow(P(664, mid), P(664, yT + 1), { size: 6 }) + arrow(P(664, mid), P(664, yB - 1), { size: 6 });
    s += text(676, mid - 8, '36 kcal/mol', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += sm(676, mid + 10, 'aromatic', 'start');
    s += sm(676, mid + 25, 'stabilization', 'start');
    s += sm(390, base + 22, 'cyclohexane: the end point of every hydrogenation here');
    return s;
  },
  caption: 'Every level is measured up from cyclohexane. Compare the dashed prediction with real benzene.',
});

/* ================================================================ 2 ======
   Benzene's six parallel p orbitals, flat and tilted. */
function tilted(cx, cy, R, o = {}) {
  const ry = 0.42;
  const pts = [0, 60, 120, 180, 240, 300].map((d) => P(cx + R * Math.cos(rad(d)), cy + ry * R * Math.sin(rad(d))));
  let s = '';
  /* Back lobes first, then the ring, then the front lobes on top. */
  const order = pts.map((p, i) => ({ p, i })).sort((a, b) => a.p.y - b.p.y);
  for (const { p } of order) s += pUp(p.x, p.y, { rx: o.rx ?? 9, ry: o.ry ?? 19 });
  for (let i = 0; i < 6; i++) s += skb(pts[i], pts[(i + 1) % 6]);
  for (const p of pts) s += `<circle class="fg-lp" cx="${r2(p.x)}" cy="${r2(p.y)}" r="3"></circle>`;
  return { s, pts };
}

FIGURES.push({
  id: 'benzene-p-orbitals',
  section: 'aromaticity',
  anchor: '',
  alt: 'Left: benzene drawn flat from above, a hexagon with three double bonds. Right: the same ring tilted, seen from the side and a little above. A p orbital stands straight up and down through each of the six carbons, and all six are parallel to one another.',
  viewBox: '0 0 760 296',
  build() {
    let s = '';
    s += tg(170, 34, 'BENZENE, DRAWN FROM ABOVE');
    s += ring(170, 140, 6, 50, [0, 2, 4]).s;
    s += lbl(170, 232, 'six carbons in one ring');
    s += sm(170, 252, 'each carbon has one C=C and is sp²');
    s += rule(330, 30, 330, 270);
    s += tg(545, 34, 'THE SAME RING, TILTED: ITS p ORBITALS');
    s += tilted(545, 150, 120).s;
    s += lbl(545, 252, 'six p orbitals, all parallel');
    s += sm(545, 272, 'one per carbon, standing straight up from the flat ring');
    return s;
  },
  caption: 'Left: the usual drawing. Right: the same six carbons tilted to show the p orbital on each one.',
});

FIGURES.push({
  id: 'l-benzene-p',
  lessons: ['aromaticity'],
  anchor: '',
  alt: 'Benzene tilted to show its six carbons in one flat ring, with a p orbital standing straight up and down through each carbon. All six p orbitals are parallel.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    s += tg(170, 24, 'BENZENE, TILTED');
    s += tilted(170, 140, 118).s;
    s += lbl(170, 250, 'six p orbitals, all parallel');
    s += tg(170, 274, 'a flat ring of six sp² carbons');
    return s;
  },
  caption: 'Every carbon supplies one p orbital, and the flat ring lets all six line up.',
});

/* ================================================================ 3 ======
   Frost circles. The polygon sits in the circle vertex-down; each vertex
   height is an orbital energy, copied across to a level diagram. */
function frost(cx, cy, n, R, fill, levelX) {
  let s = '';
  s += `<circle class="fg-orb-node" cx="${cx}" cy="${cy}" r="${R}" fill="none"></circle>`;
  const v = [];
  for (let i = 0; i < n; i++) {
    const a = rad(90 + (i * 360) / n);
    v.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
  }
  for (let i = 0; i < n; i++) s += bond(v[i], v[(i + 1) % n], { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
  for (const p of v) s += `<circle class="fg-lp" cx="${r2(p.x)}" cy="${r2(p.y)}" r="2.6"></circle>`;
  /* Group vertices by height, lowest (largest y) first. */
  const groups = [];
  for (const p of [...v].sort((a, b) => b.y - a.y)) {
    const g = groups.find((q) => Math.abs(q.y - p.y) < 0.5);
    if (g) g.k++; else groups.push({ y: p.y, k: 1 });
  }
  let e = fill;
  for (const g of groups) {
    const xs = g.k === 1 ? [levelX + 32] : [levelX + 14, levelX + 50];
    for (const x of xs) {
      s += `<line class="fg-bond" x1="${r2(x - 14)}" y1="${r2(g.y)}" x2="${r2(x + 14)}" y2="${r2(g.y)}"></line>`;
    }
    /* Fill the level: one electron per orbital first (Hund), then pair. */
    const count = Math.min(e, 2 * xs.length);
    e -= count;
    const per = xs.map((_, i) => (count > i ? 1 : 0) + (count - xs.length > i ? 1 : 0));
    xs.forEach((x, i) => {
      if (per[i] === 2) s += spin(x - 4, g.y, true) + spin(x + 4, g.y, false);
      else if (per[i] === 1) s += spin(x, g.y, true);
    });
  }
  return s;
}

FIGURES.push({
  id: 'frost-circles',
  section: 'aromaticity',
  anchor: '',
  alt: 'Three Frost circles, each with an energy-level diagram beside it. Benzene: a hexagon in a circle, one vertex at the bottom; its six levels are one at the bottom, then two pairs, then one at the top, and its six electrons fill the bottom level and the lower pair. Cyclobutadiene: a square; its levels are one at the bottom, a pair on the center line, and one at the top; its four electrons fill the bottom level and put one unpaired electron in each orbital of the middle pair. Cyclopentadienyl anion: a pentagon; one bottom level and two pairs; its six electrons fill the bottom level and the lower pair.',
  viewBox: '0 0 760 336',
  build() {
    let s = '';
    const CY = 150, R = 46;
    const panels = [
      { cx: 127, n: 6, title: 'BENZENE', pi: '6 π electrons', e: 6, detail: 'every bonding orbital full', verdict: 'AROMATIC', kind: 'fg-tag-good' },
      { cx: 380, n: 4, title: 'CYCLOBUTADIENE', pi: '4 π electrons', e: 4, detail: 'two unpaired electrons', verdict: 'ANTIAROMATIC', kind: 'fg-tag-warn' },
      { cx: 633, n: 5, title: 'CYCLOPENTADIENYL ANION', pi: '6 π electrons', e: 6, detail: 'every bonding orbital full', verdict: 'AROMATIC', kind: 'fg-tag-good' },
    ];
    for (const p of panels) {
      s += tag(p.cx, 36, p.title);
      s += `<line class="fg-dash" x1="${p.cx - 110}" y1="${CY}" x2="${p.cx + 112}" y2="${CY}"></line>`;
      s += frost(p.cx - 52, CY, p.n, R, p.e, p.cx + 20);
      s += text(p.cx + 52, 72, 'energy', { cls: 'fg-sm', size: 10.5 });
      s += text(p.cx, 238, p.pi, { cls: 'fg-lbl', size: 13 });
      s += sm(p.cx, 258, p.detail);
      s += tg(p.cx, 282, p.verdict, p.kind);
    }
    s += rule(253, 52, 253, 292);
    s += rule(507, 52, 507, 292);
    s += sm(380, 320, 'Below the dashed line an orbital is bonding; on it, nonbonding; above it, antibonding.');
    return s;
  },
  caption: 'In each panel, match every corner of the polygon to the level at the same height on its right, then compare the top filled levels.',
});

FIGURES.push({
  id: 'l-frost',
  lessons: ['aromaticity'],
  anchor: '',
  alt: 'Two Frost circles, stacked. Top, benzene: a hexagon in a circle with a vertex at the bottom; its six electrons fill the lowest level and the pair above it. Bottom, cyclobutadiene: a square in a circle; its four electrons fill the lowest level and put one unpaired electron in each orbital of the pair on the center line.',
  viewBox: '0 0 340 452',
  build() {
    let s = '';
    const rows = [
      { y0: 0, n: 6, e: 6, title: 'BENZENE · 6 π ELECTRONS', line: 'every bonding orbital full', verdict: 'AROMATIC', kind: 'fg-tag-good' },
      { y0: 214, n: 4, e: 4, title: 'CYCLOBUTADIENE · 4 π ELECTRONS', line: 'two electrons left unpaired', verdict: 'ANTIAROMATIC', kind: 'fg-tag-warn' },
    ];
    for (const r of rows) {
      const cy = r.y0 + 102;
      s += tag(170, r.y0 + 24, r.title);
      s += `<line class="fg-dash" x1="30" y1="${cy}" x2="310" y2="${cy}"></line>`;
      s += frost(100, cy, r.n, 48, r.e, 200);
      s += lbl(170, r.y0 + 178, r.line);
      s += tg(170, r.y0 + 198, r.verdict, r.kind);
    }
    s += rule(20, 206, 320, 206);
    s += tg(170, 440, 'dashed line: bonding below, antibonding above');
    return s;
  },
  caption: 'The ring sits vertex-down in each circle; each vertex height is one orbital.',
});

/* ================================================================ 4 ======
   Pyrrole and pyridine: where the nitrogen lone pair points. */
function edgeRow(cx, y, n, step, hetero, pairMode, o = {}) {
  let s = '';
  const x0 = cx - (step * (n - 1)) / 2;
  s += `<line class="fg-bond-soft" x1="${r2(pairMode.includes('side') ? x0 : x0 - 22)}" y1="${y}" x2="${r2(x0 + step * (n - 1) + 22)}" y2="${y}"></line>`;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step;
    s += pUp(x, y, { rx: 10, ry: 20 });
  }
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step;
    s += atom(x, y, i === 0 ? hetero : 'C', { kind: i === 0 ? 'hi' : 'plain', r: 13, size: 11 });
  }
  if (pairMode.includes('up')) s += lonePair(x0, y, -90, { dist: 24 });
  if (pairMode.includes('side')) s += lonePair(x0, y, 180, { dist: 22 });
  return { s, x0 };
}

FIGURES.push({
  id: 'pyrrole-pyridine-lone-pairs',
  section: 'aromaticity',
  anchor: '',
  alt: 'Pyrrole and pyridine compared. Each is drawn as a skeletal ring and again edge-on, as a row of atoms along the ring plane with a p orbital above and below each one. Pyrrole: the nitrogen carries an H and no ring double bond, and its lone pair sits in the upper lobe of its p orbital. Pyridine: the nitrogen has a C=N double bond, and its lone pair lies on the ring-plane line, pointing outward away from the ring.',
  viewBox: '0 0 760 404',
  build() {
    let s = '';
    const cases = [
      { cx: 190, n: 5, name: 'PYRROLE', nh: true, pair: 'up',
        l1: 'the lone pair sits in the p orbital', l2: '2 C=C (4) + the lone pair (2) = 6 π', l3: 'aromatic; the pair is part of the ring' },
      { cx: 570, n: 6, name: 'PYRIDINE', nh: false, pair: 'side',
        l1: 'the lone pair lies in the ring plane', l2: '2 C=C + 1 C=N = 6 π; the pair counts 0', l3: 'aromatic; the pair points outward, free' },
    ];
    for (const c of cases) {
      s += tag(c.cx, 34, c.name);
      /* Nitrogen at the bottom vertex (rot 270), vertices counterclockwise. */
      const doubles = c.n === 5 ? [1, 3] : [0, 2, 4];
      const R = c.n === 5 ? 38 : 40;
      const rg = ring(c.cx, 102, c.n, R, doubles, { rot: 270, atoms: { 0: 'N' } });
      s += rg.s;
      const N = rg.v[0];
      if (c.nh) s += bond(N, P(N.x, N.y + 34), { rFrom: 14, rTo: 10 }) + atom(N.x, N.y + 34, 'H', { r: 10, size: 11 });
      else s += lonePair(N.x, N.y, 90, { dist: 22 });
      s += sm(c.cx, 208, 'the same ring, seen edge-on');
      s += edgeRow(c.cx, 278, c.n, c.n === 5 ? 44 : 40, 'N', c.pair).s;
      s += lbl(c.cx, 348, c.l1);
      s += sm(c.cx, 368, c.l2);
      s += tg(c.cx, 390, c.l3, 'fg-tag-good');
    }
    s += rule(380, 52, 380, 396);
    return s;
  },
  caption: 'Top: each ring as it is usually drawn. Middle: the same ring seen edge-on, with the ring plane as a line. Find the two dots on each nitrogen.',
});

FIGURES.push({
  id: 'l-pyrrole-pyridine',
  lessons: ['aromaticity'],
  anchor: '',
  alt: 'Pyrrole above, pyridine below. Each is drawn as a skeletal ring and again edge-on, with a p orbital above and below each ring atom. In pyrrole the nitrogen lone pair sits in the upper lobe of its p orbital. In pyridine the lone pair lies on the ring-plane line, pointing outward.',
  viewBox: '0 0 340 578',
  build() {
    let s = '';
    const cases = [
      { y0: 0, n: 5, name: 'PYRROLE', nh: true, pair: 'up', l1: 'pair in the p orbital: counts 2', l2: '2 C=C + the pair = 6 π' },
      { y0: 290, n: 6, name: 'PYRIDINE', nh: false, pair: 'side', l1: 'pair in the ring plane: counts 0', l2: '2 C=C + 1 C=N = 6 π' },
    ];
    for (const c of cases) {
      s += tag(170, c.y0 + 22, c.name);
      const doubles = c.n === 5 ? [1, 3] : [0, 2, 4];
      const rg = ring(88, c.y0 + 74, c.n, c.n === 5 ? 30 : 32, doubles, { rot: 270, atoms: { 0: 'N' }, atomR: 13 });
      s += rg.s;
      const N = rg.v[0];
      if (c.nh) s += bond(N, P(N.x + 30, N.y + 12), { rFrom: 13, rTo: 10 }) + atom(N.x + 30, N.y + 12, 'H', { r: 10, size: 11 });
      else s += lonePair(N.x, N.y, 90, { dist: 20 });
      s += tg(236, c.y0 + 66, 'seen edge-on,');
      s += tg(236, c.y0 + 82, 'below');
      s += edgeRow(170, c.y0 + 194, c.n, c.n === 5 ? 44 : 40, 'N', c.pair).s;
      s += lbl(170, c.y0 + 254, c.l1);
      s += tg(170, c.y0 + 274, c.l2, 'fg-tag-good');
    }
    s += rule(20, 284, 320, 284);
    return s;
  },
  caption: 'Find the nitrogen&rsquo;s two dots: up in the p orbital, or out in the ring plane.',
});

/* ================================================================ 5 ======
   Furan (two lone pairs on O) and imidazole (two different nitrogens). */
FIGURES.push({
  id: 'furan-imidazole',
  section: 'aromaticity',
  anchor: '',
  alt: 'Left: furan, a five-membered ring of four carbons and one oxygen with two C=C bonds. Seen edge-on, the oxygen has one lone pair in the upper lobe of its p orbital and a second lone pair on the ring-plane line, pointing outward. Right: imidazole, a five-membered ring with two nitrogens. N1 carries an H and its lone pair is in the p orbital; N3 has a C=N double bond and its lone pair points outward in the ring plane.',
  viewBox: '0 0 760 392',
  build() {
    let s = '';
    /* Furan */
    s += tag(190, 34, 'FURAN');
    const f = ring(190, 104, 5, 38, [1, 3], { rot: 270, atoms: { 0: 'O' } });
    s += f.s;
    s += lonePair(f.v[0].x, f.v[0].y, 90, { dist: 22 });
    s += sm(190, 208, 'the same ring, seen edge-on');
    s += edgeRow(190, 278, 5, 44, 'O', 'up side').s;
    s += lbl(190, 350, 'one pair in the p orbital, one in the plane');
    s += sm(190, 370, '2 C=C (4) + one lone pair (2) = 6 π');
    s += tg(190, 388, 'aromatic; thiophene’s S does the same', 'fg-tag-good');
    s += rule(380, 52, 380, 384);
    /* Imidazole: N1 (bottom, N–H), C2 (lower left), N3 (upper left),
       C4 (upper right), C5 (lower right). Vertices run counterclockwise
       from the bottom, so v1 is lower right. */
    s += tag(570, 34, 'IMIDAZOLE');
    const cx = 570, cy = 118;
    const im = ring(cx, cy, 5, 42, [1, 3], { rot: 270, atoms: { 0: 'N', 3: 'N' } });
    s += im.s;
    const N1 = im.v[0], N3 = im.v[3];
    s += bond(N1, P(N1.x, N1.y + 34), { rFrom: 14, rTo: 10 }) + atom(N1.x, N1.y + 34, 'H', { r: 10, size: 11 });
    s += lonePair(N3.x, N3.y, -126, { dist: 22 });
    s += text(N3.x + 8, N3.y - 20, 'N3', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(N1.x - 22, N1.y + 4, 'N1', { cls: 'fg-tag', size: 11, anchor: 'end' });
    s += tg(N3.x - 34, N3.y + 2, 'pair in the plane: 0', 'fg-tag', 'end');
    s += tg(N1.x + 20, N1.y + 38, 'pair in the p orbital: 2', 'fg-tag', 'start');
    s += lbl(570, 262, 'N1 is like pyrrole’s N; N3 is like pyridine’s');
    s += sm(570, 284, 'C=C (2) + C=N (2) + the N1 lone pair (2) = 6 π');
    s += tg(570, 306, 'aromatic; N3 is the basic nitrogen', 'fg-tag-good');
    return s;
  },
  caption: 'Left: furan, the ring on top and the same ring edge-on below. Right: imidazole, whose two nitrogens do different jobs.',
});

/* ================================================================ 6 ======
   Cyclopentadiene and its two ions. */
function cp5(cx, cy, r, kind) {
  const rg = ring(cx, cy, 5, r, [1, 3]);
  let s = rg.s;
  const t = rg.v[0];
  if (kind === 'diene') s += hOn(t, 125) + hOn(t, 55);
  else {
    s += hOn(t, 90);
    if (kind === 'cation') s += chg(at(t, 22, 20));
    else s += lpOn(t, 158, 17) + chg(at(t, 26, 20), '−');
  }
  return s;
}

FIGURES.push({
  id: 'cyclopentadienyl-trio',
  section: 'aromaticity',
  anchor: '',
  alt: 'Center: cyclopentadiene, a five-carbon ring with two C=C bonds and a CH2 at the top, both hydrogens drawn. An arrow labeled minus H− (hydride) leads left to the cyclopentadienyl cation: the top carbon keeps one H and carries a positive charge and an empty p orbital; 2 C=C plus the empty p orbital gives 4 π electrons, antiaromatic. An arrow labeled minus H+ leads right to the cyclopentadienyl anion: the top carbon keeps one H and carries a lone pair and a negative charge; 2 C=C plus the lone pair gives 6 π electrons, aromatic. Cyclopentadiene itself is nonaromatic: its sp3 CH2 breaks the loop.',
  viewBox: '0 0 760 256',
  build() {
    let s = '';
    const cols = [
      { cx: 128, kind: 'cation', name: 'cyclopentadienyl cation', l1: '2 C=C + empty p = 4 π', l2: '4 is a 4n number (n = 1)', v: 'ANTIAROMATIC', k: 'fg-tag-warn' },
      { cx: 380, kind: 'diene', name: 'cyclopentadiene', l1: 'the sp³ CH₂ breaks the loop', l2: 'no continuous ring of p orbitals', v: 'NONAROMATIC', k: 'fg-tag-mut' },
      { cx: 632, kind: 'anion', name: 'cyclopentadienyl anion', l1: '2 C=C + lone pair = 6 π', l2: '6 = 4n + 2 (n = 1)', v: 'AROMATIC', k: 'fg-tag-good' },
    ];
    for (const c of cols) {
      s += tg(c.cx, 30, c.name);
      s += cp5(c.cx, 118, 36, c.kind);
      s += lbl(c.cx, 196, c.l1);
      s += sm(c.cx, 216, c.l2);
      s += tg(c.cx, 240, c.v, c.k);
    }
    s += arrow(P(322, 122), P(196, 122));
    s += sm(259, 110, '− H⁻');
    s += arrow(P(438, 122), P(564, 122));
    s += sm(501, 110, '− H⁺');
    return s;
  },
  caption: 'One carbon skeleton, three answers. Follow the top carbon: two hydrogens in the middle, then an empty p orbital on the left or a lone pair on the right.',
});

FIGURES.push({
  id: 'l-cp-trio',
  lessons: ['aromaticity'],
  anchor: '',
  alt: 'Three five-carbon rings stacked. Cyclopentadiene: two C=C and a CH2; nonaromatic. The cyclopentadienyl cation: the top carbon carries a positive charge and an empty p orbital, 4 π electrons; antiaromatic. The cyclopentadienyl anion: the top carbon carries a lone pair and a negative charge, 6 π electrons; aromatic.',
  viewBox: '0 0 340 396',
  build() {
    let s = '';
    const rows = [
      { y: 76, kind: 'diene', name: 'CYCLOPENTADIENE', l1: 'sp³ CH₂ breaks the loop', v: 'NONAROMATIC', k: 'fg-tag-mut' },
      { y: 206, kind: 'cation', name: 'THE CATION (− H⁻)', l1: '2 C=C + empty p = 4 π', v: 'ANTIAROMATIC', k: 'fg-tag-warn' },
      { y: 336, kind: 'anion', name: 'THE ANION (− H⁺)', l1: '2 C=C + lone pair = 6 π', v: 'AROMATIC', k: 'fg-tag-good' },
    ];
    for (const r of rows) {
      s += cp5(68, r.y, 32, r.kind);
      s += tg(138, r.y - 14, r.name, 'fg-tag', 'start');
      s += text(138, r.y + 8, r.l1, { cls: 'fg-lbl', size: 13, anchor: 'start' });
      s += tg(138, r.y + 30, r.v, r.k, 'start');
    }
    s += rule(20, 142, 320, 142);
    s += rule(20, 272, 320, 272);
    return s;
  },
  caption: 'Same five carbons; only the top carbon changes.',
});

/* ================================================================ 7 ======
   Tropylium and the cyclopropenyl cation. */
function c7(cx, cy, r, cation) {
  const rg = ring(cx, cy, 7, r, [1, 3, 5]);
  let s = rg.s;
  const t = rg.v[0];
  if (cation) s += hOn(t, 90) + chg(at(t, 22, 20));
  else s += hOn(t, 125) + hOn(t, 55);
  return s;
}
function c3(cx, cy, r) {
  const rg = ring(cx, cy, 3, r, [1]);
  const t = rg.v[0];
  return rg.s + hOn(t, 90) + chg(at(t, 22, 20));
}

FIGURES.push({
  id: 'tropylium-cyclopropenyl',
  section: 'aromaticity',
  anchor: '',
  alt: 'Left: cycloheptatriene, a seven-carbon ring with three C=C bonds and a CH2 at the top, loses a hydride (minus H−) to give the tropylium ion, whose top carbon keeps one H and carries a positive charge and an empty p orbital; 3 C=C plus the empty p orbital gives 6 π electrons, aromatic. Right: the cyclopropenyl cation, a three-carbon ring with one C=C and a positive charge on the third carbon; 1 C=C plus the empty p orbital gives 2 π electrons, aromatic with n = 0.',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    s += tg(110, 30, 'cycloheptatriene');
    s += c7(110, 122, 40, false);
    s += lbl(110, 200, 'sp³ CH₂: nonaromatic');
    s += arrow(P(168, 122), P(262, 122));
    s += sm(215, 110, '− H⁻');
    s += tg(330, 30, 'tropylium (cycloheptatrienyl) cation');
    s += c7(330, 122, 40, true);
    s += lbl(330, 200, '3 C=C + empty p = 6 π');
    s += sm(330, 220, '6 = 4n + 2 (n = 1)');
    s += tg(330, 244, 'AROMATIC', 'fg-tag-good');
    s += rule(480, 44, 480, 256);
    s += tg(620, 30, 'cyclopropenyl cation');
    s += c3(620, 132, 34);
    s += lbl(620, 200, '1 C=C + empty p = 2 π');
    s += sm(620, 220, '2 = 4n + 2 (n = 0)');
    s += tg(620, 244, 'AROMATIC', 'fg-tag-good');
    return s;
  },
  caption: 'Left: cycloheptatriene loses a hydride from its CH₂ to give tropylium. Right: the cyclopropenyl cation, the smallest aromatic ring.',
});

/* ================================================================ 8 ======
   Cyclooctatetraene: flat (hypothetical) versus tub. The tub is built in 3D
   with D2d symmetry: C1=C2 and C5=C6 run along x high up; C3=C4 and C7=C8
   run along y low down. Each carbon's p orbital is taken as the normal to the
   plane through it and its two ring neighbors, then projected. */
const TUB = (() => {
  const a = 1.55, h = 0.39, d = 0.67;
  return [
    [d, a, h], [-d, a, h], [-a, d, -h], [-a, -d, -h],
    [-d, -a, h], [d, -a, h], [a, -d, -h], [a, d, -h],
  ];
})();
function tubDraw(cx, cy, scale, o = {}) {
  const phi = rad(o.phi ?? 80), tilt = rad(o.tilt ?? 25);
  const proj = ([x, y, z]) => {
    const x1 = x * Math.cos(phi) - y * Math.sin(phi);
    const y1 = x * Math.sin(phi) + y * Math.cos(phi);
    const y2 = y1 * Math.cos(tilt) - z * Math.sin(tilt);
    const z2 = y1 * Math.sin(tilt) + z * Math.cos(tilt);
    return { x: cx + x1 * scale, y: cy - z2 * scale, depth: y2 };
  };
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const pts = TUB.map(proj);
  let s = '';
  /* p orbitals: two lobes along the projected normal. */
  const lobes = [];
  TUB.forEach((p, i) => {
    const prev = TUB[(i + 7) % 8], next = TUB[(i + 1) % 8];
    let nrm = cross(sub(prev, p), sub(next, p));
    const L = Math.hypot(...nrm); nrm = nrm.map((c) => c / L);
    /* Point the normal away from the ring's center axis (up-ish). */
    if (nrm[2] < 0) nrm = nrm.map((c) => -c);
    const tip = proj([p[0] + nrm[0], p[1] + nrm[1], p[2] + nrm[2]]);
    const base = pts[i];
    const dx = tip.x - base.x, dy = tip.y - base.y;
    const len = Math.hypot(dx, dy) || 1;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    const lob = (sign, cls) => {
      const c = P(base.x + (dx / len) * (o.lobe ?? 17) * sign, base.y + (dy / len) * (o.lobe ?? 17) * sign);
      return `<ellipse class="${cls}" cx="${r2(c.x)}" cy="${r2(c.y)}" rx="${o.lobe ?? 17}" ry="7" fill-opacity="0.18" transform="rotate(${r2(ang)} ${r2(c.x)} ${r2(c.y)})"></ellipse>`;
    };
    lobes.push({ depth: base.depth, s: lob(1, 'fg-orb') + lob(-1, 'fg-orb-alt') });
  });
  lobes.sort((p, q) => q.depth - p.depth);
  if (!o.noLobes) for (const l of lobes) s += l.s;
  /* Bonds, far ones first. C1=C2, C3=C4, C5=C6, C7=C8 are double. */
  const edges = [];
  for (let i = 0; i < 8; i++) edges.push({ i, j: (i + 1) % 8, dbl: i % 2 === 0, depth: (pts[i].depth + pts[(i + 1) % 8].depth) / 2 });
  edges.sort((p, q) => q.depth - p.depth);
  for (const e of edges) {
    const A = pts[e.i], B = pts[e.j];
    s += e.dbl ? bond(A, B, { rFrom: 0, rTo: 0, order: 2, gap: 2.6 }) : skb(A, B);
  }
  for (const p of pts) s += `<circle class="fg-lp" cx="${r2(p.x)}" cy="${r2(p.y)}" r="2.6"></circle>`;
  return s;
}
function flatRow(cx, y, step) {
  let s = '';
  const x0 = cx - (step * 7) / 2;
  s += `<line class="fg-bond-soft" x1="${r2(x0 - 16)}" y1="${y}" x2="${r2(x0 + step * 7 + 16)}" y2="${y}"></line>`;
  for (let i = 0; i < 8; i++) s += pUp(x0 + i * step, y, { rx: 9, ry: 19 });
  for (let i = 0; i < 8; i++) s += `<circle class="fg-lp" cx="${r2(x0 + i * step)}" cy="${y}" r="3"></circle>`;
  return s;
}

FIGURES.push({
  id: 'cot-tub',
  section: 'aromaticity',
  anchor: '',
  alt: 'Left: cyclooctatetraene as it would be if flat, seen edge-on: eight carbons in a line with eight parallel p orbitals, 8 π electrons in one loop, a 4n count, antiaromatic; the flat octagon would also need 135 degree angles. Right: real cyclooctatetraene, a tub. Two C=C bonds form the raised rims and two form the floor. The p orbitals drawn on each carbon point in different directions on either side of each single bond, so they barely overlap there.',
  viewBox: '0 0 760 316',
  build() {
    let s = '';
    s += tg(190, 32, 'IF COT WERE FLAT (IT IS NOT)');
    s += sm(190, 54, 'edge-on view');
    s += flatRow(190, 140, 36);
    s += lbl(190, 222, 'eight parallel p orbitals, one loop');
    s += sm(190, 242, '8 π electrons: 4n (n = 2)');
    s += tg(190, 266, 'WOULD BE ANTIAROMATIC', 'fg-tag-warn');
    s += sm(190, 288, 'and each angle would be 135°, far from sp²’s 120°');
    s += rule(380, 44, 380, 296);
    s += tg(570, 32, 'REAL COT: A TUB');
    s += tubDraw(570, 112, 58);
    s += lbl(570, 236, 'neighboring C=C bonds tilt apart');
    s += sm(570, 256, 'across each single bond the p orbitals barely overlap');
    s += tg(570, 280, 'NONAROMATIC: FOUR SEPARATE C=C', 'fg-tag-mut');
    return s;
  },
  caption: 'Left: the flat ring that cyclooctatetraene avoids. Right: the tub it adopts, with a p orbital drawn on each carbon. Compare the directions of the p orbitals on either side of each single bond.',
});

FIGURES.push({
  id: 'l-cot',
  lessons: ['aromaticity'],
  anchor: '',
  alt: 'Top: cyclooctatetraene drawn as if flat, edge-on, with eight parallel p orbitals: 8 π electrons, a 4n count, which would be antiaromatic. Bottom: real cyclooctatetraene, a tub; the p orbitals on either side of each single bond point in different directions and barely overlap.',
  viewBox: '0 0 340 488',
  build() {
    let s = '';
    s += tg(170, 22, 'IF COT WERE FLAT (IT IS NOT)');
    s += flatRow(170, 104, 36);
    s += lbl(170, 180, '8 π electrons in one loop');
    s += tg(170, 200, 'WOULD BE ANTIAROMATIC', 'fg-tag-warn');
    s += rule(20, 218, 320, 218);
    s += tg(170, 244, 'REAL COT: A TUB');
    s += tubDraw(170, 322, 54);
    s += lbl(170, 448, 'p orbitals tilt apart at single bonds');
    s += tg(170, 470, 'NONAROMATIC: FOUR SEPARATE C=C', 'fg-tag-mut');
    return s;
  },
  caption: 'Flat, the eight p orbitals would form one loop. In the tub they do not.',
});

/* ================================================================ 9 ======
   Naphthalene and [10]annulene. Two pointy-top hexagons sharing a vertical
   edge; the annulene is the same outline with the middle bond gone. */
function twoHex(cx, cy, r) {
  const w = r * Math.cos(rad(30));
  const L = polyPts(cx - w, cy, 6, r, 90), Rr = polyPts(cx + w, cy, 6, r, 90);
  return { L, R: Rr, cL: P(cx - w, cy), cR: P(cx + w, cy), top: L[5], bot: L[4] };
}

FIGURES.push({
  id: 'naphthalene-annulene',
  section: 'aromaticity',
  anchor: '',
  alt: 'Left: naphthalene, two benzene rings sharing one edge, drawn with five double bonds; the shared edge is highlighted, and its two carbons belong to both rings. Ten π electrons over ten carbons, aromatic. Right: [10]annulene, the same ten-carbon outline without the middle bond. The two carbons where naphthalene has its shared edge each carry a hydrogen pointing into the ring, and the two hydrogens collide, so the ring twists out of plane and is not aromatic.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    /* Naphthalene: Kekulé structure with C4a=C8a double (the shared edge). */
    s += tg(190, 30, 'NAPHTHALENE');
    const n = twoHex(190, 124, 44);
    const { L, R, cL, cR } = n;
    s += skb(L[0], L[5]) + ringDouble(L[0], L[1], cL, { inset: 7, gap: 4.4 }) + skb(L[1], L[2]) +
         ringDouble(L[2], L[3], cL, { inset: 7, gap: 4.4 }) + skb(L[3], L[4]);
    s += ringDouble(R[0], R[5], cR, { inset: 7, gap: 4.4 }) + skb(R[5], R[4]) +
         ringDouble(R[4], R[3], cR, { inset: 7, gap: 4.4 }) + skb(R[3], R[2]) + skb(R[0], R[1]);
    s += ringDouble(L[5], L[4], cL, { inset: 7, gap: 4.4, cls: 'fg-bond-hi' });
    s += tg(190, 206, 'shared edge: its two carbons are in both rings', 'fg-tag');
    s += lbl(190, 232, '10 π electrons over 10 carbons');
    s += tg(190, 256, 'AROMATIC', 'fg-tag-good');
    s += rule(380, 44, 380, 276);
    /* [10]annulene: same outline, no middle bond, two inside H. */
    s += tg(570, 30, '[10]ANNULENE');
    const a = twoHex(570, 124, 44);
    const P0 = a.R[0], P1 = a.R[5], P2 = a.R[4], P3 = a.R[3], P4 = a.bot, P5 = a.L[3], P6 = a.L[2], P7 = a.L[1], P8 = a.L[0], P9 = a.top;
    const per = [P0, P1, P2, P3, P4, P5, P6, P7, P8, P9];
    const ctr = P(570, 124);
    for (let i = 0; i < 10; i++) {
      const A = per[i], B = per[(i + 1) % 10];
      const inward = i < 4 ? a.cR : i < 5 ? ctr : i < 9 ? a.cL : ctr;
      s += i % 2 === 0 ? ringDouble(A, B, inward, { inset: 7, gap: 4.4 }) : skb(A, B);
    }
    s += bond(a.top, P(570, a.top.y + 13), { rFrom: 0, rTo: 8 }) + atom(570, a.top.y + 13, 'H', { kind: 'warn', r: 8, size: 10 });
    s += bond(a.bot, P(570, a.bot.y - 13), { rFrom: 0, rTo: 8 }) + atom(570, a.bot.y - 13, 'H', { kind: 'warn', r: 8, size: 10 });
    s += tg(570, 206, 'these two inside H collide', 'fg-tag-warn');
    s += lbl(570, 232, '10 π electrons, but not flat');
    s += tg(570, 256, 'NOT AROMATIC', 'fg-tag-warn');
    return s;
  },
  caption: 'Left: naphthalene, with its shared edge highlighted. Right: [10]annulene drawn in the same outline, where the middle bond is replaced by two hydrogens pointing inward.',
});

/* ================================================================ 10 =====
   Lesson: four rings to classify, labelled A to D. */
FIGURES.push({
  id: 'l-classify-rings',
  lessons: ['aromaticity'],
  anchor: '',
  alt: 'Four rings. A: the tropylium cation, a seven-carbon ring with three C=C bonds and a positive charge on the seventh carbon. B: cycloheptatriene, the same ring with three C=C bonds and a CH2 in place of the positive carbon. C: cyclobutadiene, a square ring of four carbons with two C=C bonds, drawn flat. D: cyclohexa-1,3-diene, a six-carbon ring with two adjacent C=C bonds and two CH2 groups.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    s += tg(85, 22, 'A · tropylium cation');
    s += c7(85, 96, 36, true);
    s += tg(255, 22, 'B · cycloheptatriene');
    s += c7(255, 96, 36, false);
    s += rule(20, 162, 320, 162);
    s += rule(170, 14, 170, 316);
    s += tg(85, 188, 'C · cyclobutadiene');
    s += ring(85, 258, 4, 38, [0, 2], { rot: 45 }).s;
    s += tg(255, 188, 'D · cyclohexa-1,3-diene');
    const d = ring(255, 260, 6, 40, [0, 2]);
    s += d.s;
    s += hOn(d.v[4], 280, 24) + hOn(d.v[4], 340, 24);
    s += hOn(d.v[5], 20, 24) + hOn(d.v[5], 80, 24);
    return s;
  },
  caption: 'Check each ring for a break in the loop before counting its π electrons.',
});

export default FIGURES;
