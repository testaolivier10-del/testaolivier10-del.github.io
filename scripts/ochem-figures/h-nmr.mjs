/* Figures for the h-nmr notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* A stick, for the three spectra that are line spectra rather than traces. */
function stick(x, yBase, h, cls = 'fg-bond', w = 2.6) {
  return `<line class="${cls}" x1="${n2(x)}" y1="${n2(yBase)}" x2="${n2(x)}" y2="${n2(yBase - h)}" stroke-width="${w}"></line>`;
}


const FIGURES = [];

/* ------------------------------------------------------------- 1H NMR ---
   Ethyl acetate, which is the compound the section's own worked example
   solves — so the figure is the answer to the example, drawn. */
FIGURES.push({
  id: 'h-nmr-spectrum-ethyl-acetate',
  section: 'h-nmr',
  anchor: 'Assemble: CH₃–CO–O–CH₂CH₃, ethyl acetate. Every piece of data accounted for.</p>\n</div>',
  alt: 'The proton NMR spectrum of ethyl acetate. The chemical shift axis runs from 5 ppm on the left to 0 on the right. A four-line quartet stands at 4.1 ppm, a single line at 2.0 ppm, a three-line triplet at 1.3 ppm and a small TMS reference line at 0. A stepped integration trace above the peaks rises by two hydrogens at the quartet and by three at each of the other two signals, and a labeled bar underneath links the quartet and the triplet by their shared coupling constant of about 7 hertz.',
  viewBox: '0 0 760 444',
  build() {
    const X = (d) => 80 + (5 - d) * 124;
    const base = 300;
    let s = '';
    s += rule(70, base, 716, base);
    for (const d of [5, 4, 3, 2, 1, 0]) {
      s += rule(X(d), base, X(d), base + 6);
      s += text(X(d), base + 20, String(d), { cls: 'fg-sm', size: 9.5 });
    }
    s += text(394, 350, 'chemical shift δ (ppm) — δ decreasing to the right, as a spectrum is printed', { cls: 'fg-sm', size: 10.5 });

    /* the three multiplets. The line SPACING is drawn far wider than scale:
       7 Hz on a 300 MHz instrument is 0.023 ppm, about three pixels here, and
       at that size nobody could count the lines. */
    const mult = (d, heights, gap) => {
      let out = '';
      const x0 = X(d) - ((heights.length - 1) * gap) / 2;
      heights.forEach((h, i) => { out += stick(x0 + i * gap, base, h); });
      return out;
    };
    s += mult(4.1, [33.33, 100, 100, 33.33], 7);
    s += mult(2.0, [130], 7);
    s += mult(1.3, [60, 120, 60], 7);
    s += stick(X(0), base, 34, 'fg-bond-soft', 2.2);

    /* integration, drawn the way an instrument draws it: a trace that steps up
       by the area of each signal as it crosses it. */
    let step = 'M110 150';
    const risers = [[4.1, 20], [2.0, 30], [1.3, 30]];
    let y = 150;
    for (const [d, h] of risers) {
      step += ` L${n2(X(d) - 16)} ${n2(y)} L${n2(X(d) + 16)} ${n2(y - h)}`;
      y -= h;
    }
    step += ` L690 ${n2(y)}`;
    s += `<path class="fg-arrow-mut" d="${step}"></path>`;
    s += text(X(4.1) + 22, 142, '2H', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(X(2.0) + 22, 118, '3H', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(X(1.3) + 22, 88, '3H', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(96, 74, 'integration 2 : 3 : 3 — eight hydrogens, and C₄H₈O₂ has exactly eight', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });

    /* assignments, under the axis where there is room for two lines each */
    const assign = (d, a, b, dx = 0) => text(X(d), 374, a, { cls: 'fg-lbl', size: 12 }) + text(X(d) + dx, 390, b, { cls: 'fg-sm', size: 9.5 });
    s += assign(4.1, '–O–CH₂–', 'δ 4.1 · q · 2H');
    s += assign(2.0, 'CH₃–C=O', 'δ 2.0 · s · 3H', -14);
    s += assign(1.3, '–CH₃', 'δ 1.3 · t · 3H', 16);
    s += text(716, 374, 'TMS', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
    s += text(716, 390, 'δ 0 by definition', { cls: 'fg-sm', size: 9.5, anchor: 'end' });

    s += text(X(2.7), 412, 'matching J ≈ 7 Hz — these two are coupled to each other', { cls: 'fg-tag', size: 11 });
    s += `<line class="fg-arrow" x1="${n2(X(4.1))}" y1="426" x2="${n2(X(1.3))}" y2="426"></line>`;
    s += `<line class="fg-arrow" x1="${n2(X(4.1))}" y1="420" x2="${n2(X(4.1))}" y2="432"></line>`;
    s += `<line class="fg-arrow" x1="${n2(X(1.3))}" y1="420" x2="${n2(X(1.3))}" y2="432"></line>`;
    s += text(680, 46, 'ethyl acetate, CH₃COOCH₂CH₃', { cls: 'fg-tag', size: 11, anchor: 'end' });
    return s;
  },
  caption: 'A real spectrum, with the three readings marked on it. The quartet at 4.1 and the triplet at 1.3 are an ethyl group, and their matching line spacing &mdash; the coupling constant J &mdash; is what proves they are neighbors rather than two unrelated signals that happen to look right. The 3H singlet at 2.0 has no neighbors at all, so its methyl must be attached to something carrying no hydrogens, which here is the carbonyl.',
  note: 'The line spacings are drawn much wider than scale on purpose: 7 Hz on a 300 MHz instrument is 0.023 ppm, about three pixels at this size, and a real printed multiplet is expanded before anyone tries to count its lines.',
});

/* ------------------------------------------- 1H NMR, the splitting tree ---
   Two neighbour sets, taken one at a time. Panel 1 is the case where the two
   J values match and the tree collapses; panel 2 is the case where they do
   not and every line survives. The prose can state that; only a picture can
   show it. */
FIGURES.push({
  id: 'h-nmr-splitting-tree',
  section: 'h-nmr',
  anchor: 'and only then ask what it looks like.</p>',
  alt: 'Two splitting trees side by side. On the left, one line splits into four equally spaced lines and each of those splits into three, and because both coupling constants are 7 hertz the twelve lines fall onto six positions, drawn underneath as a six-line multiplet with heights 1, 5, 10, 10, 5 and 1. On the right, one line splits into two lines 17.6 hertz apart and each of those splits into two lines 10.9 hertz apart, giving four separate lines of equal height drawn underneath.',
  viewBox: '0 0 760 440',
  build() {
    let s = '';
    const tier = (cx, y, positions, from) => {
      let out = '';
      for (const p of positions) {
        out += `<line class="fg-bond-soft" x1="${n2(from)}" y1="${n2(y - 34)}" x2="${n2(p)}" y2="${n2(y)}"></line>`;
        out += stick(p, y + 16, 16, 'fg-bond', 2.4);
      }
      return out;
    };
    /* ---- panel 1: equal J, the tree collapses ---- */
    const c1 = 196;
    s += text(c1, 36, 'CH₃–CH₂–CHBr–CH₃, the CHBr hydrogen', { cls: 'fg-lbl', size: 12 });
    s += text(c1, 52, 'two different neighbor sets, both J ≈ 7 Hz', { cls: 'fg-sm', size: 10 });
    s += stick(c1, 92, 16, 'fg-bond', 2.4);
    s += text(c1, 108, 'before any coupling', { cls: 'fg-sm', size: 9.5 });

    const g = 24;
    const q = [-1.5, -0.5, 0.5, 1.5].map((k) => c1 + k * g);
    s += tier(c1, 150, q, c1);
    s += text(c1, 186, 'split by the 3 H of the CH₃ — a quartet', { cls: 'fg-tag', size: 11 });

    const t2 = [];
    for (const p of q) for (const k of [-1, 0, 1]) t2.push(p + k * g);
    for (const p of q) {
      for (const k of [-1, 0, 1]) {
        s += `<line class="fg-bond-soft" x1="${n2(p)}" y1="${n2(206)}" x2="${n2(p + k * g)}" y2="${n2(236)}"></line>`;
      }
    }
    s += text(c1, 262, 'each line split again by the 2 H of the CH₂', { cls: 'fg-tag', size: 11 });
    s += text(c1, 278, 'twelve lines — but only six positions', { cls: 'fg-sm', size: 9.5 });

    const base1 = 370;
    s += rule(60, base1, 332, base1);
    const heights = [1, 5, 10, 10, 5, 1];
    [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].forEach((k, i) => {
      s += stick(c1 + k * g, base1, heights[i] * 7.2, 'fg-bond', 3);
    });
    s += text(c1, 392, 'what you see: a sextet', { cls: 'fg-lbl', size: 12 });
    s += text(c1, 408, '1 : 5 : 10 : 10 : 5 : 1 — equal J stacks the lines', { cls: 'fg-sm', size: 10 });

    /* ---- panel 2: unequal J, nothing collapses ---- */
    s += `<line class="fg-dash" x1="380" y1="30" x2="380" y2="412"></line>`;
    const c2 = 566;
    s += text(c2, 36, 'C₆H₅–CH=CH₂, the internal vinyl hydrogen', { cls: 'fg-lbl', size: 12 });
    s += text(c2, 52, 'two different neighbors, J = 17.6 and 10.9 Hz', { cls: 'fg-sm', size: 10 });
    s += stick(c2, 92, 16, 'fg-bond', 2.4);
    s += text(c2, 108, 'before any coupling', { cls: 'fg-sm', size: 9.5 });

    const gA = 52, gB = 22;
    const d1 = [-0.5, 0.5].map((k) => c2 + k * gA);
    s += tier(c2, 150, d1, c2);
    s += text(c2, 186, 'split by the trans partner — J = 17.6 Hz', { cls: 'fg-tag', size: 11 });
    const d2 = [];
    for (const p of d1) for (const k of [-0.5, 0.5]) d2.push(p + k * gB);
    for (const p of d1) for (const k of [-0.5, 0.5]) {
      s += `<line class="fg-bond-soft" x1="${n2(p)}" y1="206" x2="${n2(p + k * gB)}" y2="236"></line>`;
    }
    s += text(c2, 262, 'split again by the cis partner — J = 10.9 Hz', { cls: 'fg-tag', size: 11 });
    s += text(c2, 278, 'four lines, and all four survive', { cls: 'fg-sm', size: 9.5 });

    s += rule(430, base1, 702, base1);
    d2.forEach((p) => { s += stick(p, base1, 72, 'fg-bond', 3); });
    s += text(c2, 392, 'what you see: a doublet of doublets', { cls: 'fg-lbl', size: 12 });
    s += text(c2, 408, '1 : 1 : 1 : 1 — unequal J keeps every line apart', { cls: 'fg-sm', size: 10 });
    s += text(380, 432, 'Same procedure both times. Only the two J values decide what comes out.', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Splitting happens one neighbor set at a time, so draw the tree and read the bottom row &mdash; never try to guess the multiplet in a single step. On the left the two coupling constants are equal, the twelve lines land on six positions, and what prints is an ordinary sextet. On the right they are not equal, so nothing merges and you count four lines: a <b>doublet of doublets</b>, the pattern the n + 1 rule cannot produce.',
  note: 'The n + 1 rule is the special case of this drawing in which every neighbor has the same J. That is why it works so well on freely rotating chains, where all the vicinal couplings really are about 7 Hz, and fails the moment a hydrogen has neighbors of two different kinds &mdash; as any vinyl hydrogen does. One simplification is built into the left panel: C2 of 2-bromobutane is a stereocenter, so its two CH₂ hydrogens are strictly diastereotopic rather than equivalent, and a real spectrum is a little messier than the clean sextet drawn. The tree is drawn with them equivalent because the point being made is what two different J values do.',
});

export default FIGURES;
