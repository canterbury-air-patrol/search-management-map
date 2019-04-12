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

        self.assertEqual(relv(a,b),
                         [1,0])

        c = Point(0, 1)
        self.assertEqual(relv(b,c),
                         [-1,1])

    def test_corner_relv(self):
        """ Tests conversion of points to relative vector """
        a = Point(0,0)
        b = Point(1,0)
        c = Point(0,1)

        u, v = corner_relv(a, b, c)

        u_exp = [1, 0]
        v_exp = [-1, 0]

        self.assertEqual(u, u_exp)
        self.assertEqual(v, v_exp)

    # def test_subpoly(self):
    #     " Tests subpoly returns new subset polygon"
    #     self.assertFalse(True)

    # def test_decomp(self):
    #     " Test polygon is decomposed into multiple smaller polygons"
    #     self.assertFalse(True)

    # def test_concave_points(self):
    #     " Test concave points are returned from linear ring."

    #     # Plain square (no reflex points)
    #     lrng0 = LinearRing((
    #         (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

    #     # Square with a notch (1 reflex point @ (2,1))
    #     lrng1 = LinearRing((
    #         (0, 0), (0, 2), (4, 2), (4, 0),
    #         (3, 0), (2, 1), (1, 0), (0, 0)))

    #     self.assertEqual(c.concave_points(lrng0), list())
    #     self.assertEqual(c.concave_points(lrng1), [(2, 1)])

    # def test_subtract_points(self):

    #     pt0 = Point(10,1)
    #     pt1 = Point(1,10)
    #     pt2 = Point(-9,9)
    #     print(pt0)
    #     print(pt1 - pt0)
    #     print(pt2)
    #     self.assertTrue(pt2.equals(pt1 - pt0))
