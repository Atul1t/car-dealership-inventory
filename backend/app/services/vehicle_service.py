"""Business rules for the vehicle catalogue and stock levels."""

from app.models.vehicle import Vehicle
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.vehicle import VehicleCreate
from app.services.exceptions import NotFoundError


class VehicleService:
    def __init__(self, vehicles: VehicleRepository) -> None:
        self._vehicles = vehicles

    def create(self, data: VehicleCreate) -> Vehicle:
        return self._vehicles.add(**data.model_dump())

    def list(self, *, in_stock_only: bool = False) -> list[Vehicle]:
        return self._vehicles.list(in_stock_only=in_stock_only)

    def get(self, vehicle_id: int) -> Vehicle:
        vehicle = self._vehicles.get(vehicle_id)
        if vehicle is None:
            raise NotFoundError("Vehicle not found")
        return vehicle
