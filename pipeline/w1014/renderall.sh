cd /home/claude/lp
for id in w1014-01-aspirin-chew w1014-02-cold-pack w1014-03-caffeine-block; do node render.js out/$id > out/r_$id.log 2>&1; done
echo ALLDONE > out/renderall.done
