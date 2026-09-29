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
      const e = P(pos[key].x, pos[key].y + (dir === 'up' ? -len : len));
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
  if (turned) subs[5] = { up: 'CH₂OH', down: 'H', downLen: 4 };
  else subs[5] = { up: 'H', down: 'OH', downLen: 2, downKind: o.hi ? 'hi' : undefined };
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

export default FIGURES;
