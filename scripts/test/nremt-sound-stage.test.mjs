/* The sound trainer's chest map (nremt/assets/sound-stage.js) and the timing
   table it shares with the generated heart sounds (sound-bank.js). What is
   pinned: the picture is drawn from the same timing as the sound, every
   "where to listen" answer is a real site, each finding is loudest where the
   page says it is, and the timing quiz's answer zones contain the sound they
   ask about and not the others' events. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function load() {
  const window = {};
  const ctx = { window, localStorage: { getItem() { return null; }, setItem() {} }, matchMedia: () => ({ matches: false }) };
  vm.runInNewContext(readFileSync('nremt/assets/sound-bank.js', 'utf8'), ctx);
  vm.runInNewContext(readFileSync('nremt/assets/sound-stage.js', 'utf8'), ctx);
  return { Bank: window.LevlSoundBank, P: window.SoundStage.pure };
}
const KINDS = ['normal', 's3', 's4', 'split-s2', 'systolic-murmur', 'diastolic-murmur'];

test('heart timing: S2 a fixed systole after S1, S3 after S2, S4 before the next S1', () => {
  const { Bank } = load();
  for (const bpm of [60, 72, 100]) {
    const n = Bank.heartEvents('normal', bpm);
    assert.equal(n.points.find(p => p.key === 'S2').at, 0.32);
    assert.ok(Math.abs(n.cycle - 60 / bpm) < 1e-9);
    const s3 = Bank.heartEvents('s3', bpm).points.find(p => p.key === 'S3').at;
    assert.ok(s3 > 0.32 && s3 < 0.32 + 0.2, 'S3 in early diastole');
    const s4 = Bank.heartEvents('s4', bpm).points.find(p => p.key === 'S4').at;
    assert.ok(s4 > n.cycle - 0.2 && s4 < n.cycle, 'S4 in late diastole');
    const sp = Bank.heartEvents('split-s2', bpm).points;
    assert.ok(sp.find(p => p.key === 'P2').at > sp.find(p => p.key === 'A2').at, 'A2 before P2');
    const sm = Bank.heartEvents('systolic-murmur', bpm).spans[0];
    assert.ok(sm.from > 0 && sm.to < 0.32, 'systolic murmur inside systole');
    const dm = Bank.heartEvents('diastolic-murmur', bpm).spans[0];
    assert.ok(dm.from > 0.32 && dm.to < n.cycle, 'diastolic murmur inside diastole');
  }
});

test('the drawn trace has energy at each event the sound plays', () => {
  const { Bank } = load();
  const sr = 4000;
  for (const k of KINDS) {
    const ev = Bank.heartEvents(k, 72);
    const d = Bank.heartData(k, 72, 1, {}, sr);
    for (const p of ev.points) {
      const i = Math.floor((p.at + 0.01) * sr);
      const peak = Math.max(...Array.from(d.slice(i, i + 80), Math.abs));
      assert.ok(peak > 0.05, `${k}: nothing at ${p.key}`);
    }
  }
});

test('site mix: S1 loudest at the apex, S2 at the base, P2 at the pulmonic area', () => {
  const { P } = load();
  const m = id => P.heartMix('split-s2', P.SITES.find(s => s.id === id));
  assert.ok(m('mitral').s1 > m('aortic').s1);
  assert.ok(m('aortic').s2 > m('mitral').s2);
  const p2 = ['aortic', 'erb', 'tricuspid', 'mitral'].map(id => m(id).p2);
  assert.ok(p2.every(v => v < m('pulmonic').p2));
});

test('each finding is strongest at the site the page names as its best', () => {
  const { P } = load();
  const sounds = {
    'heart-normal': { synth: 'normal' }, 'heart-s3': { synth: 's3' }, 'heart-s4': { synth: 's4' },
    'heart-split-s2': { synth: 'split-s2' }, 'heart-systolic-murmur': { synth: 'systolic-murmur' },
    'heart-diastolic-murmur': { synth: 'diastolic-murmur' }, wheeze: { id: 'wheeze' }, crackles: { id: 'crackles' }, stridor: { id: 'stridor' },
  };
  for (const [id, snd] of Object.entries(sounds)) {
    const best = P.BEST[id];
    assert.ok(best, id);
    const top = Math.max(...P.SITES.map(s => P.strength(snd, s)));
    for (const at of best.at) assert.equal(P.strength(snd, P.SITES.find(s => s.id === at)), top, `${id} at ${at}`);
  }
});

test('every where-to-listen answer is a real site, and lung phases are the taught ones', () => {
  const { P } = load();
  const ids = new Set(P.SITES.map(s => s.id));
  for (const q of P.WHERE) for (const id of q.ok) assert.ok(ids.has(id), `${q.id}: ${id}`);
  assert.equal(P.PHASE.wheeze, 'exp');
  assert.equal(P.PHASE.crackles, 'insp');
  assert.equal(P.PHASE.stridor, 'insp');
  assert.ok(Math.abs(P.INSP / (P.BREATH - P.INSP) - 0.5) < 1e-9, 'I:E 1:2');
});

test('timing zones hold their own extra sound and miss S1', () => {
  const { Bank, P } = load();
  for (const q of P.TIMING) {
    const kind = { 's3': 's3', 's4': 's4', 'split': 'split-s2', 'sys': 'systolic-murmur', 'dia': 'diastolic-murmur' }[q.id];
    const ev = Bank.heartEvents(kind, 72);
    const x = ev.points.find(p => !['S1', 'S2', 'A2'].includes(p.key));
    const t = x ? x.at : (ev.spans[0].from + ev.spans[0].to) / 2;
    const tt = t > ev.cycle - 0.25 ? t - ev.cycle : t; // the strip starts 0.25 s before S1
    assert.ok(q.zone(tt, ev), `${q.id} zone misses its sound`);
    assert.ok(!q.zone(0, ev), `${q.id} zone includes S1`);
  }
});

test('each lung finding opens at its classic site and says so plainly elsewhere', () => {
  const { P } = load();
  const site = id => P.SITES.find(s => s.id === id);
  assert.equal(P.defaultSite({ id: 'stridor' }).id, 'trachea');
  assert.equal(P.defaultSite({ id: 'crackles' }).id, 'back-rl', 'crackles: posterior base');
  assert.equal(site(P.defaultSite({ id: 'crackles' }).id).level, 'lower');
  assert.equal(P.defaultSite({ id: 'wheeze' }).kind, 'lung');
  assert.ok(!P.assessedHere({ id: 'stridor' }, site('lung-ll')), 'stridor is not assessed at the left base');
  assert.match(P.notHere({ id: 'stridor' }, site('lung-ll')), /heard best over the trachea; here it is faint and transmitted/);
  assert.ok(P.assessedHere({ id: 'stridor' }, site('trachea')));
  for (const id of ['lung-ll', 'back-lu']) assert.ok(P.LUNG_GAIN.stridor(site(id)) <= 0.4, `stridor at ${id} is only transmitted`);
  // every where-to-listen answer is a site where its sound is assessed
  for (const q of P.WHERE) for (const id of q.ok) {
    const snd = q.sound.startsWith('heart') ? { synth: 'x' } : { id: q.sound };
    assert.ok(P.assessedHere(snd, site(id)), `${q.id}: ${id}`);
  }
});

test('heart strip and audio share one timing table at every listening site', () => {
  const { Bank, P } = load();
  const sr = 4000;
  for (const k of KINDS) {
    const ev = Bank.heartEvents(k, 72);
    for (const site of P.SITES.filter(s => s.kind === 'heart')) {
      const mix = P.heartMix(k, site);
      const d = Bank.heartData(k, 72, 2, mix, sr);
      // beat 2: the loudest sample of each event window sits right after its scheduled time
      for (const p of ev.points) {
        const part = { S1: mix.s1, S2: mix.s2, A2: mix.s2, P2: (mix.p2 ?? 1) * mix.s2, S3: mix.extra, S4: mix.extra }[p.key];
        if (!(part > 0.2)) continue;
        const i = Math.floor((ev.cycle + p.at) * sr), before = Math.max(...Array.from(d.slice(Math.max(0, i - 40), i - 4), Math.abs));
        const after = Math.max(...Array.from(d.slice(i, i + 60), Math.abs));
        assert.ok(after > before, `${k} at ${site.id}: ${p.key} not at ${p.at}s`);
      }
    }
  }
});
