#!/bin/bash
# Pro Shorts thumbnail kit: Pillow, OpenCV and rembg (the isnet model downloads on first use, about 180 MB).
pip install -q --break-system-packages "rembg[cpu]" opencv-python-headless pillow numpy 2>/dev/null
python3 -c "import rembg, cv2; print('thumbpro ready')"
