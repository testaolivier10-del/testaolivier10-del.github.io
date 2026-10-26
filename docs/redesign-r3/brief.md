# Round 3 mockup brief (read fully)
Olivier: the live redesign was "half assed": it kept old layouts with new paint. He wants every page redesigned again AS MOCKUPS FIRST, in the approved look, but "incorporate everything that already exists, so you aren't deleting anything".

Inputs
- Live code: /home/claude/testaolivier10-del.github.io on branch main (read only; never edit, commit or switch branches there).
- Approved look: the S mockups in design/project/ (S01..S22). Match their quality, tokens, top bar, tabs, footer, type, covers.
- Canvas skeleton rules: same .dc.html rules the S files follow (support.js head line, <x-dc>, <helmet>, data-dc-script, $preview, PAGE fluid with max-width, phone fixed 390).

Method, per page
1. Inventory what exists: serve the repo (`python3 -m http.server <your port>` from the repo dir, run_in_background; never pkill) and with Playwright (`createRequire('/tmp/x.js')('playwright')`, like /tmp/shot.mjs) dump every visible heading, section, card, button, link, form control, setting, toggle, tab, badge, banner and table, desktop and phone; then do the page's main interactions (start, answer, finish, flip, open menus/sheets) and dump again. Also grep the page's JS for states you can't reach (empty, returning visitor, premium locked, Beta notice, offline, errors, modals, keyboard shortcuts).
2. Write design/inventory/<board stem>.md: a checklist of EVERY item found (one line each), and for each where it lives in the mockup ("kept", "moved to <section>", "grouped into <section>", "shown in state panel"). Nothing may be "removed". If two items duplicate each other, keep both functions and say how they are merged.
3. Write design/project/<board stem>.dc.html: the full redesigned page in the approved look with every inventory item present, using real text from the page. Restructure freely (order, grouping, hierarchy, what leads) so it reads like the S mockups, not like the old page. Secondary states (empty, locked, modal, results) go as extra panels on the same board, labeled, or as a separate board if large.
Rules: no em dashes or hyphens as punctuation; scripts/site-rules/ copy rules; AP® + capitalized noun; no invented stats (user-specific numbers are labeled example data); no new features beyond what the S mockups introduced. Do not publish, do not touch canvas.json, do not render the mockups.
Reply with only: board files with w and h, inventory file paths, item counts per page, and anything you could not inventory.
