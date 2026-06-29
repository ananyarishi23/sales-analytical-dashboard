from collections import defaultdict
from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import Sale

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _user_sales(user_id):
    return Sale.query.filter_by(user_id=user_id).all()


@reports_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    """High level KPIs: total revenue, orders, units, average order value."""
    user_id = int(get_jwt_identity())
    sales = _user_sales(user_id)

    total_revenue = round(sum(s.total_amount for s in sales), 2)
    total_orders = len(sales)
    total_units = sum(s.quantity for s in sales)
    avg_order_value = round(total_revenue / total_orders, 2) if total_orders else 0
    distinct_customers = len({s.customer_name for s in sales if s.customer_name})

    return jsonify({
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_units": total_units,
        "avg_order_value": avg_order_value,
        "distinct_customers": distinct_customers,
    }), 200


@reports_bp.route("/by-category", methods=["GET"])
@jwt_required()
def by_category():
    """Revenue, order count and units sold, grouped by product category."""
    user_id = int(get_jwt_identity())
    sales = _user_sales(user_id)

    buckets = defaultdict(lambda: {"revenue": 0.0, "orders": 0, "units": 0})
    for s in sales:
        bucket = buckets[s.category]
        bucket["revenue"] += s.total_amount
        bucket["orders"] += 1
        bucket["units"] += s.quantity

    categories = [
        {"category": cat, "revenue": round(v["revenue"], 2), "orders": v["orders"], "units": v["units"]}
        for cat, v in buckets.items()
    ]
    categories.sort(key=lambda r: r["revenue"], reverse=True)
    return jsonify({"categories": categories}), 200


@reports_bp.route("/trend", methods=["GET"])
@jwt_required()
def trend():
    """Monthly revenue trend for the last `months` months (default 6).

    Aggregation happens in Python (not SQL) so this works identically on
    SQLite (local dev) and Postgres (Render) without dialect-specific
    date functions.
    """
    user_id = int(get_jwt_identity())
    months = min(max(int(request.args.get("months", 6)), 1), 24)

    sales = _user_sales(user_id)
    buckets = defaultdict(lambda: {"revenue": 0.0, "orders": 0})
    for s in sales:
        key = s.sale_date.strftime("%Y-%m")
        bucket = buckets[key]
        bucket["revenue"] += s.total_amount
        bucket["orders"] += 1

    today = date.today()
    month_keys = []
    y, m = today.year, today.month
    for _ in range(months):
        month_keys.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m, y = 12, y - 1
    month_keys.reverse()

    series = [
        {
            "month": k,
            "revenue": round(buckets[k]["revenue"], 2) if k in buckets else 0,
            "orders": buckets[k]["orders"] if k in buckets else 0,
        }
        for k in month_keys
    ]
    return jsonify({"trend": series}), 200


@reports_bp.route("/top-products", methods=["GET"])
@jwt_required()
def top_products():
    """Best-selling products by revenue."""
    user_id = int(get_jwt_identity())
    limit = min(max(int(request.args.get("limit", 5)), 1), 50)

    sales = _user_sales(user_id)
    buckets = defaultdict(lambda: {"revenue": 0.0, "units": 0})
    for s in sales:
        bucket = buckets[s.product_name]
        bucket["revenue"] += s.total_amount
        bucket["units"] += s.quantity

    products = [
        {"product_name": name, "revenue": round(v["revenue"], 2), "units": v["units"]}
        for name, v in buckets.items()
    ]
    products.sort(key=lambda p: p["revenue"], reverse=True)
    return jsonify({"top_products": products[:limit]}), 200
