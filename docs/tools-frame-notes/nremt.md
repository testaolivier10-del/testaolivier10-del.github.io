# NREMT tools in the standard frame (F2, 2026-11-16)

Spec: `docs/tools-frame-2026-11.md`. Shared API: header of `assets/course/tool-studio.js` and `docs/tools-calm.md`
("The standard frame"). No change to the shared layer: `nremt/assets/nremt-studio.js` now mounts every NREMT tool with
`std: true` and the page head's lede as the bar's one line (`o.std === false` keeps the calm frame). So all eight get:
name and one line in the bar, the modes in the bar (second row on a phone), Ask the tutor, Share (copy link), "?" (the
tool's second tab: reference and settings, named for what it holds) and the menu (Start over, Copy link, About, Report,
Ask the tutor, Course home, All tools). The side panel's head is now `s.task` (kicker, title, the one "what to do" line)
instead of the caption; the caption stays only where it carries the case text (scenario situation, burns' last line).

Nothing a tool did before was removed. Old controls that a dropdown now drives stay in the page, out of sight, and the
dropdown clicks them (as F1's `chipPicker`), so handlers, deep links and recording are unchanged.

## Body map (owner's favorite: framed only, nothing in the tool changed)
| Feature | Where now |
|---|---|
| 3D anatomy, Burns (Rule of Nines) | bar modes, as before |
| Tap a structure, its card | task head "You tapped: name" + first line; the full card under Explanation (as before) |
| Pick a part by name (list) | one dropdown at the stage's top left, grouped by body system ("Find a part"); the list stays in the page, hidden, and the dropdown clicks it; it follows the system filters |
| Reset view | on the model (top right, the viewer's own); the dock's second Reset view is gone (the same control twice); `#resetBtn` still under "?" with the view options |
| Legend, Enlarge, drag, pinch, zoom | unchanged on the stage |
| View options (skin, systems, controls note, scale note), directional terms | "?" (View options & terms), unchanged |
| Quiz me: 10-question round, dots, try again after a miss, Show me, Next, Drill my misses | dock as before; the question is the task head ("Quiz · system", "Find the X.") and the hunt panel's own heading is hidden under it |
| Hint | new: one hint (the structure's own `location` line, "Where to look"), instant; after a miss the nudge already says it, so the ladder steps aside until the next question. Show me is not gated (it counts as shown, never as a miss: the body map's own rule) |
| Round summary (score, misses with Find it, Drill my misses, New round) | finished card: score, misses by name, New round, Drill my misses, "Find the X again" for each miss, "Stop the quiz and explore"; the old summary stays in the page under it |
| `?hunt=`, `?focus=`, `?mode=burns`, `&q=` deep links | unchanged |
| Burns: paint, drag, Adult / Child, brush, palm rule, TBSA on the figures, over-10% flag, breakdown, Rule of Nines in words, credit | unchanged (Why and "?" as before); task head "Tap a region to mark it burned." and the latest burn line as the caption |
| Burns quiz (estimate / paint questions, tally, verdict) | the question is the task head (kind and tally as its kicker); the verdict pill on the stage as before |

## Sound trainer
Modes Explore / Test yourself (bar). The Heart (generated) and Lung and airway (recorded) chip rows are one grouped
dropdown on the stage (bottom left, where the pills already sat clear of Front / Back and Sound). Task head: the sound at
the spot ("Crackles at the right lower back.") and its verdict ("Loudest here."). Test: Name it / Where / When stays a
segmented control in the dock (three distinct tests); the question or the verdict is the task head. Name it's ten
rounds end in a finished card (score, Try again, Every sound described, Back to Explore); the results and "hear them
again" stay on the stage. Unchanged: compare two sounds, volume, every sound's card (`#snd-<id>`), the beat strip.
Fixed: the Name it verdict used an em dash ("Not quite: that was ...").

## Protocol flows
Modes Read / Build it / Drill me. The protocol is one dropdown at the stage's top left in Read ("1 of 11") and in Build
it (it drives the board's own select). Task heads per mode; a drill verdict sets the head's kicker and tone. A built
chart ends in a finished card (bounces listed, Build it again, See the diagram). The first-run hint now points at "Next
part of the chart" (the first move) instead of the Drill mode button in the bar. Unchanged: part-by-part reading, Whole
chart, Why? notes under steps, Show all and print, Review records, `#build-` links. Fixed: the drill's wrong-answer line
used an em dash.

## Station run (skill sheets)
The station list stays the landing (each card shows phases, minutes and the sheet code, which is what you choose by).
Task heads: "Pick a station." / the station's name and "Say it out loud, then tick it." The result ends in a finished
card (phases ticked, time, Run it again, Pick another station, How the stations are scored); the full result and the
patient stay on the stage. Unchanged: the stepper, the clock, critical criteria, the illustrated patient, `#station-`
links, the reading guide under "?". Fixed: two em dashes in the result ("..., over"; "general structure: the real sheet").

## Drug formulary
Modes Give or withhold? / Question drill. Task head: the card's question, then the call ("Give oxygen.") with the
deciding line in the dock as before and the dose under Explanation. The deck's end is a finished card (score, Drill my
misses leads when there are misses, Deal a new deck, the seven drug cards, Question drill), mirroring the deck's own
end. Unchanged: swipe, keys, the drill, `#drug-` links, the cards under "?".

## Reference cards
Four modes (Vitals, GCS, APGAR, Triangle): four distinct cards, kept. The live reading (GCS 15, APGAR 10, the
triangle's impression) is the task head; Score a patient's task and verdict too. Its ladder already matches the
standard (Hint: the method, instant; Show the answer only after a wrong Check), so it was left as it is.

## Mnemonics
The 19 mnemonics are one dropdown on the stage ("4 of 19"); Back / Next stay at the dock's foot; the task head names the
mnemonic and what it is for. Fill the letters, the meter and the call link stay on each card.

## Scenario simulator (Premium)
The list of calls stays the landing (each call's scene line). During a call, one grouped dropdown (by kind) at the
stage's top left switches calls; the task head names the call and its domain, the situation stays the caption. The end
is a finished card (outcome, Next call, Try this call again, All scenarios, the Keep going links); the path with "Go
back to this decision" and the score card stay on the stage. Locked: the head says it is part of Premium. Checked
locked and unlocked (premium.js with LAUNCHED false, test only).

## New copy for the accuracy check
- Body map hint: "Where to look:" + the structure's existing `location` text (no new science).
- Task lines are instructions only. Burns: "Tap a region to mark it burned." Station run: "Say it out loud, then tick
  it." No new medical claims.

## Questions for the owner (nothing removed)
1. Content still has em dashes in many places (scenario text 191, flowchart steps 54, skill sheet names 46, mnemonics
   78, sound descriptions, body-content.js). This pass fixed only the lines it touched. A content-wide punctuation pass?
2. Station run and Scenarios keep their card lists as the landing instead of a dropdown (the cards carry the details
   you pick by). Keep?
3. The calm frame's caption is now empty in most NREMT tools (the task head says it). Fine to drop the empty caption
   row from the shared CSS later (F6)?
