"""
Tests for the asset type class
"""
import json

from django.test import TestCase, Client
from django.core import serializers
from django.contrib.auth import get_user_model

from .models import AssetType, Asset


class AssetTypeTestCase(TestCase):
    """
    Test the functionality associated with Asset Types
    """
    def setUp(self):
        """
        Prepares 2 asset types
        also, a user for the web based tests
        """
        AssetType.objects.create(name='flying-wing', description='RPAS that are only a wing')
        AssetType.objects.create(name='boat', description='Sea-going vessel')
        get_user_model().objects.create_user('test', password='password')

    def test_asset_type_name(self):
        """
        Check the stringified version is the name
        """
        flying_wing = AssetType.objects.get(name='flying-wing')
        boat = AssetType.objects.get(name='boat')
        self.assertEqual(str(flying_wing), 'flying-wing')
        self.assertEqual(str(boat), 'boat')

    def test_asset_type_natural_key(self):
        """
        Check the natural key is the name
        """
        flying_wing = AssetType.objects.get(name='flying-wing')
        boat = AssetType.objects.get(name='boat')
        self.assertEqual(flying_wing.natural_key(), 'flying-wing')
        self.assertEqual(boat.natural_key(), 'boat')
        # Check it works when referenced remotely
        asset = Asset(name='test-asset', asset_type=boat)
        serialised = serializers.serialize('json', [asset], use_natural_foreign_keys=True)
        data = json.loads(serialised)
        self.assertEqual(data[0]['fields']['asset_type'], 'boat')

    def test_asset_type_description(self):
        """
        Check the description is what was stored
        """
        flying_wing = AssetType.objects.get(name='flying-wing')
        boat = AssetType.objects.get(name='boat')
        self.assertEqual(flying_wing.description, 'RPAS that are only a wing')
        self.assertEqual(boat.description, 'Sea-going vessel')

    def test_asset_type_list(self):
        """
        Check if the asset list works and required authentication
        """
        client = Client()
        client.login(username='test', password='password')
        response = client.get('/assets/assettypes/', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue('asset_types' in data)
        for asset_type in data['asset_types']:
            self.assertTrue('id' in asset_type)
            self.assertTrue('name' in asset_type)
            self.assertTrue(asset_type['name'] in ('flying-wing', 'boat'))
        # Check the html is presented when not asking for json
        response = client.get('/assets/assettypes/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, text='<!DOCTYPE html>')
        # Check this requires authentication
        client.logout()
        response = client.get('/assets/assettypes/')
        self.assertNotEqual(response.status_code, 200)
