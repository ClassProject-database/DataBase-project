from flask import Blueprint, render_template, jsonify
from flask import Flask, render_template, jsonify, request
import mysql.connector

app = Flask(__name__)
views = Blueprint('views', __name__)
# Connect to the MySQL database
mydb = mysql.connector.connect(
    host='127.0.0.1',
    user='root',
    password='root',
    database='movie_rental',
    port=8889
)

@views.route('/inventory2')
def inventory2():
    cursor = mydb.cursor(dictionary=True)
    
    # Fetch all genres for filter buttons
    cursor.execute("SELECT * FROM Genres;")
    genres = cursor.fetchall()

    # Fetch all movies by default
    cursor.execute("SELECT * FROM movies;")
    movies = cursor.fetchall()
    
    cursor.close()
    
    return render_template("inventory2.html", movies=movies, genres=genres)

@views.route('/api/movies')
def get_movies():
    cursor = mydb.cursor(dictionary=True)

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
            query = "SELECT * FROM Movies;"
            cursor.execute(query)
        
        movies = cursor.fetchall()
        return jsonify(movies)
    
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return jsonify({"error": "Database query failed"}), 500

    finally:
        cursor.close()


@views.route('/')
def HomePage():
    return render_template("home.html")



