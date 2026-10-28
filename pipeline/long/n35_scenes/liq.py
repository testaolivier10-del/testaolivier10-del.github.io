"""All liquid simulations for n35 (studio liquid.py), rendered once to PNG frames in /home/claude/n35/liq/<name>/."""
import sys, os, json
sys.path[:0] = ['/home/claude/n35', '/home/claude/lp']
import numpy as np
import geo
from studio import liquid as L
P = geo.P
OUT = '/home/claude/n35/liq'
TOP = [P(400, 252), P(470, 248), P(540, 243), P(620, 235), P(700, 223), P(760, 219)]
BOT = [P(760, 389), P(700, 387), P(620, 380), P(540, 371), P(460, 362), P(400, 360)]
WOUND = P(548, 241)


def arm_sim(ppm=2600):
    s = L.Sim(W=1920, H=1080, fps=30, px_per_m=ppm, r=6.0)
    s.add_surface(TOP, kind='skin')
    s.add_face(TOP + BOT, drag=7.0, gravity=0.22)
    return s


def hook_cu():
    s = arm_sim()
    # blood forced out past both edges of the gauze with every beat (the gauze itself is stained in code)
    s.add_emitter(L.arterial(*P(474, 244), angle=-150, bpm=118, peak_speed=1.5, base=0.25))
    s.add_emitter(L.arterial(*P(626, 238), angle=-35, bpm=118, peak_speed=0.9, base=0.15))
    return s, 12.5, L.ARTERIAL


def r1_art():
    s = arm_sim()
    s.add_emitter(L.arterial(*WOUND, angle=-100, bpm=110, peak_speed=2.6, base=0.12))
    return s, 19.5, L.ARTERIAL


def r2_ven():
    s = arm_sim()
    s.add_emitter(L.venous(*WOUND, angle=60, speed=0.25))
    return s, 10.0, L.VENOUS


def r2_cap():
    s = L.Sim(W=1920, H=1080, fps=30, px_per_m=2600, r=5.0)
    s.add_surface(TOP, kind='skin')
    s.add_face(TOP + BOT, drag=22.0, gravity=0.05)
    e = L.capillary(*P(470, 262), 120, stop=5.2); e.rate = lambda t: 16
    s.add_emitter(e)
    return s, 8.2, L.VENOUS


def w3_tq():
    # spurting slows and stops as the windlass is turned (stop at 7.0 s into the clip: the cue lands there)
    s = arm_sim()
    e = L.arterial(*WOUND, angle=-100, bpm=110, peak_speed=2.4, base=0.12, stop=7.2)
    s.add_emitter(e)
    return s, 13.0, L.ARTERIAL


def wide():
    """Garage wide shot: blood forced past her hands at his forearm, dripping to the floor and pooling."""
    import json as _j
    g = _j.load(open('/home/claude/n35/wide_geo.json'))
    s = L.Sim(W=1920, H=1080, fps=30, px_per_m=780, r=4.0)
    wx, wy = g['wound']
    s.add_emitter(L.arterial(wx - 6, wy + 4, angle=150, bpm=118, peak_speed=0.9, base=0.3, stop=28.0))
    s.add_floor(g['floor'] - 6, depth=10, persp=0.22, spread=1.3)
    return s, 32.0, L.ARTERIAL


SIMS = dict(hook_cu=hook_cu, r1_art=r1_art, r2_ven=r2_ven, r2_cap=r2_cap, w3_tq=w3_tq, wide=wide)

def s1_slap():
    """Spurting, then the gloved hand lands on the wound at 3.1 s: the spurt stops, a little seeps out at the edge."""
    s = arm_sim()
    s.add_emitter(L.arterial(*WOUND, angle=-100, bpm=110, peak_speed=2.6, base=0.12, stop=3.1))
    s.add_emitter(L.venous(*P(470, 252), angle=150, start=3.3, stop=6.0, speed=0.12))
    return s, 11.0, L.ARTERIAL


def peel():
    """The dressing corner is peeled up: the clot tears and it spurts again for a moment."""
    s = arm_sim()
    s.add_emitter(L.arterial(*P(474, 244), angle=-150, bpm=118, peak_speed=1.4, base=0.2, start=0.4, stop=3.2))
    return s, 9.0, L.ARTERIAL


SIMS.update(s1_slap=s1_slap, peel=peel)


if __name__ == '__main__':
    names = sys.argv[1:] or list(SIMS)
    for n in names:
        s, dur, st = SIMS[n]()
        s.run(dur)
        k = L.render(s, f'{OUT}/{n}', style=st)
        print('sim', n, k, flush=True)


