import sys; sys.path.insert(0,'/home/claude/lv')
import render as R
for t in sys.argv[2:]:
    R.still(float(t), f'{sys.argv[1]}/s_{float(t):07.2f}.png')
