import sys, json, importlib
sys.path[:0] = ['/home/claude/w1104']
def load(mod):
    sys.path.insert(0, f'/home/claude/w1104/{mod}')
    if 'build' in sys.modules: del sys.modules['build']
    B = importlib.import_module('build'); sys.path.pop(0); return B
def ch(a, b, step=1.5):
    out = []; x = a
    while x < b: out.append(round(x, 2)); x += step
    return out
Y = 'yes'
def shot(i, a, b, what, ms, person=True, cam='yes', notes=''):
    return dict(id=f's{i}', t0=round(a, 2), t1=round(b, 2), what=what, motion_source=ms,
                checks=dict(art=Y, motion_source=Y, rig=Y if person else 'na', life=Y if person else 'na', liquids=Y, face='na', timing=Y,
                            accuracy=Y, consistency=Y, camera=cam, scene=Y), notes=notes)
plans = {}
B = load('ant')
plans['w1104-01-zombie-ant'] = (B, dict(duration=B.DUR, answer=dict(kind='action', what='the fungus steers the ant up the plant to bite the vein, then grows out of it'),
  long_reason='The story needs every step of the takeover in order (spore, climb, bite at noon, death, stalk, spores) for the parasitism idea to land; cut to 36 s from 46 s.',
  beats=[dict(t0=0, t1=B.T_SP, kind='surprise', person=False, anchor=True, diagram=False, changes=ch(0, B.T_SP), what='one ant walks away from the trail of its colony, alone', source=''),
         dict(t0=B.T_SP, t1=B.T_NOW, kind='result', person=False, anchor=True, diagram=True, changes=ch(B.T_SP, B.T_NOW, 1.0), what='a spore lands on its shell; its body turns see through and white fungal threads grow inside', source='Hughes 2011; Fredericksen 2017'),
         dict(t0=B.T_NOW, t1=B.T_Q, kind='explain', person=False, diagram=False, changes=ch(B.T_NOW, B.T_Q, 1.2), what='it climbs the stem; ruler about 25 cm; damp mist', source='Hughes 2011; Andersen 2009'),
         dict(t0=B.T_Q, t1=B.T_DIES, kind='question', person=False, diagram=False, changes=ch(B.T_Q, B.T_DIES, 1.2), what='under the leaf at noon it bites the main vein and the jaws lock', source='Hughes 2011'),
         dict(t0=B.T_DIES, t1=B.T_WINS, kind='answer', person=False, diagram=False, changes=ch(B.T_DIES, B.T_WINS, 1.2), what='it dies hanging; days pass; a stalk grows from the back of its head and spores fall', source='Hughes 2011'),
         dict(t0=B.T_WINS, t1=B.DUR, kind='payoff', person=False, diagram=False, changes=ch(B.T_WINS, B.DUR, 1.5), what='wide: the stalk over the colony foraging below; PARASITISM', source='AP Bio CED 8.5')]),
  [shot(1, 0, B.T_NOW, 'forest floor: trail ants, hero ant walks away; flashback tint, spore lands, see through body with threads', 'procedural (tripod gait, feet planted)', person=False),
   shot(2, B.T_NOW, B.T_Q, 'the ant climbs the stem; ruler chip; mist', 'procedural', person=False),
   shot(3, B.T_Q, B.T_DIES, 'under the leaf at noon, the bite and the lock', 'procedural', person=False),
   shot(4, B.T_DIES, B.DUR, 'death, day and night, the stalk, spores, pull back over the colony', 'procedural + particles', person=False)])
