"""
Forms for assets
"""
from django.forms import ModelForm

from mission.models import MissionAsset

from .models import AssetCommand, Asset


class AssetCommandForm(ModelForm):
    """
    Form for letting user set the next command for an asset
    The UI presenting this needs to provide a way to select the position
    (when the command is one that requires a position)
    """
    def __init__(self, *args, **kwargs):
        self.mission = kwargs.pop('mission')
        super().__init__(*args, **kwargs)
        mission_assets = MissionAsset.objects.filter(mission=self.mission, removed__isnull=True)
        self.fields['asset'].queryset = Asset.objects.filter(pk__in=[mission_asset.asset.pk for mission_asset in mission_assets])

    class Meta:
        model = AssetCommand
        fields = ['asset', 'command', 'reason']
