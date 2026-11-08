# Score card (end of every session)

Owner approved the improved mockup on 2026-11-07 ("make that live"). One layout for every course and mode, drawn by
`LevlStudy.end(o)` in `assets/course/study.js` with styles in `assets/course/study.css` (`.cx-endp3`).

## Layout
1. Course colour band: kind of session and course, big result (right/total), one handwritten line (Kalam) that says
   what happened (honest at both ends), right/missed/unanswered bar, chips (time and pace only when timed, "vs last
   time", unanswered, mode-specific), and the path line (path % and up next, from `<course>_path_sum_v1`, which
   `assets/course/path.js` saveSum writes).
2. White card over the band's foot: what you missed (`LevlStudy.miss(q, pick, href)`; first 3 shown, "+ N more";
   each opens its explanation), earned badges only (personal best), the main button, Retry N misses, quiet links.
3. Below: topics (`LevlStudy.topics`, misses first, mastery with an arrow for the change since this device last
   showed that topic, one Study button on missed topics only), breakdowns (`LevlStudy.bars`), and the full answer
   list (`o.kept`) when feedback was held to the end.
Under 5 questions: band, misses and buttons only. Motion: count up, bar fill, card rises; off for reduced motion.

## o
`{ course, kind, title, right, total, skipped, unit, hand, chips:[text], sub, timed:{used,limit,pace}, missed:[...],
missedTitle, badges:[text], step, retry, also, stepHtml, extras, next, nextTitle, more, kept, estimate:{label,value,range} }`

## Storage (this device)
`levl_card_v1` last percent and best per course and kind; `levl_mast_seen_v1` mastery last shown per topic;
`levl_card_path_v1` path percent last shown.

## Not built
The estimated AP score needs its own scoring model per course; `estimate` is supported but nothing sets it yet.
