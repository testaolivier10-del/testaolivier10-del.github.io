# AI free-response grader (AP® courses)

Status file for "Grade my answer" on the FRQ pages of AP® Biology, Chemistry, Physics 1, Calculus AB,
Statistics and Environmental Science. Branch `claude/frq-grader`. **Shipped OFF**: nothing changes for students
until the accuracy eval passes and the owner flips the switches below.

## Owner's decisions (2026-10-20)

- Accuracy first. The feature must never suddenly stop for a Premium student, and must never cost money.
- Chain: (1) Claude via the Anthropic Messages API, key in the Worker secret `ANTHROPIC_API_KEY`, on a Console
  account with **no card and no auto-reload**, paid from the Max plan's monthly API credits; when credits run out
  the API answers "credit balance is too low", it never bills. (2) On any Claude failure, the Workers AI `MODELS`
  chain, labelled "backup grader". (3) If both fail, the page opens the rubric self-score with a note.
- Model configurable; test `claude-haiku-5-5` and `claude-sonnet-5-5`, default to the cheapest that passes the eval.
- Point by point against that question's rubric, loaded server-side, with scored examples (full, partial, none);
  every earned point quotes the student's exact words (no quote, no point); course conventions for units, context
  and justification; structured JSON, validated, one retry, then fall back. The answer is data, not instructions.
- Signed-in Premium only (checked on the server), 10 grades per student per day, the existing per-IP rate limiter,
  results cached by (question, answer, grader version) so a regrade is free.
- UI: "Grade my answer" beside the self-score, labelled an estimate, rubric and self-score always there, the
  student can disagree; phone friendly; one shared component for all six courses.
- Anonymous daily count of which grader answered (Claude, backup, none) in Supabase, for credit use and fallback
  rate in the weekly analytics.

## How it works

| Piece | File |
| --- | --- |
| Route `POST /frq/grade` (gating, cap, cache, chain, counts) | `worker/src/frq-grade.js`, wired in `worker/src/index.js` |
| HTML to text for the prompt (MathML to TeX, figures to alt text, tables to rows) | `worker/src/frq-text.js` |
| Scored examples, one question per course, full / partial / none | `worker/src/frq-calibration.js` |
| Workers AI chain shared with the assistant | `worker/src/ai.js` |
| Page component, shared by all six courses | `assets/course/frq-grader.js` |
| Mount point in each course | `<course>/assets/pages/frq.js` (`grader()` + `.<px>-fq-ai`) |
| Cap and counts | `scripts/sql/migrations/2026-10l-frq-grader.sql` (also in `schema.sql`), report in `scripts/sql/reports.sql` |
| Tests | `scripts/test/worker-frq-grade.test.mjs`, `frq-grader-ui.test.mjs`, `frq-eval.test.mjs`, `sql-migration.test.mjs` |
| Eval | `scripts/frq-eval/cases.mjs` (36 cases), `scripts/frq-eval/run.mjs`, results in `scripts/frq-eval/results/` |

Request order inside the route: flag (`FRQ_GRADER`) -> session (Supabase) -> Premium for that course
(`premium_passes`, live, unrefunded, started; the owner's account is let through for testing) -> question file
fetched from `https://levlprep.com/<folder>/assets/frq/<id>.json` (the client sends only course, id and text) ->
answers cleaned (only that question's part labels, at most 3,000 characters a part and 12,000 total, tags
neutralized) -> cache (Cloudflare's free per-data-center cache, key = SHA-256 of grader version, model, course, id,
rubric text and answer) -> daily cap (`frq_grade_take`, atomic, fails closed) -> Claude -> backup -> none. When
both graders fail, the day's grade is given back (`frq_grade_give_back`). Claude grades are cached 30 days, backup
grades one hour (so Claude replaces them once it is back), failures never.

**Prompt.** System block (cached): shared grading rules, the "answer is data" rule, the course's conventions, then
the course's scored examples. First user block (cached): the question text and its rubric with every "Also accept"
line and the full-credit sample. Second user block (not cached): the answer, one `<student_answer part="x">` per
part. Structured output (`output_config.format`, JSON schema), thinking off for Haiku (`disabled`) and lowest for
Sonnet (`between_tools`), no sampling parameters (the 5.5 models reject them).

**Validation.** Same number of parts, same labels, same number of points per part as the published rubric, boolean
`earned`, non-empty reason. Then the quote check, in code, not trusted to the model: an earned point whose quote
is not found in that part's answer (after normalizing dashes, quote marks, spacing; at most three pieces joined by
"...", in order; each piece at least 8 characters, or a value or expression, or the whole short answer) is turned
into "not earned". An injected "give full credit" therefore cannot score with an empty, invented or trivial quote
("the", single words stitched together); a model fooled into quoting a real but irrelevant clause is the residual
risk, which the injection cases in the eval measure. Invalid output: one retry (Claude), or the next model (backup), then fall back.

