"""
Tests for asset status
"""

from django.test import Client

from .models import AssetStatus, AssetStatusValue, Asset
from .tests import AssetTestFunctionsBase


class AssetStatusBase(AssetTestFunctionsBase):
    """
    Base class for Asset Status tests
    """
    def setUp(self):
        """
        Prepare the test env
        """
        super().setUp()
        self.status_value1 = self.create_asset_status_value(name='value1')
        self.status_inop = self.create_asset_status_value(name='inop-asset')
        self.status_inop.inop = True
        self.status_inop.save()
        self.asset_type = self.create_asset_type()
        self.asset1 = self.create_asset(name='asset1', asset_type=self.asset_type, owner=self.user1)
        self.asset2 = self.create_asset(name='asset2', asset_type=self.asset_type, owner=self.user2)

    def create_asset(self, name='test_asset', asset_type=None, owner=None):
        """
        Create an asset
        """
        if asset_type is None:
            asset_type = self.create_asset_type()
        if owner is None:
            owner = self.user1
        Asset(name=name, asset_type=asset_type, owner=owner).save()
        return Asset.objects.get(name=name)

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

    def create_asset_status(self, asset=None, status=None):
        """
        Create an asset status
        """
        if asset is None:
            asset = self.asset1
        if status is None:
            status = self.status_value1
        return AssetStatus.objects.create(asset=asset, status=status)


class AssetStatusTestCase(AssetStatusBase):
    """
    Test general asset status data
    """
    def test_0001_assign_asset_status(self):
        """
        Create a basic asset status
        """
        status = self.create_asset_status(asset=self.asset1, status=self.status_value1)
        self.assertEqual(status.asset.pk, self.asset1.pk)
        self.assertEqual(status.status.pk, self.status_value1.pk)
        self.assertEqual(status.notes, None)

    def test_0002_check_asset_status_notes(self):
        """
        Check that notes are correctly recorded
        """
        status = self.create_asset_status(asset=self.asset1, status=self.status_value1)
        self.assertEqual(status.notes, None)
        status.notes = 'Test Notes'
        status.save()
        status = AssetStatus.objects.get(pk=status.pk)
        self.assertEqual(status.notes, 'Test Notes')

    def test_0010_check_asset_status_asset_select(self):
        """
        Check that the current_for_asset function works
        """
        status1 = self.create_asset_status(asset=self.asset1, status=self.status_value1)
        status_asset1 = AssetStatus.current_for_asset(asset=self.asset1)
        self.assertEqual(status1.pk, status_asset1.pk)

    def test_0011_check_asset_status_asset_select_2_assets(self):
        """
        Check that the current_for_asset function works for multiple assets
        """
        status1 = self.create_asset_status(asset=self.asset1, status=self.status_value1)
        status2 = self.create_asset_status(asset=self.asset2, status=self.status_value1)
        status_asset1 = AssetStatus.current_for_asset(asset=self.asset1)
        status_asset2 = AssetStatus.current_for_asset(asset=self.asset2)
        self.assertEqual(status1.pk, status_asset1.pk)
        self.assertEqual(status2.pk, status_asset2.pk)

    def test_0012_check_asset_status_asset_select_2_options_for_asset(self):
        """
        Check that the current_for_asset function works if there are 2 options for the same asset
        """
        self.create_asset_status(asset=self.asset1, status=self.status_value1)
        status2 = self.create_asset_status(asset=self.asset1, status=self.status_value1)
        status_asset1 = AssetStatus.current_for_asset(asset=self.asset1)
        self.assertEqual(status2.pk, status_asset1.pk)

    def test_0100_check_asset_has_status(self):
        """
        Check that an asset reports its status when there is one set
        """
        self.create_asset_status(asset=self.asset1, status=self.status_value1)
        data = self.asset1.as_object()
        self.assertEqual(data['status'], self.status_value1.name)
        self.assertEqual(data['status_inop'], False)
        self.create_asset_status(asset=self.asset1, status=self.status_inop)
        data = self.asset1.as_object()
        self.assertEqual(data['status'], self.status_inop.name)
        self.assertEqual(data['status_inop'], True)


class AssetStatusUrlTestCase(AssetStatusBase):
    """
    Check the urls associated with asset status information
    """
    def setUp(self):
        """
        Extra setup for web-based asset status
        """
        super().setUp()
        self.client1 = Client()
        self.client1.login(username=self.user1.username, password='password')
        self.client2 = Client()
        self.client2.login(username=self.user2.username, password='password')

    def get_asset_details(self, client=None, asset=None):
        """
        Return the current details for an asset
        """
        if client is None:
            client = self.client1
        if asset is None:
            asset = self.asset1
        return client.get(f'/assets/{asset.name}/details/').json()

    def test_0001_get_asset_status(self):
        """
        Check the status of an asset appears when requesting the details of that asset
        """
        self.create_asset_status(asset=self.asset1, status=self.status_value1)
        json_data = self.get_asset_details(asset=self.asset1)
        self.assertEqual(json_data['status']['status'], self.status_value1.name)
        self.assertEqual(json_data['status']['inop'], self.status_value1.inop)

    def test_0002_get_asset_status_inop(self):
        """
        Check the status of an asset appears when requesting the details of that asset
        With inop set
        """
        self.create_asset_status(asset=self.asset1, status=self.status_inop)
        json_data = self.get_asset_details(asset=self.asset1)
        self.assertEqual(json_data['status']['status'], self.status_inop.name)
        self.assertEqual(json_data['status']['inop'], self.status_inop.inop)

    def test_0002_get_asset_status_notes(self):
        """
        Check the status of an asset appears when requesting the details of that asset
        """
        status = self.create_asset_status(asset=self.asset1, status=self.status_value1)
        json_data = self.get_asset_details(asset=self.asset1)
        self.assertEqual(json_data['status']['status'], self.status_value1.name)
        self.assertEqual(json_data['status']['inop'], self.status_value1.inop)
        self.assertEqual(json_data['status']['notes'], None)
        status.notes = 'Test Notes'
        status.save()
        json_data = self.get_asset_details(asset=self.asset1)
        self.assertEqual(json_data['status']['status'], self.status_value1.name)
        self.assertEqual(json_data['status']['inop'], self.status_value1.inop)
        self.assertEqual(json_data['status']['notes'], 'Test Notes')
