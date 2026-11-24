# Plan: Organic Chemistry, Spectroscopy Lab (tools v2)

## Tool and page
- Page `ochem/tools/spectroscopy.html` (registry slug `spectroscopy`). Script `ochem/assets/tools/spectroscopy.js`
  (1,699 lines, 107 KB) on the course layer plus `mol-builder.js` and `tool-handoff.js`.
- **Premium** (not in `FREE_TOOLS`).
- Rollout row 43, group S (sound and recognition trainers), size restyle (the control is already the spectrum;
  IR and NMR are two lessons behind a switch). Unchanged on `claude/tools-v2-all`.

## The one idea
Each feature of a spectrum comes from one part of the molecule. Two tabs:
1. **IR**: each kind of bond absorbs at its own wavenumber (scan along the spectrum, that bond vibrates).
2. **¹H NMR**: each set of equivalent H gives one signal, split by its neighbours into n + 1 lines.

## Research
- [Making molecules vibrate (EPFL, chemRxiv)](https://chemrxiv.org/engage/chemrxiv/article-details/61643d400ad1ff4a0291a99e):
  a web app where choosing an IR band animates the vibration on a 3D molecule. Take: the band and the moving bond
  are one object; the stretch is animated, not described.
- [ULgSpectra (J. Chem. Educ.)](https://orbi.uliege.be/bitstream/2268/221092/1/Article_ULgSpectra_JChemEduc.pdf):
  linked structure and spectrum, tap a signal to light its atoms. Take: two way linking (tap the H or the peak).
- SDBS (AIST) and the ChemDoodle spectrum viewer (group S row): real spectra and zoom on a region. Take: a check of
  every drawn band position against a real spectrum. Seen as text only; the builder opens all three.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Mode Read a spectrum: compound chips (6 shown, 18 in `COMPOUNDS` behind "Other compounds"), IR chart with tappable peaks and IR note, NMR chart with tappable signals or atoms and link note, degrees of unsaturation disclosure | Explore tabs IR and NMR (6 curated compounds each, the rest in a quiet picker); degrees of unsaturation goes to Test yourself "Identify it" and "?" |
| Predict your own (mol builder, `spBuildToggle`) and the handoff in (`?build=`) and out (`mountSend`) | Explore "Your own" chip at the end of the compound picker (opens the builder over the picture); `?build=` still opens it |
| Mode Identify it: formula, IR, NMR, four candidates or Draw it, New unknown, score | Test yourself part "Identify it" unchanged |
| Mode Reference: IR bands (`IR_BANDS`) and NMR zones (`NMR_ZONES`), tap a band or zone | "?" (the tap-to-read charts), and each band name is the label Explore shows |
| Check yourself quiz (6 rounds) | last Test yourself part (`check`) |
| `OchemToolState` keys `mode`, `c` | `?mode=puzzle` opens Identify it, `?mode=ref` opens "?", `?c=<id>` opens Explore on that compound |
| Caveats under Why? | "?" |

## Design
- **Picture (IR):** the molecule large, drawn as ball and stick in 2D with element colours, above its IR spectrum
  across the full width (transmittance dips, real band shapes from the existing Gaussians). A scan knob on the
  spectrum (`K.handle` along the wavenumber axis). When the knob sits in a band, that bond on the molecule stretches
  back and forth at a visible rate (O–H broad: many bonds, smeared; C=O sharp: one bond, fast) and the band fills
  in its idea colour. Bands also tap (`K.spots`, as the group row says for spectra).
- **Picture (NMR):** the molecule above the ¹H spectrum. Tap a signal or an H: the equivalent H glow in one colour,
  their neighbours glow faintly, and the signal opens from one line into its n + 1 lines (a small splitting tree
  that grows down from the peak). Integration as stacked H dots over each signal (3, 2, 1), not a number column.
- **Main control:** the scan knob (IR), a tap on a signal or an H (NMR). Secondary and quiet: the compound picker.
- **Cause line:** IR "C=O bond stretches → absorbs at 1715 cm⁻¹ → sharp, strong band". NMR "CH₃ next to CH₂
  (2 H) → 2 + 1 = 3 lines → triplet at 1.2 ppm".
- **Takeaway:** "One bond, one band" (IR); "Neighbours, plus one, gives the lines" (NMR).
- **Presets** (each shows something): IR ethanol, acetone, acetic acid, hexyne, acetonitrile, ethylamine; NMR
  ethyl acetate, isopropanol, toluene, p-xylene, benzaldehyde, ethylamine.
- **Outside the picture:** two tabs, purpose line, cause line, the quiet picker. About 25 words.

## Science to verify
- Every IR band range and shape in `IR_BANDS` and for each preset (O–H 3200 to 3600 broad; acid O–H 2500 to 3300;
  C=O ketone about 1715, ester about 1740, acid about 1710, aldehyde about 1725; C≡N 2220 to 2260; ≡C–H about 3300;
  primary amine two N–H bands): Klein ch. 14 table; Pavia, Introduction to Spectroscopy; spot check each preset on
  SDBS.
- Every ¹H shift and multiplicity in `NMR_ZONES` and the presets (aldehyde H 9 to 10; aromatic 6.5 to 8; ester
  OCH₂ about 4.1); n + 1 holds only for equivalent neighbours with similar J (about 7 Hz): Klein ch. 15.
- OH and NH signals: usually broad singlets with no splitting (exchange); the picture must not split them.
- Vibration rate drawn: relative only (stronger bonds and lighter atoms vibrate faster); say so in "?".
- Degrees of unsaturation (2C + 2 + N − H − X) / 2.

## Reuse
- `OchemStudioKit.kit2`; `kit2: true` on the registry entry; the page's Check yourself quiz as the last part.
- The existing spectrum drawing, `COMPOUNDS`, `NMR_ATOMS` links and the mol builder; `K.spots` for bands and
  signals; `K.handle` for the scan knob; the turning molecule pattern of the v2 3D viewer if a 3D look is wanted.

## Risks reviewers will likely block on
- Two charts and a molecule on a phone: one tab shows one spectrum only, the molecule above it; wavenumber ticks
  at 11 px or more (thin them, never shrink them).
- The vibrating bond and the band must change on the same frame (rule 14); no stretch while the knob is between
  bands.
- Labels on dense NMR regions (aromatic multiplets) colliding; group them under one label.
- Performance of re-drawing the full spectrum on every knob move: draw it once, move only the knob and the fill.
- Weight: split Explore into its own file (`spectroscopy-explore.js`) and bucket.
