# AP Microeconomics tools in the standard frame (F5b, 2026-11-16)

Kit change (`microeconomics/assets/tools/mic-tools.js`) is the same as AP Macro's: see the kit table in
`docs/tools-frame-notes/apmacro.md` (std bar with `LEDE`, task with `TASK` and the cue as its line, settings row to
the menu, kind of problem as the stage picker in Test yourself, hint ladder per drill step, finished card, no
automatic solution sheet, standard bar on the lock screen). Matrix steps get the ladder too. Nothing removed;
`build-apmicro.mjs --check` and `build-apmacro.mjs --check` pass.

## Per tool
- **Cost lab**: Start over was only in More options -> stage foot. Hire, Fill every row, sliders, table, curve settings (menu, "?") unchanged.
- **Elasticity lab**: Price / Income / Cross-price keep their switch; kinds of good stay chips in their view. Method setting -> menu.
- **Externality lab**: Externalities / Public goods keep their switch; the task line follows the tool's own cue, which changes with the view and the case (tax or subsidy).
- **Factor lab**: Competitive / Monopsony keep their switch; task line follows the cue (minimum wage line in monopsony).
- **Firm and market lab**: three market structures keep their chips (each has its own controls); the change select stays with Run the long run in perfect competition. Curves setting -> menu.
- **Game lab**: the game chips -> stage picker. Best responses, tax or subsidy, payoff editing ("?") unchanged.
- **Graph studio**: Graph select -> stage picker in Explore and Test yourself; own drill got the ladder, task line, finished card.
- **Surplus lab**: seven policy chips -> stage picker ("Policy"). Level slider, area chips, letters (menu, "?") unchanged.

## New copy (for an accuracy check)
`LEDE` and `TASK` in mic-tools.js (for example "Why does a firm hire until MRP equals MRC?", "Why does MC cross AVC and
ATC at their lowest points?").

## Questions
- Firm and market: the shock select could be the stage picker in perfect competition only; left in the panel because the picker cannot follow a view inside a mode. Fine?

## Accuracy check (F6b, 2026-11-16)
Checked `LEDE`, `TASK` and every drill type's finished card takeaway (generated per context and type) against the tools
and `docs/apmicro-authoring-guide.md`.
- Correct as written: all eight `LEDE` and `TASK` lines (MC crosses AVC and ATC at their minimums; hire to MRP = MRC).
- Takeaways read well alone for cost, elasticity, externality (quantity, dwl, public), factor, firm (quantity,
  shutdown, monopoly, monocomp), game (dominant, nash), surplus, and most graph studio scenarios. New own lines (`TAKE`
  in mic-tools.js):
  - externality fix (began "It shifts supply left to MSC"): "A per-unit tax on a negative externality, or a subsidy
    for a positive one, moves the market to the efficient quantity and removes the deadweight loss."
  - firm-market longrun ("The market quantity is smaller, with fewer firms." alone): "In the long run, entry or exit
    shifts market supply until price equals minimum ATC and economic profit is zero."
  - game best and change (a 250 character comparison): its last sentence only ("Beta Jet's dominant strategy is Low
    fare.").
  - graph studio: same rule as macro (This, That or It gets the shift line in front).
  - A leading "So" is dropped (elasticity income and cross, externality quantity, game nash).

## F8 accuracy check (2026-11-16, against `docs/apmicro-authoring-guide.md`)
- cost-lab shutdown: "between AVC and ATC" now "between minimum AVC and minimum ATC" (the guide: shutdown at minimum
  AVC, not minimum ATC).
- externality-lab public, factor-lab hire (MRP = MRC; MRC is the wage in a competitive labor market), surplus-lab
  control, trade, tariff: correct, kept.
