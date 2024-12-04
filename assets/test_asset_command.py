"""
Tests for the asset command class
"""

from django.test import TestCase
from django.contrib.auth import get_user_model

from assets.tests import AssetsHelpers
from mission.tests import MissionFunctions
from smm.tests import SMMTestUsers

from .models import Asset, AssetType, AssetCommand


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
