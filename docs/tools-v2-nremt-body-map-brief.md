# Tools v2: NREMT Body map (brief and build notes)

Status file for the v2 rebuild of `nremt/body-map.html` (free; rank 12 in `docs/tools-v2-rollout.md`, group X,
"explorers"). Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`. Branch
`claude/tools-v2-nremt-body-map`, built on `claude/tools-v2-all`. NOT merged: an independent review comes first.
Decisions made for the owner are also in `docs/tools-v2-owner-log.md`.

**The owner's favourite tool.** Round F2 only framed it. This round keeps everything that makes it good, unchanged:
the 3D body (`assets/body3d/viewer.js`, BodyParts3D), its 70 parts (56 structures and 14 landmark dots) and every
word of their cards (`nremt/assets/body-content.js`), Burns with the rendered front and back figures
(`nremt/assets/burns.js`, `body-figures.js`), the find quiz round, the Rule of Nines quiz, every record id and
deep link. What changes is the frame around them, the clarity and the teaching (listed below, each with why).

## The one main idea per screen
- **The body** (tab 1): every part of the body has a place and a job. Main control: tap the body itself.
- **Burns** (tab 2): each region of skin is a share of the body; the burned shares add up to the total. Main
  control: tap or drag over the figures.
Two ideas, so two tabs (rule 11: a control gets its own tab only when it teaches a different idea). They were
already two modes (3D anatomy | Burns); they are now the Explore tabs, and the two quizzes are Test yourself.

## Research (rule 10)
| Source | Seen how | What it does | What we took |
|---|---|---|---|
| Complete Anatomy (3D4Medical): "Infobox Overview" and "Labels" help pages | fetched as text | Tap a structure: it is selected and an infobox opens with its name, then tabs of information; view options Hide, Fade, Fade others, Isolate; a label is pinned to the structure, tapping it returns to the view | A card per part with its name on top and short tabs inside (What it does, Goes wrong, EMT care), attached to the part on the picture. Fade others is already the viewer's behaviour on select (organs and vessels fade, bones stay) |
| Visible Body Atlas, Cengage help "Getting started (iPad)" | fetched as text | Tap a structure to select it; a content box shows the name and icons for definition and pathologies; Hide and Isolate | The card leads with what it does, then what goes wrong (Visible Body's "related pathologies") |
| BioDigital Human, "The new and improved Human Viewer" help article | fetched as text | Labels that expand to more content; the information panel sits in a column on a wide screen and at the bottom of the viewer under 960 px | Exactly our layout rule: the card sits beside the part on a wide picture and docks along the bottom of the picture on a narrow one |
| Mersey Burns (the developer's write up) and NICE MIB58 | fetched as text / search result | Colour in an outline of a person; the app works out the share of each region and the total | Kept: paint the regions, the total adds up. Ours also says why each region carries its share |
| The old LevlPrep page (origin/main and today's branch, opened at 1440 and 390) | opened in Chromium | Two modes, a side panel with "You tapped" and an Explanation sheet holding the card; Burns' explanation in the side panel; Quiz me in the dock | Everything kept; see "Changes against today's page" |
I did not open Complete Anatomy, Visible Body or BioDigital themselves (paid apps or sign in); only their help pages
as text. What ours does that none of them do: the card is EMT content (what goes wrong, what you find, what you do),
and Burns explains each region's share in the cause line as you paint.

## What is on screen in Explore (counted)
**The body, opening (1440 and 390):** 2 tabs; 1 purpose line (9 words) and "Show me how"; 1 picture (the 3D body,
the largest thing at every width) with Find a part (top left), Reset view (top right, the viewer's own) and the
legend (6 colour keys, unchanged); 1 cause line (2 pills); the first visit cue "Tap a part of the body". Nothing
else. **After a tap:** the card on the picture (system line, name, 3 small tabs, 2 short paragraphs of at most about
45 words), a leader from the card to a dot on the part, and the cause line "Tapped: [name] → [system]". On a narrow
picture the legend steps aside while a card is docked over it.

**Burns, opening:** 2 tabs; 1 purpose line (13 words) and "Show me how"; 1 picture: the front and back figures
(15 regions with their numbers, unchanged), Adult | Child on the picture (top left), the total ("Burned 0%") on the
picture (between the figures on a wide one); 1 cause line (3 pills); under it the brush (Full | Half | Erase) and
"Start over"; the cue "Tap a region". **After a tap:** the region burns in (0.28 s), the total counts with it, then
the cause line: [region] → [why its share: "half the arm: 4.5%"] → [Total 13.5%]. Over 10% a small
"Over 10%" mark appears under the total (what it means is in "?").

## Explore against Test yourself
- **Explore**: free play: tap any part, turn and zoom the body, find a part by name; paint burns, switch the chart.
  Nothing graded.
- **Test yourself, "Find it on the body"**: the old Quiz me round, unchanged: ten parts, one at a time, the
  question in the side panel, Hint (where to look), Show me, Try again after a miss, Next, the finished card (score,
  misses, Drill my misses, New round, Find the X again). The body moves to this stage with Find a part, so a
  keyboard can still answer by name (as it could before). Leaving for Explore keeps the round: coming back asks the
  same question again (or the next one if it was answered).
- **Test yourself, "Rule of Nines quiz"**: burns.js's own estimate and paint questions on their own figures (a
  separate mount, so painting in Explore never touches a question), with the verdict, the breakdown and Next.
- Record ids unchanged: `body-map` with the structure's key (find), `burns-<question id>` (burns).
- Deep links unchanged: `?focus=<name>` (Explore, that part's card), `?hunt=<name>` (the find quiz starting on it),
  `?mode=burns` (Explore, Burns tab), `?mode=burns&q=<id>` (the Rule of Nines quiz on that question). New: `#test`
  (find quiz), `#test-burns`.

