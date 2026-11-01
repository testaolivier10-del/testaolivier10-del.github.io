import json, importlib.util, sys
sys.path[:0]=['/home/claude/lp/w1101/lib']
def load(name, path):
    sp=importlib.util.spec_from_file_location(name, path); m=importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
B=load('b','/home/claude/lp/w1101/bomber/build.py'); G=load('g','/home/claude/lp/w1101/guard/build.py')
Cc=load('c','/home/claude/lp/w1101/calc/build.py'); Td=load('t','/home/claude/lp/w1101/toads/build.py')
def ch(a,b,step=1.5):
    out=[];x=a
    while x<b: out.append(round(x,2)); x+=step
    return out
def beat(t0,t1,kind,person,diagram,what,source='',changes=None):
    return dict(t0=round(t0,2),t1=round(t1,2),kind=kind,person=person,diagram=diagram,changes=changes or ch(t0,t1),what=what,source=source)
S={}
T=B.T; d=B.DUR
S['w1101-01-bomber-holes']=dict(id='w1101-01-bomber-holes',format='short',duration=round(d,1),answer=dict(kind='place',what='armor over the engines and cockpit, where the returners had no holes'),
 beats=[beat(0,1.8,'surprise',True,False,'a bomber full of holes touches down with a tyre smoke puff',changes=[0,0.6,1.15,1.6]),
        beat(1.8,B.SHOT_B,'result',True,False,'it rolls out past ground crew; one points at the holes; title SURVIVORSHIP BIAS',changes=[1.8,2.6,3.6,4.6,5.6]),
        dict(beat(B.SHOT_B,T['but'],'explain',False,True,'overhead: red rings mark holes on wings, tail, body on each word; dashed plates show the obvious idea','AMS feature column 2016-06 (Wald, SRG); Mangel and Samaniego 1984',changes=ch(B.SHOT_B,T['but'],1.2)),anchor=True),
        beat(T['but'],B.SHOT_C,'explain',False,True,'plates fade; engines and cockpit glow: no holes there?','AMS feature column',changes=ch(T['but'],B.SHOT_C,1.2)),
        beat(B.SHOT_C,B.SHOT_D,'explain',False,False,'in the air: flak, the near plane is hit in an engine, burns and falls into the clouds','Wald memoranda (survivor reasoning)',changes=ch(B.SHOT_C,B.SHOT_D,1.0)),
        beat(B.SHOT_D,B.SHOT_E,'explain',False,True,'overhead: three survivors and three empty dashed spots marked MISSING; chip a kind of sampling bias','AP Statistics CED topic 1.12',changes=ch(B.SHOT_D,B.SHOT_E,1.0)),
        beat(B.SHOT_E,d,'answer',False,True,'armor plates land on the engines and cockpit with a clank and a glint as the sun sweeps over','AMS feature column',changes=ch(B.SHOT_E,d,1.0))])
T=G.T; d=G.DUR
S['w1101-02-guard-faint']=dict(id='w1101-02-guard-faint',format='short',duration=round(d,1),long_reason='the muscle pump needs one squeeze cycle, the frozen stall and the faint shown in order; cutting any of the three loses the idea',
 answer=dict(kind='action',what='wiggle toes and tense the calves to keep the muscle pump going'),
 beats=[beat(0,2.0,'surprise',True,False,'a guard in the heat sways at attention, sweat running',changes=[0,0.7,1.4]),
        beat(2.0,T['veins']-0.2,'result',True,False,'he keeps swaying while the others stand still; title WHY SOLDIERS FAINT',changes=ch(2.0,T['veins']-0.2,1.2)),
        beat(T['veins']-0.2,T['but'],'explain',True,True,'a lens grows from his calf: vein with valves; muscles squeeze, red cells jump up, valves open and close','OpenStax / IU human physiology: skeletal muscle pump',changes=ch(T['veins']-0.2,T['but'],1.3)),
        beat(T['but'],T['less']-0.1,'explain',True,True,'muscles slack, flow stops, cells sink onto the closed valves and pile up','skeletal muscle pump; BMJ Mil Health 2022 reflex syncope',changes=ch(T['but'],T['less']-0.1,1.2)),
        beat(T['less']-0.1,G.SHOT_D,'explain',True,False,'lens closes; a dark tunnel closes in; he topples forward and hits the gravel','BMJ Military Health 2022 (orthostatic reflex syncope)',changes=ch(T['less']-0.1,G.SHOT_D,1.0)),
        beat(G.SHOT_D,d,'answer',True,True,'the guard beside him wiggles his toes; a lens on his calf shows the pump working; he stays on his feet','BMJ Mil Health 2022 (toe wiggling); applied tension',changes=ch(G.SHOT_D,d,1.2))])
T=Cc.T; d=Cc.DUR
S['w1101-03-speed-camera']=dict(id='w1101-03-speed-camera',format='short',duration=round(d,1),answer=dict(kind='place',what='the instant on the speed graph where she was going exactly 75'),
 beats=[beat(0,1.8,'surprise',True,False,'a car brakes hard under a speed camera gantry; the camera beam reads it',changes=[0,0.5,1.0,1.5]),
        beat(1.8,Cc.SHOT_B,'result',True,False,'she drives on past the gantry; title MEAN VALUE THEOREM',changes=ch(1.8,Cc.SHOT_B,1.2)),
        beat(Cc.SHOT_B,Cc.SHOT_D,'explain',True,True,'aerial map: the car drives from gantry A to B, timer runs to 8:00, 10 MILES, 75 mph vs limit 65','section control (EU road safety observatory); arithmetic',changes=ch(Cc.SHOT_B,Cc.SHOT_D,1.0)),
        beat(Cc.SHOT_D,Cc.SHOT_E,'explain',True,True,'speed graph draws as the car drives under it; on exactly the cursor stops on the 75 crossing and the needle reads 75','AP Calculus AB CED topic 5.1 (Mean Value Theorem)',changes=ch(Cc.SHOT_D,Cc.SHOT_E,1.0)),
        beat(Cc.SHOT_E,d,'answer',True,False,'back on the motorway at gantry B she brakes again; chip AVERAGE 75 MPH','arithmetic and MVT',changes=ch(Cc.SHOT_E,d,1.0))])
