# R10 system: shared markup every R10 board uses (from R9-V09b)

Source of truth for the code: `design/gen_r10_home.py` (imports `gen_r8.py`, whose CSS is the live homepage CSS
plus tokens). Reuse it: `import gen_r10_home as s` then `s.page(title, body, w, h)`, `s.top(k, tab)`,
`s.band(k, short=True, ...)`, `s.foot(k)`, `s.ph_top(k)`, `s.bbar(tab)`. Per course data: `r7_data.C[k]`, colors
`gen_r1.COL[k] = (band bg, band accent, title 1, title 2, hand)`, `r7_data.INK[k]` (course ink on light) and
`TINT[k]`. Course keys: nremt ochem anp apbio apchem apphys apcalc apstat apenv.

## Root
`<div class="hp home" style="--accent:INK;--ctint:TINT;--bbg:COL[0];--bac:COL[1]">` ... `</div>`
Phone boards add `ph`: `<div class="hp home ph" ...>`.

## Top bar and course tabs (desktop), inside `<div class="hwrap">`
```
<a class="skip" href="#main">Skip to content</a>
<header class="hdr"><div class="brand"><a class="logo" href="#"><span class="mk">+svg</span><span>LevlPrep</span></a>
<a class="crs" href="#">NREMT-EMT Prep</a></div>
<div class="right"><a class="srch" href="#">Search NREMT <kbd>/</kbd></a><button class="login">Log in</button>
<button class="ib" aria-label="Turn answer sounds on">..</button><button class="ib" aria-label="Dark mode">..</button></div></header>
<nav class="ctabs" aria-label="Course sections"><a>Home</a><a>Learn</a><a aria-current="page">Practice</a><a>Review</a>
<a>Exams</a><a>Glossary</a><a>Tools</a><a>Dashboard</a></nav>
```
Plus the study assistant: `<div class="assist" style="top:560px"><span>Ask me anything</span><button ...>bot</button></div>`
as the root's first child. `s.top(k, 'Practice')` builds all of it with the right tab marked.
Phone: `s.ph_top(k)` (`header.hdr` with search, assistant, menu) and `s.bbar('Practice')` (`nav.bbar`: Home, Learn,
Practice, Review, More) at the end of the root, plus `.sticky-cta` when the page has one main action.

## Cover band
Tall (course home only):
```
<section class="band" id="main"><div class="hwrap"><div>
<p class="issue">KICKER <i></i> RIGHT NOTE</p>
<h1 class="mast">T1<span>T2</span></h1>
<p class="deck">Two tone <span>headline.</span></p>
<p class="hand">hand line</p><p class="lede">..</p>
<div class="hero-ctas"><a class="btn-chan">Main</a><a class="btn-ghost">Second</a></div>
</div><div class="art" aria-hidden="true">COVER SVG</div></div></section>
```
Short (EVERY inner page, same height everywhere): `<section class="band short" id="main">` with the same inner
markup but no `.mast`: kicker line, `<h1 class="deck">Page name <span>in course color.</span></h1>`, hand line, one
`.hero-ctas` (one main button, optional ghost), cover art on the right at a smaller size. `s.band(k, short=True,
kicker=, note=, h1a=, h1b=, hand=, lede=, cta=, cta2=)` builds it. CSS: `.band.short .hwrap{padding-top:28px;
padding-bottom:64px}`, `.band.short .art{max-width:300px;justify-self:end}`, `.band.short .deck{font-size:44px}`.
After a band, the first content block may overlap it with `.lead` (margin-top -40px on short bands, -110px on tall).

## Page parts (all from the homepage CSS)
- Section label: `<p class="kicker">Label <i></i></p>` (uppercase, course color, rule to the right).
- Section heading: `<div class="ruled-h"><h2>Plain <span>colored.</span></h2><p>One line.</p></div>`.
- White panel: `.contents` (radius 22, line border, soft shadow) with a `.toc` list (`li a` = number, b + small, right value + `.wbar`).
- Cards: `<a class="ccard" href="#"><span class="cmeta"><span class="cname">Name</span><span class="tag free|prem|beta">..</span></span><span class="cdesc">..</span></a>`.
- Lists of links: `.dept` (3 columns, top rules) with `a > .cmeta .cname` and `.cdesc`.
- Steps: `.step` with `.n`, `h3`, `p`.
- Free and Premium: `section.home-deal` (`.plan`, `.plan--premium`, `.plan__amt`, `.plan__sure` "Never renews. Full refund within 7 days.").
- FAQ: `section.home-faq` > `.hub-faq` > `h3` + `.ans`.
- Buttons: `.btn-chan` (navy; yellow on bands), `.btn-ghost`, `.btn-gold` (Premium).

## Footer
Plain footer on every page: `<div class="hwrap"><footer class="home-foot">` progress note, course disclaimers,
links (Privacy, Terms, About, Sources, What's new, Premium, Account, Contact)`</footer></div>`; `s.foot(k)`.
The `section.about-row` ("Who makes this", "How the questions are written", "What changes") is ONLY on the course
home (and the site home and About). No "Other states" panel anywhere.
