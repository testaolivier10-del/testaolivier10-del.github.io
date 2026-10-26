import sys, json
sys.path.insert(0, '/home/claude/w1025')
import kit as K
vid = sys.argv[1]
OUT = f'/home/claude/w1025/out/{vid}'
b = json.load(open(OUT + '/build.json'))
D = b['DUR']
snd = [(n, t, g * 0.6) for n, t, g in b['sounds']]
beds = {'w1025-01-power-lift': [('birds_real', -30, 0, D)],
        'w1025-02-free-throw': [('birds_real', -31, 0, D)],
        'w1025-03-dead-zone': [tuple(x) for x in b.get('beds', [])],
        'w1025-04-head-rush': [('birds_real', -34, 0, D)]}[vid]
seeds = {'w1025-01-power-lift': (11, 92, 4), 'w1025-02-free-throw': (5, 100, 7), 'w1025-03-dead-zone': (8, 84, 9), 'w1025-04-head-rush': (13, 88, 2)}[vid]
K.mix(OUT, D, snd, beds, OUT + '/voice.mp3', music_seed=seeds[0], bpm=seeds[1], key=seeds[2])
K.encode(OUT)
print('mixed', vid)
