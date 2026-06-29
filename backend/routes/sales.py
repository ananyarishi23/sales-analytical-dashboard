from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Sale

sales_bp = Blueprint("sales", __name__, url_prefix="/api/sales")


def _parse_date(value, default=None):
    if not value:
        return default
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return default


@sales_bp.route("", methods=["POST"])
@jwt_required()
def add_sale():
    """Create a new sale record. Used by the 'Add Sales' page."""
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    product_name = (data.get("product_name") or "").strip()
    category = (data.get("category") or "").strip()
    customer_name = (data.get("customer_name") or "").strip() or None
    region = (data.get("region") or "").strip() or None

    try:
        quantity = int(data.get("quantity", 1))
        unit_price = float(data.get("unit_price"))
    except (TypeError, ValueError):
        return jsonify({"error": "quantity must be an integer and unit_price must be a number"}), 400

    if not product_name or not category:
        return jsonify({"error": "product_name and category are required"}), 400
    if quantity <= 0:
        return jsonify({"error": "quantity must be greater than 0"}), 400
    if unit_price < 0:
        return jsonify({"error": "unit_price cannot be negative"}), 400

    sale_date = _parse_date(data.get("sale_date"), default=date.today())
    total_amount = round(quantity * unit_price, 2)

    sale = Sale(
        user_id=user_id,
        product_name=product_name,
        category=category,
        quantity=quantity,
        unit_price=unit_price,
        total_amount=total_amount,
        customer_name=customer_name,
        region=region,
        sale_date=sale_date,
    )

    db.session.add(sale)
    db.session.commit()

    return jsonify({"message": "sale recorded successfully", "sale": sale.to_dict()}), 201


@sales_bp.route("", methods=["GET"])
@jwt_required()
def list_sales():
    """List sales for the logged-in user, newest first.

    Optional query params: category, start_date, end_date, page, per_page
    """
    user_id = int(get_jwt_identity())
    query = Sale.query.filter_by(user_id=user_id)

    category = request.args.get("category")
    if category:
        query = query.filter(Sale.category == category)

    start_date = _parse_date(request.args.get("start_date"))
    if start_date:
        query = query.filter(Sale.sale_date >= start_date)

    end_date = _parse_date(request.args.get("end_date"))
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)

    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 20)), 1), 100)

    query = query.order_by(Sale.sale_date.desc(), Sale.id.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "sales": [s.to_dict() for s in pagination.items],
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "total_pages": pagination.pages,
    }), 200


@sales_bp.route("/<int:sale_id>", methods=["PUT"])
@jwt_required()
def update_sale(sale_id):
    """Update an existing sale belonging to the logged-in user."""
    user_id = int(get_jwt_identity())
    sale = Sale.query.filter_by(id=sale_id, user_id=user_id).first()
    if not sale:
        return jsonify({"error": "sale not found"}), 404

    data = request.get_json(silent=True) or {}

    if "product_name" in data:
        sale.product_name = (data.get("product_name") or "").strip() or sale.product_name
    if "category" in data:
        sale.category = (data.get("category") or "").strip() or sale.category
    if "customer_name" in data:
        sale.customer_name = (data.get("customer_name") or "").strip() or None
    if "region" in data:
        sale.region = (data.get("region") or "").strip() or None
    if "sale_date" in data:
        sale.sale_date = _parse_date(data.get("sale_date"), default=sale.sale_date)

    try:
        if "quantity" in data:
            sale.quantity = int(data["quantity"])
        if "unit_price" in data:
            sale.unit_price = float(data["unit_price"])
    except (TypeError, ValueError):
        return jsonify({"error": "quantity must be an integer and unit_price must be a number"}), 400

    if sale.quantity <= 0:
        return jsonify({"error": "quantity must be greater than 0"}), 400
    if sale.unit_price < 0:
        return jsonify({"error": "unit_price cannot be negative"}), 400

    sale.total_amount = round(sale.quantity * sale.unit_price, 2)

    db.session.commit()
    return jsonify({"message": "sale updated successfully", "sale": sale.to_dict()}), 200


@sales_bp.route("/<int:sale_id>", methods=["DELETE"])
@jwt_required()
def delete_sale(sale_id):
    """Delete a sale belonging to the logged-in user."""
    user_id = int(get_jwt_identity())
    sale = Sale.query.filter_by(id=sale_id, user_id=user_id).first()
    if not sale:
        return jsonify({"error": "sale not found"}), 404

    db.session.delete(sale)
    db.session.commit()
    return jsonify({"message": "sale deleted successfully"}), 200
