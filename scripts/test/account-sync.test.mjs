/* assets/account.js — how a cloud pull meets what this browser already knows.

   The failure this guards against is silent and only shows up a device later:
   you read half a chapter on a phone, open the laptop, and the sections you
   just read are unticked again. That happens whenever a pull overwrites a
   local key wholesale, so the keys that are really *sets of things you have
   done* register a merge rule instead. These tests hold that rule to a union,
   and hold everything else to the old cloud-wins behaviour, since merging a
   key that is a single value would be nonsense. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function fresh(){
  const b = createBrowser();
  b.load('assets/account.js');
  b.load('assets/hub-progress.js');
  b.load('ochem/assets/ochem-xp.js');
  return { b, A: b.window.StudyHubAccount, ls: b.localStorage };
}

const READ = 'ochem_textbook_read';

test('a pull unions the textbook read map instead of replacing it', () => {
  const { A, ls } = fresh();
  ls.setItem(READ, JSON.stringify({ resonance: '2026-02-01T10:00:00.000Z' }));
  A.applyNamespace('ochem', { [READ]: JSON.stringify({ pka: '2026-01-05T10:00:00.000Z' }) });
  const out = JSON.parse(ls.getItem(READ));
  assert.deepEqual(Object.keys(out).sort(), ['pka', 'resonance']);
});

test('a section read on both devices keeps the earlier date', () => {
  const { A, ls } = fresh();
  ls.setItem(READ, JSON.stringify({ pka: '2026-03-09T10:00:00.000Z' }));
  A.applyNamespace('ochem', { [READ]: JSON.stringify({ pka: '2026-01-05T10:00:00.000Z' }) });
  assert.equal(JSON.parse(ls.getItem(READ)).pka, '2026-01-05T10:00:00.000Z');
});

test('an empty cloud copy cannot un-read anything', () => {
  const { A, ls } = fresh();
  ls.setItem(READ, JSON.stringify({ pka: '2026-03-09T10:00:00.000Z' }));
  A.applyNamespace('ochem', { [READ]: '{}' });
  assert.deepEqual(JSON.parse(ls.getItem(READ)), { pka: '2026-03-09T10:00:00.000Z' });
});

test('a corrupt cloud copy leaves this browser alone', () => {
  const { A, ls } = fresh();
  ls.setItem(READ, JSON.stringify({ pka: '2026-03-09T10:00:00.000Z' }));
  A.applyNamespace('ochem', { [READ]: 'not json' });
  assert.deepEqual(JSON.parse(ls.getItem(READ)), { pka: '2026-03-09T10:00:00.000Z' });
});

test('on a first sync, keys with no merge rule merge structurally and the cloud wins a true conflict', () => {
  const { A, ls } = fresh();
  ls.setItem('ochem_game_v1', '{"local":1,"mode":"a"}');
  A.applyNamespace('ochem', { ochem_game_v1: '{"cloud":1,"mode":"b"}' });
  assert.deepEqual(JSON.parse(ls.getItem('ochem_game_v1')), { local: 1, mode: 'b', cloud: 1 });
});

test('a cloud bucket cannot write a key the namespace never declared', () => {
  const { A, ls } = fresh();
  A.applyNamespace('ochem', { sb_auth_token: 'stolen' });
  assert.equal(ls.getItem('sb_auth_token'), null);
});

/* ---- sync against a fake user_progress table ---------------------------

   The audit's finding: push() replaced each whole namespace with this
   browser's copy, and a pull ran only on a fresh sign-in, so a phone and a
   laptop signed in together overwrote each other every 30 seconds. These
   drive the real sync code against an in-memory stand-in for the one table it
   uses, shared by two simulated devices. The stand-in implements exactly the
   PostgREST calls account.js makes: select ... maybeSingle, insert ... select
   (duplicate key -> 23505), update ... eq/is ... select (no rows when the
   filter misses). */
const UID = 'user-1';
const J = JSON.stringify;
const clone = x => (x === null || x === undefined ? x : JSON.parse(JSON.stringify(x)));
const tick = () => new Promise(r => setTimeout(r, 5));

