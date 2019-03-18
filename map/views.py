from django.shortcuts import render


def map_main(request):
    return render(request, 'map_main.html', {})
