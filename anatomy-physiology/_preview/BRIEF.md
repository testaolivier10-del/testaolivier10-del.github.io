# Brief: A&P design-preview mockups

The owner wants the Anatomy & Physiology (A&P) course pages to look more like the other two
courses on the site (Organic Chemistry at /ochem/ and NREMT at /nremt/). They will pick one of
three versions per page type. Your job: build THREE static HTML mockups for ONE page type.

## Rules
- Write ONLY into `anatomy-physiology/_preview/` (repo root: /home/user/testaolivier10-del.github.io).
  Do NOT edit any other file in the repo. Do NOT commit. Do not read question-bank or lesson JSON
  files in full (search them if needed).
- The files sit one level below `anatomy-physiology/`, the same depth as `anatomy-physiology/lessons/`.
  Start each mockup from the real page's `<head>` and chrome so it looks genuine:
  - `<link rel="stylesheet" href="../../assets/theme.css">`
  - `<link rel="stylesheet" href="../assets/anp.css">`
  - `<link rel="stylesheet" href="../../assets/fonts/fonts.css">`
  - `<script src="../../assets/site-chrome.js" defer></script>` plus `<div id="site-header"></div><div class="course-nav"></div>`
    at the top of `<body>` (this draws the real LevlPrep header and course tabs). Also include
    `<script>window.ANP_SECTION='...'; window.ANP_BASE='../';</script>` and `../assets/anp-curriculum.js`,
    `../assets/anp-core.js`, `../assets/anp-nav.js` (defer) if the header needs them — check how the real page does it.
  - Put all NEW styling for the variant in one inline `<style>` block in that file. You may borrow
    values/patterns from `ochem/assets/ochem.css` and `assets/theme.css` (read the relevant rules, don't
    copy the whole file). Don't link ochem.css itself.
- Keep A&P's own accent (the coral/terracotta used in anp.css / the current A&P hero, contrast with
  ochem's lavender and NREMT's mint). The goal is the same LAYOUT and component language as ochem/NREMT,
  not a recolor to purple.
- Use REAL A&P content (chapter names, topic names, lesson text) copied from the existing generated pages
  so the mockups are believable. Mockups are static: no need for working interactivity beyond simple
  inline JS for tabs/steps if it helps show the idea. Links can be `#`.
- Must look good at 1280px wide and not break at 390px (phone). Support dark mode the way theme.css does
  (use theme.css CSS variables like the other pages instead of hard-coded light colors where possible).
- Each of the 3 versions must be clearly, visibly different from the others, not tweaks.
- Put a small fixed label in the corner of each mockup, e.g. "Home — Version 1: Ochem twin", so the owner
  can tell screenshots apart.

## How to check your work
A static server is already running: `http://localhost:8765/anatomy-physiology/_preview/<file>.html`
(if it isn't, run `cd /home/user/testaolivier10-del.github.io && python3 -m http.server 8765` in the background).
Screenshot with Playwright (Chromium is preinstalled), e.g.:

```js
// node shot.mjs  (put helper scripts in your scratchpad, not the repo)
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const b = await chromium.launch(); const p = await b.newPage({ viewport:{ width:1280, height:900 } });
await p.goto('http://localhost:8765/anatomy-physiology/_preview/home-v1.html', { waitUntil:'networkidle' }).catch(()=>{});
await p.screenshot({ path:'out.png', fullPage:true }); await b.close();
```
Network errors for umami/jsdelivr are expected; ignore them. Look at your screenshots (desktop and a 390px
width) and fix anything broken or ugly before finishing. Compare against the equivalent ochem and NREMT pages.

## Report back
Reply with: the three file names, one sentence per version describing what's distinctive, and anything
you'd flag. Keep it short.
