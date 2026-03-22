-- Migration: Add user management and registration requests

-- ===========================
-- ALTER USERS TABLE
-- ===========================
-- Add subject field for teachers
ALTER TABLE users ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(id);

-- Add status field (active, pending, rejected, inactive)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Add created_by field to track who created the user
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add role ENUM for better control
-- Note: If role column exists, ensure it includes 'main_admin', 'school_admin', 'teacher'

-- ===========================
-- CREATE USER REQUESTS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS user_requests (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'teacher', -- 'school_admin', 'teacher'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email)
);

-- ===========================
-- CREATE INDEXES
-- ===========================
CREATE INDEX IF NOT EXISTS idx_user_requests_status ON user_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_requests_school_id ON user_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