B = load('sodium')
plans['w1104-02-sodium-lake'] = (B, dict(duration=B.DUR, answer=dict(kind='action', what="sodium hands its one outer electron to water; hydrogen and heat; the heat lights the hydrogen"),
  long_reason='A real history moment plus the chemistry behind it; the premises (leftover war sodium, no one would ship it, drums onto the frozen lake, holes shot) all have to come before the explosion; 39 s plus the CTA line.',
  beats=[dict(t0=0, t1=B.T_B, kind='surprise', person=True, diagram=False, changes=ch(0, B.T_B), what='a fireball bursts from the frozen lake; a drum tumbles down the cliff', source=''),
         dict(t0=B.T_B, t1=B.T_C, kind='result', person=True, diagram=False, changes=ch(B.T_B, B.T_C, 1.3), what='rail yard: leaking drums; the boxcar door shuts', source='iafi.org; newsreel 1947'),
         dict(t0=B.T_C, t1=B.T_D, kind='result', person=True, diagram=False, changes=ch(B.T_C, B.T_D, 1.2), what='drums over the cliff onto the ice, holes shot, the lake explodes', source='grandcoulee.com; iafi.org'),
         dict(t0=B.T_D, t1=B.T_E, kind='explain', person=False, anchor=True, diagram=True, changes=ch(B.T_D, B.T_E, 1.2), what='lens from the burning lake: Na 2,8,1; the outer electron goes to water; H2 bubble and heat; it ignites', source='AP Chem CED 1.7, 1.8'),
         dict(t0=B.T_E, t1=B.DUR, kind='answer', person=False, anchor=True, diagram=False, changes=ch(B.T_E, B.DUR, 1.5), what='lake smoke; jar of sodium under oil; CTA', source='lab storage practice')]),
  [shot(1, 0, B.T_B, 'hook: the burning lake, a drum tumbling, a worker on the cliff', 'procedural + fire'),
   shot(2, B.T_B, B.T_C, 'rail yard: drums, leak, boxcar door', 'procedural'),
   shot(3, B.T_C, B.T_D, 'cliff and lake: drums rolled, holes shot, explosions', 'procedural + fire'),
   shot(4, B.T_D, B.T_E, 'the lens: sodium atom to water, hydrogen, heat, ignition', 'science sim (procedural)', person=False),
   shot(5, B.T_E, B.DUR, 'smoke over the lake, sodium under oil', 'procedural', person=False)])
B = load('stunt')
plans['w1104-03-stunt-airbag'] = (B, dict(duration=B.DUR, answer=dict(kind='place', what='the stop spread over a longer time in the airbag: same change in momentum, much smaller average force'),
  long_reason='The fall runs in real time (2.2 s from 24 m) and the concrete vs airbag showdown needs both stops and the equal area graph; 38 s.',
  beats=[dict(t0=0, t1=B.T_HIT, kind='question', person=True, diagram=False, changes=ch(0, B.T_HIT), what='the stuntman on the roof edge; the camera tilts eight floors down to the bag', source=''),
         dict(t0=B.T_HIT, t1=B.T_B, kind='result', person=True, diagram=False, changes=ch(B.T_HIT, B.T_B, 1.0), what='he falls on his back in real free fall, speed chip to 47 mph, lands, the bag sinks and vents', source='v = sqrt(2gh)'),
         dict(t0=B.T_B, t1=B.T_C, kind='explain', person=True, diagram=True, changes=ch(B.T_B, B.T_C, 1.2), what='showdown: same speed; concrete huge force spike; airbag long low hump; equal areas', source='AP Physics 1 CED, impulse J = F dt = dp'),
         dict(t0=B.T_C, t1=B.DUR, kind='answer', person=True, diagram=False, changes=ch(B.T_C, B.DUR, 1.5), what='he rolls off; the fan refills the bag', source='Actsafe air bag bulletin')]),
  [shot(1, 0, B.T_B, 'roof edge, tilt down eight floors, the real time fall and landing', 'procedural (free fall from physics)'),
   shot(2, B.T_B, B.T_C, 'concrete vs airbag panels and the force time graph', 'science sim (procedural)'),
   shot(3, B.T_C, B.DUR, 'next take: rolls off, fan refills the bag', 'procedural')])
for k, (B, st, shots) in plans.items():
    st.update(id=k, format='short'); json.dump(st, open(f'out/{k}/story.json', 'w'), indent=1)
    json.dump(dict(video=k, shots=shots), open(f'out/{k}/shots.json', 'w'), indent=1)
