# audited, not voiced
# Audit log (2026-10-12/13, long video build run):
# WHY AUDIT (independent agent): 5 missing reasons, 6 terms used before explained, 3 on-screen items not spoken, 4 inconsistencies, 4 jumps. All fixed
#   (EMS/NREMT/CPR/run reports/offline vs online direction explained, brain damage within minutes, 1980s block grants, money after standards,
#   firm surface, crew radios ahead, Frank's destination, recap Phase I wording, "starts with the caller" everywhere, Korea/Vietnam model, bridges).
#   Spec notes from it: name the 1966 report on screen as spoken; label the ward "a bed upstairs"; build the intro chain as the four links are spoken.
# FACT CHECK (independent agent, NHTSA/FCC/NENA/NREMT/AHA sources): 39 claims + 5 practice answers; answers matched. Softened 1, 3, 5, 6 (history),
#   23 (911 coverage), 25 (80% wireless "in many areas"), 30 (VoIP), 35 (major trauma centers); re-check of all revisions: OK after 2 more
#   wording fixes (firm surface "works best", cardiac center only if pulse returns). No unconfirmed claim kept.
# Site note for Olivier: study-notes ch1-911 says Phase 1 gives only the caller's number; FCC Phase I also gives the cell tower location.
"""Script for long video NREMT 01: Intro to EMS (history, today's system and the 911 call).
Source: levlprep.com/nremt/study-notes.html, chapter 1 sections ch1-history, ch1-ems-today, ch1-911.
Story frame (quality v2): one patient, Frank, followed through the whole system from the dinner table to the hospital.
Each chapter is voiced as one ElevenLabs request (under about 2,800 characters).
{n} marks a visual cue. 'pause' = seconds for pause-and-try beats.
'disp' (caption text) is built automatically at the bottom: spaced letters joined, caps emphasis lowered, tags removed.
"""
ID = "yt-nremt-01-ems-system"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", vo="[tense] It's Sunday dinner, and Frank, who's sixty two, suddenly puts down his fork. {1}He presses a fist into the middle of his chest, {2}and within a few seconds he's gone pale and he's sweating. {3}His daughter Maya grabs her phone and dials nine one one. {4}[thoughtful] And from that moment, a whole chain of people, most of whom Frank will never meet, starts working on one job: keeping him alive. {5}The caller, the dispatcher, the ambulance crew, and the hospital."),
  dict(key="promise", vo="That chain is emergency medical services, the E M S system, and by the end of this video you'll be able to follow Frank's call through every link of it. {1}You'll know where that system came from, {2}the federal laws and the ten standards that built it, {3}how a nine one one call actually finds a caller, {4}and why the ambulance doesn't always go to the closest hospital. {5}And all of that is chapter one material for your E M T course and the national exam, the N R E M T."),
  dict(key="why", vo="[warmly] Now, chapter one usually feels like a pile of trivia, so most students just memorize dates and lists and hope for the best. {1}But there's ONE idea that makes all of it hang together. {2}The whole point of E M S is that real care starts at the scene, {3}and then it never stops, through every handoff, all the way into the hospital. And as you'll see, that scene starts with the caller. {4}Every date and every standard you're about to see is just a piece that was added to make that chain work. So let's watch it get built."),
 ]),
 dict(id="history", title="From transport to care", beats=[
  dict(key="h1", vo="[curious] So where did this start? {1}Organized battlefield ambulances show up in France in the seventeen nineties, {2}and their main job was to get wounded soldiers off the battlefield. {3}There was very little care along the way. {4}The idea was simply to get them to the surgeons."),
  dict(key="h2", vo="Then, during the American Civil War, {1}Clara Barton organized care for wounded soldiers, and she went on to found the American Red Cross. {2}By the First World War, motorized ambulances and volunteer ambulance corps were in wide use. {3}And the wars in Korea and Vietnam brought the BIG advances. Medics treated wounded soldiers right where they fell, and helicopters flew them straight to surgery. {4}That model, care on the spot and then a fast trip to a surgeon who's ready, is what civilian trauma centers later copied. We'll meet them in a few minutes."),
  dict(key="h3", vo="Meanwhile, back home, civilians were a long way behind the military. {1}Some cities had hospital ambulances by the late eighteen hundreds, but care on board was minimal. It was mostly a ride. {2}And many smaller communities had no real service for decades. {3}[thoughtful] Well into the nineteen sixties, the ambulance in a lot of towns was a funeral home's hearse, because that was the one vehicle in town built to carry a person lying flat, {4}or it was the fire department."),
  dict(key="h4", vo="So here's the shift that defines the history of E M S. {1}It went from JUST transport... {2}to care of hospital quality that begins at the scene {3}and continues without a break until the patient reaches the hospital. {4}[serious] And think about why that matters for Frank. If his heart stops at that dinner table, no blood reaches his brain, and the brain starts being damaged within minutes. {5}So a fast ride to a hospital that's fifteen minutes away won't save him on its own. He needs help in the first few minutes, right where he is. Everything else in your E M T course rests on that idea."),
  dict(key="k1q", vo="Quick check. {1}What was the one thing the earliest E M S services did, and what were they missing?", pause=4.0),
  dict(key="k1a", vo="They transported the wounded, and that's all they did. {1}What was missing was care at the scene. {2}And adding that care, then keeping it going all the way to the hospital, is what turned an ambulance from a ride into the start of treatment."),
 ]),
 dict(id="laws", title="The laws that built EMS", beats=[
  dict(key="l1", vo="So how did the United States go from hearses to real E M S? {1}It took a few federal actions, and the best way to remember them is to ask what problem each one solved. {2}In the nineteen sixties, more and more people were dying on the new highways, {3}and a nineteen sixty six report from the National Academy of Sciences, called Accidental Death and Disability, described injury as the neglected disease of modern society, because care after a crash was so poor."),
  dict(key="l2", vo="[thoughtful] And since highway crashes were a transportation problem, the government handed the job to transportation. {1}That same year, nineteen sixty six, the National Highway Safety Act directed the Department of Transportation, the D O T, to set standards for E M S. {2}That's why, even today, the agency that guides E M S is a highway agency."),
  dict(key="l3", vo="[curious] Next, someone had to check that E M Ts everywhere actually met those standards. {1}So in nineteen seventy, the National Registry of Emergency Medical Technicians was founded, {2}and that's the N R E M T, the same organization whose exam you're studying for. {3}But standards on paper don't buy ambulances or radios. So in nineteen seventy three, the National E M S Systems Act paid to build E M S systems across the country, {4}and it's considered the cornerstone federal law for E M S systems."),
  dict(key="l4", vo="[warmly] Here's an easy way to keep the three straight. {1}Nineteen sixty six set the standards. {2}Nineteen seventy created the test. {3}And nineteen seventy three built the systems. {4}Then in the early nineteen eighties, that federal money was folded into block grants to the states, so control passed mostly to the states, which now run their own E M S systems. {5}But the National Highway Traffic Safety Administration, N H T S A, which is part of the D O T, still provides guidance."),
 ]),
 dict(id="standards", title="NHTSA's 10 standards", beats=[
  dict(key="l5", vo="[curious] And one of the most useful things N H T S A gave us is a checklist. {1}It describes a complete E M S system with ten standards. {2}Each one names a part that the system must have. {3}And instead of memorizing them as a list, let's sort them into three groups and hang each one on Frank's call."),
  dict(key="l6", vo="The first group is the people and the rules. {1}Regulation and policy means the laws and rules every system runs under. {2}Resource management means making sure everyone has the same equipment and personnel, so a patient gets the same care wherever they call from. {3}And human resources and training is about who does the work and how they're trained. That's you."),
  dict(key="l7", vo="[upbeat] The second group is getting Frank to care. {1}Transportation is safe, reliable ambulances. {2}Facilities means getting each patient to the right hospital, which isn't always the closest one. {3}Communications is the link that makes it all work, from Maya's call to the radio report the crew gives the hospital. {4}And trauma systems are the networks of trauma centers that injured patients are sent to."),
  dict(key="l8", vo="The third group keeps the whole system honest. {1}Public information and education is teaching people to recognize an emergency and call nine one one, and that's exactly what Maya just did. {2}Medical direction means a physician oversees the care E M Ts give, because E M Ts do medical care under a doctor's authority. {3}And evaluation means checking the work and improving it, through quality improvement, quality assurance and total quality management, which you'll see written as Q I, Q A and T Q M. For now, you just need to recognize those names. {4}We'll dig into medical direction and quality improvement in the next video."),
  dict(key="k2q", vo="Quick check. {1}Every month, a system reviews its run reports, the written record a crew fills out for each call, to find problems in patient care and fix them. Which of the ten standards is that?", pause=4.0),
  dict(key="k2a", vo="That's evaluation, through quality improvement. {1}[gently] The trap answer is medical direction. A physician might be involved in the review, but finding problems and fixing them is what evaluation means."),
 ]),
 dict(id="call", title="The 911 call", beats=[
  dict(key="c1", vo="Okay, so back to Maya, who's on the phone. {1}The public reaches E M S by telephone, and the number is nine one one. {2}Nine one one is available to nearly everyone in the country, {3}it handles about two hundred forty million calls a year, {4}and in many areas, eighty percent or more of those calls come from mobile phones. [curious] And that last number creates a real problem. Where is the caller?"),
  dict(key="c2", vo="With an old landline, that's easy. {1}Enhanced nine one one automatically shows the dispatcher the caller's number and the address, because a landline is wired to one fixed address. {2}So even if the caller can't speak, the dispatcher knows where to send help."),
  dict(key="c3", vo="A cell phone moves around, so wireless nine one one is rolled out in two phases. {1}Phase one gives the dispatcher the callback number, plus the location of the cell tower that's handling the call. {2}[serious] But a tower can cover miles, so that's only a rough area. {3}Phase two adds the actual location of the device itself, as map coordinates. {4}So if Maya's call drops, phase one means the dispatcher can call her back, and phase two means they can find the house."),
  dict(key="c4", vo="[thoughtful] Calls placed over the internet are even harder. {1}They're called V o I P calls, for voice over internet protocol, {2}and some of them aren't tied to a phone line or a cell tower, so the location they send may be just an address the user registered, which can be out of date. {3}So locating some of these callers is still an ongoing challenge."),
  dict(key="k3q", vo="Quick check. {1}A caller on a cell phone panics and hangs up before giving an address. Which wireless phase lets the dispatcher see where the phone actually is?", pause=4.0),
  dict(key="k3a", vo="Phase two. {1}It gives the location of the device itself. {2}Phase one gives the callback number and only the tower's location, which is a rough area. So phase one lets them call back, and phase two lets them find the caller."),
 ]),
 dict(id="dispatch", title="The dispatcher", beats=[
  dict(key="c5", vo="Now, who answers? {1}It's an emergency medical dispatcher, an E M D, and E M Ds are specially trained and certified. {2}The E M D asks a set of questions to figure out what's going on, and then sends the right resources. {3}So for Frank, with chest pain, that could mean an ambulance with lights and siren. {4}[thoughtful] But the E M D's job doesn't end when the ambulance leaves."),
  dict(key="c6", vo="[tense] Because right then, Frank slumps sideways in his chair, and he's not breathing normally. {1}The dispatcher tells Maya to put the phone on speaker, get him onto the floor, because compressions work best against a firm surface, and push hard and fast in the center of his chest. {2}Those are pre arrival instructions. They're what the E M D tells the caller to do until the crew gets there. {3}Things like how to do C P R, which means chest compressions, sometimes with rescue breaths, {4}how to give breaths, {5}or how to control bleeding."),
  dict(key="c7", vo="[serious] And this is where the big idea from the start shows up again. {1}The ambulance is still minutes away, {2}but care has already started, at the scene, done by a family member and guided by the dispatcher. {3}So the chain doesn't start when the E M Ts walk in. It starts with the caller."),
 ]),
 dict(id="flow", title="The chain of handoffs", beats=[
  dict(key="f1", vo="So let's follow Frank through the system, from his point of view, {1}because seen from the patient's side, E M S is a chain of handoffs. {2}The E M D answered the call and sent responders. {3}Now, depending on the system and the call, those responders can be at four levels. {4}Emergency medical responders, or E M Rs, {5}emergency medical technicians, which is the level you're training for, {6}advanced E M Ts, or A E M Ts, {7}and paramedics. We'll compare what each level can do in the next video."),
  dict(key="f2", vo="[calm] The crew arrives, takes over C P R from Maya, and keeps it going. {1}On the way, they radio a report ahead, so the hospital is ready when they arrive. Then the ambulance carries Frank to the emergency department, the E D. {2}And the E D is the gateway to the rest of the hospital. From there he can move on to the operating room, the O R, {3}to specialists, {4}or to a bed upstairs."),
  dict(key="f3", vo="[curious] But not every hospital can do everything. {1}Some are specialty centers. {2}A major trauma center keeps surgical teams available twenty four seven, so a badly injured patient can go to surgery without waiting for a surgeon to drive in. {3}There are also burn centers, {4}pediatric centers, {5}cardiac centers, {6}and stroke centers. Each has the people and the equipment for one kind of emergency, ready to go."),
  dict(key="f4", vo="So that's why picking the hospital is a CRITICAL decision. {1}You weigh the patient's condition against the transport time. {2}To see that trade off clearly, let's leave Frank for a second and picture a driver with severe injuries after a crash. The closest hospital is five minutes away, and the trauma center is fifteen. {3}The closer hospital may have no surgeon ready, so he might need surgery that it can't start. {4}[thoughtful] But for a patient who might not survive those extra ten minutes, the math can go the other way. {5}Your local protocols guide this choice, and they're the rules your medical director sets."),
  dict(key="f5", vo="And when it's not clear, you can ask for help in real time. {1}Your written protocols are called off line medical direction. {2}And when they don't cover the situation, you can talk to a physician by radio or phone during the call. That's on line medical direction. {3}It's one of the ways medical direction, from our ten standards, shows up on a real call. {4}And for Frank, if the crew gets his pulse back, his local protocols may send him to a cardiac center, a hospital that can open a blocked heart artery right away. So he goes from his dinner table to the right hospital, and at every handoff, someone is already caring for him."),
 ]),
 dict(id="recap", title="Recap", beats=[
  dict(key="recap", vo="[warmly] So let's put the whole thing in one picture. {1}E M S started as transport only, and the big shift was to care of hospital quality that starts at the scene and never breaks. {2}Nineteen sixty six set the standards through the D O T, nineteen seventy created the National Registry, and nineteen seventy three built the systems. {3}N H T S A's ten standards describe every part a complete system needs. {4}Nine one one finds the caller, with phase one giving the callback number and the tower's rough area, and phase two giving the phone's actual location. {5}The E M D sends help and starts care with pre arrival instructions. {6}And the patient moves through a chain of handoffs to the right hospital, which isn't always the closest one."),
 ]),
 dict(id="practice", title="Practice problems", beats=[
  dict(key="p1q", vo="Alright, practice time. Pause the video, try each one, and then I'll walk you through it. {1}Problem one. Which federal law, passed in nineteen seventy three, is considered the cornerstone law for E M S systems? {2}A, the National Highway Safety Act. {3}B, the National E M S Systems Act. {4}C, the act that founded the National Registry.", pause=5.0),
  dict(key="p1a", vo="The answer is B, the National E M S Systems Act of nineteen seventy three. {1}[gently] And the trap is A. {2}The Highway Safety Act came first, in nineteen sixty six, and it told the D O T to set standards. But it didn't build the systems. {3}And the National Registry wasn't created by an act. It was founded as an organization, in nineteen seventy. {4}So remember, sixty six set the standards, seventy made the test, and seventy three built the systems."),
  dict(key="p2q", vo="Problem two. {1}[curious] A caller on a mobile phone says her husband collapsed, and then the call drops. {2}The dispatcher can see the callback number and the cell tower, but not the house. {3}Which phase of wireless nine one one is working here, and what's missing?", pause=5.0),
  dict(key="p2a", vo="That's phase one. {1}It gives the callback number and the tower's location. {2}What's missing is phase two, the location of the device itself. {3}[thoughtful] The trap is thinking phase one gives the address. It doesn't. It only gives a rough area, so the dispatcher's best move is to call her right back."),
  dict(key="p3q", vo="Problem three. {1}[serious] You're the E M T on a crash. Your patient has severe injuries, and his condition allows a slightly longer ride. {2}The closest hospital is five minutes away, and the trauma center is fifteen. {3}What does the trauma center offer that matters most for this patient?", pause=5.0),
  dict(key="p3a", vo="Surgical teams that are available twenty four seven. {1}A badly injured patient may need an operation right away, and a major trauma center can start one without waiting. {2}[gently] The trap is to say always go to the closest hospital. {3}Closest is not always right. You weigh the patient's condition against the transport time, follow your local protocols, and use on line medical direction when you're unsure."),
  dict(key="p4q", vo="Last one. {1}Before the ambulance arrives, a dispatcher talks a caller through chest compressions. {2}What are those instructions called, and who gives them?", pause=4.0),
  dict(key="p4a", vo="They're pre arrival instructions, and they come from the emergency medical dispatcher, the E M D. {1}[warmly] And notice what that means. Care started before any E M T arrived. {2}The trap is thinking the E M S chain starts when the crew walks in. {3}It starts with the caller."),
 ]),
 dict(id="outro", title="Next: provider levels", beats=[
  dict(key="end", vo="And that's how the E M S system works, from the battlefield to Frank's dinner table. {1}If you want more practice on this, there are free questions on levl prep dot com. {2}[warmly] Next up are the four provider levels, what each one can do, and how medical direction and quality improvement keep everyone on track. {3}I'll see you there."),
 ]),
]

