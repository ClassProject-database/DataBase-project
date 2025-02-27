from flask import Flask
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin
import mysql.connector
from mysql.connector import pooling
import os

# Initialize Flask Extensions
bcrypt = Bcrypt()
login_manager = LoginManager()

# MySQL Connection Pool (Safe Handling)
db_config = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "root",
    "database": "movie_rental",
    "port": 8889
}
try:
    connection_pool = pooling.MySQLConnectionPool(pool_name="mypool", pool_size=10, **db_config)
except mysql.connector.Error as err:
    print(f" Database connection pool error: {err}")
    connection_pool = None

# Function to get a database connection safely
def get_db_connection():
    if connection_pool is None:
        print("⚠️ No database connection pool available.")
        return None
    try:
        return connection_pool.get_connection()
    except mysql.connector.Error as err:
        print(f" Database connection error: {err}")
        return None

# Define User Class for Flask-Login using account_id
class User(UserMixin):
    def __init__(self, account_id, username, role):
        self.id = account_id  # Using account_id as the unique user identifier
        self.username = username
        self.role = role

    def get_id(self):
        return str(self.id)  # Flask-Login requires a string ID

def create_app():
    app = Flask(__name__)
    
    # Secure secret key
    app.config['SECRET_KEY'] = os.urandom(24).hex()

    # Initialize Flask extensions
    bcrypt.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'  # Redirect unauthorized users to login

    # User Loader Function: fetch user from Users table using account_id
    @login_manager.user_loader
    def load_user(user_id):
        conn = get_db_connection()
        if conn is None:
            return None  # Return None if DB connection fails

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Users WHERE account_id = %s", (user_id,))
        user_data = cursor.fetchone()

        cursor.close()
        conn.close()

        if user_data:
            return User(user_data['account_id'], user_data['username'], user_data['role'])
        return None

    # Import & Register Blueprints
    from .views import views
    from .auth import auth

    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')

    return app

# Make User and get_db_connection importable
__all__ = ['User', 'get_db_connection']
