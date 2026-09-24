/* Figures for the hydrates-cyanohydrins notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 53 ---
   The hydration table is four numbers spanning four orders of magnitude, and
   a bar chart is the only honest way to show that: 0.1 against 99.9 is not a
   difference a table communicates. The two causes are written under the axis
   because every bar is explained by some mixture of them. */
FIGURES.push({
  id: 'hydration-spread',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Why the hydrate matters even though it is a minor species</h3>',
  viewBox: '0 0 760 320',
  alt: 'Four bars of increasing length showing percent hydrate for acetone, acetaldehyde, formaldehyde and chloral',
  build() {
    let s = '';
    // A log-ish scale: linear in percent would make the first two invisible.
    const rows = [
      { lab: 'acetone, (CH\u2083)\u2082C=O', pct: '0.1%',   w: 14,  why: 'two methyls: crowded and fed',      kind: 'warn' },
      { lab: 'acetaldehyde, CH\u2083CHO',    pct: '~50%',   w: 210, why: 'one methyl',                        kind: null   },
      { lab: 'formaldehyde, H\u2082C=O',     pct: '~99.9%', w: 400, why: 'no alkyl group at all',             kind: null   },
      { lab: 'chloral, CCl\u2083CHO',        pct: '~100%',  w: 430, why: 'three chlorines pulling; isolable', kind: null   },
    ];
    let y = 62;
    for (const r of rows) {
      s += text(24, y + 4, r.lab, { cls: 'fg-lbl', size: 12, anchor: 'start' });
      s += bar(250, y - 11, r.w, 18, { kind: r.kind === 'warn' ? 'warn' : 'hi', opacity: 0.3 + r.w / 700 });
      s += text(250 + r.w + 8, y + 4, r.pct, { cls: 'fg-tag-good', size: 11, anchor: 'start' });
      s += text(24, y + 22, r.why, { cls: 'fg-sm', size: 10.5, anchor: 'start' });
      y += 52;
    }
    s += rule(24, 262, 700, 262);
    s += text(360, 286, 'Sterics: the sp\u00b2 carbon becomes sp\u00b3, and 120\u00b0 closes to 109\u00b0.', { cls: 'fg-lbl', size: 12 });
    s += text(360, 308, 'Electronics: alkyl groups feed the C=O; withdrawing groups starve it.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The reactivity order of the chapter, with numbers on it. Aldehyde beats ketone toward every nucleophile, and hydration is where you can see how large the gap actually is \u2014 three orders of magnitude between acetone and formaldehyde, from nothing more than removing two methyl groups.',
  note: 'The two causes usually agree, which is what makes the trend so reliable \u2014 and the interesting cases are the ones where they do not. Hexafluoroacetone is more crowded than acetone and essentially completely hydrated, because six fluorines outweigh the crowding. Cyclopropanone is fully hydrated for the opposite reason again: the ring already strains the sp\u00b2 carbon, so addition relieves strain instead of creating it, and the steric argument runs backwards.',
});

/* ------------------------------------------------------------- 11.4 ---
   The section names a gem-diol, a cyanohydrin and a bisulfite adduct, and
   then a whole fan-out of products from the nitrile, and draws none of
   them — the one figure it has is a bar chart. Row one makes the "same
   addition, three nucleophiles" claim visible; row two settles the
   alpha/beta bookkeeping that the labels alone never explain. */
FIGURES.push({
  id: 'three-nucleophiles-one-addition',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Cyanohydrins: addition of cyanide</h3>',
  alt: 'Top row: the same ketone drawn three times after addition, giving a gem-diol from water, a cyanohydrin from cyanide and a bisulfite adduct from sodium bisulfite, each with an OH and the new group on one carbon. Bottom row: a cyanohydrin fanning out to an alpha-hydroxy carboxylic acid on hydrolysis and to a beta-amino alcohol on reduction, with the numbering that makes one alpha and the other beta marked on each product.',
  viewBox: '0 0 760 556',
  build() {
    let s = '';

    /* One adduct: the former carbonyl carbon, its two R groups, the OH that
       was the carbonyl oxygen, and whatever the nucleophile left behind. */
    const adduct = (c, right, opts = {}) => {
      const r1 = armEnd(c, 250, 44), r2 = armEnd(c, 290, 44);
      let g = bond(c, r1, { rTo: 13 }) + atom(r1.x, r1.y, 'R', { r: 13 });
      g += bond(c, r2, { rTo: 13 }) + atom(r2.x, r2.y, 'R', { r: 13 });
      const oh = armEnd(c, 140, 56), nu = armEnd(c, 40, 56);
      g += bond(c, oh, { rTo: 17 }) + atom(oh.x, oh.y, 'OH', { r: 17, size: 10 });
      g += bond(c, nu, { rTo: opts.r || 20 }) + atom(nu.x, nu.y, right, { r: opts.r || 20, size: opts.size || 9.5, kind: opts.kind || 'hi' });
      g += atom(c.x, c.y, 'C', { kind: 'warn' });
      return { g, oh, nu };
    };

    const cell = (x, t, sub) => panel(x, 16, 236, 204) + tag(x + 118, 40, t) + text(x + 118, 208, sub, { cls: 'fg-sm', size: 9.5 });

    s += cell(8, 'WATER', 'reversible, and usually far to the left');
    s += adduct(P(118, 120), 'OH', { r: 17, size: 10 }).g;
    s += text(118, 194, 'a gem-diol (hydrate)', { cls: 'fg-tag-good', size: 10.5 });

    s += cell(260, 'HCN + cat. CN⁻', 'the only one that builds a skeleton');
    s += adduct(P(370, 120), 'C≡N', { r: 20, size: 10 }).g;
    s += text(370, 194, 'a cyanohydrin', { cls: 'fg-tag-good', size: 10.5 });

    s += cell(512, 'NaHSO₃', 'crystalline, soluble, reversible');
    s += adduct(P(622, 120), 'SO₃⁻', { r: 20, size: 10 }).g;
    s += text(622, 194, 'a bisulfite adduct', { cls: 'fg-tag-good', size: 10.5 });

    // ---------- row 2: what the nitrile becomes, and where the letters start ----------
    s += panel(8, 244, 744, 268);
    s += tag(140, 268, 'WHERE THE α AND β LABELS COME FROM');

    const cy = P(96, 376);
    const A = adduct(cy, 'C≡N', { r: 20, size: 10 });
    s += A.g;
    s += text(96, 436, 'the cyanohydrin', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(186, 348), P(250, 328), { muted: true });
    s += text(218, 314, 'H₃O⁺, heat', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(186, 404), P(250, 424), { muted: true });
    s += text(218, 450, 'LiAlH₄', { cls: 'fg-sm', size: 9.5 });

    /* Upper branch: the acid's letters start AFTER the carboxyl carbon, so
       the carbon carrying the OH is alpha. */
    const ac = P(360, 318);
    const B = adduct(ac, 'COOH', { r: 24, size: 9.5 });
    s += B.g;
    s += text(B.nu.x + 30, B.nu.y - 2, 'C1', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(ac.x + 30, ac.y + 14, 'α', { cls: 'fg-tag-warn', size: 14 });
    s += text(470, 300, 'an α-hydroxy acid', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(470, 318, 'the acid counts from the carboxyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(470, 334, 'carbon, so its neighbor is α', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    /* Lower branch: an alcohol's letters start ON the carbinol carbon, so the
       carbon beside it is beta. */
    const bc = P(360, 440);
    const C = adduct(bc, 'CH₂NH₂', { r: 26, size: 9 });
    s += C.g;
    s += text(bc.x - 30, bc.y + 14, 'α', { cls: 'fg-tag-warn', size: 14 });
    s += text(C.nu.x + 32, C.nu.y - 2, 'β', { cls: 'fg-tag-warn', size: 14, anchor: 'start' });
    s += text(470, 422, 'a β-amino alcohol', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(470, 440, 'the alcohol counts from the carbinol', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(470, 456, 'carbon itself, so its neighbor is β', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    s += rule(30, 524, 730, 524);
    s += text(380, 546, 'Same skeleton both times. The letter changes because the group that owns the numbering does.', { cls: 'fg-lbl', size: 11 });
    return s;
  },
  caption: 'Three nucleophiles, one mechanism, three adducts that differ only in what is sitting beside the OH. Water gives the gem-diol, cyanide gives the cyanohydrin — the only one of the three that makes a carbon–carbon bond — and bisulfite gives a salt you can filter off and then take apart again.',
  note: 'The lower half is the part that gets marked wrong, and it is a naming convention rather than a chemical difference. A carboxylic acid\u2019s Greek letters start <b>after</b> the carboxyl carbon, so the carbon holding the OH is α. An alcohol\u2019s start <b>on</b> the carbinol carbon, so that same carbon is α there and the CH₂NH₂ beside it is β. One fragment, two reference points, two letters.',
});

export default FIGURES;
