# LevlPrep Site Audit, October 2026

Oct 1, 2026 · @Olivier

The science is strong (no wrong answer keys in about 2,100 questions read across three courses), so the biggest risks are elsewhere: the NREMT course is built on the exam outline the Registry retired on 7 April 2025, the site promises free teaching material that Premium now locks, Premium can be unlocked from the browser console, and two signed-in devices overwrite each other's progress.

## Fix first

Fourteen fixes, in order. The first five protect paying users and your credibility; most of the rest are an afternoon each.

| # | Fix | Why it matters | Effort | Status |
| --- | --- | --- | --- | --- |
| 1 | Re-align the NREMT course to the exam the Registry launched on 7 April 2025: five new domains (Scene Size-Up & Safety 15 to 19%, Primary Assessment 39 to 43%, Secondary Assessment 5 to 9%, Patient Treatment & Transport 20 to 24%, Operations 10 to 14%), new item types, re-weight `DOMAIN_TARGETS` in practice-engine.js. Until then, remove "the real domain mix" from exams.html, exam-day.html, sources.html and the hub. | You sell a Pass guarantee on a blueprint that no longer exists. | Large | To do |
| 2 | Make every "free" claim true. "The teaching material is free, permanently" (index.html, terms.html, sources.html), "Every lesson and notes page free" (A&P home), the four manifests, meta descriptions, and `isAccessibleForFree: true` on 279 lesson pages all contradict Premium locking interactive lessons. Say exactly what is free. | Consumer-protection and trust risk, and Google can treat the structured data as misleading. | Medium | To do |
| 3 | Stop the console unlock: premium.js trusts a cached `levlprep_premium_v1` when no user is loaded, and ships `_setLaunched` in production. Treat signed-out as not Premium and strip the test hooks now; later, serve Premium banks and lessons from the Worker after checking the pass. | Anyone can unlock Premium in one line, and the full banks are public files. | Large | To do |
| 4 | Fix `my_premium()` in schema.sql: it returns `max(expires_at)` and ignores `starts_at`, so buying two passes and refunding the first, or claiming the guarantee then refunding, gives up to 180 days for one payment (or none). | Direct revenue leak through the self-serve refund you just launched. | Small | To do |
| 5 | Fix cross-device sync in account.js: `push()` replaces each whole namespace with this browser's copy, and a pull only happens on a fresh sign-in. Merge per key on push, and pull on every load and tab focus. | A phone and a laptop both signed in overwrite each other's progress every 30 seconds. | Medium | To do |
| 6 | Fix A&P course search: site-chrome.js sets `window.LevlSearch` first, so anatomy-physiology/assets/apps/search.js never loads the real engine and every query fails with "The search engine did not load." Rename one global. | Search is broken on learn.html and all 27 A&P chapter pages. | Small | To do |
| 7 | Rewrite the NREMT study-notes field triage section to the 2021 National Guideline for the Field Triage of Injured Patients (red and yellow criteria). It still teaches the 2011 scheme (GCS under 14, physiologic then anatomic then mechanism). | Outdated clinical teaching; your own bank item #966 already uses 2021. | Small | To do |
| 8 | Fix the reminder email unsubscribe link: it points at `levlprep.com/api/unsubscribe`, which is GitHub Pages and returns 404. Add a separate `API_URL` for the Worker. | CAN-SPAM and Gmail bulk-sender rules, on the same domain that sends password resets. | Small | To do |
| 9 | Lock down the live database: Supabase grants EXECUTE to `anon` and `authenticated` directly, so `revoke ... from public` removes nothing. Revoke per function, and allowlist push hosts plus clamp `next_send_at` in `save_push_subscription`. | Anyone can call every function, and junk push rows can starve the reminder cron. | Small | To do |
| 10 | Correct the wrong numbers and dates: "3,795-question bank" in the purchase dialog (real: 3,635), "Sixty-two interactive topics" on 404.html (121), "14-module Organic Chemistry I" in ochem/manifest.json (23 chapters), A&P described as unfinished Beta in sources.html, and "Last updated 2 October 2026" on terms and privacy. | Wrong facts on the page people pay from. | Small | To do |
| 11 | Fix OpenStax attribution: copy each figure's third-party photo credit (for example Fig 15.15's Wikimedia credit), name the authors and Rice University on credits.html, and mark masked figures "adapted: labels hidden". Bring back a Beta or "not yet instructor-reviewed" note on A&P. | CC BY 4.0 compliance; about 100 contested items are still pending review. | Small | To do |
| 12 | Unblock keyboard and screen-reader users: the ochem atomic-structure "Build a neutral nitrogen atom" step is mouse-only and blocks the lesson; the closed mobile More sheet still takes focus; the tutor panel has no dialog role and drops focus. | A student who can't use a mouse cannot finish lesson 1. | Medium | To do |
| 13 | Add a /premium pricing page (free vs Premium per course, prices, refund rule, guarantee conditions) and cut the 66-word hero to one sentence plus a primary "Start a free practice test" button. | Prices live only in a modal and an 11-line paragraph on phones. | Medium | To do |
| 14 | NREMT drills: give feedback after each answer in untimed practice, rename "Exit exam"/"Submit Now", and make the free daily goal 15 so it matches the 15-question free quota (it is 20 today, so free users can never hit it). | The flagship mode teaches less than the other two courses. | Medium | To do |

## NREMT course

