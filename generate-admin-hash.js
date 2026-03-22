// Generate bcrypt hash using the same library as the API
const bcryptjs = require('bcryptjs');

const password = 'admin123';
const rounds = 10;

// Generate hash synchronously
const hash = bcryptjs.hashSync(password, rounds);
console.log('\n=== BCRYPTJS HASH GENERATOR ===');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nCopy the hash above and use in SQL from below:\n');

// Verify it works
const isValid = bcryptjs.compareSync(password, hash);
console.log('Hash verification:', isValid ? '✓ VALID' : '✗ INVALID');

console.log('\n=== SQL TO RUN IN NEON ===');
console.log(`
DELETE FROM users WHERE email = 'admin@vidyamark.com';

INSERT INTO users (email, password, first_name, last_name, role, school_id, status, is_active)
VALUES (
  'admin@vidyamark.com',
  '${hash}',
  'VidyaMark',
  'Admin',
  'main_admin',
  NULL,
  'active',
  true
);

SELECT id, email, role FROM users WHERE email = 'admin@vidyamark.com';
`);
