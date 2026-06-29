import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user account.

    Expects JSON: { username, email, password, full_name? }
    """
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    full_name = (data.get("full_name") or "").strip() or None

    if not username or not email or not password:
        return jsonify({"error": "username, email and password are required"}), 400

    if len(username) < 3:
        return jsonify({"error": "username must be at least 3 characters"}), 400

    if not EMAIL_RE.match(email):
        return jsonify({"error": "please provide a valid email address"}), 400

    if len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "that username is already taken"}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "an account with that email already exists"}), 409

    user = User(username=username, email=email, full_name=full_name)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify({"message": "account created successfully", "user": user.to_dict(), "access_token": access_token}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Log in with username (or email) + password, returns a JWT."""
    data = request.get_json(silent=True) or {}
    identifier = (data.get("username") or data.get("email") or "").strip()
    password = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"error": "username/email and password are required"}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({"message": "logged in successfully", "user": user.to_dict(), "access_token": access_token}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Return the currently authenticated user, useful for session restore."""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
