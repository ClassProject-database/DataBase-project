from datetime import datetime
from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash, abort, session
from flask_login import login_required, current_user
from . import get_db_connection, bcrypt

views = Blueprint('views', __name__)

# 1) Home Page
@views.route('/')
def HomePage():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT movie_id, title, image_path FROM movies ORDER BY RAND() LIMIT 10")
        featured_movies = cursor.fetchall()
        cursor.close()
        return render_template('home.html', featured_movies=featured_movies)
    finally:
        conn.close()

# 2)  Inventory Page
@views.route('/inventory')
def inventory():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM genres ORDER BY genre_name;")
        genres = cursor.fetchall()

        cursor.execute("""
            SELECT 
                m.*,
                COALESCE(GROUP_CONCAT(mg.genre_id), '') AS genre_ids
            FROM movies           AS m
            LEFT JOIN moviegenres AS mg ON m.movie_id = mg.movie_id
            GROUP BY m.movie_id
        """)
        rows = cursor.fetchall()

        for r in rows:
            r["genre_ids"] = r["genre_ids"].split(',') if r["genre_ids"] else []

        cursor.close()
        return render_template("inventory.html", movies=rows, genres=genres)
    finally:
        conn.close()

# 3) get moviee on condition
@views.route('/api/movies')
def get_movies():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        q  = request.args.get('q', '').strip().lower()
        genre_id = request.args.get('genre_id', type=int)

        if q:
            cursor.execute("""
                SELECT 
                  m.*,
                  GROUP_CONCAT(mg.genre_id) AS genre_ids
                FROM movies m
                LEFT JOIN moviegenres mg 
                  ON m.movie_id = mg.movie_id
                WHERE LOWER(m.title) LIKE %s
                GROUP BY m.movie_id
                ORDER BY m.title ASC
            """, (f"%{q}%",))

        elif genre_id:
            cursor.execute("""
                SELECT 
                  m.*,
                  GROUP_CONCAT(mg.genre_id) AS genre_ids
                FROM movies m
                JOIN moviegenres mg 
                  ON m.movie_id = mg.movie_id
                WHERE mg.genre_id = %s
                GROUP BY m.movie_id
                ORDER BY m.title ASC
            """, (genre_id,))

        else:
            cursor.execute("""
                SELECT 
                  m.*,
                  GROUP_CONCAT(mg.genre_id) AS genre_ids
                FROM movies m
                LEFT JOIN moviegenres mg 
                  ON m.movie_id = mg.movie_id
                GROUP BY m.movie_id
                ORDER BY m.title ASC
            """)
        
        movies = cursor.fetchall()
        cursor.close()
        return jsonify(movies)
    finally:
        if conn:
            conn.close()

# 4) view user as admin
@views.route("/admin/user/<int:account_id>")
@login_required
def admin_user_view(account_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1) Fetch the user
        cursor.execute("""
            SELECT *
            FROM users
            WHERE account_id = %s
        """, (account_id,))
        user = cursor.fetchone()

        # 2) Fetch rental history
        cursor.execute("""
            SELECT
                r.rentalID,
                rm.rental_date   AS rental_date,
                rm.return_date   AS return_date,
                r.total_price    AS total_price,  -- overall cost from rentals
                rm.price         AS item_price,   -- per‐movie cost from rental_movies
                rm.movie_id,
                m.title
            FROM rentals r
            LEFT JOIN rental_movies rm 
              ON r.rentalID = rm.rental_id
            LEFT JOIN movies m 
              ON rm.movie_id = m.movie_id
            WHERE r.account_id = %s
            ORDER BY rm.rental_date DESC
        """, (account_id,))
        rentals = cursor.fetchall()

        cursor.close()

        return render_template(
            "adminViewUser.html",
            user=user,
            rentals=rentals
        )
    finally:
        if conn:
            conn.close()

