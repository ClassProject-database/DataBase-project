import mysql.connector
from flask import Flask

app= Flask(__name__)

mydb = mysql.connector.connect(
  host='127.0.0.1',
  user="root",
  password="root",
  database="database_practice",
  port=3306
)

@app.route("/Getinventory")
def inventoryPage():
    cursor = mydb.cursor()

    cursor.execute("select * from cars")

    rows = cursor.fetchall()
    return rows

if __name__ == '__main__':
    app.run(port=6969)   