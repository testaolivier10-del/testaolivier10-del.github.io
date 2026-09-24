/* Figures for the naming-functional-groups notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every drawing is skeletal: this topic comes after skeletal structures. Chains
   are drawn as zigzags with 40 px bonds; locant numbers sit on the outside of
   the zigzag, or inside the angle when a group takes the outside. */
import { atom, bond, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { zig, sk, polyPts, polyRing, benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* Shared helpers ---------------------------------------------------------- */
const num = (x, y, v) => text(x, y, v, { cls: 'fg-lbl', size: 11 });
const sm = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-sm', size: 10, anchor });
const good = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-good', size: 11.5, anchor });
const warn = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-warn', size: 11.5, anchor });
/* A locant beside a zigzag vertex. `where` is 'above' or 'below' the vertex. */
const at = (p, v, where) => num(p.x, where === 'above' ? p.y - 9 : p.y + 21, v);
/* A chain of skeletal bonds along a list of vertices. */
const chain = (pts, hi) => pts.slice(1).map((q, i) => sk(pts[i], q, hi)).join('');
/* A labelled atom bonded to a skeletal vertex. */
const hang = (from, to, label, opts = {}) =>
  bond(from, to, { rFrom: 0, rTo: opts.r ?? 15, order: opts.order || 1, cls: opts.cls }) +
  atom(to.x, to.y, label, { kind: opts.kind || 'plain' });

/* ------------------------------------------------------------------ 1 ---
   The page's opening claim, shown before it is stated: the same OH is a
   suffix in one molecule and a prefix in the next. */
FIGURES.push({
  id: 'suffix-or-prefix',
  section: 'naming-functional-groups',
  anchor: '<h3>One group gets the suffix. Everything else becomes a prefix.</h3>',
  alt: 'Left: butan-2-ol, a four-carbon chain numbered 1 to 4 with an OH on C2; the OH is the only group and takes the suffix -ol. Right: 4-hydroxybutan-2-one, a four-carbon chain with a C=O on C2 and an OH on C4; the ketone takes the suffix -one and the OH is named hydroxy-.',
  viewBox: '0 0 720 290',
  build() {
    let s = '';
    s += panel(12, 44, 340, 176, { kind: 'hi' });
    s += tag(182, 32, 'one group: it takes the suffix');
    {
      const p = zig(122, 160, 4, 40, 24);
      s += chain(p);
      s += hang(p[1], P(p[1].x, p[1].y - 40), 'OH', { kind: 'hi' });
      s += at(p[0], '1', 'below') + at(p[1], '2', 'below') + at(p[2], '3', 'below') + at(p[3], '4', 'above');
      s += good(182, 248, 'butan-2-ol');
      s += sm(182, 268, 'the OH is the suffix -ol');
    }
    s += panel(368, 44, 340, 176, { kind: 'hi' });
    s += tag(538, 32, 'two groups: the ketone outranks the OH');
    {
      const p = zig(454, 160, 4, 40, 24);
      s += chain(p);
      s += hang(p[1], P(p[1].x, p[1].y - 40), 'O', { order: 2, kind: 'hi' });
      s += hang(p[3], P(p[3].x + 40, p[3].y + 24), 'OH');
      s += sm(614, 196, 'hydroxy-');
      s += at(p[0], '1', 'below') + at(p[1], '2', 'below') + at(p[2], '3', 'below') + at(p[3], '4', 'above');
      s += good(538, 248, '4-hydroxybutan-2-one');
      s += sm(538, 268, 'the C=O is the suffix -one; the OH is a prefix');
    }
    return s;
  },
  caption: 'Find the OH in each drawing, then read its name below.',
});

/* ------------------------------------------------------------------ 2 ---
   The priority list as fragments, in the IUPAC 2013 order, grouped by how
   many bonds the group's carbon makes to O, N or Cl. */
FIGURES.push({
  id: 'principal-group-fragments',
  section: 'naming-functional-groups',
  anchor: '<h3>The priority order</h3>',
  alt: 'Twelve skeletal fragments in priority order. Top row, the acid and its derivatives: carboxylic acid (-oic acid), anhydride (-oic anhydride), ester (-oate), acyl chloride (-oyl chloride), amide (-amide), nitrile (-nitrile). Bottom row: aldehyde (-al), ketone (-one), alcohol (-ol), amine (-amine), then alkene and alkyne, which are not suffix groups.',
  viewBox: '0 0 720 412',
  build() {
    let s = '';
    const acyl = (cx, cy, X) => {
      const C = P(cx - 8, cy + 6), O = P(cx - 8, cy - 30), Xp = P(cx + 26, cy + 24), R = P(cx - 40, cy + 24);
      return sk(R, C) + hang(C, O, 'O', { order: 2 }) + hang(C, Xp, X, { kind: 'hi', r: X.length > 2 ? 16 : 15 });
    };
    const groups = [
      { name: ['carboxylic', 'acid'], suffix: '-oic acid', draw: (cx, cy) => acyl(cx, cy, 'OH') },
      { name: ['anhydride'], suffix: '-oic anhydride', draw(cx, cy) {
        const C1 = P(cx - 26, cy + 4), C2 = P(cx + 26, cy + 4), Ob = P(cx, cy + 22);
        return sk(P(cx - 50, cy + 22), C1) + sk(C2, P(cx + 50, cy + 22)) +
          hang(C1, P(C1.x, cy - 30), 'O', { order: 2 }) + hang(C2, P(C2.x, cy - 30), 'O', { order: 2 }) +
          bond(C1, Ob, { rFrom: 0, rTo: 15 }) + bond(Ob, C2, { rFrom: 15, rTo: 0 }) + atom(Ob.x, Ob.y, 'O', { kind: 'hi' });
      } },
      { name: ['ester'], suffix: 'alkyl …-oate', draw: (cx, cy) => acyl(cx, cy, 'OR′') },
      { name: ['acyl chloride'], suffix: '-oyl chloride', draw: (cx, cy) => acyl(cx, cy, 'Cl') },
      { name: ['amide'], suffix: '-amide', draw: (cx, cy) => acyl(cx, cy, 'NH₂') },
      { name: ['nitrile'], suffix: '-nitrile', draw(cx, cy) {
        const R = P(cx - 44, cy + 4), C = P(cx - 10, cy + 4), N = P(cx + 30, cy + 4);
        return sk(R, C) + hang(C, N, 'N', { order: 3, kind: 'hi' });
      } },
      { name: ['aldehyde'], suffix: '-al', draw: (cx, cy) => acyl(cx, cy, 'H') },
      { name: ['ketone'], suffix: '-one', draw(cx, cy) {
        const C = P(cx, cy + 6);
        return sk(P(cx - 32, cy + 24), C) + sk(C, P(cx + 32, cy + 24)) + hang(C, P(cx, cy - 30), 'O', { order: 2, kind: 'hi' });
      } },
      { name: ['alcohol'], suffix: '-ol', draw(cx, cy) {
        const C = P(cx - 10, cy + 2);
        return sk(P(cx - 40, cy + 20), C) + hang(C, P(cx + 26, cy + 20), 'OH', { kind: 'hi' });
      } },
      { name: ['amine'], suffix: '-amine', draw(cx, cy) {
        const C = P(cx - 10, cy + 2);
        return sk(P(cx - 40, cy + 20), C) + hang(C, P(cx + 26, cy + 20), 'NH₂', { kind: 'hi', r: 16 });
      } },
      { name: ['alkene'], suffix: 'shown as -ene', mut: true, draw(cx, cy) {
        const a = P(cx - 42, cy + 16), b = P(cx - 14, cy - 2), c = P(cx + 14, cy + 16), d = P(cx + 42, cy - 2);
        return sk(a, b) + bond(b, c, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.5 }) + sk(c, d);
      } },
      { name: ['alkyne'], suffix: 'shown as -yne', mut: true, draw(cx, cy) {
        const a = P(cx - 44, cy + 6), b = P(cx - 16, cy + 6), c = P(cx + 16, cy + 6), d = P(cx + 44, cy + 6);
        return sk(a, b) + bond(b, c, { order: 3, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.2 }) + sk(c, d);
      } },
    ];
    s += tag(360, 26, 'acid and its derivatives: three bonds from the group carbon to O, N or Cl');
    s += tag(122, 224, 'two bonds to O');
    s += tag(358, 224, 'one bond to O or N');
    s += tag(594, 224, 'no O or N: never a suffix group', { cls: 'fg-tag-mut' });
    groups.forEach((g, i) => {
      const px = 8 + (i % 6) * 118, py = 40 + Math.floor(i / 6) * 196, cx = px + 55;
      s += panel(px, py, 110, 166, { kind: i < 6 ? 'hi' : undefined });
      s += text(cx, py + 22, g.name[0], { cls: 'fg-lbl', size: 12 });
      if (g.name[1]) s += text(cx, py + 38, g.name[1], { cls: 'fg-lbl', size: 12 });
      s += g.draw(cx, py + 94);
      s += text(cx, py + 156, g.suffix, { cls: g.mut ? 'fg-tag-mut' : 'fg-tag-good', size: 10.5 });
    });
    return s;
  },
  caption: 'Priority falls left to right along the top row, then along the bottom row as far as the amine. The alkene and alkyne panels are not on the list. Under each drawing is the suffix that group takes when it wins.',
});

/* ------------------------------------------------------------------ 3 ---
   Which chain of an ester is which word. Two isomers with the same five
   carbons split the other way round, so the counts cannot be confused. */
FIGURES.push({
  id: 'ester-two-parts',
  section: 'naming-functional-groups',
  anchor: 'An ester’s name is two words',
  alt: 'Left: ethyl propanoate. The three-carbon acid part, numbered 1 to 3 from the C=O carbon, is highlighted as propanoate; the two-carbon group on the single-bonded oxygen is labeled ethyl. Right: propyl ethanoate. The two-carbon acid part is ethanoate; the three-carbon group on the single-bonded oxygen is propyl.',
  viewBox: '0 0 720 290',
  build() {
    let s = '';
    s += panel(12, 44, 340, 180);
    s += tag(182, 32, 'acid part has three carbons');
    {
      const p = zig(82, 150, 6, 40, 24);           // C3 C2 C1 O CH2 CH3
      s += chain(p.slice(0, 3), true);
      s += bond(p[2], P(p[2].x, p[2].y + 40), { order: 2, rFrom: 0, rTo: 15, cls: 'fg-bond-hi' }) + atom(p[2].x, p[2].y + 40, 'O');
      s += bond(p[2], p[3], { rFrom: 0, rTo: 15 }) + atom(p[3].x, p[3].y, 'O');
      s += bond(p[3], p[4], { rFrom: 15, rTo: 0 }) + sk(p[4], p[5]);
      s += at(p[0], '3', 'below') + at(p[1], '2', 'above') + num(p[2].x, p[2].y - 8, '1');
      s += good(122, 82, 'propanoate');
      s += sm(262, 100, 'ethyl, on the O');
      s += text(182, 252, 'ethyl propanoate', { cls: 'fg-tag', size: 11.5 });
      s += sm(182, 272, 'group on the O first, acid part second');
    }
    s += panel(368, 44, 340, 180);
    s += tag(538, 32, 'acid part has two carbons');
    {
      const p = zig(428, 150, 6, 40, 24);           // C2 C1 O CH2 CH2 CH3
      s += sk(p[0], p[1], true);
      s += bond(p[1], P(p[1].x, p[1].y - 40), { order: 2, rFrom: 0, rTo: 15, cls: 'fg-bond-hi' }) + atom(p[1].x, p[1].y - 40, 'O');
      s += bond(p[1], p[2], { rFrom: 0, rTo: 15 }) + atom(p[2].x, p[2].y, 'O');
      s += bond(p[2], p[3], { rFrom: 15, rTo: 0 }) + chain(p.slice(3));
      s += at(p[0], '2', 'below') + num(p[1].x, p[1].y + 20, '1');
      s += good(448, 200, 'ethanoate');
      s += sm(588, 100, 'propyl, on the O');
      s += text(538, 252, 'propyl ethanoate', { cls: 'fg-tag', size: 11.5 });
      s += sm(538, 272, 'same five carbons, split the other way');
    }
    return s;
  },
  caption: 'The highlighted part holds the C=O. Count its carbons from the C=O carbon to get the second word. The plain chain on the other oxygen gives the first word.',
});

/* ------------------------------------------------------------------ 4 ---
   5-methylhexan-2-ol numbered both ways: the page's central numbering rule. */
FIGURES.push({
  id: 'locant-competition',
  section: 'naming-functional-groups',
  anchor: '<h3>The principal group takes the lowest locant, and it outranks everything</h3>',
  alt: 'The same six-carbon chain numbered from each end. Numbered from the OH end, the OH is on C2 and the methyl on C5: 5-methylhexan-2-ol, correct. Numbered from the methyl end, the methyl is on C2 and the OH on C5: 2-methylhexan-5-ol, wrong.',
  viewBox: '0 0 720 290',
  build() {
    let s = '';
    const draw = (x, nums) => {
      const p = zig(x + 70, 150, 6, 40, 24);
      let t = chain(p);
      t += hang(p[1], P(p[1].x, p[1].y - 40), 'OH', { kind: 'hi' });
      t += sk(p[4], P(p[4].x, p[4].y + 40));
      t += sm(p[4].x + 8, p[4].y + 38, 'methyl', 'start');
      const where = ['below', 'below', 'below', 'above', 'above', 'above'];
      // C at index 1 carries the OH above, so its number goes inside the angle,
      // below; index 4 carries the methyl below, so its number goes above.
      p.forEach((q, i) => { t += at(q, nums[i], where[i]); });
      return t;
    };
    s += panel(12, 44, 340, 180, { kind: 'good' });
    s += tag(182, 32, 'numbered from the OH end');
    s += draw(12, ['1', '2', '3', '4', '5', '6']);
    s += good(182, 250, '5-methylhexan-2-ol');
    s += sm(182, 270, 'OH on C2: the principal group gets the low number');
    s += panel(368, 44, 340, 180, { kind: 'warn' });
    s += tag(538, 32, 'numbered from the methyl end');
    s += draw(368, ['6', '5', '4', '3', '2', '1']);
    s += warn(538, 250, '2-methylhexan-5-ol  ✗');
    s += sm(538, 270, 'the methyl took the 2 that belongs to the OH');
    return s;
  },
  caption: 'One molecule, numbered from each end. Follow the OH: from the left it sits on C2, from the right on C5.',
});

/* ------------------------------------------------------------------ 5 ---
   "Priority beats length": the longest chain misses the OH. */
FIGURES.push({
  id: 'parent-must-contain',
  section: 'naming-functional-groups',
  anchor: 'the parent chain must contain the principal characteristic group',
  alt: 'One alcohol traced twice. Left: the six-carbon chain, numbered 1 to 6, is the longest chain, but the CH2OH hangs off C3, so the OH is off the chain: 3-(hydroxymethyl)hexane, wrong. Right: the five-carbon chain that runs through the CH2OH carbon, numbered 1 to 5 from that carbon, with a two-carbon ethyl branch on C2: 2-ethylpentan-1-ol, correct.',
  viewBox: '0 0 720 290',
  build() {
    let s = '';
    const skel = (x) => {
      const a = zig(x + 70, 110, 6, 40, 24);          // a0..a5, a2 is low
      const b1 = P(a[2].x, a[2].y + 40), oh = P(a[2].x + 34, a[2].y + 60);
      return { a, b1, oh };
    };
    {
      const { a, b1, oh } = skel(12);
      s += panel(12, 44, 340, 180, { kind: 'warn' });
      s += tag(182, 32, 'the longest chain: six carbons');
      s += chain(a, true) + sk(a[2], b1) + hang(b1, oh, 'OH');
      s += at(a[0], '1', 'below') + at(a[1], '2', 'above') + at(a[2], '3', 'above');
      s += at(a[3], '4', 'above') + at(a[4], '5', 'below') + at(a[5], '6', 'above');
      s += sm(oh.x + 20, oh.y + 4, 'OH is off the chain', 'start');
      s += warn(182, 250, '3-(hydroxymethyl)hexane  ✗');
      s += sm(182, 270, 'the alcohol became a prefix');
    }
    {
      const { a, b1, oh } = skel(368);
      s += panel(368, 44, 340, 180, { kind: 'good' });
      s += tag(538, 32, 'the longest chain through the OH: five');
      s += sk(a[0], a[1]) + sk(a[1], a[2]);
      s += sk(b1, a[2], true) + chain(a.slice(2), true);
      s += bond(b1, oh, { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' }) + atom(oh.x, oh.y, 'OH', { kind: 'hi' });
      s += num(b1.x - 12, b1.y + 5, '1') + at(a[2], '2', 'above');
      s += at(a[3], '3', 'above') + at(a[4], '4', 'below') + at(a[5], '5', 'above');
      s += sm(a[0].x + 18, a[1].y - 12, 'ethyl');
      s += good(538, 250, '2-ethylpentan-1-ol');
      s += sm(538, 270, 'the alcohol takes the suffix, and C1');
    }
    return s;
  },
  caption: 'One molecule, traced two ways. The left chain is longer but misses the carbon that carries the OH. The right chain is the parent.',
  note: '<i>Hydroxymethyl</i> is a –CH₂OH branch named as a prefix. It is written in parentheses, like (2-methylpropyl). If your top-ranked group has turned into a prefix like this, you chose the chain before you ranked the groups.',
});

/* ------------------------------------------------------------------ 6 ---
   Group carbon outside the ring (-carboxylic acid, -carbaldehyde) versus
   group carbon in the ring (-one, -ol). */
FIGURES.push({
  id: 'ring-group-carbon',
  section: 'naming-functional-groups',
  anchor: 'A ketone or an alcohol on a ring',
  alt: 'Four six-membered rings with ring carbon C1 at the top. Cyclohexanecarboxylic acid: a COOH on C1, its carbon outside the ring. Cyclohexanecarbaldehyde: a CHO on C1, its carbon outside the ring. Cyclohexanone: C1 itself is the C=O. Cyclohexanol: C1 carries the OH.',
  viewBox: '0 0 760 290',
  build() {
    let s = '';
    s += tag(192, 26, 'the group’s carbon sits outside the ring');
    s += tag(568, 26, 'the group’s carbon is a ring carbon');
    const names = ['cyclohexanecarboxylic acid', 'cyclohexanecarbaldehyde', 'cyclohexanone', 'cyclohexanol'];
    const notes = ['ring C1 carries the COOH', 'ring C1 carries the CHO', 'ring C1 is the C=O carbon', 'ring C1 carries the OH'];
    names.forEach((nm, i) => {
      const px = 7 + i * 188, cx = px + 91;
      s += panel(px, 40, 182, 190, { kind: i < 2 ? 'hi' : undefined });
      const pts = polyPts(cx, 176, 6, 30);
      s += polyRing(pts);
      const c1 = pts[0];
      s += num(c1.x + 15, c1.y - 3, '1');
      if (i < 2) {
        const cx2 = P(cx, c1.y - 38);
        s += sk(c1, cx2, true);
        if (i === 0) {
          s += hang(cx2, P(cx - 32, cx2.y - 20), 'O', { order: 2, cls: 'fg-bond-hi' });
          s += hang(cx2, P(cx + 32, cx2.y - 20), 'OH', { cls: 'fg-bond-hi' });
        } else {
          s += hang(cx2, P(cx + 32, cx2.y - 20), 'O', { order: 2, cls: 'fg-bond-hi' });
          s += hang(cx2, P(cx - 32, cx2.y - 20), 'H', { cls: 'fg-bond-hi' });
        }
        s += sm(cx - 10, cx2.y + 34, 'not a ring C', 'end');
        s += bond(P(cx - 22, cx2.y + 22), P(cx - 5, cx2.y + 4), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
      } else if (i === 2) {
        s += hang(c1, P(cx, c1.y - 40), 'O', { order: 2, kind: 'hi' });
      } else {
        s += hang(c1, P(cx, c1.y - 40), 'OH', { kind: 'hi' });
      }
      s += text(cx, 252, nm, { cls: 'fg-tag-good', size: 11 });
      s += sm(cx, 272, notes[i]);
    });
    return s;
  },
  caption: 'In every ring the carbon marked 1 is the ring carbon that carries the group. In the two shaded panels the group has a carbon of its own, drawn outside the ring. That carbon is not counted in the ring.',
});

/* ------------------------------------------------------------------ 7 ---
   The worked example: 4-bromo-3-oxopentanoic acid, numbered. */
FIGURES.push({
  id: 'keto-acid',
  section: 'naming-functional-groups',
  anchor: 'Worked example — three groups, one name',
  alt: '4-bromo-3-oxopentanoic acid drawn as a five-carbon chain numbered 1 to 5 from the acid carbon. C1 carries a double-bonded O and an OH, C3 carries a double-bonded O, and C4 carries a Br.',
  viewBox: '0 0 720 240',
  build() {
    let s = '';
    s += panel(12, 20, 696, 196);
    const r = zig(100, 140, 5, 40, 24);
    s += chain(r);
    s += hang(r[0], P(r[0].x, r[0].y + 40), 'O', { order: 2, kind: 'hi' });
    s += hang(r[0], P(r[0].x - 34, r[0].y - 20), 'HO', { kind: 'hi' });
    s += hang(r[2], P(r[2].x, r[2].y + 40), 'O', { order: 2 });
    s += hang(r[3], P(r[3].x, r[3].y - 40), 'Br');
    s += num(r[0].x + 17, r[0].y + 18, '1') + at(r[1], '2', 'above') + num(r[2].x, r[2].y - 8, '3');
    s += at(r[3], '4', 'below') + at(r[4], '5', 'below');
    s += sm(330, 70, 'rank: acid beats ketone; Br is only ever a prefix', 'start');
    s += sm(330, 96, 'number: the acid carbon is C1', 'start');
    s += sm(330, 122, 'assemble: bromo before oxo, suffix last', 'start');
    s += rule(330, 142, 690, 142);
    s += good(330, 172, '4-bromo-3-oxopentanoic acid', 'start');
    s += sm(330, 194, 'the ketone appears only as oxo-', 'start');
    return s;
  },
  caption: 'The acid (highlighted) wins, so its carbon is C1. The ketone oxygen on C3 and the bromine on C4 become prefixes.',
});

/* ------------------------------------------------------------------ 8 ---
   Decoding a name, in the order the name is read: suffix, root, prefix. */
FIGURES.push({
  id: 'decode-hydroxybutanal',
  section: 'naming-functional-groups',
  anchor: 'Worked example — draw 3-hydroxybutanal',
  alt: 'Three stages of drawing 3-hydroxybutanal. Stage 1: the suffix -al, so a CHO carbon is drawn as C1. Stage 2: the root butan, so a four-carbon chain is drawn from C1 and numbered 1 to 4. Stage 3: 3-hydroxy, so an OH goes on C3.',
  viewBox: '0 0 720 262',
  build() {
    let s = '';
    const stages = ['1. suffix -al: C1 is a CHO', '2. root butan: four carbons', '3. 3-hydroxy: OH on C3'];
    const foot = ['draw the group first', 'number away from the CHO', '3-hydroxybutanal'];
    stages.forEach((st, i) => {
      const px = 6 + i * 238, x0 = px + 64;
      s += panel(px, 40, 228, 176, { kind: i === 2 ? 'good' : 'hi' });
      s += tag(px + 114, 28, st);
      const p = zig(x0, 146, 4, 40, 24);
      s += hang(p[0], P(p[0].x, p[0].y + 40), 'O', { order: 2 });
      s += hang(p[0], P(p[0].x - 32, p[0].y - 18), 'H');
      s += num(p[0].x + 16, p[0].y + 18, '1');
      if (i === 0) {
        s += bond(p[0], p[1], { rFrom: 0, rTo: 0, cls: 'fg-dash' });
        s += sm(p[1].x + 6, p[1].y - 6, 'chain goes here', 'start');
      } else {
        s += chain(p);
        s += at(p[1], '2', 'above') + num(p[2].x, p[2].y - 8, '3') + at(p[3], '4', 'above');
      }
      if (i === 2) s += hang(p[2], P(p[2].x, p[2].y + 40), 'OH', { kind: 'hi' });
      s += i === 2 ? good(px + 114, 242, foot[i]) : sm(px + 114, 242, foot[i]);
    });
    return s;
  },
  caption: 'Read the name from the end. The suffix places the CHO at C1, the root sets the chain length, and only then does the prefix land on its carbon.',
});

/* ------------------------------------------------------------------ 9 ---
   The retained names, drawn. */
FIGURES.push({
  id: 'retained-names',
  section: 'naming-functional-groups',
  anchor: '<h3>The common names that never went away</h3>',
  alt: 'Ten structures with their retained names: formic acid, acetic acid, formaldehyde, acetaldehyde, acetone, benzoic acid, phenol, aniline, toluene and styrene, each with its systematic name beneath.',
  viewBox: '0 0 720 412',
  build() {
    let s = '';
    const acyl = (cx, cy, left, X) => {
      const C = P(cx, cy + 6);
      let t = hang(C, P(cx, cy - 30), 'O', { order: 2 });
      t += left === 'CH3' ? sk(P(cx - 32, cy + 24), C) : hang(C, P(cx - 32, cy + 24), 'H');
      t += X === 'CH3' ? sk(C, P(cx + 32, cy + 24)) : hang(C, P(cx + 32, cy + 24), X);
      return t;
    };
    const ring = (cx, cy) => benzene(cx, cy + 36, 24);
    const items = [
      ['formic acid', 'methanoic acid', (cx, cy) => acyl(cx, cy, 'H', 'OH')],
      ['acetic acid', 'ethanoic acid', (cx, cy) => acyl(cx, cy, 'CH3', 'OH')],
      ['formaldehyde', 'methanal', (cx, cy) => acyl(cx, cy, 'H', 'H')],
      ['acetaldehyde', 'ethanal', (cx, cy) => acyl(cx, cy, 'CH3', 'H')],
      ['acetone', 'propan-2-one', (cx, cy) => acyl(cx, cy, 'CH3', 'CH3')],
      ['benzoic acid', 'no other name used', (cx, cy) => {
        const b = ring(cx, cy); const top = b.pts[0]; const C = P(cx, top.y - 30);
        return b.svg + sk(top, C) + hang(C, P(cx - 28, C.y - 18), 'O', { order: 2 }) + hang(C, P(cx + 28, C.y - 18), 'OH');
      }],
      ['phenol', 'no other name used', (cx, cy) => { const b = ring(cx, cy); return b.svg + hang(b.pts[0], P(cx, b.pts[0].y - 36), 'OH'); }],
      ['aniline', 'benzenamine (rare)', (cx, cy) => { const b = ring(cx, cy); return b.svg + hang(b.pts[0], P(cx, b.pts[0].y - 36), 'NH₂', { r: 16 }); }],
      ['toluene', 'methylbenzene', (cx, cy) => { const b = ring(cx, cy); return b.svg + sk(b.pts[0], P(cx, b.pts[0].y - 32)); }],
      ['styrene', 'ethenylbenzene', (cx, cy) => {
        const b = ring(cx, cy); const v = P(cx, b.pts[0].y - 30), e = P(cx + 28, v.y - 16);
        return b.svg + sk(b.pts[0], v) + bond(v, e, { order: 2, rFrom: 0, rTo: 0, gap: 3.5 });
      }],
    ];
    items.forEach(([common, sys, draw], i) => {
      const px = 8 + (i % 5) * 142, py = 10 + Math.floor(i / 5) * 204, cx = px + 68;
      s += panel(px, py, 136, 194);
      s += draw(cx, py + 76);
      s += text(cx, py + 166, common, { cls: 'fg-lbl', size: 12 });
      s += sm(cx, py + 184, sys);
    });
    return s;
  },
  caption: 'The common name is in bold. The systematic name, where one is in use, is under it.',
});

/* ------------------------------------------------ lesson-only figures ---
   Question figures carry no answer: no locants and no names. */

FIGURES.push({
  id: 'rank-drill',
  lessons: ['naming-functional-groups'],
  alt: 'Three molecules. A: a five-carbon chain with a C=O on its second carbon and an OH on its fourth. B: a five-carbon chain with a C=O on its second carbon and a COOH at the other end. C: a CH3–O–CH2–CH2–NH2 chain.',
  viewBox: '0 0 340 460',
  build() {
    let s = '';
    ['A', 'B', 'C'].forEach((L, i) => {
      const py = 10 + i * 150, cx = 196;
      s += panel(10, py, 320, 140);
      s += text(24, py + 26, 'Molecule ' + L, { cls: 'fg-lbl', anchor: 'start' });
      if (i === 0) {
        const p = zig(cx - 68, py + 100, 5, 34, 22);
        s += chain(p) + hang(p[1], P(p[1].x, p[1].y - 38), 'O', { order: 2 }) + hang(p[3], P(p[3].x, p[3].y - 38), 'OH');
      } else if (i === 1) {
        const p = zig(cx - 84, py + 86, 5, 34, 22);
        s += chain(p) + hang(p[1], P(p[1].x, p[1].y - 38), 'O', { order: 2 });
        s += hang(p[4], P(p[4].x, p[4].y + 34), 'O', { order: 2 }) + hang(p[4], P(p[4].x + 34, p[4].y - 22), 'OH');
      } else {
        const p = zig(cx - 68, py + 90, 5, 34, 22);
        s += bond(p[0], p[1], { rFrom: 0, rTo: 15 }) + atom(p[1].x, p[1].y, 'O');
        s += bond(p[1], p[2], { rFrom: 15, rTo: 0 }) + sk(p[2], p[3]);
        s += hang(p[3], p[4], 'NH₂', { r: 16 });
      }
    });
    return s;
  },
  caption: 'Each molecule carries two functional groups. Find both in the drawing before you choose.',
});

FIGURES.push({
  id: 'q-numbering',
  lessons: ['naming-functional-groups'],
  alt: 'A five-carbon zigzag chain. The second carbon from the left carries a one-carbon branch pointing up; the fourth carbon from the left carries an OH pointing up.',
  viewBox: '0 0 340 170',
  build() {
    const p = zig(90, 140, 5, 40, 24);
    return panel(10, 10, 320, 150) + chain(p) + sk(p[1], P(p[1].x, p[1].y - 40)) +
      hang(p[3], P(p[3].x, p[3].y - 40), 'OH');
  },
  caption: 'Name this alcohol. Decide which end is C1 before you count anything else.',
});

FIGURES.push({
  id: 'q-parent',
  lessons: ['naming-functional-groups'],
  alt: 'A seven-carbon zigzag chain. Its middle carbon carries a CH2 branch pointing up, and that CH2 carries an OH.',
  viewBox: '0 0 340 200',
  build() {
    const p = zig(50, 170, 7, 40, 24);
    const b1 = P(p[3].x, p[3].y - 40);
    return panel(10, 10, 320, 180) + chain(p) + sk(p[3], b1) + hang(b1, P(b1.x + 34, b1.y - 20), 'OH');
  },
  caption: 'Find the longest chain, then find the longest chain that contains the carbon carrying the OH.',
});

FIGURES.push({
  id: 'q-keto-acid',
  lessons: ['naming-functional-groups'],
  alt: 'A five-carbon zigzag chain. The left end carbon carries a double-bonded O and an OH. The third carbon carries a double-bonded O. The fourth carbon carries a Br.',
  viewBox: '0 0 340 200',
  build() {
    const r = zig(90, 120, 5, 40, 24);
    return panel(10, 10, 320, 180) + chain(r) +
      hang(r[0], P(r[0].x, r[0].y + 40), 'O', { order: 2 }) + hang(r[0], P(r[0].x - 34, r[0].y - 20), 'HO') +
      hang(r[2], P(r[2].x, r[2].y + 40), 'O', { order: 2 }) + hang(r[3], P(r[3].x, r[3].y - 40), 'Br');
  },
  caption: 'Three groups on one chain. Rank them first.',
});

FIGURES.push({
  id: 'oxo-worked',
  lessons: ['naming-functional-groups'],
  alt: '3-oxobutanoic acid: a four-carbon chain numbered 1 to 4 from the acid carbon, with a double-bonded O and an OH on C1 and a double-bonded O on C3.',
  viewBox: '0 0 340 230',
  build() {
    let s = panel(10, 10, 320, 210);
    const r = zig(90, 120, 4, 40, 24);
    s += chain(r);
    s += hang(r[0], P(r[0].x, r[0].y + 40), 'O', { order: 2, kind: 'hi' }) + hang(r[0], P(r[0].x - 34, r[0].y - 20), 'HO', { kind: 'hi' });
    s += hang(r[2], P(r[2].x, r[2].y + 40), 'O', { order: 2 });
    s += num(r[0].x + 17, r[0].y + 18, '1') + at(r[1], '2', 'above') + num(r[2].x, r[2].y - 8, '3') + at(r[3], '4', 'above');
    s += sm(r[2].x + 22, r[2].y + 44, 'oxo- on C3', 'start');
    s += good(170, 204, '3-oxobutanoic acid');
    return s;
  },
  caption: 'The acid (highlighted) takes the suffix and C1. The ketone oxygen on C3 is named <b>oxo-</b>.',
});

FIGURES.push({
  id: 'q-decode',
  lessons: ['naming-functional-groups'],
  alt: 'Four candidate structures. A: an aldehyde on a five-carbon chain with an OH on the carbon next to the CHO. B: a five-carbon chain with a C=O on its second carbon and an OH on the far end carbon. C: an aldehyde on a five-carbon chain with an OH on the fourth carbon counting from the CHO carbon. D: an aldehyde on a four-carbon chain with an OH on the far end carbon.',
  viewBox: '0 0 340 364',
  build() {
    let s = '';
    const cho = (p0) => hang(p0, P(p0.x, p0.y + 34), 'O', { order: 2 }) + hang(p0, P(p0.x - 26, p0.y - 18), 'H');
    ['A', 'B', 'C', 'D'].forEach((L, i) => {
      const px = 6 + (i % 2) * 166, py = 10 + Math.floor(i / 2) * 176;
      s += panel(px, py, 162, 166);
      s += tag(px + 81, py + 20, 'Structure ' + L);
      const y = py + 112;
      if (i === 0) {            // 2-hydroxypentanal
        const p = zig(px + 44, y, 5, 26, 18);
        s += chain(p) + cho(p[0]) + hang(p[1], P(p[1].x, p[1].y - 36), 'OH');
      } else if (i === 1) {     // 5-hydroxypentan-2-one
        const p = zig(px + 20, y, 5, 24, 18);
        s += chain(p) + hang(p[1], P(p[1].x, p[1].y - 36), 'O', { order: 2 }) + hang(p[4], P(p[4].x + 24, p[4].y - 18), 'OH');
      } else if (i === 2) {     // 4-hydroxypentanal
        const p = zig(px + 44, y, 5, 26, 18);
        s += chain(p) + cho(p[0]) + hang(p[3], P(p[3].x, p[3].y - 36), 'OH');
      } else {                  // 4-hydroxybutanal
        const p = zig(px + 44, y, 4, 26, 18);
        s += chain(p) + cho(p[0]) + hang(p[3], P(p[3].x, p[3].y - 36), 'OH');
      }
    });
    return s;
  },
  caption: 'Four drawings, one of them right. Decode the name from its suffix before you look for a match.',
});

/* ------------------------------------------ lesson copies, phone width ---
   The notes figures are drawn 720 wide for the reading column. A lesson card
   on a phone has about 316 px for a drawing, so the lesson gets its own
   stacked versions, 340 wide, of the same molecules. */

FIGURES.push({
  id: 'l-suffix-or-prefix',
  lessons: ['naming-functional-groups'],
  alt: 'Top: butan-2-ol, a four-carbon chain numbered 1 to 4 with an OH on C2. Bottom: 4-hydroxybutan-2-one, a four-carbon chain with a C=O on C2 and an OH on C4, named hydroxy-.',
  viewBox: '0 0 340 420',
  build() {
    let s = '';
    let py = 10;
    s += panel(10, py, 320, 196, { kind: 'hi' });
    s += tag(170, py + 22, 'one group: it takes the suffix');
    {
      const p = zig(110, py + 118, 4, 40, 24);
      s += chain(p) + hang(p[1], P(p[1].x, p[1].y - 40), 'OH', { kind: 'hi' });
      s += at(p[0], '1', 'below') + at(p[1], '2', 'below') + at(p[2], '3', 'below') + at(p[3], '4', 'above');
      s += good(170, py + 168, 'butan-2-ol');
      s += sm(170, py + 186, 'the OH is the suffix -ol');
    }
    py = 216;
    s += panel(10, py, 320, 196, { kind: 'hi' });
    s += tag(170, py + 22, 'two groups: the ketone wins');
    {
      const p = zig(90, py + 118, 4, 40, 24);
      s += chain(p) + hang(p[1], P(p[1].x, p[1].y - 40), 'O', { order: 2, kind: 'hi' });
      s += hang(p[3], P(p[3].x + 40, p[3].y + 24), 'OH');
      s += sm(272, py + 122, 'hydroxy-', 'start');
      s += at(p[0], '1', 'below') + at(p[1], '2', 'below') + at(p[2], '3', 'below') + at(p[3], '4', 'above');
      s += good(170, py + 168, '4-hydroxybutan-2-one');
      s += sm(170, py + 186, 'suffix -one; the OH is a prefix');
    }
    return s;
  },
  caption: 'Find the OH in each drawing, then read its name below.',
});

FIGURES.push({
  id: 'l-fragments',
  lessons: ['naming-functional-groups'],
  alt: 'Twelve skeletal fragments in priority order, three per row: carboxylic acid, anhydride, ester; acyl chloride, amide, nitrile; aldehyde, ketone, alcohol; amine, then alkene and alkyne, which are not on the list. Each shows the suffix it takes.',
  viewBox: '0 0 340 680',
  build() {
    let s = '';
    const acyl = (cx, cy, X) => {
      const C = P(cx - 8, cy + 6), O = P(cx - 8, cy - 30), Xp = P(cx + 26, cy + 24), R = P(cx - 40, cy + 24);
      return sk(R, C) + hang(C, O, 'O', { order: 2 }) + hang(C, Xp, X, { kind: 'hi', r: X.length > 2 ? 16 : 15 });
    };
    const groups = [
      [['carboxylic', 'acid'], '-oic acid', (cx, cy) => acyl(cx, cy, 'OH')],
      [['anhydride'], '-oic anhydride', (cx, cy) => {
        const C1 = P(cx - 22, cy + 4), C2 = P(cx + 22, cy + 4), Ob = P(cx, cy + 22);
        return sk(P(cx - 44, cy + 22), C1) + sk(C2, P(cx + 44, cy + 22)) +
          hang(C1, P(C1.x, cy - 30), 'O', { order: 2 }) + hang(C2, P(C2.x, cy - 30), 'O', { order: 2 }) +
          bond(C1, Ob, { rFrom: 0, rTo: 15 }) + bond(Ob, C2, { rFrom: 15, rTo: 0 }) + atom(Ob.x, Ob.y, 'O', { kind: 'hi' });
      }],
      [['ester'], 'alkyl …-oate', (cx, cy) => acyl(cx, cy, 'OR′')],
      [['acyl', 'chloride'], '-oyl chloride', (cx, cy) => acyl(cx, cy, 'Cl')],
      [['amide'], '-amide', (cx, cy) => acyl(cx, cy, 'NH₂')],
      [['nitrile'], '-nitrile', (cx, cy) => sk(P(cx - 42, cy + 4), P(cx - 10, cy + 4)) + hang(P(cx - 10, cy + 4), P(cx + 28, cy + 4), 'N', { order: 3, kind: 'hi' })],
      [['aldehyde'], '-al', (cx, cy) => acyl(cx, cy, 'H')],
      [['ketone'], '-one', (cx, cy) => { const C = P(cx, cy + 6); return sk(P(cx - 32, cy + 24), C) + sk(C, P(cx + 32, cy + 24)) + hang(C, P(cx, cy - 30), 'O', { order: 2, kind: 'hi' }); }],
      [['alcohol'], '-ol', (cx, cy) => { const C = P(cx - 10, cy + 2); return sk(P(cx - 40, cy + 20), C) + hang(C, P(cx + 26, cy + 20), 'OH', { kind: 'hi' }); }],
      [['amine'], '-amine', (cx, cy) => { const C = P(cx - 10, cy + 2); return sk(P(cx - 40, cy + 20), C) + hang(C, P(cx + 26, cy + 20), 'NH₂', { kind: 'hi', r: 16 }); }],
      [['alkene'], 'not on list', (cx, cy) => sk(P(cx - 40, cy + 16), P(cx - 13, cy - 2)) + bond(P(cx - 13, cy - 2), P(cx + 13, cy + 16), { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.5 }) + sk(P(cx + 13, cy + 16), P(cx + 40, cy - 2)), true],
      [['alkyne'], 'not on list', (cx, cy) => sk(P(cx - 42, cy + 6), P(cx - 15, cy + 6)) + bond(P(cx - 15, cy + 6), P(cx + 15, cy + 6), { order: 3, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.2 }) + sk(P(cx + 15, cy + 6), P(cx + 42, cy + 6)), true],
    ];
    groups.forEach(([name, suffix, draw, mut], i) => {
      const px = 8 + (i % 3) * 110, py = 8 + Math.floor(i / 3) * 168, cx = px + 52;
      s += panel(px, py, 104, 162, { kind: i < 6 ? 'hi' : undefined });
      s += text(cx, py + 20, name[0], { cls: 'fg-lbl' });
      if (name[1]) s += text(cx, py + 36, name[1], { cls: 'fg-lbl' });
      s += draw(cx, py + 92);
      s += text(cx, py + 154, suffix, { cls: mut ? 'fg-tag-mut' : 'fg-tag-good' });
    });
    return s;
  },
  caption: 'Priority falls left to right, row by row, as far as the amine. The shaded panels are the acid and its derivatives. The alkene and alkyne are not on the list.',
});

FIGURES.push({
  id: 'l-locant',
  lessons: ['naming-functional-groups'],
  alt: 'The same six-carbon chain numbered from each end. Top, from the OH end: OH on C2, methyl on C5, 5-methylhexan-2-ol, correct. Bottom, from the methyl end: 2-methylhexan-5-ol, wrong.',
  viewBox: '0 0 340 430',
  build() {
    let s = '';
    const draw = (py, nums) => {
      const p = zig(70, py + 110, 6, 40, 24);
      let t = chain(p) + hang(p[1], P(p[1].x, p[1].y - 40), 'OH', { kind: 'hi' });
      t += sk(p[4], P(p[4].x, p[4].y + 40)) + sm(p[4].x + 8, p[4].y + 38, 'methyl', 'start');
      const where = ['below', 'below', 'below', 'above', 'above', 'above'];
      p.forEach((q, i) => { t += at(q, nums[i], where[i]); });
      return t;
    };
    s += panel(10, 10, 320, 200, { kind: 'good' });
    s += tag(170, 32, 'numbered from the OH end');
    s += draw(10, ['1', '2', '3', '4', '5', '6']);
    s += good(170, 184, '5-methylhexan-2-ol');
    s += sm(170, 202, 'the OH gets the low number');
    s += panel(10, 220, 320, 200, { kind: 'warn' });
    s += tag(170, 242, 'numbered from the methyl end');
    s += draw(220, ['6', '5', '4', '3', '2', '1']);
    s += warn(170, 394, '2-methylhexan-5-ol  ✗');
    s += sm(170, 412, 'the methyl took the OH’s 2');
    return s;
  },
  caption: 'One molecule, numbered from each end. Follow the OH.',
});

FIGURES.push({
  id: 'l-parent',
  lessons: ['naming-functional-groups'],
  alt: 'One alcohol traced twice. Top: the six-carbon chain, numbered 1 to 6, misses the CH2OH branch on C3: 3-(hydroxymethyl)hexane, wrong. Bottom: the five-carbon chain through the CH2OH carbon, numbered 1 to 5 from it, with an ethyl on C2: 2-ethylpentan-1-ol, correct.',
  viewBox: '0 0 340 442',
  build() {
    let s = '';
    const skel = (py) => {
      const a = zig(70, py + 80, 6, 40, 24);
      return { a, b1: P(a[2].x, a[2].y + 40), oh: P(a[2].x + 34, a[2].y + 60) };
    };
    {
      const py = 10; const { a, b1, oh } = skel(py);
      s += panel(10, py, 320, 206, { kind: 'warn' });
      s += tag(170, py + 22, 'the longest chain: six carbons');
      s += chain(a, true) + sk(a[2], b1) + hang(b1, oh, 'OH');
      s += at(a[0], '1', 'below') + at(a[1], '2', 'above') + at(a[2], '3', 'above') + at(a[3], '4', 'above') + at(a[4], '5', 'below') + at(a[5], '6', 'above');
      s += sm(oh.x + 20, oh.y + 4, 'off the chain', 'start');
      s += warn(170, py + 180, '3-(hydroxymethyl)hexane  ✗');
      s += sm(170, py + 198, 'the alcohol became a prefix');
    }
    {
      const py = 226; const { a, b1, oh } = skel(py);
      s += panel(10, py, 320, 206, { kind: 'good' });
      s += tag(170, py + 22, 'the longest chain through the OH');
      s += sk(a[0], a[1]) + sk(a[1], a[2]) + sk(b1, a[2], true) + chain(a.slice(2), true);
      s += bond(b1, oh, { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' }) + atom(oh.x, oh.y, 'OH', { kind: 'hi' });
      s += num(b1.x - 12, b1.y + 5, '1') + at(a[2], '2', 'above') + at(a[3], '3', 'above') + at(a[4], '4', 'below') + at(a[5], '5', 'above');
      s += sm(a[0].x + 14, a[1].y - 12, 'ethyl');
      s += good(170, py + 180, '2-ethylpentan-1-ol');
      s += sm(170, py + 198, 'the alcohol takes the suffix, and C1');
    }
    return s;
  },
  caption: 'One molecule, traced two ways. Only the bottom chain contains the carbon that carries the OH.',
});

FIGURES.push({
  id: 'l-decode',
  lessons: ['naming-functional-groups'],
  alt: 'Three stages of drawing 3-hydroxybutanal: a CHO drawn as C1; a four-carbon chain numbered 1 to 4 from it; an OH added on C3.',
  viewBox: '0 0 340 486',
  build() {
    let s = '';
    const stages = ['1. suffix -al: C1 is a CHO', '2. root butan: four carbons', '3. 3-hydroxy: OH on C3'];
    stages.forEach((st, i) => {
      const py = 10 + i * 150;
      s += panel(10, py, 320, 140, { kind: i === 2 ? 'good' : 'hi' });
      s += tag(170, py + 22, st);
      const p = zig(110, py + 80, 4, 40, 24);
      s += hang(p[0], P(p[0].x, p[0].y + 40), 'O', { order: 2 }) + hang(p[0], P(p[0].x - 32, p[0].y - 18), 'H');
      s += num(p[0].x + 16, p[0].y + 18, '1');
      if (i === 0) {
        s += bond(p[0], p[1], { rFrom: 0, rTo: 0, cls: 'fg-dash' }) + sm(p[1].x + 6, p[1].y - 6, 'chain goes here', 'start');
      } else {
        s += chain(p) + at(p[1], '2', 'above') + num(p[2].x, p[2].y - 8, '3') + at(p[3], '4', 'above');
      }
      if (i === 2) s += hang(p[2], P(p[2].x, p[2].y + 40), 'OH', { kind: 'hi' });
    });
    s += good(170, 474, '3-hydroxybutanal');
    return s;
  },
  caption: 'Read the name from the end: suffix, then root, then prefix.',
});

FIGURES.push({
  id: 'l-retained',
  lessons: ['naming-functional-groups'],
  alt: 'Ten structures with their retained names: formic acid, acetic acid, formaldehyde, acetaldehyde, acetone, benzoic acid, phenol, aniline, toluene and styrene, each with its systematic name beneath.',
  viewBox: '0 0 340 888',
  build() {
    let s = '';
    const acyl = (cx, cy, left, X) => {
      const C = P(cx, cy + 6);
      let t = hang(C, P(cx, cy - 30), 'O', { order: 2 });
      t += left === 'CH3' ? sk(P(cx - 32, cy + 24), C) : hang(C, P(cx - 32, cy + 24), 'H');
      t += X === 'CH3' ? sk(C, P(cx + 32, cy + 24)) : hang(C, P(cx + 32, cy + 24), X);
      return t;
    };
    const ring = (cx, cy) => benzene(cx, cy + 36, 24);
    const items = [
      ['formic acid', 'methanoic acid', (cx, cy) => acyl(cx, cy, 'H', 'OH')],
      ['acetic acid', 'ethanoic acid', (cx, cy) => acyl(cx, cy, 'CH3', 'OH')],
      ['formaldehyde', 'methanal', (cx, cy) => acyl(cx, cy, 'H', 'H')],
      ['acetaldehyde', 'ethanal', (cx, cy) => acyl(cx, cy, 'CH3', 'H')],
      ['acetone', 'propan-2-one', (cx, cy) => acyl(cx, cy, 'CH3', 'CH3')],
      ['benzoic acid', 'no other name used', (cx, cy) => {
        const b = ring(cx, cy); const C = P(cx, b.pts[0].y - 30);
        return b.svg + sk(b.pts[0], C) + hang(C, P(cx - 28, C.y - 18), 'O', { order: 2 }) + hang(C, P(cx + 28, C.y - 18), 'OH');
      }],
      ['phenol', 'no other name used', (cx, cy) => { const b = ring(cx, cy); return b.svg + hang(b.pts[0], P(cx, b.pts[0].y - 36), 'OH'); }],
      ['aniline', 'benzenamine (rare)', (cx, cy) => { const b = ring(cx, cy); return b.svg + hang(b.pts[0], P(cx, b.pts[0].y - 36), 'NH₂', { r: 16 }); }],
      ['toluene', 'methylbenzene', (cx, cy) => { const b = ring(cx, cy); return b.svg + sk(b.pts[0], P(cx, b.pts[0].y - 32)); }],
      ['styrene', 'ethenylbenzene', (cx, cy) => {
        const b = ring(cx, cy); const v = P(cx, b.pts[0].y - 30), e = P(cx + 28, v.y - 16);
        return b.svg + sk(b.pts[0], v) + bond(v, e, { order: 2, rFrom: 0, rTo: 0, gap: 3.5 });
      }],
    ];
    items.forEach(([common, sys, draw], i) => {
      const px = 8 + (i % 2) * 164, py = 8 + Math.floor(i / 2) * 176, cx = px + 79;
      s += panel(px, py, 158, 168);
      s += draw(cx, py + 66);
      s += text(cx, py + 144, common, { cls: 'fg-lbl' });
      s += sm(cx, py + 161, sys);
    });
    return s;
  },
  caption: 'The common name is in bold. The systematic name, where one is in use, is under it.',
});

export default FIGURES;
