/* The NREMT case tools (docs/tools-upgrade-notes/nremt-cases.md): every number
   they show must come from a page that already states it. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');

function sandbox(){
  const s = { console, Math, Object, Array, JSON, String, Number, Date, isFinite, parseInt, parseFloat,
    setTimeout(){}, clearTimeout(){}, setInterval(){}, clearInterval(){}, requestAnimationFrame(){ return 0; },
    cancelAnimationFrame(){}, document: { createElement(){ return {}; } } };
  s.window = s;
  vm.createContext(s);
  return s;
}
function loadSim(){
  const s = sandbox();
  vm.runInContext(read('nremt/assets/scenario-monitor.js'), s);
  return s.NremtSim;
}
function loadScenarios(){
  const h = read('nremt/scenario-sim.html');
  const src = h.slice(h.indexOf('const SCENARIOS ='), h.indexOf('\nlet currentScenario'));
  const s = sandbox();
  vm.runInContext(src + '\nthis.S = SCENARIOS;', s);
  return s.S;
}
const strip = (x) => x.replace(/<[^>]+>/g, '').replace(/&ndash;/g, '-').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

/* The monitor's ranges are the reference card's table, row for row. */
test('monitor ranges match reference-cards.html', () => {
  const { REF, SPO2_LOW } = loadSim().pure;
  const html = read('nremt/reference-cards.html');
  const table = html.slice(html.indexOf('Pediatric vital signs by age'), html.indexOf('The formula worth knowing'));
  const rows = [...table.matchAll(/<tr><td>([\s\S]*?)<\/tr>/g)].map((m) =>
    m[1].split(/<\/td><td[^>]*>/).map(strip));
  assert.equal(rows.length, REF.length, 'one monitor range per table row');
  rows.forEach((cells, i) => {
    const r = REF[i];
    const nums = (c) => (c.match(/\d+/g) || []).map(Number);
    assert.deepEqual(nums(cells[1]), [...r.hr], `${r.key} heart rate`);
    assert.deepEqual(nums(cells[2]), [...r.rr], `${r.key} respiratory rate`);
    assert.deepEqual(nums(cells[3]), [...r.sbp], `${r.key} systolic`);
  });
  assert.match(html, /70 \+ \(2 &times; age in years\)/, 'the 70 + 2 x age formula is still on the card');
  assert.match(read('nremt/formulary.html'), new RegExp('under ' + SPO2_LOW + '% on room air'), 'SpO2 line from the formulary');
});

test('age bands and flags', () => {
  const p = loadSim().pure;
  assert.equal(p.ageMonths('A 3-month-old boy'), 3);
  assert.equal(p.ageMonths('A 28-year-old man'), 336);
  assert.equal(p.ageMonths('a term newborn'), 0);
  assert.equal(p.refFor(48).key, 'preschool');
  assert.equal(p.sbpLow(48), 78, 'the card: a 4-year-old below about 78 is hypotensive');
  assert.equal(p.judge('hr', 118, 336), 'high');
  assert.equal(p.judge('hr', 118, 48), 'normal');
  assert.equal(p.judge('sbp', 92, 336), 'normal');
  assert.equal(p.judge('sbp', 82, 336), 'low');
  assert.equal(p.judge('spo2', 93, 336), 'low');
  assert.equal(p.judge('spo2', 94, 336), 'normal');
});

test('every scenario node vitals line parses, and every case has an age', () => {
  const p = loadSim().pure;
  for(const sc of loadScenarios()){
    const start = sc.nodes[sc.startNode].text;
    if(sc.id !== 's25') assert.notEqual(p.ageMonths(start), null, `${sc.id}: no age in the opening line`);
    for(const [id, n] of Object.entries(sc.nodes)){
      if(!n.vitals) continue;
      const v = p.parseVitals(n.vitals);
      // Every number in the line is either on the monitor or kept as a note.
      for(const num of n.vitals.match(/\d+/g) || []){
        const shown = [v.hr, v.sys, v.dia, v.rr, v.spo2].includes(+num) || v.notes.join(' ').includes(num) || /lying|sitting|SpO|₂/.test(n.vitals);
        assert.ok(shown, `${sc.id}/${id}: ${num} in "${n.vitals}" would vanish`);
      }
    }
  }
});

