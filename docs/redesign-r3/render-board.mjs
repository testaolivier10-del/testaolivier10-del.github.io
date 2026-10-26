// Render a .dc.html mockup board to PNG without the canvas runtime.
// node render-board.mjs <board.dc.html> <out.png> [width]
import { createRequire } from 'module'; import fs from 'fs';
const { chromium } = createRequire('/tmp/x.js')('playwright');
const [, , src, out, w = '1280'] = process.argv;
let s = fs.readFileSync(src, 'utf8');
const helmet = (s.match(/<helmet>([\s\S]*?)<\/helmet>/) || [, ''])[1];
const body = (s.match(/<x-dc>([\s\S]*?)<\/x-dc>/) || [, s])[1].replace(/<helmet>[\s\S]*?<\/helmet>/, '');
const html = `<!doctype html><html><head><meta charset="utf-8">${helmet}</head><body>${body}</body></html>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.setContent(html, { waitUntil: 'networkidle' }).catch(() => {}); await p.waitForTimeout(800);
await p.screenshot({ path: out, fullPage: true }); await b.close();
