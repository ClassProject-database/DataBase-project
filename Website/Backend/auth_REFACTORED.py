from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from . import bcrypt, get_db_connection, User
import mysql.connector
import re


auth = Blueprint('auth', __name__)


def validate_email(email):
    """Basic email format validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone):
    """Basic phone number validation - digits, spaces, dashes, parentheses."""
    pattern = r'^[\d\s\-\(\)]+$'
    return re.match(pattern, phone) is not None and len(re.sub(r'[^\d]', '', phone)) >= 10


def validate_password_strength(password):
    """
    Check if password meets minimum security requirements.
    Returns (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter."
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter."
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number."
    
    return True, ""


@auth.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login."""
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        if not username or not password:
            flash("Please provide both username and password.", "warning")
            return render_template('login.html')

        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                "SELECT account_id, username, password_, role FROM users WHERE username = %s",
                (username,)
            )
            user_record = cursor.fetchone()

            if user_record and bcrypt.check_password_hash(user_record['password_'], password):
                user = User(user_record['account_id'], user_record['username'], user_record['role'])
                login_user(user)

                if user.is_admin():
                    return redirect(url_for('views.admin_dashboard'))
                else:
                    return redirect(url_for('views.user_rentals'))
            else:
                flash("Invalid username or password.", "danger")

        except mysql.connector.Error as err:
            print(f"Database error during login: {err}")
            flash("An error occurred. Please try again later.", "danger")
            
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    return render_template('login.html')


@auth.route('/logout')
@login_required
def logout():
    """Handle user logout."""
    logout_user()
    flash("You have been logged out successfully.", "info")
    return render_template("logout_cleanup.html")


@auth.route('/signUp', methods=['GET', 'POST'])
def signUp():
    """Handle new user registration."""
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        first_name = request.form.get('first_name', '').strip()
        last_name = request.form.get('last_name', '').strip()
        phone = request.form.get('phone', '').strip()
        email = request.form.get('email', '').strip()

        if not all([username, password, confirm_password, first_name, last_name, phone, email]):
            flash("Please fill out all required fields.", "warning")
            return redirect(url_for('auth.signUp'))

        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return redirect(url_for('auth.signUp'))

        is_valid_password, password_error = validate_password_strength(password)
        if not is_valid_password:
            flash(password_error, "warning")
            return redirect(url_for('auth.signUp'))

        if not validate_email(email):
            flash("Please enter a valid email address.", "warning")
            return redirect(url_for('auth.signUp'))

        if not validate_phone(phone):
            flash("Please enter a valid phone number.", "warning")
            return redirect(url_for('auth.signUp'))

        if len(username) < 3:
            flash("Username must be at least 3 characters long.", "warning")
            return redirect(url_for('auth.signUp'))

        conn = None
        cursor = None
        
        try:
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("SELECT account_id FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                flash("Username already exists. Please choose a different one.", "warning")
                return redirect(url_for('auth.signUp'))

            cursor.execute("SELECT account_id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                flash("Email address is already registered.", "warning")
                return redirect(url_for('auth.signUp'))

            cursor.execute("SELECT account_id FROM users WHERE phone = %s", (phone,))
            if cursor.fetchone():
                flash("Phone number is already registered.", "warning")
                return redirect(url_for('auth.signUp'))

            cursor.execute("""
                INSERT INTO users (username, password_, role, first_name, last_name, email, phone)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (username, hashed_password, 'customer', first_name, last_name, email, phone))
            
            account_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO customers (account_id, address)
                VALUES (%s, %s)
            """, (account_id, 'N/A'))

            conn.commit()

            new_user = User(account_id, username, 'customer')
            login_user(new_user)
            
            flash("Welcome! Your account has been created successfully.", "success")
            return redirect(url_for('views.HomePage'))

        except mysql.connector.Error as err:
            if conn:
                conn.rollback()
            print(f"Database error during signup: {err}")
            flash("An error occurred during registration. Please try again.", "danger")
            return redirect(url_for('auth.signUp'))
            
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    return render_template("signup.html")
