"""Shared scene helpers for the w1031 builds (scene agent, 2026-11-01)."""
import skia
import layout as L

_F = skia.Font(L.BLACK, 62)


def _wpx(ch):
    return _F.measureText(' '.join(x['d'].strip(',') for x in ch))


def merge_singles(cap, maxpx=900):
    """fold one word caption chunks into a neighbour so no single word flashes up on its own: into the previous
    chunk when it fits on the line, else into the next (when the sentence runs on), else borrow the previous
    chunk's last word so the line still fits"""
    ch = cap.chunks
    i = 0
    while i < len(ch):
        if len(ch) > 1 and len(ch[i]) == 1:
            w = ch[i][0]
            if i > 0 and _wpx(ch[i - 1] + [w]) <= maxpx and w['t0'] - ch[i - 1][-1]['t1'] < 0.6:
                ch[i - 1].append(w); del ch[i]; continue
            if i + 1 < len(ch) and _wpx([w] + ch[i + 1]) <= maxpx and not w['w'].endswith(('.', '?', '!', ',')):
                ch[i + 1].insert(0, w); del ch[i]; continue
            if i > 0 and len(ch[i - 1]) >= 3:
                ch[i].insert(0, ch[i - 1].pop()); i += 1; continue
        i += 1
    return cap
