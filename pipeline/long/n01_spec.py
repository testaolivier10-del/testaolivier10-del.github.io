"""NREMT 01: Intro to EMS (history, today's system and the 911 call). Visual compose for engine_long.
Story frame: Frank's 911 call, people from the character library (chars/), quality v2 scenes, sound design and a low music bed in the story scenes.
"""
import sys, math
sys.path.insert(0, "/home/claude/lp"); sys.path.insert(0, "/home/claude/lp/long")
import n01_script as S
from engine_long import TEAL, GOLD, CORAL, INK, GREEN, VIOLET, WHITE

DIM = "#4d6488"; RED = "#ff5a5a"; BLUE = "#5aa9ff"; WARM = "#ffb35c"
CH = "/home/claude/lp/chars"
IMGS = {"frank-chest": (363, 585), "frank-slump": (375, 527), "frank-floor": (561, 144), "maya-phone": (225, 650), "maya-cpr": (428, 469),
        "maya-relief": (200, 652), "emd-typing": (574, 567), "emd-talking": (591, 559), "emts-walk": (583, 633), "emts-cpr": (641, 480)}

def chapter_span(c, cid):
    i = [ch["id"] for ch in c.CH].index(cid)
    t0 = c.CH[i]["t"] + (2.0 if c.CH[i]["card"] else 0) - 0.15
    t1 = c.CH[i + 1]["t"] if i + 1 < len(c.CH) else c.TOTAL
    return t0, t1

def W(c, id, x, y, text, t, size=56, color=WHITE, anchor="start", d=None, font="hand", **kw):
    s = c.hw(id, x, y, text, size=size, color=color, anchor=anchor, font=font, **kw)
    c.write(id, t, d); return s

def L(c, id, x, y, text, t, size=40, color=INK, anchor="middle", weight=800):
    c.fade_in(f"#{id}", t, d=0.35, y=10)
    return f'<text id="{id}" x="{x}" y="{y}" font-family="Inter" font-weight="{weight}" font-size="{size}" fill="{color}" text-anchor="{anchor}" opacity="0">{text}</text>'

def P(c, id, d, t, color=GOLD, w=6, dur=0.7, marker=None, extra=""):
    mk = f' marker-end="url(#{marker})"' if marker else ""
    c.draw(f"#{id}", t, d=dur)
    return f'<path id="{id}" d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0"{mk} {extra}/>'

def card(id, x, y, w, h, color=TEAL, fill="rgba(8,20,40,.78)", op=0, r=26):
    return f'<rect id="{id}" x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{color}" stroke-width="4" opacity="{op}" filter="url(#sh)"/>'

def img(id, name, x, y, h, flip=False, op=0):
    """character image, bottom left at (x, y), height h"""
    w0, h0 = IMGS[name]; w = w0 * h / h0
    tr = f' transform="translate({2*x + w:.0f} 0) scale(-1 1)"' if flip else ""
    return f'<g id="{id}" opacity="{op}"><image href="{name}.png" x="{x:.0f}" y="{y - h:.0f}" width="{w:.0f}" height="{h:.0f}"{tr}/></g>'

def chip(id, x, y, text, color=TEAL, size=40, op=0, w=None):
    w = w or int(len(text) * size * 0.62) + 50
    return (f'<g id="{id}" opacity="{op}"><rect x="{x - w/2:.0f}" y="{y - size*0.95:.0f}" width="{w}" height="{size*1.5:.0f}" rx="{size*0.75:.0f}" fill="rgba(8,20,40,.8)" stroke="{color}" stroke-width="4"/>'
            f'<text x="{x}" y="{y + size*0.08:.0f}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="{size}" fill="{color}">{text}</text></g>')

def hideall(c, sels, t):
    for s_ in sels: c.hide(s_, t)

# ------------------------------------------------------------- drawn props
def dining_room(id):
    """kitchen dining room at night: blurred far wall, window, cabinet, pendant lamp, table with plates, dark foreground"""
    far = (f'<g id="{id}_far" filter="url(#blur6)">'
           f'<rect x="-200" y="0" width="2320" height="820" fill="#2a2440"/>'
           f'<rect x="-200" y="560" width="2320" height="520" fill="#33294a"/><rect x="-200" y="900" width="2320" height="180" fill="#3a2e38"/>'
           f'<rect x="1280" y="150" width="420" height="330" rx="8" fill="#1a2a55"/><rect x="1300" y="170" width="380" height="290" fill="#25407a"/>'
           f'<circle cx="1600" cy="230" r="34" fill="#f4f1d0" opacity=".8"/>'
           f'<line x1="1490" y1="170" x2="1490" y2="460" stroke="#1a2a55" stroke-width="12"/>'
           f'<rect x="140" y="250" width="380" height="420" rx="10" fill="#4a3a52"/><rect x="170" y="280" width="150" height="170" rx="6" fill="#5a4862"/><rect x="340" y="280" width="150" height="170" rx="6" fill="#5a4862"/>'
           f'<rect x="170" y="470" width="320" height="170" rx="6" fill="#55435c"/>'
           f'<rect x="700" y="210" width="160" height="200" rx="6" fill="#6a4f3a"/><rect x="716" y="226" width="128" height="168" fill="#c79a5a" opacity=".6"/></g>')
    mid = (f'<g id="{id}_mid">'
           f'<radialGradient id="{id}_lg" cx="50%" cy="0%" r="80%"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>'
           f'<ellipse id="{id}_glow" cx="960" cy="520" rx="760" ry="430" fill="url(#{id}_lg)"/>'
           f'<line x1="960" y1="0" x2="960" y2="160" stroke="#1b1426" stroke-width="5"/>'
           f'<path d="M 880 160 L 1040 160 L 1000 215 L 920 215 Z" fill="#e0a24a"/><ellipse cx="960" cy="215" rx="40" ry="10" fill="#fff3c4"/>'
           f'<rect x="560" y="640" width="900" height="34" rx="8" fill="#8a5a35"/><rect x="560" y="664" width="900" height="16" fill="#6d4426"/>'
           f'<rect x="600" y="680" width="22" height="300" fill="#6d4426"/><rect x="1400" y="680" width="22" height="300" fill="#6d4426"/>'
           f'<ellipse cx="760" cy="636" rx="80" ry="14" fill="#f2efe8"/><ellipse cx="760" cy="632" rx="52" ry="8" fill="#d9a35a"/>'
           f'<ellipse cx="1180" cy="636" rx="80" ry="14" fill="#f2efe8"/><ellipse cx="1180" cy="632" rx="50" ry="8" fill="#9bc16a"/>'
           f'<rect x="950" y="590" width="28" height="48" rx="4" fill="#cfe8ff" opacity=".8"/><rect x="1300" y="600" width="70" height="36" rx="6" fill="#c4572e"/>'
           f'<g id="{id}_fork"><rect x="840" y="622" width="70" height="7" rx="3" fill="#cfd6e0"/></g></g>')
    fg = (f'<g id="{id}_fg"><rect x="-200" y="980" width="2320" height="200" fill="#120c18"/>'
          f'<radialGradient id="{id}_vg" cx="50%" cy="50%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>'
          f'<rect x="-200" y="-100" width="2320" height="1280" fill="url(#{id}_vg)"/></g>')
    return far, mid, fg

def heart_icon(id, x, y, s=1, color=RED, op=0):
    return f'<path id="{id}" d="M {x} {y+18*s} C {x-40*s} {y-14*s}, {x-18*s} {y-44*s}, {x} {y-22*s} C {x+18*s} {y-44*s}, {x+40*s} {y-14*s}, {x} {y+18*s} Z" fill="{color}" opacity="{op}"/>'

def phone_icon(id, x, y, s=1, color=TEAL, op=0, label=""):
    return (f'<g id="{id}" opacity="{op}"><rect x="{x-34*s}" y="{y-60*s}" width="{68*s}" height="{120*s}" rx="{12*s}" fill="#0d1d38" stroke="{color}" stroke-width="5"/>'
            f'<rect x="{x-24*s}" y="{y-46*s}" width="{48*s}" height="{82*s}" rx="4" fill="#163563"/>'
            + (f'<text x="{x}" y="{y+6*s}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="{22*s}" fill="{color}">{label}</text>' if label else "")
            + '</g>')

def headset_icon(id, x, y, color=TEAL, op=0):
    return (f'<g id="{id}" opacity="{op}"><path d="M {x-40} {y+10} A 40 40 0 0 1 {x+40} {y+10}" fill="none" stroke="{color}" stroke-width="8"/>'
            f'<rect x="{x-52}" y="{y}" width="20" height="34" rx="8" fill="{color}"/><rect x="{x+32}" y="{y}" width="20" height="34" rx="8" fill="{color}"/>'
            f'<path d="M {x-42} {y+34} Q {x-40} {y+60} {x-6} {y+58}" fill="none" stroke="{color}" stroke-width="6"/></g>')

def ambulance(id, x, y, s=1, op=0, color="#f4f6fb"):
    return (f'<g id="{id}" opacity="{op}"><g transform="translate({x} {y}) scale({s})">'
            f'<rect x="0" y="-110" width="200" height="110" rx="10" fill="{color}"/><path d="M 200 -80 L 260 -80 L 290 -40 L 290 0 L 200 0 Z" fill="{color}"/>'
            f'<path d="M 210 -72 L 255 -72 L 278 -42 L 210 -42 Z" fill="#7fb4e6"/><rect x="0" y="-48" width="290" height="14" fill="{RED}"/>'
            f'<rect x="70" y="-96" width="20" height="56" fill="{RED}"/><rect x="52" y="-78" width="56" height="20" fill="{RED}"/>'
            f'<rect x="20" y="-124" width="40" height="14" rx="4" fill="{RED}"/><rect x="140" y="-124" width="40" height="14" rx="4" fill="{BLUE}"/>'
            f'<circle cx="60" cy="0" r="26" fill="#1c1c24"/><circle cx="60" cy="0" r="11" fill="#9aa3b5"/><circle cx="235" cy="0" r="26" fill="#1c1c24"/><circle cx="235" cy="0" r="11" fill="#9aa3b5"/></g></g>')

def hospital(id, x, y, s=1, op=0, label="", color="#dfe8f6", accent=TEAL):
    return (f'<g id="{id}" opacity="{op}"><g transform="translate({x} {y}) scale({s})">'
            f'<rect x="-120" y="-200" width="240" height="200" rx="8" fill="{color}"/><rect x="-170" y="-120" width="340" height="120" rx="6" fill="{color}" opacity=".85"/>'
            + "".join(f'<rect x="{-95 + i*50}" y="-180" width="30" height="30" rx="3" fill="#7fa6d4"/>' for i in range(4))
            + "".join(f'<rect x="{-150 + i*60}" y="-100" width="36" height="30" rx="3" fill="#7fa6d4"/>' for i in range(6))
            + f'<rect x="-30" y="-60" width="60" height="60" fill="#46618c"/><rect x="-14" y="-250" width="28" height="70" fill="{accent}"/><rect x="-35" y="-229" width="70" height="28" fill="{accent}"/>'
            + (f'<text x="0" y="50" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" fill="{WHITE}">{label}</text>' if label else "") + '</g></g>')

