# Flat layered house look (Olivier, 2026-10-25)

References for the house style (claude/levlprep-video-standard.md section 0). Gemini screenshots, about 500x900, for look only.

- ref_courtyard_day.png, ref_emt_night.png, ref_lab.png: scenes in three palettes (day, night, indoor).
- ref_heart.png, ref_neuron.png: diagrams with every part given a colour (no grey).
- ref_heart_labelled.png: labels and flow arrows drawn in code on top (never by Gemini).
- format_*.png: teaching formats (video standard section 7, "Teaching formats"): memory scene, body parts as workers, body as a factory, game battle with a code HUD.
- style_board.png: the comparison board Olivier chose from.

Prompt core (add to every scene or diagram prompt, then name a colour for every part):
"flat layered vector illustration, no outlines, no texture, clean geometric shapes, flat colour with at most two tones per shape,
depth shown by layers getting lighter and hazier with distance, a soft warm rim light on one side, fully in colour, no grey,
no text, no letters"

## w1025 (2026-10-26)
Gemini (Levl Prep account) flat layered scenes from ref_*.png: a_bay_clean (bag cut to a_bag.png, floor filled in code), b_court_wide, c_lawn2, c_lake, c_bloom, c_buffer, d_kitchen, d_body. Cast is the traced code drawn cast.

## n35 (2026-10-27)
Gemini flat scenes for the bleeding control rebuild: g_garage (garage at dusk), g_arm and g_arm_press (forearm close up; l_glove and l_gauze are layers split from them), g_long and g_long_clean (forearm cut open lengthwise; clean = vessels removed so code draws them), g_cross, g_cross_clean, g_cross_rot (cross section, rotated so the radius is on top), g_kitchen, g_body (front view body map), g_cavity and m_channel (deep wound block and its channel mask). Code: pipeline/long/n35_scenes.
