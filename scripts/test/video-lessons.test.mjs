/* Video lessons (docs/video-lessons.md): the data, the block, its place on
   every kind of page, and the player that loads YouTube only on play. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT, START, END, COURSE_DIRS, loadVideos, validate, applyVideo, videoBlock, clock, chaptersFromText } from '../lib/videos.mjs';

const videos = loadVideos();
const SAMPLE = videos.data.videos[0];

test('the data file is valid and every listed page shows its video', () => {
  assert.deepEqual(validate(videos.data), []);
  for (const v of videos.data.videos) for (const p of v.pages) {
    const html = readFileSync(join(ROOT, p), 'utf8');
    assert.equal(html.split(START).length, 2, `${p}: one block`);
    assert.ok(html.includes(`data-video="${v.id}"`), `${p}: shows ${v.id}`);
  }
});

test('validate catches the mistakes a daily run could make', () => {
  const bad = (patch) => validate({ videos: [{ ...SAMPLE, ...patch }] });
  assert.match(bad({ id: 'short' }).join(), /11-character/);
  assert.match(bad({ course: 'nope' }).join(), /unknown course/);
  assert.match(bad({ pages: ['bio/notes/water-hydrogen-bonding.html'] }).join(), /is not a ochem\/notes/);
  assert.match(bad({ pages: ['ochem/notes/no-such-topic.html'] }).join(), /does not exist/);
  assert.match(bad({ chapters: [[5, 'a']] }).join(), /start at 0/);
  assert.match(bad({ chapters: [[0, 'a'], [0, 'b']] }).join(), /does not start after/);
  assert.match(bad({ chapters: [[0, 'a'], [99999, 'b']] }).join(), /after the video ends/);
  assert.match(bad({ posted: '7 Oct' }).join(), /YYYY-MM-DD/);
  assert.match(validate({ videos: [SAMPLE, { ...SAMPLE, id: 'abcdefghijk' }] }).join(), /one video per page/);
});

test('the block loads nothing from YouTube before play', () => {
  for (const compact of [false, true]) {
    const html = videoBlock(SAMPLE, { compact });
    assert.ok(!/<iframe/i.test(html), 'no iframe before play');
    for (const m of html.matchAll(/\s(src|srcset)="([^"]*)"/g)) assert.ok(!/youtu|ytimg|google/i.test(m[2]), `${m[1]} ${m[2]}`);
    for (const m of html.matchAll(/<link[^>]*href="([^"]*)"/g)) assert.ok(m[1].startsWith('/assets/'), m[1]);
    // Without JavaScript every control is a working link to the video.
    assert.match(html, new RegExp(`href="https://www\\.youtube\\.com/watch\\?v=${SAMPLE.id}"`));
    // Reserved size: no layout shift when the image or player lands.
    assert.match(html, /width="1280" height="720"/);
    assert.match(html, /aria-label="Play the video lesson: /);
  }
});

test('every kind of lesson and notes page has exactly one place for a video', () => {
  const kinds = [];
  for (const dir of Object.values(COURSE_DIRS)) for (const sub of ['notes', 'lessons']) {
    const abs = join(ROOT, dir, sub);
    if (!existsSync(abs)) continue;
    const files = readdirSync(abs).filter((f) => f.endsWith('.html'));
    if (!files.length) continue;
    kinds.push(`${dir}/${sub}`);
    for (const f of files) {
      const rel = `${dir}/${sub}/${f}`;
      const html = readFileSync(join(ROOT, rel), 'utf8');
      if (/http-equiv="refresh"/i.test(html)) continue;
      const one = { byPage: new Map([[rel, SAMPLE]]) };
      const out = applyVideo(rel, html, one);
      assert.equal(out.split(START).length, 2, `${rel}: block placed once`);
      assert.equal(applyVideo(rel, out, one), out, `${rel}: placing it again changes nothing`);
      assert.equal(applyVideo(rel, out, { byPage: new Map() }), html.replace(new RegExp(`[ \\t]*${START}[\\s\\S]*?${END}\\n?`), ''), `${rel}: removing it restores the page`);
    }
  }
  assert.ok(kinds.length >= 17, `found ${kinds.length} page kinds`);
});

test('the notes block sits outside the prose the course textbooks read', () => {
  for (const v of videos.data.videos) for (const p of v.pages.filter((x) => x.includes('/notes/'))) {
    const html = readFileSync(join(ROOT, p), 'utf8');
    const at = html.indexOf(START);
    const prose = html.search(/<article\b|<!-- notes:start -->|<section class="section bk-sec"/);
    assert.ok(at > 0 && at < prose, `${p}: block before the prose, not inside it`);
  }
});

test('clock and chapters from a YouTube description', () => {
  assert.equal(clock(0), '0:00');
  assert.equal(clock(1163), '19:23');
  assert.equal(clock(3725), '1:02:05');
  const md = 'Chapters\n0:00 Start here\n1:39 From transport to care\n1:02:05 Late one\nTags: x';
  assert.deepEqual(chaptersFromText(md), [[0, 'Start here'], [99, 'From transport to care'], [3725, 'Late one']]);
  assert.deepEqual(chaptersFromText('no chapters\n1:00 not from zero'), []);
});

/* The player, in a small fake DOM: one block, one click. */
function playerSandbox() {
  const events = [];
  const made = [];
  function el(tag, attrs = {}) {
    const node = {
      tagName: tag.toUpperCase(), attrs: { ...attrs }, children: [], parent: null, classList: null, style: {},
      getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
      setAttribute(k, v) { this.attrs[k] = String(v); },
      removeAttribute(k) { delete this.attrs[k]; },
      appendChild(c) { c.parent = this; this.children.push(c); return c; },
      remove() { if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this); this.parent = null; },
      focus() {}, contentWindow: { postMessage: (m) => events.push(['post', JSON.parse(m).func]) },
      getBoundingClientRect: () => ({ top: 10 }),
      closest(sel) { let n = this; while (n) { if (matches(n, sel)) return n; n = n.parent; } return null; },
      querySelector(sel) { return all(this).find((n) => n !== this && matches(n, sel)) || null; },
      querySelectorAll(sel) { return all(this).filter((n) => n !== this && matches(n, sel)); },
    };
    const cls = new Set((attrs.class || '').split(/\s+/).filter(Boolean));
    node.classList = { add: (c) => cls.add(c), contains: (c) => cls.has(c), toggle() {}, remove: (c) => cls.delete(c), _s: cls };
    return node;
  }
  const all = (n) => [n, ...n.children.flatMap(all)];
  function matches(n, sel) {
    return sel.split(',').some((s) => {
      const parts = s.trim().split(/\s+/);
      const last = parts.pop();
      const ok = (node, simple) => {
        const m = simple.match(/^([a-z]*)((?:\.[\w-]+)*)((?:\[[\w-]+\])*)$/);
        if (!m) return false;
        if (m[1] && node.tagName !== m[1].toUpperCase()) return false;
        for (const c of (m[2].match(/\.[\w-]+/g) || [])) if (!node.classList._s.has(c.slice(1))) return false;
        for (const a of (m[3].match(/\[[\w-]+\]/g) || [])) if (!(a.slice(1, -1) in node.attrs)) return false;
        return true;
      };
      if (!ok(n, last)) return false;
      let p = n.parent;
      for (const anc of parts.reverse()) { while (p && !ok(p, anc)) p = p.parent; if (!p) return false; p = p.parent; }
      return true;
    });
  }
  const block = el('section', { class: 'lpv', 'data-video': SAMPLE.id, 'data-video-course': 'ochem', 'data-video-kind': 'notes' });
  const frame = block.appendChild(el('div', { class: 'lpv-frame' }));
  const play = frame.appendChild(el('a', { class: 'lpv-play', href: 'https://www.youtube.com/watch?v=x', 'data-start': '0' }));
  const title = block.appendChild(el('p', { class: 'lpv-title' })); title.textContent = SAMPLE.title;
  const details = block.appendChild(el('details', { class: 'lpv-chapters' }));
  const ol = details.appendChild(el('ol'));
  const ch = [0, 99, 400].map((t) => ol.appendChild(el('li')).appendChild(el('a', { href: '#', 'data-start': String(t) })));
  const listeners = {};
  const document = {
    addEventListener: (t, f) => { listeners[t] = f; },
    createElement: (tag) => { const n = el(tag); made.push(n); return n; },
  };
  const window = { LevlAnalytics: { event: (name, data) => events.push([name, JSON.parse(JSON.stringify(data))]) } };
  const ctx = { window, document, location: { origin: 'https://levlprep.com' }, encodeURIComponent, JSON, Math, Number };
  window.document = document;
  vm.runInNewContext(readFileSync(join(ROOT, 'assets', 'video', 'video.js'), 'utf8'), ctx);
  const click = (target) => { const e = { target, button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }; listeners.click(e); return e; };
  return { block, frame, play, ch, made, events, click };
}

