/* Small drawing helpers that several figures share, moved out of
   build-ochem-figures.mjs so figure modules under scripts/ochem-figures/ can
   use them too. Nothing here decides chemistry. */
import { bond, wedge, hash, text, rule, P } from './ochem-figure.mjs';
import { ringDouble } from './ochem-skeletal.mjs';

/* A tetrahedral center drawn with bonds at the given screen angles (0 is
   east, measured counterclockwise), with `kind` choosing plain, wedge or
   hash. Returns the bond ink; the caller places the labels, because a
   label's radius depends on how long its text is. */
export function center(c, arms) {
  let s = '';
  for (const a of arms) {
    const rad = (-a.deg * Math.PI) / 180;
    const end = P(c.x + Math.cos(rad) * a.len, c.y + Math.sin(rad) * a.len);
    const opts = { rFrom: a.rFrom ?? 15, rTo: a.rTo ?? 0 };
    s += a.kind === 'wedge' ? wedge(c, end, { ...opts, width: 9 })
       : a.kind === 'hash' ? hash(c, end, { ...opts, width: 11, rungs: 4 })
       : bond(c, end, opts);
  }
  return s;
}
export const armEnd = (c, deg, len) => P(c.x + Math.cos((-deg * Math.PI) / 180) * len,
                                         c.y + Math.sin((-deg * Math.PI) / 180) * len);

/* A skeletal double bond between two unlabeled vertices: one full line plus
   one inset line on the side `inward` points to. */
export const skDouble = (a, b, inward) => ringDouble(a, b, inward, { inset: 7, gap: 4.6 });
export const plus = (x, y) => text(x, y, '+', { cls: 'fg-warn', size: 15 });
export const lobeE = (cx, cy, rx, ry, cls = 'fg-orb') =>
  `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill-opacity="0.18"></ellipse>`;

/* The free-energy axis and the reaction-coordinate baseline. */
export function frame(xAxis, yBase, yTop, xEnd) {
  let g = `<line class="fg-arrow" x1="${xAxis}" y1="${yBase}" x2="${xAxis}" y2="${yTop + 8}"></line>`;
  g += `<path class="fg-head" d="M${xAxis} ${yTop} L${xAxis + 4} ${yTop + 8} L${xAxis - 4} ${yTop + 8} Z"></path>`;
  g += rule(xAxis, yBase, xEnd, yBase);
  return g;
}

export const n2 = (v) => (Math.round(v * 10) / 10).toString();
