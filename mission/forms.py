"""
Forms for missions
"""
from django.forms import ModelForm

from .models import Mission, MissionAsset


class MissionForm(ModelForm):
    """
    Form for creating a new mission
    """
    class Meta:
        model = Mission
        fields = ['mission_name']


class MissionAssetForm(ModelForm):
    """
    Form for creating a new mission
    """
    class Meta:
        model = MissionAsset
        fields = ['asset']
