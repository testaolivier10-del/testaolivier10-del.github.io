#!/usr/bin/env python3
"""AVIF copies of the A&P OpenStax figures at 480 px, 800 px and full width.

Site audit 2026-10 (performance, "Images" row): 389 OpenStax JPGs, no modern
format and no srcset, so a phone downloaded the 1,100 px JPG for a 360 px slot.
This writes anatomy-physiology/figures/avif/<id>-480.avif, <id>-800.avif and
<id>.avif (the figure's own width, at most 1,100 px). scripts/lib/anp-build.mjs
wraps each figure in <picture> when its copies exist, and the JPG stays the
fallback for browsers without AVIF.

AVIF only, no WebP: every current browser decodes AVIF, the JPG covers the rest,
and a second format would have added about 30 MB to the repository for nobody.
Quality 50 keeps the printed labels sharp (checked by eye on os-17-2).

Needs Pillow with AVIF support (Pillow 11.2+): python3 -m pip install pillow.
Idempotent: a copy newer than its JPG is left alone. --check (CI) reports
missing and orphaned copies only.

  python3 scripts/build-figure-variants.py           write what is missing or stale
  python3 scripts/build-figure-variants.py --check   exit 1 if anything is
"""
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'anatomy-physiology', 'figures')
OUT = os.path.join(SRC, 'avif')
WIDTHS = (480, 800)
QUALITY = 50


def targets(name, width):
    stem = name[:-4]
    out = [(os.path.join(OUT, f'{stem}-{w}.avif'), w) for w in WIDTHS if w < width]
    out.append((os.path.join(OUT, f'{stem}.avif'), width))
    return out


def main():
    check = '--check' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    stale = []
    written = 0
    names = sorted(n for n in os.listdir(SRC) if n.endswith('.jpg'))
    for name in names:
        src = os.path.join(SRC, name)
        with Image.open(src) as im:
            width, height = im.size
            # --check looks only for missing copies: a fresh checkout gives
            # every file the same mtime, so age means nothing there.
            todo = [(p, w) for p, w in targets(name, width)
                    if not os.path.exists(p) or (not check and os.path.getmtime(p) < os.path.getmtime(src))]
            if not todo:
                continue
            if check:
                stale.extend(os.path.relpath(p, ROOT) for p, _ in todo)
                continue
            rgb = im.convert('RGB')
            for path, w in todo:
                img = rgb if w == width else rgb.resize((w, round(height * w / width)), Image.LANCZOS)
                img.save(path, 'AVIF', quality=QUALITY, speed=6)
                written += 1
    expected = {os.path.basename(p) for n in names for p, _ in targets(n, Image.open(os.path.join(SRC, n)).size[0])}
    extra = sorted(set(os.listdir(OUT)) - expected)
    if check:
        if stale or extra:
            for p in stale[:10]:
                print('stale or missing:', p)
            for p in extra[:10]:
                print('orphaned:', p)
            print('Run: python3 scripts/build-figure-variants.py')
            sys.exit(1)
        print(f'All {len(expected)} AVIF figure copies are present.')
        return
    for p in extra:
        os.remove(os.path.join(OUT, p))
    print(f'Wrote {written} AVIF copies; removed {len(extra)} orphans; {len(expected)} in all.')


if __name__ == '__main__':
    main()
