# audited, not voiced
# Audit log (2026-11-04 long video build):
# WHY AUDIT (independent agent): prefix symbols said, m milli vs meter, kelvin introduced, squared = to the second,
#   parentheses explained, 12.6 g read out, u6 factors spoken, molecule colors named as a drawing choice, where the
#   molecules per gram comes from (s8), promise wording, recap "up to, but not including, ten", s5 "raise the exponent by
#   one", e4 "keep going", e6 hidden step (ten thousand = 10^4), e7 exponent add shown.
# FACT CHECK (independent agent; AP equations sheet, chemEdX Reading summaries, NIST, OpenStax, NASA, USFS, USGS):
#   faucet drip 0.05 mL -> 0.3 mL (USGS assumes 0.33), so 26 L/day and 1.002e22 per drop; readers report wording softened
#   (J vs kJ, units, C to K; g vs kg dropped). RECHECK of changed lines: all OK. Practice answers confirmed.
# HUMAN READ (independent agent): rewrote promise, why, u1, u2, u4, u5, u7, e1, e3, e4, e5, e6, e7, s1 to s5, s7, s8, s9,
#   p1q, rc, end; spoken numbers made easier to follow (p1q, s2, s3, s4, s8).
# CUT for length: adding in scientific notation (s6). PRONUNCIATION: levlprep respelled; E E / E X P spaced.
# RUNTIME: 11,732 chars, 35 beats, 18 s pauses, 5 cards -> about 14:30 (check tl.py DUR after voicing).
"""Script for long video AP Chem 01: units and dimensional analysis, exponents, scientific notation (A&P 02 pilot format,
premium standard). Source: levlprep.com/chem/notes/math-units.html, math-exponents.html, math-scientific-notation.html.
Story (runs through the whole video): late at night the kitchen faucet keeps dripping. Theo (8) asks his big sister
Maya (16, taking AP Chem) how many tiny pieces of water are in one drop. She measures the drop, works out the leak,
sizes the answer with powers of ten, and finally counts the molecules in scientific notation. At the end she tightens
the tap and the dripping stops.
Each chapter: teaching, a story moment (story=True) where the idea happens, then a practice problem.
{n} marks a visual cue. 'pause' = seconds for pause and try beats. «spoken|shown» respellings. energy = delivery note.
"""
ID = "yt-apchem-01-units-sci-notation"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", story=True, energy="curious", vo="{1}It's almost midnight, and the kitchen faucet won't stop dripping. {2}Maya is up late with her AP Chem homework, and her little brother Theo is supposed to be asleep. {3}Instead he's watching the drops. {4}Then he asks her something she can't answer yet. [curious] How many tiny pieces of water are in just ONE drop?"),
  dict(key="promise", energy="warm", vo="Water is made of molecules, one oxygen, drawn here in red, holding two hydrogens. {1}They're way too small to see, so how could anybody count them? Stick around, and you'll give Theo a real number. {2}On the way, you'll convert units without guessing, {3}work with powers of ten, {4}and write huge and tiny numbers in scientific notation."),
  dict(key="why", energy="steady", vo="This sounds like the boring part, but year after year, AP exam readers report the same kinds of slips: {1}leaving off units, mixing up joules and kilojoules, forgetting to change Celsius to kelvin. {2}The chemistry can be perfect, and the answer still comes out wrong."),
 ]),
 dict(id="units", title="Units and dimensional analysis", beats=[
  dict(key="u1", energy="steady", vo="Say your lab partner tells you the sample is twelve point six. {1}Twelve point six what? Grams? Milliliters? Degrees? {2}Without a unit, it tells you nothing. {3}Twelve point six grams, now it means something. So keep the unit on, every line."),
  dict(key="u2", energy="steady", vo="Chemistry uses the metric system, which puts a prefix in front of a unit to change its size. {1}Kilo, written k, means a thousand, so a kilogram is a thousand grams. {2}Milli goes the other way: a thousandth. That's why it takes a thousand milliliters to make one liter. {3}Micro is a millionth, and nano is a BILLIONTH. {4}A small m in front of a unit means milli, but m on its own means meters. The AP equation sheet lists the prefixes, so you just have to use them the right way round."),
  dict(key="u3", energy="curious", vo="So how do you switch units? Think about money for a second. {1}A dollar is a hundred cents, right? So what's a hundred cents divided by one dollar? [curious] It's... ONE. Same amount on top and bottom. {2}A conversion factor is exactly that. A thousand meters over one kilometer is one, because those are the same length. {3}And when you multiply something by one, the amount can't change. Only the number and the unit change, together."),
  dict(key="u4", energy="steady", vo="This is called dimensional analysis, and the whole trick is which way up you put the factor. {1}Units cancel like numbers do: the same unit on the top and on the bottom divides out. {2}So put the unit you HAVE on the bottom, and the unit you want on top. {3}A trail is two point four five kilometers long. Times a thousand meters over one kilometer, the kilometers cancel, {4}and you get two thousand four hundred fifty meters."),
  dict(key="u5", energy="thoughtful", vo="Then check the size. {1}A meter is much smaller than a kilometer, so you should need MORE of them, and you do. {2}If your number had gotten smaller instead, the factor was upside down. That quick check catches most unit mistakes."),
  dict(key="u6", energy="steady", vo="When there's no single factor between two units, chain a few. {1}Say you want four thousand two hundred fifty milligrams in kilograms. {2}Times one gram over a thousand milligrams gives four point two five grams, {3}then times one kilogram over a thousand grams. {4}Each factor cancels what the last one left, and you get point zero zero four two five kilograms."),
  dict(key="u7", energy="curious", vo="And any time you see the word per, that's a conversion factor too. {1}Density is mass per volume, and water's is about one gram per milliliter, {2}so it turns a volume of water into a mass. {3}Temperature is the odd one out, because you add instead of multiply. Kelvin, written K with no degree sign, starts at the coldest temperature possible, and it's Celsius plus two seventy three point one five. [serious] So twenty five degrees Celsius is about two ninety eight kelvin, and forgetting that wrecks a lot of exam answers."),
  dict(key="u8", story=True, energy="warm", vo="{1}Back in the kitchen, Maya starts by measuring. {2}She holds a medicine cup under the faucet and counts drops. {3}A hundred drops fill it to thirty milliliters, so one drop is thirty milliliters over a hundred, point three milliliters. {4}And her phone timer says it drips about once a second."),
  dict(key="u9", story=True, energy="curious", vo="So how much water is that leak wasting in a day? {1}One drop per second, times point three milliliters per drop. {2}Then sixty seconds in a minute... sixty minutes in an hour... and twenty four hours in a day. {3}Everything cancels except milliliters per day, {4}and she gets about twenty six thousand milliliters a day. {5}Twenty six liters, more than a bucket, from one little drip."),
  dict(key="p1q", energy="curious", vo="Your turn. {1}A car is moving at thirty meters per second. How fast is that in kilometers per hour? {2}There are three thousand six hundred seconds in an hour. That's sixty times sixty. And there are a thousand meters in a kilometer.", pause=6),
  dict(key="p1a", energy="warm", vo="Start with thirty meters per second. Times three thousand six hundred seconds per hour, times one kilometer over a thousand meters. {1}Seconds cancel, meters cancel, and you get... one hundred EIGHT kilometers per hour. {2}Did you get a tiny number instead? A lot of people divide by three thousand six hundred. [thoughtful] But think about it. In a whole hour, a car goes way farther than in one second, so the number has to grow."),
 ]),
 dict(id="exponents", title="Powers of ten", beats=[
  dict(key="e1", energy="steady", vo="Chemistry's numbers get ridiculously big and small, so we use exponents. {1}In ten to the fourth, the ten is the base, and that little raised four is the exponent. It tells you how many tens you multiply together. {2}Ten times ten times ten times ten is ten thousand. {3}So ten to a positive power is a one followed by that many zeros."),
  dict(key="e2", energy="curious", vo="Now, what happens when you multiply two of them? {1}Ten squared, which means ten to the second, times ten cubed, ten to the third. Write it out: two tens, then three tens. {2}That's five tens in a row, so it's ten to the fifth. When you multiply, you ADD the exponents. {3}Dividing works the other way. Ten to the fifth over ten squared: two tens on the bottom cancel two on top, {4}so you subtract, and get ten cubed."),
  dict(key="e3", energy="steady", vo="Now take ten squared, and cube the whole thing. That's what the parentheses mean. {1}It's ten squared three times over, which is six tens, so ten to the sixth. A power of a power multiplies. {2}Oh, and these rules only work when the base is the same. Ten squared times two cubed isn't five of anything."),
  dict(key="e4", energy="thoughtful", vo="Now watch what happens if we keep dividing. {1}Ten cubed over ten cubed is ten to the zero, {2}but anything divided by itself is one. So ten to the zero is one. {3}Keep going. Ten squared over ten to the fifth is ten to the negative three, {4}and writing it out leaves three tens on the bottom: one over a thousand. {5}So a negative exponent doesn't make a number negative. It makes it SMALL. Ten to the negative three is point zero zero one."),
  dict(key="e5", energy="serious", vo="There's a trap, though. These rules are for multiplying and dividing, not adding. {1}Ten to the fourth plus ten to the fourth is ten thousand plus ten thousand, {2}which is twenty thousand. That's two times ten to the fourth, not ten to the eighth."),
  dict(key="e6", story=True, energy="curious", vo="{1}Maya already has a rough idea of the answer: around a one followed by twenty two zeros. {2}Theo starts writing zeros and runs out of room. {3}So she shows him the shortcut. A billion is ten to the ninth. {4}A billion billion? That's ten to the ninth times ten to the ninth. Add the exponents, and you get ten to the eighteenth. {5}Then ten thousand of THOSE. Ten thousand is ten to the fourth, so add four, and you're at ten to the twenty second."),
  dict(key="e7", story=True, energy="thoughtful", vo="{1}Then he asks how small one water molecule is. {2}It's roughly three times ten to the negative tenth of a meter across. [softly] Three ten billionths of a meter. {3}Line up ten million of them, ten to the seventh, and the exponents add to ten to the negative third: about three millimeters. Still less than half the width of that drop."),
  dict(key="p2q", energy="curious", vo="Your turn, two quick ones. {1}First, ten to the sixth times ten to the negative ninth, all divided by ten to the negative two. It's on screen. {2}Second, ten cubed plus ten cubed.", pause=6),
  dict(key="p2a", energy="warm", vo="On top, six plus negative nine is negative three, so ten to the negative three. {1}Then divide: negative three minus negative two. Subtracting a negative adds, so that's negative one. {2}Ten to the negative one, which is point one. {3}And ten cubed plus ten cubed is a thousand plus a thousand, two thousand. That's two times ten cubed, [serious] not ten to the sixth."),
 ]),
 dict(id="scinot", title="Scientific notation", beats=[
  dict(key="s1", energy="steady", vo="A glass of water has about eight times ten to the twenty fourth molecules. {1}Write out twenty four zeros, and you WILL miscount them. {2}Scientific notation tucks them into an exponent, in two pieces. {3}First, a number from one up to just under ten. That's the coefficient. {4}Then a power of ten that says how far the decimal point moved."),
  dict(key="s2", energy="steady", vo="To convert a big number, slide the decimal point left until there's just one digit, not a zero, in front of it. {1}The Earth is about a hundred forty nine point six million kilometers from the Sun. {2}Slide the point left eight places, and it's one point four nine six times ten to the eighth. {3}So a big number means you moved left, and the exponent is positive."),
  dict(key="s3", energy="steady", vo="A small number goes the other way. {1}A fine smoke particle is about six hundred fifty billionths of a meter wide, written here as a decimal. {2}Slide the point RIGHT, past the six, which is seven places, {3}and you get six point five zero times ten to the negative seventh. Small number, moved right, negative exponent."),
  dict(key="s4", energy="steady", vo="To multiply, handle the two pieces separately. {1}Take three point zero times ten to the fourth... and multiply it by two point zero times ten to the negative sixth. {2}Multiply the front numbers: three times two is six. {3}Then add the exponents: four plus negative six is negative two. {4}So it's six point zero times ten to the negative two. Dividing? Divide the front numbers and subtract the exponents."),
  dict(key="s5", energy="thoughtful", vo="Sometimes the front number comes out too big, like fifty two times ten to the fifth. {1}Fifty two is five point two times ten, {2}so shrink the front number by ten, and raise the exponent by one: {3}five point two times ten to the sixth. Same number, proper form."),
  dict(key="s7", energy="warm", vo="On a calculator, the E E or E X P key already means times ten to the power of. {1}So for three point two times ten to the negative fifth, type three point two, E E, then negative five with the negative key, not the minus key. {2}[serious] Don't type times ten as well, or your answer comes out ten times too big."),
  dict(key="s8", story=True, energy="curious", vo="{1}Now Maya can finally count. Chemists know what one water molecule weighs, so they know a gram holds about three point three four times ten to the twenty second of them. The moles video shows how. {2}She builds the chain. Point three milliliters per drop... then one gram per milliliter... {3}and then, per gram, three point three four times ten to the twenty second molecules. {4}Milliliters cancel, grams cancel, and she's left with molecules."),
  dict(key="s9", story=True, energy="warm", vo="{1}Point three is three times ten to the negative one. {2}Three times three point three four is ten point zero two, and negative one plus twenty two is twenty one. So that's ten point zero two times ten to the twenty first. {3}But ten is too big for the front, so she fixes it: {4}one point zero zero two times ten to the twenty second. [softly] That's about ten thousand billion billion molecules... in ONE drop."),
  dict(key="p3q", energy="curious", vo="Your turn. {1}Multiply four point zero times ten to the fifth by six point zero times ten to the negative eighth, {2}and give the answer in proper scientific notation.", pause=6),
  dict(key="p3a", energy="warm", vo="Four times six is twenty four, and five plus negative eight is negative three. {1}So it's twenty four times ten to the negative third. {2}But twenty four is too big for the front. Make it two point four, and raise the exponent by one: {3}two point four times ten to the negative second. [thoughtful] A lot of people stop at twenty four times ten to the negative third. The value's right, but it isn't scientific notation."),
 ]),
 dict(id="recap", title="Recap", beats=[
  dict(key="rc", energy="steady", vo="So, a quick recap. {1}Keep the unit on every number, and a conversion factor is just one, with the unit you have on the bottom. {2}Multiplying powers of ten? Add the exponents. Dividing? Subtract. And a negative exponent means small, not negative. {3}Scientific notation is a number from one up to, but not including, ten, times a power of ten."),
 ]),
 dict(id="outro", title="Next: significant figures", beats=[
  dict(key="end", story=True, energy="warm", vo="{1}Theo whispers the number to himself and finally heads to bed. {2}Maya reaches up and turns the faucet handle hard, {3}and the dripping stops. {4}The notes and practice for this topic are free on «levl prep dot com|levlprep.com». {5}Next time: Maya's cup said thirty milliliters. Is that one digit she can trust, or two? [curious] And how many should her answer keep? That's significant figures."),
 ]),
]

import re
_CAPS_KEEP = {'AP'}
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
