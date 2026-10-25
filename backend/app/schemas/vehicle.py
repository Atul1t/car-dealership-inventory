"""Request/response models for vehicles."""

from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

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


class VehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    make: str
    model: str
    category: str
    price: float
    quantity: int
