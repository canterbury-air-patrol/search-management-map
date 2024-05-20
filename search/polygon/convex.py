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
    """
    Returns the cross product of every corner
    """
    # pylint: disable=R1734
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
    min_convex = None
    ndiags = 0
    concave_points = lrng_concave_points(lrng)
    convex_points = lrng_convex_points(lrng)

    for pt1 in concave_points:
        for pt0 in convex_points:
            if cansee(pt0, pt1, lrng):
                # pylint: disable=W1114
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
                        yield from i
                    else:
                        reverse = True
                        yield from i
            except TypeError:
                # pylint: disable=W0707
                msg = f"{i} is of type {type(i)}"
                raise TypeError(msg)

    yiter = step(ymin, ydist, ymax)
    liter = stripe(xmin, xmax, yiter)
    pts = list(carve(lrng, liter))

    return LineString(pts)


def skew_lonlat(skew_point, tol=1, unit=Unit.METERS, inverse=False):
    """ Obtain the lonlat skew at the skew_point coord at lon, lat

    That is the ratio of distance/degree for longitude and latitude
    ( as a particular point, referred to as the skew_point )
    inverse=True, will provide a d_a to reverse the conversion."""
    # Obtain initial point
    g_x = skew_point[0]
    g_y = skew_point[1]

    # Interpolate points for x-0.5, x+0.5
    pt_minus_half_x = Point(g_x - 0.5 * tol, g_y, srid=4326)
    pt_minus_half_y = Point(g_x, g_y - 0.5 * tol, srid=4326)
    pt_plus_half_x = Point(g_x + 0.5 * tol, g_y, srid=4326)
    pt_plus_half_y = Point(g_x, g_y + 0.5 * tol, srid=4326)

    # Obtain distance between points (use first point as reference)
    d_x = haversine_wrapper(pt_minus_half_x, pt_plus_half_x, unit=unit) / tol
    d_y = haversine_wrapper(pt_minus_half_y, pt_plus_half_y, unit=unit) / tol
    aspect_ratio = [d_x, d_y]

    if inverse:
        return [1 / c for c in aspect_ratio]

    return aspect_ratio

def haversine_wrapper(pt1, pt2, unit):
    """
    Wrapper around haversine to correct the lat/lon ordering of points
    """
    return haversine(
        haversine_point_wrapper(pt1),
        haversine_point_wrapper(pt2),
        unit
        )

def haversine_point_wrapper(point):
    """
    Wrapper for haversine points to correct the lat/lon ordering
    """
    if point.srid == 4326:
        return (point[1], point[0])
    return point

def skew_by_ratio(ratio, pt_array):
    """ Skew a List of Points by a ratio [ dx, dy ]

    Useful for converting from lonlat to meters and vice-versa.
    Assumes the absolute position is not relevant.

    For example:
    r_a = skew_lonlat(lrng[0], tol=1, unit=Unit.METERS)
    meters_array = skew_by_ratio(r_a, lonlat_array)

    r_i = skew_lonlat(lrng[0]. tol=1, unit=Unit.METERS, inverse=True)
    lonlat_array = skew_by_ratio(r_i, meters_array)

    """

    return [[ratio[i] * coord
             for i, coord in enumerate(pt)]
            for pt in pt_array]


def conv_lonlat_to_meters(geometry, skew_point=None):
    """ Converts a lonlat Geometry to a meters Geometry """
    # Obtain skew_point if not set (first point in geometry)
    if isinstance(skew_point, type(None)):
        skew_point = geometry[0]

    # Obtain skew and conversion for lonlat to meters
    lonlat_to_meters = skew_lonlat(skew_point, tol=1, unit=Unit.METERS)

    # Create a Geometry with "normalized coords" in meters
    geometry_in_meters = geometry.__class__(
        skew_by_ratio(lonlat_to_meters, geometry))

    return geometry_in_meters


def conv_meters_to_lonlat(geometry, skew_point):
    """ Converts a meters LinearString to a lonlat LinearString

    A skew point is required for converting meters back to lonlat."""

    # Obtain skew and conversion for lonlat to meters
    meters_to_lonlat = skew_lonlat(skew_point,
                                   tol=1,
                                   unit=Unit.METERS,
                                   inverse=True)

    # Create a Geometry with "normalized coords" in meters
    geometry_in_lonlat = geometry.__class__(
        skew_by_ratio(meters_to_lonlat, geometry))

    return geometry_in_lonlat


