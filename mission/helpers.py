"""
Helper function for missions
"""

from django.db.models import OuterRef, Exists

from assets.models import Asset, AssetStatus
from organization.decorators import user_can_operate_asset
from organization.models import OrganizationAsset, OrganizationMember

from .models import MissionOrganization, MissionAsset


def user_can_command_asset(mission_user, asset):
    """
    Whether this user may send operational commands to the asset.

    Currently allowed for mission admins and users who can operate the asset
    (its owner or an organization radio operator). This is the single place to
    extend as missions and organizations gain finer operational roles.
    """
    return mission_user.is_admin() or user_can_operate_asset(mission_user.user, asset)


def get_my_assets_not_in_mission(mission, user):
    """
    Get all assets this user is allowed to added that aren't currently in the given mission

    Users are allowed to add assets:
    * that they are the owner of
    * when they are both in the same organization
    Exceptions:
    * Assets with a status that makes them inoperative
    * Assets currently in the specified mission
    """
    latest_statuses = AssetStatus.objects.filter(asset_id=OuterRef('asset_id')).order_by('-since').values('id')[:1]
    latest_statuses_inop = AssetStatus.objects.filter(id__in=latest_statuses, status__inop=False)
    asset_ids_with_not_inop = [status.asset_id for status in latest_statuses_inop]
    asset_ids_with_no_status = Asset.objects.exclude(assetstatus__isnull=False).values_list('id', flat=True)
    asset_ids = set(asset_ids_with_not_inop) | set(asset_ids_with_no_status)
    asset_ids_owned_by_user = Asset.objects.filter(owner=user).values_list('id', flat=True)
    org_ids = OrganizationMember.objects.filter(user=user, removed__isnull=True).values_list('organization_id', flat=True)
    org_ids = MissionOrganization.objects.filter(mission=mission, organization__pk__in=[org_ids], removed__isnull=True).values_list('organization_id', flat=True)
    asset_ids_with_common_organization = OrganizationAsset.objects.filter(organization__pk__in=org_ids, removed__isnull=True).values_list('asset_id', flat=True)
    asset_ids = asset_ids & (set(asset_ids_owned_by_user) | set(asset_ids_with_common_organization))

    return Asset.objects.filter(~Exists(MissionAsset.objects.filter(mission=mission, removed__isnull=True, asset=OuterRef('pk'))), id__in=asset_ids)
