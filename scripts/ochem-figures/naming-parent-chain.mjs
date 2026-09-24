/* Figures for the naming-parent-chain notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ A1 ---
   The trap the prose names but cannot show: the longest chain is very often
   not the row lying across the page. Two traces of one skeleton is the only
   honest way to make that claim, because the reader who cannot already see
   the seven-carbon path is exactly the reader the sentence is for. */
FIGURES.push({
  id: 'parent-chain-trace',
  section: 'naming-parent-chain',
  anchor: '<h3>When two chains tie</h3>',
  alt: 'One eight-carbon skeleton traced two ways: the horizontal five-carbon row, and the seven-carbon path that turns a corner',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    /* One skeleton, drawn twice at the same coordinates so the two traces are
       comparable at a glance. `ox` shifts the whole thing into its panel. */
    const skeleton = (ox, traced, nums, branchLabel) => {
      const R = [P(ox + 50, 210), P(ox + 92, 186), P(ox + 134, 210), P(ox + 176, 186), P(ox + 218, 210)];
      /* The branch leans back over the start of the row rather than arcing
         across it. Drawn the other way its third carbon ended up one bond
         length above C4, and the skeleton read as a closed six-membered ring
         — a reader could see cyclohexane where there is none. */
      const B = [P(ox + 92, 138), P(ox + 54, 112), P(ox + 54, 64)];
      const links = [
        ['R0R1', R[0], R[1]], ['R1R2', R[1], R[2]], ['R2R3', R[2], R[3]], ['R3R4', R[3], R[4]],
        ['R1B1', R[1], B[0]], ['B1B2', B[0], B[1]], ['B2B3', B[1], B[2]],
      ];
      let t = '';
      // Every bond in plain ink first, then the traced ones over the top.
      for (const [, a, b] of links) t += bond(a, b, { rFrom: 0, rTo: 0 });
      for (const [k, a, b] of links) {
        if (traced.includes(k)) t += bond(a, b, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
      }
      // Locants ride on one line above the skeleton so none of them lands on
      // a bond; the branch carbons get theirs above the branch.
      for (const [x, y, v] of nums) t += text(ox + x, y, v, { cls: 'fg-lbl', size: 11 });
      t += text(ox + 50, 236, branchLabel[0], { cls: 'fg-sm', size: 9.5 });
      t += text(ox + 150, 92, branchLabel[1], { cls: 'fg-sm', size: 9.5 });
      return t;
    };

    s += panel(24, 44, 250, 224, { kind: 'warn' });
    s += tag(149, 32, 'the row you can see');
    s += skeleton(30, ['R0R1', 'R1R2', 'R2R3', 'R3R4'],
      [[50, 236, '1'], [92, 212, '2'], [134, 236, '3'], [176, 212, '4'], [218, 236, '5']],
      ['', 'a three-carbon branch']);

    s += panel(396, 44, 250, 224, { kind: 'hi' });
    s += tag(521, 32, 'the path that turns a corner');
    s += skeleton(402, ['B2B3', 'B1B2', 'R1B1', 'R1R2', 'R2R3', 'R3R4'],
      [[30, 68, '1'], [30, 116, '2'], [64, 146, '3'], [92, 212, '4'], [134, 236, '5'], [176, 212, '6'], [218, 236, '7']],
      ['methyl', '']);

    s += text(149, 292, 'five carbons, one propyl branch', { cls: 'fg-sm', size: 10 });
    s += text(149, 314, '2-propylpentane', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(149, 332, 'no such compound name \u2014 a longer chain exists', { cls: 'fg-sm', size: 9.5 });
    s += text(521, 292, 'seven carbons, one methyl branch', { cls: 'fg-sm', size: 10 });
    s += text(521, 314, '4-methylheptane', { cls: 'fg-tag-good', size: 11.5 });
    s += text(521, 332, 'correct \u2014 nothing longer runs through the molecule', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'The same eight carbons, traced twice. The five-carbon row is what the drawing puts in front of you; the seven-carbon parent runs up into the branch and back along the row, and it is a longer continuous path through exactly the same skeleton.',
  note: 'Both traces are legal paths \u2014 neither jumps a gap or reuses a carbon \u2014 so the rule is not "is this a chain?" but "is anything longer?". The check that catches it is to start at every end carbon in turn and count the longest route out. There are three ends here, and only one pair of them is seven carbons apart.',
});

/* ---------------------------------------------------------------- N1 ---
   Three drawings the parent-chain section walks through in words. The
   middle one is the trap (the ethyl IS the corner) and the right one is the
   same trap failing to fire (every route ties), and the reader who cannot
   tell them apart on sight is exactly who the counting rule is for. */
FIGURES.push({
  id: 'ethyl-branch-three-ways',
  section: 'naming-parent-chain',
  anchor: '<h3>Check every end, not just the one you started from</h3>',
  alt: 'Three branched alkanes side by side. A six-carbon row with a methyl on the third carbon, where the row is the parent and the name is 3-methylhexane. A four-carbon row with an ethyl on the second carbon, where the longest path turns into the ethyl and the name is 3-methylpentane. A five-carbon row with an ethyl on the middle carbon, where every route is five carbons and the name is 3-ethylpentane.',
  viewBox: '0 0 720 340',
  build() {
    let s = '';
    const draw = (links, traced) => {
      let t = '';
      for (const [a, b] of links) t += sk(a, b, false);
      for (const [a, b, k] of links) if (traced.includes(k)) t += sk(a, b, true);
      return t;
    };
    const num = (x, y, v) => text(x, y, v, { cls: 'fg-lbl', size: 11 });
    const head = (x, kind, heading) => { s += panel(x, 44, 224, 206, { kind }); s += tag(x + 112, 32, heading); };
    const verdict = (x, sub, name, cls, note) => {
      s += text(x + 112, 274, sub, { cls: 'fg-sm', size: 10 });
      s += text(x + 112, 296, name, { cls, size: 11.5 });
      s += text(x + 112, 316, note, { cls: 'fg-sm', size: 9.5 });
    };

    // A. 3-methylhexane: the row is the parent.
    {
      const x = 12; head(x, 'hi', 'the row is the parent');
      const r = zig(x + 27, 176, 6);
      const m = P(r[2].x, r[2].y + 34);
      s += draw([[r[0], r[1], 'a'], [r[1], r[2], 'b'], [r[2], r[3], 'c'], [r[3], r[4], 'd'], [r[4], r[5], 'e'], [r[2], m, 'm']], ['a', 'b', 'c', 'd', 'e']);
      r.forEach((p, i) => {
        if (i === 2) s += num(p.x, p.y - 12, '3');
        else s += num(p.x, i % 2 ? p.y - 10 : p.y + 20, String(i + 1));
      });
      s += text(m.x + 8, m.y + 4, 'methyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      verdict(x, 'six in the row, nothing longer', '3-methylhexane', 'fg-tag-good', 'the methyl is a real branch');
    }
    // B. Four-carbon row with an ethyl on C2: the ethyl is the corner.
    {
      const x = 248; head(x, 'warn', 'the row is not the parent');
      const r = zig(x + 50, 186, 4);
      const e1 = P(r[1].x, r[1].y - 34), e2 = P(r[1].x + 30, e1.y - 18);
      s += draw([[r[0], r[1], 'a'], [r[1], r[2], 'b'], [r[2], r[3], 'c'], [r[1], e1, 'd'], [e1, e2, 'e']], ['b', 'c', 'd', 'e']);
      s += num(e2.x + 12, e2.y + 4, '1');
      s += num(e1.x + 12, e1.y + 4, '2');
      s += num(r[1].x, r[1].y + 18, '3');
      s += num(r[2].x, r[2].y + 20, '4');
      s += num(r[3].x, r[3].y - 10, '5');
      s += text(r[0].x, r[0].y + 20, 'methyl', { cls: 'fg-sm', size: 9.5 });
      verdict(x, 'row four; through the ethyl, five', '3-methylpentane', 'fg-tag-good', '"2-ethylbutane" names the drawing');
    }
    // C. Five-carbon row with an ethyl on C3: every route is five.
    {
      const x = 484; head(x, 'hi', 'every route ties');
      const r = zig(x + 44, 160, 5);
      const e1 = P(r[2].x, r[2].y + 34), e2 = P(r[2].x + 30, e1.y + 18);
      s += draw([[r[0], r[1], 'a'], [r[1], r[2], 'b'], [r[2], r[3], 'c'], [r[3], r[4], 'd'], [r[2], e1, 'e'], [e1, e2, 'f']], ['a', 'b', 'c', 'd']);
      r.forEach((p, i) => {
        if (i === 2) s += num(p.x, p.y - 12, '3');
        else s += num(p.x, i % 2 ? p.y - 10 : p.y + 20, String(i + 1));
      });
      s += text(e2.x + 8, e2.y + 4, 'ethyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      verdict(x, 'row five, either corner five', '3-ethylpentane', 'fg-tag-good', 'a tie changes nothing here');
    }
    return s;
  },
  caption: 'Three drawings that look alike and are named by three different arguments. On the left the row is the parent. In the middle the ethyl is the corner the parent turns: two ethyl carbons, then the rest of the row, is five, and the row is only four. On the right the row and both corner routes are all five carbons, so the drawing was honest and the ethyl is a real ethyl.',
  note: 'The three drawings differ by one carbon in the row and nothing else, and the eye does not reliably see one carbon. Write the route lengths down before you write a name: with three ends there are only three routes to count, and the longest of them is the parent whatever the drawing suggests.',
});

export default FIGURES;
