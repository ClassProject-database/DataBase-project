from flask import Blueprint, render_template, jsonify, request, redirect, session, url_for, flash, abort
from flask_login import login_required, current_user
from flask_bcrypt import Bcrypt
from . import get_db_connection

bcrypt = Bcrypt()
views = Blueprint('views', __name__)

#  Homepage
@views.route('/')
def HomePage():
    return render_template("home.html")

#  Restricted Inventory Page
@views.route('/inventory2')
@login_required
def inventory2():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Genres;")
    genres = cursor.fetchall()
    cursor.execute("SELECT * FROM Movies;")
    movies = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template("inventory2.html", movies=movies, genres=genres)

#  API: Fetch Movies
@views.route('/api/movies')
def get_movies():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        genre_id = request.args.get('genre_id', type=int)
        query = "SELECT * FROM Movies" if not genre_id else """
            SELECT DISTINCT Movies.* FROM Movies
            JOIN MovieGenres ON Movies.movie_id = MovieGenres.movie_id
            WHERE MovieGenres.genre_id = %s;
        """
        cursor.execute(query, (genre_id,) if genre_id else ())
        movies = cursor.fetchall()
        return jsonify(movies)
    except Exception as err:
        print(f"Database error: {err}")
        return jsonify({"error": "Database query failed"}), 500
    finally:
        cursor.close()
        conn.close()

#  Admin Dashboard
@views.route('/admin', methods=['GET'])
@login_required
def admin_dashboard():
    if current_user.role != 'admin':
        abort(403)

    search_query = request.args.get('search', '')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if search_query:
        cursor.execute("""
            SELECT ua.*, l.username, l.role 
            FROM User_Accounts ua 
            JOIN Logins l ON ua.login_id = l.login_id
            WHERE l.username LIKE %s OR ua.login_id LIKE %s
        """, (f"%{search_query}%", f"%{search_query}%"))
    else:
        cursor.execute("""
            SELECT ua.*, l.username, l.role 
            FROM User_Accounts ua 
            JOIN Logins l ON ua.login_id = l.login_id
        """)

    users = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template("adminDashboard.html", users=users, search_query=search_query)

@views.route('/user_rentals', methods=['GET'])
@login_required
def user_rentals():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    #  Fetch user info
    cursor.execute("""
        SELECT ua.account_id, ua.first_name, ua.last_name, ua.phone, l.username 
        FROM User_Accounts ua
        JOIN Logins l ON ua.login_id = l.login_id
        WHERE ua.login_id = %s
    """, (current_user.id,))
    user_info = cursor.fetchone()

    if not user_info:
        flash(" User not found.", "error")
        return redirect(url_for('views.HomePage'))

    account_id = user_info['account_id']

    #  Fetch rental history (Fix column reference)
    cursor.execute("""
        SELECT r.rental_id, r.rental_date, r.return_date, r.status, m.title
        FROM Rentals r
        JOIN Movies m ON r.movie_id = m.movie_id
        WHERE r.customer_id = (SELECT customer_id FROM Customers WHERE user_account_id = %s)
    """, (account_id,))
    rentals = cursor.fetchall()

    #  Fetch user's reviews (Fix column reference)
    cursor.execute("""
        SELECT rev.review_id, rev.review_date, rev.rating, rev.comment, m.title
        FROM Reviews rev
        JOIN Movies m ON rev.movie_id = m.movie_id
        WHERE rev.account_id = %s
    """, (account_id,))
    reviews = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("userRentals.html", user=user_info, rentals=rentals, reviews=reviews)


#  Add User (Admin Only)
@views.route('/api/add_user', methods=['POST'])
@login_required
def add_user():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'error': 'Unauthorized access'}), 403

    data = request.get_json()
    print("\n📩 Received Data:", data)

    if not data:
        return jsonify({'success': False, 'error': 'No data received'}), 400

    username = data.get('username')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    role = data.get('role')

    if not username or not first_name or not last_name or not phone or not role:
        return jsonify({'success': False, 'error': 'All fields are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Check if the username already exists
        cursor.execute("SELECT * FROM Logins WHERE username = %s", (username,))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Username already exists.'}), 400

        # Hash default password
        hashed_password = bcrypt.generate_password_hash("changeme").decode('utf-8')

        # Insert into Logins
        cursor.execute("INSERT INTO Logins (username, password, role) VALUES (%s, %s, %s)", 
                       (username, hashed_password, role))
        conn.commit()
        login_id = cursor.lastrowid

        # Insert into User_Accounts
        cursor.execute("INSERT INTO User_Accounts (login_id, first_name, last_name, phone) VALUES (%s, %s, %s, %s)", 
                       (login_id, first_name, last_name, phone))
        conn.commit()

        print(" User added successfully!")
        return jsonify({'success': True})

    except Exception as e:
        print(" Error adding user:", e)
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()

#  Delete User (Admin Only)
@views.route('/api/delete_user', methods=['POST'])
@login_required
def delete_user():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'error': 'Unauthorized access'}), 403

    data = request.get_json()
    login_id = data.get('login_id')

    if not login_id:
        return jsonify({'success': False, 'error': 'Missing login_id'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        #  Delete from Logins (cascade deletes User_Accounts)
        cursor.execute("DELETE FROM Logins WHERE login_id = %s", (login_id,))
        conn.commit()
        return jsonify({'success': True})

    except Exception as e:
        print("Error deleting user:", e)
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


#  Post Review
@views.route('/api/post_review', methods=['POST'])
@login_required
def post_review():
    data = request.get_json()
    movie_id, rating, comment = data.get('movie_id'), data.get('rating'), data.get('review')

    if not movie_id or not rating or not comment:
        return jsonify({'success': False, 'error': 'All fields are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    #  Fetch customer_id from login_id
    cursor.execute("SELECT customer_id FROM Customers WHERE user_account_id = (SELECT account_id FROM User_Accounts WHERE login_id = %s)", (current_user.id,))
    customer = cursor.fetchone()

    if not customer:
        return jsonify({'success': False, 'error': 'User account not found'}), 400

    customer_id = customer['customer_id']

    #  Check if the user has already reviewed this movie
    cursor.execute("SELECT * FROM Reviews WHERE movie_id = %s AND customer_id = %s", (movie_id, customer_id))
    existing_review = cursor.fetchone()

    if existing_review:
        return jsonify({'success': False, 'error': 'You have already reviewed this movie'}), 400

    #  Insert review
    cursor.execute("INSERT INTO Reviews (movie_id, customer_id, rating, comment) VALUES (%s, %s, %s, %s)", 
                   (movie_id, customer_id, rating, comment))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'success': True})

#  Reviews Page
@views.route('/reviews')
def reviews_page():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT r.*, m.title FROM Reviews r JOIN Movies m ON r.movie_id = m.movie_id ORDER BY r.review_date DESC")
    reviews = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template("reviews.html", reviews=reviews)

@views.route('/api/search_users')
@login_required
def search_users():
    if current_user.role != 'admin':
        return jsonify([])  # Prevent non-admins from searching

    search_query = request.args.get('query', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT ua.account_id, ua.first_name, ua.last_name, ua.phone, l.username, l.login_id
        FROM User_Accounts ua
        JOIN Logins l ON ua.login_id = l.login_id
        WHERE l.username LIKE %s OR ua.account_id LIKE %s
    """, (f"%{search_query}%", f"%{search_query}%"))

    users = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(users)


