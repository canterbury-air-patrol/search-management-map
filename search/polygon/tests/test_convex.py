#!/usr/bin/python3

import unittest
from django.contrib.gis.geos import Polygon, LinearRing, Point
from search.polygon.convex import *


class Test_Convex(unittest.TestCase):
    """ Test generation of convex linear ring from concave linear ring."""
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
        # Modified with a slight bump
        lrng0 = LinearRing((
            (0, 0), (-0.1, 0.5), (0, 1), (1, 1), (1, 0), (0, 0)))
        # Edge case,
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

        # Points next to each other
        pts1a = [(0, 0), (-0.1, 0.5)]

        self.assertFalse(cansee(*pts1a, lrng0))

        # Points as points
        pts2a = [Point((0,0)),
                 Point((-0.1, 0.5))]
        try:
            cansee(*pts2a, lrng0)
        except TypeError:
            self.fail(
                "cansee() raises TypeError for an array of Point objects!")

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

    def test_decomp(self):
        """ Test decomposes a LinearRing into multiple convex LinearRings."""
        # Plain square (no reflex points)
        lrng0 = LinearRing((
            (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        # Square with a notch (1 reflex point @ (2,1))
        lrng1 = LinearRing((
            (0, 0), (0, 2), (2, 2), (4, 2), (4, 0),
            (3, 0), (2, 1), (1, 0), (0, 0)))

        # Decomposing a convex linear ring
        # should produce an array of that linear ring only
        result0 = decomp(lrng0)
        self.assertEqual(result0[0], lrng0)
        self.assertEqual(len(result0), 1)

        # Decompose a square with a notch
        # Should produce two linear rings
        result1 = decomp(lrng1)
        self.assertEqual(len(result1), 2)

    def test_creep_line(self):
        """ Test creeping line generation over convex LinearRing. """
        # Plain square
        lrng0 = LinearRing((
            (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        # Creeping line @ same size as square
        lstr0a = creep_line(lrng0, 1)
        lstr0a_expected = LineString(
            (0, 0), (1, 0), (1, 1), (0, 1)
        )

        # Creeping line @ 1.1 spacing
        lstr0b = creep_line(lrng0, 1.1)
        lstr0b_expected = LineString(
            (0, 0), (1, 0), (1, 1), (0, 1)
        )

        # Triangle (half-square)
        lrng1 = LinearRing((
            (0, 0), (0, 1), (1, 1), (0, 0)))

        # Creeping line @ same size as square
        lstr1a = creep_line(lrng1, 1)
        lstr1a_expected = LineString(
            (0, 0), (0, 1), (1, 1)
        )

        self.assertEqual(lstr0a, lstr0a_expected)
        self.assertEqual(lstr0b, lstr0b_expected)
        self.assertEqual(lstr1a, lstr1a_expected)
