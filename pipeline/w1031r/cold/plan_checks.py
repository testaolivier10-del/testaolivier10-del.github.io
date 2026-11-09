"""story.json and shots.json for w1031-01-cold-heart (pattern: pipeline/w1104/plan_checks.py)"""
import sys, json
sys.argv = ['x']
import build as B
OUT = B.OUT
def ch(a, b, step=1.5):
    out = []; x = a
    while x < b: out.append(round(x, 2)); x += step
    return out
Y = 'yes'
def shot(i, a, b, what, ms, person=True, cam='yes', notes='', contact='yes'):
    return dict(id=f's{i}', t0=round(a, 2), t1=round(b, 2), what=what, motion_source=ms,
                checks=dict(art=Y, motion_source=Y, rig=Y if person else 'na', life=Y if person else 'na', liquids=Y, face='na', timing=Y,
                            accuracy=Y, consistency=Y, camera=cam, scene=Y, contact=contact), notes=notes)
story = dict(id=B.ID, format='short', duration=B.DUR,
  answer=dict(kind='action', what='keep a severely cold patient flat and handle him gently: slide him, never yank him'),
  long_reason='Premises first (he went through the ice, the cold heart is twitchy, a jolt can cause VF), then the rough pull stopped and the careful slide, then the steady beat: every beat must be shown for a cold viewer to follow; 41 s at a natural eleven_v4 pace with no speed up.',
  beats=[dict(t0=0, t1=2.4, kind='mistake', person=True, diagram=False, changes=[0.0, 0.8, 1.6], what='a rescuer kneeling at an ice hole hauls a man up by the chest in rough yanks', source=''),
         dict(t0=2.4, t1=B.T_HE, kind='result', person=True, diagram=False, changes=[2.5, 3.2, 4.0], what='on the second yank his head snaps and a red warning pulse flashes from his chest', source='WMS: rough handling risks VF'),
         dict(t0=B.T_HE, t1=B.T_A, kind='result', person=True, diagram=False, changes=ch(B.T_HE, B.T_A, 1.2), what='zoom cut under the ice: his legs hang in black water under the hole, bubbles rise, moonlight shafts; zoom cut back up to him, frosted and limp', source=''),
         dict(t0=B.T_A, t1=B.T_AND, kind='explain', person=True, anchor=True, diagram=True, changes=ch(B.T_A, B.T_AND, 1.2), what='a lens opens from his chest: a slow cold heart with an extra beat on twitchy; IF JOLTED, VF: the wall ripples, no squeeze, chaotic trace', source='WMS hypothermia guidelines 2019 (AAFP 2020 summary); AHA'),
         dict(t0=B.T_AND, t1=B.T_SO, kind='result', person=True, diagram=False, changes=ch(B.T_AND, B.T_SO, 1.2), what='he yanks hard; the second rescuer walks in from the right, kneels at the rim and lays her hand on the man; the haul eases him back down', source=''),
         dict(t0=B.T_SO, t1=B.T_AND5, kind='answer', person=True, diagram=False, changes=ch(B.T_SO, B.T_AND5, 1.5), what='the man lies flat, wrapped and strapped on the sled; the rescuers slide it slowly toward shore on ropes', source='WMS: horizontal position, gentle handling'),
         dict(t0=B.T_AND5, t1=B.T_SHORE, kind='payoff', person=True, anchor=True, diagram=True, changes=ch(B.T_AND5, B.DUR, 1.5), what='the lens opens from his chest on the sled: slow, steady beat and a slow regular trace', source='WMS')])
shots = [shot(1, 0, B.T_U0, 'night lake, ice hole: RED kneels on the sled and hauls the man up by the chest in hard yanks with splashes', 'procedural (IK: wrists solved onto the parka every frame; one lift value moves both)'),
         shot(6, B.T_U0, B.T_U1, 'under the ice: his legs in black water below the hole, bubbles, light shafts', 'procedural', contact='na'),
         shot(2, B.T_U1, B.T_AND, 'the heart lens over the scene, tied to his chest: cold beat, extra beat, IF JOLTED VF', 'procedural heart (lib/heart.py) and ECG'),
         shot(3, B.T_AND, B.T_CUT, 'hard yank; TEAL walks in from the right (planted steps), kneels at the rim and lays her hand on the back of his shoulder; RED eases him down', 'procedural (foot locked walk, IK hands)'),
         shot(4, B.T_CUT, B.T_AND5, 'zoom cut: flat on the sled, slid slowly on two ropes that end in the rescuers\' hands', 'procedural (foot locked walk, sled moves at walking speed)'),
         shot(5, B.T_AND5, B.T_SHORE, 'the lens from his chest on the sled: slow steady beat', 'procedural heart and ECG'),
         shot(7, B.T_SHORE, B.DUR, "the shore: rope in RED's hand, TEAL's hand on the rail, the sled stops at the ambulance's open doors in warm light", 'procedural (foot locked walk)')]
json.dump(story, open(f'{OUT}/story.json', 'w'), indent=1)
json.dump(dict(video=B.ID, shots=shots), open(f'{OUT}/shots.json', 'w'), indent=1)
