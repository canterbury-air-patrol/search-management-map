"""
Tests for the asset class
"""

import json

from django.test import TestCase, Client
from django.core import serializers
from django.contrib.auth import get_user_model

from .models import Asset, AssetType


class AssetTestCase(TestCase):
    """
    Test the functionality associated with assets
    """
    def setUp(self):
        """
        Create objects for the test
        """
        boat = AssetType.objects.create(name='boat')
        wing = AssetType.objects.create(name='wing')
        user = get_user_model().objects.create_user('test', password='password')
        Asset.objects.create(name='PCCR', asset_type=boat)
        Asset.objects.create(name='FX-79-1', asset_type=wing, owner=user)
        Asset.objects.create(name='FX-79-2', asset_type=wing)

    def test_asset_name(self):
        """
        Check the name is the stringified version
        """
        pccr = Asset.objects.get(name='PCCR')
        fx_79_1 = Asset.objects.get(name='FX-79-1')
        fx_79_2 = Asset.objects.get(name='FX-79-2')
        self.assertEqual(str(pccr), 'PCCR')
        self.assertEqual(str(fx_79_1), 'FX-79-1')
        self.assertEqual(str(fx_79_2), 'FX-79-2')

    def test_asset_type(self):
        """
        Check asset type is correctly reflected
        """
        pccr = Asset.objects.get(name='PCCR')
        fx_79_1 = Asset.objects.get(name='FX-79-1')
        fx_79_2 = Asset.objects.get(name='FX-79-2')
        self.assertEqual(str(pccr.asset_type), 'boat')
        self.assertEqual(str(fx_79_1.asset_type), 'wing')
        self.assertEqual(str(fx_79_2.asset_type), 'wing')

    def test_asset_natural_key(self):
        """
        Check the natural key is the name
        """
        pccr = Asset.objects.get(name='PCCR')
        fx_79_1 = Asset.objects.get(name='FX-79-1')
        fx_79_2 = Asset.objects.get(name='FX-79-2')
        self.assertEqual(pccr.natural_key(), 'PCCR')
        self.assertEqual(fx_79_1.natural_key(), 'FX-79-1')
        self.assertEqual(fx_79_2.natural_key(), 'FX-79-2')
        # Check it works correctly as the primry key
        serialised = serializers.serialize('json', [pccr], use_natural_primary_keys=True)
        data = json.loads(serialised)
        self.assertFalse('pk' in data[0])
        self.assertEqual(data[0]['fields']['name'], 'PCCR')

    def test_asset_mine_list(self):
        """
        Check the my assets list correctly reflects only assets the current user owns
        """
        client = Client()
        client.login(username='test', password='password')
        response = client.get('/assets/mine/json/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue('assets' in data)
        self.assertTrue('name' in data['assets'][0])
        self.assertEqual('FX-79-1', data['assets'][0]['name'])
        self.assertEqual('wing', data['assets'][0]['type_name'])
        self.assertEqual('test', data['assets'][0]['owner'])
