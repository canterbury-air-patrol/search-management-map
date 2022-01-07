from django.db import migrations, models
import django.contrib.gis.db.models


def forward_func(apps, schema_editor):
    LineStringTimeLabel = apps.get_model('data', 'LineStringTimeLabel')
    GeoTimeLabel = apps.get_model('data', 'GeoTimeLabel')
    TrackLineSearch = apps.get_model('search', 'TrackLineSearch')
    TrackLineCreepingSearch = apps.get_model('search', 'TrackLineCreepingSearch')
    for lstl in LineStringTimeLabel.objects.all():
        # Create the new data in geotimelabel table
        gtl = GeoTimeLabel(geo=lstl.line, created_by=lstl.creator, created_at=lstl.timestamp, mission=lstl.mission, label=lstl.label, geo_type='line')
        gtl.save()
        lstl.gtl = gtl
        lstl.save()
        # Find any searches that reference this lstl
        for search in TrackLineSearch.objects.filter(old_datum=lstl):
            search.datum = gtl
            search.save()
        for search in TrackLineCreepingSearch.objects.filter(old_datum=lstl):
            search.datum = gtl
            search.save()
    # Circle back to update the replaced by references
    for ptl in LineStringTimeLabel.objects.filter(replaced_by__isnull=False):
        gtl = ptl.gtl
        gtl.replaced_by = ptl.replaced_by.gtl
        gtl.replaced_at = ptl.replaced_by.timestamp
        gtl.save()


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0014_migrate_pointtimelabel'),
    ]

    operations = [
        migrations.AddField(
            model_name='linestringtimelabel',
            name='gtl',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='replaced_by_gtl', to='data.GeoTimeLabel')),
        migrations.RunPython(forward_func),
    ]