def tower(id, x, y, op=0):
    return (f'<g id="{id}" opacity="{op}"><path d="M {x-40} {y} L {x} {y-220} L {x+40} {y} Z" fill="none" stroke="{INK}" stroke-width="6"/>'
            f'<path d="M {x-28} {y-70} L {x+28} {y-70} M {x-16} {y-140} L {x+16} {y-140} M {x-28} {y-70} L {x+16} {y-140} M {x+28} {y-70} L {x-16} {y-140}" stroke="{INK}" stroke-width="4"/>'
            f'<circle cx="{x}" cy="{y-226}" r="10" fill="{GOLD}"/>'
            f'<path d="M {x-30} {y-250} A 40 40 0 0 1 {x+30} {y-250} M {x-52} {y-266} A 64 64 0 0 1 {x+52} {y-266}" fill="none" stroke="{GOLD}" stroke-width="5"/></g>')

def house(id, x, y, s=1, op=0, color="#e7c9a0"):
    return (f'<g id="{id}" opacity="{op}"><g transform="translate({x} {y}) scale({s})"><path d="M -110 0 L -110 -110 L 0 -190 L 110 -110 L 110 0 Z" fill="{color}"/>'
            f'<path d="M -130 -100 L 0 -205 L 130 -100" fill="none" stroke="#8a4b3a" stroke-width="18" stroke-linejoin="round"/>'
            f'<rect x="-25" y="-70" width="50" height="70" fill="#7a5134"/><rect x="-85" y="-90" width="44" height="40" fill="#ffd98a"/><rect x="41" y="-90" width="44" height="40" fill="#ffd98a"/></g></g>')

def pin(id, x, y, color=CORAL, op=0, s=1):
    return (f'<g id="{id}" opacity="{op}"><path d="M {x} {y} C {x-36*s} {y-50*s}, {x-40*s} {y-70*s}, {x-40*s} {y-86*s} A {40*s} {40*s} 0 1 1 {x+40*s} {y-86*s} C {x+40*s} {y-70*s}, {x+36*s} {y-50*s}, {x} {y} Z" fill="{color}"/>'
            f'<circle cx="{x}" cy="{y-86*s}" r="{15*s}" fill="#fff"/></g>')

def helicopter(id, x, y, op=0, color="#7d8f6a"):
    return (f'<g id="{id}" opacity="{op}"><ellipse cx="{x}" cy="{y}" rx="90" ry="44" fill="{color}"/><path d="M {x+80} {y-10} L {x+230} {y-20} L {x+240} {y-50} L {x+256} {y-50} L {x+250} {y+5} L {x+80} {y+16} Z" fill="{color}"/>'
            f'<path d="M {x-60} {y-6} A 60 40 0 0 1 {x+10} {y-36} L {x+10} {y-4} Z" fill="#b9d6e8"/><rect x="{x-6}" y="{y-64}" width="12" height="22" fill="#444"/>'
            f'<rect id="{id}_rot" x="{x-200}" y="{y-70}" width="400" height="8" rx="4" fill="#333"/><path d="M {x-60} {y+52} L {x+70} {y+52} M {x-40} {y+40} L {x-40} {y+52} M {x+50} {y+40} L {x+50} {y+52}" stroke="#333" stroke-width="6"/></g>')

def wagon(id, x, y, op=0):
    return (f'<g id="{id}" opacity="{op}"><path d="M {x} {y-140} Q {x+110} {y-220} {x+220} {y-140} L {x+220} {y-40} L {x} {y-40} Z" fill="#d8cfb8" stroke="#8a7a5a" stroke-width="5"/>'
            f'<circle cx="{x+40}" cy="{y-20}" r="36" fill="none" stroke="#6a4a2a" stroke-width="9"/><circle cx="{x+185}" cy="{y-20}" r="36" fill="none" stroke="#6a4a2a" stroke-width="9"/>'
            f'<path d="M {x+220} {y-60} L {x+320} {y-60}" stroke="#6a4a2a" stroke-width="8"/>'
            f'<path d="M {x+300} {y-30} L {x+300} {y-110} Q {x+330} {y-150} {x+380} {y-130} L {x+400} {y-100} L {x+380} {y-90} L {x+360} {y-100} L {x+360} {y-30} M {x+310} {y-30} L {x+310} {y} M {x+350} {y-30} L {x+350} {y}" fill="#8a5a35" stroke="#6a4a2a" stroke-width="6"/></g>')

def oldcar(id, x, y, color="#2c2c34", label="", op=0, long=False):
    L_ = 420 if long else 300
    return (f'<g id="{id}" opacity="{op}"><path d="M {x} {y-40} L {x} {y-110} Q {x+20} {y-160} {x+L_*0.45} {y-160} L {x+L_*0.75} {y-160} L {x+L_*0.85} {y-100} L {x+L_} {y-90} L {x+L_} {y-40} Z" fill="{color}"/>'
            f'<rect x="{x+30}" y="{y-145}" width="{L_*0.35:.0f}" height="40" rx="6" fill="#9db3cc" opacity=".7"/>'
            f'<circle cx="{x+70}" cy="{y-36}" r="34" fill="#151515"/><circle cx="{x+L_-70}" cy="{y-36}" r="34" fill="#151515"/>'
            + (f'<text x="{x+L_/2:.0f}" y="{y+50}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" fill="{INK}">{label}</text>' if label else "") + '</g>')

def firetruck(id, x, y, op=0):
    return (f'<g id="{id}" opacity="{op}"><rect x="{x}" y="{y-130}" width="300" height="90" rx="8" fill="#c8322f"/><path d="M {x+300} {y-120} L {x+380} {y-120} L {x+400} {y-80} L {x+400} {y-40} L {x+300} {y-40} Z" fill="#c8322f"/>'
            f'<rect x="{x+315}" y="{y-112}" width="55" height="34" fill="#9db3cc"/><path d="M {x+20} {y-150} L {x+280} {y-150} M {x+40} {y-150} L {x+40} {y-130} M {x+260} {y-150} L {x+260} {y-130}" stroke="#ddd" stroke-width="7"/>'
            f'<circle cx="{x+70}" cy="{y-36}" r="34" fill="#151515"/><circle cx="{x+330}" cy="{y-36}" r="34" fill="#151515"/></g>')

def book(id, x, y, op=0):
    return (f'<g id="{id}" opacity="{op}"><rect x="{x}" y="{y}" width="360" height="470" rx="10" fill="#e9e1cc" filter="url(#sh)"/><rect x="{x}" y="{y}" width="28" height="470" fill="#b8ab88"/>'
            f'<text x="{x+194}" y="{y+90}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" fill="#2b2b2b">Accidental Death</text>'
            f'<text x="{x+194}" y="{y+132}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" fill="#2b2b2b">and Disability</text>'
            f'<line x1="{x+60}" y1="{y+165}" x2="{x+330}" y2="{y+165}" stroke="#8a2a2a" stroke-width="4"/>'
            f'<text x="{x+194}" y="{y+215}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="25" fill="#444">The Neglected Disease</text>'
            f'<text x="{x+194}" y="{y+250}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="25" fill="#444">of Modern Society</text>'
            f'<text x="{x+194}" y="{y+410}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="38" fill="#8a2a2a">1966</text></g>')

def road_scene(id, op=0):
    s = [f'<g id="{id}" opacity="{op}"><rect x="0" y="560" width="1920" height="520" fill="#1b2335"/><rect x="0" y="560" width="1920" height="12" fill="#3a4766"/>'
         f'<path d="M 0 820 L 1920 820" stroke="{GOLD}" stroke-width="10" stroke-dasharray="70 50"/>']
    for i, (x, col) in enumerate([(200, "#c46a3a"), (720, "#4a7ac4"), (1240, "#7a9a4a")]):
        s.append(f'<g id="{id}_car{i}"><rect x="{x}" y="700" width="220" height="70" rx="20" fill="{col}"/><path d="M {x+40} 700 L {x+70} 650 L {x+160} 650 L {x+190} 700 Z" fill="{col}"/>'
                 f'<circle cx="{x+50}" cy="772" r="24" fill="#111"/><circle cx="{x+170}" cy="772" r="24" fill="#111"/></g>')
    s.append("</g>")
    return "".join(s)

def rising_chart(c, id, x, y, t, op=0):
    pts = [(0, 0), (60, -20), (120, -50), (180, -70), (240, -120), (300, -150), (360, -200)]
    d = "M " + " L ".join(f"{x+a} {y+b}" for a, b in pts)
    return (f'<g id="{id}_g" opacity="{op}"><path d="M {x} {y-240} L {x} {y} L {x+400} {y}" fill="none" stroke="{INK}" stroke-width="4"/></g>'
            + P(c, id, d, t, CORAL, 8, 1.2, "ahc"))

