/* The A&P graph reader's Explore readings and place-the-curve answers
   (anatomy-physiology/assets/tools/graphs.js, AnpGraphMath). Readings must be
   the curve the chart draws, pass through every data point, and never invent
   values outside the data; a drag must map to exactly one option. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('../../', import.meta.url);
const read = p => readFileSync(new URL(p, ROOT), 'utf8');
function math() {
  const window = {};
  vm.runInNewContext(read('anatomy-physiology/assets/tools/graphs.js'), { window, document: { getElementById: () => null } });
  return window.AnpGraphMath;
}
const DATA = JSON.parse(read('anatomy-physiology/data/tools/graphs.json'));

test('every curve passes through its own data points and stays within them', () => {
  const M = math();
  for (const g of DATA.graphs) for (const p of g.panels) for (const s of p.series || []) {
    const f = M.seriesFn(s);
    if (!f) continue;   // loops: read segment by segment in the page
    for (const [x, y] of s.pts) assert.ok(Math.abs(f(x) - y) < 1e-6, `${g.id}/${s.id} at ${x}`);
    // monotone interpolation: between two points the reading never leaves their range
    for (let i = 1; i < s.pts.length; i++) {
      const [x0, y0] = s.pts[i - 1], [x1, y1] = s.pts[i];
      for (let k = 1; k < 10; k++) {
        const y = f(x0 + (x1 - x0) * k / 10);
        assert.ok(y >= Math.min(y0, y1) - 1e-6 && y <= Math.max(y0, y1) + 1e-6, `${g.id}/${s.id} overshoots between ${x0} and ${x1}`);
      }
    }
    assert.equal(f(s.pts[0][0] - 1), null);
  }
});

test('oxygen–hemoglobin readings match the published curve', () => {
  const M = math();
  const g = DATA.graphs.find(x => x.id === 'oxygen-hemoglobin');
  const f = M.seriesFn(g.panels[0].series[0]);
  assert.equal(Math.round(f(40)), 75);
  assert.equal(Math.round(f(27)), 50);
  const right = g.questions.find(q => q.id === 'right-shift').overlay.series[0];
  assert.equal(Math.round(M.seriesFn(right)(40)), 53);
});

test('option text to directions', () => {
  const M = math();
  assert.deepEqual(JSON.parse(JSON.stringify(M.dirsOf('Right: lower saturation at each tissue PO2'))), ['right']);
  assert.deepEqual(JSON.parse(JSON.stringify(M.dirsOf('To the left, with a P50 near 19 mm Hg'))), ['left']);
  assert.deepEqual(JSON.parse(JSON.stringify(M.dirsOf('It shifts up and left: more ventilation'))), ['up', 'left']);
  assert.deepEqual(JSON.parse(JSON.stringify(M.dirsOf('It does not shift; only PO2 matters'))), ['none']);
  assert.deepEqual(JSON.parse(JSON.stringify(M.dirsOf('Left along the same line, toward a lower potassium'))), []);
  assert.deepEqual(JSON.parse(JSON.stringify(M.dirsOf('It flattens'))), []);
});

test('placeable shift questions: right answer is a direction, options never share one', () => {
  const M = math();
  let n = 0;
  for (const g of DATA.graphs) for (const q of g.questions) {
    const p = M.placeable(g, q);
    if (!p) continue;
    n++;
    const seen = new Set();
    for (const ds of p.dirs) for (const d of ds) { assert.ok(!seen.has(d), `${g.id}/${q.id}: ${d} twice`); seen.add(d); }
    const right = p.dirs[q.correct];
    // the drag that names the right direction picks the right option
    const v = { left: [-50, 0], right: [50, 0], up: [0, -50], down: [0, 50] }[right[0]];
    assert.equal(M.pickByDrag(p.dirs, v[0], v[1]).i, q.correct, `${g.id}/${q.id}`);
    assert.ok(M.pairOf(g, q.overlay.series[0]), `${g.id}/${q.id} has a base curve`);
  }
  assert.ok(n >= 8, `expected several placeable questions, got ${n}`);
});

test('a small drag means "stays put"', () => {
  const M = math();
  assert.deepEqual({ ...M.pickByDrag([['right'], ['left'], ['none']], 5, 3) }, { i: 2, dir: 'none' });
  assert.equal(M.pickByDrag([['right'], ['left']], 0, 40).i, -1);
});

test('a "What if" curve replaces the curve it is about (review 2026-10)', () => {
  const M = math();
  const want = {
    'breath-pressures/ipp-ptx': 'intrapleural', 'forced-expiration/albuterol': 'patient-a', 'conduction-velocity/demy': 'mid',
    'hypnogram/cut': 'stage', 'antibody-response/new-igg': 'igg', 'lactose-breath-test/tablets': 'low', 'lactose-breath-test/antibiotic': 'low',
    'ur-gfr-autoregulation/blocked': 'with', 'ur-gfr-autoregulation/symp': 'with', 'ur-glucose-tm/excr-drug': 'excreted',
    'ur-nephron-osmolarity/low-urea': 'high-adh', 'mt-stress-relaxation/sm2': 'sm', 'audiogram/fluid': 'healthy', 'membrane-potential/ek-hk': null
  };
  for (const g of DATA.graphs) for (const q of g.questions) for (const os of (q.overlay && q.overlay.series) || []) {
    const panel = g.panels[os.panel || 0];
    if (os.from) assert.ok(os.from === 'none' || panel.series.some(s => s.id === os.from), `${g.id}/${os.id}: from names no curve on its panel`);
    const k = `${g.id}/${os.id}`;
    if (k in want) { const b = M.pairOf(g, os); assert.equal(b ? b.id : null, want[k], k); }
  }
});
