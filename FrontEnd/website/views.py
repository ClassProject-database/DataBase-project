from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash, abort
from flask_login import login_required, current_user
from . import get_db_connection, bcrypt
# No need to reinitialize Bcrypt here if already initialized in __init__.py

views = Blueprint('views', __name__)

# 1. Homepage
@views.route('/')
def HomePage():
    return render_template("home.html")

# 2. Restricted Inventory Page
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

# 3. API: Fetch Movies
@views.route('/api/movies')
def get_movies():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        genre_id = request.args.get('genre_id', type=int)
        if genre_id:
            query = """
                SELECT DISTINCT Movies.* 
                FROM Movies 
                JOIN MovieGenres ON Movies.movie_id = MovieGenres.movie_id
                WHERE MovieGenres.genre_id = %s;
            """
            cursor.execute(query, (genre_id,))
        else:
            cursor.execute("SELECT * FROM Movies")
        movies = cursor.fetchall()
        return jsonify(movies)
    except Exception as err:
        print(f"Database error: {err}")
        return jsonify({"error": "Database query failed"}), 500
    finally:
        cursor.close()
        conn.close()

# 4. Admin Dashboard (Fetch all users from Users table)
@views.route('/admin', methods=['GET'])
@login_required
def admin_dashboard():
    if current_user.role != 'admin':
        abort(403)

    search_query = request.args.get('search', '')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if search_query:
            cursor.execute("""
                SELECT * FROM Users 
                WHERE username LIKE %s OR account_id LIKE %s
            """, (f"%{search_query}%", f"%{search_query}%"))
        else:
            cursor.execute("SELECT * FROM Users")
        users = cursor.fetchall()
    except Exception as err:
        print(f"Database error: {err}")
        users = []
    finally:
        cursor.close()
        conn.close()

    return render_template("adminDashboard.html", users=users, search_query=search_query)

# 5. User Rentals Page
@views.route('/user_rentals', methods=['GET'])
@login_required
def user_rentals():
    account_id = current_user.id  # current_user.id is now account_id
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Fetch user info directly from Users table
        cursor.execute("SELECT * FROM Users WHERE account_id = %s", (account_id,))
        user_info = cursor.fetchone()
        if not user_info:
            flash("❌ User not found.", "error")
            return redirect(url_for('views.HomePage'))

        # Fetch rental history using account_id
        cursor.execute("""
            SELECT r.rental_id, r.rental_date, r.return_date, r.status, m.title
            FROM Rentals r
            JOIN Movies m ON r.movie_id = m.movie_id
            WHERE r.account_id = %s
        """, (account_id,))
        rentals = cursor.fetchall()

        # Fetch user's reviews using account_id
        cursor.execute("""
            SELECT rev.review_id, rev.review_date, rev.rating, rev.comment, m.title
            FROM Reviews rev
            JOIN Movies m ON rev.movie_id = m.movie_id
            WHERE rev.account_id = %s
        """, (account_id,))
        reviews = cursor.fetchall()
    except Exception as err:
        print(f"Database error: {err}")
        user_info, rentals, reviews = None, [], []
    finally:
        cursor.close()
        conn.close()

    return render_template("userRentals.html", user=user_info, rentals=rentals, reviews=reviews)

# 6. API: Add User (Admin Only)
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
        # Check if the username already exists in Users
        cursor.execute("SELECT * FROM Users WHERE username = %s", (username,))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Username already exists.'}), 400

        # Hash default password "changeme"
        hashed_password = bcrypt.generate_password_hash("changeme").decode('utf-8')

        # Insert directly into Users table
        cursor.execute("""
            INSERT INTO Users (username, password, role, first_name, last_name, phone)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (username, hashed_password, role, first_name, last_name, phone))
        conn.commit()
        print("User added successfully!")
        return jsonify({'success': True})
    except Exception as e:
        print("Error adding user:", e)
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 7. API: Delete User (Admin Only)
@views.route('/api/delete_user', methods=['POST'])
@login_required
def delete_user():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'error': 'Unauthorized access'}), 403

    data = request.get_json()
    print("📩 Received Data:", data)
    if not data or 'account_id' not in data:
        return jsonify({'success': False, 'error': 'Missing account_id'}), 400

    account_id = data['account_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM Users WHERE account_id = %s", (account_id,))
        conn.commit()
        return jsonify({'success': True, 'message': 'User deleted successfully'})
    except Exception as e:
        print("❌ Error deleting user:", e)
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 8. API: Post Review
@views.route('/api/post_review', methods=['POST'])
@login_required
def post_review():
    data = request.get_json()
    movie_id = data.get('movie_id')
    rating = data.get('rating')
    comment = data.get('review')
    if not movie_id or not rating or not comment:
        return jsonify({'success': False, 'error': 'All fields are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # current_user.id is account_id
        cursor.execute("SELECT account_id FROM Users WHERE account_id = %s", (current_user.id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'success': False, 'error': 'User account not found'}), 400
        account_id = user['account_id']
        # Check if the user has already reviewed this movie
        cursor.execute("SELECT * FROM Reviews WHERE movie_id = %s AND account_id = %s", (movie_id, account_id))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'You have already reviewed this movie'}), 400
        cursor.execute("INSERT INTO Reviews (movie_id, account_id, rating, comment) VALUES (%s, %s, %s, %s)",
                       (movie_id, account_id, rating, comment))
        conn.commit()
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
    return jsonify({'success': True})

# 9. Reviews Page
@views.route('/reviews')
def reviews_page():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT r.*, m.title 
        FROM Reviews r 
        JOIN Movies m ON r.movie_id = m.movie_id 
        ORDER BY r.review_date DESC
    """)
    reviews = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template("reviews.html", reviews=reviews)

