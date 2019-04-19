from django import forms

from assets.models import Asset


class AssetSelectorForm(forms.Form):
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user')
        super(AssetSelectorForm, self).__init__(*args, **kwargs)
        self.fields['asset'].queryset = Asset.objects.filter(owner=self.user)

    asset = forms.ModelChoiceField(queryset=Asset.objects.all())
