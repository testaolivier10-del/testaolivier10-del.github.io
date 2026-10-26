# Quick answers on notes pages

Status file for the "Quick answer" box. Read this, not the chat history. Branch `claude/site-improvements-1025`.

## Why

In the week to 2026-10-25, ChatGPT was the largest named source of real visits (22), ahead of Bing (12, which
ChatGPT's search draws on), YouTube (10) and Google (5). Search engines and AI assistants quote a short, direct
answer to the question a student typed. Notes pages open with a story or a lead, which reads well but is not
that answer. The box gives it in two or three sentences, right under the page header.

## How it works

| Piece | Where |
|---|---|
| The data: page path, the question, the answer | `docs/quick-answers.json` |
| Markup, placement, validation | `scripts/lib/quick-answers.mjs` (`applyQuickAnswer`, `validateQuickAnswers`) |
| Written and checked by every builder | through `applyVideo()` in `scripts/lib/videos.mjs`, so the course builders, both notes generators and `build-videos.mjs --check` handle it with no change of their own |
| Look (course colour, both themes, print) | `assets/quick-answer.css` |
| Tests | `scripts/test/quick-answers.test.mjs` |

The box sits directly after the notes page header, above the video block when there is one. It uses
paragraphs, not headings, so the page outline ("On this page") is unchanged. The course textbooks read only the
prose, so the box never appears inside a book.

## Rules for writing one

- Notes pages only. One per page.
- `q`: the question a student would type into Google or ChatGPT, ending with "?", at most 120 characters.
- `a`: two or three sentences, at most 420 characters; the first sentence alone must answer the question.
- Only facts, numbers and terms the page itself states. Nothing added, even if true.
- Plain text. No em or en dashes, no hyphen used as punctuation, no exclamation marks.
- A&P and ochem answers get an accuracy check against the page before merging (CLAUDE.md).
- After editing the data: `node scripts/build-videos.mjs` (writes the pages), then the course's own `--check`.

## Which pages

The first 20 (2026-10-25) are the notes pages people came back to on the most separate days in the 28 days
before (Supabase `page_views`, automation days left out). Add more where Search Console or Bing shows
impressions, starting with pages in positions 4 to 20.

## Progress log

- 2026-10-25: built; 20 answers written from page text and checked for accuracy against each page.
