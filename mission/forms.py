"""
Forms for missions
"""
from django.forms import ModelForm
from django.db.models import OuterRef

from assets.models import Asset, AssetStatus
from organization.models import OrganizationAsset, OrganizationMember
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
        latest_statuses = AssetStatus.objects.filter(asset_id=OuterRef('asset_id')).order_by('-since').values('id')[:1]
        latest_statuses_inop = AssetStatus.objects.filter(id__in=latest_statuses, status__inop=False)
        asset_ids_with_not_inop = [status.asset_id for status in latest_statuses_inop]
        asset_ids_with_no_status = Asset.objects.exclude(assetstatus__isnull=False).values_list('id', flat=True)
        asset_ids = set(asset_ids_with_not_inop) | set(asset_ids_with_no_status)
        asset_ids_owned_by_user = Asset.objects.filter(owner=self.user).values_list('id', flat=True)
        org_ids = OrganizationMember.objects.filter(user=self.user, removed__isnull=True).values_list('organization_id', flat=True)
        org_ids = MissionOrganization.objects.filter(mission=self.mission, organization__pk__in=[org_ids], removed__isnull=True).values_list('organization_id', flat=True)
        asset_ids_with_common_organization = OrganizationAsset.objects.filter(organization__pk__in=org_ids, removed__isnull=True).values_list('asset_id', flat=True)
        asset_ids = asset_ids & (set(asset_ids_owned_by_user) | set(asset_ids_with_common_organization))

        self.fields['asset'].queryset = Asset.objects.filter(id__in=asset_ids)

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
