from django.conf import settings
from django.db import migrations, models
import django.contrib.gis.db.models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0012_assetpointtime'),
    ]

    operations = [
        migrations.CreateModel(
            name='GeoTimeLabel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('geo', django.contrib.gis.db.models.fields.GeometryField(geography=True, srid=4326)),
                ('alt', models.IntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('replaced_at', models.DateTimeField(blank=True, null=True)),
                ('label', models.TextField()),
                ('geo_type', models.CharField(choices=[('poi', 'Point of Interest'), ('line', 'Line'), ('polygon', 'Area')], max_length=10)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='created_bydata_geotimelabel_related', to=settings.AUTH_USER_MODEL)),
                ('deleted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='deletordata_geotimelabel_related', to=settings.AUTH_USER_MODEL)),
                ('mission', models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='mission.Mission')),
                ('replaced_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='data.GeoTimeLabel')),
            ],
        ),
        migrations.AddIndex(
            model_name='geotimelabel',
            index=models.Index(fields=['mission', 'geo_type', 'deleted_at', 'replaced_at', 'created_at'], name='data_geotim_mission_f8e195_idx'),
        ),
    ]
