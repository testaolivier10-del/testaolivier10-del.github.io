// LevlPrep renderer. node render.js out/<id>            -> final.mp4 (video + mix.wav)
//                     node render.js out/<id> t1 t2 ...  -> still_<t>.png
//                     node render.js out/<id> thumb [s]  -> thumb.png
// Full renders split the frames into LP_WORKERS ranges (default: number of CPU cores, at most 6),
// each rendered by its own browser into its own segment, then joined without re-encoding.
// Frames are captured with the Chrome DevTools screenshot call directly (faster than page.screenshot).
// LP_WORKERS=1 gives the old one-browser behaviour. LP_AUDIO=<file> muxes another mix (e.g. mix_nomusic.wav)
// and LP_OUT=<name> changes the output file name.
const { chromium } = require('playwright-core');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const FPS = 30;
function chromePath() {
  const base = '/opt/pw-browsers';
  const dirs = fs.existsSync(base) ? fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split('-')[1] - +a.split('-')[1]) : [];
  for (const d of dirs) for (const sub of ['chrome-linux', 'chrome-linux64']) {
    const p = path.join(base, d, sub, 'chrome');
    if (fs.existsSync(p)) return p;
  }
  return '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
}

async function openPage(dir) {
  const browser = await chromium.launch({
    executablePath: chromePath(),
    args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(dir, 'index.html'));
  await page.evaluate(() => document.fonts.ready.then(() => 1));
  const cdp = await page.context().newCDPSession(page);
  return { browser, page, cdp };
}

async function seek(page, t) {
  await page.evaluate(async (t) => {
    window.__timelines.main.time(t, false);
    const imgs = [...document.querySelectorAll('img.mclip')];
    await Promise.all(imgs.map(async (im) => {
      const s = +im.dataset.start, n = +im.dataset.n, fps = +im.dataset.fps;
      if (t < s) { im.style.opacity = 0; return; }
      const i = Math.min(n - 1, Math.floor((t - s) * fps));
      const src = `${im.dataset.dir}/${String(i).padStart(4, '0')}.png`;
      if (im.getAttribute('src') !== src) { im.setAttribute('src', src); try { await im.decode(); } catch (e) {} }
      if (im.dataset.hold !== 'manual') im.style.opacity = 1;
    }));
    if (window.__onSeek) await window.__onSeek(t);
    if (window.__studioHooks) for (const h of window.__studioHooks) await h(t);
    return 1;
  }, t);
}

async function grab(cdp) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95, optimizeForSpeed: true, captureBeyondViewport: false });
  return Buffer.from(r.data, 'base64');
}

async function renderRange(dir, from, to, segPath) {
  const { browser, page, cdp } = await openPage(dir);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-maxrate', '12M', '-bufsize', '24M', '-pix_fmt', 'yuv420p',
    '-r', String(FPS), segPath], { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let i = from; i < to; i++) {
    await seek(page, i / FPS);
    const buf = await grab(cdp);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  const code = await new Promise((r) => ff.on('close', r));
  await browser.close();
  if (code !== 0) throw new Error(`ffmpeg failed on frames ${from}-${to}`);
}

(async () => {
  const dir = path.resolve(process.argv[2]);
  const thumbMode = process.argv[3] === 'thumb';
  const stills = thumbMode ? [] : process.argv.slice(3).map(Number);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json')));

  if (thumbMode || stills.length) {
    const { browser, page } = await openPage(dir);
    if (thumbMode) {
      const t = Number(process.argv[4] || 0.7);
      await seek(page, t);
      await page.evaluate(() => {
        for (const id of ['captions', 'progress']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
        const d = document.createElement('div');
        d.textContent = 'levlprep.com';
        d.style.cssText = 'position:absolute;left:0;right:0;top:1440px;text-align:center;z-index:30;font-family:Inter,Arial,sans-serif;font-weight:900;font-size:76px;letter-spacing:-1px;color:var(--teal,#2ee6d6);text-shadow:0 6px 0 rgba(0,0,0,.35)';
        document.body.appendChild(d);
        return 1;
      });
      await page.screenshot({ path: path.join(dir, 'thumb.png') });
      console.log('thumb', dir);
    } else {
      for (const t of stills) { await seek(page, t); await page.screenshot({ path: path.join(dir, `still_${t}.png`) }); }
    }
    await browser.close();
    return;
  }

  const frames = Math.round(meta.total * FPS);
  const workers = Math.max(1, Math.min(Number(process.env.LP_WORKERS || os.cpus().length), 6, Math.ceil(frames / 30)));
  const segDir = path.join(dir, 'segs'); fs.mkdirSync(segDir, { recursive: true });
  const per = Math.ceil(frames / workers), jobs = [], list = [];
  for (let w = 0; w < workers; w++) {
    const from = w * per, to = Math.min(frames, from + per);
    if (from >= to) break;
    const seg = path.join(segDir, `seg${w}.mp4`); list.push(`file '${seg}'`);
    jobs.push(renderRange(dir, from, to, seg));
  }
  await Promise.all(jobs);
  fs.writeFileSync(path.join(segDir, 'list.txt'), list.join('\n') + '\n');
  const audio = process.env.LP_AUDIO || path.join(dir, 'mix.wav');
  const out = path.join(dir, process.env.LP_OUT || 'final.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(segDir, 'list.txt'), '-i', audio,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  const nm = path.join(dir, 'mix_nomusic.wav');
  if (!process.env.LP_AUDIO && fs.existsSync(nm)) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(segDir, 'list.txt'), '-i', nm,
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path.join(dir, 'final_nomusic.mp4')]);
  }
  fs.rmSync(segDir, { recursive: true, force: true });
  console.log('done', dir, `${workers} workers`);
})();
