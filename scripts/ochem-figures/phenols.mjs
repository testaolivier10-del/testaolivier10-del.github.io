/* Figures for the phenols notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Three of them (phenoxide-resonance, nitrophenoxide-position and
   phenol-bromination) are also shown in the lesson, so they are drawn 340
   wide with stacked panels and only fg-lbl / fg-tag labels. */
import { atom, bond, arrow, curve, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';

/* A hexagon kit the figures below share. Vertex 0 is the top and the
   numbering runs clockwise, so 1 and 5 are ortho, 2 and 4 meta, 3 para.
   Bond i joins vertex i to vertex i + 1. */
function hexKit(R) {
  const V = (cx, cy) => {
    const v = [];
    for (let i = 0; i < 6; i++) {
      const a = (-90 + i * 60) * Math.PI / 180;
      v.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
    }
    return v;
  };
  /* A point `d` further out along the line from the ring centre through
     vertex i — where a substituent hangs. */
  const out = (cx, cy, i, d) => {
    const v = V(cx, cy)[i];
    return P(v.x + ((v.x - cx) / R) * d, v.y + ((v.y - cy) / R) * d);
  };
  /* The midpoint of bond i, pushed `d` outward from the ring centre. */
  const mid = (cx, cy, i, d = 0) => {
    const v = V(cx, cy), a = v[i], b = v[(i + 1) % 6];
    const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
    const l = Math.hypot(m.x - cx, m.y - cy);
    return P(m.x + ((m.x - cx) / l) * d, m.y + ((m.y - cy) / l) * d);
  };
  const ring = (cx, cy, doubles, opts = {}) => {
    const v = V(cx, cy), c = P(cx, cy);
    let g = '';
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      if (doubles.includes(i)) g += ringDouble(v[i], v[j], c, { inset: opts.inset ?? 8, gap: opts.gap ?? 4 });
      else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
    }
    return g;
  };
  /* A substituent on vertex i: a bond out to a labelled disc. */
  const sub = (cx, cy, i, txt, o = {}) => {
    const p = out(cx, cy, i, o.d ?? 30);
    const r = o.r ?? 15;
    return bond(V(cx, cy)[i], p, { rFrom: 0, rTo: r, order: o.order, gap: 3.4, cls: o.bondCls }) +
           atom(p.x, p.y, txt, { kind: o.kind || 'plain', r, size: o.size });
  };
  /* A charge or other mark sitting just outside vertex i. */
  const mark = (cx, cy, i, txt, o = {}) => {
    const p = out(cx, cy, i, o.d ?? 19);
    return text(p.x, p.y + (o.dy ?? 5), txt, { cls: o.cls || 'fg-warn', size: o.size ?? 15 });
  };
  /* A carbanion on ring vertex i: a lone pair just outside it and the
     minus sign beyond that. Returns the ink and the lone pair's position. */
  const anion = (cx, cy, i) => {
    const lp = out(cx, cy, i, 10);
    const ang = Math.atan2(lp.y - cy, lp.x - cx) * 180 / Math.PI;
    const v = V(cx, cy)[i];
    return {
      s: lonePair(v.x, v.y, ang, { dist: 10 }) + mark(cx, cy, i, '−', { d: 24, dy: 5 }),
      lp,
    };
  };
  return { V, out, mid, ring, sub, mark, anion };
}

/* A curly arrow from a to b that bows AWAY from point c, so it never cuts
   back across the ring or atom it is drawn around. */
function away(a, b, c, mag = 14) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len;
  const d1 = Math.hypot(mx + px * mag - c.x, my + py * mag - c.y);
  const d0 = Math.hypot(mx - c.x, my - c.y);
  return curve(a, b, { bow: d1 >= d0 ? mag : -mag, size: 7 });
}

/* A resonance arrow: one line, a head at each end. */
function resArrow(a, b) {
  return arrow(a, b) + arrow(b, a);
}

/* An oxygen on top of a ring vertex 0, either O⁻ (single bond, three lone
   pairs, the minus up and to the `minusSide`) or a C=O (two lone pairs). */
function topO(K, cx, cy, kind, o = {}) {
  const v0 = K.V(cx, cy)[0];
  const p = K.out(cx, cy, 0, 30);
  let s = '';
  if (kind === 'anion') {
    s += bond(v0, p, { rFrom: 0, rTo: 16 });
    s += atom(p.x, p.y, 'O', { kind: 'hi' });
    s += lonePair(p.x, p.y, 180) + lonePair(p.x, p.y, 270) + lonePair(p.x, p.y, 0);
    const side = o.minusSide === 'left' ? -1 : 1;
    s += text(p.x + side * 20, p.y - 16, '−', { cls: 'fg-warn', size: 15 });
  } else {
    s += bond(v0, p, { rFrom: 0, rTo: 15, order: 2, gap: 3.4 });
    s += atom(p.x, p.y, 'O');
    s += lonePair(p.x, p.y, 215) + lonePair(p.x, p.y, 325);
  }
  return { s, p };
}

const FIGURES = [];

