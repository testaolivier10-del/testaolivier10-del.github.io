# Tools v2: Organic Chemistry Resonance (brief and build notes)

Status file for the v2 rebuild of `ochem/tools/resonance.html` (free; rank 17 in `docs/tools-v2-rollout.md`, group B
"builders and drawers"). Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`. Branch
`claude/tools-v2-resonance`, cut from `claude/tools-v2-all`. NOT merged: an independent reviewer runs first.

## The one main idea (one screen)
**Moving electrons turns one resonance form into another; the real molecule is the blend of them, closer to the
forms that are better.** A curved arrow starts at a lone pair or a π bond and ends one place over; the atoms never
move. Forms with full octets, fewer charges and a negative charge on the more electronegative atom count for more.

One screen, not tabs: the forms, their ranking and the hybrid are the same idea seen three ways, and each is a
consequence of the move the student makes (rule 11).

## Research (rule 10): what exists and what we took
"Read" below means the page's text was fetched and read, not that the program was opened and driven. None of the
apps below was run in a browser for this job.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| Mechanisms (Alchemie), App Store page and Fisher, Gerdon et al., NSF report on its usability study (read) | The student drags the electron pair itself with a finger; bonds form when it lands. No curved arrows on screen (a finger hides the arrowhead, so the motion is shown instead). A move that is not allowed snaps back with a sound; some wrong moves open a hint saying why. Goal card, Expert mode without hints | Immediate assessment of each move "best supported experimentation"; students tried several paths and used the feedback | Hints were missed when not prominent; students moved back and forth a lot; no arrows means the exam notation is never practised | Drag the pair itself; snap back on a wrong move with the reason on the picture and in the cause line, at once. We also draw the curved arrow behind the moving pair, because the arrow is what exams ask for |
| Marvin JS electron flow arrows (ChemAxon help pages, read) | Pick the arrow tool; start on a lone pair, a radical or a bond; end on an atom, a bond next to the source (the head snaps to the bond's midpoint) or a new bond. Atoms with electrons highlight on hover; a grey preview arrow follows the cursor; clicking the source makes its dots bigger to grab | The snap to a bond's midpoint and the live preview | Invalid arrows are simply not allowed, with no reason; a tool mode to pick first | The arrow head snaps to the nearest atom or bond midpoint, with that target lit; a preview arrow follows the finger; the sources are big targets. Unlike Marvin a wrong move is allowed and explained |
| ChemDoodle Web Components "Pusher" (docs, read) | An arrow is defined by a source (atom or bond), a target (atom or bond) and an electron count, and drawn as an automatic Bézier | The arrow shape is automatic; the user never shapes a curve | Programmatic; no teaching feedback | The arrow's curve is drawn for the student from its two ends (they never shape it) |
| Ketcher help (read) | Structure editor; a reaction arrow only. A wrong valence is underlined in red | Valence errors shown on the atom | No electron flow arrows at all | A problem is drawn on the atom (an amber ring and "10 e⁻"), not in a box |
| MolView FAQ (read) | 2D sketcher with an Electron Dots tool; mechanisms "not yet supported" | Lone pairs as dots you can see | No arrows, no resonance | Lone pairs are always drawn as dots |
| The old LevlPrep Resonance Explorer | Tap a lone pair or π bond, then tap where it goes; "Add it to the collection"; forms found as cards; ranking and the averaged charge in panels | The engine (`resonance-engine.js`) knows every form, so it can say "2 of 5" and explain a wrong move | A task (find the forms), not play; 26 controls; the hybrid hidden until every form is found | The engine, its reasons and its counts; tap then tap stays as a second way in |
| OrgChem101 "Mastering the Arrows" (not reached) | | | | |

What ours does that none of them do: the student pushes the electrons and sees, on the same picture, the new form,
where it ranks among all the forms, and the real molecule they blend into.

## The design
(filled in as built; see "What was built")
