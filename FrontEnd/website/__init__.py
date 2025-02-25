from flask import Flask
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin
import mysql.connector
from mysql.connector import pooling

#  Initialize Flask Extensions
bcrypt = Bcrypt()
login_manager = LoginManager()

#  MySQL Connection Pool (Safe Handling)
db_config = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "root",
    "database": "movie_rental",
    "port": 3306
}
connection_pool = pooling.MySQLConnectionPool(pool_name="mypool", pool_size=10, **db_config)

#  Function to get a database connection safely
def get_db_connection():
    try:
        return connection_pool.get_connection()
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None

#  Define User Class for Flask-Login
class User(UserMixin):
    def __init__(self, user_id, username, role):
        self.id = user_id
        self.username = username
        self.role = role

    #  Flask-Login requires `get_id()`
    def get_id(self):
        return str(self.id)

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'Uknown'

    #  Initialize Flask Extensions
    bcrypt.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'  # Redirect unauthorized users to login
    login_manager.session_protection = "strong"  #  Extra security for session protection

    #  User Loader Function
    @login_manager.user_loader
    def load_user(user_id):
        conn = get_db_connection()
        if conn is None:
            return None  # Return None if DB connection fails

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Logins WHERE login_id = %s", (user_id,))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if user:
            return User(user['login_id'], user['username'], user['role'])  #  Loads user session
        return None

    #  Import & Register Blueprints
    from .views import views
    from .auth import auth

    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')

    return app

#  Make `User` and `get_db_connection` importable
__all__ = ['User', 'get_db_connection']
