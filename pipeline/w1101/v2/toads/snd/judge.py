import librosa, numpy as np, sys
secs = [("morning",0,5.89),("beet+plan",5.89,10.39),("reach",10.39,14.64),("backfire",14.64,18.2),("poison",18.2,22.84),("americas",22.84,27.52),("spread",27.52,33.36),("millions",33.36,38.0),("settle",38.0,42.4)]
KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
maj = np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]); mnr = np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
def key(ch):
    best=None
    for i in range(12):
        for name, prof in (('maj',maj),('min',mnr)):
            c=np.corrcoef(np.roll(prof,i),ch)[0,1]
            if best is None or c>best[0]: best=(c,KEYS[i]+' '+name)
    return best[1]
for f in sys.argv[1:]:
    y, sr = librosa.load(f, sr=22050)
    ch = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=512); tt = librosa.times_like(ch, sr=sr, hop_length=512)
    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    perc = librosa.effects.percussive(y); pr = librosa.feature.rms(y=perc, hop_length=512)[0]
    cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=512)[0]
    print(f, 'dur', round(len(y)/sr,1))
    for n,a,b in secs:
        m=(tt>=a)&(tt<b)
        print(f'  {n:7s} {20*np.log10(rms[m].mean()+1e-9):6.1f} dB  perc {20*np.log10(pr[m].mean()+1e-9)-20*np.log10(rms[m].mean()+1e-9):6.1f}  bright {int(cent[m].mean()):5d}Hz  key {key(ch[:,m].mean(1))}')
