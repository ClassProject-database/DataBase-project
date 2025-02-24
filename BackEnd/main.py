
from flask import Flask, render_template, jsonify
import mysql.connector

app = Flask(__name__)

# Connect to the MySQL database
mydb = mysql.connector.connect(
    host='127.0.0.1',
    user='root',
    password='root',
    database='movie_rental',
    port=3306
)
if __name__ == '__main__':
    app.run(debug=True)