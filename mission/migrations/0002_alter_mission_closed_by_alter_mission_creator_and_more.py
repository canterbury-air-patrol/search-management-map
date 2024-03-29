# Generated by Django 4.0.1 on 2022-01-19 08:02

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('mission', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mission',
            name='closed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='closer%(app_label)s_%(class)s_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='mission',
            name='creator',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='creator%(app_label)s_%(class)s_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='missionasset',
            name='creator',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='creator%(app_label)s_%(class)s_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='missionasset',
            name='remover',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='remover%(app_label)s_%(class)s_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='missionassettype',
            name='creator',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='creator%(app_label)s_%(class)s_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='missionassettype',
            name='remover',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='remover%(app_label)s_%(class)s_related', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='missionuser',
            name='creator',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='creator%(app_label)s_%(class)s_related', to=settings.AUTH_USER_MODEL),
        ),
    ]
