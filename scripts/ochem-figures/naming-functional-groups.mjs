/* Figures for the naming-functional-groups notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ A3 ---
   "Priority beats length" is stated in one sentence and is the hardest
   consequence of the priority order to believe, because it asks the reader
   to reject the longest chain after having spent a whole section learning
   to find it. Two traces of one molecule settle it. */
FIGURES.push({
  id: 'parent-must-contain',
  section: 'naming-functional-groups',
  anchor: '<h3>The common names that never went away</h3>',
  alt: 'One alcohol traced twice: the six-carbon chain that misses the OH, and the five-carbon chain through it that is the real parent',
  viewBox: '0 0 760 390',
  build() {
    let s = '';
    const skeleton = (ox, traced, nums, extra, extraAnchor = 'middle') => {
      const a = [P(ox + 50, 174), P(ox + 86, 152), P(ox + 122, 174), P(ox + 158, 152), P(ox + 194, 174), P(ox + 230, 152)];
      const b1 = P(ox + 122, 216), oh = P(ox + 122, 258);
      const links = [
        ['a0', a[0], a[1]], ['a1', a[1], a[2]], ['a2', a[2], a[3]], ['a3', a[3], a[4]], ['a4', a[4], a[5]],
        ['br', a[2], b1],
      ];
      let t = '';
      for (const [, p, q] of links) t += bond(p, q, { rFrom: 0, rTo: 0 });
      for (const [k, p, q] of links) {
        if (traced.includes(k)) t += bond(p, q, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
      }
      // The OH is drawn on both sides; it is the same molecule twice.
      t += bond(b1, oh, { rFrom: 0, rTo: 15, cls: traced.includes('oh') ? 'fg-bond-hi' : 'fg-bond' });
      t += atom(oh.x, oh.y, 'OH', { kind: traced.includes('oh') ? 'hi' : 'plain' });
      for (const [x, y, v] of nums) t += text(ox + x, y, v, { cls: 'fg-lbl', size: 11 });
      for (const [x, y, v] of extra) t += text(ox + x, y, v, { cls: 'fg-sm', size: 9.5, anchor: extraAnchor });
      return t;
    };

    /* Both panels sit inside the left 90% of the canvas: the right-hand one
       carries the answer, and past that the reading column has scrolled it
       off. The OH note is anchored to the right of its own disc rather than
       centered over it, which is what had it sitting on the label. */
    s += panel(20, 64, 300, 224, { kind: 'warn' });
    s += tag(170, 52, 'the longest chain in the molecule');
    s += skeleton(26, ['a0', 'a1', 'a2', 'a3', 'a4'],
      [[50, 130, '1'], [86, 130, '2'], [122, 130, '3'], [158, 130, '4'], [194, 130, '5'], [230, 130, '6']],
      [[144, 250, 'the OH is off the chain']], 'start');

    s += panel(370, 64, 300, 224, { kind: 'hi' });
    s += tag(520, 52, 'the longest chain through the OH');
    s += skeleton(376, ['br', 'a2', 'a3', 'a4', 'oh'],
      [[122, 130, '2'], [158, 130, '3'], [194, 130, '4'], [230, 130, '5'], [96, 220, '1']],
      [[68, 130, 'ethyl']]);

    s += rule(20, 300, 670, 300);
    s += text(170, 322, 'six carbons \u2014 the longest path there is', { cls: 'fg-sm', size: 10 });
    s += text(170, 344, '3-(hydroxymethyl)hexane', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(170, 364, 'demotes the alcohol to a prefix, which is not allowed', { cls: 'fg-sm', size: 9.5 });
    s += text(520, 322, 'five carbons \u2014 shorter, and it contains the OH', { cls: 'fg-sm', size: 10 });
    s += text(520, 344, '2-ethylpentan-1-ol', { cls: 'fg-tag-good', size: 11.5 });
    s += text(520, 364, 'the alcohol takes the suffix and C1', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'One molecule, two candidate parents. The six-carbon chain on the left is genuinely the longest path through the skeleton and it is still the wrong parent, because it does not pass through the carbon carrying the \u2013OH.',
  note: 'The left-hand name is not a typo; it is what you get by applying the previous section\u2019s rule and nothing else, and the alcohol ends up as a <i>hydroxymethyl</i> prefix (a \u2013CH\u2082OH treated as a branch and named the way the previous section named (2-methylpropyl)). That is the tell. If the highest-priority group in your molecule has turned into a prefix and there was no group above it, you picked the parent chain before you ranked the groups.',
});

/* ---------------------------------------------------------------- N4 ---
   The priority list as fragments. The section ranks ten groups by name and
   never shows one; a student who has to decide "which of these two is the
   suffix" from a drawing has to be able to see the group first. */
FIGURES.push({
  id: 'principal-group-fragments',
  section: 'naming-functional-groups',
  anchor: 'the three groups on the second line cannot be suffixes at all.</p>',
  alt: 'Ten skeletal fragments in priority order, five per row, each with the suffix it takes: carboxylic acid (-oic acid), ester (-oate), amide (-amide), nitrile (-nitrile), aldehyde (-al), ketone (-one), alcohol (-ol), amine (-amine), alkene (-ene), alkyne (-yne).',
  viewBox: '0 0 720 372',
  build() {
    let s = '';
    const acyl = (cx, cy, X) => {
      const C = P(cx - 8, cy + 6), O = P(cx - 8, cy - 30), Xp = P(cx + 26, cy + 24), R = P(cx - 40, cy + 24);
      return sk(R, C) + bond(C, O, { order: 2, rFrom: 0, rTo: 15 }) + atom(O.x, O.y, 'O') +
             bond(C, Xp, { rFrom: 0, rTo: 15 }) + atom(Xp.x, Xp.y, X, { kind: 'hi' });
    };
    const groups = [
      { name: 'carboxylic acid', suffix: '-oic acid', draw: (cx, cy) => acyl(cx, cy, 'OH') },
      { name: 'ester', suffix: 'alkyl …-oate', draw: (cx, cy) => acyl(cx, cy, 'OR′') },
      { name: 'amide', suffix: '-amide', draw: (cx, cy) => acyl(cx, cy, 'NH₂') },
      { name: 'nitrile', suffix: '-nitrile', draw(cx, cy) {
        const R = P(cx - 44, cy + 4), C = P(cx - 10, cy + 4), N = P(cx + 30, cy + 4);
        return sk(R, C) + bond(C, N, { order: 3, rFrom: 0, rTo: 15 }) + atom(N.x, N.y, 'N', { kind: 'hi' });
      } },
      { name: 'aldehyde', suffix: '-al', draw: (cx, cy) => acyl(cx, cy, 'H') },
      { name: 'ketone', suffix: '-one', draw(cx, cy) {
        const C = P(cx, cy + 6), O = P(cx, cy - 30), R1 = P(cx - 32, cy + 24), R2 = P(cx + 32, cy + 24);
        return sk(R1, C) + sk(C, R2) + bond(C, O, { order: 2, rFrom: 0, rTo: 15 }) + atom(O.x, O.y, 'O', { kind: 'hi' });
      } },
      { name: 'alcohol', suffix: '-ol', draw(cx, cy) {
        const R = P(cx - 40, cy + 20), C = P(cx - 10, cy + 2), X = P(cx + 26, cy + 20);
        return sk(R, C) + bond(C, X, { rFrom: 0, rTo: 15 }) + atom(X.x, X.y, 'OH', { kind: 'hi' });
      } },
      { name: 'amine', suffix: '-amine', draw(cx, cy) {
        const R = P(cx - 40, cy + 20), C = P(cx - 10, cy + 2), X = P(cx + 26, cy + 20);
        return sk(R, C) + bond(C, X, { rFrom: 0, rTo: 15 }) + atom(X.x, X.y, 'NH₂', { kind: 'hi' });
      } },
      { name: 'alkene', suffix: '-ene', draw(cx, cy) {
        const a = P(cx - 42, cy + 16), b = P(cx - 14, cy - 2), c = P(cx + 14, cy + 16), d = P(cx + 42, cy - 2);
        return sk(a, b) + bond(b, c, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.5 }) + sk(c, d);
      } },
      { name: 'alkyne', suffix: '-yne', draw(cx, cy) {
        const a = P(cx - 44, cy + 6), b = P(cx - 16, cy + 6), c = P(cx + 16, cy + 6), d = P(cx + 44, cy + 6);
        return sk(a, b) + bond(b, c, { order: 3, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.2 }) + sk(c, d);
      } },
    ];
    s += tag(360, 24, 'priority falls left to right along the top row, then along the bottom row');
    groups.forEach((g, i) => {
      const px = 12 + (i % 5) * 142, py = 40 + Math.floor(i / 5) * 166, cx = px + 66;
      s += panel(px, py, 132, 150, { kind: i < 4 ? 'hi' : undefined });
      s += text(cx, py + 22, g.name, { cls: 'fg-lbl', size: 12 });
      s += g.draw(cx, py + 80);
      s += text(cx, py + 136, g.suffix, { cls: 'fg-tag-good', size: 10.5 });
    });
    return s;
  },
  caption: 'The priority list, as the fragments you would actually see in a drawing. The four shaded panels are the acid and its derivatives, and every one of them has three bonds from the functional carbon to oxygen or nitrogen; the aldehyde and ketone have two; the alcohol and amine one. The multiple bonds have none, and rank last.',
  note: 'Use it as a lookup in both directions. Given a drawing, find the highest panel that matches something in it: that group is the suffix and everything else is a prefix. Given a name, the suffix tells you which fragment to draw at the carbon the locant names, and the root tells you how long the chain around it is.',
});

/* ---------------------------------------------------------------- N5 ---
   Encode and decode, side by side. The keto acid is the section's worked
   example and was text only; the aldehyde is the direction the chapter never
   modelled, reading a name back into a structure. */
FIGURES.push({
  id: 'keto-acid-and-decode',
  section: 'naming-functional-groups',
  anchor: '<h3>Reading a name back into a structure</h3>',
  alt: 'Left: 4-bromo-3-oxopentanoic acid drawn as a numbered five-carbon chain, with the acid carbon as C1 carrying a double-bonded O and an OH, a ketone oxygen on C3 and a bromine on C4. Right: 3-hydroxybutanal drawn as a four-carbon chain with the aldehyde carbon as C1 and an OH on C3, with the three decoding steps listed.',
  viewBox: '0 0 720 336',
  build() {
    let s = '';
    const num = (x, y, v) => text(x, y, v, { cls: 'fg-lbl', size: 11 });
    // Left: structure -> name
    {
      const x = 12; s += panel(x, 44, 344, 216, { kind: 'hi' }); s += tag(x + 172, 32, 'structure → name');
      const r = zig(x + 70, 170, 5, 40, 24);
      for (let i = 0; i < 4; i++) s += sk(r[i], r[i + 1]);
      const o1 = P(r[0].x, r[0].y + 40), ho = P(r[0].x - 34, r[0].y - 18);
      s += bond(r[0], o1, { order: 2, rFrom: 0, rTo: 15 }) + atom(o1.x, o1.y, 'O');
      s += bond(r[0], ho, { rFrom: 0, rTo: 16 }) + atom(ho.x, ho.y, 'HO');
      const o3 = P(r[2].x, r[2].y + 40);
      s += bond(r[2], o3, { order: 2, rFrom: 0, rTo: 15 }) + atom(o3.x, o3.y, 'O');
      const br = P(r[3].x, r[3].y - 40);
      s += bond(r[3], br, { rFrom: 0, rTo: 15 }) + atom(br.x, br.y, 'Br');
      s += num(r[0].x + 19, r[0].y + 12, '1');
      s += num(r[1].x, r[1].y - 10, '2');
      s += num(r[2].x, r[2].y - 12, '3');
      s += num(r[3].x, r[3].y + 18, '4');
      s += num(r[4].x, r[4].y + 20, '5');
      s += text(x + 18, 70, 'acid outranks ketone: suffix -oic acid, C1 fixed', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 18, 86, 'ketone demoted to oxo-, bromine is bromo-', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 172, 286, '4-bromo-3-oxopentanoic acid', { cls: 'fg-tag-good', size: 11.5 });
      s += text(x + 172, 306, 'prefixes alphabetical: bromo before oxo', { cls: 'fg-sm', size: 9.5 });
    }
    // Right: name -> structure
    {
      const x = 364; s += panel(x, 44, 344, 216, { kind: 'hi' }); s += tag(x + 172, 32, 'name → structure');
      s += text(x + 18, 70, '-al: an aldehyde, so C1 is a CHO', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 18, 86, 'butan: four carbons in the parent', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 18, 102, '3-hydroxy: an OH on C3', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      const r = zig(x + 96, 176, 4, 40, 24);
      for (let i = 0; i < 3; i++) s += sk(r[i], r[i + 1]);
      const o1 = P(r[0].x, r[0].y + 40), h = P(r[0].x - 34, r[0].y - 18);
      s += bond(r[0], o1, { order: 2, rFrom: 0, rTo: 15 }) + atom(o1.x, o1.y, 'O');
      s += bond(r[0], h, { rFrom: 0, rTo: 15 }) + atom(h.x, h.y, 'H');
      const oh = P(r[2].x, r[2].y + 40);
      s += bond(r[2], oh, { rFrom: 0, rTo: 15 }) + atom(oh.x, oh.y, 'OH', { kind: 'hi' });
      s += num(r[0].x + 19, r[0].y + 12, '1');
      s += num(r[1].x, r[1].y - 10, '2');
      s += num(r[2].x, r[2].y - 12, '3');
      s += num(r[3].x, r[3].y - 10, '4');
      s += text(x + 172, 286, '3-hydroxybutanal', { cls: 'fg-tag-good', size: 11.5 });
      s += text(x + 172, 306, 'suffix first, then root, then prefixes', { cls: 'fg-sm', size: 9.5 });
    }
    return s;
  },
  caption: 'The same procedure run in both directions. Encoding starts by ranking the groups, because the winner fixes both the suffix and where C1 is; decoding starts from the suffix, because it says which fragment sits at C1 (or at the locant given), and only then is the chain drawn around it.',
  note: 'Decoding is the direction exams use for "draw the structure of", and the commonest error is reading a name left to right. Read it from the end: the suffix, then the root, then each prefix with its number. In 3-hydroxybutanal that order puts the CHO down first and the OH two carbons along from it; read left to right, students draw the OH first and then have to guess where the aldehyde goes.',
});

export default FIGURES;
