"""Anatomical arm and hand pieces for LevlPrep scenes (flat style, matches faces.py skin tones).
Needs the gradients gHand, gSkinA, gSweater and gGold defined in the scene's <defs>."""


def finger(bx, by, L, w, ang, extra=""):
    """A finger seen from the back, pointing along +x from its knuckle (bx, by): tapered, jointed, with a nail."""
    wt = w * 0.82; r = wt / 2
    body = (f'M0 {-w/2:.1f} C{L*0.4:.1f} {-w/2-1:.1f} {L*0.7:.1f} {-wt/2:.1f} {L-r:.1f} {-wt/2:.1f} '
            f'A{r:.1f} {r:.1f} 0 0 1 {L-r:.1f} {wt/2:.1f} C{L*0.7:.1f} {wt/2:.1f} {L*0.4:.1f} {w/2+1:.1f} 0 {w/2:.1f} Z')

    def crease(x, k):
        return (f'<path d="M{x:.1f} {-w*k:.1f} C{x+5:.1f} {-w*k*0.35:.1f} {x+5:.1f} {w*k*0.35:.1f} {x:.1f} {w*k:.1f}" stroke="#c48766" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>'
                f'<path d="M{x+7:.1f} {-w*k*0.8:.1f} C{x+11:.1f} {-w*k*0.25:.1f} {x+11:.1f} {w*k*0.25:.1f} {x+7:.1f} {w*k*0.8:.1f}" stroke="#c48766" stroke-width="2.5" fill="none" opacity=".4" stroke-linecap="round"/>')
    nail = (f'<rect x="{L*0.75:.1f}" y="{-wt*0.33:.1f}" width="{L*0.22:.1f}" height="{wt*0.66:.1f}" rx="{wt*0.3:.1f}" fill="#f8dccb" stroke="#e0ad94" stroke-width="2"/>'
            f'<path d="M{L*0.77:.1f} {-wt*0.2:.1f} C{L*0.79:.1f} {-wt*0.05:.1f} {L*0.79:.1f} {wt*0.05:.1f} {L*0.77:.1f} {wt*0.2:.1f}" stroke="#fff" stroke-width="3" opacity=".7" fill="none"/>'
            f'<path d="M{L*0.8:.1f} {-wt*0.24:.1f} L{L*0.92:.1f} {-wt*0.24:.1f}" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>')
    return (f'<g transform="translate({bx} {by}) rotate({ang})"><path d="{body}" fill="#f4aa86"/>'
            f'<path d="M{L*0.05:.1f} {w/2-3:.1f} C{L*0.4:.1f} {w/2-2:.1f} {L*0.7:.1f} {wt/2-2:.1f} {L-r:.1f} {wt/2-2:.1f}" stroke="#c4835f" stroke-width="5" opacity=".3" fill="none"/>'
            f'<path d="M{L*0.08:.1f} {-w/2+6:.1f} C{L*0.4:.1f} {-w/2+5:.1f} {L*0.65:.1f} {-wt/2+5:.1f} {L*0.85:.1f} {-wt/2+5:.1f}" stroke="#fff" stroke-width="5" opacity=".22" fill="none" stroke-linecap="round"/>'
            f'{crease(L*0.42, 0.33)}{crease(L*0.68, 0.28)}{nail}{extra}</g>')


FINGERS = ((910, 434, 122, 40, -5), (916, 478, 136, 42, 0), (912, 522, 124, 39, 5), (900, 562, 96, 33, 11))


def forearm_dorsal():
    """Forearm from the left edge to the wrist at x 760, tapering, with muscle contour and shading."""
    return '''
    <path d="M-60 350 C60 340 200 344 330 360 C470 378 620 400 760 424 L760 592 C620 604 470 616 330 630 C200 642 60 650 -60 654 Z" fill="url(#gForearm)"/>
    <path d="M80 356 C220 352 360 368 520 392" stroke="#fff" stroke-width="18" opacity=".16" fill="none" stroke-linecap="round"/>
    <path d="M-40 640 C200 628 480 608 740 588" stroke="#b06a50" stroke-width="14" opacity=".28" fill="none"/>
    <path d="M300 372 C380 388 460 406 560 420" stroke="#d99d7a" stroke-width="8" opacity=".25" fill="none" stroke-linecap="round"/>
    <ellipse cx="742" cy="584" rx="16" ry="9" fill="#fff" opacity=".2"/>'''


