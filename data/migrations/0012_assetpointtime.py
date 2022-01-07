from django.conf import settings
from django.db import migrations, models
import django.contrib.gis.db.models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0011_auto_20191010_2237'),
    ]

    operations = [
        migrations.RenameField(model_name='assetpointtime', old_name='timestamp', new_name='created_at'),
        migrations.RenameField(model_name='assetpointtime', old_name='point', new_name='geo'),
        migrations.RenameField(model_name='assetpointtime', old_name='creator', new_name='created_by'),
        migrations.AddIndex(
            model_name='assetpointtime',
            index=models.Index(fields=['mission', 'asset', '-created_at'], name='data_assetp_mission_e3730a_idx'),
        ),
        migrations.AddIndex(
            model_name='assetpointtime',
            index=models.Index(fields=['mission', 'asset', 'created_at'], name='data_assetp_mission_8c1e83_idx'),
        ),
        migrations.AlterField(
            model_name='assetpointtime',
            name='alt',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='assetpointtime',
            name='geo',
            field=django.contrib.gis.db.models.fields.GeometryField(geography=True, srid=4326),
        ),
        migrations.RemoveIndex(
            model_name='assetpointtime',
            name='data_assetp_mission_9f221a_idx',
        ),
        migrations.RemoveIndex(
            model_name='assetpointtime',
            name='data_assetp_mission_e07c17_idx',
        ),
        migrations.RemoveField(
            model_name='assetpointtime',
            name='deleted',
        ),
        migrations.AddField(
            model_name='assetpointtime',
            name='replaced_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='assetpointtime',
            name='created_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='created_bydata_assetpointtime_related', to=settings.AUTH_USER_MODEL),
        ),

    ]
