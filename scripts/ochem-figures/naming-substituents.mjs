/* Figures for the naming-substituents notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ A2 ---
   Alphabetical order is the one rule in the section that produces a
   silently wrong answer, because a list sorted the obvious way still looks
   sorted. A before/after strip is the comparison: the same five names,
   filed by the letter you see and filed by the letter that counts. */
FIGURES.push({
  id: 'alphabetize-filing',
  section: 'naming-substituents',
  anchor: '<h3>The order in which the rules apply</h3>',
  alt: 'Five substituent names with the letter each files under, then the same five sorted by first letter and sorted correctly',
  viewBox: '0 0 760 350',
  build() {
    let s = '';
    const cols = [
      { x: 84,  name: 'tert-butyl',       rule: 'tert- is ignored',   letter: 'b', counts: false },
      { x: 220, name: 'dimethyl',         rule: 'di- is ignored',     letter: 'm', counts: false },
      { x: 356, name: 'ethyl',            rule: 'nothing to strip',   letter: 'e', counts: true  },
      { x: 492, name: 'isopropyl',        rule: 'iso is part of it',  letter: 'i', counts: true  },
      { x: 628, name: 'cyclohexyl',       rule: 'cyclo is part of it', letter: 'c', counts: true },
    ];
    s += tag(380, 36, 'what each name files under');
    for (const c of cols) {
      s += label(c.x, 74, c.name, { size: 12.5 });
      s += text(c.x, 96, c.rule, { cls: c.counts ? 'fg-tag-good' : 'fg-tag-warn', size: 9.5 });
      s += atom(c.x, 128, c.letter, { kind: 'hi', r: 15 });
    }
    s += rule(34, 160, 726, 160);

    // The same five names, sorted two ways. The rows are the whole figure:
    // both look sorted, and only one is.
    const row = (y, heading, order, kind) => {
      s += text(70, y, heading, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 10.5, anchor: 'start' });
      order.forEach((nm, i) => {
        s += label(150 + i * 124, y + 30, nm, { size: 12 });
        if (i) s += text(150 + i * 124 - 62, y + 30, '\u00b7', { cls: 'fg-sm', size: 12 });
      });
    };
    row(196, 'sorted by the first letter printed', ['cyclohexyl', 'dimethyl', 'ethyl', 'isopropyl', 'tert-butyl'], 'warn');
    row(276, 'sorted by the letter it files under', ['tert-butyl', 'cyclohexyl', 'ethyl', 'isopropyl', 'dimethyl'], 'good');
    return s;
  },
  caption: 'Five substituents, filed. A multiplying prefix (<i>di-</i>) and an italic structural prefix (<i>tert-</i>) are stripped before the name is alphabetized; <i>iso</i> and <i>cyclo</i> are not, because they are joined to the word rather than hyphenated off it.',
  note: 'The two rows are the reason this matters. Both are in alphabetical order by some reading, both look finished, and only the lower one is right \u2014 <i>tert</i>-butyl moves from last to first and dimethyl from second to last. The typography is the tell: if the prefix is hyphenated and italic, cross it out before you sort.',
});

/* ---------------------------------------------------------------- N2 ---
   The six alkyl groups the section defines in words. Every textbook draws
   these side by side, because a reader who has only read "attaches through
   the second carbon of a four-chain" cannot tell isobutyl from sec-butyl. */
