/* Does any text sit on top of something it should not?

   Renders one page of every page type in a real browser, at phone and desktop
   width, and flags the layout collisions a student sees:
     text-overlap   text from two different elements drawn over each other
     text-on-edge   text running into or through the border/background edge of a
                    box it is not inside (a chip's border through a subtitle)
     spill          text spilling out of the bordered/backgrounded box it is in
     clipped        text cut off by an ancestor with overflow hidden/clip
     too-wide       something wider than the viewport (the page scrolls sideways)
     text-on-picture  text drawn over a picture it does not belong to
     out-of-block   text running out of the block it sits in
   Skipped by design: anything inside a position:fixed or sticky ancestor (header,
   tab bar, sticky bars overlap content on purpose), hidden or aria-hidden content,
   screen-reader-only text, SVG figures (check-legibility.mjs covers those),
   scrolling boxes (content past their edge is reachable) and anything marked
   data-overlap-ok.

   STATES
     empty      first visit, nothing stored
     progress   a short practice set answered first in the same browser, Premium
                stubbed on, then the course's main pages (dashboard, path, ...)

   USAGE
     node scripts/check-overlap.mjs                       every page type
     node scripts/check-overlap.mjs nremt/dashboard.html  given pages (empty state)
     COURSE=nremt node scripts/check-overlap.mjs          one course, both states
     STATES=empty WIDTHS=390 OUT=report.json node scripts/check-overlap.mjs
     SAMPLE=5 node scripts/check-overlap.mjs              five pages from each notes, lessons, frq... folder
     SHOTS=/tmp/dir ...  full page screenshots of the practice states it scans
     CHROME=/path/to/chrome CONC=4

   Exits non-zero when anything is flagged.
*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const WIDTHS = (process.env.WIDTHS || '390,768,1280,1700').split(',').map(Number);
const STATES = (process.env.STATES || 'empty,progress').split(',');
const CONC = Number(process.env.CONC || 4);
const HEIGHT = { 390: 844, 1280: 900 };

const COURSES = ['nremt', 'ochem', 'anatomy-physiology', 'bio', 'chem', 'physics', 'calculus', 'calculus-bc',
  'precalculus', 'statistics', 'environmental-science', 'psychology', 'macroeconomics', 'microeconomics', 'human-geography'];
const ONE_OF = ['notes', 'lessons', 'units', 'unit-sheets', 'unit-tests', 'frq', 'chapters', 'concepts', 'mechanisms'];

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain' };

function serve() {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch {}
    fs.readFile(f, (err, buf) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

const html = d => fs.existsSync(path.join(ROOT, d)) ? fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.html')).sort() : [];
function coursePages(c) {
  const out = html(c).map(f => `${c}/${f}`);
  for (const f of html(`${c}/tools`)) out.push(`${c}/tools/${f}`);
  for (const d of ONE_OF) {
    const fs_ = html(`${c}/${d}`); if (!fs_.length) continue;
    const n = Number(process.env.SAMPLE || 1);
    if (n > 1) { for (let i = 0; i < Math.min(n, fs_.length); i++) out.push(`${c}/${d}/${fs_[Math.floor(i * fs_.length / Math.min(n, fs_.length))]}`); continue; }
    const pick = fs_.find(f => /^unit-?1\b|^u1|^1-/.test(f)) || fs_[Math.min(1, fs_.length - 1)];
    out.push(`${c}/${d}/${pick}`);
  }
  return out;
}
const MAIN = /\/(index|dashboard|path|practice|review|flashcards|exams|learn|mastery|tools|cram|study-plan)\.html$/;
function sitePages() {
  return [...html('.').filter(f => !/^google/.test(f)).map(f => f), ...html('teach').map(f => `teach/${f}`)];
}

/* Runs inside the page. */
function scan() {
  const found = [];
  const W = innerWidth, SX = scrollX, SY = scrollY;
  const cs = new Map();
  const st = el => { let s = cs.get(el); if (!s) { s = getComputedStyle(el); cs.set(el, s); } return s; };
  const skipMemo = new Map();
  /* Fixed/sticky chrome, hidden or decorative subtrees, figures, opt-outs. */
  const skip = el => {
    if (!el || el === document.documentElement) return false;
    if (skipMemo.has(el)) return skipMemo.get(el);
    const s = st(el);
    let v = s.position === 'fixed' || s.position === 'sticky' ||
      /* deliberate overlays: coach marks, popovers, menus */
      (s.position === 'absolute' && parseInt(s.zIndex, 10) >= 20) || s.display === 'none' || s.visibility === 'hidden' ||
      +s.opacity === 0 || el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('data-overlap-ok') ||
      el.tagName === 'svg' || el.namespaceURI === 'http://www.w3.org/1998/Math/MathML' || el.tagName === 'DIALOG' && !el.open || el.tagName === 'TEMPLATE' || el.tagName === 'SELECT' ||
      el.tagName === 'OPTION' || el.tagName === 'NOSCRIPT' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE' ||
      /* elements on their way in or out (transform scale/fade) */
      (s.animationName !== 'none' && s.animationPlayState === 'running');
    if (!v) v = skip(el.parentElement);
    /* closed <details> bodies and content-visibility:hidden still report rects */
    if (!v && el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) v = true;
    skipMemo.set(el, v);
    return v;
  };
  const desc = el => {
    const one = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
      (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    const parts = [one(el)];
    for (let p = el.parentElement, i = 0; p && i < 2 && p !== document.body; p = p.parentElement, i++) parts.unshift(one(p));
    return parts.join(' > ');
  };
  const txt = el => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50);
  const R = r => ({ l: r.left + SX, r: r.right + SX, t: r.top + SY, b: r.bottom + SY });
  const inter = (a, b) => ({ w: Math.min(a.r, b.r) - Math.max(a.l, b.l), h: Math.min(a.b, b.b) - Math.max(a.t, b.t) });

  /* The part of the page an element can show through: every ancestor that hides
     or scrolls overflow cuts it down. Text outside it is not drawn here. */
  const visMemo = new Map();
  const ALL = { l: -1e9, r: 1e9, t: -1e9, b: 1e9 };
  /* the clip applied to el's content: el's own overflow and every ancestor's */
  const visBox = el => {
    if (!el || el === document.body || el === document.documentElement) return ALL;
    if (visMemo.has(el)) return visMemo.get(el);
    const up = visBox(el.parentElement), s = st(el);
    let box = up;
    if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
      const r = R(el.getBoundingClientRect());
      box = { ...up };
      if (s.overflowX !== 'visible') { box.l = Math.max(box.l, r.l); box.r = Math.min(box.r, r.r); }
      if (s.overflowY !== 'visible') { box.t = Math.max(box.t, r.t); box.b = Math.min(box.b, r.b); }
    }
    visMemo.set(el, box);
    return box;
  };
  const cut = (r, c) => ({ l: Math.max(r.l, c.l), r: Math.min(r.r, c.r), t: Math.max(r.t, c.t), b: Math.min(r.b, c.b) });

  /* Text fragments: one rect per line of every visible text node. */
  const texts = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const rg = document.createRange();
  for (let n; (n = tw.nextNode());) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || skip(el)) continue;
    const pr = el.getBoundingClientRect();
    if (pr.width <= 2 || pr.height <= 2) continue;            // screen-reader-only text
    const s = st(el);
    if (s.clipPath && s.clipPath !== 'none' || s.clip && s.clip !== 'auto') continue;
    if (parseFloat(s.fontSize) < 6) continue;
    if (/transparent|rgba\(.*, 0\)$/.test(s.color) && !/text/.test(s.webkitBackgroundClip || s.backgroundClip)) continue;
    rg.selectNodeContents(n);
    for (const r of rg.getClientRects()) {
      if (r.width < 2 || r.height < 4) continue;
      const full = R(r), v = cut(full, visBox(el));
      /* glyph boxes carry the font's internal leading; keep roughly the ink */
      const sh = 0.15 * (v.b - v.t); v.t += sh; v.b -= sh;
      if (v.r - v.l < 2 || v.b - v.t < 4) continue;          // scrolled or clipped out of sight
      texts.push({ el, n, r: v, full, fs: parseFloat(s.fontSize) });
    }
  }

  /* Boxes with a visible edge: a border, or a background that differs from the page. */
  const boxes = [];
  const colorOn = c => c && !/^rgba\(.*, 0\)$/.test(c) && c !== 'transparent';
  for (const el of document.body.querySelectorAll('*')) {
    if (skip(el)) continue;
    const s = st(el);
    if (s.display === 'inline' || s.display === 'contents') continue;
    const bw = ['Top', 'Right', 'Bottom', 'Left'].some(k => parseFloat(s['border' + k + 'Width']) > 0 && colorOn(s['border' + k + 'Color']) && s['border' + k + 'Style'] !== 'none');
    const bg = colorOn(s.backgroundColor) || (s.backgroundImage !== 'none' && /gradient/.test(s.backgroundImage)) ||
      (s.boxShadow !== 'none');
    if (!bw && !bg) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    const v = cut(R(r), visBox(el.parentElement));
    if (v.r - v.l < 4 || v.b - v.t < 4) continue;
    boxes.push({ el, r: v, bw });
  }

  const bgMemo = new Map();
  const opaque = c => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return false; const p = m[1].split(',').map(Number); return p.length < 4 || p[3] >= 0.6; };
  const ownBg = el => {
    if (!el || el === document.body || el === document.documentElement) return null;
    if (bgMemo.has(el)) return bgMemo.get(el);
    const s = st(el);
    const v = (opaque(s.backgroundColor) || /gradient|url/.test(s.backgroundImage)) && s.display !== 'inline' ? el : ownBg(el.parentElement);
    bgMemo.set(el, v); return v;
  };

  /* Spatial grid so pair tests stay fast on long pages. */
  const G = 80;
  const grid = new Map();
  const cells = r => { const out = []; for (let x = Math.floor(r.l / G); x <= Math.floor(r.r / G); x++) for (let y = Math.floor(r.t / G); y <= Math.floor(r.b / G); y++) out.push(x + ',' + y); return out; };
  texts.forEach((t, i) => { for (const k of cells(t.r)) { let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i); } });

  /* (a) text over text */
  const seen = new Set();
  texts.forEach((A, i) => {
    const cand = new Set(); for (const k of cells(A.r)) for (const j of grid.get(k) || []) if (j > i) cand.add(j);
    for (const j of cand) {
      const B = texts[j];
      if (A.n === B.n) continue;
      const { w, h } = inter(A.r, B.r);
      if (w <= 2 || h <= 0) continue;
      /* Font boxes are taller than a tight line box: stacked lines touch a little. */
      if (h < 0.2 * Math.min(A.r.b - A.r.t, B.r.b - B.r.t) || h < 2) continue;
      /* One element's text inside an inline box of the other (a tooltip, ruby) */
      const key = desc(A.el) + '|' + desc(B.el);
      if (seen.has(key)) continue; seen.add(key);
      found.push({ kind: 'text-overlap', a: desc(A.el), b: desc(B.el), text: `${txt(A.el)} / ${txt(B.el)}`, by: Math.round(Math.min(w, h)), at: [Math.round(A.r.l), Math.round(A.r.t)] });
    }
  });

  /* (b) text crossing the edge of a box it is not inside, (c) spilling out of its own box */
  const boxSet = new Set(boxes.map(b => b.el));
  const nearestBox = el => { for (let e = el; e && e !== document.body; e = e.parentElement) if (boxSet.has(e)) return e; return null; };
  const bgrid = new Map();
  boxes.forEach((b, i) => { for (const k of cells(b.r)) { let a = bgrid.get(k); if (!a) bgrid.set(k, a = []); a.push(i); } });
  const seenB = new Set();
  const later = [];   // text in its own card over another box: settle by hit testing
  for (const T of texts) {
    const cand = new Set(); for (const k of cells(T.r)) for (const j of bgrid.get(k) || []) cand.add(j);
    for (const j of cand) {
      const B = boxes[j];
      const inside = B.el.contains(T.el);
      const { w, h } = inter(T.r, B.r);
      if (w <= 0 || h <= 0) continue;
      if (inside) {
        /* only the nearest box around the text: a wide figure may leave its column by design */
        if (nearestBox(T.el) !== B.el) continue;
        /* text sticking out of its own bordered/backgrounded box */
        const out = Math.max(B.r.l - T.r.l, T.r.r - B.r.r, B.r.t - T.r.t, T.r.b - B.r.b);
        const lim = T.r.b - T.r.t; // glyph boxes are taller than tight boxes; allow a fifth of a line vertically
        const horiz = Math.max(B.r.l - T.r.l, T.r.r - B.r.r);
        const vert = Math.max(B.r.t - T.r.t, T.r.b - B.r.b);
        if (horiz > 2 || vert > Math.max(3, 0.25 * lim)) {
          const key = 'spill|' + desc(T.el) + '|' + desc(B.el);
          if (!seenB.has(key)) { seenB.add(key); found.push({ kind: 'spill', a: desc(T.el), b: desc(B.el), text: txt(T.el), by: Math.round(out), at: [Math.round(T.r.l), Math.round(T.r.t)], box: [Math.round(B.r.l), Math.round(B.r.r), Math.round(B.r.t), Math.round(B.r.b)] }); }
        }
        continue;
      }
      if (T.el.contains(B.el)) continue;              // an inline chip within this paragraph's own flow
      /* Text inside its own opaque card that sits over another box (a card
         pulled up over the band): the card covers the edge, the text is clean. */
      const own = ownBg(T.el);
      const key0 = 'edge|' + desc(T.el) + '|' + desc(B.el);
      if (own && !own.contains(B.el) && !B.el.contains(own)) {
        if (!seenB.has(key0)) later.push({ T, B, own, w, h });
        continue;
      }
      /* How far into the box does the text reach? A glyph box grazing an edge by
         a pixel or two is spacing, not overlap. */
      if (h < 2 || w < 3) continue;
      /* wholly inside the box: a badge placed on a chip, not a collision with its edge */
      if (T.r.l >= B.r.l + 1 && T.r.r <= B.r.r - 1 && T.r.t >= B.r.t + 1 && T.r.b <= B.r.b - 1) continue;
      /* A box that only paints behind (z order): is the text drawn under the box? Either way
         text and an edge share pixels, so report it; positioned overlays with the text on top
         of a filled box still read as a collision. */
      const key = 'edge|' + desc(T.el) + '|' + desc(B.el);
      if (seenB.has(key)) continue; seenB.add(key);
      found.push({ kind: 'text-on-edge', a: desc(T.el), b: desc(B.el), text: `${txt(T.el)} / [${txt(B.el).slice(0, 30)}]`, by: Math.round(Math.min(w, h)), at: [Math.round(T.r.l), Math.round(T.r.t)] });
    }
  }

  /* Hit test at the middle of the shared area: if the other box is drawn over the
     text, the text is covered; if the text's own card is on top, it is clean. */
  document.documentElement.style.scrollBehavior = 'auto';
  for (const { T, B, own } of later) {
    const key = 'edge|' + desc(T.el) + '|' + desc(B.el);
    if (seenB.has(key)) continue;
    const c = cut(T.r, B.r), x = (c.l + c.r) / 2, y = (c.t + c.b) / 2;
    scrollTo(Math.max(0, x - innerWidth / 2), Math.max(0, y - innerHeight / 2));
    const hits = document.elementsFromPoint(x - scrollX, y - scrollY);
    const top = hits.find(e => own.contains(e) || B.el.contains(e) || e.contains(own) && e.contains(B.el));
    if (!top || own.contains(top) && !B.el.contains(top) || top.contains(own)) continue;
    seenB.add(key);
    found.push({ kind: 'text-covered', a: desc(T.el), b: desc(B.el), text: `${txt(T.el)} / [${txt(B.el).slice(0, 30)}]`, by: Math.round(Math.min(c.r - c.l, c.b - c.t)), at: [Math.round(T.r.l), Math.round(T.r.t)] });
  }
  scrollTo(0, 0);
  /* (d) text clipped by overflow hidden/clip (not a scroller, not an ellipsis). */
  const clipMemo = new Map();
  const clipOf = el => {
    if (clipMemo.has(el)) return clipMemo.get(el);
    let box = null;
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const s = st(e);
      if (/auto|scroll/.test(s.overflowX + s.overflowY)) break;
      const cut = v => v === 'hidden' || v === 'clip';
      if (!cut(s.overflowX) && !cut(s.overflowY)) continue;
      if (s.textOverflow === 'ellipsis' || +s.webkitLineClamp > 0 || s.webkitLineClamp && s.webkitLineClamp !== 'none') { box = { ellipsis: true }; break; }
      const r = R(e.getBoundingClientRect());
      box = box || { l: -1e9, r: 1e9, t: -1e9, b: 1e9, el: e };
      if (cut(s.overflowX)) { box.l = Math.max(box.l, r.l); box.r = Math.min(box.r, r.r); }
      if (cut(s.overflowY)) { box.t = Math.max(box.t, r.t); box.b = Math.min(box.b, r.b); }
      box.el = e;
    }
    clipMemo.set(el, box);
    return box;
  };
  const seenC = new Set();
  for (const T of texts) {
    const c = clipOf(T.el);
    if (!c || c.ellipsis) continue;
    const F = T.full, lineH = F.b - F.t;   // the full glyph box: its leading may be cut, the ink may not
    const horiz = Math.max(c.l - F.l, F.r - c.r), vert = Math.max(c.t - F.t, F.b - c.b);
    if (horiz > 2 || vert > Math.max(3, 0.35 * lineH)) {
      /* Fully outside: content parked off screen on purpose (carousels, slide-ins). */
      if (F.r <= c.l || F.l >= c.r || F.b <= c.t || F.t >= c.b) continue;
      const key = desc(T.el) + '|' + desc(c.el);
      if (seenC.has(key)) continue; seenC.add(key);
      found.push({ kind: 'clipped', a: desc(T.el), b: desc(c.el), text: txt(T.el), by: Math.round(Math.max(horiz, vert)) });
    }
  }

  /* (f) text drawn over a picture it does not belong to (a course title running under the cover art),
     and (g) text running out of the block it sits in. Both escaped the checks above: the block's own
     box fits, only the letters leave it, and a picture has no text and no border to collide with. */
  const media = [];
  for (const m of document.body.querySelectorAll('img,svg,canvas,video')) {
    /* Pictures are often aria-hidden decoration, which skip() ignores: test what is drawn, not what is announced. */
    let gone = m.tagName.toLowerCase() !== 'svg' && !!m.closest('svg');
    for (let e = m; e && e !== document.documentElement && !gone; e = e.parentElement) {
      const q = st(e);
      gone = q.display === 'none' || q.visibility === 'hidden' || +q.opacity === 0 || q.position === 'fixed' || q.position === 'sticky' || e.hasAttribute('data-overlap-ok');
    }
    if (gone || m.checkVisibility && !m.checkVisibility()) continue;
    const r = m.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) continue;              // icons sit inside lines of text on purpose
    if (st(m).opacity < 0.2) continue;
    media.push({ el: m, r: cut(R(r), visBox(m.parentElement)) });
  }
  const seenP = new Set();
  for (const T of texts) {
    if (T.el.closest('svg') || T.el.closest('.ls-pill')) continue;   // a tool's status pill is laid over its picture on purpose
    for (const M of media) {
      const box = M.el.parentElement;
      if (!box || box.contains(T.el) || T.el.contains(M.el)) continue;   // a caption laid over its own picture
      const ox = Math.min(T.r.r, M.r.r) - Math.max(T.r.l, M.r.l), oy = Math.min(T.r.b, M.r.b) - Math.max(T.r.t, M.r.t);
      if (ox < 6 || oy < 4) continue;
      const key = desc(T.el) + '|' + desc(M.el);
      if (seenP.has(key)) continue; seenP.add(key);
      /* Ask the browser itself: at the middle of the overlap, are the picture and the text both there? */
      const cx = (Math.max(T.r.l, M.r.l) + Math.min(T.r.r, M.r.r)) / 2, cy = (Math.max(T.r.t, M.r.t) + Math.min(T.r.b, M.r.b)) / 2;
      const y0 = scrollY; scrollTo({ left: scrollX, top: Math.max(0, cy - innerHeight / 2), behavior: 'instant' });
      const hit = document.elementsFromPoint(cx - scrollX, cy - scrollY);
      scrollTo({ left: scrollX, top: y0, behavior: 'instant' });
      if (!hit.some(e => e === M.el || M.el.contains(e))) continue;   // overflowing letters are not hit-testable, the picture is
      found.push({ kind: 'text-on-picture', a: desc(T.el), b: desc(M.el), text: txt(T.el), by: Math.round(ox) });
    }
  }
  const seenO = new Set();
  for (const T of texts) {
    if (T.el.closest('svg')) continue;
    let blk = T.el;
    while (blk && blk !== document.body && /^inline/.test(st(blk).display)) blk = blk.parentElement;
    if (!blk || blk === document.body) continue;
    let clips = false;
    for (let e = blk; e && e !== document.body; e = e.parentElement) { if (/auto|scroll/.test(st(e).overflowX)) { clips = true; break; } }
    if (clips) continue;                                       // text past the edge of a scrolling box is reachable
    { const q = st(blk);                                       // a block that cuts its own text on purpose is (d)'s business
      if (q.overflowX === 'hidden' || q.overflowX === 'clip' || q.textOverflow === 'ellipsis' || +q.webkitLineClamp > 0) continue; }
    const br = R(blk.getBoundingClientRect());
    const by = Math.max(T.full.r - br.r, br.l - T.full.l);
    if (by <= 3) continue;
    const key = desc(blk);
    if (seenO.has(key)) continue; seenO.add(key);
    found.push({ kind: 'out-of-block', a: desc(T.el), b: desc(blk), text: txt(T.el), by: Math.round(by) });
  }

  /* (e) wider than the viewport */
  const sw = document.documentElement.scrollWidth;
  if (sw > W + 1) {
    let worst = null;
    for (const el of document.body.querySelectorAll('*')) {
      if (skip(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right + SX <= W + 1 || r.width === 0) continue;
      let scrolls = false;
      for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
        const s = st(e); if (s.overflowX !== 'visible') { scrolls = true; break; }
      }
      if (scrolls) continue;
      if (!worst || r.right > worst.r) worst = { el, r: r.right };
    }
    found.push({ kind: 'too-wide', a: worst ? desc(worst.el) : '?', text: worst ? txt(worst.el) : '', by: sw - W });
  }
  return found;
}

