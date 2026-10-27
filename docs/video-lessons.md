# Video lessons on the site

Status file for LevlPrep's long YouTube videos on lesson and notes pages. Read this, not the chat history.
Branch `claude/video-lessons` (2026-10-20).

## What is on the site

| Video (posted) | YouTube id | Pages |
|---|---|---|
| Atomic Structure for Organic Chemistry (2026-10-07) | `1p-L3_POFL0` | `ochem/notes/atomic-structure.html`, `ochem/lessons/atomic-structure.html` |
| Intro to EMS: How the EMS System Works (2026-10-12) | `lqxfWZZtRgE` | `nremt/notes/introduction-to-ems.html` (covers 1.1 to 1.3) |
| Intro to A&P: Levels of Organization, Organ Systems (2026-10-15) | `aMvkCfwrepA` | `anatomy-physiology/notes/body-organization.html`, `anatomy-physiology/lessons/body-organization.html` |
| Properties of Water: Hydrogen Bonding (AP® Bio 1.1) (2026-10-19) | `sD7QbtHbVsw` | `bio/notes/water-hydrogen-bonding.html`, `bio/lessons/water-hydrogen-bonding.html` |

Source of the mapping: the media branch's `long/queue.json` (`youtube_id`, `topic_pages`); each id was checked
public on the Levl Prep channel with YouTube's oEmbed. Chapters come from each video's `long/<short>-youtube.md`,
lengths from the rendered mp4. The next one queued is `yt-orgo-02-orbitals` (Orbitals, 2026-10-22).

## How it works

| Piece | Where |
|---|---|
| The data: one entry per public video (id, course, title, seconds, posted, pages, chapters) | `docs/videos.json` |
| Block markup, its place on each kind of page, validation | `scripts/lib/videos.mjs` (`applyVideo`, `SPOTS`, `validate`) |
| Writes or removes the block on every lesson and notes page, and the reader cards; `--check` in CI | `scripts/build-videos.mjs` |
| Reader cards: inline JSON `#lpv-reader` (markers `<!-- video:reader -->`) on each `learn.html` and `nremt/study-notes.html`, placed when the reader draws the chapter | `scripts/lib/videos.mjs` (`readerCards`), `assets/video/reader-video.js` |
| Course home "Watch the lessons" strip: newest 3, thumbnail links to the notes page, channel link | `scripts/lib/r3-home.mjs`, styles at the end of `assets/course/r3.css` |
| Adds one video (from the media queue or flags), makes thumbnails, rebuilds | `scripts/add-video.mjs` |
| Thumbnails, 480 and 960 px WebP, served from this site | `assets/video/thumbs/<id>-<w>.webp` |
| Look (course colour from `--cink`/`--ctint`, both themes, 16:9 reserved, print hidden) | `assets/video/video.css` |
| Player: on tap only, `www.youtube-nocookie.com/embed/<id>`; chapters seek | `assets/video/video.js` |
| Rule: no YouTube iframe, src, srcset or stylesheet in any page's markup | `scripts/site-rules/video-facade.mjs` |
| Tests | `scripts/test/video-lessons.test.mjs` |

The course builders (`build-anp` and the six `build-ap*`), `build-notes-pages.mjs` (ochem notes) and
`build-nremt-notes-pages.mjs` call `applyVideo` when they write a page, so a rebuild keeps the block and every
`--check` agrees. Ochem lessons are hand-written; `build-videos.mjs` writes those.

Where the block sits: notes pages after the page header, before the prose (the course textbooks, which read only
the prose, never show it, so the video is not repeated inside the book); NREMT chapter pages after the chapter
header; lesson pages as a compact card at the end of the lesson's header (ochem: inside the hero).

