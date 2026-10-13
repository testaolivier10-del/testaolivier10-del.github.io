# LevlPrep character library

Reusable characters, generated with Figma Weave (Nano Banana 2.1, about 10 credits per image) in a clean flat explainer style.
Each pose has the original green screen image (*-green.png, 2400x1792) and a keyed transparent version (1200x896, same framing).
Key new poses with pipeline/chroma.py: python3 chroma.py in.png out.png 1200 nocrop

New poses of an existing character: run the Weave edit model with the reach pose as the input image and a prompt that keeps the same man, style, clothes, framing and green background and changes only the pose. Always keep the same framing so poses swap without a jump.

| file | character | pose |
|---|---|---|
| patient-a-reach | Patient A: man mid 20s, short dark brown hair, mustard knit sweater, side view facing right, waist up | leaning forward, right arm reaching out, open hand |
| patient-a-recoil | Patient A | startled recoil, arm yanked back to the chest, mouth open |

## Added 2026-10-12 (Figma AI, gemini-3.1-flash-image, character sheets cropped per pose; keyed with chroma.py and cropped to the figure, so sizes differ)
Sheets: *-sheet-green.png (1376x768). Prompt style: the quality v2 wording plus "Character sheet: the same <person> shown in N poses side by side, evenly spaced, same outfit, same scale, full body".

| file | character | pose |
|---|---|---|
| frank-chest | Frank: man about 62, short grey hair, grey stubble, slightly heavy build, light blue button up shirt with rolled sleeves, dark navy trousers, brown shoes; wooden dining chair; side view facing right | seated, fist pressed to the center of his chest, pale and sweaty |
| frank-slump | Frank | slumped sideways in the chair, eyes closed, unresponsive |
| frank-floor | Frank | lying flat on his back, head to the left, eyes closed |
| maya-phone | Maya: woman about 30, warm brown skin, dark curly hair in a ponytail, mustard yellow sweater, dark jeans, white sneakers; facing right | standing, phone to her ear, worried |
| maya-cpr | Maya | kneeling, arms straight, leaning forward (hands low; pair with frank-floor for compressions) |
| maya-relief | Maya | standing, hand on her chest, relieved |
| emd-typing | Dispatcher: man about 40, short black hair, light beard, navy polo, black headset, at a desk with two monitors, facing right | typing while listening |
| emd-talking | Dispatcher | leaning to the mic, hand raised, giving instructions |
| emts-walk | Two EMTs: woman about 35 with blond bun, man about 28 with dark skin and short hair; navy EMS uniforms with reflective stripes, blue gloves, no logos | walking right, red jump bag and yellow AED case |
| emts-cpr | Two EMTs | man doing compressions, woman with a bag valve mask, on a shirtless young patient (NOT Frank; avoid when continuity matters) |
