"""
Optional helper script that creates a demo user and some sample sales
records so you can see the Reports page populated with data right away.

Usage:
    python seed.py

Demo login created:
    username: demo
    password: demo1234
"""
import random
from datetime import date, timedelta

from app import create_app
from extensions import db
from models import User, Sale

PRODUCTS = [
    ("Wireless Mouse", "Electronics"),
    ("Mechanical Keyboard", "Electronics"),
    ("USB-C Hub", "Electronics"),
    ("Office Chair", "Furniture"),
    ("Standing Desk", "Furniture"),
    ("Notebook Set", "Stationery"),
    ("Gel Pens (Pack of 12)", "Stationery"),
    ("Coffee Mug", "Home & Living"),
    ("Desk Lamp", "Home & Living"),
    ("Backpack", "Accessories"),
]

REGIONS = ["North", "South", "East", "West"]
CUSTOMERS = ["Acme Corp", "Globex Inc", "Initech", "Umbrella LLC", "Wayne Enterprises", "Stark Industries"]


def run():
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(username="demo").first()
        if not user:
            user = User(username="demo", email="demo@example.com", full_name="Demo User")
            user.set_password("demo1234")
            db.session.add(user)
            db.session.commit()
            print("Created demo user -> username: demo / password: demo1234")
        else:
            print("Demo user already exists, reusing it.")

        existing_sales = Sale.query.filter_by(user_id=user.id).count()
        if existing_sales > 0:
            print(f"Demo user already has {existing_sales} sales, skipping seed data.")
            return

        today = date.today()
        created = 0
        for days_ago in range(0, 180, 3):  # roughly one sale every 3 days for 6 months
            product_name, category = random.choice(PRODUCTS)
            quantity = random.randint(1, 8)
            unit_price = round(random.uniform(8, 250), 2)
            sale = Sale(
                user_id=user.id,
                product_name=product_name,
                category=category,
                quantity=quantity,
                unit_price=unit_price,
                total_amount=round(quantity * unit_price, 2),
                customer_name=random.choice(CUSTOMERS),
                region=random.choice(REGIONS),
                sale_date=today - timedelta(days=days_ago),
            )
            db.session.add(sale)
            created += 1

        db.session.commit()
        print(f"Seeded {created} sample sales records for the demo user.")


if __name__ == "__main__":
    run()