The bank is clinically solid: 2 wrong keys in a random 413-item sample (0.5%), the 2025 AHA choking and infant CPR changes are already applied, and answer position is balanced (A 25.8%, B 26.4%, C 23.1%, D 24.6%). The gaps are the retired exam outline, outdated triage notes, and items easier than the real exam.

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Critical | exams.html, exam-day.html, nremt/index.html, sources.html, practice-engine.js:327 | Domains and weights follow the pre-April-2025 outline (Airway, Cardiac/Medical, Trauma, OB/Peds, Assessment, Operations); copy claims "the real domain mix". | Retag the bank to the 2025 domains and weights; mention the new item types (options tables, drag-and-drop). |
| High | study-notes.json, field triage | "Physiologic first, then anatomic, then MOI", GCS under 14, paralysis, pelvic fracture: the 2011 scheme. | Rewrite from the 2021 guideline: red criteria (motor GCS under 6, RR under 10 or over 29, SpO2 under 90%, SBP under 90 age 10 to 64 or under 110 age 65+, HR over SBP) and yellow criteria. |
| High | About 28 items (660, 1425, 1431, 1463, 1527, 1376, 70, 161, 350, 431 and more) | Distractors carry a clause admitting they are wrong, e.g. "a view that is not supported by current guidelines". | Delete the trailing clauses; they look like leftovers from the longest-option rebalance. |
| Medium | #1428 | Says the patient must be moved to a dry surface before shocking in a puddle. | AHA: dry the chest; move only if the patient is in water. |
| Medium | #390 | APGAR "guides the need for further intervention". | NRP says APGAR must not decide resuscitation; your #696 and notes already say so. |
| Medium | #846, #959 | START uses "Deceased or expectant (black)". | Use your own rule everywhere: Deceased (black); Expectant is a SALT category. |
| Medium | Easy and medium items | Absurd distractors ("Flip a coin", "Ordinary food digestion"); pure abbreviation items (ETA, LPM, HIPAA). | Rewrite as plausible near-misses so readiness isn't overstated. |
| Medium | About 30 groups, e.g. 121/456/641/1097, 35/484/1382/1383, 651/2083 | Functional duplicates; 651 and 2083 even key different aspirin doses (325 vs 160 to 325 mg). | Merge or turn into different scenarios. |
| Medium | dashboard | "Estimated pass probability" is a logistic curve centred on 72%, shown next to a pass guarantee. | Rename to "Readiness estimate" and say it isn't calibrated. |
| Medium | skillsheets.html | No point totals, time limits or critical criteria; tells students to search NREMT's site. | Link the current official sheets and list points, time and critical fails per station. |
| Low | #644, #720, #15 vs #17, #1083 | "10 to 12 per minute" vs "one breath every 6 seconds". | Use 1 every 6 s (AHA 2020 and 2025). |
| Low | #1330 | "Any fall in an older adult" as a triage criterion. | 2021: low-level fall with significant head impact, age 65+ or anticoagulated (yellow). |
| Low | #1382 explanation | "Two to two and a half inches". | 2 to 2.4 in (5 to 6 cm). |
| Low | #2087 vs #1910, #1509, #818 | Explanation says raise the legs; other items say leg elevation is no longer routine. | "Supine; leg elevation per protocol." |
| Low | #110, #721 | Pulse-site BP rule (80/70/60) taught as fact; #721 key disagrees with its own explanation. | Present as a rough, unreliable sign. |
| Low | #1410 | "Back-only placement does not create a path through the heart." | Anterior-posterior placement is an accepted AHA alternative. |
| Low | #454 vs #757; #533 vs mnemonics | Infant suction 5 s vs 10 s; infant leg 14% vs 13.5%. | Pick one value each (adult 15, child 10, infant 5 s). |
| Low | #2004 vs #250 | X-ABC vs airway-first framing with no cross-reference. | Pick one framing or explain both. |
| Low | #770, #922, #923 | #770 key mentions a dressing the stem never does; #922 puts scene safety in the primary assessment; #923 "OPQRST order" drops Quality. | Fix stems. |
| Low | Flowchart, spinal motion restriction | Leaves out patients who can't communicate and age 65+. | Add per the 2018 ACEP/ACS-COT/NAEMSP consensus. |
| Low | Bank | No item on starting CPR on a soft surface rather than delaying (2025), or delayed cord clamping of at least 60 s. | Add 1 to 2 items each. |
| Low | Select-N items | Always announce "(2)" or "(3)"; 57 of 65 have only 4 options. | Use 5 to 6 options like the real exam. |
| Low | practice-engine.js:1761 | With All Domains selected the banner says "Domain drill: EMS Operations". | Show "All domains". |
| Low | sound-trainer | Lung clips are hotlinked from Wikimedia, so the trainer breaks offline; rhonchi and normal breath sounds have no clip. | Self-host the CC BY-SA files with credit; fill the two gaps. |
| Nit | #801, #914 | Garbled: "tall peaked T waves reported from a monitor if available", "strictly supine times regardless". | Rewrite. |
| Nit | 36 items, notes, mnemonics footer | "EMT-B", "EMT-Basic", "detailed physical exam", "good time to slide in a backboard". | Use "EMT" and current terms. |
| Nit | #1399; #895 | Answer in the stem ("absorbed through the skin" keyed "Absorption"); #895 uses an IV as the EMT's example intervention, which is outside EMT scope. | Reword; use an EMT-scope intervention (e.g. a splint or oxygen). |
| Nit | Flowchart vs #467 | Infant liver "low and largely unprotected" vs "high". | Pick one. |

## Organic Chemistry course

