-- Create database if not exists
CREATE DATABASE IF NOT EXISTS inventure_db;
USE inventure_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- 2. Startups Table
CREATE TABLE IF NOT EXISTS startups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    founder_id INT NOT NULL,
    industry VARCHAR(100) NOT NULL,
    stage VARCHAR(50) NOT NULL,
    funding_needed DECIMAL(15, 2) NOT NULL,
    description TEXT,
    cash DECIMAL(15, 2) NOT NULL,
    revenue DECIMAL(15, 2) NOT NULL,
    expenses DECIMAL(15, 2) NOT NULL,
    progress INT DEFAULT 0,
    at_risk BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Cap Table Table (Shareholders)
CREATE TABLE IF NOT EXISTS cap_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    startup_id INT NOT NULL,
    stakeholder_name VARCHAR(255) NOT NULL,
    shares INT NOT NULL,
    is_founder BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
);

-- 4. Pitch Feedbacks Table
CREATE TABLE IF NOT EXISTS feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    startup_id INT NOT NULL,
    rater_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
);

-- 5. Investor Preferences Table
CREATE TABLE IF NOT EXISTS investor_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    industry VARCHAR(100) DEFAULT 'Any',
    stage VARCHAR(50) DEFAULT 'Any',
    min_capital DECIMAL(15, 2) DEFAULT 0,
    max_capital DECIMAL(15, 2) DEFAULT 10000000,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Shortlists / Bookmark Pipeline Table
CREATE TABLE IF NOT EXISTS shortlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investor_id INT NOT NULL,
    startup_id INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'shortlisted' or 'interested'
    FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (investor_id, startup_id, type)
);

-- Insert Demo Users (Password: password123, encrypted using bcrypt)
-- Hashed password representation for 'password123': $2a$10$3y6QyJg7t63rOchJ9f6j9OlL1nsw.D8J8Fk71f654yC3vUu8Wb.Fm
INSERT INTO users (id, name, email, password, role) VALUES
(1, 'Rajesh Kumar', 'admin@incubator.com', '$2a$10$3y6QyJg7t63rOchJ9f6j9OlL1nsw.D8J8Fk71f654yC3vUu8Wb.Fm', 'admin'),
(2, 'Ananya Sharma', 'ananya@startup.com', '$2a$10$3y6QyJg7t63rOchJ9f6j9OlL1nsw.D8J8Fk71f654yC3vUu8Wb.Fm', 'founder'),
(3, 'Priya Patel', 'priya@invest.com', '$2a$10$3y6QyJg7t63rOchJ9f6j9OlL1nsw.D8J8Fk71f654yC3vUu8Wb.Fm', 'investor'),
(4, 'Rohan Gupta', 'rohan@startup.com', '$2a$10$3y6QyJg7t63rOchJ9f6j9OlL1nsw.D8J8Fk71f654yC3vUu8Wb.Fm', 'founder')
ON DUPLICATE KEY UPDATE id=id;

-- Insert Mock Startups
INSERT INTO startups (id, name, founder_id, industry, stage, funding_needed, description, cash, revenue, expenses, progress, at_risk) VALUES
(1, 'GreenHarvest', 2, 'AgriTech', 'Idea', 2000000.00, 'AgriTech automated vertical farming with AI-powered analytics to optimize crop yield and conserve water.', 300000.00, 20000.00, 80000.00, 45, TRUE),
(2, 'AirAware AI', 2, 'GovTech', 'Idea', 1500000.00, 'Air quality predictive modeling systems for municipal environmental agencies using distributed low-power IoT sensors.', 120000.00, 5000.00, 35000.00, 10, TRUE),
(3, 'EduTech Pro', 4, 'EdTech', 'MVP', 5000000.00, 'AI-powered personalized tutoring platform that integrates into K-12 learning systems to support teachers.', 1200000.00, 100000.00, 150000.00, 65, FALSE)
ON DUPLICATE KEY UPDATE id=id;

-- Insert Mock Cap Table
INSERT INTO cap_table (startup_id, stakeholder_name, shares, is_founder) VALUES
(1, 'Ananya Sharma', 600000, TRUE),
(1, 'Aarav Mehta', 300000, TRUE),
(1, 'Existing Employees', 100000, FALSE),
(2, 'Ananya Sharma', 800000, TRUE),
(2, 'Technical Co-founder', 200000, TRUE),
(3, 'Rohan Gupta', 700000, TRUE),
(3, 'Angel Investor', 150000, FALSE),
(3, 'Employee Option Pool', 150000, FALSE);

-- Insert Mock Feedbacks
INSERT INTO feedbacks (startup_id, rater_name, rating, category, comment) VALUES
(3, 'Priya Patel', 4, 'Product', 'Excellent technical progress on the pilot deployment. Needs scaling checks.'),
(3, 'Rajesh Kumar', 3, 'Market', 'Market competition is high. Ensure IP protection is solid.'),
(1, 'Priya Patel', 4, 'Team', 'Strong agronomics expertise in the co-founding team.');

-- Insert Mock Investor Preferences
INSERT INTO investor_preferences (user_id, industry, stage, min_capital, max_capital) VALUES
(3, 'AgriTech', 'Idea', 500000.00, 3000000.00);

-- Insert Mock Shortlist
INSERT INTO shortlists (investor_id, startup_id, type) VALUES
(3, 3, 'shortlisted'),
(3, 1, 'interested');