# 10. API: Search Users (Admin Only)
@views.route('/api/search_users')
@login_required
def search_users():
    if current_user.role != 'admin':
        return jsonify([])

    search_query = request.args.get('query', '').strip()
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT account_id, first_name, last_name, phone, username
            FROM Users
            WHERE username LIKE %s OR account_id LIKE %s
        """, (f"%{search_query}%", f"%{search_query}%"))
        users = cursor.fetchall()
    except Exception as err:
        print(f"Database error: {err}")
        users = []
    finally:
        cursor.close()
        conn.close()
    return jsonify(users)

# 11. API: Checkout (Create Transaction & Rentals)
@views.route('/api/checkout', methods=['POST'])
@login_required
def checkout():
    data = request.get_json()
    if not data or "cart" not in data or "amount" not in data:
        return jsonify({"success": False, "error": "Invalid checkout data"}), 400
    cart_items = data["cart"]
    try:
        amount = float(data["amount"])
    except ValueError:
        return jsonify({"success": False, "error": "Invalid amount format"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        account_id = current_user.id  # current_user.id is account_id
        # Insert into Transactions table
        cursor.execute("""
            INSERT INTO Transactions (account_id, total_price, payment_status, purchase_date)
            VALUES (%s, %s, %s, NOW())
        """, (account_id, amount, 'Completed'))
        conn.commit()
        transaction_id = cursor.lastrowid

        # Insert Rentals
        for item in cart_items:
            if "movie_id" not in item:
                print("Missing movie_id in cart item:", item)
                continue
            cursor.execute("""
                INSERT INTO Rentals (account_id, movie_id, rental_date, return_date, status, transaction_id)
                VALUES (%s, %s, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'rented', %s)
            """, (account_id, item["movie_id"], transaction_id))
        conn.commit()
        return jsonify({"success": True, "message": "Checkout successful!"})
    except Exception as e:
        print("❌ Checkout Error:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 12. Checkout Page
@views.route('/checkout', methods=['GET'])
@login_required
def checkout_page():
    return render_template("checkout.html")

# 13. API: Delete Rental
@views.route('/api/delete_rental', methods=['POST'])
@login_required
def delete_rental():
    data = request.get_json()
    print(f"🗑️ Received DELETE request: {data} from user ID {current_user.id}")
    rental_id = data.get('rental_id')
    if not rental_id:
        print("❌ Missing rental_id in request")
        return jsonify({'success': False, 'error': 'Missing rental_id'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Verify that the rental belongs to the current user
        cursor.execute("SELECT rental_id FROM Rentals WHERE rental_id = %s AND account_id = %s",
                       (rental_id, current_user.id))
        if not cursor.fetchone():
            print(f"❌ Rental ID {rental_id} not found or unauthorized for account {current_user.id}.")
            return jsonify({'success': False, 'error': 'Rental not found or unauthorized'}), 400

        cursor.execute("DELETE FROM Rentals WHERE rental_id = %s", (rental_id,))
        conn.commit()
        print(f"✅ Successfully deleted rental ID {rental_id} for account {current_user.id}")
        return jsonify({'success': True})
    except Exception as e:
        print("❌ Error deleting rental:", e)
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 14. API: Get Rentals for Current User
@views.route('/api/rentals', methods=['GET'])
@login_required
def get_rentals():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT r.rental_id, r.rental_date, r.return_date, r.status, m.title
            FROM Rentals r
            JOIN Movies m ON r.movie_id = m.movie_id
            WHERE r.account_id = %s
        """, (current_user.id,))
        rentals = cursor.fetchall()
    except Exception as err:
        print(f"Database error: {err}")
        rentals = []
    finally:
        cursor.close()
        conn.close()
    return jsonify(rentals)

# 15. API: Add Movie (Admin Only)
@views.route('/api/add_movie', methods=['POST'])
@login_required
def add_movie():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'error': 'Unauthorized access'}), 403

    data = request.get_json()
    title = data.get("title")
    year = data.get("year")
    rating = data.get("rating")
    price = data.get("price")
    image = data.get("image") if "image" in data else "default.jpg"
    genre_ids = data.get("genre_ids", [])  # Expecting an array of genre IDs

    if not title or not year or not rating or not price:
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO Movies (title, year, rating, price, image) VALUES (%s, %s, %s, %s, %s)",
            (title, year, rating, price, image)
        )
        movie_id = cursor.lastrowid

        for genre_id in genre_ids:
            cursor.execute(
                "INSERT INTO MovieGenres (movie_id, genre_id) VALUES (%s, %s)", 
                (movie_id, genre_id)
            )
        conn.commit()
        return jsonify({"success": True, "message": "Movie added successfully", "movie_id": movie_id}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
