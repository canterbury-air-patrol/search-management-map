#!/usr/bin/python3

import unittest
from django.contrib.gis.geos import Polygon, LinearRing, Point
from search.polygon.creep import *


class Test_Creep(unittest.TestCase):
    """ Tests creeping path generation for a linear ring."""
    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_relv(self):
        """ Tests relative vector from two points """
        a = Point(0, 0)
        b = Point(1, 0)

        self.assertEqual(pt_relv(a,b),
                         [1,0])

        c = Point(0, 1)
        self.assertEqual(pt_relv(b,c),
                         [-1,1])

    def test_corner_relv(self):
        """ Tests conversion of points to relative vector """
        a = Point(0,0)
        b = Point(1,0)
        c = Point(0,1)

        u, v = pt_corner_relv(a, b, c)

        u_exp = [1, 0]
        v_exp = [-1, 1]

        self.assertEqual(u, u_exp)
        self.assertEqual(v, v_exp)

    def test_cosine_rule(self):
        """ Tests cosine rule """
        u1 = [1, 0]
        v1 = [0, 1]
        self.assertEqual(vec_cosine_rule(u1, v1), math.pi/2)

        u2 = [1, 0]
        v2 = [1, 1]
        self.assertAlmostEqual(vec_cosine_rule(u2, v2), math.pi/4)

    # def test_subpoly(self):
    #     " Tests subpoly returns new subset polygon"
    #     self.assertFalse(True)

    # def test_decomp(self):
    #     " Test polygon is decomposed into multiple smaller polygons"
    #     self.assertFalse(True)


    def test_cross(self):
        """ Test cross product of lrng method
        """
        # Plain square (no reflex points)
        lrng0 = LinearRing((
            (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        # Square with a notch (1 reflex point @ (2,1))
        lrng1 = LinearRing((
            (0, 0), (0, 2), (4, 2), (4, 0),
            (3, 0), (2, 1), (1, 0), (0, 0)))

        self.assertEqual(lrng_cross(lrng0),
                         [-1, -1, -1, -1])
        lrng0.reverse()
        self.assertEqual(lrng_cross(lrng0),
                         [1, 1, 1, 1])

        self.assertEqual(lrng_cross(lrng1),
                         [-2, -8, -8, -2, -1, 2, -1])
        lrng1.reverse()
        self.assertEqual(lrng_cross(lrng1),
                         [2, 1, -2, 1, 2, 8, 8])


    def test_concave_points(self):
        " Test concave points are returned from linear ring."

        # Plain square (no reflex points)
        lrng0 = LinearRing((
            (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        # Square with a notch (1 reflex point @ (2,1))
        lrng1 = LinearRing((
            (0, 0), (0, 2), (4, 2), (4, 0),
            (3, 0), (2, 1), (1, 0), (0, 0)))

        self.assertEqual(lrng_concave_points(lrng0), list())
        self.assertEqual(lrng_concave_points(lrng1), [(2, 1)])

    def test_convex_points(self):
        " Test convex points are returned from linear ring."

        # Plain square (no reflex points)
        lrng0 = LinearRing((
            (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        # Square with a notch (1 reflex point @ (2,1))
        lrng1 = LinearRing((
            (0, 0), (0, 2), (4, 2), (4, 0),
            (3, 0), (2, 1), (1, 0), (0, 0)))

        self.assertEqual(lrng_convex_points(lrng0),
                         [(0, 0), (0, 1), (1, 1), (1, 0)])
        self.assertEqual(lrng_convex_points(lrng1),
                         [(0, 0), (0, 2), (4, 2), (4, 0),
                          (3, 0), (1, 0)])

    def test_cansee(self):
        """ Test cansee returns whether a line can be drawn
        between points, pt0 and pt1
        without crossing the LinearRing, lrng """

        # Plain square (no reflex points)
        lrng0 = LinearRing((
            (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        # Edge case
        pts0a = [(0, 0), (0, 1)]
        # Cross to center (from edge)
        pts0b = [(0.5, 0), (0.5, 0.5)]
        # Cross to center (from outside)
        pts0c = [(0.5, -1), (0.5, 0.5)]
        # Cross outside to outside
        pts0d = [(0.5, -1), (0.5, 2)]

        self.assertTrue(cansee(*pts0a, lrng0))
        self.assertFalse(cansee(*pts0b, lrng0))
        self.assertFalse(cansee(*pts0c, lrng0))
        self.assertFalse(cansee(*pts0d, lrng0))

    def test_sublrng(self):
        """Test sublrng returns a subset of lnrg """

        # Plain square (no reflex points)
        lrng0 = LinearRing((
            (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        pt0 = (0, 0)
        pt1 = (0, 1)
        pt2 = (1, 1)
        pt3 = (1, 0)

        # Return lrng from pt0 to pt2, (inclusive)
        self.assertEqual(sublrng(pt0, pt2, lrng0),
                         LinearRing((pt0, pt1, pt2, pt0)))
        # Return lrng from pt0 to pt3, (=lrng0)
        self.assertEqual(sublrng(pt0, pt3, lrng0), lrng0)
        # Return lrng from pt1 to pt0,
        # (=lrng0, but starts at pt1 now)
        A = sublrng(pt2, pt1, lrng0)
        B = LinearRing((pt2, pt3, pt0, pt1, pt2))
        self.assertEqual(A, B)