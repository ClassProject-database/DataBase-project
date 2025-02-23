from flask import Blueprint, render_template
import requests

 
views = Blueprint('views',__name__)

#Creates another page or route, return renders the "fileName.html" 
@views.route('/')
def HomePage():
    return render_template("home.html")

@views.route("/inventory")
def inventory():
    movies = [
        {"name": "Inception", "price": 14.99, "image": "movie1.jpg"},
        {"name": "Interstellar", "price": 18.99, "image": "movie2.jpg"},
        {"name": "The Dark Knight", "price": 12.99, "image": "movie3.jpg"},
        {"name": "The Matrix", "price": 10.99, "image": "movie4.jpg"},
    ]
    return render_template("inventory.html", movies=movies)




