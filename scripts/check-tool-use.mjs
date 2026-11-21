#!/usr/bin/env node
/* The "was the tool used" events in a real browser (docs/analytics-plan.md, "Tool use"; the code is watchUse in
   assets/course/tool-studio.js). Three tools, one of each kind of mount:
     - an old-frame course tool (AP Biology, Water potential) and the second v2 tool, the first through a
       course adapter (AP Biology, Osmosis: frame v2 since 2026-11-18),
     - the tools v2 flagship (AP Environmental Science, Water pollution, with Premium answered "yes" here only),
     - an NREMT tool (Flowcharts; the body map draws in 3D, too slow for a headless check), which is not in a tools/ folder.
   For each: a visitor opens it, presses on the stage several times, switches mode when the tool has modes, and
   leaves. Exactly one tool-open, one tool-touch, one tool-mode per switch and one tool-use must reach
   api.levlprep.com/api/send, carrying only the fixed fields.
   Then the same visit in the browser the other checks use (navigator.webdriver, a headless user agent): nothing
   at all may be sent, so CI runs never count.

   Nothing leaves the machine: every host but this server is refused, and /api/send is answered here.
   Usage: node scripts/check-tool-use.mjs [--check]   (needs playwright, as check-console.mjs does) */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json',
  '.mp3': 'audio/mpeg', '.ico': 'image/x-icon',
};
const TOOLS = [
  { path: '/bio/tools/water-potential.html', tool: 'apbio/water-potential', frame: 'old' },
  { path: '/bio/tools/osmosis.html', tool: 'apbio/osmosis', frame: 'v2' },
  { path: '/environmental-science/tools/water-pollution.html', tool: 'apenv/water-pollution', frame: 'v2', premium: true },
  { path: '/nremt/flowcharts.html', tool: 'nremt/flowcharts', frame: 'old' },
];
const FIELDS = { 'tool-open': ['tool', 'course', 'frame', 'locked'], 'tool-touch': ['tool', 'course', 'frame', 'mode'],
  'tool-mode': ['tool', 'course', 'frame', 'mode', 'row'], 'tool-use': ['tool', 'course', 'frame', 'touched', 'time', 'mode', 'locked', 'row'] };

let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) {
  console.error('This check needs playwright:\n  npm i --no-save playwright && npx playwright install chromium\n(' + e.message + ')');
  process.exit(0); // as check-console.mjs: not a failure where it is not installed; CI installs it
}

const PORT = Number(process.env.CHECK_TOOL_USE_PORT) || 8741;
const ORIGIN = `http://localhost:${PORT}`;
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  createReadStream(file).on('error', () => res.destroy()).pipe(res);
});
await new Promise((ok) => server.listen(PORT, ok));

const problems = [];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const exe = process.env.CHROMIUM_PATH || undefined;

/* One visit. Returns every body posted to /api/send. */
async function visit(browser, t, contextOptions) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block', ...contextOptions });
  const page = await ctx.newPage();
  const sent = [];
  await page.route('**/*', (route) => {
    const req = route.request(), url = req.url();
    if (url.startsWith('https://api.levlprep.com/api/send')) {
      try { sent.push(JSON.parse(req.postData() || '{}')); } catch { sent.push({ bad: req.postData() }); }
      return route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok', headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    if (!url.startsWith(ORIGIN)) return route.abort();
    // Premium answered "yes" for this visit only, so the tool itself is on screen (not its lock card).
    if (t.premium && url.split('?')[0].endsWith('/assets/premium.js')) {
      const src = readFileSync(resolve(ROOT, 'assets/premium.js'), 'utf8');
      const open = src.replace('function has(course) {', 'function has(course) { return true;');
      if (open === src) problems.push('assets/premium.js: "function has(course) {" not found (this check unlocks the v2 tool through it)');
      return route.fulfill({ status: 200, contentType: MIME['.js'], body: open });
    }
    return route.continue();
  });
  await page.goto(ORIGIN + t.path, { waitUntil: 'load', timeout: 45000 });
  await page.waitForSelector('.ls-root .ls-stage-body', { state: 'attached', timeout: 15000 });
  // The tracker is fetched after the page is drawn, and tool-open is said 1.5 s after the mount.
  await page.waitForTimeout(3500);

  // Not a touch: a press on the bar (the tool's name).
  await page.locator('.ls-bar .ls-title').first().click({ force: true }).catch(() => {});
  // A touch, three times over: presses in the middle of the stage.
  const box = await page.locator('.ls-stage').first().boundingBox();
  if (!box) problems.push(`${t.path}: no stage on screen`);
  else for (let i = 0; i < 3; i++) { await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(150); }

  // A mode switch, when the tool has a switch: the first mode that is not showing.
  const other = page.locator('.ls-modes button[aria-pressed="false"]:visible, .ls-modes [role="tab"][aria-selected="false"]:visible').first();
  let switched = 0;
  if (await other.count()) {
    const before = await page.locator('.ls-root').first().getAttribute('data-mode');
    await other.click({ force: true, timeout: 5000 }).catch(() => {}); // under something the press opened: then no switch is expected
    await page.waitForTimeout(400);
    if (await page.locator('.ls-root').first().getAttribute('data-mode') !== before) switched = 1;
  }
  // Leaving: the page is hidden (twice, and pagehide after: one summary all the same).
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
  });
  await page.waitForTimeout(800);
  const webdriver = await page.evaluate(() => navigator.webdriver);
  await ctx.close();
  return { sent, switched, webdriver };
}

