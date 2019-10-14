"""
Forms for missions
"""
from django.forms import ModelForm

from .models import Mission, MissionUser, MissionAsset


class MissionForm(ModelForm):
    """
    Form for creating a new mission
    """
    class Meta:
        model = Mission
        fields = ['mission_name']


class MissionUserForm(ModelForm):
    """
    Form for adding a user to a mission
    """
    class Meta:
        model = MissionUser
        fields = ['user']


class MissionAssetForm(ModelForm):
    """
    Form for adding an asset to a mission
    """
    class Meta:
        model = MissionAsset
        fields = ['asset']
