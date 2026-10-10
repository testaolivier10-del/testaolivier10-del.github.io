# U-NREMT-cases: notes

Branch `claude/tools-upgrades-nremt-cases`. Tests: `scripts/test/nremt-cases.test.mjs`.

## Scenario sim (flagship 2) - `nremt/scenario-sim.html`, `nremt/assets/scenario-monitor.js`
- **Job:** put the patient in front of the student so the numbers move because of what they chose.
- **Changed:** a dark patient monitor (HR, SpO2, BP, RR tiles; ECG-style and pleth traces on canvas) fed only by
  each node's `vitals` line; values ease from node to node; a vital the node does not give shows a dash; the
  case's other vitals words (Temp, glucose, "CPR in progress") show as chips. Tiles flag low/high against the
  reference card's ranges for the patient's age (age parsed from the opening sentence). At 10 time-critical forks
  (`HESITATE` in the module) the numbers drift, after 6 s, over 45 s, toward the vitals of the node the case's own
  "wait / do something else first" choice leads to, never past them, with "Simulated: the patient is getting worse
  while you decide"; the debrief notes how long the student took there. A patient silhouette (child proportions
  for under-12s) plus Mental status / Airway / Breathing / Circulation / Skin chips: tapping lists the sentences the
  case has given so far about that region (current node in bold, earlier ones marked), with DCAP-BTLS letters where
  a sentence names one. All 25 cases, branching, consequences, rewind, debrief, Review recording unchanged.
  Phone: monitor, node text and choices first; the body panel follows (jump link).
- **Owner check:** the ECG is a generic complex at the case's rate (labeled simulated), not a rhythm. s25 has no
  age (family of four), so no flags there. Body-region keyword matching is heuristic: a sentence can show under a
  region it only mentions in passing.

## Flowcharts - `nremt/flowcharts.html`, `nremt/assets/flow-build.js`
- **Job:** make the student produce a protocol, step by step, and say exactly why a step does not go there.
- **Changed:** third mode "Build it" (between Read and Drill me): pick a protocol; shuffled tiles (its own steps
  plus two from other protocols) drag or tap into slots; decisions are diamonds; branch arms are labeled with the
  answer and end markers; a wrong tile bounces back with a reason built from the chart (too early/late and what
  it follows, the other answer's arm, a different question's arm, or which protocol it belongs to); the page's
  notes appear under each part once filled. Completion records to Review (`build:<anchor>`; correct only if no own
  step was misplaced). `#build-<anchor>` deep link. Read and Drill unchanged.

## Formulary - `nremt/formulary.html`, `nremt/assets/formulary-cards.js`
- **Job:** practice the decision the page is about: given this patient, give or withhold.
- **Changed:** "Give or withhold?" stack (default; Question drill behind the switch, `#drill` opens it): 19 patient
  cards, 8 per deal; swipe, buttons or arrow keys; the answer quotes the deciding line from that drug's card
  (read from the DOM) and, for a give, its dose line. Misses go to Review.
- **Owner check:** the patients are written for this tool (see accuracy list); each deciding phrase is pinned to
  its card by the test.

## Skill sheets - `nremt/skillsheets.html`, `nremt/assets/station-run.js`
- **Job:** run a station against the real clock and see what would fail it as it happens.
- **Changed:** run screen gets a countdown ring (amber in the last 20%, red past the limit, spoken at both); the
  limit now comes from the page's official-sheets table time column where a row matches (the old "commonly
  published" defaults remain as fallback); that row's critical criteria are listed and light up when the run
  shows one (BSI not ticked before a later phase -> "No PPE"; time passed -> the "within the N minutes"
  criterion) or when the student taps one; lit criteria are in the summary, with a badge by the clock on phones.

## Reference cards - `nremt/reference-cards.html`, `nremt/assets/vitals-check.js`
- **Job:** find the right row fast and know at once whether a vital is normal for that age.
- **Changed:** age slider (birth to adult) highlights the table row (rows are also tappable); HR / RR / systolic
  picker and a number box drawn on a band gauge with a normal/low/high verdict. Ranges are read from the table;
  systolic for ages 1 to 10 uses the card's 70 + 2 x age note; the verdict adds the card's own sentences
  (hypotensive; pediatric bradycardia; normal BP is not reassurance).