function fakeServer(){
  const server = { row: null, reads: 0, writes: 0, fail: 0, beforeWrite: null };
  server.client = () => ({
    from(table){
      assert.equal(table, 'user_progress');
      const q = { op: 'select', filters: [], payload: null };
      const b = {
        select(){ return b; },
        insert(p){ q.op = 'insert'; q.payload = clone(p); return b; },
        update(p){ q.op = 'update'; q.payload = clone(p); return b; },
        eq(col, v){ q.filters.push([col, v]); return b; },
        is(col, v){ q.filters.push([col, v]); return b; },
        maybeSingle(){ return b; },
        then(ok, bad){ return run().then(ok, bad); },
      };
      async function run(){
        await null;
        if(server.fail > 0){ server.fail--; return { data: null, error: { message: 'network down', code: 'X' } }; }
        if(q.op === 'select'){
          server.reads++;
          return { data: server.row ? clone({ data: server.row.data, updated_at: server.row.updated_at }) : null, error: null };
        }
        if(server.beforeWrite) await server.beforeWrite();
        server.writes++;
        const stamp = q.payload.updated_at;
        if(q.op === 'insert'){
          if(server.row) return { data: null, error: { code: '23505', message: 'duplicate key' } };
          server.row = { id: q.payload.id, data: q.payload.data, updated_at: stamp };
          return { data: [{ updated_at: stamp }], error: null };
        }
        const match = server.row && q.filters.every(([c, v]) => (server.row[c] ?? null) === v);
        if(!match) return { data: [], error: null };
        server.row.data = q.payload.data;
        server.row.updated_at = stamp;
        return { data: [{ updated_at: stamp }], error: null };
      }
      return b;
    },
    rpc(){ return Promise.resolve({ data: null, error: null }); },
    auth: {
      onAuthStateChange(){},
      getSession(){ return Promise.resolve({ data: { session: { user: { id: UID, email: 'a@b.c' } } } }); },
      signOut(){ return Promise.resolve(); },
    },
  });
  return server;
}

// One signed-in device on the shared server, with its own clock a few ms
// apart from the other's, like two real machines.
function device(server, offsetMs = 0){
  const b = createBrowser();
  b.setNow(b.now() + offsetMs);
  b.load('assets/account.js');
  b.load('assets/hub-progress.js');
  b.load('ochem/assets/ochem-xp.js');
  const A = b.window.StudyHubAccount;
  A._test.setClient(server.client());
  A._test.setUser({ id: UID, email: 'a@b.c' });
  return { b, A, ls: b.localStorage, sync: () => { b.setNow(b.now() + 1000); return A.sync(); } };
}

const cloudNs = server => server.row.data.ns;
const readMap = ls => JSON.parse(ls.getItem(READ) || '{}');

test('two devices interleaving syncs keep both devices’ progress', async () => {
  const server = fakeServer();
  const phone = device(server, 0), laptop = device(server, 7);

  phone.ls.setItem(READ, J({ pka: '2026-01-10T10:00:00.000Z' }));
  phone.ls.setItem('hub_xp_v1', J({ v: 1, total: 120, subjects: { ochem: 120 }, badges: {} }));
  assert.equal((await phone.sync()).ok, true);

  // The laptop has its own guest progress from before signing in.
  laptop.ls.setItem(READ, J({ resonance: '2026-01-11T10:00:00.000Z' }));
  laptop.ls.setItem('hub_xp_v1', J({ v: 1, total: 40, subjects: { ochem: 40 }, badges: {} }));
  assert.equal((await laptop.sync()).ok, true);

  // Both keep studying; their syncs interleave.
  phone.ls.setItem(READ, J({ ...readMap(phone.ls), alkenes: '2026-01-12T10:00:00.000Z' }));
  laptop.ls.setItem(READ, J({ ...readMap(laptop.ls), sn2: '2026-01-12T11:00:00.000Z' }));
  await phone.sync();
  await laptop.sync();
  laptop.ls.setItem(READ, J({ ...readMap(laptop.ls), e2: '2026-01-13T11:00:00.000Z' }));
  await laptop.sync();
  await phone.sync();

  const all = ['alkenes', 'e2', 'pka', 'resonance', 'sn2'];
  assert.deepEqual(Object.keys(JSON.parse(cloudNs(server).ochem[READ])).sort(), all);
  assert.deepEqual(Object.keys(readMap(phone.ls)).sort(), all);
  assert.deepEqual(Object.keys(readMap(laptop.ls)).sort(), all);
  // A monotonic counter takes the larger, never the other device's lower copy.
  assert.equal(JSON.parse(phone.ls.getItem('hub_xp_v1')).total, 120);
  assert.equal(JSON.parse(laptop.ls.getItem('hub_xp_v1')).total, 120);
});

