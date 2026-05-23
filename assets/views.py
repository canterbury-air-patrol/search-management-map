"""
Views for assets
"""
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from django.utils.decorators import method_decorator
from django.views import View

from mission.decorators import mission_asset_get
from mission.models import AssetCommand

from organization.decorators import asset_is_operator, asset_is_recorder
from search.models import Search
from search.view_helpers import check_searches_in_progress
from .models import AssetType, Asset, AssetStatusValue, AssetStatus


@login_required
def assets_status_value_list(request):
    """
    List all of the asset status values
    """
    return JsonResponse({'values': [v.as_object() for v in AssetStatusValue.objects.all()]})


@method_decorator(login_required, name="dispatch")
@method_decorator(asset_is_operator, name="dispatch")
class AssetView(View):
    """
    View of a specific asset
    """
    def as_json(self, request, asset):
        """
        Provide the details of an asset
        """
        data = {
            'asset_id': asset.pk,
            'name': asset.name,
            'asset_type': asset.asset_type.name,
            'owner': str(asset.owner),
            'last_command': AssetCommand.last_command_for_asset_to_json(asset),
        }

        mission_asset = mission_asset_get(asset)
        if mission_asset is not None:
            data['mission_id'] = mission_asset.mission.pk
            data['mission_name'] = mission_asset.mission.mission_name

            current_search = check_searches_in_progress(mission_asset.mission, asset)
            if current_search is not None:
                data['current_search_id'] = current_search.pk
            queued_search = Search.oldest_queued_for_asset(mission_asset.mission, asset)
            if queued_search is not None:
                data['queued_search_id'] = queued_search.pk

        status = AssetStatus.current_for_asset(asset)
        if status is not None:
            data['status'] = status.as_object()

        return JsonResponse(data)

    def get(self, request, asset):
        """
        View of the specific asset
        """
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(request, asset)
        return render(request, 'assets/ui.html', {'assetId': asset.pk, 'assetName': asset.name})


@method_decorator(login_required, name="dispatch")
class AssetsTypeView(View):
    """
    View for all asset types
    """
    def as_json(self):
        """
        Return the asset types as a json array
        """
        asset_types = AssetType.objects.all()
        return JsonResponse({'asset_types': [at.as_object() for at in asset_types]})

    def get(self, request):
        """
        Return a list of possible asset types
        """
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json()
        return render(request, 'assets/type_list.html', {})


@method_decorator(login_required, name="dispatch")
class AssetsView(View):
    """
    View for all assets this user can see
    """
    def as_json(self, request):
        """
        Return all this users assets as json
        """
        assets = Asset.objects.filter(owner=request.user)
        return JsonResponse({'assets': [a.as_object() for a in assets]})

    def get(self, request):
        """
        Show the assets this user is the owner of
        """
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(request)
        return render(request, 'assets/list.html', {})


@method_decorator(login_required, name='dispatch')
@method_decorator(asset_is_recorder, name='post')
class AssetStatusView(View):
    """
    Get or set the status for a given asset.
    GET is open to any authenticated user; POST requires recorder permission.
    """
    def get(self, request, asset_id):
        """Return the current status for the asset, or an empty object if none is set."""
        asset = get_object_or_404(Asset, pk=asset_id)
        status = AssetStatus.current_for_asset(asset)
        return JsonResponse(status.as_object()) if status else JsonResponse({})

    def post(self, request, asset):
        """Set a new status for the asset (recorder permission required)."""
        value_id = request.POST.get('value_id')
        status_value = get_object_or_404(AssetStatusValue, pk=value_id)
        notes = request.POST.get('notes')
        status = AssetStatus.objects.create(status=status_value, asset=asset, notes=notes)
        return JsonResponse(status.as_object())
