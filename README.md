# LevlPrep media store (branch `media`, not part of the website)

- `queue.json`: posting queue, in order. Status: pending -> approved -> scheduled -> posted (or dropped).
- `videos/<id>.mp4`: the video posted to TikTok (via Buffer, 6:00pm PT) and YouTube Shorts (6:02pm PT).
- `thumbs/<id>.png`: YouTube thumbnail, set right after the YouTube upload.
- `thumb.py`: thumbnail generator (badge, hook, output path).

Approving: Olivier approves in any Claude chat. Claude then sets those items to `approved` here and pushes. Nothing in Google Drive.
