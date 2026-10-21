# Audit log (2026-10-20 long video build run):
# WHY AUDIT (independent agent): fixed the hero case order (hand pressure while the tourniquet comes out, not gauze first),
#   added what makes a bleed life threatening (r4), platelets defined, 1 L = a fifth, why narrow tourniquets fail, distal
#   pulse named and located, why the time matters, why not loosen, nosebleed pinch reason, neck air reason, recap made 5
#   lines, x2q now "slowed but didn't stop". Spec must: gloved hands in the hook, a pool not a drop, label the tourniquet tag
#   with the time only (no "TK"), limb diagrams arm AND leg, no junctional device in the ladder graphic.
# FACT CHECK (independent agent; ACS COT 2014 guideline, Stop the Bleed, TCCC, FPHC, NEMSIS scope 2019): 38 claims + 5 Qs.
#   Fixed: neck wounds (was WRONG: packing can compress the airway; now occlusive dressing for air embolism, one side, never
#   wrap), 3 min only for hemostatic gauze, no 5 to 10 min peek, limb order is pressure then tourniquet (packing where a
#   tourniquet can't go; site 29.1 table lists packing before tourniquet, logged in needs author), dressing not removed but
#   press harder, vein/artery mechanism wording, joint reason (bone and tendon shield the artery). Forearm tourniquet
#   for a wrist wound confirmed acceptable (JSOM 2015, FPHC). Re-check of 18 revised claims: all OK.
# HUMAN READ (independent agent): rewrote promise, why, r1, r2, r3, q1a, p2, p3, s5, s6, n1, n2, t1, t2, t3, w1, w2, w3, w4,
#   w5, q2q, q2a, k1, k3, k4, rc, x3a, end.
# PRONUNCIATION: clean. RUNTIME: 10,479 spoken chars, 45 beats, 12 chapters, 28 s pauses -> about 13:49 finished.
"""Script for long video NREMT 35: Bleeding control (direct pressure, tourniquets, wound packing, nosebleeds).
Source: levlprep.com/nremt/notes/bleeding-control.html, sections 29.1 and 29.2. Internal bleeding and shock (29.3) is
the next video (yt-nremt-35b). Story: a saw cut on a man's forearm in a home garage, a paramedic on scene.
Each chapter is voiced as one ElevenLabs request (under about 2,800 characters).
{n} marks a visual cue. 'pause' = seconds for pause and try beats.
Respellings are written «spoken|shown»: vo gets the spoken form, disp (captions) the shown form.
Captions also drop emotion tags and lower the CAPS emphasis.
"""
ID = "yt-nremt-35-bleeding"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", vo="{1}A miter saw kicked, and the blade caught his forearm. {2}The blood is BRIGHT red, and it's pumping out with every heartbeat, right through the gauze under her hand. {3}[urgent] A bleed like this can kill in a few minutes. {4}So what do your hands do, right now?"),
  dict(key="promise", vo="Stick with me, and you'll know which bleeds you just press on, {1}which ones get a tourniquet right away, {2}where it goes and how tight, {3}and when you pack a wound instead."),
  dict(key="why", vo="[warmly] If this feels confusing, it's usually because of what people learned years ago. {1}Tourniquets used to be the last resort, because people thought they cost the limb. {2}Military experience flipped that. If you put one on right, and it's on for the ride to the hospital, the limb is almost always fine. {3}And waiting? That's what gets people killed. {4}So today, a life threatening bleed from an arm or a leg gets a tourniquet right away."),
 ]),
 dict(id="read", title="Read the bleed", beats=[
  dict(key="r1", vo="Before you treat it, look at it, because the blood tells you which vessel is open. {1}Arterial blood is bright red. That's the oxygen. {2}And it spurts with every heartbeat, because the heart is pushing it right out. {3}It's under high pressure, so this is the one that can kill fast, and it's the toughest to stop."),
  dict(key="r2", vo="{1}Venous blood is darker red, and it flows steadily instead of spurting, because there's not much pressure behind it. {2}It can still be heavy if a big vein is open. {3}And capillary bleeding is a slow, dark red ooze from the surface, like a scraped knee. {4}It usually stops on its own."),
  dict(key="r3", vo="Now, how much blood are we talking about? {1}An adult has about five liters. {2}If an adult suddenly loses about one liter, roughly a fifth of it, that's serious. {3}A child has a lot less, so around five hundred milliliters is serious. {4}And for an infant, just a hundred to two hundred milliliters. {5}[serious] So the same puddle on the floor is a very different problem with a baby than with a grown man."),
  dict(key="r4", vo="So what makes a bleed life threatening? {1}It's spurting, {2}or it's pooling on the floor fast, {3}or it soaks through a dressing in seconds, {4}or part of the limb is gone. {5}Any of those, and you're thinking tourniquet."),
  dict(key="q1q", vo="[curious] Quick check. {1}Dark red blood, flowing steadily from a deep cut on the shin. No spurting. {2}Which kind of vessel is open?", pause=5),
  dict(key="q1a", vo="A vein. {1}Dark and steady, that's a vein. {2}If it were bright and spurting, you'd be thinking artery."),
 ]),
 dict(id="press", title="Why pressure works", beats=[
  dict(key="p1", vo="So why does pushing on a wound work at all? {1}Picture the torn vessel under the skin. {2}When you press, you squeeze the tissue around it, and the vessel gets pinched flatter. {3}Less blood gets through the hole, and it comes out with less force."),
  dict(key="p2", vo="And that's what buys you time. {1}Your body already knows how to plug a hole. Platelets, tiny cell pieces in your blood that help it clot, stick to the torn edge, {2}and a clot builds across it. {3}But a clot can't hold while blood is blasting through. {4}Pressure slows the flow enough for the clot to form. And most of the time, that's enough."),
  dict(key="p3", vo="There are three ways to do it. {1}Just your gloved hand. {2}Your gloved hand holding a dressing down. {3}Or a pressure dressing, which is a bandage wrapped firm enough that it keeps pressing even after you let go."),
 ]),
 dict(id="steps", title="Direct pressure, step by step", beats=[
  dict(key="s1", vo="Step one. {1}Press hard. Your palm for a big wound, your fingers for a small one, {2}and push toward a bone underneath if there is one, so the vessel gets squeezed against something firm. {3}If it's spurting, don't go looking for gauze. {4}Your gloved hand goes on the wound NOW, and on an arm or a leg, you keep pressing while the tourniquet comes out."),
  dict(key="s2", vo="Step two, hold it. {1}For massive bleeding, you keep that pressure on all the way to the hospital. {2}For a smaller bleed, hold it steady without peeking, until the bleeding stops."),
  dict(key="s3", vo="Step three is the one people get wrong. {1}Don't start by building a big stack of gauze. [sighs] {2}A tall stack just soaks up blood, and it puts cushion between your hand and the wound, so you're actually pressing LESS."),
  dict(key="s4", vo="Step four. {1}Once the bleeding's under control, turn it into a pressure dressing. Wrap the bandage firmly, so the pressure stays on without your hands."),
  dict(key="s5", vo="And step five. {1}Don't peel off a dressing once it's on. {2}The clot is forming in that gauze, and ripping it off tears the clot right back open. {3}If blood soaks through, leave it there and press harder. {4}That just means you need to do more."),
  dict(key="s6", vo="So what's more? {1}On an arm or a leg, if pressure isn't stopping it, that's a tourniquet. {2}And in the spots where a tourniquet can't go, you pack the wound, with plain gauze or hemostatic gauze, gauze that helps the blood clot. {3}[firm] But a life threatening limb bleed doesn't wait for pressure to fail."),
 ]),
 dict(id="nose", title="Nosebleeds", beats=[
  dict(key="n1", vo="There's one bleed where instinct gets it wrong, and you'll see it all the time. The nosebleed. {1}Most people tip the head back. {2}[concerned] Don't. The blood just runs down the throat, {3}it gets swallowed, it irritates the stomach, and now your bleeding patient is vomiting too."),
  dict(key="n2", vo="Do the opposite. {1}Sit them upright and lean them FORWARD. {2}Then pinch the soft, fleshy part of the nose, below the bony bridge. Most nosebleeds start near the front, in that soft part, and bone can't be squeezed. {3}That's really all there is to it. Lean forward, pinch."),
 ]),
 dict(id="tq", title="Tourniquet first", beats=[
  dict(key="t1", vo="Back to the garage. {1}His blood is bright red and spurting, and it's pushing straight through the gauze under her hand. {2}That's a life threatening bleed from a limb, so he gets a tourniquet. {3}Right now."),
  dict(key="t2", vo="Use a commercial windlass tourniquet. It's got three parts. {1}A wide strap that goes around the limb. {2}A rod, called the windlass, that you twist to tighten it. {3}And a clip that locks the rod so it can't unwind."),
  dict(key="t3", vo="Why not a belt, or a shirt and a stick? {1}Those improvised ones fail a lot more often. {2}They're usually too narrow to press hard enough on the artery, so they squeeze the veins shut, but not the artery. [tense] And that can make the bleeding WORSE. {3}We'll get to why in a minute. So only make one if you really have nothing else."),
 ]),
 dict(id="place", title="Where it goes, how tight", beats=[
  dict(key="w1", vo="So, where does it go? {1}Two to three inches above the wound, between the wound and the heart, on healthy skin. {2}Never over a joint. At the elbow or the knee, bone and tendon shield the artery, so the strap can't squeeze it shut. {3}His cut is near the wrist, so it goes on his forearm, a few inches toward the elbow."),
  dict(key="w2", vo="There are three times you do it differently. {1}An amputation, {2}more than one wound on the same limb, {3}or a limb so mangled you can't tell where the blood's coming from. {4}Then you go high and tight, as high up on the limb as you can."),
  dict(key="w3", vo="Now, how tight does it need to be? {1}You twist until the bleeding stops, AND the distal pulse is gone. That's the pulse below the tourniquet, at the wrist or the foot. {2}You need both, and the inside of the arm shows why."),
  dict(key="w4", vo="Blood comes into the arm through an artery, pushed hard by the heart. {1}It goes back out through veins, at low pressure. {2}So a loose strap squeezes the veins shut first. {3}But the artery is still pumping blood in. {4}Blood gets in and can't get out, so the limb fills up, and the wound bleeds harder. {5}Twist further, and the artery closes too. {6}Now nothing gets in. The bleeding stops, and the pulse below is gone."),
  dict(key="w5", vo="[gently] And it's going to hurt. A lot, usually. {1}Tell him that before you start. {2}But don't loosen it just because it hurts."),
  dict(key="q2q", vo="Quick check. {1}A spurting cut on the lower leg, just below the knee. {2}If you measure two to three inches up, you end up right on the knee. So where does the tourniquet go?", pause=6),
  dict(key="q2a", vo="On the thigh, above the knee. {1}Never on the joint itself. {2}If your two to three inches lands on a joint, just go above the joint."),
 ]),
 dict(id="after", title="After it's on", beats=[
  dict(key="f1", vo="Once it's on, write down the time. {1}On the tourniquet itself, {2}and in your report. {3}Then say it out loud at handoff. The longer it's on, the bigger the risk to the limb, so the hospital needs to know."),
  dict(key="f2", vo="Leave it where people can see it. {1}Never cover it with a blanket or a dressing. {2}The next person shouldn't have to hunt for it. {3}And don't loosen it or take it off in the field. Loosen it, and the bleeding starts again."),
  dict(key="f3", vo="If it's as tight as it'll go and he's still bleeding, don't keep cranking. {1}Put a second tourniquet on, right above the first, closer to the heart."),
 ]),
 dict(id="pack", title="Packing a wound", beats=[
  dict(key="k1", vo="Some places, there's just nothing to wrap a tourniquet around. {1}Like the groin, {2}or the armpit. {3}Those are called junctional areas, where a limb meets the body."),
  dict(key="k2", vo="So you pack it. {1}Push gauze INTO the wound, plain or hemostatic, {2}all the way down to where the blood is coming from, {3}and keep feeding it in until the space is packed tight."),
  dict(key="k3", vo="Then press hard on top. {1}With hemostatic gauze, at least three minutes. It speeds up clotting, but only where it's actually touching the bleeding, so it needs to be in there, and it needs that time. {2}With plain gauze, keep pressing until the bleeding's controlled, or you hand off. {3}If you just lay gauze on top, that's a dressing, not packing, and it won't stop a bleed like this."),
  dict(key="k4", vo="There are two places you never pack: the chest and the belly. {1}There's nothing solid to pack against in there. The gauze can end up somewhere you can't control, and you can't press on what's bleeding inside. {2}The neck is different again. A torn vein in the neck can suck in air, {3}so you cover it with an occlusive dressing, one that seals air out, and press on that one side. {4}Never wrap anything around the neck."),
 ]),
 dict(id="recap", title="Recap", beats=[
  dict(key="rc", vo="[exhales] Let's put it all together. {1}If it's small or slow, you press, hold, and wrap. {2}If it soaks through, leave the dressing and do more. {3}If an arm or a leg is bleeding badly enough to kill, tourniquet first, two to three inches above, never on a joint, and tight until the bleeding stops and the pulse below is gone. {4}Groin or armpit, you pack it and press. {5}And a nosebleed, lean forward and pinch."),
 ]),
 dict(id="practice", title="Practice problems", beats=[
  dict(key="x1q", vo="Problem one. {1}You've held pressure on a forearm cut, and blood starts soaking through your gauze. {2}Your partner reaches to peel it off and put on a fresh one. What do you do?", pause=6),
  dict(key="x1a", vo="Stop them. Leave it on. {1}Peeling it off tears the clot that's forming. {2}Press harder, and if it still won't stop, that forearm gets a tourniquet."),
  dict(key="x2q", vo="Problem two. {1}You tightened a tourniquet on a thigh. The bleeding slowed but didn't stop, and the foot still has a pulse. {2}What's wrong?", pause=6),
  dict(key="x2a", vo="It isn't tight enough. {1}The veins are shut, but the artery isn't, so blood keeps coming in. {2}Keep twisting until the bleeding stops and the pulse is gone. {3}And if it won't go any tighter, add a second one above it."),
  dict(key="x3q", vo="Problem three. {1}A stab wound in the groin, and it's pouring. {2}Tourniquet, or pack it?", pause=5),
  dict(key="x3a", vo="Pack it. {1}The groin is junctional, so there's no limb to wrap. {2}Get the gauze in, all the way down to where it's bleeding, pack it tight, and then press hard. {3}[laughs softly] A lot of people grab the tourniquet here, because it's the big tool. But it has nowhere to go."),
 ]),
 dict(id="outro", title="Next: internal bleeding", beats=[
  dict(key="end", vo="[warmly] So that's external bleeding. {1}The notes and practice for this topic are free on «levl prep dot com|levlprep.com». {2}Next video, the bleeding you can't see. Internal bleeding, and how to catch shock before the blood pressure drops. {3}See you there."),
 ]),
]