test('a sync never drops namespaces or keys this page did not register', async () => {
  const server = fakeServer();
  server.row = { id: UID, updated_at: '2026-01-01T00:00:00.000Z', data: { v: 2, ns: {
    nremt: { nremt_seen_questions: J(['q1']) },
    ochem: { ochem_only_on_another_page: '"keep me"' },
  } } };
  const d = device(server);
  d.ls.setItem(READ, J({ pka: '2026-01-10T10:00:00.000Z' }));
  assert.equal((await d.sync()).ok, true);
  const ns = cloudNs(server);
  assert.equal(ns.nremt.nremt_seen_questions, J(['q1']));
  assert.equal(ns.ochem.ochem_only_on_another_page, '"keep me"');
  assert.ok(ns.ochem[READ]);
});

test('a write that finds the row changed since it was read re-reads, re-merges and retries', async () => {
  const server = fakeServer();
  const phone = device(server, 0), laptop = device(server, 5);
  phone.ls.setItem(READ, J({ pka: '2026-01-10T10:00:00.000Z' }));
  await phone.sync();
  await laptop.sync();

  // The laptop's whole sync lands between the phone's read and its write.
  laptop.ls.setItem(READ, J({ ...readMap(laptop.ls), sn1: '2026-01-14T10:00:00.000Z' }));
  phone.ls.setItem(READ, J({ ...readMap(phone.ls), sn2: '2026-01-14T11:00:00.000Z' }));
  server.beforeWrite = async () => { server.beforeWrite = null; await laptop.sync(); };
  const reads = server.reads;
  const r = await phone.sync();
  assert.equal(r.ok, true);
  assert.equal(server.reads - reads, 3, 'phone read, laptop read, phone read again after its write missed');
  assert.deepEqual(Object.keys(JSON.parse(cloudNs(server).ochem[READ])).sort(), ['pka', 'sn1', 'sn2']);
  assert.deepEqual(Object.keys(readMap(phone.ls)).sort(), ['pka', 'sn1', 'sn2']);
});

test('the retry is bounded when the row never stops changing', async () => {
  const server = fakeServer();
  server.row = { id: UID, updated_at: '2026-01-01T00:00:00.000Z', data: { v: 2, ns: {} } };
  let n = 0;
  server.beforeWrite = async () => { server.row.updated_at = '2026-01-02T00:00:0' + (n++ % 10) + '.000Z'; };
  const d = device(server);
  d.ls.setItem(READ, J({ pka: '2026-01-10T10:00:00.000Z' }));
  const r = await d.sync();
  assert.equal(r.ok, false);
  assert.equal(n, 4);
  assert.equal(d.A.syncStatus().failures, 1);
});

test('a deletion or an un-flag on one device reaches the other instead of coming back', async () => {
  const server = fakeServer();
  const phone = device(server, 0), laptop = device(server, 3);
  phone.ls.setItem('ochem_progress', J({ flagged: ['q1', 'q2'] }));
  phone.ls.setItem('ochem_game_v1', J({ inProgress: true }));
  await phone.sync();
  await laptop.sync();
  assert.equal(laptop.ls.getItem('ochem_progress'), J({ flagged: ['q1', 'q2'] }));

  phone.ls.setItem('ochem_progress', J({ flagged: ['q2'] }));   // un-flag q1
  phone.ls.removeItem('ochem_game_v1');                          // finished
  await phone.sync();
  await laptop.sync();
  assert.equal(laptop.ls.getItem('ochem_progress'), J({ flagged: ['q2'] }));
  assert.equal(laptop.ls.getItem('ochem_game_v1'), null);
  assert.equal(cloudNs(server).ochem.ochem_game_v1, undefined);
});

