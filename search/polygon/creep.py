#!/usr/bin/python3

from django.contrib.gis.geos import Polygon, Point
import numpy as np
import math as m


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


def relv(a, b):
    """ Returns a relative vector, b-a"""
    return [v - a[i] for i, v in enumerate(b)]


def corner_relv(a, b, c):
    """ Takes 3 points a, b and c and returns
         u = b - a
         v = c - b """
    return [relv(a, b), relv(b, c)]


def decomp(lrng):
    """Decompose an arbitrary linear ring into a set of convex linear rings."""
    for pt1 in concave_points(lrng):
        for pt0 in convex_points(lrng):
            if cansee(pt0, pt1, lrng):
                pass


def concave_points(lrng):
    " Takes a linear ring and returns all concave/reflex points in the ring"
    for pt in lrng:
        pass
    return pt


def convex_points(lrng):
    " Takes a linear ring and returns all convex points"


def cansee(pt0, pt1, lrng):
    """ Returns true if a line can be drawn,
    from pt0 to pt1 without crossing any lines in lrng"""
