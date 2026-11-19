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
the cause line: [region] → [why its share: "half of the arm's 9%"] → [4.5%] → [Total 13.5%]. Over 10% a small
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
10. **The total is on the picture**, big ("Burned 13.5%"), between the figures on a wide picture; the over 10% note
    is a small mark there, the sentence in "?". The list of painted regions under the total (old side panel) is gone
    from Explore: each burned region is drawn on the figures with its number, and the cause line names the last one.
11. **Adult | Child is on the picture**; the brush (Full | Half | Erase) and Start over sit under it (they were in
    the dock and behind "More options"; a connected control is never hidden behind a step, rule 11).
12. **Region boundaries are a solid hairline** (they were dashed: the builder brief's "no dashed shapes that could
    read as torn parts"); the quiz's "these regions" mark is solid too.
13. **Figures larger**: the switch and the total float over the picture's corners on a wide picture, so the figures
    take the full height; the region numbers read about 16 px on a desktop (they were about 11 px).
14. **The first visit cue** is the kit's (one per tab, never on a number or label) and "Show me how" is a three step
    tour per tab.
15. **"?"** holds what you are looking at, the view options (Reset view, Show skin, the six body systems, how to
    turn and zoom, the "not to scale" note, the list of parts by name), the Rule of Nines in words, the brush, over
    10%, the palm rule, the directional terms and the credits: moved, never copied.
16. **The NREMT adapter** (`nremt/assets/nremt-kit2.js`) is used as is; nothing was added to it.

## Decisions made for the owner (also in the owner log)
1. Explore is two tabs, The body and Burns; the find quiz and the Rule of Nines quiz are Test yourself.
2. The card opens on the picture, beside the part (docked along the bottom under 700 px), with three tabs.
3. Burns' painted regions list left Explore (the figures show them; the quiz answers still show the sum).
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
