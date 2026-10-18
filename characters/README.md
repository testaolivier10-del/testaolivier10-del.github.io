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

## Added 2026-10-13 (Figma AI, gemini-3.1-flash-image, two character sheets; sheet 2 keyed with pipeline/chroma_soft.py because its green is duller)
Jordan: woman about 20, athletic runner build, light olive skin, dark brown hair in a high ponytail, teal sleeveless running top, black running shorts, white running shoes with teal accents, a plain white race bib with no text; facing right. All poses are at the same pixel scale (place with the same factor, see IMGS in pipeline/long/a01_spec.py).

| file | character | pose |
|---|---|---|
| jordan-sprint | Jordan | sprinting mid stride, determined, sweat drops |
| jordan-bent | Jordan | bent forward, hands on knees, panting |
| jordan-hips | Jordan | standing, hands on hips, relieved smile |
| jordan-shiver | Jordan | standing, shivering, arms wrapped around herself |
| jordan-foot | Jordan | yanking her right foot up as if she stepped on something sharp |
| jordan-drink | Jordan | drinking from a plain teal water bottle |

## Added 2026-10-14 (Figma AI, gemini-3.1-flash-image, one character sheet each; student keyed with pipeline/chroma_soft.py, EMT with chroma.py; each pose cropped from the sheet at the same scale, so poses of one character swap without a jump)
Student prompt: "college student: man about 20, light brown skin, short black curly hair, oversized heather grey hoodie, dark blue jeans, white sneakers", seated on a simple wooden desk chair, facing right.
EMT B prompt: "EMT: woman about 35, light skin, blond hair in a neat bun, navy EMS uniform shirt and navy cargo trousers with silver reflective stripes on the sleeves and legs, blue nitrile gloves, black boots, no logos", kneeling on one knee, facing right (flip it to face left; it has no text so mirroring is safe). Same look as the blond EMT in emts-walk.

| file | character | pose |
|---|---|---|
| student-yawn | Student | slumped, yawning, rubbing one eye |
| student-sip | Student | sipping from a plain white coffee cup |
| student-alert | Student | wide awake, holding the cup |
| emtb-offer | EMT B | kneeling, open hand offering two tablets |
| emtb-chew | EMT B | kneeling, pointing at her mouth ("chew") |
| emtb-pulse | EMT B | kneeling, taking a pulse while checking her watch |

## Added 2026-10-17 (Figma AI, gemini-3.1-flash-image, one run cycle sheet in Figma file "LevlPrep character art" 2lhxP8MDFrbTTR5f43Tmu9; keyed with pipeline/chroma.py, each frame cut 420x672 and aligned on the torso so frames swap without a jump)
Jordan run cycle, same description as Jordan above, side view facing right. Note: her face is drawn in a slightly different (profile) style from the older Jordan poses; when she runs, use these frames, and prefer generating matching still poses from this sheet's look for new Jordan scenes.

| file | character | pose |
|---|---|---|
| jordan-run1 | Jordan | run cycle frame 1: contact (front heel down) |
| jordan-run2 | Jordan | run cycle frame 2: passing (body low) |
| jordan-run3 | Jordan | run cycle frame 3: push off (front knee high) |
| jordan-run4 | Jordan | run cycle frame 4: flight (both feet off the ground) |
Play with rig.cycle_svg + rig.cycle at about 10 frames per second.