# 5) Admin Dashboard
@views.route('/admin', methods=['GET'])
@login_required
def admin_dashboard():
    if current_user.role not in ['employee', 'manager']:
        abort(403, description="Only employees and managers can access the admin dashboard.")

    conn = None
    try:
        search_query = request.args.get('search', '')
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if search_query:
            cursor.execute("""
                SELECT * FROM users 
                WHERE username LIKE %s OR account_id LIKE %s
            """, (f"%{search_query}%", f"%{search_query}%"))
        else:
            cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()

        cursor.execute("SELECT genre_id, genre_name FROM genres")
        genres = cursor.fetchall()

        cursor.close()

        return render_template("adminDashboard.html", users=users, genres=genres, search_query=search_query)
    finally:
        if conn:
            conn.close()

# 6) (aDmin) Add user
@views.route('/api/add_user', methods=['POST'])
@login_required
def add_user():
    # Only employees and managers can access this route
    if current_user.role not in ['employee', 'manager']:
        return '', 403

    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    phone = data.get('phone', '').strip()
    role = data.get('role', '').strip()
    email = data.get('email', '').strip()
    address = data.get('address', 'N/A').strip()
    job_title = data.get('job_title', 'Staff').strip()
    salary = float(data.get('salary', 0.00))

    if not password or len(password) < 2:
        return jsonify({'success': False, 'error': 'Password must be at least 2 characters.'}), 400

    # Only managers can add employees or managers
    if role in ['employee', 'manager'] and (current_user.role or '').lower() != 'manager':
        return jsonify({'success': False, 'error': 'Only managers can add employees or managers.'}), 403

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT 1 FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            cursor.close()
            return jsonify({'success': False, 'error': 'Username already exists.'}), 400

        # Hash the submitted password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Insert into users table
        cursor.execute("""
            INSERT INTO users (username, password_, role, first_name, last_name, email, phone)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (username, hashed_password, role, first_name, last_name, email, phone))
        conn.commit()
        new_account_id = cursor.lastrowid

        if role == 'customer':
            cursor.execute("INSERT INTO customers (account_id, address) VALUES (%s, %s)", (new_account_id, address))
        elif role in ['employee', 'manager']:
            cursor.execute("""
                INSERT INTO employees (account_id, job_title, salary)
                VALUES (%s, %s, %s)
            """, (new_account_id, job_title, salary))

        conn.commit()
        cursor.close()

        return jsonify({'success': True, 'message': 'User added successfully!'})
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error adding user: {e}")
        return jsonify({'success': False, 'error': 'Failed to add user'}), 500
    finally:
        if conn:
            conn.close()

# 7) API:(Admin) Delete User..
@views.route('/api/delete_user', methods=['POST'])
@login_required
def delete_user():
    if current_user.role not in ['employee', 'manager']:
        return '', 403

    data = request.get_json()
    account_id = data.get('account_id')

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch the target user's role
        cursor.execute("SELECT role FROM users WHERE account_id = %s", (account_id,))
        target = cursor.fetchone()
        if not target:
            cursor.close()
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Only allow deleting customers unless you're a manager
        if target['role'] in ['employee', 'manager'] and (current_user.role or '').lower() != 'manager':
            cursor.close()
            return jsonify({'success': False, 'error': 'Only managers can delete employees or managers.'}), 403

        cursor.execute("DELETE FROM users WHERE account_id = %s", (account_id,))
        conn.commit()
        cursor.close()

        return jsonify({'success': True, 'message': 'User deleted successfully'})
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error deleting user: {e}")
        return jsonify({'success': False, 'error': 'Failed to delete user'}), 500
    finally:
        if conn:
            conn.close()

# 8) API: (Admin)Add Movie
@views.route('/api/add_movie', methods=['POST'])
@login_required
def add_movie():
    if current_user.role not in ['employee', 'manager']:
        return '', 403

    data = request.get_json()
    title = data.get("title")
    rating = data.get("rating")
    image_path = data.get("image_path", "keyboard.jpg")
    description = data.get("description", "")
    trailer_url = data.get("trailer_url", "")
    genre_ids = data.get("genre_ids", [])

    release_year = int(data.get("release_year", 0))
    if release_year > 9999:
        return jsonify({"success": False, "error": "Invalid release year"}), 400

    price = float(data.get("price", 0))
    if price > 999.99:
        price = 999.99

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if movie already exists (same title and release year)
        cursor.execute("""
            SELECT movie_id FROM movies 
            WHERE title = %s AND release_year = %s
        """, (title, release_year))
        
        existing_movie = cursor.fetchone()
        
        if existing_movie:
            cursor.close()
            return jsonify({
                "success": False, 
                "error": f"Movie '{title}' ({release_year}) already exists in the database"
            }), 409

        cursor.execute("""
            INSERT INTO movies (title, release_year, rating, price, image_path, description, trailer_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (title, release_year, rating, price, image_path, description, trailer_url))

        movie_id = cursor.lastrowid

        for g_id in genre_ids:
            cursor.execute("""
                INSERT INTO moviegenres (movie_id, genre_id)
                VALUES (%s, %s)
            """, (movie_id, g_id))

        conn.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "message": "Movie added successfully",
            "movie_id": movie_id
        }), 201
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error adding movie: {e}")
        return jsonify({"success": False, "error": "Failed to add movie"}), 500
    finally:
        if conn:
            conn.close()

