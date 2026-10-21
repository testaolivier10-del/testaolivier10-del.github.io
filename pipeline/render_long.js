// node render_long.js <dir> stills t1 t2 ...   -> still_<t>.png
// node render_long.js <dir> seg <f0> <f1> <out.mp4>  -> video-only segment frames [f0,f1)
// node render_long.js <dir> thumb <t>  -> thumb_raw.png (header/progress hidden)
// Frames are captured with the Chrome DevTools screenshot call directly (faster than page.screenshot), and every seek
// also runs window.__onSeek (used by chem.mol3d 3D molecules) so non-GSAP elements are exact on every frame.
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const [dir, mode, ...rest] = process.argv.slice(2);
  const FPS = 30;
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || require('child_process').execSync("ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome | sort -V | tail -1").toString().trim(), args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(dir, 'index.html'));
  await page.evaluate(() => document.fonts.ready.then(() => 1));
  const cdp = await page.context().newCDPSession(page);
  // AI acting shots: <img class="mclip" data-dir data-start data-n data-fps [data-hold="manual"]> show one PNG frame per video frame.
  const seek = (t) => page.evaluate(async (t) => {
    window.__timelines.main.time(t, false);
    await Promise.all([...document.querySelectorAll('img.mclip')].map(async (im) => {
      const s = +im.dataset.start, n = +im.dataset.n, fps = +im.dataset.fps;
      if (t < s) { if (im.dataset.hold !== 'manual') im.style.opacity = 0; return; }
      const src = `${im.dataset.dir}/${String(Math.min(n - 1, Math.floor((t - s) * fps))).padStart(4, '0')}.png`;
      if (im.getAttribute('src') !== src) { im.setAttribute('src', src); try { await im.decode(); } catch (e) {} }
      if (im.dataset.hold !== 'manual') im.style.opacity = 1;
    }));
    if (window.__onSeek) await window.__onSeek(t);
    if (window.__studioHooks) for (const h of window.__studioHooks) await h(t); return 1; }, t);
  if (mode === 'stills') {
    for (const t of rest.map(Number)) { await seek(t); await page.screenshot({ path: path.join(dir, `still_${t}.png`) }); }
  } else if (mode === 'thumb') {
    await seek(Number(rest[0] || 1));
    await page.evaluate(() => { for (const id of ['hdr', 'prog', 'pause']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } return 1; });
    await page.screenshot({ path: path.join(dir, 'thumb_raw.png') });
  } else if (mode === 'seg') {
    const f0 = +rest[0], f1 = +rest[1], out = rest[2];
    // Activity intervals of every tween: frames where nothing is animating reuse the previous capture.
    const iv = await page.evaluate(() => window.__timelines.main.getChildren(true, true, false).map(t => [t.startTime(), t.startTime() + t.totalDuration()])
      .concat([...document.querySelectorAll('img.mclip')].map(im => [+im.dataset.start, +im.dataset.start + (+im.dataset.n) / (+im.dataset.fps)])));
    const busy = (a, b) => iv.some(([s, e]) => s < b + 1e-6 && e > a - 1e-6);
    let last = null, lastT = -1, shots = 0;
    const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'ignore', 'ignore'] });
    for (let i = f0; i < f1; i++) {
      const t = i / FPS;
      let buf;
      if (last && !busy(lastT, t)) { buf = last; }
      else {
        await seek(t);
        const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true });
        buf = Buffer.from(r.data, 'base64'); last = buf; shots++;
      }
      lastT = t;
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise((r) => ff.on('close', r));
    console.log('captured', shots, 'of', f1 - f0, 'frames');
  }
  await browser.close();
})();
