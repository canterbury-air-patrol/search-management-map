from django.conf import settings
from django.db import migrations, models
from django.contrib.gis.geos import Point
import django.contrib.gis.db.models


def forward_func(apps, schema_editor):
    ExpandingBoxSearch = apps.get_model('search', 'ExpandingBoxSearch')
    Search = apps.get_model('search', 'Search')
    for search in ExpandingBoxSearch.objects.all():
        # Create the new data in search table
        new_search = Search(
            geo=search.geo,
            created_at=search.created_at,
            deleted_at=search.deleted_at,
            replaced_at=search.replaced_at,
            sweep_width=search.sweep_width,
            completed_at=search.completed_at,
            created_by=search.created_by,
            created_for=search.created_for,
            datum=search.datum,
            deleted_by=search.deleted_by,
            inprogress_by=search.inprogress_by,
            mission=search.mission,
            queued_for_asset=search.queued_for_asset,
            queued_for_assettype=search.queued_for_assettype,
            search_type='Expanding Box',
            iterations=search.iterations,
            first_bearing=search.first_bearing,
            )
        new_search.save()

class Migration(migrations.Migration):

    dependencies = [
        ('search', '0019_migrate_sector'),
    ]

    operations = [
        migrations.RunPython(forward_func),
    ]