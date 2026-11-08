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

## Free response, justify and NREMT scenarios
These pages do not ship study.js and study.css; `assets/course/card-loader.js` (`LevlCard`) loads both the first time
a result is drawn. `LevlCard.frq` and `LevlCard.justify` build the card from the ticked rubric, so each course's
`frq.js` and `justify.js` only call them.
- Free response (`<course>/assets/pages/frq.js`): one question per page, so the card appears under the rubric when
  the student presses Save my score. Points of points; each part with an unticked point is a miss (the part's prompt,
  the points it still needs, its full-credit sample); a chip names the part that lost the most when one part lost
  more than any other. Next question goes to the next question not yet scored.
- Justify (`<course>/assets/pages/justify.js`): the card appears under the checklist on Save my check; sound reasons
  of the checklist; each point not made is a miss with the model answer that earns it. Rewrite and Next move into
  the card (the old row hides until the next check).
- NREMT scenarios (`nremt/scenario-sim.html`): at the end of a call; calls right of the scored forks (the same forks
  that go to Review), the outcome as the handwritten line, a chip for critical misses (a miss at a time-critical
  fork, `NremtSim.HESITATE`), each wrong call with the right one and what it cost. Next call, Try again and All
  scenarios are the card's buttons; the dock keeps the Review note and the next step, the stage keeps the outcome
  text and the path with Go back to this decision.

## o
`{ course, kind, title, right, total, skipped, unit, hand, chips:[text], sub, timed:{used,limit,pace}, missed:[...],
missedTitle, badges:[text], step, retry, also, stepHtml, extras, next, nextTitle, more, kept, estimate:{label,value,range} }`

## Storage (this device)
`levl_card_v1` last percent and best per course and kind; `levl_mast_seen_v1` mastery last shown per topic;
`levl_card_path_v1` path percent last shown.

## Not built
The estimated AP score needs its own scoring model per course; `estimate` is supported but nothing sets it yet.
