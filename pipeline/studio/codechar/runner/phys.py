"""Centre of mass and ground contact for the runner rig (segment masses from Winter's anthropometric table)."""
import numpy as np
SEG = [('body', 0.497, 0.5), ('head', 0.081, 0.5),
       ('n_up', 0.028, 0.436), ('n_lo', 0.016, 0.43), ('n_hand', 0.006, 0.5),
       ('f_up', 0.028, 0.436), ('f_lo', 0.016, 0.43), ('f_hand', 0.006, 0.5),
       ('n_th', 0.100, 0.433), ('n_sh', 0.0465, 0.433), ('n_ft', 0.0145, 0.5),
       ('f_th', 0.100, 0.433), ('f_sh', 0.0465, 0.433), ('f_ft', 0.0145, 0.5)]


def com(rig, W):
    tot, acc = 0.0, np.zeros(2)
    for n, m, k in SEG:
        a, b = rig.joint(W, n), rig.tail(W, n)
        acc += m * (a + k * (b - a)); tot += m
    return acc / tot
