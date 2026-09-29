/* Figures for the rs-configuration notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every stereocenter drawn here is assigned twice: once by the figure's
   text (the R or S the caption and the page state) and once by
   configOf(), which reads the drawn geometry. build() throws if the two
   disagree, so a figure cannot ship with the wrong label on it.

   Angles are paper angles, counterclockwise from east, as in armEnd().
   Group labels sit in pills sized to their text, because a formula such as
   CH(CH₃)₂ does not fit in a disc.

   Figures shown in the lesson (lessons: [...], or an l- id) are 340 wide or
   less and use only fg-lbl and fg-tag text. */
import { atom, bond, wedge, hash, arrow, text, panel, P } from '../lib/ochem-figure.mjs';
import { sk, ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

const f2 = (v) => (Math.round(v * 100) / 100).toString();
const Tag = (p, s, o = {}) => text(p.x, p.y, s, { cls: 'fg-tag', size: 11, ...o });
const Good = (p, s, o = {}) => text(p.x, p.y, s, { cls: 'fg-tag-good', size: 11, ...o });
const Warn = (p, s, o = {}) => text(p.x, p.y, s, { cls: 'fg-tag-warn', size: 11, ...o });
/* A tag whose text carries markup, such as an italic tert. */
const TagRaw = (p, html) => `<text class="fg-tag" x="${f2(p.x)}" y="${f2(p.y)}" text-anchor="middle" font-size="11">${html}</text>`;

/* A group label in a pill: 13px monospace is about 8.1px a character. */
const PH = 26;
const wOf = (l) => Math.max(PH, [...l].length * 8.1 + 14);
function pill(p, l, kind) {
  const w = wOf(l);
  const cls = kind ? `fg-atom-${kind}` : 'fg-atom';
  return `<rect class="${cls}" x="${f2(p.x - w / 2)}" y="${f2(p.y - PH / 2)}" width="${f2(w)}" height="${PH}" rx="13"></rect>` +
    text(p.x, p.y + 4.6, l, { cls: 'fg-lbl', size: 13 });
}
/* Distance from a pill's centre to its edge along paper angle deg. */
function cutOf(l, deg) {
  const r = (deg * Math.PI) / 180;
  const dx = Math.abs(Math.cos(r)), dy = Math.abs(Math.sin(r));
  const tx = dx > 1e-6 ? wOf(l) / 2 / dx : Infinity;
  const ty = dy > 1e-6 ? PH / 2 / dy : Infinity;
  return Math.min(tx, ty);
}

/* The configuration a drawing actually shows. Plain bonds lie in the page,
   wedges come out (+z), hashes go back (−z). R when 1 → 2 → 3 turns
   clockwise seen from the side opposite priority 4. */
function configOf(gs) {
  const v = {};
  for (const g of gs) {
    const r = (g.deg * Math.PI) / 180;
    v[g.pri] = [Math.cos(r), Math.sin(r), g.kind === 'wedge' ? 0.8 : g.kind === 'hash' ? -0.8 : 0];
  }
  const d = (a, b) => a.map((x, i) => x - b[i]);
  const a = d(v[1], v[4]), b = d(v[2], v[4]), c = d(v[3], v[4]);
  const det = a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  if (Math.abs(det) < 0.05) throw new Error('rs-configuration: degenerate stereo drawing');
  return det < 0 ? 'R' : 'S';
}
function expect(gs, want, where) {
  const got = configOf(gs);
  if (got !== want) throw new Error(`rs-configuration figure ${where}: drawn geometry is ${got}, text says ${want}`);
}
/* Does 1 → 2 → 3 turn clockwise on the page, as drawn? */
function cwAsDrawn(gs) {
  const a = (p) => gs.find((g) => g.pri === p).deg;
  const m = (x) => ((x % 360) + 360) % 360;
  return m(a(1) - a(2)) + m(a(2) - a(3)) < 360;
}

/* A circular arrow of radius r about c, from paper angle a0 to a1, turning
   clockwise (cw) or counterclockwise on the page, with its head at a1. */
function arcArrow(c, r, a0, a1, cw) {
  const pt = (a) => P(c.x + r * Math.cos((a * Math.PI) / 180), c.y - r * Math.sin((a * Math.PI) / 180));
  const span = cw ? ((a0 - a1) % 360 + 360) % 360 : ((a1 - a0) % 360 + 360) % 360;
  const size = 8;
  const back = (size / r) * (180 / Math.PI);
  const e = pt(cw ? a1 + back : a1 - back);
  const s0 = pt(a0), tip = pt(a1);
  const rad = (a1 * Math.PI) / 180;
  const ux = cw ? Math.sin(rad) : -Math.sin(rad);
  const uy = cw ? Math.cos(rad) : -Math.cos(rad);
  const px = -uy, py = ux, h = size * 0.52;
  const bx = tip.x - ux * size, by = tip.y - uy * size;
  const large = span - back > 180 ? 1 : 0;
  return `<path class="fg-arrow" d="M${f2(s0.x)} ${f2(s0.y)} A${f2(r)} ${f2(r)} 0 ${large} ${cw ? 1 : 0} ${f2(e.x)} ${f2(e.y)}"></path>` +
    `<path class="fg-head" d="M${f2(tip.x)} ${f2(tip.y)} L${f2(bx + px * h)} ${f2(by + py * h)} L${f2(bx - px * h)} ${f2(by - py * h)} Z"></path>`;
}

/* A stereocenter at c. gs: [{ deg, lab, kind: 'plain'|'wedge'|'hash', pri, hi }].
   Draws the bonds, the group pills and (unless badges: false) a priority
   number at the outer corner of each pill. Returns the ink and the radius
   an arc must clear. */
function tetra(c, gs, o = {}) {
  const L = o.L ?? 56;
  let s = '', reach = 0;
  for (const g of gs) {
    const len = g.len ?? L;
    const end = armEnd(c, g.deg, len - cutOf(g.lab, g.deg) - 3);
    const opts = { rFrom: 17, rTo: 0 };
    s += g.kind === 'wedge' ? wedge(c, end, { ...opts, width: 10 })
      : g.kind === 'hash' ? hash(c, end, { ...opts, width: 12, rungs: 5 })
      : bond(c, end, opts);
  }
  for (const g of gs) {
    const len = g.len ?? L;
    const p = armEnd(c, g.deg, len);
    s += pill(p, g.lab, g.hi);
    const r = (g.deg * Math.PI) / 180;
    const sx = Math.cos(r) < -0.2 ? -1 : 1, sy = Math.sin(r) > 0.2 ? -1 : 1;
    const cx = p.x + sx * (wOf(g.lab) / 2 + 7), cy = p.y + sy * (PH / 2 + 4);
    reach = Math.max(reach, Math.hypot(cx - c.x, cy - c.y) + 6);
    if (o.badges !== false && g.pri) {
      s += text(cx, cy + 4, String(g.pri), { cls: g.pri === 4 ? 'fg-tag-warn' : 'fg-tag-good', size: 11 });
    }
  }
  s += atom(c.x, c.y, o.center ?? 'C', { kind: 'hi' });
  return { s, reach };
}
/* The 1 → 2 → 3 arrow around a drawn center, outside every label. */
function trace(c, gs, reach, pad = 8) {
  const a = (p) => gs.find((g) => g.pri === p).deg;
  const cw = cwAsDrawn(gs);
  const off = 14;
  const off0 = 4;
  return arcArrow(c, reach + pad, cw ? a(1) - off0 : a(1) + off0, cw ? a(3) + off : a(3) - off, cw);
}
/* One whole assignment: drawing, priorities, arrow, checked answer. */
function assign(c, gs, want, where, o = {}) {
  expect(gs, want, where);
  const t = tetra(c, gs, o);
  return t.s + (o.arc === false ? '' : trace(c, gs, t.reach, o.pad));
}

/* ------------------------------------------------------ the molecules --- */

/* CHFClBr, H on the hash: Br → Cl → F clockwise, R. */
const CHFCLBR = [
  { deg: 90, lab: 'Br', kind: 'plain', pri: 1 },
  { deg: 340, lab: 'Cl', kind: 'wedge', pri: 2 },
  { deg: 210, lab: 'F', kind: 'plain', pri: 3 },
  { deg: 290, lab: 'H', kind: 'hash', pri: 4, hi: 'warn' },
];
/* Butan-2-ol with H on the hash, and glyceraldehyde in the same pose with
   H on the wedge. Same trace, opposite answers. */
const BUTANOL = [
  { deg: 90, lab: 'OH', kind: 'plain', pri: 1 },
  { deg: 205, lab: 'CH₂CH₃', kind: 'plain', pri: 2 },
  { deg: 335, lab: 'CH₃', kind: 'plain', pri: 3 },
  { deg: 270, lab: 'H', kind: 'hash', pri: 4, hi: 'warn', len: 58 },
];
const GLYCER = [
  { deg: 90, lab: 'OH', kind: 'plain', pri: 1 },
  { deg: 205, lab: 'CHO', kind: 'plain', pri: 2 },
  { deg: 335, lab: 'CH₂OH', kind: 'plain', pri: 3 },
  { deg: 270, lab: 'H', kind: 'wedge', pri: 4, hi: 'warn', len: 58 },
];
/* (S)-3,4-dimethylpentan-1-ol at C3. */
const DIMETHYL = [
  { deg: 90, lab: 'CH(CH₃)₂', kind: 'plain', pri: 1 },
  { deg: 210, lab: 'CH₂CH₂OH', kind: 'plain', pri: 2, len: 70 },
  { deg: 340, lab: 'CH₃', kind: 'wedge', pri: 3 },
  { deg: 290, lab: 'H', kind: 'hash', pri: 4, hi: 'warn' },
];
/* 2-Bromobutane with H in the page; swapping H with the hashed CH₃ gives
   a drawing that reads R, so the drawing as given is S. */
const BROMO_AS_DRAWN = [
  { deg: 340, lab: 'Br', kind: 'wedge', pri: 1 },
  { deg: 210, lab: 'CH₂CH₃', kind: 'plain', pri: 2 },
  { deg: 290, lab: 'CH₃', kind: 'hash', pri: 3, hi: 'hi' },
  { deg: 90, lab: 'H', kind: 'plain', pri: 4, hi: 'warn' },
];
const BROMO_SWAPPED = [
  { deg: 340, lab: 'Br', kind: 'wedge', pri: 1 },
  { deg: 210, lab: 'CH₂CH₃', kind: 'plain', pri: 2 },
  { deg: 90, lab: 'CH₃', kind: 'plain', pri: 3, hi: 'hi' },
  { deg: 290, lab: 'H', kind: 'hash', pri: 4, hi: 'warn' },
];
/* The lesson's challenge: butan-2-ol with H in the page. Swapping H with
   the hashed ethyl reads R, so the drawing is S. */
const CHALLENGE = [
  { deg: 340, lab: 'OH', kind: 'wedge' , pri: 1 },
  { deg: 290, lab: 'CH₂CH₃', kind: 'hash', pri: 2 },
  { deg: 90, lab: 'CH₃', kind: 'plain', pri: 3 },
  { deg: 210, lab: 'H', kind: 'plain', pri: 4 },
];
const CHALLENGE_SWAPPED = [
  { deg: 340, lab: 'OH', kind: 'wedge', pri: 1 },
  { deg: 210, lab: 'CH₂CH₃', kind: 'plain', pri: 2 },
  { deg: 90, lab: 'CH₃', kind: 'plain', pri: 3 },
  { deg: 290, lab: 'H', kind: 'hash', pri: 4 },
];
expect(CHALLENGE_SWAPPED, 'R', 'challenge (swapped)');
expect(CHALLENGE, 'S', 'challenge');
/* (2R,3S)-3-bromobutan-2-ol: each center pulled out of the zigzag with its
   bond angles unchanged. */
const C2 = [
  { deg: 60, lab: 'OH', kind: 'wedge', pri: 1 },
  { deg: 330, lab: 'CHBrCH₃', kind: 'plain', pri: 2 },
  { deg: 210, lab: 'CH₃', kind: 'plain', pri: 3 },
  { deg: 120, lab: 'H', kind: 'hash', pri: 4, hi: 'warn' },
];
const C3 = [
  { deg: 300, lab: 'Br', kind: 'hash', pri: 1 },
  { deg: 150, lab: 'CH(OH)CH₃', kind: 'plain', pri: 2 },
  { deg: 30, lab: 'CH₃', kind: 'plain', pri: 3 },
  { deg: 240, lab: 'H', kind: 'wedge', pri: 4, hi: 'warn' },
];

/* ------------------------------------------------ 1. the method ------- */

function methodCell(ox, oy, w, h, stage, single = false) {
  const c = P(ox + w / 2, oy + 140);
  let s = panel(ox, oy, w, h, stage === 3 ? { kind: 'hi' } : {});
  const titles = ['1 · Rank the groups', '2 · Priority 4 points away', '3 · Trace, 4 · read'];
  s += Tag(P(ox + w / 2, oy + 22), single ? 'Trace and read' : titles[stage - 1]);
  const gs = CHFCLBR.map((g) => ({ ...g, hi: stage >= 2 && g.pri === 4 ? 'warn' : undefined }));
  s += assign(c, gs, 'R', 'rs-method', { arc: stage === 3, badges: true });
  const lines = stage === 1 ? ['Br > Cl > F > H', 'by atomic number']
    : stage === 2 ? ['H is on the hash,', 'behind the page']
    : ['Br → Cl → F clockwise', 'so this carbon is R'];
  s += (stage === 3 ? Good : Tag)(P(ox + w / 2, oy + h - 34), lines[0]);
  s += (stage === 3 ? Good : Tag)(P(ox + w / 2, oy + h - 16), lines[1]);
  return s;
}

FIGURES.push({
  id: 'rs-method',
  section: 'rs-configuration',
  anchor: '<h3>The four-step method</h3>',
  alt: 'Bromochlorofluoromethane drawn three times. Br is on a plain bond at the top, F on a plain bond at lower left, Cl on a wedge at lower right and H on a hash below it. Panel 1 numbers the groups Br 1, Cl 2, F 3, H 4. Panel 2 highlights H on the hash, pointing behind the page. Panel 3 adds an arrow from Br to Cl to F that turns clockwise, so the carbon is R.',
  viewBox: '0 0 760 300',
  build() {
    return methodCell(4, 4, 244, 292, 1) + methodCell(258, 4, 244, 292, 2) + methodCell(512, 4, 244, 292, 3);
  },
  caption: 'The four steps on (R)-bromochlorofluoromethane. The green numbers are priorities, and priority 4 is marked in red.',
});

FIGURES.push({
  id: 'l-rs-method',
  lessons: ['rs-configuration'],
  alt: 'Bromochlorofluoromethane with Br at the top (priority 1), Cl on a wedge at lower right (2), F at lower left (3) and H on a hash (4). An arrow from Br to Cl to F turns clockwise, so the carbon is R.',
  viewBox: '0 0 340 300',
  build() {
    return methodCell(4, 4, 332, 292, 3, true);
  },
  caption: 'H, priority 4, is on the hash, so it points away. Br → Cl → F turns clockwise: R.',
});

/* ------------------------------------- 2. the first point of difference --- */

/* One group's first carbon: a stub from the stereocenter on the left, the
   carbon, and its three other neighbors, with the set written beside it. */
function firstAtom(o, subs, set, win, name, hiIdx = 0) {
  const c = P(o.x, o.y);
  const st = P(c.x - 50, c.y);
  let s = bond(st, c, { rFrom: 11, rTo: 16 });
  s += atom(st.x, st.y, '', { r: 5, kind: 'plain' });
  const degs = [55, 0, 305];
  subs.forEach((l, i) => {
    const p = armEnd(c, degs[i], 50);
    s += bond(c, armEnd(c, degs[i], 50 - cutOf(l, degs[i]) - 3), { rFrom: 16, rTo: 0 });
    s += pill(p, l, i === hiIdx && win ? 'hi' : undefined);
  });
  s += atom(c.x, c.y, 'C', { kind: 'hi' });
  s += (win ? Good : Tag)(P(o.x + 132, o.y - 4), set, { anchor: 'middle' });
  s += TagRaw(P(o.x + 132, o.y + 16), name);
  return s;
}
function diffCell(ox, oy, w, h, top, bot, v1, v2, head) {
  let s = panel(ox, oy, w, h);
  s += Tag(P(ox + w / 2, oy + 22), head);
  s += firstAtom(P(ox + 66, oy + 96), top.subs, top.set, true, top.name, top.hi);
  s += firstAtom(P(ox + 66, oy + 212), bot.subs, bot.set, false, bot.name);
  s += Good(P(ox + w / 2, oy + h - 36), v1);
  s += Tag(P(ox + w / 2, oy + h - 18), v2);
  return s;
}
const DIFF = [
  [{ name: 'ethyl', subs: ['CH₃', 'H', 'H'], set: '(C, H, H)' },
   { name: 'methyl', subs: ['H', 'H', 'H'], set: '(H, H, H)' },
   'C beats H in position 1', 'ethyl ranks higher', 'butan-2-ol'],
  [{ name: 'CH₂OH', subs: ['OH', 'H', 'H'], set: '(O, H, H)' },
   { name: '<tspan font-style="italic">tert</tspan>-butyl', subs: ['CH₃', 'CH₃', 'CH₃'], set: '(C, C, C)' },
   'O beats C in position 1', 'no adding up', 'one O against three C'],
  [{ name: 'isopropyl', subs: ['CH₃', 'CH₃', 'H'], set: '(C, C, H)', hi: 1 },
   { name: 'CH₂CH₂OH', subs: ['CH₂OH', 'H', 'H'], set: '(C, H, H)' },
   'C beats H in position 2', 'the O is never reached', 'the O that comes too late'],
];

FIGURES.push({
  id: 'cip-first-difference',
  section: 'rs-configuration',
  anchor: 'Rule 2: on a tie',
  alt: 'Three comparisons, each showing the first carbon of two groups with its three other neighbors. Ethyl (C, H, H) beats methyl (H, H, H) in position 1. CH2OH (O, H, H) beats tert-butyl (C, C, C) in position 1, because O beats C. Isopropyl (C, C, H) beats CH2CH2OH (C, H, H) in position 2, so the oxygen further out never counts.',
  viewBox: '0 0 760 340',
  build() {
    return DIFF.map((d, i) => diffCell(4 + i * 254, 4, 244, 332, d[0], d[1], d[2], d[3], d[4])).join('');
  },
  caption: 'Each carbon is the group’s first atom; the small dot is the stereocenter. The winner of each pair is on top, with its deciding atom highlighted.',
});

FIGURES.push({
  id: 'l-first-difference',
  lessons: ['rs-configuration'],
  alt: 'Two comparisons stacked. Ethyl (C, H, H) beats methyl (H, H, H) in position 1. CH2OH (O, H, H) beats tert-butyl (C, C, C) in position 1, because O beats C.',
  viewBox: '0 0 340 672',
  build() {
    return [0, 1].map((i) => diffCell(4, 4 + i * 336, 332, 330, DIFF[i][0], DIFF[i][1], DIFF[i][2], DIFF[i][3], DIFF[i][4])).join('');
  },
  caption: 'Write each set highest first, then compare position by position. The first difference decides.',
});

/* ------------------------- 3. worked example: 3,4-dimethylpentan-1-ol --- */

FIGURES.push({
  id: 'rs-dimethylpentanol',
  section: 'rs-configuration',
  anchor: 'Worked example — 3,4-dimethylpentan-1-ol',
  alt: 'C3 of 3,4-dimethylpentan-1-ol. CH(CH3)2 at the top is priority 1, CH2CH2OH at lower left is 2, CH3 on a wedge at lower right is 3 and H on a hash is 4. The arrow from 1 to 2 to 3 turns counterclockwise, so the center is S.',
  viewBox: '0 0 340 334',
  build() {
    const c = P(170, 150);
    let s = assign(c, DIMETHYL, 'S', 'rs-dimethylpentanol');
    s += Good(P(170, 304), '1 → 2 → 3 counterclockwise: S');
    s += Tag(P(170, 324), 'H on the hash, so no flip');
    return s;
  },
  caption: 'C3 of (S)-3,4-dimethylpentan-1-ol.',
});

/* --------------------------------------------- 4. duplicate atoms ------ */

function dupColumn(ox, oy, w, h, kind) {
  let s = panel(ox, oy, w, h);
  const heads = { cho: 'aldehyde, CHO', cooh: 'carboxylic acid, COOH', cn: 'nitrile, C≡N' };
  s += Tag(P(ox + w / 2, oy + 22), heads[kind]);
  const top = P(ox + w / 2 - 6, oy + 80), bot = P(ox + w / 2 - 6, oy + 224);
  const stub = (c) => {
    const st = P(c.x - 56, c.y);
    return bond(st, c, { rFrom: 6, rTo: 16 }) + atom(st.x, st.y, '', { r: 5 });
  };
  const arm = (c, deg, l, len, o = {}) => {
    const p = armEnd(c, deg, len);
    return bond(c, armEnd(c, deg, len - cutOf(l, deg) - 3), { rFrom: 16, rTo: 0, ...o }) + pill(p, l, o.hi);
  };
  // As drawn.
  s += stub(top);
  if (kind === 'cho') s += arm(top, 50, 'O', 52, { order: 2 }) + arm(top, 310, 'H', 52);
  if (kind === 'cooh') s += arm(top, 50, 'O', 52, { order: 2 }) + arm(top, 310, 'OH', 52);
  if (kind === 'cn') s += arm(top, 0, 'N', 58, { order: 3, gap: 3.6 });
  s += atom(top.x, top.y, 'C', { kind: 'hi' });
  s += Tag(P(ox + 14, oy + 46), 'as drawn', { anchor: 'start' });
  s += arrow(P(ox + 30, oy + 120), P(ox + 30, oy + 172), { size: 7 });
  s += Tag(P(ox + 14, oy + 190), 'as counted', { anchor: 'start' });
  // As counted.
  s += stub(bot);
  if (kind === 'cho') s += arm(bot, 50, 'O', 52) + arm(bot, 0, '[O]', 62, { hi: 'warn' }) + arm(bot, 310, 'H', 52);
  if (kind === 'cooh') s += arm(bot, 50, 'O', 52) + arm(bot, 0, '[O]', 62, { hi: 'warn' }) + arm(bot, 310, 'OH', 52);
  if (kind === 'cn') s += arm(bot, 50, 'N', 52) + arm(bot, 0, '[N]', 62, { hi: 'warn' }) + arm(bot, 310, '[N]', 52, { hi: 'warn' });
  s += atom(bot.x, bot.y, 'C', { kind: 'hi' });
  const sets = { cho: '(O, O, H)', cooh: '(O, O, O)', cn: '(N, N, N)' };
  s += Good(P(ox + w / 2, oy + h - 16), 'counts as ' + sets[kind]);
  return s;
}

FIGURES.push({
  id: 'cip-duplicate-atoms',
  section: 'rs-configuration',
  anchor: 'Rule 3: a multiple bond',
  alt: 'Three groups, each drawn as it really is and then as CIP counts it. The aldehyde carbon, doubly bonded to O and bonded to H, counts as bonded to O, a bracketed duplicate O and H: (O, O, H). The carboxylic acid carbon counts as O, a duplicate O and OH: (O, O, O). The nitrile carbon, triply bonded to N, counts as N and two bracketed duplicate N atoms: (N, N, N).',
  viewBox: '0 0 760 320',
  build() {
    return dupColumn(4, 4, 244, 312, 'cho') + dupColumn(258, 4, 244, 312, 'cooh') + dupColumn(512, 4, 244, 312, 'cn');
  },
  caption: 'The bracketed atoms, in red, are duplicates. The small dot is the stereocenter.',
});

FIGURES.push({
  id: 'l-duplicate-atoms',
  lessons: ['rs-configuration'],
  alt: 'The aldehyde carbon, doubly bonded to O and bonded to H, counts as bonded to O, a bracketed duplicate O and H: (O, O, H). Below it, a nitrile carbon triply bonded to N counts as N and two duplicate N atoms: (N, N, N).',
  viewBox: '0 0 340 632',
  build() {
    return dupColumn(4, 4, 332, 312, 'cho') + dupColumn(4, 320, 332, 308, 'cn');
  },
  caption: 'The bracketed atoms are duplicates: copies counted for the extra bond, with nothing attached.',
});

/* ------------------------------------------ 5. phenyl against vinyl ---- */

function phenylVinylCell(ox, oy, w, h, which) {
  let s = panel(ox, oy, w, h, which === 'ph' ? { kind: 'hi' } : {});
  s += Tag(P(ox + w / 2, oy + 22), which === 'ph' ? 'phenyl' : 'vinyl');
  // As drawn, skeletal, attached through the left-hand carbon.
  const a = P(ox + 76, oy + 130);
  s += bond(P(a.x - 44, a.y), a, { rFrom: 6, rTo: 0 }) + atom(a.x - 44, a.y, '', { r: 5 });
  if (which === 'ph') {
    const pts = polyPts(a.x + 36, a.y, 6, 36, 180);
    for (let i = 0; i < 6; i++) {
      const p = pts[i], q = pts[(i + 1) % 6];
      s += i % 2 === 0 ? ringDouble(p, q, P(a.x + 36, a.y), { inset: 6, gap: 4.4 }) : sk(p, q);
    }
    s += Tag(P(a.x + 36, a.y + 62), 'C1 has one double bond');
  } else {
    const b = armEnd(a, 30, 58);
    s += bond(a, armEnd(a, 30, 58 - cutOf('CH₂', 30) - 3), { rFrom: 0, rTo: 0, order: 2, gap: 3 }) + pill(b, 'CH₂');
    s += bond(a, armEnd(a, 300, 30), { rFrom: 0, rTo: 13 }) + pill(armEnd(a, 300, 42), 'H');
  }
  s += Tag(P(a.x - 2, a.y - 16), 'C1');
  // As counted.
  const c = P(ox + w - 108, oy + 130);
  s += bond(P(c.x - 50, c.y), c, { rFrom: 6, rTo: 16 }) + atom(c.x - 50, c.y, '', { r: 5 });
  const arm = (deg, l, hi) => {
    const p = armEnd(c, deg, 52);
    return bond(c, armEnd(c, deg, 52 - cutOf(l, deg) - 3), { rFrom: 16, rTo: 0 }) + pill(p, l, hi);
  };
  if (which === 'ph') s += arm(55, 'C') + arm(0, '[C]', 'warn') + arm(305, 'C', 'hi');
  else s += arm(55, 'C') + arm(0, '[C]', 'warn') + arm(305, 'H', 'hi');
  s += atom(c.x, c.y, 'C1', { kind: 'hi' });
  s += Tag(P(ox + 90, oy + 56), 'as drawn');
  s += Tag(P(c.x, oy + 56), 'as counted');
  s += (which === 'ph' ? Good : Tag)(P(ox + w / 2, oy + h - 18), which === 'ph' ? 'counts as (C, C, C)' : 'counts as (C, C, H)');
  return s;
}

FIGURES.push({
  id: 'cip-phenyl-vinyl',
  section: 'rs-configuration',
  anchor: 'Duplicate atoms also settle',
  alt: 'Left, a phenyl group attached through C1, drawn with alternating double bonds, one of them at C1. CIP counts C1 as bonded to two ring carbons and a duplicate carbon: (C, C, C). Right, a vinyl group CH=CH2 attached through C1. CIP counts C1 as bonded to the CH2 carbon, a duplicate carbon and H: (C, C, H). The sets agree in positions 1 and 2, and phenyl wins in position 3.',
  viewBox: '0 0 760 250',
  build() {
    return phenylVinylCell(4, 4, 372, 242, 'ph') + phenylVinylCell(384, 4, 372, 242, 'vi');
  },
  caption: 'Each attachment carbon, C1, as drawn and as counted. The sets differ only in position 3, highlighted.',
});

/* --------------------------------------------- 6. ring closure --------- */

function walkRow(x0, y, labs, sets, hiLast, dupLast) {
  let s = '';
  const dx = 118;
  labs.forEach((l, i) => {
    const p = P(x0 + i * dx, y);
    if (i > 0) {
      const q = P(x0 + (i - 1) * dx, y);
      s += bond(q, p, { rFrom: wOf(labs[i - 1]) / 2 + 3, rTo: wOf(l) / 2 + 3 });
    }
    s += pill(p, l, dupLast && i === labs.length - 1 ? 'warn' : i === 0 ? 'hi' : undefined);
  });
  sets.forEach((st, i) => {
    const p = P(x0 + i * dx, y + 34);
    s += (hiLast && i === sets.length - 1 ? Good : Tag)(p, st);
  });
  return s;
}

FIGURES.push({
  id: 'cip-ring-closure',
  section: 'rs-configuration',
  anchor: 'Compare a cyclopropyl group',
  alt: 'Cyclopropyl and pentan-3-yl compared by walking out along one branch of each. Cyclopropyl: the attachment carbon (C, C, H), then a ring CH2 (C, H, H), then the other ring CH2, whose next atom is the attachment carbon again, written as a bracketed duplicate, so its set is (C, H, H). Pentan-3-yl: the attachment carbon (C, C, H), then CH2 (C, H, H), then CH3 (H, H, H). The first two positions along the walk tie; the third is won by the ring, because of the duplicate carbon.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += Tag(P(292, 24), 'attachment carbon');
    s += Tag(P(410, 24), 'next atom out');
    s += Tag(P(528, 24), 'one atom further');
    // Cyclopropyl row.
    s += panel(4, 36, 752, 136, { kind: 'hi' });
    const r1 = P(70, 104);
    const c1 = r1, c2 = P(r1.x + 44, r1.y - 26), c3 = P(r1.x + 44, r1.y + 26);
    s += bond(P(c1.x - 40, c1.y), c1, { rFrom: 6, rTo: 0 }) + atom(c1.x - 40, c1.y, '', { r: 5 });
    s += sk(c1, c2) + sk(c2, c3) + sk(c3, c1);
    s += Tag(P(90, 160), 'cyclopropyl');
    s += walkRow(292, 92, ['C', 'CH₂', 'CH₂', '[C]'], ['(C, C, H)', '(C, H, H)', '(C, H, H)'], true, true);
    s += Tag(P(646, 146), 'back at the start:', { anchor: 'middle' });
    s += Tag(P(646, 162), 'a duplicate', { anchor: 'middle' });
    // Pentan-3-yl row.
    s += panel(4, 180, 752, 136);
    const a = P(70, 250);
    s += bond(P(a.x - 40, a.y), a, { rFrom: 6, rTo: 0 }) + atom(a.x - 40, a.y, '', { r: 5 });
    const u1 = armEnd(a, 60, 30), u2 = armEnd(u1, 0, 30), d1 = armEnd(a, 300, 30), d2 = armEnd(d1, 0, 30);
    s += sk(a, u1) + sk(u1, u2) + sk(a, d1) + sk(d1, d2);
    s += Tag(P(90, 306), 'pentan-3-yl');
    s += walkRow(292, 238, ['C', 'CH₂', 'CH₃'], ['(C, C, H)', '(C, H, H)', '(H, H, H)'], false, false);
    s += Good(P(646, 238), 'C beats H:', { anchor: 'middle' });
    s += Good(P(646, 256), 'the ring wins', { anchor: 'middle' });
    return s;
  },
  caption: 'One branch of each group, walked outward from the stereocenter (the small dot). The other branch of each group is identical.',
});

