#!/usr/bin/env python3
import sys
import os

from django.contrib.auth import get_user_model
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smm.settings')

django.setup()

User = get_user_model()
user = User.objects.create_user(sys.argv[1], password=sys.argv[2])
user.is_superuser=True
user.is_staff=True
user.save()