No wrong answer keys in about 570 practice-bank questions read, and true/false is now balanced (48.7% True). The real errors sit in the interactive bank and the Spectroscopy Lab, and almost half the questions are filed under a fallback concept, which makes the "possible gap detected" feedback wrong about half the time.

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| High | interactive-bank.js, `sn1-cation-order` | Ranks the primary allyl cation above tert-butyl ("resonance beats substitution"). Your own carbocations notes say primary allylic is about as stable as secondary. | Order 3° > allylic ≈ 2° > 1°, or swap in a secondary allylic or benzylic cation; rewrite the hint. |
| High | interactive-bank.js, `challenge-multi-1` | Says the rearranged ether is "essentially racemic". 2-methoxy-2,3-dimethylbutane has no stereocentre. | "The stereocentre is destroyed; the product is achiral." |
| High | Concept tagging (concepts.js, legacy rules) | 1,508 of 3,154 questions (47.8%) fall back to the topic's default concept, e.g. an isotope question says "This question turns on valence electrons". All Diels-Alder, alcohol oxidation, aldehyde oxidation and naming questions fall back. The code comment claims rules cover 95%. | Write rules for the 47 worst topics, or hide the concept line when nothing matched. |
| Medium | interactive-bank.js, `ir-distinguish-pair` | "1715 plus a broad band near 3300" keyed as a carboxylic acid. | Acid O-H is a very broad 2500 to 3300 trough; say that. |
| Medium | spectra-predict.js \~418 | Splitting stops at sextet: 2-chloropropane CH shows "m" instead of a septet, isobutane CH "m" instead of a nonet. | Count n+1 up to n = 8; treat equivalent neighbours as one set. |
| Medium | spectra-predict.js, `carbonylKind` | Acetic anhydride shows one "ester C=O 1740"; your bank teaches two bands near 1820 and 1760. | Add an anhydride class. |
| Medium | spectra-predict.js 439 to 452 | All aromatic H merge into one "7.26 m", so a para ring can never show two doublets. | Keep AA'BB' as two 2H doublets, or say the merge hides it. |
| Medium | reaction-predictor.js, `mixture()` | 1-bromopropane + NaOEt shows SN2 65% / E2 35%; real is about 90:10. | Start primary substrates at 85 to 90% SN2. |
| Medium | Sequencing | Grignard reagents are taught in chapter 15 but used 18 times in chapter 12 notes and 14 times in chapter 14. | Move organometallic bonding and Grignards before chapter 12 (Klein, Wade and McMurry all do). |
| Medium | Sequencing | Aromatic Chemistry (17) comes after Carbonyl (12) and Enolates (16), though benzaldehyde and acetophenone appear throughout. | Move chapter 17 before 12; its prerequisites are only resonance, hybridization and addition. |
| Medium | Sequencing | Spectroscopy is chapter 20 of 23; most courses and labs teach IR and MS in Orgo I. | At least move IR and MS to just after Alkenes. |
| Medium | Coverage | Pericyclic chapter is only Diels-Alder; no electrocyclic, sigmatropic (Cope, Claisen) or cyclopropanation (carbenes, Simmons-Smith). | Add a short pericyclic section and a cyclopropanation row, or rename the chapter. |
| Medium | practice-bank.json | alcohol-reactions#7 and carbocations#26 are the same question on the same drawing. | Replace one. |
| Medium | ochem/index.html hero | "Perform the SN2 mechanism" sends free users straight into a Premium wall. | Point free users at a free mechanism or label it Premium. |
| Low | reaction-predictor.js | Neopentyl bromide "no reaction"; benzyl bromide + DBU "SN1" with no product; Zaitsev product of 2-bromobutane has no E/Z. | "Very slow, rearranges under forcing SN1"; drop DBU for that case; "(E)-but-2-ene major". |
| Low | spectra-predict.js `aromaticSet`; chem-core.js `formula()` | Exocyclic double bonds count toward aromaticity (quinones get ring current); m-xylene formula prints "C₆H₄CH₃₂" and its methyl signals vanish. | Require in-ring double bonds; expand condensed groups before counting. |
| Low | mass-spec#17 | Loss of 43 keyed only "isopropyl" while the explanation says C₃H₇ or CH₃CO. | Make the option say both. |
| Low | h-nmr#25 | Ranks a carbonyl CH₃ (about 2.1) below an aryl CH₃ (about 2.3); they overlap and acetophenone's is 2.6. | Use an ester CH₃ (about 2.0) instead. |
| Low | eas#16 | "The slow first step is pulled forward by fast rearomatization." | A fast later step doesn't speed a slow one; rate is set by arenium formation. |
| Low | michael-robinson#18 | Retrosynthesis key says reverse all three steps. | Undo the aldol condensation first, then the Michael. |
| Low | diels-alder#17, amino-acids#8, multistep-synthesis#13, conformational-analysis#19 | Endo rule overstated for any substituent; pI called "a property of the pH"; a free primary cation forms; ethyl vs methyl chair is a near tie. | Carbonyl substituent; pI is the molecule's; describe the AlCl₃ complex hydride shift; use isopropyl vs methyl. |
| Low | Glossary | "Allylic" says the carbon is sp³ then calls the cation resonance-stabilized; "energy diagram" says valleys are intermediates. | Reword both. |
| Low | About 31 stems | Meaningless outside their lesson in mixed practice: "Why is acid required?", "How many new sigma bonds form?" | Name the reaction in the stem. |
| Low | Notes | kJ/mol on kinetic-thermodynamic pages, kcal/mol in energy diagrams and the bank. | Pick one or always give both. |
| Low | mechanisms/e2.html | "Builds on: conformational analysis (anti-periplanar)" but that half was removed. | Point at Newman projections. |
| Low | Notes, chapters 4, 6, 10, 12 | Heavy forward vocabulary: enolate 8 to 9 times before chapter 16, NMR 8 times in prochirality. | Cut the asides to one line or move examples. |
| Low | 3D viewer, reaction predictor at 1440 px | Picker fills the first screen; select boxes cut off text. | Put the viewport beside the picker; widen selects. |
| Low | Glossary popups, learn.html sticky bar | Light popup card in dark mode; text shows through the sticky bar. | Theme the popup; give the bar a solid background. |
| Nit | Bank notation | 678 items write H2SO4, 267 use subscripts, 14 mix; charges as "RCOO^-"; "Huckel" vs "Hückel"; double spaces; ". ..". | One normalising script plus a lint rule. |

