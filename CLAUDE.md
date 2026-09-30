# Notes for Claude sessions

## Anatomy & Physiology course

`docs/anp-spec.md` is the source of truth for the A&P course. Before doing any
A&P work, read it in full. When the plan changes, update that file in the same
commit as the change. `docs/anp-dependency-map.json` is the Phase 0 concept map
the ordering build check reads; `docs/anp-phase0.md` explains it.
`docs/anp-phase1-report.md` is the Phase 1 pilot report; `docs/anp-phase3-report.md` reports
the finished course (Phases 2 and 3).
`docs/anp-needs-author.md` holds open questions and contested science for human
review; add to it instead of guessing.

## Ochem readability and diagram pass

`docs/ochem-readability-audit.md` lists every notes and lesson page's findings, worst first, and
`docs/ochem-phase1-report.md` reports the first rewrites. Open points for a person go in
`docs/ochem-needs-author.md`. Figures for a rewritten topic live in `scripts/ochem-figures/<topic>.mjs`
and can also appear in its lesson (see the header of `scripts/build-ochem-figures.mjs`).

## Usage rules (save tokens, keep quality)

Quality wins: if a rule would hurt quality on a task, follow quality and say why in one line.

Context
- Context size is the main cost; keep it small.
- For big multi-step jobs, keep one plan/status file per project under `docs/` (like the `anp-*` files), so a fresh
  session can continue without the history. Commit and push it: the cloud container is temporary.
- Put what later work needs to know in that file and read it instead of reopening finished work.
- When a task is finished or context looks large, suggest /compact or /clear.

Reading
- Don't reread a file unless it changed or the context was compacted.
- Read only what you need: search first, then use offset/limit. Never read question bank or lesson JSON files in
  full; search them.
- Use Serena's symbol tools for code lookups when it's connected; otherwise grep plus targeted reads.

Agents
- Use helpers only for big or parallel work. Strongest model for writing, reasoning and accuracy checks; cheaper
  models for mechanical checks.
- Keep briefs short and point to files by path instead of pasting content. Send small fixes back to the same agent.
- One review pass with a clear checklist; add another only if serious problems turn up. A&P and ochem science
  content always gets an accuracy check.

Working style
- Batch related changes into one pass.
- For large or risky changes, propose a short plan and wait for OK.
- Keep replies short; no recaps.
