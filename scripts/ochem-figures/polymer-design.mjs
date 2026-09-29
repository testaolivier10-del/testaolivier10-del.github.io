/* Figures for the polymer-design notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, arrow, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { polyPts, benzene } from '../lib/ochem-skeletal.mjs';

/* Shared drawing helpers, copied from the builder. */
/* An open retrosynthetic arrow between two points: a double shaft and a
   filled head, the way the retrosynthesis figure draws it by hand. */
function openArrow(a, b, opts = {}) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const g = opts.gap ?? 4, hl = opts.head ?? 16, hw = opts.width ?? 9;
  const r = (v) => Math.round(v * 100) / 100;
  const ex = b.x - ux * (hl - 2), ey = b.y - uy * (hl - 2);
  let o = '';
  for (const k of [-g, g]) {
    o += `<line class="fg-arrow" x1="${r(a.x + px * k)}" y1="${r(a.y + py * k)}" x2="${r(ex + px * k)}" y2="${r(ey + py * k)}"></line>`;
  }
  const bx = b.x - ux * hl, by = b.y - uy * hl;
  o += `<path class="fg-head" d="M${r(b.x)} ${r(b.y)} L${r(bx + px * hw)} ${r(by + py * hw)} L${r(bx - px * hw)} ${r(by - py * hw)} Z"></path>`;
  return o;
}

/* The squiggle that marks a disconnection, drawn across a bond at its
   midpoint so it reads as a cut through that bond and not as a bond. */
function squiggle(a, b, opts = {}) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L, px = -uy, py = ux;
  const half = opts.half ?? 20;
  let d = '';
  for (let i = 0; i <= 8; i++) {
    const t = -half + (i * half) / 4;
    const off = i % 2 === 0 ? 0 : (i % 4 === 1 ? 5 : -5);
    const x = mx + px * t + ux * off, y = my + py * t + uy * off;
    d += (i === 0 ? 'M' : 'L') + `${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100} `;
  }
  return `<path class="${opts.cls || 'fg-dash-hi'}" fill="none" d="${d.trim()}"></path>`;
}

/* ---------------------------------------------------------------------
   A backbone drawn as a run of units along one axis. Each unit is a
   labelled atom or group ({ l, r }), a carbonyl carbon ({ co: true }, whose
   =O is drawn off to one side so the C=O is visible), or a para-phenylene
   ring ({ ring: true }), entered and left at opposite corners.
   `dir` is the axis ('h' runs left to right, 'v' top to bottom) and `side`
   is the direction the carbonyl oxygens point (a unit vector).
   Returns the drawing plus the unit centres and a function giving the
   visible ends of bond i (between unit i and unit i + 1). */
const RING = 22;
function backbone(units, start, dir, opts = {}) {
  const gap = opts.gap ?? 26;
  const d = dir === 'v' ? P(0, 1) : P(1, 0);
  const side = opts.side ?? (dir === 'v' ? P(-1, 0) : P(0, -1));
  const rad = (u) => (u.ring ? RING : u.co ? 15 : u.w ? (dir === 'v' ? 15 : u.w) : (u.r ?? 15));
  const ps = [];
  let t = 0;
  units.forEach((u, i) => {
    t = i ? t + rad(units[i - 1]) + gap + rad(u) : rad(u);
    ps.push({ ...u, rr: rad(u), x: start.x + d.x * t, y: start.y + d.y * t });
  });
  const ends = (i) => {
    const a = ps[i], b = ps[i + 1];
    return [P(a.x + d.x * a.rr, a.y + d.y * a.rr), P(b.x - d.x * b.rr, b.y - d.y * b.rr)];
  };
  let s = '';
  // chain continues beyond the drawn stretch
  if (opts.stubs !== false) {
    const f = ps[0], l = ps[ps.length - 1], L = 20;
    s += bond(P(f.x - d.x * (f.rr + L), f.y - d.y * (f.rr + L)), P(f.x, f.y), { rFrom: 0, rTo: f.rr, cls: opts.stubCls });
    s += bond(P(l.x, l.y), P(l.x + d.x * (l.rr + L), l.y + d.y * (l.rr + L)), { rFrom: l.rr, rTo: 0, cls: opts.stubCls });
    const tl = (x, y) => text(x, y + 5, '~', { cls: 'fg-lbl', size: 13 });
    s += tl(f.x - d.x * (f.rr + L + 9), f.y - d.y * (f.rr + L + 9));
    s += tl(l.x + d.x * (l.rr + L + 9), l.y + d.y * (l.rr + L + 9));
  }
  for (let i = 0; i < ps.length - 1; i++) {
    const [a, b] = ends(i);
    s += bond(a, b, { rFrom: 0, rTo: 0, cls: (opts.hiBonds || []).includes(i) ? 'fg-bond-hi' : 'fg-bond' });
  }
  for (const p of ps) {
    if (p.ring) {
      s += benzene(p.x, p.y, RING, { rot: dir === 'v' ? 90 : 0 }).svg;
    } else if (p.co) {
      const o = P(p.x + side.x * 44, p.y + side.y * 44);
      s += bond(P(p.x, p.y), o, { order: 2 });
      s += atom(o.x, o.y, 'O', { size: 13 });
      s += atom(p.x, p.y, 'C', { size: 13, kind: p.kind });
    } else if (p.w) {
      s += `<rect class="fg-atom" x="${p.x - p.w}" y="${p.y - 15}" width="${2 * p.w}" height="30" rx="15"></rect>`;
      s += atom(p.x, p.y, p.l, { kind: 'point', size: 13 });
    } else {
      s += atom(p.x, p.y, p.l, { r: p.rr, size: 13, kind: p.kind });
    }
  }
  for (const i of opts.cuts || []) { const [a, b] = ends(i); s += squiggle(a, b, { half: 17 }); }
  for (const i of opts.nots || []) {
    const [a, b] = ends(i);
    const m = P((a.x + b.x) / 2, (a.y + b.y) / 2), q = P(-d.y, d.x);
    s += `<line class="fg-dash" x1="${m.x - q.x * 16}" y1="${m.y - q.y * 16}" x2="${m.x + q.x * 16}" y2="${m.y + q.y * 16}"></line>`;
  }
  return { svg: s, ps, ends };
}
const mid = (e) => P((e[0].x + e[1].x) / 2, (e[0].y + e[1].y) / 2);
/* Total drawn length of a run of units (for centring). */
const runLen = (units, gap = 26) => units.reduce((t, u, i) => t + 2 * (u.ring ? RING : u.co ? 15 : u.w ? u.w : (u.r ?? 15)) + (i ? gap : 0), 0);
const centred = (units, cx, y, opts = {}) => backbone(units, P(cx - runLen(units, opts.gap) / 2, y), 'h', { stubs: false, ...opts });