## Anatomy & Physiology course

The science is the cleanest of the three: no wrong keys or numbers in about 1,100 questions read, every blood gas and calculation rechecked, and nothing used before it is taught. The problems are a broken search box, attribution gaps, and labels that oversell.

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Critical | assets/apps/search.js vs site-chrome.js:150 | `window.LevlSearch` collision: every A&P course search fails with `S.tokenize is not a function`. Site-wide /search.html still works. | Rename one global; add a smoke test. |
| High | data/figures (e.g. ans-signaling.json, os-15-15) | OpenStax third-party photo credits dropped (Fig 15.15 belladonna is credited to Wikimedia contributors in OpenStax). At least 12 photos, micrographs and X-rays to check. | Copy each figure's own credit line and license; a CC BY-SA source also needs share-alike. |
| High | anatomy-physiology/index.html | "Every lesson and notes page free" and `isAccessibleForFree: true`, while 129 of 162 lessons and four tools are Premium. | "Every notes page free; Foundations lessons free"; fix the structured data. |
| High | All A&P pages | No Beta or review label, though docs/anp-needs-author.md lists about 100 pending items and no instructor review. | Restore a Beta badge or a "not yet reviewed by a licensed A&P instructor" note. |
| Medium | credits.html, captions | Authors and Rice University never named (zero mentions of Betts); 377 figures have labels masked without saying so. | "J. Gordon Betts et al., Anatomy and Physiology 2e, OpenStax, © Rice University, CC BY 4.0"; add "adapted: labels hidden". |
| Medium | anp-questions.js | Find-the-error items get shuffled, but 144 of 162 are ordered sequences, so the order they test is destroyed. | Don't shuffle that type. |
| Medium | Practice, Review, Exams | Download the whole bank first: 54 files, 4.2 MB, 80 requests; 24.9 s to settle on a slow phone. | Load an index, then the chosen chapter; fetch explanations after answering. |
| Medium | action-potential-basics-13, -14, -18 | Inactivated sodium channels called "closed", which the next topic defines as the ready state. | Say "inactivated (plugged by the inactivation gate)". |
| Low | excitation-contraction-13 | Lists "myosin heads pulling on actin" as directly using ATP. | "Splitting ATP to recock, binding ATP to detach." |
| Low | adrenal-glands-15, -19 | Cortisol keyed as what most directly supplies fasting glucose; DHEA and sex drive stated flatly. | Ask "which adrenal hormone"; hedge DHEA. |
| Low | Six cross-topic pairs (e.g. adrenal-immunity-8 / cell-mediated-immunity-17) | Real duplicates. | Vary or drop one of each. |
| Low | 4 stems (action-potential-basics-6 and others) | Start with an internal tag "Level 1." | Remove. |
| Low | Select-all and predict items | Select-all always has 2+ correct (61% of options correct on average); "no change" is right only 13% of the time; absolutes appear twice as often in distractors. | Rebalance so test-wise guessing doesn't pay. |
| Low | Bone tissue questions | "The calcium-raising hormone from the small glands behind the thyroid" appears 53 times. | Say PTH once it has been previewed. |
| Low | Dark mode course home | `.anp-feature p` contrast 3.7:1. | Lighten to pass 4.5:1. |
| Low | Notes tables | Wide tables can't be scrolled by keyboard. | `tabindex="0" role="region"` with a label on `.table-wrap`. |
| Low | Tools at 390 px | 12 to 25 chapter filter chips before any content. | Collapse into one filter control. |
| Low | Premium box | "One-time. No subscription." without the pass length. | Say 5 months or a year. |
| Low | Notes and glossary | No "Report a problem" link, only on questions. | Add one. |
| Nit | action-potential-2, innate-immunity-4, glucose-transport-maximum.svg | Peak at 1.5 vs 1.4 ms; set point 36.6 vs 37 °C; reabsorbed plus excreted doesn't equal filtered at 300 mg/dL. | Align. |
| Nit | OpenStax Fig 25.10, os-14-23 | OpenStax's own typo "conboluted" shows (and is accepted as an answer); homunculus label boxes overlap. | Overlay the label; tighten boxes. |
| Nit | Case names, glossary | "Okafor" used at 11 ages; `ovarian-cycle` is the only term missing roots and pronunciation; A to Z row cuts off at J on phones. | Vary names; fill the entry; add a scroll hint. |

## Free vs Premium, legal and trust

