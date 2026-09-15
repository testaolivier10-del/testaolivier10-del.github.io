# Review tracker

Every item raised across four outside reviews, with its real status verified
against this repo rather than against what a review claimed.

Status: **done** · **open** · **not a defect** (verified, no change needed) ·
**needs a person** (cannot be settled from here)

Verified against `main` at the time of writing. Items move to **done** only
when the change is in the repo and the checks pass.

---

## Pending clinical review

Everything in this section is a clinical statement this repo now makes that a
credentialed reviewer should check. Nothing here is a guess — each follows the
national guidance named beside it — but none of it has been read by a
clinician, and that is the gap no amount of tooling closes.

| Change | Source followed | Where | Landed |
|---|---|---|---|
| Hypothermic arrest: standard defibrillation algorithm alongside active rewarming, replacing "shock once, wait until 30°C/86°F" | 2025 AHA | question 785 | Phase 1 |
| Field triage: red/yellow criteria replacing the four numbered steps; mechanism is a yellow consideration, not red | 2021 National Field Triage Guideline (ACS COT / NAEMSP) | questions 672, 843, 966 | Phase 1 |
| SN2 worked example moved to a secondary substrate; (R)→(S) inversion asserted for both cyanide and azide | Standard organic chemistry; priorities Br > ethyl > methyl > H, and both nucleophiles enter as priority 1 | `ochem/mechanisms/sn2.html` | Phase 1 |
| Sources now names 2025 AHA, NRP, Stop the Bleed and the 2021 Field Triage Guideline as the editions written against | — | `sources.html` | Phase 1 |

---

## Needs a person (cannot be resolved from here)

| Item | Why |
|---|---|
| Named clinical reviewer | The single highest-value item. Four reviews have now bottlenecked on it. |
| About section with a real name | Best done once a reviewer is named, so the two land together. Placeholder kept here deliberately. |
| Sound trainer: Hawaii COPD Coalition clips | Re-hosting permission is a question for the rights holder, not a code change. |
| Whether the state tests supine/seated spinal immobilization stations | Varies by state; needs the local office of EMS. |
| Whether drag-to-order items appear on the **EMT** cognitive exam | The 2024 technology-enhanced item changes are documented for AEMT and Paramedic. Could not confirm for EMT from here, so the claim is softened rather than asserted. |

---

## Phase 1 — Quick fixes — **complete**

| Item | Status |
|---|---|
| Body map iliac-crest entry reworded so it cannot read as binder placement | done |
| LICENSE file (CC BY-NC 4.0 content, MIT code, third-party noted) | done |
| SN2 page: (R)-2-bromobutane + cyanide/azide in DMSO, lone pairs, δ+/δ−, wedge/dash | done |
| Rename "Adaptive practice" → "Weak-spot practice" | done |
| Timed exam: exam-realistic mode (no Flag, no Previous), on by default | done |
| Dashboard: map 6 site domains to the Registry's 5 score-report areas | done |
| Sources: cite guideline editions explicitly | done |
| Field triage items 672, 843, 966 to the 2021 two-tier structure | done |
| Ochem scope wording — it is a two-semester sequence, not Organic Chemistry I | done |
| Hedged question 785 | done |
| Drag-to-order claim softened (could not confirm for the EMT exam) | done |
| Remove the "locked door with a doorbell" line on Privacy | done |

## Phase 2 — Clinical corrections

| Item | Status |
|---|---|
| Post-ROSC oxygen target 92–98% | open |
| Hypothermic arrest: standard defibrillation while rewarming | open |
| NEXUS: all five criteria | open |
| SUID: contradictory sentence | open |
| Hypoglycemia: one cutoff everywhere, note that protocols vary | open |
| Ch 21: CPR rate, depth, ratio, recoil, peds and infant numbers | open |
| Ch 21: "most reliable ROSC sign" wording | open |
| Pediatric AED statement | open |
| Anaphylaxis scenario: medical control must not be penalised | open |
| Chest pain scenario: PDE-5 inhibitors before nitro; 12-lead "if in scope" | open |
| Diabetic scenario: which medication (long-acting oral agents) | open |

## Phase 3 — Flow diagrams and reference content

| Item | Status |
|---|---|
| Branch arrows must not imply a wrong path (anaphylaxis, choking) | open |
| Branches readable on mobile | open |
| Primary assessment: AVPU; massive haemorrhage first in trauma | open |
| START: remove "Expectant", correct respiratory criteria, add reposition branch | open |
| Stroke: high-glucose branch, swallow check | open |
| CPR: remove "AED re-analysis prompts" endpoint; depth 2–2.4 in | open |
| Shock: branches must differ or merge | open |
| Anaphylaxis: hives alone must not qualify; transport earlier | open |
| Infant choking diagram | open |
| Mnemonics: BE-FAST, APGAR, PAT, SLUDGEM; fix RPM "expectant" | open |
| Skill sheets: spinal immobilisation stations; non-rebreather flow rate | open |
| Sound trainer: snoring, gurgling, diminished/absent; label heart sounds out of scope | open |
| SALT triage alongside START and JumpSTART | open |

