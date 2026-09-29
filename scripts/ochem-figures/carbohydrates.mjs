/* Figures for the carbohydrates notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   One molecule runs through the page: D-glucose. It is drawn three ways,
   and the drawings are kept consistent with each other and with the
   beta-D-glucose already drawn on the acetals page:

     Fischer projection  vertical chain, CHO at the top, OH right at C2,
                         left at C3, right at C4 and right at C5.
     Haworth projection  the ring seen nearly edge-on: ring oxygen at the
                         back right, C1 (the anomeric carbon) at the right
                         corner, numbering clockwise, the front edge drawn
                         thick, every substituent a vertical stick, and the
                         hydrogens on the ring carbons left off.
     chair               the 4C1 chair, ring oxygen at the back right, C1 at
                         the right-hand tip, every group of beta-D-glucose
                         equatorial.

   A ring is placed by slot (back right, right, front right, front left,
   left, back left), and a map says which atom sits in which slot. Turning a
   ring over (for the second glucose of cellobiose) only changes the map and
   swaps up for down, so a turned ring cannot be drawn with a wrong
   substituent by accident.

   Lesson copies (id prefix l-) are 340 wide or less, stacked, and use only
   fg-lbl and fg-tag text. */
import { atom as atom0, bond, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const r2 = (v) => Math.round(v * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
const mid = (a, b, f = 0.5) => P(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);

/* An atom disc that stays opaque in both themes (the tinted discs are
   translucent in the dark theme, so an opaque plain disc goes under them). */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
/* Disc radius by label length. */
const rOf = (l) => {
  const n = [...String(l)].length;
  return l === 'H' ? 12 : n <= 2 ? 15 : n === 3 ? 18 : n === 4 ? 19 : 21;
};
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const tg = (x, y, s, cls = 'fg-tag', anchor = 'middle') => text(x, y, s, { cls, size: 11, anchor });
/* The coral dot that marks an anomeric carbon, as on the acetals page. */
const dot = (p) => atom(p.x, p.y, '', { kind: 'warn', r: 5 });
/* A negative charge beside an atom. */
const minus = (p) => text(p.x, p.y + 5, '−', { cls: 'fg-warn', size: 15 });
/* Two reaction arrows, one each way: an equilibrium. */
function eq(a, b, gap = 5) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const px = (-dy / L) * gap, py = (dx / L) * gap;
  return arrow(P(a.x + px, a.y + py), P(b.x + px, b.y + py), { size: 7 }) +
         arrow(P(b.x - px, b.y - py), P(a.x - px, a.y - py), { size: 7 });
}
/* A thick front-edge bond, trimmed at labelled atoms. */
function front(a, b, rA = 0, rB = 0) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  return `<line class="fg-bond-hi" x1="${r2(a.x + ux * rA)}" y1="${r2(a.y + uy * rA)}" x2="${r2(b.x - ux * rB)}" y2="${r2(b.y - uy * rB)}"></line>`;
}

/* ------------------------------------------------------ Haworth rings --- */
const SLOT6 = { bR: [42, -46], R: [92, 0], fR: [52, 38], fL: [-52, 38], L: [-92, 0], bL: [-42, -46] };
const PYR = { O: 'bR', 1: 'R', 2: 'fR', 3: 'fL', 4: 'L', 5: 'bL' };
/* The same ring turned over about its C1...C4 axis: left and right stay,
   front and back swap, and so do up and down. */
const PYR_TURNED = { O: 'fR', 1: 'R', 2: 'bR', 3: 'bL', 4: 'L', 5: 'fL' };
const SLOT5 = { b: [0, -44], R: [66, -8], fR: [40, 32], fL: [-40, 32], L: [-66, -8] };
/* Fructofuranose as it sits in sucrose: the usual drawing turned end for
   end in the plane of the page, so C2 is at the left and the ring oxygen
   stays at the back. Up and down swap with it. */
const FUR_SUCROSE = { O: 'b', 2: 'L', 3: 'fL', 4: 'fR', 5: 'R' };

/* Where a locant goes beside each slot: out to the side, clear of the
   vertical sticks and of the ring bonds. */
const NUMOFF = { R: [15, 2], fR: [16, 14], fL: [-16, 14], L: [-15, 2], bL: [-16, -6], bR: [16, -6], b: [0, -20] };

/* ring(cx, cy, o)
   o.map, o.slots, o.order: which atom sits where, and the ring bonds.
   o.k: scale. o.oLabel: what sits in the oxygen slot (default 'O').
   o.open: the ring bond between the O slot and this atom is left out.
   o.c1: a label to write at the anomeric slot instead of a bare vertex.
   o.subs: { atomKey: { up, down, upKind, downKind, upLen, downLen } }.
   o.nums: write locants inside the ring. o.dot: anomeric key to mark. */
function ring(cx, cy, o) {
  const k = o.k ?? 1;
  const pos = {};
  for (const [key, sl] of Object.entries(o.map)) {
    const [dx, dy] = o.slots[sl];
    pos[key] = P(cx + dx * k, cy + dy * k);
  }
  const oLabel = o.oLabel ?? 'O';
  const rAt = (key) => (key === 'O' ? rOf(oLabel) : key === o.c1Key && o.c1 ? rOf(o.c1) : 0);
  const isFront = (key) => o.map[key][0] === 'f';
  let s = '';
  const n = o.order.length;
  for (let i = 0; i < n; i++) {
    const a = o.order[i], b = o.order[(i + 1) % n];
    if (o.open && ((a === 'O' && b === o.open) || (b === 'O' && a === o.open))) continue;
    if (isFront(a) && isFront(b)) s += front(pos[a], pos[b], rAt(a), rAt(b));
    else s += bond(pos[a], pos[b], { rFrom: rAt(a), rTo: rAt(b) });
  }
  const ends = {};
  let atoms = '';
  for (const [key, sub] of Object.entries(o.subs || {})) {
    for (const dir of ['up', 'down']) {
      const l = sub[dir];
      if (!l) continue;
      const r = rOf(l);
      const len = (sub[dir + 'Len'] ?? o.L ?? 22) * k + r;
      const e = P(pos[key].x + (sub[dir + 'Dx'] ?? 0) * k, pos[key].y + (dir === 'up' ? -len : len));
      ends[key + dir] = e;
      s += bond(pos[key], e, { rFrom: rAt(key), rTo: r, cls: sub[dir + 'Bond'] || 'fg-bond' });
      atoms += atom(e.x, e.y, l, { r, kind: sub[dir + 'Kind'] });
    }
  }
  s += atoms;
  s += atom(pos.O.x, pos.O.y, oLabel, { r: rOf(oLabel), kind: o.oKind });
  if (o.c1) s += atom(pos[o.c1Key].x, pos[o.c1Key].y, o.c1, { r: rOf(o.c1), kind: o.c1Kind });
  if (o.nums) {
    for (const key of Object.keys(o.map)) {
      if (key === 'O' || (o.c1 && key === o.c1Key)) continue;
      const p = pos[key];
      const [ox, oy] = NUMOFF[o.map[key]];
      s += tg(p.x + ox, p.y + oy + 4, key);
    }
  }
  if (o.dot) s += dot(pos[o.dot]);
  return { s, pos, ends };
}
const pyranose = (cx, cy, o = {}) => ring(cx, cy, {
  map: o.turned ? PYR_TURNED : PYR, slots: SLOT6, order: ['O', '1', '2', '3', '4', '5'], c1Key: '1', ...o,
});
const furanose = (cx, cy, o = {}) => ring(cx, cy, {
  map: FUR_SUCROSE, slots: SLOT5, order: ['O', '2', '3', '4', '5'], c1Key: '2', ...o,
});

