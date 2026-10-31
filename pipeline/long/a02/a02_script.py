# Pilot long video in the new format (Olivier 2026-10-30): story woven through teaching chapters, a practice problem
# after each chapter, no end practice set, no host. Built from the audited a02 script (2026-10-29 audit log kept below);
# lines marked NEW in the build log were written for the new structure and get their own audits.
# Audit log (2026-10-29 long video build):
# WHY AUDIT (independent agent): fixed proximal/distal reason (works however the limb is posed; hand "higher in the room"),
#   superior no longer defined as "above", distal no longer used before defined (u1 merged into u2), logy and megaly
#   introduced before use, pnea called a word part, card = cardi, pericarditis tied to the pericardium, gall = bile, renal
#   defined, ous named in P1, hook now says left forearm thumb side, a5 referent fixed, stab wound wording.
# FACT CHECK (independent agent; OpenStax A&P 2e 1.6, MedlinePlus medical words, Etymonline, Merriam-Webster Medical,
#   StatPearls corticospinal tract): 42 claims + 5 Qs. Recheck of revised lines OK.
# HUMAN READ (independent agent): rewrote promise, why, w2, x2, d2, a1, a2, a5, m1, rc, p2a, end.
"""Script for long video A&P 02: Medical word parts and directional terms (pilot of the 2026-10-30 long format).
Source: levlprep.com/anatomy-physiology/notes/word-parts.html and anatomical-position.html (chapter 1, topics 2 and 3).
Story (runs through the whole video): a cyclist goes down on a park path with a deep cut on his left forearm; the
paramedic radios it in, he rides to the ER, the nurse reads his chart, the doctor checks the cut, and he goes home.
Each chapter: teaching, then a short story moment (story=True) that shows the idea happening, then a practice problem.
{n} marks a visual cue. 'pause' = seconds for pause and try beats. «spoken|shown» respellings.
"""
ID = "yt-ap-02-terminology-directional-terms"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", story=True, vo="{1}He went down hard on his bike, and there's a bad cut on his left forearm, on the thumb side. {2}The paramedic radios ahead that it's just above the wrist. {3}But watch what happens when he lifts his arm. {4}Now above the wrist points the other way, toward his fingers. [curious] So which one did she mean?"),
  dict(key="promise", vo="By the time we're done, you'll be able to describe any spot on the body so it means the SAME thing to everyone who hears it. {1}And words like «hep a toe meg a lee|hepatomegaly» {2}will stop looking like a foreign language, because you'll take them apart into pieces you already know."),
  dict(key="why", vo="[warmly] If this part of the course feels like memorizing a dictionary, that's normal. {1}But medical words are built from a small set of parts that keep their meaning wherever they show up. {2}And directions only feel slippery because words like above change when the body moves, {3}so anatomy describes every body from one standard pose that everybody agrees on."),
 ]),
 dict(id="roots", title="Words built from parts", beats=[
  dict(key="w0", story=True, vo="{1}Twenty minutes later he's sitting in the emergency department, {2}and the nurse pulls up his chart. The first thing she sees is a note from an old visit."),
  dict(key="w1", vo="{1}History of «coal ee sis tie tis|cholecystitis». {2}Reported «gas tral ja|gastralgia». {3}Exam showed «hep a toe meg a lee|hepatomegaly». {4}[laughs softly] It looks like a different language, but it's really three short sentences built from a handful of word parts."),
  dict(key="w2", vo="Most terms are built around a ROOT. That's the part with the main meaning, and in this course it's usually a body part. {1}In cardiology the root is «kar dee|cardi», which means heart, and «luh jee|logy» on the end means the study of. {2}In gastritis the root is «gas ter|gastr», which means stomach. {3}And a word can have more than one root, so «gastro enter ology|gastroenterology» has «gas ter|gastr» for stomach and enter for intestine, and it's the study of both."),
  dict(key="w3", vo="Now try saying cardilogy out loud. It's clunky, right? {1}So medical words slip in a linking vowel, usually an O, and you get cardiology. {2}A root plus that vowel is called a combining form, and it's written with a slash, like «kar dee|cardi» slash o. {3}The vowel stays between two roots, like in gastro entero «luh jee|logy», and it stays before an ending that starts with a consonant, like «meg uh lee|megaly» in «hep at|hepat» o «meg uh lee|megaly». {4}But it drops before an ending that starts with a vowel, which is why it's gastritis and not gastro «eye tis|itis»."),
  dict(key="r1q", vo="Your turn. {1}Neur means nerve, and «luh jee|logy» means the study of. {2}Put them together, and then tell me why there's an O in the middle.", pause=5),
  dict(key="r1a", vo="It's neurology. {1}That O is the linking vowel, and it stays because «luh jee|logy» starts with a consonant."),
 ]),
 dict(id="affix", title="Prefixes and suffixes", beats=[
  dict(key="x1", vo="A PREFIX goes in front and changes what the rest of the word means, and it often tells you where, how much, or how fast. {1}Take «nee uh|pnea», the word part for breathing. {2}«Tack ip nee uh|Tachypnea» is fast breathing, {3}«brad ip nee uh|bradypnea» is slow breathing, {4}and «ap nee uh|apnea» is no breathing at all. {5}The breathing part never changed, only the front did."),
  dict(key="x2", vo="[serious] Watch out for the prefixes that look almost the same. {1}Inter means between, so intercostal is between the ribs, {2}but intra means inside, so intravenous is inside a vein. {3}And hyper means more than normal, while hypo means less than normal. {4}They're just a letter or two apart, but they mean very different things."),
  dict(key="x3", vo="The SUFFIX sits at the end, and it tells you what kind of word you're reading. {1}Some endings name a condition, like «eye tis|itis» for inflamed, «al juh|algia» for pain, and «meg uh lee|megaly» for enlarged. {2}And some just mean having to do with, like the ac in cardiac."),
  dict(key="x4", vo="There are two surgical endings that trip almost everyone up, so let's try them both on the kidney, which is «nef er|nephr». {1}Tomy means cutting into, so in a «neh frot uh mee|nephrotomy» the surgeon cuts into the kidney, and it's still there afterward. {2}Ectomy means cutting out, so in a «neh frek tuh mee|nephrectomy» the kidney comes out, and it's gone."),
  dict(key="x5", story=True, vo="{1}Back with our cyclist, the nurse notices a swollen, dark bruise on his elbow from the fall, {2}and on his chart she writes subcutaneous hematoma."),
  dict(key="p1q", vo="So what did she just write? {1}Here's what you need. Sub means under, «cue tane|cutane» means skin, «hee mat|hemat» means blood, and «oh muh|oma» means a mass or a swelling. {2}Put it together and tell me where it is and what it is.", pause=6),
  dict(key="p1a", vo="It's a collection of blood, a hematoma, {1}sitting under the skin, which is what subcutaneous means, {2}so it's basically a bad bruise."),
 ]),
 dict(id="decode", title="Decode any term", beats=[
  dict(key="d1", vo="So how do you actually read one? {1}You start with the suffix, then the prefix, and then the root. {2}Take «pair ee kar die tis|pericarditis». {3}«Eye tis|Itis» means inflamed, so it's a condition. {4}«Pair ee|Peri» means around, {5}and «kard|card» is just «kar dee|cardi» again, heart. {6}So it's inflammation around the heart, and in practice that means the pericardium, the sac that wraps it. Read it left to right and you'd get around heart inflamed, which is backwards English."),
  dict(key="d2", story=True, vo="Let's go back to that old note on his chart. {1}«Koh lee sis tie tis|Cholecystitis» ends in «eye tis|itis», and «koh lee|chole» means gall, or bile, and «sist|cyst» means bladder, so it's an inflamed gallbladder. {2}«Gas tral juh|Gastralgia» is «al juh|algia» on «gas ter|gastr», so that's stomach pain. {3}And «hep a toe meg a lee|hepatomegaly» is «meg uh lee|megaly» on «hep at|hepat», which means liver, so the liver was enlarged. {4}[exhales] See? None of that is gibberish anymore."),
  dict(key="q1q", vo="[curious] Quick check. {1}A patient had a «neh frek tuh mee|nephrectomy» last year. {2}Does that patient still have that whole kidney?", pause=5),
  dict(key="q1a", vo="No. {1}Ectomy means cutting out, so that kidney was removed. {2}If it had been a «neh frot uh mee|nephrotomy», the kidney would still be there, with a cut that healed."),
 ]),
 dict(id="position", title="The anatomical position", beats=[
  dict(key="a1", story=True, vo="Now the directions. {1}Remember the radio call, just above the wrist? {2}The trouble is, everyday direction words depend on how the body happens to be posed, {3}so anatomy describes everything from one standard pose, and it's called the anatomical POSITION."),
  dict(key="a2", vo="Picture someone standing up straight and facing forward, with their head level and their eyes looking straight ahead. {1}Their feet are flat on the floor and parallel, with the toes pointing forward. {2}And their arms hang down at their sides, with the palms turned forward, so the thumbs point away from the body."),
  dict(key="a4", vo="Every directional term describes the body as if it were standing like this, no matter how it's really posed. {1}So a patient lying face up is supine, which you can remember as on your spine, {2}and lying face down is prone, like lying with your nose to the floor. {3}But those words describe how the body is lying, and they don't change what any direction means."),
  dict(key="a5", vo="One more rule, and it catches a lot of people. {1}Right and left always mean the patient's own right and left. {2}So when you face someone, their right hand is on YOUR left. {3}That's why, when a diagram shows a person from the front, their right side is on the left of the page."),
  dict(key="a6q", vo="Your turn. {1}The doctor walks in and stands facing our cyclist. {2}His cut is on his left forearm, so is it on the doctor's left side, or the doctor's right?", pause=5),
  dict(key="a6a", vo="It's on the doctor's right. {1}Left always means the patient's own left, {2}and when you're facing someone, their left is on your right."),
 ]),
 dict(id="updown", title="Up, down, front and back", beats=[
  dict(key="u2", vo="Directional terms always compare one spot to another, and they come in pairs of opposites. {1}Superior means toward the head, and inferior means toward the feet, so your nose is superior to your mouth, {2}and your knees are inferior to your hips."),
  dict(key="u3", vo="Anterior means toward the front, and posterior means toward the back. {1}Your breastbone is anterior to your heart, and your backbone is posterior to it."),
  dict(key="q2q", story=True, vo="Quick check. {1}Our cyclist's lying supine on the stretcher now, so his nose is pointing at the ceiling. {2}Is his nose still anterior to his ears?", pause=5),
  dict(key="q2a", vo="Yes. {1}Supine only tells you how he's lying. {2}You still describe the body as if it were standing in the anatomical position, so the nose stays anterior."),
 ]),
 dict(id="limbs", title="Middle, side, near and far", beats=[
  dict(key="m1", vo="Picture a line running straight down the middle of the body, splitting it into right and left halves. That's the midline. {1}Medial means closer to the midline, {2}and lateral means farther from it, out toward the side. {3}So your nose is medial to your eyes, and your ears are lateral to them."),
  dict(key="m2", vo="And this is where those forward palms pay off. {1}In the anatomical position the thumb points away from the body, so the thumb is LATERAL, {2}and the little finger is medial. {3}[serious] Lots of students get this backwards, because they picture their hands hanging palms in. So on the forearm, the thumb side is the lateral side."),
  dict(key="m3", vo="Proximal means closer to where a limb attaches to the trunk, and distal means farther from it. {1}So your elbow is proximal to your wrist, {2}and your toes are distal to your ankle. {3}On a limb you use these instead of superior and inferior, because they don't care how the limb is posed. {4}Raise your arm overhead, and your hand is higher than your elbow in the room, but it's still distal to it, because proximal and distal follow the limb itself."),
  dict(key="m4", story=True, vo="So let's fix the radio call. {1}A bad cut on the lateral side of the left forearm, just proximal to the wrist. {2}Lateral pins it to the thumb side, left is the patient's own left, {3}and proximal means toward the elbow, whether his arm is down or up. {4}[warmly] Now everyone pictures the same spot."),
  dict(key="p2q", vo="Your turn. {1}Say he's lying on his back and he stretches his arm up over his head. {2}In anatomical terms, is his hand superior to his elbow, or is it distal to it?", pause=6),
  dict(key="p2a", vo="Distal. {1}On a limb you use proximal and distal, because they follow the arm wherever it goes. {2}And the catch is that superior would actually be wrong, because in the anatomical position the hand is below the elbow."),
 ]),
 dict(id="depth", title="Surface, depth and sides", beats=[
  dict(key="s1", vo="Superficial means toward the body's surface, and deep means farther in. {1}Think of the thigh in layers, with skin on the outside, {2}then fat, {3}then muscle, {4}and bone in the middle. {5}Skin is superficial to muscle and bone is deep to it, so a stab wound deep to the muscle has gone through the skin, the fat, and the muscle."),
  dict(key="s1b", story=True, vo="{1}The doctor checks how far down his cut goes. {2}It's through the skin and the fat, but the muscle underneath hasn't been cut, so the wound is superficial to the muscle. It looked bad, but in anatomy terms it never got past the fat."),
  dict(key="s2", vo="The last pair is about sides. {1}«Ip sih lat er al|Ipsilateral» means on the same side, so your right arm and right leg are «ip sih lat er al|ipsilateral», {2}and «contra lat er al|contralateral» means opposite sides, like your right arm and left leg. {3}That really matters in the nervous system, because the main pathways for movement and touch cross the midline. {4}So a stroke on the right side of the brain weakens the left arm and the left leg."),
  dict(key="p3q", vo="Your turn. {1}A patient's left arm and left leg are weak after a stroke. {2}Which side of the brain was damaged?", pause=5),
  dict(key="p3a", vo="The right side. {1}The main movement pathways cross the midline, so the damage is «contra lat er al|contralateral» to the weakness. {2}[exhales] A lot of people answer left, because that's where the weakness is."),
 ]),
 dict(id="recap", title="Recap", beats=[
  dict(key="rc", vo="So let's put it all on one picture. {1}To read a term, you start at the suffix, then the prefix, then the root. {2}For directions, the body is always standing in the anatomical position, palms forward, and right and left are the patient's own. {3}Then the pairs. Superior and inferior run head to feet, and anterior and posterior run front to back. {4}Medial and lateral go from the midline out to the side, and proximal and distal run along a limb. {5}Superficial and deep go from the surface inward, and ipsi and contra mean the same side or the opposite side."),
 ]),
 dict(id="outro", title="Next: planes and cavities", beats=[
  dict(key="end", story=True, vo="{1}As for our cyclist, he gets a few stitches on the lateral side of his left forearm, and then he's walking his bike home. {2}[warmly] So that's how A and P talks about the body. {3}The notes and practice for this topic are free on «levl prep dot com|levlprep.com». {4}In the next video we'll slice the body into planes and sections, and open up the body cavities where the organs sit. {5}See you there."),
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

if __name__ == "__main__":
    tot = 0
    for ch in CHAPTERS:
        n = sum(len(clean(b["vo"])) + 1 for b in ch["beats"])
        tot += n; print(f'{ch["id"]:12s} {n:5d}')
    print("total", tot, "chars")
