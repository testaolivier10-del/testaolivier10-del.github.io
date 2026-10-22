"""Beats for batch w1021 (midweek build 2026-10-21). Spoken text in vo (with {n} cues), shown text in disp."""

IV = [
    dict(key="hook", vo="Hang a bag of pure water here, {1}and his red blood cells start bursting.",
         disp="Hang a bag of pure water here, and his red blood cells start bursting."),
    dict(key="why", vo="That's what we call hypotonic. {1}Your cells have tons dissolved inside, salts and proteins. {2}Pure water has basically none. {3}Sounds backwards, but water moves toward more dissolved stuff, {4}so it rushes in. That's osmosis.",
         disp="That's what we call hypotonic. Your cells have tons dissolved inside, salts and proteins. Pure water has basically none. Sounds backwards, but water moves toward more dissolved stuff, so it rushes in. That's osmosis."),
    dict(key="swell", vo="It swells up {1}till it's round, {2}then pops.",
         disp="It swells up till it's round, then pops."),
    dict(key="fix", vo="So I V fluid is never plain water. {1}Point nine percent saline has about the same total dissolved as the cell, {2}so water goes in and out evenly.",
         disp="So IV fluid is never plain water. 0.9% saline has about the same total dissolved as the cell, so water goes in and out evenly."),
    dict(key="ask", vo="So in three percent saline, does water rush into his cells, {1}or out?",
         disp="So in 3% saline, does water rush into his cells, or out?"),
]

BALL = [
    dict(key="hook", vo="At the top of this throw, the ball stops. {1}So its acceleration's zero too, right? {2}Nope.",
         disp="At the top of this throw, the ball stops. So its acceleration's zero too, right? Nope."),
    dict(key="up", vo="Ignore air resistance. {1}Gravity slows it by about ten meters per second, {2}every second.",
         disp="Ignore air resistance. Gravity slows it by about 10 m/s, every second."),
    dict(key="top", vo="At the top, it stops for an instant, {1}but gravity didn't switch off. {2}Acceleration's still nine point eight meters per second squared, down. {3}That's what turns it around.",
         disp="At the top, it stops for an instant, but gravity didn't switch off. Acceleration's still 9.8 m/s², down. That's what turns it around."),
    dict(key="trick", vo="Easy way to remember it. {1}The velocity arrow shrinks, {2}flips, {3}then grows. {4}The acceleration arrow? Never changes.",
         disp="Easy way to remember it. The velocity arrow shrinks, flips, then grows. The acceleration arrow? Never changes."),
    dict(key="ask", vo="Still no air resistance. {1}On the way down, is the acceleration bigger, smaller, or the same?",
         disp="Still no air resistance. On the way down, is the acceleration bigger, smaller, or the same?"),
    dict(key="cta", vo="Free practice for this on levlprep dot com.", disp="Free practice for this on levlprep.com."),
]

SPEEDO = [
    dict(key="hook", vo="Your speedometer is doing calculus. {1}That needle shows an instantaneous rate of change.",
         disp="Your speedometer is doing calculus. That needle shows an instantaneous rate of change."),
    dict(key="odo", vo="The odometer counts miles driven, {1}your total distance. {2}Speed is how fast that number changes.",
         disp="The odometer counts miles driven, your total distance. Speed is how fast that number changes."),
    dict(key="avg", vo="Over a whole hour you'd get an average, {1}miles over hours. {2}But the needle shows right now. {3}Sounds kind of impossible, right?",
         disp="Over a whole hour you'd get an average, miles over hours. But the needle shows right now. Sounds kind of impossible, right?"),
    dict(key="shrink", vo="So shrink the window. {1}A minute. {2}A second. {3}Even smaller. {4}The average settles on one number, {5}and that's the derivative.",
         disp="So shrink the window. A minute. A second. Even smaller. The average settles on one number, and that's the derivative."),
    dict(key="slope", vo="On a graph, it's the slope of the tangent line, {1}and the needle tracks that slope.",
         disp="On a graph, it's the slope of the tangent line, and the needle tracks that slope."),
    dict(key="ask", vo="So what about the odometer? {1}Is it the derivative of your speed, or the integral?",
         disp="So what about the odometer? Is it the derivative of your speed, or the integral?"),
]
