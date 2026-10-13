"""python3 render_long.py <id> [workers]  -> out/<id>/final.mp4 (parallel segments, then audio mux)"""
import sys, json, subprocess, os, math
vid = sys.argv[1]; W = int(sys.argv[2]) if len(sys.argv) > 2 else 2
d = f"/home/claude/lp/out/{vid}"; meta = json.load(open(f"{d}/meta.json"))
N = round(meta["total"] * 30); step = math.ceil(N / W)
procs = []
for i in range(W):
    f0, f1 = i * step, min(N, (i + 1) * step)
    procs.append(subprocess.Popen(["node", "render_long.js", d, "seg", str(f0), str(f1), f"{d}/seg{i}.mp4"], cwd="/home/claude/lp"))
for p in procs: assert p.wait() == 0
open(f"{d}/segs.txt", "w").write("".join(f"file 'seg{i}.mp4'\n" for i in range(W)))
subprocess.run(f'ffmpeg -y -loglevel error -f concat -safe 0 -i "{d}/segs.txt" -i "{d}/mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "{d}/final.mp4"', shell=True, check=True)
print("done", f"{d}/final.mp4")
