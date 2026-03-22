-- Initialize Main Admin Account
-- Email: admin@vidyamark.com
-- Password: admin123
-- Bcrypt hash: $2a$10$EIx.OHrQ1SZKvJZu3bZuB.nKKCM6eVLQ6HvC1KCGHoKX.Rq.M9j2K

DELETE FROM users WHERE email = 'admin@vidyamark.com';

INSERT INTO users (email, password, first_name, last_name, role, school_id, status, is_active)
VALUES (
  'admin@vidyamark.com',
  '$2a$10$EIx.OHrQ1SZKvJZu3bZuB.nKKCM6eVLQ6HvC1KCGHoKX.Rq.M9j2K',
  'VidyaMark',
  'Admin',
  'main_admin',
  NULL,
  'active',
  true
);

-- Verify insertion
SELECT id, email, role, status, is_active FROM users WHERE email = 'admin@vidyamark.com';
