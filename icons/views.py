from django.http import JsonResponse, FileResponse
from django.shortcuts import render, get_object_or_404
from django.views import View
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator

from .models import Icon


@method_decorator(login_required, name="dispatch")
class IconIndex(View):
    def as_json(self, request):
        data = {
            'icons': [icon.as_json() for icon in Icon.objects.all()],
        }
        return JsonResponse(data)

    def get(self, request):
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(request)
        return render(request, "icons/list.html")


@method_decorator(login_required, name="dispatch")
class IconView(View):
    def get(self, request, icon_id):
        icon = get_object_or_404(Icon, pk=icon_id)

        return FileResponse(open(f'icons/images/{icon.id}/{icon.filename}', 'rb'), filename=f'icon-{icon.pk}-{icon.filename}')
