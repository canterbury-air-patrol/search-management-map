"""
Forms for missions
"""
from django.forms import ModelForm
from django.db.models import Q

from assets.models import Asset
from organization.models import OrganizationAsset, OrganizationMember
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
        self.mission = kwargs.pop('mission')
        super().__init__(*args, **kwargs)
        self.fields['asset'].queryset = Asset.objects.filter(
            Q(owner=self.user) | Q(pk__in=OrganizationAsset.objects.filter(
                organization__in=MissionOrganization.objects.filter(
                    mission=self.mission,
                    organization__in=OrganizationMember.objects.filter(
                        user=self.user,
                        removed__isnull=True)
                    .values_list('organization'))
                .values_list('organization'))
                .values_list('asset')))

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
