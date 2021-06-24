"""
Views for marinesar

These views should only relate to presentation of the UI
"""

from django.db import connection as dbconn
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import GEOSGeometry, LineString, Point
from django.shortcuts import render

from data.view_helpers import to_geojson
from mission.decorators import mission_is_member

from .models import MarineTotalDriftVector


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


@login_required
@mission_is_member
def marine_vectors_create(request, mission_user):
    """
    Create a Marine Total Drift Vector
    """
    if request.method == "GET":
        print(request.GET)
        vectors = []
        lat = request.GET['from_lat']
        lng = request.GET['from_lng']
        start_point = Point(float(lng), float(lat))
        curr_count = int(request.GET['curr_total'])
        for i in range(0, curr_count):
            bearing = request.GET['curr_{}_direction'.format(i)]
            distance = float(request.GET['curr_{}_distance'.format(i)]) * 1852
            vectors.append({'bearing': bearing, 'distance': distance})
        wind_count = int(request.GET['wind_total'])
        for i in range(0, wind_count):
            bearing = request.GET['wind_{}_direction'.format(i)]
            distance = float(request.GET['wind_{}_distance'.format(i)]) * 1852
            vectors.append({'bearing': bearing, 'distance': distance})

    points = [start_point]
    current_point = start_point
    for vector in vectors:
        query = "SELECT ST_Project(ST_SetSRID(ST_Point(" + str(current_point.x) + ", " + str(current_point.y) + "), 4326)::geography, {distance}, radians({bearing}))".format(**vector)
        cursor = dbconn.cursor()
        cursor.execute(query)
        reference_points = cursor.fetchone()

        current_point = GEOSGeometry(reference_points[0])
        points.append(current_point)

    total_drift_vector = MarineTotalDriftVector(geo=LineString(points))

    return to_geojson(MarineTotalDriftVector, [total_drift_vector])


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