/* A short practice set: answer the first choice and move on, so the dashboard,
   path and review pages have something to show. */
async function practise(page, base, course, onScan) {
  await page.goto(`${base}${course}/practice.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(600);
  const start = page.locator(".pp-go:visible, .pp-mbar-go:visible").first();
  if (await start.count()) await start.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1200);
  let answered = 0;
  for (let i = 0; i < 24 && answered < 10; i++) {
    const opt = page.locator('.cx-opt:visible').first();
    if (await opt.count()) { await opt.click({ timeout: 3000 }).catch(() => {}); answered++; }
    await page.waitForTimeout(200);
    for (const label of ['Check', 'Submit', 'Next', 'Continue']) {
      const b = page.locator(`button:visible:text-is("${label}"), button:visible:has-text("${label} ")`).first();
      if (await b.count()) { await b.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(250); }
      /* the question with its feedback open, once per run */
      if (label === 'Check' && answered === 2 && onScan) await onScan('practice: question with feedback');
    }
    if (answered === 1 && i === 0 && onScan) await onScan('practice: question');
  }
  const end = page.locator('button:visible:has-text("End session"), button:visible:has-text("Finish")').first();
  if (await end.count()) { await end.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(400);
    const ok = page.locator('button:visible:has-text("End"), button:visible:has-text("Yes")').first();
    if (await ok.count()) await ok.click({ timeout: 2000 }).catch(() => {}); }
  await page.waitForTimeout(800);
  if (onScan) await onScan('practice: session summary');
  return answered;
}

const PREMIUM = `Object.defineProperty(window,'LevlPremium',{configurable:true,set(v){v.has=function(){return true};this._lp=v},get(){return this._lp}})`;

async function scanPage(page, url, w) {
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(700);
  await page.evaluate(() => document.fonts && document.fonts.ready);
  /* Let lazy blocks and content-visibility sections lay out. */
  await page.evaluate(async () => {
    for (const e of document.querySelectorAll('*')) { const s = getComputedStyle(e); if (s.contentVisibility === 'auto') e.style.contentVisibility = 'visible'; }
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < Math.min(H, 30000); y += 800) { scrollTo(0, y); await new Promise(r => setTimeout(r, 20)); }
    scrollTo(0, 0); await new Promise(r => setTimeout(r, 200));
  });
  return page.evaluate(scan);
}

const args = process.argv.slice(2);
const jobs = [];   // { course|null, state, pages:[...], w }
if (args.length) {
  for (const w of WIDTHS) for (const f of args) jobs.push({ state: 'empty', pages: [f], w });
} else {
  const courses = process.env.COURSE ? process.env.COURSE.split(',') : COURSES;
  for (const w of WIDTHS) {
    if (STATES.includes('empty')) {
      for (const c of courses) for (const f of coursePages(c)) jobs.push({ state: 'empty', pages: [f], w });
      if (!process.env.COURSE) for (const f of sitePages()) jobs.push({ state: 'empty', pages: [f], w });
    }
    if (STATES.includes('progress')) {
      for (const c of courses) jobs.push({ state: 'progress', course: c, pages: coursePages(c).filter(f => MAIN.test('/' + f)), w });
      if (!process.env.COURSE) jobs.push({ state: 'progress', course: 'nremt', pages: ['index.html', 'dashboard.html', 'account.html'], w, site: true });
    }
  }
}

const srv = await serve();
const base = `http://127.0.0.1:${srv.address().port}/`;
let browser;
const launch = async () => { browser = await chromium.launch({ executablePath: process.env.CHROME || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined) }); };
await launch();
const report = [];
let next = 0, done = 0, total = jobs.reduce((n, j) => n + j.pages.length, 0);

async function runJob(j) {
  const ctx = await browser.newContext({ viewport: { width: j.w, height: HEIGHT[j.w] || 900 }, deviceScaleFactor: 1 });
  try {
    await ctx.route(u => !u.href.startsWith(base), r => r.abort());
    if (j.state === 'progress') await ctx.addInitScript(PREMIUM);
    const page = await ctx.newPage();
    if (j.state === 'progress') {
      const onScan = async label => {
        /* A scan 250 ms after Check or Next caught the card mid-change (feedback opening, the next question
           sliding in): wait until the page has stopped moving. */
        await page.evaluate(async () => {
          let last = '', same = 0;
          for (let i = 0; i < 20 && same < 3; i++) {
            const k = document.documentElement.scrollHeight + '|' + Math.round(scrollY) + '|' + document.body.querySelectorAll('*').length;
            same = k === last ? same + 1 : 0; last = k;
            await new Promise(r => setTimeout(r, 150));
          }
        }).catch(() => {});
        if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${j.course}-${j.w}-${label.replace(/\W+/g, '-')}.png`, fullPage: true }).catch(() => {});
        try { for (const x of await page.evaluate(scan)) report.push({ file: `${j.course}/practice.html`, width: j.w, state: label, ...x }); } catch {}
      };
      const n = await practise(page, base, j.course, onScan).catch(() => 0);
      if (!n) report.push({ file: `${j.course}/practice.html`, width: j.w, state: j.state, kind: 'note', text: 'practice driver answered nothing' });
    }
    for (const f of j.pages) {
      try {
        for (const x of await scanPage(page, base + f, j.w)) report.push({ file: f, width: j.w, state: j.state, ...x });
      } catch (e) {
        report.push({ file: f, width: j.w, state: j.state, kind: 'load-error', text: String(e.message).split('\n')[0].slice(0, 100) });
      }
      done++;
    }
  } finally { await ctx.close().catch(() => {}); }
}
async function worker() {
  while (next < jobs.length) {
    const j = jobs[next++];
    try { await runJob(j); } catch (e) {
      if (!browser.isConnected()) await launch();
      report.push({ file: j.pages[0], width: j.w, state: j.state, kind: 'load-error', text: String(e.message).split('\n')[0].slice(0, 100) });
    }
    if (process.env.OUT && done % 50 < 2) fs.writeFileSync(process.env.OUT, JSON.stringify({ done, total, report }, null, 1));
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
await browser.close().catch(() => {}); srv.close();

if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({ done, total, finished: true, report }, null, 1));
const issues = report.filter(r => r.kind !== 'note');
const byKind = {};
for (const r of issues) byKind[r.kind] = (byKind[r.kind] || 0) + 1;
/* Group the same collision across pages and widths. */
const groups = new Map();
for (const r of issues) {
  const k = `${r.kind} ${r.a || ''} | ${r.b || ''}`.replace(/#[\w-]+/g, '');
  const g = groups.get(k) || { k, n: 0, eg: r }; g.n++; groups.set(k, g);
}
console.log(`check-overlap: ${done} page renders`, byKind);
for (const r of report.filter(r => r.kind === 'note')) console.log(`  note ${r.file} @${r.width}: ${r.text}`);
for (const g of [...groups.values()].sort((a, b) => b.n - a.n).slice(0, Number(process.env.SHOW || 60)))
  console.log(`  ${g.n}x ${g.k}\n      e.g. ${g.eg.file} @${g.eg.width} ${g.eg.state}: ${g.eg.text} (${g.eg.by}px)`);
process.exit(issues.length ? 1 : 0);
