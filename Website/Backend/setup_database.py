"""
One-time database initialization route
Visit https://blockboster-rentals.onrender.com/setup-database-now
to create all tables and import sample data
"""
from flask import Blueprint
from Website.Backend import get_db_connection

setup_bp = Blueprint('setup', __name__)

@setup_bp.route('/check-tables')
def check_tables():
    """View current database tables and row counts"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        results = ["<h2>Database Tables</h2><pre>"]
        results.append(f"Database: defaultdb")
        results.append(f"Total tables: {len(tables)}\n")
        
        for (table_name,) in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            results.append(f"  ✓ {table_name}: {count} rows")
        
        cursor.close()
        conn.close()
        
        results.append("</pre>")
        return "\n".join(results)
        
    except Exception as e:
        return f"<h2>Error</h2><pre>{str(e)}</pre>", 500

@setup_bp.route('/setup-database-now')
def setup_database():
    """Initialize database with all tables and sample data"""
    
    # SQL commands to execute
    sql_commands = """
USE defaultdb;

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS rental_movies;
DROP TABLE IF EXISTS rentals;
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS moviegenres;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  account_id int(11) NOT NULL AUTO_INCREMENT,
  username varchar(50) NOT NULL,
  password_ varchar(255) NOT NULL,
  role enum('employee','customer','manager') NOT NULL,
  first_name varchar(50) NOT NULL,
  last_name varchar(50) NOT NULL,
  email varchar(100) NOT NULL,
  phone varchar(15) NOT NULL,
  PRIMARY KEY (account_id),
  UNIQUE KEY username (username),
  UNIQUE KEY email (email),
  UNIQUE KEY phone (phone)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4;

