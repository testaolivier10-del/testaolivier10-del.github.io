"""Set: home garage, daylight through the open door on the right (bleeding control scenes). Hand built vector,
style B. svg() returns the background layers (everything behind the characters); fg() the foreground pieces."""
import random
from studio.vec import blob


def svg():
    r = random.Random(4)
    dots = "".join(f'<circle cx="{x}" cy="{y}" r="2.6" fill="#7d4a28" opacity="0.55"/>'
                   for x in range(150, 600, 26) for y in range(165, 410, 26))
    return f"""
<defs>
 <linearGradient id="gWall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#26324f"/><stop offset="0.7" stop-color="#34436a"/><stop offset="1" stop-color="#4b5c85"/></linearGradient>
 <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f2"/><stop offset="0.55" stop-color="#ffe7b5"/><stop offset="1" stop-color="#ffcf7d"/></linearGradient>
 <linearGradient id="gFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c5670"/><stop offset="1" stop-color="#363e55"/></linearGradient>
 <linearGradient id="gLight" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffd590" stop-opacity="0.85"/><stop offset="1" stop-color="#ffd590" stop-opacity="0"/></linearGradient>
 <linearGradient id="gBeam" x1="1" y1="0" x2="0" y2="0.2"><stop offset="0" stop-color="#ffe2a8" stop-opacity="0.35"/><stop offset="1" stop-color="#ffe2a8" stop-opacity="0"/></linearGradient>
 <radialGradient id="gSun" cx="0.75" cy="0.2" r="0.6"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1920" height="1080" fill="url(#gWall)"/>
<!-- open garage door: sky, clouds, driveway -->
<rect x="1330" y="70" width="600" height="720" fill="url(#gSky)"/>
<rect x="1330" y="70" width="600" height="720" fill="url(#gSun)"/>
<path d="{blob([(1400,420),(1450,360),(1530,350),(1580,300),(1680,300),(1730,350),(1820,360),(1880,420),(1860,470),(1420,470)])}" fill="#fff4dc" opacity="0.9"/>
<path d="{blob([(1360,560),(1420,520),(1500,525),(1560,490),(1650,500),(1700,545),(1760,560),(1740,600),(1380,600)])}" fill="#ffe2a6"/>
<path d="M1330 640 L1930 600 L1930 790 L1330 790Z" fill="#9fb07a"/>
<path d="M1330 690 L1930 650 L1930 790 L1330 790Z" fill="#e2c995"/>
<!-- rolled up door panels and frame -->
<rect x="1310" y="40" width="640" height="56" fill="#6f7a92"/><rect x="1310" y="92" width="640" height="10" fill="#4f5873"/>
<rect x="1300" y="40" width="34" height="760" fill="#202942"/><rect x="1334" y="40" width="8" height="760" fill="#ffcf8a" opacity="0.7"/>
<!-- light pouring in on the floor -->
<path d="M1330 790 L1930 790 L1930 1080 L560 1080 L760 900Z" fill="url(#gLight)"/>
<!-- pegboard with tools -->
<rect x="120" y="140" width="500" height="290" rx="6" fill="#a8683a"/>
<rect x="120" y="140" width="500" height="290" rx="6" fill="none" stroke="#7d4a28" stroke-width="6"/>
{dots}
<path d="M170 180 L190 180 L192 330 L168 330Z" fill="#8d99ae"/><circle cx="180" cy="186" r="20" fill="none" stroke="#8d99ae" stroke-width="10"/>
<path d="M250 175 L300 175 L300 200 L282 200 L282 360 L268 360 L268 200 L250 200Z" fill="#9aa5b8"/>
<path d="M340 170 L460 170 L470 230 L340 250Z" fill="#c7ced9"/><rect x="460" y="190" width="40" height="22" rx="6" fill="#d24b3a"/>
<path d="M540 180 L556 180 L556 370 L540 370Z" fill="#8d99ae"/><path d="M530 360 L566 360 L560 400 L536 400Z" fill="#d24b3a"/>
<!-- workbench with the miter saw -->
<rect x="40" y="500" width="690" height="34" fill="#b0703f"/><rect x="40" y="530" width="690" height="10" fill="#7d4a28"/>
<rect x="70" y="540" width="34" height="290" fill="#8a5530"/><rect x="660" y="540" width="34" height="290" fill="#8a5530"/>
<rect x="70" y="700" width="624" height="22" fill="#8a5530"/>
<rect x="230" y="474" width="330" height="28" rx="6" fill="#5b6478"/><rect x="230" y="474" width="330" height="8" rx="4" fill="#7c879c"/>
<path d="M300 474 L318 410 L336 414 L322 474Z" fill="#3d4559"/>
<circle cx="400" cy="430" r="62" fill="#d9dee7"/><circle cx="400" cy="430" r="48" fill="#aeb7c6"/><circle cx="400" cy="430" r="9" fill="#3d4559"/>
<path d="M332 430 A68 68 0 0 1 468 430 L452 430 A52 52 0 0 0 348 430Z" fill="#e05a3a"/>
<path d="M318 412 L400 368 L470 372 L470 388 L404 392 L330 420Z" fill="#4a5266"/><rect x="455" y="366" width="46" height="18" rx="6" fill="#e05a3a"/>
<!-- floor -->
<rect y="790" width="1330" height="290" fill="url(#gFloor)" opacity="0.92"/>
<path d="M0 790 L1330 790" stroke="#1f2740" stroke-width="6"/>
<path d="M1330 790 L1930 790 L1930 1080 L560 1080 L760 900Z" fill="url(#gLight)" opacity="0.8"/>
<!-- red rolling tool chest he leans on -->
<rect x="1360" y="520" width="250" height="330" rx="10" fill="#b8332c"/>
<rect x="1360" y="520" width="250" height="330" rx="10" fill="none" stroke="#7d1f1b" stroke-width="5"/>
{''.join(f'<rect x="1380" y="{545 + i*58}" width="210" height="44" rx="5" fill="#c94338"/><rect x="1450" y="{560 + i*58}" width="70" height="9" rx="4" fill="#e8d6c4"/>' for i in range(5))}
<rect x="1360" y="520" width="12" height="330" fill="#ffd08a" opacity="0.0"/>
<circle cx="1385" cy="862" r="13" fill="#20232d"/><circle cx="1585" cy="862" r="13" fill="#20232d"/>

"""
