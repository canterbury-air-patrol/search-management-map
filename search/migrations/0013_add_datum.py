import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('search', '0012_update_field_names'),
        ('data', '0013_geotimelabel'),
    ]

    operations = [
        migrations.AddField(
            model_name='sectorsearch',
            name='datum',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='data.geotimelabel')),
        migrations.AddField(
            model_name='expandingboxsearch',
            name='datum',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='data.geotimelabel')),
        migrations.AddField(
            model_name='tracklinesearch',
            name='datum',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='data.geotimelabel')),
        migrations.AddField(
            model_name='tracklinecreepingsearch',
            name='datum',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='data.geotimelabel')),
        migrations.AddField(
            model_name='polygonsearch',
            name='datum',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='data.geotimelabel')),
    ]