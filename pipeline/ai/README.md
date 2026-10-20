# LevlPrep AI art and motion (Modal, free monthly credit)

Two open models run on Olivier's Modal workspace (testaolivier10, Starter plan, $30 free credit a month, spend limit $0, usage limit $30):
- Wan 2.2 image to video (and Wan 2.1 first and last frame): "AI acting shots", about 5 s of real character motion from one still.
- Qwen-Image-Edit-2509: new stills in the house style from reference images (characters, rooms, props, close ups, extending a scene to full height).

## Access in a run
- Laptop files (Downloads\levlprep): modal_endpoint.txt (web address) and modal_endpoint_key.txt (endpoint key). Stage both like the ElevenLabs key: copy to /root/.lpkey/mep and /root/.lpkey/mk, chmod 600. Never print them.
- The cloud workspace cannot use the modal command line (gRPC is blocked); everything goes through the web endpoint with these clients.
- Changing lp_video.py (the Modal app) needs a redeploy from Olivier's Windows laptop: he double clicks Downloads\levlprep\run_modal_setup.bat. Ask him in chat; never try to deploy from the cloud.

## Clients (copy pipeline/ai/ to /home/claude/lp/ai/)
- python3 ai/lpvid.py submit job.json  -> call id. Job: {"mode":"i2v","image":"first.png","prompt":"...","negative":"...","frames":81,"steps":30,"area":540000,"seed":11,"guidance":5.0}. Portrait (Shorts) first frame 544x960; landscape (long videos) 960x544.
- python3 ai/lpvid.py wait <call id> out.mp4   (8 to 10 minutes; run it in the background and keep working)
- python3 ai/lpimg.py job.json outprefix   Job: {"refs":["style_ref.png", ...],"prompts":["..."],"width":1088,"height":960,"steps":40,"cfg":4.0,"seed":21}
- python3 ai/outpaint.py in_1088x960.png out_1088x1920.png "what goes above" "what goes below" [seed]   extends a scene to the full phone frame, keeping the middle untouched.
- Budget (one ledger file per run in /tmp/m/modal_ledger/, with reservations; full procedure in claude/levlprep-ops-common.md):
  python3 ai/ledger.py begin <shorts-sun|shorts-wed|long> auto  before the run's first Modal call (reserves the run's share, pushed so overlapping runs cannot claim the same money);
  python3 ai/ledger.py month  spent, held by other runs, free, and this run's reservation;
  python3 ai/ledger.py end    when the run is done or stops early (releases what it did not spend, commits and pushes this run's file);
  python3 ai/ledger.py sweep  lists stale reservations of crashed runs (released automatically after 12 h idle with no call younger than 2 h).
  The clients refuse a call when the workspace has no reservation (LP_MANUAL=1 allows a hand run in a chat, held to the month's cap) or the call goes past the run's reservation or the $27 monthly cap. Every start and collect is pushed at once. The old shared /tmp/m/modal_ledger.json is history, read but never written.

## Costs (measured 2026-10-18)
- One acting shot: about $0.55 to $0.70 (8 to 10 minutes on an H100).
- One still: about $0.08 to $0.15. Downloads of model weights are one time.
- A hand doing a precise action (thumb press, two fingertips) took about 30 tries before a clean one; budget hand poses into the monthly library session, not mid build.

## Prompts that worked
- Style: always pass a style reference (characters/style_b/style_ref_bold.png or an approved scene) and say "exactly the same flat 2D vector illustration style as the reference image: bold clean geometric shapes, smooth gradients, warm rim light, same level of detail. No text."
- Acting shot: describe ONE simple continuous action, "Static camera, no cuts, no new objects, no text." Negative: "style change, photorealistic, 3D render, flickering, morphing, extra fingers, fused fingers, deformed hands, extra limbs, distorted face, new objects, text, watermark, camera shake, low quality, blurry".
- A second shot that continues the moment: generate it from the LAST frame of the first (ffmpeg -sseof -0.1 ... -frames:v 1).
- Isolated pieces to layer (hands, props, receptors): ask for "a perfectly flat solid pure green background (#00FF00), nothing else, no shadow", key out the green, pull the green spill.
- A precise pose the model will not get from words: draw a crude pose sketch over the scene (code shapes), then ask Qwen to "redraw the crude placeholder hand as a properly drawn hand, same pose and position", then isolate it on green.
- Matching skin tone between two generated hands: shift the Lab color statistics of one to the other (see the t1018 work in pipeline/tests).
