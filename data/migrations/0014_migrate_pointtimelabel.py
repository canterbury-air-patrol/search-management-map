from django.db import migrations, models
import django.contrib.gis.db.models


def forward_func(apps, schema_editor):
    PointTimeLabel = apps.get_model('data', 'PointTimeLabel')
    GeoTimeLabel = apps.get_model('data', 'GeoTimeLabel')
    SectorSearch = apps.get_model('search', 'SectorSearch')
    ExpandingBoxSearch = apps.get_model('search', 'ExpandingBoxSearch')
    for ptl in PointTimeLabel.objects.all():
        # Create the new data in geotimelabel table
        gtl = GeoTimeLabel(geo=ptl.point, created_by=ptl.creator, created_at=ptl.timestamp, deleted_at=ptl.deleted_at, deleted_by=ptl.deleted_by, mission=ptl.mission, label=ptl.label, geo_type='poi')
        gtl.save()
        ptl.gtl = gtl
        ptl.save()
        # Find any searches that reference this ptl
        for search in SectorSearch.objects.filter(old_datum=ptl):
            search.datum = gtl
            search.save()
        for search in ExpandingBoxSearch.objects.filter(old_datum=ptl):
            search.datum = gtl
            search.save()
    # Circle back to update the replaced by references
    for ptl in PointTimeLabel.objects.filter(replaced_by__isnull=False):
        gtl = ptl.gtl
        gtl.replaced_by = ptl.replaced_by.gtl
        gtl.replaced_at = ptl.replaced_by.timestamp
        gtl.save()


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0013_geotimelabel'),
        ('search', '0013_add_datum'),
    ]

    operations = [
        migrations.AddField(
            model_name='pointtimelabel',
            name='gtl',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='replaced_by_gtl', to='data.GeoTimeLabel')),
        migrations.RunPython(forward_func),
    ]