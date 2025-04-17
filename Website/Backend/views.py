from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash, abort, current_app
from flask_login import login_required, current_user
from . import get_db_connection, bcrypt
from flask import session

views = Blueprint('views', __name__)

# 1) Home Page
@views.route('/')
def HomePage():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT movie_id, title, image_path FROM movies ORDER BY RAND() LIMIT 10")
    featured_movies = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template('home.html', featured_movies=featured_movies)

# 
# 2)  Inventory Page
# 
@views.route('/inventory')
def inventory():
    """
    Renders the catalog page with:
      • movies  – each row has .genre_ids = ['1','2',…]
      • genres  – for the filter buttons
    """
    conn   = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 1) all genres
    cursor.execute("SELECT * FROM genres ORDER BY genre_name;")
    genres = cursor.fetchall()

    # 2) movies +   "1,2,5"  string of genre_ids  (MySQL GROUP_CONCAT)
    cursor.execute("""
        SELECT 
            m.*,
            COALESCE(GROUP_CONCAT(mg.genre_id), '') AS genre_ids
        FROM movies           AS m
        LEFT JOIN moviegenres AS mg ON m.movie_id = mg.movie_id
        GROUP BY m.movie_id
    """)
    rows = cursor.fetchall()

    # 3) turn  "1,2,5"  → ['1','2','5']   so Jinja can |join(',')
    for r in rows:
        r["genre_ids"] = r["genre_ids"].split(',') if r["genre_ids"] else []

    cursor.close(); conn.close()
    return render_template(
        "inventory.html",
        movies = rows,
        genres = genres
    )


# 
# 3)  API  /api/movies
# 
@views.route('/api/movies')
def get_movies():
    """
    Returns JSON list of movies.
    Optional   ?genre_id=3   filters by genre.
    Each movie includes   "genre_ids": "1,3,5"   (comma string for compact JSON)
    """
    conn   = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    genre_id = request.args.get('genre_id', type=int)

    if genre_id:
        cursor.execute("""
            SELECT m.*,
                   GROUP_CONCAT(mg.genre_id) AS genre_ids
            FROM movies           AS m
            JOIN moviegenres      AS mg ON m.movie_id = mg.movie_id
            WHERE mg.genre_id = %s
            GROUP BY m.movie_id
        """, (genre_id,))
    else:
        cursor.execute("""
            SELECT m.*,
                   GROUP_CONCAT(mg.genre_id) AS genre_ids
            FROM movies           AS m
            LEFT JOIN moviegenres AS mg ON m.movie_id = mg.movie_id
            GROUP BY m.movie_id
        """)

    movies = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(movies)


@views.route("/admin/user/<int:account_id>")
@login_required
def admin_user_view(account_id):
    conn   = get_db_connection()
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
    conn.close()

    return render_template(
        "adminViewUser.html",
        user=user,
        rentals=rentals
    )


# 4) Admin Dashboard
@views.route('/admin', methods=['GET'])
@login_required
def admin_dashboard():
    if current_user.role not in ['employee', 'manager']:
        abort(403, description="Only employees and managers can access the admin dashboard.")


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
    conn.close()

    return render_template("adminDashboard.html", users=users, genres=genres, search_query=search_query)

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

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT 1 FROM users WHERE username = %s", (username,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
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
    conn.close()

    return jsonify({'success': True, 'message': 'User added successfully!'})



# 7) API: Delete User..
@views.route('/api/delete_user', methods=['POST'])
@login_required
def delete_user():
    if current_user.role not in ['employee', 'manager']:
        return '', 403


    data = request.get_json()
    account_id = data.get('account_id')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Fetch the target user's role
    cursor.execute("SELECT role FROM users WHERE account_id = %s", (account_id,))
    target = cursor.fetchone()
    if not target:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    # Only allow deleting customers unless you're a manager
    if target['role'] in ['employee', 'manager'] and (current_user.role or '').lower() != 'manager':
        return jsonify({'success': False, 'error': 'Only managers can delete employees or managers.'}), 403

    cursor.execute("DELETE FROM users WHERE account_id = %s", (account_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'success': True, 'message': 'User deleted successfully'})

# 14) API: Add Movie
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

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

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
    conn.close()

    return jsonify({
        "success": True,
        "message": "Movie added successfully",
        "movie_id": movie_id
    }), 201

