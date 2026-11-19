# Ochem tools in the standard frame (F1, 2026-11-15)

Spec: `docs/tools-frame-2026-11.md`. Shared API: header of `assets/course/tool-studio.js` and `docs/tools-calm.md`
("The standard frame"). `ochem/assets/tool-shell.js` mounts every ochem tool with `std: true`, so all nine get:

- Bar: name, one line (the registry blurb; the arrow pusher's line is the mockup's), modes, Ask the tutor, Share,
  "?" and the menu. "?" opens the second sheet ("Help and reference"; synthesis "Problems and help", 3D viewer
  "View options and help", conformations "Ring builder and help"), which still holds the tool's reference and
  settings, then Check yourself and Keep going.
- Menu: Start over, Copy link, About, Report, Ask the tutor, Periodic table, then **Check yourself** and **Keep
  going** (new: each opens the sheet at that section), Course home, All tools.
- Finished card extras (`OchemStudioKit.extras`): Full explanation (Why), Check yourself (6 questions), Read the
  lesson (from the tool's Keep going list).
- Each tool builds its scenario dropdown with `studio.picker` and the pick calls the tool's own function (the old
  hidden chips and `OchemStudioKit.chipPicker` were removed in the 2026-11-19 cleanup).

Nothing a tool did before was removed. Each list below is everything the tool does and where it is now.

## Arrow pusher (the template, matches the approved mockup)
| Feature | Where now |
|---|---|
| 3 modes (Ready-made, Build your own, Mechanism challenge) | bar: Explore, Build, Challenge |
| 21 ready-made molecules in 4 groups | one grouped dropdown, stage top left (sub = group name) |
| Per-molecule nudge (`hint`) | hint ladder "Nudge for this molecule" (one step) |
| Arrow editor (tap source, tap target, pulsing likely ends, tap an arrow to remove) | stage, left |
| Editor Undo / Clear | stage foot: Undo, Reset (drive the editor's own buttons; off with no arrows) |
| What your arrows make (product drawing, fragments) | stage, right of an arrow, only once an arrow is drawn |
| Readout: what you drew, errors, warnings, commentary, "Legal, but" notes | side panel "What happened": the head names the first arrow (or the error); the notes below |
| Illegal arrow | red pill and a short note under the drawing on the stage; full text in the panel |
| Use this as the next step, mechanism strip, Start over | panel action; strip on the stage as before |
| See it in 3D | tag under the notes |
| Formal charge table (bookkeeping) | "?" as "Formal charges", open |
| How an arrow works, keyboard help | "?" |
| Builder: type, quick picks, canvas, palette, charges, undo/clear | Build mode only: builder on the stage; quick picks in the "Start from" dropdown; builder Undo and Clear (now "Reset") at the stage foot |
| Builder verdict | panel ("Every atom checks out" or what to fix) |
| Push on a built molecule | "Push electrons on this" carries it to Explore ("Yours" group in the dropdown) |
| Send to other tools (handoff) | "?" sheet in Build and menu "Open in another tool" |
| 7 challenges (2 two-step) | dropdown with "n of 7"; Check primary; step marker "Step 1 ✓ / Step 2 of 2" heads the panel; the intermediate is the drawing |
| Target | readout pill on the stage; structure behind "Show target structure" (stage foot) |
| Wrong check feedback | the arrows the step does not want turn red on the molecule (new `marks` option in molecule-editor.js, cleared at the next edit), short note under the drawing, full reading in Explanation |
| Show one arrow | hint ladder answer, opens after one wrong Check; each tap shows one more arrow |
| Next challenge, Again | finished card: Next challenge, Try it again, Full explanation (arrow by arrow), Check yourself, lesson |
| URL state (start, build, chal), handoff in | unchanged; a `build=` link lands on pushing that molecule |
| Check yourself quiz, Keep going | "?" sheet, menu, finished card |

New copy: two hints per challenge step and a takeaway per challenge (in `CHALLENGES`). Chemistry check, by the
writer: each hint names the nucleophile or the bond that breaks and matches the step's stored answer arrows.

## Resonance explorer
Modes Find the forms, Compare two (bar). Species chips (13) now one dropdown (Start here, More species). Build your
own keeps its disclosure (summary renamed). "Show me one I'm missing" is the ladder's answer, open after one judged
arrow set, with two new hints before it. Finished card when every form is found (at least one by the student): All
found, Next molecule, Start over, Full explanation (ranking), Check yourself, lesson. Unchanged: forms gallery,
hybrid view, charge map (in "?"), compare mode, URL state, handoff.

## 3D molecule viewer
Modes Explore, Predict shape. Molecule chips in groups now one grouped dropdown (Explore). Unchanged: Ready-made |
Build your own, the 3D stage, atom readouts, view options and send (in "?"), predict quiz.

## Spectroscopy lab
Modes Read a spectrum, Identify it, Reference. Compound chips (two sets) now one dropdown (Start here, More
compounds); "Draw your own" keeps the builder. Unchanged: IR / NMR switch, peak notes, tables (in "?"), puzzle,
degrees of unsaturation.

## Synthesis trainer
Modes Forward, Backward. New problem dropdown on the stage, grouped by chapter, solved ones ticked; the Problems
sheet (chapter filter, list, Random route) stays behind "?". Its 3 layer hint: the third layer names the reagents
(the answer), so it now opens after one pick on the problem (the second hint says so). Finished card: Next problem,
Solve it backward, All problems, Full explanation (shortest route), Check yourself, lesson.

## Acid/base comparator, Conformation lab, Reaction predictor, Reagent roadmap
On the standard bar, "?" and menu; layouts otherwise unchanged. Judgment: their choices are already dropdowns
(substrate, reagent, start and target, molecule) or one-tap predictions whose result lands on the stage pills and
the caption with New pair / New question beside it; a finished card per one-tap round would add a click per round
for no gain, so none was added.

## Questions for the owner (nothing removed)
1. Reagent roadmap has four modes (Route, Reagent, Groups, Puzzle); the standard says at most three. Merge Groups
   into Reagent, or keep four?
Done along the way: captions that said "Why? has the reasoning" now name the Explanation button.

2. The arrow pusher's old ready-made chip list and the 13 resonance / spectroscopy chips stay in the page hidden (the
   dropdown drives them). Fine to delete that markup later?
   Done 2026-11-19 (cleanup): removed; the dropdowns call the tools directly (`docs/tools-frame-2026-11.md`, "Cleanup").

