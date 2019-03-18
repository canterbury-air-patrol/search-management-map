from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def map_main(request):
    return render(request, 'map_main.html', {})
