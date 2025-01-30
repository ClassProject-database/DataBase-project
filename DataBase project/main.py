import mysql.connector

from website import creates_app

app=creates_app()


host_Info={
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'root',
    'database': 'database_practice',
    'port': 3306
    }

database= mysql.connector.connect(**host_Info)


if __name__== '__main__':
    app.run(debug=True)