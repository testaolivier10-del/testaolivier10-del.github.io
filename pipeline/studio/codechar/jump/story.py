"""story_landing.json and shots_landing.json from the build's real times (for the story check and motion QC)."""
import json
b = json.load(open('/home/claude/jump/out/build.json'))
T, DUR, C = b['T'], b['DUR'], b['curves']
beats = [
    (0.0, T['rw0'], 'mistake', True, False, 'frame zero: she is already dipping into a jump (title up); she lands with locked knees, legs straight (labelled acted out): hips stop dead, jolt, red flash at knees, force meter slams to about 9x body weight, red X',
     'impulse momentum theorem; locked curve illustrative'),
    (T['rw0'], T['rw1'], 'result', True, False, 'rewind back to the crouch', ''),
    (T['rw1'], T['c0'], 'payoff', True, False, f'the same jump lands for real with bent knees (motion capture); meter peaks about {C["peak"]:.1f}x', 'CMU mocap 13_11'),
    (T['c0'], T['imp0'], 'explain', True, True, f'slow motion replay: vertical momentum arrow {C["v_td"]:.1f} m/s shrinks to 0 as the CoM stops; chip: delta p same for both landings', 'CoM from segment masses; flight parabola gives scale'),
    (T['imp0'], T['g0'], 'explain', True, True, 'she turns to face us (side, three quarter, front); card: delta p = F x delta t, F = average net force', 'AP Physics 1 unit 4'),
    (T['g0'], T['e0'], 'explain', True, True, f'replay locked landing; stopwatch {C["D"]:.2f} s; graph draws the illustrative spike (about 9x mg, about 30 ms to peak)', 'illustrative'),
    (T['e0'], T['area'] - 0.1, 'explain', True, True, f'replay bent landing; stopwatch about 0.2 s; ground force arrow F = m(g + a) live; graph draws the recorded curve, peak {C["peak"]:.1f}x mg', 'computed from mocap'),
    (T['area'] - 0.1, T['ask0'], 'rule', True, True, 'both areas above mg shaded equal (same delta p), arrow from the tall peak to the low one', ''),
    (T['ask0'], T['end'], 'question', True, False, 'cut: she holds her hands out, a water balloon falls toward them and pauses just above; chips PULL HANDS BACK? (arrow back) / HOLD STILL?', ''),
    (T['end'], DUR, 'end', False, False, 'end card', ''),
]
story = dict(id='landing-impulse', format='short', duration=DUR,
             answer=dict(kind='action', what='pull your hands back to stretch the stop out (more time, smaller force)'),
             long_reason='eight short beats: the comparison needs both landings, the momentum stop, the impulse card and both replays on one graph; final length follows the voice', beats=[dict(t0=a, t1=b_, kind=k, person=p, diagram=d, what=w, source=s) for a, b_, k, p, d, w, s in beats])
json.dump(story, open('/home/claude/jump/story_landing.json', 'w'), indent=1)
ms = {'A': 'motion capture to touchdown, then keyed (labelled acted out)', 'B': 'motion capture', 'C': 'motion capture, slowed'}
shots = []
for n, (a, b_, k, p, d, w, s) in enumerate(beats):
    shots.append(dict(id=f's{n + 1}', t0=a, t1=b_, what=w, motion_source=ms.get('ABC'[n] if n < 3 else '', 'motion capture replays and posed views'),
                      checks={kk: 'pending' for kk in ('art', 'motion_source', 'rig', 'life', 'liquids', 'face', 'timing', 'accuracy', 'consistency', 'camera')}, notes=''))
json.dump(dict(video='landing-impulse', shots=shots), open('/home/claude/jump/shots_landing.json', 'w'), indent=1)
print('story and shots written')
