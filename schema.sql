-- ============================================
-- Startup Incubator Management System
-- SQLite Database Schema
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Startups table
CREATE TABLE IF NOT EXISTS startups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Idea',
  progress INTEGER DEFAULT 0,
  description TEXT,
  funding_needed REAL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  founder_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  startup_id INTEGER NOT NULL,
  admin_id INTEGER NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  category TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  startup_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
);

-- Investor preferences table
CREATE TABLE IF NOT EXISTS investor_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investor_id INTEGER NOT NULL UNIQUE,
  industry TEXT,
  stage TEXT,
  min_investment REAL DEFAULT 0,
  max_investment REAL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Interests table
CREATE TABLE IF NOT EXISTS interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investor_id INTEGER NOT NULL,
  startup_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(investor_id, startup_id),
  FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
);

-- Shortlists table
CREATE TABLE IF NOT EXISTS shortlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investor_id INTEGER NOT NULL,
  startup_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(investor_id, startup_id),
  FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
);

-- Startup Metrics table
CREATE TABLE IF NOT EXISTS startup_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  startup_id INTEGER NOT NULL,
  mrr REAL DEFAULT 0,
  burn REAL DEFAULT 0,
  users INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  marketing_spend REAL DEFAULT 0,
  salaries REAL DEFAULT 0,
  other_expenses REAL DEFAULT 0,
  cash_on_hand REAL DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
);

-- ============================================
-- SAMPLE DATA
-- ============================================

INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@incubator.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Alice Founder', 'alice@startup.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'founder'),
('Bob Founder', 'bob@startup.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'founder'),
('Carol Investor', 'carol@invest.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'investor'),
('Dave Investor', 'dave@invest.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'investor');

INSERT INTO startups (name, industry, stage, progress, description, funding_needed, founder_id) VALUES
('EduTech Pro', 'EdTech', 'MVP', 65, 'AI-powered personalized learning platform for K-12 students.', 5000000, 2),
('GreenHarvest', 'AgriTech', 'Idea', 20, 'Smart farming solutions using IoT sensors and data analytics.', 2000000, 3),
('MediTrack', 'HealthTech', 'Funding', 85, 'Digital health record management for rural clinics.', 10000000, 2);

INSERT INTO feedback (startup_id, admin_id, rating, category, comment) VALUES
(1, 1, 4, 'Product', 'Strong product roadmap, needs better UX.'),
(1, 1, 3, 'Market', 'Good market size but competition is high.'),
(2, 1, 2, 'Finance', 'Burn rate is too high for current stage.'),
(3, 1, 5, 'Product', 'Excellent execution and clear product vision.');

INSERT INTO investor_preferences (investor_id, industry, stage, min_investment, max_investment) VALUES
(4, 'EdTech', 'MVP', 1000000, 8000000),
(5, 'HealthTech', 'Funding', 5000000, 20000000);