/* Substituents of D-glucopyranose in the usual orientation. `anomer` is
   'b' (C1 OH up), 'a' (down) or null (no C1 group drawn). */
function glcSubs(anomer, extra = {}) {
  const s = {
    2: { down: 'OH' },
    3: { up: 'OH', upLen: 12 },
    4: { down: 'OH' },
    5: { up: 'CH₂OH', upLen: 16 },
  };
  if (anomer === 'b') s[1] = { up: 'OH' };
  if (anomer === 'a') s[1] = { down: 'OH' };
  for (const [k, v] of Object.entries(extra)) s[k] = { ...(s[k] || {}), ...v };
  return s;
}

/* ---------------------------------------------------- Fischer chains --- */
/* items, top to bottom: { c } a labelled chain atom; { l, r } a crossing
   (a stereocenter) with its two horizontal groups; { c, dbl } a chain atom
   with a double bond to the right. Kinds: ck, lk, rk. */
function fischer(x, y0, items, o = {}) {
  const dy = o.dy ?? 42, arm = o.arm ?? 46;
  const ys = items.map((_, i) => y0 + i * dy);
  let s = '';
  for (let i = 0; i < items.length - 1; i++) {
    const a = items[i], b = items[i + 1];
    s += bond(P(x, ys[i]), P(x, ys[i + 1]), { rFrom: a.c ? rOf(a.c) : 0, rTo: b.c ? rOf(b.c) : 0 });
  }
  items.forEach((it, i) => {
    const y = ys[i];
    if (it.c) {
      if (it.dbl) {
        s += bond(P(x, y), P(x + arm, y), { order: 2, rFrom: rOf(it.c), rTo: 15 });
        s += atom(x + arm, y, it.dbl, { kind: it.rk });
      }
      s += atom(x, y, it.c, { r: rOf(it.c), kind: it.ck });
    } else {
      s += bond(P(x, y), P(x - arm, y), { rFrom: 0, rTo: rOf(it.l) });
      s += bond(P(x, y), P(x + arm, y), { rFrom: 0, rTo: rOf(it.r) });
      s += atom(x - arm, y, it.l, { r: rOf(it.l), kind: it.lk });
      s += atom(x + arm, y, it.r, { r: rOf(it.r), kind: it.rk });
    }
    if (o.nums) s += tg(o.numX ?? x - arm - 34, y + 4, String(i + 1));
  });
  return { s, ys };
}
const GLC_FISCHER = (top = 'CHO', bottom = 'CH₂OH', kinds = {}) => [
  { c: top, ck: kinds.top },
  { l: 'H', r: 'OH' },
  { l: 'HO', r: 'H' },
  { l: 'H', r: 'OH' },
  { l: 'H', r: 'OH', rk: kinds.c5 },
  { c: bottom, ck: kinds.bottom },
];

/* ============================================================ fig 1 ===
   Aldose and ketose, and where D is read. Glucose and fructose share C3 to
   C6, so the two chains are set at the same height and share one column of
   carbon numbers down the middle, and the C5 row is banded. */
function fischerPair() {
  let s = '';
  s += tg(84, 22, 'D-glucose');
  s += tg(84, 38, 'an aldose: CHO at C1', 'fg-tag-mut');
  s += tg(256, 22, 'D-fructose');
  s += tg(256, 38, 'a ketose: C=O at C2', 'fg-tag-mut');
  const y0 = 70;
  s += `<rect class="fg-panel-hi" x="6" y="${y0 + 4 * 42 - 21}" width="328" height="42" rx="8"></rect>`;
  s += fischer(84, y0, GLC_FISCHER('CHO', 'CH₂OH', { top: 'hi', c5: 'hi' })).s;
  s += fischer(256, y0, [
    { c: 'CH₂OH' },
    { c: 'C', dbl: 'O', ck: 'hi' },
    { l: 'HO', r: 'H' },
    { l: 'H', r: 'OH' },
    { l: 'H', r: 'OH', rk: 'hi' },
    { c: 'CH₂OH' },
  ]).s;
  for (let i = 0; i < 6; i++) s += tg(170, y0 + i * 42 + 4, String(i + 1));
  s += tg(170, 316, 'C5 carries the OH furthest from the C=O.');
  s += tg(170, 334, 'It points right, so both sugars are D.');
  return s;
}
FIGURES.push({
  id: 'carb-fischer-pair',
  section: 'carbohydrates',
  lessons: ['carbohydrates'],
  anchor: '<h3>The vocabulary, quickly</h3>',
  viewBox: '0 0 340 346',
  alt: 'Fischer projections of D-glucose and D-fructose side by side, with carbons numbered 1 to 6 down a shared middle column. Glucose has CHO at C1; fructose has CH2OH at C1 and a C=O at C2. From C3 down the two chains are the same: OH left at C3, right at C4, right at C5. The C5 row is shaded, with its OH on the right in both.',
  build: fischerPair,
  caption: 'Glucose keeps its C=O at the end of the chain and fructose keeps it at C2. Below C2 the two are identical, and the shaded row is the one that sets D.',
});

/* ============================================================ fig 2 ===
   Fischer to Haworth, in four moves. The claim that "right becomes down"
   is only believable if the chain is seen being tipped over, and the
   CH2OH going up only makes sense once C5 is seen turning. */
