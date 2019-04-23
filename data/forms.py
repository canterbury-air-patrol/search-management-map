"""
Forms for data
"""
from django import forms

from assets.models import Asset


class UploadTyphoonData(forms.Form):
    """
    A form for selecting the asset and file to upload
    used when a user is uploading data for a Typhoon H.
    """
    asset = forms.ModelChoiceField(queryset=Asset.objects.all())
    telemetry = forms.FileField()