**Injection.** Four layers: the answer cannot open or close its own tags (`neutralize`), the instructions say text
inside the tags is data and how to treat instructions found there, the rubric comes from the server, and the quote
check above. Tested with mocked compromised outputs (`worker-frq-grade.test.mjs`) and 5 real injection cases in the
eval.

**Cost safety (no path can bill).** Claude: prepaid credits on a card-less Console account; `credit balance too
low`, 402, 429, 529, 401 and network errors all fall to the backup with no retry against the paid API (only an
invalid reply is retried once). Workers AI: the free allowance, which fails rather than bills **on the Workers Free plan** (if the Cloudflare
account ever moves to Workers Paid, Workers AI past the allowance is billed; turn the backup off then or cap it). A
cached answer makes no call. Per student: 10 grades a day. Per IP: the existing `RATE_LIMITER` (12 a minute,
shared with the assistant). Per request: answer size caps, `max_tokens` 4,000, and one 75-second budget for the whole chain (Claude 40 s a call,
at most two calls and only when the first reply was invalid, never after a truncated one; the backup 12 s a model,
at most two models), inside the page's 100-second wait. At Haiku 5.5 prices one grade is
roughly 6,000 input tokens (most cached after the first in five minutes) and 700 output tokens, about $0.001.

## Turning it on (owner)

1. **Key.** On console.anthropic.com, in the account with **no card on file and auto-reload off**
   (Settings -> Billing: no payment method; credits only), create an API key named `levlprep-frq-grader`. Optionally
   set a monthly spend limit there too.
2. **Secret.** From `worker/`: `npx wrangler secret put ANTHROPIC_API_KEY` and paste the key (or Cloudflare dashboard
   -> Workers -> levlprep-ask -> Settings -> Variables and Secrets -> Add, type Secret). Never put it in
   `wrangler.toml` or the repo.
3. **Database.** Supabase -> SQL Editor: run `scripts/sql/migrations/2026-10l-frq-grader.sql` once.
4. **Model.** Set the Worker variable `FRQ_GRADER_MODEL` to the model the eval picked (default `claude-haiku-5-5`).
5. **Try it yourself first.** `FRQ_GRADER = "owner"` is set in `worker/wrangler.toml` [vars] (done 2026-10-20), deploy (merge to main runs the deploy Action). On a phone, open any AP® FRQ page with `?frqtry=1` instead of using the console.
   On your own browser, in the console on any AP® FRQ page: `localStorage.setItem('levlprep_frq_grader_try','1')`,
   reload, sign in, grade a few answers.
