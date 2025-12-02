import os
from flask import Flask
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin
import mysql.connector
from mysql.connector import pooling
from datetime import datetime


bcrypt = Bcrypt()
login_manager = LoginManager()

# Get database host and strip any port if included
db_host = os.environ.get("DB_HOST")
if db_host and ":" in db_host:
    db_host = db_host.split(":")[0]

db_config = {
    "host": db_host,
    "user": os.environ.get("DB_USER"),
    "password": os.environ.get("DB_PASSWORD"),
    "database": os.environ.get("DB_NAME"),
    "port": int(os.environ.get("DB_PORT", 3306))
}

# Validate required environment variables
required_vars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]
missing_vars = [var for var in required_vars if not os.environ.get(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")


connection_pool = pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=10,
    **db_config
)


def get_db_connection():
    return connection_pool.get_connection()

class User(UserMixin):
    def __init__(self, account_id, username, role):
        self.id = account_id
        self.username = username
        self.role = role

    def get_id(self):
        return str(self.id)


def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), "..", "Frontend", "static"),
        template_folder=os.path.join(os.path.dirname(__file__), "templates")
    )

    app.config['SECRET_KEY'] = os.urandom(24).hex()

    bcrypt.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    @app.template_filter('datetimeformat')
    def datetimeformat(value, format="%Y-%m-%d"):
        if isinstance(value, str):
            try:
                value = datetime.fromisoformat(value)
            except ValueError:
                return value
        return value.strftime(format) if isinstance(value, datetime) else value

    # login user 
    @login_manager.user_loader
    def load_user(user_id):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT account_id, username, role FROM users WHERE account_id = %s", (user_id,))
        user_data = cursor.fetchone()
        cursor.close()
        conn.close()

        if user_data:
            return User(
                account_id=user_data['account_id'],
                username=user_data['username'],
                role=user_data['role']
            )
        return None

    # Register blueprints
    from .views import views
    from .auth import auth
    from .setup_database import setup_bp
    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')
    app.register_blueprint(setup_bp, url_prefix='/')

    return app

__all__ = ['User', 'get_db_connection', 'create_app']