## Phase 4 — New EMT content

| Item | Status |
|---|---|
| Pharmacology module (EMT formulary) | open |
| Reference cards: peds vitals, GCS, APGAR, PAT | open |
| Expand Airway, Ventilation & Oxygen, Vital Signs, Bleeding Control, Head/Neck/Spine | open |
| Figures in the notes (currently zero across 40 chapters) | open |
| More branching scenarios toward 25 | open |

## Phase 5 — Ochem

| Item | Status |
|---|---|
| Lessons, textbook and mechanisms readable without JavaScript | open |
| Missing mechanisms (check Grignard in carbonyl addition first) | open |
| Synthesis / reagent-roadmap tool and flashcard deck | open |
| Figures in the reaction-heavy sections | open |
| Skeletal structures after the foundations module | open |
| Cut repeated caption/callout/body explanations | open |
| Aldol "two carbons apart" wording | open |
| "Leads to" chip overflow; floating buttons covering content | open |

## Phase 6 — Answer-option rewrites

| Item | Status |
|---|---|
| Rewrite options flagged by the three tell checks, one domain per commit | open |

## Phase 7 — Trust and polish

| Item | Status |
|---|---|
| Terms of Use page with medical disclaimer, linked in every footer | open |
| FAQPage schema on exam-day; Course schema on both hubs | open |
| Homepage screenshots or GIFs | open |
| About section with name and reviewer | needs a person |

---

## Already settled

### Done in earlier pushes

Privacy page: the Google Fonts claim (fonts are self-hosted) and the sync
description (per-question records do sync). Exam-day malformed paragraph.
"Reactions" link label, fixed at source in `curriculum.js`. Seven molecules
redrawn with full methyls. SN2 step counter and the Below/Above slip. Step-rail
labels. Aniline nitration caveat. pKa table order. COPD oxygen settled across
notes and bank. Bleeding: tourniquet-first, elevation removed. Stroke and
motorcycle scenarios. Body map ribs and temporal bone. Seven wrong answer keys,
five clobbered option sets, eleven contradiction pairs, stale guidance (fall
height, burn cooling, newborn suctioning, CPR effectiveness, dialysis fistula),
scope framing on capnography and 12-lead items.

### Verified as **not a defect** — no change made or needed

| Claim | Finding |
|---|---|
| Pelvic binder taught at the iliac crest | False. That text is the anatomical location of the pelvis. `study-notes.html` already says greater trochanters. Phase 1 rewords it anyway so it cannot be misread. |
| Chapter 33 teaches the long backboard as default | False. It already teaches spinal motion restriction and calls the backboard a transport device. |
| Changelog is future-dated | False. UTC date, correct. |
| "58 lessons" contradicts "62 topics" | Both true and already distinguished: 58 lesson pages plus SN1/SN2/E1/E2 whose primary page is a mechanism walkthrough. `check-site.mjs` enforces it. |
| "Sign in to sync" overpromises | Backwards. Sync does carry per-question records; the privacy page was the inaccurate half, and was fixed. |
| Questions 2028/2029 share copied options | False positive of naive similarity. Two musculoskeletal definitions drawing on the same four terms, both correct. |
| Nav links to `/index.html` split search signals | Internal links are relative and canonicals handle it. Not worth the churn. |

### Deliberately not done

| Item | Why |
|---|---|
| Making the repo private | Would not protect the banks (the browser fetches them as plain JSON) and would unpublish the site on a free plan. A license is the real answer. |
| Removing the site's self-critical asides | The candour is what makes the honesty claims credible. Only the doorbell line goes, as a single joke too many on a page about deletion rights. |

---

## Automated checks now guarding these

`scripts/check-site.mjs`, run in CI on every push:

1. Local references resolve · 2. JSON parses · 3. Sitemap resolves ·
4. Lesson-concept map · 5. Answer tells: keyed position, option length,
true/false polarity, select-N key sets, **absolute words**, **hedge words**,
**trailing justification clauses** · 6. Advertised question counts ·
7. Sitemap completeness · 8. Advertised ochem counts · 9. Tool tiles ·
10. Unique question ids · 11. Error reporters load first ·
12. **Molecule valence** · 13. **Scenario graph** · 14. **Copied option sets**

Bold entries were added in response to these reviews. Each was verified by
reintroducing the defect it exists to catch.

The three wording-tell thresholds are set at the bank's measured state, not at
the target, following the convention already used for the ochem ceilings: they
stop the numbers getting worse while the editorial work in Phase 6 happens.
Lower them as that work lands. Never raise one.
