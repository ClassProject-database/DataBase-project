from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash, abort, current_app
from flask_login import login_required, current_user
from . import get_db_connection, bcrypt

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


# 2) Inventory Page
@views.route('/inventory')
def inventory():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM genres;")
    genres = cursor.fetchall()

    cursor.execute("SELECT * FROM movies;")
    movies = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("inventory.html", movies=movies, genres=genres)


# 3) API to Fetch Movies
@views.route('/api/movies')
def get_movies():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    genre_id = request.args.get('genre_id', type=int)
    if genre_id is not None:
        cursor.execute("""
            SELECT DISTINCT m.* 
            FROM movies m
            JOIN moviegenres mg ON m.movie_id = mg.movie_id
            WHERE mg.genre_id = %s
        """, (genre_id,))
        movies = cursor.fetchall()
    else:
        cursor.execute("SELECT * FROM movies")
        movies = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(movies)



@views.route("/admin/user/<int:account_id>")
@login_required
def admin_user_view(account_id):
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
        SELECT r.rentalID, r.rental_date, r.return_date, m.title, m.movie_id
        FROM rentals r
        LEFT JOIN movies m ON r.movie_id = m.movie_id
        WHERE r.account_id = %s
        ORDER BY r.rental_date DESC
    """, (account_id,))
    rentals = cursor.fetchall()

    cursor.close()
    conn.close()

    # 3) Render template
    return render_template(
        "adminViewUser.html",
        user=user,
        rentals=rentals
    )


# 4) Admin Dashboard
@views.route('/admin', methods=['GET'])
@login_required
def admin_dashboard():
    if current_user.role != 'employee':
        abort(403, description="Only employees can access the admin dashboard.")

    search_query = request.args.get('search', '')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Fetch users 
    if search_query:
        cursor.execute("""
            SELECT * FROM users 
            WHERE username LIKE %s OR account_id LIKE %s
        """, (f"%{search_query}%", f"%{search_query}%"))
    else:
        cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()

    # Fetch genres from the genres table
    cursor.execute("SELECT genre_id, genre_name FROM genres")
    genres = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("adminDashboard.html", users=users, genres=genres, search_query=search_query)



# 5) User Rentals Page
@views.route('/user_rentals', methods=['GET'])
@login_required
def user_rentals():
    if current_user.role != 'customer':
        flash("Only customers can view personal rentals.", "error")
        return redirect(url_for('views.HomePage'))

    account_id = current_user.id
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE account_id = %s", (account_id,))
    user_info = cursor.fetchone()

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
    """, (account_id,))
    rentals = cursor.fetchall()

    cursor.execute("""
        SELECT rev.review_id,
               rev.review_date,
               rev.rating,
               rev.review_comment,
               m.title
        FROM reviews rev
        JOIN movies m ON rev.movie_id = m.movie_id
        WHERE rev.account_id = %s
    """, (account_id,))
    reviews = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("userRentals.html", user=user_info, rentals=rentals, reviews=reviews)


# 6) API: Add User
@views.route('/api/add_user', methods=['POST'])
@login_required
def add_user():
    if current_user.role != 'employee':
        return '', 403

    data = request.get_json()
    username = data.get('username')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    role = data.get('role')  
    email = data.get('email', '')  
    address = data.get('address', 'N/A')  
    job_title = data.get('job_title', 'Staff')
    salary = data.get('salary', 0.00)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    if cursor.fetchone():
        return jsonify({'success': False, 'error': 'Username already exists.'}), 400

    hashed_password = bcrypt.generate_password_hash("cat").decode('utf-8')

    cursor.execute("""
        INSERT INTO users (username, password_, role, first_name, last_name, email, phone)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (username, hashed_password, role, first_name, last_name, email, phone))
    conn.commit()
    new_account_id = cursor.lastrowid

    if role == 'customer':
        cursor.execute("""
            INSERT INTO customers (account_id, address)
            VALUES (%s, %s)
        """, (new_account_id, address))
        conn.commit()

    if role == 'employee':
        cursor.execute("""
            INSERT INTO employees (account_id, job_title, salary)
            VALUES (%s, %s, %s)
        """, (new_account_id, job_title, salary))
        conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'success': True, 'message': 'User added successfully!'})


# 7) API: Delete User
@views.route('/api/delete_user', methods=['POST'])
@login_required
def delete_user():
    if current_user.role != 'employee':
        return '', 403

    data = request.get_json()
    account_id = data['account_id']

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM users WHERE account_id = %s", (account_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'success': True, 'message': 'User deleted successfully'})


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


# 10) API: Search Users
@views.route('/api/search_users')
@login_required
def search_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    search_query = request.args.get('query', '').strip()

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
        VALUES (%s, %s, CURDATE(), NULL, %s)
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


# 14) API: Add Movie
@views.route('/api/add_movie', methods=['POST'])
@login_required
def add_movie():
    if current_user.role != 'employee':
        return '', 403

    data = request.get_json()
    title = data.get("title")
    rating = data.get("rating")
    image_path = data.get("image_path", "keyboard.jpg")
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
        INSERT INTO movies (title, release_year, rating, price, image_path)
        VALUES (%s, %s, %s, %s, %s)
    """, (title, release_year, rating, price, image_path))
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

# 15) API: Get User
@views.route('/api/get_user', methods=['GET'])
@login_required
def get_user():
    if current_user.role != 'employee':
        return '', 403

    account_id = request.args.get('account_id')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE account_id = %s", (account_id,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(user)


# 16) API: Update User
@views.route('/api/update_user', methods=['POST'])
@login_required
def update_user():
    if current_user.role != 'employee':
        return '', 403

    data = request.get_json()

    account_id = data.get('account_id')
    username = data.get('username')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    role = data.get('role')
    email = data.get('email')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        UPDATE users 
        SET username = %s, 
            first_name = %s, 
            last_name = %s, 
            phone = %s, 
            role = %s,
            email = %s
        WHERE account_id = %s
    """, (username, first_name, last_name, phone, role, email, account_id))

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