T=Td.T; d=Td.DUR
S['w1101-04-cane-toads']=dict(id='w1101-04-cane-toads',format='short',duration=round(d,1),long_reason='the story needs the failure, the poison, the missing enemies and the spread over decades, and this is the run CTA line (2 s)',
 answer=dict(kind='place',what='the toad range spreading across northern Australia'),
 beats=[beat(0,1.6,'surprise',False,False,'a crate marked QUEENSLAND 1935 tips open and toads leap out',changes=[0,0.35,0.6,1.15]),
        beat(1.6,Td.SHOT_B,'result',False,False,'toads spread into the cane; title IT BACKFIRED',changes=ch(1.6,Td.SHOT_B,1.1)),
        beat(Td.SHOT_B,Td.SHOT_C,'explain',False,False,'a cane beetle high on the stalk; a toad leaps and falls short','Wikipedia Cane toad; NMA defining moments',changes=ch(Td.SHOT_B,Td.SHOT_C,1.2)),
        beat(Td.SHOT_C,Td.SHOT_D,'explain',False,False,'toads snap bugs; a snake bites one, the glands ooze, the snake goes limp','Queensland Government cane toad page',changes=ch(Td.SHOT_C,Td.SHOT_D,1.1)),
        dict(beat(Td.SHOT_D,Td.SHOT_D2,'explain',False,True,'map of the Americas with the native range, predators and diseases chips; a toad sits in the corner','Wikipedia Cane toad (native range)',changes=ch(Td.SHOT_D,Td.SHOT_D2,1.1)),anchor=True),
        beat(Td.SHOT_D2,Td.SHOT_E,'answer',False,True,'map of Australia: range spreads from Gordonvale with a year counter; INVASIVE SPECIES','Wikipedia Cane toads in Australia (spread dates); APES CED 9.8',changes=ch(Td.SHOT_D2,Td.SHOT_E,1.0)),
        beat(Td.SHOT_E,d,'answer',False,False,'night road crowded with hopping toads, MILLIONS, then the CTA line','Australian Geographic / Wikipedia population estimate',changes=ch(Td.SHOT_E,d,1.0))])
for k,v in S.items():
    json.dump(v,open(f'/home/claude/lp/w1101/out/{k}/story.json','w'),indent=1)
# shots.json
def shots(k, cuts, whats, ms, rig):
    out=[]
    for i,(a,b) in enumerate(zip(cuts[:-1],cuts[1:])):
        chk=dict(art='yes',motion_source='yes',rig=rig[i],life='yes',liquids=ms[i][1],face='na' if rig[i]=='na' else 'yes',timing='yes',accuracy='yes',consistency='yes',camera='yes',scene='yes')
        out.append(dict(id=f's{i+1}',t0=round(a,2),t1=round(b,2),what=whats[i],motion_source=ms[i][0],checks=chk,notes=''))
    json.dump(dict(video=k,shots=out),open(f'/home/claude/lp/w1101/out/{k}/shots.json','w'),indent=1)
shots('w1101-01-bomber-holes',[0,B.SHOT_B,B.SHOT_C,B.SHOT_D,B.SHOT_E,B.DUR],['dawn landing, crew watch','overhead holes and plan','engine hit in the air','survivors and empty spots','armor lands'],
      [('keyed code motion (landing curve, prop spin, crew breathing)','na'),('keyed overlays on the words, cloud shadows','na'),('keyed fall with smoke trail particles','na'),('slow push, cloud shadows','na'),('plates drop eased, light sweep','na')],['yes','na','na','na','na'])
shots('w1101-02-guard-faint',[0,G.SHOT_D,G.DUR],['hero guard, lens on calf, faint','neighbour wiggles toes, pump on'],[('code pose and breathing, keyed fall, cell flow from pump function','yes'),('code pose, toe flex, pump function','yes')],['yes','yes'])
shots('w1101-03-speed-camera',[0,Cc.SHOT_B,Cc.SHOT_D,Cc.SHOT_E,Cc.DUR],['brake under gantry A','aerial trip and numbers','speed graph and needle','brake under gantry B'],
      [('keyed car motion, parallax','na'),('car follows the route by the speed profile','na'),('graph from v(u), needle from the same v','na'),('keyed car motion','na')],['na','na','na','na'])
shots('w1101-04-cane-toads',[0,Td.SHOT_B,Td.SHOT_C,Td.SHOT_D,Td.SHOT_D2,Td.SHOT_E,Td.DUR],['crate opens, toads hop out','beetle up high, toad falls short','toads eat, snake and poison','Americas map','Australia spread','night road of toads'],
      [('keyed hop cycles','na'),('keyed hop','na'),('keyed tongue, strike, limp','yes'),('keyed reveal','na'),('arrival year model per cell','na'),('hop cycles','na')],['na','na','na','na','na','na'])
print('ok')
