# Painted paramedic (style B), rigged 2026-10-21
- source_painting.png: the painting (1088x960, plain background). It was painted alone on a flat background, which the new rule forbids for final art; repaint her inside a full lit scene and split again before a final video, using the same method.
- body.png (crop at 201,117 in the painting) and arm.png (crop at 541,261): layers. Arm = painting minus a "same image without the arm" repaint, plus the upper arm within 40 px of its bone. Body = the painting with the repaint only behind the arm.
- rig.json: bones (screen coords = 202 + 0.95 x painting coords, 126 + 0.95 y) and the paint mesh for paintskin.js (images embedded). rig_demo.html shows it on the garage background (lean in, press pumps, breathing).
