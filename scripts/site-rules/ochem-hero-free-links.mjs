/* The ochem home's hero calls to action never send a free user into a Premium wall.

   Audit finding (site audit 2026-10): the hero's "Perform the SN2 mechanism"
   linked to mechanisms/sn2.html, which is in a Premium chapter, so a free
   visitor's second click on the site was a lock. It now opens the SN2 preset
   in the free Arrow Pusher. This rule reads each lesson or mechanism link in
   .hero-ctas, finds its chapter in curriculum.js, and fails unless that
   chapter is one of ochem's freeChapters in assets/premium.js or the link is
   labeled Premium. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export default function({ ROOT, fail }){
  const prem = readFileSync(join(ROOT, 'assets/premium.js'), 'utf8');
  const m = /ochem:\s*\{[\s\S]*?freeChapters:\s*\[([^\]]*)\]/.exec(prem);
  if(!m){ fail('ochem-hero-free-links: cannot find ochem freeChapters in assets/premium.js'); return; }
  const free = new Set([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));

  // href -> chapter id, from the module blocks of curriculum.js.
  const cur = readFileSync(join(ROOT, 'ochem/assets/curriculum.js'), 'utf8');
  const chapterOf = {};
  let chapter = null;
  for(const line of cur.split('\n')){
    const mod = /\{ id: '([a-z-]+)', title: '[^']*', topics: \[/.exec(line);
    if(mod){ chapter = mod[1]; continue; }
    const t = /href: '([^']+)'/.exec(line);
    if(t && chapter) chapterOf[t[1]] = chapter;
  }

  const html = readFileSync(join(ROOT, 'ochem/index.html'), 'utf8');
  const block = /<div class="hero-ctas">([\s\S]*?)<\/div>/.exec(html);
  if(!block) return;
  for(const a of block[1].matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)){
    const href = a[1].split(/[?#]/)[0];
    const ch = chapterOf[href];
    if(ch && !free.has(ch) && !/Premium/i.test(a[2])){
      fail(`ochem/index.html hero links to ${href} (chapter ${ch}, Premium) without saying so; point free users at a free page or label it Premium`);
    }
  }
}
