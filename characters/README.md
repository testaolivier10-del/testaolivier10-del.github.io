# LevlPrep character library

Reusable characters, generated with Figma Weave (Nano Banana 2.1, about 10 credits per image) in a clean flat explainer style.
Each pose has the original green screen image (*-green.png, 2400x1792) and a keyed transparent version (1200x896, same framing).
Key new poses with pipeline/chroma.py: python3 chroma.py in.png out.png 1200 nocrop

New poses of an existing character: run the Weave edit model with the reach pose as the input image and a prompt that keeps the same man, style, clothes, framing and green background and changes only the pose. Always keep the same framing so poses swap without a jump.

| file | character | pose |
|---|---|---|
| patient-a-reach | Patient A: man mid 20s, short dark brown hair, mustard knit sweater, side view facing right, waist up | leaning forward, right arm reaching out, open hand |
| patient-a-recoil | Patient A | startled recoil, arm yanked back to the chest, mouth open |
