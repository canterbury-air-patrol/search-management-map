from django.conf import settings
import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('images', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(model_name='geoimage', old_name='timestamp', new_name='created_at'),
        migrations.RenameField(model_name='geoimage', old_name='point', new_name='geo'),
        migrations.RenameField(model_name='geoimage', old_name='creator', new_name='created_by'),
        migrations.AddField(
            model_name='geoimage',
            name='alt',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='geoimage',
            name='replaced_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='geoimage',
            name='geo',
            field=django.contrib.gis.db.models.fields.GeometryField(geography=True, srid=4326),
        ),
        migrations.RemoveField(
            model_name='geoimage',
            name='deleted',
        ),
        migrations.AlterField(
            model_name='geoimage',
            name='created_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='created_byimages_geoimage_related', to=settings.AUTH_USER_MODEL),
        ),
    ]
