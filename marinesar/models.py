"""
Models for marine sar tools
"""

from data.models import GeoTime


class MarineTotalDriftVector(GeoTime):
    """
    A Marine Total Drift Vector Calculation
    """

    GEOJSON_FIELDS = (
        'pk',
        'created_at',
    )
