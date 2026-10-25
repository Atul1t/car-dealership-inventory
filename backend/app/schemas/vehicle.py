"""Request/response models for vehicles."""

from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

# Text fields are trimmed and must not be blank after trimming.
Make = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
ModelName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
Category = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=30)]
Price = Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]
Quantity = Annotated[int, Field(ge=0)]


class VehicleCreate(BaseModel):
    make: Make
    model: ModelName
    category: Category
    price: Price
    quantity: Quantity = 0


class VehicleUpdate(BaseModel):
    """Partial update: omitted fields keep their current value; explicit nulls are rejected."""

    make: Make | None = None
    model: ModelName | None = None
    category: Category | None = None
    price: Price | None = None
    quantity: Quantity | None = None

    @model_validator(mode="after")
    def reject_explicit_nulls(self) -> "VehicleUpdate":
        nulls = [name for name in self.model_fields_set if getattr(self, name) is None]
        if nulls:
            raise ValueError(f"Fields cannot be null: {', '.join(sorted(nulls))}")
        return self

    def changes(self) -> dict:
        return self.model_dump(exclude_unset=True)


class VehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    make: str
    model: str
    category: str
    price: float
    quantity: int


class VehicleSearchCriteria(BaseModel):
    """Optional filters for searching the catalogue. Blank strings mean "no filter"."""

    make: str | None = None
    model: str | None = None
    category: str | None = None
    min_price: Decimal | None = Field(default=None, ge=0)
    max_price: Decimal | None = Field(default=None, ge=0)

    @field_validator("make", "model", "category")
    @classmethod
    def blank_means_no_filter(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return value.strip()


class PurchaseRequest(BaseModel):
    quantity: Annotated[int, Field(gt=0)] = 1


class RestockRequest(BaseModel):
    quantity: Annotated[int, Field(gt=0)]