# ------------------------------------------------------------- chapters
def intro(c):
    t0, t1 = chapter_span(c, "intro")
    T, C = c.T, c.C
    s = ['<g id="g_in">']
    far, mid, fg = dining_room("dr")
    s.append('<g id="in_scene">' + far + mid)
    s.append(img("in_fr", "frank-chest", 1330, 990, 600, flip=True))
    s.append(img("in_my", "maya-phone", 260, 990, 640, op=0))
    s.append('<g id="in_sweat" opacity="0">' + "".join(f'<path d="M {x} {y} q 7 14 0 20 q -7 -6 0 -20 Z" fill="#bfe6ff"/>' for x, y in [(1500, 470), (1466, 455), (1520, 500)]) + '</g>')
    s.append(heart_icon("in_hrt", 1480, 610, 1.0, RED, 0))
    s.append(fg + '</g>')
    c.set("#in_fr", 0, "opacity:1")
    # frame zero motion: camera already pushing in, lamp glow breathing, fork drops on {0}
    c.g('tl.fromTo("#in_scene",{scale:1.0,transformOrigin:"55%% 55%%"},{scale:1.12,duration:%.2f,ease:"none"},0);' % (C["hook"][4] + 0.5))
    c.g('tl.fromTo("#dr_far",{x:0},{x:-40,duration:%.2f,ease:"none"},0);' % (C["hook"][4] + 0.5))
    c.g('tl.fromTo("#dr_glow",{opacity:.85},{opacity:1,duration:0.8,yoyo:true,repeat:9,ease:"sine.inOut"},0);')
    c.g('tl.to("#dr_fork",{rotation:35,y:28,x:-10,transformOrigin:"50% 50%",duration:0.35,ease:"power2.in"},0.15);')
    c.sound("clink", 0.45, 0.8)
    c.g('tl.fromTo("#in_fr",{x:-6},{x:6,duration:0.12,yoyo:true,repeat:3},%.2f);' % C["hook"][1])
    c.fade_in("#in_hrt", C["hook"][1] + 0.1, y=0); c.pulse("#in_hrt", C["hook"][1] + 0.2, C["hook"][3], amp=1.25, per=0.7)
    c.sound("heartbeat", C["hook"][1] + 0.2, 0.7); c.sound("heartbeat", C["hook"][1] + 2.2, 0.7)
    c.fade_in("#in_sweat", C["hook"][2] + 0.2, y=-10)
    c.g('tl.fromTo("#in_my",{opacity:0,x:-120},{opacity:1,x:0,duration:0.5,ease:"power3.out"},%.2f);' % C["hook"][3])
    c.sound("cloth", C["hook"][3], 0.6)
    s.append(phone_icon("in_ph", 560, 300, 1.3, TEAL, 0, "911"))
    c.pop("#in_ph", C["hook"][3] + 0.6); c.sound("check", C["hook"][3] + 0.6, 0.6)
    # the chain: caller, dispatcher, crew, hospital
    c.g('tl.to("#in_scene",{opacity:0.15,duration:0.6},%.2f);' % (C["hook"][5] - 0.5)); c.to("#in_fr", C["hook"][5] - 0.5, "opacity:0.12", d=0.6); c.to("#in_my", C["hook"][5] - 0.5, "opacity:0.12", d=0.6); c.hide("#in_sweat", C["hook"][5] - 0.5)
    c.hide("#in_ph", C["hook"][5] - 0.5); c.hide("#in_hrt", C["hook"][5] - 0.5)
    xs = [360, 760, 1160, 1560]
    labs = ["caller", "dispatcher", "ambulance crew", "hospital"]
    s.append(P(c, "in_chain", "M 360 520 L 1560 520", C["hook"][5], GOLD, 8, 1.6))
    icons = [phone_icon("in_i0", xs[0], 520, 1.0, TEAL, 1), headset_icon("in_i1", xs[1], 490, TEAL, 1),
             ambulance("in_i2", xs[2] - 120, 570, 0.8, 1), hospital("in_i3", xs[3], 590, 0.6, 1)]
    for i, x in enumerate(xs):
        s.append(f'<circle id="in_nd{i}" cx="{x}" cy="520" r="110" fill="#0d1d38" stroke="{TEAL}" stroke-width="6" opacity="0"/>')
        s.append(f'<g id="in_ic{i}" opacity="0">{icons[i]}</g>')
        s.append(L(c, f"in_lb{i}", x, 690, labs[i], C["hook"][5] + 0.3 + 0.45 * i, 42, WHITE))
        c.pop(f"#in_nd{i}", C["hook"][5] + 0.2 + 0.45 * i); c.fade_in(f"#in_ic{i}", C["hook"][5] + 0.3 + 0.45 * i, y=0)
        c.sound("pat", C["hook"][5] + 0.2 + 0.45 * i, 0.5)
    chain = ["#in_chain"] + [f"#in_{k}{i}" for k in ("nd", "ic", "lb") for i in range(4)]
    # promise
    c.hide("#in_scene", T["promise"] - 0.3); c.hide("#in_my", T["promise"] - 0.3); c.hide("#in_fr", T["promise"] - 0.3); c.hide("#in_sweat", T["promise"] - 0.3)
    for sel in chain: c.to(sel, T["promise"], "y:-200,scale:0.8,transformOrigin:'960px 520px'", d=0.6)
    s.append(W(c, "pr_h", 960, 720, 'this chain = <tspan fill="#2ee6d6">the EMS system</tspan>', T["promise"] + 0.6, 60, anchor="middle"))
    hideall(c, chain + ["#pr_h"], C["promise"][1] - 0.3)
    panels = [("where it came from", "history"), ("the laws and 10 standards", "laws"), ("how 911 finds a caller", "call"), ("not always the closest hospital", "hosp")]
    for i, (txt, k) in enumerate(panels):
        x = 120 + i * 430
        s.append(card(f"pr_c{i}", x, 230, 390, 520, [INK, GOLD, TEAL, CORAL][i], op=0))
        c.fade_in(f"#pr_c{i}", C["promise"][i + 1], y=20); c.sound("swish", C["promise"][i + 1], 0.35)
        s.append(W(c, f"pr_t{i}", x + 195, 690, txt, C["promise"][i + 1] + 0.3, 32 if len(txt) > 24 else 36, anchor="middle"))
    s.append(wagon("pr_a0", 160, 560, 0)); c.fade_in("#pr_a0", C["promise"][1] + 0.2, y=10)
    s.append(f'<g id="pr_a1" opacity="0">' + "".join(f'<rect x="{560+ (i%2)*150}" y="{300+(i//2)*62}" width="130" height="46" rx="10" fill="#10264a" stroke="{GOLD}" stroke-width="3"/>' for i in range(10))
             + "".join(f'<text x="{625+(i%2)*150}" y="{332+(i//2)*62}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="26" fill="{GOLD}">{i+1}</text>' for i in range(10)) + '</g>')
    c.fade_in("#pr_a1", C["promise"][2] + 0.2, y=10)
    s.append(tower("pr_a2", 1120, 560, 0) + pin("pr_a2p", 1240, 560, CORAL, 0))
    c.fade_in("#pr_a2", C["promise"][3] + 0.2, y=10); c.pop("#pr_a2p", C["promise"][3] + 0.8)
    s.append(hospital("pr_a3", 1590, 530, 0.55, 0) + hospital("pr_a3b", 1490, 600, 0.35, 0, accent=INK))
    c.fade_in("#pr_a3", C["promise"][4] + 0.2, y=10); c.fade_in("#pr_a3b", C["promise"][4] + 0.4, y=10)
    s.append(chip("pr_ex", 960, 900, "chapter 1 · EMT course · NREMT exam", GOLD, 40))
    c.pop("#pr_ex", C["promise"][5])
    hideall(c, [f"#pr_c{i}" for i in range(4)] + [f"#pr_t{i}" for i in range(4)] + ["#pr_a0", "#pr_a1", "#pr_a2", "#pr_a2p", "#pr_a3", "#pr_a3b", "#pr_ex"], T["why"] - 0.3)
    # why: trivia pile vs one idea
    for i, (w_, x, y, r) in enumerate([("1966", 260, 330, -8), ("NHTSA", 470, 420, 6), ("Phase II", 250, 520, 4), ("10 standards", 520, 600, -5), ("1973", 300, 700, 7), ("EMD", 520, 260, -3)]):
        s.append(f'<g id="wy_p{i}" opacity="0"><text x="{x}" y="{y}" transform="rotate({r} {x} {y})" font-family="Kalam" font-weight="700" font-size="54" fill="{INK}" text-anchor="middle">{w_}</text></g>')
        c.fade_in(f"#wy_p{i}", T["why"] + 0.2 + 0.25 * i, y=-30)
    s.append(L(c, "wy_mem", 390, 840, "memorize and hope?", T["why"] + 1.5, 44, CORAL))
    s.append(card("wy_card", 820, 200, 1000, 700, GOLD, op=0)); c.fade_in("#wy_card", C["why"][1], y=20); c.sound("shimmer", C["why"][1], 0.5)
    s.append(W(c, "wy_t", 1320, 290, 'the ONE idea', C["why"][1] + 0.2, 60, GOLD, anchor="middle"))
    # care line from scene to hospital, never breaking
    s.append(house("wy_hs", 1030, 640, 0.6, 0) + hospital("wy_hp", 1640, 650, 0.6, 0))
    c.fade_in("#wy_hs", C["why"][2], y=10)
    s.append(W(c, "wy_s", 1040, 730, 'care starts at the scene', C["why"][2] + 0.2, 34, TEAL, anchor="middle"))
    s.append(P(c, "wy_line", "M 1110 580 C 1250 480, 1420 480, 1560 580", C["why"][3], TEAL, 10, 1.4, "aht"))
    c.fade_in("#wy_hp", C["why"][3] + 0.8, y=10)
    s.append(W(c, "wy_n", 1320, 820, '...and never stops', C["why"][3] + 0.6, 44, WHITE, anchor="middle"))
    s.append(phone_icon("wy_ph", 1100, 430, 0.5, GOLD, 0))
    c.pop("#wy_ph", C["why"][3] + 2.6)
    s.append(L(c, "wy_c", 1100, 375, "starts with the caller", C["why"][3] + 2.8, 30, GOLD))
    s.append(W(c, "wy_b", 1320, 880, "every date = a link added to the chain", C["why"][4], 36, INK, anchor="middle"))
    c.sound("riser", C["why"][4] + 1.0, 0.5)
    s.append('</g>')
    c.hide("#g_in", t1 - 0.4)
    return "".join(s)

