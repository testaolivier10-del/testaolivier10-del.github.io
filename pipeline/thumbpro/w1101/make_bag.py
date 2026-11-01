import sys; sys.path.insert(0,'/home/claude/lp/thumbpro')
import thumbpro as T
from PIL import Image, ImageDraw
P='/tmp/w/th/'
cut=Image.open(P+'bag_cut.png').convert('RGBA'); cut=cut.crop(cut.getbbox())
head=cut.crop((0,0,int(cut.width*0.6),cut.height))
NR=T.COURSE['NREMT']
def bp_chip(c,x,y):
    f=T.font(T.MONT,64,900); d=ImageDraw.Draw(c)
    d.rounded_rectangle((x,y,x+380,y+120),26,fill=T.INK+(240,),outline=T.RED,width=7)
    d.text((x+30,y+22),'BP 94/58',font=f,fill=T.RED)
def a():
    c=T.background(P+'bag_f3.png',focus=(0.5,0.62),zoom=1.7,blur=12,tint=NR,dark=0.55,burst=(560,1150),burst_col=(255,120,110))
    T.top_shade(c,820,225)
    s,p=T.subject(cut,1000,glow=(255,140,120),glow_r=30)
    T.paste(c,s,-40-p,1700-s.height+p)
    bp_chip(c,640,700)
    T.arrow(c,(860,840),(760,1080),bend=-0.3,col=T.RED)
    T.text_line(c,'BAG TOO FAST',540,190,200)
    T.text_line(c,'BP CRASHES',540,430,190,box=T.RED,box_txt=T.WHITE)
    T.pill(c,'NREMT',NR); T.mark(c); return c
def b():
    c=T.background(P+'bag_f3.png',focus=(0.5,0.62),zoom=1.7,blur=12,tint=NR,dark=0.55,burst=(540,1150),burst_col=(200,255,240))
    T.top_shade(c,820,225)
    s,p=T.subject(cut,820,glow=(140,255,230),glow_r=30)
    T.paste(c,s,540-s.width/2,1650-s.height+p)
    T.ring(c,330,1010,170,col=T.YELLOW)
    T.text_line(c,'HOW OFTEN',540,190,230)
    T.text_line(c,'DO YOU SQUEEZE?',540,440,160,box=T.YELLOW)
    T.pill(c,'NREMT',NR); T.mark(c); return c
ps=[]
for n,fn in (('a',a),('b',b)):
    p=P+f'out/w1006-01-bag-rate_{n}.png'; T.save(fn(),p); ps.append(p)
T.preview(ps,P+'out/bag_prev.jpg'); print('ok')