## Accuracy check (2026-11-16, second reader)
Every new student facing string from PR #211 (89c976d) read against each challenge's molecule in
`ochem/assets/molecules.js` and its stored answer arrows. Rung rule used (code comment and
`docs/tools-frame-2026-11.md` item 5): hint 1 is the idea, hint 2 is the move in words, Show one arrow is the
answer and opens after one wrong Check. 43 strings checked (36 arrow pusher, 4 resonance, 3 synthesis) plus the frame labels; 5 changed.

### Arrow pusher (`CHALLENGES`)
| Challenge | String | Verdict |
|---|---|---|
| SN2 | H1 "The nucleophile is the one with a negative charge and lone pairs to give." | OK: hydroxide (nucO, O⁻, 3 lp) |
| SN2 | H2 "It attacks the carbon that holds bromine. In the same step the C–Br bond breaks onto bromine." | OK: matches nucO→c1, C–Br→Br; move level, fine for rung 2 |
| SN2 | Take "SN2 happens in one step." / "Hydroxide attacks the carbon from the back while bromide leaves. ..." | OK: backside attack; C1 is not a stereocenter, so no inversion claim needed |
| Acid–base | H1 "A base uses a lone pair to take a proton." | OK |
| Acid–base | H2 "As the new bond to the proton forms, the old O–H bond breaks and its electrons stay on the acid’s oxygen." | OK: O–H proton (pKa 4.8), not the alpha C–H; matches nucO→h, O–H→o2 |
| Acid–base | Take "The base takes the proton." / "... stay on oxygen as acetate. Every proton transfer is these two arrows." | OK |
| SN1 step 1 | H1 "Nothing attacks in this step." / H2 "One bond breaks, and both of its electrons leave with the more electronegative atom." | OK: heterolysis onto Br, one arrow |
| SN1 step 1 | Take "Ionization comes first in SN1." / "The C–Br bond breaks on its own ... separate step." | OK: secondary carbocation, rate step |
| Protonate C=O | H1 "The carbonyl oxygen has lone pairs to give." | OK: o1 is the most basic site |
| Protonate C=O | H2 was "... the acid’s bond to that proton breaks onto the acid." | **Changed**: vague about where the electrons go. Now "One lone pair takes a proton from hydronium, and that O–H bond breaks onto its oxygen, which leaves as water." Matches o1→ha, ac–ha→ac |
| Protonate C=O | Take "Acid makes the carbonyl a better electrophile." / "... so even a weak nucleophile can attack it next." | OK: Fischer step 1; alcohol attacks next |
| Aldol | H1 "The enolate’s carbon is the nucleophile." / H2 "It attacks the carbonyl carbon of the other molecule, and the C=O pi bond moves up onto oxygen." | OK: ca→c2, C=O→o2 (o2 is drawn above c2) |
| Aldol | Take "An enolate is a carbon nucleophile." / "... which gives the alkoxide." | OK: aldol addition stops at the alkoxide; no claim on protonation or condensation |
| Acyl subst. | Step goals "Add methoxide to the carbonyl to make the tetrahedral intermediate." / "Collapse the intermediate and expel chloride." | OK |
| Acyl subst. | Step 1 H1 "Methoxide is the nucleophile." / H2 "It adds to the carbonyl carbon, and the C=O pi bond moves onto oxygen." | OK |
| Acyl subst. | Step 2 H1 "The negative oxygen pushes a lone pair back down to remake C=O." / H2 "Carbon can keep only four bonds, so the C–Cl bond breaks and chloride leaves." | OK: o1→C–O, C–Cl→Cl |
| Acyl subst. | Take "Add, then eliminate." / "... pushes out chloride, the best leaving group on that carbon." | OK: Cl⁻ over MeO⁻ |
| Claisen | Step goals "The enolate adds to the ester carbonyl." / "Collapse the intermediate and expel ethoxide." | OK |
| Claisen | Step 1 H1, H2 (enolate carbon adds to the ester carbonyl carbon, pi bond onto oxygen) | OK: ca→c2, C=O→o2 |
| Claisen | Step 2 H1 "The negative oxygen pushes a lone pair back down to remake C=O." | OK |
| Claisen | Step 2 H2 was "The bond to the ethoxy oxygen breaks, and ethoxide leaves." | **Changed**: the drawing has two ethoxy oxygens (the enolate keeps its own OEt). Now "The C–OEt bond on that same carbon breaks, and ethoxide leaves." Matches C2–O3→o3 |
| Claisen | Take "Add, then eliminate, again." / "... acyl substitution with a carbon nucleophile." | OK: gives the β keto ester |