def history(c):
    t0, t1 = chapter_span(c, "history")
    T, C = c.T, c.C
    s = ['<g id="g_hi" opacity="0">']
    c.scene("#g_hi", t0, t1)
    # two track timeline: military on top, civilian below
    s.append(P(c, "hi_ax", "M 120 560 L 1800 560", t0 + 0.2, INK, 5, 1.0))
    s.append(L(c, "hi_mil", 140, 200, "MILITARY", t0 + 0.4, 30, GOLD, "start", 900))
    yrs = [("1790s", 260), ("1860s", 640), ("1910s", 1000), ("1950s to 70s", 1430)]
    s.append(W(c, "hi_y0", 260, 620, "1790s", C["h1"][1], 48, GOLD, anchor="middle"))
    s.append(wagon("hi_wag", 70, 520)); c.fade_in("#hi_wag", C["h1"][1] + 0.2, y=20); c.sound("cloth", C["h1"][1] + 0.2, 0.4)
    s.append(L(c, "hi_fr", 260, 690, "France: battlefield ambulances", C["h1"][1] + 0.4, 28, WHITE))
    s.append(P(c, "hi_wg_ar", "M 90 300 L 420 300", C["h1"][2], GOLD, 6, 0.6, "ah"))
    s.append(L(c, "hi_off", 255, 280, "off the battlefield", C["h1"][2] + 0.3, 28, GOLD))
    s.append(L(c, "hi_lit", 260, 745, "very little care on the way", C["h1"][3], 30, CORAL))
    s.append(L(c, "hi_sur", 260, 795, "goal: reach the surgeons", C["h1"][4], 30, INK))
    # civil war
    s.append(W(c, "hi_y1", 700, 620, "1860s", T["h2"] + 0.1, 48, GOLD, anchor="middle"))
    s.append(card("hi_cb", 515, 280, 370, 220, INK, op=0)); c.fade_in("#hi_cb", C["h2"][1], y=10)
    s.append(W(c, "hi_cb1", 700, 370, "Clara Barton", C["h2"][1] + 0.1, 44, anchor="middle"))
    s.append(W(c, "hi_cb2", 700, 450, "→ American Red Cross", C["h2"][1] + 1.2, 30, TEAL, anchor="middle"))
    s.append(W(c, "hi_y2", 1120, 620, "1910s", C["h2"][2], 48, GOLD, anchor="middle"))
    s.append(oldcar("hi_ww1", 970, 520, "#6b7a4a")); c.fade_in("#hi_ww1", C["h2"][2] + 0.2, y=20)
    s.append(L(c, "hi_ww1l", 1120, 690, "WWI: motor ambulances,", C["h2"][2] + 0.4, 28, WHITE) + L(c, "hi_ww1m", 1120, 735, "volunteer ambulance corps", C["h2"][2] + 0.6, 28, WHITE))
    s.append(W(c, "hi_y3", 1560, 620, "Korea, Vietnam", C["h2"][3], 46, GOLD, anchor="middle"))
    s.append(helicopter("hi_heli", 1430, 420)); c.fade_in("#hi_heli", C["h2"][3] + 0.2, y=-30)
    c.g('tl.to("#hi_heli_rot",{scaleX:0.2,transformOrigin:"50%% 50%%",duration:0.12,yoyo:true,repeat:60,ease:"none"},%.2f);' % (C["h2"][3] + 0.2))
    c.g('tl.to("#hi_heli",{x:120,duration:6,ease:"sine.inOut"},%.2f);' % (C["h2"][3] + 1.6)); c.sound("swish", C["h2"][3] + 1.6, 0.4)
    s.append(L(c, "hi_med", 1560, 690, "care where they fell", C["h2"][3] + 0.8, 30, TEAL))
    s.append(L(c, "hi_fly", 1560, 735, "+ fast flight to surgery", C["h2"][3] + 1.8, 30, TEAL))
    s.append(card("hi_tc", 1350, 790, 440, 110, GREEN, op=0)); c.fade_in("#hi_tc", C["h2"][4], y=10)
    s.append(W(c, "hi_tct", 1570, 860, "→ civilian trauma centers", C["h2"][4] + 0.2, 36, GREEN, anchor="middle"))
    mil = ["#hi_ax", "#hi_mil", "#hi_y0", "#hi_wag", "#hi_fr", "#hi_wg_ar", "#hi_off", "#hi_lit", "#hi_sur", "#hi_y1", "#hi_cb", "#hi_cb1", "#hi_cb2", "#hi_y2", "#hi_ww1", "#hi_ww1l", "#hi_ww1m", "#hi_y3", "#hi_heli", "#hi_med", "#hi_fly", "#hi_tc", "#hi_tct"]
    hideall(c, mil, T["h3"] - 0.3)
    # civilian track
    s.append(L(c, "hc_h", 960, 200, "MEANWHILE, BACK HOME", T["h3"] + 0.1, 36, GOLD, "middle", 900))
    s.append(W(c, "hc_y0", 400, 300, "late 1800s", C["h3"][1], 44, GOLD, anchor="middle"))
    s.append(f'<g id="hc_hw" opacity="0">{wagon("hc_hw0", 230, 560, 1)}</g>'); c.fade_in("#hc_hw", C["h3"][1] + 0.2, y=20)
    s.append(L(c, "hc_ride", 400, 640, "hospital ambulance: mostly a ride", C["h3"][1] + 0.6, 30, WHITE))
    s.append(W(c, "hc_y1", 960, 300, "many towns: no real service", C["h3"][2], 44, WHITE, anchor="middle"))
    s.append(W(c, "hc_y2", 1520, 300, "into the 1960s", C["h3"][3] - 0.2, 44, GOLD, anchor="middle"))
    s.append(oldcar("hc_hearse", 1180, 560, "#1e1e26", "hearse", long=True)); c.fade_in("#hc_hearse", C["h3"][3], y=20); c.sound("swish", C["h3"][3], 0.4)
    s.append(f'<g id="hc_flat" opacity="0"><rect x="1300" y="455" width="230" height="22" rx="8" fill="#d6c8b0"/><text x="1390" y="370" text-anchor="middle" font-family="Kalam" font-weight="700" font-size="34" fill="{TEAL}">built to carry a person lying flat</text></g>')
    c.fade_in("#hc_flat", C["h3"][3] + 2.0, y=0)
    s.append(firetruck("hc_fire", 1250, 900)); c.fade_in("#hc_fire", C["h3"][4], y=20)
    s.append(L(c, "hc_firel", 1450, 940, "or the fire department", C["h3"][4] + 0.3, 30, WHITE))
    civ = ["#hc_h", "#hc_y0", "#hc_hw", "#hc_ride", "#hc_y1", "#hc_y2", "#hc_hearse", "#hc_flat", "#hc_fire", "#hc_firel"]
    hideall(c, civ, T["h4"] - 0.3)
    # the shift
    s.append(card("sh_a", 140, 300, 620, 300, INK, op=0)); s.append(card("sh_b", 1100, 300, 680, 300, GREEN, op=0))
    c.fade_in("#sh_a", C["h4"][1], y=10)
    s.append(W(c, "sh_at", 450, 470, "just transport", C["h4"][1] + 0.2, 64, INK, anchor="middle"))
    s.append(P(c, "sh_ar", "M 790 450 L 1070 450", C["h4"][2], GOLD, 10, 0.6, "ah")); c.sound("swish", C["h4"][2], 0.5)
    c.fade_in("#sh_b", C["h4"][2] + 0.3, y=10)
    s.append(W(c, "sh_bt", 1440, 420, "hospital quality care", C["h4"][2] + 0.4, 54, GREEN, anchor="middle"))
    s.append(W(c, "sh_bt2", 1440, 510, "from the scene, no break", C["h4"][3], 46, WHITE, anchor="middle"))
    # Frank: brain needs blood within minutes
    s.append(img("sh_fr", "frank-slump", 300, 1000, 330))
    c.fade_in("#sh_fr", C["h4"][4], y=20)
    s.append(f'<g id="sh_br" opacity="0"><path d="M 800 820 C 760 760, 820 700, 880 720 C 920 680, 1000 690, 1010 740 C 1060 750, 1060 830, 1010 850 C 990 900, 900 900, 880 870 C 830 890, 780 860, 800 820 Z" fill="#f2a7b8" stroke="#c46a84" stroke-width="5"/>'
             f'<path d="M 860 760 q 30 20 0 40 M 930 740 q -20 40 20 60 M 980 790 q -30 10 -10 40" fill="none" stroke="#c46a84" stroke-width="4"/></g>')
    c.fade_in("#sh_br", C["h4"][4] + 0.4, y=0)
    s.append(f'<g id="sh_clk" opacity="0"><circle cx="1250" cy="800" r="90" fill="#0d1d38" stroke="{CORAL}" stroke-width="8"/><line id="sh_hand" x1="1250" y1="800" x2="1250" y2="730" stroke="{CORAL}" stroke-width="8" stroke-linecap="round"/></g>')
    c.fade_in("#sh_clk", C["h4"][4] + 0.8, y=0)
    c.g('tl.to("#sh_hand",{rotation:300,svgOrigin:"1250 800",duration:5,ease:"none"},%.2f);' % (C["h4"][4] + 0.8))
    c.sound("heartbeat", C["h4"][4] + 0.6, 0.5)
    s.append(L(c, "sh_min", 1030, 960, "brain damage starts within minutes", C["h4"][4] + 1.2, 32, CORAL))
    c.to("#sh_br", C["h4"][4] + 2.0, 'opacity:0.45', d=2.5)
    s.append(chip("sh_15", 1650, 700, "15 min ride alone? too late", CORAL, 30)); c.pop("#sh_15", C["h4"][5] - 0.2)
    s.append(W(c, "sh_here", 1650, 870, "help needed right here", C["h4"][5] + 1.6, 40, GREEN, anchor="middle"))
    hideall(c, ["#sh_a", "#sh_b", "#sh_at", "#sh_ar", "#sh_bt", "#sh_bt2", "#sh_fr", "#sh_br", "#sh_clk", "#sh_min", "#sh_15", "#sh_here"], T["k1q"] - 0.3)
    s.append(qcheck(c, "k1", "k1q", ["What did the earliest EMS services do,", "and what were they missing?"]))
    s.append(W(c, "k1_a1", 960, 640, 'transport only', T["k1a"] + 0.1, 60, anchor="middle"))
    s.append(W(c, "k1_a2", 960, 750, 'missing: <tspan fill="#2ee6d6">care at the scene</tspan>', C["k1a"][1], 60, anchor="middle"))
    s.append(W(c, "k1_a3", 960, 870, 'ride → start of treatment', C["k1a"][2], 56, GREEN, anchor="middle"))
    s.append('</g>')
    return "".join(s)

def qcheck(c, pid, key, lines, y=200, label="QUICK CHECK", color=GOLD, gap=90, size=52):
    t = c.T[key]
    s = [f'<g id="{pid}_g">', card(f"{pid}_bg", 260, y, 1400, 140 + gap * len(lines) - (90 - gap) * 0, color, op=0),
         f'<text id="{pid}_lab" x="300" y="{y-24}" font-family="Inter" font-weight="900" font-size="34" letter-spacing="6" fill="{color}" opacity="0">{label}</text>']
    c.fade_in(f"#{pid}_bg", t, y=20); c.fade_in(f"#{pid}_lab", t, y=0); c.sound("riser", t - 0.6, 0.35)
    cue1 = c.C[key].get(1, t + 0.5)
    for i, ln in enumerate(lines):
        s.append(W(c, f"{pid}_q{i}", 320, y + 100 + gap * i, ln, cue1 + 0.1 + i * 1.4, size))
    s.append("</g>")
    return "".join(s)

def laws(c):
    t0, t1 = chapter_span(c, "laws")
    T, C = c.T, c.C
    s = ['<g id="g_la" opacity="0">']
    c.scene("#g_la", t0, t1)
    s.append(W(c, "la_q", 960, 200, "hearses → real EMS: what problem did each law solve?", T["l1"] + 0.2, 48, anchor="middle"))
    s.append(road_scene("la_rd")); c.fade_in("#la_rd", C["l1"][1], y=0)
    for i in range(3): c.g('tl.fromTo("#la_rd_car%d",{x:-300},{x:500,duration:7,ease:"none"},%.2f);' % (i, C["l1"][1]))
    c.sound("swish", C["l1"][1], 0.4)
    s.append(rising_chart(c, "la_ch", 1380, 480, C["l1"][2]))
    c.fade_in("#la_ch_g", C["l1"][2], y=0)
    s.append(L(c, "la_chl", 1580, 260, "highway deaths, 1960s", C["l1"][2] + 0.4, 30, CORAL))
    s.append(book("la_bk", 120, 300)); c.fade_in("#la_bk", C["l1"][3], y=30); c.sound("cloth", C["l1"][3], 0.5)
    s.append(L(c, "la_bkl", 300, 280, "National Academy of Sciences", C["l1"][3] + 0.5, 30, WHITE))
    hideall(c, ["#la_q", "#la_rd", "#la_ch", "#la_ch_g", "#la_chl", "#la_bk", "#la_bkl"], T["l2"] - 0.3)
    # timeline of three laws
    s.append(P(c, "la_ax", "M 160 600 L 1760 600", T["l2"] + 0.1, INK, 5, 0.8))
    xs = [420, 960, 1500]
    s.append(W(c, "la_y0", xs[0], 660, "1966", C["l2"][1], 70, GOLD, anchor="middle"))
    s.append(card("la_c0", xs[0] - 230, 240, 460, 300, GOLD, op=0)); c.fade_in("#la_c0", C["l2"][1] + 0.2, y=10)
    s.append(W(c, "la_c0a", xs[0], 320, "National Highway Safety Act", C["l2"][1] + 0.3, 32, anchor="middle"))
    s.append(W(c, "la_c0b", xs[0], 410, 'DOT sets EMS <tspan fill="#ffd23f">standards</tspan>', C["l2"][1] + 1.6, 38, anchor="middle"))
    s.append(f'<g id="la_cl" opacity="0"><rect x="{xs[0]-45}" y="430" width="90" height="100" rx="8" fill="#e9e1cc"/><rect x="{xs[0]-20}" y="420" width="40" height="18" rx="4" fill="{INK}"/>'
             + "".join(f'<path d="M {xs[0]-28} {460+i*22} l 8 8 l 14 -14" stroke="{GREEN}" stroke-width="5" fill="none"/><line x1="{xs[0]+0}" y1="{464+i*22}" x2="{xs[0]+30}" y2="{464+i*22}" stroke="#777" stroke-width="4"/>' for i in range(3)) + '</g>')
    c.fade_in("#la_cl", C["l2"][1] + 2.4, y=10)
    s.append(L(c, "la_hw", xs[0], 760, "a highway agency still guides EMS", C["l2"][2], 30, INK))
    s.append(W(c, "la_y1", xs[1], 660, "1970", C["l3"][1], 70, GOLD, anchor="middle"))
    s.append(card("la_c1", xs[1] - 230, 240, 460, 300, TEAL, op=0)); c.fade_in("#la_c1", C["l3"][1] + 0.2, y=10)
    s.append(W(c, "la_c1a", xs[1], 320, "National Registry (NREMT)", C["l3"][1] + 0.3, 34, anchor="middle"))
    s.append(W(c, "la_c1b", xs[1], 410, 'the <tspan fill="#2ee6d6">test</tspan> you study for', C["l3"][2], 34, anchor="middle"))
    s.append(f'<g id="la_ex" opacity="0"><rect x="{xs[1]-40}" y="430" width="80" height="100" rx="6" fill="#f4f6fb"/>' + "".join(f'<circle cx="{xs[1]-20}" cy="{455+i*22}" r="6" fill="none" stroke="#555" stroke-width="3"/><line x1="{xs[1]-6}" y1="{455+i*22}" x2="{xs[1]+28}" y2="{455+i*22}" stroke="#777" stroke-width="4"/>' for i in range(3)) + '</g>')
    c.fade_in("#la_ex", C["l3"][2] + 0.4, y=10)
    s.append(W(c, "la_y2", xs[2], 660, "1973", C["l3"][3], 70, GOLD, anchor="middle"))
    s.append(card("la_c2", xs[2] - 230, 240, 460, 300, GREEN, op=0)); c.fade_in("#la_c2", C["l3"][3] + 0.2, y=10)
    s.append(W(c, "la_c2a", xs[2], 320, "National EMS Systems Act", C["l3"][3] + 0.6, 34, anchor="middle"))
    s.append(W(c, "la_c2b", xs[2], 410, 'money to <tspan fill="#3fe07a">build</tspan> systems', C["l3"][3] + 2.0, 36, anchor="middle"))
    s.append(ambulance("la_amb", xs[2] - 130, 520, 0.45) ); c.fade_in("#la_amb", C["l3"][3] + 2.4, y=10)
    s.append(chip("la_corner", xs[2], 760, "cornerstone federal law", GREEN, 32)); c.pop("#la_corner", C["l3"][4])
    s.append(L(c, "la_paper", xs[2], 840, "paper standards don't buy ambulances", C["l3"][3] - 0.4, 32, INK))
    c.hide("#la_paper", C["l3"][4] - 0.2)
    c.hide("#la_hw", C["l3"][1] - 0.2)
    # mnemonic
    for i, (y_, w_, col) in enumerate([("66", "set the standards", GOLD), ("70", "made the test", TEAL), ("73", "built the systems", GREEN)]):
        s.append(chip(f"la_m{i}", xs[i], 900, f"'{y_} {w_}", col, 34)); c.pop(f"#la_m{i}", C["l4"][i + 1]); c.sound("pat", C["l4"][i + 1], 0.5)
    lawsall = ["#la_ax", "#la_c0", "#la_c0a", "#la_c0b", "#la_cl", "#la_y0", "#la_y1", "#la_c1", "#la_c1a", "#la_c1b", "#la_ex", "#la_y2", "#la_c2", "#la_c2a", "#la_c2b", "#la_amb", "#la_corner", "#la_m0", "#la_m1", "#la_m2"]
    for sel in lawsall: c.to(sel, C["l4"][4] - 0.2, "opacity:0.15", d=0.4)
    # states take over
    s.append(card("la_st", 360, 180, 1200, 380, GOLD, fill="rgba(8,20,40,.92)", op=0)); c.fade_in("#la_st", C["l4"][4], y=10)
    s.append(W(c, "la_st1", 960, 270, "early 1980s: money → block grants to states", C["l4"][4] + 0.2, 42, anchor="middle"))
    s.append(f'<g id="la_states" opacity="0">' + "".join(f'<rect x="{560+i*90}" y="{320 + (i%2)*20}" width="76" height="60" rx="8" fill="{["#2e6fa8","#3a8a6a","#8a6a3a","#6a4a8a","#2e8aa8","#a85a4a","#4a6a2e","#3a5aa8","#8a3a6a"][i]}"/>' for i in range(9)) + '</g>')
    c.fade_in("#la_states", C["l4"][4] + 1.6, y=10)
    s.append(W(c, "la_st2", 960, 470, 'states run their own systems · <tspan fill="#2ee6d6">NHTSA</tspan> (part of DOT) guides', C["l4"][5], 38, anchor="middle"))
    s.append('</g>')
    return "".join(s)

