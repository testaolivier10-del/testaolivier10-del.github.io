# LevlPrep Lottie effects

Free animations from LottieFiles, all under the Lottie Simple License (free for commercial use, no attribution required).
Fetched 2026-10-17 through the Claude app browser on Olivier's laptop (lottiefiles.com is blocked from the cloud workspace),
from each animation's public preview file. Use them with pipeline/lottiefx.py (frame exact, driven by the GSAP timeline).

Only keep effects that match the flat LevlPrep look. Recolor to the LevlPrep palette with lottiefx.place(..., recolor={...}).

| short name | file | source page | author | what it is | good for |
|---|---|---|---|---|---|
| sparkle-stars | sparkle-stars-Z4URVaAq6R.json | lottiefiles.com/free-animation/sparkle-stars-Z4URVaAq6R | Ben | yellow four point stars twinkling in | the payoff or a memory trick landing, a correct answer |
| idea-bulb | idea-bulb-QT00q9HsP4.json | lottiefiles.com/free-animation/idea-bulb-QT00q9HsP4 | Arpan | line art bulb that draws in and lights up | a character's aha moment (above their head) |
| alert-dot | connection-error-IifZWvcuUv.json | lottiefiles.com/free-animation/connection-error-IifZWvcuUv | Lorena Villanueva García | pulsing round "!" | a common mistake or exam trap callout (recolor to coral #ff6b6b) |
| warning | errorwarning-ybiaGTeYHl.json | lottiefiles.com/free-animation/errorwarning-ybiaGTeYHl | Mehran | bold "!" in a ring that bounces in | a bigger warning beat |
| ecg | ecg-nFJKmPyH46.json | lottiefiles.com/free-animation/ecg-nFJKmPyH46 | Aneesh Ravi | thin ECG trace drawing across | inside a monitor prop (a real rhythm only if the trace is accurate for it) |
| stars-gold | stars-gold-TgDsvafIZt.json | lottiefiles.com/free-animation/stars-gold-TgDsvafIZt | Hunter Paramore | one small gold star | weak at video size; prefer sparkle-stars |

To add more: open the animation page in the Claude app browser, read its assets-v2.lottiefiles.com .lottie preview URL from the page, fetch it in the page, return it base64, then unzip animations/*.json into this folder. Check the page says "Free to use under the Lottie Simple License" and skip premium (crown) items.