Frame strings in the arrow pusher (task lines, "Step n gave you this intermediate. Draw step n+1 on it.",
"Arrow right" / "Both arrows right" / "Mechanism complete", the builder verdicts): no chemistry claims; OK.

### Resonance explorer
| String | Verdict |
|---|---|
| H1 "Look for a lone pair or a π bond next to another π bond, or next to an atom that is short of electrons." | OK: covers all 13 species (anions, amide, nitro, cations, benzene, ozone) |
| H2 was "Move a pair one place over, into the neighboring bond, and push the π bond it meets onto the far atom. ..." | **Changed**: wrong for the allyl and benzyl cations (one arrow, no π bond pushed) and for benzene (π bonds move around the ring, none goes onto an atom). Now "Move a pair one place over: a lone pair into the bond beside it, or a π bond toward its neighbor. If an atom would then pass an octet, move one of its π bonds on too. Atoms stay put; only electrons move." |
| Finished card was "The real X is a blend of them, most like the best form." | **Changed**: for equal forms (acetate, carbonate, benzene, nitrate) there is no single best form. Now "The real X is one blend of them, closest to the most stable forms." |
| Caption "Explanation says which one the molecule is most like." | Left as is (older wording, only the button name changed); the ranking it opens says when forms are equal |

### Synthesis trainer
| String | Verdict |
|---|---|
| Gate note "Make a pick, and the last hint (the reagents) opens." | OK: matches `tried()` (any pick, right or wrong, either direction) and keeps hint 3, the answer, behind a try |
| Finished card "That is the shortest route." / was "The shortest route takes N; ..." | **Changed** (wording, not chemistry): read "takes 2;" with no unit. Now "takes 2 steps;" |

Other tools in the PR (acid/base, conformations, reagent roadmap, spectroscopy, 3D viewer, tool shell): only
"Why?" renamed to "Explanation" and frame labels; no new chemistry. OK.