The readers (every course's `learn.html` and the NREMT reader `study-notes.html`) draw their chapters with
JavaScript, so the card cannot sit in their markup. `applyVideo` writes, just before `</body>`, the page's own
cards as inline JSON, each with the selector of its chapter or topic header: NREMT `[data-chapter="N"] >
.tb-chapter-head` (N from the notes page's chapter), the others `section[id="<notes slug>"] > .bk-sec-head` (or
`.tb-section-head` in ochem). `reader-video.js` puts each card right under its header whenever the reader draws it
and loads `video.css`/`video.js` only then. Same facade, `data-video-kind="reader"` in analytics. Olivier,
2026-10-26: the reader at `#ch1-history` showed no video.

Course homes show "Watch the lessons" after the lead section when the course has a video: up to 3, newest first,
each the same-origin thumbnail linking to its notes page (never an iframe), plus a link to the channel. Built by
`r3HomeMain`, so `build-course-homes.mjs` (nremt, ochem), `build-anp.mjs` and the `build-ap*` builders write it.

## Decisions

1. **Facade, not an iframe.** The three earlier embeds were bare iframes: every page view loaded YouTube's player
   and thumbnails. Now nothing leaves the site until play. Without JavaScript the play button and chapters are
   links to youtube.com.
2. **CSP unchanged.** `frame-src` already allowed `https://www.youtube-nocookie.com` (PR #48, all pages). Thumbnails
   are same-origin, so `img-src` needs nothing. No YouTube script runs in the page; the player runs in its iframe.
3. **Pages without a video show nothing.** No "coming soon".
4. **No course "Videos" page for now.** The course home strip shows the newest 3 and links the channel; each course has at most two videos, so a listing page per course would be a
   nearly empty page in every course's tab row. Revisit when a course has about five: one generated
   `<course>/videos.html` per course from `docs/videos.json`, linked from the course home, the same in every course.
5. **One video per page.** A newer video for the same page takes it over (`add-video.mjs`).
6. **Titles** are YouTube's, with two display changes: a trailing "| NREMT" (or "| EMT", "| LevlPrep") search suffix is dropped, and "AP"
   gains its ® on AP® course pages (the trademark rules).

## Analytics

`video-play` {video, course, kind (notes or lesson), from (button or chapter)}, once per video per page view,
through `LevlAnalytics.event` (so it carries `src`). Weekly report: Umami, Events, `video-play`, by `video` and
`course`. Plays per video against that page's views is the number to watch.

## When a video goes public (the daily long-video run)

This replaces the old step that pasted an `<iframe>` into each topic page.

1. Clone main, follow `CLAUDE.md`, branch `video-<item id>`.
2. With the media branch checked out (sparse: `long/queue.json`, the item's `thumb`, `captions` and `description_file`; the mp4 is optional):
   `node scripts/add-video.mjs --queue <media>/long/queue.json --item <item id>`
   It runs `build-videos.mjs` (pages and reader cards) and the course's home builder (the strip).
3. `node scripts/build-videos.mjs --check`, the course builder's `--check` and
   `node --test scripts/test/video-lessons.test.mjs` must pass (the full `scripts/ci-local.sh` is not needed: the
   change touches only the data file, two thumbnails, the listed pages, the reader and the course home).
4. Commit "Add video: <title>", push, open the PR via REST, save `pr_url` in the queue item. The owner merges.

Without the mp4 the length comes from the captions file (`long/<short>-captions.srt`, last cue plus 5 s; `--seconds` overrides). It stops, writing nothing, when a topic page cannot be placed (`--allow-partial` places the rest) or a page already shows another video (`--replace` hands it over), and keeps the listed chapters when the description has none. Without a thumb file the script fetches YouTube's own
thumbnail once, at build time.

## Progress log

- 2026-10-20: built. The four posted videos wired (7 pages), the old iframes removed, privacy page updated,
  CI step added. Independent review: no must-fix; fixed its should-fix items (add-video refuses to steal a page or
  place part of a video silently, keeps chapters, length from captions; block title no longer a heading, so ochem
  notes keep their outline; postMessage targets the player origin). The ops doc `claude/levlprep-ops-daily.md`
  (claude.ai Project) still describes the old iframe step: replace its step 5d with the section above (this
  session had no Projects tool).
