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
