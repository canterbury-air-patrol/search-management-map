from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

from assets.models import Asset


_UNSET = object()


class Organization(models.Model):
    name = models.CharField(default='', max_length=100)
    created = models.DateTimeField(default=timezone.now)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='creator%(app_label)s_%(class)s_related')
    deleted = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='deleted_by%(app_label)s_%(class)s_related', null=True, blank=True)

    def as_object(self, user=None, membership=_UNSET):
        """
        Convert the organization to an object that is suitable for returning via JsonResponse

        Pass a pre-fetched OrganizationMember (or None) as membership to avoid a
        per-org query when serializing many organizations for the same user.
        """
        if membership is _UNSET:
            try:
                membership = OrganizationMember.objects.get(organization=self, user=user, removed__isnull=True)
            except ObjectDoesNotExist:
                membership = None
        role = membership.user_role_name() if membership else ''
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
    def is_valid_role(cls, role):
        """
        Return whether a role code is one of the model's declared choices.
        """
        return role in {value for value, _label in cls.USER_ROLE}

    def is_only_active_admin(self):
        """
        Return whether this active admin is the organization's only admin.

        The check treats this membership as the admin being changed and asks
        whether any other active admin membership remains.
        """
        if self.role != 'A' or self.removed is not None:
            return False
        return not OrganizationMember.objects.filter(
            organization=self.organization,
            role='A',
            removed__isnull=True,
        ).exclude(pk=self.pk).exists()

    @classmethod
    def user_current(cls, user):
        """
        Get all the OrganizationMember classes a user is currently in
        """
        return cls.objects.filter(user=user, removed__isnull=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'removed']),
            models.Index(fields=['organization', 'user', 'removed']),
        ]


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
