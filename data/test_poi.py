"""
Tests for the POIs (user created point/time/label)
"""

from django.test import Client
from django.contrib.gis.geos import Point

from .models import GeoTimeLabel
from .tests import UserDataTestCase


class POIsTestCase(UserDataTestCase):
    """
    Test POIs
    """
    def test_poi_create(self):
        """
        Create a POI
        """
        poi = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), created_by=self.user, label='Test Point', geo_type='poi', mission=self.mission)
        self.assertEqual(str(poi).startswith("Test Point"), True)

    def test_poi_api_create(self):
        """
        Check a user can create a poi
        """
        client = Client()
        client.login(username='test', password='password')
        poi_create_url = f'/mission/{self.mission.pk}/data/pois/create/'
        response = client.post(poi_create_url, {'lat': -43.5, 'lon': 172.5, 'label': 'Test API POI'})
        self.assertEqual(response.status_code, 200)
        poi = GeoTimeLabel.objects.get(label='Test API POI')
        self.assertEqual(poi.label, 'Test API POI')
        self.assertEqual(poi.geo_type, 'poi')
        self.assertEqual(poi.created_by.username, 'test')
        # Check that being logged in is required
        client.logout()
        response = client.post(poi_create_url, {'lat': -43.5, 'lon': 172.5, 'label': 'Test API POI 2'})
        self.assertEqual(response.status_code, 302)
        # and make sure it didn't actually get created
        pois = GeoTimeLabel.objects.filter(label='Test API POI 2')
        self.assertEqual(len(pois), 0)
        # and check a non-member cant use this api either
        client.login(username='test2', password='password')
        response = client.post(poi_create_url, {'lat': -43.5, 'lon': 172.5, 'label': 'Test API POI 3'})
        self.assertEqual(response.status_code, 404)
        # and make sure it didn't actually get created
        pois = GeoTimeLabel.objects.filter(label='Test API POI 3')
        self.assertEqual(len(pois), 0)

    def test_poi_api_move(self):
        """
        Check the api for moving POIs
        """
        poi_1 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Move API POI 1', mission=self.mission, created_by=self.user, geo_type='poi')
        client = Client()
        client.login(username='test', password='password')
        poi_replace_url = f'/data/pois/{poi_1.pk}/replace/'
        response = client.post(poi_replace_url, {'lat': -44.5, 'lon': 171.5, 'label': 'Move API POI 1'})
        self.assertEqual(response.status_code, 200)
        pois = GeoTimeLabel.objects.filter(label='Move API POI 1')
        self.assertEqual(len(pois), 2)
        for poi in pois:
            if poi.pk == poi_1.pk:
                self.assertEqual(poi.deleted_at, None)
                self.assertEqual(poi.deleted_by, None)
                self.assertNotEqual(poi.replaced_by, None)
                self.assertNotEqual(poi.replaced_at, None)
            else:
                self.assertEqual(poi.deleted_at, None)
                self.assertEqual(poi.deleted_by, None)
                self.assertEqual(poi.replaced_by, None)
                self.assertEqual(poi.replaced_at, None)
                self.assertEqual(poi.geo_type, 'poi')
                point = Point(171.5, -44.5)
                self.assertEqual(poi.geo.x, point.x)
                self.assertEqual(poi.geo.y, point.y)
        # Check that being logged in is required
        client.logout()
        poi_2 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Move API POI 2', mission=self.mission, created_by=self.user)
        poi_replace_url = f'/data/pois/{poi_2.pk}/replace/'
        response = client.post(poi_replace_url, {'lat': -45.5, 'lon': 171.5, 'label': 'Move API POI 2'})
        self.assertEqual(response.status_code, 302)
        # and make sure it didn't actually get created
        pois = GeoTimeLabel.objects.filter(label='Move API POI 2')
        self.assertEqual(len(pois), 1)
        self.assertEqual(pois[0].pk, poi_2.pk)
        self.assertEqual(pois[0].deleted_at, None)
        self.assertEqual(pois[0].deleted_by, None)
        self.assertEqual(pois[0].replaced_by, None)
        self.assertEqual(pois[0].replaced_at, None)
        # and check a non-member cant use this api either
        client.login(username='test2', password='password')
        poi_3 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Move API POI 3', mission=self.mission, created_by=self.user)
        poi_replace_url = f'/data/pois/{poi_3.pk}/replace/'
        response = client.post(poi_replace_url, {'lat': -46.5, 'lon': 171.5, 'label': 'Move API POI 3'})
        self.assertEqual(response.status_code, 404)
        # and make sure it didn't actually get created
        pois = GeoTimeLabel.objects.filter(label='Move API POI 3')
        self.assertEqual(len(pois), 1)
        self.assertEqual(pois[0].pk, poi_3.pk)
        self.assertEqual(pois[0].deleted_at, None)
        self.assertEqual(pois[0].deleted_by, None)
        self.assertEqual(pois[0].replaced_by, None)
        self.assertEqual(pois[0].replaced_at, None)

    def test_poi_api_move_other(self):
        """
        Check the api for moving POIs doesn't try to move other objects
        """
        poi_1 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Move Other API POI 1', mission=self.mission, created_by=self.user, geo_type='other')
        client = Client()
        client.login(username='test', password='password')
        poi_replace_url = f'/data/pois/{poi_1.pk}/replace/'
        response = client.post(poi_replace_url, {'lat': -44.5, 'lon': 171.5, 'label': 'Move Other API POI 1'})
        self.assertEqual(response.status_code, 404)
        pois = GeoTimeLabel.objects.filter(label='Move Other API POI 1')
        self.assertEqual(len(pois), 1)
        self.assertEqual(pois[0].pk, poi_1.pk)
        self.assertEqual(pois[0].deleted_at, None)
        self.assertEqual(pois[0].deleted_by, None)
        self.assertEqual(pois[0].replaced_by, None)
        self.assertEqual(pois[0].replaced_at, None)

    # pylint: disable=R0915
    def test_poi_api_relabel(self):
        """
        Check the api for relabelling POIs
        """
        poi_1 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Relabel API POI 1', mission=self.mission, created_by=self.user, geo_type='poi')
        client = Client()
        client.login(username='test', password='password')
        poi_replace_url = f'/data/pois/{poi_1.pk}/replace/'
        response = client.post(poi_replace_url, {'lat': -43.5, 'lon': 172.5, 'label': 'Relabelled API POI 1'})
        self.assertEqual(response.status_code, 200)
        pois = GeoTimeLabel.objects.filter(label='Relabel API POI 1')
        self.assertEqual(len(pois), 1)
        for poi in pois:
            self.assertEqual(poi.pk, poi_1.pk)
            self.assertEqual(poi.deleted_at, None)
            self.assertEqual(poi.deleted_by, None)
            self.assertNotEqual(poi.replaced_by, None)
            self.assertNotEqual(poi.replaced_at, None)
        pois = GeoTimeLabel.objects.filter(label='Relabelled API POI 1')
        self.assertEqual(len(pois), 1)
        for poi in pois:
            self.assertNotEqual(poi.pk, poi_1.pk)
            self.assertEqual(poi.deleted_at, None)
            self.assertEqual(poi.deleted_by, None)
            self.assertEqual(poi.replaced_by, None)
            self.assertEqual(poi.replaced_at, None)
            self.assertEqual(poi.geo_type, 'poi')
            point = Point(172.5, -43.5)
            self.assertEqual(poi.geo.x, point.x)
            self.assertEqual(poi.geo.y, point.y)
        # Check that being logged in is required
        client.logout()
        poi_2 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Relabel API POI 2', mission=self.mission, created_by=self.user)
        poi_replace_url = f'/data/pois/{poi_2.pk}/replace/'
        response = client.post(poi_replace_url, {'lat': -45.5, 'lon': 171.5, 'label': 'Relabelled API POI 2'})
        self.assertEqual(response.status_code, 302)
        # and make sure it didn't actually get created
        pois = GeoTimeLabel.objects.filter(label='Relabel API POI 2')
        self.assertEqual(len(pois), 1)
        self.assertEqual(pois[0].pk, poi_2.pk)
        self.assertEqual(pois[0].deleted_at, None)
        self.assertEqual(pois[0].deleted_by, None)
        self.assertEqual(pois[0].replaced_by, None)
        self.assertEqual(pois[0].replaced_at, None)
        pois = GeoTimeLabel.objects.filter(label='Relabelled API POI 2')
        self.assertEqual(len(pois), 0)
        # and check a non-member cant use this api either
        client.login(username='test2', password='password')
        poi_3 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Relabel API POI 3', mission=self.mission, created_by=self.user)
        poi_replace_url = f'/data/pois/{poi_3.pk}/replace/'
        response = client.post(poi_replace_url, {'lat': -46.5, 'lon': 171.5, 'label': 'Relabelled API POI 3'})
        self.assertEqual(response.status_code, 404)
        # and make sure it didn't actually get created
        pois = GeoTimeLabel.objects.filter(label='Relabel API POI 3')
        self.assertEqual(len(pois), 1)
        self.assertEqual(pois[0].pk, poi_3.pk)
        self.assertEqual(pois[0].deleted_at, None)
        self.assertEqual(pois[0].deleted_by, None)
        self.assertEqual(pois[0].replaced_by, None)
        self.assertEqual(pois[0].replaced_at, None)
        pois = GeoTimeLabel.objects.filter(label='Relabelled API POI 3')
        self.assertEqual(len(pois), 0)

    def test_poi_api_relabel_other(self):
        """
        Check the api for relabelling POIs doesn't try to relabel other objects
        """
        poi_1 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Relabel Other API POI 1', mission=self.mission, created_by=self.user, geo_type='other')
        client = Client()
        client.login(username='test', password='password')
        poi_replace_url = f'/data/pois/{poi_1.pk}/replace/'
        response = client.post(poi_replace_url, {'lat': -44.5, 'lon': 171.5, 'label': 'Relabelled Other API POI 1'})
        self.assertEqual(response.status_code, 404)
        pois = GeoTimeLabel.objects.filter(label='Relabel Other API POI 1')
        self.assertEqual(len(pois), 1)
        self.assertEqual(pois[0].pk, poi_1.pk)
        self.assertEqual(pois[0].deleted_at, None)
        self.assertEqual(pois[0].deleted_by, None)
        self.assertEqual(pois[0].replaced_by, None)
        self.assertEqual(pois[0].replaced_at, None)
        pois = GeoTimeLabel.objects.filter(label='Relabelled Other API POI 1')
        self.assertEqual(len(pois), 0)

    def test_poi_api_delete(self):
        """
        Check the API for deleting
        """
        poi_1 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Delete API POI 1', mission=self.mission, created_by=self.user, geo_type='poi')
        client = Client()
        client.login(username='test', password='password')
        poi_delete_url = f'/data/usergeo/{poi_1.pk}/'
        response = client.delete(poi_delete_url)
        self.assertEqual(response.status_code, 200)
        pois = GeoTimeLabel.objects.filter(label='Delete API POI 1')
        self.assertEqual(len(pois), 1)
        for poi in pois:
            self.assertEqual(poi.pk, poi_1.pk)
            self.assertNotEqual(poi.deleted_at, None)
            self.assertEqual(poi.deleted_by, self.user)
            self.assertEqual(poi.replaced_by, None)
            self.assertEqual(poi.replaced_at, None)
        # Check that being logged in is required
        client.logout()
        poi_2 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Delete API POI 2', mission=self.mission, created_by=self.user)
        poi_delete_url = f'/data/usergeo/{poi_2.pk}/'
        response = client.post(poi_delete_url)
        self.assertEqual(response.status_code, 302)
        # and make sure it didn't actually get created
        pois = GeoTimeLabel.objects.filter(label='Delete API POI 2')
        self.assertEqual(len(pois), 1)
        self.assertEqual(pois[0].pk, poi_2.pk)
        self.assertEqual(pois[0].deleted_at, None)
        self.assertEqual(pois[0].deleted_by, None)
        self.assertEqual(pois[0].replaced_by, None)
        self.assertEqual(pois[0].replaced_at, None)
        # and check a non-member cant use this api either
        client.login(username='test2', password='password')
        poi_3 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Delete API POI 3', mission=self.mission, created_by=self.user)
        poi_delete_url = f'/data/usergeo/{poi_3.pk}/'
        response = client.delete(poi_delete_url)
        self.assertEqual(response.status_code, 404)
        # and make sure it didn't actually get created
        pois = GeoTimeLabel.objects.filter(label='Delete API POI 3')
        self.assertEqual(len(pois), 1)
        self.assertEqual(pois[0].pk, poi_3.pk)
        self.assertEqual(pois[0].deleted_at, None)
        self.assertEqual(pois[0].deleted_by, None)
        self.assertEqual(pois[0].replaced_by, None)
        self.assertEqual(pois[0].replaced_at, None)

    def test_api_delete_move(self):
        """
        Check the interaction between delete and move/relabel
        """
        poi_1 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Delete/Move API POI 1', mission=self.mission, created_by=self.user, geo_type='poi')
        client = Client()
        client.login(username='test', password='password')
        poi_delete_url = f'/data/usergeo/{poi_1.pk}/'
        response = client.delete(poi_delete_url)
        self.assertEqual(response.status_code, 200)
        pois = GeoTimeLabel.objects.filter(label='Delete/Move API POI 1')
        self.assertEqual(len(pois), 1)
        for poi in pois:
            self.assertEqual(poi.pk, poi_1.pk)
            self.assertNotEqual(poi.deleted_at, None)
            self.assertEqual(poi.deleted_by, self.user)
            self.assertEqual(poi.replaced_by, None)
            self.assertEqual(poi.replaced_at, None)
        poi_replace_url = f'/data/pois/{poi_1.pk}/replace/'
        response = client.post(poi_replace_url, {'lat': -44.5, 'lon': 171.5, 'label': 'Delete/Move API POI 1'})
        self.assertEqual(response.status_code, 404)
        pois = GeoTimeLabel.objects.filter(label='Delete/Move API POI 1')
        self.assertEqual(len(pois), 1)
        for poi in pois:
            self.assertEqual(poi.pk, poi_1.pk)
            self.assertNotEqual(poi.deleted_at, None)
            self.assertEqual(poi.deleted_by, self.user)
            self.assertEqual(poi.replaced_by, None)
            self.assertEqual(poi.replaced_at, None)

    def test_api_move_delete(self):
        """
        Check the interaction between move/relabel and delete
        """
        poi_1 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='Move/Delete API POI 1', mission=self.mission, created_by=self.user, geo_type='poi')
        client = Client()
        client.login(username='test', password='password')
        poi_replace_url = f'/data/pois/{poi_1.pk}/replace/'
        response = client.post(poi_replace_url, {'lat': -44.5, 'lon': 171.5, 'label': 'Moved/Delete API POI 1'})
        self.assertEqual(response.status_code, 200)
        pois = GeoTimeLabel.objects.filter(label='Move/Delete API POI 1')
        self.assertEqual(len(pois), 1)
        for poi in pois:
            self.assertEqual(poi.pk, poi_1.pk)
            self.assertEqual(poi.deleted_at, None)
            self.assertEqual(poi.deleted_by, None)
            self.assertNotEqual(poi.replaced_by, None)
            self.assertNotEqual(poi.replaced_at, None)
        pois = GeoTimeLabel.objects.filter(label='Moved/Delete API POI 1')
        self.assertEqual(len(pois), 1)
        for poi in pois:
            self.assertNotEqual(poi.pk, poi_1.pk)
            self.assertEqual(poi.deleted_at, None)
            self.assertEqual(poi.deleted_by, None)
            self.assertEqual(poi.replaced_by, None)
            self.assertEqual(poi.replaced_at, None)
            self.assertEqual(poi.geo_type, 'poi')
            point = Point(171.5, -44.5)
            self.assertEqual(poi.geo.x, point.x)
            self.assertEqual(poi.geo.y, point.y)
        poi_delete_url = f'/data/usergeo/{poi_1.pk}/'
        response = client.delete(poi_delete_url)
        self.assertEqual(response.status_code, 404)
        pois = GeoTimeLabel.objects.filter(label='Move/Delete API POI 1')
        self.assertEqual(len(pois), 1)
        for poi in pois:
            self.assertEqual(poi.pk, poi_1.pk)
            self.assertEqual(poi.deleted_at, None)
            self.assertEqual(poi.deleted_by, None)
            self.assertNotEqual(poi.replaced_by, None)
            self.assertNotEqual(poi.replaced_at, None)

    def test_api_list(self):
        """
        Check the API for listing POIs
        """
        poi_list_url = f'/mission/{self.mission.pk}/data/pois/current/'
        client = Client()
        client.login(username='test', password='password')
        # Response should be empty because no POIs have been created yet
        response = client.get(poi_list_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue('features' in data)
        self.assertEqual(len(data['features']), 0)
        # Create a POI and see it appear
        poi_1 = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='List API POI 1', mission=self.mission, created_by=self.user, geo_type='poi')
        response = client.get(poi_list_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue('features' in data)
        self.assertEqual(len(data['features']), 1)
        self.assertEqual(data['features'][0]['properties']['pk'], str(poi_1.pk))
        # Move the POI and see the new one appear
        poi_replace_url = f'/data/pois/{poi_1.pk}/replace/'
        response = client.post(poi_replace_url, {'lat': -44.5, 'lon': 171.5, 'label': 'List API POI 2'})
        self.assertEqual(response.status_code, 200)
        response = client.get(poi_list_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue('features' in data)
        self.assertEqual(len(data['features']), 1)
        self.assertNotEqual(data['features'][0]['properties']['pk'], str(poi_1.pk))
        # Delete the POI and see the list go empty
        poi_delete_url = f'/data/usergeo/{data["features"][0]["properties"]["pk"]}/'
        response = client.delete(poi_delete_url)
        self.assertEqual(response.status_code, 200)
        response = client.get(poi_list_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue('features' in data)
        self.assertEqual(len(data['features']), 0)
        # Add an object of the wrong type and check it doesn't appear
        GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), label='List API POI 10', mission=self.mission, created_by=self.user, geo_type='other')
        response = client.get(poi_list_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue('features' in data)
        self.assertEqual(len(data['features']), 0)
