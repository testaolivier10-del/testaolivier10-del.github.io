#!/bin/bash
cd /home/claude/w1111/smog
(nice -n 5 python3 render2.py 0 290 out/n1.mp4 > out/n1.log 2>&1) &
(nice -n 5 python3 render2.py 290 402 out/n2.mp4 > out/n2.log 2>&1; nice -n 5 python3 render2.py 760 800 out/n3.mp4 > out/n3.log 2>&1; nice -n 5 python3 render2.py 1183 1320 out/n4.mp4 > out/n4.log 2>&1) &
wait
echo SEG_OK