The site still talks like it did before 1 October. Pick one honest sentence about what is free and use it everywhere: the hub, manifests, meta tags, structured data, terms and the A&P home.

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| High | index.html:146, 205, 286; terms.html:70; sources.html; changelog | "The teaching material is free, permanently" vs premium.js locking "Every interactive lesson and mechanism walkthrough" (ochem) and "Every interactive lesson" (A&P). | "All notes free forever; interactive lessons free for the first chapters." Or stop gating lessons. |
| High | terms.html:106, premium.js:68 | "Pass guarantee" is really a 90-day extension with conditions (2 timed exams, legal name, 30-day window). | Rename ("Pass-or-extend") and show the conditions inside the purchase dialog. |
| High | Business model | The full banks and answer keys are public static files and the content license (CC BY-NC 4.0) lets anyone republish them non-commercially. | Decide: serve Premium banks from the Worker, and consider all-rights-reserved for the banks only. |
| High | sources.html, nremt exams | No clinician has reviewed the NREMT bank, stated honestly, but next to a paid guarantee. | Recruit one paramedic or EMS instructor reviewer before promoting the guarantee. |
| High | terms.html:71, privacy.html:71, changelog.html:62 | "Last updated 2 October 2026" and "Premium is live 2 October"; privacy.html:141 says Premium went on sale 1 October. | Use 1 October everywhere. |
| Medium | privacy.html:80 | "No account is needed to use any feature on this site." Premium checkout needs one. | "...any free feature." |
| Medium | privacy.html:188 | AI tutor section says it sends "your question, plus the passages" and reads as opt-in; it also sends the last 4 turns and the course, and is on by default. | Say so and name Cloudflare Workers AI as processor. |
| Medium | privacy.html | Question reports (optional free text up to 1,000 characters) are referenced but never described; jsDelivr is said to serve only Supabase, but Polar checkout loads from it too. | Add both. |
| Medium | terms.html | Founding-member free month never defined; no copyright/takedown contact. | One sentence each. |
| Medium | og-image.png | "Real question banks... honest practice conditions" next to NREMT branding reads as real exam questions. | "Original practice questions". |
| Low | terms.html:104 | Under-18 buyers with parental permission may conflict with Polar's buyer terms. | Check Polar's age rule and match it. |
| Low | privacy.html:152, sources.html:92 | "This paragraph has been wrong twice and been corrected twice." | Move history to the changelog; legal pages should read settled. |
| Low | privacy.html:80 | Lists "your study plan", a page that now redirects. | Remove. |
| Low | Every legal page, worker hostname | Contact is a personal Gmail; Worker is `testaolivier10.workers.dev`. | hello@levlprep.com via Cloudflare Email Routing (free) and api.levlprep.com. |
| Low | docs/premium.md | Open items: no postal address in reminder emails (CAN-SPAM), no Minnesota assumed-name filing. | Use a PO box or virtual address; file the assumed name. |
| Low | Naming | Assistant is "the robot in the corner" (privacy), "the assistant in the corner" (sources), mascot (README). | Pick one name. |

## Payments, security and data

The Polar webhook itself is well built (signature checked in constant time, replays idempotent). The weak points are what happens after: entitlement decided in the browser, a database that grants more than schema.sql says, and sync that loses progress. No secrets are committed; no DOM XSS fired on 28 pages tested with 11 payloads.

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| High | premium.js:163 to 174, 779 | Cached pass trusted when no user is loaded; `_setLaunched(false)` ships in production; quotas and the free exam are localStorage counters. | Signed out means no Premium; strip `_` hooks; clear the cache when `my_premium` is empty. |
| High | schema.sql:583 to 596; worker premium.js:223 | `my_premium` ignores `starts_at`; refunds mark only the refunded order. Two passes plus one refund, or guarantee plus refund, gives up to 180 days. | Count only `starts_at <= now()`, re-chain queued passes after a refund, and revoke a guarantee when its funding pass is refunded. |
| High | account.js:157 to 172, 1451 | `push()` replaces whole namespaces; pull runs only on a fresh sign-in. | Merge per key on push, pull on load and visibility change, check `updated_at` before writing. |
| High | Live Supabase grants | Every function is executable by `anon` and `authenticated`, including ones the file calls Worker-only. | `revoke execute ... from anon, authenticated` per function, plus default privileges. |
| High | schema.sql:274 to 323; reminders.js:117 to 151 | Anyone can insert push subscriptions with any https URL and `next_send_at` 1970; failed sends retry first forever. | Allowlist push hosts, clamp the date, delete after N failures, add fetch timeouts. |
| High | email.js:54; worker README | Unsubscribe link and `List-Unsubscribe` header go to a 404 on GitHub Pages. | Separate `API_URL` (ideally api.levlprep.com). |
| Medium | worker premium.js:235 to 240 | Once-per-email refund and guarantee key ignores `+tag` and Gmail dots. | Normalise addresses; also key on Polar's customer id. |
| Medium | worker premium.js:299, 309 to 315 | Guarantee's "2 full timed exams" is read from progress the user can write. | Record exam completions with a server-stamped RPC, or treat the rule as advisory. |
| Medium | worker premium.js:472 to 486 | Read-then-insert of pass start is not atomic; webhook plus reconcile can overlap passes. | One Postgres function under an advisory lock. |
| Medium | worker premium.js:165 | Refund window measured from row insert, not Polar's order time (reconcile can be 48 h late). | Store and use the order's `created_at`. |
| Medium | worker premium.js:578 to 590 | Pass-ending email ("a pass you bought is ending") goes to free founding grants too, in about 27 days. | Filter on `order_id is not null` or change the copy. |
| Medium | wrangler.toml:29 | `[vars]` without `keep_vars = true`; the next `wrangler deploy` can wipe `POLAR_PRODUCTS` and the founding discount set in the dashboard. | Add `keep_vars = true` or put the product ids in the toml. |
| Medium | email.js:95 | A 400 or 422 from Resend deletes the reminder row; one typo in `REMINDER_FROM` would delete every opt-in. | Only treat recipient-specific errors as gone. |
| Medium | email.js:55, sw.js:304 | Email CTA and notification URLs accept any user-supplied URL. | Same-origin paths only. |
| Medium | worker index.js:215 | Origin header is the only gate on the AI endpoint; dashboard-pasted deploys have no rate limiter. `/reminders/text` and `/api/unsubscribe` are unthrottled. | Deploy with wrangler and the rate-limit binding; require a Turnstile or Supabase token for AI. |
| Medium | All pages' CSP | `script-src` allows all of cdn.jsdelivr.net; `connect-src` allows any `*.workers.dev`; no `form-action`; no frame protection on account and refund pages. | Pin exact file URLs and the one Worker host; put Cloudflare in front for real headers. |
| Medium | analytics.js:31 | Umami script loaded from a third party with no SRI, on pages that hold the session token. | Self-host a pinned copy. |
| Medium | email.js:131 to 153 | One-click unsubscribe deletes on GET; mail scanners will silently unsubscribe people. | Confirm on GET, delete on POST. |
| Medium | sw.js:238 to 251, 196 to 202 | Static cache is cache-first and never versioned, so replaced images and figures never refresh; network-first has no timeout on weak wifi. | Stale-while-revalidate or hashed names; 3 to 4 s timeout fallback. |
| Low | Anon RPCs (`track_pageview`, `report_question` and others) | No throttle; any path accepted (662 distinct already). | Whitelist paths, cap rows per day. |
| Low | Supabase Auth | Leaked password protection is off. | Turn it on. |
| Low | worker index.js:35 to 40, 306 | Localhost origins allowed in production; raw error strings returned to the browser. | Env-gate localhost; return a generic message. |
| Low | reminders.js:165, email.js:210 | Next send computed after sending, so reminders drift 15 minutes later each day. | Add 24 h to the scheduled time, not now. |
| Low | sw.js:156 to 174, 242, 310 | One missing precache URL fails install forever; 206 responses passed to `cache.put`; notification click matches every tab; no "new version" toast. | `cache:'reload'`, status 200 only, exact path match, a controllerchange toast. |
| Low | user\_progress, page\_views | DDL and RLS not in the repo; no size limit on progress JSON; pageviews.sql queries `count` but the column is `views`. | Commit them; add a size check; fix the column. |
| Low | worker premium.js:218, 532, 744 | Ambiguous refund timeouts release the lock; `checkout-paid` funnel step counted from the browser; disputes listed with no date window. | Keep the lock on 5xx; count in the webhook; add a window. |
| Nit | account.js:171, premium.js:206 | Sync and refresh errors swallowed silently. | Report after N failures; show "last synced". |

