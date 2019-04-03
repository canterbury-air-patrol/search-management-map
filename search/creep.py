#!/usr/bin/python3

from django.contrib.gis.geos import Polygon, Point

# Pseudocode
# def decomp(poly):
#     "Decompose a concave polygon into a convex"
#     for i in reflex(poly):
#         for j in other(poly):
#             if cansee(i,j):
#                 left = subpoly(i,j,poly)
#                 right = subpoly(j,i,poly)
#                 tmp = decomp(left) + decomp(right)
#                 if (tmp.size < ndiags):
#                     min = tmp
#                     ndiags = tmp.size
#                     min += newpoly(i,j)
#     return min


def reflex(lrng):
    " Takes a linear ring and returns all reflex points"
    for pt in lrng:
        pass
    return pt
