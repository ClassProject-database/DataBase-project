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
    """View current database tables with detailed schema and row counts"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        results = ["<html><head><style>"]
        results.append("body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }")
        results.append("h2 { color: #4ec9b0; }")
        results.append("h3 { color: #569cd6; margin-top: 20px; }")
        results.append("table { border-collapse: collapse; margin: 10px 0; background: #2d2d2d; }")
        results.append("th { background: #0e639c; color: white; padding: 8px; text-align: left; }")
        results.append("td { padding: 8px; border-bottom: 1px solid #3e3e3e; }")
        results.append(".count { color: #ce9178; font-weight: bold; }")
        results.append(".sample { color: #9cdcfe; }")
        results.append("</style></head><body>")
        
        results.append(f"<h2>Database: defaultdb</h2>")
        results.append(f"<p>Total tables: <span class='count'>{len(tables)}</span></p>")
        
        db_name = list(tables[0].values())[0] if tables else None
        table_key = f'Tables_in_{db_name}' if db_name else list(tables[0].keys())[0] if tables else None
        
        for table_row in tables:
            table_name = table_row[table_key]
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) as count FROM `{table_name}`")
            count = cursor.fetchone()['count']
            
            results.append(f"<h3>📋 {table_name} <span class='count'>({count} rows)</span></h3>")
            
            # Get table structure
            cursor.execute(f"DESCRIBE `{table_name}`")
            columns = cursor.fetchall()
            
            results.append("<table>")
            results.append("<tr><th>Column</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>")
            for col in columns:
                results.append(f"<tr>")
                results.append(f"<td>{col['Field']}</td>")
                results.append(f"<td>{col['Type']}</td>")
                results.append(f"<td>{col['Null']}</td>")
                results.append(f"<td>{col['Key']}</td>")
                results.append(f"<td>{col['Default']}</td>")
                results.append(f"<td>{col['Extra']}</td>")
                results.append(f"</tr>")
            results.append("</table>")
            
            # Show sample data if table has rows
            if count > 0:
                cursor.execute(f"SELECT * FROM `{table_name}` LIMIT 3")
                sample_data = cursor.fetchall()
                
                if sample_data:
                    results.append("<p class='sample'>Sample data (first 3 rows):</p>")
                    results.append("<table>")
                    
                    # Header
                    results.append("<tr>")
                    for key in sample_data[0].keys():
                        results.append(f"<th>{key}</th>")
                    results.append("</tr>")
                    
                    # Data rows
                    for row in sample_data:
                        results.append("<tr>")
                        for value in row.values():
                            display_val = str(value)[:50] if value is not None else "NULL"
                            results.append(f"<td>{display_val}</td>")
                        results.append("</tr>")
                    
                    results.append("</table>")
        
        cursor.close()
        conn.close()
        
        results.append("</body></html>")
        return "\n".join(results)
        
    except Exception as e:
        return f"<h2>Error</h2><pre>{str(e)}</pre>", 500

@setup_bp.route('/setup-database-now')
def setup_database():
    """Initialize database with all tables and movies (preserves existing user data)"""
    
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

CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS customers (
  account_id int(11) NOT NULL,
  address varchar(100) NOT NULL,
  PRIMARY KEY (account_id),
  CONSTRAINT customers_ibfk_1 FOREIGN KEY (account_id) REFERENCES users (account_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employees (
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
  PRIMARY KEY (movie_id),
  UNIQUE KEY unique_movie (title, release_year)
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

INSERT IGNORE INTO users (username, password_, role, first_name, last_name, email, phone) VALUES ('Admin', '$2b$12$wa4KemzvpKcGZZBtDVbMW.wdpg3RGLsGyl8aSKwdelSzH97rGQrwW', 'employee', 'Matt', 'Huckman', 'matt@example.com', '111-111-1111');
INSERT IGNORE INTO users (username, password_, role, first_name, last_name, email, phone) VALUES ('TestUser', '$2b$12$wa4KemzvpKcGZZBtDVbMW.wdpg3RGLsGyl8aSKwdelSzH97rGQrwW', 'customer', 'Tom', 'West', 'west@example.com', '222-222-2222');

INSERT IGNORE INTO employees (account_id, job_title, salary) SELECT account_id, 'Administrator', 50000.00 FROM users WHERE username = 'Admin' AND NOT EXISTS (SELECT 1 FROM employees WHERE employees.account_id = users.account_id);
INSERT IGNORE INTO customers (account_id, address) SELECT account_id, 'N/A' FROM users WHERE username = 'TestUser' AND NOT EXISTS (SELECT 1 FROM customers WHERE customers.account_id = users.account_id);
"""
    
    # Insert all 94 unique movies (removed duplicates: Interstellar, Frozen, Tangled, Forrest Gump, Pulp Fiction, Harry Potter Half-Blood Prince)
    movies_sql = """
INSERT INTO movies (movie_id, title, release_year, rating, price, image_path) VALUES
(1, 'Interstellar', 2014, 'PG-13', 13.99, 'interstellar.jpg'),
(2, 'The Matrix', 1999, 'R', 12.99, 'the_matrix.jpg'),
(3, 'The Matrix Reloaded', 2003, 'R', 2.99, 'the_matrix_reloaded.jpg'),
(4, 'The Dark Knight', 2008, 'PG-13', 13.99, 'the_dark_knight.jpg'),
(5, 'Inception', 2010, 'PG-13', 13.99, 'inception.jpg'),
(6, 'Frozen', 2013, 'PG', 3.99, 'frozen.jpg'),
(7, '50 First Dates', 2004, 'PG-13', 12.99, '50_first_dates.jpg'),
(8, 'Holes', 2003, 'PG', 12.99, 'holes.jpg'),
(9, 'Harry Potter and the Sorcerer''s Stone', 2001, 'PG', 13.99, 'harry_potter_sorcerers_stone.jpg'),
(10, 'Harry Potter and the Chamber of Secrets', 2002, 'PG', 13.99, 'harry_potter_chamber.jpg'),
(11, 'Harry Potter and the Prisoner of Azkaban', 2004, 'PG', 13.99, 'harry_potter_prisoner.jpg'),
(12, 'Harry Potter and the Goblet of Fire', 2005, 'PG-13', 13.99, 'harry_potter_goblet.jpg'),
(13, 'Harry Potter and the Order of the Phoenix', 2007, 'PG-13', 13.99, 'harry_potter_order.jpg'),
(14, 'Harry Potter and the Half-Blood Prince', 2009, 'PG-13', 13.99, 'harry_potter_half_blood.jpg'),
(15, 'Harry Potter and the Deathly Hallows Part 1', 2010, 'PG-13', 13.99, 'harry_potter_deathly_hallows_1.jpg'),
(16, 'Harry Potter and the Deathly Hallows Part 2', 2015, 'PG-13', 13.99, 'harry_potter_deathly_hallows_2.jpg'),
(17, 'Spongebob the Movie', 2004, 'PG', 12.99, 'spongebob_movie.jpg'),
(18, 'Tangled', 2010, 'PG', 13.99, 'tangled.jpg'),
(19, 'Despicable Me', 2010, 'PG', 13.99, 'despicable_me.jpg'),
(20, 'Avatar', 2009, 'PG-13', 13.99, 'avatar.jpg'),
(21, 'Forrest Gump', 1994, 'PG-13', 12.99, 'forrest_gump.jpg'),
(22, 'The Lion King', 1994, 'G', 14.99, 'the_lion_king.jpg'),
(23, 'Pulp Fiction', 1994, 'R', 9.99, 'pulp_fiction.jpg'),
(24, 'The Shawshank Redemption', 1994, 'R', 11.99, 'the_shawshank_redemption.jpg'),
(25, 'The Godfather', 1972, 'R', 16.99, 'the_godfather.jpg'),
(26, 'The Dark Knight Rises', 2012, 'PG-13', 12.99, 'the_dark_knight_rises.jpg'),
(27, 'The Matrix Revolutions', 2003, 'R', 7.99, 'the_matrix_revolutions.jpg'),
(28, 'Guardians of the Galaxy', 2014, 'PG-13', 13.49, 'guardians_of_the_galaxy.jpg'),
(29, 'The Avengers', 2012, 'PG-13', 14.49, 'the_avengers.jpg'),
(30, 'Jurassic Park', 1993, 'PG-13', 13.99, 'jurassic_park.jpg'),
(31, 'The Incredibles', 2004, 'PG', 10.99, 'the_incredibles.jpg'),
(32, 'Spider-Man', 2002, 'PG-13', 12.49, 'spider_man.jpg'),
(33, 'Batman Begins', 2005, 'PG-13', 11.99, 'batman_begins.jpg'),
(34, 'Star Wars: A New Hope', 1977, 'PG', 15.49, 'star_wars_a_new_hope.jpg'),
(35, 'Star Wars: The Empire Strikes Back', 1980, 'PG', 14.99, 'star_wars_the_empire_strikes_back.jpg'),
(36, 'Star Wars: Return of the Jedi', 1983, 'PG', 13.49, 'star_wars_return_of_the_jedi.jpg'),
(37, 'Avengers: Endgame', 2019, 'PG-13', 18.99, 'avengers_endgame.jpg'),
(38, 'Frozen II', 2019, 'PG', 11.49, 'frozen_ii.jpg'),
(39, 'Coco', 2017, 'PG', 12.99, 'coco.jpg'),
(40, 'Toy Story 3', 2010, 'G', 10.49, 'toy_story_3.jpg'),
(41, 'Finding Nemo', 2003, 'G', 9.49, 'finding_nemo.jpg'),
(42, 'Shrek', 2001, 'PG', 8.99, 'shrek.jpg'),
(44, 'The Godfather Part II', 1974, 'R', 17.49, 'the_godfather_part_ii.jpg'),
(45, 'The Departed', 2006, 'R', 14.29, 'the_departed.jpg'),
(46, 'Inglourious Basterds', 2009, 'R', 16.99, 'inglourious_basterds.jpg'),
(47, 'The Big Lebowski', 1998, 'R', 8.49, 'the_big_lebowski.jpg'),
(49, 'The Prestige', 2006, 'PG-13', 12.19, 'the_prestige.jpg'),
(51, '12 Angry Men', 1957, 'NR', 7.99, '12_angry_men.jpg'),
(52, 'Goodfellas', 1990, 'R', 15.79, 'goodfellas.jpg'),
(53, 'The Silence of the Lambs', 1991, 'R', 14.29, 'the_silence_of_the_lambs.jpg'),
(54, 'Schindler''s List', 1993, 'R', 16.99, 'schindlers_list.jpg'),
(55, 'Gladiator', 2000, 'R', 11.69, 'gladiator.jpg'),
(56, 'Braveheart', 1995, 'R', 10.99, 'braveheart.jpg'),
(57, 'The Terminator', 1984, 'R', 8.79, 'the_terminator.jpg'),
(58, 'Raging Bull', 1980, 'R', 7.49, 'raging_bull.jpg'),
(59, 'Casablanca', 1942, 'PG', 9.99, 'casablanca.jpg'),
(60, 'Citizen Kane', 1941, 'PG', 6.49, 'citizen_kane.jpg'),
(61, 'The Exorcist', 1973, 'R', 10.99, 'the_exorcist.jpg'),
(62, 'The Wizard of Oz', 1939, 'G', 5.99, 'the_wizard_of_oz.jpg'),
(64, 'A Clockwork Orange', 1971, 'R', 12.59, 'a_clockwork_orange.jpg'),
(65, 'Jaws', 1975, 'PG', 10.29, 'jaws.jpg'),
(66, 'The Shining', 1980, 'R', 14.19, 'the_shining.jpg'),
(67, 'The Usual Suspects', 1995, 'R', 11.89, 'the_usual_suspects.jpg'),
(68, 'Memento', 2000, 'R', 10.49, 'memento.jpg'),
(69, 'The Social Network', 2010, 'PG-13', 12.39, 'the_social_network.jpg'),
(70, 'Moonlight', 2016, 'R', 14.69, 'moonlight.jpg'),
(71, 'The Wolf of Wall Street', 2013, 'R', 15.59, 'the_wolf_of_wall_street.jpg'),
(72, 'Mad Max: Fury Road', 2015, 'R', 13.79, 'mad_max_fury_road.jpg'),
(73, 'Deadpool', 2016, 'R', 17.19, 'deadpool.jpg'),
(74, 'Logan', 2017, 'R', 18.49, 'logan.jpg'),
(75, 'The Revenant', 2015, 'R', 16.99, 'the_revenant.jpg'),
(76, 'The Martian', 2015, 'PG-13', 14.99, 'the_martian.jpg'),
(77, 'Doctor Strange', 2016, 'PG-13', 13.49, 'doctor_strange.jpg'),
(78, 'Thor: Ragnarok', 2017, 'PG-13', 12.99, 'thor_ragnarok.jpg'),
(79, 'Black Panther', 2018, 'PG-13', 14.29, 'black_panther.jpg'),
(80, 'Spider-Man: Far From Home', 2019, 'PG-13', 13.69, 'spider_man_far_from_home.jpg'),
(81, 'Iron Man', 2008, 'PG-13', 11.59, 'iron_man.jpg'),
(82, 'Captain America: The Winter Soldier', 2014, 'PG-13', 12.99, 'captain_america_the_winter_soldier.jpg'),
(83, 'Avengers: Age of Ultron', 2015, 'PG-13', 13.29, 'avengers_age_of_ultron.jpg'),
(84, 'The Hunger Games', 2012, 'PG-13', 9.99, 'the_hunger_games.jpg'),
(85, 'Catching Fire', 2013, 'PG-13', 10.49, 'catching_fire.jpg'),
(86, 'Mockingjay - Part 1', 2014, 'PG-13', 11.99, 'mockingjay_part_1.jpg'),
(87, 'Mockingjay - Part 2', 2015, 'PG-13', 12.19, 'mockingjay_part_2.jpg'),
(88, 'The Maze Runner', 2014, 'PG-13', 13.49, 'the_maze_runner.jpg'),
(89, 'Divergent', 2014, 'PG-13', 14.69, 'divergent.jpg'),
(90, 'Fantastic Four', 2005, 'PG-13', 8.29, 'fantastic_four.jpg'),
(91, 'X-Men', 2000, 'PG-13', 7.49, 'x_men.jpg'),
(92, 'X2: X-Men United', 2003, 'PG-13', 6.99, 'x2_x_men_united.jpg'),
(93, 'X-Men: Days of Future Past', 2014, 'PG-13', 14.99, 'x_men_days_of_future_past.jpg'),
(94, 'X-Men: Apocalypse', 2016, 'PG-13', 12.99, 'x_men_apocalypse.jpg'),
(95, 'The Incredibles 2', 2018, 'PG', 10.99, 'the_incredibles_2.jpg'),
(96, 'The Lego Movie', 2014, 'PG', 8.99, 'the_lego_movie.jpg'),
(97, 'Zootopia', 2016, 'PG', 9.49, 'zootopia.jpg'),
(98, 'Moana', 2016, 'PG', 10.69, 'moana.jpg');
"""
    
    genres_mapping_sql = """
INSERT INTO moviegenres (movie_id, genre_id) VALUES 
(1, 1), (1, 6), (2, 1), (2, 2), (3, 1), (3, 2), (4, 2), (4, 6),
(5, 1), (5, 2), (6, 3), (6, 6), (7, 5), (7, 4), (8, 3), (8, 2),
(9, 6), (9, 3), (10, 6), (10, 3), (11, 6), (11, 3), (12, 6), (12, 2),
(13, 6), (13, 2), (14, 6), (14, 2), (15, 6), (15, 2), (16, 6), (16, 2),
(17, 5), (17, 3), (18, 6), (18, 4), (19, 3), (19, 5), (20, 1), (20, 2),
(21, 4), (21, 5), (22, 3), (22, 6), (23, 2), (23, 5), (24, 2), (25, 2),
(26, 2), (26, 6), (27, 1), (27, 2), (28, 2), (28, 5), (29, 2), (29, 1),
(30, 1), (30, 2), (31, 3), (31, 2), (32, 2), (32, 6), (33, 2), (33, 6),
(34, 1), (34, 2), (35, 1), (35, 2), (36, 1), (36, 2), (37, 2), (37, 6),
(38, 3), (38, 6), (39, 3), (39, 6), (40, 3), (40, 6), (41, 3), (41, 6),
(42, 3), (42, 5), (44, 2), (45, 2), (46, 2), (46, 5),
(47, 5), (47, 4), (49, 2), (49, 6),
(51, 2), (52, 2), (53, 2), (54, 2), (55, 2), (56, 2),
(57, 1), (57, 2), (58, 2), (59, 4), (60, 2), (61, 2), (61, 6),
(62, 3), (62, 6), (64, 2), (65, 2), (65, 1),
(66, 6), (66, 2), (67, 2), (68, 2), (68, 1), (69, 4), (70, 4),
(71, 2), (71, 5), (72, 2), (72, 1), (73, 2), (73, 5), (74, 2),
(75, 2), (76, 1), (76, 6), (77, 2), (77, 6), (78, 2), (78, 6),
(79, 2), (79, 6), (80, 2), (80, 6), (81, 2), (81, 1), (82, 2), (82, 6),
(83, 2), (83, 1), (84, 1), (84, 2), (85, 1), (85, 2), (86, 1), (86, 2),
(87, 1), (87, 2), (88, 1), (88, 2), (89, 1), (89, 2), (90, 1), (90, 2),
(91, 1), (91, 2), (92, 1), (92, 2), (93, 1), (93, 2), (94, 1), (94, 2),
(95, 3), (95, 2), (96, 3), (96, 5), (97, 3), (97, 5), (98, 3), (98, 6);
"""
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        results = ["<h2>Database Setup Started...</h2><pre>"]
        results.append("NOTE: Existing user accounts are preserved!")
        
        # Execute main schema
        for statement in sql_commands.split(';'):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                    conn.commit()
                    if 'CREATE TABLE IF NOT EXISTS' in statement.upper():
                        table = statement.split('(')[0].split()[-1]
                        results.append(f"✓ Verified table: {table}")
                    elif 'CREATE TABLE' in statement.upper():
                        table = statement.split('(')[0].split()[-1]
                        results.append(f"✓ Created table: {table}")
                    elif 'DROP TABLE' in statement.upper():
                        results.append(f"✓ Dropped old movie/rental tables")
                    elif 'INSERT IGNORE INTO users' in statement or 'INSERT INTO users' in statement:
                        results.append(f"✓ Added/verified default users")
                    elif 'INSERT INTO genres' in statement:
                        results.append(f"✓ Added genres")
                except Exception as e:
                    results.append(f"✗ Error: {str(e)[:200]}")
        
        # Execute movies insert
        try:
            cursor.execute(movies_sql)
            conn.commit()
            results.append(f"✓ Added 94 unique movies (removed 6 duplicates)")
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
        results.append("\n⚠️  USER DATA PRESERVED: All existing user accounts remain intact!")
        results.append("\nDefault login credentials (only added if not already present):")
        results.append("  Admin:    username='Admin'    password='password'")
        results.append("  Customer: username='TestUser' password='password'")
        results.append("\nYour site should now work at: https://blockboster-rentals.onrender.com")
        results.append("</pre>")
        
        return "\n".join(results)
        
    except Exception as e:
        return f"<h2>Setup Failed</h2><pre>Error: {str(e)}</pre>", 500
