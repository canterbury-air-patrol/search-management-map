"""
Models for timeline
"""

from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model


class TimeLineEntry(models.Model):
    """
    An entry in the timeline
    """
    mission = models.ForeignKey("mission.Mission", on_delete=models.PROTECT)
    user = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='creator%(app_label)s_%(class)s_related')
    timestamp = models.DateTimeField(default=timezone.now)

    EVENT_TYPE = (
        ('add', "Added/Created an Object"),
        ('del', "Removed an Object"),
        ('upd', "Updated/Edited an Object"),
        ('sbg', "Asset Started Search"),
        ('snd', "Asset Finished Search"),
        ('usr', "User defined Event"),
        ('oad', "Organization added to mission"),
        ('oup', "Organization updated"),
        ('orm', "Organization removed from mission"),
        ('uad', "User added to mission"),
        ('uup', "User updated"),
        ('aad', "Asset added to mission"),
        ('arm', "Asset removed from mission"),
        ('ipc', "Image priority changed"),
        ('que', 'Search was Queued or Dequeued'),
        ('mas', 'Mission Asset Status'),
        ('acs', 'Asset Command Sent'),
        ('acr', 'Asset Command Response'),
    )
    event_type = models.CharField(max_length=3, choices=EVENT_TYPE)

    def event_type_str(self):
        """
        Convert the event type to a human-readable string
        """
        return next(
            (row[1] for row in self.EVENT_TYPE if row[0] == self.event_type),
            "Unknown",
        )

    message = models.TextField()

    url = models.TextField(blank=True, null=True)

    def as_object(self):
        """
        Return the timeline entry as an object
        """
        return {
            'id': self.pk,
            'creator': self.user.username,  # pylint: disable=E1101
            'timestamp': self.timestamp,
            'event_type': self.event_type_str(),
            'message': self.message,
            'url': self.url,
        }
