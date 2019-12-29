"""
Forms for images
"""
from django import forms


class UploadImageForm(forms.Form):
    """
    Allow the user to upload a geo-tagged image
    """
    file = forms.ImageField()
    description = forms.CharField()
    priority = forms.BooleanField(required=False)