## UX, design and accessibility

No uncaught JavaScript errors and no sideways scrolling on any page tested. The three courses feel like three apps (different quiz engines, goal models, rank names and headers), and a few accessibility gaps actually block people.

**Landing and navigation**

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| High | / hero | 66 to 90 word paragraph, no button; course cards fall below the fold at 390 px. Returning students still see it above their progress. | One sentence, a primary CTA, and a "Continue" card when progress exists. |
| High | Mobile "More" sheet | Closed sheet stays focusable off-screen; tutor and periodic-table buttons render above the open sheet. | `inert` and `aria-hidden` when closed; lower the FABs' z-index. |
| High | Mobile header | Brand, course, search, level, Log in, sound and theme on one 390 px row; buttons are 32 px. | Fold sound, theme and login into one menu; 44 px hit areas. |
| Medium | / course cards | NREMT and Ochem share the "+" icon; all three say "LIVE"; an "L1" badge greets brand-new visitors. | Distinct icons; replace "Live" with "Free to start" or price; hide the badge until XP > 0. |
| Medium | /nremt/#sample | Static sample with the answer pre-highlighted; anchor hides under the sticky header. | Make it interactive or label it; `scroll-margin-top`. |
| Medium | Course header | Back arrow and wordmark both go to the hub; on a lesson the arrow reads as "previous page". | Drop the arrow or make it history back. |
| Medium | "/" key and search.html | Navigates away and loses course chrome; theme toggle shows the text glyph ◑; placeholder truncates. | In-page overlay; reuse the SVG toggle; shorter placeholder. |
| Medium | Headers on hub, 404, search, terms | Each shows a different set of controls. | One shared header component. |
| Low | Breadcrumbs, H1s, 404, offline, footer | Only A&P has breadcrumbs; "Practice." vs "Practice"; 404 lacks search; offline lists 34 pages flat; footer has no Premium, Contact or Account links. | Make consistent; add those links. |

**In the courses**

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| High | NREMT drills | No feedback per question; "Exit exam" and two "Submit Now" buttons in practice; drill picker says 20 but runs 15. | Check step per question in untimed modes; "End session"; cap the picker at the quota. |
| High | NREMT home and review | "Continue, 15 due" leads to a Premium wall once the quota is spent; streak card says "Practice today to keep your streak alive" after it is earned. | Offer free notes when the quota is 0; "Streak safe for today". |
| High | Premium dialog "Get it" | Opens account creation saying "Free, and only so your progress survives a new phone. Everything on the site works without one." | "Create an account to attach your pass. You'll pay next." |
| High | /nremt/dashboard.html | Weak topics are "always free" in the dialog but the panel is gated; two identical upsell cards on one page. | Show the free readout; one upsell per screen. |
| High | Level-up toast | "Level 2 · Cell Scout. New rank unlocked" when level 1 is also Cell Scout; toast lands on the answer just given. | Say "new rank" only when it changes; anchor toasts under the header. |
| High | A&P lesson for free users | Paywall card first, free notes as a small link below. | Make "Read the free notes" the primary button. |
| Medium | Gamification | Confetti and +XP on single answers cover the explanation; rank names differ per surface; sounds on by default. | Confetti only on level-up and session end; label course ranks; sounds off until asked. |
| Medium | Cross-course | Three quiz engines, three daily-goal models (20/day, 5 rounds, 20/day). | One answer card component and one goal model. |
| Medium | Ochem lessons | Step list reads "Explain, Explain, Explain, Step 4"; chapter eyebrow twice on mobile; content starts about 450 px down; diagnostic labelled "Adaptive practice". | Use step titles; one eyebrow; collapse chips; label "Diagnostic". |
| Medium | A&P lessons | Completed steps are red filled circles (reads as error); Continue never gated while ochem gates it; "Partly right" for 1 of 6. | Checkmarks; one gating rule; "1 of 6 in place". |
| Medium | NREMT details | Multi-select counts as answered after 1 of 2 picks; results page has no next step or XP; domain pill low contrast. | Count at N picks; "Review your misses"; darken the pill text. |
| Medium | Tutor fallback with no AI | Answered "normal adult respiratory rate" with a toddler passage (RR 22 to 34). | Show labelled related pages only, or add a confidence threshold. |
| Low | Ochem, NREMT | Wrong slot still turns teal; exam-realistic mode on by default for the one free exam; floating buttons cover option text at 390 px. | Don't fill wrong slots; default it off; pad the options area. |

