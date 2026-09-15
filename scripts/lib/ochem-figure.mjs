/* A drawing kit for the textbook figures.

   The figures already in ochem/notes/ are committed SVG with no source: the
   coordinates are precise to two decimal places, so something computed them,
   but that something was never checked in. Adding a figure therefore meant
   hand-writing trigonometry into a 4,000-character attribute soup, which is
   why the reaction-heavy half of the book has about 1.2 figures per section
   against the front half's 2.7 — precisely backwards, since a reaction IS a
   claim about which bond breaks and which forms, and that is a claim prose is
   bad at making.

   This is that missing source. It emits the same vocabulary the existing
   figures use — the `fg-` classes in ochem.css — so a new figure is
   indistinguishable from an old one, and it knows the two pieces of geometry
   that make chemical drawings tedious: a bond has to stop at the edge of the
   atom it points at rather than under its label, and an arrowhead has to be
   rotated to match the direction it arrives from.

   Nothing here decides chemistry. It draws what a figure definition says to
   draw, and the definitions live in scripts/build-ochem-figures.mjs. */

const n = (v) => (Math.round(v * 100) / 100).toString();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Atom radius by kind. A labelled atom needs a disc big enough to sit the
   label in and to give bonds something to stop against; `point` is an
   unlabelled vertex, which in skeletal drawing is a carbon. */
const R = { plain: 15, hi: 16, warn: 16, point: 0 };

export function atom(x, y, label, opts = {}) {
  const kind = opts.kind || 'plain';
  const r = opts.r ?? R[kind] ?? R.plain;
  const cls = kind === 'plain' ? 'fg-atom' : kind === 'point' ? null : `fg-atom-${kind}`;
  const size = opts.size ?? (String(label).length > 2 ? 9.5 : String(label).length > 1 ? 10.5 : 12);
  let out = '';
  if (cls) out += `<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${n(r)}"></circle>`;
  if (label) out += `<text class="fg-lbl" x="${n(x)}" y="${n(y + size * 0.37)}" text-anchor="middle" font-size="${n(size)}">${esc(label)}</text>`;
  return out;
}

/* Where a bond should stop: on the circle around the atom, not at its centre.
   Passing a radius of 0 (an unlabelled vertex) leaves the point untouched. */
function trim(from, to, rFrom, rTo) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  return {
    x1: from.x + ux * rFrom, y1: from.y + uy * rFrom,
    x2: to.x - ux * rTo, y2: to.y - uy * rTo,
    ux, uy, len,
  };
}

/* A bond. `order` 1, 2 or 3 draws the extra lines offset perpendicular to the
   bond, which is how a double bond is drawn and why it cannot just be two
   calls to this function. */
export function bond(a, b, opts = {}) {
  const order = opts.order || 1;
  const cls = opts.cls || 'fg-bond';
  const t = trim(a, b, opts.rFrom ?? R.plain, opts.rTo ?? R.plain);
  const px = -t.uy, py = t.ux;            // unit vector perpendicular to the bond
  const gap = opts.gap ?? 4;
  const offsets = order === 1 ? [0] : order === 2 ? [-gap, gap] : [-gap * 1.6, 0, gap * 1.6];
  return offsets.map((o) =>
    `<line class="${cls}" x1="${n(t.x1 + px * o)}" y1="${n(t.y1 + py * o)}" x2="${n(t.x2 + px * o)}" y2="${n(t.y2 + py * o)}"></line>`
  ).join('');
}

/* Stereochemistry: a solid wedge comes toward the reader, a hashed one goes
   away. The wedge is a triangle, the hash a ladder of shortening rungs. */
export function wedge(a, b, opts = {}) {
  const t = trim(a, b, opts.rFrom ?? R.plain, opts.rTo ?? R.plain);
  const w = opts.width ?? 7;
  const px = -t.uy * w / 2, py = t.ux * w / 2;
  return `<path class="fg-wedge" d="M${n(t.x1)} ${n(t.y1)} L${n(t.x2 + px)} ${n(t.y2 + py)} L${n(t.x2 - px)} ${n(t.y2 - py)} Z"></path>`;
}

export function hash(a, b, opts = {}) {
  const t = trim(a, b, opts.rFrom ?? R.plain, opts.rTo ?? R.plain);
  const rungs = opts.rungs ?? 5;
  const w = opts.width ?? 7;
  const px = -t.uy, py = t.ux;
  let out = '';
  for (let i = 1; i <= rungs; i++) {
    const f = i / (rungs + 1);
    const cx = t.x1 + (t.x2 - t.x1) * f, cy = t.y1 + (t.y2 - t.y1) * f;
    const half = (w * f) / 2;
    out += `<line class="fg-hash" x1="${n(cx + px * half)}" y1="${n(cy + py * half)}" x2="${n(cx - px * half)}" y2="${n(cy - py * half)}"></line>`;
  }
  return out;
}

/* An arrowhead as a triangle pointing along (ux, uy), with its tip at (x, y).
   Every arrow in the vocabulary is a stroke plus one of these; the existing
   figures do it the same way, which is why there is no marker-end anywhere. */
