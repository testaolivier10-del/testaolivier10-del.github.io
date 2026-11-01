/* AP® Calculus BC: the 6.14 flowchart with BC's two extra questions.

   AB's figure (scripts/apcalc-figures/unit-6.mjs, calculus/figures/integration-flowchart.svg)
   asks four questions. BC's 6.14 notes add two (integration by parts, linear
   partial fractions), so BC registers its own figure under the same id
   (calculus-bc/data/figures/choosing-integration-methods.json): BC's figures win on a clash
   (loadCourse), so BC pages show this one and AB's pages and figure stay as they are.
   Same layout, sizes and colours as AB's; the two BC rows are drawn in the BC accent
   and tagged "BC".

     node scripts/apcalcbc-figures/integration-flowchart.mjs            writes calculus-bc/figures/integration-flowchart.svg
     node scripts/apcalcbc-figures/integration-flowchart.mjs --out DIR   writes to DIR instead (preview) */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2);
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(ROOT, 'calculus-bc', 'figures');

const INK = '#1F2A28', CRIMSON = '#8C1036', GREEN = '#009E73', VERM = '#D55E00', MUTED = '#5B6664';
const VIOLET = '#5A1E96', VIOLET_TINT = '#F1E7FA';   // the BC accent (docs/apcalcbc-spec.md decision 7)
const FONT = 'Arial, Helvetica, sans-serif';
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function text(x, y, s, o = {}) {
  const size = o.size || 15, fill = o.color || INK, anchor = o.anchor || 'start', weight = o.bold ? 'bold' : 'normal';
  return `<text x="${r2(x)}" y="${r2(y)}" font-family="${FONT}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}"><tspan >${esc(s)}</tspan></text>`;
}
function svg(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#fff"/>
${body.join('\n')}
</svg>
`;
}

const id = 'integration-flowchart';
const W = 760, H = 780, b = [];
const box = (x, y, w, h, lines, o = {}) => {
  const out = [`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.round ? 12 : 6}" fill="${o.fill || '#fff'}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 1.6}"/>`];
  const lh = 19, y0 = y + h / 2 - (lines.length - 1) * lh / 2 + 5;
  lines.forEach((l, i) => out.push(text(x + w / 2, y0 + i * lh, l, { anchor: 'middle', size: 14.5, color: o.color || INK })));
  return out.join('');
};
const arrow = (x1, y1, x2, y2, label, side = 1) => {
  const a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 9 * Math.cos(a), hy = y2 - 9 * Math.sin(a);
  const p = `${r2(x2)},${r2(y2)} ${r2(hx - 4.5 * Math.sin(a))},${r2(hy + 4.5 * Math.cos(a))} ${r2(hx + 4.5 * Math.sin(a))},${r2(hy - 4.5 * Math.cos(a))}`;
  const vert = Math.abs(y2 - y1) > Math.abs(x2 - x1);
  const lab = label ? text((x1 + x2) / 2 + (vert ? 8 * side : 0), (y1 + y2) / 2 + (vert ? 5 : -7), label, { size: 13.5, bold: true, anchor: vert ? (side > 0 ? 'start' : 'end') : 'middle', color: label === 'yes' ? GREEN : VERM }) : '';
  return `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(hx)}" y2="${r2(hy)}" stroke="${INK}" stroke-width="1.6"/><polygon points="${p}" fill="${INK}"/>${lab}`;
};

const qx = 40, qw = 330, rx = 450, rw = 280, step = 110, top = 60;
b.push(text(W / 2, 30, 'Choosing a technique: ask the questions in order', { size: 17, bold: true, anchor: 'middle' }));
const rows = [
  { q: ['1. Is it a basic form, or a sum of', 'basic forms after rewriting powers?'], a: ['Basic rules: power, ln|x|, eˣ,', 'sin, cos, sec², 1/(1 + x²)'] },
  { q: ['2. Is there an inside function u', 'whose derivative is also a factor?'], a: ['Substitution: let u = inside,', 'du = u′ dx; change the limits'] },
  { q: ['3. Rational, and the top has degree', '≥ the bottom’s degree?'], a: ['Long division first, then', 'basic rules or substitution'] },
  { q: ['4. A quadratic on the bottom', 'with no real zeros?'], a: ['Complete the square, then', 'arctan (with substitution)'] },
  { bc: true, q: ['5. A product with a factor that gets', 'simpler when differentiated?'], a: ['Integration by parts: u = that', 'factor (ln or arctan goes in u)'] },
  { bc: true, q: ['6. Does the bottom factor into', 'distinct linear factors?'], a: ['Linear partial fractions:', 'A/(x − a) + B/(x − b), then ln'] },
];
rows.forEach((r, i) => {
  const y = top + i * step;
  b.push(box(qx, y, qw, 72, r.q, r.bc ? { fill: VIOLET_TINT, stroke: VIOLET } : { fill: '#FCE8EE', stroke: CRIMSON }));
  b.push(box(rx, y, rw, 72, r.a, { round: true, stroke: GREEN, sw: 1.8 }));
  b.push(arrow(qx + qw, y + 36, rx, y + 36, 'yes'));
  if (i < rows.length - 1) b.push(arrow(qx + qw / 2, y + 72, qx + qw / 2, y + step, 'no', 1));
  if (r.bc) b.push(`<rect x="${qx - 30}" y="${y + 24}" width="26" height="24" rx="4" fill="${VIOLET}"/>` + text(qx - 17, y + 41, 'BC', { size: 12.5, bold: true, color: '#fff', anchor: 'middle' }));
});
const last = top + (rows.length - 1) * step + 72;
b.push(text(qx, last + 40, 'If none fits, rewrite the integrand (expand, split a fraction, use an identity) and start again.', { size: 13.5, color: MUTED }));
b.push(text(qx, last + 62, 'Questions 5 and 6 are on the BC exam only.', { size: 13.5, color: VIOLET, bold: true }));

const desc = 'A flowchart of six questions asked in order, each with a yes arrow to a technique. 1: Is it a basic form, or a sum of basic forms after rewriting powers? Yes: basic rules (power, ln absolute x, e to the x, sine, cosine, secant squared, 1 over 1 + x squared). No: 2: Is there an inside function u whose derivative is also a factor? Yes: substitution, with du and new limits. No: 3: Is it rational with the top degree at least the bottom degree? Yes: long division first. No: 4: Is there a quadratic on the bottom with no real zeros? Yes: complete the square, then arctan. No: 5 (BC only): Is it a product with a factor that gets simpler when differentiated? Yes: integration by parts, with that factor as u; a logarithm or inverse tangent goes in u. No: 6 (BC only): Does the bottom factor into distinct linear factors? Yes: linear partial fractions, A over x minus a plus B over x minus b, then logarithms. If none fits, rewrite the integrand and start again.';
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, `${id}.svg`), svg(id, W, H, 'A decision path for choosing an antidifferentiation technique, with the two BC questions', desc, b));
console.log(`BC 6.14 flowchart written to ${OUT} (${W} x ${H})`);
