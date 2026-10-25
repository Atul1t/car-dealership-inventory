"""Domain errors raised by the service layer.

Services stay HTTP-agnostic; `app.api.errors` maps each error to a status code.
"""


class DomainError(Exception):
    """Base class for all expected business-rule failures."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ConflictError(DomainError):
    """The request clashes with existing state (e.g. duplicate email)."""


class AuthenticationError(DomainError):
    """Credentials or token are missing or invalid."""


class PermissionDeniedError(DomainError):
    """The caller is authenticated but not allowed to do this."""


class NotFoundError(DomainError):
    """The requested resource doesn't exist."""


class BusinessRuleError(DomainError):
    """The request is well-formed but violates a business rule (e.g. out of stock)."""
