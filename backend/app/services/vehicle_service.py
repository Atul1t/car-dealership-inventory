"""Business rules for the vehicle catalogue and stock levels."""

from app.models.vehicle import Vehicle
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.vehicle import VehicleCreate, VehicleSearchCriteria
from app.services.exceptions import BusinessRuleError, NotFoundError


class VehicleService:
    def __init__(self, vehicles: VehicleRepository) -> None:
        self._vehicles = vehicles

    def create(self, data: VehicleCreate) -> Vehicle:
        return self._vehicles.add(**data.model_dump())

    def list_all(self, *, in_stock_only: bool = False) -> list[Vehicle]:
        return self._vehicles.list_all(in_stock_only=in_stock_only)

    def get(self, vehicle_id: int) -> Vehicle:
        vehicle = self._vehicles.get(vehicle_id)
        if vehicle is None:
            raise NotFoundError("Vehicle not found")
        return vehicle

    def search(self, criteria: VehicleSearchCriteria) -> list[Vehicle]:
        if (
            criteria.min_price is not None
            and criteria.max_price is not None
            and criteria.min_price > criteria.max_price
        ):
            raise BusinessRuleError("min_price cannot be greater than max_price")
        return self._vehicles.search(
            make=criteria.make,
            model=criteria.model,
            category=criteria.category,
            min_price=criteria.min_price,
            max_price=criteria.max_price,
        )