## Changes against today's page (every one, with why)
1. **No side panel in Explore** (rule 6, the standard frame): the "You tapped" head and the Explanation sheet
   become **a card on the picture** beside the part, with a leader to it (the X group's `K.spots` idea; Complete
   Anatomy and BioDigital do the same). Why: the answer appears where the student looked, not in another column.
2. **The card has three short tabs** (What it does: where and job; Goes wrong: what goes wrong and what you find;
   EMT care: what you do). Every field of every card is still there, word for word; one section shows at a time so
   no card is a wall of text (rule 6). The em dashes in 22 fields of the content show as a colon in the card (owner
   rule, no em dashes; the content file is unchanged).
3. **The card waits for the camera** (rule 14): while the camera flies to the part the cause line says "Finding it";
   the card, the leader and the result words come once the picture shows the part.
4. **A name under the mouse** before you tap (mouse only): instant feedback on what a tap will pick (rule 4).
5. **Tap empty space to let go** of a part (as Complete Anatomy does); the card's × does the same.
6. **Find a part** moved from the studio's stage dropdown to a search style dropdown on the picture, grouped by body
   system, left and right named; it follows the system filters, as before.
7. **Two tabs instead of two modes** ("3D anatomy | Burns" become Explore tabs "The body | Burns"); the two quizzes
   become Test yourself parts (rule 7: Explore never quizzes).
8. **Burns' explanation moved into the cause line**: each tap says the region, why it carries its share ("one nine
   of the front's 18%", "half of the leg's 13.5%" on the child chart) and then the total. The chart switch says what
   changed ("Child chart → head 18% + each leg 13.5% → Total"). Why: the reason sits next to the picture, in a few
   words, as the burn appears (rule 4).
9. **Burns animate** (rule 13): a region burns in or fades out over 0.28 s, the total on the picture counts with
   what is drawn on every frame (rule 14), the figure cross fades on the chart switch. Reduced motion: the result at
   once with a short cross fade.
10. **The total is on the picture**, big ("Burned 13.5%"), between the figures on a wide picture, with the sum of
    the burned shares under it ("9 + 4.5 + 4.5 = 18", from what is drawn, so it agrees mid fade; five terms at most,
    then "(n more)"; review round 1 restored it: the old side panel list was the addition the tab teaches). Over 10%
    a small mark shows there (its line is kept from the start, so nothing moves), and the moment the total first
    passes 10% the cause line says "over 10% → burn center if partial thickness" (review round 1). Totals show at
    most one decimal (an estimate).
11. **Adult | Child is on the picture**; the brush (Full | Half | Erase) and Start over sit under it (they were in
    the dock and behind "More options"; a connected control is never hidden behind a step, rule 11).