function openChain(cx, cy, k, turned, o = {}) {
  // The chain curled into the ring's shape, before the ring closes.
  const subs = glcSubs(null);
  if (turned) subs[5] = { up: 'CH₂OH', down: 'H', downLen: 4, downDx: 18 };
  else subs[5] = { up: 'H', down: 'OH', downLen: 6, downDx: 22, downKind: o.hi ? 'hi' : undefined };
  return pyranose(cx, cy, {
    k, open: '1', oLabel: turned ? 'OH' : 'CH₂OH', oKind: turned && o.hi ? 'hi' : undefined,
    c1: 'CHO', subs, nums: o.nums,
  });
}
function haworthSteps(layout) {
  let s = '';
  const [pA, pB, pC, pD] = layout.panels;
  const k = layout.k;
  const head = (p, t1, t2) => tg(p.x + p.w / 2, p.y + 20, t1) + (t2 ? tg(p.x + p.w / 2, p.y + 36, t2, 'fg-tag-mut') : '');
  for (const p of layout.panels) s += panel(p.x, p.y, p.w, p.h);

  s += head(pA, '1 · Fischer projection', 'right → down, left → up');
  s += fischer(pA.x + pA.w / 2 + 6, pA.y + 70, GLC_FISCHER('CHO', 'CH₂OH', { c5: 'hi' }), { nums: true, dy: 34 }).s;

  s += head(pB, '2 · tip it on its side and curl it', 'OH on C2, C4, C5 now point down');
  s += openChain(pB.x + pB.w / 2, pB.y + pB.h * 0.6, k, false, { hi: true, nums: true }).s;

  s += head(pC, '3 · turn C5 about the C4–C5 bond', 'its OH now faces C1; CH₂OH goes up');
  s += openChain(pC.x + pC.w / 2, pC.y + pC.h * 0.6, k, true, { hi: true, nums: true }).s;

  s += head(pD, '4 · the OH bonds to C1: the ring', 'β-D-glucopyranose');
  const r = pyranose(pD.x + pD.w / 2, pD.y + pD.h * 0.6, { k, subs: glcSubs('b'), nums: true, dot: '1', oKind: 'hi' });
  s += r.s;
  return s;
}
FIGURES.push({
  id: 'fischer-haworth',
  section: 'carbohydrates',
  anchor: 'wedges and dashes back in <a class="chapter-ref" href="/ochem/learn.html#m-stereochemistry">Stereochemistry</a>.</p>',
  viewBox: '0 0 760 590',
  alt: 'Four panels. 1: the Fischer projection of D-glucose, carbons numbered 1 to 6, with OH right at C2, left at C3, right at C4 and right at C5. 2: the same chain tipped onto its side and curled into the shape of a ring, with CHO at C1 on the right; the OH groups on C2 and C4 point down, the C3 OH points up, and C5 has H up and OH down, with C6 (CH2OH) sitting where the ring oxygen will go. 3: C5 turned, so its OH sits in the ring-oxygen position facing C1 and its CH2OH points up. 4: the closed ring, beta-D-glucopyranose, with the ring oxygen at the back right, the C1 OH up, C2 OH down, C3 OH up, C4 OH down and CH2OH up.',
  build: () => haworthSteps({
    k: 1.08,
    panels: [
      { x: 10, y: 6, w: 364, h: 284 }, { x: 386, y: 6, w: 364, h: 284 },
      { x: 10, y: 300, w: 364, h: 284 }, { x: 386, y: 300, w: 364, h: 284 },
    ],
  }),
  caption: 'The same molecule at every stage. Follow the teal OH on C5: it points down after the tip, and turning C5 swings it into the ring and sends the CH₂OH up. Hydrogens on the ring carbons are left off except at C5.',
});
FIGURES.push({
  id: 'l-fischer-haworth',
  lessons: ['carbohydrates'],
  viewBox: '0 0 340 1080',
  alt: 'Four panels stacked. 1: the Fischer projection of D-glucose. 2: the chain tipped on its side and curled, with the C5 OH pointing down. 3: C5 turned so its OH faces C1 and its CH2OH points up. 4: the closed ring, beta-D-glucopyranose, C1 OH up, C2 OH down, C3 OH up, C4 OH down, CH2OH up.',
  build: () => haworthSteps({
    k: 1,
    panels: [
      { x: 4, y: 4, w: 332, h: 262 }, { x: 4, y: 274, w: 332, h: 262 },
      { x: 4, y: 544, w: 332, h: 262 }, { x: 4, y: 814, w: 332, h: 262 },
    ],
  }),
  caption: 'The same molecule at every stage. Follow the teal OH on C5: turning C5 swings it into the ring and sends the CH₂OH up.',
});


/* ============================================================ fig 3 ===
   The two anomers and the open chain between them. The middle drawing
   carries the ring-closing arrows, so the figure shows both where the new
   stereocenter comes from and why there are two of it. */
function openArrows(cx, cy, k, o = {}) {
  // Turned open chain with the aldehyde drawn out, and the two arrows.
  let s = '';
  const r = pyranose(cx, cy, { k, open: '1', subs: glcSubs(null, { 5: { up: 'CH₂OH', upLen: 16 } }), oKind: 'hi' });
  s += r.s;
  const O5 = r.pos.O, C1 = r.pos['1'];
  // O5 carries its H straight up.
  const H5 = P(O5.x, O5.y - 38);
  s += bond(O5, H5, { rFrom: 15, rTo: 12 }) + atom(H5.x, H5.y, 'H', { r: 12 });
  // C1: the aldehyde. C=O out to the lower right, H to the upper right.
  const O1 = at(C1, -35, 50), H1 = at(C1, 55, 38);
  s += bond(C1, O1, { order: 2, rFrom: 0, rTo: 15 }) + atom(O1.x, O1.y, 'O');
  s += bond(C1, H1, { rFrom: 0, rTo: 12 }) + atom(H1.x, H1.y, 'H', { r: 12 });
  // Lone pairs: two on each oxygen, at clearly different angles.
  s += lonePair(O5.x, O5.y, 40, { dist: 21 }) + lonePair(O5.x, O5.y, -20, { dist: 21 });
  s += lonePair(O1.x, O1.y, 90, { dist: 21 }) + lonePair(O1.x, O1.y, -10, { dist: 21 });
  // O5 lone pair to C1; the C=O pi bond onto O1.
  const lpA = P(O5.x + Math.cos(rad(40)) * 24, O5.y + Math.sin(rad(40)) * 24);
  s += curve(lpA, P(C1.x - 5, C1.y - 7), { bow: -14, size: 7 });
  const m = mid(C1, O1);
  s += curve(P(m.x - 2, m.y - 4), P(O1.x + 6, O1.y - 15), { bow: -18, size: 7 });
  if (o.dot !== false) s += dot(C1);
  return { s, pos: r.pos };
}
function anomer(cx, cy, k, which, o = {}) {
  const subs = glcSubs(which === 'a' ? 'a' : 'b', { 1: { [which === 'a' ? 'downKind' : 'upKind']: 'hi' }, 5: { up: 'CH₂OH', upLen: 16 } });
  return pyranose(cx, cy, { k, subs, dot: '1', nums: o.nums });
}
FIGURES.push({
  id: 'carb-anomers',
  section: 'carbohydrates',
  anchor: 'into the chair drawing, where up and down on the page stop being reliable.</p>',
  viewBox: '0 0 760 330',
  alt: 'Alpha-D-glucopyranose on the left, the open-chain form in the middle, and beta-D-glucopyranose on the right, joined by equilibrium arrows. In the middle, the chain is curled into the shape of the ring: a curved arrow runs from a lone pair on the C5 oxygen to the aldehyde carbon C1, and a second moves the C=O pi bond onto the aldehyde oxygen. In alpha the C1 OH points down, opposite the CH2OH; in beta it points up, on the same side as the CH2OH. Glucose in water is about 36 percent alpha, 64 percent beta and well under 0.1 percent open chain.',
  build() {
    let s = '';
    s += tg(122, 22, 'α-D-glucopyranose') + tg(122, 38, 'C1 OH down, opposite CH₂OH', 'fg-tag-mut');
    s += tg(380, 22, 'open chain') + tg(380, 38, 'O5 adds to either face of C=O', 'fg-tag-mut');
    s += tg(638, 22, 'β-D-glucopyranose') + tg(638, 38, 'C1 OH up, same side as CH₂OH', 'fg-tag-mut');
    const k = 0.72, cy = 172;
    s += anomer(122, cy, k, 'a').s;
    s += openArrows(362, cy, k).s;
    s += anomer(638, cy, k, 'b').s;
    s += eq(P(218, cy + 4), P(268, cy + 4));
    s += eq(P(506, cy + 4), P(544, cy + 4));
    s += rule(20, 272, 740, 272);
    s += tg(122, 298, 'about 36%');
    s += tg(380, 298, 'well under 0.1%');
    s += tg(638, 298, 'about 64%');
    s += tg(380, 318, 'D-glucose in water at equilibrium', 'fg-tag-mut');
    return s;
  },
  caption: 'The coral dot is C1, the anomeric carbon. The proton on the C5 oxygen ends up on the new C1 OH, so both anomers are neutral. Hydrogens on the ring carbons are left off.',
});
FIGURES.push({
  id: 'l-carb-anomers',
  lessons: ['carbohydrates'],
  viewBox: '0 0 340 760',
  alt: 'Three structures stacked, joined by equilibrium arrows. Top: alpha-D-glucopyranose, C1 OH down, about 36 percent. Middle: open-chain D-glucose curled into the shape of the ring, with a curved arrow from a lone pair on the C5 oxygen to the aldehyde carbon C1 and a second moving the C=O pi bond onto the aldehyde oxygen, well under 0.1 percent. Bottom: beta-D-glucopyranose, C1 OH up, about 64 percent.',
  build() {
    let s = '';
    s += tg(170, 18, 'α-D-glucopyranose: about 36%');
    s += tg(170, 34, 'C1 OH down, opposite CH₂OH', 'fg-tag-mut');
    s += anomer(164, 130, 0.8, 'a').s;
    s += eq(P(170, 216), P(170, 256));
    s += tg(170, 280, 'open chain: well under 0.1%');
    s += openArrows(150, 390, 0.8).s;
    s += eq(P(170, 486), P(170, 526));
    s += tg(170, 550, 'β-D-glucopyranose: about 64%');
    s += tg(170, 566, 'C1 OH up, same side as CH₂OH', 'fg-tag-mut');
    s += anomer(164, 670, 0.8, 'b').s;
    return s;
  },
  caption: 'The coral dot is C1, the anomeric carbon. The C5 oxygen can add to either face of the flat C=O, so closing the ring gives two products.',
});