def hand_dorsal():
    """Back of the left hand, fingers to the right, thumb on the top (radial) side; wrist at x 760.
    The ring finger carries the ring (#ringW > #ring) so it can slide off along the finger."""
    ring_tpl = ('<g id="ringW"><g id="ring"><rect x="{x:.1f}" y="-24" width="18" height="48" rx="6" fill="url(#gGold)"/>'
                '<rect x="{x2:.1f}" y="-20" width="5" height="40" rx="2" fill="#fff8d0" opacity=".85"/></g></g>')
    fingers = ""
    for i, (bx, by, L, w, a) in enumerate(FINGERS):
        extra = ring_tpl.format(x=L * 0.22, x2=L * 0.22 + 4) if i == 2 else ""
        fingers += finger(bx, by, L, w, a, extra)
    tendons = "".join(
        f'<path d="M772 {478+i*18} C820 {470+i*20} {bx-60} {by} {bx-12} {by}" stroke="#fde4cf" stroke-width="7" opacity=".22" fill="none" stroke-linecap="round"/>'
        f'<path d="M772 {486+i*18} C820 {478+i*20} {bx-60} {by+8} {bx-12} {by+8}" stroke="#c98b68" stroke-width="3" opacity=".14" fill="none"/>'
        for i, (bx, by, L, w, a) in enumerate(FINGERS))
    knuckles = "".join(
        f'<ellipse cx="{bx-4}" cy="{by-3}" rx="13" ry="9" fill="#fff" opacity=".16"/>'
        for bx, by, L, w, a in FINGERS)
    thumb = finger(828, 428, 122, 48, -34)
    return (thumb
            + '<path d="M770 436 C790 410 822 398 852 404 C870 410 878 426 876 440 Z" fill="#f4aa86"/>'
            + '<path d="M752 426 C790 420 850 410 902 412 C920 414 932 430 934 452 C938 500 936 540 928 566 C922 584 906 592 882 594 C832 598 792 596 752 592 Z" fill="#f4aa86"/>'
            + tendons + knuckles
            + '<path d="M760 588 C820 594 880 592 926 572" stroke="#bb7a58" stroke-width="7" opacity=".3" fill="none"/>'
            + fingers)


def kitchen_arm():
    """Reaching arm in a sweater sleeve: upper arm, bent elbow, forearm, ribbed cuff, and a hand gripping the pan handle."""
    return '''
    <path d="M262 626 C266 600 290 590 318 592 C390 590 460 592 524 600 L530 678 C450 690 380 698 330 704 C296 704 268 682 262 652 Z" fill="url(#gSweater)"/>
    <path d="M268 640 C276 612 300 602 326 604" stroke="#ffd27a" stroke-width="6" opacity=".3" fill="none" stroke-linecap="round"/>
    <path d="M512 598 C600 584 700 572 784 564 L796 622 C700 632 610 650 530 680 C516 652 510 624 512 598 Z" fill="url(#gSweater)"/>
    <path d="M340 616 C400 606 460 604 510 606 M352 684 C420 674 470 668 516 664" stroke="#a96d1a" stroke-width="5" opacity=".55" fill="none"/>
    <path d="M508 606 C520 628 524 652 520 672 M494 612 C506 634 508 652 504 668" stroke="#9a5f12" stroke-width="6" opacity=".6" fill="none" stroke-linecap="round"/>
    <path d="M560 604 C640 594 710 586 770 580 M570 650 C650 636 720 628 780 620" stroke="#a96d1a" stroke-width="5" opacity=".5" fill="none"/>
    <path d="M770 562 C780 560 796 560 806 562 L814 624 C804 628 790 628 782 626 Z" fill="#c48218"/>
    <path d="M782 566 L790 624 M792 564 L800 625 M802 563 L808 624" stroke="#9a5f12" stroke-width="3" opacity=".6"/>
    <path d="M808 570 C842 556 878 550 904 554 C918 557 922 572 916 584 C904 600 878 610 846 616 C832 618 818 620 808 618 Z" fill="url(#gSkinA)"/>
    <path d="M828 580 C856 572 880 566 900 566" stroke="#c48766" stroke-width="4" opacity=".5" fill="none"/>
    <path d="M884 548 C900 538 926 534 946 538 C952 542 950 550 942 552 C924 552 904 556 890 560 Z" fill="url(#gSkinA)"/>
    <path d="M938 538 L948 541" stroke="#e0ad94" stroke-width="5" stroke-linecap="round"/>
    <path d="M904 556 C922 552 940 556 944 568 C946 578 938 584 928 582 C920 576 912 572 904 572 Z" fill="url(#gSkinA)"/>
    <path d="M906 572 C924 570 940 576 942 588 C942 598 932 602 924 598 C918 590 912 588 906 588 Z" fill="url(#gSkinA)"/>
    <path d="M904 588 C920 588 934 594 934 604 C932 612 922 614 916 610 C912 604 908 602 902 602 Z" fill="url(#gSkinA)"/>
    <path d="M898 600 C910 602 920 608 918 616 C914 622 906 622 902 618 Z" fill="url(#gSkinA)"/>
    <path d="M928 570 C934 574 936 580 934 584 M922 588 C928 592 930 598 928 600" stroke="#c48766" stroke-width="3" opacity=".6" fill="none"/>'''


def kitchen_torso():
    return '''
    <path d="M40 1000 C30 860 60 740 120 690 C170 650 240 632 300 636 C350 640 392 668 412 720 C430 780 436 880 436 1000 Z" fill="url(#gSweater)"/>
    <path d="M300 640 C330 660 352 700 360 760 M120 700 C110 760 104 840 102 1000" stroke="#a96d1a" stroke-width="7" opacity=".45" fill="none" stroke-linecap="round"/>
    <path d="M160 664 C210 646 260 640 300 642" stroke="#ffd27a" stroke-width="8" opacity=".35" fill="none" stroke-linecap="round"/>'''
