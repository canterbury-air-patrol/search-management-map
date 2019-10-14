"""
Forms for missions
"""
from django.forms import ModelForm

from .models import Mission


class MissionForm(ModelForm):
    """
    Form for creating a new mission
    """
    class Meta:
        model = Mission
        fields = ['mission_name']