/* ============================================================ fig 4 ===
   The worked example's answer: galactose differs from glucose in one
   stick, and that stick is highlighted. */
FIGURES.push({
  id: 'carb-galactose',
  section: 'carbohydrates',
  anchor: '<p>The order matters more than it looks.',
  viewBox: '0 0 340 250',
  alt: 'Beta-D-galactopyranose as a Haworth projection: ring oxygen at the back right, C1 OH up, C2 OH down, C3 OH up, C4 OH up (highlighted), and CH2OH up on C5.',
  build() {
    let s = '';
    s += tg(170, 20, 'β-D-galactopyranose');
    s += pyranose(170, 146, {
      k: 1, nums: true, dot: '1',
      subs: glcSubs('b', { 4: { down: null, up: 'OH', upKind: 'hi' }, 5: { up: 'CH₂OH', upLen: 18 } }),
    }).s;
    s += tg(170, 240, 'C4 OH up; in glucose it points down', 'fg-tag-mut');
    return s;
  },
  caption: 'Galactose drawn from its Fischer projection. Only the teal OH on C4 differs from β-D-glucose.',
});

/* ============================================================ fig 5 ===
   The chair, projected from real 3D coordinates so that the three pairs
   of parallel bonds, the vertical axial bonds and the outward, slightly
   tilted equatorial bonds all come out right by construction. Atom i sits
   at 60i degrees round the ring axis, alternately below and above the
   mean plane; the ring oxygen is at the back right and C1 at the right-hand
   tip (the usual 4C1 drawing of a D-pyranose). */
/* The book's reference chair (build-ochem-figures.mjs, CHAIR_V and
   CHAIR_EQ), mirrored left to right so that the ring oxygen sits at the
   back right and C1 at the right-hand tip. A chair has mirror planes, so
   the mirrored drawing is still a correct chair; the equatorial vectors are
   mirrored with it. Vertex 0 is the left tip, whose axial bond points up,
   and axial alternates round the ring. */
const CH_V = [P(-113.15, -18.21), P(-56.57, -15.31), P(56.57, -51.72), P(113.15, 18.21), P(56.58, 15.31), P(-56.57, 51.72)];
const CH_EQ = [P(-0.944, 0.329), P(-0.613, -0.790), P(0.994, 0.104), P(0.944, -0.329), P(0.613, 0.790), P(-0.994, -0.104)];
/* Which vertex each ring atom takes: C4 left tip, C5 back left, O back
   right, C1 right tip, C2 front right, C3 front left. That keeps the
   Haworth order (O, C1, C2 ... clockwise from above). */
const CH_I = { 4: 0, 5: 1, O: 2, 1: 3, 2: 4, 3: 5 };
function chairGeom(cx, cy, S) {
  const k = S / 113.15;
  return {
    pts: CH_V.map((p) => P(cx + p.x * k, cy + p.y * k)),
    up: [true, false, true, false, true, false],
    eqDir: (i) => CH_EQ[i],
  };
}
function chairGlc(cx, cy, k, anomer) {
  const g = chairGeom(cx, cy, 118 * k);
  const v = g.pts;
  let s = '';
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    s += bond(v[i], v[j], { rFrom: i === 2 ? 15 : 0, rTo: j === 2 ? 15 : 0 });
  }
  let atoms = '';
  const put = (key, kind, l, lk) => {
    const i = CH_I[key], p = v[i], r = rOf(l);
    let e;
    if (kind === 'ax') {
      const L = (l === 'H' ? (key === '4' ? 6 : 12) : 22) * k + r;
      e = P(p.x, p.y + (g.up[i] ? -L : L));
    } else {
      const d = g.eqDir(i), L = (l.length > 3 ? 40 : 22) * k + r;
      e = P(p.x + d.x * L, p.y + d.y * L);
    }
    s += bond(p, e, { rFrom: 0, rTo: r, cls: l === 'H' ? 'fg-bond-soft' : 'fg-bond' });
    atoms += atom(e.x, e.y, l, { r, kind: lk });
  };
  for (const key of ['2', '3', '4']) { put(key, 'eq', 'OH'); put(key, 'ax', 'H'); }
  put('5', 'eq', 'CH₂OH'); put('5', 'ax', 'H');
  if (anomer === 'b') { put('1', 'eq', 'OH', 'hi'); put('1', 'ax', 'H'); }
  else { put('1', 'ax', 'OH', 'warn'); put('1', 'eq', 'H'); }
  s += atoms;
  s += atom(v[2].x, v[2].y, 'O');
  s += dot(v[3]);
  return { s, v };
}
FIGURES.push({
  id: 'carb-chair',
  section: 'carbohydrates',
  anchor: 'a conformational argument from <a class="chapter-ref" href="/ochem/learn.html#m-alkanes-conformations">Alkanes &amp; Conformations</a> rather than a new one.</p>',
  viewBox: '0 0 760 300',
  alt: 'Two chairs of D-glucopyranose with the ring oxygen at the back right and C1 at the right-hand tip. Left, beta: the four OH groups and the CH2OH all point outward, equatorial, and every axial position carries H. Right, alpha: the same except that the C1 OH is axial, pointing straight down, and C1 has H equatorial.',
  build() {
    let s = '';
    s += panel(10, 8, 366, 284, { kind: 'good' });
    s += panel(384, 8, 366, 284);
    s += tg(193, 30, 'β-D-glucopyranose') + tg(193, 46, 'every OH and the CH₂OH equatorial', 'fg-tag-good');
    s += tg(567, 30, 'α-D-glucopyranose') + tg(567, 46, 'the C1 OH is axial', 'fg-tag-warn');
    s += chairGlc(190, 168, 1, 'b').s;
    s += chairGlc(564, 160, 1, 'a').s;
    s += tg(193, 280, 'axial positions: H only', 'fg-tag-mut');
    s += tg(567, 280, 'one OH axial, beside two axial H', 'fg-tag-mut');
    return s;
  },
  caption: 'The coral dot is C1. Axial bonds point straight up or down; the gray sticks carry the hydrogens.',
});
FIGURES.push({
  id: 'l-carb-chair',
  lessons: ['carbohydrates'],
  viewBox: '0 0 340 500',
  alt: 'Two chairs of D-glucopyranose, stacked. Top, beta: every OH and the CH2OH equatorial, every axial position H. Bottom, alpha: the C1 OH axial, pointing straight down.',
  build() {
    let s = '';
    s += panel(4, 4, 332, 240, { kind: 'good' });
    s += panel(4, 254, 332, 240);
    s += tg(170, 24, 'β: every OH and CH₂OH equatorial', 'fg-tag-good');
    s += tg(170, 274, 'α: the C1 OH is axial', 'fg-tag-warn');
    s += chairGlc(170, 140, 0.86, 'b').s;
    s += chairGlc(170, 384, 0.86, 'a').s;
    return s;
  },
  caption: 'The coral dot is C1. The gray sticks are axial hydrogens.',
});

