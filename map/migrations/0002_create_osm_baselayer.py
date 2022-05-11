from django.db import migrations

def forward_func(apps, schema_editor):
    MapTileLayer = apps.get_model('map', 'MapTileLayer')
    if len(MapTileLayer.objects.filter(base=True, relativeOrder=1)) == 0:
        MapTileLayer(name='Open Street Map',
                     url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                     base=True,
                     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                     subdomains='',
                     relativeOrder=1).save()

class Migration(migrations.Migration):

    dependencies = [
        ('map', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(forward_func),
    ]