/* A repeat-unit bracket. */
const brack = (x, y, h, dir) => {
  const t = y - h / 2, b = y + h / 2;
  return `<path class="fg-bond" d="M${x + 10 * dir} ${t} L${x} ${t} L${x} ${b} L${x + 10 * dir} ${b}"></path>`;
};

/* The pieces that recur. */
const U = {
  co: { co: true }, O: { l: 'O' }, NH: { l: 'NH', r: 17 }, CH2: { l: 'CH₂', r: 18 },
  ring: { ring: true }, C6: { l: '(CH₂)₆', w: 33 }, C4: { l: '(CH₂)₄', w: 33 },
  OH: { l: 'OH', r: 17 }, HO: { l: 'HO', r: 17 }, NH2: { l: 'NH₂', r: 18 }, H2N: { l: 'H₂N', r: 18 },
};
const PET_RUN = [U.co, U.O, U.CH2, U.CH2, U.O, U.co, U.ring, U.co, U.O];
const DIOL = [U.HO, U.CH2, U.CH2, U.OH];
const TPA = [U.HO, U.co, U.ring, U.co, U.OH];

const FIGURES = [];

/* ---------------------------------------------------------------------
   PET read backwards: the worked case the section opens on. */
FIGURES.push({
  id: 'pet-disconnection',
  section: 'polymer-design',
  anchor: '<h3>Reading a polymer backwards</h3>',
  viewBox: '0 0 760 330',
  alt: 'A stretch of PET chain drawn with each carbonyl oxygen shown. Wavy cut marks cross the three bonds from a carbonyl carbon to the next oxygen, and a dashed mark labeled not here crosses an oxygen-to-CH2 bond. Open arrows lead from the two pieces to ethylene glycol, HO–CH2–CH2–OH, and terephthalic acid, a benzene ring with a CO2H group at each para position.',
  build() {
    let s = '';
    s += tag(30, 26, 'PET, A STRETCH OF CHAIN', { anchor: 'start' });
    const y = 104;
    const run = backbone(PET_RUN, P(90, y), 'h', { gap: 34, cuts: [0, 4, 7], nots: [1] });
    s += run.svg;
    for (const i of [0, 4, 7]) s += text(mid(run.ends(i)).x, y + 40, 'cut', { cls: 'fg-tag', size: 11 });
    const nm = mid(run.ends(1));
    s += text(nm.x, y + 40, 'not here', { cls: 'fg-tag-warn', size: 11 });

    // the two pieces and what they came from
    const diolX = (run.ps[1].x + run.ps[4].x) / 2, acidX = run.ps[6].x;
    const dx = 190, ax = 520, my = 262;
    s += openArrow(P(diolX, y + 50), P(dx + 10, my - 52));
    s += openArrow(P(acidX, y + 50), P(ax - 10, my - 52));
    s += centred(DIOL, dx, my, { kinds: null }).svg;
    s += centred(TPA, ax, my).svg;
    s += text(dx, my + 42, 'ethylene glycol, a diol', { cls: 'fg-tag-good', size: 11 });
    s += text(ax, my + 42, 'terephthalic acid, a diacid', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'The squiggles mark the three cuts, each through the bond from a carbonyl carbon to the next oxygen. Between the first two cuts lies one whole diol, and between the second and third one whole diacid; each ends in two reactive groups. The dashed mark is the tempting wrong cut.',
});

/* ---------------------------------------------------------------------
   The other two rules: a carbon-only backbone and a polyamide. */
FIGURES.push({
  id: 'polymer-disconnection',
  section: 'polymer-design',
  anchor: '<h3>Reading a polymer backwards</h3>',
  viewBox: '0 0 760 470',
  alt: 'Two polymers taken back to their monomers. Polypropylene: the repeat unit CH2–CH(CH3) in brackets, the two bonds that cross the brackets highlighted, and an open arrow to propene, CH2=CH–CH3. Nylon 6,6: a stretch of chain drawn with each carbonyl oxygen shown, wavy cut marks through the three carbonyl-carbon-to-nitrogen bonds and a dashed not here mark on a nitrogen-to-CH2 bond; open arrows lead to hexamethylenediamine and adipic acid.',
  build() {
    let s = '';
    /* ---- 1. addition: polypropylene back to propene ---- */
    s += tag(30, 26, 'ONLY CARBON IN THE BACKBONE: POLYPROPYLENE', { anchor: 'start' });
    {
      const y = 76;
      s += brack(70, y, 56, 1);
      s += bond(P(56, y), P(112, y), { rFrom: 0, rTo: 18, cls: 'fg-bond-hi' });
      s += bond(P(112, y), P(176, y), { rFrom: 18, rTo: 15 });
      s += bond(P(176, y), P(232, y), { rFrom: 15, rTo: 0, cls: 'fg-bond-hi' });
      s += brack(218, y, 56, -1);
      s += text(228, y + 28, 'n', { cls: 'fg-lbl', size: 13, anchor: 'start' });
      s += bond(P(176, y), P(176, y + 46), { rFrom: 15, rTo: 18 });
      s += atom(112, y, 'CH₂', { r: 18, size: 13 });
      s += atom(176, y, 'CH', { r: 15, size: 13 });
      s += atom(176, y + 46, 'CH₃', { r: 18, size: 13 });
      s += openArrow(P(262, y), P(326, y));
      s += bond(P(380, y), P(444, y), { order: 2, rFrom: 18, rTo: 15 });
      s += bond(P(444, y), P(444, y + 46), { rFrom: 15, rTo: 18 });
      s += atom(380, y, 'CH₂', { r: 18, size: 13 });
      s += atom(444, y, 'CH', { r: 15, size: 13 });
      s += atom(444, y + 46, 'CH₃', { r: 18, size: 13 });
      s += text(398, y + 50, 'propene', { cls: 'fg-tag-good', size: 11, anchor: 'end' });
    }
    s += rule(24, 164, 736, 164);

    /* ---- 2. a polyamide: nylon 6,6 ---- */
    s += tag(30, 192, 'AN AMIDE IN THE BACKBONE: NYLON 6,6', { anchor: 'start' });
    {
      const y = 262;
      const units = [U.co, U.NH, U.C6, U.NH, U.co, U.C4, U.co, U.NH];
      const run = backbone(units, P(80, y), 'h', { gap: 34, cuts: [0, 3, 6], nots: [1] });
      s += run.svg;
      for (const i of [0, 3, 6]) s += text(mid(run.ends(i)).x, y + 40, 'cut', { cls: 'fg-tag', size: 11 });
      s += text(mid(run.ends(1)).x, y + 40, 'not here', { cls: 'fg-tag-warn', size: 11 });
      const amX = run.ps[2].x, acX = run.ps[5].x;
      const dx = 190, ax = 530, my = 410;
      s += openArrow(P(amX, y + 50), P(dx + 10, my - 52));
      s += openArrow(P(acX, y + 50), P(ax - 10, my - 52));
      s += centred([U.H2N, U.C6, U.NH2], dx, my).svg;
      s += centred([U.HO, U.co, U.C4, U.co, U.OH], ax, my).svg;
      s += text(dx, my + 42, 'hexamethylenediamine, a diamine', { cls: 'fg-tag-good', size: 11 });
      s += text(ax, my + 42, 'adipic acid, a diacid', { cls: 'fg-tag-good', size: 11 });
    }
    return s;
  },
  caption: 'Top: in a carbon-only backbone, the two bonds that cross the brackets are the ones polymerization made. Put back the C=C between them and you have the monomer. Bottom: a polyamide is cut like a polyester, at the bond from each carbonyl carbon to the next heteroatom, here nitrogen.',
});

/* ---------------------------------------------------------------------
   The worked example: nylon 6,T read backwards. */
FIGURES.push({
  id: 'nylon-6t-disconnection',
  section: 'polymer-design',
  anchor: '<h3>Choosing monomers for a property</h3>',
  viewBox: '0 0 760 330',
  alt: 'A stretch of nylon 6,T chain: carbonyl, NH, (CH2)6, NH, carbonyl, a para-substituted benzene ring, carbonyl, NH. Wavy cut marks cross the three carbonyl-carbon-to-nitrogen bonds, and a dashed not here mark crosses an NH-to-(CH2)6 bond. Open arrows lead to hexamethylenediamine and terephthalic acid.',
  build() {
    let s = '';
    s += tag(30, 26, 'THE UNKNOWN POLYMER, A STRETCH OF CHAIN', { anchor: 'start' });
    const y = 104;
    const units = [U.co, U.NH, U.C6, U.NH, U.co, U.ring, U.co, U.NH];
    const run = backbone(units, P(80, y), 'h', { gap: 34, cuts: [0, 3, 6], nots: [1] });
    s += run.svg;
    for (const i of [0, 3, 6]) s += text(mid(run.ends(i)).x, y + 40, 'cut', { cls: 'fg-tag', size: 11 });
    s += text(mid(run.ends(1)).x, y + 40, 'not here', { cls: 'fg-tag-warn', size: 11 });
    s += text(run.ps[5].x, y + 40, 'para', { cls: 'fg-tag', size: 11 });
    const amX = run.ps[2].x, acX = run.ps[5].x;
    const dx = 190, ax = 520, my = 262;
    s += openArrow(P(amX, y + 50), P(dx + 10, my - 52));
    s += openArrow(P(acX, y + 50), P(ax - 10, my - 52));
    s += centred([U.H2N, U.C6, U.NH2], dx, my).svg;
    s += centred(TPA, ax, my).svg;
    s += text(dx, my + 42, 'hexamethylenediamine', { cls: 'fg-tag-good', size: 11 });
    s += text(ax, my + 42, 'terephthalic acid', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Steps 2 and 3 on the drawing. Each cut goes through a C(=O)–N bond, and each piece ends in two reactive groups: two NH₂ on the diamine, two CO₂H on the diacid. The dashed mark is the trap described at the end of the example.',
});

/* ---------------------------------------------------------------------
   Para against meta: why one ring keeps a chain straight and the other
   bends it. */
function ringArms(cx, cy, a, b, lbls) {
  // ring vertices at 0, 60, ... degrees (vertex 0 on the right); bonds leave vertices a and b
  const pts = polyPts(cx, cy, 6, 26, 0);
  let s = benzene(cx, cy, 26, { rot: 0 }).svg;
  const out = [];
  for (const k of [a, b]) {
    const v = pts[k], ux = (v.x - cx) / 26, uy = (v.y - cy) / 26;
    const e = P(v.x + ux * 46, v.y + uy * 46);
    s += bond(v, e, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    out.push({ v, e, ux, uy });
  }
  s += text(out[0].e.x + out[0].ux * 14, out[0].e.y + out[0].uy * 14 + 4, lbls[0], { cls: 'fg-tag', size: 11, anchor: out[0].ux > 0.3 ? 'start' : out[0].ux < -0.3 ? 'end' : 'middle' });
  s += text(out[1].e.x + out[1].ux * 14, out[1].e.y + out[1].uy * 14 + 4, lbls[1], { cls: 'fg-tag', size: 11, anchor: out[1].ux > 0.3 ? 'start' : out[1].ux < -0.3 ? 'end' : 'middle' });
  return s;
}
function paraMeta(stacked) {
  let s = '';
  const W = stacked ? 330 : 760;
  const c1 = stacked ? P(165, 78) : P(200, 96);
  const c2 = stacked ? P(165, 264) : P(560, 96);
  s += tag(c1.x, stacked ? 22 : 26, 'PARA (1,4)', {});
  s += ringArms(c1.x, c1.y, 3, 0, ['chain', 'chain']);
  s += text(c1.x, c1.y + 60, 'opposite ways: 180°', { cls: 'fg-lbl', size: 13 });
  s += tag(c2.x, stacked ? 184 : 26, 'META (1,3)', {});
  // meta: vertex 3 (left) and vertex 1 (upper right, 60°)
  s += ringArms(c2.x, c2.y + (stacked ? 10 : 10), 3, 1, ['chain', 'chain']);
  s += text(c2.x, c2.y + 70, 'at an angle: 120°', { cls: 'fg-lbl', size: 13 });
  if (!stacked) s += rule(380, 44, 380, 170);
  else s += rule(20, 164, W - 20, 164);
  return s;
}
FIGURES.push({
  id: 'para-meta',
  section: 'polymer-design',
  anchor: '<h3>Choosing monomers for a property</h3>',
  viewBox: '0 0 760 190',
  alt: 'Two benzene rings, each with two chain bonds leaving it. On the para ring the bonds leave opposite corners, 1 and 4, and continue in one straight line. On the meta ring they leave corners 1 and 3, at 120 degrees, so the chain bends.',
  build() { return paraMeta(false); },
  caption: 'The same ring, joined into a chain two ways. Para links keep the chain straight, so neighboring chains can lie side by side. Meta links put a bend at every ring.',
});

/* ---------------------------------------------------------------------
   Three ways to unmake PET: the nucleophile is the only difference. */
FIGURES.push({
  id: 'pet-three-ways',
  section: 'polymer-design',
  anchor: '<h3>Biodegradable by design</h3>',
  viewBox: '0 0 760 400',
  alt: 'PET taken apart three ways. With water: terephthalic acid, a benzene ring with CO2H at each para position, plus ethylene glycol. With methanol: dimethyl terephthalate, the same ring with CO2CH3 at each end, plus ethylene glycol. With excess ethylene glycol: BHET, the same ring with CO2CH2CH2OH at each end.',
  build() {
    let s = '';
    const rows = [
      { y: 70, t: 'HYDROLYSIS', r: 'PET + H₂O', ends: [U.HO, U.OH], name: 'terephthalic acid', eg: true },
      { y: 200, t: 'METHANOLYSIS', r: 'PET + CH₃OH', ends: [{ l: 'H₃CO', w: 25 }, { l: 'OCH₃', w: 25 }], name: 'dimethyl terephthalate', eg: true },
      { y: 330, t: 'GLYCOLYSIS', r: 'PET + HOCH₂CH₂OH', ends: [{ l: 'HOCH₂CH₂O', w: 45 }, { l: 'OCH₂CH₂OH', w: 45 }], name: 'BHET', eg: false },
    ];
    rows.forEach((row, i) => {
      s += tag(24, row.y - 24, row.t, { anchor: 'start' });
      s += text(24, row.y + 15, row.r, { cls: 'fg-lbl', size: 13, anchor: 'start' });
      s += arrow(P(186, row.y + 10), P(232, row.y + 10));
      const cx = row.eg ? 390 : 470;
      s += centred([row.ends[0], U.co, U.ring, U.co, row.ends[1]], cx, row.y + 10).svg;
      s += text(cx, row.y + 50, row.name, { cls: 'fg-tag-good', size: 11 });
      if (row.eg) {
        s += text(560, row.y + 15, '+', { cls: 'fg-lbl', size: 13 });
        s += text(660, row.y + 15, 'HOCH₂CH₂OH', { cls: 'fg-lbl', size: 13 });
        s += text(660, row.y + 50, 'ethylene glycol', { cls: 'fg-tag-good', size: 11 });
      }
      if (i < rows.length - 1) s += rule(24, row.y + 72, 736, row.y + 72);
    });
    return s;
  },
  caption: 'Every product keeps the same C(=O)–ring–C(=O) core. What changes is the group on each carbonyl carbon: OH from water, OCH₃ from methanol, or OCH₂CH₂OH from ethylene glycol, the same group each carbonyl already carried in PET.',
});

/* ---------------------------------------------------------------------
   One functional group decides the end of a polymer's life. Drawn for the
   notes at full width and stacked for the lesson. */
function backboneDecides(stacked) {
  let s = '';
  const esterUnits = [U.CH2, U.co, U.O, U.CH2, U.CH2];
  const ccUnits = [U.CH2, U.CH2, U.CH2, U.CH2, U.CH2];
  const g = stacked ? 18 : 22;
  const panelW = stacked ? 310 : 340;
  const L = stacked ? P(10, 30) : P(24, 40);
  const R = stacked ? P(10, 250) : P(396, 40);
  const draw = (org, title, units, kind, lines, note, noteCls) => {
    const top = stacked && kind ? 30 : 0;   // the C–C chain has no C=O above it, so its stacked panel starts lower
    s += panel(org.x, org.y + top, panelW, 180 - top, { kind });
    s += tag(org.x + panelW / 2, org.y + top - 10, title);
    const units2 = kind ? units : units.map((u, i) => (i === 1 ? { co: true, kind: 'hi' } : u));
    const run = centred(units2, org.x + panelW / 2, org.y + 92, { gap: g, stubs: true, hiBonds: kind ? [] : [1] });
    s += run.svg;
    if (!kind) {
      const m = mid(run.ends(1));
      s += text(m.x, org.y + 128, note, { cls: noteCls, size: 11 });
    } else {
      s += text(org.x + panelW / 2, org.y + 128, note, { cls: noteCls, size: 11 });
    }
    lines.forEach((l, i) => s += text(org.x + panelW / 2, org.y + 152 + i * 17, l, { cls: i ? 'fg-tag' : 'fg-lbl', size: i ? 11 : 13 }));
  };
  draw(L, 'an ester in the backbone', esterUnits, null,
    ['PET, PLA', 'melt and remold, or take back to monomers'], 'water attacks this C=O carbon', 'fg-tag-good');
  draw(R, 'a C–C backbone', ccUnits, 'warn',
    ['polyethylene', 'melt and remold only'], 'no polar bond to attack', 'fg-tag-warn');
  return s;
}
FIGURES.push({
  id: 'backbone-decides',
  section: 'polymer-design',
  anchor: '<h3>Biodegradable by design</h3>',
  viewBox: '0 0 760 240',
  alt: 'Left: a polyester chain, CH2–C(=O)–O–CH2–CH2, with the bond from the carbonyl carbon to oxygen highlighted and labeled water attacks this C=O carbon; below, PET and PLA, which can be melted and remolded or taken back to monomers. Right: a polyethylene chain of five CH2 groups, labeled no polar bond to attack; below, polyethylene, melt and remold only.',
  build() { return backboneDecides(false); },
  caption: 'Left: water attacks the electron-poor carbonyl carbon (shaded), and the highlighted C–O bond to the alkoxy oxygen is the one that breaks. An amide, as in nylon, is attacked the same way, with the N leaving. Right: only nonpolar C–C and C–H bonds, with no electrophilic carbon and no leaving group.',
});
FIGURES.push({
  id: 'l-backbone-decides',
  lessons: ['polymer-design'],
  viewBox: '0 0 330 440',
  alt: 'Top: a polyester chain, CH2–C(=O)–O–CH2–CH2, with the bond from the carbonyl carbon to oxygen highlighted and labeled water attacks this C=O carbon; PET and PLA can be melted and remolded or taken back to monomers. Bottom: a polyethylene chain of five CH2 groups, labeled no polar bond to attack; polyethylene can only be melted and remolded.',
  build() { return backboneDecides(true); },
  caption: 'Top: water attacks the shaded carbonyl carbon, and the highlighted C–O bond breaks. Bottom: only nonpolar bonds, so nothing for water to attack.',
});

/* ---------------------------------------------------------------------
   PLA by the lactide route. */
function lacticAcid(cx, cy) {
  // HO–CH(CH3)–C(=O)–OH, drawn left to right
  const run = centred([U.HO, { l: 'CH', r: 15 }, U.co, U.OH], cx, cy, { gap: 20 });
  let s = run.svg;
  const ch = run.ps[1];
  s += bond(P(ch.x, ch.y), P(ch.x, ch.y + 46), { rFrom: 15, rTo: 18 });
  s += atom(ch.x, ch.y + 46, 'CH₃', { r: 18, size: 13 });
  return s;
}
function lactide(cx, cy) {
  // six-membered ring: v0 top C(=O), v1 upper left O, v2 lower left CH, v3 bottom C(=O), v4 lower right O, v5 upper right CH
  const R0 = 50;
  const v = polyPts(cx, cy, 6, R0, 90);
  const kinds = ['C', 'O', 'CH', 'C', 'O', 'CH'];
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = v[i], b = v[(i + 1) % 6];
    s += bond(a, b, { rFrom: 15, rTo: 15, cls: i === 0 ? 'fg-bond-hi' : 'fg-bond' });
  }
  // exocyclic C=O on v0 (up) and v3 (down)
  const o0 = P(v[0].x, v[0].y - 44), o3 = P(v[3].x, v[3].y + 44);
  s += bond(v[0], o0, { order: 2 }); s += atom(o0.x, o0.y, 'O', { size: 13 });
  s += bond(v[3], o3, { order: 2 }); s += atom(o3.x, o3.y, 'O', { size: 13 });
  // methyls on v5 (outward, up-right) and v2 (outward, down-left)
  const m5 = P(v[5].x + 44, v[5].y - 12), m2 = P(v[2].x - 44, v[2].y + 12);
  s += bond(v[5], m5, { rFrom: 15, rTo: 18 }); s += atom(m5.x, m5.y, 'CH₃', { r: 18, size: 13 });
  s += bond(v[2], m2, { rFrom: 15, rTo: 18 }); s += atom(m2.x, m2.y, 'CH₃', { r: 18, size: 13 });
  for (let i = 0; i < 6; i++) s += atom(v[i].x, v[i].y, kinds[i], { size: 13 });
  return { svg: s, v };
}
function plaUnit(cx, cy) {
  const units = [U.O, { l: 'CH', r: 15 }, U.co];
  const run = centred(units, cx, cy, { gap: 20 });
  let s = run.svg;
  const f = run.ps[0], l = run.ps[2], ch = run.ps[1];
  s += bond(P(f.x - 44, cy), P(f.x, cy), { rFrom: 0, rTo: 15 });
  s += bond(P(l.x, cy), P(l.x + 44, cy), { rFrom: 15, rTo: 0 });
  s += brack(f.x - 32, cy, 64, 1);
  s += brack(l.x + 32, cy, 64, -1);
  s += text(l.x + 38, cy + 34, 'n', { cls: 'fg-lbl', size: 13, anchor: 'start' });
  s += bond(P(ch.x, ch.y), P(ch.x, ch.y + 46), { rFrom: 15, rTo: 18 });
  s += atom(ch.x, ch.y + 46, 'CH₃', { r: 18, size: 13 });
  return s;
}
FIGURES.push({
  id: 'lactide-route',
  section: 'polymer-design',
  anchor: '<h3>What carries forward</h3>',
  viewBox: '0 0 760 270',
  alt: 'Lactic acid, HO–CH(CH3)–CO2H, is condensed and the short chains are closed into lactide, a six-membered ring of two lactic acid units joined by two ester bonds, with one ring ester C–O bond highlighted. Ring-opening then gives PLA, whose repeat unit O–CH(CH3)–C(=O) is shown in brackets.',
  build() {
    let s = '';
    s += tag(110, 26, 'LACTIC ACID');
    s += lacticAcid(110, 130);
    s += arrow(P(208, 130), P(282, 130));
    s += text(245, 116, 'condense, then', { cls: 'fg-sm', size: 10.5 });
    s += text(245, 156, 'close the ring', { cls: 'fg-sm', size: 10.5 });
    s += tag(250, 232, 'LACTIDE', { anchor: 'start' });
    const lt = lactide(380, 138);
    s += lt.svg;
    const m = P((lt.v[0].x + lt.v[1].x) / 2, (lt.v[0].y + lt.v[1].y) / 2);
    s += text(m.x - 26, m.y - 8, 'opens', { cls: 'fg-tag-good', size: 11, anchor: 'end' });
    s += arrow(P(482, 130), P(554, 130));
    s += text(518, 116, 'ring-', { cls: 'fg-sm', size: 10.5 });
    s += text(518, 156, 'opening', { cls: 'fg-sm', size: 10.5 });
    s += tag(650, 26, 'PLA');
    s += plaUnit(650, 130);
    return s;
  },
  caption: 'The two-stage route to PLA. Lactide is two lactic acids, each esterified to the other, closed into a ring. Ring-opening breaks one ring ester bond (highlighted) as the chain end bonds to that carbonyl carbon, so no atoms are lost.',
  note: 'Lactic acid has a stereocenter. The drawings leave it out; commercial PLA is made mostly from the lactide of L-lactic acid.',
});

/* ---------------------------------------------------------------------
   Lesson-only figures, 340 wide or less, stacked. */
FIGURES.push({
  id: 'l-cut-alkene',
  lessons: ['polymer-design'],
  viewBox: '0 0 330 270',
  alt: 'Polypropylene repeat unit CH2–CH(CH3) in brackets, the two bonds that cross the brackets highlighted. An open arrow points down to propene, CH2=CH–CH3.',
  build() {
    let s = '';
    const y = 50, x0 = 86;
    s += brack(x0 - 14, y, 56, 1);
    s += bond(P(x0 - 28, y), P(x0 + 28, y), { rFrom: 0, rTo: 18, cls: 'fg-bond-hi' });
    s += bond(P(x0 + 28, y), P(x0 + 92, y), { rFrom: 18, rTo: 15 });
    s += bond(P(x0 + 92, y), P(x0 + 148, y), { rFrom: 15, rTo: 0, cls: 'fg-bond-hi' });
    s += brack(x0 + 134, y, 56, -1);
    s += text(x0 + 144, y + 28, 'n', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += bond(P(x0 + 92, y), P(x0 + 92, y + 46), { rFrom: 15, rTo: 18 });
    s += atom(x0 + 28, y, 'CH₂', { r: 18, size: 13 });
    s += atom(x0 + 92, y, 'CH', { r: 15, size: 13 });
    s += atom(x0 + 92, y + 46, 'CH₃', { r: 18, size: 13 });
    s += text(20, y + 52, 'polypropylene', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += openArrow(P(150, 118), P(150, 162));
    const y2 = 190;
    s += bond(P(118, y2), P(182, y2), { order: 2, rFrom: 18, rTo: 15 });
    s += bond(P(182, y2), P(182, y2 + 46), { rFrom: 15, rTo: 18 });
    s += atom(118, y2, 'CH₂', { r: 18, size: 13 });
    s += atom(182, y2, 'CH', { r: 15, size: 13 });
    s += atom(182, y2 + 46, 'CH₃', { r: 18, size: 13 });
    s += text(222, y2 + 5, 'propene', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'The highlighted bonds cross the brackets. The bond between them becomes the C=C again.',
});

FIGURES.push({
  id: 'l-cut-ester',
  lessons: ['polymer-design'],
  viewBox: '0 0 330 590',
  alt: 'A stretch of PET chain drawn top to bottom with each carbonyl oxygen shown on the left. Wavy cut marks cross the three bonds from a carbonyl carbon down to the next oxygen, and a dashed not here mark crosses an oxygen-to-CH2 bond. On the right, the piece from oxygen to oxygen becomes ethylene glycol, HO–CH2CH2–OH, and the piece from carbonyl to carbonyl becomes terephthalic acid.',
  build() {
    let s = '';
    const x = 96;
    const run = backbone(PET_RUN, P(x, 40), 'v', { gap: 26, cuts: [0, 4, 7], nots: [1] });
    s += run.svg;
    for (const i of [0, 4, 7]) s += text(x + 24, mid(run.ends(i)).y + 4, 'cut', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(x + 24, mid(run.ends(1)).y + 4, 'not here', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    // pieces
    const piece = (i0, i1, f, nm) => {
      const top = run.ps[i0].y - run.ps[i0].rr + 2, bot = run.ps[i1].y + run.ps[i1].rr - 2;
      const bx = 178;
      let o = `<path class="fg-bond-soft" d="M${bx - 6} ${top} L${bx} ${top} L${bx} ${bot} L${bx - 6} ${bot}"></path>`;
      const my = (top + bot) / 2;
      o += openArrow(P(bx + 4, my), P(bx + 34, my), { gap: 3, head: 11, width: 7 });
      o += text(bx + 40, my - 2, f, { cls: 'fg-lbl', size: 13, anchor: 'start' });
      o += text(bx + 40, my + 16, nm, { cls: 'fg-tag-good', size: 11, anchor: 'start' });
      return o;
    };
    s += piece(1, 4, 'HO–CH₂CH₂–OH', 'ethylene glycol');
    s += piece(5, 7, 'HO₂C–C₆H₄–CO₂H', 'terephthalic acid');
    return s;
  },
  caption: 'Cut each bond from a carbonyl carbon to the next oxygen. Add OH to each carbonyl carbon and H to each oxygen.',
});

FIGURES.push({
  id: 'l-amide-bonds',
  lessons: ['polymer-design'],
  viewBox: '0 0 330 300',
  alt: 'Part of a nylon 6,6 chain drawn top to bottom: (CH2)4, a carbonyl carbon with its oxygen on the left, NH, then (CH2)6. The bond from (CH2)4 to the carbonyl carbon is labeled a, the bond from the carbonyl carbon to N is labeled b, and the bond from N to (CH2)6 is labeled c.',
  build() {
    let s = '';
    const x = 150;
    const run = backbone([U.C4, U.co, U.NH, U.C6], P(x, 44), 'v', { gap: 30 });
    s += run.svg;
    ['a', 'b', 'c'].forEach((l, i) => {
      const m = mid(run.ends(i));
      s += text(x + 22, m.y + 5, l, { cls: 'fg-lbl', size: 13, anchor: 'start' });
    });
    return s;
  },
  caption: 'Three single bonds in a nylon 6,6 chain, lettered a, b and c.',
});

FIGURES.push({
  id: 'l-para-meta',
  lessons: ['polymer-design'],
  viewBox: '0 0 330 360',
  alt: 'Two benzene rings, each with two chain bonds leaving it. On the para ring the bonds leave opposite corners and continue in one straight line. On the meta ring they leave corners 1 and 3, at 120 degrees, so the chain bends.',
  build() { return paraMeta(true); },
  caption: 'Para links keep a chain straight, so chains can lie side by side. Meta links bend it at every ring.',
});

FIGURES.push({
  id: 'l-lactic-acid',
  lessons: ['polymer-design'],
  viewBox: '0 0 330 170',
  alt: 'Lactic acid: HO–CH(CH3)–C(=O)–OH, with the OH group on the left and the carboxylic acid on the right.',
  build() {
    let s = tag(165, 24, 'LACTIC ACID');
    s += lacticAcid(165, 96);
    return s;
  },
  caption: 'Lactic acid, drawn with every group shown.',
});

FIGURES.push({
  id: 'l-lactide-route',
  lessons: ['polymer-design'],
  viewBox: '0 0 330 610',
  alt: 'Top: lactic acid. An arrow labeled condense, then close the ring leads down to lactide, a six-membered ring of two lactic acid units joined by two ester bonds, with one ring ester C–O bond highlighted. An arrow labeled ring-opening leads down to PLA, whose repeat unit O–CH(CH3)–C(=O) is shown in brackets.',
  build() {
    let s = '';
    s += tag(165, 22, 'LACTIC ACID');
    s += lacticAcid(165, 82);
    s += arrow(P(165, 160), P(165, 204));
    s += text(180, 178, 'condense, then', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(180, 194, 'close the ring', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += tag(40, 236, 'LACTIDE', { anchor: 'start' });
    const lt = lactide(165, 318);
    s += lt.svg;
    const m = P((lt.v[0].x + lt.v[1].x) / 2, (lt.v[0].y + lt.v[1].y) / 2);
    s += text(m.x - 26, m.y - 8, 'opens', { cls: 'fg-tag-good', size: 11, anchor: 'end' });
    s += arrow(P(165, 432), P(165, 476));
    s += text(180, 458, 'ring-opening', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += tag(40, 506, 'PLA', { anchor: 'start' });
    s += plaUnit(165, 526);
    return s;
  },
  caption: 'Lactide holds two ester bonds in a ring. Ring-opening breaks one (highlighted) and adds the opened ring to the chain, losing nothing.',
});

export default FIGURES;
