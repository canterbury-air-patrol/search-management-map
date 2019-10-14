# Generated by Django 2.2.6 on 2019-10-10 09:26

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('mission', '0001_initial'),
        ('data', '0009_auto_20190428_0514'),
    ]

    operations = [
        migrations.AddField(
            model_name='assetpointtime',
            name='mission',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='mission.Mission'),
        ),
        migrations.AddField(
            model_name='linestringtimelabel',
            name='mission',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='mission.Mission'),
        ),
        migrations.AddField(
            model_name='pointtimelabel',
            name='mission',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='mission.Mission'),
        ),
        migrations.AddField(
            model_name='polygontimelabel',
            name='mission',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='mission.Mission'),
        ),
    ]
