/* What a tool page says before its script runs (docs/site-health.md,
   "Fuller tool pages", 2026-11-11).

   A tool page was a heading, one line and an empty mount: the explanation a
   student reads under "About this tool" (the tool's intro and "how it works",
   authored in <course>/data/tools/<slug>.json) only existed after the tool's
   script fetched it. A reader without JavaScript, Bing and the AI assistants'
   crawlers saw about 20 words on 120 pages.

   toolAbout() writes that same authored text into the mount, closed, as the
   page's first content. The tool's runtime replaces everything in #app when
   it mounts and then shows the same text in its own "About" panel, so a
   student with JavaScript sees no difference and nothing is said twice.
   No new words: only what the tool's data file already says.

     file    the tool's source JSON (<course>/data/tools/<slug>.json)
     title   id -> the topic's title, for the link to its notes page
     math    the course's mathHtml ($...$ to MathML), when its data uses it
     esc     the builder's HTML escaper */
import { existsSync, readFileSync } from 'node:fs';

export function toolAbout({ file, title, math, esc }) {
  if (!existsSync(file)) return '';
  const d = JSON.parse(readFileSync(file, 'utf8'));
  if (!d.intro && !d.howItWorks) return '';
  const html = (s) => (math && s.includes('$') ? math(s) : s);
  const name = d.topic && title ? title(d.topic) : '';
  const how = d.howItWorks
    ? `<h2 class="tool-about-h">${esc(d.howItWorksTitle || 'How it works')}</h2>${html(d.howItWorks)}`
    : '';
  const notes = name
    ? `<p class="tool-about-n">Notes for this topic: <a href="../notes/${d.topic}.html">${esc(name)}</a></p>`
    : '';
  return `<details class="tool-about"><summary>About this tool</summary>${html(d.intro || '')}${how}${notes}</details>`;
}
