/* Simulated students: many headless browsers working through the site the way students do, to find
   what breaks. Runs against THIS checkout served locally; nothing reaches levlprep.com, Supabase or
   Umami (every request to another host is counted, then aborted). See docs/student-sim.md.

     CHROMIUM_PATH=... node scripts/sim-students.mjs                 every course, every persona
     COURSES=nremt PERSONAS=corrupt,full node scripts/sim-students.mjs
     SPOOF=1 ...   let analytics run (it skips automation) to count Worker requests per student

   Personas: practice, phone (slow network, slow CPU), exam, chaos (random clicks), corrupt (damaged
   saved progress), full (storage full), offline, path, flash, review. Output: OUT (default
   sim-results.json) and screenshots in sim-shots/. Both are git-ignored scratch. */
import { chromium, devices } from 'playwright';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.mp3':'audio/mpeg','.txt':'text/plain','.xml':'application/xml','.webmanifest':'application/manifest+json'};
function serve(port){return new Promise(ok=>{const s=createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);let f=join(ROOT,p);if(existsSync(f)&&statSync(f).isDirectory())f=join(f,'index.html');if(!existsSync(f)&&existsSync(f+'.html'))f+='.html';if(!existsSync(f)){res.writeHead(404);return res.end('nf')}res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'});createReadStream(f).pipe(res)});s.listen(port,()=>ok(s))})}


const PORT = 8820, ORIGIN = 'http://localhost:' + PORT;
const COURSES = ['bio','chem','physics','calculus','calculus-bc','statistics','environmental-science','psychology',
  'precalculus','macroeconomics','microeconomics','human-geography','nremt','ochem','anatomy-physiology'];
const ONLY = process.env.COURSES ? process.env.COURSES.split(',') : COURSES;
const PERSONAS = (process.env.PERSONAS || 'practice,phone,exam,chaos,corrupt,full,offline,path,flash,review').split(',');
const PAR = +(process.env.PAR || 6);
mkdirSync('sim-shots', { recursive: true });

const server = await serve(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const findings = [];
const sessions = [];
const rnd = (n) => Math.floor(Math.random() * n);

function note(s, kind, detail, extra = {}) {
  const f = { course: s.course, persona: s.persona, url: s.page ? s.page.url().replace(ORIGIN, '') : '', kind, detail: String(detail).slice(0, 400), ...extra };
  findings.push(f); s.issues++;
}

async function newSession(course, persona) {
  const phone = persona === 'phone';
  const base = phone ? { ...devices['iPhone 13'] } : { viewport: { width: 1280, height: 860 } };
  if (process.env.SPOOF) base.userAgent = phone ? devices['iPhone 13'].userAgent : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  const ctx = await browser.newContext(base);
  if (process.env.SPOOF) await ctx.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
  const s = { course, persona, ctx, issues: 0, ext: {}, worker: 0, navs: 0, steps: 0, answered: 0, t0: Date.now() };
  await ctx.route((u) => !u.href.startsWith(ORIGIN), (r) => {
    const u = new URL(r.request().url());
    const key = u.host + u.pathname.replace(/[0-9a-f-]{20,}/g, ':id');
    s.ext[key] = (s.ext[key] || 0) + 1;
    if (u.host === 'api.levlprep.com') s.worker++;
    r.abort();
  });
  const page = await ctx.newPage();
  s.page = page;
  page.on('pageerror', (e) => note(s, 'js-exception', e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::|Failed to load resource|blocked/i.test(m.text())) note(s, 'console-error', m.text()); });
  page.on('response', (r) => { if (r.url().startsWith(ORIGIN) && r.status() >= 400) note(s, 'http-' + r.status(), r.url().replace(ORIGIN, '')); });
  page.on('framenavigated', (f) => {
    if (f !== page.mainFrame()) return;
    s.navs++;
    const p = new URL(f.url()).pathname;
    if (p.endsWith('/')) s.worker++; // directory URLs run the site Worker on production
  });
  if (phone) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 200 * 1024, uploadThroughput: 90 * 1024 });
  }
  return s;
}

async function go(s, path) {
  const t = Date.now();
  try { await s.page.goto(ORIGIN + path, { waitUntil: 'load', timeout: 45000 }); }
  catch (e) { note(s, 'load-fail', path + ' ' + e.message.split('\n')[0]); return false; }
  const ms = Date.now() - t;
  if (ms > (s.persona === 'phone' ? 12000 : 4000)) note(s, 'slow-load', `${path} took ${ms} ms`, { ms });
  await s.page.waitForTimeout(600);
  await checkLayout(s);
  return true;
}