/* ============================================================ fig 6 ===
   Reducing or not, drawn on real molecules: glucose (hemiacetal) and its
   methyl glycoside (acetal). */
function testPair(pl, pr, k) {
  let s = '';
  s += panel(pl.x, pl.y, pl.w, pl.h, { kind: 'good' });
  s += panel(pr.x, pr.y, pr.w, pr.h, { kind: 'warn' });
  s += tg(pl.x + pl.w / 2, pl.y + 20, 'β-D-glucopyranose');
  s += tg(pl.x + pl.w / 2, pl.y + 36, 'hemiacetal: ring O and OH on C1', 'fg-tag-good');
  s += pyranose(pl.x + pl.w / 2 - 6, pl.y + pl.h * 0.56, { k, dot: '1', oKind: 'hi', subs: glcSubs('b', { 1: { upKind: 'hi' }, 5: { up: 'CH₂OH', upLen: 16 } }) }).s;
  s += tg(pl.x + pl.w / 2, pl.y + pl.h - 14, 'ring can open to CHO: test positive', 'fg-tag-good');
  s += tg(pr.x + pr.w / 2, pr.y + 20, 'methyl β-D-glucopyranoside');
  s += tg(pr.x + pr.w / 2, pr.y + 36, 'acetal: ring O and OCH₃ on C1', 'fg-tag-warn');
  s += pyranose(pr.x + pr.w / 2 - 6, pr.y + pr.h * 0.56, { k, dot: '1', oKind: 'warn', subs: glcSubs(null, { 1: { up: 'OCH₃', upKind: 'warn' }, 5: { up: 'CH₂OH', upLen: 16 } }) }).s;
  s += tg(pr.x + pr.w / 2, pr.y + pr.h - 14, 'ring stays shut: test negative', 'fg-tag-warn');
  return s;
}
FIGURES.push({
  id: 'anomeric-test',
  section: 'carbohydrates',
  anchor: 'the sugar is <b>non-reducing</b>.</li>\n</ul>',
  viewBox: '0 0 760 280',
  alt: 'Left: beta-D-glucopyranose, whose anomeric carbon C1 carries the ring oxygen and an OH, a hemiacetal; its ring can open to the aldehyde, so it tests positive. Right: methyl beta-D-glucopyranoside, whose C1 carries the ring oxygen and an OCH3, an acetal; its ring stays shut, so it tests negative.',
  build: () => testPair({ x: 10, y: 8, w: 366, h: 264 }, { x: 384, y: 8, w: 366, h: 264 }, 0.9),
  caption: 'The coral dot marks C1, the anomeric carbon. The two molecules differ only in what caps its oxygen: H on the left, CH₃ on the right.',
});
FIGURES.push({
  id: 'l-anomeric-test',
  lessons: ['carbohydrates'],
  viewBox: '0 0 340 520',
  alt: 'Top: beta-D-glucopyranose, C1 bearing the ring oxygen and an OH, a hemiacetal that can open: test positive. Bottom: methyl beta-D-glucopyranoside, C1 bearing the ring oxygen and an OCH3, an acetal that stays shut: test negative.',
  build: () => testPair({ x: 4, y: 4, w: 332, h: 250 }, { x: 4, y: 264, w: 332, h: 250 }, 0.86),
  caption: 'The coral dot marks C1, the anomeric carbon. Only what caps its oxygen differs: H on top, CH₃ below.',
});

/* ============================================================ fig 7 ===
   Maltose and sucrose as Haworth drawings. The glycosidic oxygen hangs
   below both rings, so each link is drawn as the usual V: down from one
   anomeric carbon, up to the carbon it joins. */