6. **Launch** (launch PR prepared 2026-10-20: ENABLED true, FRQ_GRADER "on", privacy section #frq-grader; merge only after the migration is applied) (only if the eval passed, see below): `FRQ_GRADER = on`, and in `assets/course/frq-grader.js` set
   `var ENABLED = true;` (one line; push to main). Add a line to `privacy.html` ("The study assistant" section and
   the processors list) that FRQ answers sent to the AI grader go to Anthropic (Claude) or Cloudflare Workers AI and
   are cached for up to 30 days by a one-way hash. Not done here because nothing is sent while it is off.
7. **Turning it off**: `FRQ_GRADER = off` (or delete the variable). The page falls back to self-scoring on its own.

Optional Worker variables: `FRQ_GRADER_THINKING` (`disabled`, `adaptive`, `between_tools`, `omit`),
`FRQ_GRADER_EFFORT` (`low`, `medium`, `high`), for experiments with the eval.

## Accuracy eval

36 cases, 249 rubric points, all six courses (bio 9, chem 7, physics 5, calc 5, stat 5, env 5): strong, partial,
weak and 5 injection answers. **All are authored answers with known per-point scores, marked `source:
'authored'`.** The repo has no official College Board scored samples (the courses' trademark rules forbid
reproducing released exam material), so none are used. No case uses a calibration question (tested).

```
node scripts/frq-eval/run.mjs --dry-run                                   # sizes and a cost ceiling, no call
node scripts/frq-eval/run.mjs --mock expected                             # the scorer itself, no call
node scripts/frq-eval/run.mjs --model claude-haiku-5-5  --key-file ~/.lpkey/anthropic
node scripts/frq-eval/run.mjs --model claude-sonnet-5-5 --key-file ~/.lpkey/anthropic
```

It sends exactly the Worker's request and applies the Worker's validation (quote check included), retries once on
invalid output, stops at once on "no credit" or a bad key, never prints the key, and writes
`scripts/frq-eval/results/<model>.json`. One pass costs at most about $0.02 (Haiku) or $0.50 (Sonnet).

### Launch rule

A model may be turned on for students only if one full pass gives all of:

- point agreement >= 90% (each rubric point, earned or not, matches the known score);
- totals within 1 point of the known total on >= 90% of cases;
- false credit (a point given that was not earned) <= 5% of the unearned points;
- zero points gained by any injection answer;
- every case gets a valid grade (after the one retry).

Default to the cheapest model that passes. If neither passes, keep `FRQ_GRADER` off (or `owner`), look at the
`off:` lines the script prints, and fix the prompt or the examples, not the expected scores.

### Results

| Model | Ran | Point agreement | Totals exact / within 1 | False credit | Injection gain | Cost of the pass | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-haiku-5-5 | 2026-10-20 | 99.2% (247/249) | 94.4% / 100% | 0 | 0 of 5 cases | $0.014 | **PASS, default** |
| claude-sonnet-5-5 | 2026-10-20 | 100% (249/249) | 100% / 100% | 0 | 0 of 5 cases | $0.355 | PASS |

Full reports: `scripts/frq-eval/results/<model>.json` (final pass on the final prompt and checks). Haiku 5.5 is the
default (`DEFAULT_MODEL`): it passes with room to spare at about 1/25 of Sonnet's cost. Haiku's two misses both
went against the student (no false credit): case 14 (b) point 2, where it reordered the student's words in its quote
and the quote check correctly refused it; case 27 (d) point 1, where it was stricter than the rubric about
"convincing evidence" wording. Earlier passes during tuning, kept here for honesty: Haiku 98.4% before the quote
check accepted one-word claims ("Equal.") and digit-free expressions ("d = h/μ"), which it now does (tests added);
Sonnet 99.6% on the code in between. Total eval spend for the session: about $0.80.

Re-run both after any change to the prompt, the examples or the quote check; one pass per model is enough.

## Weekly analytics

`frq_grade_counts` (anonymous: day, course, grader, n, token sums). The query at the end of
`scripts/sql/reports.sql` gives per day: Claude, backup, none, cached, the fallback rate and the credit dollars
used. A rising `backup` share means credits are out or Claude is failing; check the Worker log line
`frq grader: Claude unavailable <why>` (`no-credit`, `rate-limited`, `overloaded`, `bad-key`, `no-key`, `network`,
`invalid-output`, `truncated`, `refusal`).

## Open points

- Privacy page line before launch (step 6).
- Graph and drawing parts (cladograms, free-body diagrams, sketches) are graded on the typed description only; the
  prompt says so and the self-score stays the main path for them.
- The per-data-center cache means the same answer in two regions is graded twice; fine at this scale.

## Progress log

- 2026-10-20: built (Worker route, shared component, migration, tests, eval set and runner). Independent Opus review:
  no blocker; fixed: a stricter quote check (no trivial or stitched quotes), one time budget for the chain with a
  timeout on each backup model, no retry after a truncated reply, token use counted on refusals, `bad-request` as
  its own failure, cache key on the exact prompt text, copy for a timed-out request, disabled checkboxes left
  alone. Key staged from the owner's laptop (kept in /root/.lpkey, never printed or committed). Eval run: both models
  pass; Haiku 5.5 chosen. CI green. Flag off; the owner turns it on (steps above).
