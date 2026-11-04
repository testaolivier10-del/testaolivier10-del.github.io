/* Is every label readable?

   Renders the site in a real browser and flags the visual problems a student
   actually sees but no file scan can: words in neighbouring table columns
   running together, figure labels sitting on top of each other, and labels cut
   off at the edge of a figure. Runs at desktop and phone width.

   WHAT IT CHECKS
     tables   neighbouring cells whose text is closer than MIN_GAP px
     svg      two <text> labels in one figure overlapping
     svg      a label poking out past its figure's edge (clipped)
     figures  the standalone .svg figure files, opened on their own

   USAGE
     node scripts/check-legibility.mjs                 every page and figure
     node scripts/check-legibility.mjs anatomy-physiology/notes/word-parts.html
     CHROME=/path/to/chrome node scripts/check-legibility.mjs
     OUT=report.json node scripts/check-legibility.mjs

   Exits non-zero when anything is flagged.
*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const MIN_GAP = 10;          // px between the text of two neighbouring cells
const OVERLAP = 0.2;         // share of the smaller label covered by another
const WIDTHS = [1280, 390];
const CONC = Number(process.env.CONC || 3);

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain' };

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch {}
    fs.readFile(f, (err, buf) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise(r => srv.listen(0, () => r(srv)));
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'docs') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(path.relative(ROOT, p));
  }
  return out;
}

/* Runs inside the page. */
function scan({ MIN_GAP, OVERLAP }) {
  const found = [];
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity !== 0; };
  const textRect = el => { const rg = document.createRange(); rg.selectNodeContents(el);
    const rs = [...rg.getClientRects()].filter(r => r.width > 0.5); if (!rs.length) return null;
    return { l: Math.min(...rs.map(r => r.left)), r: Math.max(...rs.map(r => r.right)),
      t: Math.min(...rs.map(r => r.top)), b: Math.max(...rs.map(r => r.bottom)) }; };
  const label = el => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);

  for (const tr of document.querySelectorAll('tr')) {
    if (!vis(tr)) continue;
    const cells = [...tr.children].filter(c => /^(TD|TH)$/.test(c.tagName) && vis(c) && c.textContent.trim());
    for (let i = 1; i < cells.length; i++) {
      const a = textRect(cells[i - 1]), b = textRect(cells[i]);
      if (!a || !b) continue;
      if (Math.min(a.b, b.b) - Math.max(a.t, b.t) <= 0) continue;   // not on the same line
      const gap = b.l - a.r;
      if (gap < MIN_GAP) found.push({ kind: 'table-gap', gap: Math.round(gap),
        text: `${label(cells[i - 1])} | ${label(cells[i])}` });
    }
  }

  for (const svg of document.querySelectorAll('svg')) {
    if (svg.parentElement && svg.parentElement.closest('svg')) continue;
    if (!vis(svg)) continue;
    const box = svg.getBoundingClientRect();
    const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && vis(t))
      .map(t => ({ t, r: t.getBoundingClientRect() }));
    for (const { t, r } of texts) {
      const out = Math.max(box.left - r.left, r.right - box.right, box.top - r.top, r.bottom - box.bottom);
      if (out > 2 && getComputedStyle(svg).overflow !== 'visible') found.push({ kind: 'svg-clipped', by: Math.round(out), text: label(t) });
    }
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const A = texts[i], B = texts[j];
      if (A.t.contains(B.t) || B.t.contains(A.t)) continue;
      const w = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left);
      const h = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
      if (w <= 0 || h <= 0) continue;
      const small = Math.min(A.r.width * A.r.height, B.r.width * B.r.height);
      if (small > 0 && (w * h) / small > OVERLAP) found.push({ kind: 'svg-overlap', text: `${label(A.t)} / ${label(B.t)}` });
    }
  }
  return found;
}

const args = process.argv.slice(2);
const files = args.length ? args : walk(ROOT).filter(f => {
  if (f.endsWith('.svg')) return /\/figures\//.test(f) && fs.readFileSync(path.join(ROOT, f), 'utf8').includes('<text');
  if (!f.endsWith('.html') || /\/data\//.test(f)) return false;
  return /<svg|<table|<canvas|<img[^>]+\.svg/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'));
});

const srv = await serve();
const base = `http://127.0.0.1:${srv.address().port}/`;
let browser;
async function launch() { browser = await chromium.launch({ executablePath: process.env.CHROME || undefined }); }
await launch();
const report = [];
const jobs = [];
for (const f of files) for (const w of (f.endsWith('.svg') ? [WIDTHS[0]] : WIDTHS)) jobs.push([f, w]);

/* A fresh page per render: one long-lived page leaks memory over thousands of
   renders until Chrome dies. If Chrome dies anyway, relaunch and retry once. */
let next = 0, done = 0, relaunching = null;
async function render(f, w) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  try {
    await ctx.route(u => !u.href.startsWith(base), r => r.abort());
    const page = await ctx.newPage();
    await page.goto(base + f, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(250);
    await page.evaluate(() => document.fonts && document.fonts.ready);
    return await page.evaluate(scan, { MIN_GAP, OVERLAP });
  } finally { await ctx.close().catch(() => {}); }
}
async function worker() {
  while (next < jobs.length) {
    const [f, w] = jobs[next++];
    for (let attempt = 0; ; attempt++) {
      try {
        for (const x of await render(f, w)) report.push({ file: f, width: w, ...x });
        break;
      } catch (e) {
        if (attempt === 0 && !browser.isConnected()) {
          relaunching = relaunching || launch().finally(() => { relaunching = null; });
          await relaunching; continue;
        }
        report.push({ file: f, width: w, kind: 'load-error', text: String(e.message).split('\n')[0].slice(0, 80) });
        break;
      }
    }
    if (++done % 200 === 0) process.stderr.write(`${done}/${jobs.length}\n`);
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
await browser.close().catch(() => {}); srv.close();

if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(report, null, 1));
const byKind = {};
for (const r of report) byKind[r.kind] = (byKind[r.kind] || 0) + 1;
console.log(`check-legibility: ${files.length} files, ${jobs.length} renders`, byKind);
for (const r of report.slice(0, 40)) console.log(`  ${r.kind} ${r.file} @${r.width}: ${r.text}${r.gap != null ? ` (gap ${r.gap}px)` : ''}`);
process.exit(report.length ? 1 : 0);
