#!/usr/bin/python3

import unittest
from django.contrib.gis.geos import Polygon, LinearRing, Point
import creep as c

print(Point(10,1))

class Test_Creep(unittest.TestCase):
    """ Tests creep paths  """
    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_subpoly(self):
        " Tests subpoly returns new subset polygon"
        self.assertFalse(True)

    def test_decomp(self):
        " Test polygon is decomposed into multiple smaller polygons"
        self.assertFalse(True)

    def test_reflex(self):
        " Test reflex returns points with reflex angle in polygon"

        # Plain square (no reflex points)
        lrng0 = LinearRing((
            (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        # Square with a notch (1 reflex point)
        lrng1 = LinearRing((
            (0, 0), (0, 2), (4, 2), (4, 0),
            (3, 0), (2, 1), (1, 0), (0, 0)))

        self.assertEqual(c.reflex(lrng0), list())
        self.assertEqual(c.reflex(lrng1), [(2, 1)])
