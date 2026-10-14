# LevlPrep real sound effects (all CC0 from Freesound: no credit needed, fine for monetized videos)
setup.sh copies these into /home/claude/lp/assets/, so use them by name with c.sound("<name>", t, gain).
Mono 44.1 kHz, leading silence trimmed, peak about -3 dBFS (fire and bubbling are loudness-matched beds).
Prefer these over the synthesized sfx.py sounds whenever one fits; sfx.py stays for UI sounds (swish, pop, tick, ding, riser, check, wrong).

| name | use | length |
|---|---|---|
| ignite_real | match strike, fire starting | 2.1 s |
| fire_real | crackling fire bed (loop or trim) | 11.4 s |
| sizzle_real | hot pan, burn contact | 2.5 s |
| heartbeat_real | heartbeat | 2.4 s |
| monitor_beep_real | patient monitor beeps | 3.1 s |
| siren_real | emergency siren passing (doppler) | 5.6 s |
| water_pour_real | pouring water, cooling a burn, irrigation | 2.7 s |
| splash_real | splash | 1.9 s |
| glass_clink_real | glassware, lab bench | 1.2 s |
| bubbling_real | boiling or bubbling liquid, reactions | 7.9 s |
| cloth_real | clothing movement, removing clothing | 0.8 s |
| pen_scratch_real | writing on paper, studying | 1.1 s |
| page_flip_real | turning a page | 1.3 s |
| gasp_female_real / gasp_male_real | person reacting | about 1 s |
| cough_real | cough | 1.1 s |
| door_close_real | door | 1.2 s |
| whoosh_real | short whoosh | 0.2 s |
| run_steps_real | running footsteps (loop every 3.2 s) | 3.3 s |
| crowd_cheer_real | stadium crowd cheer | 4.1 s |
| breath_female_real | woman breathing hard after running | 4.1 s |

Adding more: Freesound refuses the cloud workspace, so search and download on Olivier's laptop with device_bash
(key in ~/mnt/Downloads/levlprep/freesound_key.txt, read only inside commands; CC0 filter; previews["preview-hq-mp3"]),
stage the mp3s into the workspace, convert to mono 44.1 kHz wav, trim leading silence, normalize, add a row here and to
freesound.json, and push to sfx/ on the media branch.
