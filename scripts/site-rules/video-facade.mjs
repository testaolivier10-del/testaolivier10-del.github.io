/* Video lessons load nothing from YouTube until play (docs/video-lessons.md).

   Before this, three notes pages carried a bare youtube-nocookie <iframe>:
   a visit to the page, played or not, fetched YouTube's player, scripts and
   thumbnails. The block from scripts/lib/videos.mjs is a facade: a thumbnail
   from this site and links to youtube.com, with the player made by
   assets/video/video.js only on a tap. So no page's markup may hold an iframe, or
   any src/srcset/poster/stylesheet, on a YouTube or Google video host, and
   the only file allowed to name the embed host is assets/video/video.js. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const HOSTS = /(youtube(-nocookie)?\.com|youtu\.be|ytimg\.com|googlevideo\.com|ggpht\.com)/i;

export default function videoFacade({ ROOT, fail, htmlFiles }) {
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const rel = file.slice(ROOT.length + 1);
    if (/<iframe\b[^>]*\bsrc="https?:\/\/[^"]*(youtube|youtu\.be)/i.test(html)) {
      fail(`${rel}: a YouTube <iframe> in the page loads YouTube on every visit; list the video in docs/videos.json instead (scripts/build-videos.mjs)`);
    }
    for (const m of html.matchAll(/\s(src|srcset|poster|data-src)="([^"]*)"/gi)) {
      if (HOSTS.test(m[2])) fail(`${rel}: ${m[1]}="${m[2].slice(0, 60)}" loads from YouTube before play; serve it from ${'assets/video/thumbs/'}`);
    }
    for (const m of html.matchAll(/<link\b[^>]*href="([^"]*)"/gi)) {
      if (HOSTS.test(m[1]) && !/rel="?(canonical|alternate)/i.test(m[0])) fail(`${rel}: <link href="${m[1]}"> fetches from YouTube on page load`);
    }
  }
  const js = readFileSync(join(ROOT, 'assets', 'video', 'video.js'), 'utf8');
  if (!/var EMBED = 'https:\/\/www\.youtube-nocookie\.com\/embed\/'/.test(js)) {
    fail('assets/video/video.js: the player must come from https://www.youtube-nocookie.com/embed/ (privacy-enhanced mode)');
  }
}
