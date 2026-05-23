"""
Forms for missions
"""
from django.forms import ModelForm

from assets.models import Asset

from mission.helpers import get_my_assets_not_in_mission
from .models import AssetCommand, Mission, MissionUser, MissionAsset, MissionOrganization


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


class AssetCommandForm(ModelForm):
    """
    Form for letting user set the next command for an asset.
    The UI presenting this needs to provide a way to select the position
    (when the command is one that requires a position)
    """
    def __init__(self, *args, **kwargs):
        self.mission = kwargs.pop('mission')
        super().__init__(*args, **kwargs)
        mission_assets = MissionAsset.objects.filter(mission=self.mission, removed__isnull=True)
        self.fields['asset'].queryset = Asset.objects.filter(
            pk__in=[mission_asset.asset.pk for mission_asset in mission_assets]
        )

    class Meta:
        model = AssetCommand
        fields = ['asset', 'command', 'reason']