test('a page writing back a stale in-memory copy after a sync cannot erase the other device’s work', async () => {
  const server = fakeServer();
  const phone = device(server, 0), laptop = device(server, 3);
  laptop.ls.setItem(READ, J({ pka: '2026-01-10T10:00:00.000Z' }));
  await laptop.sync();
  await phone.sync();
  phone.ls.setItem(READ, J({ ...readMap(phone.ls), sn2: '2026-01-11T10:00:00.000Z' }));
  await phone.sync();
  const stale = laptop.ls.getItem(READ);                // what the open page holds
  await laptop.sync();                                   // brings sn2 in under it
  laptop.ls.setItem(READ, J({ ...JSON.parse(stale), e1: '2026-01-12T10:00:00.000Z' }));
  await laptop.sync();
  assert.deepEqual(Object.keys(JSON.parse(cloudNs(server).ochem[READ])).sort(), ['e1', 'pka', 'sn2']);
});

test('a sync with nothing new writes nothing', async () => {
  const server = fakeServer();
  const d = device(server);
  d.ls.setItem(READ, J({ pka: '2026-01-10T10:00:00.000Z' }));
  await d.sync();
  const writes = server.writes;
  const r = await d.sync();
  assert.equal(r.ok, true);
  assert.equal(r.wrote, false);
  assert.equal(server.writes, writes);
});

test('every page load pulls, and reloads once if that brought something in before any interaction', async () => {
  const server = fakeServer();
  server.row = { id: UID, updated_at: '2026-01-01T00:00:00.000Z', data: { v: 2, ns: {
    ochem: { [READ]: J({ pka: '2026-01-10T10:00:00.000Z' }) },
  } } };
  const b = createBrowser();
  let reloads = 0;
  b.window.location.reload = () => { reloads++; };
  b.window.supabase = { createClient: () => server.client() };
  b.load('assets/account.js');            // start(): getSession -> signed in -> sync
  b.load('assets/hub-progress.js');
  b.load('ochem/assets/ochem-xp.js');
  const A = b.window.StudyHubAccount;
  try {
    for(let i = 0; i < 40 && !reloads; i++) await tick();
    assert.deepEqual(Object.keys(readMap(b.localStorage)), ['pka']);
    assert.equal(reloads, 1);
    assert.ok(A.syncStatus().lastSynced > 0);
  } finally { A._test.stopSyncTimer(); }
});

test('coming back to the tab pulls, throttled', async () => {
  const server = fakeServer();
  const laptop = device(server, 0), phone = device(server, 9);
  await laptop.sync();
  phone.ls.setItem(READ, J({ pka: '2026-01-10T10:00:00.000Z' }));
  await phone.sync();

  const reads = server.reads;
  laptop.A._test.onFocus();                      // seconds after the last sync: skipped
  await tick();
  assert.equal(server.reads, reads);

  laptop.b.setNow(laptop.b.now() + 21000);
  laptop.A._test.onVisibilityChange();           // visible again, 21 s later
  for(let i = 0; i < 40 && !laptop.ls.getItem(READ); i++) await tick();
  assert.equal(server.reads, reads + 1);
  assert.deepEqual(Object.keys(readMap(laptop.ls)), ['pka']);
});

test('failures are counted, reported once after three in a row, and cleared by a success', async () => {
  const server = fakeServer();
  const d = device(server);
  const reports = [];
  d.b.window.LevlErrors = { report: (msg, src) => reports.push([msg, src]) };
  server.fail = 99;
  for(let i = 0; i < 2; i++) assert.equal((await d.sync()).ok, false);
  assert.equal(d.A.syncStatus().failing, false);
  assert.equal(reports.length, 0);
  await d.sync();
  await d.sync();
  assert.equal(d.A.syncStatus().failures, 4);
  assert.equal(d.A.syncStatus().failing, true);
  assert.equal(reports.length, 1);
  assert.match(reports[0][0], /sync failed 3 times/);
  server.fail = 0;
  assert.equal((await d.sync()).ok, true);
  assert.equal(d.A.syncStatus().failures, 0);
  assert.ok(d.A.syncStatus().lastSynced > 0);
});