# 8) API: Post Review
@views.route('/api/post_review', methods=['POST'])
@login_required
def post_review():
    data = request.get_json()

    movie_id = data.get('movie_id')
    rating = data.get('rating')
    review_comment = data.get('review_comment') 

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT account_id FROM users WHERE account_id = %s", (current_user.id,))
    user = cursor.fetchone()

    cursor.execute("""
        INSERT INTO reviews (movie_id, account_id, rating, review_comment)
        VALUES (%s, %s, %s, %s)
    """, (movie_id, user['account_id'], rating, review_comment))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'success': True})


# 9) Reviews Page
@views.route('/reviews')
def reviews_page():
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
    conn.close()

    return render_template("reviews.html", reviews=reviews)

#10) Admin search
@views.route('/api/search_users')
@login_required
def search_users():
    if current_user.role not in ['employee', 'manager']:
        return jsonify([])

    search_query = request.args.get('query', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT * FROM users
        WHERE username LIKE %s OR account_id LIKE %s
    """, (f"%{search_query}%", f"%{search_query}%"))
    users = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(users)


# 11) Checkout Page
@views.route('/checkout', methods=['GET'])
@login_required
def checkout_page():
    return render_template("checkout.html")


# 12) API: Delete Rental
@views.route('/api/delete_rental', methods=['POST'])
@login_required
def delete_rental():
    data = request.get_json()
    rental_id = data.get('rental_id')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("DELETE FROM rentals WHERE rentalID = %s AND account_id = %s", (rental_id, current_user.id))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'success': True})


# 13) API: Get Rentals
@views.route('/api/rentals', methods=['GET'])
@login_required
def get_rentals():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT r.rentalID,
               r.rental_date,
               r.return_date,
               r.total_price,
               m.title,
               rm.price AS rental_price
        FROM rentals r
        JOIN rental_movies rm ON r.rentalID = rm.rental_id
        JOIN movies m ON rm.movie_id = m.movie_id
        WHERE r.account_id = %s
    """, (current_user.id,))
    rentals = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(rentals)


