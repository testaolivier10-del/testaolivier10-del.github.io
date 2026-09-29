# Conventions
- Each script/module opens with a block comment explaining WHY (the problem, numbers, decision refs); keep that style when adding scripts. Comments are explanatory prose, not terse tags.
- Data-first: content lives in JSON/JS sources; pages are generated. Change source + rerun builder; commit generated output together.
- Question IDs are stable (see header of `scripts/build-question-bank.mjs`, `nremt/assets/question-ids.js`): never reorder/renumber banks; learners' saved progress keys on them.
- A&P: no concept used before the topic that teaches it (`docs/anp-dependency-map.json`); decisions numbered in `docs/anp-spec.md`.
- Ochem rewrites: audit in `docs/ochem-readability-audit.md`; figures in `scripts/ochem-figures/<topic>.mjs`.
- One design system `assets/theme.css`; do not fork per course.
- Changes visible to learners get a dated entry in `changelog.html`.
