"""All scenes of yt-orgo-03: teaching boards (boards_a, boards_b, boards_c), practice (boards_p) and the story beats (story)."""
SCENES = {}
for _m in ('boards_a', 'boards_b', 'boards_c', 'boards_p', 'story'):
    try:
        SCENES.update(__import__(_m).SCENES)
    except ModuleNotFoundError as e:
        if _m not in str(e): raise
        print('scenes: no', _m)
