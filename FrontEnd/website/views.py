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
    port=3306
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
    
    # Check if filtering by genre
    genre_id = request.args.get('genre_id', type=int)
    if genre_id:
        query = "SELECT * FROM movies WHERE genre_id = %s;"
        cursor.execute(query, (genre_id,))
    else:
        query = "SELECT * FROM movies;"
        cursor.execute(query)
    
    movies = cursor.fetchall()
    cursor.close()
    return jsonify(movies)

@views.route('/')
def HomePage():
    return render_template("home.html")