function maltose(x0, cy, k, o = {}) {
  // x0: the left edge of the drawing.
  let s = '';
  const ax = x0 + 66 * k + 16;
  const A = pyranose(ax, cy, { k, dot: '1', subs: glcSubs(null, { 5: { up: 'CH₂OH', upLen: 16 } }) });
  const C1A = A.pos['1'];
  const Ol = P(C1A.x + 24 * k + 6, C1A.y + 42 * k + 8);
  const C4B = P(Ol.x + 24 * k + 6, C1A.y);
  const bx = C4B.x + 92 * k;
  const bSubs = glcSubs(o.freeDown ? 'a' : 'b', { 4: { down: null }, 5: { up: 'CH₂OH', upLen: 16 } });
  bSubs[1][o.freeDown ? 'downKind' : 'upKind'] = 'hi';
  const B = pyranose(bx, cy, { k, dot: '1', subs: bSubs });
  s += bond(C1A, Ol, { rFrom: 0, rTo: 15 }) + bond(Ol, C4B, { rFrom: 15, rTo: 0 });
  s += A.s + B.s;
  s += atom(Ol.x, Ol.y, 'O', { kind: 'warn' });
  return { s, A, B, Ol, right: bx + 66 * k + 16 };
}
function sucrose(x0, cy, k) {
  let s = '';
  const ax = x0 + 66 * k + 16;
  const A = pyranose(ax, cy, { k, dot: '1', subs: glcSubs(null, { 5: { up: 'CH₂OH', upLen: 16 } }) });
  const C1A = A.pos['1'];
  const Ol = P(C1A.x + 24 * k + 6, C1A.y + 42 * k + 8);
  const C2F = P(Ol.x + 24 * k + 6, C1A.y);
  const fk = k * 1.25;
  const fx = C2F.x + 66 * fk, fy = C2F.y + 8 * fk;
  const F = furanose(fx, fy, {
    k: fk, dot: '2', L: 18,
    subs: { 2: { up: 'CH₂OH', upLen: 14 }, 3: { down: 'OH' }, 4: { up: 'OH', upLen: 4 }, 5: { down: 'CH₂OH', downLen: 34 } },
  });
  s += bond(C1A, Ol, { rFrom: 0, rTo: 15 }) + bond(Ol, C2F, { rFrom: 15, rTo: 0 });
  s += A.s + F.s;
  s += atom(Ol.x, Ol.y, 'O', { kind: 'warn' });
  return { s, A, F, Ol, right: fx + 66 * fk + 21 };
}
FIGURES.push({
  id: 'carb-disaccharides',
  section: 'carbohydrates',
  anchor: '<p>The reasoning never mentions sweetness, size or source.',
  viewBox: '0 0 760 300',
  alt: 'Left: maltose. Two glucose rings; C1 of the left ring points down to a bridging oxygen, which bonds up to C4 of the right ring. The right ring keeps a free OH on its C1. Right: sucrose. C1 of a glucose ring points down to a bridging oxygen, which bonds up to C2 of a five-membered fructose ring drawn turned end for end, with its ring oxygen at the back, a CH2OH up on C2 and a CH2OH down on C5. Neither anomeric carbon has a free OH.',
  build() {
    let s = '';
    s += panel(8, 8, 368, 284, { kind: 'good' });
    s += panel(384, 8, 368, 284, { kind: 'warn' });
    s += tg(192, 28, 'maltose: glucose α(1→4) glucose');
    s += tg(192, 44, 'one anomeric C still has its OH', 'fg-tag-good');
    const m = maltose(22, 168, 0.72);
    s += m.s;
    s += tg(m.Ol.x, m.Ol.y + 34, 'α link');
    s += tg(m.B.ends['1up'].x - 4, m.B.ends['1up'].y - 24, 'free OH', 'fg-tag-good');
    s += tg(192, 280, 'reducing', 'fg-tag-good');
    s += tg(568, 28, 'sucrose: glucose α(1→2)β fructose');
    s += tg(568, 44, 'both anomeric C are tied up', 'fg-tag-warn');
    const c = sucrose(398, 168, 0.72);
    s += c.s;
    s += tg(c.Ol.x - 12, c.Ol.y + 34, 'C1 to C2');
    s += tg(568, 280, 'non-reducing', 'fg-tag-warn');
    return s;
  },
  caption: 'Coral dots mark the anomeric carbons and coral fills the bridging oxygen. In sucrose the fructose ring is drawn turned end for end, so its C2 can reach the bridge; that turn also sends its two CH₂OH groups the opposite way from an unturned drawing.',
});

/* The four cases of the lesson's sort, stacked, with no verdicts on them:
   the student reads the anomeric carbons. */
FIGURES.push({
  id: 'l-carb-sort',
  lessons: ['carbohydrates'],
  viewBox: '0 0 340 720',
  alt: 'Three structures stacked, each with its anomeric carbons marked by dots. Maltose: two glucose rings, the left C1 joined through an oxygen to C4 of the right ring, whose C1 carries an OH. Sucrose: glucose C1 joined through an oxygen to fructose C2. Methyl alpha-D-glucopyranoside: a glucose ring whose C1 carries OCH3 pointing down.',
  build() {
    let s = '';
    s += tg(170, 18, 'maltose');
    s += maltose(4, 126, 0.6).s;
    s += tg(170, 256, 'sucrose');
    s += sucrose(8, 364, 0.6).s;
    s += tg(170, 494, 'methyl α-D-glucopyranoside');
    s += pyranose(164, 600, { k: 0.8, dot: '1', subs: glcSubs(null, { 1: { down: 'OCH₃' }, 5: { up: 'CH₂OH', upLen: 16 } }) }).s;
    return s;
  },
  caption: 'Dots mark the anomeric carbons. For each one, count its oxygens: is one of them an OH?',
});

/* ============================================================ fig 8 ===
   The redox reactions change only the ends of the chain, so they are
   drawn as Fischer projections with the changed ends highlighted. */
FIGURES.push({
  id: 'carb-redox',
  section: 'carbohydrates',
  anchor: 'hydrolyzed straight back by warm aqueous acid.</li>\n</ul>',
  viewBox: '0 0 760 360',
  alt: 'Four Fischer projections in a row. D-glucitol, with CH2OH at both ends, made from D-glucose by NaBH4. D-glucose, with CHO at the top. D-gluconic acid, with COOH at the top, made from glucose by bromine water. D-glucaric acid, with COOH at both ends, made by warm nitric acid. The four middle carbons are the same in all four.',
  build() {
    let s = '';
    const xs = [72, 282, 492, 690], y0 = 88;
    const names = [['D-glucitol', 'an alditol'], ['D-glucose', 'an aldose'], ['D-gluconic acid', 'an aldonic acid'], ['D-glucaric acid', 'an aldaric acid']];
    const ends = [['CH₂OH', 'CH₂OH', 'hi', null], ['CHO', 'CH₂OH', null, null], ['COOH', 'CH₂OH', 'hi', null], ['COOH', 'COOH', 'hi', 'hi']];
    xs.forEach((x, i) => {
      s += tg(x, 24, names[i][0]) + tg(x, 40, names[i][1], 'fg-tag-mut');
      s += fischer(x, y0, GLC_FISCHER(ends[i][0], ends[i][1], { top: ends[i][2], bottom: ends[i][3] }), { dy: 40, arm: 38 }).s;
    });
    s += arrow(P(222, y0), P(140, y0), { size: 7 }) + tg(181, y0 - 14, 'NaBH₄');
    s += arrow(P(342, y0), P(424, y0), { size: 7 }) + tg(383, y0 - 30, 'Br₂, H₂O') + tg(383, y0 - 14, 'or Tollens’', 'fg-tag-mut');
    s += arrow(P(552, y0), P(628, y0), { size: 7 }) + tg(590, y0 - 14, 'warm HNO₃');
    s += tg(380, 348, 'C2 to C5 never change', 'fg-tag-mut');
    return s;
  },
  caption: 'Teal marks the ends that changed. Warm nitric acid also oxidizes glucose straight to glucaric acid, through gluconic acid on the way.',
});

/* ============================================================ fig 9 ===
   Fructose to an aldose in base, with every arrow. Only C1 and C2 change,
   so only they are drawn; R is C3 to C6. */
