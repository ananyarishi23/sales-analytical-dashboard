import os
from dotenv import load_dotenv

load_dotenv()  # reads a local .env file if present (no-op in production)

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db, bcrypt, jwt
from routes.auth import auth_bp
from routes.sales import sales_bp
from routes.reports import reports_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(sales_bp)
    app.register_blueprint(reports_bp)

    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "message": "Sales Analytics Dashboard API",
            "health_check": "/api/health",
        }), 200

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "sales-analytics-dashboard-api"}), 200

    # --- Consistent JSON responses for auth failures -------------------
    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return jsonify({"error": "missing or invalid authorization token"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"error": "invalid or expired token, please log in again"}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "your session has expired, please log in again"}), 401

    # --- Generic error handlers -----------------------------------------
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "resource not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "an unexpected error occurred"}), 500

    with app.app_context():
        db.create_all()

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
