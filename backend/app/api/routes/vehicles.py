"""Vehicle endpoints from the requirements.

Every route requires a logged-in user. DELETE and restock additionally require an admin.
"""

from typing import Annotated

from fastapi import APIRouter, Body, Query, Response, status

from app.api.deps import AdminUser, CurrentUser, VehicleServiceDep
from app.schemas.vehicle import (
    PurchaseRequest,
    RestockRequest,
    VehicleCreate,
    VehicleResponse,
    VehicleSearchCriteria,
    VehicleUpdate,
)

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, service: VehicleServiceDep, _: CurrentUser):
    return service.create(payload)


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(service: VehicleServiceDep, _: CurrentUser):
    return service.list_all()


@router.get("/search", response_model=list[VehicleResponse])
def search_vehicles(
    criteria: Annotated[VehicleSearchCriteria, Query()],
    service: VehicleServiceDep,
    _: CurrentUser,
):
    return service.search(criteria)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, payload: VehicleUpdate, service: VehicleServiceDep, _: CurrentUser):
    return service.update(vehicle_id, payload)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, service: VehicleServiceDep, _: AdminUser) -> Response:
    service.delete(vehicle_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{vehicle_id}/purchase", response_model=VehicleResponse)
def purchase_vehicle(
    vehicle_id: int,
    service: VehicleServiceDep,
    _: CurrentUser,
    payload: Annotated[PurchaseRequest | None, Body()] = None,
):
    """Buy one or more units. The body is optional and defaults to a quantity of 1."""
    quantity = payload.quantity if payload else 1
    return service.purchase(vehicle_id, quantity)


@router.post("/{vehicle_id}/restock", response_model=VehicleResponse)
def restock_vehicle(vehicle_id: int, payload: RestockRequest, service: VehicleServiceDep, _: AdminUser):
    return service.restock(vehicle_id, payload.quantity)
