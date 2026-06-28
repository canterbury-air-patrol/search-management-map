"""
Views for marinesar

These views should only relate to presentation of the UI
"""

from django.core.exceptions import PermissionDenied
from django.db import connection as dbconn
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import GEOSGeometry, LineString, Point
from django.http import HttpResponseNotFound, HttpResponse
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View

from data.decorators import data_get_mission_id
from data.models import GeoTimeLabel
from data.view_helpers import to_geojson
from mission.decorators import mission_is_member, mission_open_required

from .decorators import total_drift_from_type_id
from .models import MarineTotalDriftVector, MarineTotalDriftVectorCurrent, MarineTotalDriftVectorWind


def convert_time(time_value):
    """
    Convert user-entered time into supported format (i.e. inject :)
    """
    if ':' in time_value:
        return time_value
    return f'{time_value[:2]}:{time_value[2:4]}'


@login_required
@mission_is_member
def marine_vectors(request, mission_user):
    """
    Show the Marine Total Drift Vector calculation sheet
    """
    data = {
        'mission': mission_user.mission,
    }

    return render(request, 'marinesar_vectors.html', data)


@method_decorator(login_required, name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
class MarineVectorCreateView(View):
    """Create a Marine Total Drift Vector (GET previews, POST saves)."""

    def _compute_vector(self, user_data, mission_user, save):  # pylint: disable=R0914,R0915
        """Build the drift vector from user_data; persist it if save=True."""
        if mission_user.mission.is_closed():
            raise PermissionDenied("This mission is closed")
        vectors = []
        current_vectors = []
        wind_vectors = []
        poi_id = user_data.get('poi_id')
        # Scope the datum lookup to the current mission so a POI from another
        # mission cannot be attached as the datum (cross-mission data leakage).
        poi = get_object_or_404(GeoTimeLabel, pk=poi_id, geo_type='poi', mission=mission_user.mission)
        lat = user_data.get('from_lat')
        lng = user_data.get('from_lng')
        start_point = Point(float(lng), float(lat))
        leeway_multiplier = float(user_data.get('leeway_multiplier'))
        leeway_modifier = float(user_data.get('leeway_modifier'))
        curr_count = int(user_data.get('curr_total'))
        for i in range(curr_count):
            time_from = user_data.get(f'curr_{i}_from')
            time_to = user_data.get(f'curr_{i}_to')
            bearing = int(user_data.get(f'curr_{i}_direction'))
            distance = float(user_data.get(f'curr_{i}_distance')) * 1852
            speed = float(user_data.get(f'curr_{i}_speed'))
            vector = {'order': i + 1, 'from': time_from, 'to': time_to, 'bearing': bearing, 'speed': speed, 'distance': distance}
            current_vectors.append(vector)
            vectors.append(vector)
        wind_count = int(user_data.get('wind_total'))
        for i in range(wind_count):
            time_from = user_data.get(f'wind_{i}_from')
            time_to = user_data.get(f'wind_{i}_to')
            wind_from = user_data.get(f'wind_{i}_from_direction')
            wind_speed = float(user_data.get(f'wind_{i}_speed'))
            bearing = int(user_data.get(f'wind_{i}_direction'))
            distance = float(user_data.get(f'wind_{i}_distance')) * 1852
            vector = {'order': i + 1, 'from': time_from, 'to': time_to, 'wind_direction_from': wind_from, 'speed': wind_speed, 'bearing': bearing, 'distance': distance}
            wind_vectors.append(vector)
            vectors.append(vector)
        points = [start_point]
        current_point = start_point
        query = (
            "SELECT ST_Project("
            "ST_SetSRID(ST_Point(%s, %s), 4326)::geography, %s, radians(%s)"
            ")"
        )
        for vector in vectors:
            with dbconn.cursor() as cursor:
                cursor.execute(query, [
                    float(current_point.x),
                    float(current_point.y),
                    float(vector['distance']),
                    float(vector['bearing'])
                ])
                reference_points = cursor.fetchone()
            current_point = GEOSGeometry(reference_points[0])
            points.append(current_point)
        total_drift_vector = MarineTotalDriftVector(
            geo=LineString(points), leeway_multiplier=leeway_multiplier, leeway_modifier=leeway_modifier,
            mission=mission_user.mission, created_by=mission_user.user, created_at=timezone.now(), datum=poi,
        )
        if save:
            total_drift_vector.save()
            for current in current_vectors:
                start_time = convert_time(str(current['from']))
                end_time = convert_time(str(current['to']))
                MarineTotalDriftVectorCurrent(total_drift=total_drift_vector, order=current['order'], start_time=start_time, end_time=end_time, direction=current['bearing'], speed=current['speed']).save()
            for wind in wind_vectors:
                start_time = convert_time(str(wind['from']))
                end_time = convert_time(str(wind['to']))
                MarineTotalDriftVectorWind(total_drift=total_drift_vector, order=wind['order'], start_time=start_time, end_time=end_time, wind_from_direction=wind['wind_direction_from'], wind_speed=wind['speed']).save()
        return total_drift_vector

    def get(self, request, mission_user):
        """Preview drift vector without saving."""
        return to_geojson(MarineTotalDriftVector, [self._compute_vector(request.GET, mission_user, save=False)])

    def post(self, request, mission_user):
        """Compute and save drift vector."""
        return to_geojson(MarineTotalDriftVector, [self._compute_vector(request.POST, mission_user, save=True)])


@method_decorator(login_required, name="dispatch")
@method_decorator(total_drift_from_type_id, name="dispatch")
@method_decorator(data_get_mission_id('tdv'), name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
class MarineVectorDetailView(View):
    """Get or delete a specific Marine Total Drift Vector."""

    def get(self, request, tdv, mission_user):  # pylint: disable=unused-argument
        """Return the vector as GeoJSON."""
        return to_geojson(MarineTotalDriftVector, [tdv])

    @mission_open_required
    def delete(self, request, tdv, mission_user):
        """Delete the vector."""
        if not tdv.delete(mission_user.user):
            if tdv.deleted_at:
                return HttpResponseNotFound("Drift Vector has already been deleted")
            if tdv.replaced_by is not None:
                return HttpResponseNotFound("Drift Vector has been replaced")
        return HttpResponse('Deleted')


@login_required
@mission_is_member
def marine_vectors_all(request, mission_user):
    """
    Get all the current Total Drift Vectors as geojson
    """
    return to_geojson(MarineTotalDriftVector, MarineTotalDriftVector.all_current(mission_user.mission))


@login_required
def marine_vectors_all_user(request, current_only):
    """
    Get all the current Total Drift Vectors as geojson (for all missions)
    """
    return to_geojson(MarineTotalDriftVector, MarineTotalDriftVector.all_current_user(request.user, current_only=current_only))


@login_required
@mission_is_member
def marine_sac(request, mission_user):
    """
    Show the Marine Search Area Calculation Sheet
    """
    data = {
        'mission': mission_user.mission,
    }

    return render(request, 'marinesar_sac.html', data)
