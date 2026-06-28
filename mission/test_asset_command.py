"""
Tests for the asset command class
"""

from django.test import TestCase
from django.contrib.auth import get_user_model

from assets.tests import AssetsHelpers
from assets.models import Asset, AssetType
from smm.tests import SMMTestUsers

from .models import AssetCommand, MissionAsset
from .tests import MissionFunctions


class AssetCommandTestCase(TestCase):
    """
    Test the functionality associated with asset commands
    """
    def setUp(self):
        """
        Create objects for the test
        """
        boat = AssetType.objects.create(name='boat')
        self.user = get_user_model().objects.create_user('test', password='password')
        pccr = Asset.objects.create(name='PCCR', asset_type=boat, owner=self.user)
        AssetCommand.objects.create(asset=pccr, issued_by=self.user, command='RON', reason='test')

    def test_asset_command_string(self):
        """
        Check the asset string matches the expectation
        """
        pccr = Asset.objects.get(name='PCCR')
        commands = AssetCommand.objects.filter(asset=pccr, command='RON')
        first_ac = commands[0]
        self.assertEqual(str(first_ac), "Command PCCR to Continue")

    def test_asset_get_latest(self):
        """
        Get the latest command for an asset in None mission
        """
        pccr = Asset.objects.get(name='PCCR')
        command = AssetCommand.last_command_for_asset(asset=pccr)
        self.assertEqual(str(command), "Command PCCR to Continue")
        AssetCommand.objects.create(asset=pccr, issued_by=self.user, command='CIR', reason='test2')
        command = AssetCommand.last_command_for_asset(asset=pccr)
        self.assertEqual(str(command), "Command PCCR to Circle")


class AssetCommandWebTestCase(TestCase):
    """
    Test the URLs related to asset commands
    """
    def setUp(self):
        """
        Create objects for this test suite
        """
        self.smm = SMMTestUsers()
        self.assets = AssetsHelpers(self.smm)
        self.missions = MissionFunctions(self.smm)

    def test_asset_command_response(self):
        """
        Test responding to an asset command
        """
        pccr = self.assets.create_asset(name='PCCR')
        mission = self.missions.create_mission('test asset command')
        AssetCommand.objects.create(asset=pccr, issued_by=self.smm.user1, command='RON', reason='test', mission=mission.get_object())
        response = self.smm.client1.get(f'/assets/{pccr.pk}/command/')
        self.assertEqual(response.status_code, 200)
        command = response.json()['command']
        response = self.smm.client1.post(f'/assets/{pccr.pk}/command/', data={'command_id': command['id'], 'type': 'test', 'message': 'test response'})
        self.assertEqual(response.status_code, 200)

    def _set_command(self, client, mission, asset):
        """Send a (no-position) command to an asset via the command set endpoint."""
        return client.post(f'/mission/{mission.mission_pk}/assets/command/set/', data={
            'asset': asset.pk, 'command': 'RON', 'reason': 'test',
        })

    def test_command_set_as_mission_admin(self):
        """A mission admin can command an asset in the mission."""
        mission = self.missions.create_mission('admin command')
        asset = self.assets.create_asset(name='admin asset')
        MissionAsset.objects.create(mission=mission.get_object(), asset=asset, creator=self.smm.user1)
        response = self._set_command(self.smm.client1, mission, asset)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(AssetCommand.objects.filter(asset=asset, command='RON').count(), 1)

    def test_command_set_as_asset_owner(self):
        """A non-admin member who owns the asset can command it."""
        mission = self.missions.create_mission('owner command')
        mission.add_user(user=self.smm.user2)
        asset = self.assets.create_asset(name='owner asset', owner=self.smm.user2)
        MissionAsset.objects.create(mission=mission.get_object(), asset=asset, creator=self.smm.user2)
        response = self._set_command(self.smm.client2, mission, asset)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(AssetCommand.objects.filter(asset=asset, command='RON').count(), 1)

    def test_command_set_rejected_for_plain_member(self):
        """A non-admin member who cannot operate the asset is forbidden."""
        mission = self.missions.create_mission('plain member command')
        mission.add_user(user=self.smm.user2)
        asset = self.assets.create_asset(name='others asset')
        MissionAsset.objects.create(mission=mission.get_object(), asset=asset, creator=self.smm.user1)
        response = self._set_command(self.smm.client2, mission, asset)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(AssetCommand.objects.filter(asset=asset).count(), 0)
