from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from . import bcrypt, get_db_connection, User
import sys
sys.stdout.reconfigure(line_buffering=True)


auth = Blueprint('auth', __name__)




# Login Route
@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if user and bcrypt.check_password_hash(user['password_'], password):
            login_user(User(user['account_id'], user['username'], user['role']))

            # Redirect based on role:
            if user['role'] in ['employee' , 'manager']:
                return redirect(url_for('views.admin_dashboard'))
            else:
                return redirect(url_for('views.user_rentals'))
        else:
            flash("Invalid username or password.", "danger")

    return render_template('login.html')

# Logout Route
@auth.route('/logout')
@login_required
def logout():
    logout_user()
    
    flash("Logged out successfully.", "info")
    return render_template("logout_cleanup.html")

#signup routes
@auth.route('/signUp', methods=['GET', 'POST'])
def signUp():
    print(" Entered signUp route. Method:", request.method)

    if request.method == 'POST':
        # Collect and sanitize form data
        username = request.form.get('username', '').strip()
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        first_name = request.form.get('first_name', '').strip()
        last_name = request.form.get('last_name', '').strip()
        phone = request.form.get('phone', '').strip()
        email = request.form.get('email', '').strip()

        chosen_role = 'customer'

        # Basic validation
        if not username or not password or not confirm_password or not first_name or not last_name:
            flash("Please fill out all required fields.", "warning")
            return redirect(url_for('auth.signUp'))

        if password != confirm_password:
            flash("Passwords do not match!", "danger")
            return redirect(url_for('auth.signUp'))

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check for existing username
        cursor.execute("SELECT account_id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            flash("Username already exists. Please choose a different one.", "warning")
            cursor.close()
            conn.close()
            return redirect(url_for('auth.signUp'))

        # Check for existing email or phone
        cursor.execute("SELECT account_id FROM users WHERE email = %s OR phone = %s", (email, phone))
        if cursor.fetchone():
            flash("Email or phone number already in use.", "warning")
            cursor.close()
            conn.close()
            return redirect(url_for('auth.signUp'))

        # Insert user into users table
        cursor.execute("""
            INSERT INTO users (username, password_, role, first_name, last_name, email, phone)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (username, hashed_password, chosen_role, first_name, last_name, email, phone))
        conn.commit()

        account_id = cursor.lastrowid

        # Role-specific insert
        if chosen_role == 'customer':
            cursor.execute("""
                INSERT INTO customers (account_id, address)
                VALUES (%s, %s)
            """, (account_id, 'N/A'))
        elif chosen_role == 'employee':
            cursor.execute("""
                INSERT INTO employees (account_id, job_title, salary)
                VALUES (%s, %s, %s)
            """, (account_id, 'Unknown Title', 0.00))

        conn.commit()

        cursor.close()
        conn.close()

        # login the new user
        new_user = User(account_id, username, chosen_role)
        login_user(new_user)
        flash("Sign-up successful!", "success")
        return redirect(url_for('views.HomePage'))

    return render_template("signup.html")




