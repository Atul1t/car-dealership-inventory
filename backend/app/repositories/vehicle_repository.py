"""Data access for vehicles. The only module that talks to the vehicles table."""

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle


class VehicleRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get(self, vehicle_id: int) -> Vehicle | None:
        return self._db.get(Vehicle, vehicle_id)

    def list_all(self, *, in_stock_only: bool = False) -> list[Vehicle]:
        query = select(Vehicle).order_by(Vehicle.make, Vehicle.model, Vehicle.id)
        if in_stock_only:
            query = query.where(Vehicle.quantity > 0)
        return list(self._db.scalars(query))

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
            query = query.where(Vehicle.make.ilike(f"%{make}%"))
        if model:
            query = query.where(Vehicle.model.ilike(f"%{model}%"))
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

    def update(self, vehicle: Vehicle, changes: dict) -> Vehicle:
        for field, value in changes.items():
            setattr(vehicle, field, value)
        self._db.commit()
        self._db.refresh(vehicle)
        return vehicle

    def delete(self, vehicle: Vehicle) -> None:
        self._db.delete(vehicle)
        self._db.commit()