test('the player: nothing until play, then the nocookie embed, one play event, chapters seek', () => {
  const s = playerSandbox();
  assert.equal(s.made.length, 0, 'nothing created before a tap');
  const e = s.click(s.play);
  assert.ok(e.defaultPrevented);
  const iframe = s.frame.children.find((c) => c.tagName === 'IFRAME');
  assert.ok(iframe, 'player made on play');
  assert.ok(iframe.src.startsWith(`https://www.youtube-nocookie.com/embed/${SAMPLE.id}?autoplay=1`), iframe.src);
  assert.ok(!iframe.src.includes('&start='), 'from the beginning');
  assert.ok(!s.frame.children.includes(s.play), 'thumbnail link replaced');
  assert.deepEqual(s.events.filter((x) => x[0] === 'video-play'), [['video-play', { video: SAMPLE.id, course: 'ochem', kind: 'notes', from: 'button' }]]);
  s.click(s.ch[1]);
  assert.equal(s.frame.children.filter((c) => c.tagName === 'IFRAME').length, 1, 'a chapter seeks, it does not add a player');
  assert.deepEqual(s.events.filter((x) => x[0] === 'post').map((x) => x[1]), ['seekTo', 'playVideo']);
  assert.equal(s.events.filter((x) => x[0] === 'video-play').length, 1, 'one play event per video per page');
  assert.equal(s.ch[1].getAttribute('aria-current'), 'true');
});

