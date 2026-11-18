# Tools v2: decisions made on the owner's behalf

The owner does not review each tool (`docs/tools-v2-standard.md`, "Process per tool"). Every decision a builder or
reviewer makes for him goes here, one line each, newest last, so he can skim it and reverse any of them. Details are
in each tool's brief.

| Date | Tool | Decision | Why | Where it went / how to reverse |
|---|---|---|---|---|
| 2026-11-17 | AP Bio Osmosis | Dialysis bag left out of Explore | Two concentration controls on one picture is the Water potential tool's screen | Still in Test yourself (Predict). Reverse: a third Explore tab |
| 2026-11-17 | AP Bio Osmosis | NaCl left out of Explore (sucrose only) | "More solute" then always means higher molarity | Still in Predict and in Water potential |
| 2026-11-17 | AP Bio Osmosis | Temperature slider removed from Explore | It changes nothing you can see | Fixed at 22 °C and 37 °C, stated in "?"; still in Water potential |
| 2026-11-17 | AP Bio Osmosis | Time slider removed from Explore | Explore shows where the cell settles | Timed runs are in Predict; "Watch it happen" replays the change |
| 2026-11-17 | AP Bio Osmosis | "Run one trial", "Run a series" and the table of your own noisy runs removed | A data collecting job, not this tool's idea | The model's curve and table are in "?". Candidate for a later separate tool (a potato core lab) |
| 2026-11-17 | AP Bio Osmosis | Mass graph, readouts and equations moved | Nothing extra on the Explore screen | "?" |
| 2026-11-17 | AP Bio Osmosis | The ψ scale (ladder) taken off the picture | It is the Water potential tool's screen; the two tools stay separate | Values in "?"; the comparison is in the cause line |
| 2026-11-17 | AP Bio Osmosis | Explore's plant cell is an idealized cell, flaccid in the isotonic solution, not the potato core | So "isotonic" and "no net movement" are the same stop | `docs/apbio-needs-author.md`, osmosis-explore-plant-cell |
| 2026-11-17 | AP Bio Osmosis | No optional teaser line | Keeps the screen quiet | Add one per tab if wanted |
| 2026-11-17 | AP Bio Osmosis | Tab renamed "Animal cell" to "Red blood cell" | The label names what is drawn (rule 15) | `explore.cells` in the tool's data |
| 2026-11-17 | AP Bio Osmosis | A burst cell does not heal: dragging back puts a new cell in, marked "new cell" | The honest behavior | `changed()` in `bio/assets/tools/osmosis.js` |
| 2026-11-17 | AP Bio Osmosis | When a change sends water back the other way, the cause line tells that change ("Less solute than before → ... → water moves back in") | The cause line must never disagree with the arrows (rule 14) | `chain()` in the same file |
| 2026-11-17 | AP Bio Osmosis | Water arrows only while water is moving; with reduced motion a still mark of the last change instead | Rule 13 | Same file |
| 2026-11-17 | AP Bio Osmosis | The hub blurb and the About intro were reworded; title, description and URL unchanged | They described the old Explore | `bio/data/pages.json`, the tool's data |
| 2026-11-18 | AP Bio Osmosis | The dashed "before" outline of the cell removed; the tick on the track stays | Reviewer: it read as a second membrane or a nucleus | Review round 1 in the brief |
| 2026-11-18 | AP Bio Osmosis | While water moves the cause line stops at the water pill; the result is added when the cell is in that state | No word may run ahead of the picture (rule 14) | `chain()` |
| 2026-11-18 | AP Bio Osmosis | The change story ("than before") shows only during a reversal and never when settled | 0.30 M must always end on "no net water movement" | `chain()` |
| 2026-11-18 | AP Bio Osmosis | Reviewer's idea to keep the first two cause pills through a reversal was not taken | They would name a cause that points against the arrows | Review round 1 in the brief |
| 2026-11-18 | AP Bio Osmosis | Drawn areas follow the model (cell and vacuole by water, protoplast by mass) | Inside and outside crowding must match once settled | `shape()` |
| 2026-11-18 | AP Bio Osmosis | Potato challenges say "24 hours"; Replay sits in the feedback; a phone scrolls the picture into view for a run | Reviewer | Test yourself, Predict |
| 2026-11-18 | AP Bio Hardy-Weinberg | Explore shows snapdragons (incomplete dominance: red, pink, white), not a dominant and recessive trait | All three genotypes can be seen and counted without a key | Carriers are in Test yourself: targets 1 and 3 on a pea bed (review round 1), and the recessive problems. Reverse: `explore` in the tool's data |
| 2026-11-18 | AP Bio Hardy-Weinberg | The bed is sorted into four plots, not scattered like a real population | So the shares can be counted and the plots are p by p, p by q, q by q | Said in "?" |
| 2026-11-18 | AP Bio Hardy-Weinberg | p moves in steps of 0.1 (was 0.01) | Every plant is a whole plant, so the picture and the numbers never disagree | "Any p" to 0.01 in "?" |
| 2026-11-18 | AP Bio Hardy-Weinberg | The panel slider, the five number readout and the key left Explore | The slider repeated the control on the picture; the signs and the cause line carry the numbers | "?" (this setting, every setting, any p) |
| 2026-11-18 | AP Bio Hardy-Weinberg | The three "Try this" targets are now checked questions on a bed that is not in bloom, plus two new ones | Explore is free play; a target you can sweep to is not a test | Test yourself, "Set the alleles"; recorded as `hardy-weinberg:target-<id>` |
| 2026-11-18 | AP Bio Hardy-Weinberg | No "Watch it happen" and no "before" tick | The change is short and is seen on every drag; fewer things on screen | Add `K.player` if wanted |
| 2026-11-18 | AP Bio Hardy-Weinberg | Alleles are written R and W on the picture | Superscripts do not fit an allele drawn 20 px wide | C^R and C^W in "?" |
| 2026-11-18 | AP Bio Hardy-Weinberg | In Problems (the calculations) each individual is a pair of alleles (was a circle, dotted circle or square); the egg and sperm glyphs went | The same allele colours as Explore; "every individual carries two" is drawn | `pstage()` in `bio/assets/tools/hardy-weinberg.js` |
| 2026-11-18 | AP Bio Hardy-Weinberg | The hub blurb and the About intro were reworded; title, description, tag and URL unchanged | They described the old Explore | `bio/data/pages.json`, the tool's data |
| 2026-11-18 | AP Bio Hardy-Weinberg | The biology kit adapter gained a "practice" part for skills tools | So generated problems stay in Test yourself beside other parts | `studioKit2` and `studioPractice` in `bio-tools.js` |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: targets 1 (16% recessive) and 3 (rare) are on a second bed, pea plants with complete dominance (purple, white), with the old wording; after the bloom two signs and "Aa: carriers" on the Aa plot | The carrier idea and "dominant phenotype = p² + 2pq" were lost from everything but the calculations | `sp: "pea"` on a target and the `pea` block in the tool's data |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: no hint before the first try in "Set the alleles" | It gave the method away; the wrong answer feedback carries it | `showTarget()` |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: plants are shorter than their row (0.8) and bushy when the cell is about square, so each plant stands apart | On phones the plants fused into ten stalks | `geo()` |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: each plant is one image (drawn once per colour), and grows in over three sizes set by script instead of a CSS animation | A drag was slow (100 CSS animations, two uses per plant) | `sprites()`, `grow()` |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: a drag that starts on the pollen row moves p (the control's hit area covers it), so "Drag the alleles" is true | Dragging an allele did nothing | `layoutNow()` |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: the "eggs" caption sits at the head of the egg column; on phones the Problems key is one line | Reviewer | |