/* 1. A person's browser: no automation flag, an ordinary user agent. */
const person = await chromium.launch({ executablePath: exe, args: ['--disable-blink-features=AutomationControlled', '--no-proxy-server'] });
for (const t of TOOLS) {
  const { sent, switched, webdriver } = await visit(person, t, { userAgent: UA });
  if (webdriver) problems.push(`${t.path}: navigator.webdriver is still true in the "person" browser, so this visit proves nothing`);
  const events = sent.map((b) => b && b.payload).filter((p) => p && /^tool-/.test(p.name || ''));
  const count = (n) => events.filter((e) => e.name === n).length;
  const want = { 'tool-open': 1, 'tool-touch': 1, 'tool-mode': switched, 'tool-use': 1 };
  for (const n in want) if (count(n) !== want[n]) problems.push(`${t.path}: ${n} sent ${count(n)} times, expected ${want[n]}`);
  for (const e of events) {
    const d = e.data || {};
    if (d.tool !== t.tool || d.frame !== t.frame) problems.push(`${t.path}: ${e.name} says tool ${d.tool}, frame ${d.frame}; expected ${t.tool}, ${t.frame}`);
    // Only the fixed fields (src is the first-touch channel every event carries), each a short fixed word.
    const extra = Object.keys(d).filter((k) => k !== 'src' && !(FIELDS[e.name] || []).includes(k));
    if (extra.length) problems.push(`${t.path}: ${e.name} carries ${extra.join(', ')}`);
    for (const k of FIELDS[e.name] || []) if (!/^[a-z0-9<+\/ -]{1,96}$/.test(String(d[k]))) problems.push(`${t.path}: ${e.name}.${k} is "${d[k]}"`);
  }
  const open = events.find((e) => e.name === 'tool-open'), sum = events.find((e) => e.name === 'tool-use');
  if (open && open.data.locked !== 'no') problems.push(`${t.path}: opened as locked`);
  if (sum && (sum.data.touched !== 'yes' || !['<10s', '10-60s'].includes(sum.data.time))) problems.push(`${t.path}: summary says touched ${sum.data.touched}, time ${sum.data.time}`);
  console.log(`${t.path}: ${events.map((e) => e.name + (e.data.mode && e.name !== 'tool-use' ? '(' + e.data.mode + ')' : '')).join(', ') || 'nothing sent'}`);
}
await person.close();

/* 2. The browser the other checks drive: navigator.webdriver and a headless user agent. Nothing is sent. */
const robot = await chromium.launch({ executablePath: exe, args: ['--no-proxy-server'] });
for (const t of TOOLS) {
  const { sent, webdriver } = await visit(robot, t, {});
  if (!webdriver) problems.push(`${t.path}: navigator.webdriver is false in the automated browser, so this visit proves nothing`);
  if (sent.length) problems.push(`${t.path}: an automated browser sent ${sent.length} event(s): ${sent.map((b) => (b.payload && (b.payload.name || 'pageview')) || '?').join(', ')}`);
  console.log(`${t.path} (automated): ${sent.length} sent`);
}
await robot.close();
server.close();

if (problems.length) {
  console.error('\nFAIL: tool use events\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log('\nTool use events: one of each per visit on all three kinds of tool; nothing under automation.');
