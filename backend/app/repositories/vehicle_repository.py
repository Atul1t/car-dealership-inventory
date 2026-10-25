"""Data access for vehicles. The only module that talks to the vehicles table."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle


class VehicleRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get(self, vehicle_id: int) -> Vehicle | None:
        return self._db.get(Vehicle, vehicle_id)

    def list(self, *, in_stock_only: bool = False) -> list[Vehicle]:
        query = select(Vehicle).order_by(Vehicle.make, Vehicle.model, Vehicle.id)
        if in_stock_only:
            query = query.where(Vehicle.quantity > 0)
        return list(self._db.scalars(query))

    def add(self, **fields) -> Vehicle:
        vehicle = Vehicle(**fields)
        self._db.add(vehicle)
        self._db.commit()
        self._db.refresh(vehicle)
        return vehicle
