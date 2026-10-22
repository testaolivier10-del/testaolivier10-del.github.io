// Save chosen frames of a page as PNGs: node snap_html.js page.html outprefix t1 t2 ...
const { chromium } = require('playwright-core'); const path = require('path');
(async () => {
  const [page_, pre, ...ts] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox','--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => console.log('console:', m.text())); page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.goto('file://' + path.resolve(page_));
  for (const t of ts) { await page.evaluate(async (t) => { await window.__seek(t); }, +t); await page.screenshot({ path: `${pre}_${t}.png` }); }
  await browser.close();
})();