@views.route('/api/checkout', methods=['POST'])
@login_required
def checkout():
    data = request.get_json()
    cart_items = data["cart"]
    total_price = float(data["amount"])
    discount_code = data.get("discount_code", "").upper().strip()
    card_number = data.get("card_number","").strip()
    card_name = data.get("card_holder_name", "").strip()
    expiration = data.get("expiration", "").strip()
    hashed_cardNumber = bcrypt.generate_password_hash(card_number).decode('utf-8')
    expiration_month, expiration_year = map(int, expiration.split("/"))
    if expiration_year < 100:
        expiration_year += 2000
   
    if discount_code == "VIP":
        final_price = round(total_price * 0.80, 2)
    elif discount_code == "ADMIN":
        final_price = 0.00
    else:
        final_price = round(total_price, 2)
        discount_code = None

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM customers WHERE account_id = %s", (current_user.id,))
    if cursor.fetchone() is None:
        cursor.execute("INSERT INTO customers (account_id, address) VALUES (%s, %s)", (current_user.id, "Unknown"))

    # Insert into payment
    cursor.execute("""
        INSERT INTO payment (
            account_id, card_holder_name, card_number,
            expiration_month, expiration_year,
            discount_code, discounted_amount
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        current_user.id,
        card_name,
        hashed_cardNumber,
        expiration_month,
        expiration_year,
        discount_code,
        final_price
    ))
    conn.commit()
    payment_id = cursor.lastrowid

    # Insert into rentals
    cursor.execute("""
    INSERT INTO rentals (
        account_id, payment_id, rental_date, return_date, total_price
    )
    VALUES (
        %s, 
        %s, 
        CURDATE(), 
        NULL, 
        %s
    )
""", (current_user.id, payment_id, final_price))

    conn.commit()
    rental_id = cursor.lastrowid


    # Link each rented movie
    for item in cart_items:
        movie_id = item.get("movie_id")
        original_price = float(item.get("price", 0.00))
        line_price = 0.00 if discount_code == "ADMIN" else original_price

        cursor.execute("""
            INSERT INTO rental_movies (rental_id, movie_id, price)
            VALUES (%s, %s, %s)
        """, (rental_id, movie_id, line_price))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True, "message": "Checkout complete!"})

# 15) API: Get User
@views.route('/api/get_user', methods=['GET'])
@login_required
def get_user():
    if current_user.role not in ['employee', 'manager']:
        return '', 403

    account_id = request.args.get('account_id')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Fetch user base info
    cursor.execute("SELECT * FROM users WHERE account_id = %s", (account_id,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return jsonify({'error': 'User not found'}), 404

    # If employee or manager, also fetch job_title and salary
    if user['role'] in ['employee', 'manager']:
        cursor.execute("SELECT job_title, salary FROM employees WHERE account_id = %s", (account_id,))
        emp_data = cursor.fetchone()
        if emp_data:
            user.update(emp_data)

    cursor.close()
    conn.close()

    return jsonify(user)



@views.route('/user_Rentals')
@login_required
def user_rentals():
    if current_user.role != 'customer':
        abort(403, description="Only customers can access the dashboard.")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Fetch basic user info
    cursor.execute("SELECT * FROM users WHERE account_id = %s", (current_user.id,))
    user = cursor.fetchone()

    # Fetch rental history
    cursor.execute("""
        SELECT r.rentalID, r.rental_date, r.return_date,
               rm.price AS rental_price, m.title
        FROM rentals r
        JOIN rental_movies rm ON r.rentalID = rm.rental_id
        JOIN movies m ON rm.movie_id = m.movie_id
        WHERE r.account_id = %s
        ORDER BY r.rental_date DESC
    """, (current_user.id,))
    rentals = cursor.fetchall()

    # Fetch reviews
    cursor.execute("""
        SELECT r.rating, r.review_comment, r.review_date, m.title
        FROM reviews r
        JOIN movies m ON r.movie_id = m.movie_id
        WHERE r.account_id = %s
        ORDER BY r.review_date DESC
    """, (current_user.id,))
    reviews = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template('userRentals.html', user=user, rentals=rentals, reviews=reviews)


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
        cursor.execute("""
            UPDATE employees 
            SET job_title = %s, salary = %s
            WHERE account_id = %s
        """, (job_title, salary, account_id))

        if cursor.rowcount == 0:
            cursor.execute("""
                INSERT INTO employees (account_id, job_title, salary)
                VALUES (%s, %s, %s)
            """, (account_id, job_title, salary))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'success': True})


# 17) API: random movue
@views.route('/api/movies/random')
def get_random_movies():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT movie_id, title, image_path FROM movies ORDER BY RAND() LIMIT 10")
    movies = cursor.fetchall()

    for movie in movies:
        if not movie['image_path']:
            movie['image_path'] = 'keyboard.jpg'

    cursor.close()
    conn.close()

    return jsonify(movies)

# 18) API: all movies
@views.route('/api/movies/all')
def get_all_movies():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM movies")
    movies = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(movies)

# 19) API: movie details page
@views.route('/movie/<int:movie_id>')
def movie_details(movie_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Get movie details
    cursor.execute("SELECT * FROM movies WHERE movie_id = %s", (movie_id,))
    movie = cursor.fetchone()

    if not movie:
        cursor.close()
        conn.close()
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
    conn.close()

    return render_template("movieDetails.html", movie=movie, genres=genres, reviews=reviews)

#20) API : return movie 
@views.route('/api/return_movie/<int:rentalId>', methods=['POST'])
@login_required
def return_movie(rentalId):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Update return_date if it's not eturned
    cursor.execute("""
        UPDATE rentals
        SET return_date = NOW()
        WHERE rentalID = %s AND return_date IS NULL AND account_id = %s
    """, (rentalId, current_user.id))
    
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True, "message": "Movie returned!"})

#21) API : user review search 
@views.route('/api/search_rented_movies')
@login_required
def search_rented_movies():
    if current_user.role != 'customer':
        return jsonify([])

    query = request.args.get('query', '').lower()

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
    conn.close()

    return jsonify(results)


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
    
@views.route('/UserCart')
def view_cart():
    if not current_user.is_authenticated:
        session['next'] = request.path
        return redirect(url_for('auth.login'))
    
    return render_template('UserCart.html')

# UPDATE Movie
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
    conn.close()

    return jsonify({"success": True, "message": "Movie updated successfully"})


# DELETE Movie
@views.route('/api/delete_movie', methods=['POST'])
@login_required
def delete_movie():
    if current_user.role not in ['employee', 'manager']:
        return '', 403

    data = request.get_json()
    movie_id = data.get("movie_id")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Remove genre relations
    cursor.execute("DELETE FROM moviegenres WHERE movie_id = %s", (movie_id,))
    # Remove the movie itself
    cursor.execute("DELETE FROM movies WHERE movie_id = %s", (movie_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True, "message": "Movie deleted successfully"})
