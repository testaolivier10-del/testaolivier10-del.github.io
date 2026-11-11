# AP Chemistry: tool purpose review (2026-11-10)

Every page in `chem/tools/` (8) opened in Chromium at 1280x800 and 390x844. Every button, chip, slider end and setup
sheet in Explore, plus Test yourself items. Screenshots: `/home/claude/shots/review/chem/<tool>/` (numbered, with
`labels.txt`) and `<tool>__phone.png`.

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| Buffer drills | A buffer soaks up added acid or base, so pH barely moves | FIX | Beaker of HA and A- plus a pH line against pure water: right idea. The added OH- or H3O+ is never seen; one particle fades in under 300 ms. The beaker scale numbers sit on top of the particles. Beaker and graph are small. |
| Equilibrium and kinetics | Q vs K, Le Chatelier, catalysts and rates at the particle level | FIX | Box, Q/K bar, rate bars and energy curve all work. In Test yourself the concentration graph under the box is a few pixels high and unreadable. The Explore picture uses the top half of the stage. |
| ICE table drills | Set up the I, C and E rows and solve for x | FIX | Explore never shows an ICE table (only in Setup). The jar's molecules pack into chains (IIII, HHHH) so they cannot be counted. See notes. |
| Particle diagrams | A balanced reaction in particles: atoms conserved, what is left over | LEAVE | Build-a-box and pick-the-picture are the idea. Small: the boxes use the top half of the stage and H atoms are tiny. |
| Periodic trends and PES | Trends across and down; PES peaks are subshells | LEAVE | Heat map table, across and down bars, and the PES with a shell picture. Phone shows main groups only, which reads well. |
| Q vs K | Compare Q with K to predict which way the mixture goes | FIX | Explore jar packs molecules end to end into chains ("A B A A", "B B A A"), so the student cannot count A2, B2 and AB, which is the whole task. The Test yourself box spreads them out correctly. |
| Titration curve reader | What is in the flask at each point of the curve | LEAVE | Flask, magnified particle view, indicator color and the curve all move together. Small: particles in the magnifier are tiny. |
| Units and sig figs | Units cancel in a set-up; report the right sig figs | LEAVE | The fraction with struck-out units is the idea. Small: leftover units print with carets ("L^2·atm") instead of superscripts; Test yourself stage is a bare question. |

Counts: LEAVE 4, FIX 4, REDESIGN 0.

## Notes

**ICE table drills (FIX).** The tool's name is the table, but in Explore the student drags x and sees bars, a jar
and the Q bar, with no table. Show the live ICE table on the stage: I row fixed, C row as -x, -x, +2x with the
current x filled in, E row updating as x moves, next to the bars. Spread the jar's molecules (shared fix with Q vs
K below). In Test yourself the bars and jar are empty until the I row is filled, which is fine.

**Q vs K (FIX) and the shared jar.** The jar (`live-beaker.js`, also used by ICE) places molecules so they touch
end to end and line up in rows. Give each molecule its own space (a minimum gap) so A2, B2 and AB read as separate
molecules, like the Test yourself box already does. On phone the chains are worse.

**Buffer drills (FIX).** When the student taps + OH-, draw the OH- coming in and taking the H off one HA (HA becomes
A- plus water), slow enough to see (about a second), and the same for H3O+ with A-. Then the beaker shows why pH
barely moves. Move the volume scale off the particles. Let the beaker and graph use the empty stage space.

**Equilibrium and kinetics (FIX).** Make the Test yourself graph a readable size (it is under 30 px tall). In
Explore the box and graphs could fill the stage instead of its top half.

**Accuracy flags.**
- Titration: at 1.95 mL (pH 6.59, still the weak acid buffer region) the badge reads "Neutral". The value is right
  (checked against Henderson-Hasselbalch); the word may mislead.
- Periodic trends: H shows 32 pm and Na 186 pm; these look like covalent and metallic radii mixed on one scale.
  Check the footnote says which radius each value is.
- Checked and correct: titration pH at 0 mL and half equivalence (HOCl, pKa 7.52), ICE equilibrium for H2 + I2.

**Phone (390x844).** No page scrolls sideways. Units tiles run past the right edge inside their scroll row;
equilibrium graph is small; buffer particles still sit on the scale.

**Not opened.** None; all 8 opened and used.
