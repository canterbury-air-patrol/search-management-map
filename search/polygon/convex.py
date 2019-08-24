#!/usr/bin/python3
"""
Functions for convex polygons

- Decompose a concave polygon into multiple convex polygons (decomp)
- Generate a creeping line search over a convex polygon (creep_line)
"""
import math
from django.contrib.gis.geos import Point, LineString, LinearRing
import numpy as np
from haversine import haversine, Unit


def pt_relv(pt_a, pt_b):
    """ Returns a relative vector, pt_b-pt_a"""
    return [v - pt_a[i] for i, v in enumerate(pt_b)]


def pt_corner_relv(pt_a, pt_b, pt_c):
    """ Takes 3 points pt_a, pt_b and pt_c and returns
         u = pt_b - pt_a
         v = pt_c - pt_b """
    return [pt_relv(pt_a, pt_b),
            pt_relv(pt_b, pt_c)]


def vec_cosine_rule(vec_u, vec_v):
    """Returns the cosine angle between two vectors
    Where,
    cos(theta) = u . v / mag(u) / mag(v)"""
    norm = np.linalg.norm
    dot = np.dot
    acos = math.acos
    return acos(dot(vec_u, vec_v)/norm(vec_u)/norm(vec_v))


def lrng_concave_points(lrng):
    """ Takes a linear ring and
    returns all concave/reflex points in the ring """
    lcross = lrng_cross(lrng)
    cws = sum(1 for i in lcross if i < 0)
    acw = sum(1 for i in lcross if i > 0)
    # zeros = sum(1 for i in lcross if i == 0)

    # The number of concave points will always be
    # smaller or equal than the number of convex points

    # Case 1: Concave points are acw, or both
    if cws >= acw:
        return [lrng[i]
                for i, cp in enumerate(lcross)
                if cp > 0]

    # Alternative: Concave points are cws (clockwise)
    return [lrng[i]
            for i, cp in enumerate(lcross)
            if cp < 0]


def lrng_cross(lrng):
    """Returns the cross product of every corner
        """
    dirl = list()

    # Ignore last element (duplicate)
    lrng_1 = [np.float64(pt) for pt in lrng]
    lrng_1.pop()

    for i, val in enumerate(lrng_1):
        pt_0 = lrng_1[i-2]
        pt_1 = lrng_1[i-1]
        pt_2 = val
        dirl.append(
            np.cross(
                *pt_corner_relv(pt_0, pt_1, pt_2)
            )
        )
    dirl.append(dirl.pop(0))
    return [np.float64(x) for x in dirl]


def decomp(lrng):
    """Decompose an arbitrary linear ring into a set of convex linear rings."""
    ndiags = 0
    concave_points = lrng_concave_points(lrng)
    convex_points = lrng_convex_points(lrng)

    for pt1 in concave_points:
        for pt0 in convex_points:
            if cansee(pt0, pt1, lrng):
                left = sublrng(pt0, pt1, lrng)
                right = sublrng(pt1, pt0, lrng)
                tmp = decomp(left) + decomp(right)
                if (len(tmp) < ndiags or ndiags == 0):
                    min_convex = tmp
                    ndiags = len(tmp)

    if concave_points:
        return min_convex
    return [lrng]


def lrng_convex_points(lrng):
    " Takes a linear ring and returns all convex points"
    concave_points = lrng_concave_points(lrng)
    convex_points = [pt
                     for pt in lrng
                     if pt not in concave_points]
    convex_points.pop()
    return convex_points


def cansee(pt0, pt1, lrng):
    """ Returns true if a line can be drawn
    from pt0 to pt1 without crossing any lines in lrng.
    pt0 and pt1 must also be across and NOT next to each other."""
    if not isinstance(pt0, Point):
        pt0 = Point(pt0)
    if not isinstance(pt1, Point):
        pt1 = Point(pt1)

    line = LineString(pt0, pt1)

    intersect = list(lrng.intersection(line))
    while pt0 in intersect:
        intersect.remove(pt0)

    while pt1 in intersect:
        intersect.remove(pt1)

    if intersect:
        return False
    return True


def sublrng(pt0, pt1, lrng):
    """ Returns a LinearRing subset of lrng.
    pt0 = starting point,
    pt1 = ending point,
    lrng = original linear ring"""

    idx0 = lrng.index(pt0)
    idx1 = lrng.index(pt1)

    if idx1 > idx0:
        return LinearRing(
            lrng[idx0:idx1+1] + [pt0])

    return LinearRing(lrng[idx0:-1] + lrng[:idx1+1] + [pt0])