import re
_CAPS_KEEP = set()
_MARK = re.compile(r"«([^|»]*)\|([^»]*)»")

def clean(vo):
    return re.sub(r"\s+", " ", re.sub(r"\{\d+\}", "", _MARK.sub(r"\1", vo))).strip()

def _shown(src):
    d = _MARK.sub(r"\2", re.sub(r"\[[^\]]+\]\s*", "", re.sub(r"\{\d+\}", "", src)))
    d = re.sub(r"\b[A-Z]{2,}\b", lambda m: m.group(0) if m.group(0) in _CAPS_KEEP else m.group(0).lower(), d)
    return re.sub(r"\s+", " ", d).strip()

for _ch in CHAPTERS:
    for _b in _ch["beats"]:
        _b.setdefault("src", _b["vo"])
        _b["disp"] = _shown(_b["src"])
        _b["vo"] = _MARK.sub(r"\1", _b["src"])

def disp(b):
    return b["disp"]

if __name__ == "__main__":
    tot = 0; tags = 0
    for ch in CHAPTERS:
        n = sum(len(clean(b["vo"])) + 1 for b in ch["beats"])
        tags += sum(len(re.findall(r"\[[^\]]+\]", b["vo"])) for b in ch["beats"])
        tot += n; print(f'{ch["id"]:12s} {n:5d}')
    print("total", tot, "chars;", tags, "emotion cues")
