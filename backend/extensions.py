"""
Shared extension instances.

These are created here (instead of inside app.py) so that models.py,
routes/*.py and app.py can all import the same db/bcrypt/jwt objects
without circular-import problems.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
