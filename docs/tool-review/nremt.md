# NREMT: tool purpose review (2026-11-10)

Opened in Chromium at 1280x800 and 390x844, Premium on. Screenshots: `/home/claude/shots/review/nremt/<tool>/`.

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| Body map | Where structures sit in the body; burn size by the Rule of Nines | LEAVE | The bar. Burns mode paints regions on front and back and totals TBSA as you tap. |
| Scenario simulator | The patient responds to what you choose | FIX | Findings on the body never change when the case says they do; a 2-year-old and a woman in labor are drawn as the same adult figure; the OB case pins "Contractions" on the mother's head. |
| Protocol flows | Produce a protocol's sequence, not just read it | FIX | Stroke end circles overflow; Drill can show the wrong step before the gap; Drill stage is one box in an empty panel. |
| Mnemonics | Expand the letters, then see them used | LEAVE | Small: the cards with no letters (Rule of Nines, GCS, PAT, Rule of Palm) are plain text and have no self-check. |
| Station run (skill sheets) | Say each step aloud against the clock; a missed step shows on the patient | FIX | Only 2 of 10 stations (BVM, bleeding) have a patient. The other 8 are a stopwatch and a list. |
| Sound trainer | Hear each sound where it is listened for and when it falls in the cycle | LEAVE | Chest sites, waveform and timing strip all teach. Small: test stages are mostly empty white. |
| Drug formulary | Decide give or withhold from a patient chart | LEAVE | The chart card is the right picture; the answer quotes the drug card. |
| Reference cards | Find the right row fast; score GCS, APGAR, PAT | FIX | Small: on a desktop the content fills only the top quarter of the stage (vitals strip, PAT triangle tiny). |

## Notes

**Scenario simulator (FIX).**
- Severe leg bleeding: after the tourniquet the case text says "the bleeding stops", but the thigh pin still reads "Spurting bleed" and no tourniquet is drawn. Pins should update from each node (bleed controlled, tourniquet with time, dressing), as the station run already does for the bleeding station.
- Every patient is the same adult figure. "The Choking Toddler" (2 years old) and "Crowning in the Driveway" (27 years old, full term) both show it. A child body and a pregnant body are needed, at least for pediatric and OB cases.
- Accuracy flag: in "Crowning in the Driveway" the pin "HEAD: Contractions" sits on the mother's head. The head in that case is the baby's, crowning. The finding should be on the perineum or abdomen.
- Phone: fine. Monitor and Patient tabs work, and the choices sit right under the stage.

**Protocol flows (FIX).**
- Read, Stroke: the "High" and "Normal" end nodes are circles, and their long text runs past the circle's edge (`flowcharts/01_read_stroke.png`). Use the rounded rectangle the other end nodes use.
- Drill, phone run: it showed "Check blood glucose — result?" then the branch label "Swallows safely" then "?". The real parent of that step is "Can the patient swallow safely...?", reached on "Low". So the context skipped the question the branch label belongs to. Show the immediate parent (and better, the whole path so far) above the gap.
- Drill desktop: one box and a "?" in an otherwise empty stage. Showing the path walked so far would make the picture the flow.
- Build it, phone: the chart is about 270 px tall above the tray, so most placements need scrolling.

**Station run (FIX).** BVM and Bleeding Control are very good: the patient changes as you tick (gloves, pressure, tourniquet with time, gauze). Long Bone, Joint, both Spinal, O2 by NRB, Cardiac Arrest/AED and both Patient Assessments show only a stopwatch and the critical criteria list. Each needs its patient: long bone and joint, the limb with splint, pads and CMS checks before and after; spinal, collar, manual stabilization and board or KED; NRB, tank, regulator and mask on the face; AED, pads placed and hands on the chest; trauma and medical assessments, the body with findings appearing as each phase is ticked.
- Bleeding, zoomed and on the phone: the red wound blob sits outside the thigh outline, not on the leg.
- Phone: the tick list is below the picture, so you cannot see the patient change while ticking.

**Reference cards (FIX, small).** Vitals: the age strip and range bar sit in the top 25% of a large empty stage on a desktop. Triangle: the PAT is about 120 px wide in the middle of an empty panel. Scale both to the stage. Wording: the preschool row reads "SBP > 76–82"; say "lowest acceptable about 76 to 82 (70 + 2 x age)".

**Sound trainer (LEAVE, small).** In Name it the stage is a play button and answer chips on white; showing the chest with the site would help. "Everything 9" was selected but only the 6 heart choices showed on a heart clip, which reads like a filter bug. In When, the strip is small and floats mid stage.

**Body map.** Only the opening view and Burns could be screenshotted: after a tap on the WebGL model, headless screenshots hang here. The opening view and Burns painting are good.
