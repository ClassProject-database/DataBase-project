from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from . import bcrypt, get_db_connection, User  # Import our initialized objects and User class

auth = Blueprint('auth', __name__)

# Login Route (Redirects Admins & Users Separately)
@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM Logins WHERE username = %s", (username,))
            user = cursor.fetchone()

            if user and bcrypt.check_password_hash(user['password'], password):
                login_user(User(user['login_id'], user['username'], user['role']))
                flash("Login successful!", "success")

                if user['role'] == 'admin':
                    return redirect(url_for('views.admin_dashboard'))
                else:
                    return redirect(url_for('views.user_rentals'))
            else:
                flash("Invalid credentials, please try again.", "danger")

        except Exception as e:
            flash("Database error occurred.", "danger")
            print(f"Login Error: {e}")

        finally:
            cursor.close()
            conn.close()

    return render_template('login.html')

# Logout Route
@auth.route('/logout')
@login_required
def logout():
    logout_user()
    flash("Logged out successfully.", "info")
    return redirect(url_for('auth.login'))

# Sign-Up Route (with Duplicate Username Check)
@auth.route('/signUp', methods=['GET', 'POST'])
def signUp():
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        first_name = request.form['first_name'].strip()
        last_name = request.form['last_name'].strip()
        phone = request.form['phone'].strip()

        if password != confirm_password:
            flash("Passwords do not match!", "danger")
            return redirect(url_for('auth.signUp'))

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')  # ✅ Use Flask-Bcrypt

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            # Check if username already exists
            cursor.execute("SELECT * FROM Logins WHERE username = %s", (username,))
            if cursor.fetchone():
                flash("Username already exists! Choose a different one.", "warning")
                return redirect(url_for('auth.signUp'))

            # Insert into Logins table
            cursor.execute("INSERT INTO Logins (username, password, role) VALUES (%s, %s, 'user')",
                           (username, hashed_password))
            conn.commit()
            login_id = cursor.lastrowid  # Get generated login ID

            # Insert into User_Accounts table
            cursor.execute("""
                INSERT INTO User_Accounts (first_name, last_name, phone, login_id)
                VALUES (%s, %s, %s, %s)
            """, (first_name, last_name, phone, login_id))
            conn.commit()

            # Automatically log in the new user
            new_user = User(login_id, username, 'user')
            login_user(new_user)

            flash("Sign-up successful!", "success")
            return redirect(url_for('views.HomePage'))
        except Exception as e:
            flash("Error creating account. Try again.", "danger")
            print(f"Sign-up Error: {e}")
        finally:
            cursor.close()
            conn.close()

    return render_template("signUp.html")

# Cart Route (Protected)
@auth.route('/UserCart')
@login_required
def UserCart():
    return render_template("UserCart.html")
