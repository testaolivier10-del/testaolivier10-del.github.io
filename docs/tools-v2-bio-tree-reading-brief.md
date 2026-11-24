# Tools v2: AP® Biology Phylogenetic tree reading (brief and build notes)

Status file for the v2 rebuild of `bio/tools/tree-reading.html` (rollout row 34, group B, wave 5, Premium).
Plan: `docs/tools-v2-plans/bio-tree-reading.md`. Standard: `docs/tools-v2-standard.md`; builder rules:
`docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-bio-tree-reading`, cut from `claude/tools-v2-all`.
NOT merged: an independent review comes first. Decisions made for the owner are also one line each in
`docs/tools-v2-owner-log.md`.

## The one main idea
**Relatedness is read from the most recent common ancestor, not from how close the tips sit.** Two organisms are
closer kin when the node where their lines meet is more recent (nearer the tips). Rotating a node swaps the order of
its branches and changes nothing about who is related to whom. A shared derived trait arose once, on the branch
leading to a clade, and every tip above it inherits it. CED topic 7.9 (`phylogeny`), practices 2 and 6.

## Research (rule 10)
"Seen" means the page's text was read here; none of the interactives could be operated.

| Source | How it works | What we took |
|---|---|---|
| The old LevlPrep tool (`origin/main`, seen in code) | A root left cladogram drawn as lines; tap a numbered node to rotate (tips glide); tap tips or tick checkboxes; buttons for the most recent common ancestor, "Is this group a clade?", the sister group, Clear; a branch dropdown per character and Check; Build a tree from a table; text description; DNA difference table | All of it; see "What moved" |
| Baum and Offner, "Understanding Evolutionary Trees", Evolution: Education and Outreach 2008 (seen in full) | Nodes rotate like a mobile; time runs from the root to the tips, never across them; reading across the tips and counting nodes are the common misreadings; frog is as related to fish as humans are | The node swing, the time arrow from "past" to "now", the "?" reading tips, the comparison of a pair with the one before |
| Understanding Evolution (Berkeley), "Tips for tree reading" (seen) | Taxa sharing a more recent common ancestor are more closely related; adjacent tips are not necessarily close; no "more advanced" side; branch rotation as the fix | The cause line's "closer kin than ... / less close than ..." and the rotation takeaway |
| HHMI BioInteractive, Phylogenetic Trees / Creating Phylogenetic Trees click and learn (the plan's help link answers 404; worksheets that walk its slides seen as text) | Slides that rotate a tree around its nodes and show the relationships do not change | Rotation as a shown swing, plain node names |
| HHMI Lizard Evolution Virtual Lab (LabXchange page seen as a summary only) | Builds anole trees from traits and DNA | Trait ticks on branches (known only from the plan) |
| NCSE "Misconception Monday: do you talk tree?" (search result only) | "Nodes can rotate" | Known only by its summary |

What ours does that none of these do: the tree is a drawn, living tree with the real organisms at its tips; a tap on
any two of them sends a glow down both lines to the node where they meet, the comparison with the pair before is
written at once, and a trait climbs the trunk to the branch where it arose and paints every organism above it.

## The design
- **Picture:** an outdoor scene: a soft sky, far hills, a strip of turf and soil. The tree grows out of the soil, its
  root (node 1) just above the ground, as tapering bark limbs with a light edge; each internal node is a cream knot
  with its number; each tip ends on a small pad with a drawn organism standing on it (19 drawings: lancelet,
  lamprey, shark, frog, lizard, kangaroo, mouse; charophyte alga in its pool, moss with capsules, fern, pine, rose,
  grass; six primate faces, human, chimpanzee, gorilla, orangutan, macaque, baboon), its name just above it (two
  staggered rows where a name is wider than its column). A quiet arrow on the left runs from "past" at the root to
  "now" at the tips (every tip is alive today). Cladograms place a node by how far it is from its tips (nesting, not
  dates); the primate tree is drawn to scale (its DNA differences). The organisms are SVG symbols drawn once and
  reused by `<use>`.
- **Tab 1, Common ancestor. Main control: tap tips.** Each tapped tip's name turns into a blue pill. With two or more,
  amber glows grow from each tapped tip down to their most recent common ancestor (about 420 ms); when they meet, that
  knot swells amber, a pill "common ancestor" pops beside it (one line, or stacked where that fits better), and the
  clade above it is tinted (soft amber limbs and a ring around each organism in it). The pill adds "sister taxa" when
  the two tips are each other's closest relatives, or "a clade" when the tapped tips are exactly the clade; nothing
  when they are not. A tap on a tapped tip lets it go (the glow pulls back); a tap on the sky clears them all.
- **Tap a node:** its two branches swing around it (300 ms): the tips under it trade places, every limb, knot, glow,
  pill and ring follows the drawn positions on every frame; the moving names fade while they move and come back at
  their new places. Then the takeaway: "Rotating a node never changes who is related to whom."
- **Tab 2, Traits. Main control: the trait chips on the ground** (vertebrates: backbone, jaws, four limbs, amnion,
  hair; plants: embryo, vascular tissue, seeds, flowers). A tap sends a violet bead from the ground up the trunk and
  along every limb to the branch where the trait arose (0.35 to 0.8 s); it becomes a tick with the trait's name
  beside it (a thin line to the tick when the name had to sit a step away), then the clade above it is painted
  violet (limbs and rings). A second tap takes the trait off (the tick fades). Taps on nodes still rotate; the ticks
  ride along.
- **Cause line** (`K.cause`), read from what is drawn: at rest "tap 2 animals → see their common ancestor"; one tip
  "frog → tap one more"; two or more "frog + lizard → common ancestor 4 → not a clade: leaves out kangaroo + mouse",
  or with a pair before it "frog + shark → common ancestor 3 → less close than frog + lizard" ("closer kin than",
  "as close as"; nothing when the two ancestors sit on separate branches of a cladogram); the primate tree adds
  "1.2% of DNA differs" for a pair when it fits. The ancestor is named only once the glows have reached it on the
  picture. Traits: "lancelet = outgroup → has none of these traits → tap a trait", then "hair → arose once, below
  node 6 → kangaroo + mouse inherit it" once its tick has arrived and the paint is on. Parts are dropped from the end
  when the line would take a third row (measured). Takeaways: the rotation one, and with every trait placed "A shared
  derived trait marks one clade: its branch and every tip above it."
- **Outside the picture:** two tabs, the purpose line (8 or 9 words) with "Show me how", the cause line, the tree
  chips (Animals, Plants, Primates (DNA); Traits offers the first two) and Start over (unwinds every rotation, shown,
  and clears the taps and, in Traits, the ticks). No side panel.
- **Fit:** the scene's height is the window's height less what sits above it and the cause line with its buttons, so
  the organisms (the main control), the picture and the cause line are in view together (phones 360 to 640 px,
  larger 380 to 720 px).
- **Cue:** "Tap two animals" under the second tip, once per device (and "Tap a trait" above the first chip in Traits).
  "Show me how" (three steps per tab) from the purpose line and from "?".
- **Keyboard and screen readers:** a real button over every tip (aria-pressed) and every node ("Node 4, the common
  ancestor of frog, lizard, kangaroo and mouse. Tap to rotate it"); the chips are buttons; the picture's label is the
  tree in words (tips in order, clades in brackets, what is tapped or placed); a live region says each change. Taps
  act on what is drawn under the finger: the nearest knot within 23 px, else the organism or name column under it.
- **One color per idea:** tapped tips blue, the common ancestor and its clade amber, traits violet, DNA differences
  green in the cause line.
- **Reduced motion:** every change at once with a 260 ms cross fade.

### What is on screen in Explore (counted at 1440, opening)
Outside the picture: 2 tabs, the purpose line (8 words) and "Show me how", the cause line (2 pills, 7 words), 3 tree
chips, Start over. On the picture: 7 organisms with 7 names, 6 numbered knots, "now" and "past", and on a first
visit the cue. Controls: 7 tips, 6 nodes, 3 tree chips, Start over, Show me how (Traits: 5 trait chips in place of the
tip taps).

### Explore against Test yourself
- **Explore:** as above; nothing graded.
- **Test yourself**, one dropdown ("What to practice"):
  1. **Place the traits** (the old graded placing, `#place`): the same picture (no tip taps, no chips); in the side
     panel a tree choice (chordates or plants), each trait as a numbered button and a branch list. Tap a trait, then
     the branch (the nearest limb within 26 px), or choose from its list; a numbered tick climbs to it. Check my
     placements grades and records `tree-reading:<tree>:char-<id>` (first check per tree), the report button
     `tree-reading:<tree>:characters`, then shows every trait on its right branch; Try again.
  2. **Build a tree** (`#build`): the old interaction unchanged (character table, checkbox pieces, Join, Undo, Start
     over, Check my tree), its own stage; the result is drawn as a still tree with the organisms; records
     `tree-reading:build-<tree>:tree`.
  3. **Questions** (`#questions`, `#frq`): the five stimulus questions and the mini FRQ, ids unchanged. The
     stimulus's Drawing 1 and Drawing 2 are drawn in the new style.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Tree picker (4 trees) | Tree chips under the picture: Animals, Plants, Primates (DNA); the invented species P to U were build only and stay in Build a tree |
| Tap a tip or tick a checkbox to select | Tap the organism or its name (a key button over each for the keyboard) |
| "Most recent common ancestor" button | Automatic once two tips are tapped: the glow, the knot, the pill |
| "Is this group a clade?" button | "a clade" on the pill when true; "not a clade: leaves out ..." in the cause line; the words paraphyletic and polyphyletic in "?" |
| "Find the sister group" button | "sister taxa" on the pill for a pair of sisters; sister groups explained in "?" |
| Clear the selection | Tap the sky, or tap a tapped tip again |
| Rotate node buttons, tap a node | Tap a node (or its key button): a 300 ms swing |
| Restore the first drawing | Start over (shown) |
| Character chips drag or tap onto a branch, branch dropdowns, Check my placements, Try again | Explore Traits: the ticks place themselves (ungraded); graded placing is Test yourself, Place the traits (same record ids) |
| Build a tree | Test yourself, Build a tree (same interaction and record ids) |
| Text description of the tree, character table, DNA difference table | "?" (follows every rotation) |
| MRCA bracket on the right | The clade tint and rings |
| Questions and mini FRQ, Drawing 1 and 2 | Test yourself, Questions (ids unchanged; the drawings redrawn root at the bottom, the stimulus now says "left to right") |

## Decisions made for the owner (also in the owner log)
1. Explore is a drawn living tree with 19 drawn organisms at its tips, root at the bottom at every width.
2. The data's own organisms stay (lancelet to mouse, alga to grass, six primates), not the plan's bird and human set:
   the questions, tables and characters use them.
3. Explore offers the chordate, plant and primate (DNA) trees as quiet chips under the picture; Traits only the two
   with characters; each tab remembers its own tree; rotations are kept per tree.
4. The four question buttons go; the picture and cause line show the ancestor at once, "a clade" or "sister taxa"
   only when true, "not a clade" with what it leaves out in the cause line; paraphyletic and polyphyletic stay in "?".
5. A new pair is compared with the pair before it in the cause line; nothing is said when the two ancestors sit on
   separate branches of a cladogram.
6. A tap on the sky clears the taps (the Clear button goes).
7. Node numbers stay on the knots (the cause line and "?" name them).
8. Start over unwinds the rotations and clears the taps (and the ticks in Traits).
9. Traits are one color (violet); only the newest trait's clade is painted; older ticks keep their names where
   there is room (the newest always gets its name first, a thin line to it when it sits a step away).
10. Graded placing moves to Test yourself "Place the traits" (tap a trait then a branch, or the lists; same record
    ids); after a check the tree shows every right branch, as before.
11. Build a tree keeps its old interaction in Test yourself; its result is drawn as a still tree.
12. Short names on the picture: "Alga" (charophyte alga), "Chimp" (chimpanzee); full names in lists, labels and "?".
    Traits get short names of 1 to 3 words (the content check enforces both).
13. Data wording that described the old root left drawing: the stimulus says "from left to right", one distractor
    says "at the right end of the tree" (was "at the bottom"), "How this model works" says root at the bottom; ids,
    keys and answers unchanged.
14. Names sit just above each organism (their heights differ), on two staggered rows where a name is wider than its
    column.
15. The scene's height comes from the window's height.
16. Cladogram nodes are placed by nesting, not time; "?" says so; the primate tree is drawn to scale.
17. "?" adds a short "Reading a tree" list (time from root to tips, rotation, no "more evolved" side, clades and
    grades).
18. Blurb and intro reworded; title, description and URL unchanged; the page no longer loads `bio-art.js`.

## Accuracy
Checked against the course's phylogeny notes and Baum and Offner 2008 / Understanding Evolution (above):
- Most recent common ancestor: the node closest to the tips with all the tapped tips among its descendants
  (`ApBioMath.phylo.mrca`). Closer kin share a more recent one; the comparison is made only when one ancestor is a
  descendant of the other (or on the DNA tree by its drawn height).
- Clade = an ancestor and all its descendants (CED 7.9); a group that leaves some out is not a clade (a grade,
  paraphyletic). Sister taxa: the two children of one node, here two tips that are the node's only children.
- Rotating a node changes nothing: every node keeps its descendants (the content check rotates every node).
- Outgroups: the lancelet (a chordate without a vertebral column) for the chordates, a charophyte alga for land
  plants; each lacks every derived character (content check).
- Shared derived characters: vertebral column (vertebrates, lamprey counted, see `tree-teaching-values`), hinged
  jaws (gnathostomes), four limbs (tetrapods), amnion (amniotes), hair and milk glands (mammals); embryo retained
  (land plants), vascular tissue (ferns and seed plants), seeds, flowers and fruit (flowering plants). Every one
  marks exactly one clade of its tree (content check).
- Relationships drawn: lamprey sister to the jawed vertebrates; shark (cartilaginous) sister to the bony vertebrates;
  lizard sister to mammals (amniotes); kangaroo and mouse (marsupial and placental) sisters; moss sister to vascular
  plants; fern sister to seed plants; pine sister to flowering plants; rose and grass sisters; human and chimpanzee
  sisters, then gorilla, orangutan; macaque and baboon sisters; the root between apes and Old World monkeys.
- No "more evolved" or ladder wording anywhere; every tip is shown as alive today ("now").
- Logged in `docs/apbio-needs-author.md`: `tree-explore-v2` (the "arose once" wording, nesting heights in cladograms,
  drawn primate faces, "grade"); the open `tree-group-words` and `tree-teaching-values` still apply.

## What was built
- `bio/assets/tools/tree-reading.js` (rewritten on the kit; the organisms `ApBioTreeArt` at its top; Build a tree and
  Place the traits ported from the old code), `bio/assets/tools/tree-reading.css` (new, this page only),
  `bio/data/tools/tree-reading.json` (`explore` block, short names, the wording above), `bio/data/pages.json`
  (`"kit2": true`, blurb), `scripts/build-apbio.mjs` (this page no longer loads `bio-art.js`), the content check
  `scripts/lib/apbio-tool-checks/tree-reading.mjs` (the explore block) and its unit test. The adapter
  `ApBioTools.studioKit2` is used as it is (two docked parts, one with its own stage, then the questions).
- `scripts/tools-v2/bio-tree-reading-sweep.mjs`: ten widths, one process each, light and dark; `--frames`;
  `--perf`; `--shots`; `--quick` (only the reduced motion and locked checks).

## Checks run
See "Final run" below.

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students.
- The flat animals (lancelet, lamprey, lizard) are thin at a tip's size; on a 360 px phone every organism is about
  45 px.
- With every trait placed on a 360 px phone, some older trait names sit a step from their ticks with a thin line;
  the chips take two rows of the ground.
- Names sit at different heights (each just above its own organism), so the row of names is ragged.
- The cladogram's node heights come from nesting; a student may still read them as dates (said in "?").
