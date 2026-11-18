cd /home/claude/w1118/stack
python3 /home/claude/lp/motion_qc.py out/final.mp4 --out out/motion_qc > out/motion_qc.log 2>&1
mkdir -p out/strips && ffmpeg -y -loglevel error -i out/final.mp4 -vf "fps=4,scale=270:-1,tile=8x4" out/strips/s%02d.jpg
echo GATES_OK
