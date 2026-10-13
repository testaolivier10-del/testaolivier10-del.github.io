/* ApPhysScene (physics/assets/tools/phys-scene.js), the shared scene helpers
   every trainer draws with: arrows and vectors as accessible SVG strings,
   the FBD label convention, physics-to-SVG coordinates, and an animation
   loop that respects reduced motion. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const load = () => createBrowser().load('physics/assets/tools/phys-scene.js').ApPhysScene;

test('svg: role="img" and a real label, or it refuses', () => {
  const S = load();
  const s = S.svg(400, 200, 'A block on a ramp with three forces drawn', '<g/>');
  assert.match(s, /^<svg class="phys-scene" viewBox="0 0 400 200" role="img" aria-label="A block on a ramp with three forces drawn">/);
  assert.throws(() => S.svg(10, 10, 'short'), /20\+ characters/);
});

test('arrow: a shaft, a head at the tip, a label with a subscript; zero length is a dot', () => {
  const S = load();
  const a = S.arrow(100, 100, 0, 60, { cls: 'f-grav', label: 'F_g' });
  assert.match(a, /<g class="phys-arrow f-grav">/);
  assert.match(a, /<polygon points="100,160 /, 'the head ends at the tip (y down in SVG)');
  assert.match(a, /F<tspan class="sub"[^>]*>g<\/tspan>/);
  assert.match(S.arrow(5, 5, 0, 0, { cls: 'net' }), /^<circle class="phys-arrow net"/);
  assert.match(S.arrow(0, 0, 50, 0, { dashed: true }), /stroke-dasharray/);
});

test('vector and toSvg: physics y up becomes SVG y down', () => {
  const S = load();
  assert.deepEqual(JSON.parse(JSON.stringify(S.toSvg(2, 1, { x0: 50, y0: 300, ppm: 100 }))), { x: 250, y: 200 });
  assert.match(S.vector({ x: 10, y: 10 }, { x: 0, y: 2 }, 10), /points="10,-10 /, 'an upward vector points up the screen');
});

test('forceLabel follows the authoring guide: type, agent on object', () => {
  assert.equal(load().forceLabel('F_g', 'Earth', 'block'), 'F_g, Earth on block');
});

test('loop: steps with dt in seconds, capped; reduced motion jumps to the end state', () => {
  const b = createBrowser();
  const frames = [];
  b.window.requestAnimationFrame = f => { frames.push(f); return frames.length; };
  b.window.cancelAnimationFrame = () => {};
  const S = b.load('physics/assets/tools/phys-scene.js').ApPhysScene;
  const seen = [];
  const L = S.loop((dt, t) => { seen.push([dt, t]); });
  L.start();
  frames.shift()(1000); frames.shift()(1016); frames.shift()(2000);
  assert.equal(seen[0][0], 0);
  assert.ok(Math.abs(seen[1][0] - 0.016) < 1e-9);
  assert.equal(seen[2][0], 0.05, 'a long gap is capped at 0.05 s');
  L.stop();
  assert.equal(L.running(), false);
  // Reduced motion: no frames, one still call with the whole duration.
  const r = createBrowser();
  r.window.matchMedia = () => ({ matches: true, addEventListener(){}, removeEventListener(){} });
  let rafCalls = 0; r.window.requestAnimationFrame = () => { rafCalls++; return 1; };
  const S2 = r.load('physics/assets/tools/phys-scene.js').ApPhysScene;
  let still = null, ended = false;
  S2.loop(() => { throw new Error('must not animate'); }, { duration: 3, still: t => { still = t; }, onEnd: () => { ended = true; } }).start();
  assert.equal(rafCalls, 0);
  assert.equal(still, 3);
  assert.ok(ended);
});
