"""
Re-exports for backwards compatibility — decorators live in organization.decorators.
"""

from organization.decorators import (  # noqa: F401  # pylint: disable=unused-import
    asset_is_recorder,
    asset_is_operator,
    asset_is_owner,
    asset_id_in_get_post,
)
