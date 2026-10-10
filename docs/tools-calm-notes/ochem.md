# Calm tools P1: Organic Chemistry

One line per tool: stage / dock controls / what moved to Why and Details. Shared ochem pieces: `OchemStudioKit` in
`ochem/assets/tool-shell.js` (adopt the tool's own mode switch, calm builder, scrolling chip rows) and the
"Tool Studio: shared ochem pieces" block in `ochem/assets/tools.css` (`.ls-pics`, `.ls-ed`, `.ls-pane`).

- **Arrow pusher**: stage = the arrow editor (Undo / Clear under it, mechanism strip above) beside "What your arrows
  make" (or the challenge's Target) / dock = Ready-made, Build, Challenge; molecule chips (More molecules), the builder's
  type row (canvas behind "Draw it yourself"), challenge chips; one action row (Use this as the next step, or Check step,
  Show one arrow, Next challenge) / Why = what you drew, errors, notes, Legal but, See it in 3D, Need a nudge, challenge
  goal and verdict / Details = electron bookkeeping table, Take this molecule to (build), keyboard help, Check yourself,
  Keep going. Caption and pills say the result (formula, cannot happen, legal but, step n of m). Fixed on the way:
  `?build=` links now open the built molecule (select() used to overwrite the address before it was read).
- **Resonance explorer**: stage = the drawing board beside "Forms found" (a strip of form cards, ? for the missing
  ones; Compare two: both species as panes, the winner outlined) / dock = Find the forms, Compare two; species chips
  and "More species, or build your own" (the builder inside); Add it to the collection (Compare: the two picks, then
  your call or Try another pair) / Why = the verdict, progress with Show me one I'm missing and Start over, the ranking
  ("Which one is the molecule really like?" with its rule table), each form's rank and reason in words; Compare: the
  deciding rule / Details = where the charge sits (averaged picture), Compare's numbers, Check yourself, Keep going.
- **3D molecule viewer**: stage = the model (drag to turn, tap an atom; shape and measured angle as pills) / dock =
  Explore, Predict shape; Ready-made or Build your own, the molecule chips (More molecules) or the builder; Predict
  shape asks one thing at a time (shape, then angle, Back / Next, Check, Show lone pairs) / Why = what the tapped atom
  is doing (groups, bonds, lone pairs, hybridization, the shape in words, Every angle measured, the lone-pair note),
  the molecule's note, build messages, the prediction verdict / Details = view options (style, view, spin, labels,
  lone pairs, zoom), Take this molecule to, Check yourself, Keep going. The readout is redrawn only when the atom or
  molecule changes, so "Every angle, measured" no longer snaps shut while the model rocks.
- **Conformation lab**: stage = the Newman projection over its energy curve (Chairs: both chairs, their shares, over
  the strain meter) / dock = Newman & torsion, Cyclohexane chairs; the angle slider with Eclipsed, Gauche, Anti, the
  molecule chips with Build your own at the end (front and back selects open under them); Chairs: Explore or Find the
  stable chair, the ring chips, Flip the ring and Clear all (or the challenge's commit and Next ring) / Why = the
  reading (conformer, energy, the molecule's note, how the curve is drawn), what a chair costs (split, verdict, the
  strain term by term, every group axial or equatorial), the challenge verdict / Details = groups on C1 to C6 (the
  ring builder), Check yourself, Keep going.
- **Acid/base comparator**: stage = the two acids as cards (structure, formula, acidic proton, conjugate base, pKa ?
  until you call it, the winner outlined); Rank four: the pKa line over the four drawn cards (drag, tap to swap, or the
  arrows); Which proton: the molecule with tappable hydrogens / dock = Compare two, Rank four, Which proton?; Acid A vs
  Acid B and the two answer buttons; Put them on the pKa line and New set; the molecule, its sites and Try another /
  Why = the verdict and the factor walk (gap as a ratio, why the base is stable, the rules-disagree notes, the factor
  table), the rank gaps explained, the site order with reasons / Details = Check yourself, Keep going.
- **Spectroscopy lab**: stage = one spectrum at a time (Infrared, or the ¹H NMR beside its structure; tap a peak, a
  signal or an atom; band or shift as a readout pill); Identify it: both spectra with formula, DoU and signal count as
  pills; Reference: the band and zone charts (a reference view, scrolls inside the stage) / dock = Read a spectrum,
  Identify it, Reference; Infrared or ¹H NMR, compound chips, More compounds or draw your own (Predict your own
  builder); Choose from four or Draw it, New unknown; the formula box / Why = the tapped band or signal in words,
  Predicted-not-measured note, the unknown's answer peak by peak, the draw check, the DoU working / Details = every
  band and every signal as tables, degrees of unsaturation, the unknown's peak lists, Take this molecule to, Check
  yourself, Keep going. Fixed on the way: `?mode=puzzle` and `?mode=ref` links now open those modes.
