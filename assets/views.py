"""
Views for assets
"""
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, HttpResponseForbidden, HttpResponseNotFound
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View

from mission.decorators import mission_is_member, mission_asset_get

from organization.helpers import organization_user_is_asset_recorder

from search.models import Search
from search.view_helpers import check_searches_in_progress

from .decorators import asset_is_recorder, asset_is_operator
from .models import AssetType, Asset, AssetCommand, AssetStatusValue, AssetStatus
from .forms import AssetCommandForm


@login_required
def asset_types_list(request):
    """
    List all the asset types
    """
    asset_types = AssetType.objects.all()

    return JsonResponse({'asset_types': [at.as_object() for at in asset_types]})


@login_required
def assets_status_value_list(request):
    """
    List all of the asset status values
    """
    return JsonResponse({'values': [v.as_object() for v in AssetStatusValue.objects.all()]})


@login_required
@asset_is_recorder
def assets_ui(request, asset):
    """
    Present UI for an Asset
    """
    return render(request, 'assets/ui.html', {'assetId': asset.pk, 'assetName': asset.name})


@login_required
def asset_details(request, asset_id):
    """
    Provide the details of an asset
    """
    asset = get_object_or_404(Asset, pk=asset_id)

    data = {
        'asset_id': asset.pk,
        'name': asset.name,
        'asset_type': asset.asset_type.name,
        'owner': str(asset.owner)
    }

    data['last_command'] = AssetCommand.last_command_for_asset_to_json(asset)

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


@login_required
@mission_is_member
def asset_command_set(request, mission_user):
    """
    Set the command for a given asset.
    """
    form = None
    if request.method == 'POST':
        form = AssetCommandForm(request.POST, mission=mission_user.mission)
        if form.is_valid():
            point = None
            if form.cleaned_data['command'] in AssetCommand.REQUIRES_POSITION:
                latitude = request.POST.get('latitude')
                longitude = request.POST.get('longitude')
                try:
                    point = Point(float(longitude), float(latitude))
                except (ValueError, TypeError):
                    return HttpResponseBadRequest('Invalid lat/long')
            asset_command = AssetCommand(asset=form.cleaned_data['asset'], command=form.cleaned_data['command'], issued_by=request.user, reason=form.cleaned_data['reason'], position=point, mission=mission_user.mission)
            asset_command.save()
            return HttpResponse("Created")

    if form is None:
        form = AssetCommandForm(mission=mission_user.mission)

    return render(request, 'asset-command-form.html', {'form': form})


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


@method_decorator(login_required, name="dispatch")
@method_decorator(asset_is_operator, name="dispatch")
class AssetCommandView(View):
    """
    View the current asset command
    """
    def as_json(self, request, asset):
        """
        Return the current asset command as json
        """
        asset_command = AssetCommand.last_command_for_asset_to_json(asset)
        if asset_command is None:
            return HttpResponseNotFound()
        data = {
            'command': asset_command,
        }
        return JsonResponse(data)

    def get(self, request, asset):
        """
        Get the current asset command
        """
        return self.as_json(request, asset)

    def post(self, request, asset):
        """
        Allow setting the asset command response
        """
        command_id = request.POST.get('command_id')
        print(f'command_id = {command_id}')
        asset_command = get_object_or_404(AssetCommand, pk=command_id, asset=asset)
        type_str = request.POST.get('type')
        message = request.POST.get('message')
        if asset_command.responded_at is None:
            asset_command.responded_at = timezone.now()
            asset_command.responded_by = request.user
            asset_command.response_message = message
            asset_command.response_type = type_str
            asset_command.save()
        return self.as_json(request, asset)


@login_required
def asset_status(request, asset_id):
    """
    Get or set the asset status for a given asset
    """
    asset = get_object_or_404(Asset, pk=asset_id)

    if request.method == 'GET':
        status = AssetStatus.current_for_asset(asset)
        if status:
            return JsonResponse(status.as_object())
        return JsonResponse({})
    if request.method == 'POST':
        if not (asset.owner == request.user or organization_user_is_asset_recorder(request.user, asset)):
            return HttpResponseForbidden()
        value_id = request.POST.get('value_id')
        status_value = get_object_or_404(AssetStatusValue, pk=value_id)
        notes = request.POST.get('notes')
        status = AssetStatus.objects.create(status=status_value, asset=asset, notes=notes)
        return JsonResponse(status.as_object())

    return HttpResponseBadRequest()