/* ------------------------------------------ 7. same trace, two answers --- */

function sameTraceCell(ox, oy, w, h, which) {
  const gl = which === 'gly';
  let s = panel(ox, oy, w, h, gl ? { kind: 'warn' } : { kind: 'hi' });
  s += Tag(P(ox + w / 2, oy + 22), gl ? 'glyceraldehyde · H on a wedge' : 'butan-2-ol · H on a hash');
  const c = P(ox + w / 2, oy + 152);
  s += assign(c, gl ? GLYCER : BUTANOL, gl ? 'R' : 'S', 'same-trace-opposite-answer');
  s += Tag(P(ox + w / 2, oy + h - 36), gl ? 'counterclockwise as drawn, then flip' : 'counterclockwise, no flip');
  s += (gl ? Warn : Good)(P(ox + w / 2, oy + h - 16), gl ? 'R' : 'S');
  return s;
}

FIGURES.push({
  id: 'same-trace-opposite-answer',
  section: 'rs-configuration',
  anchor: 'The only difference is which bond the hydrogen sits on.',
  alt: 'Butan-2-ol and glyceraldehyde drawn in the same pose: OH at the top is priority 1, the lower-left group is 2 and the lower-right group is 3. In both, the arrow from 1 to 2 to 3 turns counterclockwise. Butan-2-ol has H on a hash, pointing away, so it is S. Glyceraldehyde has H on a wedge, pointing toward you, so the answer flips and it is R.',
  viewBox: '0 0 760 340',
  build() {
    return sameTraceCell(4, 4, 372, 332, 'but') + sameTraceCell(384, 4, 372, 332, 'gly');
  },
  caption: 'Butan-2-ol on the left, glyceraldehyde on the right. Compare the bond to H, priority 4.',
});

