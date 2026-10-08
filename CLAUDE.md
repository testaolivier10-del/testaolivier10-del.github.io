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

## AP® Biology course

`docs/apbio-spec.md` is the source of truth (owner brief, phase status, decisions, launch checklist); read it
before AP® Biology work and update it in the same commit. Formats: `docs/apbio-architecture.md`; writing rules:
`docs/apbio-authoring-guide.md`; contested science: `docs/apbio-needs-author.md`; reviews: `docs/apbio-reviews/`.

## AP® Chemistry course

`docs/apchem-spec.md` is the source of truth (research summary, positioning, continuity rules, build plan, decisions);
read it before AP® Chemistry work and update it in the same commit. Research with sources: `docs/apchem-research/`.
Formats: `docs/apchem-architecture.md`; writing rules: `docs/apchem-authoring-guide.md`; map: `docs/apchem-phase0.md`;
contested science: `docs/apchem-needs-author.md`.

## Ochem readability and diagram pass

`docs/ochem-readability-audit.md` lists every notes and lesson page's findings, worst first, and
`docs/ochem-phase1-report.md` reports the first rewrites. Open points for a person go in
`docs/ochem-needs-author.md`. Figures for a rewritten topic live in `scripts/ochem-figures/<topic>.mjs`
and can also appear in its lesson (see the header of `scripts/build-ochem-figures.mjs`).

## Site audit follow-up (2026-10)

`docs/site-audit-followup.md` is the status file for fixing `docs/site-audit-2026-10.md`: owner checklist, decisions,
open items. Per-finding notes are in `docs/site-audit-notes/w1.md`–`w9.md`. `scripts/ci-local.sh` runs every CI job
locally (`BROWSER=1` adds the browser checks). New check-site rules go in `scripts/site-rules/`.

## Trust and conversion

`docs/trust-conversion-plan.md` is the status file (funnel numbers, owner facts for the About page, plan).

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
