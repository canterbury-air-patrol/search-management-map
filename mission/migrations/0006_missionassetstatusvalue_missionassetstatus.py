# Generated by Django 5.0.6 on 2024-05-29 08:34

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mission", "0005_missionorganization"),
    ]

    operations = [
        migrations.CreateModel(
            name="MissionAssetStatusValue",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=30, unique=True)),
                ("description", models.TextField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="MissionAssetStatus",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("since", models.DateTimeField(default=django.utils.timezone.now)),
                ("notes", models.TextField(blank=True, null=True)),
                (
                    "mission_asset",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="mission.missionasset",
                    ),
                ),
                (
                    "status",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="mission.missionassetstatusvalue",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(
                        fields=["mission_asset"], name="mission_mis_mission_da6947_idx"
                    ),
                    models.Index(fields=["since"], name="mission_mis_since_1dcbf5_idx"),
                ],
            },
        ),
    ]