/* Drift only where the case itself prints worse vitals for waiting. */
test('hesitation drift only at forks where the case says waiting costs', () => {
  const sim = loadSim();
  const byNode = {};
  for(const sc of loadScenarios()) for(const [id, n] of Object.entries(sc.nodes)) byNode[id] = n;
  for(const [fork, to] of Object.entries(sim.HESITATE)){
    const f = byNode[fork], t = byNode[to];
    assert.ok(f && t, `${fork} -> ${to} exists`);
    const ch = f.choices.find((c) => c.next === to);
    assert.ok(ch && ch.consequence, `${fork}: the drift target must be a consequence choice`);
    assert.match(ch.text, /wait|first|before|see if|trust|monitor|without urgency|continue/i, `${fork}: "${ch.text}" is not a waiting choice`);
    const a = sim.pure.parseVitals(f.vitals), b = sim.pure.parseVitals(t.vitals);
    const worse = (b.sys != null && a.sys != null && b.sys < a.sys) || (b.spo2 != null && a.spo2 != null && b.spo2 < a.spo2);
    assert.ok(worse, `${fork}: ${to} is not worse`);
    // Never past the case's own numbers.
    const end = sim.pure.driftAt(a, b, 1e9);
    for(const k of ['hr', 'sys', 'spo2']) if(a[k] != null && b[k] != null) assert.equal(end[k], b[k]);
    const none = sim.pure.driftAt(a, b, sim.pure.GRACE_MS - 1);
    assert.equal(none.f, 0, 'no drift inside the grace period');
  }
});

test('findings quote the case, never invent', () => {
  const p = loadSim().pure;
  const f = p.findings([{ text: 'Her right leg is shortened and rotated outward and she winces when she moves. She lives alone.', vitals: 'HR 58', now: true }]);
  assert.equal(f.legs.length, 1);
  assert.deepEqual([...f.legs[0].dcap], ['D', 'T']);
  assert.equal(f.head.length, 0);
});

/* Give or withhold: every deciding phrase is on that drug's own card. */
test('formulary give/withhold cards quote their drug card', () => {
  const s = sandbox();
  s.document.getElementById = () => null;
  vm.runInContext(read('nremt/assets/formulary-cards.js').replace("if(!mount) return;", "if(!mount){ window.NremtFormularyCards = { CARDS: CARDS }; return; }"), s);
  const cards = s.NremtFormularyCards.CARDS;
  assert.ok(cards.length >= 15);
  const html = read('nremt/formulary.html');
  const norm = (x) => x.replace(/<[^>]+>/g, '').replace(/&rsquo;|&lsquo;/g, "'").replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    .replace(/&#8322;/g, '₂').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  const ids = new Set();
  for(const c of cards){
    assert.ok(!ids.has(c.id), `duplicate ${c.id}`); ids.add(c.id);
    const at = html.indexOf('<h2>' + c.drug + '</h2>');
    assert.ok(at > 0, `${c.id}: no card for ${c.drug}`);
    const card = norm(html.slice(at, html.indexOf('<div class="drug">', at + 10) > 0 ? html.indexOf('<div class="drug">', at + 10) : html.indexOf('</div>\n\n\n', at)));
    assert.ok(card.includes(c.rule.replace(/'/g, "'")), `${c.id}: "${c.rule}" is not on the ${c.drug} card`);
    assert.equal(typeof c.give, 'boolean');
  }
  assert.ok(cards.some((c) => c.give) && cards.some((c) => !c.give));
});

test('mnemonic self-check accepts recall, not just spelling', () => {
  const s = sandbox();
  s.document.querySelectorAll = () => ({ forEach(){} });
  vm.runInContext(read('nremt/assets/mnemonic-check.js'), s);
  const ok = s.NremtMnemonicCheck.accepts;
  assert.ok(ok('Signs/Symptoms', 'symptoms'));
  assert.ok(ok('Allergies', 'allergy'));
  assert.ok(ok('Medications', 'meds'));
  assert.ok(ok('Pertinent past medical history', 'past history'));
  assert.ok(!ok('Last oral intake', 'lunch'));
  assert.ok(!ok('Events', ''));
  assert.ok(!ok('Deformities', 'd'));
});

test('every mnemonic scenario link points at a case that uses it', () => {
  const html = read('nremt/mnemonics.html');
  const ids = new Set(loadScenarios().map((x) => x.id));
  const links = [...html.matchAll(/data-scenario="(s\d+)"/g)].map((m) => m[1]);
  assert.ok(links.length >= 10);
  for(const id of links) assert.ok(ids.has(id), `${id} is not a scenario`);
});
