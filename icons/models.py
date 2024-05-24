from django.db import models

# Create your models here.


class Icon(models.Model):
    """
    An icon to show on the map
    i.e. for a specific asset or user
    """
    name = models.CharField(max_length=50)
    filename = models.CharField(max_length=255)

    def get_url(self):
        """
        Return the specific url for this icon
        """
        return f'/icons/{self.pk}.png'

    def as_json(self):
        """
        Return this as an object
        """
        return {
            'id': self.pk,
            'name': self.name,
            'url': self.get_url(),
        }