**Accessibility and visual**

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Critical | ochem/lessons/atomic-structure.html step 4 | SVG slots have no role or tabindex; keyboard users can't add electrons, so Continue stays disabled. Same for "click the atom" practice items. | Buttons with labels and Enter/Space; 44 px hit areas; a non-visual alternative. |
| High | Tutor panel | No dialog role, no live region; Esc drops focus to body. | Dialog semantics, `aria-live`, return focus. |
| High | NREMT drill start and Next | Focus goes to body, so screen readers miss the new question. | Focus the question heading. |
| High | Right/wrong feedback | Colour only on A&P and ochem options. | Visible check and cross icons plus text. |
| High | Dark mode | Ignores the OS setting everywhere (no `prefers-color-scheme`), while the Polar checkout does follow it. | Default from the media query when nothing is saved. |
| High | Layout shift on phones | CLS 1.01 on an A&P lesson, 0.77 ochem practice, 0.74 dashboard, 0.57 A&P learn (target under 0.1). | Reserve space for JS-rendered sections and quota cards. |
| Medium | axe, dark mode contrast | `.notes-fact` 2.42:1 on ochem learn; `.r-tag` 3.38:1 and `.lvl-ring` 3.78:1 on dashboards; feature cards 3.7:1. | Lighten (about #6fd39a, #c9d8d3). |
| Medium | Landmarks | Header isn't a landmark; footer inside main on 11 pages; ochem practice has no main at all. | `<header>`, footer outside main, add main. |
| Medium | Sign-in form | Password label wraps the Show button ("Password Show"); "notanemail" returns "Accounts are unavailable". | Move the button out; validate email first. |
| Medium | A&P options | `aria-pressed` toggles for single-choice questions. | Radio group like NREMT. |
| Medium | Dark mode visuals | Muddy brown A&P hero; dialog scrim too weak. | 6 to 8% tint; rgba(0,0,0,.6) scrim. |
| Low | Focus hidden by bottom nav | Tabbed elements land under the 64 px nav. | `scroll-padding-bottom: 80px`. |
| Low | Visual system | Monospace used inconsistently; flat vs clay cards; three arrow styles; emoji next to line icons; badge grid all identical locks. | Two elevation tokens, one icon set, show each badge greyed with progress. |

## SEO and marketing surface

Technical SEO is in good shape: across 688 public pages there are no missing, duplicate or overlong titles or descriptions, and canonicals are right. The gaps are paid content marked free, a broken A&P share image, and no page that sells Premium.

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| High | 378 A&P pages | `og:image` points at anatomy-physiology/assets/og-image.png, which doesn't exist (404 live). Every shared A&P link has no preview. | Add the image or point at /assets/og-image.png. |
| High | 279 lesson pages, 4 Premium tool pages | `isAccessibleForFree: true` and `"price": "0"` on gated content. | `isAccessibleForFree: false` with `hasPart` and a `cssSelector`; drop price 0. |
| High | Site | No /premium page, so nothing ranks for "NREMT practice test price" and the signed-out account page shows no prices. | Build it from the premium.js course data; link from hub, footer and account. |
| Medium | Four manifests | "Free, offline, no account needed"; ochem's says "Organic Chemistry I, 14-module"; NREMT and hub share short name "LevlPrep". | "Free to start"; "23 chapters, 121 topics"; "LevlPrep NREMT". |
| Medium | Meta descriptions and titles | "A free NREMT-EMT study companion ... and a scenario simulator" (simulator is Premium); "A free timed practice exam"; "Free Anatomy & Physiology Course". | "Free to start" wording. |
| Medium | sitemap.xml | All 671 entries share lastmod 2026-10-01 and 529 have priority 0.8; dashboards, account and search pages are listed and indexable; nremt/dashboard is noindex yet in the sitemap. | lastmod from git per file; noindex and drop app-state pages. |
| Medium | \~640 course page titles | No "LevlPrep" and three separator styles (—, \|, :). | "{Topic} — {Course} \| LevlPrep", 60 characters max. |
| Medium | 8 notes descriptions | Auto-extracted openers like "You have used pKa twice already", "at a PO 2 of 100", one ending mid-sentence. | Hand-write these; skip sentences starting "You". |
| Medium | nremt/study-notes.html | Three `<h1>` elements. | One. |
| Medium | Live vs repo | Live title still says "Free NREMT, Organic Chemistry & A&P Prep"; repo says "... Free to Start". | Confirm the latest Pages deploy went out. |
| Low | index.html:145 JSON-LD | Logo is an SVG (Google wants raster, 112 px+); no founder, sameAs or email. | icon-512.png; add founder and contact. |
| Low | Keywords | Nothing targets "new NREMT exam 2025" or "EMT practice test 2026". | After re-alignment, a page for the 2025 exam. |
| Low | Hub | No FAQ (affiliation, price, is it free). | FAQPage with those three. |
| Low | Hub copy | Founding price "$20.30" hard-coded and goes stale on 2027-01-31; "Organic Chem" in the title; NREMT-only "How the questions are written" on a three-course hub. | Render price from premium.js; expand the name; generalise. |
| Low | Smaller copy | sources.html says four report reasons (there are five) and leaves A&P out of the assistant section; "121 sections" vs "121 topics"; "1041 terms". | Fix each. |
| Nit | Hub | Orphaned CSS at index.html:129 to 133; "LEVLPREP" eyebrow repeats the logo; 404 links to NREMT-only search; robots.txt carries long internal comments; README and code comments cite old counts (2,084, 64 sections, "waitlist"). | Clean up. |

## Performance, repo and infrastructure

Load times are fine for a static site; layout shift and big data downloads are the problems. Measured on a throttled phone profile (4x CPU, 150 ms latency, local server without gzip):

| Page | LCP (s) | TBT (ms) | CLS |
| --- | --- | --- | --- |
| / | 1.65 | 31 | 0 |
| /nremt/ | 1.73 | 91 | 0.014 |
| /ochem/ | 2.64 | 171 | 0.019 |
| /anatomy-physiology/ | 2.42 | 291 | 0.003 |
| ochem/notes/eas.html | 2.77 | 307 | 0 |
| A&P glossary | 2.48 | 503 | 0.144 |
| nremt/practice | 2.48 | 217 | 0 |

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Medium | Shared /assets shell | 248.1 KB gzipped against a 249 KB budget; the Supabase SDK loads on every page for every visitor just to log a pageview; the tutor (1,266 lines) is in the shell. | Lazy-load the SDK on login or session; pageview by plain fetch; load the tutor on first tap. |
| Medium | Ochem practice and exams | 3.2 MB and 2.9 MB pages; 1.95 MB of bank JSON including every explanation before a session starts. | Fetch explanations on first answer or per topic. |
| Medium | ochem/learn.html, glossary | 134,000 px tall at 390 px for chapter 1; glossary 94,000 px. Marked done in the review plan but still long. | One section at a time; collapsible letters. |
| Medium | Repo, 126 MB | A&P is 82 MB: 38 MB of figures, 20 MB of pretty-printed source JSON plus minified duplicates; sources are publicly served. TRACKER.md is 194 KB at the root. | Build to dist/ with a Pages Action and deploy runtime files only; move trackers to docs/. |
| Medium | Worker deploy | Manual dashboard paste: no CI, no way to tell if production matches dist/worker.js, rate limiter and cron added by hand. | GitHub Action running `wrangler deploy`; turn on observability. |
| Medium | Database | schema.sql pasted by hand, missing tables, live grants differ. | Supabase CLI migrations in the repo plus `supabase db lint` in CI. |
| Medium | Personal accounts | Worker hostname hard-coded in four files; Pages on a personal GitHub. | api.levlprep.com and one config constant. |
| Low | Images | 389 OpenStax JPGs, no WebP/AVIF or srcset; phones get 1100 px images. | AVIF/WebP at 480, 800, 1100 with `<picture>`. |
| Low | Fonts | theme.css then fonts.css then woff2, no preload. | Inline `@font-face`, preload the Latin Nunito file. |
| Low | Tutor banks | NREMT 482 KB and ochem 325 KB gzipped, loaded whole. | Shard by chapter or a compact index. |
| Low | Service worker | Precaches about 110 URLs across all three courses on first visit. | Precache per course. |
| Low | CI | No `permissions:` block; actions pinned by tag; Playwright installed unpinned each run; no check that every page has a CSP; a11y and console jobs need Playwright locally. | `contents: read`, package.json plus lockfile, a CSP rule in check-site. |
| Low | .gitignore | Missing `.wrangler/`, `.dev.vars`, `.env*`, `*.pem`. | Add them. |
| Low | Docs | docs/premium.md says "built, not launched"; README says premium.js "locks nothing"; auth-setup.md omits confirm-email and leaked-password protection. | Update. |

## Already strong, and how this was checked

Worth keeping as is: all 21 build and content checks in CI pass (links, generated pages, curriculum order, A&P dependency map); answer position and length tells are neutralised in all three banks; the 2025 AHA changes are in; reduced motion is respected; no secrets are committed; the Polar webhook is correctly verified; and the A&P science is unusually careful.

Method: the repository at commit 26e957a (1 October 2026) was cloned read-only and served locally. Six parallel reviews covered the hub and SEO, each course's content, code and payments, and UX. About 2,100 questions were read by hand across a stratified sample and targeted high-risk topics, plus whole-bank scripts for duplicates, position bias and notation. Pages were driven in Chromium at 390 and 1440 px, light and dark, with axe on 30 pages. The live Supabase project was queried read-only for grants and advisors. Third-party requests (Supabase, Umami, the Worker) were blocked in the sandbox, so accounts, checkout and the AI tutor were only seen in their failure state. Nothing in the repo was changed.

Sources:

- [NREMT: EMR and EMT Certification Examinations](https://nremt.org/Pages/Examinations/EMR-and-EMT-Certification-Examinations)
- [NREMT: announcement of updated BLS examinations (7 April 2025)](<https://www.nremt.org/News/National-Registry-of-Emergency-Medical-Technic-(1)>)
- [NREMT: BLS Certification Examinations](https://nremt.org/Document/BLS-Certification-Examinations)
- [JEMS: 2025 AHA Guidelines for CPR and ECC](https://www.jems.com/patient-care/2025-american-heart-association-guidelines-cardiopulmonary-resuscitation-cardiovascular/)
- [ProTrainings: 2025 CPR and first aid guideline updates](https://blog.protrainings.com/whats-new-in-cpr-and-first-aid-understanding-the-2025-guideline-updates/)