# 9) API: Post Review
@views.route('/api/post_review', methods=['POST'])
@login_required
def post_review():
    data = request.get_json()

    movie_id = data.get('movie_id')
    rating = data.get('rating')
    review_comment = data.get('review_comment')

    if not all([movie_id, rating, review_comment]):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400

    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            return jsonify({'success': False, 'error': 'Rating must be 1–5'}), 400
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid rating'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if user already reviewed this movie
        cursor.execute("""
            SELECT review_id FROM reviews 
            WHERE movie_id = %s AND account_id = %s
        """, (movie_id, current_user.id))
        
        existing_review = cursor.fetchone()
        if existing_review:
            cursor.close()
            return jsonify({'success': False, 'error': 'You have already reviewed this movie'}), 400

        # Verify user has rented this movie
        cursor.execute("""
            SELECT 1 FROM rental_movies rm
            JOIN rentals r ON rm.rental_id = r.rentalID
            WHERE rm.movie_id = %s AND r.account_id = %s
        """, (movie_id, current_user.id))
        
        has_rented = cursor.fetchone()
        if not has_rented:
            cursor.close()
            return jsonify({'success': False, 'error': 'You can only review movies you have rented'}), 400

        cursor.execute("""
            INSERT INTO reviews (movie_id, account_id, rating, review_comment)
            VALUES (%s, %s, %s, %s)
        """, (movie_id, current_user.id, rating, review_comment))
        conn.commit()

        # Fetch movie title to show it in the frontend
        cursor.execute("SELECT title FROM movies WHERE movie_id = %s", (movie_id,))
        movie = cursor.fetchone()
        cursor.close()

        return jsonify({
            'success': True,
            'movie_title': movie['title'] if movie else 'Movie',
            'review_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error posting review: {e}")
        return jsonify({'success': False, 'error': 'Failed to post review'}), 500
    finally:
        if conn:
            conn.close()


# 10) Reviews Page
@views.route('/reviews')
def reviews_page():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT r.*, m.title 
            FROM reviews r 
            JOIN movies m ON r.movie_id = m.movie_id 
            ORDER BY r.review_date DESC
        """)
        reviews = cursor.fetchall()
        cursor.close()

        return render_template("reviews.html", reviews=reviews)
    finally:
        if conn:
            conn.close()

#11) Admin search
@views.route('/api/search_users')
@login_required
def search_users():
    if current_user.role not in ['employee', 'manager']:
        return jsonify([])

    search_query = request.args.get('query', '').strip()

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT * FROM users
            WHERE username LIKE %s OR account_id LIKE %s
        """, (f"%{search_query}%", f"%{search_query}%"))
        users = cursor.fetchall()
        cursor.close()

        return jsonify(users)
    finally:
        if conn:
            conn.close()


# 12) Checkout Page
@views.route('/checkout', methods=['GET'])
@login_required
def checkout_page():
    return render_template("checkout.html")


# 13) API: Delete Rental
@views.route('/api/delete_rental', methods=['POST'])
@login_required
def delete_rental():
    data = request.get_json()
    rental_id = data.get('rental_id')

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("DELETE FROM rentals WHERE rentalID = %s AND account_id = %s", (rental_id, current_user.id))
        conn.commit()
        cursor.close()

        return jsonify({'success': True})
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error deleting rental: {e}")
        return jsonify({'success': False, 'error': 'Failed to delete rental'}), 500
    finally:
        if conn:
            conn.close()

# 14) API: Get Rentals
@views.route('/api/rentals', methods=['GET'])
@login_required
def get_rentals():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT r.rentalID,
                   rm.rental_date   AS rental_date,   -- ← from rental_movies
                   rm.return_date   AS return_date,   -- ← from rental_movies
                   r.total_price,
                   m.title,
                   rm.price         AS rental_price
            FROM   rentals        AS r
            JOIN   rental_movies  AS rm ON r.rentalID = rm.rental_id
            JOIN   movies         AS m  ON rm.movie_id = m.movie_id
            WHERE  r.account_id = %s
            ORDER BY rm.rental_date DESC            -- keep newest first
        """, (current_user.id,))

        rentals = cursor.fetchall()
        cursor.close()

        return jsonify(rentals)
    finally:
        if conn:
            conn.close()

#15) /api/checkout
@views.route('/api/checkout', methods=['POST'])
@login_required
def checkout():
    data = request.get_json(force=True) 
    
    cart_items    = data.get("cart", [])
    total_price   = data.get("amount")
    discount_code = data.get("discount_code", "").upper().strip() or None
    card_number   = data.get("card_number", "").strip()
    card_name     = data.get("card_holder_name", "").strip()
    expiration    = data.get("expiration", "").strip()

# Validate inputs
    if not cart_items or not total_price or not card_number or not card_name or not expiration:
        return jsonify(success=False, error="Missing checkout fields."), 400

    try:
        total_price = float(total_price)
    except ValueError:
        return jsonify(success=False, error="Invalid amount."), 400

    try:
        exp_month, exp_year = map(int, expiration.split("/"))
        if exp_year < 100:
            exp_year += 2000
    except Exception:
        return jsonify(success=False, error="Expiration must be MM/YY"), 400

    if discount_code == "VIP":
        final_price = round(total_price * 0.80, 2)
    elif discount_code == "ADMIN":
        final_price = 0.00
    else:
        final_price = total_price
        discount_code = None

    # Only store last 4 digits of card for security
    last_four = card_number[-4:] if len(card_number) >= 4 else card_number

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "INSERT IGNORE INTO customers (account_id, address) VALUES (%s, %s)",
            (current_user.id, "Unknown")
        )

        # payment
        cursor.execute("""
            INSERT INTO payment (
              account_id, card_holder_name, card_number,
              expiration_month, expiration_year,
              discount_code, discounted_amount
            ) VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (
            current_user.id, card_name, last_four,
            exp_month, exp_year,
            discount_code, final_price
        ))
        payment_id = cursor.lastrowid

        # rental
        cursor.execute("""
            INSERT INTO rentals (account_id, payment_id, total_price)
            VALUES (%s, %s, %s)
        """, (current_user.id, payment_id, final_price))
        rental_id = cursor.lastrowid

        # Insert rental movies
        line_rows = []
        for item in cart_items:
            movie_id = int(item["movie_id"])
            orig = float(item["price"])
            line_price = 0.0 if discount_code == "ADMIN" else orig
            line_rows.append((rental_id, movie_id, line_price))

        cursor.executemany("""
            INSERT INTO rental_movies (
              rental_id, movie_id, price, rental_date
            ) VALUES (%s, %s, %s, NOW())
        """, line_rows)

        conn.commit()
        cursor.close()

        return jsonify(success=True, message="Checkout complete!", rental_id=rental_id)
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error during checkout: {e}")
        return jsonify(success=False, error="Checkout failed"), 500
    finally:
        if conn:
            conn.close()

