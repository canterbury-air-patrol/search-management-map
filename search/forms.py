"""
Forms for searches
"""
from django.forms import ModelForm

from mission.models import MissionAsset
from assets.models import Asset

from .models import Search


class AssetSearchQueueEntryForm(ModelForm):
    """
    Form for selecting an asset for search queueing
    """
    def __init__(self, *args, **kwargs):
        self.mission = kwargs.pop('mission')
        super().__init__(*args, **kwargs)
        mission_assets = MissionAsset.objects.filter(mission=self.mission, removed__isnull=True)
        self.fields['queued_for_asset'].queryset = Asset.objects.filter(pk__in=[mission_asset.asset.pk for mission_asset in mission_assets])

    class Meta:
        model = Search
        fields = ['queued_for_asset']


class AssetTypeSearchQueueEntryForm(ModelForm):
    """
    Form for selecting an asset type for search queueing
    """
    class Meta:
        model = Search
        fields = ['created_for']
