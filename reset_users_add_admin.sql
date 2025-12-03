-- Reset Users and Add Manager Account
-- WARNING: This will delete ALL users from the database

-- Disable foreign key checks to avoid constraint errors
SET FOREIGN_KEY_CHECKS = 0;

-- Delete all rentals (depends on users)
DELETE FROM rentals;

-- Delete all reviews (depends on users)
DELETE FROM reviews;

-- Delete all customers (depends on users)
DELETE FROM customers;

-- Delete all employees (depends on users)
DELETE FROM employees;

-- Delete all users
DELETE FROM users;

-- Reset auto-increment counter for account_id back to 1
ALTER TABLE users AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Add Manager Account with Full Administrative Access
-- Username: admin
-- Password: SamWinchester1225 (hashed with bcrypt)
-- Role: manager (highest role with full permissions)

INSERT INTO users (username, password_, role, first_name, last_name, email, phone)
VALUES (
    'admin',
    '$2b$12$BHXTuIklQI/2Jc5gJaAZEu7RYW8pr.2aBdQsuGz0kjwUBTNSg0dma',  -- bcrypt hash of 'SamWinchester1225'
    'manager',
    'System',
    'Administrator',
    'admin@blockbuster.com',
    '555-0000'
);

-- Add to employees table since manager role requires it
INSERT INTO employees (account_id, job_title, salary)
SELECT account_id, 'System Administrator', 999999.99
FROM users 
WHERE username = 'admin';

-- Verify the manager account was created
SELECT 
    account_id,
    username,
    role,
    first_name,
    last_name,
    email
FROM users
WHERE username = 'admin';