FIGURES.push({
  id: 'alkyl-group-gallery',
  section: 'naming-substituents',
  anchor: 'Learn both directions and use whichever the question uses.</p>',
  alt: 'Six alkyl groups drawn as skeletal fragments: propyl, isopropyl, butyl, sec-butyl, isobutyl and tert-butyl. In each the bond to the parent chain is highlighted and ends in a dot, and the carbons are numbered as in the systematic name, so the attached carbon is C2 in propan-2-yl and butan-2-yl.',
  viewBox: '0 0 720 420',
  build() {
    let s = '';
    const dot = (p) => atom(p.x, p.y, '', { kind: 'hi', r: 5 });
    const n = (p, v, where) => {
      const at = where === 'above' ? [p.x, p.y - 9] : where === 'below' ? [p.x, p.y + 16]
        : where === 'right' ? [p.x + 12, p.y + 4] : where === 'left' ? [p.x - 12, p.y + 4] : [p.x + 11, p.y - 9];
      return text(at[0], at[1], v, { cls: 'fg-sm', size: 9.5 });
    };
    const groups = [
      { common: 'propyl', sys: 'propan-1-yl', draw(x, y) {
        const A = P(x, y), c1 = P(x + 30, y - 18), c2 = P(x + 60, y), c3 = P(x + 90, y - 18);
        return sk(A, c1, true) + sk(c1, c2) + sk(c2, c3) + dot(A) + n(c1, '1', 'above') + n(c2, '2', 'below') + n(c3, '3', 'above');
      } },
      { common: 'isopropyl', sys: 'propan-2-yl', draw(x, y) {
        const A = P(x, y + 10), c = P(x + 30, y - 8), m1 = P(x + 60, y + 10), m3 = P(x + 30, y - 44);
        return sk(A, c, true) + sk(c, m1) + sk(c, m3) + dot(A) + n(m3, '1', 'right') + n(c, '2', 'diag') + n(m1, '3', 'below');
      } },
      { common: 'butyl', sys: 'butan-1-yl', draw(x, y) {
        const A = P(x, y), c1 = P(x + 30, y - 18), c2 = P(x + 60, y), c3 = P(x + 90, y - 18), c4 = P(x + 120, y);
        return sk(A, c1, true) + sk(c1, c2) + sk(c2, c3) + sk(c3, c4) + dot(A) + n(c1, '1', 'above') + n(c2, '2', 'below') + n(c3, '3', 'above') + n(c4, '4', 'below');
      } },
      { common: 'sec-butyl', sys: 'butan-2-yl', draw(x, y) {
        const A = P(x, y + 10), c2 = P(x + 30, y - 8), c1 = P(x + 30, y - 44), c3 = P(x + 60, y + 10), c4 = P(x + 90, y - 8);
        return sk(A, c2, true) + sk(c2, c1) + sk(c2, c3) + sk(c3, c4) + dot(A) + n(c1, '1', 'right') + n(c2, '2', 'diag') + n(c3, '3', 'below') + n(c4, '4', 'above');
      } },
      { common: 'isobutyl', sys: '2-methylpropyl', draw(x, y) {
        const A = P(x, y), c1 = P(x + 30, y - 18), c2 = P(x + 60, y), c3 = P(x + 90, y - 18), m = P(x + 60, y + 36);
        return sk(A, c1, true) + sk(c1, c2) + sk(c2, c3) + sk(c2, m) + dot(A) + n(c1, '1', 'above') + n(c2, '2', 'diag') + n(c3, '3', 'above') + text(m.x + 8, m.y + 4, 'methyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      } },
      { common: 'tert-butyl', sys: '2-methylpropan-2-yl', draw(x, y) {
        const A = P(x, y), c = P(x + 36, y), m1 = P(x + 36, y - 36), m2 = P(x + 36, y + 36), m3 = P(x + 72, y);
        return sk(A, c, true) + sk(c, m1) + sk(c, m2) + sk(c, m3) + dot(A) + n(m1, '1', 'right') + n(c, '2', 'diag') + n(m3, '3', 'right') + text(m2.x + 8, m2.y + 4, 'methyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      } },
    ];
    groups.forEach((g, i) => {
      const px = 12 + (i % 3) * 236, py = 36 + Math.floor(i / 3) * 190;
      s += panel(px, py, 224, 170);
      s += text(px + 112, py + 24, g.common, { cls: 'fg-lbl', size: 12.5 });
      s += text(px + 112, py + 42, g.sys, { cls: 'fg-sm', size: 10 });
      s += g.draw(px + 46, py + 112);
    });
    s += text(360, 408, 'The dot is the bond to the parent chain; the numbers are the group’s own, as in its systematic name.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The six alkyl groups you will be asked to recognize, drawn. Each pair — propyl and isopropyl, then the four butyls — shares a carbon count; what changes is which carbon carries the bond to the parent. The systematic name says exactly that: <i>propan-2-yl</i> is a three-carbon group attached through its second carbon, <i>2-methylpropyl</i> is a three-carbon group attached through its first with a methyl on its second.',
  note: 'Two of these are the ones people confuse. <i>sec</i>-Butyl and isobutyl are both four carbons and both branched, and the difference is whether the branch point is the attached carbon (<i>sec</i>) or the one next to it (iso). Cover the names, look at where the dot sits, and say which is which; if you can do that, the words will stick.',
});

/* ---------------------------------------------------------------- N3 ---
   The section's two worked names, drawn with their numbering, including the
   one thing about a complex substituent that prose cannot show: the branch
   has its own C1 and its own count. */
FIGURES.push({
  id: 'substituent-worked-pair',
  section: 'naming-substituents',
  anchor: 'so (2-methylpropyl) files under <b>m</b>.</p>',
  alt: 'Two numbered skeletal structures. Left: a heptane chain numbered one to seven with a methyl on carbon 2, an ethyl on carbon 4 and a chlorine on carbon 5, named 5-chloro-4-ethyl-2-methylheptane. Right: a nonane chain with a 2-methylpropyl branch on carbon 5, the branch carbons numbered 1, 2, 3 from the attachment point in a second color, named 5-(2-methylpropyl)nonane.',
  viewBox: '0 0 720 336',
  build() {
    let s = '';
    const num = (x, y, v, cls = 'fg-lbl') => text(x, y, v, { cls, size: 11 });
    // Left: 5-chloro-4-ethyl-2-methylheptane
    {
      const x = 12; s += panel(x, 44, 344, 216, { kind: 'hi' }); s += tag(x + 172, 32, 'three simple substituents');
      const r = zig(x + 44, 176, 7, 40, 24);
      for (let i = 0; i < 6; i++) s += sk(r[i], r[i + 1]);
      const m = P(r[1].x, r[1].y - 36);
      const e1 = P(r[3].x, r[3].y - 36), e2 = P(r[3].x + 30, e1.y - 18);
      const cl = P(r[4].x, r[4].y + 42);
      s += sk(r[1], m) + sk(r[3], e1) + sk(e1, e2);
      s += bond(r[4], cl, { rFrom: 0, rTo: 15 }) + atom(cl.x, cl.y, 'Cl');
      r.forEach((p, i) => {
        const up = i % 2 === 1;
        if (i === 1 || i === 3) s += num(p.x, p.y + 18, String(i + 1));
        else if (i === 4) s += num(p.x, p.y - 12, '5');
        else s += num(p.x, up ? p.y - 10 : p.y + 20, String(i + 1));
      });
      s += text(m.x + 8, m.y + 4, 'methyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(e2.x + 8, e2.y + 4, 'ethyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 172, 286, '5-chloro-4-ethyl-2-methylheptane', { cls: 'fg-tag-good', size: 11.5 });
      s += text(x + 172, 306, 'numbered left to right: {2, 4, 5} beats {3, 4, 6}', { cls: 'fg-sm', size: 9.5 });
    }
    // Right: 5-(2-methylpropyl)nonane
    {
      const x = 364; s += panel(x, 44, 344, 216, { kind: 'hi' }); s += tag(x + 172, 32, 'one branched substituent');
      const r = zig(x + 30, 150, 9, 34, 22);
      for (let i = 0; i < 8; i++) s += sk(r[i], r[i + 1]);
      const b1 = P(r[4].x, r[4].y + 34), b2 = P(r[4].x + 30, b1.y + 18), b3 = P(b2.x + 30, b2.y - 18), bm = P(b2.x, b2.y + 36);
      s += sk(r[4], b1) + sk(b1, b2) + sk(b2, b3) + sk(b2, bm);
      r.forEach((p, i) => {
        const up = i % 2 === 1;
        if (i === 4) s += num(p.x, p.y - 12, '5');
        else s += num(p.x, up ? p.y - 10 : p.y + 20, String(i + 1));
      });
      s += num(b1.x - 12, b1.y + 4, '1', 'fg-tag-good');
      s += num(b2.x - 12, b2.y + 6, '2', 'fg-tag-good');
      s += num(b3.x + 12, b3.y + 4, '3', 'fg-tag-good');
      s += text(bm.x + 8, bm.y + 4, 'methyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 172, 286, '5-(2-methylpropyl)nonane', { cls: 'fg-tag-good', size: 11.5 });
      s += text(x + 172, 306, 'the green numbers belong to the branch', { cls: 'fg-sm', size: 9.5 });
    }
    return s;
  },
  caption: 'The two worked names, drawn. On the left the numbers were settled by the structure and the words by the alphabet, which is why 5 comes before 4 before 2 in the name. On the right the branch is numbered a second time, from the carbon that attaches it, and that count goes inside the parentheses.',
  note: 'The parentheses are doing a job. In 5-(2-methylpropyl)nonane the 2 counts along the branch and the 5 along the parent; write it without the brackets and a reader cannot tell which chain the 2 belongs to. The same group is also called isobutyl, and it files under <b>i</b> under that name and under <b>m</b> under this one, so which name you use changes where it sits in a longer name.',
});

export default FIGURES;
