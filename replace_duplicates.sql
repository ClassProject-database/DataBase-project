-- Replace duplicate movies with new unique movies

-- Delete the duplicate entries first
DELETE FROM movies WHERE movie_id IN (43, 48, 50, 63, 99, 100);

-- Insert 6 new unique movies
INSERT INTO `movies` (`movie_id`, `title`, `release_year`, `rating`, `price`, `image_path`, `description`, `trailer_url`) VALUES
(43, 'The Princess Bride', 1987, 'PG', '9.99', 'the_princess_bride.jpg', 'A classic fairy tale adventure about true love and high adventure.', 'https://www.youtube.com/watch?v=O3CIXEAjcc8'),
(48, 'Back to the Future', 1985, 'PG', '11.99', 'back_to_the_future.jpg', 'A teenager is accidentally sent thirty years into the past in a time-traveling DeLorean.', 'https://www.youtube.com/watch?v=qvsgGtivCgs'),
(50, 'The Breakfast Club', 1985, 'R', '8.99', 'the_breakfast_club.jpg', 'Five high school students meet in Saturday detention and discover they have a lot more in common than they thought.', 'https://www.youtube.com/watch?v=BSXBvor47Zs'),
(63, 'Toy Story', 1995, 'G', '9.49', 'toy_story.jpg', 'A cowboy doll is profoundly threatened when a new spaceman figure supplants him as top toy in a boy\'s room.', 'https://www.youtube.com/watch?v=v-PjgYDrg70'),
(99, 'Up', 2009, 'PG', '10.99', 'up.jpg', 'An elderly man ties thousands of balloons to his house and flies to South America.', 'https://www.youtube.com/watch?v=ORFWdXl_zJ4'),
(100, 'WALL-E', 2008, 'G', '10.49', 'wall_e.jpg', 'In the distant future, a small waste-collecting robot inadvertently embarks on a space journey.', 'https://www.youtube.com/watch?v=CZ1CATNbXg0');

-- Update genre associations for the new movies
-- Delete old genre associations for these IDs
DELETE FROM moviegenres WHERE movie_id IN (43, 48, 50, 63, 99, 100);

-- Add new genre associations
-- The Princess Bride (43): Fantasy, Romance, Comedy
INSERT INTO moviegenres (movie_id, genre_id) VALUES (43, 6); -- Fantasy
INSERT INTO moviegenres (movie_id, genre_id) VALUES (43, 4); -- Romance
INSERT INTO moviegenres (movie_id, genre_id) VALUES (43, 5); -- Comedy

-- Back to the Future (48): Sci-Fi, Comedy
INSERT INTO moviegenres (movie_id, genre_id) VALUES (48, 1); -- Sci-Fi
INSERT INTO moviegenres (movie_id, genre_id) VALUES (48, 5); -- Comedy

-- The Breakfast Club (50): Romance, Comedy
INSERT INTO moviegenres (movie_id, genre_id) VALUES (50, 4); -- Romance
INSERT INTO moviegenres (movie_id, genre_id) VALUES (50, 5); -- Comedy

-- Toy Story (63): Family, Comedy
INSERT INTO moviegenres (movie_id, genre_id) VALUES (63, 3); -- Family
INSERT INTO moviegenres (movie_id, genre_id) VALUES (63, 5); -- Comedy

-- Up (99): Family, Fantasy
INSERT INTO moviegenres (movie_id, genre_id) VALUES (99, 3); -- Family
INSERT INTO moviegenres (movie_id, genre_id) VALUES (99, 6); -- Fantasy

-- WALL-E (100): Family, Sci-Fi
INSERT INTO moviegenres (movie_id, genre_id) VALUES (100, 3); -- Family
INSERT INTO moviegenres (movie_id, genre_id) VALUES (100, 1); -- Sci-Fi
