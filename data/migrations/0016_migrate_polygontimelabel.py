from django.db import migrations, models
import django.contrib.gis.db.models


def forward_func(apps, schema_editor):
    PolygonTimeLabel = apps.get_model('data', 'PolygonTimeLabel')
    GeoTimeLabel = apps.get_model('data', 'GeoTimeLabel')
    PolygonSearch = apps.get_model('search', 'PolygonSearch')
    for ptl in PolygonTimeLabel.objects.all():
        # Create the new data in geotimelabel table
        gtl = GeoTimeLabel(geo=ptl.polygon, created_by=ptl.creator, created_at=ptl.timestamp, deleted_at=ptl.deleted_at, deleted_by=ptl.deleted_by, mission=ptl.mission, label=ptl.label, geo_type='line')
        gtl.save()
        ptl.gtl = gtl
        ptl.save()
        # Find any searches that reference this ptl
        for search in PolygonSearch.objects.filter(old_datum=ptl):
            search.datum = gtl
            search.save()
    # Circle back to update the replaced by references
    for ptl in PolygonTimeLabel.objects.filter(replaced_by__isnull=False):
        gtl = ptl.gtl
        gtl.replaced_by = ptl.replaced_by.gtl
        gtl.replaced_at = ptl.replaced_by.timestamp
        gtl.save()


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0015_migrate_linestringlabel'),
    ]

    operations = [
        migrations.AddField(
            model_name='polygontimelabel',
            name='gtl',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='replaced_by_gtl', to='data.GeoTimeLabel')),
        migrations.RunPython(forward_func),
    ]