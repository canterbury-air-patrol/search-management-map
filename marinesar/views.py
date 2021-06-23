"""
Views for marinesar

These views should only relate to presentation of the UI
"""

from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from mission.decorators import mission_is_member

@login_required
@mission_is_member
def marine_vectors(request, mission_user):
    data = {
        'mission': mission_user.mission,
    }
    return render(request, 'marinesar_vectors.html', data)
