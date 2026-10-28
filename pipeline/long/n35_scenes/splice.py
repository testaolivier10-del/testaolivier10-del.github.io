"""Assemble render/silent.mp4 from base renders and patch renders (later entries win), frame exact."""
import subprocess, os
R = '/home/claude/n35/render/'
N = 24542
SRC = [('f1.mp4', 0, 2000), ('f2.mp4', 2000, 11500), ('f3.mp4', 11500, N),
       ('y1.mp4', 313, 1050), ('y2.mp4', 1050, 1780), ('y3.mp4', 2712, 2950), ('y4.mp4', 3680, 4100), ('y5.mp4', 11020, 11435),
       ('y6.mp4', 15045, 15330), ('y7.mp4', 23940, N)]
owner = [None] * N
for i, (f, a, b) in enumerate(SRC):
    for g in range(a, b):
        owner[g] = i
runs = []
g = 0
while g < N:
    i = owner[g]; h = g
    while h < N and owner[h] == i:
        h += 1
    runs.append((i, g, h)); g = h
parts = []
for k, (i, g0, g1) in enumerate(runs):
    f, a, b = SRC[i]
    out = f'{R}piece_{k:03d}.mp4'
    if g0 == a and g1 == b:
        parts.append(R + f); continue
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', R + f, '-vf', f'trim=start_frame={g0 - a}:end_frame={g1 - a},setpts=PTS-STARTPTS',
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', out], check=True)
    parts.append(out)
open(R + 'list.txt', 'w').write(''.join(f"file '{p}'\n" for p in parts))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', R + 'list.txt', '-c', 'copy', R + 'silent.mp4'], check=True)
n = subprocess.run(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0',
                    R + 'silent.mp4'], capture_output=True, text=True).stdout.strip()
print('runs', len(runs), 'frames', n)