/* ----------------------------------------------------------------------
   0. Phenol against benzyl alcohol: where the OH sits.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'phenol-vs-benzyl-alcohol',
  section: 'phenols',
  anchor: '<!-- phenols:benzyl -->',
  viewBox: '0 0 340 214',
  alt: 'Left: phenol, a benzene ring with an OH bonded straight to a ring carbon, pKa 10. Right: benzyl alcohol, a benzene ring carrying a CH2 group whose carbon holds the OH, one carbon out from the ring, pKa about 15.',
  build() {
    const K = hexKit(28);
    let s = '';
    // phenol
    s += K.ring(85, 118, [0, 2, 4]);
    s += K.sub(85, 118, 0, 'OH', { kind: 'hi', r: 16, d: 30 });
    s += tag(85, 186, 'phenol');
    s += tag(85, 204, 'on the ring · pKa 10', { cls: 'fg-tag-good' });
    // benzyl alcohol
    const cx = 255, cy = 128;
    s += K.ring(cx, cy, [0, 2, 4]);
    const v0 = K.V(cx, cy)[0];
    const ch2 = P(cx, cy - 28 - 30), oh = P(cx + 40, ch2.y - 22);
    s += bond(v0, ch2, { rFrom: 0, rTo: 19 });
    s += bond(ch2, oh, { rFrom: 19, rTo: 16 });
    s += atom(ch2.x, ch2.y, 'CH₂', { r: 19 });
    s += atom(oh.x, oh.y, 'OH', { kind: 'hi', r: 16 });
    s += tag(cx, 186, 'benzyl alcohol');
    s += tag(cx, 204, 'one C out · pKa ≈ 15', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Find the carbon that holds the oxygen. In phenol it is a ring carbon; in benzyl alcohol it is the CH₂ outside the ring.',
});

/* ----------------------------------------------------------------------
   1. Where a phenoxide puts its charge: four contributors joined by
   curved arrows, then the hybrid beside ethoxide.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'phenoxide-resonance',
  section: 'phenols',
  lessons: ['phenols'],
  anchor: '<!-- phenols:resonance -->',
  viewBox: '0 0 340 566',
  alt: 'Four resonance contributors of phenoxide, read clockwise from the top left. First, the charge sits on the oxygen, and curved arrows push an oxygen lone pair into the C–O bond and a ring pi bond onto an ortho carbon. Second, the charge is on that ortho carbon, and arrows move it on to the para carbon. Third, the charge is on the para carbon, and arrows move it to the other ortho carbon. Fourth, the charge is on the other ortho carbon. Below, the hybrid, drawn with a dashed circle in the ring, carries partial negative charge on the oxygen, both ortho carbons and the para carbon, and none on the two meta carbons. Beside it, ethoxide holds its whole charge on one oxygen.',
  build() {
    const R = 34, K = hexKit(R);
    let s = '';
    const A = P(85, 100), B = P(255, 100), C = P(255, 292), D = P(85, 292);

    // A: charge on oxygen
    s += K.ring(A.x, A.y, [0, 2, 4]);
    {
      const o = topO(K, A.x, A.y, 'anion', { minusSide: 'left' });
      s += o.s;
      // lone pair (right) into the C–O bond
      s += away(P(o.p.x + 24, o.p.y + 6), P(A.x + 5, A.y - R - 12), o.p, 12);
      // ring pi bond 0-1 onto the ortho carbon (vertex 1)
      s += away(K.mid(A.x, A.y, 0, 4), K.out(A.x, A.y, 1, 9), A, 12);
    }
    s += tag(A.x, A.y + 76, 'charge on oxygen');

    // B: charge on the ortho carbon (vertex 1)
    s += K.ring(B.x, B.y, [2, 4]);
    s += topO(K, B.x, B.y, 'carbonyl').s;
    {
      const an = K.anion(B.x, B.y, 1);
      s += an.s;
      s += away(P(an.lp.x + 2, an.lp.y + 6), K.mid(B.x, B.y, 1, 4), B, 12);
      s += away(K.mid(B.x, B.y, 2, 4), K.out(B.x, B.y, 3, 9), B, 12);
    }
    s += tag(B.x, B.y + 76, 'on an ortho carbon');

    // C: charge on the para carbon (vertex 3)
    s += K.ring(C.x, C.y, [1, 4]);
    s += topO(K, C.x, C.y, 'carbonyl').s;
    {
      const an = K.anion(C.x, C.y, 3);
      s += an.s;
      s += away(P(an.lp.x - 6, an.lp.y), K.mid(C.x, C.y, 3, 4), C, 12);
      s += away(K.mid(C.x, C.y, 4, 4), K.out(C.x, C.y, 5, 9), C, 12);
    }
    s += tag(C.x, C.y + 76, 'on the para carbon');

    // D: charge on the other ortho carbon (vertex 5)
    s += K.ring(D.x, D.y, [1, 3]);
    s += topO(K, D.x, D.y, 'carbonyl').s;
    s += K.anion(D.x, D.y, 5).s;
    s += tag(D.x, D.y + 76, 'on the other ortho');

    // resonance arrows: A–B across, B–C down the right edge, C–D across
    s += resArrow(P(140, A.y), P(200, A.y));
    s += resArrow(P(326, 150), P(326, 244));
    s += resArrow(P(200, C.y + 44), P(140, C.y + 44));

    s += rule(12, 384, 328, 384);

    // the hybrid
    {
      const K2 = hexKit(28), H = P(85, 472);
      s += K2.ring(H.x, H.y, []);
      s += `<circle class="fg-dash" cx="${H.x}" cy="${H.y}" r="17" fill="none"></circle>`;
      const v0 = K2.V(H.x, H.y)[0], o = K2.out(H.x, H.y, 0, 28);
      s += bond(v0, o, { rFrom: 0, rTo: 16 });
      s += atom(o.x, o.y, 'O', { kind: 'hi' });
      s += text(o.x + 24, o.y - 4, 'δ−', { cls: 'fg-warn', size: 13 });
      for (const i of [1, 3, 5]) s += K2.mark(H.x, H.y, i, 'δ−', { d: 15, size: 13, dy: 5 });
      s += K2.mark(H.x, H.y, 2, 'meta', { d: 20, cls: 'fg-tag-mut', size: 11, dy: 6 });
      s += K2.mark(H.x, H.y, 4, 'meta', { d: 20, cls: 'fg-tag-mut', size: 11, dy: 6 });
      s += tag(H.x, 540, 'four atoms share it');
      s += tag(H.x, 557, 'phenol: pKa 10', { cls: 'fg-tag-good' });
    }
    // ethoxide
    {
      const me = P(204, 478), ch2 = P(250, 452), O = P(294, 478);
      s += bond(me, ch2, { rFrom: 19, rTo: 19 });
      s += bond(ch2, O, { rFrom: 19, rTo: 16 });
      s += atom(me.x, me.y, 'CH₃', { r: 19 });
      s += atom(ch2.x, ch2.y, 'CH₂', { r: 19 });
      s += atom(O.x, O.y, 'O', { kind: 'warn' });
      s += lonePair(O.x, O.y, 90) + lonePair(O.x, O.y, 0) + lonePair(O.x, O.y, 300);
      s += text(O.x + 24, O.y - 22, '−', { cls: 'fg-warn', size: 15 });
      s += tag(250, 540, 'one oxygen holds it');
      s += tag(250, 557, 'ethanol: pKa 16', { cls: 'fg-tag-mut' });
    }
    return s;
  },
  caption: 'Follow the arrows clockwise from the top left: each pair of arrows turns one structure into the next. Then look for a meta carbon carrying the charge in any of the four.',
  note: 'These are the same ring positions that carried the charge in the benzyl cation (<a class="chapter-ref" href="/ochem/notes/benzylic-reactivity.html">Benzylic reactivity</a>) and the Meisenheimer complex (<a class="chapter-ref" href="/ochem/notes/nucleophilic-aromatic.html">SNAr and benzyne</a>): ortho and para to the ring carbon that carries the group (in the Meisenheimer complex, the carbon the nucleophile added to).',
});

/* ----------------------------------------------------------------------
   2. Para against meta nitro: only para can take the charge.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'nitrophenoxide-position',
  section: 'phenols',
  lessons: ['phenols'],
  anchor: '<!-- phenols:nitro -->',
  viewBox: '0 0 340 554',
  alt: 'Top panel, 4-nitrophenoxide, the anion of 4-nitrophenol (pKa 7.2): four curved arrows move the charge from the phenoxide oxygen through the ring and into the para nitro group, giving a second contributor with a C=O at the top, a C=N at the bottom and the negative charge on a nitro oxygen. Bottom panel, 3-nitrophenoxide, the anion of 3-nitrophenol (pKa 8.4): the nitro group sits on a meta carbon; the charge-bearing positions, the oxygen, both ortho carbons and the para carbon, are marked, and the nitro carbon is not one of them, so the group helps by induction only.',
  build() {
    const R = 32, K = hexKit(R);
    let s = '';
    s += panel(6, 6, 328, 276);
    s += tag(170, 28, 'FROM 4-NITROPHENOL, pKₐ 7.2', { cls: 'fg-tag-good' });

    /* The nitro group hanging below vertex 3: N, then two oxygens. */
    const nitro = (cx, cy, form) => {
      let g = '';
      const v3 = K.V(cx, cy)[3];
      const N = P(cx, v3.y + 34), Oa = P(cx - 36, N.y + 22), Ob = P(cx + 36, N.y + 22);
      g += bond(v3, N, { rFrom: 0, rTo: 15, order: form === 'quinoid' ? 2 : 1, gap: 3.4 });
      g += bond(N, Oa, {});
      g += bond(N, Ob, { order: form === 'quinoid' ? 1 : 2, gap: 3.4 });
      g += atom(N.x, N.y, 'N');
      g += atom(Oa.x, Oa.y, 'O', { kind: form === 'quinoid' ? 'warn' : 'plain' });
      g += atom(Ob.x, Ob.y, 'O', { kind: form === 'quinoid' ? 'warn' : 'plain' });
      g += text(N.x + 19, N.y - 8, '+', { cls: 'fg-warn', size: 13 });
      g += text(Oa.x - 20, Oa.y - 14, '−', { cls: 'fg-warn', size: 15 });
      if (form === 'quinoid') g += text(Ob.x + 20, Ob.y - 14, '−', { cls: 'fg-warn', size: 15 });
      // O−: three lone pairs; N=O oxygen: two
      g += lonePair(Oa.x, Oa.y, 90, { dist: 20 }) + lonePair(Oa.x, Oa.y, 180, { dist: 20 }) + lonePair(Oa.x, Oa.y, 270, { dist: 20 });
      g += form === 'quinoid'
        ? lonePair(Ob.x, Ob.y, 90, { dist: 20 }) + lonePair(Ob.x, Ob.y, 0, { dist: 20 }) + lonePair(Ob.x, Ob.y, 270, { dist: 20 })
        : lonePair(Ob.x, Ob.y, 60, { dist: 20 }) + lonePair(Ob.x, Ob.y, 330, { dist: 20 });
      return { g, N, Oa, Ob };
    };

    // left: the phenoxide with four arrows
    {
      const cx = 78, cy = 118;
      s += K.ring(cx, cy, [0, 2, 4]);
      const o = topO(K, cx, cy, 'anion', { minusSide: 'left' });
      s += o.s;
      const n = nitro(cx, cy, 'plain');
      s += n.g;
      s += away(P(o.p.x + 24, o.p.y + 6), P(cx + 5, cy - R - 12), o.p, 12);
      s += away(K.mid(cx, cy, 0, 4), K.mid(cx, cy, 1, 5), P(cx, cy), 12);
      s += away(K.mid(cx, cy, 2, 4), P(cx + 6, cy + R + 14), P(cx, cy), 12);
      s += away(P(n.N.x + 20, n.N.y + 17), P(n.Ob.x + 4, n.Ob.y + 17), n.N, 10);
    }
    s += resArrow(P(140, 118), P(200, 118));
    // right: the quinoid contributor
    {
      const cx = 262, cy = 118;
      s += K.ring(cx, cy, [1, 4]);
      s += topO(K, cx, cy, 'carbonyl').s;
      s += nitro(cx, cy, 'quinoid').g;
    }
    s += tag(170, 252, 'The charge reaches the nitro oxygens,');
    s += tag(170, 270, 'so para nitro stabilizes by resonance.');

    s += panel(6, 294, 328, 254);
    s += tag(170, 316, 'FROM 3-NITROPHENOL, pKₐ 8.4', { cls: 'fg-tag-warn' });
    {
      const K2 = hexKit(30), cx = 120, cy = 404;
      s += K2.ring(cx, cy, []);
      s += `<circle class="fg-dash" cx="${cx}" cy="${cy}" r="18" fill="none"></circle>`;
      const v0 = K2.V(cx, cy)[0], o = K2.out(cx, cy, 0, 28);
      s += bond(v0, o, { rFrom: 0, rTo: 16 });
      s += atom(o.x, o.y, 'O', { kind: 'hi' });
      s += text(o.x + 24, o.y - 4, 'δ−', { cls: 'fg-warn', size: 13 });
      for (const i of [1, 3, 5]) s += K2.mark(cx, cy, i, 'δ−', { d: 15, size: 13, dy: 5 });
      // nitro on vertex 2 (meta); the ring carbon it sits on is circled
      const v2 = K2.V(cx, cy)[2];
      const N = K2.out(cx, cy, 2, 34);
      const Oa = P(N.x + 36, N.y - 21), Ob = P(N.x, N.y + 42);
      s += `<circle class="fg-atom-warn" cx="${v2.x.toFixed(2)}" cy="${v2.y.toFixed(2)}" r="7" fill-opacity="0.5"></circle>`;
      s += bond(v2, N, { rFrom: 7, rTo: 15 });
      s += bond(N, Oa, { order: 2, gap: 3.4 });
      s += bond(N, Ob, {});
      s += atom(N.x, N.y, 'N');
      s += atom(Oa.x, Oa.y, 'O');
      s += atom(Ob.x, Ob.y, 'O');
      s += text(N.x + 20, N.y + 14, '+', { cls: 'fg-warn', size: 13 });
      s += text(Ob.x + 20, Ob.y + 24, '−', { cls: 'fg-warn', size: 15 });
      s += lonePair(Oa.x, Oa.y, 300, { dist: 20 }) + lonePair(Oa.x, Oa.y, 30, { dist: 20 });
      s += lonePair(Ob.x, Ob.y, 90, { dist: 20 }) + lonePair(Ob.x, Ob.y, 180, { dist: 20 }) + lonePair(Ob.x, Ob.y, 0, { dist: 20 });
    }
    s += tag(170, 514, 'The circled carbon never carries the charge,');
    s += tag(170, 532, 'so this nitro pulls by induction only.');
    return s;
  },
  caption: 'Top: the four arrows carry the charge from the oxygen into the para nitro group. Bottom: the δ− marks show every atom that can hold the charge, and the circled carbon under the nitro group is not one of them.',
});