/* --------------------------------------------- 8. why the flip works --- */

function viewCell(ox, oy, w, h, side) {
  const front = side === 'front';
  let s = panel(ox, oy, w, h, front ? { kind: 'hi' } : {});
  s += Tag(P(ox + w / 2, oy + 22), front ? 'seen from the front' : 'the same center, seen from behind');
  const gs = front
    ? [{ deg: 90, lab: '1', kind: 'plain', pri: 1 }, { deg: 330, lab: '2', kind: 'plain', pri: 2 },
       { deg: 210, lab: '3', kind: 'plain', pri: 3 }, { deg: 270, lab: '4', kind: 'hash', pri: 4, hi: 'warn', len: 54 }]
    : [{ deg: 90, lab: '1', kind: 'plain', pri: 1 }, { deg: 210, lab: '2', kind: 'plain', pri: 2 },
       { deg: 330, lab: '3', kind: 'plain', pri: 3 }, { deg: 270, lab: '4', kind: 'wedge', pri: 4, hi: 'warn', len: 54 }];
  expect(gs, 'R', 'flip-view');
  const c = P(ox + w / 2, oy + 134);
  const t = tetra(c, gs, { badges: false, L: 56 });
  s += t.s + trace(c, gs, t.reach, 4);
  s += Tag(P(ox + w / 2, oy + h - 36), front ? '4 points away from you' : '4 points toward you');
  s += (front ? Good : Warn)(P(ox + w / 2, oy + h - 16), front ? '1 → 2 → 3 clockwise' : '1 → 2 → 3 counterclockwise');
  return s;
}

