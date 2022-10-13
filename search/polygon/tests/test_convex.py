#!/usr/bin/python3
"""
UnitTests for Convex Polygon module
"""

import unittest
import math
from django.contrib.gis.geos import LineString, LinearRing, Point
from search.polygon.convex import (pt_relv,
                                   pt_corner_relv,
                                   vec_cosine_rule,
                                   lrng_cross,
                                   lrng_concave_points,
                                   lrng_convex_points,
                                   cansee,
                                   sublrng,
                                   decomp,
                                   creep_line,
                                   perimeter_subarray,
                                   creep_line_concave,
                                   conv_lonlat_to_meters)


class TestConvex(unittest.TestCase):
    """ Test generation of convex linear ring from concave linear ring."""
    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_relv(self):
        """ Tests relative vector from two points """
        aaa = Point(0, 0)
        bbb = Point(1, 0)

        self.assertEqual(pt_relv(aaa, bbb),
                         [1, 0])

        ccc = Point(0, 1)
        self.assertEqual(pt_relv(bbb, ccc),
                         [-1, 1])

    def test_corner_relv(self):
        """ Tests conversion of points to relative vector """
        aaa = Point(0, 0)
        bbb = Point(1, 0)
        ccc = Point(0, 1)

        uuu, vvv = pt_corner_relv(aaa, bbb, ccc)

        uuu_exp = [1, 0]
        vvv_exp = [-1, 1]

        self.assertEqual(uuu, uuu_exp)
        self.assertEqual(vvv, vvv_exp)

    def test_cosine_rule(self):
        """ Tests cosine rule """
        uuu1 = [1, 0]
        vvv1 = [0, 1]
        self.assertEqual(vec_cosine_rule(uuu1, vvv1), math.pi/2)

        uuu2 = [1, 0]
        vvv2 = [1, 1]
        self.assertAlmostEqual(vec_cosine_rule(uuu2, vvv2), math.pi/4)

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

        # Square with aaa notch (1 reflex point @ (2,1))
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

        # Square with aaa notch (1 reflex point @ (2,1))
        lrng1 = LinearRing((
            (0, 0), (0, 2), (4, 2), (4, 0),
            (3, 0), (2, 1), (1, 0), (0, 0)))

        # pylint: disable=R1734
        self.assertEqual(lrng_concave_points(lrng0), list())
        self.assertEqual(lrng_concave_points(lrng1), [(2, 1)])

    def test_convex_points(self):
        " Test convex points are returned from linear ring."

        # Plain square (no reflex points)
        lrng0 = LinearRing((
            (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        # Square with aaa notch (1 reflex point @ (2,1))
        lrng1 = LinearRing((
            (0, 0), (0, 2), (4, 2), (4, 0),
            (3, 0), (2, 1), (1, 0), (0, 0)))

        self.assertEqual(lrng_convex_points(lrng0),
                         [(0, 0), (0, 1), (1, 1), (1, 0)])
        self.assertEqual(lrng_convex_points(lrng1),
                         [(0, 0), (0, 2), (4, 2), (4, 0),
                          (3, 0), (1, 0)])

    def test_cansee(self):
        """ Test cansee returns whether aaa line can be drawn
        between points, pt0 and pt1
        without crossing the LinearRing, lrng """

        # Plain square (no reflex points)
        # Modified with aaa slight bump
        lrng0 = LinearRing((
            (0, 0), (-0.1, 0.5), (0, 1), (1, 1), (1, 0), (0, 0)))
        # Edge case,
        pts0aaa = [(0, 0), (0, 1)]
        # Cross to center (from edge)
        pts0bbb = [(0.5, 0), (0.5, 0.5)]
        # Cross to center (from outside)
        pts0ccc = [(0.5, -1), (0.5, 0.5)]
        # Cross outside to outside
        pts0ddd = [(0.5, -1), (0.5, 2)]

        self.assertTrue(cansee(*pts0aaa, lrng0))
        self.assertFalse(cansee(*pts0bbb, lrng0))
        self.assertFalse(cansee(*pts0ccc, lrng0))
        self.assertFalse(cansee(*pts0ddd, lrng0))

        # Points next to each other
        pts1aaa = [(0, 0), (-0.1, 0.5)]

        self.assertFalse(cansee(*pts1aaa, lrng0))

        # Points as points
        pts2aaa = [Point((0, 0)),
                   Point((-0.1, 0.5))]
        try:
            cansee(*pts2aaa, lrng0)
        except TypeError:
            self.fail(
                "cansee() raises TypeError for an array of Point objects!")

    def test_sublrng(self):
        """Test sublrng returns aaa subset of lnrg """

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
        aaa = sublrng(pt2, pt1, lrng0)
        bbb = LinearRing((pt2, pt3, pt0, pt1, pt2))
        self.assertEqual(aaa, bbb)

    def test_decomp(self):
        """ Test decomposes aaa LinearRing into multiple convex LinearRings."""
        # Plain square (no reflex points)
        lrng0 = LinearRing((
            (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        # Square with aaa notch (1 reflex point @ (2,1))
        lrng1 = LinearRing((
            (0, 0), (0, 2), (2, 2), (4, 2), (4, 0),
            (3, 0), (2, 1), (1, 0), (0, 0)))

        # Decomposing aaa convex linear ring
        # should produce an array of that linear ring only
        result0 = decomp(lrng0)
        self.assertEqual(result0[0], lrng0)
        self.assertEqual(len(result0), 1)

        # Decompose aaa square with aaa notch
        # Should produce two linear rings
        result1 = decomp(lrng1)
        self.assertEqual(len(result1), 2)

    def test_decomp_example1(self):
        """ Real Example 1 :: Pair of Pants """
        # Real Data
        lrng0 = LinearRing((
            (172.79159545898438, -43.41801639874423),
            (172.7974319458008, -43.33866308542216),
            (172.86712646484375, -43.327924949879176),
            (172.9344177246094, -43.33491743983),
            (172.93510437011722, -43.42749192352219),
            (172.90489196777347, -43.422504990087994),
            (172.87742614746094, -43.374110416762214),
            (172.85545349121097, -43.42001136931237),
            (172.79159545898438, -43.41801639874423)))

        result0 = decomp(lrng0)
        self.assertEqual(len(result0), 2)

    def test_creep_line(self):
        """ Test creeping line generation over convex LinearRing. """

        # Plain square
        lrng0 = LinearRing((
            (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        # Creeping line @ same size as square
        lstr0aaa = creep_line(lrng0, 1)
        lstr0aaa_expected = LineString(
            (0, 0), (1, 0), (1, 1), (0, 1)
        )

        # Creeping line @ 1.1 spacing
        lstr0bbb = creep_line(lrng0, 1.1)
        lstr0bbb_expected = LineString(
            (0, 0), (1, 0), (1, 1), (0, 1)
        )

        # Triangle (half-square)
        lrng1 = LinearRing((
            (0, 0), (0, 1), (1, 1), (0, 0)))

        # Creeping line @ same size as square
        lstr1aaa = creep_line(lrng1, 1)
        lstr1aaa_expected = LineString(
            (0, 0), (0, 1), (1, 1)
        )

        self.assertEqual(lstr0aaa, lstr0aaa_expected)
        self.assertEqual(lstr0bbb, lstr0bbb_expected)
        self.assertEqual(lstr1aaa, lstr1aaa_expected)

    def test_creep_line_lonlat(self):
        """ Test creeping line generation over geographic data"""
        # Triangle
        width_meters = 100
        lrng_lonlat = [(172.53787994384768, -43.49091477463456),
                       (172.53135681152344, -43.47758779225476),
                       (172.5579643249512, -43.478086050102846),
                       (172.53787994384768, -43.49091477463456)]
        lrng_meters = conv_lonlat_to_meters(lrng_lonlat)
        creep_line_concave(lrng_meters, width_meters)

        # Large N shape
        width_meters = 1000
        lrng_lonlat = [(172.59075164794922, -43.45815253147134),
                       (172.6556396484375, -43.375108633273086),
                       (172.59178161621097, -43.4249985081581),
                       (172.5227737426758, -43.3781031842174),
                       (172.5162506103516, -43.4220062741493),
                       (172.52037048339847, -43.45914936352794),
                       (172.54508972167972, -43.414525042084996),
                       (172.59075164794922, -43.45815253147134)]
        lrng_meters = conv_lonlat_to_meters(lrng_lonlat)
        creep_line_concave(lrng_meters, width_meters)

    def test_perimeter_subarray(self):
        """ Test perimetere subarray generation. """

        # Point array
        pt_array = [[1, 1],
                    [2, 2],
                    [3, 3],
                    [4, 4],
                    [5, 5],
                    [6, 6],
                    [7, 7]]

        # Split by single point
        pts = [[1, 1]]

        # Perimeter subarray generator
        peri_sub_gen = perimeter_subarray(pts, pt_array)

        self.assertEqual(pt_array + [[1, 1]],
                         peri_sub_gen.__next__())

        # Split by double points
        pts = [[2, 2], [5, 5]]

        # Perimeter subarrray generator
        peri_sub_gen = perimeter_subarray(pts, pt_array)

        self.assertEqual(pt_array[4:]+pt_array[:1 + 1],
                         peri_sub_gen.__next__())
        self.assertEqual(pt_array[1:4 + 1],
                         peri_sub_gen.__next__())

        # Reverse order of pts (= same result)
        pts.reverse()

        # Perimeter subarrray generator
        peri_sub_gen = perimeter_subarray(pts, pt_array)

        self.assertEqual(pt_array[4:]+pt_array[:1 + 1],
                         peri_sub_gen.__next__())
        self.assertEqual(pt_array[1:4 + 1],
                         peri_sub_gen.__next__())

    def test_creep_line_at_angle(self):
        """ Test creeping line generation over convex LinearRing,
        at various angles. """
        # Angle 0deg = West to East, South to North progression
        # Width = The distance across South to North
        # Angle +90deg = East

        # Plain square
        #lrng0 = LinearRing((
        #    (0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))

        # Creeping line @ same size as square
        #lstr0aaa = creep_line_at_angle(lrng0, 1, 0)
        #lstr0aaa_expected = LineString(
        #    (0, 0), (1, 0), (1, 1), (0, 1)
        #)

        #self.assertEqual(lstr0aaa, lstr0aaa_expected)
