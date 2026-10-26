# "From our videos" on the homepage

Status file for the homepage card shown to visitors who arrive from TikTok or Instagram. Read this, not the
chat history. Branch `claude/site-improvements-1025`.

## Why

On TikTok the top search after a LevlPrep post is the account name itself ("levl.prep"), so viewers go looking
for us right after a video. The profile link (`levlprep.com/?ref=tt-bio`, Instagram `?ref=ig-bio`) used to land
them on the general homepage, where the topic they just watched was several taps away. Only about 1 in 5 real
visitors that week was on a phone, though the videos' audience is almost all phones.

## How it works

- `docs/from-video.json`: one entry per Short (posting date, course, plain topic name, the video's hook, the
  notes page that teaches it). Keep it in date order.
- `scripts/build-from-video.mjs` writes the list into `index.html` between the `from-video` markers;
  `--check` runs in CI and `scripts/ci-local.sh`.
- The inline script in the hero draws the card before first paint, only when the address has a `tt-` or `ig-`
  ref or the browser is TikTok's or Instagram's own. It shows the newest 3 Shorts whose posting time has come
  (from 6pm local time on the posting day), newest first and highlighted. Every other visitor sees the page as
  before.
- A tap sends `from-video-open` {course, at} to Umami.

## Keeping it current

The list is filled through 2026-10-31. Each Sunday's weekly run adds the coming week's Shorts (date, course,
plain topic, hook, the notes page from the Short's tracked link) in its weekly search pull request, so no extra
pull request is needed. Pick the page that actually teaches the Short's point, not just the course home.

## Owner step

Set the TikTok profile link to `levlprep.com/?ref=tt-bio` (and Instagram to `?ref=ig-bio`).

## Progress log

- 2026-10-25: built; 14 Shorts from Oct 17 to 31 listed; tested on a phone in light and dark mode.
