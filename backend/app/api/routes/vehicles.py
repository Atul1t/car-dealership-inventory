"""Vehicle catalogue endpoints. Every route requires a logged-in user; writes require an admin."""

from typing import Annotated

from fastapi import APIRouter, Query, Response, status

from app.api.deps import AdminUser, CurrentUser, VehicleServiceDep
from app.schemas.vehicle import VehicleCreate, VehicleResponse, VehicleSearchCriteria, VehicleUpdate

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, service: VehicleServiceDep, _: AdminUser):
    return service.create(payload)


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(service: VehicleServiceDep, _: CurrentUser, in_stock: bool = False):
    return service.list_all(in_stock_only=in_stock)


# Declared before "/{vehicle_id}" so "search" isn't parsed as an id.
@router.get("/search", response_model=list[VehicleResponse])
def search_vehicles(
    criteria: Annotated[VehicleSearchCriteria, Query()],
    service: VehicleServiceDep,
    _: CurrentUser,
):
    return service.search(criteria)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, service: VehicleServiceDep, _: CurrentUser):
    return service.get(vehicle_id)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, payload: VehicleUpdate, service: VehicleServiceDep, _: AdminUser):
    return service.update(vehicle_id, payload)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, service: VehicleServiceDep, _: AdminUser) -> Response:
    service.delete(vehicle_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