def creep_line(lrng, width):
    """ Return a LineString which represents
    a creeping path through a convex LinearRing """
    xmin, ymin, xmax, ymax = lrng.extent
    # xdist = xmax - xmin
    ydist = width

    def step(yin, space, ymax):
        """ Generates ycoord spaced over interval"""
        while yin < ymax:
            yield yin
            yin = yin + space
        yield ymax

    def stripe(xmin, xmax, yiter):
        """ Generates LineStrings spaced over yiter"""
        for yin in yiter:
            yield LineString((xmin, yin), (xmax, yin))

    def carve(lrng, liter):
        """
        Generates a list of points that intersect with lrng
        """
        reverse = False
        for lstr in liter:
            i = lrng.intersection(lstr)
            i.normalize()
            try:
                if isinstance(i, Point):
                    yield i

                else:
                    # Presumably iterable
                    iter(i)
                    if reverse:
                        reverse = False
                        i.reverse()
                        for pnt in i:
                            yield pnt
                    else:
                        reverse = True
                        for pnt in i:
                            yield pnt
            except TypeError:
                msg = "{} is of type {}".format(i, type(i))
                raise TypeError(msg)

    yiter = [y for y in step(ymin, ydist, ymax)]
    liter = [l for l in stripe(xmin, xmax, yiter)]
    pts = [p for p in carve(lrng, liter)]

    return LineString(pts)


def skew_lonlat(lonlat, tol=1, unit=Unit.METERS):
    """ Obtain the lonlat skew at coord at lon, lat

    That is the ratio of distance/degree for longitude and latitude"""
    # Obtain initial point
    g_x = lonlat[0]
    g_y = lonlat[1]

    # Interpolate points for x-0.5, x+0.5
    pt_minus_half_x = Point(g_x - 0.5 * tol, g_y, srid=4326)
    pt_minus_half_y = Point(g_x, g_y - 0.5 * tol, srid=4326)
    pt_plus_half_x = Point(g_x + 0.5 * tol, g_y, srid=4326)
    pt_plus_half_y = Point(g_x, g_y + 0.5 * tol, srid=4326)

    # Obtain distance between points (use first point as reference)
    d_x = haversine(pt_minus_half_x, pt_plus_half_x, unit=unit) / tol
    d_y = haversine(pt_minus_half_y, pt_plus_half_y, unit=unit) / tol
    d_a = [d_x, d_y]

    return d_a


def creep_line_lonlat(lrng, width):
    """ Returns a LineString creeping path across a lon/lat set of points"""
    # ASSUMPTION: To convert to meters:  lon, lat
    # Use haversine formula to calculate average lon/lat per meter
    # Only calculate for the first point
    # Assume distance is the same between all other local points (same polygon)

    # Obtain initial point and differences
    pt0 = lrng[0]
    g_x = pt0[0]
    g_y = pt0[1]
    pt_plus1x = Point(g_x + 1, g_y, srid=4326)
    pt_plus1y = Point(g_x, g_y + 1, srid=4326)

    # Obtain distance between points (use first point as reference)
    d_x = haversine(pt0, pt_plus1x, unit=Unit.METERS)
    d_y = haversine(pt0, pt_plus1y, unit=Unit.METERS)
    d_a = [d_x, d_y]

    # Create a LinearRing with "normalized coords"
    lrng1 = LinearRing([
        [d_a[i] * coord for i, coord in enumerate(pt)]
        for pt in lrng])

    # Create a creeping line search using "normalized coords"
    line1 = creep_line(lrng1, width)

    # Convert back to regular lon / lat
    return LineString([
        [coord / d_a[i] for i, coord in enumerate(pt)]
        for pt in line1])


def creep_line_concave(lrng, width):
    """ Return a LineString creeping path across all convex polygons in a
    concave polygon"""
    lrngs_convex = decomp(LinearRing([pt for pt in lrng]))
    return LineString([p
                       for l in [creep_line_lonlat(lr, width)
                                 for lr in lrngs_convex]
                       for p in l])


def creep_line_at_angle(lrng, width, angle):
    """ Returns a LineString creeping path at a set angle
    across a LinearRing"""
    pass
