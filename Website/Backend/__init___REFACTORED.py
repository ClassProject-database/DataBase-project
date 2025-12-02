import os
from flask import Flask
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin
import mysql.connector
from mysql.connector import pooling
from datetime import datetime


bcrypt = Bcrypt()
login_manager = LoginManager()


def create_database_config():
    """Build database configuration from environment variables with sensible defaults."""
    return {
        "host": os.environ.get("DB_HOST", "localhost"),
        "user": os.environ.get("DB_USER", "root"),
        "password": os.environ.get("DB_PASSWORD", ""),
        "database": os.environ.get("DB_NAME", "movie_rental"),
        "port": int(os.environ.get("DB_PORT", 3306)),
        "autocommit": False,
        "pool_reset_session": True
    }


def initialize_connection_pool():
    """Initialize MySQL connection pool with error handling."""
    try:
        config = create_database_config()
        pool = pooling.MySQLConnectionPool(
            pool_name="movie_rental_pool",
            pool_size=10,
            **config
        )
        return pool
    except mysql.connector.Error as err:
        print(f"Error creating database connection pool: {err}")
        raise


connection_pool = initialize_connection_pool()


def get_db_connection():
    """
    Get a database connection from the pool.
    Caller is responsible for closing the connection.
    """
    try:
        return connection_pool.get_connection()
    except mysql.connector.Error as err:
        print(f"Error getting database connection: {err}")
        raise


class User(UserMixin):
    """User model for Flask-Login."""
    
    def __init__(self, account_id, username, role):
        self.id = account_id
        self.username = username
        self.role = role

    def get_id(self):
        return str(self.id)
    
    def is_admin(self):
        """Check if user has admin privileges."""
        return self.role in ['employee', 'manager']
    
    def is_manager(self):
        """Check if user is a manager."""
        return self.role == 'manager'


def create_app():
    """Application factory pattern for creating Flask app."""
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), "..", "Frontend", "static"),
        template_folder=os.path.join(os.path.dirname(__file__), "templates")
    )

    secret_key = os.environ.get('SECRET_KEY')
    if not secret_key:
        secret_key = os.urandom(24).hex()
        print("WARNING: Using generated SECRET_KEY. Set SECRET_KEY environment variable for production.")
    
    app.config['SECRET_KEY'] = secret_key
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    
    if os.environ.get('FLASK_ENV') == 'production':
        app.config['SESSION_COOKIE_SECURE'] = True

    bcrypt.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'

    @app.template_filter('datetimeformat')
    def datetimeformat(value, format_string="%Y-%m-%d"):
        """Format datetime objects for display in templates."""
        if isinstance(value, str):
            try:
                value = datetime.fromisoformat(value)
            except (ValueError, TypeError):
                return value
        
        if isinstance(value, datetime):
            return value.strftime(format_string)
        
        return value

    @login_manager.user_loader
    def load_user(user_id):
        """Load user from database for Flask-Login."""
        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute(
                "SELECT account_id, username, role FROM users WHERE account_id = %s",
                (user_id,)
            )
            user_data = cursor.fetchone()

            if user_data:
                return User(
                    account_id=user_data['account_id'],
                    username=user_data['username'],
                    role=user_data['role']
                )
            return None
            
        except mysql.connector.Error as err:
            print(f"Database error in load_user: {err}")
            return None
            
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    from .views import views
    from .auth import auth
    
    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')

    return app


__all__ = ['User', 'get_db_connection', 'create_app', 'bcrypt']
