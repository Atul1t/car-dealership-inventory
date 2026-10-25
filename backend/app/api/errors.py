"""Translate domain errors into HTTP responses in one place."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.services.exceptions import (
    AuthenticationError,
    BusinessRuleError,
    ConflictError,
    DomainError,
    NotFoundError,
    PermissionDeniedError,
)

STATUS_BY_ERROR: dict[type[DomainError], int] = {
    AuthenticationError: 401,
    PermissionDeniedError: 403,
    NotFoundError: 404,
    ConflictError: 409,
    BusinessRuleError: 400,
}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(_: Request, exc: DomainError) -> JSONResponse:
        status_code = STATUS_BY_ERROR.get(type(exc), 400)
        headers = {"WWW-Authenticate": "Bearer"} if status_code == 401 else None
        return JSONResponse(status_code=status_code, content={"detail": exc.message}, headers=headers)
