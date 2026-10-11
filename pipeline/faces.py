"""Shared profile head (facing right) in a 1000x1000 local box. v4: friendlier flat style, short neck,
compact quiff, eye set back from the nose bridge, jawline that returns to the ear, scrub collar."""

L = dict(
    crown=(500, 172), brow=(722, 400), eye=(684, 448), nose_tip=(784, 522), nose_base=(742, 548),
    mouth_corner=(720, 596), chin=(740, 676), jaw_angle=(566, 680), ear=(495, 495), earlobe=(504, 562),
)

SKIN = ("M500 172 C616 168 690 222 704 300 C710 345 718 380 722 400 "
        "C722 412 718 420 715 428 C734 456 760 484 778 506 C792 522 790 542 770 544 "
        "C760 545 750 543 742 548 C745 558 749 568 748 578 C747 586 740 591 734 594 "
        "C743 599 747 606 741 614 C736 622 728 626 728 634 C736 646 744 660 740 676 "
        "C736 694 722 704 700 708 C670 712 640 714 616 720 "
        "C612 780 606 880 600 1000 L366 1000 C374 860 392 740 410 642 "
        "C346 610 290 536 288 430 C286 290 370 176 500 172 Z")

HAIR = ("M478 150 C602 134 704 168 724 240 C730 262 716 290 700 298 "
        "C690 272 660 262 630 268 C600 274 585 300 580 340 C574 386 578 430 570 466 L554 468 "
        "C546 442 528 422 500 420 C470 420 450 440 444 470 C440 520 436 580 424 648 "
        "C346 626 278 540 278 430 C276 296 358 164 478 150 Z")

def head(prefix="h", skin=None, show_ear=True, scrubs=True, scrub_color="#2bb3a6"):
    """Return SVG defs + group for the head. Wrap the result in a <g transform> to place/scale it."""
    p = prefix
    skin = skin or f"url(#{p}sk)"
    ex, ey = L["eye"]
    ear = ""
    if show_ear:
        ear = (f'<g id="{p}ear">'
               f'<path d="M495 425 C465 425 452 460 455 495 C458 530 470 558 495 566 C512 570 522 560 520 546 '
               f'C532 520 538 480 530 452 C524 432 512 424 495 425 Z" fill="url(#{p}ear)" stroke="#c48a63" stroke-width="5"/>'
               f'<path d="M500 450 C482 456 480 492 490 514 C497 528 510 526 513 514" stroke="#c48a63" stroke-width="7" fill="none" stroke-linecap="round"/></g>')
    shirt = ""
    if scrubs:
        shirt = (f'<g transform="translate(-20 -34)"><path d="M110 1040 C140 900 270 862 396 852 L520 934 L644 852 C770 862 890 900 920 1040 Z" fill="{scrub_color}"/>'
                 f'<path d="M396 852 L520 934 L644 852 L622 850 L520 912 L418 850 Z" fill="#1e8a80"/></g>')
    return f'''<defs>
      <linearGradient id="{p}sk" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="#eab58e"/><stop offset=".5" stop-color="#f5cca7"/><stop offset="1" stop-color="#f8d7b6"/></linearGradient>
      <linearGradient id="{p}ear" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e2a780"/><stop offset="1" stop-color="#efbf9a"/></linearGradient>
      <linearGradient id="{p}hr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b1a10"/><stop offset=".65" stop-color="#3f2817"/><stop offset="1" stop-color="#55361f"/></linearGradient>
      <radialGradient id="{p}ck" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ee8f7c" stop-opacity=".38"/><stop offset="1" stop-color="#ee8f7c" stop-opacity="0"/></radialGradient>
      <filter id="{p}bl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
      <clipPath id="{p}clip"><path d="{SKIN}"/></clipPath>
    </defs>
    <g id="{p}">
      <path d="{SKIN}" fill="{skin}"/>
      <g clip-path="url(#{p}clip)">
        <path d="M508 556 C530 620 548 660 572 676 C610 698 660 708 704 708 L620 760 L600 1000 L340 1000 L380 620 L432 470 L500 470 Z" fill="#c98a64" opacity=".38"/>
        <path d="M560 680 C600 700 650 710 700 710 L690 740 C640 738 590 724 548 700 Z" fill="#8f5a40" opacity=".25" filter="url(#{p}bl)"/>
        <path d="M290 330 C320 450 360 560 422 650 L300 680 Z" fill="#a8684a" opacity=".14"/>
        <ellipse cx="700" cy="330" rx="26" ry="70" fill="#fff" opacity=".12"/>
      </g>
      <ellipse cx="640" cy="540" rx="56" ry="34" fill="url(#{p}ck)"/>
      <path d="M746 520 C760 514 770 528 762 540" stroke="#c8906c" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M748 578 C747 586 740 591 734 594 C726 594 720 590 722 585 C730 583 740 581 748 578 Z" fill="#c9806a"/>
      <path d="M734 594 C743 599 747 606 741 614 C731 614 723 607 721 599 Z" fill="#d48d76"/>
      <path d="M734 594 L712 596" stroke="#8a4a3a" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M{ex-22} {ey} C{ex-8} {ey-13} {ex+10} {ey-12} {ex+16} {ey} C{ex+6} {ey+10} {ex-10} {ey+10} {ex-22} {ey} Z" fill="#fbf7f2"/>
      <circle cx="{ex+5}" cy="{ey-1}" r="10" fill="#4a2e1c"/><circle cx="{ex+7}" cy="{ey-1}" r="5" fill="#120a06"/>
      <circle cx="{ex+9}" cy="{ey-4}" r="2.6" fill="#fff"/>
      <path d="M{ex-24} {ey-1} C{ex-8} {ey-17} {ex+12} {ey-15} {ex+19} {ey-1}" stroke="#2a1a10" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M646 410 C668 396 696 394 718 402 C704 404 676 408 650 420 Z" fill="#2a1a10"/>
      <path d="{HAIR}" fill="url(#{p}hr)"/>
      <path d="M470 172 C580 154 670 180 708 228 C650 202 560 194 470 212 C430 222 400 236 380 252 C400 212 430 184 470 172 Z" fill="#6a4528" opacity=".45"/>
      {ear}
      {shirt}
    </g>'''
