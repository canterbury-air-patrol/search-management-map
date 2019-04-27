"""
Forms for assets
"""
from django.forms import ModelForm

from .models import AssetCommand


class AssetCommandForm(ModelForm):
    """
    Form for letting user set the next command for an asset
    The UI presenting this needs to provide a way to select the position
    (when the command is one that requires a position)
    """
    class Meta:
        model = AssetCommand
        fields = ['asset', 'command', 'reason']
