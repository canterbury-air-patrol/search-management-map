"""
Tests for asset status values
"""

from django.db import IntegrityError
from django.test import TestCase

from smm.tests import SMMTestUsers

from .models import AssetStatusValue


class AssetStatusValueBase(TestCase):
    """
    Base class for testing asset status values
    """
    def create_asset_status_value(self, name='test'):
        """
        Create an asset status
        """
        return AssetStatusValue.objects.create(name=name)

    def get_asset_status_value(self, name='test'):
        """
        Get an existing asset by name
        """
        return AssetStatusValue.objects.get(name=name)


class AssetStatusValueTestCase(AssetStatusValueBase):
    """
    Test the functionality associated with asset status values
    """
    def setUp(self):
        """
        Create objects for the test
        """

    def test_0010_status_value_name(self):
        """
        Check that asset status values capture their name correctly
        """
        test_status = self.create_asset_status_value(name='test-status')
        self.assertEqual(test_status.name, 'test-status')

    def test_0011_status_value_name_is_string(self):
        """
        Check that the asset status values name is used as the string
        """
        test_status = self.create_asset_status_value(name='test-status')
        self.assertEqual(test_status.name, 'test-status')

    def test_0012_status_value_name_uniqueness(self):
        """
        Test uniqueness of the name field
        """
        # Create a status with a unique name
        self.create_asset_status_value(name='unique-status')

        # Attempt to create another status with the same name
        with self.assertRaises(IntegrityError):
            self.create_asset_status_value(name='unique-status')

    def test_0020_status_value_inop(self):
        """
        Check that asset status values have the correct in-op flag associated with them
        """
        status_normal = self.create_asset_status_value(name='normal-status')
        self.assertEqual(status_normal.inop, False)
        status_inop = self.create_asset_status_value(name='inop-status')
        self.assertEqual(status_inop.inop, False)
        status_inop = self.get_asset_status_value(name='inop-status')
        self.assertEqual(status_inop.inop, False)
        status_inop.inop = True
        status_inop.save()
        self.assertEqual(status_inop.inop, True)
        status_inop = self.get_asset_status_value(name='inop-status')
        self.assertEqual(status_inop.inop, True)

    def test_0030_status_value_description(self):
        """
        Check that asset status value description is stored correctly
        """
        status_value = self.create_asset_status_value(name='status-desc')
        self.assertEqual(status_value.description, None)
        status_value.description = 'Test Description'
        self.assertEqual(status_value.description, 'Test Description')
        status_value.save()
        status_value = self.get_asset_status_value(name='status-desc')
        self.assertEqual(status_value.description, 'Test Description')


class AssetStatusValueUrlTestCase(AssetStatusValueBase):
    """
    Test the urls associated with the asset status value
    """
    def setUp(self):
        """
        Create objects for the test cases
        """
        self.smm = SMMTestUsers()

    def get_asset_status_values(self):
        """
        Get the list of asset status values
        """
        response = self.smm.client1.get('/assets/status/values/')
        return response.json()['values']

    def test_0010_status_value_list_1(self):
        """
        Check that adding a single status value makes it appear in the list
        """
        json_data = self.get_asset_status_values()
        self.assertEqual(len(json_data), 0)
        self.create_asset_status_value(name='test1')
        json_data = self.get_asset_status_values()
        self.assertEqual(len(json_data), 1)

    def test_0011_status_value_list_2(self):
        """
        Check that adding 2 status values results in both appearing in the list
        """
        self.create_asset_status_value(name='test1')
        self.create_asset_status_value(name='test2')
        json_data = self.get_asset_status_values()
        self.assertEqual(len(json_data), 2)

    def test_0020_status_value_details_1(self):
        """
        Check that the correct details for a single status value appear in the list
        """
        self.create_asset_status_value(name='test1')
        json_data = self.get_asset_status_values()
        self.assertEqual(len(json_data), 1)
        self.assertEqual(json_data[0]['name'], 'test1')
        self.assertEqual(json_data[0]['inop'], False)
        self.assertEqual(json_data[0]['description'], None)

    def test_0021_status_value_details_1_inop(self):
        """
        Check that the correct details for a single status value appear in the list
        With inop set
        """
        status_inop = self.create_asset_status_value(name='test-inop')
        status_inop.inop = True
        status_inop.save()
        json_data = self.get_asset_status_values()
        self.assertEqual(len(json_data), 1)
        self.assertEqual(json_data[0]['name'], 'test-inop')
        self.assertEqual(json_data[0]['inop'], True)
        self.assertEqual(json_data[0]['description'], None)

    def test_0022_status_value_details_1_description(self):
        """
        Check that the correct details for a single status value appear in the list
        With description set
        """
        status_desc = self.create_asset_status_value(name='test-desc')
        status_desc.description = 'a short description'
        status_desc.save()
        json_data = self.get_asset_status_values()
        self.assertEqual(len(json_data), 1)
        self.assertEqual(json_data[0]['name'], 'test-desc')
        self.assertEqual(json_data[0]['inop'], False)
        self.assertEqual(json_data[0]['description'], 'a short description')

    def test_0030_status_value_details_2(self):
        """
        Check that adding correct details for 2 status values appear in the list
        """
        self.create_asset_status_value(name='test1')
        self.create_asset_status_value(name='test2')
        json_data = self.get_asset_status_values()
        self.assertEqual(len(json_data), 2)
        found1 = False
        found2 = False
        for value in json_data:
            if value['name'] == 'test1':
                self.assertFalse(found1)
                found1 = True
            elif value['name'] == 'test2':
                self.assertFalse(found2)
                found2 = True
        self.assertTrue(found1)
        self.assertTrue(found2)

    def test_0031_status_value_details_2_inop(self):
        """
        Check that adding correct details for 2 status values appear in the list
        With one of the inop statuses set
        """
        status_inop = self.create_asset_status_value(name='test1')
        status_inop.inop = True
        status_inop.save()
        self.create_asset_status_value(name='test2')
        json_data = self.get_asset_status_values()
        self.assertEqual(len(json_data), 2)
        found1 = False
        found2 = False
        for value in json_data:
            if value['name'] == 'test1':
                self.assertFalse(found1)
                self.assertTrue(value['inop'])
                found1 = True
            elif value['name'] == 'test2':
                self.assertFalse(found2)
                self.assertFalse(value['inop'])
                found2 = True
        self.assertTrue(found1)
        self.assertTrue(found2)

    def test_0032_status_value_details_2_description(self):
        """
        Check that adding correct details for 2 status values appear in the list
        With the descriptions set to different values
        """
        status_desc1 = self.create_asset_status_value(name='test1')
        status_desc1.description = 'This is the first description'
        status_desc1.save()
        status_desc2 = self.create_asset_status_value(name='test2')
        status_desc2.description = 'This is the second description'
        status_desc2.save()
        json_data = self.get_asset_status_values()
        self.assertEqual(len(json_data), 2)
        found1 = False
        found2 = False
        for value in json_data:
            if value['name'] == 'test1':
                self.assertFalse(found1)
                self.assertEqual(value['description'], 'This is the first description')
                found1 = True
            elif value['name'] == 'test2':
                self.assertFalse(found2)
                self.assertEqual(value['description'], 'This is the second description')
                found2 = True
        self.assertTrue(found1)
        self.assertTrue(found2)
