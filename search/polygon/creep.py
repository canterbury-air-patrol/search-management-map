#!/usr/bin/python3

from django.contrib.gis.geos import Polygon, Point
import numpy as np
import math

# Pseudocode
# def decomp(poly):
#     "Decompose a concave polygon into a convex"
#     for i in reflex(poly):
#         for j in other(poly):
#             if cansee(i,j, lrng):
#                 left = subpoly(i,j,poly)
#                 right = subpoly(j,i,poly)
#                 tmp = decomp(left) + decomp(right)
#                 if (tmp.size < ndiags):
#                     min = tmp
#                     ndiags = tmp.size
#                     min += newpoly(i,j)
#     return min


def pt_relv(a, b):
    """ Returns a relative vector, b-a"""
    return [v - a[i] for i, v in enumerate(b)]


def pt_corner_relv(a, b, c):
    """ Takes 3 points a, b and c and returns
         u = b - a
         v = c - b """
    return [pt_relv(a, b),
            pt_relv(b, c)]


def vec_cosine_rule(u, v):
    """Returns the cosine angle between two vectors
    Where,
    cos(theta) = u . v / mag(u) / mag(v)"""
    norm = np.linalg.norm
    dot = np.dot
    acos = math.acos
    return acos(dot(u, v)/norm(u)/norm(v))


def lrng_concave_points(lrng):
    """ Takes a linear ring and
    returns all concave/reflex points in the ring """
    lcross = lrng_cross(lrng)
    cw = sum(1 for i in lcross if i < 0)
    acw = sum(1 for i in lcross if i > 0)
    zeros = sum(1 for i in lcross if i == 0)

    # The number of concave points will always be
    # smaller or equal than the number of convex points

    # Case 1: Concave points are acw, or both
    if cw >= acw:
        return [lrng[i]
                for i, cp in enumerate(lcross)
                if cp > 0 ]

    # Alternative: Concave points are cw
    else:
        return [lrng[i]
                for i, cp in enumerate(lcross)
                if cp < 0]


def lrng_cross(lrng):
    """Returns the cross product of every corner
        """
    dirl = list()

    # Ignore last element (duplicate)
    lr = [pt for pt in lrng]
    lr.pop()

    for i, pt in enumerate(lr):
        p0 = lr[i-2]
        p1 = lr[i-1]
        p2 = pt
        dirl.append(
            np.cross(
                *pt_corner_relv(p0, p1, p2)
            )
        )
    dirl.append(dirl.pop(0))
    return [float(x) for x in dirl]


def decomp(lrng):
    """Decompose an arbitrary linear ring into a set of convex linear rings."""
    for pt1 in concave_points(lrng):
        for pt0 in convex_points(lrng):
            if cansee(pt0, pt1, lrng):
                pass


def convex_points(lrng):
    " Takes a linear ring and returns all convex points"


def cansee(pt0, pt1, lrng):
    """ Returns true if a line can be drawn,
    from pt0 to pt1 without crossing any lines in lrng"""