function head(x, y, ux, uy, cls, size = 8) {
  const px = -uy, py = ux;
  const bx = x - ux * size, by = y - uy * size;
  const h = size * 0.52;
  return `<path class="${cls}" d="M${n(x)} ${n(y)} L${n(bx + px * h)} ${n(by + py * h)} L${n(bx - px * h)} ${n(by - py * h)} Z"></path>`;
}

/* A straight reaction arrow. */
export function arrow(a, b, opts = {}) {
  const muted = !!opts.muted;
  const line = muted ? 'fg-arrow-mut' : 'fg-arrow';
  const tip = muted ? 'fg-head-mut' : 'fg-head';
  const t = trim(a, b, opts.rFrom ?? 0, opts.rTo ?? 0);
  const size = opts.size ?? 8;
  const ex = t.x2 - t.ux * size, ey = t.y2 - t.uy * size;
  return `<line class="${line}" x1="${n(t.x1)}" y1="${n(t.y1)}" x2="${n(ex)}" y2="${n(ey)}"></line>` +
         head(t.x2, t.y2, t.ux, t.uy, tip, size);
}

/* A curly arrow — the one that actually carries the meaning in a mechanism,
   because it says which electrons moved and where they went. Drawn as a
   quadratic Bezier bowed out to one side; `bow` is how far, and its sign
   picks the side. The head is rotated to the curve's tangent at the end,
   which for a quadratic is simply the direction from the control point to
   the end point. */
export function curve(a, b, opts = {}) {
  const muted = !!opts.muted;
  const line = muted ? 'fg-arrow-mut' : 'fg-arrow';
  const tip = muted ? 'fg-head-mut' : 'fg-head';
  const bow = opts.bow ?? 36;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;

  let ux = b.x - cx, uy = b.y - cy;
  const ul = Math.hypot(ux, uy) || 1;
  ux /= ul; uy /= ul;
  const size = opts.size ?? 8;
  const ex = b.x - ux * size, ey = b.y - uy * size;
  return `<path class="${line}" d="M${n(a.x)} ${n(a.y)} Q${n(cx)} ${n(cy)} ${n(ex)} ${n(ey)}"></path>` +
         head(b.x, b.y, ux, uy, tip, size);
}

/* Lone pair: two dots set perpendicular to the direction they stick out in. */
export function lonePair(x, y, angleDeg, opts = {}) {
  const cls = opts.muted ? 'fg-lp-mut' : 'fg-lp';
  const d = opts.dist ?? 22, spread = opts.spread ?? 4.5, r = opts.r ?? 2.3;
  const a = (angleDeg * Math.PI) / 180;
  const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d;
  const px = -Math.sin(a) * spread, py = Math.cos(a) * spread;
  return `<circle class="${cls}" cx="${n(cx + px)}" cy="${n(cy + py)}" r="${n(r)}"></circle>` +
         `<circle class="${cls}" cx="${n(cx - px)}" cy="${n(cy - py)}" r="${n(r)}"></circle>`;
}

export function text(x, y, s, opts = {}) {
  const cls = opts.cls || 'fg-sm';
  const anchor = opts.anchor || 'middle';
  const size = opts.size ?? (cls === 'fg-tag' ? 11 : cls === 'fg-lbl' ? 12.5 : 10);
  const extra = opts.opacity !== undefined ? ` opacity="${n(opts.opacity)}"` : '';
  return `<text class="${cls}" x="${n(x)}" y="${n(y)}" text-anchor="${anchor}" font-size="${n(size)}"${extra}>${esc(s)}</text>`;
}

export const tag = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-tag', size: 11, ...o });
export const label = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-lbl', size: 12.5, ...o });

export function rule(x1, y1, x2, y2) {
  return `<line class="fg-rule" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"></line>`;
}

export function panel(x, y, w, h, opts = {}) {
  const cls = opts.kind ? `fg-panel-${opts.kind}` : 'fg-panel';
  const r = opts.r ?? 10;
  return `<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}"></rect>`;
}

export function bar(x, y, w, h, opts = {}) {
  const cls = opts.kind ? `fg-fill-${opts.kind}` : 'fg-fill-hi';
  const extra = opts.opacity !== undefined ? ` opacity="${n(opts.opacity)}"` : '';
  return `<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(opts.r ?? 7)}"${extra}></rect>`;
}

export const P = (x, y) => ({ x, y });

/* Wraps a drawing in the <figure> the stylesheet expects. `--vb` is the width
   the figure was drawn at, which is what stops it being scaled down until its
   own labels stop being readable. */
export function figure({ viewBox, wide = true, alt, caption, note, body }) {
  const [, , w] = viewBox.split(/\s+/).map(Number);
  const cls = wide ? 'notes-figure notes-figure--wide' : 'notes-figure';
  const noteHtml = note ? `<span class="notes-figure-note">${note}</span>` : '';
  return `<figure class="${cls}" style="--vb:${n(w)}">` +
    `<svg viewBox="${viewBox}" role="img" aria-label="${esc(alt)}">${body}</svg>` +
    `<figcaption>${caption}${noteHtml}</figcaption>` +
    `</figure>`;
}