FIGURES.push({
  id: 'flip-view',
  section: 'rs-configuration',
  anchor: 'viewing it from the other side',
  alt: 'One stereocenter seen from two sides. From the front, group 4 is on a hash pointing away, and 1 at the top, 2 at lower right and 3 at lower left run clockwise. From behind, left and right swap: 2 is at lower left and 3 at lower right, group 4 is on a wedge pointing toward the viewer, and 1 to 2 to 3 runs counterclockwise.',
  viewBox: '0 0 760 290',
  build() {
    let s = viewCell(4, 4, 306, 282, 'front') + viewCell(450, 4, 306, 282, 'back');
    s += arrow(P(330, 138), P(430, 138), { size: 8 });
    s += Tag(P(380, 124), 'view from behind');
    return s;
  },
  caption: 'Compare where 2 and 3 sit in the two views.',
});

FIGURES.push({
  id: 'l-flip-view',
  lessons: ['rs-configuration'],
  alt: 'One stereocenter seen from two sides, stacked. From the front, group 4 points away and 1 to 2 to 3 runs clockwise. From behind, group 4 points toward the viewer, left and right swap, and 1 to 2 to 3 runs counterclockwise.',
  viewBox: '0 0 340 572',
  build() {
    return viewCell(4, 4, 332, 282, 'front') + viewCell(4, 288, 332, 280, 'back');
  },
  caption: 'The same center from both sides of the page. The path turns the other way from behind.',
});

