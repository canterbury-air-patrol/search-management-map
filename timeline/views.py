"""
Timeline views
"""
import json

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.decorators import method_decorator
from django.views import View

from mission.decorators import mission_is_member, mission_open_required
from .helpers import can_change_timeline_entry
from .models import TimeLineEntry


@method_decorator(login_required, name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
class MissionTimelineEntryView(View):
    """
    Update or delete manual timeline entries.
    """
    @staticmethod
    def _can_change_entry(mission_user, entry):
        """
        Return whether the mission user can change a manual timeline entry.
        """
        return can_change_timeline_entry(mission_user, entry)

    @staticmethod
    def _get_manual_entry(mission_user, entry_id):
        """
        Return a manual timeline entry in this mission, or an error response.
        """
        entry = get_object_or_404(TimeLineEntry, pk=entry_id, mission=mission_user.mission)
        if entry.event_type != 'usr':
            return None, HttpResponseForbidden("Only manual timeline entries can be changed")
        if not MissionTimelineEntryView._can_change_entry(mission_user, entry):
            return None, HttpResponseForbidden("You cannot change this timeline entry")
        return entry, None

    @staticmethod
    def _parse_patch_timestamp(timestamp_raw):
        """
        Parse a timestamp supplied by a timeline entry patch.
        """
        if not isinstance(timestamp_raw, str):
            return None
        timestamp = parse_datetime(timestamp_raw)
        if timestamp is None:
            return None
        if timezone.is_naive(timestamp):
            return timezone.make_aware(timestamp, timezone.get_current_timezone())
        return timestamp

    @staticmethod
    def _patch_body(request):
        """
        Return a JSON object request body, or an error response.
        """
        try:
            body = json.loads(request.body)
        except ValueError:
            return None, HttpResponseBadRequest('Expected JSON body')
        if not isinstance(body, dict):
            return None, HttpResponseBadRequest('Expected JSON object')
        return body, None

    @staticmethod
    def _apply_patch(entry, body):
        """
        Apply validated patch data to the manual timeline entry.
        """
        updated_fields = []
        if 'timestamp' in body:
            timestamp = MissionTimelineEntryView._parse_patch_timestamp(body['timestamp'])
            if timestamp is None:
                return HttpResponseBadRequest("Invalid timestamp")
            entry.timestamp = timestamp
            updated_fields.append('timestamp')
        if 'message' in body:
            if not isinstance(body['message'], str) or not body['message'].strip():
                return HttpResponseBadRequest("Message is required")
            entry.message = body['message']
            updated_fields.append('message')
        if 'url' in body:
            if body['url'] is not None and not isinstance(body['url'], str):
                return HttpResponseBadRequest("URL must be text")
            entry.url = body['url'] or ''
            updated_fields.append('url')
        if updated_fields:
            entry.save(update_fields=updated_fields)
        return None

    @mission_open_required
    def patch(self, request, mission_user, entry_id):
        """
        Update a manual timeline entry.
        """
        entry, error = self._get_manual_entry(mission_user, entry_id)
        if error is not None:
            return error
        body, error = self._patch_body(request)
        if error is not None:
            return error
        error = self._apply_patch(entry, body)
        if error is not None:
            return error
        return JsonResponse({'status': 'updated'})

    @mission_open_required
    def delete(self, request, mission_user, entry_id):
        """
        Delete a manual timeline entry.
        """
        entry, error = self._get_manual_entry(mission_user, entry_id)
        if error is not None:
            return error
        entry.delete()
        return HttpResponse(status=204)
