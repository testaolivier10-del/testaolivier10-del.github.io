// Render a self-contained test page to mp4: node render_html.js page.html out.mp4 seconds [fps] [w] [h]
// The page must define window.__seek(t) (sync or async).
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const [page_, out, secs, fps_ = 30, w = 1920, h = 1080] = process.argv.slice(2);
  const fps = +fps_;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  await page.goto('file://' + path.resolve(page_));
  const cdp = await page.context().newCDPSession(page);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'ignore', 'inherit'] });
  const n = Math.round(+secs * fps);
  for (let i = 0; i < n; i++) {
    await page.evaluate(async (t) => { await window.__seek(t); }, i / fps);
    const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 });
    const buf = Buffer.from(r.data, 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await browser.close();
})();