# 16) API: Get User
@views.route('/api/get_user', methods=['GET'])
@login_required
def get_user():
    if current_user.role not in ['employee', 'manager']:
        return '', 403

    account_id = request.args.get('account_id')

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM users WHERE account_id = %s", (account_id,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            return jsonify({'error': 'User not found'}), 404

        # If employee or manager,  fetch job_title and salary
        if user['role'] in ['employee', 'manager']:
            cursor.execute("SELECT job_title, salary FROM employees WHERE account_id = %s", (account_id,))
            emp_data = cursor.fetchone()
            if emp_data:
                user.update(emp_data)

        cursor.close()

        return jsonify(user)
    finally:
        if conn:
            conn.close()

# 17) User Rentals Page
@views.route('/user_Rentals')
@login_required
def user_rentals():
    if current_user.role != 'customer':
        abort(403, description="Only customers can access the dashboard.")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT username, first_name, last_name, phone
            FROM users
            WHERE account_id = %s
        """, (current_user.id,))
        user = cursor.fetchone()

        cursor.execute("""
            SELECT
                rm.rental_id    AS rentalID,
                rm.movie_id     AS movie_id,
                rm.rental_date  AS rental_date,
                rm.return_date  AS return_date,
                rm.price        AS line_price,
                m.title         AS title
            FROM rental_movies rm
            JOIN rentals r  ON rm.rental_id = r.rentalID
            JOIN movies  m  ON rm.movie_id  = m.movie_id
            WHERE r.account_id = %s
            ORDER BY rm.rental_date DESC
        """, (current_user.id,))
        rentals = cursor.fetchall()

        cursor.execute("""
            SELECT
                r.rating,
                r.review_comment,
                r.review_date,
                m.title AS title
            FROM reviews r
            JOIN movies m ON r.movie_id = m.movie_id
            WHERE r.account_id = %s
            ORDER BY r.review_date DESC
        """, (current_user.id,))
        reviews = cursor.fetchall()

    finally:
        cursor.close()
        conn.close()

    return render_template(
        'userRentals.html',
        user=user,
        rentals=rentals,
        reviews=reviews
    )

# 18) Admi (update user)
@views.route('/api/update_user', methods=['POST'])
@login_required
def update_user():
    if current_user.role not in ['employee', 'manager']:
        return '', 403

    data = request.get_json()

    account_id = data.get('account_id')
    username = data.get('username')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    role = data.get('role')
    email = data.get('email')
    password = data.get('password', None)

    job_title = data.get('job_title', None)
    salary = data.get('salary', None)

    # Restrict employee/manager updates to only managers
    if role in ['employee', 'manager'] and current_user.role.lower() != 'manager':
        return jsonify({'success': False, 'error': 'Only managers can assign employee or manager roles.'}), 403

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if password:
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            cursor.execute("""
                UPDATE users 
                SET username = %s, first_name = %s, last_name = %s,
                    phone = %s, role = %s, email = %s, password_ = %s
                WHERE account_id = %s
            """, (username, first_name, last_name, phone, role, email, hashed_password, account_id))
        else:
            cursor.execute("""
                UPDATE users 
                SET username = %s, first_name = %s, last_name = %s,
                    phone = %s, role = %s, email = %s
                WHERE account_id = %s
            """, (username, first_name, last_name, phone, role, email, account_id))

            if role in ['employee', 'manager'] and job_title is not None and salary is not None:
                cursor.execute("SELECT 1 FROM employees WHERE account_id = %s", (account_id,))
                if cursor.fetchone():
                    # update existing
                    cursor.execute("""
                        UPDATE employees
                        SET job_title = %s, salary = %s
                        WHERE account_id = %s
                    """, (job_title, salary, account_id))
                else:
                    # insert new
                    cursor.execute("""
                        INSERT INTO employees (account_id, job_title, salary)
                        VALUES (%s, %s, %s)
                    """, (account_id, job_title, salary))

        conn.commit()
        cursor.close()

        return jsonify({'success': True})
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error updating user: {e}")
        return jsonify({'success': False, 'error': 'Failed to update user'}), 500
    finally:
        if conn:
            conn.close()

# 17) API: random movue
@views.route('/api/movies/random')
def get_random_movies():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT movie_id, title, image_path FROM movies ORDER BY RAND() LIMIT 10")
        movies = cursor.fetchall()

        for movie in movies:
            if not movie['image_path']:
                movie['image_path'] = 'keyboard.jpg'

        cursor.close()

        return jsonify(movies)
    finally:
        if conn:
            conn.close()

# 18) API: only all movies
@views.route('/api/movies/all')
def get_all_movies():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM movies")
        movies = cursor.fetchall()
        cursor.close()

        return jsonify(movies)
    finally:
        if conn:
            conn.close()

# 19) API: movie details page
@views.route('/movie/<int:movie_id>')
def movie_details(movie_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get movie details
        cursor.execute("SELECT * FROM movies WHERE movie_id = %s", (movie_id,))
        movie = cursor.fetchone()

        if not movie:
            cursor.close()
            abort(404, description="Movie not found.")

        # Get genre list
        cursor.execute("""
            SELECT g.genre_name
            FROM genres g
            JOIN moviegenres mg ON g.genre_id = mg.genre_id
            WHERE mg.movie_id = %s
        """, (movie_id,))
        genres = [row['genre_name'] for row in cursor.fetchall()]

        # Get reviews
        cursor.execute("""
            SELECT r.rating, r.review_comment, u.username, r.review_date
            FROM reviews r
            JOIN users u ON r.account_id = u.account_id
            WHERE r.movie_id = %s
            ORDER BY r.review_date DESC
        """, (movie_id,))

        reviews = cursor.fetchall()
        cursor.close()

        return render_template("movieDetails.html", movie=movie, genres=genres, reviews=reviews)
    finally:
        if conn:
            conn.close()

# 20) return movie 
@views.route('/api/return_movie/<int:rental_id>/<int:movie_id>', methods=['POST'])
@login_required
def return_single_movie(rental_id: int, movie_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE  rental_movies rm
            JOIN    rentals       r   ON r.rentalID = rm.rental_id
            SET     rm.return_date = NOW()
            WHERE   rm.rental_id  = %s
              AND   rm.movie_id   = %s
              AND   r.account_id  = %s      -- ensure ownership
              AND   rm.return_date IS NULL  -- only if not yet returned
        """, (rental_id, movie_id, current_user.id))
        conn.commit()

        if cursor.rowcount == 0:      
            cursor.execute("""
                SELECT rm.return_date
                FROM   rental_movies rm
                JOIN   rentals       r ON r.rentalID = rm.rental_id
                WHERE  rm.rental_id = %s
                  AND  rm.movie_id  = %s
            """, (rental_id, movie_id))
            row = cursor.fetchone()
            cursor.close()

            if row is None:
                return jsonify({"success": False,
                                "message": "Rental/movie not found."}), 404
            if row[0] is not None:
                return jsonify({"success": False,
                                "message": "Movie already returned."}), 409
            return jsonify({"success": False,
                            "message": "Not authorized to return this movie."}), 403

        cursor.close()
        return jsonify({"success": True, "message": "Movie returned!"})
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error returning movie: {e}")
        return jsonify({"success": False, "message": "Failed to return movie"}), 500
    finally:
        if conn:
            conn.close()