def standards(c):
    t0, t1 = chapter_span(c, "standards")
    T, C = c.T, c.C
    s = ['<g id="g_st" opacity="0">']
    c.scene("#g_st", t0, t1)
    s.append(W(c, "st_h", 960, 200, "NHTSA's 10 EMS system standards", T["l5"] + 0.2, 56, anchor="middle"))
    s.append(f'<g id="st_clip" opacity="0"><rect x="860" y="300" width="200" height="260" rx="14" fill="#e9e1cc"/><rect x="915" y="285" width="90" height="34" rx="8" fill="{INK}"/>'
             + "".join(f'<path d="M 885 {350+i*40} l 10 10 l 18 -18" stroke="{GREEN}" stroke-width="5" fill="none"/><line x1="925" y1="{355+i*40}" x2="1030" y2="{355+i*40}" stroke="#777" stroke-width="5"/>' for i in range(5)) + '</g>')
    c.fade_in("#st_clip", C["l5"][1], y=20)
    s.append(L(c, "st_10", 960, 640, "10 parts every system must have", C["l5"][2], 40, GOLD))
    s.append(L(c, "st_3", 960, 720, "sort them into 3 groups", C["l5"][3], 40, TEAL))
    hideall(c, ["#st_clip", "#st_10", "#st_3"], T["l6"] - 0.3)
    cols = [(100, "people and rules", INK), (700, "getting to care", TEAL), (1300, "keeping it honest", GOLD)]
    groups = [[("Regulation and policy", "l6", 1), ("Resource management", "l6", 2), ("Human resources and training", "l6", 3)],
              [("Transportation", "l7", 1), ("Facilities", "l7", 2), ("Communications", "l7", 3), ("Trauma systems", "l7", 4)],
              [("Public information and education", "l8", 1), ("Medical direction", "l8", 2), ("Evaluation: QI · QA · TQM", "l8", 3)]]
    notes = {"Regulation and policy": "laws and rules", "Resource management": "same equipment, same care", "Human resources and training": "who works, how trained (you)",
             "Transportation": "safe, reliable ambulances", "Facilities": "the RIGHT hospital", "Communications": "Maya's call → radio report", "Trauma systems": "networks of trauma centers",
             "Public information and education": "know when to call 911", "Medical direction": "a physician oversees EMTs", "Evaluation: QI · QA · TQM": "check the work, improve it"}
    n = 0
    for (x, head, col), items in zip(cols, groups):
        key0 = items[0][1]
        s.append(card(f"st_col{n}", x, 250, 520, 760, col, op=0))
        c.fade_in(f"#st_col{n}", T[key0] + 0.1, y=20); c.sound("swish", T[key0] + 0.1, 0.4)
        s.append(W(c, f"st_hd{n}", x + 260, 320, head, T[key0] + 0.3, 40, col, anchor="middle"))
        for j, (name, key, cue) in enumerate(items):
            y = 410 + j * 150
            tt = C[key][cue]
            s.append(f'<g id="st_i{n}_{j}" opacity="0"><rect x="{x+20}" y="{y-40}" width="480" height="128" rx="16" fill="#10264a" stroke="{col}" stroke-width="3"/>'
                     f'<text x="{x+40}" y="{y+2}" font-family="Inter" font-weight="900" font-size="{24 if len(name) > 28 else (27 if len(name) > 20 else 30)}" fill="{WHITE}">{name}</text>'
                     f'<text x="{x+40}" y="{y+56}" font-family="Kalam" font-weight="700" font-size="34" fill="{col}">{notes[name]}</text></g>')
            c.fade_in(f"#st_i{n}_{j}", tt, y=15); c.sound("pat", tt, 0.4)
        n += 1
    c.pulse("#st_i1_1", C["l7"][2] + 0.4, C["l7"][2] + 2.0, amp=1.04)
    s.append(L(c, "st_next", 960, 1050, "medical direction + QI: next video", C["l8"][4], 30, INK))
    allst = [f"#st_col{i}" for i in range(3)] + [f"#st_hd{i}" for i in range(3)] + [f"#st_i{a}_{b}" for a, g in enumerate(groups) for b in range(len(g))] + ["#st_h", "#st_next"]
    hideall(c, allst, T["k2q"] - 0.3)
    s.append(qcheck(c, "k2", "k2q", ["Every month a system reviews run reports", "(the record of each call) to find and fix", "problems. Which standard is that?"]))
    s.append(W(c, "k2_a1", 960, 720, 'evaluation (quality improvement)', T["k2a"] + 0.1, 58, GREEN, anchor="middle"))
    s.append(f'<g id="k2_tr" opacity="0">{card("k2_trc", 360, 800, 1200, 170, CORAL, op=1)}</g>'); c.fade_in("#k2_tr", C["k2a"][1], y=10); c.sound("wrong", C["k2a"][1], 0.5)
    s.append(W(c, "k2_a2", 960, 870, '<tspan fill="#ff6b6b">trap:</tspan> medical direction', C["k2a"][1] + 0.2, 48, anchor="middle"))
    s.append(W(c, "k2_a3", 960, 940, 'finding and fixing problems = evaluation', C["k2a"][1] + 2.5, 40, INK, anchor="middle"))
    s.append('</g>')
    return "".join(s)

