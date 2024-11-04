from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

from assets.models import Asset


class Organization(models.Model):
    name = models.CharField(default='', max_length=100)
    created = models.DateTimeField(default=timezone.now)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='creator%(app_label)s_%(class)s_related')
    deleted = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='deleted_by%(app_label)s_%(class)s_related', null=True, blank=True)

    def as_object(self, user=None):
        """
        Convert the organization to an object that is suitable for returning via JsonResponse
        """
        role = ''
        try:
            organization_member = OrganizationMember.objects.get(organization=self, user=user, removed__isnull=True)
            role = organization_member.user_role_name()
        except ObjectDoesNotExist:
            role = ''
        return {
            'id': self.pk,
            'name': self.name,
            'created': self.created,
            'creator': self.creator.username,  # pylint: disable=E1101
            'deleted': self.deleted,
            'deleted_by': self.deleted_by.username if self.deleted_by else None,  # pylint: disable=E1101
            'role': role,
        }

    def __str__(self):
        return self.name


class OrganizationMember(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name='organization%(app_label)s_%(class)s_related')
    user = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='user%(app_label)s_%(class)s_related')
    added_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='added_by%(app_label)s_%(class)s_related')
    added = models.DateTimeField(default=timezone.now)
    removed = models.DateTimeField(null=True, blank=True)
    removed_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='removed_by%(app_label)s_%(class)s_related', null=True, blank=True)

    USER_ROLE = (
        ('M', 'Member'),
        ('A', 'Admin'),
        ('R', 'Radio Operator'),
        ('b', 'Asset Bridge/Recorder'),
    )
    role = models.CharField(max_length=1, choices=USER_ROLE, default='M')

    def user_role_name(self):
        """
        Return a human-readable name for this users' role.
        """
        return next(
            (row[1] for row in self.USER_ROLE if row[0] == self.role), "Unknown"
        )

    def as_object(self, org=True, user=None):
        """
        Convert the organization member to an object that is suitable for returning via JsonResponse
        """
        data = {
            'id': self.pk,
            'user': self.user.username,
            'role': self.user_role_name(),
            'added': self.added,
            'added_by': self.added_by.username,  # pylint: disable=E1101
            'removed': self.removed,
            'removed_by': self.removed_by.username if self.removed_by else None,  # pylint: disable=E1101
        }
        if org:
            data['organization'] = self.organization.as_object(user=user)

        return data

    def is_admin(self):
        return self.role == 'A'

    def is_asset_admin(self):
        return self.role == 'A'

    def is_radio_operator(self):
        return self.role in ('A', 'R')

    def is_asset_recorder(self):
        return self.role in ('A', 'b')

    @classmethod
    def user_current(cls, user):
        """
        Get all the OrganizationMember classes a user is currently in
        """
        return cls.objects.filter(user=user, removed__isnull=True)


class OrganizationAsset(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name='organization_%(app_label)s_%(class)s_related')
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT, related_name='asset%(app_label)s_%(class)s_related')
    added_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='added_by%(app_label)s_%(class)s_related')
    added = models.DateTimeField(default=timezone.now)
    removed = models.DateTimeField(null=True, blank=True)
    removed_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='removed_by%(app_label)s_%(class)s_related', null=True, blank=True)

    def as_object(self, org=True):
        """
        Convert the organization asset to an object that is suitable for returning via JsonResponse
        """
        data = {
            'id': self.pk,
            'asset': self.asset.as_object(),
            'added': self.added,
            'added_by': self.added_by.username,  # pylint: disable=E1101
            'removed': self.removed,
            'removed_by': self.removed_by.username if self.removed_by else None,  # pylint: disable=E1101
        }

        if org:
            data['organization'] = self.organization.as_object()

        return data