## Mnemonics - `nremt/mnemonics.html`, `nremt/assets/mnemonic-check.js`
- **Job:** check you can expand the letters, then see them used on a call.
- **Changed:** each lettered card has "Fill the letters" (type each letter's word, Show marks each against the
  card's bold word; lenient prefix match) and, for 12 cards, "Use it on a call" into a scenario whose text uses
  it. Cards have `#m-<name>` anchors. `scripts/build-nremt-flashcards.mjs` card split now tolerates attributes.

## Budgets and caching
- `check-weight.mjs`: nremt shell 11.4 -> 16.5 (scenario-monitor.js), scenario-sim.html 50 -> 51.5 (monitor CSS).
- `sw.js` precache: added flow-build.js and scenario-monitor.js next to flow-drill.js (CACHE not bumped).

## For accuracy review
1. **Monitor ranges** (scenario-monitor.js `REF`): copied from the reference card table, pinned by test; adult row
   HR 60-100, RR 12-20, SBP 90-140. Systolic low for ages 1-10 = 70 + 2 x age (card's note); other ages the row's
   lower figure. SpO2 under 94% flagged low (formulary Oxygen indication). Applying the adult row to adolescents
   for "high SBP" is not done (only adults flag high BP).
2. **Hesitation drift** forks: s1_start, s1_lifted_dressing, s1_pressure_still_bleeding, s5_start, s5_assess_good,
   s8_start, s11_treated, s12_start, s16_start, s23_start. Each drifts to that case's own "wait" node values. The
   6 s grace and 45 s span are pacing choices, not physiology; labeled simulated. Check that s5_assess_good ->
   s5_delay_call (calling medical control) is fair as "waiting".
3. **Give or withhold cards** (formulary-cards.js), answers: aspirin give (suspected cardiac chest pain), give
   despite daily 81 mg, withhold for coffee-ground vomit/black stools (active GI bleed), withhold at 15 years
   (Reye's); nitroglycerin give (own Rx, BP 148/90, HR 84), withhold at SBP 86, after sildenafil last night, after
   3 doses, and with no own prescription (bystander's); oral glucose give (glucose 48, swallows), withhold when
   responds only to pain; epinephrine give (allergen + skin + throat), withhold for hives alone after an
   antibiotic (and offered her own auto-injector), give to a 72-year-old with CAD in anaphylaxis with BP 84/50;
   naloxone give (RR 4, SpO2 82, while ventilating), withhold when RR 16, SpO2 97 after heroin; albuterol give
   (asthmatic wheeze, own inhaler); oxygen give for suspected CO despite SpO2 99%, and for SpO2 89%. The
   "skin only" epinephrine card says withhold: the page says skin alone is an allergic reaction, not anaphylaxis;
   confirm that is the intended teaching for a patient who carries an auto-injector.
4. **Skill sheets**: station limits now taken from the page's own table (5/10/15 min per sheet) rather than the
   script's old list; the numbers are the same as before for all ten stations. "No PPE" lit by BSI not ticked first
   is the tool's inference, not an official scoring rule.
5. **Reference slider** stops: 0, 1, 3, 6, 9 months, then each year to 18, then adult; ages exactly on a band
   edge (e.g. 3 years) go to the older row (table bands overlap at their edges).
6. **Mnemonic-scenario links**: SAMPLE, OPQRST -> s2; AVPU -> s8 (sternal rub); DCAP-BTLS -> s13; Cincinnati,
   FAST, BE-FAST -> s7; Scene size-up -> s19; AEIOU-TIPS -> s22; APGAR -> s15; Pediatric assessment triangle ->
   s12; PERRL -> s1. Several cases apply the framework without naming it (s8, s12, s13, s22): check they fit.

## Open
- No needs-author items raised.
