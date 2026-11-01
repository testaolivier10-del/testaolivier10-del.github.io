# Making a new cast with cperson

Every story gets its own people. The kit (`cperson.py`, `walk.py`) stays the same; only the parameters change.
Reference: `ctchars.py` builds the w1031 casts this way.

## 1. Reference sheets (model sheets only, never traced)
- Make one Gemini sheet of the scene's people in the house style (style guide section 6 prompt block, Figma AI
  `generate_image`, model gemini). Save it under `ref/`.
- Make one head turnaround per main person: front, three quarter, profile, plus three expressions the story needs
  (example: `ref/heads_gage.png`). Name every colour in the prompt.
- Read off: build, height, head size, jaw and chin, nose type, hair style and colour, beard, skin, every garment colour
  (base and shade), hat type, and the light direction.

## 2. One Spec per person
```python
NURSE = Spec(name='nurse', height=0.95, build=0.9, head=1.05, jaw=0.85, chin=0.1, nose='button', eye=1.05,
             skin=(..), skin_sh=(..), hair=(..), hair_sh=(..), hair_style='bun', lips=True,
             top=dict(kind='shirt', col=(..), sh=(..), sleeves='short', collar=True),
             trousers=dict(col=(..), sh=(..), loose=1.0), boots=dict(col=(..), sh=(..), sole=(..), kind='shoe'),
             hat=None, gloves=None)
P_NURSE = Person(NURSE)
```
- Garments: `top.kind` shirt, tee, puffer, suit, coat; `sleeves` long, rolled, short; `vest`, `suspenders`, `belt`,
  `stripes` (suit reflective bands), `patch`, `gloves`; `hat.kind` brim, flatcap, beanie, helmet (`lamp=True`).
- Face: `nose` straight, round, hook, button; `nose_size`, `eye`, `brow`, `beard` full or short, `scar`, `blush`,
  `mouth_col`. Hair: short, side_part, cropped, bun, ponytail, curly, none.
- Make people differ in silhouette first (height, build, belly, shoulders, hat), then colour, then face.
- Check them side by side on a sheet like `cpwork/cast.py` before posing.

## 3. Poses
A `Pose` is the pelvis position and scale, `face` (+1 right, -1 left), `yaw` (0 profile, 1 front), `lean`, `hunch`,
head (`head_yaw`, `head_face`, `nod`, `roll`, `neck_lean`), limbs and expression:
- Arms: `('ang', shoulder, elbow[, outward])` or `('ik', (x, y), prefer_dir)`; hands relaxed, fist, grip, open,
  gesture, flat (`hand_rot_*` turns them).
- Legs: `('ang', ...)`, `('ik', ankle, prefer)`, or `('fk2', thigh_deg, shin_deg)` for kneeling and hanging;
  `Person.kneel_hip_y()` puts a kneeling knee on the ground; `standing_hip()` for standing.
- Expression: `brow_ang` > 0 lifts the inner brow ends (worried, sad), < 0 lowers them (focus, anger; use sparingly),
  `brow_up`, `eyes` open, half, squint, closed, `blink` (use `blink_at(t)`), `look`, `mouth` closed, talk (+ `talk`
  0..1), open, wince, sad, frown, smile.
- Pose in the coordinate frame of the scene's reference sheet, so props and the build line up; draw with
  `Person.draw(c, pose, Light(sd=toward_key_light, rim=rim_colour, tint=dusk_tint))`.
- Draw order between people and props: draw the back person first; to put a prop between a body and its arms use
  `skip=('arm_n', 'arm_f')` and then `draw_arm` (see the sled in `ctchars.py`).

## 4. Walks
```python
g = Gait(P_NURSE, s, x0, ground_y, dir=-1, v=60, style='slow')   # walk, slow, trudge, pull
fields, feet = g.state(t)                                          # copy fields into the Pose
print(gait_check(record(g, 0, 3), -1, ground_y))                    # must be ok
```
The stance foot is locked in world space, the swing foot only moves forward; never animate feet with a sine.

## 5. Checks before rendering
1. Stills next to the reference sheet (`cpwork/cmp.py`) and in the scene (`build.py --stills ...`).
2. Faces at phone size: eyes read (white plus pupil), brows match the story beat, nobody looks sinister by accident.
3. Green screen gap scan (`cpwork/green.py`): no enclosed background pockets inside one figure.
4. `gait_check` ok for every walk; feet stay on the ground line.
5. Time per frame (about 0.04 s per person at 1080x1920 on the cloud box).
