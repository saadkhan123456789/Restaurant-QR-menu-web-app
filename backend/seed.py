from database import SessionLocal
from models import Category, MenuItem, Table

CATEGORIES_AND_ITEMS = {
    "Burgers": [
        (
            "Classic Chicken Burger",
            "Grilled chicken patty, lettuce, mayo, sesame bun",
            650,
            "/menu-images/classic-chicken-burger.jpg",
        ),
        (
            "Beef Cheese Burger",
            "Beef patty, cheddar cheese, pickles, special sauce",
            750,
            "/menu-images/beef-cheese-burger.jpg",
        ),
    ],
    "Pizza": [
        (
            "Chicken Tikka Pizza",
            "Spicy chicken tikka, onions, capsicum, mozzarella",
            1200,
            "/menu-images/chicken-tikka-pizza.jpg",
        ),
        (
            "Pepperoni Pizza",
            "Classic pepperoni with mozzarella cheese",
            1350,
            "/menu-images/pepperoni-pizza.jpg",
        ),
    ],
    "Sides": [
        (
            "French Fries",
            "Crispy golden fries, salted",
            350,
            "/menu-images/french-fries.jpg",
        ),
        (
            "Loaded Fries",
            "Fries topped with cheese sauce and jalapenos",
            550,
            "/menu-images/loaded-fries.jpg",
        ),
    ],
    "Drinks": [
        (
            "Coke",
            "330ml can",
            150,
            "/menu-images/coke.jpg",
        ),
        (
            "Sprite",
            "330ml can",
            150,
            "/menu-images/sprite.jpg",
        ),
        (
            "Water",
            "500ml bottle",
            100,
            "/menu-images/water.jpg",
        ),
    ],
    "Desserts": [
        (
            "Chocolate Cake",
            "Rich chocolate layered cake slice",
            450,
            "/menu-images/chocolate-cake.jpg",
        ),
        (
            "Brownie",
            "Warm fudge brownie",
            400,
            "/menu-images/brownie.jpg",
        ),
    ],
}


def seed_demo_data():
    db = SessionLocal()
    try:
        if db.query(Table).count() == 0:
            for table_number in range(1, 11):
                db.add(Table(table_number=table_number))

        if db.query(Category).count() == 0:
            for category_name, items in CATEGORIES_AND_ITEMS.items():
                category = Category(name=category_name)
                db.add(category)
                db.flush()
                for name, description, price, image in items:
                    db.add(
                        MenuItem(
                            category_id=category.id,
                            name=name,
                            description=description,
                            price=price,
                            image=image,
                            available=True,
                        )
                    )

        # Backfill images onto items that already existed before the image
        # field was populated. Safe to run every startup: it only updates
        # rows whose image doesn't already match, never creates new rows.
        image_by_name = {
            name: image
            for items in CATEGORIES_AND_ITEMS.values()
            for name, _, _, image in items
        }
        for item in db.query(MenuItem).all():
            correct_image = image_by_name.get(item.name)
            if correct_image and item.image != correct_image:
                item.image = correct_image

        db.commit()
    finally:
        db.close()
