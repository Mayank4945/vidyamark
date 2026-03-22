-- Initialize Main Admin Account
-- Run this script after migration-add-user-requests.sql

-- First, ensure the main admin account exists
INSERT INTO users (email, password, first_name, last_name, role, school_id, status, is_active)
VALUES (
  'admin@vidyamark.com',
  '$2a$10$bL77YWj5bqkTqPjMYhYzSuH5S8OqRVjPF/OYgPfKlP1.iDlvvS.gC', -- bcrypt hash of 'admin123'
  'VidyaMark',
  'Admin',
  'main_admin',
  NULL,
  'active',
  true
)
ON CONFLICT (email) DO UPDATE SET
  updated_at = CURRENT_TIMESTAMP;

-- Verify insertion
SELECT id, email, role, status FROM users WHERE email = 'admin@vidyamark.com';
