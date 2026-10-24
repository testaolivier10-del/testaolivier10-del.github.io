import sys, json, subprocess
sys.path.insert(0, '/home/claude/rig')
import render, model
rn = render.run(model, '/tmp/new_code.mp4', scale=0.84, origin=(300, 519), label='NEW: traced, redrawn in code')
bg = render.bg_image('/tmp/m/characters/style_b/w1021/v2_park_bg.png', (1080, 1920))
rp = render.run(model, '/home/claude/trace/paramedic_park.mp4', size=(1080, 1920), scale=1.07, origin=(330, 1307),
                bg=bg, follow=False)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', '/tmp/old_cut.mp4', '-i', '/tmp/new_code.mp4',
                '-filter_complex', 'hstack=inputs=2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
                '-pix_fmt', 'yuv420p', '/home/claude/trace/compare_old_vs_new.mp4'], check=True)
old = json.load(open('/home/claude/trace/gap_report.json'))['old']
json.dump(dict(new=rn, park=rp, old=old), open('/home/claude/trace/gap_report.json', 'w'), indent=1)
print(json.dumps(dict(new=rn['frames_with_gap'], park=rp['frames_with_gap'], old=old['frames_with_gap'])))
