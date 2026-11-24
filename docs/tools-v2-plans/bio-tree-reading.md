# Plan: AP® Biology, Phylogenetic tree reading (tools v2)

**Tool and page:** `bio/tools/tree-reading.html`; `bio/assets/tools/tree-reading.js`, data
`bio/data/tools/tree-reading.json` (trees `vertebrates`, `plants`, `primates`, `species`). Premium. Rollout row 34,
group B, wave 5, size restyle.

**The one idea:** relatedness is read from the most recent common ancestor, not from how close the tips sit.
Two tabs: "Common ancestor" (tap two tips, see their ancestor; rotating a node changes nothing) and "Traits"
(a shared derived trait marks the branch where it arose and every tip above it).

## Research
- [HHMI BioInteractive, Phylogenetic Trees click and learn](https://media.hhmi.org/biointeractive/click/Phylogenetic_Trees/help.html):
  tap a node to rotate, tap tips to find relationships; take the rotation animation and the plain node names.
- [HHMI Lizard Evolution Virtual Lab](https://www.labxchange.org/library/items/lb:LabXchange:f1e273c1:lx_simulation:1):
  builds a tree from traits and DNA; take "trait ticks on branches".
- Understanding Evolution (Berkeley) "tree thinking" pages (known only): the common misreadings (reading across the
  tips, "more advanced" at the right). Builder: open all three.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Tree picker (4 trees) | Explore: 3 trees as quiet chips on the stage (vertebrates opens); `species` (DNA) tree in Test yourself only, log it |
| Tap a tip to select; MRCA, sister group, "Is this group a clade?", Clear the selection buttons | Explore tab 1: tapping two or more tips lights their MRCA and its clade at once (no buttons); sister group and clade words appear on the picture when true. Buttons gone, log it |
| Rotate node buttons, Restore the first drawing | Explore tab 1: tap a node to rotate (animated swing); a small reset |
| Branch dropdown "Branch leading to" and character placing (Place the characters, Check my placements, Try again); record `tree-reading:<tree>:characters` | Explore tab 2: tap a trait chip, it slides to its branch and tips above it show the trait (ungraded). Graded placing is Test yourself part "Place the traits", same record id |
| Build a tree mode (join checked pieces, Undo, Start over, Check my tree; record `tree-reading:build-<tree>:tree`) | Test yourself part "Build a tree", same ids |
| Character table | Tab 2 trait chips; the full table behind "?" |
| Questions (5 ids `tree-reading:plants:1..3`, `tree-reading:dna:4..5`), stimulus `tr-s1`, mini FRQ | Test yourself "Questions", unchanged; `#questions`, `#frq` |

## Design
- **Picture:** a tree drawn as a living branching tree on a soft ground, not a line diagram only: thick branches
  that taper, each tip ending in a drawn organism (shark, frog, lizard, bird, mouse, human for vertebrates; moss, fern,
  pine, flower for plants), the root at the bottom with "older" at the base of a quiet time arrow.
- **Main control:** tap tips. The paths from each tapped tip down to their MRCA glow in one colour, the MRCA node
  swells with a small "common ancestor" pill, and the clade above it is tinted. Tapping a node swings its two
  branches around it (300 ms), tips trade places, the glow stays on the same organisms.
- **Tab 2:** trait chips ("backbone", "four limbs", "amniotic egg", "hair") on the picture's ground; a tap sends a
  tick mark up the trunk to its branch and paints the trait on every organism above.
- **Cause line:** "frog and lizard → common ancestor at node 3 → closer than frog and shark (node 1)".
- **Takeaway:** "Rotating a node never changes who is related to whom."
- **Outside the picture:** 2 tabs, purpose line, Show me how, cause line, tree chips (quiet). About 25 words.

## Science to verify
- Each tree's topology and trait origins against current consensus (Tree of Life web project, or NCBI Taxonomy;
  birds inside reptiles; lungfish vs coelacanth if drawn). Contested points to `docs/apbio-needs-author.md`.
- Clade = an ancestor and all its descendants (CED 7.9); sister groups share an immediate ancestor.
- Trap: no "more evolved" or ladder language; tips are all present day; branch length means nothing unless stated.
- No OpenStax trees or text.

## Reuse
`ApBioTools.studioKit2` with parts (Place the traits, Build a tree, Questions). Kit: `K.tabs`, `K.tap` (tips and
nodes), `K.spots` if tips need name cards, `K.cue`, `K.cause`. No `K.draw` needed here (taps only); "Build a tree"
in Test yourself keeps its old interaction. Not the first AP® Biology tool on kit2.

## Risks reviewers will likely block on
- Six drawn organisms plus names at 360 px: names under the organisms at 11 px or more; the tree may need a taller
  stage on phones, never smaller text.
- Taps must hit the drawn tip or node under the finger (`elementFromPoint`), not a bounding box.
- During a node swing, glow, pill and cause line must follow the drawn positions every frame.
- Organism art weight: draw once as symbols, reuse; check `check-weight`.