12. **Region boundaries are a solid hairline** (they were dashed: the builder brief's "no dashed shapes that could
    read as torn parts"); the quiz's "these regions" mark is solid too.
13. **The picture as big as the screen allows** (corrected in review round 1: the first build made the body and
    the figures about 25% smaller than today's page on a 1440 x 900 laptop). On a screen 1024 px and wider the tabs
    take their regular height and share one row with the purpose line, the picture runs to the stage's foot, and the
    cause line rides the picture's foot. Measured against `origin/main`: the 3D canvas is 742 px tall against 796
    at 1440 x 900 (93%) and 562 against 616 at 1280 x 720 (91%); the burn figures 644 against 684 (94%) and 464
    against 502 (92%). Corrected in recheck 1: on a short phone and a short tablet the picture is a little SMALLER
    than today's page, on purpose, so that the picture, the card and both cause line rows fit one screen (today's page
    scrolls there): at 375 x 667 the burn figures are 290 px against 329 (88%) and the 3D canvas 371 against 414
    (90%); at 1024 x 768 the figures are 512 against 550 (93%). The region numbers read about 16 px on a desktop.
14. **The first visit cue** is the kit's (one per tab, never on a number or label) and "Show me how" is a three step
    tour per tab.
15. **"?"** holds what you are looking at, the view options (Reset view, Show skin, the six body systems, how to
    turn and zoom, the "not to scale" note, the list of parts by name), the Rule of Nines in words, the brush, over
    10%, the palm rule, the directional terms and the credits: moved, never copied.
16. **The NREMT adapter** (`nremt/assets/nremt-kit2.js`) is used as is; nothing was added to it.

## Decisions made for the owner (also in the owner log)
1. Explore is two tabs, The body and Burns; the find quiz and the Rule of Nines quiz are Test yourself.
2. The card opens on the picture, beside the part (docked along the bottom under 700 px), with three tabs.
3. Burns' painted regions list became one sum line under the total (review round 1).
4. Burns explanation is the cause line ("half of the arm's 9%"); the long side panel sentences are gone, the Rule
   of Nines in words is in "?".
5. Region boundaries solid, not dashed.
6. Find a part travels with the body into the find quiz (a keyboard can still answer by name, as before).
7. Leaving the find quiz mid round keeps the round (the hunt stops while Explore shows, since any tap there would
   answer it).
8. Region taps stay in this tool, not in a shared `K.spots` (another builder is making it for the A&P lab
   practical). Could K.spots replace it later? The card and leader could, if K.spots takes a "project a point"
   function (here `viewer.project(key)`) and a "wait until" hook (here `viewer.flying()`); the 3D picking itself
   stays in viewer.js. Burns' regions are svg buttons and would fit K.spots' named regions directly.
9. Three small additive hooks in the shared viewer (`project`, `flying`, the `frame` and `hover` events); the A&P
   3D anatomy tool does not use them and is unchanged.

## Medical accuracy (checked against the NREMT spec's sources)
Nothing in the body's content changed. New words: the Burns cause line and "?". Checked against the course notes
(study notes chapter on burns: Rule of Nines adult 9% regions, genitals 1%; child head and neck 18%, each leg 13.5%;
partial thickness over 10% is a burn center criterion) and burns.js's own tables (which `scripts/test/nremt-burns.test.mjs`
checks add up to 100 on both charts). "Each arm is 9%, half on the front and half on the back" and "one nine of the
front's 18%" restate those tables. The dots line in "?" was checked against the viewer's colours (pulse points red).
Open point added to `docs/nremt-needs-author.md`: the child chart is the infant one (head 18%, legs 13.5%); a
reviewer may want "?" to say it fits an infant or small child and that a Lund and Browder chart is used for
older children (burns.js already said so in its old side panel sentence, now in "?").

## Build notes
- `nremt/assets/body-map-v2.js` and `.css`: Explore (tabs, purpose line, the body with its card, leader, hover name
  and Find a part, Burns with the switch, total, brush and Start over, the cause line, the cues, "Show me how", "?").
- `nremt/body-map.html`: loads the kit, the adapter and the module; mounts the viewer; the find quiz round and the
  Rule of Nines quiz as Test yourself parts through `NremtStudio.kit2`. Without the studio the page is the plain one.
- `assets/body3d/viewer.js`: `project(name)`, `flying()`, `on('frame')`, `on('hover')` (additive).
- `nremt/assets/burns.js`: `anim`, `onChange`, `onSettle`, `onPaint` and the returned controls (additive; the quiz
  mount is unchanged).
- `scripts/tools-v2/nremt-body-map-sweep.mjs`: the kept sweep (one process per width; the 3D body is slow headless).

## Checks run (2026-11-18)
- `node --test scripts/test/nremt-*.test.mjs` 71 pass (burns tables add to 100 on both charts); A&P tool kit, tool
  use and cross course tests 27 pass; `check-site` OK; `check-weight --check` within budget after
  `assets/body3d` 16 -> 16.4 KB (viewer hooks, measured 16.3; the NREMT shell is unchanged at 28.6 of 28.8).
