import sys; sys.path.insert(0, '/home/claude/plane')
import skia
from airman2 import Airman, Pose, P, C
from PIL import Image
A = Airman(0.55)
W, H = 2800, 1000
s = skia.Surface(W, H); c = s.getCanvas(); c.clear(C((140, 138, 134))); c.drawRect(skia.Rect(0, 900, W, H), P((120, 118, 114)))
g = 900
poses = [
  Pose(x=140, ground=g),                                                                     # standing, as the sheet
  Pose(x=420, ground=g, uarm_n=82, elbow_n=8, hand_n='point', neck=-4, uarm_f=-8, elbow_f=20),  # pointing at the plane
  Pose(x=700, ground=g, uarm_n=108, elbow_n=103, hand_n='flat', wrist_n=-80, neck=-6),  # shading his eyes
  Pose(x=2440, ground=g, uarm_n=8, elbow_n=4, hand_n='relaxed', neck=22, look=0.6, smile=0.9, lean=4),  # looking down, relaxed
  Pose(x=980, ground=g, uarm_n=30, elbow_n=100, hand_n='grip', neck=18, uarm_f=26, elbow_f=96, hand_f='grip'),  # reading a clipboard
  Pose(x=1260, ground=g, lean=8, uarm_f=150, elbow_f=26, hand_f='flat', uarm_n=10, elbow_n=30, neck=-16),         # reaching up to a hole
  Pose(x=1560, ground=g, thigh_n=26, knee_n=-6, ank_n=-18, thigh_f=-16, knee_f=-26, ank_f=10, uarm_n=-18, elbow_n=30, uarm_f=20, elbow_f=26, lean=4),  # walking, contact
  Pose(x=1840, ground=g, thigh_n=4, knee_n=-34, thigh_f=0, knee_f=-2, uarm_n=2, elbow_n=26, uarm_f=-2, elbow_f=24, lean=4),       # walking, passing
  Pose(x=2160, ground=g, face=-1, uarm_n=40, elbow_n=70, hand_n='relaxed', neck=12, smile=0.8),                                    # facing left, relaxed
]
for p in poses: A.draw(c, p)
s.makeImageSnapshot().save('lineup2.png')
ref = Image.open('ref/profile.png').resize((180, 690)); im = Image.open('lineup2.png')
sheet = Image.new('RGB', (W + 220, H), (140, 138, 134)); sheet.paste(ref, (10, 210)); sheet.paste(im, (220, 0)); sheet.save('lineup2_cmp.png')
