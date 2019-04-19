from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from .forms import AssetSelectorForm


@login_required
def map_main(request):
    return render(request, 'map_main.html', {})


@login_required
def recording(request):
    data = {
        'form': AssetSelectorForm(user=request.user),
    }
    return render(request, 'recorder.html', data)