- `check-tool-use.mjs` with a local copy listing this page: it reports frame v2 (tool-open, tool-touch(explore),
  tool-use; nothing sent under automation). Its one complaint is the time band ("1-5m"): headless Chromium takes
  minutes to draw the 3D body, which is why the shared check lists Flowcharts and not the body map.
- Sweep (`node scripts/tools-v2/nremt-body-map-sweep.mjs`, one process per width; about 8 minutes a width, the 3D
  body is slow headless): the body's opening and four parts with their cards (an organ, a bone, a landmark dot, the
  longest name; two of them on all three card tabs), Burns' opening, one, two and three regions, the child chart and
  Start over, at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920, plus 390 and 1440 dark; then frame by frame
  at 390 and 1440 (a burn, two more, a reversal, the chart switch, Start over: the total on the picture equals the
  sum of the drawn shares on every frame, no total pill mid fade; leaving for Test yourself mid fade finishes it;
  the card never shows while the camera travels; Test yourself: find quiz wrong then Try again then right, recorded;
  the Rule of Nines quiz right then a second answer); reduced motion gives the result at once.
  Round 1: 14196 passed, 8 failed (the card covered the part at 768 when its text grew, and the burns cue was
  placed by the svg's box instead of the drawn figure on wide pictures); both fixed, and the five widths that
  failed rerun clean: 600 (1178), 768 (1156), 1024 (1172), 1280 (1172), 1440 (1188) passed, 0 failed. Every other
  width and both dark runs passed in round 1; frames 30 passed, 0 failed (390: 202 frames, 60 mid fade; 1440: 190,
  44 mid fade).
- Preview: `/mnt/user-data/outputs/nremt-body-map-v2/index.html` is the one file page (the frame, Burns' figures
  need the server; the 3D body cannot load from a file at all: it is an ES module and a 3.3 MB model). Shots of the
  sweep in `/mnt/user-data/outputs/nremt-body-map-v2/shots/` (`sweep-*`, `frames-burn-mid-*` mid fade,
  `frames-card-*`).

## Not done, and what I am not happy with
- The frame time rule (median about 16 ms, p95 50 ms with CPU x4) cannot be measured honestly for the 3D body in
  headless Chromium (software WebGL); Burns' fade is one opacity per region and the total, no DOM rebuilds. A real
  phone check is needed for the 3D view (unchanged from today's page).
- The camera zooms close on a small part (the viewer's own fly to, unchanged); on a phone the part sits at the middle
  and the docked card covers the lower 45% of the picture.
- No independent review yet, no real phone, no screen reader pass, only Chromium.

## Review round 1 (2026-11-19, independent review BLOCK; all fixed on this branch)
Merged `origin/claude/tools-v2-all` first (its `check-tool-use.mjs` kept; both sides of the docs tables and of the
check-weight budgets kept: `assets/body3d` 16.4 and the kit's own 34).
Must fix:
1. `?hunt=<name>` asked a random part: the first round now starts on the named part (`firstHunt` in the page); the
   sweep's frames run opens `?hunt=heart` and expects "Find the Heart.".
2. Phones: the scene is `min(150vw, 640px, 100svh − 296px)` (floor 340), the docked card may take 54%, so at
   375 x 667 and 390 x 800 the picture, the card's first lines and both cause line rows are on one screen
   (375 x 667: card text to 556, cause line to 663; 390 x 800: 660 and 796). The sweep asserts it at 360 to 640.
3. The figures no longer move when "Over 10%" shows: the mark and the sum keep their lines from the start
   (`visibility`, a min height); on a phone the total box is two short rows. The sweep asserts the front figure's
   box is unchanged through three burns.
4. Size on laptops: see change 13 (93% and 91% of main for the 3D canvas, 94% and 92% for the figures).
5. Crossing 10%: the cause line shows "[region 4.5%] → Total 13.5% → over 10% → burn center if partial thickness"
   (the old side panel's sentence, short), and the live region says it in full.
6. The sum under the total, from the drawn shares.
Should fix: the two paired dashes read as parentheses ("Testicular torsion (the testis twists on its blood supply)
is…", "Lower back pain, and (in trauma) any leg weakness…"), single dashes stay colons; the cue on a wide picture
sits on the backdrop beside the body (it was also scaled by the Find icon's svg, fixed); a pair drawn as one part
(the kidneys) puts the leader on the nearer one (`project` in viewer.js); on a phone the view slides up by half the
docked card (`viewer.offset`, the camera's view offset, so picking agrees) and back when the card closes; wording:
"half the leg: 9%", "half the arm: 4.5%", "half the front of the trunk: 9%", "the 1% left over", Half brush "half of
this 9%: 4.5%" (the number now sits in the share pill, so the separate number pill went); totals at most one
decimal; Enlarge: the kit hides it in every v2 Explore, and the picture now fills the stage on every screen, so it is
logged as removed (owner log) rather than kept; the ABA's "≥10%" against the course's "over 10%" is in
`docs/nremt-needs-author.md`.
Medical check of every change: the share phrases restate burns.js's tables (head 9 adult and 18 child, half each
side; trunk front and back 18, two nines each; arm 9; leg 18 adult and 13.5 child; genitals 1); "burn center if
partial thickness" over 10% matches the course notes (burn center criteria, partial thickness over 10% BSA).
Checks after round 1: NREMT tests 71 pass; `check-site` OK; `check-weight --check` within budget (`assets/body3d`
16.8 of 17 KB after the round's two viewer hooks). Sweep, one process per width, the new assertions included (the
card's text and the cause line on screen on phones, the figures still through three burns, the sum line, the crossing
note, the child sum "9 + 4.5 + 6.75 ≈ 20.3", `?hunt=heart` asks the Heart): 360, 390, 430, 600 (1203 each), 768 and
820 (1164), 1024 (1180), 1280 and 1440 (1184), 1920 (1196), 390 dark (1203), 1440 dark (1184) passed, 0 failed; frames
32 passed, 0 failed. (768, 820 and 1024 first failed on the cue bubble past the picture's edge; it now sits beside the
body only where the bubble has about 290 px, else under the chest. 1920 and 1440 dark first timed out under load and
were rerun alone.) Size against `origin/main` (the reviewer's s8 method): 3D canvas 742 / 796 at 1440 x 900, 562 / 616
at 1280 x 720; figures 644 / 684 and 464 / 502. Phones: 375 x 667 card text to 556 and cause line to 663; 390 x 800
660 and 796. Preview and shots regenerated in `/mnt/user-data/outputs/nremt-body-map-v2/`.

## Recheck 1 (2026-11-19, independent recheck BLOCK; fixed on this branch)
Merged `origin/claude/tools-v2-all` (44863c4b) first; its `check-tool-use.mjs` kept; both sides of the standard's
table, the owner log and the NREMT needs-author doc kept.
Must fix: from 1024 px the cause line rides the picture's foot, and a big part (liver, intestines) docks its card
along that same foot, so "Tapped Liver → Abdominal / GI / GU" printed over the card's "Job." line. From 1024 px a
docked card now keeps the same 64 px foot as the floating card (`bottom:64px`), at most 520 px wide and centred; the
phone view slide uses the card's real foot. The sweep picks the liver at every width, checks that no cause line pill
comes within 4 px of the card, and at 1024 x 768, 1280 x 720 and 1440 x 900 picks the liver and the small intestine
and asserts a docked card, at most 520 px wide, centred, clear of the cause line.
Should fix: Burns' purpose line is now "Each region is a share of the body: add the burned ones." (two lines at
360 px, like the Body tab's), so at 360 x 640 the crossing note's second row ends on screen; the sweep asserts it
(360 x 640, at 13.5%). Change 13 corrected: on a short phone or tablet the picture is a little smaller than main's,
to fit the picture, the card and the cause line on one screen.
Checks: NREMT tests 71 pass; `check-site` OK; `check-weight --check` within budget; no conflict markers. Sweep, one
process per width (the machine ran at a load of about 10 on 2 cores, so a width took 6 to 22 minutes): 360 (1228),
390, 430, 600 (1227 each), 768, 820 (1184), 1024 (1228, with the liver and the small intestine at 1024 x 768), 1280
(1232, at 1280 x 720), 1440 (1232, at 1440 x 900), 1920 (1220), 390 dark (1227), 1440 dark (1232) passed, 0 failed;
frames 32 passed, 0 failed (390: 164 frames, 67 mid fade; 1440: 156, 48 mid fade). (1024, 1920, 1440 dark and the frame run first crashed on a 240 s screenshot timeout under that load, with
no assertion failing, and were rerun alone; the machine restarted twice during the runs.) Preview and shots refreshed
in `/mnt/user-data/outputs/nremt-body-map-v2/` (new: `sweep-body-liver-*x*`, `sweep-body-small_intestine-*x*`,
`sweep-burns-cross-360x640`).
