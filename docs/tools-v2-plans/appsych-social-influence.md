# AP® Psychology, Social influence: tools v2 plan

**Tool and page:** `psychology/tools/social-influence.html`; scripts `assets/tools/social-influence.js`,
`math/social-influence.js`, `social-influence.css`; data `data/tools/social-influence.json`; test
`scripts/test/appsych-tool-social-influence.test.mjs`. **Premium.** Rollout row 123, group P, wave 14. The audit
(`docs/tool-audit-2026-11.md`) asked for every situation to work like Conformity: one scene, one control on it.

**The one idea:** the situation changes what people do. Four tabs, each a classic study the student can change, with
the published result drawn as the bar that moves:
1. Conformity: more people giving the wrong answer first make you go along, until a partner breaks the spell (Asch).
2. Obedience: the closer the learner and the farther the authority, the fewer obey (Milgram).
3. Bystanders: the more others who can hear, the less likely anyone helps, and the slower (Darley and Latané).
4. Groups: an audience helps on easy, practiced tasks and hurts on hard ones (social facilitation).

**Research:**
- [Macmillan Concept Practice, the Asch study](https://digfir-published.macmillanusa.com/contpract/asch_study.html)
  and [PsychSim "Everybody's doing it"](https://digfir-published.macmillanusa.com/bsmtest_fig_credit/asset/psychsim/partials/everybodysdoingit/s12.html):
  the line task with confederates, the student picks before seeing the result. Take: the lines and the table of
  people as the picture.
- [Nicky Case, The wisdom and/or madness of crowds](https://ncase.me/crowds/): add people to a network and the
  behavior spreads or stops. Take: adding people one tap at a time with an instant result.
- [hei-lab Experiential museum of psychology](https://hei-lab.ulusofona.pt/society/apps-demos/experiential-museum-of-psychology)
  (summary only): classic studies as scenes. Take nothing claimed beyond the idea.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Situation chips Conformity, Obedience, Bystanders, Groups | Explore: four tabs |
| "People who give the wrong answer first" slider (0, 1, 2, 3, 4, 8, 16), "With a partner" | Tab 1: drag people to the table (main, the same stops); the partner a quiet tap on one seat |
| Obedience condition chips (proximity, touch, telephone and others) | Tab 2: drag the learner closer (main: other room, same room, touch); the experimenter's chair a quiet drag (in the room or on the phone) |
| Bystander group size chips | Tab 3: tap to add listeners to the intercom room (main) |
| Groups: audience chips over a bar chart | Tab 4: drag watchers into the pool hall (main); good or poor player a quiet tap |
| Bar charts of all conditions with sources | "?" (the full table with sources); one bar on the picture |
| Drills conformity, obedience, bystander, groups, attribution, compliance; contexts `conformity`, `obedience`, `bystanders`, `groups`, `compliance`, `attribution` | Test yourself, unchanged; ids `social-influence:<context>:<step>`; attribution and persuasion stay drills and get "?" notes (logged) |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:** each tab is a room drawn at flagship depth with people of varied skin tones, and a tall bar on the wall
showing the published result for the current setting with its source name ("Asch, 1956").
- Conformity: a seminar table, a card with three lines and a standard line; drag people in to sit before you; each
  says the wrong line in a speech bubble; the bar shows the share of answers that went along. With a partner
  seated, the bar drops. Cause line: "3 wrong answers first → 33% of answers went along".
- Obedience: the teacher at a shock generator (drawn as a panel of switches, never a person in pain), the learner's
  room; drag the learner closer; the bar shows the share who went to the end. Cause line: "Learner in the same
  room → 40% obeyed to the end (Milgram, 1974)".
- Bystanders: a student in a booth with an intercom; tap to add others who can hear; the bar shows the share who
  helped before the end, and a small clock the delay.
- Groups: a pool hall; drag watchers in; the good player's shots improve, the poor player's get worse.
Takeaway per tab, e.g. "One ally cuts conformity sharply." Outside the picture: tabs, purpose line, Show me how,
cause line: about 25 words, 3 controls.

**Science to verify:** the audit's checked values: Asch (under 1% alone, 3%, 13%, 33%, about 32% overall, about 6%
with a partner; Asch 1951, 1955, 1956); Milgram (65% baseline, 62.5%, 40% same room, 30% touch, 22.5% telephone,
47.5%, 10%; Milgram 1974, 40 men per condition; the 22.5% vs 20.5% textbook split is logged in
`docs/appsych-needs-author.md`); Darley and Latané 1968 (85%, 62%, 31%); Michaels et al. 1982 (71 to 80%, 36 to 25%);
Latané, Williams and Harkins 1979 (social loafing, in "?"). Ethics: "?" names the ethics debate around Milgram
(deception, distress, debriefing) and later replications (Burger 2009). Never trivialize; no shocks shown on a
person.

**Reuse:** `ApPsychTools.kit2` (Brain map branch); kit `K.tabs`, `K.drag` with named stops, `K.tap`, `K.cause`,
`K.cue`; the existing crew art (`CREW`, `SKIN`, `SHIRTS`).

**Risks reviewers will likely block on:** many people in a room at 360 (16 at the table: draw them smaller in a
second row, never under the readable size; labels on bubbles kept to one word); the bar must come only from
published values (no interpolated values between conditions the studies did not run: the drag snaps to real
conditions only); the audit's collisions (a head over "blindfolded, headphones on", text off the edge) must not
return; Milgram depiction tone.
