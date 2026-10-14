# Phone legibility pass (2026-10-13)

Owner: "When looking at the visual aspects on a phone it may be kind of difficult to view them because they
are small. Work on fixing that." Applies to every trainer on the site.

The shared Tool Studio already gives the picture most of a phone screen and adds an Enlarge (full screen,
zoom) button: `docs/tools-calm.md`, section "Phones". This pass fixes each tool's own drawing so it reads
well at 360-390 px without enlarging.

## Rules for each tool, at 360x740 and 390x844 (portrait), 740x360 (landscape), light and dark

- **Readable text in the picture:** on-picture labels at least 12 CSS px rendered at 360 px wide (measure the
  rendered size: font-size × the SVG's scale = rendered width / viewBox width), key numbers at least 14 px.
  Fix by (in order of preference) cropping the viewBox tighter to the content on phones, using a
  phone-specific layout (stack panels vertically instead of side by side, fewer tick labels, shorter labels),
  scaling text up with `.ls-phone` / `--ls-scale` (docs/tools-calm.md), or moving secondary text out of the
  picture into the caption or Details.
- **Big enough to see:** the main object fills the stage width; small multiples (four small graphs to choose
  from) become a 2×2 grid at least ~160 px each, or a swipeable/tabbed list, not four tiny thumbnails in a row.
- **Touch:** draggable handles have a hit area of at least 44 px (invisible larger hit circle is fine);
  nothing important sits under the Enlarge button (bottom right of the stage).
- **Nothing lost:** no overlap, no clipped labels, no horizontal scroll, no console errors; desktop at 1280 px
  unchanged or better; graded behaviour, ids, recording, validators and tests unchanged.
- Check the Enlarge view too (the picture must re-lay out when it grows).

## How to work

- Build a scratch copy (course generators with `--out <dir>`; for AP® Calculus AB
  `APCALC_PUBLISHED=skills-math,unit-1,...,unit-8`), serve it, and screenshot with Playwright before and after.
  Look at every screenshot yourself. Use your own scratch subfolder: the scratchpad root is shared.
- Edit only the files of the tools you are given (the tool's js, css, model file); no shared files (Tool
  Studio, course runtime), no git commands that change anything. Run each tool's validator/tests after.
- Write your results to your own file `docs/tools-phone-pass/<your group>.md` (per tool: what changed,
  before and after screenshot paths, anything left).