test('the player: a chapter tapped first starts the video there', () => {
  const s = playerSandbox();
  s.click(s.ch[2]);
  const iframe = s.frame.children.find((c) => c.tagName === 'IFRAME');
  assert.ok(iframe.src.includes('&start=400'), iframe.src);
  assert.equal(s.events.find((x) => x[0] === 'video-play')[1].from, 'chapter');
});

/* add-video.mjs, unattended: it must stop rather than guess. Each case runs
   on a copy of the data file and restores it. */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
function addVideo(args) {
  const file = join(ROOT, 'docs', 'videos.json');
  const before = readFileSync(file, 'utf8');
  try {
    execFileSync('node', [join(ROOT, 'scripts', 'add-video.mjs'), ...args], { stdio: 'pipe' });
    return { ok: true, after: readFileSync(file, 'utf8') };
  } catch (e) {
    return { ok: false, msg: String(e.stderr), after: readFileSync(file, 'utf8') };
  } finally {
    writeFileSync(file, before);
  }
}
const base = ['--id', 'zzzzzzzzzzz', '--course', 'ochem', '--title', 'T', '--seconds', '600', '--posted', '2026-10-22', '--thumb', '/nonexistent'];

test('add-video refuses to take a page another video shows, without --replace', () => {
  const r = addVideo([...base, '--pages', 'ochem/notes/atomic-structure.html']);
  assert.equal(r.ok, false);
  assert.match(r.msg, /already show another video: 1p-L3_POFL0/);
  assert.equal(r.after, readFileSync(join(ROOT, 'docs', 'videos.json'), 'utf8'), 'nothing written');
});

test('add-video refuses a topic page it cannot place, without --allow-partial', () => {
  const r = addVideo([...base, '--pages', 'ochem/notes/orbitals.html,ochem/somewhere-else.html']);
  assert.equal(r.ok, false);
  assert.match(r.msg, /cannot place ochem\/somewhere-else\.html/);
});
