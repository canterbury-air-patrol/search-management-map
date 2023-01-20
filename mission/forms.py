"""
Forms for missions
"""
from django.forms import ModelForm

from assets.models import Asset
from timeline.models import TimeLineEntry
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
        super().__init__(*args, **kwargs)
        self.fields['asset'].queryset = Asset.objects.filter(owner=self.user)

    class Meta:
        model = MissionAsset
        fields = ['asset']


class MissionTimeLineEntryForm(ModelForm):
    """
    Form for adding a custom (user defined time/message) timeline entry to a mission
    """
    class Meta:
        model = TimeLineEntry
        fields = ['timestamp', 'message', 'url']


class MissionOrganizationForm(ModelForm):
    """
    Form for adding an organization to a mission
    """
    class Meta:
        model = MissionOrganization
        fields = ['organization']
