from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import Base, engine, get_db
from seed import seed_demo_data

VALID_PAYMENT_METHODS = ("PAY_NOW", "PAY_AT_COUNTER")
VALID_PAYMENT_STATUSES = ("PENDING", "PAID", "UNPAID", "FAILED")
VALID_ORDER_STATUSES = ("PLACED", "PREPARING", "READY", "COMPLETED", "CANCELLED")

Base.metadata.create_all(bind=engine)
seed_demo_data()

app = FastAPI(title="Restaurant QR Ordering API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


def to_order_out(order: models.Order) -> schemas.OrderOut:
    return schemas.OrderOut(
        id=order.id,
        table_number=order.table.table_number,
        items=order.items,
        total=order.total,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        order_status=order.order_status,
        notes=order.notes,
        created_at=order.created_at,
    )


@app.get("/api/menu/categories", response_model=list[schemas.CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(models.Category).all()
    for category in categories:
        category.items = [item for item in category.items if item.available]
    return categories


@app.get("/api/menu/items", response_model=list[schemas.MenuItemWithCategoryOut])
def get_items(db: Session = Depends(get_db)):
    items = (
        db.query(models.MenuItem)
        .filter(models.MenuItem.available == True)  # noqa: E712
        .all()
    )
    return [
        schemas.MenuItemWithCategoryOut(
            id=item.id,
            name=item.name,
            description=item.description,
            price=item.price,
            image=item.image,
            available=item.available,
            category=item.category.name,
        )
        for item in items
    ]


@app.get("/api/menu", response_model=list[schemas.CategoryOut])
def get_menu(db: Session = Depends(get_db)):
    categories = db.query(models.Category).all()
    for category in categories:
        category.items = [item for item in category.items if item.available]
    return categories


@app.get("/api/tables", response_model=list[schemas.TableOut])
def list_tables(db: Session = Depends(get_db)):
    return (
        db.query(models.Table).order_by(models.Table.table_number.asc()).all()
    )


@app.get("/api/tables/{table_number}", response_model=schemas.TableOut)
def get_table(table_number: int, db: Session = Depends(get_db)):
    table = (
        db.query(models.Table)
        .filter(models.Table.table_number == table_number)
        .first()
    )
    if not table:
        raise HTTPException(
            status_code=404, detail=f"Table {table_number} does not exist."
        )
    return table


@app.post("/api/orders", response_model=schemas.OrderOut)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    table = (
        db.query(models.Table)
        .filter(models.Table.table_number == order.table_number)
        .first()
    )
    if not table:
        raise HTTPException(
            status_code=404, detail=f"Table {order.table_number} does not exist."
        )

    if order.payment_method not in VALID_PAYMENT_METHODS:
        raise HTTPException(status_code=400, detail="Invalid payment method.")

    if order.payment_method == "PAY_NOW":
        raise HTTPException(
            status_code=400,
            detail="Online payment is not available yet. Please choose Pay at Counter.",
        )

    if not order.items:
        raise HTTPException(
            status_code=400, detail="Order must contain at least one item."
        )

    order_items = []
    total = 0.0
    for entry in order.items:
        if entry.quantity <= 0:
            raise HTTPException(
                status_code=400, detail="Quantity must be greater than 0."
            )

        menu_item = (
            db.query(models.MenuItem)
            .filter(models.MenuItem.id == entry.menu_item_id)
            .first()
        )
        if not menu_item:
            raise HTTPException(
                status_code=404,
                detail=f"Menu item {entry.menu_item_id} does not exist.",
            )
        if not menu_item.available:
            raise HTTPException(
                status_code=400, detail=f"{menu_item.name} is not available."
            )

        total += menu_item.price * entry.quantity
        order_items.append(
            {
                "menu_item_id": menu_item.id,
                "name": menu_item.name,
                "quantity": entry.quantity,
                "price": menu_item.price,
            }
        )

    new_order = models.Order(
        table_id=table.id,
        items=order_items,
        total=total,
        payment_method=order.payment_method,
        payment_status="UNPAID",
        order_status="PLACED",
        notes=order.notes,
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return to_order_out(new_order)


@app.get("/api/orders", response_model=list[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    )
    return [to_order_out(order) for order in orders]


@app.get("/api/orders/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    return to_order_out(order)


@app.patch("/api/orders/{order_id}/payment", response_model=schemas.OrderOut)
def update_payment_status(
    order_id: int, update: schemas.PaymentStatusUpdate, db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if update.payment_status not in VALID_PAYMENT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid payment status.")

    order.payment_status = update.payment_status
    db.commit()
    db.refresh(order)

    return to_order_out(order)


@app.patch("/api/orders/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(
    order_id: int, update: schemas.OrderStatusUpdate, db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if update.order_status not in VALID_ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid order status.")

    order.order_status = update.order_status
    db.commit()
    db.refresh(order)

    return to_order_out(order)
