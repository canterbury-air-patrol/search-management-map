"""
Forms for presenting the map interface
"""
from django import forms

from assets.models import Asset


class AssetSelectorForm(forms.Form):
    """
    A form that allows the user to select an asset from
    the list of assets they are the owner of.
    """
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user')
        super(AssetSelectorForm, self).__init__(*args, **kwargs)
        self.fields['asset'].queryset = Asset.objects.filter(owner=self.user)

    asset = forms.ModelChoiceField(queryset=Asset.objects.all())