async function checkLayout(s) {
  const r = await s.page.evaluate(() => {
    const W = innerWidth, sw = document.documentElement.scrollWidth;
    const wide = [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.right > W + 4 && getComputedStyle(e).position !== 'fixed' && !e.closest('[style*=overflow],pre,table,.tbl-wrap,svg'); })
      .slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') + ' (' + Math.round(e.getBoundingClientRect().right) + 'px)');
    return { W, sw, wide };
  }).catch(() => null);
  if (r && r.sw > r.W + 4) note(s, 'sideways-scroll', `page is ${r.sw}px wide on a ${r.W}px screen; ${r.wide.join(', ')}`);
}

const snapshot = (s) => s.page.evaluate(() => {
  const m = document.querySelector('main') || document.body;
  return (m.innerText || '').length + ':' + m.querySelectorAll('*').length + ':' + [...m.querySelectorAll('input,textarea,select')].map((e) => e.value).join('|').length + ':' + (m.innerText || '').slice(-200);
}).catch(() => 'x');

// One move of a student working through a question session. Returns false when there is nothing left to do.
async function move(s, mode) {
  const p = s.page;
  const find = () => p.evaluate((mode) => {
    const vis = (e) => e.offsetParent && !e.disabled && e.getAttribute('aria-disabled') !== 'true' && !e.closest('header,nav,footer,.site-chrome,[aria-hidden=true],dialog:not([open])');
    const area = document.querySelector('main') || document.body;
    const txt = (e) => (e.innerText || e.value || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
    const tag = (e, k) => { e.setAttribute('data-sim', k); return k; };
    const PICK = '.on,.selected,.picked,.chosen,.is-selected,[aria-checked=true],[aria-pressed=true],:checked,.correct,.incorrect,.right,.wrong,.is-correct,.is-wrong';
    const OPT = '.cx-opt,.cx-choice,.choice-btn,.lp-opt,.ex-opt,.rt-opt,[role=radio],input[type=radio]';
    const MOVE = [/^(check|submit|lock in)( answer| my answer)?$/i, /^next/i, /^continue/i, /^(finish|see (my )?results|done|end exam|end section|submit (exam|section)|review answers)/i, /^(yes,? end|end it|confirm|submit anyway|end and score|submit now|score (it|my))/i, /^start/i, /^begin/i, /^(show|reveal|flip)/i, /^(got it|knew it|again|good|easy|hard|i knew|still learning)/i];
    const btnIn = (root) => { const bs = [...root.querySelectorAll('button,a.btn,[role=button],a[class*=go]')].filter(vis).filter((b) => !b.matches(OPT)); for (const re of MOVE) { const m = bs.filter((e) => re.test(txt(e))); if (m.length) return m[m.length - 1]; } return null; };
    if (mode === 'start') { const bs = [...area.querySelectorAll('button,a')].filter(vis); const b = bs.find((e) => /^(start|begin)/i.test(txt(e))); return b ? tag(b, 'press:' + txt(b).slice(0, 30)) : null; }
    const cards = [...area.querySelectorAll('.cx-q,[class*=-q-card],.question')].filter(vis);
    const scopes = cards.length ? cards : [area];
    for (const c of scopes) {
      const box = [...c.querySelectorAll('input[type=text],input[type=number],input:not([type]),textarea')].find((e) => vis(e) && !e.value && !e.readOnly && !/search|email|name|code/i.test(e.name + e.id + e.placeholder));
      const opts = [...c.querySelectorAll(OPT)].filter((o) => o.offsetParent);
      const done = opts.some((o) => o.matches(PICK) || o.disabled) || [...c.querySelectorAll('.cx-fb,[class*=feedback],[class*=-fb]')].some((f) => f.offsetParent && f.innerText.trim().length > 3);
      if (box) return tag(box, 'fill');
      const sel = [...c.querySelectorAll('select')].find((e) => vis(e) && !e.value && e.options.length > 1);
      if (sel) return tag(sel, 'select');
      if (opts.length && !done) { const live = opts.filter(vis); if (live.length) return tag(live[Math.floor(Math.random() * live.length)], 'choose'); }
      const b = btnIn(c); if (b && cards.length && /check|submit|lock/i.test(txt(b))) return tag(b, 'press:' + txt(b).slice(0, 30));
    }
    const dlg = [...document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open],[class*=modal],[class*=confirm]')].find((d) => d.offsetParent || d.open);
    if (dlg) { const b = btnIn(dlg); if (b) return tag(b, 'press:' + txt(b).slice(0, 30)); }
    const b = btnIn(area); if (b) return tag(b, 'press:' + txt(b).slice(0, 30));
    return null;
  }, mode).catch(() => null);
  let act = await find();
  if (!act) { await p.waitForTimeout(1200); act = await find(); }
  s.lastAct = act + ' @ ' + p.url().replace(ORIGIN,'');
  if (process.env.DEBUG) console.log('  act', act);
  if (!act) { if (process.env.DEBUG) await p.screenshot({path:'sim-shots/dbg-'+s.course+'-'+s.persona+'.png'}); return false; }
  const el = p.locator('[data-sim]').first();
  try {
    if (act === 'fill') await el.fill(String(1 + rnd(50)));
    else if (act === 'select') { const vals = await el.evaluate((e) => [...e.options].map((o) => o.value).filter(Boolean)); await el.selectOption(vals[rnd(vals.length)]); }
    else await el.click({ timeout: 5000 });
    if (act === 'choose' || act === 'fill') s.answered++;
  } catch (e) { note(s, 'click-fail', act + ': ' + e.message.split('\n')[0]); }
  await p.evaluate(() => document.querySelectorAll('[data-sim]').forEach((e) => e.removeAttribute('data-sim'))).catch(() => {});
  await p.waitForTimeout(s.persona === 'phone' ? 500 : 180);
  s.steps++;
  return act;
}

async function work(s, startPath, startText, maxSteps) {
  if (!(await go(s, startPath))) return;
  if (startText) {
    const t = s.page.getByText(startText, { exact: false }).first();
    if (await t.count()) await t.click().catch(() => {}); else note(s, 'missing-control', `no "${startText}" on ${startPath}`);
    await s.page.waitForTimeout(400);
  }
  await move(s, 'start');
  let same = 0, last = '', lastAct = '';
  for (let i = 0; i < maxSteps; i++) {
    const act = await move(s, 'run');
    if (!act) break;
    const snap = await snapshot(s);
    if (snap === last && act === lastAct) { if (++same >= 4) { const drag = await s.page.evaluate(() => /Drag a|drag the|Drag the/.test(document.querySelector('main').innerText)); if (drag) { note(s, 'sim-limit', 'graph item needs dragging'); break; } note(s, 'stuck', `pressing "${act}" does nothing (4 times)`); await shot(s, 'stuck'); break; } }
    else same = 0;
    last = snap; lastAct = act;
  }
}

async function shot(s, why) {
  const f = `sim-shots/${s.course}-${s.persona}-${why}-${findings.length}.png`;
  await s.page.screenshot({ path: f }).catch(() => {});
  findings[findings.length - 1].shot = f;
}

const storageOf = (s) => s.page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)]))).catch(() => ({}));