def creep_line_lonlat(lrng_lonlat, width_meters):
    """ Returns a LineString creeping path across a lon/lat set of points"""
    skew_point = lrng_lonlat[0]
    lrng_meters = conv_lonlat_to_meters(lrng_lonlat, skew_point=skew_point)

    # Create a creeping line search using "normalized coords"
    line_meters = creep_line(lrng_meters, width_meters)

    # Convert back to regular lon / lat
    return conv_meters_to_lonlat(line_meters, skew_point=skew_point)


def perimeter_subarray(pts, pt_arr):
    """ Subarray iterator between pts in a pt_array """

    # Find index of all points in pt_array
    pts_idx = [pt_arr.index(pt) for pt in pts]

    # Sort indices
    pts_idx.sort()

    # Construct LineString for each segment
    for count, index1 in enumerate(pts_idx):
        index0 = pts_idx[count-1]

        # Yield linestring which wraps over the end
        if count == 0:
            yield pt_arr[index0:] + pt_arr[:index1+1]
            continue

        # Yield typical linestring segments
        yield pt_arr[index0:index1+1]


def creep_line_concave(lrng, width):
    """ Return a LineString creeping path across all convex polygons in a
    concave polygon"""
    # Decompose LinearRing into several convex LinearRings
    #pylint: disable=R1721
    lrngs_convex = decomp(LinearRing([pt for pt in lrng]))

    # Create creeping line (LineString) for each convex LinearRing
    creep_lines = [creep_line(lr, width) for lr in lrngs_convex]

    # Create a list of points for each creeping line start and end points
    creep_line_start_points = [lr[0] for lr in lrngs_convex]
    creep_line_end_points = [lr[-2] for lr in lrngs_convex]

    # Create a pool of end points
    remaining_points = (creep_line_end_points +
                                    creep_line_start_points)

    # Initialize order of creep lines with the first end point
    i = 0
    current_segment = [creep_line_start_points.pop(i), creep_line_end_points.pop(i)]
    # pylint: disable=R1734
    creep_lines_ordered = list()
    creep_lines_ordered.append(creep_lines.pop(i))

    # Continue to append the closest end points and creep lines together
    # Append LineStrings connecting the creep lines together
    while len(remaining_points) > 2:
        found_point = False

        # Remove next start point (if it exists in list)
        remaining_points.remove(current_segment[0])

        # Find first pt_arr segment that includes current segment
        for pt_arr in perimeter_subarray(
                remaining_points, [tuple(p) for p in lrng][:-1]):

            # Find a segment that connects to the end point
            # But does not pass through the starting point
            if current_segment[1] in pt_arr:
                if current_segment[1] == pt_arr[0]:
                    found_point = True
                    break
                if current_segment[1] == pt_arr[-1]:
                    pt_arr.reverse()
                    found_point = True
                    break

        # Raise an error if no such point was found
        if not found_point:
            msg = "Could not find next point!\n"
            msg += f"current_segment: {current_segment}\n"
            msg += f"remaining_points: {remaining_points}\n"
            raise ValueError(msg)

        # Add joining line to next creep line
        # pylint: disable=W0631
        if len(pt_arr) > 1:
            creep_lines_ordered.append(LineString(pt_arr))

        # Remove end point
        remaining_points.remove(current_segment[1])

        # New segment (last point on pt_arr)
        next_start_point = pt_arr[-1]
        if next_start_point in creep_line_start_points:
            i = creep_line_start_points.index(next_start_point)
            current_segment = [creep_line_start_points.pop(i),
                               creep_line_end_points.pop(i)]
        elif next_start_point in creep_line_end_points:
            i = creep_line_end_points.index(next_start_point)
            # Reverse order (starting at end and working back)
            creep_lines[i].reverse()
            current_segment = [creep_line_end_points.pop(i),
                               creep_line_start_points.pop(i)]

        # Add next creep line
        creep_lines_ordered.append(creep_lines.pop(i))

    return LineString([p
                       for l in creep_lines_ordered
                       for p in l])
