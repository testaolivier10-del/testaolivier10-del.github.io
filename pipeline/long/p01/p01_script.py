# audited, not voiced
# Audit log (2026-11-06 long video build; voicing waits for the ElevenLabs reset, 9,065 credits left at 9:32am PT):
# WHY AUDIT (independent agent): zeros between digits rule, p2a size check logic, 30.01 vs 30 honesty (photo finish),
#   early rounding framed as too few digits too early, p1a answers without sig fig claims (0.25 kg, 0.04 s), meterstick
#   estimate (cm marks, last digit estimated), powers of ten glossed in u5, m vs ms, AP equation sheet named, decimal
#   sliding shown in g1, why add/subtract uses decimal places, running start reason, SI constants reason (g = 9.8),
#   g4 now shows the fewest rule (200.0/24.8), p3q uses 0.00720 (not a worked example).
# FACT CHECK (independent agent; BIPM, NIST prefixes, College Board AP Physics 1 equation sheet, Brower timing, gps.gov,
#   motorcycle curb weights): motorcycle wording softened ("about as much as"), gate display resolution, SI wording.
#   RECHECK of changed lines (independent agent, sheet fetched 2026-11-06): all correct; g8 overclaim softened.
# HUMAN READ (independent agent): rewrote hook (the deal), promise, why, u2, u4, u5, u6, c4, c7, c8, g1, g2, g3, g6, g8,
#   rc, end (photo text, not writing on a hand); zeros spoken as "oh" throughout; long digit chains cut.
# PRONUNCIATION: levlprep respelled; k-g and m-s spelled; mu said as "the Greek letter mu".
# RUNTIME: about 11,200 chars, 33 beats, 18 s pauses, 5 cards -> about 12:45 (check tl.py DUR after voicing).
"""Script for long video AP Physics 1 01: SI units, metric prefixes, unit conversion, scientific notation and
significant figures (A&P 02 pilot format, premium standard, 2026-11-05 rules). Source: levlprep.com/physics/notes/math-units.html.
Story (runs through the whole video): after practice at the school track, Leo (16, a sprinter) swears his running app
says he hit thirty kilometers per hour. Ana (16, taking AP Physics 1) doubts it and tests him for real: she measures
100.0 m along the straight with a measuring wheel and sets two laser timing gates. His first run, 12.43 s, comes out
just under thirty. On his second run, 11.98 s, the answer depends on rounding at the end, not early: 30.05 km/h.
Staging: the track runs left to right; Leo always runs toward the right; Ana stands at the finish gate on the right,
facing left toward him, so nobody turns on screen.
Each chapter: teaching, a story moment (story=True) where the idea happens, then a practice problem.
{n} marks a visual cue. 'pause' = seconds for pause and try beats. «spoken|shown» respellings. energy = delivery note.
"""
ID = "yt-phys-01-units-sig-figs"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", story=True, energy="curious", vo="{1}It's the end of practice, and the school track is almost empty. {2}Leo holds up his phone. His running app says he just hit thirty kilometers per hour. {3}Ana doesn't buy it. Phones guess. {4}[curious] So, deal: one run, a measuring wheel, and a timer that can't be fooled. If he's really that fast, she'll admit it."),
  dict(key="promise", energy="warm", vo="By the end of this video, you'll check Leo's claim yourself. {1}Along the way: the units physics runs on, {2}how to convert between them without guessing, {3}and how many digits your answer really gets."),
  dict(key="why", energy="steady", vo="This matters more than it looks. {1}You can pick the right equation, set it up perfectly, {2}and still be off by a factor of a hundred, just because one value was in centimeters. {3}And the math won't warn you. You have to catch it yourself, and that's what we'll practice."),
 ]),
 dict(id="si", title="SI units and prefixes", beats=[
  dict(key="u1", energy="steady", vo="Every quantity in physics has two parts: a number and a unit. {1}If someone says the cart moved three, three what? Inches? Miles? {2}Three meters is a measurement. Three on its own is just a number."),
  dict(key="u2", energy="steady", vo="Scientists agreed on one shared set of units, called SI units. SI is short for the French name, the International System. {1}You need three of them. Meters for length, that's a small m. {2}Kilograms for mass, k-g. {3}And seconds for time, just s."),
  dict(key="u3", energy="thoughtful", vo="Notice something odd about that list? {1}The kilogram already has a prefix in it, kilo, and it's STILL the base unit. {2}So a gram is not the SI unit for mass. If a problem gives you grams, change them to kilograms first."),
  dict(key="u4", energy="steady", vo="Every other unit is built out of those three. {1}Speed is a length divided by a time, so its unit is meters per second. {2}Here's the payoff. The equations you'll use, and constants like the nine point eight for gravity on the equation sheet, are all in SI units. {3}Put in meters, kilograms and seconds, and the answer comes out in SI units too. Mix in centimeters or grams, and the answer comes out wrong, often by a power of ten."),
  dict(key="u5", energy="steady", vo="A metric prefix in front of a unit multiplies it by a power of ten. You need four. {1}Kilo, small k: a thousand, ten to the third. A kilometer is a thousand meters. {2}Centi? One hundredth, ten to the negative two. So a centimeter is point oh one meters. {3}Milli goes smaller, a thousandth, so a millisecond is point oh oh one seconds. Now watch the letter m. m-s is milliseconds. m alone is meters. Same letter, different job. {4}And micro, written with the Greek letter mu, is ten to the negative six: a MILLIONTH. The AP equation sheet you get on the exam lists the rest."),
  dict(key="u6", story=True, energy="warm", vo="{1}Ana starts with the distance. The track lines are probably right, but probably isn't good enough for Ana. {2}She rolls a measuring wheel down the straight, and it clicks off one hundred point oh meters. {3}Then she borrows the coach's laser timing gates, one at the start and one at the finish. {4}The clock starts when Leo breaks the first beam and stops when he breaks the second. No thumbs on buttons."),
  dict(key="p1q", energy="curious", vo="Your turn. {1}A cart has a mass of two hundred fifty grams, and a timer reads forty milliseconds. {2}Write both in SI units, ready to go into an equation.", pause=6),
  dict(key="p1a", energy="warm", vo="Mass goes in kilograms. Two hundred fifty grams is point two five kilograms. {1}And forty milliseconds is point oh four seconds. {2}The trap is leaving the mass as two hundred fifty. [thoughtful] It looks like a nice number, but an equation would read it as two hundred fifty KILOGRAMS. That's about as much as a motorcycle."),
 ]),
 dict(id="convert", title="Converting units", beats=[
  dict(key="c1", energy="curious", vo="So how do you switch from one unit to another without guessing? {1}You multiply by a fraction that equals one. {2}One meter over a hundred centimeters is one, because the top and the bottom are the same length. {3}Multiplying by one can't change how big something is. It only changes how it's written."),
  dict(key="c2", energy="steady", vo="The whole trick is which way up you put that fraction. {1}Put the unit you want on top, and the unit you want to get rid of on the bottom. {2}A pencil is eighteen centimeters long. Times one meter over a hundred centimeters. {3}Centimeters on top cancel centimeters on the bottom, just like numbers, {4}and you're left with point one eight meters."),
  dict(key="c3", energy="thoughtful", vo="Then check that it makes sense. {1}A meter is bigger than a centimeter, so you need FEWER of them, and the number got smaller. {2}If it had gotten bigger, your fraction was upside down. That one check catches most conversion mistakes."),
  dict(key="c4", energy="steady", vo="Speeds take two fractions, one for each unit. {1}Say a car drives at seventy two kilometers per hour. {2}Times a thousand meters over one kilometer, and the kilometers are gone. {3}Now the hours. Times one hour over three thousand six hundred seconds. {4}That leaves seventy two thousand meters over three thousand six hundred seconds, which is twenty meters per second."),
  dict(key="c5", energy="curious", vo="Look at what those two fractions do together: a thousand over three thousand six hundred. {1}That's the same as dividing by three point six. {2}So kilometers per hour to meters per second, divide by three point six. {3}Going back, multiply. And if you ever forget which way the shortcut goes... just write the fractions out again."),
  dict(key="c6", energy="serious", vo="One trap catches a LOT of people: areas. {1}Picture a square one meter on each side. {2}Each side is a hundred centimeters, so the area is a hundred times a hundred, {3}ten thousand square centimeters, not a hundred. {4}For an area, you use the conversion fraction twice, once for each length."),
  dict(key="c7", story=True, energy="curious", vo="{1}Leo backs way up for a running start, so the gates catch him at top speed, not while he's still speeding up. He takes off. {2}He breaks the first beam already flying... {3}and then the second one. The display shows thousandths of a second: twelve point four three one seconds. {4}Speed is distance over time, so Ana divides one hundred point oh meters by twelve point four three one seconds. {5}About eight point oh four four meters per second. That's his average between the gates."),
  dict(key="c8", story=True, energy="thoughtful", vo="{1}But the app said kilometers per hour, so she converts. Times three point six. {2}That's about twenty eight point nine six kilometers per hour. {3}Close, but not thirty. Leo is not happy. He wants another run. {4}And Ana notices her calculator showed a LOT more digits than she wrote down."),
  dict(key="p2q", energy="curious", vo="Your turn. {1}A car on the highway is going ninety kilometers per hour. What's that in meters per second?", pause=6),
  dict(key="p2a", energy="warm", vo="Ninety kilometers per hour, times a thousand meters over one kilometer, times one hour over three thousand six hundred seconds. {1}That's twenty five meters per second. Or just ninety divided by three point six. {2}If you got three hundred twenty four, you multiplied by three point six. [thoughtful] Check the size: times a thousand makes it bigger, divided by three thousand six hundred makes it smaller, and the three thousand six hundred wins. So the answer has to be smaller than ninety."),
 ]),
 dict(id="sigfigs", title="Scientific notation and significant figures", beats=[
  dict(key="g1", energy="steady", vo="First, a quick tool for writing very big and very small numbers: scientific notation. {1}It's a number from one up to just under ten, times a power of ten, so everyone writes the same number the same way. {2}Take a camera shutter open for point oh oh four oh seconds. Slide the decimal point right, one, two, three, until the four is out front. Three slides right, so it's four point oh times ten to the negative three. {3}A run that lasts seven thousand two hundred seconds slides three places left: seven point two times ten to the third. {4}Small number, negative power. That means SMALL, not negative. And on your calculator, E just means times ten to the."),
  dict(key="g2", energy="curious", vo="Now, how many digits should an answer have? {1}A measurement is only known so well. {2}Read a meterstick with centimeter marks, and you can see it's past forty five centimeters. Then you estimate between the marks: point four five two meters. That last two is your best guess. {3}Your calculator might say point four five two three seven... and on and on, but nobody measured those extra digits. {4}Significant figures are the digits you actually measured. That includes your last best guess."),
  dict(key="g3", energy="steady", vo="Here's how you count them. {1}Nonzero digits always count, and so do zeros sandwiched between them. Eight point oh six one has four. {2}Quick test. Point oh four five oh. How many? ... Three. The zeros in front are just holding the decimal point. {3}But that zero at the end? It counts, because there's a decimal point. Same with fifteen point oh: three. {4}Without a decimal point, like seven thousand two hundred, the end zeros are unclear. So if you mean two significant figures, write seven point two times ten to the third."),
  dict(key="g4", energy="steady", vo="When you multiply or divide, the answer keeps as many significant figures as the value with the FEWEST, because your answer is only as good as your sloppiest measurement. {1}Two hundred point oh meters over twenty four point eight seconds. The distance has four significant figures, but the time has only three. {2}So the answer gets three: eight point oh six meters per second."),
  dict(key="g5", energy="steady", vo="Adding and subtracting work differently. There, you look at decimal places. {1}Eight point seven meters plus two point four three meters. The calculator says eleven point one three. {2}But nobody knows the hundredths place of eight point seven, so the sum can't know its hundredths either. {3}The answer stops at the tenths place: eleven point one meters."),
  dict(key="g6", energy="thoughtful", vo="Two last rules. {1}Conversion factors like a thousand meters per kilometer, or three point six, come from definitions, so they're exact. They never limit your digits. {2}And round ONCE, at the very end. Keep the extra digits in your calculator between steps, because rounding early can change the answer."),
  dict(key="g7", story=True, energy="curious", vo="{1}Back on the track, Ana counts. One hundred point oh meters has four significant figures, and twelve point four three one seconds has five. {2}The fewest wins, so Leo's first run was eight point oh four four meters per second, four figures. {3}And Leo is already back at the start. {4}Second run. He breaks the beams... and this time the timer says eleven point nine nine eight seconds."),
  dict(key="g8", story=True, energy="serious", vo="{1}Now watch what early rounding would do. Say Ana gets impatient and rounds the speed to three digits, too early: eight point three three. {2}Times three point six gives twenty nine point nine nine. Just under. {3}Now do it right. Keep every digit on the calculator, {4}and round once, at the very end: thirty point oh one kilometers per hour. [warmly] By the numbers, he just made it. That last digit is a coin flip, so call it a photo finish... but you'd never even see it if you rounded early."),
  dict(key="p3q", energy="curious", vo="Your turn, two quick ones. {1}First, how many significant figures are in point oh oh seven two oh meters? {2}Second, add twelve point oh meters and three point two seven meters, and report it properly.", pause=6),
  dict(key="p3a", energy="warm", vo="The first one has three: the seven, the two, and the zero at the end. The zeros in front don't count. {1}For the sum, the calculator gives fifteen point two seven. {2}Twelve point oh only goes to the tenths place, so round there: fifteen point three meters. {3}[thoughtful] The trap is counting significant figures here, the way you would when multiplying. For adding, it's decimal places."),
 ]),
 dict(id="recap", title="Recap", beats=[
  dict(key="rc", energy="steady", vo="So, four checks for every calculation. {1}One: convert every value to meters, kilograms and seconds before it goes into an equation. {2}Two: carry the units through each step, and make sure they cancel to the unit you expect. {3}Three: does the size make sense? Nobody walks at thirty meters per second. {4}Four: round once, at the end, to the significant figures your data support."),
 ]),
 dict(id="outro", title="Next: scalars and vectors", beats=[
  dict(key="end", story=True, energy="warm", vo="{1}Leo wants proof for the team group chat. {2}Ana snaps a photo of the timer screen and sends it with one line: thirty point oh one. {3}The notes and practice for this topic are free on «levl prep dot com|levlprep.com». {4}Next time: Leo ran a hundred meters. But was that a distance or a displacement? [curious] In physics, those aren't the same thing. That's scalars and vectors."),
 ]),
]

import re
_CAPS_KEEP = {'AP', 'SI'}
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
    tot = 0; pz = 0; nb = 0
    for ch in CHAPTERS:
        n = sum(len(re.sub(r"\[[^\]]+\]\s*", "", clean(b["vo"]))) + 1 for b in ch["beats"])
        pz += sum(b.get("pause", 0) for b in ch["beats"]); nb += len(ch["beats"])
        tot += n; print(f'{ch["id"]:12s} {n:5d}')
    print("total", tot, "chars", nb, "beats", pz, "s pauses")