/* ------------------------------------ 9. priority 4 in the plane: swap --- */

function swapCell(ox, oy, w, h, stage, gsDrawn, gsSwapped, wantDrawn, where, names) {
  let s = panel(ox, oy, w, h, stage === 2 ? { kind: 'hi' } : {});
  const c = P(ox + w / 2, oy + 150);
  if (stage === 1) {
    s += Tag(P(ox + w / 2, oy + 22), 'as drawn: H, priority 4, lies in the page');
    expect(gsDrawn, wantDrawn, where);
    s += tetra(c, gsDrawn).s;
    s += Tag(P(ox + w / 2, oy + h - 36), `swap H with ${names.swap},`);
    s += Tag(P(ox + w / 2, oy + h - 16), 'the group on the hash');
  } else {
    const other = wantDrawn === 'R' ? 'S' : 'R';
    s += Tag(P(ox + w / 2, oy + 22), 'after the swap: H on the hash');
    s += assign(c, gsSwapped, other, where + ' (swapped)');
    s += Tag(P(ox + w / 2, oy + h - 36), `1 → 2 → 3 ${cwAsDrawn(gsSwapped) ? 'clockwise' : 'counterclockwise'}: ${other}`);
    s += Good(P(ox + w / 2, oy + h - 16), `so the original is ${wantDrawn}`);
  }
  return s;
}

