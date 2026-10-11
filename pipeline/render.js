const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = process.argv[2];
  const thumbMode = process.argv[3] === 'thumb';
  const stills = thumbMode ? [] : process.argv.slice(3).map(Number);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json')));
  const FPS = 30;
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(dir, 'index.html'));
  await page.evaluate(() => document.fonts.ready.then(() => 1));

  const syncManim = async (t) => page.evaluate(async (t) => {
    const imgs = [...document.querySelectorAll('img.mclip')];
    await Promise.all(imgs.map(async (im) => {
      const s = +im.dataset.start, n = +im.dataset.n, fps = +im.dataset.fps;
      if (t < s) { im.style.opacity = 0; return; }
      const i = Math.min(n - 1, Math.floor((t - s) * fps));
      const src = `${im.dataset.dir}/${String(i).padStart(4, '0')}.png`;
      if (im.getAttribute('src') !== src) { im.setAttribute('src', src); try { await im.decode(); } catch (e) {} }
      if (im.dataset.hold !== 'manual') im.style.opacity = 1;
    }));
    return 1;
  }, t);
  if (thumbMode) {
    const t = Number(process.argv[4] || 0.7);
    await page.evaluate((t) => { window.__timelines.main.time(t, false); return 1; }, t);
    await syncManim(t);
    await page.evaluate(() => {
      for (const id of ['captions', 'progress']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
      const d = document.createElement('div');
      d.textContent = 'levlprep.com';
      d.style.cssText = 'position:absolute;left:0;right:0;top:1440px;text-align:center;z-index:30;font-family:Inter,Arial,sans-serif;font-weight:900;font-size:76px;letter-spacing:-1px;color:var(--teal,#2ee6d6);text-shadow:0 6px 0 rgba(0,0,0,.35)';
      document.body.appendChild(d);
      return 1;
    });
    await page.screenshot({ path: path.join(dir, 'thumb.png') });
    await browser.close();
    console.log('thumb', dir);
    return;
  }
  if (stills.length) {
    for (const t of stills) {
      await page.evaluate((t) => { window.__timelines.main.time(t, false); return 1; }, t);
      await syncManim(t);
      await page.screenshot({ path: path.join(dir, `still_${t}.png`) });
    }
    await browser.close();
    return;
  }
  const total = meta.total;
  const frames = Math.round(total * FPS);
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(dir, 'mix.wav'),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-maxrate', '12M', '-bufsize', '24M', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path.join(dir, 'final.mp4')],
    { stdio: ['pipe', 'ignore', 'ignore'] });
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => { window.__timelines.main.time(t, false); return 1; }, i / FPS);
    await syncManim(i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log('done', dir);
})();
