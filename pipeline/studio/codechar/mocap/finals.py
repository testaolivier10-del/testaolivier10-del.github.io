import sys, subprocess, json
sys.path.insert(0,'/home/claude/mocap'); sys.path.insert(0,'/home/claude/rig'); sys.path.insert(0,'/home/claude/trace')
import numpy as np, skia
from PIL import Image
import model, acting, mocap_perf as MP, demo, render
FONT = skia.Typeface.MakeFromFile('/usr/share/fonts/opentype/inter/Inter-Black.otf')
def enc(out, W_, H_):
    return subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','bgra','-s',f'{W_}x{H_}','-r','60','-i','-',
        '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',out],stdin=subprocess.PIPE)
def tag(c, text):
    f=skia.Font(FONT,40); w=f.measureText(text)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(24,24,24+w+48,92),20,20),skia.Paint(AntiAlias=True,Color=skia.Color(5,12,26,215)))
    c.drawString(text,48,72,f,skia.Paint(AntiAlias=True,Color=skia.ColorWHITE))
def walk_compare(out='/home/claude/mocap/walk_old_vs_new.mp4', dur=5.5, sc=0.84):
    # left: hand written walk (rules), right: recorded human walk; both start from standing, camera follows
    rigA, specA, *_ = model.build(); PA = acting.Performer(rigA, specA)
    rigB, specB, *_ = model.build(); rigB.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
    PB = MP.MocapPerformer(rigB, specB, lambda t: [('walk', demo.WALK, 0.85 + t, 1.0)], ground_take=demo.WALK)
    for i in range(int(5.6*60)): PA.pose(i/60, acting.script)          # bring the hand written one to its walk start
    p = enc(out, 2160, 1080); camA = camB = 0
    for i in range(int(dur*60)):
        t = i/60
        WA = PA.pose(5.6 + t, acting.script); WB = PB.pose(t)
        camA += (PA.x*sc - camA)*0.08; camB += (PB.x*sc - camB)*0.08
        frames = []
        for rig, P, cam, W, lab in ((rigA, PA, camA, WA, 'OLD: hand written walk'), (rigB, PB, camB, WB, 'NEW: real recorded walk')):
            s = skia.Surface(1080,1080); c = s.getCanvas(); c.clear(skia.Color(205,205,205))
            xf = np.array([[sc,0,460-cam],[0,sc,519],[0,0,1.]])
            gy = 519 + sc*(P.ground + model.ANKLE_H)
            # ground ticks so travel and foot sliding are visible
            for gx in range(-2000, 6000, 160):
                x = 460 - cam + gx*sc
                if -20 < x < 1100: c.drawLine(x, gy, x, gy+26, skia.Paint(Color=skia.Color(150,150,150), StrokeWidth=3))
            c.drawLine(0, gy, 1080, gy, skia.Paint(Color=skia.Color(150,150,150), StrokeWidth=2))
            rig.draw(c, W, xf); tag(c, lab)
            frames.append(s.makeImageSnapshot().toarray())
        p.stdin.write(np.concatenate(frames,1).tobytes())
    p.stdin.close(); p.wait()
def park_performance(out='/home/claude/mocap/paramedic_wave_walk_park.mp4', dur=6.9):
    bg = render.bg_image('/tmp/m/characters/style_b/w1021/v2_park_bg.png', (1080, 1920))
    g = demo.run(out, dur=dur, scale=1.07, size=(1080,1920), origin=(230,1307), bg=bg, follow=False, blinks=(0.9,3.6,5.6))
    print('park gaps', g)
walk_compare(); park_performance()
