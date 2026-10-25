"""Data access for vehicles. The only module that talks to the vehicles table."""

from decimal import Decimal

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle


class VehicleRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get(self, vehicle_id: int) -> Vehicle | None:
        return self._db.get(Vehicle, vehicle_id)

    def list_all(self) -> list[Vehicle]:
        return list(self._db.scalars(select(Vehicle).order_by(Vehicle.make, Vehicle.model, Vehicle.id)))

    def search(
        self,
        *,
        make: str | None = None,
        model: str | None = None,
        category: str | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
    ) -> list[Vehicle]:
        query = select(Vehicle).order_by(Vehicle.make, Vehicle.model, Vehicle.id)
        if make:
            query = query.where(Vehicle.make.icontains(make, autoescape=True))
        if model:
            query = query.where(Vehicle.model.icontains(model, autoescape=True))
        if category:
            query = query.where(func.lower(Vehicle.category) == category.lower())
        if min_price is not None:
            query = query.where(Vehicle.price >= min_price)
        if max_price is not None:
            query = query.where(Vehicle.price <= max_price)
        return list(self._db.scalars(query))

    def add(self, **fields) -> Vehicle:
        vehicle = Vehicle(**fields)
        self._db.add(vehicle)
        self._db.commit()
        self._db.refresh(vehicle)
        return vehicle

    def refresh(self, vehicle: Vehicle) -> Vehicle:
        """Reload a vehicle from the database (e.g. after a bulk UPDATE)."""
        self._db.refresh(vehicle)
        return vehicle

    def update(self, vehicle: Vehicle, changes: dict) -> Vehicle:
        for field, value in changes.items():
            setattr(vehicle, field, value)
        self._db.commit()
        self._db.refresh(vehicle)
        return vehicle

    def delete(self, vehicle: Vehicle) -> None:
        self._db.delete(vehicle)
        self._db.commit()

    def decrement_stock(self, vehicle_id: int, amount: int) -> bool:
        """Atomically remove `amount` units. Returns False (changing nothing) if there
        isn't enough stock, so two concurrent purchases can never oversell."""
        result = self._db.execute(
            update(Vehicle)
            .where(Vehicle.id == vehicle_id, Vehicle.quantity >= amount)
            .values(quantity=Vehicle.quantity - amount)
        )
        self._db.commit()
        return result.rowcount == 1

    def increment_stock(self, vehicle_id: int, amount: int) -> bool:
        """Atomically add `amount` units. Returns False if the vehicle doesn't exist."""
        result = self._db.execute(
            update(Vehicle).where(Vehicle.id == vehicle_id).values(quantity=Vehicle.quantity + amount)
        )
        self._db.commit()
        return result.rowcount == 1