def call(c):
    t0, t1 = chapter_span(c, "call")
    T, C = c.T, c.C
    s = ['<g id="g_ca" opacity="0">']
    c.scene("#g_ca", t0, t1)
    s.append(img("ca_my", "maya-phone", 160, 1000, 640, op=0)); c.fade_in("#ca_my", T["c1"] + 0.1, y=0)
    s.append(phone_icon("ca_ph", 700, 380, 1.6, TEAL, 0, "911")); c.pop("#ca_ph", C["c1"][1]); c.sound("check", C["c1"][1], 0.5)
    stats = [("nearly everyone in the US", 2, TEAL), ("≈ 240 million calls a year", 3, GOLD), ("80%+ from mobiles (many areas)", 4, CORAL)]
    for i, (txt, cue, col) in enumerate(stats):
        s.append(W(c, f"ca_s{i}", 900, 330 + i * 120, txt, C["c1"][cue], 48, col))
    s.append(W(c, "ca_where", 900, 760, "so... where is the caller?", C["c1"][4] + 3.0, 60, WHITE))
    c.sound("riser", C["c1"][4] + 2.6, 0.4)
    hideall(c, ["#ca_my", "#ca_ph", "#ca_s0", "#ca_s1", "#ca_s2", "#ca_where"], T["c2"] - 0.3)
    # landline
    s.append(f'<g id="ca_map" opacity="0"><rect x="100" y="240" width="1720" height="760" rx="30" fill="#14304f"/>'
             + "".join(f'<path d="M {100+i*215} 240 L {100+i*215} 1000" stroke="#1d3d63" stroke-width="16"/>' for i in range(1, 8))
             + "".join(f'<path d="M 100 {240+i*190} L 1820 {240+i*190}" stroke="#1d3d63" stroke-width="16"/>' for i in range(1, 4)) + '</g>')
    c.fade_in("#ca_map", T["c2"] + 0.1, y=0)
    s.append(house("ca_hs", 520, 760, 0.8)); c.fade_in("#ca_hs", T["c2"] + 0.3, y=10)
    s.append(P(c, "ca_wire", "M 600 700 L 900 700 L 900 520 L 1200 520", C["c2"][1], GOLD, 6, 0.8))
    s.append(card("ca_scr", 1210, 380, 520, 260, TEAL, op=0)); c.fade_in("#ca_scr", C["c2"][1] + 0.6, y=10)
    s.append(W(c, "ca_scr1", 1240, 470, "Enhanced 911", C["c2"][1] + 0.7, 44, TEAL))
    s.append(W(c, "ca_scr2", 1240, 540, "number ✓  address ✓", C["c2"][1] + 1.6, 42))
    s.append(pin("ca_pin0", 520, 560, CORAL)); c.pop("#ca_pin0", C["c2"][1] + 2.2); c.sound("pat", C["c2"][1] + 2.2, 0.5)
    s.append(L(c, "ca_fixed", 520, 860, "wired to one fixed address", C["c2"][1] + 0.4, 32, WHITE))
    s.append(L(c, "ca_cant", 1470, 720, "works even if the caller can't speak", C["c2"][2], 30, GREEN))
    hideall(c, ["#ca_hs", "#ca_wire", "#ca_scr", "#ca_scr1", "#ca_scr2", "#ca_pin0", "#ca_fixed", "#ca_cant"], T["c3"] - 0.3)
    # wireless phases
    s.append(tower("ca_tw", 560, 700)); c.fade_in("#ca_tw", T["c3"] + 0.1, y=10)
    s.append(L(c, "ca_ph1", 1400, 330, "PHASE I", C["c3"][1], 48, GOLD, "middle", 900))
    s.append(L(c, "ca_ph1b", 1400, 390, "callback number + which tower", C["c3"][1] + 0.4, 34, WHITE))
    s.append(f'<circle id="ca_area" cx="560" cy="560" r="20" fill="rgba(255,210,63,.12)" stroke="{GOLD}" stroke-width="4" stroke-dasharray="14 10" opacity="0"/>')
    c.fade_in("#ca_area", C["c3"][2], y=0); c.to("#ca_area", C["c3"][2], "attr:{r:330}", d=1.4, ease="power2.out")
    s.append(L(c, "ca_miles", 560, 960, "a tower can cover miles: rough area only", C["c3"][2] + 0.6, 30, GOLD))
    s.append(house("ca_mh", 760, 640, 0.4)); c.fade_in("#ca_mh", C["c3"][2] + 0.4, y=0)
    s.append(L(c, "ca_ph2", 1400, 520, "PHASE II", C["c3"][3], 48, TEAL, "middle", 900))
    s.append(L(c, "ca_ph2b", 1400, 580, "the phone's own location", C["c3"][3] + 0.4, 34, WHITE))
    s.append(pin("ca_pin2", 760, 560, TEAL)); c.pop("#ca_pin2", C["c3"][3] + 0.6); c.sound("check", C["c3"][3] + 0.6, 0.5)
    s.append(W(c, "ca_ll", 1400, 650, "34.05° N, 118.25° W", C["c3"][3] + 1.0, 40, TEAL, anchor="middle"))
    s.append(L(c, "ca_sum1", 1400, 790, "Phase I → call her back", C["c3"][4], 38, GOLD))
    s.append(L(c, "ca_sum2", 1400, 860, "Phase II → find the house", C["c3"][4] + 1.6, 38, TEAL))
    hideall(c, ["#ca_tw", "#ca_ph1", "#ca_ph1b", "#ca_area", "#ca_miles", "#ca_mh", "#ca_ph2", "#ca_ph2b", "#ca_pin2", "#ca_ll", "#ca_sum1", "#ca_sum2", "#ca_map"], T["c4"] - 0.3)
    # VoIP
    s.append(f'<g id="ca_lap" opacity="0"><rect x="420" y="400" width="420" height="270" rx="16" fill="#1c2c48" stroke="{INK}" stroke-width="6"/><rect x="445" y="425" width="370" height="220" fill="#244a80"/>'
             f'<path d="M 360 690 L 900 690 L 860 730 L 400 730 Z" fill="{INK}"/><path d="M 600 520 a 30 30 0 1 1 60 0" stroke="{TEAL}" stroke-width="6" fill="none"/></g>')
    c.fade_in("#ca_lap", T["c4"] + 0.2, y=20)
    s.append(L(c, "ca_voip", 630, 820, "VoIP: voice over internet protocol", C["c4"][1], 34, WHITE))
    s.append(card("ca_reg", 1050, 360, 640, 260, CORAL, op=0)); c.fade_in("#ca_reg", C["c4"][2], y=10)
    s.append(W(c, "ca_reg1", 1080, 450, "registered address:", C["c4"][2] + 0.2, 40, INK))
    s.append(W(c, "ca_reg2", 1080, 530, "12 Old Street (moved!)", C["c4"][2] + 1.4, 44, CORAL))
    c.sound("wrong", C["c4"][2] + 2.4, 0.4)
    s.append(L(c, "ca_ch", 1370, 720, "still an ongoing challenge", C["c4"][3], 34, GOLD))
    hideall(c, ["#ca_lap", "#ca_voip", "#ca_reg", "#ca_reg1", "#ca_reg2", "#ca_ch"], T["k3q"] - 0.3)
    s.append(qcheck(c, "k3", "k3q", ["A caller hangs up before giving an address.", "Which phase shows where the phone is?"]))
    s.append(W(c, "k3_a1", 960, 620, '<tspan fill="#2ee6d6">Phase II</tspan>: the device itself', T["k3a"] + 0.1, 58, anchor="middle"))
    s.append(W(c, "k3_a2", 960, 740, 'Phase I: number + tower (rough area)', C["k3a"][2], 48, GOLD, anchor="middle"))
    s.append(W(c, "k3_a3", 960, 850, 'I → call back · II → find them', C["k3a"][2] + 3.0, 48, WHITE, anchor="middle"))
    s.append('</g>')
    return "".join(s)

