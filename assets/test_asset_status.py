"""
Tests for asset status
"""

from smm.tests import SMMTestUsers

from .models import AssetStatus
from .tests import AssetsHelpers
from .test_asset_status_value import AssetStatusValueBase


class AssetStatusBase(AssetStatusValueBase):
    """
    Base class for Asset Status tests
    """
    def setUp(self):
        """
        Prepare the test env
        """
        self.smm = SMMTestUsers()
        self.assets = AssetsHelpers(self.smm)
        self.status_value1 = self.create_asset_status_value(name='value1')
        self.status_inop = self.create_asset_status_value(name='inop-asset')
        self.status_inop.inop = True
        self.status_inop.save()
        self.asset_type = self.assets.create_asset_type()
        self.asset1 = self.assets.create_asset(name='asset1', asset_type=self.asset_type, owner=self.smm.user1)
        self.asset2 = self.assets.create_asset(name='asset2', asset_type=self.asset_type, owner=self.smm.user2)

    def create_asset_status(self, asset=None, status=None):
        """
        Create an asset status
        """
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
    def get_asset_details(self, client=None, asset=None):
        """
        Return the current details for an asset
        """
        if client is None:
            client = self.smm.client1
        return client.get(f'/assets/{asset.pk}/', HTTP_ACCEPT='application/json').json()

    def get_asset_status(self, client=None, asset=None):
        """
        Return the current status for an asset
        """
        if client is None:
            client = self.smm.client1
        return client.get(f'/assets/{asset.pk}/status/').json()

    def set_asset_status(self, client=None, asset=None, value=None, notes=None):
        """
        Return the current status for an asset
        """
        if client is None:
            client = self.smm.client1
        data = {
            'value_id': value.pk
        }
        if notes is not None:
            data['notes'] = notes
        return client.post(f'/assets/{asset.pk}/status/', data=data)

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

    def test_0010_get_asset_status(self):
        """
        Check only the status of an asset appears when asking for the status
        """
        json_data = self.get_asset_status(asset=self.asset1)
        self.assertEqual(json_data, {})
        self.create_asset_status(asset=self.asset1, status=self.status_value1)
        json_data = self.get_asset_status(asset=self.asset1)
        self.assertEqual(json_data['status'], self.status_value1.name)
        self.assertEqual(json_data['inop'], self.status_value1.inop)
        self.assertEqual(json_data['notes'], None)

    def test_0011_get_asset_status(self):
        """
        Check the status of the correct asset appears when asking for the status
        """
        json_data = self.get_asset_status(asset=self.asset1)
        self.assertEqual(json_data, {})
        json_data = self.get_asset_status(asset=self.asset2)
        self.assertEqual(json_data, {})
        self.create_asset_status(asset=self.asset1, status=self.status_value1)
        json_data = self.get_asset_status(asset=self.asset1)
        self.assertEqual(json_data['status'], self.status_value1.name)
        self.assertEqual(json_data['inop'], self.status_value1.inop)
        self.assertEqual(json_data['notes'], None)
        json_data = self.get_asset_status(asset=self.asset2)
        self.assertEqual(json_data, {})

    def test_0020_set_asset_status(self):
        """
        Check that it is possible to POST the asset status
        """
        json_data = self.get_asset_status(asset=self.asset1)
        self.assertEqual(json_data, {})
        self.set_asset_status(asset=self.asset1, value=self.status_value1)
        json_data = self.get_asset_status(asset=self.asset1)
        self.assertEqual(json_data['status'], self.status_value1.name)
        self.assertEqual(json_data['notes'], None)

    def test_0020_set_asset_status_with_notes(self):
        """
        Check that it is possible to POST the asset status with notes
        """
        json_data = self.get_asset_status(asset=self.asset1)
        self.assertEqual(json_data, {})
        self.set_asset_status(asset=self.asset1, value=self.status_value1, notes='Posted notes')
        json_data = self.get_asset_status(asset=self.asset1)
        self.assertEqual(json_data['status'], self.status_value1.name)
        self.assertEqual(json_data['notes'], 'Posted notes')

    def test_0022_set_asset_status_twice(self):
        """
        Check that it is possible to POST the asset status
        Check that posting again updates the status
        """
        json_data = self.get_asset_status(asset=self.asset1)
        self.assertEqual(json_data, {})
        self.set_asset_status(asset=self.asset1, value=self.status_value1)
        json_data = self.get_asset_status(asset=self.asset1)
        self.assertEqual(json_data['status'], self.status_value1.name)
        self.set_asset_status(asset=self.asset1, value=self.status_inop)
        json_data = self.get_asset_status(asset=self.asset1)
        self.assertEqual(json_data['status'], self.status_inop.name)

    def test_0030_set_asset_status_wrong_user(self):
        """
        Check that it isn't possible to POST the asset status to an asset with a different owner
        """
        json_data = self.get_asset_status(asset=self.asset2)
        self.assertEqual(json_data, {})
        self.assertEqual(self.set_asset_status(asset=self.asset2, value=self.status_value1).status_code, 403)
        json_data = self.get_asset_status(asset=self.asset2)
        self.assertEqual(json_data, {})

    def test_0030_wrong_http_method_asset_status(self):
        """
        Check what happens when the wrong method is used to access the asset status
        """
        response = self.smm.client1.put(f'/assets/{self.asset1.pk}/status/', data={})
        self.assertEqual(response.status_code, 405)
