#!/bin/bash
# fix round: render only the shots that changed, two processes
cd /home/claude/w1111/tide
(python3 render2.py 0 118 out/n_a.mp4 > out/r1.log 2>&1; python3 render2.py 323 660 out/n_c1.mp4 >> out/r1.log 2>&1) &
(python3 render2.py 660 974 out/n_c2.mp4 > out/r2.log 2>&1; python3 render2.py 1043 1182 out/n_e.mp4 >> out/r2.log 2>&1) &
wait
echo RENDER_OK > out/render2.status
