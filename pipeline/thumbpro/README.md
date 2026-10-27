# Pro Shorts thumbnails (the standard since 2026-10-26, approved by Olivier)
thumbpro.py is the kit (recipe in its docstring). Fonts: Anton and Montserrat (OFL, licences in fonts/) ship in fonts/. Setup: bash setup_thumbpro.sh. Cut a hero: cut.py. Cutouts: pip install "rembg[cpu]", model isnet-general-use,
on a clean frame of the video's own art (ffmpeg -ss), then keep the largest connected component and open the mask to drop thin
background slivers. w1025/ holds the cutouts, the build script and both concepts per Short (picked: lift a, throw a, lake a, rush b).