def dispatch(c):
    t0, t1 = chapter_span(c, "dispatch")
    T, C = c.T, c.C
    s = ['<g id="g_di" opacity="0">']
    c.scene("#g_di", t0, t1)
    # dispatch center: blurred far wall of screens, warm desk light
    s.append(f'<g id="di_room"><g filter="url(#blur6)"><rect x="-100" y="0" width="2120" height="1080" fill="#14203a"/>'
             + "".join(f'<rect x="{80+i*300}" y="120" width="260" height="150" rx="8" fill="#1a2b48"/><rect x="{100+i*300}" y="140" width="220" height="110" fill="#2e5a94" opacity=".55"/><path d="M {115+i*300} 220 l 40 -30 l 40 20 l 40 -40 l 40 25" stroke="#7fd8ff" stroke-width="5" fill="none" opacity=".6"/>' for i in range(6))
             + '<rect x="-100" y="700" width="2120" height="40" fill="#25324d"/><rect x="-100" y="740" width="2120" height="160" fill="#1a2438"/>' 
             + f'</g><rect x="-100" y="880" width="2120" height="200" fill="#0c1322"/></g>')
    c.g('tl.fromTo("#di_room",{x:0},{x:-30,duration:%.2f,ease:"none"},%.2f);' % (T["c6"] - t0, t0))
    s.append(img("di_e1", "emd-typing", 160, 960, 620, op=0)); s.append(img("di_e2", "emd-talking", 160, 960, 612, op=0))
    c.fade_in("#di_e1", T["c5"] + 0.1, y=0)
    s.append(W(c, "di_emd", 1240, 330, "emergency medical dispatcher (EMD)", C["c5"][1], 40, TEAL, anchor="middle"))
    s.append(L(c, "di_cert", 1240, 400, "specially trained and certified", C["c5"][1] + 0.6, 32, WHITE))
    c.sound("pat", C["c5"][2], 0.3); c.sound("pat", C["c5"][2] + 0.3, 0.3); c.sound("pat", C["c5"][2] + 0.6, 0.3)
    s.append(card("di_q", 1000, 450, 480, 260, INK, op=0)); c.fade_in("#di_q", C["c5"][2], y=10)
    for i, q in enumerate(["Is he awake?", "Is he breathing?", "What's the address?"]):
        s.append(W(c, f"di_q{i}", 1030, 520 + i * 70, q, C["c5"][2] + 0.4 + i * 0.8, 36))
    s.append(ambulance("di_amb", 1540, 760, 0.7)); c.fade_in("#di_amb", C["c5"][3], y=0)
    c.g('tl.to("#di_amb",{x:400,duration:3,ease:"power1.in"},%.2f);' % (C["c5"][3] + 0.6)); c.sound("swish", C["c5"][3] + 0.6, 0.5)
    s.append(f'<g id="di_siren" opacity="0"><circle cx="1570" cy="680" r="14" fill="{RED}"/><circle cx="1670" cy="680" r="14" fill="{BLUE}"/></g>')
    c.fade_in("#di_siren", C["c5"][3] + 0.1, y=0); c.g('tl.to("#di_siren",{opacity:0.2,duration:0.2,yoyo:true,repeat:12},%.2f);' % (C["c5"][3] + 0.3))
    c.to("#di_siren", C["c5"][3] + 0.6, "x:400", d=3)
    s.append(L(c, "di_lights", 1500, 860, "lights and siren", C["c5"][3] + 0.3, 30, WHITE))
    s.append(W(c, "di_not", 1240, 960, "but the EMD's job isn't over", C["c5"][4], 40, GOLD, anchor="middle"))
    hideall(c, ["#di_emd", "#di_cert", "#di_q", "#di_q0", "#di_q1", "#di_q2", "#di_amb", "#di_siren", "#di_lights", "#di_not", "#di_e1", "#di_room"], T["c6"] - 0.3)
    # back home: Frank slumps, Maya does compressions
    far, mid, fg = dining_room("d2")
    s.append(f'<g id="di_home" opacity="0">{far}{mid}</g>')
    c.fade_in("#di_home", T["c6"] - 0.1, y=0)
    s.append(img("di_fs", "frank-slump", 1000, 990, 560, op=0)); c.fade_in("#di_fs", T["c6"], y=0, d=0.2)
    c.g('tl.fromTo("#di_fs",{rotation:0,svgOrigin:"1100 990"},{rotation:-6,duration:0.6,ease:"power2.in"},%.2f);' % T["c6"]); c.sound("flinch", T["c6"] + 0.3, 0.6)
    s.append(L(c, "di_nb", 1250, 330, "not breathing normally", T["c6"] + 1.5, 40, CORAL))
    c.hide("#di_fs", C["c6"][1] + 0.6); c.hide("#di_nb", C["c6"][1] + 0.6)
    s.append(img("di_ff", "frank-floor", 600, 1000, 125, op=0)); c.fade_in("#di_ff", C["c6"][1] + 0.8, y=0)
    s.append(img("di_mc", "maya-cpr", 360, 990, 440, op=0)); c.fade_in("#di_mc", C["c6"][1] + 1.0, y=0); c.sound("cloth", C["c6"][1] + 1.0, 0.6)
    c.g('tl.to("#di_mc",{y:14,duration:0.27,yoyo:true,repeat:%d,ease:"power1.inOut"},%.2f);' % (int((T["c7"] + c.D["c7"] - C["c6"][1] - 2) / 0.27) // 2 * 2 - 1, C["c6"][1] + 1.6))
    for k in range(int((C["c6"][3] - C["c6"][1] - 1.6) / 0.54)):
        c.sound("pat", C["c6"][1] + 1.6 + k * 0.54, 0.25)
    s.append(phone_icon("di_sp", 1560, 760, 0.9, GOLD, 0)); c.pop("#di_sp", C["c6"][1] + 0.2)
    s.append(f'<path id="di_wv" d="M 1620 700 a 40 40 0 0 1 0 60 M 1650 680 a 70 70 0 0 1 0 100" stroke="{GOLD}" stroke-width="6" fill="none" opacity="0"/>')
    c.fade_in("#di_wv", C["c6"][1] + 0.4, y=0)
    s.append(L(c, "di_spk", 1560, 870, "speaker on", C["c6"][1] + 0.5, 30, GOLD))
    s.append(card("di_pai", 1180, 220, 640, 400, TEAL, fill="rgba(8,20,40,.88)", op=0)); c.fade_in("#di_pai", C["c6"][2], y=10)
    s.append(W(c, "di_pa", 1500, 300, "pre-arrival instructions", C["c6"][2] + 0.2, 44, TEAL, anchor="middle"))
    s.append(L(c, "di_pa0", 1220, 385, "on the floor: firm surface", C["c6"][1] + 3.0, 30, WHITE, "start"))
    for i, (txt, cue) in enumerate([("CPR: compressions (+ breaths)", 3), ("how to give breaths", 4), ("how to control bleeding", 5)]):
        s.append(W(c, f"di_p{i}", 1220, 450 + i * 60, "• " + txt, C["c6"][cue], 34))
    s.append(W(c, "di_big", 560, 330, "care has ALREADY started", C["c7"][2], 56, GREEN, anchor="middle"))
    s.append(f'<g id="di_amb2" opacity="0">{ambulance("di_amb2i", 1500, 1060, 0.45, 1)}</g>'); c.fade_in("#di_amb2", C["c7"][1], y=0)
    s.append(L(c, "di_away", 1580, 950, "minutes away", C["c7"][1] + 0.2, 28, INK))
    s.append(chip("di_cal", 560, 420, "the chain starts with the caller", GOLD, 36)); c.pop("#di_cal", C["c7"][3]); c.sound("shimmer", C["c7"][3], 0.5)
    s.append('</g>')
    return "".join(s)

def flow_ch(c):
    t0, t1 = chapter_span(c, "flow")
    T, C = c.T, c.C
    s = ['<g id="g_fl" opacity="0">']
    c.scene("#g_fl", t0, t1)
    s.append(W(c, "fl_h", 960, 190, "a chain of handoffs", T["f1"] + 0.2, 56, anchor="middle"))
    strip = ["Maya calls", "EMD", "responders", "ambulance", "ED", "hospital"]
    for i, t_ in enumerate(strip):
        s.append(chip(f"fl_sp{i}", 260 + i * 280, 800, t_, [GOLD, TEAL, WHITE, WHITE, CORAL, GREEN][i], 32, w=240)); c.pop(f"#fl_sp{i}", C["f1"][1] + 0.3 * i); c.sound("pat", C["f1"][1] + 0.3 * i, 0.3)
        if i: s.append(L(c, f"fl_sa{i}", 120 + i * 280, 812, "→", C["f1"][1] + 0.3 * i, 40, GOLD))
    s.append(headset_icon("fl_emd", 240, 360, TEAL, 0)); c.fade_in("#fl_emd", C["f1"][2], y=0)
    s.append(L(c, "fl_emdl", 240, 470, "EMD", C["f1"][2] + 0.2, 36, TEAL))
    s.append(P(c, "fl_a0", "M 320 400 L 470 400", C["f1"][3], GOLD, 6, 0.4, "ah"))
    levels = [("EMR", "emergency medical responder", INK), ("EMT", "you are here", GOLD), ("AEMT", "advanced EMT", TEAL), ("Paramedic", "", GREEN)]
    for i, (a, b, col) in enumerate(levels):
        x = 640 + i * 340
        s.append(chip(f"fl_lv{i}", x, 400, a, col, 44, w=280)); c.pop(f"#fl_lv{i}", C["f1"][4 + i]); c.sound("pat", C["f1"][4 + i], 0.4)
        if b: s.append(L(c, f"fl_lb{i}", x, 480, b, C["f1"][4 + i] + 0.2, 26, col))
    s.append(L(c, "fl_next", 1150, 560, "what each level can do: next video", C["f1"][7] + 1.0, 28, INK))
    hideall(c, [f"#fl_sp{i}" for i in range(6)] + [f"#fl_sa{i}" for i in range(1, 6)] + ["#fl_h", "#fl_emd", "#fl_emdl", "#fl_a0", "#fl_next"] + [f"#fl_lv{i}" for i in range(4)] + [f"#fl_lb{i}" for i in (0, 1, 2)], T["f2"] - 0.3)
    # crew takes over, radio ahead, ED gateway
    far, mid, fg = dining_room("d3")
    s.append(f'<g id="fl_home" opacity="0">{far}</g>'); c.fade_in("#fl_home", T["f2"], y=0); c.to("#fl_home", T["f2"], "opacity:0.6", d=0.4)
    s.append(img("fl_ff", "frank-floor", 200, 1000, 100, op=0) + img("fl_mr", "maya-relief", 20, 1000, 470, op=0) + img("fl_cpr", "emts-walk", 900, 1000, 560, op=0))
    c.fade_in("#fl_ff", T["f2"], y=0); c.fade_in("#fl_mr", T["f2"], y=0)
    c.g('tl.fromTo("#fl_cpr",{opacity:0,x:500},{opacity:1,x:-280,duration:1.6,ease:"power2.out"},%.2f);' % (T["f2"] + 0.1)); c.sound("cloth", T["f2"] + 0.1, 0.5)
    s.append(L(c, "fl_tk", 880, 400, "crew takes over CPR", T["f2"] + 1.4, 34, GOLD))
    s.append(f'<g id="fl_radio" opacity="0"><rect x="860" y="430" width="70" height="130" rx="12" fill="#222c3c" stroke="{INK}" stroke-width="4"/><rect x="880" y="380" width="12" height="60" fill="{INK}"/>'
             f'<path d="M 960 450 a 40 40 0 0 1 0 60 M 990 430 a 70 70 0 0 1 0 100 M 1020 410 a 100 100 0 0 1 0 140" stroke="{TEAL}" stroke-width="6" fill="none"/></g>')
    c.set("#fl_radio", 0, "x:330"); c.fade_in("#fl_radio", C["f2"][1], y=0); c.sound("check", C["f2"][1], 0.4)
    s.append(L(c, "fl_rl", 1230, 620, "report radioed ahead", C["f2"][1] + 0.3, 30, TEAL))
    s.append(hospital("fl_ed", 1600, 640, 0.9, 0, "Emergency Department (ED)")); c.fade_in("#fl_ed", C["f2"][1] + 2.0, y=10)
    for i, (txt, cue) in enumerate([("operating room (OR)", 2), ("specialists", 3), ("a bed upstairs", 4)]):
        s.append(chip(f"fl_d{i}", 1600, 760 + i * 80, txt, [CORAL, VIOLET, TEAL][i], 30)); c.pop(f"#fl_d{i}", C["f2"][cue]); c.sound("pat", C["f2"][cue], 0.4)
    s.append(L(c, "fl_gate", 1600, 330, "the gateway to the hospital", C["f2"][2] - 0.6, 30, GOLD))
    hideall(c, ["#fl_ff", "#fl_mr", "#fl_tk", "#fl_home", "#fl_cpr", "#fl_radio", "#fl_rl", "#fl_ed", "#fl_gate"] + [f"#fl_d{i}" for i in range(3)], T["f3"] - 0.3)
    # specialty centers
    s.append(W(c, "fl_sc", 960, 220, "specialty centers", C["f3"][1], 56, GOLD, anchor="middle"))
    cents = [("TRAUMA", "surgical team 24/7", CORAL, 2), ("BURN", "", WARM, 3), ("PEDIATRIC", "", TEAL, 4), ("CARDIAC", "", RED, 5), ("STROKE", "", VIOLET, 6)]
    for i, (nm, sub, col, cue) in enumerate(cents):
        x = 230 + i * 365
        s.append(hospital(f"fl_c{i}", x, 620, 0.8, 0, accent=col)); c.fade_in(f"#fl_c{i}", C["f3"][cue], y=20); c.sound("pat", C["f3"][cue], 0.4)
        s.append(L(c, f"fl_cl{i}", x, 700, nm, C["f3"][cue] + 0.1, 38, col, "middle", 900))
        if sub: s.append(L(c, f"fl_cs{i}", x, 760, sub, C["f3"][cue] + 0.5, 28, WHITE))
    s.append(L(c, "fl_ready", 960, 900, "people + equipment for one kind of emergency, ready", C["f3"][6] + 1.0, 34, INK))
    hideall(c, ["#fl_sc", "#fl_ready", "#fl_cs0"] + [f"#fl_c{i}" for i in range(5)] + [f"#fl_cl{i}" for i in range(5)], T["f4"] - 0.3)
    # the trade off: map
    s.append(W(c, "fl_crit", 960, 200, 'picking the hospital: a <tspan fill="#ffd23f">critical</tspan> decision', T["f4"] + 0.1, 50, anchor="middle"))
    s.append(f'<g id="fl_scale" opacity="0"><path d="M 960 300 L 960 420 M 760 320 L 1160 320" stroke="{INK}" stroke-width="8"/>'
             f'<path d="M 700 330 L 820 330 L 790 400 L 730 400 Z" fill="{CORAL}"/><path d="M 1100 330 L 1220 330 L 1190 400 L 1130 400 Z" fill="{TEAL}"/>'
             f'<text x="760" y="460" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="{CORAL}">condition</text>'
             f'<text x="1160" y="460" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="{TEAL}">transport time</text></g>')
    c.fade_in("#fl_scale", C["f4"][1], y=10)
    c.g('tl.fromTo("#fl_scale",{rotation:-4,svgOrigin:"960 320"},{rotation:4,duration:1.2,yoyo:true,repeat:3,ease:"sine.inOut"},%.2f);' % (C["f4"][1] + 0.3))
    c.hide("#fl_scale", C["f4"][2] - 0.2)
    s.append(f'<g id="fl_map" opacity="0"><rect x="160" y="300" width="1600" height="640" rx="30" fill="#14304f"/>'
             f'<path d="M 260 820 C 600 820, 700 600, 980 600 S 1500 420, 1640 420" stroke="#2a4f7c" stroke-width="40" fill="none"/>'
             f'<path d="M 260 820 C 400 820, 520 760, 600 700" stroke="#2a4f7c" stroke-width="40" fill="none"/></g>')
    c.fade_in("#fl_map", C["f4"][2], y=0)
    s.append(f'<g id="fl_crash" opacity="0"><path d="M 230 790 l 20 -40 l 20 30 l 20 -35 l 15 45 l 25 -10 l -20 35 l 25 20 l -45 0 l -10 30 l -20 -30 l -40 10 l 25 -30 Z" fill="{GOLD}"/></g>')
    c.pop("#fl_crash", C["f4"][2] + 0.3); c.sound("flinch", C["f4"][2] + 0.3, 0.5)
    s.append(hospital("fl_h5", 640, 680, 0.55, 0, accent=INK) + L(c, "fl_5l", 640, 730, "5 min", C["f4"][2] + 0.9, 38, WHITE)); c.fade_in("#fl_h5", C["f4"][2] + 0.8, y=10)
    s.append(hospital("fl_h15", 1640, 400, 0.55, 0, accent=CORAL) + L(c, "fl_15l", 1640, 570, "15 min", C["f4"][2] + 1.7, 38, WHITE)); c.fade_in("#fl_h15", C["f4"][2] + 1.6, y=10)
    s.append(L(c, "fl_tc", 1640, 450, "trauma center", C["f4"][2] + 1.8, 30, CORAL))
    s.append(L(c, "fl_nos", 860, 700, "no surgeon ready?", C["f4"][3], 30, CORAL))
    s.append(P(c, "fl_route", "M 300 820 C 600 820, 700 600, 980 600 S 1500 420, 1600 430", C["f4"][3] + 1.2, CORAL, 8, 1.6, "ahc"))
    s.append(P(c, "fl_route2", "M 300 820 C 420 820, 520 760, 590 700", C["f4"][4], GOLD, 8, 0.8, "ah"))
    s.append(L(c, "fl_10", 1100, 880, "if he might not survive 10 more minutes...", C["f4"][4] + 0.2, 30, GOLD))
    s.append(chip("fl_proto", 960, 1010, "local protocols (set by your medical director)", TEAL, 30)); c.pop("#fl_proto", C["f4"][5])
    tradeoff = ["#fl_5l", "#fl_15l", "#fl_crit", "#fl_map", "#fl_crash", "#fl_h5", "#fl_h15", "#fl_tc", "#fl_nos", "#fl_route", "#fl_route2", "#fl_10", "#fl_proto"]
    hideall(c, tradeoff, T["f5"] - 0.3)
    # offline vs online medical direction
    s.append(card("fl_off", 160, 260, 760, 420, TEAL, op=0)); c.fade_in("#fl_off", C["f5"][1], y=10)
    s.append(W(c, "fl_offt", 540, 340, "OFFLINE medical direction", C["f5"][1] + 0.2, 40, TEAL, anchor="middle"))
    s.append(f'<g id="fl_doc" opacity="0"><rect x="460" y="390" width="160" height="220" rx="10" fill="#e9e1cc"/>' + "".join(f'<line x1="485" y1="{430+i*36}" x2="595" y2="{430+i*36}" stroke="#777" stroke-width="6"/>' for i in range(5)) + '</g>')
    c.fade_in("#fl_doc", C["f5"][1] + 0.6, y=10)
    s.append(L(c, "fl_offl", 540, 650, "written protocols", C["f5"][1] + 0.8, 32, WHITE))
    s.append(card("fl_on", 1000, 260, 760, 420, GOLD, op=0)); c.fade_in("#fl_on", C["f5"][2], y=10)
    s.append(W(c, "fl_ont", 1380, 340, "ONLINE medical direction", C["f5"][2] + 0.2, 40, GOLD, anchor="middle"))
    s.append(phone_icon("fl_onp", 1300, 500, 1.0, GOLD, 0)); c.pop("#fl_onp", C["f5"][2] + 0.6)
    s.append(L(c, "fl_onl", 1450, 500, "physician, live", C["f5"][2] + 0.8, 34, WHITE, "start"))
    s.append(L(c, "fl_onl2", 1380, 650, "radio or phone, during the call", C["f5"][2] + 1.2, 30, GOLD))
    s.append(L(c, "fl_std", 960, 760, "one of the 10 standards: medical direction", C["f5"][3], 32, INK))
    hideall(c, ["#fl_off", "#fl_offt", "#fl_doc", "#fl_offl", "#fl_std"], C["f5"][4] - 0.3)
    hideall(c, ["#fl_on", "#fl_ont", "#fl_onp", "#fl_onl", "#fl_onl2"], C["f5"][4] - 0.3)
    s.append(hospital("fl_card", 1400, 820, 0.9, 0, "cardiac center", accent=RED)); c.fade_in("#fl_card", C["f5"][4] + 0.2, y=20)
    s.append(heart_icon("fl_hb", 1400, 470, 2.0, RED, 0)); c.fade_in("#fl_hb", C["f5"][4] + 0.4, y=0)
    c.pulse("#fl_hb", C["f5"][4] + 0.5, C["f5"][4] + 4.5, amp=1.15, per=0.8); c.sound("heartbeat", C["f5"][4] + 0.5, 0.5)
    s.append(L(c, "fl_pb", 1400, 940, "if his pulse comes back", C["f5"][4] + 0.4, 30, WHITE))
    s.append(card("fl_lc", 140, 420, 760, 400, GREEN, op=0)); c.fade_in("#fl_lc", C["f5"][4] + 1.4, y=10)
    s.append(W(c, "fl_open", 520, 520, "can open a blocked", C["f5"][4] + 1.6, 44, anchor="middle"))
    s.append(W(c, "fl_open2", 520, 590, "heart artery right away", C["f5"][4] + 2.6, 44, anchor="middle"))
    s.append(W(c, "fl_every", 520, 740, "someone caring at every handoff", C["f5"][4] + 5.0, 40, GREEN, anchor="middle"))
    s.append('</g>')
    return "".join(s)

def recap(c):
    t0, t1 = chapter_span(c, "recap")
    T, C = c.T, c.C
    s = ['<g id="g_rc" opacity="0">']
    c.scene("#g_rc", t0, t1)
    s.append(P(c, "rc_line", "M 140 560 L 1780 560", T["recap"] + 0.2, TEAL, 8, 1.2, "aht"))
    items = [("transport → care at the scene", 1, 340, 380, INK), ("1966 · 1970 · 1973 laws", 2, 960, 380, GOLD),
             ("NHTSA: 10 standards", 3, 1580, 380, GOLD), ("911: Phase I rough, II exact", 4, 340, 760, TEAL),
             ("EMD: pre-arrival instructions", 5, 960, 760, GREEN), ("handoffs → the right hospital", 6, 1580, 760, CORAL)]
    for i, (txt, cue, x, y, col) in enumerate(items):
        s.append(card(f"rc_c{i}", x - 295, y - 80, 590, 130, col, op=0)); c.fade_in(f"#rc_c{i}", C["recap"][cue], y=15); c.sound("pat", C["recap"][cue], 0.4)
        s.append(W(c, f"rc_t{i}", x, y + 6, txt, C["recap"][cue] + 0.2, 36, WHITE, anchor="middle"))
        s.append(f'<circle id="rc_d{i}" cx="{x}" cy="560" r="16" fill="{col}" opacity="0"/>'); c.pop(f"#rc_d{i}", C["recap"][cue])
    s.append('</g>')
    return "".join(s)

def problem(c, pid, qkey, akey, n, qlines, steps, trap):
    s = [qcheck(c, pid, qkey, qlines, y=200, label=f"PROBLEM {n}", color=TEAL, gap=75, size=48)]
    T, C = c.T, c.C
    y = 200 + 140 + 75 * len(qlines) + 70
    for i, (txt, cue) in enumerate(steps):
        t = T[akey] + 0.1 if cue == 0 else C[akey][cue]
        s.append(W(c, f"{pid}_s{i}", 330, y + i * 80, txt, t, 44))
    tt, cue = trap
    s.append(card(f"{pid}_tc", 300, 900, 1320, 110, CORAL, op=0)); c.fade_in(f"#{pid}_tc", C[akey][cue], y=10); c.sound("wrong", C[akey][cue], 0.45)
    s.append(W(c, f"{pid}_tr", 340, 972, '<tspan fill="#ff6b6b">trap:</tspan> ' + tt, C[akey][cue] + 0.2, 40))
    end = T[akey] + c.D[akey] + 0.3
    hideall(c, [f"#{pid}_g", f"#{pid}_tc", f"#{pid}_tr"] + [f"#{pid}_s{i}" for i in range(len(steps))], end)
    return "".join(s)

def practice(c):
    t0, t1 = chapter_span(c, "practice")
    s = ['<g id="g_pr" opacity="0">']
    c.scene("#g_pr", t0, t1)
    s.append(problem(c, "pb1", "p1q", "p1a", 1, ["Which 1973 law is the cornerstone for EMS systems?", "A. National Highway Safety Act", "B. National EMS Systems Act", "C. the act that founded the Registry"],
                     [('<tspan fill="#3fe07a">B</tspan>: National EMS Systems Act, 1973', 0), ("A (1966) only told DOT to set standards", 2), ("the Registry was founded as an organization, 1970", 3)],
                     ("A: it came first, but it didn't build the systems", 1)))
    s.append(problem(c, "pb2", "p2q", "p2a", 2, ["Mobile caller: husband collapsed, call drops.", "Dispatcher sees number + cell tower, not the house.", "Which phase is working? What's missing?"],
                     [('<tspan fill="#ffd23f">Phase I</tspan>: callback number + tower', 0), ('missing: <tspan fill="#2ee6d6">Phase II</tspan>, the device location', 2), ("best move: call her right back", 3)],
                     ("Phase I does NOT give the address", 3)))
    s.append(problem(c, "pb3", "p3q", "p3a", 3, ["Crash, severe injuries, a longer ride is OK.", "Closest hospital 5 min · trauma center 15 min.", "What does the trauma center offer that matters most?"],
                     [('<tspan fill="#3fe07a">surgical teams 24/7</tspan>', 0), ("an operation can start without waiting", 1), ("weigh condition vs time · protocols · online direction", 3)],
                     ('"always go to the closest hospital"', 2)))
    s.append(problem(c, "pb4", "p4q", "p4a", 4, ["Before the ambulance arrives, a dispatcher talks", "a caller through chest compressions.", "What are those called, and who gives them?"],
                     [('<tspan fill="#3fe07a">pre-arrival instructions</tspan>, from the EMD', 0), ("care started before any EMT arrived", 1), ("the chain starts with the caller", 3)],
                     ("the chain starts when the crew walks in", 2)))
    s.append('</g>')
    return "".join(s)

def outro(c):
    t0, t1 = chapter_span(c, "outro")
    T, C = c.T, c.C
    s = ['<g id="g_ou" opacity="0">']
    c.scene("#g_ou", t0, t1 + 1)
    s.append(img("ou_my", "maya-relief", 1500, 1000, 560, op=0)); c.fade_in("#ou_my", T["end"], y=0)
    s.append(W(c, "ou_1", 700, 300, 'how the EMS system works ✓', T["end"] + 0.2, 60, GREEN, anchor="middle"))
    s.append(f'<text id="ou_site" x="700" y="520" text-anchor="middle" font-family="Inter" font-weight="900" font-size="96" fill="{TEAL}" opacity="0">levlprep.com</text>')
    c.fade_in("#ou_site", C["end"][1], y=20); c.sound("shimmer", C["end"][1], 0.5)
    s.append(L(c, "ou_free", 700, 600, "free practice questions", C["end"][1] + 0.3, 40, INK))
    s.append(card("ou_next", 360, 680, 680, 300, GOLD, op=0)); c.fade_in("#ou_next", C["end"][2], y=20)
    s.append(L(c, "ou_nl", 700, 740, "NEXT", C["end"][2] + 0.1, 34, GOLD))
    s.append(W(c, "ou_nt", 700, 830, 'provider levels', C["end"][2] + 0.3, 64, anchor="middle"))
    s.append(W(c, "ou_nt2", 700, 920, '+ medical direction and QI', C["end"][2] + 1.6, 40, INK, anchor="middle"))
    s.append("</g>")
    return "".join(s)

CHAPTER_FUNCS = [intro, history, laws, standards, call, dispatch, flow_ch, recap, practice, outro]

def build_spec():
    def compose(c):
        out = "".join(f(c) for f in CHAPTER_FUNCS)
        # low music bed under the story scenes only (intro, recap, outro)
        rc0 = [ch["t"] for ch in c.CH if ch["id"] == "recap"][0]
        pr0 = [ch["t"] for ch in c.CH if ch["id"] == "practice"][0]
        ou0 = [ch["t"] for ch in c.CH if ch["id"] == "outro"][0]
        it1 = [ch["t"] for ch in c.CH if ch["id"] == "history"][0]
        c.spec["music"] = [(0, c.C["hook"][3], 0.10), (c.C["hook"][3], it1, 0.05), (rc0, pr0, 0.06), (ou0, c.TOTAL, 0.10)]
        return out
    return dict(id=S.ID, course_tag="NREMT · EMS SYSTEMS 1", chapters=S.CHAPTERS, compose=compose, tail=6.0,
                images=[f"{CH}/{n}.png" for n in IMGS])

SPEC = build_spec()
