# Self-review: builder T1, Model Studio (`model-studio`)

Date 2026-11-09. Brief: `docs/aphug-briefs/t1.md` and `tools-common.md`.

## What was built

- `human-geography/data/tools/model-studio.json`: 21 contexts, one per CED-named model, each on its own topic so it
  unlocks with that topic: DTM, epidemiological transition (2.5), Malthus (2.6), Ravenstein (2.8), diffusion types
  (3.4), boundary types (4.4), von Thünen (5.8), bid-rent, Burgess, Hoyt, Harris and Ullman, galactic, Latin
  American, Southeast Asian, African (6.5), rank-size and primate city, gravity, central place (6.4), least cost
  (7.2), Rostow, Wallerstein with dependency theory and commodity dependence (7.5). Each has its claim, origin,
  assumptions, a model (rings, stages, tiers or free spots on a drawn figure), decoys with reasons, an explanation
  per place, an apply case and limits (real limits, claims, misreadings, each with why). Author names not in the
  CED (Griffin and Ford, McGee, de Blij, Weber) are `aside` lines only.
- `human-geography/assets/tools/math/model-studio.js` (`ApHugMath.modelStudio`): the problem generator (build step,
  one or two apply steps, limits step), 13 drawn figures (shapes only; every number and word is HTML over or under
  the picture), `overlaps(fig, px)` for label collisions, generated models for rank-size and gravity, and the apply
  kinds: authored cases (with real-place maps for Burgess, boundaries, von Thünen; invented Country A maps for
  diffusion), DTM rates with RNI, epidemiological table, Malthus plot, Ravenstein bars, bid-rent lines, central
  place threshold, rank-size or primate, gravity index, least cost shipping, world-system table. Every number comes
  from `ApHugCalc`; every case is invented and labeled, or a real place with a date (Chicago 1920s, Berlin Wall
  1961-1989, 49th parallel, von Thünen's estate 1820s).
- `human-geography/assets/tools/model-studio.js` + `.css`: Explore ("See it": the model on the stage, Next place
  reveals one place at a time with why; "Build it": tap or drag, Check names the first slip and colors the badges;
  Why: claim, origin, assumptions, where it fails; Details: every place) and Test yourself (`ApHugTools.drill`, the
  stage shows each step's own figure, worked solution in Why). Premium: Explore is free for every model; the drills
  free are the free topic 2.5 (DTM and epidemiological); other drills are left out for a locked user, with the gate
  in Explore and in More options.
- `scripts/lib/aphug-tool-checks/model-studio.mjs` (validator, 300 seeds per model, every key recomputed with its own
  thresholds and arithmetic), `scripts/test/aphug-tool-model-studio.test.mjs` (6 tests, planted mistakes), cover
  `assets/covers/tools/aphug/model-studio.svg` and its entry (first) in `index.json`. `pages.json` entry unchanged.

## What was tested

- `node --test scripts/test/aphug-*.test.mjs`: 125 pass. `check-aphug-content.mjs`: tools 0 failing.
- Scratch build (`APHUG_DATA` = fixture + this tool, all chapters published, `--out /tmp/hug-t1/site`), served on
  8821, Playwright at 360 and 1280, light and dark: Explore (see it, build and check), the quiz on a map case, a
  plot case, a table case and a numeric step, the worked solution, and a stubbed locked user. No console errors
  (only the sandbox's blocked external requests). Every figure's spots and labels checked at 330, 360, 600, 900 px.

## Requests for the lead (shared files; worked around locally)

1. `hug-tools.js` drill(): the model step calls `ApHugModel.mount(..., { onChange: ... fb.innerHTML ... })` before
   `var fb` is assigned, and mount paints (calls onChange) at once, so EVERY model drill step throws. Fix: move
   `var fb = el.querySelector('.cd-fb')...` above the `mctl` line, or guard `if(!done && fb)`. Model Studio wraps
   `ApHugModel.mount` on its own page until then.
2. Tool pages do not load `hug-map.js` (`toolShell` extra list): add `'hug-map.js'` next to `'hug-model.js'` in the
   `hug-questions.js` expansion (`scripts/lib/aphug-build.mjs` line ~402) or in `toolShell`'s `extra`. Model Studio
   loads it on demand.
3. `ApHugModel.html` for a `free` layout puts each slot (name plus a 44 px button) absolutely over the figure: at
   360 px they overlap. Proposal: draw numbered badges at the slot boxes on the figure and list the places below it
   (as the other layouts do); and drill() should pass the step's figure (`s.figureHtml`) to `ApHugModel.html`.
   Model Studio overrides this in `model-studio.css` (scoped by `body.ms-page`) and draws its figures on the stage.
4. `hug-tool-math.js` `diagnose`: the sign message says "Below the mean, a z score is negative" (Psychology
   leftover). Use "The size is right but the sign is wrong." Model Studio adds its own sign mistake.
5. drill(): accept a label for the "Any kind" option of the kind picker (here it should read "Any model").
6. Optional `ApHugModel`: interchangeable slots (a `group` whose pieces may go in any of its slots) would let
   centripetal and centrifugal forces be sorted; and a sticky piece tray on phones (the tray sits below the places).

## Open points

- Not modelled: environmental determinism and possibilism (Unit 1; spec puts Model Studio in Units 2-7),
  centripetal and centrifugal forces (needs request 6), complementarity and comparative advantage (no model to
  build). Dependency theory and commodity dependence are taught inside the world-system context.
- Accuracy for a reviewer: Ravenstein placed on topic 2.8 (framework.md lines 134 and 455); epidemiological stages
  as four (Omran's three plus a later fourth); Southeast Asian model wording "Western and immigrant commerce"
  (McGee's "alien commercial zone" renamed for neutrality); African model "market zone" as one of three centers;
  Hoyt "142 US cities, 1939"; the transition rate thresholds are `ApHugCalc.transitionStage`'s (ours).
- Free tier: `locked()` follows topic 2.5 being free, so the epidemiological drills are free too (spec says "the
  demographic transition drills"); say if only the DTM should be.
- The rank-size and gravity build steps use the shared tiers drawing; a drawn map of the town pairs would be better.
- The data file is written by a scratch script (`/tmp/hug-t1/src/make_data.py`); the JSON is the source.