#21) API : user review search 
@views.route('/api/search_rented_movies')
@login_required
def search_rented_movies():
    if current_user.role != 'customer':
        return jsonify([])

    query = request.args.get('query', '').lower()

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT DISTINCT m.movie_id, m.title
            FROM rentals r
            JOIN rental_movies rm ON r.rentalID = rm.rental_id
            JOIN movies m ON rm.movie_id = m.movie_id
            WHERE r.account_id = %s AND LOWER(m.title) LIKE %s
        """, (current_user.id, f"%{query}%"))

        results = cursor.fetchall()
        cursor.close()

        return jsonify(results)
    finally:
        if conn:
            conn.close()

#22) add to cart redirect logic for non loggedin(not implemeted yet)
@views.route('/add_to_cart/<int:movie_id>')
def add_to_cart(movie_id):
    cart = session.get('cart', [])

    if movie_id not in cart:
        cart.append(movie_id)
        session['cart'] = cart

    # If the user is logged in, go straight to cart
    if current_user.is_authenticated:
        return redirect(url_for('views.view_cart'))
    else:
        session['next'] = url_for('views.view_cart')
        return redirect(url_for('auth.login'))
    
#23) route to usercart
@views.route('/UserCart')
def view_cart():
    if not current_user.is_authenticated:
        session['next'] = request.path
        return redirect(url_for('auth.login'))
    
    return render_template('UserCart.html')

#24) UPDATE Movie
@views.route('/api/update_movie', methods=['POST'])
@login_required
def update_movie():
    if current_user.role not in ['employee', 'manager']:
        return '', 403

    data = request.get_json()
    movie_id = data.get("movie_id")
    title = data.get("title")
    release_year = int(data.get("release_year", 0))
    rating = data.get("rating")
    price = float(data.get("price", 0))
    image_path = data.get("image_path", "keyboard.jpg")
    description = data.get("description") or None
    trailer_url = data.get("trailer_url") or None
    genre_ids = data.get("genre_ids", [])

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Update movie details
        cursor.execute("""
            UPDATE movies
            SET title = %s, release_year = %s, rating = %s,
                price = %s, image_path = %s, description = %s,
                trailer_url = %s
            WHERE movie_id = %s
        """, (title, release_year, rating, price, image_path, description, trailer_url, movie_id))

        # Update genres
        cursor.execute("DELETE FROM moviegenres WHERE movie_id = %s", (movie_id,))
        for gid in genre_ids:
            cursor.execute("INSERT INTO moviegenres (movie_id, genre_id) VALUES (%s, %s)", (movie_id, gid))

        conn.commit()
        cursor.close()

        return jsonify({"success": True, "message": "Movie updated successfully"})
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error updating movie: {e}")
        return jsonify({"success": False, "error": "Failed to update movie"}), 500
    finally:
        if conn:
            conn.close()

#25) DELETE Movie
@views.route('/api/delete_movie', methods=['POST'])
@login_required
def delete_movie():
    if current_user.role not in ['employee', 'manager']:
        return '', 403

    data = request.get_json()
    movie_id = data.get("movie_id")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Remove genre relations
        cursor.execute("DELETE FROM moviegenres WHERE movie_id = %s", (movie_id,))
        # Remove the movie
        cursor.execute("DELETE FROM movies WHERE movie_id = %s", (movie_id,))

        conn.commit()
        cursor.close()

        return jsonify({"success": True, "message": "Movie deleted successfully"})
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error deleting movie: {e}")
        return jsonify({"success": False, "error": "Failed to delete movie"}), 500
    finally:
        if conn:
            conn.close()

@views.route('/api/reviews/random')
def get_random_reviews():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Pull 5  random reviews, joined to user & movie for display
        cursor.execute("""
            SELECT
              r.review_id,
              r.rating,
              r.review_comment,
              DATE_FORMAT(r.review_date, '%b %d, %Y') AS review_date,
              u.username,
              m.title        AS movie_title
            FROM reviews r
            JOIN users  u ON r.account_id = u.account_id
            JOIN movies m ON r.movie_id   = m.movie_id
            ORDER BY RAND()
            LIMIT 5
        """)
        reviews = cursor.fetchall()
        cursor.close()

        return jsonify(reviews)
    finally:
        if conn:
            conn.close()