/* ----------------------------------------------------------------------
   3. The pKa scale: where each phenol sits.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'phenol-pka-scale',
  section: 'phenols',
  anchor: '<!-- phenols:scale -->',
  viewBox: '0 0 760 256',
  alt: 'A pKa scale from 0 to 16 placing ethanol, phenol, the two nitrophenols, acetic acid and picric acid, with the carbonic acid line at 6.4 marked',
  build() {
    let s = '';
    const x = (p) => 80 + ((16 - p) / 16) * 600;
    s += rule(72, 176, 688, 176);
    for (let p = 0; p <= 16; p += 4) {
      s += rule(x(p), 176, x(p), 183);
      s += text(x(p), 198, String(p), { cls: 'fg-sm', size: 10 });
    }
    s += text(380, 220, 'pKₐ  —  more acidic to the right', { cls: 'fg-tag', size: 11 });

    const mark = (p, name, up, kind) => {
      s += rule(x(p), up ? 96 : 132, x(p), 176);
      s += text(x(p), up ? 88 : 124, name, { cls: kind || 'fg-lbl', size: 11 });
    };
    mark(16,   'ethanol',        true,  null);
    mark(10,   'phenol',         true,  null);
    mark(8.4,  '3-nitro (meta)', false, 'fg-tag');
    mark(7.2,  '4-nitro (para)', true,  'fg-tag-good');
    mark(4.8,  'acetic acid',    false, null);
    mark(0.4,  'picric acid',    true,  null);

    // carbonic acid, the line bicarbonate cannot cross
    s += rule(x(6.4), 56, x(6.4), 176);
    s += text(x(6.4) + 4, 48, 'carbonic acid, 6.4', { cls: 'fg-tag', anchor: 'start', size: 10.5 });
    s += text(x(6.4) + 4, 66, 'NaHCO₃ deprotonates acids to the right', { cls: 'fg-sm', anchor: 'start', size: 9.5 });

    s += text(388, 242, 'nitrophenols: same group, different position, 1.2 pKₐ units apart', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Compare the gap between phenol and ethanol with the gap between the two nitrophenols.',
});

/* ----------------------------------------------------------------------
   4. 2-Nitrophenol bonds to itself; 4-nitrophenol bonds to water.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'nitrophenol-hydrogen-bonds',
  section: 'phenols',
  anchor: '<!-- phenols:hbond -->',
  viewBox: '0 0 340 530',
  alt: 'Top: 2-nitrophenol. The OH hydrogen points toward an oxygen of the neighboring nitro group, and a dashed hydrogen bond closes a six-membered ring of H, O, two ring carbons, N and O inside one molecule. Bottom: 4-nitrophenol, whose OH hydrogen bonds with a dashed line to the oxygen of a separate water molecule.',
  build() {
    const K = hexKit(30);
    let s = '';
    s += panel(6, 6, 328, 256);
    s += tag(170, 28, '2-NITROPHENOL');
    {
      const K3 = hexKit(34), cx = 120, cy = 180;
      s += K3.ring(cx, cy, [0, 2, 4]);
      const v0 = K3.V(cx, cy)[0], v1 = K3.V(cx, cy)[1];
      const O = K3.out(cx, cy, 0, 40);
      const N = K3.out(cx, cy, 1, 40);
      const On = P(N.x, N.y - 44), Ox = P(N.x + 38, N.y + 22);
      const H = P(O.x + 30, O.y - 22);
      s += bond(v0, O, { rFrom: 0, rTo: 15 });
      s += bond(v1, N, { rFrom: 0, rTo: 15 });
      s += bond(N, On, { order: 2, gap: 3.4 });
      s += bond(N, Ox, {});
      s += bond(O, H, { rFrom: 15, rTo: 10 });
      s += bond(H, On, { rFrom: 10, rTo: 16, cls: 'fg-dash-hi' });
      s += atom(O.x, O.y, 'O');
      s += atom(H.x, H.y, 'H', { r: 10 });
      s += atom(N.x, N.y, 'N');
      s += atom(On.x, On.y, 'O', { kind: 'hi' });
      s += atom(Ox.x, Ox.y, 'O');
      s += text(N.x + 20, N.y - 6, '+', { cls: 'fg-warn', size: 13 });
      s += text(Ox.x + 21, Ox.y + 6, '−', { cls: 'fg-warn', size: 15 });
      s += tag(H.x, 52, 'H-bond inside the molecule', { cls: 'fg-tag-good' });
    }
    s += tag(170, 246, 'steam-volatile, much less soluble in water');

    s += panel(6, 274, 328, 250);
    s += tag(170, 296, '4-NITROPHENOL');
    {
      const cx = 90, cy = 410;
      s += K.ring(cx, cy, [0, 2, 4]);
      const v0 = K.V(cx, cy)[0], v3 = K.V(cx, cy)[3];
      const O = K.out(cx, cy, 0, 38), H = P(O.x + 42, O.y);
      s += bond(v0, O, { rFrom: 0, rTo: 15 });
      s += bond(O, H, { rFrom: 15, rTo: 10 });
      s += atom(O.x, O.y, 'O');
      s += atom(H.x, H.y, 'H', { r: 10 });
      const N = P(v3.x, v3.y + 30);
      s += bond(v3, N, { rFrom: 0, rTo: 17 });
      s += atom(N.x, N.y, 'NO₂', { r: 17, size: 10.5 });
      // a water molecule
      const Ow = P(H.x + 48, H.y), Hw1 = P(Ow.x + 26, Ow.y - 30), Hw2 = P(Ow.x + 26, Ow.y + 30);
      s += bond(H, Ow, { rFrom: 10, rTo: 16, cls: 'fg-dash-hi' });
      s += bond(Ow, Hw1, { rFrom: 16, rTo: 10 });
      s += bond(Ow, Hw2, { rFrom: 16, rTo: 10 });
      s += atom(Ow.x, Ow.y, 'O', { kind: 'hi' });
      s += atom(Hw1.x, Hw1.y, 'H', { r: 10 });
      s += atom(Hw2.x, Hw2.y, 'H', { r: 10 });
      s += tag(Ow.x + 44, Ow.y - 4, 'a water', { cls: 'fg-tag-mut', anchor: 'start' });
      s += tag(Ow.x + 44, Ow.y + 12, 'molecule', { cls: 'fg-tag-mut', anchor: 'start' });
      s += tag(H.x + 24, O.y + 26, 'H-bond', { cls: 'fg-tag-good' });
    }
    s += tag(170, 508, 'not steam-volatile, more soluble in water');
    return s;
  },
  caption: 'Follow the dashed line in each molecule. In 2-nitrophenol it stays inside the molecule; in 4-nitrophenol it reaches a water molecule.',
});

/* ----------------------------------------------------------------------
   5. Bromination: too fast in water, controllable in CS2.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'phenol-bromination',
  section: 'phenols',
  lessons: ['phenols'],
  anchor: '<!-- phenols:bromination -->',
  viewBox: '0 0 340 452',
  alt: 'Top panel: phenol and bromine water, with no catalyst, give 2,4,6-tribromophenol, with bromine on both ortho carbons and the para carbon. Bottom panel: phenol and bromine in CS2 at 0 degrees Celsius give mainly 4-bromophenol, with one bromine on the para carbon.',
  build() {
    const K = hexKit(26);
    let s = '';
    const phenol = (cx, cy) => K.ring(cx, cy, [0, 2, 4]) + K.sub(cx, cy, 0, 'OH', { kind: 'hi', r: 16, d: 28 });
    const br = (cx, cy, i) => K.sub(cx, cy, i, 'Br', { kind: 'warn', r: 15, d: 28 });

    s += panel(6, 6, 328, 212);
    s += tag(170, 28, 'BROMINE WATER, NO CATALYST');
    s += phenol(60, 116);
    s += arrow(P(98, 116), P(180, 116));
    s += tag(139, 106, 'Br₂, H₂O');
    s += tag(139, 134, 'no FeBr₃', { cls: 'fg-tag-mut' });
    s += phenol(254, 116) + br(254, 116, 1) + br(254, 116, 3) + br(254, 116, 5);
    s += tag(170, 204, '2,4,6-tribromophenol: both ortho and para', { cls: 'fg-tag-warn' });

    s += panel(6, 230, 328, 216);
    s += tag(170, 252, 'BROMINE IN CS₂, 0 °C');
    s += phenol(60, 336);
    s += arrow(P(98, 336), P(180, 336));
    s += tag(139, 326, 'Br₂, CS₂');
    s += tag(139, 354, '0 °C', { cls: 'fg-tag-mut' });
    s += phenol(254, 330) + br(254, 330, 3);
    s += tag(170, 430, '4-bromophenol, the main product', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Count the bromines in each product, and note which ring positions they occupy.',
});

/* ----------------------------------------------------------------------
   6. Kolbe–Schmitt: the ring carbon attacks CO2, steered by Na+.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'kolbe-schmitt',
  section: 'phenols',
  anchor: '<!-- phenols:kolbe -->',
  viewBox: '0 0 760 300',
  alt: 'Left: sodium phenoxide beside a CO2 molecule. The sodium ion sits between the phenoxide oxygen and one CO2 oxygen, with dashed lines to each. Curved arrows push an oxygen lone pair into the C–O bond, the ring pi bond from an ortho carbon onto the CO2 carbon, and a C=O pi bond of CO2 onto its lower oxygen. Middle: the product of that step, with a C=O on the ring and the ortho carbon now sp3, carrying an H and a carboxylate with its sodium ion. Right: after the H moves from carbon to oxygen and acid workup, salicylic acid, 2-hydroxybenzoic acid.',
  build() {
    const R = 30, K = hexKit(R);
    let s = '';
    // stage 1
    {
      const cx = 100, cy = 176;
      s += K.ring(cx, cy, [0, 2, 4]);
      const o = topO(K, cx, cy, 'anion', { minusSide: 'left' });
      s += o.s;
      const Cc = P(200, 158), Ou = P(200, 114), Od = P(200, 202);
      s += bond(Cc, Ou, { order: 2, gap: 3.4 });
      s += bond(Cc, Od, { order: 2, gap: 3.4 });
      s += atom(Cc.x, Cc.y, 'C', { kind: 'hi' });
      s += atom(Ou.x, Ou.y, 'O');
      s += atom(Od.x, Od.y, 'O');
      s += lonePair(Ou.x, Ou.y, 325, { dist: 20 }) + lonePair(Ou.x, Ou.y, 35, { dist: 20 });
      s += lonePair(Od.x, Od.y, 150, { dist: 20 }) + lonePair(Od.x, Od.y, 210, { dist: 20 });
      const Na = P(150, 76);
      s += bond(o.p, Na, { rFrom: 22, rTo: 18, cls: 'fg-dash' });
      s += bond(Ou, Na, { rFrom: 15, rTo: 18, cls: 'fg-dash' });
      s += atom(Na.x, Na.y, 'Na⁺', { kind: 'warn', r: 18, size: 11 });
      // arrows
      s += away(P(o.p.x + 24, o.p.y + 6), P(cx + 5, cy - R - 12), o.p, 12);
      s += away(K.mid(cx, cy, 0, 4), P(Cc.x - 16, Cc.y + 2), P(cx, cy + 40), 10);
      s += away(P(Cc.x + 7, Cc.y + 22), P(Od.x + 16, Od.y + 2), Cc, 10);
      s += tag(130, 250, 'Na⁺ holds CO₂ beside');
      s += tag(130, 268, 'an ortho carbon');
    }
    s += arrow(P(236, 176), P(300, 176));
    // stage 2
    {
      const cx = 360, cy = 176;
      s += K.ring(cx, cy, [2, 4]);
      s += topO(K, cx, cy, 'carbonyl').s;
      const v1 = K.V(cx, cy)[1];
      const H = P(v1.x + 12, v1.y - 38);
      const Cc = P(v1.x + 38, v1.y + 12);
      const Oa = P(Cc.x + 32, Cc.y - 30), Ob = P(Cc.x + 12, Cc.y + 42);
      s += bond(v1, H, { rFrom: 0, rTo: 11 });
      s += bond(v1, Cc, { rFrom: 0, rTo: 15 });
      s += bond(Cc, Oa, { order: 2, gap: 3.4 });
      s += bond(Cc, Ob, {});
      s += atom(H.x, H.y, 'H', { r: 11, kind: 'hi' });
      s += atom(Cc.x, Cc.y, 'C');
      s += atom(Oa.x, Oa.y, 'O');
      s += atom(Ob.x, Ob.y, 'O');
      s += text(Ob.x + 21, Ob.y - 14, '−', { cls: 'fg-warn', size: 15 });
      s += lonePair(Oa.x, Oa.y, 300, { dist: 20 }) + lonePair(Oa.x, Oa.y, 30, { dist: 20 });
      s += lonePair(Ob.x, Ob.y, 180, { dist: 20 }) + lonePair(Ob.x, Ob.y, 90, { dist: 20 }) + lonePair(Ob.x, Ob.y, 0, { dist: 20 });
      s += text(Ob.x + 50, Ob.y + 5, 'Na⁺', { cls: 'fg-lbl', size: 12 });
      s += tag(372, 250, 'the ortho carbon is sp³;');
      s += tag(372, 268, 'the ring is not aromatic');
    }
    s += arrow(P(486, 176), P(566, 176));
    s += tag(526, 150, 'H moves to');
    s += tag(526, 164, 'the ring O');
    s += tag(526, 196, 'then H₃O⁺', { cls: 'fg-tag-mut' });
    // stage 3: salicylic acid
    {
      const cx = 626, cy = 176;
      s += K.ring(cx, cy, [0, 2, 4]);
      s += K.sub(cx, cy, 0, 'OH', { kind: 'hi', r: 16, d: 30 });
      const v1 = K.V(cx, cy)[1];
      const Cc = K.out(cx, cy, 1, 34);
      const Oa = P(Cc.x, Cc.y - 42), Ob = P(Cc.x + 38, Cc.y + 22);
      s += bond(v1, Cc, { rFrom: 0, rTo: 15 });
      s += bond(Cc, Oa, { order: 2, gap: 3.4 });
      s += bond(Cc, Ob, { rTo: 16 });
      s += atom(Cc.x, Cc.y, 'C', { kind: 'hi' });
      s += atom(Oa.x, Oa.y, 'O');
      s += atom(Ob.x, Ob.y, 'OH', { r: 16 });
      s += tag(650, 250, 'salicylic acid', { cls: 'fg-tag-good' });
      s += tag(650, 268, '(2-hydroxybenzoic acid)', { cls: 'fg-tag-mut' });
    }
    return s;
  },
  caption: 'Find the new C–C bond in the middle structure, then trace the two dashed lines to the sodium ion on the left.',
});

/* ----------------------------------------------------------------------
   7. Reimer–Tiemann: make the carbene, then let the ring attack it.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'reimer-tiemann',
  section: 'phenols',
  anchor: '<!-- phenols:reimer -->',
  viewBox: '0 0 760 452',
  alt: 'Top row, making the carbene: hydroxide takes the proton from chloroform, with curved arrows from a hydroxide lone pair to the H and from the C–H bond onto carbon, giving the trichloromethyl anion; a curved arrow from a C–Cl bond onto chlorine then expels chloride, leaving dichlorocarbene, a carbon with two chlorines, one lone pair and an empty orbital. Bottom row: curved arrows push the phenoxide oxygen lone pair into the ring and the ortho ring pi bond onto the carbene carbon. After proton transfers the ring is aromatic again and carries a CHCl2 group on the ortho carbon, which hydrolysis and acid workup turn into the CHO of salicylaldehyde.',
  build() {
    const K = hexKit(30);
    let s = '';
    s += tag(380, 24, 'MAKING THE CARBENE');
    // hydroxide
    {
      const Hh = P(26, 112), O = P(68, 112);
      s += bond(Hh, O, { rFrom: 11, rTo: 16 });
      s += atom(Hh.x, Hh.y, 'H', { r: 11 });
      s += atom(O.x, O.y, 'O', { kind: 'warn' });
      s += lonePair(O.x, O.y, 270) + lonePair(O.x, O.y, 90) + lonePair(O.x, O.y, 0);
      s += text(O.x + 16, O.y - 20, '−', { cls: 'fg-warn', size: 15 });
      // chloroform
      const H = P(132, 112), C = P(178, 112);
      const Cl1 = P(178, 66), Cl2 = P(224, 112), Cl3 = P(178, 158);
      s += bond(H, C, { rFrom: 11 });
      s += bond(C, Cl1, { rTo: 16 });
      s += bond(C, Cl2, { rTo: 16 });
      s += bond(C, Cl3, { rTo: 16 });
      s += atom(H.x, H.y, 'H', { r: 11, kind: 'hi' });
      s += atom(C.x, C.y, 'C');
      for (const p of [Cl1, Cl2, Cl3]) s += atom(p.x, p.y, 'Cl', { r: 16 });
      s += away(P(O.x + 22, O.y - 8), P(H.x - 9, H.y - 8), P(100, 140), 12);
      s += away(P(155, 116), P(168, 126), P(155, 90), 10);
      s += tag(126, 196, 'hydroxide takes the H');
    }
    s += arrow(P(250, 112), P(300, 112));
    s += tag(275, 100, '− H₂O', { cls: 'fg-tag-mut' });
    // trichloromethyl anion
    {
      const C = P(370, 112);
      const Cl1 = P(370, 66), Cl2 = P(416, 112), Cl3 = P(370, 158);
      s += bond(C, Cl1, { rTo: 16 }) + bond(C, Cl2, { rTo: 16 }) + bond(C, Cl3, { rTo: 16 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      for (const p of [Cl1, Cl2, Cl3]) s += atom(p.x, p.y, 'Cl', { r: 16 });
      s += lonePair(C.x, C.y, 180);
      s += text(C.x - 26, C.y - 12, '−', { cls: 'fg-warn', size: 15 });
      s += away(P(393, 108), P(420, 94), P(393, 130), 10);
      s += tag(376, 196, 'chloride leaves');
    }
    s += arrow(P(450, 112), P(500, 112));
    s += tag(475, 100, '− Cl⁻', { cls: 'fg-tag-mut' });
    // dichlorocarbene
    {
      const C = P(580, 100), Cl1 = P(542, 124), Cl2 = P(618, 124);
      s += bond(C, Cl1, { rTo: 16 }) + bond(C, Cl2, { rTo: 16 });
      s += atom(C.x, C.y, 'C', { kind: 'warn' });
      s += atom(Cl1.x, Cl1.y, 'Cl', { r: 16 });
      s += atom(Cl2.x, Cl2.y, 'Cl', { r: 16 });
      s += lonePair(C.x, C.y, 270);
      s += tag(600, 80, 'plus an empty orbital', { anchor: 'start' });
      s += tag(600, 172, 'dichlorocarbene, :CCl₂', { cls: 'fg-tag-warn' });
      s += tag(600, 190, 'six valence electrons');
    }
    s += rule(20, 212, 740, 212);
    s += tag(380, 236, 'THE RING ATTACKS IT');
    // phenoxide + carbene
    {
      const cx = 82, cy = 344;
      s += K.ring(cx, cy, [0, 2, 4]);
      const o = topO(K, cx, cy, 'anion', { minusSide: 'left' });
      s += o.s;
      const C = P(184, 322), Cl1 = P(184, 276), Cl2 = P(224, 345);
      s += bond(C, Cl1, { rTo: 16 }) + bond(C, Cl2, { rTo: 16 });
      s += atom(C.x, C.y, 'C', { kind: 'warn' });
      s += atom(Cl1.x, Cl1.y, 'Cl', { r: 16 });
      s += atom(Cl2.x, Cl2.y, 'Cl', { r: 16 });
      s += lonePair(C.x, C.y, 150);
      s += away(P(o.p.x + 24, o.p.y + 6), P(cx + 5, cy - 30 - 12), o.p, 12);
      s += away(K.mid(cx, cy, 0, 4), P(C.x - 16, C.y + 4), P(cx, cy + 40), 10);
      s += tag(130, 420, 'an ortho carbon');
      s += tag(130, 438, 'attacks the carbene');
    }
    s += arrow(P(250, 344), P(330, 344));
    s += tag(290, 332, 'H⁺ shifts', { cls: 'fg-tag-mut' });
    // 2-(dichloromethyl)phenoxide
    {
      const cx = 410, cy = 344;
      s += K.ring(cx, cy, [0, 2, 4]);
      const o = topO(K, cx, cy, 'anion', { minusSide: 'left' });
      s += o.s;
      s += K.sub(cx, cy, 1, 'CHCl₂', { r: 25, d: 34, size: 10.5 });
      s += tag(420, 420, 'aromatic again,');
      s += tag(420, 438, 'CHCl₂ on the ortho carbon');
    }
    s += arrow(P(500, 344), P(580, 344));
    s += tag(540, 332, 'hydrolysis,');
    s += tag(540, 364, 'then H₃O⁺', { cls: 'fg-tag-mut' });
    // salicylaldehyde
    {
      const cx = 648, cy = 350;
      s += K.ring(cx, cy, [0, 2, 4]);
      s += K.sub(cx, cy, 0, 'OH', { kind: 'hi', r: 16, d: 30 });
      const v1 = K.V(cx, cy)[1];
      const C = K.out(cx, cy, 1, 34);
      const O = P(C.x, C.y - 42), H = P(C.x + 34, C.y + 20);
      s += bond(v1, C, { rFrom: 0, rTo: 15 });
      s += bond(C, O, { order: 2, gap: 3.4 });
      s += bond(C, H, { rTo: 11 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(O.x, O.y, 'O');
      s += atom(H.x, H.y, 'H', { r: 11 });
      s += tag(660, 420, 'salicylaldehyde', { cls: 'fg-tag-good' });
      s += tag(660, 438, '(2-hydroxybenzaldehyde)', { cls: 'fg-tag-mut' });
    }
    return s;
  },
  caption: 'Top row: follow the arrows to see chloroform lose H⁺ and then Cl⁻. Bottom row: find the ring carbon that bonds to the carbene. The carbene carbon becomes the CHO carbon on it.',
});

/* ----------------------------------------------------------------------
   8. Oxidation to a quinone, and the quinone/hydroquinone pair.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'quinone-hydroquinone',
  section: 'phenols',
  anchor: '<!-- phenols:quinone -->',
  viewBox: '0 0 760 250',
  alt: 'Left: phenol, oxidized by sodium dichromate in sulfuric acid or by Fremy’s salt, gives p-benzoquinone, a six-membered ring with a C=O at the top and at the bottom and two C=C bonds, which is not aromatic. Right: p-benzoquinone and hydroquinone, 1,4-dihydroxybenzene, interconvert: adding two electrons and two protons gives hydroquinone, and removing them gives the quinone back.',
  build() {
    const K = hexKit(30);
    let s = '';
    // phenol
    s += K.ring(90, 100, [0, 2, 4]) + K.sub(90, 100, 0, 'OH', { kind: 'hi', r: 16, d: 30 });
    s += tag(90, 200, 'phenol');
    s += arrow(P(140, 100), P(290, 100));
    s += tag(215, 88, 'Na₂Cr₂O₇, H₂SO₄');
    s += tag(215, 118, "or Fremy's salt", { cls: 'fg-tag-mut' });
    // p-benzoquinone
    {
      const cx = 380, cy = 100;
      s += K.ring(cx, cy, [1, 4]);
      const v = K.V(cx, cy);
      const Ot = P(cx, cy - 60), Ob = P(cx, cy + 60);
      s += bond(v[0], Ot, { rFrom: 0, rTo: 15, order: 2, gap: 3.4 });
      s += bond(v[3], Ob, { rFrom: 0, rTo: 15, order: 2, gap: 3.4 });
      s += atom(Ot.x, Ot.y, 'O', { kind: 'warn' });
      s += atom(Ob.x, Ob.y, 'O', { kind: 'warn' });
      s += `<text class="fg-tag-warn" x="${cx}" y="200" text-anchor="middle" font-size="11"><tspan font-style="italic">p</tspan>-benzoquinone</text>`;
      s += tag(cx, 218, 'not aromatic · yellow');
      s += tag(cx, 236, 'each C=O sits between two C=C', { cls: 'fg-tag-mut' });
    }
    s += arrow(P(450, 88), P(590, 88));
    s += arrow(P(590, 112), P(450, 112));
    s += tag(520, 76, '+ 2 e⁻, + 2 H⁺');
    s += tag(520, 134, '− 2 e⁻, − 2 H⁺');
    // hydroquinone
    {
      const cx = 670, cy = 100;
      s += K.ring(cx, cy, [0, 2, 4]);
      s += K.sub(cx, cy, 0, 'OH', { kind: 'hi', r: 16, d: 30 });
      s += K.sub(cx, cy, 3, 'OH', { kind: 'hi', r: 16, d: 30 });
      s += tag(cx, 200, 'hydroquinone');
      s += tag(cx, 218, '(1,4-dihydroxybenzene)', { cls: 'fg-tag-mut' });
    }
    return s;
  },
  caption: 'Compare the two rings on the right: two C=O and two C=C bonds in the quinone, two OH groups on an aromatic ring in hydroquinone.',
});

export default FIGURES;
