// node snap.js page.html out.png [t] [w] [h]  -> one frame as PNG (page defines window.__seek)
const { chromium } = require('playwright-core'); const path = require('path');
(async () => {
  const [p, out, t = 0, w = 1920, h = 1080] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const pg = await b.newPage({ viewport: { width: +w, height: +h } });
  await pg.goto('file://' + path.resolve(p));
  await pg.evaluate(async (t) => { if (window.__seek) await window.__seek(t); }, +t);
  await pg.screenshot({ path: out }); await b.close();
})();
