/* The station run's patient (nremt/assets/station-patient.js): tourniquet
   placement, the BVM breath timing, and what the end of a run marks as missed. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const window = {};
vm.runInNewContext(readFileSync('nremt/assets/station-patient.js', 'utf8'), { window, document: {}, performance: { now: () => 0 } });
const SP = window.NremtStationPatient, P = SP.pure, L = P.L, IN = P.PX_PER_IN;
const def = key => P.DEFS.find(d => d.key === key);
// a run where the given ids were ticked in this order
const run = ids => Object.fromEntries(ids.map((id, i) => [id, i + 1]));

test('stations are found by the names the page uses', () => {
  assert.equal(SP.find('Bleeding Control / Shock Management').key, 'bleeding');
  assert.equal(SP.find('BVM Ventilation of an Apneic Adult').key, 'bvm');
  assert.equal(SP.find('Patient Assessment — Trauma'), null);
});

test('tourniquet: 2 to 3 inches above the wound stops the bleed', () => {
  for (const inches of [2, 2.5, 3]) {
    const r = P.placeTourniquet(L.wound[0], L.wound[1] - inches * IN);
    assert.equal(r.stops, true, inches + ' in');
    assert.equal(r.kind, 'ideal');
  }
});

test('tourniquet: high on the thigh stops it, and says programs differ', () => {
  const r = P.placeTourniquet(L.wound[0], L.thighTop + 8);
  assert.equal(r.stops, true);
  assert.equal(r.kind, 'high');
  assert.match(r.msg, /high and tight/i);
});

test('tourniquet: below the wound, on it, over the knee, the groin or the wrong leg does not', () => {
  assert.equal(P.placeTourniquet(L.wound[0], L.wound[1] + 30).kind, 'distal');
  assert.equal(P.placeTourniquet(L.wound[0], L.wound[1]).kind, 'over');
  assert.equal(P.placeTourniquet(L.wound[0], (L.kneeTop + L.kneeBottom) / 2).kind, 'joint');
  assert.equal(P.placeTourniquet(L.wound[0], L.thighTop - 20).kind, 'groin');
  assert.equal(P.placeTourniquet(300, L.wound[1] - 40).kind, 'limb');
  for (const y of [L.wound[1] + 30, L.wound[1], (L.kneeTop + L.kneeBottom) / 2])
    assert.equal(P.placeTourniquet(L.wound[0], y).stops, false);
});

test('breaths: every 5 to 6 s over about a second is on rate; faster fills the stomach', () => {
  assert.equal(JSON.stringify(P.breath(5.5, 1)), JSON.stringify({ rate: 'ok', vol: 'ok', gastric: 0 }));
  assert.equal(P.breath(6, 1).rate, 'ok');
  assert.equal(P.breath(2, 1).rate, 'fast');
  assert.ok(P.breath(2, 1).gastric > 0);
  assert.equal(P.breath(7, 1).rate, 'slow');
  assert.equal(P.breath(4.4, 1).rate, 'fast');
  assert.equal(P.breath(null, 1).rate, 'first');
  assert.equal(P.breath(5.5, 2.5).vol, 'long');
  assert.ok(P.breath(5.5, 2.5).gastric > 0);
  assert.equal(P.breath(5.5, 0.1).vol, 'short');
});

const ideal = () => P.placeTourniquet(L.wound[0], L.wound[1] - 2.5 * IN);

test('bleeding: the sheet order leaves nothing on the patient', () => {
  const d = def('bleeding');
  const m = d.misses({ done: run(d.steps.map(s => s.id)), tq: ideal() });
  assert.equal(m.length, 0, JSON.stringify(m));
});

test('bleeding: no tourniquet leaves it bleeding; a misplaced one too', () => {
  const d = def('bleeding');
  let m = d.misses({ done: run(['bsi', 'pressure', 'position', 'o2', 'warm', 'transport']) });
  assert.ok(m.some(x => x.key === 'bleed' && x.sev === 'bad'));
  m = d.misses({ done: run(['bsi', 'pressure', 'tq', 'position', 'o2', 'warm', 'transport']), tq: P.placeTourniquet(L.wound[0], L.wound[1] + 30) });
  assert.ok(m.some(x => x.key === 'bleed'));
});

test('bleeding: BSI after touching the patient, and shock care before control, are shown', () => {
  const d = def('bleeding');
  const m = d.misses({ done: run(['pressure', 'bsi', 'o2', 'tq', 'position', 'warm', 'transport']), tq: ideal() });
  assert.ok(m.some(x => x.key === 'bsi'));
  assert.ok(m.some(x => x.key === 'abc'));
});

test('bleeding: tourniquet first is a note about the sheet, not a critical mark', () => {
  const d = def('bleeding');
  const m = d.misses({ done: run(['bsi', 'tq', 'position', 'o2', 'warm', 'transport']), tq: ideal() });
  const o = m.find(x => x.key === 'order');
  assert.equal(o.sev, 'warn');
  assert.ok(!m.some(x => x.key === 'bleed'));
});

test('BVM: the sheet order leaves nothing on the patient', () => {
  const d = def('bvm');
  const m = d.misses({ done: run(d.steps.map(s => s.id)), breaths: { n: 0 } });
  assert.equal(m.length, 0, JSON.stringify(m));
});

test('BVM: ventilating before suction is marked critical', () => {
  const d = def('bvm');
  const m = d.misses({ done: run(['bsi', 'resp', 'help', 'check', 'open', 'prep', 'opa', 'vent1', 'suction', 'recheck', 'oxy', 'vent2']), breaths: { n: 0 } });
  const s = m.find(x => x.key === 'suction');
  assert.equal(s.sev, 'bad');
  assert.match(s.text, /through vomit/);
});

test('BVM: rate is judged over the run, with the tapping tolerance', () => {
  const d = def('bvm'), all = run(d.steps.map(s => s.id));
  const fast = d.misses({ done: all, breaths: { n: 6, fast: 5, slow: 0, long: 0, gaps: [3, 3, 3, 3, 3] } });
  assert.equal(fast.find(x => x.key === 'rate').sev, 'bad');
  assert.match(fast.find(x => x.key === 'rate').text, /about 20 a minute/);
  const slow = d.misses({ done: all, breaths: { n: 5, fast: 0, slow: 4, long: 0, gaps: [7.5, 7.5, 7.5, 7.5] } });
  assert.equal(slow.find(x => x.key === 'rate').sev, 'bad');
  // one quick gap among even ones is a note, not a critical mark
  const one = d.misses({ done: all, breaths: { n: 6, fast: 1, slow: 0, long: 0, gaps: [5.5, 5.5, 4, 5.8, 5.5] } });
  assert.equal(one.find(x => x.key === 'rate').sev, 'warn');
  assert.equal(Math.round(P.rateOf({ gaps: [5, 6] }).perMin), 11);
});

test('BVM: first breath more than 30 s after suctioning is marked', () => {
  const d = def('bvm');
  const m = d.misses({ done: run(d.steps.map(s => s.id)), at: { suction: 20, vent1: 55 }, breaths: { n: 0 } });
  assert.equal(m.find(x => x.key === 't30').sev, 'bad');
});

test('BVM: skipped help, opening, suction prep and recheck all show', () => {
  const d = def('bvm');
  const m = d.misses({ done: run(['bsi', 'resp', 'check', 'suction', 'open2', 'opa', 'vent1', 'oxy', 'vent2']), breaths: { n: 0 } });
  for (const k of ['help', 'open', 'prep', 'recheck']) assert.ok(m.some(x => x.key === k), k);
});

test('BSI after a step that does not touch the patient is not "touched bare"', () => {
  const d = def('bvm');
  const m = d.misses({ done: run(['help', 'bsi', 'resp', 'check', 'open', 'prep', 'suction', 'open2', 'opa', 'vent1', 'recheck', 'oxy', 'vent2']), breaths: { n: 0 } });
  assert.ok(!m.some(x => x.key === 'bsi'));
  const m2 = d.misses({ done: run(['resp', 'bsi', 'help', 'check', 'open', 'prep', 'suction', 'open2', 'opa', 'vent1', 'recheck', 'oxy', 'vent2']), breaths: { n: 0 } });
  assert.ok(m2.some(x => x.key === 'bsi'));
});

test('every step has a focus the station defines, and ids are unique', () => {
  for (const d of P.DEFS) {
    const ids = d.steps.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length, d.key);
    for (const s of d.steps) assert.ok(s.focus in d.focus, d.key + ' ' + s.id);
    assert.ok(d.notes.length >= 3, d.key + ' notes');
  }
});
