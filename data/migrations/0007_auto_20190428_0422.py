# Generated by Django 2.2 on 2019-04-28 04:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0006_auto_20190328_1035'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='assetpointtime',
            index=models.Index(fields=['asset', '-timestamp'], name='data_assetp_asset_i_e48b42_idx'),
        ),
    ]
