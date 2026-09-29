from datetime import datetime

from pydantic import BaseModel


class MenuItemOut(BaseModel):
    id: int
    name: str
    description: str | None
    price: float
    image: str | None
    available: bool

    class Config:
        from_attributes = True


class CategoryOut(BaseModel):
    id: int
    name: str
    items: list[MenuItemOut]

    class Config:
        from_attributes = True


class MenuItemWithCategoryOut(BaseModel):
    id: int
    name: str
    description: str | None
    price: float
    image: str | None
    available: bool
    category: str

    class Config:
        from_attributes = True


class TableOut(BaseModel):
    table_number: int

    class Config:
        from_attributes = True


class OrderItemIn(BaseModel):
    menu_item_id: int
    quantity: int


class OrderCreate(BaseModel):
    table_number: int
    items: list[OrderItemIn]
    payment_method: str
    notes: str | None = None


class OrderItemOut(BaseModel):
    menu_item_id: int
    name: str
    quantity: int
    price: float


class OrderOut(BaseModel):
    id: int
    table_number: int
    items: list[OrderItemOut]
    total: float
    payment_method: str
    payment_status: str
    order_status: str
    notes: str | None
    created_at: datetime


class PaymentStatusUpdate(BaseModel):
    payment_status: str


class OrderStatusUpdate(BaseModel):
    order_status: str
