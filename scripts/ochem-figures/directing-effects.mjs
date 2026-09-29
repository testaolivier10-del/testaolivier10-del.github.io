/* Figures for the directing-effects notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every ring uses one numbering. Vertex 0 is the top and carries the first
   substituent (C1); the vertices run clockwise, so vertices 1 and 5 are
   ortho to it, 2 and 4 meta, and 3 para. Vertex i is carbon C(i + 1). The
   structure helpers take a centre and a ring radius, so the wide notes
   figures and the stacked 340-wide lesson copies come from the same code. */
import { atom, bond, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';

/* ---------------------------------------------------------------- kit --- */

const rad = (d) => (d * Math.PI) / 180;
const at = (p, deg, d) => P(p.x + Math.cos(rad(deg)) * d, p.y + Math.sin(rad(deg)) * d);
const mid = (a, b, f = 0.5) => P(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
const vAng = (i) => -90 + 60 * i;           // the outward direction at vertex i
const f2 = (v) => v.toFixed(2);

const V = (c, R) => Array.from({ length: 6 }, (_, i) => at(c, vAng(i), R));
/* A ring of six bonds; `doubles` lists ring bond i (vertex i to i + 1). */
function ring(c, R, doubles = []) {
  const v = V(c, R);
  let g = '';
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    if (doubles.includes(i)) g += ringDouble(v[i], v[j], c, { inset: R > 34 ? 8 : 6, gap: R > 34 ? 4.6 : 4 });
    else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
  }
  return g;
}

/* A label disc sized for 13px text (the fg-lbl size). */
const rOf = (t) => { const n = [...t].length; return n <= 1 ? 12 : n === 2 ? 15 : n === 3 ? 18 : n === 4 ? 21 : 25; };
const lab = (p, t, o = {}) => atom(p.x, p.y, t, { kind: o.kind || 'plain', r: o.r ?? rOf(t), size: 13 });
/* A group hanging off point `from` in direction `deg`, `d` away. */
const grp = (from, deg, d, t, o = {}) => {
  const p = at(from, deg, d);
  const r = o.r ?? rOf(t);
  return bond(from, p, { rFrom: o.rFrom ?? 0, rTo: r, cls: o.bondCls, order: o.order, gap: 3.6 }) + lab(p, t, { kind: o.kind, r });
};
const chg = (p, s = '+', size = 17) => text(p.x, p.y + size * 0.3, s, { cls: 'fg-warn', size });
const dplus = (p) => text(p.x, p.y + 5, 'δ+', { cls: 'fg-warn', size: 14 });
const reso = (x, y, w = 40) => arrow(P(x - w / 2, y), P(x + w / 2, y), { muted: true }) + arrow(P(x + w / 2, y), P(x - w / 2, y), { muted: true });
const right = (x1, x2, y) => arrow(P(x1, y), P(x2, y));
const it = (x, y, pre, rest, o = {}) =>
  `<text class="${o.cls || 'fg-tag'}" x="${f2(x)}" y="${f2(y)}" text-anchor="${o.anchor || 'middle'}" font-size="11"><tspan font-style="italic">${pre}</tspan>${rest}</text>`;
const ring6Dot = (p, cls) => `<circle class="${cls}" cx="${f2(p.x)}" cy="${f2(p.y)}" r="7" opacity="0.9"></circle>`;

/* The electrophile and the hydrogen on the sp3 carbon of an arenium ion. */
function eh(v, i, len) {
  const a = vAng(i);
  const e = at(v[i], a - 30, len), h = at(v[i], a + 30, len - 3);
  return bond(v[i], e, { rFrom: 0, rTo: 12, cls: 'fg-bond-hi' }) + lab(e, 'E', { kind: 'hi', r: 12 }) +
         bond(v[i], h, { rFrom: 0, rTo: 11 }) + lab(h, 'H', { r: 11 });
}

/* Where a charge sign goes beside vertex i: straight out, except at C1,
   where the substituent is, so there it sits up and to the left. */
const signAt = (v, i, d = 17) => (i === 0 ? at(v[0], -150, d + 2) : at(v[i], vAng(i), d));

/* The double bonds of each arenium contributor, by attacked vertex and
   charged vertex. Each was checked by hand: the five sp2 carbons hold two
   C=C and one cation. */
const DOUBLES = {
  1: { 0: [2, 4], 2: [3, 5], 4: [2, 5] },     // ortho attack
  2: { 1: [3, 5], 3: [0, 4], 5: [0, 3] },     // meta attack
  3: { 0: [1, 4], 2: [0, 4], 4: [1, 5] },     // para attack
};

/* The top substituent, drawn on vertex 0. kind: 'nh2', 'nh2plus' (C=N+),
   'no2', 'g'. */
function topGroup(v, R, kind, o = {}) {
  const d = R * 0.9 + 16;
  const n = at(v[0], -90, d);
  let g = '';
  if (kind === 'g') return grp(v[0], -90, d, 'G', { kind: 'hi' });
  if (kind === 'nh2' || kind === 'nh2plus') {
    const r = rOf('NH₂');
    g += bond(v[0], n, { rFrom: 0, rTo: r, order: kind === 'nh2plus' ? 2 : 1, gap: 3.4 });
    g += lab(n, 'NH₂', { kind: 'hi', r });
    if (kind === 'nh2') {
      g += lonePair(n.x, n.y, 180, { dist: r + 6 });
      if (o.arrow) {
        const lp = at(n, 180, r + 9);
        g += curve(lp, at(mid(v[0], n, 0.5), 180, 6), { bow: 12, size: 7 });
      }
    } else {
      g += chg(at(n, -35, r + 9), '+', 16);
    }
    return g;
  }
  if (kind === 'no2') {
    const r = 12;
    g += bond(v[0], n, { rFrom: 0, rTo: r });
    g += lab(n, 'N', { kind: 'warn', r });
    g += chg(at(n, 28, r + 8), '+', 15);
    const o1 = at(n, -145, 36), o2 = at(n, -35, 36);
    g += bond(n, o1, { rFrom: r, rTo: 12, order: 2, gap: 3.2 }) + lab(o1, 'O', { r: 12 });
    g += bond(n, o2, { rFrom: r, rTo: 12 }) + lab(o2, 'O', { r: 12 });
    g += chg(at(o2, 10, 19), '−', 15);
    return g;
  }
  return g;
}

/* One arenium contributor: `hit` is the attacked vertex, `pos` the vertex
   that carries the positive charge, `top` the substituent on C1. */
function contributor(c, R, hit, pos, top, o = {}) {
  const v = V(c, R);
  const dbl = top === 'nh2plus' ? DOUBLES[hit][0] : DOUBLES[hit][pos];
  let g = ring(c, R, dbl);
  g += eh(v, hit, R * 0.62 + 12);
  g += topGroup(v, R, top, o);
  if (pos !== null && top !== 'nh2plus') g += chg(signAt(v, pos));
  return g;
}

/* The hybrid of one arenium ion: single ring bonds, a dashed arc over the
   five sp2 carbons, and delta-plus on the three that share the charge. */
function hybrid(c, R, hit, top, o = {}) {
  const v = V(c, R);
  let g = ring(c, R, []);
  /* The arc only on the larger notes rings; on a small lesson ring it
     would crowd the carbon numbers. */
  const arc = o.arc ?? R >= 40;
  if (arc) {
    const r = R * 0.74;
    const a1 = at(c, vAng(hit) + 60, r), a2 = at(c, vAng(hit) - 60, r);
    g += `<path class="fg-dash" d="M${f2(a1.x)} ${f2(a1.y)} A${f2(r)} ${f2(r)} 0 1 1 ${f2(a2.x)} ${f2(a2.y)}"></path>`;
  }
  g += eh(v, hit, R * 0.62 + 12);
  g += topGroup(v, R, top, o);
  for (const k of [(hit + 1) % 6, (hit + 3) % 6, (hit + 5) % 6]) g += dplus(signAt(v, k, 18));
  if (o.nums) {
    for (let i = 0; i < 6; i++) {
      const p = at(c, vAng(i), arc ? R * 0.42 : R * 0.58);
      g += text(p.x, p.y + 4, String(i + 1), { cls: 'fg-tag-mut', size: 11 });
    }
  }
  return g;
}

/* A plain substituted benzene. `subs` maps a vertex to a label, or to
   { t, kind, d }. `dots` marks ring carbons: { vertex: 'good'|'warn'|'mut' }. */
function arene(c, R, subs = {}, o = {}) {
  const v = V(c, R);
  const d0 = R * 0.9 + 14;
  let s = ring(c, R, o.doubles || [0, 2, 4]);
  for (const [k, cls] of Object.entries(o.dots || {})) s += ring6Dot(v[+k], `fg-fill-${cls}`);
  for (const [i, x] of Object.entries(subs)) {
    const g = typeof x === 'string' ? { t: x } : x;
    if (g.t === 'NHAc') { s += acetamido(v[+i], vAng(+i), R); continue; }
    if (g.t === 'CH₃-line') { s += bond(v[+i], at(v[+i], vAng(+i), R * 0.8), { rFrom: 0, rTo: 0 }); continue; }
    const kind = g.kind || (g.t === 'NO₂' ? 'warn' : ['NH₂', 'OCH₃', 'OH'].includes(g.t) ? 'hi' : 'plain');
    s += grp(v[+i], vAng(+i), g.d ?? d0 + (rOf(g.t) - 15) * 0.6, g.t, { kind });
  }
  if (o.nums) {
    for (let i = 0; i < 6; i++) {
      const p = at(c, vAng(i), R * 0.52);
      s += text(p.x, p.y + 4, String(i + 1), { cls: 'fg-tag-mut', size: 11 });
    }
  }
  return s;
}

/* An acetamido group, NH–C(=O)–CH3, drawn out from ring vertex p. */
function acetamido(p, deg, R) {
  const n = at(p, deg, R * 0.8 + 14);
  let s = bond(p, n, { rFrom: 0, rTo: 15 }) + lab(n, 'NH', { kind: 'hi', r: 15 });
  const c = at(n, deg + 60, 34);
  s += bond(n, c, { rFrom: 15, rTo: 0 });
  const o = at(c, deg, 26);
  s += bond(c, o, { rFrom: 0, rTo: 12, order: 2, gap: 3.2 }) + lab(o, 'O', { r: 12 });
  s += bond(c, at(c, deg + 120, 26), { rFrom: 0, rTo: 0 });
  return s;
}

/* ------------------------------------------------------------ figures --- */

const FIGURES = [];


/* 1. Where the charge lands, for attack at each position. */
const CHARGE_ROWS = [
  { hit: 1, t: 'ATTACK ORTHO (C2)', good: true, tail: 'δ+ on C1, C3, C5' },
  { hit: 2, t: 'ATTACK META (C3)', good: false, tail: 'δ+ on C2, C4, C6' },
  { hit: 3, t: 'ATTACK PARA (C4)', good: true, tail: 'δ+ on C1, C3, C5' },
];

FIGURES.push({
  id: 'directing-charge',
  section: 'directing-effects',
  anchor: '<!-- anchor:directing-charge -->',
  alt: 'Three arenium ions from a benzene ring that carries a substituent G on carbon 1, with the ring carbons numbered. In each, the attacked carbon carries E and H, a dashed arc spans the other five carbons, and delta-plus signs mark the three carbons that share the positive charge. Attack at C2, ortho: delta-plus on C1, C3 and C5. Attack at C3, meta: delta-plus on C2, C4 and C6. Attack at C4, para: delta-plus on C1, C3 and C5. Only ortho and para attack put charge on C1, the carbon bearing G.',
  viewBox: '0 0 760 340',
  build() {
    const s = [];
    CHARGE_ROWS.forEach((r, k) => {
      const c = P(130 + 250 * k, 164);
      s.push(tag(c.x, 22, r.t));
      s.push(hybrid(c, 50, r.hit, 'g', { nums: true }));
      s.push(text(c.x, 300, r.tail, { cls: 'fg-tag-mut', size: 11 }));
      s.push(text(c.x, 320, r.good ? 'C1, the G carbon, shares the charge' : 'C1 never shares the charge', { cls: r.good ? 'fg-tag-good' : 'fg-tag-warn', size: 11 }));
    });
    s.push(rule(255, 40, 255, 320), rule(505, 40, 505, 320));
    return s.join('');
  },
  caption: 'G sits on C1 in all three ions. The delta-plus signs mark the three carbons that share the positive charge; the dashed arc marks the five carbons still joined in one π system.',
});

FIGURES.push({
  id: 'l-directing-charge',
  lessons: ['directing-effects'],
  alt: 'Three arenium ions stacked, from a ring with a substituent G on carbon 1. Ortho attack at C2 and para attack at C4 each put delta-plus on C1, C3 and C5, so C1 shares the charge. Meta attack at C3 puts delta-plus on C2, C4 and C6, so C1 never does.',
  viewBox: '0 0 340 556',
  build() {
    const s = [];
    CHARGE_ROWS.forEach((r, k) => {
      const c = P(80, 100 + 180 * k);
      s.push(hybrid(c, 30, r.hit, 'g', { nums: true }));
      s.push(tag(170, c.y - 18, r.t, { anchor: 'start' }));
      s.push(text(170, c.y + 2, r.tail, { cls: 'fg-tag-mut', size: 11, anchor: 'start' }));
      s.push(text(170, c.y + 22, r.good ? 'C1 shares the charge' : 'C1 never does', { cls: r.good ? 'fg-tag-good' : 'fg-tag-warn', size: 11, anchor: 'start' }));
    });
    s.push(rule(10, 186, 330, 186), rule(10, 366, 330, 366));
    return s.join('');
  },
  caption: 'G sits on C1, and the ring carbons are numbered. Delta-plus marks the three carbons that share the positive charge.',
});

/* 2. The octet-complete contributor that a lone pair adds. */
FIGURES.push({
  id: 'donor-octet-structure',
  section: 'directing-effects',
  anchor: '<!-- anchor:donor-octet-structure -->',
  alt: 'Arenium ions from aniline. Top row, para attack at C4: three contributors with the positive charge on C3, on C5 and on C1, the carbon bearing NH2. In the C1 structure a curved arrow runs from the nitrogen lone pair to the carbon-nitrogen bond. The fourth structure, in a highlighted box, has a carbon-nitrogen double bond, the positive charge on nitrogen and a complete octet on every atom. Bottom row, meta attack at C3: three contributors with the charge on C2, C4 and C6, and then an empty crossed-out box, because no contributor puts the charge on C1.',
  viewBox: '0 0 760 540',
  build() {
    const s = [];
    const R = 38, xs = [95, 280, 465, 650];
    const y1 = 150;
    s.push(tag(24, 24, 'ATTACK PARA (C4): THE CHARGE REACHES C1, THE CARBON BEARING NH₂', { anchor: 'start', cls: 'fg-tag-good' }));
    s.push(panel(566, 38, 168, 238, { kind: 'good' }));
    s.push(contributor(P(xs[0], y1), R, 3, 2, 'nh2'));
    s.push(contributor(P(xs[1], y1), R, 3, 4, 'nh2'));
    s.push(contributor(P(xs[2], y1), R, 3, 0, 'nh2', { arrow: true }));
    s.push(contributor(P(xs[3], y1), R, 3, null, 'nh2plus'));
    for (let k = 0; k < 3; k++) s.push(reso((xs[k] + xs[k + 1]) / 2, y1, 48));
    s.push(text(xs[0], 258, '+ on C3', { cls: 'fg-tag', size: 11 }));
    s.push(text(xs[1], 258, '+ on C5', { cls: 'fg-tag', size: 11 }));
    s.push(text(xs[2], 258, '+ on C1', { cls: 'fg-tag', size: 11 }));
    s.push(text(xs[3], 252, 'C=N⁺: every atom', { cls: 'fg-tag-good', size: 11 }));
    s.push(text(xs[3], 266, 'has an octet', { cls: 'fg-tag-good', size: 11 }));
    s.push(rule(24, 292, 736, 292));
    const y2 = 430;
    s.push(tag(24, 318, 'ATTACK META (C3): THE CHARGE NEVER REACHES C1', { anchor: 'start', cls: 'fg-tag-warn' }));
    s.push(contributor(P(xs[0], y2), R, 2, 1, 'nh2'));
    s.push(contributor(P(xs[1], y2), R, 2, 3, 'nh2'));
    s.push(contributor(P(xs[2], y2), R, 2, 5, 'nh2'));
    for (let k = 0; k < 2; k++) s.push(reso((xs[k] + xs[k + 1]) / 2, y2, 48));
    s.push(panel(612, y2 - 38, 76, 76));
    s.push(`<line class="fg-dash" x1="612" y1="${y2 - 38}" x2="688" y2="${y2 + 38}"></line><line class="fg-dash" x1="688" y1="${y2 - 38}" x2="612" y2="${y2 + 38}"></line>`);
    s.push(text(xs[0], 520, '+ on C2', { cls: 'fg-tag', size: 11 }));
    s.push(text(xs[1], 520, '+ on C4', { cls: 'fg-tag', size: 11 }));
    s.push(text(xs[2], 520, '+ on C6', { cls: 'fg-tag', size: 11 }));
    s.push(text(xs[3], y2 + 58, 'no fourth', { cls: 'fg-tag-mut', size: 11 }));
    s.push(text(xs[3], y2 + 74, 'structure', { cls: 'fg-tag-mut', size: 11 }));
    return s.join('');
  },
  caption: 'Aniline, attacked para (top) and meta (bottom). The curved arrow moves the nitrogen lone pair into the C&ndash;N bond, which gives the boxed structure. Ortho attack also puts the charge on C1, so it gets the same fourth structure.',
});

FIGURES.push({
  id: 'l-donor-octet',
  lessons: ['directing-effects'],
  alt: 'Top: para attack on aniline. The contributor with the positive charge on C1, the carbon bearing NH2, has a curved arrow from the nitrogen lone pair to the carbon-nitrogen bond; it leads to a boxed structure with a carbon-nitrogen double bond, the positive charge on nitrogen and a complete octet on every atom. Bottom: the meta arenium ion drawn as a hybrid, with delta-plus on C2, C4 and C6 and never on C1, so it has no such structure.',
  viewBox: '0 0 340 450',
  build() {
    const s = [];
    const R = 30;
    s.push(tag(10, 18, 'PARA ATTACK: + ON C1, THEN C=N⁺', { cls: 'fg-tag-good', anchor: 'start' }));
    s.push(panel(186, 30, 146, 196, { kind: 'good' }));
    s.push(contributor(P(88, 126), R, 3, 0, 'nh2', { arrow: true }));
    s.push(contributor(P(259, 126), R, 3, null, 'nh2plus'));
    s.push(reso(172, 126, 34));
    s.push(text(88, 216, '+ on C1', { cls: 'fg-tag', size: 11 }));
    s.push(text(259, 216, 'full octets', { cls: 'fg-tag-good', size: 11 }));
    s.push(rule(10, 242, 330, 242));
    s.push(tag(10, 264, 'META ATTACK: C1 NEVER CARRIES +', { cls: 'fg-tag-warn', anchor: 'start' }));
    s.push(hybrid(P(88, 374), R, 2, 'nh2', { nums: true }));
    s.push(text(180, 364, 'δ+ on C2, C4, C6', { cls: 'fg-tag-mut', size: 11, anchor: 'start' }));
    s.push(text(180, 384, 'no C=N⁺ structure', { cls: 'fg-tag-warn', size: 11, anchor: 'start' }));
    return s.join('');
  },
  caption: 'Follow the curved arrow: the nitrogen lone pair turns + on C1 into C=N⁺.',
});

/* 3. The nitro group: the structure ortho attack cannot avoid. */
FIGURES.push({
  id: 'nitro-arenium',
  section: 'directing-effects',
  anchor: '<!-- anchor:nitro-arenium -->',
  alt: 'Arenium ions from nitrobenzene. Top row, ortho attack at C2: contributors with the positive charge on C3, on C5 and on C1. The C1 structure is boxed as a warning, because the positive ring carbon is bonded directly to the positively charged nitrogen of the nitro group. Bottom row, meta attack at C3: contributors with the charge on C2, C4 and C6. None of them puts the charge on C1.',
  viewBox: '0 0 760 550',
  build() {
    const s = [];
    const R = 38, xs = [130, 380, 630];
    const y1 = 162;
    s.push(tag(24, 22, 'ATTACK ORTHO (C2): ONE STRUCTURE PUTS + ON C1, NEXT TO N⁺', { anchor: 'start', cls: 'fg-tag-warn' }));
    s.push(panel(536, 34, 188, 234, { kind: 'warn' }));
    s.push(contributor(P(xs[0], y1), R, 1, 2, 'no2'));
    s.push(contributor(P(xs[1], y1), R, 1, 4, 'no2'));
    s.push(contributor(P(xs[2], y1), R, 1, 0, 'no2'));
    s.push(reso(255, y1, 60), reso(505, y1, 60));
    s.push(text(xs[0], 246, '+ on C3', { cls: 'fg-tag', size: 11 }));
    s.push(text(xs[1], 246, '+ on C5', { cls: 'fg-tag', size: 11 }));
    s.push(text(xs[2], 240, '+ on C1, beside N⁺:', { cls: 'fg-tag-warn', size: 11 }));
    s.push(text(xs[2], 256, 'two + charges side by side', { cls: 'fg-tag-warn', size: 11 }));
    s.push(rule(24, 284, 736, 284));
    const y2 = 446;
    s.push(tag(24, 308, 'ATTACK META (C3): + ON C2, C4 AND C6, NEVER ON C1', { anchor: 'start', cls: 'fg-tag-good' }));
    s.push(contributor(P(xs[0], y2), R, 2, 1, 'no2'));
    s.push(contributor(P(xs[1], y2), R, 2, 3, 'no2'));
    s.push(contributor(P(xs[2], y2), R, 2, 5, 'no2'));
    s.push(reso(255, y2, 60), reso(505, y2, 60));
    s.push(text(xs[0], 536, '+ on C2', { cls: 'fg-tag', size: 11 }));
    s.push(text(xs[1], 536, '+ on C4', { cls: 'fg-tag', size: 11 }));
    s.push(text(xs[2], 536, '+ on C6', { cls: 'fg-tag', size: 11 }));
    return s.join('');
  },
  caption: 'Nitrobenzene, attacked ortho (top) and meta (bottom). Compare the boxed structure with each structure in the bottom row.',
});

FIGURES.push({
  id: 'l-nitro-arenium',
  lessons: ['directing-effects'],
  alt: 'Top: the ortho arenium ion of nitrobenzene in the contributor that puts the positive charge on C1, bonded directly to the positive nitrogen of the nitro group, boxed as a warning. Bottom: the meta arenium ion drawn as a hybrid, with delta-plus on C2, C4 and C6 and never on C1.',
  viewBox: '0 0 340 460',
  build() {
    const s = [];
    const R = 30;
    s.push(tag(10, 18, 'ORTHO ATTACK (PARA IS THE SAME): + ON C1', { cls: 'fg-tag-warn', anchor: 'start' }));
    s.push(panel(14, 30, 164, 196, { kind: 'warn' }));
    s.push(contributor(P(92, 146), R, 1, 0, 'no2'));
    s.push(text(188, 130, 'C1 carries +', { cls: 'fg-tag-warn', size: 11, anchor: 'start' }));
    s.push(text(188, 148, 'right beside N⁺', { cls: 'fg-tag-warn', size: 11, anchor: 'start' }));
    s.push(rule(10, 244, 330, 244));
    s.push(tag(10, 266, 'META: + NEVER ON C1', { cls: 'fg-tag-good', anchor: 'start' }));
    s.push(hybrid(P(92, 390), R, 2, 'no2', { nums: true }));
    s.push(text(188, 380, 'δ+ on C2, C4, C6', { cls: 'fg-tag-mut', size: 11, anchor: 'start' }));
    s.push(text(188, 400, 'the least bad choice', { cls: 'fg-tag-good', size: 11, anchor: 'start' }));
    return s.join('');
  },
  caption: 'Compare the boxed structure with the meta ion below it: look at which carbons carry the charge.',
});

/* 4. Ortho versus para: the size of the group next door. */
FIGURES.push({
  id: 'ortho-crowding',
  section: 'directing-effects',
  anchor: '<!-- anchor:ortho-crowding -->',
  alt: 'Left: toluene, a benzene ring with a methyl group at the top, and an electrophile E+ approaching the ortho carbon with room to spare. Nitration gives 58 percent ortho and 37 percent para. Right: tert-butylbenzene, where the ring carries a carbon bearing three methyl groups; a shaded zone around that group overlaps the approach to the ortho carbon. Nitration gives 16 percent ortho and 75 percent para.',
  viewBox: '0 0 760 300',
  build() {
    const s = [];
    const R = 40;
    const draw = (c, tbu) => {
      const v = V(c, R);
      let g = ring(c, R, [0, 2, 4]);
      const q = at(v[0], -90, 30);
      if (tbu) g += `<circle class="fg-fill-warn" cx="${f2(q.x)}" cy="${f2(q.y)}" r="58" opacity="0.35"></circle>`;
      g += bond(v[0], q, { rFrom: 0, rTo: 0 });
      if (tbu) {
        g += bond(q, at(q, -90, 26), { rFrom: 0, rTo: 0 });
        g += bond(q, at(q, -10, 28), { rFrom: 0, rTo: 0 });
        g += bond(q, at(q, -170, 28), { rFrom: 0, rTo: 0 });
      }
      /* the electrophile coming in at the ortho carbon, vertex 1 */
      const e = at(v[1], -15, 84);
      g += lab(e, 'E⁺', { kind: 'hi', r: 15 });
      g += arrow(at(e, 165, 17), at(v[1], -15, 8), { size: 7 });
      return g;
    };
    s.push(tag(190, 30, 'TOLUENE'));
    s.push(it(570, 30, 'tert', '-BUTYLBENZENE'));
    s.push(draw(P(170, 156), false));
    s.push(draw(P(550, 156), true));
    s.push(text(190, 250, 'CH₃ is small: E⁺ gets in beside it', { cls: 'fg-tag', size: 11 }));
    s.push(text(190, 270, '58% ortho · 37% para', { cls: 'fg-tag-good', size: 11 }));
    s.push(text(570, 250, 'three methyls crowd the ortho carbons', { cls: 'fg-tag', size: 11 }));
    s.push(text(570, 270, '16% ortho · 75% para', { cls: 'fg-tag-warn', size: 11 }));
    s.push(rule(380, 44, 380, 280));
    return s.join('');
  },
  caption: 'Nitration of each ring. The shaded zone marks the space the <i>tert</i>-butyl group fills beside both ortho carbons.',
});

/* 5. Two groups on one ring. */
const ANISOLE_DOTS = { 1: 'good', 5: 'good', 2: 'mut', 4: 'mut' };
const XYLENE_DOTS = { 3: 'good', 5: 'good', 1: 'warn' };

FIGURES.push({
  id: 'two-groups',
  section: 'directing-effects',
  anchor: '<!-- anchor:two-groups -->',
  alt: 'Left: 4-methylanisole, a ring numbered from C1, which carries OCH3, with CH3 on C4. Green dots mark C2 and C6, ortho to OCH3, where bromine goes; gray dots mark C3 and C5, ortho to the methyl group. Right: m-xylene, with methyl groups on C1 and C3. Green dots mark C4 and C6, the main sites of nitration; a coral dot marks C2, which lies between the two methyl groups and reacts much less.',
  viewBox: '0 0 760 350',
  build() {
    const s = [];
    s.push(tag(190, 24, '4-METHYLANISOLE: THE GROUPS DISAGREE'));
    s.push(it(570, 24, 'm', '-XYLENE: THE GROUPS AGREE'));
    s.push(arene(P(190, 160), 46, { 0: 'OCH₃', 3: 'CH₃' }, { nums: true, dots: ANISOLE_DOTS }));
    s.push(arene(P(560, 160), 46, { 0: 'CH₃', 2: 'CH₃' }, { nums: true, dots: XYLENE_DOTS }));
    s.push(text(190, 312, 'green: C2 and C6, ortho to OCH₃ (Br goes here)', { cls: 'fg-tag-good', size: 11 }));
    s.push(text(190, 332, 'gray: C3 and C5, ortho to CH₃', { cls: 'fg-tag-mut', size: 11 }));
    s.push(text(570, 312, 'green: C4 and C6, the main products', { cls: 'fg-tag-good', size: 11 }));
    s.push(text(570, 332, 'coral: C2, wedged between the two methyls', { cls: 'fg-tag-warn', size: 11 }));
    s.push(rule(380, 40, 380, 336));
    return s.join('');
  },
  caption: 'Dots mark the ring carbons each group directs toward, and the labels under each ring say which carbons win.',
});

FIGURES.push({
  id: 'l-two-groups',
  lessons: ['directing-effects'],
  alt: 'Top: 4-methylanisole, OCH3 on C1 and CH3 on C4. Green dots on C2 and C6, ortho to OCH3, where bromine goes; gray dots on C3 and C5, ortho to the methyl group. Bottom: m-xylene, methyl groups on C1 and C3. Green dots on C4 and C6, the main sites; a coral dot on C2, between the two methyls.',
  viewBox: '0 0 340 380',
  build() {
    const s = [];
    s.push(arene(P(80, 104), 30, { 0: 'OCH₃', 3: 'CH₃' }, { nums: true, dots: ANISOLE_DOTS }));
    s.push(tag(172, 70, '4-METHYLANISOLE', { anchor: 'start' }));
    s.push(text(172, 94, 'green: ortho to OCH₃', { cls: 'fg-tag-good', size: 11, anchor: 'start' }));
    s.push(text(172, 112, 'gray: ortho to CH₃', { cls: 'fg-tag-mut', size: 11, anchor: 'start' }));
    s.push(text(172, 130, 'OCH₃ wins', { cls: 'fg-tag', size: 11, anchor: 'start' }));
    s.push(rule(10, 212, 330, 212));
    s.push(arene(P(80, 310), 30, { 0: 'CH₃', 2: 'CH₃' }, { nums: true, dots: XYLENE_DOTS }));
    s.push(it(172, 276, 'm', '-XYLENE', { anchor: 'start' }));
    s.push(text(172, 300, 'green: main sites', { cls: 'fg-tag-good', size: 11, anchor: 'start' }));
    s.push(text(172, 318, 'coral: C2, wedged', { cls: 'fg-tag-warn', size: 11, anchor: 'start' }));
    s.push(text(172, 336, 'between two methyls', { cls: 'fg-tag-warn', size: 11, anchor: 'start' }));
    return s.join('');
  },
  caption: 'Dots mark the ring carbons each group directs toward.',
});

/* 6. Order of steps: the same two reactions, two different products.
   xs holds two or three x positions; with three, the row starts from benzene. */
function orderRow(s, y, R, xs, first) {
  const nitroFirst = first === 'nitro';
  const three = xs.length === 3;
  if (three) s.push(arene(P(xs[0], y), R, {}));
  const mid1 = three ? xs[1] : xs[0];
  const last = xs[xs.length - 1];
  s.push(arene(P(mid1, y), R, { 0: nitroFirst ? 'NO₂' : 'Br' }));
  if (nitroFirst) s.push(arene(P(last, y), R, { 0: 'NO₂', 2: 'Br' }));
  else s.push(arene(P(last, y), R, { 0: 'Br', 3: 'NO₂' }));
  const rA = nitroFirst ? 'HNO₃, H₂SO₄' : 'Br₂, FeBr₃';
  const rB = nitroFirst ? 'Br₂, FeBr₃' : 'HNO₃, H₂SO₄';
  const gap = R + 22;
  if (three) {
    s.push(right(xs[0] + gap - 6, xs[1] - gap, y));
    s.push(text((xs[0] + xs[1]) / 2, y - 12, rA, { cls: 'fg-tag', size: 11 }));
  }
  s.push(right(mid1 + gap, last - gap - 10, y));
  s.push(text((mid1 + last) / 2 - 4, y - 12, rB, { cls: 'fg-tag', size: 11 }));
}

FIGURES.push({
  id: 'order-of-steps',
  section: 'directing-effects',
  anchor: '<!-- anchor:order-of-steps -->',
  alt: 'Two routes from benzene. Top: nitration gives nitrobenzene, and bromination then puts bromine meta to the nitro group, giving m-bromonitrobenzene, the target. Bottom: bromination gives bromobenzene, and nitration then puts the nitro group para (and ortho) to bromine, not the target.',
  viewBox: '0 0 760 450',
  build() {
    const s = [];
    const R = 32, xs = [90, 370, 600];
    s.push(tag(24, 22, 'NITRATE FIRST: NO₂ SENDS Br META', { anchor: 'start', cls: 'fg-tag-good' }));
    orderRow(s, 124, R, xs, 'nitro');
    s.push(it(672, 110, 'm', ' isomer ✓', { cls: 'fg-tag-good', anchor: 'start' }));
    s.push(rule(24, 214, 736, 214));
    s.push(tag(24, 238, 'BROMINATE FIRST: Br SENDS NO₂ ORTHO AND PARA', { anchor: 'start', cls: 'fg-tag-warn' }));
    orderRow(s, 334, R, xs, 'bromo');
    s.push(it(672, 326, 'p', ' isomer ✗', { cls: 'fg-tag-warn', anchor: 'start' }));
    s.push(it(672, 344, 'o', ' isomer too', { cls: 'fg-tag-mut', anchor: 'start' }));
    return s.join('');
  },
  caption: 'The same two reactions, run in the two possible orders.',
});

FIGURES.push({
  id: 'l-order-of-steps',
  lessons: ['directing-effects'],
  alt: 'Top: nitrobenzene is brominated with Br2 and FeBr3, and bromine goes meta to the nitro group. Bottom: bromobenzene is nitrated with HNO3 and H2SO4, and the nitro group goes para to bromine.',
  viewBox: '0 0 340 400',
  build() {
    const s = [];
    const R = 24;
    orderRow(s, 90, R, [60, 250], 'nitro');
    s.push(text(170, 176, 'NO₂ first: Br goes meta ✓', { cls: 'fg-tag-good', size: 11 }));
    s.push(rule(10, 196, 330, 196));
    orderRow(s, 290, R, [60, 250], 'bromo');
    s.push(text(130, 380, 'Br first: NO₂ goes para ✗', { cls: 'fg-tag-warn', size: 11 }));
    return s.join('');
  },
  caption: 'The group already on the ring decides where the next one goes.',
});

/* 7. o-Nitroaniline from aniline: moderate, block, nitrate, unblock. */
FIGURES.push({
  id: 'o-nitroaniline-route',
  section: 'directing-effects',
  anchor: '<!-- anchor:o-nitroaniline-route -->',
  alt: 'The route from aniline to 2-nitroaniline in four steps. Aniline, NH2 on the ring, reacts with acetic anhydride to give acetanilide, where the nitrogen carries an acetyl group. Fuming sulfuric acid puts SO3H on C4, para to the nitrogen. Nitric and sulfuric acids put NO2 on C2, ortho to the nitrogen and meta to SO3H. Hot dilute aqueous acid removes the SO3H group and the acetyl group, leaving 2-nitroaniline.',
  viewBox: '0 0 760 570',
  build() {
    const s = [];
    const R = 30;
    const y1 = 150, y2 = 420;
    s.push(arene(P(80, y1), R, { 0: 'NH₂' }));
    s.push(arene(P(340, y1), R, { 0: 'NHAc' }));
    s.push(arene(P(620, y1), R, { 0: 'NHAc', 3: 'SO₃H' }));
    s.push(right(126, 280, y1));
    s.push(text(203, y1 - 12, '1. Ac₂O', { cls: 'fg-tag', size: 11 }));
    s.push(right(398, 558, y1));
    s.push(text(478, y1 - 12, '2. H₂SO₄, SO₃', { cls: 'fg-tag', size: 11 }));
    s.push(text(80, 214, 'aniline', { cls: 'fg-tag-mut', size: 11 }));
    s.push(text(340, 214, 'acetanilide: milder,', { cls: 'fg-tag-mut', size: 11 }));
    s.push(text(340, 230, 'still ortho/para', { cls: 'fg-tag-mut', size: 11 }));
    s.push(text(620, 276, 'para now blocked', { cls: 'fg-tag-warn', size: 11 }));
    s.push(rule(24, 292, 736, 292));
    s.push(arene(P(250, y2), R, { 0: 'NHAc', 1: 'NO₂', 3: 'SO₃H' }));
    s.push(arene(P(600, y2), R, { 0: 'NH₂', 1: 'NO₂' }));
    s.push(right(30, 170, y2));
    s.push(text(100, y2 - 12, '3. HNO₃, H₂SO₄', { cls: 'fg-tag', size: 11 }));
    s.push(right(350, 528, y2));
    s.push(text(439, y2 - 12, '4. H₃O⁺, heat; then base', { cls: 'fg-tag', size: 11 }));
    s.push(text(250, 548, 'NO₂ ortho to N, meta to SO₃H', { cls: 'fg-tag', size: 11 }));
    s.push(text(600, 486, '2-nitroaniline', { cls: 'fg-tag-good', size: 11 }));
    s.push(text(600, 502, 'both temporary groups removed', { cls: 'fg-tag-good', size: 11 }));
    return s.join('');
  },
  caption: 'Ac₂O is acetic anhydride. The numbers on the arrows match the steps in the example.',
});

export default FIGURES;