import re
# Respelled words: spaced letters in vo -> normal spelling in captions.
_JOIN = [("N R E M T", "NREMT"), ("N H T S A", "NHTSA"), ("A E M Ts", "AEMTs"), ("E M Ts", "EMTs"), ("E M Rs", "EMRs"),
         ("E M Ds", "EMDs"), ("E M S", "EMS"), ("E M T", "EMT"), ("E M D", "EMD"), ("D O T", "DOT"), ("T Q M", "TQM"),
         ("Q I", "QI"), ("Q A", "QA"), ("C P R", "CPR"), ("E D", "ED"), ("O R", "OR"), ("V o I P", "VoIP"),
         ("levl prep dot com", "levlprep.com"), ("nine one one", "911"), ("pre arrival", "pre-arrival"),
         ("on line medical", "online medical"), ("off line medical", "offline medical"), ("trade off", "tradeoff")]
_KEEP_CAPS = {"NREMT", "NHTSA", "AEMTs", "EMTs", "EMRs", "EMDs", "EMS", "EMT", "EMD", "DOT", "TQM", "QI", "QA", "CPR", "ED", "OR", "A", "B", "C"}

def clean(vo):
    return re.sub(r"\s+", " ", re.sub(r"\{\d+\}", "", vo)).strip()

def _auto_disp(vo):
    d = re.sub(r"\[[^\]]+\]\s*", "", vo)
    for a, b in _JOIN:
        d = d.replace(a, b)
    d = re.sub(r"\b[A-Z]{2,}\b", lambda m: m.group(0) if m.group(0) in _KEEP_CAPS else m.group(0).lower(), d)
    return d

for _ch in CHAPTERS:
    for _b in _ch["beats"]:
        _b.setdefault("disp", _auto_disp(_b["vo"]))

def disp(b):
    d = b.get("disp") or clean(b["vo"])
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]+\]\s*", "", re.sub(r"\{\d+\}", "", d))).strip()

if __name__ == "__main__":
    tot = 0; tags = 0
    for ch in CHAPTERS:
        n = sum(len(clean(b["vo"])) + 1 for b in ch["beats"])
        tags += sum(len(re.findall(r"\[[^\]]+\]", b["vo"])) for b in ch["beats"])
        tot += n; print(f'{ch["id"]:12s} {n:5d}')
    print("total", tot, "chars, about", round(tot / 900, 1), "min;", tags, "emotion cues")
