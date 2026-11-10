# audited, voiced (eleven_v4, 2026-11-10; delivery lines in intro, func, graphs, lines, expo, outro rewritten after the flatness check, twice, meaning unchanged)
# Audit log (2026-11-10 long video build):
# WHY AUDIT (independent agent): why two hours gives root 2 (e8 now derives r*r = 2), "last night" vs tonight (g4),
#   negative time hypothetical cut (e5), shift example now on clock time (l6, stand example cut), domain "two things"
#   (logarithms later), zero exponent reason, practice 3 input changed to 2, linear guess 6 cm said aloud, recap adds piecewise.
# FACT CHECK (independent agent; College Board CED and 2024 scoring guidelines, King Arthur Baking, The Perfect Loaf):
#   all math confirmed; story: steady doubling now called his rough rule with a caveat; loaves "by morning" instead of dawn;
#   5.7 from 4 x 1.414; x^(1/2) for x at least 0. RECHECK of changed lines: all confirmed; e8 jar reading softened.
# HUMAN READ (independent agent): spoken math made unambiguous (fractions with a root said as top and bottom, "the whole
#   thing", "times the quantity", "x to the power three minus five"), textbook lines rewritten, cuts of about 700 chars.
# PRONUNCIATION: levlprep respelled; all math spoken in words.
# RUNTIME: about 12,500 chars, 38 beats, 24 s pauses, 6 cards -> about 14:00 (check tl.py after voicing).
"""Script for long video AP Calculus AB 01: functions, domain and range, reading graphs, piecewise functions, lines and
slope, composite functions, moving graphs, rational functions and asymptotes, and exponent rules (negative and
fractional exponents, the slips that cost points). Sources: levlprep.com/calculus/notes/math-functions.html and
math-exponent-rules.html. Pilot format, premium standard, 2026-11-05 rules, people standard of 2026-11-09.
Story (runs through the whole video): Marco, a baker, works alone at night in his small bakery. His sourdough starter
has to be doubled before he mixes the morning's dough. He fed it at 9 p.m.; it stood 4 cm high in the jar, and his
rubber band marks 8 cm. His rough rule: it doubles about every four hours. At 11 p.m. the question is how tall
it should be by now. Answer at the end of chapter 4: 4 times the square root of 2, about 5.7 cm. At 1 a.m. it reaches
the band and he mixes; by morning the loaves come out and the sign turns to OPEN.
Staging (nobody turns on screen): a side view of the bakery; Marco always stands behind the workbench facing right
toward the jar, which sits on the bench at the right; the window and wall clock are on the left wall behind him.
Each chapter: teaching, a story moment (story=True) where the idea happens, then a practice problem.
{n} marks a visual cue. 'pause' = seconds for pause and try beats. «spoken|shown» respellings. energy = delivery note.
"""
ID = "yt-calc-01-functions-exponents"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", story=True, energy="curious", vo="{1}It's eleven at night. Marco is alone in the bakery. {2}And on the bench? A jar of sourdough starter. He fed it at nine... when it stood just four centimeters tall. {3}His rubber band marks eight, double that. When it reaches the band, the morning's dough can be mixed. {4}[curious] His notes say this starter doubles about every four hours. It's been two. So how tall should it be right now? Halfway to the band? Not quite."),
  dict(key="promise", energy="warm", vo="By the end, you'll work out that height yourself. {1}On the way: what a function really is, {2}how to read one from a graph, {3}and the exponent rules calculus leans on all year."),
  dict(key="why", energy="steady", vo="Why start here? {1}Every calculus question hands you a function, as a formula, a graph, a table, or a sentence. {2}And plenty of exam points vanish before any calculus starts: a missing parenthesis, or a negative exponent moved the wrong way. {3}So we fix those now."),
 ]),
 dict(id="func", title="What a function is", beats=[
  dict(key="f1", energy="steady", vo="A function is a rule that takes an input and gives back exactly ONE output. {1}We write f of x for the output when the input is x. {2}So f of x equals x squared minus three x means: square the input, then subtract three times the input. {3}The x is just a placeholder, an empty slot waiting for a number."),
  dict(key="f2", energy="steady", vo="To evaluate, put the input into every slot, and put it in parentheses. {1}f of negative two is negative two, in parentheses, squared, minus three times negative two. {2}That's four plus six, so ten. {3}Without the parentheses, the square grabs only the two, and you get negative four. [serious] One missing pair of parentheses, and the answer is wrong."),
  dict(key="f3", energy="curious", vo="The input can be a whole expression, too. {1}What's f of a plus one? Every x becomes a plus one, in parentheses. {2}Expand and collect, and you get a squared minus a minus two. {3}Notice that's not f of a, plus one. The function acts on the whole input at once."),
  dict(key="f4", energy="steady", vo="Some inputs, a rule can't take. Which ones? The domain is the set of inputs it accepts, and the range is the set of outputs it actually makes. {1}For now, two things shrink a domain. Logarithms will add a third later. {2}A denominator can never be zero. {3}And a square root needs zero or more."),
  dict(key="f5", energy="thoughtful", vo="Try h of x equals a fraction. On top, the square root of x plus four. On the bottom, x minus one. {1}The root needs x plus four to be at least zero, so x is at least negative four. {2}The bottom can't be zero, so x can't be one. {3}Domain: x at least negative four, and x not equal to one. Negative four itself is fine: the square root of zero is zero."),
  dict(key="f6", story=True, energy="warm", vo="{1}Marco's jar is a function too. Call it s, for starter. The input is the time since he fed it, in hours. The output is the height. {2}At any one moment, the jar has exactly ONE height. {3}And the domain? It starts at zero, the feeding. Before nine, this batch didn't exist yet, so the situation itself limits the domain. {4}So s of zero is four, and s of two is what he's waiting to find."),
  dict(key="p1q", energy="curious", vo="Your turn, two quick ones. {1}Let g of x equal x squared plus two x. Find g of negative three. {2}Then, the domain of this fraction. On top, the square root of x minus two... and on the bottom, x minus five.", pause=6),
  dict(key="p1a", energy="warm", vo="[warmly] Let's check the first one. Negative three, in parentheses, squared, gives you nine. Then two times negative three? That's minus six. So g of negative three is THREE. {1}The trap is squaring without the parentheses. That gives negative nine minus six, negative fifteen. {2}For the domain: the root needs x minus two at least zero, so x is at least two. The bottom needs x not equal to five. {3}So x at least two, and x not five."),
 ]),
 dict(id="graphs", title="Reading graphs and piecewise functions", beats=[
  dict(key="g1", energy="steady", vo="The graph of f is every point x comma f of x. {1}So f of a is a HEIGHT. Go to a on the horizontal axis, {2}then go up or down to the graph, and read how high it is there."),
  dict(key="g2", energy="steady", vo="Graphs in calculus often come in pieces, so watch the dots. {1}A filled dot is a point ON the graph. {2}An open circle marks a point the graph comes close to, but doesn't include. {3}Here, at x equals one, the open circle at height three point five is not on the graph. The filled dot at height five is. So f of one is five."),
  dict(key="g3", energy="steady", vo="A few more things a graph tells you. {1}To solve f of x equals k, draw the flat line y equals k, and read the x values where it meets the graph. {2}f is positive where the graph is above the x axis. {3}And the range runs from the lowest height to the highest."),
  dict(key="g4", story=True, energy="warm", vo="{1}Marco keeps a chart of his starter taped to the wall, against the clock. Here's tonight. {2}Before the feeding, the old starter had risen to nine centimeters. {3}At nine, he poured most of it out and topped it up with fresh flour and water. The height dropped to four in an instant. {4}On the chart, that's an open circle at the old height, and a filled dot at the new one: at nine o'clock, the jar is at four."),
  dict(key="g5", energy="steady", vo="A rule that switches formulas like that is a piecewise function. {1}Here's one: x squared when x is less than two, and three x minus one when x is two or more. {2}So how do you use it? First, ask which piece the input belongs to. THEN use only that formula. {3}And the boundary point? It belongs to the piece that says or equal to. So f of two uses three x minus one. That's five. {4}And f of one point nine? That one uses x squared: three point six one. Boundaries like this are where calculus gets interesting... so go slowly there."),
  dict(key="p2q", energy="curious", vo="Your turn! {1}Here's f of x: x plus one when x is under three, and two x when x is three or more. {2}What's f of three... and what's f of two point nine? {3}And the tricky one: is the point three comma four on the graph?", pause=6),
  dict(key="p2a", energy="warm", vo="Three goes with the or equal to sign, so f of three is two times three, six. {1}Two point nine is less than three, so it uses x plus one: three point nine. {2}And three comma four? That's where the first piece is heading, but it stops just short. It's an open circle, so no, it's not on the graph. [thoughtful] The trap is plugging three into x plus one, just because it's the formula written first."),
 ]),
 dict(id="lines", title="Lines, composites and moving graphs", beats=[
  dict(key="l1", energy="steady", vo="You'll draw a lot of lines in calculus. {1}The slope of a line, m, is rise over run: y two minus y one, over x two minus x one. The little ones and twos just label two points. Subtract in the same order, top and bottom. {2}Through one comma four and three comma negative two, that's negative six over two. A slope of negative three, so the line goes down to the right."),
  dict(key="l2", energy="steady", vo="Calculus writes lines in point slope form. {1}y minus y one equals m, times the quantity x minus x one. {2}Here, y minus four equals negative three, times the quantity x minus one. {3}Why this form? Calculus usually knows one point and the slope there. And the exam accepts it as is."),
  dict(key="l3", energy="steady", vo="A composite function feeds one function's output into another. {1}f of g of x means: do g first, then do f to the result. Work from the inside out. {2}With f of x equals x squared and g of x equals three x minus one, f of g of x is three x minus one, all squared. {3}But g of f of x is three x squared, minus one. [serious] Not the same at all. Order matters."),
  dict(key="l5", energy="steady", vo="Now, moving graphs. {1}f of x, plus k, adds k to every height, so the graph moves up k. {2}Negative f of x turns every height upside down, so it flips over the x axis. {3}And f of x minus h moves it RIGHT h. [curious] That one feels backward, doesn't it? Marco's chart shows why."),
  dict(key="l6", story=True, energy="warm", vo="{1}Say he had fed the starter at eleven instead of nine, two hours later on the clock. {2}It grows the same way, so it reaches every height two hours later. The whole curve on his chart slides right by two. {3}To read the new jar at clock time t, read the old curve two hours earlier, at t minus two. A minus sign, and a move to the right."),
  dict(key="l7", energy="thoughtful", vo="One more kind of function. {1}Firing up the oven costs Marco forty dollars. Then each loaf adds two dollars of flour. So for n loaves, what does one loaf cost? Two n plus forty, over n. One polynomial over another... that's a rational function. {2}Now bake more and more loaves. The forty gets spread thinner and thinner, and the cost closes in on TWO dollars. That flat line is a horizontal asymptote. {3}At n equals zero, the bottom is zero but the top isn't: a vertical asymptote. {4}And when top and bottom are BOTH zero... something more interesting happens. That's what Unit 1 is all about."),
  dict(key="p3q", energy="curious", vo="[curious] Okay, your turn. {1}Let f of x equal x squared, and g of x equal x minus four. Find f of g of two, and g of f of two. {2}Then: how does the graph of x plus three, all squared, sit compared with x squared?", pause=6),
  dict(key="p3a", energy="warm", vo="Inside first. g of two is negative two, and f of negative two is four. {1}Now the other way around. f of two is four, and g of four... is zero. Four versus zero! Order matters. {2}And x plus three is x minus negative three, so the graph moves LEFT three. {3}[thoughtful] The trap is reading the plus sign as a move to the right."),
 ]),
 dict(id="expo", title="Exponent rules", beats=[
  dict(key="e1", energy="steady", vo="Calculus has one short rule for every power of x, but it only sees powers. {1}So first, you rewrite fractions and roots as exponents. {2}An exponent counts repeated multiplication: x cubed is x times x times x."),
  dict(key="e2", story=True, energy="warm", vo="{1}Marco's starter shows exactly that. His rough rule: every four hours, it doubles. {2}After one stretch, twice as tall. And after three stretches? two times two times two: two cubed, eight times as tall. The exponent counts the doublings. {3}Real starters start slowly and level off near their peak, but steady doubling is a good first model."),
  dict(key="e3", energy="steady", vo="Every rule comes from counting factors. {1}x cubed times x squared. How many factors? Three, then two more. Five. So you add the exponents. {2}x to the fifth over x squared: two factors cancel, three are left. So you subtract. {3}x cubed, all squared, is two groups of three. Six factors, so you multiply. {4}And x cubed over x cubed is one, but the subtraction rule says x to the zero. So any nonzero number to the zero is one."),
  dict(key="e4", energy="thoughtful", vo="Now, why should x to the negative two mean one over x squared? {1}Take x cubed over x to the fifth. Canceling leaves one over x squared. {2}The subtraction rule says x to the power three minus five. That's x to the negative two. Both are right, so they're the same thing. {3}And a negative exponent never makes a number negative. Two to the negative three is one eighth, a small positive number."),
  dict(key="e6", energy="steady", vo="The most expensive mistake here? Moving too much. An exponent applies only to the base it touches. {1}Three times x to the negative two is three over x squared. Only the x goes down. {2}But three x, in parentheses, to the negative two is one over nine x squared. {3}So five over x cubed, minus one over two x, becomes five x to the negative three, minus one half x to the negative one. The two is just a number, so it stays as one half."),
  dict(key="e7", energy="thoughtful", vo="Now fractional exponents. What should x to the one half be? {1}Square it, and you double the exponent. One half times two is one, so you get plain x. {2}So x to the one half is the number whose square is x: the square root of x, for x at least zero. {3}In a fraction exponent, the bottom is a root, and the top is a power. Root first keeps the numbers small. {4}Eight to the two thirds: the cube root of eight is two, and two squared is four."),
  dict(key="e8", story=True, energy="warm", vo="{1}And now Marco's question. Two hours is half of one doubling. Say two hours multiplies the height by some number r. Then four hours multiplies it by r times r, and that has to be two. {2}So r is the square root of two, two to the one half. About one point four one four. {3}Halfway would be six centimeters. But four times one point four one four... is about five point seven. {4}[softly] He checks the jar. Just under six! Close to what his rule predicts. Halfway in TIME... is not halfway in height."),
  dict(key="e9", energy="serious", vo="So where do people trip? Right here. Exponent rules work on products, but they do NOT work across a plus sign. {1}x plus y, squared, is not x squared plus y squared. Don't believe it? Test it: one plus two, squared, is nine, not five. {2}The square root of the whole thing, x squared plus nine, is not x plus three. Try x equals four: the square root of twenty five is five, not seven. {3}Testing with a number takes ten seconds, and it catches most of these slips."),
  dict(key="p4q", energy="curious", vo="Your turn. {1}Write six over x squared, plus the square root of x, as a sum of powers of x. {2}Then evaluate twenty seven to the two thirds.", pause=6),
  dict(key="p4a", energy="warm", vo="Six over x squared is six x to the negative two. The six stays on top. {1}The square root of x is x to the one half. {2}For twenty seven to the two thirds, take the root first: the cube root of twenty seven is three, and three squared is nine. {3}[thoughtful] The traps: putting the six under the power too, which means one over thirty six x squared. Or multiplying twenty seven by two thirds to get eighteen."),
 ]),
 dict(id="recap", title="Recap", beats=[
  dict(key="rc", energy="steady", vo="Let's put it all together. {1}A function gives one output per input. Parentheses around every input, and watch the domain. {2}On a graph, f of a is a height. Filled dots count, open circles don't, and piecewise rules switch at the boundary. {3}Composites work inside out, and f of x minus h moves right. {4}And exponents? Negative means one over. A fraction means a root. And nothing crosses a plus sign."),
 ]),
 dict(id="outro", title="Next: change at an instant", beats=[
  dict(key="end", story=True, energy="warm", vo="{1}One in the morning. The starter touches the rubber band: eight centimeters, right on time! So Marco mixes the dough. {2}By morning, the loaves are out of the oven, and the sign on the door turns to open. {3}You'll find the notes and practice for this topic, free, on «levl prep dot com|levlprep.com». {4}And next time? The starter was growing at every single instant. [curious] But how fast was it growing at exactly eleven o'clock? That's the question limits were made to answer."),
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
