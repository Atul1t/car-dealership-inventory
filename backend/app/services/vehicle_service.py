"""Business rules for the vehicle catalogue and stock levels."""

from app.models.vehicle import Vehicle
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.vehicle import VehicleCreate, VehicleSearchCriteria, VehicleUpdate
from app.services.exceptions import BusinessRuleError, NotFoundError


class VehicleService:
    def __init__(self, vehicles: VehicleRepository) -> None:
        self._vehicles = vehicles

    def create(self, data: VehicleCreate) -> Vehicle:
        return self._vehicles.add(**data.model_dump())

    def list_all(self) -> list[Vehicle]:
        return self._vehicles.list_all()

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

    def update(self, vehicle_id: int, data: VehicleUpdate) -> Vehicle:
        return self._vehicles.update(self.get(vehicle_id), data.changes())

    def delete(self, vehicle_id: int) -> None:
        self._vehicles.delete(self.get(vehicle_id))

    def purchase(self, vehicle_id: int, quantity: int = 1) -> Vehicle:
        vehicle = self.get(vehicle_id)
        if not self._vehicles.decrement_stock(vehicle.id, quantity):
            raise BusinessRuleError("Insufficient stock")
        return self._vehicles.refresh(vehicle)

    def restock(self, vehicle_id: int, quantity: int) -> Vehicle:
        vehicle = self.get(vehicle_id)
        if not self._vehicles.increment_stock(vehicle.id, quantity):
            raise NotFoundError("Vehicle not found")  # deleted between the two queries
        return self._vehicles.refresh(vehicle)
