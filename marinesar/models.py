"""
Models for marine sar tools
"""

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from data.models import GeoTime, GeoTimeLabel


class MarineTotalDriftVector(GeoTime):
    """
    A Marine Total Drift Vector Calculation
    """
    datum = models.ForeignKey(GeoTimeLabel, on_delete=models.PROTECT)

    leeway_multiplier = models.FloatField(validators=[MinValueValidator(0.0)])
    leeway_modifier = models.FloatField(validators=[MinValueValidator(0.0)])

    GEOJSON_FIELDS = (
        'pk',
        'created_at',
        'datum',
        'leeway_multiplier',
        'leeway_modifier',
    )


class MarineTotalDriftVectorCurrent(models.Model):
    """
    Current Vector for Total Drift
    """
    total_drift = models.ForeignKey(MarineTotalDriftVector, on_delete=models.PROTECT)
    order = models.IntegerField(validators=[MinValueValidator(0)])
    start_time = models.TimeField()
    end_time = models.TimeField()
    direction = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(359)])
    speed = models.FloatField(validators=[MinValueValidator(0.0)])

    class Meta:
        unique_together = [['total_drift', 'order']]
        indexes = [
            models.Index(fields=['total_drift', 'order'])
        ]


class MarineTotalDriftVectorWind(models.Model):
    """
    Wind Vector for Total Drift
    """
    total_drift = models.ForeignKey(MarineTotalDriftVector, on_delete=models.PROTECT)
    order = models.IntegerField(validators=[MinValueValidator(0)])
    start_time = models.TimeField()
    end_time = models.TimeField()
    wind_from_direction = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(359)])
    wind_speed = models.FloatField(validators=[MinValueValidator(0.0)])

    class Meta:
        unique_together = [['total_drift', 'order']]
        indexes = [
            models.Index(fields=['total_drift', 'order'])
        ]
