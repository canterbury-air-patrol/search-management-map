# Generated by Django 4.1.9 on 2023-05-09 11:16

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("organization", "0002_alter_organizationmember_role"),
    ]

    operations = [
        migrations.AlterField(
            model_name="organizationmember",
            name="role",
            field=models.CharField(
                choices=[
                    ("M", "Member"),
                    ("A", "Admin"),
                    ("R", "Radio Operator"),
                    ("b", "Asset Bridge/Recorder"),
                ],
                default="M",
                max_length=1,
            ),
        ),
    ]