FIGURES.push({
  id: 'swap-in-plane',
  section: 'rs-configuration',
  anchor: 'Swap priority 4 with the group that points away',
  alt: '2-Bromobutane drawn with H on a plain bond at the top, priority 4 in the plane of the page. Br on a wedge is 1, ethyl at lower left is 2, CH3 on a hash is 3. Swapping H and CH3 puts H on the hash and CH3 at the top. Then Br to ethyl to CH3 runs clockwise, which is R for the swapped drawing, so the original drawing is S.',
  viewBox: '0 0 760 320',
  build() {
    return swapCell(4, 4, 372, 312, 1, BROMO_AS_DRAWN, BROMO_SWAPPED, 'S', 'swap-in-plane', { swap: 'CH₃' }) +
      swapCell(384, 4, 372, 312, 2, BROMO_AS_DRAWN, BROMO_SWAPPED, 'S', 'swap-in-plane');
  },
  caption: 'Left: (S)-2-bromobutane as given. Right: the same drawing after H and CH₃, highlighted, change places.',
});

FIGURES.push({
  id: 'l-swap-in-plane',
  lessons: ['rs-configuration'],
  alt: '2-Bromobutane with H in the plane of the page, stacked above the same drawing after H and the hashed CH3 are swapped. In the swapped drawing Br to ethyl to CH3 runs clockwise, which is R, so the original is S.',
  viewBox: '0 0 340 632',
  build() {
    return swapCell(4, 4, 332, 312, 1, BROMO_AS_DRAWN, BROMO_SWAPPED, 'S', 'l-swap-in-plane', { swap: 'CH₃' }) +
      swapCell(4, 320, 332, 308, 2, BROMO_AS_DRAWN, BROMO_SWAPPED, 'S', 'l-swap-in-plane');
  },
  caption: 'One swap gives the mirror image, so reverse the swapped drawing’s label to get the original’s.',
});

