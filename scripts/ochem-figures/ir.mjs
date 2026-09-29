/* Figures for the ir notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* A % transmittance trace. Absorptions are Gaussian dips from a 100 %T
   baseline, which is what an IR trace actually is, and the sampling step
   tightens near a sharp band so a narrow spike does not come out triangular. */
function irTrace(peaks, X, Y) {
  const T = (w) => {
    let t = 100;
    for (const p of peaks) t -= p.d * Math.exp(-Math.pow((w - p.c) / p.s, 2) / 2);
    return Math.max(t, 3);
  };
  const near = (w) => peaks.some((p) => p.s < 40 && Math.abs(w - p.c) < 90);
  const pts = [];
  let w = 4000;
  while (w >= 500) {
    pts.push(`${n2(X(w))} ${n2(Y(T(w)))}`);
    w -= near(w) ? 3 : 14;
  }
  pts.push(`${n2(X(500))} ${n2(Y(T(500)))}`);
  return `<path class="fg-bond" d="M${pts.join(' L')}"></path>`;
}


const FIGURES = [];

/* ------------------------------------------------------------------ IR ---
   Butanoic acid, because it carries the two bands the section spends the most
   words on at once — the acid O–H wall and the carbonyl spike — and because it
   shows both conventions that students get backwards: wavenumber runs
   backwards and the peaks point down. */
FIGURES.push({
  id: 'ir-spectrum-butanoic-acid',
  section: 'ir',
  anchor: 'pointing at the same conjugation.</p>\n</div>',
  alt: 'The infrared spectrum of butanoic acid drawn as a percent-transmittance trace. Wavenumber runs from 4000 on the left to 500 on the right and the peaks point downward. A very broad trough runs from about 3300 to 2500, with two small sharp dips at 2960 and 2875 sitting inside it. A deep narrow spike reaches almost to zero transmittance at 1710. Below 1500 the trace is a shaded tangle of peaks labeled the fingerprint region, and a dotted vertical line marks 3000.',
  viewBox: '0 0 760 432',
  build() {
    const X = (w) => 64 + ((4000 - w) / 3500) * 660;
    const Y = (t) => 70 + ((100 - t) / 100) * 240;
    let s = '';
    /* fingerprint shading first, so the trace draws over it */
    s += `<rect class="fg-fill-mut" x="${n2(X(1500))}" y="70" width="${n2(X(500) - X(1500))}" height="240" rx="6" opacity="0.10"></rect>`;
    s += rule(64, 310, 724, 310) + rule(64, 310, 64, 70);
    for (const w of [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500]) {
      s += rule(X(w), 310, X(w), 316);
      s += text(X(w), 330, String(w), { cls: 'fg-sm', size: 9.5 });
    }
    for (const t of [100, 50, 0]) {
      s += rule(58, Y(t), 64, Y(t));
      s += text(54, Y(t) + 4, String(t), { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    }
    s += `<text class="fg-sm" x="24" y="190" text-anchor="middle" transform="rotate(-90 24 190)">% transmittance</text>`;
    s += text(394, 350, 'wavenumber (cm⁻¹) — high on the LEFT, exactly as a spectrum is printed', { cls: 'fg-sm', size: 10.5 });

    /* the 3000 line the section keeps referring to */
    s += `<line class="fg-dash" x1="${n2(X(3000))}" y1="70" x2="${n2(X(3000))}" y2="310"></line>`;
    s += text(X(3000), 88, '3000', { cls: 'fg-tag-mut', size: 10 });

    s += irTrace([
      { c: 3000, s: 255, d: 58 },   // the acid O–H wall, 3300 down to 2500
      { c: 2960, s: 13, d: 20 },    // sp3 C–H, riding inside it
      { c: 2875, s: 13, d: 16 },
      { c: 1710, s: 11, d: 90 },    // the acid C=O
      { c: 1415, s: 16, d: 26 },
      { c: 1285, s: 13, d: 52 },    // C–O
      { c: 1230, s: 12, d: 36 },
      { c: 1100, s: 14, d: 20 },
      { c: 935, s: 18, d: 34 },     // the dimer's O–H bend
      { c: 800, s: 16, d: 16 },
      { c: 640, s: 20, d: 14 },
    ], X, Y);

    /* O–H */
    s += text(88, 38, 'O–H of the acid — very broad,', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(88, 54, '3300 all the way down to 2500', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += `<line class="fg-dash-hi" x1="196" y1="60" x2="${n2(X(3150))}" y2="178"></line>`;
    /* sp3 C–H */
    s += text(330, 112, 'sp³ C–H, 2960 and 2875 —', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(330, 128, 'just below 3000, half buried', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += `<line class="fg-dash-hi" x1="326" y1="122" x2="${n2(X(2920))}" y2="232"></line>`;
    /* C=O */
    s += text(474, 244, 'C=O, 1710', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(474, 260, 'the carboxylic acid carbonyl', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += `<line class="fg-dash-hi" x1="478" y1="252" x2="${n2(X(1710) - 5)}" y2="276"></line>`;
    /* fingerprint */
    s += text(716, 248, 'fingerprint region', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
    s += text(716, 264, 'below 1500 — match it, do not assign it', { cls: 'fg-sm', size: 9.5, anchor: 'end' });

    s += text(394, 380, 'Peaks point DOWN, because the axis is how much light got THROUGH.', { cls: 'fg-lbl', size: 12.5 });
    s += text(394, 400, 'Everything diagnostic is left of 1500; everything right of it is the fingerprint.', { cls: 'fg-sm', size: 10.5 });
    s += text(394, 420, 'butanoic acid, CH₃CH₂CH₂COOH', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'What all of the above actually looks like. Two conventions trip people up and both are visible here: wavenumber runs <b>backwards</b>, high on the left, and peaks point <b>down</b>, because the y-axis is transmittance &mdash; how much light got through &mdash; so an absorption is a trough. The acid&rsquo;s O&ndash;H is not a peak so much as a wall, sprawling from 3300 to 2500 and half-swallowing the sp³ C&ndash;H dips that sit inside it; the carbonyl at 1710 is the opposite, narrow and nearly to the floor.',
  note: 'Four features, read in the order of the thirty-second scan: the deep spike at 1710 says carbonyl; the broad wall from 3300 to 2500 says <b>carboxylic acid</b> specifically; the small dips just below 3000 say sp³ C&ndash;H; and the scribble below 1500 says nothing you should try to read.',
});

export default FIGURES;