function hydroxide(c, lpDeg) {
  // An HO- ion: O with its H to the left, three lone pairs, and a charge.
  const H = P(c.x - 36, c.y);
  let s = bond(c, H, { rFrom: 15, rTo: 12 }) + atom(H.x, H.y, 'H', { r: 12 }) + atom(c.x, c.y, 'O');
  for (const d of [lpDeg, lpDeg + 115, lpDeg - 115]) s += lonePair(c.x, c.y, -d, { dist: 21 });
  s += minus(P(c.x - 20, c.y - 20));
  return s;
}
function enediolPanels(pn) {
  let s = '';
  const head = (p, t1, t2) => tg(p.x + p.w / 2, p.y + 20, t1) + tg(p.x + p.w / 2, p.y + 36, t2, 'fg-tag-mut');
  for (const p of pn) s += panel(p.x, p.y, p.w, p.h);
  const lbl2 = (c, deg, len, l, o = {}) => {
    const e = at(c, deg, len);
    return { s: bond(c, e, { rFrom: 16, rTo: rOf(l), order: o.order || 1, cls: o.cls }) + atom(e.x, e.y, l, { r: rOf(l), kind: o.kind }), e };
  };
  /* 1: fructose, base removes the C1 hydrogen. */
  {
    const p = pn[0];
    s += head(p, '1 · base takes H⁺ from C1', 'fructose, C1 and C2');
    const C1 = P(p.x + p.w / 2 - 10, p.y + 140), C2 = P(C1.x + 80, C1.y);
    const Ht = lbl2(C1, 90, 48, 'H', { kind: 'hi' });
    const OH = lbl2(C1, 200, 52, 'OH'), Hb = lbl2(C1, 270, 46, 'H');
    const O2 = lbl2(C2, 80, 62, 'O', { order: 2 }), R = lbl2(C2, -40, 50, 'R');
    s += bond(C1, C2, { rFrom: 16, rTo: 16 });
    s += Ht.s + OH.s + Hb.s + O2.s + R.s;
    s += atom(C1.x, C1.y, 'C', { kind: 'warn' }) + atom(C2.x, C2.y, 'C', { kind: 'warn' });
    s += lonePair(O2.e.x, O2.e.y, -150, { dist: 21 }) + lonePair(O2.e.x, O2.e.y, -60, { dist: 21 });
    const B = P(C1.x - 92, C1.y - 70);
    s += hydroxide(B, 0);
    s += curve(P(B.x + 24, B.y), P(Ht.e.x - 14, Ht.e.y - 2), { bow: -14, size: 7 });
    s += curve(mid(C1, Ht.e, 0.55), mid(C1, C2), { bow: -18, size: 7 });
    s += curve(P((C2.x + O2.e.x) / 2 + 6, (C2.y + O2.e.y) / 2), P(O2.e.x + 17, O2.e.y + 6), { bow: 16, size: 7 });
    s += tg(p.x + p.w / 2, p.y + p.h - 12, 'the O⁻ that forms then takes H⁺ from water', 'fg-tag-mut');
  }
  /* 2: the enediol. */
  {
    const p = pn[1];
    s += head(p, '2 · the enediol', 'a C=C with an OH on each carbon');
    const C1 = P(p.x + p.w / 2 - 40, p.y + 140), C2 = P(C1.x + 80, C1.y);
    s += bond(C1, C2, { rFrom: 16, rTo: 16, order: 2 });
    s += lbl2(C1, 130, 52, 'OH').s + lbl2(C1, 230, 46, 'H').s;
    s += lbl2(C2, 50, 52, 'OH', { kind: 'hi' }).s + lbl2(C2, -50, 50, 'R').s;
    s += atom(C1.x, C1.y, 'C', { kind: 'warn' }) + atom(C2.x, C2.y, 'C', { kind: 'warn' });
  }
  /* 3: base removes the C1 OH proton; the O- pushes, C2 takes H+ from water. */
  {
    const p = pn[2];
    s += head(p, '3 · base takes H⁺ from the C1 OH', 'then the C=C takes H⁺ at C2');
    const C1 = P(p.x + p.w / 2 - 50, p.y + 118), C2 = P(C1.x + 80, C1.y);
    const dbl = bond(C1, C2, { rFrom: 16, rTo: 16, order: 2 });
    s += dbl;
    const O1 = lbl2(C1, 130, 54, 'O');
    s += O1.s + lbl2(C1, 230, 46, 'H').s;
    s += lbl2(C2, 50, 52, 'OH').s + lbl2(C2, -10, 50, 'R').s;
    s += atom(C1.x, C1.y, 'C', { kind: 'warn' }) + atom(C2.x, C2.y, 'C', { kind: 'warn' });
    for (const d of [0, 110, 220]) s += lonePair(O1.e.x, O1.e.y, -d, { dist: 21 });
    s += minus(P(O1.e.x + 20, O1.e.y - 20));
    // water below C2
    const Hw = P(C2.x - 8, C2.y + 66), Ow = P(Hw.x + 40, Hw.y + 26), Hw2 = P(Ow.x + 38, Ow.y);
    s += bond(Hw, Ow, { rFrom: 12, rTo: 15 }) + bond(Ow, Hw2, { rFrom: 15, rTo: 12 });
    s += atom(Hw.x, Hw.y, 'H', { r: 12, kind: 'hi' }) + atom(Ow.x, Ow.y, 'O') + atom(Hw2.x, Hw2.y, 'H', { r: 12 });
    s += lonePair(Ow.x, Ow.y, 90, { dist: 21 }) + lonePair(Ow.x, Ow.y, -75, { dist: 21 });
    s += curve(P(O1.e.x + 24, O1.e.y - 2), P(mid(C1, O1.e).x + 8, mid(C1, O1.e).y + 2), { bow: -16, size: 7 });
    // the pi bond: start from the lower line of the double bond
    const piStart = P((C1.x + C2.x) / 2, C1.y + 5);
    s += curve(piStart, P(Hw.x - 10, Hw.y - 10), { bow: 16, size: 7 });
    s += curve(mid(Hw, Ow), P(Ow.x - 16, Ow.y + 7), { bow: 16, size: 7 });
  }
  /* 4: the aldose. */
  {
    const p = pn[3];
    s += head(p, '4 · an aldose: C=O at C1', 'H can reach C2 from either face');
    const C1 = P(p.x + p.w / 2 - 40, p.y + 140), C2 = P(C1.x + 80, C1.y);
    s += bond(C1, C2, { rFrom: 16, rTo: 16 });
    s += lbl2(C1, 120, 54, 'O', { order: 2 }).s + lbl2(C1, 240, 46, 'H').s;
    s += lbl2(C2, 90, 48, 'OH').s + lbl2(C2, 0, 52, 'R').s + lbl2(C2, 270, 46, 'H', { kind: 'hi' }).s;
    s += atom(C1.x, C1.y, 'C', { kind: 'warn' }) + atom(C2.x, C2.y, 'C', { kind: 'warn' });
    s += tg(p.x + p.w / 2, p.y + p.h - 12, 'glucose or mannose, the C2 epimers', 'fg-tag-mut');
  }
  return s;
}
FIGURES.push({
  id: 'carb-enediol',
  section: 'carbohydrates',
  anchor: 'a capped anomeric carbon is what makes a sugar safe.</div>',
  viewBox: '0 0 760 520',
  alt: 'Four panels showing C1 and C2 of fructose becoming an aldose in base; R stands for C3 to C6. 1: hydroxide takes a hydrogen from C1; the C–H bond electrons move to make a C1=C2 bond and the C=O pi electrons move onto oxygen. 2: after that oxygen takes a proton from water, the enediol: C1=C2 with an OH on each carbon. 3: base has taken the proton from the C1 OH; a lone pair on the C1 O minus moves in to make C=O, the C=C electrons take a proton from water at C2, and the water O–H electrons stay on its oxygen. 4: the aldose, with C=O at C1 and a new H on C2.',
  build: () => enediolPanels([
    { x: 8, y: 8, w: 368, h: 250 }, { x: 384, y: 8, w: 368, h: 250 },
    { x: 8, y: 266, w: 368, h: 250 }, { x: 384, y: 266, w: 368, h: 250 },
  ]),
  caption: 'Base runs every step both ways, which is why fructose, glucose and mannose interconvert in base. Coral marks C1 and C2; teal marks the hydrogens that move.',
});

