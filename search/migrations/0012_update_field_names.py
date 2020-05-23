from django.conf import settings
import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('search', '0011_auto_20200521_2225'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='expandingboxsearch',
            name='search_expa_deleted_61c18d_idx',
        ),
        migrations.RemoveIndex(
            model_name='polygonsearch',
            name='search_poly_deleted_7741f9_idx',
        ),
        migrations.RemoveIndex(
            model_name='sectorsearch',
            name='search_sect_deleted_93cc3d_idx',
        ),
        migrations.RemoveIndex(
            model_name='tracklinecreepingsearch',
            name='search_trac_deleted_fc74fa_idx',
        ),
        migrations.RemoveIndex(
            model_name='tracklinesearch',
            name='search_trac_deleted_302cee_idx',
        ),
        migrations.RenameField(model_name='sectorsearch', old_name='timestamp', new_name='created_at'),
        migrations.RenameField(model_name='sectorsearch', old_name='line', new_name='geo'),
        migrations.RenameField(model_name='sectorsearch', old_name='creator', new_name='created_by'),
        migrations.RenameField(model_name='sectorsearch', old_name='datum', new_name='old_datum'),
        migrations.RunSQL(sql="ALTER INDEX search_sectorsearch_datum_id_dda41ace RENAME TO search_sectorsearch_old_datum_id_dda41ace"),
        migrations.AddField(
            model_name='sectorsearch',
            name='replaced_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='sectorsearch',
            name='geo',
            field=django.contrib.gis.db.models.fields.GeometryField(geography=True, srid=4326),
        ),
        migrations.RemoveField(
            model_name='sectorsearch',
            name='deleted',
        ),
        migrations.AlterField(
            model_name='sectorsearch',
            name='created_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='created_bysearch_sectorsearch_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.RenameField(model_name='expandingboxsearch', old_name='timestamp', new_name='created_at'),
        migrations.RenameField(model_name='expandingboxsearch', old_name='line', new_name='geo'),
        migrations.RenameField(model_name='expandingboxsearch', old_name='creator', new_name='created_by'),
        migrations.RenameField(model_name='expandingboxsearch', old_name='datum', new_name='old_datum'),
        migrations.RunSQL(sql="ALTER INDEX search_expandingboxsearch_datum_id_81e8068a RENAME TO search_expandingboxsearch_old_datum_id_81e8068a"),
        migrations.AddField(
            model_name='expandingboxsearch',
            name='replaced_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='expandingboxsearch',
            name='geo',
            field=django.contrib.gis.db.models.fields.GeometryField(geography=True, srid=4326),
        ),
        migrations.RemoveField(
            model_name='expandingboxsearch',
            name='deleted',
        ),
        migrations.AlterField(
            model_name='expandingboxsearch',
            name='created_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='created_bysearch_expandingboxsearch_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.RenameField(model_name='tracklinesearch', old_name='timestamp', new_name='created_at'),
        migrations.RenameField(model_name='tracklinesearch', old_name='line', new_name='geo'),
        migrations.RenameField(model_name='tracklinesearch', old_name='creator', new_name='created_by'),
        migrations.RenameField(model_name='tracklinesearch', old_name='datum', new_name='old_datum'),
        migrations.RunSQL(sql="ALTER INDEX search_tracklinesearch_datum_id_6f9daedc RENAME TO search_tracklinesearch_old_datum_id_6f9daedc"),
        migrations.AddField(
            model_name='tracklinesearch',
            name='replaced_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='tracklinesearch',
            name='geo',
            field=django.contrib.gis.db.models.fields.GeometryField(geography=True, srid=4326),
        ),
        migrations.RemoveField(
            model_name='tracklinesearch',
            name='deleted',
        ),
        migrations.AlterField(
            model_name='tracklinesearch',
            name='created_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='created_bysearch_tracklinesearch_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.RenameField(model_name='tracklinecreepingsearch', old_name='timestamp', new_name='created_at'),
        migrations.RenameField(model_name='tracklinecreepingsearch', old_name='line', new_name='geo'),
        migrations.RenameField(model_name='tracklinecreepingsearch', old_name='creator', new_name='created_by'),
        migrations.RenameField(model_name='tracklinecreepingsearch', old_name='datum', new_name='old_datum'),
        migrations.RunSQL(sql="ALTER INDEX search_tracklinecreepingsearch_datum_id_4c5ab4f4 RENAME TO search_tracklinecreepingsearch_old_datum_id_4c5ab4f4"),
        migrations.AddField(
            model_name='tracklinecreepingsearch',
            name='replaced_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='tracklinecreepingsearch',
            name='geo',
            field=django.contrib.gis.db.models.fields.GeometryField(geography=True, srid=4326),
        ),
        migrations.RemoveField(
            model_name='tracklinecreepingsearch',
            name='deleted',
        ),
        migrations.AlterField(
            model_name='tracklinecreepingsearch',
            name='created_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='created_bysearch_tracklinecreepingsearch_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.RenameField(model_name='polygonsearch', old_name='timestamp', new_name='created_at'),
        migrations.RenameField(model_name='polygonsearch', old_name='line', new_name='geo'),
        migrations.RenameField(model_name='polygonsearch', old_name='creator', new_name='created_by'),
        migrations.RenameField(model_name='polygonsearch', old_name='datum', new_name='old_datum'),
        migrations.RunSQL(sql="ALTER INDEX search_polygonsearch_datum_id_100fbeff RENAME TO search_polygonsearch_old_datum_id_100fbeff"),
        migrations.AddField(
            model_name='polygonsearch',
            name='replaced_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='polygonsearch',
            name='geo',
            field=django.contrib.gis.db.models.fields.GeometryField(geography=True, srid=4326),
        ),
        migrations.RemoveField(
            model_name='polygonsearch',
            name='deleted',
        ),
        migrations.AlterField(
            model_name='polygonsearch',
            name='created_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='created_bysearch_polygonsearch_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='expandingboxsearch',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='expandingboxsearch',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='deletorsearch_expandingboxsearch_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='polygonsearch',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='polygonsearch',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='deletorsearch_polygonsearch_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='sectorsearch',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sectorsearch',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='deletorsearch_sectorsearch_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='tracklinecreepingsearch',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='tracklinecreepingsearch',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='deletorsearch_tracklinecreepingsearch_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='tracklinesearch',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='tracklinesearch',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='deletorsearch_tracklinesearch_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='expandingboxsearch',
            name='alt',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='polygonsearch',
            name='alt',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sectorsearch',
            name='alt',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='tracklinecreepingsearch',
            name='alt',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='tracklinesearch',
            name='alt',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
