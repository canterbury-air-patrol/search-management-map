"""
Base test functionality for all of SMM
"""

from django.test import Client
from django.contrib.auth import get_user_model


class SMMTestUsers:
    """
    Class that creates test users for SMM
    Has:
    * 2x authenticated users+clients
    * An unauthenticated client
    """
    def __init__(self):
        """
        Create the required users and clients
        """
        self.user1_password = 'password'
        self.user2_password = 'password'
        self.user1 = get_user_model().objects.create_user('test1', password=self.user1_password)
        self.user2 = get_user_model().objects.create_user('test2', password=self.user2_password)
        self.client1 = Client()
        self.client1.login(username=self.user1.username, password=self.user1_password)
        self.client2 = Client()
        self.client2.login(username=self.user2.username, password=self.user2_password)
        self.unauth_client = Client()
