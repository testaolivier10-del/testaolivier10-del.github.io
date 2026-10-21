const { chromium } = require('playwright-core'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', (m) => console.log('C:', m.text())); p.on('pageerror', (e) => console.log('E:', e.message));
  await p.goto('file://' + path.resolve(process.argv[2]));
  console.log('webgl', await p.evaluate(() => !!document.createElement('canvas').getContext('webgl')));
  const r = await Promise.race([p.evaluate(async () => { await window.__seek(3.4); return 'drawn'; }), new Promise((r) => setTimeout(() => r('timeout'), 20000))]);
  console.log(r);
  await p.screenshot({ path: process.argv[3] }); await b.close();
})();
