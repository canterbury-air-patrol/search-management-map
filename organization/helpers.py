from .models import OrganizationAsset, OrganizationMember


def organization_user_is_asset_recorder(user, asset):
    """
    Check if given user is has privileges to record as an asset
    """
    # Find all the organizations that this asset is a member of
    org_memberships = OrganizationAsset.objects.filter(asset=asset, removed__isnull=True)
    for org in org_memberships:
        # see if this user is in the org
        org_user = OrganizationMember.objects.get(user=user, organization=org.organization, removed__isnull=True)
        if org_user.is_asset_recorder():
            return True
    return False


def organization_user_is_asset_radio_operator(user, asset):
    """
    Check if given user is has privileges to act as radio operator for an asset
    """
    # Find all the organizations that this asset is a member of
    org_memberships = OrganizationAsset.objects.filter(asset=asset, removed__isnull=True)
    for org in org_memberships:
        # see if this user is in the org
        org_user = OrganizationMember.objects.get(user=user, organization=org.organization, removed__isnull=True)
        if org_user.is_radio_operator():
            return True
    return False