CREATE TABLE customers (
  account_id int(11) NOT NULL,
  address varchar(100) NOT NULL,
  PRIMARY KEY (account_id),
  CONSTRAINT customers_ibfk_1 FOREIGN KEY (account_id) REFERENCES users (account_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE employees (
  account_id int(11) NOT NULL,
  job_title varchar(100) NOT NULL,
  salary decimal(10,2) NOT NULL,
  PRIMARY KEY (account_id),
  CONSTRAINT employees_ibfk_1 FOREIGN KEY (account_id) REFERENCES users (account_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE genres (
  genre_id int(11) NOT NULL AUTO_INCREMENT,
  genre_name varchar(50) NOT NULL,
  PRIMARY KEY (genre_id),
  UNIQUE KEY genre_name (genre_name)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4;

CREATE TABLE movies (
  movie_id int(11) NOT NULL AUTO_INCREMENT,
  title varchar(100) NOT NULL,
  release_year year(4) NOT NULL,
  rating varchar(10) DEFAULT NULL,
  price decimal(5,2) NOT NULL,
  image_path varchar(255) DEFAULT 'default.jpg',
  description text,
  trailer_url varchar(255) DEFAULT NULL,
  PRIMARY KEY (movie_id)
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4;

CREATE TABLE moviegenres (
  movie_id int(11) NOT NULL,
  genre_id int(11) NOT NULL,
  PRIMARY KEY (movie_id,genre_id),
  KEY genre_id (genre_id),
  CONSTRAINT moviegenres_ibfk_1 FOREIGN KEY (movie_id) REFERENCES movies (movie_id) ON DELETE CASCADE,
  CONSTRAINT moviegenres_ibfk_2 FOREIGN KEY (genre_id) REFERENCES genres (genre_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payment (
  payment_id int(11) NOT NULL AUTO_INCREMENT,
  account_id int(11) NOT NULL,
  card_holder_name varchar(100) NOT NULL,
  card_number varchar(19) NOT NULL,
  expiration_month tinyint(4) NOT NULL,
  expiration_year smallint(6) NOT NULL,
  discount_code varchar(20) DEFAULT NULL,
  discounted_amount decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (payment_id),
  KEY account_id (account_id),
  CONSTRAINT payment_ibfk_1 FOREIGN KEY (account_id) REFERENCES customers (account_id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4;

CREATE TABLE rentals (
  rentalID int(11) NOT NULL AUTO_INCREMENT,
  account_id int(11) DEFAULT NULL,
  payment_id int(11) DEFAULT NULL,
  total_price decimal(10,2) NOT NULL,
  PRIMARY KEY (rentalID),
  KEY account_id (account_id),
  KEY payment_id (payment_id),
  CONSTRAINT rentals_ibfk_1 FOREIGN KEY (account_id) REFERENCES customers (account_id) ON DELETE CASCADE,
  CONSTRAINT rentals_ibfk_2 FOREIGN KEY (payment_id) REFERENCES payment (payment_id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4;

CREATE TABLE rental_movies (
  rental_id int(11) NOT NULL,
  movie_id int(11) NOT NULL,
  price decimal(10,2) NOT NULL,
  rental_date date DEFAULT NULL,
  return_date date DEFAULT NULL,
  PRIMARY KEY (rental_id,movie_id),
  KEY movie_id (movie_id),
  CONSTRAINT rental_movies_ibfk_1 FOREIGN KEY (rental_id) REFERENCES rentals (rentalID) ON DELETE CASCADE,
  CONSTRAINT rental_movies_ibfk_2 FOREIGN KEY (movie_id) REFERENCES movies (movie_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reviews (
  review_id int(11) NOT NULL AUTO_INCREMENT,
  movie_id int(11) NOT NULL,
  account_id int(11) NOT NULL,
  review_date datetime DEFAULT CURRENT_TIMESTAMP,
  rating decimal(3,1) NOT NULL,
  review_comment text,
  PRIMARY KEY (review_id),
  KEY movie_id (movie_id),
  KEY account_id (account_id),
  CONSTRAINT reviews_ibfk_1 FOREIGN KEY (movie_id) REFERENCES movies (movie_id),
  CONSTRAINT reviews_ibfk_2 FOREIGN KEY (account_id) REFERENCES customers (account_id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4;

INSERT INTO genres (genre_id, genre_name) VALUES (1, 'Sci-Fi'), (2, 'Action'), (3, 'Family'), (4, 'Romance'), (5, 'Comedy'), (6, 'Fantasy');

INSERT INTO users (username, password_, role, first_name, last_name, email, phone) VALUES ('Admin', '$2b$12$wa4KemzvpKcGZZBtDVbMW.wdpg3RGLsGyl8aSKwdelSzH97rGQrwW', 'employee', 'Matt', 'Huckman', 'matt@example.com', '111-111-1111');
INSERT INTO users (username, password_, role, first_name, last_name, email, phone) VALUES ('TestUser', '$2b$12$wa4KemzvpKcGZZBtDVbMW.wdpg3RGLsGyl8aSKwdelSzH97rGQrwW', 'customer', 'Tom', 'West', 'west@example.com', '222-222-2222');

INSERT INTO employees (account_id, job_title, salary) SELECT account_id, 'Administrator', 50000.00 FROM users WHERE username = 'Admin';
INSERT INTO customers (account_id, address) SELECT account_id, 'N/A' FROM users WHERE username = 'TestUser';
"""
    
    # Split INSERT INTO movies separately due to length
    movies_sql = """
INSERT INTO movies (movie_id, title, release_year, rating, price, image_path) VALUES
(1, 'Interstellar', 2014, 'PG-13', 13.99, 'interstellar.jpg'),
(2, 'The Matrix', 1999, 'R', 12.99, 'the_matrix.jpg'),
(3, 'The Dark Knight', 2008, 'PG-13', 13.99, 'the_dark_knight.jpg'),
(4, 'Inception', 2010, 'PG-13', 13.99, 'inception.jpg'),
(5, 'Frozen', 2013, 'PG', 3.99, 'frozen.jpg'),
(6, 'Avatar', 2009, 'PG-13', 13.99, 'avatar.jpg'),
(7, 'The Lion King', 1994, 'G', 14.99, 'the_lion_king.jpg'),
(8, 'Avengers: Endgame', 2019, 'PG-13', 18.99, 'avengers_endgame.jpg'),
(9, 'Star Wars: A New Hope', 1977, 'PG', 15.49, 'star_wars_a_new_hope.jpg'),
(10, 'Toy Story 3', 2010, 'G', 10.49, 'toy_story_3.jpg');
"""
    
    genres_mapping_sql = """
INSERT INTO moviegenres (movie_id, genre_id) VALUES 
(1, 1), (1, 6), (2, 1), (2, 2), (3, 2), (3, 6), (4, 1), (4, 2),
(5, 3), (5, 6), (6, 1), (6, 2), (7, 3), (7, 6), (8, 2), (8, 6),
(9, 1), (9, 2), (10, 3), (10, 6);
"""
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        results = ["<h2>Database Setup Started...</h2><pre>"]
        
        # Execute main schema
        for statement in sql_commands.split(';'):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                    conn.commit()
                    if 'CREATE TABLE' in statement.upper():
                        table = statement.split('(')[0].split()[-1]
                        results.append(f"✓ Created table: {table}")
                    elif 'DROP TABLE' in statement.upper():
                        results.append(f"✓ Dropped old tables")
                    elif 'INSERT INTO users' in statement:
                        results.append(f"✓ Added users")
                    elif 'INSERT INTO genres' in statement:
                        results.append(f"✓ Added genres")
                except Exception as e:
                    results.append(f"✗ Error: {str(e)[:200]}")
        
        # Execute movies insert
        try:
            cursor.execute(movies_sql)
            conn.commit()
            results.append(f"✓ Added 10 sample movies")
        except Exception as e:
            results.append(f"✗ Movies error: {str(e)[:200]}")
        
        # Execute genre mappings
        try:
            cursor.execute(genres_mapping_sql)
            conn.commit()
            results.append(f"✓ Linked movies to genres")
        except Exception as e:
            results.append(f"✗ Mapping error: {str(e)[:200]}")
        
        cursor.close()
        conn.close()
        
        results.append("\n\n=== DATABASE READY! ===")
        results.append("\nLogin credentials:")
        results.append("  Admin:    username='Admin'    password='password'")
        results.append("  Customer: username='TestUser' password='password'")
        results.append("\nYour site should now work at: https://blockboster-rentals.onrender.com")
        results.append("</pre>")
        
        return "\n".join(results)
        
    except Exception as e:
        return f"<h2>Setup Failed</h2><pre>Error: {str(e)}</pre>", 500
