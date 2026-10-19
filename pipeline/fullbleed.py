"""Full screen layout for Shorts: the art fills the whole 1080x1920 frame; titles and captions sit on soft dark fades.
Compose code keeps working in the 1080x960 'core' coordinates, placed at y=440 like before; full height art uses top:-440px."""
CSS = ("#stagewrap{top:0!important;height:1920px!important;-webkit-mask-image:none!important;mask-image:none!important}"
       "#stagewrap::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:4;background:linear-gradient(180deg,"
       "rgba(5,8,22,.78) 0,rgba(5,8,22,.5) 280px,rgba(5,8,22,.12) 420px,rgba(5,8,22,0) 500px,rgba(5,8,22,0) 1320px,"
       "rgba(5,8,22,.32) 1440px,rgba(5,8,22,.42) 1600px,rgba(5,8,22,.55) 1920px)}"
       "#core{position:absolute;left:0;top:440px;width:1080px;height:960px}"
       ".bg,.orb,#grid,.spark{display:none}"
       ".tt{text-shadow:0 3px 22px rgba(0,0,0,.95),0 0 8px rgba(0,0,0,.8),0 6px 0 rgba(0,0,0,.4)!important}")
def wrap(html):
    return f'<div id="core">{html}</div>'