async function run(course, persona) {
  const s = await newSession(course, persona);
  let lastAct = '';
  const dog = setTimeout(async () => { note(s, 'hang', `session still running after 6 min; last action: ${s.lastAct || '?'}`); try { await s.page.screenshot({ path: `sim-shots/${course}-${persona}-hang.png`, timeout: 10000 }); findings[findings.length-1].shot = `sim-shots/${course}-${persona}-hang.png`; } catch (e) { findings[findings.length-1].detail += ' (page did not answer a screenshot: main thread blocked)'; } s.ctx.close().catch(() => {}); }, 360000);
  const P = `/${course}/`;
  try {
    if (persona === 'practice' || persona === 'phone') {
      await go(s, '/');
      await work(s, P + 'practice.html', 'Practice set', 120);
      const st = await storageOf(s);
      if (s.answered > 3 && !Object.keys(st).some((k) => k.length)) note(s, 'no-progress-saved', 'answered ' + s.answered + ' but nothing in storage');
      await go(s, P); await go(s, P + 'dashboard.html');
    } else if (persona === 'exam') {
      await work(s, P + 'practice.html', 'Exam', 400);
      const res = await s.page.evaluate(() => /score|results|you got|correct|points/i.test(document.querySelector('main').innerText.slice(0, 3000)) && !/Lock in answer|Time left/.test(document.querySelector('main').innerText)).catch(() => false);
      s.examDone = res; if (!res) { note(s, 'exam-not-finished', 'no results screen after ' + s.answered + ' answers'); await shot(s, 'examend'); }
    } else if (persona === 'path') {
      await go(s, P + 'path.html');
      for (let i = 0; i < 6; i++) {
        const link = s.page.locator('main a[href]:visible').nth(i);
        if (!(await link.count())) break;
        const href = await link.getAttribute('href');
        if (!href || /^(https?:|mailto:|#)/.test(href)) continue;
        await link.click().catch(() => {}); await s.page.waitForTimeout(500); await checkLayout(s);
        await s.page.goBack().catch(() => {}); await s.page.waitForTimeout(300);
      }
    } else if (persona === 'flash') {
      await work(s, P + 'flashcards.html', null, 60);
    } else if (persona === 'review') {
      await work(s, P + 'review.html', null, 60);
    } else if (persona === 'chaos') {
      await go(s, P);
      for (let i = 0; i < 45; i++) {
        const n = await s.page.locator('main button:visible, main a[href^="/"]:visible, main a[href$=".html"]:visible').count().catch(() => 0);
        if (!n) { await go(s, P); continue; }
        const el = s.page.locator('main button:visible, main a[href^="/"]:visible, main a[href$=".html"]:visible').nth(rnd(n));
        const r = Math.random();
        try { if (r < 0.15) await el.dblclick({ timeout: 3000 }); else await el.click({ timeout: 3000 }); } catch {}
        await s.page.waitForTimeout(250);
        if (Math.random() < 0.15) await s.page.goBack().catch(() => {});
        if (!s.page.url().startsWith(ORIGIN)) await go(s, P);
      }
      await checkLayout(s);
    } else if (persona === 'corrupt' || persona === 'full') {
      // first build up some real saved state
      await work(s, P + 'practice.html', 'Practice set', 25);
      const st = await storageOf(s);
      await s.page.evaluate(([mode, st]) => {
        if (mode === 'corrupt') for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v.slice(0, Math.max(1, Math.floor(v.length / 2))) + '{"');
        else { try { const big = 'x'.repeat(250000); for (let i = 0; i < 60; i++) localStorage.setItem('sim_fill_' + i, big); } catch {} }
      }, [persona, st]);
      s.corruptKeys = Object.keys(st).length;
      await work(s, P + 'practice.html', 'Practice set', 30);
      await go(s, P); await go(s, P + 'dashboard.html'); await go(s, '/');
    } else if (persona === 'offline') {
      await go(s, '/'); await go(s, P); await go(s, P + 'practice.html');
      await s.page.waitForTimeout(2500); // let the service worker install
      await s.ctx.setOffline(true);
      for (const u of [P, P + 'practice.html', P + 'review.html', '/']) {
        try { await s.page.goto(ORIGIN + u, { timeout: 15000 }); const t = await s.page.evaluate(() => document.body.innerText.slice(0, 80)); if (/ERR_|can.t be reached|No internet/i.test(t)) note(s, 'offline-dead', u); }
        catch (e) { note(s, 'offline-dead', u + ' ' + e.message.split('\n')[0]); }
      }
      await s.ctx.setOffline(false);
    }
    const mem = await s.page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null).catch(() => null);
    s.heap = mem;
    if (mem && mem > 150) note(s, 'memory', mem + ' MB of JS heap after the session');
  } catch (e) { note(s, 'sim-error', e.message.split('\n')[0]); }
  sessions.push({ course, persona, secs: Math.round((Date.now() - s.t0) / 1000), steps: s.steps, answered: s.answered, navs: s.navs, worker: s.worker, ext: s.ext, issues: s.issues, heap: s.heap, examDone: s.examDone });
  clearTimeout(dog);
  writeFileSync(process.env.OUT || 'sim-results.json', JSON.stringify({ findings, sessions }, null, 1));
  process.stdout.write(`${course}/${persona}: ${s.answered} answered, ${s.issues} issues\n`);
  await s.ctx.close().catch(() => {});
}

const jobs = []; for (const c of ONLY) for (const p of PERSONAS) jobs.push([c, p]);
let next = 0;
await Promise.all(Array.from({ length: PAR }, async () => { while (next < jobs.length) { const j = jobs[next++]; await run(...j); } }));
writeFileSync(process.env.OUT || 'sim-results.json', JSON.stringify({ findings, sessions }, null, 1));
await browser.close(); server.close();
console.log('findings', findings.length);
