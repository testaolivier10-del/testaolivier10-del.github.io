# Ochem course: needs author

Items from the ochem readability and diagram pass (`docs/ochem-readability-audit.md`) that need a
human decision or review. Nothing here is guessed. Each item records its status, and once it's
settled, the decision and where it is applied.

Status values:
- **open**: waiting on a decision.
- **decided**: settled, with where the decision is applied.
- **pending review**: the course follows the stated position, but an organic chemistry
  instructor should confirm it.

The rule: teach the position best supported by current evidence and current IUPAC
recommendations. Where course exams commonly expect another convention, the page says so.

## Contested science and conventions

### iupac-2013-primary-check: preferred-name claims not read against the Blue Book
- **Status:** open.
- **Where:** `naming-substituents`, `naming-functional-groups`.
- **What the pages say:** *tert*-butyl is the preferred prefix when unsubstituted (P-29.6). Isopropyl
  is acceptable in general nomenclature when unsubstituted. *sec*-Butyl, isobutyl and neopentyl are no
  longer recommended. The acid-chloride prefix is carbonochloridoyl- (P-65.5). An anhydride has no
  simple prefix of its own (P-65.7). Formic acid, acetic acid, formaldehyde, acetaldehyde, benzoic acid,
  phenol and aniline are themselves the preferred names; for acetone, toluene and styrene the preferred
  names are propan-2-one, methylbenzene and ethenylbenzene.
- **Why open:** the writers and both audit stages agree, but none could open the IUPAC 2013 text itself
  (the IUPAC hosts are blocked from the build environment). The claims rest on reviewers' knowledge and
  on secondary sources. A person should check P-29.6, P-64, P-65.5, P-65.7 and P-66.6.1.
- **Decided (owner, 2026-09-24):** removing the unverified sentence was right; it stays logged here
  until someone checks P-65.
- **Removed rather than guessed:** a sentence saying a chain-end acyl chloride or ester is named with
  chloro-/alkoxy- plus oxo- in the preferred name (3-chloro-3-oxopropanoic acid). It matches the 2004
  provisional P-65.5 example but could not be confirmed, so it is not on the page. Add it back if P-65
  confirms it.

### two-conventions: classic course conventions against IUPAC 2013
- **Status:** decided.
- **Where:** `naming-parent-chain`, `naming-substituents`, `naming-rings-unsaturation`.
- **Position taken:** each page teaches the convention most courses and exams grade by, names it as
  such, and shows the 2013 alternative beside it:
  - The parent chain must contain a C=C or C≡C (2-ethylpent-1-ene). IUPAC 2013 lets length win first
    (3-methylidenehexane).
  - Ring against chain goes by carbon count, with a tie to the ring. IUPAC 2013 always makes the ring
    senior (octylcyclohexane rather than 1-cyclohexyloctane).
  - Complex substituents: classic numbering puts the attached carbon at C1 (1-methylpropyl). IUPAC 2013
    takes the longest chain with the attached carbon as low as possible (butan-2-yl). Both are shown.
  - Common prefixes (isopropyl, *sec*-butyl) are used alongside the systematic ones.
  - "3-methylcyclohex-1-ene" is written in full, and the page notes that the "1" is often dropped.
  - Xylene is used as an everyday name for dimethylbenzene. It is not a 2013 preferred name.
  - Ortho, meta and para are taught alongside 1,2-, 1,3- and 1,4-. IUPAC 2013 prefers the numbers.
- **Decided (owner, 2026-09-24):** keep the classic conventions as the primary teaching, with IUPAC
  2013 shown alongside, as the pages have it.

### stereo-before-stereochemistry: E/Z implied by a drawing
- **Status:** pending review.
- **Where:** `naming-parent-chain`.
- **Note:** but-2-ene is drawn as a zigzag, which is the E isomer, but named without E/Z, because
  stereochemistry comes later in the course. Accept this, or redraw it as a neutral straight line?

### ethyl-acetate-smell: "pear-drop smell"
- **Status:** decided.
- **Where:** `functional-groups`, group table.
- **Decided (owner, 2026-09-24):** cut it. The pear-drop smell is usually attributed to isoamyl acetate,
  not ethyl acetate. The table now reads "Ethyl acetate, a solvent in nail polish".
