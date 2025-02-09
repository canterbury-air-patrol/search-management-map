"""
Forms for missions
"""
from django.forms import ModelForm

from mission.helpers import get_my_assets_not_in_mission
from .models import Mission, MissionUser, MissionAsset, MissionOrganization


class MissionForm(ModelForm):
    """
    Form for creating a new mission
    """
    class Meta:
        model = Mission
        fields = ['mission_name', 'mission_description']


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
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user')
        self.mission = kwargs.pop('mission')
        super().__init__(*args, **kwargs)

        self.fields['asset'].queryset = get_my_assets_not_in_mission(self.mission, self.user)

    class Meta:
        model = MissionAsset
        fields = ['asset']


class MissionOrganizationForm(ModelForm):
    """
    Form for adding an organization to a mission
    """
    class Meta:
        model = MissionOrganization
        fields = ['organization']