/* The challenge question's drawing: no answer on it. */
FIGURES.push({
  id: 'l-rs-challenge',
  lessons: ['rs-configuration'],
  alt: 'Butan-2-ol drawn with CH3 on a plain bond at the top, H on a plain bond at lower left, ethyl on a hash and OH on a wedge at lower right.',
  viewBox: '0 0 340 230',
  build() {
    const gs = CHALLENGE.map((g) => ({ ...g, pri: undefined }));
    return tetra(P(170, 110), gs, { badges: false }).s;
  },
  caption: 'Butan-2-ol. H lies in the plane of the page.',
});

/* ------------------------------- 10. two stereocenters, two labels ------ */

FIGURES.push({
  id: 'two-stereocenters',
  section: 'rs-configuration',
  anchor: '<h3>Naming whole molecules</h3>',
  alt: '3-Bromobutan-2-ol as a zigzag, with OH on a wedge and H on a hash at C2, and Br on a hash and H on a wedge at C3. Beside it, each stereocenter is redrawn with the same bond angles. At C2: OH 1, the C3 side 2, CH3 3, H 4 on the hash; 1 to 2 to 3 runs clockwise, so C2 is R. At C3: Br 1, the C2 side 2, CH3 3, H 4 on the wedge; 1 to 2 to 3 runs clockwise as drawn, and H points toward the viewer, so the answer flips and C3 is S.',
  viewBox: '0 0 760 350',
  build() {
    let s = panel(4, 4, 196, 342);
    s += Tag(P(102, 26), 'the molecule');
    const c1 = P(34, 190), c2 = P(80, 164), c3 = P(126, 190), c4 = P(172, 164);
    s += sk(c1, c2) + sk(c2, c3) + sk(c3, c4);
    const sub = (c, deg, len, l, kind, hi) => {
      const end = armEnd(c, deg, len - cutOf(l, deg) - 3);
      const k = kind === 'wedge' ? wedge(c, end, { rFrom: 0, rTo: 0, width: 9 }) : hash(c, end, { rFrom: 0, rTo: 0, width: 11, rungs: 4 });
      return k + pill(armEnd(c, deg, len), l, hi);
    };
    s += sub(c2, 60, 58, 'OH', 'wedge') + sub(c2, 120, 50, 'H', 'hash');
    s += sub(c3, 300, 58, 'Br', 'hash') + sub(c3, 240, 50, 'H', 'wedge');
    s += Tag(P(c2.x, c2.y + 24), 'C2') + Tag(P(c3.x, c3.y - 14), 'C3');
    s += Good(P(102, 312), '(2R,3S)');
    s += Tag(P(102, 330), '3-bromobutan-2-ol');
    const cell = (ox, gs, want, name) => {
      let t = panel(ox, 4, 274, 342, { kind: 'hi' });
      t += Tag(P(ox + 137, 26), 'stereocenter ' + name);
      t += assign(P(ox + 137, 170), gs, want, 'two-stereocenters ' + name, { L: 54 });
      const cw = cwAsDrawn(gs);
      const toward = gs.find((g) => g.pri === 4).kind === 'wedge';
      t += Tag(P(ox + 137, 314), (cw ? 'clockwise' : 'counterclockwise') + (toward ? ' as drawn, H toward you' : ', H away'));
      t += Good(P(ox + 137, 332), toward ? 'flip: ' + name + ' is ' + want : name + ' is ' + want);
      return t;
    };
    s += cell(206, C2, 'R', 'C2') + cell(482, C3, 'S', 'C3');
    return s;
  },
  caption: 'Left: the molecule. Middle and right: C2 and C3 redrawn with the bond angles they have in the molecule.',
});

export default FIGURES;
