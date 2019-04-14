from django import forms

from assets.models import Asset


class UploadTyphoonData(forms.Form):
    asset = forms.ModelChoiceField(queryset=Asset.objects.all())
    telemetry = forms.FileField()