/* =========================================================== fig 10 ===
   Starch against cellulose: two units of each chain, and what the chain
   does. In the beta chain the second glucose is drawn turned over, which
   is also how it sits in cellulose. */
function helix(x, y, w, amp, turns) {
  // A coil seen from the side: back halves dashed, front halves solid.
  let s = '';
  const N = turns * 40;
  let pts = [];
  let lastFront = null;
  const flush = (front) => {
    if (pts.length > 1) s += `<path class="${front ? 'fg-bond-hi' : 'fg-dash'}" d="M${pts.map((p) => `${r2(p.x)} ${r2(p.y)}`).join(' L')}"></path>`;
  };
  for (let i = 0; i <= N; i++) {
    // A coil along the x axis, seen slightly from the side, so each turn
    // shows as a loop: the front half solid, the back half dashed.
    const t = (i / N) * turns * 2 * Math.PI;
    const c = w / (turns * 2 * Math.PI + 2);
    const p = P(x + c * (t + 1) - 1.6 * c * Math.sin(t), y - Math.cos(t) * amp);
    const front = Math.sin(t) < 0;
    if (lastFront !== null && front !== lastFront) { pts.push(p); flush(lastFront); pts = [p]; }
    else pts.push(p);
    lastFront = front;
  }
  flush(lastFront);
  return s;
}
function strands(x, y, w, gap) {
  let s = '';
  for (let j = 0; j < 3; j++) {
    const yy = y + j * gap;
    s += `<line class="fg-bond-hi" x1="${x}" y1="${yy}" x2="${x + w}" y2="${yy}"></line>`;
    if (j < 2) for (let i = 1; i < 7; i++) {
      const xx = x + (i * w) / 7;
      s += `<line class="fg-dash" x1="${r2(xx)}" y1="${yy + 5}" x2="${r2(xx)}" y2="${yy + gap - 5}"></line>`;
    }
  }
  return s;
}
function cellobiose(x0, cy, k) {
  let s = '';
  const ax = x0 + 66 * k + 16;
  const A = pyranose(ax, cy, { k, dot: '1', subs: glcSubs(null, { 5: { up: 'CH₂OH', upLen: 16 } }) });
  const C1A = A.pos['1'];
  const Ol = P(C1A.x + 24 * k + 6, C1A.y - 42 * k - 8);
  const C4B = P(Ol.x + 24 * k + 6, C1A.y);
  const bx = C4B.x + 92 * k;
  // Turned over: every up/down of glucose swaps, and C1 stays beta.
  const B = pyranose(bx, cy, {
    k, turned: true, dot: '1',
    subs: { 1: { down: 'OH' }, 2: { up: 'OH' }, 3: { down: 'OH', downLen: 10 }, 5: { down: 'CH₂OH', downLen: 10 } },
  });
  s += bond(C1A, Ol, { rFrom: 0, rTo: 15 }) + bond(Ol, C4B, { rFrom: 15, rTo: 0 });
  s += A.s + B.s + atom(Ol.x, Ol.y, 'O', { kind: 'warn' });
  return { s, Ol };
}
FIGURES.push({
  id: 'carb-polysaccharides',
  section: 'carbohydrates',
  anchor: '<li><b>Starch</b> (amylose) — glucose joined α-1,4. The α linkage makes a helical chain, and we digest it easily.</li>\n</ul>',
  viewBox: '0 0 760 470',
  alt: 'Top row: two glucose units of amylose, joined by an alpha 1,4 link whose oxygen hangs below the rings, and beside them a chain coiled into a helix. Bottom row: two glucose units of cellulose, joined by a beta 1,4 link whose oxygen sits above the rings, with the second glucose drawn turned over so its ring oxygen is at the front; beside them, three straight chains lying side by side with dashed hydrogen bonds between them.',
  build() {
    let s = '';
    s += panel(8, 8, 744, 222, { kind: 'good' });
    s += panel(8, 240, 744, 222);
    s += tg(190, 28, 'amylose (starch): α-1,4') + tg(190, 44, 'each C1 link opposite the CH₂OH (α)', 'fg-tag-mut');
    const m = maltose(24, 138, 0.72);
    s += m.s + tg(m.Ol.x, m.Ol.y + 32, 'α');
    s += tg(590, 44, 'the chain coils into a helix', 'fg-tag-good');
    s += helix(450, 128, 280, 42, 3.5);
    s += tg(590, 210, 'amylase can cut it: we digest starch', 'fg-tag-mut');
    s += tg(190, 260, 'cellulose: β-1,4') + tg(190, 276, 'every second glucose is turned over', 'fg-tag-mut');
    const c = cellobiose(24, 380, 0.72);
    s += c.s + tg(c.Ol.x - 22, c.Ol.y - 6, 'β', 'fg-tag', 'end');
    s += tg(590, 276, 'straight chains stack and hydrogen-bond', 'fg-tag-good');
    s += strands(450, 318, 280, 44);
    s += tg(590, 448, 'dashes: hydrogen bonds between chains', 'fg-tag-mut');
    return s;
  },
  caption: 'Two units of each chain; the coral oxygen is the glycosidic link. In the lower drawing the second ring is turned over, so its ring oxygen sits at the front and its groups point the opposite way. It is still β-D-glucose.',
});
FIGURES.push({
  id: 'l-carb-polysaccharides',
  lessons: ['carbohydrates'],
  viewBox: '0 0 340 620',
  alt: 'Top: two glucose units joined alpha 1,4, the link oxygen below the rings, and under them a chain coiled into a helix. Bottom: two glucose units joined beta 1,4, the link oxygen above the rings and the second ring turned over, and under them three straight chains side by side with dashed hydrogen bonds.',
  build() {
    let s = '';
    s += panel(4, 4, 332, 300, { kind: 'good' });
    s += panel(4, 314, 332, 302);
    s += tg(170, 24, 'amylose: α-1,4');
    s += maltose(10, 126, 0.6).s;
    s += tg(170, 228, 'the chain coils into a helix', 'fg-tag-good');
    s += helix(40, 268, 260, 22, 3.5);
    s += tg(170, 334, 'cellulose: β-1,4');
    s += cellobiose(10, 450, 0.6).s;
    s += tg(170, 530, 'straight chains stack and H-bond', 'fg-tag-good');
    s += strands(40, 552, 260, 24);
    return s;
  },
  caption: 'The coral oxygen is the glycosidic link. In cellulose every second glucose is turned over, and the chain stays straight.',
});

export default FIGURES;
