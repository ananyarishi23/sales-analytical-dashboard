import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Application configuration, driven by environment variables.

    Locally (no env vars set) the app falls back to a SQLite file so you
    can run it immediately. In production (Render) set DATABASE_URL,
    SECRET_KEY and JWT_SECRET_KEY as environment variables.
    """

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-dev-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    JWT_TOKEN_LOCATION = ["headers"]

    # Render's managed Postgres provides a URL starting with postgres://
    # SQLAlchemy 2.x / psycopg2 require the postgresql:// scheme.
    database_url = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'sales_dashboard.db')}")
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    # Comma separated list of allowed origins for the deployed frontend,
    # e.g. "https://my-app.vercel.app,http://localhost:5173"
    cors_origins_raw = os.environ.get("CORS_ORIGINS", "*")
    CORS_ORIGINS = [o.strip() for o in cors_origins_raw.split(",")] if cors_origins_raw != "*" else "*"
