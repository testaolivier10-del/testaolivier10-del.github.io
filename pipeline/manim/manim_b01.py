"""Manim graph for AP Bio 01 (specific heat): temperature rise vs energy added, water vs a liquid with half its specific heat.
Run times come from the ElevenLabs word timestamps of beat t4 (clip starts 0.28 s before "A liquid"; "half" at +1.16 s, "TWENTY" at +3.83 s).
Render: manim -qh -t --fps 30 -r 820,560 manim_b01.py SpecificHeat  (transparent .mov), then composited over the render at MANIM_BOX."""
from manim import *
import json, os
TEAL_C, CORAL_C, INK_C = "#2ee6d6", "#ff6b6b", "#a9bbd8"
TM = json.load(open(os.environ.get("TM", "/home/claude/lp/manim/b01_times.json")))

class SpecificHeat(Scene):
    def construct(self):
        ax = Axes(x_range=[0, 22000, 5000], y_range=[0, 22, 5], x_length=8.8, y_length=5.4,
                  axis_config={"color": INK_C, "stroke_width": 3, "include_tip": False},
).shift(DOWN * 0.25 + RIGHT * 0.55)
        nums = VGroup(*[Text(t, font_size=28, font="Inter", weight=BOLD, color=INK_C).next_to(ax.c2p(x, 0), DOWN, buff=0.12) for x, t in ((0, "0"), (10000, "10,000"), (20900, "20,900"))],
                      *[Text(t, font_size=28, font="Inter", weight=BOLD, color=INK_C).next_to(ax.c2p(0, y), LEFT, buff=0.12) for y, t in ((10, "10"), (20, "20"))])
        xl = Text("energy added (J)", font_size=28, font="Inter", weight=BOLD, color=INK_C).next_to(ax.x_axis, DOWN, buff=0.5)
        yl = Text("temperature rise (°C)", font_size=28, font="Inter", weight=BOLD, color=INK_C).rotate(PI / 2).next_to(ax.y_axis, LEFT, buff=0.4)
        self.play(Create(ax), FadeIn(xl), FadeIn(yl), FadeIn(nums), run_time=0.45)
        water = ax.plot(lambda x: x / 2090, x_range=[0, 20900], color=TEAL_C, stroke_width=9)
        self.play(Create(water), run_time=0.6)
        wl = Text("water: +10 °C", font_size=32, font="Inter", weight=BOLD, color=TEAL_C).move_to(ax.c2p(15500, 3.4))
        self.play(FadeIn(wl), run_time=0.11)
        self.wait(max(0.01, TM["half"] - 1.16))
        half = ax.plot(lambda x: x / 1045, x_range=[0, 20900], color=CORAL_C, stroke_width=9)
        self.play(Create(half), run_time=TM["twenty"] - TM["half"])
        dot = Dot(ax.c2p(20900, 20), color=CORAL_C, radius=0.09)
        hl = Text("half the specific heat: +20 °C", font_size=32, font="Inter", weight=BOLD, color=CORAL_C).next_to(ax.c2p(20900, 20), LEFT, buff=0.3)
        vl = DashedLine(ax.c2p(20900, 0), ax.c2p(20900, 20), color=INK_C, stroke_width=3)
        self.play(FadeIn(dot), FadeIn(hl), Create(vl), run_time=0.5)
        self.wait(TM["hold"])
